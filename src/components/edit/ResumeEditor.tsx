"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/LocaleProvider";
import {
  captureOriginalIfMissing,
  clearEditDraft,
  otherLocales,
  resumesEqual,
  setOriginal,
  writeEditDraft,
} from "@/lib/edit-draft";
import type { Resume } from "@/lib/resume-schema";
import { ConfirmModal } from "@/components/edit/ConfirmModal";
import { EditSectionNav } from "@/components/edit/EditSectionNav";
import { JsonDrivenForm } from "@/components/edit/JsonDrivenForm";
import { OtherLanguagesModal } from "@/components/edit/OtherLanguagesModal";
import { GhostButton } from "@/components/edit/form-ui";

type ResumeEditorProps = {
  initialData: Resume;
  locale: Locale;
  canPersist: boolean;
};

function downloadJson(data: Resume, locale: Locale) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `resume.${locale}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function fetchLocaleResume(locale: Locale): Promise<Resume> {
  const response = await fetch(`/api/resume?locale=${locale}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    data?: Resume;
    error?: string;
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? `Failed to load resume (${locale})`);
  }
  return payload.data;
}

export function ResumeEditor({
  initialData,
  locale,
  canPersist,
}: ResumeEditorProps) {
  const router = useRouter();
  const t = useTranslations();
  const [data, setData] = useState<Resume>(initialData);
  /** Frozen copy of the resume as loaded — before any edits this session. */
  const [preEditOriginal] = useState<Resume>(() => structuredClone(initialData));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSaveThisOnlyConfirm, setShowSaveThisOnlyConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  const isDirty = !resumesEqual(data, preEditOriginal);

  useEffect(() => {
    captureOriginalIfMissing(locale, preEditOriginal);
  }, [locale, preEditOriginal]);

  const availableOthers = useMemo(
    () => otherLocales(locale, locales),
    [locale],
  );

  const persistenceHint = canPersist
    ? t.edit.persistenceReady
    : t.edit.persistenceUnavailable;

  function logout() {
    startTransition(async () => {
      clearEditDraft();
      await fetch("/api/edit-auth", { method: "DELETE" });
      router.refresh();
    });
  }

  async function persistLocales(drafts: Partial<Record<Locale, Resume>>) {
    const response = await fetch("/api/resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drafts }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      persisted?: boolean;
      drafts?: Partial<Record<Locale, Resume>>;
      data?: Resume;
    };

    if (!response.ok) {
      throw Object.assign(new Error(payload.error ?? "Save failed"), {
        status: response.status,
      });
    }

    return payload;
  }

  function requestSaveThisLocaleOnly() {
    setShowSaveThisOnlyConfirm(true);
  }

  function saveThisLocaleOnly() {
    setError(null);
    setStatus(null);
    setShowOtherModal(false);
    setShowSaveThisOnlyConfirm(false);

    startTransition(async () => {
      try {
        clearEditDraft();
        const payload = await persistLocales({ [locale]: data });

        if (payload.data) {
          setData(payload.data);
        } else if (payload.drafts?.[locale]) {
          setData(payload.drafts[locale]!);
        }

        setStatus(payload.message ?? t.edit.published);

        if (!payload.persisted) {
          downloadJson(payload.data ?? data, locale);
        }

        // Full navigation so `/` re-fetches resume (soft nav keeps stale RSC cache).
        window.location.assign("/");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        setError(message);
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          err.status === 401
        ) {
          router.refresh();
        }
      }
    });
  }

  function beginOtherLanguages(selected: Locale[]) {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        const drafts: Partial<Record<Locale, Resume>> = {
          [locale]: data,
        };

        await Promise.all(
          selected.map(async (target) => {
            drafts[target] = await fetchLocaleResume(target);
          }),
        );

        const [currentLocale, ...queue] = selected;
        // Persist the pre-edit source snapshot for review-page change marks.
        setOriginal(locale, preEditOriginal);
        writeEditDraft({
          sourceLocale: locale,
          drafts,
          queue,
          currentLocale,
        });

        setShowOtherModal(false);
        router.push("/edit/review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function onSaveClick() {
    setError(null);
    setStatus(null);

    if (!isDirty) {
      return;
    }

    if (availableOthers.length === 0) {
      requestSaveThisLocaleOnly();
      return;
    }

    setShowOtherModal(true);
  }

  function onBackClick() {
    if (!isDirty) {
      window.location.assign("/");
      return;
    }
    setShowLeaveConfirm(true);
  }

  function confirmLeave() {
    clearEditDraft();
    setShowLeaveConfirm(false);
    window.location.assign("/");
  }

  const saveButton = (
    <button
      type="button"
      disabled={pending}
      onClick={onSaveClick}
      className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] transition-[opacity,transform] enabled:hover:bg-[var(--accent-bright)] enabled:active:scale-[0.98] disabled:opacity-40"
    >
      {pending ? t.edit.saving : t.edit.save}
    </button>
  );

  return (
    <div className="relative mx-auto max-w-3xl space-y-8 px-6 py-12 sm:px-10 lg:px-0 xl:max-w-3xl">
      <EditSectionNav onBack={onBackClick} />

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] uppercase">
              {t.edit.eyebrow}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
              {t.edit.title}
            </h1>
            <p className="font-mono text-xs text-[var(--muted)]">
              {t.edit.editingLocale}: {localeMeta[locale].label} (
              {localeMeta[locale].nativeLabel})
            </p>
          </div>
          {saveButton}
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {t.edit.blurbPrefix}{" "}
          <code className="font-mono text-[var(--accent)]">src/data/edit-form.json</code>
          {t.edit.blurbSuffix}
        </p>
        <p className="text-xs text-[var(--muted)]">{persistenceHint}</p>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
        >
          {t.edit.lockEditor}
        </button>
      </header>

      <JsonDrivenForm data={data} onChange={setData} />

      <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          {saveButton}
          <GhostButton onClick={() => downloadJson(data, locale)}>
            {t.edit.downloadJson}
          </GhostButton>
          <GhostButton
            onClick={() => {
              startTransition(async () => {
                try {
                  const response = await fetch("/api/resume/pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  if (!response.ok) {
                    const payload = (await response.json()) as { error?: string };
                    setError(payload.error ?? "PDF generation failed");
                    return;
                  }
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank", "noopener,noreferrer");
                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "PDF generation failed",
                  );
                }
              });
            }}
          >
            {t.edit.previewPdf}
          </GhostButton>
          {status ? (
            <p className="text-sm text-[var(--accent)]">{status}</p>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </div>

      {showOtherModal ? (
        <OtherLanguagesModal
          options={availableOthers}
          pending={pending}
          onContinue={beginOtherLanguages}
          onSaveThisOnly={requestSaveThisLocaleOnly}
          onCancel={() => setShowOtherModal(false)}
        />
      ) : null}

      {showLeaveConfirm ? (
        <ConfirmModal
          title={t.edit.leaveConfirmTitle}
          description={t.edit.leaveConfirmBlurb}
          confirmLabel={t.edit.leaveConfirm}
          cancelLabel={t.edit.leaveStay}
          danger
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      ) : null}

      {showSaveThisOnlyConfirm ? (
        <ConfirmModal
          title={t.edit.saveThisOnlyConfirmTitle}
          description={t.edit.saveThisOnlyConfirmBlurb}
          confirmLabel={
            pending ? t.edit.saving : t.edit.saveThisOnlyConfirm
          }
          cancelLabel={t.edit.cancel}
          pending={pending}
          onConfirm={saveThisLocaleOnly}
          onCancel={() => setShowSaveThisOnlyConfirm(false)}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { localeMeta, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/LocaleProvider";
import {
  clearEditDraft,
  readEditDraft,
  writeEditDraft,
  type EditDraft,
} from "@/lib/edit-draft";
import type { Resume } from "@/lib/resume-schema";
import { JsonDrivenForm } from "@/components/edit/JsonDrivenForm";
import { GhostButton } from "@/components/edit/form-ui";

function downloadDrafts(drafts: Partial<Record<Locale, Resume>>) {
  for (const [locale, data] of Object.entries(drafts)) {
    if (!data) continue;
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
}

export function ResumeReviewEditor() {
  const router = useRouter();
  const t = useTranslations();
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const loaded = readEditDraft();
    // Persist migrated baselines so later edits keep a stable compare snapshot.
    if (loaded) writeEditDraft(loaded);
    setDraft(loaded);
    setHydrated(true);
  }, []);

  const sourceData = draft?.drafts[draft.sourceLocale] ?? null;
  const targetData = draft?.drafts[draft.currentLocale] ?? null;
  const targetBaseline = draft?.baselines[draft.currentLocale] ?? null;

  const queueLabels = useMemo(() => {
    if (!draft) return [];
    return draft.queue.map(
      (locale) => `${localeMeta[locale].label} (${localeMeta[locale].nativeLabel})`,
    );
  }, [draft]);

  function updateTarget(next: Resume) {
    if (!draft) return;
    const updated: EditDraft = {
      ...draft,
      drafts: {
        ...draft.drafts,
        [draft.currentLocale]: next,
      },
    };
    setDraft(updated);
    writeEditDraft(updated);
  }

  function abandon() {
    clearEditDraft();
    setDraft(null);
    router.replace("/edit");
  }

  function publishAll(nextDraft: EditDraft) {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/resume", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drafts: nextDraft.drafts }),
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
          persisted?: boolean;
        };

        if (!response.ok) {
          setError(payload.error ?? "Save failed");
          if (response.status === 401) {
            clearEditDraft();
            router.refresh();
          }
          return;
        }

        if (!payload.persisted) {
          downloadDrafts(nextDraft.drafts);
        }

        clearEditDraft();
        setStatus(payload.message ?? t.edit.published);
        router.replace("/edit");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function continueOrPublish() {
    if (!draft || !targetData) return;

    const withCurrent: EditDraft = {
      ...draft,
      drafts: {
        ...draft.drafts,
        [draft.currentLocale]: targetData,
      },
    };

    if (withCurrent.queue.length === 0) {
      publishAll(withCurrent);
      return;
    }

    const [nextLocale, ...queue] = withCurrent.queue;
    const advanced: EditDraft = {
      ...withCurrent,
      currentLocale: nextLocale,
      queue,
    };
    setDraft(advanced);
    writeEditDraft(advanced);
    setStatus(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-[var(--muted)]">
        {t.common.loadingResume}
      </div>
    );
  }

  if (!draft || !sourceData || !targetData) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-12">
        <p className="text-sm text-[var(--muted)]">{t.edit.noDraft}</p>
        <GhostButton onClick={() => router.replace("/edit")}>
          {t.edit.backToEditor}
        </GhostButton>
      </div>
    );
  }

  const sourceMeta = localeMeta[draft.sourceLocale];
  const targetMeta = localeMeta[draft.currentLocale];
  const isLast = draft.queue.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <header className="shrink-0 space-y-2 pb-4">
        <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] uppercase">
          {t.edit.eyebrow}
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
          {t.edit.reviewTitle}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
          {t.edit.reviewHint}
        </p>
        {queueLabels.length > 0 ? (
          <p className="text-xs text-[var(--muted)]">
            {t.edit.reviewQueue}: {queueLabels.join(" → ")}
          </p>
        ) : null}
        <p className="flex items-center gap-2 text-xs text-red-400">
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            !
          </span>
          {t.edit.fieldChangedLegend}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2 lg:gap-6">
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="shrink-0 border border-[var(--border)] px-4 py-3">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)] uppercase">
              {t.edit.reviewSource}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--fg)]">
              {sourceMeta.label} ({sourceMeta.nativeLabel})
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <JsonDrivenForm data={sourceData} readOnly />
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="shrink-0 border border-[var(--accent)]/40 px-4 py-3">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[var(--accent)] uppercase">
              {t.edit.reviewTarget}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--fg)]">
              {targetMeta.label} ({targetMeta.nativeLabel})
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <JsonDrivenForm
              data={targetData}
              onChange={updateTarget}
              compareAgainst={targetBaseline}
              changedLabel={t.edit.fieldChanged}
              removedItemLabel={t.edit.itemRemoved}
              addedItemLabel={t.edit.itemAdded}
            />
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)] py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={continueOrPublish}
            className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] transition-[opacity,transform] enabled:hover:bg-[var(--accent-bright)] enabled:active:scale-[0.98] disabled:opacity-40"
          >
            {pending
              ? t.edit.saving
              : isLast
                ? t.edit.reviewDone
                : t.edit.reviewNext}
          </button>
          <GhostButton danger onClick={abandon}>
            {t.edit.reviewAbandon}
          </GhostButton>
          {status ? (
            <p className="text-sm text-[var(--accent)]">{status}</p>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

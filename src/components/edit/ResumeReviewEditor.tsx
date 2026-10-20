"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { localeMeta, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/LocaleProvider";
import {
  clearEditDraft,
  getOriginal,
  readEditDraft,
  writeEditDraft,
  type EditDraft,
} from "@/lib/edit-draft";
import type { Resume } from "@/lib/resume-schema";
import { JsonDrivenForm } from "@/components/edit/JsonDrivenForm";
import { LoadingOverlay } from "@/components/edit/LoadingOverlay";
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

function scrollPairedPending(
  targetPane: HTMLElement | null,
  sourcePane: HTMLElement | null,
) {
  if (!targetPane) return;
  // Leaf anchors only: field marks and the order-changed banner.
  // Skip row wrappers that can stay "pending" after a field turns green.
  const pending = targetPane.querySelector<HTMLElement>(
    '[data-review-leaf="true"][data-review-mark="pending"]',
  );
  if (!pending) return;

  const key = pending.dataset.reviewKey;
  pending.scrollIntoView({ behavior: "smooth", block: "center" });

  if (!key || !sourcePane) return;
  const paired =
    sourcePane.querySelector<HTMLElement>(
      `[data-review-pane="source"][data-review-leaf="true"][data-review-key="${CSS.escape(key)}"]`,
    ) ??
    sourcePane.querySelector<HTMLElement>(
      `[data-review-pane="source"][data-review-key="${CSS.escape(key)}"]`,
    );
  paired?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function ResumeReviewEditor() {
  const router = useRouter();
  const t = useTranslations();
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [targetBaselines, setTargetBaselines] = useState<
    Partial<Record<Locale, Resume>>
  >({});
  const sourceScrollRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(readEditDraft());
    setHydrated(true);
  }, []);

  // Freeze target locale as first shown on review — used for red → green.
  useEffect(() => {
    if (!draft) return;
    const locale = draft.currentLocale;
    const data = draft.drafts[locale];
    if (!data) return;
    setTargetBaselines((prev) => {
      if (prev[locale]) return prev;
      const fromOriginal = getOriginal(locale);
      return {
        ...prev,
        [locale]: structuredClone(fromOriginal ?? data),
      };
    });
  }, [draft, hydrated]);

  const sourceData = draft?.drafts[draft.sourceLocale] ?? null;
  const targetData = draft?.drafts[draft.currentLocale] ?? null;
  const targetBaseline =
    draft && targetBaselines[draft.currentLocale]
      ? targetBaselines[draft.currentLocale]!
      : null;

  // Pre-edit snapshot of the source (left) language — frozen when /edit first loaded.
  const sourceOriginal = useMemo(() => {
    if (!draft) return null;
    const snap = getOriginal(draft.sourceLocale);
    return snap ? structuredClone(snap) : null;
  }, [draft?.sourceLocale, hydrated]);

  const sourceDiff =
    sourceData && sourceOriginal
      ? { current: sourceData, original: sourceOriginal }
      : null;

  const queueLabels = useMemo(() => {
    if (!draft) return [];
    return draft.queue.map(
      (locale) => `${localeMeta[locale].label} (${localeMeta[locale].nativeLabel})`,
    );
  }, [draft]);

  function updateTarget(next: Resume) {
    if (!draft) return;
    const updated: EditDraft = {
      sourceLocale: draft.sourceLocale,
      queue: draft.queue,
      currentLocale: draft.currentLocale,
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
        // Brief pause so the success status is readable, then hard-nav home.
        await new Promise((resolve) => setTimeout(resolve, 3000));
        window.location.assign("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function continueOrPublish() {
    if (!draft || !targetData) return;

    const withCurrent: EditDraft = {
      sourceLocale: draft.sourceLocale,
      queue: draft.queue,
      currentLocale: draft.currentLocale,
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
      <LoadingOverlay show={pending} />
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
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-xs text-red-500">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              !
            </span>
            {t.edit.fieldChangedLegend}
          </p>
          <p className="flex items-center gap-2 text-xs text-emerald-500">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              ✓
            </span>
            {t.edit.fieldResolvedLegend}
          </p>
          <div className="ml-auto">
            <GhostButton
              onClick={() =>
                scrollPairedPending(
                  targetScrollRef.current,
                  sourceScrollRef.current,
                )
              }
            >
              {t.edit.scrollToNextPending}
            </GhostButton>
          </div>
        </div>
        {!sourceOriginal ? (
          <p className="text-xs text-amber-400">
            Missing source original — open /edit first, then Save again so
            change marks can work.
          </p>
        ) : null}
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
          <div
            ref={sourceScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          >
            <JsonDrivenForm
              data={sourceData}
              readOnly
              compareAgainst={sourceOriginal}
              reviewPane="source"
              changedLabel={t.edit.fieldChanged}
              resolvedLabel={t.edit.fieldResolved}
              removedItemLabel={t.edit.itemRemoved}
              addedItemLabel={t.edit.itemAdded}
              addedOnSourceLabel={t.edit.itemAddedOnSource}
              orderChangedLabel={t.edit.orderChanged}
              orderResolvedLabel={t.edit.orderResolved}
              applySourceOrderLabel={t.edit.applySourceOrder}
              dragToReorderLabel={t.edit.dragToReorder}
            />
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
          <div
            ref={targetScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          >
            <JsonDrivenForm
              data={targetData}
              onChange={updateTarget}
              sourceDiff={sourceDiff}
              resolveAgainst={targetBaseline}
              reviewPane="target"
              changedLabel={t.edit.fieldChanged}
              resolvedLabel={t.edit.fieldResolved}
              removedItemLabel={t.edit.itemRemoved}
              addedItemLabel={t.edit.itemAdded}
              addedOnSourceLabel={t.edit.itemAddedOnSource}
              orderChangedLabel={t.edit.orderChanged}
              orderResolvedLabel={t.edit.orderResolved}
              applySourceOrderLabel={t.edit.applySourceOrder}
              dragToReorderLabel={t.edit.dragToReorder}
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

import { isLocale, type Locale } from "@/i18n/config";
import {
  normalizeResume,
  resumeSchema,
  type Resume,
} from "@/lib/resume-schema";

/** Session-only staging for multi-locale edit. Never written to disk/Blob/GitHub. */
export const EDIT_DRAFT_STORAGE_KEY = "resume-edit-draft";

export type EditDraft = {
  sourceLocale: Locale;
  /** Staged resume payloads keyed by locale (source + selected targets). */
  drafts: Partial<Record<Locale, Resume>>;
  /**
   * Frozen snapshot of each locale when the review stage began.
   * Used to mark fields the user changed for that language (not cross-locale diffs).
   */
  baselines: Partial<Record<Locale, Resume>>;
  /** Remaining target locales after the current one. */
  queue: Locale[];
  /** Locale currently being edited on the review page. */
  currentLocale: Locale;
};

function isResume(value: unknown): value is Resume {
  return resumeSchema.safeParse(value).success;
}

export function resumesEqual(a: Resume, b: Resume): boolean {
  return (
    JSON.stringify(normalizeResume(a)) === JSON.stringify(normalizeResume(b))
  );
}

/** Deep-clone every staged locale as an immutable review baseline. */
export function snapshotBaselines(
  drafts: Partial<Record<Locale, Resume>>,
): Partial<Record<Locale, Resume>> {
  const baselines: Partial<Record<Locale, Resume>> = {};
  for (const [key, entry] of Object.entries(drafts)) {
    if (!isLocale(key) || !entry) continue;
    baselines[key] = structuredClone(entry);
  }
  return baselines;
}

export function parseEditDraft(raw: unknown): EditDraft | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const sourceLocale =
    typeof value.sourceLocale === "string" ? value.sourceLocale : null;
  const currentLocale =
    typeof value.currentLocale === "string" ? value.currentLocale : null;
  if (!isLocale(sourceLocale) || !isLocale(currentLocale)) {
    return null;
  }

  if (!value.drafts || typeof value.drafts !== "object") return null;

  const drafts: Partial<Record<Locale, Resume>> = {};
  for (const [key, entry] of Object.entries(
    value.drafts as Record<string, unknown>,
  )) {
    if (!isLocale(key) || !isResume(entry)) continue;
    drafts[key] = normalizeResume(entry);
  }

  if (!drafts[sourceLocale]) return null;

  const queue = Array.isArray(value.queue)
    ? value.queue.filter(
        (item): item is Locale => typeof item === "string" && isLocale(item),
      )
    : [];

  const baselines: Partial<Record<Locale, Resume>> = {};
  if (value.baselines && typeof value.baselines === "object") {
    for (const [key, entry] of Object.entries(
      value.baselines as Record<string, unknown>,
    )) {
      if (!isLocale(key) || !isResume(entry)) continue;
      baselines[key] = normalizeResume(entry);
    }
  }

  // Migrate older drafts that predate baselines: freeze whatever is staged now.
  for (const key of Object.keys(drafts) as Locale[]) {
    if (!baselines[key] && drafts[key]) {
      baselines[key] = structuredClone(drafts[key]);
    }
  }

  return {
    sourceLocale,
    drafts,
    baselines,
    queue,
    currentLocale,
  };
}

export function readEditDraft(): EditDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EDIT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return parseEditDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeEditDraft(draft: EditDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EDIT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearEditDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EDIT_DRAFT_STORAGE_KEY);
}

export function otherLocales(sourceLocale: Locale, all: readonly Locale[]): Locale[] {
  return all.filter((locale) => locale !== sourceLocale);
}

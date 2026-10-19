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

  return {
    sourceLocale,
    drafts,
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

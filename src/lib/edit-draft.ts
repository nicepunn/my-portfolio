import { isLocale, type Locale } from "@/i18n/config";
import {
  normalizeResume,
  resumeSchema,
  type Resume,
} from "@/lib/resume-schema";

/** Session-only staging for multi-locale edit. Never written to disk/Blob/GitHub. */
export const EDIT_DRAFT_STORAGE_KEY = "resume-edit-draft";

/**
 * Write-once snapshot of each locale as loaded into the editor — before the user
 * edits. Used on the review page to mark what changed on the source (left) language.
 */
export const EDIT_ORIGINAL_STORAGE_KEY = "resume-edit-originals";

/** @deprecated Kept so clearEditDraft can wipe older sessions. */
export const EDIT_BASELINE_STORAGE_KEY = "resume-edit-baselines";

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

function parseResumes(raw: unknown): Partial<Record<Locale, Resume>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<Locale, Resume>> = {};
  for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!isLocale(key) || !isResume(entry)) continue;
    out[key] = normalizeResume(entry);
  }
  return out;
}

function readOriginals(): Partial<Record<Locale, Resume>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(EDIT_ORIGINAL_STORAGE_KEY);
    if (!raw) return {};
    return parseResumes(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeOriginals(originals: Partial<Record<Locale, Resume>>): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EDIT_ORIGINAL_STORAGE_KEY, JSON.stringify(originals));
}

/** Freeze a locale's pre-edit snapshot once (first load into the editor). */
export function captureOriginalIfMissing(locale: Locale, data: Resume): void {
  const originals = readOriginals();
  if (originals[locale]) return;
  originals[locale] = structuredClone(data);
  writeOriginals(originals);
}

/** Force-set the pre-edit snapshot for a locale (e.g. editor's frozen initialData). */
export function setOriginal(locale: Locale, data: Resume): void {
  const originals = readOriginals();
  originals[locale] = structuredClone(data);
  writeOriginals(originals);
}

export function getOriginal(locale: Locale): Resume | null {
  return readOriginals()[locale] ?? null;
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
  const { sourceLocale, drafts, queue, currentLocale } = draft;
  sessionStorage.setItem(
    EDIT_DRAFT_STORAGE_KEY,
    JSON.stringify({ sourceLocale, drafts, queue, currentLocale }),
  );
}

export function clearEditDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EDIT_DRAFT_STORAGE_KEY);
  sessionStorage.removeItem(EDIT_ORIGINAL_STORAGE_KEY);
  sessionStorage.removeItem(EDIT_BASELINE_STORAGE_KEY);
}

export function otherLocales(sourceLocale: Locale, all: readonly Locale[]): Locale[] {
  return all.filter((locale) => locale !== sourceLocale);
}

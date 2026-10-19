import { isLocale, type Locale } from "@/i18n/config";
import {
  normalizeResume,
  resumeSchema,
  type Resume,
} from "@/lib/resume-schema";

/** Session-only staging for multi-locale edit. Never written to disk/Blob/GitHub. */
export const EDIT_DRAFT_STORAGE_KEY = "resume-edit-draft";

/**
 * Write-once snapshots keyed by locale. Stored separately from the draft so
 * field edits cannot accidentally overwrite the compare baseline.
 */
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

function parseBaselines(raw: unknown): Partial<Record<Locale, Resume>> {
  if (!raw || typeof raw !== "object") return {};
  const baselines: Partial<Record<Locale, Resume>> = {};
  for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!isLocale(key) || !isResume(entry)) continue;
    baselines[key] = normalizeResume(entry);
  }
  return baselines;
}

export function readBaselines(): Partial<Record<Locale, Resume>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(EDIT_BASELINE_STORAGE_KEY);
    if (!raw) return {};
    return parseBaselines(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeBaselines(baselines: Partial<Record<Locale, Resume>>): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EDIT_BASELINE_STORAGE_KEY, JSON.stringify(baselines));
}

/**
 * Freeze each provided locale once. Existing baseline entries are never replaced.
 */
export function ensureBaselines(
  drafts: Partial<Record<Locale, Resume>>,
): Partial<Record<Locale, Resume>> {
  const baselines = readBaselines();
  let changed = false;
  for (const [key, entry] of Object.entries(drafts)) {
    if (!isLocale(key) || !entry) continue;
    if (baselines[key]) continue;
    baselines[key] = structuredClone(entry);
    changed = true;
  }
  if (changed) writeBaselines(baselines);
  return baselines;
}

/** Replace all baselines (used when starting a new multi-locale review flow). */
export function replaceBaselines(
  drafts: Partial<Record<Locale, Resume>>,
): Partial<Record<Locale, Resume>> {
  const baselines: Partial<Record<Locale, Resume>> = {};
  for (const [key, entry] of Object.entries(drafts)) {
    if (!isLocale(key) || !entry) continue;
    baselines[key] = structuredClone(entry);
  }
  writeBaselines(baselines);
  return baselines;
}

export function getBaseline(locale: Locale): Resume | null {
  return readBaselines()[locale] ?? null;
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

  // Migrate legacy drafts that still embed baselines in the same JSON blob.
  if (value.baselines && typeof value.baselines === "object") {
    const embedded = parseBaselines(value.baselines);
    const current = readBaselines();
    const merged = { ...embedded, ...current };
    if (Object.keys(merged).length > 0) {
      writeBaselines(merged);
    }
  }

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
  // Never persist baselines inside the draft blob — edits update drafts only.
  const { sourceLocale, drafts, queue, currentLocale } = draft;
  sessionStorage.setItem(
    EDIT_DRAFT_STORAGE_KEY,
    JSON.stringify({ sourceLocale, drafts, queue, currentLocale }),
  );
}

export function clearEditDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EDIT_DRAFT_STORAGE_KEY);
  sessionStorage.removeItem(EDIT_BASELINE_STORAGE_KEY);
}

export function otherLocales(sourceLocale: Locale, all: readonly Locale[]): Locale[] {
  return all.filter((locale) => locale !== sourceLocale);
}

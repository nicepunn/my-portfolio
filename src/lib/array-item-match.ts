import { skillDisplayLabel } from "@/lib/skill-emphasis";

type ResumeItem = Record<string, unknown>;

/** Minimal row shape needed to pick a cross-locale target partner. */
export type MatchableSourceRow = {
  status: "unchanged" | "changed" | "added" | "removed";
  originalItem: ResumeItem | null;
  currentItem: ResumeItem | null;
};

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry));
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) return 0;
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function skillLabelSet(item: ResumeItem): Set<string> {
  return new Set(
    asStringList(item.items).map((raw) => normalizeText(skillDisplayLabel(raw))),
  );
}

const SECTION_FIELDS: Record<string, string[]> = {
  experience: ["company", "role", "period", "bullets"],
  projects: ["name", "url", "stack", "description"],
  skills: ["label", "items"],
};

/** Fields that usually identify a row. Any one of them can still change. */
const IDENTITY_FIELDS: Record<string, string[]> = {
  experience: ["company", "period"],
  projects: ["name", "url"],
  skills: ["label"],
};

/**
 * A pair is the same item when the fields add up to at least one full match
 * (one exact field, or several partial overlaps). Below that, the row is new
 * or deleted instead of a renamed copy of something else.
 */
export const MIN_MATCH_SCORE = 1;

/** Minimum score required to accept a cross-locale pair for this section. */
export function matchThreshold(_sectionPath: string): number {
  return MIN_MATCH_SCORE;
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function tokens(value: unknown): Set<string> {
  const text = normalizeText(value);
  if (!text) return new Set();
  return new Set(
    text
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 1 || /\d/.test(token)),
  );
}

function textScore(left: unknown, right: unknown): number {
  const a = normalizeText(left).replace(/\/+$/, "");
  const b = normalizeText(right).replace(/\/+$/, "");
  if (!a && !b) return 0;
  if (a && a === b) return 1;
  return jaccard(tokens(left), tokens(right));
}

function listScore(
  sectionPath: string,
  field: string,
  left: unknown,
  right: unknown,
): number {
  const toSet = (value: unknown) => {
    const lines = asStringList(value);
    if (sectionPath === "skills" && field === "items") {
      return new Set(lines.map((line) => normalizeText(skillDisplayLabel(line))));
    }
    return new Set(lines.map((line) => normalizeText(line)).filter(Boolean));
  };
  return jaccard(toSet(left), toSet(right));
}

function fieldsFor(
  sectionPath: string,
  left: ResumeItem,
  right: ResumeItem,
): string[] {
  return (
    SECTION_FIELDS[sectionPath] ?? [
      ...new Set([...Object.keys(left), ...Object.keys(right)]),
    ]
  );
}

type FieldMeasure = {
  score: number;
  agree: number;
  identityAgree: number;
  identityDisagree: number;
};

function measureItems(
  sectionPath: string,
  left: ResumeItem,
  right: ResumeItem,
): FieldMeasure {
  const identity = new Set(IDENTITY_FIELDS[sectionPath] ?? []);
  let score = 0;
  let agree = 0;
  let identityAgree = 0;
  let identityDisagree = 0;
  for (const field of fieldsFor(sectionPath, left, right)) {
    const a = left[field];
    const b = right[field];
    if (isEmptyValue(a) && isEmptyValue(b)) continue;
    const fieldScore =
      Array.isArray(a) || Array.isArray(b)
        ? listScore(sectionPath, field, a, b)
        : textScore(a, b);
    score += fieldScore;
    if (fieldScore === 1) agree += 1;
    if (!identity.has(field)) continue;
    if (fieldScore === 1) identityAgree += 1;
    else if (fieldScore === 0) identityDisagree += 1;
  }
  return { score, agree, identityAgree, identityDisagree };
}

/**
 * Evidence that two items are the same row, summed across every field.
 * An exact field is 1. Partial token or list overlap is between 0 and 1.
 * Empty fields add nothing, so a translated role does not cancel a shared company.
 */
export function scoreCrossLocaleItem(
  sectionPath: string,
  left: ResumeItem | null | undefined,
  right: ResumeItem | null | undefined,
): number {
  if (!left || !right) return 0;
  return measureItems(sectionPath, left, right).score;
}

/**
 * Same-language pair.
 * A row stays the same item when one identity field still matches, or when
 * only a single identity field changed and the other fields still agree.
 * Two identity fields both changing (new company and new period) is a new
 * row plus a deleted row.
 */
function sameItemScore(
  sectionPath: string,
  left: ResumeItem,
  right: ResumeItem,
): number {
  const measured = measureItems(sectionPath, left, right);
  if (measured.score < MIN_MATCH_SCORE || measured.agree < 1) return 0;
  if (measured.identityAgree >= 1) return measured.score;
  if (
    measured.identityDisagree <= 1 &&
    measured.agree >= measured.identityDisagree
  ) {
    return measured.score;
  }
  return 0;
}

export type ItemAssignment = {
  left: number;
  right: number;
  score: number;
};

/**
 * Best global pairing of two lists. A pair is kept only when its score
 * reaches `MIN_MATCH_SCORE`. Unmatched left rows were removed; unmatched
 * right rows were added.
 */
export function assignItemIndexes(
  sectionPath: string,
  leftItems: ResumeItem[],
  rightItems: ResumeItem[],
): ItemAssignment[] {
  const scores = leftItems.map((left) =>
    rightItems.map((right) => sameItemScore(sectionPath, left, right)),
  );
  return assignByScore(scores, MIN_MATCH_SCORE);
}

function assignByScore(scores: number[][], minScore: number): ItemAssignment[] {
  const n = scores.length;
  const m = scores[0]?.length ?? 0;
  if (n === 0 || m === 0) return [];
  if (n > 16 || m > 16) return greedyAssign(scores, minScore);

  const size = 1 << m;
  let layer = new Float64Array(size).fill(Number.NEGATIVE_INFINITY);
  layer[0] = 0;
  const parents: Array<Array<{ mask: number; right: number }>> = [];

  for (let left = 0; left < n; left += 1) {
    const next = new Float64Array(size).fill(Number.NEGATIVE_INFINITY);
    const parent = Array.from({ length: size }, () => ({
      mask: -1,
      right: -1,
    }));
    for (let mask = 0; mask < size; mask += 1) {
      const base = layer[mask] ?? Number.NEGATIVE_INFINITY;
      if (base === Number.NEGATIVE_INFINITY) continue;
      if (base > (next[mask] ?? Number.NEGATIVE_INFINITY)) {
        next[mask] = base;
        parent[mask] = { mask, right: -1 };
      }
      for (let right = 0; right < m; right += 1) {
        const bit = 1 << right;
        if (mask & bit) continue;
        const score = scores[left]?.[right] ?? 0;
        if (score < minScore) continue;
        const nextMask = mask | bit;
        // Tiny bonus so an extra real pair wins over leaving both unmatched.
        const total = base + score + 1e-4;
        if (total > (next[nextMask] ?? Number.NEGATIVE_INFINITY)) {
          next[nextMask] = total;
          parent[nextMask] = { mask, right };
        }
      }
    }
    parents.push(parent);
    layer = next;
  }

  let bestMask = 0;
  let best = Number.NEGATIVE_INFINITY;
  for (let mask = 0; mask < size; mask += 1) {
    const total = layer[mask] ?? Number.NEGATIVE_INFINITY;
    if (total > best) {
      best = total;
      bestMask = mask;
    }
  }

  const pairs: ItemAssignment[] = [];
  let mask = bestMask;
  for (let left = n - 1; left >= 0; left -= 1) {
    const choice = parents[left]?.[mask];
    if (!choice || choice.right < 0) {
      if (choice) mask = choice.mask;
      continue;
    }
    pairs.push({
      left,
      right: choice.right,
      score: scores[left]?.[choice.right] ?? 0,
    });
    mask = choice.mask;
  }
  pairs.reverse();
  return pairs;
}

function greedyAssign(scores: number[][], minScore: number): ItemAssignment[] {
  const candidates: ItemAssignment[] = [];
  scores.forEach((row, left) => {
    row.forEach((score, right) => {
      if (score >= minScore) candidates.push({ left, right, score });
    });
  });
  candidates.sort((a, b) => b.score - a.score || a.left - b.left || a.right - b.right);
  const usedLeft = new Set<number>();
  const usedRight = new Set<number>();
  const pairs: ItemAssignment[] = [];
  for (const candidate of candidates) {
    if (usedLeft.has(candidate.left) || usedRight.has(candidate.right)) continue;
    usedLeft.add(candidate.left);
    usedRight.add(candidate.right);
    pairs.push(candidate);
  }
  return pairs;
}

function rowMatchScore(
  sectionPath: string,
  row: MatchableSourceRow,
  target: ResumeItem,
): number {
  return Math.max(
    scoreCrossLocaleItem(sectionPath, row.originalItem, target),
    scoreCrossLocaleItem(sectionPath, row.currentItem, target),
  );
}

/**
 * Pick a target index for each source display row (or -1 if unpaired).
 * Pairs are a global assignment over every field. Rows that do not clear
 * the score stay unmatched: added on source, or already removed on target.
 */
export function matchTargetIndexes(
  sectionPath: string,
  sourceRows: MatchableSourceRow[],
  targetItems: ResumeItem[],
): number[] {
  const scores = sourceRows.map((row) =>
    targetItems.map((target) => rowMatchScore(sectionPath, row, target)),
  );
  const pairs = assignByScore(scores, matchThreshold(sectionPath));
  const result = sourceRows.map(() => -1);
  for (const pair of pairs) {
    result[pair.left] = pair.right;
  }
  return result;
}

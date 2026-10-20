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

/** Minimum score required to accept a cross-locale pair for this section. */
export function matchThreshold(sectionPath: string): number {
  if (sectionPath === "experience") return 100;
  if (sectionPath === "projects") return 80;
  if (sectionPath === "skills") return 35;
  return Number.POSITIVE_INFINITY;
}

/**
 * How compatible two items look across locales (higher = more likely same row).
 * Locale-stable fields weigh heavily; translated fields add only small bonuses.
 */
export function scoreCrossLocaleItem(
  sectionPath: string,
  left: ResumeItem | null | undefined,
  right: ResumeItem | null | undefined,
): number {
  if (!left || !right) return 0;

  if (sectionPath === "experience") {
    let score = 0;
    if (
      normalizeText(left.company) &&
      normalizeText(left.company) === normalizeText(right.company)
    ) {
      score += 100;
    }
    if (
      normalizeText(left.period) &&
      normalizeText(left.period) === normalizeText(right.period)
    ) {
      score += 15;
    }
    if (
      normalizeText(left.role) &&
      normalizeText(left.role) === normalizeText(right.role)
    ) {
      score += 10;
    }
    return score;
  }

  if (sectionPath === "projects") {
    let score = 0;
    const leftUrl = normalizeText(left.url);
    const rightUrl = normalizeText(right.url);
    if (leftUrl && leftUrl === rightUrl) score += 100;
    if (
      normalizeText(left.name) &&
      normalizeText(left.name) === normalizeText(right.name)
    ) {
      score += 80;
    }
    if (
      normalizeText(left.stack) &&
      normalizeText(left.stack) === normalizeText(right.stack)
    ) {
      score += 10;
    }
    return score;
  }

  if (sectionPath === "skills") {
    let score = 0;
    if (
      normalizeText(left.label) &&
      normalizeText(left.label) === normalizeText(right.label)
    ) {
      score += 40;
    }
    score += jaccard(skillLabelSet(left), skillLabelSet(right)) * 60;
    return score;
  }

  return 0;
}

function leftItemForMatch(row: MatchableSourceRow): ResumeItem | null {
  if (row.status === "removed") return row.originalItem;
  return row.currentItem;
}

/**
 * Pick a target index for each source display row (or -1 if unpaired).
 * 1) Greedy pairs with score >= threshold
 * 2) Remaining extras go to unmatched removed rows (pending delete)
 * 3) Remaining targets pair positionally to unmatched live/added rows
 */
export function matchTargetIndexes(
  sectionPath: string,
  sourceRows: MatchableSourceRow[],
  targetItems: ResumeItem[],
): number[] {
  const result = sourceRows.map(() => -1);
  const usedTargets = new Set<number>();
  const threshold = matchThreshold(sectionPath);

  type Candidate = { rowIndex: number; targetIndex: number; score: number };
  const candidates: Candidate[] = [];

  sourceRows.forEach((row, rowIndex) => {
    const left = leftItemForMatch(row);
    if (!left) return;
    targetItems.forEach((target, targetIndex) => {
      const score = scoreCrossLocaleItem(sectionPath, left, target);
      if (score >= threshold) {
        candidates.push({ rowIndex, targetIndex, score });
      }
    });
  });

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
    return a.targetIndex - b.targetIndex;
  });

  const usedRows = new Set<number>();
  for (const candidate of candidates) {
    if (usedRows.has(candidate.rowIndex)) continue;
    if (usedTargets.has(candidate.targetIndex)) continue;
    result[candidate.rowIndex] = candidate.targetIndex;
    usedRows.add(candidate.rowIndex);
    usedTargets.add(candidate.targetIndex);
  }

  // Positional fallback in source display order (preserves prior cursor behavior
  // when field scores cannot decide).
  let survivorsLeft = sourceRows.filter(
    (row, rowIndex) => row.status !== "removed" && result[rowIndex]! < 0,
  ).length;
  let targetLeft = targetItems.length - usedTargets.size;

  for (let rowIndex = 0; rowIndex < sourceRows.length; rowIndex += 1) {
    if (result[rowIndex]! >= 0) continue;

    const row = sourceRows[rowIndex]!;
    const nextTarget = () => {
      for (let targetIndex = 0; targetIndex < targetItems.length; targetIndex += 1) {
        if (!usedTargets.has(targetIndex)) return targetIndex;
      }
      return -1;
    };

    if (row.status === "removed") {
      const extrasAvailable = targetLeft - survivorsLeft;
      if (extrasAvailable > 0) {
        const targetIndex = nextTarget();
        if (targetIndex >= 0) {
          result[rowIndex] = targetIndex;
          usedTargets.add(targetIndex);
          targetLeft -= 1;
        }
      }
      continue;
    }

    const targetIndex = nextTarget();
    if (targetIndex >= 0) {
      result[rowIndex] = targetIndex;
      usedTargets.add(targetIndex);
      targetLeft -= 1;
    }
    survivorsLeft -= 1;
  }

  return result;
}

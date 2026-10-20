import {
  assignItemIndexes,
  matchTargetIndexes,
  targetBaselineSlots,
} from "@/lib/array-item-match";

/** Deep equality for form field values (strings, arrays, nested lists). */
export function fieldValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

type ResumeItem = Record<string, unknown>;

/**
 * Stable identity within one language (for detecting add/remove/edit on source).
 * Not used to match across locales — labels/names often differ after translation.
 */
export function arrayItemIdentity(
  sectionPath: string,
  item: ResumeItem,
  fallbackIndex: number,
): string {
  if (sectionPath === "experience") {
    return `experience:${String(item.company ?? "")}|${String(item.period ?? "")}`;
  }
  if (sectionPath === "projects") {
    return `projects:${String(item.name ?? "")}`;
  }
  if (sectionPath === "skills") {
    return `skills:${String(item.label ?? "")}`;
  }
  return `${sectionPath}:#${fallbackIndex}`;
}

export type AlignedArrayRow = {
  key: string;
  /** Index in the form's editable/display `data` array, or -1 if absent. */
  dataIndex: number;
  /** Index in the source/current list used for ordering. */
  currentIndex: number;
  /** Index in the original snapshot, or -1 if newly added. */
  originalIndex: number;
  status: "unchanged" | "changed" | "added" | "removed";
  dataItem: ResumeItem | null;
  originalItem: ResumeItem | null;
  currentItem: ResumeItem | null;
};

/**
 * Same-language alignment (source original ↔ source current).
 * Items are paired across every field, so a renamed key stays the same row
 * when the rest still matches. Unmatched current rows are added; unmatched
 * original rows are removed and spliced back at their original index.
 */
export function alignArrayRowsSameLocale(
  sectionPath: string,
  originalItems: ResumeItem[],
  currentItems: ResumeItem[],
): AlignedArrayRow[] {
  const pairs = assignItemIndexes(sectionPath, originalItems, currentItems);
  const originalIndexByCurrent = new Map(
    pairs.map((pair) => [pair.right, pair.left]),
  );
  const matchedOriginals = new Set(pairs.map((pair) => pair.left));
  const currentRows: AlignedArrayRow[] = [];

  currentItems.forEach((currentItem, currentIndex) => {
    const originalIndex = originalIndexByCurrent.get(currentIndex) ?? -1;
    const originalItem =
      originalIndex >= 0 ? (originalItems[originalIndex] ?? null) : null;
    const status: AlignedArrayRow["status"] = !originalItem
      ? "added"
      : fieldValuesEqual(originalItem, currentItem)
        ? "unchanged"
        : "changed";

    currentRows.push({
      key:
        originalIndex >= 0
          ? arrayItemIdentity(sectionPath, originalItem ?? currentItem, originalIndex)
          : `${sectionPath}:added:${currentIndex}`,
      dataIndex: currentIndex,
      currentIndex,
      originalIndex,
      status,
      dataItem: currentItem,
      originalItem,
      currentItem,
    });
  });

  const removedRows: AlignedArrayRow[] = [];
  originalItems.forEach((originalItem, originalIndex) => {
    if (matchedOriginals.has(originalIndex)) return;
    removedRows.push({
      key: `${arrayItemIdentity(sectionPath, originalItem, originalIndex)}:removed`,
      dataIndex: -1,
      currentIndex: -1,
      originalIndex,
      status: "removed",
      dataItem: null,
      originalItem,
      currentItem: null,
    });
  });

  const rows = [...currentRows];
  for (const removed of removedRows.sort(
    (a, b) => a.originalIndex - b.originalIndex,
  )) {
    rows.splice(Math.min(removed.originalIndex, rows.length), 0, removed);
  }
  return rows;
}

/**
 * Target (right) pane: dirty status from same-locale source diff.
 *
 * Display order follows source rows. With a review baseline, each target
 * item keeps the slot it had when review opened. Unmatched rows stay added
 * or removed.
 */
export function alignTargetRowsToSourceDiff(
  sectionPath: string,
  sourceOriginal: ResumeItem[],
  sourceCurrent: ResumeItem[],
  targetItems: ResumeItem[],
  targetBaseline?: ResumeItem[],
): AlignedArrayRow[] {
  const sourceRows = alignArrayRowsSameLocale(
    sectionPath,
    sourceOriginal,
    sourceCurrent,
  );
  const targetIndexes = matchTargetIndexes(
    sectionPath,
    sourceRows,
    targetItems,
    targetBaseline,
  );

  return sourceRows.map((row, rowIndex) => {
    const dataIndex = targetIndexes[rowIndex] ?? -1;
    if (dataIndex < 0) {
      return {
        ...row,
        key:
          row.status === "removed"
            ? `${row.key}:target:synced`
            : `${row.key}:target:missing`,
        dataIndex: -1,
        dataItem: null,
      };
    }

    return {
      ...row,
      key: `${row.key}:target:${dataIndex}`,
      dataIndex,
      dataItem: targetItems[dataIndex] ?? null,
    };
  });
}

export function fieldDirtyOnAlignedRow(
  row: AlignedArrayRow,
  fieldPath: string,
): boolean {
  if (row.status === "added" || row.status === "removed") return true;
  if (row.status === "unchanged") return false;
  return !fieldValuesEqual(
    row.originalItem ? row.originalItem[fieldPath] : undefined,
    row.currentItem ? row.currentItem[fieldPath] : undefined,
  );
}

/**
 * True when the relative order of paired items differs between lists.
 * Pairing uses every field, so a renamed key still counts as the same row.
 */
export function arrayOrderChanged(
  sectionPath: string,
  originalItems: ResumeItem[],
  currentItems: ResumeItem[],
): boolean {
  const pairs = assignItemIndexes(sectionPath, originalItems, currentItems);
  const originalOrder = [...pairs]
    .sort((a, b) => a.left - b.left)
    .map((pair) => pair.left);
  const currentOrder = [...pairs]
    .sort((a, b) => a.right - b.right)
    .map((pair) => pair.left);
  return JSON.stringify(originalOrder) !== JSON.stringify(currentOrder);
}

/**
 * Reorder `targetItems` to follow sourceCurrent's order of identities that
 * existed in sourceOriginal. Slots come from the review baseline when it is
 * passed, so a list that was already permuted is not permuted again by raw
 * index. Extra target rows are appended in their previous relative order.
 */
export function applySourceOrderToTarget(
  sectionPath: string,
  sourceOriginal: ResumeItem[],
  sourceCurrent: ResumeItem[],
  targetItems: ResumeItem[],
  targetBaseline?: ResumeItem[],
): ResumeItem[] {
  if (targetItems.length === 0) return targetItems;

  const orderedOriginalIndexes = assignItemIndexes(
    sectionPath,
    sourceOriginal,
    sourceCurrent,
  )
    .sort((a, b) => a.right - b.right)
    .map((pair) => pair.left);

  const slots = targetBaseline?.length
    ? targetBaselineSlots(sectionPath, targetBaseline, targetItems)
    : targetItems.map((_, index) => index);
  const targetIndexBySlot = new Map<number, number>();
  slots.forEach((slot, index) => {
    if (slot >= 0 && !targetIndexBySlot.has(slot)) {
      targetIndexBySlot.set(slot, index);
    }
  });

  const used = new Set<number>();
  const next: ResumeItem[] = [];
  for (const originalIndex of orderedOriginalIndexes) {
    const targetIndex = targetIndexBySlot.get(originalIndex);
    if (targetIndex == null || used.has(targetIndex)) continue;
    next.push(targetItems[targetIndex]!);
    used.add(targetIndex);
  }
  targetItems.forEach((item, index) => {
    if (!used.has(index)) next.push(item);
  });
  return next;
}

/**
 * Whether the target rows sit in the source's current order.
 * Compares baseline slots, so editing a field after Apply source order
 * does not turn the order banner red again.
 */
export function targetOrderMatchesSource(
  sectionPath: string,
  sourceOriginal: ResumeItem[],
  sourceCurrent: ResumeItem[],
  targetItems: ResumeItem[],
  targetBaseline: ResumeItem[],
): boolean {
  const wanted = assignItemIndexes(sectionPath, sourceOriginal, sourceCurrent)
    .sort((a, b) => a.right - b.right)
    .map((pair) => pair.left);
  const slots = targetBaselineSlots(sectionPath, targetBaseline, targetItems);
  const firstUnmatched = slots.findIndex((slot) => slot < 0);
  const matched = firstUnmatched < 0 ? slots : slots.slice(0, firstUnmatched);
  const trailing = firstUnmatched < 0 ? [] : slots.slice(firstUnmatched);
  return (
    trailing.every((slot) => slot < 0) &&
    JSON.stringify(matched) === JSON.stringify(wanted)
  );
}

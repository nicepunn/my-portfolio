import { matchTargetIndexes } from "@/lib/array-item-match";

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

function indexByIdentity(
  sectionPath: string,
  items: ResumeItem[],
): Map<string, { item: ResumeItem; index: number }> {
  const map = new Map<string, { item: ResumeItem; index: number }>();
  items.forEach((item, index) => {
    const key = arrayItemIdentity(sectionPath, item, index);
    if (!map.has(key)) {
      map.set(key, { item, index });
    }
  });
  return map;
}

/**
 * Same-language alignment (source original ↔ source current) by identity.
 * Correctly detects middle-list removes without shifting false "changed" rows.
 * Removed placeholders are spliced back at their original index.
 */
export function alignArrayRowsSameLocale(
  sectionPath: string,
  originalItems: ResumeItem[],
  currentItems: ResumeItem[],
): AlignedArrayRow[] {
  const originalMap = indexByIdentity(sectionPath, originalItems);
  const currentRows: AlignedArrayRow[] = [];
  const seen = new Set<string>();

  currentItems.forEach((currentItem, currentIndex) => {
    const key = arrayItemIdentity(sectionPath, currentItem, currentIndex);
    seen.add(key);
    const original = originalMap.get(key);
    const originalItem = original?.item ?? null;
    const status: AlignedArrayRow["status"] = !original
      ? "added"
      : fieldValuesEqual(originalItem, currentItem)
        ? "unchanged"
        : "changed";

    currentRows.push({
      key,
      dataIndex: currentIndex,
      currentIndex,
      originalIndex: original?.index ?? -1,
      status,
      dataItem: currentItem,
      originalItem,
      currentItem,
    });
  });

  const removedRows: AlignedArrayRow[] = [];
  originalItems.forEach((originalItem, originalIndex) => {
    const key = arrayItemIdentity(sectionPath, originalItem, originalIndex);
    if (seen.has(key)) return;
    removedRows.push({
      key: `${key}:removed`,
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
 * Display order follows source rows. Target items are paired by
 * field-compatibility (company / name / url / skill overlap), with
 * positional fallback only for leftovers that could not be scored.
 */
export function alignTargetRowsToSourceDiff(
  sectionPath: string,
  sourceOriginal: ResumeItem[],
  sourceCurrent: ResumeItem[],
  targetItems: ResumeItem[],
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

function identitySequence(
  sectionPath: string,
  items: ResumeItem[],
): string[] {
  return items.map((item, index) =>
    arrayItemIdentity(sectionPath, item, index),
  );
}

/**
 * True when the relative order of shared identities differs between lists.
 * Pure reorder is detected even when every row's field status is unchanged.
 */
export function arrayOrderChanged(
  sectionPath: string,
  originalItems: ResumeItem[],
  currentItems: ResumeItem[],
): boolean {
  const originalIds = identitySequence(sectionPath, originalItems);
  const currentIds = identitySequence(sectionPath, currentItems);
  const currentSet = new Set(currentIds);
  const originalSet = new Set(originalIds);
  const originalShared = originalIds.filter((id) => currentSet.has(id));
  const currentShared = currentIds.filter((id) => originalSet.has(id));
  return JSON.stringify(originalShared) !== JSON.stringify(currentShared);
}

/**
 * Reorder `targetItems` to follow sourceCurrent's order of identities that
 * existed in sourceOriginal (index permutation). Extra target rows (pending
 * deletes / unmatched) are appended in their previous relative order.
 */
export function applySourceOrderToTarget(
  sectionPath: string,
  sourceOriginal: ResumeItem[],
  sourceCurrent: ResumeItem[],
  targetItems: ResumeItem[],
): ResumeItem[] {
  if (targetItems.length === 0) return targetItems;

  const originalIndexById = new Map<string, number>();
  sourceOriginal.forEach((item, index) => {
    const id = arrayItemIdentity(sectionPath, item, index);
    if (!originalIndexById.has(id)) originalIndexById.set(id, index);
  });

  const orderedOriginalIndexes: number[] = [];
  const seen = new Set<number>();
  sourceCurrent.forEach((item, index) => {
    const id = arrayItemIdentity(sectionPath, item, index);
    const originalIndex = originalIndexById.get(id);
    if (originalIndex == null || seen.has(originalIndex)) return;
    orderedOriginalIndexes.push(originalIndex);
    seen.add(originalIndex);
  });

  const used = new Set<number>();
  const next: ResumeItem[] = [];
  for (const originalIndex of orderedOriginalIndexes) {
    if (originalIndex < 0 || originalIndex >= targetItems.length) continue;
    next.push(targetItems[originalIndex]!);
    used.add(originalIndex);
  }
  targetItems.forEach((item, index) => {
    if (!used.has(index)) next.push(item);
  });
  return next;
}

/**
 * Whether `targetItems` already equal the order obtained by applying the
 * source original→current permutation to `targetBaseline` (pre-review snapshot).
 * Baseline must be the target list as loaded before review edits.
 */
export function targetOrderMatchesSource(
  sectionPath: string,
  sourceOriginal: ResumeItem[],
  sourceCurrent: ResumeItem[],
  targetItems: ResumeItem[],
  targetBaseline: ResumeItem[],
): boolean {
  const expected = applySourceOrderToTarget(
    sectionPath,
    sourceOriginal,
    sourceCurrent,
    targetBaseline,
  );
  return fieldValuesEqual(expected, targetItems);
}

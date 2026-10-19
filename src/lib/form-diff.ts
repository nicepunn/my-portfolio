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
 * Walk source rows in display order and consume target items with a cursor:
 * - Live/added source rows take the next target item.
 * - Removed source rows take a target item only while the target list is
 *   longer than the remaining live rows (pending delete). After the user
 *   removes that row on the right, the slot becomes empty (synced) and later
 *   live rows keep the correct pairing — unlike a fixed originalIndex map.
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
  const rows: AlignedArrayRow[] = [];
  let targetCursor = 0;
  let survivorsLeft = sourceCurrent.length;
  let targetLeft = targetItems.length;

  for (const row of sourceRows) {
    if (row.status === "removed") {
      const extrasAvailable = targetLeft - survivorsLeft;
      if (extrasAvailable > 0 && targetCursor < targetItems.length) {
        const dataItem = targetItems[targetCursor]!;
        rows.push({
          ...row,
          key: `${row.key}:target:${targetCursor}`,
          dataIndex: targetCursor,
          dataItem,
        });
        targetCursor += 1;
        targetLeft -= 1;
      } else {
        rows.push({
          ...row,
          key: `${row.key}:target:synced`,
          dataIndex: -1,
          dataItem: null,
        });
      }
      continue;
    }

    const dataItem =
      targetCursor < targetItems.length ? targetItems[targetCursor]! : null;
    rows.push({
      ...row,
      key: `${row.key}:target:${targetCursor}`,
      dataIndex: dataItem ? targetCursor : -1,
      dataItem,
    });
    if (dataItem) {
      targetCursor += 1;
      targetLeft -= 1;
    }
    survivorsLeft -= 1;
  }

  return rows;
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

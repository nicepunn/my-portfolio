/** Deep equality for form field values (strings, arrays, nested lists). */
export function fieldValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

type ResumeItem = Record<string, unknown>;

/**
 * Stable identity for dynamic array rows so add/remove/reorder still matches
 * the same logical entry across source original → source current → target.
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
  /** Index in the "current" probe array (source current or form data). */
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
    // First wins — duplicates keep earliest index.
    if (!map.has(key)) {
      map.set(key, { item, index });
    }
  });
  return map;
}

/**
 * Align dynamic array rows between an original snapshot and a current list,
 * optionally mapping onto a separate `data` list (e.g. target locale on the right).
 */
export function alignArrayRows(
  sectionPath: string,
  originalItems: ResumeItem[],
  currentItems: ResumeItem[],
  dataItems: ResumeItem[] = currentItems,
): AlignedArrayRow[] {
  const originalMap = indexByIdentity(sectionPath, originalItems);
  const dataMap = indexByIdentity(sectionPath, dataItems);
  const rows: AlignedArrayRow[] = [];
  const seen = new Set<string>();

  currentItems.forEach((currentItem, currentIndex) => {
    const key = arrayItemIdentity(sectionPath, currentItem, currentIndex);
    seen.add(key);
    const original = originalMap.get(key);
    const data = dataMap.get(key);
    const originalItem = original?.item ?? null;
    const status: AlignedArrayRow["status"] = !original
      ? "added"
      : fieldValuesEqual(originalItem, currentItem)
        ? "unchanged"
        : "changed";

    rows.push({
      key,
      dataIndex: data?.index ?? -1,
      currentIndex,
      originalIndex: original?.index ?? -1,
      status,
      dataItem: data?.item ?? null,
      originalItem,
      currentItem,
    });
  });

  originalItems.forEach((originalItem, originalIndex) => {
    const key = arrayItemIdentity(sectionPath, originalItem, originalIndex);
    if (seen.has(key)) return;
    const data = dataMap.get(key);
    rows.push({
      key,
      dataIndex: data?.index ?? -1,
      currentIndex: -1,
      originalIndex,
      status: "removed",
      dataItem: data?.item ?? null,
      originalItem,
      currentItem: null,
    });
  });

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

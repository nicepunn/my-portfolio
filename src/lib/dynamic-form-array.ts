import { getAtPath, setAtPath } from "@/lib/edit-form";
import {
  alignArrayRowsSameLocale,
  alignTargetRowsToSourceDiff,
  type AlignedArrayRow,
} from "@/lib/form-diff";
import type { Resume } from "@/lib/resume-schema";

export type ArrayItem = Record<string, unknown>;

export type ArraySourceDiff = {
  current: Resume;
  original: Resume;
};

/** Experience is reverse-chronological — new rows go at the top. */
export function prependsNewItems(sectionPath: string): boolean {
  return sectionPath === "experience";
}

export function insertPositionForSection(
  sectionPath: string,
): "start" | "end" {
  return prependsNewItems(sectionPath) ? "start" : "end";
}

export function insertArrayItem(
  items: ArrayItem[],
  item: ArrayItem,
  position: "start" | "end",
): ArrayItem[] {
  return position === "start" ? [item, ...items] : [...items, item];
}

export function removeArrayItemAt(
  items: ArrayItem[],
  index: number,
): ArrayItem[] {
  if (index < 0 || index >= items.length) return items;
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function updateArrayItemField(
  items: ArrayItem[],
  index: number,
  fieldPath: string,
  value: unknown,
): ArrayItem[] {
  if (index < 0 || index >= items.length) return items;
  return items.map((current, itemIndex) =>
    itemIndex === index
      ? (setAtPath(current, fieldPath, value) as ArrayItem)
      : current,
  );
}

/**
 * Move a data-array item from `fromIndex` to `toIndex`.
 * Prepared for drag-reorder UI — no-op when indices are invalid or equal.
 */
export function moveArrayItem(
  items: ArrayItem[],
  fromIndex: number,
  toIndex: number,
): ArrayItem[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [picked] = next.splice(fromIndex, 1);
  if (!picked) return items;
  next.splice(toIndex, 0, picked);
  return next;
}

/**
 * React keys for editable array rows.
 * In-place field edits keep the key at that index (so typing in name/label
 * does not remount the input). Reorder, add, and remove follow item identity
 * by object reference.
 */
export function stableArrayRowKeys(
  previousItems: ArrayItem[],
  previousKeys: string[],
  nextItems: ArrayItem[],
  mint: () => string,
): string[] {
  const keyByItem = new Map<ArrayItem, string>();
  previousItems.forEach((item, index) => {
    const key = previousKeys[index];
    if (key && !keyByItem.has(item)) keyByItem.set(item, key);
  });

  const sameLength = previousItems.length === nextItems.length;
  const hasInPlaceEdit =
    sameLength && nextItems.some((item) => !keyByItem.has(item));
  if (hasInPlaceEdit) {
    return nextItems.map(
      (item, index) => keyByItem.get(item) ?? previousKeys[index] ?? mint(),
    );
  }

  return nextItems.map((item) => keyByItem.get(item) ?? mint());
}

/** Rows that map to a real editable entry in `items` (not synced-remove / missing). */
export function isReorderableRow(row: AlignedArrayRow): boolean {
  return row.dataIndex >= 0 && row.dataItem != null;
}

/**
 * Build display rows for an array section.
 * Plain edit uses identity order of `items`; review modes use form-diff aligners.
 */
export function buildArraySectionRows(
  sectionPath: string,
  items: ArrayItem[],
  options: {
    sourceDiff?: ArraySourceDiff | null;
    compareAgainst?: Resume | null;
  } = {},
): AlignedArrayRow[] {
  const { sourceDiff = null, compareAgainst = null } = options;

  if (sourceDiff) {
    const sourceOriginal =
      (getAtPath(sourceDiff.original, sectionPath) as ArrayItem[]) ?? [];
    const sourceCurrent =
      (getAtPath(sourceDiff.current, sectionPath) as ArrayItem[]) ?? [];
    return alignTargetRowsToSourceDiff(
      sectionPath,
      sourceOriginal,
      sourceCurrent,
      items,
    );
  }

  if (compareAgainst) {
    const originalItems =
      (getAtPath(compareAgainst, sectionPath) as ArrayItem[]) ?? [];
    return alignArrayRowsSameLocale(sectionPath, originalItems, items);
  }

  return items.map((item, index) => ({
    key: `${sectionPath}:plain:${index}`,
    dataIndex: index,
    currentIndex: index,
    originalIndex: index,
    status: "unchanged" as const,
    dataItem: item,
    originalItem: null,
    currentItem: item,
  }));
}

export function readArrayItems(
  data: Resume,
  sectionPath: string,
): ArrayItem[] {
  return (getAtPath(data, sectionPath) as ArrayItem[]) ?? [];
}

export function writeArrayItems(
  data: Resume,
  sectionPath: string,
  nextItems: ArrayItem[],
): Resume {
  return setAtPath(data, sectionPath, nextItems);
}

export function reviewRowKey(sectionPath: string, row: AlignedArrayRow): string {
  if (row.status === "removed") {
    return `${sectionPath}#removed#${row.originalIndex}`;
  }
  if (row.originalIndex >= 0) return `${sectionPath}#${row.originalIndex}`;
  return `${sectionPath}#added#${row.currentIndex}`;
}

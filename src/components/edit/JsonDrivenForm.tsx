"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Resume } from "@/lib/resume-schema";
import {
  editForm,
  getAtPath,
  linesToList,
  listToLines,
  setAtPath,
  type ArraySection,
  type FormFieldConfig,
  type FormSection,
} from "@/lib/edit-form";
import {
  alignArrayRowsSameLocale,
  alignTargetRowsToSourceDiff,
  fieldDirtyOnAlignedRow,
  fieldValuesEqual,
  type AlignedArrayRow,
} from "@/lib/form-diff";
import {
  Field,
  GhostButton,
  SectionCard,
  TextArea,
  TextInput,
  markRowBorderClass,
  markTextClass,
  type FieldMark,
} from "@/components/edit/form-ui";

/** Mark fields dirty when the source (left) language changed vs its pre-edit original. */
export type SourceDiff = {
  current: Resume;
  original: Resume;
};

type JsonDrivenFormProps = {
  data: Resume;
  onChange?: (next: Resume) => void;
  readOnly?: boolean;
  /**
   * Compare live `data` against this snapshot (same-locale dirty marks).
   * Do not pass the live data object here.
   */
  compareAgainst?: Resume | null;
  /**
   * When set, dirty marks follow source-language edits (original → current),
   * ignoring local typing on this form.
   */
  sourceDiff?: SourceDiff | null;
  /**
   * Target pane only: snapshot of this locale before review edits.
   * Source-attention fields stay red until `data` differs here, then turn green.
   */
  resolveAgainst?: Resume | null;
  /** `source` | `target` for paired smooth-scroll anchors. */
  reviewPane?: "source" | "target";
  changedLabel?: string;
  resolvedLabel?: string;
  removedItemLabel?: string;
  addedItemLabel?: string;
  /** Shown on the target pane when source added a row that is not on this side yet. */
  addedOnSourceLabel?: string;
};

function pathDirtyFromSource(
  sourceDiff: SourceDiff | null | undefined,
  absolutePath: string,
): boolean {
  if (!sourceDiff) return false;
  return !fieldValuesEqual(
    getAtPath(sourceDiff.original, absolutePath),
    getAtPath(sourceDiff.current, absolutePath),
  );
}

function isAttention(
  absolutePath: string,
  value: unknown,
  compareAgainst: Resume | null | undefined,
  sourceDiff: SourceDiff | null | undefined,
): boolean {
  if (sourceDiff) {
    return pathDirtyFromSource(sourceDiff, absolutePath);
  }
  if (!compareAgainst) return false;
  return !fieldValuesEqual(getAtPath(compareAgainst, absolutePath), value);
}

function toMark(
  attention: boolean,
  resolved: boolean,
  resolveAgainst: Resume | null | undefined,
): FieldMark | null {
  if (!attention) return null;
  if (resolveAgainst) return resolved ? "resolved" : "pending";
  return "pending";
}

function reviewRowKey(sectionPath: string, row: AlignedArrayRow): string {
  if (row.status === "removed") {
    return `${sectionPath}#removed#${row.originalIndex}`;
  }
  if (row.originalIndex >= 0) return `${sectionPath}#${row.originalIndex}`;
  return `${sectionPath}#added#${row.currentIndex}`;
}

function ReviewAnchor({
  reviewKey,
  pane,
  mark,
  leaf = false,
  children,
  className,
}: {
  reviewKey: string;
  pane?: "source" | "target";
  mark: FieldMark | null;
  /** Jump targets only leaf anchors (not row wrappers that stay pending). */
  leaf?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      data-review-key={reviewKey}
      data-review-pane={pane}
      data-review-mark={leaf ? (mark ?? undefined) : undefined}
      data-review-leaf={leaf ? "true" : undefined}
    >
      {children}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  readOnly,
  mark,
  changedLabel,
  resolvedLabel,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  mark?: FieldMark | null;
  changedLabel?: string;
  resolvedLabel?: string;
}) {
  if (field.type === "textarea") {
    return (
      <Field
        label={field.label}
        hint={field.hint}
        mark={mark ?? false}
        changedLabel={changedLabel}
        resolvedLabel={resolvedLabel}
      >
        <TextArea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          mark={mark ?? false}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.stopPropagation();
          }}
        />
      </Field>
    );
  }

  if (field.type === "lines") {
    return (
      <LinesField
        field={field}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        mark={mark ?? null}
        changedLabel={changedLabel}
        resolvedLabel={resolvedLabel}
      />
    );
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "url" ? "url" : "text";

  return (
    <Field
      label={field.label}
      hint={field.hint}
      mark={mark ?? false}
      changedLabel={changedLabel}
      resolvedLabel={resolvedLabel}
    >
      <TextInput
        type={inputType}
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        mark={mark ?? false}
      />
    </Field>
  );
}

function LinesField({
  field,
  value,
  onChange,
  readOnly,
  mark,
  changedLabel,
  resolvedLabel,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  mark?: FieldMark | null;
  changedLabel?: string;
  resolvedLabel?: string;
}) {
  const committed = listToLines(value);
  const [text, setText] = useState(committed);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(listToLines(value));
  }, [value, focused]);

  return (
    <Field
      label={field.label}
      hint={field.hint}
      mark={mark ?? false}
      changedLabel={changedLabel}
      resolvedLabel={resolvedLabel}
    >
      <TextArea
        value={focused ? text : committed}
        readOnly={readOnly}
        mark={mark ?? false}
        onFocus={() => {
          if (readOnly) return;
          setFocused(true);
          setText(listToLines(value));
        }}
        onChange={(event) => {
          if (readOnly) return;
          const next = event.target.value;
          setText(next);
          // Commit immediately so resolve marks turn green on the first keystroke.
          onChange(linesToList(next));
        }}
        onBlur={() => {
          if (readOnly) return;
          setFocused(false);
          onChange(linesToList(text));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.stopPropagation();
        }}
      />
    </Field>
  );
}

function FieldsGrid({
  fields,
  data,
  onChange,
  readOnly,
  pathPrefix = "",
  compareAgainst,
  sourceDiff,
  resolveAgainst,
  reviewPane,
  changedLabel,
  resolvedLabel,
}: {
  fields: FormFieldConfig[];
  data: unknown;
  onChange: (path: string, value: unknown) => void;
  readOnly?: boolean;
  pathPrefix?: string;
  compareAgainst: Resume | null;
  sourceDiff: SourceDiff | null;
  resolveAgainst: Resume | null;
  reviewPane?: "source" | "target";
  changedLabel?: string;
  resolvedLabel?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const absolutePath = pathPrefix
          ? `${pathPrefix}.${field.path}`
          : field.path;
        const value = getAtPath(data, field.path);
        const attention = isAttention(
          absolutePath,
          value,
          compareAgainst,
          sourceDiff,
        );
        const resolved = Boolean(
          resolveAgainst &&
            !fieldValuesEqual(getAtPath(resolveAgainst, absolutePath), value),
        );
        const mark = toMark(attention, resolved, resolveAgainst);
        return (
          <ReviewAnchor
            key={field.path}
            reviewKey={absolutePath}
            pane={reviewPane}
            mark={mark}
            leaf
            className={field.fullWidth ? "sm:col-span-2" : undefined}
          >
            <FieldControl
              field={field}
              value={value}
              onChange={(next) => onChange(field.path, next)}
              readOnly={readOnly}
              mark={mark}
              changedLabel={changedLabel}
              resolvedLabel={resolvedLabel}
            />
          </ReviewAnchor>
        );
      })}
    </div>
  );
}

function arrayFieldResolved(
  resolveAgainst: Resume | null,
  sectionPath: string,
  row: AlignedArrayRow,
  fieldPath: string,
  value: unknown,
): boolean {
  if (!resolveAgainst) return false;
  // Fully synced remove (no target row left).
  if (row.status === "removed" && row.dataItem == null) return true;
  // Added on source and already inserted on target.
  if (row.status === "added") return row.dataIndex >= 0;
  const baselineItems =
    (getAtPath(resolveAgainst, sectionPath) as Record<string, unknown>[]) ?? [];
  const baselineItem =
    row.originalIndex >= 0 ? (baselineItems[row.originalIndex] ?? null) : null;
  // Any edit vs the target baseline (including typing inside a pending-remove row).
  return !fieldValuesEqual(
    baselineItem ? baselineItem[fieldPath] : undefined,
    value,
  );
}

function ArraySectionCard({
  section,
  data,
  onChange,
  readOnly,
  compareAgainst,
  sourceDiff,
  resolveAgainst,
  reviewPane,
  changedLabel,
  resolvedLabel,
  removedItemLabel,
  addedItemLabel,
  addedOnSourceLabel,
}: {
  section: ArraySection;
  data: Resume;
  onChange: (next: Resume) => void;
  readOnly?: boolean;
  compareAgainst: Resume | null;
  sourceDiff: SourceDiff | null;
  resolveAgainst: Resume | null;
  reviewPane?: "source" | "target";
  changedLabel?: string;
  resolvedLabel?: string;
  removedItemLabel?: string;
  addedItemLabel?: string;
  addedOnSourceLabel?: string;
}) {
  const items = (getAtPath(data, section.path) as Record<string, unknown>[]) ?? [];
  const hasDiff = Boolean(sourceDiff || compareAgainst);

  const rows: AlignedArrayRow[] = (() => {
    if (sourceDiff) {
      const sourceOriginal =
        (getAtPath(sourceDiff.original, section.path) as Record<
          string,
          unknown
        >[]) ?? [];
      const sourceCurrent =
        (getAtPath(sourceDiff.current, section.path) as Record<
          string,
          unknown
        >[]) ?? [];
      return alignTargetRowsToSourceDiff(
        section.path,
        sourceOriginal,
        sourceCurrent,
        items,
      );
    }
    if (compareAgainst) {
      const originalItems =
        (getAtPath(compareAgainst, section.path) as Record<string, unknown>[]) ??
        [];
      return alignArrayRowsSameLocale(section.path, originalItems, items);
    }
    return items.map((item, index) => ({
      key: `${section.path}:plain:${index}`,
      dataIndex: index,
      currentIndex: index,
      originalIndex: index,
      status: "unchanged" as const,
      dataItem: item,
      originalItem: null,
      currentItem: item,
    }));
  })();

  function updateItems(nextItems: Record<string, unknown>[]) {
    onChange(setAtPath(data, section.path, nextItems));
  }

  function updateRowField(row: AlignedArrayRow, fieldPath: string, next: unknown) {
    if (readOnly || row.dataIndex < 0) return;
    const nextItems = items.map((current, itemIndex) =>
      itemIndex === row.dataIndex
        ? (setAtPath(current, fieldPath, next) as Record<string, unknown>)
        : current,
    );
    updateItems(nextItems);
  }

  const prependNew = section.path === "experience";

  function addBlankItem() {
    const blank = structuredClone(section.defaultItem) as Record<string, unknown>;
    updateItems(prependNew ? [blank, ...items] : [...items, blank]);
  }

  function addMissingFromSource(row: AlignedArrayRow) {
    if (readOnly || !row.currentItem) return;
    const copy = structuredClone(row.currentItem);
    updateItems(prependNew ? [copy, ...items] : [...items, copy]);
  }

  const addButton = readOnly ? null : (
    <button
      type="button"
      onClick={addBlankItem}
      className="inline-flex h-10 w-full items-center justify-center border border-[var(--border)] px-3 text-xs font-medium tracking-wide text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {section.addLabel}
    </button>
  );

  return (
    <SectionCard id={section.id} title={section.label}>
      <div className="space-y-6">
        {prependNew ? addButton : null}
        {rows.map((row, displayIndex) => {
          const rowKey = reviewRowKey(section.path, row);

          // Synced remove (target already deleted to match source).
          if (row.status === "removed" && !row.dataItem) {
            const mark = toMark(true, Boolean(resolveAgainst), resolveAgainst);
            return (
              <ReviewAnchor
                key={row.key}
                reviewKey={rowKey}
                pane={reviewPane}
                mark={mark}
                leaf
                className={`space-y-2 border border-dashed px-3 py-3 ${
                  mark === "resolved"
                    ? "border-emerald-500/60 bg-emerald-500/5"
                    : "border-red-500/60 bg-red-500/5"
                }`}
              >
                <p
                  className={`flex items-center gap-2 font-mono text-xs ${markTextClass(mark, "text-red-500")}`}
                >
                  {section.itemLabel} #{displayIndex + 1}
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                      mark === "resolved" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    {mark === "resolved" ? "✓" : "!"}
                  </span>
                  <span className="tracking-wide uppercase">
                    {removedItemLabel ?? "Removed"}
                  </span>
                </p>
              </ReviewAnchor>
            );
          }

          const itemAttention = hasDiff && row.status !== "unchanged";
          const missingOnThisSide = row.dataIndex < 0;
          const item = row.dataItem;

          if (missingOnThisSide && sourceDiff) {
            const mark = toMark(true, false, resolveAgainst);
            return (
              <ReviewAnchor
                key={row.key}
                reviewKey={rowKey}
                pane={reviewPane}
                mark={mark}
                leaf
                className="space-y-3 border border-dashed border-red-500/60 bg-red-500/5 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-mono text-xs text-red-500">
                    {section.itemLabel} #{displayIndex + 1}
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      !
                    </span>
                    <span className="tracking-wide uppercase">
                      {addedOnSourceLabel ?? addedItemLabel ?? "New"}
                    </span>
                  </p>
                  {readOnly ? null : (
                    <GhostButton onClick={() => addMissingFromSource(row)}>
                      {section.addLabel}
                    </GhostButton>
                  )}
                </div>
              </ReviewAnchor>
            );
          }

          if (!item) return null;

          const rowResolved =
            row.status === "removed"
              ? false
              : row.status === "added"
                ? Boolean(resolveAgainst)
                : section.fields.every((field) =>
                    arrayFieldResolved(
                      resolveAgainst,
                      section.path,
                      row,
                      field.path,
                      getAtPath(item, field.path),
                    ),
                  );
          const rowMark = toMark(itemAttention, rowResolved, resolveAgainst);

          return (
            <div
              key={row.key}
              data-review-key={rowKey}
              data-review-pane={reviewPane}
              className={`space-y-3 border-t pt-6 first:border-t-0 first:pt-0 ${markRowBorderClass(rowMark)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`font-mono text-xs ${markTextClass(rowMark, "text-[var(--accent)]")}`}
                >
                  {section.itemLabel} #{displayIndex + 1}
                  {row.status === "added"
                    ? ` · ${addedItemLabel ?? "New"}`
                    : null}
                  {row.status === "removed"
                    ? ` · ${removedItemLabel ?? "Removed"}`
                    : null}
                  {rowMark ? (
                    <span
                      className={`ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                        rowMark === "resolved" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    >
                      {rowMark === "resolved" ? "✓" : "!"}
                    </span>
                  ) : null}
                </p>
                {readOnly ? null : (
                  <GhostButton
                    danger
                    onClick={() =>
                      updateItems(
                        items.filter((_, itemIndex) => itemIndex !== row.dataIndex),
                      )
                    }
                  >
                    Remove
                  </GhostButton>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const value = getAtPath(item, field.path);
                  const attention = hasDiff
                    ? fieldDirtyOnAlignedRow(row, field.path)
                    : false;
                  const resolved = arrayFieldResolved(
                    resolveAgainst,
                    section.path,
                    row,
                    field.path,
                    value,
                  );
                  const mark = toMark(attention, resolved, resolveAgainst);
                  const fieldKey = `${rowKey}.${field.path}`;
                  return (
                    <ReviewAnchor
                      key={field.path}
                      reviewKey={fieldKey}
                      pane={reviewPane}
                      mark={mark}
                      leaf
                      className={field.fullWidth ? "sm:col-span-2" : undefined}
                    >
                      <FieldControl
                        field={field}
                        value={value}
                        readOnly={readOnly}
                        mark={mark}
                        changedLabel={changedLabel}
                        resolvedLabel={resolvedLabel}
                        onChange={(next) => updateRowField(row, field.path, next)}
                      />
                    </ReviewAnchor>
                  );
                })}
              </div>
            </div>
          );
        })}
        {prependNew ? null : (
          <div className="border-t border-[var(--border)] pt-4">{addButton}</div>
        )}
      </div>
    </SectionCard>
  );
}

function renderSection(
  section: FormSection,
  data: Resume,
  onChange: (next: Resume) => void,
  readOnly: boolean | undefined,
  compareAgainst: Resume | null,
  sourceDiff: SourceDiff | null,
  resolveAgainst: Resume | null,
  reviewPane: "source" | "target" | undefined,
  changedLabel: string | undefined,
  resolvedLabel: string | undefined,
  removedItemLabel: string | undefined,
  addedItemLabel: string | undefined,
  addedOnSourceLabel: string | undefined,
) {
  if (section.kind === "array") {
    return (
      <ArraySectionCard
        key={section.id}
        section={section}
        data={data}
        onChange={onChange}
        readOnly={readOnly}
        compareAgainst={compareAgainst}
        sourceDiff={sourceDiff}
        resolveAgainst={resolveAgainst}
        reviewPane={reviewPane}
        changedLabel={changedLabel}
        resolvedLabel={resolvedLabel}
        removedItemLabel={removedItemLabel}
        addedItemLabel={addedItemLabel}
        addedOnSourceLabel={addedOnSourceLabel}
      />
    );
  }

  return (
    <SectionCard key={section.id} id={section.id} title={section.label}>
      <FieldsGrid
        fields={section.fields}
        data={data}
        readOnly={readOnly}
        compareAgainst={compareAgainst}
        sourceDiff={sourceDiff}
        resolveAgainst={resolveAgainst}
        reviewPane={reviewPane}
        changedLabel={changedLabel}
        resolvedLabel={resolvedLabel}
        onChange={(path, value) => {
          if (readOnly) return;
          onChange(setAtPath(data, path, value));
        }}
      />
    </SectionCard>
  );
}

export function JsonDrivenForm({
  data,
  onChange,
  readOnly = false,
  compareAgainst = null,
  sourceDiff = null,
  resolveAgainst = null,
  reviewPane,
  changedLabel = "Changed",
  resolvedLabel = "Updated",
  removedItemLabel = "Removed",
  addedItemLabel = "New",
  addedOnSourceLabel = "Added on source",
}: JsonDrivenFormProps) {
  const handleChange = onChange ?? (() => {});

  return (
    <>
      {editForm.sections.map((section) =>
        renderSection(
          section,
          data,
          handleChange,
          readOnly,
          compareAgainst,
          sourceDiff,
          resolveAgainst,
          reviewPane,
          changedLabel,
          resolvedLabel,
          removedItemLabel,
          addedItemLabel,
          addedOnSourceLabel,
        ),
      )}
    </>
  );
}

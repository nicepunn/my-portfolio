"use client";

import { useEffect, useState } from "react";
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
  changedLabel?: string;
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

function isDirty(
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

function FieldControl({
  field,
  value,
  onChange,
  readOnly,
  dirty,
  changedLabel,
  baselineValue,
  lockDirty,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  dirty?: boolean;
  changedLabel?: string;
  baselineValue?: unknown;
  /** When true, LinesField won't recompute dirty from local typing. */
  lockDirty?: boolean;
}) {
  if (field.type === "textarea") {
    return (
      <Field
        label={field.label}
        hint={field.hint}
        changed={dirty}
        changedLabel={changedLabel}
      >
        <TextArea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          changed={dirty}
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
        dirty={dirty}
        changedLabel={changedLabel}
        baselineValue={lockDirty ? undefined : baselineValue}
        lockDirty={lockDirty}
      />
    );
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "url" ? "url" : "text";

  return (
    <Field
      label={field.label}
      hint={field.hint}
      changed={dirty}
      changedLabel={changedLabel}
    >
      <TextInput
        type={inputType}
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        changed={dirty}
      />
    </Field>
  );
}

function LinesField({
  field,
  value,
  onChange,
  readOnly,
  dirty,
  changedLabel,
  baselineValue,
  lockDirty,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  dirty?: boolean;
  changedLabel?: string;
  baselineValue?: unknown;
  lockDirty?: boolean;
}) {
  const committed = listToLines(value);
  const [text, setText] = useState(committed);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(listToLines(value));
  }, [value, focused]);

  const liveDirty = lockDirty
    ? Boolean(dirty)
    : baselineValue !== undefined
      ? !fieldValuesEqual(baselineValue, focused ? linesToList(text) : value)
      : Boolean(dirty);

  return (
    <Field
      label={field.label}
      hint={field.hint}
      changed={liveDirty}
      changedLabel={changedLabel}
    >
      <TextArea
        value={focused ? text : committed}
        readOnly={readOnly}
        changed={liveDirty}
        onFocus={() => {
          if (readOnly) return;
          setFocused(true);
          setText(listToLines(value));
        }}
        onChange={(event) => {
          if (readOnly) return;
          setText(event.target.value);
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
  changedLabel,
}: {
  fields: FormFieldConfig[];
  data: unknown;
  onChange: (path: string, value: unknown) => void;
  readOnly?: boolean;
  pathPrefix?: string;
  compareAgainst: Resume | null;
  sourceDiff: SourceDiff | null;
  changedLabel?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const absolutePath = pathPrefix
          ? `${pathPrefix}.${field.path}`
          : field.path;
        const value = getAtPath(data, field.path);
        const dirty = isDirty(absolutePath, value, compareAgainst, sourceDiff);
        return (
          <div
            key={field.path}
            className={field.fullWidth ? "sm:col-span-2" : undefined}
          >
            <FieldControl
              field={field}
              value={value}
              onChange={(next) => onChange(field.path, next)}
              readOnly={readOnly}
              dirty={dirty}
              changedLabel={changedLabel}
              // Never live-diff while typing on /edit (no compare props).
              lockDirty
              baselineValue={undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

function ArraySectionCard({
  section,
  data,
  onChange,
  readOnly,
  compareAgainst,
  sourceDiff,
  changedLabel,
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
  changedLabel?: string;
  removedItemLabel?: string;
  addedItemLabel?: string;
  addedOnSourceLabel?: string;
}) {
  const items = (getAtPath(data, section.path) as Record<string, unknown>[]) ?? [];
  const hasDiff = Boolean(sourceDiff || compareAgainst);

  // Left pane: same-locale identity align (source original ↔ source current).
  // Right pane: dirty from source diff; rows mapped onto target by order.
  // Single /edit form: no diff props → never mark dirty.
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

  function addMissingFromSource(row: AlignedArrayRow) {
    if (readOnly || !row.currentItem) return;
    updateItems([...items, structuredClone(row.currentItem)]);
  }

  return (
    <SectionCard id={section.id} title={section.label}>
      <div className="space-y-6">
        {rows.map((row, displayIndex) => {
          // Source (left) remove: item is gone — dashed placeholder only.
          // Target (right) remove: keep full fields from target data, whole group red.
          if (row.status === "removed" && !row.dataItem) {
            return (
              <div
                key={row.key}
                className="space-y-2 border border-dashed border-red-500/60 bg-red-500/5 px-3 py-3"
              >
                <p className="flex items-center gap-2 font-mono text-xs text-red-500">
                  {section.itemLabel} #{displayIndex + 1}
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    !
                  </span>
                  <span className="tracking-wide uppercase">
                    {removedItemLabel ?? "Removed"}
                  </span>
                </p>
              </div>
            );
          }

          const itemDirty = row.status !== "unchanged";
          const missingOnThisSide = row.dataIndex < 0;
          const item = row.dataItem;

          // Source added a row that does not exist on the target yet.
          if (missingOnThisSide && sourceDiff) {
            return (
              <div
                key={row.key}
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
              </div>
            );
          }

          if (!item) return null;

          return (
            <div
              key={row.key}
              className={`space-y-3 border-t pt-6 first:border-t-0 first:pt-0 ${
                itemDirty ? "border-red-500/50" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`font-mono text-xs ${
                    itemDirty ? "text-red-500" : "text-[var(--accent)]"
                  }`}
                >
                  {section.itemLabel} #{displayIndex + 1}
                  {row.status === "added"
                    ? ` · ${addedItemLabel ?? "New"}`
                    : null}
                  {itemDirty ? (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      !
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
                  const dirty = hasDiff
                    ? fieldDirtyOnAlignedRow(row, field.path)
                    : false;
                  return (
                    <div
                      key={field.path}
                      className={field.fullWidth ? "sm:col-span-2" : undefined}
                    >
                      <FieldControl
                        field={field}
                        value={value}
                        readOnly={readOnly}
                        dirty={dirty}
                        changedLabel={changedLabel}
                        lockDirty
                        baselineValue={undefined}
                        onChange={(next) => updateRowField(row, field.path, next)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {readOnly ? null : (
          <div className="border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() =>
                updateItems([
                  ...items,
                  structuredClone(section.defaultItem) as Record<string, unknown>,
                ])
              }
              className="inline-flex h-10 w-full items-center justify-center border border-[var(--border)] px-3 text-xs font-medium tracking-wide text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {section.addLabel}
            </button>
          </div>
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
  changedLabel: string | undefined,
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
        changedLabel={changedLabel}
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
        changedLabel={changedLabel}
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
  changedLabel = "Changed",
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
          changedLabel,
          removedItemLabel,
          addedItemLabel,
          addedOnSourceLabel,
        ),
      )}
    </>
  );
}

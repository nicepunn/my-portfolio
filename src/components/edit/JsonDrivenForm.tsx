"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Reorder, useDragControls } from "framer-motion";
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
  buildArraySectionRows,
  insertArrayItem,
  insertPositionForSection,
  isReorderableRow,
  moveArrayItem,
  prependsNewItems,
  readArrayItems,
  removeArrayItemAt,
  reviewRowKey,
  stableArrayRowKeys,
  updateArrayItemField,
  writeArrayItems,
  type ArrayItem,
} from "@/lib/dynamic-form-array";
import {
  arrayOrderChanged,
  applySourceOrderToTarget,
  fieldDirtyOnAlignedRow,
  fieldValuesEqual,
  targetOrderMatchesSource,
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
  orderChangedLabel?: string;
  orderResolvedLabel?: string;
  applySourceOrderLabel?: string;
  dragToReorderLabel?: string;
};

function arrayItemPreview(sectionPath: string, item: ArrayItem): string {
  const text = (key: string) => {
    const value = item[key];
    return typeof value === "string" ? value.trim() : "";
  };
  if (sectionPath === "experience") return text("company") || text("role");
  if (sectionPath === "projects") return text("name");
  if (sectionPath === "skills") return text("label");
  return text("company") || text("name") || text("label");
}

function ArrayDragRow({
  item,
  preview,
  dragLabel,
  dataArrayIndex,
  lifted,
  dimmed,
  onLiftChange,
  className,
  children,
}: {
  item: ArrayItem;
  preview: string;
  dragLabel: string;
  dataArrayIndex: number;
  lifted: boolean;
  dimmed: boolean;
  onLiftChange: (lifted: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  const controls = useDragControls();
  useEffect(() => {
    if (!lifted) return;
    const drop = () => onLiftChange(false);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", drop);
    return () => {
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", drop);
    };
  }, [lifted, onLiftChange]);
  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      whileDrag={{ scale: 1.015 }}
      onDragStart={() => onLiftChange(true)}
      onDragEnd={() => onLiftChange(false)}
      data-array-index={dataArrayIndex}
      data-reorderable="true"
      data-lifted={lifted ? "true" : "false"}
      data-testid="array-reorder-item"
      className={
        lifted
          ? "relative z-30"
          : `${className ?? ""} ${dimmed ? "opacity-70" : ""}`
      }
    >
      <div
        className={`flex items-start gap-2 ${lifted ? "edit-lift" : ""}`}
      >
        <div
          role="button"
          tabIndex={0}
          data-testid="array-drag-handle"
          aria-label={dragLabel}
          className={`mt-1 cursor-grab touch-none select-none px-1 py-2 font-mono text-xs tracking-tighter active:cursor-grabbing ${
            lifted ? "cursor-grabbing text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
          onPointerDown={(event) => {
            event.preventDefault();
            // Collapse to the lifted card before drag measures, so it stays under the pointer.
            flushSync(() => onLiftChange(true));
            controls.start(event);
          }}
        >
          ⋮⋮
        </div>
        <div className="min-w-0 flex-1">
          {lifted ? (
            <p className="truncate py-1.5 text-sm font-medium text-[var(--fg)]">
              {preview}
            </p>
          ) : (
            <div className="space-y-3">{children}</div>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
}

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
            <div data-field-path={field.path}>
              <FieldControl
                field={field}
                value={value}
                onChange={(next) => onChange(field.path, next)}
                readOnly={readOnly}
                mark={mark}
                changedLabel={changedLabel}
                resolvedLabel={resolvedLabel}
              />
            </div>
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
  orderChangedLabel = "Order changed",
  orderResolvedLabel = "Order updated",
  applySourceOrderLabel = "Apply source order",
  dragToReorderLabel = "Drag to reorder",
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
  orderChangedLabel?: string;
  orderResolvedLabel?: string;
  applySourceOrderLabel?: string;
  dragToReorderLabel?: string;
}) {
  const items = readArrayItems(data, section.path);
  const hasDiff = Boolean(sourceDiff || compareAgainst);
  const rows = buildArraySectionRows(section.path, items, {
    sourceDiff,
    compareAgainst,
    resolveAgainst,
  });
  const insertPosition = insertPositionForSection(section.path);
  const prependNew = prependsNewItems(section.path);
  const enableDrag = !readOnly && !sourceDiff && !compareAgainst;
  const [liftedItem, setLiftedItem] = useState<ArrayItem | null>(null);
  const rowKeyState = useRef<{ items: ArrayItem[]; keys: string[] }>({
    items: [],
    keys: [],
  });
  const rowKeyId = useRef(0);
  const dragRowKeys = enableDrag
    ? stableArrayRowKeys(
        rowKeyState.current.items,
        rowKeyState.current.keys,
        items,
        () => {
          rowKeyId.current += 1;
          return `${section.path}-row-${rowKeyId.current}`;
        },
      )
    : [];
  if (enableDrag) {
    rowKeyState.current = { items, keys: dragRowKeys };
  }

  const orderSourceOriginal = sourceDiff
    ? ((getAtPath(sourceDiff.original, section.path) as ArrayItem[]) ?? [])
    : compareAgainst
      ? ((getAtPath(compareAgainst, section.path) as ArrayItem[]) ?? [])
      : null;
  const orderSourceCurrent = sourceDiff
    ? ((getAtPath(sourceDiff.current, section.path) as ArrayItem[]) ?? [])
    : items;
  const orderChanged = Boolean(
    orderSourceOriginal &&
      arrayOrderChanged(section.path, orderSourceOriginal, orderSourceCurrent),
  );
  const targetBaselineItems = resolveAgainst
    ? ((getAtPath(resolveAgainst, section.path) as ArrayItem[]) ?? [])
    : [];
  const orderResolved =
    Boolean(sourceDiff && resolveAgainst && orderChanged) &&
    targetOrderMatchesSource(
      section.path,
      orderSourceOriginal ?? [],
      orderSourceCurrent,
      items,
      targetBaselineItems,
    );
  const orderMark = toMark(orderChanged, orderResolved, resolveAgainst);

  function updateItems(nextItems: ArrayItem[]) {
    onChange(writeArrayItems(data, section.path, nextItems));
  }

  function applySourceOrder() {
    if (readOnly || !sourceDiff || !orderSourceOriginal) return;
    updateItems(
      applySourceOrderToTarget(
        section.path,
        orderSourceOriginal,
        orderSourceCurrent,
        items,
        targetBaselineItems,
      ) as ArrayItem[],
    );
  }

  function updateRowField(row: AlignedArrayRow, fieldPath: string, next: unknown) {
    if (readOnly || row.dataIndex < 0) return;
    updateItems(updateArrayItemField(items, row.dataIndex, fieldPath, next));
  }

  function addBlankItem() {
    const blank = structuredClone(section.defaultItem) as ArrayItem;
    updateItems(insertArrayItem(items, blank, insertPosition));
  }

  function addMissingFromSource(row: AlignedArrayRow) {
    if (readOnly || !row.currentItem) return;
    const copy = structuredClone(row.currentItem);
    updateItems(insertArrayItem(items, copy, insertPosition));
  }

  const addButton = readOnly ? null : (
    <button
      type="button"
      data-testid="array-add"
      onClick={addBlankItem}
      className={`edit-add inline-flex h-10 w-full items-center justify-center border border-[var(--border)] px-3 text-xs font-medium tracking-wide text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]${
        reviewPane ? " edit-flow-item" : ""
      }`}
    >
      {section.addLabel}
    </button>
  );

  const orderReviewKey = `${section.path}#order`;
  const orderBanner =
    orderChanged && hasDiff ? (
      <div
        data-testid="array-order-banner"
        data-review-key={orderReviewKey}
        data-review-pane={reviewPane}
        data-review-mark={orderMark ?? undefined}
        data-review-leaf={orderMark ? "true" : undefined}
        className={`flex flex-wrap items-center justify-between gap-3 border px-3 py-2${
          reviewPane ? " edit-flow-item" : ""
        } ${
          orderMark === "resolved"
            ? "border-emerald-500/60 bg-emerald-500/5"
            : "border-red-500/60 bg-red-500/5"
        }`}
      >
        <p
          className={`flex items-center gap-2 font-mono text-xs ${markTextClass(orderMark, "text-red-500")}`}
        >
          <span
            className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              orderMark === "resolved" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {orderMark === "resolved" ? "✓" : "!"}
          </span>
          <span className="tracking-wide uppercase">
            {orderMark === "resolved" ? orderResolvedLabel : orderChangedLabel}
          </span>
        </p>
        {!readOnly && sourceDiff && orderMark === "pending" ? (
          <GhostButton data-testid="array-apply-order" onClick={applySourceOrder}>
            {applySourceOrderLabel}
          </GhostButton>
        ) : null}
      </div>
    ) : null;

  const rowNodes = rows.map((row, displayIndex) => {
          const rowKey = reviewRowKey(section.path, row);
          const reorderable = isReorderableRow(row);

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
                className={`space-y-2 border border-dashed px-3 py-3${
                  reviewPane ? " edit-flow-item" : ""
                } ${
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
          const item = row.dataItem;

          if (row.status === "added" && row.dataIndex < 0 && sourceDiff) {
            const mark = toMark(true, false, resolveAgainst);
            return (
              <ReviewAnchor
                key={row.key}
                reviewKey={rowKey}
                pane={reviewPane}
                mark={mark}
                leaf
                className={`space-y-3 border border-dashed border-red-500/60 bg-red-500/5 px-3 py-3${
                  reviewPane ? " edit-flow-item" : ""
                }`}
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
                    <GhostButton
                      data-testid="array-add-from-source"
                      onClick={() => addMissingFromSource(row)}
                    >
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
          const rowClass = `edit-row space-y-3 border-t pt-6 first:border-t-0 first:pt-0${
            reviewPane ? " edit-flow-item" : ""
          } ${markRowBorderClass(rowMark)}`;

          const body = (
            <>
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
                <div className="flex flex-wrap items-center gap-2">
                  {enableDrag && reorderable && row.dataIndex > 0 ? (
                    <GhostButton
                      data-testid="array-move-up"
                      onClick={() =>
                        updateItems(
                          moveArrayItem(items, row.dataIndex, row.dataIndex - 1),
                        )
                      }
                    >
                      ↑
                    </GhostButton>
                  ) : null}
                  {enableDrag &&
                  reorderable &&
                  row.dataIndex < items.length - 1 ? (
                    <GhostButton
                      data-testid="array-move-down"
                      onClick={() =>
                        updateItems(
                          moveArrayItem(items, row.dataIndex, row.dataIndex + 1),
                        )
                      }
                    >
                      ↓
                    </GhostButton>
                  ) : null}
                  {readOnly ? null : (
                    <GhostButton
                      danger
                      data-testid="array-remove"
                      onClick={() =>
                        updateItems(removeArrayItemAt(items, row.dataIndex))
                      }
                    >
                      Remove
                    </GhostButton>
                  )}
                </div>
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
                      <div data-field-path={field.path}>
                        <FieldControl
                          field={field}
                          value={value}
                          readOnly={readOnly}
                          mark={mark}
                          changedLabel={changedLabel}
                          resolvedLabel={resolvedLabel}
                          onChange={(next) =>
                            updateRowField(row, field.path, next)
                          }
                        />
                      </div>
                    </ReviewAnchor>
                  );
                })}
              </div>
            </>
          );

          if (enableDrag && reorderable) {
            return (
              <ArrayDragRow
                key={dragRowKeys[row.dataIndex] ?? row.key}
                item={item}
                preview={
                  arrayItemPreview(section.path, item) ||
                  `${section.itemLabel} ${displayIndex + 1}`
                }
                dragLabel={dragToReorderLabel}
                dataArrayIndex={row.dataIndex}
                lifted={liftedItem === item}
                dimmed={liftedItem != null && liftedItem !== item}
                onLiftChange={(next) => setLiftedItem(next ? item : null)}
                className={rowClass}
              >
                {body}
              </ArrayDragRow>
            );
          }

          return (
            <div
              key={row.key}
              data-review-key={rowKey}
              data-review-pane={reviewPane}
              data-array-index={reorderable ? row.dataIndex : undefined}
              data-reorderable={reorderable ? "true" : "false"}
              className={rowClass}
            >
              {body}
            </div>
          );
        });

  return (
    <SectionCard id={section.id} title={section.label}>
      <div
        className="space-y-6"
        data-array-path={section.path}
        data-array-prepend={prependNew ? "true" : "false"}
      >
        {orderBanner}
        {prependNew ? addButton : null}
        {enableDrag ? (
          <Reorder.Group
            as="div"
            axis="y"
            values={items}
            onReorder={updateItems}
            className={`space-y-6${reviewPane ? " edit-flow-item" : ""}`}
            data-testid="array-reorder-group"
          >
            {rowNodes}
          </Reorder.Group>
        ) : (
          rowNodes
        )}
        {prependNew || !addButton ? null : (
          <div
            className={`edit-add-wrap border-t border-[var(--border)] pt-4${
              reviewPane ? " edit-flow-item" : ""
            }`}
          >
            {addButton}
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
  resolveAgainst: Resume | null,
  reviewPane: "source" | "target" | undefined,
  changedLabel: string | undefined,
  resolvedLabel: string | undefined,
  removedItemLabel: string | undefined,
  addedItemLabel: string | undefined,
  addedOnSourceLabel: string | undefined,
  orderChangedLabel: string | undefined,
  orderResolvedLabel: string | undefined,
  applySourceOrderLabel: string | undefined,
  dragToReorderLabel: string | undefined,
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
        orderChangedLabel={orderChangedLabel}
        orderResolvedLabel={orderResolvedLabel}
        applySourceOrderLabel={applySourceOrderLabel}
        dragToReorderLabel={dragToReorderLabel}
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
  orderChangedLabel = "Order changed",
  orderResolvedLabel = "Order updated",
  applySourceOrderLabel = "Apply source order",
  dragToReorderLabel = "Drag to reorder",
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
          orderChangedLabel,
          orderResolvedLabel,
          applySourceOrderLabel,
          dragToReorderLabel,
        ),
      )}
    </>
  );
}

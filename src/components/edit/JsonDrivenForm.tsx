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
import { fieldValuesEqual } from "@/lib/form-diff";
import {
  Field,
  GhostButton,
  SectionCard,
  TextArea,
  TextInput,
} from "@/components/edit/form-ui";

type JsonDrivenFormProps = {
  data: Resume;
  onChange?: (next: Resume) => void;
  readOnly?: boolean;
  /**
   * Frozen snapshot to compare against. Required for dirty marks.
   * Must NOT be the live `data` object — pass a write-once baseline.
   */
  compareAgainst?: Resume | null;
  changedLabel?: string;
  removedItemLabel?: string;
  addedItemLabel?: string;
};

function isDirty(
  baseline: Resume | null | undefined,
  absolutePath: string,
  value: unknown,
): boolean {
  if (!baseline) return false;
  return !fieldValuesEqual(getAtPath(baseline, absolutePath), value);
}

function FieldControl({
  field,
  value,
  onChange,
  readOnly,
  dirty,
  changedLabel,
  baselineValue,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  dirty?: boolean;
  changedLabel?: string;
  baselineValue?: unknown;
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
        baselineValue={baselineValue}
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
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  dirty?: boolean;
  changedLabel?: string;
  baselineValue?: unknown;
}) {
  const committed = listToLines(value);
  const [text, setText] = useState(committed);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(listToLines(value));
  }, [value, focused]);

  const liveDirty =
    baselineValue !== undefined
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
  baseline,
  changedLabel,
}: {
  fields: FormFieldConfig[];
  data: unknown;
  onChange: (path: string, value: unknown) => void;
  readOnly?: boolean;
  pathPrefix?: string;
  baseline: Resume | null;
  changedLabel?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const absolutePath = pathPrefix
          ? `${pathPrefix}.${field.path}`
          : field.path;
        const value = getAtPath(data, field.path);
        const dirty = isDirty(baseline, absolutePath, value);
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
              baselineValue={
                baseline ? getAtPath(baseline, absolutePath) : undefined
              }
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
  baseline,
  changedLabel,
  removedItemLabel,
  addedItemLabel,
}: {
  section: ArraySection;
  data: Resume;
  onChange: (next: Resume) => void;
  readOnly?: boolean;
  baseline: Resume | null;
  changedLabel?: string;
  removedItemLabel?: string;
  addedItemLabel?: string;
}) {
  const items = (getAtPath(data, section.path) as Record<string, unknown>[]) ?? [];
  const baselineItems =
    (baseline
      ? (getAtPath(baseline, section.path) as Record<string, unknown>[])
      : null) ?? [];
  const removedCount = Math.max(0, baselineItems.length - items.length);

  function updateItems(nextItems: Record<string, unknown>[]) {
    onChange(setAtPath(data, section.path, nextItems));
  }

  return (
    <SectionCard id={section.id} title={section.label}>
      <div className="space-y-6">
        {items.map((item, index) => {
          const isNew = Boolean(baseline) && index >= baselineItems.length;
          const itemDirty =
            Boolean(baseline) &&
            !fieldValuesEqual(baselineItems[index], item);

          return (
            <div
              key={index}
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
                  {section.itemLabel} #{index + 1}
                  {isNew ? ` · ${addedItemLabel ?? "New"}` : null}
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
                      updateItems(items.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove
                  </GhostButton>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const absolutePath = `${section.path}.${index}.${field.path}`;
                  const value = getAtPath(item, field.path);
                  const dirty = isDirty(baseline, absolutePath, value);
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
                        baselineValue={
                          baseline
                            ? getAtPath(baseline, absolutePath)
                            : undefined
                        }
                        onChange={(next) => {
                          if (readOnly) return;
                          const nextItems = items.map((current, itemIndex) =>
                            itemIndex === index
                              ? (setAtPath(current, field.path, next) as Record<
                                  string,
                                  unknown
                                >)
                              : current,
                          );
                          updateItems(nextItems);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {removedCount > 0
          ? Array.from({ length: removedCount }, (_, offset) => {
              const index = items.length + offset;
              return (
                <div
                  key={`removed-${index}`}
                  className="space-y-2 border border-dashed border-red-500/60 bg-red-500/5 px-3 py-3"
                >
                  <p className="flex items-center gap-2 font-mono text-xs text-red-500">
                    {section.itemLabel} #{index + 1}
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      !
                    </span>
                    <span className="tracking-wide uppercase">
                      {removedItemLabel ?? "Removed"}
                    </span>
                  </p>
                </div>
              );
            })
          : null}

        {readOnly ? null : (
          <div className="border-t border-[var(--border)] pt-4">
            <GhostButton
              onClick={() =>
                updateItems([
                  ...items,
                  structuredClone(section.defaultItem) as Record<string, unknown>,
                ])
              }
            >
              {section.addLabel}
            </GhostButton>
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
  baseline: Resume | null,
  changedLabel: string | undefined,
  removedItemLabel: string | undefined,
  addedItemLabel: string | undefined,
) {
  if (section.kind === "array") {
    return (
      <ArraySectionCard
        key={section.id}
        section={section}
        data={data}
        onChange={onChange}
        readOnly={readOnly}
        baseline={baseline}
        changedLabel={changedLabel}
        removedItemLabel={removedItemLabel}
        addedItemLabel={addedItemLabel}
      />
    );
  }

  return (
    <SectionCard key={section.id} id={section.id} title={section.label}>
      <FieldsGrid
        fields={section.fields}
        data={data}
        readOnly={readOnly}
        baseline={baseline}
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
  changedLabel = "Changed",
  removedItemLabel = "Removed",
  addedItemLabel = "New",
}: JsonDrivenFormProps) {
  const handleChange = onChange ?? (() => {});
  // Use the provided snapshot as-is. Never fall back to live `data`.
  const baseline = readOnly ? null : (compareAgainst ?? null);

  return (
    <>
      {editForm.sections.map((section) =>
        renderSection(
          section,
          data,
          handleChange,
          readOnly,
          baseline,
          changedLabel,
          removedItemLabel,
          addedItemLabel,
        ),
      )}
    </>
  );
}

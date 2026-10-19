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
  /** When set, fields that differ from this snapshot are marked. */
  compareAgainst?: Resume | null;
  changedLabel?: string;
  /** Label for array rows that existed in the baseline but were removed. */
  removedItemLabel?: string;
  /** Label for array rows added after the baseline. */
  addedItemLabel?: string;
};

function FieldControl({
  field,
  value,
  onChange,
  readOnly,
  changed,
  changedLabel,
  baselineValue,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  changed?: boolean;
  changedLabel?: string;
  baselineValue?: unknown;
}) {
  if (field.type === "textarea") {
    return (
      <Field
        label={field.label}
        hint={field.hint}
        changed={changed}
        changedLabel={changedLabel}
      >
        <TextArea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          changed={changed}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.stopPropagation();
            }
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
        changed={changed}
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
      changed={changed}
      changedLabel={changedLabel}
    >
      <TextInput
        type={inputType}
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        changed={changed}
      />
    </Field>
  );
}

function LinesField({
  field,
  value,
  onChange,
  readOnly,
  changed,
  changedLabel,
  baselineValue,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  changed?: boolean;
  changedLabel?: string;
  baselineValue?: unknown;
}) {
  const committed = listToLines(value);
  const [text, setText] = useState(committed);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(listToLines(value));
  }, [value, focused]);

  const liveChanged =
    baselineValue !== undefined
      ? !fieldValuesEqual(baselineValue, focused ? linesToList(text) : value)
      : Boolean(changed);

  return (
    <Field
      label={field.label}
      hint={field.hint}
      changed={liveChanged}
      changedLabel={changedLabel}
    >
      <TextArea
        value={focused ? text : committed}
        readOnly={readOnly}
        changed={liveChanged}
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

function isChanged(
  compareAgainst: Resume | null | undefined,
  absolutePath: string,
  value: unknown,
): boolean {
  if (!compareAgainst) return false;
  return !fieldValuesEqual(getAtPath(compareAgainst, absolutePath), value);
}

function FieldsGrid({
  fields,
  data,
  onChange,
  readOnly,
  pathPrefix = "",
  compareAgainst,
  changedLabel,
}: {
  fields: FormFieldConfig[];
  data: unknown;
  onChange: (path: string, value: unknown) => void;
  readOnly?: boolean;
  pathPrefix?: string;
  compareAgainst?: Resume | null;
  changedLabel?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const absolutePath = pathPrefix
          ? `${pathPrefix}.${field.path}`
          : field.path;
        const value = getAtPath(data, field.path);
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
              changed={isChanged(compareAgainst, absolutePath, value)}
              changedLabel={changedLabel}
              baselineValue={
                compareAgainst
                  ? getAtPath(compareAgainst, absolutePath)
                  : undefined
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
  compareAgainst,
  changedLabel,
  removedItemLabel,
  addedItemLabel,
}: {
  section: ArraySection;
  data: Resume;
  onChange: (next: Resume) => void;
  readOnly?: boolean;
  compareAgainst?: Resume | null;
  changedLabel?: string;
  removedItemLabel?: string;
  addedItemLabel?: string;
}) {
  const items = (getAtPath(data, section.path) as Record<string, unknown>[]) ?? [];
  const compareItems =
    (compareAgainst
      ? (getAtPath(compareAgainst, section.path) as Record<string, unknown>[])
      : null) ?? [];
  const removedCount = Math.max(0, compareItems.length - items.length);

  function updateItems(nextItems: Record<string, unknown>[]) {
    onChange(setAtPath(data, section.path, nextItems));
  }

  return (
    <SectionCard id={section.id} title={section.label}>
      <div className="space-y-6">
        {items.map((item, index) => {
          const isNew = Boolean(compareAgainst) && index >= compareItems.length;
          const itemChanged =
            Boolean(compareAgainst) &&
            !fieldValuesEqual(compareItems[index], item);

          return (
            <div
              key={index}
              className={`space-y-3 border-t pt-6 first:border-t-0 first:pt-0 ${
                itemChanged ? "border-red-500/50" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`font-mono text-xs ${
                    itemChanged ? "text-red-400" : "text-[var(--accent)]"
                  }`}
                >
                  {section.itemLabel} #{index + 1}
                  {isNew ? ` · ${addedItemLabel ?? "New"}` : null}
                  {itemChanged ? (
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
                  return (
                    <div
                      key={field.path}
                      className={field.fullWidth ? "sm:col-span-2" : undefined}
                    >
                      <FieldControl
                        field={field}
                        value={value}
                        readOnly={readOnly}
                        changed={isChanged(compareAgainst, absolutePath, value)}
                        changedLabel={changedLabel}
                        baselineValue={
                          compareAgainst
                            ? getAtPath(compareAgainst, absolutePath)
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
                  <p className="flex items-center gap-2 font-mono text-xs text-red-400">
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
  readOnly?: boolean,
  compareAgainst?: Resume | null,
  changedLabel?: string,
  removedItemLabel?: string,
  addedItemLabel?: string,
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
        compareAgainst={compareAgainst}
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

  return (
    <>
      {editForm.sections.map((section) =>
        renderSection(
          section,
          data,
          handleChange,
          readOnly,
          compareAgainst,
          changedLabel,
          removedItemLabel,
          addedItemLabel,
        ),
      )}
    </>
  );
}

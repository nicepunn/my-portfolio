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
  /** When set, fields that differ from this snapshot are marked as changed. */
  compareAgainst?: Resume | null;
  changedLabel?: string;
};

/** Keep raw text while typing so Enter can insert blank lines before blur commit. */
function LinesTextArea({
  value,
  onChange,
  readOnly,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}) {
  const committed = listToLines(value);
  const [text, setText] = useState(committed);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(listToLines(value));
    }
  }, [value, focused]);

  return (
    <TextArea
      value={focused ? text : committed}
      readOnly={readOnly}
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
        if (event.key === "Enter") {
          event.stopPropagation();
        }
      }}
    />
  );
}

function FieldControl({
  field,
  value,
  onChange,
  readOnly,
  changed,
  changedLabel,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  changed?: boolean;
  changedLabel?: string;
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
      <Field
        label={field.label}
        hint={field.hint}
        changed={changed}
        changedLabel={changedLabel}
      >
        <LinesTextArea
          value={value}
          onChange={onChange}
          readOnly={readOnly}
        />
      </Field>
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
}: {
  section: ArraySection;
  data: Resume;
  onChange: (next: Resume) => void;
  readOnly?: boolean;
  compareAgainst?: Resume | null;
  changedLabel?: string;
}) {
  const items = (getAtPath(data, section.path) as Record<string, unknown>[]) ?? [];
  const compareItems =
    (compareAgainst
      ? (getAtPath(compareAgainst, section.path) as Record<string, unknown>[])
      : null) ?? [];

  function updateItems(nextItems: Record<string, unknown>[]) {
    onChange(setAtPath(data, section.path, nextItems));
  }

  return (
    <SectionCard id={section.id} title={section.label}>
      <div className="space-y-6">
        {items.map((item, index) => {
          const itemChanged =
            Boolean(compareAgainst) &&
            !fieldValuesEqual(compareItems[index], item);

          return (
            <div
              key={index}
              className={`space-y-3 border-t pt-6 first:border-t-0 first:pt-0 ${
                itemChanged
                  ? "border-red-400/40"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`font-mono text-xs ${
                    itemChanged ? "text-red-400" : "text-[var(--accent)]"
                  }`}
                >
                  {section.itemLabel} #{index + 1}
                  {itemChanged ? " !" : ""}
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
        ),
      )}
    </>
  );
}

"use client";

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
  Field,
  GhostButton,
  SectionCard,
  TextArea,
  TextInput,
} from "@/components/edit/form-ui";

type JsonDrivenFormProps = {
  data: Resume;
  onChange: (next: Resume) => void;
};

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "textarea") {
    return (
      <Field label={field.label} hint={field.hint}>
        <TextArea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    );
  }

  if (field.type === "lines") {
    return (
      <Field label={field.label} hint={field.hint}>
        <TextArea
          value={listToLines(value)}
          onChange={(event) => onChange(linesToList(event.target.value))}
        />
      </Field>
    );
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "url" ? "url" : "text";

  return (
    <Field label={field.label} hint={field.hint}>
      <TextInput
        type={inputType}
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function FieldsGrid({
  fields,
  data,
  onChange,
}: {
  fields: FormFieldConfig[];
  data: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.path}
          className={field.fullWidth ? "sm:col-span-2" : undefined}
        >
          <FieldControl
            field={field}
            value={getAtPath(data, field.path)}
            onChange={(value) => onChange(field.path, value)}
          />
        </div>
      ))}
    </div>
  );
}

function ArraySectionCard({
  section,
  data,
  onChange,
}: {
  section: ArraySection;
  data: Resume;
  onChange: (next: Resume) => void;
}) {
  const items = (getAtPath(data, section.path) as Record<string, unknown>[]) ?? [];

  function updateItems(nextItems: Record<string, unknown>[]) {
    onChange(setAtPath(data, section.path, nextItems));
  }

  return (
    <SectionCard id={section.id} title={section.label}>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="space-y-3 border-t border-[var(--border)] pt-6 first:border-t-0 first:pt-0"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-[var(--accent)]">
                {section.itemLabel} #{index + 1}
              </p>
              <GhostButton
                danger
                onClick={() =>
                  updateItems(items.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                Remove
              </GhostButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div
                  key={field.path}
                  className={field.fullWidth ? "sm:col-span-2" : undefined}
                >
                  <FieldControl
                    field={field}
                    value={getAtPath(item, field.path)}
                    onChange={(value) => {
                      const nextItems = items.map((current, itemIndex) =>
                        itemIndex === index
                          ? (setAtPath(current, field.path, value) as Record<
                              string,
                              unknown
                            >)
                          : current,
                      );
                      updateItems(nextItems);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

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
      </div>
    </SectionCard>
  );
}

function renderSection(
  section: FormSection,
  data: Resume,
  onChange: (next: Resume) => void,
) {
  if (section.kind === "array") {
    return (
      <ArraySectionCard
        key={section.id}
        section={section}
        data={data}
        onChange={onChange}
      />
    );
  }

  return (
    <SectionCard key={section.id} id={section.id} title={section.label}>
      <FieldsGrid
        fields={section.fields}
        data={data}
        onChange={(path, value) => onChange(setAtPath(data, path, value))}
      />
    </SectionCard>
  );
}

export function JsonDrivenForm({ data, onChange }: JsonDrivenFormProps) {
  return (
    <>
      {editForm.sections.map((section) => renderSection(section, data, onChange))}
    </>
  );
}

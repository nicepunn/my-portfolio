import editFormJson from "@/data/edit-form.json";

export type FieldType = "text" | "email" | "url" | "textarea" | "lines";

export type FormFieldConfig = {
  path: string;
  label: string;
  type: FieldType;
  hint?: string;
  fullWidth?: boolean;
};

export type FieldsSection = {
  id: string;
  label: string;
  kind: "fields";
  fields: FormFieldConfig[];
};

export type ArraySection = {
  id: string;
  label: string;
  kind: "array";
  path: string;
  addLabel: string;
  itemLabel: string;
  defaultItem: Record<string, unknown>;
  fields: FormFieldConfig[];
};

export type FormSection = FieldsSection | ArraySection;

export type EditFormConfig = {
  sections: FormSection[];
};

export const editForm = editFormJson as EditFormConfig;

export const editSections = editForm.sections.map((section) => ({
  id: section.id,
  label: section.label,
}));

export function getAtPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, root);
}

export function setAtPath<T>(root: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = structuredClone(root) as Record<string, unknown>;
  let cursor: Record<string, unknown> = clone;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const next = cursor[key];
    if (next == null || typeof next !== "object") {
      cursor[key] = {};
    } else {
      cursor[key] = Array.isArray(next) ? [...next] : { ...next };
    }
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[keys[keys.length - 1]] = value;
  return clone as T;
}

export function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function listToLines(items: unknown) {
  if (!Array.isArray(items)) return "";
  return items.map(String).join("\n");
}

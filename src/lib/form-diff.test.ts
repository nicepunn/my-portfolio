import { describe, expect, it } from "vitest";
import {
  alignArrayRowsSameLocale,
  alignTargetRowsToSourceDiff,
  arrayItemIdentity,
  fieldDirtyOnAlignedRow,
  fieldValuesEqual,
} from "@/lib/form-diff";

const job = (company: string, period: string, role = "Dev") => ({
  company,
  period,
  role,
  bullets: ["did things"],
});

describe("fieldValuesEqual", () => {
  it("treats identical primitives and nullish pairs as equal", () => {
    expect(fieldValuesEqual("a", "a")).toBe(true);
    expect(fieldValuesEqual(null, undefined)).toBe(true);
    expect(fieldValuesEqual(null, "x")).toBe(false);
  });

  it("compares arrays and objects by JSON value", () => {
    expect(fieldValuesEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(fieldValuesEqual(["a"], ["b"])).toBe(false);
    expect(fieldValuesEqual({ a: 1 }, { a: 1 })).toBe(true);
  });
});

describe("arrayItemIdentity", () => {
  it("keys experience by company and period", () => {
    expect(arrayItemIdentity("experience", job("Acme", "2024"), 0)).toBe(
      "experience:Acme|2024",
    );
  });

  it("keys projects by name and skills by label", () => {
    expect(arrayItemIdentity("projects", { name: "Heathub" }, 0)).toBe(
      "projects:Heathub",
    );
    expect(arrayItemIdentity("skills", { label: "Frontend" }, 0)).toBe(
      "skills:Frontend",
    );
  });

  it("falls back to index for unknown sections", () => {
    expect(arrayItemIdentity("other", { x: 1 }, 3)).toBe("other:#3");
  });
});

describe("alignArrayRowsSameLocale", () => {
  const a = job("A", "2025");
  const b = job("B", "2024");
  const c = job("C", "2023");

  it("marks unchanged rows when content matches", () => {
    const rows = alignArrayRowsSameLocale("experience", [a, b], [a, b]);
    expect(rows.map((r) => r.status)).toEqual(["unchanged", "unchanged"]);
  });

  it("marks field edits as changed without shifting neighbors", () => {
    const edited = { ...b, role: "Lead" };
    const rows = alignArrayRowsSameLocale("experience", [a, b, c], [a, edited, c]);
    expect(rows.map((r) => r.status)).toEqual([
      "unchanged",
      "changed",
      "unchanged",
    ]);
    expect(rows[1]?.originalIndex).toBe(1);
  });

  it("detects middle removes and keeps later rows paired", () => {
    const rows = alignArrayRowsSameLocale("experience", [a, b, c], [a, c]);
    expect(rows.map((r) => r.status)).toEqual([
      "unchanged",
      "removed",
      "unchanged",
    ]);
    expect(rows[1]?.originalIndex).toBe(1);
    expect(rows[2]?.dataIndex).toBe(1);
  });

  it("detects newly added rows", () => {
    const d = job("D", "2026");
    const rows = alignArrayRowsSameLocale("experience", [a, b], [d, a, b]);
    expect(rows.map((r) => r.status)).toEqual(["added", "unchanged", "unchanged"]);
    expect(rows[0]?.dataIndex).toBe(0);
  });

  it("treats pure reorder as unchanged content (order not tracked yet)", () => {
    const rows = alignArrayRowsSameLocale("experience", [a, b, c], [c, a, b]);
    expect(rows.map((r) => r.status)).toEqual([
      "unchanged",
      "unchanged",
      "unchanged",
    ]);
    expect(rows.map((r) => r.dataIndex)).toEqual([0, 1, 2]);
    expect(rows.map((r) => (r.dataItem as { company: string }).company)).toEqual([
      "C",
      "A",
      "B",
    ]);
  });
});

describe("alignTargetRowsToSourceDiff", () => {
  const enA = job("Acme", "2025");
  const enB = job("Beta", "2024");
  const enC = job("Coral", "2023");
  const thA = job("แอคมี", "2025");
  const thB = job("เบต้า", "2024");
  const thC = job("คอรัล", "2023");

  it("pairs target rows by cursor in source current order", () => {
    const rows = alignTargetRowsToSourceDiff(
      "experience",
      [enA, enB, enC],
      [enA, enB, enC],
      [thA, thB, thC],
    );
    expect(rows.map((r) => (r.dataItem as { company: string }).company)).toEqual([
      "แอคมี",
      "เบต้า",
      "คอรัล",
    ]);
  });

  it("keeps pending remove slots on target until deleted", () => {
    const rows = alignTargetRowsToSourceDiff(
      "experience",
      [enA, enB, enC],
      [enA, enC],
      [thA, thB, thC],
    );
    expect(rows.map((r) => r.status)).toEqual([
      "unchanged",
      "removed",
      "unchanged",
    ]);
    expect(rows[1]?.dataItem).toEqual(thB);
    expect(rows[2]?.dataItem).toEqual(thC);
  });

  it("marks synced remove after target row is deleted", () => {
    const rows = alignTargetRowsToSourceDiff(
      "experience",
      [enA, enB, enC],
      [enA, enC],
      [thA, thC],
    );
    expect(rows.map((r) => r.status)).toEqual([
      "unchanged",
      "removed",
      "unchanged",
    ]);
    expect(rows[1]?.dataItem).toBeNull();
    expect(rows[1]?.dataIndex).toBe(-1);
    expect(rows[2]?.dataItem).toEqual(thC);
  });

  it("consumes target rows by cursor when source adds; trailing source may be missing", () => {
    const enD = job("Delta", "2026");
    const rows = alignTargetRowsToSourceDiff(
      "experience",
      [enA, enB],
      [enD, enA, enB],
      [thA, thB],
    );
    expect(rows.map((r) => r.status)).toEqual(["added", "unchanged", "unchanged"]);
    // Added source row still takes the next target slot (positional, not identity).
    expect(rows[0]?.dataItem).toEqual(thA);
    expect(rows[1]?.dataItem).toEqual(thB);
    expect(rows[2]?.dataIndex).toBe(-1);
    expect(rows[2]?.dataItem).toBeNull();
  });

  it("mis-pairs target fields after source reorder (documents current risk)", () => {
    const rows = alignTargetRowsToSourceDiff(
      "experience",
      [enA, enB, enC],
      [enC, enA, enB],
      [thA, thB, thC],
    );
    // Cursor pairs by position in source current order, not identity across locales.
    expect(rows.map((r) => (r.dataItem as { company: string }).company)).toEqual([
      "แอคมี",
      "เบต้า",
      "คอรัล",
    ]);
    expect(rows.map((r) => (r.currentItem as { company: string }).company)).toEqual([
      "Coral",
      "Acme",
      "Beta",
    ]);
  });
});

describe("fieldDirtyOnAlignedRow", () => {
  it("is dirty for added and removed rows", () => {
    expect(
      fieldDirtyOnAlignedRow(
        {
          key: "x",
          dataIndex: 0,
          currentIndex: 0,
          originalIndex: -1,
          status: "added",
          dataItem: job("A", "1"),
          originalItem: null,
          currentItem: job("A", "1"),
        },
        "role",
      ),
    ).toBe(true);
  });

  it("is dirty only for fields that actually changed", () => {
    const original = job("A", "2024", "Dev");
    const current = { ...original, role: "Lead" };
    const row = {
      key: "experience:A|2024",
      dataIndex: 0,
      currentIndex: 0,
      originalIndex: 0,
      status: "changed" as const,
      dataItem: current,
      originalItem: original,
      currentItem: current,
    };
    expect(fieldDirtyOnAlignedRow(row, "role")).toBe(true);
    expect(fieldDirtyOnAlignedRow(row, "company")).toBe(false);
  });
});

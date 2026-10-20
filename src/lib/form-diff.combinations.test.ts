import { describe, expect, it } from "vitest";
import {
  alignArrayRowsSameLocale,
  alignTargetRowsToSourceDiff,
  fieldDirtyOnAlignedRow,
  type AlignedArrayRow,
} from "@/lib/form-diff";
import {
  insertArrayItem,
  removeArrayItemAt,
  updateArrayItemField,
  type ArrayItem,
} from "@/lib/dynamic-form-array";

const job = (
  company: string,
  period: string,
  role = "Dev",
  bullets: string[] = ["did things"],
): ArrayItem => ({ company, period, role, bullets });

const A = job("Acme", "2025");
const B = job("Beta", "2024");
const C = job("Coral", "2023");
const D = job("Delta", "2026");

const thA = job("Acme", "กรกฎาคม 2025", "นักพัฒนา");
const thB = job("Beta", "เมษายน 2024", "นักพัฒนา");
const thC = job("Coral", "2023", "นักพัฒนา");

function companies(rows: AlignedArrayRow[], which: "current" | "data") {
  return rows.map((row) => {
    const item = which === "current" ? row.currentItem : row.dataItem;
    return item ? String(item.company) : null;
  });
}

function statuses(rows: AlignedArrayRow[]) {
  return rows.map((row) => row.status);
}

type ComboCase = {
  name: string;
  /** Build source current from [A,B,C] using mutations. */
  apply: (items: ArrayItem[]) => ArrayItem[];
  expectStatuses: AlignedArrayRow["status"][];
  /** Companies on source currentItem (null for removed slots). */
  expectCurrentCompanies: (string | null)[];
  /** Target companies paired to each display row (null = unpaired). */
  expectTargetCompanies: (string | null)[];
  /** Field-level dirty checks on first matching live row. */
  dirty?: { company: string; fields: Record<string, boolean> };
};

/**
 * Combinations of add / remove / partial field edit on experience,
 * asserting same-locale status + cross-locale target pairing.
 */
const comboCases: ComboCase[] = [
  {
    name: "edit only role on B",
    apply: (items) => updateArrayItemField(items, 1, "role", "Lead"),
    expectStatuses: ["unchanged", "changed", "unchanged"],
    expectCurrentCompanies: ["Acme", "Beta", "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
    dirty: { company: "Beta", fields: { role: true, company: false, period: false } },
  },
  {
    name: "edit only bullets on A",
    apply: (items) =>
      updateArrayItemField(items, 0, "bullets", ["new impact"]),
    expectStatuses: ["changed", "unchanged", "unchanged"],
    expectCurrentCompanies: ["Acme", "Beta", "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
    dirty: {
      company: "Acme",
      fields: { bullets: true, role: false, company: false },
    },
  },
  {
    name: "edit two non-identity fields on same row (role + bullets)",
    apply: (items) =>
      updateArrayItemField(
        updateArrayItemField(items, 0, "role", "Staff"),
        0,
        "bullets",
        ["impact a", "impact b"],
      ),
    expectStatuses: ["changed", "unchanged", "unchanged"],
    expectCurrentCompanies: ["Acme", "Beta", "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
    dirty: {
      company: "Acme",
      fields: { role: true, bullets: true, company: false, period: false },
    },
  },
  {
    name: "edit role on A and bullets on C",
    apply: (items) =>
      updateArrayItemField(
        updateArrayItemField(items, 0, "role", "Staff"),
        2,
        "bullets",
        ["coral only"],
      ),
    expectStatuses: ["changed", "unchanged", "changed"],
    expectCurrentCompanies: ["Acme", "Beta", "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
  },
  {
    name: "changing period breaks identity (remove old + add new)",
    apply: (items) =>
      updateArrayItemField(items, 0, "period", "2025 – Now"),
    expectStatuses: ["removed", "added", "unchanged", "unchanged"],
    expectCurrentCompanies: [null, "Acme", "Beta", "Coral"],
    // Pending-remove keeps the TH row; the new-period Acme is treated as added/missing.
    expectTargetCompanies: ["Acme", null, "Beta", "Coral"],
  },
  {
    name: "add only (prepend D)",
    apply: (items) => insertArrayItem(items, D, "start"),
    expectStatuses: ["added", "unchanged", "unchanged", "unchanged"],
    expectCurrentCompanies: ["Delta", "Acme", "Beta", "Coral"],
    expectTargetCompanies: [null, "Acme", "Beta", "Coral"],
  },
  {
    name: "remove only (middle B)",
    apply: (items) => removeArrayItemAt(items, 1),
    expectStatuses: ["unchanged", "removed", "unchanged"],
    expectCurrentCompanies: ["Acme", null, "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
  },
  {
    name: "remove only (first A)",
    apply: (items) => removeArrayItemAt(items, 0),
    expectStatuses: ["removed", "unchanged", "unchanged"],
    expectCurrentCompanies: [null, "Beta", "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
  },
  {
    name: "add + remove (prepend D, drop B) — removed spliced at original index",
    apply: (items) =>
      removeArrayItemAt(insertArrayItem(items, D, "start"), 2),
    expectStatuses: ["added", "removed", "unchanged", "unchanged"],
    expectCurrentCompanies: ["Delta", null, "Acme", "Coral"],
    expectTargetCompanies: [null, "Beta", "Acme", "Coral"],
  },
  {
    name: "add + edit existing (prepend D, change A.role)",
    apply: (items) =>
      updateArrayItemField(
        insertArrayItem(items, D, "start"),
        1,
        "role",
        "Staff",
      ),
    expectStatuses: ["added", "changed", "unchanged", "unchanged"],
    expectCurrentCompanies: ["Delta", "Acme", "Beta", "Coral"],
    expectTargetCompanies: [null, "Acme", "Beta", "Coral"],
    dirty: { company: "Acme", fields: { role: true, company: false } },
  },
  {
    name: "remove + edit remaining (drop B, change C.role)",
    apply: (items) =>
      updateArrayItemField(removeArrayItemAt(items, 1), 1, "role", "Senior"),
    expectStatuses: ["unchanged", "removed", "changed"],
    expectCurrentCompanies: ["Acme", null, "Coral"],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
    dirty: { company: "Coral", fields: { role: true, company: false } },
  },
  {
    name: "add + remove + edit (D in, B out, C.role)",
    apply: (items) => {
      let next = insertArrayItem(items, D, "start"); // D,A,B,C
      next = removeArrayItemAt(next, 2); // D,A,C
      next = updateArrayItemField(next, 2, "role", "Principal");
      return next;
    },
    expectStatuses: ["added", "removed", "unchanged", "changed"],
    expectCurrentCompanies: ["Delta", null, "Acme", "Coral"],
    expectTargetCompanies: [null, "Beta", "Acme", "Coral"],
    dirty: { company: "Coral", fields: { role: true, period: false } },
  },
  {
    name: "edit A.role + edit B.bullets + remove C",
    apply: (items) => {
      let next = updateArrayItemField(items, 0, "role", "R1");
      next = updateArrayItemField(next, 1, "bullets", ["beta only"]);
      next = removeArrayItemAt(next, 2);
      return next;
    },
    expectStatuses: ["changed", "changed", "removed"],
    expectCurrentCompanies: ["Acme", "Beta", null],
    expectTargetCompanies: ["Acme", "Beta", "Coral"],
  },
  {
    name: "add two then remove one original",
    apply: (items) => {
      let next = insertArrayItem(items, D, "start");
      next = insertArrayItem(next, job("Echo", "2027"), "start");
      next = removeArrayItemAt(next, 3); // Echo,D,A,B,C → drop B
      return next;
    },
    expectStatuses: ["added", "removed", "added", "unchanged", "unchanged"],
    expectCurrentCompanies: ["Echo", null, "Delta", "Acme", "Coral"],
    expectTargetCompanies: [null, "Beta", null, "Acme", "Coral"],
  },
  {
    name: "partial edit after remove+add keeps identity pairing",
    apply: (items) => {
      let next = removeArrayItemAt(items, 0); // B,C
      next = insertArrayItem(next, D, "start"); // D,B,C
      next = updateArrayItemField(next, 1, "bullets", ["only bullets"]);
      return next;
    },
    expectStatuses: ["removed", "added", "changed", "unchanged"],
    expectCurrentCompanies: [null, "Delta", "Beta", "Coral"],
    expectTargetCompanies: ["Acme", null, "Beta", "Coral"],
    dirty: {
      company: "Beta",
      fields: { bullets: true, role: false, company: false },
    },
  },
];

describe("experience operation combinations (same-locale + cross-locale)", () => {
  const original = [A, B, C];
  const target = [thA, thB, thC];

  it.each(comboCases)(
    "$name",
    ({
      apply,
      expectStatuses,
      expectCurrentCompanies,
      expectTargetCompanies,
      dirty,
    }) => {
      const current = apply(structuredClone(original));

      const sourceRows = alignArrayRowsSameLocale(
        "experience",
        original,
        current,
      );
      expect(statuses(sourceRows)).toEqual(expectStatuses);
      expect(companies(sourceRows, "current")).toEqual(expectCurrentCompanies);

      if (dirty) {
        const row = sourceRows.find(
          (r) =>
            r.status !== "removed" &&
            r.currentItem &&
            r.currentItem.company === dirty.company,
        );
        expect(row).toBeTruthy();
        for (const [field, expected] of Object.entries(dirty.fields)) {
          expect(fieldDirtyOnAlignedRow(row!, field)).toBe(expected);
        }
      }

      const targetRows = alignTargetRowsToSourceDiff(
        "experience",
        original,
        current,
        target,
      );
      expect(statuses(targetRows)).toEqual(expectStatuses);
      expect(companies(targetRows, "data")).toEqual(expectTargetCompanies);
    },
  );
});

describe("projects / skills combination smoke", () => {
  it("projects: add + rename existing + remove another", () => {
    const p1 = { name: "Heathub", url: "https://a.test", stack: "Next" };
    const p2 = { name: "Serper", url: "https://b.test", stack: "TS" };
    const p3 = { name: "Hiwhiw", url: "", stack: "Go" };
    const original = [p1, p2, p3];
    let current = insertArrayItem(
      original,
      { name: "NewApp", url: "https://new.test", stack: "x" },
      "end",
    );
    current = updateArrayItemField(current, 0, "stack", "Next.js");
    current = removeArrayItemAt(current, 2);

    const rows = alignArrayRowsSameLocale("projects", original, current);
    expect(statuses(rows)).toEqual([
      "changed",
      "unchanged",
      "removed",
      "added",
    ]);

    const th = [
      { name: "Heathub", url: "https://a.test", stack: "Next" },
      { name: "Serper", url: "https://b.test", stack: "TS" },
      { name: "Hiwhiw", url: "", stack: "Go" },
    ];
    const targetRows = alignTargetRowsToSourceDiff(
      "projects",
      original,
      current,
      th,
    );
    expect(
      targetRows.map((r) => (r.dataItem ? String(r.dataItem.name) : null)),
    ).toEqual(["Heathub", "Serper", "Hiwhiw", null]);
  });

  it("skills: edit items only + add group + remove translated-label group via overlap", () => {
    const g1 = {
      label: "Languages",
      items: ["[***TypeScript***]", "[*Python*]"],
    };
    const g2 = {
      label: "Front-End",
      items: ["[***React***]", "[***Next.js***]"],
    };
    const g3 = {
      label: "Back-End",
      items: ["[***Node.js***]"],
    };
    const original = [g1, g2, g3];
    let current = updateArrayItemField(original, 0, "items", [
      "[***TypeScript***]",
      "[*Python*]",
      "Go",
    ]);
    current = insertArrayItem(
      current,
      { label: "Observability", items: ["[*Datadog*]"] },
      "end",
    );
    current = removeArrayItemAt(current, 2);

    const th = [
      {
        label: "ภาษาโปรแกรม",
        items: ["[***TypeScript***]", "[*Python*]"],
      },
      {
        label: "Front-End",
        items: ["[***React***]", "[***Next.js***]"],
      },
      {
        label: "Back-End",
        items: ["[***Node.js***]"],
      },
    ];

    const targetRows = alignTargetRowsToSourceDiff(
      "skills",
      original,
      current,
      th,
    );
    expect(statuses(targetRows)).toEqual([
      "changed",
      "unchanged",
      "removed",
      "added",
    ]);
    expect(
      targetRows.map((r) => (r.dataItem ? String(r.dataItem.label) : null)),
    ).toEqual(["ภาษาโปรแกรม", "Front-End", "Back-End", null]);
  });
});

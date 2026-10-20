import { describe, expect, it } from "vitest";
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
  updateArrayItemField,
  writeArrayItems,
  type ArrayItem,
} from "@/lib/dynamic-form-array";
import type { Resume } from "@/lib/resume-schema";

const job = (company: string, period: string, role = "Dev"): ArrayItem => ({
  company,
  period,
  role,
  bullets: ["did things"],
});

function sampleResume(experience: ArrayItem[]): Resume {
  return {
    name: "Punnawat Lohanuit",
    headline: "Full-stack developer",
    summary: "Builds products.",
    location: "Bangkok, Thailand",
    email: "punnawat02357@gmail.com",
    github: { label: "nicepunn", url: "https://github.com/nicepunn" },
    pdfPath: "/api/resume/pdf",
    experience: experience as Resume["experience"],
    projects: [
      {
        name: "Demo",
        stack: "Next.js",
        description: ["A demo project"],
      },
    ],
    skills: [{ label: "Languages", items: ["TypeScript"] }],
    education: {
      degree: "B.Sc.",
      school: "CU",
      period: "2020 – 2024",
      gpax: "3.5",
    },
    activities: ["Club"],
    interests: ["Climbing"],
  };
}

describe("prependsNewItems / insertPositionForSection", () => {
  it("prepends only for experience", () => {
    expect(prependsNewItems("experience")).toBe(true);
    expect(prependsNewItems("projects")).toBe(false);
    expect(prependsNewItems("skills")).toBe(false);
    expect(insertPositionForSection("experience")).toBe("start");
    expect(insertPositionForSection("projects")).toBe("end");
  });
});

describe("insertArrayItem", () => {
  const items = [job("A", "2024"), job("B", "2023")];

  it("inserts at start for experience-style adds", () => {
    const next = insertArrayItem(items, job("New", "2025"), "start");
    expect(next.map((item) => item.company)).toEqual(["New", "A", "B"]);
    expect(items).toHaveLength(2);
  });

  it("appends for projects/skills-style adds", () => {
    const next = insertArrayItem(items, job("New", "2025"), "end");
    expect(next.map((item) => item.company)).toEqual(["A", "B", "New"]);
  });
});

describe("removeArrayItemAt", () => {
  const items = [job("A", "2024"), job("B", "2023"), job("C", "2022")];

  it("removes the targeted index without shifting neighbors incorrectly", () => {
    expect(removeArrayItemAt(items, 1).map((item) => item.company)).toEqual([
      "A",
      "C",
    ]);
  });

  it("no-ops on out-of-range indexes", () => {
    expect(removeArrayItemAt(items, -1)).toBe(items);
    expect(removeArrayItemAt(items, 9)).toBe(items);
  });
});

describe("updateArrayItemField", () => {
  it("updates a nested field on one row only", () => {
    const items = [job("A", "2024"), job("B", "2023")];
    const next = updateArrayItemField(items, 1, "role", "Lead");
    expect(next[0]?.role).toBe("Dev");
    expect(next[1]?.role).toBe("Lead");
    expect(items[1]?.role).toBe("Dev");
  });

  it("no-ops when the data index is missing", () => {
    const items = [job("A", "2024")];
    expect(updateArrayItemField(items, -1, "role", "Lead")).toBe(items);
  });
});

describe("moveArrayItem (ready for drag UI)", () => {
  const items = [job("A", "2025"), job("B", "2024"), job("C", "2023")];

  it("moves an item down and up by data index", () => {
    expect(moveArrayItem(items, 0, 2).map((item) => item.company)).toEqual([
      "B",
      "C",
      "A",
    ]);
    expect(moveArrayItem(items, 2, 0).map((item) => item.company)).toEqual([
      "C",
      "A",
      "B",
    ]);
  });

  it("no-ops when indexes are equal or invalid", () => {
    expect(moveArrayItem(items, 1, 1)).toBe(items);
    expect(moveArrayItem(items, -1, 0)).toBe(items);
    expect(moveArrayItem(items, 0, 99)).toBe(items);
  });

  it("does not mutate the original array", () => {
    const next = moveArrayItem(items, 0, 1);
    expect(items.map((item) => item.company)).toEqual(["A", "B", "C"]);
    expect(next).not.toBe(items);
  });
});

describe("isReorderableRow", () => {
  it("allows only rows backed by a live data index", () => {
    expect(
      isReorderableRow({
        key: "x",
        dataIndex: 0,
        currentIndex: 0,
        originalIndex: 0,
        status: "unchanged",
        dataItem: job("A", "1"),
        originalItem: null,
        currentItem: job("A", "1"),
      }),
    ).toBe(true);

    expect(
      isReorderableRow({
        key: "y",
        dataIndex: -1,
        currentIndex: -1,
        originalIndex: 1,
        status: "removed",
        dataItem: null,
        originalItem: job("B", "2"),
        currentItem: null,
      }),
    ).toBe(false);
  });
});

describe("buildArraySectionRows", () => {
  const a = job("A", "2025");
  const b = job("B", "2024");
  const c = job("C", "2023");

  it("maps plain edit mode 1:1 to data indexes", () => {
    const rows = buildArraySectionRows("experience", [a, b]);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.status === "unchanged")).toBe(true);
    expect(rows.map((row) => row.dataIndex)).toEqual([0, 1]);
  });

  it("uses same-locale compare alignment", () => {
    const edited = { ...b, role: "Lead" };
    const rows = buildArraySectionRows("experience", [a, edited, c], {
      compareAgainst: sampleResume([a, b, c]),
    });
    expect(rows.map((row) => row.status)).toEqual([
      "unchanged",
      "changed",
      "unchanged",
    ]);
  });

  it("uses sourceDiff target alignment across locales", () => {
    const thA = job("เอ", "2025");
    const thB = job("บี", "2024");
    const thC = job("ซี", "2023");
    const rows = buildArraySectionRows("experience", [thA, thB, thC], {
      sourceDiff: {
        original: sampleResume([a, b, c]),
        current: sampleResume([a, c]),
      },
    });
    expect(rows.map((row) => row.status)).toEqual([
      "unchanged",
      "removed",
      "unchanged",
    ]);
    expect(rows[1]?.dataItem).toEqual(thB);
  });

  it("keeps plain order after moveArrayItem (no DnD UI yet)", () => {
    const reordered = moveArrayItem([a, b, c], 0, 2);
    const rows = buildArraySectionRows("experience", reordered);
    expect(rows.map((row) => (row.dataItem as ArrayItem).company)).toEqual([
      "B",
      "C",
      "A",
    ]);
    expect(rows.map((row) => row.dataIndex)).toEqual([0, 1, 2]);
  });
});

describe("readArrayItems / writeArrayItems", () => {
  it("reads and writes experience without mutating the source resume", () => {
    const data = sampleResume([job("A", "2025"), job("B", "2024")]);
    const items = readArrayItems(data, "experience");
    expect(items).toHaveLength(2);

    const next = writeArrayItems(
      data,
      "experience",
      insertArrayItem(items, job("New", "2026"), "start"),
    );
    expect(next.experience[0]?.company).toBe("New");
    expect(data.experience[0]?.company).toBe("A");
  });
});

describe("reviewRowKey", () => {
  it("keys removed, original, and added rows distinctly", () => {
    expect(
      reviewRowKey("experience", {
        key: "r",
        dataIndex: -1,
        currentIndex: -1,
        originalIndex: 2,
        status: "removed",
        dataItem: null,
        originalItem: job("C", "2023"),
        currentItem: null,
      }),
    ).toBe("experience#removed#2");

    expect(
      reviewRowKey("experience", {
        key: "u",
        dataIndex: 0,
        currentIndex: 0,
        originalIndex: 1,
        status: "unchanged",
        dataItem: job("B", "2024"),
        originalItem: job("B", "2024"),
        currentItem: job("B", "2024"),
      }),
    ).toBe("experience#1");

    expect(
      reviewRowKey("experience", {
        key: "a",
        dataIndex: 0,
        currentIndex: 0,
        originalIndex: -1,
        status: "added",
        dataItem: job("New", "2026"),
        originalItem: null,
        currentItem: job("New", "2026"),
      }),
    ).toBe("experience#added#0");
  });
});

describe("dynamic form array workflow (add → edit → remove → reorder helper)", () => {
  it("supports the same mutations the form uses today, plus future move", () => {
    let items: ArrayItem[] = [job("A", "2024"), job("B", "2023")];

    items = insertArrayItem(
      items,
      job("", "", ""),
      insertPositionForSection("experience"),
    );
    expect(items.map((item) => item.company)).toEqual(["", "A", "B"]);

    items = updateArrayItemField(items, 0, "company", "NewCo");
    items = updateArrayItemField(items, 0, "period", "2025");
    expect(items[0]).toMatchObject({ company: "NewCo", period: "2025" });

    items = removeArrayItemAt(items, 2);
    expect(items.map((item) => item.company)).toEqual(["NewCo", "A"]);

    // Drag UI will call this later; structure is ready and order is data-index based.
    items = moveArrayItem(items, 1, 0);
    expect(items.map((item) => item.company)).toEqual(["A", "NewCo"]);

    const rows = buildArraySectionRows("experience", items);
    expect(rows.every(isReorderableRow)).toBe(true);
    expect(rows.map((row) => row.dataIndex)).toEqual([0, 1]);
  });
});

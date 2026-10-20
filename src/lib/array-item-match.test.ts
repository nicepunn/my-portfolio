import { describe, expect, it } from "vitest";
import {
  matchTargetIndexes,
  normalizeText,
  scoreCrossLocaleItem,
} from "@/lib/array-item-match";
import type { AlignedArrayRow } from "@/lib/form-diff";

function row(
  partial: Partial<AlignedArrayRow> &
    Pick<AlignedArrayRow, "status" | "currentItem" | "originalItem">,
): AlignedArrayRow {
  return {
    key: "k",
    dataIndex: -1,
    currentIndex: -1,
    originalIndex: -1,
    dataItem: null,
    ...partial,
  };
}

describe("normalizeText", () => {
  it("trims and lowercases", () => {
    expect(normalizeText("  Acme ")).toBe("acme");
  });
});

describe("scoreCrossLocaleItem", () => {
  it("scores experience primarily by company", () => {
    expect(
      scoreCrossLocaleItem(
        "experience",
        { company: "Acme", period: "2025", role: "Dev" },
        { company: "Acme", period: "กรกฎาคม 2025", role: "นักพัฒนา" },
      ),
    ).toBe(100);

    expect(
      scoreCrossLocaleItem(
        "experience",
        { company: "Acme", period: "2025", role: "Dev" },
        { company: "Other", period: "2025", role: "Dev" },
      ),
    ).toBe(25);
  });

  it("scores projects by url and name", () => {
    expect(
      scoreCrossLocaleItem(
        "projects",
        { name: "Heathub", url: "https://heathub.vercel.app", stack: "x" },
        { name: "Heathub", url: "https://heathub.vercel.app", stack: "y" },
      ),
    ).toBe(180);

    expect(
      scoreCrossLocaleItem(
        "projects",
        { name: "Hiwhiw", url: "", stack: "Go" },
        { name: "Hiwhiw", url: "", stack: "Go" },
      ),
    ).toBe(90);
  });

  it("scores skills by label and item overlap", () => {
    const withTranslatedLabel = scoreCrossLocaleItem(
      "skills",
      { label: "Languages", items: ["[***TypeScript***]", "[*Python*]"] },
      { label: "ภาษาโปรแกรม", items: ["[***TypeScript***]", "[*Python*]"] },
    );
    expect(withTranslatedLabel).toBe(60);

    const withSameLabel = scoreCrossLocaleItem(
      "skills",
      { label: "Front-End", items: ["[***React***]"] },
      { label: "Front-End", items: ["[***React***]", "[***Next.js***]"] },
    );
    expect(withSameLabel).toBeGreaterThanOrEqual(40);
    expect(withSameLabel).toBeLessThan(100);
  });
});

describe("matchTargetIndexes", () => {
  it("pairs by company even when order differs", () => {
    const sourceRows = [
      row({
        status: "unchanged",
        currentItem: { company: "Coral" },
        originalItem: { company: "Coral" },
      }),
      row({
        status: "unchanged",
        currentItem: { company: "Acme" },
        originalItem: { company: "Acme" },
      }),
    ];
    const indexes = matchTargetIndexes("experience", sourceRows, [
      { company: "Acme" },
      { company: "Coral" },
    ]);
    expect(indexes).toEqual([1, 0]);
  });

  it("leaves brand-new source rows unpaired when no company match", () => {
    const sourceRows = [
      row({
        status: "added",
        currentItem: { company: "Delta" },
        originalItem: null,
      }),
      row({
        status: "unchanged",
        currentItem: { company: "Acme" },
        originalItem: { company: "Acme" },
      }),
    ];
    const indexes = matchTargetIndexes("experience", sourceRows, [
      { company: "Acme" },
    ]);
    expect(indexes).toEqual([-1, 0]);
  });

  it("falls back to position when fields are incompatible", () => {
    const sourceRows = [
      row({
        status: "unchanged",
        currentItem: { company: "Acme" },
        originalItem: { company: "Acme" },
      }),
      row({
        status: "unchanged",
        currentItem: { company: "Beta" },
        originalItem: { company: "Beta" },
      }),
    ];
    const indexes = matchTargetIndexes("experience", sourceRows, [
      { company: "แอคมี" },
      { company: "เบต้า" },
    ]);
    expect(indexes).toEqual([0, 1]);
  });
});

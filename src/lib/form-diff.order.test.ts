import { describe, expect, it } from "vitest";
import {
  arrayOrderChanged,
  applySourceOrderToTarget,
  targetOrderMatchesSource,
} from "@/lib/form-diff";

const job = (company: string, period: string, role = "Dev") => ({
  company,
  period,
  role,
  bullets: ["did things"],
});

describe("arrayOrderChanged", () => {
  const a = job("A", "2025");
  const b = job("B", "2024");
  const c = job("C", "2023");
  const d = job("D", "2026");

  it("is false when shared identities keep the same order", () => {
    expect(arrayOrderChanged("experience", [a, b, c], [a, b, c])).toBe(false);
  });

  it("detects pure reorder among the same identities", () => {
    expect(arrayOrderChanged("experience", [a, b, c], [c, a, b])).toBe(true);
  });

  it("detects reorder of survivors when an item was removed", () => {
    expect(arrayOrderChanged("experience", [a, b, c], [c, a])).toBe(true);
    expect(arrayOrderChanged("experience", [a, b, c], [a, c])).toBe(false);
  });

  it("ignores a prepended add when survivors stay in order", () => {
    expect(arrayOrderChanged("experience", [a, b], [d, a, b])).toBe(false);
  });

  it("detects reorder together with an add", () => {
    expect(arrayOrderChanged("experience", [a, b], [d, b, a])).toBe(true);
  });
});

describe("applySourceOrderToTarget", () => {
  const a = job("A", "2025");
  const b = job("B", "2024");
  const c = job("C", "2023");
  const extra = job("Extra", "2020");

  it("permutes target rows to match source reorder", () => {
    const next = applySourceOrderToTarget(
      "experience",
      [a, b, c],
      [c, a, b],
      [a, b, c],
    );
    expect(next.map((item) => item.company)).toEqual(["C", "A", "B"]);
  });

  it("is a no-op when source order did not change", () => {
    expect(
      applySourceOrderToTarget("experience", [a, b], [a, b], [a, b]),
    ).toEqual([a, b]);
  });

  it("keeps unmatched/extra target rows after reordered survivors", () => {
    const next = applySourceOrderToTarget(
      "experience",
      [a, b, c],
      [c, a, b],
      [a, b, c, extra],
    );
    expect(next.map((item) => item.company)).toEqual(["C", "A", "B", "Extra"]);
  });

  it("marks a match only against the pre-review baseline", () => {
    const baseline = [a, b, c];
    const applied = applySourceOrderToTarget(
      "experience",
      [a, b, c],
      [c, a, b],
      baseline,
    );
    expect(
      targetOrderMatchesSource(
        "experience",
        [a, b, c],
        [c, a, b],
        applied,
        baseline,
      ),
    ).toBe(true);
    expect(
      targetOrderMatchesSource(
        "experience",
        [a, b, c],
        [c, a, b],
        baseline,
        baseline,
      ),
    ).toBe(false);
  });
});

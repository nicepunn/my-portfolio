import { describe, expect, it } from "vitest";
import {
  parseSkillItem,
  skillDisplayLabel,
  sortSkillsByEmphasis,
} from "@/lib/skill-emphasis";

describe("parseSkillItem", () => {
  it("parses primary, secondary, and muted markers", () => {
    expect(parseSkillItem("[***TypeScript***]")).toEqual({
      label: "TypeScript",
      emphasis: "primary",
      raw: "[***TypeScript***]",
    });
    expect(parseSkillItem("[*React*]")).toMatchObject({
      label: "React",
      emphasis: "secondary",
    });
    expect(parseSkillItem("CSS")).toMatchObject({
      label: "CSS",
      emphasis: "muted",
    });
  });

  it("exposes clean display labels", () => {
    expect(skillDisplayLabel("[***Go***]")).toBe("Go");
    expect(skillDisplayLabel("  plain  ")).toBe("plain");
  });
});

describe("sortSkillsByEmphasis", () => {
  it("orders primary → secondary → muted, then by label", () => {
    const sorted = sortSkillsByEmphasis([
      "Zig",
      "[*React*]",
      "[***TypeScript***]",
      "[*Next.js*]",
      "[***Go***]",
    ]);
    expect(sorted.map(skillDisplayLabel)).toEqual([
      "Go",
      "TypeScript",
      "Next.js",
      "React",
      "Zig",
    ]);
  });
});

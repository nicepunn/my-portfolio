import { describe, expect, it } from "vitest";
import {
  getAtPath,
  listToLines,
  linesToList,
  setAtPath,
} from "@/lib/edit-form";

describe("getAtPath / setAtPath", () => {
  const root = {
    name: "Punn",
    github: { label: "nicepunn", url: "https://github.com/nicepunn" },
    experience: [{ company: "Acme", role: "Dev" }],
  };

  it("reads nested and array paths", () => {
    expect(getAtPath(root, "name")).toBe("Punn");
    expect(getAtPath(root, "github.url")).toBe("https://github.com/nicepunn");
    expect(getAtPath(root, "experience")).toEqual(root.experience);
    expect(getAtPath(root, "missing.path")).toBeUndefined();
  });

  it("writes nested paths immutably", () => {
    const next = setAtPath(root, "github.label", "updated");
    expect(next.github.label).toBe("updated");
    expect(root.github.label).toBe("nicepunn");
    expect(next.github.url).toBe(root.github.url);
  });

  it("can replace array sections", () => {
    const next = setAtPath(root, "experience", [
      { company: "New", role: "Lead" },
    ]);
    expect(next.experience).toEqual([{ company: "New", role: "Lead" }]);
    expect(root.experience[0]?.company).toBe("Acme");
  });
});

describe("linesToList / listToLines", () => {
  it("splits non-empty trimmed lines", () => {
    expect(linesToList("  a\n\nb  \n")).toEqual(["a", "b"]);
  });

  it("joins list items with newlines", () => {
    expect(listToLines(["a", "b"])).toBe("a\nb");
    expect(listToLines(null)).toBe("");
  });
});

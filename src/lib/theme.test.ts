import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, isTheme, resolveTheme } from "@/lib/theme";

describe("theme helpers", () => {
  it("validates theme values", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("falls back to the default theme", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("nope")).toBe(DEFAULT_THEME);
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
  });
});

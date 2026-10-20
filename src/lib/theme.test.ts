import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  DEFAULT_UI,
  isTheme,
  isUiSkin,
  resolveTheme,
  resolveUi,
} from "@/lib/theme";

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

  it("validates ui skins", () => {
    expect(isUiSkin("editorial")).toBe(true);
    expect(isUiSkin("brick")).toBe(true);
    expect(isUiSkin("soft")).toBe(true);
    expect(isUiSkin("cyber")).toBe(true);
    expect(isUiSkin("neon")).toBe(false);
    expect(isUiSkin(null)).toBe(false);
  });

  it("falls back to the default ui skin", () => {
    expect(resolveUi("cyber")).toBe("cyber");
    expect(resolveUi("nope")).toBe(DEFAULT_UI);
    expect(resolveUi(null)).toBe(DEFAULT_UI);
  });
});

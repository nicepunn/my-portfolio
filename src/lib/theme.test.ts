import { describe, expect, it } from "vitest";
import {
  DEFAULT_GLASS,
  DEFAULT_THEME,
  DEFAULT_UI,
  glassAlpha,
  glassTransparency,
  isTheme,
  isUiSkin,
  resolveGlass,
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
    expect(isUiSkin("brick")).toBe(false);
    expect(isUiSkin("soft")).toBe(true);
    expect(isUiSkin("glass")).toBe(true);
    expect(isUiSkin("cyber")).toBe(true);
    expect(isUiSkin("neon")).toBe(false);
    expect(isUiSkin(null)).toBe(false);
  });

  it("falls back to the default ui skin", () => {
    expect(DEFAULT_THEME).toBe("dark");
    expect(DEFAULT_UI).toBe("soft");
    expect(resolveUi("cyber")).toBe("cyber");
    expect(resolveUi("brick")).toBe(DEFAULT_UI);
    expect(resolveUi("nope")).toBe(DEFAULT_UI);
    expect(resolveUi(null)).toBe(DEFAULT_UI);
  });

  it("reads a 0–100 glass slider and drops values outside that range", () => {
    expect(DEFAULT_GLASS).toBe(50);
    expect(resolveGlass("0")).toBe(0);
    expect(resolveGlass("50")).toBe(50);
    expect(resolveGlass("100")).toBe(100);
    expect(resolveGlass("45")).toBe(45);
    expect(resolveGlass("1")).toBe(1);
    expect(resolveGlass("99")).toBe(99);
    expect(resolveGlass("50.4")).toBe(50);
    expect(resolveGlass("-1")).toBe(DEFAULT_GLASS);
    expect(resolveGlass("101")).toBe(DEFAULT_GLASS);
    expect(resolveGlass("100.4")).toBe(DEFAULT_GLASS);
    expect(resolveGlass(null)).toBe(DEFAULT_GLASS);
    expect(resolveGlass("nope")).toBe(DEFAULT_GLASS);
  });

  it("maps slider position onto transparency 65–95 and solid alpha", () => {
    expect(glassTransparency(0)).toBe(65);
    expect(glassTransparency(50)).toBe(80);
    expect(glassTransparency(100)).toBe(95);
    expect(glassAlpha(65)).toBe("35%");
    expect(glassAlpha(80)).toBe("20%");
    expect(glassAlpha(95)).toBe("5%");
    expect(glassAlpha(glassTransparency(0))).toBe("35%");
    expect(glassAlpha(glassTransparency(50))).toBe("20%");
    expect(glassAlpha(glassTransparency(100))).toBe("5%");
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  isLocale,
  resolveLocale,
} from "@/i18n/config";

describe("locale helpers", () => {
  it("validates known locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("th")).toBe(true);
    expect(isLocale("jp")).toBe(false);
  });

  it("resolves unknown values to the default", () => {
    expect(resolveLocale("th")).toBe("th");
    expect(resolveLocale("nope")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});

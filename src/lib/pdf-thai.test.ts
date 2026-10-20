import { describe, expect, it } from "vitest";
import {
  normalizeResumeForPdf,
  normalizeThaiPdfText,
} from "@/lib/pdf-thai";
import type { Resume } from "@/lib/resume-schema";

describe("normalizeThaiPdfText", () => {
  it("decomposes sara am so react-pdf does not truncate", () => {
    expect(normalizeThaiPdfText("น้ำ")).toBe("น้ํา");
    expect(normalizeThaiPdfText("ทำงาน")).toBe("ทํางาน");
    expect(normalizeThaiPdfText("hello")).toBe("hello");
  });
});

describe("normalizeResumeForPdf", () => {
  it("walks every string in the resume payload", () => {
    const data = {
      name: "น้ำ",
      experience: [{ company: "บริษัทน้ำใจ", bullets: ["ทำน้ำแข็ง"] }],
    } as unknown as Resume;

    const normalized = normalizeResumeForPdf(data);
    expect(normalized.name).toBe("น้ํา");
    expect(normalized.experience[0]?.company).toBe("บริษัทน้ําใจ");
    expect(normalized.experience[0]?.bullets[0]).toBe("ทําน้ําแข็ง");
  });
});

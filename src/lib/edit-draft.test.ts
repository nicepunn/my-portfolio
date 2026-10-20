import { describe, expect, it } from "vitest";
import { otherLocales, parseEditDraft, resumesEqual } from "@/lib/edit-draft";
import { locales } from "@/i18n/config";
import type { Resume } from "@/lib/resume-schema";

function sampleResume(overrides: Partial<Resume> = {}): Resume {
  return {
    name: "Punnawat Lohanuit",
    headline: "Full-stack developer",
    summary: "Builds products.",
    location: "Bangkok, Thailand",
    email: "punnawat02357@gmail.com",
    github: { label: "nicepunn", url: "https://github.com/nicepunn" },
    pdfPath: "/api/resume/pdf",
    experience: [
      {
        company: "Acme",
        role: "Dev",
        period: "2025",
        bullets: ["Shipped features"],
      },
    ],
    projects: [
      {
        name: "Demo",
        stack: "Next.js",
        description: ["A demo project"],
        url: "",
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
    ...overrides,
  };
}

describe("otherLocales", () => {
  it("excludes the source locale", () => {
    expect(otherLocales("en", locales)).toEqual(["th"]);
    expect(otherLocales("th", locales)).toEqual(["en"]);
  });
});

describe("resumesEqual", () => {
  it("treats empty project urls as equivalent after normalize", () => {
    const withEmpty = sampleResume({
      projects: [
        {
          name: "Demo",
          stack: "Next.js",
          description: ["A demo project"],
          url: "",
        },
      ],
    });
    const withMissing = sampleResume({
      projects: [
        {
          name: "Demo",
          stack: "Next.js",
          description: ["A demo project"],
        },
      ],
    });
    expect(resumesEqual(withEmpty, withMissing)).toBe(true);
  });

  it("detects content differences", () => {
    expect(
      resumesEqual(sampleResume(), sampleResume({ name: "Someone Else" })),
    ).toBe(false);
  });
});

describe("parseEditDraft", () => {
  it("accepts a valid multi-locale draft", () => {
    const draft = parseEditDraft({
      sourceLocale: "en",
      currentLocale: "th",
      queue: ["th"],
      drafts: { en: sampleResume(), th: sampleResume({ name: "พรรณวัฒน์" }) },
    });
    expect(draft?.sourceLocale).toBe("en");
    expect(draft?.currentLocale).toBe("th");
    expect(draft?.drafts.en?.name).toBe("Punnawat Lohanuit");
    expect(draft?.drafts.th?.name).toBe("พรรณวัฒน์");
  });

  it("rejects drafts missing the source locale payload", () => {
    expect(
      parseEditDraft({
        sourceLocale: "en",
        currentLocale: "th",
        queue: [],
        drafts: { th: sampleResume() },
      }),
    ).toBeNull();
  });

  it("rejects invalid locale codes", () => {
    expect(
      parseEditDraft({
        sourceLocale: "jp",
        currentLocale: "en",
        queue: [],
        drafts: { en: sampleResume() },
      }),
    ).toBeNull();
  });
});

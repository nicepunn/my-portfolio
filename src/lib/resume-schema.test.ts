import { describe, expect, it } from "vitest";
import { normalizeResume, resumeSchema } from "@/lib/resume-schema";

const valid = {
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
};

describe("resumeSchema", () => {
  it("accepts a complete resume", () => {
    expect(resumeSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(resumeSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(
      false,
    );
    expect(resumeSchema.safeParse({ ...valid, experience: [] }).success).toBe(true);
  });
});

describe("normalizeResume", () => {
  it("drops blank project urls", () => {
    const normalized = normalizeResume(valid as never);
    expect(normalized.projects[0]?.url).toBeUndefined();
  });

  it("keeps real project urls", () => {
    const withUrl = {
      ...valid,
      projects: [
        {
          ...valid.projects[0],
          url: "https://example.com",
        },
      ],
    };
    expect(normalizeResume(withUrl as never).projects[0]?.url).toBe(
      "https://example.com",
    );
  });
});

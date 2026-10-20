"use client";

import type { Resume } from "@/lib/resume-schema";
import {
  parseSkillItem,
  skillEmphasisClass,
  sortSkillsByEmphasis,
} from "@/lib/skill-emphasis";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useTranslations } from "@/i18n/LocaleProvider";

export function Skills({ data }: { data: Resume }) {
  const t = useTranslations();

  return (
    <section
      id="skills"
      className="scroll-mt-20 px-5 py-14 sm:px-10 sm:py-16 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="section-rule mb-8 sm:mb-10" aria-hidden />
        <Reveal>
          <SectionHeading
            eyebrow={t.sections.skills.eyebrow}
            title={t.sections.skills.title}
          />
        </Reveal>

        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
          {data.skills.map((group, index) => {
            const items = sortSkillsByEmphasis(group.items);
            return (
              <Reveal key={group.label} delay={index * 0.05}>
                <div>
                  <h3 className="label-caps mb-3">{group.label}</h3>
                  {/* Mobile: flowing chips; desktop: stacked emphasis list */}
                  <ul className="flex flex-wrap gap-2 sm:hidden">
                    {items.map((item) => {
                      const skill = parseSkillItem(item);
                      return (
                        <li key={item}>
                          <span
                            className={`inline-flex border px-2.5 py-1 text-sm ${
                              skill.emphasis === "primary"
                                ? "border-[var(--accent)]/50 bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] font-semibold text-[var(--fg)]"
                                : skill.emphasis === "secondary"
                                  ? "border-[var(--border)] text-[var(--fg)]/90"
                                  : "border-transparent text-[var(--muted)]/70"
                            }`}
                          >
                            {skill.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <ul className="hidden space-y-2 sm:block">
                    {items.map((item) => {
                      const skill = parseSkillItem(item);
                      return (
                        <li key={item}>
                          <span className={skillEmphasisClass[skill.emphasis]}>
                            {skill.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

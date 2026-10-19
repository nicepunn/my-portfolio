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
      className="scroll-mt-20 px-6 pb-20 sm:px-10 sm:pb-28 lg:px-16"
    >
      <div className="mx-auto max-w-5xl border-t border-[var(--border)] pt-20 sm:pt-28">
        <Reveal>
          <SectionHeading
            eyebrow={t.sections.skills.eyebrow}
            title={t.sections.skills.title}
          />
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {data.skills.map((group, index) => {
            const items = sortSkillsByEmphasis(group.items);
            return (
              <Reveal key={group.label} delay={index * 0.05}>
                <div>
                  <h3 className="label-caps mb-3">{group.label}</h3>
                  <ul className="space-y-2">
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

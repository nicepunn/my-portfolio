"use client";

import type { Resume } from "@/lib/resume-schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useTranslations } from "@/i18n/LocaleProvider";

export function Extras({ data }: { data: Resume }) {
  const t = useTranslations();

  return (
    <section
      id="about"
      className="scroll-mt-20 px-5 py-14 sm:px-10 sm:py-16 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="section-rule mb-8 sm:mb-10" aria-hidden />
        <div className="grid gap-12 sm:gap-16 lg:grid-cols-3">
          <Reveal className="lg:col-span-1">
            <SectionHeading
              eyebrow={t.sections.education.eyebrow}
              title={t.sections.education.title}
            />
            <div>
              <h3 className="font-display text-xl font-semibold text-[var(--fg)]">
                {data.education.degree}
              </h3>
              <p className="mt-1 text-[var(--muted)]">{data.education.school}</p>
              <p className="mt-3 font-mono text-xs tracking-wide text-[var(--accent)]">
                {data.education.period} · {t.sections.education.gpax}{" "}
                {data.education.gpax}
              </p>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-1" delay={0.08}>
            <SectionHeading
              eyebrow={t.sections.activities.eyebrow}
              title={t.sections.activities.title}
            />
            <ul className="space-y-3 text-[var(--muted)]">
              {data.activities.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="lg:col-span-1" delay={0.14}>
            <SectionHeading
              eyebrow={t.sections.interests.eyebrow}
              title={t.sections.interests.title}
            />
            <ul className="space-y-3 text-[var(--muted)]">
              {data.interests.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

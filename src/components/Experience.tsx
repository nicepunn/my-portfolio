"use client";

import type { Resume } from "@/lib/resume-schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useTranslations } from "@/i18n/LocaleProvider";

export function Experience({ data }: { data: Resume }) {
  const t = useTranslations();

  return (
    <section
      id="experience"
      className="scroll-mt-20 border-t border-[var(--border)] px-6 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow={t.sections.experience.eyebrow}
            title={t.sections.experience.title}
          />
        </Reveal>

        <ol className="relative space-y-12">
          <span
            aria-hidden
            className="absolute top-2 bottom-2 left-[5px] w-px bg-[var(--border)]"
          />
          {data.experience.map((job, index) => (
            <Reveal key={job.company} delay={index * 0.08} className="relative">
              <li className="relative overflow-visible pl-8 sm:pl-10">
                <span
                  aria-hidden
                  className="absolute top-1.5 left-[5px] z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--accent)]"
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <h3 className="font-display text-xl font-semibold text-[var(--fg)] sm:text-2xl">
                    {job.company}
                  </h3>
                  <time className="shrink-0 font-mono text-xs tracking-wide text-[var(--muted)]">
                    {job.period}
                  </time>
                </div>
                <p className="mt-1 text-sm font-medium text-[var(--accent)]">
                  {job.role}
                </p>
                <ul className="mt-4 space-y-2 text-[var(--muted)]">
                  {job.bullets.map((bullet) => (
                    <li key={bullet} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

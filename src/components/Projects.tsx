"use client";

import type { Resume } from "@/lib/resume-schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { useTranslations } from "@/i18n/LocaleProvider";

export function Projects({ data }: { data: Resume }) {
  const t = useTranslations();

  return (
    <section
      id="projects"
      className="scroll-mt-20 px-5 py-14 sm:px-10 sm:py-16 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="section-rule mb-8 sm:mb-10" aria-hidden />
        <Reveal>
          <SectionHeading
            eyebrow={t.sections.projects.eyebrow}
            title={t.sections.projects.title}
          />
        </Reveal>

        <ul className="project-list divide-y divide-[var(--border)]">
          {data.projects.map((project, index) => (
            <Reveal key={project.name} delay={index * 0.06}>
              <li className="project-card group border-l-2 border-transparent py-8 transition-[border-color,padding] sm:py-10 sm:pl-0 sm:hover:border-transparent max-sm:border-l-[var(--accent)]/40 max-sm:pl-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-[1.55rem] leading-tight font-semibold text-[var(--fg)] transition-colors group-hover:text-[var(--accent)] sm:text-2xl">
                        {project.url ? (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="outline-offset-4"
                          >
                            {project.name}
                          </a>
                        ) : (
                          project.name
                        )}
                      </h3>
                      {project.url ? (
                        <span className="font-mono text-xs text-[var(--muted)]">
                          ↗ {t.sections.projects.live}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 font-mono text-[11px] leading-relaxed tracking-wide text-[var(--accent)] sm:text-xs">
                      {project.stack}
                    </p>
                    <ul className="mt-4 space-y-2.5 text-[0.95rem] text-[var(--muted)] sm:text-base">
                      {project.description.map((line) => (
                        <li key={line} className="leading-relaxed">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

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
      className="scroll-mt-20 px-6 pb-20 sm:px-10 sm:pb-28 lg:px-16"
    >
      <div className="mx-auto max-w-5xl border-t border-[var(--border)] pt-20 sm:pt-28">
        <Reveal>
          <SectionHeading
            eyebrow={t.sections.projects.eyebrow}
            title={t.sections.projects.title}
          />
        </Reveal>

        <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {data.projects.map((project, index) => (
            <Reveal key={project.name} delay={index * 0.06}>
              <li className="group py-8 sm:py-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-2xl font-semibold text-[var(--fg)] transition-colors group-hover:text-[var(--accent)]">
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
                    <p className="mt-2 font-mono text-xs tracking-wide text-[var(--accent)]">
                      {project.stack}
                    </p>
                    <ul className="mt-4 space-y-2 text-[var(--muted)]">
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

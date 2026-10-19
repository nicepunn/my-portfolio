import { resume } from "@/data/resume";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";

export function Skills() {
  return (
    <section
      id="skills"
      className="scroll-mt-20 border-t border-[var(--border)] px-6 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading eyebrow="Toolkit" title="Technical skills" />
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {resume.skills.map((group, index) => (
            <Reveal key={group.label} delay={index * 0.05}>
              <div>
                <h3 className="mb-3 font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase">
                  {group.label}
                </h3>
                <ul className="space-y-1.5 text-[var(--fg)]">
                  {group.items.map((item) => (
                    <li key={item} className="text-[var(--muted)]">
                      <span className="text-[var(--fg)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

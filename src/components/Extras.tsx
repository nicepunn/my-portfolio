import type { Resume } from "@/lib/resume-schema";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";

export function Extras({ data }: { data: Resume }) {
  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-[var(--border)] px-6 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="mx-auto grid max-w-5xl gap-16 lg:grid-cols-3">
        <Reveal className="lg:col-span-1">
          <SectionHeading eyebrow="Background" title="Education" />
          <div>
            <h3 className="font-display text-xl font-semibold text-[var(--fg)]">
              {data.education.degree}
            </h3>
            <p className="mt-1 text-[var(--muted)]">{data.education.school}</p>
            <p className="mt-3 font-mono text-xs tracking-wide text-[var(--accent)]">
              {data.education.period} · GPAX {data.education.gpax}
            </p>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-1" delay={0.08}>
          <SectionHeading eyebrow="Campus life" title="Activities" />
          <ul className="space-y-3 text-[var(--muted)]">
            {data.activities.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="lg:col-span-1" delay={0.14}>
          <SectionHeading eyebrow="Off the clock" title="Interests" />
          <ul className="space-y-3 text-[var(--muted)]">
            {data.interests.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

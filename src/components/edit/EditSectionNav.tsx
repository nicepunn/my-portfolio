"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";
import { editSections } from "@/lib/edit-sections";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function EditSectionNav({ onBack }: { onBack: () => void }) {
  const t = useTranslations();
  const [activeId, setActiveId] = useState<string>(editSections[0].id);

  useEffect(() => {
    const elements = editSections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Edit sections"
      className="pointer-events-none fixed top-24 left-3 z-40 hidden md:block md:left-4 lg:left-6"
    >
      <div className="pointer-events-auto flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="max-w-[9.5rem] text-left text-xs leading-snug text-[var(--muted)] underline-offset-4 transition-colors hover:text-[var(--fg)] hover:underline"
        >
          {t.edit.backHome}
        </button>
        <ul className="flex flex-col gap-3">
          {editSections.map((section) => {
            const active = activeId === section.id;

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  aria-current={active ? "true" : undefined}
                  aria-label={section.label}
                  className="group flex items-center gap-3"
                >
                  <span
                    className={`block h-2.5 w-2.5 rounded-full border transition-[transform,background-color,border-color] ${
                      active
                        ? "scale-125 border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[var(--muted)] bg-transparent group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]/40"
                    }`}
                  />
                  <span
                    className={`origin-left text-xs tracking-wide transition-[opacity,color,transform] ${
                      active
                        ? "translate-x-0 text-[var(--fg)] opacity-100"
                        : "translate-x-0 text-[var(--muted)] opacity-70 group-hover:text-[var(--fg)] group-hover:opacity-100"
                    }`}
                  >
                    {section.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

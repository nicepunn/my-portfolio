"use client";

import type { Resume } from "@/lib/resume-schema";
import { useLocale, useTranslations } from "@/i18n/LocaleProvider";

export function MobileDock({ data }: { data: Resume }) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div
        className="pointer-events-auto border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] px-3 pt-2 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <a
            href={`mailto:${data.email}`}
            className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-2 text-center text-xs font-semibold tracking-wide text-[var(--bg)] transition-[transform,background-color] active:scale-[0.98]"
          >
            {t.hero.emailMe}
          </a>
          <a
            href={`/api/resume/pdf?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center border border-[var(--border)] px-2 text-center text-xs font-medium text-[var(--fg)] transition-colors active:border-[var(--accent)] active:text-[var(--accent)]"
          >
            {t.nav.pdf}
          </a>
          <a
            href={data.github.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center border border-[var(--border)] px-2 text-center text-xs font-medium text-[var(--fg)] transition-colors active:border-[var(--accent)] active:text-[var(--accent)]"
          >
            {t.hero.github}
          </a>
        </div>
      </div>
    </div>
  );
}

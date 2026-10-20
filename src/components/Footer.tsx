"use client";

import Image from "next/image";
import { Atmosphere } from "@/components/Atmosphere";
import type { Resume } from "@/lib/resume-schema";
import { useLocale, useTranslations } from "@/i18n/LocaleProvider";

export function Footer({ data }: { data: Resume }) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <footer className="relative overflow-hidden px-5 pt-14 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-10 sm:py-16 lg:px-16">
      <Atmosphere orb="right" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-[var(--fg)]">
              {data.name}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              {t.footer.blurb}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-3 text-sm">
              <a
                href={`/api/resume/pdf?locale=${locale}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-[var(--accent)] underline-offset-4 hover:underline sm:inline"
              >
                {t.footer.viewPdf}
              </a>
              <a
                href={`mailto:${data.email}`}
                className="hidden text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline sm:inline"
              >
                {data.email}
              </a>
              <a
                href={data.github.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline sm:inline"
              >
                {t.footer.github}
              </a>
              <a
                href="/edit"
                className="text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
              >
                {t.footer.editData}
              </a>
              <a
                href="/settings"
                className="text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
              >
                {t.footer.settings}
              </a>
            </div>
          </div>

          <figure className="shrink-0 self-center sm:self-auto">
            <Image
              src="/qr/resume-qr.png"
              alt={t.footer.qrAlt}
              width={128}
              height={128}
              className="rounded-sm bg-white p-2"
            />
            <figcaption className="mt-2 text-center text-[10px] tracking-wide text-[var(--muted)] uppercase">
              {t.footer.scanToOpen}
            </figcaption>
          </figure>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { useTranslations } from "@/i18n/LocaleProvider";

export function SettingsPage() {
  const t = useTranslations();

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12 sm:px-10 lg:px-0">
      <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] uppercase">
        {t.settings.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
        {t.settings.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        {t.settings.blurb}
      </p>

      <div className="mt-10">
        <LanguageSettings />
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
        >
          {t.settings.backHome}
        </Link>
      </p>
    </div>
  );
}

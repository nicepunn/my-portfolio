"use client";

import Link from "next/link";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { useTranslations } from "@/i18n/LocaleProvider";

export function SettingsPage() {
  const t = useTranslations();

  return (
    <div className="settings-page mx-auto w-full max-w-xl px-6 py-12 sm:px-10 lg:px-0">
      <p className="label-caps">{t.settings.eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
        {t.settings.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        {t.settings.blurb}
      </p>

      <div className="mt-10 space-y-10">
        <AppearanceSettings />
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

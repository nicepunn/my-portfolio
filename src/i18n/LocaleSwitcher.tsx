"use client";

import { locales, localeMeta } from "@/i18n/config";
import { useLocale, useTranslations } from "@/i18n/LocaleProvider";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();

  return (
    <div
      role="group"
      aria-label={t.a11y.language}
      className="inline-flex h-7 shrink-0 items-center rounded-full border border-[var(--border)] p-0.5"
    >
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={`min-w-8 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider transition-colors ${
              active
                ? "bg-[color-mix(in_oklab,var(--fg)_42%,transparent)] text-[var(--bg)]"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {localeMeta[code].nativeLabel}
          </button>
        );
      })}
    </div>
  );
}

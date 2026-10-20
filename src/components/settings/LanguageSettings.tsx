"use client";

import { locales, localeMeta } from "@/i18n/config";
import { useLocale, useTranslations } from "@/i18n/LocaleProvider";

export function LanguageSettings() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--fg)]">
          {t.settings.language.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t.settings.language.description}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t.settings.language.title}
        className="choice-list divide-y divide-[var(--border)] border-y border-[var(--border)]"
      >
        {locales.map((code) => {
          const active = code === locale;
          const meta = localeMeta[code];
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLocale(code)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[var(--accent)]"
            >
              <span>
                <span className="block text-sm font-medium text-[var(--fg)]">
                  {meta.label}
                </span>
                <span className="mt-0.5 block font-mono text-xs tracking-wider text-[var(--muted)] uppercase">
                  {meta.nativeLabel}
                </span>
              </span>
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--bg)]" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { localeMeta, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/LocaleProvider";

type OtherLanguagesModalProps = {
  options: Locale[];
  pending: boolean;
  onContinue: (selected: Locale[]) => void;
  onSaveThisOnly: () => void;
  onCancel: () => void;
};

export function OtherLanguagesModal({
  options,
  pending,
  onContinue,
  onSaveThisOnly,
  onCancel,
}: OtherLanguagesModalProps) {
  const t = useTranslations();
  const [selected, setSelected] = useState<Locale[]>(
    options.length === 1 ? [options[0]] : [],
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(locale: Locale) {
    setSelected((current) =>
      current.includes(locale)
        ? current.filter((item) => item !== locale)
        : [...current, locale],
    );
    setError(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="other-languages-title"
    >
      <div className="w-full max-w-md space-y-5 border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl">
        <div className="space-y-2">
          <h2
            id="other-languages-title"
            className="font-display text-xl font-semibold text-[var(--fg)]"
          >
            {t.edit.otherLanguagesTitle}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            {t.edit.otherLanguagesBlurb}
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)] uppercase">
            {t.edit.selectLanguages}
          </legend>
          <div className="space-y-2">
            {options.map((locale) => {
              const meta = localeMeta[locale];
              const checked = selected.includes(locale);
              return (
                <label
                  key={locale}
                  className="flex cursor-pointer items-center gap-3 border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--fg)] transition-colors hover:border-[var(--accent)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={pending}
                    onChange={() => toggle(locale)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <span>
                    {meta.label}{" "}
                    <span className="font-mono text-[var(--muted)]">
                      ({meta.nativeLabel})
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (selected.length === 0) {
                setError(t.edit.selectAtLeastOne);
                return;
              }
              onContinue(selected);
            }}
            className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--bg)] transition-[opacity,transform] enabled:hover:bg-[var(--accent-bright)] enabled:active:scale-[0.98] disabled:opacity-40"
          >
            {t.edit.continueToOther}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onSaveThisOnly}
            className="inline-flex h-11 items-center justify-center border border-[var(--border)] px-4 text-sm font-medium text-[var(--fg)] transition-colors enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:opacity-40"
          >
            {t.edit.saveThisOnly}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center px-4 text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline disabled:opacity-40"
          >
            {t.edit.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

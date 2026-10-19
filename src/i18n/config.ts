export const locales = ["en", "th"] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Device-local preference key (localStorage). Mirrored to a cookie for SSR. */
export const LOCALE_STORAGE_KEY = "resume-locale";

/** @deprecated Use LOCALE_STORAGE_KEY — kept as alias for cookie + storage. */
export const LOCALE_COOKIE_KEY = LOCALE_STORAGE_KEY;

export const localeMeta: Record<
  Locale,
  { label: string; nativeLabel: string; htmlLang: string }
> = {
  en: { label: "English", nativeLabel: "EN", htmlLang: "en" },
  th: { label: "ไทย", nativeLabel: "TH", htmlLang: "th" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Add a language:
 * 1. Append the code to `locales`
 * 2. Add `localeMeta` entry
 * 3. Add `src/i18n/messages/{code}.ts` (copy from `en.ts`)
 * 4. Add `src/data/locales/{code}/resume.json` for translated resume content
 * 5. Register the message module in `src/i18n/messages/index.ts`
 * 6. Register the bundled resume in `src/i18n/resume-locales.ts`
 *    (runtime edits persist per-locale via disk / Blob / GitHub)
 */

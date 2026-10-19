import { resume as resumeEn } from "@/data/resume";
import { resumeTh } from "@/data/locales/th/resume";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { Resume } from "@/lib/resume-schema";

/**
 * Bundled resume content per locale.
 * Default locale (`en`) can also be overridden at runtime via Blob / disk / GitHub.
 * Other locales stay file-based until you add a persistence path for them.
 */
const bundledResumes: Partial<Record<Locale, Resume>> = {
  en: resumeEn,
  th: resumeTh,
};

export function getBundledResume(locale: Locale): Resume {
  return bundledResumes[locale] ?? bundledResumes[DEFAULT_LOCALE] ?? resumeEn;
}

export function hasBundledResume(locale: Locale): boolean {
  return Boolean(bundledResumes[locale]);
}

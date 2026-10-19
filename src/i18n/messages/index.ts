import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { en, type Messages } from "@/i18n/messages/en";
import { th } from "@/i18n/messages/th";

const catalogs: Record<Locale, Messages> = {
  en,
  th,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
}

export type { Messages };

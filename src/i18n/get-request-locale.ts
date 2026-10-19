import { cookies } from "next/headers";
import {
  LOCALE_COOKIE_KEY,
  resolveLocale,
  type Locale,
} from "@/i18n/config";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  return resolveLocale(jar.get(LOCALE_COOKIE_KEY)?.value);
}

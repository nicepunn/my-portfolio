import { cookies } from "next/headers";
import {
  LOCALE_STORAGE_KEY,
  resolveLocale,
  type Locale,
} from "@/i18n/config";

/** SSR locale from the cookie mirrored from this device's localStorage. */
export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  return resolveLocale(jar.get(LOCALE_STORAGE_KEY)?.value);
}

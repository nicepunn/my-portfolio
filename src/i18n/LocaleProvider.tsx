"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  localeMeta,
  resolveLocale,
  type Locale,
} from "@/i18n/config";
import { getMessages, type Messages } from "@/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: Locale) {
  document.documentElement.lang = localeMeta[locale].htmlLang;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
  try {
    localStorage.setItem(LOCALE_COOKIE_KEY, locale);
  } catch {
    // ignore
  }
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = resolveLocale(localStorage.getItem(LOCALE_COOKIE_KEY));
    if (stored !== locale) {
      setLocaleState(stored);
      persistLocale(stored);
      router.refresh();
    } else {
      persistLocale(stored);
    }
    // Only sync once on mount from storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      persistLocale(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(
    () => ({
      locale,
      messages: getMessages(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useTranslations() {
  return useLocale().messages;
}

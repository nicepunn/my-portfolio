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
  LOCALE_STORAGE_KEY,
  localeMeta,
  resolveLocale,
  type Locale,
} from "@/i18n/config";
import { getMessages, type Messages } from "@/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Persist on this device only (localStorage) and mirror cookie for SSR. */
function persistLocale(locale: Locale) {
  document.documentElement.lang = localeMeta[locale].htmlLang;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Private mode / blocked storage — cookie still helps this session.
  }
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
}

function readDeviceLocale(): Locale {
  try {
    return resolveLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readDeviceLocale();
    setLocaleState(stored);
    persistLocale(stored);
    setReady(true);
    if (stored !== initialLocale) {
      router.refresh();
    }
    // Hydrate once from this device's localStorage.
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
      ready,
    }),
    [locale, setLocale, ready],
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  DEFAULT_UI,
  THEME_STORAGE_KEY,
  UI_STORAGE_KEY,
  applyTheme,
  applyUi,
  resolveTheme,
  resolveUi,
  type Theme,
  type UiSkin,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  ui: UiSkin;
  setUi: (ui: UiSkin) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return resolveTheme(document.documentElement.dataset.theme ?? null);
  }
}

function readStoredUi(): UiSkin {
  try {
    return resolveUi(localStorage.getItem(UI_STORAGE_KEY));
  } catch {
    return resolveUi(document.documentElement.dataset.ui ?? null);
  }
}

function syncFromStorage(
  setThemeState: (theme: Theme) => void,
  setUiState: (ui: UiSkin) => void,
) {
  const nextTheme = readStoredTheme();
  const nextUi = readStoredUi();
  setThemeState(nextTheme);
  setUiState(nextUi);
  applyTheme(nextTheme);
  applyUi(nextUi);
  return { nextTheme, nextUi };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [ui, setUiState] = useState<UiSkin>(DEFAULT_UI);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    syncFromStorage(setThemeState, setUiState);
    setReady(true);

    // bfcache / history restore must re-apply device prefs (not a draft on leave).
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      syncFromStorage(setThemeState, setUiState);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const setUi = useCallback((next: UiSkin) => {
    localStorage.setItem(UI_STORAGE_KEY, next);
    setUiState(next);
    applyUi(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ui, setUi, ready }),
    [theme, setTheme, toggleTheme, ui, setUi, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

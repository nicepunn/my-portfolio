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
  DEFAULT_GLASS,
  DEFAULT_THEME,
  DEFAULT_UI,
  GLASS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  UI_STORAGE_KEY,
  applyGlass,
  applyTheme,
  applyUi,
  resolveGlass,
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
  glass: number;
  setGlass: (slider: number) => void;
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

function readStoredGlass(): number {
  try {
    return resolveGlass(localStorage.getItem(GLASS_STORAGE_KEY));
  } catch {
    return DEFAULT_GLASS;
  }
}

function syncFromStorage(
  setThemeState: (theme: Theme) => void,
  setUiState: (ui: UiSkin) => void,
  setGlassState: (slider: number) => void,
) {
  const nextTheme = readStoredTheme();
  const nextUi = readStoredUi();
  const nextGlass = readStoredGlass();
  setThemeState(nextTheme);
  setUiState(nextUi);
  setGlassState(nextGlass);
  applyTheme(nextTheme);
  applyUi(nextUi);
  applyGlass(nextGlass);
  return { nextTheme, nextUi, nextGlass };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [ui, setUiState] = useState<UiSkin>(DEFAULT_UI);
  const [glass, setGlassState] = useState(DEFAULT_GLASS);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    syncFromStorage(setThemeState, setUiState, setGlassState);
    setReady(true);

    // bfcache / history restore must re-apply device prefs (not a draft on leave).
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      syncFromStorage(setThemeState, setUiState, setGlassState);
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

  const setGlass = useCallback((slider: number) => {
    const next = resolveGlass(String(slider));
    localStorage.setItem(GLASS_STORAGE_KEY, String(next));
    setGlassState(next);
    applyGlass(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ui, setUi, glass, setGlass, ready }),
    [theme, setTheme, toggleTheme, ui, setUi, glass, setGlass, ready],
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

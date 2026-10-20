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
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [ui, setUiState] = useState<UiSkin>(DEFAULT_UI);

  useEffect(() => {
    const initialTheme = resolveTheme(localStorage.getItem(THEME_STORAGE_KEY));
    const initialUi = resolveUi(localStorage.getItem(UI_STORAGE_KEY));
    setThemeState(initialTheme);
    setUiState(initialUi);
    applyTheme(initialTheme);
    applyUi(initialUi);
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
    () => ({ theme, setTheme, toggleTheme, ui, setUi }),
    [theme, setTheme, toggleTheme, ui, setUi],
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

export type Theme = "light" | "dark";

export const UI_SKINS = ["editorial", "brick", "soft", "cyber"] as const;
export type UiSkin = (typeof UI_SKINS)[number];

export const THEME_STORAGE_KEY = "resume-theme";
export const UI_STORAGE_KEY = "resume-ui";
export const DEFAULT_THEME: Theme = "dark";
export const DEFAULT_UI: UiSkin = "editorial";

/** Dark-mode identity colors for the settings swatch (bg, accent, fg). */
export const UI_SKIN_SWATCHES: Record<UiSkin, readonly [string, string, string]> =
  {
    editorial: ["#070a0d", "#3dd6c3", "#e8e4dc"],
    brick: ["#1c1210", "#e07848", "#f6eadf"],
    soft: ["#14121a", "#c4b5fd", "#f6f1f8"],
    cyber: ["#05070b", "#2ee6ff", "#e7fff6"],
  };

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(stored: string | null): Theme {
  return isTheme(stored) ? stored : DEFAULT_THEME;
}

export function isUiSkin(value: string | null | undefined): value is UiSkin {
  return UI_SKINS.some((skin) => skin === value);
}

export function resolveUi(stored: string | null): UiSkin {
  return isUiSkin(stored) ? stored : DEFAULT_UI;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function applyUi(ui: UiSkin) {
  document.documentElement.dataset.ui = ui;
}

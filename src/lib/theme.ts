export type Theme = "light" | "dark";

export const UI_SKINS = ["editorial", "soft", "glass", "cyber"] as const;
export type UiSkin = (typeof UI_SKINS)[number];

export const THEME_STORAGE_KEY = "resume-theme";
export const UI_STORAGE_KEY = "resume-ui";
export const GLASS_STORAGE_KEY = "resume-glass";
export const DEFAULT_THEME: Theme = "dark";
export const DEFAULT_UI: UiSkin = "soft";
/** Slider position stored in resume-glass. Higher is more see-through. */
export const GLASS_MIN = 0;
export const GLASS_MAX = 100;
export const DEFAULT_GLASS = 50;
/** Mapped transparency. Slider 0 → 65, slider 100 → 95. */
export const GLASS_TRANSPARENCY_MIN = 65;
export const GLASS_TRANSPARENCY_SPAN = 30;

/** Dark-mode identity colors for the settings swatch (bg, accent, fg). */
export const UI_SKIN_SWATCHES: Record<UiSkin, readonly [string, string, string]> =
  {
    editorial: ["#070a0d", "#3dd6c3", "#e8e4dc"],
    soft: ["#14121a", "#c4b5fd", "#f6f1f8"],
    glass: ["#2a2433", "#f7d4e0", "#ffffff"],
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

export function resolveGlass(stored: string | null): number {
  const value = stored == null ? Number.NaN : Number(stored);
  if (!Number.isFinite(value) || value < GLASS_MIN || value > GLASS_MAX) {
    return DEFAULT_GLASS;
  }
  return Math.round(value);
}

/** Map a 0–100 slider position onto transparency 65–95. */
export function glassTransparency(slider: number): number {
  const position = resolveGlass(String(slider));
  return (
    GLASS_TRANSPARENCY_MIN + (position / GLASS_MAX) * GLASS_TRANSPARENCY_SPAN
  );
}

/** Solid-color percent. Transparency 65 → "35%", transparency 95 → "5%". */
export function glassAlpha(transparency: number): string {
  return `${100 - transparency}%`;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function applyUi(ui: UiSkin) {
  const root = document.documentElement;
  root.dataset.ui = ui;
  if (ui === "soft" || ui === "glass") root.dataset.soft = "";
  else delete root.dataset.soft;
}

export function applyGlass(slider: number) {
  document.documentElement.style.setProperty(
    "--glass-alpha",
    glassAlpha(glassTransparency(slider)),
  );
}

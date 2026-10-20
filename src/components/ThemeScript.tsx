import {
  DEFAULT_THEME,
  DEFAULT_UI,
  THEME_STORAGE_KEY,
  UI_SKINS,
  UI_STORAGE_KEY,
} from "@/lib/theme";

/** Inline boot script to avoid a flash of the wrong theme or skin before hydration. */
export function ThemeScript() {
  const allowed = UI_SKINS.map((skin) => JSON.stringify(skin)).join(",");
  const code = `(function(){try{var tk=${JSON.stringify(THEME_STORAGE_KEY)};var uk=${JSON.stringify(UI_STORAGE_KEY)};var s=localStorage.getItem(tk);var u=localStorage.getItem(uk);var t=(s==="light"||s==="dark")?s:${JSON.stringify(DEFAULT_THEME)};var allowed=[${allowed}];var ui=allowed.indexOf(u)!==-1?u:${JSON.stringify(DEFAULT_UI)};var el=document.documentElement;el.dataset.theme=t;el.dataset.ui=ui;el.style.colorScheme=t;}catch(e){var el=document.documentElement;el.dataset.theme=${JSON.stringify(DEFAULT_THEME)};el.dataset.ui=${JSON.stringify(DEFAULT_UI)};el.style.colorScheme=${JSON.stringify(DEFAULT_THEME)};}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

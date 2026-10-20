import {
  DEFAULT_GLASS,
  DEFAULT_THEME,
  DEFAULT_UI,
  GLASS_MAX,
  GLASS_MIN,
  GLASS_STORAGE_KEY,
  GLASS_TRANSPARENCY_MIN,
  GLASS_TRANSPARENCY_SPAN,
  THEME_STORAGE_KEY,
  UI_SKINS,
  UI_STORAGE_KEY,
} from "@/lib/theme";

/** Inline boot script to avoid a flash of the wrong theme or skin before hydration. */
export function ThemeScript() {
  const allowed = UI_SKINS.map((skin) => JSON.stringify(skin)).join(",");
  const code = `(function(){try{var tk=${JSON.stringify(THEME_STORAGE_KEY)};var uk=${JSON.stringify(UI_STORAGE_KEY)};var gk=${JSON.stringify(GLASS_STORAGE_KEY)};var s=localStorage.getItem(tk);var u=localStorage.getItem(uk);var raw=localStorage.getItem(gk);var n=raw==null?NaN:Number(raw);var g=Math.round(n);var t=(s==="light"||s==="dark")?s:${JSON.stringify(DEFAULT_THEME)};var allowed=[${allowed}];var ui=allowed.indexOf(u)!==-1?u:${JSON.stringify(DEFAULT_UI)};if(!(n>=${GLASS_MIN}&&n<=${GLASS_MAX}))g=${DEFAULT_GLASS};var transparency=${GLASS_TRANSPARENCY_MIN}+(g/${GLASS_MAX})*${GLASS_TRANSPARENCY_SPAN};var el=document.documentElement;el.dataset.theme=t;el.dataset.ui=ui;if(ui==="soft"||ui==="glass")el.dataset.soft="";else delete el.dataset.soft;el.style.colorScheme=t;el.style.setProperty("--glass-alpha",(100-transparency)+"%");}catch(e){var el=document.documentElement;el.dataset.theme=${JSON.stringify(DEFAULT_THEME)};el.dataset.ui=${JSON.stringify(DEFAULT_UI)};el.dataset.soft="";el.style.colorScheme=${JSON.stringify(DEFAULT_THEME)};}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

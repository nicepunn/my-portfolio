import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

/** Inline boot script to avoid a flash of the wrong theme before hydration. */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:${JSON.stringify(DEFAULT_THEME)};document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_THEME)};document.documentElement.style.colorScheme=${JSON.stringify(DEFAULT_THEME)};}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

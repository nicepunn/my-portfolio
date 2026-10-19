import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Inline boot script to avoid a flash of the wrong theme before hydration. */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark";}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

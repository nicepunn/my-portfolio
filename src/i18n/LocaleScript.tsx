import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, localeMeta } from "@/i18n/config";

/** Inline boot script so `lang` matches the stored locale before hydration. */
export function LocaleScript() {
  const meta = JSON.stringify(
    Object.fromEntries(
      Object.entries(localeMeta).map(([code, value]) => [code, value.htmlLang]),
    ),
  );
  const code = `(function(){try{var k=${JSON.stringify(LOCALE_COOKIE_KEY)};var s=localStorage.getItem(k);if(!s){var m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]*)"));s=m?decodeURIComponent(m[1]):null;}var map=${meta};var t=map[s]?s:${JSON.stringify(DEFAULT_LOCALE)};document.documentElement.lang=map[t]||${JSON.stringify(localeMeta[DEFAULT_LOCALE].htmlLang)};}catch(e){document.documentElement.lang=${JSON.stringify(localeMeta[DEFAULT_LOCALE].htmlLang)};}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

import type { Lang } from "./dict.ts";

// Which language a page is in, and where its other-language version lives.
//
// The URL decides: /tr/… is Turkish, everything else English. Each language has
// its own addresses so search engines can index both (a page that switched
// language in place was only ever indexed in English). The visitor's own
// preference never changes what a URL shows — it only decides whether to
// *suggest* the other version, and the visitor chooses.
//
// React-free, so learn.js, scripts/prerender.ts and the tests can use it.

const TR_PAGE = /\/tr\/([^/]*)$/;
const LANG_KEY = "lang";

/** The language a page path is in: "/LLMScale/tr/fit.html" is Turkish. */
export function langOfPath(pathname: string): Lang {
  return TR_PAGE.test(pathname) ? "tr" : "en";
}

/** The same page in `lang`: "/LLMScale/fit.html" ↔ "/LLMScale/tr/fit.html",
 *  "/LLMScale/" ↔ "/LLMScale/tr/". Works for any base path, "/" included. */
export function pathFor(pathname: string, lang: Lang): string {
  if (langOfPath(pathname) === lang) return pathname;
  return lang === "tr" ? pathname.replace(/\/([^/]*)$/, "/tr/$1") : pathname.replace(TR_PAGE, "/$1");
}

/** The visitor's preference: a language they picked on the site, else their
 *  browser's. Only ever used to offer the other version. */
export function preferredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "tr") return stored;
  } catch {
    /* localStorage unavailable */
  }
  return typeof navigator !== "undefined" && navigator.language?.startsWith("tr") ? "tr" : "en";
}

/** Record a language the visitor chose — by switching, or by dismissing the
 *  suggestion to switch — so they are not offered the other one again. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* localStorage unavailable */
  }
}

/** The suggestion, written in the language it offers: a Turkish reader on an
 *  English page reads it in Turkish. Shared by the app and LLM 101. */
export const SUGGEST: Record<Lang, { text: string; go: string; dismiss: string }> = {
  en: { text: "This page is also available in English.", go: "Switch to English", dismiss: "Dismiss" },
  tr: { text: "Bu sayfa Türkçe olarak da var.", go: "Türkçe'ye geç", dismiss: "Kapat" },
};

/** How each language names itself, for links to the other version. */
export const LANG_NAME: Record<Lang, string> = { en: "English", tr: "Türkçe" };

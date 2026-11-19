import { DEFAULT_LANG, ENABLED_LANGS, LANG_META, isLang, type Lang } from "./langs.ts";

// Which language a page is in, and where its other-language versions live.
//
// The URL decides: /tr/… is Turkish, /zh/… Chinese, everything without a
// language folder English. Each language has its own addresses so search engines
// can index every version (a page that switched language in place was only ever
// indexed in English). The visitor's own preference never changes what a URL
// shows — it only decides whether to *suggest* another version, and the visitor
// chooses.
//
// React-free, so learn.js, scripts/prerender.ts and the tests can use it.

/** The languages that live in a folder of their own, by that folder's name. */
const FOLDERS = ENABLED_LANGS.filter((l) => LANG_META[l].prefix).map((l) => [LANG_META[l].prefix.slice(0, -1), l] as const);
const LANG_PAGE = new RegExp(`/(${FOLDERS.map(([f]) => f).join("|") || "(?!)"})/([^/]*)$`);
const LANG_KEY = "lang";

/** The language a page path is in: "/LLMScale/tr/fit.html" is Turkish. */
export function langOfPath(pathname: string): Lang {
  const folder = LANG_PAGE.exec(pathname)?.[1];
  return FOLDERS.find(([f]) => f === folder)?.[1] ?? DEFAULT_LANG;
}

/** The same page in `lang`: "/LLMScale/fit.html" ↔ "/LLMScale/tr/fit.html",
 *  "/LLMScale/" ↔ "/LLMScale/tr/". Works for any base path, "/" included. */
export function pathFor(pathname: string, lang: Lang): string {
  if (langOfPath(pathname) === lang) return pathname;
  const root = pathname.replace(LANG_PAGE, "/$2");
  return LANG_META[lang].prefix ? root.replace(/\/([^/]*)$/, `/${LANG_META[lang].prefix}$1`) : root;
}

/** A language's home under the site's base path: "/LLMScale/" + "tr/". */
export const langHome = (base: string, lang: Lang) => base + LANG_META[lang].prefix;

/** The first of `langs` (the enabled languages unless given) in a browser's
 *  list of preferred ones (BCP 47 tags, most wanted first), if any. Traditional
 *  Chinese — zh-Hant, or zh in Taiwan, Hong Kong or Macau without a script — is
 *  not matched to the simplified Chinese version (D8): such a reader is passed
 *  over to the next language they read. The static pages run the same rule in
 *  the browser (MATCH_LANG_JS in scripts/shell.ts). */
export function matchLang<L extends string = Lang>(
  tags: readonly (string | null | undefined)[],
  langs: readonly L[] = ENABLED_LANGS as readonly string[] as readonly L[]
): L | undefined {
  for (const tag of tags) {
    const parts = (tag ?? "").toLowerCase().split(/[-_]/);
    const code = parts[0];
    if (code === "zh") {
      const script = parts.find((p) => p === "hans" || p === "hant");
      if (script === "hant" || (!script && parts.some((p) => p === "tw" || p === "hk" || p === "mo"))) continue;
    }
    if ((langs as readonly string[]).includes(code)) return code as L;
  }
  return undefined;
}

/** The visitor's preference: a language they picked on the site, else the
 *  first of their browser's that the site is in. Only ever used to offer that
 *  version. */
export function preferredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  if (typeof navigator === "undefined") return DEFAULT_LANG;
  return matchLang(navigator.languages?.length ? navigator.languages : [navigator.language]) ?? DEFAULT_LANG;
}

/** Record a language the visitor chose — by switching, or by dismissing the
 *  suggestion to switch — so they are not offered another one again. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* localStorage unavailable */
  }
}

/** The suggestion, written in the language it offers: a Turkish reader on an
 *  English page reads it in Turkish. Shared by the app, LLM 101 and the static
 *  pages. */
export const SUGGEST: Record<Lang, { text: string; go: string; dismiss: string }> = {
  en: { text: "This page is also available in English.", go: "Switch to English", dismiss: "Dismiss" },
  tr: { text: "Bu sayfa Türkçe olarak da var.", go: "Türkçe'ye geç", dismiss: "Kapat" },
};

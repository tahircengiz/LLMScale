// The site's languages, in one place (docs/i18n-plan.md §3.1).
//
// LANGS is every language the site is planned in, with what a page needs to
// carry one: its address prefix, hreflang and `lang` code, writing direction,
// the name it calls itself, the Intl locale numbers are formatted with, and
// og:locale. ENABLED_LANGS is the ones this build writes pages for; `Lang` is
// one of those. Text tables are keyed by `Lang`, so enabling a language makes
// the type checker list every table that still lacks it.
//
// React-free and import-free, so the browser bundle, learn.js, the build scripts
// and vite.config.ts can all read it.

export const LANGS = ["en", "tr", "zh", "hi", "es", "fr", "pt", "id", "bn", "ar", "ur", "ru", "de", "ja"] as const;
/** Any planned language, enabled or not. */
export type LangCode = (typeof LANGS)[number];

export const ENABLED_LANGS = ["en", "tr"] as const satisfies readonly LangCode[];
/** A language this build writes pages in. */
export type Lang = (typeof ENABLED_LANGS)[number];

/** The news feed is written in English and Turkish only (D3): its pages and RSS
 *  exist in these, whatever else the site is in. */
export const FEED_LANGS = ["en", "tr"] as const satisfies readonly Lang[];
export type FeedLang = (typeof FEED_LANGS)[number];

/** The language a page falls back to: the root of the site, and x-default. */
export const DEFAULT_LANG = "en" satisfies Lang;

export interface LangMeta {
  /** Where its pages live under the site's base path: "" for the root, "tr/". */
  prefix: string;
  /** hreflang and the `lang` attribute (BCP 47). */
  hreflang: string;
  dir: "ltr" | "rtl";
  /** What the language calls itself, for the language menu. */
  name: string;
  /** The Intl locale numbers are formatted with. Latin digits everywhere (D6),
   *  so figures read like the model and GPU names around them (70B, H100). */
  intl: string;
  /** Open Graph locale. */
  og: string;
}

export const LANG_META: Record<LangCode, LangMeta> = {
  en: { prefix: "", hreflang: "en", dir: "ltr", name: "English", intl: "en-US-u-nu-latn", og: "en_US" },
  tr: { prefix: "tr/", hreflang: "tr", dir: "ltr", name: "Türkçe", intl: "tr-TR-u-nu-latn", og: "tr_TR" },
  zh: { prefix: "zh/", hreflang: "zh-Hans", dir: "ltr", name: "简体中文", intl: "zh-Hans-CN-u-nu-latn", og: "zh_CN" },
  hi: { prefix: "hi/", hreflang: "hi", dir: "ltr", name: "हिन्दी", intl: "hi-IN-u-nu-latn", og: "hi_IN" },
  es: { prefix: "es/", hreflang: "es", dir: "ltr", name: "Español", intl: "es-u-nu-latn", og: "es_ES" },
  fr: { prefix: "fr/", hreflang: "fr", dir: "ltr", name: "Français", intl: "fr-FR-u-nu-latn", og: "fr_FR" },
  pt: { prefix: "pt/", hreflang: "pt", dir: "ltr", name: "Português", intl: "pt-BR-u-nu-latn", og: "pt_BR" },
  id: { prefix: "id/", hreflang: "id", dir: "ltr", name: "Bahasa Indonesia", intl: "id-ID-u-nu-latn", og: "id_ID" },
  bn: { prefix: "bn/", hreflang: "bn", dir: "ltr", name: "বাংলা", intl: "bn-BD-u-nu-latn", og: "bn_IN" },
  ar: { prefix: "ar/", hreflang: "ar", dir: "rtl", name: "العربية", intl: "ar-u-nu-latn", og: "ar_AR" },
  ur: { prefix: "ur/", hreflang: "ur", dir: "rtl", name: "اردو", intl: "ur-PK-u-nu-latn", og: "ur_PK" },
  ru: { prefix: "ru/", hreflang: "ru", dir: "ltr", name: "Русский", intl: "ru-RU-u-nu-latn", og: "ru_RU" },
  de: { prefix: "de/", hreflang: "de", dir: "ltr", name: "Deutsch", intl: "de-DE-u-nu-latn", og: "de_DE" },
  ja: { prefix: "ja/", hreflang: "ja", dir: "ltr", name: "日本語", intl: "ja-JP-u-nu-latn", og: "ja_JP" },
};

/** Whether a string names a language this build writes. */
export const isLang = (s: unknown): s is Lang => (ENABLED_LANGS as readonly unknown[]).includes(s);

/** `<html lang dir>` for a page in `lang`. */
export const htmlLangAttrs = (lang: LangCode) => `lang="${LANG_META[lang].hreflang}" dir="${LANG_META[lang].dir}"`;

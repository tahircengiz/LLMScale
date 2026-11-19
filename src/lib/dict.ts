// The pure lookup over the dictionaries in src/locales/. Kept free of React so
// scripts can import it directly (node scripts/test-choices.ts).
//
// The dictionaries are not imported here. A page in the browser loads only its
// own language's, before the app first renders (main.tsx, loadDict); the build
// and the tests import them all at once from src/locales/index.ts, which hands
// each one to setDict. So an English page no longer downloads Turkish.
import type { Lang } from "./langs.ts";
import type { Key } from "../locales/en.ts";

export type { Lang } from "./langs.ts";
export type { Key } from "../locales/en.ts";
/** A dictionary as code reads it: by any string, since keys are often built
 *  (`cat.${category}`). The locale files themselves are checked against Key. */
export type Dict = Record<string, string>;

/** Each language's dictionary, in its own chunk. Keyed by Lang, so enabling a
 *  language fails the type check until it has a dictionary to load. */
const LOADERS: Record<Lang, () => Promise<{ default: Record<Key, string> }>> = {
  en: () => import("../locales/en.ts"),
  tr: () => import("../locales/tr.ts"),
  es: () => import("../locales/es.ts"),
  hi: () => import("../locales/hi.ts"),
  zh: () => import("../locales/zh.ts"),
};

const loaded: Partial<Record<Lang, Dict>> = {};

/** Make a dictionary available to translate(). */
export function setDict(lang: Lang, dict: Dict): void {
  loaded[lang] = dict;
}

/** Fetch `lang`'s dictionary, once. */
export async function loadDict(lang: Lang): Promise<Dict> {
  return (loaded[lang] ??= (await LOADERS[lang]()).default);
}

/** Whether `lang`'s dictionary, once loaded, has `key`. Every language has the same keys. */
export function hasKey(lang: Lang, key: string): boolean {
  return key in (loaded[lang] ?? {});
}

/** Items listed in running text, joined the way `lang` writes them (list.sep):
 *  ", " in most languages, 、 in Chinese. Not Intl.ListFormat, which would change
 *  the English and Turkish text too. */
export function joinList(lang: Lang, items: readonly (string | number)[]): string {
  return items.join(translate(lang, "list.sep"));
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = loaded[lang]?.[key] ?? loaded.en?.[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

// Display formatting helpers.
import { DEFAULT_LANG, LANG_META, type Lang } from "./langs.ts";

/** The language formatInt and formatParams group digits in: the page's, set
 *  before it renders (main.tsx in the browser, entry-server.tsx per page in the
 *  build), so neither the visitor's browser nor the build machine picks it. */
let pageLang: Lang = DEFAULT_LANG;
export function setFormatLang(lang: Lang): void {
  pageLang = lang;
}

export function formatGiB(gib: number): string {
  if (gib < 0.01) return "<0.01 GiB";
  if (gib < 1) return `${(gib * 1024).toFixed(0)} MiB`;
  if (gib < 100) return `${gib.toFixed(2)} GiB`;
  return `${gib.toFixed(1)} GiB`;
}

export function formatParams(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return formatNumber(n, pageLang);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
}

export function formatInt(n: number): string {
  return formatNumber(n, pageLang);
}

// ── by the page's language ────────────────────────────────────────────────────
// Grouping and decimal separator follow the language's Intl locale (LANG_META),
// with Latin digits in every language (D6). The build formats explicitly too: the
// build machine's own locale must not leak into a page.

/** A number as `lang` writes it: 131,072 in English, 131.072 in Turkish. */
export function formatNumber(n: number, lang: Lang, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LANG_META[lang].intl, opts).format(n);
}

/** A date as `lang` writes it. */
export function formatDate(d: Date, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LANG_META[lang].intl, opts).format(d);
}

/** Rewrite the decimal points in already-formatted text the way `lang` writes
 *  them: "12.34 GiB" stays in English and reads "12,34 GiB" in Turkish. */
export function localizeDecimals(s: string, lang: Lang): string {
  const sep = new Intl.NumberFormat(LANG_META[lang].intl).formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".";
  return sep === "." ? s : s.replace(/(\d)\.(\d)/g, `$1${sep}$2`);
}

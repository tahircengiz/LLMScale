// The dictionaries against each other and against the code that reads them
// (audit phase 4, from the 2026-10-15 audit's i18n.ts), and the rules that keep the
// site open to more languages (docs/i18n-plan.md). Run: node scripts/test-i18n.ts
//
// Here:
//   - every enabled language defines exactly English's keys, and the built
//     guides' words (scripts/locales/) in the same shape;
//   - each key has the same {placeholders} in every language, except English's
//     plural {s}, which other languages may not need — a string missing one shows
//     the raw braces;
//   - every key the code names exists: t("ns.key"), key: "ns.key" in warning and
//     reason objects, and the explainer parts { k, v } the config and serving pages
//     translate under config.a. and serve.a.; every t(`ns.${…}`) prefix has entries;
//   - every call and part that passes vars passes all of the key's placeholders.
// The audit's version matched with regular expressions and reported 30 sites that
// were fine (vars with nested calls or template literals, config keys taken for
// dictionary ones); this one reads the vars object with brackets and strings
// balanced, and the explainer parts by the prefix their page puts on them.
//   - no code picks its words with an inline language test (lang === "tr" ? … : …,
//     const en = …) or a hand list of languages: words live in the locale files,
//     languages in src/lib/langs.ts, so enabling one is a file and a line;
//   - every right-to-left language's pages say dir="rtl", every other dir="ltr"
//     (none is enabled yet: the check stands ready);
//   - in a built site (dist/), every page's hreflang set is reciprocal: each
//     version it names names the same set back, and x-default is the default
//     language's version.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DICTS } from "../src/locales/index.ts";
import { DEFAULT_LANG, ENABLED_LANGS, htmlLangAttrs, LANG_META, LANGS } from "../src/lib/langs.ts";
import { PAGE_TEXT } from "./locales/index.ts";
import { finish, Prop } from "./sweep-kit.ts";

const t0 = Date.now();
const en = DICTS.en;
const OTHERS = ENABLED_LANGS.filter((l) => l !== "en");
const placeholders = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
/** English's plural suffix: "{n} file{s}". */
const PLURAL = "s";

const P = {
  keys: new Prop("every enabled language defines exactly EN's dictionary keys"),
  shape: new Prop("every enabled language gives the built guides the same words as EN (scripts/locales/)"),
  ph: new Prop("every language uses EN's {placeholders} per key (it may leave out the plural {s})"),
  used: new Prop("every key the code names exists in EN"),
  prefix: new Prop("every t(`ns.${…}`) prefix used in code has entries"),
  vars: new Prop("every call that passes vars passes each placeholder of its key"),
};

for (const lang of OTHERS) {
  const dict = DICTS[lang];
  for (const k of Object.keys(en)) P.keys.ok(k in dict, () => `${lang} lacks ${k}`);
  for (const k of Object.keys(dict)) P.keys.ok(k in en, () => `${lang} has ${k}, EN does not`);
  for (const k of Object.keys(en)) {
    if (!(k in dict)) continue; // reported above
    const e = placeholders(en[k]);
    const t = placeholders(dict[k]);
    const ok = t.every((p) => e.includes(p)) && e.every((p) => t.includes(p) || p === PLURAL);
    P.ph.ok(ok, () => `${k}: EN {${e.join("},{")}} | ${lang.toUpperCase()} {${t.join("},{")}}`);
  }
}

/** The leaves of a locale object, as "path: string" or "path: function". */
function leaves(o: object, path = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? leaves(v, `${path}${k}.`) : [`${path}${k}: ${typeof v}`]
  );
}
const enShape = leaves(PAGE_TEXT.en);
for (const lang of OTHERS) {
  const shape = new Set(leaves(PAGE_TEXT[lang]));
  for (const l of enShape) P.shape.ok(shape.has(l), () => `${lang} lacks ${l}`);
  for (const l of shape) P.shape.ok(enShape.includes(l), () => `${lang} has ${l}, EN does not`);
}

/** Index just past the string literal that opens at `i` (', " or `, with ${…} inside templates). */
function skipString(src: string, i: number): number {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === "\\") j += 2;
    else if (c === q) return j + 1;
    else if (q === "`" && c === "$" && src[j + 1] === "{") j = skipBlock(src, j + 1);
    else j++;
  }
  return j;
}
/** Index just past the bracketed block that opens at `i`, strings skipped. */
function skipBlock(src: string, i: number): number {
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const c = src[j];
    if (c === "'" || c === '"' || c === "`") {
      j = skipString(src, j);
      continue;
    }
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") {
      depth--;
      if (depth === 0) return j + 1;
    }
    j++;
  }
  return j;
}
/** The property names of the object literal opening at `i`; null if it spreads another object. */
function objectKeys(src: string, i: number): string[] | null {
  const body = src.slice(i + 1, skipBlock(src, i) - 1);
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let j = 0; j < body.length; j++) {
    const c = body[j];
    if (c === "'" || c === '"' || c === "`") {
      j = skipString(body, j) - 1;
      continue;
    }
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      parts.push(body.slice(start, j));
      start = j + 1;
    }
  }
  parts.push(body.slice(start));
  const keys: string[] = [];
  for (const raw of parts.map((p) => p.trim()).filter(Boolean)) {
    if (raw.startsWith("...")) return null;
    const m = /^["']?(\w+)["']?\s*(?::|$)/.exec(raw);
    if (m) keys.push(m[1]);
  }
  return keys;
}

const root = new URL("../", import.meta.url).pathname;
const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|js)$/.test(f) && f !== "dict.ts") files.push(p);
  }
};
walk(join(root, "src"));
// The dictionaries are what the code is checked against, not code that names keys.
files.splice(0, files.length, ...files.filter((f) => !f.includes("/src/locales/")));

const namespaces = new Set(Object.keys(en).map((k) => k.split(".")[0]));
/** Explainer parts { k, v }: the prefix their page translates them under
 *  (ConfigPage.tsx t(`config.a.${p.k}`, p.v), ServingPage.tsx t(`serve.a.${p.k}`, p.v)). */
const PART_PREFIX: Record<string, string> = { "src/lib/configExplain.ts": "config.a.", "src/lib/serving.ts": "serve.a." };
for (const [page, prefix] of [["src/pages/ConfigPage.tsx", "config.a."], ["src/pages/ServingPage.tsx", "serve.a."]]) {
  const uses = readFileSync(join(root, page), "utf8").includes("t(`" + prefix + "${");
  P.prefix.ok(uses, () => `${page} no longer translates its parts under ${prefix} — update PART_PREFIX`);
}
let calls = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const rel = f.slice(root.length);
  // t("ns.key") and t("ns.key", { … })
  for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z0-9_.]+)"/g)) {
    const key = m[1];
    if (!key.includes(".")) continue;
    calls++;
    P.used.ok(key in en, () => `${rel}: t("${key}")`);
    if (!(key in en)) continue;
    let j = m.index! + m[0].length;
    while (/\s/.test(src[j])) j++;
    const need = placeholders(en[key]);
    if (src[j] === ",") {
      j++;
      while (/\s/.test(src[j])) j++;
      if (src[j] !== "{") continue; // vars built elsewhere
      const given = objectKeys(src, j);
      if (!given) continue;
      const missing = need.filter((p) => !given.includes(p));
      P.vars.ok(!missing.length, () => `${rel}: t("${key}", {${given.join(", ")}}) leaves {${missing.join("},{")}} unfilled`);
    } else if (need.length) {
      P.vars.ok(false, () => `${rel}: t("${key}") without vars, but the string has {${need.join("},{")}}`);
    }
  }
  // { key: "ns.key", vars: { … } } in warnings, reasons and labels; { k: "part", v: { … } } in explainers
  const partPrefix = PART_PREFIX[rel];
  for (const m of src.matchAll(/\b(key|reasonKey|msgKey|labelKey|k)\s*:\s*"([a-zA-Z0-9_.]+)"/g)) {
    const isPart = m[1] === "k" && partPrefix !== undefined;
    const key = isPart ? partPrefix + m[2] : m[2];
    if (!isPart && (!key.includes(".") || !namespaces.has(key.split(".")[0]))) continue; // a config key, not a dictionary one
    P.used.ok(key in en, () => `${rel}: ${m[0]}${isPart ? ` (as ${key})` : ""}`);
    const after = /^\s*,\s*(?:vars|reasonVars|v)\s*:\s*\{/.exec(src.slice(m.index! + m[0].length));
    if (key in en && after) {
      const given = objectKeys(src, m.index! + m[0].length + after[0].length - 1);
      if (!given) continue;
      const missing = placeholders(en[key]).filter((p) => !given.includes(p));
      P.vars.ok(!missing.length, () => `${rel}: ${key} with {${given.join(", ")}} leaves {${missing.join("},{")}} unfilled`);
    }
  }
  for (const m of src.matchAll(/\bt\(\s*`([a-zA-Z0-9_.]+)\$\{/g)) {
    P.prefix.ok(Object.keys(en).some((k) => k.startsWith(m[1])), () => `${rel}: t(\`${m[1]}\${…}\`)`);
  }
}

// ── no inline language branches ───────────────────────────────────────────────
// Words chosen by testing the language in place are words a new language cannot
// supply. The locale files, the language list and the tests are where language
// codes belong.
const branch = new Prop("no code picks its words by testing the language inline, or lists the languages by hand");
const CODES = LANGS.join("|");
const BRANCHES = [
  // lang === "tr", p.lang !== "en", "tr" === lang
  new RegExp(`\\b\\w*[lL]ang\\w*\\s*[!=]==?\\s*["'](?:${CODES})["']`),
  new RegExp(`["'](?:${CODES})["']\\s*[!=]==?\\s*[\\w.]*[lL]ang\\b`),
  // const en = …, the flag a whole page's ternaries hang on
  /\b(?:const|let|var)\s+(?:en|tr|isEn|isTr)\s*=/,
  // a hand list of languages
  new RegExp(`\\[\\s*["'](?:${CODES})["']\\s*,\\s*["'](?:${CODES})["']`),
];
const codeFiles: string[] = [];
const walkCode = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    const rel = relative(root, p);
    if (statSync(p).isDirectory()) {
      if (!["node_modules", "locales", "data"].includes(f)) walkCode(p);
    } else if (/\.(tsx?|jsx?)$/.test(f) && !/^test-/.test(f) && rel !== "src/lib/langs.ts") codeFiles.push(p);
  }
};
for (const d of ["src", "scripts", "newsroom"]) walkCode(join(root, d));
for (const f of codeFiles) {
  const rel = relative(root, f);
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // a comment may name a language
    const hit = BRANCHES.find((re) => re.test(line));
    branch.ok(!hit, () => `${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
  });
}

// ── direction ─────────────────────────────────────────────────────────────────
const dir = new Prop("a right-to-left language's pages say dir=\"rtl\", every other language's dir=\"ltr\"");
const RTL = LANGS.filter((l) => LANG_META[l].dir === "rtl");
dir.ok(RTL.length > 0, () => "no right-to-left language in LANG_META to check against");
for (const l of LANGS) {
  const want = l === "ar" || l === "ur" ? "rtl" : "ltr";
  dir.ok(LANG_META[l].dir === want, () => `${l}: LANG_META says ${LANG_META[l].dir}, should be ${want}`);
  dir.ok(htmlLangAttrs(l) === `lang="${LANG_META[l].hreflang}" dir="${want}"`, () => `${l}: <html ${htmlLangAttrs(l)}>`);
}
const enabledRtl = ENABLED_LANGS.filter((l) => LANG_META[l].dir === "rtl");
console.log(enabledRtl.length ? `right-to-left languages enabled: ${enabledRtl.join(", ")}` : "no right-to-left language enabled yet: the built-page check below covers left-to-right only");

// ── the built site ────────────────────────────────────────────────────────────
const dist = join(root, "dist");
const builtProps: Prop[] = [];
if (existsSync(join(dist, "index.html"))) {
  const builtDir = new Prop("every built page's <html> carries its language's dir");
  const recip = new Prop("every built page's hreflang set is reciprocal, with x-default on the default language");
  builtProps.push(builtDir, recip);
  const htmlFiles: string[] = [];
  const walkDist = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walkDist(p);
      else if (f.endsWith(".html")) htmlFiles.push(p);
    }
  };
  walkDist(dist);
  const byUrl = new Map<string, { rel: string; alts: Record<string, string> }>();
  const byHreflang = new Map(ENABLED_LANGS.map((l) => [LANG_META[l].hreflang, l]));
  for (const f of htmlFiles) {
    const rel = relative(dist, f);
    const html = readFileSync(f, "utf8");
    const attrs = html.match(/<html lang="([^"]+)"(?: dir="([^"]+)")?/);
    const lang = attrs ? byHreflang.get(attrs[1]) : undefined;
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!lang || !canonical) continue; // a fragment, not a page (sitemap.ts refuses pages without them)
    builtDir.ok(attrs![2] === LANG_META[lang].dir, () => `${rel}: <html lang="${attrs![1]}" dir="${attrs![2] ?? ""}">`);
    const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([A-Za-z-]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    recip.ok(alts[LANG_META[lang].hreflang] === canonical, () => `${rel}: its ${lang} version is not its canonical`);
    byUrl.set(canonical, { rel, alts });
  }
  for (const [, p] of byUrl) {
    const def = p.alts[LANG_META[DEFAULT_LANG].hreflang];
    recip.ok(def !== undefined && p.alts["x-default"] === def, () => `${p.rel}: x-default ${p.alts["x-default"]} is not the ${DEFAULT_LANG} version`);
    for (const [l, target] of Object.entries(p.alts)) {
      if (l === "x-default") continue;
      const other = byUrl.get(target);
      recip.ok(
        !!other && Object.keys(other.alts).length === Object.keys(p.alts).length && Object.entries(p.alts).every(([k, u]) => other.alts[k] === u),
        () => `${p.rel} names ${target} (${l}), which ${other ? "names a different set" : "was not built"}`
      );
    }
  }
  console.log(`dist: ${byUrl.size} pages`);
} else {
  console.log("SKIP  the built-site checks: no dist/ (run npm run build first)");
}

console.log(`${Object.keys(en).length} keys, ${files.length} source files, ${calls} t() calls, ${codeFiles.length} files checked for language branches`);
finish([...Object.values(P), branch, dir, ...builtProps], t0);

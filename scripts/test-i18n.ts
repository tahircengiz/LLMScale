// The two dictionaries against each other and against the code that reads them
// (audit phase 4, from the 2026-10-15 audit's i18n.ts). Run: node scripts/test-i18n.ts
//
// test-invariants.ts checks that EN and TR define the same keys. Here:
//   - each key has the same {placeholders} in both, except English's plural {s},
//     which Turkish does not need — a TR string missing one shows the raw braces;
//   - every key the code names exists: t("ns.key"), key: "ns.key" in warning and
//     reason objects, and the explainer parts { k, v } the config and serving pages
//     translate under config.a. and serve.a.; every t(`ns.${…}`) prefix has entries;
//   - every call and part that passes vars passes all of the key's placeholders.
// The audit's version matched with regular expressions and reported 30 sites that
// were fine (vars with nested calls or template literals, config keys taken for
// dictionary ones); this one reads the vars object with brackets and strings
// balanced, and the explainer parts by the prefix their page puts on them.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DICTS } from "../src/lib/dict.ts";
import { finish, Prop } from "./sweep-kit.ts";

const t0 = Date.now();
const en = DICTS.en;
const tr = DICTS.tr;
const placeholders = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
/** English's plural suffix: "{n} file{s}". */
const PLURAL = "s";

const P = {
  ph: new Prop("EN and TR use the same {placeholders} per key (TR may leave out the plural {s})"),
  used: new Prop("every key the code names exists in EN"),
  prefix: new Prop("every t(`ns.${…}`) prefix used in code has entries"),
  vars: new Prop("every call that passes vars passes each placeholder of its key"),
};

for (const k of Object.keys(en)) {
  if (!(k in tr)) continue; // test-invariants.ts reports it
  const e = placeholders(en[k]);
  const t = placeholders(tr[k]);
  const ok = t.every((p) => e.includes(p)) && e.every((p) => t.includes(p) || p === PLURAL);
  P.ph.ok(ok, () => `${k}: EN {${e.join("},{")}} | TR {${t.join("},{")}}`);
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

console.log(`${Object.keys(en).length} keys, ${files.length} source files, ${calls} t() calls`);
finish(Object.values(P), t0);

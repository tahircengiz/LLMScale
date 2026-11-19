// Which language a URL is in, and where its other version lives.
// Run: node scripts/test-langpath.ts
//
// Every language link on the site — the header menu, the footer, the suggestion
// banner, LLM 101's button — goes through pathFor(), and the app picks its
// language with langOfPath(). A wrong answer here sends people to a 404 or shows
// a page in the wrong language at an address search engines index as the other.
// matchLang() decides which version to offer a visitor; the static pages carry
// the same rule as browser code, which has to give the same answers.
import { ENABLED_LANGS, LANG_META, type Lang } from "../src/lib/langs.ts";
import { langHome, langOfPath, matchLang, pathFor } from "../src/lib/langPath.ts";
import { MATCH_LANG_JS } from "./shell.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

// [path, its language, the same page in the other language]
const cases: [string, "en" | "tr", string][] = [
  ["/LLMScale/", "en", "/LLMScale/tr/"],
  ["/LLMScale/fit.html", "en", "/LLMScale/tr/fit.html"],
  ["/LLMScale/index.html", "en", "/LLMScale/tr/index.html"],
  ["/LLMScale/tr/", "tr", "/LLMScale/"],
  ["/LLMScale/tr/learn.html", "tr", "/LLMScale/learn.html"],
  // The staging site, and a custom domain, serve from the root.
  ["/", "en", "/tr/"],
  ["/vllm.html", "en", "/tr/vllm.html"],
  ["/tr/", "tr", "/"],
];
for (const [path, lang, other] of cases) {
  const otherLang = lang === "en" ? "tr" : "en";
  check(`${path} is ${lang}`, langOfPath(path) === lang, langOfPath(path));
  check(`${path} → ${other}`, pathFor(path, otherLang) === other, pathFor(path, otherLang));
  check(`and back`, pathFor(other, lang) === path, pathFor(other, lang));
  check(`asking for its own language changes nothing`, pathFor(path, lang) === path);
}

// Only the folder holding the page counts: a "tr" further up is not the Turkish tree.
check("a tr folder above the page is not Turkish", langOfPath("/tr/LLMScale/fit.html") === "en");

// Every enabled language against every other, on both base paths.
const at = (base: string, lang: Lang, page: string) => `${langHome(base, lang)}${page}`;
for (const base of ["/LLMScale/", "/"]) {
  for (const page of ["", "fit.html", "learn.html", "vllm.html"]) {
    for (const a of ENABLED_LANGS) {
      check(`${at(base, a, page)} is ${a}`, langOfPath(at(base, a, page)) === a, langOfPath(at(base, a, page)));
      for (const b of ENABLED_LANGS) {
        check(`${at(base, a, page)} in ${b}`, pathFor(at(base, a, page), b) === at(base, b, page), pathFor(at(base, a, page), b));
      }
    }
  }
}
check("the default language lives at the root", LANG_META[ENABLED_LANGS[0]].prefix === "");

// [preferred languages, the languages a page is in, the one to offer]
const zhOn = ["en", "tr", "zh"];
const prefs: [string[], string[], string | undefined][] = [
  [["tr-TR", "en-US"], ["en", "tr"], "tr"],
  [["de-DE", "tr"], ["en", "tr"], "tr"],
  [["de-DE", "fr"], ["en", "tr"], undefined],
  [["EN_gb"], ["en", "tr"], "en"],
  [[], ["en", "tr"], undefined],
  [["zh-CN", "en"], zhOn, "zh"],
  [["zh"], zhOn, "zh"],
  [["zh-Hans-TW"], zhOn, "zh"],
  // Traditional Chinese readers are never offered the Simplified version.
  [["zh-TW", "en"], zhOn, "en"],
  [["zh-HK", "tr"], zhOn, "tr"],
  [["zh-MO"], zhOn, undefined],
  [["zh-Hant", "en"], zhOn, "en"],
  [["zh-Hant-CN", "en"], zhOn, "en"],
  [["zh_TW", "en"], zhOn, "en"],
];
const browserMatch = new Function(`return ${MATCH_LANG_JS}`)() as (E: string[], n: string[]) => string | null;
for (const [tags, langs, want] of prefs) {
  const got = matchLang(tags, langs);
  check(`${JSON.stringify(tags)} on a page in ${langs.join("/")} → ${want ?? "nothing"}`, got === want, String(got));
  const js = browserMatch(langs, tags) ?? undefined;
  check("…and the static pages' browser code agrees", js === want, String(js));
}
check("the app matches against the enabled languages", matchLang(["tr"]) === (ENABLED_LANGS.includes("tr" as Lang) ? "tr" : undefined));

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);

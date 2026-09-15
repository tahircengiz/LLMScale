// Which language a URL is in, and where its other version lives.
// Run: node scripts/test-langpath.ts
//
// Every language link on the site — the header toggle, the footer, the suggestion
// banner, LLM 101's button — goes through pathFor(), and the app picks its
// language with langOfPath(). A wrong answer here sends people to a 404 or shows
// a page in the wrong language at an address search engines index as the other.
import { langOfPath, pathFor } from "../src/lib/langPath.ts";

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

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);

// Guards against silent drift between a source-of-truth list and the places
// that enumerate it by hand. The vLLM GPU picker once listed four hardware
// tiers while the database had five, so a whole tier was unreachable and
// nothing failed. Run: node scripts/test-invariants.ts
import { readFileSync, readdirSync } from "node:fs";
import { DICTS } from "../src/lib/dict.ts";
import { TR_META } from "../src/lib/pageMeta.ts";
import { CONCEPT_FILES, FEATURED_GPU_IDS } from "../src/lib/staticPages.ts";
import { TASKS } from "../src/lib/fit.ts";
import { PRIORITIES, VLLM_TASKS } from "../src/lib/vllm.ts";
import { CATEGORY_LABELS, GPUS, GPU_CATEGORIES, MIG_PROFILES, usableGiB } from "../src/lib/gpus.ts";
import { DTYPE_BYTES, DTYPE_LABELS, calculate } from "../src/lib/calc.ts";
import { DEFAULT_STATE, encodeState, isBlankStart } from "../src/lib/urlState.ts";
import { HERO_MODEL_ID, KNOWN_MODELS, findKnownByHfId } from "../src/lib/models.ts";
import {
  DARK_QUERY,
  DEFAULT_THEME,
  DEFAULT_THEME_DARK,
  SWITCHING_CLASS,
  THEMES,
} from "../src/lib/theme.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const css = read("src/index.css");

// ── 1. the two dictionaries stay in step ──────────────────────────────────
const en = Object.keys(DICTS.en);
const tr = Object.keys(DICTS.tr);
const onlyEn = en.filter((k) => !(k in DICTS.tr));
const onlyTr = tr.filter((k) => !(k in DICTS.en));
check("EN and TR define the same keys", onlyEn.length === 0 && onlyTr.length === 0,
  onlyEn.length || onlyTr.length ? `only EN: ${onlyEn.join(", ")} | only TR: ${onlyTr.join(", ")}` : `${en.length} keys`);

// ── 2. every enumerated set is fully translated, with no stale leftovers ───
const sets: { label: string; members: readonly string[]; prefix: string }[] = [
  { label: "TASKS", members: TASKS, prefix: "fit.task." },
  { label: "VLLM_TASKS", members: VLLM_TASKS, prefix: "vllm.task." },
  { label: "PRIORITIES", members: PRIORITIES, prefix: "vllm.prio." },
  { label: "GPU_CATEGORIES", members: GPU_CATEGORIES, prefix: "cat." },
];
for (const { label, members, prefix } of sets) {
  for (const lang of ["en", "tr"] as const) {
    const dict = DICTS[lang];
    const missing = members.filter((m) => !(prefix + m in dict));
    check(`${label} fully covered by ${prefix}* (${lang})`, missing.length === 0, missing.join(", "));
  }
  const stale = Object.keys(DICTS.en)
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length))
    .filter((k) => !members.includes(k));
  check(`no stale ${prefix}* keys`, stale.length === 0, stale.join(", "));
}

// ── 3. the hardware tiers agree with each other ───────────────────────────
const labelled = Object.keys(CATEGORY_LABELS);
check("GPU_CATEGORIES lists every labelled tier",
  labelled.every((c) => (GPU_CATEGORIES as readonly string[]).includes(c)),
  labelled.filter((c) => !(GPU_CATEGORIES as readonly string[]).includes(c)).join(", "));
const emptyTiers = GPU_CATEGORIES.filter((c) => !GPUS.some((g) => g.category === c));
check("every tier has at least one device", emptyTiers.length === 0, emptyTiers.join(", "));

// ── 4. the GPU database is self-consistent ────────────────────────────────
const ids = GPUS.map((g) => g.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
check("GPU ids are unique", dupes.length === 0, dupes.join(", "));
const orphanMig = Object.keys(MIG_PROFILES).filter((id) => !ids.includes(id));
check("every MIG profile maps to a real GPU", orphanMig.length === 0, orphanMig.join(", "));
const badUnified = GPUS.filter((g) => g.totalGiB !== undefined && g.totalGiB < g.vramGiB);
check("unified devices expose at most their total memory", badUnified.length === 0,
  badUnified.map((g) => g.id).join(", "));
// The app deliberately opens on nothing. This is the property that keeps the
// analytics honest: a model or device the app picks itself is emitted by every
// visitor and every crawler that runs JavaScript, and is then indistinguishable
// from a deliberate choice. Re-introducing a default here would silently put
// that contamination back, so it is pinned rather than left to review.
check("the app opens on no device", DEFAULT_STATE.gpuId === "", DEFAULT_STATE.gpuId);
check("the app opens on no model", DEFAULT_STATE.hfId === "" && DEFAULT_STATE.arch === null);
check("a bare start is recognised as blank", isBlankStart({ ...DEFAULT_STATE }));
// A shared link is the one way state arrives, and it must still be recognised
// as *not* blank — otherwise every visitor from a link counts as an empty entry.
check(
  "a shared link is not a blank start",
  !isBlankStart({ ...DEFAULT_STATE, hfId: HERO_MODEL_ID }),
);

// Nothing may re-seed the empty entry behind the state layer's back.
const sizing = read("src/pages/SizingPage.tsx");
check("SizingPage does not seed a model on a bare visit", !/base\.hfId\s*=/.test(sizing));
// An empty `g=` would still read as a value in the event log.
check("an unset device is left out of the URL entirely", !encodeState({ ...DEFAULT_STATE }).includes("g="));

// The hero is no longer a default, but it is still a real model: the report
// carries it as a *past* default so periods spanning the change stay readable.
const hero = findKnownByHfId(HERO_MODEL_ID);
check("the retired hero is still a known model", !!hero, HERO_MODEL_ID);

// Choosing a device has to emit an event of its own. The report used to infer
// device choice from the last URL, which cannot tell inertia from intent.
const page = read("src/pages/SizingPage.tsx");
check("picking a device fires device-select", page.includes('track("device-select"'));
check("the first interaction is recorded", page.includes('track("activated"'));
check("every arrival is counted, blank or not", page.includes('track("landed"'));

// The analytics tag is copied into every entry by hand, and an ungated one
// reports from wherever the file happens to load. A file:// open of a page put a
// local disk path into the live stats, and `surfaceOf` mapped it to a real
// surface, so it was indistinguishable from a visit. Every localhost preview
// landed in production traffic the same way.
const TRACKER_HOST = "tahircengiz.github.io";
const entries = readdirSync(".").filter((f) => f.endsWith(".html"));
const tracked = entries.filter((f) => read(f).includes("stats.delix.dev"));
const ungated = tracked.filter((f) => !read(f).includes(`data-domains="${TRACKER_HOST}"`));
check("every page carrying the tracker gates it to the live host", ungated.length === 0, ungated.join(", "));
check("and the tracker is on every entry", tracked.length === entries.length,
  `${tracked.length} of ${entries.length}`);
// The canonical URL is where that host name comes from; if the site moves to a
// custom domain and this is not moved with it, the stats go silent.
check("the gated host matches the canonical URL", read("index.html").includes(`https://${TRACKER_HOST}/`));

// The glass theme styles the selected card through aria-pressed, which only
// works while GpuFit actually sets it.
const fit = read("src/components/GpuFit.tsx");
check("GpuFit marks the selected card with aria-pressed", fit.includes("aria-pressed={g.id === gpuId}"));
check("the glass rule hangs off that same attribute", css.includes('.gpu-card[aria-pressed="true"]'));
check("the card carries the gpu-card hook", fit.includes('"gpu-card rounded-xl'));

// A selected device the model has outgrown stays in the visible grid instead of
// sliding into the collapsed group, where the fit summary would go on describing
// a card nobody can see. The split lives in lib/deviceGrid.ts so it can be tested
// without React (scripts/test-devicegrid.ts); these pin the component to it.
check("GpuFit splits the grid with splitDevices", fit.includes("splitDevices("));
check("the toggle counts only what is still hidden", fit.includes("n: grid.hidden.length"));
check("the over-budget card is marked", fit.includes('data-over-budget={overBudget ? "true" : undefined}'));
// Without this the glass theme would repaint that card in brand colours from
// aria-pressed alone and dress an over-budget device as a healthy one.
check("the glass theme overrides the selection highlight for it", css.includes('.gpu-card[data-over-budget="true"]'));

// ── 5. every precision the engine knows has a label ───────────────────────
const unlabelled = Object.keys(DTYPE_BYTES).filter((d) => !(d in DTYPE_LABELS));
check("every dtype has a label", unlabelled.length === 0, unlabelled.join(", "));

// ── 6. every page is actually built ───────────────────────────────────────
const pages = readdirSync(new URL(".", root)).filter((f) => f.endsWith(".html"));
const viteConfig = read("vite.config.ts");
const inputs = [...viteConfig.matchAll(/new URL\("\.\/([^"]+\.html)"/g)].map((m) => m[1]);
const unbuilt = pages.filter((p) => !inputs.includes(p));
const missingFile = inputs.filter((i) => !pages.includes(i));
check("every .html is a Vite entry", unbuilt.length === 0, unbuilt.join(", "));
check("every Vite entry has a file", missingFile.length === 0, missingFile.join(", "));

console.log("\n--- the bundled model database ---");
// Entries are read from config.json when added, but nothing stops a later
// hand-edit from breaking one, and a wrong preset is worse than no preset.
const dupIds = KNOWN_MODELS.length - new Set(KNOWN_MODELS.map((m) => m.id)).size;
const dupHf = KNOWN_MODELS.length - new Set(KNOWN_MODELS.map((m) => m.hfId.toLowerCase())).size;
check("preset ids are unique", dupIds === 0, `${KNOWN_MODELS.length} models`);
check("preset Hugging Face ids are unique", dupHf === 0);
const malformed = KNOWN_MODELS.filter(
  (m) => !(m.numParams > 0 && m.numLayers > 0 && m.hiddenSize > 0 &&
           m.numAttentionHeads > 0 && m.numKeyValueHeads > 0 &&
           m.numKeyValueHeads <= m.numAttentionHeads)
);
check("every preset has a usable architecture", malformed.length === 0, malformed.map((m) => m.id).join(", "));
// Decode speed reads only the active experts, so a MoE entry without
// activeParams silently reports the dense figure - an 8x error on a 30B-A3B.
const moeNoActive = KNOWN_MODELS.filter((m) => m.isMoE && !m.activeParams);
check("every MoE preset declares its active params", moeNoActive.length === 0, moeNoActive.map((m) => m.id).join(", "));
const overActive = KNOWN_MODELS.filter((m) => m.activeParams && m.activeParams > m.numParams);
check("active params never exceed total", overActive.length === 0);

// A published claim to hold an entry to: openai/gpt-oss-120b's card says it is
// "designed to fit into a single 80GB GPU". It ships natively in 4-bit.
const oss120 = KNOWN_MODELS.find((m) => m.id === "gpt-oss-120b");
if (oss120) {
  const h100 = GPUS.find((g) => g.id === "h100-80")!;
  const need = calculate({
    arch: oss120, weightDtype: "int4", kvDtype: "fp16", contextLength: 8192,
    concurrency: 1, overheadPct: 0.1, cudaContextGiB: 0.75,
  }).totalGiB;
  check("gpt-oss 120B fits one 80GB card at 4-bit, as its card claims",
    need <= usableGiB(h100, ""), `${need.toFixed(1)} of ${usableGiB(h100, "").toFixed(1)} GiB`);
}

console.log("\n--- the theme bootstrap is identical in every entry ---");
// This script cannot be imported from a module: it has to set the theme class
// before first paint, so every entry carries its own copy. Copies drift — that
// is the bug this whole file exists to catch — so pin them to each other.
const themed = pages.filter((p) => read(p).includes('localStorage.getItem("theme")'));
const bootstraps = new Map<string, string[]>();
for (const p of themed) {
  const body = read(p).match(/var m = localStorage[\s\S]*?classList\.add\([^;]+;/)?.[0] ?? "";
  bootstraps.set(body, [...(bootstraps.get(body) ?? []), p]);
}
check("every themed entry bootstraps the same way", bootstraps.size === 1, `${bootstraps.size} variant(s) across ${themed.length} pages`);
const bootstrap = [...bootstraps.keys()][0] ?? "";
// A first-time visitor has nothing stored, so the fallback branch is the default.
check("the bootstrap default matches DEFAULT_THEME", bootstrap.includes(`: "${DEFAULT_THEME}"`), DEFAULT_THEME);
check("dark is the only theme with no class", !bootstrap.includes('add("dark")'));
check("every theme is reachable from storage", THEMES.every((t) => bootstrap.includes(`"${t}"`)), THEMES.join(", "));
// The bootstrap cannot import preferredTheme() — it runs before any module — so
// it reimplements it, and these pin the reimplementation to the real thing.
check("the bootstrap asks the OS with the same query", bootstrap.includes(DARK_QUERY), DARK_QUERY);
check("an OS asking for dark wins over the default", bootstrap.includes(`? "${DEFAULT_THEME_DARK}"`), DEFAULT_THEME_DARK);
check("the two defaults differ, or following the OS is pointless", DEFAULT_THEME !== DEFAULT_THEME_DARK);

console.log("\n--- the prerendered page is hidden from visitors it would mislead ---");
// Every React entry ships the English, blank-state page in #root (scripts/prerender.ts)
// and main.tsx replaces it. The class that hides it in the meantime is named in four
// places that cannot import each other: each entry's bootstrap, index.css, Root.tsx
// and the build. If any one drifts, a Turkish visitor watches English swap out, or
// the page never becomes visible at all.
const staleClass = read("src/Root.tsx").match(/PRERENDER_STALE_CLASS = "([^"]+)"/)?.[1] ?? "";
check("Root names the class", staleClass.length > 0, staleClass);
const reactEntries = pages.filter((p) => read(p).includes('<div id="root"></div>'));
const staleBoots = new Map<string, string[]>();
for (const p of reactEntries) {
  const body = read(p).match(/if \(location\.search\) document\.documentElement\.classList\.add\("[^"]+"\);/)?.[0] ?? "";
  staleBoots.set(body, [...(staleBoots.get(body) ?? []), p]);
}
const staleBoot = [...staleBoots.keys()][0] ?? "";
check("every React entry carries the same bootstrap", staleBoots.size === 1 && staleBoot !== "",
  `${staleBoots.size} variant(s) across ${reactEntries.length} pages`);
check("the bootstrap sets the class Root lifts", staleBoot.includes(`classList.add("${staleClass}")`));
check("index.css hides #root under that class", css.includes(`.${staleClass} #root`));
// The prerender is in the URL's language, so language is no reason to hide it. A
// bootstrap that still guessed one would hide pages from Turkish browsers for nothing.
check("no entry decides language before React does", reactEntries.every((p) => !read(p).includes("navigator.language")));
check("the build runs the prerender", /vite build --ssr src\/entry-server\.tsx[^"]*node scripts\/prerender\.ts/.test(read("package.json")));
// LLM 101 keeps no state in its URL and takes its language from the path, so what
// the build wrote into it is always what the visitor sees.
check("LLM 101 takes its language from the URL", read("src/learn.js").includes("langOfPath(location.pathname)"));

console.log("\n--- every tool explains itself ---");
// About.tsx counts numbered keys (p1, p2…, f1…, q1…) on the English dictionary,
// so a page with no title or no text would render an empty card, and a question
// without its answer would render a blank <dd>. The en/tr key diff above already
// guarantees Turkish has whatever English has.
const aboutPages = [...(read("src/components/About.tsx").match(/export type AboutPage = ([^;]+);/)?.[1] ?? "")
  .matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
check("About names the pages", aboutPages.length === 7, aboutPages.join(", "));
const aboutGaps = aboutPages.filter((pg) => {
  const has = (k: string) => k in DICTS.en;
  let q = 0;
  while (has(`about.${pg}.q${q + 1}`)) q++;
  const answered = Array.from({ length: q }, (_, i) => has(`about.${pg}.a${i + 1}`)).every(Boolean);
  return !(has(`about.${pg}.title`) && has(`about.${pg}.p1`) && q >= 3 && answered);
});
check("each has a title, text and at least three answered questions", aboutGaps.length === 0, aboutGaps.join(", "));
// The sizing page claimed MLA was not modelled for two weeks after calc.ts began
// modelling it. Copy is where the engine's changes are easiest to leave behind.
const allCopy = Object.values(DICTS.en).join(" ") + Object.values(DICTS.tr).join(" ");
check("no copy still says MLA is not modelled", !/MLA[^.]*(not yet capture|henüz modellenmemiş)/.test(allCopy));

console.log("\n--- both languages have pages of their own ---");
// scripts/prerender.ts builds tr/<entry> from each entry and the head in
// src/lib/pageMeta.ts. An entry with no Turkish head fails the build; catch it here
// first, along with a head for a page that no longer exists.
const untranslated = pages.filter((p) => !(p in TR_META));
check("every entry has a Turkish head", untranslated.length === 0, untranslated.join(", "));
const orphaned = Object.keys(TR_META).filter((f) => !pages.includes(f));
check("and no Turkish head outlives its page", orphaned.length === 0, orphaned.join(", "));
// Search results cut titles around 60 characters; the cut falls on the brand if it
// falls anywhere, but past that it eats the words people searched for.
const longTitles = [
  ...pages.map((p) => [p, read(p).match(/<title>([^<]*)<\/title>/)?.[1] ?? ""]),
  ...Object.entries(TR_META).map(([f, m]) => [`tr/${f}`, m.title]),
].filter(([, title]) => [...title].length > 60);
check("every title fits in 60 characters", longTitles.length === 0, longTitles.map(([f, t]) => `${f} (${[...t].length})`).join(", "));
// Links inside a page stay in its language; a /tr/ page linking to English pages
// would hand search engines the wrong version from the Turkish one.
check("the header links stay in the page's language", read("src/App.tsx").includes("href={`${home}${item.href}`}"));
check("so does the calculator's link to the vLLM helper", read("src/components/GpuFit.tsx").includes('${lang === "tr" ? "tr/" : ""}vllm.html'));

console.log("\n--- the generated model and GPU guides ---");
// scripts/genPages.ts builds a page per preset and per featured GPU, and the app
// links to them by the same ids. A featured id that is not a device would throw in
// the build; one that was renamed would leave the app linking to a 404.
const unknownFeatured = FEATURED_GPU_IDS.filter((id) => !GPUS.some((g) => g.id === id));
check("every featured GPU is a real device", unknownFeatured.length === 0, unknownFeatured.join(", "));
check("the build writes the guides and then the sitemap", /node scripts\/prerender\.ts[^"]*node scripts\/genPages\.ts[^"]*node scripts\/sitemap\.ts/.test(read("package.json")));
check("the footer links to both hubs", read("src/App.tsx").includes("{MODELS_HUB}") && read("src/App.tsx").includes("{GPUS_HUB}"));
check("a preset links to its page from the calculator", read("src/pages/SizingPage.tsx").includes("modelPageFile(known.id)"));
// The explainers under each tool link to the concept guides by name. A name with
// no file, or a file genPages no longer builds, is a link to nothing.
check("the footer links to the concept guides", read("src/App.tsx").includes("{CONCEPTS_HUB}"));
const conceptNames = Object.keys(CONCEPT_FILES);
const linkedConcepts = [...read("src/components/About.tsx").matchAll(/"(kvCache|attention|quantization|[a-zA-Z]+)"(?=[,\]])/g)].map((m) => m[1]).filter((n) => !["sizing","train","fit","anatomy","compare","decode","vllm"].includes(n));
check("the explainers name only concept guides that exist", linkedConcepts.length > 0 && linkedConcepts.every((n) => conceptNames.includes(n)), [...new Set(linkedConcepts)].join(", "));
check("every concept guide has its link text in both languages", conceptNames.every((n) => `concept.${n}` in DICTS.en && `concept.${n}` in DICTS.tr));

// The class that suppresses transitions is named in theme.ts, set in App.tsx and
// acted on in index.css. Nothing links those three at build time, and a rename in
// one of them fails silently — the switch would just go back to landing in two
// stages with no error anywhere.
const app = read("src/App.tsx");
check("index.css acts on the switching class", css.includes(`.${SWITCHING_CLASS}`), SWITCHING_CLASS);
check("the rule actually suppresses transitions", css.includes("transition: none !important"));
check("App.tsx sets it by the shared constant, not a literal", app.includes("SWITCHING_CLASS") && !app.includes(`"${SWITCHING_CLASS}"`));

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);

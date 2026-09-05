// Guards against silent drift between a source-of-truth list and the places
// that enumerate it by hand. The vLLM GPU picker once listed four hardware
// tiers while the database had five, so a whole tier was unreachable and
// nothing failed. Run: node scripts/test-invariants.ts
import { readFileSync, readdirSync } from "node:fs";
import { DICTS } from "../src/lib/dict.ts";
import { TASKS } from "../src/lib/fit.ts";
import { PRIORITIES, VLLM_TASKS } from "../src/lib/vllm.ts";
import { CATEGORY_LABELS, GPUS, GPU_CATEGORIES, MIG_PROFILES, usableGiB } from "../src/lib/gpus.ts";
import { DTYPE_BYTES, DTYPE_LABELS, calculate } from "../src/lib/calc.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import { HERO_MODEL_ID, findKnownByHfId } from "../src/lib/models.ts";
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
check("the default GPU exists", ids.includes(DEFAULT_STATE.gpuId), DEFAULT_STATE.gpuId);
// The picker's active tab is derived from the selected device's category, so the
// default device is also what decides which tab a first-time visitor lands on.
// Swapping it for a consumer card would silently move that tab back.
const defaultGpu = GPUS.find((g) => g.id === DEFAULT_STATE.gpuId);
check("the default GPU opens the Data center tab", defaultGpu?.category === "datacenter", defaultGpu?.category);

// The two defaults are coupled. The selected card no longer vanishes when the
// model outgrows it — deviceGrid.ts pins it to the visible grid — but a hero the
// default device cannot hold would still greet a first-time visitor with a red
// bar and a "needs 2× GPUs" verdict on a page meant to show a working setup.
const hero = findKnownByHfId(HERO_MODEL_ID);
check("the hero model is a known model", !!hero, HERO_MODEL_ID);
if (hero && defaultGpu) {
  const need = calculate({
    arch: hero,
    weightDtype: DEFAULT_STATE.weightDtype,
    kvDtype: DEFAULT_STATE.kvDtype,
    contextLength: DEFAULT_STATE.contextLength,
    concurrency: DEFAULT_STATE.concurrency,
    overheadPct: DEFAULT_STATE.overheadPct,
    cudaContextGiB: DEFAULT_STATE.cudaContextGiB,
  }).totalGiB;
  const cap = usableGiB(defaultGpu, "");
  check(
    "the hero model fits the default GPU, so the page opens on a working setup",
    need <= cap,
    `${need.toFixed(1)} of ${cap.toFixed(1)} GiB (${Math.round((need / cap) * 100)}%)`
  );
  // A hero that barely registers makes the default device look pointless.
  check("the hero actually exercises the default GPU", need / cap > 0.25, `${Math.round((need / cap) * 100)}%`);
}
check("the hero is bigger than a single-card 8B", (hero?.numParams ?? 0) > 20e9, `${((hero?.numParams ?? 0) / 1e9).toFixed(0)}B`);

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

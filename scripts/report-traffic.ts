// Renders the traffic report to a self-contained HTML file.
//
//   node scripts/report-traffic.ts rows.json [out.html]
//   node scripts/report-traffic.ts --demo            (synthetic rows, to see the shape)
//
// `rows.json` is the export described in docs/traffic-report.md — one array of
// website_event rows joined to session. Everything is inlined; the file opens
// offline and sends nothing anywhere.
import { readFileSync, writeFileSync } from "node:fs";
import { buildReport, surfaceOf, SIZING_SURFACE, type Report, type Row, type Tally } from "./traffic.ts";
import { renderEmailHtml } from "./emailReport.ts";
import { HERO_MODEL_ID } from "../src/lib/models.ts";

// Purely historical, newest first. The app opens on nothing now, so it has no
// current default to list — but a report spanning the change still has to
// recognise what it *used* to put in front of people, or every visitor from
// before it looks like a shared-link arrival and their inertia is counted as a
// choice. Nothing is ever removed from this list.
// Every configuration the app has ever opened on, newest first, each tagged
// with the page that opened on it. Nothing is ever removed.
//
// The surface tag is what keeps the filter honest. A seed can only contaminate
// the page that writes it: `h100-80` is the vLLM helper's own default, but on
// the sizing page it is an ordinary card a visitor picked, and matching it
// globally deleted one of the most plausible real answers from the report.
const DEFAULTS = [
  // Retired: the sizing page opened on these until it went blank on 2026-09-07.
  { model: HERO_MODEL_ID, device: "h200-141", surface: SIZING_SURFACE },
  { model: "meta-llama/Llama-3.1-8B-Instruct", device: "rtx4090-24", surface: SIZING_SURFACE }, // until 2026-09-05
  // Still live: these two pages produce nothing without a model and a device,
  // so they still seed one. Their rows are not blank arrivals, and the values
  // they open on are not choices — on those pages.
  { model: HERO_MODEL_ID, device: "h100-80", surface: "vLLM Params" },
  { model: HERO_MODEL_ID, device: "rtx4090-24", surface: "Fine-tune" },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
const day = (iso: string) => (iso ? iso.slice(0, 10) : "—");

/** A ranked list as bars, widths relative to the top row rather than to total. */
function bars(rows: Tally[], total: number, empty: string): string {
  if (!rows.length) return `<p class="empty">${esc(empty)}</p>`;
  const top = rows[0].sessions || 1;
  return `<ol class="bars">${rows
    .map(
      (r) => `<li><span class="k">${esc(r.label)}</span>
      <span class="track"><span class="fill" style="width:${Math.max(3, (r.sessions / top) * 100)}%"></span></span>
      <span class="v">${r.sessions}<small>${total ? ` · ${pct(r.sessions, total)}%` : ""}</small></span></li>`
    )
    .join("")}</ol>`;
}

function render(r: Report, note: string): string {
  const s = r.sessions;
  return `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LLMScale — traffic report</title>
<style>
  :root{--void:#090b10;--card:#14171f;--inset:#1b1f2a;--well:#232834;--line:#333a49;
    --indigo:#5d5fef;--green:#00e096;--fg:#e7e9ef;--mut:#a1a8b8;--dim:#868ea0}
  *{box-sizing:border-box}
  body{margin:0;padding:2rem 1.25rem 4rem;background:
    radial-gradient(1100px 620px at 18% -14%,rgba(93,95,239,.1),transparent 62%),var(--void);
    color:var(--fg);font:400 14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased}
  main{max-width:1100px;margin:0 auto}
  h1{font-size:1.875rem;font-weight:700;line-height:1;margin:0 0 .25rem}
  .sub{color:var(--mut);margin:0 0 1.5rem}
  .note{background:rgba(93,95,239,.1);border:1px solid rgba(93,95,239,.35);
    border-radius:.75rem;padding:.625rem .875rem;color:var(--mut);margin:0 0 1.5rem;font-size:0.875rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}
  .card{background:rgba(20,23,31,.7);border:1px solid rgba(255,255,255,.1);border-radius:1rem;
    padding:1rem;box-shadow:0 20px 25px -5px rgb(0 0 0/.3)}
  h2{font-size:1rem;font-weight:600;letter-spacing:-.015em;margin:0 0 .875rem}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin-bottom:1rem}
  .tile{background:rgba(27,31,42,.6);border-radius:.75rem;padding:.75rem;
    box-shadow:inset 0 0 0 1px rgb(255 255 255/.05)}
  .tile .lab{font-size:.6875rem;text-transform:uppercase;letter-spacing:.025em;color:var(--mut)}
  .tile .num{font-size:1.125rem;font-weight:600;margin-top:.125rem}
  .tile .num.ok{color:var(--green)}
  .tile .sub2{font-size:.6875rem;color:var(--dim)}
  ol.bars{list-style:none;margin:0;padding:0;display:grid;gap:.4rem}
  ol.bars li{display:grid;grid-template-columns:minmax(90px,10rem) 1fr auto;align-items:center;gap:.625rem}
  .k{font-size:0.875rem;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .track{height:.5rem;border-radius:9999px;background:var(--well);overflow:hidden}
  .fill{display:block;height:100%;border-radius:9999px;background:var(--indigo)}
  .v{font-size:.75rem;color:var(--mut);font-variant-numeric:tabular-nums}
  .v small{color:var(--dim)}
  .empty{color:var(--dim);font-size:0.875rem;margin:0}
  footer{color:var(--dim);font-size:.75rem;margin-top:2rem;text-align:center}
</style>
<main>
  <h1>Traffic report</h1>
  <p class="sub">LLMScale · ${day(r.from)} → ${day(r.to)}</p>
  ${note ? `<p class="note">${esc(note)}</p>` : ""}

  <div class="tiles">
    <div class="tile"><div class="lab">Sessions</div><div class="num">${s}</div>
      <div class="sub2">${r.events} events recorded</div></div>
    <div class="tile"><div class="lab">Engaged</div><div class="num ok">${r.engaged}</div>
      <div class="sub2">${pct(r.engaged, s)}% changed a setting</div></div>
    <div class="tile"><div class="lab">Landed empty</div><div class="num">${r.blankStart}</div>
      <div class="sub2">of ${r.sizingSessions} who opened the calculator</div></div>
    <div class="tile"><div class="lab">Then picked something</div><div class="num ok">${r.blankActivated}</div>
      <div class="sub2">${pct(r.blankActivated, r.blankStart)}% of those activated</div></div>
    <div class="tile"><div class="lab">Picked a model</div><div class="num">${r.changedModel}</div>
      <div class="sub2">${pct(r.changedModel, s)}% chose one themselves</div></div>
    <div class="tile"><div class="lab">From a shared link</div><div class="num">${r.fromSharedLink}</div>
      <div class="sub2">arrived on someone's config</div></div>
    <div class="tile"><div class="lab">Countries</div><div class="num">${r.countries.length}</div>
      <div class="sub2">top: ${esc(r.countries[0]?.label ?? "—")}</div></div>
  </div>

  <div class="grid">
    <section class="card"><h2>Models people chose</h2>
      ${bars(r.modelsChosen, s, "Nobody changed the model in this period.")}</section>
    <section class="card"><h2>Hardware people asked about</h2>
      ${bars(r.devicesChosen, s, "Nobody changed the device in this period.")}</section>
    <section class="card"><h2>Where they came from</h2>
      ${bars(r.countries, s, "No country data.")}</section>
    <section class="card"><h2>Which tools they used</h2>
      ${bars(r.surfaces, s, "No pageviews.")}</section>
    <section class="card"><h2>Context window</h2>
      ${bars(r.contextBuckets, s, "No context data.")}</section>
    <section class="card"><h2>Concurrent users</h2>
      ${bars(r.concurrencyBuckets, s, "No concurrency data.")}</section>
    <section class="card"><h2>Weight precision</h2>
      ${bars(r.precision, s, "No precision data.")}</section>
    <section class="card"><h2>Models seen (incl. defaults)</h2>
      ${bars(r.modelsSeen, s, "No model data.")}</section>
    <section class="card"><h2>Referrers</h2>
      ${bars(r.referrers, s, "All visits were direct.")}</section>
  </div>

  <footer>Counted per session, not per event — one visitor tuning settings emits many rows.<br>
  <strong>The calculator</strong> opens on no model and no device, so a session that opens it carrying neither saw the blank
  page, and whatever it settles on there was chosen by a person. Those are credited in full, and "Landed empty" is counted
  against calculator visits rather than all traffic — a crawler that runs JavaScript now contributes a blank arrival instead
  of a model and a device nobody selected.<br>
  The vLLM and fine-tune pages still open on a seeded model and device, because they produce nothing without one; so did the
  calculator before 2026-09-07. On those pages, and in that earlier window, no value the app opened on is credited as a choice
  — inertia and a deliberate pick of it are indistinguishable. ${r.endedOnDefault} session(s) here settled on such a value and
  are excluded from the lists above. The same card chosen on the calculator still counts.</footer>
</main>`;
}

/**
 * The weekly digest, as markdown — the homelab mailer renders markdown itself,
 * so this must not be HTML. Shorter than the full page on purpose: a digest is
 * read on a phone, and the numbers that survive that are the ones that matter.
 */
export function renderMarkdown(r: Report): string {
  const s = r.sessions;
  const list = (rows: Tally[], empty: string, limit = 5) =>
    rows.length
      ? rows.slice(0, limit).map((x) => `- **${x.label}** — ${x.sessions}`).join("\n")
      : `_${empty}_`;
  const inline = (rows: Tally[], limit = 6) =>
    rows.slice(0, limit).map((x) => `${x.label} (${x.sessions})`).join(" · ") || "—";

  return `**${s} sessions** over ${day(r.from)} → ${day(r.to)}, from ${r.countries.length} countries.

| | |
|---|---|
| Opened the calculator | ${r.sizingSessions} |
| ...landing on the blank page | ${r.blankStart} (${pct(r.blankStart, r.sizingSessions)}%) |
| ...and then picking something | **${r.blankActivated}** (${pct(r.blankActivated, r.blankStart)}%) |
| Chose a model | **${r.changedModel}** (${pct(r.changedModel, s)}%) |
| Chose a device | **${r.changedDevice}** (${pct(r.changedDevice, s)}%) |
| Arrived on a shared link | ${r.fromSharedLink} |
| Took a default we showed them | ${r.endedOnDefault} (${pct(r.endedOnDefault, s)}%) |

### Models people chose

${list(r.modelsChosen, "Nobody picked a model this week.")}

### Hardware people chose

${list(r.devicesChosen, "Nobody picked a device this week.")}

### Where they came from

${inline(r.countries, 8)}

### Which tools they used

${inline(r.surfaces, 8)}

### How they configured it

Context: ${inline(r.contextBuckets, 4)}
Concurrency: ${inline(r.concurrencyBuckets, 4)}
Precision: ${inline(r.precision, 4)}

---

The calculator opens on no model and no device, so anything a blank-start
session settles on there was chosen by a person and is counted in full. The vLLM
and fine-tune pages still seed a model and a device — as the calculator did
before 2026-09-07 — and on those pages nothing the app opened on is credited,
because inertia and a deliberate pick cannot be told apart. The same card chosen
on the calculator still counts. Crawlers land in the blank-start denominator, so
read the activation percentage as a trend rather than an absolute.`;
}

/** Synthetic rows, so the layout can be judged before the real export exists. */
function demoRows(): Row[] {
  const models = [
    ["meta-llama/Llama-3.3-70B-Instruct", "b200-192", "DE"],
    ["Qwen/Qwen2.5-72B-Instruct", "h100-80", "US"],
    ["mistralai/Mixtral-8x7B-Instruct-v0.1", "a100-80", "TR"],
    ["meta-llama/Llama-3.1-8B-Instruct", "rtx4090-24", "IN"],
    ["google/gemma-2-27b-it", "m3-ultra-512", "TR"],
  ];
  const rows: Row[] = [];
  let t = 0;
  // Must be monotonic: the report sorts a session's events by timestamp to find
  // its first and last state. The old hour-cycling formula wrapped from 19 back
  // to 08 mid-session, which reordered the rows and made the synthetic numbers
  // describe something the generator never wrote.
  const stamp = () => new Date(Date.UTC(2026, 8, 1, 8, 0, 0) + t++ * 20 * 60000).toISOString();
  const q = (m: string, g: string, ctx: number, n: number, wd = "bf16") =>
    `m=${encodeURIComponent(m)}&wd=${wd}&kd=fp16&ctx=${ctx}&n=${n}&g=${g}`;
  for (let i = 0; i < 46; i++) {
    const id = `s${i}`;
    const [m, g, c] = models[i % models.length];
    const path = i % 7 === 0 ? "/LLMScale/train.html" : i % 5 === 0 ? "/LLMScale/vllm.html" : "/LLMScale/";
    const base: Partial<Row> = { country: c, url_path: path, referrer_domain: i % 4 === 0 ? "news.ycombinator.com" : null };
    // The first pageview always fires before the app has written anything.
    rows.push({ session_id: id, created_at: stamp(), url_query: "", url_path: path, ...base } as Row);
    // What lands next depends on the page. The sizing page writes the workload
    // settings with no model and no device, because it has no default left to
    // write; the other two still seed one, and must not look like blank
    // arrivals in the synthetic report either.
    // Only the still-live seeds: the sizing entries in DEFAULTS are retired, and
    // treating one as current would make the synthetic report show no blank
    // arrivals at all.
    const surface = surfaceOf(path);
    const seed = surface === SIZING_SURFACE ? undefined : DEFAULTS.find((d) => d.surface === surface);
    rows.push({
      session_id: id,
      created_at: stamp(),
      url_query: seed ? q(seed.model, seed.device, 8192, 1) : "wd=bf16&kd=fp16&ctx=8192&n=1&ov=0.1",
      url_path: path,
      ...base,
    } as Row);
    if (i % 3 === 0) continue; // a third of visitors never pick anything
    const steps = 1 + (i % 5);
    for (let k = 0; k < steps; k++) {
      rows.push({
        session_id: id,
        created_at: stamp(),
        url_query: q(m, g, [8192, 32768, 131072, 1048576][k % 4], [1, 8, 64, 256][k % 4], ["bf16", "fp8", "int4"][k % 3]),
        url_path: path,
        ...base,
      } as Row);
    }
  }
  return rows;
}

const args = process.argv.slice(2);
const demo = args.includes("--demo");
const asMarkdown = args.includes("--markdown");
const asEmail = args.includes("--email");
const inPath = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));
const outPath = args.find((a) => a.endsWith(".html")) ?? "traffic-report.html";

if (!demo && !inPath) {
  console.error("usage: node scripts/report-traffic.ts <rows.json> [out.html]   |   --demo");
  process.exit(1);
}

const rows: Row[] = demo ? demoRows() : JSON.parse(readFileSync(inPath!, "utf8"));
const report = buildReport(rows, DEFAULTS);

// Markdown goes to stdout so the weekly job can pipe it straight at the mailer.
if (asEmail) {
  process.stdout.write(renderEmailHtml(report));
  process.exit(0);
}
if (asMarkdown) {
  process.stdout.write(renderMarkdown(report));
  process.exit(0);
}
const note = demo
  ? "Sample data — these numbers are synthetic, generated to show the report's shape. Re-run against a real export to replace them."
  : "";
writeFileSync(outPath, render(report, note), "utf8");
console.log(
  `${outPath} — ${report.sessions} sessions, ${report.events} events, ${report.countries.length} countries${demo ? "  (SYNTHETIC)" : ""}`
);

// Renders the traffic report to a self-contained HTML file.
//
//   node scripts/report-traffic.ts rows.json [out.html]
//   node scripts/report-traffic.ts --demo            (synthetic rows, to see the shape)
//
// `rows.json` is the export described in docs/traffic-report.md — one array of
// website_event rows joined to session. Everything is inlined; the file opens
// offline and sends nothing anywhere.
import { readFileSync, writeFileSync } from "node:fs";
import { buildReport, type Report, type Row, type Tally } from "./traffic.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import { HERO_MODEL_ID } from "../src/lib/models.ts";

// Newest first. A report spanning a change of default must recognise the older
// one too, or every visitor from before it looks like a shared-link arrival.
const DEFAULTS = [
  { model: HERO_MODEL_ID, device: DEFAULT_STATE.gpuId },
  { model: "meta-llama/Llama-3.1-8B-Instruct", device: "rtx4090-24" }, // until 2026-09-05
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
    <div class="tile"><div class="lab">Changed the model</div><div class="num">${r.changedModel}</div>
      <div class="sub2">${pct(r.changedModel, s)}% moved off what we showed</div></div>
    <div class="tile"><div class="lab">Took our default</div><div class="num">${r.endedOnDefault}</div>
      <div class="sub2">${pct(r.endedOnDefault, s)}% ended on a model we picked</div></div>
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
  "Chosen" excludes every model and device the app has ever opened on: most sessions end on whatever we put in front of them,
  and a deliberate pick of that value cannot be told apart from inertia.<br>
  So these lists undercount on purpose. "Changed the model" above is the honest measure of engagement.</footer>
</main>`;
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
  const stamp = () => `2026-09-${String(1 + Math.floor(t / 400)).padStart(2, "0")}T${String(8 + (t++ % 12)).padStart(2, "0")}:00:00Z`;
  const q = (m: string, g: string, ctx: number, n: number, wd = "bf16") =>
    `m=${encodeURIComponent(m)}&wd=${wd}&kd=fp16&ctx=${ctx}&n=${n}&g=${g}`;
  for (let i = 0; i < 46; i++) {
    const id = `s${i}`;
    const [m, g, c] = models[i % models.length];
    const path = i % 7 === 0 ? "/LLMScale/train.html" : i % 5 === 0 ? "/LLMScale/vllm.html" : "/LLMScale/";
    const base: Partial<Row> = { country: c, url_path: path, referrer_domain: i % 4 === 0 ? "news.ycombinator.com" : null };
    rows.push({ session_id: id, created_at: stamp(), url_query: q(DEFAULTS.model, DEFAULTS.device, 8192, 1), url_path: path, ...base } as Row);
    if (i % 3 === 0) continue; // a third of visitors touch nothing
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
const inPath = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));
const outPath = args.find((a) => a.endsWith(".html")) ?? "traffic-report.html";

if (!demo && !inPath) {
  console.error("usage: node scripts/report-traffic.ts <rows.json> [out.html]   |   --demo");
  process.exit(1);
}

const rows: Row[] = demo ? demoRows() : JSON.parse(readFileSync(inPath!, "utf8"));
const report = buildReport(rows, DEFAULTS);
const note = demo
  ? "Sample data — these numbers are synthetic, generated to show the report's shape. Re-run against a real export to replace them."
  : "";
writeFileSync(outPath, render(report, note), "utf8");
console.log(
  `${outPath} — ${report.sessions} sessions, ${report.events} events, ${report.countries.length} countries${demo ? "  (SYNTHETIC)" : ""}`
);

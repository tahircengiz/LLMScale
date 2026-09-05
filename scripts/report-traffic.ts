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
| Moved off the model we showed | **${r.changedModel}** (${pct(r.changedModel, s)}%) |
| Moved off the device we showed | **${r.changedDevice}** (${pct(r.changedDevice, s)}%) |
| Took our default | ${r.endedOnDefault} (${pct(r.endedOnDefault, s)}%) |
| Arrived on a shared link | ${r.fromSharedLink} |

### Models people went looking for

${list(r.modelsChosen, "Nobody moved off our default model this week.")}

### Hardware people went looking for

${list(r.devicesChosen, "Nobody moved off our default device this week.")}

### Where they came from

${inline(r.countries, 8)}

### Which tools they used

${inline(r.surfaces, 8)}

### How they configured it

Context: ${inline(r.contextBuckets, 4)}
Concurrency: ${inline(r.concurrencyBuckets, 4)}
Precision: ${inline(r.precision, 4)}

---

The two "went looking for" lists exclude every model and device the app has ever
opened on. Most sessions end on whatever we put in front of them, and a
deliberate pick of that cannot be told apart from inertia — so these undercount
on purpose. The percentages above are the honest engagement measure.`;
}

/**
 * The digest as HTML for e-mail. A different medium from the report page, not a
 * restyle of it: mail clients strip <style> blocks, ignore grid and flex, and
 * Gmail in particular keeps only inline attributes on tables. So this is tables
 * and inline styles all the way down, sized for the 548px the mailer's 600px
 * card leaves after padding, and light-themed to sit inside that white card
 * rather than fighting it.
 *
 * It returns the INNER content. The mailer wraps it in its own shell — subject
 * header, status badge, footer — so the homelab's mail identity stays intact.
 */
export function renderEmailHtml(r: Report): string {
  const s = r.sessions;
  const INK = "#101828", MUT = "#667085", LINE = "#eaecf0";
  const INDIGO = "#4a4cd4", GREEN = "#0b7d57", TRACK = "#eef0f4";

  const tile = (label: string, value: string | number, sub: string, colour = INK) => `
    <td width="50%" style="padding:0 6px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#f9fafb;border:1px solid ${LINE};border-radius:10px">
        <tr><td style="padding:10px 12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${MUT}">${esc(label)}</div>
          <div style="font-size:19px;font-weight:700;color:${colour};margin-top:2px">${esc(String(value))}</div>
          <div style="font-size:11px;color:${MUT}">${esc(sub)}</div>
        </td></tr>
      </table></td>`;

  const barRows = (rows: Tally[], empty: string, colour: string, limit = 6) => {
    if (!rows.length) {
      return `<tr><td style="padding:2px 0 8px;font-size:13px;color:${MUT};font-style:italic">${esc(empty)}</td></tr>`;
    }
    const top = rows[0].sessions || 1;
    return rows.slice(0, limit).map((x) => {
      const w = Math.max(4, Math.round((x.sessions / top) * 100));
      return `<tr><td style="padding:3px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="52%" style="font-size:13px;color:${INK};padding-right:8px">${esc(x.label)}</td>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="background:${TRACK};border-radius:4px"><tr>
              <td><table role="presentation" width="${w}%" cellpadding="0" cellspacing="0"><tr>
                <td style="background:${colour};border-radius:4px;font-size:0;line-height:8px;height:8px">&nbsp;</td>
              </tr></table></td>
            </tr></table>
          </td>
          <td width="34" align="right" style="font-size:12px;color:${MUT};padding-left:8px">${x.sessions}</td>
        </tr></table></td></tr>`;
    }).join("");
  };

  const section = (title: string, rows: Tally[], empty: string, colour = INDIGO) => `
    <tr><td style="padding:14px 0 2px;font-size:14px;font-weight:650;color:${INK};
                   border-top:1px solid ${LINE}">${esc(title)}</td></tr>
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${barRows(rows, empty, colour)}</table></td></tr>`;

  const inline = (rows: Tally[], limit = 5) =>
    rows.slice(0, limit).map((x) => `${esc(x.label)} <span style="color:${MUT}">${x.sessions}</span>`).join(" &nbsp;·&nbsp; ") || "—";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <tr><td style="font-size:14px;color:${INK};padding-bottom:14px">
    <strong style="font-size:16px">${s} oturum</strong> · ${day(r.from)} → ${day(r.to)} · ${r.countries.length} ülke
  </td></tr>

  <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${tile("Modeli değiştirdi", r.changedModel, `${pct(r.changedModel, s)}% bizim gösterdiğimizin ötesine geçti`, INDIGO)}
    ${tile("Cihazı değiştirdi", r.changedDevice, `${pct(r.changedDevice, s)}%`, INDIGO)}
  </tr><tr>
    ${tile("Varsayılanı aldı", r.endedOnDefault, `${pct(r.endedOnDefault, s)}% verileni kabul etti`, MUT)}
    ${tile("Paylaşılan linkten", r.fromSharedLink, "başkasının ayarıyla geldi", GREEN)}
  </tr></table></td></tr>

  ${section("Aradıkları modeller", r.modelsChosen, "Bu hafta kimse varsayılan modelin dışına çıkmadı.")}
  ${section("Aradıkları donanım", r.devicesChosen, "Bu hafta kimse varsayılan cihazın dışına çıkmadı.")}
  ${section("Hangi araçlar", r.surfaces, "Sayfa görüntülemesi yok.", GREEN)}

  <tr><td style="padding:14px 0 2px;font-size:14px;font-weight:650;color:${INK};
                 border-top:1px solid ${LINE}">Nereden geldiler</td></tr>
  <tr><td style="font-size:13px;color:${INK};padding-bottom:6px">${inline(r.countries, 8)}</td></tr>

  <tr><td style="padding:12px 0 2px;font-size:14px;font-weight:650;color:${INK};
                 border-top:1px solid ${LINE}">Nasıl yapılandırdılar</td></tr>
  <tr><td style="font-size:13px;color:${INK};line-height:1.7;padding-bottom:6px">
    <span style="color:${MUT}">Context:</span> ${inline(r.contextBuckets, 4)}<br>
    <span style="color:${MUT}">Eşzamanlılık:</span> ${inline(r.concurrencyBuckets, 4)}<br>
    <span style="color:${MUT}">Hassasiyet:</span> ${inline(r.precision, 4)}
  </td></tr>

  <tr><td style="padding:14px 0 0;border-top:1px solid ${LINE};font-size:12px;
                 color:${MUT};line-height:1.55">
    Oturum başına sayılır, olay başına değil — ayar değiştiren bir ziyaretçi onlarca kayıt bırakır.
    &#8220;Aradıkları&#8221; listeleri, uygulamanın herhangi bir zamanda açıldığı model ve cihazları
    dışlar: çoğu oturum önüne konulanla bitirir ve bunu bilerek seçmekle ataletle kabul etmek
    ayırt edilemez. Yani bu listeler <strong>bilerek eksik sayar</strong>; üstteki yüzdeler dürüst ölçüdür.
  </td></tr>
</table>`;
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

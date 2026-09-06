// Generates a static, JavaScript-free page per model.
//
//   node scripts/genModelPages.ts [modelId ...]     (default: every known model)
//
// Why these exist: the app ships about 60 characters of text before React runs,
// so a crawler that does not execute JavaScript sees nothing, and the questions
// people actually type — "how much VRAM does Llama 70B need" — are exactly the
// ones the calculator answers. These pages answer them in the HTML itself.
//
// Every number here is computed at build time by the same engine the app uses,
// so a page can never drift from the calculator it links into. Nothing is
// written by hand except the prose around them.
//
// Output goes to public/models/, which Vite copies verbatim — no bundle, no
// hydration, nothing to wait for.

import { mkdirSync, writeFileSync } from "node:fs";
import { calculate, maxConcurrency, DTYPE_LABELS, type Dtype } from "../src/lib/calc.ts";
import { KNOWN_MODELS, type KnownModel } from "../src/lib/models.ts";
import { GPUS, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { formatGiB } from "../src/lib/format.ts";

// Not the app's formatInt: that one follows the runtime locale, which is right in
// the browser and wrong at build time — the build machine's locale leaked into an
// English page and rendered 131072 as "131.072".
const int = (n: number) => n.toLocaleString("en-US");

const BASE = "https://tahircengiz.github.io/LLMScale/";
const OUT = new URL("../public/models/", import.meta.url);

/** The precisions worth tabulating: the reference point, and the two people reach for. */
const PRECISIONS: Dtype[] = ["bf16", "fp8", "int4"];
/** Context windows people actually ask about, not every power of two. */
const CONTEXTS = [8192, 32768, 131072];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slug = (m: KnownModel) => m.id;

function size(m: KnownModel, weightDtype: Dtype, contextLength: number, concurrency = 1) {
  return calculate({
    arch: m,
    weightDtype,
    kvDtype: "fp16",
    contextLength,
    concurrency,
    overheadPct: 0.1,
    cudaContextGiB: 0.75,
  });
}

/** Smallest devices that hold the model at this precision, cheapest tier first. */
function fitting(m: KnownModel, dtype: Dtype, contextLength: number): Gpu[] {
  const need = size(m, dtype, contextLength).totalGiB;
  return GPUS.filter((g) => need <= usableGiB(g, ""))
    .sort((a, b) => usableGiB(a, "") - usableGiB(b, ""))
    .slice(0, 5);
}

/** How many cards it takes, when one will not do. */
function cardsNeeded(m: KnownModel, dtype: Dtype, g: Gpu, contextLength: number): number {
  return Math.ceil(size(m, dtype, contextLength).totalGiB / usableGiB(g, ""));
}

function page(m: KnownModel): string {
  const bf16 = size(m, "bf16", 8192);
  const params = (m.numParams / 1e9).toFixed(m.numParams >= 1e11 ? 0 : 1).replace(/\.0$/, "");
  const title = `${m.displayName} VRAM requirements — weights, KV cache and which GPUs fit`;
  const desc =
    `${m.displayName} needs ${formatGiB(bf16.totalGiB)} of GPU memory at BF16 with an 8k context ` +
    `for a single user: ${formatGiB(bf16.weightsGiB)} of weights plus KV cache and overhead. ` +
    `Full tables by precision and context, and the GPUs that fit.`;
  const url = `${BASE}models/${slug(m)}.html`;
  const calcHref = `${BASE}?m=${encodeURIComponent(m.hfId)}&p=${m.numParams}&L=${m.numLayers}&h=${m.hiddenSize}&a=${m.numAttentionHeads}&k=${m.numKeyValueHeads}${m.headDim ? `&d=${m.headDim}` : ""}&wd=bf16&kd=fp16&ctx=8192&n=1`;

  // The memory table: precision down the side, context across the top.
  const rows = PRECISIONS.map((d) => {
    const cells = CONTEXTS.map((c) => {
      const r = size(m, d, c);
      return `<td><strong>${formatGiB(r.totalGiB)}</strong><span>${formatGiB(r.weightsGiB)} weights</span></td>`;
    }).join("");
    return `<tr><th scope="row">${esc(DTYPE_LABELS[d])}</th>${cells}</tr>`;
  }).join("");

  // Which cards hold it, per precision, at a workaday 8k context.
  const fits = PRECISIONS.map((d) => {
    const gs = fitting(m, d, 8192);
    const need = size(m, d, 8192).totalGiB;
    if (!gs.length) {
      // Nothing single-card fits: say what it takes instead of going quiet.
      const biggest = [...GPUS].sort((a, b) => usableGiB(b, "") - usableGiB(a, ""))[0];
      const n = cardsNeeded(m, d, biggest, 8192);
      return `<li><strong>${esc(DTYPE_LABELS[d])}</strong> — ${formatGiB(need)}: no single GPU holds it. The largest here, ${esc(biggest.name)}, would take <strong>${n}</strong>.</li>`;
    }
    return `<li><strong>${esc(DTYPE_LABELS[d])}</strong> — ${formatGiB(need)}: fits ${gs.map((g) => esc(g.name)).join(", ")}</li>`;
  }).join("");

  // Concurrency is the question behind the question: capacity, not just fit.
  const serveOn = fitting(m, "bf16", 8192)[0] ?? fitting(m, "int4", 8192)[0];
  const concurrency = serveOn
    ? PRECISIONS.map((d) => {
        const n = maxConcurrency(
          { arch: m, weightDtype: d, kvDtype: "fp16", contextLength: 8192, overheadPct: 0.1, cudaContextGiB: 0.75 },
          usableGiB(serveOn, "")
        );
        return `<li><strong>${esc(DTYPE_LABELS[d])}</strong> — about <strong>${int(n)}</strong> concurrent users at 8k context</li>`;
      }).join("")
    : "";

  const kvPerTok = bf16.kvPerTokenBytes;
  const gqa = m.numKeyValueHeads < m.numAttentionHeads;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="Tahir Cengiz">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(m.displayName)} VRAM requirements">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="LLMScale">
<meta property="og:image" content="${BASE}og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(m.displayName)} VRAM requirements">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${BASE}og.png">
<script defer src="https://stats.delix.dev/u.js" data-website-id="22ee565e-f235-43fe-bd5e-3b693cbf86ca"></script>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;padding:2.5rem 1.25rem 4rem;
    background:radial-gradient(1100px 620px at 18% -14%,rgba(93,95,239,.1),transparent 62%),#090b10;
    color:#e7e9ef;font:400 1rem/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased}
  main{max-width:46rem;margin:0 auto}
  a{color:#9698f7}
  .brand{display:inline-block;font-weight:700;color:#e7e9ef;text-decoration:none;margin-bottom:1.5rem}
  h1{font-size:1.875rem;font-weight:700;line-height:1.15;letter-spacing:-.015em;margin:0 0 .5rem}
  h2{font-size:1.125rem;font-weight:600;letter-spacing:-.015em;margin:2rem 0 .5rem}
  .lede{color:#c3c8d4;font-size:1rem;margin:0 0 1.5rem}
  .answer{background:rgba(20,23,31,.7);border:1px solid rgba(255,255,255,.1);border-radius:1rem;
    padding:1.25rem;box-shadow:0 20px 25px -5px rgb(0 0 0/.3)}
  .answer .big{font-size:1.875rem;font-weight:700;line-height:1;color:#e7e9ef}
  .answer .cap{font-size:.75rem;text-transform:uppercase;letter-spacing:.025em;color:#a1a8b8}
  table{width:100%;border-collapse:collapse;margin:.5rem 0 0;font-size:.875rem}
  th,td{text-align:left;padding:.5rem .625rem;border-bottom:1px solid #232834;vertical-align:top}
  thead th{font-size:.75rem;text-transform:uppercase;letter-spacing:.025em;color:#a1a8b8;font-weight:500}
  td strong{display:block;color:#e7e9ef}
  td span{font-size:.75rem;color:#868ea0}
  ul{padding-left:1.1rem}
  li{margin:.3rem 0}
  .spec{display:flex;flex-wrap:wrap;gap:.4rem;margin:.75rem 0 0;padding:0;list-style:none}
  .spec li{background:rgba(27,31,42,.6);border-radius:9999px;padding:.15rem .625rem;font-size:.75rem;color:#c3c8d4;margin:0}
  .cta{display:inline-block;background:#4a4cd4;color:#fff;text-decoration:none;border-radius:.75rem;
    padding:.55rem .9rem;font-weight:500;margin-top:.75rem}
  footer{margin-top:3rem;padding-top:1.25rem;border-top:1px solid #232834;color:#868ea0;font-size:.75rem}
</style>
</head>
<body>
<main>
  <a class="brand" href="../">LLMScale</a>

  <h1>${esc(m.displayName)}: how much VRAM does it need?</h1>
  <p class="lede">${esc(m.displayName)} has ${params}B parameters across ${m.numLayers} layers.
    Below are its real memory requirements — weights, KV cache and overhead — by precision and
    context window, and the GPUs that hold it. Every figure is computed from the model's own
    architecture, not a rule of thumb.</p>

  <div class="answer">
    <div class="cap">BF16 · 8k context · one user</div>
    <div class="big">${formatGiB(bf16.totalGiB)}</div>
    <p style="margin:.5rem 0 0;color:#c3c8d4;font-size:.875rem">
      ${formatGiB(bf16.weightsGiB)} of weights, ${formatGiB(bf16.kvCacheGiB)} of KV cache,
      ${formatGiB(bf16.activationsGiB + bf16.cudaOverheadGiB)} of activations and CUDA context.</p>
    <ul class="spec">
      <li>${m.numLayers} layers</li><li>hidden ${m.hiddenSize}</li>
      <li>${m.numAttentionHeads}/${m.numKeyValueHeads} heads${gqa ? " · GQA" : ""}</li>
      <li>head dim ${bf16.headDim}</li>
      ${m.maxContext ? `<li>max ${int(m.maxContext)} tokens</li>` : ""}
      ${m.isMoE ? "<li>MoE</li>" : ""}
    </ul>
  </div>

  <h2>Memory by precision and context</h2>
  <table>
    <thead><tr><th scope="col">Precision</th>${CONTEXTS.map((c) => `<th scope="col">${c >= 1024 ? `${c / 1024}k` : c} context</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="font-size:.75rem;color:#868ea0">Totals for one concurrent user, FP16 KV cache,
    10% activation overhead and 0.75 GiB of CUDA context. Quantizing the weights shrinks the
    weights only — the KV cache is unchanged, which is why the saving narrows as context grows.</p>

  <h2>Which GPUs fit it</h2>
  <ul>${fits}</ul>
  ${concurrency ? `<h2>How many users fit on one ${esc(serveOn!.name)}</h2><ul>${concurrency}</ul>` : ""}

  <h2>Where the numbers come from</h2>
  <p>Weights are <code>parameters × bytes per parameter</code>. The KV cache is
    <code>2 × layers × kv_heads × head_dim × bytes × context × concurrency</code>, which for this
    model works out to <strong>${(kvPerTok / 1024).toFixed(1)} KiB per token</strong> at FP16.
    ${gqa ? `Its grouped-query attention shares ${m.numAttentionHeads} query heads across ${m.numKeyValueHeads} key/value heads, so the cache is ${(m.numAttentionHeads / m.numKeyValueHeads).toFixed(0)}× smaller than multi-head attention would need.` : ""}
    GPU fit assumes about 95% of nominal VRAM is usable after the driver reserve.</p>
  <p>These are planning figures, not guarantees: actual usage depends on the serving engine —
    vLLM, TGI, llama.cpp — and on paged-attention efficiency.</p>

  <a class="cta" href="${calcHref}">Open ${esc(m.displayName)} in the calculator →</a>

  <footer>
    Part of <a href="../">LLMScale</a>, a client-side LLM memory calculator.
    Change the precision, context or concurrency and the numbers follow.
    · <a href="../train.html">Fine-tuning memory</a>
    · <a href="../vllm.html">vLLM parameters</a>
    · <a href="../compare.html">Compare models</a>
  </footer>
</main>
</body>
</html>`;
}

const wanted = process.argv.slice(2);
const models = wanted.length
  ? KNOWN_MODELS.filter((m) => wanted.includes(m.id))
  : KNOWN_MODELS;

if (wanted.length && models.length !== wanted.length) {
  const missing = wanted.filter((w) => !KNOWN_MODELS.some((m) => m.id === w));
  console.error(`unknown model id(s): ${missing.join(", ")}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
for (const m of models) {
  const file = new URL(`${slug(m)}.html`, OUT);
  writeFileSync(file, page(m), "utf8");
  const r = size(m, "bf16", 8192);
  console.log(`${slug(m)}.html  ${m.displayName.padEnd(28)} ${formatGiB(r.totalGiB).padStart(10)} @ bf16/8k`);
}
console.log(`\n${models.length} page(s) written to public/models/`);

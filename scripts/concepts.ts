// The concept guides: how big the KV cache gets, how attention variants change it,
// and what quantization does and does not shrink — in English and Turkish.
//
// Built by scripts/genPages.ts, which supplies the page shell and formatting. The
// prose is written by hand; every number in it is computed from the engine and the
// bundled models when the page is built, so a worked example cannot fall out of
// step with the calculator it explains. A claim beyond LLMScale's own arithmetic
// names its source: the MQA, GQA and DeepSeek-V2 papers, gpt-oss's model card.

import {
  calculate,
  kvBytesPerToken,
  maxConcurrency,
  resolveHeadDim,
  usesMla,
  weightsBytes,
  BYTES_PER_GIB,
  type Dtype,
  type ModelArch,
} from "../src/lib/calc.ts";
import { KNOWN_MODELS, type KnownModel } from "../src/lib/models.ts";
import { GPUS, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import type { Lang } from "../src/lib/dict.ts";
import { CONCEPT_FILES, GPUS_HUB, MODELS_HUB } from "../src/lib/staticPages.ts";

/** Formatting and links, bound to one language by genPages.ts. */
export interface Fmt {
  lang: Lang;
  gib(n: number): string;
  int(n: number): string;
  params(n: number): string;
  ratio(r: number): string;
  dec(s: string): string;
  href(file?: string): string;
  modelLink(id: string): string;
  gpuLink(id: string): string;
}

export interface Concept {
  file: string;
  title: string;
  description: string;
  h1: string;
  crumb: string;
  /** One or two sentences for the hub page. */
  summary: string;
  body: string;
}

const model = (id: string): KnownModel => {
  const m = KNOWN_MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`concepts: no bundled model ${id}`);
  return m;
};
const card = (id: string): Gpu => {
  const g = GPUS.find((x) => x.id === id);
  if (!g) throw new Error(`concepts: no GPU ${id}`);
  return g;
};
const WORK = { kvDtype: "fp16" as Dtype, overheadPct: DEFAULT_STATE.overheadPct, cudaContextGiB: DEFAULT_STATE.cudaContextGiB };
const kvTok = (m: ModelArch) => kvBytesPerToken(m, "fp16");
const kvGiB = (m: ModelArch, ctx: number, users = 1) => (kvTok(m) * ctx * users) / BYTES_PER_GIB;
const wGiB = (m: ModelArch, d: Dtype) => weightsBytes(m, d) / BYTES_PER_GIB;
/** The same model with full multi-head attention: one key-value head per query head, no MLA. */
const asMha = (m: KnownModel): ModelArch => ({ ...m, numKeyValueHeads: m.numAttentionHeads, kvLoraRank: undefined, qkRopeHeadDim: undefined });
/** The same model as a calculator that ignores MLA would read it. */
const perHead = (m: KnownModel): ModelArch => ({ ...m, kvLoraRank: undefined, qkRopeHeadDim: undefined });
const kib = (f: Fmt, bytes: number) => `${f.dec((bytes / 1024).toFixed(1))} KiB`;
const attentionType = (m: KnownModel) =>
  usesMla(m) ? "MLA" : m.numKeyValueHeads === 1 ? "MQA" : m.numKeyValueHeads < m.numAttentionHeads ? "GQA" : "MHA";
const link = (f: Fmt, file: string, text: string) => `<a href="${f.href(file)}">${text}</a>`;

// ── KV cache size ─────────────────────────────────────────────────────────────
function kvCache(f: Fmt): Concept {
  const en = f.lang === "en";
  const ex = model("llama-3.1-8b");
  const peer = model("qwen2.5-7b");
  const L = ex.numLayers;
  const k = ex.numKeyValueHeads;
  const d = resolveHeadDim(ex);
  const exMax = ex.maxContext ?? 131072;
  const weights = wGiB(ex, "bf16");
  const kvMax = kvGiB(ex, exMax);
  const h100 = card("h100-80");
  const users = [8192, 32768, 131072].map((c) =>
    maxConcurrency({ arch: ex, weightDtype: "bf16", contextLength: c, ...WORK }, usableGiB(h100))
  );
  const CTX = [8192, 32768, 131072];
  const ids = ["llama-3.2-3b", "qwen2.5-7b", "llama-3.1-8b", "mistral-nemo-12b", "qwen3-32b", "llama-3.3-70b", "qwen2.5-72b", "deepseek-v3"];
  const rows = ids.map(model).map((m) => {
    const shape = usesMla(m) ? "MLA" : `${m.numKeyValueHeads} × ${resolveHeadDim(m)}`;
    const cells = CTX.map((c) => (c <= (m.maxContext ?? 0) ? `<td>${f.gib(kvGiB(m, c))}</td>` : "<td>—</td>")).join("");
    return `<tr><th scope="row">${f.modelLink(m.id)}</th><td>${m.numLayers}</td><td>${shape}</td><td>${kib(f, kvTok(m))}</td>${cells}</tr>`;
  }).join("");
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">Model</th><th scope="col">${en ? "Layers" : "Katman"}</th><th scope="col">${en ? "KV heads × head dim" : "KV head × head boyutu"}</th><th scope="col">${en ? "Per token" : "Token başına"}</th><th scope="col">8k</th><th scope="col">32k</th><th scope="col">128k</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;

  const exL = f.modelLink(ex.id);
  const peerL = f.modelLink(peer.id);
  const perTok = kvTok(ex);
  const peerTok = kvTok(peer);
  const attention = link(f, CONCEPT_FILES.attention, en ? "GQA, MQA and MLA" : "GQA, MQA ve MLA");
  const quant = link(f, CONCEPT_FILES.quantization, en ? "quantization and VRAM" : "quantization ve VRAM");

  const body = en
    ? `<p class="lede">When a language model generates text, it keeps the keys and values it computed for every earlier token, in every layer, so it does not have to compute them again for the next one. That store is the KV cache. It is the part of GPU memory rules of thumb leave out, and at long context or with many users it outgrows the model's weights.</p>
<h2>The formula</h2>
<p>For each token, every layer stores one key vector and one value vector per key-value head:</p>
<pre><code>KV bytes per token = 2 × layers × key-value heads × head dimension × bytes per value
KV cache           = KV bytes per token × context length × concurrent sequences</code></pre>
<p>The 2 counts the key and the value. A value takes 2 bytes at FP16 or BF16 and 1 byte at FP8. Layers, key-value heads and head dimension are fixed by the architecture — <code>num_hidden_layers</code>, <code>num_key_value_heads</code> and <code>head_dim</code> in the model's config.json — which is why two models of the same size can need very different caches. Models with multi-head latent attention replace the middle of the formula; see ${attention}.</p>
<h2>A worked example: ${ex.displayName}</h2>
<p>${exL} has ${L} layers, ${k} key-value heads and a head dimension of ${d}. At FP16 that is 2 × ${L} × ${k} × ${d} × 2 = ${f.int(perTok)} bytes, or ${kib(f, perTok)}, per token. One user at 8k tokens needs ${f.gib(kvGiB(ex, 8192))} of cache; at its full ${f.int(exMax)}-token context, ${f.gib(kvMax)} — ${kvMax > weights ? `more than its ${f.gib(weights)} of BF16 weights` : `against ${f.gib(weights)} of BF16 weights`}.</p>
<p>Parameter count is not what decides it. ${peerL} and ${exL} are close in size — ${f.params(peer.numParams)} and ${f.params(ex.numParams)} parameters — but ${ex.displayName} stores ${kib(f, perTok)} per token and ${peer.displayName} ${kib(f, peerTok)}, a ${f.ratio(perTok / peerTok)} difference that comes from layers and key-value heads.</p>
<h2>Per-token cache in popular models</h2>
${table}
<p class="note">FP16, one sequence. —: beyond the model's maximum context. DeepSeek V3 caches a compressed latent rather than per-head keys and values. Gemma 2 and gpt-oss are left out: they alternate sliding-window layers, which cache less than this formula counts.</p>
<h2>Concurrency multiplies it</h2>
<p>Every concurrent sequence holds a cache of its own. On one ${f.gpuLink(h100.id)}, with ${f.gib(usableGiB(h100))} usable, ${ex.displayName} at BF16 leaves room for ${f.int(users[0])} users at 8k tokens each, ${f.int(users[1])} at 32k and ${f.int(users[2])} at 128k. The weights set the floor; the cache decides how many people fit above it.</p>
<h2>What shrinks it, and what does not</h2>
<ul class="plain">
<li><strong>Fewer key-value heads.</strong> Grouped-query and multi-query attention share key-value heads across query heads, and multi-head latent attention caches a compressed latent. This comes with the model you choose.</li>
<li><strong>An FP8 KV cache.</strong> One byte per value instead of two halves the cache. vLLM offers it as <code>--kv-cache-dtype fp8</code>; it can cost accuracy on long-context work, so validate it first.</li>
<li><strong>A lower context limit.</strong> The cache grows with every token a sequence holds, so capping sequence length — <code>--max-model-len</code> in vLLM — caps the worst case.</li>
<li><strong>Not weight quantization.</strong> INT4 or FP8 weights shrink the weights only; the cache keeps its own precision, so the saving narrows as context grows. See ${quant}.</li>
<li><strong>Paged attention and prefix caching</strong> use the cache better rather than making it smaller: memory is handed out in blocks as sequences grow instead of being reserved up front, and requests with the same prefix can share its blocks. LLMScale does not model that efficiency, so its figures are the full need.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${f.href()}">Size the KV cache for your model</a></li>
  <li>${attention}</li>
  <li>${link(f, CONCEPT_FILES.quantization, "Quantization and VRAM")}</li>
  <li>${link(f, MODELS_HUB, "VRAM by model")}</li>
</ul>`
    : `<p class="lede">Bir dil modeli metin üretirken, önceki her token için her katmanda hesapladığı key ve value'ları saklar; böylece bir sonraki token için onları yeniden hesaplamaz. Bu depo KV cache'tir. Kaba hesapların atladığı GPU belleği kısmıdır ve uzun context'te ya da çok kullanıcıyla modelin ağırlıklarını geçer.</p>
<h2>Formül</h2>
<p>Her token için her katman, her key-value head başına bir key ve bir value vektörü saklar:</p>
<pre><code>token başına KV byte = 2 × katman × key-value head × head boyutu × değer başına byte
KV cache             = token başına KV byte × context uzunluğu × eşzamanlı dizi</code></pre>
<p>2, key ile value'yu sayar. Bir değer FP16 ya da BF16'da 2 byte, FP8'de 1 byte tutar. Katman, key-value head ve head boyutu mimariyle sabittir — modelin config.json dosyasında <code>num_hidden_layers</code>, <code>num_key_value_heads</code> ve <code>head_dim</code> — aynı boyuttaki iki modelin çok farklı önbellek istemesinin nedeni budur. Multi-head latent attention kullanan modellerde formülün ortası değişir; bkz. ${attention}.</p>
<h2>Çözümlü örnek: ${ex.displayName}</h2>
<p>${exL} ${L} katmana, ${k} key-value head'e ve ${d} boyutlu head'lere sahiptir. FP16'da bu, token başına 2 × ${L} × ${k} × ${d} × 2 = ${f.int(perTok)} byte, yani ${kib(f, perTok)} eder. Tek kullanıcı 8k token'da ${f.gib(kvGiB(ex, 8192))} önbellek ister; ${f.int(exMax)} token'lık tam context'te ${f.gib(kvMax)} — ${kvMax > weights ? `${f.gib(weights)} tutan BF16 ağırlıklarından fazla` : `BF16 ağırlıkları ise ${f.gib(weights)}`}.</p>
<p>Bunu belirleyen parametre sayısı değildir. ${peerL} ile ${exL} boyut olarak birbirine yakındır — ${f.params(peer.numParams)} ve ${f.params(ex.numParams)} parametre — ama ${ex.displayName} token başına ${kib(f, perTok)} saklar, ${peer.displayName} ise ${kib(f, peerTok)}. Aradaki ${f.ratio(perTok / peerTok)} fark katman ve key-value head sayısından gelir.</p>
<h2>Popüler modellerde token başına önbellek</h2>
${table}
<p class="note">FP16, tek dizi. —: modelin maksimum context'inin ötesi. DeepSeek V3, head başına key ve value yerine sıkıştırılmış bir latent saklar. Gemma 2 ve gpt-oss dahil edilmedi: sliding-window katmanlarıyla dönüşümlü çalışırlar ve bu katmanlar formülün saydığından az önbellek tutar.</p>
<h2>Eşzamanlılık onu çarpar</h2>
<p>Her eşzamanlı dizinin kendi önbelleği vardır. ${f.gib(usableGiB(h100))} kullanılabilir belleğiyle tek bir ${f.gpuLink(h100.id)} üzerinde ${ex.displayName}, BF16'da kullanıcı başına 8k token ile ${f.int(users[0])}, 32k ile ${f.int(users[1])}, 128k ile ${f.int(users[2])} kullanıcıya yer bırakır. Ağırlıklar tabanı belirler; önbellek, üstüne kaç kişinin sığacağına karar verir.</p>
<h2>Onu ne küçültür, ne küçültmez</h2>
<ul class="plain">
<li><strong>Daha az key-value head.</strong> Grouped-query ve multi-query attention key-value head'leri query head'ler arasında paylaştırır; multi-head latent attention sıkıştırılmış bir latent saklar. Bu, seçtiğin modelle birlikte gelir.</li>
<li><strong>FP8 KV cache.</strong> Değer başına iki yerine bir byte, önbelleği yarıya indirir. vLLM bunu <code>--kv-cache-dtype fp8</code> olarak sunar; uzun context'li işlerde doğruluğa mal olabilir, önce doğrula.</li>
<li><strong>Daha düşük context sınırı.</strong> Önbellek bir dizinin tuttuğu her token'la büyür; dizi uzunluğunu sınırlamak — vLLM'de <code>--max-model-len</code> — en kötü durumu sınırlar.</li>
<li><strong>Ağırlık quantization'ı değil.</strong> INT4 ya da FP8 ağırlıklar yalnızca ağırlıkları küçültür; önbellek kendi hassasiyetinde kalır, bu yüzden context büyüdükçe kazanç daralır. Bkz. ${quant}.</li>
<li><strong>Paged attention ve prefix caching</strong> önbelleği küçültmez, daha iyi kullanır: bellek, baştan ayrılmak yerine diziler büyüdükçe bloklar hâlinde verilir ve aynı ön eki paylaşan istekler o blokları ortak kullanabilir. LLMScale bu verimliliği modellemez; sayıları ihtiyacın tamamıdır.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${f.href()}">Modelin için KV cache'i hesapla</a></li>
  <li>${attention}</li>
  <li>${link(f, CONCEPT_FILES.quantization, "Quantization ve VRAM")}</li>
  <li>${link(f, MODELS_HUB, "Modele göre VRAM")}</li>
</ul>`;

  return {
    file: CONCEPT_FILES.kvCache,
    title: en ? "KV Cache Size: Formula and Examples" : "KV Cache Boyutu: Formül ve Örnekler",
    description: en
      ? `How big an LLM's KV cache gets: the formula, a worked example with ${ex.displayName}, per-token figures for popular models, and what concurrency, FP8 and grouped-query attention do to it.`
      : `Bir LLM'in KV cache'i ne kadar büyür: formül, ${ex.displayName} ile çözümlü örnek, popüler modellerde token başına değerler; eşzamanlılık, FP8 ve grouped-query attention'ın ona etkisi.`,
    h1: en ? "KV cache size: the formula, with real models" : "KV cache boyutu: formül ve gerçek modellerle örnekler",
    crumb: "KV cache",
    summary: en
      ? "The formula, a worked example, per-token figures for popular models, and why concurrency multiplies it while weight quantization leaves it alone."
      : "Formül, çözümlü bir örnek, popüler modellerde token başına değerler; eşzamanlılığın onu neden çarptığı ve ağırlık quantization'ının neden dokunmadığı.",
    body,
  };
}

// ── GQA, MQA and MLA ──────────────────────────────────────────────────────────
function attention(f: Fmt): Concept {
  const en = f.lang === "en";
  const mha = model("phi-3-mini");
  const gqa = model("llama-3.3-70b");
  const mla = model("deepseek-v3");
  const small = model("qwen2.5-7b");
  const big = model("llama-3.1-8b");
  const gqaCount = KNOWN_MODELS.filter((m) => attentionType(m) === "GQA").length;
  const kl = mla.kvLoraRank ?? 0;
  const qr = mla.qkRopeHeadDim ?? 0;
  const mlaVsHead = kvTok(perHead(mla)) / kvTok(mla);
  const pct = Math.round((Math.abs(big.numParams - small.numParams) / Math.max(big.numParams, small.numParams)) * 100);

  const ids = ["phi-3-mini", "llama-3.2-1b", "qwen2.5-7b", "llama-3.1-8b", "mistral-nemo-12b", "mixtral-8x7b", "qwen3-32b", "llama-3.3-70b", "qwen2.5-72b", "deepseek-v3"];
  const rows = ids.map(model).map((m) =>
    `<tr><th scope="row">${f.modelLink(m.id)}</th><td>${m.numAttentionHeads}</td><td>${usesMla(m) ? "—" : m.numKeyValueHeads}</td><td>${attentionType(m)}</td><td>${kib(f, kvTok(m))}</td><td>${f.ratio(kvTok(asMha(m)) / kvTok(m))}</td></tr>`
  ).join("");
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">Model</th><th scope="col">${en ? "Query heads" : "Query head"}</th><th scope="col">${en ? "KV heads" : "KV head"}</th><th scope="col">Attention</th><th scope="col">${en ? "Per token" : "Token başına"}</th><th scope="col">${en ? "vs MHA" : "MHA'ya göre"}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;
  const kv = link(f, CONCEPT_FILES.kvCache, en ? "KV cache size" : "KV cache boyutu");

  const body = en
    ? `<p class="lede">Attention is where the KV cache comes from, and the way a model arranges its attention heads can change the cache by an order of magnitude at the same parameter count. Four arrangements cover today's open models.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Every query head has key and value heads of its own, and the cache stores all of them: 2 × layers × heads × head dimension × bytes per token. It is the original Transformer design and the most expensive to cache. ${f.modelLink(mha.id)} still uses it — ${mha.numAttentionHeads} heads over ${mha.numLayers} layers, ${kib(f, kvTok(mha))} per token.</p>
<h2>Multi-query attention (MQA)</h2>
<p>All query heads share a single key head and a single value head (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). The cache shrinks by the full number of heads — the largest saving there is — but sharing one set of keys and values across every head can cost quality.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Query heads are split into groups, and each group shares one key-value head: more than one, fewer than the number of query heads. Ainslie et al. (2023) proposed it as the middle ground — quality close to multi-head attention, speed close to multi-query — and ${gqaCount} of the ${KNOWN_MODELS.length} models LLMScale bundles use it. ${f.modelLink(gqa.id)} groups ${gqa.numAttentionHeads} query heads onto ${gqa.numKeyValueHeads} key-value heads, so it caches ${kib(f, kvTok(gqa))} per token where multi-head attention would need ${kib(f, kvTok(asMha(gqa)))}: ${f.ratio(kvTok(asMha(gqa)) / kvTok(gqa))} less.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 took another route. Instead of keys and values per head, each layer caches one compressed latent vector per token, plus a small decoupled key that carries the rotary position encoding. The cache per token becomes <code>layers × (kv_lora_rank + qk_rope_head_dim) × bytes</code>, and the head count drops out. For its own dimensions, the DeepSeek-V2 paper (§2.1.3) puts that at the size of GQA with only 2.25 groups.</p>
<p>${f.modelLink(mla.id)} caches ${kl} + ${qr} = ${kl + qr} values per layer across ${mla.numLayers} layers: ${kib(f, kvTok(mla))} per token, ${f.ratio(mlaVsHead)} less than the per-head formula gives. At 8k context that is ${f.gib(kvGiB(mla, 8192))} instead of ${f.gib(kvGiB(perHead(mla), 8192))}. A calculator that applies the per-head formula to DeepSeek models overstates the cache by that factor; LLMScale switches formulas whenever a config carries both fields.</p>
<h2>Side by side</h2>
${table}
<p class="note">FP16. “vs MHA”: how many times more a multi-head version of the same model would cache.</p>
<h2>What it means when you choose a model</h2>
<ul class="plain">
<li><strong>Check the key-value heads before the parameter count.</strong> ${f.modelLink(small.id)} and ${f.modelLink(big.id)} differ by ${pct}% in parameters and by ${f.ratio(kvTok(big) / kvTok(small))} in cache per token.</li>
<li><strong>The attention layout comes with the model.</strong> To shrink a served model's cache you have an FP8 KV cache, a shorter context or fewer sequences — see ${kv}.</li>
<li><strong>Tensor parallelism splits key-value heads across GPUs,</strong> so the calculator suggests GPU counts that divide them evenly.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${f.href("anatomy.html")}">See a model's attention layout</a></li>
  <li>${link(f, CONCEPT_FILES.kvCache, "KV cache size")}</li>
  <li>${link(f, CONCEPT_FILES.quantization, "Quantization and VRAM")}</li>
</ul>`
    : `<p class="lede">KV cache attention'dan doğar ve bir modelin attention head'lerini nasıl düzenlediği, aynı parametre sayısında önbelleği on kat değiştirebilir. Bugünün açık modellerini dört düzen kapsar.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Her query head'in kendi key ve value head'leri vardır ve önbellek hepsini saklar: token başına 2 × katman × head × head boyutu × byte. Özgün Transformer tasarımıdır ve önbelleği en pahalı olandır. ${f.modelLink(mha.id)} hâlâ bunu kullanır — ${mha.numLayers} katmanda ${mha.numAttentionHeads} head, token başına ${kib(f, kvTok(mha))}.</p>
<h2>Multi-query attention (MQA)</h2>
<p>Tüm query head'ler tek bir key head'ini ve tek bir value head'ini paylaşır (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). Önbellek head sayısının tamamı kadar küçülür — mümkün olan en büyük kazanç — ama tek bir key ve value takımını her head'e paylaştırmak kaliteye mal olabilir.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Query head'ler gruplara ayrılır ve her grup bir key-value head'i paylaşır: birden fazla, ama query head sayısından az. Ainslie ve arkadaşları (2023) bunu orta yol olarak önerdi — multi-head attention'a yakın kalite, multi-query'ye yakın hız — ve LLMScale'in yerleşik ${KNOWN_MODELS.length} modelinden ${gqaCount} tanesi bunu kullanır. ${f.modelLink(gqa.id)}, ${gqa.numAttentionHeads} query head'i ${gqa.numKeyValueHeads} key-value head'e toplar; bu yüzden multi-head attention'ın ${kib(f, kvTok(asMha(gqa)))} isteyeceği yerde token başına ${kib(f, kvTok(gqa))} saklar: ${f.ratio(kvTok(asMha(gqa)) / kvTok(gqa))} daha az.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 başka bir yol izledi. Head başına key ve value yerine her katman, token başına tek bir sıkıştırılmış latent vektör ve rotary konum kodlamasını taşıyan küçük, ayrık bir key saklar. Token başına önbellek <code>katman × (kv_lora_rank + qk_rope_head_dim) × byte</code> olur ve head sayısı formülden düşer. DeepSeek-V2 makalesi (§2.1.3), kendi boyutları için bunu yalnızca 2,25 gruplu bir GQA'nın boyutuna eşitler.</p>
<p>${f.modelLink(mla.id)}, ${mla.numLayers} katmanın her birinde ${kl} + ${qr} = ${kl + qr} değer saklar: token başına ${kib(f, kvTok(mla))}, head başına formülün verdiğinden ${f.ratio(mlaVsHead)} az. 8k context'te bu, ${f.gib(kvGiB(perHead(mla), 8192))} yerine ${f.gib(kvGiB(mla, 8192))} eder. DeepSeek modellerine head başına formülü uygulayan bir hesaplayıcı önbelleği bu oranda abartır; LLMScale, bir config iki alanı da taşıdığında formül değiştirir.</p>
<h2>Yan yana</h2>
${table}
<p class="note">FP16. “MHA'ya göre”: aynı modelin multi-head bir sürümünün kaç kat fazla önbellek tutacağı.</p>
<h2>Model seçerken ne anlama gelir</h2>
<ul class="plain">
<li><strong>Parametre sayısından önce key-value head'lere bak.</strong> ${f.modelLink(small.id)} ile ${f.modelLink(big.id)} parametrede %${pct}, token başına önbellekte ${f.ratio(kvTok(big) / kvTok(small))} fark eder.</li>
<li><strong>Attention düzeni modelle birlikte gelir.</strong> Servis edilen bir modelin önbelleğini küçültmek için FP8 KV cache, daha kısa context ya da daha az dizi kalır — bkz. ${kv}.</li>
<li><strong>Tensor parallel key-value head'leri GPU'lar arasında böler;</strong> bu yüzden hesaplayıcı onları eşit bölen GPU sayıları önerir.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${f.href("anatomy.html")}">Bir modelin attention düzenini gör</a></li>
  <li>${link(f, CONCEPT_FILES.kvCache, "KV cache boyutu")}</li>
  <li>${link(f, CONCEPT_FILES.quantization, "Quantization ve VRAM")}</li>
</ul>`;

  return {
    file: CONCEPT_FILES.attention,
    title: en ? "GQA, MQA and MLA: Attention and KV Cache Size" : "GQA, MQA ve MLA: Attention ve KV Cache Boyutu",
    description: en
      ? `How multi-head, multi-query, grouped-query and multi-head latent attention change an LLM's KV cache, with ${gqa.displayName} and ${mla.displayName} worked through and ${ids.length} models side by side.`
      : `Multi-head, multi-query, grouped-query ve multi-head latent attention bir LLM'in KV cache'ini nasıl değiştirir; ${gqa.displayName} ve ${mla.displayName} üzerinden hesaplanmış, ${ids.length} model yan yana.`,
    h1: en ? "GQA, MQA and MLA: how attention decides the KV cache" : "GQA, MQA ve MLA: attention KV cache'i nasıl belirler",
    crumb: en ? "GQA, MQA and MLA" : "GQA, MQA ve MLA",
    summary: en
      ? "Four ways to arrange attention heads, why they change the cache by an order of magnitude, and how DeepSeek's latent attention takes the head count out of the formula."
      : "Attention head'lerini düzenlemenin dört yolu, önbelleği neden on kat değiştirdikleri ve DeepSeek'in latent attention'ının head sayısını formülden nasıl çıkardığı.",
    body,
  };
}

// ── quantization ──────────────────────────────────────────────────────────────
function quantization(f: Fmt): Concept {
  const en = f.lang === "en";
  const cols = ["llama-3.1-8b", "qwen2.5-32b", "llama-3.3-70b", "llama-3.1-405b"].map(model);
  const precisions: [string, Dtype, number][] = [
    ["FP32", "fp32", 4],
    ["BF16 / FP16", "bf16", 2],
    ["FP8", "fp8", 1],
    ["INT8", "int8", 1],
    ["INT4", "int4", 0.5],
  ];
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">${en ? "Precision" : "Hassasiyet"}</th><th scope="col">${en ? "Bytes / parameter" : "Byte / parametre"}</th>${cols.map((m) => `<th scope="col">${f.modelLink(m.id)}</th>`).join("")}</tr></thead>
<tbody>${precisions.map(([label, d, bytes]) => `<tr><th scope="row">${label}</th><td>${f.dec(String(bytes))}</td>${cols.map((m) => `<td>${f.gib(wGiB(m, d))}</td>`).join("")}</tr>`).join("")}</tbody>
</table></div>`;

  const oss = model("gpt-oss-120b");
  const h100 = card("h100-80");
  const ossNeed = calculate({ arch: oss, weightDtype: "int4", contextLength: 8192, concurrency: 1, ...WORK }).totalGiB;
  const long = model("llama-3.3-70b");
  const longKv = kvGiB(long, 131072);
  const longInt4 = wGiB(long, "int4");
  const moe = model("mixtral-8x7b");
  const kv = link(f, CONCEPT_FILES.kvCache, en ? "KV cache size" : "KV cache boyutu");

  const body = en
    ? `<p class="lede">Quantization stores a model's weights in fewer bits. Weights are usually the largest part of GPU memory, so it is the first lever people reach for — but it shrinks only the weights, and every step down trades some accuracy.</p>
<h2>Bytes per parameter</h2>
<p>Weights take <code>parameters × bytes per parameter</code>. BF16 and FP16 are the reference — most models are released in one of them — and every other precision is a multiple of it.</p>
${table}
<p class="note">Weights only, before the KV cache and overhead.</p>
<h2>The formats you will meet</h2>
<ul class="plain">
<li><strong>BF16 and FP16</strong> — 16-bit floating point. BF16 keeps FP32's range with less precision, which is why training and most released checkpoints use it.</li>
<li><strong>FP8</strong> — 8-bit floating point, one byte per weight, supported in hardware by recent NVIDIA GPUs (Ada Lovelace, Hopper and later). Some models ship FP8 checkpoints.</li>
<li><strong>INT8</strong> — 8-bit integers with scaling factors, one byte per weight.</li>
<li><strong>AWQ and GPTQ</strong> — 4-bit, weight-only methods: weights are stored in 4 bits and computed at 16. They ship as safetensors and aim at GPU serving engines such as vLLM.</li>
<li><strong>GGUF</strong> — llama.cpp's file format, with quantization levels named by bits (Q4, Q5, Q8…), used on CPUs, Apple Silicon and consumer GPUs.</li>
<li><strong>NVFP4 and MXFP4</strong> — 4-bit floating-point formats with shared scales. gpt-oss ships its expert weights in MXFP4, which is how ${f.modelLink(oss.id)} fits on a single 80 GB GPU: ${f.gib(ossNeed)} at 8k context for one user, against ${f.gib(usableGiB(h100))} usable on an ${f.gpuLink(h100.id)}.</li>
<li><strong>NF4</strong> — QLoRA's 4-bit NormalFloat, for fine-tuning adapters on a frozen, quantized base model.</li>
</ul>
<h2>Why 4-bit is not exactly half a byte</h2>
<p>LLMScale counts 4-bit weights at 0.5 bytes. Real 4-bit formats also store their scaling factors, and many keep some tensors — the embeddings, the output layer — at higher precision, so checkpoints come out somewhat larger than half of BF16. QLoRA's NF4 with double quantization measures 4.127 bits, or 0.516 bytes, per parameter, and that is the figure the fine-tuning calculator uses.</p>
<h2>It does not shrink the KV cache</h2>
<p>The KV cache has a precision of its own, set by the serving engine rather than by the weights' format. Take ${f.modelLink(long.id)} with one user at 128k context: its weights take ${f.gib(wGiB(long, "bf16"))} at BF16 and ${f.gib(longInt4)} at INT4, while the KV cache stays at ${f.gib(longKv)} in FP16${longKv > longInt4 ? " — more than the INT4 weights" : ""}. Storing the cache in FP8 is a separate choice that halves it; see ${kv}.</p>
<h2>Mixture-of-Experts models</h2>
<p>Every expert is quantized, and every expert still has to be in memory. ${f.modelLink(moe.id)} holds ${f.params(moe.numParams)} parameters: ${f.gib(wGiB(moe, "bf16"))} of weights at BF16, ${f.gib(wGiB(moe, "int4"))} at INT4. Its ${f.params(moe.activeParams ?? 0)} active parameters decide how much work each token does, not how much memory the model takes.</p>
<h2>Choosing a precision</h2>
<ul class="plain">
<li><strong>Start from what fits.</strong> When a model outgrows a card, the calculator names the first lighter precision that fits it.</li>
<li><strong>Measure the cost.</strong> Each step down trades accuracy for memory, and how much depends on the model and the method; test on your own task before serving.</li>
<li><strong>Let a pre-quantized checkpoint speak for itself.</strong> LLMScale reads its precision from <code>quantization_config</code>, the repository name or the safetensors header, and vLLM loads AWQ, GPTQ and FP8 checkpoints without a <code>--quantization</code> flag.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${f.href()}">Compare precisions for your model</a></li>
  <li>${link(f, CONCEPT_FILES.kvCache, "KV cache size")}</li>
  <li>${link(f, CONCEPT_FILES.attention, "GQA, MQA and MLA")}</li>
  <li>${link(f, GPUS_HUB, "Which LLMs fit on which GPU")}</li>
</ul>`
    : `<p class="lede">Quantization, bir modelin ağırlıklarını daha az bitle saklar. Ağırlıklar genelde GPU belleğinin en büyük kısmıdır, bu yüzden ilk başvurulan araçtır — ama yalnızca ağırlıkları küçültür ve her adım biraz doğruluktan feragat eder.</p>
<h2>Parametre başına byte</h2>
<p>Ağırlıklar <code>parametre × parametre başına byte</code> yer tutar. Referans BF16 ve FP16'dır — çoğu model bunlardan biriyle yayımlanır — ve diğer her hassasiyet bunun bir katıdır.</p>
${table}
<p class="note">Yalnızca ağırlıklar; KV cache ve ek yük hariç.</p>
<h2>Karşılaşacağın formatlar</h2>
<ul class="plain">
<li><strong>BF16 ve FP16</strong> — 16-bit kayan nokta. BF16, FP32'nin aralığını daha düşük hassasiyetle korur; eğitimin ve yayımlanan çoğu checkpoint'in onu kullanmasının nedeni budur.</li>
<li><strong>FP8</strong> — 8-bit kayan nokta, ağırlık başına bir byte; yeni NVIDIA GPU'larında (Ada Lovelace, Hopper ve sonrası) donanım desteği vardır. Bazı modeller FP8 checkpoint'leriyle gelir.</li>
<li><strong>INT8</strong> — ölçek katsayılarıyla 8-bit tam sayılar, ağırlık başına bir byte.</li>
<li><strong>AWQ ve GPTQ</strong> — 4-bit, yalnızca ağırlık yöntemleri: ağırlıklar 4 bitte saklanır, 16 bitte hesaplanır. safetensors olarak gelirler ve vLLM gibi GPU servis motorlarını hedeflerler.</li>
<li><strong>GGUF</strong> — llama.cpp'nin dosya formatı; quantization seviyeleri bit sayısıyla adlandırılır (Q4, Q5, Q8…) ve CPU, Apple Silicon ve tüketici GPU'larında kullanılır.</li>
<li><strong>NVFP4 ve MXFP4</strong> — ortak ölçekli 4-bit kayan nokta formatları. gpt-oss uzman ağırlıklarını MXFP4 ile yayımlar; ${f.modelLink(oss.id)} modelinin tek bir 80 GB GPU'ya sığması bu sayededir: 8k context ve tek kullanıcıyla ${f.gib(ossNeed)}, ${f.gpuLink(h100.id)} üzerindeki ${f.gib(usableGiB(h100))} kullanılabilir belleğe karşı.</li>
<li><strong>NF4</strong> — QLoRA'nın 4-bit NormalFloat'ı; dondurulmuş, quantize edilmiş bir temel model üzerinde adaptör eğitmek için.</li>
</ul>
<h2>4-bit neden tam yarım byte değil</h2>
<p>LLMScale 4-bit ağırlıkları 0,5 byte sayar. Gerçek 4-bit formatlar ölçek katsayılarını da saklar ve çoğu bazı tensörleri — embedding'ler, çıkış katmanı — daha yüksek hassasiyette tutar; bu yüzden checkpoint'ler BF16'nın yarısından biraz büyük çıkar. QLoRA'nın çift quantization'lı NF4'ü parametre başına 4,127 bit, yani 0,516 byte ölçülür ve ince ayar hesaplayıcısının kullandığı sayı budur.</p>
<h2>KV cache'i küçültmez</h2>
<p>KV cache'in kendi hassasiyeti vardır; bunu ağırlıkların formatı değil, servis motoru belirler. Tek kullanıcı ve 128k context'le ${f.modelLink(long.id)}: ağırlıkları BF16'da ${f.gib(wGiB(long, "bf16"))}, INT4'te ${f.gib(longInt4)} tutar, KV cache ise FP16'da ${f.gib(longKv)} olarak kalır${longKv > longInt4 ? " — INT4 ağırlıklardan fazla" : ""}. Önbelleği FP8'de saklamak onu yarıya indiren ayrı bir tercihtir; bkz. ${kv}.</p>
<h2>Mixture-of-Experts modeller</h2>
<p>Her uzman quantize edilir ve her uzmanın yine bellekte olması gerekir. ${f.modelLink(moe.id)} ${f.params(moe.numParams)} parametre tutar: BF16'da ${f.gib(wGiB(moe, "bf16"))}, INT4'te ${f.gib(wGiB(moe, "int4"))} ağırlık. ${f.params(moe.activeParams ?? 0)} aktif parametresi her token'ın ne kadar iş yaptığını belirler, modelin ne kadar bellek tuttuğunu değil.</p>
<h2>Hassasiyet seçmek</h2>
<ul class="plain">
<li><strong>Sığandan başla.</strong> Bir model kartı aştığında hesaplayıcı, sığan ilk hafif hassasiyeti gösterir.</li>
<li><strong>Bedelini ölç.</strong> Her adım bellek için doğruluktan feragat eder ve ne kadar olduğu modele ve yönteme bağlıdır; servis etmeden önce kendi görevinde dene.</li>
<li><strong>Önceden quantize edilmiş checkpoint kendini anlatsın.</strong> LLMScale hassasiyetini <code>quantization_config</code>'ten, depo adından ya da safetensors başlığından okur; vLLM de AWQ, GPTQ ve FP8 checkpoint'lerini <code>--quantization</code> bayrağı olmadan yükler.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${f.href()}">Modelin için hassasiyetleri karşılaştır</a></li>
  <li>${link(f, CONCEPT_FILES.kvCache, "KV cache boyutu")}</li>
  <li>${link(f, CONCEPT_FILES.attention, "GQA, MQA ve MLA")}</li>
  <li>${link(f, GPUS_HUB, "Hangi GPU'ya hangi LLM sığar")}</li>
</ul>`;

  return {
    file: CONCEPT_FILES.quantization,
    title: en ? "LLM Quantization and VRAM: BF16, FP8, INT4" : "LLM Quantization ve VRAM: BF16, FP8, INT4",
    description: en
      ? "How much GPU memory BF16, FP8, INT8 and INT4 weights take for 8B to 405B models, what AWQ, GPTQ, GGUF, MXFP4 and NF4 are, and why quantizing weights leaves the KV cache as it is."
      : "BF16, FP8, INT8 ve INT4 ağırlıklar 8B'den 405B'ye modellerde ne kadar GPU belleği tutar; AWQ, GPTQ, GGUF, MXFP4 ve NF4 nedir ve ağırlıkları quantize etmek neden KV cache'i değiştirmez.",
    h1: en ? "Quantization and VRAM: BF16, FP8, INT8 and INT4" : "Quantization ve VRAM: BF16, FP8, INT8 ve INT4",
    crumb: "Quantization",
    summary: en
      ? "Bytes per parameter from FP32 to INT4, the formats you will meet, why 4-bit is not exactly half a byte, and why it leaves the KV cache alone."
      : "FP32'den INT4'e parametre başına byte, karşılaşacağın formatlar, 4-bit'in neden tam yarım byte olmadığı ve KV cache'e neden dokunmadığı.",
    body,
  };
}

export const CONCEPTS: ((f: Fmt) => Concept)[] = [kvCache, attention, quantization];

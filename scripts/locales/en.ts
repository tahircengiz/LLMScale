// English: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const en: PageText = {
  section: { models: "Models", gpus: "GPUs", concepts: "Concepts", feed: "Feed", crumbs: "Breadcrumb" },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `It uses multi-head latent attention (MLA): each layer caches one compressed ${dims}-dimensional latent per token instead of keys and values for every head, which makes its KV cache ${ratio} smaller than the usual formula would give.`,
      mqa: ({ heads }) =>
        `It uses multi-query attention: all ${heads} query heads share a single key-value head, so its KV cache is ${heads}× smaller than full multi-head attention would need.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `It uses grouped-query attention: ${heads} query heads share ${kvHeads} key-value heads, so its KV cache is ${ratio} smaller than full multi-head attention would need.`,
      mha: ({ heads }) =>
        `It uses full multi-head attention: each of its ${heads} heads keeps its own keys and values, so the KV cache is as large as its head count makes it.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} has ${params} parameters in ${layers} layers.`,
      moe: ({ active, total }) =>
        `It is a Mixture-of-Experts model with about ${active} of its ${total} parameters active per token: memory has to hold all of them, while each token passes through only the active share.`,
      context: ({ max, kv }) => `It takes up to ${max} tokens of context; one user at that length needs ${kv} of KV cache at FP16 on top of the weights.`,
      gated: "Its repository is gated on Hugging Face, so LLMScale ships its architecture in a bundled database.",
    },
    title: (name) => `${name} VRAM Requirements`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} needs ${bf16} of GPU memory at BF16 and ${int4} at INT4 for one user at ${ctx} context. Memory by precision and context, the GPUs that hold it, concurrent users and fine-tuning memory.`,
    h1: (name) => `${name}: how much VRAM does it need?`,
    oneUser: "one user",
    ctx: (k) => `${k} context`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `${weights} of weights, ${kv} of KV cache and ${overhead} of vLLM's overhead. At INT4 the same workload needs ${int4}.`,
    specLayers: "layers",
    specMaxContext: "max context",
    specHeads: "heads",
    h2Memory: (name) => `${name} memory by precision and context`,
    thPrecision: "Precision",
    kvCache: "KV cache",
    tableNote:
      "One user, FP16 KV cache and vLLM's overhead on one GPU at its defaults for a card under 70 GB. Quantizing shrinks the weights, not the KV cache, so the saving narrows as the context grows.",
    h2Holds: "Which single GPUs hold it",
    noSingleGpu: (counts) => `no single GPU holds it — the fewest that serve it, as the calculator lays them out: ${counts}.`,
    fitNote: (ctx) =>
      `At ${ctx} context for one user, the smallest cards first. A discrete card is budgeted at vLLM's default 92% of its memory, a unified-memory device at the share its GPU can address, and each carries vLLM's overhead at its own defaults.`,
    h2Users: "How many users fit",
    doesNotFit: "does not fit",
    usersNote: (ctx) => `Users at ${ctx} context each, on one card. ✗: the weights leave no room for even one.`,
    noCard: "No single card here holds it at any precision; serving it means splitting it across several GPUs with tensor parallelism.",
    h2FineTune: (name) => `Fine-tuning ${name}`,
    thMethod: "Method",
    thMemory: "Memory",
    thSmallestGpu: "Smallest GPU",
    modes: { full: "Full fine-tune", lora: "LoRA (rank 16, attention)", qlora: "QLoRA (rank 16, attention)" },
    sharded: "several GPUs, sharded",
    trainNote:
      "Sequence length 2,048, batch size 1, gradient checkpointing on, Adam. Full fine-tuning keeps 16 bytes per parameter before activations; QLoRA stores the frozen base in 4-bit NF4.",
    h2Source: "Where the numbers come from",
    kvFormula: {
      mla: "With MLA the KV cache is <code>layers × (kv_lora_rank + qk_rope_head_dim) × bytes × context × users</code>.",
      heads: "The KV cache is <code>2 × layers × key-value heads × head dimension × bytes × context × users</code>.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${sliding} of its ${layers} layers attend over a sliding window of the last ${window} tokens and hold no more than that, so past it each further token adds ${pastWindow} KiB, the other ${fullLayers} layers' share.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Weights are <code>parameters × bytes per parameter</code>. ${kvFormula} For ${name} that is ${kib} KiB per token at FP16.${windowNote} These are capacity-planning figures: the serving engine — vLLM, TGI, llama.cpp — and its paged-attention efficiency still move the real number.`,
    more: ({ kvCache, attention }) => `More on <a href="${kvCache}">KV cache size</a> and on <a href="${attention}">GQA, MQA and MLA</a>.`,
    h2Work: (name) => `Work with ${name}`,
    links: {
      size: "Size it for your workload",
      train: "Fine-tuning memory",
      vllm: "vLLM parameters",
      anatomy: "Model anatomy",
      config: "Its config.json, explained",
      serving: "What its files say about serving it",
    },
    h2Family: (family) => `Other ${family} models`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} shares ${total} GB of memory between CPU and GPU; by default the GPU can address about ${vram} GB of it, and LLMScale budgets ${usable} for a model${apple ? "" : ", vLLM's default 92% of what the GPU reports"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} has ${vram} GB of memory. LLMScale budgets ${usable} of it for a model: vLLM's default --gpu-memory-utilization of 0.92 of what the card reports, the rest kept for the CUDA context.`,
      bandwidth: (bw) => `Its memory bandwidth, ${bw} GB/s, is what limits generation speed once a model fits.`,
      apple: "vLLM has no Metal backend, so models run on it with llama.cpp or MLX.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `Of the ${models} popular open models below, ${bf16} fit at BF16, ${fp8} at FP8 and ${int4} at INT4 with an 8k context for one user.`,
    },
    title: (name) => `Which LLMs Fit on ${name}?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `Which open LLMs fit on ${name} (${usable} usable): ${int4} of ${models} popular models at INT4 and ${bf16} at BF16, with concurrent users and maximum context for each.`,
    h1: (name) => `Which LLMs fit on ${name}?`,
    doesNotFit: " (does not fit)",
    thModel: "Model",
    thUsers: "Users",
    thMaxContext: "Max context",
    tableNote:
      "Memory at 8k context for one user (the model's maximum, where that is shorter), FP16 KV cache and vLLM's overhead at this card's defaults. Users (each at 8k) and maximum context are for the highest precision that fits.",
    usableMemory: "usable memory",
    answer: ({ models, bf16, int4 }) => `${int4} of ${models} models fit at INT4, ${bf16} at BF16.`,
    h2Fit: (name) => `Which LLMs fit on ${name}`,
    quantization: (href) => `What BF16, FP8 and INT4 mean for memory: <a href="${href}">quantization and VRAM</a>.`,
    parallel:
      "A model that does not fit one card can still run across several: tensor parallelism splits its weights and KV cache between them. The calculator works out how many.",
    h2Size: (name) => `Size a model on ${name}`,
    open: "Open the calculator with this GPU",
    h2Others: "Other GPUs",
  },

  hubs: {
    models: {
      title: "LLM VRAM Requirements by Model",
      description: (models) =>
        `GPU memory for ${models} popular open LLMs — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — at BF16 and INT4, with the GPUs that fit and fine-tuning memory for each.`,
      h1: "LLM VRAM requirements by model",
      lede: (models) =>
        `How much GPU memory ${models} popular open models need, computed from each one's own architecture: weights, KV cache and overhead at BF16 and INT4 for one user at 8k context. Each page breaks it down by precision and context, lists the GPUs that hold it and how many users fit, and adds fine-tuning memory.`,
      active: "active",
      thModel: "Model",
      thParams: "Parameters",
      thMaxContext: "Max context",
      note: "One user, FP16 KV cache and vLLM's overhead on one GPU; models with a shorter maximum context are shown at that maximum.",
      links: { size: "Size any Hugging Face model", byGpu: "Which LLMs fit on which GPU", memory: "How LLM memory works" },
    },
    gpus: {
      title: "Which LLMs Fit on Which GPU?",
      description:
        "Which popular open LLMs fit on RTX 4090, RTX 5090, H100, H200, B200, Apple M-series, Strix Halo and DGX Spark — at BF16, FP8 and INT4, with users and maximum context.",
      h1: "Which LLMs fit on which GPU",
      lede: ({ models, gpus }) =>
        `Which of ${models} popular open LLMs fit on ${gpus} GPUs people run them on — consumer and workstation cards, data-center GPUs, Apple Silicon and unified-memory AI PCs. Each page lists every model with its memory at BF16, FP8 and INT4, how many users fit and the longest context it can hold.`,
      thType: "Type",
      thUsable: "Usable",
      thBf16: "Models at BF16",
      thInt4: "Models at INT4",
      note: (models) =>
        `Out of ${models} models, at 8k context for one user. Discrete cards are budgeted at vLLM's default 92% of their memory, unified-memory devices at the share their GPU can address, each with vLLM's overhead at its own defaults.`,
      links: { size: "Size a model on any GPU", byModel: "VRAM requirements by model", memory: "How LLM memory works" },
    },
    concepts: {
      title: "How LLM Memory Works: KV Cache, GQA, Quantization",
      description:
        "The terms that decide how much GPU memory an LLM needs — the KV cache, grouped-query and latent attention, quantization — explained with real models and computed figures.",
      h1: "How LLM memory works",
      lede: "Three guides to the terms that decide how much GPU memory a language model needs. Each works through real models, and every number in them is computed by the same engine as the calculator.",
      links: { calculator: "Open the calculator", byModel: "VRAM requirements by model", byGpu: "Which LLMs fit on which GPU" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Model",
      thLayers: "Layers",
      thShape: "KV heads × head dim",
      thPerToken: "Per token",
      attentionLink: "GQA, MQA and MLA",
      quantLink: "quantization and VRAM",
      text: (v) => ({
        title: "KV Cache Size: Formula and Examples",
        description: `How big an LLM's KV cache gets: the formula, a worked example with ${v.ex}, per-token figures for popular models, and what concurrency, FP8 and grouped-query attention do to it.`,
        h1: "KV cache size: the formula, with real models",
        crumb: "KV cache",
        summary: "The formula, a worked example, per-token figures for popular models, and why concurrency multiplies it while weight quantization leaves it alone.",
        body: `<p class="lede">When a language model generates text, it keeps the keys and values it computed for every earlier token, in every layer, so it does not have to compute them again for the next one. That store is the KV cache. It is the part of GPU memory rules of thumb leave out, and at long context or with many users it outgrows the model's weights.</p>
<h2>The formula</h2>
<p>For each token, every layer stores one key vector and one value vector per key-value head:</p>
<pre><code>KV bytes per token = 2 × layers × key-value heads × head dimension × bytes per value
KV cache           = KV bytes per token × context length × concurrent sequences</code></pre>
<p>The 2 counts the key and the value. A value takes 2 bytes at FP16 or BF16 and 1 byte at FP8. Layers, key-value heads and head dimension are fixed by the architecture — <code>num_hidden_layers</code>, <code>num_key_value_heads</code> and <code>head_dim</code> in the model's config.json — which is why two models of the same size can need very different caches. Models with multi-head latent attention replace the middle of the formula; see ${v.attention}.</p>
<h2>A worked example: ${v.ex}</h2>
<p>${v.exLink} has ${v.layers} layers, ${v.kvHeads} key-value heads and a head dimension of ${v.headDim}. At FP16 that is 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} bytes, or ${v.perTok}, per token. One user at 8k tokens needs ${v.kv8k} of cache; at its full ${v.exMax}-token context, ${v.kvMax} — ${v.kvOverWeights ? `more than its ${v.weights} of BF16 weights` : `against ${v.weights} of BF16 weights`}.</p>
<p>Parameter count is not what decides it. ${v.peerLink} and ${v.exLink} are close in size — ${v.peerParams} and ${v.exParams} parameters — but ${v.ex} stores ${v.perTok} per token and ${v.peer} ${v.peerTok}, a ${v.ratio} difference that comes from layers and key-value heads.</p>
<h2>Per-token cache in popular models</h2>
${v.table}
<p class="note">FP16, one sequence. —: beyond the model's maximum context. DeepSeek V3 caches a compressed latent rather than per-head keys and values. Gemma 2 and gpt-oss are left out of this table: their sliding-window layers stop growing at the window, so their cost per token falls as the context grows. The calculator counts that layer by layer.</p>
<h2>Concurrency multiplies it</h2>
<p>Every concurrent sequence holds a cache of its own. On one ${v.h100}, with ${v.h100Usable} usable, ${v.ex} at BF16 leaves room for ${v.users[0]} users at 8k tokens each, ${v.users[1]} at 32k and ${v.users[2]} at 128k. The weights set the floor; the cache decides how many people fit above it.</p>
<h2>What shrinks it, and what does not</h2>
<ul class="plain">
<li><strong>Fewer key-value heads.</strong> Grouped-query and multi-query attention share key-value heads across query heads, and multi-head latent attention caches a compressed latent. This comes with the model you choose.</li>
<li><strong>An FP8 KV cache.</strong> One byte per value instead of two halves the cache. vLLM offers it as <code>--kv-cache-dtype fp8</code>; it can cost accuracy on long-context work, so validate it first.</li>
<li><strong>A lower context limit.</strong> The cache grows with every token a sequence holds, so capping sequence length — <code>--max-model-len</code> in vLLM — caps the worst case.</li>
<li><strong>Not weight quantization.</strong> INT4 or FP8 weights shrink the weights only; the cache keeps its own precision, so the saving narrows as context grows. See ${v.quant}.</li>
<li><strong>Paged attention and prefix caching</strong> use the cache better rather than making it smaller: memory is handed out in blocks as sequences grow instead of being reserved up front, and requests with the same prefix can share its blocks. LLMScale does not model that efficiency, so its figures are the full need.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Size the KV cache for your model</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Quantization and VRAM</a></li>
  <li><a href="${v.modelsHref}">VRAM by model</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Model",
      thQueryHeads: "Query heads",
      thKvHeads: "KV heads",
      thAttention: "Attention",
      thPerToken: "Per token",
      thVsMha: "vs MHA",
      kvLink: "KV cache size",
      text: (v) => ({
        title: "GQA, MQA and MLA: Attention and KV Cache Size",
        description: `How multi-head, multi-query, grouped-query and multi-head latent attention change an LLM's KV cache, with ${v.gqaName} and ${v.mlaName} worked through and ${v.models} models side by side.`,
        h1: "GQA, MQA and MLA: how attention decides the KV cache",
        crumb: "GQA, MQA and MLA",
        summary:
          "Four ways to arrange attention heads, why they change the cache by an order of magnitude, and how DeepSeek's latent attention takes the head count out of the formula.",
        body: `<p class="lede">Attention is where the KV cache comes from, and the way a model arranges its attention heads can change the cache by an order of magnitude at the same parameter count. Four arrangements cover today's open models.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Every query head has key and value heads of its own, and the cache stores all of them: 2 × layers × heads × head dimension × bytes per token. It is the original Transformer design and the most expensive to cache. ${v.mha} still uses it — ${v.mhaHeads} heads over ${v.mhaLayers} layers, ${v.mhaTok} per token.</p>
<h2>Multi-query attention (MQA)</h2>
<p>All query heads share a single key head and a single value head (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). The cache shrinks by the full number of heads — the largest saving there is — but sharing one set of keys and values across every head can cost quality.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Query heads are split into groups, and each group shares one key-value head: more than one, fewer than the number of query heads. Ainslie et al. (2023) proposed it as the middle ground — quality close to multi-head attention, speed close to multi-query — and ${v.gqaCount} of the ${v.bundled} models LLMScale bundles use it. ${v.gqa} groups ${v.gqaHeads} query heads onto ${v.gqaKvHeads} key-value heads, so it caches ${v.gqaTok} per token where multi-head attention would need ${v.gqaMhaTok}: ${v.gqaRatio} less.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 took another route. Instead of keys and values per head, each layer caches one compressed latent vector per token, plus a small decoupled key that carries the rotary position encoding. The cache per token becomes <code>layers × (kv_lora_rank + qk_rope_head_dim) × bytes</code>, and the head count drops out. For its own dimensions, the DeepSeek-V2 paper (§2.1.3) puts that at the size of GQA with only 2.25 groups.</p>
<p>${v.mla} caches ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} values per layer across ${v.mlaLayers} layers: ${v.mlaTok} per token, ${v.mlaRatio} less than the per-head formula gives. At 8k context that is ${v.mla8k} instead of ${v.perHead8k}. A calculator that applies the per-head formula to DeepSeek models overstates the cache by that factor; LLMScale switches formulas whenever a config carries both fields.</p>
<h2>Side by side</h2>
${v.table}
<p class="note">FP16. “vs MHA”: how many times more a multi-head version of the same model would cache.</p>
<h2>What it means when you choose a model</h2>
<ul class="plain">
<li><strong>Check the key-value heads before the parameter count.</strong> ${v.small} and ${v.big} differ by ${v.pct}% in parameters and by ${v.sizeRatio} in cache per token.</li>
<li><strong>The attention layout comes with the model.</strong> To shrink a served model's cache you have an FP8 KV cache, a shorter context or fewer sequences — see ${v.kv}.</li>
<li><strong>Tensor parallelism splits key-value heads across GPUs,</strong> so the calculator suggests GPU counts that divide them evenly.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">See a model's attention layout</a></li>
  <li><a href="${v.kvHref}">KV cache size</a></li>
  <li><a href="${v.quantHref}">Quantization and VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Precision",
      thBytes: "Bytes / parameter",
      kvLink: "KV cache size",
      text: (v) => ({
        title: "LLM Quantization and VRAM: BF16, FP8, INT4",
        description:
          "How much GPU memory BF16, FP8, INT8 and INT4 weights take for 8B to 405B models, what AWQ, GPTQ, GGUF, MXFP4 and NF4 are, and why quantizing weights leaves the KV cache as it is.",
        h1: "Quantization and VRAM: BF16, FP8, INT8 and INT4",
        crumb: "Quantization",
        summary: "Bytes per parameter from FP32 to INT4, the formats you will meet, why 4-bit is not exactly half a byte, and why it leaves the KV cache alone.",
        body: `<p class="lede">Quantization stores a model's weights in fewer bits. Weights are usually the largest part of GPU memory, so it is the first lever people reach for — but it shrinks only the weights, and every step down trades some accuracy.</p>
<h2>Bytes per parameter</h2>
<p>Weights take <code>parameters × bytes per parameter</code>. BF16 and FP16 are the reference — most models are released in one of them — and every other precision is a multiple of it.</p>
${v.table}
<p class="note">Weights only, before the KV cache and overhead. At FP8, INT8 and INT4 the embedding and the output layer stay at 16 bits.</p>
<h2>The formats you will meet</h2>
<ul class="plain">
<li><strong>BF16 and FP16</strong> — 16-bit floating point. BF16 keeps FP32's range with less precision, which is why training and most released checkpoints use it.</li>
<li><strong>FP8</strong> — 8-bit floating point, one byte per weight, supported in hardware by recent NVIDIA GPUs (Ada Lovelace, Hopper and later). Some models ship FP8 checkpoints.</li>
<li><strong>INT8</strong> — 8-bit integers with scaling factors, one byte per weight.</li>
<li><strong>AWQ and GPTQ</strong> — 4-bit, weight-only methods: weights are stored in 4 bits and computed at 16. They ship as safetensors and aim at GPU serving engines such as vLLM.</li>
<li><strong>GGUF</strong> — llama.cpp's file format, with quantization levels named by bits (Q4, Q5, Q8…), used on CPUs, Apple Silicon and consumer GPUs.</li>
<li><strong>NVFP4 and MXFP4</strong> — 4-bit floating-point formats with shared scales. gpt-oss ships its expert weights in MXFP4, which is how ${v.oss} fits on a single 80 GB GPU: ${v.ossNeed} at 8k context for one user, against ${v.h100Usable} usable on an ${v.h100}.</li>
<li><strong>NF4</strong> — QLoRA's 4-bit NormalFloat, for fine-tuning adapters on a frozen, quantized base model.</li>
</ul>
<h2>Why 4-bit is not exactly half a byte</h2>
<p>Real 4-bit formats also store their scaling factors — a 16-bit scale for every group of 128 weights in AWQ and GPTQ, an 8-bit scale for every block of 32 in MXFP4 — which comes to about 4.25 bits a weight, and they keep the embedding and the output layer at 16 bits. LLMScale counts both, so its 4-bit figure comes out well above half of BF16: Qwen2.5-7B lands within 2% of Qwen's own AWQ checkpoint, and Qwen3-8B at FP8 matches RedHat's FP8 checkpoint to the hundredth of a GiB. A checkpoint that already ships quantized is sized by its own files. QLoRA's NF4 with double quantization measures 4.127 bits, or 0.516 bytes, per parameter, and that is the figure the fine-tuning calculator uses.</p>
<h2>It does not shrink the KV cache</h2>
<p>The KV cache has a precision of its own, set by the serving engine rather than by the weights' format. Take ${v.long} with one user at 128k context: its weights take ${v.longBf16} at BF16 and ${v.longInt4} at INT4, while the KV cache stays at ${v.longKv} in FP16${v.kvOverInt4 ? " — more than the INT4 weights" : ""}. Storing the cache in FP8 is a separate choice that halves it; see ${v.kv}.</p>
<h2>Mixture-of-Experts models</h2>
<p>Every expert is quantized, and every expert still has to be in memory. ${v.moe} holds ${v.moeParams} parameters: ${v.moeBf16} of weights at BF16, ${v.moeInt4} at INT4. Its ${v.moeActive} active parameters decide how much work each token does, not how much memory the model takes.</p>
<h2>Choosing a precision</h2>
<ul class="plain">
<li><strong>Start from what fits.</strong> When a model outgrows a card, the calculator names the first lighter precision that fits it.</li>
<li><strong>Measure the cost.</strong> Each step down trades accuracy for memory, and how much depends on the model and the method; test on your own task before serving.</li>
<li><strong>Let a pre-quantized checkpoint speak for itself.</strong> LLMScale reads its precision from <code>quantization_config</code>, the repository name or the safetensors header, and vLLM loads AWQ, GPTQ and FP8 checkpoints without a <code>--quantization</code> flag.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Compare precisions for your model</a></li>
  <li><a href="${v.kvHref}">KV cache size</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA and MLA</a></li>
  <li><a href="${v.gpusHref}">Which LLMs fit on which GPU</a></li>
</ul>`,
      }),
    },
  },
};

export default en;

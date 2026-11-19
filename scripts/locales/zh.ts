// 简体中文: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const zh: PageText = {
  section: { models: "模型", gpus: "GPU", concepts: "概念", feed: "动态", crumbs: "面包屑导航" },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `它使用多头潜在注意力（MLA）：每一层为每个 token 缓存一个 ${dims} 维的压缩潜在向量，而不是为每个头分别缓存键和值，因此它的 KV 缓存比常规公式算出的小 ${ratio}。`,
      mqa: ({ heads }) =>
        `它使用多查询注意力：全部 ${heads} 个查询头共享一个键值头，因此它的 KV 缓存比完整的多头注意力所需的小 ${heads} 倍。`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `它使用分组查询注意力：${heads} 个查询头共享 ${kvHeads} 个键值头，因此它的 KV 缓存比完整的多头注意力所需的小 ${ratio}。`,
      mha: ({ heads }) =>
        `它使用完整的多头注意力：${heads} 个头各自保存自己的键和值，因此 KV 缓存有多大，完全取决于头数。`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} 有 ${params} 参数，分布在 ${layers} 层中。`,
      moe: ({ active, total }) =>
        `它是混合专家模型，在 ${total} 参数中，每个 token 的活跃参数约为 ${active}：显存必须容纳全部参数，而每个 token 只经过活跃的那一部分。`,
      context: ({ max, kv }) => `它最多支持 ${max} token 的上下文；在这一长度下，单个用户除权重外还需要 ${kv} 的 FP16 KV 缓存。`,
      gated: "它在 Hugging Face 上的仓库是受控仓库，因此 LLMScale 在内置数据库中附带了它的架构。",
    },
    title: (name) => `${name} 显存需求`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} 在 ${ctx} 上下文、单用户下，BF16 需要 ${bf16} 显存，INT4 需要 ${int4}。按精度和上下文列出显存，并给出能容纳它的 GPU、并发用户数和微调显存。`,
    h1: (name) => `${name} 需要多少显存？`,
    oneUser: "单用户",
    ctx: (k) => `${k} 上下文`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `权重 ${weights}，KV 缓存 ${kv}，vLLM 开销 ${overhead}。同样的工作负载在 INT4 下需要 ${int4}。`,
    specLayers: "层",
    specMaxContext: "最大上下文",
    specHeads: "头",
    h2Memory: (name) => `${name} 在不同精度和上下文下的显存`,
    thPrecision: "精度",
    kvCache: "KV 缓存",
    tableNote:
      "单用户、FP16 KV 缓存，加上 vLLM 在单个 GPU 上的开销（按 vLLM 对 70 GB 以下显卡的默认设置）。量化缩小的是权重而不是 KV 缓存，因此上下文越长，节省的比例越小。",
    h2Holds: "哪些单个 GPU 能容纳它",
    noSingleGpu: (counts) => `没有单个 GPU 能容纳它——按计算器的排布，服务它所需的最少数量：${counts}。`,
    fitNote: (ctx) =>
      `按 ${ctx} 上下文、单用户计算，从最小的 GPU 开始排列。独立显卡按 vLLM 默认的 92% 显存计算，统一内存设备按其 GPU 可寻址的份额计算，且每种设备都按各自的默认设置计入 vLLM 开销。`,
    h2Users: "能容纳多少用户",
    doesNotFit: "放不下",
    usersNote: (ctx) => `每个用户 ${ctx} 上下文，单个 GPU。✗：除去权重后，连一个用户的空间都不够。`,
    noCard: "这里没有任何单个 GPU 能在任一精度下容纳它；要服务它，就得用张量并行把它拆分到多个 GPU 上。",
    h2FineTune: (name) => `微调 ${name}`,
    thMethod: "方法",
    thMemory: "显存",
    thSmallestGpu: "最小 GPU",
    modes: { full: "完全微调", lora: "LoRA（秩 16，注意力）", qlora: "QLoRA（秩 16，注意力）" },
    sharded: "多个 GPU（分片）",
    trainNote:
      "序列长度 2,048，批次大小 1，开启梯度检查点，Adam。完全微调每个参数占 16 字节（不含激活值）；QLoRA 以 4 位 NF4 存储冻结的基础模型。",
    h2Source: "这些数字从何而来",
    kvFormula: {
      mla: "使用 MLA 时，KV 缓存为 <code>层数 × (kv_lora_rank + qk_rope_head_dim) × 字节数 × 上下文 × 用户数</code>。",
      heads: "KV 缓存为 <code>2 × 层数 × 键值头数 × head dimension × 字节数 × 上下文 × 用户数</code>。",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      `它的 ${layers} 层中有 ${sliding} 层在最近 ${window} 个 token 的滑动窗口内计算注意力，缓存也不超过这个长度；因此超出窗口后，每多一个 token 增加 ${pastWindow} KiB，即其余 ${fullLayers} 层的份额。`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `权重为 <code>参数量 × 每参数字节数</code>。${kvFormula}对 ${name} 而言，FP16 下每个 token 为 ${kib} KiB。${windowNote}这些是用于容量规划的数字：推理引擎（vLLM、TGI、llama.cpp）及其分页注意力的效率仍会影响实际数值。`,
    more: ({ kvCache, attention }) => `延伸阅读：<a href="${kvCache}">KV 缓存大小</a>，以及 <a href="${attention}">GQA、MQA 和 MLA</a>。`,
    h2Work: (name) => `${name} 相关工具`,
    links: {
      size: "按你的工作负载估算",
      train: "微调显存",
      vllm: "vLLM 参数",
      anatomy: "模型剖析",
      config: "解读它的 config.json",
      serving: "它的文件对推理服务说明了什么",
    },
    h2Family: (family) => `其他 ${family} 模型`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} 的 ${total} GB 内存由 CPU 和 GPU 共享；默认情况下 GPU 约可寻址其中 ${vram} GB，LLMScale 为模型分配 ${usable}${apple ? "" : "，即 GPU 报告容量的 92%（vLLM 默认值）"}。`,
      discrete: ({ name, vram, usable }) =>
        `${name} 有 ${vram} GB 显存。LLMScale 为模型分配其中的 ${usable}：即显卡报告容量的 0.92（vLLM 默认的 --gpu-memory-utilization），其余留给 CUDA 上下文。`,
      bandwidth: (bw) => `它的显存带宽为 ${bw} GB/s；模型放得下之后，限制生成速度的就是它。`,
      apple: "vLLM 没有 Metal 后端，因此在它上面要用 llama.cpp 或 MLX 运行模型。",
      counts: ({ models, bf16, fp8, int4 }) =>
        `在下方 ${models} 个热门开放模型中，按 8k 上下文、单用户计算，BF16 下有 ${bf16} 个放得下，FP8 下有 ${fp8} 个，INT4 下有 ${int4} 个。`,
    },
    title: (name) => `${name} 放得下哪些 LLM？`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `${name}（可用 ${usable}）放得下哪些开放 LLM：${models} 个热门模型中，INT4 下 ${int4} 个、BF16 下 ${bf16} 个放得下，并给出每个模型的并发用户数和最大上下文。`,
    h1: (name) => `${name} 放得下哪些 LLM？`,
    doesNotFit: "（放不下）",
    thModel: "模型",
    thUsers: "用户数",
    thMaxContext: "最大上下文",
    tableNote:
      "显存按 8k 上下文、单用户计算（若模型的最大上下文更短，则按其最大值），含 FP16 KV 缓存和按此 GPU 默认设置计算的 vLLM 开销。用户数（每人 8k）和最大上下文均针对放得下的最高精度。",
    usableMemory: "可用显存",
    answer: ({ models, bf16, int4 }) => `${models} 个模型中，INT4 下 ${int4} 个放得下，BF16 下 ${bf16} 个。`,
    h2Fit: (name) => `${name} 放得下哪些 LLM`,
    quantization: (href) => `BF16、FP8 和 INT4 对显存意味着什么：<a href="${href}">量化与显存</a>。`,
    parallel:
      "单个 GPU 放不下的模型，仍可在多个 GPU 上运行：张量并行会把它的权重和 KV 缓存拆分到这些 GPU 上。需要几个，由计算器算出。",
    h2Size: (name) => `在 ${name} 上估算模型`,
    open: "用这款 GPU 打开计算器",
    h2Others: "其他 GPU",
  },

  hubs: {
    models: {
      title: "按模型查看 LLM 显存需求",
      description: (models) =>
        `${models} 个热门开放 LLM（Llama、Qwen、Mistral、Gemma、gpt-oss、DeepSeek）在 BF16 和 INT4 下的显存需求，并附上每个模型放得下的 GPU 和微调显存。`,
      h1: "按模型查看 LLM 显存需求",
      lede: (models) =>
        `${models} 个热门开放模型各需要多少显存，均根据每个模型自身的架构计算：8k 上下文、单用户下 BF16 和 INT4 的权重、KV 缓存和开销。每个页面按精度和上下文细分，列出能容纳它的 GPU 和可容纳的用户数，并给出微调显存。`,
      active: "活跃",
      thModel: "模型",
      thParams: "参数",
      thMaxContext: "最大上下文",
      note: "单用户、FP16 KV 缓存，以及 vLLM 在单个 GPU 上的开销；最大上下文更短的模型按其最大值显示。",
      links: { size: "估算任意 Hugging Face 模型", byGpu: "哪款 GPU 放得下哪些 LLM", memory: "LLM 显存原理" },
    },
    gpus: {
      title: "哪款 GPU 放得下哪些 LLM？",
      description:
        "RTX 4090、RTX 5090、H100、H200、B200、Apple M 系列、Strix Halo 和 DGX Spark 分别放得下哪些热门开放 LLM——涵盖 BF16、FP8 和 INT4，并给出用户数和最大上下文。",
      h1: "哪款 GPU 放得下哪些 LLM",
      lede: ({ models, gpus }) =>
        `${models} 个热门开放 LLM 中，哪些能放进人们常用来运行它们的 ${gpus} 款 GPU：消费级和工作站显卡、数据中心 GPU、Apple Silicon，以及统一内存的 AI PC。每个页面列出所有模型在 BF16、FP8 和 INT4 下的显存、可容纳的用户数，以及能容纳的最长上下文。`,
      thType: "类型",
      thUsable: "可用",
      thBf16: "BF16 模型数",
      thInt4: "INT4 模型数",
      note: (models) =>
        `共 ${models} 个模型，按 8k 上下文、单用户计算。独立显卡按 vLLM 默认的 92% 显存计算，统一内存设备按其 GPU 可寻址的份额计算，且都按各自的默认设置计入 vLLM 开销。`,
      links: { size: "在任意 GPU 上估算模型", byModel: "按模型查看显存需求", memory: "LLM 显存原理" },
    },
    concepts: {
      title: "LLM 显存原理：KV 缓存、GQA、量化",
      description:
        "决定 LLM 需要多少显存的几个概念——KV 缓存、分组查询注意力与潜在注意力、量化——用真实模型和计算所得的数字讲解。",
      h1: "LLM 显存原理",
      lede: "三篇指南，讲解决定语言模型需要多少显存的几个概念。每篇都用真实模型逐步推算，其中每个数字都由与计算器相同的引擎算出。",
      links: { calculator: "打开计算器", byModel: "按模型查看显存需求", byGpu: "哪款 GPU 放得下哪些 LLM" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "模型",
      thLayers: "层数",
      thShape: "KV 头 × head dim",
      thPerToken: "每 token",
      attentionLink: "GQA、MQA 和 MLA",
      quantLink: "量化与显存",
      text: (v) => ({
        title: "KV 缓存大小：公式与示例",
        description: `LLM 的 KV 缓存会有多大：公式、以 ${v.ex} 为例的完整推算、热门模型的每 token 数值，以及并发、FP8 和分组查询注意力对它的影响。`,
        h1: "KV 缓存大小：公式与真实模型",
        crumb: "KV 缓存",
        summary: "公式、完整推算示例、热门模型的每 token 数值，以及为什么并发会成倍放大它，而权重量化却不影响它。",
        body: `<p class="lede">语言模型生成文本时，会在每一层保存它为之前每个 token 计算出的键和值，这样生成下一个 token 时就不必重新计算。这块存储就是 KV 缓存。它是估算显存的经验法则所忽略的部分，而在长上下文或多用户时，它会超过模型权重本身。</p>
<h2>公式</h2>
<p>对每个 token，每一层为每个键值头存储一个键向量和一个值向量：</p>
<pre><code>每 token 的 KV 字节数 = 2 × 层数 × 键值头数 × head dimension × 每个值的字节数
KV 缓存               = 每 token 的 KV 字节数 × 上下文长度 × 并发序列数</code></pre>
<p>其中的 2 对应键和值。一个值在 FP16 或 BF16 下占 2 字节，在 FP8 下占 1 字节。层数、键值头数和 head dimension 由架构决定（即模型 config.json 中的 <code>num_hidden_layers</code>、<code>num_key_value_heads</code> 和 <code>head_dim</code>），这就是为什么同样大小的两个模型所需的缓存可能相差很大。采用多头潜在注意力的模型会替换公式的中间部分，参见 ${v.attention}。</p>
<h2>完整推算示例：${v.ex}</h2>
<p>${v.exLink} 有 ${v.layers} 层、${v.kvHeads} 个键值头，head dimension 为 ${v.headDim}。在 FP16 下，每个 token 为 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} 字节，即 ${v.perTok}。单个用户在 8k token 时需要 ${v.kv8k} 缓存；在其完整的 ${v.exMax} token 上下文下需要 ${v.kvMax}——${v.kvOverWeights ? `超过它 ${v.weights} 的 BF16 权重` : `而它的 BF16 权重为 ${v.weights}`}。</p>
<p>决定它的不是参数量。${v.peerLink} 和 ${v.exLink} 的规模相近（分别为 ${v.peerParams} 和 ${v.exParams} 参数），但 ${v.ex} 每个 token 存储 ${v.perTok}，${v.peer} 则为 ${v.peerTok}，相差 ${v.ratio}，差异来自层数和键值头数。</p>
<h2>热门模型的每 token 缓存</h2>
${v.table}
<p class="note">FP16，单个序列。—：超出模型的最大上下文。DeepSeek V3 缓存的是压缩后的潜在向量，而不是每个头的键和值。本表未列入 Gemma 2 和 gpt-oss：它们的滑动窗口层增长到窗口大小就不再增长，因此上下文越长，它们每 token 的成本越低。计算器会逐层计算这一点。</p>
<h2>并发让它成倍增长</h2>
<p>每个并发序列都有自己的缓存。在一块 ${v.h100}（可用 ${v.h100Usable}）上，BF16 精度的 ${v.ex} 可容纳 ${v.users[0]} 个每人 8k token 的用户，32k 时为 ${v.users[1]} 个，128k 时为 ${v.users[2]} 个。权重决定了下限；在此之上能容纳多少人，由缓存决定。</p>
<h2>什么能缩小它，什么不能</h2>
<ul class="plain">
<li><strong>更少的键值头。</strong>分组查询注意力和多查询注意力让多个查询头共享键值头，多头潜在注意力则缓存压缩后的潜在向量。这是你所选模型自带的特性。</li>
<li><strong>FP8 KV 缓存。</strong>每个值用一个字节而不是两个，缓存减半。vLLM 通过 <code>--kv-cache-dtype fp8</code> 提供此选项；在长上下文任务上可能损失准确性，请先验证。</li>
<li><strong>更低的上下文上限。</strong>序列每多一个 token，缓存就随之增长，因此限制序列长度（vLLM 中为 <code>--max-model-len</code>）就限制了最坏情况。</li>
<li><strong>权重量化不能。</strong>INT4 或 FP8 权重只缩小权重；缓存保持自己的精度，因此上下文越长，节省的比例越小。参见 ${v.quant}。</li>
<li><strong>分页注意力和 prefix caching</strong> 是更好地利用缓存，而不是让它变小：显存随序列增长按块分配，而不是预先整块预留；前缀相同的请求可以共享这些块。LLMScale 不模拟这部分效率，因此它给出的数字是完整需求。</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">为你的模型估算 KV 缓存</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">量化与显存</a></li>
  <li><a href="${v.modelsHref}">按模型查看显存</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "模型",
      thQueryHeads: "查询头",
      thKvHeads: "KV 头",
      thAttention: "注意力",
      thPerToken: "每 token",
      thVsMha: "相对 MHA",
      kvLink: "KV 缓存大小",
      text: (v) => ({
        title: "GQA/MQA/MLA 与 KV 缓存大小",
        description: `多头注意力、多查询注意力、分组查询注意力和多头潜在注意力如何改变 LLM 的 KV 缓存：以 ${v.gqaName} 和 ${v.mlaName} 逐步推算，并并排对比 ${v.models} 个模型。`,
        h1: "GQA、MQA 和 MLA：注意力如何决定 KV 缓存",
        crumb: "GQA、MQA 和 MLA",
        summary:
          "注意力头的四种排布方式，它们为何能让缓存相差一个数量级，以及 DeepSeek 的潜在注意力如何把头数从公式中去掉。",
        body: `<p class="lede">KV 缓存来自注意力，而模型排布注意力头的方式，能让同等参数量下的缓存相差一个数量级。如今的开放模型可以归为四种排布。</p>
<h2>多头注意力（MHA）</h2>
<p>每个查询头都有自己的键头和值头，缓存要全部存下：每 token 为 2 × 层数 × 头数 × head dimension × 字节数。这是 Transformer 最初的设计，缓存代价也最高。${v.mha} 仍在使用它：${v.mhaHeads} 个头、${v.mhaLayers} 层，每 token ${v.mhaTok}。</p>
<h2>多查询注意力（MQA）</h2>
<p>所有查询头共享一个键头和一个值头（Shazeer，2019，“Fast Transformer Decoding: One Write-Head is All You Need”）。缓存缩小的倍数就是头的总数，这是所能达到的最大节省；但让所有头共用一组键和值可能会损失质量。</p>
<h2>分组查询注意力（GQA）</h2>
<p>查询头被分成若干组，每组共享一个键值头：键值头多于一个，但少于查询头的数量。Ainslie 等人（2023）将其作为折中方案提出：质量接近多头注意力，速度接近多查询注意力。LLMScale 内置的 ${v.bundled} 个模型中有 ${v.gqaCount} 个采用它。${v.gqa} 把 ${v.gqaHeads} 个查询头分组到 ${v.gqaKvHeads} 个键值头上，因此每 token 缓存 ${v.gqaTok}，而多头注意力需要 ${v.gqaMhaTok}：少 ${v.gqaRatio}。</p>
<h2>多头潜在注意力（MLA）</h2>
<p>DeepSeek-V2 走了另一条路。它不再按头缓存键和值，而是让每一层为每个 token 缓存一个压缩后的潜在向量，外加一个携带旋转位置嵌入的小型解耦键。每 token 的缓存变为 <code>层数 × (kv_lora_rank + qk_rope_head_dim) × 字节数</code>，头数从公式中消失。按其自身的维度，DeepSeek-V2 论文（§2.1.3）指出这相当于仅有 2.25 组的 GQA 的大小。</p>
<p>${v.mla} 在 ${v.mlaLayers} 层中，每层缓存 ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} 个值：每 token ${v.mlaTok}，比按头计算的公式少 ${v.mlaRatio}。在 8k 上下文下，这是 ${v.mla8k}，而不是 ${v.perHead8k}。对 DeepSeek 模型套用按头公式的计算器，会把缓存高估这么多倍；只要配置中同时含有这两个字段，LLMScale 就会切换公式。</p>
<h2>并排对比</h2>
${v.table}
<p class="note">FP16。“相对 MHA”：同一模型若采用多头注意力，缓存会是现在的多少倍。</p>
<h2>选择模型时意味着什么</h2>
<ul class="plain">
<li><strong>先看键值头，再看参数量。</strong>${v.small} 和 ${v.big} 的参数量相差 ${v.pct}%，而每 token 缓存相差 ${v.sizeRatio}。</li>
<li><strong>注意力布局随模型而定。</strong>要缩小推理服务中模型的缓存，你能用的是 FP8 KV 缓存、更短的上下文或更少的序列，参见 ${v.kv}。</li>
<li><strong>张量并行会把键值头拆分到多个 GPU 上，</strong>因此计算器会建议能均分键值头的 GPU 数量。</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">查看模型的注意力布局</a></li>
  <li><a href="${v.kvHref}">KV 缓存大小</a></li>
  <li><a href="${v.quantHref}">量化与显存</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "精度",
      thBytes: "每参数字节数",
      kvLink: "KV 缓存大小",
      text: (v) => ({
        title: "量化与显存：BF16、FP8、INT4",
        description:
          "8B 到 405B 模型的 BF16、FP8、INT8 和 INT4 权重各占多少显存，AWQ、GPTQ、GGUF、MXFP4 和 NF4 是什么，以及为什么量化权重不会改变 KV 缓存。",
        h1: "量化与显存：BF16、FP8、INT8 和 INT4",
        crumb: "量化",
        summary: "从 FP32 到 INT4 的每参数字节数、你会遇到的格式、为什么 4 位并不正好是半个字节，以及为什么它不影响 KV 缓存。",
        body: `<p class="lede">量化用更少的位数存储模型权重。权重通常是显存中最大的一块，所以量化往往是人们首先想到的手段；但它只缩小权重，而且每降低一级精度，都要牺牲一些准确性。</p>
<h2>每参数字节数</h2>
<p>权重占用 <code>参数量 × 每参数字节数</code>。BF16 和 FP16 是基准（大多数模型以其中之一发布），其他精度都是它的倍数。</p>
${v.table}
<p class="note">仅含权重，不含 KV 缓存和开销。在 FP8、INT8 和 INT4 下，嵌入层和输出层保持 16 位。</p>
<h2>你会遇到的格式</h2>
<ul class="plain">
<li><strong>BF16 和 FP16</strong>——16 位浮点数。BF16 保留了 FP32 的数值范围，但精度更低，这也是训练和大多数已发布检查点使用它的原因。</li>
<li><strong>FP8</strong>——8 位浮点数，每个权重一个字节，较新的 NVIDIA GPU（Ada Lovelace、Hopper 及更新架构）提供硬件支持。部分模型发布了 FP8 检查点。</li>
<li><strong>INT8</strong>——带缩放因子的 8 位整数，每个权重一个字节。</li>
<li><strong>AWQ 和 GPTQ</strong>——4 位、仅量化权重的方法：权重以 4 位存储，以 16 位计算。它们以 safetensors 格式发布，面向 vLLM 等 GPU 推理引擎。</li>
<li><strong>GGUF</strong>——llama.cpp 的文件格式，量化等级按位数命名（Q4、Q5、Q8……），用于 CPU、Apple Silicon 和消费级 GPU。</li>
<li><strong>NVFP4 和 MXFP4</strong>——共享缩放因子的 4 位浮点格式。gpt-oss 的专家权重以 MXFP4 发布，这正是 ${v.oss} 能放进单个 80 GB GPU 的原因：8k 上下文、单用户时需要 ${v.ossNeed}，而 ${v.h100} 的可用显存为 ${v.h100Usable}。</li>
<li><strong>NF4</strong>——QLoRA 的 4 位 NormalFloat，用于在冻结且已量化的基础模型上微调适配器。</li>
</ul>
<h2>为什么 4 位并不正好是半个字节</h2>
<p>实际的 4 位格式还要存储缩放因子：AWQ 和 GPTQ 中每 128 个权重配一个 16 位缩放因子，MXFP4 中每 32 个权重一块、配一个 8 位缩放因子，折合下来每个权重约 4.25 位；此外，它们还把嵌入层和输出层保持在 16 位。LLMScale 两者都计入，因此它算出的 4 位数值明显高于 BF16 的一半：Qwen2.5-7B 与 Qwen 自己的 AWQ 检查点相差不到 2%，FP8 下的 Qwen3-8B 与 RedHat 的 FP8 检查点精确到百分之一 GiB 都一致。已经以量化形式发布的检查点，按它自己的文件计算大小。QLoRA 的 NF4 加上嵌套量化，实测为每参数 4.127 位，即 0.516 字节，微调计算器用的就是这个数字。</p>
<h2>它不会缩小 KV 缓存</h2>
<p>KV 缓存有自己的精度，由推理引擎而不是权重格式决定。以 ${v.long} 为例，单用户、128k 上下文：其权重在 BF16 下占 ${v.longBf16}，在 INT4 下占 ${v.longInt4}，而 KV 缓存在 FP16 下仍为 ${v.longKv}${v.kvOverInt4 ? "，超过了 INT4 权重" : ""}。把缓存存为 FP8 是另一项独立的选择，可使其减半；参见 ${v.kv}。</p>
<h2>混合专家模型</h2>
<p>每个专家都会被量化，但每个专家仍然必须放在显存中。${v.moe} 共有 ${v.moeParams} 参数：BF16 下权重为 ${v.moeBf16}，INT4 下为 ${v.moeInt4}。它的 ${v.moeActive} 活跃参数决定的是每个 token 的计算量，而不是模型占用多少显存。</p>
<h2>如何选择精度</h2>
<ul class="plain">
<li><strong>从放得下的开始。</strong>当模型超出某个 GPU 的容量时，计算器会给出第一个能放下的更低精度。</li>
<li><strong>衡量代价。</strong>每降低一级精度，都是用准确性换显存，代价多大取决于模型和方法；部署服务前，先在你自己的任务上测试。</li>
<li><strong>预量化检查点，以它自己的信息为准。</strong>LLMScale 从 <code>quantization_config</code>、仓库名或 safetensors 文件头读取其精度；vLLM 加载 AWQ、GPTQ 和 FP8 检查点时也不需要 <code>--quantization</code> 参数。</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">为你的模型对比各精度</a></li>
  <li><a href="${v.kvHref}">KV 缓存大小</a></li>
  <li><a href="${v.attentionHref}">GQA、MQA 和 MLA</a></li>
  <li><a href="${v.gpusHref}">哪款 GPU 放得下哪些 LLM</a></li>
</ul>`,
      }),
    },
  },
};

export default zh;

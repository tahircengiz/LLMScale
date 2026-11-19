// 日本語: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const ja: PageText = {
  section: { models: "モデル", gpus: "GPU", concepts: "概念", feed: "ニュース", crumbs: "パンくずリスト" },
  join: { sentence: "", list: "、", colon: "：" },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Multi-head Latent Attention（MLA）を採用しています。各層はヘッドごとにキーと値を保持する代わりに、トークンごとに圧縮した ${dims} 次元の潜在ベクトルを 1 つだけキャッシュするため、KV キャッシュは通常の式で求めた値より ${ratio} 小さくなります。`,
      mqa: ({ heads }) =>
        `マルチクエリ アテンションを採用しています。${heads} 個のクエリ ヘッドすべてが 1 つのキー/値ヘッドを共有するため、KV キャッシュは通常のマルチヘッド アテンションに比べて ${heads}× 小さくなります。`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `グループ クエリ アテンションを採用しています。${heads} 個のクエリ ヘッドが ${kvHeads} 個のキー/値ヘッドを共有するため、KV キャッシュは通常のマルチヘッド アテンションに比べて ${ratio} 小さくなります。`,
      mha: ({ heads }) =>
        `通常のマルチヘッド アテンションを採用しています。${heads} 個のヘッドがそれぞれ独自のキーと値を保持するため、KV キャッシュはヘッド数の分だけ大きくなります。`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} のパラメータ数は ${params}、層数は ${layers} です。`,
      moe: ({ active, total }) =>
        `Mixture of Experts（MoE）モデルで、${total} のパラメータのうちトークンごとにアクティブになるのは約 ${active} です。メモリにはすべてのパラメータを保持する必要がありますが、各トークンが通るのはアクティブな部分だけです。`,
      context: ({ max, kv }) => `コンテキスト長は最大 ${max} トークンです。その長さでは 1 ユーザーあたり、重みとは別に FP16 で ${kv} の KV キャッシュが必要です。`,
      gated: "Hugging Face 上のリポジトリはゲート付きのため、LLMScale はこのモデルのアーキテクチャを同梱のデータベースに収録しています。",
    },
    title: (name) => `${name} に必要な VRAM`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} に必要な GPU メモリは、${ctx} コンテキスト・1 ユーザーで BF16 なら ${bf16}、INT4 なら ${int4} です。精度・コンテキスト別のメモリ、収まる GPU、同時ユーザー数、ファインチューニング時のメモリも掲載しています。`,
    h1: (name) => `${name} に必要な VRAM はどれくらい？`,
    oneUser: "1 ユーザー",
    ctx: (k) => `${k} コンテキスト`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `内訳は重み ${weights}、KV キャッシュ ${kv}、vLLM のオーバーヘッド ${overhead} です。INT4 では同じワークロードに ${int4} が必要です。`,
    specLayers: (n) => `${n} 層`,
    specMaxContext: (k) => `最大コンテキスト ${k}`,
    specHeads: ({ heads, kvHeads }) => `${heads}/${kvHeads} ヘッド`,
    h2Memory: (name) => `${name} の必要メモリ（精度・コンテキスト別）`,
    thPrecision: "精度",
    kvCache: "KV キャッシュ",
    tableNote:
      "1 ユーザー・FP16 の KV キャッシュで、GPU 1 基での vLLM のオーバーヘッド（70 GB 未満の GPU 向けのデフォルト設定）を含めた値です。量子化で小さくなるのは重みだけで KV キャッシュは変わらないため、コンテキストが長くなるほど削減効果は小さくなります。",
    h2Holds: "1 基で収まる GPU",
    noSingleGpu: (counts) => `1 基で収まる GPU はありません。計算ツールが示す、提供に必要な最小構成：${counts}。`,
    fitNote: (ctx) =>
      `${ctx} コンテキスト・1 ユーザーの場合で、メモリの小さい GPU から順に並べています。ディスクリート GPU はメモリの 92%（vLLM のデフォルト）、統合メモリのデバイスは GPU が利用できる分を使用可能とし、それぞれのデフォルト設定での vLLM のオーバーヘッドを加えています。`,
    h2Users: "収まるユーザー数",
    doesNotFit: "収まらない",
    usersNote: (ctx) => `GPU 1 基で、各ユーザー ${ctx} コンテキストの場合のユーザー数です。✗：重みだけで埋まり、1 ユーザー分の余地もありません。`,
    noCard: "ここに挙げた GPU は、どの精度でも 1 基では収まりません。提供するには、テンソル並列で複数の GPU に分割する必要があります。",
    h2FineTune: (name) => `${name} のファインチューニング`,
    thMethod: "手法",
    thMemory: "メモリ",
    thSmallestGpu: "最小の GPU",
    modes: { full: "フル ファインチューニング", lora: "LoRA（ランク 16、アテンション）", qlora: "QLoRA（ランク 16、アテンション）" },
    sharded: "複数 GPU（シャーディング）",
    trainNote:
      "シーケンス長 2,048、バッチサイズ 1、gradient checkpointing 有効、Adam。フル ファインチューニングでは、アクティベーションを除いてパラメータあたり 16 バイトを保持します。QLoRA は凍結したベースモデルを 4 ビットの NF4 で格納します。",
    h2Source: "数値の根拠",
    kvFormula: {
      mla: "MLA の場合、KV キャッシュは <code>層数 × (kv_lora_rank + qk_rope_head_dim) × バイト数 × コンテキスト長 × ユーザー数</code> です。",
      heads: "KV キャッシュは <code>2 × 層数 × キー/値ヘッド数 × ヘッド ディメンション × バイト数 × コンテキスト長 × ユーザー数</code> です。",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      `${layers} 層のうち ${sliding} 層は直近 ${window} トークンの sliding window にだけアテンションを向け、それ以上は保持しません。そのため、ウィンドウを超えると 1 トークンごとに増えるのは残り ${fullLayers} 層の分、${pastWindow} KiB です。`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `重みは <code>パラメータ数 × パラメータあたりのバイト数</code> です。${kvFormula}${name} の場合、FP16 で 1 トークンあたり ${kib} KiB です。${windowNote}これらは容量計画のための数値です。実際の値は、推論エンジン（vLLM、TGI、llama.cpp）とその PagedAttention の効率によっても変わります。`,
    more: ({ kvCache, attention }) => `詳しくは <a href="${kvCache}">KV キャッシュのサイズ</a>と <a href="${attention}">GQA、MQA、MLA</a> を参照してください。`,
    h2Work: (name) => `${name} の関連ツール`,
    links: {
      size: "ワークロードに合わせて見積もる",
      train: "ファインチューニング時のメモリ",
      vllm: "vLLM パラメータ",
      anatomy: "モデルの構造",
      config: "config.json の解説",
      serving: "ファイルから見るサービングの概要",
    },
    h2Family: (family) => `その他の ${family} モデル`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} は ${total} GB のメモリを CPU と GPU で共有しています。デフォルトで GPU が利用できるのはそのうち約 ${vram} GB で、LLMScale はモデル用に ${usable}${apple ? " " : "（GPU が報告する容量の 92%、vLLM のデフォルト）"}を割り当てます。`,
      discrete: ({ name, vram, usable }) =>
        `${name} のメモリは ${vram} GB です。LLMScale はそのうち ${usable} をモデル用に割り当てます。これは GPU が報告する容量に vLLM のデフォルトの --gpu-memory-utilization 0.92 を掛けた値で、残りは CUDA コンテキスト用に確保されます。`,
      bandwidth: (bw) => `メモリ帯域幅は ${bw} GB/s で、モデルが収まった後は、これが生成速度の上限を決めます。`,
      apple: "vLLM には Metal バックエンドがないため、このデバイスでは llama.cpp か MLX でモデルを実行します。",
      counts: ({ models, bf16, fp8, int4 }) =>
        `下に挙げた主要なオープンモデル ${models} 個のうち、8k コンテキスト・1 ユーザーで収まるのは BF16 で ${bf16} 個、FP8 で ${fp8} 個、INT4 で ${int4} 個です。`,
    },
    title: (name) => `${name} に収まる LLM はどれ？`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `${name}（使用可能 ${usable}）に収まるオープン LLM の一覧です。主要な ${models} 個のモデルのうち、INT4 で ${int4} 個、BF16 で ${bf16} 個が収まります。各モデルの同時ユーザー数と最大コンテキストも掲載しています。`,
    h1: (name) => `${name} に収まる LLM はどれ？`,
    doesNotFit: "（収まらない）",
    thModel: "モデル",
    thUsers: "ユーザー数",
    thMaxContext: "最大コンテキスト",
    tableNote:
      "メモリは 8k コンテキスト・1 ユーザー（モデルの最大コンテキストがそれより短い場合はその最大値）、FP16 の KV キャッシュ、この GPU のデフォルト設定での vLLM のオーバーヘッドで計算しています。ユーザー数（各 8k）と最大コンテキストは、収まる中で最も高い精度での値です。",
    usableMemory: "使用可能なメモリ",
    answer: ({ models, bf16, int4 }) => `${models} 個のモデルのうち、INT4 で ${int4} 個、BF16 で ${bf16} 個が収まります。`,
    h2Fit: (name) => `${name} に収まる LLM`,
    quantization: (href) => `BF16、FP8、INT4 がメモリにどう影響するかは <a href="${href}">量子化と VRAM</a> を参照してください。`,
    parallel:
      "GPU 1 基に収まらないモデルも、複数の GPU にまたがって実行できます。テンソル並列は重みと KV キャッシュを GPU 間で分割します。何基必要かは計算ツールで求められます。",
    h2Size: (name) => `${name} でモデルを見積もる`,
    open: "この GPU で計算ツールを開く",
    h2Others: "その他の GPU",
  },

  hubs: {
    models: {
      title: "LLM に必要な VRAM：モデル別一覧",
      description: (models) =>
        `主要なオープン LLM ${models} 個（Llama、Qwen、Mistral、Gemma、gpt-oss、DeepSeek）に必要な GPU メモリを BF16 と INT4 で掲載しています。各モデルが収まる GPU と、ファインチューニング時のメモリも示しています。`,
      h1: "LLM に必要な VRAM：モデル別一覧",
      lede: (models) =>
        `主要なオープンモデル ${models} 個に必要な GPU メモリを、各モデル固有のアーキテクチャから計算しています。対象は 8k コンテキスト・1 ユーザーでの BF16 と INT4 の重み、KV キャッシュ、オーバーヘッドです。各ページでは精度・コンテキスト別の内訳、収まる GPU と収まるユーザー数、ファインチューニング時のメモリを示しています。`,
      active: "アクティブ",
      thModel: "モデル",
      thParams: "パラメータ数",
      thMaxContext: "最大コンテキスト",
      note: "1 ユーザー・FP16 の KV キャッシュで、GPU 1 基での vLLM のオーバーヘッドを含めた値です。最大コンテキストが 8k より短いモデルは、その最大値で示しています。",
      links: { size: "任意の Hugging Face モデルを見積もる", byGpu: "どの GPU にどの LLM が収まるか", memory: "LLM のメモリの仕組み" },
    },
    gpus: {
      title: "どの GPU にどの LLM が収まるか",
      description:
        "RTX 4090、RTX 5090、H100、H200、B200、Apple M シリーズ、Strix Halo、DGX Spark に主要なオープン LLM のどれが収まるかを、BF16、FP8、INT4 の各精度で示しています。ユーザー数と最大コンテキストも掲載しています。",
      h1: "どの GPU にどの LLM が収まるか",
      lede: ({ models, gpus }) =>
        `主要なオープン LLM ${models} 個のうちどれが、実際によく使われる ${gpus} 種類の GPU に収まるかをまとめています。対象はコンシューマー向け・ワークステーション向けの GPU、データセンター向け GPU、Apple Silicon、統合メモリ搭載の AI PC です。各ページでは、すべてのモデルについて BF16、FP8、INT4 でのメモリ、収まるユーザー数、保持できる最長のコンテキストを示しています。`,
      thType: "種類",
      thUsable: "使用可能",
      thBf16: "モデル数（BF16）",
      thInt4: "モデル数（INT4）",
      note: (models) =>
        `全 ${models} 個のモデルのうち、8k コンテキスト・1 ユーザーで収まる数です。ディスクリート GPU はメモリの 92%（vLLM のデフォルト）、統合メモリのデバイスは GPU が利用できる分を使用可能とし、それぞれのデフォルト設定での vLLM のオーバーヘッドを含めています。`,
      links: { size: "任意の GPU でモデルを見積もる", byModel: "モデル別の必要 VRAM", memory: "LLM のメモリの仕組み" },
    },
    concepts: {
      title: "LLM のメモリの仕組み：KV キャッシュ、GQA、量子化",
      description:
        "LLM に必要な GPU メモリを左右する用語（KV キャッシュ、グループ クエリ アテンションと Multi-head Latent Attention、量子化）を、実際のモデルと計算した数値で解説します。",
      h1: "LLM のメモリの仕組み",
      lede: "言語モデルに必要な GPU メモリを左右する用語を解説する 3 つのガイドです。どれも実際のモデルを使って説明しており、数値はすべて計算ツールと同じエンジンで計算しています。",
      links: { calculator: "計算ツールを開く", byModel: "モデル別の必要 VRAM", byGpu: "どの GPU にどの LLM が収まるか" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "モデル",
      thLayers: "層数",
      thShape: "KV ヘッド × head_dim",
      thPerToken: "トークンあたり",
      attentionLink: "GQA、MQA、MLA",
      quantLink: "量子化と VRAM",
      text: (v) => ({
        title: "KV キャッシュのサイズ：計算式と具体例",
        description: `LLM の KV キャッシュはどこまで大きくなるのか。計算式、${v.ex} を使った計算例、主要モデルのトークンあたりの値、そして同時実行数、FP8、グループ クエリ アテンションがキャッシュに与える影響を解説します。`,
        h1: "KV キャッシュのサイズ：実際のモデルで見る計算式",
        crumb: "KV キャッシュ",
        summary: "計算式と計算例、主要モデルのトークンあたりの値に加え、同時実行数に比例して増える一方で重みの量子化では変わらない理由を解説します。",
        body: `<p class="lede">言語モデルはテキストを生成するとき、それまでの各トークンについて計算したキーと値を全層で保持し、次のトークンのために計算し直さずに済むようにしています。この保存領域が KV キャッシュです。GPU メモリの目安計算では見落とされがちな部分ですが、コンテキストが長い場合やユーザーが多い場合には、モデルの重みよりも大きくなります。</p>
<h2>計算式</h2>
<p>各層はトークンごとに、キー/値ヘッド 1 つにつきキー ベクトルと値ベクトルを 1 つずつ保存します。</p>
<pre><code>トークンあたりの KV バイト数 = 2 × 層数 × キー/値ヘッド数 × ヘッド ディメンション × 値あたりのバイト数
KV キャッシュ                = トークンあたりの KV バイト数 × コンテキスト長 × 同時シーケンス数</code></pre>
<p>2 はキーと値の 2 つを表します。値 1 つは FP16 または BF16 で 2 バイト、FP8 で 1 バイトです。層数、キー/値ヘッド数、ヘッド ディメンションはアーキテクチャで決まります（モデルの config.json の <code>num_hidden_layers</code>、<code>num_key_value_heads</code>、<code>head_dim</code>）。そのため、同じ規模のモデルでも必要なキャッシュが大きく異なることがあります。Multi-head Latent Attention を採用したモデルでは、式の中間部分が置き換わります。${v.attention} を参照してください。</p>
<h2>計算例：${v.ex}</h2>
<p>${v.exLink} は ${v.layers} 層、キー/値ヘッド ${v.kvHeads} 個、ヘッド ディメンション ${v.headDim} です。FP16 では 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} バイト、つまりトークンあたり ${v.perTok} です。1 ユーザーが 8k トークンを使うとキャッシュは ${v.kv8k} で、最大の ${v.exMax} トークンのコンテキストでは ${v.kvMax} です（${v.kvOverWeights ? `BF16 の重み ${v.weights} より大きい` : `BF16 の重みは ${v.weights}`}）。</p>
<p>決め手はパラメータ数ではありません。${v.peerLink} と ${v.exLink} は規模が近い（パラメータ数はそれぞれ ${v.peerParams}、${v.exParams}）にもかかわらず、トークンあたりのキャッシュは ${v.ex} が ${v.perTok}、${v.peer} が ${v.peerTok} です。この ${v.ratio} の差は、層数とキー/値ヘッド数によるものです。</p>
<h2>主要モデルのトークンあたりのキャッシュ</h2>
${v.table}
<p class="note">FP16、1 シーケンス。—：モデルの最大コンテキストを超える長さ。DeepSeek V3 はヘッドごとのキーと値ではなく、圧縮された潜在ベクトルをキャッシュします。Gemma 2 と gpt-oss はこの表から除いています。sliding window の層はウィンドウに達すると増えなくなるため、コンテキストが長くなるほどトークンあたりのコストが下がるからです。計算ツールはこれを層ごとに計算します。</p>
<h2>同時実行数に比例して増える</h2>
<p>同時に処理するシーケンスは、それぞれ独自のキャッシュを持ちます。${v.h100} 1 基（使用可能 ${v.h100Usable}）で BF16 の ${v.ex} を動かすと、収まるユーザー数は各 8k トークンなら ${v.users[0]} 人、32k なら ${v.users[1]} 人、128k なら ${v.users[2]} 人です。重みが下限を決め、その上に何人収まるかはキャッシュが決めます。</p>
<h2>小さくできるもの、できないもの</h2>
<ul class="plain">
<li><strong>キー/値ヘッドの削減。</strong>グループ クエリ アテンションとマルチクエリ アテンションは複数のクエリ ヘッドでキー/値ヘッドを共有し、Multi-head Latent Attention は圧縮された潜在ベクトルをキャッシュします。これは選ぶモデルで決まります。</li>
<li><strong>FP8 の KV キャッシュ。</strong>値 1 つを 2 バイトではなく 1 バイトで持つため、キャッシュは半分になります。vLLM では <code>--kv-cache-dtype fp8</code> で指定できます。長いコンテキストの処理では正確性が落ちることがあるため、事前に検証してください。</li>
<li><strong>コンテキスト上限の引き下げ。</strong>キャッシュはシーケンスが保持するトークンごとに増えるため、シーケンス長を制限すれば（vLLM では <code>--max-model-len</code>）、最悪の場合の量も制限できます。</li>
<li><strong>重みの量子化では小さくならない。</strong>INT4 や FP8 の重みで小さくなるのは重みだけです。キャッシュは独自の精度を保つため、コンテキストが長くなるほど削減効果は小さくなります。${v.quant} を参照してください。</li>
<li><strong>PagedAttention とプレフィックス キャッシュ</strong>は、キャッシュを小さくするのではなく、より効率よく使う仕組みです。メモリを前もって確保するのではなく、シーケンスの伸びに合わせてブロック単位で割り当て、同じプレフィックスを持つリクエスト同士でそのブロックを共有できます。LLMScale はこの効率化を計算に含めていないため、示す数値は必要量の全量です。</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">お使いのモデルの KV キャッシュを見積もる</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">量子化と VRAM</a></li>
  <li><a href="${v.modelsHref}">モデル別の VRAM</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "モデル",
      thQueryHeads: "クエリ ヘッド",
      thKvHeads: "KV ヘッド",
      thAttention: "アテンション",
      thPerToken: "トークンあたり",
      thVsMha: "MHA 比",
      kvLink: "KV キャッシュのサイズ",
      text: (v) => ({
        title: "GQA、MQA、MLA：アテンションと KV キャッシュのサイズ",
        description: `マルチヘッド、マルチクエリ、グループ クエリの各アテンションと Multi-head Latent Attention が LLM の KV キャッシュをどう変えるかを、${v.gqaName} と ${v.mlaName} の計算例、${v.models} 個のモデルの比較とともに解説します。`,
        h1: "GQA、MQA、MLA：アテンションが KV キャッシュを決める仕組み",
        crumb: "GQA、MQA、MLA",
        summary:
          "アテンション ヘッドの 4 つの構成、それによってキャッシュが 1 桁変わる理由、そして DeepSeek の MLA が式からヘッド数を取り除く仕組みを解説します。",
        body: `<p class="lede">KV キャッシュはアテンションから生まれます。モデルがアテンション ヘッドをどう構成するかによって、同じパラメータ数でもキャッシュは 1 桁変わることがあります。現在のオープンモデルは、4 つの構成のいずれかに当てはまります。</p>
<h2>マルチヘッド アテンション（MHA）</h2>
<p>各クエリ ヘッドが専用のキー ヘッドと値ヘッドを持ち、キャッシュはそのすべてを保存します。トークンあたり 2 × 層数 × ヘッド数 × ヘッド ディメンション × バイト数です。元の Transformer の設計で、キャッシュのコストは最も高くなります。${v.mha} は今もこの方式で、${v.mhaLayers} 層にわたって ${v.mhaHeads} 個のヘッドを持ち、トークンあたり ${v.mhaTok} です。</p>
<h2>マルチクエリ アテンション（MQA）</h2>
<p>すべてのクエリ ヘッドが 1 つのキー ヘッドと 1 つの値ヘッドを共有します（Shazeer、2019、「Fast Transformer Decoding: One Write-Head is All You Need」）。キャッシュはヘッド数の分だけ小さくなり、これが最大の削減幅ですが、すべてのヘッドで 1 組のキーと値を共有するため、品質が下がることがあります。</p>
<h2>グループ クエリ アテンション（GQA）</h2>
<p>クエリ ヘッドをいくつかのグループに分け、グループごとに 1 つのキー/値ヘッドを共有します。キー/値ヘッドは 1 つより多く、クエリ ヘッドの数より少なくなります。Ainslie ら（2023）が中間案として提案した方式で、品質はマルチヘッド アテンションに近く、速度はマルチクエリ アテンションに近いとされます。LLMScale に同梱されている ${v.bundled} 個のモデルのうち ${v.gqaCount} 個がこの方式です。${v.gqa} は ${v.gqaHeads} 個のクエリ ヘッドを ${v.gqaKvHeads} 個のキー/値ヘッドにまとめるため、キャッシュはトークンあたり ${v.gqaTok} で済みます。マルチヘッド アテンションなら ${v.gqaMhaTok} 必要なので、${v.gqaRatio} 少なくなります。</p>
<h2>Multi-head Latent Attention（MLA）</h2>
<p>DeepSeek-V2 は別の方法を採りました。ヘッドごとにキーと値をキャッシュする代わりに、各層はトークンごとに圧縮された潜在ベクトルを 1 つと、ロータリー位置埋め込みを担う小さな分離キーをキャッシュします。トークンあたりのキャッシュは <code>層数 × (kv_lora_rank + qk_rope_head_dim) × バイト数</code> となり、ヘッド数が式から消えます。DeepSeek-V2 の論文（§2.1.3）によると、同論文の次元設定では、これはグループ数がわずか 2.25 の GQA に相当するサイズです。</p>
<p>${v.mla} は ${v.mlaLayers} 層の各層で ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} 個の値をキャッシュします。トークンあたり ${v.mlaTok} で、ヘッドごとの式で求めた値より ${v.mlaRatio} 少なくなります。8k コンテキストでは ${v.perHead8k} ではなく ${v.mla8k} です。DeepSeek のモデルにヘッドごとの式を当てはめる計算ツールは、キャッシュをこの倍率だけ過大に見積もります。LLMScale は、設定ファイルにこの 2 つのフィールドが両方ある場合は式を切り替えます。</p>
<h2>並べて比較</h2>
${v.table}
<p class="note">FP16。「MHA 比」：同じモデルをマルチヘッド アテンションにした場合に、キャッシュが何倍になるか。</p>
<h2>モデル選びへの影響</h2>
<ul class="plain">
<li><strong>パラメータ数より先にキー/値ヘッドを確認する。</strong>${v.small} と ${v.big} はパラメータ数が ${v.pct}% 違い、トークンあたりのキャッシュは ${v.sizeRatio} 違います。</li>
<li><strong>アテンションの構成はモデルで決まる。</strong>提供中のモデルのキャッシュを小さくする手段は、FP8 の KV キャッシュ、短いコンテキスト、シーケンス数の削減です。${v.kv} を参照してください。</li>
<li><strong>テンソル並列はキー/値ヘッドを GPU 間で分割する</strong>ため、計算ツールはヘッドを均等に割り切れる GPU 数を提案します。</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">モデルのアテンション構成を見る</a></li>
  <li><a href="${v.kvHref}">KV キャッシュのサイズ</a></li>
  <li><a href="${v.quantHref}">量子化と VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "精度",
      thBytes: "バイト/パラメータ",
      kvLink: "KV キャッシュのサイズ",
      text: (v) => ({
        title: "LLM の量子化と VRAM：BF16、FP8、INT4",
        description:
          "8B～405B のモデルで BF16、FP8、INT8、INT4 の重みが GPU メモリをどれだけ使うか、AWQ、GPTQ、GGUF、MXFP4、NF4 とは何か、そして重みを量子化しても KV キャッシュが変わらない理由を解説します。",
        h1: "量子化と VRAM：BF16、FP8、INT8、INT4",
        crumb: "量子化",
        summary: "FP32 から INT4 までのパラメータあたりのバイト数、よく見かける形式、4 ビットがちょうど半バイトにならない理由、そして KV キャッシュには影響しない理由を解説します。",
        body: `<p class="lede">量子化は、モデルの重みを少ないビット数で格納する手法です。重みは通常 GPU メモリの最大の部分を占めるため、真っ先に検討される手段ですが、小さくなるのは重みだけで、精度を 1 段階下げるごとに正確性がいくらか犠牲になります。</p>
<h2>パラメータあたりのバイト数</h2>
<p>重みは <code>パラメータ数 × パラメータあたりのバイト数</code> です。基準は BF16 と FP16 で（ほとんどのモデルはこのどちらかで公開されています）、ほかの精度はすべてこれに対する比率で表せます。</p>
${v.table}
<p class="note">重みのみで、KV キャッシュとオーバーヘッドは含みません。FP8、INT8、INT4 でも、埋め込み層と出力層は 16 ビットのままです。</p>
<h2>よく見かける形式</h2>
<ul class="plain">
<li><strong>BF16 と FP16</strong>：16 ビット浮動小数点数。BF16 は精度が低い代わりに FP32 と同じ数値範囲を持つため、トレーニングや公開されているチェックポイントの多くで使われています。</li>
<li><strong>FP8</strong>：8 ビット浮動小数点数で、重み 1 つあたり 1 バイト。最近の NVIDIA GPU（Ada Lovelace、Hopper 以降）がハードウェアでサポートしています。FP8 のチェックポイントを公開しているモデルもあります。</li>
<li><strong>INT8</strong>：スケール係数付きの 8 ビット整数で、重み 1 つあたり 1 バイト。</li>
<li><strong>AWQ と GPTQ</strong>：重みだけを 4 ビットにする量子化手法。重みを 4 ビットで格納し、16 ビットで計算します。safetensors 形式で配布され、vLLM などの GPU 向け推論エンジンを想定しています。</li>
<li><strong>GGUF</strong>：llama.cpp のファイル形式。量子化レベルはビット数で命名され（Q4、Q5、Q8 など）、CPU、Apple Silicon、コンシューマー向け GPU で使われます。</li>
<li><strong>NVFP4 と MXFP4</strong>：スケールを共有する 4 ビット浮動小数点形式。gpt-oss はエキスパートの重みを MXFP4 で配布しており、そのおかげで ${v.oss} は 80 GB の GPU 1 基に収まります。8k コンテキスト・1 ユーザーで必要なのは ${v.ossNeed} で、${v.h100} の使用可能メモリは ${v.h100Usable} です。</li>
<li><strong>NF4</strong>：QLoRA の 4 ビット NormalFloat。凍結・量子化したベースモデル上でアダプターをファインチューニングするために使います。</li>
</ul>
<h2>4 ビットがちょうど半バイトにならない理由</h2>
<p>実際の 4 ビット形式は、スケール係数も格納します。AWQ と GPTQ では重み 128 個のグループごとに 16 ビットのスケール、MXFP4 では 32 個のブロックごとに 8 ビットのスケールを持つため、重み 1 つあたり約 4.25 ビットになります。さらに、埋め込み層と出力層は 16 ビットのままです。LLMScale はこの両方を計算に含めるため、4 ビットの値は BF16 の半分をはっきり上回ります。Qwen2.5-7B は Qwen 公式の AWQ チェックポイントとの差が 2% 以内に収まり、FP8 の Qwen3-8B は RedHat の FP8 チェックポイントと 0.01 GiB 単位まで一致します。すでに量子化された状態で公開されているチェックポイントは、そのファイル自体からサイズを求めます。QLoRA の NF4 はネストされた量子化を使うと実測でパラメータあたり 4.127 ビット、つまり 0.516 バイトで、ファインチューニングの計算ツールはこの値を使っています。</p>
<h2>KV キャッシュは小さくならない</h2>
<p>KV キャッシュには独自の精度があり、それを決めるのは重みの形式ではなく推論エンジンです。${v.long} を 1 ユーザー、128k コンテキストで使う場合を考えます。重みは BF16 で ${v.longBf16}、INT4 で ${v.longInt4} ですが、KV キャッシュは FP16 のまま ${v.longKv}${v.kvOverInt4 ? "（INT4 の重みより大きい）" : " "}です。キャッシュを FP8 で格納するのは別の選択で、これによりキャッシュは半分になります。${v.kv} を参照してください。</p>
<h2>Mixture of Experts モデル</h2>
<p>量子化はすべてのエキスパートに適用されますが、すべてのエキスパートをメモリに載せる必要があることは変わりません。${v.moe} のパラメータ数は ${v.moeParams} で、重みは BF16 で ${v.moeBf16}、INT4 で ${v.moeInt4} です。アクティブ パラメータ ${v.moeActive} が決めるのは各トークンの計算量であって、モデルが占めるメモリではありません。</p>
<h2>精度の選び方</h2>
<ul class="plain">
<li><strong>収まる精度から始める。</strong>モデルが GPU に収まらないとき、計算ツールは、より軽い精度のうち最初に収まるものを示します。</li>
<li><strong>コストを測る。</strong>精度を 1 段階下げるごとにメモリと引き換えに正確性を失い、その程度はモデルと手法によって異なります。提供を始める前に、実際に使うタスクで検証してください。</li>
<li><strong>量子化済みのチェックポイントは、それ自体の情報に従う。</strong>LLMScale は精度を <code>quantization_config</code>、リポジトリ名、または safetensors のヘッダーから読み取ります。vLLM は AWQ、GPTQ、FP8 のチェックポイントを <code>--quantization</code> フラグなしで読み込みます。</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">お使いのモデルで精度を比較する</a></li>
  <li><a href="${v.kvHref}">KV キャッシュのサイズ</a></li>
  <li><a href="${v.attentionHref}">GQA、MQA、MLA</a></li>
  <li><a href="${v.gpusHref}">どの GPU にどの LLM が収まるか</a></li>
</ul>`,
      }),
    },
  },
};

export default ja;

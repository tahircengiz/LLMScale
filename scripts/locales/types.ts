// The words of the pages the build writes itself — the model, GPU and concept
// guides (genPages.ts, concepts.ts) and the frame around them (shell.ts) — in a
// shape every language fills in (docs/i18n-plan.md §3.3). Each language is a file
// of its own beside this one; index.ts keys them by Lang, so enabling a language
// fails the type check until its file exists.
//
// The generators work out every figure and link and hand them in already
// formatted for the language; a language only arranges them. Functions rather
// than templates with placeholders, because word order, suffixes and plurals
// change from language to language ("${name} kaç GB VRAM ister?").

/** A page section's name: the phone menu's label on a page the nav does not
 *  list, and the middle of its breadcrumb trail. */
export interface SectionText {
  models: string;
  gpus: string;
  concepts: string;
  feed: string;
  /** The breadcrumb trail's accessible name. */
  crumbs: string;
}

export interface ModelPageText {
  attention: {
    mla(v: { dims: number; ratio: string }): string;
    mqa(v: { heads: number }): string;
    gqa(v: { heads: number; kvHeads: number; ratio: string }): string;
    mha(v: { heads: number }): string;
  };
  lede: {
    size(v: { name: string; params: string; layers: number }): string;
    moe(v: { active: string; total: string }): string;
    context(v: { max: string; kv: string }): string;
    gated: string;
  };
  title(name: string): string;
  description(v: { name: string; ctx: string; bf16: string; int4: string }): string;
  h1(name: string): string;
  oneUser: string;
  /** A context length's column and caption: "8k context". */
  ctx(k: string): string;
  answer(v: { weights: string; kv: string; overhead: string; int4: string }): string;
  /** The layer count's pill: "80 layers". A function so a language can make the word agree with n. */
  specLayers(n: number): string;
  /** The longest context's pill, k already formatted: "128k max context". */
  specMaxContext(k: string): string;
  /** The query/key-value head counts' pill: "64/8 heads". */
  specHeads(v: { heads: number; kvHeads: number }): string;
  h2Memory(name: string): string;
  thPrecision: string;
  /** Under a memory figure: the KV cache's share of it. */
  kvCache: string;
  tableNote: string;
  h2Holds: string;
  noSingleGpu(counts: string): string;
  fitNote(ctx: string): string;
  h2Users: string;
  doesNotFit: string;
  usersNote(ctx: string): string;
  noCard: string;
  h2FineTune(name: string): string;
  thMethod: string;
  thMemory: string;
  thSmallestGpu: string;
  modes: { full: string; lora: string; qlora: string };
  sharded: string;
  trainNote: string;
  h2Source: string;
  kvFormula: { mla: string; heads: string };
  /** Starts with a space: it follows a sentence. */
  windowNote(v: { sliding: number; layers: number; window: string; pastWindow: string; fullLayers: number }): string;
  source(v: { kvFormula: string; name: string; kib: string; windowNote: string }): string;
  /** Hrefs of the two concept guides. */
  more(v: { kvCache: string; attention: string }): string;
  h2Work(name: string): string;
  links: { size: string; train: string; vllm: string; anatomy: string; config: string; serving: string };
  h2Family(family: string): string;
}

export interface GpuPageText {
  lede: {
    unified(v: { name: string; total: number; vram: number; usable: string; apple: boolean }): string;
    discrete(v: { name: string; vram: number; usable: string }): string;
    bandwidth(bw: string): string;
    apple: string;
    counts(v: { models: number; bf16: number; fp8: number; int4: number }): string;
  };
  title(name: string): string;
  description(v: { name: string; usable: string; models: number; bf16: number; int4: number }): string;
  h1(name: string): string;
  /** Starts with a space: it follows the figure, for screen readers. */
  doesNotFit: string;
  thModel: string;
  thUsers: string;
  thMaxContext: string;
  tableNote: string;
  usableMemory: string;
  answer(v: { models: number; bf16: number; int4: number }): string;
  h2Fit(name: string): string;
  quantization(href: string): string;
  parallel: string;
  h2Size(name: string): string;
  open: string;
  h2Others: string;
}

export interface HubsText {
  models: {
    title: string;
    description(models: number): string;
    h1: string;
    lede(models: number): string;
    active: string;
    thModel: string;
    thParams: string;
    thMaxContext: string;
    note: string;
    links: { size: string; byGpu: string; memory: string };
  };
  gpus: {
    title: string;
    description: string;
    h1: string;
    lede(v: { models: number; gpus: number }): string;
    thType: string;
    thUsable: string;
    thBf16: string;
    thInt4: string;
    note(models: number): string;
    links: { size: string; byModel: string; memory: string };
  };
  concepts: {
    title: string;
    description: string;
    h1: string;
    lede: string;
    links: { calculator: string; byModel: string; byGpu: string };
  };
}

/** One concept guide, as concepts.ts hands it to genPages.ts. */
export interface ConceptText {
  title: string;
  description: string;
  h1: string;
  crumb: string;
  /** One or two sentences for the hub page. */
  summary: string;
  body: string;
}

/** The figures and links the KV cache guide is written around. Links are whole
 *  <a> elements; hrefs are for links whose words sit in the body. */
export interface KvCacheVars {
  attention: string;
  quant: string;
  home: string;
  quantHref: string;
  modelsHref: string;
  ex: string;
  exLink: string;
  peer: string;
  peerLink: string;
  layers: number;
  kvHeads: number;
  headDim: number;
  perTokBytes: string;
  perTok: string;
  peerTok: string;
  kv8k: string;
  exMax: string;
  kvMax: string;
  weights: string;
  kvOverWeights: boolean;
  peerParams: string;
  exParams: string;
  ratio: string;
  table: string;
  h100: string;
  h100Usable: string;
  users: [string, string, string];
}

export interface AttentionVars {
  kv: string;
  anatomyHref: string;
  kvHref: string;
  quantHref: string;
  mha: string;
  mhaHeads: number;
  mhaLayers: number;
  mhaTok: string;
  gqa: string;
  gqaName: string;
  gqaHeads: number;
  gqaKvHeads: number;
  gqaTok: string;
  gqaMhaTok: string;
  gqaRatio: string;
  gqaCount: number;
  bundled: number;
  mla: string;
  mlaName: string;
  mlaLayers: number;
  kvLoraRank: number;
  ropeDim: number;
  mlaTok: string;
  mlaRatio: string;
  mla8k: string;
  perHead8k: string;
  table: string;
  small: string;
  big: string;
  pct: number;
  sizeRatio: string;
  /** How many models the side-by-side table lists. */
  models: number;
}

export interface QuantizationVars {
  kv: string;
  home: string;
  kvHref: string;
  attentionHref: string;
  gpusHref: string;
  table: string;
  oss: string;
  ossNeed: string;
  h100: string;
  h100Usable: string;
  long: string;
  longBf16: string;
  longInt4: string;
  longKv: string;
  kvOverInt4: boolean;
  moe: string;
  moeParams: string;
  moeBf16: string;
  moeInt4: string;
  moeActive: string;
}

export interface ConceptsText {
  kvCache: {
    thModel: string;
    thLayers: string;
    thShape: string;
    thPerToken: string;
    attentionLink: string;
    quantLink: string;
    text(v: KvCacheVars): ConceptText;
  };
  attention: {
    thModel: string;
    thQueryHeads: string;
    thKvHeads: string;
    thAttention: string;
    thPerToken: string;
    thVsMha: string;
    kvLink: string;
    text(v: AttentionVars): ConceptText;
  };
  quantization: {
    thPrecision: string;
    thBytes: string;
    kvLink: string;
    text(v: QuantizationVars): ConceptText;
  };
}

/** How the language strings the generators' pieces together: between two of its
 *  sentences, between the items of a list, and after a list item's label. Chinese
 *  runs sentences on without a space and separates items, Latin names too, with
 *  、 ("vLLM、SGLang、TGI", docs/i18n/glossary/zh.md). */
export interface JoinText {
  sentence: string;
  list: string;
  colon: string;
}

export interface PageText {
  section: SectionText;
  join: JoinText;
  model: ModelPageText;
  gpu: GpuPageText;
  hubs: HubsText;
  concepts: ConceptsText;
}

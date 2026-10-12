// The Serving Brief engine: what a model repository says about serving it, read
// from more than its config.json — the file list, the safetensors index (or the
// header of a single safetensors file), the chat template, generation_config.json,
// hf_quant_config.json, adapter_config.json and Mistral's params.json.
//
// Every section carries the files and keys it rests on ("cites"), the way the
// Config Decoder points at lines. Engine flags are only the ones the engines name
// in their own docs or parser registries at ENGINE_VERSIONS; a model family with
// no verified name gets no flag rather than a guess.
//
// Sentences live in the dictionary as `serve.*` templates; this module returns
// template keys plus the values that fill them, like configExplain.ts.
//
// React-free: scripts/test-serving.ts runs it against snapshots of real repos.

import { fmtBytes, fmtInt, fmtNum, shortTokens } from "./configExplain.ts";
import type { Lang } from "./dict.ts";

// Configs are free-form JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** The releases whose source the engine rules below were read from. */
export const ENGINE_VERSIONS = { vllm: "0.31.0", sglang: "0.5.21" } as const;

// ── what the page fetched ─────────────────────────────────────────────────

export interface RepoFile {
  name: string;
  size?: number;
}

export interface ChatTemplate {
  text: string;
  /** Where it was found: chat_template.jinja, tokenizer_config.json or chat_template.json. */
  file: string;
}

/** Everything read from one repository. A field left undefined was not in the
 *  repository, or could not be read; `unreadable` says which. */
export interface RepoSnapshot {
  id: string;
  gated: boolean;
  files: RepoFile[];
  /** Files the repository lists but a browser could not read (gated repos answer 401). */
  unreadable?: string[];
  tags?: string[];
  pipelineTag?: string;
  libraryName?: string;
  /** safetensors dtype → parameter count, from the Hugging Face model API. */
  dtypeParams?: Record<string, number>;
  numParams?: number;
  config?: Json;
  generationConfig?: Json;
  /** tokenizer_config.json without added_tokens_decoder, which nothing here reads. */
  tokenizerConfig?: Json;
  chatTemplate?: ChatTemplate | null;
  hfQuantConfig?: Json;
  adapterConfig?: Json;
  mistralParams?: Json;
  /** The tensor names, digested; from the index or a single file's header. */
  tensors?: TensorDigest | null;
  tensorFile?: string;
}

// ── tensor names ──────────────────────────────────────────────────────────

/** Tensor names reduced to what the brief reads: every name with its numbers
 *  replaced by {n}, and how many tensors each numbered stack holds per layer.
 *  DeepSeek-V3's 91,991 names become ~60 templates, small enough for a fixture. */
export interface TensorDigest {
  total: number;
  templates: Record<string, number>;
  /** e.g. { "model.layers": { "0": 12, …, "61": 1564 } } */
  stacks: Record<string, Record<string, number>>;
}

const STACK = /^((?:[\w-]+\.)*?(?:layers|h|blocks|mtp_layers|mtp_modules))\.(\d+)\./;

export function digestTensors(names: readonly string[]): TensorDigest {
  const templates: Record<string, number> = {};
  const stacks: Record<string, Record<string, number>> = {};
  for (const name of names) {
    const t = name.replace(/\.\d+(?=\.|$)/g, ".{n}");
    templates[t] = (templates[t] ?? 0) + 1;
    const m = STACK.exec(name);
    if (m) {
      const s = (stacks[m[1]] ??= {});
      s[m[2]] = (s[m[2]] ?? 0) + 1;
    }
  }
  return { total: names.length, templates, stacks };
}

const lastSeg = (t: string) => t.slice(t.lastIndexOf(".") + 1);

function suffixCount(d: TensorDigest, ...suffixes: string[]): number {
  let n = 0;
  for (const [t, c] of Object.entries(d.templates)) if (suffixes.includes(lastSeg(t))) n += c;
  return n;
}

function countWhere(d: TensorDigest, test: (template: string) => boolean): number {
  let n = 0;
  for (const [t, c] of Object.entries(d.templates)) if (test(t)) n += c;
  return n;
}

const SIDE_STACK = /vision|visual|audio|mtp|nextn|encoder|projector/i;

/** The decoder's own layer stack: the largest numbered stack that is not a vision,
 *  audio or MTP tower. */
function mainStack(d: TensorDigest): string | undefined {
  let best: string | undefined;
  let size = 0;
  for (const [name, layers] of Object.entries(d.stacks)) {
    if (SIDE_STACK.test(name)) continue;
    const n = Object.values(layers).reduce((a, b) => a + b, 0);
    if (n > size) [best, size] = [name, n];
  }
  return best;
}

// ── output shapes ─────────────────────────────────────────────────────────

/** A sentence: a dictionary key under serve.* and the values that fill it. */
export interface Part {
  k: string;
  v?: Record<string, string | number>;
}

/** A file, and the key or tensor pattern inside it, an answer rests on. */
export interface Cite {
  file: string;
  key?: string;
  value?: string;
}

export type SectionId = "repo" | "chat" | "sampling" | "weights" | "mtp" | "context" | "load";

export interface Section {
  id: SectionId;
  parts: Part[];
  cites: Cite[];
  tone?: "warn";
}

export interface Gotcha extends Part {
  section: SectionId;
  severity: "warn" | "info";
}

export interface Flag {
  flag: string;
  value?: string;
  why: Part;
}

export interface Command {
  engine: "vllm" | "sglang";
  /** The command before its flags; null when the brief does not write one (GGUF, no weights). */
  base: string | null;
  flags: Flag[];
  notes: Part[];
}

export type Role = "chat" | "base" | "embedding" | "reranker" | "adapter" | "draft" | "unknown";
export type Format = "safetensors" | "gguf" | "mistral" | "pytorch" | "adapter" | "none";
export type QuantScheme =
  | "none"
  | "fp8-block"
  | "fp8"
  | "nvfp4"
  | "mxfp4"
  | "awq"
  | "gptq"
  | "int4-packed"
  | "int8"
  | "bnb"
  | "other";
export type MtpStatus = "ready" | "missing" | "unverified" | "none";

export interface TemplateFacts {
  file: string;
  tools: boolean;
  toolFormat?: "harmony" | "qwen3-xml" | "kimi" | "deepseek" | "glm" | "hermes" | "mistral" | "llama3";
  reasoning: boolean;
  thinkToggle?: "enable_thinking" | "thinking" | "reasoning_effort";
  images: boolean;
  noSystem: boolean;
  alternation: boolean;
}

export interface Parsers {
  tool?: string;
  reasoning?: string;
  /** A chat template from the engine's own repository that its docs pair with the
   *  tool parser, as a path inside that repository. */
  template?: string;
}

export interface Facts {
  role: Role;
  format: Format;
  /** Top-level weight files and their total bytes. */
  shards: number;
  weightBytes: number;
  /** GGUF quantization labels with their bytes, largest first. */
  gguf: { label: string; bytes: number }[];
  derivedFrom?: { id: string; relation: string };
  vision: boolean;
  audio: boolean;
  template: TemplateFacts | null;
  /** Chat format kept outside a Jinja template (Mistral's tekken.json). */
  mistralCommon: boolean;
  family?: string;
  parsers: { vllm: Parsers; sglang: Parsers };
  quant: {
    declared?: { scheme: QuantScheme; label: string; file: string; key: string };
    tensors?: QuantScheme;
    kvScales: boolean;
    kept: string[];
  };
  mtp: {
    declared?: number;
    field?: string;
    tensors: number;
    where?: string;
    status: MtpStatus;
    vllm: boolean;
    sglang: boolean;
  };
  eos: { config: number[]; generation: number[]; extra: number[] };
  remoteCode: { arch: boolean; tokenizer: boolean; files: string[] };
}

export interface ServingBrief {
  facts: Facts;
  portrait: Part[];
  gotchas: Gotcha[];
  sections: Section[];
  commands: { vllm: Command; sglang: Command };
}

// ── helpers ───────────────────────────────────────────────────────────────

const has = (s: RepoSnapshot, name: string) => s.files.some((f) => f.name === name);
const top = (f: RepoFile) => !f.name.includes("/");
const asIds = (v: unknown): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : typeof v === "number" ? [v] : [];
/** The part of a config that describes the language model. */
const textCfg = (cfg: Json): Json => cfg?.text_config ?? cfg?.llm_config ?? cfg ?? {};
const short = (s: string, n = 40) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const json = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));
/** English plural ending for a count; Turkish templates do not use it. */
const s_ = (n: number) => (n === 1 ? "" : "s");
const tensorsWord = (n: number, lang: Lang) => `${fmtInt(n, lang)} ${lang === "tr" ? "tensör" : n === 1 ? "tensor" : "tensors"}`;

// ── the repository: format, role, lineage ─────────────────────────────────

const GGUF_LABEL = /[-._](UD-)?(I?Q\d[\w]*?|F16|BF16|F32|MXFP4(?:_MOE)?|TQ\d_\d)(?:-\d{5}-of-\d{5})?\.gguf$/i;

function formatOf(s: RepoSnapshot): Pick<Facts, "format" | "shards" | "weightBytes" | "gguf"> {
  const st = s.files.filter((f) => top(f) && f.name.endsWith(".safetensors"));
  const consolidated = st.filter((f) => /^consolidated/.test(f.name));
  const hfSt = st.filter((f) => !/^consolidated/.test(f.name) && !/^adapter_model/.test(f.name));
  const ggufFiles = s.files.filter((f) => f.name.endsWith(".gguf"));
  const bins = s.files.filter((f) => top(f) && /^(pytorch_model|model)[\w.-]*\.bin$/.test(f.name));
  const sum = (fs: RepoFile[]) => fs.reduce((a, f) => a + (f.size ?? 0), 0);

  const gguf: Facts["gguf"] = [];
  for (const f of ggufFiles) {
    const m = GGUF_LABEL.exec(f.name);
    // Unsloth's dynamic quants (UD-) are a different recipe from the plain ones.
    const label = m ? `${m[1] ?? ""}${m[2]}`.toUpperCase() : "OTHER";
    const g = gguf.find((x) => x.label === label);
    if (g) g.bytes += f.size ?? 0;
    else gguf.push({ label, bytes: f.size ?? 0 });
  }
  gguf.sort((a, b) => b.bytes - a.bytes);

  // Mistral's own layout wins when both are shipped: vLLM loads it by default.
  if (consolidated.length && has(s, "params.json"))
    return { format: "mistral", shards: consolidated.length, weightBytes: sum(consolidated), gguf };
  if (hfSt.length) return { format: "safetensors", shards: hfSt.length, weightBytes: sum(hfSt), gguf };
  if (ggufFiles.length) return { format: "gguf", shards: ggufFiles.length, weightBytes: sum(ggufFiles), gguf };
  if (has(s, "adapter_config.json")) {
    const a = s.files.filter((f) => top(f) && /^adapter_model/.test(f.name));
    return { format: "adapter", shards: a.length, weightBytes: sum(a), gguf };
  }
  if (bins.length) return { format: "pytorch", shards: bins.length, weightBytes: sum(bins), gguf };
  return { format: "none", shards: 0, weightBytes: 0, gguf };
}

function derivedFrom(s: RepoSnapshot): Facts["derivedFrom"] {
  for (const t of s.tags ?? []) {
    const m = /^base_model:(quantized|finetune|adapter|merge):(.+\/.+)$/.exec(t);
    if (m && m[2].toLowerCase() !== s.id.toLowerCase()) return { id: m[2], relation: m[1] };
  }
  const base = s.adapterConfig?.base_model_name_or_path;
  if (typeof base === "string" && base.includes("/")) return { id: base, relation: "adapter" };
  return undefined;
}

const DRAFT_ARCH = /eagle|medusa|mlp_?speculator/i;

/** Whether the chat template could not be read, as opposed to not being there. */
const templateUnread = (s: RepoSnapshot) => (s.unreadable ?? []).some((f) => f === "tokenizer_config.json" || f === "chat_template.jinja");

function roleOf(s: RepoSnapshot, format: Format, template: TemplateFacts | null, mistralCommon: boolean): Role {
  const archs: string[] = Array.isArray(s.config?.architectures) ? s.config.architectures : [];
  if (format === "adapter") return "adapter";
  // A GGUF file carries its own chat template in its metadata, which this page does
  // not read; an unreadable tokenizer_config.json hides whether there is one.
  if (format === "gguf" || templateUnread(s)) return template ? "chat" : "unknown";
  if (archs.some((a) => DRAFT_ARCH.test(a)) || DRAFT_ARCH.test(String(s.config?.model_type ?? ""))) return "draft";
  const pt = s.pipelineTag ?? "";
  if (has(s, "modules.json") || has(s, "config_sentence_transformers.json") || pt === "feature-extraction" || pt === "sentence-similarity")
    return "embedding";
  if (pt === "text-ranking" || /rerank/i.test(s.id)) return "reranker";
  if (template || mistralCommon) return "chat";
  if (s.config || format !== "none") return "base";
  return "unknown";
}

// ── the chat template ─────────────────────────────────────────────────────

/** The chat template, wherever the repository keeps it: chat_template.jinja (newer
 *  Transformers), tokenizer_config.json (a string, or a list of named templates),
 *  or a processor's chat_template.json. Exported for repoFetch.ts. */
export function templateFrom(tokenizerConfig: Json, jinja?: string | null, processorJson?: Json): ChatTemplate | null {
  if (typeof jinja === "string" && jinja.trim()) return { text: jinja, file: "chat_template.jinja" };
  const t = tokenizerConfig?.chat_template;
  if (typeof t === "string" && t.trim()) return { text: t, file: "tokenizer_config.json" };
  if (Array.isArray(t)) {
    const text = t.map((x: Json) => (typeof x?.template === "string" ? x.template : "")).join("\n");
    if (text.trim()) return { text, file: "tokenizer_config.json" };
  }
  const p = processorJson?.chat_template;
  if (typeof p === "string" && p.trim()) return { text: p, file: "chat_template.json" };
  return null;
}

export function readTemplate(t: ChatTemplate): TemplateFacts {
  const x = t.text;
  const toolFormat: TemplateFacts["toolFormat"] = /<\|channel\|>/.test(x)
    ? "harmony"
    : /<function=/.test(x)
      ? "qwen3-xml"
      : /<\|tool_calls_section_begin\|>/.test(x)
        ? "kimi"
        : /tool▁calls?▁begin/.test(x)
          ? "deepseek"
          : /<arg_key>/.test(x)
            ? "glm"
            : /<tool_call>/.test(x)
              ? "hermes"
              : /\[TOOL_CALLS\]/.test(x)
                ? "mistral"
                : /<\|python_tag\|>|ipython/.test(x)
                  ? "llama3"
                  : undefined;
  const thinkToggle: TemplateFacts["thinkToggle"] = /enable_thinking/.test(x)
    ? "enable_thinking"
    : /reasoning_effort/.test(x)
      ? "reasoning_effort"
      : /\bif\s+(not\s+)?thinking\b|\bthinking\s+is\s+(defined|true|false)/.test(x)
        ? "thinking"
        : undefined;
  return {
    file: t.file,
    tools: /\btools\b/.test(x),
    toolFormat,
    reasoning: /<\/?think>|◁\/?think▷|\[\/?THINK\]|reasoning_content|<\|channel\|>/.test(x) || !!thinkToggle,
    thinkToggle,
    images: /['"]image['"]|image_url|<\|image_pad\|>|\[IMG\]|<start_of_image>|<\|vision_start\|>|<image>/.test(x),
    noSystem: /raise_exception\([^)]*[Ss]ystem role/.test(x),
    alternation: /raise_exception\([^)]*alternate/.test(x),
  };
}

// ── tool and reasoning parsers ────────────────────────────────────────────

interface Family {
  id: string;
  vllm: Parsers;
  sglang: Parsers;
}

const VT = (f: string) => `examples/tool_chat_template_${f}.jinja`;
const ST = (f: string) => `examples/chat_template/tool_chat_template_${f}.jinja`;

/** Which parser family a repository belongs to. Names are the ones vLLM 0.31.0 and
 *  SGLang 0.5.21 document (docs/features/tool_calling.md, reasoning_outputs.md;
 *  docs/advanced_features/tool_parser.mdx, separate_reasoning.mdx) or register
 *  (vllm/tool_parsers, vllm/reasoning; function_call_parser.py, reasoning_parser.py).
 *  Reasoning parsers apply only when the template shows thinking. */
function familyOf(s: RepoSnapshot, t: TemplateFacts | null): Family | undefined {
  const mt = String(textCfg(s.config).model_type ?? s.config?.model_type ?? "").toLowerCase();
  const root = String(s.config?.model_type ?? "").toLowerCase();
  const archs: string[] = Array.isArray(s.config?.architectures) ? s.config.architectures : [];
  const id = s.id.toLowerCase();
  const think = !!t?.reasoning;
  const r = (name: string) => (think ? name : undefined);

  if (mt === "gpt_oss" || t?.toolFormat === "harmony")
    return { id: "gpt-oss", vllm: { tool: "openai", reasoning: "openai_gptoss" }, sglang: { tool: "gpt-oss", reasoning: "gpt-oss" } };
  if (root === "kimi_k2" || mt === "kimi_k2" || t?.toolFormat === "kimi")
    return { id: "kimi-k2", vllm: { tool: "kimi_k2", reasoning: r("kimi_k2") }, sglang: { tool: "kimi_k2", reasoning: r("kimi_k2") } };
  if (mt.startsWith("qwen") && t?.toolFormat === "qwen3-xml")
    return { id: "qwen3-coder", vllm: { tool: "qwen3_xml", reasoning: r("qwen3") }, sglang: { tool: "qwen3_coder", reasoning: r("qwen3") } };
  if (mt.startsWith("qwen3") || root.startsWith("qwen3"))
    return { id: "qwen3", vllm: { tool: "hermes", reasoning: r("qwen3") }, sglang: { tool: "qwen", reasoning: r("qwen3") } };
  if (mt.startsWith("qwen2") || root.startsWith("qwen2"))
    // vLLM documents QwQ-32B (a Qwen2 that thinks) with the deepseek_r1 reasoning parser.
    return { id: "qwen2", vllm: { tool: "hermes", reasoning: r("deepseek_r1") }, sglang: { tool: "qwen" } };
  if (mt === "deepseek_v32")
    return { id: "deepseek-v3.2", vllm: { tool: "deepseek_v32" }, sglang: { tool: "deepseekv32", reasoning: r("deepseek-v3"), template: ST("deepseekv32") } };
  if (mt === "deepseek_v3") {
    if (/v3[.-]1|terminus/.test(id) || t?.thinkToggle === "thinking")
      return {
        id: "deepseek-v3.1",
        vllm: { tool: "deepseek_v31", reasoning: r("deepseek_v3"), template: VT("deepseekv31") },
        sglang: { tool: "deepseekv31", reasoning: r("deepseek-v3"), template: ST("deepseekv31") },
      };
    if (/(^|[-/])r1\b|-r1-/.test(id) || think)
      return { id: "deepseek-r1", vllm: { tool: "deepseek_v3", reasoning: r("deepseek_r1"), template: VT("deepseekr1") }, sglang: { tool: "deepseekv3", reasoning: r("deepseek-r1") } };
    return { id: "deepseek-v3", vllm: { tool: "deepseek_v3", template: VT("deepseekv3") }, sglang: { tool: "deepseekv3", template: ST("deepseekv3") } };
  }
  if (mt === "glm4_moe") {
    if (/glm-?4\.7/.test(id)) return { id: "glm-4.7", vllm: { tool: "glm47", reasoning: r("glm47") }, sglang: { tool: "glm47", reasoning: r("glm45") } };
    return { id: "glm-4.5", vllm: { tool: "glm45", reasoning: r("glm45") }, sglang: { tool: "glm", reasoning: r("glm45") } };
  }
  if (mt === "llama4" || root === "llama4")
    return { id: "llama4", vllm: { tool: "llama4_pythonic", template: VT("llama4_pythonic") }, sglang: { tool: "llama4" } };
  if (mt === "llama" && (t?.toolFormat === "llama3" || /llama-?3/.test(id)))
    return { id: "llama3", vllm: { tool: "llama3_json", template: VT("llama3.1_json") }, sglang: { tool: "llama3" } };
  if (/^(mistral|mistral3|mixtral|ministral)/.test(mt) || /^(mistral|mistral3)/.test(root) || t?.toolFormat === "mistral" || has(s, "tekken.json"))
    return { id: "mistral", vllm: { tool: "mistral", reasoning: r("mistral") }, sglang: { tool: "mistral", reasoning: r("mistral") } };
  if (mt === "granitemoehybrid") return { id: "granite4", vllm: { tool: "granite4" }, sglang: {} };
  if (mt === "granite") return { id: "granite", vllm: { tool: "granite", reasoning: r("granite") }, sglang: {} };
  if (mt === "minimax_m2")
    return { id: "minimax-m2", vllm: { tool: "minimax_m2", reasoning: "minimax_m2_append_think" }, sglang: { tool: "minimax-m2", reasoning: "minimax-append-think" } };
  if (mt === "hunyuan_v1_moe")
    return { id: "hunyuan", vllm: { tool: "hunyuan_a13b", reasoning: r("hunyuan_a13b") }, sglang: { tool: "hunyuan", reasoning: r("hunyuan") } };
  if (archs.includes("MiMoForCausalLM"))
    return { id: "mimo", vllm: { tool: "mimo", reasoning: r("mimo") }, sglang: { tool: "mimo", reasoning: r("mimo") } };
  return undefined;
}

// ── quantization ──────────────────────────────────────────────────────────

const SCHEME_LABEL: Record<QuantScheme, string> = {
  none: "none",
  "fp8-block": "FP8, block scales",
  fp8: "FP8",
  nvfp4: "NVFP4",
  mxfp4: "MXFP4",
  awq: "AWQ",
  gptq: "GPTQ",
  "int4-packed": "INT4 (packed)",
  int8: "INT8",
  bnb: "bitsandbytes",
  other: "other",
};

/** What config.json's quantization_config, or ModelOpt's hf_quant_config.json, declares. */
function declaredQuant(s: RepoSnapshot): Facts["quant"]["declared"] {
  const q = s.config?.quantization_config ?? s.config?.text_config?.quantization_config;
  if (q) {
    const key = s.config?.quantization_config ? "quantization_config" : "text_config.quantization_config";
    const m = String(q.quant_method ?? q.quant_algo ?? "").toLowerCase();
    const bits = q.bits ?? q.w_bit ?? q.weight_bits;
    const group = q.group_size ?? q.q_group_size;
    let scheme: QuantScheme = "other";
    let label = m || "?";
    if (m === "fp8" || m === "fbgemm_fp8") {
      const b = q.weight_block_size;
      scheme = Array.isArray(b) ? "fp8-block" : "fp8";
      label = Array.isArray(b) ? `FP8, ${b.join("×")} blocks` : "FP8";
    } else if (m === "mxfp4") [scheme, label] = ["mxfp4", "MXFP4"];
    else if (m === "awq") [scheme, label] = ["awq", `AWQ ${bits ?? 4}-bit${group ? `, group ${group}` : ""}`];
    else if (m === "gptq" || m === "gptqmodel") [scheme, label] = ["gptq", `GPTQ ${bits ?? 4}-bit${group ? `, group ${group}` : ""}`];
    else if (m.includes("bitsandbytes")) [scheme, label] = ["bnb", q.load_in_8bit ? "bitsandbytes INT8" : `bitsandbytes ${String(q.bnb_4bit_quant_type ?? "4-bit").toUpperCase()}`];
    else if (m === "modelopt") {
      const a = String(q.quant_algo ?? "").toUpperCase();
      [scheme, label] = a.includes("FP4") ? ["nvfp4", "NVFP4 (ModelOpt)"] : a.includes("FP8") ? ["fp8", "FP8 (ModelOpt)"] : ["other", `ModelOpt ${a}`];
    } else if (m === "compressed-tensors") {
      const fmt = String(q.format ?? "");
      const g: Json = q.config_groups ? (q.config_groups.group_0 ?? Object.values(q.config_groups)[0]) : null;
      const w = g?.weights;
      const wType = String(w?.type ?? "");
      const aBits = g?.input_activations?.num_bits;
      if (/nvfp4/.test(fmt) || (wType === "float" && w?.num_bits === 4)) [scheme, label] = ["nvfp4", "NVFP4 (compressed-tensors)"];
      else if (wType === "float" && w?.num_bits === 8) [scheme, label] = ["fp8", "FP8 (compressed-tensors)"];
      else if (w?.num_bits === 8) [scheme, label] = ["int8", `INT8 W8A${aBits ?? 16} (compressed-tensors)`];
      else if (w?.num_bits && w.num_bits <= 4)
        [scheme, label] = ["int4-packed", `INT${w.num_bits} W${w.num_bits}A${aBits ?? 16}${w.group_size ? `, group ${w.group_size}` : ""} (compressed-tensors)`];
      else label = "compressed-tensors";
    }
    return { scheme, label, file: "config.json", key };
  }
  const h = s.hfQuantConfig?.quantization;
  if (h?.quant_algo) {
    const a = String(h.quant_algo).toUpperCase();
    const scheme: QuantScheme = a.includes("FP4") ? "nvfp4" : a.includes("FP8") ? "fp8" : "other";
    return { scheme, label: `${a} (ModelOpt)`, file: "hf_quant_config.json", key: "quantization.quant_algo" };
  }
  return undefined;
}

/** What the tensor names themselves show, whatever the files declare. */
function tensorQuant(d: TensorDigest): QuantScheme {
  if (suffixCount(d, "weight_scale_inv")) return "fp8-block";
  if (suffixCount(d, "weight_scale_2", "weight_global_scale")) return "nvfp4";
  if (countWhere(d, (t) => /_blocks$/.test(t)) && countWhere(d, (t) => /_scales$/.test(t))) return "mxfp4";
  if (suffixCount(d, "qweight")) return suffixCount(d, "g_idx") ? "gptq" : "awq";
  if (suffixCount(d, "weight_packed")) return "int4-packed";
  if (suffixCount(d, "absmax", "quant_map")) return "bnb";
  if (suffixCount(d, "weight_scale")) return "fp8";
  return "none";
}

/** Which key a checkpoint lists its full-precision modules under. */
function keptKey(s: RepoSnapshot): string {
  const pre = s.config?.quantization_config ? "quantization_config." : "text_config.quantization_config.";
  const q = s.config?.quantization_config ?? s.config?.text_config?.quantization_config ?? {};
  for (const k of ["ignore", "modules_to_not_convert", "ignored_layers"]) if (Array.isArray(q[k])) return pre + k;
  return "quantization.exclude_modules";
}

/** Modules a quantized checkpoint keeps in full precision, as its config lists them. */
function keptModules(s: RepoSnapshot): string[] {
  const q = s.config?.quantization_config ?? s.config?.text_config?.quantization_config ?? {};
  const list = q.ignore ?? q.modules_to_not_convert ?? q.ignored_layers ?? s.hfQuantConfig?.quantization?.exclude_modules;
  return Array.isArray(list) ? list.filter((x: unknown): x is string => typeof x === "string") : [];
}

// ── multi-token prediction ────────────────────────────────────────────────

const MTP_FIELDS = ["num_nextn_predict_layers", "mtp_num_hidden_layers", "num_mtp_modules"] as const;

/** Model types and architectures vLLM 0.31.0 maps onto an MTP draft
 *  (SpeculativeConfig.hf_config_override in vllm/config/speculative.py). DeepSeek
 *  V4.1 is left out: it ships DSpark stages, and vLLM rejects method "mtp" for it. */
const VLLM_MTP_TYPES = new Set([
  "deepseek_v3", "deepseek_v32", "glm_moe_dsa", "deepseek_v4", "pangu_ultra_moe", "kimi_k3", "ernie4_5_moe",
  "nemotron_h", "nemotron_h_puzzle", "qwen3_next", "qwen4_exp", "qwen4_exp_text", "qwen3_5", "qwen3_5_moe",
  "qwen3_5_text", "qwen3_5_moe_text", "exaone_moe", "exaone4_5", "longcat_flash", "longcat_flash_ngram", "hy_v3",
  "hy_v4", "intern_s2_preview", "interns2_mobius", "glm5_next", "dots3_note", "inkling_model", "inkling_mm_model",
  "minimax_m3_vl", "step3p5", "step3p7", "bailing_hybrid",
]);
const VLLM_MTP_ARCHS = new Set([
  "MiMoForCausalLM", "MiMoV2ForCausalLM", "MiMoV2FlashForCausalLM", "MiMoV2OmniForCausalLM", "Glm4MoeForCausalLM",
  "Glm4MoeLiteForCausalLM", "GlmOcrForConditionalGeneration", "BailingMoeV2_5ForCausalLM", "Step3p5ForCausalLM",
  "Step3p7ForConditionalGeneration",
]);
/** Families SGLang 0.5.21 ships an MTP/NextN draft model for (python/sglang/srt/models/*_nextn.py, *_mtp.py). */
const SGLANG_MTP_TYPES = new Set([
  "deepseek_v3", "deepseek_v32", "deepseek_v4", "glm4_moe", "glm4_moe_lite", "glm5_next", "qwen3_next", "qwen3_5",
  "qwen3_5_moe", "qwen3_5_text", "qwen3_5_moe_text", "qwen4_exp", "qwen4_exp_text", "nemotron_h", "longcat_flash",
  "exaone_moe", "step3p5",
]);
const SGLANG_MTP_ARCHS = new Set(["MiMoForCausalLM", "MiMoV2ForCausalLM", "MiMoV2FlashForCausalLM"]);

function mtpOf(s: RepoSnapshot): Facts["mtp"] {
  const c = textCfg(s.config);
  let declared: number | undefined;
  let field: string | undefined;
  for (const f of MTP_FIELDS) {
    const v = c?.[f] ?? s.config?.[f];
    if (typeof v === "number") {
      declared = v;
      field = c?.[f] !== undefined && c !== s.config ? `text_config.${f}` : f;
      break;
    }
  }
  const types = [String(c?.model_type ?? ""), String(s.config?.model_type ?? "")];
  const archs: string[] = Array.isArray(s.config?.architectures) ? s.config.architectures : [];
  const vllm = types.some((t) => VLLM_MTP_TYPES.has(t)) || archs.some((a) => VLLM_MTP_ARCHS.has(a));
  const sglang = types.some((t) => SGLANG_MTP_TYPES.has(t)) || archs.some((a) => SGLANG_MTP_ARCHS.has(a));

  const d = s.tensors;
  let tensors = 0;
  let where: string | undefined;
  if (d) {
    // DeepSeek and GLM append the MTP block to the decoder stack as layer N…
    const L = c?.num_hidden_layers;
    const main = mainStack(d);
    if (main && typeof L === "number") {
      const extra = Object.entries(d.stacks[main]).filter(([i]) => Number(i) >= L);
      tensors = extra.reduce((a, [, n]) => a + n, 0);
      if (tensors) where = `${main}.${extra.map(([i]) => i).join(",")}.*`;
    }
    // …Qwen3-Next and MiMo keep it under a name of its own.
    if (!tensors) {
      const named = Object.keys(d.templates).filter((t) => /(^|\.)(mtp|nextn)([._]|$)/.test(t));
      tensors = named.reduce((a, t) => a + d.templates[t], 0);
      // "model.mtp_layers.{n}." reads better as "model.mtp_layers.*".
      if (tensors) where = commonPrefix(named).replace(/(\.\{n\})+\.$/, ".") + "*";
    }
  }
  const status: MtpStatus = tensors
    ? "ready"
    : declared && declared > 0
      ? d
        ? "missing"
        : "unverified"
      : "none";
  return { declared, field, tensors, where, status, vllm, sglang };
}

function commonPrefix(xs: string[]): string {
  if (!xs.length) return "";
  let p = xs[0];
  for (const x of xs) while (!x.startsWith(p)) p = p.slice(0, p.lastIndexOf(".", p.length - 2) + 1);
  return p;
}

// ── the brief ─────────────────────────────────────────────────────────────

export function buildBrief(s: RepoSnapshot, lang: Lang): ServingBrief {
  const cfg = s.config;
  const c = textCfg(cfg);
  const fmt = formatOf(s);
  const template = s.chatTemplate ? readTemplate(s.chatTemplate) : null;
  const mistralCommon = has(s, "tekken.json") && !template;
  const role = roleOf(s, fmt.format, template, mistralCommon);
  const fam = role === "chat" ? familyOf(s, template) : undefined;
  // A tool parser is only worth naming when something renders tools into the
  // prompt: the repository's template, the engine's own template, or mistral-common.
  const enginePick = (p: Parsers | undefined): Parsers =>
    p ? (template?.tools || p.template || mistralCommon ? p : { reasoning: p.reasoning }) : {};
  const archFiles = s.files.filter((f) => top(f) && /^(modeling|configuration)_\w+\.py$/.test(f.name)).map((f) => f.name);
  const tokFiles = s.files.filter((f) => top(f) && /^tokenization_\w+\.py$/.test(f.name)).map((f) => f.name);
  const archMap = cfg?.auto_map && Object.keys(cfg.auto_map).some((k) => /^AutoModel/.test(k));
  const tokMap = !!s.tokenizerConfig?.auto_map;
  const declared = declaredQuant(s);
  const tq = s.tensors ? tensorQuant(s.tensors) : undefined;
  const kvScales =
    (s.tensors ? suffixCount(s.tensors, "k_scale", "v_scale") > 0 : false) ||
    !!(cfg?.quantization_config ?? c?.quantization_config)?.kv_cache_scheme ||
    !!s.hfQuantConfig?.quantization?.kv_cache_quant_algo;
  const genEos = asIds(s.generationConfig?.eos_token_id);
  const cfgEos = asIds(cfg?.eos_token_id ?? c?.eos_token_id);

  const facts: Facts = {
    role,
    ...fmt,
    derivedFrom: derivedFrom(s),
    vision: !!(cfg?.vision_config || has(s, "preprocessor_config.json") || (s.tensors && countWhere(s.tensors, (t) => /^(model\.)?(visual|vision_tower|vision_model)\./.test(t)) > 0)),
    audio: !!(cfg?.audio_config || (s.tensors && countWhere(s.tensors, (t) => /^(model\.)?audio_tower\./.test(t)) > 0)),
    template,
    mistralCommon,
    family: fam?.id,
    parsers: { vllm: enginePick(fam?.vllm), sglang: enginePick(fam?.sglang) },
    quant: { declared, tensors: tq, kvScales, kept: keptModules(s) },
    mtp: mtpOf(s),
    // Only a config that names its own end tokens can name too few.
    eos: { config: cfgEos, generation: genEos, extra: cfgEos.length ? genEos.filter((x) => !cfgEos.includes(x)) : [] },
    remoteCode: { arch: !!archMap || archFiles.length > 0, tokenizer: tokMap || tokFiles.length > 0, files: [...archFiles, ...tokFiles] },
  };

  const gotchas: Gotcha[] = [];
  const g = (section: SectionId, severity: Gotcha["severity"], k: string, v?: Part["v"]) => gotchas.push({ section, severity, k, v });

  const sections: Section[] = [
    repoSection(s, facts, lang, g),
    chatSection(s, facts, g),
    samplingSection(s, facts, g),
    weightsSection(s, facts, lang, g),
    mtpSection(facts, lang, g),
    contextSection(s, c, lang, g),
    loadSection(s, facts, g),
  ].filter((x): x is Section => !!x);

  return {
    facts,
    portrait: portraitOf(facts, lang),
    gotchas: gotchas.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "warn" ? -1 : 1)),
    sections,
    commands: { vllm: vllmCommand(s, facts), sglang: sglangCommand(s, facts) },
  };
}

type G = (section: SectionId, severity: Gotcha["severity"], k: string, v?: Part["v"]) => void;

function repoSection(s: RepoSnapshot, f: Facts, lang: Lang, g: G): Section {
  const parts: Part[] = [];
  const cites: Cite[] = [];
  const size = f.weightBytes ? fmtBytes(f.weightBytes, lang) : "";
  switch (f.format) {
    case "safetensors": {
      const file = s.tensorFile ?? (f.shards > 1 ? "model.safetensors.index.json" : "model.safetensors");
      parts.push({ k: f.shards > 1 ? "repo.safetensorsShards" : "repo.safetensorsOne", v: { n: f.shards, size } });
      cites.push({ file, value: s.tensors ? tensorsWord(s.tensors.total, lang) : undefined });
      break;
    }
    case "mistral":
      parts.push({ k: "repo.mistral", v: { n: f.shards, size } });
      cites.push({ file: "params.json" });
      if (has(s, "config.json") && s.files.some((x) => top(x) && /^model[\w.-]*\.safetensors$/.test(x.name))) parts.push({ k: "repo.mistralAlsoHf" });
      break;
    case "gguf": {
      const labels = f.gguf.slice(0, 6).map((x) => x.label).join(", ");
      parts.push({ k: "repo.gguf", v: { n: f.gguf.length, labels } });
      cites.push({ file: "*.gguf", value: `${f.shards} files` });
      if (s.config) g("repo", "warn", "g.ggufConfig");
      break;
    }
    case "adapter":
      parts.push({ k: "repo.adapter", v: { r: s.adapterConfig?.r ?? "?", type: String(s.adapterConfig?.peft_type ?? "LoRA") } });
      cites.push({ file: "adapter_config.json", key: "r", value: json(s.adapterConfig?.r ?? "") });
      break;
    case "pytorch":
      parts.push({ k: "repo.pytorch", v: { n: f.shards, s: s_(f.shards), size } });
      cites.push({ file: "pytorch_model.bin" });
      g("repo", "warn", "g.pickle");
      break;
    case "none":
      parts.push({ k: "repo.noWeights" });
  }
  if (f.derivedFrom) parts.push({ k: `repo.derived.${f.derivedFrom.relation}`, v: { base: f.derivedFrom.id } });
  switch (f.role) {
    case "embedding":
      parts.push({ k: "repo.role.embedding" });
      cites.push(has(s, "modules.json") ? { file: "modules.json" } : { file: "api", key: "pipeline_tag", value: s.pipelineTag });
      break;
    case "reranker":
      parts.push({ k: "repo.role.reranker" });
      break;
    case "draft":
      parts.push({ k: "repo.role.draft" });
      cites.push({ file: "config.json", key: "architectures", value: json(s.config?.architectures ?? "") });
      g("repo", "info", "g.draft");
      break;
    case "adapter":
      if (f.derivedFrom) g("repo", "info", "g.adapterBase", { base: f.derivedFrom.id });
      break;
    case "base":
      if (f.format !== "none") parts.push({ k: "repo.role.base" });
      break;
  }
  if (f.vision || f.audio) parts.push({ k: f.vision && f.audio ? "repo.visionAudio" : f.vision ? "repo.vision" : "repo.audio" });
  if (s.gated) g("repo", "info", "g.gated");
  if (s.unreadable?.length) g("repo", "warn", "g.unreadable", { files: s.unreadable.slice(0, 4).join(", ") });
  return { id: "repo", parts, cites };
}

function chatSection(s: RepoSnapshot, f: Facts, g: G): Section | null {
  if (f.role === "embedding" || f.role === "reranker" || f.role === "adapter" || f.role === "draft" || f.role === "unknown") return null;
  const t = f.template;
  const parts: Part[] = [];
  const cites: Cite[] = [];
  if (!t) {
    if (f.mistralCommon) {
      parts.push({ k: "chat.mistralCommon" });
      cites.push({ file: "tekken.json" });
      if (has(s, "SYSTEM_PROMPT.txt")) {
        parts.push({ k: "chat.systemPromptFile" });
        cites.push({ file: "SYSTEM_PROMPT.txt" });
      }
      return { id: "chat", parts, cites };
    }
    parts.push({ k: "chat.none" });
    if (f.role === "base" && f.format !== "none") g("chat", "warn", "g.noTemplate");
    return { id: "chat", parts, cites, tone: "warn" };
  }
  parts.push({ k: "chat.template", v: { file: t.file } });
  cites.push({ file: t.file, key: t.file === "chat_template.jinja" ? undefined : "chat_template" });
  const engineTemplate = !!(f.parsers.vllm.template || f.parsers.sglang.template);
  parts.push({ k: t.tools ? (t.toolFormat ? `chat.tools.${t.toolFormat}` : "chat.tools") : engineTemplate ? "chat.noToolsEngine" : "chat.noTools" });
  if (t.reasoning) parts.push({ k: t.thinkToggle ? `chat.reasoning.${t.thinkToggle}` : "chat.reasoning" });
  if (t.images && f.vision) parts.push({ k: "chat.images" });
  if (t.noSystem) {
    parts.push({ k: "chat.noSystem" });
    g("chat", "info", "g.noSystem");
  }
  if (t.alternation) parts.push({ k: "chat.alternation" });
  if (f.parsers.vllm.template || f.parsers.sglang.template) g("chat", "info", "g.engineTemplate");
  return { id: "chat", parts, cites };
}

const SAMPLING_KEYS = ["temperature", "top_p", "top_k", "min_p", "repetition_penalty", "presence_penalty", "frequency_penalty"] as const;

function samplingSection(s: RepoSnapshot, f: Facts, g: G): Section | null {
  if (f.role === "embedding" || f.role === "reranker" || f.role === "adapter" || f.role === "draft") return null;
  const gc = s.generationConfig;
  const parts: Part[] = [];
  const cites: Cite[] = [];
  if (!gc) {
    if (f.format === "none" && !s.config) return null;
    parts.push({ k: has(s, "generation_config.json") ? "sampling.unread" : "sampling.none" });
    return { id: "sampling", parts, cites };
  }
  const set = SAMPLING_KEYS.filter((k) => typeof gc[k] === "number");
  if (set.length) {
    parts.push({ k: "sampling.set", v: { list: set.map((k) => `${k} ${gc[k]}`).join(", ") } });
    for (const k of set) cites.push({ file: "generation_config.json", key: k, value: String(gc[k]) });
    if (gc.do_sample === false) parts.push({ k: "sampling.greedy" });
    parts.push({ k: "sampling.engines" });
  } else parts.push({ k: gc.do_sample === false ? "sampling.greedyOnly" : "sampling.noValues" });
  if (f.eos.extra.length) {
    parts.push({ k: "sampling.eosExtra", v: { gen: f.eos.generation.join(", "), cfg: f.eos.config.join(", ") || "—" } });
    cites.push({ file: "generation_config.json", key: "eos_token_id", value: json(s.generationConfig.eos_token_id) });
    if (f.eos.config.length) cites.push({ file: "config.json", key: "eos_token_id", value: json(s.config?.eos_token_id ?? textCfg(s.config).eos_token_id) });
    g("sampling", "info", "g.eosExtra", { n: f.eos.extra.length, s: s_(f.eos.extra.length) });
  }
  const mnt = gc.max_new_tokens;
  if (typeof mnt === "number") {
    parts.push({ k: "sampling.maxNew", v: { n: mnt } });
    cites.push({ file: "generation_config.json", key: "max_new_tokens", value: String(mnt) });
    g("sampling", "warn", "g.maxNew", { n: mnt });
  }
  return { id: "sampling", parts, cites };
}

function weightsSection(s: RepoSnapshot, f: Facts, lang: Lang, g: G): Section | null {
  if (f.format === "none" || f.format === "gguf" || f.format === "adapter") return null;
  const parts: Part[] = [];
  const cites: Cite[] = [];
  const { declared, tensors, kvScales, kept } = f.quant;
  const tensorFile = s.tensorFile ?? "model.safetensors.index.json";
  if (declared) {
    parts.push({ k: "weights.declared", v: { label: declared.label, file: declared.file } });
    cites.push({ file: declared.file, key: declared.key + (declared.file === "config.json" ? ".quant_method" : ""), value: declared.label });
  }
  if (tensors && tensors !== "none") {
    const sfx = TENSOR_EVIDENCE[tensors];
    if (!declared) {
      parts.push({ k: "weights.tensorsOnly", v: { label: SCHEME_LABEL[tensors], sfx } });
      g("weights", "warn", "g.quantUndeclared", { label: SCHEME_LABEL[tensors] });
    } else if (!sameFamily(declared.scheme, tensors)) {
      parts.push({ k: "weights.disagree", v: { label: SCHEME_LABEL[tensors], sfx } });
      g("weights", "warn", "g.quantDisagree", { declared: declared.label, tensors: SCHEME_LABEL[tensors] });
    } else parts.push({ k: "weights.tensorsAgree", v: { sfx } });
    cites.push({ file: tensorFile, value: sfx });
  } else if (declared && tensors === "none" && declared.scheme !== "other") {
    parts.push({ k: "weights.declaredOnly" });
    g("weights", "warn", "g.quantDeclaredOnly", { label: declared.label });
  } else if (!declared && tensors === "none") {
    const td = String(textCfg(s.config).torch_dtype ?? s.config?.torch_dtype ?? s.config?.dtype ?? "");
    parts.push({ k: "weights.plain", v: { dtype: td || "?" } });
    if (td) cites.push({ file: "config.json", key: s.config?.torch_dtype ? "torch_dtype" : "dtype", value: td });
  }
  if (s.dtypeParams && Object.keys(s.dtypeParams).length) {
    const total = Object.values(s.dtypeParams).reduce((a, b) => a + b, 0);
    const mix = Object.entries(s.dtypeParams)
      .sort((a, b) => b[1] - a[1])
      .map(([d, n]) => `${d} ${pct(n / total, lang)}`)
      .join(" · ");
    parts.push({ k: "weights.mix", v: { mix } });
  }
  if (kept.length) {
    parts.push({ k: "weights.kept", v: { n: kept.length, s: s_(kept.length), list: kept.slice(0, 3).map((x) => short(x, 28)).join(", ") } });
    cites.push({ file: declared?.file ?? "config.json", key: keptKey(s), value: short(kept[0], 28) });
  }
  if (kvScales) parts.push({ k: "weights.kvScales" });
  if (f.weightBytes) parts.push({ k: "weights.size", v: { size: fmtBytes(f.weightBytes, lang), n: f.shards, s: s_(f.shards) } });
  return { id: "weights", parts, cites };
}

const TENSOR_EVIDENCE: Record<QuantScheme, string> = {
  none: "",
  "fp8-block": "*.weight_scale_inv",
  fp8: "*.weight_scale",
  nvfp4: "*.weight_scale_2 / *.weight_global_scale",
  mxfp4: "*_blocks + *_scales",
  awq: "*.qweight + *.qzeros",
  gptq: "*.qweight + *.g_idx",
  "int4-packed": "*.weight_packed",
  int8: "*.weight_scale",
  bnb: "*.absmax",
  other: "",
};

function sameFamily(a: QuantScheme, b: QuantScheme): boolean {
  if (a === b) return true;
  const fp8 = ["fp8", "fp8-block", "int8"];
  if (fp8.includes(a) && fp8.includes(b)) return true;
  // compressed-tensors packs 4-bit weights the same way whether integer or NVFP4.
  if ((a === "int4-packed" && b === "nvfp4") || (a === "nvfp4" && b === "int4-packed")) return true;
  if ((a === "awq" && b === "gptq") || (a === "gptq" && b === "awq")) return true;
  return a === "other";
}

/** A share as each language writes it: 99.7% in English, %99,7 in Turkish. */
function pct(x: number, lang: Lang): string {
  const n = x >= 0.9995 ? "100" : x < 0.001 ? `<${fmtNum(0.1, lang, 1)}` : fmtNum(x * 100, lang, 1);
  return lang === "tr" ? (n.startsWith("<") ? `<%${n.slice(1)}` : `%${n}`) : `${n}%`;
}

function mtpSection(f: Facts, lang: Lang, g: G): Section | null {
  const m = f.mtp;
  if (m.status === "none" && !(m.declared === 0)) return null;
  const parts: Part[] = [];
  const cites: Cite[] = [];
  if (m.field) cites.push({ file: "config.json", key: m.field, value: String(m.declared) });
  if (m.where) cites.push({ file: "model.safetensors.index.json", key: m.where, value: tensorsWord(m.tensors, lang) });
  switch (m.status) {
    case "ready":
      parts.push({ k: m.declared ? "mtp.ready" : "mtp.readyUndeclared", v: { n: m.declared ?? 1, s: s_(m.declared ?? 1), t: fmtInt(m.tensors, lang), where: m.where ?? "" } });
      parts.push({ k: m.vllm && m.sglang ? "mtp.engines.both" : m.vllm ? "mtp.engines.vllm" : m.sglang ? "mtp.engines.sglang" : "mtp.engines.none" });
      if (!m.vllm && !m.sglang) g("mtp", "info", "g.mtpNoEngine");
      parts.push({ k: "mtp.memory" });
      break;
    case "missing":
      parts.push({ k: "mtp.missing", v: { n: m.declared ?? 0, s: s_(m.declared ?? 0), field: m.field ?? "" } });
      g("mtp", "warn", "g.mtpMissing", { field: m.field ?? "" });
      break;
    case "unverified":
      parts.push({ k: "mtp.unverified", v: { n: m.declared ?? 0, s: s_(m.declared ?? 0) } });
      break;
    case "none":
      parts.push({ k: "mtp.zero", v: { field: m.field ?? "" } });
  }
  return { id: "mtp", parts, cites, tone: m.status === "missing" ? "warn" : undefined };
}

function contextSection(s: RepoSnapshot, c: Json, lang: Lang, g: G): Section | null {
  const max = c?.max_position_embeddings ?? c?.n_positions ?? c?.max_seq_len ?? s.mistralParams?.max_seq_len;
  if (typeof max !== "number") return null;
  const parts: Part[] = [];
  const cites: Cite[] = [];
  const pre = s.config?.text_config ? "text_config." : "";
  const key = c?.max_position_embeddings !== undefined ? "max_position_embeddings" : c?.n_positions !== undefined ? "n_positions" : "max_seq_len";
  parts.push({ k: "context.max", v: { n: fmtInt(max, lang) } });
  cites.push({ file: s.config ? "config.json" : "params.json", key: pre + key, value: String(max) });
  const rope = c?.rope_scaling ?? c?.rope_parameters;
  const type = String(rope?.rope_type ?? rope?.type ?? "");
  // M-RoPE splits positions for images; it does not stretch the context.
  if (rope && type && type !== "default" && type !== "mrope") {
    const orig = rope.original_max_position_embeddings;
    parts.push({
      k: typeof orig === "number" && typeof rope.factor === "number" ? "context.scaled" : "context.scaledPlain",
      v: { type, f: String(rope.factor ?? "?"), o: typeof orig === "number" ? shortTokens(orig, lang) : "" },
    });
    cites.push({ file: "config.json", key: pre + (c?.rope_scaling ? "rope_scaling" : "rope_parameters"), value: type });
  }
  const tml = s.tokenizerConfig?.model_max_length;
  if (typeof tml === "number" && tml < max) {
    parts.push({ k: "context.tokenizerShorter", v: { n: fmtInt(tml, lang) } });
    cites.push({ file: "tokenizer_config.json", key: "model_max_length", value: String(tml) });
    g("context", "info", "g.tokenizerShorter", { n: fmtInt(tml, lang) });
  }
  const sw = c?.sliding_window;
  if (typeof sw === "number" && c?.use_sliding_window !== false) {
    const lt: unknown[] = Array.isArray(c?.layer_types) ? c.layer_types : [];
    const sliding = lt.filter((x) => x === "sliding_attention").length;
    parts.push({ k: sliding ? "context.slidingSome" : "context.sliding", v: { w: fmtInt(sw, lang), n: sliding, L: lt.length } });
    cites.push({ file: "config.json", key: pre + "sliding_window", value: String(sw) });
  }
  return { id: "context", parts, cites };
}

function loadSection(s: RepoSnapshot, f: Facts, g: G): Section | null {
  const parts: Part[] = [];
  const cites: Cite[] = [];
  const archs: string[] = Array.isArray(s.config?.architectures) ? s.config.architectures : [];
  if (archs.length) {
    parts.push({ k: "load.arch", v: { arch: archs[0] } });
    cites.push({ file: "config.json", key: "architectures", value: archs[0] });
  }
  const rc = f.remoteCode;
  if (rc.arch || rc.tokenizer) {
    parts.push({ k: rc.tokenizer ? (rc.arch ? "load.remoteBoth" : "load.remoteTokenizer") : "load.remoteArch", v: { files: rc.files.slice(0, 3).join(", ") || "auto_map" } });
    if (s.config?.auto_map) cites.push({ file: "config.json", key: "auto_map", value: Object.keys(s.config.auto_map).slice(0, 2).join(", ") });
    if (s.tokenizerConfig?.auto_map) cites.push({ file: "tokenizer_config.json", key: "auto_map" });
    g("load", "warn", "g.remoteCode");
  } else if (archs.length) parts.push({ k: "load.native" });
  if (f.format === "mistral") parts.push({ k: "load.mistralFormat" });
  if (f.format === "gguf") parts.push({ k: "load.gguf" });
  if (f.role === "adapter" && f.derivedFrom) parts.push({ k: "load.adapter", v: { base: f.derivedFrom.id } });
  if (s.gated) parts.push({ k: "load.gated" });
  return parts.length ? { id: "load", parts, cites } : null;
}

// ── in short ──────────────────────────────────────────────────────────────

/** What a chat model can do, as the portrait lists it. */
const ABILITY: Record<string, Record<Lang, string>> = {
  tools: { en: "tool calling", tr: "araç çağırma" },
  reason: { en: "reasoning", tr: "akıl yürütme" },
  reasonToggle: { en: "reasoning that can be switched off", tr: "kapatılabilen akıl yürütme" },
  vision: { en: "image input", tr: "görüntü girdisi" },
};

const listOf = (xs: string[], lang: Lang) =>
  xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${lang === "tr" ? "ve" : "and"} ${xs[xs.length - 1]}`;

function portraitOf(f: Facts, lang: Lang): Part[] {
  const out: Part[] = [];
  const t = f.template;
  switch (f.role) {
    case "chat": {
      const abil = [
        t?.tools || f.mistralCommon ? ABILITY.tools[lang] : "",
        t?.reasoning ? (t.thinkToggle ? ABILITY.reasonToggle[lang] : ABILITY.reason[lang]) : "",
        f.vision ? ABILITY.vision[lang] : "",
      ].filter(Boolean);
      out.push(abil.length ? { k: "p.chatWith", v: { abil: listOf(abil, lang) } } : { k: "p.chat" });
      break;
    }
    case "base":
      out.push({ k: "p.base" });
      break;
    case "unknown":
      if (f.format !== "gguf") out.push({ k: f.format === "none" ? "p.empty" : "p.unread" });
      break;
    default:
      out.push({ k: `p.${f.role}`, v: { base: f.derivedFrom?.id ?? "" } });
  }
  const q = f.quant.declared?.label ?? (f.quant.tensors && f.quant.tensors !== "none" ? SCHEME_LABEL[f.quant.tensors] : null);
  if (f.format === "gguf") out.push({ k: "p.gguf", v: { n: f.gguf.length } });
  else if (f.weightBytes) out.push({ k: q ? "p.weightsQuant" : "p.weights", v: { q: q ?? "", size: fmtBytes(f.weightBytes, lang) } });
  if (f.mtp.status === "ready") out.push({ k: "p.mtpReady" });
  if (f.mtp.status === "missing") out.push({ k: "p.mtpMissing" });
  return out;
}

// ── the commands ──────────────────────────────────────────────────────────

/** Why a repository gets no launch command, if it gets none. */
function skipReason(f: Facts): string | null {
  if (f.format === "gguf") return "cmd.gguf";
  if (f.format === "none") return "cmd.noWeights";
  if (f.role === "draft") return "cmd.draft";
  return null;
}

function vllmCommand(s: RepoSnapshot, f: Facts): Command {
  const notes: Part[] = [];
  const flags: Flag[] = [];
  const skip = skipReason(f);
  if (skip) return { engine: "vllm", base: null, flags, notes: [{ k: skip }] };
  let model = s.id;
  if (f.role === "adapter") {
    if (!f.derivedFrom) return { engine: "vllm", base: null, flags, notes: [{ k: "cmd.adapterNoBase" }] };
    model = f.derivedFrom.id;
    flags.push({ flag: "--enable-lora", why: { k: "why.lora" } });
    flags.push({ flag: "--lora-modules", value: `${s.id.split("/").pop()}=${s.id}`, why: { k: "why.loraModules" } });
  }
  if (f.role === "embedding") flags.push({ flag: "--runner", value: "pooling", why: { k: "why.pooling" } });
  if (f.remoteCode.arch || f.remoteCode.tokenizer) flags.push({ flag: "--trust-remote-code", why: { k: "why.remote" } });
  const p = f.parsers.vllm;
  if (p.tool) {
    flags.push({ flag: "--enable-auto-tool-choice", why: { k: "why.autoTool" } });
    flags.push({ flag: "--tool-call-parser", value: p.tool, why: { k: "why.toolParser", v: { fmt: f.template?.toolFormat ?? f.family ?? "" } } });
    if (p.template) flags.push({ flag: "--chat-template", value: p.template, why: { k: "why.engineTemplate", v: { engine: "vLLM" } } });
  }
  if (p.reasoning) flags.push({ flag: "--reasoning-parser", value: p.reasoning, why: { k: "why.reasoningParser" } });
  if (f.mtp.status === "ready" && f.mtp.vllm)
    flags.push({ flag: "--speculative-config", value: `'{"method":"mtp","num_speculative_tokens":${f.mtp.declared || 1}}'`, why: { k: "why.mtp" } });
  if (f.quant.kvScales) flags.push({ flag: "--kv-cache-dtype", value: "fp8", why: { k: "why.kvFp8" } });
  if (f.format === "mistral") notes.push({ k: "cmd.mistral" });
  if (s.gated) notes.push({ k: "cmd.token" });
  if (f.template?.tools && !p.tool && f.role === "chat") notes.push({ k: "cmd.noParser", v: { engine: "vLLM" } });
  return { engine: "vllm", base: `vllm serve ${model}`, flags, notes };
}

function sglangCommand(s: RepoSnapshot, f: Facts): Command {
  const notes: Part[] = [];
  const flags: Flag[] = [];
  const skip = skipReason(f);
  if (skip) return { engine: "sglang", base: null, flags, notes: [{ k: skip }] };
  let model = s.id;
  if (f.role === "adapter") {
    if (!f.derivedFrom) return { engine: "sglang", base: null, flags, notes: [{ k: "cmd.adapterNoBase" }] };
    model = f.derivedFrom.id;
    flags.push({ flag: "--enable-lora", why: { k: "why.lora" } });
    flags.push({ flag: "--lora-paths", value: `${s.id.split("/").pop()}=${s.id}`, why: { k: "why.loraModules" } });
  }
  if (f.role === "embedding") flags.push({ flag: "--is-embedding", why: { k: "why.pooling" } });
  if (f.remoteCode.arch || f.remoteCode.tokenizer) flags.push({ flag: "--trust-remote-code", why: { k: "why.remote" } });
  const p = f.parsers.sglang;
  if (p.tool) flags.push({ flag: "--tool-call-parser", value: p.tool, why: { k: "why.toolParser", v: { fmt: f.template?.toolFormat ?? f.family ?? "" } } });
  if (p.tool && p.template) flags.push({ flag: "--chat-template", value: p.template, why: { k: "why.engineTemplate", v: { engine: "SGLang" } } });
  if (p.reasoning) flags.push({ flag: "--reasoning-parser", value: p.reasoning, why: { k: "why.reasoningParser" } });
  if (f.mtp.status === "ready" && f.mtp.sglang) {
    // The values SGLang's speculative-decoding guide uses for one MTP layer.
    flags.push({ flag: "--speculative-algorithm", value: "EAGLE", why: { k: "why.mtpSglang" } });
    flags.push({ flag: "--speculative-num-steps", value: "1", why: { k: "why.mtpSteps" } });
    flags.push({ flag: "--speculative-eagle-topk", value: "1", why: { k: "why.mtpSteps" } });
    flags.push({ flag: "--speculative-num-draft-tokens", value: "2", why: { k: "why.mtpSteps" } });
  }
  if (s.gated) notes.push({ k: "cmd.token" });
  if (f.template?.tools && !p.tool && f.role === "chat") notes.push({ k: "cmd.noParser", v: { engine: "SGLang" } });
  return { engine: "sglang", base: `python3 -m sglang.launch_server --model-path ${model}`, flags, notes };
}

/** A command as the shell takes it, one flag per line. */
export function commandText(c: Command): string {
  if (!c.base) return "";
  return [c.base, ...c.flags.map((f) => `  ${f.flag}${f.value !== undefined ? " " + f.value : ""}`)].join(" \\\n");
}

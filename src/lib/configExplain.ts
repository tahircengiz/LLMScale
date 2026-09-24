// The Config Decoder engine: turns a model's config.json into the answers a
// capacity planner asks for, a plain-language reading of every field, and the
// file itself as numbered lines that answers can point back to.
//
// Every answer carries the paths it was computed from ("cites"), so the page can
// light up the exact lines of the real file behind each sentence. Numbers are the
// engine's own (calc.ts, moe.ts, hf.ts), so this page and the calculator never
// disagree about the same model.
//
// Sentences live in the dictionary as `config.a.*` templates; this module returns
// template keys plus the values to fill them with. It formats numbers itself,
// because Turkish groups thousands with a dot.
//
// React-free: scripts/test-config.ts runs it against real configs.

import { BYTES_PER_GIB, kvBytesPerToken, resolveHeadDim, usesMla, type Dtype, type ModelArch } from "./calc.ts";
import { archFromConfig } from "./hf.ts";
import { activeParamsOf, expertCount, expertsPerToken } from "./moe.ts";
import { formatParams } from "./format.ts";
import type { Lang } from "./dict.ts";
import { lookupField, type FieldGroup, type GlossaryEntry, type Relevance } from "./configGlossary.ts";

// Configs are free-form JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

// ── number formatting ─────────────────────────────────────────────────────

function nf(lang: Lang, digits = 0): Intl.NumberFormat {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: digits });
}
export const fmtInt = (n: number, lang: Lang) => nf(lang).format(n);
export const fmtNum = (n: number, lang: Lang, digits = 2) => nf(lang, digits).format(n);

/** 131072 → "128k", 40960 → "40k", 2047 → "≈2k", 1048576 → "1M". */
export function shortTokens(n: number, lang: Lang): string {
  if (n >= 1024 * 1024 && n % (1024 * 1024) === 0) return `${fmtInt(n / (1024 * 1024), lang)}M`;
  if (n < 1024) return fmtInt(n, lang);
  const k = n / 1024;
  return Number.isInteger(k) ? `${fmtInt(k, lang)}k` : `≈${fmtNum(k, lang, 0)}k`;
}

/** A parameter count to the precision an estimate deserves: 40B, 3.3B. */
export function roughParams(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 10e9) return `${Math.round(n / 1e9)}B`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  return formatParams(n);
}

/** Bytes with binary units, in the page's language. */
export function fmtBytes(bytes: number, lang: Lang): string {
  if (bytes < 1024) return `${fmtInt(bytes, lang)} B`;
  if (bytes < 1024 ** 2) return `${fmtNum(bytes / 1024, lang, 1)} KiB`;
  if (bytes < 1024 ** 3) return `${fmtNum(bytes / 1024 ** 2, lang, 1)} MiB`;
  return `${fmtNum(bytes / BYTES_PER_GIB, lang, 2)} GiB`;
}

const WORDS: Record<string, Record<Lang, string>> = {
  tokens: { en: "tokens", tr: "token" },
  yes: { en: "Yes", tr: "Evet" },
  no: { en: "No", tr: "Hayır" },
  none: { en: "none", tr: "yok" },
  fields: { en: "fields", tr: "alan" },
  items: { en: "items", tr: "öğe" },
  ids: { en: "ids", tr: "kimlik" },
  bytesPerParam: { en: "bytes per parameter", tr: "bayt / parametre" },
  layers: { en: "layers", tr: "katman" },
};
const w = (k: string, lang: Lang) => WORDS[k]?.[lang] ?? k;
/** English plurals after a count of one. Turkish keeps the noun singular after
 *  any number, so it needs no entry. */
const SINGULAR: Record<string, string> = { layers: "layer", heads: "head", experts: "expert", tokens: "token", ids: "id" };

const DTYPE_NAMES: Record<string, { label: string; bytes: number }> = {
  bfloat16: { label: "BF16", bytes: 2 },
  float16: { label: "FP16", bytes: 2 },
  float32: { label: "FP32", bytes: 4 },
  float8_e4m3fn: { label: "FP8", bytes: 1 },
  float8_e5m2: { label: "FP8", bytes: 1 },
};

const ACT_NAMES: Record<string, Record<Lang, string>> = {
  silu: { en: "SiLU — usually a gated SwiGLU block", tr: "SiLU — genellikle kapılı bir SwiGLU bloğu" },
  swiglu: { en: "SwiGLU", tr: "SwiGLU" },
  gelu: { en: "GELU", tr: "GELU" },
  gelu_new: { en: "GELU (tanh approximation)", tr: "GELU (tanh yaklaşımı)" },
  gelu_pytorch_tanh: { en: "GELU (tanh approximation) — gated (GeGLU) in Gemma's language model", tr: "GELU (tanh yaklaşımı) — Gemma'nın dil modelinde kapılı (GeGLU)" },
  relu: { en: "ReLU", tr: "ReLU" },
  relu2: { en: "squared ReLU", tr: "karesi alınmış ReLU" },
};

const ROPE_TYPES: Record<string, Record<Lang, string>> = {
  yarn: {
    en: "YaRN — stretches low frequencies, keeps high ones, and corrects attention's temperature",
    tr: "YaRN — düşük frekansları esnetir, yüksekleri korur ve attention'ın sıcaklığını düzeltir",
  },
  llama3: {
    en: "Llama 3 — long wavelengths stretched, short ones kept, the band between blended",
    tr: "Llama 3 — uzun dalga boyları esnetilir, kısalar korunur, aradaki bant harmanlanır",
  },
  linear: { en: "linear — every position divided by the factor", tr: "lineer — her konum çarpana bölünür" },
  dynamic: {
    en: "dynamic NTK — the base grows only once the input outruns the original length",
    tr: "dinamik NTK — taban yalnızca girdi özgün uzunluğu aştığında büyür",
  },
  longrope: {
    en: "LongRoPE — separate per-dimension factors for short and long inputs",
    tr: "LongRoPE — kısa ve uzun girdiler için ayrı, boyut başına çarpanlar",
  },
  su: {
    en: "LongRoPE — separate per-dimension factors for short and long inputs",
    tr: "LongRoPE — kısa ve uzun girdiler için ayrı, boyut başına çarpanlar",
  },
  mrope: {
    en: "M-RoPE — positions split across time, height and width for images and video",
    tr: "M-RoPE — görüntü ve video için konumlar zaman, yükseklik ve genişliğe bölünür",
  },
  default: { en: "none — plain RoPE", tr: "yok — düz RoPE" },
};

/** The sentence-level "what is this value" next to the raw value. */
export function humanValue(value: Json, entry: GlossaryEntry | undefined, lang: Lang): string | undefined {
  if (value === null || value === undefined) return w("none", lang);
  const kind = entry?.kind;
  if (typeof value === "boolean") {
    if (value && entry?.yes) return entry.yes[lang];
    if (!value && entry?.no) return entry.no[lang];
    return w(value ? "yes" : "no", lang);
  }
  switch (kind) {
    case "tokens":
      return typeof value === "number" ? `${fmtInt(value, lang)} ${w("tokens", lang)} · ${shortTokens(value, lang)}` : undefined;
    case "count": {
      if (typeof value !== "number") return undefined;
      const unit = entry?.unit?.[lang] ?? "";
      return `${fmtInt(value, lang)} ${value === 1 ? (SINGULAR[unit] ?? unit) : unit}`.trim();
    }
    case "number":
      return typeof value === "number" && Math.abs(value) >= 1000 ? fmtInt(value, lang) : undefined;
    case "dtype": {
      const d = DTYPE_NAMES[String(value)];
      return d ? `${d.label} · ${d.bytes} ${w("bytesPerParam", lang)}` : undefined;
    }
    case "raw":
      return undefined;
    case "act":
      return ACT_NAMES[String(value)]?.[lang];
    case "ropeType":
      return ROPE_TYPES[String(value)]?.[lang];
    case "ids":
      return Array.isArray(value) ? `${value.length} ${value.length === 1 ? (SINGULAR[w("ids", lang)] ?? w("ids", lang)) : w("ids", lang)}` : undefined;
    case "layerTypes":
      return Array.isArray(value) ? tally(value.map(String), lang) : undefined;
    case "hybridPattern":
      return typeof value === "string" ? tally([...value].map((ch) => PATTERN_CHAR[ch]?.[lang] ?? ch), lang) : undefined;
  }
  if (Array.isArray(value)) return `${value.length} ${w("items", lang)}`;
  if (typeof value === "object") return `${Object.keys(value).length} ${w("fields", lang)}`;
  return undefined;
}

const PATTERN_CHAR: Record<string, Record<Lang, string>> = {
  M: { en: "Mamba", tr: "Mamba" },
  "*": { en: "attention", tr: "attention" },
  "-": { en: "feed-forward", tr: "ileri besleme" },
  E: { en: "mixture-of-experts", tr: "mixture-of-experts" },
};

/** "24 layers: 12 sliding_attention, 12 full_attention". */
function tally(items: string[], lang: Lang): string {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
  const parts = [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${fmtInt(n, lang)} ${k}`);
  return `${fmtInt(items.length, lang)} ${w("layers", lang)}: ${parts.join(", ")}`;
}

// ── the file as lines ─────────────────────────────────────────────────────

export interface JsonLine {
  /** Nesting depth, for indentation. */
  depth: number;
  /** The key on this line, if any (quoted in the rendered text). */
  key?: string;
  /** Rendered value or bracket, e.g. `4096,` or `{` or `},`. */
  text: string;
  /** The field this line belongs to: "rope_scaling.factor"; a closing bracket
   *  belongs to the object it closes. */
  path: string;
  /** The JSON type of the value on this line, for colouring. */
  kind: "string" | "number" | "boolean" | "null" | "open" | "close" | "array";
}

const scalarKind = (v: Json): JsonLine["kind"] =>
  v === null ? "null" : typeof v === "string" ? "string" : typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : "array";

const isFlatArray = (v: Json) => Array.isArray(v) && v.every((x) => x === null || typeof x !== "object");

/** Serialise a config into lines, keeping the source's key order. Arrays of plain
 *  values stay on one line, as Hugging Face's own files mostly print them. */
export function jsonLines(value: Json): JsonLine[] {
  const out: JsonLine[] = [];
  const walk = (v: Json, key: string | undefined, path: string, depth: number, last: boolean) => {
    const comma = last ? "" : ",";
    if (v !== null && typeof v === "object" && !isFlatArray(v)) {
      const isArr = Array.isArray(v);
      const entries: [string, Json][] = isArr ? v.map((x: Json, i: number) => [String(i), x]) : Object.entries(v);
      if (entries.length === 0) {
        out.push({ depth, key, text: (isArr ? "[]" : "{}") + comma, path, kind: "array" });
        return;
      }
      out.push({ depth, key, text: isArr ? "[" : "{", path, kind: "open" });
      entries.forEach(([k, x], i) =>
        walk(x, isArr ? undefined : k, path ? `${path}.${k}` : k, depth + 1, i === entries.length - 1),
      );
      out.push({ depth, text: (isArr ? "]" : "}") + comma, path, kind: "close" });
      return;
    }
    const text = Array.isArray(v) ? `[${v.map((x: Json) => JSON.stringify(x)).join(", ")}]` : JSON.stringify(v);
    out.push({ depth, key, text: text + comma, path, kind: scalarKind(v) });
  };
  walk(value, undefined, "", 0, true);
  return out;
}

/** Does a line belong to one of the cited fields (or to an object inside one)? */
export function lineCited(line: JsonLine, cites: readonly string[]): boolean {
  if (!line.path) return false;
  return cites.some((c) => line.path === c || line.path.startsWith(c + "."));
}

// ── every field, explained ────────────────────────────────────────────────

export interface ExplainedField {
  path: string;
  key: string;
  value: Json;
  /** Compact JSON of the value, as the file has it. */
  raw: string;
  human?: string;
  group: FieldGroup;
  rel: Relevance;
  match: "exact" | "pattern" | "none";
  title?: string;
  meaning?: string;
  /** A config.note.* key: how this model departs from the general meaning. */
  note?: "mlaKv" | "denseOnlyFfn" | "expertFfn" | "moeUnknownFfn" | "windowOff";
}

const ALIASES_FOR_NOTES: Record<string, string> = { num_kv_heads: "num_key_value_heads", ffn_dim: "intermediate_size", n_inner: "intermediate_size" };

/** Objects whose children are explained one by one. Anything else nested
 *  (quantization recipes, auto_map) is read as a single field. */
const OPEN_UP = new Set(["text_config", "llm_config", "rope_scaling", "rope_parameters", "quantization_config", "vision_config", "audio_config"]);

function compact(v: Json): string {
  const s = JSON.stringify(v);
  return s.length > 140 ? s.slice(0, 137) + "…" : s;
}

export function explainFields(cfg: Json, lang: Lang): ExplainedField[] {
  const out: ExplainedField[] = [];
  const add = (parent: string, key: string, value: Json, path: string, groupOverride?: FieldGroup) => {
    const hit = lookupField(parent, key);
    const entry = hit?.entry;
    out.push({
      path,
      key,
      value,
      raw: compact(value),
      human: humanValue(value, entry, lang),
      group: groupOverride ?? entry?.group ?? "other",
      rel: entry?.rel ?? "detail",
      match: hit?.match ?? "none",
      title: entry?.title[lang],
      meaning: entry?.meaning[lang],
    });
  };
  for (const [key, value] of Object.entries(cfg ?? {})) {
    if (OPEN_UP.has(key) && value && typeof value === "object" && !Array.isArray(value)) {
      // The container itself gets a row of its own, so the reader sees what the
      // block is before its fields.
      add("", key, value, key);
      const scope: FieldGroup | undefined = key === "vision_config" ? "vision" : key === "audio_config" ? "audio" : undefined;
      for (const [k, v] of Object.entries(value)) add(key, k, v, `${key}.${k}`, scope);
    } else {
      add("", key, value, key);
    }
  }
  return out;
}

// ── the answers ───────────────────────────────────────────────────────────

/** A sentence: a dictionary key under config.a.* and the values that fill it. */
export interface Part {
  k: string;
  v?: Record<string, string | number>;
}

export type QuestionId = "kind" | "size" | "context" | "kvcache" | "attention" | "experts" | "precision" | "vocab" | "load" | "training";

export interface Answer {
  id: QuestionId;
  parts: Part[];
  /** Arithmetic shown under the answer — also dictionary templates. */
  working: Part[];
  /** Fields the answer was computed from. */
  cites: string[];
  tone?: "warn";
}

export interface ConfigReport {
  /** The part of the config that describes the language model. */
  prefix: "" | "text_config." | "llm_config.";
  arch: ModelArch | null;
  answers: Answer[];
  /** One paragraph in plain words, built from the answers' facts. */
  portrait: Part[];
  fields: ExplainedField[];
  lines: JsonLine[];
}

export interface ExplainInput {
  cfg: Json;
  lang: Lang;
  /** Parameter count from the Hub, when known — the config does not carry one. */
  numParams?: number;
  /** The config was rebuilt from LLMScale's database (configFromArch), so it holds
   *  architecture numbers only: no expert counts, no precision, no class name.
   *  Answers that would need those are left out rather than guessed. */
  rebuilt?: boolean;
  /** What the database knows that the rebuilt fields cannot say. */
  isMoE?: boolean;
}

export function explainConfig({ cfg, lang, numParams = 0, rebuilt = false, isMoE: moeHint = false }: ExplainInput): ConfigReport {
  const prefix: ConfigReport["prefix"] = cfg?.text_config ? "text_config." : cfg?.llm_config ? "llm_config." : "";
  const c: Json = cfg?.text_config ?? cfg?.llm_config ?? cfg ?? {};
  const arch = archFromConfig(cfg, numParams);
  const F = (n: number) => fmtInt(n, lang);

  /** The path of the first of these keys the language model actually has. */
  const at = (...keys: string[]): string | undefined => {
    const k = keys.find((x) => c[x] !== undefined);
    return k === undefined ? undefined : prefix + k;
  };
  const top = (...keys: string[]): string | undefined => keys.find((k) => cfg?.[k] !== undefined);
  const cites = (...paths: (string | undefined)[]) => paths.filter((p): p is string => !!p);

  const answers: Answer[] = [];
  const L = arch?.numLayers ?? 0;
  const experts = expertCount(c);
  const perTok = expertsPerToken(c);
  const isMoE = !!experts && experts > 1;
  // A rebuilt config has no expert fields; the database still knows the model is MoE.
  const moeUncounted = rebuilt && moeHint && !isMoE;
  const archName: string | undefined = Array.isArray(cfg?.architectures) ? cfg.architectures[0] : undefined;
  const hybrid = hybridLayers(c, L);
  const window = activeWindow(c);

  // ── What kind of model is it?
  {
    const parts: Part[] = [];
    // A config rebuilt from the database carries no class name to quote.
    const named = archName ? "" : "Unnamed";
    if (moeUncounted) parts.push({ k: "kind.moeUncounted" });
    else if (isMoE && perTok) parts.push({ k: `kind.moe${named}`, v: { arch: archName ?? "", k: F(perTok), n: F(experts!) } });
    else parts.push({ k: `kind.dense${named}`, v: { arch: archName ?? "" } });
    if (hybrid) parts.push({ k: `kind.hybrid.${hybrid.other}`, v: { a: F(hybrid.attention), n: F(L) } });
    if (cfg?.vision_config && cfg?.audio_config) parts.push({ k: "kind.visionAudio" });
    else if (cfg?.vision_config) parts.push({ k: "kind.vision" });
    answers.push({
      id: "kind",
      parts,
      working: [],
      cites: cites(top("architectures"), top("model_type"), at("num_experts", "num_local_experts", "n_routed_experts", "moe_num_experts"),
        at("num_experts_per_tok", "experts_per_token"), top("vision_config"), top("audio_config"), hybrid ? prefix + hybrid.path : undefined),
    });
  }

  // ── How big is it?
  if (arch) {
    const ffn = c.intermediate_size ?? c.ffn_dim ?? c.n_inner;
    const parts: Part[] = [{ k: "size.shape", v: { L: F(L), d: F(arch.hiddenSize) } }];
    const working: Part[] = [];
    // Mixtral and gpt-oss keep the expert width in intermediate_size itself;
    // DeepSeek and Qwen MoE name it moe_intermediate_size and use the other for
    // their dense layers.
    const moeWidth = c.moe_intermediate_size ?? (isMoE ? ffn : undefined);
    if (isMoE && typeof moeWidth === "number") {
      parts.push({ k: "size.expertWidth", v: { w: F(moeWidth), n: F(experts!) } });
    } else if (typeof ffn === "number" && !moeUncounted) {
      const ratio = ffn / arch.hiddenSize;
      parts.push({ k: "size.ffn", v: { ffn: F(ffn), r: fmtNum(ratio, lang, 1) } });
      working.push({ k: "size.w.ratio", v: { ffn: F(ffn), d: F(arch.hiddenSize), r: fmtNum(ratio, lang, 2) } });
    }
    if (numParams > 0) {
      parts.push({ k: "size.params", v: { p: formatParams(numParams) } });
      const active = isMoE ? activeParamsOf({ ...arch, numParams }, cfg) : undefined;
      if (active) parts.push({ k: "size.active", v: { a: roughParams(active) } });
    }
    answers.push({
      id: "size",
      parts,
      working,
      cites: cites(at("num_hidden_layers", "n_layer", "num_layers"), at("hidden_size", "n_embd", "d_model"),
        isMoE ? at("moe_intermediate_size", "intermediate_size") : moeUncounted ? undefined : at("intermediate_size", "ffn_dim", "n_inner")),
    });
  }

  // ── How far can it read?
  const maxCtx: number | undefined = arch?.maxContext;
  if (maxCtx) {
    const rs = c.rope_scaling ?? cfg?.rope_scaling ?? c.rope_parameters;
    const rsPath = c.rope_scaling ? at("rope_scaling") : cfg?.rope_scaling ? top("rope_scaling") : at("rope_parameters");
    const parts: Part[] = [{ k: "context.max", v: { n: F(maxCtx), s: shortTokens(maxCtx, lang), words: F(Math.round(maxCtx * 0.75)) } }];
    const working: Part[] = [{ k: "context.w.words", v: { n: F(maxCtx), words: F(Math.round(maxCtx * 0.75)) } }];
    const type = rs ? String(rs.rope_type ?? rs.type ?? "") : "";
    const factor = rs?.factor;
    const orig = rs?.original_max_position_embeddings ?? c.original_max_position_embeddings ?? c.initial_context_length;
    if (type === "mrope" || type === "default") {
      if (type === "mrope") parts.push({ k: "context.mrope" });
    } else if (type && typeof factor === "number" && typeof orig === "number" && Math.round(orig * factor) === maxCtx) {
      parts.push({ k: "context.stretched", v: { orig: shortTokens(orig, lang), f: fmtNum(factor, lang, 2), type: ropeLabel(type) } });
      working.push({ k: "context.w.stretch", v: { orig: F(orig), f: fmtNum(factor, lang, 2), n: F(Math.round(orig * factor)) } });
    } else if (type && typeof factor === "number" && typeof orig === "number") {
      // Llama 3 scaling is not a plain multiplication: 8,192 × 8 is 65,536, yet
      // Llama 3.1 declares 131,072. Name both numbers and multiply neither.
      parts.push({ k: "context.scaledFrom", v: { orig: shortTokens(orig, lang), f: fmtNum(factor, lang, 2), type: ropeLabel(type) } });
    } else if (type && typeof factor === "number") {
      parts.push({ k: "context.scaledBy", v: { f: fmtNum(factor, lang, 2), type: ropeLabel(type) } });
    }
    if (window) {
      if (window.sliding > 0 && window.sliding < L) {
        parts.push({ k: "context.windowSome", v: { s: F(window.sliding), n: F(L), w: F(window.size) } });
      } else {
        parts.push({ k: "context.window", v: { w: F(window.size) } });
      }
    }
    answers.push({
      id: "context",
      parts,
      working,
      cites: cites(at("max_position_embeddings", "n_positions", "n_ctx", "max_seq_len"), rsPath, window ? prefix + window.path : undefined,
        window ? at("layer_types", "sliding_window_pattern") : undefined, at("original_max_position_embeddings", "initial_context_length")),
    });
  }

  // ── What does each token cost in memory?
  if (arch) {
    const dt: Dtype = "bf16";
    const perToken = kvBytesPerToken(arch, dt);
    const hd = resolveHeadDim(arch);
    const mla = usesMla(arch);
    const parts: Part[] = [{ k: "kv.perToken", v: { b: fmtBytes(perToken, lang) } }];
    if (maxCtx) parts.push({ k: "kv.full", v: { s: shortTokens(maxCtx, lang), b: fmtBytes(perToken * maxCtx, lang) } });
    const working: Part[] = mla
      ? [{ k: "kv.w.mla", v: { L: F(L), r: F(arch.kvLoraRank!), q: F(arch.qkRopeHeadDim!), b: F(perToken) } }]
      : [{ k: "kv.w.gqa", v: { L: F(L), kv: F(arch.numKeyValueHeads), hd: F(hd), b: F(perToken) } }];
    let tone: Answer["tone"];
    if (hybrid) {
      const counted = kvBytesPerToken({ ...arch, numLayers: hybrid.attention }, dt);
      parts.push({ k: "kv.hybrid", v: { a: F(hybrid.attention), n: F(L), b: fmtBytes(counted, lang) } });
      tone = "warn";
    } else if (window) {
      parts.push({ k: "kv.window", v: { w: F(window.size) } });
      tone = "warn";
    }
    answers.push({
      id: "kvcache",
      parts,
      working,
      tone,
      cites: mla
        ? cites(at("num_hidden_layers"), at("kv_lora_rank"), at("qk_rope_head_dim"))
        : cites(at("num_hidden_layers", "n_layer", "num_layers"), at("num_key_value_heads", "num_kv_heads"), at("head_dim"),
            c.head_dim === undefined ? at("hidden_size", "n_embd") : undefined,
            c.head_dim === undefined ? at("num_attention_heads", "n_head") : undefined, hybrid ? prefix + hybrid.path : undefined, window ? prefix + window.path : undefined),
    });
  }

  // ── How do the attention heads share memory?
  if (arch) {
    const q = arch.numAttentionHeads;
    const kv = arch.numKeyValueHeads;
    const hd = resolveHeadDim(arch);
    const parts: Part[] = [];
    if (usesMla(arch)) {
      parts.push({ k: "attn.mla", v: { q: F(q), r: F(arch.kvLoraRank!), rope: F(arch.qkRopeHeadDim!) } });
    } else if (kv === 1) {
      parts.push({ k: "attn.mqa", v: { q: F(q) } });
    } else if (kv < q) {
      parts.push({ k: "attn.gqa", v: { q: F(q), kv: F(kv), r: fmtNum(q / kv, lang, 1) } });
    } else {
      parts.push({ k: "attn.mha", v: { q: F(q) } });
    }
    if (!usesMla(arch)) {
      parts.push({ k: "attn.headDim", v: { hd: F(hd) } });
      if (c.head_dim !== undefined && hd * q !== arch.hiddenSize) {
        parts.push({ k: "attn.headDimExplicit", v: { hd: F(hd), q: F(q), x: F(hd * q), d: F(arch.hiddenSize) } });
      }
    }
    answers.push({
      id: "attention",
      parts,
      working: [],
      cites: usesMla(arch)
        ? cites(at("num_attention_heads"), at("kv_lora_rank"), at("qk_rope_head_dim"), at("q_lora_rank"))
        : cites(at("num_attention_heads", "n_head"), at("num_key_value_heads", "num_kv_heads"), at("head_dim"),
            c.head_dim !== undefined && hd * q !== arch.hiddenSize ? at("hidden_size") : undefined),
    });
  }

  // ── Is it a mixture of experts?
  {
    const parts: Part[] = [];
    const working: Part[] = [];
    if (isMoE && perTok) {
      const shared = c.n_shared_experts ?? (c.shared_expert_intermediate_size || c.shared_intermediate_size ? 1 : 0);
      parts.push({ k: shared === 1 ? "experts.routedShared1" : shared ? "experts.routedShared" : "experts.routed", v: { n: F(experts!), k: F(perTok), s: F(shared) } });
      parts.push({ k: "experts.memory", v: { n: F(experts!), pct: fmtNum((100 * perTok) / experts!, lang, 1) } });
      working.push({ k: "experts.w.share", v: { k: F(perTok), n: F(experts!), pct: fmtNum((100 * perTok) / experts!, lang, 1) } });
      if (typeof c.first_k_dense_replace === "number" && c.first_k_dense_replace > 0) {
        parts.push(c.first_k_dense_replace === 1 ? { k: "experts.firstDense1" } : { k: "experts.firstDense", v: { k: F(c.first_k_dense_replace) } });
      }
    } else if (moeUncounted) {
      parts.push({ k: "experts.uncounted" });
    } else {
      parts.push({ k: "experts.none" });
    }
    answers.push({
      id: "experts",
      parts,
      working,
      cites: isMoE
        ? cites(at("num_experts", "num_local_experts", "n_routed_experts", "moe_num_experts"), at("num_experts_per_tok", "experts_per_token"),
            at("n_shared_experts", "shared_expert_intermediate_size", "shared_intermediate_size"), at("first_k_dense_replace"))
        : moeUncounted
          ? []
          : cites(at("intermediate_size", "ffn_dim", "n_inner")),
    });
  }

  // ── What precision are the weights stored in?
  if (!rebuilt) {
    const dtypeKey = top("torch_dtype", "dtype") ?? (c.torch_dtype !== undefined ? prefix + "torch_dtype" : undefined);
    const dtypeName = String(cfg?.torch_dtype ?? cfg?.dtype ?? c.torch_dtype ?? c.dtype ?? "");
    const stored = DTYPE_NAMES[dtypeName];
    const q = cfg?.quantization_config ?? c.quantization_config;
    const qPath = cfg?.quantization_config ? "quantization_config" : c.quantization_config ? prefix + "quantization_config" : undefined;
    const parts: Part[] = [];
    const working: Part[] = [];
    if (q) {
      parts.push(quantPart(q));
      const firstGroup = q.config_groups ? (q.config_groups.group_0 ?? Object.values(q.config_groups)[0]) : undefined;
      if (q.activation_scheme === "dynamic" || (firstGroup as Json)?.input_activations?.dynamic) parts.push({ k: "precision.actDynamic" });
      if (stored) parts.push({ k: "precision.rest", v: { d: stored.label } });
      if (q.kv_cache_scheme) {
        const bits = typeof q.kv_cache_scheme.num_bits === "number" ? q.kv_cache_scheme.num_bits : undefined;
        parts.push(bits ? { k: "precision.kvScheme", v: { bits } } : { k: "precision.kvSchemePlain" });
      }
    } else if (stored) {
      parts.push({ k: "precision.stored", v: { d: stored.label, b: stored.bytes } });
      if (numParams > 0) {
        const bytes = numParams * stored.bytes;
        parts.push({ k: "precision.weights", v: { g: fmtBytes(bytes, lang) } });
        working.push({ k: "precision.w.weights", v: { p: formatParams(numParams), b: stored.bytes, g: fmtBytes(bytes, lang) } });
      }
    } else {
      parts.push({ k: "precision.unknown" });
    }
    answers.push({ id: "precision", parts, working, cites: cites(dtypeKey, qPath) });
  }

  // ── What vocabulary does it speak?
  if (arch?.vocabSize) {
    const v = arch.vocabSize;
    const tied = c.tie_word_embeddings ?? cfg?.tie_word_embeddings;
    const matrix = v * arch.hiddenSize;
    const parts: Part[] = [{ k: "vocab.size", v: { v: F(v) } }];
    const working: Part[] = [{ k: "vocab.w.matrix", v: { v: F(v), d: F(arch.hiddenSize), p: formatParams(matrix) } }];
    if (tied === true) parts.push({ k: "vocab.tied", v: { p: formatParams(matrix) } });
    else if (tied === false) parts.push({ k: "vocab.untied", v: { p: formatParams(matrix) } });
    const eos = c.eos_token_id ?? cfg?.eos_token_id;
    if (Array.isArray(eos) && eos.length > 1) parts.push({ k: "vocab.eosMany", v: { n: eos.length } });
    answers.push({
      id: "vocab",
      parts,
      working,
      cites: cites(at("vocab_size"), c.tie_word_embeddings !== undefined ? at("tie_word_embeddings") : top("tie_word_embeddings"),
        Array.isArray(eos) && eos.length > 1 ? (c.eos_token_id !== undefined ? at("eos_token_id") : top("eos_token_id")) : undefined,
        at("hidden_size")),
    });
  }

  // ── What does my software need to load it?
  if (!rebuilt) {
    const parts: Part[] = [];
    if (archName) parts.push({ k: "load.class", v: { arch: archName } });
    if (typeof cfg?.transformers_version === "string") parts.push({ k: "load.version", v: { v: cfg.transformers_version } });
    const custom = cfg?.auto_map && typeof cfg.auto_map === "object";
    parts.push({ k: custom ? "load.remote" : "load.native" });
    answers.push({
      id: "load",
      parts,
      working: [],
      tone: custom ? "warn" : undefined,
      cites: cites(top("architectures"), top("transformers_version"), top("auto_map")),
    });
  }

  // ── Which fields only matter for training?
  const fields = explainFields(cfg, lang);
  // A few glossary meanings are true in general but not of this model: say so on
  // the row, from the same facts the answers used.
  for (const f of fields) {
    const key = ALIASES_FOR_NOTES[f.key] ?? f.key;
    const inLm = f.path === prefix + f.key;
    if (!inLm) continue;
    if (arch && usesMla(arch) && key === "num_key_value_heads") f.note = "mlaKv";
    if (key === "intermediate_size" && isMoE && typeof c.moe_intermediate_size === "number") f.note = "denseOnlyFfn";
    if (key === "intermediate_size" && isMoE && c.moe_intermediate_size === undefined) f.note = "expertFfn";
    // Rebuilt from the database: MoE is known, but not which width this is.
    if (key === "intermediate_size" && moeUncounted) f.note = "moeUnknownFfn";
    if (key === "sliding_window" && c.use_sliding_window === false) f.note = "windowOff";
  }
  if (!rebuilt) {
    const training = fields.filter((f) => f.rel === "training");
    const parts: Part[] = training.length
      ? [{ k: "training.some", v: { n: training.length, list: training.slice(0, 6).map((f) => f.key).join(", ") + (training.length > 6 ? "…" : "") } }]
      : [{ k: "training.none" }];
    answers.push({ id: "training", parts, working: [], cites: training.map((f) => f.path) });
  }

  // ── one paragraph in plain words
  const portrait: Part[] = [];
  if (arch) {
    portrait.push({
      k: moeUncounted ? "portrait.moeUncounted" : isMoE ? "portrait.moe" : hybrid ? "portrait.hybrid" : "portrait.dense",
      v: {
        L: F(L),
        p: numParams > 0 ? formatParams(numParams) : "—",
        k: perTok ? F(perTok) : "—",
        n: experts ? F(experts) : "—",
        a: hybrid ? F(hybrid.attention) : "—",
      },
    });
    if (numParams <= 0) {
      const k = moeUncounted ? "portrait.moeUncountedNoParams" : isMoE ? "portrait.moeNoParams" : hybrid ? "portrait.hybridNoParams" : "portrait.denseNoParams";
      portrait[0] = { k, v: portrait[0].v };
    }
    if (maxCtx) {
      // For a hybrid, only the attention layers keep a cache — the same figure the
      // KV answer gives, so the two never disagree on one page.
      const perToken = hybrid ? kvBytesPerToken({ ...arch, numLayers: hybrid.attention }, "bf16") : kvBytesPerToken(arch, "bf16");
      portrait.push({ k: "portrait.context", v: { s: shortTokens(maxCtx, lang), b: fmtBytes(perToken, lang) } });
    }
  }
  const precision = answers.find((a) => a.id === "precision")?.parts[0];
  if (precision?.k === "precision.stored") portrait.push({ k: "portrait.stored", v: { d: String(precision.v?.d) } });
  else if (precision && precision.k.startsWith("precision.q.")) portrait.push({ k: "portrait.quantized", v: { m: String(precision.v?.m ?? "") } });

  return { prefix, arch, answers, portrait, fields, lines: jsonLines(cfg) };
}

function ropeLabel(type: string): string {
  const names: Record<string, string> = { yarn: "YaRN", llama3: "Llama 3", linear: "linear", dynamic: "dynamic NTK", longrope: "LongRoPE", su: "LongRoPE" };
  return names[type] ?? type;
}

/** Hybrid models: how many layers keep a KV cache, and what the others are. */
function hybridLayers(c: Json, L: number): { attention: number; other: "linear" | "mamba"; path: string } | undefined {
  // layer_types (Granite, Qwen, gpt-oss) or layers_block_type (Nemotron-H re-saved
  // by Transformers v5). Attention layers are counted directly, so "moe" or "mlp"
  // entries are never mistaken for attention.
  for (const key of ["layer_types", "layers_block_type"]) {
    if (!Array.isArray(c[key])) continue;
    const types: string[] = c[key].map(String);
    const isState = (t: string) => /linear|mamba|ssm|recurrent|conv/.test(t);
    const state = types.filter(isState);
    if (state.length > 0) {
      return {
        attention: types.filter((t) => /attention/.test(t) && !isState(t)).length,
        other: state.some((t) => /mamba|ssm/.test(t)) ? "mamba" : "linear",
        path: key,
      };
    }
  }
  // LFM2 lists its attention layers; the rest are short convolutions.
  if (Array.isArray(c.full_attn_idxs) && L > 0 && c.full_attn_idxs.length < L) {
    return { attention: c.full_attn_idxs.length, other: "linear", path: "full_attn_idxs" };
  }
  if (typeof c.full_attention_interval === "number" && c.full_attention_interval > 1 && L > 0) {
    return { attention: Math.floor(L / c.full_attention_interval), other: "linear", path: "full_attention_interval" };
  }
  if (typeof c.hybrid_override_pattern === "string") {
    const p: string = c.hybrid_override_pattern;
    if (p.includes("M")) return { attention: [...p].filter((ch) => ch === "*").length, other: "mamba", path: "hybrid_override_pattern" };
  }
  return undefined;
}

/** A sliding window that is actually in use, and how many layers use it
 *  (0 when the config does not say which). */
function activeWindow(c: Json): { size: number; sliding: number; path: string } | undefined {
  const size = c.sliding_window;
  if (typeof size !== "number" || size <= 0 || c.use_sliding_window === false) return undefined;
  // Phi-3.5-mini declares a 262,144-token window over a 131,072-token context.
  const maxCtx = c.max_position_embeddings;
  if (typeof maxCtx === "number" && size >= maxCtx) return undefined;
  const types: string[] | undefined = Array.isArray(c.layer_types) ? c.layer_types.map(String) : undefined;
  let sliding = types ? types.filter((t) => t.includes("sliding")).length : 0;
  if (types && sliding === 0) return undefined;
  // Gemma 3 says it as a pattern instead: every pattern-th layer is global.
  const pattern = c.sliding_window_pattern;
  const L = c.num_hidden_layers;
  if (!types && typeof pattern === "number" && pattern > 1 && typeof L === "number") sliding = L - Math.floor(L / pattern);
  return { size, sliding, path: "sliding_window" };
}

/** One sentence naming the quantization method and its settings. */
function quantPart(q: Json): Part {
  const method = String(q.quant_method ?? "").toLowerCase();
  if (method === "awq" || method === "gptq" || method === "gptqmodel") {
    // group_size -1 is GPTQ for one scale per output channel, not a group of -1.
    if (typeof q.group_size === "number" && q.group_size <= 0) return { k: "precision.q.channel", v: { m: method.toUpperCase(), bits: q.bits ?? "?" } };
    return { k: "precision.q.group", v: { m: method.toUpperCase(), bits: q.bits ?? "?", g: q.group_size ?? "?" } };
  }
  // MLX writes only {bits, group_size}.
  if (!method && typeof q.bits === "number" && typeof q.group_size === "number") {
    return { k: "precision.q.groupPlain", v: { bits: q.bits, g: q.group_size } };
  }
  if (method === "fp8") {
    const block = Array.isArray(q.weight_block_size) ? q.weight_block_size.join("×") : "";
    return { k: block ? "precision.q.fp8Block" : "precision.q.fp8", v: { m: "FP8", fmt: q.fmt ?? "e4m3", block } };
  }
  if (method.includes("fp4")) {
    const kept = Array.isArray(q.modules_to_not_convert) ? q.modules_to_not_convert.length : 0;
    return { k: "precision.q.fp4", v: { m: method.toUpperCase(), kept } };
  }
  if (method.includes("bitsandbytes") || q.load_in_4bit || q.load_in_8bit) {
    const bits = q.load_in_8bit ? 8 : 4;
    return { k: "precision.q.bnb", v: { m: "bitsandbytes", bits, t: q.bnb_4bit_quant_type ?? "" } };
  }
  if (method === "compressed-tensors" && q.config_groups) {
    const g = q.config_groups.group_0 ?? Object.values(q.config_groups)[0];
    const wt = g?.weights;
    const act = g?.input_activations;
    const wBits = wt?.num_bits ?? "?";
    const wType = String(wt?.type ?? "int").toUpperCase() === "FLOAT" ? "FP" : "INT";
    const aBits = act?.num_bits;
    return {
      k: aBits ? "precision.q.ctWA" : "precision.q.ctW",
      v: { m: "compressed-tensors", w: `${wType}${wBits}`, a: aBits ? `${String(act?.type ?? "int").toUpperCase() === "FLOAT" ? "FP" : "INT"}${aBits}` : "" },
    };
  }
  return { k: "precision.q.other", v: { m: method || "?" } };
}

/** For a gated repo whose config a browser cannot read: the architecture numbers
 *  LLMScale does know, written back under config.json's own names. The page labels
 *  the result as rebuilt — it is not the repository's file. */
export function configFromArch(arch: ModelArch): Record<string, number> {
  const out: Record<string, number> = {
    num_hidden_layers: arch.numLayers,
    hidden_size: arch.hiddenSize,
    num_attention_heads: arch.numAttentionHeads,
    num_key_value_heads: arch.numKeyValueHeads,
  };
  if (arch.headDim) out.head_dim = arch.headDim;
  if (arch.intermediateSize) out.intermediate_size = arch.intermediateSize;
  if (arch.kvLoraRank) out.kv_lora_rank = arch.kvLoraRank;
  if (arch.qkRopeHeadDim) out.qk_rope_head_dim = arch.qkRopeHeadDim;
  if (arch.vocabSize) out.vocab_size = arch.vocabSize;
  if (arch.maxContext) out.max_position_embeddings = arch.maxContext;
  return out;
}

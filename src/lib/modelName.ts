// Model-name decoder: split a HF model id into meaningful, classified tokens.
// Pure & dependency-free. Explanations are bilingual (read by the page via lang).

export type Kind =
  | "org" | "family" | "version" | "params" | "paramsM"
  | "moe" | "moeActive"
  | "quantAWQ" | "quantGPTQ" | "quantGGUF" | "quantFP8" | "quantNVFP4"
  | "quantINT" | "quantWA" | "quantBnb" | "quantDynamic" | "precision"
  | "instruct" | "chat" | "base" | "coder" | "math" | "vision"
  | "embedding" | "reranker" | "reasoning" | "sizeClass" | "speed"
  | "context" | "date" | "format" | "unknown";

interface KindInfo {
  color: string;
  title: { en: string; tr: string };
  desc: { en: string; tr: string };
}

export const KIND_INFO: Record<Kind, KindInfo> = {
  org: { color: "#64748b",
    title: { en: "Publisher", tr: "Yayıncı" },
    desc: { en: "The org or user that published this repo (the model author or a quantizer).", tr: "Bu repo'yu yayınlayan kuruluş/kullanıcı (model sahibi ya da quantize eden)." } },
  family: { color: "#6366f1",
    title: { en: "Model family", tr: "Model ailesi" },
    desc: { en: "The base model line — often with its version number attached.", tr: "Temel model serisi — çoğu zaman sürüm numarasıyla birlikte." } },
  version: { color: "#3b82f6",
    title: { en: "Version", tr: "Sürüm" },
    desc: { en: "Generation / release version of the family.", tr: "Ailenin nesil / sürüm numarası." } },
  params: { color: "#10b981",
    title: { en: "Parameter count", tr: "Parametre sayısı" },
    desc: { en: "Total parameters (billions). Drives quality and VRAM — bigger = more capable but heavier.", tr: "Toplam parametre (milyar). Kaliteyi ve VRAM'i belirler — büyük = daha yetenekli ama daha ağır." } },
  paramsM: { color: "#10b981",
    title: { en: "Parameter count (M)", tr: "Parametre sayısı (M)" },
    desc: { en: "Millions of parameters — a small / edge-friendly model.", tr: "Milyon mertebesinde parametre — küçük / edge'e uygun model." } },
  moe: { color: "#f59e0b",
    title: { en: "Mixture of Experts", tr: "Uzman Karması (MoE)" },
    desc: { en: "experts × size each (e.g. 8x7B). Only a few experts run per token (fast compute), but ALL experts must fit in VRAM.", tr: "uzman × her biri (ör. 8x7B). Token başına yalnızca birkaç uzman çalışır (hızlı hesap), ama TÜM uzmanlar VRAM'e sığmalı." } },
  moeActive: { color: "#f59e0b",
    title: { en: "MoE — active params", tr: "MoE — aktif parametre" },
    desc: { en: "Active parameters per token (e.g. A3B = 3B active). Compute ≈ active params; VRAM ≈ total params.", tr: "Token başına aktif parametre (ör. A3B = 3B aktif). Hesap ≈ aktif parametre; VRAM ≈ toplam parametre." } },
  quantAWQ: { color: "#f43f5e",
    title: { en: "Quantization · AWQ", tr: "Quantization · AWQ" },
    desc: { en: "Activation-aware Weight Quantization (~4-bit). ~4× smaller, fast on GPU, minor accuracy loss.", tr: "Activation-aware Weight Quantization (~4-bit). ~4× küçük, GPU'da hızlı, küçük doğruluk kaybı." } },
  quantGPTQ: { color: "#f43f5e",
    title: { en: "Quantization · GPTQ", tr: "Quantization · GPTQ" },
    desc: { en: "GPTQ 4-bit weight quantization. Small & fast on GPU; slight accuracy loss.", tr: "GPTQ 4-bit ağırlık quantization. GPU'da küçük & hızlı; az doğruluk kaybı." } },
  quantGGUF: { color: "#e11d48",
    title: { en: "Format · GGUF", tr: "Format · GGUF" },
    desc: { en: "llama.cpp format — runs on CPU and GPU with many quant levels (Q4…Q8). Great for local / Mac.", tr: "llama.cpp formatı — CPU ve GPU'da çalışır, çok sayıda quant seviyesi (Q4…Q8). Yerel / Mac için ideal." } },
  quantFP8: { color: "#f43f5e",
    title: { en: "Quantization · FP8", tr: "Quantization · FP8" },
    desc: { en: "8-bit floating point. ~2× smaller than BF16, near-lossless, fast on modern GPUs (Hopper/Blackwell/MI300).", tr: "8-bit kayan nokta. BF16'dan ~2× küçük, neredeyse kayıpsız, modern GPU'larda hızlı (Hopper/Blackwell/MI300)." } },
  quantNVFP4: { color: "#f43f5e",
    title: { en: "Quantization · NVFP4", tr: "Quantization · NVFP4" },
    desc: { en: "NVIDIA 4-bit float (Blackwell). ~4× smaller with better accuracy than INT4; needs Blackwell GPUs.", tr: "NVIDIA 4-bit float (Blackwell). INT4'ten daha iyi doğrulukla ~4× küçük; Blackwell GPU ister." } },
  quantINT: { color: "#f43f5e",
    title: { en: "Quantization · INT4/INT8", tr: "Quantization · INT4/INT8" },
    desc: { en: "Integer quantization (4 or 8-bit). Smaller & faster; INT4 trades some accuracy.", tr: "Tamsayı quantization (4 veya 8-bit). Küçük & hızlı; INT4 biraz doğruluktan verir." } },
  quantWA: { color: "#f43f5e",
    title: { en: "Quantization · W/A bits", tr: "Quantization · W/A bit" },
    desc: { en: "Bit-width for Weights (W) and Activations (A) — e.g. W4A16 = 4-bit weights, 16-bit activations.", tr: "Ağırlık (W) ve Aktivasyon (A) bit genişliği — ör. W4A16 = 4-bit ağırlık, 16-bit aktivasyon." } },
  quantBnb: { color: "#f43f5e",
    title: { en: "Quantization · bitsandbytes", tr: "Quantization · bitsandbytes" },
    desc: { en: "On-the-fly 4-bit / 8-bit (bitsandbytes). Easy to load, good for limited VRAM.", tr: "Anlık 4-bit / 8-bit (bitsandbytes). Yüklemesi kolay, kısıtlı VRAM için iyi." } },
  quantDynamic: { color: "#fb7185",
    title: { en: "Quantization · dynamic", tr: "Quantization · dinamik" },
    desc: { en: "Dynamic quantization — scales computed at runtime (often paired with FP8).", tr: "Dinamik quantization — ölçekler çalışma anında hesaplanır (genelde FP8 ile)." } },
  precision: { color: "#06b6d4",
    title: { en: "Precision", tr: "Hassasiyet" },
    desc: { en: "Native weight precision (BF16/FP16 = 2 bytes, FP32 = 4). Full quality, largest size.", tr: "Doğal ağırlık hassasiyeti (BF16/FP16 = 2 byte, FP32 = 4). Tam kalite, en büyük boyut." } },
  instruct: { color: "#8b5cf6",
    title: { en: "Instruction-tuned", tr: "Talimat-ayarlı" },
    desc: { en: "Fine-tuned to follow instructions / chat. Use this for assistants and most tasks.", tr: "Talimatları izlemek / sohbet için ayarlanmış. Asistan ve çoğu görev için bunu kullan." } },
  chat: { color: "#8b5cf6",
    title: { en: "Chat-tuned", tr: "Sohbet-ayarlı" },
    desc: { en: "Optimized for multi-turn conversation.", tr: "Çok turlu sohbet için optimize edilmiş." } },
  base: { color: "#a855f7",
    title: { en: "Base model", tr: "Base model" },
    desc: { en: "Pretrained only — NOT instruction-tuned. For fine-tuning, not chatting out of the box.", tr: "Sadece ön-eğitimli — talimat ayarlı DEĞİL. Fine-tuning için; doğrudan sohbet için değil." } },
  coder: { color: "#0ea5e9",
    title: { en: "Code-specialized", tr: "Koda özel" },
    desc: { en: "Tuned for programming / code generation.", tr: "Programlama / kod üretimi için ayarlanmış." } },
  math: { color: "#14b8a6",
    title: { en: "Math-specialized", tr: "Matematiğe özel" },
    desc: { en: "Tuned for mathematical reasoning.", tr: "Matematiksel akıl yürütme için ayarlanmış." } },
  vision: { color: "#14b8a6",
    title: { en: "Vision / multimodal", tr: "Görsel / çok kipli" },
    desc: { en: "Accepts images + text (VLM).", tr: "Görüntü + metin kabul eder (VLM)." } },
  embedding: { color: "#0891b2",
    title: { en: "Embeddings", tr: "Embedding" },
    desc: { en: "Produces vectors for search / RAG — not a chat model.", tr: "Arama / RAG için vektör üretir — sohbet modeli değil." } },
  reranker: { color: "#0891b2",
    title: { en: "Reranker", tr: "Reranker" },
    desc: { en: "Scores / orders documents for retrieval — not a generator.", tr: "Retrieval için belge sıralar / puanlar — üretici değil." } },
  reasoning: { color: "#d946ef",
    title: { en: "Reasoning", tr: "Akıl yürütme" },
    desc: { en: "A reasoning / 'thinking' model (R1, QwQ, distill…) — strong at multi-step problems.", tr: "Akıl yürütme / 'düşünen' model (R1, QwQ, distill…) — çok adımlı problemlerde güçlü." } },
  sizeClass: { color: "#84cc16",
    title: { en: "Size class", tr: "Boyut sınıfı" },
    desc: { en: "Relative size tier (mini / small / large …).", tr: "Göreceli boyut seviyesi (mini / small / large …)." } },
  speed: { color: "#eab308",
    title: { en: "Speed-optimized", tr: "Hıza optimize" },
    desc: { en: "Tuned for low latency / throughput (turbo / flash / lite).", tr: "Düşük gecikme / throughput için (turbo / flash / lite)." } },
  context: { color: "#38bdf8",
    title: { en: "Context length", tr: "Context uzunluğu" },
    desc: { en: "Max context window the variant targets (e.g. 128k tokens).", tr: "Varyantın hedeflediği maksimum context penceresi (ör. 128k token)." } },
  date: { color: "#94a3b8",
    title: { en: "Release snapshot", tr: "Yayın tarihi" },
    desc: { en: "Release / training date code (e.g. 2507 ≈ 2025-07).", tr: "Yayın / eğitim tarih kodu (ör. 2507 ≈ 2025-07)." } },
  format: { color: "#a78bfa",
    title: { en: "Format", tr: "Format" },
    desc: { en: "Packaging / runtime format (HF Transformers, MLX, ONNX …).", tr: "Paketleme / çalışma formatı (HF Transformers, MLX, ONNX …)." } },
  unknown: { color: "#64748b",
    title: { en: "Name part", tr: "Ad parçası" },
    desc: { en: "A family, variant or label specific to this model.", tr: "Bu modele özgü bir aile, varyant veya etiket." } },
};

const MATCHERS: [RegExp, Kind][] = [
  [/^\d+(\.\d+)?x\d+(\.\d+)?b$/, "moe"],
  [/^a\d+(\.\d+)?b$/, "moeActive"],
  [/^\d+(\.\d+)?b$/, "params"],
  [/^\d+(\.\d+)?m$/, "paramsM"],
  [/^awq/, "quantAWQ"],
  [/^gptq/, "quantGPTQ"],
  [/^gguf$/, "quantGGUF"],
  [/^q\d[a-z0-9_]*$/, "quantGGUF"],
  [/^nvfp4$/, "quantNVFP4"],
  [/^fp8/, "quantFP8"],
  [/^(bf16|fp16|fp32|bfloat16|float16|float32)$/, "precision"],
  [/^w\d+a\d+$/, "quantWA"],
  [/^int(4|8)$/, "quantINT"],
  [/^(4bit|8bit|bnb)$/, "quantBnb"],
  [/^dynamic$/, "quantDynamic"],
  [/^instruct$/, "instruct"],
  [/^chat$/, "chat"],
  [/^(it|sft)$/, "instruct"],
  [/^base$/, "base"],
  [/^(coder|code)$/, "coder"],
  [/^math$/, "math"],
  [/^(vl|vlm|vision)$/, "vision"],
  [/^(embedding|embed)$/, "embedding"],
  [/^rerank(er)?$/, "reranker"],
  [/^(distill|distilled)$/, "reasoning"],
  [/^(r1|qwq|thinking|reasoner|reasoning|cot|o1|o3)$/, "reasoning"],
  [/^(mini|nano|tiny|small|medium|large|xl|xxl)$/, "sizeClass"],
  [/^(turbo|flash|lite|fast)$/, "speed"],
  [/^(hf|mlx|onnx|safetensors)$/, "format"],
  [/^\d+k$/, "context"],
  [/^1m$/, "context"],
  [/^\d{4}$/, "date"],
  [/^\d{6,8}$/, "date"],
  [/^v?\d+(\.\d+)+$/, "version"],
  [/^v\d+$/, "version"],
  [/^\d{1,2}$/, "version"],
];

function classify(token: string, isFirstName: boolean): Kind {
  const s = token.toLowerCase();
  for (const [re, kind] of MATCHERS) if (re.test(s)) return kind;
  return isFirstName ? "family" : "unknown";
}

export interface Seg {
  type: "sep" | "token";
  text: string;
  kind?: Kind;
  /** index into the tokens list (for hover linking) */
  i?: number;
}

export interface ParsedName {
  segments: Seg[];
  tokens: { text: string; kind: Kind }[];
}

export function parseModelName(id: string): ParsedName {
  const segments: Seg[] = [];
  const tokens: { text: string; kind: Kind }[] = [];
  const trimmed = id.trim();
  if (!trimmed) return { segments, tokens };

  const slash = trimmed.indexOf("/");
  const org = slash >= 0 ? trimmed.slice(0, slash) : null;
  const name = slash >= 0 ? trimmed.slice(slash + 1) : trimmed;

  const push = (text: string, kind: Kind) => {
    const i = tokens.length;
    tokens.push({ text, kind });
    segments.push({ type: "token", text, kind, i });
  };

  if (org !== null) {
    push(org, "org");
    segments.push({ type: "sep", text: "/" });
  }

  let firstName = true;
  for (const part of name.split(/([_-])/)) {
    if (part === "") continue;
    if (part === "-" || part === "_") {
      segments.push({ type: "sep", text: part });
      continue;
    }
    push(part, classify(part, firstName));
    firstName = false;
  }

  return { segments, tokens };
}

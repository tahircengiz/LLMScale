// Model-name decoder: split a HF model id into meaningful, classified tokens.
// Pure & dependency-free. The explanations are dictionary keys (decode.kind.*).

export type Kind =
  | "org" | "family" | "version" | "params" | "paramsM"
  | "moe" | "moeActive"
  | "quantAWQ" | "quantGPTQ" | "quantGGUF" | "quantFP8" | "quantNVFP4"
  | "quantINT" | "quantWA" | "quantBnb" | "quantDynamic" | "precision"
  | "instruct" | "chat" | "base" | "coder" | "math" | "vision"
  | "embedding" | "reranker" | "reasoning" | "sizeClass" | "speed"
  | "agentic" | "uncensored" | "method" | "creative" | "preview"
  | "multiplier" | "codename" | "tag"
  | "context" | "date" | "format" | "unknown";

/** A part's colour. Its name and explanation are in the dictionaries:
 *  decode.kind.<kind>.title and .desc. */
interface KindInfo {
  color: string;
}

export const KIND_INFO: Record<Kind, KindInfo> = {
  org: { color: "#878d96" },
  family: { color: "#4589ff" },
  version: { color: "#78a9ff" },
  params: { color: "#24a148" },
  paramsM: { color: "#24a148" },
  moe: { color: "#d2a106" },
  moeActive: { color: "#d2a106" },
  quantAWQ: { color: "#fa4d56" },
  quantGPTQ: { color: "#fa4d56" },
  quantGGUF: { color: "#da1e28" },
  quantFP8: { color: "#fa4d56" },
  quantNVFP4: { color: "#fa4d56" },
  quantINT: { color: "#fa4d56" },
  quantWA: { color: "#fa4d56" },
  quantBnb: { color: "#fa4d56" },
  quantDynamic: { color: "#ff8389" },
  precision: { color: "#08bdba" },
  instruct: { color: "#a56eff" },
  chat: { color: "#a56eff" },
  base: { color: "#8a3ffc" },
  coder: { color: "#1192e8" },
  math: { color: "#009d9a" },
  vision: { color: "#009d9a" },
  embedding: { color: "#0072c3" },
  reranker: { color: "#0072c3" },
  reasoning: { color: "#ee5396" },
  sizeClass: { color: "#6fdc8c" },
  speed: { color: "#f1c21b" },
  context: { color: "#33b1ff" },
  date: { color: "#a2a9b0" },
  format: { color: "#be95ff" },
  agentic: { color: "#ff832b" },
  uncensored: { color: "#d02670" },
  method: { color: "#be95ff" },
  creative: { color: "#ff7eb6" },
  preview: { color: "#f1c21b" },
  multiplier: { color: "#82cfff" },
  codename: { color: "#a2a9b0" },
  tag: { color: "#878d96" },
  unknown: { color: "#878d96" },
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
  [/^(nvfp4|mxfp4)$/, "quantNVFP4"],
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
  [/^(agentic|agent|tool|tools|tooluse|functioncalling)$/, "agentic"],
  [/^(uncensored|abliterated|unfiltered|deabliterated|decensored)$/, "uncensored"],
  [/^(dpo|orpo|kto|rlhf|ppo|grpo|simpo|merge|merged|slerp|ties|dare|frankenmerge|passthrough|megamerge|lora|qlora)$/, "method"],
  [/^(roleplay|rp|story|storywriter|creative|writer|novel|erp)$/, "creative"],
  [/^(preview|exp|experimental|alpha|beta|rc|wip|early)$/, "preview"],
  [/^moe$/, "moe"],
  [/^\d+(\.\d+)?x$/, "multiplier"],
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
  if (isFirstName) return "family";
  // Pattern-based fallback so custom community tags aren't all "unknown":
  const hasAlpha = /[a-z]/i.test(token);
  const hasDigit = /\d/.test(token);
  if (hasAlpha && hasDigit) return "codename"; // e.g. fable5, composer2.5, tau2
  return "tag"; // e.g. agentic-style custom labels
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

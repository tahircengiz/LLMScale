// A cheap first pass before anything reaches Claude: does an item talk about the
// things LLMScale is about — model sizes, memory, serving, GPUs? Broad sources
// (NVIDIA's blog, OpenAI's news, Hacker News) publish far more than that, and
// every item screened costs tokens. This only has to be generous and fast;
// Claude makes the real call.

const TERMS: [string, RegExp][] = [
  ["llm", /\bllms?\b|large language model|language model/],
  ["open weights", /open[- ]?weights?|open[- ]?sourced?\b|weights (are|on) (available|hugging face)/],
  ["parameters", /\b\d+(\.\d+)?\s?[bt]\b(?! ?(usd|dollars))|\bparameters?\b/],
  ["moe", /\bmoe\b|mixture[- ]of[- ]experts|active parameters/],
  ["context", /context (window|length)|long[- ]context|\b\d+k context|\bmillion[- ]token/],
  ["kv cache", /kv[- ]?cache|paged ?attention|prefix cach/],
  ["attention", /\b(gqa|mqa|mla)\b|grouped[- ]query|latent attention|flash ?attention|sliding[- ]window/],
  ["quantization", /quantiz|\bgguf\b|\bawq\b|\bgptq\b|\bexl2\b|\b(fp8|fp4|nvfp4|mxfp4|int4|int8|bf16|fp16)\b/],
  ["inference", /\binference\b|\bserving\b|\bthroughput\b|\blatency\b|tokens?\/s|tokens per second|speculative decoding|batching/],
  ["engines", /\bvllm\b|\bsglang\b|llama\.cpp|\bollama\b|tensorrt|\btgi\b|\bmlx\b|lm studio|\bexllama/],
  ["gpus", /\b(h100|h200|h20|b100|b200|b300|gb200|gb300|a100|l40s|mi300x?|mi325x?|mi350x?|mi355x?|rtx ?\d{4}|blackwell|hopper|rubin)\b|\bgpus?\b|\bvram\b|hbm\d?e?/],
  ["platforms", /\brocm\b|\bcuda\b|apple silicon|\bm[34] (max|ultra)\b|strix halo|dgx spark|unified memory|\btpu\b/],
  ["training", /fine[- ]?tun|\blora\b|\bqlora\b|pre-?training|distill/],
  ["release", /\breleas|\blaunch|\bintroduc|\bannounc|\bnow available\b/],
];

export interface Relevance {
  score: number;
  hits: string[];
}

/** Which of the topic groups a text touches. A group counts once, however often it appears. */
export function relevance(text: string): Relevance {
  const t = text.toLowerCase();
  const hits = TERMS.filter(([, re]) => re.test(t)).map(([name]) => name);
  return { score: hits.length, hits };
}

/** Two groups, one of them about models or how they run — "release" and
 *  "training" alone are not enough to be about LLM sizing. */
export function passesPrefilter(r: Relevance): boolean {
  const core = r.hits.filter((h) => h !== "release" && h !== "training");
  return r.score >= 2 && core.length >= 1;
}

/** Which GitHub release tags a source keeps. "minor": a minor or major version —
 *  v1.2.0, 0.31.0, not v0.31.1. "stable": any plain x.y.z, for projects such as
 *  SGLang that ship their features in the last number. Neither keeps release
 *  candidates, post-releases or side packages (v0.31.0rc1, v0.5.15.post1, proto-v0.5.0). */
export type ReleaseRule = "minor" | "stable";

export function keepsRelease(url: string, rule: ReleaseRule): boolean {
  const tag = decodeURIComponent(url.split("/releases/tag/")[1] ?? "");
  return (rule === "minor" ? /^v?\d+\.\d+\.0$/ : /^v?\d+\.\d+\.\d+$/).test(tag);
}

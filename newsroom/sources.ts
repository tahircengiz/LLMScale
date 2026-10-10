// Where the newsroom looks for news. Each source is a public feed or API read
// without an account; the collector (collect.ts) takes the recent items from
// each, and Claude decides later which of them are worth a post.
//
// The list leans on primary sources — the projects, labs and vendors themselves —
// and keeps two aggregators (r/LocalLLaMA, Hacker News) to catch what the
// primary feeds miss. Serving engines are read from their GitHub releases, minor
// and major versions only: a patch or a release candidate is rarely news. SGLang
// is the exception, because its features ship in the last number.

import type { ReleaseRule } from "./relevance.ts";

export type SourceKind = "release" | "blog" | "paper" | "model" | "forum";
export type SourceFormat = "feed" | "hf-models" | "hn";

export interface Source {
  id: string;
  /** Who publishes it, as a post's source line will name them. */
  name: string;
  url: string;
  format: SourceFormat;
  kind: SourceKind;
  /** At most this many items per run, newest first. */
  take: number;
  /** GitHub releases: which tags count as news (see keepsRelease). */
  releases?: ReleaseRule;
  /** Every item is on topic, so the keyword pre-filter is skipped — or its feed
   *  gives too little text for the filter to judge, and the screener should. */
  onTopic?: boolean;
  /** How far back an item may be, when this source's news is slower than the run's default. */
  maxAgeDays?: number;
}

const gh = (repo: string, name: string, releases: ReleaseRule = "minor"): Source => ({
  id: `gh-${repo.split("/")[1]}`,
  name,
  url: `https://github.com/${repo}/releases.atom`,
  format: "feed",
  kind: "release",
  take: 5,
  releases,
  onTopic: true,
});

const ARXIV_QUERY =
  '(abs:"KV cache" OR abs:quantization OR abs:"speculative decoding" OR abs:"LLM inference" OR abs:"LLM serving" OR abs:"mixture of experts") AND (cat:cs.CL OR cat:cs.LG OR cat:cs.DC)';

export const SOURCES: Source[] = [
  // Serving engines and runtimes
  gh("vllm-project/vllm", "vLLM"),
  // SGLang ships features in the last number (v0.5.20, v0.5.21, ...): x.y.0 alone would never match.
  gh("sgl-project/sglang", "SGLang", "stable"),
  gh("ollama/ollama", "Ollama"),
  gh("huggingface/transformers", "Transformers"),
  gh("NVIDIA/TensorRT-LLM", "TensorRT-LLM"),
  // Models
  {
    id: "hf-trending",
    name: "Hugging Face",
    url: "https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=40&pipeline_tag=text-generation",
    format: "hf-models",
    kind: "model",
    take: 15,
    onTopic: true,
    // Trending lags release: a model trends for days or weeks after it appears.
    maxAgeDays: 14,
  },
  // The Qwen blog feed (qwenlm.github.io) stopped in September 2025; Qwen models still arrive through trending.
  { id: "mistral-news", name: "Mistral AI", url: "https://mistral.ai/rss.xml", format: "feed", kind: "blog", take: 10 },
  { id: "openai-news", name: "OpenAI", url: "https://openai.com/news/rss.xml", format: "feed", kind: "blog", take: 15 },
  { id: "google-ai", name: "Google", url: "https://blog.google/technology/ai/rss/", format: "feed", kind: "blog", take: 10 },
  // Engineering blogs
  { id: "vllm-blog", name: "vLLM", url: "https://vllm.ai/blog/rss.xml", format: "feed", kind: "blog", take: 5, onTopic: true },
  { id: "hf-blog", name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", format: "feed", kind: "blog", take: 15, onTopic: true },
  { id: "nvidia-dev", name: "NVIDIA", url: "https://developer.nvidia.com/blog/feed/", format: "feed", kind: "blog", take: 25 },
  { id: "rocm-blogs", name: "AMD ROCm", url: "https://rocm.blogs.amd.com/blog/atom.xml", format: "feed", kind: "blog", take: 10 },
  { id: "pytorch-blog", name: "PyTorch", url: "https://pytorch.org/blog/feed/", format: "feed", kind: "blog", take: 10 },
  { id: "simonw", name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", format: "feed", kind: "blog", take: 20 },
  // Research
  {
    id: "arxiv",
    name: "arXiv",
    url: `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(ARXIV_QUERY)}&sortBy=submittedDate&sortOrder=descending&max_results=30`,
    format: "feed",
    kind: "paper",
    take: 15,
  },
  // Aggregators
  { id: "localllama", name: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day", format: "feed", kind: "forum", take: 15 },
  {
    id: "hn",
    name: "Hacker News",
    url: "https://hn.algolia.com/api/v1/search_by_date?query=LLM&tags=story&numericFilters=points%3E80&hitsPerPage=30",
    format: "hn",
    kind: "forum",
    take: 15,
    // The search already asks for LLM stories; a title is all there is to filter on.
    onTopic: true,
  },
];

/** Hosts whose pages count as a primary source when a forum post links to them. */
export const PRIMARY_HOSTS = [
  "huggingface.co",
  "github.com",
  "arxiv.org",
  "openai.com",
  "anthropic.com",
  "blog.google",
  "deepmind.google",
  "ai.meta.com",
  "mistral.ai",
  "qwenlm.github.io",
  "qwen.ai",
  "deepseek.com",
  "nvidia.com",
  "amd.com",
  "pytorch.org",
  "vllm.ai",
  "lmsys.org",
];

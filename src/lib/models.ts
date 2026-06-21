import type { ModelArch } from "./calc";

// Curated architecture database. Serves two purposes:
//   1. Quick-pick presets in the UI.
//   2. Fallback architecture for GATED models (Llama, Gemma, some Mistral)
//      whose config.json returns 401 from the browser. These values are
//      public knowledge published in each model's documentation.
//
// `hfId` lets us match a searched/entered HF repo id against a known arch.

export interface KnownModel extends ModelArch {
  id: string;
  displayName: string;
  family: string;
  /** Hugging Face repo id this entry corresponds to. */
  hfId: string;
  gated?: boolean;
  isMoE?: boolean;
}

export const KNOWN_MODELS: KnownModel[] = [
  // ---- Meta Llama (gated) ----
  {
    id: "llama-3.2-1b", displayName: "Llama 3.2 1B Instruct", family: "Llama", hfId: "meta-llama/Llama-3.2-1B-Instruct",
    gated: true, numParams: 1.236e9, numLayers: 16, hiddenSize: 2048, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 64, vocabSize: 128256, maxContext: 131072,
  },
  {
    id: "llama-3.2-3b", displayName: "Llama 3.2 3B Instruct", family: "Llama", hfId: "meta-llama/Llama-3.2-3B-Instruct",
    gated: true, numParams: 3.213e9, numLayers: 28, hiddenSize: 3072, numAttentionHeads: 24, numKeyValueHeads: 8, headDim: 128, vocabSize: 128256, maxContext: 131072,
  },
  {
    id: "llama-3.1-8b", displayName: "Llama 3.1 8B Instruct", family: "Llama", hfId: "meta-llama/Llama-3.1-8B-Instruct",
    gated: true, numParams: 8.03e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, vocabSize: 128256, maxContext: 131072,
  },
  {
    id: "llama-3.3-70b", displayName: "Llama 3.3 70B Instruct", family: "Llama", hfId: "meta-llama/Llama-3.3-70B-Instruct",
    gated: true, numParams: 70.55e9, numLayers: 80, hiddenSize: 8192, numAttentionHeads: 64, numKeyValueHeads: 8, headDim: 128, vocabSize: 128256, maxContext: 131072,
  },
  {
    id: "llama-3.1-405b", displayName: "Llama 3.1 405B Instruct", family: "Llama", hfId: "meta-llama/Llama-3.1-405B-Instruct",
    gated: true, numParams: 405.85e9, numLayers: 126, hiddenSize: 16384, numAttentionHeads: 128, numKeyValueHeads: 8, headDim: 128, vocabSize: 128256, maxContext: 131072,
  },

  // ---- Mistral ----
  {
    id: "mistral-7b-v0.3", displayName: "Mistral 7B Instruct v0.3", family: "Mistral", hfId: "mistralai/Mistral-7B-Instruct-v0.3",
    gated: true, numParams: 7.248e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, vocabSize: 32768, maxContext: 32768,
  },
  {
    id: "mistral-nemo-12b", displayName: "Mistral Nemo 12B Instruct", family: "Mistral", hfId: "mistralai/Mistral-Nemo-Instruct-2407",
    gated: true, numParams: 12.25e9, numLayers: 40, hiddenSize: 5120, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, vocabSize: 131072, maxContext: 128000,
  },
  {
    id: "mixtral-8x7b", displayName: "Mixtral 8x7B Instruct", family: "Mistral", hfId: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    gated: true, isMoE: true, numParams: 46.7e9, activeParams: 12.9e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, vocabSize: 32000, maxContext: 32768,
  },
  {
    id: "mixtral-8x22b", displayName: "Mixtral 8x22B Instruct", family: "Mistral", hfId: "mistralai/Mixtral-8x22B-Instruct-v0.1",
    gated: true, isMoE: true, numParams: 140.6e9, activeParams: 39e9, numLayers: 56, hiddenSize: 6144, numAttentionHeads: 48, numKeyValueHeads: 8, headDim: 128, vocabSize: 32768, maxContext: 65536,
  },

  // ---- Google Gemma (gated) ----
  {
    id: "gemma-2-9b", displayName: "Gemma 2 9B IT", family: "Gemma", hfId: "google/gemma-2-9b-it",
    gated: true, numParams: 9.24e9, numLayers: 42, hiddenSize: 3584, numAttentionHeads: 16, numKeyValueHeads: 8, headDim: 256, vocabSize: 256000, maxContext: 8192,
  },
  {
    id: "gemma-2-27b", displayName: "Gemma 2 27B IT", family: "Gemma", hfId: "google/gemma-2-27b-it",
    gated: true, numParams: 27.2e9, numLayers: 46, hiddenSize: 4608, numAttentionHeads: 32, numKeyValueHeads: 16, headDim: 128, vocabSize: 256000, maxContext: 8192,
  },

  // ---- Qwen (public — also useful as presets) ----
  {
    id: "qwen2.5-0.5b", displayName: "Qwen2.5 0.5B Instruct", family: "Qwen", hfId: "Qwen/Qwen2.5-0.5B-Instruct",
    numParams: 0.494e9, numLayers: 24, hiddenSize: 896, numAttentionHeads: 14, numKeyValueHeads: 2, headDim: 64, vocabSize: 151936, maxContext: 32768,
  },
  {
    id: "qwen2.5-7b", displayName: "Qwen2.5 7B Instruct", family: "Qwen", hfId: "Qwen/Qwen2.5-7B-Instruct",
    numParams: 7.616e9, numLayers: 28, hiddenSize: 3584, numAttentionHeads: 28, numKeyValueHeads: 4, headDim: 128, vocabSize: 152064, maxContext: 32768,
  },
  {
    id: "qwen2.5-14b", displayName: "Qwen2.5 14B Instruct", family: "Qwen", hfId: "Qwen/Qwen2.5-14B-Instruct",
    numParams: 14.77e9, numLayers: 48, hiddenSize: 5120, numAttentionHeads: 40, numKeyValueHeads: 8, headDim: 128, vocabSize: 152064, maxContext: 32768,
  },
  {
    id: "qwen2.5-32b", displayName: "Qwen2.5 32B Instruct", family: "Qwen", hfId: "Qwen/Qwen2.5-32B-Instruct",
    numParams: 32.76e9, numLayers: 64, hiddenSize: 5120, numAttentionHeads: 40, numKeyValueHeads: 8, headDim: 128, vocabSize: 152064, maxContext: 32768,
  },
  {
    id: "qwen2.5-72b", displayName: "Qwen2.5 72B Instruct", family: "Qwen", hfId: "Qwen/Qwen2.5-72B-Instruct",
    numParams: 72.7e9, numLayers: 80, hiddenSize: 8192, numAttentionHeads: 64, numKeyValueHeads: 8, headDim: 128, vocabSize: 152064, maxContext: 32768,
  },

  // ---- Microsoft Phi (public) ----
  {
    id: "phi-3-mini", displayName: "Phi-3 mini 4k", family: "Phi", hfId: "microsoft/Phi-3-mini-4k-instruct",
    numParams: 3.82e9, numLayers: 32, hiddenSize: 3072, numAttentionHeads: 32, numKeyValueHeads: 32, headDim: 96, vocabSize: 32064, maxContext: 4096,
  },
];

const byHfId = new Map(KNOWN_MODELS.map((m) => [m.hfId.toLowerCase(), m]));

export function findKnownByHfId(hfId: string): KnownModel | undefined {
  return byHfId.get(hfId.toLowerCase());
}

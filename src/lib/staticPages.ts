// The static guides scripts/genPages.ts builds, named once so the app can link to
// them and the generator and the tests agree on what exists.
//
// A page per preset model, and a page per GPU on this shortlist: the cards people
// actually search for, across consumer, workstation, data-center and unified-memory
// hardware. Not all 43 devices — a page nobody searches for is only more pages.

export const FEATURED_GPU_IDS: readonly string[] = [
  "rtx3060-12",
  "rtx4060ti-16",
  "rtx3090-24",
  "rtx4090-24",
  "rx7900xtx-24",
  "rtx5090-32",
  "a6000-48",
  "rtx6000ada-48",
  "l40s-48",
  "a100-80",
  "h100-80",
  "rtxpro6000-96",
  "h200-141",
  "b200-192",
  "apple-m4max-128",
  "apple-m3ultra-512",
  "amd-strixhalo-128",
  "nv-dgxspark-128",
];

export const MODELS_HUB = "models/";
export const CONCEPTS_HUB = "concepts/";
/** The concept guides (scripts/concepts.ts), by the name the app uses to link to them. */
export const CONCEPT_FILES = {
  kvCache: "concepts/kv-cache.html",
  attention: "concepts/gqa-mqa-mla.html",
  quantization: "concepts/quantization.html",
} as const;
export const GPUS_HUB = "gpus/";
export const modelPageFile = (modelId: string) => `models/${modelId}.html`;
export const gpuPageFile = (gpuId: string) => `gpus/${gpuId}.html`;

// The primary sources the tools' explanatory copy cites: the papers the engine is
// checked against, and the files in this repository that hold a page's figures or
// rules. Each tool's About card links the ones its copy relies on, so a claim can be
// checked where it is made; scripts/test-invariants.ts keeps the links live.

const REPO = "https://github.com/tahircengiz/LLMScale/blob/main/";

export const SOURCE_URLS = {
  zero: "https://arxiv.org/abs/1910.02054",
  qlora: "https://arxiv.org/abs/2305.14314",
  deepseekV2: "https://arxiv.org/abs/2405.04434",
  gpuSpecs: `${REPO}docs/gpu-specs.md`,
  fitRules: `${REPO}src/lib/fit.ts`,
} as const;

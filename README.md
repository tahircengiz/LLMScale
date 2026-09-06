# LLMScale

**How much GPU memory does an LLM actually need — and what runs it?**

A fast, client-side calculator that models the terms `params × 2` misses, and
names every assumption it makes.

🔗 **[tahircengiz.github.io/LLMScale](https://tahircengiz.github.io/LLMScale/)** — no account, no backend, no install.

![The VRAM calculator, sizing DeepSeek-V3 on an H200](docs/media/sizing.png)

## What it accounts for

| | |
|---|---|
| **Weights** | at FP16/BF16, FP8, INT8 or INT4 — auto-detected from the repo's own `quantization_config` |
| **KV cache** | scaled by context window × concurrent users, using each model's **real GQA layout** |
| **MLA** | DeepSeek's multi-head latent attention caches one compressed latent per layer, not a K/V pair per head — worth ~25× on V3 |
| **MoE** | every expert stays resident; decode speed uses only the *active* ones |
| **Overhead** | activations, fragmentation and CUDA context, not hand-waved |
| **GPU fit** | which cards hold it, how many users fit, the maximum context for one user |

Architecture is pulled **live from the Hugging Face Hub**. Gated repos (Llama,
Gemma, Mistral) can't be read from a browser, so their configs ship in a bundled
database alongside a curated preset list. Repos with no config of their own —
GGUF forks, for instance — are resolved through their `base_model` lineage, and
the page says so.

## Eight surfaces

| | |
|---|---|
| **VRAM Sizing** | the calculator |
| **Fine-tune** | LoRA, QLoRA and full fine-tune memory — gradients, optimizer state, activations |
| **Task Fit** | is this model right for chat, code, RAG, agents, vision…? Transparent rule-based scoring |
| **Model Anatomy** | a visual X-ray: parameter distribution, precision mix, GQA head grouping, KV growth |
| **Model Compare** | 2–4 models side by side |
| **Name Decoder** | what 70B, A3B, AWQ, GGUF, FP8, MXFP4 actually mean |
| **vLLM Params** | a tuned `vllm serve` command with per-flag rationale |
| **LLM 101** | an interactive walkthrough of how a language model works |

![Fine-tuning memory for Llama 3.3 70B under QLoRA](docs/media/finetune.png)

## The numbers are checked, not asserted

Every behavioural claim is validated against a published result before it ships,
and each one is a permanent test:

- **Mixed-precision Adam at 16 bytes/parameter** — the ZeRO paper's `2Ψ+2Ψ+12Ψ`.
- **QLoRA fine-tunes a 65B model on one 48 GB card** — the engine puts it at
  43.3 GiB. Checking this found two real errors: an FFN width that was guessed
  rather than read, and NF4 at 0.55 bytes instead of 0.516.
- **MLA caches `(d_c + d_h^R)·l` per token** — DeepSeek-V2 §2.1.3, which also
  states it equals "GQA with only 2.25 groups". Both are tests.
- **gpt-oss-120b fits a single 80 GB GPU** — its own model card. 61.2 of 76.0
  usable GiB at 4-bit.

Twelve test suites run without a build step:

```bash
npm test              # the VRAM engine
npm run test:mla      # multi-head latent attention, against the paper
npm run test:train    # fine-tuning memory
npm run test:invariants   # guards against silent drift between lists
```

![Model anatomy for Qwen3 32B](docs/media/anatomy.png)

## How it works

| Component | Formula |
|---|---|
| Weights | `params × bytes_per_param` |
| KV cache (GQA/MHA) | `2 × layers × kv_heads × head_dim × bytes × context × concurrency` |
| KV cache (MLA) | `layers × (kv_lora_rank + qk_rope_head_dim) × bytes × context × concurrency` |
| Overhead | `(weights + kv) × overhead% + cuda_context` |

GPU fit assumes ~95% of nominal VRAM is usable after the driver reserve. Unified
memory devices (Apple M-series, Strix Halo, DGX Spark) are modelled with their
realistic usable slice rather than the full pool.

> These are **planning figures, not guarantees**. Real usage depends on the
> serving engine — vLLM, TGI, llama.cpp — and on paged-attention efficiency.

## Privacy

The **calculation** runs in your browser: there is no backend and no account, so
nothing is sent anywhere to be computed. Visits are counted anonymously and
without cookies via self-hosted [Umami](https://umami.is/). Note that the app
keeps its state in the URL, so the model and settings you pick are part of what
that counter receives.

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4. Three themes — dark, light, and
a translucent "glass" material. Bilingual EN/TR. No runtime dependencies beyond
React (plus Three.js, code-split into the LLM 101 page alone).

```bash
npm install
npm run dev        # local dev server
npm run typecheck
npm run build      # → dist/
npm run deploy     # → gh-pages branch
```

## Source and use

The tool is free to use and always will be. The source is not currently
published, so there is no licence to grant and no LICENSE file — if that
changes, this section is the first thing to update.

Built by [Tahir Cengiz](https://github.com/tahircengiz).

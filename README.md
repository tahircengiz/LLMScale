# LLMScale

A fast, client-side calculator that estimates how much **GPU memory** a large language model needs — and which GPUs can actually run it.

It accounts for the things most "params × 2" estimates miss:

- **Model weights** at any precision (FP16/BF16, FP8, INT8, INT4)
- **KV cache** that scales with **context window** × **concurrent users**, using each model's real **GQA** (grouped-query attention) layout
- **MoE** models (loads *all* experts, not just the active ones)
- **Activation + fragmentation overhead** and CUDA context
- **GPU fit**: which cards fit, how many concurrent users fit on a given GPU, and the max context for a single user

Model architecture is pulled **live from the Hugging Face Hub** (`config.json` + the model API), with a built-in database covering popular **gated** models (Llama, Gemma, Mistral) whose config isn't readable from the browser. Everything runs in the browser — no backend, no data leaves your machine.

🔗 **Live:** https://tahircengiz.github.io/LLMScale/

## How it works

| Component | Formula |
|---|---|
| Weights | `params × bytes_per_param` |
| KV cache | `2 × layers × kv_heads × head_dim × bytes × context × concurrency` |
| Overhead | `(weights + kv) × overhead% + cuda_context` |

GPU fit assumes ~95% of nominal VRAM is usable after driver reserve.

> Estimates are for capacity planning, not a guarantee. Actual usage depends on the serving engine (vLLM, TGI, llama.cpp), paged-attention efficiency, and special attention variants such as MLA (DeepSeek), which are not yet modeled.

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4. No runtime dependencies beyond React.

## Development

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm test           # validate the VRAM engine (node, no build needed)
npm run build      # production build → dist/
```

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds and
publishes to GitHub Pages.

The Vite `base` is set to `/LLMScale/` (the repo path). For a custom
domain or the user root, build with `VITE_BASE=/ npm run build`.

## License

MIT — built by [Tahir Cengiz](https://github.com/tahircengiz).

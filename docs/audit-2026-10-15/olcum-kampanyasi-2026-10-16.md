# Measurement campaign, audit phase 3b (2026-10-16)

The speed and overhead items of the 2026-10-15 audit (D1, D4, D2, E1, E5, C4) measured on our own hardware and fitted to
published figures. Machine-readable copy: `scripts/fixtures/vllm/calib-rtx4070ti-2026-10-16.json`; trimmed startup
logs: `scripts/fixtures/vllm/1016-*.txt`; checks: `scripts/test-audit3.ts`.

## Setup

| | |
|---|---|
| Card | X570, RTX 4070 Ti 12 GB (504.2 GB/s, 80.2 BF16 TFLOPS rated), driver 617.14, WSL2 kernel 6.18.33 |
| vLLM | 0.31.0 from PyPI, wheel `vllm-0.31.0-cp38-abi3-manylinux_2_28_x86_64.whl`, sha256 `39132b43…ef3433` checked against PyPI before install; torch 2.13.0+cu130, transformers 5.17.0 |
| Why not the Docker image | `vllm/vllm-openai:v0.31.0` exists (Hub digest `sha256:c1c9f6fd…67c3`), but WSL's Docker daemon was not running and there is no NVIDIA container toolkit; installing one would change X570. The PyPI wheel is the same release. |
| Models | pulled through ModelServ (`hdd` pool, X570's own key), never from the Hub directly |
| Exposure | `vllm serve --host 127.0.0.1` inside WSL; nothing listened beyond the VM |
| Memory | `torch.cuda.mem_get_info()`: 10.78 of 11.99 GiB free under WSL, so `--gpu-memory-utilization` 0.85 (text) and 0.89 (multimodal, MoE GPTQ); 0.92 is refused |
| Game safety | X570's `ailab-gameguard` task was **disabled** when we started (found state). A watchdog on GTR9 checked X570 every ~10 s with the guard's own path rule and would have run `ai-off`; it saw no game from 16:25 to 10:43 UTC. ComfyUI (AI mode) was not started, so the card held only vLLM. |
| Found / left state | WSL off, `ailab-comfyui` Ready (not running), guard Disabled, one pre-existing portproxy (`0.0.0.0:8099`), 184 MiB VRAM in use. Restored: `ai-off`, the four `ailab-faz3b-*` tasks and every `C:\ai-lab\faz3b*` file removed, the WSL venv, the ten models and today's vLLM/FlashInfer caches deleted. |

Method. TTFT: one request, `max_tokens` 1, time to the first streamed chunk, median of 5 after a warm-up; prompts are
token-id lists, so their length is exact; prefix caching off. Decode: B requests at once, 128-token prompts, 129 tokens
each with `ignore_eos`; per request the median gap between streamed tokens 10 to 120, then the median over requests;
two rounds. The offline `LLM` timings repeat the 2026-10-13 method (`calib-rtx4070ti.json`).

## GTR9: Strix Halo, vLLM ROCm (2026-10-17, with the user's yes)

| | |
|---|---|
| Machine | GTR9, Ryzen AI Max+ 395, Radeon 8060S (gfx1151), 96 GiB carve-out, LPDDR5X 256 GB/s |
| vLLM | the existing `~/vllm-venv` (0.20.1rc1.dev133, torch 2.10, HIP 7.2), the build of the 2026-08-22 31.8 tok/s run; no install |
| Flags | `--enforce-eager` (HIP graphs hang on gfx1151), `--gpu-memory-utilization 0.22`, serve defaults otherwise (8,192 tokens, 1,024 sequences), `--host 127.0.0.1`, prefix caching off; LiteLLM untouched |
| Guard | a loop would have stopped vLLM below 2.5 GiB of available host memory or above 95 GiB of VRAM; it never fired (lowest 14.5 GiB available, VRAM 92.4 GiB) |
| Duration | 11:31–11:44 UTC; VRAM back to 70.86 GiB, port and processes gone, scratch removed |
| Models | `cpatonn/Qwen3-30B-A3B-Instruct-2507-AWQ-4bit` (already in `~/hf-cache`), `Qwen/Qwen3-8B` BF16 (through ModelServ's `hdd` pool) |

`torch.cuda.mem_get_info()` reported **95.83 of 96.0 GiB free** while llama.cpp's Vulkan servers held 70.86 GiB of the
same carve-out: HIP does not see Vulkan's allocations, so vLLM's free-memory check cannot stop it from overcommitting a
shared Strix Halo. At 0.22 the budget (21.12 GiB) fit the real 25 GiB.

| model | decode b=1 | b=8 | b=32 | TTFT 64 | 256 | 1,024 | 4,096 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Qwen3-30B-A3B AWQ (W4A16 g32) | 30.61 ms (32.7 tok/s) | 86.92 | 157.76 | 214.8 | 291.5 | 594.9 | 2,718.2 |
| Qwen3-8B BF16 | 77.56 ms (12.9 tok/s) | 175.24 | 186.09 | 194.5 | 373.2 | 779.0 | 3,060.5 |

Startup (GiB): AWQ weights 17.04, peak activation 2.15, non-torch 0.29, graphs 0 (eager), KV 1.64 (17,888 tokens);
Qwen3-8B 15.27, 2.19, 0.26, 0, 3.39 (24,704 tokens). Logs: `scripts/fixtures/vllm/1017-strix-*.txt`; data:
`calib-strixhalo-2026-10-17.json`.

Fitted, as device constants of Strix Halo (gpus.ts): every layer of a step costs **0.36 ms** in eager mode (0.065 with
CUDA graphs on NVIDIA), and matrix multiplies reach **34%** of the rated 60 TFLOPS. Qwen3-8B then lands at 77.4 ms per
token (measured 77.6) and 3,051 ms for 4,096 tokens (3,061); Qwen3-30B-A3B AWQ at 26.6 ms (30.6), where 9.8 was shown.
Past four sequences ROCm leaves its skinny GEMV kernels and each step costs 2–2.2× more; short prompts read 2–3× slower;
both stay labelled as upper bounds.

## Raw figures (X570)

### Decode: time between tokens (ms), `vllm serve`, 128-token prompts

| model | weights | b=1 | b=2 | b=4 | b=8 | b=16 | b=32 | b=64 |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Qwen/Qwen3-0.6B | bf16 | 4.28 | 4.54 | 4.69 | 4.97 | 5.43 | 6.29 | 8.21 |
| Qwen/Qwen3-1.7B | bf16 | 9.02 | 9.40 | 9.59 | 9.80 | 10.27 | 11.53 | 13.42 |
| Qwen/Qwen3-4B | bf16 | 18.88 | – | 19.84 | – | 20.70 | – | – |
| Qwen/Qwen2.5-7B-Instruct-AWQ | int4 | 11.48 | 11.53 | 11.64 | 11.95 | 12.36 | 13.34 | – |
| ibm-granite/granite-3.1-1b-a400m-instruct | bf16 | 3.67 | 4.64 | 5.52 | 6.32 | 7.23 | 8.03 | 9.23 |
| ibm-granite/granite-3.1-3b-a800m-instruct | bf16 | 5.97 | 8.00 | 10.14 | 12.38 | 13.66 | 15.79 | 17.60 |
| Qwen/Qwen1.5-MoE-A2.7B-Chat-GPTQ-Int4 | int4 | 5.73 | 6.49 | 8.55 | 10.90 | 14.54 | – | – |

The same steps through the offline `LLM` class ((t₁₂₉ − t₁)/128, ms), for comparison with `calib-rtx4070ti.json`:

| model | b=1 | b=2 | b=4 | b=8 | b=16 | b=32 | b=64 |
|---|---:|---:|---:|---:|---:|---:|---:|
| qwen3-0.6b | 4.31 | 4.60 | 4.78 | 4.96 | 5.45 | 6.28 | 8.11 |
| qwen3-1.7b | 9.04 | 9.34 | 9.50 | 9.85 | 10.35 | 11.53 | 13.34 |
| qwen3-4b | 19.02 | – | 19.74 | – | 20.76 | – | – |
| qwen2.5-7b-awq | 11.57 | 11.65 | 11.67 | 11.96 | 12.49 | 13.30 | – |
| granite-1b-a400m | 3.69 | 4.60 | 5.23 | 6.45 | 7.04 | 8.06 | 9.21 |
| granite-3b-a800m | 6.02 | 7.81 | 8.81 | 11.44 | 13.76 | 15.62 | 17.67 |
| qwen1.5-moe-gptq | 5.70 | 6.74 | 8.38 | 10.55 | 13.84 | – | – |

### Time to first token (ms), one request, `vllm serve`, median of 5

| model | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 |
|---|---:|---:|---:|---:|---:|---:|---:|
| qwen3-0.6b | 12.8 | 12.5 | 12.3 | 15.7 | 24.2 | 43.6 | 97.9 |
| qwen3-1.7b | 15.3 | 15.3 | 20.4 | 28.1 | 49.3 | 96.4 | 204.2 |
| qwen3-4b | 24.9 | 27.1 | 36.0 | 59.9 | 115.5 | – | – |
| qwen2.5-7b-awq | 22.1 | – | 52.7 | – | 187.8 | – | 767.6 |
| granite-1b-a400m | 12.1 | 12.7 | 14.5 | 16.5 | 31.0 | 43.0 | 88.7 |
| granite-3b-a800m | 19.8 | 20.9 | 23.7 | 28.3 | 46.1 | 81.2 | 171.3 |
| qwen1.5-moe-gptq | 22.9 | – | 33.9 | – | 84.1 | – | 314.0 |

Offline `LLM` prefill (ms; the first shapes after start-up are slow, so the API figures are the reference):

| model | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 |
|---|---:|---:|---:|---:|---:|---:|---:|
| qwen3-0.6b | 14.1 | 18.1 | 26.9 | 14.8 | 23.5 | 42.1 | 93.8 |
| qwen3-1.7b | 26.8 | 32.2 | 19.9 | 28.9 | 47.9 | 95.4 | 200.3 |
| qwen3-4b | 45.2 | 26.4 | 36.1 | 57.8 | 113.2 | – | – |
| qwen2.5-7b-awq | 52.3 | – | 51.0 | – | 185.9 | – | 771.1 |
| granite-1b-a400m | 11.2 | 11.8 | 12.6 | 14.6 | 30.4 | 41.4 | 82.2 |
| granite-3b-a800m | 19.7 | 20.4 | 22.6 | 27.1 | 46.0 | 80.1 | 161.1 |
| qwen1.5-moe-gptq | 21.4 | – | 33.2 | – | 81.9 | – | 299.6 |

Not usable: Qwen3-4B at 64 sequences (9,008 KV tokens hold 35 of them), RedHatAI Qwen3-8B-FP8-dynamic (8.8 GiB of
weights leave −0.07 GiB of KV cache even at 0.89; startup log kept), the offline prefill of the first shapes after
start-up (14–45 ms where `vllm serve` answers in 12–25).

### Startup logs (GiB per GPU)

| run | batch | weights | peak activation | non-torch | CUDA graphs | KV cache | overhead = budget − weights − KV |
|---|---|---:|---:|---:|---:|---:|---:|
| Qwen3-1.7B, 0.85 | 2048/256 | 3.22 | 0.93 | 0.30 | 0.20 | 5.75 | 1.22 |
| granite-3.1-1b-a400m, 0.85 | 2048/256 | 2.50 | 0.35 | 0.21 | 0.18 | 7.14 | 0.55 |
| granite-3.1-3b-a800m, 0.85 | 2048/256 | 6.17 | 0.46 | 0.29 | 0.23 | 3.28 | 0.74 |
| Qwen1.5-MoE-A2.7B GPTQ, 0.89 | 2048/256 | 7.91 | 1.08 | 0.37 | 0.28 | 1.32 | 1.44 |
| Qwen2.5-VL-3B, 0.89 (1 video of 16,384 tokens profiled) | 2048/256 | 7.16 | 2.56 | 0.42 | 0.22 | 0.54 | 2.97 |
| Qwen2.5-VL-3B, 0.89, `--skip-mm-profiling` | 2048/256 | 7.16 | 0.59 | 0.42 | 0.22 | 2.51 | 1.00 |
| Qwen2.5-VL-3B, 0.89, text-only (`limit-mm-per-prompt` 0) | 2048/256 | 5.91 | 1.06 | 0.34 | 0.22 | 3.36 | 1.40 |
| Gemma 3 4B (unsloth mirror), 0.89 (8 images of 256 tokens profiled) | 2048/256 | 8.61 | n/l | 0.40 | n/l | 0.39 | 1.67 |
| Gemma 3 4B, 0.89, `--skip-mm-profiling` | 2048/256 | 8.61 | 0.58 | 0.40 | 0.24 | 1.09 | 0.97 |

Encoder profiling costs the KV cache 1.97 GiB on Qwen2.5-VL-3B and 0.70 GiB on Gemma 3 4B (C4). The text-only mode does
not load the vision tower (1.25 GiB less weight).

## What the figures say

- **D1, decode.** A pure bandwidth ceiling misses a fixed cost per step: ~0.065 ms per layer on this card with CUDA graphs,
  the same for dense and MoE models. Once it is in, weights stream at ~92% of rated bandwidth. The "MoE inefficiency" of
  the audit was mostly bytes: gpt-oss keeps attention, router and embeddings in BF16, so by parameter share its step read
  half of what it does; and an untied input embedding is a lookup, not a read. No separate MoE factor fits: granite's BF16
  experts cost what they read, and so do GPTQ experts through Marlin once a quantized checkpoint's 16-bit embedding and
  head are kept out of the experts' bytes. From 4 to 16 sequences a MoE touches fewer experts than uniform
  routing predicts, so the model is up to 20% slow there (the safe side).
- **D4, time to first token.** A request costs ~6 ms before its prompt is read (`vllm serve` here; NVIDIA's 200-token
  figure on an H100 leaves 5.5 ms), plus the pass's per-layer cost. Prompt FLOPs leave out the embedding lookup and run the
  output head for the last token only. MoE prompts read slower than their dense FLOPs (granite 1.4×, Qwen1.5-MoE 1.2×) and
  stay an upper bound (K13).
- **D2, several GPUs.** Two all-reduces per layer at 0.014 ms each reproduce NIM's Llama 70B on 2 and 4 H100s and the
  8-GPU Llama 70B/405B figures on H100 and MI300X within 14%. Bandwidth still adds up across the group.
- **E5.** vLLM 0.31.0 pads MXFP4 experts to its kernel's tile (`fused_moe/oracle/mxfp4.py`,
  `mxfp4_round_up_hidden_size_and_intermediate_size`): Marlin (Turing to Ada, and SM120 Blackwell, which the Triton path
  stops short of) rounds hidden to 256 and each GPU's expert width to 128; FlashInfer's TRT-LLM kernel on B200/B300 the
  same; Hopper's Triton kernel only the expert width, to 64; ROCm 256 both (gpt-oss's SwiGLU variant is not SiLU). With the
  BF16 attention, `gpt-oss-120b` on 2 H100s is 31.02 GiB per GPU (log 31.36, v0.23), on 2 A100s 34.31 (34.38), gpt-oss-20b
  on an L40S 13.70 (13.72). The GH200 log (64.38 GiB) is v0.16, which padded differently; 0.31's rule gives 60.77.
- **MoE overhead.** vLLM's fused MoE kernels hold, per token and routed expert, the gate-up output, its activation
  and the down output: 2 × tokens × k × (3·I + H) bytes. Added to the profiling peak, it brings the four MoE startups
  (granite 1B/3B, Qwen1.5-MoE GPTQ, Qwen3-30B-A3B AWQ on GTR9) within 0.15 GiB.
- **E1, overhead on several GPUs.** The NCCL 0.5 GiB is not double-counted: the only recent TP2 log with a
  non-torch figure (vllm#54559, A100 TP2 + EP) shows 1.15 GiB, which the same terms (runtime, sampler, 0.5 GiB of NCCL) put at about 1.2. The large misses (Qwen3-235B TP4 7.7 GiB,
  DeepSeek-V3.2 DP8+EP ~10, DeepSeek DP16+EPLB 24) are MoE runs with expert-parallel all-to-all backends and older vLLM
  (0.10–0.26); nothing in 0.31 measured on several GPUs separates them. Left labelled: the calculator now says that on
  several GPUs its overhead is a lower bound for large MoE models.
- **C4.** The encoder's profiling pass adds ~23 bytes per patch per unit of encoder width, on as many of the largest items
  as the encoder budget holds (the larger of `max_num_batched_tokens` and one item): one 65,536-patch video for Qwen-VL,
  8 to 64 SigLIP images for Gemma 3 depending on the card.

## Before and after (model speed ÷ measured; GiB rows: model ÷ log)

Ratios above 1 mean the app was too fast (speed) or too large (memory). "Before" is main `c318a27`.

| case | before | after | measured | before ratio | after ratio |
|---|---:|---:|---:|---:|---:|
| x570 qwen3-0.6b b1 ms | 3.01 | 4.45 | 4.28 | 1.42 | 0.96 |
| x570 qwen3-0.6b b16 ms | 3.83 | 5.32 | 5.43 | 1.42 | 1.02 |
| x570 qwen3-0.6b ttft64 ms | 2.96 | 10.39 | 12.75 | 4.31 | 1.23 |
| x570 qwen3-0.6b ttft512 ms | 8.87 | 14.49 | 15.72 | 1.77 | 1.08 |
| x570 qwen3-0.6b ttft4096 ms | 94.31 | 84.47 | 97.88 | 1.04 | 1.16 |
| x570 qwen3-1.7b b1 ms | 8.59 | 9.30 | 9.02 | 1.05 | 0.97 |
| x570 qwen3-1.7b b16 ms | 9.40 | 10.17 | 10.27 | 1.09 | 1.01 |
| x570 qwen3-1.7b ttft64 ms | 8.53 | 15.24 | 15.30 | 1.79 | 1.00 |
| x570 qwen3-1.7b ttft512 ms | 24.83 | 28.24 | 28.12 | 1.13 | 1.00 |
| x570 qwen3-1.7b ttft4096 ms | 221.93 | 194.45 | 204.18 | 0.92 | 1.05 |
| x570 qwen3-4b b1 ms | 20.01 | 19.76 | 18.88 | 0.94 | 0.96 |
| x570 qwen3-4b b16 ms | 21.07 | 20.88 | 20.70 | 0.98 | 0.99 |
| x570 qwen3-4b ttft64 ms | 19.94 | 25.68 | 24.91 | 1.25 | 0.97 |
| x570 qwen3-4b ttft512 ms | 58.14 | 60.97 | 59.92 | 1.03 | 0.98 |
| x570 qwen2.5-7b-awq b1 ms | 13.84 | 11.51 | 11.48 | 0.83 | 1.00 |
| x570 qwen2.5-7b-awq b16 ms | 14.25 | 11.95 | 12.36 | 0.87 | 1.03 |
| x570 qwen2.5-7b-awq ttft64 ms | 13.81 | 19.42 | 22.07 | 1.60 | 1.14 |
| x570 qwen2.5-7b-awq ttft4096 ms | 910.98 | 795.11 | 767.62 | 0.84 | 0.97 |
| x570 granite-1b-a400m b1 ms | 2.15 | 3.43 | 3.67 | 1.71 | 1.07 |
| x570 granite-1b-a400m b16 ms | 6.93 | 7.66 | 7.23 | 1.04 | 0.94 |
| x570 granite-1b-a400m ttft64 ms | 6.62 | 13.31 | 12.10 | 1.83 | 0.91 |
| x570 granite-1b-a400m ttft512 ms | 6.62 | 13.31 | 16.49 | 2.49 | 1.24 |
| x570 granite-1b-a400m ttft4096 ms | 60.07 | 61.92 | 88.72 | 1.48 | 1.43 |
| x570 granite-3b-a800m b1 ms | 4.41 | 5.92 | 5.97 | 1.36 | 1.01 |
| x570 granite-3b-a800m b16 ms | 16.43 | 16.47 | 13.66 | 0.83 | 0.83 |
| x570 granite-3b-a800m ttft64 ms | 16.36 | 22.30 | 19.75 | 1.21 | 0.89 |
| x570 granite-3b-a800m ttft512 ms | 16.36 | 22.30 | 28.30 | 1.73 | 1.27 |
| x570 granite-3b-a800m ttft4096 ms | 123.05 | 122.56 | 171.33 | 1.39 | 1.40 |
| x570 qwen1.5-moe-gptq b1 ms | 4.01 | 5.33 | 5.73 | 1.43 | 1.07 |
| x570 qwen1.5-moe-gptq b16 ms | 16.34 | 15.29 | 14.54 | 0.89 | 0.95 |
| x570 qwen1.5-moe-gptq ttft64 ms | 20.86 | 24.19 | 22.86 | 1.10 | 0.95 |
| x570 qwen1.5-moe-gptq ttft4096 ms | 328.05 | 264.99 | 313.96 | 0.96 | 1.18 |
| N1 8B fp8 H100 ms | 3.46 | 4.76 | 4.53 | 1.31 | 0.95 |
| N2 8B bf16 H100 ms | 6.07 | 7.03 | 6.52 | 1.07 | 0.93 |
| N3 8B fp8 L40S ms | 13.42 | 12.49 | 13.97 | 1.04 | 1.12 |
| N4 8B fp8 H200 ms | 2.42 | 3.95 | 4.24 | 1.75 | 1.07 |
| N7 70B fp8 2xH100 ms | 13.65 | 18.98 | 18.67 | 1.37 | 0.98 |
| N8 70B fp8 4xH100 ms | 6.82 | 13.21 | 14.24 | 2.09 | 1.08 |
| A1 70B fp8 8xMI300X ms | 2.15 | 9.26 | 9.30 | 4.32 | 1.00 |
| A2 70B fp8 8xH100 ms | 3.41 | 10.32 | 10.20 | 3.00 | 0.99 |
| A3 405B fp8 8xH100 ms | 19.15 | 28.21 | 28.80 | 1.50 | 1.02 |
| G1 oss20b 5090 tok/s | 649.14 | 275.68 | 282.51 | 2.30 | 0.98 |
| G2 oss20b 4090 tok/s | 365.14 | 191.01 | 221.95 | 1.65 | 0.86 |
| G3 oss120b PRO6000 tok/s | 514.14 | 191.75 | 196.31 | 2.62 | 0.98 |
| T1 oss120b 8xB200 tok/s | 17218.22 | 291.27 | 420.00 | 41.00 | 0.69 |
| N1 ttft1000 ms | 13.75 | 20.06 | 19.03 | 1.38 | 0.95 |
| N2b ttft200 ms | 5.99 | 12.95 | 11.96 | 2.00 | 0.92 |
| E5 oss120b H100 TP2 GiB/GPU | 29.69 | 31.02 | 31.36 | 0.95 | 0.99 |
| E5 oss120b A100 TP2 GiB/GPU | 29.69 | 34.31 | 34.38 | 0.86 | 1.00 |
| E5 oss20b L40S GiB | 11.93 | 13.70 | 13.72 | 0.87 | 1.00 |
| C4 Qwen2.5-VL-3B overhead GiB | 1.27 | 3.06 | 2.97 | 0.43 | 1.03 |
| C4 Gemma3-4B overhead GiB | 2.07 | 2.87 | 1.67 | 1.24 | 1.72 |
| strix qwen3-30b-a3b-awq b1 ms | 9.79 | 26.55 | 30.61 | 3.12 | 1.15 |
| strix qwen3-30b-a3b-awq b8 ms | 39.03 | 50.87 | 86.92 | 2.23 | 1.71 |
| strix qwen3-30b-a3b-awq ttft4096 ms | 946.25 | 1443.26 | 2718.23 | 2.87 | 1.88 |
| strix qwen3-8b b1 ms | 80.13 | 77.38 | 77.56 | 0.97 | 1.00 |
| strix qwen3-8b b8 ms | 81.09 | 78.41 | 175.24 | 2.16 | 2.23 |
| strix qwen3-8b ttft4096 ms | 2001.29 | 3050.89 | 3060.52 | 1.53 | 1.00 |

Left: on Strix Halo, more than four sequences and short prompts run 2–3× slower than the model (ROCm leaves its skinny
GEMV kernels past batch 4), and a MoE's prompt is read slower still; labelled as upper bounds. TRT-LLM on 8× B200 (T1)
runs faster than the model's per-layer cost allows. Gemma 3 4B's language-model overhead is over-estimated by ~1.1 GiB
(its 262k-entry output layer); an over-estimate, kept for now.

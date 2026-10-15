# LLMScale GPU data / speed / overhead audit — full tables (2026-10-15)

Read-only audit. App numbers come from running the repo's own functions (src/lib/perf.ts, overhead.ts, calc.ts, gpus.ts, planner.ts) with Node on GTR9 (copy at ~/projects/LLMScale-audit-gpu, scripts in audit/; local copies in scripts/ here).
Sources: speed-sources.md (published speeds, URLs and quotes), vllm-logs.md (vLLM startup logs and device totals, URLs and verbatim lines), vllm/ (vLLM v0.31.0 source files fetched from GitHub tag v0.31.0).

## 1. Usable memory: app vs vLLM 0.31 budget (gpu_memory_utilization 0.92 × torch-visible total)

vLLM 0.31: `request_memory()` (vllm/v1/worker/utils.py) = ceil(total_memory × util), where total_memory = torch.accelerator.get_memory_info() (cudaMemGetInfo total). Totals from vllm-logs.md Part 2 (Linux).

| device | app usable GiB | torch total GiB | vLLM budget GiB | app − vLLM | note |
|---|---:|---:|---:|---:|---|
| rtx3090-24 | 22.08 | 23.60 | 21.71 | 0.37 | |
| rtx4090-24 | 22.08 | 23.65 | 21.76 | 0.32 | |
| rtx5090-32 | 29.44 | 31.38 | 28.87 | 0.57 | |
| l4-24 | 22.08 | 22.00 | 20.24 | 1.84 | |
| a6000-48 | 44.16 | 47.53 | 43.73 | 0.43 | |
| rtx6000ada-48 | 44.16 | 47.49 | 43.69 | 0.47 | |
| l40s-48 | 44.16 | 44.36 | 40.81 | 3.35 | |
| t4-16 | 14.72 | 14.57 | 13.40 | 1.32 | |
| v100-32 | 29.44 | 31.73 | 29.19 | 0.25 | |
| a30-24 | 22.08 | 23.50 | 21.62 | 0.46 | |
| a100-40 | 36.80 | 39.38 | 36.23 | 0.57 | |
| a100-80 | 73.60 | 79.15 | 72.82 | 0.78 | |
| h100-80 | 73.60 | 79.15 | 72.82 | 0.78 | |
| h200-141 | 129.72 | 139.76 | 128.58 | 1.14 | |
| b200-192 | 165.60 | 178.35 | 164.08 | 1.52 | |
| gh200-96 | 88.32 | 94.50 | 86.94 | 1.38 | |
| h100nvl-94 | 86.48 | 93.09 | 85.64 | 0.84 | |
| rtxpro6000-96 | 88.32 | 94.97 | 87.37 | 0.95 | |
| b300-288 | 248.40 | 267.69 | 246.27 | 2.13 | |
| mi300x-192 | 176.64 | 191.98 | 176.62 | 0.02 | |
| mi325x-256 | 235.52 | 255.98 | 235.50 | 0.02 | |
| mi355x-288 | 264.96 | 287.98 | 264.94 | 0.02 | |
| amd-strixhalo-128 | 96.00 | 96.00 | 88.32 | 7.68 | |
| nv-dgxspark-128 | 120.00 | 121.63 | 111.90 | 8.10 | |

Notes: L40S/L4/T4 ship with ECC on (1/16 of GDDR reserved: L40S 49140 → 46068 MiB; T4 16384 → 15360). RTX A6000 / RTX 6000 Ada ship ECC off (47.5 GiB); with ECC on they drop to ~44.4 GiB like the L40S. RTX PRO 6000 (GDDR7) shows 97887 MiB either way. Unified rows: app returns vramGiB without the 0.92 share on the sizing pages; the vLLM page (src/lib/vllm.ts:161) does apply 0.92 × vramGiB, so the two pages disagree. DGX Spark users run at 0.8 in practice (vLLM gate compares host-available memory against 0.92 × 121.63 GiB; vllm#59101, vllm#44740: "Desired GPU memory utilization is (0.8, 97.3 GiB)").

### Fit flips (app usable vs vLLM budget; calc.ts at the app's own overhead)

| setup | need GiB | app: usable / fits / users / max ctx | vLLM budget: usable / fits / users / max ctx |
|---|---:|---|---|
| Llama 3.3 70B INT4 (AWQ) on 1× L40S @8k | 44.01 | 44.16 / yes / 1 / 8,672 | 41.39 (ECC, 44.99 total; 40.81 at torch 44.36) / no / 0 / 0 |
| Llama 3.1 8B BF16 on L4 @8k | 17.71 | 22.08 / yes / 5 / 44,000 | 20.69 / yes / 3 / 32,656 |
| Llama 3.3 70B FP8 on Strix Halo 128 (96 GiB carve-out) @32k | 81.76 | 96.00 / yes / 2 / 79,424 | 88.32 / yes / 1 / 54,256 |
| Qwen2.5-72B FP8 on DGX Spark @32k | 84.58 | 120.00 / yes / 4 | 111.90 / yes / 3 (at the practical 0.8: 97.3 → 1) |

## 2. Speed: app vs published measurements

App = decodeStep / prefillTime (perf.ts) with the device's gpus.ts figures; multi-GPU rows use the planner's `gpus` argument (bandwidth and FLOPS × n, no communication cost). "app speed ÷ published" > 1 means the app predicts faster than measured. Engines differ (TRT-LLM/NIM is usually faster than vLLM, llama.cpp differs again), so a ratio > 1 against TRT-LLM is a lower bound on the error against vLLM.

| case | model/dtype | GPUs | setup | metric | app | bound | published | app speed ÷ published |
|---|---|---|---|---|---:|---|---:|---:|
| N2 8B bf16 H100 TRT c1 | llama-3.1-8b bf16 | 1x h100-80 | b=1 ctx=1500 | tpotMs | 6.1 | memory | 6.52 | 1.07x |
| N1 8B fp8 H100 TRT c1 | llama-3.1-8b fp8 | 1x h100-80 | b=1 ctx=1500 | tpotMs | 3.5 | memory | 4.53 | 1.29x |
| N3 8B bf16 L40S TRT c1 | llama-3.1-8b bf16 | 1x l40s-48 | b=1 ctx=1500 | tpotMs | 23.5 | memory | 22.05 | 0.94x |
| N3 8B fp8 L40S TRT c1 | llama-3.1-8b fp8 | 1x l40s-48 | b=1 ctx=1500 | tpotMs | 13.4 | memory | 13.97 | 1.04x |
| N4 8B fp8 H200 TRT c1 | llama-3.1-8b fp8 | 1x h200-141 | b=1 ctx=1500 | tpotMs | 2.4 | memory | 4.24 | 1.77x |
| N5 8B fp8 H100 c25 | llama-3.1-8b fp8 | 1x h100-80 | b=25 ctx=1500 | tpotMs | 5.2 | memory | 5.84 | 1.12x |
| N5 8B fp8 H100 c50 | llama-3.1-8b fp8 | 1x h100-80 | b=50 ctx=1500 | tpotMs | 7.1 | memory | 7.26 | 1.02x |
| N5 8B fp8 H100 c100 | llama-3.1-8b fp8 | 1x h100-80 | b=100 ctx=1500 | tpotMs | 10.7 | memory | 10.04 | 0.94x |
| N5 8B fp8 H100 c200 | llama-3.1-8b fp8 | 1x h100-80 | b=200 ctx=1500 | tpotMs | 18.1 | memory | 16.02 | 0.89x |
| N5 8B fp8 H100 c100 total | llama-3.1-8b fp8 | 1x h100-80 | b=100 ctx=1500 | total | 9324.5 | memory | 9392 | 0.99x |
| N6 8B fp8 H100 TTFT 5k | llama-3.1-8b fp8 | 1x h100-80 | b=1 ctx=5000 prompt=5000 | ttftMs | 73.1 | compute | 77.45 | 1.06x |
| N6 8B fp8 H100 TTFT 20k | llama-3.1-8b fp8 | 1x h100-80 | b=1 ctx=20000 prompt=20000 | ttftMs | 358.8 | compute | 403.2 | 1.12x |
| N6b 8B fp16 H100 TTFT 5k | llama-3.1-8b bf16 | 1x h100-80 | b=1 ctx=5000 prompt=5000 | ttftMs | 146.3 | compute | 128.32 | 0.88x |
| N6b 8B fp16 H100 TTFT 20k | llama-3.1-8b bf16 | 1x h100-80 | b=1 ctx=20000 prompt=20000 | ttftMs | 717.6 | compute | 637.84 | 0.89x |
| N6c 8B fp8 L40S TTFT 20k | llama-3.1-8b fp8 | 1x l40s-48 | b=1 ctx=20000 prompt=20000 | ttftMs | 968.8 | compute | 1299.33 | 1.34x |
| N7 70B fp8 2xH100 TP2 c1 | llama-3.3-70b fp8 | 2x h100-80 | b=1 ctx=1500 | tpotMs | 13.6 | memory | 18.67 | 1.37x |
| N7 70B fp8 2xH100 TTFT 1k | llama-3.3-70b fp8 | 2x h100-80 | b=1 ctx=1000 prompt=1000 | ttftMs | 60.0 | compute | 82.46 | 1.37x |
| N7 70B fp8 2xH100 c100 total | llama-3.3-70b fp8 | 2x h100-80 | b=100 ctx=1500 | total | 4400.5 | memory | 2895 | 1.52x |
| N8 70B fp8 4xH100 TP4 c1 | llama-3.3-70b fp8 | 4x h100-80 | b=1 ctx=1500 | tpotMs | 6.8 | memory | 14.24 | 2.09x |
| A1 70B fp8 8xMI300X vLLM c1 | llama-3.3-70b fp8 | 8x mi300x-192 | b=1 ctx=1100 | tpotMs | 2.2 | memory | 9.3 | 4.23x |
| A2 70B fp8 8xH100 TRT c1 | llama-3.3-70b fp8 | 8x h100-80 | b=1 ctx=1100 | tpotMs | 3.4 | memory | 10.2 | 3.00x |
| A3 405B fp8 8xMI300X vLLM c1 | llama-3.1-405b fp8 | 8x mi300x-192 | b=1 ctx=1100 | tpotMs | 12.1 | memory | 25.3 | 2.09x |
| A3 405B fp8 8xH100 TRT c1 | llama-3.1-405b fp8 | 8x h100-80 | b=1 ctx=1100 | tpotMs | 19.2 | memory | 28.8 | 1.50x |
| T1 gpt-oss-120b 8xB200 TRT c1 | gpt-oss-120b int4 | 8x b200-192 | b=1 ctx=2000 | perUser | 17218.2 | memory | 420 | 41.00x |
| L1 8B fp8 Spark SGLang c1 | llama-3.1-8b fp8 | 1x nv-dgxspark-128 | b=1 ctx=512 | perUser | 23.9 | memory | 20.5 | 1.17x |
| L3 gpt-oss-20b 5090 Ollama | gpt-oss-20b int4 | 1x rtx5090-32 | b=1 ctx=512 | perUser | 645.5 | memory | 205 | 3.15x |
| G1 gpt-oss-20b 5090 llama.cpp | gpt-oss-20b int4 | 1x rtx5090-32 | b=1 ctx=64 | perUser | 649.1 | memory | 282.5 | 2.30x |
| G2 gpt-oss-20b 4090 llama.cpp | gpt-oss-20b int4 | 1x rtx4090-24 | b=1 ctx=64 | perUser | 365.1 | memory | 222 | 1.64x |
| G3 gpt-oss-120b PRO6000 llama.cpp | gpt-oss-120b int4 | 1x rtxpro6000-96 | b=1 ctx=64 | perUser | 514.1 | memory | 196.3 | 2.62x |
| S1 gpt-oss-20b Spark llama.cpp | gpt-oss-20b int4 | 1x nv-dgxspark-128 | b=1 ctx=16 | perUser | 99.0 | memory | 83.4 | 1.19x |
| S2 gpt-oss-120b Spark llama.cpp | gpt-oss-120b int4 | 1x nv-dgxspark-128 | b=1 ctx=16 | perUser | 78.4 | memory | 58.7 | 1.34x |
| S3 Qwen3-Coder-30B Q8 Spark llama.cpp | qwen3-coder-30b-a3b int8 | 1x nv-dgxspark-128 | b=1 ctx=16 | perUser | 64.8 | memory | 61.1 | 1.06x |
| S4 Qwen2.5-Coder-7B Q8 Spark llama.cpp | qwen2.5-coder-7b int8 | 1x nv-dgxspark-128 | b=1 ctx=16 | perUser | 25.1 | memory | 29.4 | 0.85x |
| H1 gpt-oss-120b Strix llama.cpp d0 | gpt-oss-120b int4 | 1x amd-strixhalo-128 | b=1 ctx=16 | perUser | 73.5 | memory | 51.8 | 1.42x |
| H1 gpt-oss-120b Strix llama.cpp d32k | gpt-oss-120b int4 | 1x amd-strixhalo-128 | b=1 ctx=32768 | perUser | 51.2 | memory | 19.8 | 2.59x |
| H3 Qwen3-Coder-30B Q8 Strix llama.cpp | qwen3-coder-30b-a3b int8 | 1x amd-strixhalo-128 | b=1 ctx=16 | perUser | 60.8 | memory | 52.6 | 1.16x |
| H5 Qwen3-30B-A3B Q4 Strix Vulkan | qwen3-30b-a3b int4 | 1x amd-strixhalo-128 | b=1 ctx=64 | perUser | 110.2 | memory | 72 | 1.53x |
| GTR9 Qwen3-30B-A3B AWQ vLLM-ROCm | qwen3-30b-a3b int4 | 1x amd-strixhalo-128 | b=1 ctx=512 | perUser | 107.7 | memory | 31.8 | 3.39x |
| GTR9 Qwen3-30B-A3B Q4_K_M llama.cpp | qwen3-30b-a3b int4 | 1x amd-strixhalo-128 | b=1 ctx=512 | perUser | 107.7 | memory | 88.2 | 1.22x |
| X1 8B F16 4090 llama.cpp | llama-3.1-8b bf16 | 1x rtx4090-24 | b=1 ctx=256 | perUser | 50.1 | memory | 54.84 | 0.91x |
| X1 8B F16 L40S llama.cpp | llama-3.1-8b bf16 | 1x l40s-48 | b=1 ctx=256 | perUser | 42.9 | memory | 43.69 | 0.98x |
| X1 8B F16 RTX6000Ada llama.cpp | llama-3.1-8b bf16 | 1x rtx6000ada-48 | b=1 ctx=256 | perUser | 47.7 | memory | 52.32 | 0.91x |

Plus the user's own GTR9 measurement (prj_HomeLab/infra/gtr9/llm-serving/README.md, 2026-08-22): Qwen3-30B-A3B-Instruct-2507 AWQ-4bit on vLLM/ROCm 31.8 tok/s, Q4_K_M on llama.cpp/Vulkan 88.2 tok/s; app 107.7.

Calibration card (scripts/fixtures/vllm/calib-rtx4070ti.json, app at 0.9 compute efficiency):

| run | app | vLLM 0.31 | app − vLLM |
|---|---:|---:|---:|
| Qwen3-0.6B prefill 512 | 11.1 ms | 44.5 ms | −75% |
| Qwen3-0.6B prefill 2048 | 49.3 ms | 45.3 ms | +9% |
| Qwen3-0.6B decode b=1 / 16 / 256 | 3.78 / 4.60 / 17.70 ms | 4.22 / 5.30 / 21.01 ms | −10 / −13 / −16% |
| Qwen3-4B prefill 256 / 2048 / 3968 | 28.8 / 245.4 / 506.6 ms | 36.7 / 227.3 / 466.4 ms | −22 / +8 / +9% |
| Qwen3-4B decode b=1 / 32 | 20.01 / 22.19 ms | 18.76 / 22.50 ms | +7 / −1% |

### Planner output (planOptions, workload 2 rps, 1000 in / 1000 out, TTFT ≤ 2 s, TPOT ≤ 15 ms, max-model-len 8192)

| model | GPU | planner says |
|---|---|---|
| Llama 3.3 70B FP8 | H100 | TP4: 1 replica handles 7.22 rps at TPOT 7.99 ms; TP8: 20.4 rps at 3.68 ms. Published c=1 ITL: TP4 14.24 ms (NIM), TP8 10.2 ms (TRT-LLM 0.16) |
| gpt-oss-120b | B200 | TP1: 15.4 rps per GPU, TPOT 0.47 ms (≈2,100 tok/s per user); TP8: TPOT 0.06 ms. Published 8×B200 TP8 c=1: 420 tok/s per user (2.4 ms) |
| gpt-oss-120b | H100 | TP1: 1.77 rps, TPOT 1.84 ms (≈540 tok/s per user) |
| DeepSeek V3 FP8 | H200 | TP8: 2.07 rps at TPOT 14.4 ms (≈29 sequences in decode). AMD reports DeepSeek-R1 TPOT under 50 ms up to c=16–32 on 8× MI300X |

## 3. Per-GPU overhead: app vs real vLLM startup logs

Overhead = requested − weights − KV (vllm-logs.md). Before v0.21 CUDA graph memory was captured after KV sizing, so for those rows the app's figure is shown without graphs.

| log | batch | weights app / log | overhead app / log | graphs app / log | (weights+overhead) app − log |
|---|---|---|---|---|---:|
| #15 Llama-3.1-8B bf16 H100 TP1 v0.11 gmu.9 | 8192/1024 | 14.96 / 14.99 | 1.62 / 1.89 | 0.50 / n/l | -0.31 |
| #14 Llama-3.3-70B bf16 A100 TP4 v0.9.1 | 2048/256 | 32.85 / 32.89 | 1.26 / 0.78 | 1.50 / 1.66 | 0.44 |
| #13 gpt-oss-120b A100 TP2 v0.11 | 2048/256 | 29.69 / 34.38 | 1.38 / 1.12 | 0.45 / 1.2 | -4.43 |
| #6 gpt-oss-120b H100 TP2 v0.23 | 8192/1024 | 29.69 / 31.36 | 2.40 / 4.43 | 0.45 / 0.6 | -3.69 |
| #9 gpt-oss-120b GH200-144 TP1 v0.16 | 8192/1024 | 59.39 / 64.38 | 2.00 / 7.51 | 0.45 / 1.94 | -10.51 |
| #19 gpt-oss-20b L40S TP1 eager v0.11 | 2048/256 | 11.93 / 13.72 | 1.42 / 1.87 | 0.38 / n/l | -2.24 |
| #11 Qwen3-235B-A22B fp8 TP4 (H200@0.5) v0.10 | 8192/1024 | 55.03 / 55.13 | 1.52 / 7.66 | 0.98 / n/l | -6.24 |
| #16 DeepSeek-V3.2 fp8 8xH200 DP8+EP v0.13 (app: TP8) | 8192/1024 | 79.91 / 97.78 | 1.36 / 10 | 1.08 / n/l | -26.52 |

Row #16 is DP8+EP (attention replicated), which the sizing path models as TP8, so its weights do not compare; its overhead (≈10 GiB vs app ≈1.4 without graphs) does.
Qwen3-235B-A22B-FP8 on 4× H100 at util 0.9 (vllm#21348 issue body): log KV 8.11 GiB/GPU, 178,880 tokens; app KV 14.47 GiB/GPU, ≈322,800 tokens (+78%).
Single-GPU logs from v0.21+ (rows 1, 2, 18, 19 of vllm-logs.md, models not in the app): 1.9–3.1 GiB, in line with the app's ~1.6–2.4 GiB for similar shapes.

### MoE presets without moeIntermediateSize (src/lib/models.ts; used by scripts/genPages.ts and as the offline/gated fallback)

| model | GPU, TP, batch | preset activation / total overhead | with config moe_intermediate_size | over by |
|---|---|---|---|---:|
| Qwen3-30B-A3B (768) | H100 TP1, 8192 tok | 3.00 / 4.17 GiB | 0.58 / 1.75 | 2.42 GiB |
| Qwen3-30B-A3B | MI300X TP8, 16384 | 0.75 / 2.42 | 0.09 / 1.76 | 0.66 |
| Qwen3-Coder-30B-A3B (768) | H100 TP1 | 3.00 / 4.17 | 0.58 / 1.75 | 2.42 |
| DeepSeek V3 (2048) | H200 TP8, 8192 | 1.13 / 3.35 | 0.22 / 2.44 | 0.91 |
| DeepSeek V3 | MI300X TP8, 16384 | 2.25 / 4.48 | 0.28 / 2.51 | 1.97 |

## 4. Batch defaults (batchFor / vllmBatch vs vLLM v0.31.0 EngineArgs.get_batch_defaults)

vLLM 0.31.0 (vllm/engine/arg_utils.py ~L2858): ≥160 GiB → 16384 tokens / 1024 seqs (both contexts); ≥70 GiB and not "a100" → OPENAI_API_SERVER 8192 / 1024; else 2048 / 256. Graph cap 1024 on capability family 100 (B200/B300/GB200/GB300), else 512 (vllm/config/vllm.py ~L2454). The app matches. Device memory here is NVML total (get_device_total_memory); none of the listed cards sits near a threshold, so GB-as-GiB does not change the branch. Open question: on DGX Spark NVML memory info is "Not Supported"; if nvmlDeviceGetMemoryInfo raises, get_batch_defaults falls back to device_memory = 0 → 2048 / 256, while the app uses 8192 / 1024 (unverified).

## 5. Datasheet cross-check (gpus.ts vs docs/gpu-specs.md, docs/gpu-tflops.md, vendor pages)

All 43 bf16/fp8/fp4 figures equal docs/gpu-tflops.md (dense; NVIDIA sparse figures halved; GeForce at FP32-accumulate). Open discrepancies that reach the engine: H100 "(SXM/PCIe)" carries SXM figures (PCIe: 2,000 GB/s, ~756 TF BF16); RTX PRO 6000 in the datacenter tier carries the Workstation 1,792 GB/s (Server Edition 1,597); RTX 3090 / Ti and RTX 4080 / Super combined rows (+7.7% / +2.7% bandwidth for the Ti / Super); A100 80GB PCIe is 1,935 GB/s vs 2,039 (SXM). MIG profiles equal NVIDIA's supported-profiles page; actual slice memory is a little under the name (H100 PCIe -lgip: 1g.10gb 9.62, 1g.20gb/2g.20gb 19.50, 3g/4g.40gb 39.25, 7g.80gb 79.00 GiB; Scaleway docs).

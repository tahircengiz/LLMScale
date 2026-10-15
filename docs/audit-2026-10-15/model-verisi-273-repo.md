# LLMScale model-data audit: per-repo table (2026-10-15)

Each row is the app's own resolveModel() output (src/lib/hf.ts at 328d0d5) run on GTR9 with anonymous Hugging Face requests, as the browser would make them. "source" = config | base | bundled | partial. KV columns are calc.ts kvBytesPerToken / kvBytesPerSeq at bf16 (32k tokens, one sequence, before vLLM block reservation). "flags" are automatic checks for config keys the parser ignores; see the audit report for verified numbers. Download counts are HF 30-day downloads at fetch time.

| repo | downloads | source | weightDtype | numParams (B) | hub total (B) | L | hidden | heads | kv | headDim | maxCtx | active (B) | experts/topk | attn/sliding/state layers | KV bytes/token bf16 | KV @32k GiB | flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| meta-llama/Llama-3.2-1B-Instruct | 6148408 | bundled | bf16 | 1.24 | 1.24 | 16 | 2048 | 32 | 8 | 64 | 131072 | - | - | - | 32768 | 1.00 | ok |
| meta-llama/Llama-3.2-3B-Instruct | 1308673 | bundled | bf16 | 3.21 | 3.21 | 28 | 3072 | 24 | 8 | 128 | 131072 | - | - | - | 114688 | 3.50 | ok |
| meta-llama/Llama-3.1-8B-Instruct | 5930556 | bundled | bf16 | 8.03 | 8.03 | 32 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| meta-llama/Meta-Llama-3-8B-Instruct | 613787 | partial | bf16 | 8.03 | 8.03 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| meta-llama/Llama-3.1-70B-Instruct | 84601 | partial | bf16 | 70.55 | 70.55 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| meta-llama/Llama-3.3-70B-Instruct | 265985 | bundled | bf16 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| meta-llama/Llama-3.1-405B-Instruct | 9600 | bundled | bf16 | 405.85 | 405.85 | 126 | 16384 | 128 | 8 | 128 | 131072 | - | - | - | 516096 | 15.75 | ok |
| meta-llama/Llama-3.2-11B-Vision-Instruct | 64510 | partial | bf16 | 10.67 | 10.67 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| meta-llama/Llama-4-Scout-17B-16E-Instruct | 164332 | partial | bf16 | 108.64 | 108.64 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| meta-llama/Llama-4-Maverick-17B-128E-Instruct | 9442 | partial | bf16 | 401.58 | 401.58 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 | 43268 | partial | fp8 | 401.65 | 401.65 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| meta-llama/Llama-2-7b-hf | 694497 | partial | fp16 | 6.74 | 6.74 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| unsloth/Llama-3.2-1B-Instruct | 761239 | config | bf16 | 1.24 | 1.24 | 16 | 2048 | 32 | 8 | 64 | 131072 | - | - | - | 32768 | 1.00 | ok |
| unsloth/Llama-3.3-70B-Instruct | 49019 | config | bf16 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| unsloth/Llama-4-Scout-17B-16E-Instruct | 2804 | config | bf16 | 108.64 | 108.64 | 48 | 5120 | 40 | 8 | 128 | 10485760 | 18.04 | 16/1 | - | 196608 | 6.00 | Llama4 chunked local attn ignored |
| unsloth/Llama-3.2-11B-Vision-Instruct | 14481 | config | bf16 | 10.67 | 10.67 | 40 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | cross-attn layers counted as self-attn |
| Qwen/Qwen2.5-0.5B-Instruct | 6002460 | config | bf16 | 0.49 | 0.49 | 24 | 896 | 14 | 2 | 64 | 32768 | - | - | - | 12288 | 0.38 | ok |
| Qwen/Qwen2.5-1.5B-Instruct | 6001369 | config | bf16 | 1.54 | 1.54 | 28 | 1536 | 12 | 2 | 128 | 32768 | - | - | - | 28672 | 0.88 | ok |
| Qwen/Qwen2.5-3B-Instruct | 4346907 | config | bf16 | 3.09 | 3.09 | 36 | 2048 | 16 | 2 | 128 | 32768 | - | - | - | 36864 | 1.12 | ok |
| Qwen/Qwen2.5-7B-Instruct | 7250653 | config | bf16 | 7.62 | 7.62 | 28 | 3584 | 28 | 4 | 128 | 32768 | - | - | - | 57344 | 1.75 | ok |
| Qwen/Qwen2.5-14B-Instruct | 1078231 | config | bf16 | 14.77 | 14.77 | 48 | 5120 | 40 | 8 | 128 | 32768 | - | - | - | 196608 | 6.00 | ok |
| Qwen/Qwen2.5-32B-Instruct | 1574387 | config | bf16 | 32.76 | 32.76 | 64 | 5120 | 40 | 8 | 128 | 32768 | - | - | - | 262144 | 8.00 | ok |
| Qwen/Qwen2.5-72B-Instruct | 270393 | config | bf16 | 72.71 | 72.71 | 80 | 8192 | 64 | 8 | 128 | 32768 | - | - | - | 327680 | 10.00 | ok |
| Qwen/Qwen2.5-Coder-7B-Instruct | 1597653 | config | bf16 | 7.62 | 7.62 | 28 | 3584 | 28 | 4 | 128 | 32768 | - | - | - | 57344 | 1.75 | ok |
| Qwen/Qwen2.5-Coder-32B-Instruct | 740593 | config | bf16 | 32.76 | 32.76 | 64 | 5120 | 40 | 8 | 128 | 32768 | - | - | - | 262144 | 8.00 | ok |
| Qwen/Qwen2.5-7B-Instruct-1M | 32232 | config | bf16 | 7.62 | 7.62 | 28 | 3584 | 28 | 4 | 128 | 1010000 | - | - | - | 57344 | 1.75 | ok |
| Qwen/Qwen2.5-VL-3B-Instruct | 1999767 | config | bf16 | 3.75 | 3.75 | 36 | 2048 | 16 | 2 | 128 | 128000 | - | - | - | 36864 | 1.12 | ok |
| Qwen/Qwen2.5-VL-7B-Instruct | 5125691 | config | bf16 | 8.29 | 8.29 | 28 | 3584 | 28 | 4 | 128 | 128000 | - | - | - | 57344 | 1.75 | ok |
| Qwen/Qwen2.5-VL-72B-Instruct | 51413 | config | bf16 | 73.41 | 73.41 | 80 | 8192 | 64 | 8 | 128 | 128000 | - | - | - | 327680 | 10.00 | ok |
| Qwen/Qwen3-0.6B | 29853801 | config | bf16 | 0.75 | 0.75 | 28 | 1024 | 16 | 8 | 128 | 40960 | - | - | - | 114688 | 3.50 | ok |
| Qwen/Qwen3-1.7B | 4161033 | config | bf16 | 2.03 | 2.03 | 28 | 2048 | 16 | 8 | 128 | 40960 | - | - | - | 114688 | 3.50 | ok |
| Qwen/Qwen3-4B | 12219577 | config | bf16 | 4.02 | 4.02 | 36 | 2560 | 32 | 8 | 128 | 40960 | - | - | - | 147456 | 4.50 | ok |
| Qwen/Qwen3-8B | 9578964 | config | bf16 | 8.19 | 8.19 | 36 | 4096 | 32 | 8 | 128 | 40960 | - | - | - | 147456 | 4.50 | ok |
| Qwen/Qwen3-14B | 7308016 | config | bf16 | 14.77 | 14.77 | 40 | 5120 | 40 | 8 | 128 | 40960 | - | - | - | 163840 | 5.00 | ok |
| Qwen/Qwen3-32B | 3172856 | config | bf16 | 32.76 | 32.76 | 64 | 5120 | 64 | 8 | 128 | 40960 | - | - | - | 262144 | 8.00 | ok |
| Qwen/Qwen3-30B-A3B | 1259162 | config | bf16 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 40960 | 3.30 | 128/8 | - | 98304 | 3.00 | ok |
| Qwen/Qwen3-235B-A22B | 453458 | config | bf16 | 235.09 | 235.09 | 94 | 4096 | 64 | 4 | 128 | 40960 | 22.19 | 128/8 | - | 192512 | 5.88 | ok |
| Qwen/Qwen3-4B-Instruct-2507 | 3178283 | config | bf16 | 4.02 | 4.02 | 36 | 2560 | 32 | 8 | 128 | 262144 | - | - | - | 147456 | 4.50 | ok |
| Qwen/Qwen3-30B-A3B-Instruct-2507 | 1051915 | config | bf16 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 262144 | 3.35 | 128/8 | - | 98304 | 3.00 | ok |
| Qwen/Qwen3-235B-A22B-Instruct-2507 | 160609 | config | bf16 | 235.09 | 235.09 | 94 | 4096 | 64 | 4 | 128 | 262144 | 22.19 | 128/8 | - | 192512 | 5.88 | ok |
| Qwen/Qwen3-Coder-30B-A3B-Instruct | 422336 | config | bf16 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 262144 | 3.30 | 128/8 | - | 98304 | 3.00 | ok |
| Qwen/Qwen3-Coder-480B-A35B-Instruct | 39504 | config | bf16 | 480.15 | 480.15 | 62 | 6144 | 96 | 8 | 128 | 262144 | 35.47 | 160/8 | - | 253952 | 7.75 | ok |
| Qwen/Qwen3-Next-80B-A3B-Instruct | 202355 | config | bf16 | 81.32 | 81.32 | 48 | 2048 | 16 | 2 | 256 | 262144 | 5.53 | 512/10 | 12/-@-/36 | 24576 | 0.79 | ok |
| Qwen/Qwen3-VL-8B-Instruct | 6999638 | config | bf16 | 8.77 | 8.77 | 36 | 4096 | 32 | 8 | 128 | 262144 | - | - | - | 147456 | 4.50 | ok |
| Qwen/Qwen3-VL-30B-A3B-Instruct | 273635 | config | bf16 | 31.07 | 31.07 | 48 | 2048 | 32 | 4 | 128 | 262144 | 3.89 | 128/8 | - | 98304 | 3.00 | ok |
| Qwen/Qwen3-VL-235B-A22B-Instruct | 296444 | config | bf16 | 235.67 | 235.67 | 94 | 4096 | 64 | 4 | 128 | 262144 | 22.77 | 128/8 | - | 192512 | 5.88 | ok |
| Qwen/Qwen3-Coder-Next-FP8 | 995530 | config | fp8 | 79.68 | 79.68 | 48 | 2048 | 16 | 2 | 256 | 262144 | 3.88 | 512/10 | 12/-@-/36 | 24576 | 0.79 | ok |
| Qwen/Qwen3.5-0.8B | 2880351 | config | bf16 | 0.87 | 0.87 | 24 | 1024 | 8 | 2 | 256 | 262144 | - | - | 6/-@-/18 | 12288 | 0.38 | mtp_num_hidden_layers not counted in activeParams |
| Qwen/Qwen3.5-4B | 7944995 | config | bf16 | 4.66 | 4.66 | 32 | 2560 | 16 | 4 | 256 | 262144 | - | - | 8/-@-/24 | 32768 | 1.02 | mtp_num_hidden_layers not counted in activeParams |
| Qwen/Qwen3.5-9B | 8591266 | config | bf16 | 9.65 | 9.65 | 32 | 4096 | 16 | 4 | 256 | 262144 | - | - | 8/-@-/24 | 32768 | 1.02 | mtp_num_hidden_layers not counted in activeParams |
| Qwen/Qwen3.6-27B | 2288557 | config | bf16 | 27.78 | 27.78 | 64 | 5120 | 24 | 4 | 256 | 262144 | - | - | 16/-@-/48 | 65536 | 2.07 | mtp_num_hidden_layers not counted in activeParams |
| Qwen/Qwen3.6-35B-A3B | 3695301 | config | bf16 | 35.95 | 35.95 | 40 | 2048 | 16 | 2 | 256 | 262144 | 4.75 | 256/8 | 10/-@-/30 | 20480 | 0.66 | mtp_num_hidden_layers not counted in activeParams |
| Qwen/Qwen3.8-27B | 7363968 | config | bf16 | 27.78 | 27.78 | 64 | 5120 | 24 | 4 | 256 | 262144 | - | - | 16/-@-/48 | 65536 | 2.07 | mtp_num_hidden_layers not counted in activeParams |
| Qwen/Qwen3.8-Flash-Next | 2290500 | config | bf16 | 180.00 | 180.00 | 48 | 2560 | 24 | 2 | 256 | 262144 | 61.56 | 512/10 | 12/-@-/36 | 24576 | 0.80 | mtp_num_hidden_layers not counted in activeParams |
| google/gemma-2-2b-it | 391005 | partial | bf16 | 2.61 | 2.61 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-2-9b-it | 805108 | bundled | bf16 | 9.24 | 9.24 | 42 | 3584 | 16 | 8 | 256 | 8192 | - | - | -/21@4096/- | 344064 | 5.91 | ok |
| google/gemma-2-27b-it | 20019 | bundled | bf16 | 27.23 | 27.23 | 46 | 4608 | 32 | 16 | 128 | 8192 | - | - | -/23@4096/- | 376832 | 6.47 | ok |
| google/gemma-3-1b-it | 2046354 | partial | bf16 | 1.00 | 1.00 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-3-4b-it | 1138195 | partial | bf16 | 4.30 | 4.30 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-3-12b-it | 384453 | partial | bf16 | 12.19 | 12.19 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-3-27b-it | 413253 | partial | bf16 | 27.43 | 27.43 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-3n-E2B-it | 141575 | partial | bf16 | 5.44 | 5.44 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-3n-E4B-it | 12943 | partial | bf16 | 7.85 | 7.85 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| google/gemma-4-31B-it | 9180042 | config | bf16 | 31.27 | 31.27 | 60 | 5376 | 32 | 16 | 256 | 262144 | - | - | -/50@1024/- | 983040 | 5.78 | global_head_dim/num_global_kv_heads ignored |
| google/gemma-4-26B-A4B-it | 11170734 | config | bf16 | 25.81 | 25.81 | 30 | 2816 | 16 | 8 | 256 | 262144 | - | - | -/25@1024/- | 245760 | 1.45 | global_head_dim/num_global_kv_heads ignored; MoE top-k key not read -> no activeParams |
| unsloth/gemma-3-27b-it | 50668 | config | bf16 | 27.43 | 27.43 | 62 | 5376 | 32 | 16 | 128 | 131072 | - | - | -/52@1024/- | 507904 | 2.91 | tie absent, family default tied -> counted untied |
| unsloth/gemma-2-9b-it | 14175 | config | bf16 | 9.24 | 9.24 | 42 | 3584 | 16 | 8 | 256 | 8192 | - | - | - | 344064 | 10.50 | sliding_window 4096 not applied (no layer_types); tie absent, family default tied -> counted untied |
| mistralai/Mistral-7B-Instruct-v0.2 | 1629832 | config | bf16 | 7.24 | 7.24 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | ok |
| mistralai/Mistral-7B-Instruct-v0.3 | 2023922 | config | bf16 | 7.25 | 7.25 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | ok |
| mistralai/Mistral-Nemo-Instruct-2407 | 238120 | config | bf16 | 12.25 | 12.25 | 40 | 5120 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | ok |
| mistralai/Mistral-Small-24B-Instruct-2501 | 64030 | config | bf16 | 23.57 | 23.57 | 40 | 5120 | 32 | 8 | 128 | 32768 | - | - | - | 163840 | 5.00 | ok |
| mistralai/Mistral-Small-3.1-24B-Instruct-2503 | 295973 | config | bf16 | 24.01 | 24.01 | 40 | 5120 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | ok |
| mistralai/Mistral-Small-3.2-24B-Instruct-2506 | 248354 | config | bf16 | 24.01 | 24.01 | 40 | 5120 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | ok |
| mistralai/Mixtral-8x7B-Instruct-v0.1 | 209710 | config | bf16 | 46.70 | 46.70 | 32 | 4096 | 32 | 8 | 128 | 32768 | 12.90 | 8/2 | - | 131072 | 4.00 | ok |
| mistralai/Mixtral-8x22B-Instruct-v0.1 | 43065 | config | bf16 | 140.63 | 140.63 | 56 | 6144 | 48 | 8 | 128 | 65536 | 39.00 | 8/2 | - | 229376 | 7.00 | ok |
| mistralai/Ministral-8B-Instruct-2410 | 104480 | config | bf16 | 8.02 | 8.02 | 36 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 147456 | 4.50 | ok |
| mistralai/Magistral-Small-2509 | 6859 | config | bf16 | 24.01 | 24.01 | 40 | 5120 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | ok |
| mistralai/Devstral-Small-2507 | 9834 | config | bf16 | 23.57 | 23.57 | 40 | 5120 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | ok |
| mistralai/Mistral-Large-Instruct-2411 | 9341 | config | bf16 | 122.61 | 122.61 | 88 | 12288 | 96 | 8 | 128 | 131072 | - | - | - | 360448 | 11.00 | ok |
| mistralai/Ministral-3-8B-Instruct-2512 | 116423 | config | fp8 | 8.92 | 8.92 | 34 | 4096 | 32 | 8 | 128 | 262144 | - | - | - | 139264 | 4.25 | ok |
| mistralai/Devstral-2-123B-Instruct-2512 | 5080 | config | fp8 | 125.03 | 125.03 | 88 | 12288 | 96 | 8 | 128 | 262144 | - | - | - | 360448 | 11.00 | ok |
| microsoft/Phi-3-mini-4k-instruct | 370819 | config | bf16 | 3.82 | 3.82 | 32 | 3072 | 32 | 32 | 96 | 4096 | - | - | - | 393216 | 12.00 | sliding_window 2047 not applied (no layer_types) |
| microsoft/Phi-3-mini-128k-instruct | 192500 | config | bf16 | 3.82 | 3.82 | 32 | 3072 | 32 | 32 | 96 | 131072 | - | - | - | 393216 | 12.00 | ok |
| microsoft/Phi-3-medium-128k-instruct | 10859 | config | bf16 | 13.96 | 13.96 | 40 | 5120 | 40 | 10 | 128 | 131072 | - | - | - | 204800 | 6.25 | ok |
| microsoft/Phi-3.5-mini-instruct | 366990 | config | bf16 | 3.82 | 3.82 | 32 | 3072 | 32 | 32 | 96 | 131072 | - | - | - | 393216 | 12.00 | ok |
| microsoft/Phi-3.5-MoE-instruct | 112336 | config | bf16 | 41.87 | 41.87 | 32 | 4096 | 32 | 8 | 128 | 131072 | 6.64 | 16/2 | - | 131072 | 4.00 | ok |
| microsoft/phi-4 | 363287 | config | bf16 | 14.66 | 14.66 | 40 | 5120 | 40 | 10 | 128 | 16384 | - | - | - | 204800 | 6.25 | ok |
| microsoft/Phi-4-mini-instruct | 358611 | config | bf16 | 3.84 | 3.84 | 32 | 3072 | 24 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| microsoft/Phi-4-reasoning | 25165 | config | bf16 | 14.66 | 14.66 | 40 | 5120 | 40 | 10 | 128 | 32768 | - | - | - | 204800 | 6.25 | ok |
| microsoft/Phi-4-mini-flash-reasoning | 2198 | config | bf16 | 3.85 | 3.85 | 32 | 2560 | 40 | 20 | 64 | 262144 | - | - | - | 163840 | 5.00 | sliding_window 512 not applied (no layer_types) |
| microsoft/phi-2 | 530628 | config | fp16 | 2.78 | 2.78 | 32 | 2560 | 32 | 32 | 80 | 2048 | - | - | - | 327680 | 10.00 | ok |
| deepseek-ai/DeepSeek-V2-Lite-Chat | 106142 | config | bf16 | 15.71 | 15.71 | 27 | 2048 | 16 | 16 | 128 | 163840 | 2.66 | 64/6 | - | 31104 | 0.95 | ok |
| deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct | 693107 | config | bf16 | 15.71 | 15.71 | 27 | 2048 | 16 | 16 | 128 | 163840 | 2.66 | 64/6 | - | 31104 | 0.95 | ok |
| deepseek-ai/DeepSeek-V2.5 | 5815 | config | bf16 | 235.74 | 235.74 | 60 | 5120 | 128 | 128 | 40 | 163840 | 21.38 | 160/6 | - | 69120 | 2.11 | ok |
| deepseek-ai/DeepSeek-V3 | 1457056 | config | fp8 | 684.53 | 684.53 | 61 | 7168 | 128 | 128 | 56 | 163840 | 37.00 | 256/8 | - | 70272 | 2.14 | ok |
| deepseek-ai/DeepSeek-V3-0324 | 1232950 | config | fp8 | 684.53 | 684.53 | 61 | 7168 | 128 | 128 | 56 | 163840 | 40.14 | 256/8 | - | 70272 | 2.14 | ok |
| deepseek-ai/DeepSeek-R1 | 1254482 | config | fp8 | 684.49 | 684.49 | 61 | 7168 | 128 | 128 | 56 | 163840 | 40.09 | 256/8 | - | 70272 | 2.14 | ok |
| deepseek-ai/DeepSeek-R1-0528 | 172499 | config | fp8 | 684.53 | 684.53 | 61 | 7168 | 128 | 128 | 56 | 163840 | 40.14 | 256/8 | - | 70272 | 2.14 | ok |
| deepseek-ai/DeepSeek-V3.1 | 360463 | config | fp8 | 684.53 | 684.53 | 61 | 7168 | 128 | 128 | 56 | 163840 | 40.14 | 256/8 | - | 70272 | 2.14 | ok |
| deepseek-ai/DeepSeek-V3.2-Exp | 48127 | config | fp8 | 685.40 | 685.40 | 61 | 7168 | 128 | 128 | 56 | 163840 | 41.00 | 256/8 | - DSA idx61 | 78324 | 2.39 | ok |
| deepseek-ai/DeepSeek-V3.2 | 4927838 | config | fp8 | 685.36 | 685.36 | 61 | 7168 | 128 | 128 | 56 | 163840 | 40.96 | 256/8 | - DSA idx61 | 78324 | 2.39 | ok |
| deepseek-ai/DeepSeek-V4-Flash | 805960 | config | fp8 | 290.94 | 290.94 | 43 | 4096 | 64 | 1 | 512 | 1048576 | 14.12 | 256/6 | V4 csa21/hca20 | 6229 | 0.21 | ok |
| deepseek-ai/DeepSeek-V4-Flash-0731 | 4416319 | config | fp8 | 304.18 | 304.18 | 43 | 4096 | 64 | 1 | 512 | 1048576 | 27.36 | 256/6 | V4 csa21/hca20 | 6229 | 0.21 | ok |
| deepseek-ai/DeepSeek-V4-Pro | 383720 | config | fp8 | 1598.84 | 1598.84 | 61 | 7168 | 128 | 1 | 512 | 1048576 | 50.65 | 384/6 | V4 csa30/hca31 | 8918 | 0.30 | ok |
| deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B | 1322437 | config | bf16 | 1.78 | 1.78 | 28 | 1536 | 12 | 2 | 128 | 131072 | - | - | - | 28672 | 0.88 | ok |
| deepseek-ai/DeepSeek-R1-Distill-Qwen-7B | 359688 | config | bf16 | 7.62 | 7.62 | 28 | 3584 | 28 | 4 | 128 | 131072 | - | - | - | 57344 | 1.75 | ok |
| deepseek-ai/DeepSeek-R1-Distill-Qwen-14B | 331040 | config | bf16 | 14.77 | 14.77 | 48 | 5120 | 40 | 8 | 128 | 131072 | - | - | - | 196608 | 6.00 | ok |
| deepseek-ai/DeepSeek-R1-Distill-Qwen-32B | 375451 | config | bf16 | 32.76 | 32.76 | 64 | 5120 | 40 | 8 | 128 | 131072 | - | - | - | 262144 | 8.00 | ok |
| deepseek-ai/DeepSeek-R1-Distill-Llama-8B | 146507 | config | bf16 | 8.03 | 8.03 | 32 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| deepseek-ai/DeepSeek-R1-Distill-Llama-70B | 50764 | config | bf16 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| moonshotai/Kimi-K2-Instruct | 347843 | config | fp8 | 1026.41 | 1026.41 | 61 | 7168 | 64 | 64 | 112 | 131072 | 32.86 | 384/8 | - | 70272 | 2.14 | ok |
| moonshotai/Kimi-K2-Instruct-0905 | 55106 | config | fp8 | 1026.47 | 1026.47 | 61 | 7168 | 64 | 64 | 112 | 262144 | 32.92 | 384/8 | - | 70272 | 2.14 | ok |
| moonshotai/Kimi-K2-Thinking | 56381 | config | int4 | 1026.41 | 1026.41 | 61 | 7168 | 64 | 64 | 112 | 262144 | 32.86 | 384/8 | - | 70272 | 2.14 | ok |
| moonshotai/Kimi-Linear-48B-A3B-Instruct | 197567 | config | bf16 | 49.12 | 49.12 | 27 | 2304 | 32 | 32 | 72 | - | - | - | - | 31104 | 0.95 | linear_attn_config ignored; MoE top-k key not read -> no activeParams; maxContext missing |
| moonshotai/Kimi-K2.5 | 336959 | config | int4 | 1026.88 | 1026.88 | 61 | 7168 | 64 | 64 | 112 | 262144 | 33.33 | 384/8 | - | 70272 | 2.14 | ok |
| zai-org/GLM-4.5 | 124686 | config | bf16 | 358.34 | 358.34 | 92 | 5120 | 96 | 8 | 128 | 131072 | 35.59 | 160/8 | - | 376832 | 11.50 | ok |
| zai-org/GLM-4.5-Air | 701853 | config | bf16 | 110.47 | 110.47 | 46 | 4096 | 96 | 8 | 128 | 131072 | 14.96 | 128/8 | - | 188416 | 5.75 | ok |
| zai-org/GLM-4.6 | 19044 | config | bf16 | 356.79 | 356.79 | 92 | 5120 | 96 | 8 | 128 | 202752 | 34.03 | 160/8 | - | 376832 | 11.50 | ok |
| zai-org/GLM-4.7 | 85782 | config | bf16 | 358.34 | 358.34 | 92 | 5120 | 96 | 8 | 128 | 202752 | 35.59 | 160/8 | - | 376832 | 11.50 | ok |
| zai-org/GLM-4.7-Flash | 1307102 | config | bf16 | 31.22 | 31.22 | 47 | 2048 | 20 | 20 | 102 | 202752 | 4.61 | 64/4 | - | 54144 | 1.65 | ok |
| zai-org/GLM-5 | 815888 | config | bf16 | 753.86 | 753.86 | 78 | 6144 | 64 | 64 | 64 | 202752 | 42.38 | 256/8 | - DSA idx78 | 100152 | 3.06 | ok |
| zai-org/GLM-5.3 | 1803969 | config | fp8 | 753.33 | 753.33 | 78 | 6144 | 64 | 64 | 192 | 1048576 | 41.84 | 256/8 | - DSA idx21 | 92628 | 2.83 | ok |
| zai-org/GLM-5.3-Flash | 6531090 | config | fp8 | 321.32 | 321.32 | 45 | 4096 | 64 | 64 | 64 | 1048576 | 18.33 | 288/8 | 11/-@-/- DSA idx45 | 180224 | 5.50 | linear_attn_config ignored; MLA with qk_rope_head_dim=0 -> treated as GQA |
| zai-org/GLM-4-9B-0414 | 12127 | config | bf16 | 9.40 | 9.40 | 40 | 4096 | 32 | 2 | 128 | 32768 | - | - | - | 40960 | 1.25 | ok |
| zai-org/GLM-4.5V | 34955 | config | bf16 | 107.71 | 107.71 | 46 | 4096 | 96 | 8 | 128 | 65536 | 14.28 | 128/8 | - | 188416 | 5.75 | ok |
| openai/gpt-oss-20b | 5988822 | config | int4 | 20.91 | 20.91 | 24 | 2880 | 64 | 8 | 64 | 131072 | 3.60 | 32/4 | -/12@128/- | 49152 | 0.75 | ok |
| openai/gpt-oss-120b | 3423004 | config | int4 | 116.83 | 116.83 | 36 | 2880 | 64 | 8 | 64 | 131072 | 5.10 | 128/4 | -/18@128/- | 73728 | 1.13 | ok |
| MiniMaxAI/MiniMax-M2 | 204792 | config | fp8 | 228.69 | 228.69 | 62 | 3072 | 48 | 8 | 128 | 196608 | 11.03 | 256/8 | - | 253952 | 7.75 | ok |
| MiniMaxAI/MiniMax-M2.5 | 733830 | config | fp8 | 228.70 | 228.70 | 62 | 3072 | 48 | 8 | 128 | 196608 | 11.04 | 256/8 | - | 253952 | 7.75 | ok |
| MiniMaxAI/MiniMax-Text-01 | 2599 | config | bf16 | 456.09 | 456.09 | 80 | 6144 | 64 | 8 | 128 | 10240000 | 48.40 | 32/2 | - | 327680 | 10.00 | attn_type_list (linear attn) ignored |
| MiniMaxAI/MiniMax-M1-80k | 1693 | config | bf16 | 456.09 | 456.09 | 80 | 6144 | 64 | 8 | 128 | 10240000 | 48.40 | 32/2 | - | 327680 | 10.00 | attn_type_list (linear attn) ignored |
| ibm-granite/granite-4.0-h-small | 24610 | config | bf16 | 32.21 | 32.21 | 40 | 4096 | 32 | 8 | 128 | 131072 | 8.80 | 72/10 | 4/-@-/36 | 16384 | 0.57 | ok |
| ibm-granite/granite-4.0-h-tiny | 46706 | config | bf16 | 6.94 | 6.94 | 40 | 1536 | 12 | 4 | 128 | 131072 | 1.47 | 64/6 | 4/-@-/36 | 8192 | 0.28 | ok |
| ibm-granite/granite-4.0-h-micro | 9647 | config | bf16 | 3.19 | 3.19 | 40 | 2048 | 32 | 8 | 64 | 131072 | - | - | 4/-@-/36 | 8192 | 0.29 | ok |
| ibm-granite/granite-4.0-micro | 22972 | config | bf16 | 3.40 | 3.40 | 40 | 2560 | 40 | 8 | 64 | 131072 | - | - | - | 81920 | 2.50 | ok |
| ibm-granite/granite-3.3-8b-instruct | 91037 | config | bf16 | 8.17 | 8.17 | 40 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 163840 | 5.00 | ok |
| nvidia/NVIDIA-Nemotron-Nano-9B-v2 | 283493 | config | bf16 | 8.89 | 8.89 | 56 | 4480 | 40 | 8 | 128 | 131072 | - | - | 4/-@-/27 | 16384 | 0.57 | ok |
| nvidia/Nemotron-H-8B-Base-8K | 53449 | partial | bf16 | 8.10 | 8.10 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 1093063 | config | bf16 | 31.58 | 31.58 | 52 | 2688 | 32 | 2 | 128 | 262144 | 3.31 | 128/6 | 6/-@-/23 | 6144 | 0.21 | ok |
| nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16 | 1045001 | config | bf16 | 123.61 | 123.61 | 88 | 4096 | 32 | 2 | 128 | 262144 | 9.34 | 512/22 | 8/-@-/40 | 8192 | 0.33 | latent MoE: activeParams formula off |
| nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16 | 676533 | config | bf16 | 31.58 | 31.58 | 52 | 2688 | 32 | 2 | 128 | 262144 | 3.31 | 128/6 | 6/-@-/23 | 6144 | 0.21 | ok |
| nvidia/Llama-3_3-Nemotron-Super-49B-v1_5 | 114782 | config | bf16 | 49.87 | 49.87 | 80 | 8192 | 64 | 64 | 128 | 131072 | - | - | - | 2621440 | 80.00 | NAS block_configs ignored (kv heads/no-op attn) |
| nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16 | 1566195 | config | bf16 | 3.97 | 3.97 | 42 | 3136 | 40 | 8 | 128 | 262144 | - | - | 4/-@-/21 | 16384 | 0.54 | ok |
| tiiuae/Falcon-H1-7B-Instruct | 29178 | config | bf16 | 7.59 | 7.59 | 44 | 3072 | 12 | 2 | 128 | 262144 | - | - | - | 45056 | 1.38 | ok |
| tiiuae/Falcon-H1-34B-Instruct | 1829 | config | bf16 | 33.64 | 33.64 | 72 | 5120 | 20 | 4 | 128 | 262144 | - | - | - | 147456 | 4.50 | ok |
| tiiuae/Falcon3-7B-Instruct | 11611 | config | bf16 | 7.46 | 7.46 | 28 | 3072 | 12 | 4 | 256 | 32768 | - | - | - | 114688 | 3.50 | ok |
| tiiuae/falcon-7b-instruct | 33041 | config | bf16 | 7.22 | 7.22 | 32 | 4544 | 71 | 71 | 64 | - | - | - | - | 581632 | 17.75 | multi_query ignored -> MHA; tie absent, family default tied -> counted untied; maxContext missing |
| ai21labs/AI21-Jamba-Mini-1.7 | 275 | partial | bf16 | 51.57 | 51.57 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| ai21labs/AI21-Jamba-Large-1.7 | 35 | partial | bf16 | 398.56 | 398.56 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| ai21labs/AI21-Jamba-Reasoning-3B | 40991 | config | bf16 | 3.20 | 3.20 | 28 | 2560 | 20 | 1 | 128 | 262144 | - | - | - | 14336 | 0.44 | Jamba attn_layer_period ignored |
| CohereLabs/c4ai-command-a-03-2025 | 1699 | partial | bf16 | 111.06 | 111.06 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| CohereLabs/c4ai-command-r-08-2024 | 430 | partial | fp16 | 32.30 | 32.30 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| CohereLabs/c4ai-command-r7b-12-2024 | 6887 | partial | bf16 | 8.03 | 8.03 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| allenai/OLMo-2-1124-7B-Instruct | 38924 | config | bf16 | 7.30 | 7.30 | 32 | 4096 | 32 | 32 | 128 | 4096 | - | - | - | 524288 | 16.00 | ok |
| allenai/OLMo-2-0325-32B-Instruct | 10079 | config | bf16 | 32.23 | 32.23 | 64 | 5120 | 40 | 8 | 128 | 4096 | - | - | - | 262144 | 8.00 | ok |
| allenai/Olmo-3-7B-Instruct | 492523 | config | bf16 | 7.30 | 7.30 | 32 | 4096 | 32 | 32 | 128 | 65536 | - | - | -/24@4096/- | 524288 | 5.50 | ok |
| HuggingFaceTB/SmolLM3-3B | 762049 | config | bf16 | 3.08 | 3.08 | 36 | 2048 | 16 | 4 | 128 | 65536 | - | - | - | 73728 | 2.25 | ok |
| HuggingFaceTB/SmolLM2-1.7B-Instruct | 233563 | config | bf16 | 1.71 | 1.71 | 24 | 2048 | 32 | 32 | 64 | 8192 | - | - | - | 196608 | 6.00 | ok |
| internlm/internlm3-8b-instruct | 59697 | config | bf16 | 8.80 | 8.80 | 48 | 4096 | 32 | 2 | 128 | 32768 | - | - | - | 49152 | 1.50 | ok |
| tencent/Hunyuan-A13B-Instruct | 72598 | config | bf16 | 80.39 | 80.39 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | MoE top-k key not read -> no activeParams |
| tencent/Hunyuan-7B-Instruct | 15122 | config | bf16 | 7.50 | 7.50 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | ok |
| baidu/ERNIE-4.5-21B-A3B-PT | 17144 | config | bf16 | 21.95 | 21.95 | 28 | 2560 | 20 | 4 | 128 | 131072 | - | - | - | 57344 | 1.75 | MoE top-k key not read -> no activeParams |
| baidu/ERNIE-4.5-300B-A47B-PT | 3061 | config | bf16 | 300.47 | 300.47 | 54 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 221184 | 6.75 | MoE top-k key not read -> no activeParams |
| baidu/ERNIE-4.5-0.3B-PT | 13636 | config | bf16 | 0.36 | 0.36 | 18 | 1024 | 16 | 2 | 128 | 131072 | - | - | - | 18432 | 0.56 | ok |
| ByteDance-Seed/Seed-OSS-36B-Instruct | 50746 | config | bf16 | 36.15 | 36.15 | 64 | 5120 | 80 | 8 | 128 | 524288 | - | - | - | 262144 | 8.00 | ok |
| baichuan-inc/Baichuan2-7B-Chat | 41291 | config | bf16 | 7.00 | - | 32 | 4096 | 32 | 32 | 128 | 4096 | - | - | - | 524288 | 16.00 | ok |
| baichuan-inc/Baichuan-M2-32B | 1538 | config | bf16 | 32.76 | 32.76 | 64 | 5120 | 40 | 8 | 128 | 131072 | - | - | - | 262144 | 8.00 | ok |
| 01-ai/Yi-1.5-34B-Chat | 14726 | config | bf16 | 34.39 | 34.39 | 60 | 7168 | 56 | 8 | 128 | 4096 | - | - | - | 245760 | 7.50 | ok |
| 01-ai/Yi-1.5-9B-Chat | 17860 | config | bf16 | 8.83 | 8.83 | 48 | 4096 | 32 | 4 | 128 | 4096 | - | - | - | 98304 | 3.00 | ok |
| LiquidAI/LFM2-1.2B | 52160 | config | bf16 | 1.17 | 1.17 | 16 | 2048 | 32 | 8 | 64 | 128000 | - | - | 6/-@-/- | 12288 | 0.38 | tie absent, family default tied -> counted untied |
| LiquidAI/LFM2.5-24B-A2B | 6286 | config | bf16 | 23.97 | 23.97 | 40 | 2048 | 32 | 8 | 64 | 131072 | 1.32 | 64/4 | 10/-@-/- | 20480 | 0.62 | ok |
| openbmb/MiniCPM5-2B | 1253288 | config | bf16 | 2.52 | 2.52 | 42 | 2048 | 16 | 2 | 128 | 131072 | - | - | - | 43008 | 1.31 | ok |
| openbmb/MiniCPM4.1-8B | 6246 | config | bf16 | 8.19 | 8.19 | 32 | 4096 | 32 | 2 | 128 | 65536 | - | - | - | 32768 | 1.00 | ok |
| XiaomiMiMo/MiMo-V2.6-Pro-RL | 99548 | config | fp8 | 1024.22 | 1024.22 | 70 | 6144 | 128 | 8 | 192 | 1048576 | 30.67 | 384/8 | - | 430080 | 13.12 | hybrid_layer_pattern (SWA) ignored; sliding_window 128 not applied (no layer_types) |
| XiaomiMiMo/MiMo-V2-Flash | 77592 | config | fp8 | 309.79 | 309.79 | 48 | 4096 | 64 | 4 | 192 | 262144 | 10.21 | 256/8 | - | 147456 | 4.50 | hybrid_layer_pattern (SWA) ignored; sliding_window 128 not applied (no layer_types) |
| inclusionAI/Ling-3.1-flash | 666 | config | fp8 | 572.12 | 572.12 | 72 | 4096 | 64 | 64 | 128 | 262144 | 25.14 | 512/8 | - | 82944 | 2.53 | ok |
| JetBrains/Mellum2.1-12B-A2.5B-Thinking | 2445 | config | bf16 | 12.15 | 12.15 | 28 | 2304 | 32 | 4 | 128 | 131072 | 2.44 | 64/8 | -/21@1024/- | 57344 | 0.48 | ok |
| Aleph-Alpha/Kolibri-1 | 16805 | config | fp8 | 78.10 | 78.10 | 50 | 2560 | 48 | 4 | 128 | 262144 | 3.79 | 384/6 | -/40@513/- | 102400 | 0.66 | ok |
| RadixArk/Kimi-K3-DSpark | 5170377 | config | bf16 | 2.25 | 2.25 | 5 | 7168 | 64 | 16 | 64 | 1048576 | - | - | - | 20480 | 0.62 | ok |
| openai-community/gpt2 | 16135546 | config | - | 0.14 | 0.14 | 12 | 768 | 12 | 12 | 64 | 1024 | - | - | - | 36864 | 1.12 | tie absent, family default tied -> counted untied |
| facebook/opt-125m | 5927120 | partial | fp16 | 0.00 | - | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| EleutherAI/pythia-160m | 3443679 | config | fp16 | 0.21 | 0.21 | 12 | 768 | 12 | 12 | 64 | 2048 | - | - | - | 36864 | 1.12 | ok |
| TinyLlama/TinyLlama-1.1B-Chat-v1.0 | 1112501 | config | bf16 | 1.10 | 1.10 | 22 | 2048 | 32 | 4 | 64 | 2048 | - | - | - | 22528 | 0.69 | ok |
| bigscience/bloomz-560m | 1246942 | partial | fp16 | 0.56 | 0.56 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| stepfun-ai/Step-3.5-Flash | 263241 | config | bf16 | 199.38 | 199.38 | 45 | 4096 | 64 | 64 | 128 | 262144 | 12.44 | 288/8 | -/36@512/- | 1474560 | 9.56 | num_attention_groups (KV heads) ignored; layer_types len 48 != layers 45 |
| Qwen/Qwen2.5-7B-Instruct-AWQ | 2304322 | config | int4 | 7.62 | 7.62 | 28 | 3584 | 28 | 4 | 128 | 32768 | - | - | - | 57344 | 1.75 | ok |
| Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4 | 286493 | config | int4 | 7.62 | 7.62 | 28 | 3584 | 28 | 4 | 128 | 32768 | - | - | - | 57344 | 1.75 | ok |
| Qwen/Qwen3-14B-AWQ | 2882388 | config | int4 | 14.77 | 14.77 | 40 | 5120 | 40 | 8 | 128 | 40960 | - | - | - | 163840 | 5.00 | ok |
| Qwen/Qwen3-32B-AWQ | 866911 | config | int4 | 32.76 | 32.76 | 64 | 5120 | 64 | 8 | 128 | 40960 | - | - | - | 262144 | 8.00 | ok |
| Qwen/Qwen3-8B-FP8 | 527322 | config | fp8 | 8.19 | 8.19 | 36 | 4096 | 32 | 8 | 128 | 40960 | - | - | - | 147456 | 4.50 | ok |
| Qwen/Qwen3-4B-Instruct-2507-FP8 | 1214710 | config | fp8 | 4.41 | 4.41 | 36 | 2560 | 32 | 8 | 128 | 262144 | - | - | - | 147456 | 4.50 | ok |
| Qwen/Qwen3-Coder-30B-A3B-Instruct-FP8 | 1062714 | config | fp8 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 262144 | 3.35 | 128/8 | - | 98304 | 3.00 | ok |
| Qwen/Qwen3-235B-A22B-FP8 | 21018 | config | fp8 | 235.11 | 235.11 | 94 | 4096 | 64 | 4 | 128 | 40960 | 22.21 | 128/8 | - | 192512 | 5.88 | ok |
| Qwen/Qwen3-30B-A3B-GPTQ-Int4 | 56457 | config | int4 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 40960 | 3.35 | 128/8 | - | 98304 | 3.00 | ok |
| RedHatAI/Qwen3-8B-FP8-dynamic | 4984 | config | fp8 | 8.19 | 8.19 | 36 | 4096 | 32 | 8 | 128 | 40960 | - | - | - | 147456 | 4.50 | ok |
| RedHatAI/Meta-Llama-3.1-8B-Instruct-FP8 | 102748 | config | fp8 | 8.03 | 8.03 | 32 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| RedHatAI/Llama-3.3-70B-Instruct-FP8-dynamic | 113290 | config | fp8 | 70.56 | 70.56 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| RedHatAI/Llama-3.3-70B-Instruct-quantized.w4a16 | 7627 | config | int4 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| casperhansen/llama-3.3-70b-instruct-awq | 827058 | config | int4 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| hugging-quants/Meta-Llama-3.1-8B-Instruct-AWQ-INT4 | 124261 | config | int4 | 8.03 | 8.03 | 32 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| cyankiwi/Qwen3-Coder-30B-A3B-Instruct-AWQ-4bit | 826545 | config | int4 | 30.53 | 5.31 | 48 | 2048 | 32 | 4 | 128 | 262144 | 1.76 | 128/8 | - | 98304 | 3.00 | numParams from base (5.3B packed) |
| nvidia/Llama-3.3-70B-Instruct-FP4 | 15101 | config | int4 | 70.55 | 40.61 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | numParams from base (40.6B packed) |
| nvidia/Qwen3.6-35B-A3B-NVFP4 | 4606790 | config | fp8 | 18.68 | 18.68 | 40 | 2048 | 16 | 2 | 256 | 262144 | 2.30 | 256/8 | 10/-@-/30 | 20480 | 0.66 | mtp_num_hidden_layers not counted in activeParams; mixed-precision quant: first group picked |
| nvidia/Qwen2.5-VL-7B-Instruct-NVFP4 | 1677964 | config | int4 | 8.29 | 5.03 | 28 | 3584 | 28 | 4 | 128 | 128000 | - | - | - | 57344 | 1.75 | numParams from base (5.0B packed) |
| nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4 | 1637397 | config | int4 | 31.58 | 18.24 | 52 | 2688 | 32 | 2 | 128 | 262144 | 2.69 | 128/6 | 6/-@-/23 | 6144 | 0.21 | numParams from base (18.2B packed) |
| nvidia/Gemma-4-31B-IT-NVFP4 | 1149727 | config | int4 | 31.27 | 20.87 | 60 | 5376 | 32 | 16 | 256 | 262144 | - | - | -/50@1024/- | 983040 | 5.78 | global_head_dim/num_global_kv_heads ignored; numParams from base (20.9B packed) |
| nvidia/DeepSeek-R1-0528-FP4 | 2543 | config | int4 | 684.53 | 396.77 | 61 | 7168 | 128 | 128 | 56 | 163840 | 26.34 | 256/8 | - | 70272 | 2.14 | numParams from base (396.8B packed) |
| nvidia/Qwen3.5-122B-A10B-NVFP4 | 686380 | config | int4 | 125.09 | 64.58 | 48 | 3072 | 32 | 2 | 256 | 262144 | 5.98 | 256/8 | 12/-@-/36 | 24576 | 0.82 | mtp_num_hidden_layers not counted in activeParams; numParams from base (64.6B packed) |
| unsloth/Llama-3.3-70B-Instruct-bnb-4bit | 10861 | config | int4 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| unsloth/gpt-oss-20b-GGUF | 520724 | config | int4 | 20.91 | 20.91 | 24 | 2880 | 64 | 8 | 64 | 131072 | 4.19 | 32/4 | -/12@128/- | 49152 | 0.75 | ok |
| unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF | 3060092 | base | int4 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 262144 | 3.30 | 128/8 | - | 98304 | 3.00 | ok |
| bartowski/Qwen2.5-32B-Instruct-GGUF | 905540 | base | int4 | 32.76 | 32.76 | 64 | 5120 | 40 | 8 | 128 | 32768 | - | - | - | 262144 | 8.00 | ok |
| unsloth/DeepSeek-V3-0324-GGUF | 3899 | config | fp8 | 671.03 | 671.03 | 61 | 7168 | 128 | 128 | 56 | 163840 | 26.63 | 256/8 | - | 70272 | 2.14 | ok |
| lmstudio-community/Qwen3.8-27B-MLX-4bit | 4120016 | config | int4 | 27.36 | 27.36 | 64 | 5120 | 24 | 4 | 256 | 262144 | - | - | 16/-@-/48 | 65536 | 2.07 | mtp_num_hidden_layers not counted in activeParams |
| bartowski/Llama-3.3-70B-Instruct-GGUF | 30732 | partial | int4 | 70.55 | 70.55 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| bartowski/Meta-Llama-3.1-8B-Instruct-GGUF | 497742 | partial | int4 | 8.03 | 8.03 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF | 72241 | partial | int4 | 8.03 | 8.03 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| bartowski/google_gemma-3-27b-it-GGUF | 13366 | partial | int4 | 27.01 | 27.01 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| bartowski/gemma-2-9b-it-GGUF | 30337 | partial | int4 | 9.24 | 9.24 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| unsloth/gemma-3-27b-it-GGUF | 38236 | config | int4 | 27.01 | 27.01 | 62 | 5376 | 32 | 16 | 128 | 131072 | - | - | -/52@1024/- | 507904 | 2.91 | tie absent, family default tied -> counted untied |
| unsloth/Llama-3.3-70B-Instruct-GGUF | 36784 | config | int4 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| TheBloke/Llama-2-7B-Chat-GGUF | 76297 | partial | int4 | 6.74 | 6.74 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| hugging-quants/Meta-Llama-3.1-70B-Instruct-AWQ-INT4 | 158364 | config | int4 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| unsloth/gemma-3n-E4B-it | 121651 | config | bf16 | 8.39 | 8.39 | 35 | 2048 | 8 | 2 | 256 | 32768 | - | - | -/28@512/- | 71680 | 0.46 | KV sharing ignored; intermediate_size is a list -> NaN overhead; tie absent, family default tied -> counted untied |
| unsloth/gemma-3-1b-it | 51497 | config | bf16 | 1.00 | 1.00 | 26 | 1152 | 4 | 1 | 256 | 32768 | - | - | -/22@512/- | 26624 | 0.14 | tie absent, family default tied -> counted untied |
| unsloth/Qwen3-30B-A3B-GGUF | 39550 | config | int4 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 40960 | 3.35 | 128/8 | - | 98304 | 3.00 | ok |
| unsloth/DeepSeek-R1-GGUF | 23112 | config | int4 | 671.03 | 671.03 | 61 | 7168 | 128 | 128 | 56 | 163840 | 26.63 | 256/8 | - | 70272 | 2.14 | ok |
| unsloth/Kimi-K2-Instruct-GGUF | 17850 | config | fp8 | 1026.41 | 1026.41 | 61 | 7168 | 64 | 64 | 112 | 131072 | 32.86 | 384/8 | - | 70272 | 2.14 | ok |
| unsloth/GLM-4.5-Air-GGUF | 20286 | base | int4 | 110.47 | 110.47 | 46 | 4096 | 96 | 8 | 128 | 131072 | 14.96 | 128/8 | - | 188416 | 5.75 | ok |
| ggml-org/gpt-oss-120b-GGUF | 144026 | base | int4 | 116.83 | 116.83 | 36 | 2880 | 64 | 8 | 64 | 131072 | 5.10 | 128/4 | -/18@128/- | 73728 | 1.13 | ok |
| mlx-community/Qwen3-30B-A3B-4bit | 3752 | config | int4 | 30.53 | 30.53 | 48 | 2048 | 32 | 4 | 128 | 40960 | 3.35 | 128/8 | - | 98304 | 3.00 | ok |
| RedHatAI/gemma-3-27b-it-FP8-dynamic | 57078 | config | fp8 | 27.44 | 27.44 | 62 | 5376 | 32 | 16 | 128 | 131072 | - | - | -/52@1024/- | 507904 | 2.91 | tie absent, family default tied -> counted untied |
| google/gemma-3-27b-pt | 9915 | partial | bf16 | 27.43 | 27.43 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| nvidia/Nemotron-H-47B-Base-8K | 755 | partial | bf16 | 46.79 | 46.79 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| nvidia/Nemotron-H-56B-Base-8K | 19384 | partial | bf16 | 56.32 | 56.32 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| mistralai/Mistral-7B-v0.1 | 353655 | config | bf16 | 7.24 | 7.24 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | sliding_window 4096 not applied (no layer_types) |
| mistralai/Mistral-7B-Instruct-v0.1 | 133167 | config | bf16 | 7.24 | 7.24 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | sliding_window 4096 not applied (no layer_types) |
| HuggingFaceH4/zephyr-7b-beta | 91240 | config | bf16 | 7.24 | 7.24 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | sliding_window 4096 not applied (no layer_types) |
| bigcode/starcoder2-15b | 8100 | config | fp32 | 15.96 | 15.96 | 40 | 6144 | 48 | 4 | 128 | 16384 | - | - | - | 81920 | 2.50 | sliding_window 4096 not applied (no layer_types) |
| bigcode/starcoder2-3b | 40280 | config | - | 3.03 | 3.03 | 30 | 3072 | 24 | 2 | 128 | 16384 | - | - | - | 30720 | 0.94 | sliding_window 4096 not applied (no layer_types) |
| THUDM/glm-4-9b-chat | 48082 | config | bf16 | 9.40 | 9.40 | 40 | 4096 | 32 | 32 | 128 | - | - | - | - | 655360 | 20.00 | multi_query ignored -> MHA; multi_query_group_num ignored; maxContext missing |
| THUDM/chatglm3-6b | 52652 | config | fp16 | 6.24 | 6.24 | 28 | 4096 | 32 | 32 | 128 | - | - | - | - | 458752 | 14.00 | multi_query ignored -> MHA; multi_query_group_num ignored; maxContext missing |
| zai-org/glm-4-9b-chat-hf | 6473 | config | bf16 | 9.40 | 9.40 | 40 | 4096 | 32 | 2 | 128 | 131072 | - | - | - | 40960 | 1.25 | ok |
| Qwen/Qwen-7B-Chat | 47543 | config | bf16 | 7.72 | 7.72 | 32 | 4096 | 32 | 32 | 128 | 32768 | - | - | - | 524288 | 16.00 | ok |
| internlm/internlm2_5-7b-chat | 27960 | config | bf16 | 7.74 | 7.74 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | ok |
| mosaicml/mpt-7b-chat | - | partial | - | 7.00 | - | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| bigcode/starcoder | 11661 | partial | - | 15.82 | 15.82 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(gatedUnknown) |
| bigcode/gpt_bigcode-santacoder | 16439 | config | fp16 | 1.12 | 1.12 | 24 | 2048 | 16 | 16 | 128 | 2048 | - | - | - | 196608 | 6.00 | multi_query ignored -> MHA |
| EleutherAI/gpt-j-6b | 260621 | config | - | 6.00 | - | 28 | 4096 | 16 | 16 | 256 | 2048 | - | - | - | 458752 | 14.00 | ok |
| allenai/OLMoE-1B-7B-0924-Instruct | 17176 | config | bf16 | 6.92 | 6.92 | 16 | 2048 | 16 | 16 | 128 | 4096 | 1.28 | 64/8 | - | 131072 | 4.00 | ok |
| microsoft/Phi-3-small-8k-instruct | 16129 | config | bf16 | 7.39 | 7.39 | 32 | 4096 | 32 | 8 | 128 | 8192 | - | - | - | 131072 | 4.00 | ok |
| databricks/dbrx-instruct | - | partial | - | 0.00 | - | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| Snowflake/snowflake-arctic-instruct | 2798 | config | bf16 | 478.58 | 478.58 | 35 | 7168 | 56 | 8 | 128 | 4096 | 17.32 | 128/2 | - | 143360 | 4.38 | ok |
| tiiuae/falcon-40b-instruct | 3888 | config | bf16 | 40.00 | - | 60 | 8192 | 128 | 8 | 64 | - | - | - | - | 122880 | 3.75 | tie absent, family default tied -> counted untied; maxContext missing |
| cognitivecomputations/dolphin-2.9.1-yi-1.5-34b | 4673913 | config | bf16 | 34.39 | 34.39 | 60 | 7168 | 56 | 8 | 128 | 8192 | - | - | - | 245760 | 7.50 | ok |
| NousResearch/Hermes-3-Llama-3.1-8B | 508251 | config | bf16 | 8.03 | 8.03 | 32 | 4096 | 32 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| nvidia/Llama-3.1-Nemotron-70B-Instruct-HF | 23863 | config | bf16 | 70.55 | 70.55 | 80 | 8192 | 64 | 8 | 128 | 131072 | - | - | - | 327680 | 10.00 | ok |
| nvidia/Llama-3_1-Nemotron-51B-Instruct | 1125 | config | bf16 | 51.50 | 51.50 | 80 | 8192 | 64 | 64 | 128 | 131072 | - | - | - | 2621440 | 80.00 | NAS block_configs ignored (kv heads/no-op attn) |
| LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct | 247990 | config | fp32 | 7.82 | 7.82 | 32 | 4096 | 32 | 8 | 128 | 32768 | - | - | - | 131072 | 4.00 | ok |
| LGAI-EXAONE/EXAONE-4.0-32B | 28400 | config | bf16 | 32.00 | 32.00 | 64 | 5120 | 40 | 8 | 128 | 131072 | - | - | -/48@4096/- | 262144 | 2.75 | ok |
| upstage/solar-pro-preview-instruct | 6128 | config | bf16 | 22.14 | 22.14 | 64 | 5120 | 40 | 10 | 128 | 4096 | - | - | - | 327680 | 10.00 | sliding_window 2047 not applied (no layer_types) |
| llava-hf/llava-1.5-7b-hf | 1166494 | partial | fp16 | 7.06 | 7.06 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| llava-hf/llava-v1.6-mistral-7b-hf | 324628 | partial | fp16 | 7.57 | 7.57 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| Qwen/Qwen2.5-Omni-7B | 302636 | partial | bf16 | 10.73 | 10.73 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed); thinker_config.text_config not read |
| Qwen/Qwen3-Omni-30B-A3B-Instruct | 720682 | partial | bf16 | 35.26 | 35.26 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed); thinker_config.text_config not read |
| deepseek-ai/deepseek-vl2-small | 4877 | partial | bf16 | 16.15 | 16.15 | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed); language_config not read |
| deepseek-ai/Janus-Pro-7B | 10989 | partial | bf16 | 7.00 | - | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed); language_config not read |
| OpenGVLab/InternVL3-8B | 102103 | config | bf16 | 7.94 | 7.94 | 28 | 3584 | 28 | 4 | 128 | 32768 | - | - | - | 57344 | 1.75 | ok |
| HuggingFaceTB/SmolVLM-Instruct | 22399 | config | bf16 | 2.25 | 2.25 | 24 | 2048 | 32 | 32 | 64 | 16384 | - | - | - | 196608 | 6.00 | ok |
| mistralai/Pixtral-12B-2409 | 10318 | partial | - | 12.00 | - | - | - | - | - | - | - | - | - | - | - | - | PARTIAL(configFailed) |
| microsoft/Phi-4-multimodal-instruct | 159558 | config | bf16 | 5.57 | 5.57 | 32 | 3072 | 24 | 8 | 128 | 131072 | - | - | - | 131072 | 4.00 | ok |
| moonshotai/Kimi-VL-A3B-Instruct | 157358 | config | bf16 | 16.41 | 16.41 | 27 | 2048 | 16 | 16 | 128 | 131072 | 3.36 | 64/6 | - | 31104 | 0.95 | ok |
| zai-org/GLM-4.1V-9B-Thinking | 141002 | config | bf16 | 10.29 | 10.29 | 40 | 4096 | 32 | 2 | 128 | 65536 | - | - | - | 40960 | 1.25 | ok |


## Bundled presets vs real configs (scripts: audit/presets.ts)

```
## llama-3.2-1b [mirror unsloth/Llama-3.2-1B-Instruct; st.total=1235814400] kv@min(32k,ctx) bundled=1.00 truth=1.00 GiB; int4 weights bundled=0.97 truth=0.97
## llama-3.2-3b [mirror unsloth/Llama-3.2-3B-Instruct; st.total=3212749824] kv@min(32k,ctx) bundled=3.50 truth=3.50 GiB; int4 weights bundled=2.13 truth=2.13
## llama-3.1-8b [mirror unsloth/Llama-3.1-8B-Instruct; st.total=8030261248] kv@min(32k,ctx) bundled=4.00 truth=4.00 GiB; int4 weights bundled=5.41 truth=5.41
## llama-3.3-70b [mirror unsloth/Llama-3.3-70B-Instruct; st.total=70553706496] kv@min(32k,ctx) bundled=10.00 truth=10.00 GiB; int4 weights bundled=37.78 truth=37.78
## llama-3.1-405b [mirror unsloth/Meta-Llama-3.1-405B-Instruct-bnb-4bit; st.total=405853388800] kv@min(32k,ctx) bundled=15.75 truth=15.75 GiB; int4 weights bundled=206.55 truth=206.55
   headDim: bundled=128 truth=undefined
## mistral-7b-v0.3 [live; st.total=7248023552] kv@min(32k,ctx) bundled=4.00 truth=4.00 GiB; int4 weights bundled=3.95 truth=3.95
   headDim: bundled=128 truth=undefined
## mistral-nemo-12b [live; st.total=12247782400] kv@min(32k,ctx) bundled=5.00 truth=5.00 GiB; int4 weights bundled=7.90 truth=7.90
   maxContext: bundled=128000 truth=131072
## mixtral-8x7b [live; st.total=46702792704] kv@min(32k,ctx) bundled=4.00 truth=4.00 GiB; int4 weights bundled=23.46 truth=23.47
   headDim: bundled=128 truth=undefined
## mixtral-8x22b [live; st.total=140630071296] kv@min(32k,ctx) bundled=7.00 truth=7.00 GiB; int4 weights bundled=70.11 truth=70.13
   headDim: bundled=128 truth=undefined
## gemma-2-9b [mirror unsloth/gemma-2-9b-it; st.total=9241705984] kv@min(32k,ctx) bundled=1.97 truth=2.63 GiB; int4 weights bundled=5.83 truth=7.08
   tieEmbeddings: bundled=true truth=false
   slidingLayers: bundled=21 truth=undefined
   slidingWindow: bundled=4096 truth=undefined
## gemma-2-27b [mirror unsloth/gemma-2-27b-it; st.total=27227128320] kv@min(32k,ctx) bundled=2.16 truth=2.88 GiB; int4 weights bundled=15.07 truth=16.70
   tieEmbeddings: bundled=true truth=false
   slidingLayers: bundled=23 truth=undefined
   slidingWindow: bundled=4096 truth=undefined
## qwen2.5-0.5b [live; st.total=494032768] kv@min(32k,ctx) bundled=0.38 truth=0.38 GiB; int4 weights bundled=0.43 truth=0.43
   headDim: bundled=64 truth=undefined
## qwen2.5-7b [live; st.total=7615616512] kv@min(32k,ctx) bundled=1.75 truth=1.75 GiB; int4 weights bundled=5.26 truth=5.26
   headDim: bundled=128 truth=undefined
## qwen2.5-14b [live; st.total=14770033664] kv@min(32k,ctx) bundled=6.00 truth=6.00 GiB; int4 weights bundled=9.44 truth=9.44
   headDim: bundled=128 truth=undefined
## qwen2.5-32b [live; st.total=32763876352] kv@min(32k,ctx) bundled=8.00 truth=8.00 GiB; int4 weights bundled=18.34 truth=18.34
   headDim: bundled=128 truth=undefined
## qwen2.5-72b [live; st.total=72706203648] kv@min(32k,ctx) bundled=10.00 truth=10.00 GiB; int4 weights bundled=39.38 truth=39.38
   headDim: bundled=128 truth=undefined
## phi-3-mini [live; st.total=3821079552] kv@min(32k,ctx) bundled=1.50 truth=1.50 GiB; int4 weights bundled=2.16 truth=2.16
   headDim: bundled=96 truth=undefined
## qwen3-8b [live; st.total=8190735360] kv@min(32k,ctx) bundled=4.50 truth=4.50 GiB; int4 weights bundled=5.76 truth=5.76
## qwen3-32b [live; st.total=32762123264] kv@min(32k,ctx) bundled=8.00 truth=8.00 GiB; int4 weights bundled=18.34 truth=18.34
## qwen3-30b-a3b [live; st.total=30532122624] kv@min(32k,ctx) bundled=3.00 truth=3.00 GiB; int4 weights bundled=15.96 truth=15.96
   activeParams: bundled=3300000000 truth=3353032704
   moeIntermediateSize: bundled=undefined truth=768
## qwen3-coder-30b-a3b [live; st.total=30532122624] kv@min(32k,ctx) bundled=3.00 truth=3.00 GiB; int4 weights bundled=15.96 truth=15.96
   activeParams: bundled=3300000000 truth=3353032704
   moeIntermediateSize: bundled=undefined truth=768
## qwen2.5-coder-7b [live; st.total=7615616512] kv@min(32k,ctx) bundled=1.75 truth=1.75 GiB; int4 weights bundled=5.26 truth=5.26
## gpt-oss-20b [live; st.total=20914757184] kv@min(32k,ctx) bundled=0.75 truth=0.75 GiB; int4 weights bundled=11.93 truth=11.93
   activeParams: bundled=3600000000 truth=4193246784
## gpt-oss-120b [live; st.total=116829156672] kv@min(32k,ctx) bundled=1.13 truth=1.13 GiB; int4 weights bundled=59.39 truth=59.39
   activeParams: bundled=5100000000 truth=5750551872
## deepseek-v3 [live; st.total=684531386000] kv@min(32k,ctx) bundled=2.14 truth=2.14 GiB; int4 weights bundled=341.22 truth=341.22
   activeParams: bundled=37000000000 truth=40135296656
   moeIntermediateSize: bundled=undefined truth=2048
```

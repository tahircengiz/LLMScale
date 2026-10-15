# LLMScale KV/weights audit tables (vLLM 0.31.0), 2026-10-15

Per-request KV reservation (what sets "Maximum concurrency"), BF16 cache, block 16 (MLA 64), async scheduling (2 x max_num_batched_tokens in flight), prefix caching on (Mamba "align": 2 state blocks).
app = kvReservedPerSeq (src/lib/calc.ts:427); vLLM = independent re-implementation (scripts/vllm_model.py) of SlidingWindowSpec/FullAttentionSpec/MambaSpec max_memory_usage_bytes + unify_kv_cache_spec_page_size + _get_kv_cache_groups_uniform_page_size + Platform._align_hybrid_block_size, and per-model layer construction (gemma4_layer_config, NemotronH/Qwen3.5 mamba_ssm dtype, Falcon-H1 parallel hybrid, Jamba Mamba1, falcon MQA). DSA indexer and DeepSeek V4 are NOT modelled on the vLLM side (rows marked n/a).

| config | ctx | batch tok | app GiB | vLLM GiB | app/vLLM-1 |
|---|---:|---:|---:|---:|---:|
| MiniMaxAI_MiniMax-M1-80k | 4096 | 2048 | 1.250 | 1.250 | +0.0% |
| MiniMaxAI_MiniMax-M1-80k | 4096 | 8192 | 1.250 | 1.250 | +0.0% |
| MiniMaxAI_MiniMax-M1-80k | 32768 | 2048 | 10.000 | 10.000 | +0.0% |
| MiniMaxAI_MiniMax-M1-80k | 32768 | 8192 | 10.000 | 10.000 | +0.0% |
| MiniMaxAI_MiniMax-M1-80k | 131072 | 2048 | 40.000 | 40.000 | +0.0% |
| MiniMaxAI_MiniMax-M1-80k | 131072 | 8192 | 40.000 | 40.000 | +0.0% |
| MiniMaxAI_MiniMax-M2 | 4096 | 2048 | 0.969 | 0.969 | +0.0% |
| MiniMaxAI_MiniMax-M2 | 4096 | 8192 | 0.969 | 0.969 | +0.0% |
| MiniMaxAI_MiniMax-M2 | 32768 | 2048 | 7.750 | 7.750 | +0.0% |
| MiniMaxAI_MiniMax-M2 | 32768 | 8192 | 7.750 | 7.750 | +0.0% |
| MiniMaxAI_MiniMax-M2 | 131072 | 2048 | 31.000 | 31.000 | +0.0% |
| MiniMaxAI_MiniMax-M2 | 131072 | 8192 | 31.000 | 31.000 | +0.0% |
| MiniMaxAI_MiniMax-Text-01 | 4096 | 2048 | 1.250 | 1.250 | +0.0% |
| MiniMaxAI_MiniMax-Text-01 | 4096 | 8192 | 1.250 | 1.250 | +0.0% |
| MiniMaxAI_MiniMax-Text-01 | 32768 | 2048 | 10.000 | 10.000 | +0.0% |
| MiniMaxAI_MiniMax-Text-01 | 32768 | 8192 | 10.000 | 10.000 | +0.0% |
| MiniMaxAI_MiniMax-Text-01 | 131072 | 2048 | 40.000 | 40.000 | +0.0% |
| MiniMaxAI_MiniMax-Text-01 | 131072 | 8192 | 40.000 | 40.000 | +0.0% |
| NousResearch_Llama-2-7b-hf | 4096 | 2048 | 2.000 | 2.000 | +0.0% |
| NousResearch_Llama-2-7b-hf | 4096 | 8192 | 2.000 | 2.000 | +0.0% |
| Qwen_Qwen2.5-VL-7B-Instruct | 4096 | 2048 | 0.219 | 0.219 | +0.0% |
| Qwen_Qwen2.5-VL-7B-Instruct | 4096 | 8192 | 0.219 | 0.219 | +0.0% |
| Qwen_Qwen2.5-VL-7B-Instruct | 32768 | 2048 | 1.750 | 1.750 | +0.0% |
| Qwen_Qwen2.5-VL-7B-Instruct | 32768 | 8192 | 1.750 | 1.750 | +0.0% |
| Qwen_Qwen3-Next-80B-A3B-Instruct | 4096 | 2048 | 0.174 | 0.174 | +0.0% |
| Qwen_Qwen3-Next-80B-A3B-Instruct | 4096 | 8192 | 0.174 | 0.174 | +0.0% |
| Qwen_Qwen3-Next-80B-A3B-Instruct | 32768 | 2048 | 0.834 | 0.834 | +0.0% |
| Qwen_Qwen3-Next-80B-A3B-Instruct | 32768 | 8192 | 0.834 | 0.834 | +0.0% |
| Qwen_Qwen3-Next-80B-A3B-Instruct | 131072 | 2048 | 3.075 | 3.075 | +0.0% |
| Qwen_Qwen3-Next-80B-A3B-Instruct | 131072 | 8192 | 3.075 | 3.075 | +0.0% |
| Qwen_Qwen3-VL-30B-A3B-Instruct | 4096 | 2048 | 0.375 | 0.375 | +0.0% |
| Qwen_Qwen3-VL-30B-A3B-Instruct | 4096 | 8192 | 0.375 | 0.375 | +0.0% |
| Qwen_Qwen3-VL-30B-A3B-Instruct | 32768 | 2048 | 3.000 | 3.000 | +0.0% |
| Qwen_Qwen3-VL-30B-A3B-Instruct | 32768 | 8192 | 3.000 | 3.000 | +0.0% |
| Qwen_Qwen3-VL-30B-A3B-Instruct | 131072 | 2048 | 12.000 | 12.000 | +0.0% |
| Qwen_Qwen3-VL-30B-A3B-Instruct | 131072 | 8192 | 12.000 | 12.000 | +0.0% |
| Qwen_Qwen3-VL-8B-Instruct | 4096 | 2048 | 0.562 | 0.562 | +0.0% |
| Qwen_Qwen3-VL-8B-Instruct | 4096 | 8192 | 0.562 | 0.562 | +0.0% |
| Qwen_Qwen3-VL-8B-Instruct | 32768 | 2048 | 4.500 | 4.500 | +0.0% |
| Qwen_Qwen3-VL-8B-Instruct | 32768 | 8192 | 4.500 | 4.500 | +0.0% |
| Qwen_Qwen3-VL-8B-Instruct | 131072 | 2048 | 18.000 | 18.000 | +0.0% |
| Qwen_Qwen3-VL-8B-Instruct | 131072 | 8192 | 18.000 | 18.000 | +0.0% |
| Qwen_Qwen3.5-27B | 4096 | 2048 | 0.415 | 0.574 | -27.7% |
| Qwen_Qwen3.5-27B | 4096 | 8192 | 0.415 | 0.574 | -27.7% |
| Qwen_Qwen3.5-27B | 32768 | 2048 | 2.148 | 2.297 | -6.5% |
| Qwen_Qwen3.5-27B | 32768 | 8192 | 2.148 | 2.297 | -6.5% |
| Qwen_Qwen3.5-27B | 131072 | 2048 | 8.154 | 8.326 | -2.1% |
| Qwen_Qwen3.5-27B | 131072 | 8192 | 8.154 | 8.326 | -2.1% |
| Qwen_Qwen3.5-35B-A3B | 4096 | 2048 | 0.145 | 0.201 | -27.9% |
| Qwen_Qwen3.5-35B-A3B | 4096 | 8192 | 0.145 | 0.201 | -27.9% |
| Qwen_Qwen3.5-35B-A3B | 32768 | 2048 | 0.695 | 0.765 | -9.2% |
| Qwen_Qwen3.5-35B-A3B | 32768 | 8192 | 0.695 | 0.765 | -9.2% |
| Qwen_Qwen3.5-35B-A3B | 131072 | 2048 | 2.563 | 2.639 | -2.9% |
| Qwen_Qwen3.5-35B-A3B | 131072 | 8192 | 2.563 | 2.639 | -2.9% |
| Qwen_Qwen3.5-397B-A17B | 4096 | 2048 | 0.307 | 0.480 | -36.1% |
| Qwen_Qwen3.5-397B-A17B | 4096 | 8192 | 0.307 | 0.480 | -36.1% |
| Qwen_Qwen3.5-397B-A17B | 32768 | 2048 | 1.135 | 1.319 | -14.0% |
| Qwen_Qwen3.5-397B-A17B | 32768 | 8192 | 1.135 | 1.319 | -14.0% |
| Qwen_Qwen3.5-397B-A17B | 131072 | 2048 | 3.956 | 4.138 | -4.4% |
| Qwen_Qwen3.5-397B-A17B | 131072 | 8192 | 3.956 | 4.138 | -4.4% |
| TechxGenus_starcoder2-7b-instruct | 4096 | 2048 | 0.250 | 0.251 | -0.4% |
| TechxGenus_starcoder2-7b-instruct | 4096 | 8192 | 0.250 | 0.251 | -0.4% |
| ai21labs_AI21-Jamba-Reasoning-3B | 4096 | 2048 | 0.055 | 0.014 | +303.6% |
| ai21labs_AI21-Jamba-Reasoning-3B | 4096 | 8192 | 0.055 | 0.014 | +303.6% |
| ai21labs_AI21-Jamba-Reasoning-3B | 32768 | 2048 | 0.438 | 0.041 | +966.7% |
| ai21labs_AI21-Jamba-Reasoning-3B | 32768 | 8192 | 0.438 | 0.041 | +966.7% |
| ai21labs_AI21-Jamba-Reasoning-3B | 131072 | 2048 | 1.750 | 0.135 | +1198.6% |
| ai21labs_AI21-Jamba-Reasoning-3B | 131072 | 8192 | 1.750 | 0.135 | +1198.6% |
| ai21labs_Jamba-v0.1 | 4096 | 2048 | 0.500 | 0.081 | +520.6% |
| ai21labs_Jamba-v0.1 | 4096 | 8192 | 0.500 | 0.081 | +520.6% |
| ai21labs_Jamba-v0.1 | 32768 | 2048 | 4.000 | 0.518 | +672.8% |
| ai21labs_Jamba-v0.1 | 32768 | 8192 | 4.000 | 0.518 | +672.8% |
| ai21labs_Jamba-v0.1 | 131072 | 2048 | 16.000 | 2.018 | +692.9% |
| ai21labs_Jamba-v0.1 | 131072 | 8192 | 16.000 | 2.018 | +692.9% |
| deepseek-ai_DeepSeek-V3.2 | 4096 | 2048 | 0.299 | 0.268 | n/a |
| deepseek-ai_DeepSeek-V3.2 | 4096 | 8192 | 0.299 | 0.268 | n/a |
| deepseek-ai_DeepSeek-V3.2 | 32768 | 2048 | 2.390 | 2.145 | n/a |
| deepseek-ai_DeepSeek-V3.2 | 32768 | 8192 | 2.390 | 2.145 | n/a |
| deepseek-ai_DeepSeek-V3.2 | 131072 | 2048 | 9.561 | 8.578 | n/a |
| deepseek-ai_DeepSeek-V3.2 | 131072 | 8192 | 9.561 | 8.578 | n/a |
| deepseek-ai_DeepSeek-V3 | 4096 | 2048 | 0.268 | 0.268 | +0.0% |
| deepseek-ai_DeepSeek-V3 | 4096 | 8192 | 0.268 | 0.268 | +0.0% |
| deepseek-ai_DeepSeek-V3 | 32768 | 2048 | 2.145 | 2.145 | +0.0% |
| deepseek-ai_DeepSeek-V3 | 32768 | 8192 | 2.145 | 2.145 | +0.0% |
| deepseek-ai_DeepSeek-V3 | 131072 | 2048 | 8.578 | 8.578 | +0.0% |
| deepseek-ai_DeepSeek-V3 | 131072 | 8192 | 8.578 | 8.578 | +0.0% |
| deepseek-ai_DeepSeek-V4-Flash | 4096 | 2048 | 1.329 | 0.337 | n/a |
| deepseek-ai_DeepSeek-V4-Flash | 4096 | 8192 | 1.329 | 0.337 | n/a |
| deepseek-ai_DeepSeek-V4-Flash | 32768 | 2048 | 1.512 | 0.348 | n/a |
| deepseek-ai_DeepSeek-V4-Flash | 32768 | 8192 | 5.415 | 1.356 | n/a |
| deepseek-ai_DeepSeek-V4-Flash | 131072 | 2048 | 2.084 | 0.348 | n/a |
| deepseek-ai_DeepSeek-V4-Flash | 131072 | 8192 | 5.987 | 1.356 | n/a |
| google_gemma-4-12B-it | 4096 | 2048 | 1.505 | 1.317 | +14.2% |
| google_gemma-4-12B-it | 4096 | 8192 | 1.505 | 1.317 | +14.2% |
| google_gemma-4-12B-it | 32768 | 2048 | 3.567 | 2.067 | +72.6% |
| google_gemma-4-12B-it | 32768 | 8192 | 7.317 | 5.817 | +25.8% |
| google_gemma-4-12B-it | 131072 | 2048 | 9.567 | 3.567 | +168.2% |
| google_gemma-4-12B-it | 131072 | 8192 | 13.317 | 7.317 | +82.0% |
| google_gemma-4-26B-A4B-it | 4096 | 2048 | 0.941 | 0.862 | +9.1% |
| google_gemma-4-26B-A4B-it | 4096 | 8192 | 0.941 | 0.862 | +9.1% |
| google_gemma-4-26B-A4B-it | 32768 | 2048 | 2.230 | 1.605 | +39.0% |
| google_gemma-4-26B-A4B-it | 32768 | 8192 | 4.573 | 3.948 | +15.8% |
| google_gemma-4-26B-A4B-it | 131072 | 2048 | 5.980 | 3.480 | +71.8% |
| google_gemma-4-26B-A4B-it | 131072 | 8192 | 8.323 | 5.823 | +42.9% |
| google_gemma-4-31B-it-qat-w4a16-ct | 4096 | 2048 | 3.762 | 3.450 | +9.1% |
| google_gemma-4-31B-it-qat-w4a16-ct | 4096 | 8192 | 3.762 | 3.450 | +9.1% |
| google_gemma-4-31B-it-qat-w4a16-ct | 32768 | 2048 | 8.918 | 6.418 | +39.0% |
| google_gemma-4-31B-it-qat-w4a16-ct | 32768 | 8192 | 18.293 | 15.793 | +15.8% |
| google_gemma-4-31B-it-qat-w4a16-ct | 131072 | 2048 | 23.918 | 13.918 | +71.8% |
| google_gemma-4-31B-it-qat-w4a16-ct | 131072 | 8192 | 33.293 | 23.293 | +42.9% |
| google_gemma-4-31b-it | 4096 | 2048 | 3.762 | 3.450 | +9.1% |
| google_gemma-4-31b-it | 4096 | 8192 | 3.762 | 3.450 | +9.1% |
| google_gemma-4-31b-it | 32768 | 2048 | 8.918 | 6.418 | +39.0% |
| google_gemma-4-31b-it | 32768 | 8192 | 18.293 | 15.793 | +15.8% |
| google_gemma-4-31b-it | 131072 | 2048 | 23.918 | 13.918 | +71.8% |
| google_gemma-4-31b-it | 131072 | 8192 | 33.293 | 23.293 | +42.9% |
| google_gemma-4-E2B-it | 4096 | 2048 | 0.137 | 0.071 | +94.0% |
| google_gemma-4-E2B-it | 4096 | 8192 | 0.137 | 0.071 | +94.0% |
| google_gemma-4-E2B-it | 32768 | 2048 | 0.342 | 0.241 | +42.2% |
| google_gemma-4-E2B-it | 32768 | 8192 | 0.670 | 0.381 | +75.8% |
| google_gemma-4-E2B-it | 131072 | 2048 | 0.998 | 0.803 | +24.3% |
| google_gemma-4-E2B-it | 131072 | 8192 | 1.327 | 0.944 | +40.6% |
| google_gemma-4-E4B-it | 4096 | 2048 | 0.329 | 0.220 | +49.7% |
| google_gemma-4-E4B-it | 4096 | 8192 | 0.329 | 0.220 | +49.7% |
| google_gemma-4-E4B-it | 32768 | 2048 | 0.746 | 0.677 | +10.2% |
| google_gemma-4-E4B-it | 32768 | 8192 | 1.566 | 1.146 | +36.7% |
| google_gemma-4-E4B-it | 131072 | 2048 | 2.059 | 2.177 | -5.4% |
| google_gemma-4-E4B-it | 131072 | 8192 | 2.879 | 2.646 | +8.8% |
| ibm-granite_granite-4.0-h-micro | 4096 | 2048 | 0.105 | 0.105 | +0.0% |
| ibm-granite_granite-4.0-h-micro | 4096 | 8192 | 0.105 | 0.105 | +0.0% |
| ibm-granite_granite-4.0-h-micro | 32768 | 2048 | 0.326 | 0.326 | +0.0% |
| ibm-granite_granite-4.0-h-micro | 32768 | 8192 | 0.326 | 0.326 | +0.0% |
| ibm-granite_granite-4.0-h-micro | 131072 | 2048 | 1.076 | 1.076 | +0.0% |
| ibm-granite_granite-4.0-h-micro | 131072 | 8192 | 1.076 | 1.076 | +0.0% |
| ibm-granite_granite-4.0-h-small | 4096 | 2048 | 0.209 | 0.209 | +0.0% |
| ibm-granite_granite-4.0-h-small | 4096 | 8192 | 0.209 | 0.209 | +0.0% |
| ibm-granite_granite-4.0-h-small | 32768 | 2048 | 0.653 | 0.653 | +0.0% |
| ibm-granite_granite-4.0-h-small | 32768 | 8192 | 0.653 | 0.653 | +0.0% |
| ibm-granite_granite-4.0-h-small | 131072 | 2048 | 2.151 | 2.151 | +0.0% |
| ibm-granite_granite-4.0-h-small | 131072 | 8192 | 2.151 | 2.151 | +0.0% |
| microsoft_Phi-3-mini-4k-instruct | 4096 | 2048 | 1.500 | 1.506 | -0.4% |
| microsoft_Phi-3-mini-4k-instruct | 4096 | 8192 | 1.500 | 1.506 | -0.4% |
| mistralai_Ministral-3-8B-Instruct-2512 | 4096 | 2048 | 0.531 | 0.531 | +0.0% |
| mistralai_Ministral-3-8B-Instruct-2512 | 4096 | 8192 | 0.531 | 0.531 | +0.0% |
| mistralai_Ministral-3-8B-Instruct-2512 | 32768 | 2048 | 4.250 | 4.250 | +0.0% |
| mistralai_Ministral-3-8B-Instruct-2512 | 32768 | 8192 | 4.250 | 4.250 | +0.0% |
| mistralai_Ministral-3-8B-Instruct-2512 | 131072 | 2048 | 17.000 | 17.000 | +0.0% |
| mistralai_Ministral-3-8B-Instruct-2512 | 131072 | 8192 | 17.000 | 17.000 | +0.0% |
| mistralai_Ministral-8B-Instruct-2410 | 4096 | 2048 | 0.562 | 0.564 | -0.3% |
| mistralai_Ministral-8B-Instruct-2410 | 4096 | 8192 | 0.562 | 0.564 | -0.3% |
| mistralai_Ministral-8B-Instruct-2410 | 32768 | 2048 | 4.500 | 4.502 | -0.0% |
| mistralai_Ministral-8B-Instruct-2410 | 32768 | 8192 | 4.500 | 4.502 | -0.0% |
| mistralai_Mistral-7B-v0.1 | 4096 | 2048 | 0.500 | 0.502 | -0.4% |
| mistralai_Mistral-7B-v0.1 | 4096 | 8192 | 0.500 | 0.502 | -0.4% |
| mistralai_Mistral-7B-v0.1 | 32768 | 2048 | 4.000 | 1.002 | +299.2% |
| mistralai_Mistral-7B-v0.1 | 32768 | 8192 | 4.000 | 2.502 | +59.9% |
| moonshotai_Kimi-K2-Instruct | 4096 | 2048 | 0.268 | 0.268 | +0.0% |
| moonshotai_Kimi-K2-Instruct | 4096 | 8192 | 0.268 | 0.268 | +0.0% |
| moonshotai_Kimi-K2-Instruct | 32768 | 2048 | 2.145 | 2.145 | +0.0% |
| moonshotai_Kimi-K2-Instruct | 32768 | 8192 | 2.145 | 2.145 | +0.0% |
| moonshotai_Kimi-K2-Instruct | 131072 | 2048 | 8.578 | 8.578 | +0.0% |
| moonshotai_Kimi-K2-Instruct | 131072 | 8192 | 8.578 | 8.578 | +0.0% |
| nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 4096 | 2048 | 0.074 | 0.120 | -38.6% |
| nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 4096 | 8192 | 0.074 | 0.120 | -38.6% |
| nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 32768 | 2048 | 0.239 | 0.288 | -16.9% |
| nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 32768 | 8192 | 0.239 | 0.288 | -16.9% |
| nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 131072 | 2048 | 0.804 | 0.852 | -5.6% |
| nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | 131072 | 8192 | 0.804 | 0.852 | -5.6% |
| nvidia_NVIDIA-Nemotron-Nano-12B-v2 | 4096 | 2048 | 0.261 | 0.420 | -37.8% |
| nvidia_NVIDIA-Nemotron-Nano-12B-v2 | 4096 | 8192 | 0.261 | 0.420 | -37.8% |
| nvidia_NVIDIA-Nemotron-Nano-12B-v2 | 32768 | 2048 | 0.907 | 1.051 | -13.7% |
| nvidia_NVIDIA-Nemotron-Nano-12B-v2 | 32768 | 8192 | 0.907 | 1.051 | -13.7% |
| nvidia_NVIDIA-Nemotron-Nano-12B-v2 | 131072 | 2048 | 3.168 | 3.303 | -4.1% |
| nvidia_NVIDIA-Nemotron-Nano-12B-v2 | 131072 | 8192 | 3.168 | 3.303 | -4.1% |
| nvidia_NVIDIA-Nemotron-Nano-9B-v2 | 4096 | 2048 | 0.215 | 0.360 | -40.2% |
| nvidia_NVIDIA-Nemotron-Nano-9B-v2 | 4096 | 8192 | 0.215 | 0.360 | -40.2% |
| nvidia_NVIDIA-Nemotron-Nano-9B-v2 | 32768 | 2048 | 0.646 | 0.781 | -17.3% |
| nvidia_NVIDIA-Nemotron-Nano-9B-v2 | 32768 | 8192 | 0.646 | 0.781 | -17.3% |
| nvidia_NVIDIA-Nemotron-Nano-9B-v2 | 131072 | 2048 | 2.153 | 2.282 | -5.6% |
| nvidia_NVIDIA-Nemotron-Nano-9B-v2 | 131072 | 8192 | 2.153 | 2.282 | -5.6% |
| nvidia_Nemotron-H-8B-Base-8K | 4096 | 2048 | 0.161 | 0.254 | -36.5% |
| nvidia_Nemotron-H-8B-Base-8K | 4096 | 8192 | 0.161 | 0.254 | -36.5% |
| openai_gpt-oss-120b | 4096 | 2048 | 0.282 | 0.282 | +0.0% |
| openai_gpt-oss-120b | 4096 | 8192 | 0.282 | 0.282 | +0.0% |
| openai_gpt-oss-120b | 32768 | 2048 | 1.271 | 1.271 | +0.0% |
| openai_gpt-oss-120b | 32768 | 8192 | 1.692 | 1.692 | +0.0% |
| openai_gpt-oss-120b | 131072 | 2048 | 4.646 | 4.646 | +0.0% |
| openai_gpt-oss-120b | 131072 | 8192 | 5.067 | 5.067 | +0.0% |
| openai_gpt-oss-20b | 4096 | 2048 | 0.188 | 0.188 | +0.0% |
| openai_gpt-oss-20b | 4096 | 8192 | 0.188 | 0.188 | +0.0% |
| openai_gpt-oss-20b | 32768 | 2048 | 0.847 | 0.847 | +0.0% |
| openai_gpt-oss-20b | 32768 | 8192 | 1.128 | 1.128 | +0.0% |
| openai_gpt-oss-20b | 131072 | 2048 | 3.097 | 3.097 | +0.0% |
| openai_gpt-oss-20b | 131072 | 8192 | 3.378 | 3.378 | +0.0% |
| tiiuae_Falcon-H1-34B-Instruct | 4096 | 2048 | 0.562 | 0.857 | -34.4% |
| tiiuae_Falcon-H1-34B-Instruct | 4096 | 8192 | 0.562 | 0.857 | -34.4% |
| tiiuae_Falcon-H1-34B-Instruct | 32768 | 2048 | 4.500 | 4.856 | -7.3% |
| tiiuae_Falcon-H1-34B-Instruct | 32768 | 8192 | 4.500 | 4.856 | -7.3% |
| tiiuae_Falcon-H1-34B-Instruct | 131072 | 2048 | 18.000 | 18.424 | -2.3% |
| tiiuae_Falcon-H1-34B-Instruct | 131072 | 8192 | 18.000 | 18.424 | -2.3% |
| tiiuae_Falcon-H1-7B-Instruct | 4096 | 2048 | 0.172 | 0.329 | -47.8% |
| tiiuae_Falcon-H1-7B-Instruct | 4096 | 8192 | 0.172 | 0.329 | -47.8% |
| tiiuae_Falcon-H1-7B-Instruct | 32768 | 2048 | 1.375 | 1.513 | -9.1% |
| tiiuae_Falcon-H1-7B-Instruct | 32768 | 8192 | 1.375 | 1.513 | -9.1% |
| tiiuae_Falcon-H1-7B-Instruct | 131072 | 2048 | 5.500 | 5.658 | -2.8% |
| tiiuae_Falcon-H1-7B-Instruct | 131072 | 8192 | 5.500 | 5.658 | -2.8% |
| unsloth_Llama-3.1-8B-Instruct | 4096 | 2048 | 0.500 | 0.500 | +0.0% |
| unsloth_Llama-3.1-8B-Instruct | 4096 | 8192 | 0.500 | 0.500 | +0.0% |
| unsloth_Llama-3.1-8B-Instruct | 32768 | 2048 | 4.000 | 4.000 | +0.0% |
| unsloth_Llama-3.1-8B-Instruct | 32768 | 8192 | 4.000 | 4.000 | +0.0% |
| unsloth_Llama-3.1-8B-Instruct | 131072 | 2048 | 16.000 | 16.000 | +0.0% |
| unsloth_Llama-3.1-8B-Instruct | 131072 | 8192 | 16.000 | 16.000 | +0.0% |
| unsloth_Llama-3.2-11B-Vision-Instruct | 4096 | 2048 | 0.625 | 0.625 | +0.0% |
| unsloth_Llama-3.2-11B-Vision-Instruct | 4096 | 8192 | 0.625 | 0.625 | +0.0% |
| unsloth_Llama-3.2-11B-Vision-Instruct | 32768 | 2048 | 5.000 | 5.000 | +0.0% |
| unsloth_Llama-3.2-11B-Vision-Instruct | 32768 | 8192 | 5.000 | 5.000 | +0.0% |
| unsloth_Llama-3.2-11B-Vision-Instruct | 131072 | 2048 | 20.000 | 20.000 | +0.0% |
| unsloth_Llama-3.2-11B-Vision-Instruct | 131072 | 8192 | 20.000 | 20.000 | +0.0% |
| unsloth_Llama-4-Maverick-17B-128E-Instruct | 4096 | 2048 | 0.750 | 0.750 | +0.0% |
| unsloth_Llama-4-Maverick-17B-128E-Instruct | 4096 | 8192 | 0.750 | 0.750 | +0.0% |
| unsloth_Llama-4-Maverick-17B-128E-Instruct | 32768 | 2048 | 6.000 | 6.000 | +0.0% |
| unsloth_Llama-4-Maverick-17B-128E-Instruct | 32768 | 8192 | 6.000 | 6.000 | +0.0% |
| unsloth_Llama-4-Maverick-17B-128E-Instruct | 131072 | 2048 | 24.000 | 24.000 | +0.0% |
| unsloth_Llama-4-Maverick-17B-128E-Instruct | 131072 | 8192 | 24.000 | 24.000 | +0.0% |
| unsloth_Llama-4-Scout-17B-16E-Instruct | 4096 | 2048 | 0.750 | 0.750 | +0.0% |
| unsloth_Llama-4-Scout-17B-16E-Instruct | 4096 | 8192 | 0.750 | 0.750 | +0.0% |
| unsloth_Llama-4-Scout-17B-16E-Instruct | 32768 | 2048 | 6.000 | 6.000 | +0.0% |
| unsloth_Llama-4-Scout-17B-16E-Instruct | 32768 | 8192 | 6.000 | 6.000 | +0.0% |
| unsloth_Llama-4-Scout-17B-16E-Instruct | 131072 | 2048 | 24.000 | 24.000 | +0.0% |
| unsloth_Llama-4-Scout-17B-16E-Instruct | 131072 | 8192 | 24.000 | 24.000 | +0.0% |
| unsloth_gemma-2-27b-it | 4096 | 2048 | 1.438 | 1.440 | -0.2% |
| unsloth_gemma-2-27b-it | 4096 | 8192 | 1.438 | 1.440 | -0.2% |
| unsloth_gemma-2-9b-it | 4096 | 2048 | 1.312 | 1.315 | -0.2% |
| unsloth_gemma-2-9b-it | 4096 | 8192 | 1.312 | 1.315 | -0.2% |
| unsloth_gemma-3-27b-it | 4096 | 2048 | 2.195 | 2.195 | +0.0% |
| unsloth_gemma-3-27b-it | 4096 | 8192 | 2.195 | 2.195 | +0.0% |
| unsloth_gemma-3-27b-it | 32768 | 2048 | 4.851 | 4.851 | +0.0% |
| unsloth_gemma-3-27b-it | 32768 | 8192 | 10.476 | 10.476 | +0.0% |
| unsloth_gemma-3-27b-it | 131072 | 2048 | 12.351 | 12.351 | +0.0% |
| unsloth_gemma-3-27b-it | 131072 | 8192 | 17.976 | 17.976 | +0.0% |
| unsloth_gemma-3-4b-it | 4096 | 2048 | 0.549 | 0.549 | +0.0% |
| unsloth_gemma-3-4b-it | 4096 | 8192 | 0.549 | 0.549 | +0.0% |
| unsloth_gemma-3-4b-it | 32768 | 2048 | 1.213 | 1.213 | +0.0% |
| unsloth_gemma-3-4b-it | 32768 | 8192 | 2.619 | 2.619 | +0.0% |
| unsloth_gemma-3-4b-it | 131072 | 2048 | 3.088 | 3.088 | +0.0% |
| unsloth_gemma-3-4b-it | 131072 | 8192 | 4.494 | 4.494 | +0.0% |
| zai-org_GLM-5 | 4096 | 2048 | 0.382 | 0.343 | n/a |
| zai-org_GLM-5 | 4096 | 8192 | 0.382 | 0.343 | n/a |
| zai-org_GLM-5 | 32768 | 2048 | 3.056 | 2.742 | n/a |
| zai-org_GLM-5 | 32768 | 8192 | 3.056 | 2.742 | n/a |
| zai-org_GLM-5 | 131072 | 2048 | 12.226 | 10.969 | n/a |
| zai-org_GLM-5 | 131072 | 8192 | 12.226 | 10.969 | n/a |

## Weights: what the app shows per repo (resolveModel + weightsBytes, live HF metadata 2026-10-15)

| repo | src | detected | Hub params (B) | weight files GiB | app @detected GiB | app BF16 | app FP8 | app INT4 |
|---|---|---|---:|---:|---:|---:|---:|---:|
| unsloth/Llama-3.1-8B-Instruct | config | bf16 | 8.03 | 14.96 | 14.96 | 14.96 | 8.46 | 5.41 |
| Qwen/Qwen3-32B | config | bf16 | 32.76 | 61.02 | 61.02 | 61.02 | 31.96 | 18.34 |
| Qwen/Qwen3-30B-A3B | config | bf16 | 30.53 | 56.87 | 56.87 | 56.87 | 29.01 | 15.96 |
| Qwen/Qwen3-4B | config | bf16 | 4.02 | 7.49 | 7.49 | 7.49 | 4.11 | 2.52 |
| google/gemma-4-31B-it | config | bf16 | 31.27 | 58.25 | 58.25 | 58.25 | 30.44 | 17.40 |
| google/gemma-4-26B-A4B-it | config | bf16 | 25.81 | 48.07 | 48.07 | 48.07 | 24.72 | 13.78 |
| google/gemma-4-E4B-it | config | bf16 | 8.00 | 14.89 | 14.89 | 14.89 | 8.07 | 4.87 |
| mistralai/Mistral-Small-3.2-24B-Instruct-2506 | config | bf16 | 24.01 | 44.72 | 44.72 | 44.72 | 23.61 | 13.72 |
| RedHatAI/Meta-Llama-3.1-8B-Instruct-FP8 | config | fp8 | 8.03 | 8.46 | 8.46 | 14.96 | 8.46 | 5.41 |
| RedHatAI/Qwen3-8B-FP8-dynamic | config | fp8 | 8.19 | 8.79 | 8.79 | 15.26 | 8.79 | 5.76 |
| RedHatAI/Llama-3.3-70B-Instruct-FP8-dynamic | config | fp8 | 70.56 | 67.68 | 67.68 | 131.43 | 67.68 | 37.79 |
| deepseek-ai/DeepSeek-V3 | config | fp8 | 684.53 | 641.30 | 641.30 | 1275.04 | 641.30 | 341.22 |
| Qwen/Qwen3-30B-A3B-FP8 | config | fp8 | 30.53 | 30.22 | 30.22 | 56.87 | 30.22 | 15.96 |
| Qwen/Qwen3-235B-A22B-FP8 | config | fp8 | 235.11 | 222.63 | 222.63 | 437.92 | 222.63 | 118.03 |
| MiniMaxAI/MiniMax-M2 | config | fp8 | 228.69 | 214.33 | 214.33 | 425.97 | 214.33 | 114.83 |
| Qwen/Qwen2.5-7B-Instruct-AWQ | config | int4 | 7.62 | 5.19 | 5.19 | 14.19 | 8.11 | 5.19 |
| Qwen/Qwen2.5-72B-Instruct-AWQ | config | int4 | 72.96 | 38.74 | 38.74 | 135.89 | 70.27 | 38.74 |
| Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4 | config | int4 | 7.62 | 5.19 | 5.19 | 14.19 | 8.11 | 5.19 |
| Qwen/Qwen2.5-7B-Instruct-GPTQ-Int8 | config | int8 | 7.62 | 8.25 | 8.25 | 14.19 | 8.11 | 5.26 |
| RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16 | config | int4 | 8.03 | 5.34 | 5.34 | 14.96 | 8.46 | 5.34 |
| RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w8a8 | config | int8 | 8.03 | 8.46 | 8.46 | 14.96 | 8.46 | 5.41 |
| google/gemma-4-31B-it-qat-w4a16-ct | config | int4 | 33.60 | 21.67 | 21.67 | 62.58 | 32.60 | 21.67 |
| RedHatAI/Llama-3.3-70B-Instruct-NVFP4 | config | int4 | 40.61 | 39.78 | 39.78 | 75.64 | 39.77 | 39.78 |
| nvidia/Llama-3.3-70B-Instruct-FP4 | config | int4 | 70.55 | 39.78 | 39.78 | 131.42 | 67.67 | 39.78 |
| openai/gpt-oss-20b | config | int4 | 20.91 | 12.82 | 12.82 | 38.96 | 20.56 | 12.82 |
| openai/gpt-oss-120b | config | int4 | 116.83 | 60.77 | 60.77 | 217.61 | 109.88 | 60.77 |
| unsloth/Llama-3.1-8B-Instruct-bnb-4bit | config | int4 | 8.25 | 5.31 | 5.31 | 15.36 | 8.66 | 5.31 |
| unsloth/Qwen3-30B-A3B-GGUF | config | int4 | 30.53 | - | 15.96 | 56.87 | 29.01 | 15.96 |
| bartowski/Meta-Llama-3.1-8B-Instruct-GGUF | partial | int4 | 8.03 | - | - | - | - | - |
| deepseek-ai/DeepSeek-V4-Flash | config | fp8 | 290.94 | 148.66 | 148.66 | 541.93 | 148.66 | 145.40 |
| Qwen/Qwen2.5-VL-7B-Instruct | config | bf16 | 8.29 | 15.45 | 15.45 | 15.45 | 8.74 | 5.59 |
| Qwen/Qwen3-VL-8B-Instruct | config | bf16 | 8.77 | 16.33 | 16.33 | 16.33 | 9.32 | 6.04 |
| zai-org/GLM-4.5-Air | config | bf16 | 110.47 | 205.77 | 205.76 | 205.76 | 104.04 | 56.35 |
| Qwen/Qwen3.5-35B-A3B | config | bf16 | 35.95 | 66.97 | 66.97 | 66.97 | 34.43 | 19.18 |
| moonshotai/Kimi-K2-Instruct | config | fp8 | 1026.41 | 958.51 | 958.51 | 1911.83 | 958.51 | 511.04 |
| deepseek-ai/DeepSeek-V3.2 | config | fp8 | 685.36 | 642.13 | 642.13 | 1276.57 | 642.13 | 341.63 |

## Evidence index (vLLM v0.31.0 source, raw.githubusercontent.com/vllm-project/vllm/v0.31.0/<path>; local copies in vllm-src/)

- Spec sizing: vllm/v1/kv_cache_interface.py — AttentionSpec.page_size_bytes; FullAttentionSpec.max_memory_usage_bytes; SlidingWindowSpec.max_admission_blocks_per_request (window-1 + max_in_flight_tokens, +1 block); ChunkedLocalAttentionSpec; MambaSpec.max_memory_usage_bytes ("align" = 2 + spec blocks); CrossAttentionSpec.
- Grouping: vllm/v1/core/kv_cache_utils.py — unify_kv_cache_spec_page_size (scales block_size of smaller pages), _get_kv_cache_groups_uniform_page_size (min/max x1.5 group rule), get_max_concurrency_for_kv_cache_config. Packed groups only for block-outermost layouts (not default: NHD=LBNHC).
- Hybrid block alignment: vllm/platforms/interface.py _align_hybrid_block_size.
- Gemma 4: vllm/transformers_utils/configs/gemma4.py gemma4_layer_config (full layers: head_dim=global_head_dim; KV heads=num_global_key_value_heads when attention_k_eq_v); vllm/model_executor/models/gemma4.py Gemma4Attention (num_kv_shared_layers -> kv_sharing_target_layer_name, no own cache). Gemma4Unified (12B) reuses Gemma4ForCausalLM.
- SSM dtype: vllm/model_executor/models/config.py NemotronHForCausalLMConfig.DEFAULT_MAMBA_SSM_CACHE_DTYPE = "float32" (unless HF config sets mamba_ssm_cache_dtype); Qwen3_5*Config reads hf mamba_ssm_dtype ("float32" in every Qwen3.5 config). mamba_utils.py MambaStateDtypeCalculator._mamba_state_dtype.
- Model-level sliding window: vllm/engine/arg_utils.py (create_engine_config) sets CacheConfig.sliding_window when layer_types is None or all sliding; Attention.__init__ falls back to cache_config.sliding_window.
- Llama 4: vllm/config/vllm.py — attention_chunk_size => hybrid KV cache manager disabled unless VLLM_ALLOW_CHUNKED_LOCAL_ATTN_WITH_HYBRID_KV_CACHE=1, so chunked layers are promoted to full attention (app's all-full count matches).
- KV dtype default: vllm/utils/torch_utils.py resolve_kv_cache_dtype_string/get_kv_cache_quant_algo_string (only quant_method modelopt* maps kv_cache_quant_algo -> fp8_e4m3/nvfp4); vllm/transformers_utils/model_arch_config_convertor.py _normalize_quantization_config sets quant_method "modelopt"/"modelopt_fp4" for hf_quant_config.json producer=modelopt; layers/quantization/kv_cache.py: with cache dtype auto, checkpoint k/v scales are forced to 1.0 (compressed-tensors kv_cache_scheme does not switch the cache to fp8).
- MLA/DSA: layers/attention/mla_attention.py get_kv_cache_spec (fp8_ds_mla 656 B, nvfp4_ds_mla 352 B); _canonicalize_sparse_mla_kv_cache_dtype (FLASHINFER_MLA_SPARSE_SM120 turns auto/fp8 into fp8_ds_mla); models/deepseek_v32/attention.py indexer head_dim + head_dim/128*4 = 132 B uint8.
- MQA: transformers_utils/model_arch_config_convertor.py get_total_num_kv_heads (n_head_kv, num_kv_heads, num_key_value_heads, multi_query_group_num, num_attention_groups) and FalconModelArchConfigConvertor (multi_query -> 1).
- Falcon-H1: models/falcon_h1.py FalconH1ParallelHybrid (attention + MambaMixer2 in every layer). Jamba: models/jamba.py (layers_block_type, MambaMixer = Mamba1).
- Removed: models/registry.py _PREVIOUSLY_SUPPORTED_MODELS (MllamaForConditionalGeneration 0.10.2; MiniMaxText01/M1 0.23.0). GGUF/bitsandbytes moved to vllm-gguf-plugin / vllm-bnb-plugin (docs/features/quantization/gguf.md, bnb.md); no in-tree loader.
- MTP skip: models/deepseek_v2.py load_weights (get_spec_layer_idx_from_weight_name -> continue), glm4_moe.py skip_spec_layers, qwen3_next.py mapper {"mtp.": None}.
- Encoder profiling: v1/worker/gpu_model_runner.py profile_run ("Profile with multimodal encoder & encoder cache": dummy max mm batch through embed_multimodal, outputs held in encoder_cache during the dummy forward).

## App references
- src/lib/hf.ts:181 KV-head fallback (num_key_value_heads ?? num_kv_heads ?? heads); :232 res.json() (throws on Infinity); :308 detectKvDtype (config.json kv_cache_scheme only); :320-326 sizeShipped base-model param fix.
- src/lib/layers.ts:171 state counted at 2 B/element; :70/:164 window only when layer_types/pattern assign it.
- src/lib/calc.ts:166 QUANT_BITS int4 4.25; :196 one (heads x head_dim) for every layer; :393 kvLayout single per-layer page.

## Other spot checks
- Nemotron-H 8B / Nemotron Nano 12B v2 config.json contain `Infinity` (time_step_limit) -> JSON.parse fails in the browser -> fetchConfig returns null (config unusable). Nemotron 3 Nano 30B-A3B parses (and sets mamba_ssm_cache_dtype float32).
- RedHatAI/Llama-3.3-70B-Instruct-NVFP4: cardData.base_model = "meta-llama/Meta-Llama-3.3-70B-Instruct" (no such repo) -> base lookup fails -> numParams stays 40.6B (packed U8 count).
- gemma-4-31B-it-qat-w4a16-ct: compressed-tensors W4A16 group_size 32, 192 ignored modules (vision tower etc.), BF16 4.31B elements -> 21.67 GiB vs app INT4 what-if 17.40 GiB for gemma-4-31B-it.

# AI görünürlüğü — hedef sorular

Durum: **ONAYLI** (2026-11-01) — ölçüm dili EN; ilk ölçüm: [2026-11-01.md](2026-11-01.md). Bu liste ölçümün sabit
soru setidir: aynı sorular, aynı motorlar, ayda bir (`docs/ai-visibility/<YYYY-MM-DD>.md`). Soru değişirse eski
ölçümlerle karşılaştırma bozulur; yeni soru eklemek serbest, eskisini değiştirmek yerine yenisini ekle.

Seçim ölçütü: kullanıcının (altyapı/ML mühendisi, kendi donanımında model çalıştıran) bir AI asistana gerçekten
yazacağı, koşullu, doğal dilde soru; anahtar kelime parçası değil. Her sorunun sitede doğrudan cevaplayan bir sayfası
var. Sorularda sayı yalnız sorunun koşulu olarak geçer (bağlam, kart, model); cevap yazılmadı.

| # | Soru (EN — ölçüm dili) | Türkçe karşılığı | Cevaplayan sayfa |
|---|---|---|---|
| 1 | How much VRAM does Llama 3.3 70B need at FP8 with a 32k context? | Llama 3.3 70B, FP8 ve 32k context ile kaç GB VRAM ister? | `models/llama-3.3-70b.html`, `index.html` |
| 2 | Can I run a 70B model on two 24 GB GPUs like RTX 4090s? | 70B bir model iki 24 GB GPU'ya (ör. iki RTX 4090) sığar mı? | `index.html`, `gpus/rtx4090-24.html` |
| 3 | How many concurrent users can one H100 serve for an 8B model at 8k context? | Tek H100, 8k context'te 8B bir model için kaç eşzamanlı kullanıcıya yeter? | `index.html`, `gpus/h100-80.html` |
| 4 | How big is the KV cache for a 128k-token context, and how do I calculate it? | 128k token context için KV cache ne kadar büyük, nasıl hesaplanır? | `concepts/kv-cache.html` |
| 5 | Do Mixture-of-Experts models like Qwen3-30B-A3B need less GPU memory than dense models? | Qwen3-30B-A3B gibi MoE modeller dense modellerden daha az GPU belleği mi ister? | `index.html` (SSS), `models/qwen3-30b-a3b.html` |
| 6 | How much GPU memory do I need to fine-tune an 8B model with QLoRA versus LoRA? | 8B bir modeli QLoRA ile LoRA'ya göre ince ayar yapmak ne kadar GPU belleği ister? | `train.html` |
| 7 | Can I do a full fine-tune of a 7B model on a single 80 GB GPU? | 7B bir modelin tam ince ayarı tek 80 GB GPU'da yapılır mı? | `train.html` |
| 8 | Which LLMs fit on an RTX 5090 with 32 GB? | 32 GB'lık RTX 5090'a hangi LLM'ler sığar? | `gpus/rtx5090-32.html` |
| 9 | Can a Mac with 128 GB of unified memory run a 70B model? | 128 GB unified bellekli bir Mac 70B bir modeli çalıştırır mı? | `gpus/apple-m4max-128.html`, `gpu-compare.html` (SSS) |
| 10 | How fast will an RTX 5090 generate tokens compared with an L40S for the same model? | Aynı modelde RTX 5090, L40S'e göre ne hızda token üretir? | `decode.html`, `gpu-compare.html` |
| 11 | What --gpu-memory-utilization and --max-model-len should I set in vLLM for my model and GPU? | vLLM'de modelim ve GPU'm için --gpu-memory-utilization ve --max-model-len ne olmalı? | `vllm.html` |
| 12 | How many GPUs do I need to serve 10 requests per second with a 2-second time-to-first-token target? | Saniyede 10 istek ve 2 saniyelik ilk token hedefi için kaç GPU gerekir? | `plan.html` |
| 13 | How does DeepSeek's multi-head latent attention reduce KV cache memory? | DeepSeek'in multi-head latent attention'ı KV cache belleğini nasıl azaltır? | `concepts/gqa-mqa-mla.html`, `index.html` (SSS) |
| 14 | Is Qwen2.5-Coder-7B a good fit for a coding assistant, compared with Qwen2.5-7B-Instruct? | Kod asistanı için Qwen2.5-Coder-7B mi, Qwen2.5-7B-Instruct mi daha uygun? | `compare.html`, `fit.html` |

## Onaylarken bak

- **Dil:** ölçüm EN sorularla yapılır (motorların ve rakip kaynakların çoğu EN). TR soruları ayrı bir set olarak da
  ölçmek istersen ikinci sütun hazır; iki dil ayrı satır sayılır, maliyet ikiye katlanır.
- **Marka adı yok:** sorular "LLMScale" demiyor; amaç adı bilmeyen birinin sorusunda anılıp anılmadığımız. Ad içeren
  bir kontrol sorusu ("What is LLMScale?") istenirse ayrı eklenir, bağlam doğruluğunu ölçer.
- **Rakip örnekleri:** 2, 3, 8 ve 12 en rekabetçi sorular (başka hesaplayıcılar ve forum cevapları da yanıtlar);
  6, 7 ve 13 sitenin doğrulanmış sayılarının en güçlü olduğu yer.
- Model ve kart adları bugünkü preset ve rehber listesinden seçildi; yeni nesil bir model (ör. DeepSeek-V4) için rehber
  sayfası çıkınca o soru da eklenebilir.

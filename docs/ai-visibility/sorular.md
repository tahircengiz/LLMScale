# AI görünürlüğü — hedef sorular

Durum: **ONAYLI** (2026-11-01) — ölçüm dili EN; ilk ölçüm: [2026-11-01.md](2026-11-01.md). Dalga 1 dilleri (zh,
hi, es) için aynı soruların çevirisi aşağıda; ilk ölçümleri: [2026-11-19.md](2026-11-19.md). Bu liste ölçümün sabit
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

## Dalga 1 dilleri (zh, hi, es)

Aynı 14 soru, anlamı değiştirilmeden çevrildi (2026-11-19); "#" yukarıdaki tabloyla aynı soru. Çevirileri Claude yaptı,
ana dili bu diller olan biri kontrol etmedi. Hintçe sorularda teknik terimler Hintçe teknik metinlerdeki yaygın
kullanım gibi Latin harfle bırakıldı. Bu sorular dil sayfaları (`/zh/`, `/hi/`, `/es/`) yayına girince o sayfaların
görünürlüğünü ölçer; her dil ayrı satır sayılır.

| # | zh (basitleştirilmiş) | hi | es |
|---|---|---|---|
| 1 | Llama 3.3 70B 在 FP8、32k 上下文下需要多少显存？ | FP8 और 32k context के साथ Llama 3.3 70B को कितनी VRAM चाहिए? | ¿Cuánta VRAM necesita Llama 3.3 70B en FP8 con un contexto de 32k? |
| 2 | 70B 的模型能在两张 24 GB 显卡（比如两张 RTX 4090）上运行吗？ | क्या मैं 70B मॉडल को दो 24 GB GPU (जैसे दो RTX 4090) पर चला सकता हूँ? | ¿Puedo ejecutar un modelo de 70B en dos GPU de 24 GB, como dos RTX 4090? |
| 3 | 一张 H100 在 8k 上下文下运行 8B 模型，能支持多少并发用户？ | 8k context पर 8B मॉडल के लिए एक H100 कितने concurrent users को serve कर सकता है? | ¿Cuántos usuarios simultáneos puede atender una H100 con un modelo de 8B y un contexto de 8k? |
| 4 | 128k token 上下文的 KV 缓存有多大？怎么计算？ | 128k token context के लिए KV cache कितना बड़ा होता है, और इसकी गणना कैसे करें? | ¿Qué tamaño tiene la caché KV para un contexto de 128k tokens y cómo se calcula? |
| 5 | 像 Qwen3-30B-A3B 这样的 MoE（混合专家）模型比稠密模型需要更少的显存吗？ | क्या Qwen3-30B-A3B जैसे Mixture-of-Experts मॉडल को dense मॉडल से कम GPU मेमोरी चाहिए? | ¿Los modelos Mixture-of-Experts como Qwen3-30B-A3B necesitan menos memoria de GPU que los modelos densos? |
| 6 | 用 QLoRA 和 LoRA 微调 8B 模型分别需要多少显存？ | 8B मॉडल को QLoRA बनाम LoRA से fine-tune करने के लिए कितनी GPU मेमोरी चाहिए? | ¿Cuánta memoria de GPU necesito para hacer fine-tuning de un modelo de 8B con QLoRA frente a LoRA? |
| 7 | 能在单张 80 GB GPU 上对 7B 模型做全参数微调吗？ | क्या मैं एक 80 GB GPU पर 7B मॉडल का full fine-tune कर सकता हूँ? | ¿Puedo hacer un fine-tuning completo de un modelo de 7B en una sola GPU de 80 GB? |
| 8 | 32 GB 的 RTX 5090 能装下哪些大模型？ | 32 GB वाले RTX 5090 में कौन-से LLM फिट होते हैं? | ¿Qué LLM caben en una RTX 5090 de 32 GB? |
| 9 | 128 GB 统一内存的 Mac 能跑 70B 模型吗？ | क्या 128 GB unified memory वाला Mac 70B मॉडल चला सकता है? | ¿Puede un Mac con 128 GB de memoria unificada ejecutar un modelo de 70B? |
| 10 | 同一个模型，RTX 5090 和 L40S 生成 token 的速度相比如何？ | एक ही मॉडल के लिए RTX 5090, L40S की तुलना में कितनी तेज़ी से tokens generate करेगा? | ¿Qué tan rápido genera tokens una RTX 5090 en comparación con una L40S para el mismo modelo? |
| 11 | 在 vLLM 里，我的模型和 GPU 应该设置多大的 --gpu-memory-utilization 和 --max-model-len？ | vLLM में मेरे मॉडल और GPU के लिए --gpu-memory-utilization और --max-model-len कितना सेट करना चाहिए? | ¿Qué valores de --gpu-memory-utilization y --max-model-len debo poner en vLLM para mi modelo y mi GPU? |
| 12 | 要以每秒 10 个请求、首 token 延迟 2 秒的目标提供服务，需要多少张 GPU？ | 2 सेकंड के time-to-first-token लक्ष्य के साथ प्रति सेकंड 10 requests serve करने के लिए कितने GPU चाहिए? | ¿Cuántas GPU necesito para atender 10 solicitudes por segundo con un objetivo de 2 segundos de tiempo hasta el primer token? |
| 13 | DeepSeek 的多头潜在注意力（MLA）如何减少 KV 缓存占用的内存？ | DeepSeek का multi-head latent attention KV cache मेमोरी को कैसे कम करता है? | ¿Cómo reduce la multi-head latent attention de DeepSeek la memoria de la caché KV? |
| 14 | 做代码助手，Qwen2.5-Coder-7B 和 Qwen2.5-7B-Instruct 相比哪个更合适？ | कोडिंग असिस्टेंट के लिए Qwen2.5-Coder-7B, Qwen2.5-7B-Instruct की तुलना में कितना उपयुक्त है? | Para un asistente de programación, ¿es Qwen2.5-Coder-7B mejor opción que Qwen2.5-7B-Instruct? |

## Onaylarken bak

- **Dil:** ölçüm EN sorularla yapılır (motorların ve rakip kaynakların çoğu EN). TR soruları ayrı bir set olarak da
  ölçmek istersen ikinci sütun hazır; iki dil ayrı satır sayılır, maliyet ikiye katlanır.
- **Marka adı yok:** sorular "LLMScale" demiyor; amaç adı bilmeyen birinin sorusunda anılıp anılmadığımız. Ad içeren
  bir kontrol sorusu ("What is LLMScale?") istenirse ayrı eklenir, bağlam doğruluğunu ölçer.
- **Rakip örnekleri:** 2, 3, 8 ve 12 en rekabetçi sorular (başka hesaplayıcılar ve forum cevapları da yanıtlar);
  6, 7 ve 13 sitenin doğrulanmış sayılarının en güçlü olduğu yer.
- Model ve kart adları bugünkü preset ve rehber listesinden seçildi; yeni nesil bir model (ör. DeepSeek-V4) için rehber
  sayfası çıkınca o soru da eklenebilir.

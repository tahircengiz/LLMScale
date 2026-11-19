# AI görünürlüğü — hedef sorular

Durum: **ONAYLI** (2026-11-01) — ölçüm dili EN; ilk ölçüm: [2026-11-01.md](2026-11-01.md). Dalga 1 dilleri (zh,
hi, es) için aynı soruların çevirisi aşağıda; ilk ölçümleri: [2026-11-19.md](2026-11-19.md). Dalga 2 dilleri (fr,
pt, id, bn) için ikinci tablo; ilk ölçümleri: [2026-11-19-dalga2.md](2026-11-19-dalga2.md). Dalga 4 dilleri (ru,
de, ja) için üçüncü tablo; ilk ölçümleri: [2026-11-19-dalga4.md](2026-11-19-dalga4.md). Bu liste ölçümün sabit
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

## Dalga 2 dilleri (fr, pt, id, bn)

Aynı 14 soru, anlamı değiştirilmeden çevrildi (2026-11-19); "#" ilk tabloyla aynı soru. Çevirileri Claude yaptı, ana
dili bu diller olan biri kontrol etmedi. Portekizce sorular Brezilya Portekizcesi (D7). Fransızca sorularda soru
işaretinden önce, klavyeden yazan birinin yapacağı gibi düz boşluk var. Bengalce sorularda teknik terimlerin bir kısmı
(fine-tune, dense, time-to-first-token, multi-head latent attention) Latin harfle bırakıldı; Hintçe sorulardaki gibi.

| # | fr | pt | id | bn |
|---|---|---|---|---|
| 1 | Combien de VRAM faut-il à Llama 3.3 70B en FP8 avec un contexte de 32k ? | Quanta VRAM o Llama 3.3 70B precisa em FP8 com um contexto de 32k? | Berapa VRAM yang dibutuhkan Llama 3.3 70B dalam FP8 dengan konteks 32k? | 32k কনটেক্সটে FP8-এ Llama 3.3 70B চালাতে কত VRAM লাগে? |
| 2 | Puis-je faire tourner un modèle 70B sur deux GPU de 24 Go, comme deux RTX 4090 ? | Consigo rodar um modelo de 70B em duas GPUs de 24 GB, como duas RTX 4090? | Bisakah saya menjalankan model 70B di dua GPU 24 GB, seperti dua RTX 4090? | দুটি 24 GB GPU-তে (যেমন দুটি RTX 4090) কি আমি একটি 70B মডেল চালাতে পারব? |
| 3 | Combien d'utilisateurs simultanés un seul H100 peut-il servir avec un modèle 8B et un contexte de 8k ? | Quantos usuários simultâneos uma única H100 consegue atender com um modelo de 8B e um contexto de 8k? | Berapa banyak pengguna bersamaan yang bisa dilayani satu H100 untuk model 8B dengan konteks 8k? | 8k কনটেক্সটে একটি 8B মডেলের জন্য একটি H100 একসাথে কতজন ব্যবহারকারীকে সার্ভ করতে পারে? |
| 4 | Quelle est la taille du cache KV pour un contexte de 128k tokens, et comment la calculer ? | Qual é o tamanho do cache KV para um contexto de 128k tokens e como calculá-lo? | Seberapa besar KV cache untuk konteks 128k token, dan bagaimana cara menghitungnya? | 128k টোকেনের কনটেক্সটের জন্য KV ক্যাশ কত বড় হয়, আর এটা কীভাবে হিসাব করব? |
| 5 | Les modèles Mixture-of-Experts comme Qwen3-30B-A3B ont-ils besoin de moins de mémoire GPU que les modèles denses ? | Modelos Mixture-of-Experts como o Qwen3-30B-A3B precisam de menos memória de GPU que modelos densos? | Apakah model Mixture-of-Experts seperti Qwen3-30B-A3B membutuhkan memori GPU lebih sedikit daripada model dense? | Qwen3-30B-A3B-এর মতো Mixture-of-Experts মডেলে কি dense মডেলের চেয়ে কম GPU মেমরি লাগে? |
| 6 | Combien de mémoire GPU me faut-il pour le fine-tuning d'un modèle 8B avec QLoRA, comparé à LoRA ? | Quanta memória de GPU eu preciso para fazer fine-tuning de um modelo de 8B com QLoRA em comparação com LoRA? | Berapa memori GPU yang saya butuhkan untuk fine-tuning model 8B dengan QLoRA dibandingkan LoRA? | QLoRA আর LoRA দিয়ে একটি 8B মডেল fine-tune করতে কত GPU মেমরি লাগে? |
| 7 | Puis-je faire un fine-tuning complet d'un modèle 7B sur un seul GPU de 80 Go ? | Consigo fazer um fine-tuning completo de um modelo de 7B em uma única GPU de 80 GB? | Bisakah saya melakukan full fine-tuning model 7B di satu GPU 80 GB? | একটি মাত্র 80 GB GPU-তে কি 7B মডেলের full fine-tune করা যায়? |
| 8 | Quels LLM tiennent sur une RTX 5090 de 32 Go ? | Quais LLMs cabem em uma RTX 5090 de 32 GB? | LLM apa saja yang muat di RTX 5090 32 GB? | 32 GB-র RTX 5090-এ কোন কোন LLM ধরবে? |
| 9 | Un Mac avec 128 Go de mémoire unifiée peut-il faire tourner un modèle 70B ? | Um Mac com 128 GB de memória unificada consegue rodar um modelo de 70B? | Apakah Mac dengan memori terpadu 128 GB bisa menjalankan model 70B? | 128 GB ইউনিফায়েড মেমরির একটি Mac কি 70B মডেল চালাতে পারে? |
| 10 | À quelle vitesse une RTX 5090 génère-t-elle des tokens par rapport à une L40S, pour le même modèle ? | Quão rápido uma RTX 5090 gera tokens em comparação com uma L40S para o mesmo modelo? | Seberapa cepat RTX 5090 menghasilkan token dibandingkan L40S untuk model yang sama? | একই মডেলে L40S-এর তুলনায় RTX 5090 কত দ্রুত টোকেন তৈরি করবে? |
| 11 | Quelles valeurs de --gpu-memory-utilization et --max-model-len dois-je définir dans vLLM pour mon modèle et mon GPU ? | Quais valores de --gpu-memory-utilization e --max-model-len devo definir no vLLM para o meu modelo e a minha GPU? | Berapa nilai --gpu-memory-utilization dan --max-model-len yang harus saya atur di vLLM untuk model dan GPU saya? | আমার মডেল আর GPU-র জন্য vLLM-এ --gpu-memory-utilization আর --max-model-len কত সেট করা উচিত? |
| 12 | Combien de GPU me faut-il pour servir 10 requêtes par seconde avec un objectif de 2 secondes pour le temps jusqu'au premier token ? | Quantas GPUs eu preciso para atender 10 requisições por segundo com uma meta de 2 segundos de tempo até o primeiro token? | Berapa GPU yang saya butuhkan untuk melayani 10 permintaan per detik dengan target time-to-first-token 2 detik? | 2 সেকেন্ডের time-to-first-token লক্ষ্য রেখে প্রতি সেকেন্ডে 10টি রিকোয়েস্ট সার্ভ করতে কয়টি GPU লাগবে? |
| 13 | Comment la multi-head latent attention de DeepSeek réduit-elle la mémoire du cache KV ? | Como a multi-head latent attention do DeepSeek reduz a memória do cache KV? | Bagaimana multi-head latent attention milik DeepSeek mengurangi memori KV cache? | DeepSeek-এর multi-head latent attention কীভাবে KV ক্যাশের মেমরি কমায়? |
| 14 | Pour un assistant de programmation, Qwen2.5-Coder-7B est-il un meilleur choix que Qwen2.5-7B-Instruct ? | Para um assistente de programação, o Qwen2.5-Coder-7B é uma opção melhor que o Qwen2.5-7B-Instruct? | Untuk asisten pemrograman, apakah Qwen2.5-Coder-7B lebih cocok dibandingkan Qwen2.5-7B-Instruct? | কোডিং অ্যাসিস্ট্যান্টের জন্য Qwen2.5-Coder-7B কি Qwen2.5-7B-Instruct-এর চেয়ে বেশি উপযুক্ত? |

## Dalga 4 dilleri (ru, de, ja)

Aynı 14 soru, anlamı değiştirilmeden çevrildi (2026-11-19); "#" ilk tabloyla aynı soru. Çevirileri Claude yaptı, ana
dili bu diller olan biri kontrol etmedi. Almanca sorular "du/Sie" hitabı gerektirmeyecek biçimde ya da "ich" ile
kuruldu; Japonca sorular です/ます biçiminde ve tam genişlikte noktalama (、 ？ （）) ile yazıldı. Model, kart ve
parametre adları (FP8, GPU, Mixture-of-Experts, `--max-model-len`) üç dilde de Latin harfle kaldı.

| # | ru | de | ja |
|---|---|---|---|
| 1 | Сколько VRAM нужно Llama 3.3 70B в FP8 с контекстом 32k? | Wie viel VRAM braucht Llama 3.3 70B in FP8 mit einem Kontext von 32k? | Llama 3.3 70B を FP8、32k コンテキストで動かすには VRAM がどれくらい必要ですか？ |
| 2 | Можно ли запустить модель на 70B на двух GPU по 24 ГБ, например на двух RTX 4090? | Kann ich ein 70B-Modell auf zwei GPUs mit 24 GB betreiben, etwa zwei RTX 4090? | 70B のモデルを 24 GB の GPU 2 枚（RTX 4090 2 枚など）で動かせますか？ |
| 3 | Сколько одновременных пользователей может обслужить один H100 для модели на 8B с контекстом 8k? | Wie viele gleichzeitige Nutzer kann eine einzelne H100 bei einem 8B-Modell mit 8k Kontext bedienen? | H100 1 枚で、8B モデルを 8k コンテキストで動かす場合、同時に何人のユーザーに対応できますか？ |
| 4 | Какой размер у KV-кэша для контекста в 128k токенов и как его посчитать? | Wie groß ist der KV-Cache bei einem Kontext von 128k Tokens, und wie berechne ich ihn? | 128k トークンのコンテキストでは KV キャッシュはどれくらいの大きさになり、どう計算すればいいですか？ |
| 5 | Нужно ли моделям Mixture-of-Experts вроде Qwen3-30B-A3B меньше памяти GPU, чем плотным моделям? | Brauchen Mixture-of-Experts-Modelle wie Qwen3-30B-A3B weniger GPU-Speicher als dichte Modelle? | Qwen3-30B-A3B のような Mixture-of-Experts モデルは、Dense モデルより GPU メモリが少なくて済みますか？ |
| 6 | Сколько памяти GPU нужно для дообучения модели на 8B с QLoRA по сравнению с LoRA? | Wie viel GPU-Speicher brauche ich für das Fine-Tuning eines 8B-Modells mit QLoRA im Vergleich zu LoRA? | 8B モデルを QLoRA でファインチューニングする場合と LoRA の場合で、必要な GPU メモリはどれくらい違いますか？ |
| 7 | Можно ли сделать полное дообучение модели на 7B на одном GPU с 80 ГБ? | Kann ich ein vollständiges Fine-Tuning eines 7B-Modells auf einer einzigen GPU mit 80 GB machen? | 80 GB の GPU 1 枚で 7B モデルのフルファインチューニングはできますか？ |
| 8 | Какие LLM помещаются на RTX 5090 с 32 ГБ? | Welche LLMs passen auf eine RTX 5090 mit 32 GB? | 32 GB の RTX 5090 に載る LLM はどれですか？ |
| 9 | Может ли Mac со 128 ГБ объединённой памяти запустить модель на 70B? | Kann ein Mac mit 128 GB Unified Memory ein 70B-Modell ausführen? | 128 GB のユニファイドメモリを搭載した Mac で 70B モデルは動きますか？ |
| 10 | Насколько быстро RTX 5090 генерирует токены по сравнению с L40S на одной и той же модели? | Wie schnell generiert eine RTX 5090 Tokens im Vergleich zu einer L40S beim selben Modell? | 同じモデルで、RTX 5090 は L40S と比べてどれくらいの速さでトークンを生成しますか？ |
| 11 | Какие значения --gpu-memory-utilization и --max-model-len задать в vLLM для моей модели и GPU? | Welche Werte für --gpu-memory-utilization und --max-model-len sollte ich in vLLM für mein Modell und meine GPU setzen? | 自分のモデルと GPU に合わせて、vLLM の --gpu-memory-utilization と --max-model-len はいくつに設定すべきですか？ |
| 12 | Сколько GPU нужно, чтобы обслуживать 10 запросов в секунду с целевым временем до первого токена 2 секунды? | Wie viele GPUs brauche ich, um 10 Anfragen pro Sekunde mit einem Ziel von 2 Sekunden Time-to-First-Token zu bedienen? | 毎秒 10 リクエストを、最初のトークンまでの時間 2 秒以内という目標で処理するには、GPU が何枚必要ですか？ |
| 13 | Как multi-head latent attention в DeepSeek уменьшает память под KV-кэш? | Wie reduziert die Multi-Head Latent Attention von DeepSeek den Speicherbedarf des KV-Caches? | DeepSeek の multi-head latent attention（MLA）は KV キャッシュのメモリをどのように削減しますか？ |
| 14 | Для ассистента по программированию Qwen2.5-Coder-7B подходит лучше, чем Qwen2.5-7B-Instruct? | Ist Qwen2.5-Coder-7B für einen Programmierassistenten besser geeignet als Qwen2.5-7B-Instruct? | コーディングアシスタントには、Qwen2.5-7B-Instruct より Qwen2.5-Coder-7B のほうが適していますか？ |

## Onaylarken bak

- **Dil:** ölçüm EN sorularla yapılır (motorların ve rakip kaynakların çoğu EN). TR soruları ayrı bir set olarak da
  ölçmek istersen ikinci sütun hazır; iki dil ayrı satır sayılır, maliyet ikiye katlanır.
- **Marka adı yok:** sorular "LLMScale" demiyor; amaç adı bilmeyen birinin sorusunda anılıp anılmadığımız. Ad içeren
  bir kontrol sorusu ("What is LLMScale?") istenirse ayrı eklenir, bağlam doğruluğunu ölçer.
- **Rakip örnekleri:** 2, 3, 8 ve 12 en rekabetçi sorular (başka hesaplayıcılar ve forum cevapları da yanıtlar);
  6, 7 ve 13 sitenin doğrulanmış sayılarının en güçlü olduğu yer.
- Model ve kart adları bugünkü preset ve rehber listesinden seçildi; yeni nesil bir model (ör. DeepSeek-V4) için rehber
  sayfası çıkınca o soru da eklenebilir.

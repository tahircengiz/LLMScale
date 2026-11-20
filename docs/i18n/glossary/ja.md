# Terim sözlüğü — 日本語 (ja)

Durum: Dalga 4 (2026-11-19). Kaynak dil EN. Kural: docs/i18n-plan.md §4 — karşılık birincil kaynaktan, kaynaksız terim İngilizce kalır.

Hedef: bölge kodu olmayan tek `ja` sürümü (Japonya okuru). Kaynaklar Japonya sayfaları (`ja`, `ja-jp`, `ja_jp`, `jp`); bölgeye göre ayrışan biçim görülmedi.

## Kaynaklar

Her sayfa 2026-11-19'da `curl` ile indirildi, ana içeriği metne çevrildi ve terim o metinde arandı. Tablodaki her biçim, kaynak sütununda adı geçen sayfada geçiyor (otomatik denetim: tablodaki 106 biçim ve belgedeki 251 alıntı (225 farklı), hepsi bulundu; betik her biçimi kaynak sütunundaki sayfalarda, her alıntıyı ardındaki parantezde adı geçen her sayfada arar, toplam 321 sayfa–alıntı eşleşmesi; ana metin ve sayfanın bütün metni aranır, karşılaştırmada büyük-küçük harf ayrılmadı, boşluğun varlığı ayrıldı. BİRLEŞTİRME satırlarının ja biçimi kaynakta aranmaz, yalnız alıntıları denetlenir). Hugging Face Transformers için canlı site okundu (v5.23.0). GitHub'daki `docs/source/ja` dosyalarının başlıkları İngilizce ("# Model training anatomy", "# Glossary", "# Quantize 🤗 Transformers models"), canlı sayfalarınki Japonca ("GPU メモリ使用量", "用語集", "量子化"); canlı Japonca metnin nasıl üretildiği bilinmiyor. Hub dokümanının Japonca sayfaları canlı, ama `huggingface/hub-docs` deposunda `ja` klasörü yok (yalnız hub, inference-providers, sagemaker, xet); kaynağı bilinmiyor. HF LLM Course'un Japoncası yalnız 0, 1, 2, 4, 7 ve 8. bölümler için var (`chapters/ja`); Japonca TRANSLATING ya da sözlük dosyası yok.

Makine çevirisi: Google sayfalarının K27–K36, K38 ve K39'unda "Google は AI 技術を使用して、コンテンツをご希望の言語に翻訳しています" (K27) ve "AI 翻訳には誤りが含まれる場合があります" (K27) notu var; K37 ve K40'ta yok. Microsoft Learn sayfalarının `ms.translationtype` etiketi K44 ve K46'da HT (insan çevirisi), ötekilerde MT. K44 HT olduğu hâlde başlığı prompt'u "hızlı" anlamında çeviriyor: "迅速なエンジニアリング手法" (K44). NVIDIA blog yazılarından K62, K63 ve K67 "機械翻訳によって翻訳されたものです" (K63, K67) notunu taşıyor; K64–K66'da not yok. AWS sayfalarının hepsinde "翻訳は機械翻訳により提供されています" (K68, K72) notu var. Bu sayfalar yine birincil kaynak sayıldı; yalnız Google ve AWS'den gelen tek kaynaklı biçimler notta ayrıca işaretlendi.

Sayım derlemi 75 sayfa (K1–K51, K53–K76). K52 ve K77–K80 yalnız yazım kuralı kaynağıdır, terim sayımına girmedi. K1 ve K69 sayıma girdi ama tablolarda kaynak olarak ayrıca anılmadı.

Hugging Face
- [K1] HF LLM Course (ja) — 1.3 Transformersで何ができる? — https://huggingface.co/learn/llm-course/ja/chapter1/3 (okunma tarihi 2026-11-19)
- [K2] HF LLM Course (ja) — 1.4 Transformersの仕組みについて — https://huggingface.co/learn/llm-course/ja/chapter1/4 (okunma tarihi 2026-11-19)
- [K3] HF LLM Course (ja) — 2.2 pipelineの裏側 — https://huggingface.co/learn/llm-course/ja/chapter2/2 (okunma tarihi 2026-11-19)
- [K4] HF LLM Course (ja) — 2.3 モデル — https://huggingface.co/learn/llm-course/ja/chapter2/3 (okunma tarihi 2026-11-19)
- [K5] HF LLM Course (ja) — 2.4 トークナイザ — https://huggingface.co/learn/llm-course/ja/chapter2/4 (okunma tarihi 2026-11-19)
- [K6] HF LLM Course (ja) — 4.3 学習済みモデルを共有する — https://huggingface.co/learn/llm-course/ja/chapter4/3 (okunma tarihi 2026-11-19)
- [K7] HF LLM Course (ja) — 4.4 モデルカードを作成する — https://huggingface.co/learn/llm-course/ja/chapter4/4 (okunma tarihi 2026-11-19)
- [K8] HF LLM Course (ja) — 7.3 マスク言語モデルの微調整 — https://huggingface.co/learn/llm-course/ja/chapter7/3 (okunma tarihi 2026-11-19)
- [K9] Transformers docs (ja) — index — https://huggingface.co/docs/transformers/ja/index (okunma tarihi 2026-11-19)
- [K10] Transformers docs (ja) — quicktour ("クイックスタート") — https://huggingface.co/docs/transformers/ja/quicktour (okunma tarihi 2026-11-19)
- [K11] Transformers docs (ja) — glossary ("用語集") — https://huggingface.co/docs/transformers/ja/glossary (okunma tarihi 2026-11-19)
- [K12] Transformers docs (ja) — llm_tutorial ("テキスト生成") — https://huggingface.co/docs/transformers/ja/llm_tutorial (okunma tarihi 2026-11-19)
- [K13] Transformers docs (ja) — chat_templating ("チャットテンプレート") — https://huggingface.co/docs/transformers/ja/chat_templating (okunma tarihi 2026-11-19)
- [K14] Transformers docs (ja) — generation_strategies ("生成戦略") — https://huggingface.co/docs/transformers/ja/generation_strategies (okunma tarihi 2026-11-19)
- [K15] Transformers docs (ja) — model_memory_anatomy ("GPU メモリ使用量") — https://huggingface.co/docs/transformers/ja/model_memory_anatomy (okunma tarihi 2026-11-19)
- [K16] Transformers docs (ja) — perf_train_gpu_many ("並列化手法") — https://huggingface.co/docs/transformers/ja/perf_train_gpu_many (okunma tarihi 2026-11-19)
- [K17] Transformers docs (ja) — peft ("パラメータ効率の良いファインチューニング") — https://huggingface.co/docs/transformers/ja/peft (okunma tarihi 2026-11-19)
- [K18] Transformers docs (ja) — training ("ファインチューニング") — https://huggingface.co/docs/transformers/ja/training (okunma tarihi 2026-11-19)
- [K19] Transformers docs (ja) — main_classes/quantization ("量子化") — https://huggingface.co/docs/transformers/ja/main_classes/quantization (okunma tarihi 2026-11-19)
- [K20] Transformers docs (ja) — tasks/prompting ("プロンプトエンジニアリング") — https://huggingface.co/docs/transformers/ja/tasks/prompting (okunma tarihi 2026-11-19)
- [K21] Transformers docs (ja) — tokenizer_summary ("トークナイズアルゴリズム") — https://huggingface.co/docs/transformers/ja/tokenizer_summary (okunma tarihi 2026-11-19)
- [K22] Transformers docs (ja) — main_classes/text_generation ("生成") — https://huggingface.co/docs/transformers/ja/main_classes/text_generation (okunma tarihi 2026-11-19)
- [K23] HF Hub docs (ja) — models-gated ("ゲート付きモデル") — https://huggingface.co/docs/hub/ja/models-gated (okunma tarihi 2026-11-19)
- [K24] HF Hub docs (ja) — model-cards ("モデルカード") — https://huggingface.co/docs/hub/ja/model-cards (okunma tarihi 2026-11-19)
- [K25] HF Hub docs (ja) — local-apps ("AIモデルをローカルで利用する") — https://huggingface.co/docs/hub/ja/local-apps (okunma tarihi 2026-11-19)
- [K26] HF Hub docs (ja) — hardware ("ハードウェア") — https://huggingface.co/docs/hub/ja/hardware (okunma tarihi 2026-11-19)

Google (ja)
- [K27] Google — 機械学習の用語集 — https://developers.google.com/machine-learning/glossary?hl=ja (okunma tarihi 2026-11-19)
- [K28] Google MLCC — 大規模言語モデルの概要 — https://developers.google.com/machine-learning/crash-course/llm?hl=ja (okunma tarihi 2026-11-19)
- [K29] Google MLCC — LLM: 大規模言語モデルとは何でしょうか。 — https://developers.google.com/machine-learning/crash-course/llm/transformers?hl=ja (okunma tarihi 2026-11-19)
- [K30] Google Cloud GKE — GKE での推論に関するベスト プラクティスの概要 — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference?hl=ja (okunma tarihi 2026-11-19)
- [K31] Google Cloud GKE — GPU を使用して大規模言語モデルの推論を最適化する際のベスト プラクティス — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference/llm-optimization?hl=ja (okunma tarihi 2026-11-19)
- [K32] Google Cloud GKE — GKE での AI/ML モデル推論について — https://docs.cloud.google.com/kubernetes-engine/docs/concepts/machine-learning/inference?hl=ja (okunma tarihi 2026-11-19)
- [K33] Google Cloud GKE — GKE Inference Quickstart を使用してモデル提供のパフォーマンスと費用を分析する — https://docs.cloud.google.com/kubernetes-engine/docs/how-to/machine-learning/inference/inference-quickstart?hl=ja (okunma tarihi 2026-11-19)
- [K34] Google Cloud GKE — llm-d を搭載した GKE Inference Gateway について — https://docs.cloud.google.com/kubernetes-engine/docs/concepts/about-gke-inference-gateway?hl=ja (okunma tarihi 2026-11-19)
- [K35] Google Cloud GKE — GKE の GPU で vLLM を使用して Gemma オープンモデルを提供する — https://docs.cloud.google.com/kubernetes-engine/docs/tutorials/serve-gemma-gpu-vllm?hl=ja (okunma tarihi 2026-11-19)
- [K36] Google Cloud — AI アクセラレータのパフォーマンスとベンチマーク — https://docs.cloud.google.com/docs/ai-ml/accelerator-performance-benchmarking?hl=ja (okunma tarihi 2026-11-19)
- [K37] Google Cloud Compute Engine — GPU マシンタイプ — https://docs.cloud.google.com/compute/docs/gpus?hl=ja (okunma tarihi 2026-11-19)
- [K38] Google Cloud — チューニングの概要 — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning?hl=ja (okunma tarihi 2026-11-19)
- [K39] Google Cloud — パラメータ値を試す — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/adjust-parameter-values?hl=ja (okunma tarihi 2026-11-19)
- [K40] Google Cloud Observability — サービスのモニタリングにおけるコンセプト (SLO) — https://docs.cloud.google.com/stackdriver/docs/solutions/slo-monitoring?hl=ja (okunma tarihi 2026-11-19)

Microsoft Learn (ja-jp)
- [K41] Microsoft Learn — トークンについて (.NET) — https://learn.microsoft.com/ja-jp/dotnet/ai/conceptual/understanding-tokens (okunma tarihi 2026-11-19)
- [K42] Microsoft Learn — Azure OpenAI のパフォーマンスと待機時間 — https://learn.microsoft.com/ja-jp/azure/foundry/openai/how-to/latency (okunma tarihi 2026-11-19)
- [K43] Microsoft Learn — Foundry モデルのプロビジョニング済みスループット — https://learn.microsoft.com/ja-jp/azure/foundry/openai/concepts/provisioned-throughput (okunma tarihi 2026-11-19)
- [K44] Microsoft Learn — 迅速なエンジニアリング手法 (prompt engineering) — https://learn.microsoft.com/ja-jp/azure/foundry/openai/concepts/prompt-engineering (okunma tarihi 2026-11-19)
- [K45] Microsoft Learn — 教師ありファインチューニングを使用してモデルを微調整する — https://learn.microsoft.com/ja-jp/azure/foundry/openai/how-to/fine-tuning (okunma tarihi 2026-11-19)
- [K46] Microsoft Learn — Foundry Local とは — https://learn.microsoft.com/ja-jp/azure/foundry-local/what-is-foundry-local (okunma tarihi 2026-11-19)
- [K47] Microsoft Learn — AI ツールチェーン オペレーター アドオン (AKS, KAITO) — https://learn.microsoft.com/ja-jp/azure/aks/ai-toolchain-operator (okunma tarihi 2026-11-19)
- [K48] Microsoft Learn — Azure Databricks, モデル サービスを使用してモデルをデプロイする — https://learn.microsoft.com/ja-jp/azure/databricks/machine-learning/model-serving/ (okunma tarihi 2026-11-19)
- [K49] Microsoft Learn — Well-Architected, 容量計画のためのアーキテクチャ戦略 — https://learn.microsoft.com/ja-jp/azure/well-architected/performance-efficiency/capacity-planning (okunma tarihi 2026-11-19)
- [K50] Microsoft Learn — Visual Studio, パフォーマンス プロファイラーで GPU 使用率ツールを使用する — https://learn.microsoft.com/ja-jp/visualstudio/profiling/gpu-usage?view=visualstudio (okunma tarihi 2026-11-19)
- [K51] Microsoft Learn — Azure Cosmos DB, Cost Estimator を使用してコストを見積もる (eski adı Capacity Planner) — https://learn.microsoft.com/ja-jp/azure/cosmos-db/estimate-ru-with-capacity-planner (okunma tarihi 2026-11-19)
- [K52] Microsoft — Japanese Localization Style Guide (PDF, 71 sayfa; yalnız kural kaynağı) — https://aka.ms/japanese-styleguide → https://download.microsoft.com/download/bb82f407-78f4-4df4-accd-d63ceaadd24a/jpn-jpn-StyleGuide.pdf (okunma tarihi 2026-11-19)

NVIDIA
- [K53] NVIDIA (ja-jp) — H100 — https://www.nvidia.com/ja-jp/data-center/h100/ (okunma tarihi 2026-11-19)
- [K54] NVIDIA (ja-jp) — H200 — https://www.nvidia.com/ja-jp/data-center/h200/ (okunma tarihi 2026-11-19)
- [K55] NVIDIA (ja-jp) — DGX Spark — https://www.nvidia.com/ja-jp/products/workstations/dgx-spark/ (okunma tarihi 2026-11-19)
- [K56] NVIDIA (ja-jp) — GeForce RTX 5090 — https://www.nvidia.com/ja-jp/geforce/graphics-cards/50-series/rtx-5090/ (okunma tarihi 2026-11-19)
- [K57] NVIDIA (ja-jp) — マルチインスタンス GPU (MIG) — https://www.nvidia.com/ja-jp/technologies/multi-instance-gpu/ (okunma tarihi 2026-11-19)
- [K58] NVIDIA (ja-jp) — Dynamo — https://www.nvidia.com/ja-jp/ai/dynamo/ (okunma tarihi 2026-11-19)
- [K59] NVIDIA (ja-jp) — Tensor コア — https://www.nvidia.com/ja-jp/data-center/tensor-cores/ (okunma tarihi 2026-11-19)
- [K60] NVIDIA Glossary (ja-jp) — AI 推論とは? — https://www.nvidia.com/ja-jp/glossary/ai-inference/ (okunma tarihi 2026-11-19)
- [K61] NVIDIA Glossary (ja-jp) — 大規模言語モデルとは? — https://www.nvidia.com/ja-jp/glossary/large-language-models/ (okunma tarihi 2026-11-19)
- [K62] NVIDIA 技術ブログ — LLM テクニックの習得: 推論の最適化 — https://developer.nvidia.com/ja-jp/blog/mastering-llm-techniques-inference-optimization/ (okunma tarihi 2026-11-19)
- [K63] NVIDIA 技術ブログ — LLM テクニックの習得: トレーニング — https://developer.nvidia.com/ja-jp/blog/mastering-llm-techniques-training/ (okunma tarihi 2026-11-19)
- [K64] NVIDIA 技術ブログ — LLM アーキテクチャにおける Mixture of Experts の適用 — https://developer.nvidia.com/ja-jp/blog/applying-mixture-of-experts-in-llm-architectures/ (okunma tarihi 2026-11-19)
- [K65] NVIDIA 技術ブログ — NVIDIA NIM で LoRA アダプター群をシームレスにデプロイ — https://developer.nvidia.com/ja-jp/blog/seamlessly-deploying-a-swarm-of-lora-adapters-with-nvidia-nim/ (okunma tarihi 2026-11-19)
- [K66] NVIDIA 技術ブログ — GH200 Superchip が、Llama モデルとのマルチターン インタラクションの推論を 2 倍高速化 — https://developer.nvidia.com/ja-jp/blog/nvidia-gh200-superchip-accelerates-inference-by-2x-in-multiturn-interactions-with-llama-models/ (okunma tarihi 2026-11-19)
- [K67] NVIDIA 技術ブログ — NVIDIA Nemotron 3 の内部 — https://developer.nvidia.com/ja-jp/blog/inside-nvidia-nemotron-3-techniques-tools-and-data-that-make-it-efficient-and-accurate/ (okunma tarihi 2026-11-19)

AWS (ja_jp)
- [K68] Amazon Bedrock — 推論パラメータでレスポンスの生成に影響を与える — https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/inference-parameters.html (okunma tarihi 2026-11-19)
- [K69] Amazon Bedrock — 主要な用語 — https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/key-definitions.html (okunma tarihi 2026-11-19)
- [K70] Amazon SageMaker AI — モデルに対する推論の最適化 — https://docs.aws.amazon.com/ja_jp/sagemaker/latest/dg/model-optimize.html (okunma tarihi 2026-11-19)
- [K71] Amazon SageMaker AI — モデル並列処理の概要 — https://docs.aws.amazon.com/ja_jp/sagemaker/latest/dg/model-parallel-intro.html (okunma tarihi 2026-11-19)
- [K72] Amazon SageMaker AI — テンソル並列性 — https://docs.aws.amazon.com/ja_jp/sagemaker/latest/dg/model-parallel-core-features-v2-tensor-parallelism.html (okunma tarihi 2026-11-19)
- [K73] Amazon SageMaker AI — 分散トレーニング — https://docs.aws.amazon.com/ja_jp/sagemaker/latest/dg/distributed-training.html (okunma tarihi 2026-11-19)

Apple, AMD
- [K74] Apple（日本）— MacBook Pro 仕様 — https://www.apple.com/jp/macbook-pro/specs/ (→ https://www.apple.com/jp/macbook-pro/liquid-retina-xdr-display/specs/) (okunma tarihi 2026-11-19)
- [K75] Apple（日本）— Mac Studio 仕様 — https://www.apple.com/jp/mac-studio/specs/ (okunma tarihi 2026-11-19)
- [K76] AMD (ja) — Ryzen AI Max+ 395 — https://www.amd.com/ja/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html (okunma tarihi 2026-11-19)

Resmî yazım kuralları (Bunka-chō, yalnız kural kaynağı). Kapsam: "科学，技術，芸術その他の各種専門分野や個々人の表記にまで及ぼそうとするものではない" (K77); "分野によって異なる慣用が定まっている場合には,それぞれの慣用によって差し支えない" (K78). Bu yüzden terim yazımında derlemdeki teknik kullanım önce gelir, resmî kural eşitlikte belirler.
- [K77] 文化庁 — 外来語の表記, 前書き — https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gairai/maegaki.html (okunma tarihi 2026-11-19)
- [K78] 文化庁 — 外来語の表記, 留意事項その1 (原則的な事項) — https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gairai/honbun02.html (okunma tarihi 2026-11-19)
- [K79] 文化庁 — 外来語の表記, 留意事項その2 (細則的な事項; Ⅲ 長音) — https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gairai/honbun06.html (okunma tarihi 2026-11-19)
- [K80] 文化審議会 — 公用文作成の考え方 (建議, 令和4年1月7日, PDF) — https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93651301_01.pdf (okunma tarihi 2026-11-19)

Japoncası olmayan ya da açılamayan kaynaklar
- HF LLM Course bölüm 3, 5, 6, 9–12: Japonca sürüm yok. HF Agents Course (ja): 404.
- Transformers (ja): big_models, attention, perf_infer_gpu_one, perf_train_gpu_one ve perf_hardware Japonca değil (İngilizce sayfaya yönleniyor ya da yok).
- NVIDIA ja sözlüğü mixture-of-experts maddesi: 404. NVIDIA ja blogunda LLM benchmarking, speculative decoding, KV cache reuse, NVFP4 KV cache, Dynamo, GPU boyutlandırma, cuDNN ve FlashAttention yazılarının Japonca adresleri 404; blog araması sonuç vermedi.
- AWS SageMaker LMI sayfaları kısa dizin sayfasıydı; derlemden çıkarıldı. İndirilen 19 sayfa daha az bilgi verdiği için derlemden çıkarıldı (ör. Transformers model_sharing, pipeline_webserver; GKE GPU ve TPU sayfaları; NVIDIA L4).
- Apple `/jp/macbook-pro/specs/` adresi `/jp/macbook-pro/liquid-retina-xdr-display/specs/` sayfasına yönleniyor; yönlenilen sayfa okundu (K74).

## Terimler

Sayım yöntemi (kural 5): 75 sayfalık terim derleminde biçimi o anlamda kullanan sayfa sayısı. Fark 1 sayfa ya da daha azsa eşit sayıldı; o zaman biçimi kullanan yayıncı sayısı (Hugging Face, Google, Microsoft, NVIDIA, AWS, Apple, AMD), o da eşitse geçiş sayısı belirledi. Notlardaki "X / Y sayfa" bu sayımdır. Uzun ünlü işaretli ve işaretsiz yazım (パラメータ / パラメーター) ayrı biçim sayıldı; tam eşitlikte resmî kural (K79, K80: ー ile) belirlerdi. Metin Unicode NFC'ye çevrildi, bölünmez boşluk düz boşluk sayıldı, sıfır genişlikli karakterler (Apple sayfalarında U+FEFF) silindi; Japonca biçim alt dize olarak arandı, boşluklu ve boşluksuz yazım ayrı biçimdir. Ana içerik: Hugging Face'te `prose-doc` bloğu, Google'da `devsite-article-body`, AWS'de `main-col-body`, ötekilerde `<main>`; menü (`nav`), altbilgi, form, düğme öğeleri ve kod blokları sayılmadı. NVIDIA ürün sayfalarında `<main>` içinde site menüsünün bir parçası da var ("最新情報とイベント" gibi); ayrıca ayıklanmadı. Anlam ayıklama örnekleri tablo notlarında.

| EN | ja | Kaynak | Not / alternatif |
|---|---|---|---|
| GPU memory | GPU メモリ | K15, K37, K53, K66 | 15 / 2 / 1 sayfa. K15 başlığı "GPU メモリ使用量" (K15). Alternatif: "GPU のメモリ" (K62, K71); bitişik "GPUメモリ" yalnız K15'te, aynı sayfada boşluklu biçim de var. |
| VRAM | VRAM | K26, K30, K31 | Kısaltma, çevrilmez: "モデルに必要な VRAM の量" (K30), "VRAM、RAM、または統合メモリ" (K26). 4 sayfa; Japonca rakip biçim yok. |
| weights / model weights | 重み / モデルの重み | K27, K30, K62, K10 | 32 / 4 sayfa. "モデルの重み" 18 sayfa. Alternatif: "ウェイト" (K19, K31, K36). Apple sayfalarındaki "重量" cihaz ağırlığı, ayrı kelime. |
| KV cache | KV キャッシュ | K30, K62, K66 | 11 / 2 sayfa. Alternatif: bitişik "KVキャッシュ" (K14, K22), "Key-Value キャッシュ" (K66); Japonca metin içinde İngilizce "KV cache" (K30, K58). |
| overhead | オーバーヘッド | K30, K15, K62 | 12 sayfa; rakip biçim bulunmadı. "推論エンジンのオーバーヘッド" (K30), "データ転送のオーバーヘッド" (K30). |
| activations | アクティベーション | K15, K62, K71 | 12 / 5 sayfa ("活性化関数" sayılmadı). "中間アクティベーション" (K30, K15, K18). Alternatif: "活性化" (K19, K32; "重みと活性化", K32). |
| parameters | パラメータ | K27, K15, K68 | 34 / 16 sayfa. Alternatif: "パラメーター" (K45, K44, K42; Microsoft'un 5 sayfası ve NVIDIA'nın 9 sayfası bu biçimde). K52 ve K80 -er ekinde ー istiyor (Yazım kuralları); sayım karşı yönde. Büyük sayı: "総パラメーター 300 億" (K67). |
| active parameters | アクティブ パラメーター | K67 | Tek kaynak: "アクティブ パラメーター数 30 億" (K67). パラメータ seçimiyle tutarlı olsun diye sitede "アクティブ パラメータ" yazılabilir; bu yazım derlemde geçmiyor (uzun ünlü uyarlaması, karar dil sahibinin). |
| unified memory | 統合メモリ | K26, K55 | 2 / 2 sayfa → eşit; yayıncı 2 / 1 → 統合メモリ. "128 GB の統合メモリ" (K55). Alternatif: Apple'ın ürün etiketi "ユニファイドメモリ" (K74, K75; "16GBユニファイドメモリ", K74); "統合システム メモリ" (K55); "統一メモリ" (K26). Apple Silicon bağlamında okur Apple'ın biçimini tanır. |
| memory bandwidth | メモリ帯域幅 | K53, K54, K74, K36 | 9 sayfa; rakip biçim bulunmadı. "最大170GB/sのメモリ帯域幅" (K74). NVIDIA birimi Japonca yazıyor: "273 GB/秒" (K55), "4.8TB/秒" (K54); site GB/s etiketini korur. |
| precision | 精度 | K62, K53, K30 | "16 ビット精度" (K62), "FP8 精度" (K53). Dikkat: K27 accuracy metriğini de 精度 diye veriyor ("88% の精度", K27) ve precision metriği için "適合率" (K27) kullanıyor; doğruluk metriği bağlamında karışabilir. "混合精度" 9 sayfa. |
| quantization | 量子化 | K19, K31, K30 | 20 sayfa; rakip biçim bulunmadı. |
| quantized | 量子化された / 量子化モデル | K19, K30, K25 | 5 / 4 sayfa. "量子化されたモデル" (K30, K70), "量子化モデル（AWQ、GPTQ）" (K25). |
| checkpoint | チェックポイント | K4, K18, K38 | 19 sayfa; rakip biçim bulunmadı. |
| token | トークン | K41, K5, K27 | 48 sayfa; rakip biçim bulunmadı. Sayıyla: "1,500 トークン" (K30). |
| tokenizer | トークナイザー | K11, K6, K63 | 16 / 6 sayfa. Alternatif: "トークナイザ" (K5, K3, K4; HF LLM Course, K5'in başlığı). |
| vocabulary | 語彙 | K5, K21, K41 | 15 / 2 sayfa. "語彙サイズ" (K10, K21). Alternatif: "ボキャブラリ" (K41, K72). |
| embedding | 埋め込み | K11, K41, K63 | 17 / 5 sayfa. Alternatif: "エンベディング" (K27, K29; Google). |
| layer | 層 | K2, K11, K62, K64 | Sinir ağı katmanı anlamında 層 14 / レイヤー 15 / レイヤ 6 sayfa ("セキュリティ層" (K48), "クライアント層" (K42), "ストレージ層" (K58) ve K23'teki erişim denetimi レイヤー sayılmadı) → 層 ile レイヤー eşit; yayıncı 4 / 4; geçiş 144 / 89 → 層. Uzun ünlü varyantları tek kelime sayılsaydı katakana 19 sayfayla önde olurdu; fark küçük, karar dil sahibinin. "アテンション層" (K2, K63), "32 層の Transformer" (K64). Alternatif: "レイヤー" (K71, K64, K16), "レイヤ" (K27, K29; Google). |
| hidden size | hidden size | K15, K3 | İngilizce bırakıldı: "Hidden size: 各モデル入力のベクトル次元。" (K3), "hidden size に応じて変化します" (K15). 2 / 1 sayfa → eşit; yayıncı 1 / 1; geçiş 4 / 1. Alternatif: "隠れサイズ" (K11). |
| attention | アテンション | K2, K29, K62 | 23 / 3 sayfa. Alternatif: "注意機構" (K11, K22, K29). Self-attention: "セルフ アテンション" (K29, K31) 8 sayfa / "自己注意" (K11, K27) 4 sayfa. |
| attention head | アテンション ヘッド | K29, K62, K36 | 4 / 1 sayfa. "8 つの並列アテンション ヘッド" (K62). Alternatif: bitişik "アテンションヘッド" (K10). |
| head dimension | ヘッド ディメンション | K36 | Tek kaynak, Google makine çevirisi: "ヘッド ディメンション 64" (K36). Aynı sayfada "ヘッドのディメンション" (K36) de var. |
| MHA / GQA / MQA / MLA | マルチヘッド アテンション / グループ クエリ アテンション / マルチクエリ アテンション | K62, K63 | Kısaltmalar çevrilmez (kural 4); hücredeki biçimler açılım. MHA 2 sayfa (K62, K63). GQA: "グループ クエリ アテンション" (K63) ile "グループ化クエリ アテンション" (K62) 1 / 1 sayfa, ikisi de NVIDIA, geçiş 2 / 1. MQA 2 sayfa (K62, K63). MLA'nın açılımı derlemde yok (İngilizce kalanlar). |
| query / key / value | クエリ / キー / 値 | K63, K27 | "クエリ (Q)、キー (K)、および値 (V)" (K63); "「クエリ」、「キー」、「値」" (K27). |
| feed-forward (layer) | フィードフォワード層 | K11 | "2 つのフィードフォワード層" (K11). 1 sayfa. Alternatif: "Feed-Forward 層" (K61), "フィードフォワード ニューラル ネットワーク" (K27). |
| MoE (mixture of experts) | MoE / Mixture of Experts | K64, K36, K53 | Açılım İngilizce kalıyor: "Mixture of Experts (MoE)" (K64, K53, K63), "Mixture of Experts（MoE）" (K36); İngilizce açılım 6 sayfa / "混合エキスパート (MoE)" (K59) 2 sayfa (K58, K59). Tireli yazım "Mixture-of-Experts (MoE)" (K67). |
| expert | エキスパート | K64, K27, K63 | 7 sayfa ("専門家" insan uzman anlamında, sayılmadı). Sayıyla: "8 つのエキスパート" (K64). |
| dense (model) | 密モデル | K64 | 1 / 1 / 1 sayfa → eşit; yayıncı 1 / 1 / 1; geçiş 8 / 6 / 1 → 密モデル. "完全な密モデル" (K64); karşıtı "疎 MoE" (K64). Alternatif: "高密度" (K36, tablo hücresi), "密なモデル" (K63). |
| sliding window attention | sliding window attention | — | Kaynak yok: "スライディング" 0 sayfa (İngilizce kalanlar). |
| RoPE | RoPE / ロータリー位置埋め込み | K63 | Kısaltma çevrilmez. Açılım tek kaynakta, makale adının çevirisinde: "ロータリー位置埋め込み" (K63). |
| logits | ロジット | K27, K8, K62 | 4 sayfa; rakip biçim bulunmadı. |
| inference | 推論 | K60, K30, K27 | 49 sayfa. Dikkat: NVIDIA 推論'yu reasoning için de kullanıyor: "精度の高い推論向け Transformer レイヤー" (K67). |
| serving / serve | サービング / モデルを提供する | K32, K31, K35 | İsim: "サービング" 15 sayfa; "分散サービング" (K58), "LLM サービング最適化手法の概要" (K31). Fiil: "モデルを提供" 9 / "サービングする" 2 sayfa; "Gemma オープンモデルを提供する" (K35, K31, K32). Alternatif: "モデル サービス" (K48). "モデルをデプロイ" (14 sayfa) deploy'un karşılığı, ayrı terim. |
| inference engine | 推論エンジン | K9, K30, K47 | 8 sayfa. "推論エンジン（vLLM、SGLang、TGI など）" (K9). "推論サーバー" (K30, K58) inference server, ayrı terim. |
| context | コンテキスト | K28, K27 | 26 sayfa. "文脈" 11 sayfa, genel "bağlam" anlamında. |
| context window | コンテキスト ウィンドウ | K35, K27, K41, K67 | 4 sayfa; bitişik yazım 0. |
| context length | コンテキスト長 | K67, K8, K72 | 3 / 3 sayfa → eşit; yayıncı 3 / 1 → コンテキスト長. "最大 100 万 トークンのコンテキスト長" (K67). Alternatif: "コンテキストの長さ" (K30, K31, K32; yalnız Google). |
| concurrent users | 同時ユーザー | K36, K49, K65 | 3 / 1 sayfa. "同時ユーザー数" (K49). Alternatif: "同時実行ユーザー" (K46). |
| concurrent requests | 同時リクエスト | K36, K30, K42 | 3 / 2 sayfa → eşit; yayıncı 2 / 1 → 同時リクエスト. "同時リクエスト数" (K36, K30, K42). Alternatif: "同時要求" (K42, K46). |
| prompt | プロンプト | K20, K44, K27 | 32 sayfa; rakip biçim bulunmadı. K20 başlığı "プロンプトエンジニアリング". |
| prefill | プリフィル | K13, K58, K60, K33 | 6 / 3 sayfa. "プリフィルとデコードのフェーズ" (K58). Alternatif: "プレフィル" (K62, K36, K32). |
| decode | デコード | K58, K60, K62 | Aşama anlamında 17 sayfa (Apple ve AMD'deki video "デコード" sayılmadı). "デコード フェーズ" (K62). "decoding" ismi Hugging Face'te "デコーディング" (8 sayfa): "デコーディング戦略" (K14). |
| batch | バッチ | K27, K62, K73 | 36 sayfa; rakip biçim bulunmadı. |
| batch size | バッチサイズ | K27, K73, K30 | 14 / 4 sayfa. Alternatif: "バッチ サイズ" (K62, K45); K52'nin bileşik katakana kuralı bu biçimi verir (Yazım kuralları). |
| throughput | スループット | K42, K43, K30 | 30 sayfa. Provisioned throughput: "プロビジョニング済みスループット" (K43). |
| latency | レイテンシ | K30, K33, K60 | 16 sayfa / "遅延" 13 / "待機時間" 6 / "レイテンシー" 4. Alternatif: "遅延" (K58, K65), "待機時間" (K42; Microsoft), "レイテンシー" (K70). |
| TTFT | 最初のトークンまでの時間（TTFT） | K32, K34 | Kısaltma çevrilmez. 3 / 2 sayfa. NVIDIA yarım genişlik parantez kullanıyor: "最初のトークンまでの時間 (TTFT)" (K60). Alternatif: "ファースト トークンまでの時間（TTFT）" (K36, K33). |
| tokens per second | 1 秒あたりのトークン数 | K32, K36, K66 | 3 sayfa. "1 秒あたりのトークン数（TPS）" (K36). Birim kısaltması "tokens/s" (K33). |
| requests per second | 1 秒あたりのリクエスト数 | K30, K32 | "1 秒あたりのリクエスト数（RPS）" (K30). 2 sayfa, yalnız Google. |
| sampling | サンプリング | K14, K22, K27 | 11 sayfa; rakip biçim bulunmadı. |
| temperature | 温度 | K27, K39, K68, K44 | LLM parametresi anlamında 4 sayfa (K56, K74, K75 ve K76'daki donanım sıcaklığı sayılmadı). Kod parametresi adı `temperature` değişmez. |
| chat template | チャットテンプレート | K13, K12, K25 | 4 sayfa, yalnız Hugging Face; rakip biçim bulunmadı. |
| speculative decoding | 投機的デコーディング | K60, K70 | 2 / 2 sayfa, yayıncı 2 / 2 (AWS, NVIDIA), geçiş 2 / 2 → tam eşit. "decoding" ismi derlemde デコーディング olduğu için (decode satırı) bu biçim seçildi. Alternatif: "投機的デコード" (K70, K67), "投機的推論" (K62). |
| MTP | マルチトークン予測 | K67 | Kısaltma çevrilmez: "マルチトークン予測 (MTP" (K67). Tek kaynak. |
| CUDA graphs | CUDA グラフ | K22 | Tek sayfa; aynı sayfada bitişik "CUDAグラフ" (K22) da bir kez geçiyor. CUDA kısaltma, çevrilmez. |
| profiling | プロファイリング | K50, K57, K65 | 3 sayfa; Hugging Face sayfalarında karşılık bulunamadı. |
| tensor parallelism | テンソル並列 | K16, K31, K62, K63 | Satır, pipeline ve data parallelism ile bir aile olarak sayıldı: yalın "…並列" 8 sayfa / "…並列処理" 9 / "…並列化" 4 / "…並列性" 3 → yalın ile 並列処理 eşit; yayıncı 4 / 3 → yalın. Terim tek başına: 5 / 6 / 3 / 3 sayfa (eşit; yayıncı 3 / 2). Alternatif: "テンソル並列処理" (K30, K31, K71; Google, AWS), "テンソル並列化" (K62, K11), "テンソル並列性" (K72 başlığı). |
| pipeline parallelism | パイプライン並列 | K16, K71 | Aile kararı (yukarıda). Tek başına 2 / 3 / 3 / 1 sayfa. Alternatif: "パイプライン並列処理" (K30, K71), "パイプライン並列化" (K62, K63). |
| data parallelism | データ並列 | K16, K73, K71 | Aile kararı. Tek başına 5 / 4 / 3 / 1 sayfa. Alternatif: "データ並列処理" (K27, K71). |
| expert parallelism | エキスパート並列 | — | BİRLEŞTİRME: derlemde yok ("エキスパート…並列" 0 sayfa); "エキスパート" (K64) ile aile kararı "…並列" birleştirildi. İnceleyen onaylamazsa İngilizce "expert parallelism" kalır. |
| replica | レプリカ | K33, K73, K32 | 10 sayfa ("複製" 6 sayfa, genel kopya anlamında). "モデルレプリカ" (K73, K71, K34). Alternatif: "モデル レプリカ" (K63). |
| capacity planning | 容量計画 | K49, K30 | 2 / 2 sayfa, yayıncı 2 / 2, geçiş 15 / 11 → 容量計画. K49 başlığı "容量計画のためのアーキテクチャ戦略" (K49). Alternatif: "キャパシティ プランニング" (K49, K30). |
| SLO | サービスレベル目標（SLO） | K30, K40 | Kısaltma çevrilmez. 2 sayfa, yalnız Google. |
| fine-tuning | ファインチューニング | K18, K17, K38, K65 | 30 / 8 / 3 sayfa. K18 başlığı "ファインチューニング". Alternatif: "微調整" (K8, K45; K8 başlığı "マスク言語モデルの微調整"), "ファイン チューニング" (K27, K37, K34). |
| instruction tuning / instruction-tuned (instruct) model | 指示チューニング / 指示チューニング済みモデル | K27, K35, K30, K20 | 6 sayfa. "指示チューニング済み LLM" (K20); "指示チューニングされたモデル" (K27). Alternatif: "インストラクションチューニング済みモデル" (K20; aynı sayfada 指示チューニング済み de var). |
| full fine-tuning | フル ファインチューニング | K38, K27 | 2 / 1 / 1 sayfa → eşit; yayıncı 1 / 1 / 1; geçiş 9 / 1 / 1. Google makine çevirisi. Alternatif: "フルファインチューニング" (K65), "完全なファインチューニング" (K27). |
| LoRA | LoRA | K65, K17 | Kısaltma çevrilmez; açılım İngilizce: "Low-rank adaptation (LoRA)" (K65), "Low-Rank Adaptability（LoRA）" (K27). |
| QLoRA | QLoRA | K17 | "QLoRA（量子化されたベースモデル + LoRA）" (K17). |
| rank | ランク | K17, K65 | "ランク 8" (K17), "低ランク" (K65). Dikkat: süreç sırası anlamında da kullanılıyor: "データ並列ランク" (K16, K71). |
| adapter | アダプター | K17, K65 | Apple'daki güç adaptörü hariç 5 / 5 sayfa → eşit; yayıncı 2 / 2; geçiş 75 / 20 → アダプター. "LoRA アダプター" (K65). Alternatif: "LoRA アダプタ" (K34; Google). |
| gradient checkpointing | gradient checkpointing | K15 | İngilizce bırakıldı: "Gradient checkpointingガイド" (K15); "勾配チェックポイント" 0 sayfa. |
| optimizer | オプティマイザー | K15, K16, K18, K27 | 9 / 4 sayfa. "オプティマイザーの状態" (K63). Alternatif: "オプティマイザ" (K71, K16). Adam adı değişmez. |
| sequence length | シーケンス長 | K15, K19, K62, K63 | 7 / 5 sayfa. "最大シーケンス長" (K19, K62). Alternatif: "シーケンスの長さ" (K11, K27, K62). |
| GPU | GPU | K37, K53 | Kısaltma, çevrilmez. Sayıyla "基": "GPU を 4 基" (K54), "最大8基のGPU" (K54); Sayı sözcükleri bölümü. |
| graphics card | グラフィックス カード | K56 | 1 sayfa. K56'nın sayfa başlığı (`<title>`) bitişik yazıyor; ana metinde boşluklu. |
| card | カード | K56 | "カードの寸法" (K56). Dikkat: "モデルカード" (model card) ve Apple'ın "SDXCカード" (K74) ile çakışır; GPU anlamı açık değilse "GPU" yazmak daha güvenli. |
| tensor throughput (TFLOPS) | FP16 Tensor コア / Tensor コア | K53, K54, K59 | NVIDIA tablo etiketi "FP16 Tensor コア" (K53, K54). "Tensor コア" 7 sayfa. TFLOPS kısaltma, çevrilmez; K53 "teraFLOPS" (K53) yazıyor. |
| sparsity | スパース性 / 疎性あり | K37, K27, K53, K54 | スパース性 3 / 疎性 2 sayfa → eşit; yayıncı 2 / 1 → スパース性. NVIDIA veri sayfası dipnotu "with sparsity": "* 疎性あり" (K53), "2 疎性あり" (K54). Alternatif: "スパーシティ" (K62). Terim ile dipnot farklı kökte; tek kök istenirse "スパース性あり" yazılabilir (kaynakta yok). |
| 2:4 structured sparsity | 構造化スパース性 | K37 | Aynı sayfada "構造的スパース性" (K37) de var; 1 / 1 sayfa, geçiş 2 / 2 → eşit. Belirtilen değerlerin koşulunu anlatan cümlede geçen biçim seçildi: "記載されている値は、構造化スパース性を使用する場合に適用されます" (K37). "2:4" öneki EN'den. |
| datasheet | データシート | K53, K54, K55 | "NVIDIA H100 データシートを読む" (K53). |
| form factor | フォーム ファクター | K53, K54, K55, K76 | Tablo etiketi; değerler SXM / PCIe. 4 sayfa. |
| MIG | マルチインスタンス GPU | K57, K53, K54, K30 | Kısaltma çevrilmez: "マルチインスタンス GPU (MIG)" (K57). Sayıyla "各 12GB の最大 7 個の MIG" (K53). |
| repository | リポジトリ | K6, K23, K14 | 18 / 2 sayfa. Alternatif: "レポジトリ" (K6, K8). |
| model card | モデルカード | K7, K24, K25 | 8 / 1 sayfa; Hub başlığı "モデルカード" (K24). Alternatif: "モデル カード" (K62). |
| config / config.json | 設定ファイル / 設定 | K10, K22, K6, K11 | config.json dosya adı, değişmez. "設定ファイル" 4 / "構成ファイル" 2 sayfa (K27, K62). "設定ファイルのモデル属性" (K10). Google "構成"u Kubernetes yapılandırması için de kullanıyor. |
| open weights | オープンウェイト モデル | K36 | Tek kaynak, Google makine çevirisi: "OpenAI の gpt-oss-120B オープンウェイト モデル" (K36). "オープンモデル" (K35, K67) open model'in karşılığı, ayrı terim. |
| LLM | 大規模言語モデル（LLM） | K29, K12, K20 | 32 / 3 sayfa ("大規模な言語モデル", K47, K61, K42). NVIDIA yarım genişlik parantezle: "大規模言語モデル (LLM)" (K59, K61). Kısaltma çevrilmez. |
| calculator | 計算ツール | K43, K42 | "容量計算ツール" (K43), "デプロイ容量計算ツール" (K42). 2 / 1 sayfa. Alternatif: "コスト見積もりツール" (K51). |
| gated model | ゲート付きモデル | K23, K33 | Hub başlığı "ゲート付きモデル" (K23). 2 sayfa. |
| headroom | 空き容量 | K34, K30 | "空き容量があるサーバー" (K34), "KV キャッシュの空き容量" (K30). 2 sayfa, yalnız Google. "バッファ" (5 sayfa) çoğunlukla tampon anlamında, kullanılmadı. |
| fit (in memory) | 収まる / 収まらない | K30, K16 | 収まる 6 sayfa, 収まらない 7 sayfa. "最大サイズのモデルレイヤーが収まらない" (K16). |

### Site sayfa ve araç adları

Sayfa ve araç adlarının çoğu kaynakta yok; kaynaklı parçalardan kurulan öneriler BİRLEŞTİRME diye işaretli. İnceleyen onaylamazsa İngilizce ad kalır.

| EN | ja | Kaynak | Not / alternatif |
|---|---|---|---|
| VRAM calculator | VRAM 計算ツール | K43, K42 | BİRLEŞTİRME: VRAM + "容量計算ツール" (K43) kalıbındaki 計算ツール. |
| Fine-tuning VRAM | ファインチューニングに必要な VRAM | K18, K30 | BİRLEŞTİRME: ファインチューニング (K18) + "モデルに必要な VRAM の量" (K30) kalıbı. Kısa menü etiketi için "ファインチューニング" (K18) yeter. |
| Task fit | タスク適合性 | K36, K26 | BİRLEŞTİRME: "ハードウェアとワークロードの適合性" (K36) kalıbı. HF Hub aynı işi "お使いのハードウェアに適合するモデルを確認" (K26) diye anlatıyor. Alternatif: "タスクに適したモデル" (K18). |
| Model anatomy | モデルの構造 | K61 | BİRLEŞTİRME: "言語モデルの構造を示しています" (K61). "解剖" yalnız prompt için geçiyor: "プロンプトを解剖する" (K44); "モデル解剖" kaynakta yok. |
| Compare models | モデル比較 | K7, K62 | BİRLEŞTİRME: "他のモデルの性能と比較する" (K7); "比較" 31 sayfa. |
| Model name decoder | モデル名の読み方 | K10, K34 | BİRLEŞTİRME: "モデル名" (K10, K34, K35) + 読み方. "デコーダー" model mimarisindeki decoder ile çakışacağı için kullanılmadı. |
| vLLM settings (vLLM Params) | vLLM パラメータ | K39 | BİRLEŞTİRME: vLLM + パラメータ; K39 başlığı "パラメータ値を試す" (K39). |
| Config Decoder (config.json explained) | config.json の解説 | K61 | BİRLEŞTİRME: K61 başlık kalıbı "大規模言語モデル (LLM) の解説" (K61). |
| Serving Brief | サービングの概要 | K31 | BİRLEŞTİRME: "LLM サービング最適化手法の概要" (K31) kalıbı. |
| Capacity plan / capacity planner | 容量計画 | K49, K30 | Sayfa adı kaynaklı (capacity planning satırı). Araç için ayrı ad gerekirse "容量計画ツール" yazılabilir (kaynakta yok; zh'de verilen karar gibi kaynaklı 容量計画 önerilir). |
| GPU compare | GPU 比較 | K7 | BİRLEŞTİRME: GPU + 比較 ("比較する", K7). |
| LLM 101 | LLM 入門 | K27, K48 | BİRLEŞTİRME: "機械学習入門コース" (K27), "入門チュートリアル" (K48). |
| Feed (haber akışı) | ニュース | K58, K56, K67 | ニュース 4 / 最新情報 4 sayfa → eşit; yayıncı 2 / 1 (Microsoft, NVIDIA / NVIDIA) → ニュース. "最新のニュースを入手" (K58), "NVIDIA ニュースを購読" (K67). Alternatif: "最新情報" (K58, K67; "NVIDIA 推論の最新情報", K58). "フィード" derlemde yalnız başka anlamda: "変更フィード" (K51), "フィードバック". Altbilgideki "LLM Feed" → "LLM ニュース" (birleştirilmiş ad). fr'de de "Actualités" (haberler) seçilmişti. |
| "This page was translated with AI · Suggest a correction" (altbilgi) | このページは AI によって翻訳されました · 修正を提案 | K27, K63, K41 | BİRLEŞTİRME: Google'ın üst notu "Google は AI 技術を使用して、コンテンツをご希望の言語に翻訳しています" (K27), NVIDIA'nın notu "機械翻訳によって翻訳されたものです" (K63), Microsoft'un sayfa düğmesi "修正を提案しますか?" (K41). Ayırıcı nokta (·) EN'den. |

## İngilizce kalanlar

| EN | Neden |
|---|---|
| sliding window attention | Kaynak yok: "スライディング" ve "sliding" 0 sayfa. |
| hidden size | Kaynaklarda Japonca metin içinde İngilizce yazılıyor (K3, K15); "隠れサイズ" (K11) bir sayfa, bir geçiş (Terimler). |
| gradient checkpointing | Tek kaynak İngilizce yazıyor (K15); "勾配チェックポイント" 0 sayfa. |
| Multi-head Latent Attention (MLA açılımı) | Kaynak yok. |
| expert parallelism | Japonca biçim kaynakta yok; BİRLEŞTİRME önerisi (エキスパート並列) onaylanmazsa İngilizce kalır. |
| Mixture of Experts (MoE açılımı) | Kaynakların çoğu açılımı Japonca metinde İngilizce yazıyor: 6 / 2 sayfa (Terimler). |
| Low-Rank Adaptation (LoRA açılımı) | İki kaynak da İngilizce açıyor (K65, K27). |
| Kısaltmalar: VRAM, GPU, KV, MoE, MHA, GQA, MQA, MLA, LoRA, QLoRA, BF16, FP8, INT4, TTFT, TPS, RPS, SLO, MIG, RoPE, MTP, CUDA, TFLOPS, LLM | Kural 4: kısaltma çevrilmez. Kaynaklar kısaltmayı Japonca açılımın ardından parantezde veriyor: "大規模言語モデル（LLM）" (K29), "サービスレベル目標（SLO）" (K40), "マルチインスタンス GPU (MIG)" (K57). |
| Adlar: vLLM, SGLang, LLMScale, Hugging Face, NVLink, Adam, config.json, generation_config.json, `temperature` | Ürün, kütüphane, dosya ve parametre adları değişmez. |

## Yazım kuralları

Yalnız kaynaklarda gözlenen ve sayılan kullanım. Karar dil sahibinindir. Sayımlar kod blokları dışındaki ana metinde (satır içi kod dahil) yapıldı; "sayfa çoğunluğu" bir sayfanın iki biçimden hangisini daha çok kullandığına göre sayıldı. Yayıncı sıraları: HF (26 sayfa), Google (14), Microsoft (11), NVIDIA (15), AWS (6), Apple (2), AMD (1).

- **Üslup: です・ます.** Cümle sonu sayımı (です。 / ます。 / である。 / だ。): HF 487 / 1553 / 2 / 0, Google 659 / 3205 / 2 / 0, Microsoft 150 / 991 / 0 / 0, NVIDIA 170 / 954 / 0 / 0, AWS 30 / 206 / 0 / 0, Apple 9 / 28 / 0 / 0, AMD 2 / 3 / 0 / 0. Kural kaynakları aynı yönde: "In general, sentences should be translated in Desu-masu unless otherwise instructed" (K52); K52 aynı bölümde です・ます, である ve 体言止め'yi (isimle biten ifade) yerine göre kullanmayı söylüyor; etiket ve başlıklar bu üçüncüsüne girer. K80: "「です・ます」体を基本として" (K80).
- **Japonca ile Latin harf ya da rakam arasında yarım genişlik boşluk.** Sayfa çoğunluğu 56 boşluklu / 19 bitişik (bitişiklerin 17'si HF, 2'si Apple). Geçiş toplamı (boşluklu / bitişik): HF 1962 / 1972, Google 7075 / 46, Microsoft 1601 / 223, NVIDIA 3697 / 68, AWS 459 / 1, Apple 2 / 927, AMD 33 / 0. HF içinde ayrışıyor: LLM Course sayfa çoğunluğu 2 boşluklu / 6 bitişik, Transformers 7 / 7, Hub 0 / 4. Kural: "In principle, insert a half-width space" (K52; tam ve yarım genişlik karakter arasında). Örnek: "GPU メモリ使用量" (K15), "KV キャッシュ" (K30); bitişik örnek "16GBユニファイドメモリ" (K74). İstisnalar kaynakta ölçülen biçimde: 、 ve 。 ile Latin harf arasında boşluk yok (、ardından boşluk 56 geçiş / boşluksuz 2795); sayı ile % arasında boşluk yok (boşluksuz 165 / boşluklu 0; "88% の精度", K27); （ ） içinde boşluk yok (boşluklu yalnız 2 geçiş). K52 de 、。 ile yarım genişlik karakter arasında boşluk istemiyor.
- **Noktalama.** Virgül 、 ve nokta 。 her yayıncıda; ，．0 geçiş. Cümleler arasında boşluk yok: "。" ardından Japonca karakter 3769 geçiş (74 sayfa) / boşluklu 649 geçiş (20 sayfa; 591'i Microsoft MT sayfalarında). 
- **Parantez: tam genişlik （）.** Sayfa çoğunluğu 40 tam genişlik / 34 yarım genişlik. Tam genişlik HF (24 sayfa çoğunluk), Google (14) ve Apple'da (2); yarım genişlik ve önünde boşluk Microsoft (11), NVIDIA (15), AWS (5) ve AMD'de (1). Fark 6 sayfa → （）. Örnek "最初のトークンまでの時間（TTFT）" (K32); NVIDIA biçimi "最初のトークンまでの時間 (TTFT)" (K60). K80 （） kullanıyor; K52 yarım genişlik parantezi erişim tuşu, ticari marka ve ek açıklama için öneriyor.
- **İki nokta: yarım genişlik ":" ve ardından boşluk.** Sayfa çoğunluğu 47 ": " / 6 "："; herhangi bir kullanım 50 / 11 sayfa. ": " HF (13 sayfa çoğunluk), Google (13), Microsoft (8), NVIDIA (12), AWS (1); "：" HF LLM Course (K6, K7), Hub (K24), Transformers (K11) ve Apple'da (K74, K75). Etiket ile değer: "平均入力長: 1,500 トークン" (K30). Tam genişlik örnekleri: "以下のオプションに変更可能：" (K75), resmî kural "項目とその内容・説明等を区切る" (K80; örnek "住所：東京都千代田区" (K80)). K52 yarım genişlik iki noktayı etiket sonunda istiyor ("メディアの種類:" (K52)) ve iki noktadan önce boşluk istemiyor.
- **Noktalı virgül: kullanılmıyor.** Japonca metinde ； 0 geçiş; yarım genişlik ";" Japonca karakterin ardından 7 geçiş, hepsi Transformers'ın iki sayfasında (K14 madde sonları, K22 API açıklamaları). K52: "use semicolon (;) as a part of English quotation" (K52), yani yalnız İngilizce alıntı ve marka içinde. K80'in işaret listesinde noktalı virgül yok. Değiştirme önerisi Ayırıcılar bölümünde.
- **Tırnak.** 「」: HF 66, Google 276, Microsoft 55, NVIDIA 53, AWS 43, Apple 4. “”: HF 64, Microsoft 2, NVIDIA 5. 『』 Google 4, NVIDIA 1 (kitap ve belge adı). Örnek "「クエリ」、「キー」、「値」" (K27).
- **Katakana uzun ünlü (ー).** Kaynaklar terim başına ayrışıyor; bu yüzden her terim ayrı sayıldı (sayfa, işaretsiz / işaretli): パラメータ 34 / 16, トークナイザ 6 / 16, オプティマイザ 4 / 9, アダプタ 5 / 5 (Apple hariç; geçiş 20 / 75), レイテンシ 16 / 4, レイヤ 6 / 16, デコーダ 2 / 10, エンコーダ 2 / 7, コンテナ 7 / 10, クラスタ 9 / 10, コンピュータ 7 / 13, ユーザ 1 / 41, サーバ 0 / 23, メモリ 42 / 0, ライブラリ 31 / 0, ディレクトリ 21 / 0, クエリ 12 / 0, カテゴリ 11 / 2, アクセラレータ 14 / 0, プロセッサ 14 / 1. Google -er ekinde ー'yu düşürüyor (レイヤ, エンコーダ, コンテナ, クラスタ), Microsoft ve NVIDIA koruyor. Resmî kural ilke olarak ー istiyor ama alışkanlığa izin veriyor: "慣用に応じて「ー」を省くことができる" (K79). K80 -ty, -ry ile biten kelimeleri de ー ile yazıyor ("-ty、-ry など、y で終わる語も長音符号を用いて書く" (K80), "カテゴリー（category）" (K80)); derlem カテゴリ, メモリ, ライブラリ yazıyor. K52: "use a long vowel when a source English term has following suffixes: -er, -or, -ar" (K52); istisna listesinde "accelerator アクセラレータ" (K52); 4 karakter kuralıyla "memory" → メモリ.
- **Bileşik katakana.** K52 İngilizcedeki boşluğu korumayı istiyor ("dialog box" → "ダイアログ ボックス"); kaynaklar karışık: "バッチサイズ" 14 / "バッチ サイズ" 4 sayfa, "コンテキスト ウィンドウ" 4 / bitişik 0, "モデルカード" 8 / "モデル カード" 1. Terim başına tablodaki biçim geçerli.
- **Büyük sayılar.** billion → 億, million → 万 ve 億, trillion → 兆: "総パラメーター 300 億" (K67), "小（80 億）" (K36), "最大 2,000 億個のパラメ" (K55). Rakam ile 億/万/兆 arasında boşluk sayfa çoğunluğu 14 / bitişik 6. Yalnız 億 geçişleri: boşluklu Google 15, NVIDIA 21, AWS 2; bitişik HF 1, Apple 2. K80: "兆・億・万の単位は、漢字を使う" (K80). Model adındaki "70B" değişmez ("Llama 3.1 70B" (K36)).
- **Birim.** Sayı ile GB arasında boşluk sayfa çoğunluğu 11 / bitişik 7 (Google, Microsoft, AMD ve NVIDIA'nın yarısı boşluklu; Apple, AWS, HF'nin bir sayfası ve NVIDIA'nın öteki yarısı bitişik). Bant genişliğinde NVIDIA "GB/秒" (K55), Apple "GB/s" (K74). Site GB, GiB ve TB/s etiketlerini ve koddaki boşluklu çıktıyı ("24.00 GiB") korur.
- **Sayı biçimi ve sitenin çıktısı.** Kaynaklarda binlik virgül (n,nnn: HF 5, Google 127, Microsoft 15, NVIDIA 30, AWS 1, Apple 4), ondalık nokta, tam genişlik rakam yalnız 2 geçiş. K80: "大きな数は、三桁ごとにコンマで区切る" (K80). `Intl.NumberFormat("ja-JP-u-nu-latn")` bu Mac'te Node v22.23.4 ile ölçüldü (GTR9'da ve tarayıcıda ölçülmedi): 1234.5 → "1,234.5"; 12345.67 → "12,345.67"; 131072 → "131,072"; 27000000000 → "27,000,000,000"; 0.31 → "0.31"; yüzde 0.05 → "5%", 0.855 → "85.5%" (maximumFractionDigits 1). Çıktı kaynaklardaki kullanımla uyumlu. Kısa gösterim (`notation: "compact"`) 27000000000 → "270億" verir, rakam ile 億 bitişik; kaynak çoğunluğu boşluklu, site bu gösterimi kullanırsa fark görünür. `Intl.PluralRules("ja")` yalnız "other" kategorisi döndürüyor; tekil ve çoğul anahtarlar (`*.one` / `*.other`) aynı metni alır.
- **Sayma sözcükleri.** Değişken sayı için 個: "N つの" yalnız 1–9 ile geçiyor (58 sayfa; 10 ve üstü 0 sayfa), "N 個の" 10 ve üstüyle 18 sayfada ("6,000 個の GPU" (K35), "50 個のトークン" (K68)). Rakam ile 個 arasında boşluk sayfa çoğunluğu 17 / 4, rakam ile つ arasında 39 / 20. 件 veri kaydı ve öğe için: "458 件の予測" (K27), "10,000 件の映画タイトル" (K27); 8 sayfa. 層 katman için: "32 層の Transformer" (K64), "2 層 MLP" (K62); 3 sayfa / "N つのレイヤー" 2 sayfa ("4 つのレイヤー" (K71)). 基 GPU için: "GPU を 4 基" (K54), "最大8基のGPU" (K54); 4 sayfa, hepsi NVIDIA / 個 2 sayfa ("16 個の NVIDIA H100" (K30)). 台 GPU ile bir kez: "GPU1台あたり" (K54); 枚 0. K52: "5個" (K52) örneğiyle sayma sözcüğünü rakamla yazmayı gösteriyor.

## Ayırıcılar

Uygulama sözlükteki `list.sep`, `colon.sep` ve `semicolon.sep` anahtarlarını kullanır: `joinList` (`src/lib/dict.ts`) liste için; `colon.sep` config açıklamasında katman sayımı ("52 層: …", `src/lib/configExplain.ts`), dil menüsü, sonuç başlığı ve GPU karşılaştırma `aria-label`'larında; `semicolon.sep` kapasite planında ret gerekçelerini birleştirirken (`src/pages/PlanPage.tsx`). Rehber üreticisi aynı ayırıcıları `scripts/locales/ja.ts` `join: { sentence, list, colon }` alanından alır.

| Anahtar | en | zh | ja önerisi | Kanıt |
|---|---|---|---|---|
| `join.sentence` | `" "` | `""` | `""` | 。 ile sonraki cümle arasında boşluk yok: 74 / 20 sayfa (Yazım kuralları). |
| `list.sep` / `join.list` | `", "` | `"、"` | `"、"` | Latin adlar arasında da 、: "推論エンジン（vLLM、SGLang、TGI など）" (K9), "VRAM、RAM、または統合メモリ" (K26), "量子化モデル（AWQ、GPTQ）" (K25). Latin öğe、Latin öğe 51 sayfa / Japonca cümle içinde ", " ile 9 sayfa. K52 son öğeyi "および" ile bağlıyor: "xxx、yyy、および zzz" (K52); `joinList` yalnız ayırıcı kullandığı için 、 yeter. |
| `colon.sep` / `join.colon` | `": "` | `"："` | `": "` | Sayfa çoğunluğu 47 / 6 (Yazım kuralları); "平均入力長: 1,500 トークン" (K30). Beklenen "：" (zh ile aynı) kaynaklarda azınlıkta: Apple (K74, K75), HF LLM Course ve resmî K80. Tam genişlik istenirse `"："` (boşluksuz) yazılır; karar dil sahibinin. |
| `semicolon.sep` | `"; "` | `"；"` | `"。"` | Japonca kaynaklarda noktalı virgül yok (Yazım kuralları; K52 yalnız İngilizce alıntıda izin veriyor). Ret gerekçeleri (`plan.no.*`) iki nokta ve 、 içeren tam yan cümleler; 、 ile birleştirmek sınırı bulanıklaştırır, です・ます cümlesi 。 ile biter. Son gerekçe noktasız kalır (öteki dillerde de öyle). Alternatif: "／" (K80 bölü işaretini "文節など文の区切りを示す" (K80) diye tanımlıyor). |

Kodda sayı ile sözcük arasında boşluk sabit (`${n} ${word}`, `src/lib/configExplain.ts`); Japonca için de doğru sonuç verir ("52 層", rakam ile Japonca karakter arasında boşluk kuralı).

## Sayı sözcükleri

Sitede sayı sözcüğü `{n}`'den sonra boşlukla gelir (`config.w.*`, `gloss.unit.*`, `serve.tensor.*`) ya da cümle içinde `{n}` ile yazılır (`serve.files.count`, `serve.a.*`). Japoncada tekil ve çoğul aynı (PluralRules yalnız "other"). Değişken sayı için 個 kullanılır, çünkü つ 10 ve üstüyle geçmiyor (Yazım kuralları).

| Kavram (anahtar) | ja (sayıdan sonra) | Örnek çıktı | Kaynak / not |
|---|---|---|---|
| layer (`config.w.layers`, `gloss.unit.layers` / `layer`) | 層 | 52 層 | "32 層の Transformer" (K64), "2 層 MLP" (K62). |
| attention head (`gloss.unit.heads` / `head`) | 個のヘッド | 32 個のヘッド | Kaynak "8 つの並列アテンション ヘッド" (K62); 10 ve üstü için 個. Uzun bağlamda "個のアテンション ヘッド". |
| expert (`gloss.unit.experts` / `expert`) | 個のエキスパート | 128 個のエキスパート | Kaynak "8 つのエキスパート" (K64); 10 ve üstü için 個. |
| token (`config.w.tokens`, `gloss.unit.tokens` / `token`) | トークン | 131,072 トークン | "1,500 トークン" (K30), "400 トークン" (K28); 6 sayfa / "50 個のトークン" (K68) 3 sayfa. |
| id (`config.w.ids` / `id`; eos ve stop token id) | 個の ID | 2 個の ID | BİRLEŞTİRME: sayılı kullanım kaynakta yok; "トークン ID" (K41, K11). |
| item (`config.w.items`) | 件 | 3 件 | "458 件の予測" (K27), "10,000 件の映画タイトル" (K27). |
| field (`config.w.fields`; config alanı) | 個のフィールド | 12 個のフィールド | BİRLEŞTİRME: sayılı kullanım kaynakta yok; 個 genel kuralı. |
| bytes per parameter (`config.w.bytesPerParam`) | バイト/パラメータ | 2 バイト/パラメータ | BİRLEŞTİRME: kaynak sırası "パラメータあたり 6 バイト" (K15) sabit `{n} {sözcük}` düzenine sığmıyor; zh'deki "字节/参数" gibi bölü ile. Alternatif: "バイト（パラメータあたり）". |
| tensor (`serve.tensor.one` / `other`) | 個のテンソル | 845 個のテンソル | Kaynak "2 つのテンソル" (K27); 10 ve üstü için 個. |
| file (`serve.files.count`) | {n} 個のファイル | 4 個のファイル | Kaynak "2つのファイル" (K4). |
| module pattern (`serve.a.weights.kept`) | {n} 個のモジュール パターン | 3 個のモジュール パターン | BİRLEŞTİRME: "1 つのモジュール" (K19) + パターン; bileşik katakana boşluğu K52 kuralıyla. |
| stop token (`serve.a.g.eosExtra`) | {n} 個の終了トークン | 2 個の終了トークン | "シーケンス終了トークン" (K22, K13), "終了トークン" (K21). "停止シーケンス" (K68, K42) stop sequence (metin dizisi), ayrı terim. |
| MTP layer (`serve.a.mtp.*`) | {n} 個の MTP 層 | 1 個の MTP 層 | BİRLEŞTİRME: sayılı kullanım kaynakta yok; MTP (K67) + 層. Alternatif: "MTP 層 {n} 層". |

## Uygulamada verilen kararlar (Dalga 4)

- **Hitap ve yazım.** です/ます; Japonca ile Latin harf ya da rakam arasında yarım genişlik boşluk; tam genişlik （ ）「 」、。. Ayırıcılar: `list.sep` "、", `colon.sep` "："(sözlüğün ": " önerisi yerine, zh ile aynı), `semicolon.sep` "。"; rehber sayfalarında cümleler boşluksuz birleşir (`join.sentence` "").
- **Sayaçlar.** GPU 基, sunucu ve cihaz 台, kullanıcı 人, istek 件, uzman, head ve grup 個, pipeline aşaması 段. Model sayfasındaki etiketler "80 層", "64/8 ヘッド", "最大コンテキスト 128k". Aralıklar ～ (U+FF5E).
- **Sözlükte olmayıp seçilenler.** reasoning → リーズニング (推論 inference için kalır; NVIDIA ja "リーズニング モデル"); training → トレーニング, pretraining → 事前学習; default → デフォルト; active parameters → アクティブ パラメータ (sitedeki パラメータ ile aynı); tool calling → ツール呼び出し; reranker → リランカー; data center → データ センター; HF token → アクセス トークン.
- **Birim kısaltması.** Sayı alanlarının yanındaki birim "tok" (en, de, ru ve fr ile aynı): "トークン" 375 px'te alanın içinde iki satıra kırılıyordu.
- **Menü adı.** "LLM 入門" (sözlüğün LLM 101 karşılığı); menü, başlık ve h1 aynı. Diğer diller "LLM 101" yazıyor.
- **Sözcük sayısı.** "≈ {w} words" → "英単語で約 {w} 語": site token başına 0,75 İngilizce sözcük sayıyor, çıplak 語 Japon okuru yanıltırdı.
- **Birleştiriciler (2026-11-20).** Uygulama içi açıklamalarda cümleler `sentence.sep` ile boşluksuz, son öğeden önceki "および" `list.and` ile boşluksuz birleşir: "ツール呼び出し、リーズニングおよび画像入力". Boşluk kodda değil sözlük değerinde durur. Alternatif "、および": K52 son öğeyi "xxx、yyy、および zzz" (K52) diye bağlıyor, K63 de "、および値 (V)" yazıyor; iki öğede "ツール呼び出し、および画像入力" olurdu.

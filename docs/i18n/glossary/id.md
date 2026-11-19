# Terim sözlüğü — Bahasa Indonesia (id)

Durum: Dalga 2 (2026-11-19). Kaynak dil EN. Kural: docs/i18n-plan.md §4 — karşılık birincil kaynaktan, kaynaksız terim İngilizce kalır.

Hedef: tek `id` sürümü (Bahasa Indonesia). Malezya Malaycası (ms) ayrı dil; Malezya kaynakları kullanılmadı.

## Kaynaklar

Her sayfa 2026-11-19'da indirildi. Sayfanın ana içerik bölümü metne çevrildi: Google'da `<h1>`'den `</article>`'a, Microsoft Learn'de `<h1>`'den `</main>`'e, Hugging Face'te `prose` bölümü, NVIDIA'da `<h1>`'den `<footer>`'a (K41'de h1 yok, sayfanın tamamı), Apple'da `<main>`. Kenar menüleri, kod blokları (`<pre>`, markdown kod çitleri) ve HTML yorumları atıldı. Terim bu metinde arandı. Tablodaki her biçim, kaynak sütununda adı geçen sayfada geçiyor; notlardaki her tırnaklı örnek de yanında adı geçen her sayfada geçiyor (otomatik denetim: 278 biçim, hepsi bulundu; id sütununda 91 biçim, notlarda ve yazım kurallarında 187 tırnaklı örnek).

Makine çevirisi. Derlemin büyük kısmı makine çevirisi; hepsi yine birincil kaynak sayıldı, açık hatalar kullanılmadı:
- Google (K4–K23, K8 hariç): sayfa başında "Google menggunakan teknologi AI untuk menerjemahkan konten…" notu var. Görülen hatalar: prefill için "pengisian otomatis" (K12, K16; "autofill" anlamı); K5 başlığı çevrilmemiş ("Introduction to Large Language Models").
- Microsoft Learn (K24–K37): hepsinde `ms.translationtype: MT`. K26 tabloda İngilizce binlik ayırıcıyı korumuş ("24,000").
- Microsoft GitHub (K43–K87): Co-op Translator çevirisi; her dosyanın sonunda "Penafian" (yapay zekâ çeviri uyarısı) var. Bu 45 dosya 87 sayfalık derlemin yarısından fazlası; kararı yalnız bu grubun taşıdığı satırlar notta "yalnız MS GitHub" diye işaretli.
- Hugging Face (K1–K3): topluluk çevirisi (insan). NVIDIA (K38–K41) ve Apple (K42): resmî yerelleştirilmiş ürün sayfaları.
- KBBI (K88–K95): Badan Bahasa'nın resmî sözlüğü. Yalnız yazımı doğrulamak için kullanıldı, sayıma girmedi.

Hugging Face
- [K1] HF LLM Course (id) — Bab 0.1, Pendahuluan — https://huggingface.co/learn/llm-course/id/chapter0/1 (okunma tarihi 2026-11-19)
- [K2] HF LLM Course (id) — Bab 1.1, Pendahuluan — https://huggingface.co/learn/llm-course/id/chapter1/1 (okunma tarihi 2026-11-19)
- [K3] HF LLM Course (id) — Bab 1.2, Pemrosesan Bahasa Natural — https://huggingface.co/learn/llm-course/id/chapter1/2 (okunma tarihi 2026-11-19)

Google (hl=id)
- [K4] Google — Glosarium Machine Learning — https://developers.google.com/machine-learning/glossary?hl=id (okunma tarihi 2026-11-19)
- [K5] Google MLCC — LLM giriş (başlık İngilizce kalmış) — https://developers.google.com/machine-learning/crash-course/llm?hl=id (okunma tarihi 2026-11-19)
- [K6] Google MLCC — LLM: Apa itu model bahasa besar (LLM)? — https://developers.google.com/machine-learning/crash-course/llm/transformers?hl=id (okunma tarihi 2026-11-19)
- [K7] Google MLCC — LLM: Fine-tuning, distilasi, dan Prompt Engineering — https://developers.google.com/machine-learning/crash-course/llm/tuning?hl=id (okunma tarihi 2026-11-19)
- [K8] Google MLCC — Embedding — https://developers.google.com/machine-learning/crash-course/embeddings?hl=id (okunma tarihi 2026-11-19)
- [K9] Google Cloud GKE — Ringkasan praktik terbaik inferensi di GKE — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference?hl=id (okunma tarihi 2026-11-19)
- [K10] Google Cloud GKE — LLM çıkarımını GPU ile optimize etme — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference/llm-optimization?hl=id (okunma tarihi 2026-11-19)
- [K11] Google Cloud GKE — Tentang inferensi model AI/ML di GKE — https://docs.cloud.google.com/kubernetes-engine/docs/concepts/machine-learning/inference?hl=id (okunma tarihi 2026-11-19)
- [K12] Google Cloud GKE — Panduan Memulai Inferensi — https://docs.cloud.google.com/kubernetes-engine/docs/how-to/machine-learning/inference/inference-quickstart?hl=id (okunma tarihi 2026-11-19)
- [K13] Google Cloud GKE — GKE Inference Gateway — https://docs.cloud.google.com/kubernetes-engine/docs/concepts/about-gke-inference-gateway?hl=id (okunma tarihi 2026-11-19)
- [K14] Google Cloud GKE — Tentang GPU di GKE — https://docs.cloud.google.com/kubernetes-engine/docs/concepts/gpus?hl=id (okunma tarihi 2026-11-19)
- [K15] Google Cloud GKE — Gemma'yı vLLM ile GPU'da sunma öğreticisi — https://docs.cloud.google.com/kubernetes-engine/docs/tutorials/serve-gemma-gpu-vllm?hl=id (okunma tarihi 2026-11-19)
- [K16] Google Cloud — Performa dan tolok ukur akselerator AI — https://docs.cloud.google.com/docs/ai-ml/accelerator-performance-benchmarking?hl=id (okunma tarihi 2026-11-19)
- [K17] Google Cloud — Ringkasan model yang di-deploy sendiri — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-garden/self-deployed-models?hl=id (okunma tarihi 2026-11-19)
- [K18] Google Cloud Compute Engine — Jenis mesin GPU — https://docs.cloud.google.com/compute/docs/gpus?hl=id (okunma tarihi 2026-11-19)
- [K19] Google Cloud Compute Engine — Mesin TPU — https://docs.cloud.google.com/compute/docs/tpus/tpu-machines?hl=id (okunma tarihi 2026-11-19)
- [K20] Google Cloud — Pengantar penyesuaian — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning?hl=id (okunma tarihi 2026-11-19)
- [K21] Google Cloud — Bereksperimen dengan nilai parameter — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/adjust-parameter-values?hl=id (okunma tarihi 2026-11-19)
- [K22] Google Cloud — Ringkasan Throughput yang Disediakan — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/provisioned-throughput?hl=id (okunma tarihi 2026-11-19)
- [K23] Google Cloud Monitoring — Konsep dalam pemantauan layanan (SLO) — https://docs.cloud.google.com/stackdriver/docs/solutions/slo-monitoring?hl=id (okunma tarihi 2026-11-19)

Microsoft Learn (id-id)
- [K24] Microsoft Learn — Memahami token — https://learn.microsoft.com/id-id/dotnet/ai/conceptual/understanding-tokens (okunma tarihi 2026-11-19)
- [K25] Microsoft Learn — Penyematan dalam .NET — https://learn.microsoft.com/id-id/dotnet/ai/conceptual/embeddings (okunma tarihi 2026-11-19)
- [K26] Microsoft Learn — Azure OpenAI, performa dan latensi — https://learn.microsoft.com/id-id/azure/foundry/openai/how-to/latency (okunma tarihi 2026-11-19)
- [K27] Microsoft Learn — Azure OpenAI, provisioned throughput — https://learn.microsoft.com/id-id/azure/foundry/openai/concepts/provisioned-throughput (okunma tarihi 2026-11-19)
- [K28] Microsoft Learn — Azure OpenAI, teknik rekayasa perintah — https://learn.microsoft.com/id-id/azure/foundry/openai/concepts/prompt-engineering (okunma tarihi 2026-11-19)
- [K29] Microsoft Learn — Azure OpenAI, fine-tuning — https://learn.microsoft.com/id-id/azure/foundry/openai/how-to/fine-tuning (okunma tarihi 2026-11-19)
- [K30] Microsoft Learn — Apa itu Foundry Local? — https://learn.microsoft.com/id-id/azure/foundry-local/what-is-foundry-local (okunma tarihi 2026-11-19)
- [K31] Microsoft Learn — AKS AI toolchain operator (KAITO) — https://learn.microsoft.com/id-id/azure/aks/ai-toolchain-operator (okunma tarihi 2026-11-19)
- [K32] Microsoft Learn — Azure Databricks, Model Serving — https://learn.microsoft.com/id-id/azure/databricks/machine-learning/model-serving/ (okunma tarihi 2026-11-19)
- [K33] Microsoft Learn — Azure Machine Learning, pelatihan terdistribusi — https://learn.microsoft.com/id-id/azure/machine-learning/concept-distributed-training?view=azureml-api-2 (okunma tarihi 2026-11-19)
- [K34] Microsoft Learn — Well-Architected, perencanaan kapasitas — https://learn.microsoft.com/id-id/azure/well-architected/performance-efficiency/capacity-planning (okunma tarihi 2026-11-19)
- [K35] Microsoft Learn — Visual Studio, Penggunaan GPU — https://learn.microsoft.com/id-id/visualstudio/profiling/gpu-usage?view=visualstudio (okunma tarihi 2026-11-19)
- [K36] Microsoft Learn — Windows, ONNX Runtime GenAI — https://learn.microsoft.com/id-id/windows/ai/models/get-started-models-genai (okunma tarihi 2026-11-19)
- [K37] Microsoft Learn — Azure Cosmos DB, Cost Estimator (eski adı Capacity Planner) — https://learn.microsoft.com/id-id/azure/cosmos-db/estimate-ru-with-capacity-planner (okunma tarihi 2026-11-19)

NVIDIA, Apple
- [K38] NVIDIA (id-id) — GeForce RTX 5090 — https://www.nvidia.com/id-id/geforce/graphics-cards/50-series/rtx-5090/ (okunma tarihi 2026-11-19)
- [K39] NVIDIA (id-id) — GeForce RTX 50 Series — https://www.nvidia.com/id-id/geforce/graphics-cards/50-series/ (okunma tarihi 2026-11-19)
- [K40] NVIDIA (id-id) — Bandingkan Kartu Grafis GeForce — https://www.nvidia.com/id-id/geforce/graphics-cards/compare/ (okunma tarihi 2026-11-19)
- [K41] NVIDIA (id-id) — AI on RTX — https://www.nvidia.com/id-id/ai-on-rtx/ (okunma tarihi 2026-11-19)
- [K42] Apple Indonesia — Spesifikasi Teknis MacBook Pro (adres …/id/macbook-pro/liquid-retina-xdr-display/specs/ sayfasına yönlendiriyor) — https://www.apple.com/id/macbook-pro/specs/ (okunma tarihi 2026-11-19)

Microsoft GitHub, Co-op Translator (`translations/id`)
- [K43] edgeai-for-beginners — Module01/01.EdgeAIFundamentals.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module01/01.EdgeAIFundamentals.md (okunma tarihi 2026-11-19)
- [K44] edgeai-for-beginners — Module01/02.RealWorldCaseStudies.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module01/02.RealWorldCaseStudies.md (okunma tarihi 2026-11-19)
- [K45] edgeai-for-beginners — Module01/04.EdgeDeployment.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module01/04.EdgeDeployment.md (okunma tarihi 2026-11-19)
- [K46] edgeai-for-beginners — Module02/01.PhiFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module02/01.PhiFamily.md (okunma tarihi 2026-11-19)
- [K47] edgeai-for-beginners — Module02/02.QwenFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module02/02.QwenFamily.md (okunma tarihi 2026-11-19)
- [K48] edgeai-for-beginners — Module02/03.GemmaFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module02/03.GemmaFamily.md (okunma tarihi 2026-11-19)
- [K49] edgeai-for-beginners — Module02/04.BitNETFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module02/04.BitNETFamily.md (okunma tarihi 2026-11-19)
- [K50] edgeai-for-beginners — Module03/01.SLMAdvancedLearning.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module03/01.SLMAdvancedLearning.md (okunma tarihi 2026-11-19)
- [K51] edgeai-for-beginners — Module03/02.DeployingSLMinLocalEnv.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module03/02.DeployingSLMinLocalEnv.md (okunma tarihi 2026-11-19)
- [K52] edgeai-for-beginners — Module03/03.DeployingSLMinCloud.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module03/03.DeployingSLMinCloud.md (okunma tarihi 2026-11-19)
- [K53] edgeai-for-beginners — Module04/01.Introduce.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module04/01.Introduce.md (okunma tarihi 2026-11-19)
- [K54] edgeai-for-beginners — Module04/02.Llamacpp.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module04/02.Llamacpp.md (okunma tarihi 2026-11-19)
- [K55] edgeai-for-beginners — Module04/04.openvino.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module04/04.openvino.md (okunma tarihi 2026-11-19)
- [K56] edgeai-for-beginners — Module04/05.AppleMLX.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module04/05.AppleMLX.md (okunma tarihi 2026-11-19)
- [K57] edgeai-for-beginners — Module05/01.IntroduceSLMOps.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module05/01.IntroduceSLMOps.md (okunma tarihi 2026-11-19)
- [K58] edgeai-for-beginners — Module05/02.SLMOps-Distillation.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module05/02.SLMOps-Distillation.md (okunma tarihi 2026-11-19)
- [K59] edgeai-for-beginners — Module05/03.SLMOps-Finetuing.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module05/03.SLMOps-Finetuing.md (okunma tarihi 2026-11-19)
- [K60] edgeai-for-beginners — Module05/04.SLMOps.Deployment.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module05/04.SLMOps.Deployment.md (okunma tarihi 2026-11-19)
- [K61] edgeai-for-beginners — Module07/README.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module07/README.md (okunma tarihi 2026-11-19)
- [K62] edgeai-for-beginners — Module08/03.OpenSourceModels.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/id/Module08/03.OpenSourceModels.md (okunma tarihi 2026-11-19)
- [K63] generative-ai-for-beginners — 01-introduction-to-genai — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/01-introduction-to-genai/README.md (okunma tarihi 2026-11-19)
- [K64] generative-ai-for-beginners — 02-exploring-and-comparing-different-llms — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/02-exploring-and-comparing-different-llms/README.md (okunma tarihi 2026-11-19)
- [K65] generative-ai-for-beginners — 04-prompt-engineering-fundamentals — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/04-prompt-engineering-fundamentals/README.md (okunma tarihi 2026-11-19)
- [K66] generative-ai-for-beginners — 06-text-generation-apps — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/06-text-generation-apps/README.md (okunma tarihi 2026-11-19)
- [K67] generative-ai-for-beginners — 15-rag-and-vector-databases — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/15-rag-and-vector-databases/README.md (okunma tarihi 2026-11-19)
- [K68] generative-ai-for-beginners — 16-open-source-models — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/16-open-source-models/README.md (okunma tarihi 2026-11-19)
- [K69] generative-ai-for-beginners — 18-fine-tuning — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/18-fine-tuning/README.md (okunma tarihi 2026-11-19)
- [K70] generative-ai-for-beginners — 19-slm — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/19-slm/README.md (okunma tarihi 2026-11-19)
- [K71] generative-ai-for-beginners — 20-mistral — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/20-mistral/README.md (okunma tarihi 2026-11-19)
- [K72] generative-ai-for-beginners — 21-meta — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/id/21-meta/README.md (okunma tarihi 2026-11-19)
- [K73] PhiCookBook — 01.Introduction/01/01.Understandingtech.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/01/01.Understandingtech.md (okunma tarihi 2026-11-19)
- [K74] PhiCookBook — 01.Introduction/01/01.Hardwaresupport.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/01/01.Hardwaresupport.md (okunma tarihi 2026-11-19)
- [K75] PhiCookBook — 01.Introduction/03/overview.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/03/overview.md (okunma tarihi 2026-11-19)
- [K76] PhiCookBook — 01.Introduction/03/iOS_Inference_MLX.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/03/iOS_Inference_MLX.md (okunma tarihi 2026-11-19)
- [K77] PhiCookBook — 01.Introduction/03/Rust_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/03/Rust_Inference.md (okunma tarihi 2026-11-19)
- [K78] PhiCookBook — 01.Introduction/03/Jetson_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/03/Jetson_Inference.md (okunma tarihi 2026-11-19)
- [K79] PhiCookBook — 01.Introduction/03/Kaito_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/03/Kaito_Inference.md (okunma tarihi 2026-11-19)
- [K80] PhiCookBook — 01.Introduction/04/QuantifyingPhi.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/04/QuantifyingPhi.md (okunma tarihi 2026-11-19)
- [K81] PhiCookBook — 01.Introduction/04/UsingLlamacppQuantifyingPhi.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/01.Introduction/04/UsingLlamacppQuantifyingPhi.md (okunma tarihi 2026-11-19)
- [K82] PhiCookBook — 03.FineTuning/FineTuning_Lora.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/03.FineTuning/FineTuning_Lora.md (okunma tarihi 2026-11-19)
- [K83] PhiCookBook — 03.FineTuning/FineTuning_Qlora.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/03.FineTuning/FineTuning_Qlora.md (okunma tarihi 2026-11-19)
- [K84] PhiCookBook — 03.FineTuning/FineTuning_Scenarios.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/03.FineTuning/FineTuning_Scenarios.md (okunma tarihi 2026-11-19)
- [K85] PhiCookBook — 03.FineTuning/FineTuning_MLSDK.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/03.FineTuning/FineTuning_MLSDK.md (okunma tarihi 2026-11-19)
- [K86] PhiCookBook — 03.FineTuning/FineTuning_MicrosoftOlive.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/03.FineTuning/FineTuning_MicrosoftOlive.md (okunma tarihi 2026-11-19)
- [K87] PhiCookBook — 03.FineTuning/FineTuning_vs_RAG.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/id/md/03.FineTuning/FineTuning_vs_RAG.md (okunma tarihi 2026-11-19)

Badan Bahasa — KBBI VI Daring (yalnız yazım doğrulaması, sayıma girmedi)
- [K88] KBBI — kuantisasi — https://kbbi.kemendikdasmen.go.id/entri/kuantisasi (okunma tarihi 2026-11-19)
- [K89] KBBI — inferensi — https://kbbi.kemendikdasmen.go.id/entri/inferensi (okunma tarihi 2026-11-19)
- [K90] KBBI — latensi — https://kbbi.kemendikdasmen.go.id/entri/latensi (okunma tarihi 2026-11-19)
- [K91] KBBI — token — https://kbbi.kemendikdasmen.go.id/entri/token (okunma tarihi 2026-11-19)
- [K92] KBBI — presisi — https://kbbi.kemendikdasmen.go.id/entri/presisi (okunma tarihi 2026-11-19)
- [K93] KBBI — dekode — https://kbbi.kemendikdasmen.go.id/entri/dekode (okunma tarihi 2026-11-19)
- [K94] KBBI — adaptor — https://kbbi.kemendikdasmen.go.id/entri/adaptor (okunma tarihi 2026-11-19)
- [K95] KBBI — adapter (→ adaptor) — https://kbbi.kemendikdasmen.go.id/entri/adapter (okunma tarihi 2026-11-19)

Endonezcesi olmayan ya da açılamayan kaynaklar (2026-11-19):

- Hugging Face Transformers dokümanı — `docs/source` altında `id` klasörü yok (diller: ar de en es fr hi it ja ko pt ro tr zh).
- Hugging Face Agents, MCP, smol, audio, deep-rl ve diffusion kursları; hub-docs, diffusers, peft, TGI, accelerate, datasets, tokenizers, smolagents, trl, optimum, huggingface_hub dokümanları — `id` sürümü yok.
- Hugging Face LLM Course (id) — yalnız chapter0/1, chapter1/1 ve chapter1/2 çevrilmiş (K1–K3); sözlük (glossary) ve TRANSLATING dosyası yok.
- NVIDIA id-id: H100, H200, L4, DGX Spark, Dynamo, MIG, data-center ve sözlük sayfaları — 404. Endonezce NVIDIA kaynağı yalnız GeForce ürün sayfaları (K38–K41).
- AMD `/id/` Ryzen AI Max+ 395 — 404.
- ai.google.dev Gemma dokümanı ve Gemini API (tokens, long-context, prompting, embeddings) `?hl=id` — gemma.ai'ye (İngilizce) ya da aistudio.google.com'a (JS ile oluşan, metinsiz) yönlendiriyor.
- Badan Bahasa terim sözlükleri (glosarium.kemdikbud.go.id, glosarium.kemendikdasmen.go.id, padanan istilah sayfaları, eski kbbi.kemdikbud.go.id) — bağlantı kurulamadı. Badan Bahasa'dan yalnız yeni alan adındaki KBBI (K88–K95) açıldı.

## Terimler

Sayım yöntemi (kural 5): okunan 87 sayfalık derlemde (K1–K87; KBBI hariç) biçimi o anlamda kullanan sayfa sayısı. Fark 1 sayfa ya da daha azsa eşit sayıldı; o zaman biçimi kullanan yayıncı sayısı (Hugging Face, Google, Microsoft, NVIDIA, Apple; Microsoft Learn ve Microsoft GitHub tek yayıncı), o da eşitse geçiş sayısı belirledi. Notlardaki "X / Y sayfa" bu sayımdır. 87 sayfanın 45'i Microsoft GitHub makine çevirisi (K43–K87); kararı bu grubun tek başına verdiği satırlarda bu belirtildi. Kaynakta karşılığı bulunmayan terimler (hidden size, MTP, CUDA graphs, expert parallelism, datasheet) "İngilizce kalanlar" tablosunda.

| EN | id | Kaynak | Not / alternatif |
|---|---|---|---|
| GPU memory | memori GPU | K18, K9, K10 | 10 sayfa (Google 4, Microsoft 6). K18: "Memori GPU adalah memori pada perangkat GPU" (K18). Alternatif yazım: "vRAM GPU" (K10). "memori akselerator" (K9, K14) accelerator memory demek, GPU'ya özgü değil. |
| VRAM | VRAM | K9, K52, K45, K81 | Kısaltma, çevrilmez. 4 sayfa. "Berapa Banyak VRAM yang Diperlukan Model Saya?" (K9). Alternatif yazım: "vRAM" (K10; 1 sayfa). |
| weights / model weights | bobot / bobot model | K4, K9, K11 | bobot 27 sayfa, bobot model 14 sayfa. K9 tanımı: "Bobot model: ukuran parameter model" (K9). İngilizce yalnız K9 formülünde: "Model weights" (K9). |
| KV cache | cache KV | K9, K10, K13 | 8 / 3 / 2 sayfa. Alternatif: "KV cache" (K9, K13), "cache nilai kunci" (K9, K13). cache İngilizce kelime, çevrilmiyor. |
| overhead | overhead | K9, K10 | İngilizce kelime Endonezce metinde. K9 tanımı: "Overhead: buffer untuk server inferensi dan overhead sistem lainnya" (K9); ayrıca "overhead mesin inferensi" (K9). 8 / 1 sayfa. Alternatif: "beban tambahan" (K30). |
| activations | aktivasi | K9, K4, K80 | 10 sayfa. "aktivasi perantara" (K9). |
| parameters | parameter | K4, K9 | 51 sayfa. Çoğulda değişmez: "beberapa miliar parameter" (K9). "parameters" (K85; 1 sayfa). |
| active parameters | parameter aktif | K47, K70 | 2 sayfa, yalnız MS GitHub. Alternatif: "parameter yang diaktifkan" (K47), "parameter yang aktif" (K47); ikisi de 1 sayfa. |
| unified memory | memori terpadu | K56, K45, K50, K53 | 4 / 1 sayfa; yalnız MS GitHub. Alternatif: "memori terintegrasi" (K42); Apple'ın resmî spesifikasyon sayfası, 9 geçiş, ör. "Memori terintegrasi 16 GB" (K42). |
| memory bandwidth | bandwidth memori | K42, K16, K19, K50, K53 | 5 sayfa, 3 yayıncı (Apple, Google, Microsoft). Rakip biçim yok. |
| precision | presisi | K9, K53, K80 | 25 sayfa; KBBI'de var (K92). "presisi BF16" (K9). Mixed precision: "presisi campuran" (K18, K82; 9 sayfa). K4'te presisi ayrıca sınıflandırma metriği (precision) olarak geçiyor; karıştırma. |
| quantization | kuantisasi | K4, K9, K10, K53 | 30 / 3 sayfa; KBBI'de fizik anlamıyla var (K88). Alternatif: İngilizce "quantization" (K44, K10, K54). kuantifikasi 0 sayfa. |
| quantized | dikuantisasi / model yang dikuantisasi | K9, K53, K10 | dikuantisasi 13 / terkuantisasi 6 sayfa. Alternatif: "terkuantisasi" (K75, K9), "model terkuantisasi" (K75, K9). Fiil: "mengkuantisasi" (K80, K81, K9). |
| checkpoint | checkpoint | K20, K29, K4 | 10 / 2 sayfa. Alternatif: "titik pemeriksaan" (K29, K4). |
| token | token | K24, K4, K5 | 41 sayfa; KBBI'de var (K91). Çoğulda değişmez: "1.500 token" (K9). "tokens" (K26, K12; 2 sayfa). |
| tokenizer | tokenizer | K4, K63, K36 | İngilizce kelime; 10 sayfa. "tokenisasi" (K24) tokenization demek, ayrı kavram. |
| vocabulary | kosakata | K4, K24, K21 | 6 sayfa. |
| embedding | embedding | K4, K67, K64, K8 | İngilizce kelime; 12 / 6 sayfa. Alternatif: "penyematan" (K25, K4, K24), "sematan" (K4, K8). Çoğul embeddings 6 sayfa (yalnız MS GitHub); Endonezce çoğulda değişmez. |
| layer | lapisan | K4, K6, K49 | 18 / 4 sayfa. Alternatif: İngilizce "layer" (K4, K82, K85). |
| attention | perhatian | K4, K6, K49, K63 | "mekanisme perhatian" (K4, K6, K49, K63), "lapisan perhatian" (K4, K10). 9 / 7 / 2 sayfa. Alternatif: İngilizce "attention" (K10, K82), "atensi" (K10, K16). "self-attention" (K6, K4; 5 sayfa) İngilizce kalıyor. Dikkat: "Perhatian:" (K18, K86) aynı zamanda uyarı başlığı. |
| attention head | head self-attention | K6 | 1 sayfa, 3 geçiş. Alternatif: "head atensi" (K16), "kepala self-attention" (K6). Üçü de 1 sayfa, Google → geçiş 3 / 1 / 1. Tek başına head da geçiyor: "parameter setiap head" (K6). Zayıf dayanak, bkz. dimensi head. |
| head dimension | dimensi head | K16 | 1 sayfa, 4 geçiş; ayrıca "dimensi head atensi" (K16). |
| query / key / value | kueri / kunci / nilai | K4, K10, K9 | "kueri" (K4), "kunci (K), dan nilai (V)" (K10), "satu untuk Kunci, satu untuk Nilai" (K9). nilai genel değer anlamında da çok sık. |
| feed-forward (layer) | lapisan feed-forward | K49 | 1 sayfa, tek kaynak. |
| MoE (mixture of experts) | mixture of experts (MoE) | K16, K70 | Açılım İngilizce: mixture of experts 3 sayfa (K4, K16, K70). "model MoE" (K47, K70). Alternatif: "campuran pakar" (K4), "campuran ahli" (K51); ikisi de 1 sayfa. |
| expert | ahli | K51, K68, K70 | MoE anlamında 3 / 1 sayfa, yalnız MS GitHub. Sayıdan sonra isim tekil kalır: "16 modul ahli" (K70) → `2 ahli`. Alternatif: "pakar" (K4; 18 geçiş, Google sözlüğü). ahli genel uzman anlamında da geçiyor. |
| dense (model) | padat / model padat | K16, K47, K70, K52 | 4 sayfa. K16 tablosunda mimari etiketi: "Padat" (K16). |
| sliding window attention | sliding window attention | K70 | İngilizce; 1 sayfa. "jendela geser" (K44) başka bir teknik (sliding window processing), kullanılmadı. |
| RoPE | RoPE | K49 | Kısaltma, çevrilmez. Açılım İngilizce: "Rotary Position Embeddings (RoPE)" (K49). |
| logits | logits | K77, K4, K70, K61 | İngilizce kelime; 4 sayfa. |
| inference | inferensi | K9, K4, K11 | 54 sayfa; KBBI'de var, genel anlamı: "simpulan" (K89). |
| serving / serve | menyajikan / penyajian | K15, K10, K11, K12, K32 | Fiil menyajikan, isim penyajian. "menyajikan model" (K15, K10), "penyajian model" (K32, K12), "framework penyajian" (K10, K15). İsim: penyajian 14 / penayangan 7 sayfa. Fiil: menyajikan 8 / melayani 7 sayfa → eşit, yayıncı 2 / 2, geçiş 40 / 10. Alternatif: "penayangan" (K12, K13; yalnız Google), "melayani" (K32, K30, K31). |
| inference engine | mesin inferensi | K9, K31, K53 | 9 sayfa. "server inferensi" (K9) inference server, ayrı kavram. |
| context | konteks | K4, K5, K9 | 42 sayfa, 5 yayıncı. |
| context window | jendela konteks | K4, K15, K10 | 11 sayfa. |
| context length | panjang konteks | K9, K10, K47 | 7 sayfa. |
| concurrent users | pengguna bersamaan | K30, K34, K70 | 3 / 1 sayfa, yalnız Microsoft. Alternatif: "pengguna serentak" (K16). |
| concurrent requests | permintaan serentak | K9, K16, K26 | 3 / 2 / 1 sayfa → eşit, yayıncı 2 / 1. Alternatif: "permintaan bersamaan" (K30, K49), "permintaan simultan" (K26). K9: "secara serentak oleh mesin inferensi" (K9). serentak ve bersamaan eş anlamlı; bu satır ile concurrent users satırı kural 5'le farklı kelimeye çıktı. Tek kelimeye çekmek dil sahibinin kararı. |
| prompt | prompt | K65, K28, K26, K4 | İngilizce kelime; çoğulda değişmez. 28 / 18 sayfa. "rekayasa prompt" (K65, K28) 6 / "rekayasa perintah" (K4, K7) 4 sayfa. Alternatif: "perintah" (K4, K28); aynı kaynaklar bunu komut anlamında da kullanıyor: "baris perintah" (K31, K36). |
| prefill | pra-pengisian | K11 | "waktu pra-pengisian tinggi versus waktu dekode tinggi" (K11). Alternatif: "pengisian awal" (K19), ör. "fase pengisian awal perintah" (K19). 1 / 1 sayfa, ikisi de Google, geçiş 1 / 1 → tam eşit; dekode ile aynı cümlede eşleştiği için pra-pengisian seçildi. "pengisian otomatis" (K12, K16) makine çevirisi hatası (autofill), sayılmadı. |
| decode | dekode | K11, K16 | Aşama anlamında 2 sayfa; KBBI'de bilişim (Komp) anlamıyla var (K93). Alternatif: İngilizce "decoding" (K12, K16; 2 sayfa) → tam eşit; KBBI ve K11'deki pra-pengisian eşleşmesi yüzünden dekode seçildi. |
| batch | batch | K4, K9, K16 | İngilizce kelime; 22 sayfa. |
| batch size | ukuran batch | K4, K9, K16, K29 | 9 / 3 / 1 sayfa. Alternatif: İngilizce "batch size" (K9, K58, K82), "ukuran tumpukan" (K4). |
| throughput | throughput | K26, K27, K9 | İngilizce kelime; 27 sayfa, rakip yok. Provisioned Throughput: Google "Throughput yang Disediakan" (K22), Microsoft "throughput yang disediakan" (K27, K32, K37); K27 ayrıca "throughput yang teralokasi" (K27). |
| latency | latensi | K26, K9, K12 | 40 sayfa; KBBI'de bilişim (Komp) anlamıyla var (K90). |
| TTFT | waktu hingga token pertama (TTFT) | K11, K12, K16 | Kısaltma çevrilmez, açılım Endonezce; 3 sayfa. Kaynaklarda başlık düzeni: "Waktu hingga Token Pertama" (K11, K12, K16). Alternatif: İngilizce "Time to First Token" (K26), "latensi token pertama" (K44, K26). |
| tokens per second | token per detik | K16, K46, K11, K49 | 4 / 3 sayfa → eşit, yayıncı 2 / 2, geçiş 7 / 4. Alternatif: "token/detik" (K41, K44, K49). Sitenin `tok/s` birim etiketi ayrı karar (dil sahibi). |
| requests per second | permintaan per detik (RPS) | K9 | "permintaan per detik" (K9, K11, K34; 3 sayfa). Alternatif: "kueri per detik" (K32). |
| sampling | sampling | K77, K66, K70, K61 | İngilizce kelime; 4 / 1 sayfa, yalnız MS GitHub. Alternatif: "pengambilan sampel" (K21), ör. "pengambilan sampel suhu" (K21). |
| temperature | suhu | K4, K21, K28, K56 | suhu 4 sayfa / 35 geçiş, temperatur 4 / 10, temperature 5 / 23 (yalnız MS GitHub) → eşit; yayıncı 2 / 2 / 1; geçiş suhu. K4 sözlük maddesinin başlığı suhu. Alternatif: "temperatur" (K4, K21), İngilizce "temperature" (K66, K63). |
| chat template | template chat | K47, K48 | 2 sayfa, yalnız MS GitHub. |
| speculative decoding | decoding spekulatif | K50, K53 | 2 sayfa, yalnız MS GitHub. |
| profiling | pembuatan profil | K35 | 1 sayfa, 8 geçiş (Visual Studio). |
| tensor parallelism | paralelisme tensor | K10, K9 | 6 / 1 sayfa. Alternatif: İngilizce "tensor parallelism" (K9). |
| pipeline parallelism | paralelisme pipeline | K9 | 1 sayfa, 3 geçiş. pipeline İngilizce kalıyor. |
| data parallelism | paralelisme data | K4, K33, K84 | 3 sayfa. |
| replica | replika | K12, K4, K11, K9 | 7 sayfa, yalnız Google. "1 replika" (K12). |
| capacity planning | perencanaan kapasitas | K34, K9, K51 | 3 sayfa. K34 başlığı: "Strategi arsitektur untuk perencanaan kapasitas" (K34). |
| SLO | tujuan tingkat layanan (SLO) | K9, K23 | Kısaltma çevrilmez, açılım Endonezce. |
| fine-tuning | fine-tuning | K69, K59, K20, K29, K2 | İngilizce kelime; 25 sayfa, 3 yayıncı. Fiil: "melakukan fine-tuning" (K69, K46), edilgen "di-fine-tune" (K64, K69). HF kursu: "melakukan model fine-tuning" (K2). Alternatif yazım: "fine tuning" (K85; 8 sayfa), "finetuning" (K82; 7 sayfa). Google genel tuning için "penyesuaian" (K20, K4) kullanıyor; Microsoft Learn başlık fiili "Menyempurnakan" (K29). |
| instruction tuning / instruction-tuned (instruct) model | penyesuaian instruksi / model instruction-tuned | K4, K9 | İsim biçimi yalnız K4'te, 1 geçiş; İngilizce instruction tuning 0 sayfa. Sıfat "instruction-tuned" (K4, K9, K65; 3 sayfa); K4: "mengikuti perintah (instruction-tuned)" (K4). Alternatif: "model yang di-tune untuk mengikuti perintah" (K10, K15), "model instruksi" (K48, K52), "disetel dengan instruksi" (K59), "disesuaikan dengan instruksi" (K65). Model adlarındaki Instruct değişmez: "Phi-4-mini-instruct" (K46, K52). İsim biçimi fine-tuning ailesiyle uyuşmuyor (penyesuaian / fine-tuning); bkz. Yazım kuralları, Terim ailesi notu. |
| full fine-tuning | fine-tuning penuh | K20, K4 | 2 / 1 / 1 sayfa → eşit; yayıncı 1 / 1 / 1; geçiş 8 / 4 / 2. Alternatif: "full fine-tuning" (K59), "penyesuaian penuh" (K4). |
| LoRA | LoRA (Low-Rank Adaptation) | K82, K56, K69 | Kısaltma ve açılım İngilizce; 3 sayfa. Ters sıra da var: "Low-Rank Adaptation (LoRA)" (K56, K59). K4 açılımı farklı yazıyor: "Low-Rank Adaptability" (K4). |
| QLoRA | QLoRA | K59, K83 | Kısaltma. |
| rank | peringkat | K4, K59 | LoRA bağlamında "dekomposisi peringkat" (K4, K59); 2 sayfa. Alternatif: İngilizce "rank" (K82). |
| adapter | adaptor | K13, K11, K20 | "adaptor LoRA" (K13, K11, K20); 3 sayfa / 12 geçiş. Alternatif: "adapter LoRA" (K86); adapter 3 sayfa / 7 geçiş (K86, K59, K79) → eşit, yayıncı 1 / 1, geçiş adaptor. KBBI'de adapter maddesi adaptor'a yönlendiriyor (K95, K94). |
| gradient checkpointing | checkpointing gradien | K59 | 1 sayfa, tek kaynak. |
| optimizer | optimizer | K4, K85 | 2 sayfa. Alternatif: "pengoptimal" (K4). Adam adı değişmez. |
| sequence length | panjang urutan | K85 | 1 sayfa. urutan sequence anlamında: "cache KV untuk satu urutan" (K9). |
| GPU | GPU | K9, K18 | Kısaltma, çevrilmez; çoğulda değişmez: "dua GPU NVIDIA H100" (K9). "GPUs" (K48; 1 sayfa). |
| graphics card | kartu grafis | K40, K38, K41, K39 | 4 sayfa, NVIDIA. |
| card | kartu | K40, K38 | "Dimensi Kartu" (K40), "produsen kartu tambahan" (K38), "kartu GPU" (K85). |
| tensor throughput (TFLOPS) | performa Tensor | K18 | "Performa Tensor mengacu pada throughput" (K18). TFLOPS kısaltma, çevrilmez (K18, K40, K16). |
| sparsity | ketersebaran | K4, K18 | 2 sayfa. Alternatif: "kerenggangan" (K4). |
| 2:4 structured sparsity | ketersebaran struktural | K18 | Alternatif: "sparse struktural" (K18; aynı sayfa). |
| form factor | faktor bentuk | K43 | 1 sayfa. |
| MIG | GPU multi-instance | K14, K9 | 2 sayfa. Kısaltma MIG bu sayfalarda yazılmıyor; metinde `GPU multi-instance (MIG)` yazılabilir (kural 4). Çakışma: K18'de MIG başka kavram: "grup instance terkelola (MIG)" (K18; managed instance group). |
| repository | repositori | K9, K12, K15 | 18 sayfa. |
| model card | kartu model | K64, K17, K36, K47, K85 | 5 / 3 sayfa. Alternatif: İngilizce "model card" (K64, K82). |
| config / config.json | konfigurasi | K9, K29 | 49 sayfa. "konfigurasi model" (K9, K29). config.json dosya adı, değişmez. |
| open weights | open-weight / model open-weight | K64, K16 | 3 / 2 sayfa → eşit, yayıncı 2 / 1. Tiresiz yazım: "model open weight" (K17). Alternatif: "bobot terbuka" (K48, K49). "model terbuka" (K17) open model demek, daha geniş kavram. |
| LLM | model bahasa besar (LLM) | K10, K24, K16 | Çoğulda değişmez: LLM 47 / LLMs 7 sayfa. Alternatif: "LLMs" (K64). |
| calculator | kalkulator | K26, K27 | "kalkulator kapasitas" (K26, K27); bu Azure'un başka bir aracı, ad olarak alınmamalı. |

## İngilizce kalanlar

| EN | Neden |
|---|---|
| hidden size | Birincil kaynakta karşılık yok. K9'da yalnız yapılandırma anahtarı `hidden_size` olarak geçiyor; "lapisan tersembunyi" (K4) hidden layer demek, başka kavram. |
| MTP (multi-token prediction) | Kaynak yok: multi-token 0 sayfa. Kısaltma çevrilmez. |
| CUDA graphs | Kaynak yok: CUDA graph ve grafik CUDA 0 sayfa. CUDA kısaltma, çevrilmez. |
| expert parallelism | Bileşik kaynakta yok: expert parallelism, paralelisme ahli, paralelisme pakar 0 sayfa. Parçaları ayrı ayrı kaynaklı (paralelisme, ahli); kaynakta görülmeyen bileşik kurulmadı. |
| datasheet | Kaynak yok: datasheet ve lembar data 0 sayfa (NVIDIA veri merkezi sayfalarının Endonezcesi yok). |
| gated model | Birincil kaynakta karşılık yok: gated 0 sayfa. "akses terbatas" (K46) GPU altyapısına sınırlı erişim anlamında, başka kavram. |
| headroom | Kaynak yok: headroom 0 sayfa. "ruang tambahan" (K13) İngilizce sayfadaki *additional room* çevirisi (İngilizce sayfayla karşılaştırıldı); kapasite payı anlamı taşımıyor, kullanılmadı. |
| capacity planner | Araç adı olarak kaynak yok; perencana kapasitas 0 sayfa. Microsoft Cosmos DB'nin eski Capacity Planner sayfası artık "Estimator Biaya" (K37) adını taşıyor. "kalkulator kapasitas" (K26, K27) başka bir Azure aracı. capacity planning kaynaklı: perencanaan kapasitas. |
| Grouped-Query Attention (GQA açılımı) | Açılım Endonezce metinde İngilizce: "grouped-query attention" (K52); Endonezce karşılık yok. GQA kısaltması derlemde 0 sayfa. |
| Multi-Query Attention (MQA açılımı) | Açılım İngilizce: "multiquery attention" (K68; tiresiz); Endonezce karşılık yok. |
| Multi-head Latent Attention (MLA açılımı) | Kaynak yok. |
| multi-head attention (MHA açılımı) | Doğrudan karşılık yok; kaynak yalnız self-attention biçimini veriyor: "self-attention multi-head" (K4). |
| MHA / GQA / MQA / MLA | Kısaltma, çevrilmez (kural 4); dördü de derlemde 0 sayfa. |
| token, prompt, embedding, logits, overhead, throughput, batch, checkpoint, tokenizer, sampling, fine-tuning, self-attention, mixture of experts, instruction-tuned, open-weight, cache (cache KV içinde), pipeline (paralelisme pipeline içinde), head (head self-attention içinde) | Kaynakların çoğu bu kelimeleri Endonezce metinde İngilizce kullanıyor. Kaynakları ve sayımları Terimler tablosunda. Çoğulda değişmezler (`token`, `prompt`; tokens ve embeddings azınlık). |
| Kısaltmalar: VRAM, GPU, KV, MoE, MHA, GQA, MQA, MLA, LoRA, QLoRA, BF16, FP8, INT4, TTFT, RPS, SLO, MIG, RoPE, MTP, CUDA, TFLOPS, LLM | Kural 4: kısaltma çevrilmez. Açılım gerekiyorsa Terimler tablosundaki açılım kullanılır. |
| Adlar: vLLM, LLMScale, Hugging Face, NVLink, Adam, config.json | Ürün, kütüphane ve dosya adları değişmez. |

## Yazım kuralları

Yalnız kaynaklarda gözlenen kullanım. Karar dil sahibinindir.

- **Hitap.** Anda, büyük harfle. Google 20 sayfa / 1021 geçiş, Microsoft Learn 14 / 548, Microsoft GitHub 42 / 482, NVIDIA 3 / 108, Apple 1 / 14. Örnek: "Anda dapat menggunakan konfigurasi GPU multi-instance" (K9). HF kursu küçük harfle *anda* yazıyor (K1–K3, 50 geçiş). kamu neredeyse yok: 4 sayfa, her birinde 1 geçiş (K4, K65, K77, K85). Öneri: Anda.
- **Ondalık ve binlik ayırıcı.** Ondalıkta virgül, binlikte nokta: "~0,31 GB" (K9), "1.500 token" (K9), "80,0%" (K16), "1.800 TFLOPS" (K16), "141 GB (4,8 TBps)" (K18), "14,2 inci" (K42), "1.000 nit" (K42). MS GitHub karışık: "3,8 miliar parameter" (K85) ama "3.8 miliar parameter" (K52); model boyutu etiketlerinde nokta ("1.5B-7B" (K47)). Microsoft Learn makine çevirisi tabloda İngilizce ayırıcıyı korumuş: "24,000" (K26).
- **Sitenin çıktısı.** Site sayıları `Intl` `id-ID-u-nu-latn` ile biçimliyor. Build makinesinde Node 24.21 ile ölçüldü: 1234.5 → `1.234,5`; 12345.67 → `12.345,67`; 131072 → `131.072`; 27000000000 → `27.000.000.000`; 0.31 → `0,31`; yüzde 0.05 → `5%`, 0.855 → `85,5%`. Yani çıktı Google ve Apple kaynaklarıyla aynı biçimde.
- **Yüzde.** İşaret sayıya bitişik: "80,0%" (K16), "100%" (K9). Derlemde boşluklu yüzde 0 sayfa (25 sayfada bitişik). Sitenin `5%` / `85,5%` çıktısıyla uyumlu.
- **Başlıklarda büyük harf.** Google ve Microsoft Learn cümle düzeni: "Ringkasan praktik terbaik inferensi di GKE" (K9), "Performa dan tolok ukur akselerator AI" (K16), "Memahami throughput vs latensi" (K26). MS GitHub ve NVIDIA Title Case: "Dasar-dasar Rekayasa Prompt" (K65), "Menyesuaikan Model untuk Tugas Spesifik" (K59), "Platform Terbaik untuk Gamer dan Kreator" (K38). HF: "Pemrosesan Bahasa Natural" (K3).
- **Büyük sayılar.** billion → miliar, trillion → triliun: "Gemma 3 27 miliar" (K9), "3,8 miliar parameter" (K85), "4 triliun token" (K49). MS GitHub kısa yazım da kullanıyor: "5T token" (K52), "235B parameter" (K47).
- **Birim.** Google sayı ile birim arasında boşluk ya da bölünmez boşluk (U+00A0) bırakıyor: "~1,13 GB" (K9). Apple bölünmez boşluk: "16 GB" (K42). MS GitHub çoğunlukla bitişik (13 sayfa / 47 geçiş bitişik, 3 / 7 boşluklu): "6GB" (K52). NVIDIA düzyazıda bitişik ("32GB memori GDDR7" (K38)), spesifikasyon tablosunda boşluklu.
- **Çoğul.** Sayıdan sonra isim tekil kalır, ikileme yapılmaz: "1.500 token" (K9), "dua GPU NVIDIA H100" (K9), "dua lapisan tersembunyi" (K4), "1 replika" (K12), "16 modul ahli" (K70). İkilemeli çoğul yalnız sayı yokken ve seyrek: "model-model Transformer" (K2, K3; model-model toplam 10 sayfa). token-token, lapisan-lapisan, parameter-parameter, GPU-GPU 0 sayfa.
- **Yabancı terim.** HF kursu İngilizce terimleri italik yazıyor (K2: *natural language processing*, *fine-tuning*, *machine learning*). Google ve Microsoft düz yazıyor: "overhead mesin inferensi" (K9), "fine-tuning penuh" (K20); italik yalnız vurgu için. İlk geçişte parantezli açıklama: "natural language processing (pemrosesan bahasa natural)" (K2), "Pemrosesan Bahasa Natural (Natural Language Processing)" (K3), "mengikuti perintah (instruction-tuned)" (K4).
- **İngilizce köke Endonezce ek.** Ek tireyle bağlanıyor: "men-deploy" (K9; 12 sayfa), "di-deploy" (K17; 7 sayfa), "di-fine-tune" (K64, K69; 8 sayfa), "meng-cache" (K4, K7, K15), "di-cache" (K7, K12, K30). Endonezceleşmiş kökte tire yok: "mengkuantisasi" (K81).
- **Terim ailesi notu.** fine-tuning İngilizce kaldığı hâlde instruction tuning isim biçimi kaynakta yalnız "penyesuaian instruksi" (K4). Sitede sıfat kullanımı (`model instruction-tuned`) kaynaklı ve fine-tuning ile uyumlu; isim biçimi tek sayfaya dayanıyor.

## Uygulamada verilen kararlar (Dalga 2)

- **Sayılar.** Düzyazıdaki sabit sayılar id-ID yazımında: "0,13 GiB", "1.564". Sürüm numaraları, komut satırı ve config değerleri, kod ve log örnekleri değişmez ("vLLM 0.31", `--gpu-memory-utilization 0.92`).
- **Sayıdan sonra tekil.** Birim anahtarlarının çoğulu da tekil yazılır: "2 ahli", "32 lapisan".
- **Büyük harf.** Menü ve araç adları Title Case ("Rencana Kapasitas", "Perbandingan GPU"); sayfa başlıkları ve öteki başlıklar cümle düzeninde.
- **field / kolom.** config.json alanı "field" (İngilizce kalır); "kolom" yalnız tablo sütunu ve matris sütunu için.
- **Sözlükte olmayıp seçilenler.** Feed → Berita; GPU karşılaştırması → Perbandingan GPU (Perbandingan Model ile aynı kalıp).

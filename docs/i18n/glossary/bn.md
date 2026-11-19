# Terim sözlüğü — বাংলা (bn)

Durum: Dalga 2 (2026-11-19). Kaynak dil EN. Kural: docs/i18n-plan.md §4 — karşılık birincil kaynaktan, kaynaksız terim İngilizce kalır.

Hedef: tek `bn` sürümü; Bangladeş ve Hindistan okuru aynı metni okur. Konuşan sayısı: Hindistan 2011 sayımı (C-16 tablosu, birincil: https://censusindia.gov.in/nada/index.php/catalog/42458/download/46089/C-16_25062018.pdf) Bengalce ana dil 97.237.669 kişi (nüfusun %8,03'ü); en çok Batı Bengal 78.698.852, Assam 9.024.324, Jharkhand 3.213.423, Tripura 2.414.774. Bangladeş 2022 sayımında 165.158.616 kişinin 163.507.029'u Bengalce konuşuyor (%99,0; ikincil: https://en.wikipedia.org/wiki/Languages_of_Bangladesh, BBS tablosu doğrudan okunmadı). Ethnologue 2026: toplam 274, ana dil 234 milyon (docs/i18n-plan.md Ek A); Wikipedia'daki Ethnologue değeri 284 / 242 milyon (baskı farkı; ikincil: https://en.wikipedia.org/wiki/Bengali_language). İki ülkenin toplamında okurun yaklaşık %63'ü Bangladeş'te, %37'si Hindistan'da (sayım yılları farklı, 2022 / 2011; ikincil sayılar 2026-11-19'da okundu).

Kaynakların bölgesi: hiçbir kaynak bölge kodu taşımıyor (Hugging Face `bn`, Google `hl=bn`, Microsoft `translations/bn`); Microsoft Learn `bn-in` ve `bn-bd` adreslerinde içerik yok. Teknik terimde bölgeye bağlanabilecek sözcük farkı görülmedi. Yazımda kaynaklar ayrışıyor ama ayrım bölgeyle etiketli değil: Google Gemini yardım sayfaları (K8) yalnız -গুলি ve হল yazıyor, Google ML sayfaları (K3) çoğunlukla -গুলো ve হলো, Microsoft karışık (sayılar Yazım kuralları'nda). Bu farkı Bangladeş ya da Hindistan'a bağlamak doğrulanmadı. Para birimi örneği az: "ভারতীয় রুপি" (K3a) çeviri örneği; "টাকা" (K4a) yalnız 1 sayfada.

Site bağlamı: `LANG_META.bn` bugün og:locale `bn_IN`, Intl `bn-BD-u-nu-latn`, hreflang `bn`; tek bölgeye çekilecek. Node 24.21'de bn-BD ve bn-IN Intl çıktısı aynı (Yazım kuralları'nda). Bu sözlükteki biçimler iki bölge için de aynıdır; bölge seçimi terimleri değiştirmez.

## Kaynaklar

Her sayfa 2026-11-19'da indirildi, metne çevrildi (HTML'de gövde metni; Markdown'da kod blokları ve HTML yorumları çıkarıldı) ve terim o metinde Unicode NFC olarak arandı. Tablodaki her biçim, kaynak sütununda adı geçen sayfalardan en az birinde sözcük başı sınırıyla geçiyor; notlardaki tırnaklı her biçim de yanındaki parantezde adı geçen her sayfada geçiyor (otomatik denetim: 219 biçim, hepsi bulundu; "0 sayfa" denen 17 biçim derlemde gerçekten yok). Aşağıda her kaynağın yalnız bu dosyada adı geçen sayfaları listeli; sayımlar kaynağın derleme giren bütün sayfaları üzerinden.

Uyarı: K1 ve K2 dışındaki kaynakların çoğu makine çevirisi. K3 sayfalarının dil kodu `bn-x-mtfrom-en` (İngilizceden makine çevirisi); sözlük maddelerinin bir kısmında başlık Bengalce, gövde İngilizce kalmış (ör. "পরিবেশন করা" (K3a) başlığının altı İngilizce). K4–K7, K9 ve K10 dosyalarının çoğunun sonunda Co-op Translator uyarısı var ("bu belge AI çeviri hizmetiyle çevrildi"). K8'in çeviri yöntemi sayfada yazmıyor. Makine çevirisinin tutarsız yazımları tabloda alternatif olarak not edildi; tablodaki biçimi aynen kullan.

- [K1] Hugging Face LLM Course, Bengalce. Topluluk çevirisi; Bengalcede yalnız 3 sayfa var (`huggingface/course` reposu `chapters/bn`: chapter0/1, chapter1/1, chapter2/1). Derleme 3 sayfa girdi.
  - [K1a] Bölüm 2.1 — https://huggingface.co/learn/llm-course/bn/chapter2/1 (okunma tarihi 2026-11-19)
  - [K1b] Bölüm 1.1 — https://huggingface.co/learn/llm-course/bn/chapter1/1 (okunma tarihi 2026-11-19)
- [K2] Hugging Face Audio Course, Bengalce. Topluluk çevirisi; derleme 15 sayfa girdi (bölüm 0–2 ve events/introduction). Kök: https://huggingface.co/learn/audio-course/bn/
  - [K2a] chapter1/preprocessing — https://huggingface.co/learn/audio-course/bn/chapter1/preprocessing (okunma tarihi 2026-11-19)
  - [K2b] chapter2/asr_pipeline — https://huggingface.co/learn/audio-course/bn/chapter2/asr_pipeline (okunma tarihi 2026-11-19)
  - [K2c] chapter1/introduction — https://huggingface.co/learn/audio-course/bn/chapter1/introduction (okunma tarihi 2026-11-19)
  - [K2d] chapter1/audio_data — https://huggingface.co/learn/audio-course/bn/chapter1/audio_data (okunma tarihi 2026-11-19)
  - [K2e] chapter1/streaming — https://huggingface.co/learn/audio-course/bn/chapter1/streaming (okunma tarihi 2026-11-19)
  - [K2f] chapter1/load_and_explore — https://huggingface.co/learn/audio-course/bn/chapter1/load_and_explore (okunma tarihi 2026-11-19)
- [K3] Google for Developers, Machine Learning sözlüğü ve Crash Course, `?hl=bn`. Makine çevirisi (`bn-x-mtfrom-en`). Derleme 10 sayfa girdi: glossary, glossary/generative, glossary/fundamentals, crash-course/llm, llm/transformers, llm/tuning, embeddings, embeddings/embedding-space, embeddings/obtaining-embeddings, neural-networks/nodes-hidden-layers.
  - [K3a] glossary — https://developers.google.com/machine-learning/glossary?hl=bn (okunma tarihi 2026-11-19)
  - [K3b] glossary/generative — https://developers.google.com/machine-learning/glossary/generative?hl=bn (okunma tarihi 2026-11-19)
  - [K3c] crash-course/llm/tuning — https://developers.google.com/machine-learning/crash-course/llm/tuning?hl=bn (okunma tarihi 2026-11-19)
  - [K3d] crash-course/llm/transformers — https://developers.google.com/machine-learning/crash-course/llm/transformers?hl=bn (okunma tarihi 2026-11-19)
  - [K3e] crash-course/embeddings/obtaining-embeddings — https://developers.google.com/machine-learning/crash-course/embeddings/obtaining-embeddings?hl=bn (okunma tarihi 2026-11-19)
  - [K3f] crash-course/embeddings/embedding-space — https://developers.google.com/machine-learning/crash-course/embeddings/embedding-space?hl=bn (okunma tarihi 2026-11-19)
  - [K3g] glossary/fundamentals — https://developers.google.com/machine-learning/glossary/fundamentals?hl=bn (okunma tarihi 2026-11-19)
  - [K3h] crash-course/neural-networks/nodes-hidden-layers — https://developers.google.com/machine-learning/crash-course/neural-networks/nodes-hidden-layers?hl=bn (okunma tarihi 2026-11-19)
  - [K3i] crash-course/embeddings — https://developers.google.com/machine-learning/crash-course/embeddings?hl=bn (okunma tarihi 2026-11-19)
- [K4] Microsoft, Edge AI for Beginners, `translations/bn`. Makine çevirisi (87 dosyanın 72'sinde Co-op Translator uyarısı). Derleme 87 dosya girdi. Kök: https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/
  - [K4a] WorkshopForAgentic/md/01.BuildAIAgentWithSLM.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/WorkshopForAgentic/md/01.BuildAIAgentWithSLM.md (okunma tarihi 2026-11-19)
  - [K4b] Module05/03.SLMOps-Finetuing.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module05/03.SLMOps-Finetuing.md (okunma tarihi 2026-11-19)
  - [K4c] Workshop/notebooks/TROUBLESHOOTING.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Workshop/notebooks/TROUBLESHOOTING.md (okunma tarihi 2026-11-19)
  - [K4d] Module04/02.Llamacpp.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/02.Llamacpp.md (okunma tarihi 2026-11-19)
  - [K4e] Workshop/notebooks/quickstart.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Workshop/notebooks/quickstart.md (okunma tarihi 2026-11-19)
  - [K4f] Module03/03.DeployingSLMinCloud.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module03/03.DeployingSLMinCloud.md (okunma tarihi 2026-11-19)
  - [K4g] Module02/04.BitNETFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module02/04.BitNETFamily.md (okunma tarihi 2026-11-19)
  - [K4h] Module02/03.GemmaFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module02/03.GemmaFamily.md (okunma tarihi 2026-11-19)
  - [K4i] Module01/02.RealWorldCaseStudies.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module01/02.RealWorldCaseStudies.md (okunma tarihi 2026-11-19)
  - [K4j] Module07/README.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module07/README.md (okunma tarihi 2026-11-19)
  - [K4k] Module04/07.QualcommQNN.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/07.QualcommQNN.md (okunma tarihi 2026-11-19)
  - [K4l] Module06/01.IntroduceAgent.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module06/01.IntroduceAgent.md (okunma tarihi 2026-11-19)
  - [K4m] Module01/01.EdgeAIFundamentals.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module01/01.EdgeAIFundamentals.md (okunma tarihi 2026-11-19)
  - [K4n] Module02/02.QwenFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module02/02.QwenFamily.md (okunma tarihi 2026-11-19)
  - [K4o] Module04/05.AppleMLX.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/05.AppleMLX.md (okunma tarihi 2026-11-19)
  - [K4p] Module04/06.workflow-synthesis.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/06.workflow-synthesis.md (okunma tarihi 2026-11-19)
  - [K4q] Module04/README.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/README.md (okunma tarihi 2026-11-19)
  - [K4r] Module03/01.SLMAdvancedLearning.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module03/01.SLMAdvancedLearning.md (okunma tarihi 2026-11-19)
  - [K4s] Module04/01.Introduce.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/01.Introduce.md (okunma tarihi 2026-11-19)
  - [K4t] Module04/03.MicrosoftOlive.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module04/03.MicrosoftOlive.md (okunma tarihi 2026-11-19)
  - [K4u] Module01/03.PracticalImplementationGuide.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module01/03.PracticalImplementationGuide.md (okunma tarihi 2026-11-19)
  - [K4v] Module02/01.PhiFamily.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module02/01.PhiFamily.md (okunma tarihi 2026-11-19)
  - [K4w] Module08/samples/08/README.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module08/samples/08/README.md (okunma tarihi 2026-11-19)
  - [K4x] Module05/02.SLMOps-Distillation.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module05/02.SLMOps-Distillation.md (okunma tarihi 2026-11-19)
  - [K4y] Module02/06.phisilica.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module02/06.phisilica.md (okunma tarihi 2026-11-19)
  - [K4z] Workshop/Session03-OpenSourceModels.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Workshop/Session03-OpenSourceModels.md (okunma tarihi 2026-11-19)
  - [K4aa] Workshop/Session04-CuttingEdgeModels.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Workshop/Session04-CuttingEdgeModels.md (okunma tarihi 2026-11-19)
  - [K4ab] Workshop/ENV_CONFIGURATION.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Workshop/ENV_CONFIGURATION.md (okunma tarihi 2026-11-19)
  - [K4ac] Workshop/Readme.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Workshop/Readme.md (okunma tarihi 2026-11-19)
  - [K4ad] Module02/README.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module02/README.md (okunma tarihi 2026-11-19)
  - [K4ae] Module07/aitoolkit.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module07/aitoolkit.md (okunma tarihi 2026-11-19)
  - [K4af] Module05/README.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module05/README.md (okunma tarihi 2026-11-19)
  - [K4ag] Module07/windowdeveloper.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module07/windowdeveloper.md (okunma tarihi 2026-11-19)
  - [K4ah] Module01/04.EdgeDeployment.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module01/04.EdgeDeployment.md (okunma tarihi 2026-11-19)
  - [K4ai] Module05/01.IntroduceSLMOps.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module05/01.IntroduceSLMOps.md (okunma tarihi 2026-11-19)
  - [K4aj] Module06/03.IntroduceMCP.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module06/03.IntroduceMCP.md (okunma tarihi 2026-11-19)
  - [K4ak] introduction.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/introduction.md (okunma tarihi 2026-11-19)
  - [K4al] Module08/03.OpenSourceModels.md — https://github.com/microsoft/edgeai-for-beginners/blob/main/translations/bn/Module08/03.OpenSourceModels.md (okunma tarihi 2026-11-19)
- [K5] Microsoft, Generative AI for Beginners, `translations/bn`. Makine çevirisi (34 dosyanın 33'ünde uyarı). Derleme 34 dosya girdi.
  - [K5a] 16-open-source-models/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/16-open-source-models/README.md (okunma tarihi 2026-11-19)
  - [K5b] 02-exploring-and-comparing-different-llms/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/02-exploring-and-comparing-different-llms/README.md (okunma tarihi 2026-11-19)
  - [K5c] 19-slm/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/19-slm/README.md (okunma tarihi 2026-11-19)
  - [K5d] 01-introduction-to-genai/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/01-introduction-to-genai/README.md (okunma tarihi 2026-11-19)
  - [K5e] 15-rag-and-vector-databases/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/15-rag-and-vector-databases/README.md (okunma tarihi 2026-11-19)
  - [K5f] 08-building-search-applications/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/08-building-search-applications/README.md (okunma tarihi 2026-11-19)
  - [K5g] 20-mistral/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/20-mistral/README.md (okunma tarihi 2026-11-19)
  - [K5h] 04-prompt-engineering-fundamentals/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/04-prompt-engineering-fundamentals/README.md (okunma tarihi 2026-11-19)
  - [K5i] 05-advanced-prompts/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/05-advanced-prompts/README.md (okunma tarihi 2026-11-19)
  - [K5j] 06-text-generation-apps/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/06-text-generation-apps/README.md (okunma tarihi 2026-11-19)
  - [K5k] 18-fine-tuning/README.md — https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/bn/18-fine-tuning/README.md (okunma tarihi 2026-11-19)
- [K6] Microsoft, Phi Cookbook, `translations/bn`. Makine çevirisi (95 dosyanın 95'inde uyarı). Derleme 95 dosya girdi.
  - [K6a] md/01.Introduction/04/QuantifyingPhi.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/04/QuantifyingPhi.md (okunma tarihi 2026-11-19)
  - [K6b] md/01.Introduction/03/Rust_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/Rust_Inference.md (okunma tarihi 2026-11-19)
  - [K6c] md/01.Introduction/03/overview.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/overview.md (okunma tarihi 2026-11-19)
  - [K6d] md/01.Introduction/03/MLX_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/MLX_Inference.md (okunma tarihi 2026-11-19)
  - [K6e] md/03.FineTuning/FineTuning_Phi-3-visionWandB.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/FineTuning_Phi-3-visionWandB.md (okunma tarihi 2026-11-19)
  - [K6f] README.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/README.md (okunma tarihi 2026-11-19)
  - [K6g] md/01.Introduction/04/UsingORTGenAIQuantifyingPhi.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/04/UsingORTGenAIQuantifyingPhi.md (okunma tarihi 2026-11-19)
  - [K6h] md/01.Introduction/03/Remote_Interence.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/Remote_Interence.md (okunma tarihi 2026-11-19)
  - [K6i] md/01.Introduction/03/Kaito_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/Kaito_Inference.md (okunma tarihi 2026-11-19)
  - [K6j] md/03.FineTuning/olive-lab/readme.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/olive-lab/readme.md (okunma tarihi 2026-11-19)
  - [K6k] md/01.Introduction/03/Jetson_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/Jetson_Inference.md (okunma tarihi 2026-11-19)
  - [K6l] md/03.FineTuning/FineTuning_MLSDK.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/FineTuning_MLSDK.md (okunma tarihi 2026-11-19)
  - [K6m] md/01.Introduction/02/02.GitHubModel.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/02/02.GitHubModel.md (okunma tarihi 2026-11-19)
  - [K6n] md/03.FineTuning/FineTuning_Scenarios.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/FineTuning_Scenarios.md (okunma tarihi 2026-11-19)
  - [K6o] md/03.FineTuning/Finetuning_VSCodeaitoolkit.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/Finetuning_VSCodeaitoolkit.md (okunma tarihi 2026-11-19)
  - [K6p] md/03.FineTuning/FineTuning_vs_RAG.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/FineTuning_vs_RAG.md (okunma tarihi 2026-11-19)
  - [K6q] md/03.FineTuning/FineTuning_Vision.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/FineTuning_Vision.md (okunma tarihi 2026-11-19)
  - [K6r] code/03.Finetuning/olive-ort-example/README.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/code/03.Finetuning/olive-ort-example/README.md (okunma tarihi 2026-11-19)
  - [K6s] md/03.FineTuning/FineTuning_AIFoundry.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/03.FineTuning/FineTuning_AIFoundry.md (okunma tarihi 2026-11-19)
  - [K6t] md/01.Introduction/01/01.Hardwaresupport.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/01/01.Hardwaresupport.md (okunma tarihi 2026-11-19)
  - [K6u] md/01.Introduction/03/AIPC_Inference.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/01.Introduction/03/AIPC_Inference.md (okunma tarihi 2026-11-19)
  - [K6v] md/04.HOL/dotnet/readme.md — https://github.com/microsoft/PhiCookBook/blob/main/translations/bn/md/04.HOL/dotnet/readme.md (okunma tarihi 2026-11-19)
- [K7] Microsoft, AI for Beginners, `translations/bn`. Makine çevirisi (60 dosyanın 38'inde uyarı). Derleme 60 dosya girdi.
  - [K7a] lessons/5-NLP/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/5-NLP/README.md (okunma tarihi 2026-11-19)
  - [K7b] lessons/5-NLP/14-Embeddings/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/5-NLP/14-Embeddings/README.md (okunma tarihi 2026-11-19)
  - [K7c] lessons/5-NLP/13-TextRep/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/5-NLP/13-TextRep/README.md (okunma tarihi 2026-11-19)
  - [K7d] lessons/5-NLP/18-Transformers/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/5-NLP/18-Transformers/README.md (okunma tarihi 2026-11-19)
  - [K7e] lessons/5-NLP/17-GenerativeNetworks/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/5-NLP/17-GenerativeNetworks/README.md (okunma tarihi 2026-11-19)
  - [K7f] lessons/4-ComputerVision/11-ObjectDetection/lab/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/4-ComputerVision/11-ObjectDetection/lab/README.md (okunma tarihi 2026-11-19)
  - [K7g] lessons/3-NeuralNetworks/05-Frameworks/README.md — https://github.com/microsoft/AI-For-Beginners/blob/main/translations/bn/lessons/3-NeuralNetworks/05-Frameworks/README.md (okunma tarihi 2026-11-19)
- [K8] Google, Gemini Apps Yardım Merkezi, `?hl=bn`. Derleme 4 sayfa girdi (16275805, 13594961, 14903178, 15235603).
  - [K8a] 16275805 — Google AI abonelerinin Gemini uygulaması kullanım sınırları — https://support.google.com/gemini/answer/16275805?hl=bn (okunma tarihi 2026-11-19)
  - [K8b] 14903178 — Gemini'ye dosya yükleme — https://support.google.com/gemini/answer/14903178?hl=bn (okunma tarihi 2026-11-19)
  - [K8c] 13594961 — Gemini uygulamaları gizlilik merkezi — https://support.google.com/gemini/answer/13594961?hl=bn (okunma tarihi 2026-11-19)
- [K9] Microsoft, AI Agents for Beginners, `translations/bn`. Makine çevirisi (46 dosyanın 46'sında uyarı). Derleme 46 dosya girdi.
  - [K9a] 17-creating-local-ai-agents/README.md — https://github.com/microsoft/ai-agents-for-beginners/blob/main/translations/bn/17-creating-local-ai-agents/README.md (okunma tarihi 2026-11-19)
  - [K9b] 16-deploying-scalable-agents/README.md — https://github.com/microsoft/ai-agents-for-beginners/blob/main/translations/bn/16-deploying-scalable-agents/README.md (okunma tarihi 2026-11-19)
  - [K9c] 11-agentic-protocols/code_samples/mcp-agents/README.md — https://github.com/microsoft/ai-agents-for-beginners/blob/main/translations/bn/11-agentic-protocols/code_samples/mcp-agents/README.md (okunma tarihi 2026-11-19)
  - [K9d] 08-multi-agent/code_samples/workflows-agent-framework/dotNET/01.dotnet-agent-framework-workflow-ghmodel-basic.md — https://github.com/microsoft/ai-agents-for-beginners/blob/main/translations/bn/08-multi-agent/code_samples/workflows-agent-framework/dotNET/01.dotnet-agent-framework-workflow-ghmodel-basic.md (okunma tarihi 2026-11-19)
  - [K9e] 05-agentic-rag/README.md — https://github.com/microsoft/ai-agents-for-beginners/blob/main/translations/bn/05-agentic-rag/README.md (okunma tarihi 2026-11-19)
- [K10] Microsoft, MCP for Beginners, `translations/bn`. Makine çevirisi (146 dosyanın 146'sında uyarı). Derleme 146 dosya girdi.
  - [K10a] 05-AdvancedTopics/mcp-contextengineering/README.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/05-AdvancedTopics/mcp-contextengineering/README.md (okunma tarihi 2026-11-19)
  - [K10b] 11-MCPServerHandsOnLabs/00-Introduction/README.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/11-MCPServerHandsOnLabs/00-Introduction/README.md (okunma tarihi 2026-11-19)
  - [K10c] 08-BestPractices/README.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/08-BestPractices/README.md (okunma tarihi 2026-11-19)
  - [K10d] 05-AdvancedTopics/mcp-sampling/README.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/05-AdvancedTopics/mcp-sampling/README.md (okunma tarihi 2026-11-19)
  - [K10e] 07-LessonsfromEarlyAdoption/README.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/07-LessonsfromEarlyAdoption/README.md (okunma tarihi 2026-11-19)
  - [K10f] study_guide.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/study_guide.md (okunma tarihi 2026-11-19)
  - [K10g] 03-GettingStarted/samples/java/calculator/README.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/03-GettingStarted/samples/java/calculator/README.md (okunma tarihi 2026-11-19)
  - [K10h] changelog.md — https://github.com/microsoft/mcp-for-beginners/blob/main/translations/bn/changelog.md (okunma tarihi 2026-11-19)

Microsoft depolarında CODE_OF_CONDUCT, SECURITY, CONTRIBUTING, SUPPORT, AGENTS, TRANSLATIONS, _navbar, _sidebar ve büyük harfli CHANGELOG dosyaları derleme alınmadı; K10'un Bengalce düzyazı `changelog.md` dosyası alındı.

Bengalcesi olmayan ya da açılamayan kaynaklar (2026-11-19):

- Gemini API / Google AI Studio dokümanı (`aistudio.google.com/docs/tokens`, `/docs/long-context`, `?hl=bn`) — sayfa İngilizce geliyor (`lang="en-US"`, Bengalce karakter yok).
- Gemma dokümanı (`gemma.ai`, model genel bakışı ve QLoRA sayfası) — yalnız İngilizce.
- Google Kubernetes Engine, inference en iyi uygulamaları (`docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference?hl=bn`) — İngilizce geliyor.
- Google ML sözlüğünün `glossary/language` alt sayfası ana sözlüğe (K3 `glossary`) yönleniyor; ayrı sayfa sayılmadı.
- Microsoft Learn `bn-in` / `bn-bd` — içerik yok.
- Hugging Face LLM Course — Bengalcede yalnız 3 sayfa (K1); diğer bölümler yok.

## Terimler

Sayım yöntemi (kural 5): okunan 500 sayfalık derlemde biçimi o anlamda kullanan sayfa sayısı. Fark 1 sayfa ya da daha azsa eşit sayıldı; o zaman biçimi kullanan yayıncı sayısı (Hugging Face: K1, K2; Google: K3, K8; Microsoft: K4–K7, K9, K10), o da eşitse geçiş sayısı belirledi. Notlardaki "X / Y sayfa" bu sayımdır; ilk sayı seçilen biçim. Yazım varyantları ayrı biçim sayıldı (ör. এম্বেডিং / এমবেডিং); eklerle geçişler dahil (প্যারামিটারগুলো, GPU-তে). Anlam süzgeci bağlam penceresiyle yapıldı (ör. লেয়ার ve স্তর için yalnız sinir ağı katmanı); "≈" yaklaşık sayımdır. Derlemde Microsoft 468, Hugging Face 18, Google 14 sayfa; eşitlikte yayıncı sayısı bu yüzden belirleyici.

Aile kuralı (hi.md kural 4): aynı baş sözcüğü paylaşan terimler tek kökle yazılır; kök, ailenin bütün biçimlerini kullanan sayfa sayısıyla seçilir. Kaynakta görülmeyen bileşik uydurulmaz. Bu kural dört satırda tek başına sayımdan farklı sonuç verdi (serve, attention head, sparsity, instruction tuning) ve concurrent users'ta tam eşitliği bozdu; ilgili notlarda yazıyor.

Kaynağı olmayan terimler (hidden size, head dimension, query / key / value, requests per second, MTP, CUDA graphs, pipeline parallelism, expert parallelism, SLO, graphics card, card, tensor throughput (TFLOPS), 2:4 structured sparsity, datasheet, MIG) İngilizce kalanlar tablosunda.

| EN | bn | Kaynak | Not / alternatif |
|---|---|---|---|
| GPU memory | GPU মেমরি | K7a, K4b, K6a | 7 / 5 sayfa. Alternatif: "GPU মেমোরি" (K4c, K4d). "memory" tek başına da aynı yazım: মেমরি 70 / মেমোরি 38 / স্মৃতি 16 sayfa. Bengal harfli "জিপিইউ মেমরি" 0 sayfa. |
| VRAM | VRAM | K4e, K4f | Kısaltma, Latin kalır (4 sayfa; Bengal harfli yazım yok). Kullanım: "৮GB+ VRAM" (K4e), "VRAM (GPU)" (K4f). |
| weights / model weights | ওজন / মডেল ওজন | K4g, K5a, K4h | ওজন 54 / 18 sayfa; মডেল ওজন 6 / 3 sayfa. Alternatif: "ওয়েট" (K3a, K5b), "মডেল ওয়েট" (K4g, K6b). Bileşik "open weights" için aşağıya bakın. |
| KV cache | KV ক্যাশ | K4i, K4j, K5c | Tek biçim, 4 sayfa. KV Latin, ক্যাশ Bengal harfiyle; "কেভি ক্যাশ", "KV-ক্যাশ" ve "কী-ভ্যালু ক্যাশ" 0 sayfa. |
| overhead | ওভারহেড | K4k, K4l | Tek biçim, 16 sayfa (K4, K6, K9, K10). |
| activations | অ্যাক্টিভেশন | K6a, K3a | 22 / 6 sayfa. Alternatif: "সক্রিয়করণ" (K3a, K4m). |
| parameters | প্যারামিটার | K4n, K3b | 159 / 6 sayfa. Alternatif: "পরামিতি" (K3c, K9a). Sayıdan sonra çoğul eki ve sınıflandırıcı yok: "2B প্যারামিটার" (K4g, K5c), "0.5B থেকে 235B প্যারামিটার" (K4n). |
| active parameters | সক্রিয় প্যারামিটার | K4n, K5c | Tek biçim, 2 sayfa; "অ্যাক্টিভ প্যারামিটার" 0 sayfa. |
| unified memory | ইউনিফাইড মেমরি | K4o, K4p | 7 / 1 sayfa. Alternatif: "ইউনিফাইড মেমোরি" (K4q). |
| memory bandwidth | মেমরি ব্যান্ডউইথ | K4r, K4s | Tek biçim, 4 sayfa (hepsi K4). |
| precision | প্রিসিশন | K4s, K4g | Sayısal hassasiyet anlamında 15 / 5 sayfa. Alternatif: "নির্ভুলতা" (K4t, K6a); bu sözcük derlemin 36 sayfasında çoğunlukla "accuracy" anlamında. Dikkat: K3 প্রিসিশন'i ölçüt (precision metriği) için de kullanıyor: "৮৮% প্রিসিশন" (K3a). |
| quantization | কোয়ান্টাইজেশন | K4g, K4s, K6a | Tek biçim, 57 sayfa, üç yayıncı; "পরিমাণীকরণ" 0 sayfa. |
| quantized | কোয়ান্টাইজড | K4s, K6c | 28 / 11 sayfa. Alternatif: "কোয়ান্টাইজ করা" (K6d, K6a). |
| checkpoint | চেকপয়েন্ট | K4b, K2a | Tek biçim, 18 sayfa, üç yayıncı (model dosyası anlamı; K9'da iş akışı checkpoint'i anlamında da geçiyor). |
| token | টোকেন | K3d, K4i | Bütün yayıncılar, 127 sayfa. Sayıdan sonra değişmez: "প্রতি সেকেন্ডে ২০ টোকেন" (K4i), "১২৮,০০০ টোকেন" (K6e). K10'da aynı sözcük kimlik doğrulama token'ı için de kullanılıyor. |
| tokenizer | টোকেনাইজার | K1a, K1b, K5d | Tek biçim, 11 sayfa, üç yayıncı. |
| vocabulary (tokenizer) | ভোকাবুলারি | K4f, K6b, K7b | Tokenizer/model sözlüğü anlamında 3 / 2 / 1 sayfa; ilk ikisi eşit (fark 1), yayıncı 1 / 1, geçiş 5 / 4. Alternatif: "শব্দভাণ্ডার" (K7c), "শব্দভান্ডার" (K3a). শব্দভাণ্ডার derlemdeki 8 sayfanın 6'sında "terim dağarcığı" anlamında. |
| embedding | এম্বেডিং | K3e, K3f, K5e | 30 / 30 sayfa → eşit; yayıncı 2 / 2; geçiş 159 / 146. Alternatif yazım: "এমবেডিং" (K5f, K7b). Aynı ödünç sözcüğün iki yazımı; yalnız এম্বেডিং kullan. |
| layer | লেয়ার | K7d, K3g, K4g | Sinir ağı katmanı anlamında ≈25 / ≈14 sayfa (bağlam süzgeci, yaklaşık). Sayıyla: "12টি লেয়ার" (K7d); bileşik: "BitLinear লেয়ার" (K4g). Alternatif: "স্তর" (K3d, K3h); স্তর derlemde "düzey, katman (genel)" anlamında da çok sık (130 sayfa). |
| attention | অ্যাটেনশন | K7d, K3a, K5c | Mekanizma anlamında 12 / 3 sayfa. Alternatif: "মনোযোগ", "স্ব-মনোযোগ" (K3d). মনোযোগ derlemdeki 39 sayfanın çoğunda "dikkat" anlamında. |
| attention head | অ্যাটেনশন হেড | K7d | Tek başına 1 / 1 sayfa → eşit; yayıncı 1 / 1; geçiş 1 / 2. Aile kuralıyla (attention: অ্যাটেনশন 12 / 3 sayfa) অ্যাটেনশন হেড. Kaynak: "প্রতিটি অ্যাটেনশন হেড" (K7d). Alternatif: "স্ব-মনোযোগ মাথা", "স্ব-মনোযোগ হেড" (K3d); মাথা organ olarak "baş", sözcük sözcük çeviri. Sayıyla `8টি অ্যাটেনশন হেড`: "12টি লেয়ার" (K7d) kalıbından kuruldu, kaynakta yok. |
| multi-head attention (MHA açılımı) | মাল্টি-হেড অ্যাটেনশন | K7d | 1 sayfa. Alternatif: "মাল্টি-হেড সেলফ-অ্যাটেনশন" (K3a, K7d). Kısaltma MHA derlemde 0 sayfa; Latin kalır. |
| grouped-query attention (GQA açılımı) | গ্রুপড-কোয়েরি অ্যাটেনশন | K4f | Tek biçim, 1 sayfa. GQA kısaltması derlemde 0 sayfa; Latin kalır. |
| multi-query attention (MQA açılımı) | মাল্টিকোয়েরি অ্যাটেনশন | K5a | Tek biçim (bitişik), 1 sayfa. MQA kısaltması derlemde 0 sayfa; Latin kalır. |
| feed-forward (layer) | ফিড-ফরোয়ার্ড | K4g | Tek biçim, 1 sayfa: "ফিড-ফরোয়ার্ড লেয়ারে" (K4g). |
| MoE (mixture of experts) | বিশেষজ্ঞদের মিশ্রণ | K3b | Her biçim 1 sayfa → eşit; yayıncı 1 / 1 / 1; geçiş 3 / 1 / 1. Alternatif: "মিক্সচার অফ এক্সপার্টস" (K6f), "মিশ্র বিশেষজ্ঞরা" (K5c). Kısaltma MoE Latin kalır (8 sayfa, K4, K5, K6). |
| expert | বিশেষজ্ঞ | K3b, K5c | MoE anlamında 2 / 3 sayfa → eşit; yayıncı 2 / 2; geçiş 6 / 3. Alternatif: "এক্সপার্ট মডিউল" (K5c). Sayıyla: sayı + bitişik টি + tekil isim, "12টি লেয়ার" (K7d) kalıbı → `8টি বিশেষজ্ঞ`; bu bileşik kaynakta yok. Çoğul eki sayıdan sonra gelmez. |
| dense (model) | ডেন্স মডেল | K4n | ডেন্স 3 / 1 sayfa. Kaynak: "ডেন্স ডিকোডার-অনলি" (K4f). Alternatif: "ঘন বিশেষজ্ঞ মডেল" (K5c). |
| sliding window attention | স্লাইডিং উইন্ডো অ্যাটেনশন | K5c | Tek biçim, 1 sayfa. |
| RoPE | RoPE | K4g | Kısaltma Latin kalır; açılım kaynakta yalnız İngilizce: "Rotary Position Embeddings (RoPE)" (K4g). Hal ekiyle: "RoPE-এর" (K4g). |
| logits | লগিট | K4j, K6g | Kökle sayım লগিট- 3 / লজিট- 1 sayfa (-স'li İngilizce çoğul dahil). Kaynak: "লগিট প্রসেসিং" (K4j). Alternatif: "লগিটস" (K6b), "লজিটস" (K5c). |
| inference | ইনফারেন্স | K4g, K6h | ML anlamında 98 / 9 sayfa. Alternatif: "অনুমান" (K6i, K4l); অনুমান "tahmin" anlamında da kullanılıyor. |
| serving / serve | সার্ভিং / সার্ভ করা | K4n, K6j, K9a, K3i | İsim সার্ভিং: tek biçim, 11 sayfa; örnek "মাল্টি LoRA সার্ভিং" (K6j). Fiil tek başına sayılsa "পরিবেশন করা" (K3a, K3c, K9b) kazanırdı (11 / 9 sayfa; K3 sözlüğünde madde başlığı); aile kuralıyla (সার্ভ- kökü 20 / 11 sayfa) সার্ভ করা. Kaynak: "মডেল সার্ভ করার" (K3i). |
| inference engine | ইনফারেন্স ইঞ্জিন | K4u, K4v | 9 / 1 sayfa. Alternatif: "অনুমান ইঞ্জিন" (K4l). |
| context | কনটেক্সট | K4h, K5g | LLM anlamında 41 / 31 / 17 sayfa. Alternatif: "প্রসঙ্গ" (K10a, K3b), "কন্টেক্সট" (K8a, K8b). Google Gemini yardım sayfaları (K8) yalnız কন্টেক্সট yazıyor. MCP adındaki "context" bu satırın konusu değil. |
| context window | কনটেক্সট উইন্ডো | K4h, K5g, K6k | 9 / 5 / 4 sayfa. Alternatif: "প্রসঙ্গ উইন্ডো" (K10a, K3b), "কন্টেক্সট উইন্ডো" (K8a, K8b). |
| context length | কনটেক্সট দৈর্ঘ্য | K4v, K4n | 4 / 1 / 1 / 1 sayfa (hepsi Microsoft). Alternatif: "কনটেক্সট লেন্থ" (K4f), "কনটেক্সট লেংথ" (K4w), "কন্টেক্সট লেন্থ" (K6l). |
| concurrent users | একযোগে ব্যবহারকারী | K10b | 1 / 1 sayfa → eşit; yayıncı 1 / 1; geçiş 1 / 1. Alternatif: "কনকারেন্ট ব্যবহারকারী" (K4x). Aileden karar: একযোগে concurrent requests satırında da geçiyor, "একযোগে অনুরোধ" (K4y); কনকারেন্ট orada yok; ailenin en sık kökü সমান্তরাল ise ব্যবহারকারী ile hiç geçmiyor. Kaynakta çoğul: "একাধিক একযোগে ব্যবহারকারীদের" (K10b). Zayıf kaynak (iki sayfa). |
| concurrent requests | সমান্তরাল অনুরোধ | K4g, K6m, K10c | 4 / 1 / 1 sayfa. Alternatif: "একযোগে অনুরোধ" (K4y), "সমসাময়িক অনুরোধ" (K10c). সমান্তরাল sözcük anlamıyla "paralel"; tensor/data parallelism ödünç প্যারালেলিজম ile yazıldığı için tabloda çakışma yok. |
| prompt | প্রম্পট | K5h, K3b | Tek biçim, 177 sayfa, Google ve Microsoft. |
| prefill | প্রিফিল | K4l | Tek biçim, 1 sayfa: "চাঙ্কড প্রিফিল" (K4l). |
| decode | ডিকোড / ডিকোডিং | K4i, K4s | Aşama: "ডিকোড গতি" (K4i); isim ডিকোডিং (4 sayfa), ör. "স্পেকুলেটিভ ডিকোডিং" (K4s). |
| batch | ব্যাচ | K3a, K6l | Tek biçim, 49 sayfa, üç yayıncı. |
| batch size | ব্যাচ সাইজ | K3a, K6l, K4b | 14 / 2 sayfa. Alternatif: "ব্যাচের আকার" (K3a, K3g). |
| throughput | থ্রুপুট | K4l, K4z | Tek biçim, 34 sayfa. |
| latency | লেটেন্সি | K4aa, K4i | 65 / 31 / 4 sayfa. Alternatif: "বিলম্ব" (K4l, K5g), "ল্যাটেন্সি" (K3b). |
| TTFT | প্রথম টোকেন লেটেন্সি | K4i, K4ab | TTFT kısaltması ve "time to first token" derlemde 0 sayfa; ölçülen büyüklüğün kaynaktaki adı bu. 3 / 3 sayfa → eşit; yayıncı 1 / 1; geçiş 4 / 4; tablodaki öteki bileşikler gibi tiresiz biçim seçildi. Alternatif: "প্রথম-টোকেন লেটেন্সি" (K4ac, K4z). Kısaltma TTFT Latin kalır. |
| tokens per second | প্রতি সেকেন্ডে N টোকেন / টোকেন/সেকেন্ড | K4i, K4ad, K4z | N = sayı. Sayılı cümlede 5 / 3 / 2 sayfa (প্রতি সেকেন্ডে … টোকেন / টোকেন/সেকেন্ড / টোকেন প্রতি সেকেন্ড; hepsi K4): "প্রতি সেকেন্ডে ৬৫০ টোকেন" (K4ad). Sayısız etikette kaynak টোকেন/সেকেন্ড yazıyor: "লেটেন্সি + p95 + টোকেন/সেকেন্ড" (K4z). Alternatif: "টোকেন প্রতি সেকেন্ড" (K4g, K4y). Sayıdan sonraki birim simgesi tok/s Latin kalır (hi kararıyla aynı). |
| sampling | স্যাম্পলিং | K6b, K10d | 23 / 1 sayfa, üç yayıncı. Alternatif: "নমুনা গ্রহণ" (K9c). |
| temperature | টেম্পারেচার | K5i, K5d, K4d | LLM anlamında 10 / 7 sayfa. Alternatif: "তাপমাত্রা" (K5j, K3a). |
| chat template | চ্যাট টেমপ্লেট | K4n, K4h | Tek biçim, 2 sayfa. Yazım টেমপ্লেট 56 / টেম্পলেট 4 sayfa. |
| speculative decoding | স্পেকুলেটিভ ডিকোডিং | K4r, K4s | Tek biçim, 3 sayfa; "অনুমানমূলক ডিকোডিং" 0 sayfa. |
| profiling | প্রোফাইলিং | K4ae, K4k | Tek biçim, 9 sayfa. |
| tensor parallelism | টেনসর প্যারালেলিজম | K4l, K4r | Tek biçim, 3 sayfa. |
| data parallelism | ডেটা প্যারালেলিজম | K6n | Tek biçim, 1 sayfa. |
| replica | রেপ্লিকা | K6h, K6o | Tek biçim, 2 sayfa; konteyner uygulamasının kopyası anlamında: "রেপ্লিকা রিস্টার্ট" (K6h). প্রতিলিপি HF'de "transkripsiyon" anlamında, bu satırın konusu değil. |
| capacity planning | ক্যাপাসিটি প্ল্যানিং | K9d | Tek biçim, 1 sayfa; "ক্ষমতা পরিকল্পনা" 0 sayfa. |
| fine-tuning | ফাইন-টিউনিং | K5k, K4b, K3c | 62 / 12 / 2 sayfa. Fiil: ফাইন-টিউন করা (46 sayfa). Alternatif: "ফাইনটিউনিং" (K6p), "সূক্ষ্ম সমন্বয়" (K3a). |
| full fine-tuning | সম্পূর্ণ ফাইন-টিউনিং | K3b, K4b | 2 / 1 / 1 sayfa → eşit; yayıncı 2 / 1 / 1. Alternatif: "পূর্ণ ফাইন-টিউনিং" (K4af), "পূর্ণ ফাইনটিউনিং" (K6q). |
| LoRA | LoRA / লো-র‍্যাঙ্ক অ্যাডাপটেশন | K4b | Kısaltma Latin (21 sayfa); açılım 1 sayfa. র‍্যাঙ্ক yazımı için rank satırına bakın. |
| QLoRA | QLoRA | K6q, K4b | Latin, 10 sayfa. |
| rank (LoRA) | র‍্যাঙ্ক | K4b, K3a | 11 sayfa. ZWJ'li yazım: র + U+200D + ্য (র‍্যা); ZWJ'siz yazım 1 sayfa. Kopyalarken ZWJ korunmalı. |
| adapter | অ্যাডাপ্টার | K4b, K6r | Tek biçim, 20 sayfa. |
| gradient checkpointing | গ্রেডিয়েন্ট চেকপয়েন্টিং | K4b | Tek biçim, 1 sayfa. |
| optimizer | অপ্টিমাইজার | K3a, K6s | 3 / 1 sayfa. Alternatif: "অপটিমাইজার" (K6l). Adam adı değişmez. |
| sequence length | সিকোয়েন্স দৈর্ঘ্য | K6l, K6q | 2 / 1 sayfa. Alternatif: "সিকোয়েন্সের দৈর্ঘ্য" (K7e). দৈর্ঘ্য context length ile aynı. |
| GPU | GPU | K4c, K3a | Latin, 93 / 3 sayfa. Alternatif: "জিপিইউ" (K3a, K4ag). Hal eki tireyle: "GPU-তে মডেল লোড" (K4c); boşluklu "GPU এর" (K6t) yalnız K6'da (10 sayfa). Çoğulda İngilizce "GPUs" (K4ah) 11 sayfa, "GPU-গুলি" (K6u) 1 sayfa. |
| sparsity | স্পার্সিটি | K4ai | Tek başına 1 / 1 sayfa → eşit; yayıncı 1 / 1; geçiş 1 / 2. Aile kuralıyla (স্পার্স- kökü 14 sayfa) স্পার্সিটি. Alternatif: "বিরলতা" (K3a). |
| form factor | ফর্ম ফ্যাক্টর | K4ah, K4m | Tek biçim, 2 sayfa. |
| repository | রিপোজিটরি | K4l, K10e | 93 / 19 sayfa. Alternatif yazım: "রেপোজিটরি" (K10f). |
| model card | মডেল কার্ড | K5b, K4n | Tek biçim, 9 sayfa. |
| config / config.json | কনফিগারেশন / config.json | K4t | কনফিগারেশন 169 / 11 sayfa (kısa কনফিগ). config.json dosya adı, değişmez (11 sayfa). |
| open weights | ওপেন-ওয়েট | K5b, K4g | 2 sayfa: "ওপেন-ওয়েট মডেল" (K5b). weights tek başına ওজন olsa da "ওপেন ওজন" 0 sayfa; bileşik uydurulmadı. |
| LLM | বড় ভাষা মডেল / LLM | K5d, K9e | 38 / 7 / 7 sayfa. Alternatif: "বৃহৎ ভাষা মডেল" (K3b, K3a), "লার্জ ল্যাঙ্গুয়েজ মডেল" (K3b). Kısaltma Latin LLM 124 / 10 sayfa; alternatif "এলএলএম" (K3c, K3d). |
| calculator | ক্যালকুলেটর | K10g, K4aj | Tek biçim, 24 sayfa (çoğu MCP örneklerindeki hesap makinesi aracı). |
| instruction tuning / instruction-tuned (instruct) model | ইনস্ট্রাকশন টিউনিং / ইনস্ট্রাকশন-টিউনড / ইনস্ট্রাক্ট মডেল | K3b, K5h, K4h | İsim tek başına sayılsa "নির্দেশনা টিউনিং" (K3a, K3d) kazanırdı (3 / 1 sayfa); aile kuralıyla (ইনস্ট্রাকশন/ইনস্ট্রাক্ট kökü 7 / 3 sayfa, yayıncı 2 / 1) ইনস্ট্রাকশন. Sıfat: "ইনস্ট্রাকশন-টিউনড" (K4r, K5h); model: "ইনস্ট্রাক্ট মডেল" (K4h, K6v). |

## İngilizce kalanlar

es.md'deki Terimler ve İngilizce kalanlar sırasıyla.

| EN | Neden |
|---|---|
| gated model | Erişimi kısıtlı model anlamında 0 sayfa. গেটেড yalnız MoE katman adında, "স্পার্সলি-গেটেড" (K3b), ve GRU kapısında geçiyor (3 sayfa). |
| headroom | Kapasite payı anlamında karşılık yok; "হেডরুম" 0 sayfa. |
| capacity planner | Araç adı olarak karşılık yok. capacity planning = ক্যাপাসিটি প্ল্যানিং (Terimler). |
| Multi-head Latent Attention (MLA açılımı) | Kaynak yok ("ল্যাটেন্ট অ্যাটেনশন" 0 sayfa). GQA, MQA ve MHA açılımlarının Bengalce kaynağı var; Terimler tablosunda. |
| token, prompt, embedding, logits, pipeline | Bengalcede İngilizce kalmıyor; kaynaklar Bengal harfiyle yazıyor: টোকেন, প্রম্পট, এম্বেডিং, লগিট (Terimler), "পাইপলাইন" (K2b; 77 sayfa). Kod tanımlayıcısı (`pipeline()`) Latin kalır. |
| hidden size | Karşılık yok ("হিডেন সাইজ", "লুকানো আকার" 0 sayfa; hidden yalnız "হিডেন লেয়ার" (K3g) içinde). |
| head dimension | Karşılık yok. |
| query / key / value (attention) | Attention bağlamında yok; কোয়েরি, কী, ভ্যালু derlemde arama sorgusu, API anahtarı ve değer anlamında. |
| requests per second (RPS) | Karşılık yok; yalnız tokens per second kalıbı var. RPS kısaltması 0 sayfa. |
| MTP (multi-token prediction) | Kısaltma ve açılım 0 sayfa. |
| CUDA graphs | "CUDA গ্রাফ" 0 sayfa. CUDA Latin (27 sayfa). |
| pipeline parallelism | Bileşik yok (parçaları var: পাইপলাইন, প্যারালেলিজম); uydurulmadı. |
| expert parallelism | Bileşik yok; uydurulmadı. |
| SLO | Kısaltma ve açılım 0 sayfa. |
| graphics card / card | GPU anlamında yok: "গ্রাফিক্স কার্ড" 0 sayfa; কার্ড derlemde model kartı ve kredi kartı anlamında. |
| tensor throughput (TFLOPS) | "টেনসর থ্রুপুট" 0 sayfa; TFLOPS 0 sayfa. |
| 2:4 structured sparsity | Bileşik yok; স্পার্সিটি tek başına var (Terimler). |
| datasheet | "ডেটাশিট" 0 sayfa. |
| MIG | Kısaltma ve açılım 0 sayfa. "মাল্টি-ইনস্ট্যান্স" (K6t) ONNX Runtime'ın çok örnekli çalışması, MIG değil. |
| Kısaltmalar: VRAM, GPU, KV, MoE, MHA, GQA, MQA, MLA, LoRA, QLoRA, BF16, FP8, INT4, TTFT, RPS, SLO, MIG, RoPE, MTP, CUDA, TFLOPS, LLM | Kural 4: kısaltma çevrilmez. Kaynakta Latin olarak geçenler: VRAM, GPU, KV, MoE, LoRA, QLoRA, FP8, INT4, RoPE, CUDA, LLM. MHA, GQA, MQA, MLA, BF16, TTFT, RPS, SLO, MIG, MTP, TFLOPS 0 sayfa. Bengal harfli kısaltma yalnız K3'te: "এলএলএম" (K3b), "জিপিইউ" (K3a); kullanma. |
| Adlar: vLLM, LLMScale, Hugging Face, NVLink, Adam, config.json | Ürün, kütüphane ve dosya adları değişmez (vLLM 8 sayfa, Adam 3, config.json 11; Latin). |

## Yazım kuralları

Yalnız kaynaklarda gözlenen kullanım; sayımlar yalnız Bengalce harf içeren satırlarda, kod blokları hariç. Karar dil sahibinindir.

- **Hitap: আপনি.** আপনি/আপনার/আপনাকে her kaynakta baskın (K10 1386, K6 1012, K5 754, K4 680, K8 634, K9 619, K7 356, K2 179, K3 104, K1 48 geçiş); emir kipi করুন (K4 2135, K10 1696, K6 1520). তুমি ve করো az ve çoğunlukla modele yazılan örnek istemlerde: "তুমি কি আমাকে" (K8c), "বিশ্লেষণ করো" (K8a), "এটি সারাংশ করো" (K5h). Tek istisna HF Audio Course: okura dönük birkaç başlıkta তুমি, "এই অধ্যায় থেকে তুমি কি কি শিখবে?" (K2c); aynı kurs 179 kez আপনি kullanıyor. Örnek: "আপনি শিখবেন" (K1b), 46 sayfa.
- **Cümle sonu: । (দাঁড়ি).** Bengal harfinden sonra । toplam ≈18.000 geçiş; nokta yalnız 34 geçiş (K7 15, K2 5, K3 5, K9 5, K10 4; K1, K4, K5, K6, K8 0). Soru işareti Latin `?`, kelimeye bitişik: "কি আশা করা যায়?" (K1b). Ünlem ve soru için ayrı Bengal işareti yok.
- **Rakamlar.** Kaynaklar ikiye ayrılıyor: Hugging Face ve Google Bengal rakamı (০–৯) yazıyor, Microsoft karışık ve çoğunda Latin rakamı ağır basıyor (tablo). Örnek: "অধ্যায় ১ থেকে ৪" (K1b), "0.5B থেকে 235B প্যারামিটার" (K4n). Site kararı D6 (her dilde Latin rakamı, Intl `-u-nu-latn`) Microsoft kaynaklarının çoğuyla uyumlu, Hugging Face ve Google kullanımından ayrılıyor.

| Kaynak | Bengal rakamı | Latin rakamı | -গুলো | -গুলি | -সমূহ | হলো | হল |
|---|---|---|---|---|---|---|---|
| K1 | 8 | 1 | 13 | 22 | 0 | 1 | 3 |
| K2 | 140 | 7 | 26 | 128 | 3 | 8 | 26 |
| K3 | 1129 | 98 | 216 | 141 | 4 | 136 | 36 |
| K4 | 2013 | 1502 | 264 | 580 | 46 | 29 | 25 |
| K5 | 429 | 364 | 418 | 211 | 53 | 127 | 62 |
| K6 | 309 | 1191 | 441 | 191 | 51 | 90 | 28 |
| K7 | 172 | 674 | 337 | 145 | 7 | 102 | 44 |
| K8 | 69 | 1 | 0 | 71 | 0 | 0 | 15 |
| K9 | 440 | 694 | 431 | 288 | 146 | 53 | 52 |
| K10 | 1054 | 2170 | 751 | 566 | 353 | 81 | 77 |
| toplam | 5763 | 6702 | 2897 | 2343 | 663 | 627 | 368 |

Sayılar geçiştir (rakam: sayı dizisi). হল sayımı "salon" anlamını da içerir.

- **Ondalık ve gruplama.** Ondalık ayırıcı nokta, iki rakam türünde de: "১.৫ ওয়াট" (K4ad), "0.4GB" (K4g). Binlik virgül: "৪,৯৯৫টি" (K3i), "১,০০০ জন ব্যবহারকারী" (K8c). Altı ve daha çok basamakta iki sistem de var: uluslararası 4 sayfa: "১২৮,০০০ টোকেন" (K6e), "১৯২,০০০ Hz" (K2d), "৮৫৩,০০০" (K3a); Hint (লাখ) gruplaması 3 sayfa: "১,০০,০০০+" (K4ak), "৩,৬৯,৮৪৬টি" (K7f), "১,০০,০০০:১" (K3g). Latin rakamlı gruplanmış sayı yalnız 3 geçiş. Büyük sayı sözcüğü: বিলিয়ন 17 sayfa, "বিলিয়ন প্যারামিটার" (K4r) 12 sayfa; মিলিয়ন 7; কোটি 4 sayfa, çoğu mecaz: "লাখ-লাখ কোটি-কোটি" (K1a).
- **Sitenin çıktısı** (Node 24.21, bn-BD ve bn-IN aynı, Latin rakam): 1234.5 → "1,234.5"; 12345.67 → "12,345.67"; 131072 → "1,31,072"; 27000000000 → "27,00,00,00,000"; 0.31 → "0.31"; yüzde 0.05 → "5%", 0.855 → "85.5%"; tarih "19 নভেম্বর, 2026". Altı ve daha çok basamakta Hint gruplaması basılıyor; bu, kaynaklarda görülen iki sistemden biri. Ondalık nokta, bitişik yüzde ve tarih kalıbı kaynaklarla uyumlu.
- **Yüzde.** % sayıya bitişik, boşluksuz (203 geçiş; boşluklu 0): "৮৮% প্রিসিশন" (K3a), "(85-95%)" (K4l). Sözcükle শতাংশ 5 sayfa.
- **Birim.** Latin birim çoğunlukla sayıya bitişik (132 / 12 geçiş): "৮GB+ VRAM" (K4e), "64GB DDR4" (K4ah); boşluklu örnek "৫ MB" (K2e). Bengal harfli birim sözcüğü (জিবি, গিগাবাইট, মিলিসেকেন্ড) 11 geçiş.
- **Tarih.** Gün, ay adı, virgül, yıl: "১৭ নভেম্বর, ২০২৬" (K8c); 8 sayfa. Virgülsüz 3 sayfa; ay önde 3 sayfa: "ডিসেম্বর ১৮, ২০২৫" (K10h).
- **Latin kısaltma + Bengalce.** İsimle boşluk: "KV ক্যাশ" (K4j), "GPU মেমরি" (K4b). Hal eki tireyle (673 / 502 geçiş): "GPU-তে মডেল লোড" (K4c), "RoPE-এর" (K4g); Google tire yazıyor (K3 32 / 2, K8 18 / 0), Hugging Face eşit (K1+K2 5 / 5); boşluklu biçim çoğunlukla K10, K6, K5 ve K9'da. Ekin doğrudan bitişmesi 1 geçiş.
- **Çoğul ve sınıflandırıcı.** -গুলো ve -গুলি ikisi de yaygın (tablo): -গুলো 6 kaynakta, toplam 2.897 geçiş; -গুলি 4 kaynakta (K1, K2, K4, K8), 2.343 geçiş; K8 yalnız -গুলি. -সমূহ K9 ve K10'da. Sayıdan sonra çoğul eki yok (sayı + টি + çoğul eki: 0 geçiş). Sınıflandırıcı -টি sayıya bitişik (196 / 11 geçiş; boşluklu 11 geçişin 5'i K2'de: "৬৫৪ টি" (K2f)); -টা 0. Örnek: "৭টি প্যারামিটার" (K7g), "২-৩টি মডেল" (K4al). Kişi için জন: "১,০০০ জন ব্যবহারকারী" (K8c); ölçü gibi okunan isimde sınıflandırıcı yok: "প্রতি সেকেন্ডে ২০ টোকেন" (K4i).
- **Hasanta ve yazım tutarsızlıkları.** Ödünç sözcüklerde sözcük sonu hasanta (্) yazılmıyor (yalnız 2 sayfada 4 geçiş). Aynı ödünç sözcüğün iki yazımı sık; tablodaki biçimi aynen kullan: মেমরি/মেমোরি, এম্বেডিং/এমবেডিং, কনটেক্সট/কন্টেক্সট, রিপোজিটরি/রেপোজিটরি, ফাইন-টিউনিং/ফাইনটিউনিং, অপ্টিমাইজার/অপটিমাইজার, টেমপ্লেট/টেম্পলেট, লেটেন্সি/ল্যাটেন্সি (ilki seçilen). র‍্যাঙ্ক ZWJ ile yazılıyor (U+200D; 11 / 1 sayfa). Öteki sık çiftler: সাথে / সঙ্গে 1.945 / 270 geçiş, দেওয়া / দেয়া 596 / 34. Metni NFC kaydet; NFC'de য়, ড়, ঢ় iki kod noktasıdır (harf + nukta U+09BC).
- **Ödünç terim yazımı.** İngilizce teknik terim çoğunlukla Bengal harfiyle (টোকেন, কোয়ান্টাইজেশন, ইনফারেন্স); kısaltma, ürün ve dosya adı Latin (GPU, LLM, vLLM, config.json). Bileşik ödünçte tire kaynaktaki gibi: ফাইন-টিউনিং, ওপেন-ওয়েট, গ্রুপড-কোয়েরি.

## Uygulamada verilen kararlar (Dalga 2)

- **Rakam ve sayı.** Latin rakam (D6), Bengal rakamı yok. Düzyazıdaki sabit sayılar `Intl` bn çıktısıyla aynı yazılır ("1,31,072"); sürüm numaraları, komut satırı ve config değerleri, kod ve log örnekleri değişmez.
- **Yazım.** Çoğul eki -গুলো; হলো, সাথে, দেওয়া. Cümle sonu "।", soru işareti Latin "?".
- **Sınıflandırıcı.** Düzyazıda sayıya bitişik টি ("{n}টি GPU"); token sayısında ve formül satırlarında yok. Birim anahtarları (`gloss.unit.*`) টি'siz, çünkü kod sayı ile birimi boşlukla birleştirir: "1 বিশেষজ্ঞ", "32 লেয়ার".
- **Latin ad + ek.** Tireyle: "GPU-তে", "${name}-এর".
- **Sözlükte olmayıp seçilenler.** fit (belleğe sığmak) → ধরে / ধরে না; page → পৃষ্ঠা; GPU anlamındaki card → GPU; draft model → ড্রাফট মডেল; Serving Brief → সার্ভিং সারসংক্ষেপ.

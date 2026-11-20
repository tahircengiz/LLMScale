# Terim sözlüğü — Deutsch (de)

Durum: Dalga 4 (2026-11-19). Kaynak dil EN. Kural: docs/i18n-plan.md §4 — karşılık birincil kaynaktan, kaynaksız terim İngilizce kalır.

Hedef: bölge kodu olmayan tek `de` sürümü; Almanya, Avusturya ve İsviçre okuru aynı metni okur. Bölgeye göre ayrışan yerde çoğunluktaki biçim (Almanya) seçildi, öteki not edildi. İsviçre ß yerine ss yazar: Apple İsviçre sayfası (K58), Almanya sayfasındaki (K57) 9 ß'nin hepsini ss ile yazıyor ("Grosser" (K58)). Microsoft stil kılavuzu İsviçre ve Liechtenstein için ondalıkta nokta, binlikte kesme işareti veriyor ("1'495.68 kg" (K48)); Apple İsviçre teknik sayfası ise ondalıkta virgül kullanıyor ("35,97 cm" (K58)). Aynı kılavuz Almanya, Avusturya ve Lüksemburg'u tek düzende veriyor ("Country/region: Germany, Austria and Luxembourg" (K48)). Avusturya'ya özgü sayfa okunmadı (Kaynaklar sonundaki liste). Site metni ß ile yazılır; sayı biçimi `Intl` "de-DE-u-nu-latn" çıktısıdır (Yazım kuralları).

## Kaynaklar

Her sayfa 2026-11-19'da `curl` ile indirildi, ana içeriği metne çevrildi ve terim o metinde arandı. Tablodaki her biçim, kaynak sütununda adı geçen sayfalardan en az birinde geçiyor; notlardaki her alıntı, hemen arkasındaki parantezde adı geçen her sayfada geçiyor (otomatik denetim: betik tablodaki 156 biçimi ve notlardaki 279 alıntıyı denetler; 135 biçim kaynak sayfasında bulundu, kalan 21 biçim BİRLEŞTİRME diye işaretli yeni ad; 275 alıntı ana içerikte, 4 alıntı ana içerik dışında, sayfa başlığında ya da sayfa notunda bulundu (K22, K27, K31, K35, K53); karşılaştırmada büyük-küçük harf, boşluk türü, yumuşak tire ve denetim karakterleri ayrılmadı). Hugging Face Transformers'ın Almanca sayfaları güncel sürümde (v5.23.0) 404 veriyor; v5.22.2 okundu (16 Almanca sayfa, GitHub `docs/source/de` ile aynı küme). HF LLM Course'un Almanca çeviri kuralları dosyası var ve okundu (K11).

Makine çevirisi: Google sayfalarının hepsi (K19–K30) `lang="de-x-mtfrom-en"` etiketli ve başta "KI-Übersetzungen können Fehler enthalten" notunu taşıyor (K22). Microsoft Learn sayfalarının `ms.translationtype` etiketi K34, K35, K37, K42, K45 ve K46'da HT (insan çevirisi); K31, K32, K33, K36, K38, K39, K40, K41, K43, K44 ve K47'de MT (makine çevirisi). MT hatası örneği: Foundry portalı "Gießereiportal" (K36) olmuş. Bu sayfalar yine birincil kaynak sayıldı; yalnız Google ya da yalnız Microsoft MT sayfasından gelen biçim notta ayrıca işaretlendi. K48 Microsoft'un İngilizce yazılmış Almanca stil kılavuzudur (kural kaynağı; terim sayımına girdi ama örnekleri İngilizce metin içinde). NVIDIA, Apple, AMD, IBM, BSI, PLS ve Duden sayfalarında çeviri işareti görülmedi.

K2, K3 ve K4 (HF LLM Course 1. bölüm) sayıma girdi ama tablolarda kaynak olarak ayrıca anılmadı.

Hugging Face
- [K1] HF LLM Course (de) — Wörterverzeichnis — https://huggingface.co/learn/llm-course/de/glossary/1 (okunma tarihi 2026-11-19)
- [K2] HF LLM Course (de) — Kapitel 1.1, Einführung — https://huggingface.co/learn/llm-course/de/chapter1/1 (okunma tarihi 2026-11-19)
- [K3] HF LLM Course (de) — Kapitel 1.2, Computerlinguistik — https://huggingface.co/learn/llm-course/de/chapter1/2 (okunma tarihi 2026-11-19)
- [K4] HF LLM Course (de) — Kapitel 1.3, Transformer-Modelle - wozu sind sie imstande? — https://huggingface.co/learn/llm-course/de/chapter1/3 (okunma tarihi 2026-11-19)
- [K5] HF LLM Course (de) — Kapitel 1.4, Wie funktionieren Transformer-Modelle? — https://huggingface.co/learn/llm-course/de/chapter1/4 (okunma tarihi 2026-11-19)
- [K6] HF LLM Course (de) — Kapitel 3.2, Vorbereitung der Daten — https://huggingface.co/learn/llm-course/de/chapter3/2 (okunma tarihi 2026-11-19)
- [K7] HF LLM Course (de) — Kapitel 3.3, Fine-tuning eine Modells mit der Trainer API — https://huggingface.co/learn/llm-course/de/chapter3/3 (okunma tarihi 2026-11-19)
- [K8] HF LLM Course (de) — Kapitel 3.4, Komplettes Training — https://huggingface.co/learn/llm-course/de/chapter3/4 (okunma tarihi 2026-11-19)
- [K9] HF LLM Course (de) — Kapitel 4.3, Vortrainierte Modelle teilen — https://huggingface.co/learn/llm-course/de/chapter4/3 (okunma tarihi 2026-11-19)
- [K10] HF LLM Course (de) — Kapitel 4.4, Erstellung einer Modellkarte (“model card”) — https://huggingface.co/learn/llm-course/de/chapter4/4 (okunma tarihi 2026-11-19)
- [K11] HF LLM Course — Almanca çeviri kuralları (TRANSLATING.txt) — https://raw.githubusercontent.com/huggingface/course/main/chapters/de/TRANSLATING.txt (okunma tarihi 2026-11-19)
- [K12] Transformers docs (de, v5.22.2) — index ("🤗 Transformers") — https://huggingface.co/docs/transformers/v5.22.2/de/index (okunma tarihi 2026-11-19)
- [K13] Transformers docs (de) — quicktour ("Schnellstart") — https://huggingface.co/docs/transformers/v5.22.2/de/quicktour (okunma tarihi 2026-11-19)
- [K14] Transformers docs (de) — llm_tutorial (başlık İngilizce: "Generation with LLMs"; metin Almanca) — https://huggingface.co/docs/transformers/v5.22.2/de/llm_tutorial (okunma tarihi 2026-11-19)
- [K15] Transformers docs (de) — peft ("Adapter mit 🤗 PEFT laden") — https://huggingface.co/docs/transformers/v5.22.2/de/peft (okunma tarihi 2026-11-19)
- [K16] Transformers docs (de) — training ("Optimierung eines vortrainierten Modells") — https://huggingface.co/docs/transformers/v5.22.2/de/training (okunma tarihi 2026-11-19)
- [K17] Transformers docs (de) — model_sharing ("Ein Modell teilen") — https://huggingface.co/docs/transformers/v5.22.2/de/model_sharing (okunma tarihi 2026-11-19)
- [K18] Transformers docs (de) — preprocessing ("Vorverarbeiten") — https://huggingface.co/docs/transformers/v5.22.2/de/preprocessing (okunma tarihi 2026-11-19)

Google (de; hepsi makine çevirisi)
- [K19] Google — Machine Learning Glossary (başlık İngilizce, metin Almanca) — https://developers.google.com/machine-learning/glossary?hl=de (okunma tarihi 2026-11-19)
- [K20] Google MLCC — LLMs: Was ist ein Large Language Model? — https://developers.google.com/machine-learning/crash-course/llm/transformers?hl=de (okunma tarihi 2026-11-19)
- [K21] Google MLCC — LLMs: Abstimmung, Destillation und Prompt Engineering — https://developers.google.com/machine-learning/crash-course/llm/tuning?hl=de (okunma tarihi 2026-11-19)
- [K22] Google Cloud GKE — GKE Inference Gateway mit llm-d — https://docs.cloud.google.com/kubernetes-engine/docs/concepts/about-gke-inference-gateway?hl=de (okunma tarihi 2026-11-19)
- [K23] Google Cloud GKE — Übersicht über Best Practices für die Inferenz in GKE — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference?hl=de (okunma tarihi 2026-11-19)
- [K24] Google Cloud GKE — Best Practices für die Optimierung der Inferenz von Large Language Models mit GPUs in der Google Kubernetes Engine (GKE) — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference/llm-optimization?hl=de (okunma tarihi 2026-11-19)
- [K25] Google Cloud GKE — Best Practices für das Autoscaling von Inferenzen für LLM-Arbeitslasten (Large Language Model) mit GPUs in Google Kubernetes Engine (GKE) — https://docs.cloud.google.com/kubernetes-engine/docs/best-practices/machine-learning/inference/autoscaling?hl=de (okunma tarihi 2026-11-19)
- [K26] Google Cloud GKE — Leistung und Kosten der Modellbereitstellung mit GKE Inference Quickstart analysieren — https://docs.cloud.google.com/kubernetes-engine/docs/how-to/machine-learning/inference/inference-quickstart?hl=de (okunma tarihi 2026-11-19)
- [K27] Google Cloud GKE — Offene Gemma-Modelle mit GPUs in GKE mit vLLM bereitstellen — https://docs.cloud.google.com/kubernetes-engine/docs/tutorials/serve-gemma-gpu-vllm?hl=de (okunma tarihi 2026-11-19)
- [K28] Google Cloud — KI-Beschleunigerleistung und -benchmarking — https://docs.cloud.google.com/docs/ai-ml/accelerator-performance-benchmarking?hl=de (okunma tarihi 2026-11-19)
- [K29] Google Cloud Compute Engine — GPU-Maschinentypen — https://docs.cloud.google.com/compute/docs/gpus?hl=de (okunma tarihi 2026-11-19)
- [K30] Google Cloud Observability — Konzepte im Service Monitoring (SLO sayfası) — https://docs.cloud.google.com/stackdriver/docs/solutions/slo-monitoring?hl=de (okunma tarihi 2026-11-19)

Microsoft (Learn de-de ve Almanca stil kılavuzu)
- [K31] Microsoft Learn — Grundlegendes zu Token (.NET) — https://learn.microsoft.com/de-de/dotnet/ai/conceptual/understanding-tokens (okunma tarihi 2026-11-19)
- [K32] Microsoft Learn — So erweitern Einbettungen die Reichweite Ihres KI-Modells (.NET) — https://learn.microsoft.com/de-de/dotnet/ai/conceptual/embeddings (okunma tarihi 2026-11-19)
- [K33] Microsoft Learn — Funktionsweise von generativen KI und LLMs (.NET) — https://learn.microsoft.com/de-de/dotnet/ai/conceptual/how-genai-and-llms-work (okunma tarihi 2026-11-19)
- [K34] Microsoft Learn — LLM-Grundlagen (Agent Framework) — https://learn.microsoft.com/de-de/agent-framework/journey/llm-fundamentals (okunma tarihi 2026-11-19)
- [K35] Microsoft Learn — Azure OpenAI in Microsoft Foundry Modellleistung & Latenz — https://learn.microsoft.com/de-de/azure/foundry/openai/how-to/latency (okunma tarihi 2026-11-19)
- [K36] Microsoft Learn — Provisionierter Durchsatz für Foundry-Modelle — https://learn.microsoft.com/de-de/azure/foundry/openai/concepts/provisioned-throughput (okunma tarihi 2026-11-19)
- [K37] Microsoft Learn — Prompt-Engineering-Techniken — https://learn.microsoft.com/de-de/azure/foundry/openai/concepts/prompt-engineering (okunma tarihi 2026-11-19)
- [K38] Microsoft Learn — Feinabstimmung eines Modells mit überwachter Feinabstimmung in Microsoft Foundry — https://learn.microsoft.com/de-de/azure/foundry/openai/how-to/fine-tuning (okunma tarihi 2026-11-19)
- [K39] Microsoft Learn — Schulung in Microsoft Foundry (adres fine-tuning-considerations) — https://learn.microsoft.com/de-de/azure/foundry/openai/concepts/fine-tuning-considerations (okunma tarihi 2026-11-19)
- [K40] Microsoft Learn — Inferenz-Laufzeiten in Foundry Local auf Azure Local — https://learn.microsoft.com/de-de/azure/azure-sovereign-clouds/private/foundry-local/concept-inference-runtimes (okunma tarihi 2026-11-19)
- [K41] Microsoft Learn — Automatische GPU-Ableitungsoptimierung mit vLLM-Planner (Foundry Local auf Azure Local) — https://learn.microsoft.com/de-de/azure/azure-sovereign-clouds/private/foundry-local/concept-gpu-inference-optimization (okunma tarihi 2026-11-19)
- [K42] Microsoft Learn — Bereitstellen eines KI-Modells auf Azure Kubernetes Service (AKS) mit dem KI-Toolkettenoperator-Add-On — https://learn.microsoft.com/de-de/azure/aks/ai-toolchain-operator (okunma tarihi 2026-11-19)
- [K43] Microsoft Learn — Modell-Parallelität für Multi-GPU-Inferenz in Foundry Local in Azure Local — https://learn.microsoft.com/de-de/azure/azure-sovereign-clouds/private/foundry-local/concept-model-parallelism (okunma tarihi 2026-11-19)
- [K44] Microsoft Learn — Benutzerdefinierte Modelle mit Fireworks in Microsoft Foundry importieren — https://learn.microsoft.com/de-de/azure/foundry/how-to/fireworks/import-custom-models (okunma tarihi 2026-11-19)
- [K45] Microsoft Learn — Benutzerdefinierte LLMs mit Custom Model Serving bereitstellen (Azure Databricks) — https://learn.microsoft.com/de-de/azure/databricks/machine-learning/model-serving/serve-custom-llms (okunma tarihi 2026-11-19)
- [K46] Microsoft Learn — Was ist verteiltes Training? — https://learn.microsoft.com/de-de/azure/machine-learning/concept-distributed-training?view=azureml-api-2 (okunma tarihi 2026-11-19)
- [K47] Microsoft Learn — Architekturstrategien für die Kapazitätsplanung — https://learn.microsoft.com/de-de/azure/well-architected/performance-efficiency/capacity-planning (okunma tarihi 2026-11-19)
- [K48] Microsoft German Style Guide (deu-deu-StyleGuide.pdf, aka.ms/german-styleguide) — https://download.microsoft.com/download/330db0a1-dc5e-41a6-81d4-c6c97c280db4/deu-deu-StyleGuide.pdf (okunma tarihi 2026-11-19)

NVIDIA, Apple, AMD
- [K49] NVIDIA (de-de) — H100-GPU — https://www.nvidia.com/de-de/data-center/h100/ (okunma tarihi 2026-11-19)
- [K50] NVIDIA (de-de) — H200 Tensor Core-Grafikkarte — https://www.nvidia.com/de-de/data-center/h200/ (okunma tarihi 2026-11-19)
- [K51] NVIDIA (de-de) — DGX Spark ("Persönlicher KI-Supercomputer") — https://www.nvidia.com/de-de/products/workstations/dgx-spark/ (okunma tarihi 2026-11-19)
- [K52] NVIDIA (de-de) — GeForce RTX 5090-Grafikkarten — https://www.nvidia.com/de-de/geforce/graphics-cards/50-series/rtx-5090/ (okunma tarihi 2026-11-19)
- [K53] NVIDIA (de-de) — Mehr-Instanzen-Grafikprozessor (MIG) — https://www.nvidia.com/de-de/technologies/multi-instance-gpu/ (okunma tarihi 2026-11-19)
- [K54] NVIDIA (de-de) — Dynamo ("Skalierung und Verarbeitung von generativer KI") — https://www.nvidia.com/de-de/ai/dynamo/ (okunma tarihi 2026-11-19)
- [K55] NVIDIA (de-de) — Tensor-Recheneinheiten — https://www.nvidia.com/de-de/data-center/tensor-cores/ (okunma tarihi 2026-11-19)
- [K56] NVIDIA Blog (de) — Mehr Leistung aus jedem Byte: Wie Full-Stack Codesign die Speicherherausforderung von KI löst — https://blogs.nvidia.de/memory-full-stack-codesign/ (okunma tarihi 2026-11-19)
- [K57] Apple Deutschland — MacBook Pro, Technische Daten — https://www.apple.com/de/macbook-pro/liquid-retina-xdr-display/specs/ (okunma tarihi 2026-11-19)
- [K58] Apple Schweiz (de) — MacBook Pro, Technische Daten — https://www.apple.com/chde/macbook-pro/liquid-retina-xdr-display/specs/ (okunma tarihi 2026-11-19)
- [K59] AMD (de) — Ryzen AI Max+ 395 — https://www.amd.com/de/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html (okunma tarihi 2026-11-19)

IBM
- [K60] IBM Think (de) — Was ist ein Transformator-Modell? — https://www.ibm.com/de-de/think/topics/transformer-model (okunma tarihi 2026-11-19)
- [K61] IBM Think (de) — Was ist ein Aufmerksamkeitsmechanismus? — https://www.ibm.com/de-de/think/topics/attention-mechanism (okunma tarihi 2026-11-19)
- [K62] IBM Think (de) — Was ist Grouped Query Attention? — https://www.ibm.com/de-de/think/topics/grouped-query-attention (okunma tarihi 2026-11-19)
- [K63] IBM Think (de) — Was ist eine Mixture of Experts (Mischung von Experten)? — https://www.ibm.com/de-de/think/topics/mixture-of-experts (okunma tarihi 2026-11-19)
- [K64] IBM Think (de) — Was ist ein Kontextfenster? — https://www.ibm.com/de-de/think/topics/context-window (okunma tarihi 2026-11-19)
- [K65] IBM Think (de) — Was ist Quantisierung? — https://www.ibm.com/de-de/think/topics/quantization (okunma tarihi 2026-11-19)

Kamu (BSI: Bundesamt für Sicherheit in der Informationstechnik; PLS: BMBF'nin kurduğu Plattform Lernende Systeme)
- [K66] BSI — Generative KI-Modelle: Chancen und Risiken für Industrie und Behörden (PDF) — https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/KI/Generative_KI-Modelle.pdf?__blob=publicationFile&v=7 (okunma tarihi 2026-11-19)
- [K67] Plattform Lernende Systeme — Glossar — https://www.plattform-lernende-systeme.de/glossar.html (okunma tarihi 2026-11-19)

Duden (sözlük maddeleri ve yazım kuralları)
- [K68] Duden — Token — https://www.duden.de/rechtschreibung/Token (okunma tarihi 2026-11-19)
- [K69] Duden — Cache — https://www.duden.de/rechtschreibung/Cache (okunma tarihi 2026-11-19)
- [K70] Duden — Prompt — https://www.duden.de/rechtschreibung/Prompt (okunma tarihi 2026-11-19)
- [K71] Duden — Feintuning — https://www.duden.de/rechtschreibung/Feintuning (okunma tarihi 2026-11-19)
- [K72] Duden — Batch — https://www.duden.de/rechtschreibung/Batch (okunma tarihi 2026-11-19)
- [K73] Duden — Overhead — https://www.duden.de/rechtschreibung/Overhead (okunma tarihi 2026-11-19)
- [K74] Duden — Decodierung — https://www.duden.de/rechtschreibung/Decodierung (okunma tarihi 2026-11-19)
- [K75] Duden — Milliarde — https://www.duden.de/rechtschreibung/Milliarde (okunma tarihi 2026-11-19)
- [K76] Duden — Billion — https://www.duden.de/rechtschreibung/Billion (okunma tarihi 2026-11-19)
- [K77] Duden Rechtschreibregeln — Zahlen und Ziffern — https://www.duden.de/sprachwissen/rechtschreibregeln/zahlen-und-ziffern (okunma tarihi 2026-11-19)
- [K78] Duden Rechtschreibregeln — Bindestrich — https://www.duden.de/sprachwissen/rechtschreibregeln/bindestrich (okunma tarihi 2026-11-19)
- [K79] Duden Rechtschreibregeln — Anführungszeichen — https://www.duden.de/sprachwissen/rechtschreibregeln/anfuehrungszeichen (okunma tarihi 2026-11-19)
- [K80] Duden Rechtschreibregeln — Gedankenstrich — https://www.duden.de/sprachwissen/rechtschreibregeln/gedankenstrich (okunma tarihi 2026-11-19)

Almancası olmayan, açılamayan ya da çıkarılan kaynaklar
- HF Hub dokümanı ve HF Agents Course: Almanca sürüm 404.
- Transformers docs v5.23.0 `/de/` sayfaları: 404; aynı sayfaların v5.22.2 sürümü okundu (K12–K18).
- Gemini API "Tokens" sayfası (`?hl=de`): AI Studio uygulamasına yönleniyor, metin yok (0 kelime); yerine GKE Inference Gateway (K22) okundu.
- NVIDIA sözlüğü (glossary) LLM maddesi `de-de`: 404.
- Duden "Embedding", "Tokenizer", "GPU", "Feedforward" maddeleri: 404 (sözlükte yok). Duden "Repository" sayfa bütçesi için çıkarıldı, yerine "Decodierung" (K74) okundu; Repository'nin cinsiyeti HF sayfalarından (K9, K17).
- Sayfa bütçesi (80) için indirilip çıkarılanlar: HF LLM Course 1.5, 1.6, 3.1, 4.1, 4.2 ve Accelerate dokümanı; GKE "Inferenz-Konzepte"; NVIDIA L4; Apple Avusturya; Azure Cosmos DB kapasite planlayıcısı; Azure Databricks Model Serving genel sayfası; Google MLCC LLM giriş sayfası. Bunlar sayıma girmedi.

## Terimler

Sayım yöntemi (kural 5): okunan 80 sayfalık derlemde biçimi o anlamda kullanan sayfa sayısı. Fark 1 sayfa ya da daha azsa eşit sayıldı; o zaman biçimi kullanan yayıncı sayısı (Hugging Face, Google, Microsoft, NVIDIA, Apple, AMD, IBM, Kamu, Duden), o da eşitse geçiş sayısı belirledi. Notlardaki "X / Y sayfa" bu sayımdır. Metin Unicode NFC'ye çevrildi, yumuşak tire (U+00AD) silindi, bölünmez boşluk düz boşluk sayıldı, büyük-küçük harf ayrılmadı, sözcük sınırıyla arandı; sayım kod blokları ve satır içi kod dışındaki düzyazıda yapıldı. Ana içerik: Hugging Face'te `prose-doc` bloğu, Google'da `devsite-article-body`, IBM'de makale gövdesi, PLS'de `#main`, Duden'de `<article>`, ötekilerde `<main>`; menü, kenar çubuğu, altbilgi ve form öğeleri sayılmadı (Duden sözlük sayfaları yalnız madde bilgisi için kullanıldı). Cinsiyet (der / die / das) ve çoğul her satırda; çoğul sayıyla nasıl yazılıyorsa "Sayı ile ad" tablosunda. "BİRLEŞTİRME" işaretli öneriler derlemde birebir geçmiyor; parçalarının kaynağı notta.

| EN | de | Kaynak | Not / alternatif |
|---|---|---|---|
| GPU memory | der GPU-Speicher | K49, K29, K41, K54 | 6 / 4 sayfa. NVIDIA tablo etiketi "GPU-Speicher" (K49). Alternatif: "GPU-Arbeitsspeicher" (K24, K25, K29; yalnız Google). Kısaltma ile bileşik tireli yazılır (Yazım kuralları). |
| VRAM | der VRAM | K23 | Kısaltma, çevrilmez: "Don't translate industry-accepted acronyms" (K11). Derlemde 1 sayfa: "Wie viel VRAM benötigt mein Modell?" (K23). Artikel kaynakta görülmedi; "der Speicher" ile uyumlu eril önerilir. |
| weights / model weights | die Gewichte / die Modellgewichte | K19, K61, K44, K56 | Tekil das Gewicht. "Gewichte(n)" 22 / "Gewichtung(en)" 13 sayfa; "Modellgewichte(n)" 13 / "Modellgewichtung(en)" 3 sayfa. Alternatif: "Gewichtungen", "Modellgewichtungen" (K23; Google bellek formülü "Modellgewichtungen: die Größe der Modellparameter" (K23)); HF sözlüğü Weights için "Gewichtung" veriyor (K1). Apple sayfalarındaki "Gewicht" cihaz ağırlığı, sayılmadı. |
| KV cache | der KV-Cache | K23, K24, K56, K69 | 11 sayfa. Duden: "der Cache; Genitiv: des Cache, Plural: die Caches" (K69). "der / den / dem KV-Cache" 6 sayfa; dişil ya da nötr kullanım görülmedi. Genitif "des KV-Caches" (K24). Açılım: "Schlüssel/Wert-Cache (KV-Cache)" (K22, K23; Google). |
| overhead | der Overhead | K23, K24, K73 | Google bellek formülü: "Overhead: Ein Puffer für den Inferenzserver und anderen Systemaufwand" (K23). Duden: "Overhead, der" (K73). "der / den Overhead" 3 sayfa, nötr 0. Alternatif: "Systemaufwand" (K23). |
| activations | die Aktivierungen | K13, K23, K43 | Tekil die Aktivierung. "Zwischenaktivierungen" (K23). |
| parameters | der Parameter / die Parameter | K19, K23, K49 | Çoğul tekille aynı; datif çoğulda -n: "530 Milliarden Parameter" (K49), "mit 27 Milliarden Parametern" (K23). |
| active parameters | aktive Parameter | K63 | 1 sayfa (IBM); rakip biçim yok. |
| unified memory | gemeinsamer Arbeitsspeicher | K57, K58, K51 | Eril: der gemeinsame Arbeitsspeicher. Apple tablo değeri "16 GB gemeinsamer Arbeitsspeicher" (K57, K58). 2 / 1 / 1 sayfa. Alternatif: "kohärenter einheitlicher Systemspeicher" ve İngilizce "Unified System Memory" (K51; NVIDIA). |
| memory bandwidth | die Speicherbandbreite | K57, K49, K50, K28 | 9 sayfa; Apple ve NVIDIA tablo etiketi. NVIDIA H200 tablosu "Grafikkartenspeicher-Bandbreite" (K50) de yazıyor. |
| precision | die Genauigkeit | K23, K55, K65, K49 | "einer Genauigkeit von BF16" (K23), "16-Bit-Genauigkeit" (K55). 21 / 6 sayfa. Dikkat: HF sözlüğü Accuracy için de "Genauigkeit" veriyor (K1); doğruluk metriği bağlamında karışabilir. Alternatif: "Präzision" (K19, K65). |
| quantization | die Quantisierung | K65, K23, K24 | 7 sayfa; rakip biçim yok. "KV-Cache-Quantisierung" (K24). |
| quantized | quantisiert | K23, K24, K65 | "quantisierte Modell(e)" 3 sayfa. |
| checkpoint | der Checkpoint / die Checkpoints | K5, K17, K12 | 11 / 5 sayfa. Eril: "der / den Checkpoint" 2 sayfa (K5, K17), nötr 1 (K5). HF sözlüğü "Checkpoint(s)" (K1). Alternatif: "Prüfpunkte" (K39; Microsoft MT). |
| token | das Token / die Token | K31, K34, K64, K68 | 34 sayfa. Duden: "das oder der Token; Genitiv: des Tokens, Plural: die Token[s]" (K68). Nötr ("das / ein / jedes Token") 14 / eril ("einen Token") 1 sayfa (K62). Sayıyla çoğul "Token" 6 / "Tokens" 2 sayfa: "100 Token" (K31), "2.000 Token" (K35). Alternatif çoğul: "Tokens" (K19, K20, K23; Google). |
| tokenizer | der Tokenizer | K13, K18, K6 | 16 sayfa; eril 10 / nötr 4 sayfa. HF sözlüğü "Tokenizer" (K1). |
| vocabulary | das Vokabular | K31, K34, K61 | 8 sayfa. |
| embedding | die Einbettung / die Einbettungen | K32, K31, K19 | 12 / 7 sayfa ("Embedding"). Microsoft sayfa başlığı "Einbettungen" (K32). "Einbettungsvektor" (K19). Alternatif: "das Embedding" (K66), "Embeddings" (K66). |
| layer | die Schicht / die Schichten | K63, K13, K19, K61 | Sinir ağı katmanı anlamında "Schicht" 11 / "Layer" 6 / "Ebene" 5 sayfa ("Ebene"nin seviye anlamı sayılmadı). HF kursu "Layer" yazıyor ve açıklıyor: "mit speziellen Layern (im Deutschen auch als Schichten bezeichnet)" (K5); HF sözlüğü "Layer (plur. Layer(n))" (K1). Alternatif: "Layer" (K1, K5, K19), "Ebene" (K19, K20). |
| hidden size | Hidden Size | — | Kaynak yok: "Hidden Size" ve "verborgene Größe" 0 sayfa. Yakın biçimler: "die Anzahl der verborgenen Schichten" (K13), "verborgener Zustand" (K61). İngilizce kalır (İngilizce kalanlar). |
| attention | die Aufmerksamkeit | K61, K60, K20 | 15 / 10 sayfa ("Attention"). "Selbstaufmerksamkeit" 7 / "Self-Attention" 6 sayfa. Bileşik: "Aufmerksamkeitsmechanismus" (K61, K60). HF sözlüğü "Attention" (K1). Alternatif: "Attention" (K62, K24), "Self-Attention" (K20, K19). |
| attention head | der Aufmerksamkeitskopf / die Aufmerksamkeitsköpfe | K61, K62, K13 | 2 / 3 sayfa. Kısa biçim: "Anzahl der Köpfe pro Ebene" (K20). Alternatif: "Attention Head" (K60). KV başları: "Q-, K- und V-Köpfe" (K62); "KV-Köpfe" BİRLEŞTİRME. |
| head dimension | die Head-Dimension | K28 | 1 sayfa (Google MT): "Da die Head-Dimension 64 nicht für TPUs optimiert ist" (K28); çoğul "Head-Dimensionen" (K28). Almanca biçim ("Kopfdimension") 0 sayfa. |
| MHA / GQA / MQA / MLA | MHA / GQA / MQA | K62 | Kısaltma, çevrilmez (K11). MHA, GQA ve MQA K62'de; MLA derlemde 0 sayfa, o da aynen yazılır. Açılımlar İngilizce kalanlar tablosunda. |
| query / key / value | die Abfrage / der Schlüssel / der Wert | K61, K62, K60, K24 | "Abfrage- und Schlüsselvektoren" (K60); "Schlüssel (K) und Werte (V)" (K24); çoğul die Abfragen, die Schlüssel, die Werte. Dikkat: "Wert" sayfa ve tablo metninde "değer" anlamında çok yaygın. |
| feed-forward (layer) | die Feedforward-Schicht | K61, K60, K63 | "standardmäßige Feedforward-Schichten" (K61). Yazım: "Feedforward" 4 / "Feed-Forward" 2 sayfa. Alternatif: "Feedforward-Ebenen" (K60), "Feed-Forward-Netzschichten" (K63), "Feedforward-Netzwerk (FFN)" (K19). |
| MoE (mixture of experts) | Mixture of Experts (MoE) | K63, K49 | Açılım İngilizce kalıyor: "Mixture of Experts" 10 / "Mischung von Experten" 2 sayfa (K19, K63). Cinsiyet kaynakta net değil; kısaltma "das MoE-Modell" gibi bileşikte kullanılır ("MoE-Schichten" (K63)). |
| expert | der Experte / die Experten | K63, K19 | Zayıf eril (n-çekimi): yalın tekil "Experte", öteki hâllerde ve çoğulda "Experten" ("von jedem Experten-Subnetzwerk" (K63)). Sayıyla: "8 Experten", "128 Experten" (K63). |
| dense (model) | dichte Modelle | K63 | Sıfat dicht. "dichte Feed-Forward-Netzschichten" (K63). 1 sayfa (IBM). |
| sliding window attention | Sliding Window Attention | — | Kaynak yok: "Sliding Window" ve "gleitendes Fenster" 0 sayfa. İngilizce kalır. |
| RoPE | RoPE | K61, K64 | Kısaltma, çevrilmez. Açılım İngilizce: "Rotary Position Embedding (RoPE)" (K64), "Rotary Positional Encoding (RoPE)" (K61). |
| logits | die Logits | K13, K7, K19 | İngilizce kelime, çoğul. 5 sayfa. |
| inference | die Inferenz | K23, K22, K19 | 37 sayfa; dişil. Bileşik: "LLM-Inferenz" (K25, K54), "Inferenzserver" (K23). |
| serving / serve | die Bereitstellung / bereitstellen | K27, K22, K45 | Fiil: sayfa başlığı "Offene Gemma-Modelle mit GPUs in GKE mit vLLM bereitstellen" (K27); isim "Bereitstellung" 30 sayfa. Dikkat: Microsoft "Bereitstellung"ı deployment için de kullanıyor (K36, K35); serving ile deployment ayrımı kaybolur. Alternatif: "Serving" (K54, K45; çoğunlukla ürün ve özellik adlarında). |
| inference engine | die Inferenz-Engine | K23, K26, K54 | 3 sayfa; bitişik "Inferenzengine" 0. Dişil: "den Overhead der Inferenz-Engine" (K23). |
| context | der Kontext | K19, K20, K56 | 29 sayfa. |
| context window | das Kontextfenster | K64, K34, K27 | 8 sayfa. IBM başlığı "Was ist ein Kontextfenster?" (K64). |
| context length | die Kontextlänge | K64, K23, K40 | 5 sayfa; rakip biçim yok. IBM "Kontextfenster" ile eş anlamlı veriyor: "oder die „Kontextlänge“" (K64). |
| concurrent users | gleichzeitige Benutzer | K40, K47, K56 | 3 / 1 sayfa. "20 gleichzeitige Benutzer" (K40). Alternatif: "gleichzeitigen Nutzern" (K28). |
| concurrent requests | gleichzeitigen Anfragen | K23, K25, K28 | Yalın çoğul gleichzeitige Anfragen; kaynakta yalnız çekimli biçimler var: "gleichzeitiger Anfragen" (K25). 3 / 0 sayfa ("gleichzeitige Anforderungen"). Tekil die Anfrage. |
| prompt | der Prompt / die Prompts | K19, K37, K70 | 22 / 10 sayfa ("Eingabeaufforderung"; 9'u Microsoft). Duden: "der Prompt; Genitiv: des Prompts, Plural: die Prompts" (K70). Eril 8 / nötr 2 sayfa. Alternatif: "Eingabeaufforderung" (K37, K35). |
| prefill | das Prefill | K28, K40, K54 | 3 / 1 sayfa; İngilizce kelime: "chunkweise Prefill" (K40). Artikel kaynakta görülmedi; "das" önerilir (cinsiyet BİRLEŞTİRME). Alternatif: "Vorabfüllphase" (K25; karşılığı "Decodierungsphase" (K25)). |
| decode | die Decodierung | K25, K44, K54, K74 | Duden: "Von Duden empfohlene Schreibung" Decodierung, alternatif Dekodierung (K74). LLM anlamında "Decodierung" 4 / "Dekodierung" 5 sayfa → eşit; yayıncı 4 / 4; geçiş 11 / 7. Alternatif: "Dekodierung" (K14, K28). |
| batch | das Batch / die Batches | K6, K8, K72 | Duden: "der oder das Batch; Genitiv: des Batchs, Plural: die Batches" (K72). Nötr 3 / eril 1 sayfa (Duden hariç; eril yalnız K19). Bileşik: "Batchverarbeitung" (K40). HF sözlüğü "Batch" (K1). |
| batch size | die Batchgröße | K19, K25, K23, K38 | 8 / 2 sayfa. Alternatif: "Batch-Größe" (K10, K19). |
| throughput | der Durchsatz | K35, K36, K23 | 25 sayfa. |
| latency | die Latenz | K35, K23, K22 | 23 sayfa. |
| TTFT | Time to First Token · TTFT | K26, K28, K35 | Kısaltma çevrilmez; açılım ilk geçişte kısaltmayla birlikte. Açılım: "Time to First Token" 3 sayfa + "Time-to-First-Token" (K22) 1 = 4 / 4 sayfa ("Zeit bis zum ersten Token"), yayıncı 2 / 2, geçiş 6 / 5 → İngilizce açılım. Kaynakta kısaltma virgülle de veriliyor: "Time to First Token, TTFT" (K26, K28). Alternatif: "Zeit bis zum ersten Token" (K45, K22). |
| tokens per second | Token pro Sekunde | K40, K56 | 2 / 1 sayfa, yayıncı 2 / 1. "100 Token pro Sekunde" (K56). Alternatif: "Tokens pro Sekunde (TPS)" (K28). |
| requests per second | Anfragen pro Sekunde | K23 | "Anfragen pro Sekunde (RPS)" (K23). 1 / 1 sayfa ("Anforderungen pro Sekunde" (K47)), yayıncı 1 / 1, geçiş 1 / 2: kural tek başına "Anforderungen"ı seçerdi. Satır "request" ailesiyle sayıldı: "Inferenzanfrage" 4 / "Inferenzanforderung" 2 sayfa, "gleichzeitige Anfragen" 3 / 0 → "Anfragen". "Anforderungen" ayrıca gereksinim anlamında yaygın ("Leistungsanforderungen" (K26)). |
| sampling | das Sampling | K14, K39, K19 | Üretim anlamında "Sampling" 3 / "Stichprobe-" 2 sayfa ("Stichprobenziehung" (K14), "Stichprobenhyperparametern" (K60)) → eşit; yayıncı 3 / 2. "Aktivieren Sie das Sampling" (K14). Dikkat: "Stichprobe" istatistik örneklemi anlamında yaygın (K19). |
| temperature | die Temperatur | K19, K34, K37 | 4 sayfa. |
| chat template | Chat-Template | — | Kaynak yok: "Chat Template" ve "Chatvorlage" 0 sayfa. İngilizce kalır; bileşik yazımı BİRLEŞTİRME (Duden'in İngilizce isim-isim kuralı, İngilizce kalanlar). |
| speculative decoding | die spekulative Decodierung | K44 | 1 sayfa; aynı sayfada "spekulative Decodierung" 5 / "spekulative Dekodierung" 1 geçiş. "Entwurfsmodelle zum spekulativen Decodieren" (K44). Taslak model: das Entwurfsmodell (K44). |
| MTP | MTP | — | Kaynak yok (0 sayfa); kısaltma ve açılımı (Multi-Token Prediction) İngilizce kalır. "MTP-Schicht" Sayı ile ad tablosunda. |
| CUDA graphs | CUDA Graphs | — | Kaynak yok (0 sayfa); İngilizce özellik adı. |
| profiling | das Profiling | K53 | "GPU-Profiling und -Überwachung" (K53), "MIG-Profiling" (K53). 1 sayfa (NVIDIA). Fiil: "profilieren" (K41). |
| tensor parallelism | die Tensor-Parallelität | K23, K24, K41, K43 | 5 / 3 sayfa. Alternatif: "Tensorparallelität" (K23, K24, K62). |
| pipeline parallelism | die Pipeline-Parallelität | K41, K43, K23 | 3 / 1 sayfa. Alternatif: "Pipelineparallelität" (K23). |
| data parallelism | die Datenparallelität | K19, K46 | 2 sayfa; rakip biçim yok. Aynı aileden "Modellparallelität" (K43, K46). |
| expert parallelism | die Expertenparallelität | — | Kaynak yok (0 sayfa). Öneri BİRLEŞTİRME: "Datenparallelität" (K46) ve "Modellparallelität" (K43) kalıbı, "Experten" (K63). |
| replica | das Replikat / die Replikate | K19, K22, K26, K40 | 13 / 1 sayfa. "Modellreplikat" (K22). Alternatif: "Replikas" (K40). |
| capacity planning | die Kapazitätsplanung | K47, K23 | 2 sayfa; K47 başlığı "Architekturstrategien für die Kapazitätsplanung" (K47). Fiil: "Kapazität planen" (K23). |
| SLO | Service Level Objectives (SLOs) | K23, K30 | Kısaltma çevrilmez. Tekil "Service Level Objective (SLO)" (K30). Almanca biçim 0 sayfa. Cinsiyet: "das SLO" (K30). |
| fine-tuning | die Feinabstimmung / feinabgestimmt | K39, K16, K19, K22 | İsim: "Feinabstimmung" 20 / "Fine-Tuning" 11 / "Feintuning" 5 sayfa. Sıfat-fiil: "feinabgestimmt" 10 / "feingetunt" 2 sayfa; "LoRA-feinabgestimmte Modelle" (K22). Microsoft başlıkları "Feinabstimmung eines Modells mit überwachter Feinabstimmung in Microsoft Foundry" (K38), ara başlık "Überwachte Feinabstimmung" (K39). Alternatif: "das Fine-Tuning" (K19, K66), "Feintuning" (K5, K21; Duden "Feintuning, das" (K71)); HF sözlüğü "Feintuning" (K1). |
| instruction tuning / instruction-tuned (instruct) model | Instruction Tuning / instruction-tuned | K19, K20, K63, K66 | İsim: "Instruction Tuning" 4 sayfa (Google, IBM, BSI); Almanca biçim 0. BSI tireli de yazıyor: "Instruction-Tuning" (K66). Sıfat: "instruction-tuned" (K19, K23). Cinsiyet kaynakta görülmedi; "das Fine-Tuning" gibi nötr önerilir. |
| full fine-tuning | die vollständige Feinabstimmung | K19 | 1 sayfa (Google MT). "Feinabstimmung" ile aynı kök. |
| LoRA | LoRA / Low-Rank Adaptation | K45, K19, K22 | Kısaltma çevrilmez; açılım İngilizce: "Low-Rank Adaptation" (K45). Bileşik: "LoRA-Adapter" (K15, K44, K45). |
| QLoRA | QLoRA | — | 0 sayfa; kısaltma, aynen yazılır. |
| rank | der Rang | K45 | LoRA anlamında "Rang" 1 / "Rank" 1 sayfa → tam eşit (yayıncı 1 / 1, geçiş 1 / 1). K45 insan çevirisi (HT), K44 makine çevirisi; bu yüzden "Rang" seçildi (kural dışı karar). "auf den Rang Ihres größten Adapters" (K45). Alternatif: "Konfigurieren Sie Rank und Alpha für LoRA-Adapter" (K44). |
| adapter | der Adapter / die Adapter | K15, K45, K39 | 7 sayfa; eril: "der / den / einen Adapter" 4 sayfa. "LoRA-Adapter" (K15, K44, K45). |
| gradient checkpointing | Gradient Checkpointing | — | Kaynak yok (0 sayfa). Yakın: "Gradientenakkumulation" (K16, K39). İngilizce kalır. |
| optimizer | der Optimierer | K8, K16, K19 | 3 / 2 sayfa ("Optimizer" (K19)). Adam adı değişmez. |
| sequence length | die Sequenzlänge | K16, K18, K62 | 3 sayfa; rakip biçim yok. |
| GPU | die GPU / die GPUs | K23, K24, K40 | Kısaltma, çevrilmez (K11); dişil: "die / eine / jede GPU" 9 sayfa, eril 0. Çoğul "GPUs" 28 sayfa. Alternatif: der "Grafikprozessor" (K53, K49; 10 sayfa, çoğu NVIDIA). |
| graphics card | die Grafikkarte | K52, K50, K59 | 4 sayfa. "Tensor Core-Grafikkarte" (K50). |
| card | die Karte | K52 | "Abmessungen der Karte" (K52). Dikkat: "Modellkarte" (model card) ile karışabilir. |
| tensor throughput (TFLOPS) | die Tensor-Core-Leistung | K50, K29 | NVIDIA tablo etiketi "FP8 Tensor-Core-Leistung" (K50). "Tensor Cores" 5 / "Tensor-Recheneinheiten" 5 sayfa → eşit, yayıncı 2 / 1. TFLOPS kısaltma; NVIDIA "TeraFLOPS" da yazıyor (K49). Alternatif: "Tensor Core-Leistung" (K29), "Tensor-Leistung" (K29), "Tensor-Recheneinheiten" (K55). |
| sparsity | die Sparsity | K49, K19, K63, K29 | NVIDIA tablo dipnotu "Mit Sparsity" (K49). 4 / 3 sayfa ("dünnbesetzt" / "dünn besetzt", sıfat). Alternatif: "dünn besetzte MoE-Schichten" (K63; sıfat), "Sparsamkeit" (K63). |
| 2:4 structured sparsity | strukturelle Sparsity | K29 | "unterstützt strukturelle Sparsity" (K29). "2:4" oranı aynen yazılır. 1 sayfa (Google MT). |
| datasheet | das Datenblatt | K49, K50, K51 | 4 sayfa. "Datenblatt anzeigen" (K49, K51). |
| form factor | der Formfaktor | K49, K50 | NVIDIA tablo etiketi; değerler SXM / PCIe. |
| MIG | Mehr-Instanzen-GPU (MIG) | K53, K49, K50 | Kısaltma çevrilmez. "Mehr-Instanzen-GPU" 4 sayfa (K53, K49, K50, K55); K53 sayfa başlığı ise "Mehr-Instanzen-Grafikprozessor (MIG)" (K53). Dişil (die GPU). Alternatif: "Mehr-Instanzen-Grafikprozessoren" (K49), "Mehr-Instanzen-Grafikkarte" (K50). |
| repository | das Repository / die Repositories | K9, K17, K12 | "das / ein Repository" 2 sayfa (K9, K17). Çoğul "Repositorys" 2 / "Repositories" 1 sayfa → eşit, yayıncı 1 / 1, geçiş 5 / 8. Alternatif: "Repositorys" (K9, K17), "Repo" (K8). |
| model card | die Modellkarte / die Modellkarten | K10, K17, K45 | 4 / 3 sayfa ("Model Card"; yalnız HF). K10 başlığı "Erstellung einer Modellkarte" (K10). HF kursu açıklama olarak "Steckbrief" da yazıyor (K9, K10). |
| config / config.json | die Konfiguration / die Konfigurationsdatei | K13, K19, K8, K41 | config.json dosya adı, değişmez. "Modellkonfiguration" (K41). HF sözlüğü "Konfiguration" (K1). |
| open weights | Modelle mit offenen Gewichten | K44 | "Modelle mit offenen Gewichten" (K44). 1 / 1 sayfa ("Open-Weights-Modell" (K28)) → eşit; yayıncı 1 / 1; geçiş 1 / 1. "Gewichte" ile tutarlı olan seçildi. Alternatif: "Open-Weights-Modell" (K28), "offene Modelle" (K28), "ein offenes Modell" (K45). |
| LLM | das LLM / die LLMs | K19, K20, K34, K66 | 29 sayfa; nötr ("das / ein LLM") 11 / eril 2 sayfa. Açılım: "Large Language Model" 18 / "große(s) Sprachmodell" 17 sayfa → eşit; yayıncı 5 / 5; geçiş 99 / 35 (K66 kaynakçasındaki İngilizce başlıklar çıkarılsa da 77 / 35) → "Large Language Model (LLM)" (K37, K19). BSI: "Große KI-Sprachmodelle (engl.: Large Language Models – LLMs)" (K66). Alternatif: "große Sprachmodelle" (K34, K49, K67). |
| calculator | der Rechner | K36, K49 | Araç adında son ek: "Kapazitätsrechner" (K36), "Energieeffizienz-Rechner" (K49, K50, K55). Tek başına "Rechner" derlemde bilgisayar anlamında (K67). |
| gated model | Modelle mit eingeschränktem Zugriff | K26 | "Wenn Sie Modelle mit eingeschränktem Zugriff wie Gemma oder Llama bereitstellen möchten" (K26). Tekil das Modell mit eingeschränktem Zugriff. 1 sayfa (Google MT). "Gated" ve "zugriffsbeschränkt" 0 sayfa. |
| headroom | der Puffer | K26, K23 | Kapasite payı anlamında: "mit einem Puffer, um die Latenz beim Hochskalieren zu berücksichtigen" (K26); Google bellek formülü overhead'i de "Ein Puffer" diye tanımlıyor (K23). 2 sayfa. "Spielraum" (K30) SLO hata bütçesi anlamında, seçilmedi. "Headroom" 0. |
| VRAM calculator (nav "VRAM Sizing") | VRAM-Rechner / VRAM-Dimensionierung | K36, K49, K41 | Ad kaynakta yok; BİRLEŞTİRME. Kalıp: "Kapazitätsrechner" (K36), "Energieeffizienz-Rechner" (K49); sizing için "PTU-Dimensionierung" (K36), "Dimensionierung des GPU-Speichers" (K41). Kısaltma + tire (K78). |
| Fine-tuning VRAM (nav "Fine-tune") | Feinabstimmung / VRAM für die Feinabstimmung | K39, K19 | Menü etiketi "Feinabstimmung" kaynaklı (K39); sayfa adı "VRAM für die Feinabstimmung" BİRLEŞTİRME. |
| Task fit (nav "Task Fit") | Aufgabeneignung / Eignung für die Aufgabe | K1, K66 | Ad kaynakta yok; BİRLEŞTİRME. Task için "Aufgabe / Aufgabenstellung" (K1); "die Eignung eines Modells für ihren Anwendungsfall" (K66). "Aufgabeneignung" 0 sayfa. |
| Model anatomy | Modellanatomie | — | Ad kaynakta yok; BİRLEŞTİRME. "Anatomie" derlemde 0 sayfa. İngilizce "Model Anatomy" bırakmak da kural gereği mümkün; karar dil sahibinin. |
| Compare models (nav "Model Compare") | Modelle vergleichen | K23, K10, K29 | Kaynaklı fiil öbeği: "um Modelle zu vergleichen" (K23), "GPU-Modelle vergleichen" (K29). |
| Model name decoder (nav "Name Decoder") | Modellnamen-Decoder | K13, K17, K1 | Ad kaynakta yok; BİRLEŞTİRME. "Modellnamen" (K13, K17); HF sözlüğü Decoder için "Decoder" (K1). Dikkat: "Decoder" Transformer'ın decoder bloğu anlamında da geçiyor (K5, K20). |
| vLLM settings (nav "vLLM Params") | vLLM-Einstellungen | K41 | Kaynaklı: "unterstützte vLLM-Einstellungen" (K41). Çoğul; tekil die Einstellung. |
| Config Decoder (config.json explained) | Config-Decoder / config.json erklärt | K13, K1 | Ad kaynakta yok; BİRLEŞTİRME. "Config" 0 sayfa, "Konfiguration" (K13); "Decoder" (K1). Alternatif: "Konfigurations-Decoder". |
| Serving Brief | Bereitstellungsübersicht | K22, K23, K9 | Ad kaynakta yok; BİRLEŞTİRME. "Bereitstellung" (K22), "Übersicht" (K23 başlığı "Übersicht über Best Practices für die Inferenz in GKE"). Alternatif: "Bereitstellungs-Steckbrief" (BİRLEŞTİRME); HF kursu model card'ı "Steckbrief" (K9, K10) diye açıklıyor. 24 harf; dar ekranda taşma riski (Yazım kuralları). |
| Capacity plan / capacity planner | die Kapazitätsplanung / der Kapazitätsplaner | K47, K23, K40, K36 | Plan için "Kapazitätsplanung" kaynaklı (K47, K23). Planner aracı adı kaynakta yok; "Kapazitätsplaner" BİRLEŞTİRME: "GPU-fähiger Planer" (K40). Microsoft'un benzer aracı "Kapazitätsrechner" (K36). |
| GPU compare | GPU-Vergleich / GPUs vergleichen | K28, K29 | Ad kaynakta yok; BİRLEŞTİRME. Kalıp: "Benchmark-Vergleich" (K28); fiil öbeği "GPU-Modelle vergleichen" (K29), "Modelle vergleichen" ile paralel. |
| LLM 101 | LLM-Grundlagen | K34 | Kaynaklı: Microsoft sayfa başlığı "LLM-Grundlagen" (K34). |
| Feed (footer "LLM Feed") | Neuigkeiten / LLM-Neuigkeiten | K48 | Microsoft stil kılavuzu "Here are some news" (K48) için "Neuigkeiten" (K48) veriyor. "Feed" 0 sayfa. "LLM-Neuigkeiten" BİRLEŞTİRME (kısaltma + tire, K78). |
| footer "AI ile çevrildi · Düzeltme öner" ("This page was translated with AI" · "Suggest a correction") | Diese Seite wurde mit KI übersetzt · Korrektur vorschlagen | K22, K31, K26 | Cümleler kaynakta birebir yok; BİRLEŞTİRME. Google sayfa notu (ana içerik dışında, K19–K30'un hepsinde): "Google verwendet KI-Technologie, um Inhalte in Ihre bevorzugte Sprache zu übersetzen" (K22). Microsoft geri bildirim düğmesi (ana içerik dışında): "Lösung vorschlagen" (K31, K35). "Korrekturen" (K26). |

## İngilizce kalanlar

| EN | Neden |
|---|---|
| hidden size | Kaynak yok ("Hidden Size", "verborgene Größe" 0 sayfa). "verborgen" yalnız "verborgenen Schichten" (K13, K19) ve "verborgener Zustand" (K61) içinde geçiyor. Etiket "Hidden Size", config alanı `hidden_size` olarak kalır. |
| sliding window attention, chat template, MTP (Multi-Token Prediction), CUDA graphs, gradient checkpointing, QLoRA, MLA (Multi-head Latent Attention) | Derlemde 0 sayfa. Almanca metinde büyük harfle ve Almanca bileşik kuralıyla yazılır: "Sliding Window Attention", "Chat-Template", "CUDA Graphs", "Gradient Checkpointing". |
| Grouped Query Attention (GQA açılımı) | IBM başlığı "Was ist Grouped Query Attention (GQA)?" (K62); Almanca biçimler aynı sayfada birer kez ve birbirinden farklı: "gruppierte Abfrageaufmerksamkeit" (K62), "Aufmerksamkeit für gruppierte Abfragen" (K62). Sayfa ve yayıncı eşit, geçişte İngilizce önde. |
| Multi-Query Attention (MQA açılımı) | "Multi-Query Attention (MQA)" (K62); Almanca biçim yok. Tireli biçim de var: "Multi-Query-Attention" (K62). |
| Multi-Head Attention (MHA açılımı) | "Multi-Head-Attention (MHA)" (K62); yarı Almanca "Multi-Head-Aufmerksamkeit" (K61), "Multi-Head-Selbstaufmerksamkeit" (K19). Kısaltma yeter. |
| Mixture of Experts, Time to First Token, Service Level Objective, Large Language Model, Low-Rank Adaptation, Rotary Position Embedding | Kaynakların çoğu açılımı Almanca metinde İngilizce yazıyor; sayımlar Terimler tablosunda. |
| Prompt, Token, Tokenizer, Batch, Overhead, Checkpoint, Sampling, Logits, Prefill, Repository, Sparsity, Engine, Profiling | Almanca isim olarak kullanılıyor; cinsiyet ve çoğul Terimler tablosunda. HF çeviri kuralı İngilizce kelimeye izin veriyor: "The German language accepts English words especially in modern contexts" (K11). |
| Kısaltmalar: VRAM, GPU, KV, MoE, MHA, GQA, MQA, MLA, LoRA, QLoRA, BF16, FP8, INT4, TTFT, RPS, SLO, MIG, RoPE, MTP, CUDA, TFLOPS, LLM, ID | Kural 4: kısaltma çevrilmez. HF kuralı aynı: "Don't translate industry-accepted acronyms. e.g. TPU or GPU." (K11). Kısaltmanın cinsiyeti açılımındaki Almanca başın cinsiyetidir: die GPU, das LLM, der KV-Cache, die ID ("eine ID" (K31, K33)). |
| Adlar: vLLM, SGLang, LLMScale, Hugging Face, NVLink, Adam, config.json, Kubernetes | Ürün, kütüphane ve dosya adları değişmez. Ürün adından sonra gelen Almanca kelime tireyle bağlanır, ürün adının içi tirelenmez: "Visual Studio-Plug-in" (K48), "Tensor Core-Grafikkarte" (K50). |

Büyük harf ve tire kuralları (kaynakta gözlenen):
- **İngilizce isim Almanca metinde büyük harfle başlar** ve Almanca artikel alır: "das Sampling" (K14), "das Fine-Tuning" (K19, K66), "der Prompt" (K70). Fiil ve sıfat küçük: "instruction-tuned" (K19), "feintunen" (K1).
- **Kısaltmalı bileşik tireli yazılır.** Duden: "Ein Bindestrich steht in Zusammensetzungen mit Schreibabkürzungen und Initialwörtern" (K78); örnekleri "Kfz-Papiere, UKW-Sender" (K78). Derlemde: "GPU-Speicher" (K49), "KV-Cache" (K23), "LoRA-Adapter" (K45), "vLLM-Einstellungen" (K41), "LLM-Inferenz" (K25).
- **İngilizce çok kelimeli terim Almanca bileşiğin parçasıysa bütün parçalar tireyle bağlanır** (Durchkopplung): "Social-Media-Konto" (K48), "Self-Attention-Mechanismus" (K19, K20, K63), "Feed-Forward-Netzschichten" (K63). İngilizce sıfat + isim tek başına ayrı yazılır: "Social Media" (K48); bu yüzden "Large Language Model", "Instruction Tuning" ayrı.
- **İngilizce isim + isim** tireyle ya da bitişik: Duden "Desktop-Publishing" (K78); Microsoft "Chat-Widget" (K48). "Fine-Tuning" 6 / "Fine-tuning" 4 sayfa (büyük T önde).
- **Fiil + parçacık bileşiklerinde parçacık küçük:** "Plug-in", "Add-on" (K48).
- **Almanca + Almanca bileşik bitişik:** "Batchgröße" 8 / "Batch-Größe" 2 sayfa; "Kontextfenster", "Speicherbandbreite", "Kapazitätsplanung". Microsoft üç parçaya kadar bitişik yazıyor ("compounds of three components or less are written in one word" (K48)).

## Yazım kuralları

Yalnız kaynaklarda gözlenen kullanım. Karar dil sahibinindir. Sayımlar kod blokları ve satır içi kod dışındaki düzyazıda yapıldı; "NBSP" bölünmez boşluk (U+00A0), "düz" normal boşluk. Duden sözlük sayfaları ve Microsoft stil kılavuzu (K48) sayımlara katılmadı, kural kaynağı olarak anıldı.

- **Hitap.** Sie. Kaba sayım (Sie / Ihnen / Ihr- ile du / dich / dir / dein-; cümle başındaki "Sie" = "onlar" da sayıma giriyor): HF Transformers 410 / 0, HF LLM Course 12 / 265, Google 1768 / 5, Microsoft Learn 1314 / 20, NVIDIA 112 / 54, Apple 4 / 32, IBM 53 / 0. Sayfa başına baskın biçim: Sie 51 sayfa (HF Transformers 7, Google 12, Microsoft 17, NVIDIA 6, AMD 1, IBM 6, Kamu 2), du 13 sayfa (HF LLM Course 9, NVIDIA tüketici sayfaları K51 ve K52, Apple K57 ve K58). HF LLM Course bilinçli olarak du kullanıyor; kural 1 Sie yerine Du diyor, gerekçe: "to keep the tone jovial" (K11). Microsoft stil kılavuzu kullanıcıya Sie ile hitap ediyor ("Sie bestimmen, wann neue Updates installiert werden sollen" (K48)), du'yu 18 yaş altı için ayırıyor ("when addressing children/teens under age of 18, use the informal “du”" (K48)). HF kural 13 emir kipini öneriyor: "Siehe Kapitel X" (K11).
- **Ondalık ve binlik ayırıcı.** Ondalıkta virgül, binlikte nokta. Microsoft kuralı (Almanya, Avusturya, Lüksemburg): "Decimal Separator Example: 10,50 cm; 199,95 €; 1.495,68 kg" (K48), "Thousand Separator Example: 9.999,99 €; 120.000 kg" (K48). Derlem: ondalık virgül / nokta Google 182 / 110 (noktalıların çoğu sürüm numarası ve tarih), Apple 82 / 10, NVIDIA 27 / 20, IBM 17 / 10, Microsoft Learn 18 / 53 (MT sayfaları İngilizce düzende), BSI 0 / 45 (bölüm numaraları). Binlikte nokta: Google 163 (8 sayfa; "2.000 × 2.000" (K19)), Apple 18, IBM 17, NVIDIA 12 ("1.979 TeraFLOPS" (K49)), Microsoft 7, HF 3. Binlikte virgül (İngilizce düzen): Microsoft 12, Google 6, NVIDIA 5. Boşlukla gruplama: Duden kuralı, 5 ve daha çok basamakta ("34 500 zahlende Zuschauer" (K77)); 4 basamak yalnız tabloda gruplanıyor. Derlemde boşluklu binlik yalnız NVIDIA (2) ve Apple (NBSP, 3).
- **Sitenin çıktısı.** Site sayıları `Intl` ile biçimliyor; `de` için "de-DE-u-nu-latn" ölçüldü (GTR9, Node 24.21.0, ICU 78.3, CLDR 48.0; tarayıcıda ölçülmedi): 1234.5 → "1.234,5"; 12345.67 → "12.345,67"; 131072 → "131.072"; 27000000000 → "27.000.000.000"; 0.31 → "0,31"; yüzde 0.05 → "5 %", 0.855 → "85,5 %" (yüzde öncesi U+00A0). Çıktı Microsoft kuralı ve derlem çoğunluğuyla uyumlu (nokta binlik, virgül ondalık); Duden'in 4 basamakta gruplamama önerisinden farklı ("1.234,5"). Karşılaştırma: "de-AT-u-nu-latn" 1234.5 → "1 234,5" (binlik U+00A0), "de-CH-u-nu-latn" 1234.5 → "1'234.5", 0.05 → "5%".
- **Yüzde.** Sayı ile % arasında boşluk (düz ya da NBSP) / bitişik: Google 31 / 63, Apple 46 / 0 ("90 %" NBSP ile, K57 ve K58), Microsoft 3 / 14, NVIDIA 3 / 1, IBM 5 / 0, HF 4 / 0, BSI 0 / 3. Sayfa olarak boşluklu 15, bitişik 12 → karışık. `Intl` çıktısı boşluklu ("5 %"); sitenin `serve.percent` ("{n}%") metni de buna uydurulursa sayfada tek biçim kalır. Bitişik yazım türetmede doğru: "75%ig" (K78).
- **Tırnak.** Alman tırnağı „ “ (alt açılış, üst kapanış). Microsoft kuralı: "Favored solution (curly, bottom/top): „Anführungszeichen“" (K48). Derlem: „…“ Google 297 (9 sayfa), IBM 84, BSI ve PLS 26, Microsoft 17; İngilizce “…” HF LLM Course 36, HF Transformers 31, BSI ve PLS 15, NVIDIA 5; düz "…" Microsoft Learn 212 (10 sayfa, MT), HF 18. Kitap tırnağı »…« yalnız Duden örneklerinde (6). Duden örneği: "Sie sagte: „Hier gefällt es mir.“" (K79).
- **Tire.** Gedankenstrich boşluklu en dash " – ": Microsoft 66, NVIDIA 58, IBM 48, BSI ve PLS 28, Google 26, Apple 16, HF 6. Em dash — az (Microsoft 20, BSI 10, Apple 6); Microsoft kuralı em dash'i Almanca belgede kullanmıyor ("not used in German documentation" (K48)). Sayı aralığında boşluksuz en dash: "1–2 GB" (K23), "350–400 W" (K49). Duden örneği: "Er glaubte sich in Sicherheit – ein verhängnisvoller Irrtum." (K80). HF metni boşluklu kısa tireyi (" - ") de kullanıyor (30 geçiş).
- **Başlıklarda büyük harf.** Almanca kural: isimler her yerde büyük, öteki kelimeler küçük; İngilizce Title Case uygulanmaz: "Do not apply the same principle to German titles" (K48). Örnek başlıklar: "Was ist ein Kontextfenster?" (K64), "Grundlegendes zu Token" (K31), "Architekturstrategien für die Kapazitätsplanung" (K47).
- **Büyük sayılar.** billion → Milliarde (dişil; Duden kısaltması "Md., Mrd. und Mia." (K75)): "530 Milliarden Parameter" (K49), "Bis zu 200 Mrd. Parameter" (K51), "Klein (8 Mrd.)" (K28). "Milliarde(n)" Google 15, IBM 10, NVIDIA 5, Apple 4, Microsoft 2; "Mrd." Google 4, NVIDIA 5. trillion → Billion (Duden: "eine Million Millionen" (K76)): "Billionen von Parametern" (K20, K23, K49, K56). Almanca "Billion" 10^12 demek; İngilizce billion ile karıştırılmamalı. Model adlarındaki "70B" değişmez ("Llama 2 70B" (K49)).
- **Birim.** "GB", "TB/s" Almanca metinde de aynen; sayı ile birim arasında boşluk: Google 61, NVIDIA 65, Apple 56 (NBSP), Microsoft 4; bitişik ("141GB" (K50)) Google 7, NVIDIA 4, HF 2. "64 GB" (K51), "4,8 TB/s" (K50). Site GB, GiB ve TB/s etiketlerini korur (Dalga 2 kararı, fr.md). Bayt çoğulu: "Bytes pro Sekunde" (K48), sayı arkasında "übertragene Byte" (K28) da var (Sayı ile ad).
- **ß ve ss.** Almanya ve Avusturya ß, İsviçre ss (Hedef). ß geçişi Google 494, Microsoft 217, BSI ve PLS 211, IBM 127, HF 91, NVIDIA 89; Apple İsviçre 0. Microsoft kuralı büyük harfli metinde "ẞ"ye izin veriyor: "STRASSE – STRAẞE" (K48).
- **Cinsiyet özeti.** der: KV-Cache, Overhead, Prompt, Tokenizer, Checkpoint, Adapter, Optimierer, Rang, Durchsatz, Kontext, Parameter, Experte, GPU-Speicher, Puffer, Rechner. die: GPU, Inferenz, Latenz, Schicht, Aufmerksamkeit, Einbettung, Quantisierung, Genauigkeit, Feinabstimmung, Decodierung, Batchgröße, Kontextlänge, Bereitstellung, Kapazitätsplanung, Modellkarte, Grafikkarte, Konfiguration, ID. das: Token, LLM, Batch, Sampling, Prefill (önerilen), Kontextfenster, Vokabular, Replikat, Repository, Datenblatt, Fine-Tuning, Feintuning, SLO.
- **Uzun bileşik ve taşma.** Almanca bileşikler boşluksuz ve uzun; dar ekranda (ör. 320 px menü, kart başlığı, tablo hücresi) satıra sığmayabilir. Derlemdeki en uzunlar: "Selbstaufmerksamkeitsmechanismus" (32 harf; K19, K20, K61, K64), "Wahrscheinlichkeitsverteilung" (29; K14, K19, K34, K61), "Aufmerksamkeitsmechanismus" (26; K19, K60, K61, K62), "Standardbereitstellungen" (24; K35, K36, K39). Sitedeki adaylar: "Aufmerksamkeitsköpfe" (20), "Bereitstellungsübersicht" (24), "Mehr-Instanzen-GPU" (18), "Grafikkartenspeicher-Bandbreite" (31; K50). Apple bu yüzden metne yumuşak tire (U+00AD) koyuyor: K57'de 513, K58'de 510 tane ("Speicher­bandbreite" (K57)); öteki yayıncılarda 0. Çözüm kodda: `lang="de"` ile CSS `hyphens: auto` ve `overflow-wrap: anywhere`; metne elle yumuşak tire koymak sözlük işi değil.

## Ayırıcılar

Kodda dile göre tutulan ayırıcılar ve Almanca değerleri. Sayımlar düzyazıda, kod ve URL çıkarılarak yapıldı (HF, Google, Microsoft Learn, NVIDIA, Apple, IBM, BSI, PLS).

| Anahtar | de değeri | Kanıt |
|---|---|---|
| `list.sep` | ", " | Virgülden önce boşluk yok, sonra boşluk var (Almanca kural, İngilizceyle aynı). Liste son öğeden önce "und" ile biter, "und"dan önce virgül konmaz: `Intl.ListFormat("de")` çıktısı "a, b und c" (GTR9, Node 24.21.0). Microsoft kuralı: "und" önüne virgül yalnız iki tam cümleyi bağlarken (K48). `list.and` → " und " (boşluk değerin içinde). |
| `colon.sep` | ": " | İki noktadan önce boşluk yok: boşluksuz 2424 / boşluklu 21 geçiş (boşlukluların çoğu kod kalıntısı), NBSP 0. Sonra boşluk: 2383 / bitişik 35 (Google MT yazım hataları, ör. "Roofline-Analyse:Die" (K28)). Fransızcadaki gibi bölünmez boşluk yok. |
| `semicolon.sep` | "; " | Önce boşluk yok: 70 / 1 geçiş; sonra boşluk 70. |
| `join.sentence` | " " | Cümleler arasında tek düz boşluk. |
| `join.list` | ", " | `list.sep` ile aynı. |
| `join.colon` | ": " | `colon.sep` ile aynı. |

Beklenen değerler (", ", ": ", "; ", cümle " ") kaynakla doğrulandı; İngilizce kaynak dosyasındaki değerlerle aynı.

## Sayı ile ad

Almanca çoğul kuralı iki biçimli: `Intl.PluralRules("de")` 1 → one, 0 / 2 / 1.5 → other (GTR9, Node 24.21.0). countKey'in `.one` ve `.other` anahtarları yeter. Dikkat: Almanca ad hâl ekiyle de değişir; şablon cümledeki hâle göre yazılmalı (ör. "mit 1 Experten", "1 Experte ist aktiv"; "mit 27 Milliarden Parametern" (K23)). 0 çoğuldur: "0 Schichten".

| EN (tekil / çoğul) | de tekil (one) | de çoğul (other) | Kaynak | Not |
|---|---|---|---|---|
| layer / layers | 1 Schicht | 32 Schichten | K63, K19, K13 | die Schicht. "in einer Schicht" (K63), "verborgenen Schichten" (K13, K19). |
| attention head / heads | 1 Aufmerksamkeitskopf | 32 Aufmerksamkeitsköpfe | K61, K62, K13 | der Kopf; datif çoğul "-köpfen" ("Selbstaufmerksamkeitsköpfen" (K20)). Kısa etiket: Kopf / "Köpfe" (K20). |
| expert / experts | 1 Experte | 128 Experten | K63 | Zayıf eril: tekil yalın "Experte", öteki hâller "Experten". "durch 128 Experten" (K63). |
| token / tokens | 1 Token | 100 Token | K31, K34, K68 | Duden çoğulu "die Token[s]" (K68); sayıyla "Token" 6 / "Tokens" 2 sayfa. "100 Token" (K31). |
| id / ids | 1 ID | 5 IDs | K31, K33 | die ID; "eine ID" (K31, K33), "Token-IDs" (K31, K33, K34). |
| item / items | 1 Element | 3 Elemente | K6, K19, K31 | das Element; 9 / 12 sayfa. |
| field / fields | 1 Feld | 3 Felder | K7, K19, K6 | das Feld; 9 / 5 sayfa. |
| byte / bytes per parameter | 1 Byte pro Parameter | 2 Bytes pro Parameter | K28, K48 | BİRLEŞTİRME: "Byte pro Parameter" derlemde 0. Kalıp "FLOPS pro Byte" (K28), "Bytes pro Sekunde" (K48). Alternatif çoğul: "2 Byte" ("übertragene Byte" (K28)). |
| tensor / tensors | 1 Tensor | 3 Tensoren | K19, K29, K18 | der Tensor; 9 / 5 sayfa. |
| file / files | 1 Datei | 3 Dateien | K9, K17, K44 | die Datei; 9 / 12 sayfa. |
| module pattern / patterns | 1 Modulmuster | 3 Modulmuster | K1, K44, K19 | BİRLEŞTİRME: "Modulmuster" 0 sayfa. Module için "Modul" (K1), LoRA hedefi "Zielmodule" (K44), das Muster (K19); çoğul tekille aynı. |
| stop token / tokens | 1 Stopptoken | 2 Stopptoken | K34, K35 | das Stopptoken: "ein Stopptoken" (K34, HT). Kalıp "Stoppsequenzen" (K35). Çoğul Token'a göre (BİRLEŞTİRME). |
| MTP layer / layers | 1 MTP-Schicht | 2 MTP-Schichten | K78, K63 | BİRLEŞTİRME: "MTP" 0 sayfa. Kısaltma + tire (K78), "Schicht" (K63); bileşik kalıbı "MoE-Schichten" (K63). |

## Uygulamada verilen kararlar (Dalga 4)

- **Hitap ve yazım.** Okura "Sie"; tırnak „…“; İngilizcedeki uzun tire yerine boşluklu en dash " – ". og:title'lar "LLMScale — …" biçiminde kalır, çünkü scripts/prerender.ts breadcrumb adını bu uzun tireden ayırıyor.
- **Sayılar.** Düzyazıdaki sabit ondalıklar virgülle ("0,13 GiB", "4,25 Bit"), binlik noktayla ("2.048 Token"); yüzde "{n} %" (U+00A0, `Intl` de-DE çıktısıyla aynı). Sürüm numaraları, komut satırı ve config değerleri değişmez ("vLLM 0.31", `--gpu-memory-utilization 0.92`).
- **Çoğul.** İngilizcede `{s}` taşıyan cümleler `.one` girdisi alır. İngilizcede tekil anahtarı olmayan üç sayım sözcüğü de `.one` aldı: `config.w.fields.one` "Feld", `config.w.items.one` "Element", `config.w.layers.one` "Schicht" ("1 Felder" yerine "1 Feld"). Model sayfasındaki etiket "1 Schicht" / "80 Schichten".
- **Sözlükte olmayıp seçilenler.** reasoning → Reasoning; tool calling → Toolaufrufe; workload → Arbeitslast (K25); runtime → Laufzeitumgebung; serving engine → Inferenz-Engine; layout (TP/PP/DP) → Aufteilung; MIG slice → MIG-Instanz; draft model → Entwurfsmodell (K44); power → Leistungsaufnahme; accuracy → Ergebnisgenauigkeit ya da Qualitätsverlust (Genauigkeit precision için kalır); Custom sekmesi → Manuell.
- **Kısa etiketler.** Menüde "Bereitstellungs-Übersicht" (başlıkta "Bereitstellungsübersicht"); model seçicide "Köpfe"; büyük harfle yazılan hız etiketi "Tempo der Decodierung, höchstens". Menü ve başlık "LLM 101", diğer dillerle aynı.

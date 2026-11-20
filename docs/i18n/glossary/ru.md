# Terim sözlüğü — Русский (ru)

Durum: Dalga 4 (2026-11-19). Kaynak dil EN. Kural: docs/i18n-plan.md §4 — karşılık birincil kaynaktan, kaynaksız terim İngilizce kalır.

Hedef: bölge kodu olmayan tek `ru` sürümü; Rusya'daki okur ile Rusya dışındaki Rusça okur (Belarus, Kazakistan, Kırgızistan ve öteki ülkeler) aynı metni okur. Kaynakların bir kısmı Rusya'da yayımlanıyor (Yandex, Sber, Cloud.ru, Selectel), bir kısmı küresel dokümantasyonun Rusça sürümü (Hugging Face, Google, Microsoft). Ülkeye göre ayrışan kullanım ölçülmedi.

## Kaynaklar

Her sayfa 2026-11-19'da indirildi, ana içeriği metne çevrildi ve terim o metinde arandı. Tablodaki her biçim, kaynak sütununda adı geçen sayfada geçiyor (otomatik denetim: 333 biçim, hepsi bulundu; betik tablodaki 108 biçimi ve notlardaki 225 alıntıyı denetler, karşılaştırmada büyük-küçük harf ve boşluk türü ayrılmadı, ё ile е ayrı harf sayıldı). Tablodaki biçimler sözlük biçiminde; 5'i (унифицированная память, плотная модель, одновременные пользователи, одновременные запросы, экспертный параллелизм) kaynakta yalnız çekimli geçtiği için sözcük köküyle eşleşti (son iki harf serbest), alıntılar birebir eşleşti. BİRLEŞTİRME satırlarında bütün biçim değil, parçaların alıntıları denetlendi. Hugging Face Transformers için canlı site okundu (v5.23.0). GitHub'da `docs/source/ru` klasörü yok ve canlı sitenin Rusça kenar çubuğu yalnız index, installation, peft ve quicktour sayfalarını listeliyor; yine de okunan 22 sayfa (K16–K37) Rusça içerikle açılıyor, nasıl çevrildikleri bilinmiyor. Hub dokümanının Rusça sayfaları da canlı, ama `huggingface/hub-docs` deposunda `ru` klasörü bulunamadı. HF LLM Course'un Rusça çevirisi topluluk çevirisi; çeviri kuralları K2'de.

Makine çevirisi: Microsoft Learn sayfalarının hepsinde (K47–K59) `ms.translationtype` etiketi MT (makine çevirisi). Google K42–K45'in ham HTML'inde "Эта страница переведена с помощью Cloud Translation API" (K42, K43, K44, K45) notu var; K46'da yok. K42 sözlüğünün yalnız ilk maddeleri Rusça (18 120 satırın 424'ü), gerisi İngilizce. Transformers'ın Rusça sayfalarında çeviri notu yok, ama makine çevirisine benzeyen hatalar var: "Ключевые и значения (KV) векторы" (K20), attention head için "заголовков внимания" (K21), cinsiyet uyumu bozuk başlıklar "Тензорное параллелизм для инференса" (K26) ve "Параметрически эффективная дообучение" (K31). Google'ın K44 başlığı LLM'yi "Магистр права" (hukuk yüksek lisansı) diye çeviriyor. Bu sayfalar yine birincil kaynak sayıldı; yalnız Google ve Microsoft'tan gelen biçimler notta ayrıca işaretlendi.

Yayıncı ayrımı: Habr yazıları (K72, K73) Sber şirket bloglarından (SberDevices, Сбербанк). Cloud.ru sayfaları (K76–K78) ayrı yayıncı sayıldı; Sber ile bağı okunan sayfalarda yazmıyor.

K67, K71 ve K80 sayıma girdi ama tablolarda kaynak olarak ayrıca anılmadı.

Hugging Face
- [K1] HF LLM Course (ru) — Глоссарий (Оригинал / Перевод tablosu) — https://huggingface.co/learn/llm-course/ru/glossary/1 (okunma tarihi 2026-11-19)
- [K2] HF LLM Course — Rusça çeviri kuralları (`chapters/ru/TRANSLATING.txt`, İngilizce kural metni) — https://github.com/huggingface/course/blob/main/chapters/ru/TRANSLATING.txt (okunma tarihi 2026-11-19)
- [K3] HF LLM Course (ru) — Глава 1.4, Как работают трансформеры? — https://huggingface.co/learn/llm-course/ru/chapter1/4 (okunma tarihi 2026-11-19)
- [K4] HF LLM Course (ru) — Глава 2.2, За конвейером — https://huggingface.co/learn/llm-course/ru/chapter2/2 (okunma tarihi 2026-11-19)
- [K5] HF LLM Course (ru) — Глава 2.4, Токенизаторы — https://huggingface.co/learn/llm-course/ru/chapter2/4 (okunma tarihi 2026-11-19)
- [K6] HF LLM Course (ru) — Глава 2.5, Обработка нескольких последовательностей — https://huggingface.co/learn/llm-course/ru/chapter2/5 (okunma tarihi 2026-11-19)
- [K7] HF LLM Course (ru) — Глава 3.3, Fine-tuning модели с использованием Trainer API — https://huggingface.co/learn/llm-course/ru/chapter3/3 (okunma tarihi 2026-11-19)
- [K8] HF LLM Course (ru) — Глава 3.4, Полное обучение — https://huggingface.co/learn/llm-course/ru/chapter3/4 (okunma tarihi 2026-11-19)
- [K9] HF LLM Course (ru) — Глава 4.3, Публикация обученых моделей в общий доступ — https://huggingface.co/learn/llm-course/ru/chapter4/3 (okunma tarihi 2026-11-19)
- [K10] HF LLM Course (ru) — Глава 4.4, Создание карточки модели — https://huggingface.co/learn/llm-course/ru/chapter4/4 (okunma tarihi 2026-11-19)
- [K11] HF LLM Course (ru) — Глава 8.4, Отладка обучения — https://huggingface.co/learn/llm-course/ru/chapter8/4 (okunma tarihi 2026-11-19)
- [K12] HF Agents Course (ru-RU) — Unit 1, Что такое LLM? — https://huggingface.co/learn/agents-course/ru-RU/unit1/what-are-llms (okunma tarihi 2026-11-19)
- [K13] HF Agents Course (ru-RU) — Unit 1, Сообщения и Специальные Токены — https://huggingface.co/learn/agents-course/ru-RU/unit1/messages-and-special-tokens (okunma tarihi 2026-11-19)
- [K14] HF Agents Course (ru-RU) — Unit 1, Что такое Инструменты? — https://huggingface.co/learn/agents-course/ru-RU/unit1/tools (okunma tarihi 2026-11-19)
- [K15] HF Agents Course (ru-RU) — Bonus 1, Давайте дообучим вашу модель для вызова функций — https://huggingface.co/learn/agents-course/ru-RU/bonus-unit1/fine-tuning (okunma tarihi 2026-11-19)
- [K16] Transformers docs (ru) — glossary ("Глоссарий") — https://huggingface.co/docs/transformers/ru/glossary (okunma tarihi 2026-11-19)
- [K17] Transformers docs (ru) — conversations ("Основы чата") — https://huggingface.co/docs/transformers/ru/conversations (okunma tarihi 2026-11-19)
- [K18] Transformers docs (ru) — model_memory_anatomy ("Использование памяти GPU") — https://huggingface.co/docs/transformers/ru/model_memory_anatomy (okunma tarihi 2026-11-19)
- [K19] Transformers docs (ru) — chat_templating ("Шаблоны чата") — https://huggingface.co/docs/transformers/ru/chat_templating (okunma tarihi 2026-11-19)
- [K20] Transformers docs (ru) — kv_cache ("Стратегии кэширования") — https://huggingface.co/docs/transformers/ru/kv_cache (okunma tarihi 2026-11-19)
- [K21] Transformers docs (ru) — cache_explanation ("Как работает кэширование") — https://huggingface.co/docs/transformers/ru/cache_explanation (okunma tarihi 2026-11-19)
- [K22] Transformers docs (ru) — continuous_batching ("Непрерывная пакетная обработка") — https://huggingface.co/docs/transformers/ru/continuous_batching (okunma tarihi 2026-11-19)
- [K23] Transformers docs (ru) — llm_tutorial_optimization ("Оптимизация LLM по скорости и памяти") — https://huggingface.co/docs/transformers/ru/llm_tutorial_optimization (okunma tarihi 2026-11-19)
- [K24] Transformers docs (ru) — attention_interface ("Бэкенды внимания") — https://huggingface.co/docs/transformers/ru/attention_interface (okunma tarihi 2026-11-19)
- [K25] Transformers docs (ru) — expert_parallelism ("Экспертная параллельность") — https://huggingface.co/docs/transformers/ru/expert_parallelism (okunma tarihi 2026-11-19)
- [K26] Transformers docs (ru) — perf_infer_gpu_multi ("Тензорное параллелизм для инференса") — https://huggingface.co/docs/transformers/ru/perf_infer_gpu_multi (okunma tarihi 2026-11-19)
- [K27] Transformers docs (ru) — perf_train_gpu_many ("Методы параллелизма") — https://huggingface.co/docs/transformers/ru/perf_train_gpu_many (okunma tarihi 2026-11-19)
- [K28] Transformers docs (ru) — assisted_decoding — https://huggingface.co/docs/transformers/ru/assisted_decoding (okunma tarihi 2026-11-19)
- [K29] Transformers docs (ru) — generation_strategies ("Стратегии генерации") — https://huggingface.co/docs/transformers/ru/generation_strategies (okunma tarihi 2026-11-19)
- [K30] Transformers docs (ru) — training ("Доработка") — https://huggingface.co/docs/transformers/ru/training (okunma tarihi 2026-11-19)
- [K31] Transformers docs (ru) — peft ("Параметрически эффективная дообучение") — https://huggingface.co/docs/transformers/ru/peft (okunma tarihi 2026-11-19)
- [K32] Transformers docs (ru) — grad_checkpointing ("Контрольные точки градиентов") — https://huggingface.co/docs/transformers/ru/grad_checkpointing (okunma tarihi 2026-11-19)
- [K33] Transformers docs (ru) — community_integrations/vllm — https://huggingface.co/docs/transformers/ru/community_integrations/vllm (okunma tarihi 2026-11-19)
- [K34] Transformers docs (ru) — quantization/overview ("Обзор") — https://huggingface.co/docs/transformers/ru/quantization/overview (okunma tarihi 2026-11-19)
- [K35] Transformers docs (ru) — weightconverter ("Динамическая загрузка весов") — https://huggingface.co/docs/transformers/ru/weightconverter (okunma tarihi 2026-11-19)
- [K36] Transformers docs (ru) — apple_silicon — https://huggingface.co/docs/transformers/ru/apple_silicon (okunma tarihi 2026-11-19)
- [K37] Transformers docs (ru) — torch_compile — https://huggingface.co/docs/transformers/ru/torch_compile (okunma tarihi 2026-11-19)
- [K38] HF Hub docs (ru) — models-gated ("Модели с ограниченным доступом") — https://huggingface.co/docs/hub/ru/models-gated (okunma tarihi 2026-11-19)
- [K39] HF Hub docs (ru) — model-cards ("Карточки моделей") — https://huggingface.co/docs/hub/ru/model-cards (okunma tarihi 2026-11-19)
- [K40] HF Hub docs (ru) — repositories ("Репозитории") — https://huggingface.co/docs/hub/ru/repositories (okunma tarihi 2026-11-19)
- [K41] HF Hub docs (ru) — local-apps ("Использование моделей ИИ локально") — https://huggingface.co/docs/hub/ru/local-apps (okunma tarihi 2026-11-19)

Google (makine çevirisi: K42–K45 Cloud Translation API notu taşıyor)
- [K42] Google ML Glossary (ru) — Глоссарий машинного обучения — https://developers.google.com/machine-learning/glossary?hl=ru (okunma tarihi 2026-11-19)
- [K43] Google MLCC (ru) — Введение в большие языковые модели — https://developers.google.com/machine-learning/crash-course/llm?hl=ru (okunma tarihi 2026-11-19)
- [K44] Google MLCC (ru) — LLM, transformers ("Магистр права: Что такое большая языковая модель?") — https://developers.google.com/machine-learning/crash-course/llm/transformers?hl=ru (okunma tarihi 2026-11-19)
- [K45] Google MLCC (ru) — LLM: точная настройка, дистилляция и оперативное проектирование — https://developers.google.com/machine-learning/crash-course/llm/tuning?hl=ru (okunma tarihi 2026-11-19)
- [K46] Google MLCC (ru) — Встраивания — https://developers.google.com/machine-learning/crash-course/embeddings?hl=ru (okunma tarihi 2026-11-19)

Microsoft (K47–K59 makine çevirisi; K60 stil kılavuzu)
- [K47] Microsoft Learn — .NET AI, Понимание токенов — https://learn.microsoft.com/ru-ru/dotnet/ai/conceptual/understanding-tokens (okunma tarihi 2026-11-19)
- [K48] Microsoft Learn — .NET AI, Внедрение в .NET (embeddings) — https://learn.microsoft.com/ru-ru/dotnet/ai/conceptual/embeddings (okunma tarihi 2026-11-19)
- [K49] Microsoft Learn — Azure OpenAI, Производительность и задержка — https://learn.microsoft.com/ru-ru/azure/foundry/openai/how-to/latency (okunma tarihi 2026-11-19)
- [K50] Microsoft Learn — Что такое выделенная пропускная способность для моделей Foundry? — https://learn.microsoft.com/ru-ru/azure/foundry/openai/concepts/provisioned-throughput (okunma tarihi 2026-11-19)
- [K51] Microsoft Learn — Azure OpenAI, Методы разработки запросов — https://learn.microsoft.com/ru-ru/azure/foundry/openai/concepts/prompt-engineering (okunma tarihi 2026-11-19)
- [K52] Microsoft Learn — Azure OpenAI, тонкая настройка (fine-tuning) — https://learn.microsoft.com/ru-ru/azure/foundry/openai/how-to/fine-tuning (okunma tarihi 2026-11-19)
- [K53] Microsoft Learn — AKS AI toolchain operator (KAITO) — https://learn.microsoft.com/ru-ru/azure/aks/ai-toolchain-operator (okunma tarihi 2026-11-19)
- [K54] Microsoft Learn — Azure Databricks, Развертывание моделей с помощью службы моделей — https://learn.microsoft.com/ru-ru/azure/databricks/machine-learning/model-serving/ (okunma tarihi 2026-11-19)
- [K55] Microsoft Learn — Azure Machine Learning, распределенное обучение — https://learn.microsoft.com/ru-ru/azure/machine-learning/concept-distributed-training?view=azureml-api-2 (okunma tarihi 2026-11-19)
- [K56] Microsoft Learn — Well-Architected, Стратегии архитектуры для планирования емкости — https://learn.microsoft.com/ru-ru/azure/well-architected/performance-efficiency/capacity-planning (okunma tarihi 2026-11-19)
- [K57] Microsoft Learn — Visual Studio, Использование GPU — https://learn.microsoft.com/ru-ru/visualstudio/profiling/gpu-usage?view=visualstudio (okunma tarihi 2026-11-19)
- [K58] Microsoft Learn — Размеры серии ND-H100-v5 — https://learn.microsoft.com/ru-ru/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series (okunma tarihi 2026-11-19)
- [K59] Microsoft Learn — AKS, multi-instance GPU (MIG) düğüm havuzu — https://learn.microsoft.com/ru-ru/azure/aks/gpu-multi-instance (okunma tarihi 2026-11-19)
- [K60] Microsoft Russian Localization Style Guide (PDF; kural metni İngilizce, örnekler Rusça) — https://download.microsoft.com/download/c/8/a/c8ab1532-a15d-4f94-96c2-9740bc230757/rus-rus-StyleGuide.pdf (https://aka.ms/russian-styleguide üzerinden; okunma tarihi 2026-11-19)

Yandex (Yandex Cloud dokümanı GitHub kaynağından; ML el kitabı Yandex Образование)
- [K61] Yandex Cloud sözlüğü — Большая языковая модель (LLM) — https://github.com/yandex-cloud/docs/blob/master/ru/glossary/llm.md (okunma tarihi 2026-11-19)
- [K62] Yandex Cloud sözlüğü — Обзор GPU: преимущества и возможности графических процессоров — https://github.com/yandex-cloud/docs/blob/master/ru/glossary/gpu.md (okunma tarihi 2026-11-19)
- [K63] Yandex Cloud sözlüğü — Глубокое обучение (Deep Learning) — https://github.com/yandex-cloud/docs/blob/master/ru/glossary/deep-learning.md (okunma tarihi 2026-11-19)
- [K64] Yandex Compute Cloud — GPU – графические ускорители — https://github.com/yandex-cloud/docs/blob/master/ru/compute/concepts/gpus.md (okunma tarihi 2026-11-19)
- [K65] Yandex Cloud öğreticisi — Запуск библиотеки vLLM с языковой моделью Gemma 3 на виртуальной машине с GPU — https://github.com/yandex-cloud/docs/blob/master/ru/_tutorials/infrastructure/vllm-gemma-gpu.md (okunma tarihi 2026-11-19)
- [K66] Yandex ML el kitabı — 6.3. Трансформеры — https://education.yandex.ru/handbook/ml/article/transformery (https://contest.yandex.ru/tracks/ml/deep-learning-architectures/transformers adresine yönlendiriyor; okunma tarihi 2026-11-19)
- [K67] Yandex ML el kitabı — 6.2. Нейросети для работы с последовательностями — https://contest.yandex.ru/tracks/ml/deep-learning-architectures/neural-networks-for-sequences (okunma tarihi 2026-11-19)
- [K68] Yandex ML el kitabı — 8.6. Языковые модели — https://contest.yandex.ru/tracks/ml/generative-models/language-models (okunma tarihi 2026-11-19)
- [K69] Yandex ML el kitabı — 5.4. Тонкости обучения — https://contest.yandex.ru/tracks/ml/deep-learning-introduction/training-techniques (okunma tarihi 2026-11-19)

Sber (GigaChat dokümanı ve Habr şirket blogları)
- [K70] GigaChat API — Подсчет токенов — https://developers.sber.ru/docs/ru/gigachat/guides/counting-tokens (okunma tarihi 2026-11-19)
- [K71] GigaChat API — Мониторинг статистики потребления GigaChat API — https://developers.sber.ru/docs/ru/gigachat/guides/token-consumption (okunma tarihi 2026-11-19)
- [K72] SberDevices (Habr) — GigaChat 3 Ultra Preview — тяжёлый open source — https://habr.com/ru/companies/sberdevices/articles/968904/ (okunma tarihi 2026-11-19)
- [K73] Сбербанк (Habr) — GigaChat 3.5 — меньше, быстрее, сильнее — https://habr.com/ru/companies/sberbank/articles/1055826/ (okunma tarihi 2026-11-19)
- [K74] GigaChat API — Векторное представление текста — https://developers.sber.ru/docs/ru/gigachat/guides/embeddings (okunma tarihi 2026-11-19)
- [K75] GigaChat API başvurusu — Сгенерировать ответ (POST /chat/completions) — https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/post-chat (okunma tarihi 2026-11-19)

Cloud.ru (ML Inference dokümanı)
- [K76] Cloud.ru — Параметры API-запросов к AI-моделям — https://cloud.ru/docs/ml-inference/ug/topics/concepts__model-parameters (okunma tarihi 2026-11-19)
- [K77] Cloud.ru — Масштабирование инференса — https://cloud.ru/docs/ml-inference/ug/topics/concepts__scaling (okunma tarihi 2026-11-19)
- [K78] Cloud.ru — Создать инференс в Model RUN — https://cloud.ru/docs/ml-inference/ug/topics/guides__create-inference (okunma tarihi 2026-11-19)

Selectel
- [K79] Selectel — Аренда серверов с GPU — https://selectel.ru/services/gpu/ (okunma tarihi 2026-11-19)
- [K80] Selectel — Облачные серверы с GPU — https://selectel.ru/services/cloud/servers/gpu/ (okunma tarihi 2026-11-19)

Rusçası olmayan ya da açılamayan kaynaklar
- Google Cloud dokümanı: `?hl=ru` İngilizce sayfaya düşüyor (Kiril harfi 0). ai.google.dev `?hl=ru`: AI Studio ve Gemma sitelerine yönlendiriyor, Rusça sürüm yok.
- NVIDIA ru-ru: en-eu sayfasına yönlendiriyor; DGX Spark, Dynamo ve sözlük sayfaları 404.
- Apple ru: support.apple.com/ru-ru'ya yönlendiriyor; MacBook Pro teknik özellikler sayfasının (support.apple.com/ru-ru/121553) başlığı ve içeriği İngilizce. Bu yüzden unified memory için Apple kaynağı yok.
- AMD ru: 404.
- yandex.cloud dokümanı: Yandex ID girişine yönlendiriyor; aynı metin `yandex-cloud/docs` GitHub deposundan okundu (K61–K65). aistudio.yandex.ru: CAPTCHA, girilmedi. Foundation Models / AI Studio dokümanı GitHub deposunda yok.
- HF mcp-course, deep-rl-course, diffusion-course, cookbook, smol-course: Rusça sürüm 404.
- GigaChat model kartları (Hugging Face): İngilizce. Sber'in gigachat-3-ultra ve model seçimi sayfaları çok kısa; yerine aynı ekibin Habr yazıları okundu (K72, K73).

## Terimler

Sayım yöntemi (kural 5): okunan 80 sayfalık derlemde biçimi o anlamda kullanan sayfa sayısı. Fark 1 sayfa ya da daha azsa eşit sayıldı; o zaman biçimi kullanan yayıncı sayısı (Hugging Face, Google, Microsoft, Yandex, Sber, Cloud.ru, Selectel), o da eşitse geçiş sayısı belirledi. Notlardaki "X / Y sayfa" bu sayımdır. Rusça çekimli bir dil: sayım sözcüğün bütün çekim biçimlerini kökle birlikte aradı (ör. "слой", "слоя", "слоев", "слоёв"). Metin Unicode NFC'ye çevrildi, bölünmez boşluk düz boşluk sayıldı, büyük-küçük harf ayrılmadı. Ana içerik: Hugging Face'te `prose-doc` bloğu, Google'da `devsite-article-body`, Microsoft ve Selectel'de `<main>`, Sber geliştirici sayfalarında `<article>`, Habr'da `article-formatted-body`, Cloud.ru'da `article_content_spacing`, Yandex el kitabında `dc-doc-page__body`; GitHub'daki Markdown kaynaklarında kod blokları ve `{% %}` etiketleri çıkarıldı, K60 PDF'i `pdftotext` ile metne çevrildi. Aile kuralı (bn.md'deki gibi): aynı baş sözcüğü paylaşan terimler tek kökle yazılır, kök ailenin toplam sayfa sayısıyla seçilir; kaynakta görülmeyen bileşik uydurulmaz. Tablodaki biçim sözlük biçimidir (tekil yalın hâl); kaynakta yalnız çekimli biçim varsa o biçim notta alıntılandı.

| EN | ru | Kaynak | Not / alternatif |
|---|---|---|---|
| GPU memory | память GPU | K18, K16, K23, K78 | Dişil. 10 sayfa, 4 yayıncı (K11, K16, K18, K20, K23, K30, K32, K59, K66, K78) / "видеопамять" 3 sayfa. Sayfa başlığı "Использование памяти GPU" (K18). Alternatif: "видеопамять" (K62), "видеопамяти" (K23, K73), "GPU-памяти" (K73). |
| VRAM | VRAM | K23, K16, K22, K62, K64 | Kısaltma, çevrilmez; Latin harfle 5 sayfa: "350 ГБ VRAM" (K23), "в VRAM GPU" (K23). Rusça karşılık "видеопамять" 3 sayfa: "80 ГБ видеопамяти" (K23). |
| weights / model weights | веса / веса модели | K1, K3, K18, K23 | 31 sayfa; K1 sözlüğü Weights için "веса" veriyor. "веса модели" 8 sayfa (K3, K15, K18, K23, K26, K34, K36, K63). Alternatif: "весовых коэффициентах" (K42; Google). |
| KV cache | KV-кэш | K20, K21, K22, K28, K34 | Eril. 5 sayfa / 12 geçiş; "кэш KV" 5 sayfa / 8 geçiş (K20, K21, K22, K29, K33) → eşit, yayıncı 1 / 1, geçiş belirledi. Yazım: "кэш" 21 sayfa / "кеш" 4. Alternatif: "кэш KV" (K20), "кэш ключей и значений" (K21, K23), "KV-кеш" (K73), "KV-cache" (K73). |
| overhead | накладные расходы | K22, K27, K33, K37 | Yalnız çoğul. 4 sayfa, yalnız HF. Alternatif: "дополнительным затратам" (K15). |
| activations | активации | K18, K23, K32 | 18 sayfa. Dişil ("активация"). |
| parameters | параметр / параметры | K1, K18, K22 | Eril. "4 млрд параметров" (K18). |
| active parameters | активный параметр | K17 | "каждый активный параметр" (K17); Sber: "около 1,8 млрд активных" (K72). "активных параметров" 0 sayfa; çoğul düzenli. |
| unified memory | унифицированная память | K36 | "пул унифицированной памяти" (K36). Alternatif: "общую память" (K36). Apple'ın Rusça teknik özellik sayfası yok (Kaynaklar). |
| memory bandwidth | пропускная способность памяти | K17, K23, K37 | 3 sayfa. Dikkat: throughput da "пропускная способность" (aşağıda); etikette "памяти" ayırır. |
| precision | точность | K17, K23 | "полной точности float32" (K17), "точности bfloat16" (K23); "смешанная точность" 6 sayfa. Dikkat: K2 kuralı "точность" sözcüğünü accuracy için örnek veriyor ve K1 sözlüğü Accuracy'yi İngilizce bırakıyor; doğruluk metriği bağlamında karışabilir. |
| quantization | квантование | K34, K17, K23, K42 | 8 / 2 sayfa (K17, K20, K23, K31, K34, K35, K36, K42). Alternatif: "квантизация" (K23, K73). |
| quantized | квантованный | K34, K17, K23 | Sıfat-fiil ailesi 9 sayfa; fiil "квантовать" (K17, K23), emir kipi "Квантуйте" (K34). Alternatif: "заквантованными" (K36). |
| checkpoint | контрольная точка / контрольные точки | K23, K25, K52 | Dişil. Model kaydı anlamında yaklaşık 11 sayfa, 2 yayıncı (HF, Microsoft) / "чекпоинт" yaklaşık 9–10 sayfa, yalnız HF → fark 1–2; eşit sayılsa da yayıncı 2 / 1. Alternatif: "чекпоинт" (K1, K3, K28); K1 sözlüğü "чекпоинт" veriyor. Dikkat: K32 başlığı "Контрольные точки градиентов" (K32) gradient checkpointing için. |
| token | токен / токены | K1, K12, K47 | Eril. 48 sayfa. Alternatif: "маркер" (yalnız Microsoft, 5 sayfa; "в маркерах в минуту (TPM)" (K49)). |
| tokenizer | токенизатор | K1, K5, K16 | Eril. 19 sayfa; K5 başlığı "Токенизаторы" (K5). |
| vocabulary | словарь | K16, K5 | Eril. 26 sayfa (genel sözlük anlamı dahil); "не входило в словарь модели" (K16). |
| embedding | эмбеддинг / эмбеддинги | K12, K16, K23 | Eril. 18 sayfa, 6 yayıncı. Alternatif: "векторное представление" 5 sayfa (K12, K74; Sber sayfa başlığı "Векторное представление текста" (K74)), "встраивание" 4 sayfa (K44, K47, K48, K54; Google ve Microsoft, makine çevirisi), "эмбединг" (K48, K68). |
| layer | слой / слои | K1, K4, K16 | Eril. 35 sayfa. Çoğul tamlayan "слоев" / "слоёв" için Yazım kuralları (ё). |
| hidden size | скрытый размер | K4, K16 | "Скрытый размер (Hidden size)" (K4). 2 / 2 sayfa → eşit; yayıncı 1 / 1; geçiş 3 / 2. Alternatif: "размера скрытого слоя" (K18), "размерность скрытого слоя" (K26). |
| attention | внимание | K23, K24, K66 | Nötr. 41 sayfa. |
| attention head | голова внимания / головы внимания | K23, K24, K44, K66 | Dişil. "голова" ailesi yaklaşık 6 sayfa, 4 yayıncı: "каждой головы внимания" (K23), "голов самовнимания" (K44), "MTP-головы" (K73). "головка" ailesi 2 sayfa: "40 головок внимания" (K23). "заголовков внимания" (K21, K25) başlık anlamında, makine çevirisi hatası; kullanılmadı. |
| head dimension | размерность головы внимания (BİRLEŞTİRME) | K23 | Kaynakta tek sayfada "головки" biçimiyle geçiyor: "размерности головки внимания" (K23). Alternatif: "размерности на каждый заголовок внимания" (K21). Head satırıyla aynı kök olsun diye "размерности" (K23) ile "голова внимания" birleştirildi; kaynaktaki biçim istenirse K23'teki kullanılır. |
| MHA / GQA / MQA / MLA | GQA / MQA / MLA | K23, K26, K72 | Kısaltma, çevrilmez. GQA ve MQA yalnız K23'te, açılımlarıyla İngilizce: "Multi-Query Attention (MQA) и Grouped-Query-Attention (GQA)" (K23). MLA K26, K72 ve K73'te: "MLA (Multi-head Latent Attention)" (K72). MHA derlemde 0 sayfa; o da aynen yazılır. |
| query / key / value | запрос / ключ / значение | K21, K23 | "Матрицы запроса (Q), ключа (K) и значения (V)" (K21); "ключей и значений" 6 sayfa. Dikkat: "запрос" request anlamında da kullanılıyor (одновременные запросы). |
| feed-forward (layer) | полносвязный слой | K16, K23, K63, K66, K69 | 5 sayfa, 2 yayıncı (HF, Yandex); Yandex başlığı "Полносвязный слой и нормализация" (K66). Alternatif: "слоями прямого распространения" (K16), "слой прямой передачи" (K25), FFN 4 sayfa, MLP 4 sayfa. |
| MoE (mixture of experts) | MoE | K17, K25, K72 | 9 sayfa. Açılım İngilizce: "Mixture-of-Expert (MoE)" (K17); İngilizce açılım 5 sayfa / "смесь экспертов" 1 sayfa (K42; Google). Birleşik ad: "MoE-модель" (K72). |
| expert | эксперт / эксперты | K25, K26, K72 | Eril. 11 sayfa. |
| dense (model) | плотная модель / плотные модели | K35 | "Плотные модели (например, Llama)" (K35). Alternatif: "плотные MLP" (K25); K72 tablosunda İngilizce "Dense". |
| sliding window attention | скользящее окно внимания | K20, K22, K24 | 3 sayfa. Alternatif: "внимание со скользящим окном" (K22), "внимания со скользящим окном" (K24). |
| RoPE | RoPE | K23 | Kısaltma, çevrilmez. "Позиционное кодирование RoPE (Rotary Position Embedding)" (K23). |
| logits | логиты | K4, K7, K29 | Eril çoğul. 12 sayfa. |
| inference | инференс | K1, K33, K77 | Eril. 25 sayfa; K1 sözlüğü. Cloud.ru başlığı "Масштабирование инференса" (K77). Alternatif: "вывод" (K42, K23). |
| serving / serve | обслуживание / обслуживать | K54, K33, K45 | Model sunma anlamında yaklaşık 6 sayfa (K22, K33, K41, K45, K54, K79): "Что такое обслуживание моделей?" (K54), "для обслуживания LLM" (K33). Alternatif: "развертывание" (deployment anlamı; K1 sözlüğü Deployment için, 13 sayfa), "сервинг" (K54, K79). |
| inference engine | движок инференса | K33, K41 | Eril. |
| context | контекст | K12, K23 | Eril. 29 sayfa. |
| context window | контекстное окно | K17, K42 | Alternatif: "окно контекста" (K47). |
| context length | длина контекста | K12, K20, K68, K73 | 4 / 4 sayfa, yayıncı 3 / 3, geçiş 6 / 5. "длина контекста (context length)" (K12). Alternatif: "размер контекста" (K20, K68, K72), "размером контекста" (K74). |
| concurrent users | одновременные пользователи | K56 | Tek sayfa, Microsoft makine çevirisi; rakip biçim bulunmadı. |
| concurrent requests | одновременные запросы | K49, K78 | Alternatif: "параллельные запросы" (K78). |
| prompt | промпт / промпты | K17, K20, K22 | Eril. 15 / 9 sayfa. Birleşik: "чат-промпт" (K17). Alternatif: "подсказка" (9 sayfa; HF Agents Course, Google, Microsoft); K1 sözlüğü Prompt için "начальный текст" veriyor. |
| prefill | префилл | K22, K19 | Eril. "Размер батча префилла" (K22). Yalnız HF. Alternatif: "prefill" (K22). K20'deki "Предзаполнение кэша" (K20) başka anlam (önbelleği önceden doldurma). |
| decode | декодирование | K12, K23, K28 | Nötr. 12 sayfa. |
| batch | батч / батчи | K1, K4, K22 | Eril. 25 sayfa. K2 kuralı 12: batch için "батч", package için "пакет". Alternatif: "пакет" (K42, K52); K22 başlığı "Непрерывная пакетная обработка" (K22). |
| batch size | размер батча | K4, K22, K18 | 11 / 2 sayfa. "Размер батча (Batch size)" (K4). Alternatif: "размер пакета" (K42, K52). |
| throughput | пропускная способность | K22, K49, K50 | Dişil. "Пропускная способность уровня системы, измеряемая в маркерах в минуту (TPM)" (K49). Provisioned throughput: "выделенная пропускная способность" (K50; başlık). Dikkat: memory bandwidth ile aynı ad. |
| latency | задержка | K49, K22, K23 | Dişil. 9 sayfa; Microsoft başlığı "Производительность и задержка" (K49). Alternatif: "латентности" (K49, 1 geçiş). |
| TTFT | время до первого токена | K22 | Kısaltma çevrilmez; TTFT K22 ve K49'da geçiyor. |
| tokens per second | токены/с | K25 | "токены/с немного падают" (K25); tablo başlığında "токенов/с/ГП" (K25). "токенов в секунду" 0 sayfa. |
| requests per second | запросов в секунду | K54, K56, K77, K78, K79 | 5 sayfa; kısaltma RPS (K77, K78). |
| sampling | сэмплирование | K28, K29, K68, K72 | Nötr. 4 sayfa, 3 yayıncı / örnekleme anlamında "выборка" yaklaşık 3–5 sayfa, 2 yayıncı → eşit; yayıncı 3 / 2. Alternatif: "выборка" ("Параметры выборки" (K22)), "сэмплинг" (K29, K76). |
| temperature | температура | K42, K22, K51 | 7 sayfa, 5 yayıncı. |
| chat template | шаблон чата | K19, K13, K20, K41 | Eril. 4 sayfa; Transformers başlığı "Шаблоны чата" (K19). Alternatif: "шаблон диалога" (K72), "chat-template" (K72). |
| speculative decoding | спекулятивное декодирование | K17, K28 | Alternatif: "speculative decoding" (K17), "Ассистированное декодирование" (K28). |
| MTP | MTP | K28, K72 | Kısaltma çevrilmez. "Слой много-токенового предсказания (MTP)" (K28); "MTP (Multi-Token Prediction)" (K72); "MTP-головы" (K73); "слоёв MTP" (K28). |
| CUDA graphs | CUDA-графы | K22, K37 | Eril çoğul. Alternatif: "граф CUDA" (K25), "CUDA graphs" (K37). |
| profiling | профилирование | K57 | Nötr. Microsoft makine çevirisi; araç adı "профилировщик" (K57). |
| tensor parallelism | тензорный параллелизм | K26, K27, K23 | 7 sayfa / 34 geçiş; "параллелизм тензоров" 6 sayfa / 10 geçiş → eşit, yayıncı 1 / 1 (yalnız HF), geçiş belirledi. Alternatif: "Параллелизм тензоров (TP)" (K16). |
| pipeline parallelism | конвейерный параллелизм | K23, K25, K27, K79 | 4 / 1 sayfa. Alternatif: "параллелизм конвейера" (K23). K27'de cinsiyet uyumu bozuk "конвейерное параллелизм" (K27) de var. |
| data parallelism | параллелизм данных | K25, K27, K55 | 3 sayfa. |
| expert parallelism | экспертный параллелизм | K25, K26 | Aile kuralı: "параллелизм" 13 sayfa / "параллельность" 5 → kök "параллелизм"; "план экспертного параллелизма" (K25). Yalnız bu satır sayılsaydı 2 / 2 sayfa, geçiş 3 / 4 olurdu ve K25 başlığı "Экспертная параллельность" (K25) kazanırdı. |
| replica | реплика / реплики | K25, K42 | Dişil. "Количество реплик FSDP" (K25). Alternatif: "экземпляр" ("Масштабирование по экземплярам и RPS" (K77)). |
| capacity planning | планирование емкости | K56 | Nötr. Tek sayfa, 23 geçiş, Microsoft makine çevirisi; başlık "Стратегии архитектуры для планирования емкости" (K56). Yazım: K56 е ile yazıyor; ё ile "ёмкость" K22, K23 ve K50'de. Araç için alternatif: "калькулятором емкости" (K50). |
| SLO | SLO | — | Derlemde 0 sayfa; İngilizce kalanlar. Kaynaklı parça: "уровне обслуживания" ("Соглашение об уровне обслуживания по задержке (SLA)" (K50)). |
| fine-tuning | дообучение / дообучать | K1, K15, K31 | Nötr. 18 / 5 sayfa; K1 sözlüğü Fine-tuning için "дообучение", Fine-tune için "дообучать" veriyor. Alternatif: "тонкая настройка" (K42, K43, K45, K52; 5 sayfa, K3'te "тонкой настройки"), "файн-тюнинг" (K63, K79), "точная настройка" (K45), "точной настройки" (K53). |
| instruction tuning / instruction-tuned (instruct) model | инструктивная модель | K13 | Dişil. "Инструктивные модели" (K13), 5 geçiş. Taban model: "базовая модель" (K13), "базовые модели" (K19). Alternatif: "Инструкционная модель" (K68), "instruct-версию" (K73), K17'de İngilizce «instruct». Instruction tuning adı için Rusça kaynak yok; İngilizce kalanlar. |
| full fine-tuning | полное дообучение | K25, K30, K31 | 3 sayfa; "дообучение" ile aynı kök. |
| LoRA | LoRA | K15, K31 | Kısaltma çevrilmez. Açılım: "Low-Rank Adaptation of Large Language Models, Низкоранговая Адаптация" (K15). |
| QLoRA | QLoRA | K31, K79 | "QLoRA (квантованная базовая модель + LoRA)" (K31). |
| rank | ранг | K31 | Eril. "адаптеры с рангом 8 и рангом 16" (K31). |
| adapter | адаптер / адаптеры | K31, K15 | Eril. 7 sayfa. |
| gradient checkpointing | gradient checkpointing | K18, K32 | İngilizce bırakıldı: 2 sayfa / 3 geçiş; "градиентный чекпоинтинг" (K32) ve başlık "Контрольные точки градиентов" (K32) birer sayfa, ikişer geçiş → eşit, yayıncı 1 / 1 / 1, geçiş belirledi. |
| optimizer | оптимизатор | K18, K30 | Eril. 11 sayfa. Adam adı değişmez. |
| sequence length | длина последовательности | K4, K23 | 11 sayfa. "Длина последовательности (Sequence length)" (K4). |
| GPU | GPU | K8, K27, K58 | Kısaltma, çevrilmez, çekimde değişmez; eril. 36 sayfa / "графический процессор" 9 / "ГП" 2 (K25, K36). Eril uyum 8 sayfa: "на одном GPU" (K8), "на каждый GPU" (K27); dişil 3 sayfa: "Каждая GPU" (K27). Yandex başlığı "GPU – графические ускорители" (K64). |
| graphics card | видеокарта | K7, K8, K62, K79 | Dişil. 6 sayfa. |
| card | видеокарта | K79 | "карта" kısaltması bu anlamda görülmedi. Dikkat: "карточка модели" (model card) ayrı sözcük. |
| tensor throughput (TFLOPS) | TFLOPS | — | TFLOPS derlemde 0 sayfa; İngilizce kalanlar. Parçalar: "тензорные ядра" (K64), "NVIDIA H100 Tensor Core" (K58). |
| sparsity | sparsity | — | Ad derlemde yok; yalnız sıfat "разреженный", çekimli: "разреженном" (K42), "разреженными" (K46), "разреженные" (K69). İngilizce kalanlar. |
| 2:4 structured sparsity | 2:4 structured sparsity | — | Kaynak yok; İngilizce kalanlar. |
| datasheet | datasheet | — | Kaynak yok (K64'te yalnız URL içinde); İngilizce kalanlar. |
| form factor | form factor | — | Kaynak yok; SXM ve PCIe yalnız değer olarak geçiyor (K78, K79). İngilizce kalanlar. |
| MIG | MIG | K59, K64 | Kısaltma çevrilmez. "multi-instance GPU (MIG)" (K59); bölüm anlamında "разделах GPU" (K59). |
| repository | репозиторий / репозитории | K9, K40 | Eril. 12 sayfa; Hub başlığı "Репозитории" (K40). |
| model card | карточка модели | K10, K39 | Dişil. 6 sayfa; başlıklar "Создание карточки модели" (K10), "Карточки моделей" (K39). Alternatif: "карты модели" (K10). |
| config / config.json | конфигурация / файл конфигурации | K9, K16 | Dişil. 31 sayfa; config.json dosya adı değişmez (7 sayfa). |
| open weights | с открытыми весами | K72 | Alternatif: "открытая модель" (K72), "открытые модели" (K79). |
| LLM | LLM / большая языковая модель | K12, K61, K23 | Dişil (модель'e uyar): "Каждая LLM" (K12), "ваша LLM" (K13), "вашей LLM" (K23); eril tek örnek "вашему LLM" (K14). 25 sayfa; açılım 20 sayfa. Çoğulda değişmez; "LLMs" 6 sayfa. Alternatif: "БЛМ" (K44), "LLM-модели" (K44). |
| calculator | калькулятор | K14, K58, K79 | Eril. 5 sayfa; "Калькулятор цен" (K58), "калькулятором емкости" (K50). |
| gated model | модель с ограниченным доступом | K38 | Hub başlığı "Модели с ограниченным доступом" (K38). |
| headroom | запас | K32, K22 | Eril. "запас по памяти" (K32). |

### Site sayfa ve araç adları

Ad kaynakta bütün hâlinde geçmiyorsa satır BİRLEŞTİRME diye işaretli: öneri, kaynaklı parçalardan kuruldu; parçaların alıntıları denetlendi, bütün biçim denetlenmedi. Karar dil sahibinindir.

| EN | ru | Kaynak | Not / alternatif |
|---|---|---|---|
| VRAM calculator (nav "VRAM Sizing") | Калькулятор VRAM (BİRLEŞTİRME) | K58, K23 | "Калькулятор цен" (K58) kalıbı + VRAM (K23). Alternatif: "Расчет VRAM" (kaynaksız). |
| Fine-tuning VRAM (nav "Fine-tune") | Дообучение / VRAM для дообучения (BİRLEŞTİRME) | K1 | Menü adı "Дообучение" K1 sözlüğünde bütün hâlinde var; sayfa başlığı "VRAM для дообучения" birleştirme. |
| Task fit | Подбор под задачу (BİRLEŞTİRME) | K63, K79, K27 | Parçalar: "под задачу" (K63), "под свою задачу" (K63, K79); sığma fiili "помещается на одном GPU" (K27). "подбор" 5 sayfa, seçki anlamında ("подборка" (K29)). |
| Model anatomy | Анатомия модели (BİRLEŞTİRME) | K49 | "анатомия вызова" (K49) kalıbı; Microsoft makine çevirisi, tek sayfa. |
| Compare models | Сравнение моделей (BİRLEŞTİRME) | K20, K23 | "сравнение" ailesi 17 sayfa, 5 yayıncı; "для сравнения типов кэша" (K20). |
| Model name decoder | Разбор названия модели (BİRLEŞTİRME) | K39, K70 | "под названием модели" (K39), "названием модели" (K70); "перед разбором Markdown" (K39). "расшифровка" 0 sayfa; "декодер" mimarideki decoder anlamında, kullanılmadı. |
| vLLM settings (nav "vLLM Params") | Параметры vLLM (BİRLEŞTİRME) | K76, K22 | "Параметры API-запросов к AI-моделям" (K76; başlık), "Параметры выборки" (K22) kalıbı. |
| Config Decoder (config.json explained) | Разбор config.json (BİRLEŞTİRME) | K39 | Model name decoder ile aynı "разбор" kalıbı. |
| Serving Brief | Сводка по обслуживанию (BİRLEŞTİRME) | K49, K54 | Başlık "Сводка" (K49) + "обслуживание моделей" (K54). |
| Capacity plan / capacity planner | Планирование емкости | K56 | Bütün hâlinde kaynaklı (K56 başlığındaki "планирования емкости"). Araç adı için alternatif: "калькулятором емкости" (K50). "планировщик" zamanlayıcı (scheduler) anlamında kullanılıyor, seçilmedi. |
| GPU compare | Сравнение GPU (BİRLEŞTİRME) | K20 | Compare models ile aynı kalıp. |
| LLM 101 | LLM 101 | — | Değişmez (öteki dillerde de öyle). |
| Feed | Новости (BİRLEŞTİRME) | K11 | "лента" 0 sayfa; "новости" yalnız deyim içinde: "Хорошие новости" (K11). fr "Actualités", es "Novedades" ile aynı yaklaşım. |
| Footer "AI ile çevrildi" | Эта страница переведена с помощью ИИ (BİRLEŞTİRME) | K42 | Google notu "Эта страница переведена с помощью Cloud Translation API" (K42) + "с помощью ИИ" (K42). "ИИ" 12 sayfa, 5 yayıncı; Latin "AI" 19 sayfa ama çoğu ürün adı içinde (Azure AI, AI Studio), ayrılmadı. |
| Footer "Düzeltme öner" | Предложить исправление | K47, K53 | Microsoft Learn arayüzündeki geri bildirim düğmesi "Предложить исправление?" (K47, K53); K47–K59'un hepsinde ham HTML'de. |

## İngilizce kalanlar

| EN | Neden |
|---|---|
| SLO | Derlemde 0 sayfa. Kaynaklı yakın biçim SLA: "Соглашение об уровне обслуживания по задержке (SLA)" (K50). Açılım gerekirse "уровень обслуживания" parçası kaynaklı, "целевой уровень обслуживания" kaynaksız. |
| TFLOPS (tensor throughput) | Kısaltma, kaynakta 0 sayfa. Microsoft ürün adını İngilizce bırakıyor: "NVIDIA H100 Tensor Core" (K58); Yandex "тензорные ядра" (K64) diyor. Etiket için "TFLOPS (тензорные ядра)" önerilebilir; kaynaksız birleşim. |
| sparsity, 2:4 structured sparsity | Ad kaynakta yok; yalnız sıfat "разреженный", çekimli biçimlerle (K42, K46, K69; seyrek temsil anlamında). |
| datasheet | Kaynak yok. En yakın başlıklar "Спецификации хоста" (K58) ve "Характеристики" (K79) sayfa bölümü; belge adı değil. |
| form factor | Kaynak yok; SXM ve PCIe değerleri değişmez. |
| instruction tuning | Ad kaynakta yok; model adı "инструктивная модель" (K13) kaynaklı (Terimler). |
| gradient checkpointing | Sayım İngilizce biçimde (Terimler). |
| Grouped-Query Attention, Multi-Query Attention (GQA, MQA açılımları) | K23 açılımları Rusça metinde İngilizce yazıyor: "Multi-Query Attention (MQA) и Grouped-Query-Attention (GQA)" (K23). Rusça biçim derlemde yok. |
| Multi-head Latent Attention (MLA açılımı) | K72 İngilizce yazıyor: "MLA (Multi-head Latent Attention)" (K72). |
| multi-head attention (MHA açılımı) | Kaynak yok; metinde kısaltma yeter. |
| mixture of experts (MoE açılımı) | İngilizce açılım 5 sayfa / "смесь экспертов" 1 sayfa (K42; Google makine çevirisi). |
| Kısaltmalar: VRAM, GPU, KV, MoE, MHA, GQA, MQA, MLA, LoRA, QLoRA, BF16, FP8, INT4, TTFT, RPS, SLO, MIG, RoPE, MTP, CUDA, TFLOPS, LLM | Kural 4: kısaltma çevrilmez. Kaynaklar da Latin harfle yazıyor ve çekmiyor (Yazım kuralları, kısaltma çekimi). Rusça kısaltmalar ("ГП", "БЛМ") azınlıkta, kullanılmadı. |
| Adlar: vLLM, SGLang, LLMScale, Hugging Face, NVLink, Adam, config.json, generation_config.json | Ürün, kütüphane ve dosya adları değişmez. |

## Yazım kuralları

Yalnız kaynaklarda gözlenen kullanım. Karar dil sahibinindir. Sayımlar kod blokları dışındaki düzyazıda, yalnız Kiril harfi içeren satırlarda yapıldı; "NBSP" bölünmez boşluk (U+00A0), "düz" normal boşluk. Biçim: geçiş / sayfa.

- **Hitap.** вы, küçük harfle; talimatta emir kipi -йте / -ите. Cümle içinde küçük "вы": HF 533 / 37, Google 29 / 5, Microsoft 224 / 12, Yandex 24 / 7, Sber 12 / 5, Cloud.ru 5 / 1, Selectel 29 / 2. Cümle içinde büyük "Вы": HF 3 / 2, Microsoft 1 / 1, ötekilerde 0. ты / твой: HF, Google, Microsoft ve Sber'de 1–2 geçiş, örnek içinde. Emir kipi -йте / -ите: HF 110 / 29, Google 22 / 1, Microsoft 123 / 13, Yandex 14 / 2, Sber 22 / 5, Cloud.ru 10 / 1, Selectel 1 / 1; senli emir kipi 0. K2 kuralı 1 resmî "вы" istiyor, "to keep the neutral tone" (K2); K60: "Address the user directly, using the second-person pronoun" (K60). K60 ayrıca "вы можете" yapısını emir kipine çevirmemeyi söylüyor; emir kipi "вы должны" yapısından iyi.
- **Ondalık ve binlik ayırıcı.** Ondalıkta virgül: "Всего 9,5 ГБ" (K23), "38,6 ГБ" (K25), "около 1,8 млрд активных" (K72). Sayı + birimde virgül / nokta: HF 4 / 2, Google 2 / 0, Microsoft 3 / 0, Yandex 2 / 0, Sber 4 / 3 (geçiş). Binlikte boşluk: düz boşluk 23 / 7 sayfa ("около 600 000 слов" (K12)), NBSP yalnız Selectel'de 14 / 2, virgül 2 (HF 1, Microsoft 1), U+202F 0. K60 binlikte, yüzde öncesinde ve sayı ile birim arasında bölünmez boşluk istiyor, ama "Nonbreaking spaces should not be in online help and documentation live content" (K60).
- **Sitenin çıktısı.** Site sayıları `Intl` "ru-RU-u-nu-latn" ile biçimliyor. Node v22.23.4 (ICU 78.3) ile ölçüldü, tarayıcıda ölçülmedi: 1234.5 → "1 234,5"; 12345.67 → "12 345,67"; 131072 → "131 072"; 27000000000 → "27 000 000 000"; 0.31 → "0,31"; yüzde 0.05 → "5 %", 0.855 → "85,5 %". Gruplama ve yüzde öncesi boşluk U+00A0; 4 basamakta da gruplama var ("1 500"). Kısa sayı (compact) 70e9 → "70 млрд", 131072 → "131 тыс."; tarih "19 ноября 2026 г.". Çıktı ondalık virgül ve boşlukla gruplamada çoğunlukla uyumlu; yüzde öncesi boşlukta derlemle değil K60 ile uyumlu (aşağıda).
- **Yüzde.** Derlemde çoğunluk bitişik: HF 12 / 5, Google 6 / 1, Microsoft 6 / 2, Yandex 4 / 3, Sber 11 / 1, Selectel 3 / 2 (42 geçiş / 14 sayfa) / düz boşluk 8 / 3 sayfa (HF 1, Yandex 1, Sber 6), NBSP 0. K60 belgelerde boşluk istiyor ("10 %"). `Intl` çıktısı "5 %"; aynı sayfada hesaplanan ve sabit yüzdeler aynı görünsün diye sabit metinde de "{n} %" (U+00A0) önerilir; karar dil sahibinin.
- **Tırnak.** Köşeli tırnak « »: HF 78 / 17, Google 106 / 4, Microsoft 26 / 5, Yandex 98 / 6, Sber 24 / 2, Cloud.ru 2 / 1, Selectel 2 / 1 (36 sayfa). Düz çift tırnak çifti: HF 126 / 18, Google 29 / 2, Microsoft 106 / 10, Sber 3 / 1 (31 sayfa; bir kısmı kod adı). İngilizce “ ”: HF 63 / 14, Microsoft 11 / 2, Yandex 1 / 1. İç tırnak „ “ yalnız K51'de 1 kez, « » içinde. K60 web sayfası ve yardım metni için düz tırnak, basılı belge için « » ve içinde düz tırnak öneriyor. Öneri: « », iç tırnak „ “ (derlem çoğunluğu ve Rus tipografisi; K60'ın web kuralı alternatif).
- **Tire.** Boşluklu uzun tire —: HF 149 / 26, Google 76 / 3, Microsoft 66 / 13, Yandex 236 / 9, Sber 102 / 4, Cloud.ru 30 / 3, Selectel 20 / 2. Bitişik —: Microsoft 2 / 1, Sber 1 / 1. Tire yerine boşluklu – : 24 geçiş, tire yerine kısa çizgi -: HF 36 / 11 (çoğu LLM Course; ör. "Чекпоинт - веса модели" (K3)), Yandex 2 / 1. Selectel — öncesinde NBSP kullanıyor (21 / 2). K60: tire boşluklu ("Файл — это" (K60)), aralıkta boşluksuz en dash ("См. стр. 10–20." (K60)), eksi işareti en dash. Öneri: " — " (boşluklu em dash), aralık "10–20".
- **İki nokta ve noktalı virgül.** Önünde boşluk yok: ":" öncesi boşluk yalnız Microsoft 6 / 5 ve Yandex 5 / 2 (arayüz kalıntısı), ötekilerde 0; ";" öncesi boşluk yalnız Yandex 1. K60: "regular text may not be capitalized after a colon in Russian" (K60); iki noktadan sonra küçük harf.
- **ё.** Öneri: ё yazılmaz, her yerde е. Yayıncı bazında ё / е geçişi (sabit kök listesiyle, ё'nün zorunlu olduğu sözcükler): HF 167 / 92, Google 3 / 24, Microsoft 15 / 318, Yandex 59 / 66, Sber 57 / 7, Cloud.ru 0 / 8, Selectel 0 / 23. Aynı yayıncının içinde de bölünüyor: HF LLM Course (K1–K11) 0 / 58, Agents Course 0 / 17, Transformers (K16–K37) 152 / 15, Hub 15 / 2; Yandex Cloud (K61–K65) 1 / 48, Yandex el kitabı (K66–K69) 58 / 18; GigaChat dokümanı 0 / 7, Sber Habr yazıları 57 / 0; Cloud.ru 0 / 8. ё yazan grupların toplamı 32 sayfa, е yazanlarınki 48 sayfa; K60'ın Rusça örneklerinde ё hiç yok. Sözcük düzeyinde "слоёв" 15 sayfa / "слоев" 10 sayfa (ё lehine). Tek, sınanabilir kural olduğu için е önerildi; alternatif tam ё. Seçilen kural sözlükte değişmeden uygulanmalı: yarım ё en kötü seçenek. Belirsiz çiftlerde (все / всё) ё kullanımı derlemde ölçülmedi. Sayı ile ad uyumu tablosunda ё biçimi parantezde verildi.
- **Başlıklarda büyük harf.** Cümle düzeni: yalnız ilk sözcük ve özel adlar büyük ("Использование памяти GPU" (K18), "Модели с ограниченным доступом" (K38)). K60: "use sentence casing for titles and headings" (K60). Kaba sayım (cümle düzeni / sonraki sözcük de büyük): HF 260 / 13, Google 31 / 11, Microsoft 182 / 2, Yandex 73 / 0, Sber 34 / 7, Cloud.ru 14 / 0, Selectel 45 / 0. HF istisnalarının çoğu Agents Course ("Сообщения и Специальные Токены" (K13)); Google'dakiler sözlük maddesi ve özel ad, Sber'dekiler başlık içinde ikinci cümle.
- **Büyük sayılar.** billion → "млрд" sayıyla, "миллиард" düzyazıda. "млрд": HF 2 / 2, Yandex 5 / 1, Sber 17 / 2; "миллиард*": HF 10 / 4, Google 4 / 2, Sber 13 / 2. Örnek: "4 млрд параметров" (K18). trillion: "трлн" 1 (Sber), "триллион*" 7 / 4 sayfa. `Intl` kısa biçimi "70 млрд". Model adındaki "70B", "702B-A36B" gibi etiketler değişmez ("702B-A36B" (K72)).
- **Birim.** Kaynaklar bayt birimlerini Kiril yazıyor: "N ГБ" HF 35 / 6, Microsoft 6 / 2, Yandex 14 / 2, Sber 4 / 1, Selectel 35 / 1; Latin "N GB" yalnız HF 1 / 1. "ГиБ" yalnız Microsoft 6 / 1; "GiB" 0. Sayı ile birim arasında boşluk (1 bitişik örnek dışında); K60 örneği "100 МБ свободного места" (K60); `Intl` birim çıktısı "80 ГБ". fr.md'deki karar gibi site GB, GiB ve TB/s etiketlerini korur (etiketler koddan, GPU adlarından ve hesaplanan değerlerden de geliyor); "ГБ"ye geçiş dil sahibinin kararı. Düzyazıda bayt "байт": "4 байта на параметр" (K18), "8 байт на параметр" (K18).
- **Kısaltma çekimi.** Latin kısaltmalar çekilmez, edat ve sıfatla kullanılır: "на одном GPU" (K8), "совместимые с vLLM" (K41), "для обслуживания LLM" (K33). "LLM-ов", "GPU-ов" gibi ekli biçimler 0 sayfa. Tanımlayıcı olarak kısa çizgiyle bileşik: "API-интерфейсы" (K9), "LLM-модели" (K44), "LLM-сервер" (K41), "GPU-чип" (K23). Kısaltmanın cinsi, sözcüğün baş adıyla uyuyor: LLM dişil (модель), GPU eril (процессор) (Terimler).

## Ayırıcılar

Kodda kullanılan ayırıcılar (`src/locales/<dil>.ts` ve `scripts/locales/<dil>.ts`). Rusça değerler İngilizceyle aynı; fr'deki gibi bölünmez boşluk gerekmiyor, çünkü Rusçada iki nokta ve noktalı virgülün önünde boşluk yok (Yazım kuralları).

| Anahtar | ru değeri | Gerekçe |
|---|---|---|
| `list.sep` | `", "` | Sıralamada virgül ve boşluk: "Alibi, Rotary embeddings, Multi-Query Attention (MQA)" (K23). `Intl.ListFormat` ru çıktısı "a, b и c"; site son öğeden önce "и" eklemiyor (dict.ts `joinList`), virgüllü liste Rusçada da doğru. |
| `colon.sep` | `": "` | İki nokta önünde boşluk yok: HF, Google, Sber, Cloud.ru ve Selectel'de 0; ör. "Для выбора доступны:" (K78). Sonrası küçük harf (K60). Config açıklamasındaki katman sayımı "24 слоя: 12 sliding_attention, 12 full_attention" biçiminde çıkar. |
| `semicolon.sep` | `"; "` | Noktalı virgül önünde boşluk yalnız Yandex'te 1 kez. Plan sayfasındaki engel listesi bu ayırıcıyla birleşiyor. |
| `join.sentence` (scripts) | `" "` | Cümleler arasında tek boşluk. |
| `join.list` (scripts) | `", "` | `list.sep` ile aynı. |
| `join.colon` (scripts) | `": "` | `colon.sep` ile aynı. |

## Sayı ile ad uyumu

Rusçada `Intl.PluralRules("ru-RU-u-nu-latn")` dört kategori veriyor (Node v22.23.4'te ölçüldü): one (1, 21, 101), few (2–4, 22), many (0, 5, 11–14, 25, 111), other (kesirli sayılar: 0.5, 1.5, 2.5). Kod `countKey` ile `<anahtar>.<kategori>` girdisini seçiyor (src/lib/dict.ts); Rusça sözlükte sayıyla değişen her anahtarın dört biçimi olmalı (ör. `config.w.layers.one`, `.few`, `.many`, `.other`; tensör için anahtar `serve.tensor.other` olduğundan `serve.tensor.other.few` vb.). Kural: biçimler dilbilgisine göre kurulur, terimin kendisi kaynaklı olmalı (Terimler). Kesirli sayıda ad tekil tamlayan hâlinde: "около 1,8 токена за шаг" (K73). K60 da sayı yer tutuculu dizgilerde her sayı için doğru biçim istiyor ve «Найдено %1 файл(-a, -ов)» türünü yasaklıyor (K60).

| EN (anahtar) | one (1, 21) | few (2–4) | many (0, 5–20) | other (1,5) | Terim kaynağı |
|---|---|---|---|---|---|
| layer (`config.w.layers`, `gloss.unit.layers`) | слой | слоя | слоев (слоёв) | слоя | K1, K16; "Слои MTP" (K28) |
| attention head (`gloss.unit.heads`) | голова внимания | головы внимания | голов внимания | головы внимания | K23, K44; "голов самовнимания" (K44) |
| expert (`gloss.unit.experts`) | эксперт | эксперта | экспертов | эксперта | K25, K26 |
| token (`config.w.tokens`, `gloss.unit.tokens`) | токен | токена | токенов | токена | K1, K12; "32 000 токенов" (K12), "1,8 токена" (K73) |
| id (eos / stop token id, `config.w.id(s)`) | идентификатор | идентификатора | идентификаторов | идентификатора | 17 sayfa / "ID" 7 sayfa; "Идентификатор токена" (K6), "идентификаторов токенов" (K47) |
| item (`config.w.items`) | элемент | элемента | элементов | элемента | 16 sayfa; "4995 элементов" (K46) |
| field (`config.w.fields`) | поле | поля | полей | поля | Nötr. 16 sayfa; "(поле content)" (K75) |
| byte(s) per parameter (`config.w.bytesPerParam`) | байт на параметр | байта на параметр | байт на параметр | байта на параметр | "4 байта на параметр" (K18), "8 байт на параметр" (K18); many biçimi "байт" (sayılı tamlayan), "байтов" değil. 4 bit için değer 0.5 → other: "0,5 байта на параметр" |
| tensor (`serve.tensor.other`) | тензор | тензора | тензоров | тензора | 20 sayfa; "в тензоры" (K4) |
| file (`serve.files.count`, `{n} file{s}`) | файл | файла | файлов | файла | 21 sayfa; "загрузку файлов" (K9) |
| module pattern (`serve.a.weights.kept`) | паттерн модулей | паттерна модулей | паттернов модулей | паттерна модулей | BİRLEŞTİRME: "паттерн" (K24, K35) + "имён модулей" (K31); "шаблон" chat template ile çakışacağı için seçilmedi (K35 ikisini de kullanıyor: "Исходные шаблоны", "Целевые паттерны") |
| stop token (`serve.a.g.eosExtra`) | токен EOS | токена EOS | токенов EOS | токена EOS | "токен EOS" (K12, K13) 2 sayfa / "токены конца последовательности" (K19) 1 sayfa → eşit, yayıncı 1 / 1, geçiş 3 / 2. "стоп-токен" 0 sayfa. |
| MTP layer (`serve.a.mtp.*`) | слой MTP | слоя MTP | слоев MTP (слоёв MTP) | слоя MTP | "Каждый слой MTP" (K28), "числу слоёв MTP" (K28) |

Not: "{n} file{s}" gibi İngilizce `{s}` kalıbı Rusçada işe yaramaz; bu anahtarlar dört kategoriyle (`.one`, `.few`, `.many`, `.other`) yazılmalı ya da K60'ın önerdiği gibi cümle sayı sona gelecek biçimde kurulmalı ("Файлов: 3"). Hangi yolun seçileceği uygulama kararı.

## Uygulamada verilen kararlar (Dalga 4)

- **Hitap ve yazım.** Okura "вы"; "ё" yerine "е"; tırnak « »; yüzde "{n} %" (bölünmez boşluk U+00A0, `Intl` ru çıktısıyla aynı).
- **Sayılar.** Düzyazıdaki sabit ondalıklar virgülle ("70,6 млрд", "4,25 бита"), binlik bölünmez boşlukla ("131 072"). Sürüm numaraları, komut satırı ve config değerleri değişmez ("vLLM 0.31", `--gpu-memory-utilization 0.92`).
- **Birim.** fr.md'deki gibi GB, GiB, TB/s ve tok/s etiketleri korunur; "ГБ"ye geçiş dil sahibinin kararı.
- **Çoğul.** Sayıyla değişen sözcükler ve İngilizcede `{s}` taşıyan cümleler `.one`, `.few`, `.many` girdisi alır; temel anahtar `other` biçimini (kesirli sayı, tekil genitif) taşır (`countKey`, src/lib/dict.ts). Sayının edat içinde kaldığı cümleler sayı yalın halde kalacak biçimde yeniden kuruldu ("{n} файл / файла / файлов"). Uyuma gerek olmayan yerlerde sayı ayrı durur ("слоев — {L}", "{k} из {n}"). Model sayfasındaki etiketler sayıyla uyuşur: "61 слой", "80 слоев", "64/8 голов".
- **Sözlükte olmayıp seçilenler.** reasoning → рассуждения; reranker → реранкер; vision / multimodal → «Зрение / мультимодальность»; accuracy → качество (точность precision için kalır); layout (TP/PP/DP) → раскладка (K26); draft model → черновая модель, MTP draft → MTP-драфтер; tool calling → вызов инструментов; encoder → энкодер; router → роутер (K25); req/s → RPS (K77, K78).
- **Bilinen sınır.** Model seçicideki dar etiket "64/8 гол." kısaltmayla uyumdan kaçar. Uygulama içi cümle arası `sentence.sep` (" "), son öğeden önceki "и" `list.and` (" и ") sözlükte (2026-11-20).

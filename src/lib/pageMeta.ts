// The head of every page in each language but English, for the copies
// scripts/prerender.ts builds in /tr/ and the other language folders.
//
// The English head lives in each .html entry, as it always has. The others
// cannot: their pages exist only in the build. Keyed by language, then entry
// file; the prerender refuses to build if an entry has no row here, and
// scripts/test-invariants.ts checks the same. Titles stay within 60 characters so
// results do not cut them.

import type { DEFAULT_LANG, Lang } from "./langs.ts";

export interface PageMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

const tr: Record<string, PageMeta> = {
  "index.html": {
    title: "LLM VRAM Hesaplama — KV Cache ve GPU Uyumu | LLMScale",
    description:
      "Bir LLM'in ne kadar GPU belleği istediğini hesapla: model ağırlıkları, KV cache, context penceresi ve eşzamanlı kullanıcılar — ardından hangi GPU'lara sığdığını gör. Config'i Hugging Face'ten canlı okur.",
    ogTitle: "LLMScale — LLM VRAM Hesaplayıcı",
    ogDescription: "LLM'in ne kadar VRAM ister? Ağırlıklar + KV cache + context + eşzamanlılık, GPU önerileriyle.",
  },
  "train.html": {
    title: "İnce Ayar VRAM Hesaplama — LoRA, QLoRA ve Tam | LLMScale",
    description:
      "Bir ince ayarın ne kadar GPU belleği istediğini hesapla: LoRA, QLoRA ya da tam. Gradyanlar, optimizer durumu ve geri yayılım için tutulan aktivasyonlar, sığan GPU'larla birlikte. ZeRO ve QLoRA makalelerine karşı doğrulandı.",
    ogTitle: "LLMScale — İnce Ayar VRAM'i",
    ogDescription:
      "İnce ayar VRAM'de neye mal olur? LoRA, QLoRA ve tam ince ayar; ağırlık, gradyan, optimizer durumu ve aktivasyonlara ayrılmış olarak.",
  },
  "fit.html": {
    title: "LLM Görev Uyumu — Model Bu İşe Uygun mu? | LLMScale",
    description:
      "Bir LLM'in görevine uyup uymadığını kontrol et — sohbet, kod, RAG, ajanlar, akıl yürütme, görsel, embedding — modelin gerçek boyutu, context'i, eğitimi ve kipinden puanlanır. Canlı Hugging Face verisi.",
    ogTitle: "LLMScale — Model ↔ Görev Uyumu",
    ogDescription:
      "Bu LLM görevin için doğru mu? Sohbet, kod, RAG, ajanlar, akıl yürütme, görsel ve daha fazlası için şeffaf, kurala dayalı uyum puanı.",
  },
  "anatomy.html": {
    title: "LLM Anatomisi — Parametre, Hassasiyet ve KV Cache | LLMScale",
    description:
      "Herhangi bir Hugging Face modelinin görsel röntgeni: parametrelerin nereye gittiği (embedding / attention / uzmanlar), her hassasiyette ağırlık boyutu, mimari, GQA ve KV cache büyümesi — canlı Hugging Face verisiyle.",
    ogTitle: "LLMScale — Model Anatomisi",
    ogDescription:
      "Herhangi bir LLM'in görsel röntgeni: parametre dağılımı, hassasiyete göre boyut, mimari, GQA ve KV cache büyümesi, canlı Hugging Face verisiyle.",
  },
  "compare.html": {
    title: "LLM Karşılaştırma — Özellikler ve Görev Uyumu | LLMScale",
    description:
      "2–4 Hugging Face LLM'ini yan yana karşılaştır: parametre, context, quantization, yetenekler ve görev bazında uyum — hangi modelin hangi iş için daha iyi olduğunu canlı Hugging Face verisiyle gör.",
    ogTitle: "LLMScale — Modelleri Karşılaştır",
    ogDescription:
      "2–4 LLM'i yan yana karşılaştır: özellikler, yetenekler ve görev bazında uyum — hangi model hangi iş için daha iyi.",
  },
  "decode.html": {
    title: "LLM Model Adı Çözücü — 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Herhangi bir LLM model adını çöz: 70B, AWQ, GGUF, FP8, A3B, Instruct ve diğerleri ne anlama geliyor — renk kodlu, açıklamalı ve etkileşimli.",
    ogTitle: "LLMScale — Model Adı Çözücü",
    ogDescription:
      "Bir LLM model adının her parçası ne anlama geliyor? 70B · AWQ · GGUF · FP8 · A3B… renk kodlu ve etkileşimli olarak açıklanır.",
  },
  "vllm.html": {
    title: "vLLM Parametreleri — Ayarlı vllm serve Komutu | LLMScale",
    description:
      "Herhangi bir model için ayarlanmış bir vllm serve komutu üret — throughput, gecikme, doğruluk ya da bellek için bayraklar; araç çağırma, uzun context ve quantization dahil, kopyalanabilir komutla.",
    ogTitle: "LLMScale — vLLM Parametre Yardımcısı",
    ogDescription:
      "Bir model ve iş yükü seç; performans, doğruluk ve güvenilirlik için ayarlanmış, kopyalanabilir bir vllm serve komutu al.",
  },
  "config.html": {
    title: "LLM config.json Açıklaması — Sade Dille | LLMScale",
    description:
      "Herhangi bir Hugging Face modelinin config.json'unu sade dille oku: katmanlar, attention head'leri, GQA ve MLA, uzmanlar, context ve RoPE ölçekleme, quantization — her cevap gerçek dosyanın satırlarına bağlı.",
    ogTitle: "LLMScale — config.json Çözücü",
    ogDescription:
      "Bir LLM'in config.json'undaki her alan ne anlama geliyor? Bellek, context, attention ve uzmanlar üzerine sade cevaplar, gerçek dosyaya bağlı.",
  },
  "serving.html": {
    title: "Servis Özeti — Sohbet Şablonu, MTP, Quantization | LLMScale",
    description:
      "Bir Hugging Face model reposunu çıkarım motorunun okuduğu gibi oku: sohbet şablonu, araç ve akıl yürütme parser'ları, generation_config, tensör adlarından quantization ve MTP katmanlarının gelip gelmediği — vLLM ve SGLang bayraklarıyla.",
    ogTitle: "LLMScale — Servis Özeti",
    ogDescription:
      "Bir modelin dosyaları servis hakkında ne diyor: araç ve akıl yürütme parser'ları, örnekleme varsayılanları, quantization, MTP — vLLM ve SGLang bayraklarıyla.",
  },
  "plan.html": {
    title: "LLM Kapasite Planı — Yükün ve Gecikmen İçin GPU | LLMScale",
    description:
      "Bir yükün kaç GPU istediği: saniyedeki istek sayısı, prompt ve cevap uzunlukları, ilk token ve token başına süre hedefleri girilir; kopya sayısı, tensor parallelism ve GPU sayısı çıkar. vLLM'in kendi belleğinden ve GPU'ların bant genişliği ile tensor işlem gücünden hesaplanır.",
    ogTitle: "LLMScale — Kapasite Planı",
    ogDescription:
      "Saniyedeki istek ve gecikme hedefleri girilir, GPU sayısı çıkar: vLLM için kopya sayısı ve tensor parallelism; bellek, bant genişliği ve tensor işlem gücünden.",
  },
  "gpu-compare.html": {
    title: "GPU Özellik Karşılaştırma — VRAM, Bant, TFLOPS | LLMScale",
    description:
      "2–4 GPU'yu veri sayfalarından yan yana karşılaştır: mimari, bellek tipi ve bant genişliği, yoğun BF16, FP8 ve FP4 TFLOPS, güç, NVLink ve form faktörü — tüketici ve veri merkezi kartları, Apple Silicon ve yapay zekâ PC'leri.",
    ogTitle: "LLMScale — GPU Karşılaştırma",
    ogDescription:
      "2–4 GPU yan yana: mimari, bellek ve bant genişliği, yoğun tensor TFLOPS, güç ve bağlantılar, üretici veri sayfalarından.",
  },
  "learn.html": {
    title: "LLM 101 — Bir LLM Nasıl Çalışır, Görsel Anlatım | LLMScale",
    description:
      "Büyük bir dil modelinin bir cümleyi nasıl sıradaki kelimeye dönüştürdüğünü anlatan etkileşimli, animasyonlu bir yolculuk — tokenization, embedding, attention, katmanlar ve örnekleme, 3B bir nöral takımyıldız olarak.",
    ogTitle: "LLM 101 — bir LLM nasıl çalışır, görsel anlatım",
    ogDescription:
      "Bir dil modelinin bir cümleyi nasıl sıradaki kelimeye dönüştürdüğünü anlatan etkileşimli yolculuk — token, embedding, attention, katmanlar ve örnekleme, 3B olarak.",
  },
};

const es: Record<string, PageMeta> = {
  "index.html": {
    title: "Calculadora de VRAM de LLM — pesos, caché KV, GPU | LLMScale",
    description:
      "Estima la memoria de GPU que necesita un LLM: pesos del modelo, caché KV, ventana de contexto y usuarios simultáneos — y mira en qué GPU cabe. Obtiene la configuración en vivo de Hugging Face.",
    ogTitle: "LLMScale — Calculadora de VRAM para LLM",
    ogDescription:
      "¿Cuánta VRAM necesita tu LLM? Pesos + caché KV + contexto + concurrencia, con recomendaciones de GPU.",
  },
  "train.html": {
    title: "VRAM para ajuste fino: LoRA, QLoRA y completo | LLMScale",
    description:
      "Calcula la memoria de GPU que necesita un ajuste fino: LoRA, QLoRA o completo. Gradientes, estado del optimizador y las activaciones que se guardan para el paso hacia atrás, con las GPU en las que cabe. Validado con los artículos de ZeRO y QLoRA.",
    ogTitle: "LLMScale — VRAM para ajuste fino",
    ogDescription:
      "¿Cuánta VRAM cuesta un ajuste fino? LoRA, QLoRA y ajuste completo desglosados en pesos, gradientes, estado del optimizador y activaciones.",
  },
  "fit.html": {
    title: "Adecuación a la tarea — ¿es este LLM el indicado? | LLMScale",
    description:
      "Comprueba si un LLM encaja con tu tarea — chat, código, RAG, agentes, razonamiento, visión, embeddings — con una puntuación basada en el tamaño real del modelo, su contexto, su tipo de ajuste y su modalidad. Datos en vivo de Hugging Face.",
    ogTitle: "LLMScale — Adecuación modelo ↔ tarea",
    ogDescription:
      "¿Es este LLM el adecuado para tu tarea? Puntuación de adecuación transparente y basada en reglas para chat, código, RAG, agentes, razonamiento, visión y más.",
  },
  "anatomy.html": {
    title: "Anatomía de LLM: parámetros, precisión y caché KV | LLMScale",
    description:
      "Una radiografía visual de cualquier modelo de Hugging Face: a dónde van sus parámetros (embeddings / atención / expertos), el tamaño de sus pesos en cada precisión, la arquitectura, GQA y el crecimiento de la caché KV — con datos en vivo de Hugging Face.",
    ogTitle: "LLMScale — Anatomía del modelo",
    ogDescription:
      "Radiografía visual de cualquier LLM: reparto de los parámetros, tamaño de los pesos en cada precisión, arquitectura, GQA y crecimiento de la caché KV, con datos en vivo de Hugging Face.",
  },
  "compare.html": {
    title: "Compara LLM lado a lado: ficha técnica y tareas | LLMScale",
    description:
      "Compara de 2 a 4 LLM de Hugging Face lado a lado: parámetros, contexto, cuantización, capacidades y adecuación por tarea — mira qué modelo es mejor para cada uso, con datos en vivo de Hugging Face.",
    ogTitle: "LLMScale — Comparar modelos",
    ogDescription:
      "Compara de 2 a 4 LLM lado a lado: especificaciones, capacidades y adecuación por tarea — qué modelo es mejor para cada uso.",
  },
  "decode.html": {
    title: "Descifra nombres de LLM: 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Descifra el nombre de cualquier modelo LLM: qué significan 70B, AWQ, GGUF, FP8, A3B, Instruct y más — con código de colores, explicado e interactivo.",
    ogTitle: "LLMScale — Decodificador de nombres de modelos",
    ogDescription:
      "¿Qué significa cada parte del nombre de un modelo LLM? 70B · AWQ · GGUF · FP8 · A3B… con código de colores y explicado, de forma interactiva.",
  },
  "vllm.html": {
    title: "Parámetros de vLLM serve — comando ajustado | LLMScale",
    description:
      "Genera un comando vllm serve ajustado para cualquier modelo — opciones para capacidad de procesamiento, latencia, exactitud o memoria, además de llamada a herramientas, contexto largo y cuantización, listo para copiar.",
    ogTitle: "LLMScale — Asistente de parámetros de vLLM",
    ogDescription:
      "Elige un modelo y una carga de trabajo y obtén un comando vllm serve ajustado y listo para copiar, optimizado para rendimiento, exactitud y fiabilidad.",
  },
  "config.html": {
    title: "config.json de LLM explicado en lenguaje sencillo | LLMScale",
    description:
      "Lee el config.json de cualquier modelo de Hugging Face en lenguaje sencillo: capas, cabezas de atención, GQA y MLA, expertos, contexto y escalado de RoPE, cuantización — cada respuesta ligada a las líneas del archivo real.",
    ogTitle: "LLMScale — Decodificador de config.json",
    ogDescription:
      "¿Qué significa cada campo del config.json de un LLM? Respuestas en lenguaje sencillo sobre memoria, contexto, atención y expertos, ligadas al archivo real.",
  },
  "serving.html": {
    title: "Plantilla de chat, MTP y cuantización al servir | LLMScale",
    description:
      "Lee el repositorio de un modelo de Hugging Face como lo hace un motor de inferencia: plantilla de chat, parsers de herramientas y de razonamiento, generation_config, cuantización a partir de los nombres de los tensores y si incluye sus capas MTP — con opciones de vLLM y SGLang.",
    ogTitle: "LLMScale — Resumen de servicio",
    ogDescription:
      "Qué dicen los archivos de un modelo sobre cómo servirlo: parsers de herramientas y de razonamiento, muestreo por defecto, cuantización, MTP — y las opciones de vLLM y SGLang.",
  },
  "plan.html": {
    title: "Plan de capacidad para LLM: GPU para tu carga | LLMScale",
    description:
      "Cuántas GPU necesita una carga: entran solicitudes por segundo, longitudes de prompt y respuesta, y objetivos de tiempo hasta el primer token y por token; salen réplicas, paralelismo de tensores y número de GPU, según la memoria propia de vLLM y el ancho de banda y el rendimiento de Tensor de las GPU.",
    ogTitle: "LLMScale — Plan de capacidad",
    ogDescription:
      "Entran solicitudes por segundo y objetivos de latencia; salen GPU: réplicas y paralelismo de tensores para vLLM, dimensionados a partir de la memoria, el ancho de banda y el rendimiento de Tensor.",
  },
  "gpu-compare.html": {
    title: "Comparativa de GPU: VRAM, ancho de banda, TFLOPS | LLMScale",
    description:
      "Compara de 2 a 4 GPU lado a lado a partir de sus hojas de datos: arquitectura, tipo y ancho de banda de memoria, TFLOPS densos en BF16, FP8 y FP4, consumo, NVLink y factor de forma — tarjetas de consumo y de centro de datos, Apple Silicon y PC de IA.",
    ogTitle: "LLMScale — Comparar GPU",
    ogDescription:
      "De 2 a 4 GPU lado a lado: arquitectura, memoria y ancho de banda, TFLOPS de Tensor densos, consumo y enlaces, a partir de las hojas de datos de los fabricantes.",
  },
  "learn.html": {
    title: "LLM 101 — cómo funciona un LLM, visualizado | LLMScale",
    description:
      "Un recorrido interactivo y animado por cómo un modelo de lenguaje grande convierte una frase en la siguiente palabra — tokenización, embeddings, atención, capas y muestreo, como una constelación neuronal en 3D.",
    ogTitle: "LLM 101 — cómo funciona un LLM, visualizado",
    ogDescription:
      "Un recorrido interactivo por cómo un modelo de lenguaje convierte una frase en la siguiente palabra — tokens, embeddings, atención, capas y muestreo, en 3D.",
  },
};

const hi: Record<string, PageMeta> = {
  "index.html": {
    title: "LLM VRAM कैलकुलेटर — वज़न, KV कैश और GPU फिट | LLMScale",
    description:
      "किसी LLM को कितनी GPU मेमोरी चाहिए, इसका अनुमान लगाएं: मॉडल वज़न, KV कैश, संदर्भ विंडो और समवर्ती उपयोगकर्ता — फिर देखें कि कौन-से GPU फिट होते हैं। Hugging Face से लाइव कॉन्फ़िगरेशन लेता है।",
    ogTitle: "LLMScale — LLM VRAM कैलकुलेटर",
    ogDescription:
      "आपके LLM को कितनी VRAM चाहिए? वज़न + KV कैश + संदर्भ + समवर्तीता, GPU सुझावों के साथ।",
  },
  "train.html": {
    title: "फाइन-ट्यूनिंग VRAM कैलकुलेटर — LoRA, QLoRA, पूर्ण | LLMScale",
    description:
      "किसी फाइन-ट्यून को कितनी GPU मेमोरी चाहिए, यह निकालें: LoRA, QLoRA या पूर्ण। ग्रेडिएंट, ऑप्टिमाइज़र स्टेट और backward pass के लिए रखे गए सक्रियण, फिट होने वाले GPU के साथ। ZeRO और QLoRA पेपर से मिलान करके जाँचा गया।",
    ogTitle: "LLMScale — फाइन-ट्यूनिंग VRAM",
    ogDescription:
      "फाइन-ट्यूनिंग में VRAM कितनी लगती है? LoRA, QLoRA और पूर्ण फाइन-ट्यूनिंग, वज़न, ग्रेडिएंट, ऑप्टिमाइज़र स्टेट और सक्रियण में बाँटकर।",
  },
  "fit.html": {
    title: "LLM कार्य उपयुक्तता — मॉडल इस काम के लिए सही है? | LLMScale",
    description:
      "जाँचें कि कोई LLM आपके काम के लिए उपयुक्त है या नहीं — चैट, कोड, RAG, एजेंट, रीज़निंग, विज़न, एम्बेडिंग — मॉडल के वास्तविक आकार, संदर्भ, ट्यूनिंग और मोडैलिटी से स्कोर किया गया। लाइव Hugging Face डेटा।",
    ogTitle: "LLMScale — मॉडल ↔ कार्य उपयुक्तता",
    ogDescription:
      "क्या यह LLM आपके काम के लिए सही है? चैट, कोड, RAG, एजेंट, रीज़निंग, विज़न और अन्य कामों में पारदर्शी, नियम-आधारित उपयुक्तता स्कोरिंग।",
  },
  "anatomy.html": {
    title: "LLM संरचना — पैरामीटर, सटीकता और KV कैश | LLMScale",
    description:
      "किसी भी Hugging Face मॉडल का विज़ुअल एक्स-रे: उसके पैरामीटर कहाँ जाते हैं (एम्बेडिंग / ध्यान / एक्सपर्ट), हर सटीकता पर उसके वज़न का आकार, आर्किटेक्चर, GQA और KV कैश की बढ़त — लाइव Hugging Face डेटा से।",
    ogTitle: "LLMScale — मॉडल संरचना",
    ogDescription:
      "किसी भी LLM का विज़ुअल एक्स-रे: पैरामीटर का बँटवारा, हर सटीकता पर वज़न का आकार, आर्किटेक्चर, GQA और KV कैश की बढ़त, लाइव Hugging Face डेटा से।",
  },
  "compare.html": {
    title: "LLM की साथ-साथ तुलना — विनिर्देश, कार्य उपयुक्तता | LLMScale",
    description:
      "2–4 Hugging Face LLM की साथ-साथ तुलना करें: पैरामीटर, संदर्भ, क्वांटाइजेशन, क्षमताएं और हर काम के लिए उपयुक्तता — देखें कि कौन-सा मॉडल किस उपयोग के लिए बेहतर है, लाइव Hugging Face डेटा से।",
    ogTitle: "LLMScale — मॉडल तुलना",
    ogDescription:
      "2–4 LLM की साथ-साथ तुलना: विनिर्देश, क्षमताएं और हर काम के लिए उपयुक्तता — कौन-सा मॉडल किस उपयोग के लिए बेहतर है।",
  },
  "decode.html": {
    title: "LLM नाम डिकोडर — 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "किसी भी LLM मॉडल का नाम डिकोड करें: 70B, AWQ, GGUF, FP8, A3B, Instruct और बाकी का क्या मतलब है — रंग-कोडेड, समझाया हुआ और इंटरैक्टिव।",
    ogTitle: "LLMScale — मॉडल नाम डिकोडर",
    ogDescription:
      "LLM मॉडल के नाम के हर हिस्से का क्या मतलब है? 70B · AWQ · GGUF · FP8 · A3B… रंग-कोडेड और समझाया हुआ, इंटरैक्टिव रूप में।",
  },
  "vllm.html": {
    title: "vLLM serve पैरामीटर — ट्यून किया गया कमांड हेल्पर | LLMScale",
    description:
      "किसी भी मॉडल के लिए ट्यून किया गया vllm serve कमांड बनाएं — थ्रूपुट, विलंबता, शुद्धता या मेमोरी के लिए फ्लैग, साथ में टूल कॉलिंग, लंबा संदर्भ और क्वांटाइजेशन, कॉपी करने योग्य कमांड के साथ।",
    ogTitle: "LLMScale — vLLM पैरामीटर हेल्पर",
    ogDescription:
      "एक मॉडल + वर्कलोड चुनें और प्रदर्शन, शुद्धता और विश्वसनीयता के लिए ऑप्टिमाइज़ किया गया, ट्यून किया हुआ, कॉपी करने योग्य vllm serve कमांड पाएं।",
  },
  "config.html": {
    title: "LLM config.json की व्याख्या — सरल भाषा में | LLMScale",
    description:
      "किसी भी Hugging Face मॉडल की config.json सरल भाषा में पढ़ें: लेयर, attention head, GQA और MLA, एक्सपर्ट, संदर्भ और RoPE स्केलिंग, क्वांटाइजेशन — हर उत्तर असली फ़ाइल की पंक्तियों से जुड़ा हुआ।",
    ogTitle: "LLMScale — config.json डिकोडर",
    ogDescription:
      "किसी LLM की config.json के हर फ़ील्ड का क्या मतलब है? मेमोरी, संदर्भ, ध्यान तंत्र और एक्सपर्ट पर सरल भाषा में उत्तर, असली फ़ाइल से जुड़े हुए।",
  },
  "serving.html": {
    title: "सर्विंग सारांश — चैट टेम्पलेट, MTP, क्वांटाइजेशन | LLMScale",
    description:
      "किसी Hugging Face मॉडल रिपॉजिटरी को वैसे पढ़ें जैसे इन्फरेंस इंजन पढ़ता है: चैट टेम्पलेट, टूल और रीज़निंग parser, generation_config, टेंसर नामों से क्वांटाइजेशन, और क्या इसकी MTP लेयर साथ आती हैं — vLLM और SGLang फ्लैग के साथ।",
    ogTitle: "LLMScale — सर्विंग सारांश",
    ogDescription:
      "किसी मॉडल की फ़ाइलें उसे सर्व करने के बारे में क्या कहती हैं: टूल और रीज़निंग parser, सैंपलिंग डिफ़ॉल्ट, क्वांटाइजेशन, MTP — और vLLM व SGLang फ्लैग।",
  },
  "plan.html": {
    title: "LLM क्षमता योजना — आपके लोड के लिए GPU | LLMScale",
    description:
      "किसी लोड के लिए कितने GPU चाहिए: इनपुट में requests per second, प्रॉम्प्ट और जवाब की लंबाई, और पहला-टोकन विलंब व प्रति-टोकन लक्ष्य; आउटपुट में replica, टेंसर पैरेललिज़्म और GPU संख्या, vLLM की अपनी मेमोरी और GPU की बैंडविड्थ और tensor throughput से।",
    ogTitle: "LLMScale — क्षमता योजना",
    ogDescription:
      "इनपुट में requests per second और विलंबता लक्ष्य, आउटपुट में GPU: vLLM के लिए replica और टेंसर पैरेललिज़्म, मेमोरी, बैंडविड्थ और tensor throughput से आकलित।",
  },
  "gpu-compare.html": {
    title: "GPU विनिर्देश तुलना — VRAM, बैंडविड्थ, TFLOPS | LLMScale",
    description:
      "2–4 GPU की उनकी datasheets से साथ-साथ तुलना करें: आर्किटेक्चर, मेमोरी प्रकार और बैंडविड्थ, डेंस BF16, FP8 और FP4 TFLOPS, पावर, NVLink और फॉर्म फैक्टर — उपभोक्ता और डेटा सेंटर GPU, Apple Silicon और AI PC।",
    ogTitle: "LLMScale — GPU तुलना",
    ogDescription:
      "2–4 GPU साथ-साथ: आर्किटेक्चर, मेमोरी और बैंडविड्थ, डेंस टेंसर TFLOPS, पावर और लिंक, निर्माताओं की datasheets से।",
  },
  "learn.html": {
    title: "LLM 101 — LLM कैसे काम करता है, विज़ुअल रूप में | LLMScale",
    description:
      "एक इंटरैक्टिव, एनिमेटेड यात्रा कि एक बड़ा भाषा मॉडल किसी वाक्य को अगले शब्द में कैसे बदलता है — टोकनाइज़ेशन, एम्बेडिंग, ध्यान, लेयर और सैंपलिंग, एक 3D न्यूरल तारामंडल के रूप में।",
    ogTitle: "LLM 101 — LLM कैसे काम करता है, विज़ुअल रूप में",
    ogDescription:
      "एक इंटरैक्टिव यात्रा कि भाषा मॉडल किसी वाक्य को अगले शब्द में कैसे बदलता है — टोकन, एम्बेडिंग, ध्यान, लेयर और सैंपलिंग, 3D में।",
  },
};

const zh: Record<string, PageMeta> = {
  "index.html": {
    title: "LLM 显存计算：权重、KV 缓存、GPU | LLMScale",
    description:
      "估算 LLM 需要多少显存：模型权重、KV 缓存、上下文窗口和并发用户，再看哪些 GPU 放得下。从 Hugging Face 实时读取配置。",
    ogTitle: "LLMScale — LLM 显存计算器",
    ogDescription:
      "你的 LLM 需要多少显存？权重 + KV 缓存 + 上下文 + 并发，并附 GPU 推荐。",
  },
  "train.html": {
    title: "微调显存：LoRA、QLoRA、完全微调 | LLMScale",
    description:
      "算出一次微调需要多少显存：LoRA、QLoRA 或完全微调。涵盖梯度、优化器状态和为反向传播保留的激活值，并列出放得下的 GPU。已对照 ZeRO 和 QLoRA 论文验证。",
    ogTitle: "LLMScale — 微调显存",
    ogDescription:
      "微调要占用多少显存？把 LoRA、QLoRA 和完全微调拆分为权重、梯度、优化器状态和激活值。",
  },
  "fit.html": {
    title: "LLM 任务匹配：这个模型适合这项任务吗？ | LLMScale",
    description:
      "检查一个 LLM 是否适合你的任务（聊天、代码、RAG、智能体、推理、视觉、嵌入），根据模型的实际规模、上下文、调优方式和模态打分。数据实时来自 Hugging Face。",
    ogTitle: "LLMScale — 模型 ↔ 任务匹配",
    ogDescription:
      "这个 LLM 适合你的任务吗？透明、基于规则的匹配评分，覆盖聊天、代码、RAG、智能体、推理、视觉等。",
  },
  "anatomy.html": {
    title: "LLM 剖析：参数、精度与 KV 缓存 | LLMScale",
    description:
      "为任意 Hugging Face 模型做可视化“X 光”：参数分布在哪里（嵌入 / 注意力 / 专家）、各精度下的权重大小、架构、GQA 和 KV 缓存增长，数据实时来自 Hugging Face。",
    ogTitle: "LLMScale — 模型剖析",
    ogDescription:
      "为任意 LLM 做可视化“X 光”：参数分布、各精度下的权重大小、架构、GQA 和 KV 缓存增长，数据实时来自 Hugging Face。",
  },
  "compare.html": {
    title: "LLM 并排对比：规格与任务匹配 | LLMScale",
    description:
      "并排对比 2–4 个 Hugging Face LLM：参数、上下文、量化、能力和各任务匹配度，看哪个模型更适合哪种用途，数据实时来自 Hugging Face。",
    ogTitle: "LLMScale — 模型对比",
    ogDescription:
      "并排对比 2–4 个 LLM：规格、能力和各任务匹配度，看哪个模型更适合哪种用途。",
  },
  "decode.html": {
    title: "LLM 名称解读：70B、AWQ、GGUF | LLMScale",
    description:
      "解读任意 LLM 模型名称：70B、AWQ、GGUF、FP8、A3B、Instruct 等分别是什么意思，用颜色区分、逐项解释，并可交互。",
    ogTitle: "LLMScale — 模型名称解读",
    ogDescription:
      "LLM 模型名称的每一部分是什么意思？70B · AWQ · GGUF · FP8 · A3B……用颜色区分并逐项解释，可交互。",
  },
  "vllm.html": {
    title: "vLLM serve 参数：调优命令助手 | LLMScale",
    description:
      "为任意模型生成调优后的 vllm serve 命令：针对吞吐量、延迟、准确性或显存的参数，以及工具调用、长上下文和量化，命令可直接复制。",
    ogTitle: "LLMScale — vLLM 参数助手",
    ogDescription:
      "选择模型和工作负载，获得针对性能、准确性和可靠性调优、可直接复制的 vllm serve 命令。",
  },
  "config.html": {
    title: "LLM config.json 通俗解读 | LLMScale",
    description:
      "用通俗的语言读懂任意 Hugging Face 模型的 config.json：层数、注意力头、GQA 和 MLA、专家、上下文与 RoPE 缩放、量化，每个解答都对应真实文件中的具体行。",
    ogTitle: "LLMScale — config.json 解读",
    ogDescription:
      "LLM 的 config.json 中每个字段是什么意思？用通俗的语言解答显存、上下文、注意力和专家相关问题，并对应真实文件。",
  },
  "serving.html": {
    title: "推理服务简报：聊天模板、MTP、量化 | LLMScale",
    description:
      "像推理引擎那样读懂 Hugging Face 模型仓库：聊天模板、工具与推理 parser、generation_config、根据张量名判断的量化方式，以及是否附带 MTP 层，并给出 vLLM 和 SGLang 参数。",
    ogTitle: "LLMScale — 推理服务简报",
    ogDescription:
      "模型文件对推理服务说明了什么：工具与推理 parser、采样默认值、量化、MTP，以及对应的 vLLM 和 SGLang 参数。",
  },
  "plan.html": {
    title: "LLM 容量规划：你的负载需要多少 GPU | LLMScale",
    description:
      "一个负载需要多少 GPU：输入每秒请求数、提示与回复长度，以及首 token 延迟和每 token 延迟目标；输出副本数、张量并行和 GPU 数量。依据 vLLM 自身的显存占用，以及 GPU 的显存带宽和算力计算。",
    ogTitle: "LLMScale — 容量规划",
    ogDescription:
      "输入每秒请求数和延迟目标，输出 GPU 数量：vLLM 的副本数和张量并行，依据显存、带宽和算力计算。",
  },
  "gpu-compare.html": {
    title: "GPU 规格对比：显存、带宽、TFLOPS | LLMScale",
    description:
      "根据数据表并排对比 2–4 款 GPU：架构、显存类型与带宽、稠密 BF16、FP8 和 FP4 TFLOPS、功耗、NVLink 和外形规格，涵盖消费级与数据中心显卡、Apple Silicon 和 AI PC。",
    ogTitle: "LLMScale — GPU 对比",
    ogDescription:
      "2–4 款 GPU 并排对比：架构、显存与带宽、稠密 Tensor TFLOPS、功耗和互连，数据来自厂商数据表。",
  },
  "learn.html": {
    title: "LLM 101：图解 LLM 工作原理 | LLMScale",
    description:
      "交互式动画讲解：大语言模型如何把一句话变成下一个词——分词、嵌入、注意力、层和采样，以 3D 神经星座的形式呈现。",
    ogTitle: "LLM 101：图解 LLM 工作原理",
    ogDescription:
      "交互式讲解语言模型如何把一句话变成下一个词：token、嵌入、注意力、层和采样，3D 呈现。",
  },
};

const fr: Record<string, PageMeta> = {
  "index.html": {
    title: "Calculatrice de VRAM LLM — poids, cache KV, GPU | LLMScale",
    description:
      "Estimez la mémoire GPU dont un LLM a besoin : poids du modèle, cache KV, fenêtre de contexte et utilisateurs simultanés — puis voyez sur quels GPU il tient. Lit la configuration en direct sur Hugging Face.",
    ogTitle: "LLMScale — Calculatrice de VRAM pour LLM",
    ogDescription:
      "De combien de VRAM votre LLM a-t-il besoin ? Poids + cache KV + contexte + utilisateurs simultanés, avec des GPU recommandés.",
  },
  "train.html": {
    title: "VRAM pour le fine-tuning : LoRA, QLoRA, complet | LLMScale",
    description:
      "Calculez la mémoire GPU dont un fine-tuning a besoin : LoRA, QLoRA ou complet. Gradients, état de l'optimiseur et activations conservées pour la rétropropagation, avec les GPU qui conviennent. Validé par rapport aux articles ZeRO et QLoRA.",
    ogTitle: "LLMScale — VRAM pour le fine-tuning",
    ogDescription:
      "Combien de VRAM coûte un fine-tuning ? LoRA, QLoRA et affinage complet, détaillés en poids, gradients, état de l'optimiseur et activations.",
  },
  "fit.html": {
    title: "Adéquation à la tâche — ce LLM est-il le bon ? | LLMScale",
    description:
      "Vérifiez si un LLM convient à votre tâche — chat, code, RAG, agents, raisonnement, vision, embeddings — avec un score tiré de la taille réelle du modèle, de son contexte, de son type d'ajustement et de sa modalité. Données Hugging Face en direct.",
    ogTitle: "LLMScale — Adéquation modèle ↔ tâche",
    ogDescription:
      "Ce LLM convient-il à votre tâche ? Un score d'adéquation transparent et fondé sur des règles pour le chat, le code, le RAG, les agents, le raisonnement, la vision et plus encore.",
  },
  "anatomy.html": {
    title: "Anatomie de LLM : paramètres, précision, cache KV | LLMScale",
    description:
      "Une radiographie visuelle de n'importe quel modèle Hugging Face : où vont ses paramètres (embeddings / attention / experts), la taille de ses poids dans chaque précision, l'architecture, la GQA et la croissance du cache KV — à partir de données Hugging Face en direct.",
    ogTitle: "LLMScale — Anatomie du modèle",
    ogDescription:
      "Radiographie visuelle de n'importe quel LLM : répartition des paramètres, taille des poids dans chaque précision, architecture, GQA et croissance du cache KV, à partir de données Hugging Face en direct.",
  },
  "compare.html": {
    title: "Comparer des LLM : caractéristiques et tâches | LLMScale",
    description:
      "Comparez de 2 à 4 LLM Hugging Face côte à côte : paramètres, contexte, quantification, capacités et adéquation par tâche — voyez quel modèle convient le mieux à chaque usage, à partir de données Hugging Face en direct.",
    ogTitle: "LLMScale — Comparer des modèles",
    ogDescription:
      "Comparez de 2 à 4 LLM côte à côte : caractéristiques, capacités et adéquation par tâche — quel modèle convient le mieux à chaque usage.",
  },
  "decode.html": {
    title: "Décoder un nom de LLM : 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Décodez le nom de n'importe quel modèle LLM : ce que signifient 70B, AWQ, GGUF, FP8, A3B, Instruct et plus encore — avec code couleur, expliqué et interactif.",
    ogTitle: "LLMScale — Décodeur de noms de modèles",
    ogDescription:
      "Que signifie chaque partie du nom d'un modèle LLM ? 70B · AWQ · GGUF · FP8 · A3B… avec code couleur et explications, de façon interactive.",
  },
  "vllm.html": {
    title: "Paramètres de vLLM serve — commande optimisée | LLMScale",
    description:
      "Générez une commande vllm serve optimisée pour n'importe quel modèle — options pour le débit, la latence, l'exactitude ou la mémoire, ainsi que l'appel d'outils, le contexte long et la quantification, avec une commande prête à copier.",
    ogTitle: "LLMScale — Assistant de paramètres vLLM",
    ogDescription:
      "Choisissez un modèle et une charge de travail, et obtenez une commande vllm serve optimisée et prête à copier, pensée pour la performance, l'exactitude et la fiabilité.",
  },
  "config.html": {
    title: "config.json d'un LLM expliqué en langage clair | LLMScale",
    description:
      "Lisez le config.json de n'importe quel modèle Hugging Face en langage clair : couches, têtes d'attention, GQA et MLA, experts, contexte et mise à l'échelle RoPE, quantification — chaque réponse étant liée aux lignes du vrai fichier.",
    ogTitle: "LLMScale — Décodeur de config.json",
    ogDescription:
      "Que signifie chaque champ du config.json d'un LLM ? Des réponses en langage clair sur la mémoire, le contexte, l'attention et les experts, liées au vrai fichier.",
  },
  "serving.html": {
    title: "Chat template, MTP et quantification pour servir | LLMScale",
    description:
      "Lisez le dépôt d'un modèle Hugging Face comme le fait un moteur d'inférence : chat template, parsers d'outils et de raisonnement, generation_config, quantification d'après les noms des tenseurs et présence ou non de ses couches MTP — avec les options vLLM et SGLang.",
    ogTitle: "LLMScale — Fiche de mise en service",
    ogDescription:
      "Ce que les fichiers d'un modèle disent de sa mise en service : parsers d'outils et de raisonnement, échantillonnage par défaut, quantification, MTP — et les options vLLM et SGLang.",
  },
  "plan.html": {
    title: "Plan de capacité LLM — GPU pour votre charge | LLMScale",
    description:
      "Combien de GPU une charge exige : en entrée, les requêtes par seconde, les longueurs de prompt et de réponse, et les objectifs de délai d'émission du premier jeton et de délai par jeton ; en sortie, les répliques, le parallélisme de tenseurs et le nombre de GPU, d'après la mémoire propre à vLLM ainsi que la bande passante et les performances des cœurs Tensor des GPU.",
    ogTitle: "LLMScale — Plan de capacité",
    ogDescription:
      "En entrée, les requêtes par seconde et les objectifs de latence ; en sortie, les GPU : répliques et parallélisme de tenseurs pour vLLM, dimensionnés d'après la mémoire, la bande passante et les performances des cœurs Tensor.",
  },
  "gpu-compare.html": {
    title: "Comparatif GPU — VRAM, bande passante, TFLOPS | LLMScale",
    description:
      "Comparez de 2 à 4 GPU côte à côte d'après leurs fiches techniques : architecture, type et bande passante mémoire, TFLOPS denses en BF16, FP8 et FP4, consommation, NVLink et configuration — cartes grand public et pour centres de données, Apple Silicon et PC IA.",
    ogTitle: "LLMScale — Comparer des GPU",
    ogDescription:
      "De 2 à 4 GPU côte à côte : architecture, mémoire et bande passante, TFLOPS denses des cœurs Tensor, consommation et interconnexions, d'après les fiches techniques des fabricants.",
  },
  "learn.html": {
    title: "LLM 101 — comment fonctionne un LLM, en images | LLMScale",
    description:
      "Une visite interactive et animée de la façon dont un grand modèle de langage transforme une phrase en mot suivant — tokenisation, embeddings, attention, couches et échantillonnage, sous la forme d'une constellation neuronale en 3D.",
    ogTitle: "LLM 101 — comment fonctionne un LLM, en images",
    ogDescription:
      "Une visite interactive de la façon dont un modèle de langage transforme une phrase en mot suivant — jetons, embeddings, attention, couches et échantillonnage, en 3D.",
  },
};

export const PAGE_META: Record<Exclude<Lang, typeof DEFAULT_LANG>, Record<string, PageMeta>> = { tr, zh, hi, es, fr };

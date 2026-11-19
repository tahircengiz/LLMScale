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

const pt: Record<string, PageMeta> = {
  "index.html": {
    title: "Calculadora de VRAM de LLM — pesos, cache KV, GPU | LLMScale",
    description:
      "Estime a memória da GPU de que um LLM precisa: pesos do modelo, cache KV, janela de contexto e usuários simultâneos — e veja em quais GPUs ele cabe. Lê a configuração ao vivo do Hugging Face.",
    ogTitle: "LLMScale — Calculadora de VRAM para LLMs",
    ogDescription:
      "De quanta VRAM o seu LLM precisa? Pesos + cache KV + contexto + simultaneidade, com recomendações de GPU.",
  },
  "train.html": {
    title: "VRAM para ajuste fino: LoRA, QLoRA e completo | LLMScale",
    description:
      "Calcule a memória da GPU de que um ajuste fino precisa: LoRA, QLoRA ou completo. Gradientes, estado do otimizador e as ativações guardadas para a retropropagação, com as GPUs em que ele cabe. Validado com os artigos do ZeRO e do QLoRA.",
    ogTitle: "LLMScale — VRAM para ajuste fino",
    ogDescription:
      "Quanto custa um ajuste fino em VRAM? LoRA, QLoRA e ajuste fino completo, divididos em pesos, gradientes, estado do otimizador e ativações.",
  },
  "fit.html": {
    title: "Adequação à tarefa — este LLM é o certo? | LLMScale",
    description:
      "Verifique se um LLM se adequa à sua tarefa — chat, código, RAG, agentes, raciocínio, visão, embeddings — com uma pontuação baseada no tamanho real do modelo, no contexto, no tipo de ajuste e na modalidade. Dados ao vivo do Hugging Face.",
    ogTitle: "LLMScale — Adequação modelo ↔ tarefa",
    ogDescription:
      "Este LLM é o certo para a sua tarefa? Pontuação de adequação transparente e baseada em regras para chat, código, RAG, agentes, raciocínio, visão e mais.",
  },
  "anatomy.html": {
    title: "Anatomia de LLMs: parâmetros, precisão e cache KV | LLMScale",
    description:
      "Um raio X visual de qualquer modelo do Hugging Face: para onde vão os parâmetros (embeddings / atenção / especialistas), o tamanho dos pesos em cada precisão, a arquitetura, GQA e o crescimento do cache KV — com dados ao vivo do Hugging Face.",
    ogTitle: "LLMScale — Anatomia do modelo",
    ogDescription:
      "Raio X visual de qualquer LLM: distribuição dos parâmetros, tamanho dos pesos em cada precisão, arquitetura, GQA e crescimento do cache KV, com dados ao vivo do Hugging Face.",
  },
  "compare.html": {
    title: "Compare LLMs lado a lado: ficha técnica e tarefas | LLMScale",
    description:
      "Compare de 2 a 4 LLMs do Hugging Face lado a lado: parâmetros, contexto, quantização, capacidades e adequação por tarefa — veja qual modelo é melhor para cada uso, com dados ao vivo do Hugging Face.",
    ogTitle: "LLMScale — Comparar modelos",
    ogDescription:
      "Compare de 2 a 4 LLMs lado a lado: especificações, capacidades e adequação por tarefa — qual modelo é melhor para cada uso.",
  },
  "decode.html": {
    title: "Decifre nomes de LLMs: 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Decifre o nome de qualquer modelo LLM: o que significam 70B, AWQ, GGUF, FP8, A3B, Instruct e mais — com código de cores, explicado e interativo.",
    ogTitle: "LLMScale — Decodificador de nomes de modelos",
    ogDescription:
      "O que significa cada parte do nome de um modelo LLM? 70B · AWQ · GGUF · FP8 · A3B… com código de cores e explicado, de forma interativa.",
  },
  "vllm.html": {
    title: "Parâmetros do vLLM serve — comando ajustado | LLMScale",
    description:
      "Gere um comando vllm serve ajustado para qualquer modelo — flags para taxa de transferência, latência, acurácia ou memória, além de chamada de ferramentas, contexto longo e quantização, pronto para copiar.",
    ogTitle: "LLMScale — Assistente de parâmetros do vLLM",
    ogDescription:
      "Escolha um modelo e uma carga de trabalho e receba um comando vllm serve ajustado e pronto para copiar, otimizado para desempenho, acurácia e confiabilidade.",
  },
  "config.html": {
    title: "config.json de LLM explicado em linguagem simples | LLMScale",
    description:
      "Leia o config.json de qualquer modelo do Hugging Face em linguagem simples: camadas, cabeças de atenção, GQA e MLA, especialistas, contexto e escalonamento do RoPE, quantização — cada resposta ligada às linhas do arquivo real.",
    ogTitle: "LLMScale — Decodificador de config.json",
    ogDescription:
      "O que significa cada campo do config.json de um LLM? Respostas em linguagem simples sobre memória, contexto, atenção e especialistas, ligadas ao arquivo real.",
  },
  "serving.html": {
    title: "Template de chat, MTP e quantização na inferência | LLMScale",
    description:
      "Leia o repositório de um modelo do Hugging Face como um mecanismo de inferência o lê: template de chat, parsers de ferramentas e de raciocínio, generation_config, a quantização a partir dos nomes dos tensores e se as camadas MTP vêm junto — com flags do vLLM e do SGLang.",
    ogTitle: "LLMScale — Resumo de disponibilização",
    ogDescription:
      "O que os arquivos de um modelo dizem sobre como disponibilizá-lo: parsers de ferramentas e de raciocínio, padrões de amostragem, quantização, MTP — e as flags do vLLM e do SGLang.",
  },
  "plan.html": {
    title: "Plano de capacidade de LLM: GPUs para sua carga | LLMScale",
    description:
      "Quantas GPUs uma carga exige: entram solicitações por segundo, tamanhos de prompt e de resposta, e metas de tempo para o primeiro token e por token; saem réplicas, paralelismo de tensor e número de GPUs, a partir da memória do próprio vLLM e da largura de banda e do desempenho do Tensor das GPUs.",
    ogTitle: "LLMScale — Plano de capacidade",
    ogDescription:
      "Entram solicitações por segundo e metas de latência; saem GPUs: réplicas e paralelismo de tensor para o vLLM, dimensionados a partir da memória, da largura de banda e do desempenho do Tensor.",
  },
  "gpu-compare.html": {
    title: "Compare GPUs: VRAM, largura de banda e TFLOPS | LLMScale",
    description:
      "Compare de 2 a 4 GPUs lado a lado a partir das fichas técnicas: arquitetura, tipo e largura de banda da memória, TFLOPS densos em BF16, FP8 e FP4, potência, NVLink e fator de forma — placas de consumo e de data center, Apple Silicon e PCs de IA.",
    ogTitle: "LLMScale — Comparar GPUs",
    ogDescription:
      "De 2 a 4 GPUs lado a lado: arquitetura, memória e largura de banda, TFLOPS de Tensor densos, potência e interconexões, a partir das fichas técnicas dos fabricantes.",
  },
  "learn.html": {
    title: "LLM 101 — como funciona um LLM, de forma visual | LLMScale",
    description:
      "Um passo a passo interativo e animado de como um modelo de linguagem grande transforma uma frase na próxima palavra — tokenização, embeddings, atenção, camadas e amostragem, como uma constelação neural em 3D.",
    ogTitle: "LLM 101 — como funciona um LLM, de forma visual",
    ogDescription:
      "Um passo a passo interativo de como um modelo de linguagem transforma uma frase na próxima palavra — tokens, embeddings, atenção, camadas e amostragem, em 3D.",
  },
};

const id: Record<string, PageMeta> = {
  "index.html": {
    title: "Kalkulator VRAM LLM — bobot, cache KV, GPU | LLMScale",
    description:
      "Perkirakan memori GPU yang dibutuhkan LLM: bobot model, cache KV, jendela konteks, dan pengguna bersamaan — lalu lihat GPU mana yang dapat menampungnya. Mengambil konfigurasi langsung dari Hugging Face.",
    ogTitle: "LLMScale — Kalkulator VRAM LLM",
    ogDescription:
      "Berapa banyak VRAM yang dibutuhkan LLM Anda? Bobot + cache KV + konteks + konkurensi, dengan rekomendasi GPU.",
  },
  "train.html": {
    title: "Kalkulator VRAM fine-tuning — LoRA, QLoRA, penuh | LLMScale",
    description:
      "Hitung memori GPU yang dibutuhkan fine-tuning: LoRA, QLoRA, atau penuh. Gradien, state optimizer, dan aktivasi yang disimpan untuk backward pass, beserta GPU yang dapat menampungnya. Divalidasi terhadap makalah ZeRO dan QLoRA.",
    ogTitle: "LLMScale — VRAM fine-tuning",
    ogDescription:
      "Berapa banyak VRAM yang dibutuhkan fine-tuning? LoRA, QLoRA, dan fine-tuning penuh, dirinci menjadi bobot, gradien, state optimizer, dan aktivasi.",
  },
  "fit.html": {
    title: "Kecocokan tugas LLM — apakah modelnya tepat? | LLMScale",
    description:
      "Periksa apakah sebuah LLM cocok untuk tugas Anda — chat, kode, RAG, agen, penalaran, visi, embedding — dinilai dari ukuran nyata model, konteks, penyesuaian, dan modalitasnya. Data langsung dari Hugging Face.",
    ogTitle: "LLMScale — Kecocokan model ↔ tugas",
    ogDescription:
      "Apakah LLM ini tepat untuk tugas Anda? Penilaian kecocokan yang transparan dan berbasis aturan untuk chat, kode, RAG, agen, penalaran, visi, dan lainnya.",
  },
  "anatomy.html": {
    title: "Anatomi LLM — parameter, presisi, dan cache KV | LLMScale",
    description:
      "Rontgen visual model Hugging Face apa pun: ke mana parameternya pergi (embedding / perhatian / ahli), ukuran bobotnya pada setiap presisi, arsitektur, GQA, dan pertumbuhan cache KV — dari data langsung Hugging Face.",
    ogTitle: "LLMScale — Anatomi model",
    ogDescription:
      "Rontgen visual LLM apa pun: distribusi parameter, ukuran bobot pada setiap presisi, arsitektur, GQA, dan pertumbuhan cache KV, dari data langsung Hugging Face.",
  },
  "compare.html": {
    title: "Bandingkan LLM berdampingan — spesifikasi, tugas | LLMScale",
    description:
      "Bandingkan 2–4 LLM Hugging Face secara berdampingan: parameter, konteks, kuantisasi, kemampuan, dan kecocokan per tugas — lihat model mana yang lebih baik untuk penggunaan apa, dari data langsung Hugging Face.",
    ogTitle: "LLMScale — Bandingkan model",
    ogDescription:
      "Bandingkan 2–4 LLM secara berdampingan: spesifikasi, kemampuan, dan kecocokan per tugas — model mana yang lebih baik untuk penggunaan apa.",
  },
  "decode.html": {
    title: "Pengurai nama LLM — 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Uraikan nama model LLM apa pun: arti 70B, AWQ, GGUF, FP8, A3B, Instruct, dan lainnya — berkode warna, dijelaskan, dan interaktif.",
    ogTitle: "LLMScale — Pengurai nama model",
    ogDescription:
      "Apa arti setiap bagian nama model LLM? 70B · AWQ · GGUF · FP8 · A3B… berkode warna dan dijelaskan secara interaktif.",
  },
  "vllm.html": {
    title: "Parameter vLLM serve — perintah yang disetel | LLMScale",
    description:
      "Buat perintah vllm serve yang disetel untuk model apa pun — flag untuk throughput, latensi, akurasi, atau memori, ditambah pemanggilan alat, konteks panjang, dan kuantisasi, dengan perintah yang siap disalin.",
    ogTitle: "LLMScale — Asisten parameter vLLM",
    ogDescription:
      "Pilih model + beban kerja dan dapatkan perintah vllm serve yang disetel dan siap disalin, dioptimalkan untuk performa, akurasi, dan keandalan.",
  },
  "config.html": {
    title: "config.json LLM dijelaskan dalam bahasa sederhana | LLMScale",
    description:
      "Baca config.json model Hugging Face apa pun dalam bahasa sederhana: lapisan, head self-attention, GQA dan MLA, ahli, konteks dan penskalaan RoPE, kuantisasi — setiap jawaban terhubung ke baris-baris file aslinya.",
    ogTitle: "LLMScale — Pengurai config.json",
    ogDescription:
      "Apa arti setiap field di config.json sebuah LLM? Jawaban dalam bahasa sederhana tentang memori, konteks, perhatian, dan ahli, terhubung ke file aslinya.",
  },
  "serving.html": {
    title: "Penyajian model — template chat, MTP, kuantisasi | LLMScale",
    description:
      "Baca repositori model Hugging Face seperti yang dilakukan mesin inferensi: template chat, parser alat dan penalaran, generation_config, kuantisasi dari nama tensor, dan apakah lapisan MTP-nya disertakan — dengan flag vLLM dan SGLang.",
    ogTitle: "LLMScale — Ringkasan penyajian",
    ogDescription:
      "Apa kata file model tentang cara menyajikannya: parser alat dan penalaran, sampling default, kuantisasi, MTP — serta flag vLLM dan SGLang.",
  },
  "plan.html": {
    title: "Perencanaan kapasitas LLM — GPU untuk beban Anda | LLMScale",
    description:
      "Berapa GPU yang dibutuhkan suatu beban: masukannya permintaan per detik, panjang prompt dan balasan, serta target waktu hingga token pertama dan per token; keluarannya replika, paralelisme tensor, dan jumlah GPU, dihitung dari memori vLLM sendiri serta bandwidth dan performa Tensor GPU.",
    ogTitle: "LLMScale — Rencana kapasitas",
    ogDescription:
      "Masukkan permintaan per detik dan target latensi, dapatkan GPU: replika dan paralelisme tensor untuk vLLM, dihitung dari memori, bandwidth, dan performa Tensor.",
  },
  "gpu-compare.html": {
    title: "Perbandingan GPU — VRAM, bandwidth, TFLOPS | LLMScale",
    description:
      "Bandingkan 2–4 GPU secara berdampingan dari datasheet-nya: arsitektur, jenis dan bandwidth memori, TFLOPS padat BF16, FP8, dan FP4, daya, NVLink, dan faktor bentuk — kartu konsumen dan pusat data, Apple Silicon, dan PC AI.",
    ogTitle: "LLMScale — Perbandingan GPU",
    ogDescription:
      "2–4 GPU berdampingan: arsitektur, memori dan bandwidth, TFLOPS Tensor padat, daya, dan interkoneksi, dari datasheet produsen.",
  },
  "learn.html": {
    title: "LLM 101 — cara kerja LLM, divisualisasikan | LLMScale",
    description:
      "Penjelajahan interaktif dan beranimasi tentang cara model bahasa besar mengubah sebuah kalimat menjadi kata berikutnya — tokenisasi, embedding, perhatian, lapisan, dan sampling, sebagai konstelasi neural 3D.",
    ogTitle: "LLM 101 — cara kerja LLM, divisualisasikan",
    ogDescription:
      "Penjelajahan interaktif tentang cara model bahasa mengubah sebuah kalimat menjadi kata berikutnya — token, embedding, perhatian, lapisan, dan sampling, dalam 3D.",
  },
};

const bn: Record<string, PageMeta> = {
  "index.html": {
    title: "LLM VRAM ক্যালকুলেটর — ওজন, KV ক্যাশ ও GPU | LLMScale",
    description:
      "একটি LLM-এর কত GPU মেমরি লাগে তার হিসাব করুন: মডেল ওজন, KV ক্যাশ, কনটেক্সট উইন্ডো ও একযোগে ব্যবহারকারী — তারপর দেখুন কোন GPU-তে এটি ধরে। Hugging Face থেকে সরাসরি কনফিগারেশন পড়ে।",
    ogTitle: "LLMScale — LLM VRAM ক্যালকুলেটর",
    ogDescription:
      "আপনার LLM-এর কত VRAM লাগে? ওজন + KV ক্যাশ + কনটেক্সট + একযোগে ব্যবহারকারী, GPU সুপারিশসহ।",
  },
  "train.html": {
    title: "ফাইন-টিউনিং VRAM — LoRA, QLoRA ও সম্পূর্ণ | LLMScale",
    description:
      "একটি ফাইন-টিউনের কত GPU মেমরি লাগে তার হিসাব করুন: LoRA, QLoRA বা সম্পূর্ণ। গ্রেডিয়েন্ট, অপ্টিমাইজার স্টেট এবং backward pass-এর জন্য রাখা অ্যাক্টিভেশন, যেসব GPU-তে ধরে সেগুলোসহ। ZeRO ও QLoRA পেপারের সাথে মিলিয়ে যাচাই করা।",
    ogTitle: "LLMScale — ফাইন-টিউনিং VRAM",
    ogDescription:
      "ফাইন-টিউনিংয়ে কত VRAM লাগে? LoRA, QLoRA ও সম্পূর্ণ ফাইন-টিউনিং, ওজন, গ্রেডিয়েন্ট, অপ্টিমাইজার স্টেট ও অ্যাক্টিভেশনে ভাগ করে।",
  },
  "fit.html": {
    title: "LLM-এর কাজের উপযুক্ততা — মডেলটি কি ঠিক? | LLMScale",
    description:
      "একটি LLM আপনার কাজের উপযুক্ত কি না যাচাই করুন — চ্যাট, কোড, RAG, এজেন্ট, রিজনিং, ভিশন, এম্বেডিং — মডেলের আসল আকার, কনটেক্সট, টিউনিং ও মোডালিটি থেকে স্কোর করা। Hugging Face-এর লাইভ ডেটা।",
    ogTitle: "LLMScale — মডেল ↔ কাজের উপযুক্ততা",
    ogDescription:
      "এই LLM কি আপনার কাজের জন্য ঠিক? চ্যাট, কোড, RAG, এজেন্ট, রিজনিং, ভিশন ও আরও অনেক কাজে স্বচ্ছ, নিয়মভিত্তিক উপযুক্ততার স্কোর।",
  },
  "anatomy.html": {
    title: "LLM-এর গঠন — প্যারামিটার, প্রিসিশন ও KV ক্যাশ | LLMScale",
    description:
      "যেকোনো Hugging Face মডেলের ভিজ্যুয়াল এক্স-রে: এর প্যারামিটার কোথায় যায় (এম্বেডিং / অ্যাটেনশন / বিশেষজ্ঞ), প্রতিটি প্রিসিশনে ওজনের আকার, আর্কিটেকচার, GQA ও KV ক্যাশের বৃদ্ধি — Hugging Face-এর লাইভ ডেটা থেকে।",
    ogTitle: "LLMScale — মডেলের গঠন",
    ogDescription:
      "যেকোনো LLM-এর ভিজ্যুয়াল এক্স-রে: প্যারামিটারের বণ্টন, প্রতিটি প্রিসিশনে ওজনের আকার, আর্কিটেকচার, GQA ও KV ক্যাশের বৃদ্ধি, Hugging Face-এর লাইভ ডেটা থেকে।",
  },
  "compare.html": {
    title: "LLM পাশাপাশি তুলনা — স্পেক ও কাজের উপযুক্ততা | LLMScale",
    description:
      "2–4টি Hugging Face LLM পাশাপাশি তুলনা করুন: প্যারামিটার, কনটেক্সট, কোয়ান্টাইজেশন, সক্ষমতা ও প্রতিটি কাজের উপযুক্ততা — দেখুন কোন মডেল কোন ব্যবহারের জন্য ভালো, Hugging Face-এর লাইভ ডেটা থেকে।",
    ogTitle: "LLMScale — মডেল তুলনা",
    ogDescription:
      "2–4টি LLM পাশাপাশি তুলনা করুন: স্পেসিফিকেশন, সক্ষমতা ও প্রতিটি কাজের উপযুক্ততা — কোন মডেল কোন ব্যবহারের জন্য ভালো।",
  },
  "decode.html": {
    title: "LLM নাম ডিকোডার — 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "যেকোনো LLM মডেলের নাম ডিকোড করুন: 70B, AWQ, GGUF, FP8, A3B, Instruct ও আরও অনেক কিছুর অর্থ কী — রঙে চিহ্নিত, ব্যাখ্যাসহ ও ইন্টারঅ্যাকটিভ।",
    ogTitle: "LLMScale — মডেলের নাম ডিকোডার",
    ogDescription:
      "একটি LLM মডেলের নামের প্রতিটি অংশের অর্থ কী? 70B · AWQ · GGUF · FP8 · A3B… রঙে চিহ্নিত ও ব্যাখ্যাসহ, ইন্টারঅ্যাকটিভভাবে।",
  },
  "vllm.html": {
    title: "vLLM serve প্যারামিটার — টিউন করা কমান্ড | LLMScale",
    description:
      "যেকোনো মডেলের জন্য টিউন করা vllm serve কমান্ড তৈরি করুন — থ্রুপুট, লেটেন্সি, নির্ভুলতা বা মেমরির জন্য ফ্ল্যাগ, সাথে টুল কলিং, দীর্ঘ কনটেক্সট ও কোয়ান্টাইজেশন, কপি করার মতো কমান্ডসহ।",
    ogTitle: "LLMScale — vLLM প্যারামিটার সহায়ক",
    ogDescription:
      "একটি মডেল ও ওয়ার্কলোড বেছে নিন এবং পারফরম্যান্স, নির্ভুলতা ও নির্ভরযোগ্যতার জন্য টিউন করা, কপি করার মতো একটি vllm serve কমান্ড পান।",
  },
  "config.html": {
    title: "LLM config.json-এর ব্যাখ্যা — সহজ ভাষায় | LLMScale",
    description:
      "যেকোনো Hugging Face মডেলের config.json সহজ ভাষায় পড়ুন: লেয়ার, অ্যাটেনশন হেড, GQA ও MLA, বিশেষজ্ঞ, কনটেক্সট ও RoPE স্কেলিং, কোয়ান্টাইজেশন — প্রতিটি উত্তর আসল ফাইলের লাইনের সাথে যুক্ত।",
    ogTitle: "LLMScale — config.json ডিকোডার",
    ogDescription:
      "একটি LLM-এর config.json-এর প্রতিটি ফিল্ডের অর্থ কী? মেমরি, কনটেক্সট, অ্যাটেনশন ও বিশেষজ্ঞ নিয়ে সহজ ভাষায় উত্তর, আসল ফাইলের সাথে যুক্ত।",
  },
  "serving.html": {
    title: "সার্ভিং: চ্যাট টেমপ্লেট, MTP, কোয়ান্টাইজেশন | LLMScale",
    description:
      "একটি Hugging Face মডেল রিপোজিটরি সেভাবে পড়ুন যেভাবে একটি ইনফারেন্স ইঞ্জিন পড়ে: চ্যাট টেমপ্লেট, টুল ও রিজনিং পার্সার, generation_config, টেনসরের নাম থেকে কোয়ান্টাইজেশন, এবং এর MTP লেয়ার সাথে আসে কি না — vLLM ও SGLang ফ্ল্যাগসহ।",
    ogTitle: "LLMScale — সার্ভিং সারসংক্ষেপ",
    ogDescription:
      "একটি মডেলের ফাইলগুলো সার্ভিং সম্পর্কে কী বলে: টুল ও রিজনিং পার্সার, স্যাম্পলিংয়ের ডিফল্ট, কোয়ান্টাইজেশন, MTP — এবং vLLM ও SGLang ফ্ল্যাগ।",
  },
  "plan.html": {
    title: "LLM ক্যাপাসিটি প্ল্যানিং — আপনার লোডের জন্য GPU | LLMScale",
    description:
      "একটি লোডের জন্য কতগুলো GPU লাগে: ইনপুটে requests per second, প্রম্পট ও উত্তরের দৈর্ঘ্য, এবং প্রথম টোকেন লেটেন্সি ও প্রতি টোকেনের সময়ের লক্ষ্য; আউটপুটে রেপ্লিকা, টেনসর প্যারালেলিজম ও GPU-র সংখ্যা, vLLM-এর নিজস্ব মেমরি এবং GPU-র ব্যান্ডউইথ ও tensor throughput থেকে হিসাব করা।",
    ogTitle: "LLMScale — ক্যাপাসিটি প্ল্যানিং",
    ogDescription:
      "ইনপুটে requests per second ও লেটেন্সির লক্ষ্য, আউটপুটে GPU: vLLM-এর জন্য রেপ্লিকা ও টেনসর প্যারালেলিজম, মেমরি, ব্যান্ডউইথ ও tensor throughput থেকে হিসাব করা।",
  },
  "gpu-compare.html": {
    title: "GPU স্পেক তুলনা — VRAM, ব্যান্ডউইথ, TFLOPS | LLMScale",
    description:
      "2–4টি GPU তাদের datasheet থেকে পাশাপাশি তুলনা করুন: আর্কিটেকচার, মেমরির ধরন ও ব্যান্ডউইথ, ডেন্স BF16, FP8 ও FP4 TFLOPS, পাওয়ার, NVLink ও ফর্ম ফ্যাক্টর — কনজিউমার ও ডেটা সেন্টার GPU, Apple Silicon ও AI PC।",
    ogTitle: "LLMScale — GPU তুলনা",
    ogDescription:
      "2–4টি GPU পাশাপাশি: আর্কিটেকচার, মেমরি ও ব্যান্ডউইথ, ডেন্স টেনসর TFLOPS, পাওয়ার ও সংযোগ, নির্মাতাদের datasheet থেকে।",
  },
  "learn.html": {
    title: "LLM 101 — একটি LLM কীভাবে কাজ করে, ছবিতে | LLMScale",
    description:
      "একটি ইন্টারঅ্যাকটিভ, অ্যানিমেটেড যাত্রা: একটি বড় ভাষা মডেল কীভাবে একটি বাক্যকে পরের শব্দে পরিণত করে — টোকেনাইজেশন, এম্বেডিং, অ্যাটেনশন, লেয়ার ও স্যাম্পলিং, একটি 3D নিউরাল নক্ষত্রমণ্ডল হিসেবে।",
    ogTitle: "LLM 101 — একটি LLM কীভাবে কাজ করে, ছবিতে",
    ogDescription:
      "একটি ইন্টারঅ্যাকটিভ যাত্রা: একটি ভাষা মডেল কীভাবে একটি বাক্যকে পরের শব্দে পরিণত করে — টোকেন, এম্বেডিং, অ্যাটেনশন, লেয়ার ও স্যাম্পলিং, 3D-তে।",
  },
};

const ru: Record<string, PageMeta> = {
  "index.html": {
    title: "Калькулятор VRAM для LLM — веса, KV-кэш, GPU | LLMScale",
    description:
      "Рассчитайте, сколько памяти GPU нужно LLM: веса модели, KV-кэш, контекстное окно и одновременные пользователи, — и посмотрите, на какие GPU она помещается. Конфигурация загружается с Hugging Face в реальном времени.",
    ogTitle: "LLMScale — калькулятор VRAM для LLM",
    ogDescription:
      "Сколько VRAM нужно вашей LLM? Веса + KV-кэш + контекст + одновременные запросы, с рекомендациями по GPU.",
  },
  "train.html": {
    title: "VRAM для дообучения — LoRA, QLoRA и полное | LLMScale",
    description:
      "Рассчитайте, сколько памяти GPU нужно для дообучения: LoRA, QLoRA или полного. Градиенты, состояние оптимизатора и активации, сохраняемые для обратного прохода, и подходящие GPU. Проверено по статьям о ZeRO и QLoRA.",
    ogTitle: "LLMScale — VRAM для дообучения",
    ogDescription:
      "Сколько VRAM требует дообучение? LoRA, QLoRA и полное дообучение с разбивкой на веса, градиенты, состояние оптимизатора и активации.",
  },
  "fit.html": {
    title: "Подбор LLM под задачу — подходит ли модель? | LLMScale",
    description:
      "Проверьте, подходит ли LLM для вашей задачи — чат, код, RAG, агенты, рассуждения, работа с изображениями, эмбеддинги: оценка по реальному размеру модели, контексту, типу дообучения и модальности. Данные Hugging Face в реальном времени.",
    ogTitle: "LLMScale — подбор модели под задачу",
    ogDescription:
      "Подходит ли эта LLM для вашей задачи? Прозрачная оценка по правилам для чата, кода, RAG, агентов, рассуждений, работы с изображениями и не только.",
  },
  "anatomy.html": {
    title: "Анатомия LLM — параметры, точность и KV-кэш | LLMScale",
    description:
      "Наглядный «рентген» любой модели с Hugging Face: куда уходят ее параметры (эмбеддинги / внимание / эксперты), размер весов при каждой точности, архитектура, GQA и рост KV-кэша — по актуальным данным Hugging Face.",
    ogTitle: "LLMScale — анатомия модели",
    ogDescription:
      "Наглядный «рентген» любой LLM: распределение параметров, размер весов при каждой точности, архитектура, GQA и рост KV-кэша по актуальным данным Hugging Face.",
  },
  "compare.html": {
    title: "Сравнение LLM — характеристики и задачи | LLMScale",
    description:
      "Сравните 2–4 LLM с Hugging Face рядом: параметры, контекст, квантование, возможности и соответствие задачам — какая модель лучше для какого применения, по актуальным данным Hugging Face.",
    ogTitle: "LLMScale — сравнение моделей",
    ogDescription:
      "Сравните 2–4 LLM рядом: характеристики, возможности и соответствие задачам — какая модель лучше для какого применения.",
  },
  "decode.html": {
    title: "Разбор названия LLM — 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Разберите название любой LLM: что означают 70B, AWQ, GGUF, FP8, A3B, Instruct и другие части — с цветовой разметкой, пояснениями и интерактивно.",
    ogTitle: "LLMScale — разбор названия модели",
    ogDescription:
      "Что означает каждая часть названия LLM? 70B · AWQ · GGUF · FP8 · A3B… с цветовой разметкой и пояснениями, интерактивно.",
  },
  "vllm.html": {
    title: "Параметры vllm serve — настроенная команда | LLMScale",
    description:
      "Сгенерируйте настроенную команду vllm serve для любой модели — флаги для пропускной способности, задержки, качества или экономии памяти, а также вызов инструментов, длинный контекст и квантование, с готовой командой для копирования.",
    ogTitle: "LLMScale — помощник по параметрам vLLM",
    ogDescription:
      "Выберите модель и нагрузку и получите готовую к копированию команду vllm serve, настроенную на производительность, качество и надежность.",
  },
  "config.html": {
    title: "Разбор config.json LLM — простым языком | LLMScale",
    description:
      "Прочитайте config.json любой модели с Hugging Face простым языком: слои, головы внимания, GQA и MLA, эксперты, контекст и масштабирование RoPE, квантование — каждый ответ привязан к строкам реального файла.",
    ogTitle: "LLMScale — разбор config.json",
    ogDescription:
      "Что означает каждое поле config.json у LLM? Ответы простым языком о памяти, контексте, внимании и экспертах с привязкой к реальному файлу.",
  },
  "serving.html": {
    title: "Шаблон чата, MTP и квантование для обслуживания | LLMScale",
    description:
      "Прочитайте репозиторий модели на Hugging Face так, как это делает движок инференса: шаблон чата, парсеры инструментов и рассуждений, generation_config, квантование по именам тензоров и наличие слоев MTP — с флагами vLLM и SGLang.",
    ogTitle: "LLMScale — сводка по обслуживанию",
    ogDescription:
      "Что файлы модели говорят о ее обслуживании: парсеры инструментов и рассуждений, параметры сэмплирования по умолчанию, квантование, MTP — и флаги vLLM и SGLang.",
  },
  "plan.html": {
    title: "Планирование емкости LLM — GPU под нагрузку | LLMScale",
    description:
      "Сколько GPU нужно для нагрузки: на входе — запросы в секунду, длина промпта и ответа, целевые время до первого токена и время на токен; на выходе — реплики, тензорный параллелизм и число GPU, по собственному расчету памяти vLLM, пропускной способности памяти GPU и производительности тензорных ядер.",
    ogTitle: "LLMScale — планирование емкости",
    ogDescription:
      "На входе — запросы в секунду и целевые задержки, на выходе — GPU: реплики и тензорный параллелизм для vLLM с расчетом по памяти, пропускной способности и производительности тензорных ядер.",
  },
  "gpu-compare.html": {
    title: "Сравнение характеристик GPU: VRAM и TFLOPS | LLMScale",
    description:
      "Сравните 2–4 GPU рядом по спецификациям производителей: архитектура, тип и пропускная способность памяти, TFLOPS в BF16, FP8 и FP4 без sparsity, энергопотребление, NVLink и form factor — потребительские видеокарты и видеокарты для дата-центров, Apple Silicon и ИИ-ПК.",
    ogTitle: "LLMScale — сравнение GPU",
    ogDescription:
      "2–4 GPU рядом: архитектура, память и пропускная способность, TFLOPS тензорных ядер без sparsity, энергопотребление и интерконнекты — по спецификациям производителей.",
  },
  "learn.html": {
    title: "LLM 101 — как работает LLM, наглядно | LLMScale",
    description:
      "Интерактивная анимированная экскурсия по тому, как большая языковая модель превращает предложение в следующее слово: токенизация, эмбеддинги, внимание, слои и сэмплирование в виде нейронного 3D-созвездия.",
    ogTitle: "LLM 101 — как работает LLM, наглядно",
    ogDescription:
      "Интерактивная экскурсия по тому, как языковая модель превращает предложение в следующее слово: токены, эмбеддинги, внимание, слои и сэмплирование в 3D.",
  },
};

const de: Record<string, PageMeta> = {
  "index.html": {
    title: "LLM-VRAM-Rechner – Gewichte, KV-Cache und GPUs | LLMScale",
    description:
      "Schätzen Sie, wie viel GPU-Speicher ein LLM braucht: Modellgewichte, KV-Cache, Kontextfenster und gleichzeitige Benutzer – und sehen Sie, auf welche GPUs es passt. Liest die Konfiguration live von Hugging Face.",
    ogTitle: "LLMScale — LLM-VRAM-Rechner",
    ogDescription:
      "Wie viel VRAM braucht Ihr LLM? Gewichte + KV-Cache + Kontext + gleichzeitige Benutzer, mit GPU-Empfehlungen.",
  },
  "train.html": {
    title: "VRAM für LoRA, QLoRA und volle Feinabstimmung | LLMScale",
    description:
      "Berechnen Sie, wie viel GPU-Speicher eine Feinabstimmung braucht: LoRA, QLoRA oder vollständig. Gradienten, Optimiererzustand und die für den Rückwärtsdurchlauf gehaltenen Aktivierungen, mit passenden GPUs. Abgeglichen mit den Papern zu ZeRO und QLoRA.",
    ogTitle: "LLMScale — VRAM für die Feinabstimmung",
    ogDescription:
      "Wie viel VRAM kostet eine Feinabstimmung? LoRA, QLoRA und vollständige Feinabstimmung, aufgeschlüsselt in Gewichte, Gradienten, Optimiererzustand und Aktivierungen.",
  },
  "fit.html": {
    title: "LLM-Aufgabeneignung – das richtige Modell? | LLMScale",
    description:
      "Prüfen Sie, ob ein LLM zu Ihrer Aufgabe passt – Chat, Code, RAG, Agenten, Reasoning, Vision, Einbettungen –, bewertet nach tatsächlicher Größe, Kontext, Feinabstimmung und Modalität des Modells. Live-Daten von Hugging Face.",
    ogTitle: "LLMScale — Eignung Modell ↔ Aufgabe",
    ogDescription:
      "Passt dieses LLM zu Ihrer Aufgabe? Transparente, regelbasierte Eignungsbewertung für Chat, Code, RAG, Agenten, Reasoning, Vision und mehr.",
  },
  "anatomy.html": {
    title: "LLM-Anatomie – Parameter, Genauigkeit, KV-Cache | LLMScale",
    description:
      "Ein visuelles Röntgenbild jedes Hugging Face-Modells: wohin seine Parameter gehen (Einbettungen / Aufmerksamkeit / Experten), wie groß seine Gewichte in jeder Genauigkeit sind, Architektur, GQA und das Wachstum des KV-Caches – aus Live-Daten von Hugging Face.",
    ogTitle: "LLMScale — Modellanatomie",
    ogDescription:
      "Ein visuelles Röntgenbild jedes LLM: Verteilung der Parameter, Größe der Gewichte in jeder Genauigkeit, Architektur, GQA und Wachstum des KV-Caches, aus Live-Daten von Hugging Face.",
  },
  "compare.html": {
    title: "LLMs vergleichen – technische Daten und Eignung | LLMScale",
    description:
      "Vergleichen Sie 2–4 LLMs von Hugging Face nebeneinander: Parameter, Kontext, Quantisierung, Fähigkeiten und Eignung je Aufgabe – sehen Sie, welches Modell sich wofür besser eignet, aus Live-Daten von Hugging Face.",
    ogTitle: "LLMScale — Modelle vergleichen",
    ogDescription:
      "Vergleichen Sie 2–4 LLMs nebeneinander: technische Daten, Fähigkeiten und Eignung je Aufgabe – welches Modell sich wofür besser eignet.",
  },
  "decode.html": {
    title: "LLM-Namen-Decoder – 70B, A3B, AWQ, GGUF, FP8 | LLMScale",
    description:
      "Entschlüsseln Sie jeden LLM-Modellnamen: was 70B, AWQ, GGUF, FP8, A3B, Instruct und mehr bedeuten – farbcodiert, erklärt und interaktiv.",
    ogTitle: "LLMScale — Modellnamen-Decoder",
    ogDescription:
      "Was bedeutet jeder Teil eines LLM-Modellnamens? 70B · AWQ · GGUF · FP8 · A3B… farbcodiert und interaktiv erklärt.",
  },
  "vllm.html": {
    title: "vLLM-Serve-Parameter – optimierter Befehl | LLMScale",
    description:
      "Erzeugen Sie einen abgestimmten vllm serve-Befehl für jedes Modell – Flags für Durchsatz, Latenz, Genauigkeit oder Speicher, dazu Toolaufrufe, langer Kontext und Quantisierung, mit einem kopierfertigen Befehl.",
    ogTitle: "LLMScale — vLLM-Einstellungen",
    ogDescription:
      "Wählen Sie Modell und Arbeitslast und erhalten Sie einen abgestimmten, kopierfertigen vllm serve-Befehl, optimiert für Leistung, Genauigkeit und Zuverlässigkeit.",
  },
  "config.html": {
    title: "config.json eines LLM verständlich erklärt | LLMScale",
    description:
      "Lesen Sie die config.json jedes Hugging Face-Modells in verständlicher Sprache: Schichten, Aufmerksamkeitsköpfe, GQA und MLA, Experten, Kontext und RoPE-Skalierung, Quantisierung – jede Antwort verknüpft mit den Zeilen der echten Datei.",
    ogTitle: "LLMScale — Config-Decoder",
    ogDescription:
      "Was bedeutet jedes Feld in der config.json eines LLM? Antworten in verständlicher Sprache zu Speicher, Kontext, Aufmerksamkeit und Experten, verknüpft mit der echten Datei.",
  },
  "serving.html": {
    title: "Bereitstellung: Chat-Template, MTP, Quantisierung | LLMScale",
    description:
      "Lesen Sie das Repository eines Hugging Face-Modells so, wie eine Inferenz-Engine es liest: Chat-Template, Tool- und Reasoning-Parser, generation_config, Quantisierung anhand der Tensornamen und ob seine MTP-Schichten mitgeliefert werden – mit den Flags für vLLM und SGLang.",
    ogTitle: "LLMScale — Bereitstellungsübersicht",
    ogDescription:
      "Was die Dateien eines Modells über seine Bereitstellung verraten: Tool- und Reasoning-Parser, Sampling-Standardwerte, Quantisierung, MTP – und die Flags für vLLM und SGLang.",
  },
  "plan.html": {
    title: "LLM-Kapazitätsplanung – GPUs für Ihre Last | LLMScale",
    description:
      "Wie viele GPUs eine Last braucht: Anfragen pro Sekunde, Prompt- und Antwortlängen sowie Ziele für Time to First Token und Zeit pro Token als Eingabe; Replikate, Tensor-Parallelität und GPU-Anzahl als Ergebnis, berechnet aus dem Speicherbedarf, wie vLLM ihn ansetzt, sowie aus Bandbreite und Tensor-Core-Leistung der GPUs.",
    ogTitle: "LLMScale — Kapazitätsplanung",
    ogDescription:
      "Aus Anfragen pro Sekunde und Latenzzielen werden GPUs: Replikate und Tensor-Parallelität für vLLM, dimensioniert nach Speicher, Bandbreite und Tensor-Core-Leistung.",
  },
  "gpu-compare.html": {
    title: "GPU-Vergleich – VRAM, Bandbreite, TFLOPS | LLMScale",
    description:
      "Vergleichen Sie 2–4 GPUs nebeneinander anhand ihrer Datenblätter: Architektur, Speichertyp und -bandbreite, TFLOPS ohne Sparsity in BF16, FP8 und FP4, Leistungsaufnahme, NVLink und Formfaktor – Consumer- und Rechenzentrumskarten, Apple Silicon und KI-PCs.",
    ogTitle: "LLMScale — GPU-Vergleich",
    ogDescription:
      "2–4 GPUs nebeneinander: Architektur, Speicher und Bandbreite, Tensor-TFLOPS ohne Sparsity, Leistungsaufnahme und Verbindungen, aus den Datenblättern der Hersteller.",
  },
  "learn.html": {
    title: "LLM 101 – So funktioniert ein LLM, visualisiert | LLMScale",
    description:
      "Ein interaktiver, animierter Rundgang dazu, wie ein Large Language Model aus einem Satz das nächste Wort macht – Tokenisierung, Einbettungen, Aufmerksamkeit, Schichten und Sampling, als neuronale 3D-Konstellation.",
    ogTitle: "LLM 101 — So funktioniert ein LLM, visualisiert",
    ogDescription:
      "Ein interaktiver Rundgang dazu, wie ein Sprachmodell aus einem Satz das nächste Wort macht – Token, Einbettungen, Aufmerksamkeit, Schichten und Sampling, in 3D.",
  },
};

const ja: Record<string, PageMeta> = {
  "index.html": {
    title: "LLM の VRAM 計算ツール：重み、KV キャッシュ、収まる GPU | LLMScale",
    description:
      "LLM に必要な GPU メモリを見積もります。モデルの重み、KV キャッシュ、コンテキスト ウィンドウ、同時ユーザー数から計算し、収まる GPU を確認できます。設定は Hugging Face から直接読み込みます。",
    ogTitle: "LLMScale — LLM の VRAM 計算ツール",
    ogDescription:
      "お使いの LLM に必要な VRAM は？重み + KV キャッシュ + コンテキスト + 同時実行数から計算し、推奨される GPU も示します。",
  },
  "train.html": {
    title: "ファインチューニングに必要な VRAM：LoRA、QLoRA、フル | LLMScale",
    description:
      "ファインチューニングに必要な GPU メモリを計算します（LoRA、QLoRA、フル ファインチューニング）。勾配、オプティマイザーの状態、バックワードパスのために保持するアクティベーションを含め、収まる GPU も示します。ZeRO と QLoRA の論文の値で検証済みです。",
    ogTitle: "LLMScale — ファインチューニングに必要な VRAM",
    ogDescription:
      "ファインチューニングにはどれだけの VRAM が必要？LoRA、QLoRA、フル ファインチューニングを、重み、勾配、オプティマイザーの状態、アクティベーションに分けて示します。",
  },
  "fit.html": {
    title: "LLM のタスク適合性：用途に合うモデルかを確認 | LLMScale",
    description:
      "LLM がタスク（チャット、コード、RAG、エージェント、リーズニング、ビジョン、埋め込み）に合うかを確認できます。モデルの実際のサイズ、コンテキスト、チューニング、モダリティからスコアを算出します。データは Hugging Face から直接取得します。",
    ogTitle: "LLMScale — モデル ↔ タスクの適合性",
    ogDescription:
      "この LLM はタスクに合っている？チャット、コード、RAG、エージェント、リーズニング、ビジョンなどについて、ルールに基づく透明な適合性スコアを示します。",
  },
  "anatomy.html": {
    title: "LLM の構造：パラメータ、精度、KV キャッシュ | LLMScale",
    description:
      "Hugging Face の任意のモデルを X 線写真のように可視化します。パラメータの内訳（埋め込み / アテンション / エキスパート）、精度ごとの重みのサイズ、アーキテクチャ、GQA、KV キャッシュの増え方を、Hugging Face から直接取得したデータで示します。",
    ogTitle: "LLMScale — モデルの構造",
    ogDescription:
      "任意の LLM を X 線写真のように可視化します。パラメータの分布、精度ごとの重みのサイズ、アーキテクチャ、GQA、KV キャッシュの増え方を、Hugging Face から直接取得したデータで示します。",
  },
  "compare.html": {
    title: "LLM を並べて比較：仕様とタスク適合性 | LLMScale",
    description:
      "Hugging Face の LLM を 2～4 個並べて比較できます。パラメータ数、コンテキスト、量子化、機能、タスクごとの適合性から、どのモデルがどの用途に向いているかを確認できます。データは Hugging Face から直接取得します。",
    ogTitle: "LLMScale — モデル比較",
    ogDescription:
      "2～4 個の LLM を並べて比較できます。仕様、機能、タスクごとの適合性から、どのモデルがどの用途に向いているかがわかります。",
  },
  "decode.html": {
    title: "LLM のモデル名の読み方：70B、A3B、AWQ、GGUF、FP8 | LLMScale",
    description:
      "LLM のモデル名を読み解きます。70B、AWQ、GGUF、FP8、A3B、Instruct などの意味を、色分けとインタラクティブな解説で示します。",
    ogTitle: "LLMScale — モデル名の読み方",
    ogDescription:
      "LLM のモデル名の各部分は何を意味する？70B · AWQ · GGUF · FP8 · A3B などを色分けし、インタラクティブに解説します。",
  },
  "vllm.html": {
    title: "vLLM serve のパラメータ：チューニング済みコマンド | LLMScale",
    description:
      "任意のモデル向けに、チューニングした vllm serve コマンドを生成します。スループット、レイテンシ、正確性、メモリ向けのフラグに加え、ツール呼び出し、長いコンテキスト、量子化にも対応し、そのままコピーできるコマンドを出力します。",
    ogTitle: "LLMScale — vLLM パラメータ",
    ogDescription:
      "モデルとワークロードを選ぶと、パフォーマンス、正確性、信頼性に合わせてチューニングした、そのままコピーできる vllm serve コマンドを生成します。",
  },
  "config.html": {
    title: "LLM の config.json をわかりやすく解説 | LLMScale",
    description:
      "Hugging Face の任意のモデルの config.json を、わかりやすい言葉で読み解きます。層、アテンション ヘッド、GQA と MLA、エキスパート、コンテキストと RoPE スケーリング、量子化について、各回答を実際のファイルの該当行と対応付けて示します。",
    ogTitle: "LLMScale — config.json の解説",
    ogDescription:
      "LLM の config.json の各フィールドは何を意味する？メモリ、コンテキスト、アテンション、エキスパートについて、実際のファイルと対応付けてわかりやすく答えます。",
  },
  "serving.html": {
    title: "サービングの概要：チャットテンプレート、MTP、量子化 | LLMScale",
    description:
      "推論エンジンと同じ視点で、Hugging Face のモデルのリポジトリを読み解きます。チャットテンプレート、ツール呼び出し用・リーズニング用のパーサー、generation_config、テンソル名から判別した量子化、MTP 層が含まれているかどうかを示し、vLLM と SGLang のフラグも提示します。",
    ogTitle: "LLMScale — サービングの概要",
    ogDescription:
      "モデルのファイルからわかるサービングの要点として、ツール呼び出し用・リーズニング用のパーサー、サンプリングのデフォルト値、量子化、MTP、そして対応する vLLM と SGLang のフラグを示します。",
  },
  "plan.html": {
    title: "LLM の容量計画：ワークロードに必要な GPU 数 | LLMScale",
    description:
      "ワークロードに必要な GPU の数を求めます。1 秒あたりのリクエスト数、プロンプトと応答の長さ、最初のトークンまでの時間とトークンあたりのレイテンシの目標を入力すると、レプリカ数、テンソル並列、GPU 数を出力します。計算は vLLM 自体のメモリ使用量と、GPU のメモリ帯域幅および Tensor コアのスループットに基づきます。",
    ogTitle: "LLMScale — 容量計画",
    ogDescription:
      "1 秒あたりのリクエスト数とレイテンシの目標を入力すると、必要な GPU を出力します。vLLM のレプリカ数とテンソル並列を、メモリ、帯域幅、Tensor コアのスループットから求めます。",
  },
  "gpu-compare.html": {
    title: "GPU の仕様比較：VRAM、帯域幅、TFLOPS | LLMScale",
    description:
      "2～4 種類の GPU をデータシートに基づいて並べて比較できます。アーキテクチャ、メモリの種類と帯域幅、スパース性なしの BF16、FP8、FP4 TFLOPS、消費電力、NVLink、フォーム ファクターを掲載。コンシューマー向けとデータセンター向けの GPU、Apple Silicon、AI PC に対応しています。",
    ogTitle: "LLMScale — GPU 比較",
    ogDescription:
      "2～4 種類の GPU を並べて比較できます。アーキテクチャ、メモリと帯域幅、スパース性なしの Tensor コア TFLOPS、消費電力、インターコネクトを、メーカーのデータシートに基づいて示します。",
  },
  "learn.html": {
    title: "LLM 入門：LLM の仕組みを図解 | LLMScale",
    description:
      "大規模言語モデルが文から次の単語を導き出すまでを、インタラクティブなアニメーションでたどります。トークン化、埋め込み、アテンション、層、サンプリングを、3D で描いたニューロンの星座として表現しています。",
    ogTitle: "LLM 入門 — LLM の仕組みを図解",
    ogDescription:
      "言語モデルが文から次の単語を導き出すまでを、インタラクティブにたどります。トークン、埋め込み、アテンション、層、サンプリングを 3D で表現しています。",
  },
};

export const PAGE_META: Record<Exclude<Lang, typeof DEFAULT_LANG>, Record<string, PageMeta>> = { tr, zh, hi, es, fr, pt, id, bn, ru, de, ja };

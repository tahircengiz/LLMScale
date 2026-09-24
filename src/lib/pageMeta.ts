// The Turkish head of every page, for the /tr/ copies scripts/prerender.ts builds.
//
// The English head lives in each .html entry, as it always has. The Turkish one
// cannot: /tr/ pages exist only in the build. Keyed by entry file; the prerender
// refuses to build if an entry has no row here, and scripts/test-invariants.ts
// checks the same. Titles stay within 60 characters so results do not cut them.

export interface PageMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export const TR_META: Record<string, PageMeta> = {
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
  "learn.html": {
    title: "LLM 101 — Bir LLM Nasıl Çalışır, Görsel Anlatım | LLMScale",
    description:
      "Büyük bir dil modelinin bir cümleyi nasıl sıradaki kelimeye dönüştürdüğünü anlatan etkileşimli, animasyonlu bir yolculuk — tokenization, embedding, attention, katmanlar ve örnekleme, 3B bir nöral takımyıldız olarak.",
    ogTitle: "LLM 101 — bir LLM nasıl çalışır, görsel anlatım",
    ogDescription:
      "Bir dil modelinin bir cümleyi nasıl sıradaki kelimeye dönüştürdüğünü anlatan etkileşimli yolculuk — token, embedding, attention, katmanlar ve örnekleme, 3B olarak.",
  },
};

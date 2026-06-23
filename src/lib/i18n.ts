import { createContext, useContext } from "react";

export type Lang = "en" | "tr";

type Dict = Record<string, string>;

const en: Dict = {
  "header.badge": "live Hugging Face data",
  "header.subtitle":
    "How much GPU memory does a model really need? Weights and KV cache scale with your {ctx} and {users}. Pick a model, tune the workload, and see which GPUs fit.",
  "header.subtitle.ctx": "context window",
  "header.subtitle.users": "concurrent users",
  "header.share": "Share this estimate",
  "header.shareCopied": "Link copied ✓",
  "results.empty": "Pick a model to see the VRAM breakdown.",

  "model.step": "Choose a model",
  "model.tab.search": "Search Hugging Face",
  "model.tab.presets": "Presets",
  "model.tab.custom": "Custom",
  "model.search.placeholder": "e.g. Qwen/Qwen2.5-7B-Instruct or just 'llama'",
  "model.search.searching": "searching…",
  "model.search.loading": "Loading {id}…",
  "model.search.error": "Failed to load model",
  "model.badge.config": "live config.json",
  "model.badge.base": "base model config",
  "model.badge.bundled": "built-in DB",
  "model.badge.manual": "manual",
  "model.params": "{n} params",
  "model.heads": "heads",

  "field.params": "Params",
  "field.layers": "Layers",
  "field.hidden": "Hidden size",
  "field.attnHeads": "Attn heads",
  "field.kvHeads": "KV heads",
  "field.headDim": "Head dim",
  "common.optional": "optional",
  "common.gqa": "GQA",

  "warning.gatedBundled": "Gated model — architecture loaded from the built-in database.",
  "warning.gatedUnknown":
    "Gated model and not in the built-in database — enter the architecture manually below.",
  "warning.configFailed":
    "Could not read this model's config — enter the architecture manually below.",
  "warning.archFromBase": "Architecture loaded from the base model (this repo has no config of its own).",

  "controls.step": "Precision & workload",
  "controls.weightQuant": "Weight quantization",
  "controls.kvPrecision": "KV cache precision",
  "controls.context": "Context window (tokens / sequence)",
  "controls.contextMax": "model max {n}",
  "controls.tok": "tok",
  "controls.users": "Concurrent users / requests",
  "controls.usersHint": "batch size held in cache",
  "controls.overhead": "Overhead (activations + fragmentation)",

  "results.title": "Estimated VRAM",
  "results.totalRequired": "total required",
  "seg.weights": "Weights",
  "seg.kv": "KV cache",
  "seg.act": "Activations",
  "seg.cuda": "CUDA/overhead",
  "stat.weights": "Weights",
  "stat.kvTotal": "KV cache (total)",
  "stat.kvSeq": "KV / sequence",
  "stat.kvToken": "KV / token",
  "stat.headDim": "head dim {n}",

  "gpu.step": "GPU fit",
  "gpu.usableHint": "assumes {p}% of VRAM usable",
  "gpu.fits": "fits ✓",
  "gpu.needs": "needs {n}× GPUs",
  "gpu.usage": "{x} / {y} GB ({p}% of usable)",
  "gpu.maxUsers": "Max concurrent users",
  "gpu.atCtx": "at {x} ctx",
  "gpu.maxContext": "Max context (1 user)",
  "gpu.tokens": "tokens",
  "gpu.weightsNoFit": "weights don't fit",
  "gpu.mig": "MIG profile",
  "gpu.migOff": "Full GPU (no MIG)",
  "gpu.cardFits": "fits · {p}%",
  "gpu.cardNeeds": "{n}× needed",
  "cat.consumer": "Consumer",
  "cat.workstation": "Workstation",
  "cat.datacenter": "Data center",
  "cat.apple": "Apple",

  "method.summary": "How the numbers are calculated",
  "method.weightsTerm": "Weights",
  "method.weightsText":
    "= parameters × bytes/param (FP16/BF16 = 2, FP8/INT8 = 1, INT4 = 0.5). For Mixture-of-Experts models, all experts are loaded, so total params are used — not the active subset.",
  "method.kvTerm": "KV cache",
  "method.kvText":
    "= 2 × layers × kv_heads × head_dim × bytes × context × concurrency. Grouped-Query Attention (kv_heads < attn_heads) shrinks this dramatically — it's read from each model's config.",
  "method.overheadTerm": "Overhead",
  "method.overheadText":
    "adds activations + fragmentation (a configurable %) plus a fixed CUDA context allowance. GPU fit assumes ~95% of nominal VRAM is usable.",
  "method.disclaimer":
    "Estimates are for planning, not a guarantee. Real usage varies by serving engine (vLLM, TGI, llama.cpp), paged-attention efficiency, and special attention variants (e.g. MLA in DeepSeek), which this model does not yet capture.",

  "footer.builtBy": "Built by",
  "footer.privacy": "Runs entirely in your browser — no data leaves your machine.",
  "link.github": "GitHub",
  "link.linkedin": "LinkedIn",
  "link.hf": "Hugging Face",

  "nav.sizing": "VRAM Sizing",
  "nav.fit": "Task Fit",

  "fit.title": "Model ↔ Task Fit",
  "fit.subtitle":
    "Will this model actually do the job? Pick a model and your use-case — LLMScale scores the fit from the model's real characteristics (size, context, tuning, modality) and explains every criterion.",
  "fit.pickTask": "Choose your task",
  "fit.scoreLabel": "Fit score",
  "fit.empty": "Pick a model and a task to check the fit.",
  "fit.criteriaTitle": "Why this score",

  "fit.verdict.great": "Great fit",
  "fit.verdict.good": "Workable",
  "fit.verdict.weak": "Weak fit",
  "fit.verdict.poor": "Poor fit",

  "fit.task.chat": "Chatbot / assistant",
  "fit.task.code": "Code generation",
  "fit.task.rag": "RAG / doc Q&A",
  "fit.task.summarize": "Long-doc summarize",
  "fit.task.agent": "Agents / tool use",
  "fit.task.reasoning": "Reasoning & math",
  "fit.task.multilingual": "Multilingual",
  "fit.task.vision": "Vision / multimodal",
  "fit.task.embeddings": "Embeddings / search",
  "fit.task.edge": "On-device / edge",
  "fit.task.throughput": "High-throughput serving",

  "fit.crit.modality": "Model type",
  "fit.crit.instruct": "Instruction tuning",
  "fit.crit.size": "Model size",
  "fit.crit.context": "Context window",
  "fit.crit.code": "Code ability",
  "fit.crit.reasoning": "Reasoning",
  "fit.crit.multilingual": "Multilingual",
  "fit.crit.efficiency": "Serving efficiency",

  "fit.msg.modalityGen": "Generative text model",
  "fit.msg.modalityEmbedding": "This is an embedding model — not built for generation",
  "fit.msg.modalityReranker": "This is a reranker/classifier — not built for generation",
  "fit.msg.modalityUnknownGen": "Couldn't confirm this is a generative model",
  "fit.msg.instructYes": "Chat / instruction-tuned",
  "fit.msg.instructBase": "Base model — prefer an -Instruct variant",
  "fit.msg.instructUnknown": "Instruction tuning unclear",
  "fit.msg.size": "{params} (recommended ≥ {ideal}B)",
  "fit.msg.context": "{ctx} tokens (recommended ≥ {ideal}k)",
  "fit.msg.contextUnknown": "Context length unknown",
  "fit.msg.codeYes": "Code-specialized",
  "fit.msg.codeNo": "Not code-specialized",
  "fit.msg.reasonYes": "Reasoning / math-tuned",
  "fit.msg.reasonNo": "Not reasoning-tuned — leans on raw scale",
  "fit.msg.multiYes": "Multilingual",
  "fit.msg.multiNo": "Looks English-centric",
  "fit.msg.visionYes": "Multimodal (vision) model",
  "fit.msg.visionNo": "No vision capability — pick a -VL / multimodal model",
  "fit.msg.embedYes": "Embedding model",
  "fit.msg.embedNo": "Not an embedding model — use e.g. BGE, E5, Qwen3-Embedding",
  "fit.msg.edgeSize": "{params} — smaller runs better on device",
  "fit.msg.effMoE": "MoE — low active compute, strong throughput",
  "fit.msg.effDense": "{params} dense — heavier compute per token",

  "nav.vllm": "vLLM Params",
  "vllm.subtitle":
    "Generate a tuned `vllm serve` command. Pick a model, what you're optimizing for, and your workload — LLMScale recommends flags for the best performance, accuracy and reliability, with a copyable command.",
  "vllm.pickPriority": "Optimize for",
  "vllm.pickTask": "Workload",
  "vllm.gpuCount": "GPU count",
  "vllm.maxlen": "Max context (max-model-len)",
  "vllm.commandTitle": "Recommended command",
  "vllm.copy": "Copy",
  "vllm.copied": "Copied ✓",
  "vllm.flagsTitle": "What each flag does",
  "vllm.warningsTitle": "Notes & warnings",
  "vllm.empty": "Pick a model to generate vLLM parameters.",

  "vllm.prio.balanced": "Balanced",
  "vllm.prio.throughput": "Throughput",
  "vllm.prio.latency": "Low latency",
  "vllm.prio.accuracy": "Max accuracy",
  "vllm.prio.memory": "Memory-tight",

  "vllm.task.chat": "Chat / assistant",
  "vllm.task.rag": "RAG / long context",
  "vllm.task.code": "Code",
  "vllm.task.tool": "Tool use / agents",
  "vllm.task.structured": "Structured JSON",
  "vllm.task.vision": "Vision / multimodal",
  "vllm.task.reasoning": "Reasoning",

  "vllm.r.maxlen": "Caps the context window — frees KV cache vs the model's full max.",
  "vllm.r.tp": "Shards the model across GPUs (tensor parallelism).",
  "vllm.r.ep": "Expert parallelism for MoE layers across GPUs.",
  "vllm.r.gpuutil": "Share of VRAM vLLM may use for weights + KV cache.",
  "vllm.r.kvfp8": "FP8 KV cache ~halves cache memory — fits more / longer sequences.",
  "vllm.r.maxbatched": "Large prefill batch maximizes throughput.",
  "vllm.r.maxbatchedLat": "Smaller prefill batch lowers inter-token latency.",
  "vllm.r.maxseqs": "Allow many concurrent sequences for throughput.",
  "vllm.r.maxseqsLat": "Fewer concurrent sequences keeps latency low.",
  "vllm.r.maxseqsMem": "Cap concurrency to limit KV cache memory.",
  "vllm.r.chunked": "Chunked prefill stops long prompts from stalling decode.",
  "vllm.r.prefix": "Prefix caching reuses shared system / context prefixes.",
  "vllm.r.tool": "Enables automatic tool / function calling.",
  "vllm.r.toolparser": "Parser matching this model family ({parser}).",
  "vllm.r.guided": "xgrammar backend for fast, reliable JSON / grammar output.",
  "vllm.r.mm": "Limit images per prompt for multimodal input.",
  "vllm.r.dtype": "Full BF16 weights for best accuracy.",
  "vllm.r.seed": "Fixed seed for reproducible, reliable outputs.",

  "vllm.w.ctxcap": "Requested context exceeds the model max ({max}) — vLLM will reject it or need rope scaling.",
  "vllm.w.fp8acc": "FP8 KV cache can hurt accuracy on long-context tasks — validate before production.",
  "vllm.w.kvfull": "KV cache kept in full precision (auto) for maximum accuracy.",
  "vllm.w.template": "This parser usually needs a model-specific --chat-template (see vLLM examples/).",
  "vllm.w.parserUnknown": "Couldn't detect the tool-call parser — set --tool-call-parser to match your model.",
  "vllm.w.trust": "Many multimodal models also need --trust-remote-code.",
  "vllm.w.quant": "Pre-quantized model ({q}) — vLLM auto-detects it; no --quantization needed.",
  "vllm.w.gguf": "GGUF support in vLLM is experimental — a safetensors/native repo is recommended.",
  "vllm.w.fit": "~{need} GiB needed vs ~{have} GiB available — add GPUs (≈{gpus}), quantize, shorten context, or use FP8 KV.",
  "vllm.w.mig": "MIG = one isolated GPU slice; tensor-parallel across MIG isn't supported. Pin the instance with CUDA_VISIBLE_DEVICES=MIG-…",
};

const tr: Dict = {
  "header.badge": "canlı Hugging Face verisi",
  "header.subtitle":
    "Bir model gerçekte ne kadar GPU belleği ister? Ağırlıklar ve KV cache, {ctx} ve {users} ile birlikte ölçeklenir. Bir model seç, yükü ayarla ve hangi GPU'ların yettiğini gör.",
  "header.subtitle.ctx": "context penceresi",
  "header.subtitle.users": "eşzamanlı kullanıcı",
  "header.share": "Bu tahmini paylaş",
  "header.shareCopied": "Link kopyalandı ✓",
  "results.empty": "VRAM kırılımını görmek için bir model seç.",

  "model.step": "Model seç",
  "model.tab.search": "Hugging Face'te ara",
  "model.tab.presets": "Hazır modeller",
  "model.tab.custom": "Manuel",
  "model.search.placeholder": "ör. Qwen/Qwen2.5-7B-Instruct ya da sadece 'llama'",
  "model.search.searching": "aranıyor…",
  "model.search.loading": "{id} yükleniyor…",
  "model.search.error": "Model yüklenemedi",
  "model.badge.config": "canlı config.json",
  "model.badge.base": "base model config",
  "model.badge.bundled": "gömülü DB",
  "model.badge.manual": "manuel",
  "model.params": "{n} parametre",
  "model.heads": "head",

  "field.params": "Parametre",
  "field.layers": "Katman",
  "field.hidden": "Hidden size",
  "field.attnHeads": "Attn head",
  "field.kvHeads": "KV head",
  "field.headDim": "Head dim",
  "common.optional": "opsiyonel",
  "common.gqa": "GQA",

  "warning.gatedBundled": "Gated model — mimari gömülü veri tabanından yüklendi.",
  "warning.gatedUnknown":
    "Gated model ve gömülü veri tabanında yok — mimariyi aşağıdan manuel gir.",
  "warning.configFailed": "Modelin config'i okunamadı — mimariyi aşağıdan manuel gir.",
  "warning.archFromBase": "Mimari base model'den yüklendi (bu repo'nun kendi config'i yok).",

  "controls.step": "Hassasiyet & yük",
  "controls.weightQuant": "Ağırlık quantization",
  "controls.kvPrecision": "KV cache hassasiyeti",
  "controls.context": "Context penceresi (token / dizi)",
  "controls.contextMax": "model maks {n}",
  "controls.tok": "token",
  "controls.users": "Eşzamanlı kullanıcı / istek",
  "controls.usersHint": "cache'te tutulan batch",
  "controls.overhead": "Ek yük (aktivasyon + parçalanma)",

  "results.title": "Tahmini VRAM",
  "results.totalRequired": "toplam gerekli",
  "seg.weights": "Ağırlıklar",
  "seg.kv": "KV cache",
  "seg.act": "Aktivasyon",
  "seg.cuda": "CUDA/ek yük",
  "stat.weights": "Ağırlıklar",
  "stat.kvTotal": "KV cache (toplam)",
  "stat.kvSeq": "KV / dizi",
  "stat.kvToken": "KV / token",
  "stat.headDim": "head dim {n}",

  "gpu.step": "GPU uyumu",
  "gpu.usableHint": "VRAM'in %{p}'i kullanılabilir varsayılır",
  "gpu.fits": "sığar ✓",
  "gpu.needs": "{n}× GPU gerekir",
  "gpu.usage": "{x} / {y} GB (kullanılabilirin %{p}'i)",
  "gpu.maxUsers": "Maks eşzamanlı kullanıcı",
  "gpu.atCtx": "{x} ctx'te",
  "gpu.maxContext": "Maks context (1 kullanıcı)",
  "gpu.tokens": "token",
  "gpu.weightsNoFit": "ağırlıklar sığmıyor",
  "gpu.mig": "MIG profili",
  "gpu.migOff": "Tam GPU (MIG yok)",
  "gpu.cardFits": "sığar · %{p}",
  "gpu.cardNeeds": "{n}× gerekir",
  "cat.consumer": "Tüketici",
  "cat.workstation": "İş istasyonu",
  "cat.datacenter": "Veri merkezi",
  "cat.apple": "Apple",

  "method.summary": "Sayılar nasıl hesaplanıyor",
  "method.weightsTerm": "Ağırlıklar",
  "method.weightsText":
    "= parametre × byte/parametre (FP16/BF16 = 2, FP8/INT8 = 1, INT4 = 0.5). Mixture-of-Experts modellerde tüm uzmanlar yüklenir, dolayısıyla aktif alt küme değil toplam parametre kullanılır.",
  "method.kvTerm": "KV cache",
  "method.kvText":
    "= 2 × katman × kv_head × head_dim × byte × context × eşzamanlılık. Grouped-Query Attention (kv_head < attn_head) bunu ciddi ölçüde küçültür — her modelin config'inden okunur.",
  "method.overheadTerm": "Ek yük",
  "method.overheadText":
    "aktivasyon + parçalanmayı (ayarlanabilir %) ve sabit bir CUDA context payını ekler. GPU uyumu, nominal VRAM'in ~%95'inin kullanılabilir olduğunu varsayar.",
  "method.disclaimer":
    "Tahminler planlama içindir, garanti değildir. Gerçek kullanım; servis motoruna (vLLM, TGI, llama.cpp), paged-attention verimliliğine ve özel attention türlerine (ör. DeepSeek'teki MLA) göre değişir — bunlar henüz modellenmemiştir.",

  "footer.builtBy": "Yapan:",
  "footer.privacy": "Tamamen tarayıcında çalışır — hiçbir veri makineni terk etmez.",
  "link.github": "GitHub",
  "link.linkedin": "LinkedIn",
  "link.hf": "Hugging Face",

  "nav.sizing": "VRAM Hesabı",
  "nav.fit": "Görev Uygunluğu",

  "fit.title": "Model ↔ Görev Uygunluğu",
  "fit.subtitle":
    "Bu model işi gerçekten yapar mı? Bir model ve kullanım amacını seç — LLMScale, modelin gerçek özelliklerinden (boyut, context, ayar, kip) uygunluğu skorlar ve her kriteri açıklar.",
  "fit.pickTask": "Görevini seç",
  "fit.scoreLabel": "Uygunluk skoru",
  "fit.empty": "Uygunluğu görmek için bir model ve görev seç.",
  "fit.criteriaTitle": "Bu skorun nedeni",

  "fit.verdict.great": "Çok uygun",
  "fit.verdict.good": "Kullanılabilir",
  "fit.verdict.weak": "Zayıf uyum",
  "fit.verdict.poor": "Uygun değil",

  "fit.task.chat": "Sohbet / asistan",
  "fit.task.code": "Kod üretimi",
  "fit.task.rag": "RAG / belge S-C",
  "fit.task.summarize": "Uzun belge özet",
  "fit.task.agent": "Ajan / araç kullanımı",
  "fit.task.reasoning": "Akıl yürütme & matematik",
  "fit.task.multilingual": "Çok dilli",
  "fit.task.vision": "Görsel / çok kipli",
  "fit.task.embeddings": "Embedding / arama",
  "fit.task.edge": "Cihaz üstü / edge",
  "fit.task.throughput": "Yüksek throughput servis",

  "fit.crit.modality": "Model türü",
  "fit.crit.instruct": "Talimat ayarı",
  "fit.crit.size": "Model boyutu",
  "fit.crit.context": "Context penceresi",
  "fit.crit.code": "Kod yeteneği",
  "fit.crit.reasoning": "Akıl yürütme",
  "fit.crit.multilingual": "Çok dillilik",
  "fit.crit.efficiency": "Servis verimliliği",

  "fit.msg.modalityGen": "Üretken metin modeli",
  "fit.msg.modalityEmbedding": "Bu bir embedding modeli — üretim için tasarlanmamış",
  "fit.msg.modalityReranker": "Bu bir reranker/sınıflandırıcı — üretim için değil",
  "fit.msg.modalityUnknownGen": "Üretken model olduğu doğrulanamadı",
  "fit.msg.instructYes": "Sohbet / talimat ayarlı",
  "fit.msg.instructBase": "Base model — -Instruct sürümünü tercih et",
  "fit.msg.instructUnknown": "Talimat ayarı belirsiz",
  "fit.msg.size": "{params} (önerilen ≥ {ideal}B)",
  "fit.msg.context": "{ctx} token (önerilen ≥ {ideal}k)",
  "fit.msg.contextUnknown": "Context uzunluğu bilinmiyor",
  "fit.msg.codeYes": "Koda özel",
  "fit.msg.codeNo": "Koda özel değil",
  "fit.msg.reasonYes": "Akıl yürütme / matematik ayarlı",
  "fit.msg.reasonNo": "Akıl yürütmeye özel değil — boyuta dayanır",
  "fit.msg.multiYes": "Çok dilli",
  "fit.msg.multiNo": "İngilizce ağırlıklı görünüyor",
  "fit.msg.visionYes": "Çok kipli (görsel) model",
  "fit.msg.visionNo": "Görsel yeteneği yok — -VL / çok kipli model seç",
  "fit.msg.embedYes": "Embedding modeli",
  "fit.msg.embedNo": "Embedding modeli değil — örn. BGE, E5, Qwen3-Embedding kullan",
  "fit.msg.edgeSize": "{params} — cihazda küçük olan daha iyi",
  "fit.msg.effMoE": "MoE — düşük aktif hesap, güçlü throughput",
  "fit.msg.effDense": "{params} yoğun — token başına daha ağır",

  "nav.vllm": "vLLM Parametreleri",
  "vllm.subtitle":
    "Ayarlanmış bir `vllm serve` komutu üret. Bir model, neyi optimize ettiğini ve iş tipini seç — LLMScale en iyi performans, doğruluk ve güvenilirlik için parametreleri önerir ve kopyalanabilir komut verir.",
  "vllm.pickPriority": "Neyi optimize et",
  "vllm.pickTask": "İş tipi",
  "vllm.gpuCount": "GPU sayısı",
  "vllm.maxlen": "Maks context (max-model-len)",
  "vllm.commandTitle": "Önerilen komut",
  "vllm.copy": "Kopyala",
  "vllm.copied": "Kopyalandı ✓",
  "vllm.flagsTitle": "Her parametre ne yapıyor",
  "vllm.warningsTitle": "Notlar & uyarılar",
  "vllm.empty": "vLLM parametreleri için bir model seç.",

  "vllm.prio.balanced": "Dengeli",
  "vllm.prio.throughput": "Throughput",
  "vllm.prio.latency": "Düşük gecikme",
  "vllm.prio.accuracy": "Maks doğruluk",
  "vllm.prio.memory": "Bellek-kısıtlı",

  "vllm.task.chat": "Sohbet / asistan",
  "vllm.task.rag": "RAG / uzun context",
  "vllm.task.code": "Kod",
  "vllm.task.tool": "Araç kullanımı / ajan",
  "vllm.task.structured": "Yapısal JSON",
  "vllm.task.vision": "Görsel / çok kipli",
  "vllm.task.reasoning": "Akıl yürütme",

  "vllm.r.maxlen": "Context penceresini sınırlar — modelin tam maksimumuna göre KV cache'i serbest bırakır.",
  "vllm.r.tp": "Modeli GPU'lara böler (tensor paralelliği).",
  "vllm.r.ep": "MoE katmanları için GPU'lar arası uzman paralelliği.",
  "vllm.r.gpuutil": "vLLM'in ağırlık + KV cache için kullanabileceği VRAM oranı.",
  "vllm.r.kvfp8": "FP8 KV cache, cache belleğini ~yarıya indirir — daha fazla/uzun dizi sığar.",
  "vllm.r.maxbatched": "Büyük prefill batch'i throughput'u en üst düzeye çıkarır.",
  "vllm.r.maxbatchedLat": "Küçük prefill batch'i token-arası gecikmeyi düşürür.",
  "vllm.r.maxseqs": "Throughput için çok sayıda eşzamanlı diziye izin verir.",
  "vllm.r.maxseqsLat": "Az eşzamanlı dizi gecikmeyi düşük tutar.",
  "vllm.r.maxseqsMem": "KV cache belleğini sınırlamak için eşzamanlılığı kısıtlar.",
  "vllm.r.chunked": "Chunked prefill, uzun prompt'ların decode'u durdurmasını önler.",
  "vllm.r.prefix": "Prefix caching, paylaşılan sistem/context ön-eklerini yeniden kullanır.",
  "vllm.r.tool": "Otomatik araç/fonksiyon çağrısını etkinleştirir.",
  "vllm.r.toolparser": "Bu model ailesine uygun ayrıştırıcı ({parser}).",
  "vllm.r.guided": "Hızlı, güvenilir JSON/gramer çıktısı için xgrammar arka ucu.",
  "vllm.r.mm": "Çok kipli girdi için prompt başına görsel sınırı.",
  "vllm.r.dtype": "En iyi doğruluk için tam BF16 ağırlıklar.",
  "vllm.r.seed": "Tekrarlanabilir, güvenilir çıktı için sabit seed.",

  "vllm.w.ctxcap": "İstenen context modelin maksimumunu ({max}) aşıyor — vLLM reddeder ya da rope scaling gerekir.",
  "vllm.w.fp8acc": "FP8 KV cache uzun-context görevlerde doğruluğu düşürebilir — üretimden önce doğrula.",
  "vllm.w.kvfull": "Maksimum doğruluk için KV cache tam hassasiyette (auto) tutuluyor.",
  "vllm.w.template": "Bu ayrıştırıcı genelde modele özel --chat-template ister (vLLM examples/ klasörü).",
  "vllm.w.parserUnknown": "Tool-call ayrıştırıcısı tespit edilemedi — --tool-call-parser'ı modeline göre ayarla.",
  "vllm.w.trust": "Çoğu çok kipli model ayrıca --trust-remote-code ister.",
  "vllm.w.quant": "Önceden quantize edilmiş model ({q}) — vLLM otomatik algılar; --quantization gerekmez.",
  "vllm.w.gguf": "vLLM'de GGUF desteği deneyseldir — safetensors/native repo önerilir.",
  "vllm.w.fit": "~{need} GiB gerekiyor, ~{have} GiB var — GPU ekle (≈{gpus}), quantize et, context'i kısalt ya da FP8 KV kullan.",
  "vllm.w.mig": "MIG = tek izole GPU dilimi; MIG'ler arası tensor-parallel desteklenmez. Instance'ı CUDA_VISIBLE_DEVICES=MIG-… ile sabitle.",
};

const DICTS: Record<Lang, Dict> = { en, tr };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem("lang");
    if (stored === "en" || stored === "tr") return stored;
  } catch {
    /* localStorage unavailable */
  }
  return typeof navigator !== "undefined" && navigator.language?.startsWith("tr") ? "tr" : "en";
}

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function useLang(): LangCtx {
  return useContext(LanguageContext);
}

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

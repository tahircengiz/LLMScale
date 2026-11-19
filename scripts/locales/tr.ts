// Türkçe: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const tr: PageText = {
  section: { models: "Modeller", gpus: "GPU'lar", concepts: "Kavramlar", feed: "Akış", crumbs: "Konum" },
  join: { sentence: " ", list: ", ", colon: ": " },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Multi-head latent attention (MLA) kullanır: her katman, her head için key ve value yerine token başına ${dims} boyutlu tek bir sıkıştırılmış latent saklar; bu da KV cache'ini alışılmış formülün vereceğinden ${ratio} küçük yapar.`,
      mqa: ({ heads }) =>
        `Multi-query attention kullanır: ${heads} query head'in hepsi tek bir key-value head'i paylaşır; bu yüzden KV cache'i tam multi-head attention'a göre ${heads} kat küçüktür.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `Grouped-query attention kullanır: ${heads} query head, ${kvHeads} key-value head'i paylaşır; bu yüzden KV cache'i tam multi-head attention'a göre ${ratio} küçüktür.`,
      mha: ({ heads }) =>
        `Tam multi-head attention kullanır: ${heads} head'in her biri kendi key ve value'larını tutar, bu yüzden KV cache'i head sayısının gerektirdiği kadar büyüktür.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name}, ${layers} katmanda ${params} parametreye sahiptir.`,
      moe: ({ active, total }) =>
        `Mixture-of-Experts modelidir: toplam ${total} parametrenin token başına yaklaşık ${active} kadarı aktiftir; bellek hepsini tutmak zorundadır, her token ise yalnızca aktif kısımdan geçer.`,
      context: ({ max, kv }) => `En fazla ${max} token context alır; bu uzunlukta tek bir kullanıcı, ağırlıkların üstüne FP16'da ${kv} KV cache ister.`,
      gated: "Hugging Face deposu erişim onayı gerektirdiği için LLMScale mimarisini yerleşik veritabanında taşır.",
    },
    title: (name) => `${name} Kaç GB VRAM İster?`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name}, ${ctx} context'te tek kullanıcı için BF16'da ${bf16}, INT4'te ${int4} GPU belleği ister. Hassasiyet ve context'e göre bellek, onu taşıyan GPU'lar, eşzamanlı kullanıcılar ve ince ayar belleği.`,
    h1: (name) => `${name} kaç GB VRAM ister?`,
    oneUser: "tek kullanıcı",
    ctx: (k) => `${k} context`,
    answer: ({ weights, kv, overhead, int4 }) => `${weights} ağırlık, ${kv} KV cache ve ${overhead} vLLM'in ek yükü. Aynı iş yükü INT4'te ${int4} ister.`,
    specLayers: (n) => `${n} katman`,
    specMaxContext: (k) => `${k} maks context`,
    specHeads: ({ heads, kvHeads }) => `${heads}/${kvHeads} head`,
    h2Memory: (name) => `Hassasiyet ve context'e göre ${name} belleği`,
    thPrecision: "Hassasiyet",
    kvCache: "KV cache",
    tableNote:
      "Tek kullanıcı, FP16 KV cache ve 70 GB altı bir kartın varsayılanlarıyla tek GPU'da vLLM'in ek yükü. Quantization ağırlıkları küçültür, KV cache'i değil; bu yüzden context büyüdükçe kazanç daralır.",
    h2Holds: "Onu tek başına taşıyan GPU'lar",
    noSingleGpu: (counts) => `tek bir GPU'ya sığmaz — hesaplayıcının yerleşimiyle en az: ${counts}.`,
    fitNote: (ctx) =>
      `${ctx} context ve tek kullanıcı için, en küçük kartlar önce. Ayrık kartlarda vLLM'in varsayılanı olan bellek payı %92, unified bellekli cihazlarda GPU'nun kullanabildiği pay hesaba katılır; her cihaz kendi varsayılanlarıyla vLLM'in ek yükünü taşır.`,
    h2Users: "Kaç kullanıcı sığar",
    doesNotFit: "sığmaz",
    usersNote: (ctx) => `Kullanıcı başına ${ctx} context ile, tek kartta. ✗: ağırlıklar tek bir kullanıcıya bile yer bırakmıyor.`,
    noCard: "Buradaki hiçbir kart onu herhangi bir hassasiyette tek başına taşıyamaz; servis etmek, tensor parallel ile birden çok GPU'ya bölmek demektir.",
    h2FineTune: (name) => `${name} ince ayarı`,
    thMethod: "Yöntem",
    thMemory: "Bellek",
    thSmallestGpu: "En küçük GPU",
    modes: { full: "Tam ince ayar", lora: "LoRA (rank 16, attention)", qlora: "QLoRA (rank 16, attention)" },
    sharded: "birden çok GPU, paylaştırılmış",
    trainNote:
      "Dizi uzunluğu 2.048, batch 1, gradient checkpointing açık, Adam. Tam ince ayar aktivasyonlardan önce parametre başına 16 byte tutar; QLoRA dondurulmuş temel modeli 4-bit NF4 olarak saklar.",
    h2Source: "Sayılar nereden geliyor",
    kvFormula: {
      mla: "MLA'da KV cache <code>katman × (kv_lora_rank + qk_rope_head_dim) × byte × context × kullanıcı</code> olur.",
      heads: "KV cache <code>2 × katman × key-value head × head boyutu × byte × context × kullanıcı</code> olur.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${layers} katmanının ${sliding} tanesi son ${window} token'lık kayan pencereye bakar ve bundan fazlasını tutmaz; pencereden sonra eklenen her token, diğer ${fullLayers} katmanın payı olan ${pastWindow} KiB ekler.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Ağırlıklar <code>parametre × parametre başına byte</code> olur. ${kvFormula} ${name} için bu, FP16'da token başına ${kib} KiB eder.${windowNote} Bunlar kapasite planlama sayılarıdır: servis motoru — vLLM, TGI, llama.cpp — ve paged-attention verimliliği gerçek değeri yine değiştirir.`,
    more: ({ kvCache, attention }) => `Daha fazlası: <a href="${kvCache}">KV cache boyutu</a> ve <a href="${attention}">GQA, MQA ve MLA</a>.`,
    h2Work: (name) => `${name} ile çalış`,
    links: {
      size: "Kendi iş yüküne göre hesapla",
      train: "İnce ayar belleği",
      vllm: "vLLM parametreleri",
      anatomy: "Model anatomisi",
      config: "config.json'u, açıklamalı",
      serving: "Dosyaları servis hakkında ne diyor",
    },
    h2Family: (family) => `Diğer ${family} modelleri`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name}, ${total} GB belleği CPU ve GPU arasında paylaşır; GPU varsayılan olarak bunun yaklaşık ${vram} GB'ını kullanabilir ve LLMScale modele ${usable} ayırır${apple ? "" : ": GPU'nun bildirdiği belleğin vLLM varsayılanı olan %92'si"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} ${vram} GB belleğe sahiptir. LLMScale modele bunun ${usable} kadarını ayırır: kartın bildirdiği belleğin vLLM varsayılanı olan %92'si (--gpu-memory-utilization 0.92); kalanı CUDA bağlamına kalır.`,
      bandwidth: (bw) => `Bellek bant genişliği ${bw} GB/sn'dir; bir model sığdıktan sonra üretim hızını sınırlayan budur.`,
      apple: "vLLM'in Metal arka ucu olmadığı için modeller bu cihazda llama.cpp ya da MLX ile çalışır.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `Aşağıdaki ${models} popüler açık modelden ${bf16} tanesi BF16'da, ${fp8} tanesi FP8'de, ${int4} tanesi INT4'te 8k context ve tek kullanıcıyla sığar.`,
    },
    title: (name) => `${name}: Hangi LLM'ler Sığar?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `${name} (kullanılabilir ${usable}) üzerinde hangi açık LLM'ler çalışır: ${models} popüler modelin ${int4} tanesi INT4'te, ${bf16} tanesi BF16'da sığar; her biri için eşzamanlı kullanıcı ve maksimum context.`,
    h1: (name) => `${name}: hangi LLM'ler sığar?`,
    doesNotFit: " (sığmaz)",
    thModel: "Model",
    thUsers: "Kullanıcı",
    thMaxContext: "Maks context",
    tableNote:
      "Bellek; 8k context ve tek kullanıcı (modelin maksimum context'i daha kısaysa o) için, FP16 KV cache ve bu kartın varsayılanlarıyla vLLM'in ek yüküyle hesaplanır. Kullanıcı sayısı (her biri 8k) ve maksimum context, sığan en yüksek hassasiyet içindir.",
    usableMemory: "kullanılabilir bellek",
    answer: ({ models, bf16, int4 }) => `${models} modelden ${int4} tanesi INT4'te, ${bf16} tanesi BF16'da sığar.`,
    h2Fit: (name) => `${name}: hangi LLM'ler sığar`,
    quantization: (href) => `BF16, FP8 ve INT4'ün bellek için anlamı: <a href="${href}">quantization ve VRAM</a>.`,
    parallel:
      "Tek karta sığmayan bir model birden çok kartta çalışabilir: tensor parallel, ağırlıklarını ve KV cache'ini kartlar arasında böler. Kaç tane gerektiğini hesaplayıcı bulur.",
    h2Size: (name) => `${name} için bir modeli hesapla`,
    open: "Hesaplayıcıyı bu GPU ile aç",
    h2Others: "Diğer GPU'lar",
  },

  hubs: {
    models: {
      title: "Modele Göre LLM VRAM Gereksinimleri",
      description: (models) =>
        `${models} popüler açık LLM için GPU belleği — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — BF16 ve INT4'te; her biri için sığan GPU'lar ve ince ayar belleğiyle.`,
      h1: "Modele göre LLM VRAM gereksinimleri",
      lede: (models) =>
        `${models} popüler açık modelin ne kadar GPU belleği istediği, her birinin kendi mimarisinden hesaplanmış olarak: 8k context'te tek kullanıcı için BF16 ve INT4'te ağırlık, KV cache ve ek yük. Her sayfa bunu hassasiyet ve context'e göre ayırır, onu taşıyan GPU'ları ve kaç kullanıcı sığdığını listeler, ince ayar belleğini de ekler.`,
      active: "aktif",
      thModel: "Model",
      thParams: "Parametre",
      thMaxContext: "Maks context",
      note: "Tek kullanıcı, FP16 KV cache ve tek GPU'da vLLM'in ek yükü; maksimum context'i daha kısa olan modeller o maksimumla gösterilir.",
      links: { size: "Herhangi bir Hugging Face modelini hesapla", byGpu: "Hangi GPU'ya hangi LLM sığar", memory: "LLM belleği nasıl çalışır" },
    },
    gpus: {
      title: "Hangi GPU'ya Hangi LLM Sığar?",
      description:
        "Hangi popüler açık LLM'ler RTX 4090, RTX 5090, H100, H200, B200, Apple M serisi, Strix Halo ve DGX Spark'a sığar — BF16, FP8 ve INT4'te, kullanıcı sayısı ve maksimum context ile.",
      h1: "Hangi GPU'ya hangi LLM sığar",
      lede: ({ models, gpus }) =>
        `${models} popüler açık LLM'den hangilerinin, insanların bu modelleri çalıştırdığı ${gpus} GPU'ya sığdığı — tüketici ve iş istasyonu kartları, veri merkezi GPU'ları, Apple Silicon ve unified bellekli yapay zekâ PC'leri. Her sayfa tüm modelleri BF16, FP8 ve INT4 bellekleriyle, kaç kullanıcı sığdığıyla ve taşıyabileceği en uzun context ile listeler.`,
      thType: "Tür",
      thUsable: "Kullanılabilir",
      thBf16: "BF16'da model",
      thInt4: "INT4'te model",
      note: (models) =>
        `${models} model içinden, 8k context ve tek kullanıcı için. Ayrık kartlarda vLLM'in varsayılanı olan bellek payı %92, unified bellekli cihazlarda GPU'nun kullanabildiği pay hesaba katılır; her cihaz kendi varsayılanlarıyla vLLM'in ek yükünü taşır.`,
      links: { size: "Herhangi bir GPU'da model hesapla", byModel: "Modele göre VRAM gereksinimleri", memory: "LLM belleği nasıl çalışır" },
    },
    concepts: {
      title: "LLM Belleği Nasıl Çalışır: KV Cache, GQA, Quantization",
      description:
        "Bir LLM'in ne kadar GPU belleği istediğini belirleyen kavramlar — KV cache, grouped-query ve latent attention, quantization — gerçek modeller ve hesaplanmış sayılarla.",
      h1: "LLM belleği nasıl çalışır",
      lede: "Bir dil modelinin ne kadar GPU belleği istediğini belirleyen kavramlar için üç rehber. Her biri gerçek modeller üzerinden ilerler ve içlerindeki her sayı hesaplayıcıyla aynı motordan hesaplanır.",
      links: { calculator: "Hesaplayıcıyı aç", byModel: "Modele göre VRAM gereksinimleri", byGpu: "Hangi GPU'ya hangi LLM sığar" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Model",
      thLayers: "Katman",
      thShape: "KV head × head boyutu",
      thPerToken: "Token başına",
      attentionLink: "GQA, MQA ve MLA",
      quantLink: "quantization ve VRAM",
      text: (v) => ({
        title: "KV Cache Boyutu: Formül ve Örnekler",
        description: `Bir LLM'in KV cache'i ne kadar büyür: formül, ${v.ex} ile çözümlü örnek, popüler modellerde token başına değerler; eşzamanlılık, FP8 ve grouped-query attention'ın ona etkisi.`,
        h1: "KV cache boyutu: formül ve gerçek modellerle örnekler",
        crumb: "KV cache",
        summary: "Formül, çözümlü bir örnek, popüler modellerde token başına değerler; eşzamanlılığın onu neden çarptığı ve ağırlık quantization'ının neden dokunmadığı.",
        body: `<p class="lede">Bir dil modeli metin üretirken, önceki her token için her katmanda hesapladığı key ve value'ları saklar; böylece bir sonraki token için onları yeniden hesaplamaz. Bu depo KV cache'tir. Kaba hesapların atladığı GPU belleği kısmıdır ve uzun context'te ya da çok kullanıcıyla modelin ağırlıklarını geçer.</p>
<h2>Formül</h2>
<p>Her token için her katman, her key-value head başına bir key ve bir value vektörü saklar:</p>
<pre><code>token başına KV byte = 2 × katman × key-value head × head boyutu × değer başına byte
KV cache             = token başına KV byte × context uzunluğu × eşzamanlı dizi</code></pre>
<p>2, key ile value'yu sayar. Bir değer FP16 ya da BF16'da 2 byte, FP8'de 1 byte tutar. Katman, key-value head ve head boyutu mimariyle sabittir — modelin config.json dosyasında <code>num_hidden_layers</code>, <code>num_key_value_heads</code> ve <code>head_dim</code> — aynı boyuttaki iki modelin çok farklı önbellek istemesinin nedeni budur. Multi-head latent attention kullanan modellerde formülün ortası değişir; bkz. ${v.attention}.</p>
<h2>Çözümlü örnek: ${v.ex}</h2>
<p>${v.exLink} ${v.layers} katmana, ${v.kvHeads} key-value head'e ve ${v.headDim} boyutlu head'lere sahiptir. FP16'da bu, token başına 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} byte, yani ${v.perTok} eder. Tek kullanıcı 8k token'da ${v.kv8k} önbellek ister; ${v.exMax} token'lık tam context'te ${v.kvMax} — ${v.kvOverWeights ? `${v.weights} tutan BF16 ağırlıklarından fazla` : `BF16 ağırlıkları ise ${v.weights}`}.</p>
<p>Bunu belirleyen parametre sayısı değildir. ${v.peerLink} ile ${v.exLink} boyut olarak birbirine yakındır — ${v.peerParams} ve ${v.exParams} parametre — ama ${v.ex} token başına ${v.perTok} saklar, ${v.peer} ise ${v.peerTok}. Aradaki ${v.ratio} fark katman ve key-value head sayısından gelir.</p>
<h2>Popüler modellerde token başına önbellek</h2>
${v.table}
<p class="note">FP16, tek dizi. —: modelin maksimum context'inin ötesi. DeepSeek V3, head başına key ve value yerine sıkıştırılmış bir latent saklar. Gemma 2 ve gpt-oss bu tabloya alınmadı: sliding-window katmanları pencerede büyümeyi bırakır, bu yüzden token başına maliyetleri context uzadıkça düşer. Hesaplayıcı bunu katman katman sayar.</p>
<h2>Eşzamanlılık onu çarpar</h2>
<p>Her eşzamanlı dizinin kendi önbelleği vardır. ${v.h100Usable} kullanılabilir belleğiyle tek bir ${v.h100} üzerinde ${v.ex}, BF16'da kullanıcı başına 8k token ile ${v.users[0]}, 32k ile ${v.users[1]}, 128k ile ${v.users[2]} kullanıcıya yer bırakır. Ağırlıklar tabanı belirler; önbellek, üstüne kaç kişinin sığacağına karar verir.</p>
<h2>Onu ne küçültür, ne küçültmez</h2>
<ul class="plain">
<li><strong>Daha az key-value head.</strong> Grouped-query ve multi-query attention key-value head'leri query head'ler arasında paylaştırır; multi-head latent attention sıkıştırılmış bir latent saklar. Bu, seçtiğin modelle birlikte gelir.</li>
<li><strong>FP8 KV cache.</strong> Değer başına iki yerine bir byte, önbelleği yarıya indirir. vLLM bunu <code>--kv-cache-dtype fp8</code> olarak sunar; uzun context'li işlerde doğruluğa mal olabilir, önce doğrula.</li>
<li><strong>Daha düşük context sınırı.</strong> Önbellek bir dizinin tuttuğu her token'la büyür; dizi uzunluğunu sınırlamak — vLLM'de <code>--max-model-len</code> — en kötü durumu sınırlar.</li>
<li><strong>Ağırlık quantization'ı değil.</strong> INT4 ya da FP8 ağırlıklar yalnızca ağırlıkları küçültür; önbellek kendi hassasiyetinde kalır, bu yüzden context büyüdükçe kazanç daralır. Bkz. ${v.quant}.</li>
<li><strong>Paged attention ve prefix caching</strong> önbelleği küçültmez, daha iyi kullanır: bellek, baştan ayrılmak yerine diziler büyüdükçe bloklar hâlinde verilir ve aynı ön eki paylaşan istekler o blokları ortak kullanabilir. LLMScale bu verimliliği modellemez; sayıları ihtiyacın tamamıdır.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Modelin için KV cache'i hesapla</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Quantization ve VRAM</a></li>
  <li><a href="${v.modelsHref}">Modele göre VRAM</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Model",
      thQueryHeads: "Query head",
      thKvHeads: "KV head",
      thAttention: "Attention",
      thPerToken: "Token başına",
      thVsMha: "MHA'ya göre",
      kvLink: "KV cache boyutu",
      text: (v) => ({
        title: "GQA, MQA ve MLA: Attention ve KV Cache Boyutu",
        description: `Multi-head, multi-query, grouped-query ve multi-head latent attention bir LLM'in KV cache'ini nasıl değiştirir; ${v.gqaName} ve ${v.mlaName} üzerinden hesaplanmış, ${v.models} model yan yana.`,
        h1: "GQA, MQA ve MLA: attention KV cache'i nasıl belirler",
        crumb: "GQA, MQA ve MLA",
        summary:
          "Attention head'lerini düzenlemenin dört yolu, önbelleği neden on kat değiştirdikleri ve DeepSeek'in latent attention'ının head sayısını formülden nasıl çıkardığı.",
        body: `<p class="lede">KV cache attention'dan doğar ve bir modelin attention head'lerini nasıl düzenlediği, aynı parametre sayısında önbelleği on kat değiştirebilir. Bugünün açık modellerini dört düzen kapsar.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Her query head'in kendi key ve value head'leri vardır ve önbellek hepsini saklar: token başına 2 × katman × head × head boyutu × byte. Özgün Transformer tasarımıdır ve önbelleği en pahalı olandır. ${v.mha} hâlâ bunu kullanır — ${v.mhaLayers} katmanda ${v.mhaHeads} head, token başına ${v.mhaTok}.</p>
<h2>Multi-query attention (MQA)</h2>
<p>Tüm query head'ler tek bir key head'ini ve tek bir value head'ini paylaşır (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). Önbellek head sayısının tamamı kadar küçülür — mümkün olan en büyük kazanç — ama tek bir key ve value takımını her head'e paylaştırmak kaliteye mal olabilir.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Query head'ler gruplara ayrılır ve her grup bir key-value head'i paylaşır: birden fazla, ama query head sayısından az. Ainslie ve arkadaşları (2023) bunu orta yol olarak önerdi — multi-head attention'a yakın kalite, multi-query'ye yakın hız — ve LLMScale'in yerleşik ${v.bundled} modelinden ${v.gqaCount} tanesi bunu kullanır. ${v.gqa}, ${v.gqaHeads} query head'i ${v.gqaKvHeads} key-value head'e toplar; bu yüzden multi-head attention'ın ${v.gqaMhaTok} isteyeceği yerde token başına ${v.gqaTok} saklar: ${v.gqaRatio} daha az.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 başka bir yol izledi. Head başına key ve value yerine her katman, token başına tek bir sıkıştırılmış latent vektör ve rotary konum kodlamasını taşıyan küçük, ayrık bir key saklar. Token başına önbellek <code>katman × (kv_lora_rank + qk_rope_head_dim) × byte</code> olur ve head sayısı formülden düşer. DeepSeek-V2 makalesi (§2.1.3), kendi boyutları için bunu yalnızca 2,25 gruplu bir GQA'nın boyutuna eşitler.</p>
<p>${v.mla}, ${v.mlaLayers} katmanın her birinde ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} değer saklar: token başına ${v.mlaTok}, head başına formülün verdiğinden ${v.mlaRatio} az. 8k context'te bu, ${v.perHead8k} yerine ${v.mla8k} eder. DeepSeek modellerine head başına formülü uygulayan bir hesaplayıcı önbelleği bu oranda abartır; LLMScale, bir config iki alanı da taşıdığında formül değiştirir.</p>
<h2>Yan yana</h2>
${v.table}
<p class="note">FP16. “MHA'ya göre”: aynı modelin multi-head bir sürümünün kaç kat fazla önbellek tutacağı.</p>
<h2>Model seçerken ne anlama gelir</h2>
<ul class="plain">
<li><strong>Parametre sayısından önce key-value head'lere bak.</strong> ${v.small} ile ${v.big} parametrede %${v.pct}, token başına önbellekte ${v.sizeRatio} fark eder.</li>
<li><strong>Attention düzeni modelle birlikte gelir.</strong> Servis edilen bir modelin önbelleğini küçültmek için FP8 KV cache, daha kısa context ya da daha az dizi kalır — bkz. ${v.kv}.</li>
<li><strong>Tensor parallel key-value head'leri GPU'lar arasında böler;</strong> bu yüzden hesaplayıcı onları eşit bölen GPU sayıları önerir.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">Bir modelin attention düzenini gör</a></li>
  <li><a href="${v.kvHref}">KV cache boyutu</a></li>
  <li><a href="${v.quantHref}">Quantization ve VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Hassasiyet",
      thBytes: "Byte / parametre",
      kvLink: "KV cache boyutu",
      text: (v) => ({
        title: "LLM Quantization ve VRAM: BF16, FP8, INT4",
        description:
          "BF16, FP8, INT8 ve INT4 ağırlıklar 8B'den 405B'ye modellerde ne kadar GPU belleği tutar; AWQ, GPTQ, GGUF, MXFP4 ve NF4 nedir ve ağırlıkları quantize etmek neden KV cache'i değiştirmez.",
        h1: "Quantization ve VRAM: BF16, FP8, INT8 ve INT4",
        crumb: "Quantization",
        summary: "FP32'den INT4'e parametre başına byte, karşılaşacağın formatlar, 4-bit'in neden tam yarım byte olmadığı ve KV cache'e neden dokunmadığı.",
        body: `<p class="lede">Quantization, bir modelin ağırlıklarını daha az bitle saklar. Ağırlıklar genelde GPU belleğinin en büyük kısmıdır, bu yüzden ilk başvurulan araçtır — ama yalnızca ağırlıkları küçültür ve her adım biraz doğruluktan feragat eder.</p>
<h2>Parametre başına byte</h2>
<p>Ağırlıklar <code>parametre × parametre başına byte</code> yer tutar. Referans BF16 ve FP16'dır — çoğu model bunlardan biriyle yayımlanır — ve diğer her hassasiyet bunun bir katıdır.</p>
${v.table}
<p class="note">Yalnızca ağırlıklar; KV cache ve ek yük hariç. FP8, INT8 ve INT4'te embedding ve çıkış katmanı 16 bitte kalır.</p>
<h2>Karşılaşacağın formatlar</h2>
<ul class="plain">
<li><strong>BF16 ve FP16</strong> — 16-bit kayan nokta. BF16, FP32'nin aralığını daha düşük hassasiyetle korur; eğitimin ve yayımlanan çoğu checkpoint'in onu kullanmasının nedeni budur.</li>
<li><strong>FP8</strong> — 8-bit kayan nokta, ağırlık başına bir byte; yeni NVIDIA GPU'larında (Ada Lovelace, Hopper ve sonrası) donanım desteği vardır. Bazı modeller FP8 checkpoint'leriyle gelir.</li>
<li><strong>INT8</strong> — ölçek katsayılarıyla 8-bit tam sayılar, ağırlık başına bir byte.</li>
<li><strong>AWQ ve GPTQ</strong> — 4-bit, yalnızca ağırlık yöntemleri: ağırlıklar 4 bitte saklanır, 16 bitte hesaplanır. safetensors olarak gelirler ve vLLM gibi GPU servis motorlarını hedeflerler.</li>
<li><strong>GGUF</strong> — llama.cpp'nin dosya formatı; quantization seviyeleri bit sayısıyla adlandırılır (Q4, Q5, Q8…) ve CPU, Apple Silicon ve tüketici GPU'larında kullanılır.</li>
<li><strong>NVFP4 ve MXFP4</strong> — ortak ölçekli 4-bit kayan nokta formatları. gpt-oss uzman ağırlıklarını MXFP4 ile yayımlar; ${v.oss} modelinin tek bir 80 GB GPU'ya sığması bu sayededir: 8k context ve tek kullanıcıyla ${v.ossNeed}, ${v.h100} üzerindeki ${v.h100Usable} kullanılabilir belleğe karşı.</li>
<li><strong>NF4</strong> — QLoRA'nın 4-bit NormalFloat'ı; dondurulmuş, quantize edilmiş bir temel model üzerinde adaptör eğitmek için.</li>
</ul>
<h2>4-bit neden tam yarım byte değil</h2>
<p>Gerçek 4-bit formatlar ölçek katsayılarını da saklar — AWQ ve GPTQ'da her 128 ağırlık için 16-bit bir ölçek, MXFP4'te her 32'lik blok için 8-bit bir ölçek — bu da ağırlık başına yaklaşık 4,25 bit eder; embedding'i ve çıkış katmanını da 16 bitte tutarlar. LLMScale ikisini de sayar, bu yüzden 4-bit sonucu BF16'nın yarısından belirgin biçimde büyük çıkar: Qwen2.5-7B, Qwen'in kendi AWQ checkpoint'inin %2 yakınına düşer; FP8'deki Qwen3-8B ise RedHat'in FP8 checkpoint'iyle GiB'ın yüzde biri hassasiyetinde örtüşür. Hazır quantize edilmiş bir checkpoint kendi dosyalarıyla boyutlandırılır. QLoRA'nın çift quantization'lı NF4'ü parametre başına 4,127 bit, yani 0,516 byte ölçülür ve ince ayar hesaplayıcısının kullandığı sayı budur.</p>
<h2>KV cache'i küçültmez</h2>
<p>KV cache'in kendi hassasiyeti vardır; bunu ağırlıkların formatı değil, servis motoru belirler. Tek kullanıcı ve 128k context'le ${v.long}: ağırlıkları BF16'da ${v.longBf16}, INT4'te ${v.longInt4} tutar, KV cache ise FP16'da ${v.longKv} olarak kalır${v.kvOverInt4 ? " — INT4 ağırlıklardan fazla" : ""}. Önbelleği FP8'de saklamak onu yarıya indiren ayrı bir tercihtir; bkz. ${v.kv}.</p>
<h2>Mixture-of-Experts modeller</h2>
<p>Her uzman quantize edilir ve her uzmanın yine bellekte olması gerekir. ${v.moe} ${v.moeParams} parametre tutar: BF16'da ${v.moeBf16}, INT4'te ${v.moeInt4} ağırlık. ${v.moeActive} aktif parametresi her token'ın ne kadar iş yaptığını belirler, modelin ne kadar bellek tuttuğunu değil.</p>
<h2>Hassasiyet seçmek</h2>
<ul class="plain">
<li><strong>Sığandan başla.</strong> Bir model kartı aştığında hesaplayıcı, sığan ilk hafif hassasiyeti gösterir.</li>
<li><strong>Bedelini ölç.</strong> Her adım bellek için doğruluktan feragat eder ve ne kadar olduğu modele ve yönteme bağlıdır; servis etmeden önce kendi görevinde dene.</li>
<li><strong>Önceden quantize edilmiş checkpoint kendini anlatsın.</strong> LLMScale hassasiyetini <code>quantization_config</code>'ten, depo adından ya da safetensors başlığından okur; vLLM de AWQ, GPTQ ve FP8 checkpoint'lerini <code>--quantization</code> bayrağı olmadan yükler.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Modelin için hassasiyetleri karşılaştır</a></li>
  <li><a href="${v.kvHref}">KV cache boyutu</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA ve MLA</a></li>
  <li><a href="${v.gpusHref}">Hangi GPU'ya hangi LLM sığar</a></li>
</ul>`,
      }),
    },
  },
};

export default tr;

// Bahasa Indonesia: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const id: PageText = {
  section: { models: "Model", gpus: "GPU", concepts: "Konsep", feed: "Berita", crumbs: "Jalur navigasi" },
  join: { sentence: " ", list: ", ", colon: ": " },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Model ini menggunakan multi-head latent attention (MLA): setiap lapisan meng-cache satu vektor laten terkompresi berdimensi ${dims} per token, bukan kunci dan nilai untuk setiap head, sehingga cache KV-nya ${ratio} lebih kecil daripada hasil rumus biasa.`,
      mqa: ({ heads }) =>
        `Model ini menggunakan multi-query attention: semua ${heads} head kueri berbagi satu head kunci-nilai, sehingga cache KV-nya ${heads}× lebih kecil daripada yang dibutuhkan multi-head attention penuh.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `Model ini menggunakan grouped-query attention: ${heads} head kueri berbagi ${kvHeads} head kunci-nilai, sehingga cache KV-nya ${ratio} lebih kecil daripada yang dibutuhkan multi-head attention penuh.`,
      mha: ({ heads }) =>
        `Model ini menggunakan multi-head attention penuh: masing-masing dari ${heads} head-nya menyimpan kunci dan nilainya sendiri, sehingga cache KV sebesar yang dihasilkan oleh jumlah head-nya.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} memiliki ${params} parameter dalam ${layers} lapisan.`,
      moe: ({ active, total }) =>
        `Ini adalah model mixture of experts (MoE) dengan sekitar ${active} dari ${total} parameternya aktif per token: memori harus menampung semuanya, sementara setiap token hanya melewati bagian yang aktif.`,
      context: ({ max, kv }) => `Model ini menerima konteks hingga ${max} token; satu pengguna pada panjang itu membutuhkan ${kv} cache KV pada FP16, di luar bobotnya.`,
      gated: "Repositorinya di Hugging Face bersifat gated, sehingga LLMScale menyertakan arsitekturnya dalam basis data bawaan.",
    },
    title: (name) => `Kebutuhan VRAM ${name}`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} membutuhkan ${bf16} memori GPU pada BF16 dan ${int4} pada INT4 untuk satu pengguna dengan konteks ${ctx}. Memori menurut presisi dan konteks, GPU yang dapat menampungnya, pengguna bersamaan, dan memori fine-tuning.`,
    h1: (name) => `${name}: berapa banyak VRAM yang dibutuhkan?`,
    oneUser: "satu pengguna",
    ctx: (k) => `konteks ${k}`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `${weights} untuk bobot, ${kv} untuk cache KV, dan ${overhead} untuk overhead vLLM. Pada INT4, beban kerja yang sama membutuhkan ${int4}.`,
    specLayers: "lapisan",
    specMaxContext: "konteks maks.",
    specHeads: "head",
    h2Memory: (name) => `Memori ${name} menurut presisi dan konteks`,
    thPrecision: "Presisi",
    kvCache: "cache KV",
    tableNote:
      "Satu pengguna, cache KV FP16, dan overhead vLLM pada satu GPU dengan nilai default-nya untuk kartu di bawah 70 GB. Kuantisasi memperkecil bobot, bukan cache KV, sehingga penghematannya menyusut seiring bertambahnya konteks.",
    h2Holds: "GPU tunggal mana yang dapat menampungnya",
    noSingleGpu: (counts) => `tidak ada GPU tunggal yang dapat menampungnya — jumlah GPU paling sedikit untuk menyajikannya, sebagaimana disusun oleh kalkulator: ${counts}.`,
    fitNote: (ctx) =>
      `Pada konteks ${ctx} untuk satu pengguna, kartu terkecil lebih dulu. Kartu diskrit dianggarkan pada 92% memorinya (default vLLM), perangkat memori terpadu pada porsi yang dapat dialamatkan GPU-nya, dan masing-masing membawa overhead vLLM dengan nilai default-nya sendiri.`,
    h2Users: "Berapa pengguna yang muat",
    doesNotFit: "tidak muat",
    usersNote: (ctx) => `Pengguna dengan konteks ${ctx} masing-masing, pada satu kartu. ✗: bobot tidak menyisakan ruang bahkan untuk satu pengguna.`,
    noCard: "Tidak ada satu kartu pun di sini yang dapat menampungnya pada presisi apa pun; menyajikannya berarti membaginya ke beberapa GPU dengan paralelisme tensor.",
    h2FineTune: (name) => `Fine-tuning ${name}`,
    thMethod: "Metode",
    thMemory: "Memori",
    thSmallestGpu: "GPU terkecil",
    modes: { full: "Fine-tuning penuh", lora: "LoRA (peringkat 16, perhatian)", qlora: "QLoRA (peringkat 16, perhatian)" },
    sharded: "beberapa GPU, di-shard",
    trainNote:
      "Panjang urutan 2.048, ukuran batch 1, checkpointing gradien aktif, Adam. Fine-tuning penuh menyimpan 16 byte per parameter sebelum aktivasi; QLoRA menyimpan model dasar yang dibekukan dalam NF4 4-bit.",
    h2Source: "Dari mana angka-angka ini berasal",
    kvFormula: {
      mla: "Dengan MLA, cache KV adalah <code>lapisan × (kv_lora_rank + qk_rope_head_dim) × byte × konteks × pengguna</code>.",
      heads: "Cache KV adalah <code>2 × lapisan × head kunci-nilai × dimensi head × byte × konteks × pengguna</code>.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${sliding} dari ${layers} lapisannya memperhatikan sliding window berisi ${window} token terakhir dan tidak menyimpan lebih dari itu, sehingga setelah melewatinya setiap token tambahan menambah ${pastWindow} KiB, yaitu porsi ${fullLayers} lapisan lainnya.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Bobot adalah <code>parameter × byte per parameter</code>. ${kvFormula} Untuk ${name}, itu berarti ${kib} KiB per token pada FP16.${windowNote} Ini adalah angka perencanaan kapasitas: mesin inferensi — vLLM, TGI, llama.cpp — dan efisiensi paged attention-nya tetap memengaruhi angka sebenarnya.`,
    more: ({ kvCache, attention }) => `Selengkapnya tentang <a href="${kvCache}">ukuran cache KV</a> dan tentang <a href="${attention}">GQA, MQA, dan MLA</a>.`,
    h2Work: (name) => `Bekerja dengan ${name}`,
    links: {
      size: "Hitung kebutuhannya untuk beban kerja Anda",
      train: "Memori fine-tuning",
      vllm: "Parameter vLLM",
      anatomy: "Anatomi model",
      config: "Penjelasan config.json-nya",
      serving: "Apa kata file-nya tentang cara menyajikannya",
    },
    h2Family: (family) => `Model ${family} lainnya`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} berbagi ${total} GB memori antara CPU dan GPU; secara default GPU dapat mengalamatkan sekitar ${vram} GB darinya, dan LLMScale menganggarkan ${usable} untuk model${apple ? "" : ", yaitu 92% dari yang dilaporkan GPU (default vLLM)"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} memiliki memori ${vram} GB. LLMScale menganggarkan ${usable} darinya untuk model: 92% dari yang dilaporkan kartu, nilai default vLLM untuk --gpu-memory-utilization (0.92); sisanya disisihkan untuk konteks CUDA.`,
      bandwidth: (bw) => `Bandwidth memorinya, ${bw} GB/s, adalah yang membatasi kecepatan pembuatan teks setelah model muat.`,
      apple: "vLLM tidak memiliki backend Metal, sehingga model dijalankan di perangkat ini dengan llama.cpp atau MLX.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `Dari ${models} model terbuka populer di bawah ini, ${bf16} muat pada BF16, ${fp8} pada FP8, dan ${int4} pada INT4 dengan konteks 8k untuk satu pengguna.`,
    },
    title: (name) => `LLM mana yang muat di ${name}?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `LLM terbuka mana yang muat di ${name} (${usable} dapat dipakai): ${int4} dari ${models} model populer pada INT4 dan ${bf16} pada BF16, dengan pengguna bersamaan dan konteks maksimum untuk masing-masing.`,
    h1: (name) => `LLM mana yang muat di ${name}?`,
    doesNotFit: " (tidak muat)",
    thModel: "Model",
    thUsers: "Pengguna",
    thMaxContext: "Konteks maks.",
    tableNote:
      "Memori pada konteks 8k untuk satu pengguna (atau maksimum model, jika lebih pendek), cache KV FP16, dan overhead vLLM dengan nilai default kartu ini. Pengguna (masing-masing 8k) dan konteks maksimum berlaku untuk presisi tertinggi yang muat.",
    usableMemory: "memori yang dapat dipakai",
    answer: ({ models, bf16, int4 }) => `${int4} dari ${models} model muat pada INT4, ${bf16} pada BF16.`,
    h2Fit: (name) => `LLM yang muat di ${name}`,
    quantization: (href) => `Arti BF16, FP8, dan INT4 bagi memori: <a href="${href}">kuantisasi dan VRAM</a>.`,
    parallel:
      "Model yang tidak muat di satu kartu tetap dapat berjalan di beberapa kartu: paralelisme tensor membagi bobot dan cache KV-nya di antara kartu-kartu tersebut. Kalkulator menghitung berapa banyak yang dibutuhkan.",
    h2Size: (name) => `Hitung kebutuhan model di ${name}`,
    open: "Buka kalkulator dengan GPU ini",
    h2Others: "GPU lainnya",
  },

  hubs: {
    models: {
      title: "Kebutuhan VRAM LLM menurut model",
      description: (models) =>
        `Memori GPU untuk ${models} LLM terbuka populer — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — pada BF16 dan INT4, beserta GPU yang dapat menampungnya dan memori fine-tuning untuk masing-masing.`,
      h1: "Kebutuhan VRAM LLM menurut model",
      lede: (models) =>
        `Berapa banyak memori GPU yang dibutuhkan ${models} model terbuka populer, dihitung dari arsitektur masing-masing: bobot, cache KV, dan overhead pada BF16 dan INT4 untuk satu pengguna dengan konteks 8k. Setiap halaman merincinya menurut presisi dan konteks, mencantumkan GPU yang dapat menampungnya dan berapa pengguna yang muat, serta menambahkan memori fine-tuning.`,
      active: "aktif",
      thModel: "Model",
      thParams: "Parameter",
      thMaxContext: "Konteks maks.",
      note: "Satu pengguna, cache KV FP16, dan overhead vLLM pada satu GPU; model dengan konteks maksimum yang lebih pendek ditampilkan pada maksimum tersebut.",
      links: { size: "Hitung kebutuhan model Hugging Face apa pun", byGpu: "LLM yang muat di setiap GPU", memory: "Cara kerja memori LLM" },
    },
    gpus: {
      title: "LLM mana yang muat di GPU mana?",
      description:
        "LLM terbuka populer mana yang muat di RTX 4090, RTX 5090, H100, H200, B200, Apple seri M, Strix Halo, dan DGX Spark — pada BF16, FP8, dan INT4, dengan jumlah pengguna dan konteks maksimum.",
      h1: "LLM mana yang muat di GPU mana",
      lede: ({ models, gpus }) =>
        `Mana di antara ${models} LLM terbuka populer yang muat di ${gpus} GPU yang biasa dipakai orang untuk menjalankannya — kartu konsumen dan workstation, GPU pusat data, Apple Silicon, dan PC AI dengan memori terpadu. Setiap halaman mencantumkan semua model beserta memorinya pada BF16, FP8, dan INT4, berapa pengguna yang muat, dan konteks terpanjang yang dapat ditampung.`,
      thType: "Jenis",
      thUsable: "Dapat dipakai",
      thBf16: "Model pada BF16",
      thInt4: "Model pada INT4",
      note: (models) =>
        `Dari ${models} model, pada konteks 8k untuk satu pengguna. Kartu diskrit dianggarkan pada 92% memorinya (default vLLM), perangkat memori terpadu pada porsi yang dapat dialamatkan GPU-nya, masing-masing dengan overhead vLLM pada nilai default-nya sendiri.`,
      links: { size: "Hitung kebutuhan model di GPU apa pun", byModel: "Kebutuhan VRAM menurut model", memory: "Cara kerja memori LLM" },
    },
    concepts: {
      title: "Cara kerja memori LLM: cache KV, GQA, kuantisasi",
      description:
        "Istilah yang menentukan berapa banyak memori GPU yang dibutuhkan LLM — cache KV, grouped-query attention dan latent attention, kuantisasi — dijelaskan dengan model nyata dan angka hasil perhitungan.",
      h1: "Cara kerja memori LLM",
      lede: "Tiga panduan tentang istilah yang menentukan berapa banyak memori GPU yang dibutuhkan model bahasa. Masing-masing membahas model nyata, dan setiap angka di dalamnya dihitung oleh mesin yang sama dengan kalkulator.",
      links: { calculator: "Buka kalkulator", byModel: "Kebutuhan VRAM menurut model", byGpu: "LLM yang muat di setiap GPU" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Model",
      thLayers: "Lapisan",
      thShape: "Head KV × dimensi head",
      thPerToken: "Per token",
      attentionLink: "GQA, MQA, dan MLA",
      quantLink: "kuantisasi dan VRAM",
      text: (v) => ({
        title: "Ukuran cache KV: rumus dan contoh",
        description: `Seberapa besar cache KV sebuah LLM: rumusnya, contoh perhitungan dengan ${v.ex}, angka per token untuk model populer, dan pengaruh konkurensi, FP8, serta grouped-query attention terhadapnya.`,
        h1: "Ukuran cache KV: rumusnya, dengan model nyata",
        crumb: "Cache KV",
        summary: "Rumusnya, contoh perhitungan, angka per token untuk model populer, dan mengapa konkurensi melipatgandakannya sementara kuantisasi bobot tidak mengubahnya.",
        body: `<p class="lede">Saat model bahasa menghasilkan teks, model menyimpan kunci dan nilai yang telah dihitungnya untuk setiap token sebelumnya, di setiap lapisan, agar tidak perlu menghitungnya lagi untuk token berikutnya. Simpanan itulah yang disebut cache KV. Bagian memori GPU inilah yang diabaikan oleh perkiraan kasar, dan pada konteks panjang atau dengan banyak pengguna ukurannya melampaui bobot model.</p>
<h2>Rumusnya</h2>
<p>Untuk setiap token, setiap lapisan menyimpan satu vektor kunci dan satu vektor nilai per head kunci-nilai:</p>
<pre><code>byte KV per token = 2 × lapisan × head kunci-nilai × dimensi head × byte per nilai
cache KV          = byte KV per token × panjang konteks × urutan bersamaan</code></pre>
<p>Angka 2 menghitung kunci dan nilai. Satu nilai memakan 2 byte pada FP16 atau BF16 dan 1 byte pada FP8. Lapisan, head kunci-nilai, dan dimensi head ditetapkan oleh arsitektur — <code>num_hidden_layers</code>, <code>num_key_value_heads</code>, dan <code>head_dim</code> di config.json model — itulah sebabnya dua model berukuran sama dapat membutuhkan cache yang sangat berbeda. Model dengan multi-head latent attention mengganti bagian tengah rumus ini; lihat ${v.attention}.</p>
<h2>Contoh perhitungan: ${v.ex}</h2>
<p>${v.exLink} memiliki ${v.layers} lapisan, ${v.kvHeads} head kunci-nilai, dan dimensi head ${v.headDim}. Pada FP16 itu berarti 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} byte, atau ${v.perTok}, per token. Satu pengguna dengan 8k token membutuhkan cache ${v.kv8k}; pada konteks penuhnya sebesar ${v.exMax} token, ${v.kvMax} — ${v.kvOverWeights ? `lebih besar daripada bobot BF16-nya yang ${v.weights}` : `dibandingkan bobot BF16 sebesar ${v.weights}`}.</p>
<p>Jumlah parameter bukan penentunya. ${v.peerLink} dan ${v.exLink} berukuran hampir sama — ${v.peerParams} dan ${v.exParams} parameter — tetapi ${v.ex} menyimpan ${v.perTok} per token, sedangkan ${v.peer} menyimpan ${v.peerTok}: perbedaan ${v.ratio} yang berasal dari lapisan dan head kunci-nilai.</p>
<h2>Cache per token pada model populer</h2>
${v.table}
<p class="note">FP16, satu urutan. —: melebihi konteks maksimum model. DeepSeek V3 meng-cache vektor laten terkompresi, bukan kunci dan nilai per head. Gemma 2 dan gpt-oss tidak dicantumkan di tabel ini: lapisan sliding window-nya berhenti bertambah setelah mencapai ukuran jendela, sehingga biayanya per token menurun seiring bertambahnya konteks. Kalkulator menghitungnya lapisan demi lapisan.</p>
<h2>Konkurensi melipatgandakannya</h2>
<p>Setiap urutan bersamaan memegang cache-nya sendiri. Pada satu ${v.h100}, dengan ${v.h100Usable} yang dapat dipakai, ${v.ex} pada BF16 menyisakan ruang untuk ${v.users[0]} pengguna dengan masing-masing 8k token, ${v.users[1]} pada 32k, dan ${v.users[2]} pada 128k. Bobot menentukan batas bawahnya; cache menentukan berapa banyak orang yang muat di atasnya.</p>
<h2>Apa yang memperkecilnya, dan apa yang tidak</h2>
<ul class="plain">
<li><strong>Lebih sedikit head kunci-nilai.</strong> Grouped-query attention dan multi-query attention berbagi head kunci-nilai di antara head kueri, dan multi-head latent attention meng-cache vektor laten terkompresi. Ini bawaan model yang Anda pilih.</li>
<li><strong>Cache KV FP8.</strong> Satu byte per nilai, bukan dua, membagi dua ukuran cache. vLLM menyediakannya sebagai <code>--kv-cache-dtype fp8</code>; ini dapat mengurangi akurasi pada pekerjaan konteks panjang, jadi validasi terlebih dahulu.</li>
<li><strong>Batas konteks yang lebih rendah.</strong> Cache bertambah dengan setiap token yang dimuat sebuah urutan, sehingga membatasi panjang urutan — <code>--max-model-len</code> di vLLM — juga membatasi kasus terburuk.</li>
<li><strong>Bukan kuantisasi bobot.</strong> Bobot INT4 atau FP8 hanya memperkecil bobot; cache mempertahankan presisinya sendiri, sehingga penghematannya menyusut seiring bertambahnya konteks. Lihat ${v.quant}.</li>
<li><strong>Paged attention dan prefix caching</strong> memanfaatkan cache dengan lebih baik alih-alih memperkecilnya: memori dibagikan dalam blok seiring bertambahnya urutan, bukan dipesan di awal, dan permintaan dengan prefiks yang sama dapat berbagi bloknya. LLMScale tidak memodelkan efisiensi tersebut, sehingga angkanya adalah kebutuhan penuh.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Hitung cache KV untuk model Anda</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Kuantisasi dan VRAM</a></li>
  <li><a href="${v.modelsHref}">VRAM menurut model</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Model",
      thQueryHeads: "Head kueri",
      thKvHeads: "Head KV",
      thAttention: "Perhatian",
      thPerToken: "Per token",
      thVsMha: "vs MHA",
      kvLink: "ukuran cache KV",
      text: (v) => ({
        title: "GQA, MQA, dan MLA: perhatian dan ukuran cache KV",
        description: `Bagaimana multi-head, multi-query, grouped-query, dan multi-head latent attention mengubah cache KV sebuah LLM, dengan pembahasan ${v.gqaName} dan ${v.mlaName} serta ${v.models} model yang dibandingkan berdampingan.`,
        h1: "GQA, MQA, dan MLA: bagaimana perhatian menentukan cache KV",
        crumb: "GQA, MQA, dan MLA",
        summary:
          "Empat cara menyusun head self-attention, mengapa susunan itu mengubah cache hingga satu orde besaran, dan bagaimana latent attention DeepSeek mengeluarkan jumlah head dari rumus.",
        body: `<p class="lede">Cache KV berasal dari perhatian, dan cara model menyusun head self-attention-nya dapat mengubah cache hingga satu orde besaran pada jumlah parameter yang sama. Empat susunan mencakup model terbuka saat ini.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Setiap head kueri memiliki head kunci dan head nilainya sendiri, dan cache menyimpan semuanya: 2 × lapisan × head × dimensi head × byte per token. Ini adalah desain Transformer asli dan yang paling mahal untuk di-cache. ${v.mha} masih menggunakannya — ${v.mhaHeads} head dalam ${v.mhaLayers} lapisan, ${v.mhaTok} per token.</p>
<h2>Multi-query attention (MQA)</h2>
<p>Semua head kueri berbagi satu head kunci dan satu head nilai (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). Cache menyusut sebesar jumlah head seluruhnya — penghematan terbesar yang ada — tetapi berbagi satu set kunci dan nilai di semua head dapat menurunkan kualitas.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Head kueri dibagi ke dalam beberapa grup, dan setiap grup berbagi satu head kunci-nilai: lebih dari satu, tetapi lebih sedikit daripada jumlah head kueri. Ainslie dkk. (2023) mengusulkannya sebagai jalan tengah — kualitas mendekati multi-head attention, kecepatan mendekati multi-query — dan ${v.gqaCount} dari ${v.bundled} model yang disertakan LLMScale menggunakannya. ${v.gqa} mengelompokkan ${v.gqaHeads} head kueri ke ${v.gqaKvHeads} head kunci-nilai, sehingga model ini meng-cache ${v.gqaTok} per token, sedangkan multi-head attention akan membutuhkan ${v.gqaMhaTok}: ${v.gqaRatio} lebih sedikit.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 menempuh jalan lain. Alih-alih kunci dan nilai per head, setiap lapisan meng-cache satu vektor laten terkompresi per token, ditambah kunci kecil terpisah yang membawa pengodean posisi rotary. Cache per token menjadi <code>lapisan × (kv_lora_rank + qk_rope_head_dim) × byte</code>, dan jumlah head tidak lagi berperan. Untuk dimensinya sendiri, makalah DeepSeek-V2 (§2.1.3) menyetarakannya dengan ukuran GQA yang hanya memiliki 2,25 grup.</p>
<p>${v.mla} meng-cache ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} nilai per lapisan di ${v.mlaLayers} lapisan: ${v.mlaTok} per token, ${v.mlaRatio} lebih sedikit daripada hasil rumus per head. Pada konteks 8k, itu berarti ${v.mla8k}, bukan ${v.perHead8k}. Kalkulator yang menerapkan rumus per head pada model DeepSeek melebih-lebihkan cache sebesar faktor tersebut; LLMScale beralih rumus setiap kali sebuah konfigurasi memuat kedua field tersebut.</p>
<h2>Berdampingan</h2>
${v.table}
<p class="note">FP16. “vs MHA”: berapa kali lebih banyak yang akan di-cache oleh versi multi-head dari model yang sama.</p>
<h2>Artinya saat Anda memilih model</h2>
<ul class="plain">
<li><strong>Periksa head kunci-nilai sebelum jumlah parameter.</strong> ${v.small} dan ${v.big} berbeda ${v.pct}% dalam parameter dan ${v.sizeRatio} dalam cache per token.</li>
<li><strong>Susunan perhatian adalah bawaan model.</strong> Untuk memperkecil cache model yang Anda sajikan, pilihannya adalah cache KV FP8, konteks yang lebih pendek, atau lebih sedikit urutan — lihat ${v.kv}.</li>
<li><strong>Paralelisme tensor membagi head kunci-nilai ke beberapa GPU,</strong> sehingga kalkulator menyarankan jumlah GPU yang membaginya secara merata.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">Lihat susunan perhatian sebuah model</a></li>
  <li><a href="${v.kvHref}">Ukuran cache KV</a></li>
  <li><a href="${v.quantHref}">Kuantisasi dan VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Presisi",
      thBytes: "Byte / parameter",
      kvLink: "ukuran cache KV",
      text: (v) => ({
        title: "Kuantisasi LLM dan VRAM: BF16, FP8, INT4",
        description:
          "Berapa banyak memori GPU yang dipakai bobot BF16, FP8, INT8, dan INT4 untuk model 8B hingga 405B, apa itu AWQ, GPTQ, GGUF, MXFP4, dan NF4, dan mengapa mengkuantisasi bobot tidak mengubah cache KV.",
        h1: "Kuantisasi dan VRAM: BF16, FP8, INT8, dan INT4",
        crumb: "Kuantisasi",
        summary: "Byte per parameter dari FP32 hingga INT4, format yang akan Anda temui, mengapa 4-bit tidak tepat setengah byte, dan mengapa kuantisasi tidak menyentuh cache KV.",
        body: `<p class="lede">Kuantisasi menyimpan bobot model dalam lebih sedikit bit. Bobot biasanya merupakan bagian terbesar dari memori GPU, sehingga kuantisasi menjadi cara pertama yang biasa dicoba — tetapi kuantisasi hanya memperkecil bobot, dan setiap langkah turun mengorbankan sebagian akurasi.</p>
<h2>Byte per parameter</h2>
<p>Bobot memakan <code>parameter × byte per parameter</code>. BF16 dan FP16 adalah acuannya — sebagian besar model dirilis dalam salah satunya — dan setiap presisi lain merupakan kelipatannya.</p>
${v.table}
<p class="note">Hanya bobot, sebelum cache KV dan overhead. Pada FP8, INT8, dan INT4, embedding dan lapisan output tetap 16 bit.</p>
<h2>Format yang akan Anda temui</h2>
<ul class="plain">
<li><strong>BF16 dan FP16</strong> — floating point 16-bit. BF16 mempertahankan rentang FP32 dengan presisi lebih rendah, itulah sebabnya pelatihan dan sebagian besar checkpoint yang dirilis menggunakannya.</li>
<li><strong>FP8</strong> — floating point 8-bit, satu byte per bobot, didukung perangkat keras pada GPU NVIDIA terbaru (Ada Lovelace, Hopper, dan yang lebih baru). Beberapa model dirilis dengan checkpoint FP8.</li>
<li><strong>INT8</strong> — bilangan bulat 8-bit dengan faktor skala, satu byte per bobot.</li>
<li><strong>AWQ dan GPTQ</strong> — metode 4-bit khusus bobot: bobot disimpan dalam 4 bit dan dihitung dalam 16 bit. Keduanya didistribusikan sebagai safetensors dan ditujukan untuk mesin inferensi GPU seperti vLLM.</li>
<li><strong>GGUF</strong> — format file llama.cpp, dengan tingkat kuantisasi yang dinamai menurut jumlah bit (Q4, Q5, Q8…), dipakai di CPU, Apple Silicon, dan GPU konsumen.</li>
<li><strong>NVFP4 dan MXFP4</strong> — format floating point 4-bit dengan skala bersama. gpt-oss merilis bobot ahlinya dalam MXFP4, itulah sebabnya ${v.oss} muat di satu GPU 80 GB: ${v.ossNeed} pada konteks 8k untuk satu pengguna, dibandingkan ${v.h100Usable} yang dapat dipakai pada ${v.h100}.</li>
<li><strong>NF4</strong> — NormalFloat 4-bit milik QLoRA, untuk melakukan fine-tuning adaptor di atas model dasar yang dibekukan dan dikuantisasi.</li>
</ul>
<h2>Mengapa 4-bit tidak tepat setengah byte</h2>
<p>Format 4-bit yang sebenarnya juga menyimpan faktor skalanya — skala 16-bit untuk setiap grup 128 bobot pada AWQ dan GPTQ, skala 8-bit untuk setiap blok 32 bobot pada MXFP4 — sehingga totalnya sekitar 4,25 bit per bobot, dan format ini mempertahankan embedding dan lapisan output pada 16 bit. LLMScale memperhitungkan keduanya, sehingga angka 4-bit-nya jauh di atas setengah BF16: Qwen2.5-7B berada dalam selisih 2% dari checkpoint AWQ milik Qwen sendiri, dan Qwen3-8B pada FP8 cocok dengan checkpoint FP8 milik RedHat hingga seperseratus GiB. Checkpoint yang sudah dikuantisasi saat dirilis dihitung dari file-nya sendiri. NF4 milik QLoRA dengan kuantisasi ganda terukur 4,127 bit, atau 0,516 byte, per parameter, dan itulah angka yang dipakai kalkulator fine-tuning.</p>
<h2>Kuantisasi tidak memperkecil cache KV</h2>
<p>Cache KV memiliki presisinya sendiri, yang ditetapkan oleh mesin inferensi, bukan oleh format bobot. Ambil contoh ${v.long} dengan satu pengguna pada konteks 128k: bobotnya memakan ${v.longBf16} pada BF16 dan ${v.longInt4} pada INT4, sementara cache KV tetap ${v.longKv} dalam FP16${v.kvOverInt4 ? " — lebih besar daripada bobot INT4" : ""}. Menyimpan cache dalam FP8 adalah pilihan terpisah yang membaginya dua; lihat ${v.kv}.</p>
<h2>Model mixture of experts (MoE)</h2>
<p>Setiap ahli dikuantisasi, dan setiap ahli tetap harus berada di memori. ${v.moe} memiliki ${v.moeParams} parameter: ${v.moeBf16} bobot pada BF16, ${v.moeInt4} pada INT4. Parameter aktifnya yang berjumlah ${v.moeActive} menentukan seberapa banyak pekerjaan yang dilakukan setiap token, bukan seberapa banyak memori yang dipakai model.</p>
<h2>Memilih presisi</h2>
<ul class="plain">
<li><strong>Mulai dari yang muat.</strong> Ketika model tidak lagi muat di sebuah kartu, kalkulator menyebutkan presisi lebih ringan pertama yang membuatnya muat.</li>
<li><strong>Ukur biayanya.</strong> Setiap langkah turun menukar akurasi dengan memori, dan besarnya bergantung pada model dan metodenya; uji pada tugas Anda sendiri sebelum menyajikannya.</li>
<li><strong>Biarkan checkpoint yang sudah dikuantisasi berbicara sendiri.</strong> LLMScale membaca presisinya dari <code>quantization_config</code>, nama repositori, atau header safetensors, dan vLLM memuat checkpoint AWQ, GPTQ, dan FP8 tanpa flag <code>--quantization</code>.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Bandingkan presisi untuk model Anda</a></li>
  <li><a href="${v.kvHref}">Ukuran cache KV</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA, dan MLA</a></li>
  <li><a href="${v.gpusHref}">LLM yang muat di setiap GPU</a></li>
</ul>`,
      }),
    },
  },
};

export default id;

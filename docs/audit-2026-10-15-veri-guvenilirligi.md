# LLMScale veri güvenilirliği denetimi — 2026-10-15

Durum: **bulgular tamam, düzeltmeler planlanacak** (koda dokunulmadı). Canlı sürüm: main `328d0d5`, gh-pages `1561135`.

## Kapsam ve yöntem

| Alan | Nasıl | Hacim |
|---|---|---|
| Canlı sayfalar | Tarayıcı: sitemap'teki tüm sayfalar + 12 uygulama sayfası EN/TR, telefon genişliği | 132 statik sayfa, 24 uygulama yüklemesi |
| Elle sağlama | 6 senaryo, uygulama kodu kullanmadan Python'da yeniden hesap | Llama 8B/70B, Qwen3-30B, DeepSeek V3/V4 |
| Motor tutarlılığı | Özellik tabanlı tarama (monotonluk, ters hesap, sayfalar arası, URL fuzz, i18n) | ~400 bin kombinasyon |
| KV/ağırlık ↔ vLLM 0.31 | vLLM kaynağından bağımsız yeniden hesap, ~50 config, 36 checkpoint | 25+ mimari ailesi |
| Model verisi | Uygulamanın kendi çözücüsüyle 273 HF reposu; 26 preset alan alan | 273 repo |
| GPU, hız, ek yük | 36 yayınlanmış ölçüm, 23 gerçek vLLM açılış logu, 43 cihaz | 43 cihaz |

Ayrıntı tabloları: [`docs/audit-2026-10-15/`](audit-2026-10-15/) — 273 repo tablosu, KV↔vLLM tabloları, GPU/hız tabloları, 36 yayınlanmış ölçüm (kaynaklı), 23 vLLM açılış logu. Tarama betikleri GTR9'da: `~/projects/LLMScale-audit-{inv,kv,models,gpu}/audit/`.

## Temiz çıkanlar (güvenebileceğimiz kısım)

- **Sayfalar:** 132 sayfa 200, metinde NaN/undefined/negatif yok; 24 uygulama yüklemesinde JS hatası 0; 375 px'te yatay taşma yok.
- **Elle sağlama:** 6 senaryonun 5'i birebir (fark yalnız yuvarlamadan); biri (C) bulgu çıkardı, düzeltildi (ama bkz. A1).
- **Motor:** toplamlar, ters hesaplar (max kullanıcı / max context), hız ve TTFT monotonluğu, planlayıcı, eğitim tahmini, ~1,2 milyon durumda yerleşim tutarlılığı — hepsi tuttu. EN/TR 1.226 anahtar eşleşiyor.
- **KV formülleri:** sade GQA/MHA (±%2), Gemma 2/3 kayan pencere, gpt-oss, Llama 4 (vLLM 0.31 varsayılanı tam sayar), Qwen3-Next, Granite 4.0-H, MLA (DeepSeek V3, Kimi K2), DSA satır boyutları.
- **Ağırlıklar:** BF16/FP8/AWQ/GPTQ/W4A16/W8A8/NVFP4/MXFP4 checkpoint'leri dosya baytından kesin; FP8 ve INT4 tahminleri gerçek dosyaların %5 içinde.
- **GPU verisi:** 43 cihazın BF16/FP8/FP4 TFLOPS'u kaynaklı tabloyla birebir; AMD toplamları kesin; vLLM 0.31 batch varsayılanları ve 0,92 payı doğru; ek yük tek kartta gerçek loglara 0,13 GiB içinde.
- **Preset'ler:** 26 paket modelin sizing alanlarının hepsi gerçek config'lerle birebir.
- **Tek kart, dense hız:** yayınlanmış ölçümlerin 0,85–1,17× içinde.

## Bulgular

Önem: **Kritik** = popüler bir model/kurulumda gösterilen sayı ciddi yanlış · **Yüksek** · **Orta** · **Düşük**.
Efor: **S** < yarım gün · **M** 1–2 gün · **L** 3+ gün. Kaynak kodlar ajan raporlarındaki kimliklerdir (I = tutarlılık, K = KV/vLLM, M = model verisi, G = GPU/hız, B = tarayıcı).

### A. Durum ve sayfalar arası tutarlılık

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| A1 | **Kritik** | URL modelin context sınırını (`maxContext`) yazmıyor; yenileme ve paylaşılan linkte sınır kayboluyor | "Max context / user" sınırı aşıyor: Qwen3-30B 40.960 → 81.104 (canlıda doğrulandı), Gemma 2 9B 8.192 → 310.400; "model max" ipucu kayboluyor. 43 modelin hepsi | `encodeState`'e `mc` ekle, `decodeState` ve preset doldurma listesine al; eski linkler için preset'ten geri doldur; round-trip testi | S | I-1 |
| A2 | Yüksek | Model rehberleri ve haber kartları kart sayısını yalnız TP ile (`cardsFor`), yetmezse "toplam ÷ kart" ile hesaplıyor | Gösterilen 12 sayıdan 10'u hesaplayıcıdan farklı: DeepSeek V3 BF16 "32× H100" ↔ 20; Llama 405B "16× H100" ↔ 12 | `cardsFor` → `layoutFor`; metni "en az kart" diye düzelt | S | I-2 |
| A3 | Yüksek | vLLM sayfası yalnız TP öneriyor ve sayıyor | 990 durumun 491'inde hesaplayıcıyla çelişiyor; V4 + 4× H200'de `TP 4` öneriyor, hesaplayıcı başka düzen; V4'e özgü bayraklar yok (`--block-size 256`, FP8 KV, isteğe bağlı FP4 indexer) | `recommend()` hesaplayıcının `layoutsOn` düzenini kullansın (PP/DP/EP bayrakları); model tipine özel bayraklar | M | I-3, B |
| A4 | Orta | Kapasite planlayıcı yalnız TP kopyalarını deniyor | Hesaplayıcının PP/EP düzenleriyle tutarsız | `planOptions` düzen kümesini `layoutsOn` ile ortaklaştır (D2 ile birlikte) | M | B |
| A5 | Orta | "N gerekir" rozeti ile ×N seçici farklı arama uzayı kullanıyor (PP ≤ 16, EP eşit bölme yalnız rozette) | %5,3 durumda küçük ×N "sığar" derken rozet daha fazlasını istiyor (Mixtral'da ×15 sığar, rozet 16) | İki fonksiyona aynı kuralları ver | S | I-4 |
| A6 | Orta | MIG dilimi seçiliyken çoklu kart düzeni öneriliyor | `--tensor-parallel-size N` öneriyor; vLLM MIG arası TP desteklemez | MIG'de düzen yerine "bu dilime sığmıyor, daha büyük profil seç" | S | I-5 |
| A7 | Orta | Birleşik bellekli cihaz kartlarında "N× gerekir" yazıyor | Apple M4'te "8× gerekir" (ikinci cihaz eklenemez) | Birleşik cihazlarda düzen hesaplama | S | I-6 |
| A8 | Orta | Model sınırının üstündeki context sessizce hesaplanıyor | "256k'da 1 kullanıcı" yanında "max context 131.072" | Hesaplayıcıda da `ctxcap` uyarısı; sınır üstü hazır değerleri soluk göster | S | I-7 |
| A9 | Orta | GPU rehber sayfaları "%5 sürücü payı" diyor | Gerçek pay %8 (0,92); 28 sayfa | Metni düzelt | S | I-8 |
| A10 | Düşük | Worst-case "max kullanıcı" `--max-num-seqs` ile kapanmıyor, "tipik" kapanıyor | Yan yana çelişki gibi okunuyor (Llama 3.2 1B: 299 vs sınır 256) | Kapat ya da "KV yeri" diye etiketle | S | I-10 |
| A11 | Düşük | URL girdileri doğrulanmıyor | `wd=fp4` → "NaN GiB"; negatif `ctx`/`n` → negatif GiB | Dtype beyaz listesi, pozitif tam sayı zorunluluğu | S | I-11 |
| A12 | Düşük | Karşılaştırma sayfası her modeli 8k'da ölçüyor | Phi-3 mini 4k sınırının 2 katında | `min(8192, maxContext)` | S | I |

### B. Config okuma ve mimari kapsamı

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| B1 | **Kritik** | Gemma 4: global katmanların `global_head_dim` (512) ve `num_global_key_value_heads` (1–4), `attention_k_eq_v`, E2B/E4B'deki KV paylaşımı ve 26B-A4B'nin MoE yapısı (`top_k_experts`) okunmuyor | KV 128k'da 31B/26B +%72, 12B +%168 fazla; 26B MoE dense sanılıyor → hız ~6,8× yavaş, EP'de expert yok. 2026'nın en çok indirilen modelleri (26B 11M, 31B 9M) | Katman tipine göre (heads, head_dim) taşıyan KV düzeni; `kvLayout` eşit olmayan sayfaları desteklesin; `top_k_experts` oku | M–L | K-1, M-1, K-15 |
| B2 | **Kritik** | GLM-5.3-Flash: `qk_rope_head_dim: 0` yüzünden MLA tanınmıyor; KDA lineer katman durumu yok | KV ~16× fazla (32k'da 5,5 vs ~0,35–0,5 GiB); 6,5M indirme | `usesMla` `kv_lora_rank` ile açılsın, rope 0'a izin; KDA durumu | S–M | M-2 |
| B3 | **Kritik** | Nemotron NAS (Super-49B v1.5, 51B): `num_key_value_heads` boş, `block_configs` okunmuyor | KV ~13× fazla (32k'da 80 vs 6,1 GiB); TP geçerliliği de yanlış | `block_configs`'tan katman başına attention/KV head | M | M-3 |
| B4 | Yüksek | KV head farklı yazımları okunmuyor: `n_head_kv`, `multi_query`, `multi_query_group_num`, `num_attention_groups`; Step-3.5 `layer_types` MTP girdilerini de sayıyor | Falcon-7B 71×, StarCoder/santacoder 16–48×, GLM-4-9B 16×, Step-3.5-Flash 6× fazla KV | vLLM'in öznitelik listesini aynala; `layer_types`'ı ilk `num_hidden_layers` ile kes | S | K-5, M-4 |
| B5 | Yüksek | Hibrit / yerel düzenler okunmuyor: Kimi-Linear (`linear_attn_config`), MiMo-V2 (`hybrid_layer_pattern`), MiniMax-Text (`attn_type_list`), Jamba (`attn_layer_period`), Falcon-H1 (her katmanda attention + Mamba), Gemma 3n (KV paylaşımı), mllama (cross-attention) | KV 1,25–14× fazla; Jamba'da Mamba durumu yok; Falcon-H1'de durum yok (4k'da −%48) | Kısa vade: bilinmeyen cache anahtarı görülünce "bu mimari tam modellenmedi" uyarısı (parse güveni). Orta vade: aile aile modelle | S + L | K-4, K-7, M-5 |
| B6 | Yüksek | Paket listesinde olmayan gated modeller (Gemma 3, Llama 3.1 70B, Llama 4, Gemma 3n, Command A/R…) 32 katmanlı yer tutucuyla hesaplanıyor; GGUF/türev repolarda base modelin paket girdisine bakılmıyor | Uyarı var ama sayılar gerçek gibi: Gemma 3 1B KV 4,0 vs 0,23 GiB; Llama 3.1 70B 2,5× eksik; bartowski Llama GGUF'ları yer tutucuda | Base modelin paket girdisini kullan; açık ayna config'i dene (`unsloth/…`); eksik preset'leri ekle; yer tutucu sonucunu "gerçek değil" diye göster | M | M-6 |
| B7 | Yüksek | Karışık hassasiyetli checkpoint'te yalnız `config_groups.group_0` okunuyor; paketli 4-bit parametre sayısı base model bulunamazsa düzelmiyor | nvidia Qwen3.6-35B-A3B-NVFP4 (4,6M): 18,7B param görünüyor, BF16 alternatifi 34,8 vs ~67 GiB; RedHatAI Llama 70B NVFP4: 40,6B | Tüm grupları oku; `dtypeParams`'tan aç (U8×2, I32×8) | M | K-11, M-7 |
| B8 | Orta | Model düzeyinde (katmansız) `sliding_window` yok sayılıyor | Mistral-7B v0.1 32k'da 4,0 vs ~1,0 GiB; zephyr, starcoder2 ~2× | `layer_types` yoksa tüm katmanlar kayan sayılsın (vLLM gibi) | S | K-6, M-9 |
| B9 | Orta | Config'teki çıplak `Infinity` JSON çözümünü kırıyor | Nemotron-H 8B/47B/56B ve Nano-12B-v2 hiç okunamıyor (canlıda doğrulandı) | Metni `Infinity`/`NaN` düzelterek çöz | S | K-8, M-12 |
| B10 | Orta | `tie_word_embeddings` yoksa "bağlı değil" sayılıyor | Gemma 2 9B INT4 tahmini +%21, Gemma 3 1B +%46 | Aile varsayılanını kullan (Gemma, GPT-2, Falcon bağlı) | S | M-11 |
| B11 | Orta | Okunmayan yazımlar ve NaN: OPT (`paramsFromName` "M"yi bilmiyor → 7B görünüyor), Bloom `n_embed`, MPT `n_layers`, llava'nın varsayılanlı text config'i, Qwen-Omni `thinker_config`, DeepSeek-VL2/Janus `language_config`; Gemma 3n `intermediate_size` dizi → NaN | facebook/opt-125m (5,9M) 7B sanılıyor; Gemma 3n NaN | Yazım listesini genişlet; dizi alanlarını katman bazında oku | M | M-12 |
| B12 | Orta | FP8 base config taşıyan GGUF repoları FP8 boyutlandırılıyor | unsloth DeepSeek-V3-0324-GGUF 671 GB, Kimi-K2 GGUF ~1 TB | GGUF adını/dosyasını config'in üstüne koy | S | M-13 |
| B13 | Düşük | Max context uç durumları | Kimi-Linear yok; Qwen-7B-Chat 32.768 vs 8.192; internlm3 32.768 vs 196.608; Mistral Nemo preset 128.000 vs 131.072 | Tek tek düzelt | S | M-14 |
| B14 | Düşük | Preset meta verisi eski | Mistral 7B, Nemo, Mixtral "gated" işaretli ama artık açık; V3 param sayısı MTP dahil (+%2) | Güncelle | S | M-15 |
| B15 | Düşük | vLLM 0.31'in artık desteklemediği modeller (Llama 3.2 Vision, MiniMax-Text-01/M1) uyarısız hesaplanıyor | Kullanıcı çalışmayacak bir kurulum planlayabilir | "vLLM 0.31'de desteklenmiyor" uyarısı | S | K-14 |

### C. KV ve ağırlıkta vLLM 0.31 uyumu

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| C1 | Yüksek | SSM durumu 2 bayt sayılıyor; vLLM NemotronH'de ve Qwen3.5'te (config `mamba_ssm_dtype: float32`) fp32 tutuyor | Cache 4k'da %28–40 eksik, eşzamanlı kullanıcı o kadar fazla (Nemotron 3 Nano, Qwen3.5-35B/397B/27B) | Conv ve SSM parçalarını ayır; SSM dtype'ı config'ten oku, NemotronH için fp32 | S–M | K-2 |
| C2 | Yüksek | Varsayılan KV hassasiyeti vLLM'inkinden farklı | ModelOpt checkpoint'lerinde (`hf_quant_config.json`, `kv_cache_quant_algo: FP8`) vLLM FP8 kullanır, uygulama BF16 gösterir → 2× fazla; compressed-tensors `kv_cache_scheme`'de tersi → 0,5× | vLLM kuralını izle; "vLLM varsayılanı" ipucu | S | K-3 |
| C3 | Orta | DSA satır boyutu karta bağlı | RTX 50 / PRO 6000'de (SM120) auto zaten fp8_ds_mla → BF16 gösterimi +%63; B200 FP8'de ~%11 fazla | Kart ailesine göre DSA satırı | M | K-9 |
| C4 | Orta | Çok modlu modellerde görüntü kodlayıcının profil belleği ve encoder cache ek yükte yok | Tahmini 0,5–3 GiB/GPU eksik (Qwen-VL, Gemma 3/4, Mistral-Small, Llama 4) | Kodlayıcı terimi; bir VL logu ile kalibre et | M | K-10 |
| C5 | Orta/Düşük | INT4 "ne olurdu" tahmini 4,25 bit; gerçek checkpoint'ler 4,5 bit (grup 32, NVFP4) ve korunan modüllerle daha büyük | gemma-4-31B −%20, Llama 70B NVFP4 −%5, Q4_K_M −%8 | Formata göre bit (4,5 vb.) ve korunan modül payı | S | K-12 |
| C6 | Düşük | MTP/DSpark katmanları ağırlığa sayılıyor; vLLM spekülatif kod çözme yoksa yüklemiyor | DeepSeek-V3/V3.2, GLM-4.5-Air, Qwen3.5'te +%2–3 | Spekülatif açık değilse MTP tensörlerini düş | S | K-13 |

### D. Hız modeli

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| D1 | **Kritik** | Decode hızı MoE ve kısa adımlı kurulumlarda çok yüksek: model saf bant genişliği tavanı, adım başı sabit maliyet ve MoE verimsizliği yok | gpt-oss-20b RTX 5090: 649 vs 282 tok/s; gpt-oss-120b PRO 6000: 514 vs 196; Qwen3-30B-A3B AWQ GTR9: 108 vs 31,8 (vLLM, senin ölçümün); Llama 8B FP8 H200 1,77× hızlı | Adım tabanı (sabit + katman başı) ve MoE verim katsayısı; ölçümle kalibre. O zamana kadar "üst sınır" etiketi | M + ölçüm | G-1 |
| D2 | **Kritik** | Planlayıcı çoklu kartta bant ve FLOPS'u kart sayısıyla çarpıyor, iletişim maliyeti yok | Llama 70B FP8 4× H100: 2,09×, 8× H100: 3,0× hızlı; gpt-oss-120b 8× B200: 41× | Katman başı all-reduce gecikmesi + D1 tabanı; o zamana kadar çoklu kart hızını "üst sınır" işaretle | M | G-2 |
| D3 | Yüksek | Aktif parametre hataları | Hunyuan-A13B (`moe_topk`) 80,4 vs 13B, ERNIE 4.5 (`moe_k`) dense sanılıyor; MTP/n-gram tabloları aktif sayılıyor: DeepSeek-V4-Flash 27,4 vs ~13B, Qwen3.8-Flash-Next 61,6 vs 6B; paketli sayıdan hesap (Qwen3-Coder AWQ 1,76 vs 3,3B) | Eksik top-k anahtarlarını oku, MTP'yi düş, `sizeShipped` sonrası yeniden hesapla | M | M-8 |
| D4 | Düşük | TTFT'de sabit taban yok | Kısa istemlerde 3–4× hızlı (Qwen3-0.6B 512 token: 11 vs 44,5 ms) | Sabit taban terimi | S | G-10 |

### E. Bellek bütçesi ve ek yük

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| E1 | Yüksek | Çoklu kart ve büyük MoE'de ek yük düşük; NCCL 0,5 GiB muhtemelen çift sayılıyor | Qwen3-235B FP8 TP4: 1,52 vs 7,66 GiB/GPU → KV %78 fazla; DeepSeek-V3.2 8× H200 DP+EP: ~1,4 vs ~10; gpt-oss-120b TP2: 2,40 vs 4,43 | EP/all-to-all ve MoE çalışma alanı terimi; NCCL'yi bütçe içinden çıkar; loglarla kalibre | M | G-3 |
| E2 | Yüksek | Birleşik bellekte 0,92 payı hesaplayıcıda uygulanmıyor (vLLM sayfasında uygulanıyor) | Strix Halo 96 vs 88,3 GiB; DGX Spark 120 vs 111,9 (pratikte 0,8 → 97,3); hesaplayıcıyla vLLM sayfası farklı karar | Payı birleşik cihazlara da uygula; Spark toplamı 121,6; "Spark pratikte 0,8" uyarısı | S | G-4, I-9 |
| E3 | Orta | ECC'li GDDR veri merkezi kartları nominal boyutla sayılıyor | L40S 48 → 44,4 GiB (−%7,6), L4, T4; Llama 3.3 70B AWQ tek L40S'te "sığar" diyor, vLLM'de sığmaz | Kartın gerçek toplamı ya da ECC ×15/16 | S | G-6 |
| E4 | Orta | MoE preset'lerinde `moeIntermediateSize` eksik → profil ek yükü fazla | Qwen3-30B H100'de 4,17 vs 1,75 GiB; DeepSeek V3 8× H200'de +0,9 GiB (statik sayfalar) | Qwen3 için 768, DeepSeek V3 için 2048 | S | M-10, G-7 |
| E5 | Orta | gpt-oss-120b vLLM'de uygulamanın varsaydığından büyük yükleniyor | Loglar 31,4 GiB/GPU (H100 TP2) vs uygulama 29,7; GH200'de 64,4 vs 59,4 | Kaynağını bul (MXFP4 dışı kalan katmanlar?), düzelt | S–M | G-3 |
| E6 | Düşük | MIG dilim boyutları adı GiB sayıyor; compute bellek oranıyla ölçekleniyor | %2–4 fazla bellek; 1g.20gb'ye compute'un 1/7'si yerine 1/4'ü | Gerçek dilim boyutları ve SM oranı | S | G-11 |

### F. GPU verisi

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| F1 | Yüksek | "H100 (SXM/PCIe)" tek kayıt ve SXM rakamlarını kullanıyor | PCIe kullanıcısına decode 1,68×, prefill 1,31× hızlı | İki ayrı kayıt | S | G-5 |
| F2 | Orta | V100 vLLM 0.31'de desteklenmiyor (CC 7.0 < 7.5), ama öneriliyor | Çalışmayacak kurulum | Hariç tut ya da uyar | S | G-8 |
| F3 | Orta | Veri merkezi katındaki RTX PRO 6000 Workstation bandını kullanıyor | Server Edition 1.597 GB/s; decode %12 hızlı | Ayrı kayıt ya da Server değeri | S | G-9 |
| F4 | Açık soru | DGX Spark'ta NVML belleği "Not Supported" diyor; vLLM küçük batch varsayılanına düşebilir | Doğrulanmadı | Spark logu bul ya da ölç | — | G |

### G. Servis ve vLLM sayfası içerik doğruluğu

| ID | Önem | Bulgu | Etki | Önerilen çözüm | Efor | Kaynak |
|---|---|---|---|---|---|---|
| G1 | Yüksek | Servis sayfası V4'ün ölçek tensörlerini (`.scale`, 35.718 adet) tanımıyor | "Base model; FP8 bildirimi muhtemelen kopyalanmış, ağırlıklar kuantize değil" diyor — yanlış (expert'ler FP4, ölçekler UE8M0) | `.scale` ve `F8_E8M0` ölçeklerini tanı; V4 "encoding" klasörünü chat yolu say | S | B |
| G2 | Orta (güven orta) | V4 için "`--chat-template` ver" önerisi eksik | vLLM 0.31'de `deepseek_v4` tokenizer/renderer var ama "auto" onu seçmiyor; doğru öneri `--tokenizer-mode deepseek_v4` olabilir | Doğrula, sonra öneriyi güncelle | S | B |

## Önerilen uygulama planı

| Faz | İçerik | Tahmini süre | Neden bu sırada |
|---|---|---|---|
| **1 — Hızlı düzeltmeler** | A1, A2, A5–A9, A11, B2, B4, B8, B9, B10, B12, C2, E2, E3, E4, F1–F3, G1 + hız için "üst sınır" etiketi (D1/D2 geçici) | 2–3 gün | Çoğu S; kritik A1 ve B2 burada; yanlış sayı üreten basit okuma hataları kapanır |
| **2 — Mimari kapsamı** | B1 (Gemma 4), B3 (NAS), B5 (hibritler) + "parse güveni" uyarısı, B6 (gated yer tutucu), B7, B11, C1, C3, D3 | 1–1,5 hafta | `kvLayout`'un katman tipine göre şekil desteği ortak altyapı; en çok indirilen 2026 modelleri |
| **3 — Ölçümle kalibrasyon** | D1, D2, D4 (hız tabanı, MoE verimi, iletişim), E1 (ek yük), E5, C4; A3/A4 (vLLM sayfası ve planlayıcı düzenleri) | 1 hafta + ölçüm | Ölçüm verisi gerekir |
| **4 — Kalıcı güvence** | 273 repo önbelleğinden regresyon testi; URL round-trip ve sayfalar arası tutarlılık testleri `test:all`'a; aylık vLLM sürüm farkı kontrolü | 2–3 gün | Aynı sınıf hataların geri gelmesini önler |

## Ölçüm kampanyası önerisi (Faz 3 için)

1. **X570 — RTX 4070 Ti, vLLM 0.31** (oyun dışı saatte `ai-on`): küçük bir MoE (granite-3.1-3b-a800m) ve Qwen3-1.7B'de batch 1–64 decode; 64–4k token TTFT. D1 tabanı ve MoE verimi için.
2. **GTR9 — Strix Halo, vLLM ROCm**: `torch.cuda.mem_get_info()`, vLLM 0.31 açılış logu (bütçe ve KV satırları), Qwen3-30B-A3B AWQ ve dense 8B batch 1/8/32. E2 ve D1 için.
3. **Çoklu kart** (D2, E1): bu iki makinede ölçülemez; yayınlanmış loglar ya da bir saatlik 2×/4× H100 kiralama.

## Açık kararlar (planlamada netleşecek)

1. Kalibrasyon bitene kadar hız tahminleri: "üst sınır" etiketi mi, gizleme mi? — Önerim: etiket.
2. Modellenmemiş mimarilerde sayı: uyarıyla göster mi, gösterme mi? — Önerim: uyarı + "tam modellenmedi" rozeti.
3. Gated eksik modeller için açık ayna config'i (`unsloth/…`) okumak kabul mü? — Önerim: evet, yalnız config.
4. Ölçüm kampanyası (X570 `ai-on`, GTR9 vLLM ROCm) — zaman ve onay.

## Faz 3b sonucu (2026-10-16/17)

Ölçüm kampanyası X570'te (RTX 4070 Ti, vLLM 0.31.0) yapıldı; ham ölçümler ve yöntem
[`audit-2026-10-15/olcum-kampanyasi-2026-10-16.md`](audit-2026-10-15/olcum-kampanyasi-2026-10-16.md), testler
`scripts/test-audit3.ts`.

| ID | Durum |
|---|---|
| D1 | Kalibre: adım başına katman maliyeti (0,065 ms), bant verimi %92, KV okuma %75; MoE'de bayt hesabı düzeltildi (MXFP4'te BF16 dikkat, untied giriş embedding'i okunmaz), Marlin MoE'ye katman başı 0,08 ms. Ayrı MoE katsayısı veriyle desteklenmedi. X570'te tek GPU decode %10 içinde. |
| D4 | Kalibre: istek başı 6 ms + geçişin katman maliyeti; prompt FLOP'undan embedding ve son token dışı çıkış katmanı düşüldü. Qwen3-0.6B 512 token: 8,9 → 14,5 ms (ölçüm 15,7). MoE prompt okuması üst sınır (K13). |
| D2 | Yayınlanmış verilere uyduruldu: katman başına iki all-reduce × 0,014 ms; 2/4/8 GPU'lu 6 ölçümün hepsi %14 içinde (önce 1,4–4,3× hızlı). |
| E1 | Etiketlendi: NCCL'in çift sayıldığına dair kanıt yok; çok GPU'lu büyük MoE ek yükü "alt sınır" notuyla gösteriliyor. |
| E5 | Düzeltildi: MXFP4'te yalnız expert'ler 4-bit; vLLM 0.31'in kart ailesine göre expert dolgusu. H100 TP2 31,02 (log 31,36), A100 TP2 34,31 (34,38), L40S 13,70 (13,72). |
| C4 | Kalibre: görüntü kodlayıcı profil geçişi (patch × genişlik × 23 bayt, bütçeye sığan öğe sayısı kadar); Qwen2.5-VL-3B ve Gemma 3 4B loglarına 0,2 GiB içinde. |

Açık: GTR9 (Strix Halo, vLLM ROCm) ölçümü kullanıcı onayı bekliyor; AMD/birleşik bellek hızları üst sınır etiketinde.

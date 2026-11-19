# Çok dilli LLMScale — teknik spec

Durum: **SPEC ONAYLI** (2026-11-19) · D1 ve D10 verildi: en çok konuşulan ilk 10 dil, 4. dalgada ru, de, ja · D11: Dalga 3 (ar, ur) plan dışı, hedef 12 dil · PR 0 sürüyor.

## 1. Hedef ve başarı ölçütü

LLMScale'i İngilizce + Türkçe'den dünyada en çok konuşulan 10 dile ve LLM konusunun kendi dilinde en çok okunduğu üç
dile (Rusça, Almanca, Japonca) açmak. Arapça ve Urduca plan dışı (D11, 2026-11-19): en çok konuşulan 10 dilden 8'i ve bu
üç dil, mevcut Türkçe ile 12 dil. Her dilde arama motorları ve AI asistanları siteyi o dilde bulup önerebilsin.

Başarı ölçütü:
- **PR 0 (altyapı):** `typecheck` ve `test:all` geçer. Yalnız en ve tr açıkken prerender çıktısı dil menüsü dışında
  öncekiyle aynıdır (HTML diff). 5 sayfa × 2 dil ekran görüntüsü öncesiyle aynıdır.
- **Her dalga:** yeni dilin 5 sayfasında `audit.py` temiz: ≥150 kelime, tek H1, description, canonical, tam hreflang
  kümesi, JSON-LD `inLanguage`, `dateModified`. 375 px genişlikte yatay kaydırma yok. `test-i18n` geçer. Yayından
  önce o dilde AI görünürlük baz ölçümü alınmıştır.
- **Sonuç (yayından sonra, aylık):** Search Console'da dil önekine göre gösterim ve tıklama; dil başına AI ölçümü.

## 2. Dil seti (D1 ve D10, kullanıcı kararları 2026-11-19)

Ethnologue 2026'ya göre toplam konuşanı en çok olan 10 dil, mevcut Türkçe ve 4. dalgada Rusça, Almanca, Japonca: 14 dil.
Arapça ve Urduca (Dalga 3) 2026-11-19'da plandan çıktı (D11): hedef 12 dil. İkisi `LANGS` ve `LANG_META`'da tanımlı ve
kapalı kalır; karar geri alınırsa §3.5 uygulanır.

| Kod | Dil | Önek | hreflang ve `lang` | Yön | Yazı | Dalga |
|---|---|---|---|---|---|---|
| en | English | kök | `en` | ltr | Latin | mevcut |
| tr | Türkçe | `/tr/` | `tr` | ltr | Latin | mevcut |
| zh | 简体中文 | `/zh/` | `zh-Hans` | ltr | Han | 1 |
| hi | हिन्दी | `/hi/` | `hi` | ltr | Devanagari | 1 |
| es | Español | `/es/` | `es` | ltr | Latin | 1 |
| fr | Français | `/fr/` | `fr` | ltr | Latin | 2 |
| pt | Português | `/pt/` | `pt` (metin Brezilya Portekizcesi) | ltr | Latin | 2 |
| id | Bahasa Indonesia | `/id/` | `id` | ltr | Latin | 2 |
| bn | বাংলা | `/bn/` | `bn` | ltr | Bengali | 2 |
| ar | العربية | `/ar/` | `ar` | rtl | Arap | plan dışı (D11) |
| ur | اردو | `/ur/` | `ur` | rtl | Arap (Nastaliq) | plan dışı (D11) |
| ru | Русский | `/ru/` | `ru` | ltr | Kiril | 4 |
| de | Deutsch | `/de/` | `de` | ltr | Latin | 4 |
| ja | 日本語 | `/ja/` | `ja` | ltr | Kanji ve kana | 4 |

- hreflang biçimi: Google ISO 639-1 dil kodu, isteğe bağlı ISO 3166-1 bölge kodu ve açıkça ISO 15924 yazı kodu
  (`zh-Hans`) kabul ediyor (Google Search Central, "Tell Google about localized versions of your page", 2026-11-19
  okundu).
- `pt` bölgesiz: tek Portekizce sürüm Portekiz ve Brezilya'daki okurların ikisini de kapsasın diye. Google aynı dilin
  birden çok bölge sürümünde dil geneli bir "catchall" sayfa öneriyor.
- Talep notu: Vikipedi ölçümünde (Ek A) hi, bn, ur, id ve ar'da LLM konusu kendi dilinde az okunuyor. Dil seti
  konuşan sayısına göre seçildi; etkisi Search Console verisiyle izlenir. ru, de ve ja konuşan sayısında ilk 10'un
  hemen altında, ama LLM konusunun kendi dilinde en çok okunduğu üç dil; bu yüzden 4. dalgada (D10).

## 3. Mimari

### 3.1 Dil kaydı, tek kaynak

`src/lib/langs.ts`: `LANGS`, `type Lang`, `LANG_META` (önek, hreflang, `dir`, dilin kendi adı, Intl locale,
`og:locale`) ve `ENABLED_LANGS` (build'in ürettiği diller). Kodda sabit `["en","tr"]` kalmaz; bugün 9 dosyada ve 7 test
suite'inde var.

### 3.2 Sözlük dosyaları ve paket boyutu

Bugün iki sözlük tek modülde (`src/lib/dict.ts`, 282 KB; dil başına ≈41–44 KB gzip) ve her ziyaretçi ikisini de
indiriyor. 12 dilde bu ≈520 KB gzip olurdu.

Karar: `src/locales/<lang>.ts`, her biri `satisfies Record<Key, string>` (`Key = keyof typeof en`). Eksik ya da fazla
anahtar `tsc`'de hata verir. İstemci sayfanın dilini adresten okur ve yalnız o sözlüğü dinamik olarak yükler
(`main.tsx` zaten `createRoot` kullanıyor, render'dan önce beklenir). Prerender hepsini yükler.

### 3.3 Üretilen sayfa metni

Satır içi `en ? … : …` metinleri `scripts/locales/<lang>.ts`'e taşınır. Bugünkü yerleri: `genPages.ts` (75),
`concepts.ts` (17), `prerender.ts` (7), `shell.ts` (6), `src/lib/configExplain.ts` (5) ve birkaç küçük dosya. Her dil
ortak bir `PageText` arayüzünü uygulayan fonksiyonlar yazar; ek ve çekim dile göre değiştiği için düz şablon yetmez.
Bir test, kaynakta yeni satır içi dil dalı açılmasını engeller.

### 3.4 Adres ve dil seçimi

- `langPath.ts`: öneki `LANG_META`'dan okur; `pathFor(path, lang)` N dil için çalışır.
- Otomatik yönlendirme yok (bugünkü ilke korunur). `preferredLang()` `navigator.languages`'ı açık dillerle eşler ve
  yalnız öneri bandını tetikler. `zh-TW`, `zh-HK`, `zh-MO` okuruna basitleştirilmiş Çince önerilmez (D8).
- İki dilli düğme menüye döner: küre SVG ikonu ve mevcut dilin kendi adı. Listede her dil kendi adıyla ve
  `<a hreflang lang>` link olarak durur; prerender HTML'inde olduğu için botlar takip eder. Statik sayfa kabuğu
  (`scripts/appLook.ts`) aynı menüyü kullanır.

### 3.5 Sağdan sola (ar, ur)

ar ve ur plan dışı (D11). Bu bölüm ileride açılırlarsa uygulanacak tasarım olarak kalır. PR 0'da yapılan mantıksal yön
geçişi (`text-start/end`, `ms/me`, `ps/pe`, `start/end-*`) ve `test-i18n`'deki `dir` denetimi yerinde duruyor.

- `<html lang dir>`; `dir` değeri `LANG_META`'dan gelir.
- Fiziksel yön sınıfları mantıksal karşılıklarına geçer: `text-left/right` → `text-start/end`, `ml/mr` → `ms/me`,
  `pl/pr` → `ps/pe`, `left/right-*` → `start/end-*`. `src` içinde ≈77 kullanım, CSS ve satır içi stilde 16 fiziksel
  özellik var. Soldan sağa dillerde sonuç birebir aynıdır. Bu geçiş PR 0'da yapılır ve en/tr ekran görüntüsüyle
  doğrulanır.
- Soldan sağa kalan adacıklar: komutlar (`vllm serve …`), model kimlikleri, URL'ler, sayısal tablolar. Bunlar
  `dir="ltr"` ya da `<bdi>` alır.
- Grafikler (SVG) aynalanmaz; yalnız etiketleri çevrilir. 11 `textAnchor` kullanımı tek tek kontrol edilir.

### 3.6 Sayı, birim, font

- Sayılar `Intl.NumberFormat(LANG_META.intl)` ile biçimlenir. Rakamlar her dilde Latin rakamıdır (`-u-nu-latn`),
  çünkü model ve GPU adlarındaki rakamlarla (70B, H100) tutarlı olmalı (D6). Basamak gruplaması yerel kurala uyar
  (Hintçe'de 1,31,072).
- Font: mevcut `system-ui` yığını, webfont yok. Urduca'da çoğu sistem Nastaliq yerine Naskh gösterebilir; ilk sürümde
  bu kabul (D9).
- Ekran görüntüsü konteynerinde (GTR9 Playwright imajı) CJK fontları var; Devanagari, Bengali ve Arapça için Noto
  fontları yok. Bunlar yalnız test imajına eklenir.

### 3.7 Feed ve learn.html

- Feed gönderileri en ve tr'de kalır; feed sayfaları ve RSS yalnız bu iki dilde üretilir. Diğer dillerde menüdeki
  "Feed" İngilizce feed'e gider ve feed sayfalarının hreflang kümesi en+tr olur (D3). Panel incelemesi 2 dilden 12'ye
  çıkmaz ve çeviri yinelenen içerik üretmez.
- learn.html: `data-tr` öznitelikleri ve `ch.tr` alanı dil anahtarlı bir yapıya geçer. Mekanizma PR 0'da, metinler
  dalgalarda gelir. Görsel dünyası değişmez.

### 3.8 Sitemap, hreflang, llms.txt

- `sitemap.ts` sabit `en, tr, x-default` yerine her sayfanın kendi kümesini okur. Test: her küme karşılıklı olmalı
  (Google karşılıksız kümeleri yok sayıyor) ve `x-default` EN'i göstermeli.
- `llms.txt` dil sürümlerini listeler.

## 4. Çeviri süreci

- Kaynak dil EN.
- Her dil için bir terim sözlüğü: `docs/i18n/glossary/<lang>.md`. Terimler o dildeki birincil kaynaklardan alınır
  (Hugging Face kursunun ve resmi dokümanların o dildeki çevirileri) ve kaynak linkiyle yazılır. Karşılığı bulunamayan
  terim İngilizce kalır (TR'deki kural).
- Çeviriyi Claude yapar (D2). Her sayfanın altbilgisinde "Bu sayfa AI ile çevrildi · Düzeltme öner" yazar; link,
  GitHub'da başlığı hazır yeni bir issue açar.
- Hacim: dil başına ≈20.000 kelime (sözlük ≈16.800, üretilen sayfa metni ≈2.200, learn.html ayrıca); 10 yeni dil
  ≈200.000 kelime.

## 5. Testler

- Yeni `scripts/test-i18n.ts`: anahtar eşitliği; her anahtarda `{değişken}` kümesi EN ile aynı; EN ile birebir aynı
  kalan değer izin listesi dışındaysa hata; RTL dillerde prerender çıktısında `dir="rtl"`; satır içi dil dalı yasağı.
- Mevcut 7 suite `["en","tr"]` yerine `ENABLED_LANGS` üzerinde döner.
- Sitemap'te hreflang karşılıklılık testi.
- Görsel: 5 sayfa × her dil × (masaüstü ve 375 px) ekran görüntüsü; yatay taşma hata sayılır. PR 0'da en/tr için
  öncesi ve sonrası karşılaştırılır.

## 6. SEO ve AI görünürlük kontrol listesi — her dil için

Kanıt: `python3 -I ~/.claude/skills/ai-gorunurluk/scripts/audit.py <yerel önizleme>/<önek>/ --pages 8`. Dilin en
değerli 5 sayfası üzerinde: index, fit, compare, bir model rehberi, bir GPU rehberi.

**Adres ve bağlantılar**
- [ ] Dil kendi önekinde; otomatik yönlendirme yok.
- [ ] hreflang kümesi her sayfada açık dillerin hepsini ve `x-default`'u (EN) taşır, karşılıklıdır. `<head>` ve
      `sitemap.xml` aynı kümeyi verir.
- [ ] Her dil kendi canonical'ını gösterir; diller arası canonical yok.
- [ ] Sayfa adları İngilizce kalır (`models/llama-3.3-70b.html`); model ve GPU adları her dilde İngilizce aranıyor.

**Sayfa başına meta**
- [ ] `<html lang dir>`, `og:locale` ve `og:locale:alternate`, JSON-LD `inLanguage`.
- [ ] title ve meta description çevrilmiş; uzunluk yazı sistemine göre ayarlı (CJK'de karakter sayısı yaklaşık yarı).
- [ ] Ham HTML'de ≥150 kelime eşdeğeri, tek H1, SSS başlıkları soru biçiminde.
- [ ] Sitemap `lastmod` ile JSON-LD `dateModified` aynı.

**İçerik ve terim**
- [ ] Yalnız arayüz değil, rehber sayfaları da çevrilir. 2026-11-01 ölçümünde atıf alan iki sayfa da model ve GPU
      rehberiydi.
- [ ] Terim sözlüğü hazır ve kaynaklı (§4).
- [ ] Hedef soru seti (`docs/ai-visibility/sorular.md`) o dile çevrilir; her soru o dildeki sayfaya denk gelir.

**Bulunurluk**
- [ ] Kökte robots.txt yok (404), bu yüzden sitemap her motora elle bildirilir: Google Search Console ve Bing
      Webmaster Tools; zh için Baidu Ziyuan, ru için Yandex Webmaster. Hesap açma ve site doğrulama kullanıcının işi.
- [ ] IndexNow (Bing ve diğer destekleyen motorlar): anahtar dosyasının `/LLMScale/` altında çalışıp çalışmadığı
      dokümandan doğrulanır, sonra build'e eklenir.
- [ ] `llms.txt` dil sürümlerini listeler.

**Ölçüm**
- [ ] Yayından **önce** o dilde AI görünürlük baz ölçümü. "Görünürlük arttı" yalnız iki ölçümün karşılaştırmasıyla
      söylenir.
- [ ] Yayından sonra Search Console'da dil önekine göre gösterim ve tıklama; ayda bir.

## 7. Pazara özgü

- **zh:** Çin'de arama Baidu ağırlıklı (ikincil kaynaklara göre %45–60), Google kapalı. huggingface.co Çin
  anakarasından erişilemiyor (HF kabul etti), bu yüzden Çince kullanıcı canlı model aramasını kullanamaz, yalnız
  gömülü listeyi görür. ModelScope ya da hf-mirror desteği ayrı bir iş (D5). GitHub Pages Çin'de kesintili
  erişilebiliyor. Baiduspider kimliğiyle istek 200 döndü (2026-11-19); bu IP düzeyinde engel olmadığını kanıtlamaz,
  Baidu Ziyuan'ın tarama aracıyla doğrulanır. Çince AI asistanlar (DeepSeek, Doubao, Kimi, Qwen) kendi aramalarını
  kullanır; ölçüm o motorlarda yapılır.
- **ru:** Rusya'da Yandex ~%70 (ikincil kaynaklar); Yandex Webmaster ve IndexNow.
- **ja:** Google ve Yahoo! Japan (Google altyapılı); Search Console yeterli.
- **hi, es, fr, pt, id, bn, ar, ur, de:** Google baskın (ikincil kaynaklar); Search Console ve Bing Webmaster yeterli.

## 8. Teslim sırası

| Adım | Kapsam | Not |
|---|---|---|
| PR 0 | §3'teki altyapı; yalnız en ve tr açık | Dil menüsü dışında görünür değişiklik yok |
| Dalga 1 | zh, hi, es | Konuşanı en çok üç dil; Han ve Devanagari yazısı erken denenir |
| Dalga 2 | fr, pt, id, bn | Latin ve Bengali yazısı |
| ~~Dalga 3~~ | ~~ar, ur~~ | Plan dışı (D11, 2026-11-19); ileride açılırsa §3.5 |
| Dalga 4 | ru, de, ja | Kiril ve Japonca yazı; ru için Yandex kaydı |

Her adım kendi PR'ı ve kendi yayın onayı (`npm run deploy`, yalnız kullanıcının açık "evet"inden sonra).

Ölçek: bugün sitemap'te 166 URL var, 24'ü feed. Feed dışındaki 142 URL dil başına 71 eder; 12 dilde ≈852 ve 24 feed ile
≈876 URL. Build süresi PR 0'da ölçülür.

## 9. Değişikliğin ulaşacağı yerler (PR 0)

- yeni: `src/lib/langs.ts`, `src/locales/<lang>.ts`, `scripts/locales/<lang>.ts`, `scripts/test-i18n.ts`
- `src/lib/dict.ts` (`Lang`, `DICTS`, `translate`), `src/lib/i18n.ts`, `src/main.tsx`, `src/entry-server.tsx`
- `src/lib/langPath.ts` (`/tr/` regex'i, `pathFor`, `preferredLang`, `SUGGEST`)
- dil düğmesi ve öneri bandı: `src/components/SiteNav.tsx`, `src/components/LangSuggest.tsx`
- `src/lib/format.ts` (sayı biçimi)
- yön sınıfları: `src/components/*`, `src/pages/*`, `src/index.css`
- `src/learn.js`, `src/learnChapters.js`, `learn.html`
- `scripts/shell.ts`, `scripts/appLook.ts`, `scripts/prerender.ts` (`LANGS` sabitleri)
- `scripts/genPages.ts`, `scripts/concepts.ts`, `src/lib/configExplain.ts`, `src/lib/serving.ts`,
  `src/lib/configGlossary.ts`
- `scripts/sitemap.ts`, `scripts/llmsTxt.ts`
- feed: `src/lib/feed.ts`, `scripts/genFeed.ts`, `scripts/feedRender.ts`, `newsroom/prompts.ts` (en ve tr zorunlu
  kalır; yalnız hreflang kümesi değişir)
- trafik raporu: `scripts/report-traffic.ts` (`/tr/` eşlemesi)
- testler: `["en","tr"]` döngüsü olan 7 suite

## 10. Kararlar

| # | Karar | Durum |
|---|---|---|
| D1 | Dil seti | **Verildi:** en çok konuşulan ilk 10 dil (kullanıcı, 2026-11-19) |
| D2 | Çeviri | Claude çevirir, altbilgide düzeltme linki (varsayılan) |
| D3 | Feed | Yalnız en ve tr (varsayılan) |
| D4 | Özel alan adı | Kullanıcı kararı; Dalga 1 yayınından önce. Kök robots.txt ve webmaster doğrulamasını kolaylaştırır |
| D5 | Çin'de model verisi | Ayrı iş, Dalga 1'den sonra |
| D6 | Rakamlar | Her dilde Latin rakamı (varsayılan) |
| D7 | Portekizce | hreflang `pt`, metin Brezilya Portekizcesi (varsayılan) |
| D8 | zh-TW/HK/MO okuru | Basitleştirilmiş Çince önerilmez (varsayılan) |
| D9 | Urduca font | Sistem fontu, webfont yok (varsayılan); ur plan dışı (D11) |
| D10 | ru, de, ja | **Verildi:** 4. dalga (kullanıcı, 2026-11-19) |
| D11 | Dalga 3 (ar, ur) | **Verildi:** plan dışı (kullanıcı, 2026-11-19: "dalga 3'ü plandan çıkart"). Hedef 14 dilden 12'ye iner. ar ve ur `LANGS` ve `LANG_META`'da tanımlı ve kapalı kalır, koddan silinmez; karar geri alınabilir, o zaman §3.5 uygulanır |

## 11. Riskler

- [Orta] Yeni dillerin hiçbirini anadilinde kimse gözden geçirmiyor. Önlem: kaynaklı terim sözlüğü, anahtar ve
  değişken eşitliği testte, altbilgide düzeltme linki.
- [Orta] hi, bn ve id'de kendi dilinde talep düşük ölçüldü (Ek A; ur ve ar da düşüktü, ikisi plan dışı, D11); bu
  dillerin ≈60.000 kelimelik çevirisi az trafik getirebilir. Önlem: dalga sırası Search Console verisine göre
  ayarlanabilir.
- [Orta] Her yeni sözlük anahtarı 12 dilde çeviri ister; eksik anahtar `tsc`'yi kırar. Önlem: her PR'da çeviri
  birlikte yapılır.
- [Düşük] Build süresi ve çıktı boyutu yaklaşık 6 kat artar; PR 0'da ölçülür.

## Ek A — dil seçimi verisi

Umami yalnız siteyi zaten bulanları gösterir; site başka dilde indekste olmadığı için o dillerin talebi bu veride
görünemez (seçilim yanlılığı). Bu yüzden sitemizden bağımsız iki ölçüye bakıldı:

1. **Konuşan sayısı:** Ethnologue 2026, toplam (anadil + ikinci dil) ve anadil.
2. **O dilde konuya talep:** Vikipedi'de "Large language model" makalesinin o dildeki sürümünün 12 aylık okunması
   (2025-11 – 2026-10, yalnız insan trafiği, yönlendirme sayfaları dahil).

| Dil | Toplam / anadil (milyon) | Vikipedi "LLM" okunma, 12 ay | Bu spec'te |
|---|---|---|---|
| İngilizce | 1.493 / 372 | 1.174.000 | mevcut |
| Çince | 1.183 / 988 | ~81.500 ¹ | Dalga 1 |
| Hintçe | 611 / 347 | ~700 | Dalga 1 |
| İspanyolca | 561 / 487 | ~40.800 | Dalga 1 |
| Arapça (MSA) | 335 / — ² | ~3.700 | plan dışı (D11) |
| Fransızca | 334 / 75 | ~84.600 | Dalga 2 |
| Bengalce | 274 / 234 | ~200 | Dalga 2 |
| Portekizce | 269 / 252 | ~17.900 | Dalga 2 |
| Endonezce | 255 / 78 | ~1.500 | Dalga 2 |
| Urduca | 246 / 78 | ~300 | plan dışı (D11) |
| Rusça | 210 / 133 | ≥94.000 ³ | Dalga 4 |
| Almanca | 133 / 76 | ~134.000 | Dalga 4 |
| Japonca | 126 / 124 | ~78.700 | Dalga 4 |
| Türkçe | 94 / 86 | ~7.700 | mevcut |
| Korece | ilk 20 dışında | ~31.400 | — |

¹ Vikipedi Çin anakarasından erişilemediği için düşük ölçülür.
² Ethnologue Standart Arapça'yı yalnız ikinci dil olarak sayar; Mısır Arapçası ayrıca 83 milyon anadil.
³ Yalnız ana başlık; yönlendirmeler hız sınırı (HTTP 429) yüzünden sayılamadı.

Ölçünün sınırları: tek makale bir vekil ölçüdür, arama hacmi değildir. İngilizce Vikipedi'yi anadili İngilizce olmayan
çok kişi de okur.

## Kaynaklar

- Ethnologue 2026, Wikipedia tablosu üzerinden: https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers
  (Ethnologue'un kendi sayfası 403 verdi)
- Vikipedi okunma: Wikimedia Pageviews REST API, `per-article/<dil>.wikipedia/all-access/user`, 2025-11 – 2026-10;
  makale eşlemesi Wikidata Q115305900
- Google hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions
- GitHub Octoverse 2025: https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
- Arama motoru payları (ikincil, StatCounter'a atıfla): https://gs.statcounter.com/search-engine-market-share
- HF'nin Çin'deki erişim sorunu: https://news.yahoo.com/open-source-ai-platform-hugging-202603150.html
- Mevcut AI görünürlük denetimi ve baz ölçüm: [ai-visibility/2026-10-31-denetim.md](ai-visibility/2026-10-31-denetim.md),
  [ai-visibility/2026-11-01.md](ai-visibility/2026-11-01.md)

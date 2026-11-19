// The LLM 101 chapters: camera and scene settings for learn.js, and the card text
// in each language (text.<lang>). Kept free of the DOM and three.js so
// scripts/prerender.ts can import it at build time and write the page's language
// of the cards and of UI into learn.html, where a crawler that never runs learn.js
// can still read them.
export const CH = [
  { id:"hero", cam:[0,0,11], look:[0,0,0], layout:"scatter", spin:true, edges:0, axes:0, planes:0, field:0, loop:0, ids:false },
  { id:"prompt", cam:[0,0,7.6], look:[0,0,0], layout:"row", spin:false, edges:0, axes:0, planes:0, field:0, loop:0, ids:false,
    text:{
      en:{e:"01 · PROMPT", h:'It starts with a <em>sentence</em>', p:'You hand the model text: <b>“The cat sat on the mat.”</b> It won’t read letters — it prepares to see meaningful pieces.'},
      tr:{e:"01 · PROMPT", h:'Her şey bir <em>cümleyle</em> başlar', p:'Modele bir metin verirsin: <b>“The cat sat on the mat.”</b> Model harfleri değil, anlam taşıyan parçaları görmek üzere bunu hazırlar.'},
      es:{e:"01 · PROMPT", h:"Todo empieza con una <em>frase</em>", p:"Le das un texto al modelo: <b>“The cat sat on the mat.”</b> No lee letras: se prepara para ver fragmentos con significado."} } },
  { id:"token", cam:[0,0,8], look:[0,0,0], layout:"row", spin:false, edges:0, axes:0, planes:0, field:0, loop:0, ids:true,
    text:{
      en:{e:"02 · TOKENIZATION", h:'Text is split into <em>tokens</em>', p:'The sentence is chopped into pieces, each mapped to a number (<b>ID</b>). From here the model works in numbers, not words.'},
      tr:{e:"02 · TOKENIZATION", h:'Metin <em>token</em>’lara bölünür', p:'Cümle küçük parçalara (token) ayrılır ve her biri bir sayıya (<b>ID</b>) eşlenir. Model artık kelimelerle değil, sayılarla çalışır.'},
      es:{e:"02 · TOKENIZACIÓN", h:"El texto se divide en <em>tokens</em>", p:"La frase se corta en fragmentos, y cada uno se asigna a un número (<b>ID</b>). A partir de aquí, el modelo trabaja con números, no con palabras."} } },
  { id:"embed", cam:[0.4,0.6,9.4], look:[0,0,0], layout:"scatter", spin:true, edges:0, axes:1, planes:0, field:0, loop:0, ids:true,
    text:{
      en:{e:"03 · EMBEDDING", h:'Each token becomes a <em>vector</em>', p:'Every ID turns into a point in a high-dimensional <b>meaning space</b>. Similar meanings land close together.'},
      tr:{e:"03 · EMBEDDING", h:'Her token bir <em>vektör</em> olur', p:'Her ID, yüksek boyutlu bir <b>anlam uzayında</b> bir noktaya (vektör) dönüşür. Benzer anlamlar birbirine yakın konumlanır.'},
      es:{e:"03 · EMBEDDING", h:"Cada token se convierte en un <em>vector</em>", p:"Cada ID se transforma en un punto de un <b>espacio de significado</b> de muchas dimensiones. Los significados parecidos quedan cerca unos de otros."} } },
  { id:"attention", cam:[0,0,9], look:[0,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:0, ids:false, attn:true,
    text:{
      en:{e:"04 · ATTENTION", h:'Tokens <em>look at each other</em>', p:'Each token computes <b>how much to attend</b> to the others. With a causal mask, a token only looks at the ones before it.'},
      tr:{e:"04 · ATTENTION", h:'Token’lar <em>birbirine bakar</em>', p:'Her token, cümledeki diğerlerine <b>ne kadar dikkat edeceğini</b> hesaplar. Nedensel maske gereği bir token yalnızca kendinden öncekilere bakabilir.'},
      es:{e:"04 · ATENCIÓN", h:"Los tokens <em>se miran entre sí</em>", p:"Cada token calcula <b>cuánta atención prestar</b> a los demás. Con una máscara causal, un token solo mira a los que tiene delante."} } },
  { id:"layers", cam:[0,1.7,10.6], look:[0,-0.3,0], layout:"scatter", spin:false, edges:1, axes:0, planes:1, field:0, loop:0, ids:false,
    text:{
      en:{e:"05 · LAYERS", h:'The same block, <em>stacked deep</em>', p:'Attention + feed-forward repeats, stacked dozens deep (e.g. <b>×32</b>). Every pass refines the representation.'},
      tr:{e:"05 · LAYERS", h:'Aynı blok <em>onlarca kez</em>', p:'Attention + ileri-besleme bloğu üst üste yığılır (örn. <b>×32 katman</b>). Her geçişte temsil biraz daha rafine olur.'},
      es:{e:"05 · CAPAS", h:"El mismo bloque, <em>apilado en profundidad</em>", p:"Atención + capa de avance: el bloque se repite, apilado decenas de veces (p. ej., <b>×32</b>). Cada pasada refina la representación."} } },
  { id:"predict", cam:[-1.6,0.4,7.8], look:[0.4,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:0, ids:false, bars:true,
    text:{
      en:{e:"06 · PREDICTION", h:'The next most <em>likely</em> token', p:'The final layer scores the entire vocabulary into a <b>probability distribution</b>. The top token is picked (or sampled).'},
      tr:{e:"06 · PREDICTION", h:'Sıradaki <em>en olası</em> token', p:'Son katman, tüm kelime dağarcığı için bir <b>olasılık dağılımı</b> üretir. En yüksek olasılıklı token seçilir (ya da örneklenir).'},
      es:{e:"06 · PREDICCIÓN", h:"El siguiente token más <em>probable</em>", p:"La última capa puntúa todo el vocabulario y lo convierte en una <b>distribución de probabilidad</b>. Se elige el token más probable (o se muestrea)."} } },
  { id:"loop", cam:[0,0.2,10], look:[0,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:1, ids:false,
    text:{
      en:{e:"07 · AUTOREGRESSION", h:'The prediction <em>feeds back</em>', p:'The chosen token is appended and the whole process runs <b>again</b>. Word by word, that’s how text is generated.'},
      tr:{e:"07 · AUTOREGRESSION", h:'Tahmin <em>geri beslenir</em>', p:'Seçilen token diziye eklenir ve süreç <b>baştan</b> işler. Kelime kelime, model metni böyle üretir.'},
      es:{e:"07 · AUTORREGRESIÓN", h:"La predicción <em>se retroalimenta</em>", p:"El token elegido se añade al final y todo el proceso se ejecuta <b>de nuevo</b>. Palabra a palabra, así se genera el texto."} } },
  { id:"scale", cam:[0,0,17], look:[0,0,0], layout:"scatter", spin:true, edges:1, axes:0, planes:0, field:1, loop:0, ids:false, cta:true,
    text:{
      en:{e:"08 · SCALE", h:'Now at <em>billions</em>-scale', p:'This tiny network is really <b>billions of parameters</b> — which is exactly why VRAM matters. Does your model fit a GPU?'},
      tr:{e:"08 · SCALE", h:'Bunu <em>milyarlarca</em> kez, dev boyutta', p:'Bu küçük ağ aslında <b>milyarlarca parametre</b>. İşte bu yüzden VRAM önemli — modelin bir GPU’ya sığar mı?'},
      es:{e:"08 · ESCALA", h:"Ahora, a escala de <em>miles de millones</em>", p:"En realidad, esta red diminuta son <b>miles de millones de parámetros</b>, y justo por eso importa la VRAM. ¿Cabe tu modelo en una GPU?"} } },
];

// The page's other words, by language: learn.html marks where each goes with
// data-i18n="<key>"; the attention chapter's hint and the last card's link are
// placed by learn.js.
export const UI = {
  en: {
    kicker: "// A LANGUAGE MODEL, AS A CONSTELLATION",
    sub: "A sentence becomes a constellation of nodes. Drag, touch, fire — then scroll inside.",
    hint: "⊹ DRAG · HOVER · CLICK · SCROLL",
    scrollHint: "SCROLL ↓",
    attnHint: "⊹ hover a node · toggle heads · click to fire",
    cta: "→ Size it on LLMScale",
  },
  tr: {
    kicker: "// BİR DİL MODELİ, TAKIMYILDIZ OLARAK",
    sub: "Bir cümle, düğümlerden oluşan bir takımyıldıza dönüşür. Sürükle, dokun, ateşle — sonra kaydırıp içine gir.",
    hint: "⊹ SÜRÜKLE · ÜZERİNE GEL · TIKLA · KAYDIR",
    scrollHint: "KAYDIR ↓",
    attnHint: "⊹ bir düğümün üzerine gel · head’leri aç/kapa · tıkla",
    cta: "→ LLMScale ile VRAM hesapla",
  },
  es: {
    kicker: "// UN MODELO DE LENGUAJE, COMO UNA CONSTELACIÓN",
    sub: "Una frase se convierte en una constelación de nodos. Arrastra, toca, dispara — y luego desplázate para entrar.",
    hint: "⊹ ARRASTRA · SEÑALA · PULSA · DESPLAZA",
    scrollHint: "DESPLAZA ↓",
    attnHint: "⊹ señala un nodo · alterna cabezas · pulsa y dispara",
    cta: "→ Dimensiónalo en LLMScale",
  },
};

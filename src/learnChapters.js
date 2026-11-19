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
      es:{e:"01 · PROMPT", h:"Todo empieza con una <em>frase</em>", p:"Le das un texto al modelo: <b>“The cat sat on the mat.”</b> No lee letras: se prepara para ver fragmentos con significado."},
      hi:{e:"01 · प्रॉम्प्ट", h:"शुरुआत एक <em>वाक्य</em> से होती है", p:"आप मॉडल को टेक्स्ट देते हैं: <b>“The cat sat on the mat.”</b> मॉडल अक्षर नहीं पढ़ेगा — वह अर्थपूर्ण टुकड़ों को देखने की तैयारी करता है।"},
      zh:{e:"01 · 提示", h:"一切从一个<em>句子</em>开始", p:"你把一段文本交给模型：<b>“The cat sat on the mat.”</b>它不会逐个读字母，而是准备把文本看成一个个有意义的片段。"},
      fr:{e:"01 · PROMPT", h:"Tout commence par une <em>phrase</em>", p:"Vous donnez un texte au modèle : <b>« The cat sat on the mat. »</b> Il ne lira pas de lettres — il se prépare à y voir des fragments porteurs de sens."},
      pt:{e:"01 · PROMPT", h:"Tudo começa com uma <em>frase</em>", p:"Você entrega um texto ao modelo: <b>“The cat sat on the mat.”</b> Ele não lê letras — se prepara para ver pedaços com significado."} } },
  { id:"token", cam:[0,0,8], look:[0,0,0], layout:"row", spin:false, edges:0, axes:0, planes:0, field:0, loop:0, ids:true,
    text:{
      en:{e:"02 · TOKENIZATION", h:'Text is split into <em>tokens</em>', p:'The sentence is chopped into pieces, each mapped to a number (<b>ID</b>). From here the model works in numbers, not words.'},
      tr:{e:"02 · TOKENIZATION", h:'Metin <em>token</em>’lara bölünür', p:'Cümle küçük parçalara (token) ayrılır ve her biri bir sayıya (<b>ID</b>) eşlenir. Model artık kelimelerle değil, sayılarla çalışır.'},
      es:{e:"02 · TOKENIZACIÓN", h:"El texto se divide en <em>tokens</em>", p:"La frase se corta en fragmentos, y cada uno se asigna a un número (<b>ID</b>). A partir de aquí, el modelo trabaja con números, no con palabras."},
      hi:{e:"02 · टोकनाइज़ेशन", h:"टेक्स्ट <em>टोकनों</em> में बँटता है", p:"वाक्य को टुकड़ों में काटा जाता है, और हर टुकड़े को एक संख्या (<b>ID</b>) से जोड़ा जाता है। यहाँ से मॉडल शब्दों में नहीं, संख्याओं में काम करता है।"},
      zh:{e:"02 · 分词", h:"文本被切分成 <em>token</em>", p:"句子被切成若干片段，每个片段映射为一个数字（<b>ID</b>）。从这里开始，模型处理的是数字，而不是词。"},
      fr:{e:"02 · TOKENISATION", h:"Le texte est divisé en <em>jetons</em>", p:"La phrase est découpée en fragments, chacun associé à un nombre (<b>ID</b>). À partir de là, le modèle travaille avec des nombres, pas avec des mots."},
      pt:{e:"02 · TOKENIZAÇÃO", h:"O texto é dividido em <em>tokens</em>", p:"A frase é cortada em pedaços, e cada um é associado a um número (<b>ID</b>). Daqui em diante, o modelo trabalha com números, não com palavras."} } },
  { id:"embed", cam:[0.4,0.6,9.4], look:[0,0,0], layout:"scatter", spin:true, edges:0, axes:1, planes:0, field:0, loop:0, ids:true,
    text:{
      en:{e:"03 · EMBEDDING", h:'Each token becomes a <em>vector</em>', p:'Every ID turns into a point in a high-dimensional <b>meaning space</b>. Similar meanings land close together.'},
      tr:{e:"03 · EMBEDDING", h:'Her token bir <em>vektör</em> olur', p:'Her ID, yüksek boyutlu bir <b>anlam uzayında</b> bir noktaya (vektör) dönüşür. Benzer anlamlar birbirine yakın konumlanır.'},
      es:{e:"03 · EMBEDDING", h:"Cada token se convierte en un <em>vector</em>", p:"Cada ID se transforma en un punto de un <b>espacio de significado</b> de muchas dimensiones. Los significados parecidos quedan cerca unos de otros."},
      hi:{e:"03 · एम्बेडिंग", h:"हर टोकन एक <em>वेक्टर</em> बन जाता है", p:"हर ID एक उच्च-आयामी <b>अर्थ-स्पेस</b> में एक बिंदु बन जाती है। मिलते-जुलते अर्थ एक-दूसरे के पास आ जाते हैं।"},
      zh:{e:"03 · 嵌入", h:"每个 token 变成一个<em>向量</em>", p:"每个 ID 都变成高维<b>语义空间</b>中的一个点。意思相近的，位置也相近。"},
      fr:{e:"03 · EMBEDDING", h:"Chaque jeton devient un <em>vecteur</em>", p:"Chaque ID devient un point dans un <b>espace sémantique</b> de grande dimension. Les significations voisines se retrouvent proches les unes des autres."},
      pt:{e:"03 · EMBEDDING", h:"Cada token vira um <em>vetor</em>", p:"Cada ID se transforma em um ponto de um <b>espaço de significado</b> de alta dimensão. Significados parecidos ficam perto uns dos outros."} } },
  { id:"attention", cam:[0,0,9], look:[0,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:0, ids:false, attn:true,
    text:{
      en:{e:"04 · ATTENTION", h:'Tokens <em>look at each other</em>', p:'Each token computes <b>how much to attend</b> to the others. With a causal mask, a token only looks at the ones before it.'},
      tr:{e:"04 · ATTENTION", h:'Token’lar <em>birbirine bakar</em>', p:'Her token, cümledeki diğerlerine <b>ne kadar dikkat edeceğini</b> hesaplar. Nedensel maske gereği bir token yalnızca kendinden öncekilere bakabilir.'},
      es:{e:"04 · ATENCIÓN", h:"Los tokens <em>se miran entre sí</em>", p:"Cada token calcula <b>cuánta atención prestar</b> a los demás. Con una máscara causal, un token solo mira a los que tiene delante."},
      hi:{e:"04 · ध्यान", h:"टोकन <em>एक-दूसरे को देखते हैं</em>", p:"हर टोकन गणना करता है कि उसे दूसरों पर <b>कितना ध्यान देना है</b>। Causal mask के साथ, कोई टोकन केवल अपने से पहले वाले टोकनों को देखता है।"},
      zh:{e:"04 · 注意力", h:"各个 token <em>相互关注</em>", p:"每个 token 计算自己应对其他 token <b>投入多少注意力</b>。在因果掩码下，一个 token 只能看到它之前的 token。"},
      fr:{e:"04 · ATTENTION", h:"Les jetons <em>se regardent entre eux</em>", p:"Chaque jeton calcule <b>quelle attention accorder</b> aux autres. Avec un masque causal, un jeton ne regarde que ceux qui le précèdent."},
      pt:{e:"04 · ATENÇÃO", h:"Os tokens <em>olham uns para os outros</em>", p:"Cada token calcula <b>quanta atenção dar</b> aos outros. Com uma máscara causal, um token só olha para os que vêm antes dele."} } },
  { id:"layers", cam:[0,1.7,10.6], look:[0,-0.3,0], layout:"scatter", spin:false, edges:1, axes:0, planes:1, field:0, loop:0, ids:false,
    text:{
      en:{e:"05 · LAYERS", h:'The same block, <em>stacked deep</em>', p:'Attention + feed-forward repeats, stacked dozens deep (e.g. <b>×32</b>). Every pass refines the representation.'},
      tr:{e:"05 · LAYERS", h:'Aynı blok <em>onlarca kez</em>', p:'Attention + ileri-besleme bloğu üst üste yığılır (örn. <b>×32 katman</b>). Her geçişte temsil biraz daha rafine olur.'},
      es:{e:"05 · CAPAS", h:"El mismo bloque, <em>apilado en profundidad</em>", p:"Atención + capa de avance: el bloque se repite, apilado decenas de veces (p. ej., <b>×32</b>). Cada pasada refina la representación."},
      hi:{e:"05 · लेयर", h:"वही ब्लॉक, <em>गहराई तक एक के ऊपर एक</em>", p:"ध्यान + फीड-फॉरवर्ड का ब्लॉक दोहराया जाता है, दर्जनों बार एक के ऊपर एक (जैसे <b>×32</b>)। हर बार गुज़रने पर प्रतिनिधित्व और निखरता है।"},
      zh:{e:"05 · 层", h:"同样的模块，<em>层层堆叠</em>", p:"注意力 + 前馈层不断重复，堆叠数十层（例如 <b>×32</b>）。每经过一层，表示就被进一步细化。"},
      fr:{e:"05 · COUCHES", h:"Le même bloc, <em>empilé en profondeur</em>", p:"Attention + couche feedforward : le bloc se répète, empilé des dizaines de fois (par exemple <b>×32</b>). Chaque passage affine la représentation."},
      pt:{e:"05 · CAMADAS", h:"O mesmo bloco, <em>empilhado em profundidade</em>", p:"Atenção + feed-forward se repetem, empilhados dezenas de vezes (ex.: <b>×32</b>). Cada passada refina a representação."} } },
  { id:"predict", cam:[-1.6,0.4,7.8], look:[0.4,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:0, ids:false, bars:true,
    text:{
      en:{e:"06 · PREDICTION", h:'The next most <em>likely</em> token', p:'The final layer scores the entire vocabulary into a <b>probability distribution</b>. The top token is picked (or sampled).'},
      tr:{e:"06 · PREDICTION", h:'Sıradaki <em>en olası</em> token', p:'Son katman, tüm kelime dağarcığı için bir <b>olasılık dağılımı</b> üretir. En yüksek olasılıklı token seçilir (ya da örneklenir).'},
      es:{e:"06 · PREDICCIÓN", h:"El siguiente token más <em>probable</em>", p:"La última capa puntúa todo el vocabulario y lo convierte en una <b>distribución de probabilidad</b>. Se elige el token más probable (o se muestrea)."},
      hi:{e:"06 · भविष्यवाणी", h:"अगला सबसे <em>संभावित</em> टोकन", p:"अंतिम लेयर पूरी शब्दावली को स्कोर करके एक <b>संभाव्यता वितरण</b> बनाती है। सबसे ऊपर वाला टोकन चुना जाता है (या सैंपल किया जाता है)।"},
      zh:{e:"06 · 预测", h:"下一个<em>最可能</em>的 token", p:"最后一层为整个词汇表打分，得到一个<b>概率分布</b>。概率最高的 token 被选中（或通过采样选出）。"},
      fr:{e:"06 · PRÉDICTION", h:"Le prochain jeton le plus <em>probable</em>", p:"La dernière couche attribue un score à tout le vocabulaire pour en tirer une <b>distribution de probabilité</b>. Le jeton en tête est choisi (ou échantillonné)."},
      pt:{e:"06 · PREVISÃO", h:"O próximo token mais <em>provável</em>", p:"A última camada pontua todo o vocabulário e o transforma em uma <b>distribuição de probabilidade</b>. O token do topo é escolhido (ou amostrado)."} } },
  { id:"loop", cam:[0,0.2,10], look:[0,0,0], layout:"scatter", spin:false, edges:1, axes:0, planes:0, field:0, loop:1, ids:false,
    text:{
      en:{e:"07 · AUTOREGRESSION", h:'The prediction <em>feeds back</em>', p:'The chosen token is appended and the whole process runs <b>again</b>. Word by word, that’s how text is generated.'},
      tr:{e:"07 · AUTOREGRESSION", h:'Tahmin <em>geri beslenir</em>', p:'Seçilen token diziye eklenir ve süreç <b>baştan</b> işler. Kelime kelime, model metni böyle üretir.'},
      es:{e:"07 · AUTORREGRESIÓN", h:"La predicción <em>se retroalimenta</em>", p:"El token elegido se añade al final y todo el proceso se ejecuta <b>de nuevo</b>. Palabra a palabra, así se genera el texto."},
      hi:{e:"07 · AUTOREGRESSION", h:"भविष्यवाणी <em>वापस इनपुट में जाती है</em>", p:"चुना गया टोकन जोड़ दिया जाता है और पूरी प्रक्रिया <b>फिर से</b> चलती है। शब्द-दर-शब्द, इसी तरह टेक्स्ट जनरेट होता है।"},
      zh:{e:"07 · 自回归", h:"预测结果被<em>送回输入</em>", p:"选中的 token 被追加到末尾，整个过程<b>再次</b>运行。文本就是这样一个词一个词生成的。"},
      fr:{e:"07 · AUTORÉGRESSION", h:"La prédiction <em>est réinjectée</em>", p:"Le jeton choisi est ajouté à la suite, et tout le processus s'exécute <b>à nouveau</b>. Mot après mot, c'est ainsi que le texte est généré."},
      pt:{e:"07 · AUTORREGRESSÃO", h:"A previsão <em>volta como entrada</em>", p:"O token escolhido é acrescentado ao final, e todo o processo roda <b>de novo</b>. Palavra por palavra, é assim que o texto é gerado."} } },
  { id:"scale", cam:[0,0,17], look:[0,0,0], layout:"scatter", spin:true, edges:1, axes:0, planes:0, field:1, loop:0, ids:false, cta:true,
    text:{
      en:{e:"08 · SCALE", h:'Now at <em>billions</em>-scale', p:'This tiny network is really <b>billions of parameters</b> — which is exactly why VRAM matters. Does your model fit a GPU?'},
      tr:{e:"08 · SCALE", h:'Bunu <em>milyarlarca</em> kez, dev boyutta', p:'Bu küçük ağ aslında <b>milyarlarca parametre</b>. İşte bu yüzden VRAM önemli — modelin bir GPU’ya sığar mı?'},
      es:{e:"08 · ESCALA", h:"Ahora, a escala de <em>miles de millones</em>", p:"En realidad, esta red diminuta son <b>miles de millones de parámetros</b>, y justo por eso importa la VRAM. ¿Cabe tu modelo en una GPU?"},
      hi:{e:"08 · स्केल", h:"अब <em>अरबों</em> के पैमाने पर", p:"यह छोटा-सा नेटवर्क असल में <b>अरबों पैरामीटर</b> है — और ठीक इसी वजह से VRAM मायने रखती है। क्या आपका मॉडल किसी GPU में फिट होता है?"},
      zh:{e:"08 · 规模", h:"放大到<em>数十亿</em>规模", p:"这个小小的网络，实际上有<b>数十亿个参数</b>——这正是显存如此重要的原因。你的模型放得进 GPU 吗？"},
      fr:{e:"08 · ÉCHELLE", h:"Maintenant, à l'échelle des <em>milliards</em>", p:"Ce minuscule réseau compte en réalité des <b>milliards de paramètres</b> — et c'est justement pour cela que la VRAM est importante. Votre modèle tient-il sur un GPU ?"},
      pt:{e:"08 · ESCALA", h:"Agora, na escala de <em>bilhões</em>", p:"Na verdade, esta rede minúscula tem <b>bilhões de parâmetros</b> — e é exatamente por isso que a VRAM importa. Seu modelo cabe em uma GPU?"} } },
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
  hi: {
    kicker: "// एक भाषा मॉडल, तारामंडल के रूप में",
    sub: "एक वाक्य नोडों का तारामंडल बन जाता है। खींचें, छुएं, फ़ायर करें — फिर स्क्रॉल करके भीतर जाएं।",
    hint: "⊹ खींचें · होवर · क्लिक · स्क्रॉल",
    scrollHint: "स्क्रॉल करें ↓",
    attnHint: "⊹ नोड पर होवर · head चालू/बंद · क्लिक से फ़ायर",
    cta: "→ LLMScale पर VRAM गणना करें",
  },
  zh: {
    kicker: "// 一个语言模型，化作星座",
    sub: "一句话变成由节点组成的星座。拖动、触碰、激发，然后滚动深入其中。",
    hint: "⊹ 拖动 · 悬停 · 点击 · 滚动",
    scrollHint: "滚动 ↓",
    attnHint: "⊹ 悬停节点 · 切换头 · 点击激发",
    cta: "→ 用 LLMScale 估算显存",
  },
  fr: {
    kicker: "// UN MODÈLE DE LANGAGE, EN CONSTELLATION",
    sub: "Une phrase devient une constellation de nœuds. Faites glisser, touchez, déclenchez — puis faites défiler pour y entrer.",
    hint: "⊹ GLISSER · SURVOLER · CLIQUER · DÉFILER",
    scrollHint: "DÉFILER ↓",
    attnHint: "⊹ survoler un nœud · activer ou désactiver des têtes · cliquer pour déclencher",
    cta: "→ Dimensionner votre modèle sur LLMScale",
  },
  pt: {
    kicker: "// UM MODELO DE LINGUAGEM, COMO UMA CONSTELAÇÃO",
    sub: "Uma frase vira uma constelação de nós. Arraste, toque, dispare — depois role para entrar.",
    hint: "⊹ ARRASTE · PASSE O MOUSE · CLIQUE · ROLE",
    scrollHint: "ROLE ↓",
    attnHint: "⊹ passe o mouse sobre um nó · alterne as cabeças · clique para disparar",
    cta: "→ Dimensione no LLMScale",
  },
};

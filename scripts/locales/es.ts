// Español: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const es: PageText = {
  section: { models: "Modelos", gpus: "GPU", concepts: "Conceptos", feed: "Novedades", crumbs: "Ruta de navegación" },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Usa multi-head latent attention (MLA): cada capa almacena en caché un único vector latente comprimido de ${dims} dimensiones por token en lugar de claves y valores para cada cabeza, lo que hace su caché KV ${ratio} más pequeña de lo que daría la fórmula habitual.`,
      mqa: ({ heads }) =>
        `Usa multi-query attention: sus ${heads} cabezas de consulta comparten una sola cabeza de clave-valor, así que su caché KV es ${heads}× más pequeña de lo que necesitaría una multi-head attention completa.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `Usa grouped-query attention: ${heads} cabezas de consulta comparten ${kvHeads} cabezas de clave-valor, así que su caché KV es ${ratio} más pequeña de lo que necesitaría una multi-head attention completa.`,
      mha: ({ heads }) =>
        `Usa multi-head attention completa: cada una de sus ${heads} cabezas guarda sus propias claves y valores, así que la caché KV es tan grande como dicta su número de cabezas.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} tiene ${params} parámetros en ${layers} capas.`,
      moe: ({ active, total }) =>
        `Es un modelo de mezcla de expertos con unos ${active} de sus ${total} parámetros activos por token: la memoria tiene que contenerlos todos, mientras que cada token pasa solo por la parte activa.`,
      context: ({ max, kv }) => `Admite hasta ${max} tokens de contexto; un usuario con esa longitud necesita ${kv} de caché KV en FP16, además de los pesos.`,
      gated: "Su repositorio en Hugging Face es gated, así que LLMScale incluye su arquitectura en una base de datos integrada.",
    },
    title: (name) => `Requisitos de VRAM de ${name}`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} necesita ${bf16} de memoria de GPU en BF16 y ${int4} en INT4 para un usuario con un contexto de ${ctx}. Memoria por precisión y contexto, las GPU en las que cabe, usuarios simultáneos y memoria para el ajuste fino.`,
    h1: (name) => `${name}: ¿cuánta VRAM necesita?`,
    oneUser: "un usuario",
    ctx: (k) => `contexto de ${k}`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `${weights} de pesos, ${kv} de caché KV y ${overhead} de sobrecarga de vLLM. En INT4, la misma carga de trabajo necesita ${int4}.`,
    specLayers: "capas",
    specMaxContext: "contexto máx.",
    specHeads: "cabezas",
    h2Memory: (name) => `Memoria de ${name} por precisión y contexto`,
    thPrecision: "Precisión",
    kvCache: "caché KV",
    tableNote:
      "Un usuario, caché KV en FP16 y la sobrecarga de vLLM en una GPU, con sus valores predeterminados para una tarjeta de menos de 70 GB. Cuantizar reduce los pesos, no la caché KV, así que el ahorro disminuye a medida que crece el contexto.",
    h2Holds: "En qué GPU individuales cabe",
    noSingleGpu: (counts) => `no cabe en ninguna GPU individual — el mínimo de GPU para servirlo, tal como las distribuye la calculadora: ${counts}.`,
    fitNote: (ctx) =>
      `Con un contexto de ${ctx} para un usuario; primero, las tarjetas más pequeñas. Para una tarjeta dedicada se cuenta con el 92\u00a0% de su memoria, el valor predeterminado de vLLM; para un dispositivo de memoria unificada, con la parte que su GPU puede direccionar; y cada uno lleva la sobrecarga de vLLM con sus propios valores predeterminados.`,
    h2Users: "Cuántos usuarios caben",
    doesNotFit: "no cabe",
    usersNote: (ctx) => `Usuarios con un contexto de ${ctx} cada uno, en una tarjeta. ✗: los pesos no dejan espacio ni para uno.`,
    noCard: "Ninguna de estas tarjetas lo contiene por sí sola en ninguna precisión; servirlo implica dividirlo entre varias GPU con paralelismo de tensores.",
    h2FineTune: (name) => `Ajuste fino de ${name}`,
    thMethod: "Método",
    thMemory: "Memoria",
    thSmallestGpu: "GPU más pequeña",
    modes: { full: "Ajuste completo", lora: "LoRA (rango 16, atención)", qlora: "QLoRA (rango 16, atención)" },
    sharded: "varias GPU, fragmentado",
    trainNote:
      "Longitud de secuencia 2048, tamaño del lote 1, punto de control de gradientes activado, Adam. El ajuste completo guarda 16 bytes por parámetro antes de las activaciones; QLoRA almacena el modelo base congelado en NF4 de 4 bits.",
    h2Source: "De dónde salen las cifras",
    kvFormula: {
      mla: "Con MLA, la caché KV es <code>capas × (kv_lora_rank + qk_rope_head_dim) × bytes × contexto × usuarios</code>.",
      heads: "La caché KV es <code>2 × capas × cabezas de clave-valor × dimensión de la cabeza × bytes × contexto × usuarios</code>.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${sliding} de sus ${layers} capas aplican la atención sobre una ventana deslizante de los últimos ${window} tokens y no guardan más que eso, así que, pasada la ventana, cada token adicional añade ${pastWindow} KiB, la parte de las otras ${fullLayers} capas.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Los pesos son <code>parámetros × bytes por parámetro</code>. ${kvFormula} Para ${name}, eso son ${kib} KiB por token en FP16.${windowNote} Son cifras de planificación de la capacidad: el motor de inferencia — vLLM, TGI, llama.cpp — y la eficiencia de su paged attention siguen influyendo en la cifra real.`,
    more: ({ kvCache, attention }) => `Más sobre el <a href="${kvCache}">tamaño de la caché KV</a> y sobre <a href="${attention}">GQA, MQA y MLA</a>.`,
    h2Work: (name) => `Trabaja con ${name}`,
    links: {
      size: "Dimensiónalo para tu carga de trabajo",
      train: "Memoria para el ajuste fino",
      vllm: "Parámetros de vLLM",
      anatomy: "Anatomía del modelo",
      config: "Su config.json, explicado",
      serving: "Qué dicen sus archivos sobre cómo servirlo",
    },
    h2Family: (family) => `Otros modelos ${family}`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} comparte ${total} GB de memoria entre la CPU y la GPU; por defecto, la GPU puede direccionar unos ${vram} GB, y LLMScale asigna ${usable} a un modelo${apple ? "" : ", el 92\u00a0% de lo que indica la GPU, valor predeterminado de vLLM"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} tiene ${vram} GB de memoria. LLMScale asigna ${usable} de ella a un modelo: el valor predeterminado de vLLM, --gpu-memory-utilization 0.92, aplicado a lo que indica la tarjeta; el resto queda para el contexto de CUDA.`,
      bandwidth: (bw) => `Su ancho de banda de memoria, ${bw} GB/s, es lo que limita la velocidad de generación una vez que el modelo cabe.`,
      apple: "vLLM no tiene backend de Metal, así que los modelos se ejecutan en este dispositivo con llama.cpp o MLX.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `De los ${models} modelos abiertos populares de abajo, ${bf16} caben en BF16, ${fp8} en FP8 y ${int4} en INT4 con un contexto de 8k para un usuario.`,
    },
    title: (name) => `¿Qué LLM caben en ${name}?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `Qué LLM abiertos caben en ${name} (${usable} utilizables): ${int4} de ${models} modelos populares en INT4 y ${bf16} en BF16, con usuarios simultáneos y contexto máximo para cada uno.`,
    h1: (name) => `¿Qué LLM caben en ${name}?`,
    doesNotFit: " (no cabe)",
    thModel: "Modelo",
    thUsers: "Usuarios",
    thMaxContext: "Contexto máx.",
    tableNote:
      "Memoria con un contexto de 8k para un usuario (o el máximo del modelo, si es menor), caché KV en FP16 y la sobrecarga de vLLM con los valores predeterminados de esta tarjeta. Los usuarios (cada uno con 8k) y el contexto máximo corresponden a la mayor precisión que cabe.",
    usableMemory: "memoria utilizable",
    answer: ({ models, bf16, int4 }) => `${int4} de ${models} modelos caben en INT4; ${bf16}, en BF16.`,
    h2Fit: (name) => `Qué LLM caben en ${name}`,
    quantization: (href) => `Qué significan BF16, FP8 e INT4 para la memoria: <a href="${href}">cuantización y VRAM</a>.`,
    parallel:
      "Un modelo que no cabe en una tarjeta puede ejecutarse igualmente en varias: el paralelismo de tensores reparte sus pesos y su caché KV entre ellas. La calculadora determina cuántas hacen falta.",
    h2Size: (name) => `Dimensiona un modelo en ${name}`,
    open: "Abre la calculadora con esta GPU",
    h2Others: "Otras GPU",
  },

  hubs: {
    models: {
      title: "Requisitos de VRAM de los LLM por modelo",
      description: (models) =>
        `Memoria de GPU para ${models} LLM abiertos populares — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — en BF16 e INT4, con las GPU en las que caben y la memoria para el ajuste fino de cada uno.`,
      h1: "Requisitos de VRAM de los LLM por modelo",
      lede: (models) =>
        `Cuánta memoria de GPU necesitan ${models} modelos abiertos populares, calculada a partir de la arquitectura de cada uno: pesos, caché KV y sobrecarga en BF16 e INT4 para un usuario con un contexto de 8k. Cada página lo desglosa por precisión y contexto, enumera las GPU en las que cabe y cuántos usuarios caben, y añade la memoria para el ajuste fino.`,
      active: "activos",
      thModel: "Modelo",
      thParams: "Parámetros",
      thMaxContext: "Contexto máx.",
      note: "Un usuario, caché KV en FP16 y la sobrecarga de vLLM en una GPU; los modelos con un contexto máximo más corto se muestran con ese máximo.",
      links: { size: "Dimensiona cualquier modelo de Hugging Face", byGpu: "Qué LLM caben en cada GPU", memory: "Cómo funciona la memoria de un LLM" },
    },
    gpus: {
      title: "¿Qué LLM caben en cada GPU?",
      description:
        "Qué LLM abiertos populares caben en RTX 4090, RTX 5090, H100, H200, B200, la serie M de Apple, Strix Halo y DGX Spark — en BF16, FP8 e INT4, con usuarios y contexto máximo.",
      h1: "Qué LLM caben en cada GPU",
      lede: ({ models, gpus }) =>
        `Cuáles de ${models} LLM abiertos populares caben en ${gpus} GPU en las que la gente los ejecuta — tarjetas de consumo y de estación de trabajo, GPU de centro de datos, Apple Silicon y PC de IA con memoria unificada. Cada página enumera todos los modelos con su memoria en BF16, FP8 e INT4, cuántos usuarios caben y el contexto más largo que puede contener.`,
      thType: "Tipo",
      thUsable: "Utilizable",
      thBf16: "Modelos en BF16",
      thInt4: "Modelos en INT4",
      note: (models) =>
        `De ${models} modelos, con un contexto de 8k para un usuario. Para las tarjetas dedicadas se cuenta con el 92\u00a0% de su memoria, el valor predeterminado de vLLM; para los dispositivos de memoria unificada, con la parte que su GPU puede direccionar; cada uno con la sobrecarga de vLLM según sus propios valores predeterminados.`,
      links: { size: "Dimensiona un modelo en cualquier GPU", byModel: "Requisitos de VRAM por modelo", memory: "Cómo funciona la memoria de un LLM" },
    },
    concepts: {
      title: "Memoria de un LLM: caché KV, GQA y cuantización",
      description:
        "Los conceptos que deciden cuánta memoria de GPU necesita un LLM — la caché KV, la grouped-query attention y la latent attention, la cuantización — explicados con modelos reales y cifras calculadas.",
      h1: "Cómo funciona la memoria de un LLM",
      lede: "Tres guías sobre los conceptos que deciden cuánta memoria de GPU necesita un modelo de lenguaje. Cada una trabaja con modelos reales, y cada cifra que contienen la calcula el mismo motor que la calculadora.",
      links: { calculator: "Abre la calculadora", byModel: "Requisitos de VRAM por modelo", byGpu: "Qué LLM caben en cada GPU" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Modelo",
      thLayers: "Capas",
      thShape: "Cabezas KV × dim. de cabeza",
      thPerToken: "Por token",
      attentionLink: "GQA, MQA y MLA",
      quantLink: "cuantización y VRAM",
      text: (v) => ({
        title: "Tamaño de la caché KV: fórmula y ejemplos",
        description: `Cuánto crece la caché KV de un LLM: la fórmula, un ejemplo práctico con ${v.ex}, cifras por token de modelos populares y el efecto de la concurrencia, FP8 y la grouped-query attention.`,
        h1: "Tamaño de la caché KV: la fórmula, con modelos reales",
        crumb: "Caché KV",
        summary: "La fórmula, un ejemplo práctico, cifras por token de modelos populares, y por qué la concurrencia la multiplica mientras que la cuantización de los pesos no la toca.",
        body: `<p class="lede">Cuando un modelo de lenguaje genera texto, guarda las claves y los valores que calculó para cada token anterior, en cada capa, para no tener que volver a calcularlos para el siguiente. Ese almacén es la caché KV. Es la parte de la memoria de GPU que las reglas prácticas dejan fuera, y con un contexto largo o con muchos usuarios supera a los pesos del modelo.</p>
<h2>La fórmula</h2>
<p>Para cada token, cada capa guarda un vector de clave y un vector de valor por cada cabeza de clave-valor:</p>
<pre><code>bytes de KV por token = 2 × capas × cabezas de clave-valor × dimensión de la cabeza × bytes por valor
caché KV              = bytes de KV por token × longitud de contexto × secuencias simultáneas</code></pre>
<p>El 2 cuenta la clave y el valor. Un valor ocupa 2 bytes en FP16 o BF16 y 1 byte en FP8. Las capas, las cabezas de clave-valor y la dimensión de la cabeza de atención las fija la arquitectura — <code>num_hidden_layers</code>, <code>num_key_value_heads</code> y <code>head_dim</code> en el config.json del modelo —, y por eso dos modelos del mismo tamaño pueden necesitar cachés muy distintas. Los modelos con multi-head latent attention sustituyen la parte central de la fórmula; consulta ${v.attention}.</p>
<h2>Un ejemplo práctico: ${v.ex}</h2>
<p>${v.exLink} tiene ${v.layers} capas, ${v.kvHeads} cabezas de clave-valor y una dimensión de la cabeza de atención de ${v.headDim}. En FP16 eso da 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} bytes, o ${v.perTok}, por token. Un usuario con 8k tokens necesita ${v.kv8k} de caché; con su contexto completo de ${v.exMax} tokens, ${v.kvMax} — ${v.kvOverWeights ? `más que sus ${v.weights} de pesos en BF16` : `frente a ${v.weights} de pesos en BF16`}.</p>
<p>No es el número de parámetros lo que lo decide. ${v.peerLink} y ${v.exLink} tienen un tamaño parecido — ${v.peerParams} y ${v.exParams} parámetros —, pero ${v.ex} guarda ${v.perTok} por token y ${v.peer}, ${v.peerTok}: una diferencia de ${v.ratio} que viene de las capas y las cabezas de clave-valor.</p>
<h2>Caché por token en modelos populares</h2>
${v.table}
<p class="note">FP16, una secuencia. —: más allá del contexto máximo del modelo. DeepSeek V3 almacena en caché un vector latente comprimido en lugar de claves y valores por cabeza. Gemma 2 y gpt-oss quedan fuera de esta tabla: sus capas de ventana deslizante dejan de crecer al llegar a la ventana, así que su costo por token baja a medida que crece el contexto. La calculadora lo cuenta capa por capa.</p>
<h2>La concurrencia la multiplica</h2>
<p>Cada secuencia simultánea tiene su propia caché. En una sola ${v.h100}, con ${v.h100Usable} utilizables, ${v.ex} en BF16 deja espacio para ${v.users[0]} usuarios con 8k tokens cada uno, ${v.users[1]} con 32k y ${v.users[2]} con 128k. Los pesos fijan el mínimo; la caché decide cuántas personas caben por encima.</p>
<h2>Qué la reduce y qué no</h2>
<ul class="plain">
<li><strong>Menos cabezas de clave-valor.</strong> La grouped-query attention y la multi-query attention comparten cabezas de clave-valor entre las cabezas de consulta, y la multi-head latent attention almacena en caché un vector latente comprimido. Esto viene con el modelo que elijas.</li>
<li><strong>Una caché KV en FP8.</strong> Un byte por valor en lugar de dos reduce la caché a la mitad. vLLM lo ofrece como <code>--kv-cache-dtype fp8</code>; puede costar exactitud en trabajos de contexto largo, así que valídalo primero.</li>
<li><strong>Un límite de contexto más bajo.</strong> La caché crece con cada token que contiene una secuencia, así que limitar la longitud de secuencia — <code>--max-model-len</code> en vLLM — limita el peor caso.</li>
<li><strong>No la cuantización de los pesos.</strong> Los pesos en INT4 o FP8 reducen solo los pesos; la caché conserva su propia precisión, así que el ahorro disminuye a medida que crece el contexto. Consulta ${v.quant}.</li>
<li><strong>La paged attention y la caché de prefijos</strong> aprovechan mejor la caché en lugar de hacerla más pequeña: la memoria se entrega en bloques a medida que crecen las secuencias en lugar de reservarse de antemano, y las solicitudes con el mismo prefijo pueden compartir sus bloques. LLMScale no modela esa eficiencia, así que sus cifras son la necesidad completa.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Dimensiona la caché KV para tu modelo</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Cuantización y VRAM</a></li>
  <li><a href="${v.modelsHref}">VRAM por modelo</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Modelo",
      thQueryHeads: "Cabezas de consulta",
      thKvHeads: "Cabezas KV",
      thAttention: "Atención",
      thPerToken: "Por token",
      thVsMha: "vs. MHA",
      kvLink: "tamaño de la caché KV",
      text: (v) => ({
        title: "GQA, MQA y MLA: atención y tamaño de la caché KV",
        description: `Cómo cambian la caché KV de un LLM la multi-head, la multi-query, la grouped-query y la multi-head latent attention, con ${v.gqaName} y ${v.mlaName} desarrollados paso a paso y ${v.models} modelos lado a lado.`,
        h1: "GQA, MQA y MLA: cómo la atención determina la caché KV",
        crumb: "GQA, MQA y MLA",
        summary:
          "Cuatro formas de organizar las cabezas de atención, por qué cambian la caché en un orden de magnitud, y cómo la latent attention de DeepSeek saca el número de cabezas de la fórmula.",
        body: `<p class="lede">La caché KV nace de la atención, y la forma en que un modelo organiza sus cabezas de atención puede cambiar la caché en un orden de magnitud con el mismo número de parámetros. Cuatro esquemas cubren los modelos abiertos actuales.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Cada cabeza de consulta tiene sus propias cabezas de clave y de valor, y la caché las guarda todas: 2 × capas × cabezas × dimensión de la cabeza × bytes por token. Es el diseño original del Transformer y el más caro de almacenar en caché. ${v.mha} todavía lo usa — ${v.mhaHeads} cabezas en ${v.mhaLayers} capas, ${v.mhaTok} por token.</p>
<h2>Multi-query attention (MQA)</h2>
<p>Todas las cabezas de consulta comparten una sola cabeza de clave y una sola cabeza de valor (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). La caché se reduce en el número total de cabezas — el mayor ahorro posible —, pero compartir un único conjunto de claves y valores entre todas las cabezas puede costar calidad.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Las cabezas de consulta se dividen en grupos, y cada grupo comparte una cabeza de clave-valor: más de una, pero menos que el número de cabezas de consulta. Ainslie et al. (2023) la propusieron como término medio — calidad cercana a la multi-head attention, velocidad cercana a la multi-query —, y ${v.gqaCount} de los ${v.bundled} modelos que incluye LLMScale la usan. ${v.gqa} agrupa ${v.gqaHeads} cabezas de consulta en ${v.gqaKvHeads} cabezas de clave-valor, así que almacena ${v.gqaTok} por token donde la multi-head attention necesitaría ${v.gqaMhaTok}: ${v.gqaRatio} menos.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 tomó otro camino. En lugar de claves y valores por cabeza, cada capa almacena en caché un vector latente comprimido por token, más una pequeña clave desacoplada que lleva la codificación posicional RoPE. La caché por token pasa a ser <code>capas × (kv_lora_rank + qk_rope_head_dim) × bytes</code>, y el número de cabezas desaparece de la fórmula. Para sus propias dimensiones, el artículo de DeepSeek-V2 (§2.1.3) lo sitúa en el tamaño de una GQA con solo 2,25 grupos.</p>
<p>${v.mla} almacena en caché ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} valores por capa en ${v.mlaLayers} capas: ${v.mlaTok} por token, ${v.mlaRatio} menos de lo que da la fórmula por cabeza. Con un contexto de 8k, eso son ${v.mla8k} en lugar de ${v.perHead8k}. Una calculadora que aplica la fórmula por cabeza a los modelos de DeepSeek sobrestima la caché en ese factor; LLMScale cambia de fórmula siempre que una configuración incluye ambos campos.</p>
<h2>Lado a lado</h2>
${v.table}
<p class="note">FP16. “vs. MHA”: cuántas veces más almacenaría en caché una versión multi-head del mismo modelo.</p>
<h2>Qué significa al elegir un modelo</h2>
<ul class="plain">
<li><strong>Mira las cabezas de clave-valor antes que el número de parámetros.</strong> ${v.small} y ${v.big} difieren en un ${v.pct}\u00a0% en parámetros y en ${v.sizeRatio} en caché por token.</li>
<li><strong>La disposición de la atención viene con el modelo.</strong> Para reducir la caché de un modelo que sirves tienes una caché KV en FP8, un contexto más corto o menos secuencias — consulta ${v.kv}.</li>
<li><strong>El paralelismo de tensores reparte las cabezas de clave-valor entre las GPU,</strong> así que la calculadora sugiere números de GPU que las dividen de forma exacta.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">Mira la disposición de atención de un modelo</a></li>
  <li><a href="${v.kvHref}">Tamaño de la caché KV</a></li>
  <li><a href="${v.quantHref}">Cuantización y VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Precisión",
      thBytes: "Bytes / parámetro",
      kvLink: "tamaño de la caché KV",
      text: (v) => ({
        title: "Cuantización de LLM y VRAM: BF16, FP8, INT4",
        description:
          "Cuánta memoria de GPU ocupan los pesos en BF16, FP8, INT8 e INT4 en modelos de 8B a 405B, qué son AWQ, GPTQ, GGUF, MXFP4 y NF4, y por qué cuantizar los pesos deja la caché KV como está.",
        h1: "Cuantización y VRAM: BF16, FP8, INT8 e INT4",
        crumb: "Cuantización",
        summary: "Bytes por parámetro de FP32 a INT4, los formatos que te encontrarás, por qué 4 bits no son exactamente medio byte y por qué no toca la caché KV.",
        body: `<p class="lede">La cuantización almacena los pesos de un modelo en menos bits. Los pesos suelen ser la mayor parte de la memoria de GPU, así que es la primera palanca a la que se recurre — pero solo reduce los pesos, y cada paso hacia abajo sacrifica algo de exactitud.</p>
<h2>Bytes por parámetro</h2>
<p>Los pesos ocupan <code>parámetros × bytes por parámetro</code>. BF16 y FP16 son la referencia — la mayoría de los modelos se publican en uno de ellos — y cualquier otra precisión es un múltiplo de ella.</p>
${v.table}
<p class="note">Solo los pesos, antes de la caché KV y la sobrecarga. En FP8, INT8 e INT4, el embedding y la capa de salida se quedan en 16 bits.</p>
<h2>Los formatos que te encontrarás</h2>
<ul class="plain">
<li><strong>BF16 y FP16</strong> — punto flotante de 16 bits. BF16 conserva el rango de FP32 con menos precisión, y por eso lo usan el entrenamiento y la mayoría de los puntos de control publicados.</li>
<li><strong>FP8</strong> — punto flotante de 8 bits, un byte por peso, con soporte en hardware en las GPU recientes de NVIDIA (Ada Lovelace, Hopper y posteriores). Algunos modelos se publican con puntos de control en FP8.</li>
<li><strong>INT8</strong> — enteros de 8 bits con factores de escala, un byte por peso.</li>
<li><strong>AWQ y GPTQ</strong> — métodos de 4 bits solo para los pesos: los pesos se almacenan en 4 bits y se calculan en 16. Se distribuyen como safetensors y están pensados para motores de inferencia en GPU como vLLM.</li>
<li><strong>GGUF</strong> — el formato de archivo de llama.cpp, con niveles de cuantización nombrados por bits (Q4, Q5, Q8…), usado en CPU, Apple Silicon y GPU de consumo.</li>
<li><strong>NVFP4 y MXFP4</strong> — formatos de punto flotante de 4 bits con escalas compartidas. gpt-oss publica los pesos de sus expertos en MXFP4, y así es como ${v.oss} cabe en una sola GPU de 80 GB: ${v.ossNeed} con un contexto de 8k para un usuario, frente a ${v.h100Usable} utilizables en una ${v.h100}.</li>
<li><strong>NF4</strong> — el NormalFloat de 4 bits de QLoRA, para el ajuste fino de adaptadores sobre un modelo base congelado y cuantizado.</li>
</ul>
<h2>Por qué 4 bits no son exactamente medio byte</h2>
<p>Los formatos reales de 4 bits también almacenan sus factores de escala — una escala de 16 bits por cada grupo de 128 pesos en AWQ y GPTQ, una escala de 8 bits por cada bloque de 32 en MXFP4 —, lo que da unos 4,25 bits por peso, y mantienen el embedding y la capa de salida en 16 bits. LLMScale cuenta ambas cosas, así que su cifra de 4 bits queda bastante por encima de la mitad de BF16: Qwen2.5-7B queda a menos del 2\u00a0% del punto de control AWQ del propio Qwen, y Qwen3-8B en FP8 coincide con el punto de control FP8 de RedHat hasta la centésima de GiB. Un punto de control que ya se publica cuantizado se dimensiona a partir de sus propios archivos. El NF4 de QLoRA con doble cuantización mide 4,127 bits, es decir, 0,516 bytes, por parámetro, y esa es la cifra que usa la calculadora de ajuste fino.</p>
<h2>No reduce la caché KV</h2>
<p>La caché KV tiene su propia precisión, que fija el motor de inferencia y no el formato de los pesos. Toma ${v.long} con un usuario y un contexto de 128k: sus pesos ocupan ${v.longBf16} en BF16 y ${v.longInt4} en INT4, mientras que la caché KV se mantiene en ${v.longKv} en FP16${v.kvOverInt4 ? " — más que los pesos en INT4" : ""}. Almacenar la caché en FP8 es una elección aparte que la reduce a la mitad; consulta ${v.kv}.</p>
<h2>Modelos de mezcla de expertos</h2>
<p>Cada experto se cuantiza, y cada experto sigue teniendo que estar en memoria. ${v.moe} tiene ${v.moeParams} parámetros: ${v.moeBf16} de pesos en BF16, ${v.moeInt4} en INT4. Sus ${v.moeActive} parámetros activos deciden cuánto trabajo hace cada token, no cuánta memoria ocupa el modelo.</p>
<h2>Elegir una precisión</h2>
<ul class="plain">
<li><strong>Empieza por lo que cabe.</strong> Cuando un modelo no cabe en una tarjeta, la calculadora indica la primera precisión más ligera con la que cabe.</li>
<li><strong>Mide el costo.</strong> Cada paso hacia abajo cambia exactitud por memoria, y cuánto depende del modelo y del método; pruébalo en tu propia tarea antes de servirlo.</li>
<li><strong>Deja que un punto de control pre-cuantizado hable por sí mismo.</strong> LLMScale lee su precisión de <code>quantization_config</code>, del nombre del repositorio o de la cabecera de safetensors, y vLLM carga puntos de control AWQ, GPTQ y FP8 sin la opción <code>--quantization</code>.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Compara precisiones para tu modelo</a></li>
  <li><a href="${v.kvHref}">Tamaño de la caché KV</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA y MLA</a></li>
  <li><a href="${v.gpusHref}">Qué LLM caben en cada GPU</a></li>
</ul>`,
      }),
    },
  },
};

export default es;

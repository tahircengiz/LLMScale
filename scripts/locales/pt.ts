// Português (Brasil): the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const pt: PageText = {
  section: { models: "Modelos", gpus: "GPUs", concepts: "Conceitos", feed: "Novidades", crumbs: "Trilha de navegação" },
  join: { sentence: " ", list: ", ", colon: ": " },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Usa multi-head latent attention (MLA): cada camada armazena em cache um único vetor latente comprimido de ${dims} dimensões por token, em vez de chaves e valores para cada cabeça, o que deixa seu cache KV ${ratio} menor do que a fórmula usual daria.`,
      mqa: ({ heads }) =>
        `Usa multi-query attention: todas as ${heads} cabeças de consulta compartilham uma única cabeça de chave-valor, então seu cache KV é ${heads}× menor do que uma multi-head attention completa exigiria.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `Usa atenção agrupada por consulta (GQA): ${heads} cabeças de consulta compartilham ${kvHeads} cabeças de chave-valor, então seu cache KV é ${ratio} menor do que uma multi-head attention completa exigiria.`,
      mha: ({ heads }) =>
        `Usa multi-head attention completa: cada uma das suas ${heads} cabeças guarda as próprias chaves e valores, então o cache KV é tão grande quanto o número de cabeças determina.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} tem ${params} parâmetros em ${layers} camadas.`,
      moe: ({ active, total }) =>
        `É um modelo de mistura de especialistas (MoE) com cerca de ${active} dos seus ${total} parâmetros ativos por token: a memória precisa conter todos eles, enquanto cada token passa só pela parte ativa.`,
      context: ({ max, kv }) => `Aceita até ${max} tokens de contexto; um usuário com esse tamanho de contexto precisa de ${kv} de cache KV em FP16, além dos pesos.`,
      gated: "Seu repositório no Hugging Face é restrito, então o LLMScale traz a arquitetura dele em um banco de dados embutido.",
    },
    title: (name) => `Requisitos de VRAM do ${name}`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} precisa de ${bf16} de memória da GPU em BF16 e de ${int4} em INT4 para um usuário com contexto de ${ctx}. Memória por precisão e contexto, as GPUs em que ele cabe, usuários simultâneos e memória para ajuste fino.`,
    h1: (name) => `${name}: de quanta VRAM ele precisa?`,
    oneUser: "um usuário",
    ctx: (k) => `contexto de ${k}`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `${weights} de pesos, ${kv} de cache KV e ${overhead} de sobrecarga do vLLM. Em INT4, a mesma carga de trabalho precisa de ${int4}.`,
    specLayers: "camadas",
    specMaxContext: "contexto máx.",
    specHeads: "cabeças",
    h2Memory: (name) => `Memória do ${name} por precisão e contexto`,
    thPrecision: "Precisão",
    kvCache: "cache KV",
    tableNote:
      "Um usuário, cache KV em FP16 e a sobrecarga do vLLM em uma GPU, com seus valores padrão para uma placa de menos de 70 GB. Quantizar reduz os pesos, não o cache KV, então a economia diminui à medida que o contexto cresce.",
    h2Holds: "Em quais GPUs individuais ele cabe",
    noSingleGpu: (counts) => `nenhuma GPU sozinha o comporta — o mínimo de GPUs para disponibilizá-lo, conforme a calculadora as distribui: ${counts}.`,
    fitNote: (ctx) =>
      `Com contexto de ${ctx} para um usuário, das placas menores para as maiores. Uma placa dedicada entra no cálculo com 92% da sua memória, o padrão do vLLM; um dispositivo de memória unificada, com a parte que sua GPU consegue endereçar; e cada um leva a sobrecarga do vLLM com seus próprios valores padrão.`,
    h2Users: "Quantos usuários cabem",
    doesNotFit: "não cabe",
    usersNote: (ctx) => `Usuários com contexto de ${ctx} cada, em uma placa. ✗: os pesos não deixam espaço nem para um.`,
    noCard: "Nenhuma placa daqui o comporta sozinha em nenhuma precisão; disponibilizá-lo exige dividi-lo entre várias GPUs com paralelismo de tensor.",
    h2FineTune: (name) => `Ajuste fino do ${name}`,
    thMethod: "Método",
    thMemory: "Memória",
    thSmallestGpu: "Menor GPU",
    modes: { full: "Ajuste fino completo", lora: "LoRA (rank 16, atenção)", qlora: "QLoRA (classificação 16, atenção)" },
    sharded: "várias GPUs, fragmentado",
    trainNote:
      "Comprimento da sequência 2.048, tamanho do lote 1, checkpointing de gradiente ativado, Adam. O ajuste fino completo guarda 16 bytes por parâmetro antes das ativações; o QLoRA armazena a base congelada em NF4 de 4 bits.",
    h2Source: "De onde vêm os números",
    kvFormula: {
      mla: "Com MLA, o cache KV é <code>camadas × (kv_lora_rank + qk_rope_head_dim) × bytes × contexto × usuários</code>.",
      heads: "O cache KV é <code>2 × camadas × cabeças de chave-valor × head dimension × bytes × contexto × usuários</code>.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${sliding} das suas ${layers} camadas aplicam a atenção sobre uma janela deslizante dos últimos ${window} tokens e não guardam mais do que isso; então, passada a janela, cada token adicional acrescenta ${pastWindow} KiB, a parte das outras ${fullLayers} camadas.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Os pesos são <code>parâmetros × bytes por parâmetro</code>. ${kvFormula} Para o ${name}, isso dá ${kib} KiB por token em FP16.${windowNote} São números de planejamento de capacidade: o mecanismo de inferência — vLLM, TGI, llama.cpp — e a eficiência da sua paged attention ainda mudam o número real.`,
    more: ({ kvCache, attention }) => `Mais sobre o <a href="${kvCache}">tamanho do cache KV</a> e sobre <a href="${attention}">GQA, MQA e MLA</a>.`,
    h2Work: (name) => `Trabalhe com o ${name}`,
    links: {
      size: "Dimensione para a sua carga de trabalho",
      train: "Memória para ajuste fino",
      vllm: "Parâmetros do vLLM",
      anatomy: "Anatomia do modelo",
      config: "O config.json dele, explicado",
      serving: "O que seus arquivos dizem sobre como disponibilizá-lo",
    },
    h2Family: (family) => `Outros modelos ${family}`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} compartilha ${total} GB de memória entre a CPU e a GPU; por padrão, a GPU consegue endereçar cerca de ${vram} GB dela, e o LLMScale reserva ${usable} para um modelo${apple ? "" : ", 92% do que a GPU informa, o padrão do vLLM"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} tem ${vram} GB de memória. O LLMScale reserva ${usable} dela para um modelo: o padrão do vLLM, --gpu-memory-utilization 0.92, aplicado ao que a placa informa; o resto fica para o contexto CUDA.`,
      bandwidth: (bw) => `Sua largura de banda de memória, ${bw} GB/s, é o que limita a velocidade de geração depois que o modelo cabe.`,
      apple: "O vLLM não tem backend Metal, então os modelos rodam neste dispositivo com llama.cpp ou MLX.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `Dos ${models} modelos abertos populares abaixo, ${bf16} cabem em BF16, ${fp8} em FP8 e ${int4} em INT4 com contexto de 8k para um usuário.`,
    },
    title: (name) => `Quais LLMs cabem em ${name}?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `Quais LLMs abertos cabem em ${name} (${usable} utilizáveis): ${int4} de ${models} modelos populares em INT4 e ${bf16} em BF16, com usuários simultâneos e contexto máximo para cada um.`,
    h1: (name) => `Quais LLMs cabem em ${name}?`,
    doesNotFit: " (não cabe)",
    thModel: "Modelo",
    thUsers: "Usuários",
    thMaxContext: "Contexto máx.",
    tableNote:
      "Memória com contexto de 8k para um usuário (ou o máximo do modelo, se for menor), cache KV em FP16 e a sobrecarga do vLLM com os valores padrão desta placa. Os usuários (cada um com 8k) e o contexto máximo valem para a maior precisão que cabe.",
    usableMemory: "memória utilizável",
    answer: ({ models, bf16, int4 }) => `${int4} de ${models} modelos cabem em INT4; ${bf16}, em BF16.`,
    h2Fit: (name) => `Quais LLMs cabem em ${name}`,
    quantization: (href) => `O que BF16, FP8 e INT4 significam para a memória: <a href="${href}">quantização e VRAM</a>.`,
    parallel:
      "Um modelo que não cabe em uma placa ainda pode rodar em várias: o paralelismo de tensor divide seus pesos e seu cache KV entre elas. A calculadora determina quantas são necessárias.",
    h2Size: (name) => `Dimensione um modelo em ${name}`,
    open: "Abra a calculadora com esta GPU",
    h2Others: "Outras GPUs",
  },

  hubs: {
    models: {
      title: "Requisitos de VRAM de LLMs por modelo",
      description: (models) =>
        `Memória da GPU para ${models} LLMs abertos populares — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — em BF16 e INT4, com as GPUs em que cabem e a memória para o ajuste fino de cada um.`,
      h1: "Requisitos de VRAM de LLMs por modelo",
      lede: (models) =>
        `De quanta memória da GPU precisam ${models} modelos abertos populares, calculada a partir da arquitetura de cada um: pesos, cache KV e sobrecarga em BF16 e INT4 para um usuário com contexto de 8k. Cada página detalha por precisão e contexto, lista as GPUs que comportam o modelo e quantos usuários cabem, e acrescenta a memória para ajuste fino.`,
      active: "ativos",
      thModel: "Modelo",
      thParams: "Parâmetros",
      thMaxContext: "Contexto máx.",
      note: "Um usuário, cache KV em FP16 e a sobrecarga do vLLM em uma GPU; os modelos com contexto máximo menor aparecem com esse máximo.",
      links: { size: "Dimensione qualquer modelo do Hugging Face", byGpu: "Quais LLMs cabem em cada GPU", memory: "Como funciona a memória de um LLM" },
    },
    gpus: {
      title: "Quais LLMs cabem em cada GPU?",
      description:
        "Quais LLMs abertos populares cabem em RTX 4090, RTX 5090, H100, H200, B200, série M da Apple, Strix Halo e DGX Spark — em BF16, FP8 e INT4, com usuários e contexto máximo.",
      h1: "Quais LLMs cabem em cada GPU",
      lede: ({ models, gpus }) =>
        `Quais de ${models} LLMs abertos populares cabem em ${gpus} GPUs em que as pessoas os rodam — placas de consumo e de estação de trabalho, GPUs de data center, Apple Silicon e PCs de IA com memória unificada. Cada página lista todos os modelos com sua memória em BF16, FP8 e INT4, quantos usuários cabem e o maior contexto que a GPU comporta.`,
      thType: "Tipo",
      thUsable: "Utilizável",
      thBf16: "Modelos em BF16",
      thInt4: "Modelos em INT4",
      note: (models) =>
        `De ${models} modelos, com contexto de 8k para um usuário. As placas dedicadas entram no cálculo com 92% da sua memória, o padrão do vLLM; os dispositivos de memória unificada, com a parte que sua GPU consegue endereçar; cada um com a sobrecarga do vLLM nos seus próprios valores padrão.`,
      links: { size: "Dimensione um modelo em qualquer GPU", byModel: "Requisitos de VRAM por modelo", memory: "Como funciona a memória de um LLM" },
    },
    concepts: {
      title: "Como funciona a memória de LLMs: cache KV, GQA, quantização",
      description:
        "Os conceitos que decidem de quanta memória da GPU um LLM precisa — o cache KV, a atenção agrupada por consulta e a latent attention, a quantização — explicados com modelos reais e números calculados.",
      h1: "Como funciona a memória de um LLM",
      lede: "Três guias sobre os conceitos que decidem de quanta memória da GPU um modelo de linguagem precisa. Cada um trabalha com modelos reais, e cada número que eles trazem é calculado pelo mesmo mecanismo da calculadora.",
      links: { calculator: "Abra a calculadora", byModel: "Requisitos de VRAM por modelo", byGpu: "Quais LLMs cabem em cada GPU" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Modelo",
      thLayers: "Camadas",
      thShape: "Cabeças KV × head dim",
      thPerToken: "Por token",
      attentionLink: "GQA, MQA e MLA",
      quantLink: "quantização e VRAM",
      text: (v) => ({
        title: "Tamanho do cache KV: fórmula e exemplos",
        description: `Até onde cresce o cache KV de um LLM: a fórmula, um exemplo prático com ${v.ex}, números por token de modelos populares e o que a simultaneidade, o FP8 e a atenção agrupada por consulta fazem com ele.`,
        h1: "Tamanho do cache KV: a fórmula, com modelos reais",
        crumb: "Cache KV",
        summary: "A fórmula, um exemplo prático, números por token de modelos populares e por que a simultaneidade o multiplica, enquanto a quantização dos pesos não mexe nele.",
        body: `<p class="lede">Quando um modelo de linguagem gera texto, ele guarda as chaves e os valores que calculou para cada token anterior, em cada camada, para não ter que calculá-los de novo para o próximo. Esse armazenamento é o cache KV. É a parte da memória da GPU que as regras práticas deixam de fora, e com contexto longo ou muitos usuários ele ultrapassa os pesos do modelo.</p>
<h2>A fórmula</h2>
<p>Para cada token, cada camada guarda um vetor de chave e um vetor de valor por cabeça de chave-valor:</p>
<pre><code>bytes de KV por token = 2 × camadas × cabeças de chave-valor × head dimension × bytes por valor
cache KV              = bytes de KV por token × tamanho do contexto × sequências simultâneas</code></pre>
<p>O 2 conta a chave e o valor. Um valor ocupa 2 bytes em FP16 ou BF16 e 1 byte em FP8. As camadas, as cabeças de chave-valor e a head dimension são fixadas pela arquitetura — <code>num_hidden_layers</code>, <code>num_key_value_heads</code> e <code>head_dim</code> no config.json do modelo —, e por isso dois modelos do mesmo tamanho podem precisar de caches muito diferentes. Os modelos com multi-head latent attention substituem a parte central da fórmula; veja ${v.attention}.</p>
<h2>Um exemplo prático: ${v.ex}</h2>
<p>${v.exLink} tem ${v.layers} camadas, ${v.kvHeads} cabeças de chave-valor e uma head dimension de ${v.headDim}. Em FP16, isso dá 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} bytes, ou ${v.perTok}, por token. Um usuário com 8k tokens precisa de ${v.kv8k} de cache; com o contexto completo de ${v.exMax} tokens, ${v.kvMax} — ${v.kvOverWeights ? `mais do que os seus ${v.weights} de pesos em BF16` : `contra ${v.weights} de pesos em BF16`}.</p>
<p>Não é o número de parâmetros que decide. ${v.peerLink} e ${v.exLink} têm tamanhos próximos — ${v.peerParams} e ${v.exParams} parâmetros —, mas ${v.ex} guarda ${v.perTok} por token e ${v.peer}, ${v.peerTok}: uma diferença de ${v.ratio} que vem das camadas e das cabeças de chave-valor.</p>
<h2>Cache por token em modelos populares</h2>
${v.table}
<p class="note">FP16, uma sequência. —: além do contexto máximo do modelo. O DeepSeek V3 armazena em cache um vetor latente comprimido em vez de chaves e valores por cabeça. O Gemma 2 e o gpt-oss ficam fora desta tabela: suas camadas de janela deslizante param de crescer ao atingir a janela, então o custo por token deles cai à medida que o contexto cresce. A calculadora conta isso camada por camada.</p>
<h2>A simultaneidade o multiplica</h2>
<p>Cada sequência simultânea tem um cache próprio. Em uma única ${v.h100}, com ${v.h100Usable} utilizáveis, ${v.ex} em BF16 deixa espaço para ${v.users[0]} usuários com 8k tokens cada, ${v.users[1]} com 32k e ${v.users[2]} com 128k. Os pesos definem o piso; o cache decide quantas pessoas cabem acima dele.</p>
<h2>O que o reduz e o que não reduz</h2>
<ul class="plain">
<li><strong>Menos cabeças de chave-valor.</strong> A atenção agrupada por consulta e a multi-query attention compartilham cabeças de chave-valor entre as cabeças de consulta, e a multi-head latent attention armazena em cache um vetor latente comprimido. Isso vem com o modelo que você escolhe.</li>
<li><strong>Um cache KV em FP8.</strong> Um byte por valor em vez de dois reduz o cache pela metade. O vLLM oferece isso como <code>--kv-cache-dtype fp8</code>; pode custar acurácia em trabalhos de contexto longo, então valide antes.</li>
<li><strong>Um limite de contexto menor.</strong> O cache cresce a cada token que uma sequência contém, então limitar o comprimento da sequência — <code>--max-model-len</code> no vLLM — limita o pior caso.</li>
<li><strong>Não a quantização dos pesos.</strong> Pesos em INT4 ou FP8 reduzem só os pesos; o cache mantém a própria precisão, então a economia diminui à medida que o contexto cresce. Veja ${v.quant}.</li>
<li><strong>Paged attention e cache de prefixos</strong> aproveitam melhor o cache em vez de diminuí-lo: a memória é entregue em blocos à medida que as sequências crescem, em vez de ser reservada de antemão, e solicitações com o mesmo prefixo podem compartilhar seus blocos. O LLMScale não modela essa eficiência, então seus números são a necessidade completa.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Dimensione o cache KV para o seu modelo</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Quantização e VRAM</a></li>
  <li><a href="${v.modelsHref}">VRAM por modelo</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Modelo",
      thQueryHeads: "Cabeças de consulta",
      thKvHeads: "Cabeças KV",
      thAttention: "Atenção",
      thPerToken: "Por token",
      thVsMha: "vs. MHA",
      kvLink: "tamanho do cache KV",
      text: (v) => ({
        title: "GQA, MQA e MLA: atenção e tamanho do cache KV",
        description: `Como a multi-head attention, a multi-query attention, a atenção agrupada por consulta e a multi-head latent attention mudam o cache KV de um LLM, com ${v.gqaName} e ${v.mlaName} calculados passo a passo e ${v.models} modelos lado a lado.`,
        h1: "GQA, MQA e MLA: como a atenção determina o cache KV",
        crumb: "GQA, MQA e MLA",
        summary:
          "Quatro formas de organizar as cabeças de atenção, por que elas mudam o cache em uma ordem de grandeza e como a latent attention do DeepSeek tira o número de cabeças da fórmula.",
        body: `<p class="lede">O cache KV nasce da atenção, e a forma como um modelo organiza suas cabeças de atenção pode mudar o cache em uma ordem de grandeza com o mesmo número de parâmetros. Quatro arranjos cobrem os modelos abertos atuais.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Cada cabeça de consulta tem cabeças de chave e de valor próprias, e o cache guarda todas elas: 2 × camadas × cabeças × head dimension × bytes por token. É o design original do Transformer e o mais caro de armazenar em cache. ${v.mha} ainda o usa — ${v.mhaHeads} cabeças em ${v.mhaLayers} camadas, ${v.mhaTok} por token.</p>
<h2>Multi-query attention (MQA)</h2>
<p>Todas as cabeças de consulta compartilham uma única cabeça de chave e uma única cabeça de valor (Shazeer, 2019, “Fast Transformer Decoding: One Write-Head is All You Need”). O cache diminui pelo número total de cabeças — a maior economia possível —, mas compartilhar um único conjunto de chaves e valores entre todas as cabeças pode custar qualidade.</p>
<h2>Atenção agrupada por consulta (GQA)</h2>
<p>As cabeças de consulta são divididas em grupos, e cada grupo compartilha uma cabeça de chave-valor: mais de uma, menos que o número de cabeças de consulta. Ainslie et al. (2023) a propuseram como meio-termo — qualidade próxima à da multi-head attention, velocidade próxima à da multi-query —, e ${v.gqaCount} dos ${v.bundled} modelos que o LLMScale traz a usam. ${v.gqa} agrupa ${v.gqaHeads} cabeças de consulta em ${v.gqaKvHeads} cabeças de chave-valor, então armazena em cache ${v.gqaTok} por token onde a multi-head attention precisaria de ${v.gqaMhaTok}: ${v.gqaRatio} menos.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>O DeepSeek-V2 seguiu outro caminho. Em vez de chaves e valores por cabeça, cada camada armazena em cache um vetor latente comprimido por token, mais uma pequena chave desacoplada que carrega a codificação posicional rotativa (RoPE). O cache por token passa a ser <code>camadas × (kv_lora_rank + qk_rope_head_dim) × bytes</code>, e o número de cabeças sai da fórmula. Para as próprias dimensões, o artigo do DeepSeek-V2 (§2.1.3) coloca isso no tamanho de uma GQA com apenas 2,25 grupos.</p>
<p>${v.mla} armazena em cache ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} valores por camada em ${v.mlaLayers} camadas: ${v.mlaTok} por token, ${v.mlaRatio} menos do que dá a fórmula por cabeça. Com contexto de 8k, isso dá ${v.mla8k} em vez de ${v.perHead8k}. Uma calculadora que aplica a fórmula por cabeça aos modelos do DeepSeek superestima o cache nesse fator; o LLMScale troca de fórmula sempre que uma configuração traz os dois campos.</p>
<h2>Lado a lado</h2>
${v.table}
<p class="note">FP16. “vs. MHA”: quantas vezes mais uma versão multi-head do mesmo modelo armazenaria em cache.</p>
<h2>O que isso significa ao escolher um modelo</h2>
<ul class="plain">
<li><strong>Olhe as cabeças de chave-valor antes do número de parâmetros.</strong> ${v.small} e ${v.big} diferem em ${v.pct}% nos parâmetros e em ${v.sizeRatio} no cache por token.</li>
<li><strong>O arranjo da atenção vem com o modelo.</strong> Para reduzir o cache de um modelo que você disponibiliza, você tem um cache KV em FP8, um contexto menor ou menos sequências — veja o ${v.kv}.</li>
<li><strong>O paralelismo de tensor divide as cabeças de chave-valor entre as GPUs,</strong> então a calculadora sugere números de GPUs que as dividem por igual.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">Veja o arranjo de atenção de um modelo</a></li>
  <li><a href="${v.kvHref}">Tamanho do cache KV</a></li>
  <li><a href="${v.quantHref}">Quantização e VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Precisão",
      thBytes: "Bytes / parâmetro",
      kvLink: "tamanho do cache KV",
      text: (v) => ({
        title: "Quantização de LLMs e VRAM: BF16, FP8, INT4",
        description:
          "Quanta memória da GPU os pesos ocupam em BF16, FP8, INT8 e INT4 em modelos de 8B a 405B, o que são AWQ, GPTQ, GGUF, MXFP4 e NF4, e por que quantizar os pesos deixa o cache KV como está.",
        h1: "Quantização e VRAM: BF16, FP8, INT8 e INT4",
        crumb: "Quantização",
        summary: "Bytes por parâmetro de FP32 a INT4, os formatos que você vai encontrar, por que 4 bits não são exatamente meio byte e por que a quantização não mexe no cache KV.",
        body: `<p class="lede">A quantização armazena os pesos de um modelo em menos bits. Os pesos costumam ser a maior parte da memória da GPU, então essa é a primeira alavanca que se procura — mas ela reduz só os pesos, e cada degrau para baixo troca um pouco de acurácia.</p>
<h2>Bytes por parâmetro</h2>
<p>Os pesos ocupam <code>parâmetros × bytes por parâmetro</code>. BF16 e FP16 são a referência — a maioria dos modelos é lançada em um deles — e qualquer outra precisão é um múltiplo disso.</p>
${v.table}
<p class="note">Só os pesos, antes do cache KV e da sobrecarga. Em FP8, INT8 e INT4, o embedding e a camada de saída ficam em 16 bits.</p>
<h2>Os formatos que você vai encontrar</h2>
<ul class="plain">
<li><strong>BF16 e FP16</strong> — ponto flutuante de 16 bits. O BF16 mantém o intervalo do FP32 com menos precisão, e por isso o treinamento e a maioria dos checkpoints lançados o usam.</li>
<li><strong>FP8</strong> — ponto flutuante de 8 bits, um byte por peso, com suporte em hardware nas GPUs recentes da NVIDIA (Ada Lovelace, Hopper e posteriores). Alguns modelos são lançados com checkpoints em FP8.</li>
<li><strong>INT8</strong> — inteiros de 8 bits com fatores de escala, um byte por peso.</li>
<li><strong>AWQ e GPTQ</strong> — métodos de 4 bits só para os pesos: os pesos são armazenados em 4 bits e calculados em 16. São distribuídos como safetensors e voltados a mecanismos de inferência em GPU, como o vLLM.</li>
<li><strong>GGUF</strong> — o formato de arquivo do llama.cpp, com níveis de quantização nomeados por bits (Q4, Q5, Q8…), usado em CPUs, Apple Silicon e GPUs de consumo.</li>
<li><strong>NVFP4 e MXFP4</strong> — formatos de ponto flutuante de 4 bits com escalas compartilhadas. O gpt-oss traz os pesos dos seus especialistas em MXFP4, e é assim que ${v.oss} cabe em uma única GPU de 80 GB: ${v.ossNeed} com contexto de 8k para um usuário, contra ${v.h100Usable} utilizáveis em uma ${v.h100}.</li>
<li><strong>NF4</strong> — o NormalFloat de 4 bits do QLoRA, para fazer o ajuste fino de adaptadores sobre um modelo base congelado e quantizado.</li>
</ul>
<h2>Por que 4 bits não são exatamente meio byte</h2>
<p>Os formatos reais de 4 bits também armazenam seus fatores de escala — uma escala de 16 bits para cada grupo de 128 pesos no AWQ e no GPTQ, uma escala de 8 bits para cada bloco de 32 no MXFP4 —, o que dá cerca de 4,25 bits por peso, e mantêm o embedding e a camada de saída em 16 bits. O LLMScale conta as duas coisas, então seu número de 4 bits fica bem acima da metade do BF16: o Qwen2.5-7B fica a menos de 2% do checkpoint AWQ do próprio Qwen, e o Qwen3-8B em FP8 coincide com o checkpoint FP8 da RedHat até o centésimo de GiB. Um checkpoint que já vem quantizado é dimensionado pelos próprios arquivos. O NF4 do QLoRA com quantização dupla mede 4,127 bits, ou 0,516 bytes, por parâmetro, e esse é o número que a calculadora de ajuste fino usa.</p>
<h2>A quantização não reduz o cache KV</h2>
<p>O cache KV tem uma precisão própria, definida pelo mecanismo de inferência e não pelo formato dos pesos. Pegue ${v.long} com um usuário e contexto de 128k: seus pesos ocupam ${v.longBf16} em BF16 e ${v.longInt4} em INT4, enquanto o cache KV continua em ${v.longKv} em FP16${v.kvOverInt4 ? " — mais do que os pesos em INT4" : ""}. Armazenar o cache em FP8 é uma escolha à parte, que o reduz pela metade; veja o ${v.kv}.</p>
<h2>Modelos de mistura de especialistas</h2>
<p>Cada especialista é quantizado, e cada especialista ainda precisa estar na memória. ${v.moe} tem ${v.moeParams} parâmetros: ${v.moeBf16} de pesos em BF16, ${v.moeInt4} em INT4. Seus ${v.moeActive} parâmetros ativos decidem quanto trabalho cada token faz, não quanta memória o modelo ocupa.</p>
<h2>Escolhendo uma precisão</h2>
<ul class="plain">
<li><strong>Comece pelo que cabe.</strong> Quando um modelo não cabe em uma placa, a calculadora indica a primeira precisão mais leve com que ele cabe.</li>
<li><strong>Meça o custo.</strong> Cada degrau para baixo troca acurácia por memória, e quanto depende do modelo e do método; teste na sua própria tarefa antes de disponibilizá-lo.</li>
<li><strong>Deixe um checkpoint pré-quantizado falar por si.</strong> O LLMScale lê a precisão dele em <code>quantization_config</code>, no nome do repositório ou no cabeçalho do safetensors, e o vLLM carrega checkpoints AWQ, GPTQ e FP8 sem a flag <code>--quantization</code>.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Compare precisões para o seu modelo</a></li>
  <li><a href="${v.kvHref}">Tamanho do cache KV</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA e MLA</a></li>
  <li><a href="${v.gpusHref}">Quais LLMs cabem em cada GPU</a></li>
</ul>`,
      }),
    },
  },
};

export default pt;

// Français: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const fr: PageText = {
  section: { models: "Modèles", gpus: "GPU", concepts: "Concepts", feed: "Actualités", crumbs: "Fil d'Ariane" },
  join: { sentence: " ", list: ", ", colon: " : " },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Il utilise la multi-head latent attention (MLA) : chaque couche met en cache un seul vecteur latent compressé de ${dims} dimensions par jeton au lieu de clés et de valeurs pour chaque tête, ce qui rend son cache KV ${ratio} plus petit que ce que donnerait la formule habituelle.`,
      mqa: ({ heads }) =>
        `Il utilise la multi-query attention : ses ${heads} têtes de requête partagent une seule tête clé-valeur, si bien que son cache KV est ${heads}× plus petit que ce qu'exigerait une multi-head attention complète.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `Il utilise la grouped-query attention : ${heads} têtes de requête partagent ${kvHeads} têtes clé-valeur, si bien que son cache KV est ${ratio} plus petit que ce qu'exigerait une multi-head attention complète.`,
      mha: ({ heads }) =>
        `Il utilise une multi-head attention complète : chacune de ses ${heads} têtes conserve ses propres clés et valeurs, si bien que le cache KV est aussi grand que le veut son nombre de têtes.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} compte ${params} paramètres répartis sur ${layers} couches.`,
      moe: ({ active, total }) =>
        `C'est un modèle mixture-of-experts dont environ ${active} des ${total} paramètres sont actifs par jeton : la mémoire doit tous les contenir, alors que chaque jeton ne traverse que la part active.`,
      context: ({ max, kv }) => `Il accepte jusqu'à ${max} jetons de contexte ; à cette longueur, un utilisateur a besoin de ${kv} de cache KV en FP16, en plus des poids.`,
      gated: "Son dépôt Hugging Face est à accès restreint ; LLMScale fournit donc son architecture dans une base de données intégrée.",
    },
    title: (name) => `Besoins en VRAM de ${name}`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} demande ${bf16} de mémoire GPU en BF16 et ${int4} en INT4 pour un utilisateur avec un contexte de ${ctx}. Mémoire par précision et par contexte, les GPU qui le contiennent, les utilisateurs simultanés et la mémoire pour le fine-tuning.`,
    h1: (name) => `${name} : combien de VRAM lui faut-il ?`,
    oneUser: "un utilisateur",
    ctx: (k) => `contexte de ${k}`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `${weights} de poids, ${kv} de cache KV et ${overhead} de surcharge de vLLM. En INT4, la même charge de travail demande ${int4}.`,
    specLayers: (n) => `${n} couches`,
    specMaxContext: (k) => `${k} contexte max.`,
    specHeads: ({ heads, kvHeads }) => `${heads}/${kvHeads} têtes`,
    h2Memory: (name) => `Mémoire de ${name} par précision et par contexte`,
    thPrecision: "Précision",
    kvCache: "cache KV",
    tableNote:
      "Un utilisateur, cache KV en FP16 et surcharge de vLLM sur un GPU, avec ses valeurs par défaut pour une carte de moins de 70 GB. La quantification réduit les poids, pas le cache KV, si bien que le gain diminue à mesure que le contexte s'allonge.",
    h2Holds: "Les GPU qui le contiennent à eux seuls",
    noSingleGpu: (counts) => `aucun GPU ne le contient à lui seul — le plus petit nombre de GPU pour le servir, tels que la calculatrice les répartit : ${counts}.`,
    fitNote: (ctx) =>
      `Avec un contexte de ${ctx} pour un utilisateur, les plus petites cartes en premier. Une carte dédiée est comptée pour 92 % de sa mémoire, la valeur par défaut de vLLM ; un appareil à mémoire unifiée, pour la part que son GPU peut adresser ; et chacun porte la surcharge de vLLM selon ses propres valeurs par défaut.`,
    h2Users: "Combien d'utilisateurs tiennent",
    doesNotFit: "ne tient pas",
    usersNote: (ctx) => `Utilisateurs avec un contexte de ${ctx} chacun, sur une carte. ✗ : les poids ne laissent de place pour aucun utilisateur.`,
    noCard: "Aucune carte de cette liste ne le contient à elle seule, quelle que soit la précision ; pour le servir, il faut le répartir sur plusieurs GPU avec le parallélisme de tenseurs.",
    h2FineTune: (name) => `Fine-tuning de ${name}`,
    thMethod: "Méthode",
    thMemory: "Mémoire",
    thSmallestGpu: "Plus petit GPU",
    modes: { full: "Affinage complet", lora: "LoRA (rang 16, attention)", qlora: "QLoRA (rang 16, attention)" },
    sharded: "plusieurs GPU, partitionné",
    trainNote:
      "Longueur de séquence 2 048, taille du lot 1, gradient checkpointing activé, Adam. L'affinage complet conserve 16 octets par paramètre avant les activations ; QLoRA stocke le modèle de base gelé en NF4 sur 4 bits.",
    h2Source: "D'où viennent les chiffres",
    kvFormula: {
      mla: "Avec MLA, le cache KV vaut <code>couches × (kv_lora_rank + qk_rope_head_dim) × octets × contexte × utilisateurs</code>.",
      heads: "Le cache KV vaut <code>2 × couches × têtes clé-valeur × dimension de tête d'attention × octets × contexte × utilisateurs</code>.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${sliding} de ses ${layers} couches appliquent l'attention sur une fenêtre glissante des ${window} derniers jetons et n'en conservent pas davantage ; au-delà, chaque jeton supplémentaire ajoute donc ${pastWindow} KiB, la part des ${fullLayers} autres couches.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Les poids valent <code>paramètres × octets par paramètre</code>. ${kvFormula} Pour ${name}, cela fait ${kib} KiB par jeton en FP16.${windowNote} Ce sont des chiffres de planification de la capacité : le moteur d'inférence — vLLM, TGI, llama.cpp — et l'efficacité de sa paged attention font encore varier le chiffre réel.`,
    more: ({ kvCache, attention }) => `En savoir plus sur la <a href="${kvCache}">taille du cache KV</a> et sur <a href="${attention}">GQA, MQA et MLA</a>.`,
    h2Work: (name) => `Travailler avec ${name}`,
    links: {
      size: "Le dimensionner pour votre charge de travail",
      train: "Mémoire pour le fine-tuning",
      vllm: "Paramètres vLLM",
      anatomy: "Anatomie du modèle",
      config: "Son config.json, expliqué",
      serving: "Ce que ses fichiers disent de sa mise en service",
    },
    h2Family: (family) => `Autres modèles ${family}`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} partage ${total} GB de mémoire entre le CPU et le GPU ; par défaut, le GPU peut en adresser environ ${vram} GB, et LLMScale en réserve ${usable} pour un modèle${apple ? "" : ", soit 92 % de ce que le GPU déclare, la valeur par défaut de vLLM"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} dispose de ${vram} GB de mémoire. LLMScale en réserve ${usable} pour un modèle : la valeur par défaut de vLLM, --gpu-memory-utilization 0.92, appliquée à ce que la carte déclare ; le reste est laissé au contexte CUDA.`,
      bandwidth: (bw) => `Sa bande passante mémoire, ${bw} GB/s, est ce qui limite la vitesse de génération une fois que le modèle tient en mémoire.`,
      apple: "vLLM n'a pas de backend Metal ; les modèles y tournent donc avec llama.cpp ou MLX.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `Sur les ${models} modèles ouverts populaires ci-dessous, ${bf16} ${bf16 > 1 ? "tiennent" : "tient"} en BF16, ${fp8} en FP8 et ${int4} en INT4 avec un contexte de 8k pour un utilisateur.`,
    },
    title: (name) => `Quels LLM tiennent sur ${name} ?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `Quels LLM ouverts tiennent sur ${name} (${usable} utilisables) : ${int4} des ${models} modèles populaires en INT4 et ${bf16} en BF16, avec les utilisateurs simultanés et le contexte maximal de chacun.`,
    h1: (name) => `Quels LLM tiennent sur ${name} ?`,
    doesNotFit: " (ne tient pas)",
    thModel: "Modèle",
    thUsers: "Utilisateurs",
    thMaxContext: "Contexte max.",
    tableNote:
      "Mémoire avec un contexte de 8k pour un utilisateur (ou le maximum du modèle, s'il est plus court), cache KV en FP16 et surcharge de vLLM avec les valeurs par défaut de cette carte. Les utilisateurs (chacun à 8k) et le contexte maximal correspondent à la plus haute précision qui tient.",
    usableMemory: "mémoire utilisable",
    answer: ({ models, bf16, int4 }) => `${int4} des ${models} modèles ${int4 > 1 ? "tiennent" : "tient"} en INT4, ${bf16} en BF16.`,
    h2Fit: (name) => `Quels LLM tiennent sur ${name}`,
    quantization: (href) => `Ce que BF16, FP8 et INT4 changent pour la mémoire : <a href="${href}">quantification et VRAM</a>.`,
    parallel:
      "Un modèle qui ne tient pas sur une carte peut tout de même tourner sur plusieurs : le parallélisme de tenseurs répartit ses poids et son cache KV entre elles. La calculatrice détermine combien il en faut.",
    h2Size: (name) => `Dimensionner un modèle sur ${name}`,
    open: "Ouvrir la calculatrice avec ce GPU",
    h2Others: "Autres GPU",
  },

  hubs: {
    models: {
      title: "Besoins en VRAM des LLM par modèle",
      description: (models) =>
        `Mémoire GPU pour ${models} LLM ouverts populaires — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — en BF16 et INT4, avec les GPU qui les contiennent et la mémoire pour le fine-tuning de chacun.`,
      h1: "Besoins en VRAM des LLM par modèle",
      lede: (models) =>
        `La mémoire GPU que demandent ${models} modèles ouverts populaires, calculée à partir de l'architecture propre à chacun : poids, cache KV et surcharge en BF16 et INT4 pour un utilisateur avec un contexte de 8k. Chaque page la détaille par précision et par contexte, liste les GPU qui contiennent le modèle et le nombre d'utilisateurs qui tiennent, et ajoute la mémoire pour le fine-tuning.`,
      active: "actifs",
      thModel: "Modèle",
      thParams: "Paramètres",
      thMaxContext: "Contexte max.",
      note: "Un utilisateur, cache KV en FP16 et surcharge de vLLM sur un GPU ; les modèles dont le contexte maximal est plus court sont présentés à ce maximum.",
      links: { size: "Dimensionner n'importe quel modèle Hugging Face", byGpu: "Quels LLM tiennent sur quel GPU", memory: "Comment fonctionne la mémoire d'un LLM" },
    },
    gpus: {
      title: "Quels LLM tiennent sur quel GPU ?",
      description:
        "Quels LLM ouverts populaires tiennent sur RTX 4090, RTX 5090, H100, H200, B200, les puces Apple série M, Strix Halo et DGX Spark — en BF16, FP8 et INT4, avec les utilisateurs et le contexte maximal.",
      h1: "Quels LLM tiennent sur quel GPU",
      lede: ({ models, gpus }) =>
        `Lesquels des ${models} LLM ouverts populaires tiennent sur ${gpus} GPU couramment utilisés pour les faire tourner — cartes grand public et de station de travail, GPU pour centres de données, Apple Silicon et PC IA à mémoire unifiée. Chaque page liste tous les modèles avec leur mémoire en BF16, FP8 et INT4, le nombre d'utilisateurs qui tiennent et le plus long contexte possible.`,
      thType: "Type",
      thUsable: "Utilisable",
      thBf16: "Modèles en BF16",
      thInt4: "Modèles en INT4",
      note: (models) =>
        `Sur ${models} modèles, avec un contexte de 8k pour un utilisateur. Les cartes dédiées sont comptées pour 92 % de leur mémoire, la valeur par défaut de vLLM ; les appareils à mémoire unifiée, pour la part que leur GPU peut adresser ; chacun avec la surcharge de vLLM selon ses propres valeurs par défaut.`,
      links: { size: "Dimensionner un modèle sur n'importe quel GPU", byModel: "Besoins en VRAM par modèle", memory: "Comment fonctionne la mémoire d'un LLM" },
    },
    concepts: {
      title: "Mémoire des LLM : cache KV, GQA, quantification",
      description:
        "Les notions qui déterminent la mémoire GPU dont un LLM a besoin — le cache KV, la grouped-query attention et la latent attention, la quantification — expliquées avec de vrais modèles et des chiffres calculés.",
      h1: "Comment fonctionne la mémoire d'un LLM",
      lede: "Trois guides sur les notions qui déterminent la mémoire GPU dont un modèle de langage a besoin. Chacun s'appuie sur de vrais modèles, et chaque chiffre qu'ils contiennent est calculé par le même moteur que la calculatrice.",
      links: { calculator: "Ouvrir la calculatrice", byModel: "Besoins en VRAM par modèle", byGpu: "Quels LLM tiennent sur quel GPU" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Modèle",
      thLayers: "Couches",
      thShape: "Têtes KV × dim. de tête",
      thPerToken: "Par jeton",
      attentionLink: "GQA, MQA et MLA",
      quantLink: "quantification et VRAM",
      text: (v) => ({
        title: "Taille du cache KV : formule et exemples",
        description: `Quelle taille atteint le cache KV d'un LLM : la formule, un exemple détaillé avec ${v.ex}, des chiffres par jeton pour des modèles populaires, et l'effet des séquences simultanées, du FP8 et de la grouped-query attention.`,
        h1: "Taille du cache KV : la formule, avec de vrais modèles",
        crumb: "Cache KV",
        summary: "La formule, un exemple détaillé, des chiffres par jeton pour des modèles populaires, et pourquoi les séquences simultanées le multiplient alors que la quantification des poids ne le touche pas.",
        body: `<p class="lede">Quand un modèle de langage génère du texte, il conserve les clés et les valeurs qu'il a calculées pour chaque jeton précédent, dans chaque couche, pour ne pas avoir à les recalculer pour le suivant. Ce stockage, c'est le cache KV. C'est la part de la mémoire GPU que les règles empiriques oublient, et avec un long contexte ou de nombreux utilisateurs, il dépasse les poids du modèle.</p>
<h2>La formule</h2>
<p>Pour chaque jeton, chaque couche stocke un vecteur de clé et un vecteur de valeur par tête clé-valeur :</p>
<pre><code>octets KV par jeton = 2 × couches × têtes clé-valeur × dimension de tête d'attention × octets par valeur
cache KV            = octets KV par jeton × longueur de contexte × séquences simultanées</code></pre>
<p>Le 2 compte la clé et la valeur. Une valeur occupe 2 octets en FP16 ou BF16 et 1 octet en FP8. Les couches, les têtes clé-valeur et la dimension de tête d'attention sont fixées par l'architecture — <code>num_hidden_layers</code>, <code>num_key_value_heads</code> et <code>head_dim</code> dans le config.json du modèle —, c'est pourquoi deux modèles de même taille peuvent demander des caches très différents. Les modèles à multi-head latent attention remplacent le milieu de la formule ; voir ${v.attention}.</p>
<h2>Un exemple détaillé : ${v.ex}</h2>
<p>${v.exLink} compte ${v.layers} couches, ${v.kvHeads} têtes clé-valeur et une dimension de tête d'attention de ${v.headDim}. En FP16, cela donne 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} octets, soit ${v.perTok}, par jeton. Un utilisateur à 8k jetons a besoin de ${v.kv8k} de cache ; avec son contexte complet de ${v.exMax} jetons, ${v.kvMax} — ${v.kvOverWeights ? `plus que ses ${v.weights} de poids en BF16` : `contre ${v.weights} de poids en BF16`}.</p>
<p>Ce n'est pas le nombre de paramètres qui en décide. ${v.peerLink} et ${v.exLink} ont une taille proche — ${v.peerParams} et ${v.exParams} paramètres —, mais ${v.ex} stocke ${v.perTok} par jeton et ${v.peer}, ${v.peerTok}, un écart de ${v.ratio} qui vient des couches et des têtes clé-valeur.</p>
<h2>Cache par jeton dans les modèles populaires</h2>
${v.table}
<p class="note">FP16, une séquence. — : au-delà du contexte maximal du modèle. DeepSeek V3 met en cache un vecteur latent compressé plutôt que des clés et des valeurs par tête. Gemma 2 et gpt-oss sont exclus de ce tableau : leurs couches à fenêtre glissante cessent de croître une fois la fenêtre atteinte, si bien que leur coût par jeton baisse à mesure que le contexte s'allonge. La calculatrice en tient compte couche par couche.</p>
<h2>Les séquences simultanées le multiplient</h2>
<p>Chaque séquence simultanée détient son propre cache. Sur un seul ${v.h100}, avec ${v.h100Usable} utilisables, ${v.ex} en BF16 laisse de la place pour ${v.users[0]} utilisateurs à 8k jetons chacun, ${v.users[1]} à 32k et ${v.users[2]} à 128k. Les poids fixent le plancher ; le cache décide combien de personnes tiennent au-dessus.</p>
<h2>Ce qui le réduit, et ce qui ne le réduit pas</h2>
<ul class="plain">
<li><strong>Moins de têtes clé-valeur.</strong> La grouped-query attention et la multi-query attention partagent des têtes clé-valeur entre les têtes de requête, et la multi-head latent attention met en cache un vecteur latent compressé. Cela vient avec le modèle que vous choisissez.</li>
<li><strong>Un cache KV en FP8.</strong> Un octet par valeur au lieu de deux divise le cache par deux. vLLM le propose avec <code>--kv-cache-dtype fp8</code> ; cela peut coûter en exactitude sur les tâches à long contexte, validez-le donc d'abord.</li>
<li><strong>Une limite de contexte plus basse.</strong> Le cache grandit avec chaque jeton que contient une séquence ; plafonner la longueur de séquence — <code>--max-model-len</code> dans vLLM — plafonne donc le pire cas.</li>
<li><strong>Pas la quantification des poids.</strong> Des poids en INT4 ou en FP8 ne réduisent que les poids ; le cache garde sa propre précision, si bien que le gain diminue à mesure que le contexte s'allonge. Voir ${v.quant}.</li>
<li><strong>La paged attention et la mise en cache des préfixes</strong> utilisent mieux le cache plutôt que de le réduire : la mémoire est attribuée par blocs à mesure que les séquences grandissent au lieu d'être réservée d'avance, et les requêtes qui ont le même préfixe peuvent partager ses blocs. LLMScale ne modélise pas ce gain d'efficacité ; ses chiffres représentent donc le besoin complet.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Dimensionner le cache KV pour votre modèle</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Quantification et VRAM</a></li>
  <li><a href="${v.modelsHref}">VRAM par modèle</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Modèle",
      thQueryHeads: "Têtes de requête",
      thKvHeads: "Têtes KV",
      thAttention: "Attention",
      thPerToken: "Par jeton",
      thVsMha: "vs MHA",
      kvLink: "taille du cache KV",
      text: (v) => ({
        title: "GQA, MQA et MLA : attention et taille du cache KV",
        description: `Comment la multi-head, la multi-query, la grouped-query et la multi-head latent attention modifient le cache KV d'un LLM, avec ${v.gqaName} et ${v.mlaName} détaillés pas à pas et ${v.models} modèles côte à côte.`,
        h1: "GQA, MQA et MLA : comment l'attention détermine le cache KV",
        crumb: "GQA, MQA et MLA",
        summary:
          "Quatre façons d'organiser les têtes d'attention, pourquoi elles changent le cache d'un ordre de grandeur, et comment la latent attention de DeepSeek retire le nombre de têtes de la formule.",
        body: `<p class="lede">Le cache KV naît de l'attention, et la façon dont un modèle organise ses têtes d'attention peut changer le cache d'un ordre de grandeur à nombre de paramètres égal. Quatre agencements couvrent les modèles ouverts actuels.</p>
<h2>Multi-head attention (MHA)</h2>
<p>Chaque tête de requête a ses propres têtes de clé et de valeur, et le cache les stocke toutes : 2 × couches × têtes × dimension de tête d'attention × octets par jeton. C'est la conception d'origine du Transformer et la plus coûteuse à mettre en cache. ${v.mha} l'utilise encore — ${v.mhaHeads} têtes sur ${v.mhaLayers} couches, ${v.mhaTok} par jeton.</p>
<h2>Multi-query attention (MQA)</h2>
<p>Toutes les têtes de requête partagent une seule tête de clé et une seule tête de valeur (Shazeer, 2019, « Fast Transformer Decoding: One Write-Head is All You Need »). Le cache est divisé par le nombre total de têtes — le plus grand gain possible —, mais partager un seul jeu de clés et de valeurs entre toutes les têtes peut coûter en qualité.</p>
<h2>Grouped-query attention (GQA)</h2>
<p>Les têtes de requête sont réparties en groupes, et chaque groupe partage une tête clé-valeur : plus d'une, mais moins que le nombre de têtes de requête. Ainslie et al. (2023) l'ont proposée comme compromis — une qualité proche de la multi-head attention, une vitesse proche de la multi-query —, et ${v.gqaCount} des ${v.bundled} modèles intégrés à LLMScale l'utilisent. ${v.gqa} regroupe ${v.gqaHeads} têtes de requête sur ${v.gqaKvHeads} têtes clé-valeur ; il met donc en cache ${v.gqaTok} par jeton là où la multi-head attention demanderait ${v.gqaMhaTok} : ${v.gqaRatio} de moins.</p>
<h2>Multi-head latent attention (MLA)</h2>
<p>DeepSeek-V2 a pris une autre voie. Au lieu de clés et de valeurs par tête, chaque couche met en cache un vecteur latent compressé par jeton, plus une petite clé découplée qui porte l'encodage positionnel RoPE. Le cache par jeton devient <code>couches × (kv_lora_rank + qk_rope_head_dim) × octets</code>, et le nombre de têtes disparaît de la formule. Pour ses propres dimensions, l'article de DeepSeek-V2 (§2.1.3) le situe à la taille d'une GQA avec seulement 2,25 groupes.</p>
<p>${v.mla} met en cache ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} valeurs par couche sur ${v.mlaLayers} couches : ${v.mlaTok} par jeton, ${v.mlaRatio} de moins que ce que donne la formule par tête. Avec un contexte de 8k, cela fait ${v.mla8k} au lieu de ${v.perHead8k}. Une calculatrice qui applique la formule par tête aux modèles DeepSeek surestime le cache de ce facteur ; LLMScale change de formule dès qu'une configuration contient les deux champs.</p>
<h2>Côte à côte</h2>
${v.table}
<p class="note">FP16. « vs MHA » : combien de fois plus une version multi-head du même modèle mettrait en cache.</p>
<h2>Ce que cela implique quand vous choisissez un modèle</h2>
<ul class="plain">
<li><strong>Regardez les têtes clé-valeur avant le nombre de paramètres.</strong> ${v.small} et ${v.big} diffèrent de ${v.pct} % en paramètres et de ${v.sizeRatio} en cache par jeton.</li>
<li><strong>L'agencement de l'attention vient avec le modèle.</strong> Pour réduire le cache d'un modèle en service, vous disposez d'un cache KV en FP8, d'un contexte plus court ou de moins de séquences — voir ${v.kv}.</li>
<li><strong>Le parallélisme de tenseurs répartit les têtes clé-valeur entre les GPU,</strong> c'est pourquoi la calculatrice propose des nombres de GPU qui les divisent exactement.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">Voir l'agencement de l'attention d'un modèle</a></li>
  <li><a href="${v.kvHref}">Taille du cache KV</a></li>
  <li><a href="${v.quantHref}">Quantification et VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Précision",
      thBytes: "Octets / paramètre",
      kvLink: "taille du cache KV",
      text: (v) => ({
        title: "Quantification des LLM et VRAM : BF16, FP8, INT4",
        description:
          "La mémoire GPU qu'occupent des poids en BF16, FP8, INT8 et INT4 pour des modèles de 8B à 405B, ce que sont AWQ, GPTQ, GGUF, MXFP4 et NF4, et pourquoi quantifier les poids laisse le cache KV tel quel.",
        h1: "Quantification et VRAM : BF16, FP8, INT8 et INT4",
        crumb: "Quantification",
        summary: "Les octets par paramètre de FP32 à INT4, les formats que vous rencontrerez, pourquoi 4 bits ne font pas exactement un demi-octet, et pourquoi elle ne touche pas au cache KV.",
        body: `<p class="lede">La quantification stocke les poids d'un modèle sur moins de bits. Les poids représentent en général la plus grosse part de la mémoire GPU ; c'est donc le premier levier auquel on pense — mais elle ne réduit que les poids, et chaque palier vers le bas sacrifie un peu d'exactitude.</p>
<h2>Octets par paramètre</h2>
<p>Les poids occupent <code>paramètres × octets par paramètre</code>. BF16 et FP16 servent de référence — la plupart des modèles sont publiés dans l'un des deux — et toute autre précision en est un multiple.</p>
${v.table}
<p class="note">Poids seuls, avant le cache KV et la surcharge. En FP8, INT8 et INT4, l'embedding et la couche de sortie restent sur 16 bits.</p>
<h2>Les formats que vous rencontrerez</h2>
<ul class="plain">
<li><strong>BF16 et FP16</strong> — virgule flottante sur 16 bits. BF16 conserve la plage de FP32 avec moins de précision, c'est pourquoi l'entraînement et la plupart des points de contrôle publiés l'utilisent.</li>
<li><strong>FP8</strong> — virgule flottante sur 8 bits, un octet par poids, pris en charge matériellement par les GPU NVIDIA récents (Ada Lovelace, Hopper et suivants). Certains modèles sont publiés avec des points de contrôle FP8.</li>
<li><strong>INT8</strong> — entiers sur 8 bits avec facteurs d'échelle, un octet par poids.</li>
<li><strong>AWQ et GPTQ</strong> — méthodes 4 bits qui ne portent que sur les poids : les poids sont stockés sur 4 bits et les calculs se font sur 16. Ils sont distribués au format safetensors et visent les moteurs d'inférence sur GPU comme vLLM.</li>
<li><strong>GGUF</strong> — le format de fichier de llama.cpp, avec des niveaux de quantification nommés d'après leur nombre de bits (Q4, Q5, Q8…), utilisé sur CPU, Apple Silicon et GPU grand public.</li>
<li><strong>NVFP4 et MXFP4</strong> — formats à virgule flottante sur 4 bits avec échelles partagées. gpt-oss publie les poids de ses experts en MXFP4, et c'est ainsi que ${v.oss} tient sur un seul GPU de 80 GB : ${v.ossNeed} avec un contexte de 8k pour un utilisateur, contre ${v.h100Usable} utilisables sur un ${v.h100}.</li>
<li><strong>NF4</strong> — le NormalFloat 4 bits de QLoRA, pour le fine-tuning d'adaptateurs sur un modèle de base gelé et quantifié.</li>
</ul>
<h2>Pourquoi 4 bits ne font pas exactement un demi-octet</h2>
<p>Les vrais formats 4 bits stockent aussi leurs facteurs d'échelle — une échelle de 16 bits par groupe de 128 poids dans AWQ et GPTQ, une échelle de 8 bits par bloc de 32 dans MXFP4 —, ce qui fait environ 4,25 bits par poids, et ils gardent l'embedding et la couche de sortie sur 16 bits. LLMScale compte les deux, si bien que son chiffre en 4 bits ressort nettement au-dessus de la moitié de BF16 : Qwen2.5-7B tombe à moins de 2 % du point de contrôle AWQ publié par Qwen, et Qwen3-8B en FP8 correspond au point de contrôle FP8 de RedHat au centième de GiB près. Un point de contrôle déjà publié sous forme quantifiée est dimensionné à partir de ses propres fichiers. Le NF4 de QLoRA avec double quantification mesure 4,127 bits, soit 0,516 octet, par paramètre, et c'est le chiffre qu'utilise la calculatrice de fine-tuning.</p>
<h2>Elle ne réduit pas le cache KV</h2>
<p>Le cache KV a sa propre précision, fixée par le moteur d'inférence et non par le format des poids. Prenez ${v.long} avec un utilisateur et un contexte de 128k : ses poids occupent ${v.longBf16} en BF16 et ${v.longInt4} en INT4, tandis que le cache KV reste à ${v.longKv} en FP16${v.kvOverInt4 ? " — plus que les poids en INT4" : ""}. Stocker le cache en FP8 est un choix distinct qui le divise par deux ; voir ${v.kv}.</p>
<h2>Modèles mixture-of-experts</h2>
<p>Chaque expert est quantifié, et chaque expert doit quand même être en mémoire. ${v.moe} compte ${v.moeParams} paramètres : ${v.moeBf16} de poids en BF16, ${v.moeInt4} en INT4. Ses ${v.moeActive} paramètres actifs déterminent la quantité de travail par jeton, pas la mémoire qu'occupe le modèle.</p>
<h2>Choisir une précision</h2>
<ul class="plain">
<li><strong>Partez de ce qui tient.</strong> Quand un modèle ne tient pas sur une carte, la calculatrice indique la première précision plus légère avec laquelle il tient.</li>
<li><strong>Mesurez le coût.</strong> Chaque palier vers le bas échange de l'exactitude contre de la mémoire, et l'ampleur dépend du modèle et de la méthode ; testez sur votre propre tâche avant de le servir.</li>
<li><strong>Laissez un point de contrôle déjà quantifié parler de lui-même.</strong> LLMScale lit sa précision dans <code>quantization_config</code>, le nom du dépôt ou l'en-tête safetensors, et vLLM charge les points de contrôle AWQ, GPTQ et FP8 sans option <code>--quantization</code>.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Comparer les précisions pour votre modèle</a></li>
  <li><a href="${v.kvHref}">Taille du cache KV</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA et MLA</a></li>
  <li><a href="${v.gpusHref}">Quels LLM tiennent sur quel GPU</a></li>
</ul>`,
      }),
    },
  },
};

export default fr;

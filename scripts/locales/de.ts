// Deutsch: the words of the built guides (types.ts says what each one is).

import type { PageText } from "./types.ts";

const de: PageText = {
  section: { models: "Modelle", gpus: "GPUs", concepts: "Konzepte", feed: "Neuigkeiten", crumbs: "Brotkrümelnavigation" },
  join: { sentence: " ", list: ", ", colon: ": " },

  model: {
    attention: {
      mla: ({ dims, ratio }) =>
        `Es nutzt Multi-Head Latent Attention (MLA): Jede Schicht legt pro Token nur einen komprimierten, ${dims}-dimensionalen latenten Vektor im Cache ab statt Schlüssel und Werte für jeden Kopf; dadurch ist sein KV-Cache ${ratio} kleiner, als die übliche Formel ergäbe.`,
      mqa: ({ heads }) =>
        `Es nutzt Multi-Query Attention: Alle ${heads} Abfrageköpfe teilen sich einen einzigen KV-Kopf, daher ist sein KV-Cache ${heads}× kleiner als bei vollständiger Multi-Head-Attention.`,
      gqa: ({ heads, kvHeads, ratio }) =>
        `Es nutzt Grouped Query Attention: ${heads} Abfrageköpfe teilen sich ${kvHeads} KV-Köpfe, daher ist sein KV-Cache ${ratio} kleiner als bei vollständiger Multi-Head-Attention.`,
      mha: ({ heads }) =>
        `Es nutzt vollständige Multi-Head-Attention: Jeder seiner ${heads} Köpfe hält eigene Schlüssel und Werte, daher ist der KV-Cache so groß, wie es die Anzahl seiner Köpfe vorgibt.`,
    },
    lede: {
      size: ({ name, params, layers }) => `${name} hat ${params} Parameter in ${layers} Schichten.`,
      moe: ({ active, total }) =>
        `Es ist ein Mixture-of-Experts-Modell, bei dem pro Token etwa ${active} seiner ${total} Parameter aktiv sind: Der Speicher muss alle aufnehmen, während jedes Token nur den aktiven Anteil durchläuft.`,
      context: ({ max, kv }) => `Es verarbeitet bis zu ${max} Token Kontext; ein Benutzer braucht bei dieser Länge zusätzlich zu den Gewichten ${kv} KV-Cache in FP16.`,
      gated: "Der Zugriff auf sein Repository bei Hugging Face ist eingeschränkt, daher bringt LLMScale seine Architektur in einer eigenen Datenbank mit.",
    },
    title: (name) => `VRAM-Bedarf von ${name}`,
    description: ({ name, ctx, bf16, int4 }) =>
      `${name} braucht für einen Benutzer bei ${ctx} Kontext ${bf16} GPU-Speicher in BF16 und ${int4} in INT4. Speicher nach Genauigkeit und Kontext, passende GPUs, gleichzeitige Benutzer und Speicher für die Feinabstimmung.`,
    h1: (name) => `${name}: Wie viel VRAM wird benötigt?`,
    oneUser: "ein Benutzer",
    ctx: (k) => `${k} Kontext`,
    answer: ({ weights, kv, overhead, int4 }) =>
      `${weights} Gewichte, ${kv} KV-Cache und ${overhead} vLLM-Overhead. In INT4 braucht dieselbe Arbeitslast ${int4}.`,
    specLayers: (n) => `${n} ${n === 1 ? "Schicht" : "Schichten"}`,
    specMaxContext: (k) => `${k} max. Kontext`,
    specHeads: ({ heads, kvHeads }) => `${heads}/${kvHeads} Köpfe`,
    h2Memory: (name) => `Speicherbedarf von ${name} nach Genauigkeit und Kontext`,
    thPrecision: "Genauigkeit",
    kvCache: "KV-Cache",
    tableNote:
      "Ein Benutzer, KV-Cache in FP16 und vLLM-Overhead auf einer GPU, mit den vLLM-Standardwerten für eine Karte unter 70 GB. Quantisierung verkleinert die Gewichte, nicht den KV-Cache, daher schrumpft die Ersparnis mit wachsendem Kontext.",
    h2Holds: "Welche GPUs es allein fassen",
    noSingleGpu: (counts) => `keine einzelne GPU fasst es – die Mindestzahl an GPUs für die Bereitstellung, so wie der Rechner sie aufteilt: ${counts}.`,
    fitNote: (ctx) =>
      `Bei ${ctx} Kontext für einen Benutzer, die kleinsten Karten zuerst. Eine dedizierte Grafikkarte wird mit 92 % ihres Speichers angesetzt (dem vLLM-Standardwert), ein Gerät mit gemeinsamem Arbeitsspeicher mit dem Anteil, den seine GPU adressieren kann; für jedes kommt der vLLM-Overhead mit seinen eigenen Standardwerten hinzu.`,
    h2Users: "Wie viele Benutzer passen",
    doesNotFit: "passt nicht",
    usersNote: (ctx) => `Benutzer mit je ${ctx} Kontext, auf einer Karte. ✗: Die Gewichte lassen nicht einmal für einen Platz.`,
    noCard: "Keine einzelne Karte hier fasst es, in keiner Genauigkeit; für die Bereitstellung muss es mit Tensor-Parallelität auf mehrere GPUs aufgeteilt werden.",
    h2FineTune: (name) => `Feinabstimmung von ${name}`,
    thMethod: "Methode",
    thMemory: "Speicher",
    thSmallestGpu: "Kleinste GPU",
    modes: { full: "Vollständige Feinabstimmung", lora: "LoRA (Rang 16, Aufmerksamkeit)", qlora: "QLoRA (Rang 16, Aufmerksamkeit)" },
    sharded: "mehrere GPUs, aufgeteilt",
    trainNote:
      "Sequenzlänge 2.048, Batchgröße 1, Gradient Checkpointing aktiviert, Adam. Die vollständige Feinabstimmung belegt 16 Bytes pro Parameter, noch ohne Aktivierungen; QLoRA speichert das eingefrorene Basismodell in 4-Bit-NF4.",
    h2Source: "Woher die Zahlen stammen",
    kvFormula: {
      mla: "Mit MLA beträgt der KV-Cache <code>Schichten × (kv_lora_rank + qk_rope_head_dim) × Bytes × Kontext × Benutzer</code>.",
      heads: "Der KV-Cache beträgt <code>2 × Schichten × KV-Köpfe × Head-Dimension × Bytes × Kontext × Benutzer</code>.",
    },
    windowNote: ({ sliding, layers, window, pastWindow, fullLayers }) =>
      ` ${sliding} seiner ${layers} Schichten berechnen die Aufmerksamkeit nur über ein Sliding Window der letzten ${window} Token und halten nicht mehr als diese vor; darüber hinaus fügt daher jedes weitere Token ${pastWindow} KiB hinzu, den Anteil der übrigen ${fullLayers} Schichten.`,
    source: ({ kvFormula, name, kib, windowNote }) =>
      `Die Gewichte belegen <code>Parameter × Bytes pro Parameter</code>. ${kvFormula} Für ${name} sind das ${kib} KiB pro Token in FP16.${windowNote} Das sind Werte für die Kapazitätsplanung: Die Inferenz-Engine – vLLM, TGI, llama.cpp – und die Effizienz ihrer Paged Attention verschieben den tatsächlichen Wert noch.`,
    more: ({ kvCache, attention }) => `Mehr zur <a href="${kvCache}">Größe des KV-Caches</a> und zu <a href="${attention}">GQA, MQA und MLA</a>.`,
    h2Work: (name) => `Mit ${name} arbeiten`,
    links: {
      size: "Für Ihre Arbeitslast dimensionieren",
      train: "Speicher für die Feinabstimmung",
      vllm: "vLLM-Einstellungen",
      anatomy: "Modellanatomie",
      config: "Seine config.json, erklärt",
      serving: "Was seine Dateien über die Bereitstellung verraten",
    },
    h2Family: (family) => `Weitere ${family}-Modelle`,
  },

  gpu: {
    lede: {
      unified: ({ name, total, vram, usable, apple }) =>
        `${name} teilt ${total} GB Speicher zwischen CPU und GPU; standardmäßig kann die GPU davon etwa ${vram} GB adressieren, und LLMScale setzt ${usable} für ein Modell an${apple ? "" : " – der vLLM-Standardwert von 92 % dessen, was die GPU meldet"}.`,
      discrete: ({ name, vram, usable }) =>
        `${name} hat ${vram} GB Speicher. LLMScale setzt davon ${usable} für ein Modell an: den vLLM-Standardwert --gpu-memory-utilization 0.92, bezogen auf das, was die Karte meldet; der Rest bleibt für den CUDA-Kontext.`,
      bandwidth: (bw) => `Die Speicherbandbreite von ${bw} GB/s begrenzt die Generierungsgeschwindigkeit, sobald ein Modell hineinpasst.`,
      apple: "vLLM hat kein Metal-Backend, daher laufen Modelle hier mit llama.cpp oder MLX.",
      counts: ({ models, bf16, fp8, int4 }) =>
        `Von den ${models} beliebten offenen Modellen unten passen ${bf16} in BF16, ${fp8} in FP8 und ${int4} in INT4 bei 8k Kontext für einen Benutzer.`,
    },
    title: (name) => `Welche LLMs passen auf ${name}?`,
    description: ({ name, usable, models, bf16, int4 }) =>
      `Welche offenen LLMs auf ${name} passen (${usable} nutzbar): ${int4} von ${models} beliebten Modellen in INT4 und ${bf16} in BF16, jeweils mit gleichzeitigen Benutzern und maximalem Kontext.`,
    h1: (name) => `Welche LLMs passen auf ${name}?`,
    doesNotFit: " (passt nicht)",
    thModel: "Modell",
    thUsers: "Benutzer",
    thMaxContext: "Max. Kontext",
    tableNote:
      "Speicher bei 8k Kontext für einen Benutzer (beim Maximum des Modells, falls dieses kürzer ist), KV-Cache in FP16 und vLLM-Overhead mit den Standardwerten dieser Karte. Benutzer (je 8k) und maximaler Kontext gelten für die höchste Genauigkeit, die passt.",
    usableMemory: "nutzbarer Speicher",
    answer: ({ models, bf16, int4 }) => `${int4} von ${models} Modellen ${int4 === 1 ? "passt" : "passen"} in INT4, ${bf16} in BF16.`,
    h2Fit: (name) => `Welche LLMs auf ${name} passen`,
    quantization: (href) => `Was BF16, FP8 und INT4 für den Speicher bedeuten: <a href="${href}">Quantisierung und VRAM</a>.`,
    parallel:
      "Ein Modell, das nicht auf eine Karte passt, kann trotzdem auf mehreren laufen: Tensor-Parallelität teilt seine Gewichte und seinen KV-Cache zwischen ihnen auf. Der Rechner ermittelt, wie viele es braucht.",
    h2Size: (name) => `Ein Modell für ${name} dimensionieren`,
    open: "Rechner mit dieser GPU öffnen",
    h2Others: "Weitere GPUs",
  },

  hubs: {
    models: {
      title: "LLM-VRAM-Bedarf nach Modell",
      description: (models) =>
        `GPU-Speicher für ${models} beliebte offene LLMs – Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek – in BF16 und INT4, jeweils mit passenden GPUs und Speicher für die Feinabstimmung.`,
      h1: "LLM-VRAM-Bedarf nach Modell",
      lede: (models) =>
        `Wie viel GPU-Speicher ${models} beliebte offene Modelle brauchen, berechnet aus der jeweils eigenen Architektur: Gewichte, KV-Cache und Overhead in BF16 und INT4 für einen Benutzer bei 8k Kontext. Jede Seite schlüsselt das nach Genauigkeit und Kontext auf, nennt die GPUs, die das Modell fassen, und wie viele Benutzer passen, und ergänzt den Speicher für die Feinabstimmung.`,
      active: "aktiv",
      thModel: "Modell",
      thParams: "Parameter",
      thMaxContext: "Max. Kontext",
      note: "Ein Benutzer, KV-Cache in FP16 und vLLM-Overhead auf einer GPU; Modelle mit kürzerem maximalem Kontext werden bei diesem Maximum gezeigt.",
      links: { size: "Beliebiges Hugging Face-Modell dimensionieren", byGpu: "Welche LLMs auf welche GPU passen", memory: "Wie LLM-Speicher funktioniert" },
    },
    gpus: {
      title: "Welche LLMs passen auf welche GPU?",
      description:
        "Welche beliebten offenen LLMs auf RTX 4090, RTX 5090, H100, H200, B200, Apple M-Serie, Strix Halo und DGX Spark passen – in BF16, FP8 und INT4, mit Benutzern und maximalem Kontext.",
      h1: "Welche LLMs auf welche GPU passen",
      lede: ({ models, gpus }) =>
        `Welche von ${models} beliebten offenen LLMs auf ${gpus} GPUs passen, auf denen sie typischerweise laufen – Consumer- und Workstation-Karten, Rechenzentrums-GPUs, Apple Silicon und KI-PCs mit gemeinsamem Arbeitsspeicher. Jede Seite listet jedes Modell mit seinem Speicher in BF16, FP8 und INT4, wie viele Benutzer passen und den längsten Kontext, den es fassen kann.`,
      thType: "Typ",
      thUsable: "Nutzbar",
      thBf16: "Modelle in BF16",
      thInt4: "Modelle in INT4",
      note: (models) =>
        `Von ${models} Modellen, bei 8k Kontext für einen Benutzer. Dedizierte Grafikkarten werden mit 92 % ihres Speichers angesetzt (dem vLLM-Standardwert), Geräte mit gemeinsamem Arbeitsspeicher mit dem Anteil, den ihre GPU adressieren kann, jeweils mit dem vLLM-Overhead nach ihren eigenen Standardwerten.`,
      links: { size: "Ein Modell auf einer beliebigen GPU dimensionieren", byModel: "VRAM-Bedarf nach Modell", memory: "Wie LLM-Speicher funktioniert" },
    },
    concepts: {
      title: "Wie LLM-Speicher funktioniert: KV-Cache, GQA, Quantisierung",
      description:
        "Die Begriffe, die bestimmen, wie viel GPU-Speicher ein LLM braucht – KV-Cache, Grouped Query Attention und Latent Attention, Quantisierung –, erklärt an echten Modellen mit berechneten Werten.",
      h1: "Wie LLM-Speicher funktioniert",
      lede: "Drei Leitfäden zu den Begriffen, die bestimmen, wie viel GPU-Speicher ein Sprachmodell braucht. Jeder arbeitet mit echten Modellen, und jede Zahl darin berechnet dieselbe Engine wie der Rechner.",
      links: { calculator: "Rechner öffnen", byModel: "VRAM-Bedarf nach Modell", byGpu: "Welche LLMs auf welche GPU passen" },
    },
  },

  concepts: {
    kvCache: {
      thModel: "Modell",
      thLayers: "Schichten",
      thShape: "KV-Köpfe × Head-Dim.",
      thPerToken: "Pro Token",
      attentionLink: "GQA, MQA und MLA",
      quantLink: "Quantisierung und VRAM",
      text: (v) => ({
        title: "KV-Cache-Größe: Formel und Beispiele",
        description: `Wie groß der KV-Cache eines LLM wird: die Formel, ein durchgerechnetes Beispiel mit ${v.ex}, Werte pro Token für beliebte Modelle und was gleichzeitige Sequenzen, FP8 und Grouped Query Attention daran ändern.`,
        h1: "KV-Cache-Größe: die Formel, mit echten Modellen",
        crumb: "KV-Cache",
        summary: "Die Formel, ein durchgerechnetes Beispiel, Werte pro Token für beliebte Modelle und warum gleichzeitige Sequenzen den Cache vervielfachen, während die Quantisierung der Gewichte ihn nicht verändert.",
        body: `<p class="lede">Wenn ein Sprachmodell Text erzeugt, behält es die Schlüssel und Werte, die es für jedes frühere Token in jeder Schicht berechnet hat, damit es sie für das nächste nicht erneut berechnen muss. Dieser Speicher ist der KV-Cache. Faustregeln für den GPU-Speicher lassen ihn aus, und bei langem Kontext oder vielen Benutzern wird er größer als die Gewichte des Modells.</p>
<h2>Die Formel</h2>
<p>Für jedes Token speichert jede Schicht pro KV-Kopf einen Schlüsselvektor und einen Wertvektor:</p>
<pre><code>KV-Bytes pro Token = 2 × Schichten × KV-Köpfe × Head-Dimension × Bytes pro Wert
KV-Cache           = KV-Bytes pro Token × Kontextlänge × gleichzeitige Sequenzen</code></pre>
<p>Die 2 zählt Schlüssel und Wert. Ein Wert belegt 2 Bytes in FP16 oder BF16 und 1 Byte in FP8. Schichten, KV-Köpfe und Head-Dimension legt die Architektur fest – <code>num_hidden_layers</code>, <code>num_key_value_heads</code> und <code>head_dim</code> in der config.json des Modells –, deshalb können zwei gleich große Modelle sehr unterschiedliche Caches brauchen. Modelle mit Multi-Head Latent Attention ersetzen den mittleren Teil der Formel; siehe ${v.attention}.</p>
<h2>Ein durchgerechnetes Beispiel: ${v.ex}</h2>
<p>${v.exLink} hat ${v.layers} Schichten, ${v.kvHeads} KV-Köpfe und eine Head-Dimension von ${v.headDim}. In FP16 sind das 2 × ${v.layers} × ${v.kvHeads} × ${v.headDim} × 2 = ${v.perTokBytes} Bytes oder ${v.perTok} pro Token. Ein Benutzer mit 8k Token braucht ${v.kv8k} Cache; bei seinem vollen Kontext von ${v.exMax} Token sind es ${v.kvMax} – ${v.kvOverWeights ? `mehr als seine ${v.weights} Gewichte in BF16` : `gegenüber ${v.weights} Gewichten in BF16`}.</p>
<p>Nicht die Parameterzahl entscheidet darüber. ${v.peerLink} und ${v.exLink} sind ähnlich groß – ${v.peerParams} und ${v.exParams} Parameter –, doch ${v.ex} speichert ${v.perTok} pro Token und ${v.peer} ${v.peerTok}, ein Unterschied von ${v.ratio}, der von den Schichten und den KV-Köpfen herrührt.</p>
<h2>Cache pro Token in beliebten Modellen</h2>
${v.table}
<p class="note">FP16, eine Sequenz. —: jenseits des maximalen Kontexts des Modells. DeepSeek V3 speichert einen komprimierten latenten Vektor statt Schlüsseln und Werten pro Kopf. Gemma 2 und gpt-oss fehlen in dieser Tabelle: Ihre Sliding-Window-Schichten wachsen ab der Fenstergröße nicht weiter, daher sinken ihre Kosten pro Token mit wachsendem Kontext. Der Rechner berücksichtigt das Schicht für Schicht.</p>
<h2>Gleichzeitige Sequenzen vervielfachen ihn</h2>
<p>Jede gleichzeitige Sequenz hält einen eigenen Cache. Auf einer einzelnen ${v.h100} mit ${v.h100Usable} nutzbarem Speicher lässt ${v.ex} in BF16 Platz für ${v.users[0]} Benutzer mit je 8k Token, ${v.users[1]} mit 32k und ${v.users[2]} mit 128k. Die Gewichte setzen die Untergrenze; der Cache entscheidet, wie viele Menschen darüber Platz finden.</p>
<h2>Was ihn verkleinert und was nicht</h2>
<ul class="plain">
<li><strong>Weniger KV-Köpfe.</strong> Grouped Query Attention und Multi-Query Attention teilen KV-Köpfe zwischen Abfrageköpfen, und Multi-Head Latent Attention speichert einen komprimierten latenten Vektor. Das legt das Modell fest, das Sie wählen.</li>
<li><strong>Ein KV-Cache in FP8.</strong> Ein Byte pro Wert statt zwei halbiert den Cache. vLLM bietet das als <code>--kv-cache-dtype fp8</code> an; bei Aufgaben mit langem Kontext kann es Ergebnisgenauigkeit kosten, prüfen Sie es also zuerst.</li>
<li><strong>Ein niedrigeres Kontextlimit.</strong> Der Cache wächst mit jedem Token, das eine Sequenz hält; eine Obergrenze für die Sequenzlänge – <code>--max-model-len</code> in vLLM – begrenzt daher den schlimmsten Fall.</li>
<li><strong>Nicht die Quantisierung der Gewichte.</strong> Gewichte in INT4 oder FP8 verkleinern nur die Gewichte; der Cache behält seine eigene Genauigkeit, daher schrumpft die Ersparnis mit wachsendem Kontext. Siehe ${v.quant}.</li>
<li><strong>Paged Attention und Präfix-Caching</strong> nutzen den Cache besser, statt ihn zu verkleinern: Speicher wird blockweise vergeben, während Sequenzen wachsen, statt vorab reserviert zu werden, und Anfragen mit gleichem Präfix können sich dessen Blöcke teilen. LLMScale bildet diese Effizienz nicht ab, daher zeigen seine Werte den vollen Bedarf.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">KV-Cache für Ihr Modell dimensionieren</a></li>
  <li>${v.attention}</li>
  <li><a href="${v.quantHref}">Quantisierung und VRAM</a></li>
  <li><a href="${v.modelsHref}">VRAM nach Modell</a></li>
</ul>`,
      }),
    },
    attention: {
      thModel: "Modell",
      thQueryHeads: "Abfrageköpfe",
      thKvHeads: "KV-Köpfe",
      thAttention: "Aufmerksamkeit",
      thPerToken: "Pro Token",
      thVsMha: "vs. MHA",
      kvLink: "KV-Cache-Größe",
      text: (v) => ({
        title: "GQA, MQA und MLA: Aufmerksamkeit und KV-Cache-Größe",
        description: `Wie Multi-Head, Multi-Query, Grouped Query und Multi-Head Latent Attention den KV-Cache eines LLM verändern, durchgerechnet an ${v.gqaName} und ${v.mlaName}, mit ${v.models} Modellen im direkten Vergleich.`,
        h1: "GQA, MQA und MLA: wie die Aufmerksamkeit den KV-Cache bestimmt",
        crumb: "GQA, MQA und MLA",
        summary:
          "Vier Arten, Aufmerksamkeitsköpfe anzuordnen, warum sie den Cache um eine Größenordnung verändern und wie die Latent Attention von DeepSeek die Zahl der Köpfe aus der Formel nimmt.",
        body: `<p class="lede">Der KV-Cache entsteht in der Aufmerksamkeit, und wie ein Modell seine Aufmerksamkeitsköpfe anordnet, kann den Cache bei gleicher Parameterzahl um eine Größenordnung verändern. Vier Anordnungen decken die heutigen offenen Modelle ab.</p>
<h2>Multi-Head-Attention (MHA)</h2>
<p>Jeder Abfragekopf hat eigene Schlüssel- und Wertköpfe, und der Cache speichert sie alle: 2 × Schichten × Köpfe × Head-Dimension × Bytes pro Token. Das ist das ursprüngliche Transformer-Design und das teuerste für den Cache. ${v.mha} nutzt es noch – ${v.mhaHeads} Köpfe über ${v.mhaLayers} Schichten, ${v.mhaTok} pro Token.</p>
<h2>Multi-Query Attention (MQA)</h2>
<p>Alle Abfrageköpfe teilen sich einen einzigen Schlüsselkopf und einen einzigen Wertkopf (Shazeer, 2019, „Fast Transformer Decoding: One Write-Head is All You Need“). Der Cache schrumpft um die volle Zahl der Köpfe – die größte mögliche Ersparnis –, doch wenn sich alle Köpfe einen Satz Schlüssel und Werte teilen, kann das Qualität kosten.</p>
<h2>Grouped Query Attention (GQA)</h2>
<p>Die Abfrageköpfe werden in Gruppen aufgeteilt, und jede Gruppe teilt sich einen KV-Kopf: insgesamt mehr als einer, aber weniger, als es Abfrageköpfe gibt. Ainslie et al. (2023) haben sie als Mittelweg vorgeschlagen – Qualität nahe an Multi-Head-Attention, Geschwindigkeit nahe an Multi-Query –, und ${v.gqaCount} der ${v.bundled} Modelle, die LLMScale mitbringt, nutzen sie. ${v.gqa} gruppiert ${v.gqaHeads} Abfrageköpfe auf ${v.gqaKvHeads} KV-Köpfe und speichert daher ${v.gqaTok} pro Token, wo Multi-Head-Attention ${v.gqaMhaTok} bräuchte: ${v.gqaRatio} weniger.</p>
<h2>Multi-Head Latent Attention (MLA)</h2>
<p>DeepSeek-V2 ging einen anderen Weg. Statt Schlüsseln und Werten pro Kopf speichert jede Schicht pro Token einen komprimierten latenten Vektor, dazu einen kleinen entkoppelten Schlüssel, der die RoPE-Positionscodierung trägt. Der Cache pro Token wird zu <code>Schichten × (kv_lora_rank + qk_rope_head_dim) × Bytes</code>, und die Zahl der Köpfe fällt heraus. Für die eigenen Dimensionen beziffert das DeepSeek-V2-Paper (§2.1.3) den Cache auf die Größe von GQA mit nur 2,25 Gruppen.</p>
<p>${v.mla} speichert ${v.kvLoraRank} + ${v.ropeDim} = ${v.kvLoraRank + v.ropeDim} Werte pro Schicht über ${v.mlaLayers} Schichten: ${v.mlaTok} pro Token, ${v.mlaRatio} weniger, als die Formel pro Kopf ergibt. Bei 8k Kontext sind das ${v.mla8k} statt ${v.perHead8k}. Ein Rechner, der die Formel pro Kopf auf DeepSeek-Modelle anwendet, überschätzt den Cache um diesen Faktor; LLMScale wechselt die Formel, sobald eine Konfiguration beide Felder enthält.</p>
<h2>Im direkten Vergleich</h2>
${v.table}
<p class="note">FP16. „vs. MHA“: um welchen Faktor eine Multi-Head-Version desselben Modells mehr im Cache hielte.</p>
<h2>Was das für die Modellwahl bedeutet</h2>
<ul class="plain">
<li><strong>Prüfen Sie die KV-Köpfe vor der Parameterzahl.</strong> ${v.small} und ${v.big} unterscheiden sich um ${v.pct} % bei den Parametern und um ${v.sizeRatio} beim Cache pro Token.</li>
<li><strong>Die Anordnung der Aufmerksamkeit bringt das Modell mit.</strong> Um den Cache eines bereitgestellten Modells zu verkleinern, bleiben ein KV-Cache in FP8, ein kürzerer Kontext oder weniger Sequenzen – siehe ${v.kv}.</li>
<li><strong>Tensor-Parallelität verteilt die KV-Köpfe auf die GPUs,</strong> daher schlägt der Rechner GPU-Zahlen vor, durch die sie sich glatt teilen lassen.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.anatomyHref}">Aufmerksamkeitsanordnung eines Modells ansehen</a></li>
  <li><a href="${v.kvHref}">KV-Cache-Größe</a></li>
  <li><a href="${v.quantHref}">Quantisierung und VRAM</a></li>
</ul>`,
      }),
    },
    quantization: {
      thPrecision: "Genauigkeit",
      thBytes: "Bytes / Parameter",
      kvLink: "KV-Cache-Größe",
      text: (v) => ({
        title: "LLM-Quantisierung und VRAM: BF16, FP8, INT4",
        description:
          "Wie viel GPU-Speicher Gewichte in BF16, FP8, INT8 und INT4 für Modelle von 8B bis 405B belegen, was AWQ, GPTQ, GGUF, MXFP4 und NF4 sind und warum die Quantisierung der Gewichte den KV-Cache unverändert lässt.",
        h1: "Quantisierung und VRAM: BF16, FP8, INT8 und INT4",
        crumb: "Quantisierung",
        summary: "Bytes pro Parameter von FP32 bis INT4, die Formate, denen Sie begegnen, warum 4 Bit nicht genau ein halbes Byte sind und warum die Quantisierung den KV-Cache nicht berührt.",
        body: `<p class="lede">Quantisierung speichert die Gewichte eines Modells mit weniger Bits. Die Gewichte sind meist der größte Teil des GPU-Speichers, daher ist sie der erste Hebel, zu dem man greift – doch sie verkleinert nur die Gewichte, und jede Stufe nach unten kostet etwas Ergebnisgenauigkeit.</p>
<h2>Bytes pro Parameter</h2>
<p>Die Gewichte belegen <code>Parameter × Bytes pro Parameter</code>. BF16 und FP16 sind die Referenz – die meisten Modelle erscheinen in einem der beiden Formate –, und jede andere Genauigkeit ist ein Vielfaches davon.</p>
${v.table}
<p class="note">Nur Gewichte, vor KV-Cache und Overhead. In FP8, INT8 und INT4 bleiben die Einbettungsschicht und die Ausgabeschicht bei 16 Bit.</p>
<h2>Die Formate, denen Sie begegnen</h2>
<ul class="plain">
<li><strong>BF16 und FP16</strong> – 16-Bit-Gleitkomma. BF16 behält den Wertebereich von FP32 bei geringerer Genauigkeit, deshalb nutzen es das Training und die meisten veröffentlichten Checkpoints.</li>
<li><strong>FP8</strong> – 8-Bit-Gleitkomma, ein Byte pro Gewicht, in Hardware unterstützt von aktuellen NVIDIA-GPUs (Ada Lovelace, Hopper und neuer). Manche Modelle erscheinen mit FP8-Checkpoints.</li>
<li><strong>INT8</strong> – 8-Bit-Ganzzahlen mit Skalierungsfaktoren, ein Byte pro Gewicht.</li>
<li><strong>AWQ und GPTQ</strong> – 4-Bit-Verfahren nur für die Gewichte: Die Gewichte werden in 4 Bit gespeichert und in 16 Bit berechnet. Sie erscheinen als safetensors und zielen auf GPU-Inferenz-Engines wie vLLM.</li>
<li><strong>GGUF</strong> – das Dateiformat von llama.cpp, mit Quantisierungsstufen, die nach Bits benannt sind (Q4, Q5, Q8…), genutzt auf CPUs, Apple Silicon und Consumer-GPUs.</li>
<li><strong>NVFP4 und MXFP4</strong> – 4-Bit-Gleitkommaformate mit gemeinsamen Skalen. gpt-oss liefert seine Expertengewichte in MXFP4, und so passt ${v.oss} auf eine einzelne GPU mit 80 GB: ${v.ossNeed} bei 8k Kontext für einen Benutzer, gegenüber ${v.h100Usable} nutzbarem Speicher auf einer ${v.h100}.</li>
<li><strong>NF4</strong> – das 4-Bit-NormalFloat von QLoRA, für die Feinabstimmung von Adaptern auf einem eingefrorenen, quantisierten Basismodell.</li>
</ul>
<h2>Warum 4 Bit nicht genau ein halbes Byte sind</h2>
<p>Echte 4-Bit-Formate speichern auch ihre Skalierungsfaktoren – eine 16-Bit-Skala je Gruppe von 128 Gewichten bei AWQ und GPTQ, eine 8-Bit-Skala je Block von 32 bei MXFP4 –, was etwa 4,25 Bit pro Gewicht ergibt, und sie halten die Einbettungsschicht und die Ausgabeschicht bei 16 Bit. LLMScale zählt beides, daher liegt sein 4-Bit-Wert deutlich über der Hälfte von BF16: Qwen2.5-7B landet innerhalb von 2 % von Qwens eigenem AWQ-Checkpoint, und Qwen3-8B in FP8 trifft den FP8-Checkpoint von RedHat auf das Hundertstel GiB genau. Ein Checkpoint, der bereits quantisiert erscheint, wird nach seinen eigenen Dateien dimensioniert. NF4 von QLoRA mit doppelter Quantisierung misst 4,127 Bit oder 0,516 Bytes pro Parameter, und diesen Wert verwendet der Rechner für die Feinabstimmung.</p>
<h2>Den KV-Cache verkleinert sie nicht</h2>
<p>Der KV-Cache hat eine eigene Genauigkeit, die die Inferenz-Engine festlegt und nicht das Format der Gewichte. Nehmen Sie ${v.long} mit einem Benutzer bei 128k Kontext: Seine Gewichte belegen ${v.longBf16} in BF16 und ${v.longInt4} in INT4, während der KV-Cache in FP16 bei ${v.longKv} bleibt${v.kvOverInt4 ? " – mehr als die Gewichte in INT4" : ""}. Den Cache in FP8 zu speichern, ist eine eigene Entscheidung, die ihn halbiert; siehe ${v.kv}.</p>
<h2>Mixture-of-Experts-Modelle</h2>
<p>Jeder Experte wird quantisiert, und jeder Experte muss trotzdem im Speicher liegen. ${v.moe} hat ${v.moeParams} Parameter: ${v.moeBf16} Gewichte in BF16, ${v.moeInt4} in INT4. Seine ${v.moeActive} aktiven Parameter bestimmen, wie viel Arbeit jedes Token verursacht, nicht wie viel Speicher das Modell belegt.</p>
<h2>Eine Genauigkeit wählen</h2>
<ul class="plain">
<li><strong>Beginnen Sie mit dem, was passt.</strong> Wenn ein Modell für eine Karte zu groß ist, nennt der Rechner die erste leichtere Genauigkeit, mit der es passt.</li>
<li><strong>Messen Sie die Kosten.</strong> Jede Stufe nach unten tauscht Ergebnisgenauigkeit gegen Speicher, und wie viel, hängt von Modell und Verfahren ab; testen Sie vor der Bereitstellung mit Ihrer eigenen Aufgabe.</li>
<li><strong>Lassen Sie einen vorquantisierten Checkpoint für sich sprechen.</strong> LLMScale liest seine Genauigkeit aus <code>quantization_config</code>, dem Repository-Namen oder dem safetensors-Header, und vLLM lädt AWQ-, GPTQ- und FP8-Checkpoints ohne das Flag <code>--quantization</code>.</li>
</ul>
<ul class="links">
  <li><a class="primary" href="${v.home}">Genauigkeiten für Ihr Modell vergleichen</a></li>
  <li><a href="${v.kvHref}">KV-Cache-Größe</a></li>
  <li><a href="${v.attentionHref}">GQA, MQA und MLA</a></li>
  <li><a href="${v.gpusHref}">Welche LLMs auf welche GPU passen</a></li>
</ul>`,
      }),
    },
  },
};

export default de;

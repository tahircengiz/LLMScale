// The Serving Brief engine against snapshots of real repositories.
// Run: node scripts/test-serving.ts
//
// The fixtures in scripts/fixtures/repos/ were taken on 2026-10-12 with
// scripts/fetch-repo-fixture.ts, which runs the page's own reader. One per case
// the brief has to tell apart: MTP that ships (DeepSeek-V3 as layer 61, GLM as
// layer 46, Qwen3-Next under mtp.*, MiMo under mtp_layers) and MTP a quantized copy
// dropped; FP8 with block scales, compressed-tensors FP8, AWQ, MXFP4, and NVFP4
// declared in hf_quant_config.json rather than config.json; Hermes, harmony,
// XML, Kimi, DeepSeek, Llama 3 and Mistral tool formats; a gated repo, a GGUF
// repo, a LoRA adapter, an EAGLE draft, an embedding model and a pickle-only one.
//
// The parser names are checked against the registries of the engine versions in
// ENGINE_VERSIONS, copied below from their source, so a typo or a name an engine
// does not have fails here rather than in someone's launch command.

import { readFileSync, readdirSync } from "node:fs";
import { DICTS, type Lang } from "../src/lib/dict.ts";
import { buildBrief, commandText, digestTensors, ENGINE_VERSIONS, type Part, type RepoSnapshot, type ServingBrief } from "../src/lib/serving.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const dir = new URL("./fixtures/repos/", import.meta.url);
const load = (name: string): RepoSnapshot => JSON.parse(readFileSync(new URL(`${name}.json`, dir), "utf8"));
const brief = (name: string, lang: Lang = "en") => buildBrief(load(name), lang);
const keys = (b: ServingBrief) => [
  ...b.portrait,
  ...b.gotchas,
  ...b.sections.flatMap((s) => s.parts),
  ...[b.commands.vllm, b.commands.sglang].flatMap((c) => [...c.notes, ...c.flags.map((f) => f.why)]),
];
const hasKey = (b: ServingBrief, k: string) => keys(b).some((p) => p.k === k);
const gotcha = (b: ServingBrief, k: string) => b.gotchas.find((g) => g.k === k);
const flag = (b: ServingBrief, engine: "vllm" | "sglang", f: string) => b.commands[engine].flags.find((x) => x.flag === f);
const fill = (lang: Lang, p: Part) => {
  let s = DICTS[lang][`serve.a.${p.k}`] ?? "";
  for (const [k, v] of Object.entries(p.v ?? {})) s = s.replaceAll(`{${k}}`, String(v));
  return s;
};

// vLLM 0.31.0: vllm/tool_parsers/__init__.py and vllm/reasoning/__init__.py.
const VLLM_TOOL = new Set(
  "dots deepseek_v3 deepseek_v31 deepseek_v32 deepseek_v4 deepseek_v41 cohere_command3 cohere_command4 ernie45 glm45 glm47 ling3 granite granite4 hermes poolside_v1 hunyuan_a13b hy_v3 hy_v4 internlm jamba lfm2 kimi_k2 kimi_k3 k2_horizon llama3_json llama4_json llama4_pythonic longcat mimo minimax_m2 minimax_m3 minicpm5 mistral olmo3 muse_glimmer openai phi4_mini_json pythonic qwen3_coder qwen3_xml seed_oss step3 step3p5 inkling xlam gigachat3 functiongemma gemma4 apertus".split(" "),
);
const VLLM_REASONING = new Set(
  "deepseek_r1 deepseek_v3 deepseek_v4 deepseek_v41 poolside_v1 cohere_command3 cohere_command4 ernie45 gemma4 glm45 glm47 ling3 openai_gptoss granite granite_thinking_parser holo2 hunyuan_a13b hy_v3 hy_v4 kimi_k2 kimi_k3 k2_horizon mimo minimax_m2 minimax_m2_append_think minimax_m3 mistral nemotron_v3 olmo3 muse_glimmer qwen3 seed_oss step3 step3p5 inkling".split(" "),
);
// SGLang 0.5.21: function_call_parser.py (ToolCallParserEnum) and reasoning_parser.py.
const SGLANG_TOOL = new Set(
  "apertus2509 cohere_command4 deepseekv3 deepseekv31 deepseekv32 deepseekv4 deepseekv41 dots glm glm45 glm47 gpt-oss k2_horizon kimi_k2 kimi_k3 lfm2 ling3 llama3 mimo minicpm5 mistral muse poolside_v1 pythonic qwen qwen25 qwen3_coder spark25 step3 step3p5 minimax-m2 minimax-m3 nanbeige trinity interns1 hermes hunyuan gigachat3 gigachat35 gemma4 inkling iquest_q1".split(" "),
);
const SGLANG_REASONING = new Set(
  "apertus2509 deepseek-r1 deepseek-v3 deepseek-v4 deepseek-v41 dots glm45 ling3 hunyuan gpt-oss k2_horizon kimi kimi_k2 kimi_k3 mimo muse poolside_v1 qwen3 qwen3-thinking minimax minimax-append-think minimax-m3 nanbeige step3 step3p5 mistral nemotron_3 granite_thinking_parser interns1 gemma4 gigachat35 inkling iquest_q1 cohere_command4".split(" "),
);
// Chat templates the engines' repositories hold at those versions (examples/).
const VLLM_TEMPLATES = new Set(["deepseekr1", "deepseekv3", "deepseekv31", "llama3.1_json", "llama3.2_json", "llama4_pythonic", "mistral", "mistral_parallel"].map((x) => `examples/tool_chat_template_${x}.jinja`));
const SGLANG_TEMPLATES = new Set(["deepseekr1", "deepseekv3", "deepseekv31", "deepseekv32", "llama3.1_json", "llama4_pythonic"].map((x) => `examples/chat_template/tool_chat_template_${x}.jinja`));

console.log(`--- engines: vLLM ${ENGINE_VERSIONS.vllm}, SGLang ${ENGINE_VERSIONS.sglang} ---`);

console.log("\n--- tensor names ---");
{
  const d = digestTensors(["model.layers.0.mlp.experts.3.down_proj.weight", "model.layers.0.mlp.experts.4.down_proj.weight", "model.layers.61.eh_proj.weight", "mtp.layers.0.norm.weight", "lm_head.weight", "h.2.attn.weight"]);
  check("numbers become {n}", d.templates["model.layers.{n}.mlp.experts.{n}.down_proj.weight"] === 2);
  check("a stack counts tensors per layer", d.stacks["model.layers"]?.["0"] === 2 && d.stacks["model.layers"]?.["61"] === 1);
  check("an MTP stack is its own stack", d.stacks["mtp.layers"]?.["0"] === 1);
  check("GPT-2's bare h.N is a stack", d.stacks["h"]?.["2"] === 1);
}

console.log("\n--- DeepSeek-V3: MTP that ships, FP8 blocks, remote code ---");
{
  const b = brief("deepseek-ai_DeepSeek-V3");
  const m = b.facts.mtp;
  // The MTP module is layer 61 of 61 decoder layers (config num_hidden_layers 61).
  check("MTP ready, 1 declared", m.status === "ready" && m.declared === 1);
  check("1,564 tensors under layer 61", m.tensors === 1564 && m.where === "model.layers.61.*", `${m.tensors} ${m.where}`);
  check("FP8 128×128 blocks declared and in the tensors", b.facts.quant.declared?.label === "FP8, 128×128 blocks" && b.facts.quant.tensors === "fp8-block");
  check("vLLM drafts with method mtp", flag(b, "vllm", "--speculative-config")?.value === `'{"method":"mtp","num_speculative_tokens":1}'`);
  check("SGLang drafts through EAGLE", flag(b, "sglang", "--speculative-algorithm")?.value === "EAGLE");
  check("tool parser deepseek_v3 with vLLM's own template", flag(b, "vllm", "--tool-call-parser")?.value === "deepseek_v3" && flag(b, "vllm", "--chat-template")?.value === "examples/tool_chat_template_deepseekv3.jinja");
  check("custom code: --trust-remote-code", !!flag(b, "vllm", "--trust-remote-code") && !!gotcha(b, "g.remoteCode"));
  check("no reasoning parser: V3 does not think", !flag(b, "vllm", "--reasoning-parser"));
}

console.log("\n--- DeepSeek-V3 AWQ: MTP declared, not shipped ---");
{
  const b = brief("cognitivecomputations_DeepSeek-V3-AWQ");
  check("MTP missing", b.facts.mtp.status === "missing" && b.facts.mtp.declared === 1 && b.facts.mtp.tensors === 0);
  check("flagged as a warning", gotcha(b, "g.mtpMissing")?.severity === "warn");
  check("no speculative flag in either command", !flag(b, "vllm", "--speculative-config") && !flag(b, "sglang", "--speculative-algorithm"));
  check("AWQ 4-bit, group 128", b.facts.quant.declared?.label === "AWQ 4-bit, group 128" && b.facts.quant.tensors === "awq");
  check("the Hub lists its base", b.facts.derivedFrom?.id === "deepseek-ai/DeepSeek-V3" && b.facts.derivedFrom.relation === "quantized");
}

console.log("\n--- DeepSeek-V3.1: thinking toggle ---");
{
  const b = brief("deepseek-ai_DeepSeek-V3.1");
  check("family deepseek-v3.1", b.facts.family === "deepseek-v3.1");
  check("thinking toggle read from the template", b.facts.template?.thinkToggle === "thinking");
  check("vLLM: deepseek_v31 + deepseek_v3 reasoning", flag(b, "vllm", "--tool-call-parser")?.value === "deepseek_v31" && flag(b, "vllm", "--reasoning-parser")?.value === "deepseek_v3");
  check("SGLang: deepseekv31 + deepseek-v3 reasoning", flag(b, "sglang", "--tool-call-parser")?.value === "deepseekv31" && flag(b, "sglang", "--reasoning-parser")?.value === "deepseek-v3");
}

console.log("\n--- Qwen3-Next: MTP under its own name, config silent ---");
{
  const b = brief("Qwen_Qwen3-Next-80B-A3B-Instruct");
  check("MTP ready without a config field", b.facts.mtp.status === "ready" && b.facts.mtp.declared === undefined);
  check("1,553 tensors under mtp.*", b.facts.mtp.tensors === 1553 && b.facts.mtp.where === "mtp.*", `${b.facts.mtp.tensors} ${b.facts.mtp.where}`);
  check("says so in its own words", hasKey(b, "mtp.readyUndeclared"));
  check("both engines have a Qwen3-Next MTP draft", b.facts.mtp.vllm && b.facts.mtp.sglang);
  check("Instruct does not think: no reasoning parser", !flag(b, "vllm", "--reasoning-parser"));
}

console.log("\n--- MiMo-7B-RL: mtp_layers, a max_new_tokens cap ---");
{
  const b = brief("XiaomiMiMo_MiMo-7B-RL");
  check("MTP ready under model.mtp_layers", b.facts.mtp.status === "ready" && b.facts.mtp.tensors === 16 && b.facts.mtp.where === "model.mtp_layers.*", String(b.facts.mtp.where));
  // generation_config.json: max_new_tokens 2048, which vLLM makes a server-wide cap.
  check("max_new_tokens 2048 flagged", gotcha(b, "g.maxNew")?.v?.n === 2048 && gotcha(b, "g.maxNew")?.severity === "warn");
  check("no sampling values and do_sample false: greedy", hasKey(b, "sampling.greedyOnly"));
  check("tool parser mimo in both", flag(b, "vllm", "--tool-call-parser")?.value === "mimo" && flag(b, "sglang", "--tool-call-parser")?.value === "mimo");
}

console.log("\n--- GLM-4.5-Air: MTP as layer 46, glm45 ---");
{
  const b = brief("zai-org_GLM-4.5-Air");
  check("MTP ready, layer 46", b.facts.mtp.status === "ready" && b.facts.mtp.where === "model.layers.46.*", String(b.facts.mtp.where));
  check("vLLM glm45 / glm45", flag(b, "vllm", "--tool-call-parser")?.value === "glm45" && flag(b, "vllm", "--reasoning-parser")?.value === "glm45");
  check("SGLang glm / glm45", flag(b, "sglang", "--tool-call-parser")?.value === "glm" && flag(b, "sglang", "--reasoning-parser")?.value === "glm45");
}

console.log("\n--- Kimi-K2: no MTP, custom tokenizer ---");
{
  const b = brief("moonshotai_Kimi-K2-Instruct");
  check("num_nextn_predict_layers 0: none", b.facts.mtp.status === "none" && b.facts.mtp.declared === 0);
  check("custom tokenizer code", b.facts.remoteCode.tokenizer && b.facts.remoteCode.files.includes("tokenization_kimi.py"));
  check("kimi_k2 in both", flag(b, "vllm", "--tool-call-parser")?.value === "kimi_k2" && flag(b, "sglang", "--tool-call-parser")?.value === "kimi_k2");
  check("text-only: the template's image branch is not claimed", !hasKey(b, "chat.images") && !b.facts.vision);
}

console.log("\n--- gpt-oss-20b: harmony, MXFP4, extra stop tokens ---");
{
  const b = brief("openai_gpt-oss-20b");
  check("harmony with reasoning_effort", b.facts.template?.toolFormat === "harmony" && b.facts.template.thinkToggle === "reasoning_effort");
  check("vLLM openai / openai_gptoss", flag(b, "vllm", "--tool-call-parser")?.value === "openai" && flag(b, "vllm", "--reasoning-parser")?.value === "openai_gptoss");
  check("SGLang gpt-oss / gpt-oss", flag(b, "sglang", "--tool-call-parser")?.value === "gpt-oss" && flag(b, "sglang", "--reasoning-parser")?.value === "gpt-oss");
  check("MXFP4 declared and in the tensors", b.facts.quant.declared?.scheme === "mxfp4" && b.facts.quant.tensors === "mxfp4");
  // config.json eos 200002; generation_config.json [200002, 199999, 200012].
  check("two extra stop tokens", b.facts.eos.extra.join() === "199999,200012");
  check("attention and router kept unquantized", b.facts.quant.kept.includes("model.layers.*.mlp.router"));
  check("original/ weights are not counted", b.facts.shards === 3);
}

console.log("\n--- Qwen3: Hermes tools, switchable thinking ---");
for (const name of ["Qwen_Qwen3-32B", "Qwen_Qwen3-0.6B"]) {
  const b = brief(name);
  check(`${name}: hermes + qwen3 (vLLM)`, flag(b, "vllm", "--tool-call-parser")?.value === "hermes" && flag(b, "vllm", "--reasoning-parser")?.value === "qwen3");
  check(`${name}: qwen + qwen3 (SGLang)`, flag(b, "sglang", "--tool-call-parser")?.value === "qwen" && flag(b, "sglang", "--reasoning-parser")?.value === "qwen3");
  check(`${name}: enable_thinking`, b.facts.template?.thinkToggle === "enable_thinking");
  check(`${name}: <|endoftext|> stops too`, b.facts.eos.extra.join() === "151643");
}
{
  const s = load("Qwen_Qwen3-0.6B");
  check("a single-file model's names come from its header", s.tensorFile === "model.safetensors" && s.tensors?.total === 311);
}

console.log("\n--- Qwen3-Coder: XML tool calls ---");
{
  const b = brief("Qwen_Qwen3-Coder-30B-A3B-Instruct");
  check("<function=…> read as qwen3-xml", b.facts.template?.toolFormat === "qwen3-xml");
  check("vLLM qwen3_xml, SGLang qwen3_coder", flag(b, "vllm", "--tool-call-parser")?.value === "qwen3_xml" && flag(b, "sglang", "--tool-call-parser")?.value === "qwen3_coder");
}

console.log("\n--- Qwen2.5-VL: vision, M-RoPE is not a stretch ---");
{
  const b = brief("Qwen_Qwen2.5-VL-7B-Instruct");
  check("vision", b.facts.vision);
  check("no tools list, so no tool parser", !flag(b, "vllm", "--tool-call-parser") && !flag(b, "sglang", "--tool-call-parser"));
  check("mrope not reported as context scaling", !hasKey(b, "context.scaledPlain") && !hasKey(b, "context.scaled"));
}

console.log("\n--- quantized copies ---");
{
  const r = brief("RedHatAI_Qwen3-8B-FP8-dynamic");
  check("compressed-tensors FP8 agrees with weight_scale", r.facts.quant.declared?.label === "FP8 (compressed-tensors)" && r.facts.quant.tensors === "fp8" && hasKey(r, "weights.tensorsAgree"));
  check("lm_head kept", r.facts.quant.kept.join() === "lm_head");
  const a = brief("Qwen_Qwen2.5-7B-Instruct-AWQ");
  check("AWQ agrees with qweight", a.facts.quant.tensors === "awq" && hasKey(a, "weights.tensorsAgree"));
  const n = brief("nvidia_Llama-3.3-70B-Instruct-FP4");
  check("NVFP4: config.json says nothing", load("nvidia_Llama-3.3-70B-Instruct-FP4").config?.quantization_config === undefined);
  check("…hf_quant_config.json declares it", n.facts.quant.declared?.file === "hf_quant_config.json" && n.facts.quant.declared.scheme === "nvfp4");
  check("…and weight_scale_2 agrees", n.facts.quant.tensors === "nvfp4" && !gotcha(n, "g.quantUndeclared"));
  check("FP8 KV scales: --kv-cache-dtype fp8", n.facts.quant.kvScales && flag(n, "vllm", "--kv-cache-dtype")?.value === "fp8");
  check("Llama 3 JSON tools with vLLM's template", flag(n, "vllm", "--tool-call-parser")?.value === "llama3_json" && flag(n, "vllm", "--chat-template")?.value === "examples/tool_chat_template_llama3.1_json.jinja");
}

console.log("\n--- Mistral Small 3.2: its own layout ---");
{
  const b = brief("mistralai_Mistral-Small-3.2-24B-Instruct-2506");
  check("format mistral, chat through mistral-common", b.facts.format === "mistral" && b.facts.mistralCommon && b.facts.role === "chat");
  check("mistral parser in both", flag(b, "vllm", "--tool-call-parser")?.value === "mistral" && flag(b, "sglang", "--tool-call-parser")?.value === "mistral");
  check("no format flags", !b.commands.vllm.flags.some((f) => /format|tokenizer-mode/.test(f.flag)));
  check("no end-token claim without config's own", b.facts.eos.extra.length === 0);
  check("vision", b.facts.vision);
}

console.log("\n--- roles that are not chat ---");
{
  const e = brief("Qwen_Qwen3-Embedding-0.6B");
  check("embedding: pooling runner, --is-embedding", e.facts.role === "embedding" && flag(e, "vllm", "--runner")?.value === "pooling" && !!flag(e, "sglang", "--is-embedding"));
  check("embedding: no tool parser though the template has tools", !flag(e, "vllm", "--tool-call-parser"));
  const l = brief("lucylq_qwen3_06B_lora_math");
  check("adapter served on its base", l.commands.vllm.base === "vllm serve unsloth/Qwen3-0.6B" && flag(l, "vllm", "--lora-modules")?.value === "qwen3_06B_lora_math=lucylq/qwen3_06B_lora_math");
  check("SGLang loads it with --lora-paths", flag(l, "sglang", "--lora-paths")?.value === "qwen3_06B_lora_math=lucylq/qwen3_06B_lora_math");
  const d = brief("lmsys_sglang-EAGLE3-LLaMA3.1-Instruct-8B");
  check("EAGLE3 draft: no command", d.facts.role === "draft" && d.commands.vllm.base === null && d.commands.sglang.base === null);
  const o = brief("facebook_opt-125m");
  check("pickle-only flagged", o.facts.format === "pytorch" && gotcha(o, "g.pickle")?.severity === "warn");
  check("base model without a template flagged", gotcha(o, "g.noTemplate")?.severity === "warn");
  const g = brief("unsloth_Qwen3-30B-A3B-GGUF");
  check("GGUF: no engine command", g.facts.format === "gguf" && g.commands.vllm.base === null && g.commands.sglang.base === null);
  check("GGUF: the copied config.json is flagged", !!gotcha(g, "g.ggufConfig"));
  check("GGUF: no 'no template' claim — it lives in the GGUF", !gotcha(g, "g.noTemplate"));
  // 27 files: BF16 comes in two shards, so 26 quantizations.
  check("GGUF: 26 quantizations, UD- kept apart", g.facts.gguf.length === 26 && g.facts.gguf.some((x) => x.label === "UD-Q4_K_XL") && g.facts.gguf.some((x) => x.label === "Q4_K_M"), String(g.facts.gguf.length));
}

console.log("\n--- gated ---");
{
  const b = brief("meta-llama_Llama-3.1-8B-Instruct");
  check("four files unreadable", (load("meta-llama_Llama-3.1-8B-Instruct").unreadable ?? []).length === 4);
  check("role unknown, not 'base'", b.facts.role === "unknown" && !gotcha(b, "g.noTemplate"));
  check("says what it could not read", gotcha(b, "g.unreadable")?.severity === "warn" && !!gotcha(b, "g.gated"));
  check("a plain command with a token note", b.commands.vllm.base === "vllm serve meta-llama/Llama-3.1-8B-Instruct" && b.commands.vllm.notes.some((n) => n.k === "cmd.token"));
}

console.log("\n--- Gemma 2: no system role ---");
{
  const b = brief("unsloth_gemma-2-2b-it");
  check("template rejects system", b.facts.template?.noSystem === true && !!gotcha(b, "g.noSystem"));
  check("…and requires alternation", b.facts.template?.alternation === true);
}

console.log("\n--- every fixture: names the engines have, sentences in both languages ---");
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  const name = f.replace(/\.json$/, "");
  for (const lang of ["en", "tr"] as Lang[]) {
    const b = brief(name, lang);
    const missing = keys(b).filter((p) => !(`serve.a.${p.k}` in DICTS[lang])).map((p) => p.k);
    check(`${name} [${lang}]: every sentence exists`, missing.length === 0, missing.join(", "));
    const unfilled = keys(b).map((p) => fill(lang, p)).filter((s) => /\{[a-zA-Z]+\}/.test(s));
    check(`${name} [${lang}]: every placeholder filled`, unfilled.length === 0, unfilled.join(" | "));
    for (const s of b.sections) check(`${name} [${lang}]: section ${s.id} has a question`, `serve.q.${s.id}` in DICTS[lang]);
  }
  const b = brief(name);
  const p = b.facts.parsers;
  const bad = [
    p.vllm.tool && !VLLM_TOOL.has(p.vllm.tool) && `vllm tool ${p.vllm.tool}`,
    p.vllm.reasoning && !VLLM_REASONING.has(p.vllm.reasoning) && `vllm reasoning ${p.vllm.reasoning}`,
    p.sglang.tool && !SGLANG_TOOL.has(p.sglang.tool) && `sglang tool ${p.sglang.tool}`,
    p.sglang.reasoning && !SGLANG_REASONING.has(p.sglang.reasoning) && `sglang reasoning ${p.sglang.reasoning}`,
    p.vllm.template && !VLLM_TEMPLATES.has(p.vllm.template) && `vllm template ${p.vllm.template}`,
    p.sglang.template && !SGLANG_TEMPLATES.has(p.sglang.template) && `sglang template ${p.sglang.template}`,
  ].filter(Boolean);
  check(`${name}: parser names are the engines' own`, bad.length === 0, bad.join(", "));
  for (const engine of ["vllm", "sglang"] as const) {
    const text = commandText(b.commands[engine]);
    check(`${name}: ${engine} command is one flag per line`, !text || text.split(" \\\n").slice(1).every((l) => /^  --[a-z-]+( \S.*)?$/.test(l)), text.split("\n")[1] ?? "");
  }
}

console.log("\n--- the page's own strings ---");
{
  const uiKeys = Object.keys(DICTS.en).filter((k) => k.startsWith("serve.") || k.startsWith("about.serving."));
  const trMissing = uiKeys.filter((k) => !(k in DICTS.tr));
  check(`${uiKeys.length} keys, all in Turkish`, trMissing.length === 0, trMissing.join(", "));
  const trOnly = Object.keys(DICTS.tr).filter((k) => (k.startsWith("serve.") || k.startsWith("about.serving.")) && !(k in DICTS.en));
  check("no Turkish-only keys", trOnly.length === 0, trOnly.join(", "));
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);

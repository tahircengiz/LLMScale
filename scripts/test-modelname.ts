// Unit test for the model-name decoder. Run: node scripts/test-modelname.ts
import { parseModelName, type Kind } from "../src/lib/modelName.ts";

let fails = 0;
function kinds(id: string): Record<string, Kind> {
  const out: Record<string, Kind> = {};
  for (const t of parseModelName(id).tokens) out[t.text] = t.kind;
  return out;
}
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const a = kinds("RedHatAI/Qwen3.6-35B-A3B-NVFP4");
check("RedHatAI → org", a["RedHatAI"] === "org");
check("Qwen3.6 → family", a["Qwen3.6"] === "family");
check("35B → params", a["35B"] === "params");
check("A3B → moeActive", a["A3B"] === "moeActive");
check("NVFP4 → quantNVFP4", a["NVFP4"] === "quantNVFP4");

const b = kinds("mistralai/Mixtral-8x7B-Instruct-v0.1");
check("8x7B → moe", b["8x7B"] === "moe");
check("Instruct → instruct", b["Instruct"] === "instruct");
check("v0.1 → version", b["v0.1"] === "version");

const c = kinds("bartowski/Llama-3.1-70B-Instruct-GGUF");
check("70B → params", c["70B"] === "params");
check("3.1 → version", c["3.1"] === "version");
check("GGUF → quantGGUF", c["GGUF"] === "quantGGUF");

const d = kinds("RedHatAI/Qwen3-8B-FP8-dynamic");
check("FP8 → quantFP8", d["FP8"] === "quantFP8");
check("dynamic → quantDynamic", d["dynamic"] === "quantDynamic");

const e = kinds("Qwen/Qwen2.5-Coder-7B-Instruct-AWQ");
check("Coder → coder", e["Coder"] === "coder");
check("AWQ → quantAWQ", e["AWQ"] === "quantAWQ");

const f = kinds("Qwen/Qwen2.5-VL-7B-Instruct");
check("VL → vision", f["VL"] === "vision");

const g = kinds("deepseek-ai/DeepSeek-R1-Distill-Qwen-7B");
check("R1 → reasoning", g["R1"] === "reasoning");
check("Distill → reasoning", g["Distill"] === "reasoning");

console.log("\nsample segments:", parseModelName("RedHatAI/Qwen3.6-35B-A3B-NVFP4").segments.map((s) => s.type === "sep" ? s.text : `[${s.text}:${s.kind}]`).join(" "));
console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);

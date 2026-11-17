// What a repository's own files say beyond its config (2026-11-17, vllm-sr/d3-ultra).
// Run: node scripts/test-repo-signals.ts
//
// d3-ultra's config declares one MTP layer (mtp_num_hidden_layers: 1), but its
// checkpoint ships none: model.safetensors.index.json names no mtp.* tensor. The
// sizing left 362M parameters out anyway, so its BF16 weights came out 47.91 GiB
// where its files hold 48.59. A config that declares speculative layers now has its
// index read, when the index is small enough to fetch, and what it does not ship is
// not left out. d3-ultra also runs on its own code (auto_map AutoModel →
// modeling_d3.D3Model) as a classifier, not a text generator vLLM would serve; the
// figures say so beside them.
//
// The Hub's answers are replayed from scripts/fixtures/configs-regression/
// (scripts/hub-replay.ts).

import { readdirSync, readFileSync } from "node:fs";
import { BYTES_PER_GIB, weightsBytes } from "../src/lib/calc.ts";
import { resolveModel } from "../src/lib/hf.ts";
import { DEFAULT_STATE, decodeState, encodeState } from "../src/lib/urlState.ts";
import { listedRepos, replayHub } from "./hub-replay.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const gib = (b: number) => (b / BYTES_PER_GIB).toFixed(2);

const dir = new URL("./fixtures/configs-regression/", import.meta.url);
const restore = replayHub(dir);
try {
  console.log("--- speculative layers the checkpoint does not ship ---");
  const d3 = await resolveModel("vllm-sr/d3-ultra");
  const a = d3.arch!;
  // model.safetensors.index.json: total_parameters 26,085,330,160, total_size 52,170,660,320.
  check("d3-ultra: no MTP layer left out", a.specParams === undefined, String(a.specParams));
  check("…its BF16 weights are its files, 48.59 GiB", weightsBytes(a, "bf16") === 52_170_660_320, `${gib(weightsBytes(a, "bf16"))} GiB`);
  // A dense model with nothing left out has no separate active count: decode reads them all.
  check("…and no parameter is left out of decode", a.activeParams === undefined, `${a.activeParams} of ${a.numParams}`);
  const back = decodeState(encodeState({ ...DEFAULT_STATE, hfId: "vllm-sr/d3-ultra", arch: a })).arch!;
  check("…and a link keeps the weights", weightsBytes(back, "bf16") === weightsBytes(a, "bf16"), `${gib(weightsBytes(back, "bf16"))} GiB`);

  const q9 = (await resolveModel("Qwen/Qwen3.5-9B")).arch!;
  // Its index ships mtp.fc, mtp.layers.0.* and the rest: still left out.
  check("Qwen3.5-9B ships its MTP layer: still left out", Math.round(q9.specParams ?? 0) === 230_874_755, String(q9.specParams));
  const v3 = (await resolveModel("deepseek-ai/DeepSeek-V3")).arch!;
  // An 8.9 MB index is not fetched: nothing is known, so nothing changes.
  check("DeepSeek-V3's index is too large to read: its MTP layer still left out", (v3.specParams ?? 0) > 10.8e9, String(v3.specParams));

  console.log("\n--- a model that runs on its own code ---");
  check("d3-ultra: runs on modeling_d3.D3Model", a.ownRuntime === "modeling_d3.D3Model", String(a.ownRuntime));
  check("…and a link keeps it", back.ownRuntime === "modeling_d3.D3Model", String(back.ownRuntime));
  const flagged: string[] = [];
  for (const id of listedRepos(dir)) {
    if (id === "vllm-sr/d3-ultra") continue;
    const r = await resolveModel(id);
    if (r.arch?.ownRuntime) flagged.push(`${id} (${r.arch.ownRuntime})`);
  }
  // ChatGLM3's AutoModel is its own ChatGLMForConditionalGeneration: a generator.
  check("no other regression repo is flagged, ChatGLM3 included", flagged.length === 0, flagged.join(", "));
  check("a forged value is dropped", decodeState("p=1e9&L=4&h=512&a=8&k=8&or=%3Cscript%3E").arch?.ownRuntime === undefined);
  // Its cache, overhead, users, context and speed would be vLLM's guesses, so every
  // page that sizes a Hub model with the engine holds them back for it; the weights stay.
  const pages = new URL("../src/pages/", import.meta.url);
  const ENGINE = /\b(calculate|maxConcurrency|planOptions|recommend|kvBytesPerToken|buildBrief)\(/;
  const sizing = readdirSync(pages).filter((f) => ENGINE.test(readFileSync(new URL(f, pages), "utf8")));
  for (const f of sizing) check(`${f} holds vLLM's figures back for it`, /\.ownRuntime\b/.test(readFileSync(new URL(f, pages), "utf8")));
  check("…six pages size a Hub model", sizing.length === 6, sizing.join(", "));
} finally {
  restore();
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);

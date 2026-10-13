// Concurrency under a typical load (E4). Run: node scripts/test-load.ts
//
// vLLM reports "Maximum concurrency" for requests that each fill max_model_len:
// the worst case. It hands out KV blocks as tokens arrive, so in practice the pool
// holds requests at the size they are, and prefix caching keeps a prompt prefix
// they share once. typicalConcurrency in calc.ts sizes that; these checks hold it
// to the same block accounting kvReservedPerSeq was checked against vLLM with.

import { readFileSync } from "node:fs";
import { archFromConfig } from "../src/lib/hf.ts";
import { kvReservedPerSeq, kvSharedPrefix, maxConcurrency, tokensInUse, typicalConcurrency } from "../src/lib/calc.ts";
import { findKnownByHfId } from "../src/lib/models.ts";
import { vllmBatch } from "../src/lib/overhead.ts";
import { decodeState, encodeState, DEFAULT_STATE } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const repo = (n: string) => JSON.parse(readFileSync(new URL(`./fixtures/repos/${n}.json`, import.meta.url), "utf8"));

const llama = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
const h100 = vllmBatch(80, "H100");
const usable = 80 * 0.92;
const base = { arch: llama, weightDtype: "bf16" as const, kvDtype: "fp16" as const, contextLength: 32768, batch: h100 };

console.log("--- tokens in use ---");
check("a prompt and half the reply", tokensInUse({ promptTokens: 2048, outputTokens: 512, sharedPrefix: 0 }, 32768) === 2304);
check("never more than the context", tokensInUse({ promptTokens: 30000, outputTokens: 8000, sharedPrefix: 0 }, 32768) === 32768);

console.log("--- against the worst case ---");
{
  const load = { promptTokens: 2048, outputTokens: 512, sharedPrefix: 0 };
  const t = typicalConcurrency(base, usable, load);
  const worst = maxConcurrency(base, usable);
  const sameSize = maxConcurrency({ ...base, contextLength: t.inUse }, usable);
  check("with no shared prefix it is the worst case at the size requests hold", t.users === Math.min(sameSize, h100.seqs), `${t.users} vs ${sameSize}`);
  check("…and far above the full-context worst case", t.users > 10 * worst, `${t.users} vs ${worst} at 32k`);
  check("not capped at that size", !t.capped);
}

console.log("--- a shared prefix ---");
{
  const plain = typicalConcurrency(base, usable, { promptTokens: 4096, outputTokens: 512, sharedPrefix: 0 });
  const shared = typicalConcurrency(base, usable, { promptTokens: 4096, outputTokens: 512, sharedPrefix: 3072 });
  check("a 3k system prompt in a 4k prompt fits more users", shared.users > 2 * plain.users, `${shared.users} vs ${plain.users}`);
  check("only whole blocks are shared", kvSharedPrefix(llama, "fp16", 3080) === kvSharedPrefix(llama, "fp16", 3072));
  check("a prefix under one block shares nothing", kvSharedPrefix(llama, "fp16", 15) === 0);
  check("Llama: every layer shares, 128 KiB a token", kvSharedPrefix(llama, "fp16", 1024) === 1024 * 131072);
}

console.log("--- max_num_seqs ---");
{
  const small = findKnownByHfId("Qwen/Qwen2.5-7B-Instruct")!;
  const t = typicalConcurrency({ ...base, arch: small }, usable, { promptTokens: 256, outputTokens: 128, sharedPrefix: 0 });
  check("short requests on a big card stop at max_num_seqs", t.users === h100.seqs && t.capped, `${t.users}`);
}

console.log("--- windows and states ---");
{
  const g = archFromConfig(repo("unsloth_gemma-3-1b-it").config, 999_885_952)!;
  // 4 full layers in one group of 4: 16 KiB a token across them, per 16-token block.
  check("Gemma 3 1B: only the full-attention layers share", kvSharedPrefix(g, "bf16", 1024) === 1024 * 4 * 1024);
  const r = repo("ibm-granite_granite-4.0-h-micro");
  const granite = archFromConfig(r.config, r.numParams)!;
  // Attention blocks grow to 528 tokens to hold a Mamba state (test-vllmlog.ts).
  check("Granite 4.0-H: shared in 528-token blocks", kvSharedPrefix(granite, "bf16", 1000) === kvSharedPrefix(granite, "bf16", 528) && kvSharedPrefix(granite, "bf16", 527) === 0);
  const per = kvReservedPerSeq(granite, "bf16", 4096);
  check("…and never more than a request holds", kvSharedPrefix(granite, "bf16", 4096) < per);
}

console.log("--- the URL ---");
{
  const s = { ...DEFAULT_STATE, loadPrompt: 2048, loadOutput: 512, loadPrefix: 1024 };
  const back = decodeState("?" + encodeState(s));
  check("a typical load survives a reload", back.loadPrompt === 2048 && back.loadOutput === 512 && back.loadPrefix === 1024);
  check("none set, none written", !encodeState(DEFAULT_STATE).includes("lp="));
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);

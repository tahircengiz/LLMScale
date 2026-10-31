// GPU Compare (gpuCompare.ts, gpuSpecs.ts). Run: node scripts/test-gpucompare.ts
//
// The page is the devices' datasheets side by side. These check that every
// device has its facts and a source for them, that the facts are in the shape
// the page renders, and that the figures its copy quotes stay true.

import { readFileSync } from "node:fs";
import { DICTS } from "../src/lib/dict.ts";
import { GPUS } from "../src/lib/gpus.ts";
import { GPU_SPECS } from "../src/lib/gpuSpecs.ts";
import { findKnownByHfId } from "../src/lib/models.ts";
import { decodeStep } from "../src/lib/perf.ts";
import { DEFAULT_GPU_IDS, MAX_GPUS, bestOf, migMax, parseGpuIds, servedBy } from "../src/lib/gpuCompare.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const gpu = (id: string) => GPUS.find((g) => g.id === id)!;

console.log("--- per device ---");
{
  check("H100: up to 7 MIG instances", migMax(gpu("h100-80")) === 7);
  check("a card without MIG reports none", migMax(gpu("rtx4090-24")) === undefined);
  check("H100 serves on CUDA", servedBy(gpu("h100-80")) === "cuda");
  check("MI300X serves on ROCm", servedBy(gpu("mi300x-192")) === "rocm");
  check("Apple Silicon has no vLLM", servedBy(gpu("apple-m4max-128")) === "metal");
}

console.log("\n--- the datasheet facts ---");
{
  const ids = GPUS.map((g) => g.id);
  const missing = ids.filter((id) => !(id in GPU_SPECS));
  const unknown = Object.keys(GPU_SPECS).filter((id) => !ids.includes(id));
  check("every device has its facts", missing.length === 0, missing.join(", "));
  check("…and no facts name a device that is gone", unknown.length === 0, unknown.join(", "));
  const specs = Object.entries(GPU_SPECS);
  const badLaunch = specs.filter(([, s]) => s.launch && !/^\d{4}-(0[1-9]|1[0-2])$/.test(s.launch)).map(([id]) => id);
  check("launches are YYYY-MM", badLaunch.length === 0, badLaunch.join(", "));
  const unitless = specs.filter(([, s]) => (s.cores != null) !== (s.coreUnit != null)).map(([id]) => id);
  check("a core count always has its unit", unitless.length === 0, unitless.join(", "));
  const range = specs.filter(([, s]) => s.powerMaxW != null && !(s.powerW != null && s.powerMaxW > s.powerW)).map(([id]) => id);
  check("a power range runs low to high", range.length === 0, range.join(", "));
  const long = specs.flatMap(([id, s]) => [s.host, s.link, s.arch, s.chip, s.process].filter((v) => v && v.length > 36).map((v) => `${id}: ${v}`));
  check("short forms stay short enough for a column", long.length === 0, long.join("; "));
  const doc = readFileSync(new URL("../docs/gpu-specs.md", import.meta.url), "utf8");
  const undocumented = ids.filter((id) => !doc.includes("`" + id + "`"));
  check("docs/gpu-specs.md sources every device", undocumented.length === 0, undocumented.join(", "));
  check("the M4 Max 64GB is the 40-core part at 546 GB/s, as Apple sells it", gpu("apple-m4max-64").bandwidthGBs === 546 && GPU_SPECS["apple-m4max-64"].cores === 40);
  // NVIDIA's per-GPU listing (HGX B200 / B300 datasheets), not the physical stacks.
  check("B200 at 180 GB and 7.7 TB/s, as NVIDIA lists it per GPU", gpu("b200-192").vramGiB === 180 && gpu("b200-192").bandwidthGBs === 7700);
  check("B300 at 270 GB and 7.7 TB/s", gpu("b300-288").vramGiB === 270 && gpu("b300-288").bandwidthGBs === 7700);
  check("…and their names say so", gpu("b200-192").name.includes("180GB") && gpu("b300-288").name.includes("270GB"));
  check("B200's largest MIG slice is the whole 180 GB", migMax(gpu("b200-192")) === 7);
  // Metal's recommendedMaxWorkingSetSize: two-thirds below 36 GB, three-quarters from it up.
  check("a 32 GB M4 gives its GPU two-thirds", Math.abs(gpu("apple-m4-32").vramGiB - 32 * 2 / 3) < 0.05);
  check("…a 48 GB M4 Pro three-quarters", gpu("apple-m4pro-48").vramGiB === 36);
}

console.log("\n--- what the about text says ---");
{
  // "an RTX 5090 generates about twice as fast for one user as an L40S, although
  // the L40S is rated higher at BF16"
  const llama8 = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
  const step = { arch: llama8, weightDtype: "bf16" as const, kvDtype: "fp16" as const, contextLength: 8192 };
  const speed = (id: string) => decodeStep(step, 1, { tflops: gpu(id).tflops, bandwidthGBs: gpu(id).bandwidthGBs! })!.perUser;
  const ratio = speed("rtx5090-32") / speed("l40s-48");
  check("an RTX 5090 is about twice as fast as an L40S for one user", ratio > 1.8 && ratio < 2.2, `${ratio.toFixed(2)}×`);
  check("…though the L40S is rated higher at BF16", gpu("l40s-48").tflops!.bf16 > gpu("rtx5090-32").tflops!.bf16);
  check("Strix Halo's GPU gets 96 of its 128 GB", gpu("amd-strixhalo-128").vramGiB === 96 && gpu("amd-strixhalo-128").totalGiB === 128);
  // "Pick two to four of the 45 devices LLMScale knows": a count typed into the
  // copy, so it is held to the list the picker offers (it once said 43 of 45).
  for (const lang of ["en", "tr"] as const) {
    const said = Number(DICTS[lang]["about.gpucompare.p1"].match(/\d+/)?.[0]);
    check(`the ${lang} text counts the devices the picker offers`, said === GPUS.length, `${said} vs ${GPUS.length}`);
  }
}

console.log("\n--- the highlight and the link ---");
{
  check("best of differing values", JSON.stringify(bestOf([1, 3, 2])) === "[false,true,false]");
  check("lower is better where asked", JSON.stringify(bestOf([1, 3, 2], false)) === "[true,false,false]");
  check("a tie highlights nothing", bestOf([2, 2, 2]).every((w) => !w));
  check("one value alone highlights nothing", bestOf([2, undefined]).every((w) => !w));
  check("missing values are skipped", JSON.stringify(bestOf([undefined, 4, 3])) === "[false,true,false]");

  check("the default devices exist", DEFAULT_GPU_IDS.every((id) => GPUS.some((g) => g.id === id)));
  check("an empty link opens the default set", parseGpuIds(null, GPUS).join() === DEFAULT_GPU_IDS.join());
  check("unknown ids are dropped", parseGpuIds("h100-80,nope", GPUS).join() === "h100-80");
  check("duplicates are dropped", parseGpuIds("h100-80,h100-80", GPUS).join() === "h100-80");
  check(`at most ${MAX_GPUS}`, parseGpuIds(GPUS.slice(0, 6).map((g) => g.id).join(","), GPUS).length === MAX_GPUS);
  check("a link of only unknown ids opens the default set", parseGpuIds("x,y", GPUS).join() === DEFAULT_GPU_IDS.join());
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
if (fails) process.exit(1);

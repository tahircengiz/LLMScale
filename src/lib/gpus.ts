import { calculate, layoutFor, type CalcInput } from "./calc.ts";
import { COMPUTE_EFFICIENCY, CONSUMER_COMPUTE_EFFICIENCY, type Tflops } from "./perf.ts";
import { VLLM_UTIL, vllmBatch, type BatchShape } from "./overhead.ts";

// Curated GPU database. `vramGiB` is the nominal on-board memory treated as GiB.
// `tflops` is dense tensor throughput (no structured sparsity) from each vendor's
// datasheet, halved where only the sparse figure is printed; GeForce figures are
// the FP32-accumulate rate. Sources and confidence per device: docs/gpu-tflops.md.

export type GpuCategory = "consumer" | "workstation" | "datacenter" | "apple" | "apu";

export interface Gpu {
  id: string;
  name: string;
  /** Memory budget usable for the model (GiB). For unified-memory devices this is
   *  the realistic slice the GPU can address by default, not the full pool (see totalGiB). */
  vramGiB: number;
  category: GpuCategory;
  vendor: "NVIDIA" | "AMD" | "Apple" | "Intel";
  /** Memory bandwidth in GB/s. */
  bandwidthGBs?: number;
  /** Unified-memory device (RAM shared between CPU and GPU). */
  unified?: boolean;
  /** Total on-package unified memory (GiB). When set, vramGiB is the usable slice. */
  totalGiB?: number;
  /** Memory the runtime reports (torch's total, what vLLM's --gpu-memory-utilization
   *  multiplies), when it differs from the nominal GB: GB counted as GiB overstates
   *  every card a little, and ECC on GDDR datacenter cards (L40S, L4, T4) reserves a
   *  sixteenth. Read from vLLM startup logs (docs/audit-2026-10-15/vllm-loglari.md). */
  visibleGiB?: number;
  /** vLLM 0.31 does not run on it (compute capability below 7.5). */
  noVllm?: boolean;
  /** Dense tensor throughput from the vendor's datasheet, TFLOPS (perf.ts). */
  tflops?: Tflops;
  /** Where measured: the share of that peak vLLM's matrix multiplies reach, and what
   *  each layer of a step costs beyond its reads, ms (perf.ts, LAYER_MS otherwise). */
  computeEfficiency?: number;
  layerMs?: number;
  note?: string;
}

export const GPUS: Gpu[] = [
  // Consumer NVIDIA
  { id: "rtx3060-12", name: "RTX 3060", vramGiB: 12, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 360, tflops: { bf16: 25.5 } },
  { id: "rtx4060ti-16", name: "RTX 4060 Ti 16GB", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 288, tflops: { bf16: 44.1, fp8: 88.3 } },
  { id: "rtx4070ti-s-16", name: "RTX 4070 Ti Super", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 672, tflops: { bf16: 88.3, fp8: 176.5 } },
  { id: "rtx4080-16", name: "RTX 4080 / Super", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 717, tflops: { bf16: 104.5, fp8: 209 } },
  { id: "rtx3090-24", name: "RTX 3090 / Ti", vramGiB: 24, visibleGiB: 23.6, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 936, tflops: { bf16: 71 } },
  { id: "rtx4090-24", name: "RTX 4090", vramGiB: 24, visibleGiB: 23.65, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 1008, tflops: { bf16: 165.2, fp8: 330.3 } },
  { id: "rtx5070ti-16", name: "RTX 5070 Ti", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 896, tflops: { bf16: 87.9, fp8: 175.8, fp4: 703 } },
  { id: "rtx5080-16", name: "RTX 5080", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 960, tflops: { bf16: 112.6, fp8: 225.1, fp4: 900.4 } },
  { id: "rx7900xtx-24", name: "AMD RX 7900 XTX", vramGiB: 24, category: "consumer", vendor: "AMD", bandwidthGBs: 960, tflops: { bf16: 123 } },
  { id: "rtx5090-32", name: "RTX 5090", vramGiB: 32, visibleGiB: 31.38, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 1792, tflops: { bf16: 209.5, fp8: 419, fp4: 1676 } },

  // Workstation / pro
  { id: "l4-24", name: "NVIDIA L4", vramGiB: 24, visibleGiB: 22.0, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 300, tflops: { bf16: 121, fp8: 242.5 } },
  { id: "a5000-24", name: "RTX A5000", vramGiB: 24, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 768, tflops: { bf16: 111.1 } },
  { id: "a6000-48", name: "RTX A6000", vramGiB: 48, visibleGiB: 47.53, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 768, tflops: { bf16: 154.8 } },
  { id: "rtx6000ada-48", name: "RTX 6000 Ada", vramGiB: 48, visibleGiB: 47.49, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 960, tflops: { bf16: 364.25, fp8: 728.5 } },
  { id: "l40s-48", name: "NVIDIA L40S", vramGiB: 48, visibleGiB: 44.36, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 864, tflops: { bf16: 362.05, fp8: 733 } },
  { id: "rtxpro5000-72", name: "RTX PRO 5000 Blackwell (72GB)", vramGiB: 72, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 1344, tflops: { bf16: 258, fp8: 516, fp4: 1032 } },

  // Datacenter
  { id: "t4-16", name: "NVIDIA T4", vramGiB: 16, visibleGiB: 14.57, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 320, tflops: { bf16: 65 } },
  { id: "v100-32", name: "Tesla V100 32GB", vramGiB: 32, noVllm: true, visibleGiB: 31.73, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 900, tflops: { bf16: 125 } },
  { id: "a30-24", name: "NVIDIA A30", vramGiB: 24, visibleGiB: 23.5, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 933, tflops: { bf16: 165 } },
  { id: "a100-40", name: "A100 40GB", vramGiB: 40, visibleGiB: 39.38, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 1555, tflops: { bf16: 312 } },
  { id: "a100-80", name: "A100 80GB", vramGiB: 80, visibleGiB: 79.15, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 2039, tflops: { bf16: 312 } },
  { id: "h100-80", name: "H100 SXM 80GB", vramGiB: 80, visibleGiB: 79.15, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 3350, tflops: { bf16: 989.5, fp8: 1979 } },
  // H100 PCIe: HBM2e at 2,000 GB/s and 114 SMs, against the SXM's HBM3 at 3,350 and 132 (PCIe product brief).
  { id: "h100pcie-80", name: "H100 PCIe 80GB", vramGiB: 80, visibleGiB: 79.15, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 2000, tflops: { bf16: 756, fp8: 1513 } },
  { id: "h200-141", name: "H200 141GB", vramGiB: 141, visibleGiB: 139.76, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 4800, tflops: { bf16: 989.5, fp8: 1979 } },
  { id: "b200-192", name: "B200 180GB", vramGiB: 180, visibleGiB: 178.35, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 7700, tflops: { bf16: 2250, fp8: 4500, fp4: 9000 } },
  { id: "gh200-96", name: "GH200 96GB", vramGiB: 96, visibleGiB: 94.5, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 4000, tflops: { bf16: 990, fp8: 1979 } },
  { id: "h100nvl-94", name: "H100 NVL 94GB", vramGiB: 94, visibleGiB: 93.09, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 3938, tflops: { bf16: 835.5, fp8: 1670.5 } },
  { id: "rtxpro6000-96", name: "RTX PRO 6000 Blackwell", vramGiB: 96, visibleGiB: 94.97, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 1792, tflops: { bf16: 500, fp8: 1000, fp4: 2000 } },
  // Server Edition: the same GB202 and 96 GB of GDDR7, clocked to 1,597 GB/s (server product brief).
  { id: "rtxpro6000s-96", name: "RTX PRO 6000 Blackwell Server", vramGiB: 96, visibleGiB: 94.97, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 1597, tflops: { bf16: 500, fp8: 1000, fp4: 2000 } },
  { id: "b300-288", name: "B300 (Blackwell Ultra) 270GB", vramGiB: 270, visibleGiB: 267.69, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 7700, tflops: { bf16: 2250, fp8: 4500, fp4: 13500 } },

  // AMD
  { id: "mi210-64", name: "AMD MI210", vramGiB: 64, category: "datacenter", vendor: "AMD", bandwidthGBs: 1638, tflops: { bf16: 181 } },
  { id: "mi300x-192", name: "AMD MI300X", vramGiB: 192, visibleGiB: 191.98, category: "datacenter", vendor: "AMD", bandwidthGBs: 5300, tflops: { bf16: 1307.4, fp8: 2614.9 } },
  { id: "mi325x-256", name: "AMD MI325X", vramGiB: 256, visibleGiB: 255.98, category: "datacenter", vendor: "AMD", bandwidthGBs: 6000, tflops: { bf16: 1307.4, fp8: 2614.9 } },
  { id: "mi355x-288", name: "AMD MI355X", vramGiB: 288, visibleGiB: 287.98, category: "datacenter", vendor: "AMD", bandwidthGBs: 8000, tflops: { bf16: 2516.6, fp8: 5033.2, fp4: 10066.3 } },

  // Apple Silicon — unified memory (shared CPU/GPU). vramGiB is the share the GPU can
  // address by default (Metal's recommendedMaxWorkingSetSize, as llama.cpp logs it):
  // ~75% from 36 GB up, two-thirds below; totalGiB is the full pool. Raise the cap
  // via iogpu.wired_limit_mb. Logs per device: docs/gpu-specs.md.
  { id: "apple-m4-32", name: "Apple M4", vramGiB: 21.3, totalGiB: 32, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 120, note: "Unified memory; ~2/3 usable by the GPU by default on a Mac under 36 GB" },
  { id: "apple-m4pro-48", name: "Apple M4 Pro", vramGiB: 36, totalGiB: 48, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 273, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m4max-64", name: "Apple M4 Max (64GB)", vramGiB: 48, totalGiB: 64, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 546, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m4max-128", name: "Apple M4 Max (128GB)", vramGiB: 96, totalGiB: 128, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 546, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m2ultra-192", name: "Apple M2 Ultra", vramGiB: 144, totalGiB: 192, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 800, tflops: { bf16: 27.2 }, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m3ultra-256", name: "Apple M3 Ultra (256GB)", vramGiB: 192, totalGiB: 256, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 819, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m3ultra-512", name: "Apple M3 Ultra (512GB)", vramGiB: 384, totalGiB: 512, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 819, note: "Unified memory; ~75% usable by the GPU by default" },

  // Unified-memory AI PCs / APUs — system RAM assigned to the SoC's GPU. Strix Halo's
  // speed constants are measured on GTR9 with vLLM's ROCm build (0.20.1, --enforce-eager,
  // which gfx1151 needs): 0.36 ms per layer per step, 34% of the rated tensor peak
  // (scripts/fixtures/vllm/calib-strixhalo-2026-10-17.json).
  { id: "amd-strixhalo-64", name: "AMD Ryzen AI Max+ 395 (64GB)", vramGiB: 48, totalGiB: 64, category: "apu", vendor: "AMD", unified: true, bandwidthGBs: 256, tflops: { bf16: 60 }, computeEfficiency: 0.34, layerMs: 0.36, note: "Strix Halo · LPDDR5X; ~75% to the iGPU via Variable Graphics Memory" },
  { id: "amd-strixhalo-128", name: "AMD Ryzen AI Max+ 395 (128GB)", vramGiB: 96, totalGiB: 128, category: "apu", vendor: "AMD", unified: true, bandwidthGBs: 256, tflops: { bf16: 60 }, computeEfficiency: 0.34, layerMs: 0.36, note: "Strix Halo · LPDDR5X; up to 96 GB to the iGPU (Variable Graphics Memory)" },
  { id: "nv-dgxspark-128", name: "NVIDIA DGX Spark (GB10)", vramGiB: 120, visibleGiB: 121.63, totalGiB: 128, category: "apu", vendor: "NVIDIA", unified: true, bandwidthGBs: 273, tflops: { bf16: 125, fp8: 250, fp4: 500 }, note: "Grace-Blackwell GB10 · LPDDR5X; full pool shared CPU/GPU; vLLM is commonly run at --gpu-memory-utilization 0.8 here" },
  { id: "nv-jetson-orin-64", name: "NVIDIA Jetson AGX Orin (64GB)", vramGiB: 56, totalGiB: 64, category: "apu", vendor: "NVIDIA", unified: true, bandwidthGBs: 204, tflops: { bf16: 42.5 }, note: "Edge module · unified LPDDR5" },
];

/** vLLM ships CUDA and ROCm backends but nothing for Metal, so Apple Silicon
 * cannot serve with it. The memory maths still applies everywhere — only the
 * command builder has to exclude these devices. */
export function runsVllm(g: Gpu): boolean {
  return g.vendor !== "Apple" && !g.noVllm;
}

/** Display order of the hardware tiers. Kept here so every picker stays in
 * step — the vLLM page once drifted out of sync and silently hid a tier. */
export const GPU_CATEGORIES: readonly GpuCategory[] = [
  "consumer",
  "workstation",
  "datacenter",
  "apple",
  "apu",
];

export const CATEGORY_LABELS: Record<GpuCategory, string> = {
  consumer: "Consumer",
  workstation: "Workstation",
  datacenter: "Data center",
  apple: "Apple",
  apu: "AI PC (unified)",
};

// Multi-Instance GPU (MIG) profiles per GPU. A MIG instance gets an isolated
// slice of memory (memGiB) and compute. Source: NVIDIA MIG User Guide.
// (+me media-engine variants are omitted — same memory as the base profile.)
export interface MigProfile {
  id: string; // e.g. "1g.10gb"
  memGiB: number; // memory per instance
  max: number; // max instances of this profile on one GPU
}

export const MIG_PROFILES: Record<string, MigProfile[]> = {
  "a30-24": [
    { id: "1g.6gb", memGiB: 6, max: 4 },
    { id: "2g.12gb", memGiB: 12, max: 2 },
    { id: "4g.24gb", memGiB: 24, max: 1 },
  ],
  "a100-40": [
    { id: "1g.5gb", memGiB: 5, max: 7 },
    { id: "1g.10gb", memGiB: 10, max: 4 },
    { id: "2g.10gb", memGiB: 10, max: 3 },
    { id: "3g.20gb", memGiB: 20, max: 2 },
    { id: "4g.20gb", memGiB: 20, max: 1 },
    { id: "7g.40gb", memGiB: 40, max: 1 },
  ],
  "a100-80": [
    { id: "1g.10gb", memGiB: 10, max: 7 },
    { id: "1g.20gb", memGiB: 20, max: 4 },
    { id: "2g.20gb", memGiB: 20, max: 3 },
    { id: "3g.40gb", memGiB: 40, max: 2 },
    { id: "4g.40gb", memGiB: 40, max: 1 },
    { id: "7g.80gb", memGiB: 80, max: 1 },
  ],
  "h100-80": [
    { id: "1g.10gb", memGiB: 10, max: 7 },
    { id: "1g.20gb", memGiB: 20, max: 4 },
    { id: "2g.20gb", memGiB: 20, max: 3 },
    { id: "3g.40gb", memGiB: 40, max: 2 },
    { id: "4g.40gb", memGiB: 40, max: 1 },
    { id: "7g.80gb", memGiB: 80, max: 1 },
  ],

  "h100pcie-80": [
    { id: "1g.10gb", memGiB: 10, max: 7 },
    { id: "1g.20gb", memGiB: 20, max: 4 },
    { id: "2g.20gb", memGiB: 20, max: 3 },
    { id: "3g.40gb", memGiB: 40, max: 2 },
    { id: "4g.40gb", memGiB: 40, max: 1 },
    { id: "7g.80gb", memGiB: 80, max: 1 },
  ],
  "h200-141": [
    { id: "1g.18gb", memGiB: 18, max: 7 },
    { id: "1g.35gb", memGiB: 35, max: 4 },
    { id: "2g.35gb", memGiB: 35, max: 3 },
    { id: "3g.71gb", memGiB: 71, max: 2 },
    { id: "4g.71gb", memGiB: 71, max: 1 },
    { id: "7g.141gb", memGiB: 141, max: 1 },
  ],
  "gh200-96": [
    { id: "1g.12gb", memGiB: 12, max: 7 },
    { id: "1g.24gb", memGiB: 24, max: 4 },
    { id: "2g.24gb", memGiB: 24, max: 3 },
    { id: "3g.48gb", memGiB: 48, max: 2 },
    { id: "4g.48gb", memGiB: 48, max: 1 },
    { id: "7g.96gb", memGiB: 96, max: 1 },
  ],
  "b200-192": [
    { id: "1g.23gb", memGiB: 23, max: 7 },
    { id: "1g.45gb", memGiB: 45, max: 4 },
    { id: "2g.45gb", memGiB: 45, max: 3 },
    { id: "3g.90gb", memGiB: 90, max: 2 },
    { id: "4g.90gb", memGiB: 90, max: 1 },
    { id: "7g.180gb", memGiB: 180, max: 1 },
  ],
  // RTX PRO 6000 Blackwell (96GB) supports up to 4 MIG instances.
  "rtxpro6000-96": [
    { id: "1g.24gb", memGiB: 24, max: 4 },
    { id: "2g.48gb", memGiB: 48, max: 2 },
    { id: "4g.96gb", memGiB: 96, max: 1 },
  ],
  "rtxpro6000s-96": [
    { id: "1g.24gb", memGiB: 24, max: 4 },
    { id: "2g.48gb", memGiB: 48, max: 2 },
    { id: "4g.96gb", memGiB: 96, max: 1 },
  ],
};

/** Fraction of a discrete board's nominal VRAM a training job can use, after the
 *  CUDA context and the driver's reserve (the fine-tuning page). */
export const DRIVER_RESERVE = 0.95;

/**
 * Memory budget (GiB) a model may actually occupy. A selected MIG slice wins; a
 * Mac keeps its Metal share in vramGiB; every other device gets `share` of the
 * memory its runtime reports: for serving, vLLM's --gpu-memory-utilization (0.92
 * by default, overhead.ts), whose remainder holds the CUDA context.
 */
export function usableGiB(g: Gpu, migId?: string, share: number = VLLM_UTIL): number {
  const slice = migId ? migMem(g.id, migId) : null;
  if (slice) return slice * share;
  // A Mac's share is Metal's working set; vLLM does not run there.
  if (g.unified && g.vendor === "Apple") return g.vramGiB;
  // vLLM multiplies what the runtime reports, unified memory included: 96 GiB on
  // Strix Halo gives 88.3, DGX Spark's 121.6 gives 111.9.
  return (g.visibleGiB ?? g.vramGiB) * share;
}

/** The share of its rated tensor peak a device reaches serving (perf.ts): measured
 *  on a GeForce card, which runs above its rated clock, and on Strix Halo; estimated
 *  for the rest. */
export function computeEfficiency(g: Gpu): number {
  if (g.computeEfficiency) return g.computeEfficiency;
  return g.category === "consumer" && g.vendor === "NVIDIA" ? CONSUMER_COMPUTE_EFFICIENCY : COMPUTE_EFFICIENCY;
}

/** The batch `vllm serve` profiles with on this device by default (overhead.ts). */
export function batchFor(g: Gpu, migId?: string): BatchShape {
  const slice = migId ? migMem(g.id, migId) : null;
  return vllmBatch(slice ?? g.totalGiB ?? g.vramGiB, g.name);
}

/** What a deployment needs on one of these devices: the overhead follows the
 *  batch vLLM profiles with there, so the figure differs by device. */
export function needOn(input: Omit<CalcInput, "batch" | "gpus">, g: Gpu): number {
  return calculate({ ...input, batch: batchFor(g) }).totalGiB;
}

/** The fewest of these devices that serve the deployment, laid out as the
 *  calculator lays it out (calc.ts, layoutFor: tensor parallel, pipeline stages,
 *  replicas, expert parallelism); null when no count does. */
export function cardsFor(input: Omit<CalcInput, "batch" | "gpus">, g: Gpu, share: number = VLLM_UTIL): number | null {
  return layoutFor({ ...input, batch: batchFor(g) }, usableGiB(g, undefined, share))?.gpus ?? null;
}

export function migProfilesFor(gpuId: string): MigProfile[] {
  return MIG_PROFILES[gpuId] ?? [];
}

export function migMem(gpuId: string, migId: string): number | null {
  const p = (MIG_PROFILES[gpuId] ?? []).find((x) => x.id === migId);
  return p ? p.memGiB : null;
}

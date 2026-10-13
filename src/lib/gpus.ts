import { calculate, gpusNeeded, type CalcInput } from "./calc.ts";
import type { Tflops } from "./perf.ts";
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
  /** Dense tensor throughput from the vendor's datasheet, TFLOPS (perf.ts). */
  tflops?: Tflops;
  note?: string;
}

export const GPUS: Gpu[] = [
  // Consumer NVIDIA
  { id: "rtx3060-12", name: "RTX 3060", vramGiB: 12, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 360, tflops: { bf16: 25.5 } },
  { id: "rtx4060ti-16", name: "RTX 4060 Ti 16GB", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 288, tflops: { bf16: 44.1, fp8: 88.3 } },
  { id: "rtx4070ti-s-16", name: "RTX 4070 Ti Super", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 672, tflops: { bf16: 88.3, fp8: 176.5 } },
  { id: "rtx4080-16", name: "RTX 4080 / Super", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 717, tflops: { bf16: 104.5, fp8: 209 } },
  { id: "rtx3090-24", name: "RTX 3090 / Ti", vramGiB: 24, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 936, tflops: { bf16: 71 } },
  { id: "rtx4090-24", name: "RTX 4090", vramGiB: 24, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 1008, tflops: { bf16: 165.2, fp8: 330.3 } },
  { id: "rtx5070ti-16", name: "RTX 5070 Ti", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 896, tflops: { bf16: 87.9, fp8: 175.8, fp4: 703 } },
  { id: "rtx5080-16", name: "RTX 5080", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 960, tflops: { bf16: 112.6, fp8: 225.1, fp4: 900.4 } },
  { id: "rx7900xtx-24", name: "AMD RX 7900 XTX", vramGiB: 24, category: "consumer", vendor: "AMD", bandwidthGBs: 960, tflops: { bf16: 123 } },
  { id: "rtx5090-32", name: "RTX 5090", vramGiB: 32, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 1792, tflops: { bf16: 209.5, fp8: 419, fp4: 1676 } },

  // Workstation / pro
  { id: "l4-24", name: "NVIDIA L4", vramGiB: 24, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 300, tflops: { bf16: 121, fp8: 242.5 } },
  { id: "a5000-24", name: "RTX A5000", vramGiB: 24, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 768, tflops: { bf16: 111.1 } },
  { id: "a6000-48", name: "RTX A6000", vramGiB: 48, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 768, tflops: { bf16: 154.8 } },
  { id: "rtx6000ada-48", name: "RTX 6000 Ada", vramGiB: 48, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 960, tflops: { bf16: 364.25, fp8: 728.5 } },
  { id: "l40s-48", name: "NVIDIA L40S", vramGiB: 48, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 864, tflops: { bf16: 362.05, fp8: 733 } },
  { id: "rtxpro5000-72", name: "RTX PRO 5000 Blackwell (72GB)", vramGiB: 72, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 1344, tflops: { bf16: 258, fp8: 516, fp4: 1032 } },

  // Datacenter
  { id: "t4-16", name: "NVIDIA T4", vramGiB: 16, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 320, tflops: { bf16: 65 } },
  { id: "v100-32", name: "Tesla V100 32GB", vramGiB: 32, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 900, tflops: { bf16: 125 } },
  { id: "a30-24", name: "NVIDIA A30", vramGiB: 24, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 933, tflops: { bf16: 165 } },
  { id: "a100-40", name: "A100 40GB", vramGiB: 40, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 1555, tflops: { bf16: 312 } },
  { id: "a100-80", name: "A100 80GB", vramGiB: 80, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 2039, tflops: { bf16: 312 } },
  { id: "h100-80", name: "H100 (SXM/PCIe) 80GB", vramGiB: 80, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 3350, tflops: { bf16: 989.5, fp8: 1979 } },
  { id: "h200-141", name: "H200 141GB", vramGiB: 141, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 4800, tflops: { bf16: 989.5, fp8: 1979 } },
  { id: "b200-192", name: "B200 192GB", vramGiB: 192, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 8000, tflops: { bf16: 2250, fp8: 4500, fp4: 9000 } },
  { id: "gh200-96", name: "GH200 96GB", vramGiB: 96, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 4000, tflops: { bf16: 990, fp8: 1979 } },
  { id: "h100nvl-94", name: "H100 NVL 94GB", vramGiB: 94, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 3938, tflops: { bf16: 835.5, fp8: 1670.5 } },
  { id: "rtxpro6000-96", name: "RTX PRO 6000 Blackwell", vramGiB: 96, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 1792, tflops: { bf16: 500, fp8: 1000, fp4: 2000 } },
  { id: "b300-288", name: "B300 (Blackwell Ultra) 288GB", vramGiB: 288, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 8000, tflops: { bf16: 2250, fp8: 4500, fp4: 13500 } },

  // AMD
  { id: "mi210-64", name: "AMD MI210", vramGiB: 64, category: "datacenter", vendor: "AMD", bandwidthGBs: 1638, tflops: { bf16: 181 } },
  { id: "mi300x-192", name: "AMD MI300X", vramGiB: 192, category: "datacenter", vendor: "AMD", bandwidthGBs: 5300, tflops: { bf16: 1307.4, fp8: 2614.9 } },
  { id: "mi325x-256", name: "AMD MI325X", vramGiB: 256, category: "datacenter", vendor: "AMD", bandwidthGBs: 6000, tflops: { bf16: 1307.4, fp8: 2614.9 } },
  { id: "mi355x-288", name: "AMD MI355X", vramGiB: 288, category: "datacenter", vendor: "AMD", bandwidthGBs: 8000, tflops: { bf16: 2516.6, fp8: 5033.2, fp4: 10066.3 } },

  // Apple Silicon — unified memory (shared CPU/GPU). vramGiB is the ~75% the GPU can
  // address by default; totalGiB is the full pool. Raise the cap via iogpu.wired_limit_mb.
  { id: "apple-m4-32", name: "Apple M4", vramGiB: 24, totalGiB: 32, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 120, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m4pro-48", name: "Apple M4 Pro", vramGiB: 36, totalGiB: 48, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 273, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m4max-64", name: "Apple M4 Max (64GB)", vramGiB: 48, totalGiB: 64, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 410, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m4max-128", name: "Apple M4 Max (128GB)", vramGiB: 96, totalGiB: 128, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 546, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m2ultra-192", name: "Apple M2 Ultra", vramGiB: 144, totalGiB: 192, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 800, tflops: { bf16: 27.2 }, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m3ultra-256", name: "Apple M3 Ultra (256GB)", vramGiB: 192, totalGiB: 256, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 819, note: "Unified memory; ~75% usable by the GPU by default" },
  { id: "apple-m3ultra-512", name: "Apple M3 Ultra (512GB)", vramGiB: 384, totalGiB: 512, category: "apple", vendor: "Apple", unified: true, bandwidthGBs: 819, note: "Unified memory; ~75% usable by the GPU by default" },

  // Unified-memory AI PCs / APUs — system RAM assigned to the SoC's GPU.
  { id: "amd-strixhalo-64", name: "AMD Ryzen AI Max+ 395 (64GB)", vramGiB: 48, totalGiB: 64, category: "apu", vendor: "AMD", unified: true, bandwidthGBs: 256, tflops: { bf16: 60 }, note: "Strix Halo · LPDDR5X; ~75% to the iGPU via Variable Graphics Memory" },
  { id: "amd-strixhalo-128", name: "AMD Ryzen AI Max+ 395 (128GB)", vramGiB: 96, totalGiB: 128, category: "apu", vendor: "AMD", unified: true, bandwidthGBs: 256, tflops: { bf16: 60 }, note: "Strix Halo · LPDDR5X; up to 96 GB to the iGPU (Variable Graphics Memory)" },
  { id: "nv-dgxspark-128", name: "NVIDIA DGX Spark (GB10)", vramGiB: 120, totalGiB: 128, category: "apu", vendor: "NVIDIA", unified: true, bandwidthGBs: 273, tflops: { bf16: 125, fp8: 250, fp4: 500 }, note: "Grace-Blackwell GB10 · LPDDR5X; full pool shared CPU/GPU" },
  { id: "nv-jetson-orin-64", name: "NVIDIA Jetson AGX Orin (64GB)", vramGiB: 56, totalGiB: 64, category: "apu", vendor: "NVIDIA", unified: true, bandwidthGBs: 204, tflops: { bf16: 42.5 }, note: "Edge module · unified LPDDR5" },
];

/** vLLM ships CUDA and ROCm backends but nothing for Metal, so Apple Silicon
 * cannot serve with it. The memory maths still applies everywhere — only the
 * command builder has to exclude these devices. */
export function runsVllm(g: Gpu): boolean {
  return g.vendor !== "Apple";
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
};

/** Fraction of a discrete board's nominal VRAM a training job can use, after the
 *  CUDA context and the driver's reserve (the fine-tuning page). */
export const DRIVER_RESERVE = 0.95;

/**
 * Memory budget (GiB) a model may actually occupy. A selected MIG slice wins; a
 * unified-memory device already stores its usable slice in vramGiB; a discrete
 * board gets `share` of its memory: for serving, vLLM's --gpu-memory-utilization
 * (0.92 by default, overhead.ts), whose remainder holds the CUDA context.
 */
export function usableGiB(g: Gpu, migId?: string, share: number = VLLM_UTIL): number {
  const slice = migId ? migMem(g.id, migId) : null;
  if (slice) return slice * share;
  if (g.unified) return g.vramGiB;
  return g.vramGiB * share;
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

/** How many of these devices hold the deployment, the overhead repeated on each and
 *  the count one vLLM can split the heads across; null when none up to 64 does. */
export function cardsFor(input: Omit<CalcInput, "batch" | "gpus">, g: Gpu, share: number = VLLM_UTIL): number | null {
  return gpusNeeded({ ...input, batch: batchFor(g) }, usableGiB(g, undefined, share));
}

export function migProfilesFor(gpuId: string): MigProfile[] {
  return MIG_PROFILES[gpuId] ?? [];
}

export function migMem(gpuId: string, migId: string): number | null {
  const p = (MIG_PROFILES[gpuId] ?? []).find((x) => x.id === migId);
  return p ? p.memGiB : null;
}

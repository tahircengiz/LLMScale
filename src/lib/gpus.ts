// Curated GPU database. `vramGiB` is the nominal on-board memory treated as GiB.

export type GpuCategory = "consumer" | "workstation" | "datacenter" | "apple";

export interface Gpu {
  id: string;
  name: string;
  vramGiB: number;
  category: GpuCategory;
  vendor: "NVIDIA" | "AMD" | "Apple" | "Intel";
  /** Memory bandwidth in GB/s (informational). */
  bandwidthGBs?: number;
  note?: string;
}

export const GPUS: Gpu[] = [
  // Consumer NVIDIA
  { id: "rtx3060-12", name: "RTX 3060", vramGiB: 12, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 360 },
  { id: "rtx4060ti-16", name: "RTX 4060 Ti 16GB", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 288 },
  { id: "rtx4070ti-s-16", name: "RTX 4070 Ti Super", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 672 },
  { id: "rtx4080-16", name: "RTX 4080 / Super", vramGiB: 16, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 717 },
  { id: "rtx3090-24", name: "RTX 3090 / Ti", vramGiB: 24, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 936 },
  { id: "rtx4090-24", name: "RTX 4090", vramGiB: 24, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 1008 },
  { id: "rtx5090-32", name: "RTX 5090", vramGiB: 32, category: "consumer", vendor: "NVIDIA", bandwidthGBs: 1792 },

  // Workstation / pro
  { id: "l4-24", name: "NVIDIA L4", vramGiB: 24, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 300 },
  { id: "a5000-24", name: "RTX A5000", vramGiB: 24, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 768 },
  { id: "a6000-48", name: "RTX A6000", vramGiB: 48, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 768 },
  { id: "rtx6000ada-48", name: "RTX 6000 Ada", vramGiB: 48, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 960 },
  { id: "l40s-48", name: "NVIDIA L40S", vramGiB: 48, category: "workstation", vendor: "NVIDIA", bandwidthGBs: 864 },

  // Datacenter
  { id: "t4-16", name: "NVIDIA T4", vramGiB: 16, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 320 },
  { id: "v100-32", name: "Tesla V100 32GB", vramGiB: 32, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 900 },
  { id: "a30-24", name: "NVIDIA A30", vramGiB: 24, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 933 },
  { id: "a100-40", name: "A100 40GB", vramGiB: 40, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 1555 },
  { id: "a100-80", name: "A100 80GB", vramGiB: 80, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 2039 },
  { id: "h100-80", name: "H100 (SXM/PCIe) 80GB", vramGiB: 80, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 3350 },
  { id: "h200-141", name: "H200 141GB", vramGiB: 141, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 4800 },
  { id: "b200-192", name: "B200 192GB", vramGiB: 192, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 8000 },
  { id: "gh200-96", name: "GH200 96GB", vramGiB: 96, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 4000 },

  // AMD
  { id: "mi210-64", name: "AMD MI210", vramGiB: 64, category: "datacenter", vendor: "AMD", bandwidthGBs: 1638 },
  { id: "mi300x-192", name: "AMD MI300X", vramGiB: 192, category: "datacenter", vendor: "AMD", bandwidthGBs: 5300 },

  // Apple unified memory (shared CPU/GPU). Treated as available VRAM budget.
  { id: "apple-m-32", name: "Apple Silicon 32GB (unified)", vramGiB: 32, category: "apple", vendor: "Apple", note: "Unified memory shared with the OS" },
  { id: "apple-m-64", name: "Apple Silicon 64GB (unified)", vramGiB: 64, category: "apple", vendor: "Apple", note: "Unified memory shared with the OS" },
  { id: "apple-m-128", name: "Apple Silicon 128GB (unified)", vramGiB: 128, category: "apple", vendor: "Apple", note: "Unified memory shared with the OS" },
  { id: "apple-m-192", name: "Apple Silicon 192GB (unified)", vramGiB: 192, category: "apple", vendor: "Apple", note: "Unified memory shared with the OS" },
];

export const CATEGORY_LABELS: Record<GpuCategory, string> = {
  consumer: "Consumer",
  workstation: "Workstation",
  datacenter: "Data center",
  apple: "Apple",
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
};

export function migProfilesFor(gpuId: string): MigProfile[] {
  return MIG_PROFILES[gpuId] ?? [];
}

export function migMem(gpuId: string, migId: string): number | null {
  const p = (MIG_PROFILES[gpuId] ?? []).find((x) => x.id === migId);
  return p ? p.memGiB : null;
}

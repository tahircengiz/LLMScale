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

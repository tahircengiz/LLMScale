// Datasheet facts the sizing engine does not use but a side-by-side comparison
// shows (gpu-compare.html): what a device is built from and how it connects.
// Kept apart from gpus.ts so the engine's database stays the few numbers it
// computes with. Sources and confidence per field: docs/gpu-specs.md. A field
// is left out rather than guessed; the page shows "—" for it.

export interface GpuSpec {
  /** Architecture as the vendor names it, e.g. "Hopper", "RDNA 3.5". */
  arch?: string;
  /** Die or SoC, e.g. "GH100", "Strix Halo". */
  chip?: string;
  /** Manufacturing node, e.g. "TSMC 4N". */
  process?: string;
  /** Shader cores, counted in the vendor's own unit (coreUnit); coresAlt when
   *  the entry covers two bins, e.g. a 16- or 20-core M4 Pro. */
  cores?: number;
  coresAlt?: number;
  /** CUDA cores, stream processors, compute units or Apple GPU cores. */
  coreUnit?: "cuda" | "sp" | "cu" | "gpu";
  /** Memory technology, e.g. "HBM3", "GDDR7", "LPDDR5X-8000". */
  memType?: string;
  /** Memory interface width, bits. */
  busBits?: number;
  /** The vendor's maximum board, module or package power, watts; a range up to
   *  powerMaxW where the maker configures it. "cpu": the figure includes the CPU
   *  (a superchip or SoC); "mac": the whole Mac at the wall, Apple's only figure. */
  powerW?: number;
  powerMaxW?: number;
  powerScope?: "cpu" | "mac";
  /** Form factor and host link, e.g. "SXM5", "PCIe 5.0 x16 card". */
  host?: string;
  /** How two of them connect, with the bandwidth, e.g. "NVLink 4 · 900 GB/s";
   *  "none" when they only meet over PCIe. */
  link?: string;
  /** Launch, "YYYY-MM". */
  launch?: string;
}

export const GPU_SPECS: Record<string, GpuSpec> = {
  "rtx3060-12": { arch: "Ampere", chip: "GA106", process: "Samsung 8N", cores: 3584, coreUnit: "cuda", memType: "GDDR6", busBits: 192, powerW: 170, host: "PCIe 4.0 x16", link: "none", launch: "2021-02" },
  "rtx4060ti-16": { arch: "Ada Lovelace", chip: "AD106", process: "TSMC 4N", cores: 4352, coreUnit: "cuda", memType: "GDDR6", busBits: 128, powerW: 165, host: "PCIe 4.0 x8", link: "none", launch: "2023-07" },
  "rtx4070ti-s-16": { arch: "Ada Lovelace", chip: "AD103", process: "TSMC 4N", cores: 8448, coreUnit: "cuda", memType: "GDDR6X", busBits: 256, powerW: 285, host: "PCIe 4.0 x16", link: "none", launch: "2024-01" },
  "rtx4080-16": { arch: "Ada Lovelace", chip: "AD103", process: "TSMC 4N", cores: 9728, coreUnit: "cuda", memType: "GDDR6X", busBits: 256, powerW: 320, host: "PCIe 4.0 x16", link: "none", launch: "2022-11" },
  "rtx3090-24": { arch: "Ampere", chip: "GA102", process: "Samsung 8N", cores: 10496, coreUnit: "cuda", memType: "GDDR6X", busBits: 384, powerW: 350, host: "PCIe 4.0 x16", link: "NVLink 3 bridge · 112.5 GB/s", launch: "2020-09" },
  "rtx4090-24": { arch: "Ada Lovelace", chip: "AD102", process: "TSMC 4N", cores: 16384, coreUnit: "cuda", memType: "GDDR6X", busBits: 384, powerW: 450, host: "PCIe 4.0 x16", link: "none", launch: "2022-10" },
  "rtx5070ti-16": { arch: "Blackwell", chip: "GB203", process: "TSMC 4N", cores: 8960, coreUnit: "cuda", memType: "GDDR7", busBits: 256, powerW: 300, host: "PCIe 5.0 x16", link: "none", launch: "2025-02" },
  "rtx5080-16": { arch: "Blackwell", chip: "GB203", process: "TSMC 4N", cores: 10752, coreUnit: "cuda", memType: "GDDR7", busBits: 256, powerW: 360, host: "PCIe 5.0 x16", link: "none", launch: "2025-01" },
  "rx7900xtx-24": { arch: "RDNA 3", chip: "Navi 31", process: "TSMC 5 nm + 6 nm", cores: 6144, coreUnit: "sp", memType: "GDDR6", busBits: 384, powerW: 355, host: "PCIe 4.0 x16", link: "none", launch: "2022-12" },
  "rtx5090-32": { arch: "Blackwell", chip: "GB202", process: "TSMC 4N", cores: 21760, coreUnit: "cuda", memType: "GDDR7", busBits: 512, powerW: 575, host: "PCIe 5.0 x16", link: "none", launch: "2025-01" },
  "l4-24": { arch: "Ada Lovelace", chip: "AD104", process: "TSMC 4N", cores: 7424, coreUnit: "cuda", memType: "GDDR6", busBits: 192, powerW: 72, host: "PCIe 4.0 x16", link: "none", launch: "2023-03" },
  "a5000-24": { arch: "Ampere", chip: "GA102", process: "Samsung 8N", cores: 8192, coreUnit: "cuda", memType: "GDDR6", busBits: 384, powerW: 230, host: "PCIe 4.0 x16", link: "NVLink 3 bridge · 112.5 GB/s", launch: "2021-04" },
  "a6000-48": { arch: "Ampere", chip: "GA102", process: "Samsung 8N", cores: 10752, coreUnit: "cuda", memType: "GDDR6", busBits: 384, powerW: 300, host: "PCIe 4.0 x16", link: "NVLink 3 bridge · 112.5 GB/s", launch: "2020-12" },
  "rtx6000ada-48": { arch: "Ada Lovelace", chip: "AD102", process: "TSMC 4N", cores: 18176, coreUnit: "cuda", memType: "GDDR6", busBits: 384, powerW: 300, host: "PCIe 4.0 x16", link: "none", launch: "2022-12" },
  "l40s-48": { arch: "Ada Lovelace", process: "TSMC 4N", cores: 18176, coreUnit: "cuda", memType: "GDDR6", powerW: 350, host: "PCIe 4.0 x16", link: "none", launch: "2023-08" },
  "rtxpro5000-72": { arch: "Blackwell", chip: "GB202", process: "TSMC 4N", cores: 14080, coreUnit: "cuda", memType: "GDDR7", busBits: 384, powerW: 300, host: "PCIe 5.0 x16", link: "none", launch: "2025-12" },
  "t4-16": { arch: "Turing", chip: "TU104", process: "TSMC 12 nm", cores: 2560, coreUnit: "cuda", memType: "GDDR6", busBits: 256, powerW: 70, host: "PCIe 3.0 x16", link: "none", launch: "2018-09" },
  "v100-32": { arch: "Volta", chip: "GV100", process: "TSMC 12 nm", cores: 5120, coreUnit: "cuda", memType: "HBM2", busBits: 4096, powerW: 300, host: "SXM2 / PCIe 3.0 x16", link: "NVLink 2 · 300 GB/s", launch: "2018-03" },
  "a30-24": { arch: "Ampere", chip: "GA100", process: "TSMC 7 nm", cores: 3584, coreUnit: "cuda", memType: "HBM2", busBits: 3072, powerW: 165, host: "PCIe 4.0 x16", link: "NVLink 3 bridge · 200 GB/s", launch: "2021-04" },
  "a100-40": { arch: "Ampere", chip: "GA100", process: "TSMC 7 nm", cores: 6912, coreUnit: "cuda", memType: "HBM2", busBits: 5120, powerW: 400, host: "SXM4 / PCIe 4.0 x16", link: "NVLink 3 · 600 GB/s", launch: "2020-05" },
  "a100-80": { arch: "Ampere", chip: "GA100", process: "TSMC 7 nm", cores: 6912, coreUnit: "cuda", memType: "HBM2e", busBits: 5120, powerW: 400, host: "SXM4", link: "NVLink 3 · 600 GB/s", launch: "2020-11" },
  "h100-80": { arch: "Hopper", chip: "GH100", process: "TSMC 4N", cores: 16896, coreUnit: "cuda", memType: "HBM3", busBits: 5120, powerW: 700, host: "SXM5", link: "NVLink 4 · 900 GB/s", launch: "2022-03" },
  "h100pcie-80": { arch: "Hopper", chip: "GH100", process: "TSMC 4N", cores: 14592, coreUnit: "cuda", memType: "HBM2e", busBits: 5120, powerW: 350, host: "PCIe 5.0 x16", link: "NVLink bridge · 600 GB/s", launch: "2022-03" },
  "h200-141": { arch: "Hopper", chip: "GH100", process: "TSMC 4N", memType: "HBM3e", powerW: 700, host: "SXM5", link: "NVLink 4 · 900 GB/s", launch: "2023-11" },
  "b200-192": { arch: "Blackwell", chip: "GB100", process: "TSMC 4NP", cores: 18944, coreUnit: "cuda", memType: "HBM3e", busBits: 8192, powerW: 1000, host: "SXM · HGX B200", link: "NVLink 5 · 1,800 GB/s", launch: "2024-03" },
  "gh200-96": { arch: "Hopper + Grace", chip: "GH100", process: "TSMC 4N", memType: "HBM3", powerW: 1000, powerScope: "cpu", host: "Superchip module", link: "NVLink 4 · 900 GB/s", launch: "2023-05" },
  "h100nvl-94": { arch: "Hopper", chip: "GH100", process: "TSMC 4N", memType: "HBM3", busBits: 6016, powerW: 400, host: "PCIe 5.0 x16", link: "NVLink 4 bridge · 600 GB/s", launch: "2023-03" },
  "rtxpro6000-96": { arch: "Blackwell", chip: "GB202", process: "TSMC 4N", cores: 24064, coreUnit: "cuda", memType: "GDDR7", busBits: 512, powerW: 600, host: "PCIe 5.0 x16", link: "none", launch: "2025-03" },
  "rtxpro6000s-96": { arch: "Blackwell", chip: "GB202", process: "TSMC 4N", cores: 24064, coreUnit: "cuda", memType: "GDDR7", busBits: 512, powerW: 600, host: "PCIe 5.0 x16, passive", link: "none", launch: "2025-03" },
  "b300-288": { arch: "Blackwell Ultra", chip: "GB110", process: "TSMC 4NP", memType: "HBM3e", busBits: 8192, powerW: 1100, host: "SXM · HGX B300", link: "NVLink 5 · 1,800 GB/s", launch: "2025-03" },
  "mi210-64": { arch: "CDNA 2", chip: "Aldebaran", process: "TSMC 6 nm", cores: 6656, coreUnit: "sp", memType: "HBM2e", busBits: 4096, powerW: 300, host: "PCIe 4.0 x16", link: "Infinity Fabric · 300 GB/s", launch: "2022-03" },
  "mi300x-192": { arch: "CDNA 3", chip: "Aqua Vanjaram", process: "TSMC 5 nm + 6 nm", cores: 19456, coreUnit: "sp", memType: "HBM3", busBits: 8192, powerW: 750, host: "OAM", link: "Infinity Fabric · 896 GB/s", launch: "2023-12" },
  "mi325x-256": { arch: "CDNA 3", chip: "Aqua Vanjaram", process: "TSMC 5 nm + 6 nm", cores: 19456, coreUnit: "sp", memType: "HBM3e", busBits: 8192, powerW: 1000, host: "OAM", link: "Infinity Fabric · 896 GB/s", launch: "2024-10" },
  "mi355x-288": { arch: "CDNA 4", process: "TSMC 3 nm + 6 nm", cores: 16384, coreUnit: "sp", memType: "HBM3e", busBits: 8192, powerW: 1400, host: "OAM", link: "Infinity Fabric · 1,075 GB/s", launch: "2025-06" },
  "apple-m4-32": { arch: "Apple9", chip: "M4", process: "TSMC N3E", cores: 10, coreUnit: "gpu", memType: "LPDDR5X-7500", busBits: 128, powerW: 65, powerScope: "mac", host: "SoC · Mac mini, MacBook", link: "Thunderbolt 4 · 40 Gb/s", launch: "2024-11" },
  "apple-m4pro-48": { arch: "Apple9", chip: "M4 Pro", process: "TSMC N3E", cores: 16, coresAlt: 20, coreUnit: "gpu", memType: "LPDDR5X-8533", busBits: 256, powerW: 140, powerScope: "mac", host: "SoC · Mac mini, MacBook Pro", link: "Thunderbolt 5 · 120 Gb/s · RDMA", launch: "2024-11" },
  "apple-m4max-64": { arch: "Apple9", chip: "M4 Max", process: "TSMC N3E", cores: 40, coreUnit: "gpu", memType: "LPDDR5X-8533", busBits: 512, host: "SoC · Mac Studio, MacBook Pro", link: "Thunderbolt 5 · 120 Gb/s · RDMA", launch: "2024-11" },
  "apple-m4max-128": { arch: "Apple9", chip: "M4 Max", process: "TSMC N3E", cores: 40, coreUnit: "gpu", memType: "LPDDR5X-8533", busBits: 512, host: "SoC · Mac Studio, MacBook Pro", link: "Thunderbolt 5 · 120 Gb/s · RDMA", launch: "2024-11" },
  "apple-m2ultra-192": { arch: "Apple8", chip: "M2 Ultra", process: "TSMC N5P", cores: 60, coresAlt: 76, coreUnit: "gpu", memType: "LPDDR5-6400", busBits: 1024, powerW: 295, powerScope: "mac", host: "SoC · Mac Studio, Mac Pro", link: "Thunderbolt 4 · 40 Gb/s", launch: "2023-06" },
  "apple-m3ultra-256": { arch: "Apple9", chip: "M3 Ultra", process: "TSMC N3B", cores: 60, coresAlt: 80, coreUnit: "gpu", memType: "LPDDR5-6400", busBits: 1024, powerW: 270, powerScope: "mac", host: "SoC · Mac Studio", link: "Thunderbolt 5 · 120 Gb/s · RDMA", launch: "2025-03" },
  "apple-m3ultra-512": { arch: "Apple9", chip: "M3 Ultra", process: "TSMC N3B", cores: 80, coreUnit: "gpu", memType: "LPDDR5-6400", busBits: 1024, powerW: 270, powerScope: "mac", host: "SoC · Mac Studio", link: "Thunderbolt 5 · 120 Gb/s · RDMA", launch: "2025-03" },
  "amd-strixhalo-64": { arch: "RDNA 3.5", chip: "Strix Halo", process: "TSMC 4 nm", cores: 40, coreUnit: "cu", memType: "LPDDR5X-8000", busBits: 256, powerW: 45, powerMaxW: 120, powerScope: "cpu", host: "SoC · FP11", link: "USB4 · 40 Gb/s", launch: "2025-02" },
  "amd-strixhalo-128": { arch: "RDNA 3.5", chip: "Strix Halo", process: "TSMC 4 nm", cores: 40, coreUnit: "cu", memType: "LPDDR5X-8000", busBits: 256, powerW: 45, powerMaxW: 120, powerScope: "cpu", host: "SoC · FP11", link: "USB4 · 40 Gb/s", launch: "2025-02" },
  "nv-dgxspark-128": { arch: "Blackwell", chip: "GB10", process: "TSMC 3 nm", cores: 6144, coreUnit: "cuda", memType: "LPDDR5X-8533", busBits: 256, powerW: 140, powerScope: "cpu", host: "SoC", link: "ConnectX-7 · 200 Gb/s", launch: "2025-10" },
  "nv-jetson-orin-64": { arch: "Ampere", chip: "Orin", process: "Samsung 8 nm", cores: 2048, coreUnit: "cuda", memType: "LPDDR5", busBits: 256, powerW: 15, powerMaxW: 60, powerScope: "cpu", host: "SoM", link: "10 GbE", launch: "2022-10" },
};

export const specOf = (id: string): GpuSpec => GPU_SPECS[id] ?? {};

# GPU datasheet facts

The facts in `src/lib/gpuSpecs.ts`, shown by GPU Compare (`gpu-compare.html`) and not used by the sizing engine:
architecture, die, process, cores, memory type and bus width, power, form factor, the link between two devices, and
launch. Collected 2026-10-14 from the vendors' product pages, datasheets and whitepapers; a secondary source
(Wikipedia, press coverage, llama.cpp issue logs) is named only where the vendor publishes nothing.

Confidence: **high** — a vendor figure; **medium** — a secondary source, or a vendor figure for a neighbouring
configuration; **low** — inferred or conflicting. **Only high and medium values reach the page**; a low one shows as
"—". The page shows short forms of some values, written by hand in `gpuSpecs.ts`: a combined entry such as "RTX 4080 / Super" shows
the base card, "H100 (SXM/PCIe)" the SXM part its bandwidth belongs to, and a link's bandwidth is both directions
together, as vendors quote it. Apple publishes no SoC power, so Apple power is the Mac's maximum at the wall.

Rows marked *discrepancy* are where a source disagrees with a figure in `src/lib/gpus.ts`. Corrected since:
the 64 GB M4 Max's bandwidth (410 → 546 GB/s); B200 to NVIDIA's per-GPU 180 GB at 7.7 TB/s (192 GB is the
physical memory, 8 TB/s the GB200's) and B300 to 270 GB at 7.7 TB/s; the 32 GB M4's GPU share to two-thirds, 21.3 GiB,
as Metal reports it on a Mac under 36 GB. The others are open.

| Device | Field | Value | Confidence | Source | Note |
|---|---|---|---|---|---|
| `rtx3060-12` | arch | Ampere | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ |  |
| `rtx3060-12` | chip | GA106 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_30_series | GA106-300 at launch; a GA104-150-based 12 GB variant shipped from Sep 2021 with the same specs. NVIDIA does not name the die on the spec page. |
| `rtx3060-12` | process | Samsung 8 nm (8N) | medium | https://en.wikipedia.org/wiki/GeForce_RTX_30_series | Not on NVIDIA's 3060 page; Wikipedia states all RTX 30 GPUs use Samsung 8 nm (NVIDIA's GA102 whitepaper confirms 8N for GA102 only). |
| `rtx3060-12` | cores | 3584 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ |  |
| `rtx3060-12` | memType | GDDR6 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ |  |
| `rtx3060-12` | busBits | 192 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ | Page lists '12 GB GDDR6 / 8 GB GDDR6' and '192-bit / 128-bit' in matching order: 12 GB = 192-bit. |
| `rtx3060-12` | tdpW | 170 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ | 'Graphics Card Power' (reference spec); required system power 550 W. |
| `rtx3060-12` | hostInterface | PCIe 4.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_30_series | Vendor confirms the PCIe generation (spec page / whitepaper); lane count from Wikipedia. |
| `rtx3060-12` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ | NVLink (SLI-Ready) shown as '-' on NVIDIA's page. |
| `rtx3060-12` | launch | 2021-02 | high | https://www.nvidia.com/en-us/geforce/news/geforce-rtx-3060-out-now/ | On sale Feb 25, 2021. |
| `rtx3060-12` | ecc | False | medium | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ | ECC not listed on NVIDIA's spec page; GeForce GDDR6/GDDR6X cards do not advertise ECC. |
| `rtx3060-12` | memGB | 12 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/ |  |
| `rtx3060-12` | bwGBs | 360 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_30_series | NVIDIA does not publish bandwidth for the 3060; Wikipedia: 15 Gbps x 192-bit = 360 GB/s. |
| `rtx4060ti-16` | arch | Ada Lovelace | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ |  |
| `rtx4060ti-16` | chip | AD106 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | AD106-351 for the 16 GB card per Wikipedia. |
| `rtx4060ti-16` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | Whitepaper: 'Ada GPUs are fabricated on TSMC's 4N manufacturing process' (applies to all Ada dies). |
| `rtx4060ti-16` | cores | 4352 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ |  |
| `rtx4060ti-16` | memType | GDDR6 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ |  |
| `rtx4060ti-16` | busBits | 128 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ |  |
| `rtx4060ti-16` | tdpW | 165 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ | Total Graphics Power; page lists '165 or 160' W for the 16 GB / 8 GB models; average gaming power 140 W. |
| `rtx4060ti-16` | hostInterface | PCIe 4.0 x8 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | NVIDIA page says only 'PCI Express Gen 4'; Wikipedia: RTX 4060 / 4060 Ti are limited to 8 lanes (relevant on PCIe 3.0 hosts). |
| `rtx4060ti-16` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ | NVLink: No. |
| `rtx4060ti-16` | launch | 2023-07 | high | https://nvidianews.nvidia.com/news/geforce-rtx-4060-family-is-here-nvidias-revolutionary-ada-lovelace-architecture-comes-to-core-gamers-everywhere-starting-at-299 | NVIDIA PR (May 18, 2023): 16 GB version 'available in July'; Wikipedia gives Jul 18, 2023. |
| `rtx4060ti-16` | ecc | False | medium | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ | ECC not listed on NVIDIA's spec page; GeForce GDDR6/GDDR6X cards do not advertise ECC. |
| `rtx4060ti-16` | memGB | 16 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/ |  |
| `rtx4060ti-16` | bwGBs | 288 | medium | https://www.nvidia.com/en-us/geforce/news/rtx-40-series-vram-video-memory-explained/ | NVIDIA's VRAM article cites 288 GB/s peak in the RTX 4060 Ti context (18 Gbps x 128-bit); the spec page lists no bandwidth. |
| `rtx4070ti-s-16` | arch | Ada Lovelace | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ |  |
| `rtx4070ti-s-16` | chip | AD103 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | AD103-275 per Wikipedia (the non-Super 4070 Ti is AD104). |
| `rtx4070ti-s-16` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | Whitepaper: all Ada GPUs on TSMC 4N. |
| `rtx4070ti-s-16` | cores | 8448 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ |  |
| `rtx4070ti-s-16` | memType | GDDR6X | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ |  |
| `rtx4070ti-s-16` | busBits | 256 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ | Also stated in NVIDIA's CES 2024 SUPER article. |
| `rtx4070ti-s-16` | tdpW | 285 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ | Total Graphics Power. |
| `rtx4070ti-s-16` | hostInterface | PCIe 4.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | Vendor confirms the PCIe generation (spec page / whitepaper); lane count from Wikipedia. |
| `rtx4070ti-s-16` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ | NVLink: No. |
| `rtx4070ti-s-16` | launch | 2024-01 | high | https://www.nvidia.com/en-us/geforce/news/geforce-rtx-4070-ti-super-rtx-video-hdr-game-ready-driver/ | Available Jan 24, 2024. |
| `rtx4070ti-s-16` | ecc | False | medium | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ | ECC not listed on NVIDIA's spec page; GeForce GDDR6/GDDR6X cards do not advertise ECC. |
| `rtx4070ti-s-16` | memGB | 16 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/ |  |
| `rtx4070ti-s-16` | bwGBs | 672 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | Not published by NVIDIA; Wikipedia: 21 Gbps x 256-bit = 672 GB/s. |
| `rtx4080-16` | arch | Ada Lovelace | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ |  |
| `rtx4080-16` | chip | AD103 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | Ada whitepaper Table 3 (RTX 4080 16 GB = AD103). 4080 SUPER is also AD103 (AD103-400 per Wikipedia). |
| `rtx4080-16` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf |  |
| `rtx4080-16` | cores | 9728 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | RTX 4080 SUPER: 10240 CUDA cores. |
| `rtx4080-16` | memType | GDDR6X | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | Both 4080 and 4080 SUPER. |
| `rtx4080-16` | busBits | 256 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | Same for SUPER. |
| `rtx4080-16` | tdpW | 320 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | Total Graphics Power; RTX 4080 SUPER also 320 W. |
| `rtx4080-16` | hostInterface | PCIe 4.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | Ada whitepaper Table 3 lists PCI Express Gen 4; lane count from Wikipedia. |
| `rtx4080-16` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | NVLink: No (both models). |
| `rtx4080-16` | launch | 2022-11 | high | https://www.nvidia.com/en-us/geforce/news/geforce-rtx-4080-out-now/ | RTX 4080 on sale Nov 16, 2022; RTX 4080 SUPER 2024-01 (Jan 31, 2024). |
| `rtx4080-16` | ecc | False | low | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ | Not listed by NVIDIA. A driver ECC toggle is reported for RTX 3090 Ti and RTX 4090; not confirmed either way for the 4080. |
| `rtx4080-16` | memGB | 16 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/ |  |
| `rtx4080-16` | bwGBs | 716.8 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | 22.4 Gbps x 256-bit. RTX 4080 SUPER: NVIDIA states 23 Gbps GDDR6X -> 736 GB/s (computed). |
| `rtx4080-16` | discrepancy | — | — | — | Our 717 GB/s = NVIDIA's 716.8 GB/s rounded: OK for the RTX 4080. |
| `rtx4080-16` | discrepancy | — | — | — | The entry also covers the RTX 4080 SUPER, which runs 23 Gbps GDDR6X (NVIDIA CES 2024 article) = 736 GB/s, 2.7% above our 717; the SUPER also has 10240 vs 9728 cores. |
| `rtx3090-24` | arch | Ampere | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ |  |
| `rtx3090-24` | chip | GA102 | high | https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf | 3090 Ti is also GA102 (GA102-350 per Wikipedia). |
| `rtx3090-24` | process | Samsung 8 nm (8N) | high | https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf | Whitepaper: 'Samsung 8 nm 8N NVIDIA Custom Process'. |
| `rtx3090-24` | cores | 10496 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ | RTX 3090 Ti: 10752. |
| `rtx3090-24` | memType | GDDR6X | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ | 3090: 19.5 Gbps (whitepaper); 3090 Ti: 21 Gbps (NVIDIA launch post). |
| `rtx3090-24` | busBits | 384 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ | Same for 3090 Ti. |
| `rtx3090-24` | tdpW | 350 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ | 'Graphics Card Power' (whitepaper calls it TGP 350 W). RTX 3090 Ti: 450 W. |
| `rtx3090-24` | hostInterface | PCIe 4.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_30_series | Vendor confirms the PCIe generation (spec page / whitepaper); lane count from Wikipedia. |
| `rtx3090-24` | interconnect | NVLink 3 bridge (2-way) · 112.5 GB/s total, bidirectional (56.25 GB/s each way) | medium | https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf | Whitepaper gives four x4 NVLink 3 links on GA102 = 112.5 GB/s total; it names the RTX 3090 as NVLink-capable but quotes the bandwidth for A6000/A40. NVIDIA's 3090 page only says NVLink: Yes (3090 and 3090 Ti). User-measured ~53 GB/s one way. |
| `rtx3090-24` | launch | 2020-09 | high | https://www.nvidia.com/en-us/geforce/news/rtx-3090-out-september-24/ | On sale Sep 24, 2020. RTX 3090 Ti: 2022-03 (Mar 29, 2022). |
| `rtx3090-24` | ecc | False | low | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ | Not listed by NVIDIA. The 3090 Ti (not the plain 3090) is reported to expose a driver ECC toggle. |
| `rtx3090-24` | memGB | 24 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/ |  |
| `rtx3090-24` | bwGBs | 936 | high | https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf | 19.5 Gbps x 384-bit. RTX 3090 Ti: 21 Gbps -> 1008 GB/s. |
| `rtx3090-24` | discrepancy | — | — | — | The entry also covers the RTX 3090 Ti, which has 1008 GB/s (21 Gbps GDDR6X), 7.7% above our 936, plus 450 W and 10752 cores. Our 24 GB / 936 GB/s are correct for the plain RTX 3090. |
| `rtx4090-24` | arch | Ada Lovelace | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ |  |
| `rtx4090-24` | chip | AD102 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | AD102-300 per Wikipedia. |
| `rtx4090-24` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf |  |
| `rtx4090-24` | cores | 16384 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ |  |
| `rtx4090-24` | memType | GDDR6X | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ | 21 Gbps (whitepaper). |
| `rtx4090-24` | busBits | 384 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ |  |
| `rtx4090-24` | tdpW | 450 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ | Total Graphics Power. |
| `rtx4090-24` | hostInterface | PCIe 4.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_40_series | Ada whitepaper lists PCI Express Gen 4; lane count from Wikipedia. |
| `rtx4090-24` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ | NVLink: No. |
| `rtx4090-24` | launch | 2022-10 | high | https://nvidianews.nvidia.com/news/nvidia-delivers-quantum-leap-in-performance-introduces-new-era-of-neural-rendering-with-geforce-rtx-40-series | Available Oct 12, 2022. |
| `rtx4090-24` | ecc | True | medium | https://www.notebookcheck.net/Nvidia-GeForce-RTX-5090-departs-from-RTX-3090-Ti-and-RTX-4090-flagship-tradition-drops-VRAM-ECC-for-pro-workloads.958141.0.html | Driver-toggled ECC (NVIDIA Control Panel / nvidia-smi), off by default; not on NVIDIA's spec page. Reports say enabling it reserves ~1.5 GB (24 -> ~22.5 GB usable) and lowers effective bandwidth. |
| `rtx4090-24` | memGB | 24 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ |  |
| `rtx4090-24` | bwGBs | 1008 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf |  |
| `rtx5070ti-16` | arch | Blackwell | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ |  |
| `rtx5070ti-16` | chip | GB203 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | RTX Blackwell whitepaper Table 5. |
| `rtx5070ti-16` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | 'TSMC 4nm 4N NVIDIA Custom Process'. |
| `rtx5070ti-16` | cores | 8960 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ |  |
| `rtx5070ti-16` | memType | GDDR7 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ | 28 Gbps (whitepaper). |
| `rtx5070ti-16` | busBits | 256 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ |  |
| `rtx5070ti-16` | tdpW | 300 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ | Total Graphics Power. |
| `rtx5070ti-16` | hostInterface | PCIe 5.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_50_series | Vendor confirms the PCIe generation (spec page / whitepaper); lane count from Wikipedia. |
| `rtx5070ti-16` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ | NVLink: No. |
| `rtx5070ti-16` | launch | 2025-02 | high | https://www.nvidia.com/en-us/geforce/news/rtx-5070-ti-out-now/ | On sale Feb 20, 2025. |
| `rtx5070ti-16` | ecc | True | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | RTX Blackwell whitepaper v1.1: GDDR7 has ECC built into the DRAM die, always enabled on GeForce RTX GDDR7 cards (single-bit error correction), no toggle, no performance hit. This is DRAM-internal ECC, not the end-to-end ECC of workstation/data-center cards. |
| `rtx5070ti-16` | memGB | 16 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ |  |
| `rtx5070ti-16` | bwGBs | 896 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf |  |
| `rtx5080-16` | arch | Blackwell | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ |  |
| `rtx5080-16` | chip | GB203 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | RTX Blackwell whitepaper Table 4. |
| `rtx5080-16` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf |  |
| `rtx5080-16` | cores | 10752 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ |  |
| `rtx5080-16` | memType | GDDR7 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ | 30 Gbps (whitepaper). |
| `rtx5080-16` | busBits | 256 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ |  |
| `rtx5080-16` | tdpW | 360 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ | Total Graphics Power. |
| `rtx5080-16` | hostInterface | PCIe 5.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_50_series | Vendor confirms the PCIe generation (spec page / whitepaper); lane count from Wikipedia. |
| `rtx5080-16` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ | NVLink: No. |
| `rtx5080-16` | launch | 2025-01 | high | https://www.nvidia.com/en-us/geforce/news/rtx-5090-5080-out-now/ | On sale Jan 30, 2025. |
| `rtx5080-16` | ecc | True | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | RTX Blackwell whitepaper v1.1: GDDR7 has ECC built into the DRAM die, always enabled on GeForce RTX GDDR7 cards (single-bit error correction), no toggle, no performance hit. This is DRAM-internal ECC, not the end-to-end ECC of workstation/data-center cards. |
| `rtx5080-16` | memGB | 16 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ |  |
| `rtx5080-16` | bwGBs | 960 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf |  |
| `rx7900xtx-24` | arch | RDNA 3 | high | https://www.amd.com/en/newsroom/press-releases/2022-11-3-amd-unveils-world-s-most-advanced-gaming-graphics-.html |  |
| `rx7900xtx-24` | chip | Navi 31 | medium | https://en.wikipedia.org/wiki/Radeon_RX_7000_series | Chiplet design: 1 graphics compute die (GCD) + 6 memory cache dies (MCD). AMD's pages do not use the Navi 31 name. |
| `rx7900xtx-24` | process | 5 nm GCD + 6 nm MCDs | high | https://www.amd.com/en/newsroom/press-releases/2022-11-3-amd-unveils-world-s-most-advanced-gaming-graphics-.html | AMD gives the nodes but not the foundry; Wikipedia: TSMC N5 (GCD) and N6 (MCD). |
| `rx7900xtx-24` | cores | 6144 stream processors (96 CUs) | high | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html |  |
| `rx7900xtx-24` | memType | GDDR6 | high | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html | 20 Gbps; 96 MB Infinity Cache ('effective bandwidth up to 3500 GB/s'). |
| `rx7900xtx-24` | busBits | 384 | high | https://www.amd.com/en/newsroom/press-releases/2022-11-3-amd-unveils-world-s-most-advanced-gaming-graphics-.html |  |
| `rx7900xtx-24` | tdpW | 355 | high | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html | Typical Board Power (TBP); minimum PSU 800 W. |
| `rx7900xtx-24` | hostInterface | PCIe 4.0 x16 | medium | https://en.wikipedia.org/wiki/Radeon_RX_7000_series | AMD's current spec page does not list the bus type. |
| `rx7900xtx-24` | interconnect | none — PCIe only | medium | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html | AMD's spec page lists no GPU-to-GPU link or bridge; multi-GPU traffic goes over PCIe. |
| `rx7900xtx-24` | launch | 2022-12 | high | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html | Launch date 12/13/2022. |
| `rx7900xtx-24` | ecc | False | medium | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html | No ECC listed for the consumer card; ECC is offered on Radeon PRO (W7000) boards. |
| `rx7900xtx-24` | memGB | 24 | high | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html |  |
| `rx7900xtx-24` | bwGBs | 960 | high | https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html | 'Up to 960 GB/s'. |
| `rtx5090-32` | arch | Blackwell | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ |  |
| `rtx5090-32` | chip | GB202 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf |  |
| `rtx5090-32` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf |  |
| `rtx5090-32` | cores | 21760 CUDA cores | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ |  |
| `rtx5090-32` | memType | GDDR7 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ | 28 Gbps (whitepaper). |
| `rtx5090-32` | busBits | 512 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ |  |
| `rtx5090-32` | tdpW | 575 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ | Total Graphics Power. |
| `rtx5090-32` | hostInterface | PCIe 5.0 x16 | medium | https://en.wikipedia.org/wiki/GeForce_RTX_50_series | Vendor confirms the PCIe generation (spec page / whitepaper); lane count from Wikipedia. |
| `rtx5090-32` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ | NVLink: No. |
| `rtx5090-32` | launch | 2025-01 | high | https://www.nvidia.com/en-us/geforce/news/rtx-5090-5080-out-now/ | On sale Jan 30, 2025. |
| `rtx5090-32` | ecc | True | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | RTX Blackwell whitepaper v1.1: GDDR7 has ECC built into the DRAM die, always enabled on GeForce RTX GDDR7 cards (single-bit error correction), no toggle, no performance hit. This is DRAM-internal ECC, not the end-to-end ECC of workstation/data-center cards. Unlike the 4090, the 5090 has no driver ECC toggle. |
| `rtx5090-32` | memGB | 32 | high | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ |  |
| `rtx5090-32` | bwGBs | 1792 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf |  |
| `l4-24` | arch | Ada Lovelace | high | https://www.nvidia.com/en-us/data-center/l4/ |  |
| `l4-24` | chip | AD104 | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | Ada whitepaper Table 5. |
| `l4-24` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf |  |
| `l4-24` | cores | 7424 CUDA cores | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf |  |
| `l4-24` | memType | GDDR6 ECC | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf | ECC enabled by default, can be disabled in software. |
| `l4-24` | busBits | 192 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf |  |
| `l4-24` | tdpW | 72 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf | Total board power: 72 W default and maximum, 40 W minimum (product page: max TDP 72 W). Passive, HHHL single slot. |
| `l4-24` | hostInterface | PCIe 4.0 x16 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf | Also supports Gen4 x8 and Gen3 x16. |
| `l4-24` | interconnect | none — PCIe Gen4 x16 only (64 GB/s) | high | https://www.nvidia.com/en-us/data-center/l4/ | NVIDIA lists 'PCIe Gen4 x16 64GB/s' as the only interconnect; no NVLink. The page does not say whether 64 GB/s is bidirectional (the L40S page says it is). |
| `l4-24` | launch | 2023-03 | high | https://nvidianews.nvidia.com/news/nvidia-launches-inference-platforms-for-large-language-models-and-generative-ai-workloads | Launched at GTC, Mar 21, 2023. |
| `l4-24` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf |  |
| `l4-24` | memGB | 24 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf |  |
| `l4-24` | bwGBs | 300 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/l4/PB-11316-001_v01.pdf |  |
| `a5000-24` | arch | Ampere | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | chip | GA102 | medium | https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units | GA102-850 per Wikipedia; NVIDIA's datasheet does not name the die. |
| `a5000-24` | process | Samsung 8 nm (8N) | medium | https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units | Same GA102 die that NVIDIA's GA102 whitepaper lists as Samsung 8N. |
| `a5000-24` | cores | 8192 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | memType | GDDR6 ECC | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | busBits | 384 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | tdpW | 230 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf | Total board power. |
| `a5000-24` | hostInterface | PCIe 4.0 x16 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | interconnect | NVLink 3 bridge (2-way, low-profile) · 112.5 GB/s bidirectional | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf | Bridge sold separately; pools 2x24 GB only for NVLink-aware applications. |
| `a5000-24` | launch | 2021-04 | high | https://nvidianews.nvidia.com/news/new-nvidia-rtx-gpus-power-next-generation-of-workstations-and-pcs-for-millions-of-artists-designers-engineers-and-virtual-desktop-users | Announced Apr 12, 2021; desktop GPUs 'available ... starting later this month'. |
| `a5000-24` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | memGB | 24 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a5000-24` | bwGBs | 768 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-a5000-datasheet.pdf |  |
| `a6000-48` | arch | Ampere | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | chip | GA102 | high | https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf | GA102 whitepaper Table 3. |
| `a6000-48` | process | Samsung 8 nm (8N) | high | https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf |  |
| `a6000-48` | cores | 10752 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | memType | GDDR6 ECC | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf | 16 Gbps (whitepaper). |
| `a6000-48` | busBits | 384 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | tdpW | 300 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf | Total board power. |
| `a6000-48` | hostInterface | PCIe 4.0 x16 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | interconnect | NVLink 3 bridge (2-way) · 112.5 GB/s bidirectional | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | launch | 2020-12 | high | https://www.nvidia.com/en-us/geforce/news/december-2020-nvidia-studio-driver/ | Announced Oct 5, 2020; NVIDIA reported it 'available now' at channel partners on Dec 15, 2020. |
| `a6000-48` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | memGB | 48 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `a6000-48` | bwGBs | 768 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/proviz-print-nvidia-rtx-a6000-datasheet-us-nvidia-1454980-r9-web%20(1).pdf |  |
| `rtx6000ada-48` | arch | Ada Lovelace | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | chip | AD102 | medium | https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units | AD102-870 per Wikipedia; NVIDIA's datasheet does not name the die. |
| `rtx6000ada-48` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | Whitepaper: all Ada GPUs on TSMC 4N. |
| `rtx6000ada-48` | cores | 18176 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | memType | GDDR6 ECC | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | busBits | 384 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | tdpW | 300 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf | Total board power. |
| `rtx6000ada-48` | hostInterface | PCIe 4.0 x16 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | interconnect | none — PCIe only | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf | Datasheet: NVIDIA NVLink: No. |
| `rtx6000ada-48` | launch | 2022-12 | high | https://nvidianews.nvidia.com/news/nvidias-new-ada-lovelace-rtx-gpu-arrives-for-designers-and-creators | Announced Sep 20, 2022; 'available ... starting in December'. |
| `rtx6000ada-48` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | memGB | 48 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `rtx6000ada-48` | bwGBs | 960 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/rtx-6000/proviz-print-rtx6000-datasheet-web-2504660.pdf |  |
| `l40s-48` | arch | Ada Lovelace | high | https://www.nvidia.com/en-us/data-center/l40s/ |  |
| `l40s-48` | chip | AD102 | low | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/datasheets/L-40/product-brief-L40.pdf | Inferred. NVIDIA does not name the L40S die; the L40 product brief lists AD102-895, with the same 18,176 cores / 48 GB / 864 GB/s config. |
| `l40s-48` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf | Whitepaper: all Ada GPUs on TSMC 4N. |
| `l40s-48` | cores | 18176 CUDA cores | high | https://www.nvidia.com/en-us/data-center/l40s/ |  |
| `l40s-48` | memType | GDDR6 ECC | high | https://www.nvidia.com/en-us/data-center/l40s/ |  |
| `l40s-48` | busBits | 384 | low | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/datasheets/L-40/product-brief-L40.pdf | Inferred. NVIDIA's L40S pages give no bus width; the sibling L40 product brief lists 384 bits for the same 48 GB / 864 GB/s memory. |
| `l40s-48` | tdpW | 350 | high | https://www.nvidia.com/en-us/data-center/l40s/ | Max power consumption; passive cooling. The non-S L40 is 300 W. |
| `l40s-48` | hostInterface | PCIe 4.0 x16 | high | https://www.nvidia.com/en-us/data-center/l40s/ | 'PCIe Gen4 x16: 64GB/s bidirectional'. |
| `l40s-48` | interconnect | none — PCIe only | high | https://www.nvidia.com/en-us/data-center/l40s/ | NVLink Support: No. |
| `l40s-48` | launch | 2023-08 | medium | https://nvidianews.nvidia.com/news/nvidia-global-data-center-system-manufacturers-to-supercharge-generative-ai-and-industrial-digitalization | Announced Aug 8, 2023 (SIGGRAPH); NVIDIA said 'available starting this fall' (2023). |
| `l40s-48` | ecc | True | high | https://www.nvidia.com/en-us/data-center/l40s/ |  |
| `l40s-48` | memGB | 48 | high | https://www.nvidia.com/en-us/data-center/l40s/ |  |
| `l40s-48` | bwGBs | 864 | high | https://www.nvidia.com/en-us/data-center/l40s/ |  |
| `rtxpro5000-72` | arch | Blackwell | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf |  |
| `rtxpro5000-72` | chip | GB202 | medium | https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units | NVIDIA's datasheet does not name the die. |
| `rtxpro5000-72` | process | TSMC 4N | medium | https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units | Follows from GB202 (TSMC 4N per the RTX Blackwell whitepaper); NVIDIA does not state it for this card. |
| `rtxpro5000-72` | cores | 14080 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf |  |
| `rtxpro5000-72` | memType | GDDR7 ECC | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf |  |
| `rtxpro5000-72` | busBits | 384 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf | Same 384-bit bus for the 48 GB and 72 GB versions. |
| `rtxpro5000-72` | tdpW | 300 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf | Total board power. |
| `rtxpro5000-72` | hostInterface | PCIe 5.0 x16 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf |  |
| `rtxpro5000-72` | interconnect | none — PCIe 5.0 only | medium | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf | The datasheet's spec table has no NVLink entry and names no bridge, so this is inferred. MIG splits one card into up to 2x 36 GB (72 GB model); that is partitioning, not an interconnect. |
| `rtxpro5000-72` | launch | 2025-12 | high | https://blogs.nvidia.com/blog/rtx-pro-5000-72gb-blackwell-gpu/ | 72 GB version generally available Dec 18, 2025. The 48 GB RTX PRO 5000 was announced Mar 18, 2025 (GTC). |
| `rtxpro5000-72` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf |  |
| `rtxpro5000-72` | memGB | 72 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf |  |
| `rtxpro5000-72` | bwGBs | 1344 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/professional-desktop-gpus/rtx-pro-5000-blackwell/workstation-datasheet-blackwell-rtx-pro-5000-5488550-nvidia.pdf | Same 1,344 GB/s for 48 GB and 72 GB; datasheet prose rounds it to 1.3 TB/s. |
| `t4-16` | arch | Turing | high | https://www.nvidia.com/en-us/data-center/tesla-t4/ |  |
| `t4-16` | chip | TU104 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-product-brief.pdf | GPU SKU TU104-895 (product brief Table 1). |
| `t4-16` | process | TSMC 12 nm FFN | high | https://images.nvidia.com/aem-dam/Solutions/design-visualization/technologies/turing-architecture/NVIDIA-Turing-Architecture-Whitepaper.pdf | Turing whitepaper, Tesla T4 table: 'Manufacturing Process 12 nm FFN'; TSMC named in the TU102 text. |
| `t4-16` | cores | 2560 CUDA cores | high | https://www.nvidia.com/en-us/data-center/tesla-t4/ | Plus 320 Turing Tensor Cores. |
| `t4-16` | memType | GDDR6 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-product-brief.pdf |  |
| `t4-16` | busBits | 256 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-product-brief.pdf | Memory clock 5001 MHz; peak bandwidth 'up to 320 GBytes/s'. |
| `t4-16` | tdpW | 70 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-product-brief.pdf | Total board power 70 W (default); low-profile PCIe card. |
| `t4-16` | hostInterface | PCIe 3.0 x16 low-profile single-slot card | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-product-brief.pdf | Product brief: 'PCI Express 3.0 x16 x8' (x8 also supported). |
| `t4-16` | interconnect | None (no NVLink; PCIe 3.0 x16 only) | high | https://www.nvidia.com/en-us/data-center/tesla-t4/ | T4 page lists only 'x16 PCIe Gen3' as interconnect; no NVLink connector. |
| `t4-16` | launch | 2018-09 | high | https://nvidianews.nvidia.com/news/new-nvidia-data-center-inference-platform-to-fuel-next-wave-of-ai-powered-services | Announced 12 Sep 2018 at GTC Japan. |
| `t4-16` | mig | None | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG not supported (T4 absent from NVIDIA's MIG supported-GPU list; MIG starts with Ampere). T4 supports SR-IOV, 16 VFs, per product brief. |
| `t4-16` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-product-brief.pdf | ECC configurable, enabled by default. |
| `v100-32` | arch | Volta | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf |  |
| `v100-32` | chip | GV100 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf | Ampere whitepaper comparison table, Tesla V100 column. |
| `v100-32` | process | TSMC 12 nm FFN | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf |  |
| `v100-32` | cores | 5120 CUDA cores | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf | Plus 640 Tensor Cores. |
| `v100-32` | memType | HBM2 | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf |  |
| `v100-32` | busBits | 4096 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf | '4096-bit HBM2' (Ampere whitepaper, Tesla V100 column). |
| `v100-32` | tdpW | 300 | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf | V100 SXM2 300 W; V100 PCIe 250 W; V100S PCIe 250 W. |
| `v100-32` | hostInterface | SXM2 module (NVLink) or PCIe 3.0 x16 card | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf | Datasheet lists both V100 PCIe (PCIe Gen3) and V100 SXM2 (NVLink); 32 GB offered in both. |
| `v100-32` | interconnect | NVLink 2 · 300 GB/s (SXM2; 6 links, bidirectional total) | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf | Datasheet: interconnect 300 GB/s SXM2, 32 GB/s PCIe. Ampere whitepaper: 6 links x 25 GB/s per direction = 300 GB/s total. |
| `v100-32` | launch | 2018-03 | high | https://nvidianews.nvidia.com/news/nvidia-boosts-worlds-leading-deep-learning-computing-platform-bringing-10x-performance-gain-in-six-months | 32 GB V100 announced 27 Mar 2018 (GTC 2018); original 16 GB V100 announced May 2017. |
| `v100-32` | mig | None | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG not supported (Volta). |
| `v100-32` | ecc | True | high | https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf |  |
| `a30-24` | arch | Ampere | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf |  |
| `a30-24` | chip | GA100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | NVIDIA MIG guide lists A30 microarchitecture/die as GA100. |
| `a30-24` | process | TSMC 7 nm (N7) | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf | Process given for GA100 in the Ampere whitepaper; A30 uses GA100 per MIG guide. |
| `a30-24` | cores | 3584 CUDA cores | medium | https://en.wikipedia.org/wiki/Nvidia_Tesla | NVIDIA does not publish the A30 CUDA core count. |
| `a30-24` | memType | HBM2 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf |  |
| `a30-24` | busBits | 3072 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf | Memory clock 1215 MHz; peak 933 GB/s. |
| `a30-24` | tdpW | 165 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf | Total board power 165 W (PCIe card). |
| `a30-24` | hostInterface | PCIe 4.0 x16 dual-slot FHFL card | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf |  |
| `a30-24` | interconnect | NVLink 3 bridge (2 GPUs) · 200 GB/s total | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf | Product brief: 1 bridge, 32 Rx+Tx lanes at 50 Gbps per lane each direction, 'Total Maximum NVLink Bandwidth 200 GB/s' (total of both directions). |
| `a30-24` | launch | 2021-04 | high | https://nvidianews.nvidia.com/news/nvidia-sets-ai-inference-records-introduces-a30-and-a10-gpus-for-enterprise-servers | Introduced April 2021 (GTC21, 12 Apr; press release on A30/A10 later in April); volume server shipments summer 2021. |
| `a30-24` | mig | 4 | high | https://www.nvidia.com/en-us/data-center/products/a30-gpu/ | 4 x 6 GB, 2 x 12 GB or 1 x 24 GB. |
| `a30-24` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/products/a30-gpu/pdf/a30-product-brief.pdf | Enabled by default; HBM2 native ECC with no capacity/bandwidth overhead. |
| `a100-40` | arch | Ampere | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf |  |
| `a100-40` | chip | GA100 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf |  |
| `a100-40` | process | TSMC 7 nm (N7) | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf |  |
| `a100-40` | cores | 6912 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf | 108 SMs; 432 Tensor Cores. |
| `a100-40` | memType | HBM2 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf |  |
| `a100-40` | busBits | 5120 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf | '5120-bit HBM2' (Ampere whitepaper, A100 40GB SXM4). |
| `a100-40` | tdpW | 400 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf | A100 40GB SXM 400 W; A100 40GB PCIe 250 W. |
| `a100-40` | hostInterface | SXM4 · PCIe 4.0 x16 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf | Also sold as a PCIe 4.0 card (same 40 GB / 1,555 GB/s). |
| `a100-40` | interconnect | NVLink 3 · 600 GB/s (12 links, bidirectional total) | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf | Ampere whitepaper: 12 links x 25 GB/s per direction = 600 GB/s total. PCIe version: NVLink bridge for 2 GPUs, 600 GB/s. |
| `a100-40` | launch | 2020-05 | high | https://nvidianews.nvidia.com/news/nvidias-new-ampere-data-center-gpu-in-full-production | 14 May 2020, 'in full production and shipping'. |
| `a100-40` | mig | 7 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf | Up to 7 MIGs @ 5 GB. |
| `a100-40` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf | SECDED ECC on HBM2, L2, L1 and register files. |
| `a100-80` | arch | Ampere | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf |  |
| `a100-80` | chip | GA100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html |  |
| `a100-80` | process | TSMC 7 nm (N7) | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf |  |
| `a100-80` | cores | 6912 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/nvidia-ampere-architecture-whitepaper.pdf |  |
| `a100-80` | memType | HBM2e | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf |  |
| `a100-80` | busBits | 5120 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/PB-10577-001_v02.pdf | Stated in the A100 80GB PCIe product brief (memory clock 1512 MHz); GA100 interface is 5120-bit in both form factors. |
| `a100-80` | tdpW | 400 | high | https://www.nvidia.com/en-us/data-center/a100/ | SXM 400 W standard; HGX A100-80GB custom-thermal SKU up to 500 W. A100 80GB PCIe 300 W. |
| `a100-80` | hostInterface | SXM4 · PCIe 4.0 x16 | high | https://www.nvidia.com/en-us/data-center/a100/ |  |
| `a100-80` | interconnect | NVLink 3 · 600 GB/s (12 links, bidirectional total) | high | https://www.nvidia.com/en-us/data-center/a100/ | PCIe 80GB: NVLink bridge for 2 GPUs, 600 GB/s. |
| `a100-80` | launch | 2020-11 | high | https://nvidianews.nvidia.com/news/nvidia-doubles-down-announces-a100-80gb-gpu-supercharging-worlds-most-powerful-gpu-for-ai-supercomputing | Announced 16 Nov 2020 (SC20). |
| `a100-80` | mig | 7 | high | https://www.nvidia.com/en-us/data-center/a100/ | Up to 7 MIGs @ 10 GB. |
| `a100-80` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/PB-10577-001_v02.pdf |  |
| `h100-80` | arch | Hopper | high | https://www.nvidia.com/en-us/data-center/h100/ |  |
| `h100-80` | chip | GH100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html |  |
| `h100-80` | process | TSMC 4N | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | '4N customized for NVIDIA'. |
| `h100-80` | cores | 16896 CUDA cores | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | SXM5: 132 SMs. PCIe: 14592 CUDA cores (114 SMs). |
| `h100-80` | memType | HBM3 | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | SXM5 HBM3; H100 PCIe uses HBM2e. |
| `h100-80` | busBits | 5120 | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | '5120-bit HBM3' (SXM5); PCIe also 5120-bit (HBM2e). |
| `h100-80` | tdpW | 700 | high | https://www.nvidia.com/en-us/data-center/h100/ | SXM 'up to 700W (configurable)'; H100 PCIe 350 W max (PCIe product brief). |
| `h100-80` | hostInterface | SXM5 · PCIe 5.0 x16 | high | https://www.nvidia.com/en-us/data-center/h100/ | PCIe version: dual-slot PCIe 5.0 x16 card. |
| `h100-80` | interconnect | NVLink 4 · 900 GB/s (18 links, bidirectional total) | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | 18 links x 25 GB/s per direction. H100 PCIe: NVLink bridge (3 bridges), 600 GB/s. |
| `h100-80` | launch | 2022-03 | high | https://nvidianews.nvidia.com/news/nvidia-announces-hopper-architecture-the-next-generation-of-accelerated-computing | Announced 22 Mar 2022 (GTC); 'Hopper in full production' Sep 2022. |
| `h100-80` | mig | 7 | high | https://www.nvidia.com/en-us/data-center/h100/ | Up to 7 MIGs @ 10 GB. |
| `h100-80` | ecc | True | high | https://docs.nvidia.com/deploy/a100-gpu-mem-error-mgmt/latest/supported-gpus.html | GH100 covered by NVIDIA GPU memory error management (ECC, row remapping); H100 PCIe brief lists ECC enabled. |
| `h100-80` | discrepancy | — | — | — | Label says 'SXM/PCIe' but the figures are SXM only. H100 PCIe 80GB is HBM2e at 2,000 GB/s (vendor PCIe product brief), not 3,350 GB/s, with 350 W, 114 SMs and NVLink bridge 600 GB/s. |
| `h200-141` | arch | Hopper | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf |  |
| `h200-141` | chip | GH100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG guide: H200-SXM5 and H200 NVL, die GH100. |
| `h200-141` | process | TSMC 4N | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | GH100 process per Hopper architecture blog. |
| `h200-141` | cores | 16896 CUDA cores | low | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf | NVIDIA does not publish H200 core count; inferred from the identical FP32 rate to H100 SXM (67 TFLOPS) on the same GH100 die (132 SMs). |
| `h200-141` | memType | HBM3e | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf |  |
| `h200-141` | busBits | 6016 | low | — | Source withheld: the document is marked confidential. Value from the H200 NVL product brief (6016-bit, 3,201 MHz, 4,813 GB/s). NVIDIA does not publish the SXM width; same 141 GB / 4.8 TB/s config, so inferred. Wikipedia lists 5120 (conflicting, likely wrong). |
| `h200-141` | tdpW | 700 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf | SXM 'up to 700W (configurable)'. H200 NVL: up to 600 W. |
| `h200-141` | hostInterface | SXM5 · PCIe 5.0 x16 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf | H200 NVL: PCIe 5.0 x16 dual-slot air-cooled card. |
| `h200-141` | interconnect | NVLink 4 · 900 GB/s (bidirectional total) | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf | H200 NVL: 2- or 4-way NVLink bridge, 900 GB/s per GPU. |
| `h200-141` | launch | 2023-11 | high | https://nvidianews.nvidia.com/news/nvidia-supercharges-hopper-the-worlds-leading-ai-computing-platform | Announced 13 Nov 2023; systems shipping from Q2 2024. |
| `h200-141` | mig | 7 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/5o2qgy5d2835ve2pm11i62kv8mphqta8.pdf | SXM up to 7 MIGs @ 18 GB; NVL up to 7 @ 16.5 GB. |
| `h200-141` | ecc | True | high | — | Source withheld: the document is marked confidential. NVL brief: ECC enabled; GH100 die shared with SXM. |
| `b200-192` | arch | Blackwell | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/y441155802qub41q118b2852i557jem5.pdf |  |
| `b200-192` | chip | GB100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | Two reticle-limited GB100 dies joined by a 10 TB/s chip-to-chip link in one package (Blackwell datasheet). |
| `b200-192` | process | TSMC 4NP | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/y441155802qub41q118b2852i557jem5.pdf |  |
| `b200-192` | cores | 18944 CUDA cores | medium | https://en.wikipedia.org/wiki/Nvidia_Tesla | NVIDIA publishes no CUDA core count for B200 (148 SMs implied). |
| `b200-192` | memType | HBM3e | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/y441155802qub41q118b2852i557jem5.pdf |  |
| `b200-192` | busBits | 8192 | medium | https://en.wikipedia.org/wiki/Nvidia_Tesla | NVIDIA does not publish B200 bus width (Blackwell Ultra blog gives 8192-bit for B300). |
| `b200-192` | tdpW | 1000 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/y441155802qub41q118b2852i557jem5.pdf | HGX B200: configurable up to 1,000 W. GB200 (NVL72/NVL4): up to 1,200 W. |
| `b200-192` | hostInterface | SXM (HGX B200) · PCIe 5.0 x16 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/y441155802qub41q118b2852i557jem5.pdf | Datasheet: 'PCIe Gen5: 128 GB/s'. (The Blackwell Ultra blog's table lists Gen6 for Blackwell; the B200 datasheet says Gen5.) |
| `b200-192` | interconnect | NVLink 5 · 1.8 TB/s (18 links, bidirectional; 900 GB/s each way) | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/gl2l4l4812s5fw0p614s6i8bv6mi3vx5.pdf |  |
| `b200-192` | launch | 2024-03 | high | https://nvidianews.nvidia.com/news/nvidia-blackwell-platform-arrives-to-power-a-new-era-of-computing | Announced 18 Mar 2024 (GTC); partner products from late 2024. |
| `b200-192` | mig | 7 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/y441155802qub41q118b2852i557jem5.pdf |  |
| `b200-192` | ecc | True | high | https://docs.nvidia.com/deploy/a100-gpu-mem-error-mgmt/latest/supported-gpus.html | GB10x covered by NVIDIA memory error management (row remapping, HBM channel repair). |
| `b200-192` | discrepancy | — | — | — | Memory: NVIDIA's current per-GPU listings give 180 GB for B200 (Blackwell datasheet HGX B200 column; DGX B200 page 1,440 GB / 8 GPUs; MIG guide 180 GB). 192 GB is the physical HBM3e (technical brief says 'up to 192 GB'). GB200 lists 186 GB. |
| `b200-192` | discrepancy | — | — | — | Bandwidth: HGX B200 datasheet and technical brief list 7.7 TB/s per GPU (62 TB/s per 8-GPU board), not 8 TB/s. 8 TB/s is the GB200 figure; the DGX B200 page says 64 TB/s total (8 TB/s per GPU), so NVIDIA's own pages conflict. |
| `gh200-96` | arch | Hopper (GPU) + Grace (CPU) | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/tkno03fa645gb7f33w60rf200d330420.pdf | Superchip: NVIDIA Hopper GPU plus a 72-core Grace CPU (Arm Neoverse V2). |
| `gh200-96` | chip | GH100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG guide: 'H100 on GH200', die GH100, 96 GB. |
| `gh200-96` | process | TSMC 4N | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | GH100 process; Grace CPU process not covered here. |
| `gh200-96` | cores | 16896 CUDA cores | low | https://dam-cdn.nvd.orangelogic.com/AssetLink/tkno03fa645gb7f33w60rf200d330420.pdf | Not published for GH200; inferred from FP32 67 TFLOPS, the same as H100 SXM (132 SMs). |
| `gh200-96` | memType | HBM3 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/tkno03fa645gb7f33w60rf200d330420.pdf | 96 GB HBM3 variant (144 GB HBM3e variant also exists, up to 4.9 TB/s). |
| `gh200-96` | busBits | None | low | https://www.servethehome.com/?p=80844 | Not published by NVIDIA. ServeTheHome reports all six HBM3 stacks populated for 96 GB, which suggests 6144-bit, but H100 NVL (also six stacks) is 6016-bit per NVIDIA, so left null. |
| `gh200-96` | tdpW | 1000 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/tkno03fa645gb7f33w60rf200d330420.pdf | Module power configurable 450-1000 W, covering CPU + GPU + memory (not GPU alone). |
| `gh200-96` | hostInterface | Grace Hopper superchip module · up to 4x PCIe 5.0 x16 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/tkno03fa645gb7f33w60rf200d330420.pdf | Whitepaper: 64 PCIe Gen5 lanes. The GPU attaches to the Grace CPU via NVLink-C2C, not PCIe. |
| `gh200-96` | interconnect | NVLink-C2C CPU-GPU 900 GB/s (450 GB/s each way); NVLink 4 GPU-GPU 900 GB/s | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/h125m07nuew832vthbov0q6b2rs8ta0q.pdf | GPU-to-GPU NVLink applies in NVLink Switch systems (GH200 NVL32) and NVL2. CPU pool: up to 480 GB LPDDR5X with ECC, up to 512 GB/s (datasheet table; text says up to 500 GB/s); up to 624 GB fast memory total. |
| `gh200-96` | launch | 2023-05 | high | https://nvidianews.nvidia.com/news/nvidia-grace-hopper-superchips-designed-for-accelerated-generative-ai-enter-full-production | 'Enter full production', 28 May 2023 (Computex); Grace Hopper first announced Mar 2022; HBM3e version announced Aug 2023. |
| `gh200-96` | mig | 7 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html |  |
| `gh200-96` | ecc | True | high | https://docs.nvidia.com/deploy/a100-gpu-mem-error-mgmt/latest/supported-gpus.html | GH100 HBM covered by NVIDIA memory error management; Grace LPDDR5X has ECC (datasheet). |
| `h100nvl-94` | arch | Hopper | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf |  |
| `h100nvl-94` | chip | GH100 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG guide: H100-PCIE 94 GB, GH100. |
| `h100nvl-94` | process | TSMC 4N | high | https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ | GH100 process. |
| `h100nvl-94` | cores | 16896 CUDA cores | low | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf | Not published; inferred from FP32 60 TFLOPS at the 1,785 MHz boost clock (product brief), i.e. 132 SMs. |
| `h100nvl-94` | memType | HBM3 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf |  |
| `h100nvl-94` | busBits | 6016 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf | Memory clock 2,619 MHz. |
| `h100nvl-94` | tdpW | 400 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf | 400 W max (default) when strapped for 450/600 W; 310 W max in 300 W cable mode. Product page: '350-400W (configurable)'. |
| `h100nvl-94` | hostInterface | PCIe 5.0 x16 dual-slot FHFL card | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf |  |
| `h100nvl-94` | interconnect | NVLink 4 bridge (3 bridges, GPU pairs) · 600 GB/s bidirectional | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf |  |
| `h100nvl-94` | launch | 2023-03 | high | https://nvidianews.nvidia.com/news/nvidia-launches-inference-platforms-for-large-language-models-and-generative-ai-workloads | Launched 21 Mar 2023 (GTC). |
| `h100nvl-94` | mig | 7 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf | Product page: up to 7 MIGs @ 12 GB. |
| `h100nvl-94` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/h100/PB-11773-001_v01.pdf |  |
| `rtxpro6000-96` | arch | Blackwell | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf |  |
| `rtxpro6000-96` | chip | GB202 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG guide lists Workstation, Max-Q and Server Editions as GB202. |
| `rtxpro6000-96` | process | TSMC 4N | high | https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf | GB202 process per RTX Blackwell whitepaper (4N, not the 4NP used by B200). |
| `rtxpro6000-96` | cores | 24064 CUDA cores | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf | Same count for Server Edition. |
| `rtxpro6000-96` | memType | GDDR7 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf |  |
| `rtxpro6000-96` | busBits | 512 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf |  |
| `rtxpro6000-96` | tdpW | 600 | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf | Workstation Edition 600 W; Max-Q Workstation 300 W; Server Edition up to 600 W (configurable, 300 W min). |
| `rtxpro6000-96` | hostInterface | PCIe 5.0 x16 dual-slot card | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf | Server Edition: FHFL dual-slot passive, PCIe Gen5 x16. |
| `rtxpro6000-96` | interconnect | None (no NVLink; PCIe 5.0 x16 only) | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/3km2720jiy76r06ctf8mxg21743p1058.pdf | Server Edition product brief: 'NVIDIA NVLink: Not supported'. |
| `rtxpro6000-96` | launch | 2025-03 | high | https://nvidianews.nvidia.com/news/nvidia-blackwell-rtx-pro-workstations-servers-agentic-ai | Announced 18 Mar 2025 (GTC); Workstation and Max-Q in distribution from April 2025. |
| `rtxpro6000-96` | mig | 4 | high | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | Up to 4 x 24 GB. |
| `rtxpro6000-96` | ecc | True | high | https://www.nvidia.com/content/dam/en-zz/Solutions/data-center/rtx-pro-6000-blackwell-workstation-edition/workstation-blackwell-rtx-pro-6000-workstation-edition-nvidia-us-3519208-web.pdf | '96 GB GDDR7 with ECC'. |
| `rtxpro6000-96` | discrepancy | — | — | — | Server Edition bandwidth is 1,597 GB/s (12,481 MHz memory clock, server product brief and server page), not 1,792 GB/s. 1,792 GB/s applies to Workstation and Max-Q Editions only. |
| `b300-288` | arch | Blackwell Ultra | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf |  |
| `b300-288` | chip | GB110 | medium | https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html | MIG guide names GB110 for GB300 (DGX Station), the same Blackwell Ultra GPU; HGX B300 not listed there. Wikipedia also gives 2x GB110. Two reticle-sized dies per package. |
| `b300-288` | process | TSMC 4NP | high | https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era/ |  |
| `b300-288` | cores | 18944 CUDA cores | low | https://en.wikipedia.org/wiki/Nvidia_Tesla | Conflicting sources. NVIDIA gives only the full chip: 160 SMs x 128 = 20480 CUDA cores, with 'available SM count ... varies by SKU'. Wikipedia lists 18944 (same as B200). |
| `b300-288` | memType | HBM3e | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf |  |
| `b300-288` | busBits | 8192 | high | https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era/ | '16 x 512-bit controllers (8,192-bit total width)'. The blog's stack count was corrected after publication. |
| `b300-288` | tdpW | 1100 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf | HGX B300: configurable up to 1,100 W. GB300 NVL72: up to 1,400 W (blog: TGP up to 1,400 W). |
| `b300-288` | hostInterface | SXM (HGX B300) · PCIe 6.0 x16 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf | Datasheet: 'PCIe Gen6: 256 GB/s'. |
| `b300-288` | interconnect | NVLink 5 · 1.8 TB/s (18 links, bidirectional) | high | https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era/ |  |
| `b300-288` | launch | 2025-03 | high | https://nvidianews.nvidia.com/news/nvidia-blackwell-ultra-ai-factory-platform-paves-way-for-age-of-ai-reasoning | Announced 18 Mar 2025 (GTC); HGX page says HGX B300 'shipping now'. |
| `b300-288` | mig | 7 | high | https://dam-cdn.nvd.orangelogic.com/AssetLink/1k0p832eq8r5ca0u5383ie5o4tp3bst1.pdf | Blog example: 7 instances x 34 GB. |
| `b300-288` | ecc | True | medium | https://docs.nvidia.com/deploy/a100-gpu-mem-error-mgmt/latest/supported-gpus.html | NVIDIA memory error management covers 'Blackwell GPUs' (GB10x); not stated in the Blackwell Ultra datasheet. |
| `b300-288` | discrepancy | — | — | — | Memory: HGX B300 datasheet lists 270 GB HBM3e per GPU (2.1 TB per 8 GPUs); GB300 NVL72 lists 279 GB. 288 GB is the physical capacity (Blackwell Ultra blog). |
| `b300-288` | discrepancy | — | — | — | Bandwidth: HGX B300 datasheet lists 7.7 TB/s per GPU (62 TB/s per board); 8 TB/s is the GB300 figure. |
| `mi210-64` | arch | CDNA 2 | high | https://www.amd.com/en/products/accelerators/instinct/mi200/mi210.html |  |
| `mi210-64` | chip | Aldebaran | medium | https://en.wikipedia.org/wiki/AMD_Instinct | AMD does not name the die on product pages; ROCm LLVM target gfx90a. |
| `mi210-64` | process | 6 nm FinFET | high | https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/product-briefs/instinct-mi210-brochure.pdf | Brochure footnote; Wikipedia: TSMC N6. |
| `mi210-64` | cores | 6656 stream processors (104 CUs) | high | https://www.amd.com/en/products/accelerators/instinct/mi200/mi210.html | 416 Matrix Cores. |
| `mi210-64` | memType | HBM2e | high | https://www.amd.com/en/products/accelerators/instinct/mi200/mi210.html |  |
| `mi210-64` | busBits | 4096 | high | https://www.amd.com/en/products/accelerators/instinct/mi200/mi210.html | 3.2 Gbps x 4096 bits / 8 = 1,638.4 GB/s (brochure footnote). |
| `mi210-64` | tdpW | 300 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/product-briefs/instinct-mi210-brochure.pdf | '300W TDP (EPS12V, 8-pin)'. |
| `mi210-64` | hostInterface | PCIe 4.0 x16 dual-slot FHFL card | high | https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/product-briefs/instinct-mi210-brochure.pdf |  |
| `mi210-64` | interconnect | Infinity Fabric (3 links) · 300 GB/s peak P2P per card | high | https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/product-briefs/instinct-mi210-brochure.pdf | Product page: 100 GB/s per link. AMD does not say whether the figure is per direction or both; 2- or 4-GPU hives via bridge. |
| `mi210-64` | launch | 2022-03 | high | https://www.amd.com/en/products/accelerators/instinct/mi200/mi210.html | Launch date 3/22/22. |
| `mi210-64` | mig | None | medium | https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/gpu-partitioning/index.html | No compute partitioning: AMD's partitioning docs cover MI300 series and later, not MI200. |
| `mi210-64` | ecc | True | high | https://www.amd.com/en/products/accelerators/instinct/mi200/mi210.html | 'Yes (Full-Chip)'. |
| `mi300x-192` | arch | CDNA 3 | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html |  |
| `mi300x-192` | chip | Aqua Vanjaram | medium | https://en.wikipedia.org/wiki/AMD_Instinct | Multi-chiplet: 8 XCDs (compute) + I/O dies; AMD publishes only the ROCm LLVM target gfx942. |
| `mi300x-192` | process | TSMC 5 nm (XCD) / 6 nm FinFET (IOD) | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html |  |
| `mi300x-192` | cores | 19456 stream processors (304 CUs) | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html | 1216 Matrix Cores; 38 CUs per XCD. |
| `mi300x-192` | memType | HBM3 | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html |  |
| `mi300x-192` | busBits | 8192 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/data-sheets/amd-instinct-mi300x-data-sheet.pdf | Memory clock up to 5.2 GT/s. |
| `mi300x-192` | tdpW | 750 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/data-sheets/amd-instinct-mi300x-data-sheet.pdf | Maximum TBP 750 W (OAM). |
| `mi300x-192` | hostInterface | OAM · PCIe 5.0 x16 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/data-sheets/amd-instinct-mi300x-data-sheet.pdf |  |
| `mi300x-192` | interconnect | Infinity Fabric (7 scale-up links x 128 GB/s) · 896 GB/s bidirectional | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/data-sheets/amd-instinct-mi300x-data-sheet.pdf | Datasheet: '7x 128 GB/s', '128 GB/s bidirectional bandwidth between each GPU'. Product page lists 8 links (1,024 GB/s peak aggregate per OAM including the 8th link). |
| `mi300x-192` | launch | 2023-12 | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html | Launch date 12/06/2023. |
| `mi300x-192` | mig | 8 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/data-sheets/amd-instinct-mi300x-data-sheet.pdf | CPX compute partitioning: up to 8 partitions (one per XCD, 38 CUs / 24 GB each with NPS4); datasheet: SR-IOV up to 8 partitions. |
| `mi300x-192` | ecc | True | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html | 'Yes (Full-Chip)'. |
| `mi325x-256` | arch | CDNA 3 | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html |  |
| `mi325x-256` | chip | Aqua Vanjaram | medium | https://en.wikipedia.org/wiki/AMD_Instinct | Same CDNA 3 chiplet design as MI300X (ROCm LLVM target gfx942). |
| `mi325x-256` | process | TSMC 5 nm (XCD) / 6 nm FinFET (IOD) | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html |  |
| `mi325x-256` | cores | 19456 stream processors (304 CUs) | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html |  |
| `mi325x-256` | memType | HBM3e | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html |  |
| `mi325x-256` | busBits | 8192 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/instinct-mi325x-datasheet.pdf | Memory clock up to 6.0 GT/s. |
| `mi325x-256` | tdpW | 1000 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/instinct-mi325x-datasheet.pdf | Maximum TBP 1000 W (OAM). |
| `mi325x-256` | hostInterface | OAM · PCIe 5.0 x16 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/instinct-mi325x-datasheet.pdf |  |
| `mi325x-256` | interconnect | Infinity Fabric (7 scale-up links x 128 GB/s) · 896 GB/s bidirectional | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/instinct-mi325x-datasheet.pdf | Product page lists 8 links at 128 GB/s. |
| `mi325x-256` | launch | 2024-10 | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html | Launch date 10/10/2024. |
| `mi325x-256` | mig | 8 | medium | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/instinct-mi325x-datasheet.pdf | Datasheet: 'SR-IOV, up to 8 partitions'. AMD's CPX docs are written for MI300X; CPX on MI325X assumed from the shared design. |
| `mi325x-256` | ecc | True | high | https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html |  |
| `mi355x-288` | arch | CDNA 4 | high | https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html |  |
| `mi355x-288` | chip | None | low | https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html | No public die codename found. ROCm LLVM target gfx950; 8 XCDs x 32 CUs (brochure). |
| `mi355x-288` | process | TSMC 3 nm (XCD) / 6 nm FinFET (IOD) | high | https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html |  |
| `mi355x-288` | cores | 16384 stream processors (256 CUs) | high | https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html | 1024 Matrix Cores. |
| `mi355x-288` | memType | HBM3e | high | https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html |  |
| `mi355x-288` | busBits | 8192 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/amd-instinct-mi355x-gpu-brochure.pdf |  |
| `mi355x-288` | tdpW | 1400 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/amd-instinct-mi355x-gpu-brochure.pdf | Maximum TBP 1400 W (OAM; liquid-cooled platform. Air-cooled MI350X is a separate SKU). |
| `mi355x-288` | hostInterface | OAM · PCIe 5.0 x16 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/amd-instinct-mi355x-gpu-brochure.pdf |  |
| `mi355x-288` | interconnect | Infinity Fabric (7 scale-up links x 153.6 GB/s) · 1,075 GB/s bidirectional | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/amd-instinct-mi355x-gpu-brochure.pdf | Platform brochure: fully meshed 153.6 GB/s bidirectional links. The GPU brochure prose also says '160 GB/s bidirectional between each GPU' (inconsistent). |
| `mi355x-288` | launch | 2025-06 | high | https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html | Launch date 6/12/2025. |
| `mi355x-288` | mig | 8 | high | https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/product-briefs/amd-instinct-mi355x-gpu-brochure.pdf | 'GPU physical partitions: up to 8 @ 36 GB'; memory partitions NPS1 or NPS4. |
| `mi355x-288` | ecc | True | high | https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html |  |
| `apple-m4-32` | arch | Apple GPU family Apple9 (M4-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf | Metal feature-set tables map M3-series and M4-series to Apple9; Apple says the M4 GPU 'builds upon the next-generation graphics architecture of the M3 family'. |
| `apple-m4-32` | chip | M4 | high | https://support.apple.com/en-us/121555 |  |
| `apple-m4-32` | process | TSMC N3E (Apple: second-generation 3 nm) | medium | https://www.apple.com/newsroom/2024/05/apple-introduces-m4-chip/ | Apple states 'second-generation 3-nanometer technology'; the TSMC N3E name comes from secondary sources (e.g. lowendmac), Apple does not name the node. |
| `apple-m4-32` | cores | 10-core GPU | high | https://support.apple.com/en-us/121555 | CPU: 10-core (4 performance + 6 efficiency). Mac mini M4 has 10C CPU/10C GPU; some MacBook Air M4 bins have an 8-core GPU. |
| `apple-m4-32` | memType | LPDDR5X-7500 | medium | https://lowendmac.com/1234/apple-silicon-m4-chip-specs/ | Apple does not publish memory type; 7500 MT/s x 128-bit = 120 GB/s matches Apple's figure. |
| `apple-m4-32` | busBits | 128 | medium | https://lowendmac.com/1234/apple-silicon-m4-chip-specs/ | Not published by Apple; consistent with 120 GB/s at LPDDR5X-7500. |
| `apple-m4-32` | tdpW | 65 | medium | https://support.apple.com/en-us/103253 | Apple-measured MAX wall power of Mac mini (2024) M4 16GB config (idle 4 W); whole system incl. PSU losses, not an SoC TDP. Mac mini max continuous power rating: 155 W. No figure published for the 32GB config. |
| `apple-m4-32` | hostInterface | Mac mini (2024) / MacBook Pro 14 (M4) / MacBook Air (M4) SoC | high | https://support.apple.com/en-us/121555 | Mac mini M4: 16GB, configurable to 24GB or 32GB. |
| `apple-m4-32` | interconnect | Thunderbolt 4 (40 Gb/s), 3 ports on Mac mini - IP networking only | high | https://support.apple.com/en-us/121555 | Apple's RDMA-over-Thunderbolt clustering (macOS 26.2+, MLX JACCL) requires Thunderbolt 5, which base M4 lacks (Apple: TB5 is M4 Pro/Max only). |
| `apple-m4-32` | launch | 2024-11 | high | https://www.apple.com/newsroom/2024/10/new-macbook-pro-features-m4-family-of-chips-and-apple-intelligence/ | Mac mini / MacBook Pro M4 available from 2024-11-08 (Apple). The M4 chip itself debuted 2024-05 in iPad Pro (max 16GB). |
| `apple-m4-32` | gpuShare | Default ~2/3 of RAM on macOS 15 (32GB -> ~21.3 GiB); 75% (24 GiB) seen on macOS 26.3; raise via iogpu.wired_limit_mb | medium | https://github.com/ggml-org/llama.cpp/issues/12588 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). Mac mini M4 (built for darwin24.2 / macOS 15): recommendedMaxWorkingSetSize = 22906.50 MB = 21.33 GiB (2/3). A 32GB M2 Max on macOS 26.3 reports 25769.80 MB = 24 GiB (75%) (llama.cpp #24413). Machines with >=36GB show 75% on all versions seen. |
| `apple-m4-32` | discrepancy | — | — | — | GPU-usable 24 GB: on macOS 15 the default Metal working set for a 32GB Mac is ~21.3 GiB (2/3), not 24 (Mac mini M4 log, llama.cpp #12588). 24 GiB (75%) appears on macOS 26.3 (one report, #24413) or after `sudo sysctl iogpu.wired_limit_mb=24576`. Consider 21 GB as the default or label 24 as 'macOS 26 / raised limit'. |
| `apple-m4-32` | discrepancy | — | — | — | Availability (not a spec error): Apple removed the 32GB option for the M4 Mac mini in April 2026 (heise: Mac mini M4 now 16 or 24 GB only) - https://heise.de/-11283881 |
| `apple-m4pro-48` | arch | Apple GPU family Apple9 (M4-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf |  |
| `apple-m4pro-48` | chip | M4 Pro | high | https://support.apple.com/en-us/121555 |  |
| `apple-m4pro-48` | process | TSMC N3E (Apple: second-generation 3 nm) | medium | https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/ | Apple: 'built using industry-leading, second-generation 3-nanometer technology'; N3E name is secondary. |
| `apple-m4pro-48` | cores | 16- or 20-core GPU | high | https://support.apple.com/en-us/121555 | CPU: 12-core (8P+4E) with 16-core GPU, or 14-core (10P+4E) with 20-core GPU; 48GB is offered with both bins on Mac mini (MacBook Pro 14 page ties 48GB to M4 Pro too). |
| `apple-m4pro-48` | memType | LPDDR5X-8533 | medium | https://lowendmac.com/1234/apple-silicon-m4-pro-chip-specs/ | Not published by Apple; 8533 MT/s x 256-bit = 273 GB/s matches Apple. |
| `apple-m4pro-48` | busBits | 256 | medium | https://lowendmac.com/1234/apple-silicon-m4-pro-chip-specs/ |  |
| `apple-m4pro-48` | tdpW | 140 | medium | https://support.apple.com/en-us/103253 | Apple-measured MAX wall power of Mac mini (2024) M4 Pro 64GB / 8TB config (idle 5 W); system power, not SoC TDP. Mac mini max continuous power rating 155 W. |
| `apple-m4pro-48` | hostInterface | Mac mini (2024) / MacBook Pro 14 & 16 (2024) SoC | high | https://support.apple.com/en-us/121555 | Mac mini M4 Pro: 24GB, configurable to 48GB or 64GB (at launch). |
| `apple-m4pro-48` | interconnect | Thunderbolt 5 (120 Gb/s); RDMA over Thunderbolt 5 from macOS 26.2 (MLX JACCL) | high | https://developer.apple.com/videos/play/wwdc2026/233/ | Apple WWDC26 session 233: 'Starting in macOS 26.2, ... RDMA ... is supported over Thunderbolt 5.' Mac mini M4 Pro has 3 TB5 ports. |
| `apple-m4pro-48` | launch | 2024-11 | high | https://www.apple.com/newsroom/2024/10/new-macbook-pro-features-m4-family-of-chips-and-apple-intelligence/ | Announced 2024-10-30, availability 2024-11-08. |
| `apple-m4pro-48` | gpuShare | ~75% of RAM by default (48GB -> 36 GiB); raise via iogpu.wired_limit_mb | medium | https://github.com/ggml-org/llama.cpp/issues/10976 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). M4 Pro log: recommendedMaxWorkingSetSize = 38654.71 MB = 36 GiB (= 75% of 48 GiB; RAM size inferred from the value). |
| `apple-m4max-64` | arch | Apple GPU family Apple9 (M4-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf |  |
| `apple-m4max-64` | chip | M4 Max (16-core CPU / 40-core GPU bin) | high | https://support.apple.com/en-us/122211 | Apple offers 48/64/128GB only on the 16-core CPU / 40-core GPU M4 Max; the 14-core CPU / 32-core GPU bin (410 GB/s) ships only with 36GB. |
| `apple-m4max-64` | process | TSMC N3E (Apple: second-generation 3 nm) | medium | https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/ |  |
| `apple-m4max-64` | cores | 40-core GPU | high | https://support.apple.com/en-us/122211 | CPU: 16-core (12 performance + 4 efficiency). |
| `apple-m4max-64` | memType | LPDDR5X-8533 | medium | https://lowendmac.com/1234/apple-silicon-m4-max-chip-specs/ |  |
| `apple-m4max-64` | busBits | 512 | medium | https://lowendmac.com/1234/apple-silicon-m4-max-chip-specs/ | lowendmac lists '384-Bit or 512-Bit' for the two bins; 546 GB/s / 8533 MT/s = 512-bit (the 410 GB/s 32-core bin is 384-bit). |
| `apple-m4max-64` | tdpW | None | low | https://support.apple.com/en-us/102027 | Apple publishes no power figure for the 16C/40G M4 Max. Its only M4 Max measurement is the 14C/32G 36GB Mac Studio: 145 W max at the wall (idle 6 W). Mac Studio (2025) max continuous power rating: 480 W (PSU, shared with M3 Ultra). |
| `apple-m4max-64` | hostInterface | Mac Studio (2025) / MacBook Pro 14 & 16 (2024) SoC | high | https://support.apple.com/en-us/122211 |  |
| `apple-m4max-64` | interconnect | Thunderbolt 5 (120 Gb/s); RDMA over Thunderbolt 5 from macOS 26.2 (MLX JACCL) | high | https://developer.apple.com/videos/play/wwdc2026/233/ | Mac Studio M4 Max: 4 rear TB5 ports (front ports are USB-C 10 Gb/s). |
| `apple-m4max-64` | launch | 2024-11 | high | https://www.apple.com/newsroom/2024/10/new-macbook-pro-features-m4-family-of-chips-and-apple-intelligence/ | MacBook Pro M4 Max available 2024-11-08; Mac Studio M4 Max 2025-03-12. |
| `apple-m4max-64` | gpuShare | ~75% of RAM by default (64GB -> 48 GiB); raise via iogpu.wired_limit_mb | medium | https://github.com/ggml-org/llama.cpp/issues/14110 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). M4 Max log: recommendedMaxWorkingSetSize = 51539.61 MB = 48 GiB (= 75% of 64 GiB). |
| `apple-m4max-64` | discrepancy | — | — | — | BANDWIDTH: ours 410 GB/s, Apple 546 GB/s. Apple sells 64GB only with the 16-core CPU / 40-core GPU M4 Max (546 GB/s) - Mac Studio (2025) and MacBook Pro 14 tech specs: '48GB, 64GB, or 128GB (M4 Max with 16-core CPU)'. The 410 GB/s bin is 14-core CPU / 32-core GPU and is only sold with 36GB. Either change bandwidth to 546 (and 40-core GPU / 512-bit) or change this device to 'M4 Max (36GB)'. |
| `apple-m4max-128` | arch | Apple GPU family Apple9 (M4-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf |  |
| `apple-m4max-128` | chip | M4 Max (16-core CPU / 40-core GPU bin) | high | https://support.apple.com/en-us/122211 |  |
| `apple-m4max-128` | process | TSMC N3E (Apple: second-generation 3 nm) | medium | https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/ |  |
| `apple-m4max-128` | cores | 40-core GPU | high | https://support.apple.com/en-us/122211 | CPU: 16-core (12 performance + 4 efficiency). |
| `apple-m4max-128` | memType | LPDDR5X-8533 | medium | https://lowendmac.com/1234/apple-silicon-m4-max-chip-specs/ |  |
| `apple-m4max-128` | busBits | 512 | medium | https://lowendmac.com/1234/apple-silicon-m4-max-chip-specs/ |  |
| `apple-m4max-128` | tdpW | None | low | https://support.apple.com/en-us/102027 | No Apple figure for the 16C/40G bin (Apple only measured the 14C/32G 36GB Mac Studio: 145 W max at the wall). Mac Studio (2025) PSU rating 480 W. |
| `apple-m4max-128` | hostInterface | Mac Studio (2025) / MacBook Pro 14 & 16 (2024) SoC | high | https://support.apple.com/en-us/122211 |  |
| `apple-m4max-128` | interconnect | Thunderbolt 5 (120 Gb/s); RDMA over Thunderbolt 5 from macOS 26.2 (MLX JACCL) | high | https://developer.apple.com/videos/play/wwdc2026/233/ |  |
| `apple-m4max-128` | launch | 2024-11 | high | https://www.apple.com/newsroom/2024/10/new-macbook-pro-features-m4-family-of-chips-and-apple-intelligence/ | MacBook Pro M4 Max (up to 128GB) available 2024-11-08. |
| `apple-m4max-128` | gpuShare | ~75% of RAM by default (128GB -> 96 GiB); raise via iogpu.wired_limit_mb | medium | https://github.com/ggml-org/llama.cpp/issues/12277 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). M4 Max log: recommendedMaxWorkingSetSize = 103079.22 MB = 96 GiB (= 75% of 128 GiB). |
| `apple-m4max-128` | discrepancy | — | — | — | Availability (not a spec error): heise reports the 128GB M4 Max Mac Studio option disappeared from Apple's store in April 2026 amid DRAM shortages; status murky, Apple's tech-spec page still lists it - https://heise.de/-11283881 |
| `apple-m2ultra-192` | arch | Apple GPU family Apple8 (M2-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf |  |
| `apple-m2ultra-192` | chip | M2 Ultra (2x M2 Max via UltraFusion) | high | https://www.apple.com/newsroom/2023/06/apple-introduces-m2-ultra/ | UltraFusion: 'over 2.5TB/s of low-latency interprocessor bandwidth'; 134 billion transistors. |
| `apple-m2ultra-192` | process | TSMC N5P (Apple: second-generation 5 nm) | medium | https://www.apple.com/newsroom/2023/06/apple-introduces-m2-ultra/ | Apple states 'second-generation 5-nanometer process'; N5P name is secondary (lowendmac). |
| `apple-m2ultra-192` | cores | 60- or 76-core GPU | high | https://support.apple.com/en-us/111835 | CPU: 24-core (16 performance + 8 efficiency). 192GB not tied to a GPU bin on Apple's page. |
| `apple-m2ultra-192` | memType | LPDDR5-6400 | medium | https://lowendmac.com/1234/apple-silicon-m2-ultra-chip-specs/ | Not published by Apple. |
| `apple-m2ultra-192` | busBits | 1024 | medium | https://lowendmac.com/1234/apple-silicon-m2-ultra-chip-specs/ | 1024-bit x 6400 MT/s = 819.2 GB/s theoretical; Apple markets 800 GB/s. |
| `apple-m2ultra-192` | tdpW | 295 | high | https://support.apple.com/en-us/102027 | Apple-measured MAX wall power, Mac Studio (2023) M2 Ultra 24C CPU / 76C GPU / 192GB / 8TB (idle 10 W). System power incl. PSU losses. Mac Studio (2023) max continuous power rating 370 W. |
| `apple-m2ultra-192` | hostInterface | Mac Studio (2023) / Mac Pro (2023) SoC | high | https://www.apple.com/newsroom/2023/06/apple-unveils-new-mac-studio-and-brings-apple-silicon-to-mac-pro/ |  |
| `apple-m2ultra-192` | interconnect | Thunderbolt 4 (40 Gb/s), 6 ports on Mac Studio - IP networking only | high | https://support.apple.com/en-us/111835 | No Thunderbolt 5, so Apple's RDMA-over-TB5 clustering (macOS 26.2+) does not apply. |
| `apple-m2ultra-192` | launch | 2023-06 | high | https://www.apple.com/newsroom/2023/06/apple-unveils-new-mac-studio-and-brings-apple-silicon-to-mac-pro/ | Announced 2023-06-05; availability 2023-06-13. |
| `apple-m2ultra-192` | gpuShare | ~75% of RAM by default (192GB -> 144 GiB); raise via iogpu.wired_limit_mb | medium | https://github.com/ggml-org/llama.cpp/issues/12013 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). M2 Ultra 192GB log: recommendedMaxWorkingSetSize = 154618.82 MB = 144 GiB. |
| `apple-m2ultra-192` | discrepancy | — | — | — | Info only: Apple's 800 GB/s matches ours; the theoretical figure for the same LPDDR5-6400 1024-bit bus is 819.2 GB/s (what M3 Ultra is marketed at). No change needed if the site uses vendor figures. |
| `apple-m3ultra-256` | arch | Apple GPU family Apple9 (M3-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf |  |
| `apple-m3ultra-256` | chip | M3 Ultra (2x M3 Max via UltraFusion) | high | https://www.apple.com/newsroom/2025/03/apple-reveals-m3-ultra-taking-apple-silicon-to-a-new-extreme/ | 184 billion transistors; 'over 10,000 high-speed connections'. |
| `apple-m3ultra-256` | process | TSMC N3B (first-generation 3 nm) | medium | https://lowendmac.com/1234/apple-silicon-m3-ultra-chip-specs/ | Apple does not state the node for M3 Ultra. |
| `apple-m3ultra-256` | cores | 60- or 80-core GPU | high | https://support.apple.com/en-us/122211 | CPU: 28-core (20P+8E) with 60-core GPU, or 32-core (24P+8E) with 80-core GPU. |
| `apple-m3ultra-256` | memType | LPDDR5-6400 | medium | https://lowendmac.com/1234/apple-silicon-m3-ultra-chip-specs/ | Not published by Apple. |
| `apple-m3ultra-256` | busBits | 1024 | medium | https://lowendmac.com/1234/apple-silicon-m3-ultra-chip-specs/ | 1024-bit x 6400 MT/s = 819.2 GB/s, matches Apple's 819 GB/s. |
| `apple-m3ultra-256` | tdpW | 270 | medium | https://support.apple.com/en-us/102027 | Apple-measured MAX wall power for Mac Studio (2025) M3 Ultra 32C CPU / 80C GPU / 512GB / 16TB (idle 9 W); no separate figure for 256GB or the 60-core bin. Mac Studio (2025) max continuous power rating 480 W. |
| `apple-m3ultra-256` | hostInterface | Mac Studio (2025) SoC | high | https://support.apple.com/en-us/122211 |  |
| `apple-m3ultra-256` | interconnect | Thunderbolt 5 (120 Gb/s), 6 ports; RDMA over Thunderbolt 5 from macOS 26.2 (MLX JACCL) | high | https://developer.apple.com/videos/play/wwdc2026/233/ | Apple's WWDC26 example cluster is four M3 Ultra Mac Studios. |
| `apple-m3ultra-256` | launch | 2025-03 | high | https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/ | Announced 2025-03-05; availability 2025-03-12. |
| `apple-m3ultra-256` | gpuShare | ~75% of RAM by default (256GB -> 192 GiB); raise via iogpu.wired_limit_mb | low | https://github.com/ggml-org/llama.cpp/issues/15055 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). No 256GB log found; inferred from the 75% ratio seen on every >=36GB Mac incl. M3 Ultra 512GB (412316.86 MB = 384 GiB). |
| `apple-m3ultra-256` | discrepancy | — | — | — | Availability (not a spec error): Apple removed the 256GB M3 Ultra option around 2026-05-05; the M3 Ultra Mac Studio is now sold with 96GB only (9to5Mac, heise). Apple's tech-spec page (support.apple.com/en-us/122211) still lists 96GB configurable to 256GB. - https://9to5mac.com/?p=1051037 |
| `apple-m3ultra-512` | arch | Apple GPU family Apple9 (M3-series) | high | https://developer.apple.com/metal/Metal-Feature-Set-Tables.pdf |  |
| `apple-m3ultra-512` | chip | M3 Ultra (2x M3 Max via UltraFusion) | high | https://www.apple.com/newsroom/2025/03/apple-reveals-m3-ultra-taking-apple-silicon-to-a-new-extreme/ |  |
| `apple-m3ultra-512` | process | TSMC N3B (first-generation 3 nm) | medium | https://lowendmac.com/1234/apple-silicon-m3-ultra-chip-specs/ |  |
| `apple-m3ultra-512` | cores | 80-core GPU | medium | https://support.apple.com/en-us/102027 | CPU: 32-core (24P+8E). Apple's own 512GB test config is '32-Core CPU & 80-Core GPU'; launch pricing ($5,500 over base = memory + chip upgrade, The Register) implies 512GB required the top bin, but Apple never stated it outright. |
| `apple-m3ultra-512` | memType | LPDDR5-6400 | medium | https://lowendmac.com/1234/apple-silicon-m3-ultra-chip-specs/ |  |
| `apple-m3ultra-512` | busBits | 1024 | medium | https://lowendmac.com/1234/apple-silicon-m3-ultra-chip-specs/ |  |
| `apple-m3ultra-512` | tdpW | 270 | high | https://support.apple.com/en-us/102027 | Apple-measured MAX wall power, Mac Studio (2025) M3 Ultra 32C/80C, 512GB, 16TB (idle 9 W). Max continuous power rating 480 W. |
| `apple-m3ultra-512` | hostInterface | Mac Studio (2025) SoC | high | https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/ |  |
| `apple-m3ultra-512` | interconnect | Thunderbolt 5 (120 Gb/s), 6 ports; RDMA over Thunderbolt 5 from macOS 26.2 (MLX JACCL) | high | https://developer.apple.com/videos/play/wwdc2026/233/ |  |
| `apple-m3ultra-512` | launch | 2025-03 | high | https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/ | Apple newsroom: 'starts with 96GB ... can be configured up to 512GB'; availability 2025-03-12. |
| `apple-m3ultra-512` | gpuShare | ~75% of RAM by default (512GB -> 384 GiB); raise via iogpu.wired_limit_mb | medium | https://github.com/ggml-org/llama.cpp/issues/15055 | Metal recommendedMaxWorkingSetSize (Apple documents it only as 'an approximation of how much memory this GPU device can allocate without affecting runtime performance'; no % is published). Raise with `sudo sysctl iogpu.wired_limit_mb=<MB>` (undocumented by Apple, resets on reboot; 0 = default). Values below are read from llama.cpp ggml_metal_init logs (printed in 1e6-byte MB). M3 Ultra 512GB log: recommendedMaxWorkingSetSize = 412316.86 MB = 384 GiB. |
| `apple-m3ultra-512` | discrepancy | — | — | — | Vendor page no longer supports 512GB: Apple removed the 512GB option around 2026-03-05 (Cult of Mac, 9to5Mac) and the current Mac Studio (2025) tech-spec page lists only 96GB / 256GB. 512GB is now sourced only from Apple's March 2025 newsroom and Apple's power-consumption page. Consider marking the device discontinued. - https://www.cultofmac.com/news/apple-quietly-kills-512gb-m3-ultra-mac-studio-option |
| `amd-strixhalo-64` | arch | RDNA 3.5 | high | https://www.amd.com/en/newsroom/press-releases/2025-1-6-amd-announces-expanded-consumer-and-commercial-ai-.html | LLVM target gfx1151 (ROCm Strix Halo docs). |
| `amd-strixhalo-64` | chip | Strix Halo (Ryzen AI Max+ 395) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD lists 'Former Codename: Strix Halo'; package die count 3. |
| `amd-strixhalo-64` | process | TSMC 4nm FinFET (CPU dies and I/O die) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD: 'Processor Technology for CPU Cores: TSMC 4nm FinFET'; 'for I/O Die: TSMC 4nm FinFET' (GPU sits on the I/O die). |
| `amd-strixhalo-64` | cores | 40 compute units (Radeon 8060S) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | CPU: 16 Zen 5 cores / 32 threads, up to 5.1 GHz; GPU up to 2900 MHz; NPU up to 50 TOPS. |
| `amd-strixhalo-64` | memType | LPDDR5X-8000 | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD: 'System Memory Type: 256-bit LPDDR5x', 'Max Memory Speed: LPDDR5x-8000'. |
| `amd-strixhalo-64` | busBits | 256 | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html |  |
| `amd-strixhalo-64` | tdpW | 45-120 | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD configurable TDP (cTDP) range for the SoC; default TDP 55 W. OEMs pick the operating point (AMD's own Ryzen AI Halo dev platform lists 120 W). |
| `amd-strixhalo-64` | hostInterface | laptop / mini-PC / desktop SoC (BGA, socket FP11) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD form factor: 'Laptops, Desktops'. |
| `amd-strixhalo-64` | interconnect | none (2x USB4 40 Gb/s, PCIe 4.0 x16 lanes; multi-unit only via Ethernet/USB4 networking) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | No vendor GPU-to-GPU or RDMA link; port counts from AMD spec page. |
| `amd-strixhalo-64` | launch | 2025-02 | medium | https://www.amd.com/en/newsroom/press-releases/2025-1-6-amd-announces-expanded-consumer-and-commercial-ai-.html | Announced at CES 2025-01-06; AMD: 'Systems ... expected to be available starting in Q1 2025'. First retail systems (ASUS ROG Flow Z13, 32/64GB) from 2025-02-25 per ASUS/retail reports. |
| `amd-strixhalo-64` | gpuShare | Windows: AMD Variable Graphics Memory up to 48 GB dedicated on 64GB systems; Linux: GTT defaults to ~50% of RAM, raise via TTM pages_limit (amd-ttm) | high | https://www.amd.com/en/blogs/2025/faqs-amd-variable-graphics-memory-vram-ai-model-sizes-quantization-mcp-more.html | AMD VGM FAQ (2025-07-29): 64GB platform 'allowing up to 48GB dedicated graphics memory through VGM'; 128GB: 'up to 96GB of dedicated graphics memory' and 'can technically access a total graphics memory size of 112GB'. Linux: ROCm Strix Halo guide (https://rocm.docs.amd.com/en/latest/how-to/system-optimization/strixhalo.html) - 'By default, the GTT limit is set to approximately 50 percent of total system RAM'; keep BIOS VRAM small (0.5 GB) and raise the TTM limit (its example: 100 GB on a ~125.65 GB system). |
| `amd-strixhalo-128` | arch | RDNA 3.5 | high | https://www.amd.com/en/newsroom/press-releases/2025-1-6-amd-announces-expanded-consumer-and-commercial-ai-.html | LLVM target gfx1151 (ROCm Strix Halo docs). |
| `amd-strixhalo-128` | chip | Strix Halo (Ryzen AI Max+ 395) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD lists 'Former Codename: Strix Halo'; package die count 3. |
| `amd-strixhalo-128` | process | TSMC 4nm FinFET (CPU dies and I/O die) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD: 'Processor Technology for CPU Cores: TSMC 4nm FinFET'; 'for I/O Die: TSMC 4nm FinFET' (GPU sits on the I/O die). |
| `amd-strixhalo-128` | cores | 40 compute units (Radeon 8060S) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | CPU: 16 Zen 5 cores / 32 threads, up to 5.1 GHz; GPU up to 2900 MHz; NPU up to 50 TOPS. |
| `amd-strixhalo-128` | memType | LPDDR5X-8000 | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD: 'System Memory Type: 256-bit LPDDR5x', 'Max Memory Speed: LPDDR5x-8000'. |
| `amd-strixhalo-128` | busBits | 256 | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html |  |
| `amd-strixhalo-128` | tdpW | 45-120 | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD configurable TDP (cTDP) range for the SoC; default TDP 55 W. OEMs pick the operating point (AMD's own Ryzen AI Halo dev platform lists 120 W). |
| `amd-strixhalo-128` | hostInterface | laptop / mini-PC / desktop SoC (BGA, socket FP11) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | AMD form factor: 'Laptops, Desktops'. |
| `amd-strixhalo-128` | interconnect | none (2x USB4 40 Gb/s, PCIe 4.0 x16 lanes; multi-unit only via Ethernet/USB4 networking) | high | https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html | No vendor GPU-to-GPU or RDMA link; port counts from AMD spec page. |
| `amd-strixhalo-128` | launch | 2025-02 | medium | https://www.amd.com/en/newsroom/press-releases/2025-1-6-amd-announces-expanded-consumer-and-commercial-ai-.html | Announced at CES 2025-01-06; AMD: 'Systems ... expected to be available starting in Q1 2025'. First retail systems (ASUS ROG Flow Z13, 32/64GB) from 2025-02-25 per ASUS/retail reports. 128GB configurations reached buyers later (e.g. GMKtec EVO-X2 China pre-orders April 2025; Notebookcheck noted 128GB Z13 not yet available at launch). |
| `amd-strixhalo-128` | gpuShare | Windows: AMD Variable Graphics Memory up to 96 GB dedicated (iGPU can address 112 GB total incl. shared); Linux: GTT defaults to ~50% of RAM, raise via TTM pages_limit (amd-ttm) | high | https://www.amd.com/en/blogs/2025/faqs-amd-variable-graphics-memory-vram-ai-model-sizes-quantization-mcp-more.html | AMD VGM FAQ (2025-07-29): 64GB platform 'allowing up to 48GB dedicated graphics memory through VGM'; 128GB: 'up to 96GB of dedicated graphics memory' and 'can technically access a total graphics memory size of 112GB'. Linux: ROCm Strix Halo guide (https://rocm.docs.amd.com/en/latest/how-to/system-optimization/strixhalo.html) - 'By default, the GTT limit is set to approximately 50 percent of total system RAM'; keep BIOS VRAM small (0.5 GB) and raise the TTM limit (its example: 100 GB on a ~125.65 GB system). |
| `amd-strixhalo-128` | discrepancy | — | — | — | Info only: 96 GB usable is the Windows VGM ceiling; on Linux with a small BIOS carve-out and raised TTM/GTT limit the iGPU can use more (AMD's ROCm guide shows 100 GB on a ~125.65 GB system; AMD says 112 GB total graphics-addressable on Windows). |
| `nv-dgxspark-128` | arch | Blackwell | high | https://www.nvidia.com/en-us/products/workstations/dgx-spark/ | NVIDIA: 'GPU: Blackwell Architecture', 5th-gen Tensor Cores, 4th-gen RT cores. CUDA compute capability 12.1 (developer.nvidia.com/cuda-gpus) - the SM12x family, not datacenter SM100. |
| `nv-dgxspark-128` | chip | GB10 (Grace Blackwell Superchip) | high | https://www.nvidia.com/en-us/products/workstations/dgx-spark/ | Two dies on TSMC 2.5D packaging: MediaTek-designed CPU die + NVIDIA GPU die, linked by NVLink-C2C (600 GB/s bidirectional per Hot Chips coverage). |
| `nv-dgxspark-128` | process | TSMC 3 nm | medium | https://www.theregister.com/2025/08/27/nvidia_blackwell_gb10/ | From NVIDIA's Hot Chips 2025 talk as reported by The Register; not on NVIDIA's spec pages. |
| `nv-dgxspark-128` | cores | 6,144 CUDA cores | high | https://docs.nvidia.com/dgx/dgx-spark/hardware.html | CPU: 20-core Arm (10 Cortex-X925 + 10 Cortex-A725). Up to 1 PFLOP FP4 with sparsity. |
| `nv-dgxspark-128` | memType | LPDDR5X-8533 | high | https://docs.nvidia.com/dgx/dgx-spark/hardware.html | NVIDIA docs: '16 channels (256 bit) LPDDR5X 8533'. The GB10 controller supports up to 9400 MT/s (Hot Chips), but DGX Spark ships at 8533. |
| `nv-dgxspark-128` | busBits | 256 | high | https://docs.nvidia.com/dgx/dgx-spark/hardware.html |  |
| `nv-dgxspark-128` | tdpW | 140 | high | https://docs.nvidia.com/dgx/dgx-spark/hardware.html | GB10 SoC TDP (CPU + GPU). System: 240 W external PSU, ~100 W left for ConnectX-7, SSD, USB-C etc. |
| `nv-dgxspark-128` | hostInterface | desktop system (150 x 150 x 50.5 mm); GB10 also in OEM mini-workstations | high | https://www.nvidia.com/en-us/products/workstations/dgx-spark/ | NVIDIA now also lists a 64GB configuration available only through OEM partners (not this device). |
| `nv-dgxspark-128` | interconnect | ConnectX-7 SmartNIC, 200 Gb/s via 2x QSFP (two Sparks direct; NVIDIA now says up to four) | high | https://forums.developer.nvidia.com/t/dgx-spark-gb10-faq/347344 | NVIDIA FAQ: 'You can stack 2 or 3 units directly, but for more, a network switch will be needed.' Product page: 'connection of up to four NVIDIA DGX Spark systems'. Plus 10 GbE RJ-45. |
| `nv-dgxspark-128` | launch | 2025-10 | high | https://nvidianews.nvidia.com/news/nvidia-dgx-spark-arrives-for-worlds-ai-developers | NVIDIA 2025-10-13: 'Starting Wednesday, Oct. 15, DGX Spark can be ordered on NVIDIA.com.' (Announced as Project DIGITS at CES 2025-01.) |
| `nv-dgxspark-128` | gpuShare | Unified, CPU-GPU coherent 128 GB pool; no fixed GPU carve-out | high | https://docs.nvidia.com/dgx/dgx-spark/known-issues.html | NVIDIA: 'DGX Spark systems use a unified memory architecture (UMA), where the GPU shares system memory'; nvidia-smi shows 'Memory-Usage: Not Supported'; cudaMemGetInfo may under-report allocatable memory (ignores reclaimable swap/page cache). Users report Linux `free -h` totals of ~119-121 GiB. |
| `nv-dgxspark-128` | discrepancy | — | — | — | Soft: GPU-usable 120 GB has no vendor basis. NVIDIA publishes no GPU share (unified pool). Linux reports ~119-121 GiB total (user reports: NVIDIA forum thread 350714, frankdenneman.ai), and the OS + CUDA context must fit in that too, so 120 leaves ~0 headroom; something like 110-115 is more realistic if the figure is meant as model-weight budget. |
| `nv-dgxspark-128` | discrepancy | — | — | — | Info: NVIDIA's Hot Chips material cites up to LPDDR5X-9400 (~301 GB/s) for the GB10 controller; the shipping DGX Spark is 8533 MT/s = 273 GB/s, which matches ours. |
| `nv-jetson-orin-64` | arch | Ampere | high | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ | '2048-core NVIDIA Ampere architecture GPU with 64 Tensor Cores'; CUDA compute capability 8.7 (developer.nvidia.com/cuda-gpus). |
| `nv-jetson-orin-64` | chip | Orin | high | https://hc34.hotchips.org/assets/program/conference/day2/ADAS%20and%20Grace/HC2022.NVIDIA.Mike_Ditty.v6.pdf |  |
| `nv-jetson-orin-64` | process | Samsung 8nm | high | https://hc34.hotchips.org/assets/program/conference/day2/ADAS%20and%20Grace/HC2022.NVIDIA.Mike_Ditty.v6.pdf | NVIDIA Hot Chips 34 (2022) Orin slides: 'Samsung 8nm'. |
| `nv-jetson-orin-64` | cores | 2048 CUDA cores, 64 Tensor Cores (16 SMs) | high | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ | CPU: 12-core Arm Cortex-A78AE v8.2. 16 SMs (2 GPC / 8 TPC) from NVIDIA Hot Chips 34 slides. 275 TOPS (sparse INT8, GPU + DLAs). |
| `nv-jetson-orin-64` | memType | LPDDR5 (6400 MT/s implied) | medium | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ | NVIDIA lists '64GB 256-bit LPDDR5, 204.8GB/s'; the 6400 MT/s data rate is derived (204.8 GB/s / 32 bytes), not printed on the page. |
| `nv-jetson-orin-64` | busBits | 256 | high | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ |  |
| `nv-jetson-orin-64` | tdpW | 15-60 | high | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ | Module power configurable 15 W - 60 W (Industrial variant 15-75 W). |
| `nv-jetson-orin-64` | hostInterface | edge system-on-module (also sold as Jetson AGX Orin Developer Kit) | high | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ | The original 2022 dev kit had 32GB; the 64GB column on NVIDIA's comparison table is shared with the current dev kit. |
| `nv-jetson-orin-64` | interconnect | none (dev kit: 10 GbE RJ-45, PCIe Gen4 x8 slot) | high | https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/ |  |
| `nv-jetson-orin-64` | launch | 2022-10 | medium | https://forums.developer.nvidia.com/t/jetson-orin-modules-schedule-update/212027 | NVIDIA schedule post (2022-04-20): 'OCT 2022 - Jetson AGX Orin 64GB' production module; press reported November 2022. Dev kit (32GB) ordering opened 2022-03-22. |
| `nv-jetson-orin-64` | gpuShare | Unified: CPU and iGPU share the same 64GB SoC DRAM; no fixed GPU carve-out | high | https://docs.nvidia.com/cuda/cuda-for-tegra-appnote/index.html | NVIDIA CUDA for Tegra: 'both the CPU (Host) and the iGPU share SoC DRAM memory'; 'device memory, host memory, and unified memory are allocated on the same physical SoC DRAM'. NVIDIA gives no GPU-usable figure; 56 GB is an OS-headroom assumption. |
| `nv-jetson-orin-64` | discrepancy | — | — | — | Minor: bandwidth ours 204 GB/s, NVIDIA 204.8 GB/s (rounding). |
| `nv-jetson-orin-64` | discrepancy | — | — | — | GPU-usable 56 GB is not a vendor figure (unified pool shared with Linux/L4T); fine as an assumption but label it as such. |

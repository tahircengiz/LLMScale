import type { Dtype, ModelArch } from "./calc";

// Shareable state encoded in the URL query string so a configured calculation
// can be linked directly (great for the "share this estimate" use case).

export interface AppState {
  hfId: string;
  arch: ModelArch | null;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  overheadPct: number;
  cudaContextGiB: number;
  gpuId: string;
}

export const DEFAULT_STATE: AppState = {
  hfId: "",
  arch: null,
  weightDtype: "bf16",
  kvDtype: "fp16",
  contextLength: 8192,
  concurrency: 1,
  overheadPct: 0.1,
  cudaContextGiB: 0.75,
  gpuId: "rtx4090-24",
};

export function encodeState(s: AppState): string {
  const p = new URLSearchParams();
  if (s.hfId) p.set("m", s.hfId);
  if (s.arch) {
    p.set("p", String(s.arch.numParams));
    p.set("L", String(s.arch.numLayers));
    p.set("h", String(s.arch.hiddenSize));
    p.set("a", String(s.arch.numAttentionHeads));
    p.set("k", String(s.arch.numKeyValueHeads));
    if (s.arch.headDim) p.set("d", String(s.arch.headDim));
  }
  p.set("wd", s.weightDtype);
  p.set("kd", s.kvDtype);
  p.set("ctx", String(s.contextLength));
  p.set("n", String(s.concurrency));
  p.set("ov", String(s.overheadPct));
  p.set("g", s.gpuId);
  return p.toString();
}

function num(v: string | null): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function decodeState(search: string): Partial<AppState> {
  const p = new URLSearchParams(search);
  const out: Partial<AppState> = {};
  if (p.get("m")) out.hfId = p.get("m")!;

  const numParams = num(p.get("p"));
  const numLayers = num(p.get("L"));
  const hiddenSize = num(p.get("h"));
  const numAttentionHeads = num(p.get("a"));
  const numKeyValueHeads = num(p.get("k"));
  if (numParams && numLayers && hiddenSize && numAttentionHeads && numKeyValueHeads) {
    out.arch = {
      numParams,
      numLayers,
      hiddenSize,
      numAttentionHeads,
      numKeyValueHeads,
      headDim: num(p.get("d")),
    } as ModelArch;
  }

  const wd = p.get("wd") as Dtype | null;
  if (wd) out.weightDtype = wd;
  const kd = p.get("kd") as Dtype | null;
  if (kd) out.kvDtype = kd;
  const ctx = num(p.get("ctx"));
  if (ctx) out.contextLength = ctx;
  const n = num(p.get("n"));
  if (n) out.concurrency = n;
  const ov = num(p.get("ov"));
  if (ov !== undefined) out.overheadPct = ov;
  if (p.get("g")) out.gpuId = p.get("g")!;
  return out;
}

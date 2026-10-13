// Reads a Hugging Face repository for the Serving Brief — in the browser, straight
// from the Hub, like hf.ts. CORS is open on the API, on resolve/ and on the CDN the
// weights redirect to, so the safetensors header of a single-file model can be read
// with two ranged requests instead of downloading the file.
//
// Only files the repository lists are requested, so a missing file is never a 404.
// A gated repository lists its files but answers 401 for their contents; those
// names are returned as unreadable and the brief says what it could not see.
//
// React-free: scripts/fetch-repo-fixture.ts uses it under Node to snapshot real
// repositories for scripts/test-serving.ts.

import { digestTensors, templateFrom, type RepoFile, type RepoSnapshot } from "./serving.ts";

const HF = "https://huggingface.co";

/** The small files the brief reads when a repository lists them. */
export const READ_FILES: ReadonlySet<string> = new Set([
  "config.json",
  "generation_config.json",
  "tokenizer_config.json",
  "chat_template.jinja",
  "chat_template.json",
  "hf_quant_config.json",
  "adapter_config.json",
  "params.json",
  "model.safetensors.index.json",
]);

// Configs are free-form JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

type Read<T> = { ok: true; value: T } | { ok: false; denied: boolean };

const fileUrl = (id: string, file: string) => `${HF}/${id}/resolve/main/${file.split("/").map(encodeURIComponent).join("/")}`;

async function readFile<T>(id: string, file: string, as: "json" | "text", ms = 10000): Promise<Read<T>> {
  try {
    const res = await fetchWithTimeout(fileUrl(id, file), ms);
    if (!res.ok) return { ok: false, denied: res.status === 401 || res.status === 403 };
    return { ok: true, value: (as === "json" ? await res.json() : await res.text()) as T };
  } catch {
    return { ok: false, denied: false };
  }
}

/** The JSON header of a .safetensors file: an 8-byte little-endian length, then
 *  that many bytes of JSON naming every tensor with its dtype, shape and offsets. */
export async function readSafetensorsHeader(id: string, file: string): Promise<Record<string, Json> | null> {
  try {
    const url = fileUrl(id, file);
    const head = await fetchWithTimeout(url, 10000, { headers: { Range: "bytes=0-7" } });
    if (head.status !== 206) return null;
    const n = Number(new DataView(await head.arrayBuffer()).getBigUint64(0, true));
    // A header is kilobytes to a few megabytes; anything larger is not one.
    if (!(n > 1 && n < 64 * 1024 * 1024)) return null;
    const body = await fetchWithTimeout(url, 20000, { headers: { Range: `bytes=8-${7 + n}` } });
    if (body.status !== 206) return null;
    return JSON.parse(await body.text());
  } catch {
    return null;
  }
}

/** Everything the brief reads from one repository. Throws only when the model API
 *  itself does not know the repository. */
export async function fetchSnapshot(id: string, opts: { tensors?: boolean } = {}): Promise<RepoSnapshot> {
  const wantTensors = opts.tensors !== false;
  const res = await fetchWithTimeout(`${HF}/api/models/${id}?blobs=true`, 10000);
  if (!res.ok) throw new Error(`Model not found: ${res.status}`);
  const info = await res.json();
  const files: RepoFile[] = (Array.isArray(info?.siblings) ? info.siblings : []).map((x: Json) => ({
    name: String(x.rfilename),
    size: typeof x.size === "number" ? x.size : undefined,
  }));
  const listed = new Set(files.map((f) => f.name));
  const unreadable: string[] = [];

  async function opt<T>(file: string, as: "json" | "text" = "json", ms?: number): Promise<T | undefined> {
    if (!listed.has(file)) return undefined;
    const r = await readFile<T>(id, file, as, ms);
    if (r.ok) return r.value;
    unreadable.push(file);
    return undefined;
  }

  const [config, generationConfig, tokenizerConfig, jinja, processor, hfQuantConfig, adapterConfig, mistralParams, index] = await Promise.all([
    opt<Json>("config.json"),
    opt<Json>("generation_config.json"),
    opt<Json>("tokenizer_config.json"),
    opt<string>("chat_template.jinja", "text"),
    opt<Json>("chat_template.json"),
    opt<Json>("hf_quant_config.json"),
    opt<Json>("adapter_config.json"),
    opt<Json>("params.json"),
    // DeepSeek-V3's index names 91,991 tensors in about 8 MB; a caller that only
    // needs the chat template (the vLLM page) skips it.
    wantTensors ? opt<Json>("model.safetensors.index.json", "json", 30000) : Promise.resolve(undefined),
  ]);

  let tensors: RepoSnapshot["tensors"] = null;
  let tensorFile: string | undefined;
  if (index?.weight_map) {
    tensors = digestTensors(Object.keys(index.weight_map));
    tensorFile = "model.safetensors.index.json";
  } else if (wantTensors) {
    // No index: a model small enough for one file. Read that file's header.
    const single = files.filter((f) => !f.name.includes("/") && /^(model|consolidated)\.safetensors$/.test(f.name));
    if (single.length === 1) {
      const header = await readSafetensorsHeader(id, single[0].name);
      if (header) {
        tensors = digestTensors(Object.keys(header).filter((k) => k !== "__metadata__"));
        tensorFile = single[0].name;
      } else if (info?.gated) unreadable.push(single[0].name);
    }
  }

  if (tokenizerConfig) delete tokenizerConfig.added_tokens_decoder;
  const st = info?.safetensors;
  return {
    id: String(info?.id ?? id),
    gated: Boolean(info?.gated) && info?.gated !== false,
    files,
    unreadable: unreadable.length ? unreadable : undefined,
    tags: Array.isArray(info?.tags) ? info.tags : [],
    pipelineTag: info?.pipeline_tag,
    libraryName: info?.library_name,
    dtypeParams: st?.parameters,
    numParams: st?.total ?? info?.gguf?.total,
    config,
    generationConfig,
    tokenizerConfig,
    chatTemplate: templateFrom(tokenizerConfig, jinja, processor),
    hfQuantConfig,
    adapterConfig,
    mistralParams,
    tensors,
    tensorFile,
  };
}

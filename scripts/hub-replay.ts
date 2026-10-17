// Hugging Face Hub answers from files, so tests can run the app's own resolver
// (src/lib/hf.ts, resolveModel) without the network: the model API record and any
// file under resolve/main/ (config.json, hf_quant_config.json), each kept under a
// name made from its URL. Anything not kept answers 404, which is also what a gated
// repo's config gives a browser. Used by scripts/test-regression.ts and the sweeps;
// scripts/regression-fixtures.ts writes the files.

import { existsSync, readFileSync } from "node:fs";

const HF = "https://huggingface.co";

/** owner/name → owner--name (a name can hold "_", so "_" would be ambiguous). */
export const slug = (id: string) => id.replace("/", "--");

/** The file a Hub URL the resolver asks for is kept under, or null for a URL it does not keep. */
export function hubFile(url: string): string | null {
  if (!url.startsWith(HF + "/")) return null;
  const path = url.slice(HF.length + 1);
  const api = /^api\/models\/([^/?]+\/[^/?]+)(?:\?.*)?$/.exec(path);
  if (api) return `${slug(api[1])}.api.json`;
  const raw = /^([^/]+\/[^/]+)\/resolve\/main\/([^/?]+)$/.exec(path);
  if (raw) return `${slug(raw[1])}.${raw[2]}`;
  return null;
}

/** Serves fetch from the kept files in `dir`; returns a function that puts the real fetch back. */
export function replayHub(dir: URL): () => void {
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const name = hubFile(input instanceof Request ? input.url : String(input));
    const file = name ? new URL(name, dir) : null;
    if (file && existsSync(file)) return new Response(readFileSync(file, "utf8"), { status: 200 });
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = real;
  };
}

/** The repo ids a fixture directory lists in its repos.txt (# starts a comment). */
export function listedRepos(dir: URL): string[] {
  return readFileSync(new URL("repos.txt", dir), "utf8")
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);
}

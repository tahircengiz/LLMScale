// Snapshots real repositories for scripts/test-serving.ts, through the same
// reader the page uses (src/lib/repoFetch.ts), so a fixture is exactly what the
// browser would have seen that day.
// Run: node scripts/fetch-repo-fixture.ts Qwen/Qwen3-32B deepseek-ai/DeepSeek-V3 …

import { mkdirSync, writeFileSync } from "node:fs";
import { fetchSnapshot } from "../src/lib/repoFetch.ts";

const dir = new URL("./fixtures/repos/", import.meta.url);
mkdirSync(dir, { recursive: true });

for (const id of process.argv.slice(2)) {
  try {
    const s = await fetchSnapshot(id);
    writeFileSync(new URL(`${id.replace("/", "_")}.json`, dir), JSON.stringify(s) + "\n");
    console.log(`${id}: ${s.files.length} files, ${s.tensors?.total ?? 0} tensors${s.unreadable ? `, unreadable ${s.unreadable.join(" ")}` : ""}`);
  } catch (e) {
    console.log(`${id}: FAILED ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

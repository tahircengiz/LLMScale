# Model-parsing regression fixtures

What `scripts/test-regression.ts` replays: the Hugging Face Hub's answers for the 83
repos in `repos.txt`, a subset of the 273 the 2026-10-15 data audit ran through the
resolver, covering every family and edge case it hit (Gemma 3/3n/4, Nemotron-H and
NAS, Jamba, Falcon-H1, Kimi-Linear, GLM-5.x, MiMo-V2, MiniMax, Step-3.5, ChatGLM,
Falcon MQA, StarCoder MQA, Llama 4, Qwen2.5/3/3.5+ and VL/Omni, DeepSeek V3/V3.2/V4,
gpt-oss, Mistral v0.1 sliding, and GGUF/AWQ/NVFP4/ModelOpt/bnb/MLX derivatives).

- `<owner>--<name>.api.json` — the model API record (`/api/models/<id>?blobs=true`),
  trimmed to the fields `fetchModelInfo` (src/lib/hf.ts) reads.
- `<owner>--<name>.config.json`, `.hf_quant_config.json` — the files as served.
- Anything else the resolver asks for answers 404, as a gated repo's config does in a browser.
- `golden.json` — what the resolver and the sizing give for each repo.

Configs and metadata only, no weights. The files are data: the test parses them and
never runs anything from them.

Provenance: the audit runner's cache on GTR9 (`~/projects/LLMScale-audit-models/audit/cache`
and `mirrors/`, fetched 2026-10-15), plus four answers the cache did not hold, fetched
anonymously on 2026-10-17 (`unsloth/Llama-4-Maverick-17B-128E-Instruct-FP8` config and
three ModelOpt `hf_quant_config.json`).

## When the test fails

It lists every value that moved, old → new. If the change is intended (a fix to the
parsing or the sizing), accept it and say why in the commit:

```bash
node scripts/test-regression.ts --update
git diff -- scripts/fixtures/configs-regression/golden.json
```

## Adding a repo or refreshing from the Hub

```bash
node scripts/regression-fixtures.ts owner/name
node scripts/test-regression.ts --update
```

List the repo in `repos.txt` as well. Without ids, `regression-fixtures.ts` refetches every
listed repo; a refresh changes the numbers wherever a repo changed upstream, so read the
golden diff before committing it.

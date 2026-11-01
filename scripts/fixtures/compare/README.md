# The default comparison's Hub answers

What the build writes into `compare.html` and `tr/compare.html` (`scripts/compareReplay.ts`):
the Hugging Face Hub's answers for the two models the page opens with (`DEFAULT_IDS` in
`src/lib/compareSnapshot.ts`), so a reader that runs no JavaScript gets the table's values
instead of dashes. The page starts from the same copy and swaps in the Hub's live answers.

- `<owner>--<name>.api.json` — the model API record (`/api/models/<id>?blobs=true`), trimmed
  to the fields `fetchModelInfo` (src/lib/hf.ts) reads, counts included: downloads, likes,
  licence, last change.
- `<owner>--<name>.config.json` — the file as served.
- `fetched.json` — the day they were fetched. The page shows it beside the values
  ("Hugging Face data as of …") until the live answers arrive.
- `golden.json` — the copy the build writes, pinned by `scripts/test-compare.ts`.

Configs and metadata only, no weights. The files are data: the build parses them and never
runs anything from them.

## Refreshing

The build leaves the table without values, and says so, once these answers are more than
90 days older than the commit it builds (`MAX_AGE_DAYS`), or when a default model has none.

```bash
node scripts/compare-fixtures.ts
node scripts/test-compare.ts --update
git diff -- scripts/fixtures/compare/golden.json
```

A refresh moves `compare.html`'s `dateModified` and sitemap `<lastmod>`: the page now says
something different.

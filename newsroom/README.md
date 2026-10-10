# Newsroom

Drafts the posts of LLMScale's news feed. It reads a set of public sources,
asks Claude which of the new items are worth a post, has Claude write those up
in English and Turkish, and keeps the results as drafts for a person to review.
Nothing it writes reaches the site on its own: a draft becomes a post only when
it is approved and committed to [`content/feed/`](../content/feed/README.md).

```
sources ─► collect ─► screen (Claude) ─► write (Claude) ─► drafts ─► review ─► content/feed/*.json ─► build
           keyword      score 0–10,        EN + TR post,      SQLite    a person
           pre-filter   duplicates         checked by
                                           validatePost()
```

| File | What it does |
|---|---|
| [`sources.ts`](sources.ts) | The feeds and APIs read, and which hosts count as primary sources |
| [`collect.ts`](collect.ts) | Reads them, keeps recent items, remembers every URL it has seen |
| [`relevance.ts`](relevance.ts) | The keyword pre-filter that keeps off-topic items away from Claude |
| [`draft.ts`](draft.ts) | Screening and writing; checks each post and the links it cites |
| [`prompts.ts`](prompts.ts) | What Claude is asked, and the JSON schemas its answers must fit |
| [`claude.ts`](claude.ts) | The Claude API call (the only file that needs the SDK) |
| [`store.ts`](store.ts) | The SQLite database of items, drafts and runs |
| [`cli.ts`](cli.ts) | The commands |

## Running it

From the repository root, with Node 22.18 or newer (`node:sqlite` is built in):

```bash
node newsroom/cli.ts collect          # no key needed
ANTHROPIC_API_KEY=… node newsroom/cli.ts run
node newsroom/cli.ts list             # pending drafts
node newsroom/cli.ts show <draft-id>
node newsroom/cli.ts preview && FEED_DIR=newsroom/data/preview-feed npm run build
```

| Variable | Default | |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | needed by `screen`, `write` and `run` |
| `ANTHROPIC_BASE_URL` | the Claude API | point it at a gateway to route the calls through it |
| `NEWSROOM_MODEL` | `claude-opus-5-5` | one model for both steps |
| `NEWSROOM_MIN_SCORE` | `7` | the screening score an item needs to be written up |
| `NEWSROOM_MAX_DRAFTS` | `4` | drafts written per run |
| `NEWSROOM_DB` | `newsroom/data/newsroom.db` | not in git |

## What keeps a draft honest

- **Sources are data.** Collected text reaches Claude only inside the user turn,
  marked as source text, and Claude has no tools. The prompts tell it to ignore
  instructions found there; the checks below do not rely on it doing so.
- **Links come from the item.** A post may cite only the item's own URL and the
  primary-source links found in it. Any other link Claude returns is dropped and
  recorded as a problem.
- **Numbers come from the engine.** For a post about a model, Claude is given
  the memory figures LLMScale's engine computes for it — the same ones the post's
  memory card will show — and told to add no figure that is not in the source.
  A model the site does not bundle has its architecture read from its
  `config.json` once, at drafting, and stored in the post (`arch`), so the build
  draws its card without going to the Hub.
- **The feed's own rules apply.** Every draft goes through `validatePost()`, the
  check the build runs; a draft that fails it is stored with its problems listed.
- **A person decides.** Drafts wait for review. The reviewer sees the source,
  the screener's reason, the writer's notes and every problem found.

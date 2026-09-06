# Launch post drafts

Not published by anyone but you. The traffic data says the bottleneck is that
nobody knows the tool exists — two weeks, 60 sessions, two of them from a search
engine and essentially no referrers. The product holds up: it resolves
multimodal configs, follows `base_model` on GGUF repos, and models MLA.

**The source is not published, and these drafts are written for that.** They
never say open source, never mention a licence, and never invite anyone to read
the code — an invitation nobody can accept reads as a bluff and would be the one
thing to discredit the rest.

That costs less than it sounds like. The claim worth making is checkable without
the source: the formula is in a public paper, and the tool's own output either
matches it or does not. A reader can do the arithmetic in their head. That is a
stronger position than "trust my tests", which is what an open repo would have
offered anyway.

---

## r/LocalLLaMA

Title:

> Most VRAM calculators get DeepSeek wrong by 25× — here's the formula, and a tool that uses it

Body:

> Standard KV-cache arithmetic is `2 × layers × kv_heads × head_dim × bytes`.
> Apply it to DeepSeek-V3 and you get 13.34 GiB at 8k context for one user.
>
> The real figure is 0.54 GiB, because DeepSeek uses multi-head latent attention:
> it caches **one compressed latent per token per layer**, shared across every
> head, so the head count drops out of the formula entirely. DeepSeek-V2 §2.1.3
> gives it as `(d_c + d_h^R) · l` — that is `kv_lora_rank + qk_rope_head_dim`,
> both of which are sitting in the config:
>
>     61 layers × (512 + 64) × 2 bytes = 68.6 KiB per token
>
> The paper also notes this equals "GQA with only 2.25 groups", which checks out:
> 512 + 64 = 4.5 × 128, and 4.5 / 2 = 2.25.
>
> I had this wrong in my own calculator until last week. It is fixed now, along
> with the rest of what a rule of thumb misses — real GQA layouts read from the
> Hub, MoE with every expert resident for memory but only the active ones for
> decode speed, and fine-tuning memory for LoRA/QLoRA/full:
>
> https://tahircengiz.github.io/LLMScale/
>
> Free, runs entirely in your browser, no account. Try it on a model you already
> know the numbers for — if it disagrees with you, I want to hear about it, since
> two of the errors I have fixed came from checking against published results
> rather than from being clever.

---

## Hacker News (Show HN)

Title:

> Show HN: A VRAM calculator that models MLA, MoE and real GQA layouts

Body:

> I kept doing LLM memory arithmetic on napkins and getting it wrong, so I built
> the tool I wanted: https://tahircengiz.github.io/LLMScale/
>
> The interesting part was not the arithmetic, it was how much the usual shortcut
> misses. The standard KV-cache formula overstates DeepSeek-V3's cache by 25× —
> it uses multi-head latent attention, caching one compressed latent per layer
> rather than a key/value tensor per head. DeepSeek-V2 §2.1.3 gives the real
> expression as `(d_c + d_h^R)·l`, and both terms are in the model's config.
> My own tool shipped the wrong number until I checked it against the paper.
>
> So the working rule became: no behavioural claim ships until it reproduces a
> published result. ZeRO's 16 bytes/parameter for mixed-precision Adam. QLoRA
> fine-tuning a 65B model on a single 48GB card — the tool puts it at 43.3 GiB,
> and getting there surfaced two real bugs in my fine-tuning model, an FFN width
> I had guessed instead of read and an NF4 constant that was off. gpt-oss-120b
> fitting one 80GB GPU, as its model card claims.
>
> Free, entirely client-side, no account, no backend. The calculation happens in
> your browser; visits are counted anonymously with self-hosted Umami, and since
> the app keeps its state in the URL, the model you pick is part of what that
> counter sees.
>
> Best way to judge it is to run a model whose numbers you already know.

---

## Hugging Face forum / discussion thread

Short enough to drop into a thread about a specific model:

> If you are sizing this for serving, https://tahircengiz.github.io/LLMScale/
> reads the config straight from the Hub and gives weights + KV cache at your
> context and concurrency, plus which GPUs fit. It handles GQA, MLA and MoE
> properly, and every assumption is stated on the page rather than buried.

---

## What to expect, honestly

- **It may go nowhere.** Most such posts do. One that lands beats ten that
  don't, and the way to land is a claim a stranger can check in thirty seconds.
- **The MLA finding is the hook, and it survives the source being closed** —
  the evidence is a public paper and a number anyone can recompute. Leading with
  a bug you fixed is what makes the rest credible.
- **Do not claim adoption, and do not imply the code is open.** There is no
  adoption yet, and the repo is private. Either claim would be the thing people
  seize on.
- **Expect "why is it closed?"** on HN in particular. The honest answer is that
  it is a personal project and the source is not published; nothing more is
  required.
- **Watch what arrives.** The weekly digest separates search traffic from
  referrers, so a spike will be attributable. Sessions that move off the default
  model are the ones that mean something.

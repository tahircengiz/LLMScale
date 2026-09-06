# Launch post drafts

Not published by anyone but you. The traffic data says the bottleneck is that
nobody knows the tool exists — two weeks, 60 sessions, two of them from a search
engine and essentially no referrers. The product itself holds up (it resolves
multimodal configs, follows `base_model` on GGUF repos, and now models MLA), so
this is a distribution problem, not a product one.

**Before posting:** these communities punish self-promotion that arrives without
substance and reward a specific, checkable claim. Every draft below leads with
what the tool gets *right that others get wrong*, because that is the only part
worth someone's attention.

---

## r/LocalLLaMA

Title:

> I built a VRAM calculator that models MLA, MoE and real GQA layouts — and it found a 25× error in its own numbers

Body:

> Most VRAM calculators are `params × 2` plus a fudge factor. I wanted one that
> models the parts that actually decide the answer, so I built LLMScale:
> https://tahircengiz.github.io/LLMScale/
>
> What it does differently:
>
> - **Reads the real config** from the HF Hub — the actual GQA layout, not an
>   assumption. Handles multimodal configs where the LLM dims are nested under
>   `text_config`, and follows `base_model` for GGUF repos that ship no config.
> - **Models MLA.** DeepSeek caches one compressed latent per layer instead of a
>   K/V pair per head. Using the ordinary formula puts DeepSeek-V3's cache at
>   13.34 GiB at 8k context; the real figure is 0.54 GiB. My own tool had this
>   wrong until last week — the fix is validated against DeepSeek-V2 §2.1.3,
>   including the paper's own "equal to GQA with 2.25 groups" identity.
> - **MoE properly**: every expert resident for memory, only the active ones for
>   decode speed. Qwen3-30B-A3B and Qwen3-32B are nearly the same size but ~8×
>   apart in tok/s.
> - **Fine-tuning too** — LoRA/QLoRA/full, checked against the QLoRA paper's
>   65B-on-one-48GB result (43.3 GiB).
> - Also: which GPUs fit, how many concurrent users, max context per user, and a
>   `vllm serve` command with the reasoning for each flag.
>
> Entirely client-side, no account, no backend. MIT.
>
> Happy to be told where the numbers are wrong — that is genuinely the useful
> feedback. Two of the errors above were found by checking against published
> results rather than by me being clever.

---

## Hacker News (Show HN)

Title:

> Show HN: LLMScale – a VRAM calculator that models MLA, MoE and real GQA layouts

Body:

> I kept doing LLM memory arithmetic on napkins and getting it wrong, so I built
> the tool I wanted: https://tahircengiz.github.io/LLMScale/
>
> The interesting part was not the arithmetic, it was discovering how much the
> usual shortcut misses. Applying the standard KV-cache formula to DeepSeek-V3
> overstates its cache 25× — it uses multi-head latent attention, which caches
> one compressed latent per layer rather than a key/value tensor per head. My own
> tool shipped that error until I checked it against the DeepSeek-V2 paper.
>
> So every behavioural claim in it is now validated against a published result
> and pinned as a test: ZeRO's 16 bytes/parameter for mixed-precision Adam,
> QLoRA's 65B-on-a-single-48GB-card, MLA's `(d_c + d_h^R)·l`, and gpt-oss-120b
> fitting one 80GB card. Two real bugs in my fine-tuning model surfaced that way
> — an FFN width I had guessed instead of read, and an NF4 constant that was off.
>
> Client-side, no backend, no account. Vite/React/TS, MIT.

---

## Hugging Face forum / model-card snippet

Short enough to drop in a discussion thread:

> If you are sizing this for serving, https://tahircengiz.github.io/LLMScale/
> reads the config straight from the Hub and gives weights + KV cache at your
> context and concurrency, plus which GPUs fit. It handles GQA, MLA and MoE
> properly, and the assumptions are stated on the page rather than buried.

---

## What to expect, honestly

- **It may go nowhere.** These posts mostly do. One that lands is worth more
  than ten that do not, and the way to land is a claim someone can check.
- **The MLA finding is the hook.** It is specific, surprising, verifiable, and
  it makes the tool credible precisely because it is an admission of a bug.
- **Do not claim adoption.** There is none yet and inventing it would be the one
  thing that discredits everything else on the page.
- **Watch what arrives.** The weekly digest already separates search traffic
  from referrers, so a spike will be attributable. Sessions that move off the
  default model are the ones that mean something.

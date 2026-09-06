# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: professionals doing capacity planning.** Infrastructure and ML
engineers and solution architects deciding how many of which GPUs a model needs
before they commit — to serve it, to fine-tune it, or to hand the numbers to
someone who signs off. They arrive mid-task with a specific model in mind and
leave with a decision.

**Secondary: people running models on their own hardware**, choosing a card or
checking what fits on the one they own.

Both are served, but the professional wins ties: defaults, depth, and vocabulary
are set for the data-center case, and the enthusiast still finds their way. The
hardware list spans consumer cards through to data-center and unified-memory
devices for this reason.

## Product Purpose

Answer "how much GPU memory does this model actually need, and what runs it?"
without the user having to trust a rule of thumb.

The site models the terms that decide the answer — weights at a chosen
precision, KV cache scaled by context window and concurrent users using each
model's real grouped-query attention layout, MoE models holding every expert
resident rather than only the active ones, activation and fragmentation
overhead, and CUDA context — then reports which devices fit, how many concurrent
users a card supports, and the maximum context for a single user.

Around that core it also covers fine-tuning memory (LoRA, QLoRA, full),
decode speed as a bandwidth-bound estimate, vLLM launch parameters, task-to-model
fit, model anatomy, side-by-side comparison, model-name decoding, and a
standalone explainer for people meeting the concepts for the first time.

Success is all of: people use it and come back, it stands as evidence of the
author's expertise, it warms the same audience as the GPU PaaS work under way,
and it answers the author's own sizing questions first.

## Positioning

Most estimates are `params × 2`. This one models what that misses, and says so:
real per-model GQA layouts read live from the Hugging Face Hub, MoE loading all
experts, and every assumption named on the page rather than buried — 95% of
nominal VRAM usable after driver reserve, flash-attention assumed for
activations, bandwidth efficiency stated for decode estimates.

The engine is validated against published results rather than only against
itself: the ZeRO paper's 16 bytes-per-parameter identity for mixed-precision
Adam, and QLoRA's fine-tuning of a 65B model on a single 48 GB card. Both are
permanent tests, so the constants cannot drift quietly.

It computes entirely in the browser. There is no backend and no account, so the
sizing itself is never sent anywhere to be performed. (The chosen model and
settings do travel, in the page URL, to the analytics tracker — see Brand
Commitments.)

## Operating Context

Used mid-decision, not browsed: someone has a model and a budget or a rack and
needs a number. State lives in the URL, so an estimate is shareable as a link
and a shared link pins its own model and device.

Model architecture resolves live from the Hugging Face Hub (`config.json` plus
the model API), with a bundled database covering popular gated models — Llama,
Gemma, Mistral — whose config a browser cannot read.

The interface is bilingual, English and Turkish, with every string going through
the dictionary.

## Capabilities and Constraints

- **Fully client-side.** Static site, no backend, no server state, no account.
  All computation happens in the browser.
- **Static hosting.** Published to GitHub Pages from the `gh-pages` branch;
  Vite `base` is the repo path. Multi-page build, one HTML entry per surface.
- **Cost and pricing are deliberately out of scope.** The purpose is technical
  help. No prices, no cost-per-token, no purchasing advice.
- **Analytics are anonymous and cookieless** (self-hosted Umami), but not
  contentless: the app keeps its state in the URL, so the tracker receives the
  model, precision, context, concurrency and device on every pageview. This is
  what the traffic report is built from, and the footer must keep saying only
  what is true of it.
- **Tests run through Node's type stripping**, which executes `.ts` but not
  `.tsx`, and a React import breaks it outright. Anything a test must read has
  to live in a React-free module under `src/lib/`. This has already forced two
  splits (`dict.ts` out of `i18n.ts`, `theme.ts` out of `App.tsx`).
- **Three themes** — dark, light, and a translucent "glass" material. Glass is
  the default for a first-time visitor unless their OS asks for dark; a stored
  choice outranks both.
- **Not modeled:** MLA attention (DeepSeek) and engine-specific paged-attention
  efficiency. Estimates are for capacity planning and are labelled as such, not
  presented as guarantees.

## Brand Commitments

- Name: **LLMScale**. Built by Tahir Cengiz.
- **The repository is private and the source is not published.** The tool itself
  is free and public. This is a live constraint, not a detail: nothing may claim
  an open-source licence, invite people to read the code, or promise pull
  requests, and there is no LICENSE file to point at. Credibility has to rest on
  what a reader can verify from outside — the published papers the engine is
  checked against, and the tool's own output.
- Bilingual English/Turkish is a product commitment, not a feature — new copy
  ships in both.
- **The computation stays client-side.** No backend performs the sizing and no
  account is required; nothing may introduce a server round-trip for the
  calculation itself without the user deciding to change that.
  Note this is narrower than it once read. The footer previously claimed inputs
  never leave the browser, which was not true: the app encodes its full state in
  the URL and the analytics tracker transmits that URL, model and settings
  included. The copy was corrected rather than the collection stopped — the
  traffic report is built on exactly that data — so the accurate promise is
  about where the work happens, not about what is counted.
- Existing assets: `public/favicon.svg`, `public/og.png`.

## Evidence on Hand

**Real, in the repository:**
- A validated memory engine, with external checks encoded as permanent tests:
  ZeRO's `2Ψ+2Ψ+12Ψ = 16Ψ` bytes per parameter, and QLoRA's 65B on one 48 GB
  card (the model reproduces it at 43.3 GiB).
- A bundled model database for gated models, and a device database spanning
  consumer, workstation, data-center, Apple, and unified-memory hardware with
  real bandwidth figures.
- An invariants suite that guards against the drift class that has actually bitten
  this project — duplicated hardcoded lists silently disagreeing.

**Absent, and not to be invented:** no testimonials, no named users or
customers, no traffic or adoption figures, no benchmarks of the site itself, no
endorsements. Future work must not fabricate any of these.

## Product Principles

1. **Show the working.** Every figure names its formula and its assumptions. The
   tool teaches while it calculates; a number nobody can check is not the
   product.
2. **Measure, do not assert.** A behaviour claimed to be better gets validated —
   against a published result, a test, or a real measurement — before it ships.
   This applies to the memory model and to the interface alike.
3. **Technical help only.** Cost, pricing, and purchasing advice stay out, so the
   tool stays trustworthy on the one thing it does.
4. **The calculation stays in the browser.** No backend performs the sizing;
   that is a promise to the user, not an implementation detail to optimize away.
   It is a claim about where the work happens — keep it stated that precisely,
   because what a visitor calculates is counted.
5. **Professional depth wins ties, but the newcomer keeps a path in.** Defaults
   and vocabulary serve the practitioner; the explainer surfaces exist so the
   depth does not become a wall.

## Accessibility & Inclusion

**WCAG 2.1 AA is binding.** Concretely, and enforced rather than aspired to:

- Body text at 4.5:1, large text at 3:1.
- Non-text contrast (1.4.11) at 3:1 for the boundaries of interface components,
  including selected and focused states.
- Keyboard operability and screen-reader-announced state for controls that carry
  meaning — a selected item announces that it is selected.
- Contrast is measured against the **real composited background**, not judged by
  eye. The glass theme layers translucent panes over a colour field, so a token's
  contrast depends on what is behind it; the worst case is the binding one, and
  it is re-measured whenever a pane is thinned or the field is strengthened.

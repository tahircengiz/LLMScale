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
model's real grouped-query or multi-head latent attention layout, MoE models
holding every expert resident rather than only the active ones, activation and
fragmentation overhead, and CUDA context — then reports which devices fit, how
many concurrent users a card supports, and the maximum context for a single user.

Around that core it also covers fine-tuning memory (LoRA, QLoRA, full),
decode speed as a bandwidth-bound estimate, vLLM launch parameters, task-to-model
fit, model anatomy, side-by-side comparison, model-name decoding, and a
standalone explainer for people meeting the concepts for the first time. Guides
generated from the same engine answer the questions people search for: a page
per preset model, a page per commonly searched GPU, and concept guides to the KV
cache, attention variants and quantization.

Success is all of: people use it and come back, it stands as evidence of the
author's expertise, it warms the same audience as the GPU PaaS work under way,
and it answers the author's own sizing questions first.

## Positioning

Most estimates are `params × 2`. This one models what that misses, and says so:
real per-model GQA and MLA layouts read live from the Hugging Face Hub, MoE
loading all experts while decoding through only the active ones, and every
assumption named on the page rather than buried — 95% of a discrete card's
memory usable after the driver reserve and a unified-memory device's addressable
share, flash-attention assumed for activations, bandwidth efficiency stated for
decode estimates.

The engine is validated against published results rather than only against
itself: the ZeRO paper's 16 bytes-per-parameter identity for mixed-precision
Adam, QLoRA's fine-tuning of a 65B model on a single 48 GB card, DeepSeek-V2's
MLA cache formula, gpt-oss-120b fitting one 80 GB GPU, and the active parameter
counts of MoE model cards. All are permanent tests, so the constants cannot drift
quietly.

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

The site is bilingual, English and Turkish, and the URL decides the language:
every page has an English address and a Turkish one under `/tr/`, tied together
with hreflang. A visitor whose preference differs from the page's is offered the
other version and never redirected. The app's strings go through the dictionary
(`src/lib/dict.ts`); the Turkish heads of the entry pages live in
`src/lib/pageMeta.ts`, and the generated guides carry both languages in their
generators.

## Capabilities and Constraints

- **Fully client-side.** Static site, no backend, no server state, no account.
  All computation happens in the browser.
- **Static hosting.** Published to GitHub Pages from the `gh-pages` branch;
  Vite `base` is the repo path. The build prerenders every entry to HTML in both
  languages (`scripts/prerender.ts`), generates the model, GPU and concept guides
  from the engine (`scripts/genPages.ts`, `scripts/concepts.ts`), and reads the
  sitemap off the built pages (`scripts/sitemap.ts`). The app replaces the
  prerendered markup rather than hydrating it.
- **Cost and pricing are deliberately out of scope.** The purpose is technical
  help. No prices, no cost-per-token, no purchasing advice.
- **Analytics are anonymous and cookieless** (self-hosted Umami), but not
  contentless: the app keeps its state in the URL, so the tracker receives the
  model, precision, context, concurrency and device on every pageview. This is
  what the traffic report is built from, and the footer must keep saying only
  what is true of it. The guides carry no query, so they add visits but never a
  model or device.
- **Tests run through Node's type stripping**, which executes `.ts` but not
  `.tsx`, and a React import breaks it outright. Anything a test or a build-time
  generator must read has to live in a React-free module under `src/lib/`. This
  has already forced several splits (`dict.ts` out of `i18n.ts`, `theme.ts` out of
  `App.tsx`, `learnChapters.js` out of `learn.js`).
- **Three themes** — dark, light, and a translucent "glass" material. Glass is
  the default for a first-time visitor unless their OS asks for dark; a stored
  choice outranks both.
- **Not modeled:** engine-specific paged-attention efficiency, prefill (time to
  first token), and sliding-window layers such as Gemma 2's and gpt-oss's, which
  cache less than the KV formula counts. Estimates are for capacity planning and
  are labelled as such, not presented as guarantees.

## Brand Commitments

- Name: **LLMScale**. Built by Tahir Cengiz.
- **The source is public under AGPL-3.0-only** (since 2026-09-09). The tool itself
  is free. LLMScale is a hosted web app, so section 13 is the part that matters:
  anyone running a modified copy for other people over a network owes those users
  their source, and the site's footer links the repository to offer it. Credibility
  still rests first on what a reader can verify without reading any code — the
  published results the engine is checked against, and the tool's own output.
  Nothing invites contributions or promises support; say so only once it is
  actually offered.
- Bilingual English/Turkish is a product commitment, not a feature — new copy
  ships in both, and each language keeps its own address.
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
  ZeRO's `2Ψ+2Ψ+12Ψ = 16Ψ` bytes per parameter, QLoRA's 65B on one 48 GB card
  (the model reproduces it at 43.3 GiB), DeepSeek-V2's MLA cache per token,
  gpt-oss-120b on one 80 GB GPU, and MoE active parameters estimated from real
  configs against their model cards.
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

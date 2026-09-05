---
name: LLMScale
description: A calibrated readout for GPU memory — near-neutral surfaces, colour reserved for signal, every figure traceable to its formula.
colors:
  ink-void: "#090b10"
  ink-card: "#14171f"
  ink-inset: "#1b1f2a"
  ink-well: "#232834"
  ink-line: "#333a49"
  signal-indigo: "#5d5fef"
  signal-indigo-light: "#9698f7"
  signal-indigo-deep: "#4a4cd4"
  readout-green: "#00e096"
  readout-green-deep: "#00c886"
  caution-amber: "#fcd34d"
  fault-rose: "#fda4af"
  control-edge: "#646d82"
  text-primary: "#e7e9ef"
  text-muted-high: "#c3c8d4"
  text-muted-mid: "#a1a8b8"
  text-muted-low: "#868ea0"
  on-signal: "#ffffff"
  chart-indigo-soft: "#8b8cf5"
  chart-green-deep: "#3cd856"
  chart-amber: "#f5c33b"
  chart-orange: "#ff947a"
  chart-rose: "#fa5a7d"
  chart-violet: "#bf83ff"
  chart-violet-deep: "#a700ff"
  chart-blue: "#0095ff"
  chart-teal: "#00b8d9"
  chart-grey: "#737791"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.025em"
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.025em"
rounded:
  lg: "0.5rem"
  xl: "0.75rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-indigo-deep}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.xl}"
    padding: "0.375rem 0.75rem"
    typography: "{typography.body}"
  segmented-option-active:
    backgroundColor: "{colors.signal-indigo-deep}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    typography: "{typography.label}"
  segmented-option-idle:
    textColor: "{colors.text-muted-high}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
    padding: "1rem"
  stat-tile:
    backgroundColor: "{colors.ink-inset}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "0.75rem"
  input-number:
    backgroundColor: "{colors.ink-inset}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.xl}"
    padding: "0.5rem 0.75rem"
    typography: "{typography.body}"
  badge-neutral:
    textColor: "{colors.text-muted-high}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
  badge-good:
    textColor: "{colors.readout-green}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
  step-marker:
    textColor: "{colors.signal-indigo-light}"
    rounded: "{rounded.full}"
    size: "1.5rem"
    typography: "{typography.label}"
---

# Design System: LLMScale

## Overview

**Creative North Star: "The Calibrated Instrument"**

This is a panel you trust because it shows its own tolerances. Every figure on
screen is traceable to a formula the page will name if asked, and the surface it
sits on is deliberately quiet so the figure is the loudest thing in view. The
system reads as instrumentation rather than as an app: near-neutral surfaces
stepped by luminance, hairline boundaries, and colour spent only where it
carries a reading.

The colour discipline is the whole personality. Surfaces are a five-step
near-neutral ink ramp — the layering model behind IBM Carbon's g100 and
Material's dark theme — with saturation held near zero. An earlier version made
every surface a saturated navy; the result read as one colour and left the brand
indigo nowhere to land. Desaturating the surfaces is what gives the indigo and
the green their meaning: when something is indigo it is interactive, when
something is green it fits, and neither has to compete with the background for
attention.

Three themes exist and they are not three skins. Dark is the baseline the tokens
are defined on. Light overrides those tokens. **Glass is a material, not a
colour scheme**: translucent panes blurred and saturated over a fixed colour
field, so what a pane shows depends on what is behind it. That difference is
load-bearing — contrast in glass has to be measured against the composited
result, never assumed from a token.

**Key Characteristics:**
- Near-neutral surfaces; colour reserved for signal
- No web fonts — the system UI stack, loaded instantly
- Hairline rings instead of borders; depth from tone, not shadow
- Dense, tabular, reference-grade information layout
- Every accent colour has a fixed meaning and does not float

## Colors

A near-neutral ink ramp carrying two saturated signals — an indigo that means
"interactive" and a green that means "fits" — plus a warm/cool pair reserved for
caution and fault.

### Primary

- **Signal Indigo** (`signal-indigo`): the interactive voice. Solid on the active
  segmented option, the active nav link, and the primary action; at low alpha it
  tints selected cards and step markers. Also the leading series in charts.
- **Signal Indigo Light** (`signal-indigo-light`): indigo as *text* on a dark
  surface, where the solid indigo would not clear contrast — step-marker numerals
  and inline accents.
- **Signal Indigo Deep** (`signal-indigo-deep`): the fill behind `on-signal`
  white on solid buttons and active tabs.

### Secondary

- **Readout Green** (`readout-green`): the "it fits" colour. Fit bars, capacity
  meters, positive stat values, KV-cache series. Never decorative — a green
  element is asserting that something passed.
- **Readout Green Deep** (`readout-green-deep`): the same signal where a light
  surface needs a darker green to hold contrast.

### Tertiary

- **Caution Amber** (`caution-amber`): approaching a limit; activation memory;
  the FP8 series.
- **Fault Rose** (`fault-rose`): over budget, does not fit, INT8 series.

### Neutral

- **Ink Void** (`ink-void`): the page itself, under a single quiet indigo wash.
- **Ink Card** (`ink-card`): the raised card surface, carried at ~70% alpha.
- **Ink Inset** (`ink-inset`): stat tiles, inputs, segmented containers — one
  step *into* the card, not out of it.
- **Ink Well** (`ink-well`) / **Ink Line** (`ink-line`): meter troughs, track
  fills, and the darkest structural divisions.
- **Control Edge** (`control-edge`): the boundary of an interactive control,
  chosen to clear 3:1 against both the control's own fill and the surface behind
  it. This is a different colour from a card edge on purpose.
- **Text Primary** (`text-primary`) and the muted ramp (`text-muted-high` →
  `text-muted-mid` → `text-muted-low`): headings and body, then sub-labels,
  then the quietest annotations. The ramp is lifted from a conventional grey so
  the smallest label still clears 4.5:1 on a card.

### Chart series

`chart-*` tokens are the data-visualisation ramp and live in `src/lib/palette.ts`
because they must be inlined into SVG fills, canvas strokes, and inline bar
styles where a utility class cannot reach. They are a single source; do not
re-declare a chart colour at a call site.

### Named Rules

**The Signal Rule.** Indigo means interactive, green means fits, amber means
approaching a limit, rose means over budget. A colour never appears for
decoration, and never carries a second meaning on another screen.

**The Desaturated Surface Rule.** Surfaces stay near-neutral. The moment a
surface takes on saturation, the signals stop reading — this was measured, not
guessed, and reverting it is a regression.

**The Composited Contrast Rule.** In glass, a token's contrast is a property of
what is behind it, not of the token. Measure against the composited pane over the
strongest region of the field; that worst case is the binding one. Re-measure
before thinning a pane or strengthening the field.

## Typography

**Display / Body / Label Font:** the system UI stack (`ui-sans-serif`,
`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`).

**Character:** one family, no web fonts, no loading flash. Hierarchy is carried
entirely by size, weight, case, and letter-spacing. The register is technical and
unfussy — this is a datasheet, not an article, and it should render identically
whether or not the network cooperated.

### Hierarchy

- **Display** (700, 1.875rem, line-height 1): the answer. The single headline
  figure a page exists to produce — total VRAM, memory required. One per view.
- **Headline** (600, 1.125rem): stat values inside tiles.
- **Title** (600, 1rem, tracking tight): section headings, paired with a
  numbered step marker.
- **Body** (400, 0.875rem): controls, descriptions, explanatory paragraphs.
- **Label** (500, 0.75rem, tracking wide, uppercase): field labels and the small
  controls inside segmented groups. Uppercase is what marks a string as a label
  rather than content.
- **Caption** (400, 0.6875rem, tracking wide): the quietest step — stat captions,
  badges, unit suffixes, per-card annotations. Only two sizes below body exist;
  anything between them is off the ramp.

### Named Rules

**The One Answer Rule.** Exactly one display-size figure per view. If a second
number wants that size, the view is answering two questions and should be split.

**The Uppercase Label Rule.** Uppercase plus wide tracking is reserved for
labels and captions. Never set a sentence, a value, or a heading in uppercase.

## Layout

A centred column at `max-w-6xl` with `max-w-2xl` reserved for prose-width
explanatory text. The workhorse is a **single-column-to-two-column** split:
`grid-cols-1` stacking to `lg:grid-cols-2`, inputs on the left and results on
the right, so a change and its consequence stay on one screen.

Only two breakpoints are in use — `sm:` and `lg:`. There is no tablet-specific
layout and none is needed; the design goes from stacked to split.

Rhythm is tight. Cards carry `1rem` padding, stat tiles `0.75rem`, compact
selectable cards `0.625rem`. Gaps run `0.25rem`–`0.75rem` between related
controls and `0.75rem` between grid cells. Density is intentional: this is a
reference surface where a professional scans rather than reads.

The application shell is a fixed-height flex column (`h-dvh`, header pinned,
content scrolling inside) rather than a scrolling document. One page —
Model Anatomy — deliberately fills exactly one viewport with no page scroll.

## Elevation & Depth

**Depth comes from tone, not shadow.** The five-step ink ramp does the work:
a surface is "above" another because it is lighter, not because it casts. Every
boundary is a **hairline ring** (`ring-1`) rather than a border — usually
white at 5–10% alpha, or `control-edge` where the element is interactive and
must clear the 3:1 non-text contrast bar.

Exactly one ambient shadow exists in the dark and light themes: a soft, wide,
low-opacity drop under cards. It reads as separation, not as lift.

Glass is the one place where the material itself carries depth: a blurred,
saturated pane with a bright inset line along its top edge (the specular
highlight) and an outer shadow that keeps overlapping panes separable.

### Shadow Vocabulary

- **Card ambient** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3)`): the only
  resting shadow. One level, applied to cards, never stacked.
- **Glass pane** (`inset 0 1px 0 0 rgba(255,255,255,0.85), inset 0 -1px 0 0 rgba(255,255,255,0.25), 0 12px 32px -14px rgba(20,28,66,0.42)`):
  glass theme only. The two inset lines are the lit edges; the outer shadow is
  what stops two panes merging.

### Named Rules

**The Hairline Rule.** Boundaries are 1px rings, not borders, and they are
nearly transparent. A visible box drawn around something is almost always the
wrong answer; step the surface tone instead.

**The One Shadow Rule.** There is a single shadow level. Elevation is not a
scale here — if something needs to feel higher, move it up the ink ramp.

## Shapes

Corners are consistently soft and scale with the element's size: `1rem` on
cards, `0.75rem` on inputs, stat tiles, and selectable cards, `0.5rem` on the
small controls inside a segmented group, and fully round on anything that reads
as a token — badges, step markers, meter tracks, and range thumbs.

Meters and progress bars are always fully rounded capsules, never square-ended.
The pill is the recurring silhouette: segmented controls, the nav group, badges,
and capacity bars all share it, which is what makes an unfamiliar control read as
belonging to the same instrument.

## Components

### Buttons

- **Shape:** softly rounded (`0.75rem`); small controls inside groups step down
  to `0.5rem`.
- **Primary:** solid `signal-indigo-deep` with `on-signal` white text and a soft
  indigo glow. Reserved for the one committing action on a surface.
- **Hover / Focus:** a lighter indigo on solid buttons; a 5% white wash on quiet
  ones. All state changes transition over 150ms.
- **Ghost:** no fill at rest, muted text, white-wash on hover. This is the
  default for anything that is not the primary action.

### Segmented Controls

The signature control. A rounded container at the inset tone with a hairline
ring and `0.25rem` internal padding; options sit inside it.

- **Active:** solid `signal-indigo-deep`, white text, soft shadow.
- **Idle:** muted text, transparent, 5% white wash on hover.
- **Two sizes:** compact for header-level switches, standard inside forms.

Used for precision, dtype, batch, language, theme, and every other small
mutually-exclusive choice. If a choice has 2–6 options and they are short, it is
a segmented control, not a dropdown.

### Chips

- **Style:** fully round, `0.125rem 0.5rem` padding, label typography, hairline
  ring in the tone's own colour.
- **Tones:** neutral (muted text on 5% white), good (green on 15% green),
  caution (amber), fault (rose). Tone is semantic — a chip's colour states a
  fact about the thing it labels.

### Cards / Containers

- **Corner:** `1rem`.
- **Background:** `ink-card` at ~70% alpha with a light backdrop blur.
- **Border:** hairline white at 10%.
- **Shadow:** the single card ambient.
- **Padding:** `1rem`.
- Cards carry a `card` class as a styling hook so the glass theme can restyle
  every surface at once rather than fighting each utility.

### Inputs / Fields

- **Style:** inset tone (`ink-inset`), `0.75rem` radius, ring in `control-edge` —
  a deliberately more visible edge than a card's, because an input must announce
  that it is operable.
- **Focus:** the ring shifts to indigo at 60%, applied on the wrapper
  (`focus-within`) so the whole field lights up rather than just the text box.
- **Label:** uppercase, wide-tracked, muted, sitting above the control with an
  optional right-aligned hint in the quietest ramp step.
- Number spinners are suppressed; range tracks are capsules with an indigo thumb
  ringed in pale lilac.

### Navigation

A single centred pill at the inset tone holding all destinations, split into
**semantic groups separated by thin vertical rules** — size, then choose, then
serve, then learn. Active link is solid indigo with white text; idle links are
muted with a white-wash hover. The pill wraps rather than scrolling on narrow
screens.

### Stat Tile

The unit the results side is built from: inset surface, `0.75rem` radius, a
faint 5% ring, an uppercase caption, a headline-weight value, and an optional
sub-line in the quietest ramp step. Accent variant renders the value in
`readout-green`.

### Device Card (signature)

The selectable hardware card is the system's most characteristic component: a
compact `0.625rem` panel with the device name, its memory as a right-aligned
label, a capacity meter, and a percentage. The meter is green when the model
fits and rose when it does not — the card states its own verdict before you read
a word of it.

Selection is carried by a ring and a tinted fill, and the card sets
`aria-pressed` so the state is announced, not merely drawn. In glass the ring is
thicker and fully opaque, because the shared translucent ring measured below the
3:1 bar on a pale pane.

## Do's and Don'ts

### Do:

- **Do** keep surfaces near-neutral and spend saturation on signal only.
- **Do** step the ink ramp to express depth before reaching for a shadow.
- **Do** use a hairline ring for every boundary, and `control-edge` specifically
  when the bounded thing is interactive.
- **Do** give each accent a single fixed meaning and keep it across every page.
- **Do** measure contrast against the real composited background — in glass, a
  pane over the strongest part of the field is the binding case.
- **Do** reach for a segmented control for any short, mutually-exclusive choice.
- **Do** put exactly one display-size figure on a view.
- **Do** route every data-visualisation colour through `src/lib/palette.ts`.

### Don't:

- **Don't** saturate a surface. A navy-tinted card ramp was tried, measured, and
  reverted; it collapses the whole palette into one colour.
- **Don't** introduce a web font. The system stack is a decision, not an
  oversight — it renders instantly and identically offline.
- **Don't** add a second shadow level. Elevation is expressed by tone.
- **Don't** draw a solid, visible border around a container.
- **Don't** use uppercase for anything that is not a label or caption.
- **Don't** treat glass as a light-theme variant. It is a material; its tokens
  are darker than the light theme's precisely because translucency eats contrast.
- **Don't** thin a glass pane or strengthen the colour field without
  re-measuring the muted-text worst case.
- **Don't** hardcode a chart colour at a call site.

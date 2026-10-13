---
name: LLMScale
description: A calibrated readout for GPU memory — near-neutral surfaces, colour reserved for signal, every figure traceable to its formula.
colors:
  ink-void: "#0e1013"
  ink-card: "#16181d"
  ink-inset: "#1d2026"
  ink-well: "#262a31"
  ink-line: "#353a44"
  signal-cobalt: "#4d8bff"
  signal-cobalt-light: "#7eaaff"
  signal-cobalt-deep: "#1f63e6"
  readout-green: "#29c48a"
  readout-green-fill: "#3dc28c"
  caution-amber: "#ffcd45"
  fault-red: "#f26b6b"
  control-edge: "#6d7483"
  text-primary: "#e4e7ec"
  text-muted-high: "#c1c6cf"
  text-muted-mid: "#a1a7b2"
  text-muted-low: "#8a919d"
  on-signal: "#ffffff"
  chart-cobalt-soft: "#a6c8ff"
  chart-green-deep: "#24a148"
  chart-amber: "#fdce4e"
  chart-orange: "#ff832b"
  chart-red: "#dd5654"
  chart-purple: "#a56eff"
  chart-purple-deep: "#8a3ffc"
  chart-blue: "#33b1ff"
  chart-teal: "#08bdba"
  chart-grey: "#8b919c"
  wash-cobalt: "rgba(77, 139, 255, 0.08)"
  glass-field-cobalt: "rgba(47, 107, 255, 0.55)"
  glass-field-sky: "rgba(111, 179, 255, 0.52)"
  glass-field-teal: "rgba(19, 176, 170, 0.42)"
  glass-field-steel: "rgba(142, 166, 212, 0.5)"
  glass-field-mist: "rgba(169, 212, 255, 0.35)"
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
    backgroundColor: "{colors.signal-cobalt-deep}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.xl}"
    padding: "0.375rem 0.75rem"
    typography: "{typography.body}"
  segmented-option-active:
    backgroundColor: "{colors.signal-cobalt-deep}"
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
    textColor: "{colors.signal-cobalt-light}"
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
colour nowhere to land. Desaturating the surfaces is what gives the cobalt and
the green their meaning: when something is cobalt it is interactive, when
something is green it fits, and neither has to compete with the background for
attention.

The palette is called **Kobalt** (2026-10-14). It replaced a vivid indigo /
neon-green set taken from a dashboard template, which read as generated rather
than engineered. Kobalt's lineage is the consoles this audience already trusts —
IBM Carbon, Grafana, Datadog: neutral graphite, one saturated blue for action,
and a green / amber / red signal set.

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

A near-neutral graphite ramp carrying two saturated signals — a cobalt that
means "interactive" and a green that means "fits" — plus amber and red reserved
for caution and fault. Every token is redefined for light and glass in
`src/index.css`; the values listed here are the dark baseline.

### Primary

- **Signal Cobalt** (`signal-cobalt`): the interactive voice. Rings, the range
  thumb, focus; at low alpha it tints selected cards. Also the leading chart
  series (`--chart-cobalt`).
- **Signal Cobalt Light** (`signal-cobalt-light`): cobalt as *text* — links,
  step-marker numerals, inline accents. Darker than the fill in light (#0a47b0)
  and glass (#0946b8), because a step numeral sits on its own 30% cobalt disc.
- **Signal Cobalt Deep** (`signal-cobalt-deep`): the fill behind `on-signal`
  white on solid buttons, active tabs and the current nav entry (5.3:1).

### Secondary

- **Readout Green** (`readout-green`): the "it fits" colour as text — positive
  stat values, the live-data badge. **Readout Green Fill** (`readout-green-fill`)
  is the same signal as a fill: fit bars, capacity meters, the KV-cache series.
  It leans toward blue (hue ~162) so it stays apart from the fault red under
  red-green colour blindness. Never decorative — a green element is asserting
  that something passed.

### Tertiary

- **Caution Amber** (`caution-amber`): approaching a limit; activation memory;
  the FP8 series.
- **Fault Red** (`fault-red`): over budget, does not fit, INT8 series.

### Neutral

- **Ink Void** (`ink-void`): the page itself, under a single quiet cobalt wash.
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

`chart-*` colours are CSS variables (`--chart-cobalt`, `--chart-green`, …)
defined once per theme in `src/index.css` and named in `src/lib/palette.ts`,
which is what SVG fills, strokes and inline bar styles import. A single hex
cannot hold 3:1 on both a near-black card and a white one, so each theme carries
its own set: dark as listed above, darker for light, darker again for glass,
where the card is a translucent pane over the colour field. Do not re-declare a
chart colour at a call site, and do not append a hex alpha to one — use
`tint(color, pct)`, which is `color-mix` and works on a variable.

A fill only promises 3:1. Where a signal colour is set as *text* (a score, a
count), use the text tokens instead — `COBALT_TEXT`, `GREEN_TEXT`, `AMBER_TEXT`,
`RED_TEXT` — which clear 4.5:1.

The model-name decoder colours its token kinds with mid-tone hues from the same
Carbon-like family (`src/lib/modelName.ts`). As text they are mixed 58/42 with
the theme's foreground, and as a fill behind white text they are taken darker,
so one hex per kind reads in every theme.

### Measured

Every text and fill pair was measured in all three themes (glass against the
pane composited over each blob of the field at its peak, under the pane's own
filter): 94 of 94 pairs pass WCAG AA. In the built site, a probe that composites
each visible text node over its real background found 0 items under the bar
across 30 page × theme × viewport captures; the indigo palette it replaced had
216. Fits-against-fault separation under simulated protanopia, deuteranopia and
tritanopia (Machado 2009, OKLab ΔE) is at least 0.067. Re-measure before
changing any of it.

### Named Rules

**The Signal Rule.** Cobalt means interactive, green means fits, amber means
approaching a limit, red means over budget. A colour never appears for
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
- **Primary:** solid `signal-cobalt-deep` with `on-signal` white text and a soft
  cobalt glow. Reserved for the one committing action on a surface.
- **Hover / Focus:** a lighter cobalt on solid buttons; a 5% white wash on quiet
  ones. All state changes transition over 150ms.
- **Ghost:** no fill at rest, muted text, white-wash on hover. This is the
  default for anything that is not the primary action.

### Segmented Controls

The signature control. A rounded container at the inset tone with a hairline
ring and `0.25rem` internal padding; options sit inside it.

- **Active:** solid `signal-cobalt-deep`, white text, soft shadow.
- **Idle:** muted text, transparent, 5% white wash on hover.
- **Two sizes:** compact for header-level switches, standard inside forms.
- **In the header** the groups keep their natural width and never wrap inside
  themselves. On a phone they drop below the brand and share one line with the
  Share button, which says just "Share" below `sm`; under 360px the options trim
  their side padding to `0.375rem` so that line still fits a 320px screen.

Used for precision, dtype, batch, language, theme, and every other small
mutually-exclusive choice. If a choice has 2–6 options and they are short, it is
a segmented control, not a dropdown. Each option may carry a hint, shown in a
tooltip on hover or focus, saying what picking it means.

### Number fields with value chips

The VRAM calculator and the capacity plan take a number as a field with a row of
common values under it (`ChipField` in `src/components/choice.tsx`, and the
calculator's own controls): the field takes any value, each chip a common one,
lit when it matches, and says on hover what it means. Typing is always open on
these pages, so they have no advanced mode.

### Menus

On the vLLM and fine-tuning pages, and for devices and MIG slices everywhere,
anything with more options than a segmented control holds is a menu (`Select` in
`src/components/choice.tsx`) rather than a bare number field. Its options are the sensible values (`src/lib/choices.ts`), and the
open list shows the highlighted option's hint at its foot, so the explanation
sits where the eye already is. Hints are worked out from the value where a plain
equivalent exists: words and pages for tokens, words a minute for a token rate,
requests a day for a rate, memory, bandwidth and TFLOPS for a device. A value set
by a shared link that is not among the options still shows, labelled as it is.

- **Closed:** the input tone with the interactive ring, the value, a caret.
- **Open:** the raised tone, a hairline ring, the list (max 18rem, scrolls), group
  headings in caption type, the highlighted row in a 20% cobalt wash, the chosen
  one bold with a check.
- **Keyboard:** arrows move, Home and End jump, Enter or Space picks, Escape closes.

### Explanations and advanced mode

Every setting's label carries an ⓘ whose tooltip says what the setting is; every
option says what it means. On the pages with menus, one switch, **Advanced**, at
the head of the settings, swaps the menus for number fields. It is one preference
for the whole site, kept in this browser; off is the default, because most
visitors should pick, not type.

### Chips

- **Style:** fully round, `0.125rem 0.5rem` padding, label typography, hairline
  ring in the tone's own colour.
- **Tones:** neutral (muted text on 5% white), good (green on 15% green),
  caution (amber), fault (red). Tone is semantic — a chip's colour states a
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
- **Focus:** the ring shifts to cobalt at 60%, applied on the wrapper
  (`focus-within`) so the whole field lights up rather than just the text box.
- **Label:** uppercase, wide-tracked, muted, sitting above the control with an
  optional right-aligned hint in the quietest ramp step.
- Number spinners are suppressed; range tracks are capsules with a cobalt thumb
  ringed in pale lilac.

### Navigation

A single centred pill at the inset tone, one row at every width from `sm` up and
in both languages. The calculator — the product's core — is a direct link; after
a thin vertical rule come three menus by intent: **Model** (understand and choose
it), **Serve** (run it) and **Learn**. The menu holding the current page is solid
cobalt and names the page after its own name ("Serve · Serving Brief"); the
others are muted with a white-wash hover. A menu opens when the pointer rests on
its trigger (90 ms), or on a click, Enter or the down arrow; moving along the row
switches menus at once, and leaving waits 220 ms so the pointer can cross into the
panel. The panel centres under the row: an inset-tone pane with a hairline ring
and the deep drop shadow, in two columns. On the left each entry is its name over
a one-line description — the current page solid cobalt with white text, the entry
under the pointer or focus a cobalt tint with a cobalt ring and a cobalt name;
sections are divided by a hairline, a titled one under an uppercase caption. On
the right a quieter well says what the entry under the pointer holds ("What
you'll find"), defaulting to the current page or the first entry. On glass the
panel is nearly opaque, because it lies over the page. A click elsewhere, Escape,
or focus leaving the menu closes it. A new tool lengthens a menu, never the row.

Below `sm` the pill folds to the current page (solid cobalt) and a Menu button;
opened, it lists every destination under its menu's caption, sections divided by
horizontal rules. Without JavaScript every width shows that list instead. Nothing
in the nav scrolls sideways. The structure lives in `src/lib/nav.ts`, which the app
header and the static pages' header both draw from.

### Stat Tile

The unit the results side is built from: inset surface, `0.75rem` radius, a
faint 5% ring, an uppercase caption, a headline-weight value, and an optional
sub-line in the quietest ramp step. Accent variant renders the value in
`readout-green`.

### Device Card (signature)

The selectable hardware card is the system's most characteristic component: a
compact `0.625rem` panel with the device name, its memory as a right-aligned
label, a capacity meter, and a percentage. The meter is green when the model
fits and red when it does not — the card states its own verdict before you read
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

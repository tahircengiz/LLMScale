// Single source of truth for data-visualisation colours.
//
// Palette: "Kobalt" — a cobalt interactive blue on neutral graphite, in the line
// of IBM Carbon and the observability consoles infrastructure teams read daily.
// Every value here is a CSS variable, defined per theme in `src/index.css`, so a
// series keeps 3:1 against the card in dark, light and glass alike; a single hex
// cannot do that on both a near-black card and a white one. Surface, text and
// border colours stay Tailwind tokens in index.css; this file covers the values
// that must be inlined (SVG fills, canvas strokes, inline bar styles).

/** Cobalt — headline series, "weights", attention. Also the interactive colour. */
export const COBALT = "var(--chart-cobalt)";
/** Lighter cobalt, for a secondary series next to COBALT. */
export const COBALT_SOFT = "var(--chart-cobalt-soft)";
/** Green — good/fits, KV cache, embeddings. Leans blue so it stays apart from RED under red-green colour blindness. */
export const GREEN = "var(--chart-green)";
/** Deeper green — the tier between GREEN and AMBER in a score. */
export const GREEN_DEEP = "var(--chart-green-deep)";
/** Amber/yellow — warnings, activation, FP8. */
export const AMBER = "var(--chart-amber)";
/** Orange — secondary warm accent. */
export const ORANGE = "var(--chart-orange)";
/** Red — bad/doesn't fit, INT8. */
export const RED = "var(--chart-red)";
/** Purple — INT4, optimizer state, extra categorical series. */
export const PURPLE = "var(--chart-purple)";
/** Strong purple for categorical charts needing more contrast. */
export const PURPLE_DEEP = "var(--chart-purple-deep)";
/** Cyan-blue — full precision, output head, informational series. */
export const BLUE = "var(--chart-blue)";
/** Teal — extra categorical series. */
export const TEAL = "var(--chart-teal)";
/** Neutral graphite — muted/other/baseline series. */
export const GREY = "var(--chart-grey)";

/** Cobalt and the three signals as text: these clear 4.5:1 where the fills above only promise 3:1. */
export const COBALT_TEXT = "var(--color-brand-400)";
export const GREEN_TEXT = "var(--color-accent-400)";
export const AMBER_TEXT = "var(--color-warn)";
export const RED_TEXT = "var(--color-bad)";

/** A colour at `pct` percent over transparent — the variable-safe form of a hex alpha suffix. */
export const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Categorical ramp for charts with an arbitrary number of series. */
export const CATEGORICAL = [COBALT, PURPLE_DEEP, BLUE, GREEN, AMBER, RED, TEAL, PURPLE];

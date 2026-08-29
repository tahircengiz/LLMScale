// Single source of truth for data-visualisation colours.
//
// Palette taken from the "Dabang" dashboard reference: a vivid indigo/violet
// primary, soft pastel status hues and a navy/grey-blue text ramp. Surface,
// text and border colours live in `src/index.css` as CSS-variable design
// tokens; this file only covers the values that must be inlined (SVG fills,
// canvas strokes, inline bar styles) where a Tailwind utility can't be used.

/** Primary indigo/violet — headline series, "weights", attention. */
export const INDIGO = "#5d5fef";
/** Lighter indigo, for a secondary series next to INDIGO. */
export const INDIGO_SOFT = "#8b8cf5";
/** Green — good/fits, KV cache, embeddings. */
export const GREEN = "#00e096";
/** Slightly deeper green for "very good" on light surfaces. */
export const GREEN_DEEP = "#3cd856";
/** Amber/yellow — warnings, activation, FP8. */
export const AMBER = "#f5c33b";
/** Orange — secondary warm accent. */
export const ORANGE = "#ff947a";
/** Pink/red — bad/doesn't fit, INT8. */
export const RED = "#fa5a7d";
/** Purple — INT4, extra categorical series. */
export const PURPLE = "#bf83ff";
/** Strong purple for categorical charts needing more contrast. */
export const PURPLE_DEEP = "#a700ff";
/** Blue — full precision, informational series. */
export const BLUE = "#0095ff";
/** Teal — extra categorical series. */
export const TEAL = "#00b8d9";
/** Neutral grey-blue — muted/other/baseline series. */
export const GREY = "#737791";

/** Categorical ramp for charts with an arbitrary number of series. */
export const CATEGORICAL = [INDIGO, PURPLE_DEEP, BLUE, GREEN, AMBER, RED, TEAL, PURPLE];

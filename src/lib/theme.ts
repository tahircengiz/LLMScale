// Theme constants live here rather than in App.tsx because Node's type stripping
// runs .ts but not .tsx, and a React import breaks it outright — so anything a
// script needs to read has to sit in a React-free module. Same reason dict.ts is
// split out of i18n.ts.
//
// Dark is the :root baseline the design tokens are defined on, so it is the one
// theme with no class; light and glass each override those tokens under their own
// class. Glass additionally layers a material (blurred panes over a colour field)
// on top of its token overrides — see the Liquid glass block in index.css.

/** Dark and light are colour schemes; glass is a material laid over a colour field. */
export type Theme = "dark" | "light" | "glass";

export const THEMES: readonly Theme[] = ["dark", "light", "glass"];

/**
 * What a first-time visitor gets, before anything is stored. The inline bootstrap
 * in every entry has to encode this too — it must run before first paint, so it
 * cannot import from here. test-invariants.ts pins the two together.
 */
export const DEFAULT_THEME: Theme = "glass";

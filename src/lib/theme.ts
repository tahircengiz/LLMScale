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

export function isTheme(v: unknown): v is Theme {
  return THEMES.includes(v as Theme);
}

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * What a first-time visitor gets. Glass is the face of the site, but an OS that
 * asks for dark is a real preference and outranks showing off the material —
 * someone who has told their machine they want dark should not be handed a
 * bright page. Either way this only applies until they pick a theme themselves;
 * from then on the stored choice wins and the OS is no longer consulted.
 */
export const DEFAULT_THEME: Theme = "glass";
/** ...and what they get instead when the OS asks for dark. */
export const DEFAULT_THEME_DARK: Theme = "dark";

/**
 * Resolve the default for the current machine. The inline bootstrap in every
 * entry has to reimplement this — it runs before any module loads, so it cannot
 * import it — and test-invariants.ts pins the two together.
 */
export function preferredTheme(): Theme {
  const dark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_QUERY).matches;
  return dark ? DEFAULT_THEME_DARK : DEFAULT_THEME;
}

/**
 * What to show when the OS colour scheme changes under an open tab, or null when
 * a stored choice outranks it and nothing should move.
 *
 * Split out from the listener in App.tsx so the decision is testable on its own:
 * Chrome's media emulation changes what the query matches without dispatching a
 * change event, so a browser check can exercise the reload path but never this
 * one. The wiring around it stays thin for that reason.
 */
export function themeOnSystemChange(stored: string | null, osPrefersDark: boolean): Theme | null {
  if (isTheme(stored)) return null;
  return osPrefersDark ? DEFAULT_THEME_DARK : DEFAULT_THEME;
}

/**
 * Set on <html> for the instant a theme is applied, to suppress transitions.
 * Only interactive controls carry a `transition` utility, so without this the
 * switch lands in two stages: panes, the colour field and every card change at
 * once, then buttons, links and inputs spend another 150ms catching up. The CSS
 * rule that acts on this lives in index.css; test-invariants.ts checks they
 * still agree on the name.
 */
export const SWITCHING_CLASS = "theme-switching";

// Unit test for theme resolution. Run: node scripts/test-theme.ts
//
// The browser can be driven through the reload path (clear storage, emulate a
// colour scheme, load), but not through the live one: Chrome's media emulation
// changes what the query matches without dispatching a change event, so a
// listener never fires under test. That decision is therefore a pure function
// and is covered here instead.
import {
  DEFAULT_THEME,
  DEFAULT_THEME_DARK,
  THEMES,
  isTheme,
  themeOnSystemChange,
} from "../src/lib/theme.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

console.log("--- the two defaults ---");
check("glass is the face of the site", DEFAULT_THEME === "glass");
// An OS asking for dark is a real preference and outranks showing off the material.
check("an OS asking for dark gets dark", DEFAULT_THEME_DARK === "dark");
check("following the OS actually changes something", DEFAULT_THEME !== DEFAULT_THEME_DARK);

console.log("\n--- the OS is followed only while nothing is stored ---");
check("nothing stored, OS light", themeOnSystemChange(null, false) === "glass");
check("nothing stored, OS dark", themeOnSystemChange(null, true) === "dark");
// A visitor who picked a theme has outranked their OS; nothing should move under them.
for (const t of THEMES) {
  check(`stored ${t} is left alone when the OS goes dark`, themeOnSystemChange(t, true) === null);
  check(`stored ${t} is left alone when the OS goes light`, themeOnSystemChange(t, false) === null);
}
// Storage is attacker-adjacent in the sense that anything can be in it: a junk
// value must not be trusted as a choice, or the site would freeze on it forever.
check("junk in storage is not a choice", themeOnSystemChange("chartreuse", true) === "dark");
check("an empty string is not a choice", themeOnSystemChange("", false) === "glass");

console.log("\n--- isTheme guards the boundary ---");
check("every real theme passes", THEMES.every(isTheme));
check("junk fails", !isTheme("chartreuse") && !isTheme("") && !isTheme(null) && !isTheme(undefined));
// "Dark" is not "dark": storage is case-sensitive and so is the class list.
check("case matters", !isTheme("Dark"));

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);

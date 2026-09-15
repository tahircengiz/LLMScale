import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./Root.tsx";
import "./index.css";
import { detectLang } from "./lib/i18n";

// #root arrives holding the page prerendered at build time (scripts/prerender.ts),
// so a crawler that never runs this still has something to read.
//
// createRoot, not hydrateRoot. The prerender is the English page with nothing
// chosen, and plenty of visitors render something else: Turkish, another theme, a
// shared link with a model in it. Hydrating those would mismatch, and React keeps
// the server's attributes when it does. Replacing the markup outright cannot
// mismatch; the inline bootstrap hides it for the visitors it would mislead.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root initialLang={detectLang()} />
  </StrictMode>
);

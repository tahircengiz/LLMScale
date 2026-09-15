import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./Root.tsx";
import "./index.css";
import { langOfPath } from "./lib/langPath";

// #root arrives holding the page prerendered at build time (scripts/prerender.ts)
// in its URL's language, so a crawler that never runs this still has something
// to read.
//
// createRoot, not hydrateRoot. The prerender is the page with nothing chosen and
// in the default theme; a shared link with a model in it, or another theme,
// renders something else. Hydrating those would mismatch, and React keeps the
// server's attributes when it does. Replacing the markup outright cannot mismatch;
// the inline bootstrap hides it for the visitors it would mislead.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root lang={langOfPath(window.location.pathname)} />
  </StrictMode>
);

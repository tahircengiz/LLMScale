import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./Root.tsx";
import "./index.css";
import { loadDict } from "./lib/dict";
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
//
// The page's dictionary comes first, in a chunk of its own: only this language's
// (src/lib/dict.ts). Until it arrives the prerendered page stays on screen.
const lang = langOfPath(window.location.pathname);
loadDict(lang).then(() =>
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Root lang={lang} />
    </StrictMode>
  )
);

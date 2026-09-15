import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import Root from "./Root.tsx";

/** The page that `window.location` names, in English with nothing chosen — what a
 *  crawler with no stored preferences sees once the app has run. Built with
 *  `vite build --ssr` and called by scripts/prerender.ts, which supplies the
 *  location; nothing in the browser bundle imports this. */
export function render(): string {
  return renderToString(
    <StrictMode>
      <Root initialLang="en" />
    </StrictMode>
  );
}

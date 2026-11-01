import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import Root from "./Root.tsx";
import type { Lang } from "./lib/dict.ts";
import { primeSnapshot, type CompareSnapshot } from "./lib/compareSnapshot.ts";

/** The page that `window.location` names, in `lang`, with nothing chosen — what a
 *  crawler with no stored preferences sees once the app has run. Built with
 *  `vite build --ssr` and called by scripts/prerender.ts, which supplies the
 *  location, and on compare.html the kept Hub answers the comparison opens with;
 *  nothing in the browser bundle imports this. */
export function render(lang: Lang, compare?: CompareSnapshot): string {
  primeSnapshot(compare);
  return renderToString(
    <StrictMode>
      <Root lang={lang} />
    </StrictMode>
  );
}

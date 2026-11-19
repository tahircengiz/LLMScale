import { defineConfig, type Plugin } from "vite";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ENABLED_LANGS, LANG_META } from "./src/lib/langs.ts";

// `base` must match the GitHub Pages sub-path (https://<user>.github.io/<repo>/).
// Override with VITE_BASE for a custom domain (set VITE_BASE=/ for the root).
const base = process.env.VITE_BASE ?? "/LLMScale/";

// The app's footer links to the news feed only once it has a post: until then
// scripts/genFeed.ts writes no feed pages, and the link would lead nowhere.
// FEED_DIR is the same override scripts/feedData.ts reads.
const feedDir = process.env.FEED_DIR ?? "content/feed";
const hasFeed = existsSync(feedDir) && readdirSync(feedDir).some((f) => f.endsWith(".json"));

// /tr/… and every other language's pages exist only in the build:
// scripts/prerender.ts writes them from the English entries. The dev server serves
// the English entry for them instead, and the app still takes its language from
// the address bar.
function languagePagesInDev(): Plugin {
  const folders = ENABLED_LANGS.map((l) => LANG_META[l].prefix).filter(Boolean);
  const langTree = new RegExp("^" + base.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&") + `(${folders.join("|") || "(?!)"})`);
  return {
    name: "language-pages-in-dev",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) req.url = req.url.replace(langTree, base);
        next();
      });
    },
  };
}

export default defineConfig({
  base,
  define: { __HAS_FEED__: JSON.stringify(hasFeed) },
  plugins: [react(), tailwindcss(), languagePagesInDev()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        fit: fileURLToPath(new URL("./fit.html", import.meta.url)),
        vllm: fileURLToPath(new URL("./vllm.html", import.meta.url)),
        decode: fileURLToPath(new URL("./decode.html", import.meta.url)),
        anatomy: fileURLToPath(new URL("./anatomy.html", import.meta.url)),
        compare: fileURLToPath(new URL("./compare.html", import.meta.url)),
        train: fileURLToPath(new URL("./train.html", import.meta.url)),
        learn: fileURLToPath(new URL("./learn.html", import.meta.url)),
        config: fileURLToPath(new URL("./config.html", import.meta.url)),
        serving: fileURLToPath(new URL("./serving.html", import.meta.url)),
        plan: fileURLToPath(new URL("./plan.html", import.meta.url)),
        gpucompare: fileURLToPath(new URL("./gpu-compare.html", import.meta.url)),
      },
      // Each language's dictionary is a chunk of its own (src/lib/dict.ts), named
      // dict-<lang>-… so scripts/prerender.ts can preload the page's one.
      output: {
        chunkFileNames: (c) => (c.facadeModuleId?.includes("/src/locales/") ? "assets/dict-[name]-[hash].js" : "assets/[name]-[hash].js"),
      },
    },
  },
});

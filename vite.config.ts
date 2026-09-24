import { defineConfig, type Plugin } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base` must match the GitHub Pages sub-path (https://<user>.github.io/<repo>/).
// Override with VITE_BASE for a custom domain (set VITE_BASE=/ for the root).
const base = process.env.VITE_BASE ?? "/LLMScale/";

// /tr/… pages exist only in the build: scripts/prerender.ts writes them from the
// English entries. The dev server serves the English entry for them instead, and
// the app still takes its language from the address bar.
function turkishPagesInDev(): Plugin {
  const trTree = new RegExp("^" + base.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&") + "tr/");
  return {
    name: "turkish-pages-in-dev",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) req.url = req.url.replace(trTree, base);
        next();
      });
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), turkishPagesInDev()],
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
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base` must match the GitHub Pages sub-path (https://<user>.github.io/<repo>/).
// Override with VITE_BASE for a custom domain (set VITE_BASE=/ for the root).
export default defineConfig({
  base: process.env.VITE_BASE ?? "/LLMScale/",
  plugins: [react(), tailwindcss()],
});

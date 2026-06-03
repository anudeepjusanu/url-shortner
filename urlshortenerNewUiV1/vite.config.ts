import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  css: {
    postcss: {
      plugins: [require("tailwindcss")("./tailwind.config.ts"), require("autoprefixer")],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers — allows smaller, faster output
    target: "esnext",
    // esbuild minifier is faster and produces smaller output than terser
    minify: "esbuild",
    // Raise warning threshold to 600KB since we now have proper splitting
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Only manually chunk packages with clean, non-circular dependency graphs.
        // recharts/d3 have circular deps that cause TDZ errors when force-grouped —
        // let Rollup auto-split them via the lazy-loaded route boundary instead.
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-framer": ["framer-motion"],
        },
      },
    },
  },
}));

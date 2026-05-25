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
        manualChunks: (id) => {
          // React core — tiny, shared by every chunk, cached long-term
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // React Router
          if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/react-router/")) {
            return "vendor-router";
          }
          // Framer Motion — used on landing page, split for long-term caching
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-framer";
          }
          // Recharts — heavy charting lib, only used in analytics dashboard
          if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // Amplitude analytics — deferred, never on critical path
          if (id.includes("node_modules/@amplitude/")) {
            return "vendor-amplitude";
          }
          // XLSX — bulk import/export only
          if (id.includes("node_modules/xlsx/")) {
            return "vendor-xlsx";
          }
          // All other node_modules into a shared vendor chunk
          if (id.includes("node_modules/")) {
            return "vendor-shared";
          }
        },
      },
    },
  },
}));

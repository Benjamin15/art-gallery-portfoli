import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = process.env.PROJECT_ROOT || fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // Utiliser des URLs relatives par défaut pour un build statique portable
  // (override possible via VITE_BASE_PATH)
  base: process.env.VITE_BASE_PATH || './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      // Redirect Spark imports to local shims (non-breaking to UI)
      '@github/spark/hooks': resolve(projectRoot, 'src/hooks/useKV-shim.ts'),
      '@github/spark/spark': resolve(projectRoot, 'src/lib/spark-shim.ts'),
    }
  },
  server: {
    watch: {
      ignored: [
        '**/pids/**'
      ]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});

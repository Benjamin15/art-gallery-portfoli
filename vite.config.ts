import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = process.env.PROJECT_ROOT || fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
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
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});

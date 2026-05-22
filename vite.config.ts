import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], // , cloudflare()
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Fallback so builds without a .env file still point at the real backend
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL ?? 'https://devapi.tokomoapp.org/api'
    ),
  },
})
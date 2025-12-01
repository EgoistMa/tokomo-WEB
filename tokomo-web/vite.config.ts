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
})
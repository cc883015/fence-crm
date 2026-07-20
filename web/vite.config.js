import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 本地开发时把 /api 代理到 wrangler dev (默认 8787)
    proxy: { "/api": "http://localhost:8787" },
  },
  build: { outDir: "dist" },
});

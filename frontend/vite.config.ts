import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api-chaos": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-chaos/, "/chaos"),
      },
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/chaos": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chaos/, ""),
      },
      "/otlp": {
        target: "http://127.0.0.1:80",
        changeOrigin: false,
        headers: { host: "otel-collector.k8s.test" },
        rewrite: (path) => path.replace(/^\/otlp/, ""),
      },
    },
  },
})

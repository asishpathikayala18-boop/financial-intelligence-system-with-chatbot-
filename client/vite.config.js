import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/health": "http://127.0.0.1:5000",
      "/auth": "http://127.0.0.1:5000",
      "/transactions": "http://127.0.0.1:5000",
      "/analytics": "http://127.0.0.1:5000",
      "/loan": "http://127.0.0.1:5000",
      "/chatbot": "http://127.0.0.1:5000",
      "/notifications": "http://127.0.0.1:5000",
      "/admin": "http://127.0.0.1:5000",
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
        },
      },
    },
  },
});

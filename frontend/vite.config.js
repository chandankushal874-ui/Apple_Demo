import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served under /demo by the FastAPI backend in production
export default defineConfig({
  base: "/demo/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});

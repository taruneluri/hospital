import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.CAREWELL_API_TARGET || "http://127.0.0.1:4000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}", "server/**/*.test.js"],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});

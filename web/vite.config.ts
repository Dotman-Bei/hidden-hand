import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: { "process.env": {} },
  resolve: { alias: { buffer: "buffer" } },
  optimizeDeps: { include: ["buffer"] },
  build: {
    assetsDir: "build",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});

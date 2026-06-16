import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base "/" works for Cloudflare Pages root deployment and custom domains.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

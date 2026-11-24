import { defineConfig } from "vite";

export default defineConfig({
  // The site is served from the root of tomsix.xyz, so absolute asset URLs are fine.
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "es2022",
  },
});
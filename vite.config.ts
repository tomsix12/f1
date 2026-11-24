import { defineConfig } from "vite";

export default defineConfig({
  // The editable page lives in src/; the build publishes a ready-to-serve copy
  // of the site into the repository root (see scripts/publish-root.mjs) so a
  // static host such as Vercel can serve it without running a build.
  root: "src",
  publicDir: "../public",
  // The site is served from the root of tomsix.xyz, so absolute asset URLs are fine.
  base: "/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsDir: "assets",
    target: "es2022",
  },
});
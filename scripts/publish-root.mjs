/**
 * Publishes the production build into the repository root, so a static host
 * such as Vercel can serve the site without running a build step.
 *
 *   npm run build                      (typecheck + vite build + this script)
 *   node scripts/publish-root.mjs      (copy an existing dist/ only)
 *
 * The Vite template lives in src/index.html; the root index.html, assets/ and
 * img/ are generated and should not be edited by hand.
 */
import { cpSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = path.join(root, "dist");

const dirs = ["assets", "img"];
const files = ["index.html", "data.json", "details.json", "robots.txt", "sitemap.xml"];

for (const dir of dirs) {
  rmSync(path.join(root, dir), { recursive: true, force: true });
  cpSync(path.join(dist, dir), path.join(root, dir), { recursive: true });
}

for (const file of files) {
  cpSync(path.join(dist, file), path.join(root, file));
}

console.log("Published dist/ to the repository root.");
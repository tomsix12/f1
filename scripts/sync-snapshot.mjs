/**
 * Keeps the bundled offline snapshot in sync with the file served at /data.json.
 *
 *   node scripts/sync-snapshot.mjs      (or: npm run sync:snapshot)
 *
 * public/data.json is the single source of truth: it is fetched at runtime when
 * the live API is unreachable. src/data/snapshot.json is the same payload,
 * bundled into the JavaScript so the page still renders if even that fetch fails
 * (for example when opened straight from the file system).
 */
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = `${root}public/data.json`;
const target = `${root}src/data/snapshot.json`;

copyFileSync(source, target);
console.log("Copied public/data.json -> src/data/snapshot.json");
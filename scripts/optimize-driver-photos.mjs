// Re-encodes every downloaded driver portrait so the static bundle stays small.
//
//   node scripts/optimize-driver-photos.mjs
//
// The fetch script already optimises new downloads; this one is for images
// that were saved before the pipeline existed.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "img", "drivers");
let before = 0;
let after = 0;

for (const name of readdirSync(dir)) {
  if (!name.toLowerCase().endsWith(".jpg")) continue;
  const file = join(dir, name);
  const buffer = readFileSync(file);
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  before += buffer.length;
  if (optimized.length < buffer.length) writeFileSync(file, optimized);
  after += Math.min(optimized.length, buffer.length);
  console.log(name.padEnd(10), Math.round(buffer.length / 1024) + " kB ->", Math.round(optimized.length / 1024) + " kB");
}

console.log("\ntotal", Math.round(before / 1024) + " kB ->", Math.round(after / 1024) + " kB");
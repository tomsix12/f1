// Downloads the official Formula 1 driver portraits, so the Results view can
// use the same cut-out style as formula1.com.
//
//   npm run photos:f1
//
// Two files per driver land in public/img/drivers:
//   banner/<code>.webp – waist-up cut-out, transparent background (profile)
//   head/<code>.webp   – 160 px face crop, transparent background (avatars)
//
// The manifest keeps the Wikipedia fallback (file) and the source page for
// attribution. Drivers without a current portrait keep the old photo.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "img", "drivers");
const manifestPath = join(root, "src", "data", "photos.json");
const data = JSON.parse(readFileSync(join(root, "public", "data.json"), "utf8"));

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
};

/** code → [season, team folder, asset name] on the F1 media CDN. */
const ASSETS = {
  ANT: [2026, "mercedes", "andant01"],
  VER: [2026, "redbullracing", "maxver01"],
  HAM: [2026, "ferrari", "lewham01"],
  RUS: [2026, "mercedes", "georus01"],
  NOR: [2026, "mclaren", "lannor01"],
  LEC: [2026, "ferrari", "chalec01"],
  PIA: [2026, "mclaren", "oscpia01"],
  HAD: [2026, "redbullracing", "isahad01"],
  LAW: [2026, "racingbulls", "lialaw01"],
  GAS: [2026, "alpine", "piegas01"],
  LIN: [2026, "racingbulls", "arvlin01"],
  COL: [2026, "alpine", "fracol01"],
  BEA: [2026, "haasf1team", "olibea01"],
  BOR: [2026, "audi", "gabbor01"],
  HUL: [2026, "audi", "nichul01"],
  SAI: [2026, "williams", "carsai01"],
  ALO: [2026, "astonmartin", "feralo01"],
  ALB: [2026, "williams", "alealb01"],
  STR: [2026, "astonmartin", "lanstr01"],
  BOT: [2026, "cadillac", "valbot01"],
  PER: [2026, "cadillac", "serper01"],
  CAM: [2026, "haasf1team", "rafcam01"],
  HIR: [2026, "haasf1team", "ryohir01"],
  OCO: [2025, "haas", "estoco01"],
  TSU: [2025, "racingbulls", "yuktsu01"],
};

const assetPath = ([season, team, slug]) =>
  `v1740000001/common/f1/${season}/${team}/${slug}/${season}${team}${slug}right.webp`;
/** Waist-up crop anchored to the top, 520 × 740 with transparency. */
const bannerUrl = (asset) =>
  `https://media.formula1.com/image/upload/c_fill,g_north,w_520,h_740/q_auto/${assetPath(asset)}`;
/** Square face crop used for round avatars. */
const headUrl = (asset) =>
  `https://media.formula1.com/image/upload/c_thumb,g_face,w_160,h_160/q_auto/${assetPath(asset)}`;

async function download(url, file, minBytes) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  // The CDN answers unknown drivers with a tiny placeholder; treat it as a miss.
  if (bytes.byteLength < minBytes) throw new Error(`${url} placeholder`);
  writeFileSync(file, bytes);
  return bytes.byteLength;
}

async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const bannerDir = join(outDir, "banner");
  const headDir = join(outDir, "head");
  if (!existsSync(bannerDir)) mkdirSync(bannerDir, { recursive: true });
  if (!existsSync(headDir)) mkdirSync(headDir, { recursive: true });

  let done = 0;
  const misses = [];
  for (const driver of data.drivers) {
    const code = driver.code;
    const asset = ASSETS[code];
    const entry = manifest[code];
    if (!asset || !entry) {
      misses.push(code);
      continue;
    }
    try {
      const slide = await download(bannerUrl(asset), join(bannerDir, `${code.toLowerCase()}.webp`), 15_000);
      const head = await download(headUrl(asset), join(headDir, `${code.toLowerCase()}.webp`), 3_000);
      entry.hero = `/img/drivers/banner/${code.toLowerCase()}.webp`;
      entry.avatar = `/img/drivers/head/${code.toLowerCase()}.webp`;
      entry.credit = "Formula 1";
      entry.page = "https://www.formula1.com/en/drivers";
      done += 1;
      console.log(`${code} banner ${(slide / 1024).toFixed(0)}kB · head ${(head / 1024).toFixed(0)}kB`);
    } catch (error) {
      misses.push(`${code} (${error.message})`);
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\n${done} drivers updated. ${misses.length ? "Skipped: " + misses.join(", ") : ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// Downloads one portrait per driver from Wikipedia and writes the manifest the
// dashboard uses. Photos stay local so the static site never hotlinks images.
//
//   npm run photos
//
// Images come from Wikimedia Commons and keep their CC licences; every entry
// in src/data/photos.json stores the source article for attribution.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "img", "drivers");
const manifestPath = join(root, "src", "data", "photos.json");
const data = JSON.parse(readFileSync(join(root, "public", "data.json"), "utf8"));

/** Curated English Wikipedia articles, keyed by the code Jolpica publishes. */
const ARTICLES = {
  ANT: "Kimi Antonelli",
  VER: "Max Verstappen",
  HAM: "Lewis Hamilton",
  RUS: "George Russell (racing driver)",
  NOR: "Lando Norris",
  LEC: "Charles Leclerc",
  PIA: "Oscar Piastri",
  HAD: "Isack Hadjar",
  LAW: "Liam Lawson",
  GAS: "Pierre Gasly",
  LIN: "Arvid Lindblad",
  COL: "Franco Colapinto",
  BEA: "Oliver Bearman",
  BOR: "Gabriel Bortoleto",
  HUL: "Nico Hülkenberg",
  SAI: "Carlos Sainz Jr.",
  OCO: "Esteban Ocon",
  ALO: "Fernando Alonso",
  ALB: "Alexander Albon",
  TSU: "Yuki Tsunoda",
  HIR: "Ryo Hirakawa",
  STR: "Lance Stroll",
  BOT: "Valtteri Bottas",
  PER: "Sergio Pérez",
  CAM: "Rafael Câmara",
};

const UA = "F1CalendarBot/2.0 (static fan dashboard; contact: tomsix.xyz)";
/** Wikipedia asks API clients to be gentle; one request per second is plenty. */
const DELAY_MS = 1200;

mkdirSync(outDir, { recursive: true });

const previous = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};
const manifest = { ...previous };
let ok = 0;
let skipped = 0;
let failed = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url, attempt = 0) {
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (response.status === 429 || response.status >= 500) {
    if (attempt >= 4) throw new Error("HTTP " + response.status);
    const wait = 2500 * (attempt + 1);
    console.log("retry  ", "HTTP " + response.status, "in", wait + " ms");
    await sleep(wait);
    return get(url, attempt + 1);
  }
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response;
}

for (const driver of data.drivers) {
  const code = driver.code;
  const article = ARTICLES[code];
  const target = join(outDir, code.toLowerCase() + ".jpg");

  if (!article) {
    console.log("skip   ", code, "- no article mapped");
    failed += 1;
    continue;
  }
  if (existsSync(target) && manifest[code]) {
    console.log("keep   ", code, manifest[code].title);
    skipped += 1;
    continue;
  }

  const api = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({
    action: "query",
    titles: article,
    prop: "pageimages|info",
    inprop: "url",
    pithumbsize: "640",
    redirects: "1",
    format: "json",
    origin: "*",
  });

  try {
    const response = await get(api);
    const payload = await response.json();
    const page = Object.values(payload.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined) throw new Error("article not found");
    const src = page.thumbnail?.source;
    if (!src) throw new Error("no thumbnail");

    const image = await get(src);
    const buffer = Buffer.from(await image.arrayBuffer());

    // Portrait crop, 480 px wide: crisp on a 2× phone card without shipping
    // the full Wikipedia original.
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 480, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    writeFileSync(target, optimized);

    manifest[code] = {
      file: "/img/drivers/" + code.toLowerCase() + ".jpg",
      title: page.title,
      page: page.fullurl,
      credit: "Wikipedia / Wikimedia Commons",
    };
    ok += 1;
    console.log("saved  ", code, page.title, Math.round(optimized.length / 1024) + " kB");
  } catch (error) {
    failed += 1;
    console.log("FAIL   ", code, article, "-", error.message);
  }

  await sleep(DELAY_MS);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${ok} saved, ${skipped} kept, ${failed} missing -> ${manifestPath}`);
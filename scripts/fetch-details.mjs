/**
 * Rebuilds public/details.json — the offline copy of the race, sprint and
 * qualifying sheets used by the Results view.
 *
 *   node scripts/fetch-details.mjs      (or: npm run sync:details)
 *
 * The payload mirrors ResultsBundle in src/data/details.ts. Keep the two in
 * sync when the model changes.
 */
import { writeFileSync } from "node:fs";

const BASE = "https://api.jolpi.ca/ergast/f1";
const HEADERS = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 F1Calendar/2.0",
};
const PAGE = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, attempt = 0) {
  const response = await fetch(BASE + path, { headers: HEADERS });
  if (response.status === 429 || response.status >= 500) {
    if (attempt >= 5) throw new Error(path + " " + response.status);
    await sleep(3000 * (attempt + 1));
    return get(path, attempt + 1);
  }
  if (!response.ok) throw new Error(path + " " + response.status);
  return response.json();
}

async function allPages(path) {
  const first = await get(path + "?limit=" + PAGE + "&offset=0");
  const races = [...(first.MRData.RaceTable.Races || [])];
  const pages = Math.max(1, Math.ceil(Number(first.MRData.total || 0) / PAGE));
  for (let page = 1; page < pages; page += 1) {
    await sleep(700);
    const res = await get(path + "?limit=" + PAGE + "&offset=" + page * PAGE);
    races.push(...(res.MRData.RaceTable.Races || []));
  }
  return races;
}

function timeText(result) {
  const raw = result.Time?.time;
  if (!raw) return result.status || "—";
  return raw.startsWith("+") ? raw + "s" : raw;
}

function toRow(r) {
  return {
    pos: Number(r.position) || 0,
    code: r.Driver.code || "",
    driver: `${r.Driver.givenName} ${r.Driver.familyName}`.trim(),
    teamId: r.Constructor.constructorId,
    team: r.Constructor.name,
    grid: Number(r.grid) || 0,
    laps: Number(r.laps) || 0,
    status: r.status || "Finished",
    time: timeText(r),
    points: Number(r.points) || 0,
    fastestLap: r.FastestLap?.rank === "1",
    fastestLapTime: r.FastestLap?.Time?.time || "",
    fastestLapLap: Number(r.FastestLap?.lap) || 0,
  };
}

function collect(races, rowsOf) {
  const buckets = new Map();
  for (const race of races) {
    const round = Number(race.round) || 0;
    const rows = rowsOf(race);
    if (!rows.length || !round) continue;
    if (!buckets.has(round)) buckets.set(round, new Map());
    const bucket = buckets.get(round);
    for (const row of rows) if (row.pos && !bucket.has(row.pos)) bucket.set(row.pos, row);
  }
  const out = {};
  for (const [round, bucket] of buckets) out[round] = [...bucket.values()].sort((a, b) => a.pos - b.pos);
  return out;
}

const qualifyingRows = (race) =>
  (race.QualifyingResults || []).map((r) => ({
    pos: Number(r.position) || 0,
    code: r.Driver.code || "",
    driver: `${r.Driver.givenName} ${r.Driver.familyName}`.trim(),
    teamId: r.Constructor.constructorId,
    team: r.Constructor.name,
    q1: r.Q1 || "",
    q2: r.Q2 || "",
    q3: r.Q3 || "",
  }));

async function main() {
  const results = await allPages("/current/results.json");
  const sprints = await allPages("/current/sprint.json");
  const quali = await allPages("/current/qualifying.json");

  const qualifying = collect(quali, qualifyingRows);
  const poles = {};
  for (const [round, rows] of Object.entries(qualifying)) {
    const pole = rows.find((row) => row.pos === 1);
    if (pole?.code) poles[round] = pole.code;
  }
  // Post-session rulings the classification does not carry: at Las Vegas 2026
  // Antonelli's fastest Q3 lap was deleted, so the official pole is
  // Verstappen's. Keep in sync with POLE_FIXES in src/data/details.ts.
  Object.assign(poles, { 21: "VER" });

  const bundle = {
    season: "2026",
    fetchedAt: new Date().toISOString(),
    races: collect(results, (race) => (race.Results || []).map(toRow)),
    sprints: collect(sprints, (race) => (race.SprintResults || []).map(toRow)),
    qualifying,
    poles,
  };

  writeFileSync(new URL("../public/details.json", import.meta.url), JSON.stringify(bundle), "utf8");
  const rounds = Object.keys(bundle.races);
  const counts = rounds.map((r) => bundle.races[r].length);
  console.log(
    `Wrote public/details.json — ${rounds.length} races, ` +
      `${counts.reduce((a, b) => a + b, 0)} rows, ` +
      `${Object.keys(bundle.sprints).length} sprints, ` +
      `${Object.keys(bundle.qualifying).length} qualifying sheets.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
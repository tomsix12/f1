/**
 * Rebuilds public/data.json — the offline fallback the page fetches when the
 * live Jolpica API is unreachable.
 *
 *   node scripts/fetch-data.mjs      (or: npm run sync:data)
 *
 * The payload mirrors src/types.ts SeasonData, using the same field names as
 * src/data/normalize.ts. Keep the two in sync when the model changes.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const target = `${root}public/data.json`;

const BASE = "https://api.jolpi.ca/ergast/f1";
const HEADERS = {
  Accept: "application/json",
  // Jolpica returns 403 to clients that do not look like a browser.
  "User-Agent": "Mozilla/5.0 F1Calendar/2.0",
};

const SESSION_DEFS = [
  ["FirstPractice", "Practice 1", "practice", 60],
  ["SecondPractice", "Practice 2", "practice", 60],
  ["ThirdPractice", "Practice 3", "practice", 60],
  ["SprintQualifying", "Sprint Qualifying", "sprint-qualifying", 44],
  ["Sprint", "Sprint", "sprint", 60],
  ["Qualifying", "Qualifying", "qualifying", 60],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path, attempt = 0) {
  const response = await fetch(BASE + path, { headers: HEADERS });
  if (response.status === 429 || response.status >= 500) {
    if (attempt >= 3) throw new Error(path + " " + response.status);
    await sleep(1500 * (attempt + 1));
    return get(path, attempt + 1);
  }
  if (!response.ok) throw new Error(path + " " + response.status);
  return response.json();
}

function sessionsFrom(race) {
  const sessions = [];
  for (const [key, name, type, minutes] of SESSION_DEFS) {
    const slot = race[key];
    if (!slot || !slot.date) continue;
    sessions.push({ name, type, start: `${slot.date}T${slot.time || "12:00:00Z"}`, minutes });
  }
  sessions.push({
    name: "Race",
    type: "race",
    start: `${race.date}T${race.time || "12:00:00Z"}`,
    minutes: 120,
  });
  return sessions.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

function winnerFrom(race) {
  const result = (race.Results || [])
    .slice()
    .sort((a, b) => Number(a.position) - Number(b.position))[0];
  if (!result) return null;
  return {
    driver: `${result.Driver.givenName} ${result.Driver.familyName}`.trim(),
    code: result.Driver.code || "",
    teamId: result.Constructor.constructorId,
    team: result.Constructor.name,
    result: result.Time?.time || result.status || "Finished",
  };
}

async function main() {
  console.log("Fetching calendar, winners and standings…");
  const calendar = await get("/current.json");
  await sleep(400);
  const winners = await get("/current/results/1.json?limit=100");
  await sleep(400);
  const driversPayload = await get("/current/driverstandings.json?limit=100");
  await sleep(400);
  const teamsPayload = await get("/current/constructorstandings.json?limit=100");

  const raceTable = calendar.MRData?.RaceTable;
  if (!raceTable?.Races?.length) throw new Error("Calendar returned no races");

  const winnerByRound = new Map();
  for (const race of winners.MRData?.RaceTable?.Races ?? []) {
    const winner = winnerFrom(race);
    if (winner) winnerByRound.set(String(race.round), winner);
  }

  const races = raceTable.Races.map((race) => ({
    round: Number(race.round),
    name: race.raceName,
    circuit: race.Circuit?.circuitName || "",
    city: race.Circuit?.Location?.locality || "",
    country: race.Circuit?.Location?.country || "",
    date: race.date,
    time: race.time || "",
    start: `${race.date}T${race.time || "12:00:00Z"}`,
    weekFrom: race.FirstPractice?.date || race.date,
    sprint: Boolean(race.Sprint),
    sessions: sessionsFrom(race),
    winner: winnerByRound.get(String(race.round)) || null,
  }));

  const driverTable = driversPayload.MRData?.StandingsTable?.StandingsLists?.[0] ?? null;
  const drivers = (driverTable?.DriverStandings ?? [])
    .map((entry) => {
      const constructors = entry.Constructors ?? [];
      const team = constructors[constructors.length - 1];
      return {
        pos: Number(entry.position),
        name: `${entry.Driver.givenName} ${entry.Driver.familyName}`.trim(),
        code: entry.Driver.code || "",
        teamId: team?.constructorId || "",
        team: team?.name || "",
        points: Number(entry.points),
        wins: Number(entry.wins),
        number: entry.Driver.permanentNumber || "",
        nationality: entry.Driver.nationality || "",
      };
    })
    .sort((a, b) => a.pos - b.pos);

  const teamTable = teamsPayload.MRData?.StandingsTable?.StandingsLists?.[0] ?? null;
  const teams = (teamTable?.ConstructorStandings ?? [])
    .map((entry) => ({
      pos: Number(entry.position),
      id: entry.Constructor.constructorId,
      name: entry.Constructor.name,
      points: Number(entry.points),
      wins: Number(entry.wins),
    }))
    .sort((a, b) => a.pos - b.pos);

  if (!teams.length) throw new Error("Constructor standings returned no teams");

  const data = {
    season: String(raceTable.season || ""),
    round: Number(teamTable?.round || 0),
    fetchedAt: new Date().toISOString(),
    races,
    drivers,
    teams,
  };

  writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(
    `Wrote public/data.json — season ${data.season}, round ${data.round}, ` +
      `${races.length} races, ${drivers.length} drivers, ${teams.length} teams.`,
  );
}

main().catch((error) => {
  console.error("[fetch-data] failed:", error);
  process.exitCode = 1;
});
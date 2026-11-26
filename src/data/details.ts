import type {
  JolpicaQualifyingResult,
  JolpicaRace,
  JolpicaRaceTableResponse,
  JolpicaResult,
} from "./jolpica";
import { getJson } from "./jolpica";
import type { RaceResult } from "../types";

/** Everything the Results view needs beyond the championship standings. */
export interface ResultsBundle {
  season: string;
  fetchedAt: string;
  /** Round -> race classification, ascending by position. */
  races: Record<number, RaceResult[]>;
  /** Round -> sprint classification, when that weekend had a sprint. */
  sprints: Record<number, RaceResult[]>;
  /** Round -> qualifying classification with Q1/Q2/Q3 times. */
  qualifying: Record<number, QualifyingRow[]>;
  /** Round -> pole sitter's driver code. */
  poles: Record<number, string>;
}

export interface QualifyingRow {
  pos: number;
  code: string;
  driver: string;
  teamId: string;
  team: string;
  q1: string;
  q2: string;
  q3: string;
}

const PAGE = 100;
/** Small pause between page requests; Jolpica rejects bursts. */
const PAGE_DELAY = 700;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getPage<T>(path: string, signal: AbortSignal, attempt = 0): Promise<T> {
  try {
    return await getJson<T>(path, signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const retryable = message.includes("429") || /HTTP 5\d\d/.test(message);
    if (attempt >= 5 || !retryable) throw error;
    // Jolpica asks bursts to back off; the delay grows with every attempt.
    await sleep(2000 * (attempt + 1));
    return getPage<T>(path, signal, attempt + 1);
  }
}

/**
 * Jolpica silently caps a page at 100 result rows, so a full season needs
 * offset pagination. The first page also reveals the total row count.
 */
async function fetchAllPages(path: string, signal: AbortSignal): Promise<JolpicaRace[]> {
  const first = await getPage<JolpicaRaceTableResponse>(
    path + "?limit=" + PAGE + "&offset=0",
    signal,
  );
  const firstRaces = first.MRData?.RaceTable?.Races ?? [];
  const total = Number(first.MRData?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const out = firstRaces.slice();
  for (let page = 1; page < pages; page += 1) {
    await sleep(PAGE_DELAY);
    const response = await getPage<JolpicaRaceTableResponse>(
      path + "?limit=" + PAGE + "&offset=" + page * PAGE,
      signal,
    );
    out.push(...(response.MRData?.RaceTable?.Races ?? []));
  }
  return out;
}

/** Runs two fetches side by side and keeps the total request rate low. */
async function fetchPair(
  a: string,
  b: string,
  signal: AbortSignal,
): Promise<[JolpicaRace[], JolpicaRace[]]> {
  const first = await fetchAllPages(a, signal);
  const second = await fetchAllPages(b, signal);
  return [first, second];
}

function timeText(result: JolpicaResult): string {
  const raw = result.Time?.time;
  if (!raw) return result.status || "—";
  // The API omits the unit on gaps, e.g. "+5.515".
  return raw.startsWith("+") ? raw + "s" : raw;
}

function toRow(result: JolpicaResult): RaceResult {
  return {
    pos: Number(result.position) || 0,
    code: result.Driver.code || "",
    driver: (result.Driver.givenName + " " + result.Driver.familyName).trim(),
    teamId: result.Constructor.constructorId,
    team: result.Constructor.name,
    grid: Number(result.grid) || 0,
    laps: Number(result.laps) || 0,
    status: result.status || "Finished",
    time: timeText(result),
    points: Number(result.points) || 0,
    fastestLap: result.FastestLap?.rank === "1",
    fastestLapTime: result.FastestLap?.Time?.time || "",
    fastestLapLap: Number(result.FastestLap?.lap) || 0,
  };
}

/**
 * A round can be split across a page boundary, so the two partial sheets are
 * joined by finishing position. Positions never repeat within a classification.
 */
function collectByRound<R extends { pos: number }>(
  races: JolpicaRace[],
  rowsOf: (race: JolpicaRace) => R[],
): Record<number, R[]> {
  const buckets = new Map<number, Map<number, R>>();

  for (const race of races) {
    const round = Number(race.round) || 0;
    const rows = rowsOf(race);
    if (!rows.length || !round) continue;
    let bucket = buckets.get(round);
    if (!bucket) {
      bucket = new Map<number, R>();
      buckets.set(round, bucket);
    }
    for (const row of rows) {
      if (row.pos && !bucket.has(row.pos)) bucket.set(row.pos, row);
    }
  }

  const map: Record<number, R[]> = {};
  for (const [round, bucket] of buckets) {
    map[round] = [...bucket.values()].sort((a, b) => a.pos - b.pos);
  }
  return map;
}

function qualifyingRows(race: JolpicaRace): QualifyingRow[] {
  return (race.QualifyingResults ?? []).map((row: JolpicaQualifyingResult) => ({
    pos: Number(row.position) || 0,
    code: row.Driver.code || "",
    driver: (row.Driver.givenName + " " + row.Driver.familyName).trim(),
    teamId: row.Constructor.constructorId,
    team: row.Constructor.name,
    q1: row.Q1 || "",
    q2: row.Q2 || "",
    q3: row.Q3 || "",
  }));
}

function polesByRound(qualifying: Record<number, QualifyingRow[]>): Record<number, string> {
  const map: Record<number, string> = {};
  for (const [round, rows] of Object.entries(qualifying)) {
    const pole = rows.find((row) => row.pos === 1);
    if (pole?.code) map[Number(round)] = pole.code;
  }
  return map;
}

/**
 * Post-session rulings the published classification does not carry. At Las
 * Vegas 2026 Antonelli's fastest Q3 lap was deleted, so the official pole is
 * Verstappen's (formula1.com pole positions, and Verstappen started from P1)
 * even though Jolpica still lists Antonelli first in the qualifying sheet.
 */
const POLE_FIXES: Record<string, Record<number, string>> = {
  "2026": { 21: "VER" },
};

/** Fetches and normalises every completed classification of the season. */
export async function fetchResultsBundle(
  season: string,
  signal: AbortSignal,
): Promise<ResultsBundle> {
  const [resultRaces, sprintRaces] = await fetchPair(
    "/current/results.json",
    "/current/sprint.json",
    signal,
  );

  let qualifyingRaces: JolpicaRace[] = [];
  try {
    qualifyingRaces = await fetchAllPages("/current/qualifying.json", signal);
  } catch (error) {
    // Qualifying only powers pole counts and the Q1/Q2/Q3 sheet, so the rest
    // of the Results view still works without it.
    console.warn("[F1] Qualifying sheet unavailable:", error);
  }

  const qualifying = collectByRound(qualifyingRaces, qualifyingRows);
  const poles = { ...polesByRound(qualifying), ...(POLE_FIXES[season] || {}) };

  return {
    season,
    fetchedAt: new Date().toISOString(),
    races: collectByRound(resultRaces, (race) => (race.Results ?? []).map(toRow)),
    sprints: collectByRound(sprintRaces, (race) => (race.SprintResults ?? []).map(toRow)),
    qualifying,
    poles,
  };
}
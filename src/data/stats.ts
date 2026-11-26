import type { DriverStats, RaceResult } from "../types";
import type { ResultsBundle } from "./details";

/** "Did not start" is a non-start, not a retirement; lapped cars did finish. */
const NOT_STARTED = /did not start|withdrawn|did not qualify|107%/i;
const CLASSIFIED = /^(\+\d+ lap|lapped|finished)/i;
const NOT_ENTERED = /did not qualify|107%|withdrawn/i;

/** The event counts as a race entry, even when the car never started. */
export function didEnter(row: RaceResult): boolean {
  return !NOT_ENTERED.test(row.status);
}

export function didStart(row: RaceResult): boolean {
  return !NOT_STARTED.test(row.status);
}

export function isDnf(row: RaceResult): boolean {
  return didStart(row) && !CLASSIFIED.test(row.status);
}

function zeroStats(): DriverStats {
  return {
    starts: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    top10: 0,
    fastestLaps: 0,
    dnfs: 0,
    points: 0,
    bestFinish: null,
    sprintStarts: 0,
    sprintWins: 0,
    sprintPodiums: 0,
    sprintPoints: 0,
  };
}

function tally(rows: RaceResult[]): DriverStats {
  const stats = zeroStats();
  for (const row of rows) {
    // The official "Grand Prix races" figure counts a DNS as an entry.
    if (didEnter(row)) stats.starts += 1;
    if (didStart(row)) {
      if (row.pos === 1) stats.wins += 1;
      if (row.pos >= 1 && row.pos <= 3) stats.podiums += 1;
      if (row.pos >= 1 && row.pos <= 10) stats.top10 += 1;
      if (row.pos >= 1 && (stats.bestFinish === null || row.pos < stats.bestFinish)) {
        stats.bestFinish = row.pos;
      }
      if (isDnf(row)) stats.dnfs += 1;
    }
    if (row.fastestLap) stats.fastestLaps += 1;
    stats.points += row.points;
  }
  return stats;
}

/**
 * Season totals for one driver, derived from the race and sprint sheets.
 * Results only arrive once their detail bundle has been fetched, so the UI
 * shows the standings-only figures until then.
 */
export function computeDriverStats(code: string, bundle: ResultsBundle): DriverStats {
  const raceRows: RaceResult[] = [];
  const poleRounds = new Set<number>();

  for (const [key, rows] of Object.entries(bundle.races)) {
    const round = Number(key);
    const row = rows.find((item) => item.code === code);
    if (!row) continue;
    raceRows.push(row);
    if (bundle.poles[round] === code) poleRounds.add(round);
  }

  const stats = tally(raceRows);
  stats.poles = poleRounds.size;

  const sprintRows: RaceResult[] = [];
  for (const rows of Object.values(bundle.sprints)) {
    const row = rows.find((item) => item.code === code);
    if (row) sprintRows.push(row);
  }

  const sprint = tally(sprintRows);
  stats.sprintStarts = sprint.starts;
  stats.sprintWins = sprint.wins;
  stats.sprintPodiums = sprint.podiums;
  stats.sprintPoints = sprint.points;

  return stats;
}
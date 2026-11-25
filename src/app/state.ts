import { sessionsOf } from "../lib/format";
import type { ResultsBundle } from "../data/details";
import type { DataSource, Race, SeasonData, ViewName } from "../types";

export type ResultsSub = "races" | "drivers" | "teams";
export type SheetKey = "race" | "sprint" | "qualifying" | "grid" | "fastest";

export interface AppState {
  data: SeasonData | null;
  savedAt: number;
  source: DataSource;
  loading: boolean;
  stale: boolean;
  lastFetch: number;
  lastAttempt: number;
  sig: string;
  view: ViewName;
  open: Set<number>;
  nextSession: number | null | undefined;
  /** Detailed classifications, fetched after the standings. */
  details: ResultsBundle | null;
  detailsLoading: boolean;
  detailsError: string;
  resultsSub: ResultsSub;
  resultsRound: number | null;
  resultsSheet: SheetKey;
  driverCode: string | null;
}

export const state: AppState = {
  data: null,
  savedAt: 0,
  source: "sample",
  loading: false,
  stale: false,
  lastFetch: 0,
  lastAttempt: 0,
  sig: "",
  view: "schedule",
  open: new Set<number>(),
  nextSession: undefined,
  details: null,
  detailsLoading: false,
  detailsError: "",
  resultsSub: "races",
  resultsRound: null,
  resultsSheet: "race",
  driverCode: null,
};

export function nextRace(): Race | null {
  if (!state.data) return null;
  const races = state.data.races;
  // The standings carry the last completed round, which is more reliable than
  // looking for a missing winner: the calendar often has no result sheets at
  // all for rounds that have not run yet.
  const done = state.data.round || 0;
  const upcoming = done ? races.find((race) => race.round > done) : null;
  if (upcoming) return upcoming;
  return races.find((race) => !race.winner) || null;
}

/** Cheap change detector: avoids re-rendering identical API responses. */
export function signature(data: SeasonData): string {
  return JSON.stringify([
    data.season,
    data.round,
    data.races.map((race) => [race.round, race.winner ? race.winner.driver + race.winner.result : ""]),
    data.teams.map((team) => [team.id, team.points, team.wins]),
    data.drivers.map((driver) => [driver.code, driver.points, driver.wins]),
  ]);
}

export function validData(value: unknown): value is SeasonData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<SeasonData>;
  return Array.isArray(data.races) && data.races.length > 0 && Array.isArray(data.teams);
}

export function useData(data: SeasonData, source: DataSource): void {
  state.data = data;
  state.savedAt = Date.parse(data.fetchedAt) || Date.now();
  state.source = source;
}

/** Timestamp of the next session in any race, or null when the season is done. */
export function nextSessionTime(): number | null {
  if (!state.data) return null;
  const now = Date.now();
  let next: number | null = null;
  for (const race of state.data.races) {
    for (const session of sessionsOf(race)) {
      const time = Date.parse(session.start);
      if (!Number.isNaN(time) && time > now && (next === null || time < next)) next = time;
    }
  }
  return next;
}
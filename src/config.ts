import type { SessionSlotKey, SessionType } from "./types";

/**
 * Jolpica F1 — the community successor of the Ergast API.
 *
 * Endpoints used:
 *   /current.json                      — season calendar
 *   /current/results/1.json?limit=100  — race winners
 *   /current/driverstandings.json      — drivers' standings
 *   /current/constructorstandings.json — constructors' standings
 */
export const API_BASE = "https://api.jolpi.ca/ergast/f1";

/** Automatic refresh interval; the tab also refreshes when it becomes visible. */
export const REFRESH_MS = 10 * 60 * 1000;
export const FETCH_TIMEOUT = 20_000;

export const CACHE_KEY = "f1.dashboard.cache.v2";
export const DETAILS_KEY = "f1.results.cache.v2";
/** Previous sheet cache; removed on boot because it misses pole rulings. */
export const DETAILS_LEGACY_KEY = "f1.results.cache.v1";
export const MODE_KEY = "f1.mode";
export const ACCENT_KEY = "f1.accent";

/** Fallback zone when the browser cannot resolve one; settings override it. */
export const TZ = "Europe/Prague";

/** Offline snapshot served next to the built page. */
export const FALLBACK_FILE = "data.json";

/** Offline copy of the race, sprint and qualifying sheets. */
export const FALLBACK_DETAILS = "details.json";

/**
 * Jolpica only publishes session start times, so durations are the usual
 * Formula 1 session lengths (race ≈ 2 h).
 */
export const SESSION_DEFS: ReadonlyArray<
  readonly [SessionSlotKey, string, SessionType, number]
> = [
  ["FirstPractice", "Practice 1", "practice", 60],
  ["SecondPractice", "Practice 2", "practice", 60],
  ["ThirdPractice", "Practice 3", "practice", 60],
  ["SprintQualifying", "Sprint Qualifying", "sprint-qualifying", 44],
  ["Sprint", "Sprint", "sprint", 60],
  ["Qualifying", "Qualifying", "qualifying", 60],
];
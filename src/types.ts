/** Domain model shared by the data layer and the UI. */

export type ThemeMode = "system" | "dark" | "light";

export type FontChoice = "sans" | "serif" | "mono";

export type AccentKey =
  | "red"
  | "blue"
  | "green"
  | "teal"
  | "amber"
  | "pink"
  | "violet"
  | "graphite";

export type ViewName = "schedule" | "results";

/** One classified car from a race or sprint result sheet. */
export interface RaceResult {
  pos: number;
  code: string;
  driver: string;
  teamId: string;
  team: string;
  grid: number;
  laps: number;
  status: string;
  /** Total time for the winner, "+5.515s" for the rest, or the status text. */
  time: string;
  points: number;
  fastestLap: boolean;
  /** Quickest lap of that car, when the API publishes one. */
  fastestLapTime?: string;
  /** Lap number of that quickest lap. */
  fastestLapLap?: number;
}

/** Per-driver totals derived from the season's result sheets. */
export interface DriverStats {
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  top10: number;
  fastestLaps: number;
  dnfs: number;
  points: number;
  bestFinish: number | null;
  sprintStarts: number;
  sprintWins: number;
  sprintPodiums: number;
  sprintPoints: number;
}

export type SessionType =
  | "practice"
  | "sprint-qualifying"
  | "sprint"
  | "qualifying"
  | "race";

export type DataSource = "live" | "cache" | "file" | "sample";

export type SessionSlotKey =
  | "FirstPractice"
  | "SecondPractice"
  | "ThirdPractice"
  | "SprintQualifying"
  | "Sprint"
  | "Qualifying";

export interface RaceSession {
  name: string;
  type: SessionType;
  /** ISO timestamp of the session start. */
  start: string;
  /** Usual session length in minutes (Jolpica only publishes start times). */
  minutes: number;
}

export interface RaceWinner {
  driver: string;
  code: string;
  teamId: string;
  team: string;
  result: string;
}

export interface Race {
  round: number;
  name: string;
  circuit: string;
  city: string;
  country: string;
  /** Race day as published by the API (YYYY-MM-DD). */
  date: string;
  time: string;
  /** ISO timestamp of the race start. */
  start: string;
  weekFrom: string;
  sprint: boolean;
  sessions: RaceSession[];
  winner: RaceWinner | null;
  /** Race classification, filled in when the result sheets are loaded. */
  results?: RaceResult[];
}

export interface DriverStanding {
  pos: number;
  name: string;
  code: string;
  teamId: string;
  team: string;
  points: number;
  wins: number;
  /** Permanent car number, e.g. "12". */
  number?: string;
  /** Nationality as published by the API, e.g. "Italian". */
  nationality?: string;
}

export interface TeamStanding {
  pos: number;
  id: string;
  name: string;
  points: number;
  wins: number;
}

export interface SeasonData {
  season: string;
  round: number;
  fetchedAt: string;
  races: Race[];
  drivers: DriverStanding[];
  teams: TeamStanding[];
}

export interface TeamPalette {
  dark: string;
  light: string;
}
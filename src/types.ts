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

export type ViewName = "schedule" | "teams" | "drivers";

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
}

export interface DriverStanding {
  pos: number;
  name: string;
  code: string;
  teamId: string;
  team: string;
  points: number;
  wins: number;
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
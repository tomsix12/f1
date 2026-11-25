import { API_BASE } from "../config";

/** Raw shapes returned by the Jolpica F1 API (Ergast-compatible). */

export interface JolpicaSessionSlot {
  date: string;
  time?: string;
}

export interface JolpicaResult {
  position?: string;
  positionText?: string;
  points?: string;
  grid?: string;
  laps?: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
    permanentNumber?: string;
    nationality?: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  Time?: { time?: string; millis?: string };
  status?: string;
  FastestLap?: {
    rank?: string;
    lap?: string;
    Time?: { time?: string };
  };
}

export interface JolpicaRace {
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit?: {
    circuitName?: string;
    Location?: {
      locality?: string;
      country?: string;
    };
  };
  FirstPractice?: JolpicaSessionSlot;
  SecondPractice?: JolpicaSessionSlot;
  ThirdPractice?: JolpicaSessionSlot;
  SprintQualifying?: JolpicaSessionSlot;
  Sprint?: JolpicaSessionSlot;
  Qualifying?: JolpicaSessionSlot;
  Results?: JolpicaResult[];
  SprintResults?: JolpicaResult[];
  QualifyingResults?: JolpicaQualifyingResult[];
}

export interface JolpicaQualifyingResult {
  position?: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface JolpicaRaceTableResponse {
  MRData?: {
    total?: string;
    limit?: string;
    offset?: string;
    RaceTable?: {
      season?: string;
      round?: string;
      Races?: JolpicaRace[];
    };
  };
}

export interface JolpicaDriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
    permanentNumber?: string;
    nationality?: string;
  };
  Constructors?: Array<{
    constructorId: string;
    name: string;
  }>;
}

export interface JolpicaConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: {
    constructorId: string;
    name: string;
  };
}

export interface JolpicaStandingsResponse {
  MRData?: {
    StandingsTable?: {
      StandingsLists?: Array<{
        round?: string;
        DriverStandings?: JolpicaDriverStanding[];
        ConstructorStandings?: JolpicaConstructorStanding[];
      }>;
    };
  };
}

export async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(API_BASE + path, {
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("HTTP " + response.status + " for " + path);
  }
  return (await response.json()) as T;
}
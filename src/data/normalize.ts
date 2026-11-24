import { SESSION_DEFS } from "../config";
import type {
  DriverStanding,
  Race,
  RaceSession,
  RaceWinner,
  SeasonData,
  TeamStanding,
} from "../types";
import type {
  JolpicaRace,
  JolpicaRaceTableResponse,
  JolpicaResult,
  JolpicaStandingsResponse,
} from "./jolpica";

function winnerFrom(race: JolpicaRace): RaceWinner | null {
  const result: JolpicaResult | undefined = race.Results?.[0];
  if (!result) return null;
  return {
    driver: (result.Driver.givenName + " " + result.Driver.familyName).trim(),
    code: result.Driver.code || "",
    teamId: result.Constructor.constructorId,
    team: result.Constructor.name,
    result: (result.Time && result.Time.time) || result.status || "Finished",
  };
}

function sessionsFrom(race: JolpicaRace): RaceSession[] {
  const sessions: RaceSession[] = [];

  for (const [key, name, type, minutes] of SESSION_DEFS) {
    const slot = race[key];
    if (!slot || !slot.date) continue;
    sessions.push({
      name,
      type,
      start: slot.date + "T" + (slot.time || "12:00:00Z"),
      minutes,
    });
  }

  sessions.push({
    name: "Race",
    type: "race",
    start: race.date + "T" + (race.time || "12:00:00Z"),
    minutes: 120,
  });

  sessions.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return sessions;
}

/** Converts the four Jolpica payloads into the flat model the UI renders. */
export function normalize(
  calendar: JolpicaRaceTableResponse,
  winners: JolpicaRaceTableResponse,
  driversPayload: JolpicaStandingsResponse,
  teamsPayload: JolpicaStandingsResponse,
): SeasonData {
  const raceTable = calendar.MRData?.RaceTable;
  if (!raceTable || !Array.isArray(raceTable.Races) || !raceTable.Races.length) {
    throw new Error("Calendar endpoint returned no races");
  }

  const winnerByRound = new Map<string, RaceWinner>();
  const winnerRaces = winners.MRData?.RaceTable?.Races ?? [];
  for (const race of winnerRaces) {
    const winner = winnerFrom(race);
    if (winner) winnerByRound.set(String(race.round), winner);
  }

  const races: Race[] = raceTable.Races.map((race) => ({
    round: Number(race.round),
    name: race.raceName,
    circuit: race.Circuit?.circuitName || "",
    city: race.Circuit?.Location?.locality || "",
    country: race.Circuit?.Location?.country || "",
    date: race.date,
    time: race.time || "",
    start: race.date + "T" + (race.time || "12:00:00Z"),
    weekFrom: race.FirstPractice?.date || race.date,
    sprint: Boolean(race.Sprint),
    sessions: sessionsFrom(race),
    winner: winnerByRound.get(String(race.round)) || null,
  }));

  const driverTable = driversPayload.MRData?.StandingsTable?.StandingsLists?.[0] ?? null;
  const drivers: DriverStanding[] = (driverTable?.DriverStandings ?? []).map((entry) => {
    const constructors = entry.Constructors ?? [];
    const team = constructors[constructors.length - 1];
    return {
      pos: Number(entry.position),
      name: (entry.Driver.givenName + " " + entry.Driver.familyName).trim(),
      code: entry.Driver.code || "",
      teamId: team?.constructorId || "",
      team: team?.name || "",
      points: Number(entry.points),
      wins: Number(entry.wins),
    };
  });

  const teamTable = teamsPayload.MRData?.StandingsTable?.StandingsLists?.[0] ?? null;
  const teams: TeamStanding[] = (teamTable?.ConstructorStandings ?? []).map((entry) => ({
    pos: Number(entry.position),
    id: entry.Constructor.constructorId,
    name: entry.Constructor.name,
    points: Number(entry.points),
    wins: Number(entry.wins),
  }));

  if (!teams.length) {
    throw new Error("Constructor standings endpoint returned no teams");
  }

  return {
    season: String(raceTable.season || ""),
    round: Number(teamTable?.round || 0),
    fetchedAt: new Date().toISOString(),
    races,
    drivers: drivers.sort((a, b) => a.pos - b.pos),
    teams: teams.sort((a, b) => a.pos - b.pos),
  };
}
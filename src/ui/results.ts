import {
  DATA_EVENT,
  RESULTS_EVENT,
  VIEW_EVENT,
  WANT_RESULTS_EVENT,
} from "../app/events";
import { state, type ResultsSub, type SheetKey } from "../app/state";
import type { QualifyingRow } from "../data/details";
import { flagFor, flagForNationality } from "../data/flags";
import { driverAvatarFile, driverInitials, driverPhoto, driverHeroFile } from "../data/photos";
import { computeDriverStats } from "../data/stats";
import { teamColors, teamNameFor } from "../data/teams";
import { $, $$, esc } from "../lib/dom";
import {
  fmtDayMonth,
  fmtPoints,
  fmtWeekday,
  pad2,
  raceStart,
  winsText,
} from "../lib/format";
import { getFavDriver, getFavTeam, onFavouritesChange, setFavDriver } from "../lib/prefs";
import type { DriverStanding, Race, RaceResult, SeasonData } from "../types";
import { subFromHash } from "./nav";

const SUBS: ResultsSub[] = ["drivers", "teams", "races"];

interface SheetDef {
  key: SheetKey;
  label: string;
  short: string;
}

const SHEETS: SheetDef[] = [
  { key: "race", label: "Race result", short: "Race" },
  { key: "sprint", label: "Sprint result", short: "Sprint" },
  { key: "qualifying", label: "Qualifying", short: "Quali" },
  { key: "grid", label: "Starting grid", short: "Grid" },
  { key: "fastest", label: "Fastest laps", short: "Fastest" },
];

const ICON_SEARCH =
  '<svg class="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
const ICON_CLEAR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const ICON_CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const ICON_BACK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const ICON_CHECK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_STAR =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z"/></svg>';

/* ------------------------------------------------------------------ helpers */

function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function ordinal(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return value + "st";
  if (mod10 === 2 && mod100 !== 12) return value + "nd";
  if (mod10 === 3 && mod100 !== 13) return value + "rd";
  return value + "th";
}

function shortRaceName(name: string): string {
  const index = String(name).indexOf(" Grand Prix");
  const short = index === -1 ? String(name) : String(name).slice(0, index);
  return short.trim() || String(name);
}

function teamVars(teamId: string): string {
  const colors = teamColors(teamId);
  return "--team-dark:" + colors.dark + ";--team-light:" + colors.light;
}

function avatar(code: string, name: string, teamId: string, className = ""): string {
  const file = driverAvatarFile(code);
  const body = file
    ? '<img src="' + esc(file) + '" alt="" loading="lazy" decoding="async">'
    : '<span class="avatar__initials" aria-hidden="true">' + esc(driverInitials(name)) + "</span>";
  return (
    '<span class="avatar ' + className + '" style="' + teamVars(teamId) + '">' + body + "</span>"
  );
}

/** Splits "Andrea Kimi Antonelli" into the script-style first name and surname. */
function nameParts(name: string): { first: string; last: string } {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length < 2) return { first: "", last: String(name) };
  const last = parts.pop() as string;
  return { first: parts.join(" "), last };
}

function searchBar(id: string, placeholder: string, label: string): string {
  return (
    '<div class="search" role="search">' +
      ICON_SEARCH +
      '<input class="search__input" id="' + id + '" type="search" placeholder="' + esc(placeholder) +
        '" aria-label="' + esc(label) + '" autocomplete="off" spellcheck="false">' +
      '<button class="search__clear" type="button" data-clear="' + id + '" aria-label="Clear search" hidden>' +
        ICON_CLEAR +
      "</button>" +
    "</div>"
  );
}

function emptyState(id: string, message: string): string {
  return '<p class="empty" id="' + id + '" hidden>' + esc(message) + "</p>";
}

/** Compact outbound link to the matching page on formula1.com. */
function sourceLink(path: string, label: string): string {
  return (
    '<p class="results__source"><a href="https://www.formula1.com/en/' + esc(path) +
      '" target="_blank" rel="noopener">' + esc(label) +
      ' <span aria-hidden="true">↗</span></a></p>'
  );
}

function raceDate(race: Race): string {
  const start = raceStart(race);
  return fmtWeekday(start) + " " + fmtDayMonth(start);
}

function findDriver(data: SeasonData, code: string): DriverStanding | null {
  return data.drivers.find((driver) => driver.code === code) || null;
}

/* -------------------------------------------------------------------- views */

export function renderResults(): void {
  const host = $("#results-body");
  if (!host || !state.data) return;

  // A deep link may name a driver the current season no longer lists.
  if (state.driverCode && !findDriver(state.data, state.driverCode)) {
    const inBundle = state.details
      ? Object.values(state.details.races).flat().some((row) => row.code === state.driverCode)
      : false;
    if (!inBundle) state.driverCode = null;
  }

  const season = $("#results-season");
  if (season) season.textContent = state.data.season + " season";

  for (const button of $$("[data-sub]", $("#results-sub") || document)) {
    button.setAttribute("aria-pressed", String(button.dataset.sub === state.resultsSub));
  }

  host.innerHTML = state.driverCode
    ? renderDriverProfile(state.data, state.driverCode)
    : renderSub(state.data);
}

function renderSub(data: SeasonData): string {
  if (state.resultsSub === "drivers") return renderDrivers(data);
  if (state.resultsSub === "teams") return renderTeams(data);
  return renderRaces(data);
}

/* ------------------------------------------------------------------ drivers */

function renderDrivers(data: SeasonData): string {
  const drivers = data.drivers || [];
  const leader = Math.max(1, drivers.length ? drivers[0].points : 1);
  const favDriver = getFavDriver();

  const rows = drivers.map((driver) => {
    const fav = favDriver && driver.code === favDriver;
    const pct = Math.max(1.5, Math.round((driver.points / leader) * 1000) / 10);
    const medal = driver.pos <= 3 ? " is-p" + driver.pos : "";
    const haystack = [driver.name, driver.code, driver.team, driver.number]
      .filter(Boolean)
      .join(" ");

    return (
      '<li class="driver-row' + (fav ? " is-fav" : "") + '" data-search="' +
        esc(normalise(haystack)) + '" style="' + teamVars(driver.teamId) + ";--pct:" + pct + '%">' +
        '<button class="driver-row__btn" type="button" data-driver="' + esc(driver.code) + '">' +
          '<span class="driver-row__pos' + medal + '">' + driver.pos + "</span>" +
          '<span class="driver-row__edge" aria-hidden="true"></span>' +
          avatar(driver.code, driver.name, driver.teamId, "avatar--row") +
          '<span class="driver-row__main">' +
            '<span class="driver-row__name">' +
              '<span class="driver-row__nameText">' + esc(driver.name) + "</span>" +
              (driver.code ? '<span class="driver-row__code">' + esc(driver.code) + "</span>" : "") +
              (fav ? '<span class="fav-star" aria-hidden="true">' + ICON_STAR + "</span>" : "") +
            "</span>" +
            '<span class="driver-row__sub">' +
              esc(teamNameFor(driver.teamId, driver.team)) + " · " + esc(winsText(driver.wins)) +
            "</span>" +
          "</span>" +
          '<span class="driver-row__pts">' + fmtPoints(driver.points) + "<span>PTS</span></span>" +
        "</button>" +
      "</li>"
    );
  });

  return (
    '<div class="results__toolbar">' +
      searchBar("driver-search", "Search drivers", "Search drivers") +
      '<span class="results__count">' + drivers.length + " drivers</span>" +
    "</div>" +
    '<ol class="driver-list" id="driver-grid" aria-label="Drivers’ championship">' +
      rows.join("") +
    "</ol>" +
    emptyState("driver-empty", "No driver matches that search.") +
    sourceLink("results/" + data.season + "/drivers", "Full drivers’ results on Formula1.com")
  );
}

/* -------------------------------------------------------------------- teams */

function renderTeams(data: SeasonData): string {
  const teams = data.teams || [];
  const leader = Math.max(1, teams.length ? teams[0].points : 1);
  const favTeam = getFavTeam();

  const cards = teams.map((team) => {
    const fav = favTeam && team.id === favTeam;
    const pct = Math.max(1.5, Math.round((team.points / leader) * 1000) / 10);
    const medal = team.pos <= 3 ? " is-p" + team.pos : "";
    const name = teamNameFor(team.id, team.name);
    const lineup = (data.drivers || [])
      .filter((driver) => driver.teamId === team.id)
      .map((driver) => driver.code)
      .filter(Boolean)
      .join(" · ");
    const haystack = [name, team.id, lineup].join(" ");

    return (
      '<li class="team-card' + (fav ? " is-fav" : "") + '" data-search="' + esc(normalise(haystack)) +
        '" style="' + teamVars(team.id) + ";--pct:" + pct + '%">' +
        '<span class="team-card__pos' + medal + '">' + team.pos + "</span>" +
        '<span class="team-card__edge" aria-hidden="true"></span>' +
        '<span class="team-card__main">' +
          '<span class="team-card__name"><span class="team-card__name-text">' + esc(name) + "</span>" +
            (fav ? '<span class="fav-star" aria-hidden="true">' + ICON_STAR + "</span>" : "") +
          "</span>" +
          '<span class="team-card__sub">' + esc(winsText(team.wins)) +
            (lineup ? ' <span class="team-card__lineup">' + esc(lineup) + "</span>" : "") +
          "</span>" +
        "</span>" +
        '<span class="team-card__pts">' + fmtPoints(team.points) + "<span>PTS</span></span>" +
      "</li>"
    );
  });

  return (
    '<div class="results__toolbar">' +
      searchBar("team-search", "Search teams", "Search teams") +
      '<span class="results__count">' + teams.length + " teams</span>" +
    "</div>" +
    '<ol class="team-list" id="team-list" aria-label="Constructors’ championship">' +
      cards.join("") +
    "</ol>" +
    emptyState("team-empty", "No team matches that search.") +
    sourceLink("results/" + data.season + "/team", "Full team results on Formula1.com")
  );
}

/** Imported lazily to keep the favourites helpers in one module. */

/* -------------------------------------------------------------------- races */

function currentRound(data: SeasonData): number {
  const races = data.races.slice().sort((a, b) => a.round - b.round);
  if (!races.length) return 0;
  const selected = state.resultsRound;
  if (selected && races.some((race) => race.round === selected)) return selected;

  const done = races.filter((race) => race.round <= (data.round || 0));
  const fallback = done.length ? done[done.length - 1] : races[0];
  state.resultsRound = fallback.round;
  return fallback.round;
}

function availableSheets(round: number): SheetKey[] {
  const bundle = state.details;
  if (!bundle) return ["race"];
  const list: SheetKey[] = [];
  if (bundle.races[round]?.length) list.push("race", "grid", "fastest");
  if (bundle.sprints[round]?.length) list.push("sprint");
  if (bundle.qualifying[round]?.length) list.push("qualifying");
  return list.length ? list : ["race"];
}

function renderRaces(data: SeasonData): string {
  const races = data.races.slice().sort((a, b) => b.round - a.round);
  const round = currentRound(data);
  const race = data.races.find((item) => item.round === round) || races[0];
  if (!race) return emptyState("race-empty", "No races in this season yet.");

  const available = availableSheets(round);
  if (!available.includes(state.resultsSheet)) state.resultsSheet = "race";
  const sheet = available.includes(state.resultsSheet) ? state.resultsSheet : available[0];

  return (
    renderRacePicker(races, race) +
    renderRaceHero(race) +
    renderSheet(race, sheet, available) +
    sourceLink("results/" + data.season + "/races", "Race calendar on Formula1.com")
  );
}

function renderRacePicker(races: Race[], selected: Race): string {
  const items = races.map((race) => {
    const active = race.round === selected.round;
    const haystack = normalise(
      [shortRaceName(race.name), race.name, race.country, race.city, "round " + race.round].join(" "),
    );
    const done = Boolean(race.winner) || Boolean(state.details?.races[race.round]?.length);
    return (
      '<li><button class="picker__item' + (active ? " is-active" : "") + '" type="button" role="option" ' +
        'aria-selected="' + active + '" data-round="' + race.round + '" data-search="' + esc(haystack) + '"' +
        (!done ? ' data-upcoming="true"' : "") + ">" +
        '<span class="picker__itemFlag">' + flagFor(race.country) + "</span>" +
        '<span class="picker__itemText">' +
          "<strong>" + esc(shortRaceName(race.name)) + "</strong>" +
          "<small>Round " + pad2(race.round) + " · " + esc(raceDate(race)) +
            (done ? "" : " · upcoming") + "</small>" +
        "</span>" +
        '<span class="picker__check" aria-hidden="true">' + ICON_CHECK + "</span>" +
      "</button></li>"
    );
  });

  return (
    '<div class="results__toolbar results__toolbar--races">' +
      '<div class="picker" id="race-picker">' +
        '<button class="picker__btn" type="button" id="race-picker-btn" aria-expanded="false" aria-controls="race-menu">' +
          '<span class="picker__flag">' + flagFor(selected.country) + "</span>" +
          '<span class="picker__text">' +
            '<span class="picker__label">Grand Prix</span>' +
            '<span class="picker__value">' + esc(shortRaceName(selected.name)) + "</span>" +
          "</span>" +
          '<span class="picker__chev" aria-hidden="true">' + ICON_CHEVRON + "</span>" +
        "</button>" +
        '<div class="picker__menu" id="race-menu" hidden>' +
          '<div class="picker__searchWrap">' +
            searchBar("race-search", "Search races or countries", "Search races") +
          "</div>" +
          '<ul class="picker__list" role="listbox" aria-label="Choose a Grand Prix">' + items.join("") + "</ul>" +
          emptyState("race-empty", "No race matches that search.") +
        "</div>" +
      "</div>" +
      '<span class="results__count">' + races.length + " races</span>" +
    "</div>"
  );
}

function podiumChips(rows: RaceResult[] | undefined): string {
  if (!rows || rows.length < 3) return "";
  return (
    '<div class="racehero__podium" aria-label="Podium">' +
      rows.slice(0, 3).map((row) =>
        '<span class="racehero__podiumItem" style="' + teamVars(row.teamId) + '">' +
          '<span class="racehero__podiumPos">P' + row.pos + "</span>" +
          '<span class="racehero__podiumName">' + esc(row.code || row.driver) + "</span>" +
        "</span>",
      ).join("") +
    "</div>"
  );
}

function renderRaceHero(race: Race): string {
  const rows = state.details?.races[race.round];
  return (
    '<article class="racehero" style="' + teamVars(rows?.[0]?.teamId || "") + '">' +
      '<span class="racehero__round" aria-hidden="true">R' + pad2(race.round) + "</span>" +
      '<div class="racehero__top">' + flagFor(race.country) +
        '<span class="racehero__date">' + esc(raceDate(race)) + "</span>" +
        '<span class="racehero__roundLabel">Round ' + race.round + "</span>" +
        (race.sprint ? '<span class="tag tag--sprint">Sprint</span>' : "") +
      "</div>" +
      '<h3 class="racehero__title">' + esc(shortRaceName(race.name)) + " <em>Grand Prix</em></h3>" +
      '<p class="racehero__meta">' + esc(race.circuit || "Circuit to be confirmed") +
        (race.city ? " · " + esc(race.city) : "") +
        (race.country ? ", " + esc(race.country) : "") +
      "</p>" +
      podiumChips(rows) +
    "</article>"
  );
}

function sheetHeading(sheet: SheetKey): string {
  return SHEETS.find((item) => item.key === sheet)?.label || "Race result";
}

function renderSheet(
  race: Race,
  sheet: SheetKey,
  available: SheetKey[],
): string {
  const tabs = available.length > 1
    ? '<div class="sheetTabs" role="group" aria-label="Classification">' +
        available.map((key) => {
          const def = SHEETS.find((item) => item.key === key);
          if (!def) return "";
          return '<button class="sheetTab" type="button" data-sheet="' + key +
            '" aria-pressed="' + (key === sheet) + '">' + esc(def.short) + "</button>";
        }).join("") +
      "</div>"
    : "";

  const body = state.details
    ? sheetBody(race, sheet)
    : loadingBody();

  return (
    '<section class="sheet" aria-labelledby="sheet-title">' +
      '<div class="sheet__head">' +
        '<h3 class="sheet__title" id="sheet-title">' + esc(sheetHeading(sheet)) + "</h3>" +
        tabs +
      "</div>" +
      body +
    "</section>"
  );
}

function loadingBody(): string {
  if (state.detailsError) {
    return (
      '<div class="sheetEmpty">' +
        "<p>" + esc(state.detailsError) + "</p>" +
        '<button class="textbtn" type="button" data-action="retry-results">Try again</button>' +
      "</div>"
    );
  }
  return (
    '<div class="sheetEmpty" aria-live="polite">' +
      '<span class="spinner" aria-hidden="true"></span>' +
      "<p>Loading the classification…</p>" +
    "</div>"
  );
}

function rowHead(labels: string[], className = ""): string {
  return (
    '<li class="result-row result-row--head ' + className + '" aria-hidden="true">' +
      labels.map((label, index) =>
        '<span class="result-row__cell result-row__cell--' + index + '">' + esc(label) + "</span>",
      ).join("") +
    "</li>"
  );
}

function raceSheet(rows: RaceResult[]): string {
  if (!rows.length) return emptySheet("No classification published yet.");
  return (
    '<ol class="result-list result-list--race">' +
      rowHead(["Pos", "Driver", "Time / retired", "Pts"], "result-row--4") +
      rows.map((row) =>
        '<li class="result-row result-row--4" data-driver="' + esc(row.code) + '">' +
          '<span class="result-row__pos' + (row.pos <= 3 ? " is-p" + row.pos : "") + '">' + row.pos + "</span>" +
          '<span class="result-row__driver">' +
            avatar(row.code, row.driver, row.teamId, "avatar--sm") +
            '<span class="result-row__names">' +
              '<span class="result-row__name">' + esc(row.driver) + "</span>" +
              '<span class="result-row__team">' + esc(teamNameFor(row.teamId, row.team)) + "</span>" +
            "</span>" +
            (row.fastestLap ? '<span class="fastlap" title="Fastest lap" aria-label="Fastest lap">FL</span>' : "") +
          "</span>" +
          '<span class="result-row__time" title="' + esc(row.status) + '">' + esc(row.time) + "</span>" +
          '<span class="result-row__pts">' + fmtPoints(row.points) + "</span>" +
        "</li>",
      ).join("") +
    "</ol>"
  );
}

function qualifyingSheet(rows: QualifyingRow[]): string {
  if (!rows.length) return emptySheet("Qualifying times are not available for this round.");
  return (
    '<ol class="result-list result-list--quali">' +
      rowHead(["Pos", "Driver", "Q1", "Q2", "Q3"], "result-row--5") +
      rows.map((row) =>
        '<li class="result-row result-row--5" data-driver="' + esc(row.code) + '">' +
          '<span class="result-row__pos' + (row.pos <= 3 ? " is-p" + row.pos : "") + '">' + row.pos + "</span>" +
          '<span class="result-row__driver">' +
            avatar(row.code, row.driver, row.teamId, "avatar--sm") +
            '<span class="result-row__names"><span class="result-row__name">' + esc(row.driver) + "</span>" +
              '<span class="result-row__team">' + esc(teamNameFor(row.teamId, row.team)) + "</span></span>" +
          "</span>" +
          '<span class="result-row__time result-row__time--q1">' + esc(row.q1 || "—") + "</span>" +
          '<span class="result-row__time">' + esc(row.q2 || "—") + "</span>" +
          '<span class="result-row__time">' + esc(row.q3 || "—") + "</span>" +
        "</li>",
      ).join("") +
    "</ol>"
  );
}

function gridSheet(rows: RaceResult[], quali: QualifyingRow[] | undefined): string {
  if (!rows.length) return emptySheet("The starting grid is not available for this round.");
  const order = rows.slice().sort((a, b) => a.grid - b.grid);
  const best = new Map((quali || []).map((row) => [row.code, row.q3 || row.q2 || row.q1]));
  return (
    '<ol class="result-list result-list--grid">' +
      rowHead(["Grid", "Driver", "Qualifying", ""], "result-row--4") +
      order.map((row) =>
        '<li class="result-row result-row--4" data-driver="' + esc(row.code) + '">' +
          '<span class="result-row__pos' + (row.grid <= 3 ? " is-p" + row.grid : "") + '">' +
            (row.grid || "—") + "</span>" +
          '<span class="result-row__driver">' +
            avatar(row.code, row.driver, row.teamId, "avatar--sm") +
            '<span class="result-row__names"><span class="result-row__name">' + esc(row.driver) + "</span>" +
              '<span class="result-row__team">' + esc(teamNameFor(row.teamId, row.team)) + "</span></span>" +
          "</span>" +
          '<span class="result-row__time">' + esc(best.get(row.code) || "—") + "</span>" +
          '<span class="result-row__time">' + esc(row.status) + "</span>" +
        "</li>",
      ).join("") +
    "</ol>"
  );
}

function fastestSheet(rows: RaceResult[]): string {
  const laps = rows
    .filter((row) => row.fastestLapTime)
    .slice()
    .sort((a, b) => a.fastestLapTime!.localeCompare(b.fastestLapTime!));
  if (!laps.length) return emptySheet("Lap times are not available for this round.");
  return (
    '<ol class="result-list result-list--fastest">' +
      rowHead(["Rank", "Driver", "Lap time", "Lap"], "result-row--4") +
      laps.map((row, index) =>
        '<li class="result-row result-row--4' + (index === 0 ? " is-fastest" : "") +
          '" data-driver="' + esc(row.code) + '">' +
          '<span class="result-row__pos">' + (index + 1) + "</span>" +
          '<span class="result-row__driver">' +
            avatar(row.code, row.driver, row.teamId, "avatar--sm") +
            '<span class="result-row__names"><span class="result-row__name">' + esc(row.driver) + "</span>" +
              '<span class="result-row__team">' + esc(teamNameFor(row.teamId, row.team)) + "</span></span>" +
          "</span>" +
          '<span class="result-row__time">' + esc(row.fastestLapTime || "") + "</span>" +
          '<span class="result-row__time">' + (row.fastestLapLap ? "L" + row.fastestLapLap : "—") + "</span>" +
        "</li>",
      ).join("") +
    "</ol>"
  );
}

function emptySheet(message: string): string {
  return '<div class="sheetEmpty"><p>' + esc(message) + "</p></div>";
}

function sheetBody(race: Race, sheet: SheetKey): string {
  const bundle = state.details;
  if (!bundle) return loadingBody();

  const rows = bundle.races[race.round];
  if (!rows?.length) {
    return emptySheet(
      "This Grand Prix has not run yet. The classification appears here after the race.",
    );
  }

  if (sheet === "sprint") {
    const sprint = bundle.sprints[race.round];
    return sprint?.length
      ? raceSheet(sprint)
      : emptySheet("No sprint classification for this weekend.");
  }
  if (sheet === "qualifying") {
    return qualifyingSheet(bundle.qualifying[race.round] || []);
  }
  if (sheet === "grid") {
    return gridSheet(rows, bundle.qualifying[race.round]);
  }
  if (sheet === "fastest") {
    return fastestSheet(rows);
  }
  return raceSheet(rows);
}

/* ----------------------------------------------------------- driver profile */

function statCell(label: string, value: string, hint = ""): string {
  return (
    '<div class="stat">' +
      '<span class="stat__label">' + esc(label) + "</span>" +
      '<strong class="stat__value">' + esc(value) + "</strong>" +
      (hint ? '<span class="stat__hint">' + esc(hint) + "</span>" : "") +
    "</div>"
  );
}

function seasonResults(data: SeasonData, code: string): string {
  const bundle = state.details;
  if (!bundle) {
    return '<p class="profile__note">Race-by-race results load with the full classification.</p>';
  }

  const rows = Object.entries(bundle.races)
    .map(([key, sheet]) => {
      const round = Number(key);
      const row = sheet.find((item) => item.code === code);
      const race = data.races.find((item) => item.round === round);
      return row && race ? { row, race } : null;
    })
    .filter((item): item is { row: RaceResult; race: Race } => item !== null)
    .sort((a, b) => a.race.round - b.race.round);

  if (!rows.length) {
    return '<p class="profile__note">No race results for this driver yet.</p>';
  }

  return (
    '<ol class="seasonList">' +
      '<li class="seasonRow seasonRow--head" aria-hidden="true">' +
        "<span>Pos</span><span>Grand Prix</span><span>Date</span><span>Pts</span>" +
      "</li>" +
      rows.map(({ row, race }) => {
        const dnf = !/^(\+\d+ lap|finished)/i.test(row.status);
        return (
          '<li class="seasonRow">' +
            '<button class="seasonRow__btn" type="button" data-race-round="' + race.round + '">' +
              '<span class="seasonRow__pos' + (dnf ? " is-out" : row.pos <= 3 ? " is-p" + row.pos : "") + '">' +
                (dnf ? "DNF" : row.pos) + "</span>" +
              '<span class="seasonRow__gp">' + flagFor(race.country) +
                '<span>' + esc(shortRaceName(race.name)) + "</span></span>" +
              '<span class="seasonRow__date">' + esc(fmtDayMonth(raceStart(race))) + "</span>" +
              '<span class="seasonRow__pts">' + fmtPoints(row.points) + "</span>" +
            "</button>" +
          "</li>"
        );
      }).join("") +
    "</ol>"
  );
}

function renderDriverProfile(data: SeasonData, code: string): string {
  const driver = findDriver(data, code);
  const bundle = state.details;
  const fallbackRow = bundle
    ? Object.values(bundle.races).flat().find((row) => row.code === code)
    : undefined;

  const name = driver?.name || fallbackRow?.driver || code;
  const teamId = driver?.teamId || fallbackRow?.teamId || "";
  const team = teamNameFor(teamId, driver?.team || fallbackRow?.team);
  const number = driver?.number || "";
  const nationality = driver?.nationality || "";
  const pos = driver?.pos || 0;
  const points = driver ? driver.points : fallbackRow?.points || 0;
  const wins = driver?.wins || 0;
  const stats = bundle ? computeDriverStats(code, bundle) : null;
  const fav = getFavDriver() === code;
  const photo = driverPhoto(code);
  const heroFile = driverHeroFile(code);
  const { first, last } = nameParts(name);

  const heroPhoto = heroFile
    ? '<img class="profile__cutout" src="' + esc(heroFile) + '" alt="Portrait of ' + esc(name) +
      '" width="520" height="740" decoding="async">'
    : '<span class="profile__monogram" aria-hidden="true">' + esc(driverInitials(name)) + "</span>";

  const statGrid = stats
    ? '<div class="statGrid">' +
        statCell("Season position", pos ? ordinal(pos) : "—") +
        statCell("Season points", fmtPoints(points)) +
        statCell("Grand Prix races", String(stats.starts)) +
        statCell("Grand Prix points", fmtPoints(stats.points)) +
        statCell("Grand Prix wins", String(stats.wins)) +
        statCell("Grand Prix podiums", String(stats.podiums)) +
        statCell("Grand Prix poles", String(stats.poles)) +
        statCell("Grand Prix top 10s", String(stats.top10)) +
        statCell("Fastest laps", String(stats.fastestLaps)) +
        statCell("DNFs", String(stats.dnfs)) +
        statCell("Sprint races", String(stats.sprintStarts)) +
        statCell("Sprint points", fmtPoints(stats.sprintPoints)) +
        statCell("Sprint wins", String(stats.sprintWins)) +
        statCell("Sprint podiums", String(stats.sprintPodiums)) +
      "</div>"
    : '<div class="statGrid statGrid--loading">' +
        statCell("Season position", pos ? ordinal(pos) : "—") +
        statCell("Season points", fmtPoints(points)) +
        statCell("Grand Prix wins", String(wins)) +
        "</div>" +
        '<p class="profile__note">' +
          (state.detailsError
            ? "Full statistics are unavailable offline."
            : "Loading the rest of the season statistics…") +
        "</p>";

  const credit = photo
    ? '<p class="profile__credit">Portrait: <a href="' + esc(photo.page) +
      '" target="_blank" rel="noopener">' + esc(photo.credit) + "</a>" +
      ' · <a href="https://www.formula1.com/en/results/' + esc(data.season) +
      '/drivers" target="_blank" rel="noopener">Season results on Formula1.com</a></p>'
    : "";

  return (
    '<article class="profile" style="' + teamVars(teamId) + '">' +
      '<div class="profile__bar">' +
        '<button class="iconbtn" type="button" data-back aria-label="Back to results">' + ICON_BACK + "</button>" +
        '<span class="profile__crumb">Results / Driver</span>' +
        '<button class="iconbtn profile__star' + (fav ? " is-on" : "") + '" type="button" ' +
          'data-fav-driver="' + esc(code) + '" aria-pressed="' + fav + '" aria-label="' +
          (fav ? "Remove favourite driver" : "Set as favourite driver") + '">' + ICON_STAR + "</button>" +
      "</div>" +

      '<header class="profile__hero">' +
        (number ? '<span class="profile__number" aria-hidden="true">' + esc(number) + "</span>" : "") +
        '<div class="profile__intro">' +
          '<p class="profile__eyebrow">' +
            (pos ? "P" + pos + " · " : "") + fmtPoints(points) + " PTS" +
          "</p>" +
          (first ? '<p class="profile__first">' + esc(first) + "</p>" : "") +
          '<h3 class="profile__name" id="profile-name">' + esc(last) + "</h3>" +
          '<p class="profile__meta">' +
            (nationality ? '<span class="profile__flag">' + flagForNationality(nationality) + "</span>" : "") +
            (nationality ? "<span>" + esc(nationality) + "</span>" : "") +
            (nationality ? '<span class="profile__dot">·</span>' : "") +
            '<span>' + esc(team) + "</span>" +
            (number ? '<span class="profile__dot">·</span><span>#' + esc(number) + "</span>" : "") +
          "</p>" +
        "</div>" +
        '<div class="profile__figure">' + heroPhoto + "</div>" +
      "</header>" +

      '<section class="profile__section">' +
        '<div class="profile__sectionHead">' +
          "<h4>Statistics</h4><span>" + esc(data.season) + " season</span>" +
        "</div>" +
        statGrid +
      "</section>" +

      '<section class="profile__section">' +
        '<div class="profile__sectionHead"><h4>Season results</h4><span>Race by race</span></div>' +
        seasonResults(data, code) +
      "</section>" +

      credit +
    "</article>"
  );
}

/* ---------------------------------------------------------------- behaviour */

function setSub(sub: ResultsSub): void {
  state.resultsSub = sub;
  state.driverCode = null;
  try {
    history.replaceState(null, "", "#results/" + sub);
  } catch {
    /* file:// */
  }
  renderResults();
  const host = $("#view-results");
  host?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function openDriver(code: string): void {
  if (!code) return;
  state.driverCode = code;
  try {
    history.replaceState(null, "", "#results/drivers/" + code.toLowerCase());
  } catch {
    /* file:// */
  }
  renderResults();
  const back = $(".profile__bar [data-back]");
  if (back instanceof HTMLElement) back.focus({ preventScroll: true });
  const view = $("#view-results");
  view?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function closeDriver(): void {
  state.driverCode = null;
  try {
    history.replaceState(null, "", "#results/drivers");
  } catch {
    /* file:// */
  }
  renderResults();
  const grid = $("#driver-grid");
  grid?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function selectRound(round: number): void {
  state.resultsRound = round;
  const available = availableSheets(round);
  if (!available.includes(state.resultsSheet)) state.resultsSheet = "race";
  renderResults();
}

function setSheet(sheet: SheetKey): void {
  state.resultsSheet = sheet;
  renderResults();
}

function hashDriver(): string {
  const parts = (location.hash || "").replace(/^#/, "").split("/").filter(Boolean);
  return parts[0] === "results" && parts[1] === "drivers" ? (parts[2] || "").toUpperCase() : "";
}

function applyHashSub(): void {
  const raw = subFromHash();
  if (raw === "drivers" || raw === "teams" || raw === "races") {
    state.resultsSub = raw;
    state.driverCode = null;
  }
  const code = hashDriver();
  if (code) state.driverCode = code;
}

function filterList(input: HTMLInputElement): void {
  const value = normalise(input.value.trim());
  const scope = input.closest<HTMLElement>(".results__body, .picker__menu") || document;
  const items = $$<HTMLElement>("[data-search]", scope);
  let visible = 0;

  for (const item of items) {
    const match = !value || (item.dataset.search || "").includes(value);
    item.hidden = !match;
    if (match) visible += 1;
  }

  const clear = input.parentElement?.querySelector<HTMLElement>("[data-clear]");
  if (clear) clear.hidden = !input.value;

  const key = input.id === "race-search" ? "race-empty"
    : input.id === "driver-search" ? "driver-empty"
    : input.id === "team-search" ? "team-empty"
    : "";
  if (key) {
    const empty = document.getElementById(key);
    if (empty) empty.hidden = visible > 0;
  }
}

function closePicker(): void {
  const menu = $("#race-menu");
  const button = $("#race-picker-btn");
  if (!(menu instanceof HTMLElement) || !(button instanceof HTMLElement)) return;
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
}

function togglePicker(): void {
  const menu = $("#race-menu");
  const button = $("#race-picker-btn");
  if (!(menu instanceof HTMLElement) || !(button instanceof HTMLElement)) return;

  const open = menu.hidden;
  menu.hidden = !open;
  button.setAttribute("aria-expanded", String(open));

  if (open) {
    const search = $("#race-search");
    if (search instanceof HTMLInputElement) {
      search.value = "";
      filterList(search);
      search.focus();
    }
  }
}

export function initResults(): void {
  const body = $("#results-body");
  const subs = $("#results-sub");
  if (!body || !subs) return;

  subs.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("[data-sub]");
    const sub = button?.dataset.sub as ResultsSub | undefined;
    if (sub && SUBS.includes(sub)) setSub(sub);
  });

  body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const driver = target.closest<HTMLElement>("[data-driver]");
    if (driver?.dataset.driver) {
      openDriver(driver.dataset.driver);
      return;
    }

    const back = target.closest("[data-back]");
    if (back) {
      closeDriver();
      return;
    }

    const star = target.closest<HTMLElement>("[data-fav-driver]");
    if (star?.dataset.favDriver) {
      const code = star.dataset.favDriver;
      setFavDriver(getFavDriver() === code ? "" : code);
      renderResults();
      return;
    }

    const round = target.closest<HTMLElement>("[data-round]");
    if (round?.dataset.round) {
      closePicker();
      selectRound(Number(round.dataset.round));
      return;
    }

    const sheet = target.closest<HTMLElement>("[data-sheet]");
    if (sheet?.dataset.sheet) {
      setSheet(sheet.dataset.sheet as SheetKey);
      return;
    }

    const raceRow = target.closest<HTMLElement>("[data-race-round]");
    if (raceRow?.dataset.raceRound) {
      state.driverCode = null;
      state.resultsSub = "races";
      state.resultsSheet = "race";
      try {
        history.replaceState(null, "", "#results/races");
      } catch {
        /* file:// */
      }
      selectRound(Number(raceRow.dataset.raceRound));
      return;
    }

    if (target.closest("#race-picker-btn")) {
      togglePicker();
      return;
    }

    const clear = target.closest<HTMLElement>("[data-clear]");
    if (clear?.dataset.clear) {
      const input = document.getElementById(clear.dataset.clear);
      if (input instanceof HTMLInputElement) {
        input.value = "";
        filterList(input);
        input.focus();
      }
      return;
    }

    if (target.closest('[data-action="retry-results"]')) {
      document.dispatchEvent(new Event(WANT_RESULTS_EVENT));
      return;
    }

    // A click outside the open picker closes it.
    if (!target.closest(".picker")) closePicker();
  });

  body.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "search") filterList(target);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && !target.closest(".picker")) closePicker();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const menu = $("#race-menu");
      if (menu instanceof HTMLElement && !menu.hidden) {
        closePicker();
        $("#race-picker-btn")?.focus();
        return;
      }
      if (state.driverCode) closeDriver();
    }
  });

  document.addEventListener(RESULTS_EVENT, renderResults);
  document.addEventListener(DATA_EVENT, renderResults);
  document.addEventListener(VIEW_EVENT, (event) => {
    if ((event as CustomEvent<string>).detail !== "results") return;
    applyHashSub();
    renderResults();
  });
  onFavouritesChange(() => {
    renderResults();
  });
}
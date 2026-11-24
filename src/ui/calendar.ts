import { nextRace, nextSessionTime, state } from "../app/state";
import { flagFor } from "../data/flags";
import { teamColors, teamNameFor } from "../data/teams";
import { $, $$, esc } from "../lib/dom";
import {
  dayMonthFmt,
  fmtSessionTime,
  pad2,
  raceDateRange,
  sessionLength,
  sessionsOf,
  weekdayFmt,
} from "../lib/format";
import type { Race, RaceSession } from "../types";

/** Rounds whose card was already opened automatically on first sight. */
const autoOpened = new Set<number>();

export function renderSchedule(): void {
  const host = $("#calendar");
  if (!host || !state.data) return;

  const races = state.data.races.slice().sort((a, b) => a.round - b.round);
  const next = nextRace();
  const upcoming = races.filter((race) => !race.winner);
  const completed = races.filter((race) => race.winner);

  // The next race opens once, so its weekend schedule is visible right away;
  // closing it afterwards is remembered for the rest of the session.
  if (next && !autoOpened.has(next.round)) {
    autoOpened.add(next.round);
    state.open.add(next.round);
  }

  host.innerHTML =
    raceGroup("calendar-upcoming", "Upcoming races", upcoming) +
    raceGroup("calendar-completed", "Completed races", completed);

  markNextSession(true);
}

function raceGroup(id: string, title: string, races: Race[]): string {
  if (!races.length) return "";
  return '<section class="race-group" aria-labelledby="' + id + '">' +
    '<h3 class="race-group__title" id="' + id + '">' + title +
      ' <span class="race-group__count">' + races.length + "</span>" +
    "</h3>" +
    '<div class="race-list">' + races.map(raceCard).join("") + "</div>" +
  "</section>";
}

function raceCard(race: Race, index: number): string {
  const open = state.open.has(race.round);
  const panelId = "race-panel-" + race.round;
  const btnId = "race-btn-" + race.round;
  const sessions = sessionsOf(race);

  return '<article class="racecard' + (open ? " is-open" : "") + '" data-round="' + race.round + '" style="--i:' + Math.min(index, 6) + '">' +
    '<h4 class="racecard__heading">' +
      '<button class="racecard__btn" type="button" id="' + btnId + '" aria-expanded="' + open + '" aria-controls="' + panelId + '">' +
        '<span class="racecard__round"><span class="sr-only">Round </span>' + pad2(race.round) + "</span>" +
        flagFor(race.country) +
        '<span class="racecard__body">' +
          '<span class="racecard__title">' +
            '<span class="racecard__name">' + esc(race.name) + "</span>" +
            (race.sprint ? '<span class="tag tag--sprint">Sprint</span>' : "") +
          "</span>" +
          '<span class="racecard__meta">' + esc(raceDateRange(race)) + " · " +
            sessions.length + (sessions.length === 1 ? " session" : " sessions") + "</span>" +
        "</span>" +
        '<span class="racecard__chev" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>' +
        "</span>" +
      "</button>" +
    "</h4>" +
    '<div class="racecard__panel" id="' + panelId + '" role="region" aria-labelledby="' + btnId + '"' +
      (open ? "" : ' aria-hidden="true"') + ">" +
      '<div class="racecard__panel-inner">' +
        '<div class="racecard__panel-head"><span>Weekend schedule</span></div>' +
        '<ol class="session-list">' + sessions.map(sessionRow).join("") + "</ol>" +
        raceResult(race, sessions.length) +
      "</div>" +
    "</div>" +
  "</article>";
}

function sessionRow(session: RaceSession, index: number): string {
  const start = new Date(session.start);
  return '<li class="session" data-start="' + esc(start.toISOString()) + '" style="--i:' + index + '">' +
    '<span class="session__when">' +
      '<span class="session__dow">' + esc(weekdayFmt.format(start)) + "</span>" +
      '<span class="session__date">' + esc(dayMonthFmt.format(start)) + "</span>" +
    "</span>" +
    '<span class="session__name">' + esc(session.name) +
      '<span class="session__badge" data-next-session hidden>Next</span>' +
    "</span>" +
    '<span class="session__len">' + esc(sessionLength(session.minutes)) + "</span>" +
    '<span class="session__time">' + esc(fmtSessionTime(start)) + "</span>" +
  "</li>";
}

function raceResult(race: Race, index: number): string {
  if (!race.winner) {
    return '<p class="racecard__pending" style="--i:' + index + '">Not raced yet</p>';
  }
  const colors = teamColors(race.winner.teamId);
  return '<p class="racecard__winner" style="--team-dark:' + colors.dark +
    ";--team-light:" + colors.light + ";--i:" + index + '">' +
    '<span class="racecard__winner-label">Winner:</span>' +
    "<strong>" + esc(race.winner.driver) + "</strong>" +
    '<span class="racecard__winner-team">(' + esc(teamNameFor(race.winner.teamId, race.winner.team)) + ")</span>" +
    '<span class="racecard__winner-result">· ' + esc(race.winner.result) + "</span>" +
  "</p>";
}

export function toggleRace(button: HTMLElement): void {
  const card = button.closest<HTMLElement>(".racecard");
  if (!card) return;

  const round = Number(card.dataset.round);
  const open = !card.classList.contains("is-open");
  card.classList.toggle("is-open", open);
  button.setAttribute("aria-expanded", String(open));

  const panelId = button.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  if (panel) panel.setAttribute("aria-hidden", String(!open));

  if (open) state.open.add(round);
  else state.open.delete(round);
}

/** Delegated open/close handling for the whole calendar. */
export function initCalendar(): void {
  const host = $("#calendar");
  if (!host) return;

  host.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>(".racecard__btn");
    if (button) toggleRace(button);
  });
}

export function markNextSession(force: boolean): void {
  const next = nextSessionTime();
  if (!force && next === state.nextSession) return;
  state.nextSession = next;

  for (const row of $$(".session")) {
    const isNext = next !== null && Date.parse(row.dataset.start ?? "") === next;
    row.classList.toggle("is-next", isNext);
    const badge = $("[data-next-session]", row);
    if (badge) badge.hidden = !isNext;
  }
}
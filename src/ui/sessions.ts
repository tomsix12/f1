import { esc } from "../lib/dom";
import {
  fmtDayMonth,
  fmtSessionTime,
  fmtWeekday,
  sessionLength,
  sessionsOf,
} from "../lib/format";
import type { Race, RaceSession } from "../types";

function sessionRow(session: RaceSession, index: number): string {
  const start = new Date(session.start);
  return '<li class="session" data-start="' + esc(start.toISOString()) + '" style="--i:' + index + '">' +
    '<span class="session__when">' +
      '<span class="session__dow">' + esc(fmtWeekday(start)) + "</span>" +
      '<span class="session__date">' + esc(fmtDayMonth(start)) + "</span>" +
    "</span>" +
    '<span class="session__name">' +
      '<span class="session__label">' + esc(session.name) + "</span>" +
      '<span class="session__badge" data-next-session hidden>Next</span>' +
    "</span>" +
    '<span class="session__len">' + esc(sessionLength(session.minutes)) + "</span>" +
    '<span class="session__time">' + esc(fmtSessionTime(start)) + "</span>" +
  "</li>";
}

/** Session list shared by the calendar cards and the next-race banner. */
export function sessionList(race: Race): string {
  return '<ol class="session-list">' + sessionsOf(race).map(sessionRow).join("") + "</ol>";
}
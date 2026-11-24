import { TZ } from "../config";
import type { Race, RaceSession } from "../types";
import { esc } from "./dom";

const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const dayMonthFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" });
const dayYearFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const stampFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const zoneFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, timeZoneName: "short" });

export function zoneShort(date: Date): string {
  const part = zoneFmt.formatToParts(date).find((item) => item.type === "timeZoneName");
  return part ? part.value : "CET";
}

export function raceStart(race: Race): Date {
  if (race.start) return new Date(race.start);
  return new Date(race.date + "T" + (race.time || "12:00:00Z"));
}

export function fmtSessionTime(date: Date): string {
  return timeFmt.format(date);
}

export function fmtRaceWhen(race: Race): string {
  const date = raceStart(race);
  return dayFmt.format(date) + " " + timeFmt.format(date) + " " + zoneShort(date);
}

export function fmtFullStamp(timestamp: number): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return dayYearFmt.format(date) + ", " + timeFmt.format(date) + " " + zoneShort(date);
}

export function fmtShortStamp(timestamp: number): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return stampFmt.format(date) + " " + zoneShort(date);
}

export function relTime(timestamp: number): string {
  if (!timestamp) return "—";
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + " h ago";
  return fmtShortStamp(timestamp);
}

interface DayMonth {
  day: string;
  month: string;
}

function dmParts(date: Date): DayMonth {
  const parts = dayMonthFmt.formatToParts(date);
  const day = parts.find((part) => part.type === "day");
  const month = parts.find((part) => part.type === "month");
  return { day: day ? day.value : "", month: month ? month.value : "" };
}

export function sessionsOf(race: Race): RaceSession[] {
  if (Array.isArray(race.sessions) && race.sessions.length) return race.sessions;
  return [{ name: "Race", type: "race", start: raceStart(race).toISOString(), minutes: 120 }];
}

export function sessionLength(minutes: number): string {
  const value = Number(minutes) || 0;
  return value >= 120 ? "≈ 2 h" : value + " min";
}

export function raceDateRange(race: Race): string {
  const list = sessionsOf(race)
    .map((session) => new Date(session.start))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (!list.length) list.push(raceStart(race));

  let from = list[0];
  let to = list[0];
  for (const date of list) {
    if (date < from) from = date;
    if (date > to) to = date;
  }

  const a = dmParts(from);
  const b = dmParts(to);
  if (a.month === b.month) {
    return (a.day === b.day ? a.day : a.day + "–" + b.day) + " " + b.month;
  }
  return a.day + " " + a.month + " – " + b.day + " " + b.month;
}

export interface CountdownParts {
  d: number;
  h: number;
  m: number;
  s: number;
}

export function cdParts(ms: number): CountdownParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function fmtPoints(points: number | string): string {
  const value = Number(points);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function winsText(wins: number | string): string {
  const value = Number(wins) || 0;
  return value === 1 ? "1 win" : value + " wins";
}

export function gpTitle(name: string): string {
  const index = String(name).lastIndexOf("Grand Prix");
  if (index === -1) return esc(name);
  const prefix = String(name).slice(0, index).trim();
  return (prefix ? esc(prefix) + " " : "") + "<em>Grand Prix</em>";
}

export { weekdayFmt, dayMonthFmt };
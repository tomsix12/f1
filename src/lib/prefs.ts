import type { FontChoice } from "../types";
import { readStored, writeStored } from "./storage";

/** Browser-local preferences that are not part of the theme tokens. */
export const PREFS_EVENT = "f1:prefs";
export const FAVOURITES_EVENT = "f1:favourites";

const MOTION_KEY = "f1.motion";
const BLUR_SCALE_KEY = "f1.blur.scale";
const FONT_KEY = "f1.font";
const TIMEZONE_KEY = "f1.timezone";
const FAV_DRIVER_KEY = "f1.fav.driver";
const FAV_TEAM_KEY = "f1.fav.team";

function notify(detail: string): void {
  document.dispatchEvent(new CustomEvent(PREFS_EVENT, { detail }));
}

/** Touch devices default to a clean scroll: filtered layers can be left
    partially unpainted during a fast flick. The switch still works there, so
    this only decides what happens before the user chooses. */
function prefersBlurByDefault(): boolean {
  return !window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function getMotionBlur(): boolean {
  const stored = readStored(MOTION_KEY);
  if (stored === "on") return true;
  if (stored === "off") return false;
  return prefersBlurByDefault();
}

export function setMotionBlur(on: boolean): void {
  writeStored(MOTION_KEY, on ? "on" : "off");
  notify("motion");
}

/** Blur strength multiplier, mirroring the 0.5–2.5 range in Essentials. */
export function getBlurScale(): number {
  const raw = Number(readStored(BLUR_SCALE_KEY));
  if (!Number.isFinite(raw) || raw < 0.5 || raw > 2.5) return 1;
  return Math.round(raw * 10) / 10;
}

export function setBlurScale(value: number): void {
  const clamped = Math.min(2.5, Math.max(0.5, Math.round(value * 10) / 10));
  writeStored(BLUR_SCALE_KEY, String(clamped));
  notify("motion");
}

export function isFontChoice(value: unknown): value is FontChoice {
  return value === "sans" || value === "serif" || value === "mono";
}

export function getFont(): FontChoice {
  const saved = readStored(FONT_KEY);
  return isFontChoice(saved) ? saved : "sans";
}

/* ---------------------------------------------------------------- time zone */

/** True when the browser accepts the identifier as an IANA time zone. */
export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Stored override, or "" when the browser's own zone should be used. */
export function getTimeZone(): string {
  const saved = readStored(TIMEZONE_KEY) || "";
  return saved && isTimeZone(saved) ? saved : "";
}

/** The zone actually used for formatting: the override or the system zone. */
export function resolvedTimeZone(): string {
  const override = getTimeZone();
  if (override) return override;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Passing "" restores the automatic system time zone. */
export function setTimeZone(zone: string): void {
  if (zone && !isTimeZone(zone)) return;
  if (zone === getTimeZone()) return;
  writeStored(TIMEZONE_KEY, zone);
  notify("timezone");
}

/** Switches the type stacks through data-font on <html> (see tokens.css). */
export function applyFont(font: FontChoice = getFont()): void {
  document.documentElement.dataset.font = font;
}

export function setFont(font: FontChoice): void {
  writeStored(FONT_KEY, font);
  applyFont(font);
  notify("font");
}

export function getFavDriver(): string {
  return readStored(FAV_DRIVER_KEY) || "";
}

export function setFavDriver(value: string): void {
  if (value === getFavDriver()) return;
  writeStored(FAV_DRIVER_KEY, value);
  document.dispatchEvent(new Event(FAVOURITES_EVENT));
}

export function getFavTeam(): string {
  return readStored(FAV_TEAM_KEY) || "";
}

export function setFavTeam(value: string): void {
  if (value === getFavTeam()) return;
  writeStored(FAV_TEAM_KEY, value);
  document.dispatchEvent(new Event(FAVOURITES_EVENT));
}

export function onFavouritesChange(listener: () => void): () => void {
  document.addEventListener(FAVOURITES_EVENT, listener);
  return () => document.removeEventListener(FAVOURITES_EVENT, listener);
}
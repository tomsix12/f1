import { ACCENT_KEY, MODE_KEY } from "../config";
import type { AccentKey, ThemeMode } from "../types";
import {
  ACCENTS,
  DEFAULT_ACCENT,
  NEUTRALS,
  isAccentKey,
  isThemeMode,
} from "../theme/palette";
import { readStored, writeStored } from "./storage";

type ThemeListener = () => void;

const root = document.documentElement;
const listeners = new Set<ThemeListener>();
const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

/** First visit starts in the dark design; the choice is remembered afterwards. */
let mode: ThemeMode = "dark";
let accent: AccentKey = DEFAULT_ACCENT;
let themeTimer = 0;

/** "system" follows the OS; the data-theme attribute only ever gets light/dark. */
function resolveMode(nextMode: ThemeMode): "dark" | "light" {
  if (nextMode !== "system") return nextMode;
  return systemQuery.matches ? "dark" : "light";
}

function storedMode(): ThemeMode {
  const saved = readStored(MODE_KEY);
  return isThemeMode(saved) ? saved : "dark";
}

function storedAccent(): AccentKey {
  const saved = readStored(ACCENT_KEY);
  return isAccentKey(saved) ? saved : DEFAULT_ACCENT;
}

/** Writes the data-attributes that drive every token in tokens.css. */
export function applyTheme(nextAccent: AccentKey, nextMode: ThemeMode): void {
  const resolved = resolveMode(nextMode);
  root.dataset.accent = nextAccent;
  root.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", NEUTRALS[resolved].bg);
}

export function initTheme(): void {
  mode = storedMode();
  accent = storedAccent();
  applyTheme(accent, mode);
  systemQuery.addEventListener("change", () => {
    if (mode === "system") commitTheme(accent, mode);
  });
}

export function getMode(): ThemeMode {
  return mode;
}

export function getResolvedMode(): "dark" | "light" {
  return resolveMode(mode);
}

export function getAccent(): AccentKey {
  return accent;
}

export function getAccentLabel(key: AccentKey): string {
  return ACCENTS[key].label;
}

export function onThemeChange(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * Applies and persists a theme change. The temporary `theming` class makes
 * every colour transition at once, then is removed so it cannot slow down the
 * regular hover and open/close animations.
 */
export function commitTheme(nextAccent: AccentKey, nextMode: ThemeMode): void {
  root.classList.add("theming");
  accent = nextAccent;
  mode = nextMode;
  applyTheme(accent, mode);
  writeStored(ACCENT_KEY, accent);
  writeStored(MODE_KEY, mode);
  notify();
  window.clearTimeout(themeTimer);
  // CSS fades colours for --theme-duration (900 ms); keep the class a little
  // longer so the last frame is not cut off.
  themeTimer = window.setTimeout(() => root.classList.remove("theming"), 1020);
}

export function setMode(nextMode: ThemeMode): void {
  commitTheme(accent, nextMode);
}

export function setAccent(nextAccent: AccentKey): void {
  commitTheme(nextAccent, mode);
}
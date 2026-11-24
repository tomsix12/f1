import { state } from "../app/state";
import { DATA_EVENT } from "../app/render";
import { teamNameFor } from "../data/teams";
import { $, $$, esc } from "../lib/dom";
import {
  PREFS_EVENT,
  applyFont,
  getFavDriver,
  getFavTeam,
  getFont,
  getMotionBlur,
  isFontChoice,
  onFavouritesChange,
  setFavDriver,
  setFavTeam,
  setFont,
  setMotionBlur,
} from "../lib/prefs";
import {
  getAccent,
  getMode,
  getResolvedMode,
  onThemeChange,
  setAccent,
  setMode,
  toggleMode,
} from "../lib/theme";
import { ACCENTS, ACCENT_ORDER, isAccentKey } from "../theme/palette";
import type { ThemeMode } from "../types";
import { renderDrivers, renderTeams } from "./standings";

let panel: HTMLElement | null = null;
let settingsBtn: HTMLElement | null = null;
let accentGrid: HTMLElement | null = null;
let themeSeg: HTMLElement | null = null;
let fontSeg: HTMLElement | null = null;
let motionSwitch: HTMLElement | null = null;
let driverSelect: HTMLSelectElement | null = null;
let teamSelect: HTMLSelectElement | null = null;

function buildAccentGrid(): void {
  if (!accentGrid) return;
  const paletteMode = getResolvedMode();

  accentGrid.innerHTML = ACCENT_ORDER.map((key) => {
    const swatch = ACCENTS[key];
    const palette = swatch[paletteMode];
    return '<button class="accent" type="button" data-accent="' + key + '" aria-pressed="false"' +
      ' aria-label="' + esc(swatch.label) + ' accent" title="' + esc(swatch.label) + ' accent"' +
      ' style="--sw:' + palette.primary + ";--sw-on:" + palette["on-primary"] + '">' +
      '<span class="accent__dot" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
      "</span>" +
    "</button>";
  }).join("");
}

/** Fills the favourite selects from the current standings. */
function fillFavourites(): void {
  const drivers = state.data?.drivers || [];
  const teams = state.data?.teams || [];

  if (driverSelect) {
    const saved = getFavDriver();
    driverSelect.innerHTML = '<option value="">No favourite driver</option>' +
      drivers.map((driver) =>
        '<option value="' + esc(driver.code) + '">' + esc(driver.name) + " (" + esc(driver.code) + ")</option>",
      ).join("");
    driverSelect.value = saved;
    if (driverSelect.value !== saved) driverSelect.value = "";
  }

  if (teamSelect) {
    const saved = getFavTeam();
    teamSelect.innerHTML = '<option value="">No favourite team</option>' +
      teams.map((team) =>
        '<option value="' + esc(team.id) + '">' + esc(teamNameFor(team.id, team.name)) + "</option>",
      ).join("");
    teamSelect.value = saved;
    if (teamSelect.value !== saved) teamSelect.value = "";
  }
}

/** Keeps the switches, pills and swatches in sync with stored preferences. */
function syncThemeUI(): void {
  const mode = getMode();
  const resolved = getResolvedMode();
  const accent = getAccent();

  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    const dark = resolved === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.setAttribute("aria-label", dark ? "Dark theme — switch to light" : "Light theme — switch to dark");
    themeToggle.title = dark ? "Switch to light theme" : "Switch to dark theme";
  }

  if (themeSeg) {
    for (const item of $$<HTMLButtonElement>(".segmented__item", themeSeg)) {
      item.setAttribute("aria-pressed", String(item.dataset.mode === mode));
    }
  }

  if (!accentGrid) return;
  for (const button of $$(".accent", accentGrid)) {
    const key = button.dataset.accent;
    if (!key || !isAccentKey(key)) continue;
    const palette = ACCENTS[key][resolved];
    button.style.setProperty("--sw", palette.primary);
    button.style.setProperty("--sw-on", palette["on-primary"]);
    button.setAttribute("aria-pressed", String(key === accent));
  }
}

function syncFontUI(): void {
  if (!fontSeg) return;
  const font = getFont();
  for (const item of $$<HTMLButtonElement>(".segmented__item", fontSeg)) {
    item.setAttribute("aria-pressed", String(item.dataset.font === font));
  }
}

function syncMotionUI(): void {
  motionSwitch?.setAttribute("aria-checked", String(getMotionBlur()));
}

function placeSettings(): void {
  if (!panel || !settingsBtn || panel.hidden) return;

  const panelWidth = Math.min(372, window.innerWidth - 24);
  const rect = settingsBtn.getBoundingClientRect();
  const left = Math.max(12, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 12));
  panel.style.width = panelWidth + "px";
  panel.style.left = left + "px";
  panel.style.right = "auto";

  // On phones the header wraps into two rows, so sit below the whole bar
  // rather than below the gear alone.
  const header = document.querySelector<HTMLElement>(".topbar");
  const headerBottom = header ? header.getBoundingClientRect().bottom : rect.bottom;
  const top = Math.max(8, Math.max(rect.bottom + 12, headerBottom + 8));
  panel.style.top = top + "px";
  panel.style.maxHeight = Math.max(240, window.innerHeight - top - 12) + "px";
}

function openSettings(): void {
  if (!panel || !settingsBtn) return;
  fillFavourites();
  panel.hidden = false;
  settingsBtn.setAttribute("aria-expanded", "true");
  placeSettings();
  const active = $('.segmented__item[aria-pressed="true"]', themeSeg || panel) || $(".settings__close", panel);
  if (active) active.focus({ preventScroll: true });
}

function closeSettings(returnFocus: boolean): void {
  if (!panel || !settingsBtn || panel.hidden) return;
  panel.hidden = true;
  settingsBtn.setAttribute("aria-expanded", "false");
  if (returnFocus) settingsBtn.focus({ preventScroll: true });
}

export function initSettings(): void {
  panel = $("#settings");
  settingsBtn = $("#settings-btn");
  accentGrid = $("#accent-grid");
  themeSeg = $("#theme-seg");
  fontSeg = $("#font-seg");
  motionSwitch = $("#motion-switch");
  driverSelect = $("#fav-driver") as HTMLSelectElement | null;
  teamSelect = $("#fav-team") as HTMLSelectElement | null;

  applyFont();
  buildAccentGrid();
  syncThemeUI();
  syncFontUI();
  syncMotionUI();
  onThemeChange(syncThemeUI);

  $("#theme-toggle")?.addEventListener("click", toggleMode);

  settingsBtn?.addEventListener("click", () => {
    if (!panel) return;
    if (panel.hidden) openSettings();
    else closeSettings(true);
  });

  $("#settings-close")?.addEventListener("click", () => closeSettings(true));

  themeSeg?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(".segmented__item");
    const mode = item?.dataset.mode;
    if (mode === "system" || mode === "light" || mode === "dark") setMode(mode as ThemeMode);
  });

  fontSeg?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>(".segmented__item");
    if (isFontChoice(item?.dataset.font)) setFont(item.dataset.font);
  });

  motionSwitch?.addEventListener("click", () => setMotionBlur(!getMotionBlur()));

  panel?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const accentButton = target.closest<HTMLElement>(".accent");
    if (accentButton && isAccentKey(accentButton.dataset.accent)) {
      setAccent(accentButton.dataset.accent);
    }
  });

  const driverEl = driverSelect;
  const teamEl = teamSelect;
  driverEl?.addEventListener("change", () => setFavDriver(driverEl.value));
  teamEl?.addEventListener("change", () => setFavTeam(teamEl.value));

  onFavouritesChange(() => {
    fillFavourites();
    renderTeams();
    renderDrivers();
  });

  document.addEventListener(DATA_EVENT, fillFavourites);

  document.addEventListener(PREFS_EVENT, (event) => {
    const detail = (event as CustomEvent<string>).detail;
    if (detail === "font") syncFontUI();
    if (detail === "motion") syncMotionUI();
  });

  panel?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSettings(true);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!panel || panel.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || (settingsBtn && settingsBtn.contains(target))) return;
    closeSettings(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSettings(true);
  });

  window.addEventListener("resize", placeSettings);
}
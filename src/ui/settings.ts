import { state } from "../app/state";
import { DATA_EVENT } from "../app/render";
import { teamNameFor } from "../data/teams";
import { offsetInZone, searchTimeZones, timeInZone, zoneLabel, type ZoneOption } from "../data/timezones";
import { $, $$, esc } from "../lib/dom";
import {
  PREFS_EVENT,
  applyFont,
  getBlurScale,
  getFavDriver,
  getFavTeam,
  getFont,
  getMotionBlur,
  getTimeZone,
  isFontChoice,
  onFavouritesChange,
  resolvedTimeZone,
  setBlurScale,
  setFavDriver,
  setFavTeam,
  setFont,
  setMotionBlur,
  setTimeZone,
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
let motionAmountRow: HTMLElement | null = null;
let motionAmount: HTMLInputElement | null = null;
let motionAmountValue: HTMLElement | null = null;
let driverSelect: HTMLSelectElement | null = null;
let teamSelect: HTMLSelectElement | null = null;
let tzSearch: HTMLInputElement | null = null;
let tzResults: HTMLElement | null = null;
let tzCurrent: HTMLElement | null = null;
let tzCurrentSub: HTMLElement | null = null;
let tzReset: HTMLElement | null = null;
let tzHint: HTMLElement | null = null;

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
  const on = getMotionBlur();
  const amount = getBlurScale();
  motionSwitch?.setAttribute("aria-checked", String(on));
  if (motionAmountRow) motionAmountRow.hidden = !on;
  if (motionAmount) {
    motionAmount.value = String(amount);
    motionAmount.style.setProperty("--fill", (((amount - 0.5) / 2) * 100).toFixed(1) + "%");
  }
  if (motionAmountValue) motionAmountValue.textContent = amount.toFixed(1) + "×";
}

/* ---------------------------------------------------------------- time zone */

function timeZoneRow(option: ZoneOption, now: Date): string {
  const active = option.zone === resolvedTimeZone();
  return '<li><button class="tz__option" type="button" data-zone="' + esc(option.zone) + '"' +
    (active ? ' aria-current="true"' : "") + ">" +
    '<span class="tz__city">' + esc(option.city) + "</span>" +
    '<span class="tz__meta">' + esc(option.country) + " · " + esc(zoneLabel(option.zone)) + "</span>" +
    '<span class="tz__time">' + esc(timeInZone(option.zone, now)) +
      "<span>" + esc(offsetInZone(option.zone, now)) + "</span></span>" +
    "</button></li>";
}

function renderTimeZoneResults(): void {
  if (!tzResults) return;
  const query = tzSearch ? tzSearch.value.trim() : "";
  const results = query ? searchTimeZones(query, 8) : [];
  const now = new Date();

  tzResults.innerHTML = results.map((option) => timeZoneRow(option, now)).join("");
  tzResults.hidden = !results.length;
  if (tzHint) {
    tzHint.textContent = query && !results.length
      ? "No capital matches “" + query + "”."
      : "Every race time follows this zone.";
  }
}

/** Keeps the picked zone and its wall clock in sync with the stored value. */
function syncTimeZoneUI(): void {
  const custom = getTimeZone();
  const zone = resolvedTimeZone();
  if (tzCurrent) tzCurrent.textContent = (custom ? "" : "System · ") + zoneLabel(zone);
  if (tzCurrentSub) tzCurrentSub.textContent = "Now " + timeInZone(zone) + " · " + offsetInZone(zone);
  if (tzReset) tzReset.hidden = !custom;
  renderTimeZoneResults();
}

/** Focuses the result above/below the current one (or back into the search). */
function moveTimeZoneFocus(from: Element, direction: 1 | -1): void {
  if (!tzResults) return;
  const buttons = $$<HTMLButtonElement>(".tz__option", tzResults);
  const index = buttons.indexOf(from as HTMLButtonElement);
  if (index === -1) return;
  const next = buttons[index + direction];
  if (next) next.focus();
  else tzSearch?.focus();
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
  if (tzSearch) tzSearch.value = "";
  syncTimeZoneUI();
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
  motionAmountRow = $("#motion-amount-row");
  motionAmount = $("#motion-amount") as HTMLInputElement | null;
  motionAmountValue = $("#motion-amount-value");
  driverSelect = $("#fav-driver") as HTMLSelectElement | null;
  teamSelect = $("#fav-team") as HTMLSelectElement | null;
  tzSearch = $("#tz-search") as HTMLInputElement | null;
  tzResults = $("#tz-results");
  tzCurrent = $("#tz-current");
  tzCurrentSub = $("#tz-current-sub");
  tzReset = $("#tz-reset");
  tzHint = $("#tz-hint");

  applyFont();
  buildAccentGrid();
  syncThemeUI();
  syncFontUI();
  syncMotionUI();
  syncTimeZoneUI();
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

  const amountEl = motionAmount;
  motionSwitch?.addEventListener("click", () => setMotionBlur(!getMotionBlur()));
  amountEl?.addEventListener("input", () => setBlurScale(Number(amountEl.value)));

  /* --- Time zone search ------------------------------------------------- */
  const searchEl = tzSearch;
  searchEl?.addEventListener("input", renderTimeZoneResults);
  searchEl?.addEventListener("focus", renderTimeZoneResults);
  searchEl?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (searchEl.value) {
        searchEl.value = "";
        renderTimeZoneResults();
      } else {
        searchEl.blur();
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const buttons = tzResults ? $$<HTMLButtonElement>(".tz__option", tzResults) : [];
      if (!buttons.length) return;
      event.preventDefault();
      (event.key === "ArrowDown" ? buttons[0] : buttons[buttons.length - 1]).focus();
      return;
    }
    if (event.key === "Enter") {
      const first = tzResults?.querySelector<HTMLButtonElement>(".tz__option");
      if (!first) return;
      event.preventDefault();
      first.click();
    }
  });

  tzResults?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>(".tz__option");
    const zone = button?.dataset.zone;
    if (!zone) return;
    setTimeZone(zone);
    if (tzSearch) tzSearch.value = "";
    renderTimeZoneResults();
    tzSearch?.focus({ preventScroll: true });
  });

  tzResults?.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest(".tz__option");
    if (!button) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      if (tzSearch) {
        tzSearch.value = "";
        renderTimeZoneResults();
        tzSearch.focus({ preventScroll: true });
      }
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    moveTimeZoneFocus(button, event.key === "ArrowDown" ? 1 : -1);
  });

  tzReset?.addEventListener("click", () => {
    setTimeZone("");
    if (tzSearch) tzSearch.value = "";
    renderTimeZoneResults();
    tzSearch?.focus({ preventScroll: true });
  });

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
    if (detail === "timezone") syncTimeZoneUI();
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
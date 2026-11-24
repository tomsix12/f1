import { $, $$, esc } from "../lib/dom";
import {
  getAccent,
  getMode,
  onThemeChange,
  setAccent,
  setMode,
  toggleMode,
} from "../lib/theme";
import { ACCENTS, ACCENT_ORDER, isAccentKey } from "../theme/palette";

let panel: HTMLElement | null = null;
let paletteBtn: HTMLElement | null = null;
let accentGrid: HTMLElement | null = null;

function buildAccentGrid(): void {
  if (!accentGrid) return;
  const mode = getMode();

  accentGrid.innerHTML = ACCENT_ORDER.map((key) => {
    const swatch = ACCENTS[key];
    const palette = swatch[mode];
    return '<button class="accent" type="button" data-accent="' + key + '" aria-pressed="false"' +
      ' aria-label="' + esc(swatch.label) + ' accent" title="' + esc(swatch.label) + ' accent"' +
      ' style="--sw:' + palette.primary + ";--sw-on:" + palette["on-primary"] + '">' +
      '<span class="accent__dot" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
      "</span>" +
    "</button>";
  }).join("");
}

/** Keeps the header toggle, mode segments and swatches in sync with the theme. */
function syncThemeUI(): void {
  const mode = getMode();
  const accent = getAccent();

  for (const button of $$(".mode button")) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }

  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    const dark = mode === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.setAttribute("aria-label", dark ? "Dark theme — switch to light" : "Light theme — switch to dark");
    themeToggle.title = dark ? "Switch to light theme" : "Switch to dark theme";
  }

  if (!accentGrid) return;
  for (const button of $$(".accent", accentGrid)) {
    const key = button.dataset.accent;
    if (!key || !isAccentKey(key)) continue;
    const palette = ACCENTS[key][mode];
    button.style.setProperty("--sw", palette.primary);
    button.style.setProperty("--sw-on", palette["on-primary"]);
    button.setAttribute("aria-pressed", String(key === accent));
  }
}

function placePalette(): void {
  if (!panel || !paletteBtn || panel.hidden) return;

  const panelWidth = Math.min(330, window.innerWidth - 24);
  const rect = paletteBtn.getBoundingClientRect();
  const left = Math.max(12, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 12));
  panel.style.width = panelWidth + "px";
  panel.style.left = left + "px";
  panel.style.right = "auto";

  const panelHeight = panel.offsetHeight || 0;
  const top = Math.min(rect.bottom + 10, window.innerHeight - panelHeight - 12);
  panel.style.top = Math.max(8, top) + "px";
}

function openPalette(): void {
  if (!panel || !paletteBtn) return;
  panel.hidden = false;
  paletteBtn.setAttribute("aria-expanded", "true");
  placePalette();
  const active = $('.mode button[aria-pressed="true"]', panel) || $(".mode button", panel);
  if (active) active.focus({ preventScroll: true });
}

function closePalette(returnFocus: boolean): void {
  if (!panel || !paletteBtn || panel.hidden) return;
  panel.hidden = true;
  paletteBtn.setAttribute("aria-expanded", "false");
  if (returnFocus) paletteBtn.focus({ preventScroll: true });
}

export function initAppearance(): void {
  panel = $("#palette");
  paletteBtn = $("#palette-btn");
  accentGrid = $("#accent-grid");

  buildAccentGrid();
  syncThemeUI();
  onThemeChange(syncThemeUI);

  $("#theme-toggle")?.addEventListener("click", toggleMode);

  paletteBtn?.addEventListener("click", () => {
    if (!panel) return;
    if (panel.hidden) openPalette();
    else closePalette(true);
  });

  panel?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const accentButton = target.closest<HTMLElement>(".accent");
    if (accentButton && isAccentKey(accentButton.dataset.accent)) {
      setAccent(accentButton.dataset.accent);
      return;
    }

    const modeButton = target.closest<HTMLElement>(".mode button");
    const mode = modeButton?.dataset.mode;
    if (mode === "light" || mode === "dark") setMode(mode);
  });

  panel?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette(true);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!panel || panel.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || (paletteBtn && paletteBtn.contains(target))) return;
    closePalette(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePalette(true);
  });

  window.addEventListener("resize", placePalette);
}
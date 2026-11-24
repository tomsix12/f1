import { $ } from "../lib/dom";
import { renderSchedule } from "../ui/calendar";
import { renderFooter } from "../ui/footer";
import { renderHero } from "../ui/hero";
import { renderDrivers, renderTeams } from "../ui/standings";
import { renderStatus } from "../ui/status";
import { state } from "./state";
import { tick } from "./tick";

export function renderAll(): void {
  if (!state.data) return;
  renderSeason();
  renderHero();
  renderSchedule();
  renderTeams();
  renderDrivers();
  renderStatus();
  renderFooter();
  tick();
}

function renderSeason(): void {
  if (!state.data) return;
  const label = $("#season-label");
  if (label) label.textContent = state.data.season + " season";
  document.title = "F1 " + state.data.season + " · Schedule, results & standings";
}

/** Polite screen-reader announcement for loading and offline states. */
export function announce(message: string): void {
  const live = $("#live");
  if (!live) return;
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = message;
  }, 60);
}
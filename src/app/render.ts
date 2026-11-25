import { $ } from "../lib/dom";
import { DATA_EVENT } from "./events";
import { renderSchedule } from "../ui/calendar";
import { renderFooter } from "../ui/footer";
import { renderHero } from "../ui/hero";
import { renderResults } from "../ui/results";
import { state } from "./state";
import { tick } from "./tick";

export { DATA_EVENT, RESULTS_EVENT } from "./events";

export function renderAll(): void {
  if (!state.data) return;
  renderSeason();
  renderHero();
  renderSchedule();
  renderResults();
  renderFooter();
  tick();
  document.dispatchEvent(new Event(DATA_EVENT));
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
import { nextRace, state } from "../app/state";
import { teamDisplayName } from "../data/teams";
import { $, esc, replayAnimation } from "../lib/dom";
import { cdParts, fmtRaceWhen, gpTitle, pad2, raceStart } from "../lib/format";
import { prefersReducedMotion } from "../lib/motion";
import type { Race, RaceWinner } from "../types";
import { sessionList } from "./sessions";

const cdBlock = (unit: string, label: string): string =>
  '<div class="cd"><span class="cd__num" data-cd="' + unit + '">--</span><span class="cd__label">' + label + "</span></div>";

/** Weekend schedule in the banner stays open until the visitor closes it. */
let weekendOpen = true;

export function renderHero(): void {
  const host = $("#hero");
  const data = state.data;
  if (!host || !data) return;

  const next = nextRace();

  if (!next) {
    const drivers = data.drivers || [];
    const teams = data.teams || [];
    const winners = data.races.filter(
      (race): race is Race & { winner: RaceWinner } => race.winner !== null,
    );
    const last = winners[winners.length - 1];
    const championDriver = drivers[0];
    const championTeam = teams[0];

    host.innerHTML =
      '<div class="hero__top">' +
        '<span class="chip chip--done">Season complete</span>' +
      "</div>" +
      '<h1 class="hero__title">That’s a wrap</h1>' +
      '<p class="hero__meta">Every round of the ' + esc(data.season) + " season has a result. Here is how it ended.</p>" +
      '<div class="hero__stats">' +
        (championDriver ? "<div><span>Drivers’ champion</span><strong>" + esc(championDriver.name) + "</strong></div>" : "") +
        (championTeam ? "<div><span>Constructors’ champion</span><strong>" + esc(teamDisplayName(championTeam)) + "</strong></div>" : "") +
        (last ? "<div><span>Last winner</span><strong>" + esc(last.winner.driver) + "</strong></div>" : "") +
      "</div>";
    return;
  }

  const start = raceStart(next);
  const started = start.getTime() <= Date.now();

  const countdown = started
    ? '<div class="hero__pending">Lights out — waiting for the official classification…</div>'
    : '<div class="countdown" id="hero-cd" role="timer" aria-label="Time remaining until the race start">' +
        cdBlock("d", "Days") + cdBlock("h", "Hours") + cdBlock("m", "Mins") + cdBlock("s", "Secs") +
      "</div>";

  host.innerHTML =
    (started ? '<div class="hero__top"><span class="chip chip--live">Lights out</span></div>' : "") +
    '<h1 class="hero__title">' + gpTitle(next.name) + "</h1>" +
    '<div class="hero__body">' +
      countdown +
      '<div class="hero__info">' +
        '<span class="hero__info-label">Race start</span>' +
        "<strong>" + esc(fmtRaceWhen(next)) + "</strong>" +
      "</div>" +
    "</div>" +
    '<div class="hero__weekend' + (weekendOpen ? " is-open" : "") + '">' +
      '<button class="hero__weekend-btn" type="button" id="hero-weekend-btn" aria-expanded="' + weekendOpen + '" aria-controls="hero-weekend">' +
        "<span>Weekend schedule</span>" +
        '<span class="hero__weekend-chev" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>' +
        "</span>" +
      "</button>" +
      '<div class="hero__weekend-panel" id="hero-weekend" role="region" aria-labelledby="hero-weekend-btn"' +
        (weekendOpen ? "" : ' aria-hidden="true"') + ">" +
        '<div class="hero__weekend-inner">' + sessionList(next) + "</div>" +
      "</div>" +
    "</div>" +
    '<p class="sr-only">Next race: ' + esc(next.name) + ", " + esc(fmtRaceWhen(next)) + ".</p>";
}

export function initHero(): void {
  const host = $("#hero");
  if (!host) return;

  host.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>(".hero__weekend-btn");
    if (!button) return;

    const wrap = button.closest<HTMLElement>(".hero__weekend");
    if (!wrap) return;

    const open = !wrap.classList.contains("is-open");
    weekendOpen = open;
    wrap.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));

    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.setAttribute("aria-hidden", String(!open));
  });
}

export function updateHeroCountdown(ms: number): void {
  const host = $("#hero-cd");
  if (!host) return;

  const parts = cdParts(ms);
  for (const unit of ["d", "h", "m", "s"] as const) {
    const element = host.querySelector<HTMLElement>('[data-cd="' + unit + '"]');
    if (!element) continue;
    const value = pad2(parts[unit]);
    if (element.textContent === value) continue;
    element.textContent = value;
    if (!prefersReducedMotion.matches) replayAnimation(element, "is-tick");
  }
}
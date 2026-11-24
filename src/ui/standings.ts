import { state } from "../app/state";
import { teamColors, teamNameFor } from "../data/teams";
import { $, esc } from "../lib/dom";
import { fmtPoints, winsText } from "../lib/format";
import { getFavDriver, getFavTeam } from "../lib/prefs";

const STAR = '<svg class="fav-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z"/></svg><span class="sr-only">, favourite</span>';

export function renderTeams(): void {
  const host = $("#team-list");
  if (!host || !state.data) return;

  const teams = state.data.teams || [];
  const leader = Math.max(1, teams.length ? teams[0].points : 1);
  const favTeam = getFavTeam();

  host.innerHTML = teams.map((team) => {
    const colors = teamColors(team.id);
    const pct = Math.max(1.5, Math.round((team.points / leader) * 1000) / 10);
    const medal = team.pos <= 3 ? " is-p" + team.pos : "";
    const fav = favTeam && team.id === favTeam;
    return '<li class="team-card' + (fav ? " is-fav" : "") + '" style="--team-dark:' + colors.dark + ";--team-light:" + colors.light + ";--pct:" + pct + '%">' +
      '<span class="team-card__pos' + medal + '">' + team.pos + "</span>" +
      '<span class="team-card__edge" aria-hidden="true"></span>' +
      '<span class="team-card__main">' +
        '<span class="team-card__name"><span class="team-card__name-text">' + esc(teamNameFor(team.id, team.name)) + "</span>" + (fav ? STAR : "") + "</span>" +
        '<span class="team-card__sub">' + esc(winsText(team.wins)) + "</span>" +
      "</span>" +
      '<span class="team-card__pts">' + fmtPoints(team.points) + "<span>PTS</span></span>" +
    "</li>";
  }).join("");
}

export function renderDrivers(): void {
  const host = $("#driver-list");
  if (!host || !state.data) return;

  const drivers = state.data.drivers || [];
  const leader = Math.max(1, drivers.length ? drivers[0].points : 1);
  const favDriver = getFavDriver();

  host.innerHTML = drivers.map((driver) => {
    const colors = teamColors(driver.teamId);
    const pct = Math.max(1.5, Math.round((driver.points / leader) * 1000) / 10);
    const medal = driver.pos <= 3 ? " is-p" + driver.pos : "";
    const fav = favDriver && driver.code === favDriver;
    const sub = [teamNameFor(driver.teamId, driver.team), winsText(driver.wins)].filter(Boolean).join(" · ");
    return '<li class="driver' + (fav ? " is-fav" : "") + '" style="--team-dark:' + colors.dark + ";--team-light:" + colors.light + ";--pct:" + pct + '%">' +
      '<span class="driver__pos' + medal + '">' + driver.pos + "</span>" +
      '<span class="driver__edge" aria-hidden="true"></span>' +
      '<span class="driver__main">' +
        '<span class="driver__name"><span>' + esc(driver.name) + "</span>" + (fav ? STAR : "") + (driver.code ? '<span class="driver__code">' + esc(driver.code) + "</span>" : "") + "</span>" +
        '<span class="driver__sub">' + esc(sub) + "</span>" +
      "</span>" +
      '<span class="driver__pts">' + fmtPoints(driver.points) + "<span>PTS</span></span>" +
    "</li>";
  }).join("");
}
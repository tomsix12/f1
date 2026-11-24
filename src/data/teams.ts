import type { TeamPalette } from "../types";

/** Team identity colours, with a variant tuned for each theme. */
export const TEAM_COLORS: Record<string, TeamPalette> = {
  mercedes: { dark: "#2EE6D0", light: "#00857A" },
  ferrari: { dark: "#FF2D3D", light: "#C8001C" },
  red_bull: { dark: "#5B7BFF", light: "#1E3FD6" },
  mclaren: { dark: "#FF8C1A", light: "#C75000" },
  rb: { dark: "#7E9DFF", light: "#2A4FD0" },
  racing_bulls: { dark: "#7E9DFF", light: "#2A4FD0" },
  alphatauri: { dark: "#7E9DFF", light: "#2A4FD0" },
  alpine: { dark: "#FF8FC7", light: "#C2185B" },
  haas: { dark: "#C4C8CC", light: "#5F6368" },
  audi: { dark: "#E0334A", light: "#A3122A" },
  sauber: { dark: "#E0334A", light: "#A3122A" },
  kick_sauber: { dark: "#E0334A", light: "#A3122A" },
  williams: { dark: "#6FD0FF", light: "#0077B6" },
  aston_martin: { dark: "#3DD6A0", light: "#0B7A55" },
  cadillac: { dark: "#F2C84B", light: "#A67C00" },
};

/** Display overrides for team names coming from the API. */
export const TEAM_NAMES: Record<string, string> = {
  red_bull: "Red Bull Racing",
  rb: "Racing Bulls",
  haas: "Haas",
  alpine: "Alpine",
  cadillac: "Cadillac",
  aston_martin: "Aston Martin",
  audi: "Audi",
};

export const NEUTRAL_TEAM: TeamPalette = { dark: "#C4C8CC", light: "#5F6368" };

const warnedTeams = new Set<string>();

/** Unknown constructor ids fall back to neutral grey and warn once. */
export function teamColors(id: string): TeamPalette {
  const found = TEAM_COLORS[id];
  if (found) return found;
  if (!warnedTeams.has(id)) {
    warnedTeams.add(id);
    console.warn(`[F1] No TEAM_COLORS entry for "${id}" — using neutral grey.`);
  }
  return NEUTRAL_TEAM;
}

export function teamNameFor(id: string, fallback?: string): string {
  return TEAM_NAMES[id] || fallback || "Unknown team";
}

interface TeamNameInput {
  id?: string;
  teamId?: string;
  name?: string;
  team?: string;
}

export function teamDisplayName(team: TeamNameInput): string {
  return TEAM_NAMES[team.id || ""] || TEAM_NAMES[team.teamId || ""] || team.name || team.team || "Unknown team";
}
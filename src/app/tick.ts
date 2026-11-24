import { raceStart } from "../lib/format";
import { markNextSession } from "../ui/calendar";
import { updateHeroCountdown } from "../ui/hero";
import { nextRace } from "./state";

/** One-second heartbeat: countdown digits and the NEXT session badge. */
export function tick(): void {
  const next = nextRace();
  if (next) updateHeroCountdown(raceStart(next).getTime() - Date.now());
  markNextSession(false);
}
import { FETCH_TIMEOUT, FALLBACK_FILE } from "../config";
import type {
  JolpicaRaceTableResponse,
  JolpicaStandingsResponse,
} from "../data/jolpica";
import { getJson } from "../data/jolpica";
import { normalize } from "../data/normalize";
import snapshot from "../data/snapshot.json";
import { cache } from "../lib/storage";
import { renderFooter } from "../ui/footer";
import { announce, renderAll } from "./render";
import { signature, state, useData, validData } from "./state";

/** Bundled last-resort snapshot, used when even data.json cannot be fetched. */
const BOOTSTRAP: unknown = snapshot;

async function loadFallback(): Promise<void> {
  if (state.data) return;

  try {
    const response = await fetch(FALLBACK_FILE, { cache: "no-store" });
    if (response.ok) {
      const data: unknown = await response.json();
      if (validData(data)) {
        useData(data, "file");
        return;
      }
    }
  } catch (error) {
    console.warn("[F1] data.json fallback unavailable:", error);
  }

  if (validData(BOOTSTRAP)) useData(BOOTSTRAP, "sample");
}

/**
 * Fetches all four endpoints, normalises them and re-renders only when the
 * payload actually changed. Failed requests keep the last known data visible
 * and flag it as stale.
 */
export async function refresh(): Promise<void> {
  if (state.loading) return;
  state.loading = true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const [calendar, winners, drivers, teams] = await Promise.all([
      getJson<JolpicaRaceTableResponse>("/current.json", controller.signal),
      getJson<JolpicaRaceTableResponse>("/current/results/1.json?limit=100", controller.signal),
      getJson<JolpicaStandingsResponse>("/current/driverstandings.json?limit=100", controller.signal),
      getJson<JolpicaStandingsResponse>("/current/constructorstandings.json?limit=100", controller.signal),
    ]);

    const data = normalize(calendar, winners, drivers, teams);
    const sig = signature(data);

    state.data = data;
    state.savedAt = Date.now();
    state.lastFetch = Date.now();
    state.source = "live";
    state.stale = false;
    cache.write(state.savedAt, data);

    if (sig !== state.sig) {
      state.sig = sig;
      renderAll();
      announce("Data updated.");
    } else {
      renderFooter();
    }
  } catch (error) {
    console.warn("[F1] Live data refresh failed:", error);
    if (!state.data) {
      await loadFallback();
      if (state.data) {
        state.sig = signature(state.data);
        renderAll();
      }
    }
    state.stale = true;
    announce(state.data ? "Offline. Showing the last known data." : "Data is unavailable right now.");
  } finally {
    clearTimeout(timer);
    state.loading = false;
    state.lastAttempt = Date.now();
    renderFooter();
  }
}
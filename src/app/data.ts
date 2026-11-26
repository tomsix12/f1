import { FETCH_TIMEOUT, FALLBACK_DETAILS, FALLBACK_FILE } from "../config";
import { fetchResultsBundle } from "../data/details";
import type { ResultsBundle } from "../data/details";
import type {
  JolpicaRaceTableResponse,
  JolpicaStandingsResponse,
} from "../data/jolpica";
import { getJson } from "../data/jolpica";
import { normalize } from "../data/normalize";
import snapshot from "../data/snapshot.json";
import { sessionsOf } from "../lib/format";
import type { SeasonData } from "../types";
import { cache, detailsCache } from "../lib/storage";
import { RESULTS_EVENT } from "./events";
import { announce, renderAll } from "./render";
import { signature, state, useData, validData } from "./state";
import { renderFooter } from "../ui/footer";

/** Bundled last-resort snapshot, used when even data.json cannot be fetched. */
const BOOTSTRAP: unknown = snapshot;

/** Result sheets are larger than the standings, so they get a longer budget. */
const DETAILS_TIMEOUT = 40_000;

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
 * Fetches all four summary endpoints, normalises them and re-renders only when
 * the payload actually changed. Failed requests keep the last known data
 * visible and flag it as stale.
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

    // The full classifications are only needed by the Results view, so they
    // are fetched once per completed round instead of on every tick.
    void ensureDetails();
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
    void ensureDetails();
  } finally {
    clearTimeout(timer);
    state.loading = false;
    state.lastAttempt = Date.now();
    renderFooter();
  }
}

/** Last resort: the copy of the sheets published with the page. */
async function loadDetailsFallback(season: string): Promise<ResultsBundle | null> {
  try {
    const response = await fetch(FALLBACK_DETAILS, { cache: "no-store" });
    if (!response.ok) return null;
    const bundle = (await response.json()) as ResultsBundle | null;
    if (!bundle || !bundle.races || typeof bundle.races !== "object") return null;
    return {
      season: bundle.season || season,
      fetchedAt: bundle.fetchedAt || "",
      races: bundle.races,
      sprints: bundle.sprints || {},
      qualifying: bundle.qualifying || {},
      poles: bundle.poles || {},
    };
  } catch {
    return null;
  }
}

/**
 * True when a session started after the sheets were fetched, so qualifying,
 * a sprint or a race may have published new rows since. This is what makes
 * the Results view catch up on its own after a session.
 */
function hasSessionSince(bundle: ResultsBundle, data: SeasonData): boolean {
  const fetched = Date.parse(bundle.fetchedAt) || 0;
  if (!fetched) return true;
  const now = Date.now();
  for (const race of data.races) {
    for (const session of sessionsOf(race)) {
      const start = Date.parse(session.start);
      if (!Number.isNaN(start) && start > fetched && start < now) return true;
    }
  }
  return false;
}

/**
 * Loads the race, sprint and qualifying sheets. The bundle is reused while it
 * covers the same completed round and no session has run since the fetch, so
 * repeat visits stay cheap but a new classification still appears within one
 * refresh tick.
 */
export async function ensureDetails(force = false): Promise<void> {
  if (state.detailsLoading || !state.data) return;

  const data = state.data;
  if (!force && state.details && state.details.season === data.season) {
    const rounds = Object.keys(state.details.races).map(Number);
    const lastRound = rounds.length ? Math.max(...rounds) : 0;
    if (lastRound >= data.round && !hasSessionSince(state.details, data)) return;
  }

  state.detailsLoading = true;
  document.dispatchEvent(new Event(RESULTS_EVENT));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DETAILS_TIMEOUT);

  try {
    const bundle = await fetchResultsBundle(data.season, controller.signal);
    if (!state.data || state.data.season !== data.season) return;
    state.details = bundle;
    state.detailsError = "";
    detailsCache.write(bundle);
  } catch (error) {
    console.warn("[F1] Result sheets unavailable:", error);
    if (!state.details) {
      const fallback = await loadDetailsFallback(data.season);
      if (fallback) {
        state.details = fallback;
        detailsCache.write(fallback);
      } else {
        state.detailsError = "Result sheets could not be loaded.";
      }
    }
  } finally {
    clearTimeout(timer);
    state.detailsLoading = false;
    document.dispatchEvent(new Event(RESULTS_EVENT));
  }
}

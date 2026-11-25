import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/settings.css";
import "./styles/chips.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/calendar.css";
import "./styles/standings.css";
import "./styles/results.css";
import "./styles/footer.css";
import "./styles/motion.css";
import "./styles/responsive.css";

import { ensureDetails, refresh } from "./app/data";
import { WANT_RESULTS_EVENT } from "./app/events";
import { renderAll } from "./app/render";
import { signature, state } from "./app/state";
import { tick } from "./app/tick";
import { REFRESH_MS } from "./config";
import { syncTimeZone } from "./lib/format";
import { PREFS_EVENT } from "./lib/prefs";
import { detailsCache, cache } from "./lib/storage";
import { initTheme } from "./lib/theme";
import { initSettings } from "./ui/settings";
import { initCalendar } from "./ui/calendar";
import { initHero } from "./ui/hero";
import { initMotionBlur } from "./ui/motion-blur";
import { initNav, showView, viewFromHash } from "./ui/nav";
import { initResults } from "./ui/results";

function boot(): void {
  initTheme();
  initSettings();
  initNav();
  initCalendar();
  initHero();
  initMotionBlur();
  initResults();

  // The time zone changes every formatted date on the page, so rerender once
  // the stored preference has been updated.
  document.addEventListener(PREFS_EVENT, (event) => {
    if ((event as CustomEvent<string>).detail !== "timezone") return;
    syncTimeZone();
    renderAll();
  });

  // The Results view asks for a fresh classification bundle on demand.
  document.addEventListener(WANT_RESULTS_EVENT, () => {
    state.detailsError = "";
    void ensureDetails(true);
  });

  const cached = cache.read();
  if (cached) {
    state.data = cached.data;
    state.savedAt = cached.savedAt || Date.parse(cached.data.fetchedAt) || Date.now();
    state.source = "cache";
    state.sig = signature(cached.data);
    state.details = detailsCache.read();
    renderAll();
  }

  showView(viewFromHash(), { animate: false, scroll: false });
  void refresh();
  tick();

  window.setInterval(tick, 1000);
  window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, REFRESH_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    tick();
    if (Date.now() - state.lastAttempt > 30_000) void refresh();
  });

  window.addEventListener("online", () => {
    void refresh();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/palette.css";
import "./styles/chips.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/calendar.css";
import "./styles/standings.css";
import "./styles/footer.css";
import "./styles/motion.css";
import "./styles/responsive.css";

import { refresh } from "./app/data";
import { renderAll } from "./app/render";
import { signature, state } from "./app/state";
import { tick } from "./app/tick";
import { REFRESH_MS } from "./config";
import { cache } from "./lib/storage";
import { initTheme } from "./lib/theme";
import { initAppearance } from "./ui/appearance";
import { initCalendar } from "./ui/calendar";
import { initHero } from "./ui/hero";
import { initMotionBlur } from "./ui/motion-blur";
import { initNav, showView, viewFromHash } from "./ui/nav";
import { initStatus, renderStatus } from "./ui/status";

function boot(): void {
  initTheme();
  initAppearance();
  initNav();
  initCalendar();
  initHero();
  initStatus(() => {
    void refresh();
  });
  initMotionBlur();

  const cached = cache.read();
  if (cached) {
    state.data = cached.data;
    state.savedAt = cached.savedAt || Date.parse(cached.data.fetchedAt) || Date.now();
    state.source = "cache";
    state.sig = signature(cached.data);
    renderAll();
  } else {
    renderStatus();
  }

  showView(viewFromHash(), { animate: false, scroll: false });
  void refresh();
  tick();

  window.setInterval(tick, 1000);
  window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, REFRESH_MS);
  window.setInterval(() => {
    if (!document.hidden) renderStatus();
  }, 60 * 1000);

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
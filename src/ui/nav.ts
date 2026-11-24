import { state } from "../app/state";
import { $, $$ } from "../lib/dom";
import { prefersReducedMotion } from "../lib/motion";
import type { ViewName } from "../types";

export const VIEWS: ViewName[] = ["schedule", "drivers", "teams"];

function asView(value: string | undefined): ViewName {
  return VIEWS.includes(value as ViewName) ? (value as ViewName) : "schedule";
}

export function viewFromHash(): ViewName {
  return asView((location.hash || "").replace("#", ""));
}

export function showView(
  view: ViewName,
  options: { animate?: boolean; scroll?: boolean } = {},
): void {
  state.view = view;
  document.body.dataset.view = view;

  for (const panel of $$(".view")) {
    const active = panel.id === "view-" + view;
    panel.hidden = !active;
    if (active && options.animate !== false) {
      panel.classList.remove("is-entering");
      void panel.offsetWidth;
      panel.classList.add("is-entering");
    }
  }

  for (const tab of $$(".tab")) {
    const active = tab.dataset.view === view;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  }

  positionTabs();

  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  }
}

export function positionTabs(): void {
  const nav = $(".tabs");
  const indicator = $(".tabs__indicator");
  const active = $('.tab[aria-selected="true"]');
  if (!nav || !indicator || !active) return;
  indicator.style.width = active.offsetWidth + "px";
  indicator.style.transform = "translateX(" + active.offsetLeft + "px)";
}

export function navigate(view: ViewName): void {
  if (state.view !== view) {
    try {
      history.pushState(null, "", "#" + view);
    } catch {
      /* file:// */
    }
  }
  showView(view);
}

export function initNav(): void {
  for (const tab of $$(".tab")) {
    tab.addEventListener("click", () => navigate(asView(tab.dataset.view)));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const index = VIEWS.indexOf(asView(tab.dataset.view));
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const target = VIEWS[(index + delta + VIEWS.length) % VIEWS.length];
      navigate(target);
      const nextTab = $('.tab[data-view="' + target + '"]');
      if (nextTab) nextTab.focus();
    });
  }

  const brand = $(".brand");
  if (brand) {
    brand.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("schedule");
    });
  }

  window.addEventListener("resize", positionTabs);
  window.addEventListener("hashchange", () => showView(viewFromHash()));
  window.addEventListener("popstate", () => showView(viewFromHash()));

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(positionTabs).catch(() => {});
  }
}
import { state } from "../app/state";
import { $ } from "../lib/dom";
import { fmtFullStamp, fmtShortStamp, relTime } from "../lib/format";

type StatusMode = "live" | "syncing" | "offline" | "cache" | "sample";

export function renderStatus(): void {
  const status = $("#status");
  const label = $("#status-text");
  if (!status || !label) return;

  const stamp = state.lastFetch || state.savedAt;
  let mode: StatusMode = "live";
  let text = "Live";

  if (state.loading) {
    mode = "syncing";
    text = "Syncing…";
  } else if (!state.data) {
    mode = "offline";
    text = "No data";
  } else if (state.stale) {
    mode = "offline";
    text = "Offline · " + relTime(stamp);
  } else if (state.source === "live") {
    mode = "live";
    text = "Live · " + relTime(stamp);
  } else if (state.source === "cache") {
    mode = "cache";
    text = "Saved · " + relTime(stamp);
  } else if (state.source === "file") {
    mode = "cache";
    text = "Snapshot · " + fmtShortStamp(stamp);
  } else {
    mode = "sample";
    text = "Sample data";
  }

  status.dataset.state = mode;
  label.textContent = text;
  status.setAttribute("aria-label", text + " — refresh data");
  status.title = state.data ? "Last update " + fmtFullStamp(stamp) + " · click to refresh" : "Click to retry";
}

/** The status pill doubles as the manual refresh button. */
export function initStatus(onRefresh: () => void): void {
  const status = $("#status");
  if (!status) return;

  status.addEventListener("click", () => {
    status.classList.add("is-spinning");
    window.setTimeout(() => status.classList.remove("is-spinning"), 900);
    onRefresh();
  });
}
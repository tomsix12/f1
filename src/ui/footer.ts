import { state } from "../app/state";
import { $ } from "../lib/dom";
import { fmtFullStamp } from "../lib/format";

export function renderFooter(): void {
  const meta = $("#foot-meta");
  if (!meta) return;

  const stamp = state.lastFetch || state.savedAt;
  meta.textContent = "Last updated " + fmtFullStamp(stamp);
}
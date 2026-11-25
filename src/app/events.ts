/** Cross-module events, kept in one place to avoid import cycles. */

/** Fired after a full data render so panels can reload derived content. */
export const DATA_EVENT = "f1:data";
/** Fired when the detailed result sheets start or finish loading. */
export const RESULTS_EVENT = "f1:results";
/** Fired by the router whenever the visible view changes. */
export const VIEW_EVENT = "f1:view";
/** Requests a forced reload of the result sheets. */
export const WANT_RESULTS_EVENT = "f1:want-results";
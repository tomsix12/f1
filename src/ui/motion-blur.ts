import { prefersReducedMotion } from "../lib/motion";
import { PREFS_EVENT, getBlurScale, getMotionBlur } from "../lib/prefs";

/**
 * Directional scroll blur, adapted from the AGSL modifier in
 * sameerasw/essentials (MIT): velocity is sampled per frame, smoothed with a
 * 35/65 blend, decays while the scroll rests and blurs only along the scroll
 * axis. On the web the 10-sample shader becomes an SVG feGaussianBlur with a
 * vertical stdDeviation, so the effect stays cheap and text keeps its edges
 * horizontally.
 *
 * The filter is applied to the individual cards and headings rather than to
 * the whole `#content` wrapper on purpose. Filtering one tall scroll container
 * forces the browser to keep re-rasterising one very large render surface as
 * `stdDeviation` changes, which makes newly scrolled-in content stay blank for
 * a moment on slow or software rasterisers. Small per-item surfaces are only
 * rasterised while visible and cost almost nothing, while looking the same
 * because almost all detail lives inside the cards.
 *
 * Safari and Firefox cap the radius lower because their compositors handle
 * large filter surfaces differently.
 */
const BLUR_CLASS = "motion-blurring";
/** Elements that receive the filter; covers schedule, drivers and teams. */
const BLUR_TARGETS =
  ".hero, .racecard, .driver, .team-card, .section__head, .race-group__title, .foot__inner";
const TARGET_CLASS = "is-motion-blurred";
/** How far outside the viewport targets are kept ready, in viewport heights. */
const TARGET_MARGIN = 0.35;
/** Rounding step for stdDeviation so tiny per-frame changes don't re-blur. */
const BLUR_STEP = 0.25;
/** Minimum time between filter updates, in ms (~30 Hz is plenty for a blur). */
const PAINT_INTERVAL = 28;

export function initMotionBlur(): void {
  const gaussianNode = document.getElementById("scroll-motion-blur-gaussian");
  if (!(gaussianNode instanceof SVGFEGaussianBlurElement)) return;
  if (!document.getElementById("content")) return;

  const gaussian: SVGFEGaussianBlurElement = gaussianNode;

  /* Touch devices can fall behind on filtered layers during a fast flick, so
     the blur there is lighter and starts switched off (see getMotionBlur).
     Choosing it in the settings enables it like on desktop. */
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  const isFirefox = /firefox|fxios/i.test(navigator.userAgent);
  const MAX_VELOCITY = 3;
  const MAX_BLUR = isSafari || isFirefox ? 3 : coarse ? 4 : 7;
  /* Desktop gets a slightly stronger mapping than the previous 2.8 so the
     effect reads clearly at everyday scroll speeds without touching the
     touch-device / Safari caps. */
  const VELOCITY_TO_BLUR = isSafari || isFirefox || coarse ? 2.8 : 3.2;
  const root = document.documentElement;

  let enabled = getMotionBlur();
  let scale = getBlurScale();
  let running = false;
  let applied = false;
  let velocity = 0;
  let lastY = 0;
  let lastT = 0;
  let lastMove = 0;
  let appliedBlur = -1;
  let lastPaint = 0;
  let targets: HTMLElement[] = [];
  const marked = new Set<HTMLElement>();

  /** Keeps the filter on the cards near the viewport only. Filtering every
      card in the document at once makes the first frame of a fling build a
      surface for content that is nowhere near the screen, which is what
      delayed painting on slower devices. */
  function syncTargets(): void {
    const vh = window.innerHeight;
    const low = -vh * TARGET_MARGIN;
    const high = vh * (1 + TARGET_MARGIN);
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      const visible = rect.height > 0 && rect.bottom > low && rect.top < high;
      if (visible === marked.has(el)) continue;
      if (visible) {
        el.classList.add(TARGET_CLASS);
        marked.add(el);
      } else {
        el.classList.remove(TARGET_CLASS);
        marked.delete(el);
      }
    }
  }

  function clearMarks(): void {
    for (const el of marked) el.classList.remove(TARGET_CLASS);
    marked.clear();
  }

  function clear(): void {
    if (!applied) return;
    root.classList.remove(BLUR_CLASS);
    clearMarks();
    gaussian.setAttribute("stdDeviation", "0 0");
    applied = false;
    appliedBlur = -1;
    lastPaint = 0;
  }

  function showBlur(blur: number, now: number): void {
    // Quantise so a sub-pixel change does not restart the blur pass for every
    // filtered element on the next frame.
    const stepped = Math.round(blur / BLUR_STEP) * BLUR_STEP;
    if (stepped < 0.3) {
      clear();
      return;
    }
    if (!applied || now - lastPaint >= PAINT_INTERVAL) {
      syncTargets();
      if (!applied) {
        root.classList.add(BLUR_CLASS);
        applied = true;
      }
      if (stepped !== appliedBlur) {
        gaussian.setAttribute("stdDeviation", "0 " + stepped.toFixed(2));
        appliedBlur = stepped;
      }
      lastPaint = now;
    }
  }

  function stop(): void {
    running = false;
    velocity = 0;
    clear();
  }

  function frame(now: number): void {
    if (!running) return;
    if (!enabled || prefersReducedMotion.matches || document.hidden) {
      stop();
      return;
    }

    const dt = Math.min(64, Math.max(8, now - lastT));
    const y = window.scrollY;
    const delta = y - lastY;

    if (Math.abs(delta) > 0.1 && now - lastMove < 100) {
      const target = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, delta / dt));
      velocity = velocity * 0.35 + target * 0.65;
    } else {
      velocity *= 0.45;
      if (Math.abs(velocity) < 0.01) velocity = 0;
    }

    showBlur(Math.min(MAX_BLUR, Math.abs(velocity) * VELOCITY_TO_BLUR * scale), now);

    if (velocity === 0 && now - lastMove > 180) {
      running = false;
      clear();
      return;
    }

    lastY = y;
    lastT = now;
    window.requestAnimationFrame(frame);
  }

  function start(): void {
    if (running || !enabled || prefersReducedMotion.matches) return;
    running = true;
    targets = Array.from(document.querySelectorAll<HTMLElement>(BLUR_TARGETS));
    lastY = window.scrollY;
    lastT = performance.now();
    lastMove = lastT;
    window.requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", () => {
    lastMove = performance.now();
    start();
  }, { passive: true });

  document.addEventListener(PREFS_EVENT, (event) => {
    if ((event as CustomEvent<string>).detail !== "motion") return;
    enabled = getMotionBlur();
    scale = getBlurScale();
    if (!enabled) stop();
  });

  prefersReducedMotion.addEventListener("change", () => {
    if (prefersReducedMotion.matches) stop();
    else start();
  });

  // Never leave a paused tab blurred when it comes back to the foreground.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}
import { $ } from "../lib/dom";
import { prefersReducedMotion } from "../lib/motion";
import { PREFS_EVENT, getMotionBlur } from "../lib/prefs";

/**
 * Subtle motion blur while the content moves fast. Safari and Firefox cap it
 * lower because their compositors handle large filters differently.
 */
export function initMotionBlur(): void {
  const host = $("#content");
  if (!host) return;
  const content = host;

  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  const isFirefox = /firefox|fxios/i.test(navigator.userAgent);
  const MAX_BLUR = isSafari || isFirefox ? 3.2 : 6;

  let running = false;
  let applied = false;
  let blur = 0;
  let lastY = 0;
  let lastT = 0;
  let lastMove = 0;

  function stop(): void {
    running = false;
    blur = 0;
    if (applied) {
      content.style.filter = "";
      applied = false;
    }
  }

  function frame(now: number): void {
    if (!running) return;
    if (prefersReducedMotion.matches) {
      stop();
      return;
    }

    const dt = Math.min(64, Math.max(8, now - lastT));
    const y = window.scrollY;
    const speed = Math.abs(y - lastY) / dt;
    if (speed > 0.04) lastMove = now;

    const target = Math.min(MAX_BLUR, speed * 2.1);
    const ease = target > blur ? 0.4 : 0.16;
    blur += (target - blur) * ease;

    if (blur < 0.06 && target === 0) {
      blur = 0;
      if (applied) {
        content.style.filter = "";
        applied = false;
      }
      if (now - lastMove > 260) {
        running = false;
        return;
      }
    } else {
      content.style.filter = "blur(" + blur.toFixed(2) + "px)";
      applied = true;
    }

    lastY = y;
    lastT = now;
    window.requestAnimationFrame(frame);
  }

  function start(): void {
    if (running || prefersReducedMotion.matches || !getMotionBlur()) return;
    running = true;
    lastY = window.scrollY;
    lastT = performance.now();
    lastMove = lastT;
    window.requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", start, { passive: true });
  prefersReducedMotion.addEventListener("change", () => {
    if (prefersReducedMotion.matches) stop();
    else start();
  });
  document.addEventListener(PREFS_EVENT, (event) => {
    if ((event as CustomEvent<string>).detail === "motion" && !getMotionBlur()) stop();
  });
}
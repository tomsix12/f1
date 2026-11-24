import { $ } from "../lib/dom";
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
 * Safari and Firefox cap the radius lower because their compositors handle
 * large filter surfaces differently.
 */
export function initMotionBlur(): void {
  const host = $("#content");
  const gaussianNode = document.getElementById("scroll-motion-blur-gaussian");
  if (!host || !(gaussianNode instanceof SVGFEGaussianBlurElement)) return;
  const content = host;
  const gaussian: SVGFEGaussianBlurElement = gaussianNode;

  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  const isFirefox = /firefox|fxios/i.test(navigator.userAgent);
  const MAX_VELOCITY = 3;
  const MAX_BLUR = isSafari || isFirefox ? 3 : 6;
  const VELOCITY_TO_BLUR = 2.8;

  let enabled = getMotionBlur();
  let scale = getBlurScale();
  let running = false;
  let applied = false;
  let velocity = 0;
  let lastY = 0;
  let lastT = 0;
  let lastMove = 0;
  let appliedBlur = -1;

  function clear(): void {
    if (!applied) return;
    content.style.filter = "";
    applied = false;
    appliedBlur = -1;
  }

  function showBlur(blur: number): void {
    if (blur < 0.3) {
      clear();
      return;
    }
    if (Math.abs(blur - appliedBlur) > 0.01) {
      gaussian.setAttribute("stdDeviation", "0 " + blur.toFixed(2));
      appliedBlur = blur;
    }
    if (!applied) {
      content.style.filter = 'url("#scroll-motion-blur")';
      applied = true;
    }
  }

  function stop(): void {
    running = false;
    velocity = 0;
    clear();
  }

  function frame(now: number): void {
    if (!running) return;
    if (!enabled || prefersReducedMotion.matches) {
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

    showBlur(Math.min(MAX_BLUR, Math.abs(velocity) * VELOCITY_TO_BLUR * scale));

    if (velocity === 0 && now - lastMove > 180) {
      running = false;
      return;
    }

    lastY = y;
    lastT = now;
    window.requestAnimationFrame(frame);
  }

  function start(): void {
    if (running || !enabled || prefersReducedMotion.matches) return;
    running = true;
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
}
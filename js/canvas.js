/**
 * Canvas sizing utility and visibility tracking.
 *
 * fitCanvas() — DPR-aware canvas resize with zero-dimension guard.
 * canvasVis   — live visibility map updated by IntersectionObserver.
 */

/** Visibility flags keyed by canvas id. */
export const canvasVis = {};

/**
 * Resize a <canvas> to match its CSS-rendered size at device pixel ratio.
 * Returns { ctx, w, h, ok }.  ok === false means the canvas has no layout
 * size yet — callers should retry later instead of drawing to a 0×0 surface.
 *
 * IMPORTANT: Only resets the canvas buffer when dimensions actually change.
 * Setting cv.width/cv.height destroys all content AND resets the 2D context
 * state (including transforms), so we must avoid doing it unnecessarily.
 */
export function fitCanvas(cv) {
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);
  const rect = cv.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  if (w < 1 || h < 1) {
    return { ctx: null, w: 0, h: 0, ok: false };
  }

  const needW = Math.round(w * dpr);
  const needH = Math.round(h * dpr);

  /* Only reset the buffer when size actually changed */
  if (cv.width !== needW || cv.height !== needH) {
    cv.width  = needW;
    cv.height = needH;
  }

  const ctx = cv.getContext('2d');
  /* Always re-apply transform — it's lost on any buffer reset */
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  return { ctx, w, h, ok: true };
}

/**
 * Observe all game canvases.  Sets canvasVis[id] = true/false
 * so animation loops can skip drawing when off-screen.
 */
export function setupCanvasObserver() {
  const IDS = ['heroCanvas', 'stageCanvas', 'catchCanvas', 'solveCanvas', 'missionCanvas'];

  if (typeof IntersectionObserver === 'undefined') {
    IDS.forEach(id => { canvasVis[id] = true; });
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { canvasVis[e.target.id] = e.isIntersecting; });
  }, { threshold: 0.02 });

  IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { obs.observe(el); canvasVis[id] = false; }
  });
}

/**
 * Fade sections in as they scroll into view.
 * Requires .js class on <html> and CSS rules for .sec / .sec.visible.
 */
export function setupSectionAnimations() {
  if (typeof IntersectionObserver === 'undefined') return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.sec').forEach(s => obs.observe(s));
}

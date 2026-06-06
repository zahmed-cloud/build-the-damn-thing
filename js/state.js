/**
 * Global game state — level, money tracking.
 * Also exports the toast() helper and the REFIT registry.
 */

let lv    = 0;
let money = 0;

export const GAME = {
  addCash(n) {
    money = Math.min(10000, money + n);
    return money;
  },
  lvlUp() {
    lv++;
    return lv;
  },
  get money() { return money; },
  get lv()    { return lv; }
};

/** Show a brief toast notification at the bottom of the screen. */
export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2400);
}

/**
 * Registry of canvas build/resize functions.
 * Each game module pushes its own build() here so that tab-switches
 * and window resizes can re-measure all canvases in one pass.
 */
export const REFIT = [];

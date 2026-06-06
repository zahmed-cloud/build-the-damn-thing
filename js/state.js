/**
 * Global game state — level, money, HUD rendering.
 * Also exports the toast() helper and the REFIT registry.
 */

/* --- HUD elements --- */
const lvEl    = document.getElementById('hudLV');
const moneyEl = document.getElementById('hudMoney');

function bump(el) {
  if (!el) return;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 200);
}

/* --- internal counters --- */
let lv    = 0;
let money = 0;

function renderLv() {
  if (lvEl) {
    lvEl.textContent = 'LV ' + String(lv).padStart(2, '0');
    bump(lvEl);
  }
}

function renderMoney() {
  if (moneyEl) {
    moneyEl.textContent = '$' + money.toLocaleString() + '/$10K';
    bump(moneyEl);
  }
}

/* --- public API --- */
export const GAME = {
  addCash(n) {
    money = Math.min(10000, money + n);
    renderMoney();
    return money;
  },
  lvlUp() {
    lv++;
    renderLv();
    return lv;
  },
  get money() { return money; },
  get lv()    { return lv; }
};

/**
 * Show a brief toast notification at the bottom of the screen.
 */
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

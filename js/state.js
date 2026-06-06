/**
 * Unified progression system — XP, levels, achievements, persistence.
 *
 * Every interaction feeds into one XP pool:
 *   - Build agent: +80-800 XP
 *   - Catch leads: +40 per lead
 *   - Solve quiz: +80 per correct answer
 *   - Drive coins: +30 per coin
 *   - Dev mode: +500 bonus
 *
 * Levels: every 500 XP = 1 level up (with toast + sound).
 * Achievements: tracked and shown once per session.
 * State persisted in localStorage.
 */

var XP_PER_LEVEL = 500;

/* Load persisted state */
var saved = {};
try { saved = JSON.parse(localStorage.getItem('btdt_state') || '{}'); } catch(e) {}

var xp    = saved.xp || 0;
var lv    = saved.lv || 0;
var money = saved.money || 0;
var achievements = saved.ach || {};

function persist() {
  try { localStorage.setItem('btdt_state', JSON.stringify({ xp: xp, lv: lv, money: money, ach: achievements })); } catch(e) {}
}

function checkLevelUp() {
  var newLv = Math.floor(xp / XP_PER_LEVEL);
  if (newLv > lv) {
    lv = newLv;
    toast('LEVEL UP \u2014 LV ' + String(lv).padStart(2, '0'));
    if (typeof window.SND !== 'undefined') window.SND.lvlUp();
    persist();
    return true;
  }
  return false;
}

export var GAME = {
  addXP: function(n) {
    xp += n;
    money = Math.min(10000, money + n);
    checkLevelUp();
    persist();
    return xp;
  },
  addCash: function(n) {
    return GAME.addXP(n);
  },
  lvlUp: function() {
    /* legacy compat — just add 100 XP */
    return GAME.addXP(100);
  },
  get xp()    { return xp; },
  get money() { return money; },
  get lv()    { return lv; },
  get nextLv() { return (lv + 1) * XP_PER_LEVEL - xp; }
};

/**
 * Award an achievement (shows toast, only once per key).
 */
export function achieve(key, title) {
  if (achievements[key]) return false;
  achievements[key] = 1;
  toast('ACHIEVEMENT \u2014 ' + title);
  persist();
  return true;
}

/** Show a brief toast notification. */
export function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(function() { t.classList.remove('show'); }, 2600);
}

/**
 * Registry of canvas build/resize functions.
 */
export var REFIT = [];

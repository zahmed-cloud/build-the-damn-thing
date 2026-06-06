/**
 * BUILD THE DAMN THING — Entry point.
 *
 * Imports every module, initialises all sections, and wires up
 * cross-cutting concerns (tabs, sound toggle, resize events).
 */

import { SND }                                        from './sound.js';
import { REFIT }                                       from './state.js';
import { setupCanvasObserver, setupSectionAnimations } from './canvas.js';
import { initHero }                                    from './hero.js';
import { initBuildGame }                               from './build-game.js';
import { initCatchGame }                               from './catch-game.js';
import { initSolveGame }                               from './solve-game.js';
import { initWeeksMap }                                from './weeks-map.js';
import { initEmail, initMarquee }                      from './email.js';

/* --- Progressive enhancement flag --- */
document.documentElement.classList.add('js');

/* --- Observers (must run before canvas inits) --- */
setupCanvasObserver();
setupSectionAnimations();

/* --- Section init --- */
initHero();
initBuildGame();
initCatchGame();
initSolveGame();
initWeeksMap();
initEmail();
initMarquee();

/* --- Arcade tab switching --- */
(function initTabs() {
  const tabs = [...document.querySelectorAll('.arc-tab')];
  const pans = [...document.querySelectorAll('.arc-panel')];

  tabs.forEach(t => {
    t.onclick = () => {
      tabs.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      pans.forEach(p => p.classList.remove('on'));
      t.classList.add('on');
      t.setAttribute('aria-selected', 'true');
      document.getElementById(t.dataset.p).classList.add('on');
      SND.blip();
      REFIT.forEach(fn => { try { fn(); } catch (e) { /* safe */ } });
    };
  });
})();

/* --- HUD sound toggle --- */
(function initSoundToggle() {
  const btn = document.getElementById('hudSnd');
  if (!btn) return;

  btn.onclick = () => {
    const on = SND.toggle();
    btn.innerHTML = on ? '\ud83d\udd0a' : '\ud83d\udd07';
    btn.setAttribute('aria-label', on ? 'Sound on, click to mute' : 'Sound off, click to unmute');
    if (on) SND.blip();
  };
})();

/* --- Safe canvas sizing after layout settles --- */
(function initResize() {
  function fire() {
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* IE */ }
  }
  requestAnimationFrame(fire);
  [150, 500, 1200].forEach(ms => setTimeout(fire, ms));
  window.addEventListener('load', fire);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fire);
  }
})();

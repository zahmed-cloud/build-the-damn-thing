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

/* --- Observers for game canvases + section scroll-in --- */
setupCanvasObserver();
setupSectionAnimations();

/* --- Section init ---
   Hero is fully self-contained (handles its own sizing/resizing internally).
   Game canvases still use the REFIT/resize pattern for tab switching. */
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
    btn.textContent = on ? 'SND' : 'OFF';
    btn.setAttribute('aria-label', on ? 'Sound on, click to mute' : 'Sound off, click to unmute');
    if (on) SND.blip();
  };
})();

/* --- Resize fire for game canvases (NOT hero — hero handles itself) --- */
(function initResize() {
  function fire() {
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* noop */ }
  }
  requestAnimationFrame(fire);
  window.addEventListener('load', fire);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fire);
  }
})();

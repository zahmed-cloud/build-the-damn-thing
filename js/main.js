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
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* noop */ }
  }
  /*
   * Only fire resize at meaningful layout milestones:
   *   - rAF: first opportunity after DOM + modules are ready
   *   - load: all resources (images, iframes) done
   *   - fonts.ready: font metrics finalised, element sizes may change
   *
   * Previous code also fired at 150ms/500ms/1200ms via setTimeout,
   * which caused 4-5 redundant build() calls that kept clearing the
   * hero canvas buffer and resetting its context transform — the root
   * cause of the disappearing hero world.
   */
  requestAnimationFrame(fire);
  window.addEventListener('load', fire);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fire);
  }
})();

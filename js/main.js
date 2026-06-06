/**
 * BUILD THE DAMN THING — Entry point.
 *
 * Imports every module, initialises all sections, and wires up
 * cross-cutting concerns (tabs, sound toggle, resize events).
 */

import { SND }                                        from './sound.js';
import { REFIT, toast }                                from './state.js';
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
  var tabs = [].slice.call(document.querySelectorAll('.arc-tab'));
  var pans = [].slice.call(document.querySelectorAll('.arc-panel'));

  tabs.forEach(function(t) {
    t.onclick = function() {
      tabs.forEach(function(x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      pans.forEach(function(p) { p.classList.remove('on'); });
      t.classList.add('on');
      t.setAttribute('aria-selected', 'true');
      document.getElementById(t.dataset.p).classList.add('on');
      SND.blip();
      REFIT.forEach(function(fn) { try { fn(); } catch (e) { /* safe */ } });
    };
  });
})();

/* --- HUD sound toggle --- */
(function initSoundToggle() {
  var btn = document.getElementById('hudSnd');
  if (!btn) return;

  btn.onclick = function() {
    var on = SND.toggle();
    btn.textContent = on ? 'SND' : 'OFF';
    btn.setAttribute('aria-label', on ? 'Sound on, click to mute' : 'Sound off, click to unmute');
    if (on) SND.blip();
  };
})();

/* --- Resize fire for game canvases --- */
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

/* --- Konami Code bonus — scrolls to hero and starts the car game --- */
(function initKonami() {
  var SEQ = [38,38,40,40,37,39,37,39,66,65];
  var pos = 0;
  document.addEventListener('keydown', function(e) {
    if (e.keyCode === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) {
        pos = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('KONAMI CODE \u2014 NICE ONE');
        SND.win();
        /* click the hero canvas to trigger car game */
        setTimeout(function() {
          var cv = document.getElementById('heroCanvas');
          if (cv) cv.click();
        }, 400);
      }
    } else {
      pos = 0;
    }
  });
})();

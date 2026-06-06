/**
 * BUILD THE DAMN THING — Entry point.
 */

import { SND }                                        from './sound.js';
import { REFIT, GAME, toast, achieve }                  from './state.js';
import { setupCanvasObserver, setupSectionAnimations } from './canvas.js';
import { initHero }                                    from './hero.js';
import { initBuildGame }                               from './build-game.js';
import { initCatchGame }                               from './catch-game.js';
import { initSolveGame }                               from './solve-game.js';
import { initWeeksMap }                                from './weeks-map.js';
import { initEmail, initMarquee }                      from './email.js';
import { initMission }                                  from './mission.js';

/* --- Progressive enhancement + expose SND globally for state.js --- */
document.documentElement.classList.add('js');
window.SND = SND;

/* --- Always start at the top on page load/refresh --- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* --- Check localStorage for dev mode --- */
var devMode = false;
try { devMode = localStorage.getItem('btdt_dev') === '1'; } catch(e) {}
if (devMode) document.body.classList.add('dev-mode');

/* Expose dev mode state for hero module */
window._btdtDev = devMode;

/* --- Observers --- */
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
initMission();

/* --- Arcade tabs --- */
(function() {
  var tabs = [].slice.call(document.querySelectorAll('.arc-tab'));
  var pans = [].slice.call(document.querySelectorAll('.arc-panel'));
  tabs.forEach(function(t) {
    t.onclick = function() {
      tabs.forEach(function(x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      pans.forEach(function(p) { p.classList.remove('on'); });
      t.classList.add('on'); t.setAttribute('aria-selected', 'true');
      document.getElementById(t.dataset.p).classList.add('on');
      SND.blip();
      REFIT.forEach(function(fn) { try { fn(); } catch(e) {} });
    };
  });
})();

/* --- Sound toggle --- */
(function() {
  var btn = document.getElementById('hudSnd');
  if (!btn) return;
  btn.onclick = function() {
    var o = SND.toggle();
    btn.textContent = o ? 'SND' : 'OFF';
    btn.setAttribute('aria-label', o ? 'Sound on, click to mute' : 'Sound off, click to unmute');
    if (o) SND.blip();
  };
})();

/* --- Resize fire --- */
(function() {
  function fire() { try { window.dispatchEvent(new Event('resize')); } catch(e) {} }
  requestAnimationFrame(fire);
  window.addEventListener('load', fire);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fire);
})();

/* --- Header scroll: transparent → solid past hero --- */
(function() {
  var hud = document.querySelector('.hud-bar');
  if (!hud) return;
  var scrolled = false;
  window.addEventListener('scroll', function() {
    var past = window.scrollY > 100;
    if (past !== scrolled) {
      scrolled = past;
      if (past) hud.classList.add('scrolled');
      else hud.classList.remove('scrolled');
    }
  }, { passive: true });
})();

/* ================================================================
   SECRET BUILDER CODE
   ================================================================ */
(function() {
  var SEQ = [38,38,40,40,37,39,37,39,66,65];
  var pos = 0;

  document.addEventListener('keydown', function(e) {
    if (e.keyCode === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) {
        pos = 0;
        activate();
      }
    } else {
      pos = 0;
    }
  });

  function activate() {
    if (devMode) {
      toast('DEV MODE ALREADY ACTIVE');
      SND.blip();
      return;
    }
    devMode = true;
    window._btdtDev = true;
    try { localStorage.setItem('btdt_dev', '1'); } catch(e) {}

    /* --- screen flash --- */
    var flash = document.createElement('div');
    flash.className = 'dev-flash';
    document.body.appendChild(flash);
    setTimeout(function() { flash.remove(); }, 500);

    /* --- retro fanfare --- */
    SND.lvlUp();
    setTimeout(function() { SND.win(); }, 350);

    /* --- pixel particles --- */
    spawnParticles();

    /* --- add dev-mode class for CSS upgrades --- */
    document.body.classList.add('dev-mode');

    /* --- XP bonus --- */
    GAME.addCash(500);

    /* --- achievement panel (delayed for drama) --- */
    setTimeout(showAchievement, 600);
  }

  function spawnParticles() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:850;pointer-events:none;';
    document.body.appendChild(canvas);

    var W = window.innerWidth, H = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var particles = [];
    var colors = ['#34a96a','#ffd64a','#e0603a','#7cc6ee','#f2ede1','#ff85c0'];
    for (var i = 0; i < 120; i++) {
      particles.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.3,
        y: H / 2 + (Math.random() - 0.5) * H * 0.2,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 3,
        c: colors[(Math.random() * colors.length) | 0],
        life: 70 + Math.random() * 50,
        size: 2 + Math.random() * 4
      });
    }

    var frame = 0;
    function loop() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.life <= 0) continue;
        alive = true;
        p.vy += 0.25;
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.98;
        p.life--;
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(loop);
      else canvas.remove();
    }
    requestAnimationFrame(loop);
  }

  function showAchievement() {
    var panel = document.createElement('div');
    panel.className = 'dev-achievement';
    panel.innerHTML =
      '<span class="da-label">ACHIEVEMENT UNLOCKED</span>' +
      '<div class="da-title">Old School Gamer</div>' +
      '<div class="da-sub">Found the Secret Builder Code</div>' +
      '<div class="da-xp">+500 XP</div>';
    document.body.appendChild(panel);

    /* close on click or after 4 seconds */
    function close() { panel.remove(); }
    panel.addEventListener('click', close);
    setTimeout(close, 4500);

    achieve('dev_mode', 'DEV MODE UNLOCKED \u2014 Welcome Builder');
  }
})();

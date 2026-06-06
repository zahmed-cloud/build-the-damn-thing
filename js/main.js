/**
 * BUILD THE DAMN THING — Entry point.
 *
 * Imports every module, initialises all sections, and wires up
 * cross-cutting concerns (tabs, sound toggle, resize events, easter eggs).
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

/* ================================================================
   KONAMI CODE EASTER EGG — Secret pixel car mini-game
   ================================================================
   Sequence: Up Up Down Down Left Right Left Right B A
   Unlocks a pixel car that drives across the screen collecting coins.
   ================================================================ */
(function initEasterEgg() {
  var SEQ = [38,38,40,40,37,39,37,39,66,65]; /* UUDDLRLRBA */
  var pos = 0;

  document.addEventListener('keydown', function(e) {
    if (e.keyCode === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) {
        pos = 0;
        launchPixelCar();
      }
    } else {
      pos = 0;
    }
  });

  function launchPixelCar() {
    /* Prevent double-launch */
    if (document.getElementById('eggCar')) return;

    toast('SECRET UNLOCKED \u2014 PIXEL RACER');
    SND.win();

    /* Create overlay */
    var overlay = document.createElement('div');
    overlay.id = 'eggCar';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;';

    var cv = document.createElement('canvas');
    cv.style.cssText = 'width:100%;max-width:600px;height:300px;image-rendering:pixelated;border:3px solid #e0603a;background:#15140f;';
    overlay.appendChild(cv);

    var hint = document.createElement('div');
    hint.style.cssText = "font-family:'Press Start 2P',monospace;font-size:9px;color:#f2ede1;margin-top:14px;text-align:center;opacity:0.7;";
    hint.textContent = 'arrow keys to drive \u00b7 collect coins \u00b7 click to close';
    overlay.appendChild(hint);

    document.body.appendChild(overlay);

    /* Game state */
    var W = 0, H = 0, u = 0;
    var car = { x: 50, y: 0, vy: 0, grounded: true, score: 0 };
    var coins = [], road = 0, speed = 2, alive = true;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      if (r.width < 1) return;
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      var ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      u = Math.max(3, Math.round(W / 120));
      car.y = H - u * 6;
    }
    size();

    /* Controls */
    var keys = {};
    function kd(e) { keys[e.keyCode] = true; if (e.keyCode === 38 && car.grounded) { car.vy = -u * 1.8; car.grounded = false; SND.blip(); } e.preventDefault(); }
    function ku(e) { keys[e.keyCode] = false; }
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);

    /* Spawn coins */
    function spawnCoin() {
      coins.push({ x: W + 20, y: H - u * 6 - Math.random() * H * 0.4, collected: false });
    }
    var spawnT = 0;

    /* Frame */
    function frame() {
      if (!alive) return;
      requestAnimationFrame(frame);

      var ctx = cv.getContext('2d');
      if (!ctx || W < 1) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      var gy = H - u * 3;
      road += speed;

      /* Sky */
      ctx.fillStyle = '#0a1520';
      ctx.fillRect(0, 0, W, gy);

      /* Stars */
      for (var si = 0; si < 20; si++) {
        var sx = ((si * 73 + road * 0.1) % W);
        var sy = (si * 31) % (gy - 10) + 5;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(sx, sy, u * 0.3, u * 0.3);
      }

      /* Road */
      ctx.fillStyle = '#2a2a28';
      ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = '#3a3a36';
      for (var ri = -road % (u * 6); ri < W; ri += u * 6) {
        ctx.fillRect(ri, gy + u * 1.2, u * 3, u * 0.4);
      }

      /* Move car */
      if (keys[39]) car.x = Math.min(W - u * 8, car.x + u * 0.4);
      if (keys[37]) car.x = Math.max(u * 2, car.x - u * 0.4);
      if (!car.grounded) {
        car.vy += u * 0.12;
        car.y += car.vy;
        if (car.y >= H - u * 6) { car.y = H - u * 6; car.vy = 0; car.grounded = true; }
      }

      /* Draw pixel car */
      var cx = car.x, cy = car.y;
      ctx.fillStyle = '#e0603a';
      ctx.fillRect(cx, cy, u * 6, u * 3);
      ctx.fillRect(cx + u, cy - u * 2, u * 4, u * 2);
      ctx.fillStyle = '#7cc6ee';
      ctx.fillRect(cx + u * 1.5, cy - u * 1.5, u * 1.2, u * 1.2);
      ctx.fillRect(cx + u * 3.3, cy - u * 1.5, u * 1.2, u * 1.2);
      ctx.fillStyle = '#1d1410';
      ctx.beginPath(); ctx.arc(cx + u * 1.5, cy + u * 3, u * 0.8, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + u * 4.5, cy + u * 3, u * 0.8, 0, 7); ctx.fill();

      /* Coins */
      spawnT += speed * 0.02;
      if (spawnT > 1) { spawnT = 0; spawnCoin(); }

      for (var ci = coins.length - 1; ci >= 0; ci--) {
        var c = coins[ci];
        c.x -= speed;
        if (c.x < -u * 4) { coins.splice(ci, 1); continue; }
        if (!c.collected && Math.abs(c.x - car.x) < u * 5 && Math.abs(c.y - car.y) < u * 5) {
          c.collected = true;
          car.score++;
          SND.coin();
          speed = Math.min(6, 2 + car.score * 0.15);
        }
        if (!c.collected) {
          ctx.fillStyle = '#ffd64a';
          ctx.shadowColor = '#ffd64a'; ctx.shadowBlur = 8;
          ctx.fillRect(c.x, c.y, u * 2, u * 2);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#1d1410';
          ctx.font = (u * 1.2) + "px 'Press Start 2P',monospace";
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('$', c.x + u, c.y + u);
        }
      }

      /* Score HUD */
      ctx.fillStyle = '#ffd64a';
      ctx.font = (u * 1.6) + "px 'Press Start 2P',monospace";
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('COINS ' + car.score, u * 2, u * 2);

      /* Achievement at 10 coins */
      if (car.score === 10) {
        toast('ACHIEVEMENT \u2014 PIXEL RACER LEGEND');
        SND.lvlUp();
        car.score++;
      }
    }

    requestAnimationFrame(frame);

    /* Close on click */
    overlay.addEventListener('click', function(e) {
      if (e.target === cv) return;
      alive = false;
      document.removeEventListener('keydown', kd);
      document.removeEventListener('keyup', ku);
      overlay.remove();
    });
  }
})();

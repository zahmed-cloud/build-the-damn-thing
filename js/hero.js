/**
 * Hero section — pixel sky, clouds, birds, road, and a drivable pixel car.
 *
 * The car idles on the road with a subtle bounce. Clicking it (or
 * pressing the PRESS START CTA) launches a coin-collecting mini-game
 * right inside the hero canvas. Pressing ESC or clicking exits the game.
 *
 * Architecture:
 *   - Dimensions via ResizeObserver (no per-frame polling).
 *   - rAF at TOP of frame — loop never dies.
 *   - try-catch around all drawing.
 *   - Context state fully reset every frame.
 */

import { SND }          from './sound.js';
import { GAME, toast }  from './state.js';

/* --- cloud pixel templates --- */
var CLOUD_L = ['...XXXX.....','..XXXXXXXX...','.XXXXXXXXXXX.','XXXXXXXXXXXX.','.XXXXXXXXXX..'];
var CLOUD_S = ['..XXX..','..XXXX.','.XXXXXX','XXXXXXX','.XXXXX.'];

export function initHero() {
  var cv = document.getElementById('heroCanvas');
  if (!cv) return;

  /* ── state ── */
  var W = 0, H = 0, u = 4, roadY = 0;
  var clouds = [], spark = [], birds = [];
  var car = null;             /* { x, bob-phase } */
  var playing = false;        /* mini-game active? */
  var keys = {};              /* key state for game */
  var gameState = null;       /* mini-game runtime */

  /* ── sizing (event-driven) ── */
  function applySize(cssW, cssH) {
    if (cssW < 1 || cssH < 1) return;
    cssW = Math.round(cssW);
    cssH = Math.round(cssH);
    if (cssW === W && cssH === H && car) return;

    W = cssW; H = cssH;
    u = Math.max(3, Math.min(6, Math.round(W / 240)));
    roadY = H * 0.82;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.round(cssW * dpr), bh = Math.round(cssH * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }

    buildWorld();
  }

  function readSize() { var r = cv.getBoundingClientRect(); applySize(r.width, r.height); }
  readSize();

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function(e) { var c = e[0].contentRect; applySize(c.width, c.height); }).observe(cv);
  } else {
    window.addEventListener('resize', readSize);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(readSize);

  /* ── world generation ── */
  function buildWorld() {
    clouds = [];
    var nc = W < 700 ? 5 : 9;
    for (var i = 0; i < nc; i++) {
      var ly = Math.random();
      clouds.push({ x: Math.random() * W, y: 14 + Math.random() * (H * 0.38),
        sp: 0.08 + ly * 0.3, sc: (1.8 + ly * 2.5) * (u / 4),
        a: 0.55 + ly * 0.4, shape: Math.random() > 0.45 ? CLOUD_L : CLOUD_S });
    }
    spark = [];
    for (var i = 0; i < 16; i++) spark.push({ x: Math.random() * W, y: Math.random() * H * 0.5, ph: Math.random() * 6.28 });
    birds = [];
    if (!car) car = { x: W * 0.28, ph: 0 };
    else car.x = Math.max(u * 10, Math.min(W - u * 14, car.x));
  }

  /* ── draw helpers ── */
  function drawCloud(ctx, mat, ox, oy, un) {
    for (var r = 0; r < mat.length; r++)
      for (var i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  function drawPixelCar(ctx, cx, cy, sc, flip) {
    var s = sc; /* pixel unit for the car */
    var d = flip ? -1 : 1;
    var ox = flip ? cx + s * 7 : cx;

    /* body */
    ctx.fillStyle = '#e0603a';
    ctx.fillRect(ox, cy, d * s * 7, s * 3);
    /* cabin */
    ctx.fillRect(ox + d * s * 1, cy - s * 2, d * s * 5, s * 2);
    /* windows */
    ctx.fillStyle = '#7cc6ee';
    ctx.fillRect(ox + d * s * 1.6, cy - s * 1.5, d * s * 1.4, s * 1.2);
    ctx.fillRect(ox + d * s * 3.5, cy - s * 1.5, d * s * 1.4, s * 1.2);
    /* headlight */
    ctx.fillStyle = '#ffd64a';
    ctx.fillRect(ox + d * s * (flip ? -0.2 : 6.4), cy + s * 0.5, d * s * 0.8, s * 0.8);
    /* wheels */
    ctx.fillStyle = '#1d1410';
    ctx.beginPath(); ctx.arc(cx + s * 1.8, cy + s * 3.1, s * 0.95, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 5.2, cy + s * 3.1, s * 0.95, 0, 7); ctx.fill();
    /* hub caps */
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(cx + s * 1.8, cy + s * 3.1, s * 0.35, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 5.2, cy + s * 3.1, s * 0.35, 0, 7); ctx.fill();
  }

  /* ── click / tap ── */
  cv.addEventListener('click', function(e) {
    if (!car) return;
    var r = cv.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;

    if (playing) {
      /* clicking during game — nothing special */
      return;
    }

    /* check if click is near the car */
    var carCx = car.x + u * 3.5;
    var carCy = roadY - u * 2;
    if (Math.abs(cx - carCx) < u * 10 && Math.abs(cy - carCy) < u * 8) {
      startGame();
    }
  });

  /* also wire up PRESS START button */
  var pressBtn = document.querySelector('.press-start');
  if (pressBtn) {
    pressBtn.addEventListener('click', function(e) {
      e.preventDefault();
      startGame();
    });
  }

  /* ── keyboard ── */
  document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;
    if (playing && e.keyCode === 27) { endGame(); e.preventDefault(); }
    if (playing && (e.keyCode >= 37 && e.keyCode <= 40)) e.preventDefault();
    if (playing && e.keyCode === 38 && gameState && gameState.grounded) {
      gameState.vy = -u * 1.7;
      gameState.grounded = false;
      SND.blip();
    }
  });
  document.addEventListener('keyup', function(e) { keys[e.keyCode] = false; });

  /* ── mini-game lifecycle ── */
  function startGame() {
    if (playing) return;
    playing = true;
    gameState = {
      carX: car.x, carY: roadY - u * 4, vy: 0, grounded: true,
      coins: [], score: 0, speed: 1.8, road: 0, spawnT: 0, time: 0
    };
    SND.blip();
    toast('DRIVE \u2014 arrows to move \u00b7 collect $');

    /* update hero hint */
    var poke = document.querySelector('.hero-poke');
    if (poke) poke.textContent = 'esc to exit \u00b7 arrows to drive';
  }

  function endGame() {
    if (!gameState) return;
    var sc = gameState.score;
    var cash = sc * 30;
    if (sc > 0) {
      GAME.addCash(cash);
      toast('RACE OVER \u2014 ' + sc + ' coins = $' + cash);
      if (sc >= 10) { toast('ACHIEVEMENT \u2014 PIXEL RACER LEGEND'); SND.win(); }
      else SND.good();
    }
    car.x = gameState.carX;
    playing = false;
    gameState = null;
    var poke = document.querySelector('.hero-poke');
    if (poke) poke.textContent = 'click the car to play';
  }

  /* ══════════════════════════════════════════════════════════
     ANIMATION LOOP
     ══════════════════════════════════════════════════════════ */
  function frame() {
    requestAnimationFrame(frame);
    if (W < 1 || !car) return;

    var ctx = cv.getContext('2d');
    if (!ctx) return;

    try {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;

      var f = Date.now() / 1000;

      /* ── sky gradient ── */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0,    '#4aa8e3');
      g.addColorStop(0.5,  '#7cc6ee');
      g.addColorStop(0.75, '#a5daf5');
      g.addColorStop(1,    '#c8ecfb');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      /* ── sun ── */
      var sx = W - u * 18, sy = u * 14, sr = u * 7;
      var pulse = 1 + Math.sin(f * 1.5) * 0.15;
      ctx.fillStyle = 'rgba(255,224,110,0.15)';
      ctx.beginPath(); ctx.arc(sx, sy, sr + u * 5 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,224,110,0.25)';
      ctx.beginPath(); ctx.arc(sx, sy, sr + u * 2.5 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd64a';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe98c';
      ctx.beginPath(); ctx.arc(sx - u, sy - u, sr * 0.5, 0, 7); ctx.fill();

      /* ── sparkles ── */
      for (var si = 0; si < spark.length; si++) {
        var sp = spark[si];
        var tw = 0.25 + 0.6 * Math.abs(Math.sin(f * 2.5 + sp.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
        ctx.fillRect(sp.x, sp.y, u * 0.6, u * 0.6);
        ctx.fillRect(sp.x + u * 0.7, sp.y + u * 0.15, u * 0.35, u * 0.35);
        ctx.fillRect(sp.x + u * 0.15, sp.y + u * 0.7, u * 0.35, u * 0.35);
      }

      /* ── clouds ── */
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci];
        cl.x -= cl.sp;
        if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
        ctx.globalAlpha = cl.a;
        drawCloud(ctx, cl.shape, cl.x, cl.y, cl.sc);
      }
      ctx.globalAlpha = 1;

      /* ── birds ── */
      for (var bi = birds.length - 1; bi >= 0; bi--) {
        var b = birds[bi];
        b.x += b.vx; b.py += Math.sin(f * 3 + b.ph) * 0.15;
        var wing = Math.sin(f * 8 + b.ph) * u * 0.8;
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(b.x - u * 0.8, b.py - wing, u * 0.5, u * 0.5);
        ctx.fillRect(b.x, b.py, u * 0.5, u * 0.5);
        ctx.fillRect(b.x + u * 0.8, b.py - wing, u * 0.5, u * 0.5);
        if (b.x < -30 || b.x > W + 30) birds.splice(bi, 1);
      }
      if (birds.length < 3 && Math.random() < 0.003) {
        var bL = Math.random() > 0.5;
        birds.push({ x: bL ? -20 : W + 20, py: 20 + Math.random() * H * 0.3,
          vx: bL ? 0.3 + Math.random() * 0.5 : -(0.3 + Math.random() * 0.5), ph: Math.random() * 6.28 });
      }

      /* ══════════════════════════════
         ROAD — the new ground layer
         ══════════════════════════════ */
      var ry = roadY;

      /* grassy verge at top of road */
      ctx.fillStyle = '#5a9e3c';
      ctx.fillRect(0, ry - u * 1.5, W, u * 1.5);
      ctx.fillStyle = '#6db24a';
      for (var vi = 0; vi < W; vi += u * 2) ctx.fillRect(vi, ry - u * 1.5, u, u * 0.6);

      /* asphalt */
      ctx.fillStyle = '#3a3a38';
      ctx.fillRect(0, ry, W, H - ry);

      /* road markings — animated dashes */
      var roadOff = playing && gameState ? gameState.road : (f * 30) % (u * 8);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      var laneY = ry + (H - ry) * 0.45;
      for (var ri = -roadOff % (u * 8); ri < W; ri += u * 8) {
        ctx.fillRect(ri, laneY, u * 4, u * 0.5);
      }

      /* curb line */
      ctx.fillStyle = '#ffd64a';
      ctx.fillRect(0, ry, W, u * 0.4);

      /* bottom edge detail */
      ctx.fillStyle = '#2e2e2c';
      ctx.fillRect(0, H - u * 1.5, W, u * 1.5);

      /* ══════════════════════════════
         CAR — idle or playing
         ══════════════════════════════ */
      if (playing && gameState) {
        drawGameMode(ctx, f);
      } else {
        drawIdleCar(ctx, f);
      }

    } catch (e) {
      if (typeof console !== 'undefined') console.warn('Hero frame error:', e);
    }
  }

  /* ── idle car with subtle bounce ── */
  function drawIdleCar(ctx, f) {
    var bob = Math.sin(f * 2.5) * u * 0.3;
    var carW = u * 7, carH = u * 4;
    var cx = car.x, cy = roadY - carH + bob;

    /* exhaust particles */
    var ex = cx - u * 0.5, ey = cy + carH - u * 0.5;
    for (var i = 0; i < 3; i++) {
      var age = (f * 2 + i * 0.7) % 2;
      if (age < 1.2) {
        ctx.globalAlpha = 0.2 * (1 - age / 1.2);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(ex - age * u * 2 - i * u * 0.5, ey - age * u * 1.5, u * 0.7, u * 0.7);
      }
    }
    ctx.globalAlpha = 1;

    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(cx + carW / 2, roadY + u * 0.5, carW * 0.55, u * 0.8, 0, 0, 7); ctx.fill();

    /* the car */
    drawPixelCar(ctx, cx, cy, u, false);

    /* "click to play" hint glow */
    var glow = 0.08 + 0.05 * Math.sin(f * 3);
    ctx.fillStyle = 'rgba(255,214,74,' + glow.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(cx + carW / 2, cy + carH / 2, carW * 0.9, 0, 7); ctx.fill();
  }

  /* ── active game mode ── */
  function drawGameMode(ctx, f) {
    var gs = gameState;
    gs.time += 1/60;
    gs.road += gs.speed * u * 0.5;

    /* move car */
    if (keys[39]) gs.carX = Math.min(W - u * 10, gs.carX + u * 0.5);
    if (keys[37]) gs.carX = Math.max(u * 2, gs.carX - u * 0.5);
    if (!gs.grounded) {
      gs.vy += u * 0.11;
      gs.carY += gs.vy;
      if (gs.carY >= roadY - u * 4) { gs.carY = roadY - u * 4; gs.vy = 0; gs.grounded = true; }
    }

    /* spawn coins */
    gs.spawnT += gs.speed * 0.018;
    if (gs.spawnT > 1) {
      gs.spawnT = 0;
      gs.coins.push({ x: W + 10, y: roadY - u * 4 - Math.random() * u * 12, alive: true });
    }

    /* update & draw coins */
    for (var i = gs.coins.length - 1; i >= 0; i--) {
      var c = gs.coins[i];
      c.x -= gs.speed * u * 0.5;
      if (c.x < -u * 4) { gs.coins.splice(i, 1); continue; }
      if (c.alive && Math.abs(c.x - gs.carX) < u * 5 && Math.abs(c.y - gs.carY) < u * 5) {
        c.alive = false;
        gs.score++;
        SND.coin();
        gs.speed = Math.min(5, 1.8 + gs.score * 0.12);
      }
      if (c.alive) {
        ctx.fillStyle = '#ffd64a';
        ctx.shadowColor = '#ffd64a'; ctx.shadowBlur = 8;
        ctx.fillRect(c.x, c.y, u * 2, u * 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1d1410';
        ctx.font = (u * 1.1) + "px 'Press Start 2P',monospace";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x + u, c.y + u);
      }
    }

    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(gs.carX + u * 3.5, roadY + u * 0.5, u * 4, u * 0.8, 0, 0, 7); ctx.fill();

    /* car */
    drawPixelCar(ctx, gs.carX, gs.carY, u, false);

    /* HUD overlay */
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(W - u * 22, u * 2, u * 20, u * 4);
    ctx.fillStyle = '#ffd64a';
    ctx.font = (u * 1.6) + "px 'Press Start 2P',monospace";
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('COINS ' + gs.score, W - u * 4, u * 3);

    /* auto-end at 30 seconds */
    if (gs.time > 30) endGame();
  }

  /* ── start ── */
  requestAnimationFrame(frame);

  /* Update the hero hint text */
  var poke = document.querySelector('.hero-poke');
  if (poke) poke.textContent = 'click the car to play';
}

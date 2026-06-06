/**
 * Hero section — pixel sky, clouds, birds, road, drivable pixel car.
 * Click car / PRESS START to launch 30s coin game.
 * Touch controls: tap left/right halves to steer, tap top half to jump.
 * Keyboard: arrow keys + ESC.
 */
import { SND }          from './sound.js';
import { GAME, toast }  from './state.js';

var CLOUD_L = ['...XXXX.....','..XXXXXXXX...','.XXXXXXXXXXX.','XXXXXXXXXXXX.','.XXXXXXXXXX..'];
var CLOUD_S = ['..XXX..','..XXXX.','.XXXXXX','XXXXXXX','.XXXXX.'];

export function initHero() {
  var cv = document.getElementById('heroCanvas');
  if (!cv) return;

  var W = 0, H = 0, u = 4, roadY = 0;
  var clouds = [], spark = [], birds = [];
  var car = null;
  var playing = false, keys = {}, gameState = null;
  var touchL = false, touchR = false;

  /* ── sizing ── */
  function applySize(cw, ch) {
    if (cw < 1 || ch < 1) return;
    cw = Math.round(cw); ch = Math.round(ch);
    if (cw === W && ch === H && car) return;
    W = cw; H = ch;
    u = Math.max(3, Math.min(6, Math.round(W / 240)));
    roadY = H * 0.82;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    buildWorld();
  }
  function readSize() { var r = cv.getBoundingClientRect(); applySize(r.width, r.height); }
  readSize();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function(e) { var c = e[0].contentRect; applySize(c.width, c.height); }).observe(cv);
  } else { window.addEventListener('resize', readSize); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(readSize);

  /* ── world ── */
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
    if (!car) car = { x: W * 0.28 };
    else car.x = Math.max(u * 10, Math.min(W - u * 14, car.x));
  }

  /* ── pixel car drawing ── */
  function drawCar(c, cx, cy, s) {
    var luxury = !!(window._btdtDev);
    var bodyDark = luxury ? '#1a1a1a' : '#c44e2e';
    var bodyMain = luxury ? '#2a2a2a' : '#e0603a';
    var stripe   = luxury ? 'rgba(255,214,74,0.35)' : 'rgba(242,237,225,0.25)';
    var sideLine = luxury ? '#ffd64a' : '#bb4a2a';
    var rimCol   = luxury ? '#ffd64a' : '#bbb';

    c.fillStyle = 'rgba(0,0,0,0.08)';
    c.fillRect(cx + s * 0.5, cy + s * 3.2, s * 9, s * 0.6);
    c.fillStyle = bodyDark; c.fillRect(cx, cy + s * 1.2, s * 10, s * 2);
    c.fillStyle = bodyMain;
    c.fillRect(cx + s * 0.5, cy + s * 0.4, s * 9, s * 1);
    c.fillRect(cx + s * 2, cy - s * 0.6, s * 5.5, s * 1.2);
    c.fillStyle = luxury ? '#4a90b8' : '#7cc6ee';
    c.fillRect(cx + s * 2.5, cy - s * 0.3, s * 1.8, s * 0.9);
    c.fillRect(cx + s * 5.5, cy - s * 0.3, s * 1.6, s * 0.9);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(cx + s * 2.6, cy - s * 0.2, s * 0.5, s * 0.5);
    c.fillStyle = '#ffd64a';
    c.fillRect(cx + s * 9.5, cy + s * 1.4, s * 0.7, s * 0.7);
    c.fillStyle = luxury ? 'rgba(255,214,74,0.2)' : 'rgba(255,214,74,0.12)';
    c.beginPath(); c.arc(cx + s * 10.2, cy + s * 1.8, s * 2, 0, 7); c.fill();
    c.fillStyle = '#ff3333'; c.fillRect(cx - s * 0.2, cy + s * 1.4, s * 0.5, s * 0.7);
    c.fillStyle = stripe; c.fillRect(cx + s * 1, cy + s * 1.9, s * 8, s * 0.3);
    c.fillStyle = sideLine; c.fillRect(cx + s * 0.3, cy + s * 2.6, s * 9.4, s * 0.25);
    c.fillStyle = '#1a1714';
    c.fillRect(cx + s * 1, cy + s * 2.8, s * 2.2, s * 0.8);
    c.fillRect(cx + s * 6.8, cy + s * 2.8, s * 2.2, s * 0.8);
    c.beginPath(); c.arc(cx + s * 2.1, cy + s * 3.5, s * 1, 0, 7); c.fill();
    c.beginPath(); c.arc(cx + s * 7.9, cy + s * 3.5, s * 1, 0, 7); c.fill();
    c.fillStyle = rimCol;
    c.beginPath(); c.arc(cx + s * 2.1, cy + s * 3.5, s * 0.45, 0, 7); c.fill();
    c.beginPath(); c.arc(cx + s * 7.9, cy + s * 3.5, s * 0.45, 0, 7); c.fill();
    c.fillStyle = luxury ? '#b8960a' : '#666';
    c.beginPath(); c.arc(cx + s * 2.1, cy + s * 3.5, s * 0.18, 0, 7); c.fill();
    c.beginPath(); c.arc(cx + s * 7.9, cy + s * 3.5, s * 0.18, 0, 7); c.fill();
    c.fillStyle = luxury ? 'rgba(255,214,74,0.1)' : 'rgba(255,255,255,0.12)';
    c.fillRect(cx + s * 2.5, cy - s * 0.5, s * 4.5, s * 0.25);
    if (luxury) {
      c.fillStyle = 'rgba(255,214,74,0.06)';
      c.beginPath(); c.ellipse(cx + s * 5, cy + s * 4, s * 5.5, s * 1, 0, 0, 7); c.fill();
    }
  }

  function drawCloud(c, mat, ox, oy, un) {
    for (var r = 0; r < mat.length; r++)
      for (var i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        c.fillStyle = '#fff';
        c.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  /* ── click / tap to start ── */
  cv.addEventListener('click', function(e) {
    if (!car || playing) return;
    var r = cv.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;
    var carCx = car.x + u * 5, carCy = roadY - u * 2;
    if (Math.abs(cx - carCx) < u * 12 && Math.abs(cy - carCy) < u * 8) startGame();
  });

  var pressBtn = document.querySelector('.press-start');
  if (pressBtn) pressBtn.addEventListener('click', function(e) { e.preventDefault(); startGame(); });

  /* ── keyboard controls ── */
  document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;
    if (playing && e.keyCode === 27) { endGame(); e.preventDefault(); }
    if (playing && e.keyCode >= 37 && e.keyCode <= 40) e.preventDefault();
    if (playing && e.keyCode === 38 && gameState && gameState.grounded) {
      gameState.vy = -u * 1.7; gameState.grounded = false; SND.blip();
    }
  });
  document.addEventListener('keyup', function(e) { keys[e.keyCode] = false; });

  /* ── touch controls for mobile gameplay ──
     Canvas is split into zones:
     - Left third: steer left
     - Right third: steer right
     - Top half of middle: jump
     Touching outside the car area during idle starts the game. */
  cv.addEventListener('touchstart', function(e) {
    if (!playing || !gameState) return;
    e.preventDefault();
    var r = cv.getBoundingClientRect();
    for (var i = 0; i < e.touches.length; i++) {
      var tx = e.touches[i].clientX - r.left;
      var ty = e.touches[i].clientY - r.top;
      if (tx < W * 0.33) touchL = true;
      else if (tx > W * 0.67) touchR = true;
      else if (ty < H * 0.5 && gameState.grounded) {
        gameState.vy = -u * 1.7; gameState.grounded = false; SND.blip();
      }
    }
  }, { passive: false });

  cv.addEventListener('touchend', function(e) {
    if (!playing) return;
    touchL = false; touchR = false;
    /* re-check remaining touches */
    var r = cv.getBoundingClientRect();
    for (var i = 0; i < e.touches.length; i++) {
      var tx = e.touches[i].clientX - r.left;
      if (tx < W * 0.33) touchL = true;
      else if (tx > W * 0.67) touchR = true;
    }
  }, { passive: true });

  cv.addEventListener('touchcancel', function() { touchL = false; touchR = false; }, { passive: true });

  /* ── game lifecycle ── */
  function isMobile() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

  function startGame() {
    if (playing) return;
    playing = true;
    gameState = { carX: car.x, carY: roadY - u * 4, vy: 0, grounded: true,
      coins: [], score: 0, speed: 1.8, road: 0, spawnT: 0, time: 0 };
    SND.blip();
    var mobile = isMobile();
    toast(mobile ? 'DRIVE \u2014 tap sides to steer \u00b7 tap middle to jump' : 'DRIVE \u2014 arrows to move \u00b7 collect $');
    var poke = document.querySelector('.hero-poke');
    if (poke) poke.textContent = mobile ? 'tap left / right to steer \u00b7 center to jump' : 'esc to exit \u00b7 arrows to drive';
  }

  function endGame() {
    if (!gameState) return;
    var sc = gameState.score, cash = sc * 30;
    touchL = false; touchR = false;
    if (sc > 0) {
      GAME.addCash(cash);
      toast('RACE OVER \u2014 ' + sc + ' coins = $' + cash);
      if (sc >= 10) { toast('ACHIEVEMENT \u2014 PIXEL RACER LEGEND'); SND.win(); }
      else SND.good();
    }
    car.x = gameState.carX; playing = false; gameState = null;
    var poke = document.querySelector('.hero-poke');
    if (poke) poke.textContent = isMobile() ? 'tap the car to play' : 'click the car to play';
  }

  /* ══════════ ANIMATION LOOP ══════════ */
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

      /* sky */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#4aa8e3'); g.addColorStop(0.5, '#7cc6ee');
      g.addColorStop(0.75, '#a5daf5'); g.addColorStop(1, '#c8ecfb');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      /* sun */
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

      /* sparkles */
      for (var si = 0; si < spark.length; si++) {
        var sp = spark[si];
        var tw = 0.25 + 0.6 * Math.abs(Math.sin(f * 2.5 + sp.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
        ctx.fillRect(sp.x, sp.y, u * 0.6, u * 0.6);
        ctx.fillRect(sp.x + u * 0.7, sp.y + u * 0.15, u * 0.35, u * 0.35);
        ctx.fillRect(sp.x + u * 0.15, sp.y + u * 0.7, u * 0.35, u * 0.35);
      }

      /* clouds */
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci];
        cl.x -= cl.sp;
        if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
        ctx.globalAlpha = cl.a;
        drawCloud(ctx, cl.shape, cl.x, cl.y, cl.sc);
      }
      ctx.globalAlpha = 1;

      /* birds */
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

      /* road */
      var ry = roadY;
      ctx.fillStyle = '#5a9e3c'; ctx.fillRect(0, ry - u * 1.5, W, u * 1.5);
      ctx.fillStyle = '#6db24a';
      for (var vi = 0; vi < W; vi += u * 2) ctx.fillRect(vi, ry - u * 1.5, u, u * 0.6);
      ctx.fillStyle = '#3a3a38'; ctx.fillRect(0, ry, W, H - ry);
      var roadOff = playing && gameState ? gameState.road : (f * 30) % (u * 8);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      var laneY = ry + (H - ry) * 0.45;
      for (var ri = -roadOff % (u * 8); ri < W; ri += u * 8) ctx.fillRect(ri, laneY, u * 4, u * 0.4);
      ctx.fillStyle = '#ffd64a'; ctx.fillRect(0, ry, W, u * 0.35);
      ctx.fillStyle = '#2e2e2c'; ctx.fillRect(0, H - u * 1.5, W, u * 1.5);

      /* car */
      if (playing && gameState) drawGameMode(ctx, f);
      else drawIdleCar(ctx, f);

    } catch (e) { /* silent — loop continues */ }
  }

  function drawIdleCar(ctx, f) {
    var bob = Math.sin(f * 2.5) * u * 0.25;
    var cx = car.x, cy = roadY - u * 3.8 + bob;
    for (var i = 0; i < 3; i++) {
      var age = (f * 2 + i * 0.7) % 2;
      if (age < 1.2) {
        ctx.globalAlpha = 0.15 * (1 - age / 1.2);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(cx - age * u * 2 - i * u * 0.5, cy + u * 3 - age * u, u * 0.6, u * 0.6);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(cx + u * 5, roadY + u * 0.4, u * 6, u * 0.7, 0, 0, 7); ctx.fill();
    drawCar(ctx, cx, cy, u);
    var glow = 0.05 + 0.03 * Math.sin(f * 3);
    ctx.fillStyle = 'rgba(255,214,74,' + glow.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(cx + u * 5, cy + u * 2, u * 7, 0, 7); ctx.fill();
  }

  function drawGameMode(ctx, f) {
    var gs = gameState;
    gs.time += 1 / 60;
    gs.road += gs.speed * u * 0.5;

    /* input: keyboard OR touch */
    if (keys[39] || touchR) gs.carX = Math.min(W - u * 12, gs.carX + u * 0.5);
    if (keys[37] || touchL) gs.carX = Math.max(u * 2, gs.carX - u * 0.5);
    if (!gs.grounded) {
      gs.vy += u * 0.11; gs.carY += gs.vy;
      if (gs.carY >= roadY - u * 4) { gs.carY = roadY - u * 4; gs.vy = 0; gs.grounded = true; }
    }

    gs.spawnT += gs.speed * 0.018;
    if (gs.spawnT > 1) {
      gs.spawnT = 0;
      gs.coins.push({ x: W + 10, y: roadY - u * 4 - Math.random() * u * 12, alive: true });
    }

    for (var i = gs.coins.length - 1; i >= 0; i--) {
      var co = gs.coins[i];
      co.x -= gs.speed * u * 0.5;
      if (co.x < -u * 4) { gs.coins.splice(i, 1); continue; }
      if (co.alive && Math.abs(co.x - gs.carX) < u * 6 && Math.abs(co.y - gs.carY) < u * 5) {
        co.alive = false; gs.score++; SND.coin();
        gs.speed = Math.min(5, 1.8 + gs.score * 0.12);
      }
      if (co.alive) {
        ctx.fillStyle = '#ffd64a';
        ctx.shadowColor = '#ffd64a'; ctx.shadowBlur = 8;
        ctx.fillRect(co.x, co.y, u * 2, u * 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1d1410';
        ctx.font = (u * 1.1) + "px 'Press Start 2P',monospace";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', co.x + u, co.y + u);
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(gs.carX + u * 5, roadY + u * 0.4, u * 6, u * 0.7, 0, 0, 7); ctx.fill();
    drawCar(ctx, gs.carX, gs.carY, u);

    /* HUD */
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W - u * 24, u * 2, u * 22, u * 4.5);
    ctx.strokeStyle = 'rgba(255,214,74,0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(W - u * 24, u * 2, u * 22, u * 4.5);
    ctx.fillStyle = '#ffd64a';
    ctx.font = (u * 1.5) + "px 'Press Start 2P',monospace";
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('COINS ' + gs.score, W - u * 4, u * 3);
    var timeLeft = Math.max(0, Math.ceil(30 - gs.time));
    ctx.fillStyle = timeLeft <= 5 ? '#e0603a' : '#f2ede1';
    ctx.font = (u * 1) + "px 'Press Start 2P',monospace";
    ctx.fillText(timeLeft + 's', W - u * 4, u * 5);

    /* touch zone indicators (mobile only, subtle) */
    if (isMobile()) {
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, roadY, W * 0.33, H - roadY);
      ctx.fillRect(W * 0.67, roadY, W * 0.33, H - roadY);
      ctx.globalAlpha = 1;
    }

    if (gs.time > 30) endGame();
  }

  requestAnimationFrame(frame);
  var poke = document.querySelector('.hero-poke');
  if (poke) poke.textContent = isMobile() ? 'tap the car to play' : 'click the car to play';
}

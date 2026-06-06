/**
 * Hero — pixel cityscape world with a physics-driven car.
 * Inspired by arcade racers: momentum, dust trails, wheel spin.
 * Click car / PRESS START → 30s coin game.
 * Touch: tap left/right to steer, center to jump.
 */
import { SND }          from './sound.js';
import { GAME, toast }  from './state.js';

var CL = ['...XXXX.....','..XXXXXXXX...','.XXXXXXXXXXX.','XXXXXXXXXXXX.','.XXXXXXXXXX..'];
var CS = ['..XXX..','..XXXX.','.XXXXXX','XXXXXXX','.XXXXX.'];

export function initHero() {
  var cv = document.getElementById('heroCanvas');
  if (!cv) return;

  var W = 0, H = 0, u = 4, roadY = 0, hillY = 0;
  var clouds = [], spark = [], birds = [], buildings = [], dust = [];
  var car = null, playing = false, keys = {}, gameState = null;
  var touchL = false, touchR = false;

  /* ── sizing ── */
  function applySize(cw, ch) {
    if (cw < 1 || ch < 1) return;
    cw = Math.round(cw); ch = Math.round(ch);
    if (cw === W && ch === H && car) return;
    W = cw; H = ch;
    u = Math.max(3, Math.min(7, Math.round(W / 200)));
    roadY = H * 0.78; hillY = H * 0.62;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    buildWorld();
  }
  function readSize() { var r = cv.getBoundingClientRect(); applySize(r.width, r.height); }
  readSize();
  if (typeof ResizeObserver !== 'undefined')
    new ResizeObserver(function(e) { var c = e[0].contentRect; applySize(c.width, c.height); }).observe(cv);
  else window.addEventListener('resize', readSize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(readSize);

  /* ── world ── */
  function buildWorld() {
    clouds = [];
    for (var i = 0; i < (W < 700 ? 4 : 8); i++) {
      var ly = Math.random();
      clouds.push({ x: Math.random() * W, y: 12 + Math.random() * (hillY * 0.5),
        sp: 0.06 + ly * 0.25, sc: (1.6 + ly * 2.2) * (u / 4),
        a: 0.5 + ly * 0.4, shape: Math.random() > 0.45 ? CL : CS });
    }
    spark = [];
    for (var i = 0; i < 14; i++) spark.push({ x: Math.random() * W, y: Math.random() * hillY * 0.6, ph: Math.random() * 6.28 });
    birds = []; dust = [];
    buildings = []; var bx = 0;
    while (bx < W + u * 10) {
      var bw2 = u * (3 + Math.random() * 5), bh2 = u * (4 + Math.random() * 10);
      buildings.push({ x: bx, w: bw2, h: bh2, hasWin: Math.random() > 0.35 });
      bx += bw2 + u * (1 + Math.random() * 3);
    }
    if (!car) car = { x: W * 0.3, vx: 0, wheelAng: 0 };
    else car.x = Math.max(u * 8, Math.min(W - u * 14, car.x));
  }

  /* ── draw helpers ── */
  function drawCloud(c, mat, ox, oy, un) {
    for (var r = 0; r < mat.length; r++)
      for (var i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        c.fillStyle = '#fff';
        c.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  /** Draw the car at (cx, cy) with scale s. Wheel rotation via ang. */
  function drawCar(c, cx, cy, s, ang) {
    var lux = !!(window._btdtDev);
    var bd = lux ? '#1a1a1a' : '#c44e2e', bm = lux ? '#2a2a2a' : '#e0603a';
    var strp = lux ? 'rgba(255,214,74,0.35)' : 'rgba(242,237,225,0.25)';
    var sln = lux ? '#ffd64a' : '#bb4a2a', rim = lux ? '#ffd64a' : '#bbb';

    /* undercarriage */
    c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(cx + s * 0.5, cy + s * 3.2, s * 9, s * 0.5);
    /* body */
    c.fillStyle = bd; c.fillRect(cx, cy + s * 1.2, s * 10, s * 2);
    c.fillStyle = bm;
    c.fillRect(cx + s * 0.5, cy + s * 0.4, s * 9, s * 1);
    c.fillRect(cx + s * 2, cy - s * 0.6, s * 5.5, s * 1.2);
    /* windows */
    c.fillStyle = lux ? '#4a90b8' : '#7cc6ee';
    c.fillRect(cx + s * 2.5, cy - s * 0.3, s * 1.8, s * 0.9);
    c.fillRect(cx + s * 5.5, cy - s * 0.3, s * 1.6, s * 0.9);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(cx + s * 2.6, cy - s * 0.15, s * 0.4, s * 0.4);
    /* lights */
    c.fillStyle = '#ffd64a'; c.fillRect(cx + s * 9.5, cy + s * 1.4, s * 0.7, s * 0.7);
    c.fillStyle = lux ? 'rgba(255,214,74,0.18)' : 'rgba(255,214,74,0.1)';
    c.beginPath(); c.arc(cx + s * 10.2, cy + s * 1.8, s * 1.8, 0, 7); c.fill();
    c.fillStyle = '#ff3333'; c.fillRect(cx - s * 0.2, cy + s * 1.4, s * 0.5, s * 0.6);
    /* stripe + detail */
    c.fillStyle = strp; c.fillRect(cx + s * 1, cy + s * 1.9, s * 8, s * 0.3);
    c.fillStyle = sln; c.fillRect(cx + s * 0.3, cy + s * 2.6, s * 9.4, s * 0.2);
    /* wheel wells */
    c.fillStyle = '#1a1714';
    c.fillRect(cx + s * 1, cy + s * 2.8, s * 2.2, s * 0.7);
    c.fillRect(cx + s * 6.8, cy + s * 2.8, s * 2.2, s * 0.7);
    /* tires — with rotation marks */
    var wx1 = cx + s * 2.1, wx2 = cx + s * 7.9, wy = cy + s * 3.4, wr = s * 0.95;
    c.fillStyle = '#1a1714';
    c.beginPath(); c.arc(wx1, wy, wr, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, wr, 0, 7); c.fill();
    /* rims */
    c.fillStyle = rim;
    c.beginPath(); c.arc(wx1, wy, s * 0.42, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, s * 0.42, 0, 7); c.fill();
    /* rim spoke marks (rotate with ang) */
    c.fillStyle = lux ? '#b8960a' : '#888';
    var sa = ang || 0;
    for (var si = 0; si < 3; si++) {
      var a = sa + si * 2.09;
      var dx = Math.cos(a) * s * 0.28, dy = Math.sin(a) * s * 0.28;
      c.fillRect(wx1 + dx - s * 0.06, wy + dy - s * 0.06, s * 0.12, s * 0.12);
      c.fillRect(wx2 + dx - s * 0.06, wy + dy - s * 0.06, s * 0.12, s * 0.12);
    }
    /* roof highlight */
    c.fillStyle = lux ? 'rgba(255,214,74,0.08)' : 'rgba(255,255,255,0.1)';
    c.fillRect(cx + s * 2.5, cy - s * 0.5, s * 4.5, s * 0.2);
    if (lux) { c.fillStyle = 'rgba(255,214,74,0.05)'; c.beginPath(); c.ellipse(cx + s * 5, cy + s * 3.8, s * 5, s * 0.8, 0, 0, 7); c.fill(); }
  }

  /** Spawn dust particles behind the car */
  function spawnDust(cx, cy, speed) {
    var n = Math.min(3, Math.ceil(speed * 0.8));
    for (var i = 0; i < n; i++) {
      dust.push({
        x: cx + Math.random() * u * 2, y: cy + u * 2.5 + Math.random() * u,
        vx: -speed * u * 0.15 - Math.random() * u * 0.3,
        vy: -Math.random() * u * 0.4 - u * 0.1,
        life: 20 + Math.random() * 15, size: u * (0.3 + Math.random() * 0.4)
      });
    }
  }

  /* ── interactions ── */
  cv.addEventListener('click', function(e) {
    if (!car || playing) return;
    var r = cv.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;
    if (Math.abs(cx - (car.x + u * 5)) < u * 14 && Math.abs(cy - (roadY - u * 2)) < u * 10) startGame();
  });
  var pressBtn = document.querySelector('.press-start');
  if (pressBtn) pressBtn.addEventListener('click', function(e) { e.preventDefault(); startGame(); });

  document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;
    if (playing && e.keyCode === 27) { endGame(); e.preventDefault(); }
    if (playing && e.keyCode >= 37 && e.keyCode <= 40) e.preventDefault();
    if (playing && e.keyCode === 38 && gameState && gameState.grounded) {
      gameState.vy = -u * 1.6; gameState.grounded = false; SND.blip();
    }
  });
  document.addEventListener('keyup', function(e) { keys[e.keyCode] = false; });

  cv.addEventListener('touchstart', function(e) {
    if (!playing || !gameState) return; e.preventDefault();
    var r = cv.getBoundingClientRect();
    for (var i = 0; i < e.touches.length; i++) {
      var tx = e.touches[i].clientX - r.left, ty = e.touches[i].clientY - r.top;
      if (tx < W * 0.33) touchL = true;
      else if (tx > W * 0.67) touchR = true;
      else if (ty < H * 0.6 && gameState.grounded) { gameState.vy = -u * 1.6; gameState.grounded = false; SND.blip(); }
    }
  }, { passive: false });
  cv.addEventListener('touchend', function(e) {
    if (!playing) return; touchL = false; touchR = false;
    var r = cv.getBoundingClientRect();
    for (var i = 0; i < e.touches.length; i++) {
      var tx = e.touches[i].clientX - r.left;
      if (tx < W * 0.33) touchL = true; else if (tx > W * 0.67) touchR = true;
    }
  }, { passive: true });
  cv.addEventListener('touchcancel', function() { touchL = false; touchR = false; }, { passive: true });

  function isMobile() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

  function startGame() {
    if (playing) return; playing = true;
    gameState = { carX: car.x, carY: roadY - u * 4, vx: 0, vy: 0, grounded: true,
      coins: [], score: 0, speed: 1.8, road: 0, spawnT: 0, time: 0, wheelAng: 0 };
    dust = []; SND.blip();
    var m = isMobile();
    toast(m ? 'DRIVE \u2014 tap sides to steer' : 'DRIVE \u2014 arrows to move');
    var p = document.querySelector('.hero-poke');
    if (p) p.textContent = m ? 'tap left / right \u00b7 center to jump' : 'esc to exit \u00b7 arrows to drive';
  }

  function endGame() {
    if (!gameState) return;
    var sc = gameState.score, cash = sc * 30;
    touchL = false; touchR = false;
    if (sc > 0) { GAME.addCash(cash); toast('RACE OVER \u2014 ' + sc + ' coins = $' + cash);
      if (sc >= 10) { toast('ACHIEVEMENT \u2014 PIXEL RACER LEGEND'); SND.win(); } else SND.good(); }
    car.x = gameState.carX; car.vx = 0; playing = false; gameState = null;
    var p = document.querySelector('.hero-poke');
    if (p) p.textContent = isMobile() ? 'tap the car to play' : 'click the car to play';
  }

  /* ═══ RENDER ═══ */
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
      g.addColorStop(0, '#4aa8e3'); g.addColorStop(0.45, '#7cc6ee');
      g.addColorStop(0.7, '#a5daf5'); g.addColorStop(1, '#c8ecfb');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      /* sun */
      var sx = W - u * 16, sy = u * 10, sr = u * 6;
      var pulse = 1 + Math.sin(f * 1.5) * 0.12;
      ctx.fillStyle = 'rgba(255,224,110,0.12)';
      ctx.beginPath(); ctx.arc(sx, sy, sr + u * 4 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,224,110,0.22)';
      ctx.beginPath(); ctx.arc(sx, sy, sr + u * 2 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd64a';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe98c';
      ctx.beginPath(); ctx.arc(sx - u * 0.8, sy - u * 0.8, sr * 0.45, 0, 7); ctx.fill();

      /* sparkles */
      for (var si = 0; si < spark.length; si++) {
        var sp = spark[si];
        ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + 0.5 * Math.abs(Math.sin(f * 2.5 + sp.ph))).toFixed(2) + ')';
        ctx.fillRect(sp.x, sp.y, u * 0.5, u * 0.5);
      }

      /* clouds */
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci]; cl.x -= cl.sp;
        if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
        ctx.globalAlpha = cl.a; drawCloud(ctx, cl.shape, cl.x, cl.y, cl.sc);
      }
      ctx.globalAlpha = 1;

      /* hills */
      ctx.fillStyle = '#6aad48';
      ctx.beginPath(); ctx.moveTo(0, hillY + u * 3);
      for (var hi = 0; hi <= W; hi += u * 8) ctx.lineTo(hi, hillY + Math.sin(hi * 0.008 + 1) * u * 3);
      ctx.lineTo(W, roadY); ctx.lineTo(0, roadY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a9e3c';
      ctx.beginPath(); ctx.moveTo(0, hillY + u * 5);
      for (var h2 = 0; h2 <= W; h2 += u * 6) ctx.lineTo(h2, hillY + u * 4 + Math.sin(h2 * 0.012 + 3) * u * 2);
      ctx.lineTo(W, roadY); ctx.lineTo(0, roadY); ctx.closePath(); ctx.fill();

      /* buildings */
      ctx.fillStyle = '#3a3835';
      for (var bi = 0; bi < buildings.length; bi++) {
        var bd = buildings[bi], by = roadY - bd.h;
        ctx.fillRect(bd.x, by, bd.w, bd.h);
        if (bd.hasWin) {
          var winOn = Math.sin(f * 0.5 + bi * 1.7) > 0;
          ctx.fillStyle = winOn ? 'rgba(255,214,74,0.5)' : 'rgba(255,214,74,0.1)';
          for (var wy = by + u * 1.5; wy < roadY - u * 2; wy += u * 2.5)
            for (var wx = bd.x + u * 0.8; wx < bd.x + bd.w - u * 0.5; wx += u * 1.8)
              ctx.fillRect(wx, wy, u * 0.7, u * 0.7);
          ctx.fillStyle = '#3a3835';
        }
      }
      ctx.fillStyle = '#444';
      for (var b2 = 0; b2 < buildings.length; b2++) ctx.fillRect(buildings[b2].x, roadY - buildings[b2].h, buildings[b2].w, u * 0.3);

      /* birds */
      for (var bdi = birds.length - 1; bdi >= 0; bdi--) {
        var brd = birds[bdi]; brd.x += brd.vx; brd.py += Math.sin(f * 3 + brd.ph) * 0.12;
        var wing = Math.sin(f * 8 + brd.ph) * u * 0.7;
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(brd.x - u * 0.7, brd.py - wing, u * 0.4, u * 0.4);
        ctx.fillRect(brd.x, brd.py, u * 0.4, u * 0.4);
        ctx.fillRect(brd.x + u * 0.7, brd.py - wing, u * 0.4, u * 0.4);
        if (brd.x < -30 || brd.x > W + 30) birds.splice(bdi, 1);
      }
      if (birds.length < 3 && Math.random() < 0.003) {
        var bL = Math.random() > 0.5;
        birds.push({ x: bL ? -20 : W + 20, py: 15 + Math.random() * hillY * 0.5,
          vx: bL ? 0.3 + Math.random() * 0.4 : -(0.3 + Math.random() * 0.4), ph: Math.random() * 6.28 });
      }

      /* road */
      var ry = roadY;
      ctx.fillStyle = '#3a3a38'; ctx.fillRect(0, ry, W, H - ry);
      var roadOff = playing && gameState ? gameState.road : (f * 25) % (u * 8);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      var lnY = ry + (H - ry) * 0.42;
      for (var ri = -roadOff % (u * 8); ri < W; ri += u * 8) ctx.fillRect(ri, lnY, u * 4, u * 0.35);
      ctx.fillStyle = '#ffd64a'; ctx.fillRect(0, ry, W, u * 0.3);
      ctx.fillStyle = '#2e2e2c'; ctx.fillRect(0, H - u * 1.2, W, u * 1.2);

      /* dust particles (drawn on road, behind car) */
      for (var di = dust.length - 1; di >= 0; di--) {
        var d = dust[di]; d.x += d.vx; d.y += d.vy; d.vy += u * 0.02; d.life--;
        ctx.globalAlpha = Math.max(0, d.life / 30) * 0.35;
        ctx.fillStyle = '#8a8580';
        ctx.fillRect(d.x, d.y, d.size, d.size);
        if (d.life <= 0) dust.splice(di, 1);
      }
      ctx.globalAlpha = 1;

      /* car */
      if (playing && gameState) drawGameMode(ctx, f);
      else drawIdleCar(ctx, f);

    } catch (e) { /* silent */ }
  }

  function drawIdleCar(ctx, f) {
    /* idle car: gentle bob + slow wheel rotation + exhaust */
    var bob = Math.sin(f * 2.5) * u * 0.2;
    var cx = car.x, cy = roadY - u * 3.6 + bob;
    car.wheelAng = (car.wheelAng || 0) + 0.02; /* slow idle rotation */

    /* exhaust puffs */
    for (var i = 0; i < 3; i++) {
      var age = (f * 1.5 + i * 0.8) % 2.5;
      if (age < 1.5) {
        ctx.globalAlpha = 0.08 * (1 - age / 1.5);
        ctx.fillStyle = '#aaa';
        ctx.beginPath(); ctx.arc(cx - age * u * 1.2 - i * u * 0.3, cy + u * 2.5 - age * u * 0.6, u * (0.3 + age * 0.3), 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.ellipse(cx + u * 5, roadY + u * 0.3, u * 5.5, u * 0.6, 0, 0, 7); ctx.fill();

    drawCar(ctx, cx, cy, u, car.wheelAng);

    /* clickable glow */
    var glow = 0.035 + 0.02 * Math.sin(f * 3);
    ctx.fillStyle = 'rgba(255,214,74,' + glow.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(cx + u * 5, cy + u * 1.5, u * 6, 0, 7); ctx.fill();
  }

  function drawGameMode(ctx, f) {
    var gs = gameState;
    gs.time += 1 / 60; gs.road += gs.speed * u * 0.5;

    /* physics-based steering with momentum */
    var accel = u * 0.08;
    var friction = 0.92;
    if (keys[39] || touchR) gs.vx += accel;
    else if (keys[37] || touchL) gs.vx -= accel;
    gs.vx *= friction;
    gs.carX += gs.vx;
    gs.carX = Math.max(u * 2, Math.min(W - u * 12, gs.carX));

    if (!gs.grounded) { gs.vy += u * 0.1; gs.carY += gs.vy;
      if (gs.carY >= roadY - u * 4) { gs.carY = roadY - u * 4; gs.vy = 0; gs.grounded = true; SND.tick(); } }

    /* wheel spin based on road speed */
    gs.wheelAng += gs.speed * 0.12;

    /* dust from driving */
    if (gs.grounded && gs.speed > 1) spawnDust(gs.carX, gs.carY, gs.speed);

    /* coins */
    gs.spawnT += gs.speed * 0.018;
    if (gs.spawnT > 1) { gs.spawnT = 0;
      gs.coins.push({ x: W + 10, y: roadY - u * 4 - Math.random() * u * 10, alive: true }); }

    for (var i = gs.coins.length - 1; i >= 0; i--) {
      var co = gs.coins[i]; co.x -= gs.speed * u * 0.5;
      if (co.x < -u * 4) { gs.coins.splice(i, 1); continue; }
      if (co.alive && Math.abs(co.x - gs.carX) < u * 6 && Math.abs(co.y - gs.carY) < u * 5) {
        co.alive = false; gs.score++; SND.coin(); gs.speed = Math.min(5, 1.8 + gs.score * 0.12);
        /* coin burst */
        for (var p = 0; p < 6; p++) dust.push({ x: co.x + u, y: co.y + u, vx: (Math.random()-0.5)*u*0.8, vy: -Math.random()*u*0.6, life: 15, size: u * 0.3 });
      }
      if (co.alive) {
        ctx.fillStyle = '#ffd64a'; ctx.shadowColor = '#ffd64a'; ctx.shadowBlur = 6;
        ctx.fillRect(co.x, co.y, u * 1.8, u * 1.8); ctx.shadowBlur = 0;
        ctx.fillStyle = '#1d1410';
        ctx.font = Math.min(u * 1, 12) + "px 'Press Start 2P',monospace";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', co.x + u * 0.9, co.y + u * 0.9);
      }
    }

    /* shadow + car */
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.ellipse(gs.carX + u * 5, roadY + u * 0.3, u * 5.5, u * 0.6, 0, 0, 7); ctx.fill();
    drawCar(ctx, gs.carX, gs.carY, u, gs.wheelAng);

    /* HUD */
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    var hw = Math.min(u * 22, W * 0.4);
    ctx.fillRect(W - hw - u * 2, u * 2, hw, u * 4);
    ctx.fillStyle = '#ffd64a';
    ctx.font = Math.min(u * 1.4, 14) + "px 'Press Start 2P',monospace";
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('$ ' + gs.score, W - u * 3, u * 2.8);
    var tl = Math.max(0, Math.ceil(30 - gs.time));
    ctx.fillStyle = tl <= 5 ? '#e0603a' : '#f2ede1';
    ctx.font = Math.min(u * 0.9, 10) + "px 'Press Start 2P',monospace";
    ctx.fillText(tl + 's', W - u * 3, u * 4.6);

    if (isMobile()) {
      ctx.globalAlpha = 0.03; ctx.fillStyle = '#fff';
      ctx.fillRect(0, roadY, W * 0.33, H - roadY); ctx.fillRect(W * 0.67, roadY, W * 0.33, H - roadY);
      ctx.globalAlpha = 1;
    }
    if (gs.time > 30) endGame();
  }

  requestAnimationFrame(frame);
  var poke = document.querySelector('.hero-poke');
  if (poke) poke.textContent = isMobile() ? 'tap the car to play' : 'click the car to play';
}

/**
 * Hero — pixel tech-city skyline with a physics-driven car.
 * Dark cityscape silhouette, no green hills.
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

  var W = 0, H = 0, u = 4, roadY = 0, skylineY = 0;
  var clouds = [], spark = [], birds = [], towers = [], dust = [];
  var car = null, playing = false, keys = {}, gameState = null;
  var touchL = false, touchR = false;

  function applySize(cw, ch) {
    if (cw < 1 || ch < 1) return;
    cw = Math.round(cw); ch = Math.round(ch);
    if (cw === W && ch === H && car) return;
    W = cw; H = ch;
    u = Math.max(3, Math.min(7, Math.round(W / 200)));
    roadY = H * 0.80;
    skylineY = H * 0.50;
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

  function buildWorld() {
    clouds = [];
    for (var i = 0; i < (W < 700 ? 4 : 7); i++) {
      var ly = Math.random();
      clouds.push({ x: Math.random() * W, y: 10 + Math.random() * (skylineY * 0.6),
        sp: 0.05 + ly * 0.2, sc: (1.5 + ly * 2) * (u / 4),
        a: 0.45 + ly * 0.35, shape: Math.random() > 0.5 ? CL : CS });
    }
    spark = [];
    for (var i = 0; i < 12; i++) spark.push({ x: Math.random() * W, y: Math.random() * skylineY * 0.5, ph: Math.random() * 6.28 });
    birds = []; dust = [];

    /* city towers — two depth layers */
    towers = [];
    /* back layer (shorter, darker, further away) */
    var bx = 0;
    while (bx < W + u * 8) {
      var tw = u * (2 + Math.random() * 4);
      var th = u * (6 + Math.random() * 14);
      towers.push({ x: bx, w: tw, h: th, layer: 0, hasWin: Math.random() > 0.3,
        hasAntenna: Math.random() > 0.6, antennaH: u * (1 + Math.random() * 3) });
      bx += tw + u * (0.5 + Math.random() * 2);
    }
    /* front layer (taller, lighter, closer) */
    bx = u * 3;
    while (bx < W + u * 10) {
      var tw = u * (3 + Math.random() * 6);
      var th = u * (4 + Math.random() * 8);
      towers.push({ x: bx, w: tw, h: th, layer: 1, hasWin: Math.random() > 0.25,
        hasAntenna: Math.random() > 0.75, antennaH: u * (1 + Math.random() * 2) });
      bx += tw + u * (1 + Math.random() * 4);
    }

    if (!car) car = { x: W * 0.3, vx: 0, wheelAng: 0 };
    else car.x = Math.max(u * 8, Math.min(W - u * 14, car.x));
  }

  function drawCloud(c, mat, ox, oy, un) {
    for (var r = 0; r < mat.length; r++)
      for (var i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        c.fillStyle = '#fff';
        c.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  function drawCar(c, cx, cy, s, ang) {
    var lux = !!(window._btdtDev);
    var bd = lux ? '#1a1a1a' : '#c44e2e', bm = lux ? '#2a2a2a' : '#e0603a';
    var strp = lux ? 'rgba(255,214,74,0.35)' : 'rgba(242,237,225,0.25)';
    var sln = lux ? '#ffd64a' : '#bb4a2a', rim = lux ? '#ffd64a' : '#bbb';
    c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(cx + s * 0.5, cy + s * 3.2, s * 9, s * 0.5);
    c.fillStyle = bd; c.fillRect(cx, cy + s * 1.2, s * 10, s * 2);
    c.fillStyle = bm;
    c.fillRect(cx + s * 0.5, cy + s * 0.4, s * 9, s * 1);
    c.fillRect(cx + s * 2, cy - s * 0.6, s * 5.5, s * 1.2);
    c.fillStyle = lux ? '#4a90b8' : '#7cc6ee';
    c.fillRect(cx + s * 2.5, cy - s * 0.3, s * 1.8, s * 0.9);
    c.fillRect(cx + s * 5.5, cy - s * 0.3, s * 1.6, s * 0.9);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(cx + s * 2.6, cy - s * 0.15, s * 0.4, s * 0.4);
    c.fillStyle = '#ffd64a'; c.fillRect(cx + s * 9.5, cy + s * 1.4, s * 0.7, s * 0.7);
    c.fillStyle = lux ? 'rgba(255,214,74,0.18)' : 'rgba(255,214,74,0.1)';
    c.beginPath(); c.arc(cx + s * 10.2, cy + s * 1.8, s * 1.8, 0, 7); c.fill();
    c.fillStyle = '#ff3333'; c.fillRect(cx - s * 0.2, cy + s * 1.4, s * 0.5, s * 0.6);
    c.fillStyle = strp; c.fillRect(cx + s * 1, cy + s * 1.9, s * 8, s * 0.3);
    c.fillStyle = sln; c.fillRect(cx + s * 0.3, cy + s * 2.6, s * 9.4, s * 0.2);
    c.fillStyle = '#1a1714';
    c.fillRect(cx + s * 1, cy + s * 2.8, s * 2.2, s * 0.7);
    c.fillRect(cx + s * 6.8, cy + s * 2.8, s * 2.2, s * 0.7);
    var wx1 = cx + s * 2.1, wx2 = cx + s * 7.9, wy = cy + s * 3.4;
    c.beginPath(); c.arc(wx1, wy, s * 0.95, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, s * 0.95, 0, 7); c.fill();
    c.fillStyle = rim;
    c.beginPath(); c.arc(wx1, wy, s * 0.42, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, s * 0.42, 0, 7); c.fill();
    c.fillStyle = lux ? '#b8960a' : '#888';
    var sa = ang || 0;
    for (var si = 0; si < 3; si++) {
      var a = sa + si * 2.09;
      c.fillRect(wx1 + Math.cos(a) * s * 0.28 - s * 0.06, wy + Math.sin(a) * s * 0.28 - s * 0.06, s * 0.12, s * 0.12);
      c.fillRect(wx2 + Math.cos(a) * s * 0.28 - s * 0.06, wy + Math.sin(a) * s * 0.28 - s * 0.06, s * 0.12, s * 0.12);
    }
    c.fillStyle = lux ? 'rgba(255,214,74,0.08)' : 'rgba(255,255,255,0.1)';
    c.fillRect(cx + s * 2.5, cy - s * 0.5, s * 4.5, s * 0.2);
    if (lux) { c.fillStyle = 'rgba(255,214,74,0.05)'; c.beginPath(); c.ellipse(cx + s * 5, cy + s * 3.8, s * 5, s * 0.8, 0, 0, 7); c.fill(); }
  }

  function spawnDust(cx, cy, speed) {
    var n = Math.min(3, Math.ceil(speed * 0.8));
    for (var i = 0; i < n; i++)
      dust.push({ x: cx + Math.random() * u * 2, y: cy + u * 2.5 + Math.random() * u,
        vx: -speed * u * 0.15 - Math.random() * u * 0.3, vy: -Math.random() * u * 0.4 - u * 0.1,
        life: 20 + Math.random() * 15, size: u * (0.3 + Math.random() * 0.4) });
  }

  /* ── interactions ── */
  cv.addEventListener('click', function(e) {
    if (!car || playing) return;
    var r = cv.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
    if (Math.abs(cx - (car.x + u * 5)) < u * 14 && Math.abs(cy - (roadY - u * 2)) < u * 10) startGame();
  });
  var pressBtn = document.querySelector('.press-start');
  if (pressBtn) pressBtn.addEventListener('click', function(e) { e.preventDefault(); startGame(); });

  document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;
    if (playing && e.keyCode === 27) { endGame(); e.preventDefault(); }
    if (playing && e.keyCode >= 37 && e.keyCode <= 40) e.preventDefault();
    if (playing && e.keyCode === 38 && gameState && gameState.grounded) {
      gameState.vy = -u * 1.6; gameState.grounded = false; SND.blip(); }
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

      /* ── sky gradient (warm dusk tones, not bright blue) ── */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a2a4a');
      g.addColorStop(0.35, '#2a4a6e');
      g.addColorStop(0.65, '#4a7a9e');
      g.addColorStop(0.85, '#6aa0c0');
      g.addColorStop(1, '#88bbd8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      /* ── sun (lower, warmer) ── */
      var sx = W * 0.75, sy = skylineY - u * 4, sr = u * 8;
      var pulse = 1 + Math.sin(f * 1.5) * 0.1;
      ctx.fillStyle = 'rgba(255,200,100,0.06)';
      ctx.beginPath(); ctx.arc(sx, sy, sr + u * 8 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,210,120,0.12)';
      ctx.beginPath(); ctx.arc(sx, sy, sr + u * 3 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = '#f0c860';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
      ctx.fillStyle = '#f8dca0';
      ctx.beginPath(); ctx.arc(sx - u, sy - u, sr * 0.4, 0, 7); ctx.fill();

      /* ── stars (visible in dark sky) ── */
      for (var si = 0; si < spark.length; si++) {
        var sp = spark[si];
        ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.35 * Math.abs(Math.sin(f * 2 + sp.ph))).toFixed(2) + ')';
        ctx.fillRect(sp.x, sp.y, u * 0.35, u * 0.35);
      }

      /* ── clouds ── */
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci]; cl.x -= cl.sp;
        if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
        ctx.globalAlpha = cl.a * 0.6;
        drawCloud(ctx, cl.shape, cl.x, cl.y, cl.sc);
      }
      ctx.globalAlpha = 1;

      /* ── city skyline (back layer — dark, distant) ── */
      for (var ti = 0; ti < towers.length; ti++) {
        var t = towers[ti];
        if (t.layer !== 0) continue;
        var ty = roadY - t.h;
        ctx.fillStyle = '#1e2228';
        ctx.fillRect(t.x, ty, t.w, t.h);
        /* antenna */
        if (t.hasAntenna) {
          ctx.fillRect(t.x + t.w * 0.45, ty - t.antennaH, u * 0.3, t.antennaH);
          /* blinking light */
          ctx.fillStyle = Math.sin(f * 2 + ti) > 0.7 ? '#e0603a' : 'rgba(224,96,58,0.15)';
          ctx.fillRect(t.x + t.w * 0.4, ty - t.antennaH - u * 0.3, u * 0.4, u * 0.4);
          ctx.fillStyle = '#1e2228';
        }
        /* windows */
        if (t.hasWin) {
          for (var wy = ty + u * 1.2; wy < roadY - u * 1.5; wy += u * 2)
            for (var wx = t.x + u * 0.6; wx < t.x + t.w - u * 0.3; wx += u * 1.5) {
              var lit = Math.sin(f * 0.3 + ti * 1.3 + wx * 0.1 + wy * 0.05) > 0;
              ctx.fillStyle = lit ? 'rgba(200,220,255,0.4)' : 'rgba(200,220,255,0.06)';
              ctx.fillRect(wx, wy, u * 0.55, u * 0.6);
            }
        }
      }

      /* ── city skyline (front layer — slightly lighter) ── */
      for (var ti2 = 0; ti2 < towers.length; ti2++) {
        var t2 = towers[ti2];
        if (t2.layer !== 1) continue;
        var ty2 = roadY - t2.h;
        ctx.fillStyle = '#282e34';
        ctx.fillRect(t2.x, ty2, t2.w, t2.h);
        if (t2.hasAntenna) {
          ctx.fillRect(t2.x + t2.w * 0.45, ty2 - t2.antennaH, u * 0.3, t2.antennaH);
          ctx.fillStyle = Math.sin(f * 1.5 + ti2 * 2) > 0.8 ? '#34a96a' : 'rgba(52,169,106,0.12)';
          ctx.fillRect(t2.x + t2.w * 0.4, ty2 - t2.antennaH - u * 0.3, u * 0.4, u * 0.4);
          ctx.fillStyle = '#282e34';
        }
        if (t2.hasWin) {
          for (var wy2 = ty2 + u * 1; wy2 < roadY - u * 1; wy2 += u * 1.8)
            for (var wx2 = t2.x + u * 0.5; wx2 < t2.x + t2.w - u * 0.3; wx2 += u * 1.4) {
              var lit2 = Math.sin(f * 0.4 + ti2 * 1.7 + wx2 * 0.08) > 0;
              ctx.fillStyle = lit2 ? 'rgba(255,214,74,0.35)' : 'rgba(255,214,74,0.05)';
              ctx.fillRect(wx2, wy2, u * 0.5, u * 0.55);
            }
        }
      }

      /* ── birds ── */
      for (var bdi = birds.length - 1; bdi >= 0; bdi--) {
        var b = birds[bdi]; b.x += b.vx; b.py += Math.sin(f * 3 + b.ph) * 0.12;
        var wing = Math.sin(f * 8 + b.ph) * u * 0.6;
        ctx.fillStyle = '#1a1e22';
        ctx.fillRect(b.x - u * 0.6, b.py - wing, u * 0.35, u * 0.35);
        ctx.fillRect(b.x, b.py, u * 0.35, u * 0.35);
        ctx.fillRect(b.x + u * 0.6, b.py - wing, u * 0.35, u * 0.35);
        if (b.x < -30 || b.x > W + 30) birds.splice(bdi, 1);
      }
      if (birds.length < 3 && Math.random() < 0.002) {
        var bL = Math.random() > 0.5;
        birds.push({ x: bL ? -20 : W + 20, py: 15 + Math.random() * skylineY * 0.4,
          vx: bL ? 0.3 + Math.random() * 0.4 : -(0.3 + Math.random() * 0.4), ph: Math.random() * 6.28 });
      }

      /* ── road surface ── */
      var ry = roadY;
      /* sidewalk strip */
      ctx.fillStyle = '#3e4248'; ctx.fillRect(0, ry - u * 0.8, W, u * 0.8);
      /* main road */
      ctx.fillStyle = '#2a2c2e'; ctx.fillRect(0, ry, W, H - ry);
      /* lane markings */
      var roadOff = playing && gameState ? gameState.road : (f * 25) % (u * 8);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      var lnY = ry + (H - ry) * 0.4;
      for (var ri = -roadOff % (u * 8); ri < W; ri += u * 8) ctx.fillRect(ri, lnY, u * 4, u * 0.3);
      /* curb */
      ctx.fillStyle = '#4a4e52'; ctx.fillRect(0, ry, W, u * 0.25);
      /* bottom edge */
      ctx.fillStyle = '#1e1f20'; ctx.fillRect(0, H - u * 1, W, u * 1);

      /* ── dust ── */
      for (var di = dust.length - 1; di >= 0; di--) {
        var d = dust[di]; d.x += d.vx; d.y += d.vy; d.vy += u * 0.02; d.life--;
        ctx.globalAlpha = Math.max(0, d.life / 30) * 0.3;
        ctx.fillStyle = '#6a6860';
        ctx.fillRect(d.x, d.y, d.size, d.size);
        if (d.life <= 0) dust.splice(di, 1);
      }
      ctx.globalAlpha = 1;

      /* ── car ── */
      if (playing && gameState) drawGameMode(ctx, f);
      else drawIdleCar(ctx, f);

    } catch (e) { /* silent */ }
  }

  function drawIdleCar(ctx, f) {
    var bob = Math.sin(f * 2.5) * u * 0.2;
    var cx = car.x, cy = roadY - u * 3.6 + bob;
    car.wheelAng = (car.wheelAng || 0) + 0.02;
    for (var i = 0; i < 3; i++) {
      var age = (f * 1.5 + i * 0.8) % 2.5;
      if (age < 1.5) {
        ctx.globalAlpha = 0.06 * (1 - age / 1.5); ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(cx - age * u * 1.2 - i * u * 0.3, cy + u * 2.5 - age * u * 0.6, u * (0.3 + age * 0.3), 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(cx + u * 5, roadY + u * 0.3, u * 5.5, u * 0.6, 0, 0, 7); ctx.fill();
    drawCar(ctx, cx, cy, u, car.wheelAng);
    var glow = 0.03 + 0.018 * Math.sin(f * 3);
    ctx.fillStyle = 'rgba(255,214,74,' + glow.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(cx + u * 5, cy + u * 1.5, u * 6, 0, 7); ctx.fill();
  }

  function drawGameMode(ctx, f) {
    var gs = gameState;
    gs.time += 1 / 60; gs.road += gs.speed * u * 0.5;
    var accel = u * 0.08, friction = 0.92;
    if (keys[39] || touchR) gs.vx += accel;
    else if (keys[37] || touchL) gs.vx -= accel;
    gs.vx *= friction; gs.carX += gs.vx;
    gs.carX = Math.max(u * 2, Math.min(W - u * 12, gs.carX));
    if (!gs.grounded) { gs.vy += u * 0.1; gs.carY += gs.vy;
      if (gs.carY >= roadY - u * 4) { gs.carY = roadY - u * 4; gs.vy = 0; gs.grounded = true; SND.tick(); } }
    gs.wheelAng += gs.speed * 0.12;
    if (gs.grounded && gs.speed > 1) spawnDust(gs.carX, gs.carY, gs.speed);

    gs.spawnT += gs.speed * 0.018;
    if (gs.spawnT > 1) { gs.spawnT = 0;
      gs.coins.push({ x: W + 10, y: roadY - u * 4 - Math.random() * u * 10, alive: true }); }
    for (var i = gs.coins.length - 1; i >= 0; i--) {
      var co = gs.coins[i]; co.x -= gs.speed * u * 0.5;
      if (co.x < -u * 4) { gs.coins.splice(i, 1); continue; }
      if (co.alive && Math.abs(co.x - gs.carX) < u * 6 && Math.abs(co.y - gs.carY) < u * 5) {
        co.alive = false; gs.score++; SND.coin(); gs.speed = Math.min(5, 1.8 + gs.score * 0.12);
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
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(gs.carX + u * 5, roadY + u * 0.3, u * 5.5, u * 0.6, 0, 0, 7); ctx.fill();
    drawCar(ctx, gs.carX, gs.carY, u, gs.wheelAng);

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

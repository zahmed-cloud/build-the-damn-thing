/**
 * Hero — retro-futuristic AI district at dusk.
 * Large glowing moon, AI facilities skyline, drones, data streams.
 * Expedition truck vehicle (agent deployment rig).
 * Click vehicle / PRESS START → 30s coin game.
 * Touch: tap left/right to steer, center to jump.
 */
import { SND }          from './sound.js';
import { GAME, toast, achieve } from './state.js';

var CL = ['...XXXX.....','..XXXXXXXX...','.XXXXXXXXXXX.','XXXXXXXXXXXX.','.XXXXXXXXXX..'];
var CS = ['..XXX..','..XXXX.','.XXXXXX','XXXXXXX','.XXXXX.'];

export function initHero() {
  var cv = document.getElementById('heroCanvas');
  if (!cv) return;

  var W = 0, H = 0, u = 4, roadY = 0, skylineY = 0;
  var clouds = [], stars = [], drones = [], towers = [], dust = [];
  var car = null, playing = false, keys = {}, gameState = null;
  var touchL = false, touchR = false;

  function applySize(cw, ch) {
    if (cw < 1 || ch < 1) return;
    cw = Math.round(cw); ch = Math.round(ch);
    if (cw === W && ch === H && car) return;
    W = cw; H = ch;
    u = Math.max(3, Math.min(7, Math.round(W / 180)));
    roadY = H * 0.80; skylineY = H * 0.48;
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
    for (var i = 0; i < (W < 700 ? 3 : 6); i++) {
      var ly = Math.random();
      clouds.push({ x: Math.random() * W, y: 10 + Math.random() * (skylineY * 0.45),
        sp: 0.04 + ly * 0.18, sc: (1.4 + ly * 2) * (u / 4),
        a: 0.25 + ly * 0.2, shape: Math.random() > 0.5 ? CL : CS });
    }
    stars = [];
    for (var i = 0; i < 25; i++) stars.push({ x: Math.random() * W, y: Math.random() * skylineY * 0.7, ph: Math.random() * 6.28, sz: 0.2 + Math.random() * 0.3 });
    drones = []; dust = [];
    /* AI district towers — two depth layers */
    towers = [];
    var bx = 0;
    while (bx < W + u * 8) {
      var tw = u * (2 + Math.random() * 4), th = u * (6 + Math.random() * 16);
      var typ = Math.random();
      towers.push({ x: bx, w: tw, h: th, layer: 0,
        type: typ < 0.3 ? 'dish' : typ < 0.5 ? 'antenna' : 'lab',
        hasWin: Math.random() > 0.3, antennaH: u * (1 + Math.random() * 3) });
      bx += tw + u * (0.5 + Math.random() * 2);
    }
    bx = u * 3;
    while (bx < W + u * 10) {
      var tw = u * (3 + Math.random() * 5), th = u * (3 + Math.random() * 8);
      towers.push({ x: bx, w: tw, h: th, layer: 1,
        type: Math.random() < 0.4 ? 'server' : 'facility',
        hasWin: Math.random() > 0.2, antennaH: u * (1 + Math.random() * 2) });
      bx += tw + u * (1 + Math.random() * 4);
    }

    if (!car) car = { x: W * 0.25, vx: 0, wheelAng: 0, bounce: 0 };
    else car.x = Math.max(u * 8, Math.min(W - u * 18, car.x));
  }

  function drawCloud(c, mat, ox, oy, un) {
    for (var r = 0; r < mat.length; r++)
      for (var i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        c.fillStyle = '#fff';
        c.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  /**
   * AGENT DEPLOYMENT RIG — expedition truck / builder vehicle.
   * ~14s wide x ~6s tall. Much larger than the old car.
   * Three skins: default (coral), dev-gold, dev-stealth.
   */
  function drawVehicle(c, cx, cy, s, ang) {
    var mode = window._btdtDev ? (window._btdtSkin || 'gold') : 'default';
    var body1, body2, accent, winC, rimC;
    if (mode === 'gold')    { body1 = '#1a1a1a'; body2 = '#2a2a2a'; accent = '#ffd64a'; winC = '#4a90b8'; rimC = '#ffd64a'; }
    else if (mode === 'stealth') { body1 = '#1a1e24'; body2 = '#252a30'; accent = '#34a96a'; winC = '#2a6050'; rimC = '#34a96a'; }
    else                    { body1 = '#a83e22'; body2 = '#e0603a'; accent = '#f2ede1'; winC = '#7cc6ee'; rimC = '#bbb'; }

    /* === chassis / undercarriage === */
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(cx + s, cy + s * 5, s * 12, s * 0.6);

    /* === main cargo body (large rear section) === */
    c.fillStyle = body1;
    c.fillRect(cx, cy + s * 1.5, s * 14, s * 3.5);

    /* === cab (front, slightly raised) === */
    c.fillStyle = body2;
    c.fillRect(cx + s * 9, cy + s * 0.5, s * 5, s * 1.5);
    c.fillRect(cx + s * 8, cy + s * 0.8, s * 1.5, s * 1);

    /* === roof rack / equipment === */
    c.fillStyle = body1;
    c.fillRect(cx + s * 1, cy + s * 0.8, s * 7, s * 0.8);
    /* antenna mast */
    c.fillStyle = accent;
    c.fillRect(cx + s * 3, cy - s * 0.8, s * 0.3, s * 1.6);
    /* blinking beacon */
    var beaconOn = Math.sin(Date.now() / 1000 * 4) > 0;
    c.fillStyle = beaconOn ? accent : 'rgba(255,255,255,0.1)';
    c.fillRect(cx + s * 2.8, cy - s * 1.1, s * 0.6, s * 0.4);

    /* === windshield === */
    c.fillStyle = winC;
    c.fillRect(cx + s * 10, cy + s * 0.8, s * 2.5, s * 1.1);
    /* glare */
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(cx + s * 10.2, cy + s * 0.9, s * 0.6, s * 0.5);

    /* === side windows (cargo) === */
    c.fillStyle = winC;
    c.fillRect(cx + s * 1.5, cy + s * 2, s * 1.2, s * 1);
    c.fillRect(cx + s * 3.5, cy + s * 2, s * 1.2, s * 1);
    c.fillRect(cx + s * 5.5, cy + s * 2, s * 1.2, s * 1);

    /* === headlights (bright, with glow) === */
    c.fillStyle = '#ffd64a';
    c.fillRect(cx + s * 13.5, cy + s * 2, s * 0.8, s * 1);
    c.fillStyle = 'rgba(255,214,74,0.15)';
    c.beginPath(); c.arc(cx + s * 14.5, cy + s * 2.5, s * 2.5, 0, 7); c.fill();

    /* === tail lights === */
    c.fillStyle = '#ff3333';
    c.fillRect(cx - s * 0.3, cy + s * 2, s * 0.5, s * 0.8);
    c.fillRect(cx - s * 0.3, cy + s * 3.5, s * 0.5, s * 0.5);

    /* === racing stripe / agent marking === */
    c.fillStyle = accent;
    c.globalAlpha = 0.3;
    c.fillRect(cx + s * 1, cy + s * 3.8, s * 12, s * 0.3);
    c.globalAlpha = 1;

    /* === side detail panel line === */
    c.fillStyle = body1;
    c.fillRect(cx + s * 0.5, cy + s * 4.2, s * 13, s * 0.2);

    /* === bumper === */
    c.fillStyle = '#444';
    c.fillRect(cx + s * 13, cy + s * 4.2, s * 1.5, s * 0.8);
    c.fillRect(cx - s * 0.5, cy + s * 4.2, s * 1, s * 0.8);

    /* === wheel wells === */
    c.fillStyle = '#111';
    c.fillRect(cx + s * 1.5, cy + s * 4.5, s * 3, s * 1.2);
    c.fillRect(cx + s * 9.5, cy + s * 4.5, s * 3, s * 1.2);

    /* === tires (big, chunky) === */
    var wx1 = cx + s * 3, wx2 = cx + s * 11, wy = cy + s * 5.5, wr = s * 1.3;
    c.fillStyle = '#1a1714';
    c.beginPath(); c.arc(wx1, wy, wr, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, wr, 0, 7); c.fill();
    /* tire tread marks */
    c.fillStyle = '#252220';
    c.beginPath(); c.arc(wx1, wy, wr * 0.85, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, wr * 0.85, 0, 7); c.fill();
    /* rims */
    c.fillStyle = rimC;
    c.beginPath(); c.arc(wx1, wy, s * 0.55, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, s * 0.55, 0, 7); c.fill();
    /* spoke rotation */
    c.fillStyle = mode === 'gold' ? '#b8960a' : mode === 'stealth' ? '#2a5545' : '#777';
    var sa = ang || 0;
    for (var si = 0; si < 4; si++) {
      var a = sa + si * 1.57;
      var dx = Math.cos(a) * s * 0.38, dy = Math.sin(a) * s * 0.38;
      c.fillRect(wx1 + dx - s * 0.07, wy + dy - s * 0.07, s * 0.14, s * 0.14);
      c.fillRect(wx2 + dx - s * 0.07, wy + dy - s * 0.07, s * 0.14, s * 0.14);
    }
    /* hub center */
    c.fillStyle = '#333';
    c.beginPath(); c.arc(wx1, wy, s * 0.2, 0, 7); c.fill();
    c.beginPath(); c.arc(wx2, wy, s * 0.2, 0, 7); c.fill();

    /* === roof highlight === */
    c.fillStyle = 'rgba(255,255,255,0.06)';
    c.fillRect(cx + s * 1, cy + s * 0.8, s * 7, s * 0.15);
    c.fillRect(cx + s * 9.5, cy + s * 0.5, s * 4, s * 0.15);

    /* === dev mode underglow === */
    if (mode !== 'default') {
      c.fillStyle = mode === 'gold' ? 'rgba(255,214,74,0.06)' : 'rgba(52,169,106,0.06)';
      c.beginPath(); c.ellipse(cx + s * 7, cy + s * 6, s * 7, s * 1, 0, 0, 7); c.fill();
    }
  }

  function spawnDust(cx, cy, speed) {
    var n = Math.min(3, Math.ceil(speed * 0.7));
    for (var i = 0; i < n; i++)
      dust.push({ x: cx + Math.random() * u * 2, y: cy + u * 4 + Math.random() * u,
        vx: -speed * u * 0.12 - Math.random() * u * 0.25, vy: -Math.random() * u * 0.3 - u * 0.08,
        life: 22 + Math.random() * 15, size: u * (0.3 + Math.random() * 0.4) });
  }

  /* ── interactions ── */
  cv.addEventListener('click', function(e) {
    if (!car) return;
    var r = cv.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
    /* exit button: top-left corner during gameplay */
    if (playing && cx < u * 12 && cy < u * 6) { endGame(); return; }
    if (playing) return;
    if (Math.abs(cx - (car.x + u * 7)) < u * 16 && Math.abs(cy - (roadY - u * 2)) < u * 10) startGame();
  });
  var pressBtn = document.querySelector('.press-start');
  if (pressBtn) pressBtn.addEventListener('click', function(e) { e.preventDefault(); startGame(); });

  document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;
    if (playing && e.keyCode === 27) { endGame(); e.preventDefault(); }
    if (playing && e.keyCode >= 37 && e.keyCode <= 40) e.preventDefault();
    if (playing && e.keyCode === 38 && gameState && gameState.grounded) {
      gameState.vy = -u * 1.5; gameState.grounded = false; SND.blip(); }
  });
  document.addEventListener('keyup', function(e) { keys[e.keyCode] = false; });

  cv.addEventListener('touchstart', function(e) {
    if (!playing || !gameState) return;
    var r = cv.getBoundingClientRect();
    var handled = false;
    for (var i = 0; i < e.touches.length; i++) {
      var tx = e.touches[i].clientX - r.left, ty = e.touches[i].clientY - r.top;
      /* only intercept touches on the ROAD area (below roadY line) or jump zone */
      if (ty > roadY * 0.5) {
        if (tx < W * 0.33) { touchL = true; handled = true; }
        else if (tx > W * 0.67) { touchR = true; handled = true; }
        else if (ty < roadY && gameState.grounded) {
          gameState.vy = -u * 1.5; gameState.grounded = false; SND.blip(); handled = true;
        }
      }
    }
    /* only block scroll when touch is actually on a control zone */
    if (handled) e.preventDefault();
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
    gameState = { carX: car.x, carY: roadY - u * 6, vx: 0, vy: 0, grounded: true,
      coins: [], score: 0, speed: 1.8, road: 0, spawnT: 0, time: 0, wheelAng: 0 };
    dust = []; SND.blip();
    var m = isMobile();
    toast(m ? 'DEPLOY \u2014 tap sides to steer' : 'DEPLOY \u2014 arrows to move');
    var p = document.querySelector('.hero-poke');
    if (p) p.textContent = m ? 'tap left / right \u00b7 center to jump' : 'esc to exit \u00b7 arrows to drive';
  }

  function endGame() {
    if (!gameState) return;
    var sc = gameState.score, cash = sc * 30;
    touchL = false; touchR = false;
    if (sc > 0) { GAME.addCash(cash); toast('well played. +' + cash + ' XP earned');
      if (sc >= 10) { achieve('agent_deployer', 'AGENT DEPLOYER'); SND.win(); } else SND.good(); }
    car.x = gameState.carX; car.vx = 0; playing = false; gameState = null;
    var p = document.querySelector('.hero-poke');
    if (p) p.textContent = isMobile() ? 'tap the rig to deploy' : 'click the rig to deploy';
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

      /* ── deep sky ── */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0e1828'); g.addColorStop(0.3, '#1a2a44');
      g.addColorStop(0.6, '#2a4466'); g.addColorStop(0.85, '#3a6088');
      g.addColorStop(1, '#4a7aa0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      /* ── stars ── */
      for (var si = 0; si < stars.length; si++) {
        var st = stars[si];
        ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.4 * Math.abs(Math.sin(f * 1.8 + st.ph))).toFixed(2) + ')';
        ctx.fillRect(st.x, st.y, u * st.sz, u * st.sz);
      }

      /* ── MOON / CELESTIAL BODY (hero visual element — must stay) ── */
      var mx = W * 0.82, my = skylineY - u * 12, mr = u * 9;
      var mp = 1 + Math.sin(f * 0.8) * 0.08;
      /* outer glow */
      ctx.fillStyle = 'rgba(255,210,100,0.04)';
      ctx.beginPath(); ctx.arc(mx, my, mr + u * 12 * mp, 0, 7); ctx.fill();
      /* mid glow */
      ctx.fillStyle = 'rgba(255,215,110,0.08)';
      ctx.beginPath(); ctx.arc(mx, my, mr + u * 5 * mp, 0, 7); ctx.fill();
      /* body */
      ctx.fillStyle = '#f0c860';
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
      /* highlight */
      ctx.fillStyle = '#f8dca0';
      ctx.beginPath(); ctx.arc(mx - u * 1.2, my - u * 1.2, mr * 0.4, 0, 7); ctx.fill();
      /* clean surface — no crater artifacts */

      /* ── clouds (subtle) ── */
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci]; cl.x -= cl.sp;
        if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
        ctx.globalAlpha = cl.a; drawCloud(ctx, cl.shape, cl.x, cl.y, cl.sc);
      }
      ctx.globalAlpha = 1;

      /* ── AI district skyline (back layer) ── */
      for (var ti = 0; ti < towers.length; ti++) {
        var t = towers[ti];
        if (t.layer !== 0) continue;
        var ty = roadY - t.h;
        ctx.fillStyle = '#141820';
        ctx.fillRect(t.x, ty, t.w, t.h);
        /* facility type details */
        if (t.type === 'dish') {
          ctx.fillStyle = '#222830';
          ctx.beginPath(); ctx.arc(t.x + t.w * 0.5, ty + u, u * 1.2, Math.PI, 0); ctx.fill();
        } else if (t.type === 'antenna') {
          ctx.fillStyle = '#222830';
          ctx.fillRect(t.x + t.w * 0.45, ty - t.antennaH, u * 0.25, t.antennaH);
          var blink = Math.sin(f * 2 + ti) > 0.7;
          ctx.fillStyle = blink ? '#e0603a' : 'rgba(224,96,58,0.12)';
          ctx.fillRect(t.x + t.w * 0.4, ty - t.antennaH - u * 0.3, u * 0.35, u * 0.35);
        }
        if (t.hasWin) {
          for (var wy = ty + u * 1.2; wy < roadY - u * 1.5; wy += u * 2)
            for (var wx = t.x + u * 0.5; wx < t.x + t.w - u * 0.3; wx += u * 1.4) {
              var lit = Math.sin(f * 0.25 + ti * 1.1 + wx * 0.08 + wy * 0.04) > 0;
              ctx.fillStyle = lit ? 'rgba(120,200,255,0.35)' : 'rgba(120,200,255,0.04)';
              ctx.fillRect(wx, wy, u * 0.45, u * 0.55);
            }
        }
      }

      /* ── front layer ── */
      for (var t2i = 0; t2i < towers.length; t2i++) {
        var t2 = towers[t2i];
        if (t2.layer !== 1) continue;
        var ty2 = roadY - t2.h;
        ctx.fillStyle = '#1e242c';
        ctx.fillRect(t2.x, ty2, t2.w, t2.h);
        if (t2.type === 'server') {
          for (var svy = ty2 + u; svy < ty2 + t2.h - u; svy += u * 1.5) {
            ctx.fillStyle = Math.sin(f * 3 + svy * 0.5) > 0 ? 'rgba(52,169,106,0.4)' : 'rgba(52,169,106,0.08)';
            ctx.fillRect(t2.x + u * 0.4, svy, u * 0.3, u * 0.3);
          }
        }
        if (t2.hasWin) {
          for (var wy2 = ty2 + u; wy2 < roadY - u; wy2 += u * 1.6)
            for (var wx2 = t2.x + u * 0.5; wx2 < t2.x + t2.w - u * 0.3; wx2 += u * 1.3) {
              ctx.fillStyle = Math.sin(f * 0.35 + t2i * 1.5 + wx2 * 0.07) > 0 ? 'rgba(255,214,74,0.3)' : 'rgba(255,214,74,0.04)';
              ctx.fillRect(wx2, wy2, u * 0.4, u * 0.5);
            }
        }
      }

      /* ── drones ── */
      for (var dri = drones.length - 1; dri >= 0; dri--) {
        var dr = drones[dri]; dr.x += dr.vx; dr.y += Math.sin(f * 2 + dr.ph) * 0.2;
        ctx.fillStyle = '#4a6a8a';
        ctx.fillRect(dr.x - u * 0.5, dr.y, u * 1, u * 0.3);
        ctx.fillRect(dr.x - u * 0.15, dr.y - u * 0.2, u * 0.3, u * 0.5);
        /* blinking light */
        ctx.fillStyle = Math.sin(f * 6 + dr.ph) > 0.5 ? 'rgba(255,100,100,0.6)' : 'rgba(255,100,100,0.1)';
        ctx.fillRect(dr.x - u * 0.1, dr.y - u * 0.3, u * 0.2, u * 0.2);
        if (dr.x < -u * 4 || dr.x > W + u * 4) drones.splice(dri, 1);
      }
      if (drones.length < 2 && Math.random() < 0.002) {
        var dL = Math.random() > 0.5;
        drones.push({ x: dL ? -u * 3 : W + u * 3, y: skylineY * 0.3 + Math.random() * skylineY * 0.3,
          vx: dL ? 0.4 + Math.random() * 0.5 : -(0.4 + Math.random() * 0.5), ph: Math.random() * 6.28 });
      }

      /* ── road ── */
      var ry = roadY;
      ctx.fillStyle = '#2a2c2e'; ctx.fillRect(0, ry, W, H - ry);
      var roadOff = playing && gameState ? gameState.road : (f * 20) % (u * 8);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      var lnY = ry + (H - ry) * 0.4;
      for (var ri = -roadOff % (u * 8); ri < W; ri += u * 8) ctx.fillRect(ri, lnY, u * 4, u * 0.3);
      ctx.fillStyle = 'rgba(255,214,74,0.5)'; ctx.fillRect(0, ry, W, u * 0.2);
      ctx.fillStyle = '#1a1c1e'; ctx.fillRect(0, H - u * 1, W, u * 1);

      /* ── dust ── */
      for (var dui = dust.length - 1; dui >= 0; dui--) {
        var d = dust[dui]; d.x += d.vx; d.y += d.vy; d.vy += u * 0.015; d.life--;
        ctx.globalAlpha = Math.max(0, d.life / 30) * 0.25;
        ctx.fillStyle = '#5a5650';
        ctx.fillRect(d.x, d.y, d.size, d.size);
        if (d.life <= 0) dust.splice(dui, 1);
      }
      ctx.globalAlpha = 1;

      /* ── vehicle ── */
      if (playing && gameState) drawGameMode(ctx, f);
      else drawIdleVehicle(ctx, f);

    } catch (e) { /* silent */ }
  }

  function drawIdleVehicle(ctx, f) {
    var bob = Math.sin(f * 1.8) * u * 0.15;
    var cx = car.x, cy = roadY - u * 5.8 + bob;
    car.wheelAng = (car.wheelAng || 0) + 0.015;

    /* exhaust */
    for (var i = 0; i < 2; i++) {
      var age = (f * 1.2 + i * 1) % 3;
      if (age < 1.8) {
        ctx.globalAlpha = 0.05 * (1 - age / 1.8); ctx.fillStyle = '#666';
        ctx.beginPath(); ctx.arc(cx - age * u * 0.8 - i * u * 0.3, cy + u * 4.5 - age * u * 0.5, u * (0.3 + age * 0.25), 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(cx + u * 7, roadY + u * 0.3, u * 7.5, u * 0.7, 0, 0, 7); ctx.fill();

    drawVehicle(ctx, cx, cy, u, car.wheelAng);

    /* clickable glow */
    var glow = 0.025 + 0.015 * Math.sin(f * 2.5);
    ctx.fillStyle = 'rgba(255,214,74,' + glow.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(cx + u * 7, cy + u * 3, u * 8, 0, 7); ctx.fill();
  }

  function drawGameMode(ctx, f) {
    var gs = gameState;
    gs.time += 1 / 60; gs.road += gs.speed * u * 0.5;
    var accel = u * 0.07, friction = 0.93;
    if (keys[39] || touchR) gs.vx += accel;
    else if (keys[37] || touchL) gs.vx -= accel;
    gs.vx *= friction; gs.carX += gs.vx;
    gs.carX = Math.max(u * 2, Math.min(W - u * 16, gs.carX));
    if (!gs.grounded) { gs.vy += u * 0.09; gs.carY += gs.vy;
      if (gs.carY >= roadY - u * 6) { gs.carY = roadY - u * 6; gs.vy = 0; gs.grounded = true; SND.tick(); } }
    gs.wheelAng += gs.speed * 0.1;
    if (gs.grounded && gs.speed > 1) spawnDust(gs.carX, gs.carY, gs.speed);

    gs.spawnT += gs.speed * 0.016;
    if (gs.spawnT > 1) { gs.spawnT = 0;
      gs.coins.push({ x: W + 10, y: roadY - u * 6 - Math.random() * u * 8, alive: true }); }
    for (var i = gs.coins.length - 1; i >= 0; i--) {
      var co = gs.coins[i]; co.x -= gs.speed * u * 0.5;
      if (co.x < -u * 4) { gs.coins.splice(i, 1); continue; }
      if (co.alive && Math.abs(co.x - gs.carX) < u * 8 && Math.abs(co.y - gs.carY) < u * 6) {
        co.alive = false; gs.score++; SND.coin(); gs.speed = Math.min(4.5, 1.8 + gs.score * 0.1);
        for (var p = 0; p < 6; p++) dust.push({ x: co.x + u, y: co.y + u, vx: (Math.random()-0.5)*u*0.7, vy: -Math.random()*u*0.5, life: 14, size: u * 0.25 });
      }
      if (co.alive) {
        ctx.fillStyle = '#ffd64a'; ctx.shadowColor = '#ffd64a'; ctx.shadowBlur = 6;
        ctx.fillRect(co.x, co.y, u * 2, u * 2); ctx.shadowBlur = 0;
        ctx.fillStyle = '#1d1410';
        ctx.font = Math.min(u * 1, 12) + "px 'Press Start 2P',monospace";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', co.x + u, co.y + u);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(gs.carX + u * 7, roadY + u * 0.3, u * 7.5, u * 0.7, 0, 0, 7); ctx.fill();
    drawVehicle(ctx, gs.carX, gs.carY, u, gs.wheelAng);

    /* HUD */
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    var hw = Math.min(u * 22, W * 0.4);
    ctx.fillRect(W - hw - u * 2, u * 2, hw, u * 4.5);
    ctx.strokeStyle = 'rgba(255,214,74,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(W - hw - u * 2, u * 2, hw, u * 4.5);
    ctx.fillStyle = '#ffd64a';
    ctx.font = Math.min(u * 1.4, 14) + "px 'Press Start 2P',monospace";
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('$ ' + gs.score, W - u * 3, u * 2.8);
    var tl = Math.max(0, Math.ceil(30 - gs.time));
    ctx.fillStyle = tl <= 5 ? '#e0603a' : '#f2ede1';
    ctx.font = Math.min(u * 0.9, 10) + "px 'Press Start 2P',monospace";
    ctx.fillText(tl + 's', W - u * 3, u * 5);
    /* EXIT button — top left, always visible during gameplay */
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(u * 1.5, u * 2, u * 10, u * 4);
    ctx.strokeStyle = 'rgba(242,237,225,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(u * 1.5, u * 2, u * 10, u * 4);
    ctx.fillStyle = '#f2ede1';
    ctx.font = Math.min(u * 1, 10) + "px 'Press Start 2P',monospace";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', u * 6.5, u * 4);
    if (isMobile()) {
      ctx.globalAlpha = 0.025; ctx.fillStyle = '#fff';
      ctx.fillRect(0, roadY, W * 0.33, H - roadY); ctx.fillRect(W * 0.67, roadY, W * 0.33, H - roadY);
      ctx.globalAlpha = 1;
    }
    if (gs.time > 30) endGame();
  }

  requestAnimationFrame(frame);
  var poke = document.querySelector('.hero-poke');
  if (poke) poke.textContent = isMobile() ? 'tap the rig to deploy' : 'click the rig to deploy';
}

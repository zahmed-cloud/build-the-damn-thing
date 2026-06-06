/**
 * "Catch the Leads" — 20-second falling-coin mini-game with combo system.
 */

import { drawSprite, FR }        from './sprite.js';
import { fitCanvas, canvasVis }  from './canvas.js';
import { GAME, toast, achieve, REFIT } from './state.js';
import { SND }                   from './sound.js';

export function initCatchGame() {
  const cv = document.getElementById('catchCanvas');
  if (!cv) return;

  const btn     = document.getElementById('catchBtn');
  const sEl     = document.getElementById('catchScore');
  const tEl     = document.getElementById('catchTime');
  const bEl     = document.getElementById('catchBest');
  const rEl     = document.getElementById('catchResult');
  const comboEl = document.getElementById('catchCombo');

  let W = 0, H = 0, u = 4;
  let running = false, score = 0, best = 0, timeLeft = 20;
  let combo = 0, maxCombo = 0;
  let coins = [], spawnT = 0, pops = [], trails = [], stars = [];
  let last = 0;
  let bot = { x: 0, y: 0, vy: 0, grounded: true };
  let sayT = 0, sayS = '';

  function build() {
    const m = fitCanvas(cv);
    if (!m.ok) { setTimeout(build, 120); return; }
    W = m.w; H = m.h;
    u = Math.max(4, Math.min(8, Math.round(W / 90)));
    if (!bot.x) bot.x = W / 2;
    stars = [];
    for (let i = 0; i < 30; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.75, ph: Math.random() * 6.28 });
  }
  REFIT.push(build);

  function spawn() {
    const bad = Math.random() < 0.24;
    coins.push({ x: 40 + Math.random() * (W - 80), y: -20, vy: (1.7 + Math.random() * 1.3) * (u / 4), bad, r: u * 4.6 });
  }

  function pop(x, y, col, txt) { pops.push({ x, y, col, txt, life: 36 }); }
  function say(t) { sayS = t; sayT = 55; }
  function hop()  { if (bot.grounded) { bot.vy = -6; bot.grounded = false; } }

  function grab(cx, cy) {
    if (!running) return;
    let bi = -1, bd = 1e9;
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i], d = Math.hypot(cx - c.x, cy - c.y);
      if (d < c.r + u * 3 && d < bd) { bd = d; bi = i; }
    }
    if (bi < 0) return;
    const c = coins[bi];

    if (c.bad) {
      combo = 0;
      score = Math.max(0, score - 1);
      pop(c.x, c.y, '#e0603a', '-1');
      say('spam ay');
      SND.bad();
    } else {
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      const pts = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;
      score += pts;
      pop(c.x, c.y, '#ffd64a', '+' + pts + (combo >= 3 ? ' x' + combo : ''));
      hop();
      SND.coin();
      if (combo === 5)  { say('combo!'); SND.good(); }
      if (combo === 10) { say('on fire!'); SND.win(); }
      for (let t = 0; t < 6; t++) {
        trails.push({ x: c.x, y: c.y, vx: (Math.random() - .5) * 4, vy: -Math.random() * 3 - 1, c: '#ffd64a', life: 20 });
      }
    }

    coins.splice(bi, 1);
    bot.x = Math.max(u * 6, Math.min(W - u * 6, c.x));
    sEl.textContent = score;
    comboEl.textContent = combo;
  }

  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    grab(e.clientX - r.left, e.clientY - r.top);
  });

  function start() {
    running = true; score = 0; timeLeft = 20; combo = 0; maxCombo = 0;
    coins = []; pops = []; trails = []; spawnT = 0;
    sEl.textContent = '0'; tEl.textContent = '20'; comboEl.textContent = '0'; rEl.textContent = '';
    btn.disabled = true; btn.textContent = 'GO!';
    last = Date.now();
    say('go go go!'); SND.blip();
  }

  btn.onclick = () => { if (!running) start(); };

  function end() {
    running = false;
    best = Math.max(best, score);
    bEl.textContent = best;
    const cash = score * 40;
    GAME.addCash(cash);
    var msg = score > 8 ? 'speed-to-lead unlocked. +' + cash + ' XP' : 'caught ' + score + ' leads. +' + cash + ' XP. go again.';
    if (maxCombo >= 5) msg += ' best combo: x' + maxCombo;
    rEl.textContent = msg;
    btn.disabled = false; btn.textContent = '\u25b6 PLAY AGAIN';
    say(score > 8 ? 'nice one' : 'again');
    if (score >= 15) { achieve('lead_master', 'LEAD MASTER'); SND.win(); }
    else if (score > 8) { toast('well played. keep building.'); SND.win(); }
  }

  function frame() {
    if (!canvasVis.catchCanvas || W < 1) { requestAnimationFrame(frame); return; }

    const x   = cv.getContext('2d');
    const now = Date.now();
    const dt  = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const f = now / 1000;
    x.clearRect(0, 0, W, H);

    /* night sky */
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1520'); g.addColorStop(0.6, '#0e1a26'); g.addColorStop(1, '#1a2e3f');
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    /* stars */
    stars.forEach(s => {
      const tw = 0.3 + 0.5 * Math.abs(Math.sin(f * 1.5 + s.ph));
      x.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
      x.fillRect(s.x, s.y, u * 0.4, u * 0.4);
    });

    /* ground */
    const gy = H - u * 2.5;
    x.fillStyle = '#1a3422'; x.fillRect(0, gy, W, H - gy);
    x.fillStyle = '#245232';
    for (let i = 0; i < W; i += u * 2) x.fillRect(i, gy, u, u);

    /* timer / spawn */
    if (running) {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; end(); }
      tEl.textContent = Math.ceil(timeLeft);
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = Math.max(0.40, 0.90 - (20 - timeLeft) * 0.024); spawn(); }
    }

    /* coins */
    coins.forEach(c => { c.y += c.vy; });
    coins = coins.filter(c => c.y < H + 30);

    coins.forEach(c => {
      x.fillStyle = c.bad ? 'rgba(224,96,58,0.15)' : 'rgba(255,214,74,0.15)';
      x.beginPath(); x.arc(c.x, c.y, c.r * 1.6, 0, 7); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.beginPath(); x.arc(c.x + u * 0.5, c.y + u * 0.5, c.r, 0, 7); x.fill();
      x.fillStyle = c.bad ? '#e0603a' : '#ffd64a';
      x.beginPath(); x.arc(c.x, c.y, c.r, 0, 7); x.fill();
      x.fillStyle = c.bad ? '#f27855' : '#ffe98c';
      x.beginPath(); x.arc(c.x - c.r * 0.15, c.y - c.r * 0.15, c.r * 0.65, 0, 7); x.fill();
      x.fillStyle = '#1d1410';
      x.font = "bold " + (c.r * 1.05) + "px 'Press Start 2P',monospace";
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(c.bad ? '\u2715' : '$', c.x, c.y + 1);
    });

    /* trails */
    trails.forEach(t => { t.x += t.vx; t.y += t.vy; t.vy += 0.15; t.life--; x.globalAlpha = Math.max(0, t.life / 20); x.fillStyle = t.c; x.fillRect(t.x, t.y, u * 0.6, u * 0.6); });
    x.globalAlpha = 1;
    trails = trails.filter(t => t.life > 0);

    /* character */
    if (!bot.grounded) { bot.y += bot.vy; bot.vy += 0.5; if (bot.y >= 0) { bot.y = 0; bot.vy = 0; bot.grounded = true; } }
    bot.x = Math.max(u * 6, Math.min(W - u * 6, bot.x));
    const bob = bot.grounded ? Math.sin(f * 5) * 1.2 : 0;
    const oy = gy - 14 * u + bot.y - bob;
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.ellipse(bot.x, gy, u * 5, u, 0, 0, 7); x.fill();
    drawSprite(x, FR, bot.x - 5.5 * u, oy, u, false);

    /* speech */
    if (sayT > 0) {
      sayT--;
      x.font = "8px 'Press Start 2P',monospace";
      const tw = x.measureText(sayS).width, bw = tw + 14, bh = 18;
      const bx = Math.max(4, Math.min(W - bw - 4, bot.x - bw / 2)), by = oy - bh - 6;
      x.fillStyle = '#1d1410'; x.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      x.fillStyle = '#fbf6ec'; x.fillRect(bx, by, bw, bh);
      x.fillStyle = '#1d1410'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(sayS, bx + bw / 2, by + bh / 2);
    }

    /* score pops */
    pops.forEach(pp => {
      pp.y -= 1.2; pp.life--;
      x.globalAlpha = Math.max(0, pp.life / 36);
      x.fillStyle = pp.col;
      x.font = "bold 13px 'Press Start 2P',monospace";
      x.textAlign = 'center'; x.fillText(pp.txt, pp.x, pp.y);
      x.globalAlpha = 1;
    });
    pops = pops.filter(pp => pp.life > 0);

    /* combo display */
    if (running && combo >= 3) {
      x.globalAlpha = 0.5 + 0.3 * Math.sin(f * 6);
      x.fillStyle = combo >= 5 ? '#ff85c0' : '#ffd64a';
      x.font = "bold 16px 'Press Start 2P',monospace";
      x.textAlign = 'right'; x.textBaseline = 'top';
      x.fillText('x' + combo, W - 12, 12);
      x.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);
  let to;
  addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 200); });
}

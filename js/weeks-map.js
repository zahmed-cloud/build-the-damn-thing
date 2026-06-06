/**
 * 21-week level map grid + walking mascot that speaks when you tap a week.
 */

import { drawSprite, FR, FB }   from './sprite.js';
import { fitCanvas, canvasVis } from './canvas.js';
import { REFIT }                from './state.js';
import { SND }                  from './sound.js';

const LINES = [
  'we doing this for real. follow on socials ay',
  '21 weeks, 10 grand. you watchin or what',
  'this is a mission not a course. follow up',
  'quit lurkin, smash follow and watch it happen',
  'new agent every week. follow the journey',
  'built different over here. go follow ay',
  'oi stop clickin, go hit that follow button',
  'real ones follow along. you in or nah',
  'every week, shipped. thats the deal',
  'no fluff, no filler. just builds',
  'from zero to shipped, every single week',
  'come along for the ride legend'
];

export function initWeeksMap() {

  /* ========== GRID ========== */
  const grid = document.getElementById('weeksGrid');
  const planned = { 3: 1, 5: 1, 7: 1 };

  if (grid) {
    for (let i = 1; i <= 21; i++) {
      const d = document.createElement('div');
      d.className = 'wk' + (i === 1 ? ' cur' : '') + (planned[i] ? ' planned' : '');
      d.dataset.w = i;
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      d.setAttribute('aria-label', 'Week ' + i);
      d.innerHTML = `<span class="wk-n">WK</span><span class="wk-s">${String(i).padStart(2, '0')}</span>`;

      const handler = () => { SND.blip(); talk(i); };
      d.onclick = handler;
      d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } };
      grid.appendChild(d);
    }
  }

  /* ========== CANVAS ========== */
  const cv = document.getElementById('weekCanvas');
  if (!cv) return;

  let W = 0, H = 0, u = 4;
  let st = {
    active: false, x: 0, dir: 1, frame: 0, ft: 0,
    phase: 'in', target: 0, sayS: '', talkT: 0,
    pendingSpeak: false, fromLeft: true
  };

  function build() {
    const m = fitCanvas(cv);
    if (!m.ok) { setTimeout(build, 120); return; }
    W = m.w; H = m.h;
    u = Math.max(4, Math.min(7, Math.round(W / 170)));
  }

  function talk(week) {
    const base = LINES[(Math.random() * LINES.length) | 0];
    const line = (week ? ('week ' + String(week).padStart(2, '0') + '? ') : '') + base;

    if (!st.active) {
      st.active = true;
      st.fromLeft = Math.random() < 0.5;
      st.x = st.fromLeft ? -u * 8 : W + u * 8;
      st.target = W * 0.5;
      st.phase = 'in';
    } else if (st.phase === 'out') {
      st.phase = 'in';
      st.target = W * 0.5;
    }
    st.sayS = line;
    st.pendingSpeak = true;
  }

  cv.addEventListener('click', e => {
    const r  = cv.getBoundingClientRect();
    const cx = e.clientX - r.left;
    if (!st.active || Math.abs(cx - st.x) < u * 11) talk(0);
  });

  function frame() {
    if (!canvasVis.weekCanvas || W < 1) { requestAnimationFrame(frame); return; }

    const x = cv.getContext('2d');
    x.clearRect(0, 0, W, H);
    const f = Date.now() / 1000;
    const gy = H - u * 2;

    /* idle prompt */
    if (!st.active) {
      x.fillStyle = 'rgba(242,237,225,0.32)';
      x.font = "9px 'Press Start 2P',monospace";
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('tap a week, i will come \u2191', W / 2, H / 2);
      requestAnimationFrame(frame);
      return;
    }

    /* phase logic */
    if (st.phase === 'in') {
      st.x += (st.target - st.x) * 0.12;
      st.dir = st.target > st.x ? 1 : -1;
      st.ft++;
      if (st.ft > 8) { st.ft = 0; st.frame ^= 1; }
      if (Math.abs(st.x - st.target) < u * 1.4) {
        st.phase = 'talk'; st.talkT = 200;
        if (st.pendingSpeak) { SND.say(st.sayS); st.pendingSpeak = false; }
      }
    } else if (st.phase === 'talk') {
      if (st.pendingSpeak) { SND.say(st.sayS); st.pendingSpeak = false; st.talkT = 200; }
      st.talkT--;
      if (st.talkT <= 0) { st.phase = 'out'; st.target = st.x < W / 2 ? -u * 9 : W + u * 9; }
    } else if (st.phase === 'out') {
      st.x += (st.target - st.x) * 0.1;
      st.dir = st.target > st.x ? 1 : -1;
      st.ft++;
      if (st.ft > 8) { st.ft = 0; st.frame ^= 1; }
      if (st.x < -u * 8 || st.x > W + u * 8) st.active = false;
    }

    /* draw */
    const bob = Math.sin(f * 7) * 1.3;
    const mat = st.frame ? FB : FR;
    const oy  = gy - 14 * u - bob;

    x.fillStyle = 'rgba(0,0,0,0.25)';
    x.beginPath(); x.ellipse(st.x, gy + u * 0.6, u * 5, u, 0, 0, 7); x.fill();
    drawSprite(x, mat, st.x - 5.5 * u, oy, u, st.dir < 0);

    if (st.phase === 'talk' && st.sayS) {
      x.font = "7px 'Press Start 2P',monospace";
      const tw = x.measureText(st.sayS).width;
      const bw = Math.min(W - 12, tw + 16), bh = 18;
      const bx = Math.max(6, Math.min(W - bw - 6, st.x - bw / 2));
      const by = oy - bh - 12;
      x.fillStyle = '#1d1410'; x.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      x.fillStyle = '#fbf6ec'; x.fillRect(bx, by, bw, bh);
      x.fillStyle = '#1d1410'; x.fillRect(st.x - 3, by + bh, 6, 5);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(st.sayS, bx + bw / 2, by + bh / 2);
    }

    requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);
  REFIT.push(build);
  let to;
  addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 200); });
}

/**
 * Hero section — animated pixel sky, clouds, birds, flowers,
 * roaming & clickable mascot with speech bubbles.
 */

import { drawSprite, FR, FB } from './sprite.js';
import { fitCanvas, canvasVis }  from './canvas.js';
import { REFIT }                 from './state.js';
import { SND }                   from './sound.js';

/* --- cloud templates --- */
const CLOUD_L = [
  '...XXXX.....',
  '..XXXXXXXX...',
  '.XXXXXXXXXXX.',
  'XXXXXXXXXXXX.',
  '.XXXXXXXXXX..'
];
const CLOUD_S = [
  '..XXX..',
  '..XXXX.',
  '.XXXXXX',
  'XXXXXXX',
  '.XXXXX.'
];

/* --- speech lines --- */
const LINES = [
  'oi, lets give this a crack',
  'bloody hell that actually worked',
  'righto, onto the next one',
  'sending it, watch this',
  'easy money, lets go',
  'yeah nah this is gonna be sick',
  'built different, dont @ me',
  'lock in, here we go',
  'oi you still watchin?',
  'this is the fun part mate',
  'no worries, we will fix it',
  'too easy, next one',
  'ship it and see what happens',
  'aint no one outworking us',
  'trust the process yeah',
  'oh we are cooking now',
  'alright this ones gonna slap',
  'peak performance right here',
  'watch and learn legends',
  'full send, no cap',
  'we dont do half measures',
  'reckon thats a banger',
  'you seeing this or what',
  'absolute scenes right now'
];

const FLOWER_COLOURS = ['#ff6b8a','#ffb347','#ff85c0','#ffd64a','#ff7eb3','#e8a0ff'];

export function initHero() {
  const cv = document.getElementById('heroCanvas');
  if (!cv) return;

  let W = 0, H = 0, u = 4, gt = 0;
  let clouds = [], spark = [], flowers = [], birds = [];
  let ch = null;
  let autoTimer = 0;

  /* --- build / resize --- */
  function build() {
    const m = fitCanvas(cv);
    if (!m.ok) { setTimeout(build, 120); return; }
    W = m.w; H = m.h;
    u  = Math.max(3, Math.min(6, Math.round(W / 240)));
    gt = H * 0.81;

    /* clouds */
    clouds = [];
    const nc = W < 700 ? 5 : 9;
    for (let i = 0; i < nc; i++) {
      const ly = Math.random();
      clouds.push({
        x: Math.random() * W,
        y: 18 + Math.random() * (H * 0.40),
        sp: 0.08 + ly * 0.3,
        sc: (1.8 + ly * 2.5) * (u / 4),
        a: 0.55 + ly * 0.4,
        shape: Math.random() > 0.45 ? CLOUD_L : CLOUD_S
      });
    }

    /* sparkles */
    spark = [];
    for (let i = 0; i < 18; i++) {
      spark.push({ x: Math.random() * W, y: Math.random() * H * 0.55, ph: Math.random() * 6.28 });
    }

    /* flowers */
    flowers = [];
    for (let i = 0; i < Math.floor(W / 60); i++) {
      flowers.push({
        x: Math.random() * W,
        c: FLOWER_COLOURS[(Math.random() * FLOWER_COLOURS.length) | 0],
        ph: Math.random() * 6.28,
        size: 0.6 + Math.random() * 0.5
      });
    }

    /* birds reset */
    birds = [];

    /* character */
    if (!ch) ch = { x: W * 0.5, dir: 1, frame: 0, ft: 0, vy: 0, y: 0, grounded: true, sayT: 0, sayS: '' };
  }

  /* --- draw helpers --- */
  function drawCloud(x, mat, ox, oy, un) {
    for (let r = 0; r < mat.length; r++)
      for (let i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        x.fillStyle = '#ffffff';
        x.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  /* --- click interaction --- */
  cv.addEventListener('click', e => {
    const r  = cv.getBoundingClientRect();
    const cx = e.clientX - r.left;
    if (Math.abs(cx - ch.x) < u * 12) {
      if (ch.grounded) { ch.vy = -7.5; ch.grounded = false; }
      ch.sayS = LINES[(Math.random() * LINES.length) | 0];
      ch.sayT = 80;
      autoTimer = 0;
      SND.say(ch.sayS);
      SND.blip();
    }
  });

  /* --- animation loop --- */
  function frame() {
    if (!canvasVis.heroCanvas || W < 1) { requestAnimationFrame(frame); return; }

    const x = cv.getContext('2d');
    const f = Date.now() / 1000;

    /* sky */
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    '#4aa8e3');
    g.addColorStop(0.5,  '#7cc6ee');
    g.addColorStop(0.75, '#a5daf5');
    g.addColorStop(1,    '#c8ecfb');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    /* sun */
    const sx = W - u * 18, sy = u * 14, sr = u * 7;
    const pulse = 1 + Math.sin(f * 1.5) * 0.15;
    x.fillStyle = 'rgba(255,224,110,0.15)';
    x.beginPath(); x.arc(sx, sy, sr + u * 5 * pulse, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,224,110,0.25)';
    x.beginPath(); x.arc(sx, sy, sr + u * 2.5 * pulse, 0, 7); x.fill();
    x.fillStyle = '#ffd64a';
    x.beginPath(); x.arc(sx, sy, sr, 0, 7); x.fill();
    x.fillStyle = '#ffe98c';
    x.beginPath(); x.arc(sx - u, sy - u, sr * 0.5, 0, 7); x.fill();

    /* sparkles */
    spark.forEach(s => {
      const tw = 0.25 + 0.65 * Math.abs(Math.sin(f * 2.5 + s.ph));
      x.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
      x.fillRect(s.x, s.y, u * 0.7, u * 0.7);
      x.fillRect(s.x - u * 0.6, s.y + u * 0.15, u * 0.4, u * 0.4);
      x.fillRect(s.x + u * 0.8, s.y + u * 0.15, u * 0.4, u * 0.4);
      x.fillRect(s.x + u * 0.15, s.y - u * 0.5, u * 0.4, u * 0.4);
      x.fillRect(s.x + u * 0.15, s.y + u * 0.8, u * 0.4, u * 0.4);
    });

    /* clouds */
    clouds.forEach(cl => {
      cl.x -= cl.sp;
      if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
      x.globalAlpha = cl.a;
      drawCloud(x, cl.shape, cl.x, cl.y, cl.sc);
      x.globalAlpha = 1;
    });

    /* birds */
    birds.forEach(b => {
      b.x += b.vx;
      b.py += Math.sin(f * 3 + b.ph) * 0.15;
      const wing = Math.sin(f * 8 + b.ph) * u * 0.8;
      x.fillStyle = '#3a3530';
      x.fillRect(b.x - u * 0.8, b.py - wing, u * 0.5, u * 0.5);
      x.fillRect(b.x, b.py, u * 0.5, u * 0.5);
      x.fillRect(b.x + u * 0.8, b.py - wing, u * 0.5, u * 0.5);
    });
    birds = birds.filter(b => b.x > -30 && b.x < W + 30);
    if (birds.length < 3 && Math.random() < 0.003) {
      const left = Math.random() > 0.5;
      birds.push({
        x: left ? -20 : W + 20,
        py: 20 + Math.random() * H * 0.3,
        vx: left ? (0.3 + Math.random() * 0.5) : -(0.3 + Math.random() * 0.5),
        ph: Math.random() * 6.28
      });
    }

    /* grass */
    x.fillStyle = '#69b24a';
    x.fillRect(0, gt, W, H - gt);
    x.fillStyle = '#5aa03e';
    for (let i = 0; i < W; i += u * 2) x.fillRect(i, gt, u, u);
    x.fillStyle = '#7bc75a';
    for (let i = 0; i < W; i += u * 5) {
      const sway = Math.sin(f * 2 + i * 0.1) * u * 0.3;
      x.fillRect(i + sway, gt - u * 0.7, u * 0.5, u * 0.7);
    }

    /* flowers */
    flowers.forEach(fl => {
      const sway = Math.sin(f * 1.8 + fl.ph) * u * 0.4;
      const sz = u * fl.size;
      x.fillStyle = '#4a9639';
      x.fillRect(fl.x, gt - sz * 0.5, u * 0.4, sz * 0.6);
      x.fillStyle = fl.c;
      x.fillRect(fl.x + sway - sz * 0.3, gt - sz * 1.2, sz * 0.5, sz * 0.5);
      x.fillRect(fl.x + sway + sz * 0.2, gt - sz * 1.2, sz * 0.5, sz * 0.5);
      x.fillRect(fl.x + sway - sz * 0.05, gt - sz * 1.5, sz * 0.5, sz * 0.5);
      x.fillStyle = '#ffd64a';
      x.fillRect(fl.x + sway, gt - sz * 1.15, sz * 0.35, sz * 0.35);
    });

    /* dirt */
    x.fillStyle = '#7d4e2c';
    x.fillRect(0, gt + u * 2.2, W, H - (gt + u * 2.2));
    x.fillStyle = '#6a4023';
    const off = (f * 8) % (u * 4);
    for (let i = off; i < W; i += u * 4) {
      x.fillRect(i, gt + u * 4, u, u);
      x.fillRect(i + u * 2, gt + u * 7, u, u);
    }

    /* character walk */
    if (ch.grounded) {
      ch.x += ch.dir * 0.55 * u;
      if (ch.x > W - u * 8) ch.dir = -1;
      if (ch.x < u * 8)     ch.dir = 1;
      ch.ft++;
      if (ch.ft > 9) { ch.ft = 0; ch.frame ^= 1; }
    }

    /* auto-speak */
    autoTimer++;
    if (ch.sayT <= 0 && autoTimer > 840) {
      ch.sayS = LINES[(Math.random() * LINES.length) | 0];
      ch.sayT = 80;
      autoTimer = 0;
      SND.say(ch.sayS);
    }

    /* jump physics */
    if (!ch.grounded) {
      ch.y += ch.vy;
      ch.vy += 0.55;
      if (ch.y >= 0) { ch.y = 0; ch.vy = 0; ch.grounded = true; }
    }

    const bob = ch.grounded ? Math.sin(f * 8) * 1.5 : 0;
    const mat = ch.frame ? FB : FR;
    const oy  = gt - 14 * u + ch.y - bob;

    /* shadow */
    x.fillStyle = 'rgba(0,0,0,0.16)';
    x.beginPath(); x.ellipse(ch.x, gt + u * 1.2, u * 5, u * 1.1, 0, 0, 7); x.fill();

    drawSprite(x, mat, ch.x - 5.5 * u, oy, u, ch.dir < 0);

    /* speech bubble */
    if (ch.sayT > 0) {
      ch.sayT--;
      x.font = "9px 'Press Start 2P',monospace";
      const tw = x.measureText(ch.sayS).width;
      const bw = tw + 16, bh = 22;
      const bx = Math.max(6, Math.min(W - bw - 6, ch.x - bw / 2));
      const by = oy - bh - 10;
      x.fillStyle = '#1d1410'; x.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      x.fillStyle = '#fbf6ec'; x.fillRect(bx, by, bw, bh);
      x.fillStyle = '#1d1410'; x.fillRect(ch.x - 3, by + bh, 6, 5);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(ch.sayS, bx + bw / 2, by + bh / 2);
    }

    requestAnimationFrame(frame);
  }

  /* --- start --- */
  REFIT.push(build);
  build();
  requestAnimationFrame(frame);

  let to;
  addEventListener('resize', () => { clearTimeout(to); to = setTimeout(build, 200); });
}

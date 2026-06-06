/**
 * Hero section — animated pixel sky, clouds, birds, flowers,
 * roaming & clickable mascot with speech bubbles.
 *
 * This module is fully self-contained. The render loop handles its own
 * canvas sizing, world generation, and error recovery. It does NOT
 * depend on external resize events, REFIT, or canvasVis.
 */

import { drawSprite, FR, FB } from './sprite.js';
import { SND }                from './sound.js';

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

  /* --- state --- */
  let W = 0, H = 0, u = 4, gt = 0;
  let clouds = [], spark = [], flowers = [], birds = [];
  let ch = null;
  let autoTimer = 0;

  /**
   * Ensure the canvas buffer matches its CSS display size.
   * Returns true if the world needs to be regenerated (first call or resize).
   * Returns false if nothing changed (most frames).
   */
  function ensureSize() {
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;

    if (cssW < 1 || cssH < 1) return false;

    const bufW = Math.round(cssW * dpr);
    const bufH = Math.round(cssH * dpr);

    let resized = false;
    if (cv.width !== bufW || cv.height !== bufH) {
      cv.width  = bufW;
      cv.height = bufH;
      resized = true;
    }

    /* Always re-apply the DPR transform.
       Setting cv.width/height resets ALL context state including the
       transform matrix. Even when we skip the reset, re-applying is
       cheap insurance (~0.001ms) against any external state corruption. */
    const ctx = cv.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }

    /* Detect if the CSS dimensions changed (independent of buffer) */
    const dimChanged = (cssW !== W || cssH !== H);
    if (dimChanged || !ch) {
      W  = cssW;
      H  = cssH;
      u  = Math.max(3, Math.min(6, Math.round(W / 240)));
      gt = H * 0.81;
      return true;   /* world needs rebuild */
    }

    return false;
  }

  /** Regenerate all world objects for current W/H/u/gt. */
  function buildWorld() {
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

    spark = [];
    for (let i = 0; i < 18; i++) {
      spark.push({ x: Math.random() * W, y: Math.random() * H * 0.55, ph: Math.random() * 6.28 });
    }

    flowers = [];
    for (let i = 0; i < Math.floor(W / 60); i++) {
      flowers.push({
        x: Math.random() * W,
        c: FLOWER_COLOURS[(Math.random() * FLOWER_COLOURS.length) | 0],
        ph: Math.random() * 6.28,
        size: 0.6 + Math.random() * 0.5
      });
    }

    birds = [];

    if (!ch) {
      ch = { x: W * 0.5, dir: 1, frame: 0, ft: 0, vy: 0, y: 0, grounded: true, sayT: 0, sayS: '' };
    } else {
      ch.x = Math.max(u * 8, Math.min(W - u * 8, ch.x));
    }
  }

  /* --- draw helpers --- */
  function drawCloud(ctx, mat, ox, oy, un) {
    for (let r = 0; r < mat.length; r++)
      for (let i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  /* --- click interaction --- */
  cv.addEventListener('click', function(e) {
    if (!ch) return;
    var r  = cv.getBoundingClientRect();
    var cx = e.clientX - r.left;
    if (Math.abs(cx - ch.x) < u * 12) {
      if (ch.grounded) { ch.vy = -7.5; ch.grounded = false; }
      ch.sayS = LINES[(Math.random() * LINES.length) | 0];
      ch.sayT = 80;
      autoTimer = 0;
      SND.say(ch.sayS);
      SND.blip();
    }
  });

  /* ================================================================
     ANIMATION LOOP
     ================================================================
     requestAnimationFrame is called FIRST, before any drawing.
     This guarantees the loop can never die — even if a drawing
     operation throws, the next frame is already scheduled.
     All drawing is wrapped in try-catch as a safety net.
     ================================================================ */
  function frame() {
    /* Schedule next frame FIRST — loop can never die */
    requestAnimationFrame(frame);

    /* Self-size: check canvas dimensions every frame.
       On most frames this is a no-op (< 0.01ms).
       On resize it rebuilds the world. */
    var needsBuild = ensureSize();
    if (needsBuild) buildWorld();

    /* Bail if canvas isn't ready yet */
    if (W < 1 || !ch) return;

    var ctx = cv.getContext('2d');
    if (!ctx) return;

    try {
      /* Re-apply transform (belt-and-suspenders) */
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var f = Date.now() / 1000;

      /* --- sky gradient --- */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0,    '#4aa8e3');
      g.addColorStop(0.5,  '#7cc6ee');
      g.addColorStop(0.75, '#a5daf5');
      g.addColorStop(1,    '#c8ecfb');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      /* --- sun with pulsing glow --- */
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

      /* --- sparkles --- */
      for (var si = 0; si < spark.length; si++) {
        var s = spark[si];
        var tw = 0.25 + 0.65 * Math.abs(Math.sin(f * 2.5 + s.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
        ctx.fillRect(s.x, s.y, u * 0.7, u * 0.7);
        ctx.fillRect(s.x - u * 0.6, s.y + u * 0.15, u * 0.4, u * 0.4);
        ctx.fillRect(s.x + u * 0.8, s.y + u * 0.15, u * 0.4, u * 0.4);
        ctx.fillRect(s.x + u * 0.15, s.y - u * 0.5, u * 0.4, u * 0.4);
        ctx.fillRect(s.x + u * 0.15, s.y + u * 0.8, u * 0.4, u * 0.4);
      }

      /* --- clouds --- */
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci];
        cl.x -= cl.sp;
        if (cl.x < -cl.shape[0].length * cl.sc) cl.x = W + 20 + Math.random() * 40;
        ctx.globalAlpha = cl.a;
        drawCloud(ctx, cl.shape, cl.x, cl.y, cl.sc);
      }
      ctx.globalAlpha = 1;

      /* --- birds --- */
      for (var bi = birds.length - 1; bi >= 0; bi--) {
        var b = birds[bi];
        b.x += b.vx;
        b.py += Math.sin(f * 3 + b.ph) * 0.15;
        var wing = Math.sin(f * 8 + b.ph) * u * 0.8;
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(b.x - u * 0.8, b.py - wing, u * 0.5, u * 0.5);
        ctx.fillRect(b.x, b.py, u * 0.5, u * 0.5);
        ctx.fillRect(b.x + u * 0.8, b.py - wing, u * 0.5, u * 0.5);
        if (b.x < -30 || b.x > W + 30) birds.splice(bi, 1);
      }
      if (birds.length < 3 && Math.random() < 0.003) {
        var left = Math.random() > 0.5;
        birds.push({
          x: left ? -20 : W + 20,
          py: 20 + Math.random() * H * 0.3,
          vx: left ? (0.3 + Math.random() * 0.5) : -(0.3 + Math.random() * 0.5),
          ph: Math.random() * 6.28
        });
      }

      /* --- grass --- */
      ctx.fillStyle = '#69b24a';
      ctx.fillRect(0, gt, W, H - gt);
      ctx.fillStyle = '#5aa03e';
      for (var gi = 0; gi < W; gi += u * 2) ctx.fillRect(gi, gt, u, u);
      ctx.fillStyle = '#7bc75a';
      for (var gi2 = 0; gi2 < W; gi2 += u * 5) {
        var sway = Math.sin(f * 2 + gi2 * 0.1) * u * 0.3;
        ctx.fillRect(gi2 + sway, gt - u * 0.7, u * 0.5, u * 0.7);
      }

      /* --- flowers --- */
      for (var fi = 0; fi < flowers.length; fi++) {
        var fl = flowers[fi];
        var fsway = Math.sin(f * 1.8 + fl.ph) * u * 0.4;
        var sz = u * fl.size;
        ctx.fillStyle = '#4a9639';
        ctx.fillRect(fl.x, gt - sz * 0.5, u * 0.4, sz * 0.6);
        ctx.fillStyle = fl.c;
        ctx.fillRect(fl.x + fsway - sz * 0.3, gt - sz * 1.2, sz * 0.5, sz * 0.5);
        ctx.fillRect(fl.x + fsway + sz * 0.2, gt - sz * 1.2, sz * 0.5, sz * 0.5);
        ctx.fillRect(fl.x + fsway - sz * 0.05, gt - sz * 1.5, sz * 0.5, sz * 0.5);
        ctx.fillStyle = '#ffd64a';
        ctx.fillRect(fl.x + fsway, gt - sz * 1.15, sz * 0.35, sz * 0.35);
      }

      /* --- dirt --- */
      ctx.fillStyle = '#7d4e2c';
      ctx.fillRect(0, gt + u * 2.2, W, H - (gt + u * 2.2));
      ctx.fillStyle = '#6a4023';
      var doff = (f * 8) % (u * 4);
      for (var di = doff; di < W; di += u * 4) {
        ctx.fillRect(di, gt + u * 4, u, u);
        ctx.fillRect(di + u * 2, gt + u * 7, u, u);
      }

      /* --- character walk --- */
      if (ch.grounded) {
        ch.x += ch.dir * 0.55 * u;
        if (ch.x > W - u * 8) ch.dir = -1;
        if (ch.x < u * 8)     ch.dir = 1;
        ch.ft++;
        if (ch.ft > 9) { ch.ft = 0; ch.frame ^= 1; }
      }

      /* --- auto-speak --- */
      autoTimer++;
      if (ch.sayT <= 0 && autoTimer > 840) {
        ch.sayS = LINES[(Math.random() * LINES.length) | 0];
        ch.sayT = 80;
        autoTimer = 0;
        SND.say(ch.sayS);
      }

      /* --- jump physics --- */
      if (!ch.grounded) {
        ch.y += ch.vy;
        ch.vy += 0.55;
        if (ch.y >= 0) { ch.y = 0; ch.vy = 0; ch.grounded = true; }
      }

      var bob = ch.grounded ? Math.sin(f * 8) * 1.5 : 0;
      var mat = ch.frame ? FB : FR;
      var oy  = gt - 14 * u + ch.y - bob;

      /* --- shadow --- */
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath(); ctx.ellipse(ch.x, gt + u * 1.2, u * 5, u * 1.1, 0, 0, 7); ctx.fill();

      /* --- sprite --- */
      drawSprite(ctx, mat, ch.x - 5.5 * u, oy, u, ch.dir < 0);

      /* --- speech bubble --- */
      if (ch.sayT > 0) {
        ch.sayT--;
        ctx.font = "9px 'Press Start 2P',monospace";
        var mtw = ctx.measureText(ch.sayS).width;
        var bw = mtw + 16, bh = 22;
        var bx = Math.max(6, Math.min(W - bw - 6, ch.x - bw / 2));
        var by = oy - bh - 10;
        ctx.fillStyle = '#1d1410'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
        ctx.fillStyle = '#fbf6ec'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#1d1410'; ctx.fillRect(ch.x - 3, by + bh, 6, 5);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ch.sayS, bx + bw / 2, by + bh / 2);
      }

    } catch (e) {
      /* Drawing error — loop continues on next frame.
         Log for debugging but never let it kill the loop. */
      if (typeof console !== 'undefined') console.warn('Hero frame error:', e);
    }
  }

  /* --- start the self-contained loop --- */
  requestAnimationFrame(frame);
}

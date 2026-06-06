/**
 * Hero section — animated pixel sky, clouds, birds, flowers,
 * roaming & clickable mascot with speech bubbles.
 *
 * Architecture:
 *   - Dimensions are read ONCE at startup, then ONLY via ResizeObserver.
 *     No per-frame getBoundingClientRect (eliminates layout thrashing).
 *   - rAF is scheduled at the TOP of frame() so the loop never dies.
 *   - All drawing is wrapped in try-catch.
 *   - Context state (transform, globalAlpha) is fully reset every frame.
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

const FLOWER_COLOURS = ['#ff6b8a', '#ffb347', '#ff85c0', '#ffd64a', '#ff7eb3', '#e8a0ff'];

export function initHero() {
  var cv = document.getElementById('heroCanvas');
  if (!cv) return;

  /* --- mutable state --- */
  var W = 0, H = 0, u = 4, gt = 0;
  var clouds = [], spark = [], flowers = [], birds = [];
  var ch = null;
  var autoTimer = 0;

  /* ================================================================
     SIZING — event-driven, not polled
     ================================================================ */

  /**
   * Apply new CSS dimensions.  Only rebuilds the world if the size
   * actually changed.  Called from ResizeObserver and initial setup.
   */
  function applySize(cssW, cssH) {
    if (cssW < 1 || cssH < 1) return;

    /* Round to integers — prevents float-precision flip-flopping */
    cssW = Math.round(cssW);
    cssH = Math.round(cssH);

    if (cssW === W && cssH === H && ch) return; /* nothing changed */

    W  = cssW;
    H  = cssH;
    u  = Math.max(3, Math.min(6, Math.round(W / 240)));
    gt = H * 0.81;

    /* Set canvas buffer to match at device pixel ratio */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bufW = Math.round(cssW * dpr);
    var bufH = Math.round(cssH * dpr);
    if (cv.width !== bufW || cv.height !== bufH) {
      cv.width  = bufW;
      cv.height = bufH;
    }

    buildWorld();
  }

  /**
   * Read current CSS dimensions from the element.
   * Only called at startup and as a fallback — normal resizes go
   * through ResizeObserver which provides dimensions directly.
   */
  function readSize() {
    var rect = cv.getBoundingClientRect();
    applySize(rect.width, rect.height);
  }

  /* Initial sizing — runs once, synchronously */
  readSize();

  /* ResizeObserver for all subsequent dimension changes.
     This fires on window resize, font-load layout shifts, scrollbar
     appearance, etc. — WITHOUT per-frame polling. */
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        var cr = entries[i].contentRect;
        applySize(cr.width, cr.height);
      }
    });
    ro.observe(cv);
  } else {
    /* Fallback for very old browsers */
    window.addEventListener('resize', function() {
      readSize();
    });
  }

  /* Also re-check after fonts load (can trigger layout shift) */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() { readSize(); });
  }

  /* ================================================================
     WORLD GENERATION
     ================================================================ */

  function buildWorld() {
    clouds = [];
    var nc = W < 700 ? 5 : 9;
    for (var i = 0; i < nc; i++) {
      var ly = Math.random();
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
    for (var i = 0; i < 18; i++) {
      spark.push({ x: Math.random() * W, y: Math.random() * H * 0.55, ph: Math.random() * 6.28 });
    }

    flowers = [];
    for (var i = 0; i < Math.floor(W / 60); i++) {
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

  /* ================================================================
     DRAW HELPERS
     ================================================================ */

  function drawCloud(ctx, mat, ox, oy, un) {
    for (var r = 0; r < mat.length; r++)
      for (var i = 0; i < mat[r].length; i++) {
        if (mat[r][i] !== 'X') continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(ox + i * un), Math.floor(oy + r * un), Math.ceil(un), Math.ceil(un));
      }
  }

  /* ================================================================
     CLICK INTERACTION
     ================================================================ */

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
     1. rAF is FIRST — loop can never die
     2. Context state (transform, alpha) is fully reset every frame
     3. All drawing is in try-catch — errors never kill the loop
     4. NO dimension polling — sizes come from ResizeObserver
     ================================================================ */

  function frame() {
    requestAnimationFrame(frame);

    if (W < 1 || !ch) return;

    var ctx = cv.getContext('2d');
    if (!ctx) return;

    try {
      /* === RESET CONTEXT STATE ===
         This is critical: transform and globalAlpha MUST be set to
         known-good values at the start of every frame.  If a previous
         frame threw an error mid-draw (e.g. during clouds where
         globalAlpha was set to 0.6), these values would persist and
         corrupt all subsequent rendering permanently. */
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;

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
      ctx.globalAlpha = 1;  /* reset after clouds */

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
        var bLeft = Math.random() > 0.5;
        birds.push({
          x: bLeft ? -20 : W + 20,
          py: 20 + Math.random() * H * 0.3,
          vx: bLeft ? (0.3 + Math.random() * 0.5) : -(0.3 + Math.random() * 0.5),
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
        var gsway = Math.sin(f * 2 + gi2 * 0.1) * u * 0.3;
        ctx.fillRect(gi2 + gsway, gt - u * 0.7, u * 0.5, u * 0.7);
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

      /* --- character --- */
      if (ch.grounded) {
        ch.x += ch.dir * 0.55 * u;
        if (ch.x > W - u * 8) ch.dir = -1;
        if (ch.x < u * 8)     ch.dir = 1;
        ch.ft++;
        if (ch.ft > 9) { ch.ft = 0; ch.frame ^= 1; }
      }

      autoTimer++;
      if (ch.sayT <= 0 && autoTimer > 840) {
        ch.sayS = LINES[(Math.random() * LINES.length) | 0];
        ch.sayT = 80;
        autoTimer = 0;
        SND.say(ch.sayS);
      }

      if (!ch.grounded) {
        ch.y += ch.vy;
        ch.vy += 0.55;
        if (ch.y >= 0) { ch.y = 0; ch.vy = 0; ch.grounded = true; }
      }

      var bob = ch.grounded ? Math.sin(f * 8) * 1.5 : 0;
      var mat = ch.frame ? FB : FR;
      var oy  = gt - 14 * u + ch.y - bob;

      /* shadow */
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath(); ctx.ellipse(ch.x, gt + u * 1.2, u * 5, u * 1.1, 0, 0, 7); ctx.fill();

      /* sprite */
      drawSprite(ctx, mat, ch.x - 5.5 * u, oy, u, ch.dir < 0);

      /* speech bubble */
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
      /* Error in drawing — log but never kill the loop.
         Next frame starts with a full context reset so
         even corrupted state (wrong alpha, bad transform)
         is cleaned up automatically. */
      if (typeof console !== 'undefined') console.warn('Hero frame error:', e);
    }
  }

  /* --- kick off --- */
  requestAnimationFrame(frame);
}

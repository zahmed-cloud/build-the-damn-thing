/**
 * "Build an Agent" — retro tool palette, belt, stage canvas, run animation.
 */

import { drawSprite, FR }        from './sprite.js';
import { fitCanvas, canvasVis }  from './canvas.js';
import { GAME, toast, achieve, REFIT } from './state.js';
import { SND }                   from './sound.js';

/* Retro pixel-text icons instead of modern emoji */
var TOOLS = [
  { id: 'lead',   ic: '\u00bb',  n: 'New Lead',    k: 'trigger', log: 'trigger fired: new lead came in from the website form' },
  { id: 'mail',   ic: '@',       n: 'New Email',   k: 'trigger', log: 'trigger fired: a new email just hit the inbox' },
  { id: 'brain',  ic: '\u00ab\u00bb', n: 'AI Brain', k: 'agent', log: 'agent thinking: reading it, working out intent and the next move' },
  { id: 'scrape', ic: '??',      n: 'Scrape Web',  k: 'tool',    log: 'tool: scraped the web and pulled the matching info' },
  { id: 'send',   ic: '\u21e8',  n: 'Send Email',  k: 'tool',    log: 'tool: drafted and sent a reply in about 3 seconds' },
  { id: 'book',   ic: '##',      n: 'Book Slot',   k: 'tool',    log: 'tool: checked the calendar and booked tue 2pm' },
  { id: 'slack',  ic: '..',      n: 'Ping Team',   k: 'tool',    log: 'tool: pinged the team on slack with the details' },
  { id: 'crm',    ic: '+=',      n: 'Update CRM',  k: 'tool',    log: 'tool: logged the whole thing in the crm' },
  { id: 'ship',   ic: '!!',      n: 'Ship It',     k: 'output',  log: 'done: agent is live and running on its own now' }
];

var KCOL = { trigger: '#ffd64a', agent: '#34a96a', tool: '#9fd0ef', output: '#e0603a' };

export function initBuildGame() {
  var paletteEl = document.getElementById('palette');
  if (!paletteEl) return;

  var beltEl  = document.getElementById('belt');
  var logEl   = document.getElementById('playResult');
  var btnRun  = document.getElementById('btnRun');
  var btnClear = document.getElementById('btnClear');
  var cv      = document.getElementById('stageCanvas');

  var byId = {};
  TOOLS.forEach(function(t) { byId[t.id] = t; });
  var belt = [], running = false, builds = 0;

  /* --- palette buttons --- */
  TOOLS.forEach(function(t) {
    var d = document.createElement('div');
    d.className = 'tool';
    d.dataset.kind = t.k;
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.innerHTML = '<span class="ti">' + t.ic + '</span><span class="tn">' + t.n + '</span>';

    function add() {
      if (running) return;
      if (belt.length >= 6) { flash('agent is full mate, hit run \u2192'); return; }
      belt.push(t.id);
      renderBelt();
      say('+ ' + t.n.split(' ')[0]);
      SND.add();
    }
    d.onclick = add;
    d.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(); } };
    paletteEl.appendChild(d);
  });

  /* --- belt rendering --- */
  function renderBelt() {
    beltEl.innerHTML = '';
    if (!belt.length) {
      beltEl.innerHTML = '<div class="belt-empty">tap tools to chain them \u2192 (start with a trigger)</div>';
      return;
    }
    belt.forEach(function(id, i) {
      var t = byId[id];
      if (i) { var a = document.createElement('span'); a.className = 'belt-arrow'; a.textContent = '\u25b8'; beltEl.appendChild(a); }
      var b = document.createElement('div');
      b.className = 'belt-block';
      b.innerHTML = '<span class="bi">' + t.ic + '</span><span class="bn">' + t.n + '</span>';
      b.title = 'click to remove';
      b.onclick = function() { if (running) return; belt.splice(i, 1); renderBelt(); SND.tick(); };
      beltEl.appendChild(b);
    });
  }

  /* --- log helpers --- */
  function flash(m) { logEl.innerHTML = '<span class="lg lg-warn">' + m + '</span>'; SND.bad(); }
  function logline(c, t) { var d = document.createElement('div'); d.className = 'lg ' + c; d.textContent = t; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; }

  /* --- controls --- */
  btnClear.onclick = function() { if (running) return; belt = []; renderBelt(); logEl.innerHTML = ''; SND.blip(); };

  btnRun.onclick = function() {
    if (running) return;
    if (!belt.length) { flash('pick some tools first ya muppet'); return; }
    if (!belt.some(function(id) { return byId[id].k === 'trigger'; })) {
      flash('oi, an agent needs a trigger to kick off. add New Lead or New Email first');
      return;
    }
    running = true;
    logEl.innerHTML = '';
    logline('lg-head', '\u25b8 RUNNING AGENT...');
    SND.blip();

    var blocks = [].slice.call(beltEl.querySelectorAll('.belt-block'));
    var i = 0;
    var step = function() {
      if (i > 0 && blocks[i - 1]) blocks[i - 1].classList.remove('firing');
      if (i < blocks.length) {
        blocks[i].classList.add('firing');
        var t = byId[belt[i]];
        logline('lg-' + t.k, t.log);
        spawnPacket(t.k);
        hop();
        SND.blip();
        i++;
        setTimeout(step, 580);
      } else {
        finish();
      }
    };
    setTimeout(step, 280);
  };

  function finish() {
    beltEl.querySelectorAll('.belt-block').forEach(function(b) { b.classList.remove('firing'); });
    var hasBrain = belt.some(function(id) { return byId[id].k === 'agent'; });
    var amt = 120 + ((Math.random() * 680) | 0);
    var lv = GAME.lvlUp();
    GAME.addCash(amt);
    builds++;

    if (hasBrain) logline('lg-good', '\u2713 thats a proper agent. it got triggered, thought for itself, used its tools and shipped. +$' + amt + ' (pretend)');
    else logline('lg-warn', '\u2713 it ran, but with no AI Brain thats just a dumb workflow, not a real agent. chuck a brain in so it can actually think. +$' + amt + ' (pretend)');

    burst();
    var ln = ['shipped!', 'too easy', 'built different', 'sending it', 'boom', 'lets go'][(Math.random() * 6) | 0];
    say(ln);
    SND.win();
    if (builds === 1) achieve('first_agent', 'FIRST AGENT SHIPPED');
    else toast('AGENT SHIPPED \u2014 +' + amt + ' XP');
    running = false;
  }

  /* --- stage canvas --- */
  var W = 0, H = 0, u = 4;
  var bot = { y: 0, vy: 0, grounded: true };
  var conf = [], pk = [];
  var sayT = 0, sayS = '';

  function buildc() {
    var m = fitCanvas(cv);
    if (!m.ok) { setTimeout(buildc, 120); return; }
    W = m.w; H = m.h;
    u = Math.max(4, Math.min(8, Math.round(H / 22)));
  }

  function hop()  { if (bot.grounded) { bot.vy = -7; bot.grounded = false; } }
  function say(t) { sayS = t; sayT = 70; }

  function spawnPacket(k) {
    pk.push({ t: 0, y: H * 0.4 + (Math.random() * 8 - 4), c: KCOL[k] || '#f2ede1', done: false });
  }

  function miniBurst(px, py) {
    for (var i = 0; i < 18; i++) {
      conf.push({ x: px, y: py, vx: (Math.random() - .5) * 6, vy: -Math.random() * 6 - 1,
        c: ['#e0603a', '#f2ede1', '#34a96a', '#ffd64a'][(Math.random() * 4) | 0], life: 35 + Math.random() * 20 });
    }
  }

  function burst() {
    for (var i = 0; i < 100; i++) {
      conf.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.6, y: H / 2,
        vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 2,
        c: ['#e0603a', '#f2ede1', '#34a96a', '#ffd64a', '#6ec6f0', '#ff85c0'][(Math.random() * 6) | 0],
        life: 65 + Math.random() * 45 });
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!canvasVis.stageCanvas || W < 1) return;

    var x = cv.getContext('2d');
    if (!x) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.globalAlpha = 1;
    x.clearRect(0, 0, W, H);

    var f = Date.now() / 1000;
    var gy = H - u * 1.5;

    /* ground line */
    x.fillStyle = '#352b27'; x.fillRect(0, gy, W, u);

    /* ambient grid lines for tech feel */
    x.strokeStyle = 'rgba(224,96,58,0.04)';
    x.lineWidth = 1;
    for (var gi = 0; gi < W; gi += 40) { x.beginPath(); x.moveTo(gi, 0); x.lineTo(gi, gy); x.stroke(); }
    for (var gj = 0; gj < gy; gj += 40) { x.beginPath(); x.moveTo(0, gj); x.lineTo(W, gj); x.stroke(); }

    /* packets with trail effect */
    pk.forEach(function(p) {
      p.t += 0.045;
      var px = 10 + (W / 2 - 10) * Math.min(1, p.t);
      /* motion trail */
      x.globalAlpha = 0.12; x.fillStyle = p.c;
      x.fillRect(px - u * 5, p.y + u * 0.2, u * 2, u * 0.9);
      x.globalAlpha = 0.3;
      x.fillRect(px - u * 2.5, p.y, u * 1.5, u * 1.3);
      x.globalAlpha = 1;
      /* glow */
      x.fillStyle = p.c;
      x.shadowColor = p.c; x.shadowBlur = 12;
      x.fillRect(px, p.y, u * 1.5, u * 1.5);
      x.shadowBlur = 0;
      if (p.t >= 1 && !p.done) { p.done = true; hop(); miniBurst(W / 2, p.y); SND.tick(); }
    });
    pk = pk.filter(function(p) { return p.t < 1.2; });

    /* bot */
    if (!bot.grounded) { bot.y += bot.vy; bot.vy += 0.55; if (bot.y >= 0) { bot.y = 0; bot.vy = 0; bot.grounded = true; } }
    var bob = bot.grounded ? Math.sin(f * 5) * 1.2 : 0;
    var bx = W / 2, oy = gy - 14 * u + bot.y - bob;
    x.fillStyle = 'rgba(0,0,0,0.2)'; x.beginPath(); x.ellipse(bx, gy, u * 5, u, 0, 0, 7); x.fill();
    drawSprite(x, FR, bx - 5.5 * u, oy, u, false);

    /* speech bubble */
    if (sayT > 0) {
      sayT--;
      x.font = "8px 'Press Start 2P',monospace";
      var tw = x.measureText(sayS).width, bw = tw + 16, bh = 20;
      var bxb = bx - bw / 2, byb = oy - bh - 8;
      x.fillStyle = '#1d1410'; x.fillRect(bxb - 2, byb - 2, bw + 4, bh + 4);
      x.fillStyle = '#fbf6ec'; x.fillRect(bxb, byb, bw, bh);
      x.fillStyle = '#1d1410'; x.fillRect(bx - 3, byb + bh, 6, 5);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(sayS, bx, byb + bh / 2);
    }

    /* confetti */
    conf.forEach(function(p) {
      p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.life--;
      x.globalAlpha = Math.max(0, p.life / 65);
      x.fillStyle = p.c;
      x.fillRect(p.x, p.y, u * 0.9, u * 0.9);
    });
    x.globalAlpha = 1;
    conf = conf.filter(function(p) { return p.life > 0 && p.y < H + 20; });
  }

  /* --- start --- */
  buildc();
  renderBelt();
  say('tap a tool!');
  requestAnimationFrame(frame);
  REFIT.push(buildc);

  var to;
  addEventListener('resize', function() { clearTimeout(to); to = setTimeout(buildc, 200); });
}

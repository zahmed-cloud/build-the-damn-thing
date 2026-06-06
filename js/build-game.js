/**
 * "Build an Agent" — tool palette, belt, stage canvas, run animation.
 */

import { drawSprite, FR }        from './sprite.js';
import { fitCanvas, canvasVis }  from './canvas.js';
import { GAME, toast, REFIT }    from './state.js';
import { SND }                   from './sound.js';

const TOOLS = [
  { id: 'lead',   ic: '\u26a1',          n: 'New Lead',   k: 'trigger', log: 'trigger fired: new lead came in from the website form' },
  { id: 'mail',   ic: '\ud83d\udce9',    n: 'New Email',  k: 'trigger', log: 'trigger fired: a new email just hit the inbox' },
  { id: 'brain',  ic: '\ud83e\udde0',    n: 'AI Brain',   k: 'agent',   log: 'agent thinking: reading it, working out intent and the next move' },
  { id: 'scrape', ic: '\ud83d\udd0e',    n: 'Scrape Web',  k: 'tool',    log: 'tool: scraped the web and pulled the matching info' },
  { id: 'send',   ic: '\u2709\ufe0f',    n: 'Send Email',  k: 'tool',    log: 'tool: drafted and sent a reply in about 3 seconds' },
  { id: 'book',   ic: '\ud83d\udcc5',    n: 'Book Slot',   k: 'tool',    log: 'tool: checked the calendar and booked tue 2pm' },
  { id: 'slack',  ic: '\ud83d\udcac',    n: 'Ping Team',   k: 'tool',    log: 'tool: pinged the team on slack with the details' },
  { id: 'crm',    ic: '\ud83d\uddc2\ufe0f', n: 'Update CRM', k: 'tool', log: 'tool: logged the whole thing in the crm' },
  { id: 'ship',   ic: '\ud83d\ude80',    n: 'Ship It',     k: 'output',  log: 'done: agent is live and running on its own now' }
];

const KCOL = { trigger: '#ffd64a', agent: '#34a96a', tool: '#9fd0ef', output: '#e0603a' };

export function initBuildGame() {
  const paletteEl = document.getElementById('palette');
  if (!paletteEl) return;

  const beltEl  = document.getElementById('belt');
  const logEl   = document.getElementById('playResult');
  const btnRun  = document.getElementById('btnRun');
  const btnClear = document.getElementById('btnClear');
  const cv      = document.getElementById('stageCanvas');

  const byId = Object.fromEntries(TOOLS.map(t => [t.id, t]));
  let belt = [], running = false, builds = 0;

  /* --- palette buttons --- */
  TOOLS.forEach(t => {
    const d = document.createElement('div');
    d.className = 'tool';
    d.dataset.kind = t.k;
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.innerHTML = `<span class="ti">${t.ic}</span><span class="tn">${t.n}</span>`;

    function add() {
      if (running) return;
      if (belt.length >= 6) { flash('agent is full mate, hit run \u2192'); return; }
      belt.push(t.id);
      renderBelt();
      say('+ ' + t.n.split(' ')[0]);
      SND.add();
    }
    d.onclick = add;
    d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(); } };
    paletteEl.appendChild(d);
  });

  /* --- belt rendering --- */
  function renderBelt() {
    beltEl.innerHTML = '';
    if (!belt.length) {
      beltEl.innerHTML = '<div class="belt-empty">tap tools to chain them \u2192 (start with a trigger)</div>';
      return;
    }
    belt.forEach((id, i) => {
      const t = byId[id];
      if (i) { const a = document.createElement('span'); a.className = 'belt-arrow'; a.textContent = '\u25b8'; beltEl.appendChild(a); }
      const b = document.createElement('div');
      b.className = 'belt-block';
      b.innerHTML = `<span class="bi">${t.ic}</span><span class="bn">${t.n}</span>`;
      b.title = 'click to remove';
      b.onclick = () => { if (running) return; belt.splice(i, 1); renderBelt(); SND.blip(); };
      beltEl.appendChild(b);
    });
  }

  /* --- log helpers --- */
  function flash(m)      { logEl.innerHTML = `<span class="lg lg-warn">${m}</span>`; SND.bad(); }
  function logline(c, t) { const d = document.createElement('div'); d.className = 'lg ' + c; d.textContent = t; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; }

  /* --- controls --- */
  btnClear.onclick = () => { if (running) return; belt = []; renderBelt(); logEl.innerHTML = ''; SND.blip(); };

  btnRun.onclick = () => {
    if (running) return;
    if (!belt.length) { flash('pick some tools first ya muppet'); say('pick tools!'); return; }
    if (!belt.some(id => byId[id].k === 'trigger')) {
      flash('oi, an agent needs a trigger to kick off. add New Lead or New Email first');
      say('needs a trigger!');
      return;
    }
    running = true;
    logEl.innerHTML = '';
    logline('lg-head', '\u25b8 RUNNING AGENT...');
    SND.blip();

    const blocks = [...beltEl.querySelectorAll('.belt-block')];
    let i = 0;
    const step = () => {
      if (i > 0 && blocks[i - 1]) blocks[i - 1].classList.remove('firing');
      if (i < blocks.length) {
        blocks[i].classList.add('firing');
        const t = byId[belt[i]];
        logline('lg-' + t.k, t.log);
        spawnPacket(t.k);
        hop();
        SND.blip();
        i++;
        setTimeout(step, 640);
      } else {
        finish();
      }
    };
    setTimeout(step, 320);
  };

  function finish() {
    beltEl.querySelectorAll('.belt-block').forEach(b => b.classList.remove('firing'));
    const hasBrain = belt.some(id => byId[id].k === 'agent');
    const amt = 120 + ((Math.random() * 680) | 0);
    const lv = GAME.lvlUp();
    GAME.addCash(amt);
    builds++;

    if (hasBrain) logline('lg-good', '\u2713 thats a proper agent. it got triggered, thought for itself, used its tools and shipped. +$' + amt + ' (pretend)');
    else logline('lg-warn', '\u2713 it ran, but with no AI Brain thats just a dumb workflow, not a real agent. chuck a brain in so it can actually think. +$' + amt + ' (pretend)');

    burst();
    const ln = ['shipped!','too easy','built different','sending it','boom','no cap'][(Math.random() * 6) | 0];
    say(ln); SND.win(); SND.say(ln);
    toast(builds === 1 ? 'ACHIEVEMENT \u2014 FIRST AGENT SHIPPED' : 'AGENT SHIPPED \u2014 LV ' + String(lv).padStart(2, '0'));
    running = false;
  }

  /* --- stage canvas --- */
  let W = 0, H = 0, u = 4;
  let bot = { y: 0, vy: 0, grounded: true };
  let conf = [], pk = [];
  let sayT = 0, sayS = '';

  function buildc() {
    const m = fitCanvas(cv);
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
    for (let i = 0; i < 14; i++) {
      conf.push({ x: px, y: py, vx: (Math.random() - .5) * 5, vy: -Math.random() * 5 - 1,
        c: ['#e0603a','#f2ede1','#34a96a','#ffd64a'][(Math.random() * 4) | 0], life: 30 + Math.random() * 20 });
    }
  }

  function burst() {
    for (let i = 0; i < 90; i++) {
      conf.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.5, y: H / 2,
        vx: (Math.random() - .5) * 10, vy: -Math.random() * 10 - 2,
        c: ['#e0603a','#f2ede1','#34a96a','#ffd64a','#6ec6f0','#ff85c0'][(Math.random() * 6) | 0],
        life: 60 + Math.random() * 40 });
    }
  }

  function frame() {
    if (!canvasVis.stageCanvas || W < 1) { requestAnimationFrame(frame); return; }

    const x = cv.getContext('2d');
    x.clearRect(0, 0, W, H);
    const f = Date.now() / 1000;
    const gy = H - u * 1.5;

    x.fillStyle = '#352b27'; x.fillRect(0, gy, W, u);

    /* packets */
    pk.forEach(p => {
      p.t += 0.05;
      const px = 10 + (W / 2 - 10) * Math.min(1, p.t);
      x.globalAlpha = 0.2; x.fillStyle = p.c;
      x.fillRect(px - u * 3, p.y + u * 0.3, u * 1.5, u * 0.8);
      x.globalAlpha = 0.5;
      x.fillRect(px - u * 1.6, p.y, u * 1.2, u * 1.2);
      x.globalAlpha = 1;
      x.fillRect(px, p.y, u * 1.5, u * 1.5);
      if (p.t >= 1 && !p.done) { p.done = true; hop(); miniBurst(W / 2, p.y); }
    });
    pk = pk.filter(p => p.t < 1.2);

    /* bot */
    if (!bot.grounded) { bot.y += bot.vy; bot.vy += 0.55; if (bot.y >= 0) { bot.y = 0; bot.vy = 0; bot.grounded = true; } }
    const bob = bot.grounded ? Math.sin(f * 5) * 1.2 : 0;
    const bx = W / 2, oy = gy - 14 * u + bot.y - bob;
    x.fillStyle = 'rgba(0,0,0,0.2)'; x.beginPath(); x.ellipse(bx, gy, u * 5, u, 0, 0, 7); x.fill();
    drawSprite(x, FR, bx - 5.5 * u, oy, u, false);

    /* speech bubble */
    if (sayT > 0) {
      sayT--;
      x.font = "8px 'Press Start 2P',monospace";
      const tw = x.measureText(sayS).width, bw = tw + 16, bh = 20;
      const bxb = bx - bw / 2, byb = oy - bh - 8;
      x.fillStyle = '#1d1410'; x.fillRect(bxb - 2, byb - 2, bw + 4, bh + 4);
      x.fillStyle = '#fbf6ec'; x.fillRect(bxb, byb, bw, bh);
      x.fillStyle = '#1d1410'; x.fillRect(bx - 3, byb + bh, 6, 5);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(sayS, bx, byb + bh / 2);
    }

    /* confetti */
    conf.forEach(p => {
      p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.life--;
      x.globalAlpha = Math.max(0, p.life / 60);
      x.fillStyle = p.c;
      x.fillRect(p.x, p.y, u * 0.9, u * 0.9);
    });
    x.globalAlpha = 1;
    conf = conf.filter(p => p.life > 0 && p.y < H + 20);

    requestAnimationFrame(frame);
  }

  /* --- start --- */
  buildc();
  renderBelt();
  say('tap a tool!');
  requestAnimationFrame(frame);
  REFIT.push(buildc);

  let to;
  addEventListener('resize', () => { clearTimeout(to); to = setTimeout(buildc, 200); });
}

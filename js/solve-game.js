/**
 * "Solve It" — 5-question agent quiz with animated mascot reactions.
 */

import { drawSprite, FR }       from './sprite.js';
import { fitCanvas, canvasVis } from './canvas.js';
import { GAME, toast, achieve }   from './state.js';
import { SND }                   from './sound.js';

const QUESTIONS = [
  { d: 'EASY',   q: 'what even is an AI agent?',
    a: ['software that takes a goal and acts on its own', 'a chatbot that only talks when you talk first', 'a spreadsheet with extra steps'],
    c: 0, l: 'an agent takes a goal, picks its own steps and tools, and gets it done.' },
  { d: 'EASY',   q: 'a lead messages an hvac biz at 2am. best move?',
    a: ['let it wait till morning', 'auto reply, qualify, then book the slot', 'send a plain thanks and stop'],
    c: 1, l: 'speed wins. an agent replies in seconds and books while you sleep.' },
  { d: 'MEDIUM', q: '200 unread support emails. what should the agent do first?',
    a: ['reply to all at once', 'sort by intent, answer easy ones, flag the rest', 'just delete the old ones'],
    c: 1, l: 'triage first. agents handle the simple stuff, humans get the hard ones.' },
  { d: 'MEDIUM', q: 'an agent keeps giving wrong answers. check first?',
    a: ['buy a bigger model', 'check the instructions and data you fed it', 'give up'],
    c: 1, l: 'garbage in, garbage out. most agent bugs are bad instructions or missing context.' },
  { d: 'HARD',   q: 'when should a task NOT be handed to an agent?',
    a: ['repetitive work with clear rules', 'a rare high stakes call that needs real judgement', 'sorting and tagging messages'],
    c: 1, l: 'agents shine at repeatable work. rare high stakes calls still want a human.' }
];

export function initSolveGame() {
  const qEl = document.getElementById('solveQ');
  const oEl = document.getElementById('solveOpts');
  const lEl = document.getElementById('solveLesson');
  const nEl = document.getElementById('solveNext');
  const cEl = document.getElementById('solveCount');
  const bEl = document.getElementById('solveBubble');
  const cv  = document.getElementById('solveCanvas');
  if (!qEl) return;

  let idx = 0, solved = 0, locked = false, done = false;
  let pose = 'idle', poseT = 0;

  /* --- mascot drawing --- */
  function drawBot() {
    if (!canvasVis.solveCanvas) { requestAnimationFrame(drawBot); return; }
    const m = fitCanvas(cv);
    if (!m.ok) { requestAnimationFrame(drawBot); return; }

    const W = m.w, H = m.h, x = cv.getContext('2d');
    x.clearRect(0, 0, W, H);
    const u = Math.max(4, Math.round(H / 18));
    const f = Date.now() / 1000;

    let dy = 0, dx = 0;
    if (pose === 'happy')     dy = -Math.abs(Math.sin(f * 12)) * 8;
    else if (pose === 'sad')  dx = (Math.floor(f * 16) % 2 === 0 ? -2 : 2);
    else                      dy = Math.sin(f * 4) * 1.5;

    const gy = H - u * 1.5;
    x.fillStyle = 'rgba(0,0,0,0.18)';
    x.beginPath(); x.ellipse(W / 2, gy, u * 5, u, 0, 0, 7); x.fill();
    drawSprite(x, FR, W / 2 - 5.5 * u + dx, gy - 14 * u + dy, u, false);

    if (poseT > 0) { poseT--; if (poseT === 0) pose = 'idle'; }
    requestAnimationFrame(drawBot);
  }

  /* --- render question --- */
  function render() {
    done = false;
    locked = false;
    const s = QUESTIONS[idx];

    qEl.innerHTML = `<span class="solve-diff">${s.d}</span>${s.q}`;
    oEl.innerHTML = '';
    lEl.textContent = '';
    nEl.disabled = true;
    nEl.innerHTML = (idx === QUESTIONS.length - 1 ? 'SEE SCORE \u25b6' : 'NEXT \u25b6');
    bEl.textContent = 'your move?';
    cEl.textContent = `q ${idx + 1}/${QUESTIONS.length} \u00b7 solved ${solved}`;

    s.a.forEach((txt, i) => {
      const b = document.createElement('button');
      b.className = 'solve-opt';
      b.textContent = txt;
      b.onclick = () => pick(i, b, s);
      oEl.appendChild(b);
    });
  }

  /* --- answer handler --- */
  function pick(i, btn, s) {
    if (locked) return;
    locked = true;

    [...oEl.children].forEach((b, k) => {
      b.disabled = true;
      if (k === s.c) b.classList.add('right');
    });

    if (i === s.c) {
      btn.classList.add('right');
      solved++;
      GAME.addCash(80);
      bEl.textContent = 'yesss';
      pose = 'happy'; poseT = 90;
      toast('CORRECT \u2014 +$80');
      SND.good();
    } else {
      btn.classList.add('wrong');
      bEl.textContent = 'nah mate';
      pose = 'sad'; poseT = 40;
      SND.bad();
    }

    lEl.textContent = '\u2192 ' + s.l;
    nEl.disabled = false;
    cEl.textContent = `q ${idx + 1}/${QUESTIONS.length} \u00b7 solved ${solved}`;
  }

  /* --- end screen --- */
  function endScreen() {
    done = true;
    const win = solved >= 4;

    qEl.innerHTML = `<span class="solve-diff">${win ? 'LEVEL CLEAR' : 'NICE TRY'}</span>you solved ${solved}/${QUESTIONS.length}`;
    oEl.innerHTML = '';
    lEl.textContent = '';

    const msg = document.createElement('div');
    msg.className = 'solve-end';
    msg.textContent = win
      ? 'bloody hell, you actually get this agent stuff. respect mate.'
      : 'yeah nah, have another crack. you will get it, easy.';
    oEl.appendChild(msg);

    const row = document.createElement('div');
    row.className = 'solve-end-btns';

    const a1 = document.createElement('a');
    a1.href = 'https://t.me/getascent';
    a1.target = '_blank';
    a1.rel = 'noopener noreferrer';
    a1.className = 'pixbtn coral';
    a1.innerHTML = '\u25b6 FOLLOW THE JOURNEY';

    const a2 = document.createElement('button');
    a2.className = 'pixbtn';
    a2.textContent = 'PLAY AGAIN';
    a2.onclick = () => { idx = 0; solved = 0; render(); };

    row.appendChild(a1);
    row.appendChild(a2);
    oEl.appendChild(row);

    nEl.disabled = true;
    nEl.innerHTML = 'NEXT \u25b6';
    cEl.textContent = `solved ${solved}/${QUESTIONS.length}`;
    bEl.textContent = win ? 'huge!' : 'again ay';
    pose = win ? 'happy' : 'idle';
    poseT = win ? 170 : 0;

    if (win) { achieve('quiz_ace', 'QUIZ ACE \u2014 4+ CORRECT'); SND.win(); }
  }

  /* --- next button --- */
  nEl.onclick = () => {
    if (done) return;
    if (idx === QUESTIONS.length - 1) endScreen();
    else { idx++; render(); }
  };

  /* --- start --- */
  render();
  requestAnimationFrame(drawBot);
}

/**
 * Mission Control — canvas-rendered AI agent workflow.
 * Visual command center with animated data packets flowing
 * between large graphical nodes in a branching layout.
 */

import { SND } from './sound.js';

var NODES = [
  { id: 'user',    label: 'USER',      icon: '>>',  desc: 'You send a request. The system receives the mission.',                         col: '#f0c860' },
  { id: 'planner', label: 'PLANNER',   icon: '<>',  desc: 'Breaks the mission into tasks. Decides which agents to deploy and in what order.', col: '#78c8ff' },
  { id: 'research',label: 'RESEARCH',  icon: '??',  desc: 'Finds information and context. Searches the web, reads docs, pulls records.',     col: '#78c8ff' },
  { id: 'memory',  label: 'MEMORY',    icon: '[]',  desc: 'Stores context and previous actions. Gives the agent long-term recall.',          col: '#78c8ff' },
  { id: 'execute', label: 'EXECUTE',   icon: '!!',  desc: 'Runs actions. Sends emails, updates CRM, books meetings, writes code.',          col: '#e0603a' },
  { id: 'qa',      label: 'QA',        icon: '**',  desc: 'Checks outputs before delivery. Validates results, catches errors.',             col: '#78c8ff' },
  { id: 'done',    label: 'DELIVERED', icon: '>>',  desc: 'Mission complete. Result delivered back to you automatically.',                  col: '#34a96a' }
];

/* edges: [fromIndex, toIndex] */
var EDGES = [[0,1],[1,2],[1,3],[2,4],[3,4],[4,5],[5,6]];

export function initMission() {
  var cv = document.getElementById('missionCanvas');
  if (!cv) return;

  var titleEl = document.getElementById('mcTitle');
  var descEl  = document.getElementById('mcDesc');
  var infoEl  = document.getElementById('mcInfo');
  var W = 0, H = 0, u = 1, nodePos = [], packets = [], hoverIdx = -1;

  function layout() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    if (r.width < 1) return;
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    u = Math.max(3, Math.round(W / 180));

    /* node positions — branching layout */
    var cx = W / 2, nw = u * 14, nh = u * 8;
    var col1 = cx - nw * 1.2;
    var col2 = cx + nw * 1.2;
    var row0 = H * 0.08;
    var row1 = H * 0.28;
    var row2 = H * 0.50;
    var row3 = H * 0.72;
    var row4 = H * 0.90;

    nodePos = [
      { x: cx,   y: row0, w: nw, h: nh },  /* USER */
      { x: cx,   y: row1, w: nw, h: nh },  /* PLANNER */
      { x: col2, y: row2, w: nw, h: nh },  /* RESEARCH */
      { x: col1, y: row2, w: nw, h: nh },  /* MEMORY */
      { x: cx,   y: row3, w: nw, h: nh },  /* EXECUTE */
      { x: cx - nw * 0.6, y: row4, w: nw, h: nh * 0.85 },  /* QA */
      { x: cx + nw * 0.6, y: row4, w: nw, h: nh * 0.85 }   /* DELIVERED */
    ];

    /* seed packets */
    packets = [];
    for (var i = 0; i < EDGES.length; i++) {
      packets.push({ edge: i, t: Math.random(), speed: 0.004 + Math.random() * 0.003 });
      if (Math.random() > 0.5) packets.push({ edge: i, t: Math.random(), speed: 0.003 + Math.random() * 0.004 });
    }
  }

  layout();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function() { layout(); }).observe(cv);
  }

  /* click/tap detection */
  function handleClick(ex, ey) {
    for (var i = 0; i < nodePos.length; i++) {
      var n = nodePos[i];
      if (ex > n.x - n.w / 2 - u * 2 && ex < n.x + n.w / 2 + u * 2 &&
          ey > n.y - u && ey < n.y + n.h + u) {
        selectNode(i);
        return;
      }
    }
  }

  cv.addEventListener('click', function(e) {
    var r = cv.getBoundingClientRect();
    handleClick(e.clientX - r.left, e.clientY - r.top);
  });

  cv.addEventListener('mousemove', function(e) {
    var r = cv.getBoundingClientRect();
    var ex = e.clientX - r.left, ey = e.clientY - r.top;
    var found = -1;
    for (var i = 0; i < nodePos.length; i++) {
      var n = nodePos[i];
      if (ex > n.x - n.w / 2 - u && ex < n.x + n.w / 2 + u &&
          ey > n.y - u && ey < n.y + n.h + u) { found = i; break; }
    }
    hoverIdx = found;
    cv.style.cursor = found >= 0 ? 'pointer' : 'default';
  });

  function selectNode(i) {
    hoverIdx = i;
    var nd = NODES[i];
    if (titleEl) titleEl.textContent = nd.label;
    if (descEl)  descEl.textContent = nd.desc;
    if (infoEl)  infoEl.classList.add('active');
    SND.tick();
  }

  /* render loop */
  function frame() {
    requestAnimationFrame(frame);
    if (W < 1 || !nodePos.length) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    var f = Date.now() / 1000;

    /* background grid */
    ctx.strokeStyle = 'rgba(120,200,255,0.03)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += u * 6) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += u * 6) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    /* draw edges (connection lines) */
    for (var ei = 0; ei < EDGES.length; ei++) {
      var e = EDGES[ei];
      var from = nodePos[e[0]], to = nodePos[e[1]];
      var fx = from.x, fy = from.y + from.h;
      var tx = to.x, ty = to.y;

      ctx.strokeStyle = 'rgba(120,200,255,0.12)';
      ctx.lineWidth = u * 0.3;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      /* curved path */
      var my = (fy + ty) / 2;
      ctx.bezierCurveTo(fx, my, tx, my, tx, ty);
      ctx.stroke();
    }

    /* draw packets along edges */
    for (var pi = 0; pi < packets.length; pi++) {
      var p = packets[pi];
      p.t += p.speed;
      if (p.t > 1) p.t -= 1;

      var e2 = EDGES[p.edge];
      var f1 = nodePos[e2[0]], f2 = nodePos[e2[1]];
      var sx = f1.x, sy = f1.y + f1.h;
      var ex2 = f2.x, ey2 = f2.y;
      var my2 = (sy + ey2) / 2;

      /* bezier position */
      var t = p.t, t2 = 1 - t;
      var px = t2*t2*t2*sx + 3*t2*t2*t*sx + 3*t2*t*t*ex2 + t*t*t*ex2;
      var py = t2*t2*t2*sy + 3*t2*t2*t*my2 + 3*t2*t*t*my2 + t*t*t*ey2;

      /* glow */
      ctx.fillStyle = 'rgba(120,200,255,0.08)';
      ctx.beginPath(); ctx.arc(px, py, u * 1.5, 0, 7); ctx.fill();
      /* packet */
      ctx.fillStyle = 'rgba(120,200,255,0.6)';
      ctx.fillRect(px - u * 0.4, py - u * 0.4, u * 0.8, u * 0.8);
    }

    /* draw nodes */
    for (var ni = 0; ni < NODES.length; ni++) {
      var nd = NODES[ni], np = nodePos[ni];
      var isHover = ni === hoverIdx;
      var nx = np.x - np.w / 2, ny = np.y;

      /* node background */
      ctx.fillStyle = isHover ? 'rgba(120,200,255,0.08)' : 'rgba(20,24,32,0.9)';
      ctx.fillRect(nx, ny, np.w, np.h);

      /* border */
      var borderAlpha = isHover ? 0.5 : 0.15;
      ctx.strokeStyle = nd.col.replace(')', ',' + borderAlpha + ')').replace('rgb', 'rgba').replace('#', '');
      /* convert hex to rgba */
      var bc = nd.col;
      if (bc[0] === '#') {
        var r2 = parseInt(bc.slice(1,3),16), g2 = parseInt(bc.slice(3,5),16), b2 = parseInt(bc.slice(5,7),16);
        ctx.strokeStyle = 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + borderAlpha + ')';
      }
      ctx.lineWidth = isHover ? 2 : 1;
      ctx.strokeRect(nx, ny, np.w, np.h);

      /* glow on hover */
      if (isHover) {
        ctx.shadowColor = nd.col;
        ctx.shadowBlur = 12;
        ctx.strokeRect(nx, ny, np.w, np.h);
        ctx.shadowBlur = 0;
      }

      /* icon */
      ctx.fillStyle = nd.col;
      ctx.font = Math.min(u * 1.8, 16) + "px 'Press Start 2P',monospace";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(nd.icon, np.x, ny + np.h * 0.38);

      /* label */
      ctx.fillStyle = isHover ? '#f2ede1' : 'rgba(242,237,225,0.5)';
      ctx.font = Math.min(u * 0.9, 9) + "px 'Press Start 2P',monospace";
      ctx.fillText(nd.label, np.x, ny + np.h * 0.75);

      /* status indicator (blinking dot) */
      var blink = Math.sin(f * 2 + ni * 1.3) > 0.6;
      ctx.fillStyle = blink ? nd.col : 'rgba(120,200,255,0.08)';
      ctx.fillRect(nx + u * 0.5, ny + u * 0.5, u * 0.4, u * 0.4);
    }

    /* scanline effect (very subtle) */
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    for (var sl = 0; sl < H; sl += 3) ctx.fillRect(0, sl, W, 1);
  }

  requestAnimationFrame(frame);
}

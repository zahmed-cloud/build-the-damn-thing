/**
 * Mission Control — canvas-rendered AI agent workflow.
 * Horizontal command-center layout spanning full width.
 * Two rows: main pipeline top, support nodes bottom.
 */

import { SND } from './sound.js';

var NODES = [
  { id: 'user',     label: 'USER',      icon: '>>', desc: 'You send a request. The system receives the mission.',                           col: '#f0c860' },
  { id: 'planner',  label: 'PLANNER',   icon: '<>', desc: 'Breaks the mission into tasks. Decides which agents to deploy and in what order.', col: '#78c8ff' },
  { id: 'research', label: 'RESEARCH',  icon: '??', desc: 'Finds information and context. Searches the web, reads docs, pulls records.',     col: '#78c8ff' },
  { id: 'memory',   label: 'MEMORY',    icon: '[]', desc: 'Stores context and previous actions. Gives the agent long-term recall.',          col: '#78c8ff' },
  { id: 'execute',  label: 'EXECUTE',   icon: '!!', desc: 'Runs actions. Sends emails, updates CRM, books meetings, writes code.',          col: '#e0603a' },
  { id: 'qa',       label: 'QA',        icon: '**', desc: 'Checks outputs before delivery. Validates results, catches errors.',             col: '#78c8ff' },
  { id: 'done',     label: 'DELIVERED', icon: '>>', desc: 'Mission complete. Result delivered back to you automatically.',                  col: '#34a96a' }
];

/*  Layout (2-row horizontal):
 *
 *  Row 1 (main pipeline):
 *  [USER] ─── [PLANNER] ─── [RESEARCH] ─── [EXECUTE] ─── [QA] ─── [DELIVERED]
 *                  │                            ↑
 *                  └──────── [MEMORY] ──────────┘
 *  Row 2 (support):          (below, feeds into execute)
 */
var EDGES = [
  [0, 1],  /* user → planner */
  [1, 2],  /* planner → research */
  [1, 3],  /* planner → memory (down) */
  [2, 4],  /* research → execute */
  [3, 4],  /* memory → execute (up) */
  [4, 5],  /* execute → qa */
  [5, 6]   /* qa → delivered */
];

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

    var nw = u * 12, nh = u * 7;
    var pad = u * 3;
    var usable = W - pad * 2;

    /* 6 nodes across the top row, evenly spaced */
    var topY = H * 0.18;
    var botY = H * 0.65;
    var topNodes = [0, 1, 2, 4, 5, 6]; /* indices into NODES */
    var spacing = usable / (topNodes.length - 1);

    nodePos = [];
    for (var i = 0; i < NODES.length; i++) nodePos.push({ x: 0, y: 0, w: nw, h: nh });

    /* place top row */
    for (var ti = 0; ti < topNodes.length; ti++) {
      var ni = topNodes[ti];
      nodePos[ni].x = pad + ti * spacing;
      nodePos[ni].y = topY;
    }

    /* memory node: below, between planner and execute */
    var plannerX = nodePos[1].x;
    var executeX = nodePos[4].x;
    nodePos[3].x = (plannerX + executeX) / 2;
    nodePos[3].y = botY;

    /* seed packets */
    packets = [];
    for (var i = 0; i < EDGES.length; i++) {
      packets.push({ edge: i, t: Math.random(), speed: 0.003 + Math.random() * 0.003 });
      packets.push({ edge: i, t: (Math.random() * 0.5 + 0.3) % 1, speed: 0.0025 + Math.random() * 0.003 });
    }
  }

  layout();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function() { layout(); }).observe(cv);
  }

  /**
   * Get the exit point (right-center) and entry point (left-center)
   * for edge drawing. For vertical connections use bottom/top.
   */
  function getEdgePoints(fromIdx, toIdx) {
    var f = nodePos[fromIdx], t = nodePos[toIdx];
    var horizontal = Math.abs(f.y - t.y) < f.h * 1.5;

    if (horizontal) {
      /* right side of from → left side of to */
      return {
        fx: f.x + f.w / 2, fy: f.y + f.h / 2,
        tx: t.x - t.w / 2, ty: t.y + t.h / 2
      };
    } else if (t.y > f.y) {
      /* downward: bottom-center of from → top-center of to */
      return {
        fx: f.x, fy: f.y + f.h,
        tx: t.x, ty: t.y
      };
    } else {
      /* upward: top-center of from → bottom-center of to */
      return {
        fx: f.x, fy: f.y,
        tx: t.x, ty: t.y + t.h
      };
    }
  }

  function bezierPoint(t, p0, p1, p2, p3) {
    var t2 = 1 - t;
    return t2*t2*t2*p0 + 3*t2*t2*t*p1 + 3*t2*t*t*p2 + t*t*t*p3;
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

  function selectNode(i) {
    hoverIdx = i;
    var nd = NODES[i];
    if (titleEl) titleEl.textContent = nd.label;
    if (descEl)  descEl.textContent = nd.desc;
    if (infoEl)  infoEl.classList.add('active');
    SND.tick();
  }

  /* ═══ RENDER ═══ */
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
    ctx.strokeStyle = 'rgba(120,200,255,0.025)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += u * 5) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += u * 5) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    /* draw edges */
    for (var ei = 0; ei < EDGES.length; ei++) {
      var ep = getEdgePoints(EDGES[ei][0], EDGES[ei][1]);

      ctx.strokeStyle = 'rgba(120,200,255,0.1)';
      ctx.lineWidth = u * 0.25;
      ctx.beginPath();
      ctx.moveTo(ep.fx, ep.fy);
      var cmx1 = (ep.fx + ep.tx) / 2, cmy1 = ep.fy;
      var cmx2 = (ep.fx + ep.tx) / 2, cmy2 = ep.ty;
      ctx.bezierCurveTo(cmx1, cmy1, cmx2, cmy2, ep.tx, ep.ty);
      ctx.stroke();
    }

    /* draw packets */
    for (var pi = 0; pi < packets.length; pi++) {
      var p = packets[pi];
      p.t += p.speed;
      if (p.t > 1) p.t -= 1;

      var ep2 = getEdgePoints(EDGES[p.edge][0], EDGES[p.edge][1]);
      var cmx1 = (ep2.fx + ep2.tx) / 2, cmy1 = ep2.fy;
      var cmx2 = (ep2.fx + ep2.tx) / 2, cmy2 = ep2.ty;

      var px = bezierPoint(p.t, ep2.fx, cmx1, cmx2, ep2.tx);
      var py = bezierPoint(p.t, ep2.fy, cmy1, cmy2, ep2.ty);

      ctx.fillStyle = 'rgba(120,200,255,0.06)';
      ctx.beginPath(); ctx.arc(px, py, u * 1.2, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(120,200,255,0.55)';
      ctx.fillRect(px - u * 0.35, py - u * 0.35, u * 0.7, u * 0.7);
    }

    /* draw nodes */
    for (var ni = 0; ni < NODES.length; ni++) {
      var nd = NODES[ni], np = nodePos[ni];
      var isH = ni === hoverIdx;
      var nx = np.x - np.w / 2, ny = np.y;

      /* node bg */
      ctx.fillStyle = isH ? 'rgba(120,200,255,0.06)' : 'rgba(16,20,28,0.92)';
      ctx.fillRect(nx, ny, np.w, np.h);

      /* border */
      var r2 = parseInt(nd.col.slice(1,3),16), g2 = parseInt(nd.col.slice(3,5),16), b2 = parseInt(nd.col.slice(5,7),16);
      ctx.strokeStyle = 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + (isH ? 0.6 : 0.15) + ')';
      ctx.lineWidth = isH ? 2 : 1;
      ctx.strokeRect(nx, ny, np.w, np.h);

      /* hover glow */
      if (isH) {
        ctx.shadowColor = nd.col; ctx.shadowBlur = 14;
        ctx.strokeRect(nx, ny, np.w, np.h);
        ctx.shadowBlur = 0;
      }

      /* icon */
      ctx.fillStyle = nd.col;
      ctx.font = Math.min(u * 1.6, 14) + "px 'Press Start 2P',monospace";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(nd.icon, np.x, ny + np.h * 0.38);

      /* label */
      ctx.fillStyle = isH ? '#f2ede1' : 'rgba(242,237,225,0.45)';
      ctx.font = Math.min(u * 0.8, 8) + "px 'Press Start 2P',monospace";
      ctx.fillText(nd.label, np.x, ny + np.h * 0.78);

      /* status LED */
      var blink = Math.sin(f * 2 + ni * 1.3) > 0.6;
      ctx.fillStyle = blink ? nd.col : 'rgba(120,200,255,0.06)';
      ctx.fillRect(nx + u * 0.4, ny + u * 0.4, u * 0.35, u * 0.35);
    }

    /* scanlines */
    ctx.fillStyle = 'rgba(0,0,0,0.015)';
    for (var sl = 0; sl < H; sl += 3) ctx.fillRect(0, sl, W, 1);
  }

  requestAnimationFrame(frame);
}

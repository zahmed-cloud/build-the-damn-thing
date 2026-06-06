/**
 * 21-week level map — click a week to reveal mission briefing panel.
 * No walking mascot. Clean info reveal with retro quest-log styling.
 */

import { SND } from './sound.js';

/* Week data — agent name, goal, tools, status */
var WEEKS = {
  1:  { agent: 'Setup Agent',             goal: 'Dev environment + first API call',   tools: 'Claude API, Node.js',       status: 'UP NEXT' },
  2:  { agent: 'Prompt Agent',            goal: 'Master prompt engineering',           tools: 'Claude API, Prompts',       status: 'LOCKED' },
  3:  { agent: 'HVAC Speed-to-Lead',      goal: 'Instant lead response + booking',    tools: 'Twilio, Calendar API',      status: 'PLANNED' },
  4:  { agent: 'Data Scraper Agent',      goal: 'Extract web data automatically',     tools: 'Puppeteer, Claude',         status: 'LOCKED' },
  5:  { agent: 'Lead Gen Agent',          goal: 'Find and score prospects',           tools: 'Apollo, Clay, OpenAI',      status: 'PLANNED' },
  6:  { agent: 'Outreach Agent',          goal: 'Personalised cold outreach at scale',tools: 'Email API, Claude',         status: 'LOCKED' },
  7:  { agent: 'Email Support Agent',     goal: 'Auto-reply and triage inbox',        tools: 'Gmail API, Claude',         status: 'PLANNED' },
  8:  { agent: 'Content Agent',           goal: 'Draft social posts from notes',      tools: 'Claude, Buffer API',        status: 'LOCKED' },
  9:  { agent: 'CRM Agent',              goal: 'Auto-log deals and follow-ups',      tools: 'HubSpot API, Claude',       status: 'LOCKED' },
  10: { agent: 'Reporting Agent',         goal: 'Weekly business metrics digest',     tools: 'Sheets API, Claude',        status: 'LOCKED' },
  11: { agent: 'Booking Agent',           goal: 'Schedule meetings automatically',    tools: 'Calendly, Claude',          status: 'LOCKED' },
  12: { agent: 'Research Agent',          goal: 'Deep company research on demand',    tools: 'Web Search, Claude',        status: 'LOCKED' },
  13: { agent: 'Invoice Agent',           goal: 'Generate and send invoices',         tools: 'Stripe, PDF Gen',           status: 'LOCKED' },
  14: { agent: 'Onboarding Agent',        goal: 'New client welcome sequence',        tools: 'Email, Notion API',         status: 'LOCKED' },
  15: { agent: 'Feedback Agent',          goal: 'Collect and analyse client feedback',tools: 'Forms, Claude',             status: 'LOCKED' },
  16: { agent: 'Social Listener',         goal: 'Monitor brand mentions',             tools: 'Twitter API, Claude',       status: 'LOCKED' },
  17: { agent: 'Proposal Agent',          goal: 'Auto-generate client proposals',     tools: 'Claude, PDF Gen',           status: 'LOCKED' },
  18: { agent: 'Pipeline Agent',          goal: 'Manage sales pipeline stages',       tools: 'CRM API, Claude',           status: 'LOCKED' },
  19: { agent: 'Analytics Agent',         goal: 'Dashboard insights on autopilot',    tools: 'GA4, Claude',               status: 'LOCKED' },
  20: { agent: 'Integration Agent',       goal: 'Connect multiple agent workflows',   tools: 'Webhooks, Claude',          status: 'LOCKED' },
  21: { agent: 'Meta Agent',             goal: 'Agent that manages other agents',    tools: 'Agent SDK, Claude',          status: 'LOCKED' }
};

export function initWeeksMap() {
  var grid = document.getElementById('weeksGrid');
  var detailEl = document.getElementById('weekDetail');
  if (!grid) return;

  var planned = { 3: 1, 5: 1, 7: 1 };
  var activeWeek = null;

  for (var i = 1; i <= 21; i++) {
    var d = document.createElement('div');
    d.className = 'wk' + (i === 1 ? ' cur' : '') + (planned[i] ? ' planned' : '');
    d.dataset.w = i;
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', 'Week ' + i);
    d.innerHTML = '<span class="wk-n">WK</span><span class="wk-s">' + String(i).padStart(2, '0') + '</span>';

    d.onclick = (function(week) { return function() { showWeek(week); }; })(i);
    d.onkeydown = (function(week) { return function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showWeek(week); } }; })(i);
    grid.appendChild(d);
  }

  function showWeek(week) {
    SND.blip();

    /* highlight active */
    var all = grid.querySelectorAll('.wk');
    for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
    var target = grid.querySelector('[data-w="' + week + '"]');
    if (target) target.classList.add('active');

    if (!detailEl) return;
    activeWeek = week;

    var data = WEEKS[week];
    if (!data) return;

    var statusClass = data.status === 'UP NEXT' ? 'status-next' :
                      data.status === 'PLANNED' ? 'status-planned' : 'status-locked';

    detailEl.innerHTML =
      '<div class="wd-header">' +
        '<span class="wd-week">WEEK ' + String(week).padStart(2, '0') + '</span>' +
        '<span class="wd-status ' + statusClass + '">' + data.status + '</span>' +
      '</div>' +
      '<div class="wd-name">' + data.agent + '</div>' +
      '<div class="wd-row"><span class="wd-label">MISSION</span><span class="wd-value">' + data.goal + '</span></div>' +
      '<div class="wd-row"><span class="wd-label">TOOLS</span><span class="wd-value">' + data.tools + '</span></div>';

    detailEl.classList.add('open');
  }
}

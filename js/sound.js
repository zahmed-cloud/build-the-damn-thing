/**
 * Sound effects (Web Audio API) and character voice (Web Speech API).
 *
 * SND.blip / .add / .bad / .coin / .good / .win — 8-bit beep effects
 * SND.say(text)  — speaks aloud via browser TTS
 * SND.toggle()   — mute / unmute
 *
 * Voice selection heavily favours known male English voices and
 * hard-blocks known female voices so the mascot always sounds right.
 */

let on   = true;
let ctx  = null;   // AudioContext
let voice = null;  // SpeechSynthesisVoice

/* ---------- AudioContext ---------- */

function ensure() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { /* unsupported */ }
  }
  if (ctx && ctx.state === 'suspended') {
    try { ctx.resume(); } catch (e) { /* autoplay policy */ }
  }
}

function beep(freq, dur, type, vol) {
  if (!on) return;
  ensure();
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.start(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
    osc.stop(t + (dur || 0.08));
  } catch (e) { /* graceful fail */ }
}

/* ---------- Voice selection ---------- */

const MALE_ALLOW = /\b(daniel|lee|james|oliver|arthur|rishi|liam|jack|russell|tom|thomas|ralph|albert|aaron|fred|alex|gordon|george|harry|william|david|mark|paul|guy|reed|otis|rocko|samson|grandpa|eddy|malcolm|bruce|evan|jorge|diego|luciano|jacques|xander)\b/i;
const MALE_GENERIC = /\b(male)\b/i;
const FEMALE_BLOCK = /\b(female|karen|catherine|samantha|victoria|tessa|moira|fiona|zira|hazel|serena|ava|allison|susan|siri|nicky|veena|kate|kathy|princess|joana|lesya|linh|luciana|mariska|meijia|melina|milena|montse|noora|paulina|sara|shelley|siobhan|tina|zosia|agnes|amelie|anna|carmit|damayanti|ellen|flo|grandma|helena|ioana|jessica|kanya|kyoko|lana|laura|lekha|maged|majed|mei|sandy|rong|tingting|yuna|o-ren|tunde)\b/i;

function scoreVoice(v) {
  let s = 0;
  const lang = v.lang || '';
  const name = v.name || '';

  /* language preference */
  if      (/en[-_]?au/i.test(lang)) s += 40;
  else if (/en[-_]?gb/i.test(lang)) s += 28;
  else if (/en[-_]?us/i.test(lang)) s += 12;
  else if (/^en/i.test(lang))       s += 6;
  else                              s -= 100;

  /* male allow-list */
  if (MALE_ALLOW.test(name))   s += 60;
  if (MALE_GENERIC.test(name) && !FEMALE_BLOCK.test(name)) s += 55;

  /* female hard block */
  if (FEMALE_BLOCK.test(name)) s -= 500;

  return s;
}

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return;
  const sorted = vs.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a));
  voice = sorted[0] || null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

/* ---------- Text normalisation ---------- */

function norm(t) {
  t = String(t);
  /* strip symbols & emoji */
  t = t.replace(/[\u25b6\u2192\u2191\u2193\u2713\u2715\u2014\u00b7]/g, ' ');
  t = t.replace(/[\u{1F000}-\u{1FFFF}]/gu, ' ');
  /* money */
  t = t.replace(/\$?\b(\d+)\s*[kK]\b/g,   (_, d) => d + ' thousand dollars');
  t = t.replace(/\$\s?(\d[\d,]*)/g,        (_, d) => d.replace(/,/g, '') + ' dollars');
  /* abbreviations */
  t = t.replace(/\bwk\s*0*(\d+)/ig,    'week $1');
  t = t.replace(/\blv\s*0*(\d+)/ig,    'level $1');
  t = t.replace(/\blevel\s*0*(\d+)/ig, 'level $1');
  /* misc */
  t = t.replace(/\+/g,       ' plus ');
  t = t.replace(/\b0+(\d)/g, '$1');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/* ---------- public API ---------- */

export const SND = {
  get on() { return on; },

  toggle() {
    on = !on;
    ensure();
    if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
    return on;
  },

  blip() { beep(660, 0.06, 'square', 0.035); },
  add()  { beep(880, 0.05, 'square', 0.04); },
  bad()  { beep(170, 0.16, 'sawtooth', 0.05); },

  coin() {
    beep(1180, 0.05, 'square', 0.045);
    setTimeout(() => beep(1560, 0.07, 'square', 0.04), 45);
  },

  good() {
    beep(720, 0.08, 'square', 0.05);
    setTimeout(() => beep(1040, 0.1, 'square', 0.05), 70);
  },

  win() {
    [523, 659, 784, 1046].forEach((fr, i) => {
      setTimeout(() => beep(fr, 0.12, 'square', 0.05), i * 90);
    });
  },

  say(text) {
    if (!on || !('speechSynthesis' in window)) return;
    ensure();
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(norm(text));
      if (voice) u.voice = voice;
      u.rate   = 1.04 + Math.random() * 0.1;
      u.pitch  = 0.92 + Math.random() * 0.12;
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { /* graceful fail */ }
  }
};

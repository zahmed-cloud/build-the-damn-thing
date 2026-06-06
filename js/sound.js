/**
 * Retro 8-bit sound effects via Web Audio API.
 *
 * SND.blip / .add / .bad / .coin / .good / .win — arcade beeps
 * SND.toggle() — mute / unmute
 *
 * No speech synthesis. No voice. Pure arcade sounds only.
 */

var on  = true;
var ctx = null;

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
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    var t = ctx.currentTime;
    osc.start(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
    osc.stop(t + (dur || 0.08));
  } catch (e) { /* graceful fail */ }
}

export var SND = {
  get on() { return on; },

  toggle: function() {
    on = !on;
    ensure();
    return on;
  },

  blip: function() { beep(660, 0.06, 'square', 0.035); },
  add:  function() { beep(880, 0.05, 'square', 0.04); },
  bad:  function() { beep(170, 0.16, 'sawtooth', 0.05); },

  coin: function() {
    beep(1180, 0.05, 'square', 0.045);
    setTimeout(function() { beep(1560, 0.07, 'square', 0.04); }, 45);
  },

  good: function() {
    beep(720, 0.08, 'square', 0.05);
    setTimeout(function() { beep(1040, 0.1, 'square', 0.05); }, 70);
  },

  win: function() {
    [523, 659, 784, 1046].forEach(function(fr, i) {
      setTimeout(function() { beep(fr, 0.12, 'square', 0.05); }, i * 90);
    });
  },

  /* Level-up fanfare */
  lvlUp: function() {
    [440, 554, 659, 880].forEach(function(fr, i) {
      setTimeout(function() { beep(fr, 0.1, 'square', 0.06); }, i * 70);
    });
  },

  /* Quick click feedback */
  tick: function() { beep(1200, 0.03, 'square', 0.025); }
};

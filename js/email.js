/**
 * Email signup handler and footer marquee.
 */

import { toast } from './state.js';
import { SND }   from './sound.js';

export function initEmail() {
  var btn = document.getElementById('emailBtn');
  var inp = document.getElementById('emailIn');
  var msg = document.getElementById('emailMsg');
  if (!btn) return;

  btn.onclick = function() {
    var v = (inp.value || '').trim();
    if (!v || v.indexOf('@') < 0 || v.indexOf('.') < 0) {
      msg.style.color = '#ffd64a';
      msg.textContent = 'drop a real email yeah?';
      SND.bad();
      return;
    }
    msg.style.color = '#34a96a';
    msg.textContent = 'youre in. see you every week.';
    inp.value = '';
    toast('PLAYER JOINED \u2014 SEE YOU WEEKLY');
    SND.win();
  };
}

/**
 * Marquee — rock-solid initialisation.
 *
 * 1. Inject content immediately (triggers font download).
 * 2. Wait for the SPECIFIC pixel font to load (not just fonts.ready
 *    which can resolve early if the browser deprioritises the font).
 * 3. Force a layout read THEN apply animation.
 * 4. Fallback: if font API unavailable or times out, start after 2s.
 */
export function initMarquee() {
  var mq = document.getElementById('mq');
  if (!mq) return;

  var s = '';
  for (var i = 0; i < 10; i++) {
    s += '<span class="marquee-item">BUILD THE DAMN THING</span>';
  }
  mq.innerHTML = s + s;

  var started = false;

  function startAnimation() {
    if (started) return;
    started = true;
    /* Force reflow so browser measures final font metrics */
    void mq.offsetWidth;
    mq.style.animation = 'marquee-scroll 45s linear infinite';
  }

  /* Try to wait for the specific pixel font */
  if (document.fonts && document.fonts.load) {
    document.fonts.load("48px 'Press Start 2P'").then(startAnimation).catch(startAnimation);
  } else if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startAnimation);
  }

  /* Absolute fallback: start after 2 seconds no matter what */
  setTimeout(startAnimation, 2000);
}

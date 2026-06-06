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
 * Marquee — waits for Press Start 2P to load before starting.
 *
 * Root cause of the fragmentation bug: the CSS animation's
 * translateX(-50%) is computed from the track's width, which
 * depends on font metrics. If the animation starts while the
 * fallback font is active, the -50% offset is wrong. When the
 * real font loads and glyphs are wider, items reflow and wrap.
 *
 * Fix: inject content immediately (so the browser starts loading
 * the font), but only apply the animation AFTER fonts are ready.
 */
export function initMarquee() {
  var mq = document.getElementById('mq');
  if (!mq) return;

  /* Inject items immediately — triggers font load */
  var s = '';
  for (var i = 0; i < 10; i++) {
    s += '<span class="marquee-item">BUILD THE DAMN THING</span>';
  }
  mq.innerHTML = s + s;

  /* Start animation only after fonts are loaded and metrics are final */
  function startAnimation() {
    /* Force a layout read so the browser computes the final width
       with the loaded font before the animation begins */
    void mq.offsetWidth;
    mq.style.animation = 'marquee-scroll 45s linear infinite';
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startAnimation);
  } else {
    /* Fallback: wait for window load (fonts should be done by then) */
    window.addEventListener('load', startAnimation);
  }
}

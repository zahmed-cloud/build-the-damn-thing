/**
 * Email signup handler and footer marquee animation.
 */

import { toast } from './state.js';
import { SND }   from './sound.js';

export function initEmail() {
  const btn = document.getElementById('emailBtn');
  const inp = document.getElementById('emailIn');
  const msg = document.getElementById('emailMsg');
  if (!btn) return;

  btn.onclick = () => {
    const v = (inp.value || '').trim();
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

export function initMarquee() {
  const mq = document.getElementById('mq');
  if (!mq) return;

  let s = '';
  for (let i = 0; i < 10; i++) {
    s += '<span class="marquee-item">BUILD THE DAMN THING</span>';
  }
  mq.innerHTML = s + s;   // doubled for seamless loop
}

// Anschrei-Notfallknopf: shows a random calming tip (never the same twice in a row)
// plus the reset prompt to copy.
import { SOS_TIPS, RESET_PROMPT } from './data/sos-tips.js';

export function initSos() {
  const button = document.querySelector('.sos-button');
  if (!button) return;
  const result = document.querySelector('.sos-result');
  const title = result.querySelector('.sos-tip-title');
  const text = result.querySelector('.sos-tip-text');
  const clawd = document.querySelector('.sos-clawd');
  document.getElementById('reset-prompt').textContent = RESET_PROMPT;

  let last = -1;
  const showTip = () => {
    let next = Math.floor(Math.random() * SOS_TIPS.length);
    if (SOS_TIPS.length > 1 && next === last) next = (next + 1) % SOS_TIPS.length;
    last = next;
    title.textContent = SOS_TIPS[next].title;
    text.textContent = SOS_TIPS[next].text;
    result.hidden = false;
    clawd.classList.remove('shake');
    void clawd.offsetWidth;
    clawd.classList.add('shake');
  };

  button.addEventListener('click', showTip);
  result.querySelector('.sos-again').addEventListener('click', showTip);
}

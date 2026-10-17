// Copy buttons: any [data-copy-target] copies the text of the element with that id,
// then turns green with a check, plings and pops a little confetti.
import { play } from './sound.js';
import { burstConfetti } from './life.js';

const RESET_AFTER_MS = 2000;

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

function selectText(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

export function initCopy() {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-target]');
    if (!button) return;
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target) return;
    const label = button.dataset.label || button.textContent;
    button.dataset.label = label;
    let copied = false;
    try {
      copied = await copyText(target.textContent);
    } catch {
      copied = false;
    }
    if (!copied) selectText(target);
    button.textContent = copied ? 'Kopiert!' : 'Markiert, jetzt Strg+C';
    if (copied) {
      button.classList.add('is-done');
      play('pling');
      burstConfetti(button, { count: 18, spread: 0.25, rise: 0.35 });
      button.dispatchEvent(new CustomEvent('copied', { bubbles: true }));
    }
    clearTimeout(button._resetTimer);
    button._resetTimer = setTimeout(() => {
      button.textContent = label;
      button.classList.remove('is-done');
    }, RESET_AFTER_MS);
  });
}

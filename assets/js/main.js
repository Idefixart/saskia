// Boots every page module. Each module finds its own elements and does nothing if they're missing.
import { mountSprites } from './pixel.js';
import { initTheme } from './theme.js';
import { initCopy } from './copy.js';
import { initSos } from './sos.js';
import { initBrief } from './brief.js';
import { initLibrary, initDoctor } from './library.js';
import { initLife } from './life.js';
import { initSoundToggle, play } from './sound.js';
import { initIntro } from './intro.js';
import { initScenes } from './scenes.js';

mountSprites();
initTheme();
initSoundToggle();
initCopy();
initSos();
initBrief();
initLibrary();
initDoctor();
initLife();
initScenes();
initIntro();

// Every key gives a little blip (only when sound is switched on).
document.addEventListener('click', (event) => {
  if (event.target.closest('.btn:not([data-copy-target]), .filter, .chip, .map-sign, .theme-toggle')) play('blip');
});

document.querySelector('.crew-clawd')?.addEventListener('click', (event) => {
  const clawd = event.currentTarget;
  clawd.classList.remove('hop');
  void clawd.offsetWidth;
  clawd.classList.add('hop');
  play('blip');
});

document.querySelector('.car')?.addEventListener('click', () => play('horn'));

// Printing from the browser: open every diagnosis so the PDF shows all fixes.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details').forEach((d) => (d.open = true));
});

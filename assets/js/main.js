// Boots every page module. Each module finds its own elements and does nothing if they're missing.
import { mountSprites } from './pixel.js';
import { initTheme } from './theme.js';
import { initCopy } from './copy.js';
import { initSos } from './sos.js';
import { initBrief } from './brief.js';
import { initLibrary, initDoctor } from './library.js';
import { initLife } from './life.js';

mountSprites();
initTheme();
initCopy();
initSos();
initBrief();
initLibrary();
initDoctor();
initLife();

// Printing from the browser: open every diagnosis so the PDF shows all fixes.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details').forEach((d) => (d.open = true));
});

document.querySelector('.crew-clawd')?.addEventListener('click', (event) => {
  const clawd = event.currentTarget;
  clawd.classList.remove('hop');
  void clawd.offsetWidth;
  clawd.classList.add('hop');
});

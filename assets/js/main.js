// Boots every page module. Each module finds its own elements and does nothing if they're missing.
import { mountSprites } from './pixel.js';
import { initTheme } from './theme.js';

mountSprites();
initTheme();

document.querySelector('.crew-clawd')?.addEventListener('click', (event) => {
  const clawd = event.currentTarget;
  clawd.classList.remove('hop');
  void clawd.offsetWidth;
  clawd.classList.add('hop');
});

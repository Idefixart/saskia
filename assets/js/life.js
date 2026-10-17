// Hero life: parallax on scroll and a confetti burst from the plane once it has landed in view.
const CONFETTI_COLORS = ['#f2c14e', '#ec6f8e', '#8fd3b4', '#fff3dc', '#b9a0d6', '#d97757'];
const CONFETTI_COUNT = 70;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || reduceMotion()) return;
  let visible = true;
  let ticking = false;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(hero);
  window.addEventListener(
    'scroll',
    () => {
      if (!visible || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        hero.style.setProperty('--scroll', String(Math.round(window.scrollY)));
        ticking = false;
      });
    },
    { passive: true },
  );
}

// `spread` scales the sideways throw, `rise` (0..1) how high pieces shoot up before falling.
export function burstConfetti(originEl, { count = CONFETTI_COUNT, spread = 1, rise = 0.6 } = {}) {
  if (reduceMotion() || !originEl) return;
  const box = originEl.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const width = Math.min(window.innerWidth, 900);
  const pieces = Array.from({ length: count }, () => {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.setAttribute('aria-hidden', 'true');
    const throwX = (Math.random() - 0.5) * width * spread;
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.setProperty('--x0', `${x}px`);
    piece.style.setProperty('--y0', `${y}px`);
    piece.style.setProperty('--xm', `${x + throwX * 0.6}px`);
    piece.style.setProperty('--ym', `${y - rise * (120 + Math.random() * window.innerHeight * 0.45)}px`);
    piece.style.setProperty('--x1', `${x + throwX}px`);
    piece.style.setProperty('--y1', `${y + 280 + Math.random() * window.innerHeight * 0.6}px`);
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 900}deg`);
    piece.style.setProperty('--dur-fall', `${2 + Math.random() * 1.6}s`);
    piece.addEventListener('animationend', () => piece.remove());
    return piece;
  });
  document.body.append(...pieces);
}

export function initLife() {
  initParallax();
  const plane = document.querySelector('.plane');
  const flight = document.querySelector('.flight-inner');
  if (flight) {
    flight.addEventListener('animationend', (event) => {
      if (event.animationName === 'fly-in') burstConfetti(plane, { rise: 0.15 });
    });
  }
  plane?.closest('.flight')?.addEventListener('click', () => burstConfetti(plane, { rise: 0.15 }));
}

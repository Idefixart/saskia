// Day/night toggle. The initial theme is set inline in <head> before first paint.
export function initTheme() {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  const label = button.querySelector('.theme-toggle-label');
  const meta = document.querySelector('meta[name="theme-color"]');

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const night = theme === 'night';
    button.setAttribute('aria-pressed', String(night));
    button.setAttribute('aria-label', night ? 'Zum Tagmodus wechseln' : 'Zum Nachtmodus wechseln');
    label.textContent = night ? 'Tag' : 'Nacht';
    meta?.setAttribute('content', night ? '#1b1030' : '#ec7397');
  };

  apply(document.documentElement.getAttribute('data-theme') === 'night' ? 'night' : 'day');

  button.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'night' ? 'day' : 'night';
    apply(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  });
}

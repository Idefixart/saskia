// Prompt-Baukasten: turns the form into a ready-to-paste brief. Pure string building, no network.
const FALLBACK = '[noch offen]';

function value(form, name) {
  const field = form.elements[name];
  return field && field.value.trim() ? field.value.trim() : FALLBACK;
}

export function buildBrief(form) {
  const art = form.querySelector('input[name="art"]:checked')?.value || 'Website';
  const vibes = [...form.querySelectorAll('input[name="vibe"]:checked')].map((box) => box.value);
  const isShop = art.startsWith('Onlineshop');
  const legal = isShop
    ? 'Impressum, Datenschutz, AGB, Widerruf, Versand (Shopify-Rechtsseiten, deutsche Texte aus einer Kanzlei-App)'
    : 'Impressum und Datenschutz';

  return [
    `Ich möchte eine ${art} bauen. Bitte lies den Brief und zeig mir zuerst einen Plan. Noch keinen Code.`,
    '',
    `Name/Marke: ${value(form, 'name')}`,
    `Ziel: ${value(form, 'ziel')}`,
    `Zielgruppe: ${value(form, 'zielgruppe')}`,
    `Vibe: ${vibes.length ? vibes.join(', ') : FALLBACK}`,
    `Referenzen: ${value(form, 'referenzen')}`,
    `Seiten: ${value(form, 'seiten')}`,
    `Must-haves: ${value(form, 'must')}`,
    `No-Gos: ${value(form, 'nogos')}`,
    `Rechtliches: ${legal}`,
    '',
    'So arbeiten wir:',
    '1. Stell mir maximal drei Rückfragen, wenn etwas unklar ist.',
    '2. Schlag mir Farben, Schriften und Abstände als DESIGN.md vor.',
    '3. Bau mobil zuerst, Section für Section, und zeig mir jeden Schritt.',
    '4. Keine KI-Standards: keine lila Verläufe, kein Hero mit drei gleichen Karten, keine Emojis als Aufzählung.',
    isShop
      ? '5. Shopify: nur Dev-Store oder unveröffentlichtes Theme, nie --live oder --publish.'
      : '5. Fertig ist es erst, wenn du es im Browser auf Handy und Desktop geprüft hast.',
  ].join('\n');
}

export function initBrief() {
  const form = document.querySelector('.brief-form');
  const output = document.getElementById('brief-output');
  if (!form || !output) return;
  const render = () => {
    output.textContent = buildBrief(form);
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => event.preventDefault());
  render();
}

// Renders a sprite from sprites.js into a crisp inline SVG.
// Each horizontal run of one colour becomes one <rect>; runs whose palette key has a
// class (e.g. eyes) are grouped so CSS can animate them. The outline colour follows
// the CSS variable --px-ink so each theme can tint it.
import { PALETTE, SPRITES } from './sprites.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function fillFor(key) {
  return key === 'k' ? `var(--px-ink, ${PALETTE.k})` : PALETTE[key];
}

export function renderSprite(name, { title = '', className = '' } = {}) {
  const sprite = SPRITES[name];
  if (!sprite) throw new Error(`Unknown sprite: ${name}`);
  const { rows, classes = {} } = sprite;
  const width = rows[0].length;
  const svg = el('svg', {
    viewBox: `0 0 ${width} ${rows.length}`,
    'shape-rendering': 'crispEdges',
    class: `px ${className}`.trim(),
  });
  if (title) {
    svg.setAttribute('role', 'img');
    svg.append(Object.assign(el('title'), { textContent: title }));
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }

  const base = el('g');
  svg.append(base);
  const groups = new Map();
  const groupFor = (cls) => {
    if (!groups.has(cls)) {
      const g = el('g', { class: cls });
      groups.set(cls, g);
      svg.append(g);
    }
    return groups.get(cls);
  };

  rows.forEach((row, y) => {
    let x = 0;
    while (x < width) {
      const key = row[x];
      let end = x + 1;
      while (end < width && row[end] === key) end++;
      if (key !== '.') {
        const rect = el('rect', { x, y, width: end - x, height: 1, fill: fillFor(key) });
        (classes[key] ? groupFor(classes[key]) : base).append(rect);
      }
      x = end;
    }
  });
  return svg;
}

// Replaces every <span data-sprite="name" data-title="..."> with its SVG.
export function mountSprites(root = document) {
  root.querySelectorAll('[data-sprite]').forEach((slot) => {
    const svg = renderSprite(slot.dataset.sprite, {
      title: slot.dataset.title || '',
      className: slot.dataset.class || '',
    });
    slot.replaceChildren(svg);
  });
}

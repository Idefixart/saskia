// Skill-Bibliothek and Fehler-Doktor: render cards from the data modules.
import { CATEGORIES, SKILLS } from './data/skills.js';
import { DOCTOR } from './data/doctor.js';

function h(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(Boolean));
  return node;
}

const formatStars = (stars) => `${new Intl.NumberFormat('de-DE').format(stars)} Sterne`;

function skillCard(skill) {
  const category = CATEGORIES.find((c) => c.id === skill.cat);
  const repoLink = h('a', { href: `https://github.com/${skill.repo}`, rel: 'noopener', target: '_blank', textContent: skill.repo });
  const meta = skill.stars ? formatStars(skill.stars) : skill.official ? 'offiziell' : 'von Laurin';
  return h(
    'li',
    { className: `skill card${skill.id === 'laurin-helfer' ? ' skill-laurin' : ''}` },
    skill.fav ? h('span', { className: 'skill-fav', textContent: 'Laurins Favorit' }) : null,
    h('span', { className: 'skill-cat', textContent: category ? category.label : skill.cat }),
    h('h3', { textContent: skill.name }),
    h('p', { textContent: skill.nutzen }),
    h('p', { className: 'skill-when', textContent: `Wann: ${skill.wann}` }),
    h('div', { className: 'skill-foot' }, repoLink, h('span', { textContent: meta })),
  );
}

export function initLibrary() {
  const filters = document.querySelector('.filters');
  const grid = document.querySelector('.skill-grid');
  if (!filters || !grid) return;

  const render = (cat) => {
    grid.replaceChildren(...SKILLS.filter((s) => cat === 'alle' || s.cat === cat).map(skillCard));
    filters.querySelectorAll('.filter').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  };

  const all = [{ id: 'alle', label: 'Alle' }, ...CATEGORIES];
  filters.replaceChildren(
    ...all.map((c) => h('button', { type: 'button', className: 'filter', textContent: c.label, onclick: () => render(c.id) })),
  );
  filters.querySelectorAll('.filter').forEach((b, i) => (b.dataset.cat = all[i].id));
  render('alle');
}

export function initDoctor() {
  const root = document.querySelector('.doctor');
  if (!root) return;
  root.replaceChildren(
    ...DOCTOR.map((entry, i) => {
      const promptId = `doc-prompt-${i}`;
      return h(
        'details',
        { className: 'diagnosis' },
        h('summary', { textContent: entry.symptom }),
        h(
          'div',
          { className: 'diagnosis-body' },
          h('p', {}, h('strong', { textContent: 'Ursache' }), entry.ursache),
          h('p', {}, h('strong', { textContent: 'Fix' }), entry.fix),
          h(
            'div',
            { className: 'copybox' },
            h('pre', { id: promptId, textContent: entry.prompt }),
            copyButton(promptId),
          ),
        ),
      );
    }),
  );
}

function copyButton(targetId) {
  const button = h('button', { type: 'button', className: 'btn btn--mint', textContent: 'Prompt kopieren' });
  button.dataset.copyTarget = targetId;
  return button;
}

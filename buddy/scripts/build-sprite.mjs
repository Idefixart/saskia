// Builds server/sprite.json for the Windows overlay from the website's shared pixel art
// (../../assets/js/sprites.js): { name, palette, rows, anchor } for laurinPoint,
// falling back to laurinWave, then clawd. If the site sprites are missing or empty,
// writes a small built-in Clawd-orange blob so the buddy still works.
// Rerun after the site sprites change: node scripts/build-sprite.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, '..', '..', 'assets', 'js', 'sprites.js');
const TARGET = join(here, '..', 'server', 'sprite.json');
const PREFERRED = ['laurinPoint', 'laurinWave', 'clawd'];
const HEX = /^#[0-9a-fA-F]{6}$/;
const TRANSPARENCY_KEY = '#FF00FF';

const FALLBACK = {
  name: 'fallback',
  palette: { k: '#2A2019', o: '#D97757', O: '#B85C3E' },
  rows: [
    '..kkkkkkkk..',
    '.kooooooook.',
    'kooooooooook',
    'kookooookook',
    'kookooookook',
    'kooooooooook',
    'koooooooooOk',
    'kooooooooOOk',
    '.kOooooooOk.',
    '..kOOOOOOk..',
    '..kok..kok..',
    '..kkk..kkk..',
  ],
  anchor: { x: 0, y: 5 },
};

export function validateSprite({ palette, rows, anchor }) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('sprite has no rows');
  const width = rows[0].length;
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`row ${y} is ${row.length} wide, expected ${width}`);
    for (const ch of row) {
      if (ch !== '.' && !(ch in palette)) throw new Error(`row ${y} uses unknown colour key "${ch}"`);
    }
  });
  for (const [key, value] of Object.entries(palette)) {
    if (key.length !== 1 || !HEX.test(value)) throw new Error(`palette entry ${key}=${value} is not #RRGGBB`);
    // The overlay window uses magenta as its see-through colour key.
    if (value.toUpperCase() === TRANSPARENCY_KEY) throw new Error(`palette entry ${key} is the transparency key`);
  }
  if (!Number.isInteger(anchor?.x) || !Number.isInteger(anchor?.y)) throw new Error('anchor needs integer x and y');
  if (anchor.x < 0 || anchor.y < 0 || anchor.x >= width || anchor.y >= rows.length) {
    throw new Error(`anchor (${anchor.x}, ${anchor.y}) is outside the ${width}x${rows.length} sprite`);
  }
}

// No anchor given: the leftmost opaque cell, nearest to the sprite's upper third.
function guessAnchor(rows) {
  const preferredY = Math.floor(rows.length / 3);
  for (let x = 0; x < rows[0].length; x += 1) {
    const ys = rows.map((row, y) => (row[x] !== '.' ? y : -1)).filter((y) => y >= 0);
    if (ys.length) {
      const y = ys.reduce((best, cur) => (Math.abs(cur - preferredY) < Math.abs(best - preferredY) ? cur : best));
      return { x, y };
    }
  }
  return { x: 0, y: preferredY };
}

function usedPalette(rows, palette) {
  const keys = new Set(rows.join('').replaceAll('.', ''));
  return Object.fromEntries(Object.entries(palette).filter(([key]) => keys.has(key)));
}

async function fromSite() {
  if (!existsSync(SOURCE)) return { sprite: null, reason: `${SOURCE} not found` };
  const { PALETTE, SPRITES } = await import(pathToFileURL(SOURCE).href);
  for (const name of PREFERRED) {
    const art = SPRITES?.[name];
    if (!art?.rows?.length || !art.rows[0]?.length) continue;
    const rows = [...art.rows];
    const sprite = {
      name,
      palette: usedPalette(rows, PALETTE ?? {}),
      rows,
      anchor: art.anchor ? { x: art.anchor.x, y: art.anchor.y } : guessAnchor(rows),
    };
    validateSprite(sprite);
    return { sprite, reason: null };
  }
  return { sprite: null, reason: `none of ${PREFERRED.join(', ')} has rows yet` };
}

export { FALLBACK };

export async function buildSprite() {
  const { sprite, reason } = await fromSite();
  if (sprite) return sprite;
  console.warn(`build-sprite: using the built-in fallback (${reason})`);
  validateSprite(FALLBACK);
  return FALLBACK;
}

function isMain() {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  const invoked = resolve(process.argv[1]);
  return process.platform === 'win32' ? self.toLowerCase() === invoked.toLowerCase() : self === invoked;
}

if (isMain()) {
  const sprite = await buildSprite();
  writeFileSync(TARGET, `${JSON.stringify(sprite, null, 2)}\n`);
  console.log(
    `build-sprite: wrote ${TARGET} from "${sprite.name}" (${sprite.rows[0].length}x${sprite.rows.length}, anchor ${sprite.anchor.x},${sprite.anchor.y})`,
  );
}

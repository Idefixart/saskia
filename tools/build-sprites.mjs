// Builds assets/js/sprites.js from run-length-encoded pixel parts.
// Fills are drawn without outlines; outline() adds an ink border around every shape.
// Run: node tools/build-sprites.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PALETTE = {
  k: '#2A2019', // outline / ink
  o: '#D97757', // clawd terracotta
  O: '#B85C3E', // clawd shade
  e: '#2E3440', // eyes
  w: '#FFFFFF', // white
  s: '#F4C9AE', // skin
  S: '#E0A586', // skin shade
  r: '#F2A091', // cheeks
  h: '#9C6E48', // hair
  l: '#C29467', // hair highlight
  H: '#6B4A33', // hair fade
  B: '#5A3B24', // brows
  b: '#94653F', // beard
  m: '#B65A4E', // mouth
  t: '#463D39', // t-shirt
  T: '#5E524C', // t-shirt highlight
  j: '#3F5573', // jeans
  g: '#B9B1A6', // sole
  c: '#F3EFE6', // doctor's coat
  n: '#7D8A99', // steel (stethoscope)
  q: '#4E5F80', // pilot cap
  y: '#FFD66B', // party hat
  p: '#F6B8C6', // pink
};

// 'h4l2.3' -> 'hhhhll...'
function rle(spec) {
  return spec.replace(/\s+/g, '').replace(/(.)(\d+)/g, (_, ch, n) => ch.repeat(Number(n)));
}

function part(width, specs) {
  return specs.map((spec, i) => {
    const row = rle(spec);
    if (row.length !== width) throw new Error(`row ${i} is ${row.length} wide, expected ${width}: ${spec}`);
    return row;
  });
}

function grid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill('.'));
}

function stamp(g, x0, y0, rows) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      if (!g[y0 + y] || x0 + x < 0 || x0 + x >= g[0].length) throw new Error(`part out of grid at ${x0 + x},${y0 + y}`);
      g[y0 + y][x0 + x] = ch;
    });
  });
}

// Stamps a part on top of other shapes and inks its border where it overlaps them,
// so a hand in front of the face stays readable.
function stampOver(g, x0, y0, rows) {
  const mine = new Set();
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && mine.add(`${x0 + x},${y0 + y}`)));
  stamp(g, x0, y0, rows);
  for (const key of mine) {
    const [x, y] = key.split(',').map(Number);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (mine.has(`${nx},${ny}`)) continue;
        if (g[ny]?.[nx] && g[ny][nx] !== '.') g[ny][nx] = 'k';
      }
    }
  }
}

// Every transparent cell that touches a filled cell (8-neighbourhood) becomes ink.
function outline(g) {
  const out = g.map((r) => [...r]);
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] !== '.') continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1 && !touches; dx++) {
          const c = g[y + dy]?.[x + dx];
          if (c && c !== '.' && c !== 'k') touches = true;
        }
      }
      if (touches) out[y][x] = 'k';
    }
  }
  return out;
}

const toRows = (g) => g.map((r) => r.join(''));

// ---------- Pixel-Laurin ----------
// Head, 24 wide: swept-back quiff with a highlight streak, darker fade on the sides,
// strong brows, blue-grey eyes, round cheeks, thin mustache and chin goatee.
const HEAD = part(24, [
  '.10 h4 .10',
  '.7 h4 l2 h4 .7',
  '.5 h7 l2 h5 .5',
  '.4 h9 l2 h5 .4',
  '.3 h11 l2 h5 .3',
  '.2 H1 h12 l1 h5 H1 .2',
  '.2 H2 h16 H2 .2',
  '.2 H2 s16 H2 .2',
  '.2 H1 s18 H1 .2',
  '.2 H1 s3 B4 s4 B4 s3 H1 .2',
  '.1 s1 S1 s4 e1 w1 s6 e1 w1 s4 S1 s1 .1',
  '.1 s1 S1 s4 e2 s6 e2 s4 S1 s1 .1',
  '.1 s10 S2 s10 .1',
  '.2 s2 r2 s12 r2 s2 .2',
  '.2 s2 r2 s4 b4 s4 r2 s2 .2',
  '.3 s7 m4 s7 .3',
  '.4 s7 b2 s7 .4',
  '.6 s4 b4 s4 .6',
  '.8 s2 b4 s2 .8',
  '.9 s1 b4 s1 .9',
]);

// Small chibi body (24 wide, aligned with HEAD). Tiny Clawd print on the shirt.
const TORSO = part(24, [
  '.8 t3 s2 t3 .8',
  '.6 t12 .6',
  '.7 t2 T1 t7 .7',
  '.8 t8 .8',
  '.8 t3 o2 t3 .8',
  '.8 t8 .8',
  '.8 j8 .8',
  '.8 j3 .2 j3 .8',
  '.8 j3 .2 j3 .8',
  '.7 w4 .2 w4 .7',
  '.7 g4 .2 g4 .7',
]);

const ARM_LEFT_DOWN = part(3, ['.2 t1', 't3', 't2 .1', 's2 .1', 's2 .1']);
const ARM_RIGHT_DOWN = part(3, ['t1 .2', 't3', '.1 t2', '.1 s2', '.1 s2']);

// Raised open hand next to the head (waving).
const ARM_WAVE = part(11, [
  's2 .9',
  's3 .8',
  's3 .8',
  '.1 s2 .8',
  '.2 s2 .7',
  '.3 s2 .6',
  '.4 s2 .5',
  '.5 s2 .4',
  '.6 s2 .3',
  '.7 t3 .1',
  '.8 t3',
]);

// Second wave frame: hand tipped outwards, fingers spread.
const ARM_WAVE_B = part(11, [
  '.1 s1 .1 s1 .7',
  '.1 s3 .7',
  '.1 s3 .7',
  '.2 s2 .7',
  '.3 s2 .6',
  '.3 s2 .6',
  '.4 s2 .5',
  '.5 s2 .4',
  '.6 s2 .3',
  '.7 t3 .1',
  '.8 t3',
]);

// Arm stretched up-left with the index finger out (buddy pointing pose).
const ARM_POINT = part(11, [
  's1 .10',
  '.1 s1 .9',
  '.1 s3 .7',
  '.1 s4 .6',
  '.2 s3 .6',
  '.4 s2 .5',
  '.5 s2 .4',
  '.6 s2 .3',
  '.7 t3 .1',
  '.8 t3',
]);

// Salute: flat hand at the forehead, elbow out to the right.
const ARM_SALUTE = part(13, [
  's8 .5',
  '.1 s9 .3',
  '.9 s3 .1',
  '.10 s2 .1',
  '.11 s2',
  '.11 s2',
  '.11 s2',
  '.10 s3',
  '.9 t3 .1',
  '.8 s2 .3',
  '.7 s2 .4',
  '.6 t2 .5',
  '.5 t3 .5',
  '.4 t3 .6',
  '.4 t2 .7',
]);

// Thumbs up in front of the chest.
const ARM_THUMBS = part(7, ['.2 s1 .4', '.2 s1 .4', 's4 .1 t2', 's6 t1', 's4 .1 t2']);

const HEAD_X = 6;
const HEAD_Y = 1;
const TORSO_Y = HEAD_Y + HEAD.length; // 21

// Costumes: a different torso and/or a hat stamped over the hair.
const TORSO_COAT = part(24, [
  '.8 c3 s2 c3 .8',
  '.6 c5 t2 c5 .6',
  '.7 c3 n1 t2 c4 .7',
  '.8 c2 n1 t2 c3 .8',
  '.8 c2 n1 t2 c3 .8',
  '.8 c1 n2 t2 c3 .8',
  '.8 j8 .8',
  '.8 j3 .2 j3 .8',
  '.8 j3 .2 j3 .8',
  '.7 w4 .2 w4 .7',
  '.7 g4 .2 g4 .7',
]);

const HARD_HAT = part(24, ['.8 y8 .8', '.6 y12 .6', '.5 y14 .5', '.4 y16 .4', '.2 y20 .2']);
const PILOT_CAP = part(24, ['.8 q8 .8', '.6 q5 y2 q5 .6', '.5 q14 .5', '.4 q16 .4', '.4 B18 .2']);

const coat = (rows) => rows.map((row) => row.replaceAll('t', 'c'));

function laurin({ behind = [], over = [], torso = TORSO, hat = null }) {
  const g = grid(34, 34);
  stamp(g, HEAD_X, TORSO_Y, torso);
  for (const [rows, x, y] of behind) stamp(g, x, y, rows);
  stamp(g, HEAD_X, HEAD_Y, HEAD);
  if (hat) stamp(g, HEAD_X, HEAD_Y, hat);
  for (const [rows, x, y] of over) stampOver(g, x, y, rows);
  return toRows(outline(g));
}

const ARM_L_DOWN = [ARM_LEFT_DOWN, HEAD_X + 5, TORSO_Y + 1];
const ARM_R_DOWN = [ARM_RIGHT_DOWN, HEAD_X + 16, TORSO_Y + 1];

// The pointing finger tip of laurinPoint is the first cell of ARM_POINT.
const POINT_ANCHOR = { x: 1, y: 12 };

const laurinWave = laurin({ behind: [[ARM_WAVE, 2, 11], ARM_R_DOWN] });
const laurinWaveB = laurin({ behind: [[ARM_WAVE_B, 2, 11], ARM_R_DOWN] });
const laurinPoint = laurin({ behind: [[ARM_POINT, POINT_ANCHOR.x, POINT_ANCHOR.y], ARM_R_DOWN] });
const laurinSalute = laurin({ behind: [ARM_L_DOWN], over: [[ARM_SALUTE, 19, 7]] });
const laurinThumbs = laurin({ behind: [ARM_L_DOWN], over: [[ARM_THUMBS, 17, 23]] });
const laurinDoc = laurin({
  torso: TORSO_COAT,
  behind: [
    [coat(ARM_LEFT_DOWN), HEAD_X + 5, TORSO_Y + 1],
    [coat(ARM_RIGHT_DOWN), HEAD_X + 16, TORSO_Y + 1],
  ],
});
const laurinBuilder = laurin({ behind: [[ARM_WAVE, 2, 11], ARM_R_DOWN], hat: HARD_HAT });
const laurinPilot = laurin({ behind: [ARM_L_DOWN], over: [[ARM_SALUTE, 19, 7]], hat: PILOT_CAP });

// ---------- Clawd with party hat ----------
const CLAWD = part(16, [
  '.7 p1 .8',
  '.6 y3 .7',
  '.6 y1 p1 y1 .7',
  '.5 y5 .6',
  '.5 p1 y3 p1 .6',
  '.4 y7 .5',
  '.2 o12 .2',
  '.2 o12 .2',
  '.2 o2 e2 o4 e2 o2 .2',
  '.2 o2 e2 o4 e2 o2 .2',
  'o16',
  'o16',
  '.2 o12 .2',
  '.2 O12 .2',
  '.2 o1 .1 o1 .6 o1 .1 o1 .2',
  '.2 O1 .1 O1 .6 O1 .1 O1 .2',
]);

function clawd() {
  const g = grid(18, 18);
  stamp(g, 1, 1, CLAWD);
  return toRows(outline(g));
}

const SPRITES = {
  clawd: { rows: clawd(), classes: { e: 'px-eyes' } },
  laurinWave: { rows: laurinWave, classes: { e: 'px-eyes' } },
  laurinWaveB: { rows: laurinWaveB, classes: { e: 'px-eyes' } },
  laurinPoint: { rows: laurinPoint, classes: { e: 'px-eyes' }, anchor: POINT_ANCHOR },
  laurinSalute: { rows: laurinSalute, classes: { e: 'px-eyes' } },
  laurinThumbs: { rows: laurinThumbs, classes: { e: 'px-eyes' } },
  laurinDoc: { rows: laurinDoc, classes: { e: 'px-eyes' } },
  laurinBuilder: { rows: laurinBuilder, classes: { e: 'px-eyes' } },
  laurinPilot: { rows: laurinPilot, classes: { e: 'px-eyes' } },
};

const banner = `// GENERATED by tools/build-sprites.mjs. Edit the generator, not this file.
// Pixel-art sprites shared by the website and laurin-buddy.
// Each row is a string; each char is a PALETTE key, '.' = transparent.
// \`classes\` maps palette keys to CSS classes so parts can animate (eyes blink).
// \`anchor\` is the pointer tip in grid cells (used by the buddy overlay).
`;

const out = `${banner}export const PALETTE = ${JSON.stringify(PALETTE, null, 2)};

export const SPRITES = ${JSON.stringify(SPRITES, null, 2)};
`;

const target = fileURLToPath(new URL('../assets/js/sprites.js', import.meta.url));
writeFileSync(target, out);
console.log(`wrote ${target}`);

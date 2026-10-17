import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FALLBACK, validateSprite } from '../scripts/build-sprite.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the bundled server/sprite.json is valid pixel art with an anchor', () => {
  const sprite = JSON.parse(readFileSync(join(root, 'server', 'sprite.json'), 'utf8'));
  assert.doesNotThrow(() => validateSprite(sprite));
  const { x, y } = sprite.anchor;
  assert.notEqual(sprite.rows[y][x], '.', 'the anchor (fingertip) is an opaque cell');
});

test('the built-in fallback is valid', () => {
  assert.doesNotThrow(() => validateSprite(FALLBACK));
  assert.equal(FALLBACK.rows.length, 12);
});

test('validateSprite rejects ragged rows, unknown keys and the transparency key', () => {
  const palette = { k: '#2A2019' };
  const anchor = { x: 0, y: 0 };
  assert.throws(() => validateSprite({ palette, rows: ['kk', 'k'], anchor }), /wide/);
  assert.throws(() => validateSprite({ palette, rows: ['kz'], anchor }), /unknown colour key/);
  assert.throws(() => validateSprite({ palette: { k: '#ff00ff' }, rows: ['k'], anchor }), /transparency key/);
  assert.throws(() => validateSprite({ palette, rows: ['k'], anchor: { x: 3, y: 0 } }), /outside/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toScreen, fitWidth } from '../server/geometry.js';

test('fitWidth keeps small screens', () => {
  assert.deepEqual(fitWidth(1024, 768), { imgW: 1024, imgH: 768 });
});
test('fitWidth scales 4K down to 1280', () => {
  assert.deepEqual(fitWidth(3840, 2160), { imgW: 1280, imgH: 720 });
});
test('toScreen maps image coords to physical pixels incl. monitor offset', () => {
  const shot = { left: 1920, top: 0, width: 3840, height: 2160, imgW: 1280, imgH: 720 };
  assert.deepEqual(toScreen(shot, 640, 360), { x: 1920 + 1920, y: 1080 });
});
test('toScreen clamps outside points to the monitor', () => {
  const shot = { left: 0, top: 0, width: 1920, height: 1080, imgW: 1280, imgH: 720 };
  assert.deepEqual(toScreen(shot, 5000, -10), { x: 1919, y: 0 });
});

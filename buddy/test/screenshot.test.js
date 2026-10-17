import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGeometry, captureScreen } from '../server/screenshot.js';

test('parseGeometry takes the last JSON line of the PowerShell output', () => {
  const stdout = [
    'WARNING: something harmless',
    '{"left":-1920,"top":0,"width":1920,"height":1080,"imgW":1280,"imgH":720,"path":"C:\\\\Temp\\\\x.jpg"}',
    '',
  ].join('\r\n');
  assert.deepEqual(parseGeometry(stdout), {
    left: -1920,
    top: 0,
    width: 1920,
    height: 1080,
    imgW: 1280,
    imgH: 720,
    path: 'C:\\Temp\\x.jpg',
  });
});

test('parseGeometry rejects output without usable geometry', () => {
  assert.throws(() => parseGeometry('Add-Type : compile error'), /no geometry/);
  assert.throws(() => parseGeometry('{"left":0,"top":0,"width":0,"height":0,"imgW":0,"imgH":0}'), /empty/);
  assert.throws(() => parseGeometry('{"left":0}'), /misses top/);
});

test('fake capture is a JPEG with the documented geometry', async () => {
  const { data, mimeType, shot } = await captureScreen({ platform: 'fake' });
  assert.equal(mimeType, 'image/jpeg');
  assert.equal(Buffer.from(data, 'base64').subarray(0, 2).toString('hex'), 'ffd8');
  assert.deepEqual(shot, { left: 0, top: 0, width: 2560, height: 1440, imgW: 1280, imgH: 720 });
});

test('unsupported platforms fail with a German message', async () => {
  await assert.rejects(captureScreen({ platform: 'linux' }), /Screenshots gehen auf linux nicht/);
});

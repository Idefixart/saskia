// Screenshot of the monitor under the mouse, downscaled for Claude.
// Returns { data: base64 JPEG, mimeType, shot: { left, top, width, height, imgW, imgH } }.
import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fitWidth } from './geometry.js';

const MAX_WIDTH = 1280;
const CAPTURE_TIMEOUT_MS = 20000;

// A real 1x1 JPEG (terracotta pixel) for BUDDY_FAKE=1.
const FAKE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwQDAwMEBQQEBAQFBwUFBQUFBwgHBwcHBwcICAgICAgICAoKCgoKCgsLCwsLDQ0NDQ0NDQ0NDf/bAEMBAgICAwMDBgMDBg0JBwkNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDf/dAAQAAf/aAAwDAQACEQMRAD8A9Eooor+ez+0D/9k=';

const FAKE_SHOT = Object.freeze({ left: 0, top: 0, width: 2560, height: 1440, imgW: 1280, imgH: 720 });

let counter = 0;

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: CAPTURE_TIMEOUT_MS, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${error.message}${stderr ? ` | ${String(stderr).trim()}` : ''}`));
        return;
      }
      resolve(String(stdout));
    });
  });
}

function tempJpeg() {
  counter += 1;
  return join(tmpdir(), `laurin-buddy-${process.pid}-${Date.now()}-${counter}.jpg`);
}

// The PowerShell script may print warnings; the geometry is the last JSON line.
export function parseGeometry(stdout) {
  const line = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('{') && l.endsWith('}'))
    .at(-1);
  if (!line) throw new Error(`no geometry in screenshot output: ${stdout.slice(0, 300)}`);
  const geo = JSON.parse(line);
  for (const key of ['left', 'top', 'width', 'height', 'imgW', 'imgH']) {
    if (!Number.isFinite(geo[key])) throw new Error(`screenshot geometry misses ${key}`);
  }
  if (geo.width <= 0 || geo.height <= 0 || geo.imgW <= 0 || geo.imgH <= 0) {
    throw new Error('screenshot geometry has an empty size');
  }
  return geo;
}

async function captureWindows(scriptsDir) {
  const out = tempJpeg();
  try {
    const stdout = await run('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(scriptsDir, 'screenshot-windows.ps1'),
      '-Out',
      out,
      '-MaxWidth',
      String(MAX_WIDTH),
    ]);
    const { left, top, width, height, imgW, imgH } = parseGeometry(stdout);
    // Read our own path: the echoed one went through the console code page (umlauts in user names).
    const data = (await readFile(out)).toString('base64');
    return { data, mimeType: 'image/jpeg', shot: { left, top, width, height, imgW, imgH } };
  } finally {
    await rm(out, { force: true });
  }
}

// Dev only: the main display on macOS. Coordinates are not used there (no overlay).
async function captureMac() {
  const out = tempJpeg();
  try {
    await run('screencapture', ['-x', '-t', 'jpg', out]);
    const sizeOut = await run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out]);
    const width = Number(/pixelWidth:\s*(\d+)/.exec(sizeOut)?.[1]);
    const height = Number(/pixelHeight:\s*(\d+)/.exec(sizeOut)?.[1]);
    if (!width || !height) throw new Error('sips could not read the screenshot size');
    const { imgW, imgH } = fitWidth(width, height, MAX_WIDTH);
    if (imgW !== width) await run('sips', ['--resampleWidth', String(imgW), out]);
    const data = (await readFile(out)).toString('base64');
    return { data, mimeType: 'image/jpeg', shot: { left: 0, top: 0, width, height, imgW, imgH } };
  } finally {
    await rm(out, { force: true });
  }
}

export async function captureScreen({ platform, scriptsDir }) {
  if (platform === 'fake') return { data: FAKE_JPEG_BASE64, mimeType: 'image/jpeg', shot: { ...FAKE_SHOT } };
  if (platform === 'win32') return captureWindows(scriptsDir);
  if (platform === 'darwin') return captureMac();
  throw new Error(`Screenshots gehen auf ${platform} nicht.`);
}

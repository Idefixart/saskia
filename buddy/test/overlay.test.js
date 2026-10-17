import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createProcessOverlay, encodeCommand } from '../server/overlay.js';

// A stand-in for overlay-windows.ps1 that speaks the same stdin/stdout protocol.
// mode "ok": acks every command. "die": exits on the first command. "silent": never answers.
const STUB = `
const mode = process.argv[1];
console.log(JSON.stringify({ ok: true, cmd: 'ready' }));
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  const lines = buf.split('\\n');
  buf = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    if (mode === 'die') process.exit(3);
    if (mode === 'silent') continue;
    if (msg.cmd === 'bad') { console.log(JSON.stringify({ ok: false, cmd: 'bad', error: 'unknown cmd' })); continue; }
    console.log(JSON.stringify({ ok: true, cmd: msg.cmd, text: msg.text }));
    if (msg.cmd === 'quit') process.exit(0);
  }
});
process.stdin.on('end', () => process.exit(0));
`;

function stubSpawner(modes) {
  const spawned = [];
  const spawnProcess = () => {
    const mode = modes[Math.min(spawned.length, modes.length - 1)];
    const proc = spawn(process.execPath, ['-e', STUB, mode], { stdio: ['pipe', 'pipe', 'pipe'] });
    spawned.push(proc);
    return proc;
  };
  return { spawnProcess, spawned };
}

const quiet = () => {};

test('encodeCommand keeps key order and escapes non-ASCII', () => {
  assert.equal(
    encodeCommand({ cmd: 'point', x: 1, y: 2, text: 'Grüße' }),
    '{"cmd":"point","x":1,"y":2,"text":"Gr\\u00fc\\u00dfe"}',
  );
  assert.equal(JSON.parse(encodeCommand({ text: 'Grüße 👋' })).text, 'Grüße 👋');
});

test('point starts the overlay and resolves on its ack', async () => {
  const { spawnProcess, spawned } = stubSpawner(['ok']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet });
  const ack = await overlay.send({ cmd: 'point', x: 5, y: 6, text: 'Hallo Saskia' });
  assert.deepEqual(ack, { ok: true, cmd: 'point', text: 'Hallo Saskia' });
  assert.equal(spawned.length, 1);
  overlay.stop();
});

test('hide does not start an overlay that is not running', async () => {
  const { spawnProcess, spawned } = stubSpawner(['ok']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet });
  await overlay.send({ cmd: 'hide' });
  assert.equal(spawned.length, 0);
});

test('a dead overlay is restarted once', async () => {
  const { spawnProcess, spawned } = stubSpawner(['die', 'ok']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet });
  const ack = await overlay.send({ cmd: 'point', x: 1, y: 1, text: 'nochmal' });
  assert.equal(ack.cmd, 'point');
  assert.equal(spawned.length, 2);
  overlay.stop();
});

test('gives up after one restart', async () => {
  const { spawnProcess, spawned } = stubSpawner(['die', 'die']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet });
  await assert.rejects(overlay.send({ cmd: 'point', x: 1, y: 1, text: 'x' }), /exited/);
  assert.equal(spawned.length, 2);
});

test('a silent overlay times out, is killed and restarted once', async () => {
  const { spawnProcess, spawned } = stubSpawner(['silent', 'silent']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet, firstAckTimeoutMs: 300, ackTimeoutMs: 300 });
  await assert.rejects(overlay.send({ cmd: 'point', x: 1, y: 1, text: 'x' }), /did not answer/);
  assert.equal(spawned.length, 2);
  const gone = (p) => p.exitCode !== null || p.signalCode !== null;
  await Promise.all(spawned.map((p) => (gone(p) ? null : once(p, 'exit'))));
  assert.ok(spawned.every((p) => p.signalCode === 'SIGTERM'), 'stubs were killed');
});

test('a refused command is reported without a restart', async () => {
  const { spawnProcess, spawned } = stubSpawner(['ok']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet });
  await overlay.send({ cmd: 'point', x: 1, y: 1, text: 'x' });
  await assert.rejects(overlay.send({ cmd: 'bad' }), /unknown cmd/);
  assert.equal(spawned.length, 1);
  overlay.stop();
});

test('stop sends quit and the overlay exits', async () => {
  const { spawnProcess, spawned } = stubSpawner(['ok']);
  const overlay = createProcessOverlay({ spawnProcess, log: quiet });
  await overlay.send({ cmd: 'point', x: 1, y: 1, text: 'x' });
  const exited = new Promise((resolve) => spawned[0].on('exit', resolve));
  overlay.stop();
  assert.equal(await exited, 0);
  assert.equal(overlay.isRunning(), false);
});

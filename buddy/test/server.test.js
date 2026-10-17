import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workDir = mkdtempSync(join(tmpdir(), 'laurin-buddy-test-'));

async function connect(extraEnv) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(root, 'server', 'index.js')],
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'buddy-test', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

function textOf(result) {
  return result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
}

function logLines(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean);
}

after(() => rmSync(workDir, { recursive: true, force: true }));

test('fake platform: tools, screenshot, point and hide', async (t) => {
  const log = join(workDir, 'overlay.log');
  const client = await connect({ BUDDY_FAKE: '1', BUDDY_FAKE_LOG: log });
  t.after(() => client.close());

  await t.test('lists exactly the three tools', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name).sort(), ['ausblenden', 'bildschirm_ansehen', 'zeigen']);
    for (const tool of tools) assert.ok(tool.description.length > 40, `${tool.name} needs a real description`);
  });

  await t.test('zeigen before any screenshot asks for one first', async () => {
    const res = await client.callTool({ name: 'zeigen', arguments: { x: 10, y: 10, text: 'Hier' } });
    assert.equal(res.isError, true);
    assert.equal(textOf(res), 'Erst bildschirm_ansehen aufrufen.');
    assert.deepEqual(logLines(log), []);
  });

  await t.test('bildschirm_ansehen returns a JPEG and the image size', async () => {
    const res = await client.callTool({ name: 'bildschirm_ansehen', arguments: {} });
    assert.ok(!res.isError);
    const image = res.content.find((c) => c.type === 'image');
    assert.ok(image, 'image content present');
    assert.equal(image.mimeType, 'image/jpeg');
    assert.equal(Buffer.from(image.data, 'base64').subarray(0, 2).toString('hex'), 'ffd8');
    assert.equal(textOf(res), 'Screenshot 1280x720. Koordinaten für zeigen() beziehen sich auf dieses Bild.');
  });

  await t.test('zeigen maps image coords to physical pixels and sends point', async () => {
    const res = await client.callTool({ name: 'zeigen', arguments: { x: 640, y: 360, text: 'Hier' } });
    assert.ok(!res.isError, textOf(res));
    assert.equal(textOf(res), 'Pixel-Laurin zeigt auf (640, 360).');
    assert.equal(logLines(log).at(-1), '{"cmd":"point","x":1280,"y":720,"text":"Hier"}');
  });

  await t.test('zeigen rejects bubbles longer than 140 characters', async () => {
    const res = await client.callTool({ name: 'zeigen', arguments: { x: 1, y: 1, text: 'x'.repeat(141) } });
    assert.equal(res.isError, true);
  });

  await t.test('a new screenshot hides the visible buddy first', async () => {
    const before = logLines(log).length;
    const res = await client.callTool({ name: 'bildschirm_ansehen', arguments: {} });
    assert.ok(!res.isError);
    assert.deepEqual(logLines(log).slice(before), ['{"cmd":"hide"}']);
  });

  await t.test('ausblenden sends hide', async () => {
    await client.callTool({ name: 'zeigen', arguments: { x: 0, y: 0, text: 'Oben links' } });
    const res = await client.callTool({ name: 'ausblenden', arguments: {} });
    assert.ok(!res.isError);
    assert.equal(textOf(res), 'Pixel-Laurin ist weg.');
    assert.equal(logLines(log).at(-1), '{"cmd":"hide"}');
  });
});

test('non-Windows platform: zeigen explains it only runs on Windows', async (t) => {
  const client = await connect({ BUDDY_FAKE: '', BUDDY_PLATFORM: 'linux' });
  t.after(() => client.close());
  const res = await client.callTool({ name: 'zeigen', arguments: { x: 5, y: 5, text: 'Hier' } });
  assert.equal(res.isError, true);
  assert.equal(textOf(res), 'Der schwebende Buddy läuft nur unter Windows.');
});

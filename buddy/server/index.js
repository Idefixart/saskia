#!/usr/bin/env node
// laurin-buddy: MCP server. Pixel-Laurin looks at Saskia's screen and points where to click.
// It never clicks or types. stdout is the MCP channel, so diagnostics go to stderr only.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { toScreen } from './geometry.js';
import { captureScreen } from './screenshot.js';
import { createOverlay } from './overlay.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const HIDE_SETTLE_MS = 150;
const MAX_BUBBLE = 140;

// BUDDY_FAKE=1: no real screen, overlay commands go to BUDDY_FAKE_LOG (tests).
// BUDDY_PLATFORM: test-only override of process.platform.
const platform = process.env.BUDDY_FAKE === '1' ? 'fake' : process.env.BUDDY_PLATFORM || process.platform;

function log(message) {
  process.stderr.write(`[laurin-buddy] ${message}\n`);
}

const overlay = createOverlay({
  platform,
  scriptsDir: join(root, 'scripts'),
  spritePath: join(here, 'sprite.json'),
  fakeLog: process.env.BUDDY_FAKE_LOG,
  log,
});

let lastShot = null;
let buddyVisible = false;

const text = (t) => ({ type: 'text', text: t });
const ok = (t) => ({ content: [text(t)] });
const fail = (t) => ({ content: [text(t)], isError: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = new McpServer({ name: 'laurin-buddy', version });

server.registerTool(
  'bildschirm_ansehen',
  {
    title: 'Bildschirm ansehen',
    description: [
      'Macht einen Screenshot von Saskias Bildschirm (der Monitor, auf dem gerade ihre Maus ist) und zeigt dir, was sie sieht.',
      'Benutze das, wenn Saskia fragt, wo sie klicken soll, auf dem Bildschirm etwas nicht findet, nicht weiterkommt oder "zeig mal" / "zeig mir, wo ..." sagt.',
      'Pixel-Laurin wird für das Foto kurz ausgeblendet.',
      'Mach vor JEDEM zeigen()-Schritt einen frischen Screenshot, denn nach ihrem Klick sieht der Bildschirm anders aus.',
      'Nicht ungefragt aufrufen, nur wenn Saskia Hilfe auf dem Bildschirm möchte.',
    ].join(' '),
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => {
    try {
      if (buddyVisible && overlay.supported) {
        await overlay.send({ cmd: 'hide' });
        buddyVisible = false;
        await sleep(HIDE_SETTLE_MS);
      }
      const { data, mimeType, shot } = await captureScreen({ platform, scriptsDir: join(root, 'scripts') });
      lastShot = shot;
      log(`screenshot ${shot.imgW}x${shot.imgH} of monitor ${shot.width}x${shot.height} at (${shot.left}, ${shot.top})`);
      return {
        content: [
          { type: 'image', data, mimeType },
          text(`Screenshot ${shot.imgW}x${shot.imgH}. Koordinaten für zeigen() beziehen sich auf dieses Bild.`),
        ],
      };
    } catch (error) {
      log(`screenshot failed: ${error.stack || error.message}`);
      return fail(`Screenshot hat nicht geklappt: ${error.message}`);
    }
  },
);

server.registerTool(
  'zeigen',
  {
    title: 'Pixel-Laurin zeigen lassen',
    description: [
      'Pixel-Laurin fliegt über Saskias Bildschirm zu einer Stelle und zeigt mit einem Pfeil darauf, dazu eine kurze Sprechblase.',
      'x und y sind Pixel im LETZTEN Screenshot von bildschirm_ansehen (0,0 = oben links im Bild); ziel auf die Mitte des Knopfs oder Felds.',
      'text: höchstens 140 Zeichen, Du-Form, konkret, z. B. "Hier auf Speichern klicken".',
      'Pro Aufruf genau EIN Schritt. Danach sagst du Saskia, dass sie selbst klicken soll und "weiter" schreibt, wenn sie so weit ist.',
      'Vor dem nächsten Schritt rufst du wieder bildschirm_ansehen auf und zeigst erst dann den nächsten Schritt.',
      'Pixel-Laurin klickt und tippt NIE selbst, er zeigt nur. Behaupte nie, du hättest etwas geklickt oder eingegeben.',
    ].join(' '),
    inputSchema: {
      x: z.number().int().min(0).describe('x in Pixeln im letzten Screenshot'),
      y: z.number().int().min(0).describe('y in Pixeln im letzten Screenshot'),
      text: z.string().min(1).max(MAX_BUBBLE).describe('Sprechblase, max. 140 Zeichen'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ x, y, text: bubble }) => {
    if (!overlay.supported) return fail('Der schwebende Buddy läuft nur unter Windows.');
    if (!lastShot) return fail('Erst bildschirm_ansehen aufrufen.');
    const target = toScreen(lastShot, x, y);
    log(`point (${x}, ${y}) in the screenshot -> screen pixel (${target.x}, ${target.y})`);
    try {
      await overlay.send({ cmd: 'point', x: target.x, y: target.y, text: bubble });
      buddyVisible = true;
      return ok(`Pixel-Laurin zeigt auf (${x}, ${y}).`);
    } catch (error) {
      log(`point failed: ${error.stack || error.message}`);
      return fail(`Pixel-Laurin konnte gerade nicht zeigen: ${error.message}`);
    }
  },
);

server.registerTool(
  'ausblenden',
  {
    title: 'Pixel-Laurin ausblenden',
    description:
      'Lässt Pixel-Laurin vom Bildschirm verschwinden. Benutze das, wenn Saskia fertig ist, der Buddy im Weg ist oder sie "weg", "ausblenden" oder "danke, passt" sagt.',
    inputSchema: {},
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    try {
      if (overlay.supported) await overlay.send({ cmd: 'hide' });
      buddyVisible = false;
      return ok('Pixel-Laurin ist weg.');
    } catch (error) {
      log(`hide failed: ${error.stack || error.message}`);
      return fail(`Ausblenden hat nicht geklappt: ${error.message}`);
    }
  },
);

let shuttingDown = false;
function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`shutting down (${reason})`);
  overlay.stop();
  setTimeout(() => process.exit(0), 300).unref();
}

process.stdin.on('end', () => shutdown('stdin closed'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', () => overlay.killNow?.());

const transport = new StdioServerTransport();
transport.onclose = () => shutdown('transport closed');
await server.connect(transport);
log(`ready (platform ${platform}, v${version})`);

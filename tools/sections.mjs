// Screenshots every chapter separately (smaller images for review).
// Usage: node tools/sections.mjs <outDir> <width> [--theme=night] [--only=id,id]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const [outDir, widthArg] = args.filter((a) => !a.startsWith('--'));
const width = Number(widthArg || 1440);
const theme = args.find((a) => a.startsWith('--theme='))?.split('=')[1];
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
mkdirSync(outDir, { recursive: true });

const root = fileURLToPath(new URL('..', import.meta.url));
const { url, close } = await serve(root);
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const tab = await ctx.newPage();
  tab.on('pageerror', (e) => console.error('pageerror:', e.message));
  await tab.goto(url, { waitUntil: 'networkidle' });
  if (theme) await tab.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await tab.waitForTimeout(500);
  const ids = await tab.$$eval('main > section, main > nav, body > footer', (els) => els.map((e) => e.id || e.className.split(' ')[0]));
  for (const id of ids) {
    if (only && !only.includes(id)) continue;
    const el = await tab.$(id.includes('footer') ? 'footer' : `#${id}`);
    const out = `${outDir}/${id}-${width}${theme ? '-' + theme : ''}.png`;
    await el.screenshot({ path: out });
    console.log(out);
  }
  const overflow = await tab.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) console.log(`OVERFLOW ${overflow}px`);
} finally {
  await browser.close();
  await close();
}

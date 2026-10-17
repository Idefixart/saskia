// Screenshots every world scene (figure.scene) at one width, for review.
// Usage: node tools/scenes-shot.mjs <outDir> <width> [--theme=night]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const [outDir, widthArg] = args.filter((a) => !a.startsWith('--'));
const width = Number(widthArg || 1440);
const theme = args.find((a) => a.startsWith('--theme='))?.split('=')[1] || 'day';
mkdirSync(outDir, { recursive: true });
const { url, close } = await serve(fileURLToPath(new URL('..', import.meta.url)));
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => { localStorage.setItem('opened', '1'); localStorage.setItem('theme', t); }, theme);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  const scenes = await page.$$('figure.scene');
  for (const [i, scene] of scenes.entries()) {
    const name = await scene.evaluate((el) => [...el.classList].find((c) => c.startsWith('scene-')));
    await scene.screenshot({ path: `${outDir}/${String(i).padStart(2, '0')}-${name}-${width}-${theme}.png` });
  }
  console.log(`${scenes.length} scenes`);
} finally {
  await browser.close();
  await close();
}

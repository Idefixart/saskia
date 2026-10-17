// Records the first-open intro (gift → burst → city build-up) as a phone-sized video,
// plus stills at key moments. Usage: node tools/intro-video.mjs <outDir>
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync, renameSync } from 'node:fs';
import { serve } from './serve.mjs';

const outDir = process.argv[2];
mkdirSync(outDir, { recursive: true });
const root = fileURLToPath(new URL('..', import.meta.url));
const { url, close } = await serve(root);
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    recordVideo: { dir: outDir, size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${outDir}/still-0-gift.png` });
  await page.click('.gift-open');
  const marks = [350, 700, 1300, 2200, 3200, 4400];
  let last = 0;
  for (const at of marks) {
    await page.waitForTimeout(at - last);
    last = at;
    await page.screenshot({ path: `${outDir}/still-${at}.png` });
  }
  await page.waitForTimeout(2500);
  const video = page.video();
  await ctx.close();
  const path = await video.path();
  renameSync(path, `${outDir}/intro.webm`);
  console.log(`${outDir}/intro.webm`);
} finally {
  await browser.close();
  await close();
}

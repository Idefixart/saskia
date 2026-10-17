// Screenshots one page of the site at given widths.
// Usage: node tools/shot.mjs <path-under-site> <outPrefix> [width...] [--full] [--theme=night]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [page, outPrefix, ...rest] = args.filter((a) => !a.startsWith('--'));
const widths = rest.length ? rest.map(Number) : [375, 1440];
const fullPage = flags.includes('--full');
const theme = flags.find((f) => f.startsWith('--theme='))?.split('=')[1];

const root = fileURLToPath(new URL('..', import.meta.url));
const { url, close } = await serve(root);
const browser = await chromium.launch();
try {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 812 : 900 }, deviceScaleFactor: 2 });
    if (!flags.includes('--intro')) await ctx.addInitScript(() => { try { localStorage.setItem('opened', '1'); } catch {} });
    const tab = await ctx.newPage();
    tab.on('pageerror', (e) => console.error('pageerror:', e.message));
    tab.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
    await tab.goto(url + (page || ''), { waitUntil: 'networkidle' });
    if (theme) await tab.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await tab.waitForTimeout(2800);
    const overflow = await tab.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const out = `${outPrefix}-${width}${theme ? '-' + theme : ''}.png`;
    await tab.screenshot({ path: out, fullPage });
    console.log(`${out}${overflow > 0 ? `  OVERFLOW ${overflow}px` : ''}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  await close();
}

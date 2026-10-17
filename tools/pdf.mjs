// Exports the page as downloads/saskias-claude-welt.pdf (day theme, all diagnoses open).
// Usage: node tools/pdf.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fileURLToPath(new URL('../downloads/saskias-claude-welt.pdf', import.meta.url));

const { url, close } = await serve(root);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1270 } });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'day');
    localStorage.setItem('opened', '1');
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.documentElement.setAttribute('data-theme', 'day');
    document.querySelectorAll('details').forEach((d) => (d.open = true));
    await document.fonts.ready;
  });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
  await close();
}

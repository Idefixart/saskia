// Runs axe-core against the page in day and night theme, prints serious/critical violations.
// Usage: node tools/a11y.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const root = fileURLToPath(new URL('..', import.meta.url));
const { url, close } = await serve(root);
const browser = await chromium.launch();
let failed = false;
try {
  for (const theme of ['day', 'night']) {
    for (const width of [375, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
      const bad = result.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      console.log(`${theme} ${width}px: ${bad.length} serious/critical, ${result.violations.length} total`);
      for (const v of result.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
        for (const n of v.nodes.slice(0, 4)) console.log(`     ${n.target.join(' ')}  ${n.failureSummary?.split('\n')[1]?.trim() || ''}`);
      }
      if (bad.length) failed = true;
      await page.close();
    }
  }
} finally {
  await browser.close();
  await close();
}
process.exit(failed ? 1 : 0);

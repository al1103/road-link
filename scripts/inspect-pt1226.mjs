import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const headings = [0, 90, 180, 270];
  const lat = 21.0302533;
  const lng = 105.7749114;

  for (const h of headings) {
    const url = `https://www.google.com/maps/@${lat},${lng},3a,75y,${h}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
    console.log(`Loading heading ${h}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(4000);
      const outPath = `exports/hanoi_full_scan/hanoi_pt1226_h${h}.jpg`;
      await page.screenshot({ path: outPath, quality: 85 });
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.error(`Error on heading ${h}:`, e.message);
    }
  }

  await browser.close();
}

run();

import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: 'vi-VN' });
  const lat = 21.0020497;
  const lng = 105.8002182;

  for (const h of [270, 0, 90, 180]) {
    const url = `https://www.google.com/maps/@${lat},${lng},3a,75y,${h}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
    try {
      console.log(`Loading heading ${h}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(4000);
      const outPath = `exports/camera_hotspots_check/pt1456_h${h}.jpg`;
      await page.screenshot({ path: outPath, quality: 85 });
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.error(`Error h${h}:`, e.message);
    }
  }

  await browser.close();
  console.log('Capture complete!');
}

run();

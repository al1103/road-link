import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: 'vi-VN' });

  // Nút giao Láng Hạ – Thái Hà (Nút giao lớn có cầu vượt thép và cột đèn cần vươn gắn camera phạt nguội)
  // Tọa độ ngã tư Thái Hà - Láng Hạ: 21.01625, 105.81660
  const lat = 21.01625;
  const lng = 105.81660;

  for (const h of [45, 135, 225, 315]) {
    const url = `https://www.google.com/maps/@${lat},${lng},3a,75y,${h}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3500);
      const outPath = `exports/camera_hotspots_check/langha_thaiha_h${h}.jpg`;
      await page.screenshot({ path: outPath, quality: 85 });
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.error(`Error h${h}:`, e.message);
    }
  }

  await browser.close();
}
run();

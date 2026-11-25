import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targets = [
  { id: 'spot22_phamhung_metri', name: 'Phạm Hùng – Mễ Trì', lat: 21.017360, lng: 105.780120 },
  { id: 'spot13_xuanthuy_nps', name: 'Xuân Thủy – Nguyễn Phong Sắc', lat: 21.036650, lng: 105.787620 },
  { id: 'spot15_kdt_tranduyhung', name: 'Khuất Duy Tiến – Trần Duy Hưng', lat: 21.004950, lng: 105.792840 }
];

const OUT_DIR = 'exports/camera_hotspots_check';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

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

  for (const t of targets) {
    console.log(`\n>>> Checking ${t.name} (${t.lat}, ${t.lng}) <<<`);
    for (const h of [0, 90, 180, 270]) {
      const url = `https://www.google.com/maps/@${t.lat},${t.lng},3a,75y,${h}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
      try {
        console.log(`  Capturing heading ${h}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(3500);
        const outPath = path.join(OUT_DIR, `${t.id}_h${h}.jpg`);
        await page.screenshot({ path: outPath, quality: 85 });
        console.log(`  Saved: ${outPath}`);
      } catch (err) {
        console.error(`  Error at ${t.id} h${h}:`, err.message);
      }
    }
  }

  await browser.close();
  console.log('\n[+] Done capturing all 3 hotspots!');
}

run();

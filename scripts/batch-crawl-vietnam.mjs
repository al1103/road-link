import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { importSignsToApp } from './import-signs-to-road-pack.mjs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function getBrowserExecutable() {
  if (existsSync(CHROME_PATH)) return CHROME_PATH;
  if (existsSync(EDGE_PATH)) return EDGE_PATH;
  return undefined;
}

function parseUrlParams(url) {
  const match = url.match(/@([0-9.-]+),([0-9.-]+),3a,([0-9.]+)y,([0-9.]+)h,([0-9.]+)t/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      fov: parseFloat(match[3]),
      heading: parseFloat(match[4]),
      pitch: parseFloat(match[5])
    };
  }
  return null;
}

const VIETNAM_KEY_CORRIDORS = {
  hanoi_hoan_kiem: [
    { lat: 21.028511, lng: 105.854444, name: 'Hồ Hoàn Kiếm' },
    { lat: 21.031500, lng: 105.852300, name: 'Tràng Thi' },
    { lat: 21.034200, lng: 105.845600, name: 'Điện Biên Phủ' },
    { lat: 21.036800, lng: 105.834500, name: 'Kim Mã' },
    { lat: 21.032100, lng: 105.801200, name: 'Cầu Giấy' }
  ],
  hanoi_ring_road_3: [
    { lat: 20.985600, lng: 105.812400, name: 'Khuất Duy Tiến' },
    { lat: 21.002300, lng: 105.795600, name: 'Phạm Hùng' },
    { lat: 21.045600, lng: 105.783400, name: 'Phạm Văn Đồng' }
  ],
  hcmc_center: [
    { lat: 10.776889, lng: 106.700806, name: 'Nhà thờ Đức Bà' },
    { lat: 10.772500, lng: 106.698100, name: 'Chợ Bến Thành' },
    { lat: 10.768900, lng: 106.685400, name: 'Nguyễn Thị Minh Khai' },
    { lat: 10.754300, lng: 106.663200, name: 'Trần Hưng Đạo Quận 5' }
  ],
  highway_1a: [
    { lat: 20.923400, lng: 105.851200, name: 'QL1A - Thường Tín' },
    { lat: 20.543200, lng: 105.912300, name: 'QL1A - Phủ Lý' },
    { lat: 20.256700, lng: 105.978900, name: 'QL1A - Ninh Bình' }
  ]
};

export async function runBatchCrawl({
  points = [],
  outputDir = 'exports/batch_streetview',
  headless = true,
  autoInject = true
} = {}) {
  await mkdir(outputDir, { recursive: true });
  const browserPath = getBrowserExecutable();

  console.log(`=======================================================`);
  console.log(`[*] BẮT ĐẦU CÀO STREET VIEW & TỰ ĐỘNG THÊM VÀO APP`);
  console.log(`[*] Tổng số điểm quét: ${points.length}`);
  console.log(`=======================================================\n`);

  const browser = await chromium.launch({
    executablePath: browserPath,
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const allCaptured = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    console.log(`\n[${i + 1}/${points.length}] Quét điểm: ${pt.name || ''} (${pt.lat}, ${pt.lng})`);

    const headings = [0, 90, 180, 270];
    for (const heading of headings) {
      const url = `https://www.google.com/maps/@${pt.lat},${pt.lng},3a,75y,${heading}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        const params = parseUrlParams(currentUrl) || { lat: pt.lat, lng: pt.lng, heading, fov: 75 };
        const fileName = `pt${i}_h${heading}_${params.lat.toFixed(6)}_${params.lng.toFixed(6)}.jpg`;
        const filePath = path.join(outputDir, fileName);

        await page.screenshot({ path: filePath, quality: 85 });
        allCaptured.push({
          imagePath: filePath,
          lat: params.lat,
          lng: params.lng,
          heading: params.heading || heading,
          fov: params.fov || 75,
          url: currentUrl
        });
        console.log(`  -> Đã chụp hướng ${heading}°`);
      } catch (err) {
        console.error(`  -> Lỗi hướng ${heading}°:`, err.message);
      }
    }

    // Delay ngẫu nhiên giữa các điểm để tránh bị Google chặn bot
    const delay = Math.floor(2000 + Math.random() * 2000);
    await new Promise(r => setTimeout(r, delay));
  }

  await browser.close();

  const manifestFile = path.join(outputDir, 'batch_manifest.json');
  await writeFile(manifestFile, JSON.stringify(allCaptured, null, 2), 'utf-8');
  console.log(`\n[+] Đã chụp thành công ${allCaptured.length} ảnh Street View.`);

  console.log(`\n[*] Đang chạy YOLOv8 nhận diện biển báo trên toàn bộ ảnh...`);
  try {
    execSync(`python scripts/detect_from_captured.py --manifest "${manifestFile}" --out "${outputDir}"`, {
      stdio: 'inherit'
    });
  } catch (err) {
    console.error(`[!] Lỗi khi chạy YOLO:`, err.message);
  }

  const geojsonPath = path.join(outputDir, 'detected_traffic_signs.geojson');
  if (autoInject && existsSync(geojsonPath)) {
    console.log(`\n[*] TỰ ĐỘNG NẠP VÀO DATABASE BẢN ĐỒ CỦA ỨNG DỤNG ROADLINK...`);
    await importSignsToApp(geojsonPath);
  }

  console.log(`\n[================ HOÀN TẤT TOÀN DIỆN ================]`);
}

if (process.argv[1]?.includes('batch-crawl-vietnam.mjs')) {
  const args = process.argv.slice(2);
  const region = args.find(a => a.startsWith('--region='))?.split('=')[1] || 'hanoi_hoan_kiem';
  const showBrowser = args.includes('--show');

  const selectedPoints = VIETNAM_KEY_CORRIDORS[region] || VIETNAM_KEY_CORRIDORS.hanoi_hoan_kiem;
  console.log(`[*] Khu vực lựa chọn: ${region} (${selectedPoints.length} điểm)`);

  runBatchCrawl({
    points: selectedPoints,
    headless: !showBrowser,
    autoInject: true
  });
}

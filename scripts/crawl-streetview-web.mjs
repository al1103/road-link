import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

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
  const simpleMatch = url.match(/@([0-9.-]+),([0-9.-]+)/);
  if (simpleMatch) {
    return {
      lat: parseFloat(simpleMatch[1]),
      lng: parseFloat(simpleMatch[2]),
      fov: 75,
      heading: 0,
      pitch: 90
    };
  }
  return null;
}

export async function crawlStreetViewWeb({
  lat = 21.028511,
  lng = 105.854444,
  headings = [0, 90, 180, 270],
  headless = true,
  outputDir = 'exports/web_streetview'
} = {}) {
  await mkdir(outputDir, { recursive: true });

  const executablePath = getBrowserExecutable();
  console.log(`[*] Khởi chạy trình duyệt: ${executablePath || 'Playwright default'}`);

  const browser = await chromium.launch({
    executablePath,
    headless,
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
  const capturedFrames = [];

  for (const heading of headings) {
    const streetViewUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,${heading}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
    console.log(`\n[*] Đang tải góc nhìn heading ${heading}°: ${lat}, ${lng}...`);

    try {
      await page.goto(streetViewUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3500);

      const finalUrl = page.url();
      const params = parseUrlParams(finalUrl) || { lat, lng, heading, fov: 75 };
      
      const frameFileName = `frame_${params.lat.toFixed(6)}_${params.lng.toFixed(6)}_h${heading}.jpg`;
      const frameFilePath = path.join(outputDir, frameFileName);

      await page.screenshot({ path: frameFilePath, quality: 90 });
      console.log(`[+] Đã chụp ảnh màn hình: ${frameFileName}`);

      capturedFrames.push({
        imagePath: frameFilePath,
        lat: params.lat,
        lng: params.lng,
        heading: params.heading || heading,
        fov: params.fov || 75,
        url: finalUrl
      });
    } catch (err) {
      console.error(`[!] Lỗi khi chụp góc ${heading}°:`, err.message);
    }
  }

  await browser.close();

  const manifestPath = path.join(outputDir, 'captured_frames.json');
  await writeFile(manifestPath, JSON.stringify(capturedFrames, null, 2), 'utf-8');
  console.log(`\n[+] Hoàn thành chụp ảnh Web! Tổng cộng: ${capturedFrames.length} ảnh.`);
  console.log(`[+] Danh sách lưu tại: ${manifestPath}`);

  const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
  console.log(`[*] Bắt đầu gọi YOLO nhận diện biển báo trên các ảnh vừa chụp...`);
  try {
    execSync(`${pyCmd} scripts/detect_from_captured.py --manifest "${manifestPath}" --out "${outputDir}"`, {
      stdio: 'inherit'
    });
  } catch (err) {
    console.error(`[!] Lỗi khi chạy mô hình nhận diện:`, err.message);
  }

  return capturedFrames;
}

if (process.argv[1]?.includes('crawl-streetview-web.mjs')) {
  const args = process.argv.slice(2);
  const latArg = args.find(a => a.startsWith('--lat='))?.split('=')[1] || 21.028511;
  const lngArg = args.find(a => a.startsWith('--lng='))?.split('=')[1] || 105.854444;
  const headlessArg = !args.includes('--show');

  crawlStreetViewWeb({
    lat: parseFloat(latArg),
    lng: parseFloat(lngArg),
    headless: headlessArg
  });
}

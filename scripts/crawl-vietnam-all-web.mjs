import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const TILES_DIR = 'public/data/vn-osm-20261120/tiles';
const OUTPUT_DIR = 'exports/vietnam_full_web_scan';
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress_all_vietnam.json');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function getBrowserExecutable() {
  if (existsSync(CHROME_PATH)) return CHROME_PATH;
  if (existsSync(EDGE_PATH)) return EDGE_PATH;
  return undefined;
}

function parseUrlParams(url) {
  // Trích xuất lat, lng, pano_id từ URL Google Maps sau khi redirect
  const panoMatch = url.match(/!1s([^!]+)!2e/);
  const match = url.match(/@([0-9.-]+),([0-9.-]+),3a,([0-9.]+)y,([0-9.]+)h,([0-9.]+)t/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      fov: parseFloat(match[3]),
      heading: parseFloat(match[4]),
      pitch: parseFloat(match[5]),
      panoId: panoMatch ? panoMatch[1] : null
    };
  }
  return null;
}

// Hàm chụp ảnh góc nhìn thực tế qua Google Maps Web
async function captureStreetViewAtPoint(page, lat, lng, headings = [0, 90, 180, 270]) {
  const frames = [];
  
  for (const heading of headings) {
    const targetUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,${heading}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
    
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2500); // Chờ WebGL render panorama

      const currentUrl = page.url();
      
      // Nếu Google Maps không có Street View tại đây, URL sẽ không chứa /data=!3m hoặc chuyển về 2D thông thường
      if (!currentUrl.includes('3a,')) {
        continue;
      }

      const params = parseUrlParams(currentUrl) || { lat, lng, heading, fov: 75 };
      const fileName = `sv_${params.lat.toFixed(6)}_${params.lng.toFixed(6)}_h${heading}.jpg`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      await page.screenshot({ path: filePath, quality: 85 });

      frames.push({
        imagePath: filePath,
        lat: params.lat,
        lng: params.lng,
        heading: params.heading || heading,
        fov: params.fov || 75,
        panoId: params.panoId,
        url: currentUrl
      });
      console.log(`      [+] Chụp thành công góc ${heading}° tại (${params.lat.toFixed(5)}, ${params.lng.toFixed(5)})`);
    } catch (err) {
      // Bỏ qua lỗi timeout của từng góc
    }
  }
  return frames;
}

// 3. Hàm chính điều phối toàn bộ 1,348 Shards/Tiles của Việt Nam
export async function runAllVietnamScan({
  specificTile = null,
  maxTiles = null,
  resume = true,
  batchSize = 20
} = {}) {
  await mkdir(OUTPUT_DIR, { recursive: true });

  let progress = { completedTiles: [], detectedCount: 0, scannedPanoCount: 0 };
  if (resume && existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(await readFile(PROGRESS_FILE, 'utf-8'));
      console.log(`[*] Tải lại tiến trình: Đã hoàn thành ${progress.completedTiles.length} tiles.`);
    } catch {}
  }

  let allTileFiles = readdirSync(TILES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (specificTile) {
    allTileFiles = allTileFiles.filter(f => f.includes(specificTile));
  }

  console.log(`======================================================================`);
  console.log(`[*] BẮT ĐẦU QUÉT TOÀN BỘ VIỆT NAM QUA GOOGLE STREET VIEW WEB`);
  console.log(`[*] Tổng số tiles dữ liệu đường bộ OSM: ${allTileFiles.length} tiles`);
  console.log(`[*] Chế độ: GOOGLE MAPS WEB AUTO-RESOLVER (CHỤP SCREENSHOT THẬT)`);
  console.log(`[*] Quy tắc: NHẬN DIỆN BIỂN BÁO & GIỚI HẠN TỐC ĐỘ - BỎ QUA ĐÈN ĐỎ`);
  console.log(`======================================================================\n`);

  const browserPath = getBrowserExecutable();
  const browser = await chromium.launch({
    executablePath: browserPath,
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

  let processedTiles = 0;

  try {
    for (const tileFile of allTileFiles) {
      const tileName = path.basename(tileFile, '.json');
      if (progress.completedTiles.includes(tileName)) {
        continue;
      }

      if (maxTiles && processedTiles >= maxTiles) {
        console.log(`[*] Đã đạt giới hạn maxTiles=${maxTiles}. Tạm dừng.`);
        break;
      }

      console.log(`\n--------------------------------------------------------------`);
      console.log(`[+] Đang xử lý Tile [${tileName}] (${processedTiles + 1}/${allTileFiles.length})`);
      
      const tileContent = JSON.parse(await readFile(path.join(TILES_DIR, tileFile), 'utf-8'));
      const elements = tileContent.elements || [];

      // Lọc toạ độ: lấy từ các đường (way.geometry) và điểm (node)
      // TUYỆT ĐỐI BỎ QUA traffic_signals (đèn đỏ / đèn giao thông)
      const pointsToScan = [];
      for (const el of elements) {
        if (el.tags?.highway === 'traffic_signals') {
          continue;
        }
        if (el.type === 'node' && el.lat && el.lon) {
          pointsToScan.push({ lat: el.lat, lng: el.lon });
        } else if (el.type === 'way' && Array.isArray(el.geometry)) {
          const geom = el.geometry;
          if (geom.length > 0) {
            pointsToScan.push({ lat: geom[0].lat, lng: geom[0].lon });
            if (geom.length > 2) {
              const mid = Math.floor(geom.length / 2);
              pointsToScan.push({ lat: geom[mid].lat, lng: geom[mid].lon });
            }
          }
        }
      }

      console.log(`    -> Tìm thấy ${pointsToScan.length} toạ độ đường bộ trong tile`);

      const capturedFrames = [];

      for (let i = 0; i < pointsToScan.length; i++) {
        const pt = pointsToScan[i];
        try {
          const frames = await captureStreetViewAtPoint(page, pt.lat, pt.lng, [0, 90]);
          if (frames.length > 0) {
            capturedFrames.push(...frames);
            progress.scannedPanoCount += frames.length;
          }
        } catch (err) {
          // Bỏ qua lỗi kết nối
        }

        // Delay nhẹ giữa các điểm để tránh bị Google chặn bot
        await new Promise(r => setTimeout(r, 500));
      }

      // Nếu tile có ảnh Street View, chạy AI nhận diện biển báo
      if (capturedFrames.length > 0) {
        const manifestPath = path.join(OUTPUT_DIR, `manifest_${tileName}.json`);
        await writeFile(manifestPath, JSON.stringify(capturedFrames, null, 2), 'utf-8');

        console.log(`    [*] Khởi chạy YOLO11 nhận diện biển báo (loại bỏ đèn đỏ)...`);
        try {
          execSync(`python3 scripts/detect_from_captured.py --manifest "${manifestPath}" --out "${OUTPUT_DIR}"`, {
            stdio: 'inherit'
          });
        } catch (err) {
          console.error(`    [!] Lỗi khi chạy AI trên tile ${tileName}:`, err.message);
        }
      }

      progress.completedTiles.push(tileName);
      processedTiles++;

      // Lưu checkpoint
      await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
    }
  } finally {
    await browser.close();
  }

  console.log(`\n======================================================================`);
  console.log(`[+] HOÀN THÀNH TIẾN TRÌNH QUÉT`);
  console.log(`[+] Tổng số Pano hợp lệ đã quét: ${progress.scannedPanoCount}`);
  console.log(`[+] Tiến trình lưu tại: ${PROGRESS_FILE}`);
  console.log(`======================================================================`);
}

// Khởi chạy khi gọi từ CLI
if (process.argv[1]?.includes('crawl-vietnam-all-web.mjs')) {
  const args = process.argv.slice(2);
  const maxTilesArg = args.find(a => a.startsWith('--max='))?.split('=')[1];
  const tileArg = args.find(a => a.startsWith('--tile='))?.split('=')[1];
  runAllVietnamScan({
    specificTile: tileArg || null,
    maxTiles: maxTilesArg ? parseInt(maxTilesArg, 10) : null
  });
}

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { importSignsToApp } from './import-signs-to-road-pack.mjs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'exports/hanoi_full_scan';
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress.json');

function getBrowserExecutable() {
  if (existsSync(CHROME_PATH)) return CHROME_PATH;
  if (existsSync(EDGE_PATH)) return EDGE_PATH;
  return undefined;
}

function distMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getHanoiIntersections() {
  const hanoiTiles = ['209_1057', '209_1058', '210_1057', '210_1058', '210_1059', '211_1057', '211_1058'];
  const nodeWays = new Map();
  const nodeCoords = new Map();
  const roadSamples = [];

  for (const k of hanoiTiles) {
    const tilePath = path.join('public/data/vn-osm-20261120/tiles', `${k}.json`);
    if (!existsSync(tilePath)) continue;
    try {
      const data = JSON.parse(await readFile(tilePath, 'utf-8'));
      for (const el of data.elements) {
        // TUYỆT ĐỐI BỎ QUA đèn giao thông / đèn đỏ (traffic_signals)
        if (el.tags?.highway === 'traffic_signals') {
          continue;
        }

        // Trích xuất các tuyến đường xe cơ giới (bỏ đường đi bộ, bậc thang)
        if (el.type === 'way' && el.tags?.highway) {
          const hw = el.tags.highway;
          if (['footway', 'cycleway', 'pedestrian', 'path', 'steps', 'service'].includes(hw)) {
            continue;
          }
          const nodes = el.nodes || [];
          const geom = el.geometry || [];
          for (let i = 0; i < nodes.length; i++) {
            const nid = nodes[i];
            nodeWays.set(nid, (nodeWays.get(nid) || 0) + 1);
            if (i < geom.length) {
              nodeCoords.set(nid, {
                lat: geom[i].lat,
                lng: geom[i].lon,
                type: 'intersection',
                name: el.tags.name || ''
              });
            }
          }

          // LẤY MẪU ĐỊNH KỲ DỌC CÁC TRỤC ĐƯỜNG DÀI (mỗi ~250m một điểm)
          // Đảm bảo không bỏ sót các biển báo tốc độ (50, 60, 80, 100 km/h) cắm trên đường thẳng, cao tốc, đại lộ, cầu vượt
          if (geom.length >= 2) {
            let lastPt = geom[0];
            roadSamples.push({ lat: geom[0].lat, lng: geom[0].lon, type: 'road_speed_checkpoint', name: el.tags.name || '' });
            for (let i = 1; i < geom.length; i++) {
              const pt = geom[i];
              if (distMeters(lastPt.lat, lastPt.lon, pt.lat, pt.lon) >= 250) {
                roadSamples.push({ lat: pt.lat, lng: pt.lon, type: 'road_speed_checkpoint', name: el.tags.name || '' });
                lastPt = pt;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`[!] Lỗi đọc tile ${k}:`, err.message);
    }
  }

  // 1. Thu thập các nút giao thực sự (nơi giao nhau của từ 2 đường trở lên: ngã 3, ngã 4, ngã 5)
  const rawIntersections = [];
  for (const [nid, count] of nodeWays.entries()) {
    if (count >= 2 && nodeCoords.has(nid)) {
      rawIntersections.push(nodeCoords.get(nid));
    }
  }

  // 2. Kết hợp NÚT GIAO + ĐIỂM DỌC TRỤC ĐƯỜNG DÀI
  const combined = [...rawIntersections, ...roadSamples];

  // Khử trùng lặp không gian theo lưới 100m để phủ kín toàn thành phố và không bị chụp lặp
  const grid = new Map();
  const clustered = [];
  for (const p of combined) {
    const gx = Math.floor(p.lat * 1000);
    const gy = Math.floor(p.lng * 1000);
    const key = `${gx}_${gy}`;
    if (!grid.has(key)) {
      grid.set(key, true);
      clustered.push(p);
    }
  }

  console.log(`[+] Đã tổng hợp ${clustered.length} điểm khảo sát toàn diện (bao gồm tất cả nút giao + các trục đường thẳng có cắm biển tốc độ) khắp Hà Nội.`);
  return clustered;
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

async function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(await readFile(PROGRESS_FILE, 'utf-8'));
    } catch { }
  }
  return { completedIndices: [], totalPoints: 0, lastUpdated: new Date().toISOString() };
}

async function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

export async function crawlAllHanoi({
  limit = 424,
  batchChunk = 25,
  show = false,
  reset = false
} = {}) {
  await mkdir(OUTPUT_DIR, { recursive: true });

  if (reset && existsSync(PROGRESS_FILE)) {
    console.log('[*] Đang reset tiến trình cào về ban đầu (chạy lại từ đầu)...');
    await unlink(PROGRESS_FILE).catch(() => { });
  }

  if (reset && existsSync(PROGRESS_FILE)) {
    console.log('[*] Đang reset tiến trình cào về ban đầu (chạy lại từ đầu)...');
    await unlink(PROGRESS_FILE).catch(() => { });
  }

  const allPoints = await getHanoiIntersections();
  const progress = await loadProgress();
  progress.totalPoints = allPoints.length;

  const completedSet = new Set(progress.completedIndices);
  const remaining = [];
  for (let i = 0; i < allPoints.length; i++) {
    if (!completedSet.has(i)) {
      remaining.push({ index: i, point: allPoints[i] });
    }
  }

  const totalToScan = Math.min(limit, remaining.length);

  console.log(`=======================================================`);
  console.log(`[*] QUÉT HẾT TẤT CẢ CÁC ĐIỂM HÀ NỘI`);
  console.log(`[*] Tổng số nút giao: ${allPoints.length}`);
  console.log(`[*] Đã hoàn thành trước: ${completedSet.size}`);
  console.log(`[*] Còn lại cần quét: ${remaining.length}`);
  console.log(`[*] Giới hạn quét đợt này: ${totalToScan} điểm`);
  console.log(`=======================================================\n`);

  if (!totalToScan) {
    console.log(`[+] ĐÃ HOÀN TẤT QUÉT 100% CÁC NÚT GIAO HÀ NỘI!`);
    return;
  }

  const targets = remaining.slice(0, totalToScan);
  const browserPath = getBrowserExecutable();

  for (let chunkStart = 0; chunkStart < targets.length; chunkStart += batchChunk) {
    const chunk = targets.slice(chunkStart, chunkStart + batchChunk);
    const chunkNum = Math.floor(chunkStart / batchChunk) + 1;
    const totalChunks = Math.ceil(targets.length / batchChunk);

    console.log(`\n>>> BẮT ĐẦU ĐỢT CON ${chunkNum}/${totalChunks} (${chunk.length} NÚT GIAO) <<<`);

    let browser;
    try {
      browser = await chromium.launch({
        executablePath: browserPath,
        headless: !show,
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

      const capturedBatch = [];

      for (let b = 0; b < chunk.length; b++) {
        const { index, point } = chunk[b];
        const overallCount = progress.completedIndices.length + 1;
        console.log(`[${overallCount}/${allPoints.length}] Quét điểm #${index + 1}: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);

        const headings = [0, 90, 180, 270];
        for (const heading of headings) {
          const url = `https://www.google.com/maps/@${point.lat},${point.lng},3a,75y,${heading}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(2500);

            const currentUrl = page.url();
            const params = parseUrlParams(currentUrl) || { lat: point.lat, lng: point.lng, heading, fov: 75 };
            const fileName = `hanoi_pt${index}_h${heading}.jpg`;
            const filePath = path.join(OUTPUT_DIR, fileName);

            await page.screenshot({ path: filePath, quality: 80 });
            capturedBatch.push({
              imagePath: filePath,
              lat: params.lat,
              lng: params.lng,
              heading: params.heading || heading,
              fov: params.fov || 75,
              url: currentUrl
            });
          } catch (err) {
            // bỏ qua lỗi tải trang lẻ
          }
        }

        progress.completedIndices.push(index);
        await saveProgress(progress);

        const delay = Math.floor(1000 + Math.random() * 1500);
        await new Promise(r => setTimeout(r, delay));
      }

      await browser.close();

      const manifestPath = path.join(OUTPUT_DIR, `batch_chunk_${chunkNum}.json`);
      await writeFile(manifestPath, JSON.stringify(capturedBatch, null, 2), 'utf-8');

      console.log(`\n[*] Chạy YOLOv8 nhận diện đợt con ${chunkNum}...`);
      const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      try {
        execSync(`${pyCmd} scripts/detect_from_captured.py --manifest "${manifestPath}" --out "${OUTPUT_DIR}"`, {
          stdio: 'inherit'
        });
      } catch (err) {
        console.error(`[!] Lỗi YOLO:`, err.message);
      }

      const geojsonPath = path.join(OUTPUT_DIR, 'detected_traffic_signs.geojson');
      if (existsSync(geojsonPath)) {
        console.log(`[*] Tự động nạp dữ liệu đợt ${chunkNum} vào app...`);
        await importSignsToApp(geojsonPath);
      }

      for (const item of capturedBatch) {
        if (existsSync(item.imagePath)) {
          await unlink(item.imagePath).catch(() => { });
        }
      }

      console.log(`[+] TIẾN ĐỘ: Đã xong ${progress.completedIndices.length}/${allPoints.length} nút giao Hà Nội.\n`);
    } catch (chunkErr) {
      console.error(`[!] Lỗi đợt con ${chunkNum}:`, chunkErr.message);
      if (browser) await browser.close().catch(() => { });
    }
  }

  console.log(`\n[================ QUÉT TOÀN BỘ HOÀN TẤT ================]`);
}

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const isAll = args.includes('--all');
const show = args.includes('--show');
const reset = args.includes('--reset');
const limit = isAll ? 999999 : (limitArg ? parseInt(limitArg, 10) : 500);

crawlAllHanoi({ limit, show, reset, batchChunk: 25 });

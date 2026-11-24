import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const PACK_DIR = 'public/data/vn-osm-20261120';
const MANIFEST_PATH = path.join(PACK_DIR, 'manifest.json');
const MERGE_RADIUS_METERS = 25.0;

function cellKey(lat, lng) {
  const x = Math.floor(lat * 10);
  const y = Math.floor(lng * 10);
  return `${x}_${y}`;
}

function distMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapSignToOsmTags(signType, confidence) {
  const typeLower = (signType || '').toLowerCase();
  
  // Đèn giao thông: quy định rõ lấy từ dữ liệu cũ, không lấy từ YOLO
  if (typeLower.includes('traffic light') || typeLower.includes('signals') || typeLower.includes('đèn')) {
    return null;
  }

  if (typeLower.includes('speed') || typeLower.includes('127') || typeLower.includes('tốc độ')) {
    const match = typeLower.match(/\d+/);
    const speed = match ? match[0] : '60';
    return {
      kind: 'traffic_sign',
      tags: {
        traffic_sign: 'maxspeed',
        maxspeed: speed,
        source: 'streetview_yolo',
        confidence: String(confidence || 1.0)
      }
    };
  }
  
  if (typeLower.includes('stop')) {
    return {
      kind: 'stop',
      tags: {
        highway: 'stop',
        traffic_sign: 'stop',
        source: 'streetview_yolo',
        confidence: String(confidence || 1.0)
      }
    };
  }
  
  if (typeLower.includes('camera')) {
    return {
      kind: 'speed_camera',
      tags: {
        highway: 'speed_camera',
        source: 'streetview_yolo',
        confidence: String(confidence || 1.0)
      }
    };
  }
  
  if (typeLower.includes('give') || typeLower.includes('nhường')) {
    return {
      kind: 'give_way',
      tags: {
        highway: 'give_way',
        traffic_sign: 'give_way',
        source: 'streetview_yolo',
        confidence: String(confidence || 1.0)
      }
    };
  }
  
  return {
    kind: 'traffic_sign',
    tags: {
      traffic_sign: signType,
      source: 'streetview_yolo',
      confidence: String(confidence || 1.0)
    }
  };
}

function isSimilarKind(newKind, existingTags) {
  if (!existingTags) return false;
  if (newKind === 'stop' && (existingTags.highway === 'stop' || existingTags.traffic_sign === 'stop')) return true;
  if (newKind === 'speed_camera' && (existingTags.highway === 'speed_camera' || existingTags.man_made === 'surveillance')) return true;
  if (newKind === 'give_way' && (existingTags.highway === 'give_way' || existingTags.traffic_sign === 'give_way')) return true;
  if (newKind === 'traffic_sign' && (existingTags.traffic_sign || existingTags.maxspeed)) return true;
  return false;
}

export async function importSignsToApp(geojsonPath) {
  if (!existsSync(geojsonPath)) {
    console.error(`[!] Không tìm thấy file: ${geojsonPath}`);
    return;
  }

  const raw = await readFile(geojsonPath, 'utf-8');
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];

  if (!features.length) {
    console.log(`[*] Không có biển báo nào trong file ${geojsonPath} để xử lý.`);
    return;
  }

  console.log(`[*] Xử lý ${features.length} đối tượng: Chỉ lấy BIỂN BÁO từ YOLO, GIỮ NGUYÊN ĐÈN GIAO THÔNG CŨ...`);

  const manifestRaw = await readFile(MANIFEST_PATH, 'utf-8');
  const manifest = JSON.parse(manifestRaw);
  if (!manifest.nodeKinds) manifest.nodeKinds = {};

  const signsByTile = new Map();
  let trafficLightsIgnored = 0;

  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates;
    const props = f.properties || {};
    const conf = parseFloat(props.confidence || '1.0');
    const mapped = mapSignToOsmTags(props.type || props.signType, conf);

    // Bỏ qua đèn tín hiệu từ YOLO, giữ nguyên đèn cũ gốc
    if (!mapped) {
      trafficLightsIgnored++;
      continue;
    }

    const key = cellKey(lat, lng);
    if (!signsByTile.has(key)) signsByTile.set(key, []);
    signsByTile.get(key).push({ feature: f, mapped });
  }

  let totalNewAdded = 0;
  let totalEnrichedUpdated = 0;
  let baseId = 900_000_000_000 + Math.floor(Math.random() * 1000000);

  for (const [key, items] of signsByTile.entries()) {
    const tilePath = path.join(PACK_DIR, 'tiles', `${key}.json`);
    let elements = [];

    if (existsSync(tilePath)) {
      const tileData = JSON.parse(await readFile(tilePath, 'utf-8'));
      elements = tileData.elements || [];
    }

    let tileModified = false;

    for (const { feature: f, mapped } of items) {
      const [lng, lat] = f.geometry.coordinates;
      const props = f.properties || {};
      const conf = parseFloat(props.confidence || '1.0');
      const { kind, tags } = mapped;

      // Tìm biển báo cũ trong bán kính 25m
      let matchedExisting = null;
      let minDistance = Infinity;

      for (const el of elements) {
        if (el.type !== 'node') continue;
        const d = distMeters(lat, lng, el.lat, el.lon);
        if (d < MERGE_RADIUS_METERS && isSimilarKind(kind, el.tags) && d < minDistance) {
          matchedExisting = el;
          minDistance = d;
        }
      }

      if (matchedExisting) {
        // [TRÙNG BIỂN BÁO]: Cập nhật & nâng cấp thông tin theo YOLO
        matchedExisting.tags.verified = 'streetview_yolo';
        matchedExisting.tags.confidence = String(Math.round(conf * 100) / 100);
        matchedExisting.tags.verified_at = new Date().toISOString();
        
        if (tags.maxspeed) {
          matchedExisting.tags.maxspeed = tags.maxspeed;
        }
        if (tags.traffic_sign) {
          matchedExisting.tags.traffic_sign = tags.traffic_sign;
        }
        if (conf >= 0.65) {
          matchedExisting.lat = Math.round(lat * 1e7) / 1e7;
          matchedExisting.lon = Math.round(lng * 1e7) / 1e7;
        }

        matchedExisting.timestamp = new Date().toISOString();
        totalEnrichedUpdated++;
        tileModified = true;
      } else {
        // [BIỂN BÁO MỚI HOÀN TOÀN (>25m)]: Thêm mới vào bản đồ
        manifest.nodeKinds[kind] = (manifest.nodeKinds[kind] || 0) + 1;

        const osmNode = {
          type: 'node',
          id: baseId + totalNewAdded,
          lat: Math.round(lat * 1e7) / 1e7,
          lon: Math.round(lng * 1e7) / 1e7,
          tags: {
            ...tags,
            verified: 'streetview_yolo',
            verified_at: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };

        elements.push(osmNode);
        totalNewAdded++;
        tileModified = true;
      }
    }

    if (tileModified) {
      const updatedTileContent = JSON.stringify({ elements });
      const bytes = Buffer.byteLength(updatedTileContent, 'utf-8');
      const sha256 = createHash('sha256').update(updatedTileContent).digest('hex');

      await writeFile(tilePath, updatedTileContent, 'utf-8');

      manifest.tiles[key] = {
        path: `tiles/${key}.json`,
        elements: elements.length,
        bytes,
        sha256
      };
    }
  }

  manifest.nodeCount = (manifest.nodeCount || 0) + totalNewAdded;
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 0), 'utf-8');

  console.log(`\n================ KẾT QUẢ PHÂN TÁCH DỮ LIỆU ================`);
  console.log(`[+] Đã bỏ qua ${trafficLightsIgnored} đèn giao thông từ YOLO (giữ nguyên đèn giao thông cũ chuẩn của app).`);
  console.log(`[+] Đã cập nhật ${totalEnrichedUpdated} biển báo cũ theo thông tin chi tiết từ YOLO.`);
  console.log(`[+] Đã thêm mới ${totalNewAdded} vị trí biển báo mới (>25m) từ YOLO.`);
  console.log(`[+] Đảm bảo không trùng lặp và không xáo trộn hệ thống đèn giao thông hiện có!`);
}

if (process.argv[1]?.includes('import-signs-to-road-pack.mjs')) {
  const fileArg = process.argv[2] || 'exports/hanoi_full_scan/detected_traffic_signs.geojson';
  importSignsToApp(fileArg);
}

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const PACK_DIR = 'public/data/vn-osm-20261120';
const MANIFEST_PATH = path.join(PACK_DIR, 'manifest.json');

function cellKey(lat, lng) {
  const x = Math.floor(lat * 10);
  const y = Math.floor(lng * 10);
  return `${x}_${y}`;
}

function mapSignToOsmTags(signType, confidence) {
  const typeLower = (signType || '').toLowerCase();
  
  if (typeLower.includes('traffic light') || typeLower.includes('signals') || typeLower.includes('đèn')) {
    return {
      kind: 'traffic_signals',
      tags: {
        highway: 'traffic_signals',
        source: 'streetview_yolo',
        confidence: String(confidence || 1.0)
      }
    };
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

export async function importSignsToApp(geojsonPath) {
  if (!existsSync(geojsonPath)) {
    console.error(`[!] Không tìm thấy file: ${geojsonPath}`);
    return;
  }

  const raw = await readFile(geojsonPath, 'utf-8');
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];

  if (!features.length) {
    console.log(`[*] Không có biển báo nào trong file ${geojsonPath} để nạp.`);
    return;
  }

  console.log(`[*] Đang nạp ${features.length} biển báo vào cơ sở dữ liệu của ứng dụng RoadLink...`);

  const manifestRaw = await readFile(MANIFEST_PATH, 'utf-8');
  const manifest = JSON.parse(manifestRaw);
  if (!manifest.nodeKinds) manifest.nodeKinds = {};

  const signsByTile = new Map();
  let baseId = 900_000_000_000 + Math.floor(Math.random() * 1000000);

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const [lng, lat] = f.geometry.coordinates;
    const props = f.properties || {};
    const key = cellKey(lat, lng);

    if (!signsByTile.has(key)) {
      signsByTile.set(key, []);
    }

    const { kind, tags } = mapSignToOsmTags(props.type || props.signType, props.confidence);
    manifest.nodeKinds[kind] = (manifest.nodeKinds[kind] || 0) + 1;

    const osmNode = {
      type: 'node',
      id: baseId + i,
      lat: Math.round(lat * 1e7) / 1e7,
      lon: Math.round(lng * 1e7) / 1e7,
      tags,
      timestamp: new Date().toISOString()
    };

    signsByTile.get(key).push(osmNode);
  }

  let totalUpdated = 0;

  for (const [key, newNodes] of signsByTile.entries()) {
    const tilePath = path.join(PACK_DIR, 'tiles', `${key}.json`);
    let elements = [];

    if (existsSync(tilePath)) {
      const tileData = JSON.parse(await readFile(tilePath, 'utf-8'));
      elements = tileData.elements || [];
    }

    elements.push(...newNodes);
    totalUpdated += newNodes.length;

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

  manifest.nodeCount = (manifest.nodeCount || 0) + totalUpdated;
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 0), 'utf-8');

  console.log(`[+] ĐÃ THÊM THÀNH CÔNG ${totalUpdated} ĐỐI TƯỢNG VÀO DATA GỐC CỦA APP!`);
  console.log(`[+] Đã cập nhật ${signsByTile.size} tile shards và file manifest.json`);
}

if (process.argv[1]?.includes('import-signs-to-road-pack.mjs')) {
  const fileArg = process.argv[2] || 'exports/web_streetview/detected_traffic_signs.geojson';
  importSignsToApp(fileArg);
}

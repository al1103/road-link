import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] ?? 'public/data/vn-osm-20261120/tiles';
const output = process.argv[3] ?? 'firmware/mapdata';

const CLASSES = [
  ['motorway', 'motorway_link', 'trunk', 'trunk_link'],
  ['primary', 'primary_link'],
  ['secondary', 'secondary_link', 'tertiary', 'tertiary_link'],
  ['residential', 'unclassified', 'living_street'],
  ['service', 'track']
];

function classOf(highway) {
  for (let i = 0; i < CLASSES.length; i++) if (CLASSES[i].includes(highway)) return i;
  return 5;
}

fs.mkdirSync(output, { recursive: true });
let files = 0, ways = 0, points = 0, bytes = 0;

for (const name of fs.readdirSync(input)) {
  if (!name.endsWith('.json')) continue;
  const src = JSON.parse(fs.readFileSync(path.join(input, name), 'utf8'));
  const out = [];
  const header = Buffer.alloc(8);
  header.write('RLM1', 0, 'ascii');
  header.writeUInt16LE(0, 4);
  out.push(header);
  let count = 0;
  for (const element of src.elements ?? []) {
    const highway = element.tags?.highway;
    const geometry = element.geometry;
    if (!highway || !Array.isArray(geometry) || geometry.length < 2) continue;
    const cls = classOf(highway);
    const pts = [];
    for (const p of geometry) {
      if (typeof p.lat !== 'number' || typeof p.lon !== 'number') continue;
      const lat = Math.round(p.lat * 1e7), lng = Math.round(p.lon * 1e7);
      if (pts.length >= 2 && pts[pts.length - 2] === lat && pts[pts.length - 1] === lng) continue;
      pts.push(lat, lng);
    }
    const pointCount = Math.floor(pts.length / 2);
    if (pointCount < 2) continue;
    let start = 0;
    while (start + 1 < pointCount) {
      const end = Math.min(start + 255, pointCount);
      const n = end - start;
      const chunk = Buffer.alloc(4 + n * 8);
      chunk.writeUInt8(cls, 0);
      chunk.writeUInt8(n, 1);
      for (let i = 0; i < n; i++) {
        chunk.writeInt32LE(pts[(start + i) * 2], 4 + i * 8);
        chunk.writeInt32LE(pts[(start + i) * 2 + 1], 8 + i * 8);
      }
      out.push(chunk);
      count++;
      ways++;
      points += n;
      if (end === pointCount) break;
      start = end - 1;
    }
  }
  if (!count) continue;
  header.writeUInt16LE(count, 4);
  const data = Buffer.concat(out);
  fs.writeFileSync(path.join(output, name.replace(/\.json$/, '.rlm')), data);
  files++;
  bytes += data.length;
}

console.log(JSON.stringify({ files, ways, points, mb: +(bytes / 1048576).toFixed(2), output }));

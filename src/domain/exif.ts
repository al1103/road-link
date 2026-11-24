/** Minimal JPEG EXIF reader: GPS position and shooting direction. Stripped photos and HEIC return null. */
export type PhotoGeo = { lat: number; lng: number; heading?: number };

const TAG_GPS = 0x8825;
const GPS_LAT_REF = 1, GPS_LAT = 2, GPS_LNG_REF = 3, GPS_LNG = 4, GPS_DIR = 17;

export async function readPhotoGeo(file: Blob): Promise<PhotoGeo | null> {
  try { return parseJpeg(new DataView(await file.arrayBuffer())); } catch { return null; }
}

function parseJpeg(view: DataView): PhotoGeo | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  for (let offset = 2; offset + 4 <= view.byteLength;) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint16(offset);
    if (marker === 0xffda || marker === 0xffd9) break;
    const size = view.getUint16(offset + 2);
    if (size < 2) return null;
    // APP1 + "Exif\0\0" is the only place GPS lives.
    if (marker === 0xffe1 && offset + 12 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) return parseTiff(view, offset + 10);
    offset += 2 + size;
  }
  return null;
}

function parseTiff(view: DataView, base: number): PhotoGeo | null {
  if (base + 8 > view.byteLength) return null;
  const order = view.getUint16(base), little = order === 0x4949;
  if (!little && order !== 0x4d4d) return null;
  const u16 = (at: number) => view.getUint16(at, little), u32 = (at: number) => view.getUint32(at, little);
  if (u16(base + 2) !== 42) return null;
  const ifd0 = base + u32(base + 4);
  if (ifd0 + 2 > view.byteLength) return null;
  const gpsOffset = findTag(view, ifd0, little, TAG_GPS);
  if (gpsOffset === null) return null;
  const gps = base + gpsOffset;
  if (gps + 2 > view.byteLength) return null;
  let lat: number | null = null, lng: number | null = null, latRef = 'N', lngRef = 'E', heading: number | null = null;
  const count = u16(gps);
  for (let i = 0; i < count; i++) {
    const entry = gps + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = u16(entry), type = u16(entry + 2), n = u32(entry + 4), size = typeSize(type) * n;
    if (size <= 0) continue;
    const at = size <= 4 ? entry + 8 : base + u32(entry + 8);
    if (at < 0 || at + size > view.byteLength) continue;
    if (tag === GPS_LAT_REF) latRef = ascii(view, at, n);
    else if (tag === GPS_LAT) lat = degrees(view, at, little);
    else if (tag === GPS_LNG_REF) lngRef = ascii(view, at, n);
    else if (tag === GPS_LNG) lng = degrees(view, at, little);
    else if (tag === GPS_DIR) { const value = rational(view, at, little); if (Number.isFinite(value)) heading = value; }
  }
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (latRef.toUpperCase() === 'S') lat = -lat;
  if (lngRef.toUpperCase() === 'W') lng = -lng;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return heading !== null && heading >= 0 && heading <= 360 ? { lat, lng, heading } : { lat, lng };
}

function findTag(view: DataView, ifd: number, little: boolean, wanted: number): number | null {
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) return null;
    if (view.getUint16(entry, little) === wanted) return view.getUint32(entry + 8, little);
  }
  return null;
}

const typeSize = (type: number) => type === 3 ? 2 : type === 4 || type === 9 ? 4 : type === 5 || type === 10 ? 8 : 1;

function rational(view: DataView, at: number, little: boolean): number {
  const numerator = view.getUint32(at, little), denominator = view.getUint32(at + 4, little);
  return denominator ? numerator / denominator : NaN;
}

function degrees(view: DataView, at: number, little: boolean): number {
  return rational(view, at, little) + rational(view, at + 8, little) / 60 + rational(view, at + 16, little) / 3600;
}

function ascii(view: DataView, at: number, length: number): string {
  let text = '';
  for (let i = 0; i < length && at + i < view.byteLength; i++) {
    const code = view.getUint8(at + i);
    if (!code) break;
    text += String.fromCharCode(code);
  }
  return text;
}

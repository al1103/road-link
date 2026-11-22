import type { Coordinate } from './types';
const R = 6371000;
const rad = (n: number) => n * Math.PI / 180;
export function distance(a: Coordinate, b: Coordinate): number {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function cumulative(points: Coordinate[]): number[] {
  let total = 0;
  return points.map((point, i) => { if (i) total += distance(points[i - 1], point); return total; });
}
export function bearing(a: Coordinate, b: Coordinate): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
export function projectOnRoute(point: Coordinate, route: Coordinate[], lengths = cumulative(route), minAlong = 0, maxAlong = Infinity) {
  if (route.length < 2) throw new Error('Tuyến đường cần ít nhất hai điểm.');
  let best = { distance: Infinity, along: 0, point: route[0], segment: 0 };
  const cos = Math.cos(rad(point.lat));
  for (let i = 0; i < route.length - 1; i++) {
    if (lengths[i + 1] < minAlong || lengths[i] > maxAlong) continue;
    const a = route[i], b = route[i + 1];
    const ax = rad(a.lng - point.lng) * R * cos, ay = rad(a.lat - point.lat) * R;
    const bx = rad(b.lng - point.lng) * R * cos, by = rad(b.lat - point.lat) * R;
    const dx = bx - ax, dy = by - ay;
    const segmentLength = lengths[i + 1] - lengths[i] || 1;
    const low = Math.max(0, (minAlong - lengths[i]) / segmentLength);
    const high = Math.min(1, (maxAlong - lengths[i]) / segmentLength);
    const t = Math.max(low, Math.min(high, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best.distance) best = {
      distance: d, along: lengths[i] + t * (lengths[i + 1] - lengths[i]),
      point: { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) }, segment: i
    };
  }
  return best;
}
export function pointAt(points: Coordinate[], lengths: number[], meters: number): Coordinate {
  if (meters <= 0) return points[0];
  const i = lengths.findIndex(n => n >= meters);
  if (i < 0) return points[points.length - 1];
  if (i === 0) return points[0];
  const t = (meters - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
  return { lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * t, lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * t };
}
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1).replace('.', ',')} km` : `${Math.max(0, Math.round(meters / 10) * 10)} m`;
}
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

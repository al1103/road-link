import { cumulative, pointAt } from '../domain/geometry';
import type { Fix, Progress, Route } from '../domain/types';
import type { CurrentLimit, RoadFeature } from '../domain/roadData';
export const SERVICE_UUID = '7b2e0001-6a5b-4c3d-9e8f-1029384756ab';
export const WRITE_UUID = '7b2e0002-6a5b-4c3d-9e8f-1029384756ab';
export const STATUS_UUID = '7b2e0003-6a5b-4c3d-9e8f-1029384756ab';
export const MAX_LINE_BYTES = 1536;
export type WireMessage = { v: 1; type: string; [key: string]: unknown };
export function encodeMessage(message: WireMessage, payloadBytes: number): Uint8Array[] {
  if (!Number.isInteger(payloadBytes) || payloadBytes < 1 || payloadBytes > 512) throw new Error('BLE payload size is invalid');
  const bytes = new TextEncoder().encode(JSON.stringify(message) + '\n');
  if (bytes.length > MAX_LINE_BYTES) throw new Error('BLE message is too large');
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += payloadBytes) chunks.push(bytes.slice(i, i + payloadBytes));
  return chunks;
}
export function routeMessages(route: Route): WireMessage[] {
  const lengths = cumulative(route.coordinates);
  const count = Math.min(route.coordinates.length, 192);
  const points = route.coordinates.length <= 192 ? route.coordinates : Array.from({ length: count }, (_, i) => pointAt(route.coordinates, lengths, lengths[lengths.length - 1] * i / (count - 1)));
  const messages: WireMessage[] = [{ v: 1, type: 'route.begin', route: route.id, count: points.length }];
  for (let i = 0; i < points.length; i += 12) messages.push({ v: 1, type: 'route.points', route: route.id, start: i, points: points.slice(i, i + 12).map(p => [Math.round(p.lat * 1e7), Math.round(p.lng * 1e7)]) });
  messages.push({ v: 1, type: 'route.end', route: route.id, count: points.length });
  return messages;
}
function asciiRoad(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\x20-\x7E]/g, '').trim().slice(0, 40);
}
export function navMessage(route: Route, progress: Progress, fix: Fix, seq: number, context?:{enabled:boolean;limit:CurrentLimit;feature?:RoadFeature}): WireMessage {
  return { v: 1, type: 'nav', route: route.id, seq, lat_e7: Math.round(fix.lat * 1e7), lng_e7: Math.round(fix.lng * 1e7),
    heading: fix.headingAvailable===false?null:Math.round(fix.heading),heading_available:fix.headingAvailable!==false, speed_kmh: Math.round(Math.max(0, fix.speed) * 3.6), maneuver: progress.step.maneuver,
    turn_m: Math.round(progress.nextTurn), remaining_m: Math.round(progress.remaining), eta_s: Math.round(progress.etaSeconds), arrived: progress.arrived,
    instruction: progress.step.instruction.slice(0, 120), road: asciiRoad(progress.step.road),
    road_data_enabled:!!context?.enabled,speed_limit_kmh:context?.enabled?context.limit.kmh:null,speed_limit_source:context?.enabled&&context.limit.kmh!==null?'osm':null,
    road_feature:context?.enabled&&context.feature?{id:context.feature.id,kind:context.feature.kind,distance_m:Math.round(Math.max(0,context.feature.along-progress.along)),direction_verified:false}:null };
}
/** Reference receiver used to validate UTF-8 framing across arbitrary BLE packets. */
export class LineReceiver {
  private bytes: number[] = [];
  private dropping = false;
  push(chunk: Uint8Array): WireMessage[] {
    const messages: WireMessage[] = [];
    for (const b of chunk) {
      if (b === 10) {
        if (!this.dropping && this.bytes.length) {
          try { const m = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(this.bytes))); if (m.v === 1 && typeof m.type === 'string') messages.push(m); } catch { /* discard malformed packet */ }
        }
        this.bytes = []; this.dropping = false;
      } else if (!this.dropping) {
        if (this.bytes.length >= MAX_LINE_BYTES - 1) { this.dropping = true; this.bytes = []; }
        else this.bytes.push(b);
      }
    }
    return messages;
  }
}

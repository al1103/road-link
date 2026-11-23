import { cumulative, projectOnRoute } from './geometry';
import type { FeatureKind, RoadData, RoadFeature } from './roadData';
import type { Route } from './types';

export type AddableFeatureKind = Extract<FeatureKind, 'stop' | 'give-way' | 'speed-sign' | 'no-overtaking' | 'no-entry' | 'signals' | 'speed-camera' | 'prohibition'>;

export type UserRoadEdit =
  | { id: string; kind: 'suppress'; targetId: string; label: string; createdAt: number }
  | { id: string; kind: 'addition'; lat: number; lng: number; featureKind: AddableFeatureKind; label: string; speedKmh?: number; note?: string; createdAt: number };

const MAX_USER_ROAD_EDITS = 300;

export function isUserRoadEdit(value: unknown): value is UserRoadEdit {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.createdAt !== 'number') return false;
  if (v.kind === 'suppress') return typeof v.targetId === 'string' && typeof v.label === 'string';
  if (v.kind === 'addition') return typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.featureKind === 'string' && typeof v.label === 'string';
  return false;
}

export function pruneUserRoadEdits(edits: UserRoadEdit[]): UserRoadEdit[] {
  return edits.length > MAX_USER_ROAD_EDITS ? edits.slice(edits.length - MAX_USER_ROAD_EDITS) : edits;
}

// Overlays the user's own corrections on top of live/offline OSM road data:
// hides features they reported as wrong or missing, and injects signs they
// recorded themselves. Speed-limit *sections* (the number used for the live
// overspeed alert) are intentionally left untouched — unverified user input
// should not be able to silently change what the app treats as the posted limit.
export function applyUserEdits(data: RoadData | null, edits: UserRoadEdit[], route: Route | null): RoadData | null {
  if (!data || !edits.length) return data;
  const suppressed = new Set(edits.filter((e): e is Extract<UserRoadEdit, { kind: 'suppress' }> => e.kind === 'suppress').map(e => e.targetId));
  const additions = edits.filter((e): e is Extract<UserRoadEdit, { kind: 'addition' }> => e.kind === 'addition');
  let features = suppressed.size ? data.features.filter(f => !suppressed.has(f.id)) : data.features;
  if (additions.length && route && route.id === data.routeId) {
    const lengths = cumulative(route.coordinates);
    const added: RoadFeature[] = additions.flatMap(edit => {
      const hit = projectOnRoute({ lat: edit.lat, lng: edit.lng }, route.coordinates, lengths);
      if (hit.along < data.windowStart - 50 || hit.along > data.windowEnd + 50) return [];
      const code = edit.speedKmh ? `127[${edit.speedKmh}]` : '';
      return [{ id: `user/${edit.id}`, osmId: 0, lat: edit.lat, lng: edit.lng, kind: edit.featureKind, label: edit.label, code, along: hit.along, onRoute: false, distanceFromRoute: hit.distance, userAdded: true }];
    });
    if (added.length) features = [...features, ...added].sort((a, b) => a.along - b.along);
  }
  return features === data.features ? data : { ...data, features };
}

export const ADDABLE_FEATURE_LABELS: Record<AddableFeatureKind, string> = {
  stop: 'Biển STOP',
  'give-way': 'Biển nhường đường',
  'speed-sign': 'Biển giới hạn tốc độ',
  'no-overtaking': 'Cấm vượt',
  'no-entry': 'Cấm đi vào / ngược chiều',
  signals: 'Đèn giao thông',
  'speed-camera': 'Camera tốc độ',
  prohibition: 'Biển cấm khác'
};

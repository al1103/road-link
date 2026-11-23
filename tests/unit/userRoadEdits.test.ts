import { describe, expect, it } from 'vitest';
import { applyUserEdits, isUserRoadEdit, pruneUserRoadEdits, type UserRoadEdit } from '../../src/domain/userRoadEdits';
import { RoadAlertEngine } from '../../src/domain/roadAlerts';
import type { CurrentLimit, RoadData, RoadFeature } from '../../src/domain/roadData';
import type { Fix, Progress, Route } from '../../src/domain/types';

const route: Route = {
  id: 'route-1',
  coordinates: [{ lat: 10.770, lng: 106.690 }, { lat: 10.780, lng: 106.690 }],
  steps: [{ index: 0, road: 'Đường chính', maneuver: 'depart', instruction: 'Đi thẳng', at: { lat: 10.770, lng: 106.690 }, distance: 1000, duration: 100, offset: 0 }],
  distance: 1000, duration: 100,
  destination: { id: 'dest-1', name: 'Điểm đến', detail: '', lat: 10.780, lng: 106.690 }
};

const existingFeature: RoadFeature = { id: 'node/1001', osmId: 1001, kind: 'speed-camera', label: 'Camera tốc độ', code: '', lat: 10.773, lng: 106.690, along: 300, onRoute: true, distanceFromRoute: 2 };

const data: RoadData = { routeId: 'route-1', windowStart: 0, windowEnd: 1000, fetchedAt: Date.now(), sections: [], features: [existingFeature], source: { kind: 'offline', attribution: 'OSM', license: 'ODbL' } };

describe('applyUserEdits', () => {
  it('returns the same object when there are no edits', () => {
    expect(applyUserEdits(data, [], route)).toBe(data);
  });

  it('returns null unchanged', () => {
    expect(applyUserEdits(null, [], route)).toBeNull();
  });

  it('hides a feature reported as wrong via a suppress edit', () => {
    const edits: UserRoadEdit[] = [{ id: 'e1', kind: 'suppress', targetId: existingFeature.id, label: existingFeature.label, createdAt: Date.now() }];
    const merged = applyUserEdits(data, edits, route)!;
    expect(merged.features).toHaveLength(0);
    expect(data.features).toHaveLength(1); // original untouched
  });

  it('injects a user-added feature projected onto the route, flagged userAdded', () => {
    const edits: UserRoadEdit[] = [{ id: 'e2', kind: 'addition', lat: 10.775, lng: 106.690, featureKind: 'speed-sign', label: 'Biển giới hạn tốc độ 50 km/h', speedKmh: 50, createdAt: Date.now() }];
    const merged = applyUserEdits(data, edits, route)!;
    const added = merged.features.find(f => f.id === 'user/e2');
    expect(added).toBeDefined();
    expect(added!.userAdded).toBe(true);
    expect(added!.code).toBe('127[50]');
    expect(added!.along).toBeGreaterThan(0);
    // original OSM feature is still present alongside the addition
    expect(merged.features.some(f => f.id === existingFeature.id)).toBe(true);
  });

  it('does not add a feature belonging to a different route', () => {
    const edits: UserRoadEdit[] = [{ id: 'e3', kind: 'addition', lat: 10.775, lng: 106.690, featureKind: 'stop', label: 'Biển STOP', createdAt: Date.now() }];
    const otherRoute: Route = { ...route, id: 'different-route' };
    const merged = applyUserEdits(data, edits, otherRoute)!;
    expect(merged.features.some(f => f.id === 'user/e3')).toBe(false);
  });

  it('drops an addition that falls outside the loaded window', () => {
    const edits: UserRoadEdit[] = [{ id: 'e4', kind: 'addition', lat: 50, lng: 50, featureKind: 'stop', label: 'Biển STOP', createdAt: Date.now() }];
    const merged = applyUserEdits(data, edits, route)!;
    expect(merged.features.some(f => f.id === 'user/e4')).toBe(false);
  });
});

describe('pruneUserRoadEdits', () => {
  it('caps the list to the most recent entries', () => {
    const edits: UserRoadEdit[] = Array.from({ length: 310 }, (_, i) => ({ id: `e${i}`, kind: 'suppress', targetId: `t${i}`, label: 'x', createdAt: i }));
    const pruned = pruneUserRoadEdits(edits);
    expect(pruned).toHaveLength(300);
    expect(pruned[0].id).toBe('e10');
    expect(pruned.at(-1)!.id).toBe('e309');
  });
});

describe('isUserRoadEdit', () => {
  it('accepts valid suppress and addition shapes', () => {
    expect(isUserRoadEdit({ id: 'a', kind: 'suppress', targetId: 'x', label: 'y', createdAt: 1 })).toBe(true);
    expect(isUserRoadEdit({ id: 'a', kind: 'addition', lat: 1, lng: 2, featureKind: 'stop', label: 'y', createdAt: 1 })).toBe(true);
  });
  it('rejects malformed or unknown-kind values', () => {
    expect(isUserRoadEdit(null)).toBe(false);
    expect(isUserRoadEdit({ id: 'a', kind: 'other', createdAt: 1 })).toBe(false);
    expect(isUserRoadEdit({ id: 'a', kind: 'suppress', createdAt: 1 })).toBe(false);
  });
});

describe('RoadAlertEngine with user-added features', () => {
  const progress: Progress = { along: 100, remaining: 900, etaSeconds: 90, step: route.steps[0], nextTurn: 900, offRoute: false, distanceFromRoute: 0, arrived: false };
  const limit: CurrentLimit = { kmh: 50, reason: 'ok', wayId: 1 };
  it('labels the spoken alert as user-sourced for a userAdded feature', () => {
    const edits: UserRoadEdit[] = [{ id: 'e5', kind: 'addition', lat: 10.773, lng: 106.690, featureKind: 'stop', label: 'Biển STOP', createdAt: Date.now() }];
    const dataWithoutOsmFeatures: RoadData = { ...data, features: [] };
    const merged = applyUserEdits(dataWithoutOsmFeatures, edits, route)!;
    const engine = new RoadAlertEngine();
    const fix: Fix = { lat: 10.771, lng: 106.690, accuracy: 10, speed: 20, heading: 0, timestamp: 100_000 };
    const alert = engine.update(route, merged, fix, progress, limit, 100_000);
    expect(alert).not.toBeNull();
    expect(alert!.source).toBe('user');
    expect(alert!.speech).toContain('Theo biển bạn đã thêm.');
  });
});

import { describe, it, expect } from 'vitest';
import { RoadAlertEngine } from '../../src/domain/roadAlerts';
import type { Route, Fix, Progress } from '../../src/domain/types';
import type { CurrentLimit, RoadData, RoadFeature } from '../../src/domain/roadData';

describe('RoadAlertEngine', () => {
  const route: Route = {
    id: 'route-alerts-1',
    coordinates: [
      { lat: 10.770, lng: 106.690 },
      { lat: 10.780, lng: 106.690 },
    ],
    steps: [
      {
        index: 0,
        road: 'Đường chính',
        maneuver: 'depart',
        instruction: 'Đi thẳng',
        at: { lat: 10.770, lng: 106.690 },
        distance: 1000,
        duration: 100,
        offset: 0,
      },
    ],
    distance: 1000,
    duration: 100,
    destination: {
      id: 'dest-1',
      name: 'Điểm đến',
      detail: '',
      lat: 10.780,
      lng: 106.690,
    },
  };

  const sampleFeature: RoadFeature = {
    id: 'camera-node-1',
    osmId: 1001,
    kind: 'speed-camera',
    label: 'Camera tốc độ',
    code: '',
    lat: 10.773,
    lng: 106.690,
    along: 300,
    onRoute: true,
    distanceFromRoute: 2,
  };

  const roadData: RoadData = {
    routeId: 'route-alerts-1',
    windowStart: 0,
    windowEnd: 1000,
    fetchedAt: Date.now(),
    source: {
      kind: 'offline',
      attribution: 'OSM',
      license: 'ODbL',
    },
    sections: [
      {
        id: 'sec-1',
        wayId: 12345,
        kmh: 50,
        raw: '50',
        from: { lat: 10.770, lng: 106.690 },
        to: { lat: 10.775, lng: 106.690 },
        start: 0,
        end: 500,
      },
      {
        id: 'sec-2',
        wayId: 67890,
        kmh: 60,
        raw: '60',
        from: { lat: 10.775, lng: 106.690 },
        to: { lat: 10.780, lng: 106.690 },
        start: 500,
        end: 1000,
      },
    ],
    features: [sampleFeature],
  };

  const defaultProgress: Progress = {
    along: 100,
    remaining: 900,
    etaSeconds: 90,
    step: route.steps[0],
    nextTurn: 900,
    offRoute: false,
    distanceFromRoute: 0,
    arrived: false,
  };

  const currentLimit: CurrentLimit = {
    kmh: 50,
    reason: 'Đoạn đường 50 km/h',
    wayId: 12345,
  };

  it('rejects stale, inaccurate, or off-route conditions', () => {
    const engine = new RoadAlertEngine();
    const now = 100_000;

    // Bad accuracy (> 20)
    const fixBadAccuracy: Fix = {
      lat: 10.771,
      lng: 106.690,
      accuracy: 25,
      speed: 10,
      heading: 0,
      timestamp: now,
    };
    expect(engine.update(route, roadData, fixBadAccuracy, defaultProgress, currentLimit, now)).toBeNull();

    // Stale fix (> 15s old)
    const fixStale: Fix = {
      lat: 10.771,
      lng: 106.690,
      accuracy: 10,
      speed: 10,
      heading: 0,
      timestamp: now - 16_000,
    };
    expect(engine.update(route, roadData, fixStale, defaultProgress, currentLimit, now)).toBeNull();

    // Off-route progress
    const fixOk: Fix = {
      lat: 10.771,
      lng: 106.690,
      accuracy: 10,
      speed: 10,
      heading: 0,
      timestamp: now,
    };
    expect(engine.update(route, roadData, fixOk, { ...defaultProgress, offRoute: true }, currentLimit, now)).toBeNull();

    // Arrived progress
    expect(engine.update(route, roadData, fixOk, { ...defaultProgress, arrived: true }, currentLimit, now)).toBeNull();
  });

  it('alerts for upcoming features ahead within window and applies cooldown', () => {
    const engine = new RoadAlertEngine();
    let now = 100_000;

    // fix speed = 10 m/s (36 km/h). ahead window = max(200, 10 * 20) = 200m.
    // progress along = 100m, feature along = 300m -> difference = 200m -> within ahead window!
    const fix: Fix = {
      lat: 10.771,
      lng: 106.690,
      accuracy: 10,
      speed: 10,
      heading: 0,
      timestamp: now,
    };

    const alert = engine.update(route, roadData, fix, defaultProgress, currentLimit, now);
    expect(alert).not.toBeNull();
    expect(alert!.kind).toBe('camera');
    expect(alert!.title).toBe('Camera tốc độ');
    expect(alert!.speech).toContain('Theo dữ liệu bản đồ.');
    expect(alert!.speech.toLocaleLowerCase('vi')).toContain('camera tốc độ');

    // Attempting another alert within cooldown period (< 6500ms) returns null
    now += 4000;
    const fixCooldown: Fix = {
      lat: 10.771,
      lng: 106.690,
      accuracy: 10,
      speed: 10,
      heading: 0,
      timestamp: now,
    };
    expect(engine.update(route, roadData, fixCooldown, defaultProgress, currentLimit, now)).toBeNull();
  });

  it('triggers overspeed warning after 3 consecutive overspeed readings', () => {
    const engine = new RoadAlertEngine();
    let now = 100_000;
    // limit is 50 km/h. Speed over limit+5 km/h: 60 km/h = 16.67 m/s
    const overspeedFix = (t: number): Fix => ({
      lat: 10.771,
      lng: 106.690,
      accuracy: 10,
      speed: 17, // ~61.2 km/h > 55 km/h
      heading: 0,
      timestamp: t,
    });

    // Fix 1: overCount = 1
    engine.update(route, roadData, overspeedFix(now), defaultProgress, currentLimit, now);

    // Fix 2: after cooldown, overCount = 2
    now += 7000;
    engine.update(route, roadData, overspeedFix(now), defaultProgress, currentLimit, now);

    // Fix 3: overCount = 3 -> overspeed alert triggered!
    now += 7000;
    const alert = engine.update(route, roadData, overspeedFix(now), defaultProgress, currentLimit, now);
    expect(alert).not.toBeNull();
    expect(alert!.kind).toBe('overspeed');
    expect(alert!.title).toBe('Chú ý tốc độ');
    expect(alert!.speech).toContain('ki lô mét một giờ');
  });

  it('resets alert tracking when switching to a different route', () => {
    const engine = new RoadAlertEngine();
    const now = 100_000;
    const fix: Fix = {
      lat: 10.771,
      lng: 106.690,
      accuracy: 10,
      speed: 10,
      heading: 0,
      timestamp: now,
    };

    // First route alert
    const alert1 = engine.update(route, roadData, fix, defaultProgress, currentLimit, now);
    expect(alert1).not.toBeNull();

    // Switch to route2
    const route2: Route = { ...route, id: 'route-alerts-2' };
    const roadData2: RoadData = { ...roadData, routeId: 'route-alerts-2' };

    // Even right away, switching route resets routeId and seen features
    const alert2 = engine.update(route2, roadData2, { ...fix, timestamp: now + 100 }, defaultProgress, currentLimit, now + 100);
    expect(alert2).not.toBeNull();
    expect(alert2!.id).toBe(sampleFeature.id);
  });
});

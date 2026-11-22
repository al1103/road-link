import { describe, it, expect } from 'vitest';
import { Navigator } from '../../src/domain/navigation';
import type { Route, RouteStep, Fix } from '../../src/domain/types';

describe('Navigator engine', () => {
  const steps: RouteStep[] = [
    {
      index: 0,
      road: 'Đường A',
      maneuver: 'depart',
      instruction: 'Xuất phát theo Đường A',
      at: { lat: 10.7720, lng: 106.6980 },
      distance: 100,
      duration: 20,
      offset: 0,
    },
    {
      index: 1,
      road: 'Đường B',
      maneuver: 'right',
      instruction: 'Rẽ phải vào Đường B',
      at: { lat: 10.7729, lng: 106.6980 },
      distance: 100,
      duration: 20,
      offset: 100,
    },
    {
      index: 2,
      road: 'Đường B',
      maneuver: 'arrive',
      instruction: 'Đã đến điểm hẹn',
      at: { lat: 10.7729, lng: 106.6989 },
      distance: 0,
      duration: 0,
      offset: 200,
    },
  ];

  const route: Route = {
    id: 'test-route-1',
    coordinates: [
      { lat: 10.7720, lng: 106.6980 },
      { lat: 10.7729, lng: 106.6980 },
      { lat: 10.7729, lng: 106.6989 },
    ],
    steps,
    distance: 200,
    duration: 40,
    destination: {
      id: 'dest',
      name: 'Điểm đến',
      detail: 'Quận 1',
      lat: 10.7729,
      lng: 106.6989,
    },
  };

  it('rejects invalid or corrupted GPS fixes', () => {
    const nav = new Navigator(route);
    const validBase: Fix = {
      lat: 10.7720,
      lng: 106.6980,
      accuracy: 10,
      speed: 5,
      heading: 0,
      timestamp: 1000,
    };

    expect(nav.update({ ...validBase, accuracy: 70 })).toBeNull();
    expect(nav.update({ ...validBase, accuracy: -5 })).toBeNull();
    expect(nav.update({ ...validBase, accuracy: NaN })).toBeNull();
    expect(nav.update({ ...validBase, lat: 95 })).toBeNull();
    expect(nav.update({ ...validBase, lng: 190 })).toBeNull();
    expect(nav.update({ ...validBase, timestamp: NaN })).toBeNull();

    // First valid update succeeds
    const progress1 = nav.update(validBase);
    expect(progress1).not.toBeNull();

    // Stale or duplicate timestamp is rejected
    expect(nav.update({ ...validBase, timestamp: 1000 })).toBeNull();
    expect(nav.update({ ...validBase, timestamp: 999 })).toBeNull();
  });

  it('tracks progression along route segments', () => {
    const nav = new Navigator(route);
    const startProgress = nav.update({
      lat: 10.7720,
      lng: 106.6980,
      accuracy: 5,
      speed: 10,
      heading: 0,
      timestamp: 1000,
    });

    expect(startProgress).not.toBeNull();
    expect(startProgress!.along).toBeCloseTo(0, 0);
    expect(startProgress!.offRoute).toBe(false);
    expect(startProgress!.arrived).toBe(false);
    expect(startProgress!.remaining).toBeGreaterThan(150);

    // Advance to midway point
    const midProgress = nav.update({
      lat: 10.7729,
      lng: 106.6980,
      accuracy: 5,
      speed: 10,
      heading: 90,
      timestamp: 11000,
    });

    expect(midProgress).not.toBeNull();
    expect(midProgress!.along).toBeGreaterThan(startProgress!.along);
    expect(midProgress!.remaining).toBeLessThan(startProgress!.remaining);
    expect(midProgress!.offRoute).toBe(false);
  });

  it('requires 3 consecutive deviations before declaring offRoute', () => {
    const nav = new Navigator(route);
    nav.update({
      lat: 10.7720,
      lng: 106.6980,
      accuracy: 5,
      speed: 5,
      heading: 0,
      timestamp: 1000,
    });

    // Fix 1 away from route (> tolerance 35m)
    const dev1 = nav.update({
      lat: 10.7800,
      lng: 106.7100,
      accuracy: 5,
      speed: 5,
      heading: 0,
      timestamp: 2000,
    });
    expect(dev1?.offRoute).toBe(false);

    // Fix 2 away from route
    const dev2 = nav.update({
      lat: 10.7800,
      lng: 106.7100,
      accuracy: 5,
      speed: 5,
      heading: 0,
      timestamp: 3000,
    });
    expect(dev2?.offRoute).toBe(false);

    // Fix 3 away from route triggers offRoute
    const dev3 = nav.update({
      lat: 10.7800,
      lng: 106.7100,
      accuracy: 5,
      speed: 5,
      heading: 0,
      timestamp: 4000,
    });
    expect(dev3?.offRoute).toBe(true);

    // Moving back on route clears offRoute immediately
    const recovered = nav.update({
      lat: 10.7725,
      lng: 106.6980,
      accuracy: 5,
      speed: 5,
      heading: 0,
      timestamp: 5000,
    });
    expect(recovered?.offRoute).toBe(false);
  });

  it('detects arrival when within target radius of final destination', () => {
    const nav = new Navigator(route);
    // Start at beginning
    nav.update({
      lat: 10.7720,
      lng: 106.6980,
      accuracy: 5,
      speed: 10,
      heading: 0,
      timestamp: 1000,
    });
    // Advance midway
    nav.update({
      lat: 10.7729,
      lng: 106.6980,
      accuracy: 5,
      speed: 10,
      heading: 90,
      timestamp: 11000,
    });
    // Reach destination (lat: 10.7729, lng: 106.6989)
    const arrival = nav.update({
      lat: 10.7729,
      lng: 106.6989,
      accuracy: 5,
      speed: 2,
      heading: 90,
      timestamp: 21000,
    });

    expect(arrival).not.toBeNull();
    expect(arrival!.arrived).toBe(true);
    expect(arrival!.remaining).toBeLessThanOrEqual(28);
  });
});

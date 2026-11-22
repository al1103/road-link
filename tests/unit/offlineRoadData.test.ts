import { describe, it, expect } from 'vitest';
import { tilesForRoute, routeScanRequests } from '../../src/services/offlineRoadData';
import type { Route } from '../../src/domain/types';

describe('offlineRoadData helpers', () => {
  const shortRoute: Route = {
    id: 'hcmc-route',
    coordinates: [
      { lat: 10.7720, lng: 106.6980 },
      { lat: 10.7790, lng: 106.6990 },
    ],
    steps: [],
    distance: 800,
    duration: 100,
    destination: { id: 'd', name: '', detail: '', lat: 10.7790, lng: 106.6990 },
  };

  it('determines the bounding tile coordinates for a short route', () => {
    const tiles = tilesForRoute(shortRoute, 200);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(16);
    // Keys format should be ${x}_${y}
    for (const key of tiles) {
      expect(key).toMatch(/^\d+_\d+$/);
    }
  });

  it('throws an error if route corridor bounding area is excessively large (>16 tiles)', () => {
    // Near polar latitudes, longitude degrees represent very short physical distances,
    // causing a normal corridor to span many longitude tiles (>16)
    const polarRoute: Route = {
      id: 'polar-route',
      coordinates: [
        { lat: 89.9, lng: 10.0 },
        { lat: 89.9, lng: 12.0 },
      ],
      steps: [],
      distance: 500,
      duration: 50,
      destination: { id: 'd', name: '', detail: '', lat: 89.9, lng: 12.0 },
    };

    expect(() => tilesForRoute(polarRoute, 100)).toThrow('Phạm vi dữ liệu đường quá lớn');
  });

  it('generates proper scan request checkpoints along a route', () => {
    const mediumRoute: Route = {
      id: 'medium-route',
      coordinates: [
        { lat: 10.0, lng: 106.0 },
        { lat: 10.1, lng: 106.0 },
      ],
      steps: [],
      distance: 12000,
      duration: 1200,
      destination: { id: 'd', name: '', detail: '', lat: 10.1, lng: 106.0 },
    };

    const requests = routeScanRequests(mediumRoute);
    expect(requests[0]).toBe(300);
    expect(requests.length).toBeGreaterThan(1);
  });
});

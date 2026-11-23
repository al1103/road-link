import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRoadData } from '../../src/services/roadData';
import type { Route } from '../../src/domain/types';

const route: Route = {
  id: 'route-service-1',
  coordinates: [{ lat: 10.770, lng: 106.690 }, { lat: 10.780, lng: 106.690 }],
  steps: [{ index: 0, road: 'x', maneuver: 'depart', instruction: 'x', at: { lat: 10.770, lng: 106.690 }, distance: 1000, duration: 100, offset: 0 }],
  distance: 1000, duration: 100,
  destination: { id: 'd', name: 'd', detail: '', lat: 10.780, lng: 106.690 }
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchRoadData', () => {
  it('falls back to the second Overpass host when the primary fails', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(String(url));
      if (calls.length === 1) return new Response('busy', { status: 502 });
      return new Response(JSON.stringify({ elements: [] }), { status: 200 });
    }));
    const controller = new AbortController();
    const data = await fetchRoadData(route, 0, controller.signal);
    expect(calls).toHaveLength(2);
    expect(calls[1]).not.toBe(calls[0]);
    expect(data.routeId).toBe(route.id);
    expect(data.features).toEqual([]);
  });
});

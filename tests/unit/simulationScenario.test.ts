import { describe, it, expect } from 'vitest';
import {
  warningScore,
  SIMULATION_ORIGIN,
  SIMULATION_DESTINATION,
  SIMULATION_VIA,
} from '../../src/services/simulationScenario';
import type { RoadData, RoadFeature } from '../../src/domain/roadData';

describe('simulationScenario module', () => {
  it('correctly weighs features for warningScore', () => {
    const makeFeature = (kind: RoadFeature['kind'], onRoute: boolean): RoadFeature => ({
      id: `f-${kind}-${onRoute}`,
      osmId: 1,
      kind,
      label: 'Test Feature',
      code: '',
      lat: 10.0,
      lng: 106.0,
      along: 100,
      onRoute,
    });

    const data: RoadData = {
      routeId: 'sim-route',
      windowStart: 0,
      windowEnd: 1000,
      fetchedAt: Date.now(),
      sections: [],
      features: [
        makeFeature('stop', true), // 10
        makeFeature('give-way', true), // 10
        makeFeature('traffic-calming', true), // 10
        makeFeature('rail-crossing', true), // 10
        makeFeature('hazard', true), // 10
        makeFeature('pedestrian-crossing', true), // 3
        makeFeature('sign', true), // 2
        makeFeature('signals', true), // 0.25
        makeFeature('speed-camera', true), // 1 (fallback for other kinds)
        makeFeature('stop', false), // 0 because onRoute is false!
      ],
    };

    // Expected score: 10 + 10 + 10 + 10 + 10 + 3 + 2 + 0.25 + 1 = 56.25
    expect(warningScore(data)).toBe(56.25);
  });

  it('provides valid simulation origin and destination in Vietnam', () => {
    expect(SIMULATION_ORIGIN.lat).toBeGreaterThan(8);
    expect(SIMULATION_ORIGIN.lat).toBeLessThan(24);
    expect(SIMULATION_ORIGIN.lng).toBeGreaterThan(102);
    expect(SIMULATION_ORIGIN.lng).toBeLessThan(110);

    expect(SIMULATION_DESTINATION.lat).toBeGreaterThan(8);
    expect(SIMULATION_DESTINATION.lat).toBeLessThan(24);
    expect(SIMULATION_DESTINATION.lng).toBeGreaterThan(102);
    expect(SIMULATION_DESTINATION.lng).toBeLessThan(110);

    expect(SIMULATION_VIA.id).toBe(10688320858);
  });
});

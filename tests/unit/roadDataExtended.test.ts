import { describe, it, expect } from 'vitest';
import {
  parseSpeed,
  limitForCar,
  buildRoadQuery,
  parseRoadData,
  currentLimit,
  UNKNOWN_LIMIT,
} from '../../src/domain/roadData';
import type { Route, Fix } from '../../src/domain/types';

describe('roadData domain logic', () => {
  describe('parseSpeed', () => {
    it('parses valid speeds in various formats and units', () => {
      expect(parseSpeed('60')).toBe(60);
      expect(parseSpeed('80 km/h')).toBe(80);
      expect(parseSpeed('100 kph')).toBe(100);
      expect(parseSpeed('50 mph')).toBe(80); // 50 * 1.609344 = 80.4672 -> 80
      expect(parseSpeed('  90   ')).toBe(90);
    });

    it('rejects invalid, out-of-range, or non-numeric speed values', () => {
      expect(parseSpeed('0')).toBeNull();
      expect(parseSpeed('-20')).toBeNull();
      expect(parseSpeed('350')).toBeNull();
      expect(parseSpeed('VN:urban')).toBeNull();
      expect(parseSpeed('50|60')).toBeNull();
      expect(parseSpeed('')).toBeNull();
      expect(parseSpeed('unlimited')).toBeNull();
    });
  });

  describe('limitForCar', () => {
    it('prioritizes specific motorcar and directional speed tags', () => {
      const tags = {
        maxspeed: '50',
        'maxspeed:motorcar': '60',
        'maxspeed:motorcar:forward': '70',
      };
      expect(limitForCar(tags, true).kmh).toBe(70);
      expect(limitForCar(tags, false).kmh).toBe(60);
    });

    it('handles conditional, lanes, and variable speeds safely', () => {
      const cond = limitForCar({ 'maxspeed:conditional': '60 @ wet' }, true);
      expect(cond.kmh).toBeNull();
      expect(cond.reason).toContain('áp dụng');

      const lanes = limitForCar({ 'maxspeed:lanes': '80|60' }, true);
      expect(lanes.kmh).toBeNull();

      const variable = limitForCar({ 'maxspeed:variable': 'yes' }, true);
      expect(variable.kmh).toBeNull();
    });
  });

  describe('buildRoadQuery & parseRoadData', () => {
    const route: Route = {
      id: 'query-test-route',
      coordinates: [
        { lat: 10.770, lng: 106.690 },
        { lat: 10.780, lng: 106.690 },
      ],
      steps: [],
      distance: 1000,
      duration: 100,
      destination: { id: 'd', name: '', detail: '', lat: 10.780, lng: 106.690 },
      osmEdges: [{ from: 101, to: 102, start: 0, end: 1000 }],
    };

    it('builds an Overpass corridor query with timeout and filter tags', () => {
      const query = buildRoadQuery(route, 100);
      expect(query.query).toContain('[out:json]');
      expect(query.query).toContain('traffic_sign');
      expect(query.query).not.toContain('railway');
      expect(query.query).not.toContain('traffic_calming');
      expect(query.query).not.toContain('crossing');
      expect(query.start).toBeLessThanOrEqual(100);
      expect(query.end).toBeGreaterThan(100);
    });

    it('parses node features and way sections from OSM payload', () => {
      const query = buildRoadQuery(route, 100);
      const rawOsm = {
        elements: [
          {
            type: 'node',
            id: 501,
            lat: 10.772,
            lon: 106.690,
            tags: { highway: 'traffic_signals' },
          },
          {
            type: 'node',
            id: 502,
            lat: 10.774,
            lon: 106.690,
            tags: { highway: 'speed_camera' },
          },
          {
            type: 'way',
            id: 801,
            nodes: [101, 102],
            geometry: [
              { lat: 10.770, lon: 106.690 },
              { lat: 10.780, lon: 106.690 },
            ],
            tags: { maxspeed: '60' },
          },
        ],
      };

      const parsed = parseRoadData(rawOsm, route, query);
      expect(parsed.routeId).toBe(route.id);
      expect(parsed.features.length).toBe(2);
      expect(parsed.features.some(f => f.kind === 'signals')).toBe(true);
      expect(parsed.features.some(f => f.kind === 'speed-camera')).toBe(true);
      expect(parsed.sections.length).toBeGreaterThan(0);
      expect(parsed.sections[0].kmh).toBe(60);
    });

    it('throws when payload has error remark or exceeds limit', () => {
      const query = buildRoadQuery(route, 100);
      expect(() => parseRoadData({ remark: 'runtime error' }, route, query)).toThrow();
      expect(() => parseRoadData(null, route, query)).toThrow();
    });

    it('keeps only enforcement signs and drops railway, pedestrian, calming and hazard nodes', () => {
      const query = buildRoadQuery(route, 100);
      const node = (id: number, tags: Record<string, string>) => ({ type: 'node', id, lat: 10.772, lon: 106.690, tags });
      const parsed = parseRoadData({ elements: [
        node(601, { traffic_sign: 'VN:P.102' }),
        node(602, { railway: 'level_crossing' }),
        node(603, { highway: 'crossing', crossing: 'marked' }),
        node(604, { traffic_calming: 'hump' }),
        node(605, { hazard: 'school' }),
        node(606, { traffic_sign: 'overtaking' }),
        node(607, { traffic_sign: 'VN:401,127[60]' }),
        node(608, { maxheight: '3.5' }),
        node(609, { maxweight: '10' }),
      ] }, route, query);
      expect(parsed.features.map(f => f.kind).sort()).toEqual(['no-entry', 'no-overtaking', 'prohibition', 'prohibition', 'speed-sign']);
    });
  });

  describe('currentLimit matching', () => {
    const route: Route = {
      id: 'limit-route',
      coordinates: [
        { lat: 10.0, lng: 106.0 },
        { lat: 10.01, lng: 106.0 },
      ],
      steps: [],
      distance: 1000,
      duration: 100,
      destination: { id: 'd', name: '', detail: '', lat: 10.01, lng: 106.0 },
      osmEdges: [{ from: 1, to: 2, start: 0, end: 1000 }],
    };

    const roadData = {
      routeId: 'limit-route',
      windowStart: 0,
      windowEnd: 1000,
      fetchedAt: Date.now(),
      source: { kind: 'offline' as const, attribution: '', license: '' },
      sections: [
        {
          id: 's1',
          wayId: 99,
          kmh: 80,
          raw: '80',
          from: { lat: 10.0, lng: 106.0 },
          to: { lat: 10.01, lng: 106.0 },
          start: 0,
          end: 1000,
        },
      ],
      features: [],
    };

    it('returns unknown or warning when conditions are not met', () => {
      expect(currentLimit(null, route, null, 0)).toEqual(UNKNOWN_LIMIT);

      // Inaccurate GPS (> 20m)
      const inaccurateFix: Fix = { lat: 10.005, lng: 106.0, accuracy: 25, speed: 10, heading: 0, timestamp: Date.now() };
      expect(currentLimit(roadData, route, inaccurateFix, 500).kmh).toBeNull();

      // Heading mismatch: traveling North (bearing ~0), but GPS heading is South (180)
      const reversedFix: Fix = { lat: 10.005, lng: 106.0, accuracy: 5, speed: 10, heading: 180, timestamp: Date.now() };
      const res = currentLimit(roadData, route, reversedFix, 500);
      expect(res.kmh).toBeNull();
      expect(res.reason).toContain('khớp');
    });

    it('returns correct speed limit when GPS fix and direction align', () => {
      // Heading North ~0 deg
      const goodFix: Fix = { lat: 10.005, lng: 106.0, accuracy: 5, speed: 10, heading: 0, timestamp: Date.now() };
      const res = currentLimit(roadData, route, goodFix, 500);
      expect(res.kmh).toBe(80);
      expect(res.wayId).toBe(99);
    });
  });
});

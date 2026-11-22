import {describe,it,expect} from 'vitest';
import {fetchRoutes,searchPlaces} from '../../src/services/api';
import type {Place} from '../../src/domain/types';
const testOrigin: Place = { id: 'osm-way-246256692', name: 'Ngõ 37 Phố Bằng Liệt', detail: 'Hà Nội', lat: 20.9631275, lng: 105.8208272 };
const testDestination: Place = { id: 'hanoi-hoan-kiem-area', name: 'Khu vực Hồ Hoàn Kiếm', detail: 'Hà Nội', lat: 21.0283334, lng: 105.854041 };
const testVia = { id: 10688320858, lat: 20.9655796, lng: 105.8416878 };
describe('live routing service',()=>{
  it('does not announce an intermediate playback waypoint as the destination',async()=>{
    const [route]=await fetchRoutes(testOrigin,testDestination,undefined,[testVia]);
    expect(route.steps.filter(step=>step.maneuver==='arrive')).toHaveLength(1);
    expect(route.steps.at(-1)?.maneuver).toBe('arrive');
    expect(route.distance).toBeGreaterThan(5000);
  },40000);
  it('returns an actual route for explicitly entered endpoints',async()=>{
    const [origin]=await searchPlaces('10.77975,106.699');
    const [destination]=await searchPlaces('10.7721,106.6983');
    const routes=await fetchRoutes(origin,destination);
    expect(routes.length).toBeGreaterThan(0);
    const route=routes[0];
    expect(route.distance).toBeGreaterThan(0);expect(route.duration).toBeGreaterThan(0);
    expect(route.steps.at(-1)?.maneuver).toBe('arrive');
    expect(route.osmEdges?.length).toBeGreaterThan(0);
    expect(route.destination).toEqual(destination);
  },40000);
});

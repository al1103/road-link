import {describe,it,expect} from 'vitest';
import {fetchRoutes,searchPlaces} from '../../src/services/api';
import {SIMULATION_ORIGIN,SIMULATION_DESTINATION,SIMULATION_VIA} from '../../src/services/simulationScenario';
describe('live routing service',()=>{
  it('does not announce an intermediate playback waypoint as the destination',async()=>{
    const [route]=await fetchRoutes(SIMULATION_ORIGIN,SIMULATION_DESTINATION,undefined,[SIMULATION_VIA]);
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

import type {Place,Route} from '../domain/types';
import type {RoadData} from '../domain/roadData';
import {fetchRoutes} from './api';
import {fetchOfflineRouteData} from './offlineRoadData';

// Real, explicitly requested endpoints. These are never used as the user's GPS.
export const SIMULATION_ORIGIN:Place={id:'osm-way-246256692',name:'Ngõ 37 Phố Bằng Liệt',detail:'Hoàng Liệt, Hà Nội · điểm đại diện trên ngõ theo OSM',lat:20.9631275,lng:105.8208272};
export const SIMULATION_DESTINATION:Place={id:'hanoi-hoan-kiem-area',name:'Khu vực Hồ Hoàn Kiếm',detail:'Hà Nội · điểm cuối mô phỏng',lat:21.0283334,lng:105.854041};
// Existing OSM STOP node, not an invented sign or a replacement GPS position.
export const SIMULATION_VIA={id:10688320858,lat:20.9655796,lng:105.8416878};
export function warningScore(data:RoadData):number{
  return data.features.reduce((score,f)=>score+(f.onRoute?['traffic-calming','rail-crossing','hazard','stop','give-way'].includes(f.kind)?10:f.kind==='pedestrian-crossing'?3:f.kind==='sign'?2:f.kind==='signals'?.25:1:0),0);
}
export async function prepareSimulationScenario(signal:AbortSignal):Promise<{route:Route;alternatives:Route[];data:RoadData}>{
  const alternatives=await fetchRoutes(SIMULATION_ORIGIN,SIMULATION_DESTINATION,signal,[SIMULATION_VIA]);
  const choices=[];
  for(const route of alternatives){const data=await fetchOfflineRouteData(route,signal);choices.push({route,data,score:warningScore(data)});}
  choices.sort((a,b)=>b.score-a.score||a.route.distance-b.route.distance);
  if(!choices[0])throw new Error('Chưa tìm được tuyến mô phỏng từ nguồn định tuyến.');
  return {...choices[0],alternatives};
}

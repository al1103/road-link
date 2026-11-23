import { bearing, cumulative, distance, pointAt, projectOnRoute } from './geometry';
import type { Coordinate, Fix, OsmRouteEdge, Route } from './types';
export type Tags = Record<string, string>;
export type LimitValue = { kmh: number | null; raw: string; reason?: string };
export type SpeedSection = LimitValue & { id: string; wayId: number; from: Coordinate; to: Coordinate; start: number; end: number; updatedAt?: string };
export type FeatureKind = 'speed-camera' | 'traffic-camera' | 'stop' | 'give-way' | 'speed-sign' | 'signals' | 'no-entry' | 'wrong-way' | 'prohibition' | 'no-overtaking';
export type RoadFeature = Coordinate & { id: string; osmId: number; kind: FeatureKind; label: string; code: string; along: number; onRoute: boolean; distanceFromRoute?:number;updatedAt?: string;userAdded?:boolean };
export type RoadData = { routeId: string; windowStart: number; windowEnd: number; fetchedAt: number; sections: SpeedSection[]; features: RoadFeature[];scope?:'window'|'route';scan?:{completed:number;total:number;complete:boolean};source?:{kind:'offline'|'online';version?:string;attribution:string;license:string;wayCount?:number;nodeCount?:number} };
export type RoadQuery = { query: string; key: string; start: number; end: number; edges: OsmRouteEdge[] };
export type CurrentLimit = { kmh: number | null; reason: string; wayId?: number; raw?: string };
export const UNKNOWN_LIMIT: CurrentLimit = { kmh: null, reason: 'Chưa có dữ liệu phù hợp cho vị trí này.' };
export function parseSpeed(raw: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*(km\/h|kph|mph)?$/i.exec(raw.trim());
  if (!match) return null;
  const value = Number(match[1]) * (match[2]?.toLowerCase() === 'mph' ? 1.609344 : 1);
  return value > 0 && value <= 300 ? Math.floor(value) : null;
}
export function limitForCar(tags: Tags, forward: boolean): LimitValue {
  const direction = forward ? 'forward' : 'backward';
  for (const key of Object.keys(tags)) {
    if (!/^maxspeed(?::(?:forward|backward|motorcar|motor_vehicle|conditional|lanes|variable))(?:[:]|$)/.test(key)) continue;
    if (key.includes(forward ? ':backward' : ':forward')) continue;
    if (key.includes(':conditional') || key.includes(':lanes') || key.includes(':variable')) return { kmh: null, raw: tags[key], reason: 'Có điều kiện, theo làn hoặc thay đổi theo thời điểm; app chưa xác định được mức áp dụng.' };
  }
  const keys = [`maxspeed:motorcar:${direction}`, `maxspeed:motor_vehicle:${direction}`, 'maxspeed:motorcar', 'maxspeed:motor_vehicle', `maxspeed:${direction}`, 'maxspeed'];
  const raw = keys.map(k => tags[k]).find(v => typeof v === 'string') ?? '';
  const kmh = parseSpeed(raw);
  return { kmh, raw, reason: kmh === null ? 'Chưa có mức tốc độ dạng số áp dụng cho ô tô.' : undefined };
}
export function buildRoadQuery(route: Route, along: number): RoadQuery {
  const lengths = cumulative(route.coordinates), total = lengths[lengths.length - 1];
  let start = Math.floor(Math.max(0, along - 300) / 4000) * 4000;
  let end = Math.min(total, start + 6000);
  const allEdges=route.osmEdges??[];
  const index=Math.max(0,allEdges.findIndex(e=>e.end>=along));
  const first=Math.max(0,Math.floor(index/500)*500-80);
  const edges = allEdges.slice(first,first+700).filter(e => e.end >= start && e.start <= end);
  if(edges.length){start=Math.max(start,edges[0].start);end=Math.min(end,edges[edges.length-1].end);}
  const nodes = [...new Set(edges.flatMap(e => [e.from, e.to]))];
  const samples = Math.max(2, Math.min(81, Math.ceil((end - start) / 90) + 1));
  const corridor = Array.from({ length: samples }, (_, i) => {
    const p = pointAt(route.coordinates, lengths, start + (end - start) * i / (samples - 1));
    return `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  }).join(',');
  const roadPart = nodes.length ? `node(id:${nodes.join(',')})->.rn;` : '';
  const ways = nodes.length ? 'way(bn.rn)["highway"][~"^maxspeed"~"."];' : '';
  const query = `[out:json][timeout:18][maxsize:8388608];${roadPart}(${ways}node(around:30,${corridor})["traffic_sign"];node(around:30,${corridor})["highway"~"^(stop|give_way|speed_camera|traffic_signals|toll_gantry|weigh_station)$"];node(around:30,${corridor})["man_made"="surveillance"];node(around:30,${corridor})["barrier"="toll_booth"];node(around:30,${corridor})["amenity"="weighbridge"];node(around:30,${corridor})["maxheight"];node(around:30,${corridor})["maxweight"];);out meta geom;`;
  return { query, key: query, start, end, edges };
}
function object(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object'; }
function coord(v: unknown): v is {lat:number;lon:number} { return object(v) && typeof v.lat === 'number' && Number.isFinite(v.lat) && Math.abs(v.lat) <= 90 && typeof v.lon === 'number' && Number.isFinite(v.lon) && Math.abs(v.lon) <= 180; }
function classify(tags: Tags): {kind: FeatureKind; label: string} | null {
  if (tags.highway === 'speed_camera') return {kind:'speed-camera',label:'Camera tốc độ'};
  if (tags.man_made === 'surveillance') {
    if(tags['surveillance:type']&&tags['surveillance:type']!=='camera') return null;
    return tags['surveillance:zone'] === 'traffic' ? {kind:'traffic-camera',label:'Camera/điểm giám sát giao thông'} : null;
  }
  if (tags.highway === 'traffic_signals') return {kind:'signals',label:'Đèn giao thông'};
  if (tags.barrier === 'toll_booth' || tags.highway === 'toll_gantry') return {kind:'prohibition',label:'Trạm thu phí'};
  if (tags.amenity === 'weighbridge' || tags.highway === 'weigh_station') return {kind:'prohibition',label:'Trạm cân tải trọng'};
  if (tags.maxheight) return {kind:'prohibition',label:`Hạn chế chiều cao ${tags.maxheight}`};
  if (tags.maxweight) return {kind:'prohibition',label:`Hạn chế tải trọng ${tags.maxweight}`};
  const code = tags.traffic_sign ?? '';
  if (tags.highway === 'stop' || /^(?:VN:)?R\.?122(?:$|;)/i.test(code) || /^stop(?:$|:)/i.test(code)) return {kind:'stop',label:'Biển STOP'};
  if (tags.highway === 'give_way' || /^(?:VN:)?W\.?208(?:$|;)/i.test(code) || /give way/i.test(code)) return {kind:'give-way',label:'Biển nhường đường'};
  if (tags.traffic_sign && (tags.maxspeed || tags.traffic_sign === 'maxspeed')) return {kind:'speed-sign',label: parseSpeed(tags.maxspeed ?? '') ? `Biển tốc độ ${tags.maxspeed}` : 'Biển giới hạn tốc độ'};
  const speedCode=/127[\[(](\d+)[\])]/i.exec(code);
  if(speedCode&&parseSpeed(speedCode[1]))return {kind:'speed-sign',label:`Biển giới hạn tốc độ ${speedCode[1]}`};
  const upper = code.toUpperCase();
  if (/P\.?102|VN:102|WRONG WAY/.test(upper)) return {kind:'no-entry',label:'Cấm đi vào / ngược chiều'};
  if (/P\.?103/.test(upper)) return {kind:'wrong-way',label:'Cấm đi ngược chiều'};
  if (/P\.?125|OVERTAKING/.test(upper)) return {kind:'no-overtaking',label:'Cấm vượt'};
  if (/P\.?12[34]/.test(upper)) return {kind:'prohibition',label:'Cấm rẽ/quay đầu'};
  if (/P\.?13[01]/.test(upper)) return {kind:'prohibition',label:'Cấm dừng/đỗ'};
  if (/P\.?10[1-9]|P\.?11[0-3]|MAXHEIGHT|MAXWEIGHT/.test(upper)) return {kind:'prohibition',label:'Biển cấm phương tiện'};
  return null;
}
export function parseRoadData(raw: unknown, route: Route, window: RoadQuery): RoadData {
  if (!object(raw) || !Array.isArray(raw.elements) || raw.remark) throw new Error('Dịch vụ dữ liệu đường trả kết quả lỗi hoặc chưa đầy đủ.');
  const sections: SpeedSection[] = [], features: RoadFeature[] = [];
  const pairs = new Map<string, OsmRouteEdge[]>();
  const routeNodes = new Set<number>();
  for (const edge of window.edges) {
    const key = `${edge.from},${edge.to}`;
    pairs.set(key, [...(pairs.get(key) ?? []), edge]); routeNodes.add(edge.from); routeNodes.add(edge.to);
  }
  const lengths = cumulative(route.coordinates);
  if(raw.elements.length>30000)throw new Error('Khu vực dữ liệu quá dày; chưa hiển thị kết quả không đầy đủ.');
  for (const el of raw.elements) {
    if (!object(el) || !Number.isSafeInteger(el.id) || Number(el.id) <= 0 || !object(el.tags)) continue;
    const tags: Tags = Object.fromEntries(Object.entries(el.tags).filter((entry): entry is [string,string] => typeof entry[1] === 'string'));
    const osmId=Number(el.id);
    const updatedAt = typeof el.timestamp === 'string' ? el.timestamp : undefined;
    if (el.type === 'way' && Array.isArray(el.nodes) && Array.isArray(el.geometry) && el.nodes.length === el.geometry.length) {
      for (let i=0;i<el.nodes.length-1;i++) {
        const a=el.geometry[i],b=el.geometry[i+1]; if(!coord(a)||!coord(b)) continue;
        for (const forward of [true,false]) {
          const edges=pairs.get(forward?`${el.nodes[i]},${el.nodes[i+1]}`:`${el.nodes[i+1]},${el.nodes[i]}`)??[];
          const value=limitForCar(tags,forward);
          for(const edge of edges) sections.push({id:`${el.id}/${i}/${edge.start}`,wayId:Number(el.id),...value,from:forward?{lat:a.lat,lng:a.lon}:{lat:b.lat,lng:b.lon},to:forward?{lat:b.lat,lng:b.lon}:{lat:a.lat,lng:a.lon},start:edge.start,end:edge.end,updatedAt});
        }
      }
    } else if (el.type === 'node' && coord(el)) {
      const kind=classify(tags); if(!kind) continue;
      const point={lat:el.lat,lng:Number(el.lon)};
      const hit=projectOnRoute(point,route.coordinates,lengths,window.start,window.end);
      if(hit.distance>32) continue;
      const rawCode=tags.traffic_sign??'';
      features.push({id:`node/${osmId}`,osmId,...point,...kind,code:rawCode.slice(0,160),along:hit.along,onRoute:routeNodes.has(osmId),distanceFromRoute:hit.distance,updatedAt});
    }
  }
  const deduplicated = [...new Map(features.map(f=>[f.id,f])).values()].sort((a,b)=>a.along-b.along);
  return {routeId:route.id,windowStart:window.start,windowEnd:window.end,fetchedAt:Date.now(),sections,features:deduplicated,scope:'window',source:{kind:'online',attribution:'© OpenStreetMap contributors',license:'ODbL-1.0'}};
}
export function currentLimit(data: RoadData | null, route: Route | null, fix: Fix | null, along: number, offRoute=false): CurrentLimit {
  if(!data||!route||!data.source||data.routeId!==route.id) return UNKNOWN_LIMIT;
  if(!fix||!Number.isFinite(fix.accuracy)||fix.accuracy>20||Date.now()-fix.timestamp>15000||offRoute) return {kmh:null,reason:'GPS chưa đủ chính xác hoặc đang lệch tuyến để xác định đoạn đường.'};
  if(along<data.windowStart-20||along>data.windowEnd+20) return {kmh:null,reason:'Đang chờ dữ liệu cho đoạn đường tiếp theo.'};
  const candidates=data.sections.filter(s=>along>=s.start-15&&along<=s.end+15).map(s=>({s,hit:projectOnRoute(fix,[s.from,s.to])})).filter(c=>c.hit.distance<=15).sort((a,b)=>a.hit.distance-b.hit.distance);
  const best=candidates[0]; if(!best) return UNKNOWN_LIMIT;
  const directionSection=best.s;
  const osmEdge=route.osmEdges?.find(e=>Math.abs(e.start-directionSection.start)<1&&Math.abs(e.end-directionSection.end)<1);
  // Heading cannot resolve travel direction from a stationary or unavailable course.
  // Direction was already proven by the OSRM ordered OSM-node pair; avoid guessing at nearby branches.
  if(candidates.some(c=>c.s.kmh!==best.s.kmh&&c.hit.distance<=best.hit.distance+5)) return {kmh:null,reason:'Gần giao cắt hoặc ranh giới có nhiều mức tốc độ; chưa xác định chắc đoạn áp dụng.'};
  if(!osmEdge) return UNKNOWN_LIMIT;
  if(fix.speed>=2&&fix.headingAvailable===false)return {kmh:null,reason:'Chưa xác định được hướng di chuyển.'};
  if(fix.speed>=2&&Number.isFinite(fix.heading)) {
    const course=bearing(best.s.from,best.s.to);
    if(Math.abs((fix.heading-course+540)%360-180)>55) return {kmh:null,reason:'Hướng di chuyển chưa khớp với chiều tuyến đã tính.'};
  }
  return {kmh:best.s.kmh,raw:best.s.raw,wayId:best.s.wayId,reason:best.s.reason??'Dữ liệu cộng đồng OSM, cần đối chiếu biển báo thực tế.'};
}

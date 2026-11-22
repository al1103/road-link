import { cumulative,pointAt } from '../domain/geometry';
import { buildRoadQuery,parseRoadData,type RoadData,type RoadFeature,type SpeedSection } from '../domain/roadData';
import type { Route } from '../domain/types';
export const PACK_BASE='/data/vn-osm-20261120/';
type Tile={path:string;bytes:number;sha256:string;elements:number};
export type RoadPackManifest={schema:1;country:'VN';version:string;sourceUrl:string;license:string;attribution:string;coverageNotice:string;wayCount:number;nodeCount:number;tiles:Record<string,Tile>};
let manifestPromise:Promise<RoadPackManifest>|null=null;
const tileCache=new Map<string,unknown[]>();
const inFlight=new Map<string,Promise<unknown[]>>();
export function tilesForRoute(route:Route,along:number):string[] {
  const window=buildRoadQuery(route,along),lengths=cumulative(route.coordinates);
  const points=[pointAt(route.coordinates,lengths,window.start),...route.coordinates.filter((_,i)=>lengths[i]>=window.start&&lengths[i]<=window.end),pointAt(route.coordinates,lengths,window.end)];
  const lat=points.map(p=>p.lat),lon=points.map(p=>p.lng),pad=.0004;
  const minLat=Math.floor((Math.min(...lat)-pad)*10),maxLat=Math.floor((Math.max(...lat)+pad)*10);
  const minLon=Math.floor((Math.min(...lon)-pad)*10),maxLon=Math.floor((Math.max(...lon)+pad)*10);
  if((maxLat-minLat+1)*(maxLon-minLon+1)>16)throw new Error('Phạm vi dữ liệu đường quá lớn.');
  const keys=[];for(let x=minLat;x<=maxLat;x++)for(let y=minLon;y<=maxLon;y++)keys.push(`${x}_${y}`);
  return keys;
}
export async function loadRoadManifest():Promise<RoadPackManifest>{
  if(!manifestPromise)manifestPromise=(async()=>{
    const r=await fetch(PACK_BASE+'manifest.json?revision=warnings-v2',{cache:'no-cache'});if(!r.ok)throw new Error('Chưa có gói dữ liệu đường Việt Nam trên thiết bị.');
    const raw=await r.text();if(raw.length>2_000_000)throw new Error('Manifest dữ liệu quá lớn.');
    const m=JSON.parse(raw);if(m.schema!==1||m.country!=='VN'||typeof m.tiles!=='object'||!m.tiles||typeof m.version!=='string')throw new Error('Gói dữ liệu Việt Nam không hợp lệ.');
    return m as RoadPackManifest;
  })().catch(e=>{manifestPromise=null;throw e;});
  return manifestPromise;
}
async function loadTile(key:string,tile:Tile):Promise<unknown[]>{
  const cached=tileCache.get(key);if(cached)return cached;
  const existing=inFlight.get(key);if(existing)return existing;
  const task=(async()=>{
    if(!/^\d{1,4}_\d{1,4}$/.test(key)||tile.path!==`tiles/${key}.json`||tile.bytes>12_000_000||!/^[a-f0-9]{64}$/.test(tile.sha256))throw new Error('Chỉ mục dữ liệu không hợp lệ.');
    const r=await fetch(PACK_BASE+tile.path+'?sha256='+tile.sha256);if(!r.ok)throw new Error('Thiếu phần dữ liệu đường đã đóng gói.');
    const bytes=await r.arrayBuffer();if(bytes.byteLength!==tile.bytes)throw new Error('Phần dữ liệu đường chưa tải đủ.');
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const hex=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
    if(hex!==tile.sha256)throw new Error('Kiểm tra toàn vẹn dữ liệu đường thất bại.');
    const data=JSON.parse(new TextDecoder().decode(bytes));if(!Array.isArray(data.elements)||data.elements.length!==tile.elements)throw new Error('Dữ liệu đường sai cấu trúc.');
    if(tileCache.size>=16)tileCache.delete(tileCache.keys().next().value!);tileCache.set(key,data.elements);return data.elements;
  })();
  inFlight.set(key,task);try{return await task;}finally{inFlight.delete(key);}
}
export async function fetchOfflineRoadData(route:Route,along:number,signal:AbortSignal):Promise<RoadData>{
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const m=await loadRoadManifest();if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const keys=tilesForRoute(route,along).filter(key=>m.tiles[key]);
  const chunks=await Promise.all(keys.map(key=>loadTile(key,m.tiles[key])));
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const objects=new Map<string,unknown>();
  for(const chunk of chunks)for(const obj of chunk){const el=obj as {type?:string;id?:number};if(el&&['way','node'].includes(el.type??'')&&Number.isSafeInteger(el.id))objects.set(`${el.type}/${el.id}`,el);}
  const result=parseRoadData({elements:[...objects.values()]},route,buildRoadQuery(route,along));
  return {...result,source:{kind:'offline',version:m.version,attribution:m.attribution,license:m.license,wayCount:m.wayCount,nodeCount:m.nodeCount}};
}

/** Cover both distance pages and dense OSM-node pages, including the destination. */
export function routeScanRequests(route:Route):number[] {
  const total=cumulative(route.coordinates).at(-1)??0;
  const triggers=[0,total];
  for(let along=4300.01;along<total;along+=4000)triggers.push(along);
  for(let i=500;i<(route.osmEdges?.length??0);i+=500)triggers.push(route.osmEdges![i].start+.01);
  return [...new Set(triggers.sort((a,b)=>a-b).map(along=>{
    const page=Math.floor(Math.max(0,along-300)/4000);
    const edgePage=Math.floor(Math.max(0,route.osmEdges?.findIndex(e=>e.end>=along)??0)/500);
    return Math.max(page*4000+300,route.osmEdges?.[edgePage*500]?.start??0);
  }))];
}

/** Scan the bundled source only; never issue a full-route batch to public Overpass. */
export async function fetchOfflineRouteData(route:Route,signal:AbortSignal,onProgress?:(data:RoadData)=>void):Promise<RoadData> {
  const requests=routeScanRequests(route),total=cumulative(route.coordinates).at(-1)??0;
  const features=new Map<string,RoadFeature>(),sections=new Map<string,SpeedSection>();
  const ranges:Array<{start:number;end:number}>=[];
  let snapshot:RoadData|null=null,lastPublished=0;
  for(let i=0;i<requests.length;i++){
    if(signal.aborted)throw new DOMException('Aborted','AbortError');
    const part=await fetchOfflineRoadData(route,requests[i],signal);
    ranges.push({start:part.windowStart,end:part.windowEnd});
    for(const feature of part.features){const previous=features.get(feature.id);if(!previous||feature.along<previous.along)features.set(feature.id,feature);}
    for(const section of part.sections)sections.set(section.id,section);
    const complete=i===requests.length-1;
    if(complete){
      let covered=0;
      for(const range of ranges.sort((a,b)=>a.start-b.start)){if(range.start>covered+1)throw new Error('Chưa quét đủ toàn tuyến. Một phần dữ liệu chưa được kiểm tra.');covered=Math.max(covered,range.end);}
      if(covered<total-1)throw new Error('Chưa quét tới cuối tuyến. Vui lòng thử tải lại dữ liệu.');
    }
    if(complete||!snapshot||Date.now()-lastPublished>=200){
      snapshot={...part,scope:'route',windowStart:0,windowEnd:total,sections:[...sections.values()].sort((a,b)=>a.start-b.start),features:[...features.values()].sort((a,b)=>a.along-b.along),scan:{completed:i+1,total:requests.length,complete}};
      onProgress?.(snapshot);lastPublished=Date.now();
    }
    if(!complete)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  if(!snapshot)throw new Error('Chưa đọc được dữ liệu toàn tuyến.');
  return snapshot;
}

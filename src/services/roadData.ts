import { buildRoadQuery, parseRoadData, type RoadData } from '../domain/roadData';
import type { Route } from '../domain/types';
const OVERPASS=import.meta.env.VITE_OVERPASS_URL||(import.meta.env.DEV?'/api/interpreter':'https://overpass-api.de/api/interpreter');
const OVERPASS_FR=import.meta.env.VITE_OVERPASS_FR_URL||(import.meta.env.DEV?'/api/overpass-fr':'https://overpass.openstreetmap.fr/api/interpreter');
const HOSTS=[{name:'primary',url:OVERPASS,timeout:14000},{name:'fr-mirror',url:OVERPASS_FR,timeout:24000}];
const cache=new Map<string,{time:number;data:RoadData}>();
let lastRequest=0;
let queue:Promise<unknown>=Promise.resolve();
async function fetchFromHost(url:string,query:string,timeoutMs:number,signal:AbortSignal):Promise<string> {
  const controller=new AbortController(); const onAbort=()=>controller.abort();
  signal.addEventListener('abort',onAbort,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetch(url,{method:'POST',body:new URLSearchParams({data:query}),signal:controller.signal});
    if(!response.ok) throw new Error(response.status===429?'Nguồn dữ liệu đang giới hạn lượt truy cập. Chờ ít nhất 30 giây rồi thử lại.':'Chưa tải được dữ liệu đường. Bản đồ và dẫn đường vẫn hoạt động.');
    const text=await response.text(); if(text.length>3_000_000) throw new Error('Dữ liệu khu vực quá lớn. Chưa hiển thị để tránh kết quả không đầy đủ.');
    return text;
  } finally { clearTimeout(timer);signal.removeEventListener('abort',onAbort); }
}
async function fetchFromAnyHost(query:string,signal:AbortSignal):Promise<string> {
  let lastError:unknown=null;
  for(const host of HOSTS) {
    try { return await fetchFromHost(host.url,query,host.timeout,signal); }
    catch(error) {
      if(signal.aborted) throw error;
      if(import.meta.env.DEV) console.warn(`[overpass] road-data host "${host.name}" (${host.url}) failed:`,error);
      lastError=error;
    }
  }
  throw lastError??new Error('Chưa tải được dữ liệu đường. Bản đồ và dẫn đường vẫn hoạt động.');
}
export async function fetchRoadData(route: Route, along: number, signal: AbortSignal): Promise<RoadData> {
  const window=buildRoadQuery(route,along);
  const hit=cache.get(window.key);
  if(hit&&Date.now()-hit.time<5*60*1000) return {...hit.data,routeId:route.id};
  const request=queue.then(async()=>{
    const delay=Math.max(0,30000-(Date.now()-lastRequest));
    if(delay) await new Promise<void>((resolve,reject)=>{
      const onAbort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
      const timer=setTimeout(()=>{signal.removeEventListener('abort',onAbort);resolve();},delay);
      signal.addEventListener('abort',onAbort,{once:true});
      if(signal.aborted) onAbort();
    });
    if(signal.aborted) throw new DOMException('Aborted','AbortError');
    lastRequest=Date.now();
    const text=await fetchFromAnyHost(window.query,signal);
    const data=parseRoadData(JSON.parse(text),route,window);
    if(cache.size>=8) cache.delete(cache.keys().next().value!);
    cache.set(window.key,{time:Date.now(),data}); return data;
  });
  queue=request.catch(()=>undefined);return request;
}

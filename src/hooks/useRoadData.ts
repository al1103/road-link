import { useEffect, useState } from 'react';
import type { Route } from '../domain/types';
import type { RoadData } from '../domain/roadData';
import { fetchRoadData } from '../services/roadData';
import {fetchOfflineRoadData,fetchOfflineRouteData} from '../services/offlineRoadData';
export function useRoadData(route:Route|null,along:number) {
  const [data,setData]=useState<RoadData|null>(null),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(false),[retryKey,retry]=useState(0);
  const [overview,setOverview]=useState<RoadData|null>(null),[overviewLoading,setOverviewLoading]=useState(false),[overviewError,setOverviewError]=useState<string|null>(null);
  const window=Math.floor(Math.max(0,along-300)/4000);
  const edgePage=Math.floor(Math.max(0,route?.osmEdges?.findIndex(e=>e.end>=along)??0)/500);
  const requestAlong=Math.max(window*4000+300,route?.osmEdges?.[edgePage*500]?.start??0);
  useEffect(()=>{
    setOverview(null);setOverviewError(null);
    if(!route){setOverviewLoading(false);return;}
    const controller=new AbortController();setOverviewLoading(true);
    void fetchOfflineRouteData(route,controller.signal,value=>{if(!controller.signal.aborted)setOverview(value);}).then(value=>{
      if(!controller.signal.aborted)setOverview(value);
    }).catch(e=>{
      if(!controller.signal.aborted)setOverviewError(e instanceof Error?e.message:'Chưa tải đủ dữ liệu toàn tuyến.');
    }).finally(()=>{if(!controller.signal.aborted)setOverviewLoading(false);});
    return()=>controller.abort();
  },[route,retryKey]);
  useEffect(()=>{
    if(!route) {setLoading(false);setError(null);return;}
    const controller=new AbortController();setLoading(true);setError(null);
    const load=async()=>{
      try{return await fetchOfflineRoadData(route,requestAlong,controller.signal);}
      catch(e){if(controller.signal.aborted)throw e;return fetchRoadData(route,requestAlong,controller.signal);}
    };
    void load().then(value=>{if(!controller.signal.aborted)setData(value);}).catch(e=>{
      if(!controller.signal.aborted)setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Dịch vụ dữ liệu đường phản hồi chậm. Bạn vẫn tiếp tục dẫn đường được.');
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[route,window,edgePage,retryKey]);
  return {enabled:true,data:data?.routeId===route?.id?data:null,overview:overview?.routeId===route?.id?overview:null,overviewLoading,overviewError,error,loading,retry:()=>retry(k=>k+1)};
}

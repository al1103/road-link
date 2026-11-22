import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Explicit route endpoints from live Nominatim results; never supplied as device GPS.
const origins=[
  {id:'osm-relation-19541848',name:'Xã Tiền Hải',detail:'Nominatim relation 19541848',lat:20.4057073,lng:106.5031738},
  {id:'osm-relation-7128372',name:'Huyện Tiền Hải',detail:'Nominatim historic relation 7128372',lat:20.3768181,lng:106.5223945}
];
const destination={id:'osm-relation-1903516',name:'Thành phố Hà Nội',detail:'Nominatim relation 1903516',lat:21.0283334,lng:105.854041};
const browser=await chromium.launch();
try {
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});
  const reports=[];
  for(const origin of origins){
    console.log(`Checking live route: ${origin.name} → ${destination.name}`);
    const result=await page.evaluate(async({origin,destination})=>{
      const {fetchRoutes}=await import('/src/services/api.ts');
      const {fetchOfflineRoadData,tilesForRoute}=await import('/src/services/offlineRoadData.ts');
      const {buildRoadQuery}=await import('/src/domain/roadData.ts');
      const {cumulative}=await import('/src/domain/geometry.ts');
      const routes=await fetchRoutes(origin,destination),route=routes[0];
      const total=cumulative(route.coordinates).at(-1);
      const triggers=[0,total];
      for(let m=4300.01;m<total;m+=4000)triggers.push(m);
      for(let i=500;i<(route.osmEdges?.length??0);i+=500)triggers.push(route.osmEdges[i].start+.01);
      triggers.sort((a,b)=>a-b);
      const features=new Map(),ways=new Set(),seen=new Set(),windows=[];
      for(const along of triggers){
        const band=Math.floor(Math.max(0,along-300)/4000);
        const edgePage=Math.floor(Math.max(0,route.osmEdges?.findIndex(e=>e.end>=along)??0)/500);
        const requestAlong=Math.max(band*4000+300,route.osmEdges?.[edgePage*500]?.start??0);
        const query=buildRoadQuery(route,requestAlong);
        const key=`${query.start}:${query.end}:${query.edges[0]?.from}:${query.edges.at(-1)?.to}`;
        if(seen.has(key))continue;seen.add(key);
        const data=await fetchOfflineRoadData(route,requestAlong,new AbortController().signal);
        for(const feature of data.features)features.set(feature.id,feature);
        for(const section of data.sections)ways.add(section.wayId);
        windows.push({triggerAlong:along,requestAlong,start:data.windowStart,end:data.windowEnd,tiles:tilesForRoute(route,requestAlong),points:data.features.length,kinds:Object.fromEntries([...new Set(data.features.map(f=>f.kind))].map(kind=>[kind,data.features.filter(f=>f.kind===kind).length])),speedWays:new Set(data.sections.map(s=>s.wayId)).size,sectionCount:data.sections.length});
      }
      const points=[...features.values()].sort((a,b)=>a.along-b.along);
      let covered=0;const gaps=[];
      for(const w of [...windows].sort((a,b)=>a.start-b.start)){if(w.start>covered+1)gaps.push({from:covered,to:w.start});covered=Math.max(covered,w.end);}
      if(covered<total-1)gaps.push({from:covered,to:total});
      return {origin,destination,router:'OSRM public live service',distance:route.distance,duration:route.duration,summary:route.summary,routeGeometryMeters:total,osmEdges:route.osmEdges?.length??0,alternatives:routes.length,preview:windows[0],windowCount:windows.length,totalUniquePoints:points.length,pointKinds:Object.fromEntries([...new Set(points.map(f=>f.kind))].map(kind=>[kind,points.filter(f=>f.kind===kind).length])),speedWays:ways.size,firstPoint:points[0]??null,lastPoint:points.at(-1)??null,pointsByTenKm:Array.from({length:Math.ceil(total/10000)},(_,i)=>({from:i*10000,to:Math.min(total,(i+1)*10000),points:points.filter(f=>f.along>=i*10000&&f.along<(i+1)*10000).length})),coverageGaps:gaps,windows,points};
    },{origin,destination});
    reports.push(result);
    console.log(JSON.stringify({origin:result.origin.name,distanceKm:result.distance/1000,previewPoints:result.preview.points,previewRange:[result.preview.start,result.preview.end],totalPoints:result.totalUniquePoints,kinds:result.pointKinds,firstPoint:result.firstPoint,gaps:result.coverageGaps}));
  }
  const report={checkedAt:new Date().toISOString(),network:'live OSRM; packaged OSM/Geofabrik 20261120; no device location supplied',endpointAssumption:'Two live Nominatim matches for Tiền Hải, to the returned Hanoi centre. Exact user addresses and chosen alternative are not known.',geocoderLookups:['Tien Hai','Ha Noi, Vietnam'],reports};
  await writeFile('docs/TIEN_HAI_HA_NOI_AUDIT.json',JSON.stringify(report,null,2)+'\n');
} finally {await browser.close();}

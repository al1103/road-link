import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
  const report=await page.evaluate(async()=>{
    const {prepareSimulationScenario,SIMULATION_ORIGIN,SIMULATION_DESTINATION}=await import('/src/services/simulationScenario.ts');
    const {route,alternatives,data}=await prepareSimulationScenario(new AbortController().signal);
    const kinds=Object.fromEntries([...new Set(data.features.map(f=>f.kind))].map(kind=>[kind,data.features.filter(f=>f.kind===kind).length]));
    return {checkedAt:new Date().toISOString(),origin:SIMULATION_ORIGIN,destination:SIMULATION_DESTINATION,routeMeters:route.distance,routeSeconds:route.duration,summary:route.summary,alternatives:alternatives.length,source:data.source,scan:data.scan,points:data.features.length,kinds,onRouteWarnings:data.features.filter(f=>f.onRoute&&!['signals','camera'].includes(f.kind)).length,examples:data.features.filter(f=>f.onRoute&&!['signals','camera'].includes(f.kind)).slice(0,15),simulation:'Vehicle movement only; route and road objects come from live OSRM and the verified OSM pack.'};
  });
  await writeFile('docs/BANG_LIET_SIMULATION_REPORT.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}

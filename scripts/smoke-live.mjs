// Opt-in smoke test with public, non-personal HCMC coordinates. Does not run in unit tests.
const endpoints = [
  ['OSRM', 'https://router.project-osrm.org/route/v1/driving/106.699,10.77975;106.6983,10.7721?overview=full&geometries=geojson&steps=true'],
  ['Nominatim', 'https://nominatim.openstreetmap.org/search?q=Ben%20Thanh%20Market%20Ho%20Chi%20Minh&format=jsonv2&limit=1'],
  ['OpenFreeMap style', 'https://tiles.openfreemap.org/styles/positron']
];
let failures=0;
for(const [name,url] of endpoints) {
  try {
    const response=await fetch(url,{headers:{'User-Agent':'RoadLink/0.1 (local development smoke test)'},signal:AbortSignal.timeout(25000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    if(name==='OSRM') { const data=await response.json(); if(data.code!=='Ok'||!data.routes?.[0]?.legs?.[0]?.steps?.length) throw new Error('invalid route'); console.log(`PASS ${name}: ${data.routes[0].distance} m, ${data.routes[0].legs[0].steps.length} steps`); }
    else if(name==='Nominatim') { const data=await response.json(); if(!data.length) throw new Error('no result');console.log(`PASS ${name}: ${data.length} result`); }
    else {const style=await response.json();if(!style.sources?.openmaptiles)throw new Error('missing vector basemap source');console.log(`PASS ${name}: vector style and OpenMapTiles source available`);}
  } catch(error) { failures++;console.error(`FAIL ${name}: ${error.message}`); }
  await new Promise(resolve=>setTimeout(resolve,1200));
}
process.exitCode=failures?1:0;

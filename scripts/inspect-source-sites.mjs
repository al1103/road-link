import {writeFile,mkdir} from 'node:fs/promises';
const targets=[
  ['traffic-hcm','https://giaothong.hochiminhcity.gov.vn/'],
  ['vietmap','https://vietmap.vn/'],
  ['navbridge-readme','https://raw.githubusercontent.com/DangLamTung/navbridge/main/README.md'],
  ['navbridge-camera-builder','https://raw.githubusercontent.com/DangLamTung/navbridge/main/tool/fetch_overpass_cameras.py'],
  ['speedalert-license','https://raw.githubusercontent.com/hvdwolf/SpeedAlert_Databases/main/LICENSE'],
  ['speedalert-readme','https://raw.githubusercontent.com/hvdwolf/SpeedAlert/main/README.md'],
];
await mkdir('.tools/source-audit',{recursive:true});
for(const [name,url] of targets){try{const response=await fetch(url,{headers:{'User-Agent':'RoadLink/0.1 source audit'},signal:AbortSignal.timeout(18000)});const text=await response.text();await writeFile(`.tools/source-audit/${name}.txt`,text);if(name==='traffic-hcm'){console.log(JSON.stringify({name,status:response.status,scripts:[...text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>new URL(m[1],url).href).slice(0,50)}));}else console.log(JSON.stringify({name,status:response.status,findings:text.split('\n').filter(l=>/licen|waze|camera|offline|database|source|truck|enterprise|car/gi.test(l)).slice(0,18).map(l=>l.slice(0,500))}));}catch(e){console.log(JSON.stringify({name,error:e.message}));}}

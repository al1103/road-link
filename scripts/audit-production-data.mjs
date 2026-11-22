import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root=process.cwd();
async function walk(dir) {
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const item=path.join(dir,entry.name);
    if(entry.isDirectory())files.push(...await walk(item));else files.push(item);
  }
  return files;
}
const banned=['demo-hcm','demo-camera','demo-stop','fixture-hcm','fixture-camera','fixture-stop','Đường mẫu A','Đường thử B','Camera tốc độ mô phỏng','startDemo','demoFix','routeScenario','Địa điểm kiểm thử'];
const sourceFiles=(await walk(path.join(root,'src'))).filter(f=>/\.[jt]sx?$/.test(f));
const projectCode=[...sourceFiles,...await walk(path.join(root,'tests')),...await walk(path.join(root,'scripts'))].filter(f=>/\.[mc]?[jt]sx?$/.test(f)&&path.basename(f)!=='audit-production-data.mjs');
const replacements=/\bvi\.(?:mock|stubGlobal|fn|spyOn)|\.(?:mockResolvedValue|mockRejectedValue|mockImplementation|setGeolocation)\b|\bgeolocation\s*:\s*\{|\.route\([^\n]*(?:fulfill|abort)\b|\baddInitScript\b/;
for(const file of projectCode){if(replacements.test(await readFile(file,'utf8')))throw new Error('Replaced API or supplied device data in project: '+file);}
if((await readdir(path.join(root,'tests','fixtures')).catch(()=>[])).length)throw new Error('Test fixture directory is not empty');
for(const file of sourceFiles) {
  const source=await readFile(file,'utf8');
  if(/(?:from\s*|import\s*\()\s*['"][^'"]*(?:tests\/|fixtures\/)/.test(source))throw new Error('Test data imported into app: '+file);
  for(const word of banned)if(source.includes(word))throw new Error('Test/simulation code in app: '+file+' / '+word);
}
const bundles=['dist','ios/App/App/public'];
const sourceManifestBytes=await readFile(path.join(root,'public/data/vn-osm-20261120/manifest.json'));
const sourceManifestHash=createHash('sha256').update(sourceManifestBytes).digest('hex');
const checked=[];
for(const bundle of bundles) {
  const base=path.join(root,bundle),manifestPath=path.join(base,'data/vn-osm-20261120/manifest.json');
  const manifestBytes=await readFile(manifestPath);
  if(createHash('sha256').update(manifestBytes).digest('hex')!==sourceManifestHash)throw new Error('Bundle does not contain the current public source manifest: '+bundle);
  const manifest=JSON.parse(manifestBytes.toString('utf8'));
  const files=(await walk(base)).filter(f=>/\.(?:js|json|html)$/.test(f));
  for(const file of files) {
    const content=await readFile(file,'utf8');
    for(const word of banned)if(content.includes(word))throw new Error('Test/simulation data bundled: '+file+' / '+word);
    if(/(?:^|[\\/])(?:tests|fixtures)(?:[\\/]|$)/.test(path.relative(base,file)))throw new Error('Test file packaged: '+file);
  }
  for(const tile of Object.values(manifest.tiles)) {
    const bytes=await readFile(path.join(base,'data/vn-osm-20261120',tile.path));
    if(bytes.length!==tile.bytes||createHash('sha256').update(bytes).digest('hex')!==tile.sha256)throw new Error('Bundled shard differs from source manifest: '+tile.path);
  }
  checked.push({bundle,filesScanned:files.length,version:manifest.version,nodeCount:manifest.nodeCount,currentSourceManifestMatched:true,verifiedShards:Object.keys(manifest.tiles).length});
}
const report={checkedAt:new Date().toISOString(),simulationMode:'Explicit vehicle-movement playback requested by the user; native GPS and BLE are not fed simulated positions.',syntheticRoadObjectsBundled:false,sourceFilesChecked:sourceFiles.length,projectCodeFilesChecked:projectCode.length,bundles:checked,replacedServiceAPIs:0,suppliedDevicePositions:0,testFixtures:0,tests:'Pure calculations, actual packaged OSM data and live service/browser checks.',fieldAccuracyVerified:false};
await writeFile('docs/NO_DEMO_AUDIT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

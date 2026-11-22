import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='public/data/vn-osm-20261120/';
const m=JSON.parse(await readFile(base+'manifest.json','utf8'));
const ways=new Map(),nodes=new Map();let bytes=0;
for(const [key,tile] of Object.entries(m.tiles)){
  if(tile.path!==`tiles/${key}.json`)throw new Error('Unsafe tile path');
  const data=await readFile(base+tile.path);bytes+=data.length;
  if(data.length!==tile.bytes||createHash('sha256').update(data).digest('hex')!==tile.sha256)throw new Error('Tile digest/size failed '+key);
  const json=JSON.parse(data.toString('utf8'));if(json.elements.length!==tile.elements)throw new Error('Tile count failed '+key);
  for(const e of json.elements){
    if(!Number.isSafeInteger(e.id)||e.id<=0||!e.tags||e.demo)throw new Error('Invalid source object');
    if(e.type==='way'){
      if(!e.nodes?.length||e.nodes.length!==e.geometry?.length||!Object.keys(e.tags).some(k=>k.startsWith('maxspeed')))throw new Error('Invalid speed way');
      ways.set(e.id,e);
    }else if(e.type==='node')nodes.set(e.id,e);else throw new Error('Invalid object type');
  }
}
if(ways.size!==m.wayCount||nodes.size!==m.nodeCount)throw new Error('Manifest totals differ from unique source objects');
const all=[...ways.values()];
const report={verifiedAt:new Date().toISOString(),source:m.sourceUrl,sourceSha256:m.sourceSha256,license:m.license,version:m.version,allShardHashesVerified:true,tiles:Object.keys(m.tiles).length,shardBytes:bytes,uniqueSpeedWays:ways.size,uniquePointObjects:nodes.size,nodeKinds:m.nodeKinds,
  tagCoverage:{baseMaxspeed:all.filter(e=>'maxspeed'in e.tags).length,directional:all.filter(e=>Object.keys(e.tags).some(k=>/forward|backward/.test(k))).length,conditional:all.filter(e=>Object.keys(e.tags).some(k=>k.includes('conditional'))).length,lanes:all.filter(e=>Object.keys(e.tags).some(k=>k.includes('lanes'))).length},notVerified:'Field accuracy, complete nationwide camera coverage, current physical signs and active enforcement have not been verified.'};
await writeFile('docs/OFFLINE_PACK_REPORT.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

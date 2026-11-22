import {readFile,writeFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile('docs/ROAD_DATA_SOURCES.json','utf8'));
let next=0;const results=[];
async function worker(){
  while(next<catalog.sources.length){const source=catalog.sources[next++];try{
    const r=await fetch(source.url,{headers:{'User-Agent':'RoadLink/0.1 public-documentation audit'},signal:AbortSignal.timeout(18000)});
    const reader=r.body?.getReader();let body='',bytes=0;
    if(reader){const decoder=new TextDecoder();while(bytes<90000){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;body+=decoder.decode(part.value,{stream:true});}await reader.cancel().catch(()=>{});}
    const title=body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim();
    results.push({id:source.id,url:source.url,status:r.status,finalUrl:r.url,title:title?.slice(0,200),challenge:/just a moment|verify you are|enable javascript and cookies|attention required/i.test(title??'')});
  }catch(e){results.push({id:source.id,url:source.url,error:e.message});}}
}
await Promise.allSettled(Array.from({length:4},worker));
results.sort((a,b)=>a.id.localeCompare(b.id));
await writeFile('docs/SOURCE_LINK_CHECK.json',JSON.stringify({checkedAt:'2026-11-21',results},null,2)+'\n');
console.log(JSON.stringify({checked:results.length,non200:results.filter(r=>r.status!==200),challenges:results.filter(r=>r.challenge)}));

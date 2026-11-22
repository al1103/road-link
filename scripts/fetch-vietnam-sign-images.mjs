import {mkdir,writeFile} from 'node:fs/promises';
const out='public/signs';await mkdir(out,{recursive:true});
const files=[
  ['stop.svg','Vietnam road sign P122.svg'],
  ['give-way.svg','Vietnam road sign W208.svg'],
  ...[5,20,30,40,50,60,70,80,90,100,110,120].map(n=>[`speed-${n}.svg`,`Vietnam road sign P127-${n}.svg`]),
];
const params=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata',redirects:'1',titles:files.map(f=>'File:'+f[1]).join('|')});
const headers={'User-Agent':'RoadLink/0.1 (Vietnam traffic-sign image attribution audit)'};
const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{headers,signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error('Wikimedia metadata HTTP '+response.status);
const json=await response.json();const pages=Object.values(json.query?.pages??{});
const entries=[];
for(const [local,title] of files){
  const page=pages.find(p=>p.title==='File:'+title),info=page?.imageinfo?.[0];
  if(!info)throw new Error('Missing sign asset '+title);
  const license=info.extmetadata?.LicenseShortName?.value??'';
  if(!/CC BY|CC0|Public domain/i.test(license))throw new Error('Unrecognized image license '+title+': '+license);
  const r=await fetch(info.url,{headers,signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('Image HTTP '+r.status);
  const svg=await r.text();if(svg.length>250000||!svg.includes('<svg')||/<script|<foreignObject|<!ENTITY|(?:href|src)\s*=\s*["'](?:https?:|javascript:)/i.test(svg))throw new Error('Unexpected active/external SVG '+title);
  await writeFile(`${out}/${local}`,svg);
  entries.push({file:local,title,source:info.descriptionurl,imageUrl:info.url,license,licenseUrl:info.extmetadata?.LicenseUrl?.value,author:(info.extmetadata?.Artist?.value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),kind:'standard-sign-diagram-not-street-photo'});
  await new Promise(resolve=>setTimeout(resolve,200));
}
await writeFile(out+'/attribution.json',JSON.stringify({downloadedAt:'2026-11-21',images:entries},null,2)+'\n');
console.log(JSON.stringify({downloaded:entries.length,licenses:[...new Set(entries.map(e=>e.license))]}));

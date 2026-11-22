import type {RoadFeature} from './roadData';
const speeds=new Set([5,20,30,40,50,60,70,80,90,100,110,120]);
export function speedSignImage(kmh:number|null):string|null{return kmh!==null&&speeds.has(kmh)?`/signs/speed-${kmh}.svg`:null;}
export function roadSymbol(feature:Pick<RoadFeature,'kind'|'code'>):{src:string;standard:boolean}{
  if(feature.kind.includes('camera'))return {src:'/signs/camera.svg',standard:false};
  if(feature.kind==='stop'||/^VN:R\.?122(?:$|;)/i.test(feature.code))return {src:'/signs/stop.svg',standard:true};
  if(feature.kind==='give-way'||/^VN:W\.?208(?:$|;)/i.test(feature.code))return {src:'/signs/give-way.svg',standard:true};
  if(feature.kind==='signals')return {src:'/signs/traffic-signals.svg',standard:false};
  if(feature.kind==='rail-crossing')return {src:'/signs/warning-rail.svg',standard:false};
  if(feature.kind==='pedestrian-crossing')return {src:'/signs/warning-pedestrian.svg',standard:false};
  if(feature.kind==='traffic-calming')return {src:/=(hump|bump|table|cushion|rumble_strip)$/.test(feature.code)?'/signs/warning-hump.svg':'/signs/warning-general.svg',standard:false};
  if(feature.kind==='hazard')return {src:/=(school|children)$/.test(feature.code)?'/signs/warning-school.svg':/=(curve|dangerous_bend|bends)$/.test(feature.code)?'/signs/warning-bend.svg':/=slippery$/.test(feature.code)?'/signs/warning-slippery.svg':/=narrow_road$/.test(feature.code)?'/signs/warning-narrow.svg':'/signs/warning-general.svg',standard:false};
  const speed=/^VN:P\.?127\((\d+)\)(?:$|;)/i.exec(feature.code);const image=speedSignImage(speed?Number(speed[1]):null);
  return image?{src:image,standard:true}:{src:'/signs/unknown.svg',standard:false};
}

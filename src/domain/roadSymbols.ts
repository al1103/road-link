import type {RoadFeature} from './roadData';
const speeds=new Set([5,20,30,40,50,60,70,80,90,100,110,120]);
export function speedSignImage(kmh:number|null):string|null{return kmh!==null&&speeds.has(kmh)?`/signs/speed-${kmh}.svg`:null;}
export function roadSymbol(feature:Pick<RoadFeature,'kind'|'code'>):{src:string;standard:boolean}{
  if(feature.kind.includes('camera'))return {src:'/signs/camera.svg',standard:false};
  if(feature.kind==='stop'||/^(?:VN:)?R\.?122(?:$|;)/i.test(feature.code))return {src:'/signs/stop.svg',standard:true};
  if(feature.kind==='give-way'||/^(?:VN:)?W\.?208(?:$|;)/i.test(feature.code)||/give way/i.test(feature.code))return {src:'/signs/give-way.svg',standard:true};
  if(feature.kind==='signals')return {src:'/signs/traffic-signals.svg',standard:false};
  if(feature.kind==='no-entry')return {src:'/signs/no-entry.svg',standard:true};
  if(feature.kind==='wrong-way')return {src:'/signs/wrong-way.svg',standard:true};
  if(feature.kind==='no-overtaking')return {src:'/signs/no-overtaking.svg',standard:true};
  if(feature.kind==='prohibition')return {src:'/signs/prohibition.svg',standard:true};
  const speed=/127[\[(](\d+)[\])]/i.exec(feature.code);const image=speedSignImage(speed?Number(speed[1]):null);
  return image?{src:image,standard:true}:{src:'/signs/unknown.svg',standard:false};
}

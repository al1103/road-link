import type { CurrentLimit,FeatureKind,RoadData,RoadFeature } from './roadData';
import type { Fix,Progress,Route } from './types';
export type RoadAlert={id:string;kind:'camera'|'sign'|'limit'|'overspeed';title:string;text:string;speech:string;source:'osm';expiresAt:number;feature?:RoadFeature};
export class RoadAlertEngine {
  private routeId='';private seen=new Set<string>();private lastFix=0;private lastAlert=0;
  private speed:number|null=null;private stableSpeed:number|null=null;private speedCount=0;private overCount=0;private lastOverspeed=0;
  update(route:Route,data:RoadData|null,fix:Fix,progress:Progress,limit:CurrentLimit,now=Date.now()):RoadAlert|null {
    if(route.id!==this.routeId){this.routeId=route.id;this.seen.clear();this.lastFix=0;this.lastAlert=0;this.speed=null;this.speedCount=0;this.overCount=0;this.stableSpeed=null;}
    if(!data||!data.source||data.routeId!==route.id||fix.timestamp<=this.lastFix||fix.accuracy>20||now-fix.timestamp>15000||progress.offRoute||progress.arrived)return null;
    this.lastFix=fix.timestamp;
    if(limit.kmh!==null&&limit.kmh===this.stableSpeed)this.speedCount++;else{this.stableSpeed=limit.kmh;this.speedCount=1;}
    const over=limit.kmh!==null&&fix.accuracy<=15&&fix.speed*3.6>limit.kmh+5;
    this.overCount=over?this.overCount+1:0;
    if(now-this.lastAlert<6500)return null;
    const source='osm';const prefix='Theo dữ liệu bản đồ. ';
    const make=(id:string,kind:RoadAlert['kind'],title:string,text:string,feature?:RoadFeature):RoadAlert=>{this.seen.add(id);this.lastAlert=now;return{id,kind,title,text,speech:prefix+text,source,expiresAt:now+9000,feature};};
    if(this.overCount>=3&&limit.kmh!==null&&now-this.lastOverspeed>60000){this.lastOverspeed=now;return make(`over:${now}`,'overspeed','Chú ý tốc độ',`Tốc độ đang cao hơn mức ${limit.kmh} ki lô mét một giờ được ghi nhận. Đối chiếu biển trên đường.`);}
    const ahead=Math.min(500,Math.max(200,fix.speed*20));
    const signKinds:FeatureKind[]=['stop','give-way','speed-sign','no-entry','wrong-way','prohibition','no-overtaking'];
    const alertKinds:FeatureKind[]=['speed-camera','traffic-camera',...signKinds];
    const feature=data.features.find(f=>f.along-progress.along>20&&f.along-progress.along<=ahead&&(f.onRoute||(signKinds.includes(f.kind)&&(f.distanceFromRoute??Infinity)<=8))&&alertKinds.includes(f.kind)&&!this.seen.has(f.id));
    if(feature){const meters=Math.max(10,Math.round((feature.along-progress.along)/10)*10);return make(feature.id,feature.kind.includes('camera')?'camera':'sign',feature.label,`Phía trước khoảng ${meters} mét, gần tuyến có ${feature.label.toLocaleLowerCase('vi')}. Quan sát đường và kiểm tra biển thực tế.`,feature);}
    const next=data.sections.filter(s=>s.kmh!==null&&s.kmh!==limit.kmh&&s.start>progress.along+25&&s.start-progress.along<=200&&!this.seen.has(`ahead:${s.wayId}:${s.kmh}`)).sort((a,b)=>a.start-b.start)[0];
    if(next)return make(`ahead:${next.wayId}:${next.kmh}`,'limit','Sắp thay đổi giới hạn',`Phía trước khoảng ${Math.round((next.start-progress.along)/10)*10} mét có mức tốc độ ghi nhận ${next.kmh} ki lô mét một giờ. Đối chiếu biển thực tế.`);
    if(limit.kmh!==null&&this.speedCount>=2&&limit.kmh!==this.speed){this.speed=limit.kmh;return make(`limit:${limit.kmh}:${now}`,'limit','Giới hạn tốc độ ghi nhận',`Mức tốc độ được ghi nhận là ${limit.kmh} ki lô mét một giờ. Vui lòng đối chiếu biển thực tế.`);}
    return null;
  }
}

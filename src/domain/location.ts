import type {Fix} from './types';

export function validLocation(fix:Fix|null):fix is Fix {
  return !!fix&&Number.isFinite(fix.lat)&&Math.abs(fix.lat)<=90&&Number.isFinite(fix.lng)&&Math.abs(fix.lng)<=180&&Number.isFinite(fix.accuracy)&&fix.accuracy>=0&&Number.isFinite(fix.timestamp);
}
export function accuracyAllows(accuracy:number,ageMs:number,purpose:'preview'|'navigation'):boolean {
  return Number.isFinite(accuracy)&&accuracy>=0&&Number.isFinite(ageMs)&&ageMs>=-5000&&accuracy<=(purpose==='preview'?5000:65)&&ageMs<=(purpose==='preview'?120000:15000);
}
export function canPreviewFrom(fix:Fix|null,now=Date.now()):boolean {
  return validLocation(fix)&&accuracyAllows(fix.accuracy,now-fix.timestamp,'preview');
}
export function canNavigateFrom(fix:Fix|null,now=Date.now()):boolean {
  return validLocation(fix)&&accuracyAllows(fix.accuracy,now-fix.timestamp,'navigation');
}
export function locationZoom(accuracy:number):number {
  return accuracy<=25?17:accuracy<=100?16:accuracy<=1000?14:accuracy<=5000?12:9;
}

export function shortestAngleDelta(from:number,to:number):number {
  return ((((to-from)%360)+540)%360)-180;
}

export function compassHeading(event:{webkitCompassHeading?:unknown;alpha?:unknown;absolute?:unknown}):number|null {
  const {webkitCompassHeading,alpha,absolute}=event;
  if(typeof webkitCompassHeading==='number'&&Number.isFinite(webkitCompassHeading)&&webkitCompassHeading>=0&&webkitCompassHeading<=360)return webkitCompassHeading%360;
  // Relative alpha (absolute !== true) has no fixed north, so it would point the arrow in the wrong direction.
  if(absolute!==true)return null;
  if(typeof alpha==='number'&&Number.isFinite(alpha)){
    const screenAngle=typeof window!=='undefined'&&typeof window.screen?.orientation?.angle==='number'?window.screen.orientation.angle:0;
    return ((360-alpha+screenAngle)%360+360)%360;
  }
  return null;
}

export type LocationIssue={kind:'permission'|'timeout'|'unavailable'|'insecure'|'unsupported';text:string};
export function locationIssue(error:unknown):LocationIssue {
  const code=String((error as {code?:unknown}|null)?.code??'');
  if(code==='1'||code==='OS-PLUG-GLOC-0003')return {kind:'permission',text:'Quyền vị trí đang bị chặn. Cho phép vị trí cho trang này hoặc ứng dụng, rồi bấm Thử lại.'};
  if(code==='3'||code==='OS-PLUG-GLOC-0010')return {kind:'timeout',text:'Chưa nhận được vị trí mới. App vẫn đang chờ; bạn có thể thử lại hoặc chọn điểm đi trên bản đồ.'};
  return {kind:'unavailable',text:'Thiết bị chưa cung cấp được vị trí. Kiểm tra Dịch vụ định vị và kết nối mạng, hoặc chọn điểm đi trên bản đồ.'};
}

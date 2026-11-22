import {LoaderCircle,LocateFixed,MapPin} from 'lucide-react';
import type {Fix} from '../domain/types';
import {canNavigateFrom} from '../domain/location';

export default function LocationStatus({fix,requesting,error,now,retry,chooseOrigin}:{fix:Fix|null;requesting:boolean;error:string|null;now:number;retry:()=>void;chooseOrigin?:()=>void}) {
  const precise=canNavigateFrom(fix,now),stale=!!fix&&now-fix.timestamp>15000;
  const text=requesting?'Đang lấy vị trí từ thiết bị…':fix?`${stale?'Vị trí gần nhất':precise?'Vị trí hiện tại':'Vị trí gần đúng'} · sai số khoảng ${Math.round(fix.accuracy).toLocaleString('vi-VN')} m`:error??'Dùng vị trí thiết bị hoặc chọn điểm đi để xem tuyến.';
  return <div className={`location-status ${precise?'is-precise':''}`} aria-label="Trạng thái định vị">
    <div>{requesting?<LoaderCircle className="spin" size={17}/>:<LocateFixed size={17}/>}<span>{text}</span></div>
    {fix&&!precise&&<p>{stale?'Đang chờ vị trí mới.':fix.accuracy<=5000?'Có thể xem tuyến trước; cần vị trí chính xác hơn để bắt đầu dẫn đường.':'Vị trí hiện quá rộng để chọn điểm đi đáng tin cậy.'}</p>}
    {fix&&error&&<p>{error}</p>}
    {(!precise||chooseOrigin)&&<div className="location-actions">{!precise&&<button className="text-button" onClick={retry} disabled={requesting}>{fix||error?'Thử lại GPS':'Dùng vị trí của tôi'}</button>}{chooseOrigin&&<button className="text-button" onClick={chooseOrigin}><MapPin size={15}/>Chọn điểm đi</button>}</div>}
  </div>;
}

import { Camera, CircleHelp, Flag, Layers2, LoaderCircle, Plus, RefreshCw, TrafficCone, Undo2, X } from 'lucide-react';
import type { CurrentLimit, FeatureKind, RoadData, RoadFeature } from '../domain/roadData';
import { ADDABLE_FEATURE_LABELS, type AddableFeatureKind, type UserRoadEdit } from '../domain/userRoadEdits';
import type { Route } from '../domain/types';
import { formatDistance } from '../domain/geometry';
import {roadSymbol} from '../domain/roadSymbols';
import SpeedLimitImage from './SpeedLimitImage';
import {useEffect,useState} from 'react';
export type RoadFilters={speed:boolean;cameras:boolean;signs:boolean;signals:boolean};
export function groupFor(kind:FeatureKind):keyof RoadFilters { return kind.includes('camera')?'cameras':kind==='signals'?'signals':'signs'; }
const SPEED_SIGN_VALUES=[20,30,40,50,60,70,80,90,100,110,120] as const;
type Props={route:Route|null;data:RoadData|null;loading:boolean;error:string|null;retry:()=>void;close:()=>void;filters:RoadFilters;setFilters:(next:RoadFilters)=>void;limit:CurrentLimit;along:number;navigating:boolean;enabled:boolean;setEnabled:(value:boolean)=>void;showScale:boolean;setShowScale:(value:boolean)=>void;warnDistance:number;setWarnDistance:(value:number)=>void;termsAccepted:boolean;setTermsAccepted:(value:boolean)=>void;resetSettings:()=>void;userEdits:UserRoadEdit[];onReportFeature:(feature:RoadFeature)=>void;onUndoEdit:(editId:string)=>void;onAddSign:(input:{featureKind:AddableFeatureKind;label:string;speedKmh?:number;note?:string})=>void;canAddAtCurrentLocation:boolean};
export default function RoadDataPanel({route,data,loading,error,retry,close,filters,setFilters,limit,along,navigating,enabled,setEnabled,showScale,setShowScale,warnDistance,setWarnDistance,termsAccepted,setTermsAccepted,resetSettings,userEdits,onReportFeature,onUndoEdit,onAddSign,canAddAtCurrentLocation}:Props) {
  const [shownPoints,setShownPoints]=useState(60),[shownSections,setShownSections]=useState(12),[signQuery,setSignQuery]=useState('');
  const [addingSign,setAddingSign]=useState(false),[newSignKind,setNewSignKind]=useState<AddableFeatureKind>('stop'),[newSignSpeed,setNewSignSpeed]=useState(50),[newSignNote,setNewSignNote]=useState('');
  function submitNewSign(){
    const label=newSignKind==='speed-sign'?`${ADDABLE_FEATURE_LABELS[newSignKind]} ${newSignSpeed} km/h`:ADDABLE_FEATURE_LABELS[newSignKind];
    onAddSign({featureKind:newSignKind,label,speedKmh:newSignKind==='speed-sign'?newSignSpeed:undefined,note:newSignNote.trim()||undefined});
    setAddingSign(false);setNewSignNote('');
  }
  useEffect(()=>{setShownPoints(60);setShownSections(12);setSignQuery('');},[route?.id]);
  const wholeRoute=data?.scope==='route',complete=wholeRoute&&data?.scan?.complete;
  const loadedFeatures=data?.features??[];
  const ahead=loadedFeatures.filter(f=>f.along>=along-30);
  const features=ahead.filter(f=>filters[groupFor(f.kind)]);
  const search=signQuery.trim().toLocaleLowerCase('vi');
  const listed=search?features.filter(f=>f.label.toLocaleLowerCase('vi').includes(search)||(f.code??'').toLocaleLowerCase('vi').includes(search)):features;
  const hiddenCount=ahead.length-features.length;
  const passedCount=loadedFeatures.length-ahead.length;
  const allValues=[...new Map((data?.sections??[]).map(s=>[`${s.wayId}:${s.raw}`,s])).values()];
  const values=allValues.slice(0,shownSections);
  return <div className="modal-backdrop" onClick={close}><section className="road-panel" role="dialog" aria-modal="true" aria-labelledby="road-data-title" onClick={e=>e.stopPropagation()}>
    <button className="icon-button modal-close" aria-label="Đóng dữ liệu đường" onClick={close} autoFocus><X size={20}/></button>
    <span className="road-panel-icon"><Layers2 size={25}/></span><h2 id="road-data-title">Dữ liệu đường</h2><p className="road-subtitle">Giới hạn tốc độ, camera và biển cấm có thể bị xử phạt được ghi nhận trên OpenStreetMap. Không hiển thị gờ giảm tốc, đường ngang hay lối đi bộ.</p>
    <label className="road-master-toggle"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Bật lớp dữ liệu đường</label>
    <label className="road-master-toggle"><input type="checkbox" checked={showScale} onChange={e=>setShowScale(e.target.checked)}/> Hiện thước tỷ lệ</label>
    <label className="road-master-toggle">Cảnh báo camera trước <select value={warnDistance} onChange={e=>setWarnDistance(Number(e.target.value))} aria-label="Khoảng cách cảnh báo camera"><option value={200}>200 m</option><option value={500}>500 m</option><option value={900}>900 m</option></select></label>
    <p className="road-data-meta">{enabled?'Tự động quét dữ liệu toàn tuyến · Cảnh báo khi lái xe theo vị trí hiện tại':'Lớp dữ liệu đường đang tắt để tiết kiệm pin và băng thông.'}</p>
    <div className="road-disclaimer"><CircleHelp size={18}/><span>Dữ liệu cộng đồng có thể thiếu hoặc đã cũ. Không có dữ liệu không đồng nghĩa không có biển/camera. Luôn đối chiếu biển thực tế; camera quan sát chưa xác định là camera phạt nguội.</span></div>
    <label className="road-master-toggle"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)}/> Tôi đã đọc lưu ý về vị trí, giới hạn dữ liệu và an toàn giao thông</label>
    <div className="road-filters">{([['speed','Tốc độ'],['cameras','Camera'],['signs','Biển báo'],['signals','Đèn giao thông']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.checked})}/>{label}</label>)}</div>
    <input className="road-search" type="search" value={signQuery} onChange={e=>setSignQuery(e.target.value)} placeholder="Tìm biển theo tên hoặc mã OSM…" aria-label="Tìm biển theo tên hoặc mã OSM"/>
    {search&&!listed.length&&<p className="road-empty">Không có điểm khớp “{signQuery}”.</p>}
    <div className="road-symbol-legend" aria-label="Chú giải ký hiệu"><span><img src="/signs/traffic-signals.svg" alt=""/><img src="/signs/traffic-signals-mono.svg" alt=""/>Đèn giao thông</span><span><img src="/signs/camera.svg" alt=""/>Camera</span><small>Ba chấm xếp dọc trong hình đèn tín hiệu, có màu hoặc đen/xám, đều chỉ vị trí đèn giao thông. Không hiển thị màu đèn đang sáng trực tiếp.</small></div>
    {!route?<p className="road-empty">Chọn điểm đến và tính tuyến để xem dữ liệu dọc đường.</p>:<>
      {loading&&<div className="road-loading" role="status"><LoaderCircle className="spin" size={19}/>Đang quét dữ liệu toàn tuyến…{data?.scan&&` ${data.scan.completed}/${data.scan.total} phần`}</div>}
      {error&&<div className="road-error" role="alert"><p>{error}</p><button className="text-button" onClick={retry}><RefreshCw size={15}/>Thử tải lại</button></div>}
      {navigating&&<div className="current-limit"><SpeedLimitImage kmh={limit.kmh}/><div><strong>Giới hạn ghi nhận · km/h</strong><p>{limit.kmh===null?limit.reason:'Nguồn OSM · chưa được RoadLink xác minh thực địa.'}</p></div></div>}
      <div className="road-user-edits">
        <button type="button" className="text-button road-add-sign-toggle" onClick={()=>setAddingSign(v=>!v)} disabled={!canAddAtCurrentLocation}><Plus size={16}/>{addingSign?'Hủy thêm biển':'Thêm biển tại vị trí hiện tại'}</button>
        {!canAddAtCurrentLocation&&<small className="road-empty">Cần có vị trí GPS hiện tại để thêm biển.</small>}
        {addingSign&&<div className="road-add-sign-form">
          <label>Loại biển<select value={newSignKind} onChange={e=>setNewSignKind(e.target.value as AddableFeatureKind)}>{Object.entries(ADDABLE_FEATURE_LABELS).map(([kind,label])=><option key={kind} value={kind}>{label}</option>)}</select></label>
          {newSignKind==='speed-sign'&&<label>Tốc độ (km/h)<select value={newSignSpeed} onChange={e=>setNewSignSpeed(Number(e.target.value))}>{SPEED_SIGN_VALUES.map(v=><option key={v} value={v}>{v}</option>)}</select></label>}
          <input type="text" placeholder="Ghi chú (tùy chọn)" value={newSignNote} onChange={e=>setNewSignNote(e.target.value)} maxLength={120}/>
          <p className="road-empty">Biển sẽ lưu tại vị trí GPS hiện tại, chỉ trên thiết bị này — không gửi cho ai khác, không ảnh hưởng đến cảnh báo quá tốc độ tự động.</p>
          <button type="button" className="button primary full" onClick={submitNewSign}>Lưu biển</button>
        </div>}
      </div>
      {data&&<>
        <div className="road-data-meta" data-road-scope={data.scope??'window'} data-scan-complete={complete?'true':'false'}>{data.source?.kind==='offline'?`Dữ liệu Việt Nam trên thiết bị · bản ${data.source.version} · `:''}{complete?'Toàn tuyến':wholeRoute?'Đang quét toàn tuyến':'Phạm vi dự phòng theo vị trí'}: {formatDistance(data.windowStart)}–{formatDistance(data.windowEnd)} · OSM{data.scan&&` · Đã quét ${data.scan.completed}/${data.scan.total} phần`}</div>
        {data.source?.kind==='offline'&&<p className="road-pack-credit">{data.source.attribution} · {data.source.license}. Dữ liệu cộng đồng có thể thiếu/cũ; không phải bản đồ hay bộ định tuyến ngoại tuyến.</p>}
        {complete&&<p className="road-route-total">Toàn tuyến đã quét: <strong>{loadedFeatures.length} điểm</strong> · {loadedFeatures.filter(f=>groupFor(f.kind)==='signals').length} đèn giao thông · {loadedFeatures.filter(f=>groupFor(f.kind)==='signs').length} biển/đặc điểm cảnh báo · {loadedFeatures.filter(f=>groupFor(f.kind)==='cameras').length} camera/điểm giám sát.</p>}
        {complete&&<div className="road-kind-summary" aria-label="Loại điểm trong nguồn">{([['stop','Biển STOP'],['give-way','Biển nhường đường'],['speed-sign','Biển tốc độ'],['no-entry','Cấm đi vào'],['wrong-way','Cấm ngược chiều'],['prohibition','Biển cấm'],['no-overtaking','Cấm vượt']] as const).map(([kind,label])=>{const count=loadedFeatures.filter(f=>f.kind===kind).length;return count?<span key={kind}>{label}: <strong>{count}</strong></span>:null;})}</div>}
        <h3>Mức tốc độ có dữ liệu</h3>
        {!values.length?<p className="road-empty">Chưa có dữ liệu tốc độ khớp chính xác tuyến đường. Không suy ra giới hạn từ tốc độ xe hoặc ETA.</p>:<div className="limit-sections">{values.map(s=><div key={`${s.wayId}:${s.raw}`}><SpeedLimitImage kmh={s.kmh} small/><div><strong>{s.kmh!==null?`${s.kmh} km/h`:'Chưa xác định mức áp dụng'}</strong><small>{s.reason??`OSM way ${s.wayId}${s.raw.includes('mph')?` · gốc ${s.raw}`:''}`}</small>{s.updatedAt&&<small>Đối tượng OSM sửa: {s.updatedAt.slice(0,10)} (không phải ngày kiểm tra biển)</small>}</div></div>)}</div>}
        {allValues.length>shownSections&&<button className="text-button" onClick={()=>setShownSections(value=>value+24)}>Xem thêm mức tốc độ ({values.length}/{allValues.length})</button>}
        <h3>Điểm gần tuyến đang hiển thị <span>{loading?'…':error?'—':features.length}</span></h3>
        <p className="road-point-counts">Đã nạp {loadedFeatures.length} điểm {complete?'trên toàn tuyến':wholeRoute?'trong phần tuyến đã quét':'trong đoạn đã tải'} {formatDistance(data.windowStart)}–{formatDistance(data.windowEnd)} · Hiển thị {features.length} · Bộ lọc ẩn {hiddenCount}{passedCount>0?` · Đã đi qua ${passedCount}`:''}. Bộ đếm chỉ gồm đèn giao thông, biển và camera; các đoạn có giới hạn tốc độ nằm ở mục riêng phía trên.</p>
        {loading&&<p className="road-empty">Đang đọc phần còn lại của tuyến. Tổng số điểm sẽ được xác nhận khi quét xong.</p>}
        {error&&<p className="road-empty">Các điểm đã nạp chưa đại diện đầy đủ cho toàn tuyến. Bạn vẫn tiếp tục dẫn đường được.</p>}
        {!loading&&!error&&!features.length&&(hiddenCount>0?<div className="road-empty"><p>Có {hiddenCount} điểm phía trước trong dữ liệu đã tải, nhưng đang bị bộ lọc ẩn.</p><button className="text-button" onClick={()=>setFilters({...filters,cameras:true,signs:true,signals:true})}>Hiện tất cả điểm</button></div>:passedCount>0?<p className="road-empty">Đã đi qua {passedCount} điểm đã nạp. {complete?'Toàn tuyến đã quét hiện không còn điểm phía trước.':'Chưa kết luận về phần tuyến chưa tải.'}</p>:<p className="road-empty">App chưa tìm thấy điểm đèn giao thông, biển báo hoặc camera phù hợp trong phần dữ liệu OSM đã {complete?'quét trên toàn tuyến':'tải cho đoạn này'}. Không đồng nghĩa ngoài đường không có biển hoặc camera.</p>)}
        {!!listed.length&&<ul className="road-feature-list">{listed.slice(0,shownPoints).map(f=><li key={f.id}><img className="road-feature-image" src={roadSymbol(f).src} alt={f.label}/><div><strong>{f.label}{f.userAdded&&<span className="user-added-tag"> · Bạn thêm</span>}</strong><small>{formatDistance(Math.max(0,f.along-along))} dọc tuyến · {f.onRoute?'Nút thuộc tuyến':'Gần tuyến'} · Chưa xác nhận chiều áp dụng</small>{f.code&&!f.userAdded&&<small>Mã OSM: {f.code}</small>}</div><button type="button" className="road-feature-report" aria-label={f.userAdded?`Xóa ${f.label}`:`Báo sai, ẩn ${f.label}`} title={f.userAdded?'Xóa biển bạn đã thêm':'Báo sai, ẩn biển này'} onClick={()=>onReportFeature(f)}>{f.userAdded?<Undo2 size={15}/>:<Flag size={15}/>}</button></li>)}</ul>}
        {listed.length>shownPoints&&<button className="text-button" onClick={()=>setShownPoints(value=>value+60)}>Xem thêm điểm ({shownPoints}/{listed.length})</button>}
        <p className="symbol-credit">SVG chỉ minh họa loại đối tượng; vị trí/thuộc tính lấy từ OSM. Không phải ảnh chụp thực địa. Dữ liệu cộng đồng có thể thiếu; camera quan sát chưa xác định là camera xử phạt.</p>
      </>}
    </>}
    {userEdits.filter(e=>e.kind==='suppress').length>0&&<div className="road-user-edit-log">
      <h3>Biển bạn đã ẩn <span>{userEdits.filter(e=>e.kind==='suppress').length}</span></h3>
      <ul className="road-feature-list">{userEdits.filter(e=>e.kind==='suppress').slice().reverse().slice(0,20).map(edit=><li key={edit.id}><div><strong>{edit.label}</strong></div><button type="button" className="text-button" onClick={()=>onUndoEdit(edit.id)}><Undo2 size={14}/>Hiện lại</button></li>)}</ul>
    </div>}
    <button className="text-button road-reset" onClick={resetSettings}>Đặt lại toàn bộ cài đặt</button>
  </section></div>;
}

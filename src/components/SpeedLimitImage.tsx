import {speedSignImage} from '../domain/roadSymbols';
export default function SpeedLimitImage({kmh,small=false}:{kmh:number|null;small?:boolean}){
  const cls=`speed-limit-circle speed-limit-art ${small?'small':''}`;
  if(kmh===null)return <span className={`${cls} limit-unknown`} aria-label="Chưa có giới hạn tốc độ">—</span>;
  const src=speedSignImage(kmh);
  if(src)return <img className={cls} src={src} alt={`Biển giới hạn tốc độ ${kmh} km/h`} title="Hình minh họa biển báo, không phải ảnh chụp tại vị trí"/>;
  return <svg className={cls} role="img" aria-label={`Biển giới hạn tốc độ ${kmh} km/h`} viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#df1f26" strokeWidth="12"/><text x="50" y="68" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize={kmh>=100?47:56} fontWeight="700" fill="#111">{kmh}</text></svg>;
}

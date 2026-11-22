import { ArrowLeft, ArrowUpDown, Bike, CarFront, ChevronRight, Footprints, Heart, Layers2, LoaderCircle, MapPin, Navigation2, Route as RouteIcon, Share2, TriangleAlert } from 'lucide-react';
import { formatDistance, formatDuration } from '../domain/geometry';
import type { Place, Route } from '../domain/types';

export function PlaceCard({ place, saved, shareStatus, onRoute, onSave, onShare, onClose }: { place: Place; saved: boolean; shareStatus: string | null; onRoute: () => void; onSave: () => void; onShare: () => void; onClose: () => void }) {
  return <>
    <div className="place-title-row">
      <div>
        <h1>{place.name}</h1>
        <p className="place-address"><MapPin size={15} />{place.detail || `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`}</p>
      </div>
      <button className="icon-button" aria-label="Đóng địa điểm" onClick={onClose}><ArrowLeft size={20} /></button>
    </div>
    <div className="place-actions">
      <button className="button primary gmaps-pill-btn" onClick={onRoute}><Navigation2 size={18} fill="currentColor" />Chỉ đường</button>
      <button className="button outlined gmaps-pill-btn" onClick={onSave} aria-label={saved ? 'Bỏ lưu địa điểm' : 'Lưu địa điểm'}><Heart size={18} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Đã lưu' : 'Lưu'}</button>
      <button className="button outlined gmaps-pill-btn" onClick={onShare}><Share2 size={18} />Chia sẻ</button>
    </div>
    {shareStatus && <p className="inline-feedback">{shareStatus}</p>}
  </>;
}

export function RouteInputs({ origin, destination, back, editOrigin, editDestination, swap }: { origin: string; destination: string; back: () => void; editOrigin: () => void; editDestination: () => void; swap: () => void }) {
  return <section className="route-editor" aria-label="Điểm đi và điểm đến">
    <button className="route-editor-back" aria-label="Quay lại địa điểm" onClick={back}><ArrowLeft size={22} /></button>
    <div className="route-inputs-column">
      <div className="route-input-row">
        <span className="route-origin-circle" />
        <button className="route-input-field" onClick={editOrigin} aria-label="Đổi điểm đi">
          <span className="route-text-truncate">{origin}</span>
        </button>
      </div>
      <div className="route-dots-line">
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
      <div className="route-input-row">
        <span className="route-dest-pin"><MapPin size={17} /></span>
        <button className="route-input-field" onClick={editDestination} aria-label="Đổi điểm đến">
          <span className="route-text-truncate">{destination}</span>
        </button>
      </div>
    </div>
    <button className="swap-endpoints" aria-label="Đảo điểm đi và điểm đến" onClick={swap}><ArrowUpDown size={20} /></button>
  </section>;
}

type CardProps = { route: Route | null; alternatives: Route[]; selected: Place | null; loading: boolean; error: string | null; customOrigin: boolean; awaitingGPS: boolean; locationError: string | null; details: boolean; back: () => void; retry: () => void; start: () => void; select: (route: Route) => void; toggleDetails: () => void; roadData: () => void };

export function RoutePlannerCard(p: CardProps) {
  return <>
    <div className="planner-transport-modes">
      <button className="transport-mode-tab active" type="button">
        <CarFront size={19} />
        <span>{p.route ? formatDuration(p.route.duration) : 'Ô tô'}</span>
      </button>
      <button className="transport-mode-tab" type="button">
        <Bike size={19} />
        <span>{p.route ? formatDuration(Math.round(p.route.duration * 1.15)) : 'Xe máy'}</span>
      </button>
      <button className="transport-mode-tab" type="button">
        <Footprints size={19} />
        <span>{p.route ? formatDuration(Math.round(p.route.duration * 4.5)) : 'Đi bộ'}</span>
      </button>
    </div>
    {!p.route && !p.loading && !p.error && <p className="planner-help">{p.awaitingGPS ? 'Đang chờ vị trí. Bạn có thể chọn điểm đi thủ công ngay phía trên.' : 'Chọn điểm đi để tìm tuyến đường.'}</p>}
    {p.loading ? <div className="route-loading" role="status"><LoaderCircle className="spin" size={24} />Đang tìm tuyến đường…</div> : p.error ? <div className="route-error" role="alert"><TriangleAlert size={22} /><p>{p.error}</p><button className="button secondary full" onClick={p.retry}>Thử lại</button><button className="text-button" aria-label="Quay lại bản đồ" onClick={p.back}>Quay lại bản đồ</button></div> : p.route && <>
      <div className="route-choices" role="radiogroup" aria-label="Chọn tuyến đường">
        {p.alternatives.map((r, i) => <button key={r.id} role="radio" aria-checked={r.id === p.route!.id} className={`route-choice ${r.id === p.route!.id ? 'selected' : ''}`} onClick={() => p.select(r)}>
          <span className="route-radio" />
          <div className="route-choice-info">
            <div className="route-time-line">
              <strong className="eta-green">{formatDuration(r.duration)}</strong>
              <span className="route-dist">({formatDistance(r.distance)})</span>
            </div>
            <p className="route-summary-text">{r.summary || `Tuyến đường ${i + 1}`}</p>
            {i === 0 && <span className="best-route-tag">Tuyến nhanh nhất</span>}
          </div>
          <ChevronRight size={18} className="route-choice-arrow" />
        </button>)}
      </div>
      {p.customOrigin && <p className="origin-warning">Điểm đi tùy chọn. Chọn Vị trí của bạn để dẫn đường bằng GPS thật.</p>}
      <div className="planner-actions">
        <button className="button primary gmaps-start-btn" onClick={p.start} disabled={p.awaitingGPS && !p.locationError}>
          <Navigation2 size={20} fill="currentColor" />
          <span>{p.awaitingGPS ? 'Đang chờ GPS…' : 'Bắt đầu'}</span>
        </button>
        <button className="button outlined gmaps-steps-btn" onClick={p.toggleDetails}>
          <RouteIcon size={18} />
          <span>{p.details ? 'Thu gọn' : 'Các chặng'}</span>
        </button>
      </div>
      <button className="road-entry" onClick={p.roadData}><Layers2 size={16} />Giới hạn tốc độ, biển báo & camera<ChevronRight size={16} /></button>
    </>}
  </>;
}

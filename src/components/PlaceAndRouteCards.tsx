import { ArrowLeft, ArrowRight, ArrowUpDown, Bike, CarFront, ChevronRight, Footprints, Heart, Layers2, LoaderCircle, LocateFixed, MapPin, Navigation2, Route as RouteIcon, Share2, TriangleAlert, X } from 'lucide-react';
import { formatDistance, formatDuration } from '../domain/geometry';
import type { Place, Route } from '../domain/types';

export function PlaceCard({ place, saved, shareStatus, onRoute, onSave, onShare, onClose }: { place: Place; saved: boolean; shareStatus: string | null; onRoute: () => void; onSave: () => void; onShare: () => void; onClose: () => void }) {
  return <>
    <div className="place-title-row">
      <div>
        <h1>{place.name}</h1>
        <p className="place-address"><MapPin size={16} />{place.detail || `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`}</p>
      </div>
      <button className="icon-button" aria-label="Đóng địa điểm" onClick={onClose}><X size={20} /></button>
    </div>
    <div className="place-actions">
      <button className="button primary gmaps-pill-btn" onClick={onRoute}><Navigation2 size={20} fill="currentColor" />Chỉ đường</button>
      <button className="button outlined gmaps-pill-btn" onClick={onSave} aria-label={saved ? 'Bỏ lưu địa điểm' : 'Lưu địa điểm'}><Heart size={20} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Đã lưu' : 'Lưu'}</button>
      <button className="button outlined gmaps-pill-btn" onClick={onShare}><Share2 size={20} />Chia sẻ</button>
    </div>
    {shareStatus && <p className="inline-feedback">{shareStatus}</p>}
  </>;
}

export function RouteInputs({
  origin,
  destination,
  editingTarget,
  query,
  onQueryChange,
  onStartEdit,
  onClearTarget,
  back,
  swap,
  searchOpen,
  onCloseSearch,
  results,
  searching,
  savedPlaces,
  onSelectPlace,
  onUseMyLocation,
  onPickOnMap,
  onSubmitSearch,
}: {
  origin: string;
  destination: string;
  editingTarget: 'origin' | 'destination' | null;
  query: string;
  onQueryChange: (val: string) => void;
  onStartEdit: (target: 'origin' | 'destination') => void;
  onClearTarget: (target: 'origin' | 'destination') => void;
  back: () => void;
  swap: () => void;
  searchOpen: boolean;
  onCloseSearch: () => void;
  results: Place[];
  searching: boolean;
  savedPlaces: Place[];
  onSelectPlace: (place: Place) => void;
  onUseMyLocation: () => void;
  onPickOnMap: () => void;
  onSubmitSearch?: (e: React.FormEvent) => void;
}) {
  const isEditingOrigin = searchOpen && editingTarget === 'origin';
  const isEditingDest = searchOpen && editingTarget === 'destination';

  return (
    <section className="route-editor-wrap" aria-label="Khung tìm tuyến đường">
      <div className="route-editor">
        <button
          className="route-editor-back"
          aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Quay lại'}
          onClick={searchOpen ? onCloseSearch : back}
        >
          <ArrowLeft size={22} />
        </button>

        <div className="route-inputs-column">
          {/* Hàng Điểm đi (Origin Row) */}
          <div className={`route-input-row ${isEditingOrigin ? 'focused' : ''}`}>
            <span className="route-origin-circle" />
            {isEditingOrigin ? (
              <form
                className="route-inline-form"
                onSubmit={e => {
                  e.preventDefault();
                  onSubmitSearch?.(e);
                }}
              >
                <input
                  autoFocus
                  aria-label="Tìm điểm đi"
                  className="route-input-field editable"
                  placeholder="Chọn điểm đi hoặc nhập địa chỉ..."
                  value={query}
                  onChange={e => onQueryChange(e.target.value)}
                />
                <button type="submit" className="route-submit-btn" aria-label="Tìm kiếm">
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="route-input-field"
                onClick={() => onStartEdit('origin')}
                aria-label="Đổi điểm đi"
              >
                <span className="route-text-truncate">{origin}</span>
              </button>
            )}
            {isEditingOrigin && query.length > 0 ? (
              <button
                type="button"
                className="route-row-clear"
                onClick={() => onQueryChange('')}
                aria-label="Xóa văn bản"
              >
                <X size={16} />
              </button>
            ) : origin !== 'Vị trí của bạn' && !isEditingOrigin ? (
              <button
                type="button"
                className="route-row-clear"
                onClick={() => onClearTarget('origin')}
                aria-label="Đặt lại về vị trí của tôi"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {/* Dấu 3 chấm dọc nối (3 dots connector) */}
          <div className="route-dots-line">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>

          {/* Hàng Điểm đến (Destination Row) */}
          <div className={`route-input-row ${isEditingDest ? 'focused' : ''}`}>
            <span className="route-dest-pin"><MapPin size={17} /></span>
            {isEditingDest ? (
              <form
                className="route-inline-form"
                onSubmit={e => {
                  e.preventDefault();
                  onSubmitSearch?.(e);
                }}
              >
                <input
                  autoFocus
                  aria-label="Tìm địa điểm"
                  className="route-input-field editable"
                  placeholder="Chọn điểm đến hoặc nhập địa chỉ..."
                  value={query}
                  onChange={e => onQueryChange(e.target.value)}
                />
                <button type="submit" className="route-submit-btn" aria-label="Tìm kiếm">
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="route-input-field"
                onClick={() => onStartEdit('destination')}
                aria-label="Đổi điểm đến"
              >
                <span className="route-text-truncate">{destination}</span>
              </button>
            )}
            {isEditingDest && query.length > 0 ? (
              <button
                type="button"
                className="route-row-clear"
                onClick={() => onQueryChange('')}
                aria-label="Xóa văn bản"
              >
                <X size={16} />
              </button>
            ) : !isEditingDest ? (
              <button
                type="button"
                className="route-row-clear"
                onClick={() => onStartEdit('destination')}
                aria-label="Đổi điểm đến"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Nút Đảo chiều (Swap) */}
        <button
          className="swap-endpoints"
          aria-label="Đảo điểm đi và điểm đến"
          onClick={swap}
        >
          <ArrowUpDown size={20} />
        </button>
      </div>

      {/* Menu gợi ý / kết quả tìm kiếm ngay dưới khung Route Editor */}
      {searchOpen && (
        <div className="route-search-dropdown">
          <button type="button" className="place-result-item" onClick={onUseMyLocation}>
            <div className="place-icon my-location-icon"><LocateFixed size={18} /></div>
            <div className="place-info">
              <strong>Vị trí của bạn</strong>
              <small>Sử dụng định vị GPS hiện tại</small>
            </div>
          </button>
          <button type="button" className="place-result-item" onClick={onPickOnMap}>
            <div className="place-icon pick-map-icon"><MapPin size={18} /></div>
            <div className="place-info">
              <strong>Chọn trên bản đồ</strong>
              <small>Chạm vào một điểm bất kỳ trên bản đồ</small>
            </div>
          </button>
          {searching && <p className="search-dropdown-status">Đang tìm địa điểm…</p>}
          {(results.length > 0 ? results : savedPlaces).map(place => (
            <button
              key={place.id}
              type="button"
              className="place-result place-result-item"
              onClick={() => onSelectPlace(place)}
            >
              <div className="place-icon"><MapPin size={18} /></div>
              <div className="place-info">
                <strong>{place.name}</strong>
                <small>{place.detail}</small>
              </div>
              <ChevronRight size={17} className="result-arrow" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

type CardProps = {
  route: Route | null;
  alternatives: Route[];
  selected: Place | null;
  loading: boolean;
  error: string | null;
  customOrigin: boolean;
  awaitingGPS: boolean;
  locationError: string | null;
  details: boolean;
  transportMode: 'car' | 'bike' | 'walk';
  onSelectTransportMode: (mode: 'car' | 'bike' | 'walk') => void;
  back: () => void;
  retry: () => void;
  start: () => void;
  select: (route: Route) => void;
  toggleDetails: () => void;
  roadData: () => void;
};

export function RoutePlannerCard(p: CardProps) {
  const durationFor = (dur: number, dist: number) => {
    if (p.transportMode === 'bike') return Math.round(dur * 1.05);
    if (p.transportMode === 'walk') return Math.round(dist / 1.25);
    return dur;
  };

  return <>
    <div className="planner-transport-modes">
      <button
        aria-label="Ô tô"
        aria-pressed={p.transportMode === 'car'}
        className={`transport-mode-tab ${p.transportMode === 'car' ? 'active' : ''}`}
        type="button"
        onClick={() => p.onSelectTransportMode('car')}
      >
        <CarFront size={24} />
      </button>
      <button
        aria-label="Xe máy"
        aria-pressed={p.transportMode === 'bike'}
        className={`transport-mode-tab ${p.transportMode === 'bike' ? 'active' : ''}`}
        type="button"
        onClick={() => p.onSelectTransportMode('bike')}
      >
        <Bike size={24} />
      </button>
      <button
        aria-label="Đi bộ"
        aria-pressed={p.transportMode === 'walk'}
        className={`transport-mode-tab ${p.transportMode === 'walk' ? 'active' : ''}`}
        type="button"
        onClick={() => p.onSelectTransportMode('walk')}
      >
        <Footprints size={24} />
      </button>
    </div>
    {!p.route && !p.loading && !p.error && <p className="planner-help">{p.awaitingGPS ? 'Đang chờ vị trí. Bạn có thể chọn điểm đi thủ công ngay phía trên.' : 'Chọn điểm đi để tìm tuyến đường.'}</p>}
    {p.loading ? <div className="route-loading" role="status"><LoaderCircle className="spin" size={24} />Đang tìm tuyến đường…</div> : p.error ? <div className="route-error" role="alert"><TriangleAlert size={22} /><p>{p.error}</p><button className="button secondary full" onClick={p.retry}>Thử lại</button><button className="text-button" aria-label="Quay lại bản đồ" onClick={p.back}>Quay lại bản đồ</button></div> : p.route && <>
      <div className="route-choices" role="radiogroup" aria-label="Chọn tuyến đường">
        {p.alternatives.map((r, i) => {
          const dur = durationFor(r.duration, r.distance);
          return (
            <button key={r.id} role="radio" aria-checked={r.id === p.route!.id} className={`route-choice ${r.id === p.route!.id ? 'selected' : ''}`} onClick={() => p.select(r)}>
              <span className="route-radio" />
              <div className="route-choice-info">
                <div className="route-time-line">
                  <strong className="eta-green">{formatDuration(dur)}</strong>
                  <span className="route-dist">({formatDistance(r.distance)})</span>
                </div>
                <p className="route-summary-text">{r.summary || `Tuyến đường ${i + 1}`}</p>
                {i === 0 && <span className="best-route-tag">Tuyến đề xuất</span>}
              </div>
              <ChevronRight size={18} className="route-choice-arrow" />
            </button>
          );
        })}
      </div>
      {p.customOrigin && <p className="origin-warning">Điểm đi tùy chọn. Chọn Vị trí của bạn để dẫn đường bằng GPS thật.</p>}
      {p.locationError && <p className="inline-feedback" role="alert">{p.locationError}</p>}
      <div className="planner-actions">
        <button className="button primary gmaps-start-btn" onClick={p.start} disabled={p.awaitingGPS && !p.locationError}>
          <Navigation2 size={20} fill="currentColor" />
          <span>{p.awaitingGPS ? 'Đang chờ GPS…' : 'Bắt đầu'}</span>
        </button>
        <button
          className="button outlined gmaps-steps-btn"
          onClick={p.toggleDetails}
          aria-label={p.details ? 'Thu gọn các chặng' : 'Xem trước các chặng'}
        >
          <RouteIcon size={18} />
          <span>{p.details ? 'Thu gọn' : 'Xem trước các chặng'}</span>
        </button>
      </div>
      <button className="road-entry" onClick={p.roadData}><Layers2 size={16} />Giới hạn tốc độ, biển báo & camera<ChevronRight size={16} /></button>
    </>}
  </>;
}

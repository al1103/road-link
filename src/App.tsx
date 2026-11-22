import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Bluetooth, BluetoothConnected, CarFront, Check, ChevronRight, Clock3, Compass, Flag, Heart, Layers2, LocateFixed, MapPin, Navigation2, Pause, Play, Route as RouteIcon, Search, ShieldCheck, Signal, SlidersHorizontal, Sparkles, Volume2, VolumeX, X, LoaderCircle, TriangleAlert } from 'lucide-react';
import MapView from './components/MapView';
import ManeuverIcon from './components/ManeuverIcon';
import BluetoothPanel from './components/BluetoothPanel';
import RoadDataPanel, { groupFor, type RoadFilters } from './components/RoadDataPanel';
import { currentLimit, UNKNOWN_LIMIT } from './domain/roadData';
import { useRoadData } from './hooks/useRoadData';
import { RoadAlertEngine,type RoadAlert } from './domain/roadAlerts';
import {PlaceCard,RouteInputs,RoutePlannerCard} from './components/PlaceAndRouteCards';
import SpeedLimitImage from './components/SpeedLimitImage';
import {roadSymbol} from './domain/roadSymbols';
import LocationStatus from './components/LocationStatus';
import {canNavigateFrom,canPreviewFrom} from './domain/location';
import { bearing, cumulative, distance, formatDistance, formatDuration, pointAt } from './domain/geometry';
import { Navigator } from './domain/navigation';
import type { Fix, Place, Progress, Route } from './domain/types';
import { useLocation } from './hooks/useLocation';
import { fetchRoute,fetchRoutes, friendlyError, searchPlaces } from './services/api';
import { BluetoothLink, type BluetoothState } from './services/bluetooth';
import { navMessage, routeMessages } from './services/protocol';
import { say, silence } from './services/voice';
import { KeepAwake } from '@capacitor-community/keep-awake';
type Mode = 'explore' | 'place' | 'preview' | 'navigating' | 'arrived';
function stored<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ } }
const link = new BluetoothLink();
export default function App() {
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('explore');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [alternatives,setAlternatives]=useState<Route[]>([]);
  const [originOverride,setOriginOverride]=useState<Place|null>(null);
  const [searchTarget,setSearchTarget]=useState<'origin'|'destination'>('destination');
  const [roadAlert,setRoadAlert]=useState<RoadAlert|null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError,setSearchError]=useState<string|null>(null);
  const [shareStatus,setShareStatus]=useState<string|null>(null);
  const [navigationError,setNavigationError]=useState<string|null>(null);
  const [voiceUnavailable,setVoiceUnavailable]=useState(false);
  const [savedPlaces,setSavedPlaces]=useState<Place[]>(()=>{const value=stored<unknown>('roadlink.savedPlaces',[]);return Array.isArray(value)?value.filter((p):p is Place=>!!p&&typeof p==='object'&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.detail==='string'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180):[];});
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [pendingGPS,setPendingGPS]=useState<'preview'|'navigation'|null>(null);
  const awaitingGPS=pendingGPS!==null;
  const [follow, setFollow] = useState(true);
  const [recenter, setRecenter] = useState(0);
  const [details, setDetails] = useState(false);
  const [voice, setVoice] = useState(() => stored('roadlink.voice', true) === true);
  const [favorites, setFavorites] = useState<string[]>(() => { const v = stored<unknown>('roadlink.favorites', []); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; });
  const [ble, setBle] = useState<BluetoothState>({ status: 'disconnected' });
  const [showBLE, setShowBLE] = useState(false);
  const [showRoadData,setShowRoadData]=useState(false);
  const [roadFilters,setRoadFilters]=useState<RoadFilters>({speed:true,cameras:true,signs:true,signals:true});
  const [rerouting, setRerouting] = useState(false);
  const [tileWarning, setTileWarning] = useState(false);
  const [mode3D,setMode3D]=useState(false),[northReset,setNorthReset]=useState(0),[mapBearing,setMapBearing]=useState(0);
  const [now, setNow] = useState(Date.now());
  const routeAbort = useRef<AbortController | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const engine = useRef<Navigator | null>(null);
  const spoken = useRef(new Set<string>());
  const lastReroute = useRef(0);
  const sequence = useRef(0);
  const lastSent = useRef(0);
  const roadAlertEngine=useRef(new RoadAlertEngine());
  const lastVoiceAt=useRef(0);
  const appElement=useRef<HTMLElement|null>(null),panelElement=useRef<HTMLElement|null>(null);
  const fix = location.fix;
  const navigating = mode === 'navigating';
  const goodGPS = canNavigateFrom(location.fix,now);
  const previewGPS=canPreviewFrom(location.fix,now);
  const staleGPS = navigating && !!location.fix && now - location.fix.timestamp > 15000;
  const road=useRoadData(route,progress?.along??0);
  const displayRoadData=road.overview??road.data;
  const limit=navigating?currentLimit(road.data,route,fix,progress?.along??0,progress?.offRoute):UNKNOWN_LIMIT;
  const mapRoadData=useMemo(()=>displayRoadData?{...displayRoadData,sections:roadFilters.speed?displayRoadData.sections:[],features:displayRoadData.features.filter(f=>roadFilters[groupFor(f.kind)])}:null,[displayRoadData,roadFilters]);
  useEffect(()=>{
    const panel=panelElement.current;if(!panel)return;
    const observer=new ResizeObserver(()=>appElement.current?.style.setProperty('--panel-height',`${panel.getBoundingClientRect().height}px`));observer.observe(panel);
    return()=>observer.disconnect();
  },[]);
  useEffect(() => link.subscribe(setBle), []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 2000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (navigating) void KeepAwake.keepAwake().catch(() => undefined);
    else void KeepAwake.allowSleep().catch(() => undefined);
    return () => { void KeepAwake.allowSleep().catch(() => undefined); };
  }, [navigating]);
  useEffect(() => () => { routeAbort.current?.abort(); searchAbort.current?.abort(); silence(); }, []);
  useEffect(() => {
    roadAlertEngine.current=new RoadAlertEngine();
    if (!route) { engine.current = null; setProgress(null); return; }
    engine.current = new Navigator(route); spoken.current.clear();setRoadAlert(null);
  }, [route]);
  useEffect(() => {
    if (!route || !navigating || !fix || !engine.current) return;
    const next = engine.current.update(fix);
    if (!next) return;
    setProgress(next);
    if (next.arrived) { setMode('arrived'); if (voice) void say('Bạn đã đến điểm đến. Chúc bạn một ngày tốt lành.'); }
  }, [fix, route, navigating, voice]);
  useEffect(() => {
    if (!navigating || !route || !progress || !voice || progress.arrived) return;
    const band = progress.nextTurn > 300 ? 'far' : progress.nextTurn > 80 ? 'near' : 'now';
    const key = `${route.id}:${progress.step.index}:${band}`;
    if (spoken.current.has(key)) return;
    spoken.current.add(key);
    lastVoiceAt.current=Date.now();
    const text = progress.nextTurn > 30 ? `Sau khoảng ${formatDistance(progress.nextTurn)}, ${progress.step.instruction.toLocaleLowerCase('vi')}` : progress.step.instruction;
    void say(text).then(ok=>setVoiceUnavailable(!ok));
  }, [progress, navigating, voice, route]);
  useEffect(()=>{
    if(roadAlert&&now>roadAlert.expiresAt)setRoadAlert(null);
    if(!navigating||!route||!progress||!fix||progress.nextTurn<100||(voice&&Date.now()-lastVoiceAt.current<4000))return;
    const next=roadAlertEngine.current.update(route,road.data,fix,progress,limit);
    if(next){setRoadAlert(next);if(voice){lastVoiceAt.current=Date.now();void say(next.speech).then(ok=>setVoiceUnavailable(!ok));}}
  },[progress,fix,route,road.data,navigating,voice,now]);
  useEffect(() => { if (ble.status === 'connected' && route && navigating) link.enqueue(routeMessages(route), 'route'); }, [ble.status, route, navigating]);
  useEffect(() => {
    if (ble.status !== 'connected' || !route || !fix || !progress || Date.now()-fix.timestamp>15000 || (!navigating && mode !== 'arrived')) return;
    if (Date.now() - lastSent.current < 1000 && !progress.arrived) return;
    lastSent.current = Date.now();
    const feature=road.data?.features.find(f=>f.along>=progress.along);
    link.enqueue([navMessage(route, progress, fix, ++sequence.current,{enabled:road.enabled,limit,feature})], 'nav');
  }, [progress, fix, route, navigating, mode, ble.status,road.data,road.enabled]);
  const plan = useCallback(async (place: Place, start = false, origin = originOverride??(canPreviewFrom(location.fix)?location.fix:null)) => {
    routeAbort.current?.abort();
    if(!origin){setSelected(place);setMode('preview');setRoute(null);setAlternatives([]);setLoading(false);setRouteError(null);setPendingGPS(start?'navigation':'preview');setSearchOpen(false);void location.start();return;}
    setPendingGPS(null);
    const controller = new AbortController(); routeAbort.current = controller;
    setLoading(true); setRouteError(null); setSearchError(null);setShareStatus(null);setNavigationError(null); setSearchOpen(false); setDetails(false);
    setSelected(place);setAlternatives([]); setRoute(null); setProgress(null); setMode('preview');
    try {
      const routes = await fetchRoutes(origin, place, controller.signal);
      if (controller.signal.aborted) return;
      setAlternatives(routes);setRoute(routes[0]); setMode(start ? 'navigating' : 'preview'); setFollow(true);
    } catch (err) { if (!controller.signal.aborted) setRouteError(friendlyError(err)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [location.fix,originOverride]);
  useEffect(() => {
    if (!awaitingGPS || !(pendingGPS==='navigation'?goodGPS:previewGPS) || !location.fix || !selected) return;
    const start=pendingGPS==='navigation';setPendingGPS(null);void plan(selected,start,location.fix);
  }, [pendingGPS, goodGPS, previewGPS, location.fix, selected, plan]);
  useEffect(() => {
    if (!navigating || !progress?.offRoute || !route || !location.fix || !goodGPS || rerouting || Date.now() - lastReroute.current < 15000) return;
    const controller = new AbortController(); routeAbort.current?.abort(); routeAbort.current = controller;
    lastReroute.current = Date.now(); setRerouting(true); setNavigationError(null);
    void fetchRoute(location.fix, route.destination, controller.signal).then(next => {
      if (!controller.signal.aborted) { setRoute(next); setProgress(null); setNavigationError(null); }
    }).catch(err => { if (!controller.signal.aborted) setNavigationError(`${friendlyError(err)} Tuyến cũ vẫn được giữ.`); }).finally(() => { if (!controller.signal.aborted) setRerouting(false); });
  }, [navigating, progress, route, location.fix, goodGPS,rerouting]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowBLE(false); setShowRoadData(false); setSearchOpen(false); setDetails(false); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  async function submitSearch(e: React.FormEvent) {
    e.preventDefault(); if (query.trim().length < 2 || searching) return;
    searchAbort.current?.abort(); const controller = new AbortController(); searchAbort.current = controller;
    setSearching(true); setSearched(true); setSearchOpen(true); setSearchError(null);setShareStatus(null);setNavigationError(null);
    try { const places = await searchPlaces(query, controller.signal); if (!controller.signal.aborted) setResults(places); }
    catch (err) { if (!controller.signal.aborted) { setResults([]); setSearchError(friendlyError(err)); } }
    finally { if (!controller.signal.aborted) setSearching(false); }
  }
  function stop() {
    routeAbort.current?.abort(); setLoading(false); setRerouting(false); setPendingGPS(null);
    setMode('explore');setOriginOverride(null);setAlternatives([]);setRoadAlert(null);setQuery('');setSearchTarget('destination'); setRoute(null); setProgress(null); setSelected(null); setSearchError(null);setShareStatus(null);setNavigationError(null); setRouteError(null); setDetails(false); silence();
    link.enqueue([{ v: 1, type: 'stop' }], 'control');
  }
  function startReal() {
    if (!selected) return;
    if(originOverride){setDetails(true);return;}
    if (!goodGPS || !location.fix) { setPendingGPS('navigation'); void location.start(); return; }
    if (!route || distance(location.fix, route.coordinates[0]) > 60) void plan(selected, true, location.fix);
    else { setMode('navigating'); setFollow(true); }
  }
  function toggleVoice() { setVoiceUnavailable(false); const next = !voice; setVoice(next); save('roadlink.voice', next); if (!next) silence();else spoken.current.clear(); }
  function choosePlace(place:Place){
    setPendingGPS(null);setShareStatus(null);setSearchError(null);setSearchOpen(false);setQuery(place.name);setSearched(false);
    if(searchTarget==='origin'){setOriginOverride(place);setSearchTarget('destination');if(selected)void plan(selected,false,place);return;}
    if(mode==='preview'){void plan(place);return;}
    routeAbort.current?.abort();setLoading(false);setRouteError(null);setSelected(place);setRoute(null);setAlternatives([]);setMode('place');
  }
  function editEndpoint(target:'origin'|'destination'){setSearchTarget(target);setQuery('');setSearched(false);setSearchOpen(true);}
  function useMyOrigin(){setOriginOverride(null);setSearchTarget('destination');setSearchOpen(false);if(!location.fix)void location.start();if(selected)void plan(selected,false,location.fix??null);}
  function swapEndpoints(){if(!selected)return;const from=originOverride??location.fix;if(!from){editEndpoint('origin');return;}const destination:Place={...from,id:`coord:${from.lat},${from.lng}`,name:originOverride?.name??'Vị trí của bạn',detail:originOverride?.detail??'Điểm đã chọn trên bản đồ'};setOriginOverride(selected);void plan(destination,false,selected);}
  async function sharePlace(){if(!selected)return;const text=`${selected.name}\n${selected.detail}\n${selected.lat}, ${selected.lng}`;try{if(navigator.share)await navigator.share({title:selected.name,text});else{await navigator.clipboard.writeText(text);setShareStatus('Đã sao chép địa điểm.');}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setShareStatus('Chưa chia sẻ được. Bạn có thể sao chép tọa độ trên thẻ địa điểm.');}}
  function toggleFavorite() { if (!selected) return; const next = favorites.includes(selected.id) ? favorites.filter(x => x !== selected.id) : [...favorites, selected.id]; setFavorites(next); save('roadlink.favorites', next); const places=next.includes(selected.id)?[...savedPlaces.filter(p=>p.id!==selected.id),selected]:savedPlaces.filter(p=>p.id!==selected.id);setSavedPlaces(places);save('roadlink.savedPlaces',places); }
  const activeStep = progress?.step ?? route?.steps.find(s => s.maneuver !== 'depart') ?? route?.steps[0];
  const saved = !!selected && favorites.includes(selected.id);
  const remainingSeconds = progress?.etaSeconds ?? route?.duration ?? 0;
  const eta = new Date(Date.now() + remainingSeconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return <main ref={appElement} className={`app maps-ui ${searchOpen?'is-searching':''} ${navigating ? 'is-navigating' : ''} ${mode === 'explore' ? 'is-exploring' : ''} ${mode==='preview'?'is-routing':''} ${mode==='place'?'is-selecting':''}`}>
    <MapView route={route} alternatives={alternatives} destination={mode==='place'?selected:null} onSelectRoute={r=>{setRoute(r);setProgress(null);}} onPick={at=>{if(!navigating)choosePlace({...at,id:`pin:${at.lat},${at.lng}`,name:'Địa điểm đã ghim',detail:`${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}`});}} roadData={mapRoadData} position={fix} focusPosition={mode==='explore'} positionStale={!!fix&&now-fix.timestamp>15000} navigating={navigating} follow={follow} onDrag={() => setFollow(false)} onTileError={() => setTileWarning(true)} recenter={recenter} mode3D={mode3D} northReset={northReset} onBearing={setMapBearing}/>
    <div className="map-shade" />
    <header className="topbar">
      <button className="brand" onClick={stop} aria-label="RoadLink — về trang chính"><span className="brand-mark"><Navigation2 size={25} fill="currentColor" /></span><span>road<span className="brand-light">link</span></span></button>
      {!navigating && mode !== 'arrived'&&(mode!=='preview'||searchOpen) && <div className="search-wrap"><form className="search-box" onSubmit={submitSearch} role="search"><Search size={21} /><input aria-label={searchTarget==='origin'?'Tìm điểm đi':'Tìm địa điểm'} placeholder={searchTarget==='origin'?'Chọn điểm đi':'Tìm kiếm ở đây'} value={query} onChange={e => { setQuery(e.target.value); setSearched(false); }} onFocus={() => setSearchOpen(true)} /><button type="submit" aria-label="Tìm kiếm" disabled={searching || query.trim().length < 2}>{searching ? <LoaderCircle className="spin" size={19} /> : <ArrowRight size={20} />}</button></form>
        {searchOpen && <div className="search-results"><div className="section-label">{searched ? 'KẾT QUẢ TÌM KIẾM' : 'ĐỊA ĐIỂM ĐÃ LƯU'}<button aria-label="Đóng tìm kiếm" onClick={() => setSearchOpen(false)}><X size={17} /></button></div>{searchTarget==='origin'&&<><button className="place-result" onClick={useMyOrigin}><LocateFixed size={20}/><strong>Vị trí của bạn</strong></button><button className="place-result" onClick={()=>setSearchOpen(false)}><MapPin size={20}/><strong>Chọn điểm đi trên bản đồ</strong></button></>}{searchError?<p className="search-empty" role="alert">{searchError}</p>:searching ? <p className="search-empty">Đang tìm địa điểm…</p> : searched && !results.length ? <p className="search-empty">Chưa tìm thấy địa điểm. Thử thêm tên thành phố hoặc địa chỉ.</p> : (searched ? results : savedPlaces).map(place => <button className="place-result" key={place.id} onClick={() => choosePlace(place)}><span className="place-icon"><MapPin size={19} /></span><span><strong>{place.name}</strong><small>{place.detail}</small></span><ChevronRight size={17} /></button>)}</div>}
      </div>}
      <button className={`device-button ${ble.status === 'connected' ? 'connected' : ''}`} onClick={() => setShowBLE(true)} aria-label="Mở kết nối Bluetooth">{ble.status === 'connected' ? <BluetoothConnected size={20} /> : <Bluetooth size={20} />}<span>{ble.status === 'connected' ? 'ESP32 đã kết nối' : 'Kết nối thiết bị'}</span><span className="device-dot" /></button>
    </header>
    {mode==='preview'&&<RouteInputs origin={originOverride?.name??(location.fix?'Vị trí của bạn':'Chọn điểm đi')} destination={selected?.name??'Chọn điểm đến'} back={()=>{routeAbort.current?.abort();setLoading(false);setRoute(null);setAlternatives([]);setMode('place');}} editOrigin={()=>editEndpoint('origin')} editDestination={()=>editEndpoint('destination')} swap={swapEndpoints}/>}
    {navigating && activeStep && <section className="turn-banner" aria-label="Chỉ dẫn tiếp theo"><div className="turn-symbol"><ManeuverIcon type={activeStep.maneuver} size={39} /></div><div><span>{rerouting ? 'Đang tìm đường mới…' : `Sau ${formatDistance(progress?.nextTurn ?? activeStep.offset)}`}</span><h1>{activeStep.instruction}</h1><small>Theo biển báo và tình hình đường thực tế</small></div></section>}
    <div className="map-controls"><button className={`map-control mode3d-control ${mode3D?'active':''}`} aria-label={mode3D?'Chuyển bản đồ 2D':'Chuyển bản đồ 3D'} aria-pressed={mode3D} title="Nghiêng bản đồ; phóng to để xem nhà 3D" onClick={()=>setMode3D(value=>!value)}>{mode3D?'2D':'3D'}</button><button className={`map-control ${road.enabled?'active':''}`} aria-label="Mở dữ liệu đường" onClick={()=>setShowRoadData(true)}><Layers2 size={22}/></button><button className="map-control compass-control" aria-label="Hướng Bắc" title="Đưa hướng Bắc về phía trên" onClick={()=>setNorthReset(value=>value+1)}><Compass size={23} style={{transform:`rotate(${-mapBearing}deg)`}}/><small>N</small></button><button className={`map-control ${follow && fix ? 'active' : ''}`} aria-label="Về vị trí của tôi" onClick={() => { setFollow(true); setRecenter(x => x + 1); void location.start(); }}>{location.requesting ? <LoaderCircle className="spin" size={22} /> : <LocateFixed size={23} />}</button><button className="map-control" aria-label={voice ? 'Tắt giọng nói' : 'Bật giọng nói'} onClick={toggleVoice}>{voice ? <Volume2 size={22} /> : <VolumeX size={22} />}</button></div>
    <section ref={panelElement} className={`bottom-panel ${mode === 'explore' ? 'explore-panel' : ''} ${mode === 'preview' ? 'preview-panel' : ''} ${mode==='place'?'place-panel':''}`}>
      <div className="sheet-handle" />
      <LocationStatus fix={fix} requesting={location.requesting} error={location.error} now={now} retry={()=>void location.start()} chooseOrigin={mode==='preview'?()=>editEndpoint('origin'):undefined}/>
      {tileWarning&&<p className="inline-feedback">Một số ô bản đồ chưa tải được. Kiểm tra kết nối mạng.</p>}
      {mode3D&&<p className="map-3d-hint">Chế độ 3D · Phóng to để xem nhà khối tại nơi có dữ liệu chiều cao. Có thể dùng hai ngón tay để nghiêng và xoay bản đồ.</p>}
      {mode === 'explore' && <>
        <h2 className="destinations-heading">Điểm đến</h2>
        {savedPlaces.length?<div className="quick-destinations">{savedPlaces.slice(0,4).map((place,i)=><button key={place.id} onClick={()=>choosePlace(place)}><span className={`quick-icon quick-${i}`}><MapPin size={20}/></span><strong>{place.name}</strong><span>{place.detail}</span><ChevronRight size={17}/></button>)}</div>:<p className="explore-help">Tìm địa chỉ, nhập tọa độ hoặc chạm lên bản đồ để chọn điểm đến.</p>}
        <div className="independent-note"><ShieldCheck size={15} /><span>Dẫn đường độc lập · Bluetooth là tùy chọn</span></div>
      </>}
      {mode==='place'&&selected&&<PlaceCard place={selected} saved={saved} shareStatus={shareStatus} onRoute={()=>void plan(selected)} onSave={toggleFavorite} onShare={()=>void sharePlace()} onClose={stop}/>}
      {mode === 'preview' && <>
        <RoutePlannerCard route={route} alternatives={alternatives} selected={selected} loading={loading} error={routeError} customOrigin={!!originOverride} awaitingGPS={awaitingGPS} locationError={location.error} details={details} back={stop} retry={()=>selected&&void plan(selected)} start={startReal} select={r=>{setRoute(r);setProgress(null);}} toggleDetails={()=>setDetails(!details)} roadData={()=>setShowRoadData(true)}/>
      </>}
      {navigating && route && <>
        {navigating&&roadAlert&&!staleGPS&&!progress?.offRoute&&<aside className="navigation-road-alert" role="status" aria-label="Cảnh báo trên tuyến">{roadAlert.kind==='camera'?<img className="road-feature-image" src="/signs/camera.svg" alt="Biểu tượng camera"/>:roadAlert.kind==='limit'||roadAlert.kind==='overspeed'?<SpeedLimitImage kmh={limit.kmh} small/>:<img className="road-feature-image" src={roadAlert.feature?roadSymbol(roadAlert.feature).src:'/signs/unknown.svg'} alt={roadAlert.feature?.label??'Điểm cảnh báo'}/>}<div><strong>{roadAlert.title}</strong><p>{roadAlert.text}</p><small>OSM · CHƯA XÁC MINH THỰC ĐỊA</small></div></aside>}
        {navigationError&&<p className="inline-feedback">{navigationError}</p>}
        {voice&&voiceUnavailable&&<p className="inline-feedback">Thiết bị chưa có giọng tiếng Việt. Hãy tải giọng tiếng Việt trong cài đặt giọng nói.</p>}
        <div className="navigation-summary"><div className="arrival-time"><span>ĐẾN LÚC</span><strong>{eta}</strong><small>{route.destination.name}</small></div><div className="remaining-stats"><strong>{formatDuration(remainingSeconds)}</strong><span>{formatDistance(progress?.remaining ?? route.distance)} còn lại</span></div><div className="speed-badge"><strong>{Math.round(Math.max(0,fix?.speed??0)*3.6)}</strong><span>km/h</span></div>{road.enabled&&navigating&&roadFilters.speed&&<button className="road-limit-badge inline-limit" aria-label="Xem giới hạn tốc độ ghi nhận" onClick={()=>setShowRoadData(true)}><small>GIỚI HẠN</small><SpeedLimitImage kmh={limit.kmh}/><span className="road-source">{limit.kmh===null?'CHƯA CÓ DỮ LIỆU':'km/h · OSM'}</span></button>}</div>
        <div className="trip-progress"><span style={{ width: `${100 * (1 - (progress?.remaining ?? route.distance) / route.distance)}%` }} /></div>
        <div className="navigation-actions"><button className="stop-button" onClick={stop}><X size={18} />Kết thúc</button><button className="text-button" onClick={() => setDetails(!details)}><RouteIcon size={18} />Các chặng</button><span className="phone-status"><Signal size={15} />{ble.status === 'connected' ? 'BLE đã kết nối' : 'Trên điện thoại'}</span></div>
      </>}
      {mode === 'arrived' && <div className="arrived-panel"><span className="arrived-icon"><Flag size={32} /></span><span className="eyebrow">HÀNH TRÌNH HOÀN TẤT</span><h1>Bạn đã đến nơi<span className="accent">.</span></h1><p>{route?.destination.name}</p><button className="button primary full" onClick={stop}><Check size={20} />Về bản đồ</button></div>}
      {details && route && <ol className="directions-list" aria-label="Danh sách chỉ dẫn">{route.steps.map(step => <li key={step.index} className={activeStep?.index === step.index && navigating ? 'current-step' : ''}><ManeuverIcon type={step.maneuver} size={22} /><div><strong>{step.instruction}</strong><span>{step.maneuver === 'arrive' ? 'Điểm đến' : formatDistance(step.distance)}</span></div></li>)}</ol>}
    </section>
    <footer className="map-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a><span>·</span><a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a><span>·</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OSM contributors</a><span>· OSRM</span></footer>
    {showBLE && <BluetoothPanel state={ble} close={() => setShowBLE(false)} connect={() => void link.connect()} disconnect={() => void link.disconnect()} />}
    {showRoadData&&<RoadDataPanel route={route} data={displayRoadData} loading={road.overviewLoading} error={road.overviewError??road.error} retry={road.retry} close={()=>setShowRoadData(false)} filters={roadFilters} setFilters={setRoadFilters} limit={limit} along={progress?.along??0} navigating={navigating}/>}
  </main>;
}

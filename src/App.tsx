import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Banknote, BedDouble, Bluetooth, BluetoothConnected, Briefcase, CarFront, Check, ChevronRight, Clock3, Coffee, Compass, Flag, Fuel, Heart, House, Layers2, LocateFixed, MapPin, Navigation2, Pause, Pencil, Play, Route as RouteIcon, Search, ShoppingBasket, Signal, SlidersHorizontal, Sparkles, UtensilsCrossed, Volume2, VolumeX, X, LoaderCircle, TriangleAlert } from 'lucide-react';
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
import {canNavigateFrom,canPreviewFrom} from './domain/location';
import { bearing, cumulative, distance, formatDistance, formatDuration, pointAt } from './domain/geometry';
import { Navigator } from './domain/navigation';
import type { Coordinate, Fix, Place, Progress, Route } from './domain/types';
import { useLocation } from './hooks/useLocation';
import { categoryForQuery,fetchRoute,fetchRoutes, friendlyError, NEARBY_RADIUS_M, nearbyCategory, nearbyPlaces, searchPlaces, type TransportProfile } from './services/api';
import { BluetoothLink, type BluetoothState } from './services/bluetooth';
import { navMessage, routeMessages } from './services/protocol';
import { say, silence } from './services/voice';
import { KeepAwake } from '@capacitor-community/keep-awake';
type Mode = 'explore' | 'place' | 'preview' | 'navigating' | 'arrived';
const EXPLORE_CATEGORIES = [
  { label: 'Nhà hàng', Icon: UtensilsCrossed, color: '#e37400' },
  { label: 'Cây xăng', Icon: Fuel, color: '#1a73e8' },
  { label: 'Cà phê', Icon: Coffee, color: '#a1662f' },
  { label: 'Khách sạn', Icon: BedDouble, color: '#9334e6' },
  { label: 'ATM', Icon: Banknote, color: '#188038' },
  { label: 'Tạp hóa', Icon: ShoppingBasket, color: '#e37400' }
] as const;
function stored<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ } }
const STORAGE_SCHEMA = 2;
try {
  const schema = Number(localStorage.getItem('roadlink.schema') || 0);
  if (schema < STORAGE_SCHEMA) {
    localStorage.removeItem('roadlink.savedPlacesLegacy');
    localStorage.setItem('roadlink.schema', String(STORAGE_SCHEMA));
  }
} catch { /* Storage is optional. */ }
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
  const [stops,setStops]=useState<Place[]>([]);
  const [searchTarget,setSearchTarget]=useState<string>('destination');
  const [roadAlert,setRoadAlert]=useState<RoadAlert|null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError,setSearchError]=useState<string|null>(null);
  const [nearbyNote,setNearbyNote]=useState<string|null>(null);
  const [nearbyList,setNearbyList]=useState<Place[]>([]);
  const [nearbyLoading,setNearbyLoading]=useState(false);
  const [nearbyError,setNearbyError]=useState<string|null>(null);
  const [nearbyRetry,setNearbyRetry]=useState(0);
  const [shareStatus,setShareStatus]=useState<string|null>(null);
  const [navigationError,setNavigationError]=useState<string|null>(null);
  const [voiceUnavailable,setVoiceUnavailable]=useState(false);
  const [savedPlaces,setSavedPlaces]=useState<Place[]>(()=>{const value=stored<unknown>('roadlink.savedPlaces',[]);return Array.isArray(value)?value.filter((p):p is Place=>!!p&&typeof p==='object'&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.detail==='string'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180):[];});
  function isPlace(p:unknown):p is Place{return !!p&&typeof p==='object'&&typeof (p as Place).id==='string'&&typeof (p as Place).name==='string'&&typeof (p as Place).detail==='string'&&Number.isFinite((p as Place).lat)&&Math.abs((p as Place).lat)<=90&&Number.isFinite((p as Place).lng)&&Math.abs((p as Place).lng)<=180;}
  const [home,setHome]=useState<Place|null>(()=>{const v=stored<unknown>('roadlink.home',null);return isPlace(v)?v:null;});
  const [work,setWork]=useState<Place|null>(()=>{const v=stored<unknown>('roadlink.work',null);return isPlace(v)?v:null;});
  const [recentPlaces,setRecentPlaces]=useState<Place[]>(()=>{const value=stored<unknown>('roadlink.recentSearches',[]);return Array.isArray(value)?value.filter((p):p is Place=>!!p&&typeof p==='object'&&typeof p.id==='string'&&typeof p.name==='string'):[];});
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [pendingGPS,setPendingGPS]=useState<'preview'|'navigation'|null>(null);
  const awaitingGPS=pendingGPS!==null;
  const [follow, setFollow] = useState(true);
  const [recenter, setRecenter] = useState(0);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState<number | null>(null);
  const sheetDrag = useRef<{ startY: number; base: number; moved: boolean } | null>(null);
  const sheetDragOffsetRef = useRef(0);
  const suppressSheetClick = useRef(false);
  const [details, setDetails] = useState(false);
  const [voice, setVoice] = useState(() => stored('roadlink.voice', true) === true);
  const [favorites, setFavorites] = useState<string[]>(() => { const v = stored<unknown>('roadlink.favorites', []); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; });
  const [ble, setBle] = useState<BluetoothState>({ status: 'disconnected' });
  const [preferredEsp, setPreferredEsp] = useState<string>(() => stored('roadlink.preferredESP32', ''));
  const [termsAccepted, setTermsAccepted] = useState(() => stored<unknown>('roadlink.termsAccepted', false) === true);
  const [showBLE, setShowBLE] = useState(false);
  const [showRoadData,setShowRoadData]=useState(false);
  const [roadFilters,setRoadFilters]=useState<RoadFilters>(()=>{const v=stored<Partial<RoadFilters>>('roadlink.roadFilters',{});return{speed:v.speed!==false,cameras:v.cameras!==false,signs:v.signs!==false,signals:v.signals!==false};});
  const [roadLayerEnabled,setRoadLayerEnabled]=useState(()=>stored<unknown>('roadlink.roadData',true)!==false);
  const [showScale,setShowScale]=useState(()=>stored<unknown>('roadlink.showScale',true)!==false);
  const [warnDistance,setWarnDistance]=useState(()=>{const value=stored<unknown>('roadlink.warnDistance',500);return value===200||value===500||value===900?value:500;});
  const [rerouting, setRerouting] = useState(false);
  const [tileWarning, setTileWarning] = useState(false);
  const [mode3D,setMode3D]=useState(()=>stored<unknown>('roadlink.mode3D',false)===true),[northReset,setNorthReset]=useState(0),[headingUp,setHeadingUp]=useState(0),[mapBearing,setMapBearing]=useState(0);
  const [focusPoint,setFocusPoint]=useState<Coordinate|null>(null);
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk'>(()=>{const v=stored<string>('roadlink.transport','car');return v==='bike'||v==='walk'?v:'car';});
  useEffect(()=>{save('roadlink.roadFilters',roadFilters)},[roadFilters]);
  useEffect(()=>{save('roadlink.roadData',roadLayerEnabled)},[roadLayerEnabled]);
  useEffect(()=>{save('roadlink.showScale',showScale)},[showScale]);
  useEffect(()=>{save('roadlink.warnDistance',warnDistance)},[warnDistance]);
  useEffect(()=>{save('roadlink.mode3D',mode3D)},[mode3D]);
  useEffect(()=>{save('roadlink.transport',transportMode)},[transportMode]);
  useEffect(()=>{ if(ble.status==='connected'&&ble.name&&ble.name!==preferredEsp){ setPreferredEsp(ble.name); save('roadlink.preferredESP32',ble.name); } },[ble.status,ble.name,preferredEsp]);
  useEffect(()=>{ save('roadlink.termsAccepted', termsAccepted); },[termsAccepted]);
  useEffect(()=>{
    const onStorage=(event:StorageEvent)=>{
      if(event.key==='roadlink.favorites')setFavorites(stored<string[]>('roadlink.favorites',[]).filter(value=>typeof value==='string'));
      if(event.key==='roadlink.savedPlaces')setSavedPlaces(stored<Place[]>('roadlink.savedPlaces',[]));
      if(event.key==='roadlink.recentSearches'){const value=stored<unknown>('roadlink.recentSearches',[]);setRecentPlaces(Array.isArray(value)?value.filter((p):p is Place=>!!p&&typeof p==='object'&&typeof p.id==='string'&&typeof p.name==='string'):[]);}
    };
    window.addEventListener('storage',onStorage);
    return()=>window.removeEventListener('storage',onStorage);
  },[]);
  const [now, setNow] = useState(Date.now());
  const routeAbort = useRef<AbortController | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const nearbySearch = useRef(false);
  const categorySearch = useRef(false);
  const nearbyCell = useRef('');
  const nearbyAbort = useRef<AbortController | null>(null);
  const nearbyToken = useRef(0);
  const nearbyCellKey = location.fix ? `${location.fix.lat.toFixed(2)},${location.fix.lng.toFixed(2)}` : '';
  const engine = useRef<Navigator | null>(null);
  const spoken = useRef(new Set<string>());
  const lastReroute = useRef(0);
  const sequence = useRef(0);
  const lastSent = useRef(0);
  const roadAlertEngine=useRef(new RoadAlertEngine(warnDistance));
  const lastVoiceAt=useRef(0);
  const appElement=useRef<HTMLElement|null>(null),panelElement=useRef<HTMLElement|null>(null);
  const fix = location.fix;
  const navigating = mode === 'navigating';
  const goodGPS = canNavigateFrom(location.fix,now);
  const previewGPS=canPreviewFrom(location.fix,now);
  const staleGPS = navigating && !!location.fix && now - location.fix.timestamp > 15000;
  const road=useRoadData(route,progress?.along??0,roadLayerEnabled);
  const displayRoadData=road.overview??road.data;
  const limit=navigating?currentLimit(road.data,route,fix,progress?.along??0,progress?.offRoute):UNKNOWN_LIMIT;
  const mapRoadData=useMemo(()=>roadLayerEnabled&&displayRoadData?{...displayRoadData,sections:roadFilters.speed?displayRoadData.sections:[],features:displayRoadData.features.filter(f=>roadFilters[groupFor(f.kind)])}:null,[displayRoadData,roadFilters,roadLayerEnabled]);
  useEffect(()=>{
    const panel=panelElement.current;if(!panel)return;
    const update=()=>appElement.current?.style.setProperty('--panel-height',sheetCollapsed?'calc(58px + var(--safe-bottom))':`${panel.getBoundingClientRect().height}px`);
    update();
    const observer=new ResizeObserver(update);observer.observe(panel);
    return()=>observer.disconnect();
  },[sheetCollapsed]);
  useEffect(()=>{setSheetCollapsed(false);},[mode]);
  useEffect(() => link.subscribe(setBle), []);
  useEffect(() => { if (ble.received === 'exit-request') stop(); }, [ble.received]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 2000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (navigating) void KeepAwake.keepAwake().catch(() => undefined);
    else void KeepAwake.allowSleep().catch(() => undefined);
    return () => { void KeepAwake.allowSleep().catch(() => undefined); };
  }, [navigating]);
  useEffect(() => () => { routeAbort.current?.abort(); searchAbort.current?.abort(); silence(); }, []);
  useEffect(() => {
    roadAlertEngine.current=new RoadAlertEngine(warnDistance);
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
    if (Date.now() - lastSent.current < 250 && !progress.arrived) return;
    lastSent.current = Date.now();
    const feature=road.data?.features.find(f=>f.along>=progress.along);
    link.enqueue([navMessage(route, progress, fix, ++sequence.current,{enabled:road.enabled,limit,feature})], 'nav');
  }, [progress, fix, route, navigating, mode, ble.status,road.data,road.enabled]);
  const plan = useCallback(async (place: Place, start = false, origin = originOverride??(canPreviewFrom(location.fix)?location.fix:null), profile: TransportProfile = transportMode, viaStops: Place[] = stops) => {
    routeAbort.current?.abort();
    if(!origin){setSelected(place);setMode('preview');setRoute(null);setAlternatives([]);setLoading(false);setRouteError(null);setPendingGPS(start?'navigation':'preview');setSearchOpen(false);void location.start();return;}
    setPendingGPS(null);
    const controller = new AbortController(); routeAbort.current = controller;
    setLoading(true); setRouteError(null); setSearchError(null);setShareStatus(null);setNavigationError(null); setSearchOpen(false); setDetails(false);
    setSelected(place);setAlternatives([]); setRoute(null); setProgress(null); setMode('preview');
    try {
      const routes = await fetchRoutes(origin, place, controller.signal, viaStops.map(s=>({lat:s.lat,lng:s.lng})), profile);
      if (controller.signal.aborted) return;
      setAlternatives(routes);setRoute(routes[0]); setMode(start ? 'navigating' : 'preview'); setFollow(true);
    } catch (err) { if (!controller.signal.aborted) setRouteError(friendlyError(err)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [location.fix,originOverride,transportMode,stops]);
  const transportRef = useRef(transportMode);
  useEffect(() => {
    if (transportRef.current === transportMode) return;
    transportRef.current = transportMode;
    if (selected && mode === 'preview') void plan(selected, false, originOverride ?? (canPreviewFrom(location.fix) ? location.fix : null), transportMode);
  }, [transportMode, selected, mode, plan, originOverride, location.fix]);
  useEffect(() => {
    if (!awaitingGPS || !(pendingGPS==='navigation'?goodGPS:previewGPS) || !location.fix || !selected) return;
    const start=pendingGPS==='navigation';setPendingGPS(null);void plan(selected,start,location.fix);
  }, [pendingGPS, goodGPS, previewGPS, location.fix, selected, plan]);
  useEffect(() => {
    if (!navigating || !progress?.offRoute || !route || !location.fix || !goodGPS || rerouting || Date.now() - lastReroute.current < 15000) return;
    const controller = new AbortController(); routeAbort.current?.abort(); routeAbort.current = controller;
    lastReroute.current = Date.now(); setRerouting(true); setNavigationError(null);
    void fetchRoute(location.fix, route.destination, controller.signal, transportMode).then(next => {
      if (!controller.signal.aborted) { setRoute(next); setProgress(null); setNavigationError(null); }
    }).catch(err => { if (!controller.signal.aborted) setNavigationError(`${friendlyError(err)} Tuyến cũ vẫn được giữ.`); }).finally(() => { if (!controller.signal.aborted) setRerouting(false); });
  }, [navigating, progress, route, location.fix, goodGPS,rerouting,transportMode]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowBLE(false); setShowRoadData(false); setSearchOpen(false); setDetails(false); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) return;
    const timer = setTimeout(() => {
      if (categorySearch.current) { categorySearch.current = false; return; }
      void performSearch(query, { nearby: nearbySearch.current });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchOpen]);
  useEffect(() => { if (!searchOpen) setNearbyNote(null); }, [searchOpen]);
  useEffect(() => {
    if (mode !== 'explore' || !nearbyCellKey) {
      nearbyToken.current++;
      nearbyAbort.current?.abort();
      nearbyCell.current = '';
      if (!nearbyCellKey) {
        setNearbyList([]);
        setNearbyError(null);
      }
      setNearbyLoading(false);
      return;
    }
    if (nearbyCellKey === nearbyCell.current) return;
    nearbyCell.current = nearbyCellKey;
    const token = ++nearbyToken.current;
    const [lat, lng] = nearbyCellKey.split(',').map(Number);
    nearbyAbort.current?.abort();
    const controller = new AbortController();
    nearbyAbort.current = controller;
    setNearbyLoading(true);
    setNearbyError(null);
    void nearbyPlaces(lat, lng, controller.signal)
      .then(list => {
        if (token !== nearbyToken.current) return;
        setNearbyList(list);
        setNearbyError(null);
      })
      .catch(err => { if (token === nearbyToken.current) setNearbyError(friendlyError(err)); })
      .finally(() => { if (token === nearbyToken.current) setNearbyLoading(false); });
  }, [mode, nearbyCellKey, nearbyRetry]);

  async function performSearch(text: string, options?: { nearby?: boolean }) {
    if (text.trim().length < 2) return;
    const origin = options?.nearby ? (location.fix ?? route?.coordinates[0] ?? null) : null;
    if (options?.nearby) {
      setNearbyNote(origin ? null : 'Chưa có vị trí để tìm gần nhất. Bật định vị hoặc chọn điểm đi; đang tìm trên toàn quốc.');
    } else {
      setNearbyNote(null);
    }
    searchAbort.current?.abort(); const controller = new AbortController(); searchAbort.current = controller;
    setSearching(true); setSearched(true); setSearchOpen(true); setSearchError(null); setShareStatus(null); setNavigationError(null);
    try { const places = await searchPlaces(text, controller.signal, origin ? { lat: origin.lat, lng: origin.lng } : undefined); if (!controller.signal.aborted) setResults(places); }
    catch (err) { if (!controller.signal.aborted) { setResults([]); setSearchError(friendlyError(err)); } }
    finally { if (!controller.signal.aborted) setSearching(false); }
  }
  async function searchCategory(label: string) {
    const category = categoryForQuery(label);
    if (!category) { void performSearch(label, { nearby: true }); return; }
    categorySearch.current = true; nearbySearch.current = true;
    searchAbort.current?.abort();
    const origin = location.fix ?? route?.coordinates[0] ?? null;
    setQuery(label); setSearchOpen(true); setSearched(true); setSearchError(null); setResults([]); setShareStatus(null); setNavigationError(null);
    setNearbyNote(origin ? null : 'Bật định vị để tìm địa điểm gần nhất quanh bạn.');
    if (!origin) { setSearching(false); return; }
    const controller = new AbortController(); searchAbort.current = controller;
    setSearching(true);
    try {
      const list = await nearbyCategory(origin.lat, origin.lng, category, controller.signal);
      if (controller.signal.aborted) return;
      setResults(list);
      if (!list.length) setNearbyNote(`Không có ${label.toLowerCase()} trong ${NEARBY_RADIUS_M / 1000} km quanh vị trí này.`);
    } catch (error) {
      if (!controller.signal.aborted) setSearchError(friendlyError(error));
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }
  async function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (categorySearch.current) { categorySearch.current = false; void searchCategory(query); return; }
    void performSearch(query, { nearby: nearbySearch.current });
  }
  function stop() {
    nearbySearch.current=false;
    routeAbort.current?.abort(); setLoading(false); setRerouting(false); setPendingGPS(null);
    setMode('explore');setOriginOverride(null);setStops([]);setAlternatives([]);setRoadAlert(null);setQuery('');setSearchTarget('destination'); setRoute(null); setProgress(null); setSelected(null); setSearchError(null);setNearbyNote(null);setShareStatus(null);setNavigationError(null); setRouteError(null); setDetails(false); silence();
    link.enqueue([{ v: 1, type: 'stop' }], 'control');
  }
  function startReal() {
    if (!selected) return;
    if(originOverride){setDetails(true);return;}
    if (!goodGPS || !location.fix) { setPendingGPS('navigation'); void location.start(); return; }
    if (!route || distance(location.fix, route.coordinates[0]) > 60) void plan(selected, true, location.fix);
    else { setMode('navigating'); setFollow(true); setMode3D(true); }
  }
  function toggleVoice() { setVoiceUnavailable(false); const next = !voice; setVoice(next); save('roadlink.voice', next); if (!next) silence();else spoken.current.clear(); }
  function choosePlace(place:Place){
    const recent=[place,...recentPlaces.filter(item=>item.id!==place.id)].slice(0,10);
    setRecentPlaces(recent);save('roadlink.recentSearches',recent);
    nearbySearch.current=false;categorySearch.current=false;setNearbyNote(null);
    setPendingGPS(null);setShareStatus(null);setSearchError(null);setSearchOpen(false);setQuery(place.name);setSearched(false);
    if(searchTarget==='home'||searchTarget==='work'){
      if(searchTarget==='home'){setHome(place);save('roadlink.home',place);} else {setWork(place);save('roadlink.work',place);}
      setSearchTarget('destination');setQuery('');
      return;
    }
    if(searchTarget==='origin'){setOriginOverride(place);setSearchTarget('destination');if(selected)void plan(selected,false,place);return;}
    if(searchTarget.startsWith('stop:')){
      const index=Number(searchTarget.slice(5));
      const nextStops=index<stops.length?stops.map((s,i)=>i===index?place:s):[...stops,place];
      setStops(nextStops);setSearchTarget('destination');
      if(selected)void plan(selected,false,originOverride??(canPreviewFrom(location.fix)?location.fix:null),transportMode,nextStops);
      return;
    }
    if(mode==='preview'){void plan(place);return;}
    routeAbort.current?.abort();setLoading(false);setRouteError(null);setSelected(place);setRoute(null);setAlternatives([]);setMode('place');
  }
  function editEndpoint(target:string){nearbySearch.current=false;setNearbyNote(null);setSearchTarget(target);setQuery('');setSearched(false);setSearchOpen(true);searchInputRef.current?.focus();}
  function setHomeWorkTarget(target:'home'|'work'){editEndpoint(target);}
  function addStop(){editEndpoint(`stop:${stops.length}`);}
  function removeStop(index:number){
    const nextStops=stops.filter((_,i)=>i!==index);
    setStops(nextStops);
    if(selected)void plan(selected,false,originOverride??(canPreviewFrom(location.fix)?location.fix:null),transportMode,nextStops);
  }
  function useMyOrigin(){setOriginOverride(null);setSearchTarget('destination');setSearchOpen(false);if(!location.fix)void location.start();if(selected)void plan(selected,false,location.fix??null);}
  function swapEndpoints(){if(!selected)return;const from=originOverride??location.fix;if(!from){editEndpoint('origin');return;}const destination:Place={...from,id:`coord:${from.lat},${from.lng}`,name:originOverride?.name??'Vị trí của bạn',detail:originOverride?.detail??'Điểm đã chọn trên bản đồ'};const reversedStops=[...stops].reverse();setOriginOverride(selected);setStops(reversedStops);void plan(destination,false,selected,transportMode,reversedStops);}
  async function sharePlace(){if(!selected)return;const text=`${selected.name}\n${selected.detail}\n${selected.lat}, ${selected.lng}`;try{if(navigator.share)await navigator.share({title:selected.name,text});else{await navigator.clipboard.writeText(text);setShareStatus('Đã sao chép địa điểm.');}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setShareStatus('Chưa chia sẻ được. Bạn có thể sao chép tọa độ trên thẻ địa điểm.');}}
  function toggleFavorite() { if (!selected) return; const next = favorites.includes(selected.id) ? favorites.filter(x => x !== selected.id) : [...favorites, selected.id]; setFavorites(next); save('roadlink.favorites', next); const places=next.includes(selected.id)?[...savedPlaces.filter(p=>p.id!==selected.id),selected]:savedPlaces.filter(p=>p.id!==selected.id);setSavedPlaces(places);save('roadlink.savedPlaces',places); }
  function exportFavorites(){const blob=new Blob([JSON.stringify(savedPlaces,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='roadlink-favorites.json';link.click();URL.revokeObjectURL(url);}
  function importFavorites(file:File){const reader=new FileReader();reader.onload=()=>{try{const value:unknown=JSON.parse(String(reader.result));if(!Array.isArray(value))return;const places=value.filter((p):p is Place=>!!p&&typeof p==='object'&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.detail==='string'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180);setSavedPlaces(places);setFavorites(places.map(p=>p.id));save('roadlink.savedPlaces',places);save('roadlink.favorites',places.map(p=>p.id));}catch{/* ignore invalid file */}};reader.readAsText(file);}
  const activeStep = progress?.step ?? route?.steps.find(s => s.maneuver !== 'depart') ?? route?.steps[0];
  const saved = !!selected && favorites.includes(selected.id);
  const baseSeconds = progress?.etaSeconds ?? route?.duration ?? 0;
  const remainingSeconds = baseSeconds;
  const eta = new Date(Date.now() + remainingSeconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return <main ref={appElement} className={`app maps-ui ${searchOpen?'is-searching':''} ${navigating ? 'is-navigating' : ''} ${mode === 'explore' ? 'is-exploring' : ''} ${mode==='preview'?'is-routing':''} ${mode==='place'?'is-selecting':''}`}>
    <MapView route={route} alternatives={alternatives} destination={mode==='place'?selected:null} stops={stops} onSelectRoute={r=>{setRoute(r);setProgress(null);}} onPick={at=>{setSearchOpen(false);if(!navigating)choosePlace({...at,id:`pin:${at.lat},${at.lng}`,name:'Địa điểm đã ghim',detail:`${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}`});}} roadData={mapRoadData} position={fix} focusPosition={mode==='explore'} positionStale={!!fix&&now-fix.timestamp>15000} navigating={navigating} follow={follow} onDrag={() => setFollow(false)} onTileError={() => setTileWarning(true)} recenter={recenter} mode3D={mode3D} northReset={northReset} headingUp={headingUp} focusPoint={focusPoint} showScale={showScale} onBearing={setMapBearing}/>
    <div className="map-shade" />
    <header className="topbar">
      <button className="brand" onClick={stop} aria-label="RoadLink — về trang chính"><span className="brand-mark"><Navigation2 size={25} fill="currentColor" /></span><span>road<span className="brand-light">link</span></span></button>
      {!navigating && mode !== 'arrived' && mode !== 'preview' && <div className="search-wrap">
        <form className="search-box" onSubmit={submitSearch} role="search">
          {searchOpen ? (
            <button type="button" className="search-back-btn" aria-label="Đóng tìm kiếm" onClick={() => setSearchOpen(false)}>
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Search size={20} className="search-glass-icon" />
          )}
          <input
            ref={searchInputRef}
            aria-label="Tìm địa điểm"
            placeholder="Tìm kiếm ở đây"
            value={query}
            onChange={e => { nearbySearch.current = false; categorySearch.current = false; setQuery(e.target.value); setSearched(false); }}
            onFocus={() => setSearchOpen(true)}
          />
          {query.length > 0 && (
            <button type="button" className="search-clear-btn" aria-label="Xóa tìm kiếm" onClick={() => { nearbySearch.current=false; categorySearch.current=false; searchAbort.current?.abort(); setSearching(false); setResults([]); setQuery(''); setSearched(false); setNearbyNote(null); searchInputRef.current?.focus(); }}>
              <X size={20} />
            </button>
          )}
          <button type="submit" aria-label="Tìm kiếm" className="search-submit-btn" disabled={searching || query.trim().length < 2}>
            {searching ? <LoaderCircle className="spin" size={20} /> : <ArrowRight size={20} />}
          </button>
        </form>
        {mode === 'explore' && !searchOpen && <div className="gmaps-quick-categories" role="toolbar" aria-label="Danh mục phổ biến">
          {EXPLORE_CATEGORIES.map(c => (
            <button key={c.label} type="button" className="gmaps-cat-pill" onClick={() => void searchCategory(c.label)}>
              <c.Icon size={18} strokeWidth={2} style={{ color: c.color }} aria-hidden="true" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>}
        {searchOpen && <div className="search-results">
          <div className="section-label">
            <span>{searched ? 'KẾT QUẢ TÌM KIẾM' : 'GỢI Ý TÌM KIẾM'}</span>
          </div>
          <button type="button" className="place-quick-action" onClick={useMyOrigin}>
            <span className="place-icon"><LocateFixed size={19} /></span>
            <span><strong>Vị trí của bạn</strong><small>Xem vị trí hiện tại</small></span>
          </button>
          <button type="button" className="place-quick-action" onClick={() => setSearchOpen(false)}>
            <span className="place-icon"><MapPin size={19} /></span>
            <span><strong>Chọn trên bản đồ</strong><small>Chạm lên một điểm bất kỳ trên bản đồ</small></span>
          </button>
          {nearbyNote && <p className="search-empty">{nearbyNote}</p>}
          {searchError ? (
            <p className="search-empty" role="alert">{searchError}</p>
          ) : searching ? (
            <p className="search-empty">Đang tìm địa điểm…</p>
          ) : searched && !results.length ? (
            <p className="search-empty">{nearbySearch.current ? 'Không tìm thấy địa điểm quanh vị trí này. Thử từ khóa khác hoặc mở rộng khu vực.' : 'Chưa tìm thấy địa điểm. Thử thêm tên thành phố hoặc địa chỉ.'}</p>
          ) : (searched ? results : [...recentPlaces, ...savedPlaces.filter(place => !recentPlaces.some(recent => recent.id === place.id))].slice(0, 10)).map(place => (
            <button className="place-result" key={place.id} onClick={() => choosePlace(place)}>
              <span className="place-icon"><MapPin size={19} /></span>
              <span><strong>{place.name}</strong><small>{place.detail}{location.fix?` · ${formatDistance(distance(location.fix, place))}`:''}</small></span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>}
      </div>}
    </header>
    {mode === 'preview' && (
      <RouteInputs
        origin={originOverride?.name ?? (location.fix ? 'Vị trí của bạn' : 'Chọn điểm đi')}
        destination={selected?.name ?? 'Chọn điểm đến'}
        stops={stops}
        editingTarget={searchTarget}
        query={query}
        onQueryChange={val => { nearbySearch.current=false; setNearbyNote(null); if(!val){searchAbort.current?.abort();setSearching(false);setResults([]);} setQuery(val); setSearched(false); }}
        onStartEdit={target => editEndpoint(target)}
        onClearTarget={target => {
          if (target === 'origin') useMyOrigin();
          else editEndpoint('destination');
        }}
        onAddStop={addStop}
        onRemoveStop={removeStop}
        back={() => {
          routeAbort.current?.abort();
          setLoading(false);
          setRoute(null);
          setAlternatives([]);
          setStops([]);
          setMode('place');
        }}
        swap={swapEndpoints}
        searchOpen={searchOpen}
        onCloseSearch={() => setSearchOpen(false)}
        results={results}
        searching={searching}
        savedPlaces={savedPlaces}
        onSelectPlace={choosePlace}
        onUseMyLocation={useMyOrigin}
        onPickOnMap={() => setSearchOpen(false)}
        onSubmitSearch={submitSearch}
      />
    )}
    {navigating && activeStep && <section className="turn-banner" aria-label="Chỉ dẫn tiếp theo"><div className="turn-symbol"><ManeuverIcon type={activeStep.maneuver} size={39} /></div><div><span>{rerouting ? 'Đang tìm đường mới…' : `Sau ${formatDistance(progress?.nextTurn ?? activeStep.offset)}`}</span><h1>{activeStep.instruction}</h1><small>Theo biển báo và tình hình đường thực tế</small></div></section>}
    <div className="map-controls"><button className={`map-control mode3d-control ${mode3D?'active':''}`} aria-label={mode3D?'Chuyển bản đồ 2D':'Chuyển bản đồ 3D'} aria-pressed={mode3D} title="Nghiêng bản đồ; phóng to để xem nhà 3D" onClick={()=>setMode3D(value=>!value)}>{mode3D?'2D':'3D'}</button><button className={`map-control ${road.enabled?'active':''}`} aria-label="Mở dữ liệu đường" onClick={()=>setShowRoadData(true)}><Layers2 size={24}/></button><button className="map-control compass-control" aria-label={Math.abs(mapBearing)>1?'Đưa hướng Bắc về phía trên':fix?.headingAvailable===true?'Xoay theo hướng đang quay':'Chưa xác định hướng thiết bị'} title={Math.abs(mapBearing)>1?'Đưa hướng Bắc về phía trên':fix?.headingAvailable===true?'Xoay bản đồ theo hướng thiết bị đang quay':'Chưa có hướng thiết bị để xoay bản đồ'} disabled={Math.abs(mapBearing)<=1&&fix?.headingAvailable!==true} onClick={()=>{ if(Math.abs(mapBearing)>1)setNorthReset(value=>value+1); else setHeadingUp(value=>value+1); }}><Compass size={24} style={{transform:`rotate(${-mapBearing}deg)`}}/><small>N</small></button>{navigating && <button className="map-control" aria-label={voice ? 'Tắt giọng nói' : 'Bật giọng nói'} onClick={toggleVoice}>{voice ? <Volume2 size={24} /> : <VolumeX size={24} />}</button>}<button className={`map-control ${follow && fix ? 'active' : ''}`} aria-label="Về vị trí của tôi" onClick={() => { setFollow(true); setRecenter(x => x + 1); void location.start(); }}>{location.requesting ? <LoaderCircle className="spin" size={24} /> : <LocateFixed size={24} />}</button>{!navigating && mode !== 'arrived' && mode !== 'preview' && <button className={`device-button ${ble.status === 'connected' ? 'connected' : ''}`} onClick={() => setShowBLE(true)} aria-label="Mở kết nối Bluetooth"><span>{ble.status === 'connected' ? 'ESP32 đã kết nối' : 'Kết nối thiết bị'}</span>{ble.status === 'connected' ? <BluetoothConnected size={22} /> : <Bluetooth size={22} />}<span className="device-dot" /></button>}</div>
    <section
      ref={panelElement}
      className={`bottom-panel ${mode === 'explore' ? 'explore-panel' : ''} ${mode === 'preview' ? 'preview-panel' : ''} ${mode==='place'?'place-panel':''} ${sheetCollapsed?'collapsed':''}`}
      style={sheetDragOffset !== null ? { transform: `translateY(${sheetDragOffset}px)`, transition: 'none' } : undefined}
    >
      <button
        type="button"
        className="sheet-handle"
        aria-label={sheetCollapsed?'Mở rộng bảng dưới':'Thu gọn bảng dưới'}
        aria-expanded={!sheetCollapsed}
        onPointerDown={e => {
          const base = sheetCollapsed ? Math.max(0, (panelElement.current?.offsetHeight ?? 0) - 58) : 0;
          sheetDrag.current = { startY: e.clientY, base, moved: false };
          sheetDragOffsetRef.current = base;
          suppressSheetClick.current = false;
          setSheetDragOffset(base);
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
        }}
        onPointerMove={e => {
          const drag = sheetDrag.current;
          if (!drag) return;
          const dy = e.clientY - drag.startY;
          if (Math.abs(dy) > 4) drag.moved = true;
          const max = Math.max(0, (panelElement.current?.offsetHeight ?? 0) - 58);
          const offset = Math.max(0, Math.min(max, drag.base + dy));
          sheetDragOffsetRef.current = offset;
          setSheetDragOffset(offset);
        }}
        onPointerUp={() => {
          const drag = sheetDrag.current;
          if (!drag) return;
          sheetDrag.current = null;
          setSheetDragOffset(null);
          suppressSheetClick.current = true;
          if (!drag.moved) { setSheetCollapsed(value => !value); return; }
          const max = Math.max(0, (panelElement.current?.offsetHeight ?? 0) - 58);
          setSheetCollapsed(sheetDragOffsetRef.current > max * 0.45);
        }}
        onPointerCancel={() => {
          sheetDrag.current = null;
          setSheetDragOffset(null);
        }}
        onClick={() => {
          if (suppressSheetClick.current) { suppressSheetClick.current = false; return; }
          setSheetCollapsed(value => !value);
        }}
      />
      {location.error && mode !== 'preview' && <p className="inline-feedback" role="alert">{location.error}</p>}
      {tileWarning&&<p className="inline-feedback">Một số ô bản đồ chưa tải được. Kiểm tra kết nối mạng.</p>}
      {mode3D&&<p className="map-3d-hint">Chế độ 3D · Phóng to để xem nhà khối tại nơi có dữ liệu chiều cao. Có thể dùng hai ngón tay để nghiêng và xoay bản đồ.</p>}
      {mode === 'explore' && <>
        <h2 className="destinations-heading">Khám phá</h2>
        <div className="explore-categories">
          {EXPLORE_CATEGORIES.map(c => (
            <button key={c.label} type="button" className="explore-category" onClick={() => void searchCategory(c.label)}>
              <span className="explore-category-icon"><c.Icon size={24} strokeWidth={2} style={{ color: c.color }} aria-hidden="true" /></span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className="home-work-row">
          <div className="home-work-item">
            <button type="button" className="home-work-btn" onClick={() => home ? choosePlace(home) : setHomeWorkTarget('home')}>
              <span className="hw-icon"><House size={20} /></span>
              <span className="hw-text"><strong>Nhà</strong><small>{home ? home.name : 'Đặt địa chỉ nhà'}</small></span>
            </button>
            {home && <button type="button" className="hw-edit" aria-label="Đổi địa chỉ nhà" onClick={() => setHomeWorkTarget('home')}><Pencil size={14} /></button>}
          </div>
          <div className="home-work-item">
            <button type="button" className="home-work-btn" onClick={() => work ? choosePlace(work) : setHomeWorkTarget('work')}>
              <span className="hw-icon"><Briefcase size={20} /></span>
              <span className="hw-text"><strong>Cơ quan</strong><small>{work ? work.name : 'Đặt địa chỉ cơ quan'}</small></span>
            </button>
            {work && <button type="button" className="hw-edit" aria-label="Đổi địa chỉ cơ quan" onClick={() => setHomeWorkTarget('work')}><Pencil size={14} /></button>}
          </div>
        </div>
        <h2 className="destinations-heading saved-heading">Gần bạn</h2>
        {!location.fix ? (
          <p className="explore-help">Bật định vị để xem địa điểm gần nhất. <button type="button" className="text-button" onClick={() => void location.start()}>Bật định vị</button></p>
        ) : nearbyLoading && !nearbyList.length ? (
          <p className="explore-help">Đang tìm địa điểm gần bạn…</p>
        ) : nearbyError ? (
          <p className="explore-help">{nearbyError} <button type="button" className="text-button" onClick={() => { nearbyCell.current=''; nearbyToken.current++; setNearbyRetry(value => value + 1); }}>Thử lại</button></p>
        ) : nearbyList.length ? (
          <div className="quick-destinations">
            {nearbyList.slice(0, 6).map((place, i) => (
              <button key={place.id} onClick={() => choosePlace(place)}>
                <span className={`quick-icon quick-${i}`}><MapPin size={20} /></span>
                <span className="quick-text">
                  <strong>{place.name}</strong>
                  <span className="quick-detail">
                    <span>{place.detail}</span>
                    {location.fix && <span className="quick-distance">{formatDistance(distance(location.fix, place))}</span>}
                  </span>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        ) : (
          <p className="explore-help">Chưa thấy địa điểm có tên trong 20 km quanh bạn.</p>
        )}
        <><h2 className="destinations-heading saved-heading saved-heading-row">Đã lưu<span className="saved-actions"><button type="button" className="text-button" onClick={exportFavorites}>Xuất</button><label className="text-button">Nhập<input type="file" accept="application/json" hidden onChange={event=>{const file=event.target.files?.[0];if(file)importFavorites(file);event.currentTarget.value='';}}/></label></span></h2>{savedPlaces.length?<div className="quick-destinations">{savedPlaces.slice(0,4).map((place,i)=><button key={place.id} onClick={()=>choosePlace(place)}><span className={`quick-icon quick-${i}`}><MapPin size={20}/></span><strong>{place.name}</strong><span>{place.detail}</span><ChevronRight size={17}/></button>)}</div>:<p className="explore-help">Chưa có địa điểm đã lưu.</p>}</>
      </>}
      {mode==='place'&&selected&&<PlaceCard place={selected} saved={saved} shareStatus={shareStatus} onRoute={()=>void plan(selected)} onSave={toggleFavorite} onShare={()=>void sharePlace()} onClose={stop}/>}
      {mode === 'preview' && <>
        <RoutePlannerCard route={route} alternatives={alternatives} selected={selected} loading={loading} error={routeError} customOrigin={!!originOverride} awaitingGPS={awaitingGPS} locationError={location.error} details={details} transportMode={transportMode} onSelectTransportMode={setTransportMode} back={stop} retry={()=>selected&&void plan(selected)} start={startReal} select={r=>{setRoute(r);setProgress(null);}} toggleDetails={()=>setDetails(!details)} roadData={()=>setShowRoadData(true)}/>
      </>}
      {navigating && route && <>
        {navigating&&roadAlert&&!staleGPS&&!progress?.offRoute&&<aside className="navigation-road-alert" role="status" aria-label="Cảnh báo trên tuyến">{roadAlert.kind==='camera'?<img className="road-feature-image" src="/signs/camera.svg" alt="Biểu tượng camera"/>:roadAlert.kind==='limit'||roadAlert.kind==='overspeed'?<SpeedLimitImage kmh={limit.kmh} small/>:<img className="road-feature-image" src={roadAlert.feature?roadSymbol(roadAlert.feature).src:'/signs/unknown.svg'} alt={roadAlert.feature?.label??'Điểm cảnh báo'}/>}<div><strong>{roadAlert.title}</strong><p>{roadAlert.text}</p><small>OSM · CHƯA XÁC MINH THỰC ĐỊA</small></div></aside>}
        {navigationError&&<p className="inline-feedback">{navigationError}</p>}
        {voice&&voiceUnavailable&&<p className="inline-feedback">Thiết bị chưa có giọng tiếng Việt. Hãy tải giọng tiếng Việt trong cài đặt giọng nói.</p>}
        <div className="navigation-summary gmaps-nav-summary">
          <div className="arrival-col">
            <span className="eta-main">{formatDuration(remainingSeconds)}</span>
            <div className="eta-sub">
              <span className="eta-dist">{formatDistance(progress?.remaining ?? route.distance)}</span>
              <span className="middot">·</span>
              <span className="eta-clock">{eta}</span>
            </div>
          </div>
          <div className="speed-cluster">
            <div className={`speed-badge ${limit.kmh && Math.round((fix?.speed ?? 0) * 3.6) > limit.kmh ? 'overspeed-alert' : ''}`}>
              <strong>{Math.round(Math.max(0, fix?.speed ?? 0) * 3.6)}</strong>
              <span>km/h</span>
            </div>
            {road.enabled && navigating && roadFilters.speed && (
              <button className="road-limit-badge" aria-label="Xem giới hạn tốc độ ghi nhận" onClick={() => setShowRoadData(true)}>
                <SpeedLimitImage kmh={limit.kmh} />
              </button>
            )}
          </div>
          <button className="nav-stop-round-btn" aria-label="Kết thúc dẫn đường" onClick={stop}>
            <X size={22} />
          </button>
        </div>
        <div className="trip-progress"><span style={{ width: `${100 * (1 - (progress?.remaining ?? route.distance) / route.distance)}%` }} /></div>
        <div className="navigation-actions">
          <button className="text-button" onClick={() => setDetails(!details)}><RouteIcon size={18} /><span>Các chặng</span></button>
          <button className="text-button" onClick={toggleVoice}>{voice ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>{voice ? 'Giọng nói' : 'Đã tắt tiếng'}</span></button>
          <span className="phone-status"><Signal size={14} /><span>{ble.status === 'connected' ? 'BLE đã kết nối' : 'GPS'}</span></span>
        </div>
      </>}
      {mode === 'arrived' && <div className="arrived-panel"><span className="arrived-icon"><Flag size={32} /></span><span className="eyebrow">HÀNH TRÌNH HOÀN TẤT</span><h1>Bạn đã đến nơi<span className="accent">.</span></h1><p>{route?.destination.name}</p><button className="button primary full" onClick={stop}><Check size={20} />Về bản đồ</button></div>}
      {details && route && <ol className="directions-list" aria-label="Danh sách chỉ dẫn">{route.steps.map(step => <li key={step.index} className={activeStep?.index === step.index && navigating ? 'current-step' : ''}><button type="button" className="directions-step" onClick={()=>setFocusPoint(step.at)}><ManeuverIcon type={step.maneuver} size={22} /><div><strong>{step.instruction}</strong><span>{step.maneuver === 'arrive' ? 'Điểm đến' : formatDistance(step.distance)}</span></div></button></li>)}</ol>}
    </section>
    <footer className="map-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a><span>·</span><a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a><span>·</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OSM contributors</a><span>· OSRM</span></footer>
    {showBLE && <BluetoothPanel state={ble} preferred={preferredEsp} close={() => setShowBLE(false)} connect={() => void link.connect()} disconnect={() => void link.disconnect()} />}
    {showRoadData&&<RoadDataPanel route={route} data={displayRoadData} loading={road.overviewLoading} error={road.overviewError??road.error} retry={road.retry} close={()=>setShowRoadData(false)} filters={roadFilters} setFilters={setRoadFilters} limit={limit} along={progress?.along??0} navigating={navigating} enabled={roadLayerEnabled} setEnabled={setRoadLayerEnabled} showScale={showScale} setShowScale={setShowScale} warnDistance={warnDistance} setWarnDistance={setWarnDistance} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} resetSettings={()=>{localStorage.clear();window.location.reload();}}/>}
  </main>;
}

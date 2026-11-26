import { useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Marker, Popup, LngLatBounds, ScaleControl, setWorkerUrl, setWorkerCount, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { FeatureCollection, LineString, Polygon } from 'geojson';
import { MAP_CENTER, MAP_ZOOM } from '../domain/places';
import type { Coordinate, Fix, Place, Route } from '../domain/types';
import type { RoadData, RoadFeature } from '../domain/roadData';
import type { UserRoadEdit } from '../domain/userRoadEdits';
import { getPhoto } from '../services/photoStore';
import { roadSymbol } from '../domain/roadSymbols';
import { locationZoom, shortestAngleDelta } from '../domain/location';

setWorkerUrl(workerUrl);
setWorkerCount(1);
const STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
const empty = (): FeatureCollection => ({ type: 'FeatureCollection', features: [] });
type UserSign = Extract<UserRoadEdit, { kind: 'addition' }>;
type Props = { route: Route | null; alternatives: Route[]; destination: Place | null; stops: Place[]; onSelectRoute: (route: Route) => void; onPick: (point: Coordinate) => void; roadData: RoadData | null; onReportFeature: (feature: RoadFeature) => void; position: Fix | null; focusPosition: boolean; positionStale: boolean; navigating: boolean; follow: boolean; onDrag: () => void; onTileError: () => void; recenter: number; mode3D: boolean; northReset: number; headingUp: number; focusPoint: Coordinate | null; showScale: boolean; onBearing: (bearing: number) => void; userSigns: UserSign[]; onRemoveUserSign: (id: string) => void; picking: boolean };
function padding(instance: LibreMap) {
  const view = instance.getContainer().getBoundingClientRect(), sheet = document.querySelector('.bottom-panel')?.getBoundingClientRect();
  const header = document.querySelector('.topbar')?.getBoundingClientRect(), turn = document.querySelector('.turn-banner')?.getBoundingClientRect(), editor = document.querySelector('.route-editor')?.getBoundingClientRect();
  const top = Math.max(30, Math.max(header?.bottom ?? 0, turn?.bottom ?? 0, editor?.bottom ?? 0) - view.top + 20);
  const mobile = innerWidth < 760;
  const bottom = mobile ? Math.max(35, view.bottom - (sheet?.top ?? view.bottom) + 20) : 50;
  return { top: Math.min(top, view.height * .35), bottom: Math.min(bottom, view.height * .56), left: mobile ? 30 : Math.min((sheet?.right ?? 390) - view.left + 35, view.width * .45), right: mobile ? 30 : 75 };
}
function centerOn(instance: LibreMap, point: Coordinate, zoom: number) { instance.easeTo({ center: [point.lng, point.lat], zoom, padding: padding(instance), duration: 400 }); }
type PaddingValue = { top: number; bottom: number; left: number; right: number };
const approach = (from: number, to: number, max: number) => Math.abs(to - from) <= max ? to : from + Math.sign(to - from) * max;
function updateSource(instance: LibreMap, id: string, data: FeatureCollection) { (instance.getSource(id) as GeoJSONSource | undefined)?.setData(data); }
function pin(className: string, html: string): HTMLDivElement { const el = document.createElement('div'); el.className = className; el.innerHTML = html; return el; }
function uncertainty(position: Fix): FeatureCollection<Polygon> {
  if (position.accuracy > 100000) return { type: 'FeatureCollection', features: [] };
  const latitude = position.lat * Math.PI / 180, d = position.accuracy / 6371000, coordinates: number[][] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = i * 2 * Math.PI / 64;
    const lat = Math.asin(Math.sin(latitude) * Math.cos(d) + Math.cos(latitude) * Math.sin(d) * Math.cos(angle));
    const lng = position.lng * Math.PI / 180 + Math.atan2(Math.sin(angle) * Math.sin(d) * Math.cos(latitude), Math.cos(d) - Math.sin(latitude) * Math.sin(lat));
    coordinates.push([lng * 180 / Math.PI, lat * 180 / Math.PI]);
  }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coordinates] } }] };
}
export default function MapView({ route, alternatives, destination, stops, onSelectRoute, onPick, roadData, onReportFeature, position, focusPosition, positionStale, navigating, follow, onDrag, onTileError, recenter, mode3D, northReset, headingUp, focusPoint, showScale, onBearing, userSigns, onRemoveUserSign, picking }: Props) {
  const element = useRef<HTMLDivElement>(null), map = useRef<LibreMap | null>(null), [ready, setReady] = useState(false);
  const callbacks = useRef({ onPick, onSelectRoute, onDrag, onTileError, onBearing, onReportFeature, onRemoveUserSign, alternatives, mode3D, picking }); callbacks.current = { onPick, onSelectRoute, onDrag, onTileError, onBearing, onReportFeature, onRemoveUserSign, alternatives, mode3D, picking };
  const positionRef = useRef(position); positionRef.current = position;
  const routePins = useRef<Marker[]>([]), roadMarkers = useRef(new Map<string, { marker: Marker; signature: string }>()), placeMarker = useRef<Marker | null>(null), positionMarker = useRef<Marker | null>(null);
  const signMarkers = useRef(new Map<string, Marker>());
  const displayHeading = useRef(0), course = useRef<number | null>(null), lastCentered = useRef(0), initialPositionCentered = useRef(false);
  // Motion interpolation: GPS arrives about once a second, so the marker and camera are driven per frame between two fixes.
  const anim = useRef<{ from: Coordinate; to: Coordinate; start: number; duration: number } | null>(null), rendered = useRef<Coordinate | null>(null);
  const raf = useRef<number | null>(null), lastFrame = useRef(0), lastFixAt = useRef(0), followActive = useRef(false), lastObserve = useRef(0), lastSpeed = useRef<string | null>(null);
  const smoothedBearing = useRef<number | null>(null), bearingDir = useRef<number>(1), paddingCache = useRef<{ at: number; value: PaddingValue } | null>(null), appliedPadding = useRef<PaddingValue | null>(null);
  const live = useRef({ follow, navigating, mode3D }); live.current = { follow, navigating, mode3D };
  const rotateArrow = () => {
    if (!map.current || course.current === null) return;
    const next = (course.current - map.current.getBearing() + 360) % 360;
    const delta = shortestAngleDelta(displayHeading.current, next);
    displayHeading.current += delta;
    positionMarker.current?.getElement().style.setProperty('--heading', `${displayHeading.current}deg`);
  };
  const moveTo = (point: Coordinate) => { rendered.current = point; positionMarker.current?.setLngLat([point.lng, point.lat]); };
  // Layout is measured at most a few times a second, never per fix or per frame; one measurement fills the cache for every camera update inside it.
  const livePadding = (instance: LibreMap): PaddingValue => {
    const at = performance.now(), cached = paddingCache.current;
    if (!cached || at - cached.at > 400) paddingCache.current = { at, value: padding(instance) };
    return paddingCache.current!.value;
  };
  // The turn banner and panel change size mid-route. Sliding the padding keeps the camera from jumping sideways when they do.
  const easedPadding = (target: PaddingValue, dt: number) => {
    const current = appliedPadding.current;
    if (!current) { appliedPadding.current = { ...target }; return { value: appliedPadding.current, moving: false }; }
    const max = 900 * dt;
    const next = { top: approach(current.top, target.top, max), bottom: approach(current.bottom, target.bottom, max), left: approach(current.left, target.left, max), right: approach(current.right, target.right, max) };
    appliedPadding.current = next;
    return { value: next, moving: next.top !== target.top || next.bottom !== target.bottom || next.left !== target.left || next.right !== target.right };
  };
  const addRoadMarker = (instance: LibreMap, feature: RoadFeature) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = `road-poi-marker image-marker ${feature.kind.includes('camera') ? 'camera' : feature.kind} ${feature.userAdded ? 'user-added' : ''}`; el.setAttribute('aria-label', feature.label);
    const image = document.createElement('img'); image.src = roadSymbol(feature).src; image.alt = feature.label; image.className = 'road-marker-image'; image.width = image.height = 32; el.appendChild(image);
    el.addEventListener('click', event => event.stopPropagation());
    const content = document.createElement('div'); content.className = 'road-popup';
    const title = document.createElement('strong'); title.textContent = feature.label; content.appendChild(title);
    const note = document.createElement('small'); note.textContent = feature.userAdded ? 'Do bạn tự thêm trên thiết bị này; chưa được xác minh hay chia sẻ với ai khác.' : feature.kind === 'signals' ? 'Đèn giao thông ghi nhận trên OSM; không có trạng thái đèn trực tiếp.' : 'Nguồn OSM · gần tuyến · chưa xác nhận chiều áp dụng/chức năng xử phạt.'; content.appendChild(note);
    if (feature.code && !feature.userAdded) { const code = document.createElement('small'); code.textContent = `Mã ghi nhận: ${feature.code}`; content.appendChild(code); }
    if (feature.userAdded) {
      const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'road-popup-report'; removeBtn.textContent = 'Xóa biển bạn đã thêm';
      removeBtn.addEventListener('click', event => { event.stopPropagation(); callbacks.current.onReportFeature(feature); });
      content.appendChild(removeBtn);
    } else {
      const anchor = document.createElement('a'); anchor.href = `https://www.openstreetmap.org/node/${feature.osmId}`; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = 'Xem đối tượng nguồn OSM'; content.appendChild(anchor);
      const reportBtn = document.createElement('button'); reportBtn.type = 'button'; reportBtn.className = 'road-popup-report'; reportBtn.textContent = 'Báo sai, ẩn biển này';
      reportBtn.addEventListener('click', event => { event.stopPropagation(); callbacks.current.onReportFeature(feature); });
      content.appendChild(reportBtn);
    }
    return new Marker({ element: el }).setLngLat([feature.lng, feature.lat]).setPopup(new Popup({ offset: 18, maxWidth: '280px' }).setDOMContent(content)).addTo(instance);
  };
  // Constant angular speed toward the target heading; hysteresis near 180 deg prevents left/right flip-flop when reversing.
  const stepBearing = (target: number, dt: number) => {
    const current = smoothedBearing.current;
    if (current === null) { smoothedBearing.current = target; return target; }
    let delta = shortestAngleDelta(current, target);
    if (Math.abs(delta) < 0.5) return current;
    if (Math.abs(delta) > 150) {
      delta = bearingDir.current * Math.abs(delta);
    } else if (Math.abs(delta) > 8) {
      bearingDir.current = delta >= 0 ? 1 : -1;
    }
    const maxStep = Math.abs(delta) > 90 ? 240 * dt : 160 * dt;
    const next = (current + Math.sign(delta) * Math.min(Math.abs(delta), maxStep) + 360) % 360;
    smoothedBearing.current = next; return next;
  };
  const tick = (time: number) => {
    raf.current = null;
    const instance = map.current, frame = anim.current;
    if (!instance || !positionMarker.current || !frame) { lastFrame.current = 0; return; }
    const dt = lastFrame.current ? Math.min(.05, Math.max(0, (time - lastFrame.current) / 1000)) : 1 / 60; lastFrame.current = time;
    // Read layout before writing the marker transform so the measurement never forces a reflow of just-written styles.
    const following = live.current.follow && live.current.navigating;
    const pad = following ? easedPadding(livePadding(instance), dt) : null;
    const t = frame.duration <= 0 ? 1 : Math.min(1, Math.max(0, (time - frame.start) / frame.duration));
    // Linear between fixes keeps a constant apparent speed; easing here would re-introduce the accelerate/brake sawtooth.
    const point: Coordinate = { lat: frame.from.lat + (frame.to.lat - frame.from.lat) * t, lng: frame.from.lng + (frame.to.lng - frame.from.lng) * t };
    moveTo(point);
    let rotating = false;
    if (following) {
      const heading = course.current;
      const bearing = heading !== null && Number.isFinite(heading) ? stepBearing(heading, dt) : smoothedBearing.current;
      rotating = heading !== null && Number.isFinite(heading) && bearing !== null && Math.abs(shortestAngleDelta(bearing, heading)) > 0.6;
      // Cả 2D và 3D đều xoay bản đồ theo hướng di chuyển / điện thoại khi dẫn đường; 2D giữ pitch=0, 3D giữ pitch=55.
      instance.jumpTo({ center: [point.lng, point.lat], ...(bearing !== null ? { bearing } : {}), ...(pad ? { padding: pad.value } : {}) });
      rotateArrow();
    }
    if (t < 1 || pad?.moving || rotating) raf.current = requestAnimationFrame(tick);
    else { anim.current = null; lastFrame.current = 0; }
  };
  const runFollow = () => { if (raf.current === null && anim.current) { lastFrame.current = 0; raf.current = requestAnimationFrame(tick); } };
  // A panel resize changes the padding while the vehicle may be stationary; run one short leg so the camera eases to the new padding.
  const wakeFollow = () => {
    const point = rendered.current;
    if (!point || !live.current.follow || !live.current.navigating) return;
    if (!anim.current) anim.current = { from: point, to: point, start: performance.now(), duration: 120 };
    runFollow();
  };

  // Hướng la bàn và tốc độ được hợp nhất từ useLocation() qua prop `position.heading` để tránh 2 listener tranh chấp khi quay ngược 180°.
  useEffect(() => {
    if (!element.current) return;
    let instance: LibreMap;
    try { instance = new LibreMap({ container: element.current, style: STYLE, center: [MAP_CENTER.lng, MAP_CENTER.lat], zoom: MAP_ZOOM, attributionControl: false, renderWorldCopies: false, maxPitch: 65, maxZoom: 19, maxTileCacheSize: 128, pixelRatio: Math.min(devicePixelRatio || 1, 2), canvasContextAttributes: { antialias: true } }); }
    catch { callbacks.current.onTileError(); element.current.dataset.mapError = 'webgl'; return; }
    map.current = instance;
    const observeView = () => {
      // A follow pass emits rotate events every frame; publishing each one would re-render the app at display rate.
      const at = performance.now();
      if (at - lastObserve.current >= 100) {
        lastObserve.current = at;
        if (element.current) { element.current.dataset.mapPitch = instance.getPitch().toFixed(1); element.current.dataset.mapBearing = instance.getBearing().toFixed(1); }
        callbacks.current.onBearing(instance.getBearing());
      }
      rotateArrow();
    };
    instance.on('load', () => {
      for (const layer of instance.getStyle().layers ?? []) {
        if (layer.type === 'symbol' && layer.layout?.['text-field'] && !/shield|airport/.test(layer.id)) instance.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:vi'], ['get', 'name'], ['get', 'name:latin'], ['get', 'name:en']]);
      }
      const label = instance.getStyle().layers?.find(l => l.type === 'symbol')?.id;
      instance.addLayer({ id: 'roadlink-buildings-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14, filter: ['all', ['!', ['has', 'hide_3d']], ['>', ['to-number', ['get', 'render_height'], 0], 0]], layout: { visibility: callbacks.current.mode3D ? 'visible' : 'none' }, paint: { 'fill-extrusion-color': '#d2d5d8', 'fill-extrusion-height': ['to-number', ['get', 'render_height'], 0], 'fill-extrusion-base': ['to-number', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .88 } }, label);
      for (const id of ['roadlink-routes', 'roadlink-speed', 'roadlink-accuracy']) instance.addSource(id, { type: 'geojson', data: empty() });
      instance.addLayer({ id: 'roadlink-accuracy-fill', type: 'fill', source: 'roadlink-accuracy', paint: { 'fill-color': '#1a73e8', 'fill-opacity': .1 } }, label);
      instance.addLayer({ id: 'roadlink-accuracy-line', type: 'line', source: 'roadlink-accuracy', paint: { 'line-color': '#1a73e8', 'line-opacity': .3, 'line-width': 1 } }, label);
      instance.addLayer({ id: 'roadlink-speed-lines', type: 'line', source: 'roadlink-speed', paint: { 'line-color': '#d59a3d', 'line-width': 3, 'line-offset': 5, 'line-dasharray': [2, 2], 'line-opacity': .8 } }, label);
      instance.addLayer({ id: 'route-alternatives', type: 'line', source: 'roadlink-routes', filter: ['==', ['get', 'selected'], false], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#9da8b7', 'line-width': 7 } }, label);
      instance.addLayer({ id: 'route-casing', type: 'line', source: 'roadlink-routes', filter: ['==', ['get', 'selected'], true], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 11 } }, label);
      instance.addLayer({ id: 'route-selected', type: 'line', source: 'roadlink-routes', filter: ['==', ['get', 'selected'], true], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1a73e8', 'line-width': 6 } }, label);
      element.current?.setAttribute('data-map-ready', 'true'); setReady(true); observeView();
    });
    instance.on('error', () => callbacks.current.onTileError());
    instance.on('dragstart', event => { if (event.originalEvent) callbacks.current.onDrag(); });
    instance.on('rotatestart', event => { if (event.originalEvent) callbacks.current.onDrag(); });
    instance.on('rotate', observeView); instance.on('pitch', observeView);
    instance.on('idle', () => {
      if (element.current && instance.getLayer('roadlink-buildings-3d')) element.current.dataset.visibleBuildings = String(instance.queryRenderedFeatures({ layers: ['roadlink-buildings-3d'] }).length);
    });
    instance.on('click', event => {
      if (callbacks.current.picking) { callbacks.current.onPick({ lat: event.lngLat.lat, lng: event.lngLat.lng }); return; }
      const lines = instance.getLayer('route-selected') ? instance.queryRenderedFeatures(event.point, { layers: ['route-alternatives', 'route-selected'] }) : [];
      const alternative = lines.find(f => f.layer.id === 'route-alternatives');
      if (alternative) { const selected = callbacks.current.alternatives.find(r => r.id === alternative.properties.id); if (selected) callbacks.current.onSelectRoute(selected); return; }
      if (lines.length) return;
      callbacks.current.onPick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });
    const observer = new ResizeObserver(() => { paddingCache.current = null; instance.resize(); wakeFollow(); }); observer.observe(element.current);
    // Panels resize without resizing the canvas, so their own observer drops the cached padding as soon as they change.
    const panelObserver = new ResizeObserver(() => { paddingCache.current = null; wakeFollow(); });
    for (const selector of ['.topbar', '.bottom-panel']) { const node = document.querySelector(selector); if (node) panelObserver.observe(node); }
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; anim.current = null; rendered.current = null; observer.disconnect(); panelObserver.disconnect(); instance.remove(); map.current = null; routePins.current = []; roadMarkers.current.clear(); signMarkers.current.clear(); placeMarker.current = null; positionMarker.current = null; initialPositionCentered.current = false; };
  }, []);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    instance.setLayoutProperty('roadlink-buildings-3d', 'visibility', mode3D ? 'visible' : 'none');
    // Khi đang dẫn đường, giữ nguyên góc xoay bản đồ theo hướng điện thoại khi chuyển đổi giữa 2D và 3D.
    if (follow && navigating) instance.jumpTo({ pitch: mode3D ? 55 : 0 });
    else instance.easeTo({ pitch: mode3D ? 55 : 0, duration: 500 });
  }, [mode3D, ready, follow, navigating]);
  useEffect(() => { if (map.current && northReset) map.current.easeTo({ bearing: 0, duration: 350 }); }, [northReset]);
  useEffect(() => {
    if (!map.current || !headingUp) return;
    const fix = positionRef.current;
    const heading = course.current ?? (fix?.headingAvailable ? fix.heading : null);
    if (heading !== null && Number.isFinite(heading)) map.current.easeTo({ bearing: heading, duration: 350 });
  }, [headingUp]);
  useEffect(() => {
    if (map.current && focusPoint) map.current.easeTo({ center: [focusPoint.lng, focusPoint.lat], zoom: 16, duration: 600 });
  }, [focusPoint]);
  useEffect(() => {
    if (!map.current) return;
    if (showScale) {
      const control = new ScaleControl({ maxWidth: 80, unit: 'metric' });
      map.current.addControl(control, 'bottom-left');
      return () => { map.current?.removeControl(control); };
    }
  }, [showScale]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    for (const marker of routePins.current) marker.remove(); routePins.current = [];
    const data: FeatureCollection<LineString> = { type: 'FeatureCollection', features: [] };
    if (route) {
      for (const candidate of [route, ...alternatives.filter(r => r.id !== route.id)]) data.features.push({ type: 'Feature', properties: { id: candidate.id, selected: candidate.id === route.id }, geometry: { type: 'LineString', coordinates: candidate.coordinates.map(p => [p.lng, p.lat]) } });
      const from = route.coordinates[0], to = route.coordinates.at(-1)!;
      routePins.current = [
        new Marker({ element: pin('route-origin-marker', '<span></span>') }).setLngLat([from.lng, from.lat]).addTo(instance),
        ...stops.map((stop, index) => new Marker({ element: pin('route-stop-marker-pin', `<span>${index + 1}</span>`), anchor: 'bottom' }).setLngLat([stop.lng, stop.lat]).addTo(instance)),
        new Marker({ element: pin('destination-marker', '<span></span>'), anchor: 'bottom' }).setLngLat([to.lng, to.lat]).addTo(instance)
      ];
      const bounds = new LngLatBounds(); for (const point of route.coordinates) bounds.extend([point.lng, point.lat]);
      instance.fitBounds(bounds, { padding: padding(instance), maxZoom: 16, pitch: callbacks.current.mode3D ? 55 : 0, bearing: instance.getBearing(), duration: 0 });
    }
    updateSource(instance, 'roadlink-routes', data);
  }, [route, alternatives, stops, ready]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    placeMarker.current?.remove(); placeMarker.current = null;
    if (destination) { placeMarker.current = new Marker({ element: pin('destination-marker', '<span></span>'), anchor: 'bottom' }).setLngLat([destination.lng, destination.lat]).addTo(instance); centerOn(instance, destination, 16); }
  }, [destination, ready]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    // The scan publishes a growing snapshot every ~200 ms. Diffing by id keeps existing marker DOM, popups and image decodes alive.
    const speedSections = (roadData?.sections ?? []).filter(s => s.kmh !== null);
    const speedSignature = speedSections.map(s => `${s.id}:${s.kmh}`).join('|');
    if (speedSignature !== lastSpeed.current) {
      lastSpeed.current = speedSignature;
      const speeds: FeatureCollection<LineString> = { type: 'FeatureCollection', features: speedSections.map(s => ({ type: 'Feature', properties: { kmh: s.kmh }, geometry: { type: 'LineString', coordinates: [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]] } })) };
      updateSource(instance, 'roadlink-speed', speeds);
    }
    const desired = new Map<string, RoadFeature>();
    for (const feature of roadData?.features ?? []) desired.set(feature.id, feature);
    for (const [id, entry] of roadMarkers.current) if (!desired.has(id)) { entry.marker.remove(); roadMarkers.current.delete(id); }
    for (const feature of desired.values()) {
      // The signature covers everything the marker DOM or its popup renders, so unchanged features are left untouched.
      const signature = `${feature.kind}|${feature.label}|${feature.userAdded ? 1 : 0}|${feature.code ?? ''}|${feature.osmId}|${feature.lng},${feature.lat}`;
      const entry = roadMarkers.current.get(feature.id);
      if (entry && entry.signature === signature) continue;
      entry?.marker.remove();
      roadMarkers.current.set(feature.id, { marker: addRoadMarker(instance, feature), signature });
    }
  }, [roadData, ready]);
  // User-added signs live on their own layer so they stay visible without a route, and keep their photo between renders.
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    const wanted = new Set(userSigns.map(sign => sign.id));
    for (const [id, marker] of signMarkers.current) if (!wanted.has(id)) { marker.remove(); signMarkers.current.delete(id); }
    for (const sign of userSigns) {
      if (signMarkers.current.has(sign.id)) continue;
      const el = document.createElement('button'); el.type = 'button'; el.className = `road-poi-marker image-marker user-sign-marker ${sign.featureKind}`; el.setAttribute('aria-label', sign.label);
      const image = document.createElement('img'); image.src = roadSymbol({ kind: sign.featureKind, code: sign.speedKmh ? `127[${sign.speedKmh}]` : '' }).src; image.alt = sign.label; image.className = 'road-marker-image'; image.width = image.height = 32; el.appendChild(image);
      el.addEventListener('click', event => event.stopPropagation());
      const content = document.createElement('div'); content.className = 'road-popup';
      const title = document.createElement('strong'); title.textContent = sign.label; content.appendChild(title);
      const note = document.createElement('small'); note.textContent = sign.speedKmh ? `${sign.speedKmh} km/h · do bạn thêm trên thiết bị này` : 'Do bạn thêm trên thiết bị này; chưa xác minh.'; content.appendChild(note);
      if (sign.note) { const extra = document.createElement('small'); extra.textContent = sign.note; content.appendChild(extra); }
      if (sign.photoKey) { const photo = document.createElement('img'); photo.className = 'road-photo-popup'; photo.alt = `Ảnh tại ${sign.label}`; content.appendChild(photo); void getPhoto(sign.photoKey).then(src => { if (src) photo.src = src; }); }
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'road-popup-report'; remove.textContent = 'Xóa biển bạn đã thêm';
      remove.addEventListener('click', event => { event.stopPropagation(); callbacks.current.onRemoveUserSign(sign.id); });
      content.appendChild(remove);
      signMarkers.current.set(sign.id, new Marker({ element: el }).setLngLat([sign.lng, sign.lat]).setPopup(new Popup({ offset: 18, maxWidth: '280px' }).setDOMContent(content)).addTo(instance));
    }
  }, [userSigns, ready]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    if (!position) { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; anim.current = null; rendered.current = null; followActive.current = false; smoothedBearing.current = null; positionMarker.current?.remove(); positionMarker.current = null; course.current = null; initialPositionCentered.current = false; updateSource(instance, 'roadlink-accuracy', empty()); return; }
    updateSource(instance, 'roadlink-accuracy', uncertainty(position));
    for (const layer of ['roadlink-accuracy-fill', 'roadlink-accuracy-line']) instance.setPaintProperty(layer, layer.endsWith('fill') ? 'fill-color' : 'line-color', positionStale ? '#8d99a5' : '#1a73e8');
    if (!positionMarker.current) positionMarker.current = new Marker({ element: pin(`position-marker navigation-position ${navigating && mode3D ? 'use-car' : ''}`, '<span class="position-halo"></span><svg class="position-arrow" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 35 35 20 27 5 35Z"/></svg><svg class="position-car" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="carBodyGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fa8ff"/><stop offset="0.55" stop-color="#1a73e8"/><stop offset="1" stop-color="#0b4fb0"/></linearGradient><linearGradient id="carGlassGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef5ff"/><stop offset="1" stop-color="#aecbfa"/></linearGradient></defs><ellipse class="car-shadow" cx="20" cy="33.5" rx="10" ry="3.2"/><path class="car-body" d="M20 4.3c3.5 0 6 1.7 6.5 4.8l1.3 17c.3 4.1-3.2 7.7-7.8 7.7s-8.1-3.6-7.8-7.7l1.3-17c.5-3.1 3-4.8 6.5-4.8Z"/><path class="car-glass" d="M14.7 11.6c1.3-1.9 3.1-2.8 5.3-2.8s4 .9 5.3 2.8c.5.7.3 3.7-.2 4.7-.5 1-2.3 1.5-5.1 1.5s-4.6-.5-5.1-1.5c-.5-1-.7-4-.2-4.7Z"/><path class="car-glass car-glass-rear" d="M15 22.7c1.2-.8 2.9-1.2 5-1.2s3.8.4 5 1.2c.6.4.6 3.2 0 3.9-.8.9-2.7 1.4-5 1.4s-4.2-.5-5-1.4c-.6-.7-.6-3.5 0-3.9Z"/><path class="car-roof-shine" d="M15.5 10.8c1.5-1.7 3-2.4 4.5-2.4s3 .7 4.5 2.4c.3.4-.1.9-.6.7-2.5-1-5.3-1-7.8 0-.5.2-.9-.3-.6-.7Z"/><rect class="car-mirror" x="7.5" y="13" width="3" height="6" rx="1.4"/><rect class="car-mirror" x="29.5" y="13" width="3" height="6" rx="1.4"/></svg>') }).setLngLat([position.lng, position.lat]).addTo(instance);
    else if (!(follow && navigating)) moveTo({ lat: position.lat, lng: position.lng });
    const el = positionMarker.current.getElement(), known = !positionStale && position.headingAvailable !== false && Number.isFinite(position.heading);
    el.classList.toggle('is-following', follow && navigating);
    if (known) {
      course.current = position.heading;
      el.classList.remove('direction-unknown');
    } else if (course.current === null) {
      el.classList.add('direction-unknown');
    }
    el.setAttribute('role', 'img'); el.setAttribute('aria-label', course.current !== null ? `Hướng di chuyển ${Math.round(course.current)} độ` : 'Chưa xác định hướng di chuyển'); rotateArrow();
    if (follow && navigating) {
      // Follow keeps the marker and the camera on the same interpolated point; no per-fix camera animation is started.
      if (!followActive.current) {
        followActive.current = true;
        paddingCache.current = null; appliedPadding.current = null;
        const pad = livePadding(instance);
        rendered.current = { lat: position.lat, lng: position.lng };
        positionMarker.current.setLngLat([position.lng, position.lat]);
        const initialBearing = course.current !== null && Number.isFinite(course.current) ? course.current : instance.getBearing();
        smoothedBearing.current = initialBearing;
        anim.current = null; lastFixAt.current = position.timestamp;
        instance.jumpTo({ center: [position.lng, position.lat], bearing: initialBearing, zoom: Math.min(17, locationZoom(position.accuracy)), padding: pad });
        rotateArrow();
      } else {
        const moved = !rendered.current || rendered.current.lat !== position.lat || rendered.current.lng !== position.lng;
        // A newer fix retargets the running leg from wherever the marker is drawn right now, so no update is dropped.
        const retarget = !anim.current || anim.current.to.lat !== position.lat || anim.current.to.lng !== position.lng;
        // Compass updates repeat the same coordinates; keep bearing smoothing alive in both 2D and 3D.
        const drift = !anim.current && course.current !== null && smoothedBearing.current !== null && Math.abs(shortestAngleDelta(smoothedBearing.current, course.current)) > 1;
        if (retarget && moved) {
          const gap = lastFixAt.current ? position.timestamp - lastFixAt.current : 1000;
          anim.current = { from: rendered.current ?? { lat: position.lat, lng: position.lng }, to: { lat: position.lat, lng: position.lng }, start: performance.now(), duration: Math.min(2000, Math.max(250, gap)) };
          lastFixAt.current = position.timestamp;
          runFollow();
        } else if (drift) {
          anim.current = { from: rendered.current ?? { lat: position.lat, lng: position.lng }, to: { lat: position.lat, lng: position.lng }, start: performance.now(), duration: 250 };
          runFollow();
        }
      }
    } else {
      followActive.current = false; smoothedBearing.current = null; anim.current = null; lastFixAt.current = position.timestamp;
      moveTo({ lat: position.lat, lng: position.lng });
      if (follow && focusPosition && !initialPositionCentered.current) { initialPositionCentered.current = true; centerOn(instance, position, locationZoom(position.accuracy)); }
    }
  }, [position, ready, navigating, follow, focusPosition, positionStale]);
  useEffect(() => {
    if (!map.current || !ready || !position || recenter <= lastCentered.current) return;
    lastCentered.current = recenter;
    const zoom = Math.min(17, locationZoom(position.accuracy));
    // While following, the per-frame camera update owns the position, so only the zoom is restored here.
    if (navigating && follow) { appliedPadding.current = null; map.current.jumpTo({ zoom, padding: livePadding(map.current) }); }
    else centerOn(map.current, position, locationZoom(position.accuracy));
  }, [recenter, position, ready, navigating, follow]);
  useEffect(() => {
    positionMarker.current?.getElement().classList.toggle('use-car', navigating && mode3D);
  }, [navigating, mode3D]);
  return <div ref={element} className="map-canvas" data-basemap="openfreemap-osm" data-map-ready="false" data-mode={mode3D ? '3d' : '2d'} data-picking={picking ? 'true' : 'false'} aria-label="Bản đồ OpenStreetMap" role="img" />;
}

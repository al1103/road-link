import { useEffect, useRef, useState } from 'react';
import { Map as LibreMap, Marker, Popup, LngLatBounds, setWorkerUrl, setWorkerCount, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { FeatureCollection, LineString, Polygon } from 'geojson';
import { MAP_CENTER, MAP_ZOOM } from '../domain/places';
import type { Coordinate, Fix, Place, Route } from '../domain/types';
import type { RoadData } from '../domain/roadData';
import { roadSymbol } from '../domain/roadSymbols';
import { compassHeading, locationZoom } from '../domain/location';
import { requestOrientationPermission } from '../hooks/useLocation';

setWorkerUrl(workerUrl);
setWorkerCount(1);
const STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
const empty = (): FeatureCollection => ({ type: 'FeatureCollection', features: [] });
type Props = { route: Route | null; alternatives: Route[]; destination: Place | null; onSelectRoute: (route: Route) => void; onPick: (point: Coordinate) => void; roadData: RoadData | null; position: Fix | null; focusPosition: boolean; positionStale: boolean; navigating: boolean; follow: boolean; onDrag: () => void; onTileError: () => void; recenter: number; mode3D: boolean; northReset: number; headingUp: number; onBearing: (bearing: number) => void };
function padding(instance: LibreMap) {
  const view = instance.getContainer().getBoundingClientRect(), sheet = document.querySelector('.bottom-panel')?.getBoundingClientRect();
  const header = document.querySelector('.topbar')?.getBoundingClientRect(), turn = document.querySelector('.turn-banner')?.getBoundingClientRect(), editor = document.querySelector('.route-editor')?.getBoundingClientRect();
  const top = Math.max(30, Math.max(header?.bottom ?? 0, turn?.bottom ?? 0, editor?.bottom ?? 0) - view.top + 20);
  const mobile = innerWidth < 760;
  const bottom = mobile ? Math.max(35, view.bottom - (sheet?.top ?? view.bottom) + 20) : 50;
  return { top: Math.min(top, view.height * .35), bottom: Math.min(bottom, view.height * .56), left: mobile ? 30 : Math.min((sheet?.right ?? 390) - view.left + 35, view.width * .45), right: mobile ? 30 : 75 };
}
function centerOn(instance: LibreMap, point: Coordinate, zoom: number) { instance.easeTo({ center: [point.lng, point.lat], zoom, padding: padding(instance), duration: 400 }); }
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
export default function MapView({ route, alternatives, destination, onSelectRoute, onPick, roadData, position, focusPosition, positionStale, navigating, follow, onDrag, onTileError, recenter, mode3D, northReset, headingUp, onBearing }: Props) {
  const element = useRef<HTMLDivElement>(null), map = useRef<LibreMap | null>(null), [ready, setReady] = useState(false);
  const callbacks = useRef({ onPick, onSelectRoute, onDrag, onTileError, onBearing, alternatives, mode3D }); callbacks.current = { onPick, onSelectRoute, onDrag, onTileError, onBearing, alternatives, mode3D };
  const positionRef = useRef(position); positionRef.current = position;
  const routePins = useRef<Marker[]>([]), roadMarkers = useRef<Marker[]>([]), placeMarker = useRef<Marker | null>(null), positionMarker = useRef<Marker | null>(null);
  const displayHeading = useRef(0), course = useRef<number | null>(null), lastCentered = useRef(0), initialPositionCentered = useRef(false);
  const rotateArrow = () => {
    if (!map.current || course.current === null) return;
    const next = course.current - map.current.getBearing(), delta = ((next - displayHeading.current + 540) % 360) - 180; displayHeading.current += delta;
    positionMarker.current?.getElement().style.setProperty('--heading', `${displayHeading.current}deg`);
  };

  useEffect(() => {
    const requestPerm = async () => { void requestOrientationPermission(); };
    window.addEventListener('click', requestPerm, { passive: true });
    window.addEventListener('touchend', requestPerm, { passive: true });
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const heading = compassHeading(event);
      if (heading === null || !positionMarker.current) return;
      if (positionRef.current && positionRef.current.speed > 2.5 && positionRef.current.headingAvailable) return;
      course.current = heading;
      positionMarker.current.getElement().classList.remove('direction-unknown');
      rotateArrow();
    };
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
    return () => {
      window.removeEventListener('click', requestPerm);
      window.removeEventListener('touchend', requestPerm);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);
  const detailVisibility = () => { const zoom = map.current?.getZoom() ?? 0; for (const marker of roadMarkers.current) { const el = marker.getElement(); if (el.dataset.roadDetail === 'true') el.style.display = zoom >= 15 ? '' : 'none'; } };
  useEffect(() => {
    if (!element.current) return;
    let instance: LibreMap;
    try { instance = new LibreMap({ container: element.current, style: STYLE, center: [MAP_CENTER.lng, MAP_CENTER.lat], zoom: MAP_ZOOM, attributionControl: false, renderWorldCopies: false, maxPitch: 65, maxZoom: 19, maxTileCacheSize: 128, pixelRatio: Math.min(devicePixelRatio || 1, 2), canvasContextAttributes: { antialias: true } }); }
    catch { callbacks.current.onTileError(); element.current.dataset.mapError = 'webgl'; return; }
    map.current = instance;
    const observeView = () => {
      if (element.current) { element.current.dataset.mapPitch = instance.getPitch().toFixed(1); element.current.dataset.mapBearing = instance.getBearing().toFixed(1); }
      callbacks.current.onBearing(instance.getBearing()); rotateArrow();
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
    instance.on('zoomend', detailVisibility);
    instance.on('idle', () => {
      if (element.current && instance.getLayer('roadlink-buildings-3d')) element.current.dataset.visibleBuildings = String(instance.queryRenderedFeatures({ layers: ['roadlink-buildings-3d'] }).length);
    });
    instance.on('click', event => {
      const lines = instance.getLayer('route-selected') ? instance.queryRenderedFeatures(event.point, { layers: ['route-alternatives', 'route-selected'] }) : [];
      const alternative = lines.find(f => f.layer.id === 'route-alternatives');
      if (alternative) { const selected = callbacks.current.alternatives.find(r => r.id === alternative.properties.id); if (selected) callbacks.current.onSelectRoute(selected); return; }
      if (lines.length) return;
      callbacks.current.onPick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });
    const observer = new ResizeObserver(() => instance.resize()); observer.observe(element.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; routePins.current = []; roadMarkers.current = []; placeMarker.current = null; positionMarker.current = null; initialPositionCentered.current = false; };
  }, []);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    instance.setLayoutProperty('roadlink-buildings-3d', 'visibility', mode3D ? 'visible' : 'none');
    instance.easeTo({ pitch: mode3D ? 55 : 0, ...(!mode3D ? { bearing: 0 } : {}), duration: 500 });
  }, [mode3D, ready]);
  useEffect(() => { if (map.current && northReset) map.current.easeTo({ bearing: 0, duration: 350 }); }, [northReset]);
  useEffect(() => {
    if (!map.current || !headingUp) return;
    const fix = positionRef.current;
    const heading = course.current ?? (fix?.headingAvailable ? fix.heading : null);
    if (heading !== null && Number.isFinite(heading)) map.current.easeTo({ bearing: heading, duration: 350 });
  }, [headingUp]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    for (const marker of routePins.current) marker.remove(); routePins.current = [];
    const data: FeatureCollection<LineString> = { type: 'FeatureCollection', features: [] };
    if (route) {
      for (const candidate of [route, ...alternatives.filter(r => r.id !== route.id)]) data.features.push({ type: 'Feature', properties: { id: candidate.id, selected: candidate.id === route.id }, geometry: { type: 'LineString', coordinates: candidate.coordinates.map(p => [p.lng, p.lat]) } });
      const from = route.coordinates[0], to = route.coordinates.at(-1)!;
      routePins.current = [new Marker({ element: pin('route-origin-marker', '<span></span>') }).setLngLat([from.lng, from.lat]).addTo(instance), new Marker({ element: pin('destination-marker', '<span></span>'), anchor: 'bottom' }).setLngLat([to.lng, to.lat]).addTo(instance)];
      const bounds = new LngLatBounds(); for (const point of route.coordinates) bounds.extend([point.lng, point.lat]);
      instance.fitBounds(bounds, { padding: padding(instance), maxZoom: 16, pitch: callbacks.current.mode3D ? 55 : 0, bearing: callbacks.current.mode3D ? instance.getBearing() : 0, duration: 0 });
    }
    updateSource(instance, 'roadlink-routes', data);
  }, [route, alternatives, ready]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    placeMarker.current?.remove(); placeMarker.current = null;
    if (destination) { placeMarker.current = new Marker({ element: pin('destination-marker', '<span></span>'), anchor: 'bottom' }).setLngLat([destination.lng, destination.lat]).addTo(instance); centerOn(instance, destination, 16); }
  }, [destination, ready]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    for (const marker of roadMarkers.current) marker.remove(); roadMarkers.current = [];
    const speeds: FeatureCollection<LineString> = { type: 'FeatureCollection', features: (roadData?.sections ?? []).filter(s => s.kmh !== null).map(s => ({ type: 'Feature', properties: { kmh: s.kmh }, geometry: { type: 'LineString', coordinates: [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]] } })) };
    updateSource(instance, 'roadlink-speed', speeds);
    for (const feature of roadData?.features ?? []) {
      const el = document.createElement('button'); el.type = 'button'; el.className = `road-poi-marker image-marker ${feature.kind.includes('camera') ? 'camera' : feature.kind}`; el.setAttribute('aria-label', feature.label); el.dataset.roadDetail = feature.kind === 'pedestrian-crossing' ? 'true' : 'false';
      const image = document.createElement('img'); image.src = roadSymbol(feature).src; image.alt = feature.label; image.className = 'road-marker-image'; image.width = image.height = 32; el.appendChild(image);
      el.addEventListener('click', event => event.stopPropagation());
      const content = document.createElement('div'); content.className = 'road-popup';
      const title = document.createElement('strong'); title.textContent = feature.label; content.appendChild(title);
      const note = document.createElement('small'); note.textContent = feature.kind === 'signals' ? 'Đèn giao thông ghi nhận trên OSM; không có trạng thái đèn trực tiếp.' : ['traffic-calming', 'rail-crossing', 'pedestrian-crossing', 'hazard'].includes(feature.kind) ? 'Đặc điểm/nguy cơ được ghi trong OSM; không mặc nhiên có biển đã lắp. Quan sát thực tế.' : 'Nguồn OSM · gần tuyến · chưa xác nhận chiều áp dụng/chức năng xử phạt.'; content.appendChild(note);
      if (feature.code) { const code = document.createElement('small'); code.textContent = `Mã ghi nhận: ${feature.code}`; content.appendChild(code); }
      const anchor = document.createElement('a'); anchor.href = `https://www.openstreetmap.org/node/${feature.osmId}`; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = 'Xem đối tượng nguồn OSM'; content.appendChild(anchor);
      roadMarkers.current.push(new Marker({ element: el }).setLngLat([feature.lng, feature.lat]).setPopup(new Popup({ offset: 18, maxWidth: '280px' }).setDOMContent(content)).addTo(instance));
    }
    detailVisibility();
  }, [roadData, ready]);
  useEffect(() => {
    const instance = map.current; if (!instance || !ready) return;
    if (!position) { positionMarker.current?.remove(); positionMarker.current = null; course.current = null; initialPositionCentered.current = false; updateSource(instance, 'roadlink-accuracy', empty()); return; }
    updateSource(instance, 'roadlink-accuracy', uncertainty(position));
    for (const layer of ['roadlink-accuracy-fill', 'roadlink-accuracy-line']) instance.setPaintProperty(layer, layer.endsWith('fill') ? 'fill-color' : 'line-color', positionStale ? '#8d99a5' : '#1a73e8');
    if (!positionMarker.current) positionMarker.current = new Marker({ element: pin('position-marker navigation-position', '<span class="position-halo"></span><svg class="position-arrow" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 35 35 20 27 5 35Z"/></svg>') }).setLngLat([position.lng, position.lat]).addTo(instance);
    else positionMarker.current.setLngLat([position.lng, position.lat]);
    const el = positionMarker.current.getElement(), known = !positionStale && position.headingAvailable !== false && Number.isFinite(position.heading);
    if (known) {
      course.current = position.heading;
      el.classList.remove('direction-unknown');
    } else if (course.current === null) {
      el.classList.add('direction-unknown');
    }
    el.setAttribute('role', 'img'); el.setAttribute('aria-label', course.current !== null ? `Hướng di chuyển ${Math.round(course.current)} độ` : 'Chưa xác định hướng di chuyển'); rotateArrow();
    if (follow && navigating) {
      const activeHeading = course.current ?? (known ? position.heading : null);
      if (callbacks.current.mode3D && activeHeading !== null && Number.isFinite(activeHeading)) {
        instance.easeTo({ center: [position.lng, position.lat], zoom: Math.min(17, locationZoom(position.accuracy)), padding: padding(instance), pitch: 50, bearing: activeHeading, duration: 400 });
      } else {
        centerOn(instance, position, Math.min(17, locationZoom(position.accuracy)));
      }
    } else if (follow && focusPosition && !initialPositionCentered.current) { initialPositionCentered.current = true; centerOn(instance, position, locationZoom(position.accuracy)); }
  }, [position, ready, navigating, follow, focusPosition, positionStale]);
  useEffect(() => {
    if (map.current && ready && position && recenter > lastCentered.current) { lastCentered.current = recenter; centerOn(map.current, position, locationZoom(position.accuracy)); }
  }, [recenter, position, ready]);
  return <div ref={element} className="map-canvas" data-basemap="openfreemap-osm" data-map-ready="false" data-mode={mode3D ? '3d' : '2d'} aria-label="Bản đồ OpenStreetMap" role="img" />;
}

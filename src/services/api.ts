import { cumulative, distance, projectOnRoute } from '../domain/geometry';
import { createCache } from './cache';
import type { Coordinate, Maneuver, OsmRouteEdge, Place, Route, RouteStep } from '../domain/types';
const ROUTER = (import.meta.env.VITE_ROUTER_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const ROUTER_BIKE = (import.meta.env.VITE_ROUTER_BIKE_URL || 'https://routing.openstreetmap.de/routed-bike').replace(/\/$/, '');
const ROUTER_FOOT = (import.meta.env.VITE_ROUTER_FOOT_URL || 'https://routing.openstreetmap.de/routed-foot').replace(/\/$/, '');
const GEOCODER = (import.meta.env.VITE_GEOCODER_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
const OVERPASS = (import.meta.env.VITE_OVERPASS_URL || (import.meta.env.DEV ? '/api/interpreter' : 'https://overpass-api.de/api/interpreter')).replace(/\/$/, '');
const OVERPASS_FR = (import.meta.env.VITE_OVERPASS_FR_URL || (import.meta.env.DEV ? '/api/overpass-fr' : 'https://overpass.openstreetmap.fr/api/interpreter')).replace(/\/$/, '');
const OVERPASS_TIMEOUT_MS = 3500;
const OVERPASS_FR_TIMEOUT_MS = 14000;
export const NEARBY_RADIUS_M = 20000;
const NEARBY_RESULT_LIMIT = 8;
const CATEGORY_RESULT_LIMIT = 15;
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const NEARBY_CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const searchCache = createCache<Place[]>(CACHE_MAX_ENTRIES, SEARCH_CACHE_TTL_MS);
const nearbyCache = createCache<Place[]>(CACHE_MAX_ENTRIES, NEARBY_CACHE_TTL_MS);
let searchQueue: Promise<unknown> = Promise.resolve();
let lastSearch = 0;
async function getJson(url: string, signal?: AbortSignal, timeoutMs = 16000): Promise<unknown> {
  // AbortSignal.any/timeout are unavailable on some supported iOS WebKit versions.
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(response.status === 429 ? 'Dịch vụ đang giới hạn lượt truy cập. Vui lòng chờ rồi thử lại.' : response.status >= 502 && response.status <= 504 ? 'Dịch vụ địa điểm đang quá tải. Thử lại sau ít phút.' : 'Chưa kết nối được dịch vụ bản đồ. Hãy kiểm tra mạng và thử lại.');
    return await response.json();
  } catch (error) {
    if (timedOut) { const timeoutError = new Error('Dịch vụ phản hồi chậm.'); timeoutError.name = 'TimeoutError'; throw timeoutError; }
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function coordinate(value: unknown): Coordinate | null {
  if (!Array.isArray(value) || !finite(value[0]) || !finite(value[1]) || Math.abs(value[0]) > 180 || Math.abs(value[1]) > 90) return null;
  return { lng: value[0], lat: value[1] };
}
export type SearchNear = { lat: number; lng: number; radiusDeg?: number };
export async function searchPlaces(query: string, signal?: AbortSignal, near?: SearchNear): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const entered=/^([+-]?\d+(?:\.\d+)?)\s*[,;]\s*([+-]?\d+(?:\.\d+)?)$/.exec(q);
  if(entered){
    const lat=Number(entered[1]),lng=Number(entered[2]);
    if(Math.abs(lat)>90||Math.abs(lng)>180)throw new Error('Tọa độ không hợp lệ. Nhập vĩ độ, kinh độ; ví dụ theo định dạng số thập phân.');
    return [{id:`coord:${lat},${lng}`,name:`${lat.toFixed(5)}, ${lng.toFixed(5)}`,detail:'Tọa độ đã nhập',lat,lng}];
  }
  const key = q.toLocaleLowerCase('vi') + (near ? `@${near.lat.toFixed(2)},${near.lng.toFixed(2)}` : '');
  const cached = searchCache.get(key);
  if (cached) return cached;
  // Explicit submission only; no search-as-you-type against public Nominatim.
  const request = searchQueue.then(async () => {
    const delay = Math.max(0, 1100 - (Date.now() - lastSearch));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
    lastSearch = Date.now();
    const params = new URLSearchParams({ q, format: 'jsonv2', limit: '6', 'accept-language': 'vi', addressdetails: '1' });
    if (near) {
      const d = near.radiusDeg ?? 0.12;
      params.set('viewbox', [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(','));
      params.set('bounded', '1');
    }
    const data = await getJson(`${GEOCODER}/search?${params}`, signal);
    if (!Array.isArray(data)) throw new Error('Kết quả tìm kiếm không hợp lệ. Hãy thử lại.');
    let places: Place[] = data.flatMap((item: unknown) => {
      if (!record(item) || typeof item.display_name !== 'string') return [];
      const lat = Number(item.lat), lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
      const parts = item.display_name.split(',');
      return [{ id: String(item.place_id ?? `${lat},${lng}`), lat, lng, name: typeof item.name === 'string' && item.name ? item.name : parts[0], detail: parts.slice(1).join(',').trim() }];
    });
    if (near) places = places.slice().sort((a, b) => distance(a, near) - distance(b, near));
    searchCache.set(key, places);
    return places;
  });
  searchQueue = request.catch(() => undefined);
  return request;
}
// Single source of truth for OSM facets: each maps one (osmKey,value) pair to a
// display label and, where searchable from the category pills, a category key.
// ALL_NEARBY_TAGS, NEARBY_LABELS and CATEGORY_TAGS are all derived from this list
// so the "general nearby" and "search by category" queries can't drift apart.
type OsmKey = 'amenity' | 'shop' | 'tourism';
type Facet = { osmKey: OsmKey; value: string; label: string; category?: string };
const FACETS: Facet[] = [
  { osmKey: 'amenity', value: 'restaurant', label: 'Nhà hàng', category: 'restaurant' },
  { osmKey: 'amenity', value: 'fast_food', label: 'Đồ ăn nhanh', category: 'restaurant' },
  { osmKey: 'amenity', value: 'cafe', label: 'Cà phê', category: 'cafe' },
  { osmKey: 'amenity', value: 'fuel', label: 'Cây xăng', category: 'fuel' },
  { osmKey: 'amenity', value: 'hotel', label: 'Khách sạn', category: 'hotel' },
  { osmKey: 'amenity', value: 'atm', label: 'ATM', category: 'atm' },
  { osmKey: 'amenity', value: 'bank', label: 'Ngân hàng', category: 'atm' },
  { osmKey: 'amenity', value: 'pharmacy', label: 'Nhà thuốc' },
  { osmKey: 'amenity', value: 'hospital', label: 'Bệnh viện' },
  { osmKey: 'amenity', value: 'marketplace', label: 'Chợ' },
  { osmKey: 'shop', value: 'supermarket', label: 'Siêu thị', category: 'shop' },
  { osmKey: 'shop', value: 'convenience', label: 'Tạp hóa', category: 'shop' },
  { osmKey: 'shop', value: 'grocery', label: 'Siêu thị', category: 'shop' },
  { osmKey: 'shop', value: 'greengrocer', label: 'Siêu thị', category: 'shop' },
  { osmKey: 'shop', value: 'bakery', label: 'Tiệm bánh' },
  { osmKey: 'shop', value: 'mall', label: 'Trung tâm thương mại', category: 'shop' },
  { osmKey: 'tourism', value: 'hotel', label: 'Khách sạn', category: 'hotel' },
  { osmKey: 'tourism', value: 'guest_house', label: 'Khách sạn', category: 'hotel' },
  { osmKey: 'tourism', value: 'motel', label: 'Khách sạn', category: 'hotel' },
  { osmKey: 'tourism', value: 'hostel', label: 'Khách sạn', category: 'hotel' }
];
const NEARBY_LABELS: Record<string, string> = Object.fromEntries(FACETS.map(f => [f.value, f.label]));
function tagFor(osmKey: OsmKey, values: string[]): string {
  const unique = [...new Set(values)];
  return unique.length === 1 ? `["${osmKey}"="${unique[0]}"]` : `["${osmKey}"~"^(${unique.join('|')})$"]`;
}
function tagsForFacets(facets: Facet[]): string[] {
  const byKey = new Map<OsmKey, string[]>();
  for (const f of facets) byKey.set(f.osmKey, [...(byKey.get(f.osmKey) ?? []), f.value]);
  return [...byKey.entries()].map(([key, values]) => tagFor(key, values));
}
const ALL_NEARBY_TAGS = tagsForFacets(FACETS);
const CATEGORY_KEYS = [...new Set(FACETS.map(f => f.category).filter((c): c is string => !!c))];
const CATEGORY_TAGS: Record<string, string[]> = Object.fromEntries(
  CATEGORY_KEYS.map(category => [category, tagsForFacets(FACETS.filter(f => f.category === category))])
);
function nearbyQuery(lat: number, lng: number, tags: string[], radiusM: number): string {
  return `[out:json][timeout:15];(${tags.flatMap(tag => [`node(around:${radiusM},${lat},${lng})${tag};`, `way(around:${radiusM},${lat},${lng})${tag};`]).join('')});out center 60;`;
}
function mapNearby(data: unknown): Place[] {
  if (!record(data) || !Array.isArray(data.elements)) throw new Error('Không tải được địa điểm gần đây.');
  return data.elements.flatMap((item: unknown) => {
    if (!record(item) || !record(item.tags)) return [];
    const lat = typeof item.lat === 'number' ? item.lat : record(item.center) && typeof item.center.lat === 'number' ? item.center.lat : null;
    const lng = typeof item.lon === 'number' ? item.lon : record(item.center) && typeof item.center.lon === 'number' ? item.center.lon : null;
    if (lat === null || lng === null) return [];
    const tags = item.tags as Record<string, string>;
    const name = tags.name || tags['name:vi'] || tags.brand;
    if (!name) return [];
    const street = tags['addr:street'] && !tags['addr:street'].includes(name) ? ` · ${tags['addr:street']}` : '';
    return [{ id: `poi:${String(item.id)}`, name, detail: `${NEARBY_LABELS[tags.amenity] ?? NEARBY_LABELS[tags.shop] ?? NEARBY_LABELS[tags.tourism] ?? 'Địa điểm'}${street}`, lat, lng }];
  });
}
async function fetchNearbyQuery(query: string, signal?: AbortSignal): Promise<Place[]> {
  const hosts = [{ name: 'primary', url: OVERPASS, timeout: OVERPASS_TIMEOUT_MS }, { name: 'fr-mirror', url: OVERPASS_FR, timeout: OVERPASS_FR_TIMEOUT_MS }];
  let lastError: unknown = null;
  for (const host of hosts) {
    try {
      return mapNearby(await getJson(`${host.url}?data=${encodeURIComponent(query)}`, signal, host.timeout));
    } catch (error) {
      if (signal?.aborted) throw error;
      if (import.meta.env.DEV) console.warn(`[overpass] host "${host.name}" (${host.url}) failed:`, error);
      lastError = error;
    }
  }
  throw lastError ?? new Error('Không tải được địa điểm gần đây.');
}
function nearbyPlacesFrom(places: Place[], lat: number, lng: number, limit: number): Place[] {
  return [...new Map(places.map(place => [place.id, place])).values()]
    .sort((a, b) => distance(a, { lat, lng }) - distance(b, { lat, lng }))
    .slice(0, limit);
}
export async function nearbyPlaces(lat: number, lng: number, signal?: AbortSignal, radiusM: number = NEARBY_RADIUS_M): Promise<Place[]> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}@${radiusM}`;
  const cached = nearbyCache.get(key);
  if (cached) return cached;
  const unique = nearbyPlacesFrom(await fetchNearbyQuery(nearbyQuery(lat, lng, ALL_NEARBY_TAGS, radiusM), signal), lat, lng, NEARBY_RESULT_LIMIT);
  nearbyCache.set(key, unique);
  return unique;
}
const CATEGORY_ALIASES_SOURCE: Record<string, string[]> = {
  fuel: ['cây xăng', 'cay xang', 'xăng', 'trạm xăng'],
  restaurant: ['nhà hàng', 'nha hang', 'quán ăn', 'quan an'],
  cafe: ['cà phê', 'ca phe', 'cafe', 'quán cà phê'],
  hotel: ['khách sạn', 'khach san', 'hotel'],
  atm: ['atm', 'ngân hàng', 'ngan hang'],
  shop: ['tạp hóa', 'tap hoa', 'siêu thị', 'sieu thi', 'cửa hàng tiện lợi', 'minimart']
};
const CATEGORY_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_ALIASES_SOURCE).flatMap(([category, aliases]) => aliases.map(alias => [alias, category]))
);
export function categoryForQuery(text: string): string | null {
  return CATEGORY_ALIASES[text.trim().toLocaleLowerCase('vi')] ?? null;
}
export async function nearbyCategory(lat: number, lng: number, categoryOrLabel: string, signal?: AbortSignal, radiusM: number = NEARBY_RADIUS_M): Promise<Place[]> {
  const catKey = categoryForQuery(categoryOrLabel) ?? categoryOrLabel;
  const tags = CATEGORY_TAGS[catKey];
  if (!tags) return [];
  const key = `${catKey}:${lat.toFixed(2)},${lng.toFixed(2)}@${radiusM}`;
  const cached = nearbyCache.get(key);
  if (cached) return cached;
  const unique = nearbyPlacesFrom(await fetchNearbyQuery(nearbyQuery(lat, lng, tags, radiusM), signal), lat, lng, CATEGORY_RESULT_LIMIT);
  if (unique.length) nearbyCache.set(key, unique);
  return unique;
}
function maneuverFor(type: string, modifier: string): Maneuver {
  if (type === 'arrive' || type === 'depart') return type;
  if (type.includes('roundabout') || type === 'rotary') return 'roundabout';
  if (modifier === 'uturn') return 'uturn';
  if (modifier === 'slight left') return 'slight-left';
  if (modifier === 'slight right') return 'slight-right';
  if (modifier.includes('left')) return 'left';
  if (modifier.includes('right')) return 'right';
  return 'straight';
}
export function instructionFor(m: Maneuver, road: string, exit?: number): string {
  const onto = road ? ` vào ${road}` : '';
  switch (m) {
    case 'depart': return road ? `Bắt đầu đi theo ${road}` : 'Bắt đầu đi theo tuyến đường';
    case 'left': return `Rẽ trái${onto}`;
    case 'right': return `Rẽ phải${onto}`;
    case 'slight-left': return `Chếch trái${onto}`;
    case 'slight-right': return `Chếch phải${onto}`;
    case 'uturn': return `Quay đầu${onto}`;
    case 'roundabout': return `Đi vào vòng xuyến${exit ? `, ra ở lối thứ ${exit}` : ''}${onto}`;
    case 'arrive': return 'Bạn đã đến điểm đến';
    default: return road ? `Tiếp tục đi theo ${road}` : 'Tiếp tục đi thẳng';
  }
}
export function parseRoute(data: unknown, destination: Place): Route {
  if (!record(data) || data.code !== 'Ok' || !Array.isArray(data.routes) || !record(data.routes[0])) throw new Error('Không tìm thấy tuyến đường ô tô đến địa điểm này.');
  const raw = data.routes[0];
  if (!record(raw.geometry) || !Array.isArray(raw.geometry.coordinates)) throw new Error('Dữ liệu tuyến đường không hợp lệ.');
  const coordinates = raw.geometry.coordinates.map(coordinate);
  if (coordinates.length < 2 || coordinates.some(p => p === null) || !finite(raw.distance) || raw.distance < 0 || !finite(raw.duration) || raw.duration < 0) throw new Error('Dữ liệu tuyến đường không hợp lệ.');
  const points = coordinates as Coordinate[];
  const lengths = cumulative(points);
  const steps: RouteStep[] = [];
  let offset = 0;
  if (Array.isArray(raw.legs)) for (const [legIndex,leg] of raw.legs.entries()) {
    if (!record(leg) || !Array.isArray(leg.steps)) continue;
    for (const s of leg.steps) {
      if (!record(s) || !record(s.maneuver)) continue;
      const at = coordinate(s.maneuver.location);
      if (!at) continue;
      offset = Math.max(offset, projectOnRoute(at, points, lengths, Math.max(0, offset - 1)).along);
      let m = maneuverFor(String(s.maneuver.type ?? ''), String(s.maneuver.modifier ?? ''));
      if(m==='arrive'&&legIndex<raw.legs.length-1)continue;
      if(m==='depart'&&legIndex>0)m='straight';
      const road = typeof s.name === 'string' ? s.name : '';
      steps.push({ index: steps.length, road, maneuver: m, instruction: instructionFor(m, road, finite(s.maneuver.exit) ? s.maneuver.exit : undefined),
        at, offset, distance: finite(s.distance) ? s.distance : 0, duration: finite(s.duration) ? s.duration : 0 });
    }
  }
  if (!steps.length) throw new Error('Dịch vụ chưa trả về chỉ dẫn cho tuyến đường này.');
  if (steps[steps.length - 1].maneuver !== 'arrive') steps.push({ index: steps.length, road: destination.name, maneuver: 'arrive', instruction: 'Bạn đã đến điểm đến', at: points[points.length - 1], offset: lengths[lengths.length - 1], distance: 0, duration: 0 });
  const osmEdges: OsmRouteEdge[] = [];
  let edgeAlong = 0;
  let annotationsValid = true;
  if (Array.isArray(raw.legs)) for (const leg of raw.legs) {
    if (!record(leg) || !record(leg.annotation)) { annotationsValid=false;break; }
    const { nodes, distance: distances } = leg.annotation;
    if (!Array.isArray(nodes) || !Array.isArray(distances) || nodes.length !== distances.length + 1 || !nodes.every(n=>Number.isSafeInteger(n)&&n>0) || !distances.every(n=>finite(n)&&n>=0)) { annotationsValid=false;break; }
    for (let i = 0; i < distances.length; i++) {
      const meters = distances[i];
      if (!finite(meters) || meters < 0 || !Number.isSafeInteger(nodes[i]) || !Number.isSafeInteger(nodes[i + 1]) || nodes[i] <= 0 || nodes[i + 1] <= 0) continue;
      osmEdges.push({ from: nodes[i], to: nodes[i + 1], start: edgeAlong, end: edgeAlong + meters });
      edgeAlong += meters;
    }
  }
  if(!annotationsValid)osmEdges.length=0;
  if (edgeAlong > 0) {
    const scale = lengths[lengths.length - 1] / edgeAlong;
    for (const edge of osmEdges) { edge.start *= scale; edge.end *= scale; }
  }
  const summary=Array.isArray(raw.legs)?raw.legs.filter(record).map(leg=>typeof leg.summary==='string'?leg.summary:'').filter(Boolean).join(', '):'';
  return { id: `route-${Date.now()}`, coordinates: points, distance: raw.distance, duration: raw.duration, destination, steps, osmEdges,summary };
}
export type TransportProfile = 'car' | 'bike' | 'walk';
export async function fetchRoute(origin: Coordinate, destination: Place, signal?: AbortSignal, profile: TransportProfile = 'car'): Promise<Route> {
  return (await fetchRoutes(origin,destination,signal,[],profile))[0];
}
export async function fetchRoutes(origin: Coordinate, destination: Place, signal?: AbortSignal,via:Coordinate[]=[],profile:TransportProfile='car'): Promise<Route[]> {
  const coordinates = [origin,...via,destination].map(point=>`${point.lng},${point.lat}`).join(';');
  const base = profile === 'bike' ? ROUTER_BIKE : profile === 'walk' ? ROUTER_FOOT : ROUTER;
  const alternatives = profile === 'car' ? '&alternatives=true' : '';
  const data = await getJson(`${base}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true${alternatives}&annotations=nodes,distance`, signal);
  if(!record(data)||data.code!=='Ok'||!Array.isArray(data.routes)||!data.routes.length)return [parseRoute(data,destination)];
  const routes = profile === 'car' ? data.routes.slice(0,3) : data.routes.slice(0,1);
  return routes.map((raw,i)=>({...parseRoute({...data,routes:[raw]},destination),id:`route-${Date.now()}-${i}`}));
}
export function friendlyError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return 'Yêu cầu đã được hủy.';
  if (error instanceof Error && error.name === 'TimeoutError') return 'Dịch vụ phản hồi chậm. Hãy thử lại khi mạng ổn định hơn.';
  return error instanceof Error && error.message && !/fetch|network|load failed/i.test(error.message) ? error.message : 'Không có kết nối mạng. Tuyến đã tải vẫn được giữ; hãy kiểm tra mạng rồi thử lại.';
}

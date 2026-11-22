export type Coordinate = { lat: number; lng: number };
export type Place = Coordinate & { id: string; name: string; detail: string };
export type Fix = Coordinate & { accuracy: number; speed: number; heading: number; headingAvailable?:boolean;timestamp: number };
export type Maneuver = 'depart' | 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'uturn' | 'roundabout' | 'arrive';
export type RouteStep = { index: number; road: string; maneuver: Maneuver; instruction: string; at: Coordinate; distance: number; duration: number; offset: number };
export type OsmRouteEdge = { from: number; to: number; start: number; end: number };
export type Route = { id: string; coordinates: Coordinate[]; steps: RouteStep[]; distance: number; duration: number; destination: Place; osmEdges?: OsmRouteEdge[];summary?:string };
export type Progress = {
  along: number; remaining: number; etaSeconds: number; step: RouteStep;
  nextTurn: number; offRoute: boolean; distanceFromRoute: number; arrived: boolean;
};

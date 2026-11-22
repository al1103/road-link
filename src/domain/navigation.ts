import { cumulative, distance, projectOnRoute } from './geometry';
import type { Fix, Progress, Route } from './types';
/** Stateful matcher: ignores stale/poor fixes, confirms deviations, limits GPS jitter. */
export class Navigator {
  private lengths: number[];
  private lastAlong = 0;
  private lastTimestamp = 0;
  private offCount = 0;
  constructor(readonly route: Route) { this.lengths = cumulative(route.coordinates); }
  update(fix: Fix): Progress | null {
    if (!Number.isFinite(fix.accuracy) || fix.accuracy > 65 || fix.accuracy < 0 || !Number.isFinite(fix.lat) || !Number.isFinite(fix.lng) || Math.abs(fix.lat) > 90 || Math.abs(fix.lng) > 180 || !Number.isFinite(fix.timestamp) || fix.timestamp <= this.lastTimestamp) return null;
    const seconds = this.lastTimestamp ? Math.min(30, Math.max(0.2, (fix.timestamp - this.lastTimestamp) / 1000)) : 1;
    this.lastTimestamp = fix.timestamp;
    const maxAdvance = Math.max(90, Math.max(0, fix.speed) * seconds * 2 + fix.accuracy * 2);
    const hit = projectOnRoute(fix, this.route.coordinates, this.lengths, Math.max(0, this.lastAlong - 60), this.lastAlong + maxAdvance);
    const tolerance = Math.max(35, Math.min(60, fix.accuracy * 1.5));
    this.offCount = hit.distance > tolerance ? this.offCount + 1 : 0;
    const offRoute = this.offCount >= 3;
    if (hit.distance <= tolerance) this.lastAlong = Math.max(this.lastAlong, hit.along);
    const total = this.lengths[this.lengths.length - 1];
    const remaining = Math.max(0, total - this.lastAlong);
    const arrived = remaining <= 28 && distance(fix, this.route.coordinates[this.route.coordinates.length - 1]) <= 35;
    const step = this.route.steps.find(s => s.offset > this.lastAlong + 12) ?? this.route.steps[this.route.steps.length - 1];
    return { along: this.lastAlong, remaining, etaSeconds: this.route.duration * remaining / Math.max(total, 1), step,
      nextTurn: Math.max(0, step.offset - this.lastAlong), offRoute, distanceFromRoute: hit.distance, arrived };
  }
}

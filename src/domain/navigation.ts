import { cumulative, distance, projectOnRoute } from './geometry';
import type { Fix, Progress, Route } from './types';
const OBSERVED_WINDOW_MS = 120000, MIN_OBSERVED_SPAN_MS = 20000;
/** Stateful matcher: ignores stale/poor fixes, confirms deviations, limits GPS jitter. */
export class Navigator {
  private lengths: number[];
  private stepEnds: number[];
  private lastAlong = 0;
  private lastTimestamp = 0;
  private offCount = 0;
  private samples: { time: number; along: number }[] = [];
  constructor(readonly route: Route) {
    this.lengths = cumulative(route.coordinates);
    const total = this.lengths[this.lengths.length - 1] ?? 0;
    this.stepEnds = route.steps.map((step, index) => Math.min(total, route.steps[index + 1]?.offset ?? total));
  }
  /** Seconds planned from the start to `along`, using each step's own speed instead of the route-wide average. */
  private plannedAt(along: number): number {
    let seconds = 0;
    for (const [index, step] of this.route.steps.entries()) {
      const end = this.stepEnds[index], span = end - step.offset;
      if (span <= 0) { if (along > step.offset) seconds += step.duration; continue; }
      seconds += step.duration * Math.min(Math.max(along - step.offset, 0), span) / span;
    }
    return seconds;
  }
  /** Speed over the last two minutes, so time spent stopped at lights or in a jam is part of the estimate. */
  private observedSpeed(time: number, along: number): number | null {
    const last = this.samples[this.samples.length - 1];
    // A long gap (backgrounded app, lost GPS) would divide movement by idle time and fake a jam.
    if (last && time - last.time > OBSERVED_WINDOW_MS) this.samples = [];
    this.samples.push({ time, along });
    while (this.samples.length > 2 && time - this.samples[0].time > OBSERVED_WINDOW_MS) this.samples.shift();
    const first = this.samples[0], span = time - first.time;
    if (span < MIN_OBSERVED_SPAN_MS) return null;
    return Math.max(0, along - first.along) / (span / 1000);
  }
  update(fix: Fix): Progress | null {
    if (!Number.isFinite(fix.accuracy) || fix.accuracy > 65 || fix.accuracy < 0 || !Number.isFinite(fix.lat) || !Number.isFinite(fix.lng) || Math.abs(fix.lat) > 90 || Math.abs(fix.lng) > 180 || !Number.isFinite(fix.timestamp) || fix.timestamp <= this.lastTimestamp) return null;
    const seconds = this.lastTimestamp ? Math.min(30, Math.max(0.2, (fix.timestamp - this.lastTimestamp) / 1000)) : 1;
    this.lastTimestamp = fix.timestamp;
    const maxAdvance = Math.max(90, Math.max(0, fix.speed) * seconds * 2 + fix.accuracy * 2);
    const hit = projectOnRoute(fix, this.route.coordinates, this.lengths, Math.max(0, this.lastAlong - 60), this.lastAlong + maxAdvance);
    const tolerance = Math.max(35, Math.min(60, fix.accuracy * 1.5));
    this.offCount = hit.distance > tolerance ? this.offCount + 1 : 0;
    const offRoute = this.offCount >= 3;
    const onRoute = hit.distance <= tolerance;
    if (onRoute) this.lastAlong = Math.max(this.lastAlong, hit.along);
    // Time spent off the route would otherwise drag the measured speed down and inflate the estimate after a reroute.
    if (offRoute) this.samples = [];
    const total = this.lengths[this.lengths.length - 1];
    const remaining = Math.max(0, total - this.lastAlong);
    const arrived = remaining <= 28 && distance(fix, this.route.coordinates[this.route.coordinates.length - 1]) <= 35;
    const step = this.route.steps.find(s => s.offset > this.lastAlong + 12) ?? this.route.steps[this.route.steps.length - 1];
    // Plan from per-step speeds, then blend with the speed actually being made. Without a traffic feed this is what keeps the number honest.
    const covered = this.plannedAt(this.lastAlong);
    const plan = covered > 0 ? Math.min(this.route.duration, Math.max(0, this.route.duration - covered)) : this.route.duration * remaining / Math.max(total, 1);
    const observed = onRoute ? this.observedSpeed(fix.timestamp, this.lastAlong) : null;
    let etaSeconds = plan;
    if (observed !== null && remaining > 120 && plan > 10) {
      const planSpeed = remaining / plan;
      const speed = Math.min(Math.max(.7 * observed + .3 * planSpeed, planSpeed * .45), planSpeed * 2.4);
      etaSeconds = remaining / Math.max(speed, .5);
    }
    return { along: this.lastAlong, remaining, etaSeconds, step,
      nextTurn: Math.max(0, step.offset - this.lastAlong), offRoute, distanceFromRoute: hit.distance, arrived };
  }
}

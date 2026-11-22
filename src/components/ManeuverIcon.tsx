import { ArrowUp, CornerUpLeft, CornerUpRight, MoveUpLeft, MoveUpRight, RotateCcw, RotateCw, Flag } from 'lucide-react';
import type { Maneuver } from '../domain/types';
export default function ManeuverIcon({ type, size = 28 }: { type: Maneuver; size?: number }) {
  const Icon = { depart: ArrowUp, straight: ArrowUp, left: CornerUpLeft, right: CornerUpRight, 'slight-left': MoveUpLeft, 'slight-right': MoveUpRight, uturn: RotateCcw, roundabout: RotateCw, arrive: Flag }[type];
  return <Icon size={size} strokeWidth={2.6} aria-hidden="true" />;
}

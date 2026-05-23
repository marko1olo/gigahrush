/* ── Story route gates: small floor mutations keyed by plot state ─ */

import {
  Cell,
  LiftDirection,
  type Entity,
  type GameState,
} from '../core/types';
import { World } from '../core/world';
import { ensureReachableRouteLifts } from '../gen/shared';
import { currentFloorRunEntry, podadLowerRouteOpen } from './procedural_floors';

function hasUsableLift(world: World, direction: LiftDirection): boolean {
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] === Cell.LIFT && world.liftDir[i] === direction) return true;
  }
  return false;
}

export function applyStoryRouteGates(world: World, player: Entity, state: GameState): boolean {
  const entry = currentFloorRunEntry(state);
  if (entry.designFloorId !== 'podad' || !podadLowerRouteOpen(state)) return false;
  const hadDownLift = hasUsableLift(world, LiftDirection.DOWN);
  ensureReachableRouteLifts(world, player.x, player.y, [LiftDirection.UP, LiftDirection.DOWN]);
  return !hadDownLift && hasUsableLift(world, LiftDirection.DOWN);
}

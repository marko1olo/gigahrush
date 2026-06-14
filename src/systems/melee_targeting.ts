import { EntityType, type Entity } from '../core/types';
import type { World } from '../core/world';

import { WEAPON_STATS } from '../data/catalog';

const MELEE_TARGET_EPSILON = 1e-9;

export function selectMeleeTarget(
  world: World,
  attacker: Entity,
  candidates: readonly Entity[],
  reach: number,
  weaponId?: string,
): Entity | undefined {
  const hitRadius = WEAPON_STATS[weaponId || '']?.hitRadius ?? 0.6;
  const effectiveReach = reach + hitRadius;
  const effectiveReach2 = effectiveReach * effectiveReach;
  let best: Entity | undefined;
  let bestDist2 = Number.POSITIVE_INFINITY;
  let bestId = Number.MAX_SAFE_INTEGER;

  for (const candidate of candidates) {
    if ((candidate.type !== EntityType.MONSTER && candidate.type !== EntityType.NPC) || !candidate.alive) continue;
    if (candidate.id === attacker.id) continue;

    const dx = world.delta(attacker.x, candidate.x);
    const dy = world.delta(attacker.y, candidate.y);
    const dist2 = dx * dx + dy * dy;

    if (dist2 <= effectiveReach2) {
      if (dist2 + MELEE_TARGET_EPSILON < bestDist2
        || (Math.abs(dist2 - bestDist2) <= MELEE_TARGET_EPSILON && candidate.id < bestId)) {
        best = candidate;
        bestDist2 = dist2;
        bestId = candidate.id;
      }
    }
  }

  return best;
}

/* ── AI system — orchestrator ─────────────────────────────────── */

export { forceHide, getNpcStateText } from './npc_fsm';
export { tryMonsterProjectileStagger } from './monster';

import {
  type Entity, type GameState, type Msg, type GameClock,
  EntityType, FloorLevel,
} from '../../core/types';
import { World } from '../../core/world';
import { setPathContext } from './pathfinding';
import { setEntityMap, updateMonster } from './monster';
import { setCombatContext, tryFactionCombat, tryFleeFromMonster } from './combat';
import { setNpcContext, updateNPC } from './npc_fsm';
import { setMinistryContext, updateMinistryNPC } from './ministry_ai';
import { expireMonsterBaits } from '../monster_bait';

const entityByIdCache = new Map<number, Entity>();

export function updateAI(world: World, entities: Entity[], dt: number, time: number, msgs: Msg[], playerId: number, clock: GameClock, samosborActive: boolean, nextId: { v: number }, currentFloor?: FloorLevel, state?: GameState): void {
  // Push per-frame refs into sub-modules
  setPathContext(msgs, time, samosborActive);
  setCombatContext(msgs, time);
  setNpcContext(msgs, time);
  setMinistryContext(msgs, time);
  expireMonsterBaits(state, time);

  // Build id→entity map once per frame for O(1) cached target lookups
  entityByIdCache.clear();
  for (const e of entities) if (e.alive) entityByIdCache.set(e.id, e);
  setEntityMap(entityByIdCache);

  const isMinistry = currentFloor === FloorLevel.MINISTRY;

  for (const e of entities) {
    if (!e.alive || !e.ai) continue;
    if (e.type === EntityType.NPC) {
      if (!tryFactionCombat(world, entities, e, dt, time, msgs, nextId)) {
        if (!tryFleeFromMonster(world, entities, e, dt)) {
          if (isMinistry) {
            updateMinistryNPC(world, entities, e, dt, time, clock, samosborActive);
          } else {
            updateNPC(world, entities, e, dt, time, clock, samosborActive);
          }
        }
      }
    }
    if (e.type === EntityType.MONSTER) updateMonster(world, entities, e, dt, time, msgs, playerId, nextId, state);
  }
}

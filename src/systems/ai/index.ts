/* ── AI system — orchestrator ─────────────────────────────────── */

export { forceHide, getNpcStateText } from './npc_fsm';
export { tryMonsterProjectileStagger } from './monster';

import {
  type Entity, type GameState, type Msg, type GameClock,
  EntityType, Faction, FloorLevel,
} from '../../core/types';
import { World } from '../../core/world';
import { setPathContext } from './pathfinding';
import { setEntityMap, updateMonster } from './monster';
import { setCombatContext, tryFactionCombat, tryFleeFromMonster } from './combat';
import { setNpcContext, updateNPC } from './npc_fsm';
import { setMinistryContext, updateMinistryNPC } from './ministry_ai';
import { expireMonsterBaits } from '../monster_bait';
import { ENTITY_MASK_ACTOR, ensureEntityIndex } from '../entity_index';

const NEAR_AI_RADIUS = 36;
const MAX_STAGGERED_AI_DT = 1.25;
const nearAiQuery: Entity[] = [];
let aiFrame = 0;

function deterministicThinkInterval(e: Entity): number {
  const jitter = ((e.id * 1103515245 + 12345) >>> 0) % 1000 / 1000;
  if (e.type === EntityType.MONSTER) return 0.55 + jitter * 0.35;
  if (e.faction !== undefined && e.faction !== Faction.CITIZEN) return 0.7 + jitter * 0.4;
  if (e.isTraveler) return 0.9 + jitter * 0.5;
  return 1.1 + jitter * 0.7;
}

function consumeAiDt(e: Entity, player: Entity | undefined, dt: number, frame: number): number {
  const ai = e.ai;
  if (!ai) return 0;
  if ((ai.windupTimer ?? 0) > 0 || (ai.staggerTimer ?? 0) > 0) {
    ai.thinkAccum = 0;
    return dt;
  }
  if (player?.alive && ai.nearFrame === frame) {
    ai.thinkAccum = 0;
    return dt;
  }

  let interval = ai.thinkInterval ?? (ai.thinkInterval = deterministicThinkInterval(e));
  if (ai.combatTargetId !== undefined) interval = Math.min(interval, e.type === EntityType.MONSTER ? 0.45 : 0.55);
  if (player?.alive && ai.combatTargetId === player.id) interval = Math.min(interval, 0.22);
  ai.thinkAccum = Math.min(MAX_STAGGERED_AI_DT, (ai.thinkAccum ?? (((e.id * 31) % 100) / 100) * interval) + dt);
  if (ai.thinkAccum < interval) return 0;
  const elapsed = ai.thinkAccum;
  ai.thinkAccum = 0;
  return elapsed;
}

export function updateAI(world: World, entities: Entity[], dt: number, time: number, msgs: Msg[], playerId: number, clock: GameClock, samosborActive: boolean, nextId: { v: number }, currentFloor?: FloorLevel, state?: GameState): void {
  // Push per-frame refs into sub-modules
  setPathContext(msgs, time, samosborActive);
  setCombatContext(msgs, time);
  setNpcContext(msgs, time);
  setMinistryContext(msgs, time);
  expireMonsterBaits(state, time);

  // Keep every AI actor active, but use a runtime index for local broadphase queries.
  const entityIndex = ensureEntityIndex(entities);
  setEntityMap(entityIndex.byId);

  const isMinistry = currentFloor === FloorLevel.MINISTRY;
  const player = entityIndex.byId.get(playerId);
  aiFrame = (aiFrame + 1) & 0x3fffffff;
  if (player?.alive) {
    entityIndex.queryRadius(player.x, player.y, NEAR_AI_RADIUS, nearAiQuery, ENTITY_MASK_ACTOR);
    for (const nearby of nearAiQuery) {
      if (nearby.ai) nearby.ai.nearFrame = aiFrame;
    }
  }

  for (const e of entityIndex.ai) {
    if (!e.alive || !e.ai) continue;
    const aiDt = consumeAiDt(e, player, dt, aiFrame);
    if (aiDt <= 0) continue;
    if (e.type === EntityType.NPC) {
      if (!tryFactionCombat(world, entities, e, aiDt, time, msgs, nextId, state)) {
        if (!tryFleeFromMonster(world, entities, e, aiDt)) {
          if (isMinistry) {
            updateMinistryNPC(world, entities, e, aiDt, time, clock, samosborActive);
          } else {
            updateNPC(world, entities, e, aiDt, time, clock, samosborActive);
          }
        }
      }
    }
    if (e.type === EntityType.MONSTER) updateMonster(world, entities, e, aiDt, time, msgs, playerId, nextId, state);
  }
}

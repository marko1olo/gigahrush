/* ── AI system — orchestrator ─────────────────────────────────── */

export { forceHide, getNpcStateText } from './npc_fsm';
export { tryMonsterProjectileStagger } from './monster';

import {
  type Entity, type GameState, type Msg, type GameClock,
  EntityType, Faction, FloorLevel, MonsterKind, AIGoal,
} from '../../core/types';
import { World } from '../../core/world';
import { AI_LOD_SCHEDULER_PROFILE } from '../../data/population_profiles';
import { setPathContext } from './pathfinding';
import { setEntityMap, updateMonster } from './monster';
import { setCombatContext, tryFactionCombat, tryFleeFromMonster } from './combat';
import { primeNpcAlifeState, setNpcContext, updateNPC } from './npc_fsm';
import { primeMinistryAlifeState, setMinistryContext, updateMinistryNPC } from './ministry_ai';
import { expireMonsterBaits } from '../monster_bait';
import { ensureEntityIndex } from '../entity_index';
import { isActorNoiseHot } from '../noise';

type AiLodTier = 'hot' | 'warm' | 'cold';

export interface AiSchedulerStats {
  frame: number;
  liveAi: number;
  hot: number;
  warm: number;
  cold: number;
  skipped: number;
  updatedHot: number;
  updatedWarm: number;
  updatedCold: number;
  near: number;
  warmBubble: number;
  important: number;
  plot: number;
  bosses: number;
  activeAttackers: number;
  projectileOwners: number;
  recentlyDamaged: number;
  projectiles: number;
}

const HOT_AI_RADIUS_SQ = AI_LOD_SCHEDULER_PROFILE.hotRadius * AI_LOD_SCHEDULER_PROFILE.hotRadius;
const WARM_AI_RADIUS_SQ = AI_LOD_SCHEDULER_PROFILE.warmRadius * AI_LOD_SCHEDULER_PROFILE.warmRadius;
const ACTIVE_ATTACKER_HOT_RANGE_SQ = AI_LOD_SCHEDULER_PROFILE.activeAttackerHotRange * AI_LOD_SCHEDULER_PROFILE.activeAttackerHotRange;
const MAX_STAGGERED_AI_DT = AI_LOD_SCHEDULER_PROFILE.maxAccumulatedDt;
const RECENT_DAMAGE_HOT_SEC = AI_LOD_SCHEDULER_PROFILE.recentDamageHotSec;
const HOT_PROMOTION_CAPS = AI_LOD_SCHEDULER_PROFILE.hotPromotionCaps;

const damageMemory = new WeakMap<Entity, { hp: number; hotUntil: number }>();
const projectileOwnerIds = new Set<number>();
let activeAttackerHotPromotions = 0;
let projectileOwnerHotPromotions = 0;
let recentlyDamagedHotPromotions = 0;
let aiStats: AiSchedulerStats = {
  frame: 0,
  liveAi: 0,
  hot: 0,
  warm: 0,
  cold: 0,
  skipped: 0,
  updatedHot: 0,
  updatedWarm: 0,
  updatedCold: 0,
  near: 0,
  warmBubble: 0,
  important: 0,
  plot: 0,
  bosses: 0,
  activeAttackers: 0,
  projectileOwners: 0,
  recentlyDamaged: 0,
  projectiles: 0,
};
let aiFrame = 0;

function resetAiStats(frame: number, liveAi: number, projectiles: number): void {
  activeAttackerHotPromotions = 0;
  projectileOwnerHotPromotions = 0;
  recentlyDamagedHotPromotions = 0;
  aiStats = {
    frame,
    liveAi,
    hot: 0,
    warm: 0,
    cold: 0,
    skipped: 0,
    updatedHot: 0,
    updatedWarm: 0,
    updatedCold: 0,
    near: 0,
    warmBubble: 0,
    important: 0,
    plot: 0,
    bosses: 0,
    activeAttackers: 0,
    projectileOwners: 0,
    recentlyDamaged: 0,
    projectiles,
  };
}

export function getAiSchedulerStats(): AiSchedulerStats {
  return { ...aiStats };
}

function hashUnit(id: number, salt: number): number {
  const h = Math.imul(id ^ salt, 0x85ebca6b) >>> 0;
  return (h & 1023) / 1023;
}

function interval(base: number, spread: number, e: Entity, salt: number): number {
  return base + hashUnit(e.id, salt) * spread;
}

function routineInterval(e: Entity, tier: Exclude<AiLodTier, 'hot'>): number {
  const def = AI_LOD_SCHEDULER_PROFILE.intervals[tier];
  if (e.type === EntityType.MONSTER) {
    return interval(def.monster.base, def.monster.spread, e, tier === 'warm' ? 0x1111 : 0x2111);
  }
  if (e.isTraveler) return interval(def.traveler.base, def.traveler.spread, e, tier === 'warm' ? 0x1221 : 0x2221);
  const npc = e.faction !== undefined && e.faction !== Faction.CITIZEN
    ? { base: def.npc.base * 0.82, spread: def.npc.spread * 0.82 }
    : def.npc;
  return interval(npc.base, npc.spread, e, tier === 'warm' ? 0x1331 : 0x2331);
}

function combatInterval(e: Entity, tier: Exclude<AiLodTier, 'hot'>, targetsPlayer: boolean): number {
  const def = AI_LOD_SCHEDULER_PROFILE.intervals[tier].combat;
  const base = targetsPlayer ? def.base * 0.65 : def.base;
  const spread = targetsPlayer ? def.spread * 0.65 : def.spread;
  return interval(base, spread, e, tier === 'warm' ? 0x1441 : 0x2441);
}

function isBossActor(e: Entity): boolean {
  if (e.isFogBoss) return true;
  switch (e.monsterKind) {
    case MonsterKind.BETONNIK:
    case MonsterKind.MATKA:
    case MonsterKind.MANCOBUS:
    case MonsterKind.CREATOR:
      return true;
    default:
      return false;
  }
}

function isRecentlyDamaged(e: Entity, time: number): boolean {
  if (e.hp === undefined) return false;
  const rec = damageMemory.get(e);
  if (!rec) {
    damageMemory.set(e, { hp: e.hp, hotUntil: -Infinity });
    return false;
  }
  if (e.hp < rec.hp - 0.001) rec.hotUntil = time + RECENT_DAMAGE_HOT_SEC;
  rec.hp = e.hp;
  return rec.hotUntil > time;
}

function isActiveAttacker(world: World, e: Entity, player: Entity | undefined, entityById: Map<number, Entity>): boolean {
  const ai = e.ai;
  if (!ai || ai.combatTargetId === undefined) return false;
  const target = entityById.get(ai.combatTargetId);
  if (!target?.alive) return false;
  if (player?.alive && target.id === player.id) return true;
  if ((ai.windupTimer ?? 0) > 0) return true;
  if ((e.attackCd ?? 0) <= 0) return false;
  return world.dist2(e.x, e.y, target.x, target.y) <= ACTIVE_ATTACKER_HOT_RANGE_SQ;
}

function fillProjectileOwners(entities: readonly Entity[]): void {
  projectileOwnerIds.clear();
  for (const e of entities) {
    if (!e.alive || e.ownerId === undefined || e.type !== EntityType.PROJECTILE) continue;
    projectileOwnerIds.add(e.ownerId);
  }
}

function classifyAiTier(
  world: World,
  e: Entity,
  player: Entity | undefined,
  frame: number,
  time: number,
  entityById: Map<number, Entity>,
  state: GameState | undefined,
): { tier: AiLodTier; important: boolean; targetsPlayer: boolean } {
  const ai = e.ai!;
  const plot = e.plotNpcId !== undefined;
  const boss = isBossActor(e);
  const targetsPlayer = player?.alive === true && ai.combatTargetId === player.id;
  const activeAttacker = isActiveAttacker(world, e, player, entityById);
  const projectileOwner = projectileOwnerIds.has(e.id);
  const recentlyDamaged = isRecentlyDamaged(e, time);
  const locked = (ai.windupTimer ?? 0) > 0 || (ai.staggerTimer ?? 0) > 0;
  const noiseHot = isActorNoiseHot(world, state, e, time);

  if (plot) aiStats.plot++;
  if (boss) aiStats.bosses++;
  if (activeAttacker) aiStats.activeAttackers++;
  if (projectileOwner) aiStats.projectileOwners++;
  if (recentlyDamaged) aiStats.recentlyDamaged++;

  const activeAttackerHot = activeAttacker && (
    targetsPlayer ||
    activeAttackerHotPromotions++ < HOT_PROMOTION_CAPS.activeAttackers
  );
  const projectileOwnerHot = projectileOwner && (
    targetsPlayer ||
    projectileOwnerHotPromotions++ < HOT_PROMOTION_CAPS.projectileOwners
  );
  const recentlyDamagedHot = recentlyDamaged && (
    targetsPlayer ||
    recentlyDamagedHotPromotions++ < HOT_PROMOTION_CAPS.recentlyDamaged
  );
  const important = plot || boss || activeAttackerHot || projectileOwnerHot || recentlyDamagedHot || locked || noiseHot;
  if (important) aiStats.important++;

  if (important) {
    ai.nearFrame = frame;
    return { tier: 'hot', important, targetsPlayer };
  }

  if (!player?.alive) return { tier: 'cold', important, targetsPlayer };

  const d2 = world.dist2(player.x, player.y, e.x, e.y);
  if (d2 <= HOT_AI_RADIUS_SQ) {
    ai.nearFrame = frame;
    aiStats.near++;
    return { tier: 'hot', important, targetsPlayer };
  }
  if (d2 <= WARM_AI_RADIUS_SQ) {
    aiStats.warmBubble++;
    return { tier: 'warm', important, targetsPlayer };
  }
  return { tier: 'cold', important, targetsPlayer };
}

function consumeAiDt(e: Entity, tier: AiLodTier, targetsPlayer: boolean, dt: number, frame: number): number {
  const ai = e.ai;
  if (!ai) return 0;
  if (tier === 'hot' || ai.nearFrame === frame) {
    ai.thinkAccum = 0;
    return dt;
  }

  const interval = ai.combatTargetId !== undefined
    ? combatInterval(e, tier, targetsPlayer)
    : routineInterval(e, tier);
  ai.thinkInterval = interval;
  ai.thinkAccum = (ai.thinkAccum ?? hashUnit(e.id, 0x3553) * interval) + dt;
  if (ai.thinkAccum < interval) return 0;
  const elapsed = Math.min(MAX_STAGGERED_AI_DT, ai.thinkAccum);
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

  // Main rebuilds the runtime broadphase once before simulation; AI only consumes it.
  const entityIndex = ensureEntityIndex(entities);
  setEntityMap(entityIndex.byId);
  fillProjectileOwners(entityIndex.projectiles);

  const isMinistry = currentFloor === FloorLevel.MINISTRY;
  const player = entityIndex.byId.get(playerId);
  aiFrame = (aiFrame + 1) & 0x3fffffff;
  resetAiStats(aiFrame, entityIndex.ai.length, entityIndex.projectiles.length);

  for (const e of entityIndex.ai) {
    if (!e.alive || !e.ai) continue;
    if (e.type === EntityType.NPC) {
      if (isMinistry) primeMinistryAlifeState(e, clock, samosborActive);
      else primeNpcAlifeState(e, clock, samosborActive);
    } else if (e.type === EntityType.MONSTER && e.ai.goal === AIGoal.IDLE && e.ai.combatTargetId === undefined && e.speed > 0) {
      e.ai.goal = AIGoal.WANDER;
    }
    const decision = classifyAiTier(world, e, player, aiFrame, time, entityIndex.byId, state);
    aiStats[decision.tier]++;
    const aiDt = consumeAiDt(e, decision.tier, decision.targetsPlayer, dt, aiFrame);
    if (aiDt <= 0) {
      aiStats.skipped++;
      continue;
    }
    if (decision.tier === 'hot') aiStats.updatedHot++;
    else if (decision.tier === 'warm') aiStats.updatedWarm++;
    else aiStats.updatedCold++;
    if (e.type === EntityType.NPC) {
      if (!tryFactionCombat(world, entities, e, aiDt, time, msgs, nextId, state, player)) {
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

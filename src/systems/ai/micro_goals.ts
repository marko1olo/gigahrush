/* ── Universal AI Micro-Goal System ───────────────────────────── */

import { AIGoal, Entity, EntityType, Msg } from '../../core/types';
import { World } from '../../core/world';
import { emitMarkovBark } from './barks';
import { steerEntityTowardCell, clearEntitySteeringPath } from './pathfinding';
import { aiPathMoveSpeed } from '../rpg';
import { canActorOccupy, actorOccupyRadius } from '../movement_collision';
import { findNoiseInvestigationTarget } from '../noise';
import { pickupDrop } from '../inventory';

export interface MicroGoalOpts {
  targetX?: number;
  targetY?: number;
  timer: number;
  sourceId?: number;
}

const MICRO_GOAL_PRIORITIES: Record<string, number> = {
  'pack_pulse': 50,
  'search_lkp': 40,
  'investigate_noise': 30,
  'greet': 20,
  'reposition': 10,
  'loot_nearby': 5,
};

export function hasMicroGoal(e: Entity): boolean {
  return e.ai?.microGoalId !== undefined;
}

export function clearMicroGoal(e: Entity): void {
  const ai = e.ai;
  if (!ai) return;
  ai.microGoalId = undefined;
  ai.microTargetX = undefined;
  ai.microTargetY = undefined;
  ai.microTimer = undefined;
  ai.microSourceId = undefined;
  clearEntitySteeringPath(e);
}

export function trySetMicroGoal(e: Entity, id: string, opts: MicroGoalOpts): boolean {
  const ai = e.ai;
  if (!ai) return false;
  
  // Combat supersedes all micro-goals
  if (ai.combatTargetId !== undefined && ai.combatTargetId !== e.id) return false;
  if (ai.goal === AIGoal.FLEE || ai.goal === AIGoal.HIDE) return false;
  
  // Check priority if a micro-goal is already active
  if (ai.microGoalId) {
    const currentPri = MICRO_GOAL_PRIORITIES[ai.microGoalId] ?? 0;
    const newPri = MICRO_GOAL_PRIORITIES[id] ?? 0;
    if (newPri <= currentPri) return false;
  }
  
  ai.microGoalId = id;
  ai.microTargetX = opts.targetX;
  ai.microTargetY = opts.targetY;
  ai.microTimer = opts.timer;
  ai.microSourceId = opts.sourceId;
  clearEntitySteeringPath(e);
  return true;
}

export function tickMicroGoal(world: World, entities: Entity[], e: Entity, dt: number, _time: number, _msgs: Msg[]): boolean {
  const ai = e.ai;
  if (!ai) return false;
  
  if (ai.microCooldowns) {
    for (const key in ai.microCooldowns) {
      ai.microCooldowns[key] -= dt;
      if (ai.microCooldowns[key] <= 0) delete ai.microCooldowns[key];
    }
  }

  if (!ai.microGoalId || ai.microTimer === undefined) return false;
  
  ai.microTimer -= dt;
  if (ai.microTimer <= 0) {
    clearMicroGoal(e);
    return false;
  }
  
  // Execution logic based on the specific micro-goal
  switch (ai.microGoalId) {
    case 'greet': {
      // Just stop and face the target entity
      if (ai.microSourceId !== undefined) {
        const source = entities.find(x => x.id === ai.microSourceId);
        if (source) {
          const dx = world.delta(e.x, source.x);
          const dy = world.delta(e.y, source.y);
          e.angle = Math.atan2(dy, dx);
        }
      }
      return true; // consumed tick, no movement
    }
    
    case 'investigate_noise':
    case 'search_lkp':
    case 'reposition':
    case 'loot_nearby':
    case 'pack_pulse': {
      if (ai.microTargetX !== undefined && ai.microTargetY !== undefined) {
        const steer = steerEntityTowardCell(world, e, ai.microTargetX, ai.microTargetY);
        if (steer) {
          const speed = aiPathMoveSpeed(e) * dt;
          const r = actorOccupyRadius(e);
          const nx = e.x + steer.x * speed;
          const ny = e.y + steer.y * speed;
          if (canActorOccupy(world, nx, e.y, r)) e.x = world.wrap(nx);
          if (canActorOccupy(world, e.x, ny, r)) e.y = world.wrap(ny);
          e.angle = Math.atan2(steer.y, steer.x);
        } else {
          if (ai.microGoalId === 'loot_nearby' && ai.microSourceId !== undefined) {
            const item = entities.find(x => x.id === ai.microSourceId);
            if (item && item.type === EntityType.ITEM_DROP && item.alive) {
              pickupDrop(world, item, e, _msgs, _time, undefined);
            }
          }
          // Reached target early, clear goal
          clearMicroGoal(e);
          return false;
        }
      }
      return true;
    }
  }
  
  return true;
}

export function evaluateMicroStimuli(world: World, entities: Entity[], e: Entity, time: number, msgs: Msg[]): void {
  const ai = e.ai;
  if (!ai || hasMicroGoal(e) || ai.combatTargetId !== undefined || ai.goal === AIGoal.FLEE || ai.goal === AIGoal.HIDE) {
    return;
  }
  
  // 1. Investigate Noise
  const noise = findNoiseInvestigationTarget(world, undefined, e, time);
  if (noise && (ai.microCooldowns?.['investigate_noise'] ?? 0) <= 0) {
    if (trySetMicroGoal(e, 'investigate_noise', { targetX: noise.x, targetY: noise.y, timer: 12 })) {
      ai.microCooldowns = ai.microCooldowns || {};
      ai.microCooldowns['investigate_noise'] = 30; // 30 sec cooldown
      emitMarkovBark(e, msgs, time, 'alert', 'Что там?', 1.0, '#aac');
      return;
    }
  }

  // Bounded scan for greet and loot
  if (e.type === EntityType.NPC) {
    for (let i = 0; i < entities.length; i++) {
      const near = entities[i];
      if (!near.alive) continue;
      
      const dist2 = world.dist2(e.x, e.y, near.x, near.y);
      if (dist2 > 16) continue; // 4 cells squared max
      
      // 2. Greet
      if (near.id !== e.id && near.type === EntityType.NPC && dist2 < 9) { // 3 cells squared
        if ((ai.microCooldowns?.['greet'] ?? 0) <= 0) {
          if (trySetMicroGoal(e, 'greet', { timer: 2, sourceId: near.id })) {
            ai.microCooldowns = ai.microCooldowns || {};
            ai.microCooldowns['greet'] = 120; // 2 minutes before greeting anyone again
            emitMarkovBark(e, msgs, time, 'ambient', 'Привет.', 1.0, '#aac');
            return;
          }
        }
      }
      
      // 3. Loot nearby (within 3 cells)
      if (near.type === EntityType.ITEM_DROP && dist2 < 9) {
        if ((ai.microCooldowns?.['loot_nearby'] ?? 0) <= 0) {
          if (trySetMicroGoal(e, 'loot_nearby', { targetX: near.x, targetY: near.y, timer: 5, sourceId: near.id })) {
            ai.microCooldowns = ai.microCooldowns || {};
            ai.microCooldowns['loot_nearby'] = 45; // 45 seconds cooldown for generic loot scan
            return;
          }
        }
      }
    }
  }
}

/* ── PSI spell system: сгустки (psychic runes) ───────────────── */

import {
  W, type Entity, type Msg, EntityType,
  msg,
} from '../core/types';
import { World } from '../core/world';
import { randSeed } from '../core/rand';
import { stampMark, MarkType } from '../render/marks';
import { WEAPON_STATS } from '../data/catalog';
import { spawnBloodHit, spawnDeathPool } from '../render/blood';
import { entityDisplayName } from '../entities/monster';

// ── Module state (player-only transient effects) ─────────────────
let phaseTimer = 0;                              // phase shift remaining seconds
let markPos: { x: number; y: number } | null = null;  // saved teleport mark
let debugNoClip = false;                        // debug override for phase movement

// ── Queries ──────────────────────────────────────────────────────
export function isPhaseActive(): boolean { return phaseTimer > 0; }
export function isNoClipActive(): boolean { return debugNoClip || phaseTimer > 0; }
export function isDebugNoClipEnabled(): boolean { return debugNoClip; }
export function getPhaseTimer(): number { return phaseTimer; }
export function getPsiMark(): { x: number; y: number } | null { return markPos; }
export function toggleDebugNoClip(): boolean {
  debugNoClip = !debugNoClip;
  return debugNoClip;
}

// ── Reset (on new game / floor switch) ───────────────────────────
export function resetPsiState(): void {
  phaseTimer = 0;
  markPos = null;
}

// ── Cast an instant (non-projectile) PSI spell ───────────────────
export function castInstantSpell(
  effect: string,
  player: Entity,
  entities: Entity[],
  world: World,
  msgs: Msg[],
  time: number,
  handleKill: (e: Entity) => void,
): { beamLen?: number } {
  switch (effect) {
    case 'storm':    castStorm(player, entities, world, msgs, time, handleKill); break;
    case 'brain_burn': castBrainBurn(player, entities, world, msgs, time, handleKill); break;
    case 'madness':  castTargeted(player, entities, world, msgs, time, 'madness'); break;
    case 'control':  castTargeted(player, entities, world, msgs, time, 'control'); break;
    case 'phase':    castPhase(player, msgs, time); break;
    case 'mark':     castMark(player, msgs, time); break;
    case 'recall':   castRecall(player, msgs, time); break;
    case 'beam':     return { beamLen: castBeam(player, entities, world, msgs, time, handleKill) };
  }
  return {};
}

// ── Update ongoing PSI effects (call every frame) ────────────────
export function updatePsiEffects(entities: Entity[], dt: number): void {
  // Phase shift timer
  if (phaseTimer > 0) {
    phaseTimer = Math.max(0, phaseTimer - dt);
  }

  // Decay madness on all entities (control timers tracked separately below)
  for (const e of entities) {
    if (!e.alive) continue;
    if (e.psiMadness !== undefined && e.psiMadness > 0) {
      e.psiMadness -= dt;
      if (e.psiMadness <= 0) {
        e.psiMadness = undefined;
        // Reset combat target so AI re-evaluates
        if (e.ai) e.ai.combatTargetId = undefined;
      }
    }
  }

  // Control timers
  for (const [eid, remaining] of controlTimers) {
    const left = remaining - dt;
    if (left <= 0) {
      controlTimers.delete(eid);
      const e = entities.find(en => en.id === eid);
      if (e) {
        e.psiControlledBy = undefined;
        if (e.ai) e.ai.combatTargetId = undefined;
      }
    } else {
      controlTimers.set(eid, left);
    }
  }
}

// ── Control timer tracking ───────────────────────────────────────
const controlTimers = new Map<number, number>();  // entityId → remaining seconds

// ── Find target in player's line of sight ────────────────────────
function findLookTarget(
  player: Entity, entities: Entity[], world: World, maxRange: number,
): Entity | null {
  let best: Entity | null = null;
  let bestDist2 = maxRange * maxRange;

  for (const e of entities) {
    if (!e.alive || e.id === player.id) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER) continue;
    const dx = world.delta(player.x, e.x);
    const dy = world.delta(player.y, e.y);
    const dist2 = dx * dx + dy * dy;
    if (dist2 > maxRange * maxRange || dist2 < 0.25) continue;
    // Check angle — must be within ~15 degrees of look direction
    const angToTarget = Math.atan2(dy, dx);
    let dAngle = angToTarget - player.angle;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    if (Math.abs(dAngle) > 0.26) continue; // ~15 degrees
    if (dist2 < bestDist2) {
      bestDist2 = dist2;
      best = e;
    }
  }
  return best;
}

// ── Пси буря: damage all visible entities in area ────────────────
const STORM_RANGE = 12;
const STORM_MAX_TARGETS = 8;

function castStorm(
  player: Entity, entities: Entity[], world: World,
  msgs: Msg[], time: number,
  handleKill: (e: Entity) => void,
): void {
  const ws = WEAPON_STATS['psi_storm'];
  const dmg = ws?.dmg ?? 10;
  let hits = 0;
  const range2 = STORM_RANGE * STORM_RANGE;

  for (const e of entities) {
    if (!e.alive || e.id === player.id) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER) continue;
    const dx = world.delta(player.x, e.x);
    const dy = world.delta(player.y, e.y);
    if (dx * dx + dy * dy > range2) continue;
    // Check FOV cone (~60 degrees half-angle)
    const angToTarget = Math.atan2(dy, dx);
    let dAngle = angToTarget - player.angle;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    if (Math.abs(dAngle) > 1.05) continue; // ~60 degrees
    if (e.hp !== undefined) {
      e.hp -= dmg;
      spawnBloodHit(world, e.x, e.y, player.angle, dmg, e.type === EntityType.MONSTER);
      if (e.hp <= 0) {
        e.alive = false;
        handleKill(e);
      }
      hits++;
      if (hits >= STORM_MAX_TARGETS) break;
    }
  }
  if (hits > 0) {
    msgs.push(msg(`Пси буря! Поражено целей: ${hits}`, time, '#c4f'));
  } else {
    msgs.push(msg('Пси буря — целей нет', time, '#a4f'));
  }
}

// ── Выжиг мозга: instant kill target at or below player level ────
function castBrainBurn(
  player: Entity, entities: Entity[], world: World,
  msgs: Msg[], time: number,
  handleKill: (e: Entity) => void,
): void {
  const target = findLookTarget(player, entities, world, 12);
  if (!target) {
    msgs.push(msg('Выжиг мозга — цель не найдена', time, '#a4f'));
    return;
  }
  const playerLevel = player.rpg?.level ?? 1;
  const targetLevel = target.rpg?.level ?? 1;
  if (targetLevel > playerLevel) {
    msgs.push(msg(`${entityDisplayName(target)} слишком сильна для выжига!`, time, '#f84'));
    return;
  }
  // Instant kill
  if (target.hp !== undefined) {
    target.hp = 0;
    target.alive = false;
    spawnDeathPool(world, target.x, target.y, target.type === EntityType.MONSTER);
    handleKill(target);
    msgs.push(msg(`Выжиг мозга! ${entityDisplayName(target)} уничтожена`, time, '#f4f'));
  }
}

// ── Безумие / Контроль: targeted PSI effects ─────────────────────
const PSI_EFFECT_DURATION = 15; // 15 seconds = 15 game minutes

function castTargeted(
  player: Entity, entities: Entity[], world: World,
  msgs: Msg[], time: number,
  mode: 'madness' | 'control',
): void {
  const target = findLookTarget(player, entities, world, 12);
  if (!target) {
    msgs.push(msg(`${mode === 'madness' ? 'Безумие' : 'Контроль'} — цель не найдена`, time, '#a4f'));
    return;
  }

  if (mode === 'madness') {
    target.psiMadness = PSI_EFFECT_DURATION;
    if (target.ai) target.ai.combatTargetId = undefined;
    msgs.push(msg(`Безумие! ${entityDisplayName(target)} сходит с ума`, time, '#f4f'));
  } else {
    target.psiControlledBy = player.id;
    controlTimers.set(target.id, PSI_EFFECT_DURATION);
    if (target.ai) target.ai.combatTargetId = undefined;
    msgs.push(msg(`Контроль! ${entityDisplayName(target)} подчинена`, time, '#4ff'));
  }
}

// ── Фазовый сдвиг: walk through walls ───────────────────────────
function castPhase(_player: Entity, msgs: Msg[], time: number): void {
  phaseTimer = PSI_EFFECT_DURATION;
  msgs.push(msg('Фазовый сдвиг! Вы проходите сквозь материю', time, '#4af'));
}

// ── Метка: save current position ─────────────────────────────────
function castMark(player: Entity, msgs: Msg[], time: number): void {
  markPos = { x: player.x, y: player.y };
  msgs.push(msg('Метка установлена', time, '#4af'));
}

// ── Возврат: teleport to saved mark ──────────────────────────────
function castRecall(player: Entity, msgs: Msg[], time: number): void {
  if (!markPos) {
    msgs.push(msg('Метка не установлена!', time, '#f84'));
    return;
  }
  player.x = markPos.x;
  player.y = markPos.y;
  msgs.push(msg('Телепорт к метке!', time, '#4af'));
}

// ── Пси Хамехамеха: wide beam that burns everything on path ─────
const BEAM_RANGE = 20;
const BEAM_WIDTH = 1.2; // half-width of the beam corridor
const BEAM_MAX_TARGETS = 10;

function castBeam(
  player: Entity, entities: Entity[], world: World,
  msgs: Msg[], time: number,
  handleKill: (e: Entity) => void,
): number {
  const ws = WEAPON_STATS['psi_beam'];
  const dmg = ws?.dmg ?? 15;
  const dirX = Math.cos(player.angle);
  const dirY = Math.sin(player.angle);

  // DDA ray to find beam end (wall hit or max range)
  let beamEnd = BEAM_RANGE;
  {
    let mapX = Math.floor(player.x);
    let mapY = Math.floor(player.y);
    const ddx = Math.abs(1 / dirX);
    const ddy = Math.abs(1 / dirY);
    const stepX = dirX < 0 ? -1 : 1;
    const stepY = dirY < 0 ? -1 : 1;
    let sdx = dirX < 0 ? (player.x - mapX) * ddx : (mapX + 1 - player.x) * ddx;
    let sdy = dirY < 0 ? (player.y - mapY) * ddy : (mapY + 1 - player.y) * ddy;

    for (let step = 0; step < BEAM_RANGE * 2; step++) {
      const dist = Math.min(sdx, sdy);
      if (dist >= BEAM_RANGE) break;
      if (sdx < sdy) { sdx += ddx; mapX += stepX; } else { sdy += ddy; mapY += stepY; }
      const wx = ((mapX % W) + W) % W;
      const wy = ((mapY % W) + W) % W;
      if (world.solid(wx, wy)) {
        beamEnd = dist;
        break;
      }
    }
  }

  // Paint scorch along beam path on floor
  const scorchStep = 0.35;
  for (let d = 0.5; d < beamEnd; d += scorchStep) {
    const sx = player.x + dirX * d;
    const sy = player.y + dirY * d;
    const fx = ((Math.floor(sx) % W) + W) % W;
    const fy = ((Math.floor(sy) % W) + W) % W;
    if (!world.solid(fx, fy)) {
      stampMark(world, fx, fy, sx - Math.floor(sx), sy - Math.floor(sy),
        0.45, MarkType.PSI, randSeed(), 80, 20, 120, 200); // bright purple scorch
    }
  }

  // Damage all entities within the beam corridor
  let hits = 0;
  for (const e of entities) {
    if (!e.alive || e.id === player.id) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER) continue;
    // Project entity position onto beam line
    const dx = world.delta(player.x, e.x);
    const dy = world.delta(player.y, e.y);
    const along = dx * dirX + dy * dirY; // projection along beam
    if (along < 0.5 || along > beamEnd) continue;
    const perp = Math.abs(dx * (-dirY) + dy * dirX); // perpendicular distance
    if (perp > BEAM_WIDTH) continue;
    if (e.hp !== undefined) {
      const falloff = 1 - (along / beamEnd) * 0.3;
      const finalDmg = Math.round(dmg * falloff);
      e.hp -= finalDmg;
      spawnBloodHit(world, e.x, e.y, player.angle, finalDmg, e.type === EntityType.MONSTER);
      if (e.hp <= 0) {
        e.alive = false;
        handleKill(e);
      }
      hits++;
      if (hits >= BEAM_MAX_TARGETS) break;
    }
  }
  if (hits > 0) {
    msgs.push(msg(`ПСИ ХАМЕХАМЕХА! Поражено: ${hits}`, time, '#f0f'));
  } else {
    msgs.push(msg('ПСИ ХАМЕХАМЕХА!', time, '#c0f'));
  }
  return beamEnd;
}

// ── AoE explosion (called from updateProjectiles on impact) ──────
export function psiAoeExplosion(
  proj: Entity, entities: Entity[], world: World,
  msgs: Msg[], time: number,
  handleKill: (e: Entity) => void,
): void {
  const radius = proj.aoeRadius ?? 0;
  const dmg = proj.aoeDmg ?? proj.projDmg ?? 10;
  if (radius <= 0) return;

  let hits = 0;
  const radius2 = radius * radius;
  const maxHits = 10;
  for (const e of entities) {
    if (!e.alive || e.id === proj.ownerId) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER) continue;

    const dx = world.delta(proj.x, e.x);
    const dy = world.delta(proj.y, e.y);
    const dist2 = dx * dx + dy * dy;
    if (dist2 > radius2) continue;
    if (e.hp !== undefined) {
      // Damage falls off with distance
      const dist = Math.sqrt(dist2);
      const falloff = 1 - (dist / radius) * 0.5;
      const finalDmg = Math.round(dmg * falloff);
      e.hp -= finalDmg;
      spawnBloodHit(world, e.x, e.y, Math.atan2(dy, dx), finalDmg, e.type === EntityType.MONSTER);
      if (e.hp <= 0) {
        e.alive = false;
        handleKill(e);
      }
      hits++;
      if (hits >= maxHits) break;
    }
  }
  if (hits > 0) {
    msgs.push(msg(`Разрыв связности! Поражено: ${hits}`, time, '#c4f'));
  }
}

// ── Check if entity is PSI-controlled ally of another ────────────
export function isPsiAlly(a: Entity, b: Entity): boolean {
  // b is controlled by a's controller or by a itself
  if (b.psiControlledBy !== undefined && b.psiControlledBy === a.id) return true;
  if (a.psiControlledBy !== undefined && a.psiControlledBy === b.id) return true;
  // Both controlled by same entity
  if (a.psiControlledBy !== undefined && b.psiControlledBy !== undefined &&
      a.psiControlledBy === b.psiControlledBy) return true;
  return false;
}

// ── Check if entity is mad (attacks everyone) ────────────────────
export function isPsiMad(e: Entity): boolean {
  return (e.psiMadness ?? 0) > 0;
}

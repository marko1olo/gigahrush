/* ── NPC combat: faction fights + fleeing ─────────────────────── */

import {
  type Entity, type GameState, type Msg,
  EntityType, AIGoal, Occupation, Faction, ProjType,
} from '../../core/types';
import { World } from '../../core/world';
import { WEAPON_STATS, type WeaponStats } from '../../data/catalog';
import {
  playAttack, playHostileEnergyShot, playHostileFlame, playHostileGunshot, playHostileNailgun,
  playHostilePsiCast, playHostileShotgun, playSoundAt,
} from '../audio';
import { applyDamageRelationPenalty, isHostile } from '../factions';
import { clearFogInZone } from '../samosbor';
import { agiAttackSpeedMult, meleeDamage } from '../rpg';
import { zhelemishIncomingMeleeDamage } from '../status';
import { spawnBloodHit, spawnDeathPool } from '../../render/blood';
import { consumeAmmo, consumeDurability } from '../inventory';
import { isDebugOnePunchManEnabled, keepDebugOnePunchManAlive } from '../debug_cheats';
import { entityDisplayName } from '../../entities/monster';
import { bfsPath, followPath, tryAssignPathToCell } from './pathfinding';
import { Spr, hostileProjectileSprite } from '../../render/sprite_index';
import { findCombatTarget, dropNpcInventory, deterministicScanCd, hasClearLineOfFire } from './monster';
import { recordEntityKill } from '../alife_rating';
import { recordPlayerDamage } from '../damage';
import { ENTITY_MASK_MONSTER, getEntityIndex } from '../entity_index';
import { applyMonsterIncomingDamage } from '../monster_traits';
import { publishWeaponNoise } from '../noise';
import {
  bark,
  BARK_COMBAT_START, BARK_COMBAT_START_F, BARK_CHANCE_COMBAT,
  BARK_WOUNDED, BARK_WOUNDED_F, BARK_CHANCE_WOUNDED,
  BARK_KILL, BARK_KILL_F, BARK_CHANCE_KILL,
  BARK_FLEE, BARK_FLEE_F, BARK_CHANCE_FLEE,
  pushNpcLogMessage,
} from './barks';

/* ── Module-level bark refs (set each frame) ─────────────────── */
let _barkMsgs: Msg[] = [];
let _barkTime = 0;
export function setCombatContext(msgs: Msg[], time: number): void {
  _barkMsgs = msgs;
  _barkTime = time;
}

/* ── NPC flee from monsters (non-combatants) ─────────────────── */
const NPC_FLEE_DETECT_SQ = 10 * 10;
const NPC_FLEE_DIST = 20;
const NPC_FLEE_SCAN_CD = 1.5;
const fleeMonsterQuery: Entity[] = [];

export function tryFleeFromMonster(
  world: World, _entities: Entity[], e: Entity, dt: number,
): boolean {
  const isCombatant = npcIsBrave(e);
  if (isCombatant) return false;

  const ws = WEAPON_STATS[e.weapon ?? ''];
  if (ws && (ws.dmg > 3 || ws.isRanged)) return false;

  const ai = e.ai!;

  if (ai.goal === AIGoal.FLEE && ai.timer > 0) {
    return continueFlee(world, e, dt);
  }

  ai.combatScanCd = (ai.combatScanCd ?? 0) - dt;
  if (ai.combatScanCd! > 0 && ai.goal !== AIGoal.FLEE) return false;
  ai.combatScanCd = NPC_FLEE_SCAN_CD;

  let nearestMonster: Entity | null = null;
  let nearestD2 = NPC_FLEE_DETECT_SQ;
  getEntityIndex().queryRadius(e.x, e.y, 10, fleeMonsterQuery, ENTITY_MASK_MONSTER);
  for (const other of fleeMonsterQuery) {
    if (!other.alive || other.type !== EntityType.MONSTER) continue;
    const d2 = world.dist2(e.x, e.y, other.x, other.y);
    if (d2 < nearestD2) {
      nearestD2 = d2;
      nearestMonster = other;
    }
  }

  if (!nearestMonster) {
    if (ai.goal === AIGoal.FLEE) {
      ai.goal = AIGoal.IDLE;
      ai.path = [];
      ai.pi = 0;
      ai.timer = 1;
    }
    return false;
  }

  return startFleeFromThreat(world, e, nearestMonster, dt);
}

/* ── NPC faction combat: attack nearby hostile entities ────────── */
const NPC_COMBAT_RANGE = 8;
const NPC_CHASE_RANGE = 18;
const NPC_ATTACK_RANGE = 1.3;
const NPC_COMBAT_CD = 1.2;
const NPC_RANGED_MAX = 12;
const NPC_RANGED_MIN = 1.5;
const NPC_RANGED_LOS_BREAK_CD = 0.45;
const MELEE_KNOCKBACK_CAP = 0.65;
const MELEE_STAGGER_CAP = 0.35;
const KNOCKBACK_BODY_R = 0.16;
const NPC_FLEE_THREAT_RATIO = 0.65;

function continueFlee(world: World, e: Entity, dt: number): boolean {
  const ai = e.ai!;
  ai.timer -= dt;
  const savedSpeed = e.speed;
  e.speed *= 1.3;
  followPath(world, e, dt);
  e.speed = savedSpeed;
  return true;
}

function startFleeFromThreat(world: World, e: Entity, threat: Entity, dt: number): boolean {
  const ai = e.ai!;
  bark(e, _barkMsgs, _barkTime, BARK_FLEE, BARK_FLEE_F, BARK_CHANCE_FLEE, '#ff8');
  ai.goal = AIGoal.FLEE;
  const dx = world.delta(threat.x, e.x);
  const dy = world.delta(threat.y, e.y);
  const len = Math.sqrt(dx * dx + dy * dy);
  let nx: number, ny: number;
  if (len > 0.1) {
    nx = dx / len; ny = dy / len;
  } else {
    const a = Math.random() * Math.PI * 2;
    nx = Math.cos(a); ny = Math.sin(a);
  }
  const fleeX = world.wrap(Math.floor(e.x + nx * NPC_FLEE_DIST));
  const fleeY = world.wrap(Math.floor(e.y + ny * NPC_FLEE_DIST));
  ai.path = bfsPath(world, Math.floor(e.x), Math.floor(e.y), fleeX, fleeY);
  ai.pi = 0;
  ai.tx = fleeX;
  ai.ty = fleeY;
  ai.timer = 3;
  return continueFlee(world, e, dt);
}

function npcIsBrave(e: Entity): boolean {
  return (e.psiMadness ?? 0) > 0 ||
    e.occupation === Occupation.HUNTER ||
    e.occupation === Occupation.PILGRIM ||
    e.faction === Faction.LIQUIDATOR ||
    e.faction === Faction.CULTIST ||
    e.faction === Faction.WILD;
}

function npcThreatScore(e: Entity): number {
  const ws = WEAPON_STATS[e.weapon ?? ''] ?? WEAPON_STATS[''];
  const weapon = ws.isRanged ? ws.dmg * (ws.pellets ?? 1) * 1.6 : ws.dmg;
  const hp = Math.max(0, e.hp ?? 20) * 0.22;
  const level = Math.max(1, e.rpg?.level ?? 1) * 3;
  return hp + weapon + level;
}

function npcShouldFleeTarget(e: Entity, target: Entity): boolean {
  if (npcIsBrave(e)) return false;
  return npcThreatScore(e) < npcThreatScore(target) * NPC_FLEE_THREAT_RATIO;
}

function livePlayerTarget(entities: readonly Entity[]): Entity | undefined {
  return entities.find(other => other.alive && other.type === EntityType.PLAYER);
}

export function tryFactionCombat(
  world: World, entities: Entity[], e: Entity, dt: number, _time: number, msgs: Msg[], nextId: { v: number }, state?: GameState, player?: Entity | null,
): boolean {
  const ws = WEAPON_STATS[e.weapon ?? ''] ?? WEAPON_STATS[''];
  const isArmed = ws.dmg > 3 || ws.isRanged;

  const isCombatant = npcIsBrave(e) ||
    isArmed;
  const playerTarget = player === null
    ? undefined
    : player?.alive && player.type === EntityType.PLAYER
      ? player
      : livePlayerTarget(entities);
  const hostileToPlayer = playerTarget !== undefined && isHostile(e, playerTarget);
  const ai = e.ai!;
  if (ai.goal === AIGoal.FLEE && ai.timer > 0) return continueFlee(world, e, dt);
  if (!isCombatant && !hostileToPlayer) return false;

  const detectRange = hostileToPlayer ? NPC_CHASE_RANGE : ws.isRanged ? NPC_RANGED_MAX : NPC_COMBAT_RANGE;
  if ((ai.staggerTimer ?? 0) > 0) {
    ai.staggerTimer = Math.max(0, (ai.staggerTimer ?? 0) - dt);
    e.attackCd = Math.max(e.attackCd ?? 0, 0.12);
    return true;
  }
  const prevTarget = ai.combatTargetId;
  const target = findCombatTarget(
    world, entities, e, dt,
    detectRange * detectRange, deterministicScanCd(e.id, 0.8, 0.4),
    o => o.type === EntityType.NPC || o.type === EntityType.MONSTER || o.type === EntityType.PLAYER,
  );

  if (!target) return false;
  if (npcShouldFleeTarget(e, target)) {
    ai.combatTargetId = target.id;
    return startFleeFromThreat(world, e, target, dt);
  }
  if (ai.combatTargetId !== target.id || prevTarget === undefined) {
    bark(e, msgs, _time, BARK_COMBAT_START, BARK_COMBAT_START_F, BARK_CHANCE_COMBAT, '#fa8');
  }
  ai.combatTargetId = target.id;
  ai.goal = AIGoal.HUNT;

  const bestDist = Math.sqrt(world.dist2(e.x, e.y, target.x, target.y));
  const atkSpeedMod = e.rpg ? agiAttackSpeedMult(e.rpg) : 1;

  // Ranged NPC: telegraph line-of-fire before committing the shot.
  if (ws.isRanged && bestDist < NPC_RANGED_MAX && bestDist > NPC_RANGED_MIN) {
    const currentTarget = ai.windupTargetId === undefined || ai.windupTargetId === target.id;
    const lineClear = currentTarget && target.alive && hasClearLineOfFire(world, e, target, NPC_RANGED_MAX);

    if ((ai.windupTimer ?? 0) > 0) {
      ai.windupTimer = Math.max(0, (ai.windupTimer ?? 0) - dt);
      const dx = world.delta(e.x, target.x);
      const dy = world.delta(e.y, target.y);
      e.angle = Math.atan2(dy, dx);
      if (!lineClear) {
        ai.windupTimer = undefined;
        ai.windupTargetId = undefined;
        e.attackCd = Math.max(e.attackCd ?? 0, NPC_RANGED_LOS_BREAK_CD);
        if (target.type === EntityType.PLAYER) {
          pushNpcLogMessage(e, msgs, _time, `${entityDisplayName(e)} потерял линию огня. Укрытие сработало.`, '#9cf');
        }
        return true;
      }

      if (ai.windupTimer <= 0) {
        if (npcCommitRangedShot(world, e, target, ws, entities, nextId, atkSpeedMod, state)) return true;
        npcAutoEquipBestWeapon(e);
        e.attackCd = Math.max(e.attackCd ?? 0, 0.35);
      }
      return true;
    }

    if (lineClear) {
      e.attackCd = (e.attackCd ?? 0) - dt;
      if (e.attackCd! <= 0) {
        if (npcCanStartRangedWindup(e, ws)) {
          ai.windupTimer = npcRangedWindupSec(ws);
          ai.windupTargetId = target.id;
          if (target.type === EntityType.PLAYER && npcRangedShouldLog(ws)) {
            pushNpcLogMessage(e, msgs, _time, `${entityDisplayName(e)} целится: ${npcRangedThreatLabel(ws)}. Сбейте линию или дождитесь залпа.`, npcRangedCueColor(ws));
          }
          return true;
        }
        npcAutoEquipBestWeapon(e);
      } else {
        return true;
      }
    }
  }

  // Move toward target if too far for melee
  const meleeWs = WEAPON_STATS[e.weapon ?? ''] ?? WEAPON_STATS[''];
  const meleeRange = meleeWs.range || NPC_ATTACK_RANGE;
  if (bestDist > meleeRange) {
    if (ai.path.length === 0 || ai.timer <= 0) {
      tryAssignPathToCell(world, e, Math.floor(target.x), Math.floor(target.y));
      ai.timer = 2;
    }
    followPath(world, e, dt);
    return true;
  }

  // Melee attack
  e.attackCd = (e.attackCd ?? 0) - dt;
  if (e.attackCd! <= 0) {
    const baseDmg = meleeWs.dmg > 0 ? meleeWs.dmg : (5 + Math.floor(Math.random() * 8));
    const rawDmg = meleeDamage(e.rpg, e.weapon, baseDmg);
    let dmg = zhelemishIncomingMeleeDamage(target, _time, rawDmg);
    if (target.type === EntityType.MONSTER) dmg = applyMonsterIncomingDamage(world, target, dmg);
    if (target.hp !== undefined) {
      const debugImmortalPlayerHit = target.type === EntityType.PLAYER && isDebugOnePunchManEnabled();
      if (debugImmortalPlayerHit) {
        keepDebugOnePunchManAlive(target);
      } else {
        target.hp -= dmg;
        if (target.type === EntityType.PLAYER) recordPlayerDamage(state, e, dmg, `${entityDisplayName(e)} задел тебя: -${dmg}`);
        if (target.type === EntityType.NPC) {
          applyDamageRelationPenalty(e.faction, target.faction, dmg, target, e);
          if (target.hp > 0 && target.hp < (target.maxHp ?? 100) * 0.5) {
            bark(target, msgs, _time, BARK_WOUNDED, BARK_WOUNDED_F, BARK_CHANCE_WOUNDED, '#f88');
          }
        }
        const hitAng = Math.atan2(target.y - e.y, target.x - e.x);
        spawnBloodHit(world, target.x, target.y, hitAng, dmg, target.type === EntityType.MONSTER);
        applyMeleeKnockback(world, e, target, meleeWs);
        if (target.hp <= 0) {
          recordEntityKill(e, target);
          target.alive = false;
          spawnDeathPool(world, target.x, target.y, target.type === EntityType.MONSTER);
          if (target.type === EntityType.NPC) dropNpcInventory(target, entities, nextId);
          pushNpcLogMessage(e, msgs, _time, `${e.name ?? 'NPC'} ${e.isFemale ? 'убила' : 'убил'} ${entityDisplayName(target)}`, '#fa4');
          bark(e, msgs, _time, BARK_KILL, BARK_KILL_F, BARK_CHANCE_KILL, '#da4');
          if (target.isFogBoss && target.fogBossZone !== undefined) {
            clearFogInZone(world, target.fogBossZone, msgs, _time);
          }
        }
      }
    }
    if (!meleeWs.isRanged && meleeWs.durability > 0) {
      consumeDurability(e, msgs, _time);
      if (!e.weapon || e.weapon === '') npcAutoEquipBestWeapon(e);
    }
    playSoundAt(playAttack, e.x, e.y);
    publishWeaponNoise(state, e, e.weapon ?? '', meleeWs);
    e.attackCd = (meleeWs.speed || NPC_COMBAT_CD) * atkSpeedMod;
  }
  return true;
}

function applyMeleeKnockback(world: World, source: Entity, target: Entity, ws: WeaponStats): void {
  const force = Math.min(MELEE_KNOCKBACK_CAP, Math.max(0, ws.knockback ?? 0));
  if (force <= 0) return;

  let dx = world.delta(source.x, target.x);
  let dy = world.delta(source.y, target.y);
  let len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) {
    dx = Math.cos(source.angle);
    dy = Math.sin(source.angle);
    len = 1;
  }

  const canOccupy = (x: number, y: number): boolean =>
    !world.solid(Math.floor(x + KNOCKBACK_BODY_R), Math.floor(y + KNOCKBACK_BODY_R)) &&
    !world.solid(Math.floor(x + KNOCKBACK_BODY_R), Math.floor(y - KNOCKBACK_BODY_R)) &&
    !world.solid(Math.floor(x - KNOCKBACK_BODY_R), Math.floor(y + KNOCKBACK_BODY_R)) &&
    !world.solid(Math.floor(x - KNOCKBACK_BODY_R), Math.floor(y - KNOCKBACK_BODY_R));

  const nx = world.wrap(target.x + dx / len * force);
  if (canOccupy(nx, target.y)) target.x = nx;
  const ny = world.wrap(target.y + dy / len * force);
  if (canOccupy(target.x, ny)) target.y = ny;

  const stagger = Math.min(MELEE_STAGGER_CAP, 0.08 + force * 0.35);
  if (target.ai) target.ai.staggerTimer = Math.max(target.ai.staggerTimer ?? 0, stagger);
  if (target.type !== EntityType.PLAYER) target.attackCd = Math.max(target.attackCd ?? 0, stagger);
}

function npcRangedDamageScore(ws: WeaponStats): number {
  return ws.dmg * (ws.pellets ?? 1) + (ws.aoeRadius ? 45 : 0);
}

function npcRangedWindupSec(ws: WeaponStats): number {
  const score = npcRangedDamageScore(ws);
  if (ws.aoeRadius || score >= 70) return 0.62;
  if (ws.psiCost || score >= 35) return 0.42;
  if (ws.speed <= 0.2) return 0.06;
  return 0.22;
}

function npcRangedShouldLog(ws: WeaponStats): boolean {
  return ws.psiCost !== undefined || ws.aoeRadius !== undefined || npcRangedDamageScore(ws) >= 20 || ws.speed > 0.2;
}

function npcRangedThreatLabel(ws: WeaponStats): string {
  if (ws.psiCost) return 'ПСИ';
  if (ws.aoeRadius) return 'взрыв';
  if ((ws.pellets ?? 1) > 1) return 'дробь';
  if (ws.projType === ProjType.FLAME) return 'огонь';
  if (ws.projType === ProjType.BFG || (ws.projSprite === Spr.GAUSS_BOLT || ws.projSprite === Spr.PLASMA_BOLT)) return 'энергия';
  return 'выстрел';
}

function npcRangedCueColor(ws: WeaponStats): string {
  if (ws.psiCost) return '#c8f';
  if (ws.aoeRadius) return '#fa4';
  if (ws.projSprite === Spr.PLASMA_BOLT || ws.projSprite === Spr.GAUSS_BOLT) return '#6cf';
  return '#fc8';
}

function npcCanStartRangedWindup(e: Entity, ws: WeaponStats): boolean {
  if (ws.psiCost) return !!e.rpg && e.rpg.psi >= ws.psiCost;
  if (!ws.ammoType) return true;
  return e.inventory?.some(slot => slot.defId === ws.ammoType && slot.count > 0) === true;
}

function npcCommitRangedShot(
  world: World,
  e: Entity,
  target: Entity,
  ws: WeaponStats,
  entities: Entity[],
  nextId: { v: number },
  atkSpeedMod: number,
  state?: GameState,
): boolean {
  if (ws.psiCost) {
    if (!e.rpg || e.rpg.psi < ws.psiCost) return false;
    e.rpg.psi -= ws.psiCost;
    npcFireProjectile(world, e, target, ws, entities, nextId);
    playSoundAt(playHostilePsiCast, e.x, e.y);
    publishWeaponNoise(state, e, e.weapon ?? '', ws);
    e.attackCd = ws.speed * atkSpeedMod;
    e.ai!.windupTimer = undefined;
    e.ai!.windupTargetId = undefined;
    return true;
  }
  if (ws.ammoType && !consumeAmmo(e)) return false;
  npcFireProjectile(world, e, target, ws, entities, nextId);
  playSoundAt(hostileWeaponSound(e.weapon ?? ''), e.x, e.y);
  publishWeaponNoise(state, e, e.weapon ?? '', ws);
  e.attackCd = ws.speed * atkSpeedMod;
  e.ai!.windupTimer = undefined;
  e.ai!.windupTargetId = undefined;
  return true;
}

function hostileWeaponSound(weaponId: string): () => void {
  switch (weaponId) {
    case 'shotgun':
    case 'toz_shotgun':
      return playHostileShotgun;
    case 'nailgun':
    case 'harpoon_gun':
      return playHostileNailgun;
    case 'flamethrower':
      return playHostileFlame;
    case 'gauss':
    case 'plasma':
    case 'bfg':
      return playHostileEnergyShot;
    default:
      return playHostileGunshot;
  }
}

/* ── NPC: fire ranged projectile ──────────────────────────────── */
function npcFireProjectile(
  world: World, e: Entity, target: Entity, ws: typeof WEAPON_STATS[string],
  entities: Entity[], nextId: { v: number },
): void {
  const dx = world.delta(e.x, target.x);
  const dy = world.delta(e.y, target.y);
  const ang = Math.atan2(dy, dx);
  const pellets = ws.pellets ?? 1;
  const spread = ws.spread ?? 0;
  const spd = ws.projSpeed ?? 15;
  for (let p = 0; p < pellets; p++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const proj: Entity = {
      id: nextId.v++,
      type: EntityType.PROJECTILE,
      x: world.wrap(e.x + Math.cos(ang) * 0.5),
      y: world.wrap(e.y + Math.sin(ang) * 0.5),
      angle: a,
      pitch: 0,
      alive: true,
      speed: 0,
      sprite: hostileProjectileSprite(ws.projSprite ?? Spr.BULLET),
      vx: cos * spd,
      vy: sin * spd,
      projDmg: ws.dmg,
      projLife: ws.projType === ProjType.FLAME ? 0.7 : 3.0,
      ownerId: e.id,
      spriteScale: ws.projType === ProjType.FLAME ? 0.55 : 0.25,
      spriteZ: 0.5,
      projType: ws.projType,
    };
    if (ws.aoeRadius) {
      proj.aoeRadius = ws.aoeRadius;
      proj.aoeDmg = ws.dmg;
    }
    entities.push(proj);
  }
}

/* ── NPC: auto-equip best weapon from inventory ───────────────── */
function npcAutoEquipBestWeapon(e: Entity): void {
  if (!e.inventory) { e.weapon = ''; return; }
  let bestDmg = 0;
  let bestId = '';
  for (const slot of e.inventory) {
    const w = WEAPON_STATS[slot.defId];
    if (!w) continue;
    if (w.isRanged && w.ammoType) {
      const hasAmmo = e.inventory.some(s => s.defId === w.ammoType && s.count > 0);
      if (!hasAmmo) continue;
    }
    if (w.psiCost && (!e.rpg || e.rpg.psi < w.psiCost)) continue;
    const effectiveDmg = w.isRanged ? w.dmg * (w.pellets ?? 1) * 2 : w.dmg;
    if (effectiveDmg > bestDmg) {
      bestDmg = effectiveDmg;
      bestId = slot.defId;
    }
  }
  e.weapon = bestId;
}

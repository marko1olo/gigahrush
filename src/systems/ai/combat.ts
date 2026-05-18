/* ── NPC combat: faction fights + fleeing ─────────────────────── */

import {
  type Entity, type Msg,
  EntityType, AIGoal, Occupation, Faction, ProjType,
  msg,
} from '../../core/types';
import { World } from '../../core/world';
import { WEAPON_STATS } from '../../data/catalog';
import { playGunshot, playShotgun, playNailgun, playAttack, playFlame, playSoundAt } from '../audio';
import { applyDamageRelationPenalty } from '../factions';
import { clearFogInZone } from '../samosbor';
import { strMeleeDmgMult, agiAttackSpeedMult } from '../rpg';
import { zhelemishIncomingMeleeDamage } from '../status';
import { spawnBloodHit, spawnDeathPool } from '../../render/blood';
import { consumeAmmo, consumeDurability } from '../inventory';
import { isDebugOnePunchManEnabled, keepDebugOnePunchManAlive } from '../debug_cheats';
import { entityDisplayName } from '../../entities/monster';
import { bfsPath, followPath } from './pathfinding';
import { Spr, hostileProjectileSprite } from '../../render/sprite_index';
import { findCombatTarget, dropNpcInventory, deterministicScanCd } from './monster';
import {
  bark,
  BARK_COMBAT_START, BARK_COMBAT_START_F, BARK_CHANCE_COMBAT,
  BARK_WOUNDED, BARK_WOUNDED_F, BARK_CHANCE_WOUNDED,
  BARK_KILL, BARK_KILL_F, BARK_CHANCE_KILL,
  BARK_FLEE, BARK_FLEE_F, BARK_CHANCE_FLEE,
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

export function tryFleeFromMonster(
  world: World, entities: Entity[], e: Entity, dt: number,
): boolean {
  const isCombatant = (e.psiMadness ?? 0) > 0 ||
    e.isTraveler ||
    e.occupation === Occupation.HUNTER ||
    e.occupation === Occupation.PILGRIM ||
    e.faction === Faction.LIQUIDATOR ||
    e.faction === Faction.CULTIST ||
    e.faction === Faction.WILD;
  if (isCombatant) return false;

  const ws = WEAPON_STATS[e.weapon ?? ''];
  if (ws && (ws.dmg > 3 || ws.isRanged)) return false;

  const ai = e.ai!;

  if (ai.goal === AIGoal.FLEE && ai.timer > 0) {
    ai.timer -= dt;
    const savedSpeed = e.speed;
    e.speed *= 1.3;
    followPath(world, e, dt);
    e.speed = savedSpeed;
    return true;
  }

  ai.combatScanCd = (ai.combatScanCd ?? 0) - dt;
  if (ai.combatScanCd! > 0 && ai.goal !== AIGoal.FLEE) return false;
  ai.combatScanCd = NPC_FLEE_SCAN_CD;

  let nearestMonster: Entity | null = null;
  let nearestD2 = NPC_FLEE_DETECT_SQ;
  for (const other of entities) {
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

  bark(e, _barkMsgs, _barkTime, BARK_FLEE, BARK_FLEE_F, BARK_CHANCE_FLEE, '#ff8');
  ai.goal = AIGoal.FLEE;
  const dx = world.delta(nearestMonster.x, e.x);
  const dy = world.delta(nearestMonster.y, e.y);
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
  ai.timer = 3;

  const savedSpeed = e.speed;
  e.speed *= 1.3;
  followPath(world, e, dt);
  e.speed = savedSpeed;
  return true;
}

/* ── NPC faction combat: attack nearby hostile entities ────────── */
const NPC_COMBAT_RANGE = 8;
const NPC_ATTACK_RANGE = 1.3;
const NPC_COMBAT_CD = 1.2;
const NPC_RANGED_MAX = 12;

export function tryFactionCombat(
  world: World, entities: Entity[], e: Entity, dt: number, _time: number, msgs: Msg[], nextId: { v: number },
): boolean {
  const ws = WEAPON_STATS[e.weapon ?? ''] ?? WEAPON_STATS[''];
  const isArmed = ws.dmg > 3 || ws.isRanged;

  const isCombatant = (e.psiMadness ?? 0) > 0 ||
    e.isTraveler ||
    e.occupation === Occupation.HUNTER ||
    e.occupation === Occupation.PILGRIM ||
    e.faction === Faction.LIQUIDATOR ||
    e.faction === Faction.CULTIST ||
    e.faction === Faction.WILD ||
    isArmed;
  if (!isCombatant) return false;

  const detectRange = ws.isRanged ? NPC_RANGED_MAX : NPC_COMBAT_RANGE;
  const ai = e.ai!;
  const prevTarget = ai.combatTargetId;
  const target = findCombatTarget(
    world, entities, e, dt,
    detectRange * detectRange, deterministicScanCd(e.id, 0.8, 0.4),
    o => o.type === EntityType.NPC || o.type === EntityType.MONSTER || o.type === EntityType.PLAYER,
  );

  if (!target) return false;
  if (ai.combatTargetId !== target.id || prevTarget === undefined) {
    bark(e, msgs, _time, BARK_COMBAT_START, BARK_COMBAT_START_F, BARK_CHANCE_COMBAT, '#fa8');
  }
  ai.combatTargetId = target.id;

  const bestDist = Math.sqrt(world.dist2(e.x, e.y, target.x, target.y));
  const atkSpeedMod = e.rpg ? agiAttackSpeedMult(e.rpg) : 1;

  // Ranged NPC: fire projectile if in range
  if (ws.isRanged && bestDist < NPC_RANGED_MAX && bestDist > 1.5) {
    e.attackCd = (e.attackCd ?? 0) - dt;
    if (e.attackCd! <= 0) {
      if (ws.psiCost) {
        if (!e.rpg || e.rpg.psi < ws.psiCost) {
          npcAutoEquipBestWeapon(e);
          // Out of PSI — fall through to melee
        } else {
          e.rpg.psi -= ws.psiCost;
          npcFireProjectile(e, target, ws, entities, nextId);
          e.attackCd = ws.speed * atkSpeedMod;
          return true;
        }
      } else if (ws.ammoType) {
        if (consumeAmmo(e)) {
          npcFireProjectile(e, target, ws, entities, nextId);
          if (e.weapon === 'shotgun') playSoundAt(playShotgun, e.x, e.y);
          else if (e.weapon === 'nailgun') playSoundAt(playNailgun, e.x, e.y);
          else if (e.weapon === 'flamethrower') playSoundAt(playFlame, e.x, e.y);
          else playSoundAt(playGunshot, e.x, e.y);
          e.attackCd = ws.speed * atkSpeedMod;
          return true;
        }
        npcAutoEquipBestWeapon(e);
      }
    } else {
      return true;
    }
  }

  // Move toward target if too far for melee
  const meleeWs = WEAPON_STATS[e.weapon ?? ''] ?? WEAPON_STATS[''];
  const meleeRange = meleeWs.range || NPC_ATTACK_RANGE;
  if (bestDist > meleeRange) {
    if (ai.path.length === 0 || ai.timer <= 0) {
      ai.path = bfsPath(world, Math.floor(e.x), Math.floor(e.y), Math.floor(target.x), Math.floor(target.y));
      ai.pi = 0;
      ai.timer = 2;
    }
    followPath(world, e, dt);
    return true;
  }

  // Melee attack
  e.attackCd = (e.attackCd ?? 0) - dt;
  if (e.attackCd! <= 0) {
    const strMult = e.rpg ? strMeleeDmgMult(e.rpg) : 1;
    const baseDmg = meleeWs.dmg > 0 ? meleeWs.dmg : (5 + Math.floor(Math.random() * 8));
    const rawDmg = Math.round(baseDmg * strMult);
    const dmg = zhelemishIncomingMeleeDamage(target, _time, rawDmg);
    if (target.hp !== undefined) {
      const debugImmortalPlayerHit = target.type === EntityType.PLAYER && isDebugOnePunchManEnabled();
      if (debugImmortalPlayerHit) {
        keepDebugOnePunchManAlive(target);
      } else {
        target.hp -= dmg;
        if (target.type === EntityType.NPC) {
          applyDamageRelationPenalty(e.faction, target.faction, dmg);
          if (target.hp > 0 && target.hp < (target.maxHp ?? 100) * 0.5) {
            bark(target, msgs, _time, BARK_WOUNDED, BARK_WOUNDED_F, BARK_CHANCE_WOUNDED, '#f88');
          }
        }
        const hitAng = Math.atan2(target.y - e.y, target.x - e.x);
        spawnBloodHit(world, target.x, target.y, hitAng, dmg, target.type === EntityType.MONSTER);
        if (target.hp <= 0) {
          target.alive = false;
          spawnDeathPool(world, target.x, target.y, target.type === EntityType.MONSTER);
          if (target.type === EntityType.NPC) dropNpcInventory(target, entities, nextId);
          msgs.push(msg(`${e.name ?? 'NPC'} ${e.isFemale ? 'убила' : 'убил'} ${entityDisplayName(target)}`, _time, '#fa4'));
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
    e.attackCd = (meleeWs.speed || NPC_COMBAT_CD) * atkSpeedMod;
  }
  return true;
}

/* ── NPC: fire ranged projectile ──────────────────────────────── */
function npcFireProjectile(
  e: Entity, target: Entity, ws: typeof WEAPON_STATS[string],
  entities: Entity[], nextId: { v: number },
): void {
  const ang = Math.atan2(target.y - e.y, target.x - e.x);
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
      x: e.x + Math.cos(ang) * 0.5,
      y: e.y + Math.sin(ang) * 0.5,
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

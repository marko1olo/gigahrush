/* ── Monster behavior: hunt player + hostile NPCs ─────────────── */

import {
  W,
  type Entity, type GameState, type Msg,
  Cell, Feature, ItemType, RoomType,
  EntityType, AIGoal, MonsterKind,
  msg,
} from '../../core/types';
import { World } from '../../core/world';
import { MONSTERS, entityDisplayName, type MonsterAIFlag, type MonsterDef } from '../../entities/monster';
import { ITEMS, ITEM_TAGS } from '../../data/items';
import { playGrowl, playSoundAt } from '../audio';
import { isHostile } from '../factions';
import { scaleMonsterDmg, strMeleeDmgMult, scaleMonsterHp, scaleMonsterSpeed, randomRPG } from '../rpg';
import { zhelemishIncomingMeleeDamage } from '../status';
import { spawnBloodHit, spawnDeathPool } from '../../render/blood';
import { followPath, tryAssignPathToCell, wanderNearby } from './pathfinding';
import { Spr } from '../../render/sprite_index';
import { publishEvent } from '../events';
import { recordPlayerDamage } from '../damage';
import {
  MONSTER_BAIT_COMBAT_LOCK_SQ,
  MONSTER_BAIT_CONSUME_RADIUS_SQ,
  clearDeadBaitDrop,
  consumeMonsterBait,
  findMonsterBaitTarget,
} from '../monster_bait';
import { isDebugOnePunchManEnabled, keepDebugOnePunchManAlive } from '../debug_cheats';
import { ENTITY_MASK_ACTOR, ENTITY_MASK_MONSTER, getEntityIndex } from '../entity_index';
import {
  findZombieApocalypseTarget,
  isZombieApocalypseActive,
  tryZombieApocalypseInfection,
} from '../procedural_anomalies/zombie_apocalypse';

/* ── Shared combat target finder ──────────────────────────────── */
const MONSTER_DETECT = 20;
const MONSTER_DETECT_SQ = MONSTER_DETECT * MONSTER_DETECT;
const PREFER_PLAYER = 15;
const PREFER_SQ = PREFER_PLAYER * PREFER_PLAYER;
const MATKA_MAX_CHILDREN = 100;
const PECHATEED_DETECT_SQ = 24 * 24;
const PECHATEED_FALLBACK_SQ = 10 * 10;
const DEBRIS_LURKER_COVER_DETECT_SQ = 22 * 22;
const DEBRIS_LURKER_EXPOSED_DETECT_SQ = 12 * 12;
const NELYUD_REVEAL_SQ = 6 * 6;
const KOSTOREZ_DETECT_SQ = 22 * 22;
const KOSTOREZ_WINDUP_RANGE = 2.25;
const KOSTOREZ_BURST_RANGE = 2.85;
const KOSTOREZ_WINDUP_SEC = 1.35;
const KOSTOREZ_STAGGER_SEC = 1.15;
const KOSTOREZ_ESCAPE_DIST = 4.0;
const EYE_SHOT_RANGE = 15;
const EYE_MIN_RANGE = 1.5;
const EYE_WINDUP_SEC = 0.85;
const EYE_LOS_BREAK_COOLDOWN = 0.75;
const SHADOW_WARNING_RANGE_SQ = 5.5 * 5.5;
const SHADOW_WINDUP_SEC = 0.55;
const SHADOW_STRIKE_BREAK_RANGE = 1.65;
const SHADOW_LIGHT_SAFE = 0.34;
const SHADOW_DARK_LIGHT = 0.18;
const SHADOW_CANCEL_COOLDOWN = 0.65;
const KOSTOREZ_RUMOR_IDS = [
  'monster_kostorez_cuts',
  'ecology_kostorez_windup',
  'ecology_kostorez_shotgun',
  'lead_maintenance_kostorez_locker',
] as const;
const EYE_RUMOR_IDS = ['monster_eye_lamps', 'ecology_eye_line'] as const;
const SHADOW_RUMOR_IDS = ['monster_shadow_silence', 'ecology_shadow_afterimage'] as const;
const DOCUMENT_ITEM_TAGS = [
  'document',
  'documents',
  'paper',
  'papers',
  'admin',
  'official',
  'forgery',
  'forged',
  'audit',
  'evidence',
  'permit',
  'ration',
  'coupon',
] as const;

/** Entity lookup map — set by updateAI each frame */
let _entityById = new Map<number, Entity>();
export function setEntityMap(m: Map<number, Entity>): void { _entityById = m; }

const combatQuery: Entity[] = [];
const documentHunterQuery: Entity[] = [];
const matkaChildrenQuery: Entity[] = [];

function zoneIdAt(world: World, x: number, y: number): number | undefined {
  const zid = world.zoneMap[world.idx(Math.floor(x), Math.floor(y))];
  return zid >= 0 ? zid : undefined;
}

function kostorezEventData(extra?: Record<string, unknown>): Record<string, unknown> {
  return { rumorIds: [...KOSTOREZ_RUMOR_IDS], ...extra };
}

function monsterReadabilityRumorIds(kind: MonsterKind | undefined): readonly string[] {
  switch (kind) {
    case MonsterKind.EYE: return EYE_RUMOR_IDS;
    case MonsterKind.SHADOW: return SHADOW_RUMOR_IDS;
    default: return [];
  }
}

function monsterReadabilityEventData(
  kind: MonsterKind | undefined,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  const rumorIds = monsterReadabilityRumorIds(kind);
  return rumorIds.length > 0 ? { rumorIds: [...rumorIds], ...extra } : { ...extra };
}

function publishMonsterReadabilityEvent(
  state: GameState | undefined,
  world: World,
  e: Entity,
  target: Entity | undefined,
  type: 'monster_sighted' | 'monster_windup_interrupted',
  severity: 3 | 4,
  tags: string[],
  data?: Record<string, unknown>,
): void {
  if (!state) return;
  publishEvent(state, {
    type,
    zoneId: zoneIdAt(world, e.x, e.y),
    x: e.x,
    y: e.y,
    actorId: e.id,
    actorName: entityDisplayName(e),
    actorFaction: e.faction,
    targetId: target?.id,
    targetName: target ? entityDisplayName(target) : undefined,
    targetFaction: target?.faction,
    monsterKind: e.monsterKind,
    severity,
    privacy: target?.type === EntityType.PLAYER ? 'local' : 'witnessed',
    tags: ['monster', ...tags],
    data: monsterReadabilityEventData(e.monsterKind, data),
  });
}

function publishKostorezEvent(
  state: GameState | undefined,
  world: World,
  e: Entity,
  target: Entity | undefined,
  type: 'monster_sighted' | 'monster_windup_interrupted' | 'monster_armor_cut' | 'monster_escaped',
  severity: 3 | 4 | 5,
  tags: string[],
  data?: Record<string, unknown>,
): void {
  if (!state) return;
  publishEvent(state, {
    type,
    zoneId: zoneIdAt(world, e.x, e.y),
    x: e.x,
    y: e.y,
    actorId: e.id,
    actorName: entityDisplayName(e),
    actorFaction: e.faction,
    targetId: target?.id,
    targetName: target ? entityDisplayName(target) : undefined,
    targetFaction: target?.faction,
    monsterKind: MonsterKind.KOSTOREZ,
    severity,
    privacy: target?.type === EntityType.PLAYER ? 'local' : 'witnessed',
    tags: ['monster', 'kostorez', ...tags],
    data: kostorezEventData(data),
  });
}

function hasClearLine(world: World, e: Entity, target: Entity, maxDist: number): boolean {
  const dx = world.delta(e.x, target.x);
  const dy = world.delta(e.y, target.y);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxDist) return false;
  const steps = Math.max(2, Math.ceil(dist * 2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = Math.floor(e.x + dx * t);
    const y = Math.floor(e.y + dy * t);
    if (world.solid(x, y)) return false;
  }
  return true;
}

function cutMetalSheet(target: Entity): boolean {
  if (!target.inventory) return false;
  for (let i = 0; i < target.inventory.length; i++) {
    const slot = target.inventory[i];
    if (slot.defId !== 'metal_sheet' || slot.count <= 0) continue;
    slot.count--;
    if (slot.count <= 0) target.inventory.splice(i, 1);
    return true;
  }
  return false;
}

export function findCombatTarget(
  world: World, entities: Entity[], e: Entity, dt: number,
  rangeSq: number, scanCd: number,
  typeFilter: (other: Entity) => boolean,
): Entity | null {
  const ai = e.ai!;
  let target: Entity | null = null;

  ai.combatScanCd = (ai.combatScanCd ?? 0) - dt;
  if (ai.combatTargetId !== undefined) {
    const cached = _entityById.get(ai.combatTargetId);
    if (cached && cached.alive) {
      const d2 = world.dist2(e.x, e.y, cached.x, cached.y);
      if (d2 < rangeSq) { target = cached; }
    }
    if (!target) ai.combatTargetId = undefined;
  }

  // Always rescan periodically to switch to closer targets
  if (ai.combatScanCd! <= 0) {
    ai.combatScanCd = scanCd;
    let newTarget: Entity | null = null;
    let newBest = rangeSq;
    getEntityIndex().queryRadius(e.x, e.y, Math.sqrt(rangeSq), combatQuery, ENTITY_MASK_ACTOR);
    const candidates = combatQuery.length > 0 ? combatQuery : entities;
    for (const other of candidates) {
      if (!other.alive || other.id === e.id) continue;
      if (!typeFilter(other)) continue;
      const d2 = world.dist2(e.x, e.y, other.x, other.y);
      if (d2 >= newBest) continue;
      if (!isHostile(e, other)) continue;
      newBest = d2;
      newTarget = other;
    }
    if (newTarget) { target = newTarget; ai.combatTargetId = newTarget.id; }
  }

  return target;
}

function canBeMonsterTarget(other: Entity): boolean {
  return other.type !== EntityType.MONSTER && other.type !== EntityType.PROJECTILE && other.type !== EntityType.ITEM_DROP;
}

function hasAIFlag(e: Entity, flag: MonsterAIFlag): boolean {
  return e.monsterKind !== undefined && MONSTERS[e.monsterKind]?.aiFlags?.includes(flag) === true;
}

function fixedScanCd(e: Entity): number | undefined {
  switch (e.monsterKind) {
    case MonsterKind.SBORKA: return 0.55;
    case MonsterKind.TVAR: return 0.85;
    case MonsterKind.POLZUN: return 1.35;
    default: break;
  }
  if (hasAIFlag(e, 'wallBias')) return 1.1;
  if (hasAIFlag(e, 'lampPowered')) return 1.2;
  if (hasAIFlag(e, 'waterStrider')) return 1.3;
  if (hasAIFlag(e, 'rangedClause')) return 1.4;
  if (hasAIFlag(e, 'debrisLurker')) return 1.25;
  return undefined;
}

export function deterministicScanCd(id: number, base: number, spread: number): number {
  const h = Math.imul(id ^ 0x9E3779B9, 0x85EBCA6B) >>> 0;
  return base + ((h & 1023) / 1023) * spread;
}

function isDocumentItemTag(tag: string): boolean {
  return (DOCUMENT_ITEM_TAGS as readonly string[]).includes(tag);
}

function itemHasDocumentTag(defId: string, tags: readonly string[] | undefined): boolean {
  const extra = ITEM_TAGS[defId];
  if (extra) {
    for (const tag of extra) if (isDocumentItemTag(tag)) return true;
  }
  if (tags) {
    for (const tag of tags) if (isDocumentItemTag(tag)) return true;
  }
  return false;
}

function isOfficePaperLike(defId: string): boolean {
  const def = ITEMS[defId];
  if (!def) return false;
  if (def.type === ItemType.NOTE || def.type === ItemType.KEY) return true;
  if (itemHasDocumentTag(defId, def.tags)) return true;
  return def.type === ItemType.MISC &&
    (def.spawnRooms.includes(RoomType.OFFICE) || def.spawnRooms.includes(RoomType.HQ)) &&
    !def.spawnRooms.includes(RoomType.PRODUCTION);
}

function hasDocumentLikeItem(e: Entity): boolean {
  if (!e.inventory || e.inventory.length === 0) return false;
  for (const item of e.inventory) {
    if (item.count > 0 && isOfficePaperLike(item.defId)) return true;
  }
  return false;
}

function nearFeature(world: World, e: Entity, feature: Feature, radius: number): boolean {
  const ex = Math.floor(e.x);
  const ey = Math.floor(e.y);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const ci = world.idx(ex + dx, ey + dy);
      if (world.features[ci] === feature) return true;
    }
  }
  return false;
}

function adjacentWall(world: World, e: Entity): boolean {
  const x = Math.floor(e.x);
  const y = Math.floor(e.y);
  return world.cells[world.idx(x - 1, y)] === Cell.WALL ||
    world.cells[world.idx(x + 1, y)] === Cell.WALL ||
    world.cells[world.idx(x, y - 1)] === Cell.WALL ||
    world.cells[world.idx(x, y + 1)] === Cell.WALL;
}

function nearDebrisFeature(world: World, e: Entity, radius: number): boolean {
  const ex = Math.floor(e.x);
  const ey = Math.floor(e.y);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const feature = world.features[world.idx(ex + dx, ey + dy)];
      if (feature === Feature.SHELF || feature === Feature.MACHINE || feature === Feature.APPARATUS) return true;
    }
  }
  return false;
}

function inDebrisCover(world: World, e: Entity): boolean {
  if (adjacentWall(world, e) || nearDebrisFeature(world, e, 2)) return true;
  const room = world.roomAt(e.x, e.y);
  return room?.type === RoomType.STORAGE || room?.type === RoomType.PRODUCTION;
}

function wallNeighborCount(world: World, x: number, y: number): number {
  let n = 0;
  if (world.solid(x - 1, y)) n++;
  if (world.solid(x + 1, y)) n++;
  if (world.solid(x, y - 1)) n++;
  if (world.solid(x, y + 1)) n++;
  return n;
}

function inPolzunKillCell(world: World, e: Entity): boolean {
  const x = Math.floor(e.x);
  const y = Math.floor(e.y);
  const ci = world.idx(x, y);
  return world.cells[ci] === Cell.WATER ||
    wallNeighborCount(world, x, y) >= 2 ||
    world.features[ci] === Feature.SINK ||
    world.features[ci] === Feature.TOILET;
}

function monsterMeleeRange(e: Entity): number {
  switch (e.monsterKind) {
    case MonsterKind.TVAR: return 1.55;
    case MonsterKind.POLZUN: return 1.35;
    default: return 1.2;
  }
}

function entityLight(world: World, e: Entity): number {
  return world.light[world.idx(Math.floor(e.x), Math.floor(e.y))] ?? 0;
}

function entityHasEquippedLight(e: Entity): boolean {
  return e.tool === 'flashlight' || e.tool === 'uv_spotlight';
}

function shadowHasLightCounter(world: World, shadow: Entity, target: Entity): boolean {
  return entityHasEquippedLight(target) ||
    entityLight(world, target) >= SHADOW_LIGHT_SAFE ||
    entityLight(world, shadow) >= SHADOW_LIGHT_SAFE;
}

function shadowCanDarkAmbush(world: World, shadow: Entity, target: Entity): boolean {
  return !entityHasEquippedLight(target) &&
    entityLight(world, shadow) <= SHADOW_DARK_LIGHT &&
    entityLight(world, target) < SHADOW_LIGHT_SAFE;
}

function monsterMoveMult(world: World, e: Entity): number {
  if (hasAIFlag(e, 'debrisLurker')) return inDebrisCover(world, e) ? 1.22 : 0.68;
  switch (e.monsterKind) {
    case MonsterKind.SHADOW: {
      const light = entityLight(world, e);
      if (light >= SHADOW_LIGHT_SAFE) return 0.78;
      if (light <= SHADOW_DARK_LIGHT) return 1.08;
      return 1;
    }
    case MonsterKind.TVAR:
      return adjacentWall(world, e) ? 1.12 : 0.96;
    default:
      break;
  }
  if (hasAIFlag(e, 'wallBias')) return adjacentWall(world, e) ? 1.18 : 0.92;
  if (hasAIFlag(e, 'waterStrider')) {
    return world.cells[world.idx(Math.floor(e.x), Math.floor(e.y))] === Cell.WATER ? 1.45 : 0.72;
  }
  return 1;
}

function monsterDmgMult(world: World, e: Entity, target?: Entity): number {
  if (hasAIFlag(e, 'debrisLurker')) return inDebrisCover(world, e) ? 1.25 : 0.75;
  switch (e.monsterKind) {
    case MonsterKind.SHADOW: {
      const light = entityLight(world, e);
      if (light >= SHADOW_LIGHT_SAFE) return 0.72;
      if (light <= SHADOW_DARK_LIGHT) return 1.1;
      return 1;
    }
    case MonsterKind.TVAR:
      return adjacentWall(world, e) || (target !== undefined && adjacentWall(world, target)) ? 1.22 : 1;
    case MonsterKind.POLZUN:
      return inPolzunKillCell(world, e) || (target !== undefined && inPolzunKillCell(world, target)) ? 1.35 : 1;
    default:
      break;
  }
  if (hasAIFlag(e, 'wallBias')) return adjacentWall(world, e) ? 1.2 : 1;
  if (hasAIFlag(e, 'lampPowered')) return nearFeature(world, e, Feature.LAMP, 3) ? 1.35 : 0.9;
  return 1;
}

function monsterDetectSq(world: World, e: Entity, fallback: number): number {
  if (hasAIFlag(e, 'documentHunter')) return PECHATEED_DETECT_SQ;
  if (hasAIFlag(e, 'closeReveal')) return NELYUD_REVEAL_SQ;
  if (hasAIFlag(e, 'debrisLurker')) {
    return inDebrisCover(world, e) ? DEBRIS_LURKER_COVER_DETECT_SQ : DEBRIS_LURKER_EXPOSED_DETECT_SQ;
  }
  return fallback;
}

function followMonsterPath(world: World, e: Entity, dt: number): void {
  const mult = monsterMoveMult(world, e);
  if (mult === 1) {
    followPath(world, e, dt);
    return;
  }
  const baseSpeed = e.speed;
  e.speed = baseSpeed * mult;
  followPath(world, e, dt);
  e.speed = baseSpeed;
}

function tryFollowMonsterBait(
  world: World,
  e: Entity,
  target: Entity | null,
  dt: number,
  time: number,
  msgs: Msg[],
  state?: GameState,
): boolean {
  if (target && world.dist2(e.x, e.y, target.x, target.y) <= MONSTER_BAIT_COMBAT_LOCK_SQ) return false;
  const bait = findMonsterBaitTarget(world, e, dt, time, state);
  if (!bait) return false;

  const ai = e.ai!;
  ai.goal = AIGoal.HUNT;
  ai.combatTargetId = undefined;
  const baitD2 = world.dist2(e.x, e.y, bait.x, bait.y);
  if (baitD2 <= MONSTER_BAIT_CONSUME_RADIUS_SQ) {
    const dropId = consumeMonsterBait(state, bait, e, time);
    if (dropId !== undefined) {
      const drop = _entityById.get(dropId);
      if (drop) clearDeadBaitDrop(drop);
    }
    ai.path = [];
    ai.pi = 0;
    msgs.push(msg(`${entityDisplayName(e)} сожрал приманку`, time, '#ca6'));
    return true;
  }

  const tx = Math.floor(bait.x);
  const ty = Math.floor(bait.y);
  ai.timer -= dt;
  if (ai.path.length === 0 || ai.timer <= 0 || ai.tx !== tx || ai.ty !== ty) {
    tryAssignPathToCell(world, e, tx, ty);
    ai.timer = 1.4;
  }
  if (ai.path.length === 0) return false;
  followMonsterPath(world, e, dt);
  return true;
}

function findDocumentHunterTarget(world: World, _entities: Entity[], e: Entity, dt: number): Entity | null {
  const ai = e.ai!;
  let target: Entity | null = null;

  ai.combatScanCd = (ai.combatScanCd ?? 0) - dt;
  if (ai.combatTargetId !== undefined) {
    const cached = _entityById.get(ai.combatTargetId);
    if (cached && cached.alive && canBeMonsterTarget(cached)) {
      const d2 = world.dist2(e.x, e.y, cached.x, cached.y);
      const documentRange = hasDocumentLikeItem(cached) && d2 < PECHATEED_DETECT_SQ;
      const fallbackRange = d2 < PECHATEED_FALLBACK_SQ;
      if ((documentRange || fallbackRange) && isHostile(e, cached)) target = cached;
    }
    if (!target) ai.combatTargetId = undefined;
  }

  if (ai.combatScanCd! <= 0) {
    ai.combatScanCd = 1.5;
    let docTarget: Entity | null = null;
    let docBest = PECHATEED_DETECT_SQ;
    let fallbackTarget: Entity | null = null;
    let fallbackBest = PECHATEED_FALLBACK_SQ;
    getEntityIndex().queryRadius(e.x, e.y, Math.sqrt(PECHATEED_DETECT_SQ), documentHunterQuery, ENTITY_MASK_ACTOR);
    for (const other of documentHunterQuery) {
      if (!other.alive || other.id === e.id || !canBeMonsterTarget(other)) continue;
      if (!isHostile(e, other)) continue;
      const d2 = world.dist2(e.x, e.y, other.x, other.y);
      if (hasDocumentLikeItem(other) && d2 < docBest) {
        docBest = d2;
        docTarget = other;
      } else if (d2 < fallbackBest) {
        fallbackBest = d2;
        fallbackTarget = other;
      }
    }
    target = docTarget ?? fallbackTarget;
    if (target) ai.combatTargetId = target.id;
  }

  return target;
}

function publishKostorezEscape(
  world: World,
  e: Entity,
  target: Entity | undefined,
  playerId: number,
  state: GameState | undefined,
  reason: string,
): void {
  const ai = e.ai!;
  if (target?.id !== playerId && ai.lastSeenTargetId !== playerId) return;
  publishKostorezEvent(state, world, e, target, 'monster_escaped', 4, ['escaped'], { reason });
  ai.lastSeenTargetId = undefined;
}

function finishKostorezWindup(
  world: World,
  entities: Entity[],
  e: Entity,
  target: Entity,
  time: number,
  msgs: Msg[],
  nextId: { v: number },
  state: GameState | undefined,
  playerId: number,
): void {
  const def = MONSTERS[MonsterKind.KOSTOREZ];
  const level = e.rpg?.level ?? 1;
  const strMult = e.rpg ? strMeleeDmgMult(e.rpg) : 1;
  let dmg = Math.round(scaleMonsterDmg(def.dmg, level) * strMult * (e.monsterDmgMult ?? 1));
  const armorCut = cutMetalSheet(target);
  if (armorCut) dmg = Math.max(7, Math.round(dmg * 0.55));

  if (target.hp !== undefined) {
    const debugImmortalPlayerHit = target.id === playerId && isDebugOnePunchManEnabled();
    if (debugImmortalPlayerHit) {
      keepDebugOnePunchManAlive(target);
    } else {
      target.hp -= dmg;
      if (target.id === playerId) recordPlayerDamage(state, e, dmg, `${entityDisplayName(e)} режет тебя: -${dmg}`);
      if (target.hp <= 0) {
        target.alive = false;
        target.hp = 0;
      }
      const hitAng = Math.atan2(target.y - e.y, target.x - e.x);
      spawnBloodHit(world, target.x, target.y, hitAng, dmg, target.type === EntityType.MONSTER);
      const targetLabel = target.type === EntityType.PLAYER ? 'тебя' : entityDisplayName(target);
      msgs.push(msg(
        armorCut
          ? `Косторез срезал бронелист и задел ${targetLabel}: -${dmg}`
          : `Косторез режет ${targetLabel}: -${dmg}`,
        time,
        armorCut ? '#fc4' : '#f44',
      ));
      publishKostorezEvent(state, world, e, target, 'monster_armor_cut', armorCut ? 5 : 4, ['hit', armorCut ? 'armor_cut' : 'burst'], {
        damage: dmg,
        armorCut,
        itemId: armorCut ? 'metal_sheet' : undefined,
        itemName: armorCut ? ITEMS.metal_sheet?.name : undefined,
      });
      if (target.hp <= 0) {
        spawnDeathPool(world, target.x, target.y, target.type === EntityType.MONSTER);
        if (target.type === EntityType.NPC) dropNpcInventory(target, entities, nextId);
        msgs.push(msg(`${entityDisplayName(e)} убил ${entityDisplayName(target)}`, time, '#f44'));
      }
    }
  }

  e.attackCd = def.attackRate;
  e.spriteScale = undefined;
  e.ai!.windupTimer = undefined;
  e.ai!.windupTargetId = undefined;
  if (target.id === playerId) e.ai!.lastSeenTargetId = playerId;
  playSoundAt(playGrowl, e.x, e.y);
}

function updateKostorez(
  world: World,
  entities: Entity[],
  e: Entity,
  target: Entity,
  dt: number,
  time: number,
  msgs: Msg[],
  playerId: number,
  nextId: { v: number },
  state?: GameState,
): boolean {
  const ai = e.ai!;
  const dist = Math.sqrt(world.dist2(e.x, e.y, target.x, target.y));

  if (target.id === playerId && ai.lastSeenTargetId !== playerId) {
    ai.lastSeenTargetId = playerId;
    publishKostorezEvent(state, world, e, target, 'monster_sighted', 4, ['sighted', 'warning'], {
      counterplay: 'distance, obstacle, shotgun stagger, metal_sheet armor',
    });
    msgs.push(msg('Косторез увидел тебя. Держи дистанцию: замах читается.', time, '#fa4'));
    playSoundAt(playGrowl, e.x, e.y);
  }

  if ((ai.staggerTimer ?? 0) > 0) {
    ai.staggerTimer = Math.max(0, (ai.staggerTimer ?? 0) - dt);
    e.spriteScale = 0.95;
    e.attackCd = Math.max(e.attackCd ?? 0, 0.35);
    return true;
  }

  e.spriteScale = undefined;
  e.attackCd = Math.max(0, (e.attackCd ?? 0) - dt);

  if ((ai.windupTimer ?? 0) > 0) {
    ai.windupTimer = Math.max(0, (ai.windupTimer ?? 0) - dt);
    e.angle = Math.atan2(world.delta(e.y, target.y), world.delta(e.x, target.x));
    e.spriteScale = 1.1 + Math.max(0, ai.windupTimer) * 0.08;

    if (!target.alive || dist > KOSTOREZ_BURST_RANGE || !hasClearLine(world, e, target, KOSTOREZ_BURST_RANGE)) {
      publishKostorezEscape(world, e, target, playerId, state, dist > KOSTOREZ_BURST_RANGE ? 'distance' : 'obstacle');
      msgs.push(msg('Косторез промахнулся: цель вышла из замаха.', time, '#fc4'));
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
      e.spriteScale = undefined;
      e.attackCd = 0.75;
      return true;
    }

    if (ai.windupTimer <= 0) finishKostorezWindup(world, entities, e, target, time, msgs, nextId, state, playerId);
    return true;
  }

  if (dist <= KOSTOREZ_WINDUP_RANGE && e.attackCd <= 0 && hasClearLine(world, e, target, KOSTOREZ_BURST_RANGE)) {
    ai.windupTimer = KOSTOREZ_WINDUP_SEC;
    ai.windupTargetId = target.id;
    e.spriteScale = 1.18;
    msgs.push(msg('Косторез заносит пилы. Отходи за угол или бей дробью!', time, '#fa4'));
    playSoundAt(playGrowl, e.x, e.y);
    return true;
  }

  if (dist > KOSTOREZ_ESCAPE_DIST) ai.windupTargetId = undefined;
  if (ai.path.length === 0 || ai.timer <= 0) {
    tryAssignPathToCell(world, e, Math.floor(target.x), Math.floor(target.y));
    ai.timer = 1.4;
  }
  ai.timer -= dt;
  followMonsterPath(world, e, dt);
  return true;
}

export function tryMonsterProjectileStagger(
  world: World,
  state: GameState,
  monster: Entity,
  projectile: Entity,
  playerId: number,
): boolean {
  if (monster.type !== EntityType.MONSTER || monster.monsterKind !== MonsterKind.KOSTOREZ || !monster.ai) return false;
  if ((monster.hp ?? 1) <= 0) return false;
  if (projectile.ownerId !== playerId || projectile.sprite !== Spr.PELLET) return false;

  const ai = monster.ai;
  const wasWindup = (ai.windupTimer ?? 0) > 0;
  ai.staggerTimer = Math.max(ai.staggerTimer ?? 0, KOSTOREZ_STAGGER_SEC);
  ai.windupTimer = undefined;
  ai.windupTargetId = undefined;
  monster.attackCd = Math.max(monster.attackCd ?? 0, 0.95);
  monster.spriteScale = 0.95;

  if (wasWindup) {
    const target = ai.combatTargetId !== undefined ? _entityById.get(ai.combatTargetId) : undefined;
    publishKostorezEvent(state, world, monster, target, 'monster_windup_interrupted', 4, ['windup', 'interrupted', 'shotgun'], {
      reason: 'shotgun_stagger',
    });
    state.msgs.push(msg('Дробь сбила замах Костореза.', state.time, '#4f4'));
  }
  return true;
}

function fireMonsterProjectile(
  world: World,
  entities: Entity[],
  e: Entity,
  target: Entity,
  def: MonsterDef,
  nextId: { v: number },
): void {
  const baseDmg = def.dmg ?? 10;
  const level = e.rpg?.level ?? 1;
  const strMult = e.rpg ? strMeleeDmgMult(e.rpg) : 1;
  const dmg = Math.round(scaleMonsterDmg(baseDmg, level) * strMult * monsterDmgMult(world, e) * (e.monsterDmgMult ?? 1));
  const dx = world.delta(e.x, target.x);
  const dy = world.delta(e.y, target.y);
  const ang = Math.atan2(dy, dx);
  const spd = def.projSpeed ?? 8;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  entities.push({
    id: nextId.v++,
    type: EntityType.PROJECTILE,
    x: world.wrap(e.x + cos * 0.5),
    y: world.wrap(e.y + sin * 0.5),
    angle: ang,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: def.projSprite || Spr.EYE_BOLT,
    vx: cos * spd,
    vy: sin * spd,
    projDmg: dmg,
    projLife: 3.0,
    ownerId: e.id,
    spriteScale: 0.3,
    spriteZ: 0.5,
  });
  playSoundAt(playGrowl, e.x, e.y);
  e.attackCd = def.attackRate ?? 2;
}

function updateEyeRanged(
  world: World,
  entities: Entity[],
  e: Entity,
  target: Entity,
  def: MonsterDef,
  bestDist: number,
  dt: number,
  time: number,
  msgs: Msg[],
  playerId: number,
  nextId: { v: number },
  state?: GameState,
): boolean {
  const ai = e.ai!;
  const inShotRange = bestDist < EYE_SHOT_RANGE && bestDist > EYE_MIN_RANGE;
  const currentTarget = ai.windupTargetId === undefined || ai.windupTargetId === target.id;

  if ((ai.windupTimer ?? 0) > 0) {
    ai.windupTimer = Math.max(0, (ai.windupTimer ?? 0) - dt);
    const lineClear = currentTarget && inShotRange && target.alive && hasClearLine(world, e, target, EYE_SHOT_RANGE);
    if (!lineClear) {
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
      e.attackCd = Math.max(e.attackCd ?? 0, EYE_LOS_BREAK_COOLDOWN);
      if (target.id === playerId) {
        msgs.push(msg('Выстрел Глаза сорвался о стену. Держите угол до вспышки.', time, '#9cf'));
        publishMonsterReadabilityEvent(state, world, e, target, 'monster_windup_interrupted', 3, ['eye', 'windup', 'line_of_sight', 'interrupted'], {
          reason: !inShotRange ? 'range' : 'line_of_sight',
          counterplay: 'break_line_before_bolt',
        });
      }
      return true;
    }

    const dx = world.delta(e.x, target.x);
    const dy = world.delta(e.y, target.y);
    e.angle = Math.atan2(dy, dx);
    if (ai.windupTimer <= 0) {
      fireMonsterProjectile(world, entities, e, target, def, nextId);
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
    }
    return true;
  }

  if (!inShotRange) return false;
  if (!hasClearLine(world, e, target, EYE_SHOT_RANGE)) return false;

  if (target.id === playerId && ai.lastSeenTargetId !== playerId) {
    ai.lastSeenTargetId = playerId;
    msgs.push(msg('Глаз заряжает зелёный выстрел. Угол или дверь сорвут линию.', time, '#cf6'));
    publishMonsterReadabilityEvent(state, world, e, target, 'monster_sighted', 4, ['eye', 'ranged', 'line_of_sight', 'warning'], {
      windupSec: EYE_WINDUP_SEC,
      counterplay: 'corner_or_door_breaks_line',
    });
  }

  e.attackCd = (e.attackCd ?? 0) - dt;
  if (e.attackCd <= 0) {
    ai.windupTimer = EYE_WINDUP_SEC;
    ai.windupTargetId = target.id;
  }
  return true;
}

function updateShadowAmbushReadability(
  world: World,
  e: Entity,
  target: Entity,
  bestDist: number,
  dt: number,
  time: number,
  msgs: Msg[],
  playerId: number,
  state?: GameState,
): boolean {
  const ai = e.ai!;

  if (target.id === playerId &&
      ai.lastSeenTargetId !== playerId &&
      world.dist2(e.x, e.y, target.x, target.y) <= SHADOW_WARNING_RANGE_SQ &&
      shadowCanDarkAmbush(world, e, target)) {
    ai.lastSeenTargetId = playerId;
    msgs.push(msg('Теневик вышел из темного угла. Свет, шаг назад или широкий проход ломают рывок.', time, '#c8f'));
    publishMonsterReadabilityEvent(state, world, e, target, 'monster_sighted', 4, ['shadow', 'ambush', 'dark', 'warning'], {
      windupSec: SHADOW_WINDUP_SEC,
      counterplay: 'light_distance_or_open_space',
    });
  }

  if ((ai.windupTimer ?? 0) > 0) {
    ai.windupTimer = Math.max(0, (ai.windupTimer ?? 0) - dt);
    const interrupted = !target.alive ||
      bestDist > SHADOW_STRIKE_BREAK_RANGE ||
      ai.windupTargetId !== target.id ||
      shadowHasLightCounter(world, e, target);
    if (interrupted) {
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
      e.attackCd = Math.max(e.attackCd ?? 0, SHADOW_CANCEL_COOLDOWN);
      if (target.id === playerId) {
        msgs.push(msg('Теневик потерял рывок в свете или на дистанции.', time, '#ccf'));
        publishMonsterReadabilityEvent(state, world, e, target, 'monster_windup_interrupted', 3, ['shadow', 'ambush', 'interrupted', 'light'], {
          reason: shadowHasLightCounter(world, e, target) ? 'light' : 'distance',
          counterplay: 'keep_light_or_distance',
        });
      }
      return true;
    }
    if (ai.windupTimer > 0) return true;

    ai.windupTimer = undefined;
    ai.windupTargetId = undefined;
    return false;
  }

  if (bestDist < 1.2 && (e.attackCd ?? 0) <= 0 && shadowCanDarkAmbush(world, e, target)) {
    ai.windupTimer = SHADOW_WINDUP_SEC;
    ai.windupTargetId = target.id;
    if (target.id === playerId) {
      msgs.push(msg('Теневик готовит рывок из тени. Отступите в свет или за дистанцию.', time, '#c8f'));
    }
    return true;
  }

  return false;
}

/* ── Drop NPC inventory as ITEM_DROP entities ─────────────────── */
export function dropNpcInventory(e: Entity, entities: Entity[], nextId: { v: number }): void {
  if (!e.inventory || e.inventory.length === 0) return;
  for (const item of e.inventory) {
    if (!item || item.count <= 0) continue;
    entities.push({
      id: nextId.v++, type: EntityType.ITEM_DROP,
      x: e.x + (Math.random() - 0.5) * 0.5,
      y: e.y + (Math.random() - 0.5) * 0.5,
      angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
      inventory: [{ defId: item.defId, count: item.count, data: item.data }],
    });
  }
  e.inventory = [];
}

/* ── Monster AI update ────────────────────────────────────────── */
export function updateMonster(world: World, entities: Entity[], e: Entity, dt: number, time: number, msgs: Msg[], playerId: number, nextId: { v: number }, state?: GameState): void {
  const ai = e.ai!;

  // Матка: spawn a random monster every 60 real seconds (1 game hour)
  if (e.monsterKind === MonsterKind.MATKA) {
    e.matkaTimer = (e.matkaTimer ?? 60) - dt;
    if (e.matkaTimer <= 0) {
      e.matkaTimer = 60;
      let nearby = 0;
      getEntityIndex().queryRadius(e.x, e.y, 20, matkaChildrenQuery, ENTITY_MASK_MONSTER);
      for (const o of matkaChildrenQuery) {
        if (o.type === EntityType.MONSTER && o.alive && o.id !== e.id && world.dist2(e.x, e.y, o.x, o.y) < 400) nearby++;
      }
      if (nearby < MATKA_MAX_CHILDREN) {
        const spawnKinds = [MonsterKind.SBORKA, MonsterKind.TVAR, MonsterKind.ZOMBIE, MonsterKind.SHADOW, MonsterKind.POLZUN];
        const kind = spawnKinds[Math.floor(Math.random() * spawnKinds.length)];
        const def = MONSTERS[kind];
        const zid = world.zoneMap[world.idx(Math.floor(e.x), Math.floor(e.y))];
        const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 1) : 1;
        const rpg = randomRPG(zoneLevel);
        const hpBase = scaleMonsterHp(def.hp, zoneLevel);
        const hpFinal = Math.round(hpBase * (1 + 0.1 * rpg.str));
        const ox = (Math.random() - 0.5) * 2;
        const oy = (Math.random() - 0.5) * 2;
        const sx = ((e.x + ox) % W + W) % W;
        const sy = ((e.y + oy) % W + W) % W;
        if (!world.solid(Math.floor(sx), Math.floor(sy))) {
          entities.push({
            id: nextId.v++,
            type: EntityType.MONSTER,
            x: sx, y: sy,
            angle: Math.random() * Math.PI * 2,
            pitch: 0,
            alive: true,
            speed: scaleMonsterSpeed(def.speed, zoneLevel),
            sprite: def.sprite,

            hp: hpFinal, maxHp: hpFinal,
            monsterKind: kind,
            attackCd: def.attackRate,
            ai: { goal: AIGoal.HUNT, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
            rpg,
          });
          msgs.push(msg(`Матка родила ${def.name}!`, time, '#f4a'));
        }
      }
    }
  }

  let detectSq = monsterDetectSq(world, e, MONSTER_DETECT_SQ);
  let target: Entity | null;
  const zombieApocalypse = e.monsterKind === MonsterKind.ZOMBIE && isZombieApocalypseActive(state);
  if (zombieApocalypse) {
    target = findZombieApocalypseTarget(world, entities, e, dt, detectSq);
  } else if (hasAIFlag(e, 'documentHunter')) {
    target = findDocumentHunterTarget(world, entities, e, dt);
  } else if (hasAIFlag(e, 'closeReveal')) {
    target = findCombatTarget(world, entities, e, dt, detectSq, 1.25, canBeMonsterTarget);
  } else if (e.monsterKind === MonsterKind.KOSTOREZ) {
    detectSq = KOSTOREZ_DETECT_SQ;
    target = findCombatTarget(world, entities, e, dt, detectSq, deterministicScanCd(e.id, 0.7, 0.3), canBeMonsterTarget);
  } else {
    const scanCd = fixedScanCd(e) ?? deterministicScanCd(e.id, 1.0, 0.5);
    target = findCombatTarget(
      world, entities, e, dt,
      detectSq, scanCd,
      canBeMonsterTarget,
    );
  }

  // Prefer player only if player is closer than current target
  const player = _entityById.get(playerId);
  if (player?.alive && !(zombieApocalypse && target?.type === EntityType.NPC)) {
    const pd2 = world.dist2(e.x, e.y, player.x, player.y);
    const documentHunter = hasAIFlag(e, 'documentHunter');
    const playerHasDocs = documentHunter && hasDocumentLikeItem(player);
    const targetHasDocs = documentHunter && target !== null ? hasDocumentLikeItem(target) : false;
    const playerAllowed = !documentHunter ||
      playerHasDocs ||
      (!targetHasDocs && pd2 < PECHATEED_FALLBACK_SQ);
    if (playerAllowed && target && target.id !== playerId) {
      const td2 = world.dist2(e.x, e.y, target.x, target.y);
      if (pd2 < td2 && pd2 < Math.min(PREFER_SQ, detectSq)) { target = player; ai.combatTargetId = player.id; }
    } else if (playerAllowed && !target) {
      if (pd2 < detectSq) { target = player; ai.combatTargetId = player.id; }
    }
  }

  const def = e.monsterKind !== undefined ? MONSTERS[e.monsterKind] : null;

  if (tryFollowMonsterBait(world, e, target, dt, time, msgs, state)) return;

  if (!target) {
    if (e.monsterKind === MonsterKind.KOSTOREZ && ai.lastSeenTargetId === playerId) {
      publishKostorezEscape(world, e, player, playerId, state, 'lost_target');
    }
    // Immobile monsters (Idol) just idle — no wandering
    if (def?.speed === 0) return;
    ai.goal = AIGoal.WANDER;
    ai.combatTargetId = undefined;
    ai.timer -= dt;
    if (ai.path.length === 0 || ai.pi >= ai.path.length || ai.timer <= 0) {
      // Phasing monsters: random direction wander
      if (e.phasing) {
        ai.timer = 2 + Math.random() * 3;
        ai.wanderAngle = Math.random() * Math.PI * 2;
      } else {
        wanderNearby(world, e);
      }
      ai.timer = 1.5 + Math.random() * 2.5;
    }
    if (e.phasing) {
      const a = ai.wanderAngle ?? 0;
      const spd = e.speed * 0.4 * dt;
      e.x = ((e.x + Math.cos(a) * spd) % W + W) % W;
      e.y = ((e.y + Math.sin(a) * spd) % W + W) % W;
    } else {
      followMonsterPath(world, e, dt);
    }
    return;
  }
  ai.combatTargetId = target.id;

  const bestDist = Math.sqrt(world.dist2(e.x, e.y, target.x, target.y));

  if (e.monsterKind === MonsterKind.KOSTOREZ) {
    updateKostorez(world, entities, e, target, dt, time, msgs, playerId, nextId, state);
    return;
  }

  if (e.monsterKind === MonsterKind.SHADOW &&
      updateShadowAmbushReadability(world, e, target, bestDist, dt, time, msgs, playerId, state)) {
    return;
  }

  // Ranged attack: shoot projectile if in range but not too close
  // Immobile ranged monsters (Idol) fire at any distance within detection range
  const minRange = def?.speed === 0 ? 0 : 1.5;
  if (e.monsterKind === MonsterKind.EYE && def?.isRanged) {
    if (updateEyeRanged(world, entities, e, target, def, bestDist, dt, time, msgs, playerId, nextId, state)) return;
  } else if (def?.isRanged && bestDist < 15 && bestDist > minRange) {
    e.attackCd = (e.attackCd ?? 0) - dt;
    if (e.attackCd! <= 0) {
      fireMonsterProjectile(world, entities, e, target, def, nextId);
    }
    return;
  }

  // Melee attack if close enough
  if (bestDist < monsterMeleeRange(e)) {
    e.attackCd = (e.attackCd ?? 0) - dt;
    if (e.attackCd! <= 0) {
      const baseDmg = def?.dmg ?? 10;
      const level = e.rpg?.level ?? 1;
      const strMult = e.rpg ? strMeleeDmgMult(e.rpg) : 1;
      const rawDmg = Math.round(scaleMonsterDmg(baseDmg, level) * strMult * monsterDmgMult(world, e, target) * (e.monsterDmgMult ?? 1));
      const dmg = zhelemishIncomingMeleeDamage(target, time, rawDmg);
      if (tryZombieApocalypseInfection(world, e, target, state, msgs, time)) {
        const hitAng = Math.atan2(target.y - e.y, target.x - e.x);
        spawnBloodHit(world, target.x, target.y, hitAng, Math.max(2, Math.round(dmg * 0.35)), false);
        playSoundAt(playGrowl, e.x, e.y);
        e.attackCd = def?.attackRate ?? 1;
        return;
      }
      if (target.hp !== undefined) {
        const debugImmortalPlayerHit = target.id === playerId && isDebugOnePunchManEnabled();
        if (debugImmortalPlayerHit) {
          keepDebugOnePunchManAlive(target);
        } else {
          target.hp -= dmg;
          if (target.id === playerId) recordPlayerDamage(state, e, dmg, `${entityDisplayName(e)} задел тебя: -${dmg}`);
          if (target.hp <= 0) { target.alive = false; target.hp = 0; }
          const hitAng = Math.atan2(target.y - e.y, target.x - e.x);
          spawnBloodHit(world, target.x, target.y, hitAng, dmg, target.type === EntityType.MONSTER);
          if (target.hp <= 0) {
            spawnDeathPool(world, target.x, target.y, target.type === EntityType.MONSTER);
            if (target.type === EntityType.NPC) dropNpcInventory(target, entities, nextId);
            msgs.push(msg(`${entityDisplayName(e)} убил ${entityDisplayName(target)}`, time, '#f44'));
          }
        }
      }
      playSoundAt(playGrowl, e.x, e.y);
      e.attackCd = def?.attackRate ?? 1;
    }
    return;
  }

  // Immobile monsters don't pathfind or melee — only ranged
  if (def?.speed === 0) return;

  // Hunt: pathfind to target
  ai.timer -= dt;
  if (ai.path.length === 0 || ai.timer <= 0) {
    tryAssignPathToCell(world, e, Math.floor(target.x), Math.floor(target.y));
    ai.timer = 2;
  }

  // Phasing monsters (Spirit) move directly through walls
  if (e.phasing) {
    const ddx = world.delta(e.x, target.x);
    const ddy = world.delta(e.y, target.y);
    const dd = Math.sqrt(ddx * ddx + ddy * ddy);
    if (dd > 0.1) {
      const spd = e.speed * dt;
      e.x = ((e.x + (ddx / dd) * spd) % W + W) % W;
      e.y = ((e.y + (ddy / dd) * spd) % W + W) % W;
    }
    return;
  }

  followMonsterPath(world, e, dt);
}

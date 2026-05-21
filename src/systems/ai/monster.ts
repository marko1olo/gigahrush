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
import {
  playGrowl,
  playHostileEnergyShot,
  playHostileEyeShot,
  playHostileFlame,
  playHostileParagraphShot,
  playHostilePsiCast,
  playSoundAt,
} from '../audio';
import { isHostile } from '../factions';
import { scaleMonsterDmg, strMeleeDmgMult, scaleMonsterHp, scaleMonsterSpeed, randomRPG } from '../rpg';
import { zhelemishIncomingMeleeDamage } from '../status';
import { spawnBloodHit, spawnDeathPool } from '../../render/blood';
import { followPath, tryAssignPathToCell, wanderNearby } from './pathfinding';
import { Spr } from '../../render/sprite_index';
import { publishEvent } from '../events';
import { recordPlayerDamage } from '../damage';
import { findNoiseInvestigationTarget } from '../noise';
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
import { canSpawnEntityType, entitySpawnSlots } from '../entity_limits';

/* ── Shared combat target finder ──────────────────────────────── */
const MONSTER_DETECT = 20;
const MONSTER_MELEE_DETECT = 30;
const MONSTER_DETECT_SQ = MONSTER_DETECT * MONSTER_DETECT;
const MONSTER_MELEE_DETECT_SQ = MONSTER_MELEE_DETECT * MONSTER_MELEE_DETECT;
const IMMEDIATE_THREAT_RADIUS_SQ = 10 * 10;
const PREFER_PLAYER = 15;
const PREFER_SQ = PREFER_PLAYER * PREFER_PLAYER;
const MATKA_MAX_CHILDREN = 100;
const PECHATEED_DETECT_SQ = 24 * 24;
const PECHATEED_FALLBACK_SQ = 10 * 10;
const DEBRIS_LURKER_COVER_DETECT_SQ = 22 * 22;
const DEBRIS_LURKER_EXPOSED_DETECT_SQ = 12 * 12;
const NELYUD_REVEAL_SQ = 6 * 6;
const KOSTOREZ_DETECT_SQ = MONSTER_MELEE_DETECT_SQ;
const KOSTOREZ_WINDUP_RANGE = 2.25;
const KOSTOREZ_BURST_RANGE = 2.85;
const KOSTOREZ_WINDUP_SEC = 1.35;
const KOSTOREZ_STAGGER_SEC = 1.15;
const KOSTOREZ_ESCAPE_DIST = 4.0;
const SAFEGUARD_DETECT_SQ = MONSTER_MELEE_DETECT_SQ;
const SAFEGUARD_WINDUP_RANGE = 2.1;
const SAFEGUARD_BURST_RANGE = 2.6;
const SAFEGUARD_WINDUP_SEC = 0.85;
const SAFEGUARD_STAGGER_SEC = 0.9;
const SAFEGUARD_ESCAPE_DIST = 4.4;
const EYE_MIN_RANGE = 1.5;
const EYE_WINDUP_SEC = 0.85;
const RANGED_SHOT_RANGE = 15;
const RANGED_LOS_BREAK_COOLDOWN = 0.75;
const PARAGRAPH_WINDUP_SEC = 0.8;
const IDOL_WINDUP_SEC = 1.05;
const ROBOT_WINDUP_SEC = 0.62;
const HEAVY_RANGED_WINDUP_SEC = 0.95;
const GENERIC_RANGED_WINDUP_SEC = 0.7;
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
const SAFEGUARD_RUMOR_IDS = [
  'monster_safeguard_access_denied',
  'ecology_safeguard_windup',
  'ecology_safeguard_shotgun',
] as const;
const EYE_RUMOR_IDS = ['monster_eye_lamps', 'ecology_eye_line'] as const;
const PARAGRAPH_RUMOR_IDS = ['ecology_paragraph_clause'] as const;
const IDOL_RUMOR_IDS = ['monster_idol_static', 'ecology_idol_stares'] as const;
const ROBOT_RUMOR_IDS = ['ecology_robot_plasma'] as const;
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

interface BladeEliteTuning {
  kind: MonsterKind.KOSTOREZ | MonsterKind.SAFEGUARD;
  tag: string;
  rumorIds: readonly string[];
  windupRange: number;
  burstRange: number;
  windupSec: number;
  staggerSec: number;
  escapeDist: number;
  coverBlocks: boolean;
  sightMsg: string;
  windupMsg: string;
  staggerMsg: string;
  strikeVerb: string;
  counterplay: string;
}

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

function bladeEliteTuning(kind: MonsterKind | undefined): BladeEliteTuning | undefined {
  switch (kind) {
    case MonsterKind.KOSTOREZ:
      return {
        kind,
        tag: 'kostorez',
        rumorIds: KOSTOREZ_RUMOR_IDS,
        windupRange: KOSTOREZ_WINDUP_RANGE,
        burstRange: KOSTOREZ_BURST_RANGE,
        windupSec: KOSTOREZ_WINDUP_SEC,
        staggerSec: KOSTOREZ_STAGGER_SEC,
        escapeDist: KOSTOREZ_ESCAPE_DIST,
        coverBlocks: false,
        sightMsg: 'Косторез увидел тебя. Держи дистанцию: замах читается.',
        windupMsg: 'Косторез заносит пилы. Отходи за угол или бей дробью!',
        staggerMsg: 'Дробь сбила замах Костореза.',
        strikeVerb: 'режет',
        counterplay: 'distance, obstacle, shotgun stagger, metal_sheet armor',
      };
    case MonsterKind.SAFEGUARD:
      return {
        kind,
        tag: 'safeguard',
        rumorIds: SAFEGUARD_RUMOR_IDS,
        windupRange: SAFEGUARD_WINDUP_RANGE,
        burstRange: SAFEGUARD_BURST_RANGE,
        windupSec: SAFEGUARD_WINDUP_SEC,
        staggerSec: SAFEGUARD_STAGGER_SEC,
        escapeDist: SAFEGUARD_ESCAPE_DIST,
        coverBlocks: true,
        sightMsg: 'Сейфгард взял тебя в отказ. Ломай линию: белый замах короткий.',
        windupMsg: 'Сейфгард разводит клинки. За дверь, аппарат или дробью!',
        staggerMsg: 'Дробь сбила белый замах Сейфгарда.',
        strikeVerb: 'режет',
        counterplay: 'line break by wall, door, machine, apparatus; shotgun stagger',
      };
    default:
      return undefined;
  }
}

function bladeEliteEventData(tuning: BladeEliteTuning, extra?: Record<string, unknown>): Record<string, unknown> {
  return { rumorIds: [...tuning.rumorIds], ...extra };
}

function monsterReadabilityRumorIds(kind: MonsterKind | undefined): readonly string[] {
  switch (kind) {
    case MonsterKind.EYE: return EYE_RUMOR_IDS;
    case MonsterKind.PARAGRAPH: return PARAGRAPH_RUMOR_IDS;
    case MonsterKind.IDOL: return IDOL_RUMOR_IDS;
    case MonsterKind.ROBOT: return ROBOT_RUMOR_IDS;
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

function publishBladeEliteEvent(
  tuning: BladeEliteTuning,
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
    monsterKind: tuning.kind,
    severity,
    privacy: target?.type === EntityType.PLAYER ? 'local' : 'witnessed',
    tags: ['monster', tuning.tag, ...tags],
    data: bladeEliteEventData(tuning, data),
  });
}

function isLineOfFireCover(feature: Feature): boolean {
  return feature === Feature.SHELF ||
    feature === Feature.MACHINE ||
    feature === Feature.APPARATUS ||
    feature === Feature.DESK ||
    feature === Feature.TABLE;
}

function traceClearLine(world: World, e: Entity, target: Entity, maxDist: number, coverBlocks: boolean): boolean {
  const dx = world.delta(e.x, target.x);
  const dy = world.delta(e.y, target.y);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxDist) return false;
  const steps = Math.max(2, Math.ceil(dist * 2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = Math.floor(world.wrap(e.x + dx * t));
    const y = Math.floor(world.wrap(e.y + dy * t));
    if (world.solid(x, y)) return false;
    if (coverBlocks && isLineOfFireCover(world.features[world.idx(x, y)] as Feature)) return false;
  }
  return true;
}

function hasClearLine(world: World, e: Entity, target: Entity, maxDist: number): boolean {
  return traceClearLine(world, e, target, maxDist, false);
}

export function hasClearLineOfFire(world: World, e: Entity, target: Entity, maxDist: number): boolean {
  return traceClearLine(world, e, target, maxDist, true);
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

  if (!target && ai.combatScanCd! > 0) {
    target = findImmediateCombatTarget(world, e, Math.min(rangeSq, IMMEDIATE_THREAT_RADIUS_SQ), typeFilter);
    if (target) {
      ai.combatTargetId = target.id;
      ai.goal = AIGoal.HUNT;
      ai.combatScanCd = Math.min(ai.combatScanCd!, 0.15);
      return target;
    }
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

function findImmediateCombatTarget(
  world: World,
  e: Entity,
  rangeSq: number,
  typeFilter: (other: Entity) => boolean,
): Entity | null {
  let target: Entity | null = null;
  let best = rangeSq;
  getEntityIndex().queryRadius(e.x, e.y, Math.sqrt(rangeSq), combatQuery, ENTITY_MASK_ACTOR);
  for (const other of combatQuery) {
    if (!other.alive || other.id === e.id) continue;
    if (!typeFilter(other)) continue;
    if (!isHostile(e, other)) continue;
    const d2 = world.dist2(e.x, e.y, other.x, other.y);
    if (d2 >= best) continue;
    best = d2;
    target = other;
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

function tryFollowNoise(
  world: World,
  e: Entity,
  dt: number,
  time: number,
  state?: GameState,
): boolean {
  const noise = findNoiseInvestigationTarget(world, state, e, time);
  if (!noise) return false;

  const ai = e.ai!;
  ai.goal = AIGoal.HUNT;
  ai.combatTargetId = undefined;
  const tx = Math.floor(noise.x);
  const ty = Math.floor(noise.y);
  ai.timer -= dt;
  if (ai.path.length === 0 || ai.timer <= 0 || ai.tx !== world.wrap(tx) || ai.ty !== world.wrap(ty)) {
    tryAssignPathToCell(world, e, tx, ty);
    ai.timer = 1.25;
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

function bladeEliteHasLine(world: World, e: Entity, target: Entity, tuning: BladeEliteTuning): boolean {
  return tuning.coverBlocks
    ? hasClearLineOfFire(world, e, target, tuning.burstRange)
    : hasClearLine(world, e, target, tuning.burstRange);
}

function publishBladeEliteEscape(
  tuning: BladeEliteTuning,
  world: World,
  e: Entity,
  target: Entity | undefined,
  playerId: number,
  state: GameState | undefined,
  reason: string,
): void {
  const ai = e.ai!;
  if (target?.id !== playerId && ai.lastSeenTargetId !== playerId) return;
  publishBladeEliteEvent(tuning, state, world, e, target, 'monster_escaped', 4, ['escaped'], { reason });
  ai.lastSeenTargetId = undefined;
}

function finishBladeEliteWindup(
  tuning: BladeEliteTuning,
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
  const def = MONSTERS[tuning.kind];
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
      if (target.id === playerId) recordPlayerDamage(state, e, dmg, `${entityDisplayName(e)} ${tuning.strikeVerb} тебя: -${dmg}`);
      if (target.hp <= 0) {
        target.alive = false;
        target.hp = 0;
      }
      const hitAng = Math.atan2(target.y - e.y, target.x - e.x);
      spawnBloodHit(world, target.x, target.y, hitAng, dmg, target.type === EntityType.MONSTER);
      const targetLabel = target.type === EntityType.PLAYER ? 'тебя' : entityDisplayName(target);
      msgs.push(msg(
        armorCut
          ? `${entityDisplayName(e)} срезал бронелист и задел ${targetLabel}: -${dmg}`
          : `${entityDisplayName(e)} ${tuning.strikeVerb} ${targetLabel}: -${dmg}`,
        time,
        armorCut ? '#fc4' : '#f44',
      ));
      publishBladeEliteEvent(tuning, state, world, e, target, 'monster_armor_cut', armorCut ? 5 : 4, ['hit', armorCut ? 'armor_cut' : 'burst'], {
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

function updateBladeElite(
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
  const tuning = bladeEliteTuning(e.monsterKind);
  if (!tuning) return false;
  const ai = e.ai!;
  const dist = Math.sqrt(world.dist2(e.x, e.y, target.x, target.y));

  if (target.id === playerId && ai.lastSeenTargetId !== playerId) {
    ai.lastSeenTargetId = playerId;
    publishBladeEliteEvent(tuning, state, world, e, target, 'monster_sighted', 4, ['sighted', 'warning'], {
      counterplay: tuning.counterplay,
    });
    msgs.push(msg(tuning.sightMsg, time, '#fa4'));
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

    if (!target.alive || dist > tuning.burstRange || !bladeEliteHasLine(world, e, target, tuning)) {
      publishBladeEliteEscape(tuning, world, e, target, playerId, state, dist > tuning.burstRange ? 'distance' : 'obstacle');
      msgs.push(msg(`${entityDisplayName(e)} промахнулся: цель вышла из замаха.`, time, '#fc4'));
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
      e.spriteScale = undefined;
      e.attackCd = 0.75;
      return true;
    }

    if (ai.windupTimer <= 0) finishBladeEliteWindup(tuning, world, entities, e, target, time, msgs, nextId, state, playerId);
    return true;
  }

  if (dist <= tuning.windupRange && e.attackCd <= 0 && bladeEliteHasLine(world, e, target, tuning)) {
    ai.windupTimer = tuning.windupSec;
    ai.windupTargetId = target.id;
    e.spriteScale = 1.18;
    msgs.push(msg(tuning.windupMsg, time, '#fa4'));
    playSoundAt(playGrowl, e.x, e.y);
    return true;
  }

  if (dist > tuning.escapeDist) ai.windupTargetId = undefined;
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
  if (monster.type !== EntityType.MONSTER || !monster.ai) return false;
  const tuning = bladeEliteTuning(monster.monsterKind);
  if (!tuning) return false;
  if ((monster.hp ?? 1) <= 0) return false;
  if (projectile.ownerId !== playerId || projectile.sprite !== Spr.PELLET) return false;

  const ai = monster.ai;
  const wasWindup = (ai.windupTimer ?? 0) > 0;
  ai.staggerTimer = Math.max(ai.staggerTimer ?? 0, tuning.staggerSec);
  ai.windupTimer = undefined;
  ai.windupTargetId = undefined;
  monster.attackCd = Math.max(monster.attackCd ?? 0, 0.95);
  monster.spriteScale = 0.95;

  if (wasWindup) {
    const target = ai.combatTargetId !== undefined ? _entityById.get(ai.combatTargetId) : undefined;
    publishBladeEliteEvent(tuning, state, world, monster, target, 'monster_windup_interrupted', 4, ['windup', 'interrupted', 'shotgun'], {
      reason: 'shotgun_stagger',
    });
    state.msgs.push(msg(tuning.staggerMsg, state.time, '#4f4'));
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
  const sprite = def.projSprite || Spr.EYE_BOLT;
  entities.push({
    id: nextId.v++,
    type: EntityType.PROJECTILE,
    x: world.wrap(e.x + cos * 0.5),
    y: world.wrap(e.y + sin * 0.5),
    angle: ang,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite,
    vx: cos * spd,
    vy: sin * spd,
    projDmg: dmg,
    projLife: 3.0,
    ownerId: e.id,
    spriteScale: monsterProjectileScale(e.monsterKind, sprite),
    spriteZ: 0.5,
    projGore: sprite === Spr.PARAGRAPH_BOLT ? 1 : 2,
  });
  playSoundAt(monsterProjectileSound(e.monsterKind, sprite), e.x, e.y);
  e.attackCd = def.attackRate ?? 2;
}

function monsterProjectileScale(kind: MonsterKind | undefined, sprite: number): number {
  if (sprite === Spr.PARAGRAPH_BOLT) return 0.34;
  if (sprite === Spr.HOSTILE_FLAME_BOLT) return 0.52;
  if (sprite === Spr.HOSTILE_PLASMA_BOLT) return 0.34;
  if (kind === MonsterKind.IDOL) return 0.4;
  return 0.3;
}

function monsterProjectileSound(kind: MonsterKind | undefined, sprite: number): () => void {
  if (kind === MonsterKind.EYE || sprite === Spr.EYE_BOLT) return playHostileEyeShot;
  if (kind === MonsterKind.PARAGRAPH || sprite === Spr.PARAGRAPH_BOLT) return playHostileParagraphShot;
  if (sprite === Spr.HOSTILE_FLAME_BOLT) return playHostileFlame;
  if (sprite === Spr.HOSTILE_PLASMA_BOLT) return playHostileEnergyShot;
  if (sprite === Spr.HOSTILE_PSI_BOLT) return playHostilePsiCast;
  return playGrowl;
}

function rangedMonsterWindupSec(kind: MonsterKind | undefined): number {
  switch (kind) {
    case MonsterKind.EYE: return EYE_WINDUP_SEC;
    case MonsterKind.PARAGRAPH: return PARAGRAPH_WINDUP_SEC;
    case MonsterKind.IDOL: return IDOL_WINDUP_SEC;
    case MonsterKind.ROBOT: return ROBOT_WINDUP_SEC;
    case MonsterKind.MANCOBUS:
    case MonsterKind.HERALD:
    case MonsterKind.CREATOR:
      return HEAVY_RANGED_WINDUP_SEC;
    default: return GENERIC_RANGED_WINDUP_SEC;
  }
}

function rangedMonsterMinRange(kind: MonsterKind | undefined): number {
  if (kind === MonsterKind.IDOL) return 1.25;
  return EYE_MIN_RANGE;
}

function rangedMonsterColor(kind: MonsterKind | undefined): string {
  switch (kind) {
    case MonsterKind.EYE: return '#cf6';
    case MonsterKind.PARAGRAPH: return '#f6c';
    case MonsterKind.IDOL: return '#c8f';
    case MonsterKind.ROBOT: return '#6cf';
    default: return '#fc6';
  }
}

function rangedMonsterTag(kind: MonsterKind | undefined): string {
  return kind === undefined ? 'ranged' : MonsterKind[kind].toLowerCase();
}

function rangedMonsterWindupMessage(kind: MonsterKind | undefined, name: string): string {
  switch (kind) {
    case MonsterKind.EYE: return 'Глаз разогревает зелёную линию огня. Угол, дверь или шкаф сорвут выстрел.';
    case MonsterKind.PARAGRAPH: return 'Параграф дописывает прямую строку. Ломайте видимость или врывайтесь после залпа.';
    case MonsterKind.IDOL: return 'Идол собирает ПСИ-луч. Стена, дверь или упорный заход гасят источник.';
    case MonsterKind.ROBOT: return 'Робот раскручивает плазму. Сойдите с линии и бейте после вспышки.';
    default: return `${name} целится по прямой. Укрытие или угол ломают линию огня.`;
  }
}

function rangedMonsterSightMessage(kind: MonsterKind | undefined, name: string): string {
  switch (kind) {
    case MonsterKind.EYE: return 'Глаз держит прямую линию. Зеленый разогрев читается до выстрела.';
    case MonsterKind.PARAGRAPH: return 'Параграф заметил вас: его пункт летит только по видимой прямой.';
    case MonsterKind.IDOL: return 'Идол не двигается: режьте угол и входите в упор между ПСИ-залпами.';
    case MonsterKind.ROBOT: return 'Робот взял линию плазмы. После залпа у него есть пауза.';
    default: return `${name} держит линию огня. Выстрел будет с разогревом.`;
  }
}

function rangedMonsterInterruptedMessage(kind: MonsterKind | undefined, reason: string): string {
  if (reason === 'range') return 'Дистанция сломала выстрел: источник потерял линию.';
  switch (kind) {
    case MonsterKind.EYE: return 'Выстрел Глаза сорвался о стену или укрытие. Держите угол до вспышки.';
    case MonsterKind.PARAGRAPH: return 'Пункт Параграфа уперся в укрытие. Сейчас можно сближаться.';
    case MonsterKind.IDOL: return 'ПСИ-луч Идола погас за геометрией. Источник открыт для захода.';
    case MonsterKind.ROBOT: return 'Плазменная линия Робота сорвалась. Пауза короткая, сближайтесь.';
    default: return 'Линия огня сорвана укрытием или углом.';
  }
}

function updateReadableMonsterRanged(
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
  const shotRange = RANGED_SHOT_RANGE;
  const minRange = rangedMonsterMinRange(e.monsterKind);
  const windupSec = rangedMonsterWindupSec(e.monsterKind);
  const inShotRange = bestDist < shotRange && bestDist > minRange;
  const currentTarget = ai.windupTargetId === undefined || ai.windupTargetId === target.id;

  if ((ai.windupTimer ?? 0) > 0) {
    ai.windupTimer = Math.max(0, (ai.windupTimer ?? 0) - dt);
    const lineClear = currentTarget && inShotRange && target.alive && hasClearLineOfFire(world, e, target, shotRange);
    if (!lineClear) {
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
      e.spriteScale = undefined;
      e.attackCd = Math.max(e.attackCd ?? 0, RANGED_LOS_BREAK_COOLDOWN);
      if (target.id === playerId) {
        const reason = !inShotRange ? 'range' : 'line_of_sight';
        msgs.push(msg(rangedMonsterInterruptedMessage(e.monsterKind, reason), time, '#9cf'));
        publishMonsterReadabilityEvent(state, world, e, target, 'monster_windup_interrupted', 3, [rangedMonsterTag(e.monsterKind), 'windup', 'line_of_sight', 'interrupted'], {
          reason,
          counterplay: 'break_line_before_bolt',
        });
      }
      return true;
    }

    const dx = world.delta(e.x, target.x);
    const dy = world.delta(e.y, target.y);
    e.angle = Math.atan2(dy, dx);
    e.spriteScale = 1.05 + Math.max(0, ai.windupTimer / windupSec) * 0.12;
    if (ai.windupTimer <= 0) {
      fireMonsterProjectile(world, entities, e, target, def, nextId);
      ai.windupTimer = undefined;
      ai.windupTargetId = undefined;
      e.spriteScale = undefined;
    }
    return true;
  }

  if (!inShotRange) return false;
  if (!hasClearLineOfFire(world, e, target, shotRange)) return false;

  if (target.id === playerId && ai.lastSeenTargetId !== playerId) {
    ai.lastSeenTargetId = playerId;
    msgs.push(msg(rangedMonsterSightMessage(e.monsterKind, entityDisplayName(e)), time, rangedMonsterColor(e.monsterKind)));
    publishMonsterReadabilityEvent(state, world, e, target, 'monster_sighted', 4, [rangedMonsterTag(e.monsterKind), 'ranged', 'line_of_sight', 'warning'], {
      windupSec,
      counterplay: 'corner_or_door_breaks_line',
    });
  }

  e.attackCd = (e.attackCd ?? 0) - dt;
  if (e.attackCd <= 0) {
    ai.windupTimer = windupSec;
    ai.windupTargetId = target.id;
    e.spriteScale = 1.14;
    if (target.id === playerId) {
      msgs.push(msg(rangedMonsterWindupMessage(e.monsterKind, entityDisplayName(e)), time, rangedMonsterColor(e.monsterKind)));
      playSoundAt(playGrowl, e.x, e.y);
    }
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
  const slots = entitySpawnSlots(entities, EntityType.ITEM_DROP, e.inventory.length);
  let dropped = 0;
  for (const item of e.inventory) {
    if (dropped >= slots) break;
    if (!item || item.count <= 0) continue;
    entities.push({
      id: nextId.v++, type: EntityType.ITEM_DROP,
      x: e.x + (Math.random() - 0.5) * 0.5,
      y: e.y + (Math.random() - 0.5) * 0.5,
      angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
      inventory: [{ defId: item.defId, count: item.count, data: item.data }],
    });
    dropped++;
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
      if (nearby < MATKA_MAX_CHILDREN && canSpawnEntityType(entities, EntityType.MONSTER)) {
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

  const def = e.monsterKind !== undefined ? MONSTERS[e.monsterKind] : null;
  const baseDetectSq = def && !def.isRanged && def.speed > 0 ? MONSTER_MELEE_DETECT_SQ : MONSTER_DETECT_SQ;
  let detectSq = monsterDetectSq(world, e, baseDetectSq);
  let target: Entity | null;
  const zombieApocalypse = e.monsterKind === MonsterKind.ZOMBIE && isZombieApocalypseActive(state);
  if (zombieApocalypse) {
    target = findZombieApocalypseTarget(world, entities, e, dt, detectSq);
  } else if (hasAIFlag(e, 'documentHunter')) {
    target = findDocumentHunterTarget(world, entities, e, dt);
  } else if (hasAIFlag(e, 'closeReveal')) {
    target = findCombatTarget(world, entities, e, dt, detectSq, 1.25, canBeMonsterTarget);
  } else if (e.monsterKind === MonsterKind.KOSTOREZ || e.monsterKind === MonsterKind.SAFEGUARD) {
    detectSq = e.monsterKind === MonsterKind.SAFEGUARD ? SAFEGUARD_DETECT_SQ : KOSTOREZ_DETECT_SQ;
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
      if (pd2 < td2 && pd2 < Math.min(PREFER_SQ, detectSq)) { target = player; ai.combatTargetId = player.id; ai.goal = AIGoal.HUNT; }
    } else if (playerAllowed && !target) {
      if (pd2 < detectSq) { target = player; ai.combatTargetId = player.id; ai.goal = AIGoal.HUNT; }
    }
  }

  if (tryFollowMonsterBait(world, e, target, dt, time, msgs, state)) return;

  if (!target) {
    if (tryFollowNoise(world, e, dt, time, state)) return;
    const tuning = bladeEliteTuning(e.monsterKind);
    if (tuning && ai.lastSeenTargetId === playerId) {
      publishBladeEliteEscape(tuning, world, e, player, playerId, state, 'lost_target');
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
  ai.goal = AIGoal.HUNT;

  const bestDist = Math.sqrt(world.dist2(e.x, e.y, target.x, target.y));

  if (bladeEliteTuning(e.monsterKind)) {
    updateBladeElite(world, entities, e, target, dt, time, msgs, playerId, nextId, state);
    return;
  }

  if (e.monsterKind === MonsterKind.SHADOW &&
      updateShadowAmbushReadability(world, e, target, bestDist, dt, time, msgs, playerId, state)) {
    return;
  }

  // Ranged monsters telegraph, require a clear toroidal line of fire, and can be denied by cover.
  if (def?.isRanged && updateReadableMonsterRanged(world, entities, e, target, def, bestDist, dt, time, msgs, playerId, nextId, state)) return;

  // Immobile monsters don't pathfind or melee: once their line/source is denied, they are disabled until it opens again.
  if (def?.speed === 0) return;

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

import {
  AIGoal,
  Cell,
  EntityType,
  Faction,
  Feature,
  MonsterKind,
  Occupation,
  RoomType,
  Tex,
  W,
  type Entity,
  type Room,
} from '../../core/types';
import { freshNeeds, randomName } from '../../data/catalog';
import { PROCEDURAL_POPULATION_PROFILES } from '../../data/population_profiles';
import { floorRunZAllowsNpcs } from '../../data/procedural_floors';
import { MONSTERS } from '../../entities/monster';
import { HEAD_SLUG_HOSTED_STAGE } from '../../entities/head_slug';
import { monsterSpr } from '../../render/sprite_index';
import { canSpawnEntityType, entitySpawnSlots } from '../../systems/entity_limits';
import { gaussianLevel, getMaxHp, randomRPG } from '../../systems/rpg';
import {
  addItemDrop,
  pick,
  randomFloorCell,
  randomRoomCell,
  roomCenter,
  type ProceduralAnomalyGenContext,
} from './common';

const CROWD_OCCUPATIONS = [
  Occupation.HOUSEWIFE,
  Occupation.LOCKSMITH,
  Occupation.COOK,
  Occupation.TURNER,
  Occupation.MECHANIC,
  Occupation.STOREKEEPER,
  Occupation.ALCOHOLIC,
  Occupation.CHILD,
  Occupation.TRAVELER,
] as const;

const CROWD_BUCKET_SIZE = 32;
const CROWD_BUCKET_CAP = 20;

function crowdCount(ctx: ProceduralAnomalyGenContext): number {
  return entitySpawnSlots(ctx.entities, EntityType.NPC, PROCEDURAL_POPULATION_PROFILES.highDensity.npcs.cap);
}

function crowdRooms(rooms: readonly Room[]): Room[] {
  return rooms.filter(room => (
    room.w >= 4 &&
    room.h >= 4 &&
    room.type !== RoomType.BATHROOM &&
    room.type !== RoomType.STORAGE
  ));
}

function chooseOutbreakRoom(ctx: ProceduralAnomalyGenContext, rooms: readonly Room[]): Room | null {
  const sx = Math.floor(ctx.spawnX);
  const sy = Math.floor(ctx.spawnY);
  const candidates = rooms
    .filter(room => room.w * room.h >= 54)
    .map(room => ({ room, d2: ctx.world.dist2(sx, sy, roomCenter(room).x, roomCenter(room).y) }))
    .filter(item => item.d2 > 42 * 42)
    .sort((a, b) => b.d2 - a.d2);
  if (candidates.length === 0) return rooms[0] ?? null;
  return candidates[Math.floor(Math.random() * Math.min(candidates.length, 18))].room;
}

function chooseMedicalSlugRoom(rooms: readonly Room[]): Room | null {
  const candidates = rooms.filter(room => room.type === RoomType.MEDICAL && room.w * room.h >= 30);
  return candidates.length > 0 ? pick(candidates) : null;
}

function crowdBucketIndex(x: number, y: number): number {
  const side = Math.ceil(W / CROWD_BUCKET_SIZE);
  const bx = Math.min(side - 1, Math.max(0, Math.floor(x / CROWD_BUCKET_SIZE)));
  const by = Math.min(side - 1, Math.max(0, Math.floor(y / CROWD_BUCKET_SIZE)));
  return by * side + bx;
}

function buildCrowdBucketCounts(entities: readonly Entity[]): Int32Array {
  const side = Math.ceil(W / CROWD_BUCKET_SIZE);
  const counts = new Int32Array(side * side);
  for (const entity of entities) {
    if (!entity.alive || entity.type !== EntityType.NPC) continue;
    counts[crowdBucketIndex(entity.x, entity.y)]++;
  }
  return counts;
}

function freeCrowdCell(ctx: ProceduralAnomalyGenContext, room: Room, occupied: Set<number>, bucketCounts: Int32Array): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 36; attempt++) {
    const pos = randomRoomCell(ctx.world, room, false);
    if (!pos) continue;
    if (ctx.world.dist2(ctx.spawnX, ctx.spawnY, pos.x + 0.5, pos.y + 0.5) < 8 * 8) continue;
    const ci = ctx.world.idx(pos.x, pos.y);
    if (occupied.has(ci)) continue;
    if (ctx.world.cells[ci] !== Cell.FLOOR) continue;
    const bucket = crowdBucketIndex(pos.x + 0.5, pos.y + 0.5);
    if (bucketCounts[bucket] >= CROWD_BUCKET_CAP) continue;
    occupied.add(ci);
    bucketCounts[bucket]++;
    return pos;
  }
  return null;
}

function spawnCrowdNpc(ctx: ProceduralAnomalyGenContext, room: Room, occupied: Set<number>, bucketCounts: Int32Array, order: number, active: boolean): boolean {
  const pos = freeCrowdCell(ctx, room, occupied, bucketCounts);
  if (!pos) return false;
  const ci = ctx.world.idx(pos.x, pos.y);
  const zoneLevel = ctx.world.zones[ctx.world.zoneMap[ci]]?.level ?? ctx.spec.danger;
  const rpg = active ? randomRPG(gaussianLevel(zoneLevel, 2)) : undefined;
  const hp = rpg ? getMaxHp(rpg) : 38 + Math.floor(Math.random() * 24);
  const nm = randomName(Faction.CITIZEN);
  const occupation = pick(CROWD_OCCUPATIONS);
  const child = occupation === Occupation.CHILD;

  const npc: Entity = {
    id: ctx.nextId.v++,
    type: EntityType.NPC,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: child ? 0.82 : 1.05 + Math.random() * 0.18,
    sprite: occupation,
    spriteSeed: (ctx.spec.seed ^ Math.imul(order + 1, 0x45d9f3b)) >>> 0,
    name: nm.name,
    isFemale: nm.female,
    hp,
    maxHp: hp,
    money: Math.floor(Math.random() * 35),
    faction: Faction.CITIZEN,
    occupation,
    questId: -1,
    inventory: Math.random() < 0.16
      ? [{ defId: Math.random() < 0.5 ? 'bread' : 'cigs', count: 1 }]
      : [],
  };

  if (active) {
    npc.needs = freshNeeds();
    npc.ai = {
      goal: AIGoal.IDLE,
      tx: pos.x,
      ty: pos.y,
      path: [],
      pi: 0,
      stuck: 0,
      timer: Math.random() * 2,
      combatScanCd: Math.random() * 1.5,
    };
    npc.rpg = rpg;
  }

  ctx.entities.push(npc);
  return true;
}

function markOutbreakRoom(ctx: ProceduralAnomalyGenContext, room: Room): void {
  room.name = `Очаг ноль: ${room.name}`;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const x = ctx.world.wrap(room.x + dx);
      const y = ctx.world.wrap(room.y + dy);
      const ci = ctx.world.idx(x, y);
      if (ctx.world.cells[ci] !== Cell.FLOOR) continue;
      if (((dx * 17 + dy * 31 + ctx.spec.seed) & 7) === 0) {
        ctx.world.floorTex[ci] = Tex.F_TILE;
        ctx.world.stamp(x, y, 0.5, 0.5, 0.36, 0.54, ctx.spec.seed + dx * 101 + dy * 37, 92, 24, 20, false);
      }
      if (ctx.world.features[ci] === Feature.LAMP && Math.random() < 0.55) ctx.world.features[ci] = Feature.NONE;
      ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], 18 + ctx.spec.danger * 6);
    }
  }
  ctx.world.markFogDirty();
}

function spawnPatientZero(ctx: ProceduralAnomalyGenContext, room: Room): void {
  if (!canSpawnEntityType(ctx.entities, EntityType.MONSTER)) return;
  const pos = randomRoomCell(ctx.world, room, false) ??
    randomFloorCell(ctx.world, ctx.spawnX, ctx.spawnY, 36 * 36) ??
    { x: Math.floor(ctx.spawnX), y: Math.floor(ctx.spawnY) };
  const def = MONSTERS[MonsterKind.ZOMBIE];
  const ci = ctx.world.idx(pos.x, pos.y);
  const zoneLevel = ctx.world.zones[ctx.world.zoneMap[ci]]?.level ?? ctx.spec.danger;
  const hp = Math.round(def.hp * (1.2 + zoneLevel * 0.2));
  ctx.entities.push({
    id: ctx.nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * 1.08,
    sprite: monsterSpr(MonsterKind.ZOMBIE),
    spriteSeed: (ctx.spec.seed ^ 0x70) >>> 0,
    name: 'Пациент зеро',
    hp,
    maxHp: hp,
    monsterKind: MonsterKind.ZOMBIE,
    attackCd: 0,
    ai: { goal: AIGoal.HUNT, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0, combatScanCd: 0 },
    rpg: randomRPG(Math.max(1, zoneLevel + 1)),
  });
}

function spawnHeadSlugPatient(ctx: ProceduralAnomalyGenContext, room: Room): void {
  if (!canSpawnEntityType(ctx.entities, EntityType.MONSTER)) return;
  const pos = randomRoomCell(ctx.world, room, false);
  if (!pos) return;
  const def = MONSTERS[MonsterKind.HEAD_SLUG];
  const ci = ctx.world.idx(pos.x, pos.y);
  const zoneLevel = ctx.world.zones[ctx.world.zoneMap[ci]]?.level ?? ctx.spec.danger;
  const hp = Math.round(def.hp * (0.9 + zoneLevel * 0.08));
  const skill = Math.min(1.28, 0.88 + zoneLevel * 0.03);
  ctx.entities.push({
    id: ctx.nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * skill,
    sprite: monsterSpr(MonsterKind.HEAD_SLUG),
    spriteSeed: (ctx.spec.seed ^ 0x5106) >>> 0,
    name: 'Медицинский носитель слизня',
    hp,
    maxHp: hp,
    monsterKind: MonsterKind.HEAD_SLUG,
    monsterStage: HEAD_SLUG_HOSTED_STAGE,
    parasiteHostSkill: skill,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0, combatScanCd: 0 },
    rpg: randomRPG(Math.max(1, zoneLevel)),
  });
}

function convertShadowSpawnsToZombies(ctx: ProceduralAnomalyGenContext): void {
  const def = MONSTERS[MonsterKind.ZOMBIE];
  for (const e of ctx.entities) {
    if (e.type !== EntityType.MONSTER || e.monsterKind !== MonsterKind.SHADOW) continue;
    const ci = ctx.world.idx(Math.floor(e.x), Math.floor(e.y));
    const zoneLevel = ctx.world.zones[ctx.world.zoneMap[ci]]?.level ?? ctx.spec.danger;
    const hp = Math.round(def.hp * (0.75 + zoneLevel * 0.18));
    e.monsterKind = MonsterKind.ZOMBIE;
    e.sprite = monsterSpr(MonsterKind.ZOMBIE);
    e.name = undefined;
    e.hp = hp;
    e.maxHp = hp;
    e.speed = def.speed * (0.9 + ctx.spec.danger * 0.04);
    e.attackCd = 0;
    e.monsterDmgMult = undefined;
    e.phasing = false;
    if (e.ai) {
      e.ai.windupTimer = undefined;
      e.ai.windupTargetId = undefined;
    }
  }
}

export function applyZombieApocalypse(ctx: ProceduralAnomalyGenContext): void {
  if (ctx.spec.anomalyId !== 'zombie_apocalypse' || !floorRunZAllowsNpcs(ctx.spec.z)) return;
  const rooms = crowdRooms(ctx.rooms);
  if (rooms.length === 0) return;

  const outbreak = chooseOutbreakRoom(ctx, rooms);
  if (outbreak) markOutbreakRoom(ctx, outbreak);

  const target = crowdCount(ctx);
  const occupied = new Set<number>();
  const bucketCounts = buildCrowdBucketCounts(ctx.entities);
  let spawned = 0;
  for (let i = 0; i < target * 12 && spawned < target; i++) {
    const room = Math.random() < 0.22 && outbreak ? outbreak : pick(rooms);
    if (spawnCrowdNpc(ctx, room, occupied, bucketCounts, spawned, true)) spawned++;
  }

  convertShadowSpawnsToZombies(ctx);

  if (outbreak) {
    spawnPatientZero(ctx, outbreak);
    const slugRoom = chooseMedicalSlugRoom(rooms);
    if (slugRoom) spawnHeadSlugPatient(ctx, slugRoom);
    const c = roomCenter(outbreak);
    addItemDrop(ctx, c.x + 1, c.y, 'clean_health_cert', 1);
    addItemDrop(ctx, c.x - 1, c.y, 'bandage', 2);
  }

  convertShadowSpawnsToZombies(ctx);
}

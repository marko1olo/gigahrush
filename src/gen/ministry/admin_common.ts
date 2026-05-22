/* ── Ministry admin content helpers ───────────────────────────── */

import {
  W, Cell, Tex, Feature, RoomType, EntityType, AIGoal, Faction, Occupation,
  type Room, type Entity, type MonsterKind,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef } from '../../data/plot';
import { stampRoom, protectRoom, connectProtectedRoom, findClearArea } from '../shared';
import { Spr, monsterSpr } from '../../render/sprite_index';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { MONSTERS } from '../../entities/monster';

export type NextId = { v: number };

export interface AdminRoomSpec {
  type: RoomType;
  name: string;
  w: number;
  h: number;
  minDist: number;
  maxDist: number;
  wallTex?: Tex;
  floorTex?: Tex;
}

export function createAdminRoom(
  world: World, nextRoomId: number, spawnX: number, spawnY: number, spec: AdminRoomSpec,
): Room | null {
  const cx = Math.floor(spawnX);
  const cy = Math.floor(spawnY);
  const pos = findClearArea(world, cx, cy, spec.w, spec.h, spec.minDist, spec.maxDist)
    ?? findClearArea(world, cx, cy, spec.w, spec.h, 0, Math.floor(world.dist(0, 0, 512, 512)));
  if (!pos) {
    console.warn(`[MINISTRY_ADMIN] failed to place ${spec.name}`);
    return null;
  }

  const wallTex = spec.wallTex ?? Tex.MARBLE;
  const floorTex = spec.floorTex ?? Tex.F_PARQUET;
  const room = stampRoom(world, nextRoomId, spec.type, pos.x, pos.y, spec.w, spec.h, -1);
  room.name = spec.name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  protectRoom(world, room.x, room.y, room.w, room.h, wallTex, floorTex);

  const liftCells: number[] = [];
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.LIFT) liftCells.push(i);
  }
  connectProtectedRoom(world, room.x, room.y, room.w, room.h);
  for (const ci of liftCells) {
    if (world.cells[ci] !== Cell.LIFT) world.cells[ci] = Cell.LIFT;
  }

  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      world.floorTex[ci] = floorTex;
      world.wallTex[ci] = wallTex;
    }
  }
  return room;
}

export function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
}

export function addItemDrop(
  entities: Entity[], nextId: NextId, x: number, y: number, defId: string, count = 1,
): void {
  entities.push({
    id: nextId.v++, type: EntityType.ITEM_DROP,
    x: x + 0.5, y: y + 0.5, angle: 0, pitch: 0,
    alive: true, speed: 0, sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count }],
  });
}

export function spawnAdminNpc(
  entities: Entity[], nextId: NextId, def: PlotNpcDef, plotNpcId: string,
  x: number, y: number, canGiveQuest = true, weapon?: string,
): void {
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true, speed: def.speed, sprite: def.sprite,
    name: def.name, isFemale: def.isFemale,
    needs: freshNeeds(), hp: def.hp, maxHp: def.maxHp, money: def.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    weapon,
    faction: def.faction, occupation: def.occupation,
    plotNpcId, canGiveQuest, questId: -1,
    isTraveler: false,
  });
}

export function spawnNamedCivilian(
  entities: Entity[], nextId: NextId, name: string, isFemale: boolean,
  x: number, y: number, occupation = Occupation.SECRETARY,
  faction = Faction.CITIZEN, inventory = [{ defId: 'note', count: 1 }], weapon?: string,
): void {
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true, speed: 0.8, sprite: occupation,
    name, isFemale,
    needs: freshNeeds(), hp: 70, maxHp: 70, money: 15,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory.map(i => ({ ...i })),
    weapon,
    faction, occupation,
    questId: -1,
  });
}

export function spawnAdminMonster(
  world: World, entities: Entity[], nextId: NextId,
  x: number, y: number, kind: MonsterKind,
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  const ci = world.idx(x, y);
  const zid = world.zoneMap[ci];
  const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 1) : 1;
  const rpg = randomRPG(zoneLevel);
  const hp = scaleMonsterHp(def.hp, zoneLevel);
  const monster: Entity = {
    id: nextId.v++, type: EntityType.MONSTER,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, zoneLevel),
    sprite: monsterSpr(kind),
    hp, maxHp: hp,
    monsterKind: kind, attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg,
  };
  entities.push(monster);
}

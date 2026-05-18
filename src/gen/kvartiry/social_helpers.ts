/* ── Kvartiry social POI helpers ─────────────────────────────── */

import {
  W, Cell, Tex, Feature, RoomType,
  type Room, type Entity,
  EntityType, AIGoal, Faction, Occupation,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef } from '../../data/plot';
import { findClearArea, protectRoom, stampRoom, connectProtectedRoom, rng } from '../shared';
import { Spr } from '../../render/sprite_index';
import { registerKvSocialPressurePoi } from './social_pressure';

export interface SocialPoiRoom {
  room: Room;
  x: number;
  y: number;
  w: number;
  h: number;
}

function hasClearWallArea(world: World, x: number, y: number, w: number, h: number): boolean {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] !== Cell.WALL || world.aptMask[ci]) return false;
    }
  }
  return true;
}

function findSocialPoiArea(
  world: World,
  cx: number,
  cy: number,
  w: number,
  h: number,
  minDist: number,
  maxDist: number,
): { x: number; y: number } | null {
  const minD2 = minDist * minDist;
  const maxD2 = maxDist * maxDist;
  const baseX = Math.floor(cx);
  const baseY = Math.floor(cy);

  for (let radius = minDist; radius <= maxDist; radius += 8) {
    const samples = Math.max(32, Math.floor(radius / 3));
    for (let s = 0; s < samples; s++) {
      const angle = (s / samples) * Math.PI * 2 + radius * 0.017;
      const tx = world.wrap(baseX + Math.round(Math.cos(angle) * radius) - (w >> 1));
      const ty = world.wrap(baseY + Math.round(Math.sin(angle) * radius) - (h >> 1));
      const d2 = world.dist2(baseX, baseY, tx + w / 2, ty + h / 2);
      if (d2 < minD2 || d2 > maxD2) continue;
      if (hasClearWallArea(world, tx, ty, w, h)) return { x: tx, y: ty };
    }
  }
  return null;
}

export function createSocialPoiRoom(
  world: World,
  nextRoomId: number,
  nearX: number,
  nearY: number,
  name: string,
  type: RoomType,
  w: number,
  h: number,
  wallTex: Tex,
  floorTex: Tex,
  minDist: number,
  maxDist: number,
  pressure = 1,
): SocialPoiRoom | null {
  const pos = findClearArea(world, Math.floor(nearX), Math.floor(nearY), w, h, minDist, maxDist)
    ?? findSocialPoiArea(world, nearX, nearY, w, h, minDist, maxDist);
  if (!pos) return null;

  const room = stampRoom(world, nextRoomId, type, pos.x, pos.y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  protectRoom(world, room.x, room.y, w, h, wallTex, floorTex);
  connectProtectedRoom(world, room.x, room.y, w, h);
  registerKvSocialPressurePoi(room.x + w / 2, room.y + h / 2, Math.max(w, h) + 8, pressure);

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.cells[ci] === Cell.FLOOR) world.floorTex[ci] = floorTex;
    }
  }

  return { room, x: room.x, y: room.y, w, h };
}

export function setFeatureIfFloor(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
}

export function placeDropNear(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  room: SocialPoiRoom,
  defId: string,
  count = 1,
): void {
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = room.x + rng(1, Math.max(1, room.w - 2));
    const y = room.y + rng(1, Math.max(1, room.h - 2));
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    entities.push({
      id: nextId.v++, type: EntityType.ITEM_DROP,
      x: x + 0.5, y: y + 0.5,
      angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
      inventory: [{ defId, count }],
    });
    return;
  }
}

export function spawnSocialNpc(
  entities: Entity[],
  nextId: { v: number },
  npc: PlotNpcDef,
  plotNpcId: string,
  x: number,
  y: number,
  opts: { weapon?: string; spriteScale?: number; traveler?: boolean; goal?: AIGoal } = {},
): void {
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true, speed: npc.speed, sprite: npc.sprite,
    spriteScale: opts.spriteScale,
    name: npc.name, isFemale: npc.isFemale,
    needs: freshNeeds(), hp: npc.hp, maxHp: npc.maxHp, money: npc.money,
    ai: { goal: opts.goal ?? AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: npc.inventory.map(i => ({ ...i })),
    weapon: opts.weapon,
    faction: npc.faction, occupation: npc.occupation,
    plotNpcId, canGiveQuest: true, questId: -1,
    isTraveler: opts.traveler,
  });
}

export function spawnAmbientNpc(
  entities: Entity[],
  nextId: { v: number },
  name: string,
  faction: Faction,
  occupation: Occupation,
  x: number,
  y: number,
  inventory: { defId: string; count: number }[] = [],
  weapon?: string,
): void {
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true, speed: occupation === Occupation.CHILD ? 0.8 : 1.0,
    sprite: occupation,
    spriteScale: occupation === Occupation.CHILD ? 0.6 : undefined,
    name,
    needs: freshNeeds(), hp: occupation === Occupation.CHILD ? 35 : 85, maxHp: occupation === Occupation.CHILD ? 35 : 85,
    money: rng(0, 20),
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory.map(i => ({ ...i })),
    weapon,
    faction, occupation,
    questId: -1,
  });
}

export function roomCell(room: SocialPoiRoom, dx: number, dy: number): { x: number; y: number } {
  return { x: (room.x + dx + W) % W, y: (room.y + dy + W) % W };
}

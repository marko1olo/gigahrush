import {
  W,
  Cell,
  EntityType,
  Feature,
  type Entity,
  type Room,
} from '../../core/types';
import { World } from '../../core/world';
import type { ProceduralFloorSpec } from '../../data/procedural_floors';
import { Spr } from '../../render/sprite_index';

export interface ProceduralAnomalyGenContext {
  world: World;
  rooms: Room[];
  entities: Entity[];
  nextId: { v: number };
  spec: ProceduralFloorSpec;
  spawnX: number;
  spawnY: number;
}

export function irng(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function chance(p: number): boolean {
  return Math.random() < p;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function roomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.x + Math.floor(room.w / 2),
    y: room.y + Math.floor(room.h / 2),
  };
}

export function roomCell(world: World, room: Room, dx: number, dy: number, requireEmpty = false): { x: number; y: number } | null {
  const x = world.wrap(room.x + Math.max(1, Math.min(room.w - 2, dx)));
  const y = world.wrap(room.y + Math.max(1, Math.min(room.h - 2, dy)));
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR || world.roomMap[ci] !== room.id) return null;
  if (requireEmpty && world.features[ci] !== Feature.NONE) return null;
  return { x, y };
}

export function randomRoomCell(world: World, room: Room, requireEmpty = false): { x: number; y: number } | null {
  if (room.w < 3 || room.h < 3) return null;
  for (let attempt = 0; attempt < 48; attempt++) {
    const pos = roomCell(world, room, irng(1, Math.max(1, room.w - 2)), irng(1, Math.max(1, room.h - 2)), requireEmpty);
    if (pos) return pos;
  }
  return null;
}

export function randomFloorCell(world: World, sx: number, sy: number, minDist2: number, attempts = 4000): { x: number; y: number } | null {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const x = irng(4, W - 5);
    const y = irng(4, W - 5);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
    if (isProtectedCell(world, ci)) continue;
    if (minDist2 > 0 && world.dist2(sx, sy, x + 0.5, y + 0.5) < minDist2) continue;
    return { x, y };
  }
  return null;
}

export function isProtectedCell(world: World, ci: number): boolean {
  return world.cells[ci] === Cell.LIFT ||
    world.features[ci] === Feature.LIFT_BUTTON ||
    world.hermoWall[ci] !== 0 ||
    world.aptMask[ci] !== 0 ||
    world.doors.has(ci) ||
    world.containerMap.has(ci);
}

export function isWalkableCell(world: World, ci: number): boolean {
  return (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) && !isProtectedCell(world, ci);
}

export function addItemDrop(ctx: ProceduralAnomalyGenContext, x: number, y: number, defId: string, count = 1): void {
  ctx.entities.push({
    id: ctx.nextId.v++,
    type: EntityType.ITEM_DROP,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count }],
  });
}

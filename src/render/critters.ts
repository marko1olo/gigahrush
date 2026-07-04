import { crittersEnabled } from '../systems/ui_orchestrator';
import { World } from '../core/world';
import { RoomType, type Entity, W, Cell } from '../core/types';
import { getEntityIndex, ENTITY_MASK_VISIBLE } from '../systems/entity_index';

export const MAX_CRITTERS = 64;
export type CritterType = 'rat' | 'roach' | 'fly';

export interface Critter {
  active: boolean;
  type: CritterType;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  phase: number;
  speed: number;
}

export const CRITTERS_POOL: Critter[] = Array.from({ length: MAX_CRITTERS }, () => ({
  active: false,
  type: 'rat',
  x: 0,
  y: 0,
  phase: 0,
  speed: 0
}));

/**
 * Returns whether critters (and small particles like flies/roaches) should be rendered.
 * Automatically disables them on mobile devices (maxTouchPoints > 0) or if the UI toggle is disabled.
 * A runtime FPS check can optionally be passed to disable them below 30 FPS.
 */
export function getCritterRenderEnabled(fps?: number): boolean {
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
    return false;
  }
  if (fps !== undefined && fps < 30) {
    return false;
  }
  return crittersEnabled();
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function activateCritter(type: CritterType, x: number, y: number, targetX?: number, targetY?: number) {
  for (const c of CRITTERS_POOL) {
    if (!c.active) {
      c.active = true;
      c.type = type;
      c.x = x;
      c.y = y;
      c.targetX = targetX;
      c.targetY = targetY;
      c.phase = Math.random() * Math.PI * 2;
      c.speed = 1.0 + Math.random();
      break;
    }
  }
}

function findCellForRat(world: World, px: number, py: number): { x: number, y: number } | null {
  for (let i = 0; i < 10; i++) {
    const r = randomRange(10, 15);
    const ang = randomRange(0, Math.PI * 2);
    const x = Math.floor(px + Math.cos(ang) * r);
    const y = Math.floor(py + Math.sin(ang) * r);

    if (x < 0 || x >= W || y < 0 || y >= W) continue;

    const idx = world.idx(x, y);
    if (world.cells[idx] === Cell.WALL) continue; // wall
    const roomId = world.roomMap[idx];
    const room = roomId >= 0 ? world.rooms[roomId] : null;

    if (room && (room.type === RoomType.STORAGE || room.type === RoomType.KITCHEN)) {
      if (world.light[idx] < 0.3) {
        return { x, y }; // 100% chance if dark
      }
      if (Math.random() < 0.5) {
        return { x, y };
      }
    }
  }
  return null;
}

function findCellForRoach(world: World, px: number, py: number): { x: number, y: number } | null {
  for (let i = 0; i < 10; i++) {
    const r = randomRange(5, 15);
    const ang = randomRange(0, Math.PI * 2);
    const x = Math.floor(px + Math.cos(ang) * r);
    const y = Math.floor(py + Math.sin(ang) * r);

    if (x < 0 || x >= W || y < 0 || y >= W) continue;

    const idx = world.idx(x, y);
    if (world.cells[idx] === Cell.WALL) continue; // wall
    const roomId = world.roomMap[idx];
    const room = roomId >= 0 ? world.rooms[roomId] : null;

    if ((room && room.type === RoomType.BATHROOM) || world.light[idx] < 0.2) {
      return { x, y };
    }
  }
  return null;
}

const qOut: Entity[] = [];

function spawnFliesOverCorpses(_world: World, px: number, py: number) {
  getEntityIndex().queryRadius(px, py, 15, qOut, ENTITY_MASK_VISIBLE);
  for (const e of qOut) {
    if (e.hp !== undefined && e.hp <= 0) {
      // Spawn 5 flies around the corpse
      for (let i = 0; i < 5; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 1.5;
        activateCritter('fly', e.x + Math.cos(ang) * dist, e.y + Math.sin(ang) * dist, e.x, e.y);
      }
    }
  }
}

export function spawnAmbientCritters(world: World, playerX: number, playerY: number) {
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return;
  if (!getCritterRenderEnabled()) return;

  let activeRats = 0;
  let activeRoaches = 0;
  let activeFlies = 0;

  for (const c of CRITTERS_POOL) {
    if (c.active) {
      if (c.type === 'rat') activeRats++;
      else if (c.type === 'roach') activeRoaches++;
      else if (c.type === 'fly') activeFlies++;

      const dist = Math.sqrt((c.x - playerX)**2 + (c.y - playerY)**2);
      if (dist > 20) c.active = false;
    }
  }

  if (activeRats < 5 && Math.random() < 0.2) {
    const p = findCellForRat(world, playerX, playerY);
    if (p) activateCritter('rat', p.x, p.y);
  }

  if (activeRoaches < 15 && Math.random() < 0.3) {
    const p = findCellForRoach(world, playerX, playerY);
    if (p) activateCritter('roach', p.x, p.y);
  }

  if (activeFlies < 30) {
    spawnFliesOverCorpses(world, playerX, playerY);
  }
}

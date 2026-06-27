import {
  Cell,
  DoorState,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
} from '../../core/types';
import { World } from '../../core/world';
import { seededRandom } from '../../core/rand';
import {
  generateZones,
  sanitizeDoors,
  stampRoom,
  ensureConnectivity,
} from '../shared';
import { genLog } from '../log';
import type { FloorGeneration } from '../floor_manifest';
import { spawnOutskirtsConflict } from './outskirts_conflict';
import { setTerritoryOwnerAtIndex } from '../../systems/territory';

export const DESIGN_FLOOR_ID = 'outskirts' as const;
export const OUTSKIRTS_Z = 1;

export function generateOutskirtsDesignFloor(): FloorGeneration {
  const world = new World();
  const rand = seededRandom(0x4F5554);
  const entities: Entity[] = [];
  const nextId = { v: 10000 };

  // Set all to solid wall
  for (let i = 0; i < W * W; i++) {
    world.cells[i] = Cell.WALL;
    world.wallTex[i] = Tex.CONCRETE;
  }

  // Generate basic grid layout
  generateZones(world);
  let nextRoomId = 1;
  const centerX = W / 2;

  // Simple layout: left half Wild, right half Liquidator, center Neutral
  for (let y = 100; y < W - 100; y += 40) {
    for (let x = 100; x < W - 100; x += 40) {
      if (rand() < 0.3) continue;

      const roomW = 20 + Math.floor(rand() * 10);
      const roomH = 20 + Math.floor(rand() * 10);

      const isCenter = Math.abs(x - centerX) < 150;
      const isWild = x < centerX - 150;
      const isLiq = x > centerX + 150;

      const r = stampRoom(
        world,
        nextRoomId++,
        isCenter ? RoomType.COMMON : RoomType.OFFICE,
        x, y, roomW, roomH, -1
      );

      if (isCenter) r.name = 'Нейтральная зона';
      else if (isWild) r.name = 'Территория Wild';
      else r.name = 'КПП Ликвидаторов';

      // Set territory
      let owner = ZoneFaction.CITIZEN;
      if (isWild) owner = ZoneFaction.WILD;
      else if (isLiq) owner = ZoneFaction.LIQUIDATOR;

      for (let ry = y; ry < y + roomH; ry++) {
        for (let rx = x; rx < x + roomW; rx++) {
           const idx = world.idx(rx, ry);
           setTerritoryOwnerAtIndex(world, idx, owner);
        }
      }
    }
  }

  // Spawn conflict npcs before ensuring connectivity so we don't lock them out
  spawnOutskirtsConflict(world, entities, nextId);

  // Player spawn
  let spawnX = centerX;
  let spawnY = centerX;
  for (const r of world.rooms) {
     if (Math.abs(r.x - centerX) < 100) {
         spawnX = r.x + r.w / 2;
         spawnY = r.y + r.h / 2;
         break;
     }
  }

  ensureConnectivity(world, spawnX, spawnY);
  sanitizeDoors(world);

  // Spawn elevators in the center neutral zone
  const liftRooms = world.rooms.filter(r => Math.abs(r.x - centerX) < 100);
  if (liftRooms.length > 0) {
     const target = liftRooms[0];

     // Lock surrounding doors
     for (const doorIdx of target.doors) {
        const door = world.doors.get(doorIdx);
        if (door) {
           door.state = DoorState.LOCKED;
           door.keyId = 'outskirts_pass';
        }
     }
  }

  genLog(`[OUTSKIRTS] Generated outskirts floor`);

  return {
    world,
    entities,
    spawnX,
    spawnY,
  };
}

import {
  Cell,
  DoorState,
  EntityType,
  Faction,
  Feature,
  FloorLevel,
  LiftDirection,
  Occupation,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type Room,
} from '../../core/types';
import { World } from '../../core/world';
import {
  ensureConnectivity,
  generateZones,
  placeDoorAt,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'outskirts' as const;
export const OUTSKIRTS_ROUTE_Z = -12;
export const OUTSKIRTS_BASE_FLOOR = FloorLevel.KVARTIRY;

function placeLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
}

function decorateFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) {
    world.features[ci] = feature;
  }
}

export function generateOutskirtsDesignFloor(): FloorGeneration {
  const world = new World();
  world.wallTex.fill(Tex.BRICK);
  world.floorTex.fill(Tex.F_LINO);
  world.factionControl.fill(ZoneFaction.CITIZEN);

  const hRooms = Math.floor(W / 12);
  const wRooms = Math.floor(W / 12);

  let gateRoom: Room | null = null;
  let liftDownRoom: Room | null = null;

  let nextRoomId = 1;

  for (let ry = 1; ry < hRooms - 1; ry++) {
    for (let rx = 1; rx < wRooms - 1; rx++) {
      const rxPos = rx * 12 + 2;
      const ryPos = ry * 12 + 2;
      const rw = 10;
      const rh = 10;

      let owner = ZoneFaction.CITIZEN;
      if (rx < wRooms / 3) owner = ZoneFaction.WILD;
      else if (rx > (wRooms * 2) / 3) owner = ZoneFaction.LIQUIDATOR;

      const r = stampRoom(
        world,
        nextRoomId++,
        RoomType.LIVING,
        rxPos,
        ryPos,
        rw,
        rh,
        -1
      );

      if (owner === ZoneFaction.WILD) {
        decorateFeature(world, rxPos + 2, ryPos + 2, Feature.CHAIR);
      } else if (owner === ZoneFaction.LIQUIDATOR) {
        decorateFeature(world, rxPos + 2, ryPos + 2, Feature.MACHINE);
      } else {
        decorateFeature(world, rxPos + 2, ryPos + 2, Feature.LAMP);
      }

      for (let cy = ryPos; cy < ryPos + rh; cy++) {
        for (let cx = rxPos; cx < rxPos + rw; cx++) {
          const ci = world.idx(cx, cy);
          world.factionControl[ci] = owner;
        }
      }

      if (!gateRoom && owner === ZoneFaction.CITIZEN) gateRoom = r;
      if (owner === ZoneFaction.CITIZEN && rx === Math.floor(wRooms/2) && ry === Math.floor(hRooms/2)) liftDownRoom = r;
    }
  }

  const spawnX = gateRoom ? gateRoom.x + 3.5 : 512;
  const spawnY = gateRoom ? gateRoom.y + 3.5 : 512;

  if (gateRoom) placeLift(world, gateRoom.x + 4, gateRoom.y + 4, LiftDirection.UP);
  if (liftDownRoom) {
    placeLift(world, liftDownRoom.x + 4, liftDownRoom.y + 4, LiftDirection.DOWN);
    placeDoorAt(world, liftDownRoom.x - 1, liftDownRoom.y + 5, liftDownRoom.id);
    placeDoorAt(world, liftDownRoom.x + liftDownRoom.w, liftDownRoom.y + 5, liftDownRoom.id);
    placeDoorAt(world, liftDownRoom.x + 5, liftDownRoom.y - 1, liftDownRoom.id);
    placeDoorAt(world, liftDownRoom.x + 5, liftDownRoom.y + liftDownRoom.h, liftDownRoom.id);

    // Set locked state
    for (const [dx, dy] of [[-1, 5], [liftDownRoom.w, 5], [5, -1], [5, liftDownRoom.h]]) {
       const ci = world.idx(liftDownRoom.x + dx, liftDownRoom.y + dy);
       const door = world.doors.get(ci);
       if (door) {
           door.state = DoorState.LOCKED;
           door.keyId = 'outskirts_pass';
       }
    }
  }

  sanitizeDoors(world);
  ensureConnectivity(world, spawnX, spawnY);
  generateZones(world);

  const entities: Entity[] = [];
  const nextId = { v: 1 };

  if (gateRoom) {
    entities.push({
      id: nextId.v++,
      type: EntityType.NPC,
      x: spawnX - 2,
      y: spawnY + 2,
      angle: 0,
      pitch: 0,
      speed: 1,
      alive: true,
      sprite: Occupation.LOCKSMITH,
      faction: Faction.WILD,
      occupation: Occupation.LOCKSMITH,
      hp: 150,
      maxHp: 150,
      inventory: [{ defId: 'outskirts_pass', count: 1 }],
    });
  }

  world.bakeLights();
  return { world, entities, spawnX, spawnY };
}

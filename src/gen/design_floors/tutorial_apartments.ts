import { Cell, DoorState, EntityType, Feature, Tex, W } from '../../core/types';
import { World } from '../../core/world';
import type { FloorGeneration } from '../floor_manifest';
import { ensureConnectivity, sanitizeDoors } from '../shared';

export function generateTutorialApartment(): FloorGeneration {
  const world = new World();
  const entities = [];
  const startX = Math.floor(W / 2) - 5;
  const startY = Math.floor(W / 2) - 5;
  let nextId = 1;

  // Create a 10x10 sealed room
  for (let y = startY; y < startY + 10; y++) {
    for (let x = startX; x < startX + 10; x++) {
      const idx = world.idx(x, y);
      world.cells[idx] = Cell.FLOOR;
      world.floorTex[idx] = Tex.F_LINO;
    }
  }
  for (let y = startY - 1; y <= startY + 10; y++) {
    world.cells[world.idx(startX - 1, y)] = Cell.WALL;
    world.wallTex[world.idx(startX - 1, y)] = Tex.CONCRETE;
    world.hermoWall[world.idx(startX - 1, y)] = 1;
    world.cells[world.idx(startX + 10, y)] = Cell.WALL;
    world.wallTex[world.idx(startX + 10, y)] = Tex.CONCRETE;
    world.hermoWall[world.idx(startX + 10, y)] = 1;
  }
  for (let x = startX - 1; x <= startX + 10; x++) {
    world.cells[world.idx(x, startY - 1)] = Cell.WALL;
    world.wallTex[world.idx(x, startY - 1)] = Tex.CONCRETE;
    world.hermoWall[world.idx(x, startY - 1)] = 1;
    world.cells[world.idx(x, startY + 10)] = Cell.WALL;
    world.wallTex[world.idx(x, startY + 10)] = Tex.CONCRETE;
    world.hermoWall[world.idx(x, startY + 10)] = 1;
  }

  // Place features
  world.features[world.idx(startX + 2, startY + 2)] = Feature.BED;
  world.features[world.idx(startX + 8, startY + 2)] = Feature.TOILET;
  world.features[world.idx(startX + 8, startY + 4)] = Feature.SINK;

  // Place items (key, canned meat, water)
  entities.push({
    id: nextId++, type: EntityType.ITEM_DROP,
    x: startX + 5.5, y: startY + 5.5, angle: 0, pitch: 0,
    alive: true, speed: 0, sprite: 0, spriteScale: 1,
    inventory: [{ defId: 'tutorial_main_key', count: 1 }]
  });
  entities.push({
    id: nextId++, type: EntityType.ITEM_DROP,
    x: startX + 3.5, y: startY + 5.5, angle: 0, pitch: 0,
    alive: true, speed: 0, sprite: 0, spriteScale: 1,
    inventory: [{ defId: 'canned', count: 1 }]
  });
  entities.push({
    id: nextId++, type: EntityType.ITEM_DROP,
    x: startX + 4.5, y: startY + 5.5, angle: 0, pitch: 0,
    alive: true, speed: 0, sprite: 0, spriteScale: 1,
    inventory: [{ defId: 'water', count: 1 }]
  });

  // Create exit door
  const doorIdx = world.idx(startX + 5, startY + 10);
  world.cells[doorIdx] = Cell.DOOR;
  world.wallTex[doorIdx] = Tex.METAL;
  world.hermoWall[doorIdx] = 1;
  world.doors.set(doorIdx, {
    idx: doorIdx, state: DoorState.LOCKED, roomA: -1, roomB: -1, keyId: 'tutorial_main_key', timer: 0
  });

  sanitizeDoors(world);
  ensureConnectivity(world, startX + 5.5, startY + 8.5);

  return { world, entities, spawnX: startX + 2.5, spawnY: startY + 4.5 };
}

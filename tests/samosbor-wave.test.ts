import { beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  DoorState,
  EntityType,
  FloorLevel,
  RoomType,
  Tex,
  ZoneFaction,
  type Entity,
  type Room,
} from '../src/core/types';
import { World } from '../src/core/world';
import { createWorldEventState } from '../src/systems/events';
import { registerRouteCue, routeCueCount } from '../src/systems/route_cues';
import {
  cancelSamosborWave,
  chooseSamosborScale,
  finishSamosborWave,
  getSamosborWaveDebugSnapshot,
  startSamosborWave,
  tickSamosborWave,
} from '../src/systems/samosbor_wave';
import { makeGameState, makeTestContainer, makeTestPlayer } from './helpers';

beforeEach(() => {
  cancelSamosborWave();
});

function makeOpenWaveWorld(cx = 24, cy = 24, half = 8): { world: World; state: ReturnType<typeof makeGameState>; player: Entity; entities: Entity[] } {
  const world = new World();
  world.zones[0] = { id: 0, cx, cy, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  for (let y = cy - half; y <= cy + half; y++) {
    for (let x = cx - half; x <= cx + half; x++) {
      const idx = world.idx(x, y);
      world.cells[idx] = Cell.FLOOR;
      world.floorTex[idx] = Tex.F_LINO;
      world.zoneMap[idx] = 0;
      world.roomMap[idx] = -1;
    }
  }
  const player = makeTestPlayer({ x: cx + 0.5, y: cy + 0.5, speed: 1 });
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    samosborActive: true,
    samosborCount: 2,
    worldEvents: createWorldEventState(),
  });
  return { world, state, player, entities: [player] };
}

function runWaveToEnd(world: World, entities: Entity[], state: ReturnType<typeof makeGameState>): void {
  for (let i = 0; i < 512; i++) {
    const snapshot = getSamosborWaveDebugSnapshot();
    if (snapshot && !snapshot.active) return;
    tickSamosborWave(world, entities, state);
  }
  const snapshot = getSamosborWaveDebugSnapshot();
  assert.equal(snapshot?.active, false, 'wave should finish within bounded test ticks');
}

function makeRoom(id: number, x: number, y: number, w: number, h: number, apartmentId = -1): Room {
  return {
    id,
    type: RoomType.COMMON,
    x,
    y,
    w,
    h,
    doors: [],
    sealed: false,
    name: `room ${id}`,
    apartmentId,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  };
}

function makeReplacementWorld(cx = 24, cy = 24): World {
  const world = new World();
  world.zones[0] = { id: 0, cx, cy, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  const generatedRoom = makeRoom(3, cx - 2, cy - 2, 5, 5);
  generatedRoom.type = RoomType.KITCHEN;
  generatedRoom.name = 'Сгенерированная кухня';
  generatedRoom.wallTex = Tex.PANEL;
  generatedRoom.floorTex = Tex.F_TILE;
  world.rooms[generatedRoom.id] = generatedRoom;
  for (let y = cy - 2; y <= cy + 2; y++) {
    for (let x = cx - 2; x <= cx + 2; x++) {
      const idx = world.idx(x, y);
      world.cells[idx] = Cell.FLOOR;
      world.floorTex[idx] = Tex.F_TILE;
      world.wallTex[idx] = Tex.PANEL;
      world.zoneMap[idx] = 0;
      world.roomMap[idx] = generatedRoom.id;
    }
  }
  return world;
}

test('samosbor wave does not mutate aptMask or protected apartment cells', () => {
  const { world, state, entities } = makeOpenWaveWorld();
  const protectedRoom = makeRoom(7, 27, 23, 3, 3, 1);
  world.rooms[protectedRoom.id] = protectedRoom;
  world.apartmentRoomCount = 1;
  const protectedIdx = world.idx(28, 24);
  world.aptMask[protectedIdx] = 1;
  world.hermoWall[protectedIdx] = 1;
  world.cells[protectedIdx] = Cell.FLOOR;
  world.roomMap[protectedIdx] = protectedRoom.id;
  world.floorTex[protectedIdx] = Tex.F_TILE;

  assert.equal(startSamosborWave(world, entities, state, 'small', 24, 24, { seed: 11, radius: 6, budgetCellsPerTick: 32 }), true);
  runWaveToEnd(world, entities, state);

  assert.equal(world.aptMask[protectedIdx], 1);
  assert.equal(world.hermoWall[protectedIdx], 1);
  assert.equal(world.cells[protectedIdx], Cell.FLOOR);
  assert.equal(world.roomMap[protectedIdx], protectedRoom.id);
  assert.equal(world.floorTex[protectedIdx], Tex.F_TILE);
});

test('samosbor wave queues through toroidal wrap without duplicates', () => {
  const { world, state, entities } = makeOpenWaveWorld(1023, 10, 0);
  const wrappedIdx = world.idx(0, 10);
  world.cells[wrappedIdx] = Cell.FLOOR;
  world.floorTex[wrappedIdx] = Tex.F_LINO;

  assert.equal(startSamosborWave(world, entities, state, 'small', 1023, 10, { seed: 22, radius: 2, budgetCellsPerTick: 1 }), true);
  const queued = getSamosborWaveDebugSnapshot();
  assert.ok(queued?.queuedSample.includes(wrappedIdx), 'wrapped east neighbor should be queued');
  assert.equal(queued?.frontierLength, queued?.queuedCount);

  const tick = tickSamosborWave(world, entities, state);
  assert.equal(tick.processed <= 1, true);
  const afterTick = getSamosborWaveDebugSnapshot();
  assert.equal(afterTick?.frontierLength, afterTick?.queuedCount);
});

test('samosbor wave respects the per-tick budget', () => {
  const { world, state, entities } = makeOpenWaveWorld();
  assert.equal(startSamosborWave(world, entities, state, 'medium', 24, 24, { seed: 33, radius: 10, budgetCellsPerTick: 3 }), true);

  const tick = tickSamosborWave(world, entities, state);
  const snapshot = getSamosborWaveDebugSnapshot();
  assert.equal(tick.processed <= 3, true);
  assert.equal((snapshot?.lastProcessed ?? 99) <= 3, true);
});

test('story living samosbor scale rolls stay local', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  const originalRandom = Math.random;
  Math.random = () => 0.999999;
  try {
    assert.notEqual(chooseSamosborScale(state), 'full');
  } finally {
    Math.random = originalRandom;
  }
});

test('samosbor wave leaves doors, containers, route cues, and entity cells consistent after patch', () => {
  const { world, state, player, entities } = makeOpenWaveWorld();
  world.floorTex[world.idx(24, 24)] = Tex.F_MEAT;
  const doorIdx = world.idx(27, 24);
  world.cells[doorIdx] = Cell.DOOR;
  world.doors.set(doorIdx, { idx: doorIdx, state: DoorState.CLOSED, roomA: -1, roomB: -1, keyId: '', timer: 0 });
  world.containers = [];
  world.rebuildContainerMap();
  world.addContainer(makeTestContainer({ id: 42, x: 24, y: 24, floor: FloorLevel.LIVING, roomId: -1, zoneId: 0, capacitySlots: 2 }));
  entities.push({
    id: 99,
    type: EntityType.PROJECTILE,
    x: 24.5,
    y: 24.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 4,
    sprite: 0,
    ownerId: player.id,
    projLife: 3,
  });
  registerRouteCue(world, {
    id: 'wave_test_cue',
    x: 24,
    y: 24,
    targetX: 24,
    targetY: 24,
    floor: FloorLevel.LIVING,
    label: 'test',
    hint: 'test',
    targetName: 'test',
    color: '#fff',
    tags: ['test'],
    toneSeed: 1,
  });

  assert.equal(routeCueCount(world), 1);
  assert.equal(startSamosborWave(world, entities, state, 'small', 24, 24, { seed: 44, radius: 8, budgetCellsPerTick: 64 }), true);
  runWaveToEnd(world, entities, state);

  for (const [idx, door] of world.doors) {
    assert.equal(world.cells[idx], Cell.DOOR);
    assert.equal(door.idx, idx);
  }
  for (const room of world.rooms) {
    if (!room) continue;
    for (const idx of room.doors) assert.equal(world.cells[idx], Cell.DOOR);
  }
  for (const container of world.containers) {
    const idx = world.idx(container.x, container.y);
    assert.equal(world.containerById.get(container.id), container);
    assert.equal(world.containerMap.get(idx)?.includes(container.id), true);
    assert.ok(world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.DOOR || world.cells[idx] === Cell.WATER);
  }
  assert.equal(entities.some(entity => entity.type === EntityType.PROJECTILE), false);
  assert.equal(routeCueCount(world), 0);
  const snapshot = getSamosborWaveDebugSnapshot();
  assert.equal(snapshot?.frontierLength, snapshot?.queuedCount);
});

test('finished local samosbor wave splices a regenerated field and stitches old boundary floors', () => {
  const { world, state, entities } = makeOpenWaveWorld();
  const protectedRoom = makeRoom(9, 22, 23, 3, 3, 1);
  world.rooms[protectedRoom.id] = protectedRoom;
  world.apartmentRoomCount = 1;
  const protectedIdx = world.idx(23, 24);
  world.aptMask[protectedIdx] = 1;
  world.hermoWall[protectedIdx] = 1;
  world.cells[protectedIdx] = Cell.FLOOR;
  world.roomMap[protectedIdx] = protectedRoom.id;
  world.floorTex[protectedIdx] = Tex.F_WOOD;

  const outsideIdx = world.idx(17, 24);
  const boundaryIdx = world.idx(18, 24);
  const generatedIdx = world.idx(26, 24);
  world.cells[outsideIdx] = Cell.FLOOR;
  world.floorTex[outsideIdx] = Tex.F_LINO;
  world.zones[0].faction = ZoneFaction.CITIZEN;
  world.zones[0].fogged = false;
  world.zones[0].level = 7;

  assert.equal(startSamosborWave(world, entities, state, 'small', 24, 24, { seed: 55, radius: 4, budgetCellsPerTick: 64 }), true);
  runWaveToEnd(world, entities, state);
  world.fog[generatedIdx] = 180;
  const replacementWorld = makeReplacementWorld();
  replacementWorld.zones[0].faction = ZoneFaction.CULTIST;
  replacementWorld.zones[0].fogged = true;
  replacementWorld.zones[0].level = 2;
  const replacement = { world: replacementWorld, entities: [], spawnX: 24.5, spawnY: 24.5 };
  const finished = finishSamosborWave(world, entities, state, replacement);

  assert.equal(world.cells[generatedIdx], Cell.FLOOR);
  assert.equal(world.floorTex[generatedIdx], Tex.F_TILE);
  assert.equal(world.fog[generatedIdx], 180);
  assert.equal(world.zones[0].faction, ZoneFaction.CITIZEN);
  assert.equal(world.zones[0].fogged, false);
  assert.equal(world.zones[0].level, 7);
  const generatedRoom = world.rooms[world.roomMap[generatedIdx]];
  assert.equal(generatedRoom?.type, RoomType.KITCHEN);
  assert.equal(generatedRoom?.name, 'Сгенерированная кухня');
  assert.equal(world.cells[outsideIdx], Cell.FLOOR);
  assert.equal(world.floorTex[outsideIdx], Tex.F_LINO);
  assert.equal(world.cells[boundaryIdx], Cell.FLOOR);
  assert.equal(world.aptMask[protectedIdx], 1);
  assert.equal(world.hermoWall[protectedIdx], 1);
  assert.equal(world.cells[protectedIdx], Cell.FLOOR);
  assert.equal(world.roomMap[protectedIdx], protectedRoom.id);
  assert.equal(world.floorTex[protectedIdx], Tex.F_WOOD);
  assert.ok((finished?.fieldCells ?? 0) > 0);
  assert.ok((finished?.regeneratedCells ?? 0) > 0);
  assert.ok((finished?.stitchedCells ?? 0) > 0);
});

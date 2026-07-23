import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, RoomType, Cell, Room, W } from '../src/core/types';
import { World } from '../src/core/world';
import { makeGameState, makeTestPlayer } from './helpers';
import { createWorldEventState } from '../src/systems/events';
import {
  updateSeroburmalineExposure,
  SEROBURMALINE_ROOM_PREFIX,
  SEROBURMALINE_ACTIVE_FEATURE,
  forSeroburmalineSourceCells,
} from '../src/systems/seroburmaline';

function setupWorld() {
  const world = new World();
  const roomX = 0;
  const roomY = 0;
  const roomW = 10;
  const roomH = 10;

  world.rooms[1] = {
    id: 1,
    type: RoomType.SERVICE,
    x: roomX,
    y: roomY,
    w: roomW,
    h: roomH,
    name: SEROBURMALINE_ROOM_PREFIX + ' цех',
    nameGen: 'цех',
    wallTex: 0,
    floorTex: 0,
    ceilTex: 0,
    generator: 'test',
  };

  const sourceX = world.wrap(roomX + Math.max(2, roomW - 6));
  const sourceY = world.wrap(roomY + 2);

  world.roomMap[world.idx(sourceX, sourceY)] = 1;
  world.setFeatureAt(world.idx(sourceX, sourceY), SEROBURMALINE_ACTIVE_FEATURE);

  for (let x = 1; x <= sourceX; x++) {
    world.cells[world.idx(x, sourceY)] = Cell.FLOOR;
  }


  // Make sure the player location maps to the room as well
  world.roomMap[world.idx(1, 2)] = 1;
  world.roomMap[world.idx(1 + Math.round(Math.cos(0)*2.5), 2 + Math.round(Math.sin(0)*2.5))] = 1;
  world.roomMap[world.idx(1 + Math.round(Math.cos(Math.PI)*2.5), 2 + Math.round(Math.sin(Math.PI)*2.5))] = 1;
  // Initialize world events for state to avoid crash during publishEvent

  return { world, sourceX, sourceY };

}

test('seroburmaline exposure increases when looking at source', () => {
  const { world } = setupWorld();
  const state = makeGameState({ worldEvents: createWorldEventState(), currentFloor: FloorLevel.MAINTENANCE, time: 100 });
  const player = makeTestPlayer({
    x: 1,
    y: 2,
    angle: 0,
    pitch: 0,
    rpg: { level: 1, xp: 0, attrPoints: 0, str: 0, agi: 0, int: 0, psi: 10, maxPsi: 10 },
    alive: true,
  });

  updateSeroburmalineExposure(world, player, state, 1);
  updateSeroburmalineExposure(world, player, state, 1);
  updateSeroburmalineExposure(world, player, state, 1);

  assert.equal(player.rpg!.psi < 10, true, 'PSI should have decreased due to exposure');
  assert.equal(state.msgs.some(m => m.text.includes('Серобурмалин цепляет взгляд')), true, 'Exposure warning should be generated');
});

test('seroburmaline fades when not on MAINTENANCE floor', () => {
  const { world } = setupWorld();
  const state = makeGameState({ worldEvents: createWorldEventState(), currentFloor: FloorLevel.LIVING, time: 100 });
  const player = makeTestPlayer({ x: 1, y: 2, angle: 0, pitch: 0, alive: true });

  updateSeroburmalineExposure(world, player, state, 1);
  assert.equal(state.msgs.length, 0, 'No warning should be generated off floor');
});

test('seroburmaline is avoided when near but looking down', () => {
  const { world } = setupWorld();
  const state = makeGameState({ worldEvents: createWorldEventState(), currentFloor: FloorLevel.MAINTENANCE, time: 100 });
  const player = makeTestPlayer({
    x: 1,
    y: 2,
    angle: 0,
    pitch: -0.3, // looking down, below LOOK_DOWN_SAFE_PITCH
    rpg: { level: 1, xp: 0, attrPoints: 0, str: 0, agi: 0, int: 0, psi: 10, maxPsi: 10 },
    alive: true,
  });

  // Make sure we update long enough to trigger the avoid event (needs to pass rt.nextAvoidEventAt)
  for (let i = 0; i < 20; i++) {
    updateSeroburmalineExposure(world, player, state, 1);
    state.time += 1;
  }

  assert.equal(player.rpg!.psi, 10, 'PSI should not drop when avoiding');
  assert.equal(state.msgs.some(m => m.text.includes('Серобурмалин молчит: взгляд в пол.')), true, 'Avoid warning should be generated');
});

test('seroburmaline is avoided when near but facing away', () => {
  const { world } = setupWorld();
  const state = makeGameState({ worldEvents: createWorldEventState(), currentFloor: FloorLevel.MAINTENANCE, time: 100 });
  const player = makeTestPlayer({
    x: 1,
    y: 2,
    angle: Math.PI, // facing away
    pitch: 0,
    rpg: { level: 1, xp: 0, attrPoints: 0, str: 0, agi: 0, int: 0, psi: 10, maxPsi: 10 },
    alive: true,
  });

  for (let i = 0; i < 20; i++) {
    updateSeroburmalineExposure(world, player, state, 1);
    state.time += 1;
  }

  assert.equal(player.rpg!.psi, 10, 'PSI should not drop when facing away');
  assert.equal(state.msgs.some(m => m.text.includes('Серобурмалин сбоку.')), true, 'Avoid warning should be generated');
});


test('seroburmaline source cells iteration', async (t) => {
  await t.test('Standard room behavior', () => {
    const world = new World();
    const room: Room = {
      id: 1, type: RoomType.SEROBURMALINE, x: 10, y: 10, w: 10, h: 10,
      doors: [], sealed: false, name: 'Room1', apartmentId: -1,
      wallTex: 0, floorTex: 0
    };

    const cells: {x: number, y: number}[] = [];
    forSeroburmalineSourceCells(world, room, (x, y) => cells.push({x, y}));

    assert.equal(cells.length, 2, 'Should iterate exactly 2 cells');
    assert.deepEqual(cells[0], { x: 14, y: 12 }, 'First cell is correct');
    assert.deepEqual(cells[1], { x: 14, y: 17 }, 'Second cell is correct');
  });

  await t.test('Small room behavior (h=3)', () => {
    const world = new World();
    const room: Room = {
      id: 2, type: RoomType.SEROBURMALINE, x: 10, y: 10, w: 10, h: 3,
      doors: [], sealed: false, name: 'Room2', apartmentId: -1,
      wallTex: 0, floorTex: 0
    };

    const cells: {x: number, y: number}[] = [];
    forSeroburmalineSourceCells(world, room, (x, y) => cells.push({x, y}));

    assert.equal(cells.length, 1, 'Should iterate exactly 1 cell for small room');
    assert.deepEqual(cells[0], { x: 14, y: 12 }, 'First cell is correct');
  });

  await t.test('Small room behavior (h=4)', () => {
    const world = new World();
    const room: Room = {
      id: 3, type: RoomType.SEROBURMALINE, x: 10, y: 10, w: 10, h: 4,
      doors: [], sealed: false, name: 'Room3', apartmentId: -1,
      wallTex: 0, floorTex: 0
    };

    const cells: {x: number, y: number}[] = [];
    forSeroburmalineSourceCells(world, room, (x, y) => cells.push({x, y}));

    assert.equal(cells.length, 1, 'Should iterate exactly 1 cell for small room');
    assert.deepEqual(cells[0], { x: 14, y: 12 }, 'First cell is correct');
  });

  await t.test('Wrapping behavior', () => {
    const world = new World();
    const room: Room = {
      id: 4, type: RoomType.SEROBURMALINE, x: W - 2, y: W - 3, w: 10, h: 10,
      doors: [], sealed: false, name: 'Room4', apartmentId: -1,
      wallTex: 0, floorTex: 0
    };

    const cells: {x: number, y: number}[] = [];
    forSeroburmalineSourceCells(world, room, (x, y) => cells.push({x, y}));

    assert.equal(cells.length, 2, 'Should iterate exactly 2 cells');
    assert.deepEqual(cells[0], { x: 2, y: W - 1 }, 'First wrapped cell is correct');
    assert.deepEqual(cells[1], { x: 2, y: 4 }, 'Second wrapped cell is correct');
  });
});

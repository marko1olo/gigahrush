import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { AIGoal, Cell, DoorState, EntityType, RoomType, Tex, type Entity } from '../src/core/types';
import { World } from '../src/core/world';
import { bfsPath, getPathfindingBudgetStats, gotoNearestRoomType, gotoRoom, setPathContext, steerEntityTowardCell } from '../src/systems/ai/pathfinding';

function makeCorridorWorld(): World {
  const world = new World();
  for (let x = 0; x <= 40; x++) world.set(x, 10, Cell.FLOOR);
  for (let y = 9; y <= 11; y++) {
    for (let x = 20; x <= 22; x++) {
      world.set(x, y, Cell.FLOOR);
      world.roomMap[world.idx(x, y)] = 0;
    }
  }
  world.rooms.push({
    id: 0,
    type: RoomType.LIVING,
    x: 20,
    y: 9,
    w: 3,
    h: 3,
    doors: [],
    sealed: false,
    name: 'Тестовая комната',
    apartmentId: 0,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  });
  return world;
}

function makeCornerWorld(): World {
  const world = new World();
  for (let x = 0; x <= 10; x++) world.set(x, 10, Cell.FLOOR);
  for (let y = 10; y <= 14; y++) world.set(10, y, Cell.FLOOR);
  return world;
}

function npc(id: number, x: number): Entity {
  return {
    id,
    type: EntityType.NPC,
    x,
    y: 10,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
  };
}

function assertContiguous(path: readonly number[]): void {
  for (let i = 1; i < path.length; i++) {
    const ax = path[i - 1] % 1024;
    const ay = (path[i - 1] / 1024) | 0;
    const bx = path[i] % 1024;
    const by = (path[i] / 1024) | 0;
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    assert.equal((dx === 1 || dx === 1023) && dy === 0 || (dy === 1 || dy === 1023) && dx === 0, true);
  }
}

test('bfsPath reuses the baked navigation tree for identical endpoints', () => {
  const world = makeCorridorWorld();
  setPathContext([], 0);

  const first = bfsPath(world, 0, 10, 21, 10);
  const second = bfsPath(world, 0, 10, 21, 10);

  assert.ok(first.length > 0);
  assertContiguous(first);
  assert.deepEqual(second, first);
  assert.equal(getPathfindingBudgetStats().cacheHits, 1);
});

test('ordinary closed doors are routeable while locked and hermetic doors block navigation', () => {
  const world = makeCorridorWorld();
  const doorIdx = world.idx(10, 10);
  world.cells[doorIdx] = Cell.DOOR;
  world.doors.set(doorIdx, { idx: doorIdx, state: DoorState.CLOSED, roomA: -1, roomB: 0, keyId: '', timer: 0 });

  setPathContext([], 0);
  assert.equal(bfsPath(world, 0, 10, 21, 10).length > 0, true);

  world.doors.get(doorIdx)!.state = DoorState.LOCKED;
  world.markCellsDirty();
  setPathContext([], 1);
  assert.deepEqual(bfsPath(world, 0, 10, 21, 10), []);

  world.doors.get(doorIdx)!.state = DoorState.HERMETIC_CLOSED;
  world.markCellsDirty();
  setPathContext([], 2, true);
  assert.deepEqual(bfsPath(world, 0, 10, 21, 10), []);
});

test('routine gotoRoom assigns every caller from baked navigation during samosbor', () => {
  const world = makeCorridorWorld();
  const npcs = [0, 1, 2, 3, 4, 5].map((x, i) => npc(i + 1, x));

  setPathContext([], 0, true);
  for (const e of npcs) gotoRoom(world, e, 0);

  let stats = getPathfindingBudgetStats();
  assert.equal(stats.routineBurst, 0);
  assert.equal(stats.routineUsed, 0);
  assert.equal(stats.routineDenied, 0);
  assert.equal(stats.bfsCalls, 1);
  assert.equal(npcs.filter(e => e.ai!.path.length > 0).length, 6);

  setPathContext([], 0.1, true);
  gotoRoom(world, npcs[4], 0);
  stats = getPathfindingBudgetStats();
  assert.equal(stats.routineDenied, 0);
  assert.equal(stats.routineDeferred, 0);
  assert.equal(stats.bfsCalls, 0);
  assert.equal(stats.cacheHits >= 1, true);
  assert.ok(npcs[4].ai!.path.length > 0);
});

test('behavior room flow field assigns many actors from one baked field', () => {
  const world = makeCorridorWorld();
  const npcs = [0, 1, 2, 3, 4, 5].map((x, i) => npc(i + 10, x));

  setPathContext([], 0);
  for (const e of npcs) {
    assert.equal(gotoNearestRoomType(world, e, RoomType.LIVING), true);
    assertContiguous(e.ai!.path);
  }

  let stats = getPathfindingBudgetStats();
  assert.equal(stats.routineDenied, 0);
  assert.equal(stats.routineDeferred, 0);
  assert.equal(stats.bfsCalls, 1);
  assert.equal(npcs.filter(e => e.ai!.path.length > 0).length, 6);

  setPathContext([], 0.1);
  assert.equal(gotoNearestRoomType(world, npcs[0], RoomType.LIVING), true);
  stats = getPathfindingBudgetStats();
  assert.equal(stats.bfsCalls, 0);
  assert.equal(stats.cacheHits >= 1, true);
});

test('path steering follows baked path chunks instead of the final point vector', () => {
  const world = makeCornerWorld();
  const player = npc(100, 0);
  player.type = EntityType.PLAYER;
  player.x = 0.5;
  player.y = 10.5;

  setPathContext([], 0);
  const steering = steerEntityTowardCell(world, player, 10, 14);

  assert.ok(steering);
  assert.equal(steering.nextCell, world.idx(1, 10));
  assert.equal(steering.x > 0.99, true);
  assert.equal(Math.abs(steering.y) < 0.01, true);
});

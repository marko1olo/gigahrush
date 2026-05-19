import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { AIGoal, Cell, EntityType, RoomType, Tex, type Entity } from '../src/core/types';
import { World } from '../src/core/world';
import { bfsPath, getPathfindingBudgetStats, gotoRoom, setPathContext } from '../src/systems/ai/pathfinding';

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

test('bfsPath reuses same-frame path cache for identical endpoints', () => {
  const world = makeCorridorWorld();
  setPathContext([], 0);

  const first = bfsPath(world, 0, 10, 21, 10);
  const second = bfsPath(world, 0, 10, 21, 10);

  assert.ok(first.length > 0);
  assert.deepEqual(second, first);
  assert.equal(getPathfindingBudgetStats().cacheHits, 1);
});

test('routine gotoRoom is token-capped and deferred during samosbor', () => {
  const world = makeCorridorWorld();
  const npcs = [0, 1, 2, 3, 4, 5].map((x, i) => npc(i + 1, x));

  setPathContext([], 0, true);
  for (const e of npcs) gotoRoom(world, e, 0);

  let stats = getPathfindingBudgetStats();
  assert.equal(stats.routineBurst, 4);
  assert.equal(stats.routineUsed, 4);
  assert.equal(stats.routineDenied, 2);
  assert.equal(npcs.filter(e => e.ai!.path.length > 0).length, 4);

  setPathContext([], 0.1, true);
  gotoRoom(world, npcs[4], 0);
  stats = getPathfindingBudgetStats();
  assert.equal(stats.routineUsed, 0);
  assert.equal(stats.routineDeferred, 1);

  setPathContext([], 2, true);
  gotoRoom(world, npcs[4], 0);
  stats = getPathfindingBudgetStats();
  assert.equal(stats.routineUsed, 1);
  assert.ok(npcs[4].ai!.path.length > 0);
});

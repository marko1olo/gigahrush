import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, DoorState, FloorLevel, W } from '../src/core/types';
import { generateFloor, type FloorGeneration } from '../src/gen/floor_manifest';
import { World } from '../src/core/world';

function unlockedWalkable(world: World, idx: number): boolean {
  const cell = world.cells[idx];
  if (cell === Cell.FLOOR || cell === Cell.WATER || cell === Cell.LIFT) return true;
  if (cell !== Cell.DOOR) return false;
  const door = world.doors.get(idx);
  return door?.state !== DoorState.LOCKED;
}

function unlockedReachability(world: World, spawnX: number, spawnY: number): Uint8Array {
  const start = world.idx(Math.floor(spawnX), Math.floor(spawnY));
  const reachable = new Uint8Array(W * W);
  if (!unlockedWalkable(world, start)) return reachable;

  const q = [start];
  reachable[start] = 1;
  let head = 0;
  while (head < q.length) {
    const idx = q[head++];
    const x = idx % W;
    const y = (idx / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const next = world.idx(x + dx, y + dy);
      if (reachable[next] || !unlockedWalkable(world, next)) continue;
      reachable[next] = 1;
      q.push(next);
    }
  }
  return reachable;
}

function roomReachable(gen: FloorGeneration, reachable: Uint8Array, name: string): boolean {
  const room = gen.world.rooms.find(candidate => candidate?.name === name);
  assert.ok(room, `${name} exists`);
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const idx = gen.world.idx(room.x + dx, room.y + dy);
      if (gen.world.roomMap[idx] === room.id && reachable[idx]) return true;
    }
  }
  return false;
}

function reachableLiftCount(world: World, reachable: Uint8Array): number {
  let count = 0;
  for (let idx = 0; idx < world.cells.length; idx++) {
    if (world.cells[idx] === Cell.LIFT && reachable[idx]) count++;
  }
  return count;
}

test('ministry macro landmarks are navigable without authority keys', () => {
  const gen = generateFloor(FloorLevel.MINISTRY, 20_260_530);
  const world = gen.world;
  const reachable = unlockedReachability(world, gen.spawnX, gen.spawnY);

  assert.equal(roomReachable(gen, reachable, 'Портретный зал центральных подписей'), true);
  assert.equal(roomReachable(gen, reachable, 'Клетка клерков временной выдачи'), true);
  assert.equal(roomReachable(gen, reachable, 'Копировальная комната мокрых справок'), true);
  assert.equal(roomReachable(gen, reachable, 'Жалобная яма с обратной нумерацией'), true);

  const seal = world.rooms.find(room => room?.name === 'Шкаф гербовых печатей');
  assert.ok(seal, 'seal cabinet exists');
  assert.equal(seal.doors.length, 1, 'seal cabinet is a leaf room');
  const sealDoor = world.doors.get(seal.doors[0]);
  assert.equal(sealDoor?.state, DoorState.LOCKED);
  assert.equal(sealDoor?.keyId, 'key');

  let reachableOutsideSeal = false;
  const doorX = seal.doors[0] % W;
  const doorY = (seal.doors[0] / W) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const idx = world.idx(doorX + dx, doorY + dy);
    if (world.roomMap[idx] !== seal.id && reachable[idx]) reachableOutsideSeal = true;
  }
  assert.equal(reachableOutsideSeal, true, 'locked seal cabinet sits on a reachable optional branch');

  let lockedDoors = 0;
  for (const door of world.doors.values()) {
    if (door.state === DoorState.LOCKED) lockedDoors++;
  }
  assert.equal(lockedDoors > 0, true, 'ministry has optional locked authority doors');
  assert.equal(reachableLiftCount(world, reachable), 16, 'all ministry lifts remain reachable without locked doors');
});

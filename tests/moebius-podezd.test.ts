import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  DoorState,
  EntityType,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  RoomType,
  W,
} from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { ACTIVE_ACTOR_SOFT_LIMIT } from '../src/data/entity_limits';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  MOEBIUS_PODEZD_BASE_FLOOR,
  MOEBIUS_PODEZD_ROOM_NAMES,
  MOEBIUS_PODEZD_ROUTE_ID,
  MOEBIUS_PODEZD_Z,
  moebiusPodezdDecisionMetrics,
} from '../src/gen/design_floors/moebius_podezd';
import type { FloorGeneration } from '../src/gen/floor_manifest';

const ORTHO_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
let cachedGeneration: FloorGeneration | undefined;

function generatedMoebiusPodezd(): FloorGeneration {
  cachedGeneration ??= generateDesignFloor(MOEBIUS_PODEZD_ROUTE_ID);
  return cachedGeneration;
}

function reachableWithoutLockedDoors(gen: FloorGeneration): Uint8Array {
  const world = gen.world;
  const out = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  const start = world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
  out[start] = 1;
  queue[tail++] = start;

  while (head < tail) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const [dx, dy] of ORTHO_DIRS) {
      const ni = world.idx(x + dx, y + dy);
      if (out[ni]) continue;
      const cell = world.cells[ni];
      if (cell === Cell.FLOOR || cell === Cell.WATER) {
        out[ni] = 1;
        queue[tail++] = ni;
        continue;
      }
      if (cell !== Cell.DOOR) continue;
      const door = world.doors.get(ni);
      if (!door || door.state === DoorState.LOCKED || door.state === DoorState.HERMETIC_CLOSED) continue;
      out[ni] = 1;
      queue[tail++] = ni;
    }
  }

  return out;
}

function hasReachableLift(gen: FloorGeneration, reachable: Uint8Array, direction: LiftDirection): boolean {
  const world = gen.world;
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of ORTHO_DIRS) {
      if (reachable[world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

test('moebius_podezd is registered as the z +2 residential orientation route', () => {
  const route = designFloorById(MOEBIUS_PODEZD_ROUTE_ID);
  assert.equal(route?.z, MOEBIUS_PODEZD_Z);
  assert.equal(route?.baseFloor, MOEBIUS_PODEZD_BASE_FLOOR);
  assert.equal(route?.baseFloor, FloorLevel.KVARTIRY);
  assert.equal(route?.displayName, 'Мёбиус-подъезд');
  assert.equal(designFloorAtZ(MOEBIUS_PODEZD_Z)?.id, MOEBIUS_PODEZD_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(MOEBIUS_PODEZD_Z), false);
});

test('moebius_podezd generator creates mirrored strips, landmarks and route-marker decisions', () => {
  const gen = generatedMoebiusPodezd();
  const metrics = moebiusPodezdDecisionMetrics(gen);
  const profile = designFloorPopulationProfile(designFloorById(MOEBIUS_PODEZD_ROUTE_ID)!);

  assert.equal(metrics.residentialStrips, 2);
  assert.equal(metrics.mirroredFlatRooms >= 16, true);
  assert.equal(metrics.seamLandmarks, 2);
  assert.equal(metrics.seamLockedDoors, 2);
  assert.equal(metrics.mirrorTellContainers >= 4, true);
  assert.equal(metrics.routeMarkerContainers, 1);
  assert.equal(metrics.reversedPatrolNpcs >= 4, true);
  assert.equal(metrics.seamHunterMonsters >= 1, true);
  assert.equal(gen.world.rooms.some(room => room.name === MOEBIUS_PODEZD_ROOM_NAMES.shortcut), true);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.STORAGE && room.name === MOEBIUS_PODEZD_ROOM_NAMES.lostMarker), true);
  assert.equal(gen.world.screenCells.length >= 2, true);
  assert.equal(profile.npcTarget, 3400);
  assert.equal(profile.monsterTarget, 520);
  assert.equal(profile.npcTarget + profile.monsterTarget <= ACTIVE_ACTOR_SOFT_LIMIT, true);
});

test('moebius_podezd keeps the public loop usable without opening the parity shortcut', () => {
  const gen = generatedMoebiusPodezd();
  const reachable = reachableWithoutLockedDoors(gen);
  let reachableWalkable = 0;
  let totalUnlockedWalkable = 0;

  for (let i = 0; i < W * W; i++) {
    const cell = gen.world.cells[i];
    const door = cell === Cell.DOOR ? gen.world.doors.get(i) : undefined;
    const unlockedWalkable = cell === Cell.FLOOR || cell === Cell.WATER ||
      (cell === Cell.DOOR && door?.state !== DoorState.LOCKED && door?.state !== DoorState.HERMETIC_CLOSED);
    if (!unlockedWalkable) continue;
    totalUnlockedWalkable++;
    if (reachable[i]) reachableWalkable++;
  }

  assert.equal(gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))], Cell.FLOOR);
  assert.equal(hasReachableLift(gen, reachable, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, reachable, LiftDirection.DOWN), true);
  assert.equal(reachableWalkable > 18_000, true);
  assert.equal(reachableWalkable / totalUnlockedWalkable > 0.92, true);
});

test('moebius_podezd exposes the optional shortcut, mirror tells and reversed patrol route', () => {
  const gen = generatedMoebiusPodezd();
  const seamDoors = [...gen.world.doors.values()].filter(door => door.state === DoorState.LOCKED && door.keyId === 'rubber_door_wedge');
  const shortcut = gen.world.rooms.find(room => room.name === MOEBIUS_PODEZD_ROOM_NAMES.shortcut);
  const northPatrol = gen.entities.find(entity => entity.name === 'Ликвидатор обратного обхода север');
  const southPatrol = gen.entities.find(entity => entity.name === 'Ликвидатор обратного обхода юг');

  assert.equal(seamDoors.length, 2);
  assert.ok(shortcut);
  assert.equal(seamDoors.every(door => door.roomA === shortcut.id || door.roomB === shortcut.id), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('seam_lock') && container.inventory.some(item => item.defId === 'rubber_door_wedge')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('route_marker') && container.inventory.some(item => item.defId === 'chalk')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('mirror_tell') && container.inventory.some(item => item.defId === 'sealed_complaint')), true);
  assert.ok(northPatrol?.ai);
  assert.ok(southPatrol?.ai);
  assert.equal(northPatrol.type, EntityType.NPC);
  assert.equal(southPatrol.type, EntityType.NPC);
  assert.equal((northPatrol.ai.tx ?? northPatrol.x) < northPatrol.x, true);
  assert.equal((southPatrol.ai.tx ?? southPatrol.x) > southPatrol.x, true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.SHOVNIK), true);
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, Feature, FloorLevel, LiftDirection, W } from '../src/core/types';
import { auditReachability, hasReachableAdjacentCell, type ReachabilityAudit } from '../src/core/world';
import { generateFloor, type FloorGeneration } from '../src/gen/floor_manifest';
import { VOID_DEAD_LAMP_ROWS, VOID_GEOMETRY_ANCHORS } from '../src/gen/void/geometry';

const VOID_TEST_SEED = 0x140014;

let cachedVoidGeneration: FloorGeneration | undefined;

function voidFloorForRead(): FloorGeneration {
  cachedVoidGeneration ??= generateFloor(FloorLevel.VOID, VOID_TEST_SEED);
  return cachedVoidGeneration;
}

function startAudit(gen: FloorGeneration): ReachabilityAudit {
  return auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
}

function walkableCount(gen: FloorGeneration): number {
  let count = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    const cell = gen.world.cells[i];
    if (cell === Cell.FLOOR || cell === Cell.DOOR || cell === Cell.WATER) count++;
  }
  return count;
}

function reachableCount(audit: ReachabilityAudit): number {
  let count = 0;
  for (const value of audit.reachable) count += value;
  return count;
}

function reachableLift(gen: FloorGeneration, audit: ReachabilityAudit, direction: LiftDirection): boolean {
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.cells[i] === Cell.LIFT && gen.world.liftDir[i] === direction && hasReachableAdjacentCell(gen.world, audit, i)) {
      return true;
    }
  }
  return false;
}

function reachableRoom(gen: FloorGeneration, audit: ReachabilityAudit, name: string): boolean {
  const room = gen.world.rooms.find(candidate => candidate.name === name);
  assert.ok(room, `missing room ${name}`);
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.roomMap[i] === room.id && audit.reachable[i]) return true;
  }
  return false;
}

function maxLightNear(gen: FloorGeneration, x: number, y: number, radius: number): number {
  let best = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const light = gen.world.light[gen.world.idx(x + dx, y + dy)];
      if (light > best) best = light;
    }
  }
  return best;
}

function countDeadFixtureRowCells(gen: FloorGeneration): number {
  let count = 0;
  for (const [ax, ay, bx, by] of VOID_DEAD_LAMP_ROWS) {
    const ddx = gen.world.delta(ax, bx);
    const ddy = gen.world.delta(ay, by);
    const steps = Math.max(1, Math.abs(ddx), Math.abs(ddy));
    for (let step = 0; step <= steps; step += 4) {
      const x = gen.world.wrap(Math.round(ax + (ddx * step) / steps));
      const y = gen.world.wrap(Math.round(ay + (ddy * step) / steps));
      const feature = gen.world.features[gen.world.idx(x, y)];
      if (feature === Feature.APPARATUS || feature === Feature.SCREEN) count++;
    }
  }
  return count;
}

test('VOID story floor uses a reachable sparse island graph instead of generic loose components', () => {
  const gen = voidFloorForRead();
  const audit = startAudit(gen);
  const walkable = walkableCount(gen);

  assert.equal(reachableCount(audit), walkable);
  assert.equal(reachableLift(gen, audit, LiftDirection.UP), true);
  assert.equal(reachableLift(gen, audit, LiftDirection.DOWN), true);
  assert.equal(reachableRoom(gen, audit, 'Световой карман'), true);
  assert.equal(reachableRoom(gen, audit, 'Пустотный повторитель'), true);
  assert.equal(reachableRoom(gen, audit, 'Протокольная П-46'), true);
  assert.equal(reachableRoom(gen, audit, 'Касса заемного света'), true);

  const [bossX, bossY] = VOID_GEOMETRY_ANCHORS.boss;
  assert.equal(audit.reachable[gen.world.idx(bossX, bossY)], 1);
});

test('VOID story floor exposes light pockets, listening shells and dead lamp rows', () => {
  const gen = voidFloorForRead();
  const [lightX, lightY] = VOID_GEOMETRY_ANCHORS.lightPocket;
  const [listenX, listenY] = VOID_GEOMETRY_ANCHORS.listeningRoute;
  const [protocolX, protocolY] = VOID_GEOMETRY_ANCHORS.protocolFrame;
  const [fallbackX, fallbackY] = VOID_GEOMETRY_ANCHORS.fallbackBridge;
  const [bossX, bossY] = VOID_GEOMETRY_ANCHORS.boss;
  let litWalkable = 0;

  for (let i = 0; i < W * W; i++) {
    const cell = gen.world.cells[i];
    if ((cell === Cell.FLOOR || cell === Cell.DOOR || cell === Cell.WATER) && gen.world.light[i] > 0.12) litWalkable++;
  }

  assert.equal(maxLightNear(gen, lightX, lightY, 5) > 0.42, true);
  assert.equal(maxLightNear(gen, listenX, listenY, 6) > 0.18, true);
  assert.equal(maxLightNear(gen, protocolX, protocolY, 6) > 0.20, true);
  assert.equal(maxLightNear(gen, fallbackX, fallbackY, 7) > 0.10, true);
  assert.equal(maxLightNear(gen, bossX, bossY, 6) > 0.48, true);
  assert.equal(countDeadFixtureRowCells(gen) >= 24, true);
  assert.equal(litWalkable > 800, true);
  assert.equal(litWalkable < walkableCount(gen) / 2, true);
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, FloorLevel, LiftDirection } from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  createRoofSkyTextureProvider,
  ROOF_BASE_FLOOR,
  ROOF_FUTURE_Z,
  ROOF_ROUTE_ID,
  ROOF_SKY_HEIGHT,
  ROOF_SKY_WIDTH,
  type RoofGeneration,
} from '../src/gen/design_floors/roof';
import { routeCueCount } from '../src/systems/route_cues';

test('roof is registered as the top authored route floor', () => {
  const route = designFloorById(ROOF_ROUTE_ID);

  assert.equal(route?.z, ROOF_FUTURE_Z);
  assert.equal(route?.baseFloor, ROOF_BASE_FLOOR);
  assert.equal(route?.displayName, 'Крыша');
  assert.equal(route?.baseFloor, FloorLevel.MINISTRY);
  assert.equal(designFloorAtZ(ROOF_FUTURE_Z)?.id, ROOF_ROUTE_ID);
});

test('roof generator exposes sky, shelter cue and two descent routes', () => {
  const gen = generateDesignFloor(ROOF_ROUTE_ID) as RoofGeneration;
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const ventShelter = gen.world.rooms.find(room => room.name === 'Вентиляционное укрытие');
  let downLifts = 0;

  for (let i = 0; i < gen.world.liftDir.length; i++) {
    if (gen.world.liftDir[i] === LiftDirection.DOWN && gen.world.cells[i] === Cell.LIFT) downLifts++;
  }

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(gen.skyProvider.width, ROOF_SKY_WIDTH);
  assert.equal(gen.skyProvider.height, ROOF_SKY_HEIGHT);
  assert.equal(gen.skyProvider.pixels.length, ROOF_SKY_WIDTH * ROOF_SKY_HEIGHT);
  assert.equal(routeCueCount(gen.world), 1);
  assert.equal(ventShelter?.sealed, true);
  assert.equal(downLifts >= 2, true);
});

test('roof sky provider updates bounded cloud pixels and fog tint', () => {
  const sky = createRoofSkyTextureProvider(94, 0.42);
  const firstFog = { ...sky.fogTint };

  sky.dirty = false;
  assert.equal(sky.update(sky.updateInterval * 0.5), false);
  assert.equal(sky.dirty, false);
  assert.equal(sky.update(sky.updateInterval), true);
  assert.equal(sky.dirty, true);

  sky.dirty = false;
  sky.cycleTime(6);
  assert.equal(sky.dirty, true);
  assert.notDeepEqual(sky.fogTint, firstFog);
});

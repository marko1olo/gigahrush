import test from 'node:test';
import assert from 'node:assert/strict';
import { Tex, EntityType, Cell } from '../src/core/types';
import { rollWallDrops } from '../src/systems/destructibility';
import { makeGameState } from './helpers';
import { World } from '../src/core/world';

test('rollWallDrops spawns correct items based on WALL_LOOT and respects STASH generation', () => {
  const world = new World(123);
  const state = makeGameState();
  const nextEntityId = { v: 100 };

  const cellIdx = world.idx(10, 10);

  let rubbleCount = 0;
  let rebarCount = 0;
  let wireCount = 0;
  let stashCount = 0;

  for (let i = 0; i < 1000; i++) {
    const entities = [];
    state.tick = i * 1234567;
    rollWallDrops(world, entities, nextEntityId, state, Tex.CONCRETE, cellIdx);

    for (const drop of entities) {
      if (drop.inventory && drop.inventory.length > 0) {
        const id = drop.inventory[0].defId;
        if (id === 'concrete_rubble') rubbleCount++;
        else if (id === 'rebar_piece') rebarCount++;
        else if (id === 'wire_coil') wireCount++;
        else stashCount++;
      }
    }
  }

  assert.ok(rubbleCount > 600 && rubbleCount < 800, `Expected ~700 rubble, got ${rubbleCount}`);
  assert.ok(rebarCount > 150 && rebarCount < 250, `Expected ~200 rebar, got ${rebarCount}`);
  assert.ok(wireCount > 20 && wireCount < 80, `Expected ~50 wire, got ${wireCount}`);
  assert.ok(stashCount > 5 && stashCount < 40, `Expected ~20 stash items (which might be 1-3 drops each, so up to 60 total drops), got ${stashCount}`);

  state.tick = 9999;
  const entities2 = [];
  let waterTriggered = false;
  for (let i = 0; i < 100; i++) {
    state.tick = 9999 + i * 1234567;
    world.cells[cellIdx] = Cell.WALL;
    rollWallDrops(world, entities2, nextEntityId, state, Tex.PIPE, cellIdx);
    if (world.cells[cellIdx] === Cell.WATER) {
      waterTriggered = true;
    }
  }
  assert.ok(waterTriggered, 'WATER_EFFECT should turn cell into WATER');
});

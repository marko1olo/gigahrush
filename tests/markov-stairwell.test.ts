import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, DoorState, EntityType, FloorLevel, LiftDirection, RoomType } from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  MARKOV_STAIRWELL_BYPASS_KEY,
  MARKOV_STAIRWELL_ROUTE_ID,
  MARKOV_STAIRWELL_Z,
  measureMarkovStairwellMetrics,
} from '../src/gen/design_floors/markov_stairwell';

type MarkovGeneration = ReturnType<typeof generateDesignFloor>;

let cached: MarkovGeneration | undefined;

function markov(): MarkovGeneration {
  cached ??= generateDesignFloor(MARKOV_STAIRWELL_ROUTE_ID);
  return cached;
}

test('markov_stairwell is registered as a Ministry route floor', () => {
  const route = designFloorById(MARKOV_STAIRWELL_ROUTE_ID);
  assert.equal(route?.z, MARKOV_STAIRWELL_Z);
  assert.equal(route?.baseFloor, FloorLevel.MINISTRY);
  assert.equal(route?.displayName, 'Марковская лестница');
  assert.equal(route?.danger, 3);
  assert.equal(designFloorAtZ(MARKOV_STAIRWELL_Z)?.id, MARKOV_STAIRWELL_ROUTE_ID);

  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 820);
  assert.equal(profile.monsterTarget, 980);
  assert.equal(profile.npcNoun, 'счётчик маршей');
  assert.equal(profile.monsterTags.includes('sequence'), true);
});

test('markov_stairwell generates a deterministic chain with tells, rare state, and service bypass', () => {
  const gen = markov();
  const metrics = measureMarkovStairwellMetrics(gen);
  const roomNames = new Set(gen.world.rooms.map(room => room.name));
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const serviceDoors = [...gen.world.doors.values()].filter(door => door.state === DoorState.LOCKED && door.keyId === MARKOV_STAIRWELL_BYPASS_KEY);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(metrics.sequenceLength, 18);
  assert.equal(metrics.motifChanges >= 8, true, `motif changes ${metrics.motifChanges}`);
  assert.equal(metrics.watchedRooms + metrics.huntingRooms + metrics.rareRooms >= 4, true);
  assert.equal(metrics.rareRooms >= 1, true);
  assert.equal(metrics.patternTellCells >= 40, true, `tell cells ${metrics.patternTellCells}`);
  assert.equal(metrics.serviceBypassCells >= 2_000, true, `service cells ${metrics.serviceBypassCells}`);
  assert.equal(metrics.lockedServiceDoors, 1);
  assert.equal(serviceDoors.length, 1);
  assert.equal(metrics.ungatedUpLiftReachable, true);
  assert.equal(metrics.ungatedDownLiftReachable, true);
  assert.equal(roomNames.has('Марковская лестница: основной марш'), true);
  assert.equal(roomNames.has('Марковская лестница: стол учёта переходов'), true);
  assert.equal(roomNames.has('Марковская лестница: редкое состояние М'), true);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.PRODUCTION && room.name.includes('служебка')), true);
});

test('markov_stairwell exposes pattern-stash and rare-state decisions', () => {
  const gen = markov();
  const metrics = measureMarkovStairwellMetrics(gen);
  const quests = new Set(getSideQuestRegistrySnapshot().map(quest => quest.id));

  assert.equal(metrics.patternStashes, 1);
  assert.equal(metrics.rareStateStashes, 1);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.NPC && entity.plotNpcId === 'markov_stairwell_watcher'), true);
  assert.equal(quests.has('markov_stairwell_pattern_stash'), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('pattern_stash') &&
    container.inventory.some(item => item.defId === 'lift_scheme')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('rare_state') &&
    container.inventory.some(item => item.defId === 'elevator_access_order')), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.UP), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.DOWN), true);
});

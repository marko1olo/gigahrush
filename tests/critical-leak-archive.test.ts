import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, FloorLevel, LiftDirection } from '../src/core/types';
import { auditReachability, hasReachableAdjacentCell } from '../src/core/world';
import { designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import {
  CRITICAL_LEAK_ARCHIVE_BASE_FLOOR,
  CRITICAL_LEAK_ARCHIVE_ROOM_NAMES,
  CRITICAL_LEAK_ARCHIVE_ROUTE_ID,
  CRITICAL_LEAK_ARCHIVE_Z,
  type CriticalLeakArchiveGeneration,
} from '../src/gen/design_floors/critical_leak_archive';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';

let cachedGeneration: CriticalLeakArchiveGeneration | undefined;

function generatedCriticalLeakArchive(): CriticalLeakArchiveGeneration {
  cachedGeneration ??= generateDesignFloor(CRITICAL_LEAK_ARCHIVE_ROUTE_ID) as CriticalLeakArchiveGeneration;
  return cachedGeneration;
}

test('critical_leak_archive is registered as a Ministry archive route stop', () => {
  const route = designFloorById(CRITICAL_LEAK_ARCHIVE_ROUTE_ID);
  assert.equal(route?.z, CRITICAL_LEAK_ARCHIVE_Z);
  assert.equal(route?.baseFloor, CRITICAL_LEAK_ARCHIVE_BASE_FLOOR);
  assert.equal(route?.displayName, 'Архив критической протечки');
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(CRITICAL_LEAK_ARCHIVE_Z), false);

  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 760);
  assert.equal(profile.monsterTarget, 1050);
  assert.equal(profile.monsterTags.includes('water'), true);
  assert.equal(profile.monsterTags.includes('documents'), true);
});

test('critical_leak_archive carves a wet percolation archive with bridges and route lifts', () => {
  const gen = generatedCriticalLeakArchive();
  const state = gen.criticalLeakState;
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(state.largestComponentCells >= 90, true, 'largest percolation component should be meaningful');
  assert.equal(state.bridgesAdded >= 10, true, 'route anchors should be bridge-connected to the largest component');
  assert.equal(state.wetCausewayCells >= 6_000, true, 'wet cluster should be visible as water');
  assert.equal(state.dryCausewayCells >= 6_000, true, 'dry skeleton causeways should remain playable');
  assert.equal(state.contaminatedShortcutCells >= 900, true, 'contaminated shortcut should be a real water path');
});

test('critical_leak_archive exposes dry packet, contaminated shortcut and floodgate decisions', () => {
  const gen = generatedCriticalLeakArchive();
  const names = new Set(gen.world.rooms.map(room => room.name));
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));

  for (const name of Object.values(CRITICAL_LEAK_ARCHIVE_ROOM_NAMES)) {
    assert.equal(names.has(name), true, name);
  }

  const reachableTagged = (tag: string): number => gen.world.containers.filter(container =>
    container.tags.includes(CRITICAL_LEAK_ARCHIVE_ROUTE_ID) &&
    container.tags.includes(tag) &&
    hasReachableAdjacentCell(gen.world, audit, gen.world.idx(container.x, container.y))
  ).length;

  assert.equal(reachableTagged('dry_archive_packet') >= 2, true, 'dry document packet choices should be reachable');
  assert.equal(reachableTagged('contaminated_shortcut') >= 1, true, 'contaminated shortcut sample should be reachable');
  assert.equal(reachableTagged('raise_floodgate') >= 1, true, 'floodgate control should be reachable');

  const plotIds = new Set(gen.entities.map(entity => entity.plotNpcId).filter(Boolean));
  assert.equal(plotIds.has('critical_leak_archivist_varvara'), true);
  assert.equal(plotIds.has('critical_leak_liquidator_egor'), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.NPC), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER), true);
});

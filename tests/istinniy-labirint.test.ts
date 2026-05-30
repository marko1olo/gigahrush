import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, DoorState, EntityType, FloorLevel, LiftDirection, RoomType } from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  ISTINNIY_LABIRINT_CHORD_KEY,
  ISTINNIY_LABIRINT_ROUTE_ID,
  ISTINNIY_LABIRINT_Z,
  measureIstinniyLabirintMetrics,
} from '../src/gen/design_floors/istinniy_labirint';

type LabyrinthGeneration = ReturnType<typeof generateDesignFloor>;

let cached: LabyrinthGeneration | undefined;

function labyrinth(): LabyrinthGeneration {
  cached ??= generateDesignFloor(ISTINNIY_LABIRINT_ROUTE_ID);
  return cached;
}

test('istinniy_labirint is registered as a Ministry route floor', () => {
  const route = designFloorById(ISTINNIY_LABIRINT_ROUTE_ID);
  assert.equal(route?.z, ISTINNIY_LABIRINT_Z);
  assert.equal(route?.baseFloor, FloorLevel.MINISTRY);
  assert.equal(route?.displayName, 'Истинный лабиринт');
  assert.equal(route?.danger, 4);
  assert.equal(designFloorAtZ(ISTINNIY_LABIRINT_Z)?.id, ISTINNIY_LABIRINT_ROUTE_ID);

  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 900);
  assert.equal(profile.monsterTarget, 1300);
  assert.equal(profile.npcNoun, 'потерявшийся');
  assert.equal(profile.monsterTags.includes('wayfinding'), true);
});

test('istinniy_labirint generates maze landmarks, cues, chords, and ungated lift backbone', () => {
  const gen = labyrinth();
  const metrics = measureIstinniyLabirintMetrics(gen);
  const roomNames = new Set(gen.world.rooms.map(room => room.name));
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const lockedChordDoors = [...gen.world.doors.values()].filter(door =>
    door.state === DoorState.LOCKED && door.keyId === ISTINNIY_LABIRINT_CHORD_KEY);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(metrics.ungatedUpLiftReachable, true);
  assert.equal(metrics.ungatedDownLiftReachable, true);
  assert.equal(metrics.landmarkCount >= 7, true, `landmarks ${metrics.landmarkCount}`);
  assert.equal(metrics.rewardDeadEnds >= 6, true, `reward dead ends ${metrics.rewardDeadEnds}`);
  assert.equal(metrics.lockedChords >= 6, true, `locked chords ${metrics.lockedChords}`);
  assert.equal(lockedChordDoors.length, metrics.lockedChords);
  assert.equal(metrics.ariadneCueCells >= 30, true, `cue cells ${metrics.ariadneCueCells}`);
  assert.equal(metrics.safeWallCells >= 900, true, `safe wall cells ${metrics.safeWallCells}`);
  assert.equal(metrics.mainPathLength >= 90, true, `main path ${metrics.mainPathLength}`);
  assert.equal(metrics.pathEntropy >= 1.0, true, `path entropy ${metrics.pathEntropy}`);
  assert.equal(metrics.minLandmarkSpacing >= 24, true, `landmark spacing ${metrics.minLandmarkSpacing}`);

  for (const name of [
    'Лабиринт: нулевая катушка Ариадны',
    'Лабиринт: белая стена обратного пути',
    'Лабиринт: комната шести стрелок',
    'Лабиринт: узел короткой красной хорды',
    'Лабиринт: узел потерянного Паши',
    'Лабиринт: тупик документного ящика',
    'Лабиринт: дальняя лифтовая спина',
  ]) {
    assert.equal(roomNames.has(name), true, name);
  }
});

test('istinniy_labirint exposes rescue and document-stash decisions', () => {
  const gen = labyrinth();
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const quests = new Set(getSideQuestRegistrySnapshot().map(quest => quest.id));

  assert.equal(npcs.some(entity => entity.plotNpcId === 'labyrinth_ariadna_zina'), true);
  assert.equal(npcs.some(entity => entity.plotNpcId === 'labyrinth_lost_pavel'), true);
  assert.equal(quests.has('labyrinth_rechalk_safe_wall'), true);
  assert.equal(quests.has('labyrinth_rescue_lost_pavel'), true);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.STORAGE && room.name === 'Лабиринт: тупик документного ящика'), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('document_stash') &&
    container.inventory.some(item => item.defId === 'elevator_access_order')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('chord_key') &&
    container.inventory.some(item => item.defId === ISTINNIY_LABIRINT_CHORD_KEY)), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.UP), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.DOWN), true);
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, FloorLevel, LiftDirection, MonsterKind, RoomType, W, type Entity } from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  TURING_NURSERY_BASE_FLOOR,
  TURING_NURSERY_ROOM_PREFIX,
  TURING_NURSERY_ROUTE_ID,
  TURING_NURSERY_Z,
  measureTuringNurseryMetrics,
} from '../src/gen/design_floors/turing_nursery';
import { entityInActiveCellHazard } from '../src/systems/cell_hazards';
import { getRouteCueMarkers } from '../src/systems/route_cues';

type TuringGeneration = ReturnType<typeof generateDesignFloor>;

let cached: TuringGeneration | undefined;

function nursery(): TuringGeneration {
  cached ??= generateDesignFloor(TURING_NURSERY_ROUTE_ID);
  return cached;
}

test('turing_nursery is registered as a Kvartiry route floor', () => {
  const route = designFloorById(TURING_NURSERY_ROUTE_ID);
  assert.equal(route?.z, TURING_NURSERY_Z);
  assert.equal(route?.baseFloor, FloorLevel.KVARTIRY);
  assert.equal(route?.baseFloor, TURING_NURSERY_BASE_FLOOR);
  assert.equal(route?.displayName, 'Ясли Тьюринга');
  assert.equal(route?.danger, 4);
  assert.equal(designFloorAtZ(TURING_NURSERY_Z)?.id, TURING_NURSERY_ROUTE_ID);

  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 1050);
  assert.equal(profile.monsterTarget, 1450);
  assert.equal(profile.npcNoun, 'лаборант яслей');
  assert.equal(profile.monsterTags.includes('reaction_diffusion'), true);
  assert.equal((profile.npcPlacement.roomWeights?.[RoomType.MEDICAL] ?? 0) > 1.5, true);
});

test('turing_nursery generates reaction lanes, static hazards, route cues, and lifts', () => {
  const gen = nursery();
  const metrics = measureTuringNurseryMetrics(gen);
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const cueTags = new Set(getRouteCueMarkers(gen.world).flatMap(marker => marker.tags));
  const hazardProbe = findHazardProbe(gen);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(metrics.reactionRooms >= 14, true, `reaction rooms ${metrics.reactionRooms}`);
  assert.equal(metrics.wetCells >= 220, true, `wet cells ${metrics.wetCells}`);
  assert.equal(metrics.laneCells >= 900, true, `lane cells ${metrics.laneCells}`);
  assert.equal(metrics.bridgeCells >= 500, true, `bridge cells ${metrics.bridgeCells}`);
  assert.equal(metrics.decisionContainers >= 9, true, `decision containers ${metrics.decisionContainers}`);
  assert.equal(cueTags.has('inoculation'), true);
  assert.equal(cueTags.has('burn_bridge'), true);
  assert.equal(cueTags.has('expose_growth'), true);
  assert.ok(hazardProbe);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.UP), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.DOWN), true);
});

test('turing_nursery exposes inoculate, harvest, burn, and exposure decisions', () => {
  const gen = nursery();
  const quests = new Set(getSideQuestRegistrySnapshot().map(quest => quest.id));
  const plotIds = new Set(gen.entities.filter(e => e.type === EntityType.NPC).map(e => e.plotNpcId));
  const monsterKinds = new Set(gen.entities.filter(e => e.type === EntityType.MONSTER).map(e => e.monsterKind));

  for (const id of [
    'turing_nursery_mother_agafya',
    'turing_nursery_liquidator_bryzga',
    'turing_nursery_child_sava',
    'turing_nursery_registrar_milena',
  ]) {
    assert.equal(plotIds.has(id), true, id);
  }

  for (const questId of [
    'turing_nursery_inoculate_basin',
    'turing_nursery_burn_bridge',
    'turing_nursery_expose_growth_child',
    'turing_nursery_growth_audit',
  ]) {
    assert.equal(quests.has(questId), true, questId);
  }

  assert.equal(monsterKinds.has(MonsterKind.CHERNOSLIZ), true);
  assert.equal(monsterKinds.has(MonsterKind.SLIME_WOMAN), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('inoculation') &&
    container.inventory.some(item => item.defId === 'decon_fluid')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('harvest') &&
    container.inventory.some(item => item.defId === 'blue_glow_sample_sealed')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('burn_bridge') &&
    container.inventory.some(item => item.defId === 'napalm_mix')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('expose_growth') &&
    container.inventory.some(item => item.defId === 'nii_forged_audit')), true);
  assert.equal(gen.world.rooms.some(room => room.name.startsWith(TURING_NURSERY_ROOM_PREFIX)), true);
});

function findHazardProbe(gen: TuringGeneration): Entity | null {
  for (const room of gen.world.rooms) {
    if (!room.name.includes('вычислительная чаша')) continue;
    for (let y = room.y + 2; y < room.y + room.h - 2; y++) {
      for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
        const idx = gen.world.idx(x, y);
        if (gen.world.cells[idx] !== Cell.WATER && gen.world.cells[idx] !== Cell.FLOOR) continue;
        const probe = {
          id: 99,
          type: EntityType.NPC,
          x: (idx % W) + 0.5,
          y: ((idx / W) | 0) + 0.5,
          angle: 0,
          pitch: 0,
          alive: true,
          speed: 1,
          sprite: 0,
        } as Entity;
        if (entityInActiveCellHazard(gen.world, probe, [TURING_NURSERY_ROUTE_ID])) return probe;
      }
    }
  }
  return null;
}

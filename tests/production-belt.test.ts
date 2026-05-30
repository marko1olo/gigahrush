import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, Faction, MonsterKind, Occupation, RoomType, Tex, type Entity } from '../src/core/types';
import { designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import type { ProductionBeltGeneration } from '../src/gen/design_floors/production_belt';
import { getCellHazardMoveMultiplier } from '../src/systems/cell_hazards';
import { getRouteCueMarkers } from '../src/systems/route_cues';

function roomTypeForEntity(gen: ProductionBeltGeneration, entity: { x: number; y: number }): RoomType | undefined {
  const cell = gen.world.idx(Math.floor(entity.x), Math.floor(entity.y));
  const roomId = gen.world.roomMap[cell];
  return roomId >= 0 ? gen.world.rooms[roomId]?.type : undefined;
}

function weightOf<T>(items: readonly { value: T; weight: number }[], value: T): number {
  return items.find(item => item.value === value)?.weight ?? 0;
}

test('production belt profile matches the Floor 13 industrial density target', () => {
  const route = designFloorById('production_belt');
  assert.ok(route);

  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget >= 900 && profile.npcTarget <= 1800, true);
  assert.equal(profile.monsterTarget >= 700 && profile.monsterTarget <= 1600, true);
  assert.equal(weightOf(profile.npcFactions, Faction.CITIZEN) > weightOf(profile.npcFactions, Faction.LIQUIDATOR), true);
  assert.equal(weightOf(profile.npcFactions, Faction.WILD) < weightOf(profile.npcFactions, Faction.LIQUIDATOR), true);

  const workerWeight =
    weightOf(profile.npcOccupations, Occupation.MECHANIC) +
    weightOf(profile.npcOccupations, Occupation.TURNER) +
    weightOf(profile.npcOccupations, Occupation.ELECTRICIAN) +
    weightOf(profile.npcOccupations, Occupation.LOCKSMITH);
  const outsiderWeight =
    weightOf(profile.npcOccupations, Occupation.HUNTER) +
    weightOf(profile.npcOccupations, Occupation.TRAVELER) +
    weightOf(profile.npcOccupations, Occupation.SCIENTIST);
  assert.equal(workerWeight > outsiderWeight * 3, true);
});

test('production belt generation exposes repair, theft, bad batch and industrial population bands', () => {
  const gen = generateDesignFloor('production_belt') as ProductionBeltGeneration;
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);

  assert.equal(npcs.length >= 900 && npcs.length <= 1800, true, `npc count ${npcs.length}`);
  assert.equal(monsters.length >= 700 && monsters.length <= 1600, true, `monster count ${monsters.length}`);
  assert.equal(gen.productionState.lines.length, 3);
  assert.deepEqual(
    gen.productionState.lines.map(line => line.factoryId).sort(),
    ['illegal_ammo_smelter', 'metal_shop', 'utility_room'],
  );

  const cues = getRouteCueMarkers(gen.world);
  assert.equal(gen.productionState.cueIds.every(id => cues.some(cue => cue.id === id)), true);
  assert.equal(cues.some(cue => cue.tags.includes('repair')), true);
  assert.equal(cues.some(cue => cue.tags.includes('transfer')), true);
  assert.equal(cues.some(cue => cue.tags.includes('bad_batch')), true);
  assert.equal(cues.some(cue => cue.tags.includes('conveyor_spine')), true);
  assert.equal(cues.some(cue => cue.tags.includes('machine_hazard') && cue.tags.includes('shelter')), true);

  const machineShelterCue = cues.find(cue => cue.id === 'production_belt_machine_shelter');
  assert.ok(machineShelterCue);
  assert.equal(gen.world.rooms[machineShelterCue.targetRoomId!]?.type, RoomType.COMMON);
  const hazardProbe = {
    id: -707,
    type: EntityType.NPC,
    x: machineShelterCue.x,
    y: machineShelterCue.y,
  } as Entity;
  assert.equal(getCellHazardMoveMultiplier(gen.world, hazardProbe) < 1, true);

  let spineTiles = 0;
  for (let i = 0; i < gen.world.floorTex.length; i++) {
    if (gen.world.floorTex[i] === Tex.F_TILE) spineTiles++;
  }
  assert.equal(spineTiles >= 1200, true, `spine tile cells ${spineTiles}`);

  const productionOutputs = gen.world.containers.filter(container => container.tags.includes('production_output'));
  const industrialCaches = gen.world.containers.filter(container => container.tags.includes('industrial_cache'));
  assert.equal(productionOutputs.length >= 3, true);
  assert.equal(industrialCaches.length >= 4, true);
  assert.equal(industrialCaches.some(container => container.access === 'locked'), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('theft')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('bad_batch')), true);

  const workerRooms = new Set([RoomType.PRODUCTION, RoomType.HQ, RoomType.COMMON, RoomType.OFFICE]);
  const workerBand = npcs.filter(entity => workerRooms.has(roomTypeForEntity(gen, entity)!)).length;
  const monsterBand = monsters.filter(entity => {
    const roomType = roomTypeForEntity(gen, entity);
    return roomType === RoomType.PRODUCTION || roomType === RoomType.STORAGE || roomType === RoomType.CORRIDOR;
  }).length;
  assert.equal(workerBand >= 100, true, `worker band ${workerBand}`);
  assert.equal(monsterBand >= Math.floor(monsters.length * 0.65), true, `monster band ${monsterBand}/${monsters.length}`);
  assert.equal(monsters.some(entity => entity.monsterKind === MonsterKind.ROBOT || entity.monsterKind === MonsterKind.TRUBNYY_AVTOMAT), true);
});

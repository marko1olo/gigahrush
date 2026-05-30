import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  DoorState,
  EntityType,
  Feature,
  FloorLevel,
  LiftDirection,
  NpcState,
  RoomType,
  W,
} from '../src/core/types';
import {
  designFloorAtZ,
  designFloorById,
} from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { ACTIVE_ACTOR_SOFT_LIMIT } from '../src/data/entity_limits';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  OBSCHEZHITIE_SMENY_DESIGN_FLOOR_ID,
  OBSCHEZHITIE_SMENY_ROUTE_Z,
} from '../src/gen/design_floors/obschezhitie_smeny';

let cachedGeneration: ReturnType<typeof generateDesignFloor> | undefined;

function generatedObschezhitieSmeny(): ReturnType<typeof generateDesignFloor> {
  cachedGeneration ??= generateDesignFloor(OBSCHEZHITIE_SMENY_DESIGN_FLOOR_ID);
  return cachedGeneration;
}

test('obschezhitie_smeny is the authored shift dormitory route floor', () => {
  const route = designFloorById(OBSCHEZHITIE_SMENY_DESIGN_FLOOR_ID);
  assert.equal(route?.z, OBSCHEZHITIE_SMENY_ROUTE_Z);
  assert.equal(route?.baseFloor, FloorLevel.LIVING);
  assert.equal(route?.displayName, 'Общежитие смены');
  assert.equal(designFloorAtZ(OBSCHEZHITIE_SMENY_ROUTE_Z)?.id, OBSCHEZHITIE_SMENY_DESIGN_FLOOR_ID);
});

test('obschezhitie_smeny generator creates bunks, witnesses, patrol and shelter pressure', () => {
  const gen = generatedObschezhitieSmeny();
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const bunkRooms = gen.world.rooms.filter(room => room.name.includes('спальная секция'));
  const shelter = gen.world.rooms.find(room => room.name.includes('Гермоубежище'));
  const bedCells = countRoomFeatures(gen, bunkRooms, Feature.BED);
  const sleepingTemplates = gen.entities.filter(entity => entity.type === EntityType.NPC && entity.ai?.npcState === NpcState.SLEEPING);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(bunkRooms.length >= 16, true);
  assert.equal(bedCells >= 64, true);
  assert.equal(shelter?.type, RoomType.COMMON);
  assert.equal(shelter?.sealed, true);
  assert.equal(shelter?.doors.some(idx => gen.world.doors.get(idx)?.state === DoorState.HERMETIC_OPEN), true);
  assert.equal(sleepingTemplates.length >= 24, true);
  assert.equal(gen.entities.some(entity => entity.plotNpcId === 'obschezhitie_rita_starshaya'), true);
  assert.equal(gen.entities.some(entity => entity.plotNpcId === 'obschezhitie_gleb_obhod'), true);
  assert.equal(gen.entities.some(entity => entity.plotNpcId === 'obschezhitie_senya_tikhiy'), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('quiet_loot') && container.tags.includes('theft')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('resident_relief') && container.tags.includes('shelter')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('patrol') && container.tags.includes('witness')), true);
});

test('obschezhitie_smeny uses a bounded A-Life-compatible dorm population profile', () => {
  const route = designFloorById(OBSCHEZHITIE_SMENY_DESIGN_FLOOR_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = generatedObschezhitieSmeny();
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);

  assert.equal(profile.npcTarget, 2100);
  assert.equal(profile.monsterTarget, 360);
  assert.equal(profile.npcTarget + profile.monsterTarget <= ACTIVE_ACTOR_SOFT_LIMIT, true);
  assert.equal((profile.npcPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 3, true);
  assert.equal(npcs.length >= profile.npcTarget && npcs.length <= ACTIVE_ACTOR_SOFT_LIMIT, true);
  assert.equal(monsters.length >= 180 && monsters.length <= profile.monsterTarget, true);
});

test('obschezhitie_smeny registers shelter, patrol and quiet-locker choices', () => {
  const ids = new Set(getSideQuestRegistrySnapshot().map(q => q.id));
  for (const id of [
    'obschezhitie_shelter_rollcall',
    'obschezhitie_patrol_silence',
    'obschezhitie_quiet_lockers',
  ]) {
    assert.equal(ids.has(id), true, id);
  }
});

function countRoomFeatures(gen: ReturnType<typeof generateDesignFloor>, rooms: readonly { id: number }[], feature: number): number {
  const roomIds = new Set(rooms.map(room => room.id));
  let count = 0;
  for (let i = 0; i < W * W; i++) {
    if (!roomIds.has(gen.world.roomMap[i])) continue;
    if (gen.world.features[i] === feature) count++;
  }
  return count;
}

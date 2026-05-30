import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  EntityType,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  RoomType,
  W,
} from '../src/core/types';
import { auditReachability, hasReachableAdjacentCell } from '../src/core/world';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { ACTIVE_ACTOR_SOFT_LIMIT } from '../src/data/entity_limits';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  ORANZHEREYA_BETONA_BASE_FLOOR,
  ORANZHEREYA_BETONA_DISPLAY_NAME,
  ORANZHEREYA_BETONA_ROUTE_ID,
  ORANZHEREYA_BETONA_Z,
  ORANZHEREYA_ROOM_NAMES,
  measureOranzhereyaBetonaGeometry,
} from '../src/gen/design_floors/oranzhereya_betona';
import type { FloorGeneration } from '../src/gen/floor_manifest';

let cached: FloorGeneration | undefined;

function oranzhereya(): FloorGeneration {
  cached ??= generateDesignFloor(ORANZHEREYA_BETONA_ROUTE_ID);
  return cached;
}

test('oranzhereya_betona is registered as the z -2 scarcity greenhouse route', () => {
  const route = designFloorById(ORANZHEREYA_BETONA_ROUTE_ID);

  assert.equal(route?.z, ORANZHEREYA_BETONA_Z);
  assert.equal(route?.baseFloor, FloorLevel.LIVING);
  assert.equal(route?.baseFloor, ORANZHEREYA_BETONA_BASE_FLOOR);
  assert.equal(route?.displayName, ORANZHEREYA_BETONA_DISPLAY_NAME);
  assert.equal(route?.danger, 3);
  assert.equal(designFloorAtZ(ORANZHEREYA_BETONA_Z)?.id, ORANZHEREYA_BETONA_ROUTE_ID);
});

test('oranzhereya_betona generates reachable crop rooms, water graph, and lifts', () => {
  const gen = oranzhereya();
  const metrics = measureOranzhereyaBetonaGeometry(gen.world);
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));

  assert.equal(gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))], Cell.FLOOR);
  assert.equal(metrics.cropCells >= 400, true, `crop cells ${metrics.cropCells}`);
  assert.equal(metrics.waterCells >= 300, true, `water cells ${metrics.waterCells}`);
  assert.equal(metrics.basinContainers, 1);
  assert.equal(metrics.publicHarvestContainers >= 1, true);
  assert.equal(metrics.sabotageContainers, 1);
  assert.equal(hasReachableLift(gen, audit, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, audit, LiftDirection.DOWN), true);

  for (const name of [
    ORANZHEREYA_ROOM_NAMES.pump,
    ORANZHEREYA_ROOM_NAMES.northRows,
    ORANZHEREYA_ROOM_NAMES.southRows,
    ORANZHEREYA_ROOM_NAMES.waterBasin,
    ORANZHEREYA_ROOM_NAMES.burnTrench,
    ORANZHEREYA_ROOM_NAMES.marketStall,
  ]) {
    assert.equal(reachableRoomCellCount(gen, audit.reachable, name) > 0, true, name);
  }
});

test('oranzhereya_betona exposes harvest, poison, burn, reroute, and guard choices', () => {
  const gen = oranzhereya();
  const quests = new Set(getSideQuestRegistrySnapshot().map(quest => quest.id));
  const plotIds = new Set(gen.entities.filter(e => e.type === EntityType.NPC).map(e => e.plotNpcId));
  const monsterKinds = new Set(gen.entities.filter(e => e.type === EntityType.MONSTER).map(e => e.monsterKind));

  for (const id of [
    'oranzhereya_agronom_nadya',
    'oranzhereya_irrigator_gleb',
    'oranzhereya_guard_arsen',
    'oranzhereya_market_sonya',
  ]) {
    assert.equal(plotIds.has(id), true, id);
  }

  for (const questId of [
    'oranzhereya_save_clean_crop',
    'oranzhereya_reroute_water',
    'oranzhereya_burn_infestation',
    'oranzhereya_poison_market_crop',
  ]) {
    assert.equal(quests.has(questId), true, questId);
  }

  assert.equal(monsterKinds.has(MonsterKind.BORSHCHEVIK), true);
  assert.equal(monsterKinds.has(MonsterKind.SPORE_CARPET), true);
  assert.equal(monsterKinds.has(MonsterKind.CHERNOSLIZ), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('harvest') &&
    container.inventory.some(item => item.defId === 'mushroom_mass')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('reroute') &&
    container.inventory.some(item => item.defId === 'valve_tag')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('burn_infestation') &&
    container.inventory.some(item => item.defId === 'ammo_fuel')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('sabotage_drop') &&
    container.inventory.some(item => item.defId === 'acid_bottle')), true);
});

test('oranzhereya_betona uses a bounded food-water population profile', () => {
  const route = designFloorById(ORANZHEREYA_BETONA_ROUTE_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = oranzhereya();
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);

  assert.equal(profile.npcTarget, 980);
  assert.equal(profile.monsterTarget, 920);
  assert.equal(profile.npcNoun, 'тепличник');
  assert.equal(profile.monsterTags.includes('greenhouse'), true);
  assert.equal(profile.monsterTags.includes('spore'), true);
  assert.equal(profile.npcTarget + profile.monsterTarget <= ACTIVE_ACTOR_SOFT_LIMIT, true);
  assert.equal((profile.npcPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal((profile.npcPlacement.roomWeights?.[RoomType.KITCHEN] ?? 0) > 1, true);
  assert.equal(npcs.length >= profile.npcTarget && npcs.length <= ACTIVE_ACTOR_SOFT_LIMIT, true);
  assert.equal(monsters.length >= profile.monsterTarget && monsters.length <= ACTIVE_ACTOR_SOFT_LIMIT, true);
});

function hasReachableLift(
  gen: FloorGeneration,
  audit: ReturnType<typeof auditReachability>,
  direction: LiftDirection,
): boolean {
  const world = gen.world;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    if (hasReachableAdjacentCell(world, audit, i)) return true;
  }
  return false;
}

function reachableRoomCellCount(gen: FloorGeneration, reachable: Uint8Array, roomName: string): number {
  const room = gen.world.rooms.find(candidate => candidate.name === roomName);
  if (!room) return 0;
  let count = 0;
  for (let i = 0; i < W * W; i++) {
    if (gen.world.roomMap[i] === room.id && reachable[i]) count++;
  }
  return count;
}

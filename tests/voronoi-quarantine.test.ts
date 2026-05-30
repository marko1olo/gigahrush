import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { auditReachability, hasReachableAdjacentCell } from '../src/core/world';
import {
  Cell,
  DoorState,
  EntityType,
  Faction,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  Occupation,
  RoomType,
  W,
  ZoneFaction,
} from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import { SIDE_QUESTS } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  getVoronoiQuarantineLayout,
  VORONOI_QUARANTINE_BASE_FLOOR,
  VORONOI_QUARANTINE_ROOM_NAMES,
  VORONOI_QUARANTINE_ROUTE_ID,
  VORONOI_QUARANTINE_Z,
} from '../src/gen/design_floors/voronoi_quarantine';

let cachedGeneration: ReturnType<typeof generateDesignFloor> | undefined;

function generatedVoronoiQuarantine(): ReturnType<typeof generateDesignFloor> {
  cachedGeneration ??= generateDesignFloor(VORONOI_QUARANTINE_ROUTE_ID);
  return cachedGeneration;
}

function hasReachableLift(gen: ReturnType<typeof generateDesignFloor>, direction: LiftDirection): boolean {
  const world = gen.world;
  const audit = auditReachability(world, world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    if (hasReachableAdjacentCell(world, audit, i)) return true;
  }
  return false;
}

test('voronoi_quarantine is registered as a Kvartiry-band authored quarantine route', () => {
  const route = designFloorById(VORONOI_QUARANTINE_ROUTE_ID);
  assert.equal(route?.z, VORONOI_QUARANTINE_Z);
  assert.equal(route?.baseFloor, VORONOI_QUARANTINE_BASE_FLOOR);
  assert.equal(route?.baseFloor, FloorLevel.KVARTIRY);
  assert.equal(route?.displayName, 'Вороной-карантин');
  assert.equal(designFloorAtZ(VORONOI_QUARANTINE_Z)?.id, VORONOI_QUARANTINE_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(VORONOI_QUARANTINE_Z), false);
});

test('voronoi_quarantine population profile targets sanitary staff and infected pressure', () => {
  const route = designFloorById(VORONOI_QUARANTINE_ROUTE_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);

  assert.equal(profile.npcTarget, 980);
  assert.equal(profile.monsterTarget, 1420);
  assert.equal(profile.npcNoun, 'санитар ячейки');
  assert.equal(profile.npcFactions.some(entry => entry.value === Faction.SCIENTIST && entry.weight >= 30), true);
  assert.equal(profile.npcFactions.some(entry => entry.value === Faction.LIQUIDATOR && entry.weight >= 30), true);
  assert.equal(profile.npcOccupations.some(entry => entry.value === Occupation.DOCTOR && entry.weight >= 30), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.HEAD_SLUG), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.CHERNOSLIZ), true);
  assert.equal(profile.monsterTags.includes('quarantine'), true);
  assert.equal((profile.npcPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 4, true);
});

test('voronoi_quarantine generator builds connected Laguerre quarantine cells', () => {
  const gen = generatedVoronoiQuarantine();
  const layout = getVoronoiQuarantineLayout(gen.world);
  assert.ok(layout);

  assert.equal(layout.lloydPasses, 2);
  assert.equal(layout.siteCount >= 10, true);
  assert.equal(layout.connected, true);
  assert.equal(layout.adjacencyEdges.length >= layout.siteCount - 1, true);
  assert.equal(layout.ridgeDoorCount >= (layout.siteCount - 1) * 2, true);
  assert.equal(layout.lockedPassDoorCount >= 1, true);
  assert.equal(layout.supplyConnectorDoorCount >= 1, true);
  assert.equal(layout.siteCellCounts.every(count => count > 900), true);

  for (const roomName of Object.values(VORONOI_QUARANTINE_ROOM_NAMES)) {
    assert.equal(gen.world.rooms.some(room => room.name === roomName), true, roomName);
  }

  assert.equal(hasReachableLift(gen, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, LiftDirection.DOWN), true);
});

test('voronoi_quarantine exposes pass, border, escort and supply decisions', () => {
  const gen = generatedVoronoiQuarantine();
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const questIds = new Set(SIDE_QUESTS.map(quest => quest.id));
  const lockedDoors = [...gen.world.doors.values()].filter(door => door.state === DoorState.LOCKED);
  const zoneFactions = new Set(gen.world.zones.map(zone => zone.faction));

  for (const plotNpcId of [
    'voronoi_quarantine_doctor_pavel',
    'voronoi_quarantine_clerk_zoya',
    'voronoi_quarantine_infected_lev',
    'voronoi_quarantine_quartermaster_marta',
  ]) {
    assert.equal(npcs.some(entity => entity.plotNpcId === plotNpcId), true, plotNpcId);
  }

  assert.equal(lockedDoors.some(door => door.keyId === 'official_quarantine_clearance'), true);
  assert.equal(lockedDoors.some(door => door.keyId === 'forged_quarantine_clearance'), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('supply_connector') && container.tags.includes('open_supply')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('forgery') && container.inventory.some(item => item.defId === 'blank_form')), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.CHERNOSLIZ), true);
  assert.equal(zoneFactions.has(ZoneFaction.LIQUIDATOR), true);
  assert.equal(zoneFactions.has(ZoneFaction.SAMOSBOR), true);

  for (const questId of [
    'voronoi_quarantine_decon_border',
    'voronoi_quarantine_forge_pass',
    'voronoi_quarantine_escort_infected',
    'voronoi_quarantine_open_supply_connector',
  ]) {
    assert.equal(questIds.has(questId), true, questId);
  }
});

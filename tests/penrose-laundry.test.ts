import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  DoorState,
  EntityType,
  Faction,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  Occupation,
  W,
} from '../src/core/types';
import { auditReachability } from '../src/core/world';
import {
  DESIGN_FLOOR_ROUTES,
  designFloorAtZ,
  designFloorById,
} from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import {
  commitFloorRunEntry,
  resolveFloorRunRoute,
  setFloorRunState,
} from '../src/systems/procedural_floors';
import { getRouteCueMarkers } from '../src/systems/route_cues';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  PENROSE_LAUNDRY_BASE_FLOOR,
  PENROSE_LAUNDRY_ROOM_NAMES,
  PENROSE_LAUNDRY_ROUTE_ID,
  PENROSE_LAUNDRY_Z,
  getPenroseLaundryState,
} from '../src/gen/design_floors/penrose_laundry';
import { makeGameState } from './helpers';

function hasReachableLift(gen: ReturnType<typeof generateDesignFloor>, direction: LiftDirection): boolean {
  const start = gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
  const audit = auditReachability(gen.world, start);
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.cells[i] !== Cell.LIFT || gen.world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      if (audit.reachable[gen.world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

test('penrose_laundry is registered as a routed Living-band design floor', () => {
  const route = designFloorById(PENROSE_LAUNDRY_ROUTE_ID);
  assert.equal(route?.z, PENROSE_LAUNDRY_Z);
  assert.equal(route?.baseFloor, PENROSE_LAUNDRY_BASE_FLOOR);
  assert.equal(route?.displayName, 'Прачечная Пенроуза');
  assert.equal(designFloorAtZ(PENROSE_LAUNDRY_Z)?.id, PENROSE_LAUNDRY_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(PENROSE_LAUNDRY_Z), false);
  assert.equal(DESIGN_FLOOR_ROUTES.some(def => def.id === PENROSE_LAUNDRY_ROUTE_ID), true);
});

test('normal lift route reaches penrose_laundry before black_market_88', () => {
  const state = makeGameState({ currentFloor: FloorLevel.MAINTENANCE });
  setFloorRunState(state, { runSeed: 81081, currentZ: -7, specs: {}, visited: {} }, FloorLevel.MAINTENANCE);

  const laundry = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(laundry?.z, PENROSE_LAUNDRY_Z);
  assert.equal(laundry?.designFloorId, PENROSE_LAUNDRY_ROUTE_ID);
  assert.equal(laundry?.baseFloor, PENROSE_LAUNDRY_BASE_FLOOR);
  commitFloorRunEntry(state, laundry!);

  const gap = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(gap?.z, -9);
  assert.equal(gap?.procedural, true);
  commitFloorRunEntry(state, gap!);

  const market = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(market?.z, -10);
  assert.equal(market?.designFloorId, 'black_market_88');
});

test('penrose_laundry generator builds a connected finite symbol patch with decisions', () => {
  const gen = generateDesignFloor(PENROSE_LAUNDRY_ROUTE_ID);
  const state = getPenroseLaundryState(gen.world);
  assert.ok(state);

  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const names = new Set(gen.world.rooms.map(room => room.name));
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const cue = getRouteCueMarkers(gen.world).find(marker => marker.id === 'penrose_laundry_symbol_chain');
  const hiddenCache = gen.world.containers.find(container => container.id === state.containerIds.hiddenWashroomCache);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(hasReachableLift(gen, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, LiftDirection.DOWN), true);
  for (const roomName of Object.values(PENROSE_LAUNDRY_ROOM_NAMES)) {
    assert.equal(names.has(roomName), true, roomName);
  }
  assert.equal(state.tiles.length, 13);
  assert.deepEqual(state.symbolChainRoomNames, [
    PENROSE_LAUNDRY_ROOM_NAMES.firstSun,
    PENROSE_LAUNDRY_ROOM_NAMES.deflationB,
    PENROSE_LAUNDRY_ROOM_NAMES.secondSun,
    PENROSE_LAUNDRY_ROOM_NAMES.hiddenCache,
  ]);
  assert.equal(state.deflationPocketRoomNames.length, 2);
  assert.equal(state.waterCells >= 45, true);
  assert.equal(state.steamCells >= 20, true);
  assert.equal(state.lockedDoorIds.length >= 2, true);
  for (const doorId of state.lockedDoorIds) {
    const door = gen.world.doors.get(doorId);
    assert.equal(door?.state, DoorState.LOCKED);
    assert.equal(door?.keyId, 'container_key_label');
  }
  assert.ok(hiddenCache);
  assert.equal(hiddenCache.access, 'secret');
  assert.equal(hiddenCache.discovered, false);
  assert.equal(hiddenCache.tags.includes('hidden_washroom_cache'), true);
  assert.equal(hiddenCache.inventory.some(item => item.defId === 'pressure_logbook'), true);
  assert.equal(cue?.tags.includes('symbol_chain'), true);
  assert.equal(npcs.some(entity => entity.plotNpcId === 'penrose_laundry_marfa_symbols'), true);
  assert.equal(npcs.some(entity => entity.plotNpcId === 'penrose_laundry_igor_lock'), true);
  assert.equal(npcs.some(entity => entity.plotNpcId === 'penrose_laundry_lidia_steam'), true);
  assert.equal(npcs.some(entity => entity.plotNpcId === 'penrose_laundry_tonya_cache'), true);
});

test('penrose_laundry population profile favors laundry crowds, steam repair and water threats', () => {
  const route = designFloorById(PENROSE_LAUNDRY_ROUTE_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);

  assert.equal(profile.npcTarget, 1450);
  assert.equal(profile.monsterTarget, 760);
  assert.equal(profile.npcFactions.some(value => value.value === Faction.CITIZEN && value.weight >= 70), true);
  assert.equal(profile.npcOccupations.some(value => value.value === Occupation.HOUSEWIFE && value.weight >= 20), true);
  assert.equal(profile.npcOccupations.some(value => value.value === Occupation.MECHANIC && value.weight >= 10), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.TUBE_EEL), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.VODYANOY_KOSHMAR), true);
  assert.equal(profile.monsterTags.includes('symbol_chain'), true);
  assert.equal(profile.npcPlacement.anchors?.some(anchor => anchor.x === 530 && anchor.y === 489 && anchor.weight > 1.5), true);
  assert.equal(profile.monsterPlacement.anchors?.some(anchor => anchor.x === 629 && anchor.y === 508 && anchor.weight > 1.5), true);
});

test('penrose_laundry registers symbol, lock, steam and cache quest choices', () => {
  const ids = new Set(getSideQuestRegistrySnapshot().map(quest => quest.id));
  for (const id of [
    'penrose_laundry_follow_matching_symbols',
    'penrose_laundry_break_lock',
    'penrose_laundry_divert_steam',
    'penrose_laundry_hidden_washroom_cache',
  ]) {
    assert.equal(ids.has(id), true, id);
  }
});

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
  RoomType,
} from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  DESIGN_FLOOR_ID,
  HILBERT_DEPOT_BASE_FLOOR,
  HILBERT_DEPOT_CARGO_TAG,
  HILBERT_DEPOT_CHORD_TAG,
  HILBERT_DEPOT_ROUTE_Z,
  generateHilbertDepotDesignFloor,
  type HilbertDepotGeneration,
} from '../src/gen/design_floors/hilbert_depot';
import { getRouteCueMarkers, routeCueCount } from '../src/systems/route_cues';
import { assertReachableRouteLifts, reachableCells } from './generator_helpers';

function weightOf<T>(items: readonly { value: T; weight: number }[], value: T): number {
  return items.find(item => item.value === value)?.weight ?? 0;
}

let cachedAuthoredGeneration: ReturnType<typeof generateHilbertDepotDesignFloor> | undefined;

function authoredHilbertDepotForRead(): ReturnType<typeof generateHilbertDepotDesignFloor> {
  cachedAuthoredGeneration ??= generateHilbertDepotDesignFloor();
  return cachedAuthoredGeneration;
}

test('hilbert_depot is a maintenance authored route floor with indexed industrial pressure', () => {
  const route = designFloorById(DESIGN_FLOOR_ID);
  assert.ok(route);
  assert.equal(route.z, HILBERT_DEPOT_ROUTE_Z);
  assert.equal(route.baseFloor, HILBERT_DEPOT_BASE_FLOOR);
  assert.equal(route.baseFloor, FloorLevel.MAINTENANCE);
  assert.equal(route.displayName, 'Склад Гильберта');
  assert.equal(route.danger, 4);
  assert.equal(designFloorAtZ(HILBERT_DEPOT_ROUTE_Z)?.id, DESIGN_FLOOR_ID);

  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget >= 450 && profile.npcTarget <= 700, true, `npc target ${profile.npcTarget}`);
  assert.equal(profile.monsterTarget >= 1600 && profile.monsterTarget <= 2100, true, `monster target ${profile.monsterTarget}`);
  assert.equal(weightOf(profile.npcFactions, Faction.LIQUIDATOR) > weightOf(profile.npcFactions, Faction.WILD), true);
  assert.equal(weightOf(profile.npcOccupations, Occupation.STOREKEEPER) > weightOf(profile.npcOccupations, Occupation.SCIENTIST), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.ROBOT), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.PSEUDOLIFT), true);
  assert.equal(profile.monsterTags.includes('index'), true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 5, true);
});

test('hilbert_depot keeps the Hilbert curve compact and exposes ordered cargo decisions', () => {
  const gen = authoredHilbertDepotForRead();
  const state = gen.hilbertState;
  const cargo = gen.world.containers.filter(container => container.tags.includes(HILBERT_DEPOT_CARGO_TAG));
  const uniqueOrders = new Set(state.cargoOrders);

  assert.equal(state.routeId, DESIGN_FLOOR_ID);
  assert.equal(state.curvePointCount, 256);
  assert.equal(state.cargoContainerIds.length >= 24, true, `cargo count ${state.cargoContainerIds.length}`);
  assert.equal(cargo.length, state.cargoContainerIds.length);
  assert.equal(uniqueOrders.size, state.cargoOrders.length);
  assert.deepEqual([...state.cargoOrders].sort((a, b) => a - b), state.cargoOrders);
  assert.equal(cargo.every(container => container.inventory.length > 0), true);
  assert.equal(cargo.some(container => container.access === 'locked'), true);
  assert.equal(cargo.some(container => container.access === 'owner'), true);
  assert.equal(cargo.every(container => container.tags.some(tag => tag.startsWith('hilbert_order_'))), true);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.STORAGE && room.name.includes('Индексная секция Г-')), true);
});

test('hilbert_depot locked chords are optional key-gated shortcuts, not saved curve state', () => {
  const gen = authoredHilbertDepotForRead();
  const state = gen.hilbertState;
  const reachable = reachableCells(gen);

  assert.equal(state.chords.length >= 4, true, `chord count ${state.chords.length}`);
  assert.equal(state.lockedChordDoorCells.length >= state.chords.length, true, `door count ${state.lockedChordDoorCells.length}`);
  for (const doorCell of state.lockedChordDoorCells) {
    const door = gen.world.doors.get(doorCell);
    assert.ok(door, `missing door at ${doorCell}`);
    assert.equal(door.state, DoorState.LOCKED);
    assert.equal(door.keyId, 'key');
    assert.equal(reachable[doorCell], 1, `locked chord door ${doorCell} should sit on reachable route`);
  }

  const cueTags = new Set(getRouteCueMarkers(gen.world).flatMap(cue => cue.tags));
  assert.equal(cueTags.has(HILBERT_DEPOT_CHORD_TAG), true);
  assert.equal(cueTags.has('hilbert_order'), true);
});

test('hilbert_depot full route generation keeps lifts, cues and pressure actors reachable', () => {
  const gen = generateDesignFloor(DESIGN_FLOOR_ID) as HilbertDepotGeneration;
  assertReachableRouteLifts(gen, 'hilbert_depot');

  const cues = getRouteCueMarkers(gen.world);
  const cueTags = new Set(cues.flatMap(cue => cue.tags));
  assert.equal(routeCueCount(gen.world) >= 3, true);
  assert.equal(cueTags.has('hilbert_order'), true);
  assert.equal(cueTags.has(HILBERT_DEPOT_CHORD_TAG), true);
  assert.equal(cueTags.has('exit'), true);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.ROBOT), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.SAFEGUARD), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes(HILBERT_DEPOT_CARGO_TAG)), true);
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { auditReachability, REACH_GATE_KEY } from '../src/core/world';
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
} from '../src/core/types';
import {
  designFloorAtZ,
  designFloorById,
} from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import { SIDE_QUESTS } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  BOLNICHNY_KORPUS_BASE_FLOOR,
  BOLNICHNY_KORPUS_ROUTE_ID,
  BOLNICHNY_KORPUS_Z,
  BOLNICHNY_ROOM_NAMES,
} from '../src/gen/design_floors/bolnichny_korpus';

let cachedGeneration: ReturnType<typeof generateDesignFloor> | undefined;

function generatedBolnichnyKorpus(): ReturnType<typeof generateDesignFloor> {
  cachedGeneration ??= generateDesignFloor(BOLNICHNY_KORPUS_ROUTE_ID);
  return cachedGeneration;
}

function reachableRoomCells(gen: ReturnType<typeof generateDesignFloor>, roomName: string): number {
  const room = gen.world.rooms.find(candidate => candidate.name === roomName);
  assert.ok(room, `missing room ${roomName}`);
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  let cells = 0;
  for (let i = 0; i < W * W; i++) {
    if (gen.world.roomMap[i] === room.id && audit.reachable[i]) cells++;
  }
  return cells;
}

function reachableLiftGate(gen: ReturnType<typeof generateDesignFloor>, direction: LiftDirection): number | undefined {
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  let best: number | undefined;
  for (let i = 0; i < W * W; i++) {
    if (gen.world.cells[i] !== Cell.LIFT || gen.world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const ni = gen.world.idx(x + dx, y + dy);
      if (!audit.reachable[ni]) continue;
      const gate = audit.gateMask[ni];
      best = best === undefined ? gate : Math.min(best, gate);
    }
  }
  return best;
}

test('bolnichny_korpus is registered as a Kvartiry-band authored hospital route', () => {
  const route = designFloorById(BOLNICHNY_KORPUS_ROUTE_ID);
  assert.equal(route?.z, BOLNICHNY_KORPUS_Z);
  assert.equal(route?.baseFloor, BOLNICHNY_KORPUS_BASE_FLOOR);
  assert.equal(route?.baseFloor, FloorLevel.KVARTIRY);
  assert.equal(route?.displayName, 'Больничный корпус');
  assert.equal(designFloorAtZ(BOLNICHNY_KORPUS_Z)?.id, BOLNICHNY_KORPUS_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(BOLNICHNY_KORPUS_Z), false);
});

test('bolnichny_korpus population profile targets medical staff and infected pressure', () => {
  const route = designFloorById(BOLNICHNY_KORPUS_ROUTE_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);

  assert.equal(profile.npcTarget, 1050);
  assert.equal(profile.monsterTarget, 1350);
  assert.equal(profile.npcNoun, 'санработник');
  assert.equal(profile.npcFactions.some(entry => entry.value === Faction.SCIENTIST && entry.weight >= 30), true);
  assert.equal(profile.npcFactions.some(entry => entry.value === Faction.LIQUIDATOR && entry.weight >= 25), true);
  assert.equal(profile.npcOccupations.some(entry => entry.value === Occupation.DOCTOR && entry.weight >= 30), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.HEAD_SLUG), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.CHERNOSLIZ), true);
  assert.equal(profile.monsterTags.includes('quarantine'), true);
  assert.equal((profile.npcPlacement.roomWeights?.[RoomType.MEDICAL] ?? 0) > 1.5, true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 4, true);
});

test('bolnichny_korpus generator ships clean and dirty routes without trapping lifts', () => {
  const gen = generatedBolnichnyKorpus();
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const hermeticDoors = [...gen.world.doors.values()].filter(door => door.state === DoorState.HERMETIC_CLOSED);
  const lockedDoors = [...gen.world.doors.values()].filter(door => door.state === DoorState.LOCKED);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(reachableLiftGate(gen, LiftDirection.UP), 0);
  assert.equal(reachableLiftGate(gen, LiftDirection.DOWN), 0);
  assert.equal(hermeticDoors.length >= 2, true);
  assert.equal(lockedDoors.some(door => door.keyId === 'official_quarantine_clearance'), true);
  assert.equal(lockedDoors.some(door => door.keyId === 'forged_quarantine_clearance'), true);

  for (const name of [
    BOLNICHNY_ROOM_NAMES.cleanLoopSouth,
    BOLNICHNY_ROOM_NAMES.cleanLoopNorth,
    BOLNICHNY_ROOM_NAMES.ventilationSpine,
    BOLNICHNY_ROOM_NAMES.feverWard,
    BOLNICHNY_ROOM_NAMES.redWard,
    BOLNICHNY_ROOM_NAMES.blackWard,
  ]) {
    assert.equal(reachableRoomCells(gen, name) > 0, true, name);
  }
});

test('bolnichny_korpus gates pharmacy loot but keeps it reachable through clearance paths', () => {
  const gen = generatedBolnichnyKorpus();
  const pharmacy = gen.world.rooms.find(room => room.name === BOLNICHNY_ROOM_NAMES.pharmacy);
  assert.ok(pharmacy);
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  let reachable = 0;
  let keyGated = 0;
  for (let i = 0; i < W * W; i++) {
    if (gen.world.roomMap[i] !== pharmacy.id || !audit.reachable[i]) continue;
    reachable++;
    if ((audit.gateMask[i] & REACH_GATE_KEY) !== 0) keyGated++;
  }

  assert.equal(reachable > 0, true);
  assert.equal(keyGated > 0, true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('pharmacy') &&
    container.tags.includes('theft') &&
    container.inventory.some(item => item.defId === 'morphine_ampoule')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('contaminated_papers') &&
    container.inventory.some(item => item.defId === 'contaminated_sample_act')), true);
});

test('bolnichny_korpus exposes authored NPCs and treatment, forgery, escort and exposure hooks', () => {
  const gen = generatedBolnichnyKorpus();
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);
  const questIds = new Set(SIDE_QUESTS.map(quest => quest.id));

  for (const plotNpcId of [
    'bolnichny_doctor_galina',
    'bolnichny_pharmacist_ira',
    'bolnichny_liquidator_sazan',
    'bolnichny_patient_grisha',
    'bolnichny_clerk_nina',
  ]) {
    assert.equal(npcs.some(entity => entity.plotNpcId === plotNpcId), true, plotNpcId);
  }
  assert.equal(monsters.some(entity => entity.monsterKind === MonsterKind.CHERNOSLIZ), true);
  assert.equal(questIds.has('bolnichny_treat_clean_ward'), true);
  assert.equal(questIds.has('bolnichny_treat_infected_ward'), true);
  assert.equal(questIds.has('bolnichny_forge_clearance'), true);
  assert.equal(questIds.has('bolnichny_escort_infected_patient'), true);
  assert.equal(questIds.has('bolnichny_expose_contaminated_papers'), true);
});

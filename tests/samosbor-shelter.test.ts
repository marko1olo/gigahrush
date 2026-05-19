import { beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  DoorState,
  EntityType,
  Faction,
  FloorLevel,
  RoomType,
  Tex,
  ZoneFaction,
  type Entity,
} from '../src/core/types';
import { World } from '../src/core/world';
import { SAMOSBOR_VARIANTS, type ActiveSamosborVariant } from '../src/data/samosbor_variants';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';
import { resetSamosborRuntimeForTests, resolvePlayerShelterAtSealForTests } from '../src/systems/samosbor';
import { makeGameState } from './helpers';

const TEST_SHELTER_ROOM_ID = 777;
const QUIET_VARIANT_DEF = SAMOSBOR_VARIANTS.find(variant => variant.id === 'quiet');
if (!QUIET_VARIANT_DEF) throw new Error('quiet samosbor variant missing');

const QUIET_TEST_VARIANT: ActiveSamosborVariant = {
  def: QUIET_VARIANT_DEF,
  modifiers: [],
  durationMult: QUIET_VARIANT_DEF.durationMult,
  spawnMult: QUIET_VARIANT_DEF.spawnMult,
  fogSeedMult: 1,
  fogSpawnIntervalMult: 1,
  sealTimingDelta: QUIET_VARIANT_DEF.sealTimingDelta,
  noSiren: false,
  extraEyes: 0,
  shelterRoomCount: 0,
  fogColor: QUIET_VARIANT_DEF.fogColor,
};

beforeEach(() => {
  resetSamosborRuntimeForTests();
});

function makeShelterWorld(doorState: DoorState): {
  world: World;
  entities: Entity[];
  player: Entity;
  nextId: { v: number };
} {
  const world = new World();
  const room = {
    id: TEST_SHELTER_ROOM_ID,
    type: RoomType.LIVING,
    x: 10, y: 10, w: 6, h: 6,
    doors: [] as number[],
    sealed: false,
    name: 'Тестовая гермокомната',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  };
  world.rooms[TEST_SHELTER_ROOM_ID] = room;
  world.apartmentRoomCount = 0;
  world.zones[0] = { id: 0, cx: 14, cy: 14, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };

  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const ci = world.idx(x, y);
      world.set(x, y, Cell.FLOOR);
      world.roomMap[ci] = room.id;
      world.zoneMap[ci] = 0;
      world.aptMask[ci] = 1;
    }
  }

  const doorIdx = world.idx(room.x + room.w, room.y + 3);
  world.set(room.x + room.w, room.y + 3, Cell.DOOR);
  world.roomMap[doorIdx] = room.id;
  world.zoneMap[doorIdx] = 0;
  world.aptMask[doorIdx] = 1;
  world.doors.set(doorIdx, { idx: doorIdx, state: doorState, roomA: room.id, roomB: -1, keyId: '', timer: 0 });
  room.doors.push(doorIdx);

  const hallIdx = world.idx(room.x + room.w + 1, room.y + 3);
  world.set(room.x + room.w + 1, room.y + 3, Cell.FLOOR);
  world.zoneMap[hallIdx] = 0;

  const player: Entity = {
    id: 1,
    type: EntityType.PLAYER,
    x: room.x + 2.5,
    y: room.y + 2.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    name: 'Вы',
    faction: Faction.PLAYER,
    hp: 50,
    maxHp: 50,
    rpg: { level: 1, xp: 0, attrPoints: 0, str: 0, agi: 0, int: 0, psi: 10, maxPsi: 10 },
  };

  return { world, entities: [player], player, nextId: { v: 2 } };
}

function resolveQuietSeal(ctx: ReturnType<typeof makeShelterWorld>): ReturnType<typeof makeGameState> {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    samosborActive: true,
    samosborCount: 1,
    worldEvents: createWorldEventState(),
  });
  resolvePlayerShelterAtSealForTests(ctx.world, ctx.entities, state, QUIET_TEST_VARIANT);
  return state;
}

test('prepared hermodoor room shelters player and publishes success event', () => {
  const ctx = makeShelterWorld(DoorState.HERMETIC_CLOSED);
  const state = resolveQuietSeal(ctx);

  assert.equal(ctx.world.rooms[TEST_SHELTER_ROOM_ID].sealed, true);
  const events = getRecentEvents(state, { tags: ['shelter', 'success'], limit: 4 });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'door_sealed');
  assert.equal(events[0].roomId, TEST_SHELTER_ROOM_ID);
});

test('unprepared shelter fails locally and publishes failure event', () => {
  const ctx = makeShelterWorld(DoorState.HERMETIC_OPEN);
  const state = resolveQuietSeal(ctx);

  assert.equal(ctx.world.rooms[TEST_SHELTER_ROOM_ID].sealed, false);
  assert.ok((ctx.player.hp ?? 50) < 50);
  assert.ok(ctx.world.fog.some(v => v >= 155));
  const events = getRecentEvents(state, { tags: ['shelter', 'failure'], limit: 4 });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'samosbor_warning');
  assert.equal(events[0].data?.hpDamage, 4);
});

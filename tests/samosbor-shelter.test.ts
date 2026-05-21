import { beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  ContainerKind,
  DoorState,
  EntityType,
  Faction,
  Feature,
  FloorLevel,
  LiftDirection,
  RoomType,
  Tex,
  ZoneFaction,
  type Entity,
} from '../src/core/types';
import { World } from '../src/core/world';
import {
  SAMOSBOR_VARIANTS,
  forceNextSamosborVariant,
  type ActiveSamosborVariant,
  type SamosborVariantId,
} from '../src/data/samosbor_variants';
import type { FloorGeneration } from '../src/gen/floor_manifest';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';
import {
  getSamosborWarningSnapshot,
  rebuildWorld,
  resetSamosborRuntimeForTests,
  resolvePlayerShelterAtSealForTests,
  updateSamosbor,
} from '../src/systems/samosbor';
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

function forceWarningWindow(variantId: SamosborVariantId): {
  state: ReturnType<typeof makeGameState>;
  warning: NonNullable<ReturnType<typeof getSamosborWarningSnapshot>>;
} {
  resetSamosborRuntimeForTests();
  const ctx = makeShelterWorld(DoorState.CLOSED);
  ctx.entities.push({
    id: ctx.nextId.v++,
    type: EntityType.NPC,
    x: 14.5,
    y: 14.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    name: 'Соседка',
    faction: Faction.CITIZEN,
    isFemale: true,
  });
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    samosborTimer: 12,
    worldEvents: createWorldEventState(),
  });
  assert.equal(forceNextSamosborVariant(variantId), true);
  assert.equal(updateSamosbor(ctx.world, ctx.entities, state, 0, ctx.nextId), false);
  const warning = getSamosborWarningSnapshot(state);
  assert.ok(warning, `${variantId} warning snapshot should exist`);
  return { state, warning };
}

function makeMaronaryGlowWorld(): {
  world: World;
  entities: Entity[];
  player: Entity;
  nextId: { v: number };
} {
  const world = new World();
  world.zones[0] = { id: 0, cx: 13, cy: 13, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  for (let y = 8; y <= 18; y++) {
    for (let x = 8; x <= 18; x++) {
      const ci = world.idx(x, y);
      world.set(x, y, Cell.FLOOR);
      world.zoneMap[ci] = 0;
    }
  }
  const screenIdx = world.idx(12, 10);
  world.set(12, 10, Cell.WALL);
  world.features[screenIdx] = Feature.SCREEN;
  world.zoneMap[screenIdx] = 0;
  world.screenCells = [screenIdx];

  const player = makePlayer(1, 12.5, 11.5);
  return { world, entities: [player], player, nextId: { v: 2 } };
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

test('samosbor warning publishes sound, HUD/log, map, and nearby NPC bark channels', () => {
  const { state, warning } = forceWarningWindow('classic');

  assert.equal(warning.variantId, 'classic');
  assert.equal(warning.tint, '#a34cff');
  assert.ok(warning.signals.channels.includes('audio'));
  assert.ok(warning.signals.channels.includes('hud'));
  assert.ok(warning.signals.channels.includes('log'));
  assert.ok(warning.signals.channels.includes('map'));
  assert.ok(warning.signals.channels.includes('npc_barks'));
  assert.match(warning.signals.audioLine, /сирена/);
  assert.match(warning.signals.mapLine, /зона риска/);
  assert.match(warning.signals.npcLine, /соседи: 1/);
  assert.ok(state.msgs.some(m => m.text.includes('Предупреждение принято')));
  assert.ok(state.msgs.some(m => m.text.includes('Соседка:')));

  const events = getRecentEvents(state, { type: 'samosbor_warning', tags: ['prewarning'], limit: 1 });
  assert.equal(events.length, 1);
  const channels = events[0].data?.warningChannels;
  assert.ok(Array.isArray(channels));
  assert.ok(channels.includes('audio'));
  assert.ok(channels.includes('map'));
  assert.ok(channels.includes('npc_barks'));
  assert.ok(state.msgLog.some(entry => entry.text.includes('звук:') && entry.text.includes('карта:')));
});

test('normal and rare samosbor warnings keep variant-specific colors and cues', () => {
  const cases: Array<{
    id: SamosborVariantId;
    tint: string;
    mapCode: string;
    audio: RegExp;
    map: RegExp;
  }> = [
    { id: 'classic', tint: '#a34cff', mapCode: 'СБОР', audio: /штатная сирена/, map: /зона риска/ },
    { id: 'maronary', tint: '#35ff66', mapCode: 'МАР', audio: /высокий писк/, map: /зелёный|повтор двери/ },
    { id: 'istotit', tint: '#d6a64b', mapCode: 'ИСТ', audio: /колокол/, map: /жёлтые укрытия/ },
    { id: 'veretar', tint: '#f4f1df', mapCode: 'ВЕР', audio: /внешняя тревога/, map: /белое пятно/ },
  ];

  for (const spec of cases) {
    const { warning } = forceWarningWindow(spec.id);
    assert.equal(warning.variantId, spec.id);
    assert.equal(warning.tint, spec.tint);
    assert.equal(warning.signals.mapCode, spec.mapCode);
    assert.match(warning.signals.audioLine, spec.audio);
    assert.match(warning.signals.mapLine, spec.map);
  }
});

test('maronary green source glow damages player near marked source', () => {
  resetSamosborRuntimeForTests();
  const ctx = makeMaronaryGlowWorld();
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    samosborTimer: 1,
    worldEvents: createWorldEventState(),
  });
  assert.equal(forceNextSamosborVariant('maronary'), true);

  assert.equal(updateSamosbor(ctx.world, ctx.entities, state, 0, ctx.nextId), false);
  const warning = getSamosborWarningSnapshot(state);
  assert.ok(warning);
  assert.equal(warning.variantId, 'maronary');
  assert.ok(warning.greenSourceCount > 0);

  const hpBefore = ctx.player.hp ?? 0;
  assert.equal(updateSamosbor(ctx.world, ctx.entities, state, 1, ctx.nextId), false);

  assert.ok((ctx.player.hp ?? 0) < hpBefore);
  assert.equal(state.lastDamage?.sourceKind, 'samosbor');
  assert.match(state.lastDamage?.detail ?? '', /Маронарий: зелёное свечение/);
  const events = getRecentEvents(state, { tags: ['glow_damage'], limit: 1 });
  assert.equal(events.length, 1);
  assert.equal(events[0].data?.damage, hpBefore - (ctx.player.hp ?? 0));
});

interface RuntimeGenerationCase {
  target: World;
  generation: FloorGeneration;
  entities: Entity[];
  nextId: { v: number };
  before: {
    cellVersion: number;
    surfaceVersion: number;
    wallTexVersion: number;
    floorTexVersion: number;
    fogVersion: number;
  };
  staleIdx: number;
  protectedIdx: number;
  screenIdx: number;
  surfaceIdx: number;
  teleportA: number;
  teleportB: number;
  smogIdx: number;
  smogNeighborIdx: number;
  trackCell: number;
  trackId: string;
  containerId: number;
}

function makePlayer(id: number, x: number, y: number): Entity {
  return {
    id,
    type: EntityType.PLAYER,
    x,
    y,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 3,
    sprite: 0,
    hp: 100,
    maxHp: 100,
    faction: Faction.PLAYER,
  };
}

function seedTargetRuntimeState(world: World, staleIdx: number): RuntimeGenerationCase['before'] {
  world.aptMask[staleIdx] = 1;
  world.hermoWall[staleIdx] = 1;
  world.fog[staleIdx] = 220;
  world.screenCells = [staleIdx];
  world.surfaceMap.set(staleIdx, new Uint8Array(1024));
  world.anomalyTeleports.set(staleIdx, world.idx(8, 8));
  world.anomalySmogSource = staleIdx;
  world.anomalySmogCells = [staleIdx];
  world.anomalySmogHandled = true;
  world.railTracks = [{ id: 'stale_track', label: 'stale', cells: [staleIdx], stationOffsets: [0], platformCells: [staleIdx], loop: true }];
  world.railTrains = [{
    id: 'stale_train',
    label: 'stale',
    trackId: 'stale_track',
    offset: 0,
    speed: 1,
    length: 1,
    direction: 1,
    stopSeconds: 1,
    stopUntil: -1,
    passengerId: -1,
    passengerSeat: -1,
    entityIds: [],
    lastStopOffset: 0,
    nextWarnAt: 0,
    nextCrushAt: 0,
    nextDoorMsgAt: 0,
  }];
  world.railTrainCells.set(staleIdx, 0);
  world.cellVersion = 11;
  world.surfaceVersion = 12;
  world.wallTexVersion = 13;
  world.floorTexVersion = 14;
  world.fogVersion = 15;
  return {
    cellVersion: world.cellVersion,
    surfaceVersion: world.surfaceVersion,
    wallTexVersion: world.wallTexVersion,
    floorTexVersion: world.floorTexVersion,
    fogVersion: world.fogVersion,
  };
}

function makeRuntimeGenerationCase(seed: number, floor: FloorLevel): RuntimeGenerationCase {
  const target = new World();
  const staleIdx = target.idx(5, 5);
  const before = seedTargetRuntimeState(target, staleIdx);

  const world = new World();
  const room = {
    id: 0,
    type: RoomType.STORAGE,
    x: 40 + seed * 3,
    y: 45 + seed * 3,
    w: 7,
    h: 7,
    doors: [] as number[],
    sealed: false,
    name: `runtime room ${seed}`,
    apartmentId: seed,
    wallTex: Tex.METAL,
    floorTex: Tex.F_TILE,
  };
  world.rooms[0] = room;
  world.apartmentRoomCount = 1;
  world.zones[0] = { id: 0, cx: room.x + 3, cy: room.y + 3, faction: ZoneFaction.CULTIST, hasLift: false, fogged: false, level: 3, hqRoomId: room.id };
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const ci = world.idx(x, y);
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = room.id;
      world.floorTex[ci] = Tex.F_TILE;
      world.zoneMap[ci] = 0;
      world.factionControl[ci] = ZoneFaction.CULTIST;
    }
  }

  const protectedIdx = world.idx(room.x + 1, room.y + 1);
  world.aptMask[protectedIdx] = 1;
  world.hermoWall[protectedIdx] = 1;
  const doorIdx = world.idx(room.x + room.w, room.y + 3);
  world.cells[doorIdx] = Cell.DOOR;
  world.roomMap[doorIdx] = room.id;
  world.zoneMap[doorIdx] = 0;
  world.doors.set(doorIdx, { idx: doorIdx, state: DoorState.CLOSED, roomA: room.id, roomB: -1, keyId: '', timer: 0 });
  room.doors.push(doorIdx);

  const screenIdx = world.idx(room.x + 2, room.y - 1);
  world.cells[screenIdx] = Cell.WALL;
  world.features[screenIdx] = Feature.SCREEN;
  world.wallTex[screenIdx] = Tex.SCREEN_BASE;
  world.screenCells = [screenIdx];
  const surfaceIdx = world.idx(room.x + 3, room.y + 3);
  const surface = new Uint8Array(1024);
  surface[3] = 180;
  world.surfaceMap.set(surfaceIdx, surface);
  world.surfaceVersion = 4;

  const teleportA = world.idx(room.x + 4, room.y + 4);
  const teleportB = world.idx(room.x + 5, room.y + 5);
  world.anomalyTeleports.set(teleportA, teleportB);
  const smogIdx = world.idx(room.x + 2, room.y + 2);
  const smogNeighborIdx = world.idx(room.x + 2, room.y + 3);
  world.anomalySmogSource = smogIdx;
  world.anomalySmogCells = [smogIdx, smogNeighborIdx];
  world.anomalySmogHandled = seed % 2 === 0;
  world.fog[smogIdx] = 77;
  world.liftDir[teleportA] = LiftDirection.UP;
  world.slideCells = [screenIdx, world.idx(room.x + 4, room.y - 1)];

  const trackCell = world.idx(room.x + 1, room.y + 5);
  const trackId = `runtime_track_${seed}`;
  world.railTracks = [{ id: trackId, label: 'Runtime rail', cells: [trackCell], stationOffsets: [0], platformCells: [trackCell], loop: true }];
  world.railTrains = [{
    id: `runtime_train_${seed}`,
    label: 'Runtime train',
    trackId,
    offset: 0,
    speed: 2,
    length: 1,
    direction: 1,
    stopSeconds: 2,
    stopUntil: -1,
    passengerId: -1,
    passengerSeat: -1,
    entityIds: [],
    lastStopOffset: 0,
    nextWarnAt: 0,
    nextCrushAt: 0,
    nextDoorMsgAt: 0,
  }];
  world.railTrainCells.set(trackCell, 0);

  const containerId = 900 + seed;
  world.addContainer({
    id: containerId,
    x: room.x + 2,
    y: room.y + 2,
    floor,
    roomId: room.id,
    zoneId: 0,
    kind: ContainerKind.TOOL_LOCKER,
    name: `Runtime locker ${seed}`,
    inventory: [{ defId: 'water', count: 1 }],
    capacitySlots: 4,
    access: 'public',
    discovered: true,
    tags: ['runtime_replace_test'],
  });

  const entities = [makePlayer(1, room.x + 1.5, room.y + 1.5)];
  const generatedNpc = {
    id: 50 + seed,
    type: EntityType.NPC,
    x: room.x + 2.5,
    y: room.y + 2.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    faction: Faction.CITIZEN,
  } satisfies Entity;

  return {
    target,
    generation: { world, entities: [generatedNpc], spawnX: room.x + 1.5, spawnY: room.y + 1.5 },
    entities,
    nextId: { v: 1000 },
    before,
    staleIdx,
    protectedIdx,
    screenIdx,
    surfaceIdx,
    teleportA,
    teleportB,
    smogIdx,
    smogNeighborIdx,
    trackCell,
    trackId,
    containerId,
  };
}

function runReplacementRebuild(seed: number, floor: FloorLevel): RuntimeGenerationCase {
  const ctx = makeRuntimeGenerationCase(seed, floor);
  rebuildWorld(ctx.target, ctx.entities, ctx.nextId, seed, floor, ctx.generation);
  return ctx;
}

function assertDirtyVersionsBumped(ctx: RuntimeGenerationCase): void {
  assert.equal(ctx.target.cellVersion, (ctx.before.cellVersion + 1) | 0);
  assert.equal(ctx.target.surfaceVersion, (ctx.before.surfaceVersion + 1) | 0);
  assert.equal(ctx.target.wallTexVersion, (ctx.before.wallTexVersion + 1) | 0);
  assert.equal(ctx.target.floorTexVersion, (ctx.before.floorTexVersion + 1) | 0);
  assert.equal(ctx.target.fogVersion, (ctx.before.fogVersion + 1) | 0);
}

test('story-floor samosbor rebuild copies generated protected state and bumps dirty versions', () => {
  const ctx = runReplacementRebuild(1, FloorLevel.MINISTRY);

  assert.equal(ctx.target.aptMask[ctx.protectedIdx], 1);
  assert.equal(ctx.target.hermoWall[ctx.protectedIdx], 1);
  assert.equal(ctx.target.aptMask[ctx.staleIdx], 0);
  assert.equal(ctx.target.hermoWall[ctx.staleIdx], 0);
  assert.equal(ctx.target.apartmentRoomCount, 1);
  assert.equal(ctx.entities.some(e => e.type === EntityType.PLAYER), true);
  assert.equal(ctx.entities.some(e => e.type === EntityType.NPC && e.id >= 1000), true);
  assertDirtyVersionsBumped(ctx);
});

test('design-floor samosbor rebuild resets stale screens and surfaces from replacement', () => {
  const ctx = runReplacementRebuild(2, FloorLevel.LIVING);

  assert.deepEqual(ctx.target.screenCells, [ctx.screenIdx]);
  assert.equal(ctx.target.surfaceMap.has(ctx.surfaceIdx), true);
  assert.equal(ctx.target.surfaceMap.has(ctx.staleIdx), false);
  assert.equal(ctx.target.containers.some(c => c.id === ctx.containerId), true);
  assert.equal(ctx.target.containerById.get(ctx.containerId)?.name, 'Runtime locker 2');
  assert.equal(ctx.target.containerMap.get(ctx.target.idx(ctx.generation.world.containers[0].x, ctx.generation.world.containers[0].y))?.includes(ctx.containerId), true);
  assertDirtyVersionsBumped(ctx);
});

test('procedural samosbor rebuild copies anomaly, smog, fog and rail runtime state', () => {
  const ctx = runReplacementRebuild(3, FloorLevel.MAINTENANCE);

  assert.equal(ctx.target.anomalyTeleports.get(ctx.teleportA), ctx.teleportB);
  assert.equal(ctx.target.anomalyTeleports.has(ctx.staleIdx), false);
  assert.equal(ctx.target.anomalySmogSource, ctx.smogIdx);
  assert.deepEqual(ctx.target.anomalySmogCells, [ctx.smogIdx, ctx.smogNeighborIdx]);
  assert.equal(ctx.target.anomalySmogHandled, false);
  assert.equal(ctx.target.fog[ctx.smogIdx], 77);
  assert.equal(ctx.target.fog[ctx.staleIdx], 0);
  assert.equal(ctx.target.railTracks[0]?.id, ctx.trackId);
  assert.equal(ctx.target.railTrains[0]?.trackId, ctx.trackId);
  assert.equal(ctx.target.railTrainCells.get(ctx.trackCell), 0);
  assert.equal(ctx.target.liftDir[ctx.teleportA], LiftDirection.UP);
  assertDirtyVersionsBumped(ctx);
});

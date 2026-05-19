import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, FloorLevel, LiftDirection } from '../src/core/types';
import {
  FLOOR_RUN_MAX_Z,
  FLOOR_RUN_MIN_Z,
  FLOOR_RUN_VOID_Z,
  PROCEDURAL_FLOOR_COUNT,
  PROCEDURAL_FLOOR_ZS,
  makeProceduralFloorSpec,
  zForStoryFloor,
} from '../src/data/procedural_floors';
import { DESIGN_FLOOR_ROUTES } from '../src/data/design_floors';
import {
  BAD_APPLE_HEIGHT,
  BAD_APPLE_WIDTH,
  drawBadAppleFrame,
} from '../src/data/bad_apple_frames';
import {
  commitFloorRunEntry,
  resolveFloorRunRoute,
  setFloorRunState,
} from '../src/systems/procedural_floors';
import { updateBadAppleWorldAnomaly } from '../src/systems/procedural_anomalies/bad_apple_world';
import { generateProceduralFloor } from '../src/gen/procedural_floor';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import { generateFloor } from '../src/gen/floor_manifest';
import { makeGameState } from './helpers';

test('floor run inserts three procedural floors before the next lower authored floor', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(state, { runSeed: 123, currentZ: 0, specs: {}, visited: {} }, FloorLevel.LIVING);

  const first = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(first?.z, 1);
  assert.equal(first?.procedural, true);
  commitFloorRunEntry(state, first!);

  const second = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(second?.z, 2);
  assert.equal(second?.procedural, true);
  commitFloorRunEntry(state, second!);

  const third = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(third?.z, 3);
  assert.equal(third?.procedural, true);
  commitFloorRunEntry(state, third!);

  const authored = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(authored?.z, 4);
  assert.equal(authored?.designFloorId, 'floor_69');
  assert.equal(authored?.baseFloor, FloorLevel.MAINTENANCE);
});

test('floor run keeps default authored cadence with the bank procedural-gap exception', () => {
  const anchors = [
    zForStoryFloor(FloorLevel.MINISTRY),
    zForStoryFloor(FloorLevel.KVARTIRY),
    zForStoryFloor(FloorLevel.LIVING),
    zForStoryFloor(FloorLevel.MAINTENANCE),
    zForStoryFloor(FloorLevel.HELL),
    zForStoryFloor(FloorLevel.VOID),
    ...DESIGN_FLOOR_ROUTES.map(def => def.z),
  ].sort((a, b) => a - b);

  assert.equal(anchors[0], FLOOR_RUN_MIN_Z);
  assert.equal(anchors.at(-1), FLOOR_RUN_MAX_Z);
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    const bankGap = (prev === -24 && curr === -22) || (prev === -22 && curr === -20);
    assert.equal(curr - prev, bankGap ? 2 : 4);
  }
});

test('floor run places pioneer camp one authored step above upper bureau', () => {
  const state = makeGameState({ currentFloor: FloorLevel.MINISTRY });
  setFloorRunState(state, { runSeed: 789, currentZ: -24, specs: {}, visited: {} }, FloorLevel.MINISTRY);

  for (const expectedZ of [-25, -26, -27]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const upperBureau = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(upperBureau?.z, -28);
  assert.equal(upperBureau?.designFloorId, 'upper_bureau');
  commitFloorRunEntry(state, upperBureau!);

  for (const expectedZ of [-29, -30, -31]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const camp = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(camp?.z, -32);
  assert.equal(camp?.designFloorId, 'pioneer_camp');
  assert.equal(camp?.baseFloor, FloorLevel.LIVING);
});

test('floor run exposes seeded procedural slots across the normal lift span', () => {
  assert.equal(PROCEDURAL_FLOOR_COUNT, 62);
  assert.equal(PROCEDURAL_FLOOR_ZS[0], -43);
  assert.equal(PROCEDURAL_FLOOR_ZS.at(-1), 39);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(1), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-25), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-22), false);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-32), false);

  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(state, { runSeed: 456, currentZ: 0, specs: {}, visited: {} }, FloorLevel.LIVING);

  for (const expectedZ of [-1, -2, -3]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const communalRing = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(communalRing?.z, -4);
  assert.equal(communalRing?.designFloorId, 'communal_ring');
  commitFloorRunEntry(state, communalRing!);

  for (const expectedZ of [-5, -6, -7]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const crossroads = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(crossroads?.z, -8);
  assert.equal(crossroads?.designFloorId, 'manhattan_crossroads');
  commitFloorRunEntry(state, crossroads!);

  for (const expectedZ of [-9, -10, -11]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const kvartiry = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(kvartiry?.z, -12);
  assert.equal(kvartiry?.storyFloor, FloorLevel.KVARTIRY);
});

test('procedural floor specs are deterministic from run seed and z', () => {
  const a = makeProceduralFloorSpec(999, 2);
  const b = makeProceduralFloorSpec(999, 2);
  const c = makeProceduralFloorSpec(999, 3);

  assert.deepEqual(a, b);
  assert.notEqual(a.seed, c.seed);
});

test('procedural floor generator returns a playable non-story floor', () => {
  const spec = makeProceduralFloorSpec(321, 2);
  const gen = generateProceduralFloor(spec);
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const liftUp = gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT);
  const liftDown = gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(liftUp, true);
  assert.equal(liftDown, true);
  assert.equal(gen.entities.some(e => e.type === EntityType.NPC), true);
  assert.equal(gen.entities.some(e => e.type === EntityType.MONSTER), true);
  assert.equal(gen.entities.some(e => e.type === EntityType.ITEM_DROP), true);
});

test('void and lower route floors do not generate NPCs', () => {
  const voidGen = generateFloor(FloorLevel.VOID);
  assert.equal(voidGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(voidGen.entities.some(e => e.type === EntityType.MONSTER), true);

  const base = makeProceduralFloorSpec(321, FLOOR_RUN_VOID_Z + 1);
  const procGen = generateProceduralFloor({
    ...base,
    anomalyId: 'smog',
    title: `говнячный смог: ${base.title}`,
  });
  assert.equal(procGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(procGen.entities.some(e => e.type === EntityType.MONSTER), true);

  const darknessGen = generateDesignFloor('darkness');
  assert.equal(darknessGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(darknessGen.entities.some(e => e.type === EntityType.MONSTER), true);
});

test('rail train anomaly generates tracks, trains, and rideable train entities', () => {
  const base = makeProceduralFloorSpec(654, 2);
  const spec = {
    ...base,
    anomalyId: 'rail_trains' as const,
    danger: Math.max(2, base.danger) as typeof base.danger,
    title: `поезда: ${base.title}`,
  };
  const gen = generateProceduralFloor(spec);

  assert.equal(gen.world.railTracks.length > 0, true);
  assert.equal(gen.world.railTrains.length > 0, true);
  assert.equal(gen.world.railTracks[0].stationOffsets.length > 0, true);
  assert.equal(gen.world.railTracks[0].platformCells.length > 0, true);
  assert.equal(gen.world.railTrains[0].entityIds.every(id => gen.entities.some(e => e.id === id && e.type === EntityType.ITEM_DROP)), true);
});

test('bad apple frame pack decodes 144x108 binary frames', () => {
  const pixels = new Uint8Array(BAD_APPLE_WIDTH * BAD_APPLE_HEIGHT);
  drawBadAppleFrame(pixels, 60);

  let black = 0;
  for (const px of pixels) {
    assert.equal(px === 0 || px === 1, true);
    black += px;
  }

  assert.equal(BAD_APPLE_WIDTH, 144);
  assert.equal(BAD_APPLE_HEIGHT, 108);
  assert.equal(black > 0 && black < pixels.length, true);
});

test('bad apple anomaly stamps an honest 144x108 map rectangle', () => {
  const base = makeProceduralFloorSpec(777, 2);
  const spec = {
    ...base,
    anomalyId: 'bad_apple_world' as const,
    danger: Math.max(3, base.danger) as typeof base.danger,
    title: `bad apple!: ${base.title}`,
  };
  const gen = generateProceduralFloor(spec);
  const room = gen.world.rooms.find(r => r.name.startsWith('Bad Apple!'));

  assert.equal(!!room, true);
  assert.equal(room?.w, BAD_APPLE_WIDTH);
  assert.equal(room?.h, BAD_APPLE_HEIGHT);
  assert.equal(gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))], Cell.FLOOR);

  let owned = 0;
  for (let dy = 0; dy < BAD_APPLE_HEIGHT; dy++) {
    for (let dx = 0; dx < BAD_APPLE_WIDTH; dx++) {
      const ci = gen.world.idx((room?.x ?? 0) + dx, (room?.y ?? 0) + dy);
      if (gen.world.roomMap[ci] === room?.id) owned++;
    }
  }
  assert.equal(owned, BAD_APPLE_WIDTH * BAD_APPLE_HEIGHT);
});

test('bad apple runtime advances the map rectangle into white floor cells', () => {
  const base = makeProceduralFloorSpec(778, 2);
  const spec = {
    ...base,
    anomalyId: 'bad_apple_world' as const,
    danger: Math.max(3, base.danger) as typeof base.danger,
    title: `bad apple!: ${base.title}`,
  };
  const gen = generateProceduralFloor(spec);
  const room = gen.world.rooms.find(r => r.name.startsWith('Bad Apple!'));
  assert.equal(!!room, true);

  const state = makeGameState({ currentFloor: spec.baseFloor });
  const player = {
    id: 999999,
    type: EntityType.PLAYER,
    x: gen.spawnX,
    y: gen.spawnY,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 3,
    sprite: 0,
    hp: 100,
    maxHp: 100,
  };
  const beforeVersion = gen.world.cellVersion;
  updateBadAppleWorldAnomaly(gen.world, player, state, 0.4);

  let whiteFloor = 0;
  for (let dy = 0; dy < BAD_APPLE_HEIGHT; dy++) {
    for (let dx = 0; dx < BAD_APPLE_WIDTH; dx++) {
      const ci = gen.world.idx((room?.x ?? 0) + dx, (room?.y ?? 0) + dy);
      if (gen.world.cells[ci] === Cell.FLOOR) whiteFloor++;
    }
  }

  assert.equal(whiteFloor > 0, true);
  assert.equal(gen.world.cellVersion > beforeVersion, true);
});

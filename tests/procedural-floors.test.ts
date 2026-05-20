import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, Feature, FloorLevel, LiftDirection, MonsterKind, W } from '../src/core/types';
import {
  FLOOR_GEOMETRIES,
  FLOOR_RUN_MAX_Z,
  FLOOR_RUN_MIN_Z,
  FLOOR_RUN_VOID_Z,
  PROCEDURAL_FLOOR_COUNT,
  PROCEDURAL_FLOOR_ZS,
  makeProceduralFloorSpec,
  zForStoryFloor,
} from '../src/data/procedural_floors';
import { DESIGN_FLOOR_ROUTES } from '../src/data/design_floors';
import { PROCEDURAL_POPULATION_PROFILE } from '../src/data/population_profiles';
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
import { tryZombieApocalypseInfection } from '../src/systems/procedural_anomalies/zombie_apocalypse';
import { routeCueCount } from '../src/systems/route_cues';
import { generateProceduralFloor } from '../src/gen/procedural_floor';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import { generateFloor } from '../src/gen/floor_manifest';
import type { World } from '../src/core/world';
import { makeGameState } from './helpers';

function playableBounds(world: World): { count: number; minX: number; minY: number; maxX: number; maxY: number } {
  const out = { count: 0, minX: W, minY: W, maxX: -1, maxY: -1 };
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const cell = world.cells[world.idx(x, y)];
      if (cell !== Cell.FLOOR && cell !== Cell.WATER && cell !== Cell.DOOR && cell !== Cell.LIFT) continue;
      out.count++;
      if (x < out.minX) out.minX = x;
      if (y < out.minY) out.minY = y;
      if (x > out.maxX) out.maxX = x;
      if (y > out.maxY) out.maxY = y;
    }
  }
  return out;
}

function assertFullFootprint(world: World, label: string): void {
  const bounds = playableBounds(world);
  assert.equal(bounds.minX, 0, `${label} minX`);
  assert.equal(bounds.minY, 0, `${label} minY`);
  assert.equal(bounds.maxX, W - 1, `${label} maxX`);
  assert.equal(bounds.maxY, W - 1, `${label} maxY`);
  assert.equal(bounds.count >= 18_000, true, `${label} playable cells`);
}

function reachableCells(gen: ReturnType<typeof generateProceduralFloor>): Uint8Array {
  const world = gen.world;
  const out = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  const start = world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
  out[start] = 1;
  queue[tail++] = start;

  while (head < tail) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const ni = world.idx(x + dx, y + dy);
      if (out[ni]) continue;
      if (world.cells[ni] !== Cell.FLOOR && world.cells[ni] !== Cell.DOOR && world.cells[ni] !== Cell.WATER) continue;
      out[ni] = 1;
      queue[tail++] = ni;
    }
  }

  return out;
}

function hasReachableLift(gen: ReturnType<typeof generateProceduralFloor>, reachable: Uint8Array, direction: LiftDirection): boolean {
  const world = gen.world;
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      if (reachable[world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

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

test('service spine geometry carves connected maintenance trunks with usable lifts', () => {
  const def = FLOOR_GEOMETRIES.find(item => item.id === 'service_spines');
  assert.equal(def?.minZ, 9);
  assert.equal(def?.maxZ, 23);
  assert.equal(def?.tags.includes('service'), true);

  const base = makeProceduralFloorSpec(9127, 17);
  const gen = generateProceduralFloor({
    ...base,
    geometryId: 'service_spines',
    baseFloor: FloorLevel.MAINTENANCE,
    anomalyId: 'none',
    title: `сервисные штреки: ${base.title}`,
  });
  const reachable = reachableCells(gen);
  const spineRooms = gen.world.rooms.filter(room => room.name.includes('сервисного штрека'));

  assert.equal(spineRooms.length >= 2, true);
  for (const room of spineRooms) {
    const ci = gen.world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2));
    assert.equal(reachable[ci], 1);
  }
  assert.equal(hasReachableLift(gen, reachable, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, reachable, LiftDirection.DOWN), true);

  let serviceFixtures = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    const feature = gen.world.features[i];
    if (
      reachable[i] &&
      gen.world.roomMap[i] < 0 &&
      (feature === Feature.SCREEN || feature === Feature.APPARATUS || feature === Feature.MACHINE)
    ) {
      serviceFixtures++;
    }
  }
  assert.equal(serviceFixtures > 0, true);
});

test('procedural monster pressure stays capped and registers a route cue', () => {
  const base = makeProceduralFloorSpec(2468, 29);
  const gen = generateProceduralFloor({
    ...base,
    danger: 5,
    anomalyId: 'samosbor_seed',
    title: `поражение самосбором: ${base.title}`,
    monsterBiasKinds: [MonsterKind.HERALD, MonsterKind.MANCOBUS, MonsterKind.KOSTOREZ, MonsterKind.NIGHTMARE],
  });
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const rareKinds = new Set([MonsterKind.HERALD, MonsterKind.MANCOBUS, MonsterKind.KOSTOREZ, MonsterKind.NIGHTMARE]);

  assert.equal(monsters.length <= PROCEDURAL_POPULATION_PROFILE.monsterCap, true);
  assert.equal(monsters.length >= 1000, true);
  assert.equal(monsters.every(e => e.ai), true);
  assert.equal(monsters.filter(e => e.monsterKind !== undefined && rareKinds.has(e.monsterKind)).length <= 2, true);
  assert.equal(routeCueCount(gen.world), 1);
});

test('zombie apocalypse procedural specs bias monster pressure to мертвяки', () => {
  const spec = makeProceduralFloorSpec(1, 14);
  assert.equal(spec.anomalyId, 'zombie_apocalypse');
  assert.deepEqual(spec.monsterBiasKinds, [MonsterKind.ZOMBIE]);
});

test('deep procedural route floors use route floor identity for monster mix', () => {
  const base = makeProceduralFloorSpec(1357, 29);
  const gen = generateProceduralFloor({
    ...base,
    danger: 4,
    anomalyId: 'none',
    title: base.title,
    monsterBiasKinds: [MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK],
  });
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const bureaucratic = new Set([MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK]);

  assert.equal(monsters.length > 0, true);
  assert.equal(monsters.some(e => e.monsterKind !== undefined && bureaucratic.has(e.monsterKind)), false);
});

test('void and lower route floors do not generate NPCs', () => {
  const voidGen = generateFloor(FloorLevel.VOID);
  assert.equal(voidGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(voidGen.entities.some(e => e.type === EntityType.MONSTER), true);
  assertFullFootprint(voidGen.world, 'VOID story floor');

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
  assertFullFootprint(darknessGen.world, 'darkness design floor');
});

test('authored design floors occupy the full 1024x1024 route footprint', () => {
  for (const route of DESIGN_FLOOR_ROUTES) {
    assertFullFootprint(generateDesignFloor(route.id).world, route.id);
  }
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

test('zombie apocalypse anomaly seeds a dense crowd and patient zero infection', () => {
  const base = makeProceduralFloorSpec(779, 2);
  const spec = {
    ...base,
    anomalyId: 'zombie_apocalypse' as const,
    geometryId: 'apartment_pressure' as const,
    baseFloor: FloorLevel.KVARTIRY,
    danger: 5 as const,
    monsterBiasKinds: [MonsterKind.SHADOW],
    title: `зомби-апокалипсис: ${base.title}`,
  };
  const gen = generateProceduralFloor(spec);
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const zombiesBeforeInfection = gen.entities.filter(e => e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.ZOMBIE);
  const patientZero = gen.entities.find(e => e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.ZOMBIE && e.name === 'Пациент зеро');

  assert.equal(npcs.length >= 10_000, true);
  assert.equal(npcs.every(e => e.ai), true);
  assert.equal(!!patientZero, true);
  assert.equal(gen.entities.some(e => e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.SHADOW), false);
  assert.equal(zombiesBeforeInfection.length > 1, true);
  assert.equal(npcs.some(e => e.ai), true);

  const state = makeGameState({ currentFloor: spec.baseFloor, time: 1 });
  setFloorRunState(state, {
    runSeed: 779,
    currentZ: spec.z,
    specs: { [spec.key]: spec },
    visited: {},
  }, spec.baseFloor);

  const target = npcs[0];
  const infected = tryZombieApocalypseInfection(gen.world, patientZero!, target, state, state.msgs, state.time);
  assert.equal(infected, true);
  assert.equal(target.type, EntityType.MONSTER);
  assert.equal(target.monsterKind, MonsterKind.ZOMBIE);
  assert.notEqual(target.monsterKind, MonsterKind.SHADOW);
  assert.equal(!!target.ai, true);
});

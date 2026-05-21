import { after, test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, Feature, FloorLevel, LiftDirection, MonsterKind, Tex, W } from '../src/core/types';
import {
  FLOOR_GEOMETRIES,
  FLOOR_RUN_MAX_Z,
  FLOOR_RUN_MIN_Z,
  FLOOR_RUN_VOID_Z,
  PROCEDURAL_FLOOR_COUNT,
  PROCEDURAL_FLOOR_ZS,
  floorRunProfileZ,
  makeProceduralFloorSpec,
  type ProceduralFloorSpec,
  zForStoryFloor,
} from '../src/data/procedural_floors';
import { DESIGN_FLOOR_ROUTES } from '../src/data/design_floors';
import { ENTITY_SOFT_LIMITS } from '../src/data/entity_limits';
import { PROCEDURAL_POPULATION_PROFILES } from '../src/data/population_profiles';
import {
  BAD_APPLE_HEIGHT,
  BAD_APPLE_WIDTH,
  drawBadAppleFrame,
} from '../src/data/bad_apple_frames';
import {
  commitFloorRunEntry,
  currentFloorRunEntry,
  currentFloorRunLabel,
  floorRunArrivalLead,
  floorRunEntryKind,
  floorRunEntryLiftLabel,
  floorRunEntryMapLabel,
  floorRunEntryRouteCard,
  floorRunStateForSave,
  resolveFloorRunRoute,
  setFloorRunState,
} from '../src/systems/procedural_floors';
import {
  floorInstanceStateForSave,
  floorInstanceWorldKey,
  setFloorInstanceState,
} from '../src/systems/floor_instances';
import {
  currentMapEditorFloorKey,
  getMapEditorSnapshot,
  replayMapEditorPatchForCurrentFloor,
  setMapEditorPatchState,
} from '../src/systems/map_editor';
import { currentNetTerminalGenFloorKey } from '../src/systems/net_terminal_gen';
import { updateBadAppleWorldAnomaly } from '../src/systems/procedural_anomalies/bad_apple_world';
import { updateLivingTunnelsAnomaly } from '../src/systems/procedural_anomalies/living_tunnels';
import { tryZombieApocalypseInfection } from '../src/systems/procedural_anomalies/zombie_apocalypse';
import { routeCueCount } from '../src/systems/route_cues';
import { getEmergencyPanels } from '../src/systems/emergency_panels';
import { generateProceduralFloor } from '../src/gen/procedural_floor';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import { generateFloor } from '../src/gen/floor_manifest';
import {
  World,
  auditReachability,
  describeReachability,
  hasReachableAdjacentCell,
  type ReachabilityAudit,
} from '../src/core/world';
import { printSlowestFloorGenerators, timeFloorGeneration } from './generator_helpers';
import { makeGameState, makeTestPlayer } from './helpers';

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

function maxEntitiesInArea(entities: readonly { alive: boolean; type: EntityType; x: number; y: number }[], type: EntityType, areaSize: number): number {
  const side = Math.ceil(W / areaSize);
  const counts = new Int32Array(side * side);
  let max = 0;
  for (const entity of entities) {
    if (!entity.alive || entity.type !== type) continue;
    const bx = Math.min(side - 1, Math.max(0, Math.floor(entity.x / areaSize)));
    const by = Math.min(side - 1, Math.max(0, Math.floor(entity.y / areaSize)));
    const next = ++counts[by * side + bx];
    if (next > max) max = next;
  }
  return max;
}

function assertFullFootprint(world: World, label: string): void {
  const bounds = playableBounds(world);
  assert.equal(bounds.minX, 0, `${label} minX`);
  assert.equal(bounds.minY, 0, `${label} minY`);
  assert.equal(bounds.maxX, W - 1, `${label} maxX`);
  assert.equal(bounds.maxY, W - 1, `${label} maxY`);
  assert.equal(bounds.count >= 18_000, true, `${label} playable cells`);
}

function reachabilityAudit(gen: ReturnType<typeof generateProceduralFloor>): ReachabilityAudit {
  const world = gen.world;
  const start = world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
  return auditReachability(world, start);
}

function hasReachableLift(gen: ReturnType<typeof generateProceduralFloor>, audit: ReachabilityAudit, direction: LiftDirection): boolean {
  const world = gen.world;
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    if (hasReachableAdjacentCell(world, audit, i)) return true;
  }
  return false;
}

function assertAuditReachable(world: World, audit: ReachabilityAudit, idx: number, label: string): void {
  assert.equal(audit.reachable[idx], 1, `${label}: ${describeReachability(audit, world, idx)}`);
}

const RUN_GENERATION_MATRIX = process.env.GIGAHRUSH_GENERATION_MATRIX === '1';
const GENERATION_SKIP_REASON = 'run npm run test:generation for the full generation matrix';
const P0_REACHABILITY_FAST_CASES = [
  { runSeed: 96, z: 1 },
  { runSeed: 321, z: 9 },
  { runSeed: 42, z: 25 },
] as const;
const P0_REACHABILITY_RUN_SEEDS = [42, 96, 321] as const;
const P0_REACHABILITY_ZS = [-43, -35, -27, -23, -19, -11, -3, 1, 9, 17, 21, 25, 33, 39] as const;

after(() => printSlowestFloorGenerators());

function testGenerationMatrix(name: string, fn: () => void): void {
  test(name, { skip: RUN_GENERATION_MATRIX ? false : GENERATION_SKIP_REASON }, fn);
}

function timedProceduralFloor(runSeed: number, z: number, prefix: string): ReturnType<typeof generateProceduralFloor> {
  const spec = makeProceduralFloorSpec(runSeed, z);
  return timedProceduralSpec(spec, `${prefix} seed=${runSeed}`);
}

function timedProceduralSpec(spec: ProceduralFloorSpec, prefix: string): ReturnType<typeof generateProceduralFloor> {
  return timeFloorGeneration(
    `${prefix} z=${spec.z} ${spec.geometryId}/${spec.majorityId}/${spec.anomalyId} d${spec.danger}`,
    () => generateProceduralFloor(spec),
  );
}

type DangerBandId = 'upper' | 'residential' | 'industrial' | 'hellVoid';

interface DangerBandSummary {
  slots: number;
  averageTimes100: number;
  dangerCounts: number[];
}

const DANGER_SNAPSHOT_SEEDS = [41, 4101, 4102, 4103, 4104] as const;

function dangerBandForZ(z: number): DangerBandId {
  const profileZ = floorRunProfileZ(z);
  if (profileZ <= -13) return 'upper';
  if (profileZ <= 8) return 'residential';
  if (profileZ <= 27) return 'industrial';
  return 'hellVoid';
}

function summarizeDangerDeck(): Record<DangerBandId, DangerBandSummary> {
  const rows: Record<DangerBandId, { slots: number; sum: number; dangerCounts: number[] }> = {
    upper: { slots: 0, sum: 0, dangerCounts: [0, 0, 0, 0, 0] },
    residential: { slots: 0, sum: 0, dangerCounts: [0, 0, 0, 0, 0] },
    industrial: { slots: 0, sum: 0, dangerCounts: [0, 0, 0, 0, 0] },
    hellVoid: { slots: 0, sum: 0, dangerCounts: [0, 0, 0, 0, 0] },
  };

  for (const seed of DANGER_SNAPSHOT_SEEDS) {
    for (const z of PROCEDURAL_FLOOR_ZS) {
      const spec = makeProceduralFloorSpec(seed, z);
      const row = rows[dangerBandForZ(z)];
      row.slots++;
      row.sum += spec.danger;
      row.dangerCounts[spec.danger - 1]++;
    }
  }

  return {
    upper: {
      slots: rows.upper.slots,
      averageTimes100: Math.round(rows.upper.sum * 100 / rows.upper.slots),
      dangerCounts: rows.upper.dangerCounts,
    },
    residential: {
      slots: rows.residential.slots,
      averageTimes100: Math.round(rows.residential.sum * 100 / rows.residential.slots),
      dangerCounts: rows.residential.dangerCounts,
    },
    industrial: {
      slots: rows.industrial.slots,
      averageTimes100: Math.round(rows.industrial.sum * 100 / rows.industrial.slots),
      dangerCounts: rows.industrial.dangerCounts,
    },
    hellVoid: {
      slots: rows.hellVoid.slots,
      averageTimes100: Math.round(rows.hellVoid.sum * 100 / rows.hellVoid.slots),
      dangerCounts: rows.hellVoid.dangerCounts,
    },
  };
}

function summarizeAnomalyPressure(): Record<'none' | 'anomaly', { slots: number; averageTimes100: number; danger5: number }> {
  const rows = {
    none: { slots: 0, sum: 0, danger5: 0 },
    anomaly: { slots: 0, sum: 0, danger5: 0 },
  };

  for (const seed of DANGER_SNAPSHOT_SEEDS) {
    for (const z of PROCEDURAL_FLOOR_ZS) {
      const spec = makeProceduralFloorSpec(seed, z);
      const row = spec.anomalyId === 'none' ? rows.none : rows.anomaly;
      row.slots++;
      row.sum += spec.danger;
      if (spec.danger === 5) row.danger5++;
    }
  }

  return {
    none: {
      slots: rows.none.slots,
      averageTimes100: Math.round(rows.none.sum * 100 / rows.none.slots),
      danger5: rows.none.danger5,
    },
    anomaly: {
      slots: rows.anomaly.slots,
      averageTimes100: Math.round(rows.anomaly.sum * 100 / rows.anomaly.slots),
      danger5: rows.anomaly.danger5,
    },
  };
}

test('floor run inserts three procedural floors before the next lower authored floor', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(state, { runSeed: 123, currentZ: 0, specs: {}, visited: {} }, FloorLevel.LIVING);

  const first = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(first?.z, -1);
  assert.equal(first?.procedural, true);
  commitFloorRunEntry(state, first!);

  const second = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(second?.z, -2);
  assert.equal(second?.procedural, true);
  commitFloorRunEntry(state, second!);

  const third = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(third?.z, -3);
  assert.equal(third?.procedural, true);
  commitFloorRunEntry(state, third!);

  const authored = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(authored?.z, -4);
  assert.equal(authored?.designFloorId, 'floor_69');
  assert.equal(authored?.baseFloor, FloorLevel.MAINTENANCE);
});

test('floor run UX labels expose z, route id, danger, anomaly and return path', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(state, { runSeed: 123, currentZ: 0, specs: {}, visited: {} }, FloorLevel.LIVING);

  assert.match(currentFloorRunLabel(state) ?? '', /Z\+0 story:living риск 1\/5/);
  assert.equal(floorRunEntryKind(currentFloorRunEntry(state)), 'story');
  assert.match(floorRunEntryRouteCard(currentFloorRunEntry(state)), /СЮЖЕТНЫЙ ЯКОРЬ Z\+0 story:living риск 1\/5: Жилая зона\. домашний hub, подготовка, возврат\./);

  const first = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(first?.procedural, true);
  assert.equal(floorRunEntryKind(first!), 'procedural');
  assert.match(floorRunEntryLiftLabel(first!), /ВЫЛАЗКА Z-1 z-1 риск \d\/5:/);
  assert.match(floorRunEntryMapLabel(first!), /Z-1 z-1 риск \d\/5/);
  assert.match(floorRunEntryRouteCard(first!), /ВЫЛАЗКА Z-1 z-1 риск \d\/5: .+\. .+, .+, .+\./);
  assert.match(floorRunArrivalLead(first!, LiftDirection.UP), /Зацепка: ВЫЛАЗКА Z-1 z-1 риск \d\/5: .+\. .+ Возврат: лифт ↑ к предыдущему Z\./);

  commitFloorRunEntry(state, first!);
  commitFloorRunEntry(state, resolveFloorRunRoute(state, LiftDirection.DOWN)!);
  commitFloorRunEntry(state, resolveFloorRunRoute(state, LiftDirection.DOWN)!);
  const authored = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(authored?.designFloorId, 'floor_69');
  assert.equal(floorRunEntryKind(authored!), 'design');
  assert.match(floorRunEntryLiftLabel(authored!), /РУЧНОЙ МАРШРУТ Z-4 floor_69 риск 3\/5/);
  assert.match(floorRunEntryRouteCard(authored!), /РУЧНОЙ МАРШРУТ Z-4 floor_69 риск 3\/5: .+\. населенный сбой, сделки, слухи\./);
  assert.match(floorRunArrivalLead(authored!, LiftDirection.UP), /населенный сбой, сделки, слухи/);
  assert.match(floorRunArrivalLead(authored!, LiftDirection.UP), /Возврат: лифт ↑ к предыдущему Z/);
});

test('floor run keeps authored stops on expandable even route slots', () => {
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
  assert.equal(new Set(anchors).size, anchors.length);
  assert.equal(anchors.every(z => z % 2 === 0), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.every(z => !anchors.includes(z)), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.some(z => z % 2 === 0), true);
});

test('floor run places pioneer camp one authored step above upper bureau', () => {
  const state = makeGameState({ currentFloor: FloorLevel.MINISTRY });
  setFloorRunState(state, { runSeed: 789, currentZ: 30, specs: {}, visited: {} }, FloorLevel.MINISTRY);

  for (const expectedZ of [31, 32, 33]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const upperBureau = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(upperBureau?.z, 34);
  assert.equal(upperBureau?.designFloorId, 'upper_bureau');
  commitFloorRunEntry(state, upperBureau!);

  for (const expectedZ of [35, 36, 37]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const camp = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(camp?.z, 38);
  assert.equal(camp?.designFloorId, 'pioneer_camp');
  assert.equal(camp?.baseFloor, FloorLevel.LIVING);
});

test('floor run exposes seeded procedural slots across the normal lift span', () => {
  assert.equal(PROCEDURAL_FLOOR_COUNT, 77);
  assert.equal(PROCEDURAL_FLOOR_ZS[0], -49);
  assert.equal(PROCEDURAL_FLOOR_ZS.at(-1), 49);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(1), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-25), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-22), false);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(2), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(26), false);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(38), false);

  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(state, { runSeed: 456, currentZ: 0, specs: {}, visited: {} }, FloorLevel.LIVING);

  for (const expectedZ of [1, 2, 3]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const communalRing = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(communalRing?.z, 4);
  assert.equal(communalRing?.designFloorId, 'communal_ring');
  commitFloorRunEntry(state, communalRing!);

  for (const expectedZ of [5, 6, 7]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const crossroads = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(crossroads?.z, 8);
  assert.equal(crossroads?.designFloorId, 'manhattan_crossroads');
  commitFloorRunEntry(state, crossroads!);

  for (const expectedZ of [9, 10, 11, 12, 13]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const kvartiry = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(kvartiry?.z, 14);
  assert.equal(kvartiry?.storyFloor, FloorLevel.KVARTIRY);
});

test('procedural floor specs are deterministic from run seed and z', () => {
  const a = makeProceduralFloorSpec(999, 2);
  const b = makeProceduralFloorSpec(999, 2);
  const c = makeProceduralFloorSpec(999, 3);

  assert.deepEqual(a, b);
  assert.notEqual(a.seed, c.seed);
});

test('active numbered floor instances key editor and runtime state by anomaly id', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING, time: 12 });
  setFloorRunState(state, { runSeed: 404, currentZ: 1, specs: {}, visited: {} }, FloorLevel.LIVING);

  const intendedKey = currentMapEditorFloorKey(state);
  assert.match(intendedKey, /^procedural:/);

  const savedRun = floorRunStateForSave(state);
  setFloorInstanceState(state, {
    current: {
      id: 'loop_404',
      fromFloor: FloorLevel.LIVING,
      intendedFloor: FloorLevel.MAINTENANCE,
      returnFloor: FloorLevel.MAINTENANCE,
      direction: LiftDirection.DOWN,
    },
  }, FloorLevel.LIVING);

  const anomalyKey = floorInstanceWorldKey('loop_404');
  assert.equal(floorInstanceStateForSave(state).current?.worldKey, anomalyKey);
  assert.equal(currentMapEditorFloorKey(state), anomalyKey);
  assert.equal(currentNetTerminalGenFloorKey(state), anomalyKey);
  assert.equal(currentFloorRunEntry(state).z, 1);

  const loaded = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(loaded, savedRun, FloorLevel.LIVING);
  setFloorInstanceState(loaded, floorInstanceStateForSave(state), FloorLevel.LIVING);
  assert.equal(currentMapEditorFloorKey(loaded), anomalyKey);
  assert.equal(currentNetTerminalGenFloorKey(loaded), anomalyKey);
});

test('active numbered floor editor replay does not leak patches to intended route floor', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING, time: 20 });
  setFloorRunState(state, { runSeed: 405, currentZ: 1, specs: {}, visited: {} }, FloorLevel.LIVING);
  const intendedKey = currentMapEditorFloorKey(state);
  const anomalyKey = floorInstanceWorldKey('loop_404');
  setFloorInstanceState(state, {
    current: {
      id: 'loop_404',
      fromFloor: FloorLevel.LIVING,
      intendedFloor: FloorLevel.MAINTENANCE,
      returnFloor: FloorLevel.MAINTENANCE,
      direction: LiftDirection.DOWN,
    },
  }, FloorLevel.LIVING);

  const world = new World();
  const player = makeTestPlayer({ id: 1, x: 2.5, y: 2.5 });
  const entities = [player];
  const nextEntityId = { v: 2 };
  world.cells[world.idx(10, 10)] = Cell.FLOOR;
  world.cells[world.idx(11, 11)] = Cell.FLOOR;

  setMapEditorPatchState(state, {
    patches: {
      [intendedKey]: {
        floorKey: intendedKey,
        baseFloor: FloorLevel.MAINTENANCE,
        z: 1,
        createdAt: 1,
        opCount: 1,
        ops: [{ kind: 'set_cell', x: 10, y: 10, cell: Cell.WALL }],
      },
      [anomalyKey]: {
        floorKey: anomalyKey,
        baseFloor: FloorLevel.LIVING,
        createdAt: 2,
        opCount: 1,
        ops: [{ kind: 'set_cell', x: 11, y: 11, cell: Cell.WATER }],
      },
    },
    skipped: [],
  });

  const snapshot = getMapEditorSnapshot(state);
  assert.equal(snapshot.floorKey, anomalyKey);
  assert.equal(snapshot.patchOps, 1);

  const applied = replayMapEditorPatchForCurrentFloor(world, entities, player, state, nextEntityId);
  assert.equal(applied, 1);
  assert.equal(world.cells[world.idx(10, 10)], Cell.FLOOR);
  assert.equal(world.cells[world.idx(11, 11)], Cell.WATER);
});

test('procedural floor danger deck keeps route-band pressure rhythm', () => {
  assert.deepEqual(summarizeDangerDeck(), {
    upper: { slots: 135, averageTimes100: 313, dangerCounts: [0, 33, 54, 46, 2] },
    residential: { slots: 95, averageTimes100: 241, dangerCounts: [10, 39, 43, 3, 0] },
    industrial: { slots: 95, averageTimes100: 376, dangerCounts: [0, 7, 24, 49, 15] },
    hellVoid: { slots: 60, averageTimes100: 472, dangerCounts: [0, 0, 2, 13, 45] },
  });
  assert.deepEqual(summarizeAnomalyPressure(), {
    none: { slots: 105, averageTimes100: 260, danger5: 2 },
    anomaly: { slots: 280, averageTimes100: 364, danger5: 60 },
  });
});

test('procedural floor danger snapshot is deterministic by z and seed', () => {
  const snapshot = PROCEDURAL_FLOOR_ZS
    .map(z => `${z}:${makeProceduralFloorSpec(41, z).danger}`)
    .join(' ');

  assert.equal(snapshot, [
    '-49:5 -47:5 -46:5 -45:5 -44:5 -43:5 -42:5 -41:5 -39:5 -38:5 -37:4 -35:5 -34:5',
    '-33:5 -31:5 -30:4 -29:3 -28:4 -27:4 -25:4 -24:5 -23:3 -21:4 -20:4 -19:4',
    '-17:3 -16:2 -15:3 -13:3 -12:2 -11:2 -9:3 -8:2 -7:2 -6:3 -5:3 -3:3 -2:1 -1:3',
    '1:1 2:1 3:2 5:2 6:3 7:2 9:3 10:3 11:3 12:3 13:2 15:2 16:4 17:2',
    '19:3 20:2 21:2 23:3 24:3 25:2 27:3 28:3 29:3 31:2 32:2 33:2 35:3 36:3',
    '37:3 39:5 40:4 41:4 43:4 44:3 45:4 47:4 48:4 49:4',
  ].join(' '));
});

test('procedural floor generator returns a playable non-story floor', () => {
  const spec = makeProceduralFloorSpec(321, 2);
  const gen = timedProceduralSpec(spec, 'procedural smoke seed=321');
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const liftUp = gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT);
  const liftDown = gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(liftUp, true);
  assert.equal(liftDown, true);
  assert.equal(gen.entities.some(e => e.type === EntityType.NPC), true);
  assert.equal(gen.entities.some(e => e.type === EntityType.MONSTER), true);
  assert.equal(gen.world.containers.some(container => container.inventory.length > 0), true);
});

test('P0 procedural reachability fast subset keeps route lifts usable', () => {
  for (const { runSeed, z } of P0_REACHABILITY_FAST_CASES) {
    assert.equal(PROCEDURAL_FLOOR_ZS.includes(z), true, `z=${z} is procedural`);
    const gen = timedProceduralFloor(runSeed, z, 'P0 fast reachability');
    const audit = reachabilityAudit(gen);
    assert.equal(hasReachableLift(gen, audit, LiftDirection.UP), true, `seed=${runSeed} z=${z} up lift`);
    assert.equal(hasReachableLift(gen, audit, LiftDirection.DOWN), true, `seed=${runSeed} z=${z} down lift`);
  }
});

testGenerationMatrix('P0 procedural reachability matrix keeps sampled route lifts usable', () => {
  for (const z of P0_REACHABILITY_ZS) {
    assert.equal(PROCEDURAL_FLOOR_ZS.includes(z), true, `z=${z} is procedural`);
  }

  for (const runSeed of P0_REACHABILITY_RUN_SEEDS) {
    for (const z of P0_REACHABILITY_ZS) {
      const gen = timedProceduralFloor(runSeed, z, 'P0 matrix reachability');
      const audit = reachabilityAudit(gen);
      assert.equal(hasReachableLift(gen, audit, LiftDirection.UP), true, `seed=${runSeed} z=${z} up lift`);
      assert.equal(hasReachableLift(gen, audit, LiftDirection.DOWN), true, `seed=${runSeed} z=${z} down lift`);
    }
  }
});

test('service spine geometry carves connected maintenance trunks with usable lifts', () => {
  const def = FLOOR_GEOMETRIES.find(item => item.id === 'service_spines');
  assert.equal(def?.minZ, 9);
  assert.equal(def?.maxZ, 23);
  assert.equal(def?.tags.includes('service'), true);

  const base = makeProceduralFloorSpec(9127, 17);
  const gen = timedProceduralSpec({
    ...base,
    geometryId: 'service_spines',
    baseFloor: FloorLevel.MAINTENANCE,
    anomalyId: 'none',
    title: `сервисные штреки: ${base.title}`,
  }, 'forced service_spines seed=9127');
  const audit = reachabilityAudit(gen);
  const spineRooms = gen.world.rooms.filter(room => room.name.includes('сервисного штрека'));

  assert.equal(spineRooms.length >= 2, true);
  for (const room of spineRooms) {
    const ci = gen.world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2));
    assertAuditReachable(gen.world, audit, ci, `${room.name} center`);
  }
  assert.equal(hasReachableLift(gen, audit, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, audit, LiftDirection.DOWN), true);

  const panels = getEmergencyPanels(gen.world);
  assert.equal(panels.length >= 1 && panels.length <= 3, true);
  for (const panel of panels) {
    assertAuditReachable(gen.world, audit, panel.idx, 'emergency panel');
    assert.equal(panel.zoneId >= 0, true);
    assert.equal(panel.roomId >= 0, true);
  }

  let serviceFixtures = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    const feature = gen.world.features[i];
    if (
      audit.reachable[i] &&
      gen.world.roomMap[i] < 0 &&
      (feature === Feature.SCREEN || feature === Feature.APPARATUS || feature === Feature.MACHINE)
    ) {
      serviceFixtures++;
    }
  }
  assert.equal(serviceFixtures > 0, true);
});

test('procedural monster pressure stays capped and registers a route cue', () => {
  const base = makeProceduralFloorSpec(2468, -38);
  const gen = timedProceduralSpec({
    ...base,
    danger: 5,
    anomalyId: 'samosbor_seed',
    title: `поражение самосбором: ${base.title}`,
    monsterBiasKinds: [MonsterKind.HERALD, MonsterKind.MANCOBUS, MonsterKind.KOSTOREZ, MonsterKind.NIGHTMARE],
  }, 'forced monster pressure seed=2468');
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const rareKinds = new Set([MonsterKind.HERALD, MonsterKind.MANCOBUS, MonsterKind.KOSTOREZ, MonsterKind.NIGHTMARE]);

  assert.equal(monsters.length <= PROCEDURAL_POPULATION_PROFILES.normal.monsters.cap, true);
  assert.equal(monsters.length >= 1000, true);
  assert.equal(monsters.every(e => e.ai), true);
  assert.equal(monsters.filter(e => e.monsterKind !== undefined && rareKinds.has(e.monsterKind)).length <= 2, true);
  assert.equal(routeCueCount(gen.world), 1);
});

test('zombie apocalypse procedural specs bias monster pressure to мертвяки', () => {
  const spec = makeProceduralFloorSpec(779, -35);
  assert.equal(spec.anomalyId, 'zombie_apocalypse');
  assert.deepEqual(spec.monsterBiasKinds, [MonsterKind.ZOMBIE]);
});

test('deep procedural route floors blend route identity with design monster bias', () => {
  const base = makeProceduralFloorSpec(1357, -35);
  const gen = timedProceduralSpec({
    ...base,
    danger: 4,
    anomalyId: 'none',
    title: base.title,
    monsterBiasKinds: [MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK],
  }, 'forced deep monster mix seed=1357');
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const bureaucratic = new Set([MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK]);
  const deep = new Set([MonsterKind.TVAR, MonsterKind.POLZUN, MonsterKind.SHADOW, MonsterKind.EYE, MonsterKind.TUBE_EEL, MonsterKind.KOSTOREZ]);

  assert.equal(monsters.length > 0, true);
  assert.equal(monsters.some(e => e.monsterKind !== undefined && bureaucratic.has(e.monsterKind)), true);
  assert.equal(monsters.some(e => e.monsterKind !== undefined && deep.has(e.monsterKind)), true);
  assert.equal(monsters.some(e => e.monsterKind === MonsterKind.CREATOR), false);
});

test('void and lower route floors do not generate NPCs', () => {
  const voidGen = timeFloorGeneration('story VOID', () => generateFloor(FloorLevel.VOID));
  assert.equal(voidGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(voidGen.entities.some(e => e.type === EntityType.MONSTER), true);
  assertFullFootprint(voidGen.world, 'VOID story floor');

  const base = makeProceduralFloorSpec(321, FLOOR_RUN_VOID_Z + 1);
  const procGen = timedProceduralSpec({
    ...base,
    anomalyId: 'smog',
    title: `говнячный смог: ${base.title}`,
  }, 'void lower procedural seed=321');
  assert.equal(procGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(procGen.entities.some(e => e.type === EntityType.MONSTER), true);

  const darknessGen = timeFloorGeneration('design darkness', () => generateDesignFloor('darkness'));
  assert.equal(darknessGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(darknessGen.entities.some(e => e.type === EntityType.MONSTER), true);
  assert.equal(darknessGen.world.features.some(feature => feature === Feature.LAMP || feature === Feature.CANDLE), false);
  assert.equal(darknessGen.world.light.some(value => value > 0), false);
  assertFullFootprint(darknessGen.world, 'darkness design floor');
});

testGenerationMatrix('authored design floors occupy the full 1024x1024 route footprint', () => {
  for (const route of DESIGN_FLOOR_ROUTES) {
    const gen = timeFloorGeneration(`design ${route.id}`, () => generateDesignFloor(route.id));
    assertFullFootprint(gen.world, route.id);
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
  const gen = timedProceduralSpec(spec, 'forced rail trains seed=654');

  assert.equal(gen.world.railTracks.length > 0, true);
  assert.equal(gen.world.railTrains.length > 0, true);
  assert.equal(gen.world.railTracks[0].stationOffsets.length > 0, true);
  assert.equal(gen.world.railTracks[0].platformCells.length > 0, true);
  assert.equal(gen.world.railTrains[0].entityIds.every(id => gen.entities.some(e => e.id === id && e.type === EntityType.ITEM_DROP)), true);
});

test('living tunnels anomaly seeds roots and mutates bounded cells over time', () => {
  const base = makeProceduralFloorSpec(881, 9);
  const spec = {
    ...base,
    anomalyId: 'living_tunnels' as const,
    danger: Math.max(3, base.danger) as typeof base.danger,
    title: `живые тоннели: ${base.title}`,
  };
  const gen = timedProceduralSpec(spec, 'forced living tunnels seed=881');
  const roots = gen.world.rooms.filter(room => room.name.includes('[living_tunnel:'));
  assert.equal(roots.length > 0, true);

  const state = makeGameState({ currentFloor: spec.baseFloor });
  const player = makeTestPlayer({ id: 999999, x: gen.spawnX, y: gen.spawnY, hp: 100, maxHp: 100 });
  const beforeVersion = gen.world.cellVersion;
  updateLivingTunnelsAnomaly(gen.world, player, state, 1.4);

  let liveCells = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.cells[i] === Cell.FLOOR && gen.world.floorTex[i] === Tex.F_GUT) liveCells++;
  }

  assert.equal(gen.world.cellVersion > beforeVersion, true);
  assert.equal(liveCells > 0, true);
  assert.equal(gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))], Cell.FLOOR);
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
  const gen = timedProceduralSpec(spec, 'forced bad apple stamp seed=777');
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
  const gen = timedProceduralSpec(spec, 'forced bad apple runtime seed=778');
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
  const base = makeProceduralFloorSpec(779, -35);
  const spec = {
    ...base,
    anomalyId: 'zombie_apocalypse' as const,
    geometryId: 'apartment_pressure' as const,
    baseFloor: FloorLevel.KVARTIRY,
    danger: 5 as const,
    monsterBiasKinds: [MonsterKind.SHADOW],
    title: `зомби-апокалипсис: ${base.title}`,
  };
  const gen = timedProceduralSpec(spec, 'forced zombie apocalypse seed=779');
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const zombiesBeforeInfection = gen.entities.filter(e => e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.ZOMBIE);
  const patientZero = gen.entities.find(e => e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.ZOMBIE && e.name === 'Пациент зеро');

  assert.equal(npcs.length, ENTITY_SOFT_LIMITS[EntityType.NPC]);
  assert.equal(npcs.length >= PROCEDURAL_POPULATION_PROFILES.highDensity.npcs.cap, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 20, true);
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

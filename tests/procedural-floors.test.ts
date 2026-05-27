import { after, test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, ContainerKind, DoorState, EntityType, Faction, Feature, FloorLevel, LiftDirection, MonsterKind, Occupation, QuestType, RoomType, Tex, W, ZoneFaction } from '../src/core/types';
import {
  FLOOR_GEOMETRIES,
  FLOOR_RUN_MAX_Z,
  FLOOR_RUN_MIN_Z,
  FLOOR_RUN_VOID_Z,
  PROCEDURAL_FLOOR_COUNT,
  PROCEDURAL_FLOOR_ZS,
  floorRunProfileZ,
  floorRunZAllowsNpcs,
  makeProceduralFloorSpec,
  type ProceduralFloorSpec,
  zForStoryFloor,
} from '../src/data/procedural_floors';
import { DESIGN_FLOOR_ROUTES } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { ENTITY_SOFT_LIMITS } from '../src/data/entity_limits';
import { getMonsterEcology } from '../src/data/monster_ecology';
import { SIDE_QUESTS } from '../src/data/plot';
import { PROCEDURAL_POPULATION_PROFILES } from '../src/data/population_profiles';
import { isFloor69FemaleSprite } from '../src/entities/procedural_visuals';
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
  floorRunEntryFloorKey,
  floorRunEntryKind,
  floorRunEntryLiftDirections,
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
import { getProceduralSmogStatus, updateProceduralAnomalies } from '../src/systems/procedural_anomalies';
import { updateLivingTunnelsAnomaly } from '../src/systems/procedural_anomalies/living_tunnels';
import { tryZombieApocalypseInfection } from '../src/systems/procedural_anomalies/zombie_apocalypse';
import { getRecentEvents } from '../src/systems/events';
import { questTargetLiftDirection } from '../src/systems/contracts';
import { getObjectiveRouteHud, routeCueCount, routeObjectiveLiftPromptSuffix } from '../src/systems/route_cues';
import { getEmergencyPanels } from '../src/systems/emergency_panels';
import { generateProceduralFloor } from '../src/gen/procedural_floor';
import { generateDarknessDesignFloor } from '../src/gen/design_floors/darkness';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import { generateFloor } from '../src/gen/floor_manifest';
import { sampleNaturalPopulationCells } from '../src/gen/population_placement';
import {
  World,
  auditReachability,
  describeReachability,
  hasReachableAdjacentCell,
  type ReachabilityAudit,
} from '../src/core/world';
import { printSlowestFloorGenerators, timeFloorGeneration } from './generator_helpers';
import { countInventoryItem, makeGameState, makeTestPlayer } from './helpers';

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

function countNear(entities: readonly { alive: boolean; x: number; y: number }[], x: number, y: number, radius: number): number {
  const r2 = radius * radius;
  let count = 0;
  for (const entity of entities) {
    if (!entity.alive) continue;
    const dx = entity.x - x;
    const dy = entity.y - y;
    if (dx * dx + dy * dy <= r2) count++;
  }
  return count;
}

function reachableRoomCount(gen: ReturnType<typeof generateDesignFloor>, roomNames: readonly string[]): number {
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  let count = 0;
  for (const name of roomNames) {
    const room = gen.world.rooms.find(candidate => candidate.name === name);
    if (!room) continue;
    let reachable = false;
    for (let i = 0; i < gen.world.cells.length; i++) {
      if (gen.world.roomMap[i] === room.id && audit.reachable[i]) {
        reachable = true;
        break;
      }
    }
    if (reachable) count++;
  }
  return count;
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
  assert.equal(floorRunEntryFloorKey(currentFloorRunEntry(state)), 'story:living');
  assert.match(floorRunEntryRouteCard(currentFloorRunEntry(state)), /СЮЖЕТНЫЙ ЯКОРЬ Z\+0 story:living риск 1\/5: Жилая зона\. домашний hub, подготовка, возврат\./);

  const first = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(first?.procedural, true);
  assert.equal(floorRunEntryKind(first!), 'procedural');
  assert.equal(floorRunEntryFloorKey(first!), 'procedural:z-1');
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
  assert.equal(floorRunEntryFloorKey(authored!), 'design:floor_69');
  assert.match(floorRunEntryLiftLabel(authored!), /РУЧНОЙ МАРШРУТ Z-4 floor_69 риск 3\/5/);
  assert.match(floorRunEntryRouteCard(authored!), /РУЧНОЙ МАРШРУТ Z-4 floor_69 риск 3\/5: .+\. населенный сбой, сделки, слухи\./);
  assert.match(floorRunArrivalLead(authored!, LiftDirection.UP), /населенный сбой, сделки, слухи/);
  assert.match(floorRunArrivalLead(authored!, LiftDirection.UP), /Возврат: лифт ↑ к предыдущему Z/);
});

test('objective route HUD and lift prompts point down to lower route targets', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  setFloorRunState(state, { runSeed: 123, currentZ: 0, specs: {}, visited: {} }, FloorLevel.LIVING);

  const startHud = getObjectiveRouteHud(state);
  assert.match(startHud.title, /Ольга.*Барни.*Яков/);
  assert.match(startHud.lift, /после цели/);

  const quest = {
    id: 77,
    type: QuestType.FETCH,
    giverId: -77,
    giverName: 'Пост давления',
    desc: 'Принеси манометр с нижнего маршрута.',
    targetItem: 'manometer',
    targetCount: 1,
    targetFloor: FloorLevel.MAINTENANCE,
    targetRoute: { z: -20, label: 'Z-20 Коллекторы', risk: 2 },
    targetHint: 'Коллекторы: насосная или пост давления; проверяйте клапан до входа в пар.',
    done: false,
  };
  state.quests.push(quest);

  assert.equal(questTargetLiftDirection(quest, state), LiftDirection.DOWN);
  assert.equal(routeObjectiveLiftPromptSuffix(state, LiftDirection.DOWN), ' / ЦЕЛЬ');
  assert.equal(routeObjectiveLiftPromptSuffix(state, LiftDirection.UP), '');

  const hud = getObjectiveRouteHud(state);
  assert.match(hud.title, /добыть/);
  assert.match(hud.target, /Z-20 Коллекторы/);
  assert.match(hud.lift, /Лифт ↓ к цели от Z\+0/);
  assert.match(hud.risk, /Риск 2\/5/);
  assert.match(hud.returnPath, /Жилая зона/);

  commitFloorRunEntry(state, resolveFloorRunRoute(state, LiftDirection.DOWN)!);
  assert.equal(routeObjectiveLiftPromptSuffix(state, LiftDirection.DOWN), ' / ЦЕЛЬ');
  assert.equal(routeObjectiveLiftPromptSuffix(state, LiftDirection.UP), ' / ВОЗВРАТ');
  assert.match(getObjectiveRouteHud(state).returnPath, /лифт ↑ к Z\+0/);
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
  assert.equal(PROCEDURAL_FLOOR_COUNT, 75);
  assert.equal(PROCEDURAL_FLOOR_ZS[0], -49);
  assert.equal(PROCEDURAL_FLOOR_ZS.at(-1), 49);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(1), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-25), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(-22), false);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(2), true);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(12), false);
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

  for (const expectedZ of [9, 10, 11]) {
    const entry = resolveFloorRunRoute(state, LiftDirection.UP);
    assert.equal(entry?.z, expectedZ);
    assert.equal(entry?.procedural, true);
    commitFloorRunEntry(state, entry!);
  }

  const slimeNii = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(slimeNii?.z, 12);
  assert.equal(slimeNii?.designFloorId, 'slime_nii');
  assert.equal(slimeNii?.baseFloor, FloorLevel.KVARTIRY);
  commitFloorRunEntry(state, slimeNii!);

  const z13 = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(z13?.z, 13);
  assert.equal(z13?.procedural, true);
  commitFloorRunEntry(state, z13!);

  const kvartiry = resolveFloorRunRoute(state, LiftDirection.UP);
  assert.equal(kvartiry?.z, 14);
  assert.equal(kvartiry?.storyFloor, FloorLevel.KVARTIRY);
});

test('floor run lift directions respect roof void and Podad lower gate', () => {
  const state = makeGameState();

  setFloorRunState(state, { runSeed: 123, currentZ: FLOOR_RUN_MAX_Z, specs: {}, visited: {} }, FloorLevel.MINISTRY);
  assert.deepEqual(floorRunEntryLiftDirections(currentFloorRunEntry(state)), [LiftDirection.DOWN]);

  setFloorRunState(state, { runSeed: 123, currentZ: FLOOR_RUN_MIN_Z, specs: {}, visited: {} }, FloorLevel.VOID);
  assert.deepEqual(floorRunEntryLiftDirections(currentFloorRunEntry(state)), [LiftDirection.UP]);

  setFloorRunState(state, { runSeed: 123, currentZ: -40, specs: {}, visited: {} }, FloorLevel.HELL);
  const podad = currentFloorRunEntry(state);
  assert.equal(podad.designFloorId, 'podad');
  assert.deepEqual(floorRunEntryLiftDirections(podad, false), [LiftDirection.UP]);
  assert.deepEqual(floorRunEntryLiftDirections(podad, true), [LiftDirection.DOWN, LiftDirection.UP]);
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
    residential: { slots: 90, averageTimes100: 240, dangerCounts: [10, 37, 40, 3, 0] },
    industrial: { slots: 95, averageTimes100: 376, dangerCounts: [0, 7, 24, 49, 15] },
    hellVoid: { slots: 55, averageTimes100: 471, dangerCounts: [0, 0, 2, 12, 41] },
  });
  assert.deepEqual(summarizeAnomalyPressure(), {
    none: { slots: 103, averageTimes100: 259, danger5: 2 },
    anomaly: { slots: 272, averageTimes100: 363, danger5: 56 },
  });
});

test('procedural floor danger snapshot is deterministic by z and seed', () => {
  const snapshot = PROCEDURAL_FLOOR_ZS
    .map(z => `${z}:${makeProceduralFloorSpec(41, z).danger}`)
    .join(' ');

  assert.equal(snapshot, [
    '-49:5 -47:5 -46:5 -45:5 -44:5 -43:5 -42:5 -41:5 -39:5 -37:4 -35:5 -34:5',
    '-33:5 -31:5 -30:4 -29:3 -28:4 -27:4 -25:4 -24:5 -23:3 -21:4 -20:4 -19:4',
    '-17:3 -16:2 -15:3 -13:3 -12:2 -11:2 -9:3 -8:2 -7:2 -6:3 -5:3 -3:3 -2:1 -1:3',
    '1:1 2:1 3:2 5:2 6:3 7:2 9:3 10:3 11:3 13:2 15:2 16:4 17:2',
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
  const darknessMonsters = darknessGen.entities.filter(e => e.type === EntityType.MONSTER);
  const darknessMonsterKinds = new Set(darknessMonsters.map(e => e.monsterKind));
  assert.equal(darknessGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(darknessMonsters.length >= 3000 && darknessMonsters.length <= 7000, true);
  assert.equal(darknessMonsterKinds.has(MonsterKind.LISHENNYY), true);
  assert.equal(darknessMonsterKinds.has(MonsterKind.SLEPOGLAZ), true);
  assert.equal(darknessMonsterKinds.has(MonsterKind.PROTOKOLNIK), true);
  assert.equal(darknessMonsters.filter(e => e.monsterKind === MonsterKind.SBORKA).length < darknessMonsters.length / 3, true);
  assert.equal(darknessMonsters.filter(e => darknessGen.world.dist2(e.x, e.y, darknessGen.spawnX, darknessGen.spawnY) <= 32 * 32).length <= Math.max(64, Math.floor(darknessMonsters.length * 0.02)), true);
  assert.equal(darknessGen.world.features.some(feature => feature === Feature.LAMP || feature === Feature.CANDLE), false);
  assert.equal(darknessGen.world.light.some(value => value > 0), false);
  assert.equal(routeCueCount(darknessGen.world) >= 3, true);
  assertFullFootprint(darknessGen.world, 'darkness design floor');

  const rawDarknessGen = timeFloorGeneration('raw design darkness', () => generateDarknessDesignFloor());
  assert.equal(rawDarknessGen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(rawDarknessGen.entities.some(e => e.type === EntityType.MONSTER), true);
});

test('podad ships as a denser-than-Hell monster floor with gated lower lifts', () => {
  const route = DESIGN_FLOOR_ROUTES.find(def => def.id === 'podad');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = timeFloorGeneration('design podad population', () => generateDesignFloor('podad'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const ambientNpcs = npcs.filter(e => !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const heralds = monsters.filter(e => e.monsterKind === MonsterKind.HERALD);
  const nonHeraldRareMonsters = monsters.filter(e => e.monsterKind !== MonsterKind.HERALD && getMonsterEcology(e.monsterKind)?.rare);
  const hasDownLift = gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.DOWN);

  assert.equal(ambientNpcs.length, 0);
  assert.equal(npcs.length <= 60, true);
  assert.equal(monsters.length, profile.monsterTarget);
  assert.equal(monsters.length >= 6500, true);
  assert.equal(monsters.length <= 9500, true);
  assert.equal(monsters.length <= ENTITY_SOFT_LIMITS[EntityType.MONSTER], true);
  assert.equal(heralds.length, 3);
  assert.equal(nonHeraldRareMonsters.length, 0);
  assert.equal(hasDownLift, false);
});

test('design floor population profiles follow route density curve and caps', () => {
  const profiles = Object.fromEntries(DESIGN_FLOOR_ROUTES.map(route => [route.id, designFloorPopulationProfile(route)]));

  assert.equal(profiles.roof.npcTarget, 0);
  assert.equal(profiles.chthonic_attic.npcTarget, 0);
  assert.equal(profiles.chthonic_attic.monsterTarget, 4300);
  assert.equal(profiles.chthonic_attic.monsterTags.includes('fog'), true);
  assert.equal((profiles.chthonic_attic.monsterPlacement.maxPerBucket ?? 0) <= 8, true);
  assert.equal(profiles.roof.monsterTarget > profiles.bank_floor.monsterTarget, true);
  assert.equal(profiles.communal_ring.npcTarget > profiles.upper_bureau.npcTarget, true);
  assert.equal(profiles.manhattan_crossroads.npcTarget > profiles.raionsovet_archive.npcTarget, true);
  assert.equal((profiles.manhattan_crossroads.npcPlacement.anchors?.length ?? 0) >= 6, true);
  assert.equal((profiles.manhattan_crossroads.monsterPlacement.anchors?.length ?? 0) >= 5, true);
  assert.equal((profiles.manhattan_crossroads.monsterPlacement.roomWeights?.[RoomType.STORAGE] ?? 0) > 1.5, true);
  assert.equal(profiles.pioneer_camp.npcTarget > profiles.antenna_court.npcTarget, true);
  assert.equal(profiles.floor_69.npcTarget, 2200);
  assert.equal(profiles.floor_69.monsterTarget, 380);
  assert.equal(profiles.floor_69.npcNoun, 'посетитель');
  assert.equal(profiles.floor_69.npcOccupations.some(item => item.value === Occupation.CHILD), false);
  assert.equal((profiles.floor_69.npcPlacement.roomWeights?.[RoomType.MEDICAL] ?? 0) > 1, true);
  assert.equal((profiles.floor_69.npcPlacement.roomWeights?.[RoomType.OFFICE] ?? 0) > 1, true);
  assert.equal((profiles.floor_69.npcPlacement.roomWeights?.[RoomType.HQ] ?? 0) > 1, true);
  assert.equal((profiles.floor_69.npcPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal(profiles.antenna_court.npcTarget >= 20 && profiles.antenna_court.npcTarget <= 80, true);
  assert.equal(profiles.antenna_court.monsterTarget >= 2200 && profiles.antenna_court.monsterTarget <= 4500, true);
  assert.equal(profiles.antenna_court.npcFactions.some(entry => entry.value === Faction.CITIZEN), false);
  assert.equal(profiles.antenna_court.monsterBiasKinds.includes(MonsterKind.LAMPOVY), true);
  assert.equal(profiles.antenna_court.monsterTags.includes('signal'), true);
  assert.equal(profiles.silicon_net_well.npcTarget >= 350 && profiles.silicon_net_well.npcTarget <= 900, true);
  assert.equal(profiles.silicon_net_well.monsterTarget >= 1200 && profiles.silicon_net_well.monsterTarget <= 2600, true);
  assert.equal(profiles.silicon_net_well.npcNoun, 'специалист');
  assert.equal(profiles.silicon_net_well.monsterBiasKinds.includes(MonsterKind.CHERNOSLIZ), true);
  assert.equal(profiles.silicon_net_well.monsterTags.includes('silicon'), true);
  assert.equal(profiles.slime_nii.npcTarget, 1300);
  assert.equal(profiles.slime_nii.monsterTarget, 1700);
  assert.equal(profiles.slime_nii.npcNoun, 'сотрудник НИИ');
  assert.equal(profiles.slime_nii.monsterBiasKinds.includes(MonsterKind.CHERNOSLIZ), true);
  assert.equal(profiles.slime_nii.monsterTags.includes('quarantine'), true);
  assert.equal((profiles.slime_nii.npcPlacement.roomWeights?.[RoomType.MEDICAL] ?? 0) > 1.5, true);
  assert.equal((profiles.slime_nii.monsterPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal(profiles.dark_metro.npcTarget >= 80 && profiles.dark_metro.npcTarget <= 300, true);
  assert.equal(profiles.dark_metro.monsterTarget >= 2500 && profiles.dark_metro.monsterTarget <= 4500, true);
  assert.equal(profiles.dark_metro.npcNoun, 'ветеран');
  assert.equal(profiles.dark_metro.npcFactions.some(entry => entry.value === Faction.CITIZEN), false);
  assert.equal(profiles.dark_metro.monsterTags.includes('rail'), true);
  assert.equal((profiles.dark_metro.npcPlacement.anchors?.length ?? 0) >= 12, true);
  assert.equal((profiles.dark_metro.npcPlacement.roomWeights?.[RoomType.HQ] ?? 0) > 4, true);
  assert.equal(profiles.podad.npcTarget, 0);
  assert.equal(profiles.darkness.npcTarget, 0);
  assert.equal(profiles.darkness.monsterTarget >= 3000 && profiles.darkness.monsterTarget <= 7000, true);
  assert.equal((profiles.darkness.monsterPlacement.anchors?.length ?? 0) >= 4, true);
  assert.equal(profiles.darkness.monsterTags.includes('sound'), true);
  assert.equal(profiles.underhell.npcTarget >= 0 && profiles.underhell.npcTarget <= 120, true);
  assert.equal(profiles.underhell.monsterTarget >= 4500 && profiles.underhell.monsterTarget <= 8000, true);
  assert.equal(profiles.underhell.npcNoun, 'ветеран');
  assert.deepEqual(profiles.underhell.npcFactions.map(item => item.value), [Faction.LIQUIDATOR, Faction.CULTIST]);
  assert.equal(profiles.podad.monsterTarget, 8200);
  assert.equal((profiles.podad.monsterPlacement.anchors?.length ?? 0) >= 5, true);
  assert.equal(profiles.podad.monsterTags.includes('living_tunnels'), true);
  assert.equal(profiles.podad.monsterTags.includes('section_shift'), true);

  for (const route of DESIGN_FLOOR_ROUTES) {
    const profile = profiles[route.id];
    assert.equal(profile.npcTarget <= (ENTITY_SOFT_LIMITS[EntityType.NPC] ?? 0), true, `${route.id} npc cap`);
    assert.equal(profile.monsterTarget <= (ENTITY_SOFT_LIMITS[EntityType.MONSTER] ?? 0), true, `${route.id} monster cap`);
    if (!floorRunZAllowsNpcs(route.z)) assert.equal(profile.npcTarget, 0, `${route.id} npc-free route`);
  }
});

test('slime NII route ships containment cameras, samples, and slime pressure', () => {
  const route = DESIGN_FLOOR_ROUTES.find(def => def.id === 'slime_nii');
  assert.ok(route);
  assert.equal(route.z, 12);
  assert.equal(route.baseFloor, FloorLevel.KVARTIRY);

  const gen = timeFloorGeneration('design slime_nii containment', () => generateDesignFloor('slime_nii'));
  const cameraRooms = gen.world.rooms.filter(room => room.name.startsWith('Гермокамера НИИ слизи'));
  const hermeticDoors = [...gen.world.doors.values()].filter(door =>
    door.state === DoorState.HERMETIC_CLOSED || door.state === DoorState.HERMETIC_OPEN);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const slimeKinds = new Set([MonsterKind.SLIMEVIK, MonsterKind.SLIME_WOMAN, MonsterKind.CHERNOSLIZ, MonsterKind.HEAD_SLUG, MonsterKind.BEZEKHIY]);

  assert.equal(cameraRooms.length >= 8, true);
  assert.equal(hermeticDoors.length >= 4, true);
  assert.equal(gen.world.containers.some(c => c.tags.includes('slime_nii') && c.inventory.some(i => i.defId === 'slime_sample_green')), true);
  assert.equal(gen.entities.some(e => e.type === EntityType.NPC && e.plotNpcId === 'slime_nii_volunteer_mitya'), true);
  assert.equal(monsters.some(e => e.monsterKind !== undefined && slimeKinds.has(e.monsterKind)), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.UP), true);
  assert.equal(gen.world.cells.some((cell, idx) => cell === Cell.LIFT && gen.world.liftDir[idx] === LiftDirection.DOWN), true);
});

test('manhattan crossroads ships as dense road traffic with gang and wrong-exit pressure', () => {
  const gen = timeFloorGeneration('design manhattan_crossroads population field', () => generateDesignFloor('manhattan_crossroads'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const wildNpcs = npcs.filter(e => e.faction === Faction.WILD);
  const liquidatorNpcs = npcs.filter(e => e.faction === Faction.LIQUIDATOR);
  const wildZones = gen.world.zones.filter(zone => zone.faction === ZoneFaction.WILD);
  const liquidatorZones = gen.world.zones.filter(zone => zone.faction === ZoneFaction.LIQUIDATOR);
  const routeChoices = reachableRoomCount(gen, [
    'Платная перемычка центральной зебры',
    'Низкий тоннель под Восточной авеню',
    'Магазин под эстакадой',
    'Съезд Неправильный поворот',
    'Безопасный бордюр у зебры',
  ]);

  assert.equal(npcs.length >= 2200 && npcs.length <= 4200, true, `npc count ${npcs.length}`);
  assert.equal(monsters.length >= 500 && monsters.length <= 1200, true, `monster count ${monsters.length}`);
  assert.equal(countNear(wildNpcs, 696.5, 602.5, 38) >= 5, true);
  assert.equal(countNear(wildNpcs, 564.5, 574.5, 34) >= 4, true);
  assert.equal(countNear(liquidatorNpcs, 512.5, 512.5, 74) >= 5, true);
  assert.equal(countNear(monsters, 790.5, 622.5, 140) >= 10, true);
  assert.equal(routeChoices >= 3, true);
  assert.equal(wildZones.length > 0, true);
  assert.equal(liquidatorZones.length > 0, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 40, true);
});

test('underhell ships as a monster-owned veteran threshold', () => {
  const gen = timeFloorGeneration('design underhell population field', () => generateDesignFloor('underhell'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const ambientNpcs = npcs.filter(e => !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const lowerSamosborZones = gen.world.zones.filter(zone => zone.cy > W * 0.62 && zone.faction === ZoneFaction.SAMOSBOR);
  const legalNpcFactions = new Set([Faction.LIQUIDATOR, Faction.CULTIST]);

  assert.equal(npcs.length >= 4 && npcs.length <= 120, true);
  assert.equal(ambientNpcs.length <= 80, true);
  assert.equal(ambientNpcs.every(e => e.name?.includes('ветеран')), true);
  assert.equal(npcs.every(e => e.faction !== undefined && legalNpcFactions.has(e.faction)), true);
  assert.equal(monsters.length >= 4500 && monsters.length <= 8000, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.MONSTER, 32) <= 64, true);
  assert.equal(routeCueCount(gen.world) >= 4, true);
  assert.equal(lowerSamosborZones.length > 0, true);
});

test('dark metro ships as sparse defended bands inside monster-heavy train pressure', () => {
  const route = DESIGN_FLOOR_ROUTES.find(def => def.id === 'dark_metro');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = timeFloorGeneration('design dark metro population field', () => generateDesignFloor('dark_metro'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const ambientNpcs = npcs.filter(e => !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const legalNpcFactions = new Set([Faction.LIQUIDATOR, Faction.CULTIST, Faction.WILD, Faction.SCIENTIST]);
  const lineYs = [118, 260, 402, 642, 786, 920];
  const railBandMonsters = monsters.filter(e => lineYs.some(y => Math.abs(Math.floor(e.y) - y) <= 24));
  const defendedRooms = gen.world.rooms.filter(room => room.name.startsWith('Пост белой лампы'));
  const defendedEdges = gen.world.rooms.filter(room => room.name.startsWith('Обороняемая кромка'));
  const transitCaches = gen.world.containers.filter(container => container.tags.includes('transit_cache'));
  const hqMonsterCount = monsters.filter(e => {
    const ci = gen.world.idx(Math.floor(e.x), Math.floor(e.y));
    const roomId = gen.world.roomMap[ci];
    return roomId >= 0 && gen.world.rooms[roomId]?.type === RoomType.HQ;
  }).length;

  assert.equal(ambientNpcs.length, profile.npcTarget);
  assert.equal(ambientNpcs.length >= 80 && ambientNpcs.length <= 300, true);
  assert.equal(monsters.length, profile.monsterTarget);
  assert.equal(monsters.length >= 2500 && monsters.length <= 4500, true);
  assert.equal(ambientNpcs.every(e => e.name?.includes('ветеран')), true);
  assert.equal(ambientNpcs.every(e => e.faction !== undefined && legalNpcFactions.has(e.faction)), true);
  assert.equal(gen.world.railTracks.length >= 7, true);
  assert.equal(gen.world.railTrains.length >= 7, true);
  assert.equal(gen.world.railTrains.every(train => train.speed >= 3.4 && train.stopSeconds <= 3.8), true);
  assert.equal(defendedRooms.length >= 12, true);
  assert.equal(defendedEdges.length >= 12, true);
  assert.equal(transitCaches.length >= 12, true);
  assert.equal(railBandMonsters.length >= Math.floor(monsters.length * 0.45), true);
  assert.equal(hqMonsterCount <= Math.floor(monsters.length * 0.03), true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 20, true);
});

test('upper bureau keeps controlled legal queues with archive monster pressure', () => {
  const route = DESIGN_FLOOR_ROUTES.find(def => def.id === 'upper_bureau');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = timeFloorGeneration('design upper bureau population field', () => generateDesignFloor('upper_bureau'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const paperKinds = new Set([
    MonsterKind.PARAGRAPH,
    MonsterKind.PECHATEED,
    MonsterKind.KONTORSHCHIK,
    MonsterKind.PROTOKOLNIK,
    MonsterKind.KANTSELYARSKIY_IDOL,
  ]);
  const paperMonsters = monsters.filter(e => e.monsterKind !== undefined && paperKinds.has(e.monsterKind));
  const zoneFactions = new Set(gen.world.zones.map(zone => zone.faction));
  const hqRooms = gen.world.rooms.filter(room => room.type === RoomType.HQ);

  assert.equal(profile.npcTarget, 650);
  assert.equal(profile.monsterTarget, 1100);
  assert.equal(profile.npcNoun, 'проситель');
  assert.equal(npcs.length >= 350 && npcs.length <= 900, true);
  assert.equal(monsters.length >= 600 && monsters.length <= 1500, true);
  assert.equal(npcs.filter(e => e.occupation === Occupation.SECRETARY).length >= Math.floor(npcs.length * 0.28), true);
  assert.equal(npcs.filter(e => e.faction === Faction.LIQUIDATOR).length >= 120, true);
  assert.equal(npcs.filter(e => e.faction === Faction.SCIENTIST).length >= 25, true);
  assert.equal(paperMonsters.length >= 250, true);
  assert.equal(zoneFactions.has(ZoneFaction.CITIZEN), true);
  assert.equal(zoneFactions.has(ZoneFaction.LIQUIDATOR), true);
  assert.equal(zoneFactions.has(ZoneFaction.SAMOSBOR), true);
  assert.equal(zoneFactions.has(ZoneFaction.WILD), true);
  assert.equal(hqRooms.some(room => room.name === 'Ниша проверки пропусков'), true);
  assert.equal(hqRooms.some(room => room.name === 'Малый кабинет аудиторской тени'), true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 18, true);
});

test('antenna court is a monster-owned signal yard with bounded specialist enclaves', () => {
  const gen = timeFloorGeneration('design antenna_court population field', () => generateDesignFloor('antenna_court'));
  const ambientNpcs = gen.entities.filter(e => e.type === EntityType.NPC && !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const openHostileZones = gen.world.zones.filter(zone => zone.faction === ZoneFaction.WILD || zone.faction === ZoneFaction.SAMOSBOR);
  const legalNpcFactions = new Set([Faction.SCIENTIST, Faction.LIQUIDATOR]);

  assert.equal(ambientNpcs.length >= 20 && ambientNpcs.length <= 80, true);
  assert.equal(ambientNpcs.every(e => e.faction !== undefined && legalNpcFactions.has(e.faction)), true);
  assert.equal(ambientNpcs.every(e => e.name?.includes('сигнал-специалист')), true);
  assert.equal(monsters.length >= 2200 && monsters.length <= 4500, true);
  assert.equal(openHostileZones.length >= 20, true);
});

test('silicon net well creates protected science pockets and silicon monster pressure', () => {
  const gen = timeFloorGeneration('design silicon_net_well population field', () => generateDesignFloor('silicon_net_well'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const ambientNpcs = npcs.filter(e => !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const genericSpecialists = ambientNpcs.filter(e => e.name?.startsWith('Кремниевый НЕТ-колодец:'));
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const specialists = npcs.filter(e =>
    e.faction === Faction.SCIENTIST ||
    e.occupation === Occupation.SCIENTIST ||
    e.occupation === Occupation.ELECTRICIAN ||
    e.occupation === Occupation.MECHANIC,
  );
  const liquidators = npcs.filter(e => e.faction === Faction.LIQUIDATOR);
  const siliconKinds = new Set([
    MonsterKind.SAFEGUARD,
    MonsterKind.SLIMEVIK,
    MonsterKind.SLIME_WOMAN,
    MonsterKind.CHERVIE_AVATAR,
    MonsterKind.CHERNOSLIZ,
    MonsterKind.HEAD_SLUG,
  ]);
  const siliconMonsters = monsters.filter(e => e.monsterKind !== undefined && siliconKinds.has(e.monsterKind));
  const sciencePocketRooms = gen.world.rooms.filter(room =>
    room.name.includes('НИИ-под') ||
    room.name.includes('Серверная') ||
    room.name.includes('Кабельная')
  );
  const protectedRooms = gen.world.rooms.filter(room => room.type === RoomType.MEDICAL || room.type === RoomType.HQ);
  const monsterZones = gen.world.zones.filter(zone => zone.faction === ZoneFaction.SAMOSBOR || zone.faction === ZoneFaction.WILD);
  const liquidatorZones = gen.world.zones.filter(zone => zone.faction === ZoneFaction.LIQUIDATOR);

  assert.equal(npcs.length >= 350 && npcs.length <= 900, true);
  assert.equal(genericSpecialists.length >= 520, true);
  assert.equal(genericSpecialists.every(e => e.name?.includes('специалист')), true);
  assert.equal(monsters.length >= 1200 && monsters.length <= 2600, true);
  assert.equal(specialists.length >= 240, true);
  assert.equal(liquidators.length >= 120, true);
  assert.equal(siliconMonsters.length >= 240, true);
  assert.equal(sciencePocketRooms.length >= 7, true);
  assert.equal(protectedRooms.length >= 6, true);
  assert.equal(monsterZones.length >= liquidatorZones.length, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 18, true);
});

test('floor 69 uses the shared field as an adult social-debt route', () => {
  const gen = timeFloorGeneration('design floor_69 population field', () => generateDesignFloor('floor_69'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const ambientNpcs = npcs.filter(e => !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const liquidatorNpcs = npcs.filter(e => e.faction === Faction.LIQUIDATOR);
  const socialStaffNpcs = npcs.filter(e =>
    e.occupation === Occupation.SECRETARY ||
    e.occupation === Occupation.STOREKEEPER ||
    e.occupation === Occupation.DOCTOR ||
    e.occupation === Occupation.HUNTER,
  );
  const generatedWorkers = ambientNpcs.filter(e => e.name?.startsWith('Этаж 69: работница '));
  const generatedVisitors = ambientNpcs.filter(e => e.name?.startsWith('Этаж 69: посетитель '));
  const floor69FemaleSprites = ambientNpcs.filter(e => isFloor69FemaleSprite(e.sprite));
  const femaleQuestNpcs = npcs.filter(e => e.plotNpcId?.startsWith('f69_') && e.isFemale === true);

  assert.equal(npcs.length >= 1700 && npcs.length <= 3200, true);
  assert.equal(ambientNpcs.length >= 1700, true);
  assert.equal(monsters.length >= 200 && monsters.length <= 700, true);
  assert.equal(npcs.some(e => e.occupation === Occupation.CHILD), false);
  assert.equal(liquidatorNpcs.length > 40, true);
  assert.equal(socialStaffNpcs.length > 400, true);
  assert.equal(floor69FemaleSprites.length >= 300, true);
  assert.equal(floor69FemaleSprites.length, generatedWorkers.length);
  assert.equal(floor69FemaleSprites.every(e => e.isFemale === true && e.name?.startsWith('Этаж 69: работница ')), true);
  assert.equal(generatedWorkers.every(e => isFloor69FemaleSprite(e.sprite)), true);
  assert.equal(generatedVisitors.every(e => !isFloor69FemaleSprite(e.sprite)), true);
  assert.deepEqual(femaleQuestNpcs.map(e => e.plotNpcId).sort(), ['f69_doctor_sima', 'f69_madam_roza', 'f69_performer_ira']);
  assert.equal(femaleQuestNpcs.every(e => isFloor69FemaleSprite(e.sprite)), true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 26, true);
});

test('pioneer camp keeps a populated protected center and dangerous trail edge', () => {
  const route = DESIGN_FLOOR_ROUTES.find(def => def.id === 'pioneer_camp');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = timeFloorGeneration('design pioneer camp population field', () => generateDesignFloor('pioneer_camp'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const childNpcs = npcs.filter(e => e.occupation === Occupation.CHILD);
  const centerNpcs = npcs.filter(e => gen.world.dist(e.x, e.y, W / 2, W / 2) < 180);
  const centerMonsters = monsters.filter(e => gen.world.dist(e.x, e.y, W / 2, W / 2) < 180);
  const edgeMonsters = monsters.filter(e => gen.world.dist(e.x, e.y, W / 2, W / 2) > 250);
  const factionAt = (x: number, y: number) => gen.world.factionControl[gen.world.idx(x, y)];

  assert.equal(profile.npcTarget, 1100);
  assert.equal(profile.monsterTarget, 900);
  assert.equal(npcs.length >= 700 && npcs.length <= 1400, true);
  assert.equal(monsters.length >= 500 && monsters.length <= 1200, true);
  assert.equal(childNpcs.length >= Math.floor(npcs.length * 0.6), true);
  assert.equal(centerNpcs.length > centerMonsters.length, true);
  assert.equal(edgeMonsters.length > centerMonsters.length, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 16, true);
  assert.equal(npcs.filter(e => e.canGiveQuest).length >= 4, true);
  assert.equal(gen.world.containers.filter(container => container.tags.includes('pioneer_camp')).length >= 5, true);
  assert.notEqual(factionAt(W / 2, W / 2), ZoneFaction.WILD);
  assert.notEqual(factionAt(W / 2, W / 2), ZoneFaction.SAMOSBOR);
  assert.equal(factionAt(W / 2 - 197, W / 2 - 137), ZoneFaction.WILD);
  assert.equal(factionAt(W / 2, W / 2 - 380), ZoneFaction.WILD);
});

test('chthonic attic keeps a zero-ordinary-NPC monster service maze', () => {
  const gen = timeFloorGeneration('design chthonic attic population field', () => generateDesignFloor('chthonic_attic'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const ambientNpcs = npcs.filter(e => !e.plotNpcId && !e.persistentNpcId && e.alifeId === undefined);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const cacheCount = gen.world.containers.filter(container => container.tags.includes('attic') && container.tags.includes('cache')).length;
  const serviceRooms = gen.world.rooms.filter(room => {
    const name = room.name.toLowerCase();
    return name.includes('шахт') || name.includes('кабель') || name.includes('карман') || name.includes('сервис');
  });

  assert.equal(ambientNpcs.length, 0);
  assert.equal(npcs.length <= 40, true);
  assert.equal(monsters.length >= 3000 && monsters.length <= 5000, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.MONSTER, 32) <= 36, true);
  assert.equal(gen.world.zones.some(zone => zone.fogged && zone.faction === ZoneFaction.SAMOSBOR), true);
  assert.equal(cacheCount >= 4, true);
  assert.equal(serviceRooms.length >= 4, true);
});

test('generic design floor population field adds density without violating edge rules', () => {
  const communal = timeFloorGeneration('design communal population field', () => generateDesignFloor('communal_ring'));
  const communalNpcs = communal.entities.filter(e => e.type === EntityType.NPC);
  const communalMonsters = communal.entities.filter(e => e.type === EntityType.MONSTER);
  assert.equal(communalNpcs.length >= 3000, true);
  assert.equal(communalMonsters.length >= 250, true);
  assert.equal(communalNpcs.length <= ENTITY_SOFT_LIMITS[EntityType.NPC], true);
  assert.equal(maxEntitiesInArea(communal.entities, EntityType.NPC, 32) <= 18, true);

  const roof = timeFloorGeneration('design roof population field', () => generateDesignFloor('roof'));
  const roofNpcs = roof.entities.filter(e => e.type === EntityType.NPC);
  const roofMonsters = roof.entities.filter(e => e.type === EntityType.MONSTER);
  assert.equal(roofNpcs.length, 0);
  assert.equal(roofMonsters.length >= 4500, true);
  assert.equal(roofMonsters.length <= 7000, true);
  assert.equal(roofMonsters.length <= ENTITY_SOFT_LIMITS[EntityType.MONSTER], true);
});

test('population placement sampler skips fixtures, containers and lift buttons', () => {
  const world = new World();
  for (let x = 10; x < 20; x++) {
    const ci = world.idx(x, 10);
    world.cells[ci] = Cell.FLOOR;
  }
  const lampCell = world.idx(10, 10);
  const liftButtonCell = world.idx(11, 10);
  const tableCell = world.idx(12, 10);
  const containerCell = world.idx(13, 10);
  world.features[lampCell] = Feature.LAMP;
  world.features[liftButtonCell] = Feature.LIFT_BUTTON;
  world.liftDir[liftButtonCell] = LiftDirection.DOWN;
  world.features[tableCell] = Feature.TABLE;
  world.addContainer({
    id: 1,
    x: 13,
    y: 10,
    floor: FloorLevel.LIVING,
    roomId: -1,
    zoneId: 0,
    kind: ContainerKind.WOODEN_CHEST,
    name: 'test placement blocker',
    inventory: [],
    capacitySlots: 1,
    access: 'public',
    discovered: true,
    tags: [],
  });

  const blocked = new Set([lampCell, liftButtonCell, tableCell, containerCell]);
  const cells = sampleNaturalPopulationCells(world, 20, {
    noiseScale: 64,
    noiseStrength: 0,
    openWeight: 1,
    smoothingPasses: 0,
  }, 88013);

  assert.equal(cells.length, 6);
  assert.equal(new Set(cells).size, cells.length);
  for (const cell of cells) {
    assert.equal(blocked.has(cell), false, `sampled occupied fixture cell ${cell}`);
    assert.equal(world.features[cell], Feature.NONE);
    assert.equal(world.containerMap.has(cell), false);
  }
});

test('black market 88 ships dense trade, guarded contraband, and service-gut monster pressure', () => {
  const gen = timeFloorGeneration('design black_market_88 rework', () => generateDesignFloor('black_market_88'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const marketContainers = gen.world.containers.filter(c => c.tags.includes('market88'));
  const guardedMarketContainers = marketContainers.filter(c => c.tags.some(tag =>
    tag === 'contraband_cache' ||
    tag === 'debt' ||
    tag === 'medicine' ||
    tag === 'weapons' ||
    tag === 'black_route_papers' ||
    tag === 'supplier_betrayal',
  ));
  const serviceRoom = (x: number, y: number): boolean => {
    const cell = gen.world.idx(Math.floor(x), Math.floor(y));
    const room = gen.world.rooms[gen.world.roomMap[cell]];
    return !!room && (
      room.type === RoomType.STORAGE ||
      room.type === RoomType.PRODUCTION ||
      room.name.includes('склад') ||
      room.name.includes('служеб') ||
      room.name.includes('кишка') ||
      room.name.includes('люк') ||
      room.name.includes('кладовая')
    );
  };
  const serviceMonsters = monsters.filter(e => serviceRoom(e.x, e.y)).length;
  const serviceGutZone = (x: number, y: number): boolean => {
    const northSouthGuts = x >= 180 && x <= 844 && ((y >= 286 && y <= 356) || (y >= 676 && y <= 736));
    const westEastGuts = y >= 344 && y <= 660 && (x <= 180 || x >= 844);
    return northSouthGuts || westEastGuts;
  };
  const serviceGutZones = gen.world.zones.filter(zone => serviceGutZone(zone.cx, zone.cy));
  const serviceGutFactionSet = new Set(serviceGutZones.map(zone => zone.faction));
  const hostileServiceGutZones = serviceGutZones.filter(zone =>
    zone.faction === ZoneFaction.WILD || zone.faction === ZoneFaction.SAMOSBOR,
  );
  const marketQuestTags = new Set(SIDE_QUESTS
    .filter(q => q.id.startsWith('market88_'))
    .flatMap(q => q.eventTags ?? []));

  assert.equal(npcs.length >= 1600 && npcs.length <= 3000, true);
  assert.equal(monsters.length >= 300 && monsters.length <= 900, true);
  assert.equal(marketContainers.length >= 14, true);
  assert.equal(guardedMarketContainers.length >= 8, true);
  assert.equal(guardedMarketContainers.every(c => c.access !== 'public' && c.access !== 'room'), true);
  assert.equal(serviceMonsters >= 80, true);
  assert.equal(serviceGutZones.length >= 8, true);
  assert.equal(hostileServiceGutZones.length, serviceGutZones.length);
  assert.equal(serviceGutFactionSet.has(ZoneFaction.WILD), true);
  assert.equal(serviceGutFactionSet.has(ZoneFaction.SAMOSBOR), true);
  for (const tag of ['supplier_delivery', 'protect_courier', 'forgery', 'debt_settlement', 'supplier_betrayal', 'market_scarcity']) {
    assert.equal(marketQuestTags.has(tag), true, `missing Market 88 quest event tag ${tag}`);
  }
});

test('service floor rework keeps sparse crews, pressure panels and machine-maze monsters reachable', () => {
  const route = DESIGN_FLOOR_ROUTES.find(item => item.id === 'service_floor');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 780);
  assert.equal(profile.monsterTarget, 1600);
  assert.equal(profile.npcPlacement.anchors?.length ?? 0, 5);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 8, true);

  const gen = timeFloorGeneration('design service_floor rework', () => generateDesignFloor('service_floor'));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);
  const rescueWorker = gen.entities.find(e => e.plotNpcId === 'service_trapped_pump_worker');
  const panels = getEmergencyPanels(gen.world);
  const panelDefs = new Set(panels.map(panel => panel.defId));
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));

  assert.equal(npcs.length >= 500 && npcs.length <= 1100, true);
  assert.equal(monsters.length >= 900 && monsters.length <= 2200, true);
  assert.equal(maxEntitiesInArea(gen.entities, EntityType.NPC, 32) <= 18, true);
  assert.ok(rescueWorker);
  assertAuditReachable(gen.world, audit, gen.world.idx(Math.floor(rescueWorker.x), Math.floor(rescueWorker.y)), 'service rescue worker');
  assert.equal(panelDefs.has('panel_power'), true);
  assert.equal(panelDefs.has('panel_water'), true);
  assert.equal(panelDefs.has('panel_doors'), true);
  assert.equal(panelDefs.has('panel_vent'), true);
  for (const panel of panels) assertAuditReachable(gen.world, audit, panel.idx, `service panel ${panel.defId}`);
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
  assert.equal(gen.world.railTrains[0].entityIds.every(id => gen.entities.some(e => e.id === id && e.type === EntityType.BILLBOARD)), true);
});

test('smog anomaly spends gasmask filters under sustained exposure', () => {
  const base = makeProceduralFloorSpec(606, -35);
  const spec = {
    ...base,
    anomalyId: 'smog' as const,
    danger: Math.max(3, base.danger) as typeof base.danger,
    title: `говнячный смог: ${base.title}`,
  };
  const state = makeGameState({ currentFloor: spec.baseFloor, time: 10 });
  setFloorRunState(state, {
    runSeed: 606,
    currentZ: spec.z,
    specs: { [spec.key]: spec },
    visited: {},
  }, spec.baseFloor);

  const world = new World();
  const smogIdx = world.idx(24, 24);
  world.cells[smogIdx] = Cell.FLOOR;
  world.anomalySmogSource = smogIdx;
  world.anomalySmogCells = [smogIdx];
  world.fog[smogIdx] = 255;
  const player = makeTestPlayer({
    id: 9001,
    x: 24.5,
    y: 24.5,
    hp: 100,
    maxHp: 100,
    inventory: [{ defId: 'gasmask_filter', count: 1 }],
  });

  for (let i = 0; i < 80 && countInventoryItem(player, 'gasmask_filter') > 0; i++) {
    updateProceduralAnomalies(world, player, state, 2.5);
    state.time += 2.5;
  }

  assert.equal(countInventoryItem(player, 'gasmask_filter'), 0);
  assert.equal(player.hp, 100);
  const spent = getRecentEvents(state, { type: 'player_use_item', tags: ['smog', 'spent'], limit: 1 })[0];
  assert.equal(spent?.itemId, 'gasmask_filter');
});

test('smog anomaly spends wet rag bundles as short wet-cloth mitigation', () => {
  const base = makeProceduralFloorSpec(608, -35);
  const spec = {
    ...base,
    anomalyId: 'smog' as const,
    danger: Math.max(3, base.danger) as typeof base.danger,
    title: `говнячный смог: ${base.title}`,
  };
  const state = makeGameState({ currentFloor: spec.baseFloor, time: 10 });
  setFloorRunState(state, {
    runSeed: 608,
    currentZ: spec.z,
    specs: { [spec.key]: spec },
    visited: {},
  }, spec.baseFloor);

  const world = new World();
  const smogIdx = world.idx(30, 30);
  world.cells[smogIdx] = Cell.FLOOR;
  world.anomalySmogSource = smogIdx;
  world.anomalySmogCells = [smogIdx];
  world.fog[smogIdx] = 255;
  const player = makeTestPlayer({
    id: 9002,
    x: 30.5,
    y: 30.5,
    hp: 100,
    maxHp: 100,
    inventory: [{ defId: 'wet_rag_bundle', count: 1 }],
  });

  assert.equal(getProceduralSmogStatus(world, player, state).protection, 'cloth_ready');
  updateProceduralAnomalies(world, player, state, 2.5);

  assert.equal(countInventoryItem(player, 'wet_rag_bundle'), 0);
  assert.equal(player.hp, 100);
  assert.equal(getProceduralSmogStatus(world, player, state).protection, 'wet_cloth');
  const spent = getRecentEvents(state, { type: 'player_use_item', tags: ['wet_rag_bundle', 'spent'], limit: 1 })[0];
  assert.equal(spent?.itemId, 'wet_rag_bundle');
  assert.equal(spent?.data?.durationSeconds, 45);
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

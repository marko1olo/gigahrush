/* ── Per-run vertical procedural floor route ─────────────────── */

import {
  FloorLevel,
  LiftDirection,
  MonsterKind,
  type GameState,
} from '../core/types';
import {
  FLOOR_ANOMALIES,
  FLOOR_GEOMETRIES,
  FLOOR_MAJORITY_FACTIONS,
  FLOOR_RUN_MAX_Z,
  FLOOR_RUN_MIN_Z,
  FLOOR_RUN_VOID_Z,
  PROCEDURAL_FLOOR_COUNT,
  PROCEDURAL_FLOOR_ZS,
  anomalyById,
  floorRunZAllowsNpcs,
  type FloorAnomalyId,
  type FloorGeometryId,
  type FloorMajorityId,
  type ProceduralFloorSpec,
  isProceduralFloorZ,
  makeProceduralFloorSpec,
  proceduralFloorKey,
  storyFloorAtZ,
  zForStoryFloor,
} from '../data/procedural_floors';
import {
  designFloorAtZ,
  type DesignFloorId,
} from '../data/design_floors';

export interface FloorRunState {
  runSeed: number;
  currentZ: number;
  specs: Record<string, ProceduralFloorSpec>;
  visited: Record<string, boolean>;
}

export interface FloorRunEntry {
  z: number;
  baseFloor: FloorLevel;
  storyFloor?: FloorLevel;
  designFloorId?: DesignFloorId;
  spec?: ProceduralFloorSpec;
  procedural: boolean;
  label: string;
  color: string;
}

type FloorRunHost = GameState & { floorRun?: FloorRunState };

const STORY_NAMES: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'Министерство',
  [FloorLevel.KVARTIRY]: 'Квартиры',
  [FloorLevel.LIVING]: 'Жилая зона',
  [FloorLevel.MAINTENANCE]: 'Коллекторы',
  [FloorLevel.HELL]: 'Мясной низ',
  [FloorLevel.VOID]: 'Пустота',
};

const MAX_RUN_SEED = 0x7fffffff;
const MAX_SAVED_TITLE = 96;
const MAX_SAVED_ID = 64;
const VALID_GEOMETRY_IDS = new Set<FloorGeometryId>(FLOOR_GEOMETRIES.map(def => def.id));
const VALID_MAJORITY_IDS = new Set<FloorMajorityId>(FLOOR_MAJORITY_FACTIONS.map(def => def.id));
const VALID_ANOMALY_IDS = new Set<FloorAnomalyId>(FLOOR_ANOMALIES.map(def => def.id));

function randomRunSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRunSeed(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return randomRunSeed();
  const seed = Math.abs(Math.trunc(value)) % MAX_RUN_SEED;
  return seed;
}

function isFloorGeometryId(value: unknown): value is FloorGeometryId {
  return typeof value === 'string' && VALID_GEOMETRY_IDS.has(value as FloorGeometryId);
}

function isFloorMajorityId(value: unknown): value is FloorMajorityId {
  return typeof value === 'string' && VALID_MAJORITY_IDS.has(value as FloorMajorityId);
}

function isFloorAnomalyId(value: unknown): value is FloorAnomalyId {
  return typeof value === 'string' && VALID_ANOMALY_IDS.has(value as FloorAnomalyId);
}

function isMonsterKind(value: unknown): value is MonsterKind {
  return typeof value === 'number' && Number.isInteger(value) && MonsterKind[value] !== undefined;
}

function cleanStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (out.length >= maxItems) break;
    if (typeof item !== 'string') continue;
    const clean = item.slice(0, MAX_SAVED_ID);
    if (clean && !out.includes(clean)) out.push(clean);
  }
  return out;
}

function cleanMonsterKinds(value: unknown, fallback: MonsterKind[]): MonsterKind[] {
  if (!Array.isArray(value)) return fallback;
  const out: MonsterKind[] = [];
  for (const item of value) {
    if (out.length >= 4) break;
    if (isMonsterKind(item) && !out.includes(item)) out.push(item);
  }
  return out.length > 0 ? out : fallback;
}

function createSpecDeck(runSeed: number): Record<string, ProceduralFloorSpec> {
  const specs: Record<string, ProceduralFloorSpec> = {};
  for (const z of PROCEDURAL_FLOOR_ZS) {
    specs[proceduralFloorKey(z)] = makeProceduralFloorSpec(runSeed, z);
  }
  return specs;
}

function normalizeZ(value: unknown, fallbackFloor: FloorLevel): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const z = Math.trunc(value);
    if ((z >= FLOOR_RUN_MIN_Z && z <= FLOOR_RUN_MAX_Z) || z === FLOOR_RUN_VOID_Z) return z;
  }
  return zForStoryFloor(fallbackFloor);
}

function normalizeSpec(input: unknown, runSeed: number, z: number): ProceduralFloorSpec {
  const fallback = makeProceduralFloorSpec(runSeed, z);
  if (!isRecord(input)) return fallback;
  const src = input as Partial<ProceduralFloorSpec>;
  if (src.z !== z) return fallback;
  const geometryId = isFloorGeometryId(src.geometryId) ? src.geometryId : fallback.geometryId;
  const majorityId = isFloorMajorityId(src.majorityId) ? src.majorityId : fallback.majorityId;
  const anomalyId = isFloorAnomalyId(src.anomalyId) ? src.anomalyId : fallback.anomalyId;
  const geometry = FLOOR_GEOMETRIES.find(def => def.id === geometryId);
  const title = typeof src.title === 'string' && src.title.trim()
    ? src.title.trim().slice(0, MAX_SAVED_TITLE)
    : fallback.title;
  return {
    key: proceduralFloorKey(z),
    z,
    seed: normalizeRunSeed(src.seed ?? fallback.seed),
    ordinal: fallback.ordinal,
    depth: fallback.depth,
    danger: Math.max(1, Math.min(5, Math.round(src.danger ?? fallback.danger))) as 1 | 2 | 3 | 4 | 5,
    geometryId,
    baseFloor: geometry?.baseFloor ?? fallback.baseFloor,
    majorityId,
    anomalyId,
    title,
    lootBiasIds: cleanStringArray(src.lootBiasIds, 5),
    monsterBiasKinds: cleanMonsterKinds(src.monsterBiasKinds, fallback.monsterBiasKinds),
  };
}

export function createFloorRunState(currentFloor = FloorLevel.LIVING): FloorRunState {
  const runSeed = randomRunSeed();
  return {
    runSeed,
    currentZ: zForStoryFloor(currentFloor),
    specs: createSpecDeck(runSeed),
    visited: {},
  };
}

export function normalizeFloorRunState(
  input: Partial<FloorRunState> | null | undefined,
  currentFloor = FloorLevel.LIVING,
): FloorRunState {
  const runSeed = normalizeRunSeed(input?.runSeed);
  const out: FloorRunState = {
    runSeed,
    currentZ: normalizeZ(input?.currentZ, currentFloor),
    specs: createSpecDeck(runSeed),
    visited: {},
  };
  const savedSpecs = input?.specs ?? {};
  for (const z of PROCEDURAL_FLOOR_ZS) {
    const key = proceduralFloorKey(z);
    out.specs[key] = normalizeSpec(savedSpecs[key], runSeed, z);
  }
  const visited = input?.visited ?? {};
  for (const z of PROCEDURAL_FLOOR_ZS) {
    const key = proceduralFloorKey(z);
    if (visited[key]) out.visited[key] = true;
  }
  return out;
}

export function floorRunSaveHasRestorableRoute(input: unknown): boolean {
  if (!isRecord(input)) return false;
  const z = input.currentZ;
  return typeof z === 'number' && Number.isFinite(z) && z >= FLOOR_RUN_MIN_Z && z <= FLOOR_RUN_MAX_Z;
}

export function ensureFloorRunState(state: GameState, currentFloor = state.currentFloor): FloorRunState {
  const host = state as FloorRunHost;
  host.floorRun = normalizeFloorRunState(host.floorRun, currentFloor);
  return host.floorRun;
}

export function setFloorRunState(
  state: GameState,
  input: Partial<FloorRunState> | null | undefined,
  currentFloor = state.currentFloor,
): FloorRunState {
  const normalized = normalizeFloorRunState(input, currentFloor);
  (state as FloorRunHost).floorRun = normalized;
  return normalized;
}

export function floorRunStateForSave(state: GameState): FloorRunState {
  return normalizeFloorRunState((state as FloorRunHost).floorRun, state.currentFloor);
}

function entryForZ(state: GameState, z: number): FloorRunEntry | null {
  const storyFloor = storyFloorAtZ(z);
  if (storyFloor !== undefined) {
    return {
      z,
      baseFloor: storyFloor,
      storyFloor,
      procedural: false,
      label: STORY_NAMES[storyFloor],
      color: storyFloor === FloorLevel.HELL ? '#f44' : storyFloor === FloorLevel.VOID ? '#0f8' : '#4af',
    };
  }
  const designFloor = designFloorAtZ(z);
  if (designFloor) {
    return {
      z,
      baseFloor: designFloor.baseFloor,
      designFloorId: designFloor.id,
      procedural: false,
      label: `Этаж ${formatFloorZ(z)}: ${designFloor.displayName}`,
      color: designFloor.color,
    };
  }
  if (!isProceduralFloorZ(z)) return null;
  const run = ensureFloorRunState(state);
  const spec = run.specs[proceduralFloorKey(z)] ?? makeProceduralFloorSpec(run.runSeed, z);
  run.specs[spec.key] = spec;
  return {
    z,
    baseFloor: spec.baseFloor,
    spec,
    procedural: true,
    label: `Этаж ${formatFloorZ(z)}: ${spec.title}`,
    color: spec.anomalyId === 'none' ? '#8cf' : '#c8f',
  };
}

export function currentFloorRunEntry(state: GameState): FloorRunEntry {
  const run = ensureFloorRunState(state);
  return entryForZ(state, run.currentZ) ?? {
    z: zForStoryFloor(state.currentFloor),
    baseFloor: state.currentFloor,
    storyFloor: state.currentFloor,
    procedural: false,
    label: STORY_NAMES[state.currentFloor],
    color: '#4af',
  };
}

export function resolveFloorRunRoute(state: GameState, direction: LiftDirection): FloorRunEntry | null {
  const run = ensureFloorRunState(state);
  const dz = direction === LiftDirection.DOWN ? 1 : -1;
  const targetZ = run.currentZ + dz;
  if (targetZ < FLOOR_RUN_MIN_Z || targetZ > FLOOR_RUN_MAX_Z) return null;
  return entryForZ(state, targetZ);
}

export function commitFloorRunEntry(state: GameState, entry: FloorRunEntry): void {
  const run = ensureFloorRunState(state);
  run.currentZ = entry.z;
  if (entry.spec) run.visited[entry.spec.key] = true;
}

export function forceFloorRunStory(state: GameState, floor: FloorLevel): void {
  const run = ensureFloorRunState(state, floor);
  run.currentZ = zForStoryFloor(floor);
}

export function isCurrentProceduralFloor(state: GameState): boolean {
  return currentFloorRunEntry(state).procedural;
}

export function currentProceduralFloorSpec(state: GameState): ProceduralFloorSpec | undefined {
  return currentFloorRunEntry(state).spec;
}

export function isCurrentStoryFloor(state: GameState, floor: FloorLevel): boolean {
  const entry = currentFloorRunEntry(state);
  return !entry.procedural && entry.storyFloor === floor;
}

export function currentFloorRunLabel(state: GameState): string | undefined {
  const entry = currentFloorRunEntry(state);
  if (entry.designFloorId) return `Z${formatFloorZ(entry.z)} ${entry.label.replace(/^Этаж [^:]+: /, '')}`;
  if (!entry.procedural) return undefined;
  const spec = entry.spec;
  if (!spec) return undefined;
  return `Z${formatFloorZ(entry.z)} №${spec.ordinal}/${PROCEDURAL_FLOOR_COUNT} ур.${spec.danger} ${spec.title}`;
}

export function floorRunEntryAllowsNpcs(entry: FloorRunEntry): boolean {
  return floorRunZAllowsNpcs(entry.z);
}

export function currentFloorRunAllowsNpcs(state: GameState): boolean {
  return floorRunEntryAllowsNpcs(currentFloorRunEntry(state));
}

export function adjustFloorRunSamosborTimer(state: GameState, baseTimer: number): number {
  const spec = currentProceduralFloorSpec(state);
  if (!spec) return baseTimer;
  const anomalyPressure = spec.anomalyId === 'samosbor_seed'
    ? 0.35
    : spec.anomalyId === 'smog'
      ? 0.18
      : spec.anomalyId === 'false_safe_block'
        ? -0.12
        : spec.anomalyId === 'hladon'
          ? 0.12
          : spec.anomalyId === 'wall_snake' || spec.anomalyId === 'section_shift' || spec.anomalyId === 'conway_life' || spec.anomalyId === 'bad_apple_world' || spec.anomalyId === 'zombie_apocalypse'
            ? 0.2
            : spec.anomalyId === 'cement_memory'
              ? 0.14
              : spec.anomalyId === 'radio_chess' || spec.anomalyId === 'conveyor_sorter' || spec.anomalyId === 'fractal_floor' || spec.anomalyId === 'mirror_run' || spec.anomalyId === 'rail_trains'
                ? 0.08
          : 0;
  const dangerPressure = (spec.danger - 1) * 0.08;
  return Math.max(45, baseTimer * (1 - anomalyPressure - dangerPressure));
}

function clampRunDanger(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function stripAnomalyPrefix(title: string): string {
  const idx = title.indexOf(': ');
  return idx >= 0 ? title.slice(idx + 2) : title;
}

export function forceProceduralFloorAnomaly(state: GameState, anomalyId: FloorAnomalyId): ProceduralFloorSpec | undefined {
  const run = ensureFloorRunState(state);
  for (const z of PROCEDURAL_FLOOR_ZS) {
    const spec = run.specs[proceduralFloorKey(z)];
    if (spec?.anomalyId === anomalyId) return spec;
  }

  const anomaly = anomalyById(anomalyId);
  const z = PROCEDURAL_FLOOR_ZS.find(candidate => {
    const spec = run.specs[proceduralFloorKey(candidate)];
    return spec && spec.danger >= anomaly.minDanger;
  }) ?? PROCEDURAL_FLOOR_ZS[0];
  if (z === undefined) return undefined;
  const key = proceduralFloorKey(z);
  const spec = run.specs[key] ?? makeProceduralFloorSpec(run.runSeed, z);
  const forced: ProceduralFloorSpec = {
    ...spec,
    anomalyId,
    danger: clampRunDanger(Math.max(spec.danger, anomaly.minDanger) + anomaly.dangerBias),
    title: anomalyId === 'none' ? stripAnomalyPrefix(spec.title) : `${anomaly.title}: ${stripAnomalyPrefix(spec.title)}`,
  };
  run.specs[key] = forced;
  return forced;
}

export function summarizeFloorRun(state: GameState): string[] {
  const run = ensureFloorRunState(state);
  const entry = currentFloorRunEntry(state);
  const visited = Object.keys(run.visited).length;
  const out = [
    `z=${entry.z} seed=${run.runSeed} ${entry.procedural ? 'procedural' : entry.designFloorId ? 'design' : 'story'} ${entry.label}`,
    `visited=${visited}/${PROCEDURAL_FLOOR_COUNT}`,
  ];
  if (entry.spec) {
    out.push(`geom=${entry.spec.geometryId} faction=${entry.spec.majorityId} anomaly=${entry.spec.anomalyId} danger=${entry.spec.danger}`);
    out.push(`loot=${entry.spec.lootBiasIds.join(',') || 'none'} monsters=${entry.spec.monsterBiasKinds.join(',') || 'none'}`);
  }
  const anomalyCounts: Record<string, number> = {};
  for (const spec of Object.values(run.specs)) {
    if (spec.anomalyId === 'none') continue;
    anomalyCounts[spec.anomalyId] = (anomalyCounts[spec.anomalyId] ?? 0) + 1;
  }
  const anomalyLine = Object.entries(anomalyCounts).map(([id, count]) => `${id}=${count}`).join(' ');
  if (anomalyLine) out.push(`anomalies ${anomalyLine}`);
  if (entry.designFloorId) out.push(`route=${entry.designFloorId} base=${FloorLevel[entry.baseFloor]}`);
  return out;
}

function formatFloorZ(z: number): string {
  return z > 0 ? `+${z}` : `${z}`;
}

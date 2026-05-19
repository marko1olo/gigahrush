/* ── Elevator floor instances: rare numbered route anomalies ─── */

import {
  EntityType,
  FloorLevel,
  LiftDirection,
  msg,
  type Entity,
  type GameState,
  type WorldEventDraft,
} from '../core/types';
import { World } from '../core/world';
import {
  FLOOR_INSTANCES,
  floorInstanceById,
  type FloorInstanceDef,
} from '../data/floor_instances';
import { publishEvent } from './events';
import { rememberRumor } from './npc_memory';

export interface ActiveFloorInstance {
  id: string;
  displayNumber: string;
  title: string;
  baseFloor: FloorLevel;
  seed: number;
  seedTag: string;
  risk: number;
  enteredAt: number;
  fromFloor: FloorLevel;
  intendedFloor: FloorLevel;
  direction: LiftDirection;
  returnFloor: FloorLevel;
}

export interface FloorInstanceState {
  current: ActiveFloorInstance | null;
  discovered: Record<string, boolean>;
  anomalyCount: number;
  lastStableFloor: FloorLevel;
  lastAnomalyAt: number;
  lastRoll: number;
  routeGuardUntil: number;
  lastFollowupId: string;
}

export interface ElevatorRouteResolution {
  targetFloor: FloorLevel;
  activeInstance: ActiveFloorInstance | null;
  anomaly: boolean;
  leavingInstance: boolean;
  exitedInstance: ActiveFloorInstance | null;
}

type FloorInstanceHost = GameState & { floorInstances?: FloorInstanceState };

const BASE_FLOORS = [
  FloorLevel.MINISTRY,
  FloorLevel.KVARTIRY,
  FloorLevel.LIVING,
  FloorLevel.MAINTENANCE,
  FloorLevel.HELL,
  FloorLevel.VOID,
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readFloor(value: unknown): FloorLevel | undefined {
  return typeof value === 'number' && BASE_FLOORS.includes(value as FloorLevel)
    ? value as FloorLevel
    : undefined;
}

function normalizeFloor(value: unknown, fallback: FloorLevel): FloorLevel {
  return readFloor(value) ?? fallback;
}

function normalizeDirection(value: unknown): LiftDirection {
  return value === LiftDirection.UP ? LiftDirection.UP : LiftDirection.DOWN;
}

function normalizeRisk(value: unknown, fallback: 1 | 2 | 3 | 4 | 5): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(Number(value) || fallback))) as 1 | 2 | 3 | 4 | 5;
}

function normalizeSeed(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.abs(Math.trunc(value)) % 0x7fffffff
    : Math.floor(Math.random() * 0x7fffffff);
}

function normalizeFinite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function createDiscovered(): Record<string, boolean> {
  const discovered: Record<string, boolean> = {};
  for (const def of FLOOR_INSTANCES) if (def.discovered) discovered[def.id] = true;
  return discovered;
}

export function createFloorInstanceState(stableFloor = FloorLevel.LIVING): FloorInstanceState {
  return {
    current: null,
    discovered: createDiscovered(),
    anomalyCount: 0,
    lastStableFloor: stableFloor,
    lastAnomalyAt: -Infinity,
    lastRoll: 1,
    routeGuardUntil: 0,
    lastFollowupId: '',
  };
}

function normalizeActive(input: Partial<ActiveFloorInstance> | null | undefined): ActiveFloorInstance | null {
  if (!isRecord(input) || typeof input.id !== 'string') return null;
  const def = floorInstanceById(input.id);
  if (!def) return null;
  const fromFloor = readFloor(input.fromFloor);
  const intendedFloor = readFloor(input.intendedFloor);
  const returnFloor = readFloor(input.returnFloor);
  if (fromFloor === undefined || intendedFloor === undefined || returnFloor === undefined) return null;
  return {
    id: def.id,
    displayNumber: def.displayNumber,
    title: def.title,
    baseFloor: def.baseFloor,
    seed: normalizeSeed(input.seed),
    seedTag: typeof input.seedTag === 'string' ? input.seedTag : def.seedTag,
    risk: normalizeRisk(input.risk, def.risk),
    enteredAt: Math.max(0, normalizeFinite(input.enteredAt, 0)),
    fromFloor,
    intendedFloor,
    direction: normalizeDirection(input.direction),
    returnFloor,
  };
}

export function normalizeFloorInstanceState(
  input: Partial<FloorInstanceState> | null | undefined,
  stableFloor = FloorLevel.LIVING,
): FloorInstanceState {
  const out = createFloorInstanceState(stableFloor);
  if (!input) return out;
  out.current = normalizeActive(input.current);
  out.anomalyCount = Math.min(999, Math.max(0, Math.floor(Number(input.anomalyCount) || 0)));
  out.lastStableFloor = normalizeFloor(input.lastStableFloor, stableFloor);
  out.lastAnomalyAt = normalizeFinite(input.lastAnomalyAt, -Infinity);
  out.lastRoll = Math.max(0, Math.min(1, normalizeFinite(input.lastRoll, 1)));
  out.routeGuardUntil = Math.max(0, normalizeFinite(input.routeGuardUntil, 0));
  out.lastFollowupId = typeof input.lastFollowupId === 'string' ? input.lastFollowupId : '';
  const discovered = isRecord(input.discovered) ? input.discovered : {};
  for (const def of FLOOR_INSTANCES) {
    if (def.discovered || discovered[def.id] === true || out.current?.id === def.id) out.discovered[def.id] = true;
  }
  return out;
}

export function ensureFloorInstanceState(state: GameState, stableFloor = state.currentFloor): FloorInstanceState {
  const host = state as FloorInstanceHost;
  host.floorInstances = normalizeFloorInstanceState(host.floorInstances, stableFloor);
  return host.floorInstances;
}

export function setFloorInstanceState(
  state: GameState,
  input: Partial<FloorInstanceState> | null | undefined,
  stableFloor = state.currentFloor,
): FloorInstanceState {
  const normalized = normalizeFloorInstanceState(input, stableFloor);
  (state as FloorInstanceHost).floorInstances = normalized;
  return normalized;
}

export function floorInstanceStateForSave(state: GameState): FloorInstanceState {
  return normalizeFloorInstanceState((state as FloorInstanceHost).floorInstances, state.currentFloor);
}

export function getActiveFloorInstance(state: GameState): ActiveFloorInstance | null {
  return normalizeFloorInstanceState((state as FloorInstanceHost).floorInstances, state.currentFloor).current;
}

export function floorInstanceLabel(instance: ActiveFloorInstance): string {
  return `№${instance.displayNumber} «${instance.title}»`;
}

export function currentFloorInstanceLabel(state: GameState): string | undefined {
  const active = getActiveFloorInstance(state);
  return active ? floorInstanceLabel(active) : undefined;
}

function anomalyChance(state: GameState): number {
  const store = ensureFloorInstanceState(state);
  if (state.time < store.routeGuardUntil) return 0;
  const cooldown = state.time - store.lastAnomalyAt < 90;
  if (cooldown) return 0;
  let chance = 0.025;
  if (state.samosborActive) chance += 0.055;
  chance += Math.min(0.015, state.samosborCount * 0.002);
  return Math.min(0.095, chance);
}

function pickInstance(fromFloor: FloorLevel, intendedFloor: FloorLevel): FloorInstanceDef | undefined {
  let total = 0;
  const candidates: FloorInstanceDef[] = [];
  for (const def of FLOOR_INSTANCES) {
    if (def.weight <= 0) continue;
    if (def.baseFloor === FloorLevel.VOID) continue;
    const nearRoute = def.baseFloor === fromFloor || def.baseFloor === intendedFloor;
    const weight = nearRoute ? def.weight * 2 : def.weight;
    total += weight;
    for (let i = 0; i < weight; i++) candidates.push(def);
  }
  if (total <= 0 || candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function makeActiveInstance(
  def: FloorInstanceDef,
  state: GameState,
  fromFloor: FloorLevel,
  intendedFloor: FloorLevel,
  direction: LiftDirection,
): ActiveFloorInstance {
  return {
    id: def.id,
    displayNumber: def.displayNumber,
    title: def.title,
    baseFloor: def.baseFloor,
    seed: Math.floor(Math.random() * 0x7fffffff),
    seedTag: def.seedTag,
    risk: def.risk,
    enteredAt: state.time,
    fromFloor,
    intendedFloor,
    direction,
    returnFloor: intendedFloor,
  };
}

function publishElevatorInstanceEvent(
  state: GameState,
  eventType: 'elevator_anomaly' | 'elevator_loop_exit',
  instance: ActiveFloorInstance,
  zoneId: number | undefined,
  extraTags: readonly string[] = [],
  extraData: Record<string, unknown> = {},
): void {
  publishEvent(state, {
    type: eventType,
    floor: instance.baseFloor,
    zoneId,
    severity: eventType === 'elevator_anomaly' ? 4 : 3,
    privacy: 'local',
    tags: ['elevator', 'floor_instance', instance.id, eventType === 'elevator_anomaly' ? 'wrong_route' : 'loop_exit', ...extraTags],
    data: {
      displayNumber: instance.displayNumber,
      title: instance.title,
      seed: instance.seed,
      seedTag: instance.seedTag,
      risk: instance.risk,
      fromFloor: instance.fromFloor,
      intendedFloor: instance.intendedFloor,
      returnFloor: instance.returnFloor,
      ...extraData,
    },
  } as WorldEventDraft);
}

function applyElevatorInstanceFollowup(
  state: GameState,
  store: FloorInstanceState,
  instance: ActiveFloorInstance,
): { tags: readonly string[]; data: Record<string, unknown> } {
  const followup = floorInstanceById(instance.id)?.followup;
  if (!followup) return { tags: [], data: {} };
  store.routeGuardUntil = Math.max(store.routeGuardUntil, state.time + followup.suppressSeconds);
  store.lastFollowupId = followup.id;
  state.msgs.push(msg(followup.message, state.time, '#fc8'));
  return {
    tags: ['followup', followup.id, ...followup.tags],
    data: {
      followupId: followup.id,
      followupTitle: followup.title,
      routeGuardUntil: store.routeGuardUntil,
      suppressSeconds: followup.suppressSeconds,
    },
  };
}

export function resolveElevatorRoute(
  state: GameState,
  fromFloor: FloorLevel,
  intendedFloor: FloorLevel,
  direction: LiftDirection,
  zoneId?: number,
): ElevatorRouteResolution {
  const store = ensureFloorInstanceState(state, fromFloor);
  const active = store.current ? normalizeActive(store.current) : null;
  if (active) {
    store.current = null;
    store.lastStableFloor = intendedFloor;
    const followup = applyElevatorInstanceFollowup(state, store, active);
    publishElevatorInstanceEvent(state, 'elevator_loop_exit', active, zoneId, followup.tags, followup.data);
    return {
      targetFloor: intendedFloor,
      activeInstance: null,
      anomaly: false,
      leavingInstance: true,
      exitedInstance: active,
    };
  }

  store.lastStableFloor = fromFloor;
  store.lastRoll = Math.random();
  if (store.lastRoll >= anomalyChance(state)) {
    return {
      targetFloor: intendedFloor,
      activeInstance: null,
      anomaly: false,
      leavingInstance: false,
      exitedInstance: null,
    };
  }

  const def = pickInstance(fromFloor, intendedFloor);
  if (!def) {
    return {
      targetFloor: intendedFloor,
      activeInstance: null,
      anomaly: false,
      leavingInstance: false,
      exitedInstance: null,
    };
  }

  const instance = makeActiveInstance(def, state, fromFloor, intendedFloor, direction);
  store.current = instance;
  store.discovered[def.id] = true;
  store.anomalyCount++;
  store.lastAnomalyAt = state.time;
  publishElevatorInstanceEvent(state, 'elevator_anomaly', instance, zoneId);
  return {
    targetFloor: def.baseFloor,
    activeInstance: instance,
    anomaly: true,
    leavingInstance: false,
    exitedInstance: null,
  };
}

export function spreadElevatorInstanceRumor(
  world: World,
  entities: Entity[],
  player: Entity,
  state: GameState,
  instance: ActiveFloorInstance,
): number {
  const def = floorInstanceById(instance.id);
  const rumorId = def?.rumorId ?? 'floor_lift_smell';
  let remembered = 0;
  for (const e of entities) {
    if (remembered >= 8) break;
    if (!e.alive || e.type !== EntityType.NPC) continue;
    if (world.dist2(player.x, player.y, e.x, e.y) > 144) continue;
    if (rememberRumor(e, rumorId, state.time)) remembered++;
    rememberRumor(e, 'floor_lift_smell', state.time);
  }
  return remembered;
}

export function summarizeFloorInstances(state: GameState): string[] {
  const store = ensureFloorInstanceState(state);
  const active = store.current;
  const out = [
    active
      ? `active ${floorInstanceLabel(active)} base=${FloorLevel[active.baseFloor]} risk=${active.risk} seed=${active.seed}`
      : 'active none',
    `anomalies=${store.anomalyCount} lastRoll=${store.lastRoll.toFixed(3)} lastStable=${FloorLevel[store.lastStableFloor]}`,
  ];
  if (store.routeGuardUntil > 0) out.push(`routeGuardUntil=${store.routeGuardUntil.toFixed(1)} lastFollowup=${store.lastFollowupId || 'none'}`);
  const discovered = FLOOR_INSTANCES.filter(def => store.discovered[def.id]).map(def => `№${def.displayNumber}`);
  out.push(`discovered=${discovered.length ? discovered.join(', ') : 'none'}`);
  return out;
}

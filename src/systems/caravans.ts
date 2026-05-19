import {
  FloorLevel,
  type GameState,
  type WorldEvent,
} from '../core/types';
import { CARAVAN_LANE_BY_ID, CARAVAN_LANES, type CaravanLaneDef } from '../data/caravans';
import { changeResourceStock } from './economy';
import { publishEvent, registerWorldEventObserver } from './events';

export const CARAVAN_TICK_SECONDS = 30;
export const MAX_CARAVAN_LANES_PER_TICK = 2;

const TARIFF_DURATION_SECONDS = 12 * 60;
const MIN_STABILITY = 0.25;
const MAX_STABILITY = 1.25;

export interface CaravanLaneState {
  id: string;
  open: boolean;
  stability: number;
  tariffPressure: number;
  tariffPaidUntil: number;
  lastTickAt: number;
  nextTickAt: number;
  runs: number;
  raids: number;
}

export interface CaravanState {
  tickAccum: number;
  cursor: number;
  lanes: Record<string, CaravanLaneState>;
}

type CaravanGameState = GameState & { caravans?: CaravanState };

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function laneInterval(def: CaravanLaneDef): number {
  let hash = 0;
  for (let i = 0; i < def.id.length; i++) hash = (hash * 33 + def.id.charCodeAt(i)) | 0;
  return 65 + (Math.abs(hash) % 45);
}

function initialLaneState(def: CaravanLaneDef, now: number): CaravanLaneState {
  return {
    id: def.id,
    open: def.startsOpen !== false,
    stability: def.startsOpen === false ? 0.55 : 0.85,
    tariffPressure: def.startsOpen === false ? 0.18 : 0.08,
    tariffPaidUntil: 0,
    lastTickAt: 0,
    nextTickAt: now + laneInterval(def),
    runs: 0,
    raids: 0,
  };
}

function saneNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeLaneState(def: CaravanLaneDef, raw: Partial<CaravanLaneState> | undefined, now: number): CaravanLaneState {
  const base = initialLaneState(def, now);
  if (!raw) return base;
  return {
    id: def.id,
    open: typeof raw.open === 'boolean' ? raw.open : base.open,
    stability: clamp(saneNumber(raw.stability, base.stability), MIN_STABILITY, MAX_STABILITY),
    tariffPressure: clamp(saneNumber(raw.tariffPressure, base.tariffPressure), 0, 1.75),
    tariffPaidUntil: saneNumber(raw.tariffPaidUntil, base.tariffPaidUntil),
    lastTickAt: saneNumber(raw.lastTickAt, base.lastTickAt),
    nextTickAt: saneNumber(raw.nextTickAt, base.nextTickAt),
    runs: Math.max(0, Math.floor(saneNumber(raw.runs, base.runs))),
    raids: Math.max(0, Math.floor(saneNumber(raw.raids, base.raids))),
  };
}

export function ensureCaravanState(state: GameState): CaravanState {
  const s = state as CaravanGameState;
  const raw = s.caravans;
  const next: CaravanState = {
    tickAccum: clamp(saneNumber(raw?.tickAccum, 0), 0, CARAVAN_TICK_SECONDS),
    cursor: Math.max(0, Math.floor(saneNumber(raw?.cursor, 0))),
    lanes: {},
  };
  for (const def of CARAVAN_LANES) {
    next.lanes[def.id] = normalizeLaneState(def, raw?.lanes?.[def.id], state.time);
  }
  s.caravans = next;
  return next;
}

function uniqueResourceIds(def: CaravanLaneDef): string[] {
  const ids: string[] = [];
  for (const id of [...def.tariffResourceIds, ...def.resourceDeltas.map(delta => delta.resourceId)]) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function caravanTags(def: CaravanLaneDef, extra: readonly string[] = []): string[] {
  const tags: string[] = ['caravan', 'tariff', 'supply_lane', def.id];
  for (const resourceId of uniqueResourceIds(def)) if (!tags.includes(resourceId)) tags.push(resourceId);
  for (const corpId of def.corpIds ?? []) {
    const tag = `corp_${corpId}`;
    if (!tags.includes(tag)) tags.push(tag);
  }
  for (const tag of extra) if (tag && !tags.includes(tag)) tags.push(tag);
  return tags;
}

function deltaCountsFor(def: CaravanLaneDef, multiplier: number): number[] {
  return def.resourceDeltas.map(delta => Math.max(1, Math.round(delta.count * multiplier)));
}

function rumorIdsFor(def: CaravanLaneDef): string[] {
  const resources = uniqueResourceIds(def);
  if (resources.includes('drink_water')) return ['economy_water_price'];
  if (resources.includes('food')) return ['economy_kitchen_stock'];
  return ['economy_factory_tick'];
}

function publishCaravanEvent(
  state: GameState,
  def: CaravanLaneDef,
  lane: CaravanLaneState,
  action: string,
  severity: 3 | 4 | 5,
  extraTags: readonly string[],
  counts?: readonly number[],
  source?: WorldEvent,
): void {
  publishEvent(state, {
    type: 'faction_relation_changed',
    floor: def.toFloor,
    zoneId: source?.zoneId,
    roomId: source?.roomId,
    x: source?.x,
    y: source?.y,
    actorId: source?.actorId,
    actorName: source?.actorName ?? (action === 'tick' ? 'Караван' : undefined),
    actorFaction: source?.actorFaction ?? def.faction,
    targetName: def.name,
    targetFaction: def.faction,
    severity,
    privacy: severity >= 4 ? 'public' : 'local',
    tags: caravanTags(def, ['faction_event', action, ...extraTags]),
    data: {
      factionEventId: 'caravan_supply_lane',
      name: def.name,
      laneId: def.id,
      caravanAction: action,
      fromFloor: FloorLevel[def.fromFloor],
      toFloor: FloorLevel[def.toFloor],
      resourceIds: def.resourceDeltas.map(delta => delta.resourceId),
      deltaCounts: counts,
      tariffMultiplier: getCaravanLaneTariffMultiplier(state, def.id),
      stability: Number(lane.stability.toFixed(2)),
      corpId: def.corpIds?.[0],
      rumorIds: rumorIdsFor(def),
    },
  });
}

function processLane(state: GameState, def: CaravanLaneDef, lane: CaravanLaneState, force: boolean): boolean {
  if (!lane.open) return false;
  if (!force && state.time < lane.nextTickAt) return false;

  const paid = lane.tariffPaidUntil > state.time;
  const throughput = paid ? Math.min(MAX_STABILITY, lane.stability + 0.12) : Math.max(0.45, lane.stability);
  const counts = deltaCountsFor(def, throughput);
  for (let i = 0; i < def.resourceDeltas.length; i++) {
    const delta = def.resourceDeltas[i];
    const count = counts[i];
    changeResourceStock(state, delta.resourceId, -count, def.fromFloor);
    changeResourceStock(state, delta.resourceId, count, def.toFloor);
  }

  lane.runs++;
  lane.lastTickAt = state.time;
  lane.nextTickAt = state.time + laneInterval(def);
  if (paid) {
    lane.stability = clamp(lane.stability + 0.03, MIN_STABILITY, MAX_STABILITY);
    lane.tariffPressure = clamp(lane.tariffPressure - 0.05, 0, 1.75);
  } else {
    lane.stability = clamp(lane.stability - 0.01, MIN_STABILITY, MAX_STABILITY);
    lane.tariffPressure = clamp(lane.tariffPressure + 0.025 + (1 - lane.stability) * 0.015, 0, 1.75);
  }

  publishCaravanEvent(state, def, lane, 'tick', 3, paid ? ['paid'] : ['unpaid'], counts);
  return true;
}

export function tickCaravans(
  state: GameState,
  dt: number,
  force = false,
  maxUpdates = MAX_CARAVAN_LANES_PER_TICK,
): number {
  const caravans = ensureCaravanState(state);
  if (!force) {
    caravans.tickAccum += Math.max(0, dt);
    if (caravans.tickAccum < CARAVAN_TICK_SECONDS) return 0;
    caravans.tickAccum -= CARAVAN_TICK_SECONDS;
  } else {
    caravans.tickAccum = 0;
  }

  let processed = 0;
  let scanned = 0;
  while (processed < maxUpdates && scanned < CARAVAN_LANES.length) {
    const def = CARAVAN_LANES[caravans.cursor % CARAVAN_LANES.length];
    caravans.cursor = (caravans.cursor + 1) % CARAVAN_LANES.length;
    scanned++;
    if (processLane(state, def, caravans.lanes[def.id], force)) processed++;
  }
  return processed;
}

function laneFromEvent(event: WorldEvent): CaravanLaneDef | undefined {
  for (const tag of event.tags) {
    const lane = CARAVAN_LANE_BY_ID[tag];
    if (lane) return lane;
  }
  const containerTags = event.data?.containerTags;
  if (Array.isArray(containerTags)) {
    for (const tag of containerTags) {
      if (typeof tag !== 'string') continue;
      const lane = CARAVAN_LANE_BY_ID[tag];
      if (lane) return lane;
    }
  }
  const laneId = event.data?.laneId;
  return typeof laneId === 'string' ? CARAVAN_LANE_BY_ID[laneId] : undefined;
}

export function payCaravanTariff(state: GameState, laneId: string, source?: WorldEvent): boolean {
  const def = CARAVAN_LANE_BY_ID[laneId];
  if (!def) return false;
  const lane = ensureCaravanState(state).lanes[def.id];
  lane.open = true;
  lane.tariffPaidUntil = Math.max(lane.tariffPaidUntil, state.time) + TARIFF_DURATION_SECONDS;
  lane.stability = clamp(lane.stability + 0.18, MIN_STABILITY, MAX_STABILITY);
  lane.tariffPressure = clamp(lane.tariffPressure - 0.22, 0, 1.75);
  publishCaravanEvent(state, def, lane, 'paid_tariff', 4, ['paid', 'stabilized'], undefined, source);
  return true;
}

export function openCaravanLane(state: GameState, laneId: string, source?: WorldEvent): boolean {
  const def = CARAVAN_LANE_BY_ID[laneId];
  if (!def) return false;
  const lane = ensureCaravanState(state).lanes[def.id];
  lane.open = true;
  lane.stability = clamp(Math.max(lane.stability, 0.82) + 0.08, MIN_STABILITY, MAX_STABILITY);
  lane.tariffPressure = clamp(lane.tariffPressure - 0.12, 0, 1.75);
  lane.nextTickAt = Math.min(lane.nextTickAt, state.time + 20);
  publishCaravanEvent(state, def, lane, 'opened_lane', 4, ['opened'], undefined, source);
  return true;
}

export function closeCaravanLane(state: GameState, laneId: string, source?: WorldEvent): boolean {
  const def = CARAVAN_LANE_BY_ID[laneId];
  if (!def) return false;
  const lane = ensureCaravanState(state).lanes[def.id];
  lane.open = false;
  lane.stability = clamp(lane.stability - 0.18, MIN_STABILITY, MAX_STABILITY);
  lane.tariffPressure = clamp(lane.tariffPressure + 0.3, 0, 1.75);
  publishCaravanEvent(state, def, lane, 'closed_lane', 4, ['closed'], undefined, source);
  return true;
}

export function robCaravanCargo(state: GameState, laneId: string, source?: WorldEvent): boolean {
  const def = CARAVAN_LANE_BY_ID[laneId];
  if (!def) return false;
  const lane = ensureCaravanState(state).lanes[def.id];
  const counts = deltaCountsFor(def, 0.7);
  for (let i = 0; i < def.resourceDeltas.length; i++) {
    changeResourceStock(state, def.resourceDeltas[i].resourceId, -counts[i], def.toFloor);
  }
  lane.raids++;
  lane.stability = clamp(lane.stability - 0.24, MIN_STABILITY, MAX_STABILITY);
  lane.tariffPressure = clamp(lane.tariffPressure + 0.28, 0, 1.75);
  publishCaravanEvent(state, def, lane, 'robbed_cargo', 5, ['robbed', 'theft'], counts, source);
  return true;
}

export function getCaravanLaneTariffMultiplier(state: GameState, laneId: string): number {
  const def = CARAVAN_LANE_BY_ID[laneId];
  if (!def) return 1;
  const lane = ensureCaravanState(state).lanes[def.id];
  const closed = lane.open ? 0 : 0.22;
  return Number(clamp(1 + closed + lane.tariffPressure * 0.35, 0.75, 2.5).toFixed(3));
}

export function getCaravanResourceTariffMultiplier(
  state: GameState,
  resourceId: string,
  floor: FloorLevel = state.currentFloor,
): number {
  let multiplier = 1;
  for (const def of CARAVAN_LANES) {
    if (!def.tariffResourceIds.includes(resourceId)) continue;
    if (def.fromFloor !== floor && def.toFloor !== floor) continue;
    multiplier *= getCaravanLaneTariffMultiplier(state, def.id);
  }
  // TODO(economics_1): multiply getEconomyQuote().tariffMultiplier by this
  // dynamic lane value when the quote API exposes a tariff provider hook.
  return Number(clamp(multiplier, 0.5, 3).toFixed(3));
}

export function summarizeCaravans(state: GameState, limit = 6): string[] {
  const caravans = ensureCaravanState(state);
  return CARAVAN_LANES.slice(0, limit).map(def => {
    const lane = caravans.lanes[def.id];
    const status = lane.open ? 'открыта' : 'закрыта';
    const tariff = getCaravanLaneTariffMultiplier(state, def.id).toFixed(2);
    return `${def.name}: ${status}, стабильность ${Math.round(lane.stability * 100)}%, тариф x${tariff}`;
  });
}

function handleCaravanQuestEvent(state: GameState, event: WorldEvent): boolean {
  if (event.type !== 'quest_completed') return false;
  const action = event.data?.caravanAction;
  const laneId = event.data?.laneId;
  if (typeof action !== 'string' || typeof laneId !== 'string') return false;
  if (action === 'pay_tariff') return payCaravanTariff(state, laneId, event);
  if (action === 'open_lane') return openCaravanLane(state, laneId, event);
  if (action === 'close_lane') return closeCaravanLane(state, laneId, event);
  return false;
}

function handleCaravanWorldEvent(state: GameState, event: WorldEvent): void {
  if (handleCaravanQuestEvent(state, event)) return;
  if (event.type === 'faction_relation_changed' && event.data?.routeImpact === 'market_88_caravan_lane') {
    openCaravanLane(state, 'production_black_market_88', event);
    return;
  }
  if (event.type !== 'item_stolen' || !event.tags.includes('caravan')) return;
  const lane = laneFromEvent(event);
  if (lane) robCaravanCargo(state, lane.id, event);
}

registerWorldEventObserver(handleCaravanWorldEvent);

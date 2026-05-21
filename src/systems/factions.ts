/* ── Faction warfare system — S.T.A.L.K.E.R.-style zone control ── */
/*   Cell-based territory map, zone capture AI, faction events,    */
/*   and faction strength from territory.                          */

import {
  W, Cell,
  type Entity, type GameState,
  EntityType, AIGoal, Faction, ZoneFaction, Occupation,
  type FloorLevel, type WorldEventSeverity, type WorldEventType,
} from '../core/types';
import { World } from '../core/world';
import { ITEMS } from '../data/catalog';
import { getFactionRel, addFactionRelMutual } from '../data/relations';
import { isPsiMad, isPsiAlly } from './psi';
import { updateFactionEvents } from './faction_events';
import { MAX_CARAVAN_LANES_PER_TICK, tickCaravans } from './caravans';
import { getRecentEvents, publishEvent } from './events';
import { getRecentNoiseRecords, type NoiseRecord } from './noise';
import { tryAssignPathToCell } from './ai/pathfinding';
import {
  HOSTILE_RELATION_THRESHOLD,
  addNpcPlayerRelation,
  isNpcPlayerHostile,
} from './npc_relations';
import { addKarma } from './alife_rating';

/* ── Faction relation accessors (dynamic — reads live matrix) ─── */
// Monsters use a fixed attitude, not tracked in the matrix
const FACTION_VS_MONSTER: number[] = [
  /* CITIZEN */ -100,
  /* LIQUID. */ -100,
  /* CULTIST */   50,
  /* SCIENTIST*/ -80,
  /* WILD    */ -100,
  /* PLAYER  */ -100,
];

export type FactionRelationDelta = readonly [Faction, number];

/** Get dynamic faction-to-faction relation */
export function getFactionRelation(a: Faction, b: Faction): number {
  return getFactionRel(a, b);
}

/** Get faction-to-monster relation */
export function getFactionMonsterRelation(f: Faction): number {
  return FACTION_VS_MONSTER[f] ?? -100;
}

/** Check if two factions are hostile (base relation) */
export function areFactionsHostile(a: Faction, b: Faction): boolean {
  return getFactionRelation(a, b) <= HOSTILE_RELATION_THRESHOLD;
}

export function applyFactionRelationDeltas(
  deltas: readonly FactionRelationDelta[],
  actor: Faction = Faction.PLAYER,
): Record<string, number> {
  const applied: Record<string, number> = {};
  for (const [faction, delta] of deltas) {
    if (delta === 0) continue;
    addFactionRelMutual(actor, faction, delta);
    applied[Faction[faction] ?? String(faction)] = (applied[Faction[faction] ?? String(faction)] ?? 0) + delta;
  }
  return applied;
}

/** Check if entity considers another entity hostile */
export function isHostile(attacker: Entity, target: Entity): boolean {
  // PSI control: controlled entities don't attack their controller (and vice-versa)
  if (isPsiAlly(attacker, target)) return false;
  // PSI madness: mad entities attack everyone
  if (isPsiMad(attacker)) return target.id !== attacker.id;
  // Monsters: use faction-vs-monster table
  if (attacker.type === EntityType.MONSTER && target.type === EntityType.MONSTER) return false;
  if (attacker.type === EntityType.MONSTER) {
    // Monsters are hostile to everyone except cultists
    const tFaction = target.faction ?? Faction.CITIZEN;
    return getFactionMonsterRelation(tFaction) <= HOSTILE_RELATION_THRESHOLD;
  }
  if (target.type === EntityType.MONSTER) {
    const aFaction = attacker.faction ?? Faction.CITIZEN;
    return getFactionMonsterRelation(aFaction) <= HOSTILE_RELATION_THRESHOLD;
  }
  if (attacker.type === EntityType.NPC && target.type === EntityType.PLAYER && isNpcPlayerHostile(attacker)) {
    return true;
  }
  // NPC vs NPC / Player
  const aFaction = attacker.faction ?? Faction.CITIZEN;
  const bFaction = target.faction ?? Faction.CITIZEN;
  return areFactionsHostile(aFaction, bFaction);
}

/* ── Zone → ZoneFaction mapping from Faction ─────────────────── */
export function factionToZone(f: Faction): ZoneFaction {
  switch (f) {
    case Faction.CITIZEN:    return ZoneFaction.CITIZEN;
    case Faction.LIQUIDATOR: return ZoneFaction.LIQUIDATOR;
    case Faction.CULTIST:    return ZoneFaction.CULTIST;
    case Faction.SCIENTIST:  return ZoneFaction.CITIZEN; // scientists align with citizens
    case Faction.WILD:       return ZoneFaction.WILD;
    case Faction.PLAYER:     return ZoneFaction.CITIZEN; // player aligned with citizens for zone purposes
  }
}

export function zoneFactionToFaction(zf: ZoneFaction): Faction | null {
  switch (zf) {
    case ZoneFaction.CITIZEN:    return Faction.CITIZEN;
    case ZoneFaction.LIQUIDATOR: return Faction.LIQUIDATOR;
    case ZoneFaction.CULTIST:    return Faction.CULTIST;
    case ZoneFaction.WILD:       return Faction.WILD;
    default: return null;
  }
}

/* ── Territory counting per ZoneFaction ──────────────────────── */
export interface FactionStats {

  zones: number;         // zones controlled
}

export interface FactionZoneUiSnapshot {
  zoneId: number;
  x: number;
  y: number;
  level: number;
  owner: ZoneFaction;
  dominant: ZoneFaction;
  ownerShare: number;
  dominantShare: number;
  pressure: number;
  contested: boolean;
  recentEventCount: number;
  lastEventSeverity: WorldEventSeverity;
  lastEventTime: number;
}

export interface FactionOwnerUiSnapshot {
  faction: ZoneFaction;
  zones: number;
  contested: number;
}

export interface FactionRecentEventUiSnapshot {
  id: number;
  time: number;
  floor: FloorLevel;
  zoneId: number;
  x: number;
  y: number;
  type: WorldEventType;
  severity: WorldEventSeverity;
  name: string;
  phase: string;
  text: string;
  actorFaction?: Faction;
  targetFaction?: Faction;
}

export interface FactionUiSnapshot {
  time: number;
  floor: FloorLevel;
  zones: FactionZoneUiSnapshot[];
  zoneById: (FactionZoneUiSnapshot | undefined)[];
  owners: FactionOwnerUiSnapshot[];
  contestedZones: number;
  recentEvents: FactionRecentEventUiSnapshot[];
}

const ZONE_UI_FACTIONS = [
  ZoneFaction.CITIZEN,
  ZoneFaction.LIQUIDATOR,
  ZoneFaction.CULTIST,
  ZoneFaction.WILD,
  ZoneFaction.SAMOSBOR,
] as const;
const UI_ZONE_SAMPLE_RADIUS = 56;
const UI_ZONE_SAMPLE_STEP = 8;
const UI_CONTESTED_PRESSURE = 0.22;
const UI_DOMINANT_CONTESTED_SHARE = 0.28;
const UI_RECENT_EVENT_LIMIT = 8;
const uiSampleCounts = new Uint16Array(8);
let factionUiSnapshot: FactionUiSnapshot | undefined;

export function getFactionUiSnapshot(): FactionUiSnapshot | undefined {
  return factionUiSnapshot;
}

export function countFactionTerritory(world: World): Map<ZoneFaction, FactionStats> {
  const stats = new Map<ZoneFaction, FactionStats>();
  for (const zf of [ZoneFaction.CITIZEN, ZoneFaction.LIQUIDATOR, ZoneFaction.CULTIST, ZoneFaction.WILD]) {
    stats.set(zf, { zones: 0 });
  }

  // Count zones (the strategic unit — no need to scan 1M cells)
  for (const zone of world.zones) {
    if (zone.faction === ZoneFaction.SAMOSBOR) continue;
    const s = stats.get(zone.faction);
    if (s) s.zones++;
  }

  return stats;
}

function factionEventString(data: Record<string, unknown> | undefined, key: string): string {
  const value = data?.[key];
  return typeof value === 'string' ? value : '';
}

function refreshFactionUiSnapshot(world: World, state: GameState): void {
  const zones: FactionZoneUiSnapshot[] = [];
  const zoneById: (FactionZoneUiSnapshot | undefined)[] = [];
  const ownerCounts = new Map<ZoneFaction, FactionOwnerUiSnapshot>();
  for (const faction of ZONE_UI_FACTIONS) ownerCounts.set(faction, { faction, zones: 0, contested: 0 });

  let contestedZones = 0;
  for (const zone of world.zones) {
    if (!zone) continue;
    uiSampleCounts.fill(0);
    let sampled = 0;
    for (let dy = -UI_ZONE_SAMPLE_RADIUS; dy <= UI_ZONE_SAMPLE_RADIUS; dy += UI_ZONE_SAMPLE_STEP) {
      for (let dx = -UI_ZONE_SAMPLE_RADIUS; dx <= UI_ZONE_SAMPLE_RADIUS; dx += UI_ZONE_SAMPLE_STEP) {
        const i = world.idx(world.wrap(zone.cx + dx), world.wrap(zone.cy + dy));
        if (world.zoneMap[i] !== zone.id) continue;
        const zf = world.factionControl[i];
        if (zf < uiSampleCounts.length) {
          uiSampleCounts[zf]++;
          sampled++;
        }
      }
    }

    let dominant = zone.faction;
    let dominantCount = 0;
    for (let i = 0; i < uiSampleCounts.length; i++) {
      if (uiSampleCounts[i] > dominantCount) {
        dominantCount = uiSampleCounts[i];
        dominant = i as ZoneFaction;
      }
    }

    const ownerCount = zone.faction < uiSampleCounts.length ? uiSampleCounts[zone.faction] : 0;
    const ownerShare = sampled > 0 ? ownerCount / sampled : 1;
    const dominantShare = sampled > 0 ? dominantCount / sampled : 1;
    const pressure = Math.max(0, 1 - ownerShare);
    const contested = zone.faction !== ZoneFaction.SAMOSBOR
      && sampled > 0
      && (pressure >= UI_CONTESTED_PRESSURE || (dominant !== zone.faction && dominantShare >= UI_DOMINANT_CONTESTED_SHARE));
    const row: FactionZoneUiSnapshot = {
      zoneId: zone.id,
      x: zone.cx,
      y: zone.cy,
      level: zone.level ?? 1,
      owner: zone.faction,
      dominant,
      ownerShare,
      dominantShare,
      pressure,
      contested,
      recentEventCount: 0,
      lastEventSeverity: 0,
      lastEventTime: -Infinity,
    };
    zones.push(row);
    zoneById[zone.id] = row;
    const owner = ownerCounts.get(zone.faction);
    if (owner) {
      owner.zones++;
      if (contested) owner.contested++;
    }
    if (contested) contestedZones++;
  }

  const recentEvents = getRecentEvents(state, { tags: ['faction_event'], limit: UI_RECENT_EVENT_LIMIT }).map(event => {
    const zoneId = event.zoneId ?? -1;
    const zone = zoneId >= 0 ? zoneById[zoneId] : undefined;
    if (event.floor === state.currentFloor && zone) {
      zone.recentEventCount++;
      if (event.severity > zone.lastEventSeverity) zone.lastEventSeverity = event.severity;
      if (event.time >= zone.lastEventTime) zone.lastEventTime = event.time;
    }
    return {
      id: event.id,
      time: event.time,
      floor: event.floor,
      zoneId,
      x: event.x ?? zone?.x ?? 0,
      y: event.y ?? zone?.y ?? 0,
      type: event.type,
      severity: event.severity,
      name: factionEventString(event.data, 'name'),
      phase: factionEventString(event.data, 'phase'),
      text: factionEventString(event.data, 'residueText') || factionEventString(event.data, 'text'),
      actorFaction: event.actorFaction,
      targetFaction: event.targetFaction,
    };
  });

  factionUiSnapshot = {
    time: state.time,
    floor: state.currentFloor,
    zones,
    zoneById,
    owners: ZONE_UI_FACTIONS.map(faction => ownerCounts.get(faction) ?? { faction, zones: 0, contested: 0 }),
    contestedZones,
    recentEvents,
  };
}

/* ── Initialize per-cell faction control from zone map ────────── */
export function initFactionControl(world: World): void {
  for (let i = 0; i < W * W; i++) {
    const zid = world.zoneMap[i];
    const zone = world.zones[zid];
    if (zone) {
      world.factionControl[i] = zone.faction;
    }
  }
}

/* ── Zone capture: NPC in enemy zone can flip cells ──────────── */
const CAPTURE_RADIUS = 3;
const CAPTURE_INTERVAL = 2.0; // seconds between capture ticks

let captureAccum = 0;
let activityAccum = 0;
const NOISE_PATROL_EVENT_LIMIT = 6;
const NOISE_PATROL_COOLDOWN_S = 8;
const NOISE_PATROL_RADIUS_SQ = 44 * 44;
const NOISE_PATROL_RESPONDERS_PER_EVENT = 3;
const NOISE_PATROL_ENTITY_SCAN_CAP = 360;
const lastNoisePatrolResponseAt = new Map<string, number>();

export function updateFactionCapture(world: World, entities: Entity[], dt: number): void {
  captureAccum += dt;
  if (captureAccum < CAPTURE_INTERVAL) return;
  captureAccum -= CAPTURE_INTERVAL;

  // Collect capturers that are in enemy territory
  const capturers: { ex: number; ey: number; myZf: ZoneFaction }[] = [];
  for (const e of entities) {
    if (!e.alive || e.type !== EntityType.NPC) continue;
    if (e.faction === undefined) continue;
    if (!e.isTraveler && e.occupation !== Occupation.HUNTER) continue;

    const ex = Math.floor(e.x), ey = Math.floor(e.y);
    const ci = world.idx(ex, ey);
    const myZf = factionToZone(e.faction);
    const cellZf = world.factionControl[ci] as ZoneFaction;

    if (cellZf === myZf || cellZf === ZoneFaction.SAMOSBOR) continue;
    capturers.push({ ex, ey, myZf });
  }

  // Only do expensive work if any captures are happening
  if (capturers.length === 0) return;

  const affectedZones = new Set<number>();

  for (const { ex, ey, myZf } of capturers) {
    for (let dy = -CAPTURE_RADIUS; dy <= CAPTURE_RADIUS; dy++) {
      for (let dx = -CAPTURE_RADIUS; dx <= CAPTURE_RADIUS; dx++) {
        if (dx * dx + dy * dy > CAPTURE_RADIUS * CAPTURE_RADIUS) continue;
        const ni = world.idx(world.wrap(ex + dx), world.wrap(ey + dy));
        if (world.cells[ni] === Cell.FLOOR && world.factionControl[ni] !== ZoneFaction.SAMOSBOR) {
          world.factionControl[ni] = myZf;
          affectedZones.add(world.zoneMap[ni]);
        }
      }
    }
  }

  // Recalculate ownership only for affected zones
  recalcZoneOwnership(world, affectedZones);
}

export function updateFactionActivity(
  world: World,
  entities: Entity[],
  player: Entity,
  state: GameState,
  nextId: { v: number },
  dt: number,
  allowSpawns = true,
): void {
  activityAccum += dt;
  if (activityAccum < 1) return;
  const elapsed = activityAccum;
  activityAccum = 0;
  updateNoisePatrolResponse(world, entities, state);
  updateFactionEvents(state, world, player, entities, nextId, elapsed, allowSpawns);
  tickCaravans(state, elapsed, false, MAX_CARAVAN_LANES_PER_TICK, world, entities, player, nextId);
  refreshFactionUiSnapshot(world, state);
}

function canRespondToNoise(e: Entity): boolean {
  if (!e.alive || e.type !== EntityType.NPC || !e.ai || e.faction === undefined) return false;
  return e.faction === Faction.LIQUIDATOR ||
    e.faction === Faction.CULTIST ||
    e.faction === Faction.WILD ||
    e.occupation === Occupation.HUNTER ||
    e.isTraveler === true;
}

function noiseZoneId(world: World, record: NoiseRecord): number {
  return world.zoneMap[world.idx(Math.floor(record.x), Math.floor(record.y))];
}

function shouldRespondToNoise(state: GameState, zoneId: number, record: NoiseRecord): boolean {
  const key = `${state.currentFloor}:${zoneId}:${record.source}`;
  const last = lastNoisePatrolResponseAt.get(key) ?? -Infinity;
  if (state.time - last < NOISE_PATROL_COOLDOWN_S) return false;
  lastNoisePatrolResponseAt.set(key, state.time);
  return true;
}

function sendNoisePatrol(world: World, entities: Entity[], record: NoiseRecord): number {
  let responders = 0;
  let scanned = 0;
  const tx = Math.floor(record.x);
  const ty = Math.floor(record.y);
  for (const e of entities) {
    if (responders >= NOISE_PATROL_RESPONDERS_PER_EVENT || scanned >= NOISE_PATROL_ENTITY_SCAN_CAP) break;
    scanned++;
    if (!canRespondToNoise(e)) continue;
    if (record.actorId !== undefined && e.id === record.actorId) continue;
    if (world.dist2(e.x, e.y, record.x, record.y) > NOISE_PATROL_RADIUS_SQ) continue;
    const ai = e.ai!;
    ai.goal = AIGoal.HUNT;
    ai.combatScanCd = 0;
    ai.timer = 4 + responders;
    tryAssignPathToCell(world, e, tx, ty);
    responders++;
  }
  return responders;
}

function updateNoisePatrolResponse(world: World, entities: Entity[], state: GameState): void {
  const records = getRecentNoiseRecords(state, { minSeverity: 3, limit: NOISE_PATROL_EVENT_LIMIT }, state.time);
  for (const record of records) {
    if (record.source === 'footstep') continue;
    const zoneId = noiseZoneId(world, record);
    if (!shouldRespondToNoise(state, zoneId, record)) continue;
    const responders = sendNoisePatrol(world, entities, record);
    if (responders <= 0) continue;
    publishEvent(state, {
      type: 'faction_event',
      zoneId,
      x: record.x,
      y: record.y,
      actorId: record.actorId,
      actorFaction: record.actorFaction,
      itemId: record.itemId,
      itemName: record.itemId ? ITEMS[record.itemId]?.name ?? record.itemId : undefined,
      severity: record.severity,
      privacy: 'local',
      tags: ['faction_event', 'noise_response', record.source, 'patrol'],
      data: {
        name: 'noise_response',
        phase: 'patrol_response',
        text: 'Патруль пошёл на шум.',
        source: record.source,
        responders,
        noiseId: record.id,
      },
    });
  }
}

/** Recalculate which faction owns each zone based on cell majority.
 *  Only checks zones in the given set (those that had cells flipped). */
function recalcZoneOwnership(world: World, zoneIds: Set<number>): void {
  for (const zid of zoneIds) {
    const zone = world.zones[zid];
    if (!zone || zone.faction === ZoneFaction.SAMOSBOR) continue;

    // Sample cells in zone — coarse grid around zone center
    const counts = new Uint16Array(8); // indexed by ZoneFaction (max ~6 values)
    const cx = zone.cx, cy = zone.cy;
    const R = 60;
    for (let dy = -R; dy <= R; dy += 4) {
      for (let dx = -R; dx <= R; dx += 4) {
        const ni = world.idx(world.wrap(cx + dx), world.wrap(cy + dy));
        if (world.zoneMap[ni] !== zid) continue;
        const zf = world.factionControl[ni];
        if (zf < counts.length) counts[zf]++;
      }
    }

    // Find majority (skip SAMOSBOR)
    let bestZf: ZoneFaction = zone.faction;
    let bestCount = 0;
    for (let i = 0; i < counts.length; i++) {
      if (i === ZoneFaction.SAMOSBOR as number) continue;
      if (counts[i] > bestCount) { bestCount = counts[i]; bestZf = i; }
    }

    if (bestZf !== zone.faction) {
      zone.faction = bestZf;
    }
  }
}

/* ── Apply damage relation penalty between factions ──────────── */
export function applyDamageRelationPenalty(
  attackerFaction: Faction | undefined, targetFaction: Faction | undefined,
  damage: number,
  target?: Entity,
  attacker?: Entity,
): void {
  if (attackerFaction === undefined || targetFaction === undefined) return;
  if (attackerFaction === targetFaction) return;

  const wasFactionEnemy = areFactionsHostile(attackerFaction, targetFaction);
  const wasPersonalEnemy = attackerFaction === Faction.PLAYER && target?.type === EntityType.NPC && isNpcPlayerHostile(target);
  const wasNonEnemy = !wasFactionEnemy && !wasPersonalEnemy;
  // Penalty proportional to damage: -1 per 5 damage, min -1
  const penalty = -Math.max(1, Math.floor(damage / 5));
  if (attackerFaction === Faction.PLAYER && target?.type === EntityType.NPC) {
    addNpcPlayerRelation(target, penalty);
  }
  // Only penalize factions if they are NOT hostile (hitting allies/neutrals)
  if (wasNonEnemy) {
    addFactionRelMutual(attackerFaction, targetFaction, penalty);
    if (attacker) addKarma(attacker, -Math.max(1, Math.min(4, Math.floor(damage / 20) || 1)));
  }
}

/* ── Apply narrow social penalty for witnessed/audited theft ─── */
export function applyTheftRelationPenalty(
  victimFaction: Faction | undefined,
  witnessed: boolean,
  audited: boolean,
): number {
  if (victimFaction === undefined || victimFaction === Faction.PLAYER) return 0;
  if (!witnessed && !audited) return 0;

  const penalty = witnessed ? -4 : -2;
  addFactionRelMutual(victimFaction, Faction.PLAYER, penalty);
  return penalty;
}

export function applyRoomMemoryRelationPenalty(victimFaction: Faction | undefined, severity: number): number {
  if (victimFaction === undefined || victimFaction === Faction.PLAYER) return 0;
  const penalty = severity >= 5 ? -2 : -1;
  addFactionRelMutual(victimFaction, Faction.PLAYER, penalty);
  return penalty;
}

export function applyInfrastructureRelationResponse(
  ownerFaction: Faction | null | undefined,
  action: 'repair' | 'shutdown' | 'force' | 'overload',
): number {
  if (ownerFaction === null || ownerFaction === undefined || ownerFaction === Faction.PLAYER) return 0;
  const delta = action === 'repair'
    ? (ownerFaction === Faction.WILD ? 0 : 1)
    : action === 'shutdown'
      ? -1
      : action === 'force'
        ? -2
        : -4;
  if (delta !== 0) addFactionRelMutual(Faction.PLAYER, ownerFaction, delta);
  return delta;
}

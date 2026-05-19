/* ── Faction warfare system — S.T.A.L.K.E.R.-style zone control ── */
/*   Cell-based territory map, HQ spawning, patrol squads,         */
/*   zone capture AI, faction strength from territory.             */

import {
  W, Cell,
  type Entity, type GameState, type Room, type Zone,
  EntityType, AIGoal, Faction, ZoneFaction, Occupation,
  type FloorLevel, type WorldEventSeverity, type WorldEventType,
} from '../core/types';
import { World } from '../core/world';
import { freshNeeds, randomName } from '../data/catalog';
import { gaussianLevel, randomRPG, getMaxHp } from './rpg';
import { getFactionRel, addFactionRelMutual } from '../data/relations';
import { isPsiMad, isPsiAlly } from './psi';
import { updateFactionEvents } from './faction_events';
import { tickCaravans } from './caravans';
import { getRecentEvents } from './events';

const _PSI_IDS = ['psi_strike','psi_rupture','psi_madness','psi_storm','psi_brainburn'];
function _pickPsi(): string { return _PSI_IDS[Math.floor(Math.random() * _PSI_IDS.length)]; }

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

const HOSTILE_THRESHOLD = -50;

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
  return getFactionRelation(a, b) <= HOSTILE_THRESHOLD;
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
    return getFactionMonsterRelation(tFaction) <= HOSTILE_THRESHOLD;
  }
  if (target.type === EntityType.MONSTER) {
    const aFaction = attacker.faction ?? Faction.CITIZEN;
    return getFactionMonsterRelation(aFaction) <= HOSTILE_THRESHOLD;
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
  spawnBudget: number;   // patrol squads to spawn (proportional to cells)
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
    stats.set(zf, { zones: 0, spawnBudget: 0 });
  }

  // Count zones (the strategic unit — no need to scan 1M cells)
  for (const zone of world.zones) {
    if (zone.faction === ZoneFaction.SAMOSBOR) continue;
    const s = stats.get(zone.faction);
    if (s) s.zones++;
  }

  // Spawn budget: 1 squad per 2 controlled zones, min 1 if faction exists
  for (const [, s] of stats) {
    s.spawnBudget = s.zones > 0 ? Math.max(1, Math.floor(s.zones / 2)) : 0;
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
  updateFactionEvents(state, world, player, entities, nextId, elapsed, allowSpawns);
  tickCaravans(state, elapsed);
  refreshFactionUiSnapshot(world, state);
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

/* ── Spawn patrol squads at HQ rooms after samosbor / init ───── */
const AMBIENT_NPC_SOFT_CAP = 220;
const PATROL_SPAWN_BURST_CAP = 24;
const REINFORCEMENT_SPAWN_BURST_CAP = 10;
const MAX_PATROL_NPCS_PER_ZONE = 6;
const MAX_REINFORCEMENT_NPCS_PER_ZONE = 5;
const REINFORCEMENT_PER_ZONE_BURST_CAP = 2;
const ROOM_SPAWN_SCAN_LIMIT = 512;
const ZONE_FACTION_STRIDE = ZoneFaction.WILD + 1;

let zoneFactionNpcCounts = new Uint16Array(0);

function countAliveNpcs(entities: Entity[]): number {
  let aliveNPCs = 0;
  for (const e of entities) {
    if (e.type === EntityType.NPC && e.alive) aliveNPCs++;
  }
  return aliveNPCs;
}

function countZoneFactionNpcs(world: World, entities: Entity[]): Uint16Array {
  const needed = world.zones.length * ZONE_FACTION_STRIDE;
  if (zoneFactionNpcCounts.length !== needed) {
    zoneFactionNpcCounts = new Uint16Array(needed);
  } else {
    zoneFactionNpcCounts.fill(0);
  }

  for (const e of entities) {
    if (!e.alive || e.type !== EntityType.NPC || e.faction === undefined) continue;
    const zf = factionToZone(e.faction);
    const zid = world.zoneMap[world.idx(Math.floor(e.x), Math.floor(e.y))];
    if (zid >= world.zones.length) continue;
    const ci = zid * ZONE_FACTION_STRIDE + zf;
    if (ci < zoneFactionNpcCounts.length && zoneFactionNpcCounts[ci] < 0xffff) {
      zoneFactionNpcCounts[ci]++;
    }
  }

  return zoneFactionNpcCounts;
}

function zoneFactionCount(counts: Uint16Array, zone: Zone, zf: ZoneFaction): number {
  const ci = zone.id * ZONE_FACTION_STRIDE + zf;
  return ci >= 0 && ci < counts.length ? counts[ci] : 0;
}

function bumpZoneFactionCount(counts: Uint16Array, zone: Zone, zf: ZoneFaction): void {
  const ci = zone.id * ZONE_FACTION_STRIDE + zf;
  if (ci >= 0 && ci < counts.length && counts[ci] < 0xffff) counts[ci]++;
}

function occupationForFaction(faction: Faction): Occupation {
  return faction === Faction.LIQUIDATOR ? Occupation.HUNTER :
         faction === Faction.CULTIST ? Occupation.PILGRIM :
         faction === Faction.WILD ? Occupation.TRAVELER :
         Occupation.TRAVELER;
}

function createAmbientFactionNpc(
  faction: Faction,
  occupation: Occupation,
  zone: Zone,
  x: number,
  y: number,
  nextId: { v: number },
): Entity {
  const zoneLevel = zone.level ?? 1;
  const npcLevel = gaussianLevel(zoneLevel, 2);
  const rpg = randomRPG(npcLevel);
  const maxHp = Math.round(getMaxHp(rpg) * 1.3);
  const nm = randomName(faction);
  const cultPsi = faction === Faction.CULTIST && Math.random() < 0.4 ? _pickPsi() : undefined;

  return {
    id: nextId.v++,
    type: EntityType.NPC,
    x, y,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: 1.3 + Math.random() * 0.3,
    sprite: occupation,
    name: nm.name,
    isFemale: nm.female,
    needs: freshNeeds(),
    hp: maxHp, maxHp,
    money: Math.floor(Math.random() * 50),
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: cultPsi ? [{ defId: cultPsi, count: 1 }] : [],
    weapon: cultPsi,
    faction,
    occupation,
    isTraveler: true,
    questId: -1,
    rpg,
  };
}

function roomIsSpawnableInZone(world: World, room: Room, zoneId: number): boolean {
  if (room.w < 3 || room.h < 3) return false;
  const cx = world.wrap(room.x + (room.w >> 1));
  const cy = world.wrap(room.y + (room.h >> 1));
  return world.zoneMap[world.idx(cx, cy)] === zoneId;
}

function pickSpawnRoomInZone(world: World, zone: Zone): Room | null {
  const hq = zone.hqRoomId >= 0 ? world.rooms[zone.hqRoomId] : undefined;
  if (hq && roomIsSpawnableInZone(world, hq, zone.id)) return hq;

  const rooms = world.rooms;
  if (rooms.length === 0) return null;
  const limit = Math.min(rooms.length, ROOM_SPAWN_SCAN_LIMIT);
  let ri = Math.floor(Math.random() * rooms.length);
  for (let scanned = 0; scanned < limit; scanned++) {
    const room = rooms[ri];
    if (room && roomIsSpawnableInZone(world, room, zone.id)) return room;
    ri++;
    if (ri >= rooms.length) ri = 0;
  }
  return null;
}

function spawnAmbientNpcInRoom(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  zone: Zone,
  faction: Faction,
  occupation: Occupation,
  room: Room,
): boolean {
  const sx = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
  const sy = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
  if (world.solid(sx, sy)) return false;
  entities.push(createAmbientFactionNpc(faction, occupation, zone, sx + 0.5, sy + 0.5, nextId));
  return true;
}

export function spawnPatrolSquads(
  world: World, entities: Entity[], nextId: { v: number }, stats: Map<ZoneFaction, FactionStats>,
): void {
  let spawnSlots = Math.min(PATROL_SPAWN_BURST_CAP, AMBIENT_NPC_SOFT_CAP - countAliveNpcs(entities));
  if (spawnSlots <= 0 || world.zones.length === 0) return;

  const counts = countZoneFactionNpcs(world, entities);
  const startZone = Math.floor(Math.random() * world.zones.length);

  for (let zi = 0; zi < world.zones.length && spawnSlots > 0; zi++) {
    const zone = world.zones[(startZone + zi) % world.zones.length];
    if (zone.faction === ZoneFaction.SAMOSBOR) continue;
    if (zone.hqRoomId < 0) continue;

    const room = world.rooms[zone.hqRoomId];
    if (!room) continue;

    const zf = zone.faction;
    const factionStats = stats.get(zf);
    if (!factionStats || factionStats.spawnBudget <= 0) continue;

    const faction = zoneFactionToFaction(zf);
    if (faction === null) continue;

    const nearbyCount = zoneFactionCount(counts, zone, zf);

    // Max patrol NPCs per zone stays small even when territory is large.
    const maxPatrol = Math.min(MAX_PATROL_NPCS_PER_ZONE, 2 + factionStats.spawnBudget);
    if (nearbyCount >= maxPatrol) continue;

    // Spawn 2-3 patrol members
    const count = Math.min(maxPatrol - nearbyCount, spawnSlots, 2 + Math.floor(Math.random() * 2));
    const occupation = occupationForFaction(faction);

    for (let i = 0; i < count; i++) {
      if (!spawnAmbientNpcInRoom(world, entities, nextId, zone, faction, occupation, room)) continue;
      bumpZoneFactionCount(counts, zone, zf);
      spawnSlots--;
      if (spawnSlots <= 0) return;
    }
  }
}

export function spawnTerritoryReinforcements(
  world: World, entities: Entity[], nextId: { v: number }, stats: Map<ZoneFaction, FactionStats>,
): void {
  const spawnBudget = Math.min(REINFORCEMENT_SPAWN_BURST_CAP, AMBIENT_NPC_SOFT_CAP - countAliveNpcs(entities));
  if (spawnBudget <= 0 || world.zones.length === 0) return;

  // Calculate total controlled zones across all factions
  let totalZones = 0;
  for (const [, s] of stats) totalZones += s.zones;
  if (totalZones === 0) return;

  const counts = countZoneFactionNpcs(world, entities);
  let totalSpawned = 0;

  // For each faction, spawn a bounded burst proportional to territory.
  for (const [zf, s] of stats) {
    if (totalSpawned >= spawnBudget) break;
    if (s.zones === 0) continue;
    const faction = zoneFactionToFaction(zf);
    if (faction === null) continue;

    const factionShare = s.zones / totalZones;
    const toSpawn = Math.min(spawnBudget - totalSpawned, Math.max(1, Math.round(spawnBudget * factionShare)));
    const perZone = Math.min(REINFORCEMENT_PER_ZONE_BURST_CAP, Math.max(1, Math.ceil(toSpawn / s.zones)));
    const occupation = occupationForFaction(faction);
    const startZone = Math.floor(Math.random() * world.zones.length);

    let factionSpawned = 0;
    for (let zi = 0; zi < world.zones.length && factionSpawned < toSpawn && totalSpawned < spawnBudget; zi++) {
      const zone = world.zones[(startZone + zi) % world.zones.length];
      if (zone.faction !== zf) continue;

      const existing = zoneFactionCount(counts, zone, zf);
      if (existing >= MAX_REINFORCEMENT_NPCS_PER_ZONE) continue;

      const room = pickSpawnRoomInZone(world, zone);
      if (!room) continue;

      const count = Math.min(
        perZone,
        toSpawn - factionSpawned,
        spawnBudget - totalSpawned,
        MAX_REINFORCEMENT_NPCS_PER_ZONE - existing,
      );

      for (let i = 0; i < count; i++) {
        if (!spawnAmbientNpcInRoom(world, entities, nextId, zone, faction, occupation, room)) continue;
        bumpZoneFactionCount(counts, zone, zf);
        factionSpawned++;
        totalSpawned++;
      }
    }
  }
}

/* ── Apply damage relation penalty between factions ──────────── */
export function applyDamageRelationPenalty(
  attackerFaction: Faction | undefined, targetFaction: Faction | undefined,
  damage: number,
): void {
  if (attackerFaction === undefined || targetFaction === undefined) return;
  if (attackerFaction === targetFaction) return;
  // Only penalize if factions are NOT hostile (hitting allies/neutrals)
  if (areFactionsHostile(attackerFaction, targetFaction)) return;

  // Penalty proportional to damage: -1 per 5 damage, min -1
  const penalty = -Math.max(1, Math.floor(damage / 5));
  addFactionRelMutual(attackerFaction, targetFaction, penalty);
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

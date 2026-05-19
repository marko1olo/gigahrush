/* ── Faction warfare system — S.T.A.L.K.E.R.-style zone control ── */
/*   Cell-based territory map, HQ spawning, patrol squads,         */
/*   zone capture AI, faction strength from territory.             */

import {
  W, Cell,
  type Entity, type GameState,
  EntityType, AIGoal, Faction, ZoneFaction, Occupation,
} from '../core/types';
import { World } from '../core/world';
import { freshNeeds, randomName } from '../data/catalog';
import { gaussianLevel, randomRPG, getMaxHp } from './rpg';
import { getFactionRel, addFactionRelMutual } from '../data/relations';
import { isPsiMad, isPsiAlly } from './psi';
import { updateFactionEvents } from './faction_events';
import { tickCaravans } from './caravans';

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
export function spawnPatrolSquads(
  world: World, entities: Entity[], nextId: { v: number }, stats: Map<ZoneFaction, FactionStats>,
): void {
  for (const zone of world.zones) {
    if (zone.faction === ZoneFaction.SAMOSBOR) continue;
    if (zone.hqRoomId < 0) continue;

    const room = world.rooms[zone.hqRoomId];
    if (!room) continue;

    const zf = zone.faction;
    const factionStats = stats.get(zf);
    if (!factionStats || factionStats.spawnBudget <= 0) continue;

    const faction = zoneFactionToFaction(zf);
    if (faction === null) continue;

    // Check how many alive NPCs of this faction are already near this zone
    let nearbyCount = 0;
    const nearThresh = 80 * 80;
    for (const ent of entities) {
      if (ent.alive && ent.type === EntityType.NPC && ent.faction === faction &&
        world.dist2(ent.x, ent.y, zone.cx, zone.cy) < nearThresh) nearbyCount++;
    }

    // Max patrol NPCs per zone: 3 + budget
    const maxPatrol = 3 + factionStats.spawnBudget;
    if (nearbyCount >= maxPatrol) continue;

    // Spawn 2-3 patrol members
    const count = Math.min(maxPatrol - nearbyCount, 2 + Math.floor(Math.random() * 2));
    const occupation = faction === Faction.LIQUIDATOR ? Occupation.HUNTER :
                       faction === Faction.CULTIST ? Occupation.PILGRIM :
                       faction === Faction.WILD ? Occupation.TRAVELER :
                       Occupation.TRAVELER;

    for (let i = 0; i < count; i++) {
      const sx = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
      const sy = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
      if (world.solid(sx, sy)) continue;

      const zoneLevel = zone.level ?? 1;
      const npcLevel = gaussianLevel(zoneLevel, 2);
      const rpg = randomRPG(npcLevel);
      const maxHp = Math.round(getMaxHp(rpg) * 1.3);
      const nm = randomName(faction);

      entities.push({
        id: nextId.v++,
        type: EntityType.NPC,
        x: sx + 0.5, y: sy + 0.5,
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
        inventory: (faction === Faction.CULTIST && Math.random() < 0.4)
          ? [{ defId: _pickPsi(), count: 1 }] : [],
        weapon: (faction === Faction.CULTIST && Math.random() < 0.4) ? _pickPsi() : undefined,
        faction,
        occupation,
        isTraveler: true,
        questId: -1,
        rpg,
      });
    }
  }
}

/* ── A-Life territory reinforcements — spawn NPCs proportional to territory ── */
const NPC_SOFT_CAP = 1024;

export function spawnTerritoryReinforcements(
  world: World, entities: Entity[], nextId: { v: number }, stats: Map<ZoneFaction, FactionStats>,
): void {
  // Count alive NPCs
  let aliveNPCs = 0;
  for (const e of entities) if (e.type === EntityType.NPC && e.alive) aliveNPCs++;
  if (aliveNPCs >= NPC_SOFT_CAP) return;

  const deficit = NPC_SOFT_CAP - aliveNPCs;

  // Calculate total controlled zones across all factions
  let totalZones = 0;
  for (const [, s] of stats) totalZones += s.zones;
  if (totalZones === 0) return;

  // For each faction, spawn NPCs proportional to territory
  for (const [zf, s] of stats) {
    if (s.zones === 0) continue;
    const faction = zoneFactionToFaction(zf);
    if (faction === null) continue;

    const factionShare = s.zones / totalZones;
    const toSpawn = Math.max(1, Math.round(deficit * factionShare));

    // Collect faction's zones for spawn distribution
    const factionZones = world.zones.filter(z => z.faction === zf);
    if (factionZones.length === 0) continue;

    // Distribute evenly across zones
    const perZone = Math.max(1, Math.ceil(toSpawn / factionZones.length));

    let spawned = 0;
    for (const zone of factionZones) {
      if (spawned >= toSpawn) break;

      // Find a walkable room in this zone to spawn into
      const zoneRooms = world.rooms.filter(r =>
        r && r.w >= 3 && r.h >= 3 &&
        world.zoneMap[world.idx(r.x + (r.w >> 1), r.y + (r.h >> 1))] === zone.id,
      );
      if (zoneRooms.length === 0) continue;

      const count = Math.min(perZone, toSpawn - spawned);
      const occupation = faction === Faction.LIQUIDATOR ? Occupation.HUNTER :
                         faction === Faction.CULTIST ? Occupation.PILGRIM :
                         faction === Faction.WILD ? Occupation.TRAVELER :
                         Occupation.TRAVELER;

      for (let i = 0; i < count; i++) {
        const room = zoneRooms[Math.floor(Math.random() * zoneRooms.length)];
        const sx = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
        const sy = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
        if (world.solid(sx, sy)) continue;

        const zoneLevel = zone.level ?? 1;
        const npcLevel = gaussianLevel(zoneLevel, 2);
        const rpg = randomRPG(npcLevel);
        const maxHp = Math.round(getMaxHp(rpg) * 1.3);
        const nm = randomName(faction);

        entities.push({
          id: nextId.v++,
          type: EntityType.NPC,
          x: sx + 0.5, y: sy + 0.5,
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
          inventory: (faction === Faction.CULTIST && Math.random() < 0.4)
            ? [{ defId: _pickPsi(), count: 1 }] : [],
          weapon: (faction === Faction.CULTIST && Math.random() < 0.4) ? _pickPsi() : undefined,
          faction,
          occupation,
          isTraveler: true,
          questId: -1,
          rpg,
        });
        spawned++;
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

/* ── Debug menu: commands + overlay rendering ────────────────── */

import {
  W, Cell, RoomType, Faction, ZoneFaction, LiftDirection, FloorLevel,
  EntityType, MonsterKind, Occupation, AIGoal,
  type Entity, type GameState, type WorldContainer,
  msg,
} from '../core/types';
import { World } from '../core/world';
import { freshNeeds, randomName, ITEMS } from '../data/catalog';
import { getStack } from '../data/items';
import { FACTION_NAMES } from '../data/relations';
import { MONSTERS, applyMonsterVariant, monsterTypeName } from '../entities/monster';
import { Spr } from '../render/sprite_index';
import { awardXP, randomRPG, getMaxHp } from './rpg';
import { isDebugNoClipEnabled, toggleDebugNoClip } from './psi';
import { cycleForcedSamosborVariant, forceNextSamosborVariant, getActiveSamosborVariant } from '../data/samosbor_variants';
import {
  clearSamosborDirectorCooldowns,
  forceNextSamosborDirectorBeat,
  summarizeSamosborDirector,
} from './samosbor_director';
import { ensureWorldEventState, getImportantEvents, publishEvent, summarizeImportantEventsByFloorZone } from './events';
import { describeContainer, ensureRoomContainers, firstNearbyContainer, nearbyContainers, takeFromContainer } from './containers';
import { changeResourceStock, getAdjustedItemPrice, getResourceScarcity, summarizeEconomy } from './economy';
import { tickProduction, summarizeProduction } from './production';
import { addItem } from './inventory';
import { publishMaronaryShavingAcquired } from './maronary_shaving';
import { spawnContract, spawnContractById, spawnGovnyakCourierContract, summarizeContracts } from './contracts';
import { debugForcePneumomailCapsule } from './pneumomail';
import { populationItemSummary } from './balance';
import { getSamosborDebugLines } from './samosbor';
import { floorCatalogDebugLines } from './floor_catalog';
import { summarizeHeatline } from './heatline';
import { summarizeCarnivorousFungus } from './carnivorous_fungus';
import { summarizeHladonColdPockets } from './hladon';
import { ensureFloorInstanceState, floorInstanceLabel, summarizeFloorInstances } from './floor_instances';
import { currentFloorRunEntry, resolveFloorRunRoute, summarizeFloorRun } from './procedural_floors';
import { summarizeProceduralSmog } from './procedural_anomalies';
import { debugSpawnBadAppleWorld, summarizeBadAppleWorld } from './procedural_anomalies/bad_apple_world';
import { debugForceVoidProtocol } from './void_protocols';
import { forceFactionEvent, summarizeFactionEvents } from './faction_events';
import { debugTriggerRouteCue, routeCueCount } from './route_cues';
import { debugCreateWrongDoorRemap } from './wrong_door';
import { debugForceHermodoorBorer } from './hermodoor_borer';
import { DESIGN_FLOOR_ROUTES, type DesignFloorId } from '../data/design_floors';
import { FLOOR_INSTANCES } from '../data/floor_instances';
import { type FloorAnomalyId } from '../data/procedural_floors';
import { isDebugOnePunchManEnabled, keepDebugOnePunchManAlive, toggleDebugOnePunchMan } from './debug_cheats';
import { fitText } from '../render/ui_text';
import {
  grantNetTerminalGenAccess,
  placeNetTerminalGenTerminal,
  placeNetTerminalGenTerminalsForCurrentFloor,
  summarizeNetTerminalGen,
} from './net_terminal_gen';
import {
  clearCurrentMapEditorPatch,
  openMapEditor,
  replayMapEditorPatchForCurrentFloor,
  summarizeMapEditor,
} from './map_editor';

/* ── Command execution ───────────────────────────────────────── */

const CATALOG_DEBUG_SEARCHES = ['', 'numbered', '404', 'school', 'hospital', 'market'];
const DEBUG_FORCED_VERETAR_LEAD_SECONDS = 30;
const DEBUG_SAMOSBOR_WARNING_SECONDS = 12;
const DEBUG_MONSTER_SCAN_CAP = 192;
const DEBUG_CONTAINER_ROUTE_RADIUS = 2;
const DEBUG_VERIFICATION_CONTRACT_IDS = [
  'exp_living_emergency_roster',
  'exp_ministry_safe_override',
  'exp_kvartiry_ration_stamp',
  'exp_maint_pressure_repair',
  'exp_hell_bottled_voice_retrieve',
  'exp_void_archive_warrant',
] as const;
const DEBUG_ECONOMY_PULSES = [
  { resourceId: 'drink_water', itemId: 'water', delta: -90, label: 'вода' },
  { resourceId: 'medicine', itemId: 'bandage', delta: -55, label: 'медицина' },
  { resourceId: 'ammo', itemId: 'ammo_9mm', delta: -65, label: 'патроны' },
] as const;
const DEBUG_MONSTER_PACKS: Record<FloorLevel, readonly MonsterKind[]> = {
  [FloorLevel.MINISTRY]: [MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK],
  [FloorLevel.KVARTIRY]: [MonsterKind.REBAR, MonsterKind.NELYUD, MonsterKind.KRYSNOZHKA],
  [FloorLevel.LIVING]: [MonsterKind.SBORKA, MonsterKind.SHADOW, MonsterKind.NELYUD],
  [FloorLevel.MAINTENANCE]: [MonsterKind.TUBE_EEL, MonsterKind.POLZUN, MonsterKind.KOSTOREZ],
  [FloorLevel.HELL]: [MonsterKind.HERALD, MonsterKind.KOSTOREZ, MonsterKind.TVAR],
  [FloorLevel.VOID]: [MonsterKind.PARAGRAPH, MonsterKind.EYE, MonsterKind.SPIRIT],
};
let catalogDebugSearchIndex = 0;
let debugVerificationContractIndex = 0;
let debugEconomyPulseIndex = 0;
let debugFloorInstanceCursor = 0;

export type DebugCommandAction =
  | { type: 'teleport_story_floor'; floor: FloorLevel }
  | { type: 'teleport_random_procedural_floor' }
  | { type: 'teleport_procedural_anomaly'; anomalyId: FloorAnomalyId }
  | { type: 'teleport_design_floor'; id: DesignFloorId; floor: FloorLevel; z: number; label: string; color: string }
  | { type: 'refresh_world_data' };

function movePlayerToSmokeLift(world: World, player: Entity, entities: Entity[]): boolean {
  let fallback: { x: number; y: number; angle: number } | null = null;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.LIFT) continue;
    const lx = i % W;
    const ly = (i / W) | 0;
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    for (const dir of dirs) {
      const px = world.wrap(lx + dir.dx);
      const py = world.wrap(ly + dir.dy);
      const pi = world.idx(px, py);
      if (world.cells[pi] === Cell.LIFT || world.solid(px, py)) continue;
      const spot = {
        x: px + 0.5,
        y: py + 0.5,
        angle: Math.atan2((ly + 0.5) - (py + 0.5), (lx + 0.5) - (px + 0.5)),
      };
      fallback ??= spot;
      const actorTooClose = entities.some(e => (
        (e.type === EntityType.NPC || e.type === EntityType.MONSTER)
        && e.alive
        && world.dist2(spot.x, spot.y, e.x, e.y) < 9
      ));
      if (!actorTooClose) {
        player.x = spot.x;
        player.y = spot.y;
        player.angle = spot.angle;
        player.pitch = 0;
        return true;
      }
    }
  }
  if (!fallback) return false;
  player.x = fallback.x;
  player.y = fallback.y;
  player.angle = fallback.angle;
  player.pitch = 0;
  return true;
}

function isSmokeDebugRun(): boolean {
  return typeof window !== 'undefined' && window.location.search.includes('smoke');
}

function stabilizeSmokeRecovery(world: World, player: Entity, entities: Entity[]): void {
  movePlayerToSmokeLift(world, player, entities);
  player.alive = true;
  player.maxHp = Math.max(100, player.maxHp ?? 100);
  player.hp = player.maxHp;
}

function formatDebugZ(z: number): string {
  return z > 0 ? `+${z}` : `${z}`;
}

function currentPlayerZone(world: World, player: Entity): number | undefined {
  const x = world.wrap(Math.floor(player.x));
  const y = world.wrap(Math.floor(player.y));
  const zone = world.zoneMap[world.idx(x, y)];
  return zone >= 0 ? zone : undefined;
}

function currentPlayerRoom(world: World, player: Entity): number | undefined {
  const x = world.wrap(Math.floor(player.x));
  const y = world.wrap(Math.floor(player.y));
  const room = world.roomMap[world.idx(x, y)];
  return room >= 0 ? room : undefined;
}

function routeEntryLine(prefix: string, entry: ReturnType<typeof currentFloorRunEntry> | null): string {
  if (!entry) return `${prefix}: нет остановки`;
  const kind = entry.spec
    ? `proc ${entry.spec.anomalyId} d${entry.spec.danger}`
    : entry.designFloorId
      ? `design ${entry.designFloorId}`
      : `story ${FloorLevel[entry.baseFloor]}`;
  return `${prefix}: Z${formatDebugZ(entry.z)} ${kind} ${entry.label}`;
}

function debugRouteWindowLines(state: GameState): string[] {
  return [
    routeEntryLine('now', currentFloorRunEntry(state)),
    routeEntryLine('up', resolveFloorRunRoute(state, LiftDirection.UP)),
    routeEntryLine('down', resolveFloorRunRoute(state, LiftDirection.DOWN)),
  ];
}

function spawnDebugVerificationContract(state: GameState): string[] {
  for (let step = 0; step < DEBUG_VERIFICATION_CONTRACT_IDS.length; step++) {
    const idx = (debugVerificationContractIndex + step) % DEBUG_VERIFICATION_CONTRACT_IDS.length;
    const id = DEBUG_VERIFICATION_CONTRACT_IDS[idx];
    if (state.quests.some(q => q.contractId === id)) continue;
    debugVerificationContractIndex = idx + 1;
    const created = spawnContractById(state, id, ['debug_route', 'verification']);
    return [
      created ? `created ${id}` : `failed ${id}`,
      ...summarizeContracts(state, 5),
    ];
  }
  return ['all verification contracts already exist in quest history', ...summarizeContracts(state, 5)];
}

function publishDebugVerificationEvent(world: World, player: Entity, state: GameState): string {
  const event = publishEvent(state, {
    type: 'rumor_observed',
    zoneId: currentPlayerZone(world, player),
    roomId: currentPlayerRoom(world, player),
    x: player.x,
    y: player.y,
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    targetName: 'debug verification route',
    severity: 4,
    privacy: 'local',
    tags: ['debug', 'verification', 'events', 'rumor_observed'],
    data: {
      source: 'debug_menu',
      routeZ: currentFloorRunEntry(state).z,
      samosborActive: state.samosborActive,
    },
  });
  return `published ${event.type}#${event.id} sev${event.severity}`;
}

function applyDebugEconomyPulse(world: World, player: Entity, state: GameState): string[] {
  const pulse = DEBUG_ECONOMY_PULSES[debugEconomyPulseIndex++ % DEBUG_ECONOMY_PULSES.length];
  const before = getResourceScarcity(state, pulse.resourceId);
  const ok = changeResourceStock(state, pulse.resourceId, pulse.delta);
  const after = getResourceScarcity(state, pulse.resourceId);
  if (ok) {
    publishEvent(state, {
      type: 'room_lacked_resources',
      zoneId: currentPlayerZone(world, player),
      roomId: currentPlayerRoom(world, player),
      x: player.x,
      y: player.y,
      actorId: player.id,
      actorName: player.name ?? 'Вы',
      actorFaction: player.faction,
      itemId: pulse.itemId,
      itemName: ITEMS[pulse.itemId]?.name ?? pulse.itemId,
      severity: 4,
      privacy: 'local',
      tags: ['debug', 'economy', 'shortage', pulse.resourceId],
      data: {
        source: 'debug_menu',
        resourceId: pulse.resourceId,
        stockDelta: pulse.delta,
        scarcityBefore: before,
        scarcityAfter: after,
      },
    });
  }
  return [
    ok
      ? `${pulse.label}: x${before.toFixed(2)} -> x${after.toFixed(2)} price ${getAdjustedItemPrice(state, pulse.itemId)}`
      : `${pulse.label}: resource missing`,
    ...summarizeEconomy(state, 5),
  ];
}

function passableDebugCell(world: World, x: number, y: number): boolean {
  const ci = world.idx(x, y);
  return (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) && !world.solid(x, y);
}

function entityBlocksDebugSpawn(world: World, entities: Entity[], x: number, y: number): boolean {
  let scanned = 0;
  for (const e of entities) {
    if (++scanned > DEBUG_MONSTER_SCAN_CAP) break;
    if (!e.alive || e.type === EntityType.ITEM_DROP || e.type === EntityType.PROJECTILE) continue;
    if (world.dist2(x + 0.5, y + 0.5, e.x, e.y) < 1.2) return true;
  }
  return false;
}

function findDebugMonsterSpot(
  world: World,
  player: Entity,
  entities: Entity[],
  index: number,
  total: number,
): { x: number; y: number } | null {
  const spread = Math.max(0.35, Math.min(0.9, Math.PI / Math.max(3, total)));
  const base = player.angle + (index - (total - 1) / 2) * spread;
  for (const dist of [3.2, 4.4, 5.8, 7.0]) {
    for (const offset of [0, 0.45, -0.45, 0.9, -0.9]) {
      const x = world.wrap(Math.floor(player.x + Math.cos(base + offset) * dist));
      const y = world.wrap(Math.floor(player.y + Math.sin(base + offset) * dist));
      if (!passableDebugCell(world, x, y)) continue;
      if (entityBlocksDebugSpawn(world, entities, x, y)) continue;
      return { x: x + 0.5, y: y + 0.5 };
    }
  }
  return null;
}

function spawnDebugMonsterPack(
  world: World,
  player: Entity,
  entities: Entity[],
  state: GameState,
  nextEntityId: { v: number },
): string[] {
  const kinds = DEBUG_MONSTER_PACKS[state.currentFloor];
  let spawned = 0;
  const names: string[] = [];
  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i];
    const def = MONSTERS[kind];
    const spot = findDebugMonsterSpot(world, player, entities, i, kinds.length);
    if (!def || !spot) continue;
    const monster: Entity = {
      id: nextEntityId.v++,
      type: EntityType.MONSTER,
      x: spot.x,
      y: spot.y,
      angle: Math.atan2(player.y - spot.y, player.x - spot.x),
      pitch: 0,
      alive: true,
      speed: def.speed,
      sprite: def.sprite,
      hp: def.hp,
      maxHp: def.hp,
      monsterKind: kind,
      attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: spot.x, ty: spot.y, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg: randomRPG(player.rpg?.level ?? 1),
      phasing: kind === MonsterKind.SPIRIT,
    };
    applyMonsterVariant(monster, state.currentFloor, true);
    entities.push(monster);
    spawned++;
    names.push(monsterTypeName(kind));
    publishEvent(state, {
      type: 'monster_sighted',
      zoneId: currentPlayerZone(world, player),
      x: spot.x,
      y: spot.y,
      targetId: monster.id,
      targetName: monsterTypeName(kind),
      monsterKind: kind,
      severity: 3,
      privacy: 'local',
      tags: ['debug', 'monster', 'verification', 'counterplay'],
      data: {
        source: 'debug_menu',
        counterplay: def.counterplay,
      },
    });
  }
  return spawned > 0
    ? [`spawned ${spawned}: ${names.join(', ')}`]
    : ['no passable spawn cells in front of player'];
}

function adjacentContainerRouteSpot(world: World, container: WorldContainer): { x: number; y: number } | null {
  for (let r = 1; r <= DEBUG_CONTAINER_ROUTE_RADIUS; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = world.wrap(container.x + dx);
        const y = world.wrap(container.y + dy);
        if (passableDebugCell(world, x, y)) return { x, y };
      }
    }
  }
  return null;
}

function routePlayerToNearestContainer(world: World, player: Entity, state: GameState): string[] {
  const created = ensureRoomContainers(world, state.currentFloor);
  let best: WorldContainer | null = null;
  let bestScore = Infinity;
  for (const c of world.containers) {
    if (c.floor !== state.currentFloor) continue;
    const route = adjacentContainerRouteSpot(world, c);
    if (!route) continue;
    const theftBias = c.access === 'faction' || c.access === 'owner' ? -500 : 0;
    const lootBias = c.inventory.length > 0 ? -250 : 0;
    const score = world.dist2(player.x, player.y, c.x + 0.5, c.y + 0.5) + theftBias + lootBias;
    if (score >= bestScore) continue;
    best = c;
    bestScore = score;
  }
  if (!best) return [`created=${created}; no routeable containers on floor`];
  const spot = adjacentContainerRouteSpot(world, best);
  if (!spot) return [`created=${created}; nearest container has no adjacent cell`];
  player.x = spot.x + 0.5;
  player.y = spot.y + 0.5;
  player.angle = Math.atan2((best.y + 0.5) - player.y, (best.x + 0.5) - player.x);
  player.pitch = 0;
  return [`created=${created}; routed to ${describeContainer(best)}`];
}

function armLocalFloorInstance(world: World, player: Entity, state: GameState): string[] {
  const candidates = FLOOR_INSTANCES.filter(def => def.baseFloor === state.currentFloor);
  if (candidates.length === 0) return [`no numbered loop uses ${FloorLevel[state.currentFloor]} as base; teleport to another story floor first`];
  const def = candidates[debugFloorInstanceCursor++ % candidates.length];
  const store = ensureFloorInstanceState(state, state.currentFloor);
  const instance = {
    id: def.id,
    displayNumber: def.displayNumber,
    title: def.title,
    baseFloor: def.baseFloor,
    seed: Math.floor(Math.random() * 0x7fffffff),
    seedTag: def.seedTag,
    risk: def.risk,
    enteredAt: state.time,
    fromFloor: state.currentFloor,
    intendedFloor: state.currentFloor,
    direction: LiftDirection.DOWN,
    returnFloor: state.currentFloor,
  };
  store.current = instance;
  store.discovered[def.id] = true;
  store.anomalyCount++;
  store.lastAnomalyAt = state.time;
  store.lastRoll = 0;
  publishEvent(state, {
    type: 'elevator_anomaly',
    floor: def.baseFloor,
    zoneId: currentPlayerZone(world, player),
    x: player.x,
    y: player.y,
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    severity: 4,
    privacy: 'local',
    tags: ['debug', 'elevator', 'floor_instance', def.id, 'wrong_route'],
    data: {
      source: 'debug_menu',
      displayNumber: def.displayNumber,
      title: def.title,
      seed: instance.seed,
      seedTag: instance.seedTag,
      risk: instance.risk,
      fromFloor: instance.fromFloor,
      intendedFloor: instance.intendedFloor,
      returnFloor: instance.returnFloor,
    },
  });
  return [
    `armed ${floorInstanceLabel(instance)}`,
    'use any lift once to publish loop exit and return to stable route',
  ];
}

function setSamosborWarningWindow(state: GameState): string {
  if (state.samosborActive) {
    state.samosborTimer = Math.min(state.samosborTimer, DEBUG_SAMOSBOR_WARNING_SECONDS);
    return `active samosbor ends in <=${DEBUG_SAMOSBOR_WARNING_SECONDS}s`;
  }
  state.samosborTimer = DEBUG_SAMOSBOR_WARNING_SECONDS;
  return `warning window set to ${DEBUG_SAMOSBOR_WARNING_SECONDS}s`;
}

function spawnSmokeTarget(world: World, player: Entity, entities: Entity[], state: GameState, nextEntityId: { v: number }): boolean {
  const def = MONSTERS[MonsterKind.SBORKA];
  const baseAngles = [player.angle, player.angle + 0.45, player.angle - 0.45, player.angle + Math.PI];
  for (const angle of baseAngles) {
    for (const dist of [3.5, 2.5, 4.5]) {
      const x = player.x + Math.cos(angle) * dist;
      const y = player.y + Math.sin(angle) * dist;
      if (world.solid(Math.floor(x), Math.floor(y))) continue;
      const monster: Entity = {
        id: nextEntityId.v++, type: EntityType.MONSTER,
        x, y,
        angle: angle + Math.PI, pitch: 0, alive: true,
        speed: def.speed, sprite: def.sprite,
        hp: Math.min(def.hp, 18), maxHp: Math.min(def.hp, 18),
        monsterKind: MonsterKind.SBORKA, attackCd: 0,
        ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
        rpg: randomRPG(player.rpg?.level ?? 1),
      };
      applyMonsterVariant(monster, state.currentFloor, true);
      entities.push(monster);
      return true;
    }
  }
  return false;
}

export function execDebugCommand(
  idx: number,
  world: World,
  player: Entity,
  entities: Entity[],
  state: GameState,
  nextEntityId: { v: number },
): DebugCommandAction | null {
  if (idx >= DESIGN_FLOOR_COMMAND_START) {
    const def = DESIGN_FLOOR_ROUTES[idx - DESIGN_FLOOR_COMMAND_START];
    if (def) {
      return {
        type: 'teleport_design_floor',
        id: def.id,
        floor: def.baseFloor,
        z: def.z,
        label: def.displayName,
        color: def.color,
      };
    }
  }

  switch (idx) {
    case 0: { // All weapons + ammo + PSI spells — spawn as drops around player
      const allItems: { defId: string; count: number }[] = [
        // weapons
        ...['knife', 'wrench', 'pipe', 'rebar', 'axe', 'makarov', 'shotgun', 'nailgun',
          'chainsaw', 'ppsh', 'machinegun', 'gauss', 'plasma', 'bfg', 'flamethrower']
          .map(w => ({ defId: w, count: 1 })),
        { defId: 'uv_spotlight', count: 1 },
        { defId: 'grenade', count: 99 },
        // ammo
        { defId: 'ammo_9mm', count: 999 },
        { defId: 'ammo_shells', count: 999 },
        { defId: 'ammo_nails', count: 999 },
        { defId: 'ammo_belt', count: 999 },
        { defId: 'ammo_energy', count: 999 },
        { defId: 'ammo_fuel', count: 999 },
        // psi spells
        ...['psi_strike', 'psi_rupture', 'psi_storm', 'psi_brainburn', 'psi_madness',
          'psi_control', 'psi_phase', 'psi_mark', 'psi_recall', 'psi_beam']
          .map(s => ({ defId: s, count: 1 })),
      ];
      for (let i = 0; i < allItems.length; i++) {
        const ang = (i / allItems.length) * Math.PI * 2;
        entities.push({
          id: nextEntityId.v++, type: EntityType.ITEM_DROP,
          x: player.x + Math.cos(ang) * 2,
          y: player.y + Math.sin(ang) * 2,
          angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
          inventory: [allItems[i]],
        });
      }
      state.msgs.push(msg('Все оружия + сгустки заспавнены', state.time, '#ff0'));
      break;
    }
    case 1: { // Spawn one of each monster nearby
      const kinds = Object.values(MonsterKind).filter((v): v is MonsterKind => typeof v === 'number');
      for (let i = 0; i < kinds.length; i++) {
        const k = kinds[i];
        const def = MONSTERS[k];
        const ang = (i / kinds.length) * Math.PI * 2;
        const monster: Entity = {
          id: nextEntityId.v++, type: EntityType.MONSTER,
          x: player.x + Math.cos(ang) * 4,
          y: player.y + Math.sin(ang) * 4,
          angle: ang + Math.PI, pitch: 0, alive: true,
          speed: def.speed, sprite: def.sprite,
          hp: def.hp, maxHp: def.hp,
          monsterKind: k, attackCd: 0,
          ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
          rpg: randomRPG(player.rpg?.level ?? 1),
          phasing: k === MonsterKind.SPIRIT,
        };
        applyMonsterVariant(monster, state.currentFloor, true);
        entities.push(monster);
      }
      state.msgs.push(msg('Все монстры заспавнены', state.time, '#ff0'));
      break;
    }
    case 2: { // Spawn random NPC nearby
      const nm = randomName();
      const rpg = randomRPG(player.rpg?.level ?? 1);
      const maxHp = getMaxHp(rpg);
      const factions = [Faction.CITIZEN, Faction.LIQUIDATOR, Faction.CULTIST, Faction.WILD];
      const faction = factions[Math.floor(Math.random() * factions.length)];
      entities.push({
        id: nextEntityId.v++, type: EntityType.NPC,
        x: player.x + Math.cos(player.angle) * 2,
        y: player.y + Math.sin(player.angle) * 2,
        angle: player.angle + Math.PI, pitch: 0, alive: true,
        speed: 1.2, sprite: Occupation.TRAVELER,
        name: nm.name, isFemale: nm.female,
        needs: freshNeeds(), hp: maxHp, maxHp,
        ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
        inventory: [], faction, occupation: Occupation.TRAVELER, isTraveler: true,
        rpg, money: 20 + Math.floor(Math.random() * 80),
      });
      state.msgs.push(msg(`NPC ${nm.name} заспавнен`, state.time, '#ff0'));
      break;
    }
    case 3: { // Spawn all items nearby
      const ids = Object.keys(ITEMS);
      for (let i = 0; i < ids.length; i++) {
        const def = ITEMS[ids[i]];
        const ang = (i / ids.length) * Math.PI * 2;
        entities.push({
          id: nextEntityId.v++, type: EntityType.ITEM_DROP,
          x: player.x + Math.cos(ang) * 2,
          y: player.y + Math.sin(ang) * 2,
          angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
          inventory: [{ defId: def.id, count: getStack(def) }],
        });
      }
      state.msgs.push(msg('Все предметы заспавнены', state.time, '#ff0'));
      break;
    }
    case 4: { // Give 1M XP
      awardXP(player, 1_000_000, state.msgs, state.time);
      state.msgs.push(msg('+1 000 000 XP', state.time, '#ff0'));
      break;
    }
    case 5: { // Cycle forced samosbor variant + start
      const variantId = cycleForcedSamosborVariant();
      state.samosborTimer = 0;
      state.msgs.push(msg(`[DEBUG] Следующий самосбор: ${variantId}`, state.time, '#ff0'));
      break;
    }
    case 6: { // Toggle noclip
      const enabled = toggleDebugNoClip();
      state.msgs.push(msg(
        `[DEBUG] Noclip ${enabled ? 'включён' : 'выключен'}`,
        state.time,
        '#ff0',
      ));
      break;
    }
    case 7: { // Recent important world events
      const store = ensureWorldEventState(state);
      state.msgs.push(msg(
        `[EVENTS] recent=${store.recentEvents.count}/${store.recentEvents.capacity} important=${store.importantEvents.count}/${store.importantEvents.capacity}`,
        state.time,
        '#ff0',
      ));
      const important = getImportantEvents(state, 10);
      if (important.length === 0) {
        state.msgs.push(msg('[EVENTS] important: none', state.time, '#888'));
        break;
      }
      for (let i = important.length - 1; i >= 0; i--) {
        const e = important[i];
        const zone = e.zoneId !== undefined ? ` z${e.zoneId + 1}` : '';
        state.msgs.push(msg(`[EVENTS] #${e.id} ${e.type}${zone} sev${e.severity}`, state.time, '#ccf'));
      }
      for (const row of summarizeImportantEventsByFloorZone(state, 8)) {
        const zone = row.zoneId >= 0 ? `z${row.zoneId + 1}` : 'z?';
        state.msgs.push(msg(
          `[EVENTS] floor ${row.floor} ${zone}: ${row.count} imp, max${row.maxSeverity}, last ${row.lastType}#${row.lastId}`,
          state.time,
          '#9cf',
        ));
      }
      break;
    }
    case 8: { // Economy prices
      for (const line of summarizeEconomy(state, 10)) state.msgs.push(msg(`[PRICE] ${line}`, state.time, '#ccf'));
      for (const id of ['water', 'bread', 'bandage', 'ammo_9mm', 'pipe', 'note']) {
        state.msgs.push(msg(`[PRICE] ${ITEMS[id]?.name ?? id}: ${getAdjustedItemPrice(state, id)}₽`, state.time, '#ccf'));
      }
      break;
    }
    case 9: { // Containers near player
      const made = ensureRoomContainers(world, state.currentFloor);
      if (made > 0) state.msgs.push(msg(`[CONT] создано: ${made}`, state.time, '#ff0'));
      const list = nearbyContainers(world, player, 3);
      if (list.length === 0) {
        state.msgs.push(msg(`[CONT] рядом нет. всего=${world.containers.length}`, state.time, '#888'));
        break;
      }
      for (const c of list.slice(0, 5)) state.msgs.push(msg(`[CONT] ${describeContainer(c)}`, state.time, '#ccf'));
      break;
    }
    case 10: { // Take first item from nearest container
      ensureRoomContainers(world, state.currentFloor);
      const c = firstNearbyContainer(world, player);
      if (!c) {
        state.msgs.push(msg('[CONT] рядом нет контейнера', state.time, '#888'));
        break;
      }
      const ok = takeFromContainer(c, player, 0, 1, { state, world, entities });
      state.msgs.push(msg(ok ? `[CONT] взято из #${c.id}` : `[CONT] #${c.id} пуст/недоступен`, state.time, ok ? '#4f4' : '#f84'));
      break;
    }
    case 11: { // Force production tick
      const made = tickProduction(state, world, true);
      for (const line of summarizeProduction(state, 5)) state.msgs.push(msg(`[PROD] ${line}`, state.time, made > 0 ? '#4f4' : '#888'));
      break;
    }
    case 12: { // Spawn/list system quest
      spawnContract(state);
      for (const line of summarizeContracts(state, 6)) state.msgs.push(msg(`[QUEST] ${line}`, state.time, '#6cf'));
      break;
    }
    case 13: { // Population, item count, and floor pocket catalog
      for (const line of populationItemSummary(world, entities, state)) state.msgs.push(msg(`[BAL] ${line}`, state.time, '#ccf'));
      const search = CATALOG_DEBUG_SEARCHES[catalogDebugSearchIndex++ % CATALOG_DEBUG_SEARCHES.length];
      const query = search
        ? { search, limit: 6 }
        : { baseFloor: state.currentFloor, limit: 6 };
      for (const line of floorCatalogDebugLines(query)) state.msgs.push(msg(`[CAT] ${line}`, state.time, '#ccf'));
      for (const line of summarizeHeatline(world)) state.msgs.push(msg(line, state.time, '#f84'));
      for (const line of summarizeCarnivorousFungus(world)) state.msgs.push(msg(line, state.time, '#bf8'));
      for (const line of summarizeHladonColdPockets(world, player)) state.msgs.push(msg(line, state.time, '#8cf'));
      break;
    }
    case 14: { // Elevator floor instance state
      for (const line of summarizeFloorRun(state)) state.msgs.push(msg(`[FLOOR] ${line}`, state.time, '#8cf'));
      for (const line of summarizeFloorInstances(state)) state.msgs.push(msg(`[LIFT] ${line}`, state.time, '#f4a'));
      break;
    }
    case 15: { // VOID protocols: grant/apply/list bounded state
      for (const line of debugForceVoidProtocol(world, player, entities, state, nextEntityId)) {
        state.msgs.push(msg(`[VOID] ${line}`, state.time, '#8ff'));
      }
      break;
    }
    case 16: { // Faction event scheduler
      for (const line of summarizeFactionEvents(state, world, player, entities)) {
        state.msgs.push(msg(`[FACT] ${line}`, state.time, '#ccf'));
      }
      break;
    }
    case 17: { // Force faction event in current zone
      state.msgs.push(msg(forceFactionEvent(state, world, player, entities, nextEntityId), state.time, '#ff0'));
      break;
    }
    case 18: { // Force cult procession in current zone
      state.msgs.push(msg(forceFactionEvent(state, world, player, entities, nextEntityId, 'cult_procession'), state.time, '#ff0'));
      break;
    }
    case 19: { // Samosbor director state
      for (const line of summarizeSamosborDirector(state)) state.msgs.push(msg(`[DIR] ${line}`, state.time, '#ccf'));
      break;
    }
    case 20: { // Force next samosbor director beat
      const result = forceNextSamosborDirectorBeat(world, entities, state, nextEntityId, getActiveSamosborVariant());
      state.msgs.push(msg(
        result.fired ? `[DIR] forced ${result.beatId}` : `[DIR] ${result.reasonCode}`,
        state.time,
        result.fired ? '#4f4' : '#f84',
      ));
      break;
    }
    case 21: { // Clear samosbor director cooldowns
      clearSamosborDirectorCooldowns(state);
      state.msgs.push(msg('[DIR] cooldowns cleared', state.time, '#ff0'));
      break;
    }
    case 22: return { type: 'teleport_story_floor', floor: FloorLevel.MINISTRY };
    case 23: return { type: 'teleport_story_floor', floor: FloorLevel.KVARTIRY };
    case 24: return { type: 'teleport_story_floor', floor: FloorLevel.LIVING };
    case 25: return { type: 'teleport_story_floor', floor: FloorLevel.MAINTENANCE };
    case 26: return { type: 'teleport_story_floor', floor: FloorLevel.HELL };
    case 27: return { type: 'teleport_story_floor', floor: FloorLevel.VOID };
    case 28: return { type: 'teleport_random_procedural_floor' };
    case 29: { // Smoke expedition setup
      addItem(player, 'makarov', 1);
      addItem(player, 'ammo_9mm', 30);
      player.weapon = 'makarov';
      const moved = movePlayerToSmokeLift(world, player, entities);
      const target = spawnSmokeTarget(world, player, entities, state, nextEntityId);
      const contract = spawnContract(state);
      state.msgs.push(msg(
        `[SMOKE] kit=${player.weapon} lift=${moved ? 'ready' : 'missing'} target=${target ? 'spawned' : 'skipped'} contract=${contract ? 'created' : 'skipped'}`,
        state.time,
        moved && contract ? '#4f4' : '#f84',
      ));
      break;
    }
    case 30: { // Force Veretar variant + start
      forceNextSamosborVariant('veretar');
      if (!state.samosborActive) state.samosborTimer = DEBUG_FORCED_VERETAR_LEAD_SECONDS;
      if (isSmokeDebugRun()) stabilizeSmokeRecovery(world, player, entities);
      state.msgs.push(msg(
        state.samosborActive
          ? '[DEBUG] Следующий самосбор: Веретар после текущего'
          : `[DEBUG] Следующий самосбор: Веретар через ${DEBUG_FORCED_VERETAR_LEAD_SECONDS}с`,
        state.time,
        '#f4f1df',
      ));
      break;
    }
    case 31: { // Force Maronary variant + start
      forceNextSamosborVariant('maronary');
      state.samosborTimer = 0;
      state.msgs.push(msg('[DEBUG] Следующий самосбор: Маронарий', state.time, '#35ff66'));
      break;
    }
    case 32: { // Route cue audio/HUD smoke
      const count = routeCueCount(world);
      state.msgs.push(msg(`[CUE] registered=${count}`, state.time, count > 0 ? '#9f7' : '#fa4'));
      for (const line of debugTriggerRouteCue(world, player, state)) {
        state.msgs.push(msg(`[CUE] ${line}`, state.time, '#9f7'));
      }
      break;
    }
    case 33: { // Force Maronary wrong-door remap
      const ok = debugCreateWrongDoorRemap(world, player, state);
      state.msgs.push(msg(
        ok ? '[MAR] неправильная дверь создана' : '[MAR] рядом нет подходящей пары дверей',
        state.time,
        ok ? '#35ff66' : '#f84',
      ));
      break;
    }
    case 34: { // Grant Maronary shaving
      const ok = addItem(player, 'maronary_shaving', 1);
      if (ok) publishMaronaryShavingAcquired(player, state, 'debug_grant');
      state.msgs.push(msg(ok ? '[MAR] зелёная стружка выдана' : '[MAR] нет места для стружки', state.time, ok ? '#fc4' : '#f84'));
      break;
    }
    case 35: { // Force Istotit variant + start
      forceNextSamosborVariant('istotit');
      state.samosborTimer = 0;
      state.msgs.push(msg('[DEBUG] Следующий самосбор: Истотит', state.time, '#d6a64b'));
      break;
    }
    case 36: return { type: 'teleport_procedural_anomaly', anomalyId: 'smog' };
    case 37: return { type: 'teleport_procedural_anomaly', anomalyId: 'false_safe_block' };
    case 38: return { type: 'teleport_procedural_anomaly', anomalyId: 'hladon' };
    case 39: { // Govnyak courier route choice
      const created = spawnGovnyakCourierContract(state, player);
      for (const line of summarizeContracts(state, 6)) state.msgs.push(msg(`[QUEST] ${line}`, state.time, created ? '#6cf' : '#888'));
      break;
    }
    case 40: { // Force pneumomail capsule
      for (const line of debugForcePneumomailCapsule(world, player, state)) {
        state.msgs.push(msg(`[PMAIL] ${line}`, state.time, '#8cf'));
      }
      break;
    }
    case 41: { // Force hermodoor borer QA route
      for (const line of debugForceHermodoorBorer(world, player, entities, state, nextEntityId)) {
        state.msgs.push(msg(`[BORER] ${line}`, state.time, '#fb6'));
      }
      break;
    }
    case 42: { // Force liquidator-cult clash
      state.msgs.push(msg(forceFactionEvent(state, world, player, entities, nextEntityId, 'cult_liquidator_clash'), state.time, '#ff0'));
      break;
    }
    case 43: { // Toggle Onepunchman cheat
      const enabled = toggleDebugOnePunchMan();
      if (enabled) keepDebugOnePunchManAlive(player);
      state.msgs.push(msg(
        `[DEBUG] ONEPUNCHMAN ${enabled ? 'включён' : 'выключен'}`,
        state.time,
        enabled ? '#ff0' : '#888',
      ));
      break;
    }
    case 44: { // Grant Net Terminal Gen access
      grantNetTerminalGenAccess(state);
      state.msgs.push(msg('[НЕТ-ГЕН] доступ выдан', state.time, '#63f6ff'));
      break;
    }
    case 45: { // Place generated terminals on current floor
      const count = placeNetTerminalGenTerminalsForCurrentFloor(world, state, { debug: true, max: 4, clearExisting: true, source: 'debug' });
      state.msgs.push(msg(`[НЕТ-ГЕН] терминалов: ${count}`, state.time, count > 0 ? '#63f6ff' : '#f84'));
      return { type: 'refresh_world_data' };
    }
    case 46: { // Place terminal in front of player
      const x = Math.floor(player.x + Math.cos(player.angle) * 1.5);
      const y = Math.floor(player.y + Math.sin(player.angle) * 1.5);
      const terminal = placeNetTerminalGenTerminal(world, x, y, undefined, 'debug');
      state.msgs.push(msg(terminal ? `[НЕТ-ГЕН] терминал ${terminal.x},${terminal.y}` : '[НЕТ-ГЕН] нет подходящей клетки', state.time, terminal ? '#63f6ff' : '#f84'));
      return { type: 'refresh_world_data' };
    }
    case 47: { // Open map editor
      state.showDebug = false;
      openMapEditor(world, player, state);
      break;
    }
    case 48: { // Net Terminal Gen and map editor status
      for (const line of summarizeNetTerminalGen(state, player)) state.msgs.push(msg(`[НЕТ-ГЕН] ${line}`, state.time, '#63f6ff'));
      for (const line of summarizeMapEditor(state)) state.msgs.push(msg(`[MAPEDIT] ${line}`, state.time, '#9fdbc6'));
      break;
    }
    case 49: { // Replay current map patch
      const applied = replayMapEditorPatchForCurrentFloor(world, entities, player, state, nextEntityId);
      state.msgs.push(msg(`[MAPEDIT] replay ${applied}`, state.time, applied > 0 ? '#9fdbc6' : '#888'));
      return { type: 'refresh_world_data' };
    }
    case 50: { // Clear current map patch
      const cleared = clearCurrentMapEditorPatch(state);
      state.msgs.push(msg(cleared ? '[MAPEDIT] patch cleared' : '[MAPEDIT] patch empty', state.time, cleared ? '#9fdbc6' : '#888'));
      break;
    }
    case 51: return { type: 'teleport_procedural_anomaly', anomalyId: 'fractal_floor' };
    case 52: return { type: 'teleport_procedural_anomaly', anomalyId: 'mirror_run' };
    case 53: return { type: 'teleport_procedural_anomaly', anomalyId: 'radio_chess' };
    case 54: return { type: 'teleport_procedural_anomaly', anomalyId: 'cement_memory' };
    case 55: return { type: 'teleport_procedural_anomaly', anomalyId: 'conveyor_sorter' };
    case 56: return { type: 'teleport_procedural_anomaly', anomalyId: 'wall_snake' };
    case 57: return { type: 'teleport_procedural_anomaly', anomalyId: 'section_shift' };
    case 58: return { type: 'teleport_procedural_anomaly', anomalyId: 'conway_life' };
    case 59: return { type: 'teleport_procedural_anomaly', anomalyId: 'rail_trains' };
    case 60: {
      for (const line of debugSpawnBadAppleWorld(world, player, state)) state.msgs.push(msg(`[BADAPPLE] ${line}`, state.time, '#fff'));
      return { type: 'refresh_world_data' };
    }
    case 61: { // Verification contract route
      for (const line of spawnDebugVerificationContract(state)) state.msgs.push(msg(`[CONTRACT-DEBUG] ${line}`, state.time, '#6cf'));
      break;
    }
    case 62: { // Publish verification event
      state.msgs.push(msg(`[EVENTS-DEBUG] ${publishDebugVerificationEvent(world, player, state)}`, state.time, '#ff0'));
      break;
    }
    case 63: { // Floor route window
      for (const line of debugRouteWindowLines(state)) state.msgs.push(msg(`[ROUTE] ${line}`, state.time, '#8cf'));
      break;
    }
    case 64: { // Arm current-floor numbered lift anomaly
      for (const line of armLocalFloorInstance(world, player, state)) state.msgs.push(msg(`[LIFT-DEBUG] ${line}`, state.time, '#f4a'));
      break;
    }
    case 65: { // Samosbor warning window
      state.msgs.push(msg(`[SAMOSBOR-DEBUG] ${setSamosborWarningWindow(state)}`, state.time, '#fa4'));
      break;
    }
    case 66: { // Economy scarcity pulse
      for (const line of applyDebugEconomyPulse(world, player, state)) state.msgs.push(msg(`[ECON-DEBUG] ${line}`, state.time, '#ccf'));
      break;
    }
    case 67: { // Floor-specific monster counterplay pack
      for (const line of spawnDebugMonsterPack(world, player, entities, state, nextEntityId)) {
        state.msgs.push(msg(`[MON-DEBUG] ${line}`, state.time, '#f88'));
      }
      break;
    }
    case 68: { // Route to nearest useful container
      for (const line of routePlayerToNearestContainer(world, player, state)) state.msgs.push(msg(`[CONT-DEBUG] ${line}`, state.time, '#ccf'));
      break;
    }
    case 69: return { type: 'teleport_procedural_anomaly', anomalyId: 'zombie_apocalypse' };
  }
  return null;
}

/* ── Debug overlay rendering (fullscreen two-column) ─────────── */

const ZONE_FACTION_NAMES: Record<ZoneFaction, string> = {
  [ZoneFaction.CITIZEN]: 'Граждане',
  [ZoneFaction.LIQUIDATOR]: 'Ликвидаторы',
  [ZoneFaction.CULTIST]: 'Культисты',
  [ZoneFaction.SAMOSBOR]: 'Самосбор',
  [ZoneFaction.WILD]: 'Дикие',
};

const BASE_CMD_LABELS = [
  'Все оружия + сгустки',
  'Спавн монстров',
  'Спавн NPC',
  'Спавн предметов',
  '1 000 000 XP',
  'Цикл варианта + самосбор',
  'Noclip',
  'Последние события',
  'Цены экономики',
  'Контейнеры рядом',
  'Взять из контейнера',
  'Тик производства',
  'Системное задание: создать/список',
  'Баланс + каталог карманов',
  'Лифтовые инстансы',
  'VOID: форс/список',
  'Фракционные события',
  'Форсировать событие фракции',
  'Форсировать культовую процессию',
  'Директор: состояние',
  'Директор: force beat',
  'Директор: clear cooldown',
  'ТП: Министерство',
  'ТП: Квартиры',
  'ТП: Жилая зона',
  'ТП: Коллекторы',
  'ТП: Мясной низ',
  'ТП: Пустота',
  'ТП: случайный процедурный',
  'Smoke: expedition setup',
  'ВЕРЕТАР: force + самосбор',
  'МАРОНАРИЙ: force + самосбор',
  'Route cue: trigger nearest',
  'МАРОНАРИЙ: wrong door',
  'МАРОНАРИЙ: выдать стружку',
  'ИСТОТИТ: force + самосбор',
  'ТП: говнячный смог',
  'ТП: тихий блок',
  'ТП: хладон',
  'ГОВНЯК: курьерский пакет',
  'ПНЕВМОПОЧТА: капсула',
  'ГЕРМО: точильщик QA',
  'Форсировать стычку ликвидаторов и культа',
  'ONEPUNCHMAN',
  'НЕТ-ГЕН: выдать доступ',
  'НЕТ-ГЕН: расставить терминалы',
  'НЕТ-ГЕН: терминал перед игроком',
  'НЕТ-ГЕН: открыть редактор карты',
  'НЕТ-ГЕН: статус',
  'MAPEDIT: replay current patch',
  'MAPEDIT: clear current patch',
  'ТП: фрактал',
  'ТП: зеркало',
  'ТП: радио-шахматы',
  'ТП: цементная память',
  'ТП: конвейер',
  'ТП: змейка',
  'ТП: секционный сдвиг',
  'ТП: игра жизнь',
  'ТП: поезда',
  'BAD APPLE: экран рядом',
  'VERIFY: контрактный маршрут',
  'VERIFY: событие в лог/слух',
  'VERIFY: окно лифтового маршрута',
  'VERIFY: номерная петля лифта',
  'VERIFY: окно предупреждения самосбора',
  'VERIFY: дефицит экономики',
  'VERIFY: монстры этажа',
  'VERIFY: маршрут к контейнеру',
  'ТП: зомби-апокалипсис',
];

const DESIGN_FLOOR_COMMAND_START = BASE_CMD_LABELS.length;
const CMD_LABELS = [
  ...BASE_CMD_LABELS,
  ...DESIGN_FLOOR_ROUTES.map(def => `ТП: ${def.displayName} (${def.z > 0 ? `+${def.z}` : def.z})`),
];

export const DEBUG_COMMAND_COUNT = CMD_LABELS.length;

export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  w: number, h: number,
  world: World,
  entities: Entity[],
  state: GameState,
  debugSel: number,
): void {
  const uiScale = Math.max(0.8, Math.min(4.2, Math.min(sx, sy)));
  sx = uiScale;
  sy = uiScale;

  /* ── Gather stats ─────────────────────────────────────────── */
  let totalAlive = 0;
  let totalItems = 0;
  // Count all living entities (NPC + monsters) by faction
  // Monsters get their own "faction" slot = 99
  const MONSTER_SLOT = 99;
  const factionCount: Record<number, number> = {};

  for (const e of entities) {
    if (!e.alive) continue;
    if (e.type === EntityType.NPC) {
      totalAlive++;
      factionCount[e.faction ?? -1] = (factionCount[e.faction ?? -1] || 0) + 1;
    } else if (e.type === EntityType.MONSTER) {
      totalAlive++;
      factionCount[MONSTER_SLOT] = (factionCount[MONSTER_SLOT] || 0) + 1;
    } else if (e.type === EntityType.ITEM_DROP) {
      totalItems++;
    }
  }

  // Zone cells per faction
  const zoneFactionCells: Record<number, number> = {};
  for (let i = 0; i < W * W; i++) {
    const zi = world.zoneMap[i];
    if (zi >= 0 && zi < world.zones.length) {
      const f = world.zones[zi].faction;
      zoneFactionCells[f] = (zoneFactionCells[f] || 0) + 1;
    }
  }

  let funcRooms = 0;
  for (const r of world.rooms) if (r.type !== RoomType.CORRIDOR) funcRooms++;
  let lifts = 0, liftsUp = 0, liftsDown = 0;
  for (let i = 0; i < W * W; i++) if (world.cells[i] === Cell.LIFT) {
    lifts++;
    if (world.liftDir[i] === LiftDirection.UP) liftsUp++; else liftsDown++;
  }

  /* ── Layout ───────────────────────────────────────────────── */
  const fs = Math.round(7 * sy);
  const lh = Math.round(10 * sy);
  const pad = 12 * sx;
  const margin = 6 * sx;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 1 * sx;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  ctx.font = `${fs}px monospace`;
  ctx.textBaseline = 'top';

  // Divider at 55% width
  const divX = Math.round(w * 0.55);
  ctx.strokeStyle = 'rgba(255,255,0,0.2)';
  ctx.beginPath();
  ctx.moveTo(divX, margin);
  ctx.lineTo(divX, h - margin);
  ctx.stroke();

  /* ── Left column ──────────────────────────────────────────── */
  const lx = margin + pad;
  let y = margin + pad;
  const leftMaxW = Math.max(20 * sx, divX - lx - pad);
  const row = (t: string, c: string) => {
    ctx.fillStyle = c;
    ctx.fillText(fitText(ctx, t, leftMaxW), lx, y);
    y += lh;
  };
  const gap = () => { y += lh * 0.4; };

  ctx.save();
  ctx.beginPath();
  ctx.rect(margin + 1 * sx, margin + 1 * sy, Math.max(1, divX - margin - 2 * sx), Math.max(lh, h - margin * 2 - 2 * sy));
  ctx.clip();

  row(`Существа: ${totalAlive}  Предметы: ${totalItems}`, '#aaa');
  row(`Комнаты: ${funcRooms}  Лифты: ${lifts} (↑${liftsUp} ↓${liftsDown})`, '#aaa');
  row(`Noclip: ${isDebugNoClipEnabled() ? 'ON' : 'OFF'}`, isDebugNoClipEnabled() ? '#ff0' : '#666');
  row(`ONEPUNCHMAN: ${isDebugOnePunchManEnabled() ? 'ON' : 'OFF'}`, isDebugOnePunchManEnabled() ? '#ff0' : '#666');
  for (const line of summarizeFloorRun(state).slice(0, 2)) row(`Этажи: ${line}`, '#8cf');
  for (const line of summarizeProceduralSmog(world, state).slice(0, 2)) row(`Смог: ${line}`, '#b98');
  for (const line of summarizeBadAppleWorld(world).slice(0, 2)) row(`BadApple: ${line}`, '#eee');
  for (const line of summarizeFloorInstances(state).slice(0, 2)) row(`Лифт: ${line}`, '#f4a');
  for (const line of getSamosborDebugLines()) row(line, '#9cf');
  gap();

  // All factions — unified: NPC factions + monsters
  row('Фракции', '#ff0');
  for (let f = 0; f <= 4; f++) {
    const name = FACTION_NAMES[f as Faction] ?? `#${f}`;
    row(`  ${name}: ${factionCount[f] || 0}`, '#bbb');
  }
  row(`  Монстры: ${factionCount[MONSTER_SLOT] || 0}`, '#c66');
  gap();

  // Territory
  row('Территория', '#ff0');
  const zfOrder = [ZoneFaction.CITIZEN, ZoneFaction.LIQUIDATOR, ZoneFaction.CULTIST, ZoneFaction.WILD, ZoneFaction.SAMOSBOR];
  for (const zf of zfOrder) {
    row(`  ${ZONE_FACTION_NAMES[zf]}: ${zoneFactionCells[zf] || 0}`, '#bbb');
  }
  ctx.restore();

  /* ── Right column: commands ───────────────────────────────── */
  const rx = divX + pad;
  const commandTop = margin + pad;
  const hintY = h - margin - pad - lh * 2;
  const visibleRows = Math.max(1, Math.floor((hintY - commandTop - lh * 0.5) / lh));
  const maxStart = Math.max(0, CMD_LABELS.length - visibleRows);
  const scrollStart = Math.min(maxStart, Math.max(0, debugSel - Math.floor(visibleRows * 0.5)));
  const scrollEnd = Math.min(CMD_LABELS.length, scrollStart + visibleRows);
  let ry = commandTop;

  ctx.save();
  ctx.beginPath();
  ctx.rect(divX + 2 * sx, commandTop - sy, w - divX - margin - 4 * sx, Math.max(lh, hintY - commandTop));
  ctx.clip();

  for (let i = scrollStart; i < scrollEnd; i++) {
    const sel = i === debugSel;
    const label = fitText(ctx, `${sel ? '▸' : ' '} ${i + 1}. ${CMD_LABELS[i]}`, w - rx - margin - 12 * sx);
    if (sel) {
      ctx.fillStyle = 'rgba(255,255,0,0.12)';
      ctx.fillRect(divX + 2 * sx, ry - 1 * sy, w - divX - margin - 4 * sx, lh);
      ctx.fillStyle = '#ff0';
      ctx.fillText(label, rx, ry);
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fillText(label, rx, ry);
    }
    ry += lh;
  }
  ctx.restore();

  if (CMD_LABELS.length > visibleRows) {
    const trackX = w - margin - 6 * sx;
    const trackY = commandTop;
    const trackH = Math.max(lh, hintY - commandTop);
    const thumbH = Math.max(lh, trackH * (visibleRows / CMD_LABELS.length));
    const thumbY = trackY + (trackH - thumbH) * (scrollStart / Math.max(1, maxStart));
    ctx.fillStyle = 'rgba(255,255,0,0.14)';
    ctx.fillRect(trackX, trackY, 2 * sx, trackH);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(trackX, thumbY, 2 * sx, thumbH);
  }

  // Hints pinned to bottom-right
  ry = hintY + lh * 0.6;
  ctx.fillStyle = '#555';
  const range = CMD_LABELS.length > visibleRows ? ` ${scrollStart + 1}-${scrollEnd}/${CMD_LABELS.length}` : '';
  ctx.fillText(fitText(ctx, `↑↓/W/S${range}  E выбрать  ~ закрыть`, w - rx - margin), rx, ry);
}

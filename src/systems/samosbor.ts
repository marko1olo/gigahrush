/* ── САМОСБОР — the maze restructures itself ─────────────────── */
/*   Apartments (жилые) are INVARIANT. Everything else is        */
/*   destroyed and regenerated. Hide in жилая or die.            */

import {
  W, Cell, DoorState, ZoneFaction, FloorLevel, Tex, Feature, ContainerKind, Faction,
  type Entity, type GameState, type Msg, type Room, type WorldContainer, type WorldEventType,
  EntityType, AIGoal, MonsterKind,
  msg,
} from '../core/types';
import { World, replaceWorldFromGeneration } from '../core/world';
import { ITEMS, NOTES } from '../data/catalog';
import { addFactionRelMutual } from '../data/relations';
import { spawnCount } from '../data/items';
import { chooseFloorMonsterKind } from '../data/monster_ecology';
import { MONSTERS } from '../entities/monster';
import { Spr } from '../render/sprite_index';
import { stampMark, MarkType } from '../render/marks';
import { forceHide } from './ai';
import {
  playIstotitBell,
  playMaronaryPing,
  playMaronarySignal,
  playSamosborAlarm,
  playVeretarSignal,
  setAmbientDroneMode,
  type AmbientDroneMode,
} from './audio';
import { recordPlayerDamage } from './damage';
import { reassignQuestGivers } from './quests';
import { regrowMaze } from '../gen/living';
import { floorLevelDisplayName, generateFloor, nextPostSamosborTimer, type FloorGeneration } from '../gen/floor_manifest';
import { flashSamosborWarningScreens } from '../gen/procedural_screens';
import { rng, pick, weightedPick } from '../gen/shared';
import { scaleMonsterHp, scaleMonsterSpeed, randomRPG } from './rpg';
import { publishEvent } from './events';
import { controlHint } from './controls';
import { ENTITY_MASK_ACTOR, ensureEntityIndex } from './entity_index';
import { getSamosborLocalShelters } from './samosbor_hooks';
import { replaceCellHazards } from './cell_hazards';
import { tickSamosborDirector } from './samosbor_director';
import { ensureRoomContainers } from './containers';
import { replaceRouteCueStateForRebuild } from './route_cues';
import { replaceEmergencyPanelStateForRebuild } from './emergency_panels';
import { changeResourceStock } from './economy';
import { observeRumorEvent } from './rumor';
import { getNpcMemory } from './npc_memory';
import { steerEntityTowardCell, tryAssignPathToCell } from './ai/pathfinding';
import { createMaronaryWrongDoorRemap } from './wrong_door';
import { canSpawnEntityType, entitySpawnSlots } from './entity_limits';
import {
  blocksHermodoorBorerSeal,
  clearHermodoorBorerForRebuild,
  queuePostSamosborHermodoorBorer,
  updateHermodoorBorer,
} from './hermodoor_borer';
import {
  cancelSamosborWave,
  chooseSamosborScale,
  finishSamosborWave,
  getSamosborWaveDebugLines,
  isSamosborWaveActive,
  isSamosborWaveDebugActive,
  startSamosborWave,
  tickSamosborWave,
  type SamosborWaveScale,
} from './samosbor_wave';
import {
  type ActiveSamosborVariant,
  type SamosborAftermathBeatDef,
  chooseSamosborVariant,
  getActiveSamosborVariant,
  clearActiveSamosborVariant,
  getForcedSamosborVariant,
  getLastSamosborVariant,
  getSamosborAftermathBeats,
  getSamosborVariantName,
} from '../data/samosbor_variants';

const SAMOSBOR_DUR_MIN = 12;      // min duration (0.2 game hours = 12 real sec)
const SAMOSBOR_DUR_MAX = 90;      // max duration (1.5 game hours = 90 real sec)
const MONSTERS_PER_SAMOSBOR = 10;
const RANDOM_MAP_MONSTERS_PER_SAMOSBOR = 14;
const FOG_SAMPLES_PER_TICK = 64;  // random cells sampled per tick for fog spread
const FOG_SPAWN_INTERVAL  = 1.0;  // seconds between monster spawns in fog
const SEAL_BEFORE_END = 10;       // seal apartments 10 seconds before samosbor ends
const SAMOSBOR_DIRECTOR_ACTIVE_INTERVAL = 12;
const SAMOSBOR_WARNING_WINDOW = 18;
const SAMOSBOR_WARNING_SCREEN_RADIUS = 42;
const SAMOSBOR_WARNING_SCREEN_CAP = 8;
const SAMOSBOR_WARNING_BARK_RADIUS2 = 28 * 28;
const SAMOSBOR_WARNING_BARK_CAP = 3;
const MARONARY_SOURCE_RADIUS = 34;
const MARONARY_SOURCE_CAP = 3;
const MARONARY_WRONG_DOOR_RADIUS = 24;
const MARONARY_PING_INTERVAL = 4.75;
const MARONARY_GLOW_RADIUS = 2.65;
const MARONARY_GLOW_DAMAGE_PER_SECOND = 3;
const MARONARY_GLOW_INTERVAL = 0.7;
const MARONARY_GLOW_ACTOR_CAP = 8;
const ISTOTIT_SHELTER_SEARCH_RADIUS = 46;
const ISTOTIT_SHELTER_CANDIDATE_CAP = 9;
const ISTOTIT_SUPPLY_TAG = 'istotit_supply';
const ISTOTIT_DECISION_RADIUS2 = 4.5 * 4.5;
const PLAYER_SHELTER_DOOR_CAP = 12;
const UNSHELTERED_FOG_RADIUS = 4;
const UNSHELTERED_FOG_STRENGTH = 155;
const UNSHELTERED_HP_DAMAGE = 4;
const UNSHELTERED_PSI_DAMAGE = 3;
const AFTERMATH_FACTION_CONTROL_CAP = 96;
const FOG_DIRS_X = [1, -1, 0, 0];
const FOG_DIRS_Y = [0, 0, 1, -1];

let samosborSealed = false;       // track whether apartments were sealed this samosbor
let activeSamosborZoneId = -1;
let knownSamosborTime = 0;
let samosborDirectorAccum = 0;
let maronaryPingAccum = 0;
let maronaryGlowAccum = 0;
let maronaryGlowNoticeAt = -Infinity;
let maronaryGlowCells: number[] = [];
let activeSamosborScale: SamosborWaveScale = 'full';
let istotitShelterRoomIds: number[] = [];
let istotitShelterCycle = -1;
let istotitShelterFloor = FloorLevel.LIVING;
let istotitSupplyContainerIds: number[] = [];
let istotitDecisionCycle = -1;
let istotitDecision = '';
let samosborPlayerShelterRoomId = -1;

interface PendingAftermath {
  state: GameState;
  variant: ActiveSamosborVariant;
  floor: FloorLevel;
  zoneId: number;
  x: number;
  y: number;
  samosborCount: number;
  endedAt: number;
  istotitDecision?: string;
}

interface AftermathRuntime {
  lastAt: number;
  runs: number;
}

const aftermathRuntime = new Map<string, AftermathRuntime>();
let pendingAftermath: PendingAftermath | null = null;
let lastAftermathAt = -Infinity;
let lastAftermathBeatIds: string[] = [];
let lastAftermathFloor = FloorLevel.LIVING;
let lastVeretarAreaLeaks = 0;
let lastVeretarAreaLeakAt = -Infinity;
let istotitBellFollowNoticeAt = -Infinity;
let istotitBellResistNoticeAt = -Infinity;

export interface SamosborWarningSnapshot {
  floor: FloorLevel;
  floorName: string;
  zoneId: number;
  zoneX: number;
  zoneY: number;
  variantId: string;
  variantName: string;
  tint: string;
  warningLine: string;
  gameplaySignal: string;
  secondsLeft: number;
  screenCount: number;
  greenSourceCount: number;
  wrongDoorX?: number;
  wrongDoorY?: number;
  shelterRoomIds: readonly number[];
  signals: SamosborWarningSignals;
}

export interface SamosborWarningSignals {
  audioLine: string;
  screenLine: string;
  mapLine: string;
  npcLine: string;
  visualLine: string;
  logLine: string;
  mapCode: string;
  channels: readonly string[];
  channelLines: readonly string[];
}

export interface SamosborCompulsion {
  x: number;
  y: number;
  strength: number;
  distance: number;
}

interface SamosborWarningRuntime {
  cycle: number;
  floor: FloorLevel;
  zoneId: number;
  zoneX: number;
  zoneY: number;
  startedAt: number;
  variant: ActiveSamosborVariant;
  warningLine: string;
  screenCount: number;
  greenSourceCount: number;
  wrongDoorIdx: number;
  signals: SamosborWarningSignals;
}

let samosborWarning: SamosborWarningRuntime | null = null;

function clearMaronaryGlowRuntime(): void {
  maronaryGlowAccum = 0;
  maronaryGlowNoticeAt = -Infinity;
  maronaryGlowCells = [];
}

function clearIstotitShelters(): void {
  istotitShelterRoomIds = [];
  istotitShelterCycle = -1;
  istotitSupplyContainerIds = [];
}

function clearSamosborWarning(clearVariant: boolean, resetDrone = true): void {
  samosborWarning = null;
  if (resetDrone) setAmbientDroneMode('normal');
  if (clearVariant) {
    clearActiveSamosborVariant();
    clearIstotitShelters();
    clearMaronaryGlowRuntime();
  }
}

export function resetSamosborRuntimeForTests(): void {
  samosborSealed = false;
  activeSamosborZoneId = -1;
  knownSamosborTime = 0;
  samosborDirectorAccum = 0;
  maronaryPingAccum = 0;
  clearMaronaryGlowRuntime();
  samosborPlayerShelterRoomId = -1;
  pendingAftermath = null;
  lastAftermathAt = -Infinity;
  lastAftermathBeatIds = [];
  lastAftermathFloor = FloorLevel.LIVING;
  lastVeretarAreaLeaks = 0;
  lastVeretarAreaLeakAt = -Infinity;
  istotitBellFollowNoticeAt = -Infinity;
  istotitBellResistNoticeAt = -Infinity;
  fogSpawnAccum = 0;
  activeSamosborScale = 'full';
  cancelSamosborWave();
  aftermathRuntime.clear();
  clearSamosborWarning(true);
  istotitDecisionCycle = -1;
  istotitDecision = '';
  for (const shelter of getSamosborLocalShelters()) shelter.clear?.();
}

function isIstotit(variant: ActiveSamosborVariant): boolean {
  return variant.def.id === 'istotit';
}

function nearestSamosborShelterCenter(world: World, player: Entity, roomIds: readonly number[]): { x: number; y: number; dist2: number } | null {
  let best: { x: number; y: number; dist2: number } | null = null;
  for (const roomId of roomIds) {
    const room = world.rooms[roomId];
    if (!room) continue;
    const x = world.wrap(room.x + Math.floor(room.w / 2)) + 0.5;
    const y = world.wrap(room.y + Math.floor(room.h / 2)) + 0.5;
    const dist2 = world.dist2(player.x, player.y, x, y);
    if (!best || dist2 < best.dist2) best = { x, y, dist2 };
  }
  return best;
}

export function updateIstotitBellCompulsion(
  world: World,
  state: GameState,
  player: Entity,
  resisting: boolean,
): SamosborCompulsion | null {
  const variant = getActiveSamosborVariant();
  if (!state.samosborActive || !variant || !isIstotit(variant)) return null;
  const room = world.roomAt(player.x, player.y);
  const shelterRoomIds = getSamosborShelterRoomIds(state);
  if (room && shelterRoomIds.includes(room.id)) return null;

  const shelter = nearestSamosborShelterCenter(world, player, shelterRoomIds);
  const zone = activeSamosborZoneId >= 0 ? world.zones[activeSamosborZoneId] : undefined;
  const tx = shelter?.x ?? (zone ? zone.cx + 0.5 : W / 2 + 0.5);
  const ty = shelter?.y ?? (zone ? zone.cy + 0.5 : W / 2 + 0.5);
  const dx = world.delta(player.x, tx);
  const dy = world.delta(player.y, ty);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1.25) return null;

  if (resisting) {
    if (state.time >= istotitBellResistNoticeAt + 3.5) {
      istotitBellResistNoticeAt = state.time;
      state.msgs.push(msg('Вы держите шаг против колокола. Отпустите - ноги снова пойдут к жёлтому контуру.', state.time, '#d6a64b'));
    }
    return null;
  }

  const steering = steerEntityTowardCell(world, player, Math.floor(tx), Math.floor(ty));
  if (!steering) return null;

  if (state.time >= istotitBellFollowNoticeAt + 5) {
    istotitBellFollowNoticeAt = state.time;
    state.msgs.push(msg(`Колокол ставит шаг за вас. Удерживайте ${controlHint('interact')}, чтобы сопротивляться.`, state.time, '#d6a64b'));
  }
  return { x: steering.x, y: steering.y, strength: 0.52, distance: dist };
}

function isMaronary(variant: ActiveSamosborVariant): boolean {
  return variant.def.id === 'maronary';
}

function isVeretar(variant: ActiveSamosborVariant): boolean {
  return variant.def.id === 'veretar';
}

function hasPreparedHermeticSeal(world: World, room: Room): boolean {
  if (room.doors.length === 0 || room.doors.length > PLAYER_SHELTER_DOOR_CAP) return false;
  let hermeticDoors = 0;
  for (const di of room.doors) {
    const door = world.doors.get(di);
    if (!door || door.state !== DoorState.HERMETIC_CLOSED) return false;
    hermeticDoors++;
  }
  return hermeticDoors > 0;
}

function trySealPreparedPlayerRoom(world: World, state: GameState, room: Room | null): Room | null {
  if (!room || room.sealed || !hasPreparedHermeticSeal(world, room)) return room;
  let blocked = false;
  for (const di of room.doors) {
    if (blocksHermodoorBorerSeal(world, state, di, room.id)) blocked = true;
  }
  if (blocked) {
    room.sealed = false;
    return room;
  }
  room.sealed = true;
  return room;
}

function findNearbyDoorIdx(world: World, cx: number, cy: number, radius: number): number {
  const r2 = radius * radius;
  let bestIdx = -1;
  let bestD2 = Infinity;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = world.wrap(cx + dx);
      const y = world.wrap(cy + dy);
      const ci = world.idx(x, y);
      if (world.cells[ci] !== Cell.DOOR || !world.doors.has(ci)) continue;
      const d2 = world.dist2(cx + 0.5, cy + 0.5, x + 0.5, y + 0.5);
      if (d2 < bestD2) {
        bestD2 = d2;
        bestIdx = ci;
      }
    }
  }
  return bestIdx;
}

function seedUnshelteredFog(world: World, x: number, y: number): number {
  const r2 = UNSHELTERED_FOG_RADIUS * UNSHELTERED_FOG_RADIUS;
  let changed = 0;
  for (let dy = -UNSHELTERED_FOG_RADIUS; dy <= UNSHELTERED_FOG_RADIUS; dy++) {
    for (let dx = -UNSHELTERED_FOG_RADIUS; dx <= UNSHELTERED_FOG_RADIUS; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const wx = world.wrap(x + dx);
      const wy = world.wrap(y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) continue;
      if (world.aptMask[ci] && world.fog[ci] >= 80) continue;
      if (world.fog[ci] >= UNSHELTERED_FOG_STRENGTH) continue;
      world.fog[ci] = UNSHELTERED_FOG_STRENGTH;
      changed++;
    }
  }
  if (changed > 0) world.markFogDirty();
  return changed;
}

function applyUnshelteredPressure(player: Entity, state: GameState, detail: string): { hpDamage: number; psiDamage: number } {
  let hpDamage = 0;
  let psiDamage = 0;
  if (player.hp !== undefined) {
    const before = player.hp;
    player.hp = Math.max(1, player.hp - UNSHELTERED_HP_DAMAGE);
    hpDamage = before - player.hp;
    if (hpDamage > 0) {
      state.dmgFlash = Math.max(state.dmgFlash, 0.3);
      state.dmgSeed = (state.dmgSeed + 23) | 0;
      recordPlayerDamage(state, undefined, hpDamage, `${detail}: -${hpDamage}`, 'samosbor');
    }
  }
  if (player.rpg) {
    const beforePsi = player.rpg.psi;
    player.rpg.psi = Math.max(0, player.rpg.psi - UNSHELTERED_PSI_DAMAGE);
    psiDamage = beforePsi - player.rpg.psi;
  }
  return { hpDamage, psiDamage };
}

function resolvePlayerShelterAtSeal(
  world: World,
  entities: Entity[],
  state: GameState,
  variant: ActiveSamosborVariant,
): void {
  const player = findPlayer(entities);
  if (!player) return;

  const px = world.wrap(Math.floor(player.x));
  const py = world.wrap(Math.floor(player.y));
  const ci = world.idx(px, py);
  const room = trySealPreparedPlayerRoom(world, state, world.roomAt(player.x, player.y));
  const zoneId = world.zoneMap[ci];
  const nearestDoorIdx = room && room.doors.length > 0
    ? room.doors[0]
    : findNearbyDoorIdx(world, px, py, 5);

  if (room?.sealed) {
    samosborPlayerShelterRoomId = room.id;
    state.msgs.push(msg(`Укрытие принято: ${room.name}. Гермодверь держит.`, state.time, variant.def.tint));
    publishEvent(state, {
      type: 'door_sealed',
      zoneId,
      roomId: room.id,
      x: nearestDoorIdx >= 0 ? nearestDoorIdx % W : px,
      y: nearestDoorIdx >= 0 ? (nearestDoorIdx / W) | 0 : py,
      actorId: player.id,
      actorName: player.name ?? 'Вы',
      actorFaction: player.faction,
      targetName: 'Гермодверь',
      severity: 3,
      privacy: 'local',
      tags: ['samosbor', 'shelter', 'success', 'prepared', `samosbor_${variant.def.id}`],
      data: {
        outcome: 'prepared_shelter',
        roomName: room.name,
        roomId: room.id,
        doorCount: Math.min(room.doors.length, PLAYER_SHELTER_DOOR_CAP),
        samosborCount: state.samosborCount,
        variantId: variant.def.id,
        prepared: hasPreparedHermeticSeal(world, room),
      },
    });
    return;
  }

  const fogCells = seedUnshelteredFog(world, px, py);
  const pressure = applyUnshelteredPressure(player, state, `${variant.def.displayName}: вне рабочей гермы`);
  state.msgs.push(msg('Вы остались снаружи рабочей гермы. Через щель пошёл туман; стало больно дышать.', state.time, '#f66'));
  publishEvent(state, {
    type: 'samosbor_warning',
    zoneId,
    roomId: room?.id,
    x: px,
    y: py,
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    severity: 4,
    privacy: 'local',
    tags: ['samosbor', 'shelter', 'failure', 'unprepared', `samosbor_${variant.def.id}`],
    data: {
      outcome: 'unprepared_shelter',
      warning: 'Укрытие сорвано: игрок остался вне рабочей гермы.',
      roomName: room?.name,
      roomId: room?.id,
      nearestDoorIdx: nearestDoorIdx >= 0 ? nearestDoorIdx : undefined,
      nearestDoorState: nearestDoorIdx >= 0 ? world.doors.get(nearestDoorIdx)?.state : undefined,
      fogCells,
      hpDamage: pressure.hpDamage,
      psiDamage: pressure.psiDamage,
      samosborCount: state.samosborCount,
      variantId: variant.def.id,
    },
  });
}

export function resolvePlayerShelterAtSealForTests(
  world: World,
  entities: Entity[],
  state: GameState,
  variant: ActiveSamosborVariant,
): void {
  resolvePlayerShelterAtSeal(world, entities, state, variant);
}

function samosborEventTags(
  variant: ActiveSamosborVariant,
  base: string[],
  wrongDoor = false,
): string[] {
  const tags = [...base, `samosbor_${variant.def.id}`];
  if (variant.noSiren) tags.push('no_siren');
  if (isMaronary(variant)) {
    tags.push('green_source');
    if (wrongDoor) tags.push('wrong_door');
  }
  if (isVeretar(variant)) tags.push('white_area', 'area_leak');
  return tags;
}

function istotitSheltersMatch(state?: GameState): boolean {
  if (istotitShelterRoomIds.length === 0) return false;
  if (!state) return true;
  if (state.currentFloor !== istotitShelterFloor) return false;
  if (state.samosborActive) return state.samosborCount === istotitShelterCycle;
  return state.samosborCount === istotitShelterCycle || state.samosborCount + 1 === istotitShelterCycle;
}

function activeIstotitDecision(state: GameState): string | undefined {
  return istotitDecisionCycle === state.samosborCount ? istotitDecision || undefined : undefined;
}

function mergeRoomIds(ids: readonly number[], more: readonly number[]): number[] {
  const out = [...ids];
  for (const id of more) if (!out.includes(id)) out.push(id);
  return out;
}

function prepareLocalSamosborShelters(
  world: World,
  entities: Entity[],
  state: GameState,
  variant: ActiveSamosborVariant,
  zoneId: number,
  zoneX: number,
  zoneY: number,
): readonly number[] {
  let roomIds: readonly number[] = [];
  for (const shelter of getSamosborLocalShelters()) {
    const prepared = shelter.prepare?.({ world, entities, state, variant, zoneId, zoneX, zoneY }) ?? [];
    if (prepared.length > 0) roomIds = mergeRoomIds(roomIds, prepared);
  }
  return roomIds;
}

function getLocalSamosborShelterRoomIds(state?: GameState): readonly number[] {
  let roomIds: readonly number[] = [];
  for (const shelter of getSamosborLocalShelters()) {
    const ids = shelter.getRoomIds?.(state) ?? [];
    if (ids.length > 0) roomIds = mergeRoomIds(roomIds, ids);
  }
  return roomIds;
}

function notifyLocalSamosborShelterEnd(
  world: World,
  entities: Entity[],
  state: GameState,
  nextId: { v: number },
  variant: ActiveSamosborVariant | null,
): void {
  for (const shelter of getSamosborLocalShelters()) {
    shelter.onEnd?.({ world, entities, state, nextId, variant });
  }
}

function clearLocalSamosborShelters(state?: GameState): void {
  for (const shelter of getSamosborLocalShelters()) shelter.clear?.(state);
}

function getLocalSamosborShelterDebugLines(): string[] {
  const lines: string[] = [];
  for (const shelter of getSamosborLocalShelters()) {
    const line = shelter.debugLine?.();
    if (line) lines.push(line);
  }
  return lines;
}

export function getSamosborShelterRoomIds(state?: GameState): readonly number[] {
  const istotitRooms = istotitSheltersMatch(state) ? istotitShelterRoomIds : [];
  const localRooms = getLocalSamosborShelterRoomIds(state);
  if (localRooms.length === 0) return istotitRooms;
  if (istotitRooms.length === 0) return localRooms;
  return mergeRoomIds(istotitRooms, localRooms);
}

export function getSamosborWarningSnapshot(state?: GameState): SamosborWarningSnapshot | null {
  if (!samosborWarning) return null;
  if (state) {
    if (state.samosborActive) return null;
    if (state.currentFloor !== samosborWarning.floor) return null;
    if (state.samosborCount !== samosborWarning.cycle) return null;
    if (state.samosborTimer > SAMOSBOR_WARNING_WINDOW + 0.5) return null;
  }
  const secondsLeft = state
    ? Math.max(0, Math.ceil(state.samosborTimer))
    : Math.max(0, Math.ceil(SAMOSBOR_WARNING_WINDOW - (knownSamosborTime - samosborWarning.startedAt)));
  return {
    floor: samosborWarning.floor,
    floorName: floorLevelDisplayName(samosborWarning.floor),
    zoneId: samosborWarning.zoneId,
    zoneX: samosborWarning.zoneX,
    zoneY: samosborWarning.zoneY,
    variantId: samosborWarning.variant.def.id,
    variantName: samosborWarning.variant.def.displayName,
    tint: samosborWarning.variant.def.tint,
    warningLine: samosborWarning.warningLine,
    gameplaySignal: samosborWarning.variant.def.gameplaySignal,
    secondsLeft,
    screenCount: samosborWarning.screenCount,
    greenSourceCount: samosborWarning.greenSourceCount,
    wrongDoorX: samosborWarning.wrongDoorIdx >= 0 ? samosborWarning.wrongDoorIdx % W : undefined,
    wrongDoorY: samosborWarning.wrongDoorIdx >= 0 ? (samosborWarning.wrongDoorIdx / W) | 0 : undefined,
    shelterRoomIds: getSamosborShelterRoomIds(state),
    signals: samosborWarning.signals,
  };
}

function chooseIstotitShelterRooms(world: World, cx: number, cy: number, count: number): number[] {
  const radius2 = ISTOTIT_SHELTER_SEARCH_RADIUS * ISTOTIT_SHELTER_SEARCH_RADIUS;
  const candidates: { id: number; d2: number }[] = [];
  for (const room of world.rooms) {
    if (!room || room.w < 3 || room.h < 3 || room.doors.length === 0) continue;
    let hasUsableDoor = false;
    for (const di of room.doors) {
      const door = world.doors.get(di);
      if (door && door.state !== DoorState.LOCKED) {
        hasUsableDoor = true;
        break;
      }
    }
    if (!hasUsableDoor) continue;
    const d2 = world.dist2(cx + 0.5, cy + 0.5, room.x + room.w / 2, room.y + room.h / 2);
    if (d2 > radius2) continue;
    candidates.push({ id: room.id, d2 });
  }
  candidates.sort((a, b) => a.d2 - b.d2);
  const pool = candidates.slice(0, ISTOTIT_SHELTER_CANDIDATE_CAP);
  const ids: number[] = [];
  while (ids.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    ids.push(pool.splice(i, 1)[0].id);
  }
  return ids;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) if (container.id >= id) id = container.id + 1;
  return id;
}

function findRoomFloorCell(world: World, roomId: number): { x: number; y: number } | null {
  const room = world.rooms[roomId];
  if (!room) return null;
  const cx = world.wrap(room.x + Math.floor(room.w / 2));
  const cy = world.wrap(room.y + Math.floor(room.h / 2));
  const centerIdx = world.idx(cx, cy);
  if (world.cells[centerIdx] === Cell.FLOOR && world.roomMap[centerIdx] === roomId && world.containersAt(cx, cy).length === 0) {
    return { x: cx, y: cy };
  }
  for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const wx = world.wrap(x);
      const wy = world.wrap(y);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.FLOOR || world.roomMap[ci] !== roomId) continue;
      if (world.containersAt(wx, wy).length > 0) continue;
      return { x: wx, y: wy };
    }
  }
  return null;
}

function addIstotitSupplyContainer(world: World, state: GameState, roomId: number): number {
  if (world.containers.some(c => c.roomId === roomId && c.floor === state.currentFloor && c.tags.includes(ISTOTIT_SUPPLY_TAG))) {
    return 0;
  }
  const pos = findRoomFloorCell(world, roomId);
  const room = world.rooms[roomId];
  if (!pos || !room) return 0;
  const inventory = [
    ITEMS.istotit_candle ? { defId: 'istotit_candle', count: 1 } : null,
    ITEMS.water ? { defId: 'water', count: 1 } : null,
    ITEMS.bread ? { defId: 'bread', count: 1 } : null,
  ].filter((item): item is { defId: string; count: number } => item !== null);
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: pos.x,
    y: pos.y,
    floor: state.currentFloor,
    roomId,
    zoneId: world.zoneMap[world.idx(pos.x, pos.y)],
    kind: ContainerKind.EMERGENCY_BOX,
    name: `Церковный свечной запас: ${room.name}`,
    inventory,
    capacitySlots: 5,
    faction: Faction.CITIZEN,
    access: 'faction',
    discovered: true,
    tags: [ISTOTIT_SUPPLY_TAG, 'istotit', 'church', 'shelter'],
  };
  world.addContainer(container);
  istotitSupplyContainerIds.push(container.id);
  stampMark(world, pos.x, pos.y, 0.5, 0.5, 0.36, MarkType.PSI, 86_000 + container.id, 214, 166, 75, 150);
  return 1;
}

function stampIstotitGoldDust(world: World, x: number, y: number, count: number, seedBase: number): number {
  let stamped = 0;
  for (let i = 0; i < count; i++) {
    const px = world.wrap(x + rng(-2, 2));
    const py = world.wrap(y + rng(-2, 2));
    const ci = world.idx(px, py);
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) continue;
    stampMark(world, px, py, Math.random(), Math.random(), 0.22 + Math.random() * 0.18, MarkType.PSI, seedBase + i * 977, 214, 166, 75, 125);
    stamped++;
  }
  return stamped;
}

function prepareIstotitShelters(world: World, state: GameState, variant: ActiveSamosborVariant, cx: number, cy: number): readonly number[] {
  if (!isIstotit(variant) || variant.shelterRoomCount <= 0) {
    clearIstotitShelters();
    return [];
  }
  const count = Math.max(1, Math.min(3, variant.shelterRoomCount + (Math.random() < 0.35 ? 1 : 0)));
  istotitShelterRoomIds = chooseIstotitShelterRooms(world, cx, cy, count);
  istotitShelterCycle = state.samosborCount + 1;
  istotitShelterFloor = state.currentFloor;
  istotitDecisionCycle = -1;
  istotitDecision = '';
  for (const roomId of istotitShelterRoomIds) {
    const room = world.rooms[roomId];
    if (!room) continue;
    for (const di of room.doors) {
      const door = world.doors.get(di);
      if (!door || door.state === DoorState.LOCKED) continue;
      door.state = DoorState.HERMETIC_OPEN;
      door.timer = Math.max(door.timer, 12);
    }
    addIstotitSupplyContainer(world, state, roomId);
    stampIstotitGoldDust(world, world.wrap(room.x + Math.floor(room.w / 2)), world.wrap(room.y + Math.floor(room.h / 2)), 2, 85_000 + roomId * 31);
  }
  return istotitShelterRoomIds;
}

function isIstotitShelterDoor(world: World, doorIdx: number): boolean {
  const door = world.doors.get(doorIdx);
  if (!door) return false;
  return istotitShelterRoomIds.includes(door.roomA) || istotitShelterRoomIds.includes(door.roomB);
}

function rememberIstotitDecision(state: GameState, kind: string): boolean {
  if (istotitDecisionCycle === state.samosborCount && istotitDecision) return false;
  istotitDecisionCycle = state.samosborCount;
  istotitDecision = kind;
  return true;
}

function publishIstotitDecision(
  world: World,
  player: Entity,
  state: GameState,
  kind: string,
  severity: 2 | 3 | 4 | 5,
  extra: Record<string, unknown> = {},
): void {
  const x = Math.floor(player.x);
  const y = Math.floor(player.y);
  const ci = world.idx(x, y);
  const roomId = world.roomMap[ci];
  publishEvent(state, {
    type: 'samosbor_warning',
    zoneId: world.zoneMap[ci],
    roomId: roomId >= 0 ? roomId : undefined,
    x,
    y,
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    severity,
    privacy: severity >= 4 ? 'local' : 'private',
    tags: ['samosbor', 'istotit', 'decision', kind, 'samosbor_istotit'],
    data: {
      decision: kind,
      shelterRoomIds: istotitShelterRoomIds,
      supplyContainerIds: istotitSupplyContainerIds,
      ...extra,
    },
  });
}

function nearestIstotitNpc(world: World, entities: Entity[], player: Entity, roomId: number): Entity | null {
  let best: Entity | null = null;
  let bestD2 = ISTOTIT_DECISION_RADIUS2;
  let checked = 0;
  for (const e of entities) {
    if (checked++ >= 512) break;
    if (!e.alive || e.type !== EntityType.NPC || e.faction === Faction.WILD) continue;
    const d2 = world.dist2(player.x, player.y, e.x, e.y);
    if (d2 > bestD2) continue;
    const npcRoomId = world.roomMap[world.idx(Math.floor(e.x), Math.floor(e.y))];
    if (npcRoomId === roomId && d2 > 1.2) continue;
    best = e;
    bestD2 = d2;
  }
  return best;
}

function guideNpcToShelter(world: World, npc: Entity, roomId: number): void {
  if (!npc.ai) return;
  const room = world.rooms[roomId];
  if (!room) return;
  const tx = world.wrap(room.x + Math.floor(room.w / 2));
  const ty = world.wrap(room.y + Math.floor(room.h / 2));
  const status = tryAssignPathToCell(world, npc, tx, ty);
  npc.ai.pi = 0;
  npc.ai.tx = tx;
  npc.ai.ty = ty;
  npc.ai.goal = status !== 'not_found' ? AIGoal.FLEE : AIGoal.IDLE;
  npc.ai.timer = 6;
}

function istotitAdmitNpc(world: World, entities: Entity[], player: Entity, state: GameState, roomId: number): boolean {
  if (!rememberIstotitDecision(state, 'admit_npc')) return false;
  const npc = nearestIstotitNpc(world, entities, player, roomId);
  if (!npc) {
    istotitDecisionCycle = -1;
    istotitDecision = '';
    return false;
  }
  guideNpcToShelter(world, npc, roomId);
  if (player.needs) {
    player.needs.water = Math.max(0, player.needs.water - 6);
    player.needs.sleep = Math.max(0, player.needs.sleep - 5);
  }
  if (player.rpg) player.rpg.psi = Math.max(0, player.rpg.psi - 4);
  addFactionRelMutual(Faction.CITIZEN, Faction.PLAYER, 1);
  state.msgs.push(msg(`${npc.name ?? 'Сосед'} вписан в ведомость у жёлтой гермы. Воды и воздуха стало меньше.`, state.time, '#d6a64b'));
  publishIstotitDecision(world, player, state, 'admit_npc', 3, { targetId: npc.id, targetName: npc.name, roomId });
  return true;
}

function istotitShelterAlone(world: World, player: Entity, state: GameState, roomId: number): boolean {
  if (!rememberIstotitDecision(state, 'shelter_alone')) return false;
  const room = world.rooms[roomId];
  if (!room) return false;
  room.sealed = true;
  for (const di of room.doors) {
    const door = world.doors.get(di);
    if (!door || door.state === DoorState.LOCKED) continue;
    door.state = DoorState.HERMETIC_CLOSED;
    door.timer = 0;
  }
  addFactionRelMutual(Faction.CITIZEN, Faction.PLAYER, -1);
  state.msgs.push(msg('Вы закрыли жёлтую герму изнутри. Ведомость оставит пустую строку за тем, кто стучал снаружи.', state.time, '#d6a64b'));
  publishIstotitDecision(world, player, state, 'shelter_alone', 3, { roomId });
  return true;
}

function seedIstotitBacklashFog(world: World, x: number, y: number, radius: number, strength: number): number {
  let changed = 0;
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const wx = world.wrap(x + dx);
      const wy = world.wrap(y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) continue;
      if (world.fog[ci] >= strength) continue;
      world.fog[ci] = strength;
      changed++;
    }
  }
  if (changed > 0) world.markFogDirty();
  return changed;
}

function istotitFollowBell(
  world: World,
  entities: Entity[],
  player: Entity,
  state: GameState,
  nextId: { v: number },
  lookX: number,
  lookY: number,
): boolean {
  if (!rememberIstotitDecision(state, 'follow_bell')) return false;
  const x = world.wrap(Math.floor(lookX));
  const y = world.wrap(Math.floor(lookY));
  const dust = stampIstotitGoldDust(world, x, y, 5, 84_000 + state.samosborCount * 101);
  const fogCells = seedIstotitBacklashFog(world, x, y, 3, 95);
  if (player.hp !== undefined) {
    const before = player.hp;
    player.hp = Math.max(1, player.hp - 6);
    const hpDamage = before - player.hp;
    state.dmgFlash = Math.max(state.dmgFlash, 0.22);
    state.dmgSeed = (state.dmgSeed + 17) | 0;
    if (hpDamage > 0) recordPlayerDamage(state, undefined, hpDamage, `Истотит: пошли на колокол -${hpDamage}`, 'samosbor');
  }
  if (player.rpg) player.rpg.psi = Math.max(0, player.rpg.psi - 8);
  const pos = Math.random() < 0.45 ? findWalkableNear(world, x, y, 4, 9) : null;
  let spawned = 0;
  if (pos && canSpawnEntityType(entities, EntityType.MONSTER)) {
    entities.push(createMonster(world, nextId, MonsterKind.EYE, pos.x + 0.5, pos.y + 0.5, state.currentFloor, true));
    spawned = 1;
  }
  state.msgs.push(msg(
    spawned > 0
      ? 'Вы пошли на колокол. У жёлтой метки открылся глаз; до укрытия теперь придётся пробиваться.'
      : 'Вы пошли на колокол. На полу осталась жёлтая пыль, а путь к герме стал длиннее.',
    state.time,
    '#d6a64b',
  ));
  publishIstotitDecision(world, player, state, 'follow_bell', spawned > 0 ? 5 : 4, { dust, fogCells, spawned });
  return true;
}

function istotitDisruptRite(
  world: World,
  entities: Entity[],
  player: Entity,
  state: GameState,
  nextId: { v: number },
  doorIdx: number,
): boolean {
  if (!rememberIstotitDecision(state, 'disrupt_rite')) return false;
  const door = world.doors.get(doorIdx);
  if (!door) return false;
  door.state = DoorState.HERMETIC_OPEN;
  door.timer = Math.max(door.timer, 4);
  const x = doorIdx % W;
  const y = (doorIdx / W) | 0;
  const fogCells = seedIstotitBacklashFog(world, x, y, 4, 135);
  const pos = findWalkableNear(world, x, y, 3, 7);
  let spawned = 0;
  if (pos && canSpawnEntityType(entities, EntityType.MONSTER)) {
    entities.push(createMonster(world, nextId, MonsterKind.SBORKA, pos.x + 0.5, pos.y + 0.5, state.currentFloor, true));
    spawned = 1;
  }
  addFactionRelMutual(Faction.CITIZEN, Faction.PLAYER, -2);
  state.msgs.push(msg('Вы сорвали церковный порядок. Жёлтая герма открылась, и туман пошёл в комнату с людьми.', state.time, '#f84'));
  publishIstotitDecision(world, player, state, 'disrupt_rite', 5, { doorIdx, fogCells, spawned });
  return true;
}

export function tryUseSamosborVariantInteraction(
  world: World,
  entities: Entity[],
  player: Entity,
  state: GameState,
  nextId: { v: number },
  lookX: number,
  lookY: number,
): boolean {
  const active = getActiveSamosborVariant();
  if (!state.samosborActive || !active) return false;
  for (const shelter of getSamosborLocalShelters()) {
    if (shelter.tryInteract?.({ world, entities, player, state, nextId, variant: active, lookX, lookY })) return true;
  }
  if (!isIstotit(active) || !istotitSheltersMatch(state)) return false;
  const lx = world.wrap(Math.floor(lookX));
  const ly = world.wrap(Math.floor(lookY));
  const lookIdx = world.idx(lx, ly);
  if (world.containersAt(lx, ly).some(c => c.discovered || c.access !== 'secret')) return false;

  const playerRoomId = world.roomMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
  const inShelter = istotitShelterRoomIds.includes(playerRoomId);
  if (!inShelter && world.cells[lookIdx] === Cell.DOOR && isIstotitShelterDoor(world, lookIdx)) {
    return istotitDisruptRite(world, entities, player, state, nextId, lookIdx);
  }
  if (world.cells[lookIdx] === Cell.DOOR || world.cells[lookIdx] === Cell.LIFT) return false;
  if (activeIstotitDecision(state)) return false;

  if (inShelter) {
    if (nearestIstotitNpc(world, entities, player, playerRoomId)) {
      return istotitAdmitNpc(world, entities, player, state, playerRoomId);
    }
    return istotitShelterAlone(world, player, state, playerRoomId);
  }

  return istotitFollowBell(world, entities, player, state, nextId, lookX, lookY);
}

function stampMaronarySourceMark(world: World, ci: number, seed: number, radius = 0.42): void {
  const x = ci % W;
  const y = (ci / W) | 0;
  stampMark(world, x, y, 0.5, 0.5, radius, MarkType.MARONARY, seed, 53, 255, 102, 175, world.cells[ci] === Cell.WALL);
}

function stampMaronarySources(world: World, cx: number, cy: number): number[] {
  const selected: number[] = [];
  const r2 = MARONARY_SOURCE_RADIUS * MARONARY_SOURCE_RADIUS;

  for (const ci of world.screenCells) {
    if (selected.length >= MARONARY_SOURCE_CAP) break;
    const x = ci % W;
    const y = (ci / W) | 0;
    if (world.dist2(cx + 0.5, cy + 0.5, x + 0.5, y + 0.5) > r2) continue;
    selected.push(ci);
  }

  let checkedDoors = 0;
  for (const [di, door] of world.doors) {
    if (selected.length >= MARONARY_SOURCE_CAP || checkedDoors++ >= 384) break;
    if (door.state === DoorState.LOCKED) continue;
    if (world.aptMask[di]) continue;
    const x = di % W;
    const y = (di / W) | 0;
    if (world.dist2(cx + 0.5, cy + 0.5, x + 0.5, y + 0.5) > r2) continue;
    selected.push(di);
  }

  if (selected.length === 0) {
    const pos = findWalkableNear(world, cx, cy, 1, 10);
    if (pos) selected.push(world.idx(pos.x, pos.y));
  }

  for (let i = 0; i < selected.length; i++) {
    stampMaronarySourceMark(world, selected[i], 82_000 + selected[i] + i * 577);
  }
  return selected;
}

function chooseMaronaryWrongDoorClue(world: World, cx: number, cy: number): number {
  let bestIdx = -1;
  let bestD2 = MARONARY_WRONG_DOOR_RADIUS * MARONARY_WRONG_DOOR_RADIUS;
  let checked = 0;
  for (const [di, door] of world.doors) {
    if (checked++ >= 512) break;
    if (door.state === DoorState.LOCKED || world.aptMask[di]) continue;
    const x = di % W;
    const y = (di / W) | 0;
    const d2 = world.dist2(cx + 0.5, cy + 0.5, x + 0.5, y + 0.5);
    if (d2 < bestD2) {
      bestD2 = d2;
      bestIdx = di;
    }
  }
  if (bestIdx >= 0) {
    stampMaronarySourceMark(world, bestIdx, 84_000 + bestIdx, 0.55);
  }
  return bestIdx;
}

function addMaronaryGlowCell(cells: number[], ci: number): void {
  if (ci < 0) return;
  if (!cells.includes(ci)) cells.push(ci);
}

function rememberMaronaryGlowCells(sourceCells: readonly number[], wrongDoorIdx: number): number {
  const next: number[] = [];
  for (const ci of sourceCells) addMaronaryGlowCell(next, ci);
  addMaronaryGlowCell(next, wrongDoorIdx);
  maronaryGlowCells = next;
  maronaryGlowAccum = 0;
  return next.length;
}

function prepareMaronaryWarningClues(
  world: World,
  variant: ActiveSamosborVariant,
  cx: number,
  cy: number,
): { greenSourceCount: number; wrongDoorIdx: number } {
  if (!isMaronary(variant)) return { greenSourceCount: 0, wrongDoorIdx: -1 };
  const sourceCells = stampMaronarySources(world, cx, cy);
  const wrongDoorIdx = chooseMaronaryWrongDoorClue(world, cx, cy);
  const greenSourceCount = rememberMaronaryGlowCells(sourceCells, wrongDoorIdx);
  return {
    greenSourceCount,
    wrongDoorIdx,
  };
}

const maronaryGlowActors: Entity[] = [];

function maronaryGlowSourceCenter(ci: number): { x: number; y: number } {
  return { x: (ci % W) + 0.5, y: ((ci / W) | 0) + 0.5 };
}

function forceMaronaryGlowFlee(world: World, e: Entity, sx: number, sy: number): void {
  if (!e.ai || e.type === EntityType.PLAYER) return;
  const dx = world.delta(sx, e.x);
  const dy = world.delta(sy, e.y);
  const len = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
  e.ai.goal = AIGoal.FLEE;
  e.ai.tx = world.wrap(Math.floor(e.x + dx / len * 8));
  e.ai.ty = world.wrap(Math.floor(e.y + dy / len * 8));
  e.ai.path = [];
  e.ai.pi = 0;
  e.ai.timer = Math.max(e.ai.timer, 1.2);
}

function applyMaronaryGlowDamage(world: World, state: GameState, e: Entity, amount: number, sx: number, sy: number): number {
  if (!e.alive || e.hp === undefined || amount <= 0) return 0;
  const before = e.hp;
  if (e.type === EntityType.PLAYER) {
    e.hp = Math.max(1, e.hp - amount);
  } else {
    e.hp = Math.max(0, e.hp - amount);
    if (e.hp <= 0) {
      e.alive = false;
      e.hp = 0;
    } else {
      forceMaronaryGlowFlee(world, e, sx, sy);
    }
  }
  const actual = before - e.hp;
  if (actual <= 0) return 0;
  if (e.type === EntityType.PLAYER) {
    const maxHp = Math.max(1, e.maxHp ?? 100);
    state.dmgFlash = Math.max(state.dmgFlash, Math.min(1, 0.2 + actual / maxHp));
    state.dmgSeed = (state.dmgSeed + 53) | 0;
    recordPlayerDamage(state, undefined, actual, `Маронарий: зелёное свечение -${actual}`, 'samosbor');
  }
  return actual;
}

function hasDamagedMaronaryGlowActor(ids: readonly number[], id: number): boolean {
  for (const damagedId of ids) if (damagedId === id) return true;
  return false;
}

function tickMaronaryGlowDamage(
  world: World,
  entities: Entity[],
  state: GameState,
  dt: number,
  variant: ActiveSamosborVariant | null,
): void {
  if (!variant || !isMaronary(variant) || maronaryGlowCells.length === 0) {
    maronaryGlowAccum = 0;
    return;
  }

  maronaryGlowAccum += dt;
  if (maronaryGlowAccum < MARONARY_GLOW_INTERVAL) return;
  const elapsed = Math.min(1.5, maronaryGlowAccum);
  maronaryGlowAccum = 0;
  const damage = Math.max(1, Math.round(MARONARY_GLOW_DAMAGE_PER_SECOND * elapsed));
  const damagedIds: number[] = [];
  const player = findPlayer(entities);
  let playerDamage = 0;
  let hitCount = 0;
  let sourceX = 0;
  let sourceY = 0;
  const index = ensureEntityIndex(entities);

  for (const sourceCell of maronaryGlowCells) {
    const source = maronaryGlowSourceCenter(sourceCell);
    sourceX = source.x;
    sourceY = source.y;
    index.queryRadiusCapped(source.x, source.y, MARONARY_GLOW_RADIUS, maronaryGlowActors, ENTITY_MASK_ACTOR, MARONARY_GLOW_ACTOR_CAP);
    if (player && world.dist2(source.x, source.y, player.x, player.y) <= MARONARY_GLOW_RADIUS * MARONARY_GLOW_RADIUS) {
      maronaryGlowActors.push(player);
    }
    for (const e of maronaryGlowActors) {
      if (hasDamagedMaronaryGlowActor(damagedIds, e.id)) continue;
      const actual = applyMaronaryGlowDamage(world, state, e, damage, source.x, source.y);
      if (actual <= 0) continue;
      damagedIds.push(e.id);
      hitCount++;
      if (e.type === EntityType.PLAYER) playerDamage += actual;
    }
  }

  if (playerDamage <= 0 || state.time < maronaryGlowNoticeAt + 2.5) return;
  maronaryGlowNoticeAt = state.time;
  state.msgs.push(msg('Зелёное свечение Маронария жжёт кожу. Отойдите от источника.', state.time, variant.def.tint));
  publishEvent(state, {
    type: 'samosbor_warning',
    x: sourceX,
    y: sourceY,
    actorId: player?.id,
    actorName: player?.name ?? 'Вы',
    actorFaction: player?.faction,
    severity: 4,
    privacy: 'local',
    tags: ['samosbor', 'maronary', 'green_source', 'glow_damage', 'samosbor_maronary'],
    data: {
      damage: playerDamage,
      hitCount,
      sourceCells: maronaryGlowCells.length,
      radius: MARONARY_GLOW_RADIUS,
    },
  });
}

export function setMaronaryGlowCellsForTests(cells: readonly number[]): void {
  maronaryGlowCells = [...cells];
  maronaryGlowAccum = 0;
}

export function tickMaronaryGlowDamageForTests(
  world: World,
  entities: Entity[],
  state: GameState,
  dt: number,
  variant: ActiveSamosborVariant | null,
): void {
  tickMaronaryGlowDamage(world, entities, state, dt, variant);
}

function chooseWarningZone(world: World, entities: Entity[]): { id: number; cx: number; cy: number } {
  const player = findPlayer(entities);
  if (player) {
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);
    const playerZoneId = world.zoneMap[world.idx(px, py)];
    const playerZone = world.zones[playerZoneId];
    if (playerZone && playerZone.faction !== ZoneFaction.SAMOSBOR) {
      return { id: playerZone.id, cx: playerZone.cx, cy: playerZone.cy };
    }

    let best = playerZone;
    let bestD2 = Infinity;
    for (const zone of world.zones) {
      if (!zone || zone.faction === ZoneFaction.SAMOSBOR) continue;
      const d2 = world.dist2(player.x, player.y, zone.cx + 0.5, zone.cy + 0.5);
      if (d2 < bestD2) {
        best = zone;
        bestD2 = d2;
      }
    }
    if (best) return { id: best.id, cx: best.cx, cy: best.cy };
  }

  for (const zone of world.zones) {
    if (zone && zone.faction !== ZoneFaction.SAMOSBOR) return { id: zone.id, cx: zone.cx, cy: zone.cy };
  }
  return { id: -1, cx: W >> 1, cy: W >> 1 };
}

function warningActionLine(zoneId: number, seconds: number, variant: ActiveSamosborVariant): string {
  const zoneText = zoneId >= 0 ? `зона ${zoneId + 1}` : 'локальная зона';
  if (isIstotit(variant)) return `ИСТОТИТ через ${seconds}с: ${zoneText}. К жёлтой герме. Внутри решайте: впустить соседа или закрыться одному.`;
  if (isMaronary(variant)) return `МАРОНАРИЙ через ${seconds}с: ${zoneText}. Не смотри в зелёный источник, сверяй номер двери.`;
  if (isVeretar(variant)) return `ВЕРЕТАР через ${seconds}с: ${zoneText}. От белого окна, к тёмной герме или за границу зоны.`;
  if (variant.def.id === 'quiet') return `ТИХИЙ САМОСБОР через ${seconds}с: ${zoneText}. Сирены может не быть; сверяй карту, табло и соседей.`;
  if (variant.def.id === 'wet') return `МОКРЫЙ САМОСБОР через ${seconds}с: ${zoneText}. С воды к сухой герме или выше по полу.`;
  if (variant.def.id === 'electric') return `ЭЛЕКТРОСБОР через ${seconds}с: ${zoneText}. Уйди от ламп, закрывайся раньше.`;
  if (variant.def.id === 'meat') return `МЯСНОЙ САМОСБОР через ${seconds}с: ${zoneText}. От швов в центр прохода или из зоны.`;
  return `САМОСБОР через ${seconds}с: ${zoneText}. К герме, за границу зоны или закрыться заранее.`;
}

function warningMapCode(variant: ActiveSamosborVariant): string {
  switch (variant.def.id) {
    case 'quiet': return 'ТИХ';
    case 'wet': return 'ВОД';
    case 'electric': return 'ЭЛК';
    case 'meat': return 'МЯС';
    case 'maronary': return 'МАР';
    case 'istotit': return 'ИСТ';
    case 'veretar': return 'ВЕР';
    default: return 'СБОР';
  }
}

function warningAudioLine(variant: ActiveSamosborVariant): string {
  if (variant.def.audioCue === 'bell') return 'звук: низкий колокол вместо сирены';
  if (variant.def.audioCue === 'beep') return 'звук: высокий писк; не идти на источник';
  if (variant.def.audioCue === 'distant_alarm') return 'звук: внешняя тревога за белым окном';
  if (variant.def.audioCue === 'siren') return 'звук: штатная сирена';
  if (variant.noSiren) return 'звук: штатной сирены нет';
  return 'звук: штатная сирена';
}

function ambientDroneModeForVariant(variant: ActiveSamosborVariant): AmbientDroneMode {
  if (variant.def.audioCue === 'bell') return 'istotit';
  if (variant.def.audioCue === 'beep') return 'maronary';
  if (variant.def.audioCue === 'distant_alarm') return 'veretar';
  return variant.noSiren ? 'samosbor' : 'samosbor';
}

function warningMapLine(
  variant: ActiveSamosborVariant,
  wrongDoorIdx: number,
  shelterCount: number,
): string {
  if (isMaronary(variant) && wrongDoorIdx >= 0) return 'карта: повтор двери; зелёное свечение жжёт';
  if (isMaronary(variant)) return 'карта: зелёный источник жжёт; держаться в стороне';
  if (isIstotit(variant) && shelterCount > 0) return `карта: жёлтые укрытия ${shelterCount}; мест мало, список короткий`;
  if (isVeretar(variant)) return 'карта: белое пятно вместо комнаты';
  if (variant.def.id === 'quiet') return 'карта: сирены может не быть; сверить табло';
  return 'карта: зона риска отмечена; выйти или закрыться';
}

function buildWarningSignals(
  variant: ActiveSamosborVariant,
  screenCount: number,
  barkCount: number,
  wrongDoorIdx: number,
  shelterCount: number,
): SamosborWarningSignals {
  const audioLine = warningAudioLine(variant);
  const screenLine = screenCount > 0
    ? `экраны: ${screenCount} табло мигают; проверь ближайшее`
    : 'экраны: рядом нет табло';
  const mapLine = warningMapLine(variant, wrongDoorIdx, shelterCount);
  const npcLine = barkCount > 0
    ? `соседи: ${barkCount} предупреждения; слушай короткие команды`
    : 'соседи: никого рядом';
  const visualLine = screenCount > 0
    ? `визуал: ${screenCount} табло; ${mapLine}`
    : `визуал: ${mapLine}`;
  const channels = ['hud', 'log', 'map'];
  if (screenCount > 0) channels.push('screens');
  if (barkCount > 0) channels.push('npc_barks');
  if (!variant.noSiren || variant.def.audioCue) channels.push('audio');
  return {
    audioLine,
    screenLine,
    mapLine,
    npcLine,
    visualLine,
    logLine: `Предупреждение принято: ${audioLine}; ${visualLine}; ${npcLine}. Решение: герма, граница зоны или раннее закрытие.`,
    mapCode: warningMapCode(variant),
    channels,
    channelLines: [audioLine, visualLine, npcLine],
  };
}

function playVariantWarningCue(variant: ActiveSamosborVariant): void {
  setAmbientDroneMode(ambientDroneModeForVariant(variant));
  if (variant.def.audioCue === 'bell') {
    playIstotitBell();
    return;
  }
  if (variant.def.audioCue === 'beep') {
    playMaronarySignal();
    return;
  }
  if (variant.def.audioCue === 'distant_alarm') {
    playVeretarSignal();
    return;
  }
  if (variant.def.audioCue === 'siren' || !variant.noSiren) playSamosborAlarm();
}

function warningBarkForVariant(variant: ActiveSamosborVariant, isFemale: boolean): string {
  switch (variant.def.id) {
    case 'istotit':
      return isFemale
        ? 'Колокола слышишь? К жёлтой герме. Внутри решай: впустить соседа или закрыться одной!'
        : 'Сирена сорвалась в колокола. В укрытие, чужим голосам не отвечай!';
    case 'maronary':
      return isFemale
        ? 'Писк слышишь? Не смотри в зелёное, номер двери проверь!'
        : 'Зелёный источник не трогай взглядом. Дверь сверяй по карте!';
    case 'veretar':
      return isFemale
        ? 'Занавеску держи двумя руками. Там не наш двор!'
        : 'Белое окно не двор. Оттащи свидетеля и к тёмной герме!';
    case 'quiet':
      return isFemale
        ? 'Тихо стало неправильно. Табло, карта, герма - сейчас!'
        : 'Не жди сирену. Тишина уже предупреждает, к герме!';
    case 'wet':
      return isFemale
        ? 'Вода пошла по полу. Не стой в низине, к сухой двери!'
        : 'Мокрый сбор идёт. С пола уходи, дверь закрывай раньше!';
    case 'electric':
      return isFemale
        ? 'Свет моргает. От ламп к герме, пока привод живой!'
        : 'Озон чувствуешь? Не смотри на лампы, к двери!';
    case 'meat':
      return isFemale
        ? 'Стены пахнут мясом. Тихой комнате не верь!'
        : 'Мясо в стенах пошло. Не стой где тепло, беги из зоны!';
    default:
      return isFemale
        ? 'Слышишь? К герме, пока уплотнитель держит!'
        : 'Сирена пошла. Ноги к герме, голову вниз!';
  }
}

function pushWarningBarks(
  world: World,
  entities: Entity[],
  state: GameState,
  variant: ActiveSamosborVariant,
  zoneX: number,
  zoneY: number,
): number {
  let barked = 0;
  let checked = 0;
  for (const e of entities) {
    if (barked >= SAMOSBOR_WARNING_BARK_CAP || checked >= 512) break;
    checked++;
    if (!e.alive || e.type !== EntityType.NPC || !e.name) continue;
    if (world.dist2(zoneX + 0.5, zoneY + 0.5, e.x, e.y) > SAMOSBOR_WARNING_BARK_RADIUS2) continue;
    const line = warningBarkForVariant(variant, e.isFemale === true);
    state.msgs.push(msg(`${e.name}: ${line}`, state.time, '#fc4'));
    observeRumorEvent(e, {
      type: 'samosbor_warning',
      severity: 4,
      floor: state.currentFloor,
      zoneId: world.zoneMap[world.idx(Math.floor(e.x), Math.floor(e.y))],
      tags: ['samosbor', 'warning', 'bark', `samosbor_${variant.def.id}`],
    }, state.time);
    barked++;
  }
  return barked;
}

function ensureSamosborWarning(
  world: World,
  entities: Entity[],
  state: GameState,
  nextId: { v: number },
): SamosborWarningRuntime {
  if (
    samosborWarning &&
    samosborWarning.floor === state.currentFloor &&
    samosborWarning.cycle === state.samosborCount
  ) {
    return samosborWarning;
  }
  if (samosborWarning) clearSamosborWarning(true);

  const variant = getActiveSamosborVariant() ?? chooseSamosborVariant(state.currentFloor);
  const zone = chooseWarningZone(world, entities);
  const seconds = Math.max(0, Math.ceil(state.samosborTimer));
  const actionLine = warningActionLine(zone.id, seconds, variant);
  const warningLine = pick(variant.def.warningLines) ?? actionLine;
  const floorName = floorLevelDisplayName(state.currentFloor);
  const variantLine = `${variant.def.displayName}: ${variant.def.gameplaySignal}.`;
  const modifierLine = variant.modifiers[0]?.warningLine;
  const istotitShelterRoomIds = prepareIstotitShelters(world, state, variant, zone.cx, zone.cy);
  const localShelterRoomIds = prepareLocalSamosborShelters(world, entities, state, variant, zone.id, zone.cx, zone.cy);
  const shelterRoomIds = mergeRoomIds(istotitShelterRoomIds, localShelterRoomIds);
  const screenCount = flashSamosborWarningScreens(
    world,
    zone.cx,
    zone.cy,
    SAMOSBOR_WARNING_SCREEN_RADIUS,
    SAMOSBOR_WARNING_SCREEN_CAP,
  );
  const maronaryClue = prepareMaronaryWarningClues(world, variant, zone.cx, zone.cy);

  state.msgs.push(msg(warningLine, state.time, variant.def.tint));
  if (warningLine !== actionLine) state.msgs.push(msg(actionLine, state.time, variant.def.tint));
  state.msgs.push(msg(`${floorName}. ${variantLine}`, state.time, variant.def.tint));
  if (modifierLine) state.msgs.push(msg(modifierLine, state.time, variant.def.tint));
  if (shelterRoomIds.length > 0) {
    state.msgs.push(msg('ИСТОТИТ: жёлтые гермы отмечены на карте; мест мало. Внутри нажмите E: впустить соседа или закрыться одному.', state.time, variant.def.tint));
  }
  if (isMaronary(variant) && (maronaryClue.greenSourceCount > 0 || maronaryClue.wrongDoorIdx >= 0)) {
    state.msgs.push(msg('Маронарий: зелёный источник и повтор двери отмечены. Свечение жжёт; проверяй маршрут по номеру, не по зелёному свету.', state.time, variant.def.tint));
  }
  const barkCount = pushWarningBarks(world, entities, state, variant, zone.cx, zone.cy);
  const signals = buildWarningSignals(
    variant,
    screenCount,
    barkCount,
    maronaryClue.wrongDoorIdx,
    shelterRoomIds.length,
  );
  state.msgs.push(msg(signals.logLine, state.time, variant.def.tint));

  samosborWarning = {
    cycle: state.samosborCount,
    floor: state.currentFloor,
    zoneId: zone.id,
    zoneX: zone.cx,
    zoneY: zone.cy,
    startedAt: state.time,
    variant,
    warningLine,
    screenCount,
    greenSourceCount: maronaryClue.greenSourceCount,
    wrongDoorIdx: maronaryClue.wrongDoorIdx,
    signals,
  };

  publishEvent(state, {
    type: 'samosbor_warning',
    zoneId: zone.id >= 0 ? zone.id : undefined,
    x: zone.cx,
    y: zone.cy,
    severity: 4,
    privacy: 'public',
    tags: samosborEventTags(variant, ['samosbor', 'warning', 'prewarning', 'variant'], maronaryClue.wrongDoorIdx >= 0),
    data: {
      floorName,
      variantId: variant.def.id,
      variantName: variant.def.displayName,
      gameplaySignal: variant.def.gameplaySignal,
      warning: warningLine,
      secondsToImpact: seconds,
      screenCount,
      greenSourceCount: maronaryClue.greenSourceCount,
      wrongDoorIdx: maronaryClue.wrongDoorIdx >= 0 ? maronaryClue.wrongDoorIdx : undefined,
      shelterRoomIds,
      signals: {
        audio: signals.audioLine,
        screen: signals.screenLine,
        map: signals.mapLine,
        npc: signals.npcLine,
      },
      warningChannels: signals.channels,
    },
  });
  tickSamosborDirector(world, entities, state, nextId, variant, 'pre_samosbor');
  playVariantWarningCue(variant);
  return samosborWarning;
}

/* ── Update samosbor timer and trigger ────────────────────────── */
export function updateSamosbor(
  world: World, entities: Entity[], state: GameState, dt: number, nextId: { v: number },
): boolean {
  if (state.gameOver) return false;

  knownSamosborTime = state.time;
  state.samosborTimer -= dt;
  if (!state.samosborActive && isSamosborWaveActive() && !isSamosborWaveDebugActive()) {
    cancelSamosborWave();
    activeSamosborScale = 'full';
  }

  if (!state.samosborActive && state.samosborTimer > SAMOSBOR_WARNING_WINDOW + 0.5 && samosborWarning) {
    clearSamosborWarning(true);
  }
  if (!state.samosborActive && state.samosborTimer <= SAMOSBOR_WARNING_WINDOW) {
    ensureSamosborWarning(world, entities, state, nextId);
  }
  updateHermodoorBorer(world, entities, state, dt, nextId);

  if (!state.samosborActive && state.samosborTimer <= 0) {
    // ── START samosbor: capture zone + spawn mobs (doors stay open!) ──
    const warning = ensureSamosborWarning(world, entities, state, nextId);
    const variant = warning.variant;
    const warningZoneId = warning.zoneId;
    state.samosborActive = true;
    state.samosborTimer = (SAMOSBOR_DUR_MIN + Math.random() * (SAMOSBOR_DUR_MAX - SAMOSBOR_DUR_MIN)) * variant.durationMult;
    state.samosborCount++;
    fogSpawnAccum = 0;
    samosborSealed = false;
    activeSamosborZoneId = -1;
    activeSamosborScale = 'full';
    samosborDirectorAccum = 0;
    maronaryPingAccum = 0;
    samosborPlayerShelterRoomId = -1;
    state.msgs.push(msg(variant.def.startLine ?? '⚠ САМОСБОР НАЧАЛСЯ ⚠', state.time, variant.def.tint));
    publishEvent(state, {
      type: 'samosbor_started',
      severity: 5,
      privacy: 'public',
      tags: samosborEventTags(variant, ['samosbor', 'start', 'danger', 'variant'], warning.wrongDoorIdx >= 0),
      data: {
        variantId: variant.def.id,
        variantName: variant.def.displayName,
        samosborCount: state.samosborCount,
        greenSourceCount: warning.greenSourceCount,
        wrongDoorIdx: warning.wrongDoorIdx >= 0 ? warning.wrongDoorIdx : undefined,
      },
    });
    if (variant.def.id === 'maronary') {
      createMaronaryWrongDoorRemap(
        world,
        entities,
        state,
        'maronary_start',
        warning.wrongDoorIdx >= 0 ? warning.wrongDoorIdx : undefined,
      );
    }

    // NPCs hide (citizens/scientists only — handled by forceHide)
    forceHide(entities, state.msgs, state.time);

    // Capture a zone with фиолетовый туман + spawn fog boss
    activeSamosborZoneId = captureZone(world, entities, nextId, state, variant, warningZoneId, warning.greenSourceCount, warning.wrongDoorIdx);
    const scale = chooseSamosborScale(state);
    activeSamosborScale = scale;
    if (scale !== 'full') {
      const zone = activeSamosborZoneId >= 0 ? world.zones[activeSamosborZoneId] : undefined;
      const player = findPlayer(entities);
      const playerRoom = player ? world.roomAt(player.x, player.y) : null;
      const protectedRooms = playerRoom
        ? mergeRoomIds(getSamosborShelterRoomIds(state), [playerRoom.id])
        : getSamosborShelterRoomIds(state);
      const started = startSamosborWave(
        world,
        entities,
        state,
        scale,
        zone?.cx ?? warning.zoneX,
        zone?.cy ?? warning.zoneY,
        { protectedRoomIds: protectedRooms, durationSec: Math.max(6, state.samosborTimer - 1) },
      );
      if (!started) activeSamosborScale = 'full';
    } else {
      cancelSamosborWave();
    }
    clearSamosborWarning(false, false);

    // Spawn monsters in corridors
    spawnMonsters(world, entities, nextId, state.samosborCount, variant, state.currentFloor);

    // Spawn ~10 monsters at random map locations (scaled by zone level)
    spawnRandomMapMonsters(world, entities, nextId, state.samosborCount, variant, state.currentFloor);
  }

  // ── Seal apartments 10 seconds before samosbor ends ──
  const activeVariant = getActiveSamosborVariant();
  tickMaronaryGlowDamage(world, entities, state, dt, activeVariant);
  const sealBeforeEnd = Math.max(0, SEAL_BEFORE_END + (activeVariant?.sealTimingDelta ?? 0));
  if (state.samosborActive && activeVariant && !samosborSealed && state.samosborTimer <= sealBeforeEnd) {
    const sealedShelters = sealApartments(world, entities, state, getSamosborShelterRoomIds(state));
    samosborSealed = true;
    resolvePlayerShelterAtSeal(world, entities, state, activeVariant);
    const sealText = activeVariant.sealTimingDelta > 0
      ? 'ГЕРМЫ: досрочное закрытие. Кто у ручки - внутрь сейчас.'
      : activeVariant.sealTimingDelta < 0
        ? 'ГЕРМЫ: задержка закрытия. Не стой в коридоре, ищи второй контур.'
        : 'ГЕРМЫ: закрываются. Не стойте снаружи; зайдите в комнату или ищите второй контур.';
    state.msgs.push(msg(sealText, state.time, '#fa0'));
    if (sealedShelters > 0) state.msgs.push(msg('Жёлтые гермы закрылись мягко. Внутри стало теснее.', state.time, activeVariant.def.tint));
  }

  // ── Fog spread — universal, every tick, even outside samosbor ──
  spreadFog(world);
  if ((state.samosborActive || isSamosborWaveDebugActive()) && isSamosborWaveActive()) {
    tickSamosborWave(world, entities, state);
  }

  // ── Spawn monsters in fogged areas during samosbor ──
  if (state.samosborActive) {
    if (activeVariant) {
      if (isMaronary(activeVariant)) {
        maronaryPingAccum += dt;
        if (maronaryPingAccum >= MARONARY_PING_INTERVAL) {
          maronaryPingAccum = 0;
          playMaronaryPing();
        }
      } else {
        maronaryPingAccum = 0;
      }
      samosborDirectorAccum += dt;
      if (samosborDirectorAccum >= SAMOSBOR_DIRECTOR_ACTIVE_INTERVAL) {
        samosborDirectorAccum = 0;
        tickSamosborDirector(world, entities, state, nextId, activeVariant, 'active_cadence');
      }
    }
    fogSpawnAccum += dt;
    const fogSpawnInterval = Math.max(0.25, FOG_SPAWN_INTERVAL * (activeVariant?.fogSpawnIntervalMult ?? 1));
    if (fogSpawnAccum >= fogSpawnInterval) {
      fogSpawnAccum -= fogSpawnInterval;
      if (activeVariant) spawnFogMonsters(world, entities, nextId, state.samosborCount, activeVariant, state.currentFloor);
    }
  }

  if (state.samosborActive && state.samosborTimer <= 0) {
    // ── END samosbor: unseal, mark for rebuild ──
    const endedVariant = getActiveSamosborVariant();
    const endedScale = activeSamosborScale;
    const aftermathZone = activeSamosborZoneId >= 0 ? world.zones[activeSamosborZoneId] : undefined;
    const endedIstotitDecision = endedVariant?.def.id === 'istotit'
      ? activeIstotitDecision(state) ?? 'none'
      : undefined;
    state.samosborActive = false;
    state.samosborTimer = nextPostSamosborTimer(state.currentFloor);
    const endLine = endedVariant?.def.id === 'istotit'
      ? 'Истотит отзвонил. Жёлтая пыль осталась на плинтусах, ведомость - на руках.'
      : endedVariant?.def.id === 'maronary'
        ? 'Маронарий смолк. Зелёные метки остались у дверей. Проверь номер двери до сна.'
      : endedVariant?.def.id === 'veretar'
        ? 'Веретар отступил. Белый песок остался в швах; проверь, все ли вышли из укрытия.'
      : 'Отбой прошёл. Проверь дверь, карту и тех, кто должен был выйти за тобой.';
    state.msgs.push(msg(endLine, state.time, endedVariant?.def.tint ?? '#aa4'));
    publishEvent(state, {
      type: 'samosbor_ended',
      zoneId: activeSamosborZoneId >= 0 ? activeSamosborZoneId : undefined,
      x: aftermathZone?.cx,
      y: aftermathZone?.cy,
      severity: 5,
      privacy: 'public',
      tags: endedVariant
        ? samosborEventTags(endedVariant, ['samosbor', 'end', 'regrow', 'aftermath_pending'])
        : ['samosbor', 'end', 'regrow', 'samosbor_unknown', 'aftermath_pending'],
      data: {
        samosborCount: state.samosborCount,
        variantId: endedVariant?.def.id,
        variantName: endedVariant?.def.displayName,
        nextTimer: state.samosborTimer,
        istotitDecision: endedIstotitDecision,
      },
    });
    if (endedVariant) {
      pendingAftermath = {
        state,
        variant: endedVariant,
        floor: state.currentFloor,
        zoneId: activeSamosborZoneId,
        x: aftermathZone?.cx ?? Math.floor(findPlayer(entities)?.x ?? W / 2),
        y: aftermathZone?.cy ?? Math.floor(findPlayer(entities)?.y ?? W / 2),
        samosborCount: state.samosborCount,
        endedAt: state.time,
        istotitDecision: endedIstotitDecision,
      };
    }
    clearActiveSamosborVariant();
    samosborDirectorAccum = 0;
    maronaryPingAccum = 0;
    clearMaronaryGlowRuntime();

    const localShelterRoomIds = getLocalSamosborShelterRoomIds(state);
    notifyLocalSamosborShelterEnd(world, entities, state, nextId, endedVariant ?? null);

    // Unseal apartment doors
    unsealApartments(world);
    if (samosborPlayerShelterRoomId >= 0) unsealRooms(world, [samosborPlayerShelterRoomId]);
    unsealRooms(world, mergeRoomIds(istotitShelterRoomIds, localShelterRoomIds));
    samosborPlayerShelterRoomId = -1;
    clearIstotitShelters();
    clearLocalSamosborShelters(state);

    // Re-roll contextual NPC assignment givers after the shock.
    reassignQuestGivers(entities);
    queuePostSamosborHermodoorBorer(world, state);

    activeSamosborScale = 'full';
    if (endedScale !== 'full') {
      const replacement = generateFloor(state.currentFloor);
      finishSamosborWave(world, entities, state, replacement);
      applyPendingSamosborAftermathAfterWave(world, entities, nextId, state.currentFloor);
      return false;
    }

    return true; // signal: heavy rebuild needed
  }

  return false;
}

/* ── Seal all apartment clusters (hermetic doors) ─────────────── */
function sealApartments(world: World, entities: Entity[], state: GameState, extraRoomIds: readonly number[] = []): number {
  // Build set of apartmentIds that have alive resident NPCs
  const occupiedApts = new Set<number>();
  for (const e of entities) {
    if (e.type === EntityType.NPC && e.alive && e.familyId !== undefined && e.familyId >= 0) {
      occupiedApts.add(e.familyId);
    }
  }

  const aptCount = world.apartmentRoomCount;
  for (let i = 0; i < aptCount; i++) {
    const room = world.rooms[i];
    if (!room) continue;
    // Only seal apartments that have living residents
    if (room.apartmentId < 0 || !occupiedApts.has(room.apartmentId)) continue;
    let blocked = false;
    for (const di of room.doors) {
      if (blocksHermodoorBorerSeal(world, state, di, room.id)) blocked = true;
    }
    if (blocked) {
      room.sealed = false;
      continue;
    }
    room.sealed = true;
    for (const di of room.doors) {
      const door = world.doors.get(di);
      if (door) door.state = DoorState.HERMETIC_CLOSED;
    }
  }
  let sealedExtra = 0;
  for (const roomId of extraRoomIds) {
    const room = world.rooms[roomId];
    if (!room || room.sealed) continue;
    let blocked = false;
    for (const di of room.doors) {
      if (blocksHermodoorBorerSeal(world, state, di, room.id)) blocked = true;
    }
    if (blocked) {
      room.sealed = false;
      continue;
    }
    room.sealed = true;
    for (const di of room.doors) {
      const door = world.doors.get(di);
      if (door) door.state = DoorState.HERMETIC_CLOSED;
    }
    sealedExtra++;
  }
  return sealedExtra;
}

/* ── Unseal all apartment rooms ───────────────────────────────── */
function unsealApartments(world: World): void {
  const aptCount = world.apartmentRoomCount;
  for (let i = 0; i < aptCount; i++) {
    const room = world.rooms[i];
    if (!room || !room.sealed) continue;
    room.sealed = false;
    for (const di of room.doors) {
      const door = world.doors.get(di);
      if (door && door.state === DoorState.HERMETIC_CLOSED) {
        door.state = DoorState.HERMETIC_OPEN;
      }
    }
  }
}

function unsealRooms(world: World, roomIds: readonly number[]): void {
  for (const roomId of roomIds) {
    const room = world.rooms[roomId];
    if (!room || !room.sealed) continue;
    room.sealed = false;
    for (const di of room.doors) {
      const door = world.doors.get(di);
      if (door && door.state === DoorState.HERMETIC_CLOSED) {
        door.state = DoorState.HERMETIC_OPEN;
      }
    }
  }
}

/* ── Full world rebuild (except apartments) — runs AFTER samosbor ends ── */

export function rebuildWorld(
  world: World, entities: Entity[], nextId: { v: number }, _samosborCount: number,
  floor: FloorLevel = FloorLevel.LIVING,
  replacement?: FloorGeneration,
): void {
  clearHermodoorBorerForRebuild(world);
  if (replacement || floor !== FloorLevel.LIVING) {
    // Non-living floors fully regenerate; generated NPCs/monsters are replaced, player survives.
    const kept: Entity[] = [];
    for (const e of entities) {
      if (!e.alive) continue;
      if (e.type === EntityType.PLAYER) {
        kept.push(e);
      }
    }
    entities.length = 0;
    const gen = replacement ?? generateFloor(floor);
    // Full-floor rebuilds use the fresh generator-owned masks exactly:
    // authored shelters may keep aptMask/hermoWall, while unmarked volatile cells lose stale protection.
    replaceWorldFromGeneration(world, gen);
    replaceCellHazards(world, gen.world);
    replaceRouteCueStateForRebuild(world, gen.world);
    replaceEmergencyPanelStateForRebuild(world, gen.world);
    // Restore kept entities + merge new entities from generator
    for (const e of kept) entities.push(e);
    for (const e of gen.entities) {
      e.id = nextId.v++;
      entities.push(e);
    }
    relocateBlockedEntities(world, entities);
    ensureRoomContainers(world, floor);
    applyPendingSamosborAftermath(world, entities, nextId, floor);
    return;
  }

  // Living floor: only rebuild volatile maze, keep apartments
  const aptCount = world.apartmentRoomCount;

  // Kill projectiles and remove item drops outside apartments
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (e.type === EntityType.PROJECTILE) {
      entities.splice(i, 1);
      continue;
    }
    if (e.type === EntityType.ITEM_DROP) {
      const rid = world.roomMap[world.idx(Math.floor(e.x), Math.floor(e.y))];
      if (rid < 0 || rid >= aptCount) {
        entities.splice(i, 1);
      }
    }
  }

  // Regenerate the entire volatile maze
  replaceRouteCueStateForRebuild(world);
  replaceEmergencyPanelStateForRebuild(world);
  regrowMaze(world);
  relocateBlockedEntities(world, entities);

  // Spawn new items in volatile rooms within the shared item soft limit.
  let itemSlots = entitySpawnSlots(entities, EntityType.ITEM_DROP, Number.MAX_SAFE_INTEGER);
  for (let ri = aptCount; ri < world.rooms.length; ri++) {
    if (itemSlots <= 0) break;
    const room = world.rooms[ri];
    if (!room || room.w < 3 || room.h < 3) continue;
    const ci = world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2));
    const zid = world.zoneMap[ci];
    const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 1) : 1;
    const valueThreshold = zoneLevel * 15 + 10;
    const adjusted = Object.values(ITEMS)
      .filter(it => it.spawnRooms.includes(room.type))
      .map(it => ({ ...it, spawnW: (1000 / (it.value + 10)) * Math.min(1, (valueThreshold + 5) / Math.max(1, it.value)) }))
      .filter(it => it.spawnW >= 0.01);
    const numItems = rng(0, 1);
    for (let n = 0; n < numItems; n++) {
      if (itemSlots <= 0) break;
      const def = weightedPick(adjusted);
      if (!def) continue;
      const ix = room.x + rng(1, Math.max(1, room.w - 2));
      const iy = room.y + rng(1, Math.max(1, room.h - 2));
      entities.push({
        id: nextId.v++, type: EntityType.ITEM_DROP,
        x: ix + 0.5, y: iy + 0.5, angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
        inventory: [{ defId: def.id, count: rng(1, spawnCount(def)), data: def.id === 'note' ? pick(NOTES) : undefined }],
      });
      itemSlots--;
    }
  }
  ensureRoomContainers(world, floor);
  applyPendingSamosborAftermath(world, entities, nextId, floor);
}

function findPlayer(entities: Entity[]): Entity | undefined {
  return entities.find(e => e.type === EntityType.PLAYER && e.alive);
}

function relocateEntityIfBlocked(world: World, e: Entity): void {
  if (!e.alive || e.type === EntityType.PROJECTILE) return;
  const ci = world.idx(Math.floor(e.x), Math.floor(e.y));
  const cell = world.cells[ci];
  if (cell === Cell.FLOOR || cell === Cell.WATER) return;

  const sx = Math.floor(e.x);
  const sy = Math.floor(e.y);
  for (let r = 1; r <= 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = world.wrap(sx + dx);
        const y = world.wrap(sy + dy);
        const ni = world.idx(x, y);
        const targetCell = world.cells[ni];
        if (targetCell !== Cell.FLOOR && targetCell !== Cell.WATER) continue;
        e.x = x + 0.5;
        e.y = y + 0.5;
        return;
      }
    }
  }
}

function relocateBlockedEntities(world: World, entities: Entity[]): void {
  for (const e of entities) relocateEntityIfBlocked(world, e);
}

function aftermathCenter(world: World, entities: Entity[], pending: PendingAftermath, preferPlayer: boolean): { x: number; y: number } {
  const player = findPlayer(entities);
  if (preferPlayer && player) return { x: Math.floor(player.x), y: Math.floor(player.y) };
  const zone = pending.zoneId >= 0 ? world.zones[pending.zoneId] : undefined;
  if (zone) return { x: zone.cx, y: zone.cy };
  if (player) return { x: Math.floor(player.x), y: Math.floor(player.y) };
  return { x: pending.x, y: pending.y };
}

function beatReady(def: SamosborAftermathBeatDef, now: number): boolean {
  const rt = aftermathRuntime.get(def.id);
  if (!rt) return true;
  if (rt.runs >= def.maxRuns) return false;
  return now - rt.lastAt >= def.cooldownSec;
}

function pickAftermathBeat(
  defs: readonly SamosborAftermathBeatDef[],
  used: Set<string>,
  now: number,
  samosborCount: number,
): SamosborAftermathBeatDef | null {
  let total = 0;
  for (const def of defs) {
    if (used.has(def.id) || !beatReady(def, now)) continue;
    if (samosborCount < (def.minSamosborCount ?? 0)) continue;
    total += def.weight;
  }
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const def of defs) {
    if (used.has(def.id) || !beatReady(def, now)) continue;
    if (samosborCount < (def.minSamosborCount ?? 0)) continue;
    roll -= def.weight;
    if (roll <= 0) return def;
  }
  return null;
}

function applyPendingSamosborAftermath(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  floor: FloorLevel,
): void {
  const pending = pendingAftermath;
  if (!pending || pending.floor !== floor) return;
  pendingAftermath = null;

  const state = pending.state;
  knownSamosborTime = state.time;
  const defs = getSamosborAftermathBeats(pending.variant.def.id, floor);
  const target = pending.variant.def.id === 'classic'
    ? (Math.random() < 0.35 ? 1 : 0)
    : Math.min(3, 2 + (pending.samosborCount >= 4 && Math.random() < 0.35 ? 1 : 0));
  const used = new Set<string>();
  const applied: string[] = [];

  while (applied.length < target && used.size < defs.length) {
    const def = pickAftermathBeat(defs, used, state.time, pending.samosborCount);
    if (!def) break;
    used.add(def.id);
    if (!applySamosborAftermathBeat(def, pending, world, entities, nextId)) continue;
    const rt = aftermathRuntime.get(def.id) ?? { lastAt: -Infinity, runs: 0 };
    rt.lastAt = state.time;
    rt.runs++;
    aftermathRuntime.set(def.id, rt);
    applied.push(def.id);
  }

  if (applied.length > 0) {
    lastAftermathAt = state.time;
    lastAftermathBeatIds = applied;
    lastAftermathFloor = floor;
  }
  tickSamosborDirector(world, entities, state, nextId, pending.variant, 'post_samosbor');
}

export function applyPendingSamosborAftermathAfterWave(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  floor: FloorLevel,
): void {
  applyPendingSamosborAftermath(world, entities, nextId, floor);
}

function eventTypeForAftermath(def: SamosborAftermathBeatDef): WorldEventType {
  switch (def.effect) {
    case 'production_shortage':
      return 'room_lacked_resources';
    case 'container_theft':
      return 'item_stolen';
    case 'door_fault':
      return 'door_opened';
    case 'route_block':
      return 'door_sealed';
    case 'item_residue':
      return 'samosbor_warning';
    default:
      return 'samosbor_warning';
  }
}

function publishAftermath(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  x: number,
  y: number,
  data: Record<string, unknown> = {},
): void {
  const itemId = typeof data.itemId === 'string' ? data.itemId : def.itemId;
  const monsterKind = typeof data.monsterKind === 'number' ? data.monsterKind as MonsterKind : def.monsterKind;
  const containerId = typeof data.containerId === 'number' ? data.containerId : undefined;
  const roomId = typeof data.roomId === 'number' ? data.roomId : undefined;
  const targetId = typeof data.targetId === 'number' ? data.targetId : undefined;
  pending.state.msgs.push(msg(def.message, pending.state.time, pending.variant.def.tint));
  publishEvent(pending.state, {
    type: eventTypeForAftermath(def),
    zoneId: pending.zoneId >= 0 ? pending.zoneId : undefined,
    roomId,
    x,
    y,
    targetId,
    targetName: monsterKind !== undefined ? MONSTERS[monsterKind]?.name : undefined,
    itemId,
    itemName: itemId ? ITEMS[itemId]?.name ?? itemId : undefined,
    itemCount: typeof data.itemCount === 'number' ? data.itemCount : undefined,
    monsterKind,
    containerId,
    severity: def.severity,
    privacy: 'local',
    tags: [
      'samosbor',
      'aftermath',
      def.effect,
      `samosbor_${pending.variant.def.id}`,
      ...def.tags,
    ].slice(0, 8),
    data: {
      beatId: def.id,
      beatTitle: def.title,
      variantId: pending.variant.def.id,
      variantName: pending.variant.def.displayName,
      samosborCount: pending.samosborCount,
      istotitDecision: pending.istotitDecision,
      ...data,
    },
  });
}

function applySamosborAftermathBeat(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
  nextId: { v: number },
): boolean {
  switch (def.effect) {
    case 'fog_residue':
      return applyFogResidue(def, pending, world, entities, false);
    case 'door_fault':
      return applyDoorFault(def, pending, world, entities);
    case 'route_block':
      return applyRouteBlock(def, pending, world, entities);
    case 'monster_aftershock':
      return applyMonsterAftershock(def, pending, world, entities, nextId);
    case 'rumor_seed':
      return applyRumorSeed(def, pending, world, entities);
    case 'production_shortage':
      return applyProductionShortage(def, pending, world, entities);
    case 'faction_panic':
      return applyFactionPanic(def, pending, world, entities);
    case 'container_theft':
      return applyContainerTheft(def, pending, world, entities);
    case 'false_all_clear':
      return applyFogResidue(def, pending, world, entities, true);
    case 'item_residue':
      return applyItemResidue(def, pending, world, entities, nextId);
  }
  return false;
}

function applyFogResidue(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
  preferPlayer: boolean,
): boolean {
  const c = aftermathCenter(world, entities, pending, preferPlayer);
  const radius = Math.max(2, Math.min(10, def.radius));
  const r2 = radius * radius;
  const strength = def.fogStrength ?? 120;
  let changed = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = world.wrap(c.x + dx);
      const y = world.wrap(c.y + dy);
      const i = world.idx(x, y);
      if (world.aptMask[i] || (world.cells[i] !== Cell.FLOOR && world.cells[i] !== Cell.DOOR)) continue;
      if (world.fog[i] >= strength) continue;
      world.fog[i] = strength;
      changed++;
    }
  }
  if (changed <= 0) return false;
  world.markFogDirty();
  publishAftermath(def, pending, c.x, c.y, { cells: changed, radius, fogStrength: strength });
  return true;
}

function findLocalDoor(world: World, x: number, y: number, radius: number): number {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const i = world.idx(x + dx, y + dy);
      if (world.cells[i] === Cell.DOOR && world.doors.has(i)) return i;
    }
  }
  return -1;
}

function doorTouchesApartment(world: World, door: { roomA: number; roomB: number }): boolean {
  const roomA = door.roomA >= 0 ? world.rooms[door.roomA] : undefined;
  const roomB = door.roomB >= 0 ? world.rooms[door.roomB] : undefined;
  return (roomA?.apartmentId ?? -1) >= 0 || (roomB?.apartmentId ?? -1) >= 0;
}

function findRouteScarDoor(world: World, x: number, y: number, radius: number): number {
  let bestIdx = -1;
  let bestD2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const di = world.idx(x + dx, y + dy);
      if (world.cells[di] !== Cell.DOOR || world.aptMask[di]) continue;
      const door = world.doors.get(di);
      if (!door || door.state === DoorState.LOCKED || door.state === DoorState.HERMETIC_CLOSED) continue;
      if (doorTouchesApartment(world, door)) continue;
      const d2 = world.dist2(x + 0.5, y + 0.5, (di % W) + 0.5, ((di / W) | 0) + 0.5);
      if (d2 < bestD2) {
        bestD2 = d2;
        bestIdx = di;
      }
    }
  }
  return bestIdx;
}

function stampAftermathDoorMark(
  world: World,
  di: number,
  pending: PendingAftermath,
  def: SamosborAftermathBeatDef,
): string {
  const x = di % W;
  const y = (di / W) | 0;
  if (pending.variant.def.id === 'maronary') {
    stampMaronarySourceMark(world, di, 86_000 + di, 0.52);
    return 'maronary_ring';
  }
  if (pending.variant.def.id === 'istotit') {
    stampMark(world, x, y, 0.5, 0.5, 0.38, MarkType.PSI, 86_000 + di, 214, 166, 75, 150);
    return 'gold_dust';
  }
  if (pending.variant.def.id === 'veretar') {
    stampMark(world, x, y, 0.5, 0.5, 0.38, MarkType.SPLAT, 86_000 + di, 244, 241, 223, 150);
    return 'white_scar';
  }
  if (def.tags.includes('water') || pending.variant.def.id === 'wet') {
    stampMark(world, x, y, 0.5, 0.5, 0.42, MarkType.DRIP, 86_000 + di, 70, 100, 120, 120);
    return 'wet_drag';
  }
  stampMark(world, x, y, 0.5, 0.5, 0.38, MarkType.SCORCH, 86_000 + di, 94, 82, 70, 135, true);
  return 'scorch';
}

function applyDoorFault(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
): boolean {
  const c = aftermathCenter(world, entities, pending, true);
  let di = findLocalDoor(world, c.x, c.y, Math.min(18, def.radius));
  if (di < 0) {
    const zc = aftermathCenter(world, entities, pending, false);
    di = findLocalDoor(world, zc.x, zc.y, Math.min(18, def.radius));
  }
  const door = di >= 0 ? world.doors.get(di) : undefined;
  if (!door) return false;
  const oldState = door.state;
  door.state = oldState === DoorState.HERMETIC_CLOSED || oldState === DoorState.HERMETIC_OPEN
    ? DoorState.HERMETIC_OPEN
    : DoorState.OPEN;
  door.timer = Math.max(door.timer, 45);
  const doorMark = stampAftermathDoorMark(world, di, pending, def);
  publishAftermath(def, pending, di % W, (di / W) | 0, {
    doorIdx: di,
    oldState,
    newState: door.state,
    doorMarked: true,
    doorMark,
    wrongDoor: pending.variant.def.id === 'maronary' || def.tags.includes('wrong_door'),
  });
  return true;
}

function applyRouteBlock(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
): boolean {
  const c = aftermathCenter(world, entities, pending, false);
  let di = findRouteScarDoor(world, c.x, c.y, Math.min(18, def.radius));
  if (di < 0) {
    const pc = aftermathCenter(world, entities, pending, true);
    di = findRouteScarDoor(world, pc.x, pc.y, Math.min(18, def.radius));
  }
  const door = di >= 0 ? world.doors.get(di) : undefined;
  if (!door) return false;
  const oldState = door.state;
  door.state = DoorState.HERMETIC_CLOSED;
  door.timer = 0;
  const x = di % W;
  const y = (di / W) | 0;
  stampMark(world, x, y, 0.5, 0.5, 0.42, MarkType.SCORCH, 88_000 + di, 116, 96, 84, 150, true);
  publishAftermath(def, pending, x, y, {
    doorIdx: di,
    oldState,
    newState: door.state,
    routeBlocked: true,
  });
  return true;
}

function findWalkableNear(world: World, x: number, y: number, minRadius: number, maxRadius: number): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 80; attempt++) {
    const a = Math.random() * Math.PI * 2;
    const r = minRadius + Math.random() * Math.max(1, maxRadius - minRadius);
    const tx = world.wrap(Math.round(x + Math.cos(a) * r));
    const ty = world.wrap(Math.round(y + Math.sin(a) * r));
    const i = world.idx(tx, ty);
    if (world.cells[i] === Cell.FLOOR && !world.aptMask[i]) return { x: tx, y: ty };
  }
  for (let r = minRadius; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = world.wrap(x + dx);
        const ty = world.wrap(y + dy);
        const i = world.idx(tx, ty);
        if (world.cells[i] === Cell.FLOOR && !world.aptMask[i]) return { x: tx, y: ty };
      }
    }
  }
  return null;
}

function applyMonsterAftershock(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
  nextId: { v: number },
): boolean {
  const c = aftermathCenter(world, entities, pending, true);
  const targetCount = Math.max(1, Math.min(4, Math.floor(def.monsterCount ?? 1)));
  const slots = entitySpawnSlots(entities, EntityType.MONSTER, targetCount);
  if (slots <= 0) return false;
  const kind = def.monsterKind ?? MonsterKind.TVAR;
  const spawnedIds: number[] = [];
  let firstPos: { x: number; y: number } | null = null;
  for (let i = 0; i < slots; i++) {
    const pos = findWalkableNear(world, c.x, c.y, 5 + i, Math.max(7 + i, def.radius + i * 2));
    if (!pos) continue;
    const monster = createMonster(world, nextId, kind, pos.x + 0.5, pos.y + 0.5, pending.floor, true);
    entities.push(monster);
    spawnedIds.push(monster.id);
    if (!firstPos) firstPos = pos;
  }
  if (!firstPos || spawnedIds.length === 0) return false;
  publishAftermath(def, pending, firstPos.x, firstPos.y, {
    monsterKind: kind,
    targetId: spawnedIds[0],
    targetIds: spawnedIds,
    monsterCount: spawnedIds.length,
    spawnCap: targetCount,
  });
  return true;
}

function applyItemResidue(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
  nextId: { v: number },
): boolean {
  const itemId = def.itemId;
  if (!itemId || !ITEMS[itemId]) return false;
  const c = aftermathCenter(world, entities, pending, true);
  const pos = findWalkableNear(world, c.x, c.y, 1, Math.max(3, def.radius));
  if (!pos) return false;
  const item: Entity = {
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{ defId: itemId, count: 1 }],
  };
  entities.push(item);
  if (itemId === 'veretar_sand' || itemId === 'overexposed_photo') {
    stampMark(world, pos.x, pos.y, 0.5, 0.5, 0.42, MarkType.SPLAT, 93_000 + item.id, 244, 241, 223, 170);
  } else if (itemId === 'maronary_shaving') {
    stampMark(world, pos.x, pos.y, 0.5, 0.5, 0.34, MarkType.PSI, 87_000 + item.id, 80, 240, 100, 140);
  }
  publishAftermath(def, pending, pos.x, pos.y, { itemId, itemCount: 1, targetId: item.id });
  return true;
}

function localNpcs(world: World, entities: Entity[], x: number, y: number, radius: number, limit: number): Entity[] {
  const out: Entity[] = [];
  const r2 = radius * radius;
  for (const e of entities) {
    if (!e.alive || e.type !== EntityType.NPC) continue;
    if (world.dist2(x + 0.5, y + 0.5, e.x, e.y) > r2) continue;
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

function applyRumorSeed(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
): boolean {
  const c = aftermathCenter(world, entities, pending, true);
  let npcs = localNpcs(world, entities, c.x, c.y, def.radius, 8);
  if (npcs.length === 0) {
    const zc = aftermathCenter(world, entities, pending, false);
    npcs = localNpcs(world, entities, zc.x, zc.y, def.radius, 8);
  }
  if (npcs.length === 0) {
    publishAftermath(def, pending, c.x, c.y, { npcCount: 0, rumorSpawned: true, rumorCarrier: 'world_event' });
    return true;
  }
  for (const npc of npcs) {
    observeRumorEvent(npc, {
      type: 'samosbor_warning',
      severity: def.severity,
      floor: pending.floor,
      zoneId: pending.zoneId >= 0 ? pending.zoneId : undefined,
      tags: ['samosbor', 'aftermath', ...def.tags],
      itemId: def.itemId,
      monsterKind: def.monsterKind,
    }, pending.state.time);
  }
  publishAftermath(def, pending, c.x, c.y, { npcCount: npcs.length, rumorSpawned: true, rumorCarrier: 'npc_memory' });
  return true;
}

function applyProductionShortage(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
): boolean {
  const resourceId = def.resourceId ?? 'labor';
  const delta = -Math.max(4, 6 + pending.samosborCount * 2);
  if (!changeResourceStock(pending.state, resourceId, delta, pending.floor)) return false;
  const c = aftermathCenter(world, entities, pending, false);
  const room = world.roomAt(c.x, c.y);
  publishAftermath(def, pending, c.x, c.y, { resourceId, delta, roomId: room?.id });
  return true;
}

function factionToAftermathControl(faction: Faction | undefined): ZoneFaction | null {
  if (faction === Faction.LIQUIDATOR) return ZoneFaction.LIQUIDATOR;
  if (faction === Faction.CULTIST) return ZoneFaction.CULTIST;
  if (faction === Faction.WILD) return ZoneFaction.WILD;
  if (faction === Faction.CITIZEN || faction === Faction.SCIENTIST || faction === Faction.PLAYER) return ZoneFaction.CITIZEN;
  return null;
}

function defaultAftermathControlFaction(pending: PendingAftermath): ZoneFaction {
  if (pending.variant.def.id === 'meat') return ZoneFaction.CULTIST;
  if (pending.variant.def.id === 'electric' || pending.variant.def.id === 'wet') return ZoneFaction.LIQUIDATOR;
  return ZoneFaction.CITIZEN;
}

function pickAftermathControlFaction(pending: PendingAftermath, npcs: readonly Entity[]): ZoneFaction {
  for (const npc of npcs) {
    const zf = factionToAftermathControl(npc.faction);
    if (zf !== null && zf !== ZoneFaction.CITIZEN) return zf;
  }
  return defaultAftermathControlFaction(pending);
}

function applyAftermathFactionControl(
  world: World,
  cx: number,
  cy: number,
  zoneId: number,
  zf: ZoneFaction,
  radius: number,
): number {
  if (zoneId < 0) return 0;
  const r = Math.max(2, Math.min(10, radius));
  const r2 = r * r;
  let changed = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (changed >= AFTERMATH_FACTION_CONTROL_CAP) return changed;
      if (dx * dx + dy * dy > r2) continue;
      const x = world.wrap(cx + dx);
      const y = world.wrap(cy + dy);
      const i = world.idx(x, y);
      if (world.zoneMap[i] !== zoneId) continue;
      const cell = world.cells[i];
      if (cell === Cell.WALL || cell === Cell.ABYSS || cell === Cell.LIFT) continue;
      if (world.factionControl[i] === ZoneFaction.SAMOSBOR || world.factionControl[i] === zf) continue;
      world.factionControl[i] = zf;
      changed++;
    }
  }
  return changed;
}

function applyFactionPanic(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
): boolean {
  const c = aftermathCenter(world, entities, pending, true);
  const npcs = localNpcs(world, entities, c.x, c.y, def.radius, 12).filter(e => e.ai);
  for (const npc of npcs) {
    const ai = npc.ai!;
    const dx = world.delta(c.x + 0.5, npc.x);
    const dy = world.delta(c.y + 0.5, npc.y);
    const len = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
    const tx = world.wrap(Math.floor(npc.x + dx / len * 14));
    const ty = world.wrap(Math.floor(npc.y + dy / len * 14));
    const status = tryAssignPathToCell(world, npc, tx, ty);
    ai.pi = 0;
    ai.tx = tx;
    ai.ty = ty;
    ai.goal = status !== 'not_found' ? AIGoal.FLEE : AIGoal.WANDER;
    ai.timer = 5;
    getNpcMemory(npc, pending.state.time).fear = 100;
  }
  const zoneId = world.zoneMap[world.idx(c.x, c.y)];
  const controlFaction = pickAftermathControlFaction(pending, npcs);
  const controlCells = applyAftermathFactionControl(world, c.x, c.y, zoneId, controlFaction, Math.min(10, def.radius));
  if (npcs.length === 0 && controlCells === 0) return false;
  publishAftermath(def, pending, c.x, c.y, {
    npcCount: npcs.length,
    controlCells,
    controlFaction,
    factionStateAltered: controlCells > 0,
  });
  return true;
}

function addAftermathContainerTag(container: WorldContainer, tag: string): void {
  if (!container.tags.includes(tag)) container.tags.push(tag);
}

function canReceiveContainerItem(container: WorldContainer, itemId: string): boolean {
  if (!ITEMS[itemId]) return false;
  return container.inventory.some(item => item.defId === itemId) || container.inventory.length < container.capacitySlots;
}

function addOneContainerItem(container: WorldContainer, itemId: string, data?: unknown): boolean {
  if (!ITEMS[itemId]) return false;
  for (const item of container.inventory) {
    if (item.defId !== itemId) continue;
    item.count++;
    return true;
  }
  if (container.inventory.length >= container.capacitySlots) return false;
  container.inventory.push({ defId: itemId, count: 1, data });
  return true;
}

function chooseContainerLoot(container: WorldContainer, preferredItemId?: string): { slotIdx: number; itemId: string; data?: unknown } | null {
  if (preferredItemId) {
    const preferredIdx = container.inventory.findIndex(item => item.defId === preferredItemId && item.count > 0 && !!ITEMS[item.defId]);
    if (preferredIdx >= 0) {
      const item = container.inventory[preferredIdx];
      return { slotIdx: preferredIdx, itemId: item.defId, data: item.count === 1 ? item.data : undefined };
    }
  }
  for (let slotIdx = 0; slotIdx < container.inventory.length; slotIdx++) {
    const item = container.inventory[slotIdx];
    if (item.count > 0 && ITEMS[item.defId]) return { slotIdx, itemId: item.defId, data: item.count === 1 ? item.data : undefined };
  }
  return null;
}

function removeOneContainerItem(container: WorldContainer, slotIdx: number): boolean {
  const item = container.inventory[slotIdx];
  if (!item || item.count <= 0) return false;
  item.count--;
  if (item.count <= 0) container.inventory.splice(slotIdx, 1);
  return true;
}

function findLootReceiver(
  world: World,
  pending: PendingAftermath,
  source: WorldContainer,
  itemId: string,
  radius: number,
): WorldContainer | null {
  const r2 = radius * radius;
  let best: WorldContainer | null = null;
  let bestScore = Infinity;
  for (const container of world.containers) {
    if (container.id === source.id || container.floor !== pending.floor) continue;
    if (!canReceiveContainerItem(container, itemId)) continue;
    const d2 = world.dist2(source.x + 0.5, source.y + 0.5, container.x + 0.5, container.y + 0.5);
    if (d2 > r2 && container.zoneId !== source.zoneId && container.zoneId !== pending.zoneId) continue;
    const accessBias = container.access === 'public' ? -60 : container.access === 'room' ? -30 : 0;
    const seenBias = container.discovered ? -20 : 0;
    const zoneBias = container.zoneId === source.zoneId ? -20 : 0;
    const score = d2 + accessBias + seenBias + zoneBias;
    if (score < bestScore) {
      bestScore = score;
      best = container;
    }
  }
  return best;
}

function moveAftermathLoot(
  world: World,
  pending: PendingAftermath,
  source: WorldContainer,
  def: SamosborAftermathBeatDef,
): Record<string, unknown> {
  const loot = chooseContainerLoot(source, def.itemId);
  if (!loot) return { lootMoved: false };
  const receiver = findLootReceiver(world, pending, source, loot.itemId, Math.max(6, def.radius));
  if (!receiver || !removeOneContainerItem(source, loot.slotIdx)) return { lootMoved: false };
  if (!addOneContainerItem(receiver, loot.itemId, loot.data)) {
    addOneContainerItem(source, loot.itemId, loot.data);
    return { lootMoved: false };
  }
  source.stolenItemIds ??= [];
  source.stolenItemIds.push(loot.itemId);
  source.lastAuditAt = pending.state.time;
  source.discovered = true;
  receiver.discovered = true;
  addAftermathContainerTag(source, 'aftermath_loot_source');
  addAftermathContainerTag(receiver, 'aftermath_loot_receiver');
  return {
    lootMoved: true,
    itemId: loot.itemId,
    itemCount: 1,
    sourceContainerId: source.id,
    receiverContainerId: receiver.id,
    receiverAccess: receiver.access,
  };
}

function applyContainerTheft(
  def: SamosborAftermathBeatDef,
  pending: PendingAftermath,
  world: World,
  entities: Entity[],
): boolean {
  ensureRoomContainers(world, pending.floor);
  const c = aftermathCenter(world, entities, pending, true);
  let best = world.containers.find(container =>
    container.access !== 'public' &&
    container.floor === pending.floor && world.dist2(c.x + 0.5, c.y + 0.5, container.x + 0.5, container.y + 0.5) <= def.radius * def.radius);
  best ??= world.containers.find(container =>
    container.floor === pending.floor && world.dist2(c.x + 0.5, c.y + 0.5, container.x + 0.5, container.y + 0.5) <= def.radius * def.radius);
  if (!best) {
    const zc = aftermathCenter(world, entities, pending, false);
    best = world.containers.find(container =>
      container.access !== 'public' &&
      container.floor === pending.floor && container.zoneId === pending.zoneId &&
      world.dist2(zc.x + 0.5, zc.y + 0.5, container.x + 0.5, container.y + 0.5) <= def.radius * def.radius);
    best ??= world.containers.find(container =>
      container.floor === pending.floor && container.zoneId === pending.zoneId &&
      world.dist2(zc.x + 0.5, zc.y + 0.5, container.x + 0.5, container.y + 0.5) <= def.radius * def.radius);
  }
  if (!best) return false;
  const oldAccess = best.access;
  best.discovered = true;
  if (best.access === 'locked') best.access = 'faction';
  addAftermathContainerTag(best, 'aftermath_unsealed');
  const moved = moveAftermathLoot(world, pending, best, def);
  if (moved.lootMoved !== true && def.itemId && ITEMS[def.itemId] && addOneContainerItem(best, def.itemId)) {
    moved.itemId = def.itemId;
    moved.itemCount = 1;
    moved.lootSeeded = true;
  }
  publishAftermath(def, pending, best.x, best.y, {
    containerId: best.id,
    oldAccess,
    newAccess: best.access,
    ...moved,
  });
  return true;
}

export function getSamosborDebugLines(): string[] {
  const active = getActiveSamosborVariant();
  const last = getLastSamosborVariant();
  const forced = getForcedSamosborVariant();
  const warning = getSamosborWarningSnapshot();
  let cooldown = 0;
  let hasCooldown = false;
  for (const def of getSamosborAftermathBeats(last ?? 'classic', lastAftermathFloor)) {
    const rt = aftermathRuntime.get(def.id);
    if (!rt || rt.runs >= def.maxRuns) continue;
    const remaining = Math.max(0, Math.ceil(rt.lastAt + def.cooldownSec - knownSamosborTime));
    if (!hasCooldown || remaining < cooldown) cooldown = remaining;
    hasCooldown = true;
  }
  const beats = lastAftermathBeatIds.length > 0 ? lastAftermathBeatIds.join(',') : '-';
  const warningZone = warning ? (warning.zoneId >= 0 ? `зона ${warning.zoneId + 1}` : 'локально') : '-';
  const veretarLeakAge = Number.isFinite(lastVeretarAreaLeakAt)
    ? `${Math.max(0, Math.round(knownSamosborTime - lastVeretarAreaLeakAt))}s ago`
    : '-';
  const istotitLine = `Истотит: shelters=${istotitShelterRoomIds.length} supplies=${istotitSupplyContainerIds.length} decision=${istotitDecision || '-'}`;
  const localShelterLines = getLocalSamosborShelterDebugLines();
  return [
    `Самосбор: ${active ? active.def.displayName : '-'}`,
    `Предупреждение: ${warning ? `${warning.variantName} ${warningZone} ${warning.secondsLeft}s` : '-'}`,
    `Прошлый вариант: ${getSamosborVariantName(last)}`,
    `Следующий вариант: ${getSamosborVariantName(forced)}`,
    istotitLine,
    ...getSamosborWaveDebugLines(),
    ...localShelterLines,
    `Веретар: area_leak=${lastVeretarAreaLeaks} ${veretarLeakAge}`,
    `Последствия: ${beats}  cd ${hasCooldown ? cooldown : 0}s${pendingAftermath ? ' pending' : ''}`,
    `Последний aftermath: ${Number.isFinite(lastAftermathAt) ? Math.max(0, Math.round(knownSamosborTime - lastAftermathAt)) + 's ago' : '-'}`,
  ];
}

/* ── Shared helpers for monster creation ───────────────────────── */
function pickMonsterKindForWave(floor: FloorLevel, samosborCount: number): MonsterKind {
  return chooseFloorMonsterKind({
    floor,
    floorTags: ['samosbor', 'fog'],
    samosborCount,
    allowRare: samosborCount >= 4 && Math.random() < 0.08,
  });
}

function createMonster(world: World, nextId: { v: number }, kind: MonsterKind, x: number, y: number, _floor: FloorLevel, _forceVariant = false): Entity {
  const def = MONSTERS[kind];
  const ci = world.idx(Math.floor(x), Math.floor(y));
  const zid = world.zoneMap[ci];
  const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 1) : 1;
  const rpg = randomRPG(zoneLevel);
  const hpBase = scaleMonsterHp(def.hp, zoneLevel);
  const hpFinal = Math.round(hpBase * (1 + 0.1 * rpg.str));
  const goal = kind === MonsterKind.BLACK_LIQUIDATOR ? AIGoal.WANDER : AIGoal.HUNT;
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x, y,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, zoneLevel),
    sprite: def.sprite,
    hp: hpFinal,
    maxHp: hpFinal,
    monsterKind: kind,
    attackCd: def.attackRate,
    ai: { goal, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg,
    phasing: kind === MonsterKind.SPIRIT,
  };
  return monster;
}

function pushVeretarLeakCandidate(
  world: World,
  out: number[],
  ci: number,
  cx: number,
  cy: number,
  maxRadius: number,
): void {
  if (out.includes(ci)) return;
  if (world.aptMask[ci]) return;
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) return;
  const x = ci % W;
  const y = (ci / W) | 0;
  if (world.dist2(cx + 0.5, cy + 0.5, x + 0.5, y + 0.5) > maxRadius * maxRadius) return;
  out.push(ci);
}

function pushVeretarLeakFloorNear(
  world: World,
  out: number[],
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  maxRadius: number,
): void {
  pushVeretarLeakCandidate(world, out, world.idx(sx, sy), cx, cy, maxRadius);
  for (let i = 0; i < FOG_DIRS_X.length; i++) {
    const x = world.wrap(sx + FOG_DIRS_X[i]);
    const y = world.wrap(sy + FOG_DIRS_Y[i]);
    pushVeretarLeakCandidate(world, out, world.idx(x, y), cx, cy, maxRadius);
  }
}

function collectVeretarLeakCandidates(world: World, cx: number, cy: number, maxRadius: number): number[] {
  const out: number[] = [];
  for (const [ci] of world.doors) {
    pushVeretarLeakCandidate(world, out, ci, cx, cy, maxRadius);
    if (out.length >= 48) return out;
  }

  for (const ci of world.screenCells) {
    const sx = ci % W;
    const sy = (ci / W) | 0;
    pushVeretarLeakFloorNear(world, out, sx, sy, cx, cy, maxRadius);
    if (out.length >= 48) return out;
  }

  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      if (dx * dx + dy * dy > maxRadius * maxRadius) continue;
      const x = world.wrap(cx + dx);
      const y = world.wrap(cy + dy);
      const ci = world.idx(x, y);
      if (world.features[ci] === Feature.SCREEN || world.features[ci] === Feature.LIFT_BUTTON) {
        pushVeretarLeakFloorNear(world, out, x, y, cx, cy, maxRadius);
      }
      if (out.length >= 64) return out;
    }
  }

  for (let dy = -maxRadius; dy <= maxRadius && out.length < 64; dy++) {
    for (let dx = -maxRadius; dx <= maxRadius && out.length < 64; dx++) {
      if (dx * dx + dy * dy > maxRadius * maxRadius) continue;
      const x = world.wrap(cx + dx);
      const y = world.wrap(cy + dy);
      const ci = world.idx(x, y);
      if (world.cells[ci] !== Cell.FLOOR || world.aptMask[ci]) continue;
      for (let i = 0; i < FOG_DIRS_X.length; i++) {
        const ni = world.idx(world.wrap(x + FOG_DIRS_X[i]), world.wrap(y + FOG_DIRS_Y[i]));
        if (world.cells[ni] === Cell.WALL) {
          pushVeretarLeakCandidate(world, out, ci, cx, cy, maxRadius);
          break;
        }
      }
    }
  }

  return out;
}

/* ── Spawn monsters in corridors ──────────────────────────────── */
function spawnMonsters(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  samosborCount: number,
  variant: ActiveSamosborVariant,
  floor: FloorLevel,
): void {
  const corridorCells: number[] = [];
  for (let i = 0; i < 5000; i++) {
    const ci = Math.floor(Math.random() * W * W);
    if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] < 0) {
      corridorCells.push(ci);
    }
  }

  const count = Math.max(1, Math.round((MONSTERS_PER_SAMOSBOR + Math.floor(samosborCount * 1.5)) * variant.spawnMult));
  const slots = entitySpawnSlots(entities, EntityType.MONSTER, count);
  for (let i = 0; i < slots && corridorCells.length > 0; i++) {
    const ci = corridorCells.splice(Math.floor(Math.random() * corridorCells.length), 1)[0];
    const kind = pickMonsterKindForWave(floor, samosborCount);
    entities.push(createMonster(world, nextId, kind, (ci % W) + 0.5, Math.floor(ci / W) + 0.5, floor));
  }
}

/* ── Spawn an extra map-wide monster pulse ───────────────────── */
function spawnRandomMapMonsters(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  samosborCount: number,
  variant: ActiveSamosborVariant,
  floor: FloorLevel,
): void {
  const target = Math.max(1, Math.round(RANDOM_MAP_MONSTERS_PER_SAMOSBOR * variant.spawnMult));
  const slots = entitySpawnSlots(entities, EntityType.MONSTER, target);
  if (slots <= 0) return;
  let spawned = 0;

  for (let attempt = 0; attempt < 5000 && spawned < slots; attempt++) {
    const ci = Math.floor(Math.random() * W * W);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    // Skip apartment rooms
    const rid = world.roomMap[ci];
    if (rid >= 0 && rid < world.apartmentRoomCount) continue;

    const kind = pickMonsterKindForWave(floor, samosborCount);
    entities.push(createMonster(world, nextId, kind, (ci % W) + 0.5, Math.floor(ci / W) + 0.5, floor));
    spawned++;
  }
}

function stampVeretarAreaLeak(world: World, cx: number, cy: number, radius: number): number {
  let placed = 0;
  let fogDirty = false;
  const target = 1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.18 ? 1 : 0);
  const maxRadius = Math.max(4, radius + 4);
  const candidates = collectVeretarLeakCandidates(world, cx, cy, maxRadius);
  for (let attempt = 0; attempt < 96 && placed < target; attempt++) {
    const ci = candidates.length > 0
      ? candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]
      : world.idx(world.wrap(cx + rng(-maxRadius, maxRadius)), world.wrap(cy + rng(-maxRadius, maxRadius)));
    const x = ci % W;
    const y = (ci / W) | 0;
    if (world.aptMask[ci]) continue;
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) continue;
    const seed = 91_000 + ci + placed * 977;
    stampMark(world, x, y, Math.random(), Math.random(), 0.44 + Math.random() * 0.24, MarkType.SPLAT, seed, 244, 241, 223, 150);
    const door = world.doors.get(ci);
    if (door) {
      if (door.state === DoorState.CLOSED) door.state = DoorState.OPEN;
      if (door.state === DoorState.OPEN || door.state === DoorState.HERMETIC_OPEN) door.timer = Math.max(door.timer, 22);
    }
    if (world.fog[ci] < 150) {
      world.fog[ci] = 150;
      fogDirty = true;
    }
    placed++;
  }
  if (fogDirty) world.markFogDirty();
  lastVeretarAreaLeaks = placed;
  lastVeretarAreaLeakAt = knownSamosborTime;
  return placed;
}

/* ── Capture warned zone with фиолетовый туман ───────────────── */
function captureZone(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  state: GameState,
  variant: ActiveSamosborVariant,
  preferredZoneId = -1,
  warningGreenSourceCount = 0,
  warningWrongDoorIdx = -1,
): number {
  // Pick a random non-SAMOSBOR zone
  const preferredZone = preferredZoneId >= 0 ? world.zones[preferredZoneId] : undefined;
  const candidates = world.zones.filter(z => z.faction !== ZoneFaction.SAMOSBOR);
  if (candidates.length === 0) return -1;

  const zone = preferredZone && preferredZone.faction !== ZoneFaction.SAMOSBOR
    ? preferredZone
    : candidates[Math.floor(Math.random() * candidates.length)];
  const previousFaction = zone.faction;
  zone.faction = ZoneFaction.SAMOSBOR;
  zone.fogged = true;
  const istotit = isIstotit(variant);
  const maronary = isMaronary(variant);

  // Seed fog at zone center
  const ci = world.idx(zone.cx, zone.cy);
  let fogDirty = false;
  let wallDirty = false;
  let floorDirty = false;
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.DOOR) {
    if (world.fog[ci] !== 255) {
      world.fog[ci] = 255;
      fogDirty = true;
    }
  }
  // Seed fog in a small radius around center. Variant multiplier changes only this bounded seed.
  const fogRadius = Math.max(2, Math.min(7, Math.round(5 * Math.sqrt(variant.fogSeedMult))));
  const fogRadiusSq = fogRadius * fogRadius;
  const fogStrength = Math.max(90, Math.min(230, Math.round(200 * variant.fogSeedMult)));
  const markHellMeat = state.currentFloor === FloorLevel.HELL && variant.modifiers.some(m => m.meatWallsOnHell);
  let veretarAreaLeaks = 0;
  for (let dy = -fogRadius; dy <= fogRadius; dy++) {
    for (let dx = -fogRadius; dx <= fogRadius; dx++) {
      if (dx * dx + dy * dy > fogRadiusSq) continue;
      const fi = world.idx(world.wrap(zone.cx + dx), world.wrap(zone.cy + dy));
      if (world.cells[fi] === Cell.FLOOR) {
        if (world.fog[fi] !== fogStrength) {
          world.fog[fi] = fogStrength;
          fogDirty = true;
        }
        if (markHellMeat) {
          if (world.floorTex[fi] !== Tex.F_MEAT) {
            world.floorTex[fi] = Tex.F_MEAT;
            floorDirty = true;
          }
        }
      } else if (markHellMeat && world.cells[fi] === Cell.WALL) {
        if (world.wallTex[fi] !== Tex.MEAT) {
          world.wallTex[fi] = Tex.MEAT;
          wallDirty = true;
        }
      }
    }
  }
  if (isVeretar(variant) || variant.modifiers.some(m => m.id === 'area_leak')) {
    veretarAreaLeaks = stampVeretarAreaLeak(world, zone.cx, zone.cy, fogRadius);
  }
  if (fogDirty) world.markFogDirty();
  if (wallDirty) world.markWallTexDirty();
  if (floorDirty) world.markFloorTexDirty();

  // Spawn fog boss at zone center (10% chance Матка, otherwise random boss)
  const isMatka = Math.random() < 0.1;
  const bossKind = istotit ? MonsterKind.EYE : isMatka ? MonsterKind.MATKA :
    [MonsterKind.BETONNIK, MonsterKind.REBAR, MonsterKind.NIGHTMARE][Math.floor(Math.random() * 3)];
  const bossDef = MONSTERS[bossKind];
  const zoneLevel = zone.level ?? 1;
  const rpg = randomRPG(zoneLevel + 3); // boss is stronger
  const hpBase = scaleMonsterHp(bossDef.hp, zoneLevel + 3);
  const hpFinal = Math.round(hpBase * (1 + 0.1 * rpg.str) * (istotit ? 1.35 : 2)); // lighter boss during Istotit
  // Find a walkable cell near zone center for boss spawn
  let bx = zone.cx, by = zone.cy;
  for (let r = 0; r < 10; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const bi = world.idx(world.wrap(zone.cx + dx), world.wrap(zone.cy + dy));
        if (world.cells[bi] === Cell.FLOOR) { bx = world.wrap(zone.cx + dx); by = world.wrap(zone.cy + dy); r = 99; break; }
      }
      if (r >= 99) break;
    }
  }
  if (!canSpawnEntityType(entities, EntityType.MONSTER)) return zone.id;
  const bossId = nextId.v++;
  const boss: Entity = {
    id: bossId,
    type: EntityType.MONSTER,
    x: bx + 0.5, y: by + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(bossDef.speed, zoneLevel),
    sprite: bossDef.sprite,
    spriteScale: 1.5,

    hp: hpFinal,
    maxHp: hpFinal,
    monsterKind: bossKind,
    attackCd: bossDef.attackRate,
    ai: { goal: AIGoal.HUNT, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg,
    isFogBoss: true,
    fogBossZone: zone.id,
  };
  entities.push(boss);

  const extraEyeSlots = entitySpawnSlots(entities, EntityType.MONSTER, variant.extraEyes);
  for (let i = 0; i < extraEyeSlots; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const ex = world.wrap(zone.cx + rng(-8, 8));
      const ey = world.wrap(zone.cy + rng(-8, 8));
      const ei = world.idx(ex, ey);
      if (world.cells[ei] !== Cell.FLOOR) continue;
      entities.push(createMonster(world, nextId, MonsterKind.EYE, ex + 0.5, ey + 0.5, state.currentFloor, true));
      break;
    }
  }

  const zoneLine = istotit
    ? `Зона ${zone.id + 1}: Истотит держит жёлтые гермы. Двери не трогать.`
    : maronary
      ? `Зона ${zone.id + 1}: Маронарий. Зелёный источник и повтор двери на карте.`
    : isVeretar(variant)
      ? `Зона ${zone.id + 1}: ${variant.def.displayName}. Белое пятно лезет через окно.`
    : `Зона ${zone.id + 1}: ${variant.def.displayName}. Туман пошёл по щелям.`;
  state.msgs.push(msg(zoneLine, state.time, variant.def.tint));
  publishEvent(state, {
    type: 'samosbor_zone_captured',
    zoneId: zone.id,
    x: zone.cx,
    y: zone.cy,
    severity: 5,
    privacy: 'public',
    tags: [
      ...samosborEventTags(variant, ['samosbor', 'zone', 'fog', 'danger'], warningWrongDoorIdx >= 0),
      ...(veretarAreaLeaks > 0 ? ['area_leak'] : []),
    ].slice(0, 8),
    data: {
      previousFaction,
      newFaction: ZoneFaction.SAMOSBOR,
      zoneLevel,
      variantId: variant.def.id,
      areaLeaks: veretarAreaLeaks,
      greenSourceCount: warningGreenSourceCount,
      wrongDoorIdx: warningWrongDoorIdx >= 0 ? warningWrongDoorIdx : undefined,
    },
  });
  const bossLine = istotit
    ? `Глаз ведомости открылся в зоне ${zone.id + 1}. Убейте его, чтобы туман отпустил герму.`
    : maronary
      ? `Маронарий вывел крупную тварь в зоне ${zone.id + 1}. Убейте её или уходите от повторённой двери.`
    : isVeretar(variant)
      ? `Тварь у белого окна появилась в зоне ${zone.id + 1}. Убейте её, чтобы проход не ушёл в пятно.`
    : `Крупная тварь вышла из тумана в зоне ${zone.id + 1}. Убейте её или уходите за герму.`;
  state.msgs.push(msg(bossLine, state.time, istotit || maronary || isVeretar(variant) ? variant.def.tint : '#f4a'));
  publishEvent(state, {
    type: 'fog_boss_spawned',
    zoneId: zone.id,
    x: bx + 0.5,
    y: by + 0.5,
    targetId: bossId,
    targetName: MONSTERS[bossKind]?.name ?? 'Босс тумана',
    monsterKind: bossKind,
    severity: 4,
    privacy: 'public',
    tags: ['samosbor', 'fog', 'boss', `samosbor_${variant.def.id}`],
    data: { hp: hpFinal, zoneLevel, variantId: variant.def.id, bossTitle: istotit ? 'Глаз ведомости' : isVeretar(variant) ? 'Тварь у белого окна' : undefined },
  });
  return zone.id;
}

/* ── Spread fog one tick — cheap random-cell approach ────────── */
/* Pick N random cells; if a cell has fog, spread to a random    */
/* walkable neighbour. Runs every frame, universally.            */
function spreadFog(world: World): void {
  const total = W * W;
  let fogDirty = false;

  for (let s = 0; s < FOG_SAMPLES_PER_TICK; s++) {
    const ci = (Math.random() * total) | 0;
    if (world.fog[ci] < 50) continue;

    // Strengthen this cell a bit
    if (world.fog[ci] < 255) {
      world.fog[ci] = Math.min(255, world.fog[ci] + 2) as number;
      fogDirty = true;
    }

    // Pick a random neighbour
    const dir = (Math.random() * 4) | 0;
    const dx = FOG_DIRS_X[dir];
    const dy = FOG_DIRS_Y[dir];
    const x = ci % W, y = (ci / W) | 0;
    const ni = world.idx(x + dx, y + dy);

    if (world.fog[ni] > 0) continue;          // already fogged
    if (world.cells[ni] === Cell.DOOR) continue; // doors block fog
    if (world.cells[ni] !== Cell.FLOOR) continue;

    world.fog[ni] = 128 + ((Math.random() * 127) | 0);
    fogDirty = true;
  }
  if (fogDirty) world.markFogDirty();
}

/* ── Clear fog when fog boss is killed ────────────────────────── */
export function clearFogInZone(world: World, zoneId: number, msgs: Msg[], time: number, state?: GameState): void {
  const zone = world.zones[zoneId];
  if (!zone) return;
  zone.fogged = false;
  // Clear all fog cells belonging to this zone
  let fogDirty = false;
  for (let i = 0; i < W * W; i++) {
    if (world.zoneMap[i] === zoneId && world.fog[i] !== 0) {
      world.fog[i] = 0;
      fogDirty = true;
    }
  }
  if (fogDirty) world.markFogDirty();
  msgs.push(msg(
    `Туман в зоне ${zoneId} ушёл. Ликвидаторы могут заходить.`,
    time, '#4f4',
  ));
  if (state) {
    publishEvent(state, {
      type: 'fog_boss_killed',
      zoneId,
      x: zone.cx,
      y: zone.cy,
      severity: 5,
      privacy: 'public',
      tags: ['samosbor', 'fog', 'boss', 'clear'],
    });
  }
}

/* ── Spawn monsters in fogged areas during samosbor ──────────── */
let fogSpawnAccum = 0;
function spawnFogMonsters(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  samosborCount: number,
  variant: ActiveSamosborVariant,
  floor: FloorLevel,
): void {
  if (!canSpawnEntityType(entities, EntityType.MONSTER)) return;

  // Find a random fogged floor cell
  const foggedCells: number[] = [];
  for (let attempt = 0; attempt < 500; attempt++) {
    const ci = Math.floor(Math.random() * W * W);
    if (world.fog[ci] > 100 && world.cells[ci] === Cell.FLOOR && world.roomMap[ci] < 0) {
      foggedCells.push(ci);
      if (foggedCells.length >= 3) break;
    }
  }
  if (foggedCells.length === 0) return;

  const ci = foggedCells[Math.floor(Math.random() * foggedCells.length)];
  const kind = variant.extraEyes > 0 && Math.random() < 0.25
    ? MonsterKind.EYE
    : pickMonsterKindForWave(floor, samosborCount);
  entities.push(createMonster(world, nextId, kind, (ci % W) + 0.5, Math.floor(ci / W) + 0.5, floor));
}

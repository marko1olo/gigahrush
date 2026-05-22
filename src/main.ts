/* ── ГИГАХРУЩ — main entry point ──────────────────────────────── */
import './index.css';
import { registerPwaServiceWorker } from './pwa';

import {
  W, Cell, DoorState, FloorLevel, Tex, RoomType, LiftDirection, ItemType,
  type Entity, type GameClock, type GameState, type Item, type Needs, type Quest, type RPGStats, type WorldContainer,
  type PlayerDamageSourceKind, type WorldEventPrivacy, type WorldEventSeverity,
  EntityType, Faction, MonsterKind, Occupation, ProjType, QuestType, AIGoal,
  msg, setMsgClock,
} from './core/types';
import { World, replaceWorldFromGeneration } from './core/world';
import { randSeed } from './core/rand';
import { priestDeathCurse } from './gen/living/temple';
import { updateProceduralScreens } from './gen/procedural_screens';
import { generateProceduralFloor } from './gen/procedural_floor';
import { generateDesignFloor } from './gen/design_floors/manifest';
import { updateKvPopulation } from './gen/kvartiry';
import {
  FLOOR_MESSAGE_COLORS,
  FLOOR_NAMES,
  generateFloor,
  isFloorLevel,
  nextFloorEntrySamosborTimer,
  resetGeneratedFloorPopulationState,
  type FloorGeneration,
} from './gen/floor_manifest';
import { generateTextures } from './render/textures';
import { generateSprites } from './render/sprites';
import { Spr, monsterSpr } from './render/sprite_index';
import {
  SCR_W, SCR_H, initWebGL, renderSceneGL, updateWorldData, updateDynamicData,
  disposeWebGL, setDynamicSkyTexture, type DynamicSkyTexture,
} from './render/webgl';
import { drawHUD } from './render/hud';
import {
  spawnBloodHit, spawnDeathPool, updateBloodTrails, updateParticles, particles,
  spawnProjectileBodyImpact, spawnProjectileFloorImpact, spawnProjectileWallImpact, isEnergyProjectileImpact,
} from './render/blood';
import { stampMark, MarkType } from './render/marks';
import { updateNeeds } from './systems/needs';
import { updateAI, tryMonsterProjectileStagger, getAiSchedulerStats, type AiSchedulerStats } from './systems/ai';
import { generateTalkText, generateNpcTradeItems } from './data/dialogue';
import { updateSamosbor, rebuildWorld, clearFogInZone, updateIstotitBellCompulsion } from './systems/samosbor';
import { cleanCellHazardsNear, getCellHazardMoveMultiplier, tickCellHazards } from './systems/cell_hazards';
import { adjustMonsterProjectileDamage, recordMonsterMeleeDeath, recordMonsterProjectileDeath } from './systems/monster_counterplay';
import { applyMonsterArmorHit } from './systems/monster_armor';
import {
  pickupNearby, useItem, dropItem, getWeaponStats,
  consumeDurability, consumeAmmo, consumeToolDurability, getEquippedToolDurability,
  updateInventoryConditions,
} from './systems/inventory';
import { tryHandleMaronaryShavingHandoff } from './systems/maronary_shaving';
import { createInput, bindInput } from './input';
import { createMobileControls, type MobileControls, type MobileMenuId } from './mobile';
import {
  CONTROL_ACTIONS,
  beginControlCapture,
  cancelControlCapture,
  controlBindingLabel,
  getControlCaptureAction,
  resetControlBinding,
} from './systems/controls';
import { freshNeeds, ITEMS, WEAPON_STATS } from './data/catalog';
import { getStack } from './data/items';
import { entityDisplayName } from './entities/monster';
import { ensureProceduralSpriteSeeds } from './entities/procedural_visuals';
import {
  playFootstep, playAttack, playDoor,
  playGunshot, playShotgun, playNailgun, playBreak,
  playFleshHit, playPsiCast,
  playPPSh, playChainsaw, playMachinegun, playExplosion,
  playGauss, playPlasma, playBFG, playFlame, playPsiBeam,
  playProjectileImpact, playEnergyImpact, playProjectileBodyHit,
  startAmbientDrone, setListenerPos, playSoundAt,
} from './systems/audio';
import { offerQuest, checkQuests, checkTalkQuest, notifyKill, notifyNpcKill } from './systems/quests';
import { applyContractFloorHooks, notifyCleanupToolUse } from './systems/contracts';
import {
  freshRPG, awardXP, xpForMonsterKill, xpForNpcKill,
  meleeDamage, agiSpeedMult, agiAttackSpeedMult,
  spendAttrPoint, getMaxHp, getMaxPsi, randomRPG,
} from './systems/rpg';
import {
  applyPaupsinaWeb,
  isPaupsinaWebCuttingWeapon,
  normalizePlayerStatuses,
  reducePaupsinaWeb,
  updateZhelemishSkinStatus,
  zhelemishMoveMult,
} from './systems/status';
import {
  DEBUG_COMMAND_COUNT,
  execDebugCommand,
  moveDebugInfoPage,
  resetDebugInfoPage,
  type DebugCommandAction,
} from './systems/debug';
import { debugOnePunchMeleeDamage, isDebugOnePunchManEnabled, keepDebugOnePunchManAlive } from './systems/debug_cheats';
import { formatLastPlayerDamageCause, hasFreshPlayerDamageRecord, recordPlayerDamage } from './systems/damage';
import { createWorldEventState, normalizeWorldEventState, publishEvent } from './systems/events';
import {
  publishExplosionNoise,
  publishFootstepNoise,
  publishWeaponNoise,
  resetNoiseRecords,
} from './systems/noise';
import { entitySpawnSlots } from './systems/entity_limits';
import { clearRoomMemory, tickRoomMemory } from './systems/room_memory';
import { UV_SPOTLIGHT_ID, useUvSpotlight } from './systems/uv_spotlight';
import { isRidingRailTrain, updateRailTrains } from './systems/rail_trains';
import { updateCarnivorousFungus } from './systems/carnivorous_fungus';
import { hladonColdMoveMultiplier, updateHladonColdPocket } from './systems/hladon';
import { tryCoverSeroburmalineSource, updateSeroburmalineExposure } from './systems/seroburmaline';
import { updateRouteCues } from './systems/route_cues';
import { updateParitelSteamBridge } from './gen/maintenance/paritel_steam_bridge';
import { updateBetonoedShortcut } from './gen/maintenance/betonoed_shortcut';
import {
  closeEmergencyPanelMenu,
  handleEmergencyPanelMenuInput,
  isEmergencyPanelMenuOpen,
} from './systems/emergency_panels';
import {
  proceduralSmogFogDensityBonus,
  proceduralAnomalyEventData,
  proceduralAnomalyEventTags,
  updateProceduralAnomalies,
} from './systems/procedural_anomalies';
import {
  ensureFloorInstanceState,
  floorInstanceLabel,
  getActiveFloorInstance,
  resolveElevatorRoute,
  setFloorInstanceState,
  spreadElevatorInstanceRumor,
} from './systems/floor_instances';
import {
  adjustFloorRunSamosborTimer,
  commitFloorRunEntry,
  currentFloorRunEntry,
  ensureFloorRunState,
  floorRunArrivalLead,
  floorRunEntryDanger,
  floorRunSaveHasRestorableRoute,
  floorRunEntryAllowsNpcs,
  floorRunEntryKindLabel,
  floorRunEntryLiftLabel,
  floorRunEntryRole,
  floorRunEntryRouteId,
  forceFloorRunStory,
  forceProceduralFloorAnomaly,
  resolveFloorRunRoute,
  setFloorRunState,
} from './systems/procedural_floors';
import {
  clearLiftArachnaActive,
  ensureLiftArachnaState,
  notifyLiftArachnaNoise,
  resolveLiftArachnaDeparture,
  setLiftArachnaState,
  tryStartLiftArachnaEncounter,
  updateLiftArachnaEncounter,
} from './systems/lift_arachna';
import {
  clearPseudoliftActive,
  preparePseudoliftForCurrentFloor,
  setPseudoliftState,
  updatePseudolifts,
} from './systems/pseudolift';
import { clearWrongDoorRemaps, tryUseWrongDoorRemap, updateWrongDoorRemaps } from './systems/wrong_door';
import {
  containerAccessInfo,
  ensureRoomContainers,
  putIntoContainer,
  restoreValidContainers,
  takeFromContainer,
  tickContainerAudits,
} from './systems/containers';
import { isShelterTallyItem, publishShelterTallyEvent } from './systems/shelter_tally';
import { normalizeGameEconomy, primeTradePriceCache } from './systems/economy';
import { buyFromNpc, sellToNpc, type TradeResult } from './systems/trade';
import {
  ensureBankingState,
  normalizeBankingState,
  tickBankingInterest,
  type BankingState,
} from './systems/banking';
import {
  ensureStockMarketState,
  normalizeGameStockMarket,
  tickStockMarket,
} from './systems/stock_market';
import { ensureProductionRooms, setProductionState, tickProduction } from './systems/production';
import {
  castInstantSpell, updatePsiEffects, psiAoeExplosion,
  isNoClipActive, resetPsiState,
} from './systems/psi';
import { fireDeletionBeam } from './systems/weapon_beams';
import {
  ENTITY_MASK_ACTOR,
  ENTITY_MASK_ITEM_DROP,
  rebuildEntityIndex,
  rebuildEntityIndexAfterSpawnCleanup,
  rebuildEntityIndexForSimulation,
  getEntityIndex,
  type EntityIndexDebugStats,
} from './systems/entity_index';
import {
  applyDamageRelationPenalty,
  updateFactionCapture, initFactionControl,
  zoneFactionToFaction,
  updateFactionActivity,
} from './systems/factions';
import {
  captureAlifeFloorState,
  currentAlifeFloorKey,
  materializeAlifeFloorPopulation,
  recordAlifeNpcDeath,
  setAlifeState,
} from './systems/alife';
import {
  PLAYER_SELF_RELATION,
  PLAYER_START_KARMA,
  addKarma,
  recordEntityKill,
} from './systems/alife_rating';
import {
  recordFactionClashPlayerHit,
  recordFactionEventLootTaken,
  tryReportLiquidatorCultClashAftermath,
  updateCultProcessionCompulsion,
} from './systems/faction_events';
import {
  bindNetSphereInput,
  closeNetSphere,
  getNetSphereSnapshot,
  isNetSphereOpen,
  openNetSphere,
  reportNetSphereEvent,
  tickNetSphere,
} from './systems/net_sphere';
import {
  claimNetTerminalGenFleshDrop,
  closeNetTerminalGen,
  ensureNetTerminalGenFleshDrop,
  ensureNetTerminalGenState,
  isNetTerminalGenOpen,
  placeNetTerminalGenTerminalsForCurrentFloor,
  setNetTerminalGenState,
} from './systems/net_terminal_gen';
import {
  activateInteraction,
  closeInteractableOverlay,
  findInteractionTarget,
  handleInteractableOverlayInput,
  isInteractableOverlayOpen,
  placeGeneratedInteractablesForCurrentFloor,
} from './systems/interactions';
import {
  adjustMapEditorZoom,
  applyCurrentMapEditorBrush,
  activateMapEditorMode,
  backMapEditorMode,
  closeMapEditor,
  ensureMapEditorPatchState,
  isMapEditorOpen,
  moveMapEditorMode,
  openMapEditor,
  replayMapEditorPatchForCurrentFloor,
  setMapEditorPatchState,
} from './systems/map_editor';
import { createGameSavePayload, saveShapeVersionStatus } from './systems/save_runtime';
import { addFactionRel, addFactionRelMutual, initFactionRelations } from './data/relations';
import { type DeathCam, initDeathCam, updateDeathCam, getDeathCamAngle, getDeathCamPitch } from './systems/death';
import { onHeraldKilled, onCreatorKilled, onHellArrival, tryCreateVoiceQuest, onVoidEntry } from './data/plot_events';
import { randomTip } from './data/tips';
import {
  PROCEDURAL_FLOOR_ZS,
  proceduralFloorKey,
  type FloorAnomalyId,
  type ProceduralFloorSpec,
} from './data/procedural_floors';
import { type DesignFloorId } from './data/design_floors';

/* ── Canvas setup ─────────────────────────────────────────────── */
const canvas = document.getElementById('game') as HTMLCanvasElement;
const hudCanvas = document.getElementById('hud') as HTMLCanvasElement;
const ctx = hudCanvas.getContext('2d')!;
registerPwaServiceWorker();
const PLAYER_NAME_KEY = 'gigahrush_player_name';
const NET_GEN_NAME_RE = /^NET-[A-Z0-9-]{4,28}$/;
let started = false;
let playerNickname = loadPlayerNickname();
let mobileControls: MobileControls | null = null;

function looksLikeNetGenName(value: string): boolean {
  const clean = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
  return NET_GEN_NAME_RE.test(clean);
}

function cleanPlayerNickname(value: string): string {
  const clean = value
    .replace(/[\u0000-\u001f\u007f<>`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
  return looksLikeNetGenName(clean) ? '' : clean;
}

function loadPlayerNickname(): string {
  try {
    return cleanPlayerNickname(localStorage.getItem(PLAYER_NAME_KEY) ?? '');
  } catch {
    return '';
  }
}

function savePlayerNickname(value: string): string {
  const next = cleanPlayerNickname(value) || 'Жилец';
  playerNickname = next;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, next);
  } catch {
    // Local storage can be unavailable; the name still stays for this run.
  }
  return next;
}

function playerDisplayName(): string {
  return playerNickname || 'Жилец';
}

function playerAlifeFields(source: Partial<Entity> = {}): Pick<Entity, 'persistentNpcId' | 'playerRelation' | 'karma' | 'kills' | 'npcKills' | 'monsterKills'> {
  return {
    persistentNpcId: 'player',
    playerRelation: PLAYER_SELF_RELATION,
    karma: clampInt(source.karma, PLAYER_START_KARMA, -128, 128),
    kills: clampInt(source.kills, 0, 0, 1_000_000),
    npcKills: clampInt(source.npcKills, 0, 0, 1_000_000),
    monsterKills: clampInt(source.monsterKills, 0, 0, 1_000_000),
  };
}

function resize() {
  const viewport = window.visualViewport;
  const width = Math.max(1, Math.round(
    canvas.clientWidth ||
    document.documentElement.clientWidth ||
    viewport?.width ||
    window.innerWidth,
  ));
  const height = Math.max(1, Math.round(
    canvas.clientHeight ||
    document.documentElement.clientHeight ||
    viewport?.height ||
    window.innerHeight,
  ));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  if (hudCanvas.width !== width) hudCanvas.width = width;
  if (hudCanvas.height !== height) hudCanvas.height = height;
  mobileControls?.refresh();
}

function scheduleResize(): void {
  resize();
  requestAnimationFrame(resize);
  window.setTimeout(resize, 80);
  window.setTimeout(resize, 250);
}

window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);
window.addEventListener('focus', scheduleResize);
window.addEventListener('pageshow', scheduleResize);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleResize();
});
window.visualViewport?.addEventListener('resize', scheduleResize);
window.visualViewport?.addEventListener('scroll', scheduleResize);
document.addEventListener('fullscreenchange', scheduleResize);
document.addEventListener('webkitfullscreenchange', scheduleResize);
if (typeof ResizeObserver === 'function') {
  const viewportObserver = new ResizeObserver(scheduleResize);
  viewportObserver.observe(document.documentElement);
  viewportObserver.observe(document.body);
}
scheduleResize();

/* ── Generate assets ──────────────────────────────────────────── */
const textures = generateTextures();
const sprites  = generateSprites();

/* ── Game initialization ──────────────────────────────────────── */
let world: World;
let entities: Entity[];
let player: Entity;
let state: GameState;
let nextEntityId = { v: 1 };
let prevPlayerHp = 100; // track HP changes for damage flash
let lastProjectileHitMsgTick = -999;
let deathCam: DeathCam | null = null;
let pendingLoad: (() => void) | null = null; // deferred heavy generation callback
let pendingLoadDrawn = false; // true = loading screen was painted, next frame runs the callback
let currentTip = randomTip();
let activeSkyProvider: (DynamicSkyTexture & { update(deltaSeconds: number): boolean }) | null = null;
let lastVoidReturnPortalHintTick = -9999;

interface VoidReturnPortalState {
  active: boolean;
  used: boolean;
  cell: number;
  openedAt: number;
  openedTick: number;
  creatorId: number;
  playerMustLeaveCell?: boolean;
  enteredFromFloor?: FloorLevel;
  usedAt?: number;
  voidSpikeCarried?: boolean;
  voidSpikeResolved?: boolean;
}

type VoidReturnPortalHost = GameState & {
  voidReturnPortal?: VoidReturnPortalState;
  voidEntryFromFloor?: FloorLevel;
};

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeVoidReturnPortalState(input: unknown): VoidReturnPortalState | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const src = input as Partial<VoidReturnPortalState>;
  const cell = Math.floor(finiteNumber(src.cell, -1));
  if (cell < 0 || cell >= W * W) return undefined;
  const enteredFromFloor = isFloorLevel(src.enteredFromFloor) ? src.enteredFromFloor : undefined;
  return {
    active: src.active === true,
    used: src.used === true,
    cell,
    openedAt: finiteNumber(src.openedAt, 0),
    openedTick: Math.max(0, Math.floor(finiteNumber(src.openedTick, 0))),
    creatorId: Math.floor(finiteNumber(src.creatorId, -1)),
    playerMustLeaveCell: src.playerMustLeaveCell === true,
    enteredFromFloor,
    usedAt: typeof src.usedAt === 'number' && Number.isFinite(src.usedAt) ? src.usedAt : undefined,
    voidSpikeCarried: src.voidSpikeCarried === true,
    voidSpikeResolved: src.voidSpikeResolved === true,
  };
}

function getVoidReturnPortalState(targetState: GameState = state): VoidReturnPortalState | undefined {
  const host = targetState as VoidReturnPortalHost;
  const normalized = normalizeVoidReturnPortalState(host.voidReturnPortal);
  if (normalized) host.voidReturnPortal = normalized;
  else delete host.voidReturnPortal;
  return normalized;
}

function setVoidReturnPortalState(targetState: GameState, input: unknown): void {
  const host = targetState as VoidReturnPortalHost;
  const normalized = normalizeVoidReturnPortalState(input);
  if (normalized) host.voidReturnPortal = normalized;
  else delete host.voidReturnPortal;
}

function clearVoidReturnPortalState(targetState: GameState = state): void {
  delete (targetState as VoidReturnPortalHost).voidReturnPortal;
  lastVoidReturnPortalHintTick = -9999;
}

function setVoidEntryFromFloor(targetState: GameState, value: unknown): void {
  const host = targetState as VoidReturnPortalHost;
  if (isFloorLevel(value)) host.voidEntryFromFloor = value;
  else delete host.voidEntryFromFloor;
}

function voidReturnPortalStateForSave(targetState: GameState): VoidReturnPortalState | undefined {
  const portal = getVoidReturnPortalState(targetState);
  return portal ? { ...portal } : undefined;
}

function hasVoidSpike(): boolean {
  return (player.inventory ?? []).some(item => item.defId === 'void_spike' && item.count > 0);
}

function voidSpikeResolved(): boolean {
  return state.quests.some(q =>
    q.type === QuestType.FETCH &&
    q.targetItem === 'void_spike' &&
    q.done &&
    !q.failed);
}

function creatorKillQuestSatisfied(): boolean {
  return state.quests.some(q =>
    q.type === QuestType.KILL &&
    q.targetMonsterKind === MonsterKind.CREATOR &&
    (q.done || (q.killCount ?? 0) >= (q.killNeeded ?? 1)));
}

function isVoidReturnPortalFloor(targetState: GameState = state): boolean {
  if (targetState.currentFloor !== FloorLevel.VOID) return false;
  const entry = currentFloorRunEntry(targetState);
  return !entry || (entry.storyFloor === FloorLevel.VOID && !entry.designFloorId && !entry.spec);
}

function removeCreatorFromResolvedVoid(): void {
  const portal = getVoidReturnPortalState();
  if (!portal?.active || portal.used || !isVoidReturnPortalFloor()) return;
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.CREATOR) {
      entities.splice(i, 1);
    }
  }
}

function restoreVoidReturnPortalForCurrentWorld(): boolean {
  let portal = getVoidReturnPortalState();
  if (!portal && isVoidReturnPortalFloor() && creatorKillQuestSatisfied()) {
    const creator = entities.find(e => e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.CREATOR);
    if (creator) {
      portal = {
        active: true,
        used: false,
        cell: world.idx(Math.floor(creator.x), Math.floor(creator.y)),
        openedAt: state.time,
        openedTick: state.tick,
        creatorId: creator.id,
      };
      (state as VoidReturnPortalHost).voidReturnPortal = portal;
    }
  }
  if (!portal?.active || portal.used || !isVoidReturnPortalFloor()) return false;
  const ci = portal.cell;
  world.cells[ci] = Cell.FLOOR;
  world.floorTex[ci] = Tex.PORTAL;
  world.wallTex[ci] = 0;
  world.markFloorTexDirty();
  removeCreatorFromResolvedVoid();
  return true;
}

function openVoidReturnPortalFromCreator(creator: Entity, enteredFromFloor?: FloorLevel): void {
  const cell = world.idx(Math.floor(creator.x), Math.floor(creator.y));
  const entryFloor = enteredFromFloor ?? (state as VoidReturnPortalHost).voidEntryFromFloor;
  const playerCell = world.idx(Math.floor(player.x), Math.floor(player.y));
  (state as VoidReturnPortalHost).voidReturnPortal = {
    active: true,
    used: false,
    cell,
    openedAt: state.time,
    openedTick: state.tick,
    creatorId: creator.id,
    playerMustLeaveCell: playerCell === cell,
    enteredFromFloor: entryFloor,
  };
  restoreVoidReturnPortalForCurrentWorld();
  const x = cell % W;
  const y = (cell / W) | 0;
  const zoneId = world.zoneMap[cell];
  state.msgs.push(msg('Портал возврата закреплён: переход сработает только в его центре.', state.time, '#0ff'));
  state.msgs.push(msg('Перед входом можно оставить Пустотный шип Жану, если он у вас.', state.time, '#8cf'));
  publishEvent(state, {
    type: 'floor_transition',
    floor: FloorLevel.VOID,
    zoneId,
    x: x + 0.5,
    y: y + 0.5,
    actorId: player.id,
    actorName: player.name,
    actorFaction: player.faction,
    targetId: creator.id,
    targetName: 'Портал возврата открыт',
    monsterKind: MonsterKind.CREATOR,
    severity: 5,
    privacy: 'local',
    tags: ['floor', 'floor_transition', 'void', 'return_portal', 'opened'],
    data: {
      portalCell: cell,
      portalX: x,
      portalY: y,
      creatorId: creator.id,
      enteredFromFloor: entryFloor,
    },
  });
}

function maybeShowVoidReturnPortalHint(playerCell: number): void {
  if (state.tick - lastVoidReturnPortalHintTick < 180) return;
  const portal = getVoidReturnPortalState();
  if (portal?.active && !portal.used) {
    const px = (portal.cell % W) + 0.5;
    const py = ((portal.cell / W) | 0) + 0.5;
    const d2 = world.dist2(player.x, player.y, px, py);
    if (d2 > 12 * 12) return;
    const dist = Math.max(0, Math.round(Math.sqrt(d2)));
    const consequence = hasVoidSpike()
      ? 'Шип у вас: Жан может забрать его до входа.'
      : voidSpikeResolved()
        ? 'Последствие оставлено здесь.'
        : 'Центр вернёт в жилую зону.';
    state.msgs.push(msg(`Портал возврата: ${dist}м. ${consequence}`, state.time, '#0ff'));
    lastVoidReturnPortalHintTick = state.tick;
    return;
  }
  if (world.floorTex[playerCell] === Tex.PORTAL) {
    state.msgs.push(msg('Эта текстура портала не является закреплённым возвратом.', state.time, '#888'));
    lastVoidReturnPortalHintTick = state.tick;
  }
}

function returnFromVoidPortalToLiving(portal: VoidReturnPortalState): void {
  portal.used = true;
  portal.usedAt = state.time;
  portal.voidSpikeCarried = hasVoidSpike();
  portal.voidSpikeResolved = voidSpikeResolved();

  const fromFloor = state.currentFloor;
  captureCurrentAlifeFloor();
  const savedInventory = player.inventory ? [...player.inventory] : [];
  const savedNeeds = player.needs ? { ...player.needs } : freshNeeds();
  const savedHp = player.hp ?? 100;
  const savedMaxHp = player.maxHp ?? 100;
  const savedWeapon = player.weapon ?? '';
  const savedTool = player.tool ?? '';
  const savedRpg = player.rpg ? { ...player.rpg } : freshRPG(1);
  const savedStatuses = player.statuses?.map(s => ({ ...s }));
  const savedMoney = player.money ?? 100;
  const savedAngle = player.angle;
  const portalCell = portal.cell;
  const openedAt = portal.openedAt;
  const openedTick = portal.openedTick;
  const creatorId = portal.creatorId;
  const enteredFromFloor = portal.enteredFromFloor;
  const voidSpikeWasCarried = portal.voidSpikeCarried;
  const voidSpikeWasResolved = portal.voidSpikeResolved;
  const voidSpikeTag = voidSpikeWasResolved ? 'void_spike_left' : voidSpikeWasCarried ? 'void_spike_carried' : 'void_spike_absent';

  state.currentFloor = FloorLevel.LIVING;
  state.gameWon = false;
  state.gameOver = false;
  deathCam = null;
  clearVoidReturnPortalState(state);
  setVoidEntryFromFloor(state, undefined);
  forceFloorRunStory(state, FloorLevel.LIVING);
  const floorInstances = ensureFloorInstanceState(state, FloorLevel.LIVING);
  floorInstances.current = null;
  floorInstances.lastStableFloor = FloorLevel.LIVING;
  state.msgs.push(msg(
    voidSpikeWasResolved
      ? 'Возврат принят. Последствие осталось в Пустоте. Жилая зона принимает вас обратно.'
      : voidSpikeWasCarried
        ? 'Возврат принят. Пустотный шип вернулся вместе с вами.'
        : 'Возврат принят. Пустота закрыла за вами центр. Жилая зона снова под ногами.',
    state.time,
    '#0f8',
  ));

  pendingLoad = () => {
    resetGeneratedFloorPopulationState();
    const gen = generateFloor(FloorLevel.LIVING);
    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
    materializeCurrentAlifeFloor();

    player = {
      id: nextEntityId.v++,
      type: EntityType.PLAYER,
      x: gen.spawnX,
      y: gen.spawnY,
      angle: savedAngle,
      pitch: 0,
      alive: true,
      speed: 3.0,
      sprite: 0,
      needs: savedNeeds,
      hp: savedHp,
      maxHp: savedMaxHp,
      inventory: savedInventory,
      weapon: savedWeapon,
      tool: savedTool,
      money: savedMoney,
      rpg: savedRpg,
      statuses: savedStatuses,
      name: playerDisplayName(),
      faction: Faction.PLAYER,
      ...playerAlifeFields(player),
    };
    entities.push(player);
    applyContractFloorHooks(state, world, entities, nextEntityId, player);
    prevPlayerHp = player.hp ?? 100;

    initFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    state.samosborTimer = adjustFloorRunSamosborTimer(state, nextFloorEntrySamosborTimer(FloorLevel.LIVING));
    state.samosborActive = false;
    floorTeleportCd = 0;
    resetPsiState();
    clearLiftArachnaActive(state);
    clearPseudoliftActive(state);

    publishEvent(state, {
      type: 'floor_transition',
      floor: FloorLevel.LIVING,
      zoneId: world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))],
      x: player.x,
      y: player.y,
      actorId: player.id,
      actorName: player.name,
      actorFaction: player.faction,
      targetName: 'Возврат в жилую зону',
      severity: 5,
      privacy: 'local',
      tags: ['floor', 'floor_transition', 'void', 'return_portal', 'used', 'freeplay', voidSpikeTag],
      data: {
        fromFloor,
        toFloor: FloorLevel.LIVING,
        portalCell,
        openedAt,
        openedTick,
        creatorId,
        enteredFromFloor,
        voidSpikeCarried: voidSpikeWasCarried,
        voidSpikeResolved: voidSpikeWasResolved,
      },
    });

    ensureRoomContainers(world, state.currentFloor);
    ensureProductionRooms(state, world);
    prepareEditableFloor();
    ensureProceduralSpriteSeeds(entities);
    setGeneratedDynamicSky(gen);
    updateWorldData(world);
  };
}

function tryUseVoidReturnPortal(playerCell: number): boolean {
  const portal = getVoidReturnPortalState();
  if (!portal?.active || portal.used || !isVoidReturnPortalFloor()) {
    maybeShowVoidReturnPortalHint(playerCell);
    return false;
  }
  if (playerCell !== portal.cell) {
    if (portal.playerMustLeaveCell) portal.playerMustLeaveCell = false;
    maybeShowVoidReturnPortalHint(playerCell);
    return false;
  }
  if (portal.playerMustLeaveCell) {
    if (state.tick - lastVoidReturnPortalHintTick >= 120) {
      state.msgs.push(msg('Портал раскрылся под ногами. Отойдите и войдите снова, когда будете готовы.', state.time, '#0ff'));
      lastVoidReturnPortalHintTick = state.tick;
    }
    return false;
  }

  returnFromVoidPortalToLiving(portal);
  return true;
}

interface SmokeDebugSnapshot {
  started: boolean;
  showDebug: boolean;
  debugSel: number;
  showQuests: boolean;
  showInventory: boolean;
  showLog: boolean;
  mapMode: number;
  mobileControlsEnabled: boolean;
  currentFloor: FloorLevel;
  questCount: number;
  playerWeapon: string;
  gameOver: boolean;
  playerAlive: boolean;
  playerHp: number;
  paused: boolean;
  playerX: number;
  playerY: number;
  samosborActive: boolean;
  netSphereOpen: boolean;
  netSphereStatus: string;
  netSphereStatusText: string;
  netSphereError: string;
  netSphereBusy: boolean;
  netSphereDraftLength: number;
  entityCount: number;
  liveActorCount: number;
  liveAiCount: number;
  npcCount: number;
  monsterCount: number;
  entityIndex: EntityIndexDebugStats;
  aiScheduler: AiSchedulerStats;
}

declare global {
  interface Window {
    __gigahrushSmokeState?: () => SmokeDebugSnapshot | null;
    __gigahrushStressSpawn?: (count: number) => SmokeDebugSnapshot | null;
  }
}

const smokeDebug = new URLSearchParams(window.location.search).has('smoke');

function installSmokeDebugHook(): void {
  if (!smokeDebug) return;
  window.__gigahrushSmokeState = () => {
    if (typeof state === 'undefined' || typeof player === 'undefined') return null;
    return smokeSnapshot();
  };
  window.__gigahrushStressSpawn = (count: number) => {
    if (typeof state === 'undefined' || typeof player === 'undefined') return null;
    spawnSmokeStressPopulation(Math.max(0, Math.min(12_000, Math.floor(count))));
    rebuildEntityIndex(entities, 'smoke_stress');
    return smokeSnapshot();
  };
}

function smokeSnapshot(): SmokeDebugSnapshot {
  let liveActorCount = 0;
  let liveAiCount = 0;
  let npcCount = 0;
  let monsterCount = 0;
  for (const e of entities) {
    if (!e.alive || (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER)) continue;
    liveActorCount++;
    if (e.ai) liveAiCount++;
    if (e.type === EntityType.NPC) npcCount++;
    else monsterCount++;
  }
  const netSphere = getNetSphereSnapshot();
  return {
      started,
      showDebug: state.showDebug,
      debugSel: state.debugSel,
      showQuests: state.showQuests,
      showInventory: state.showInventory,
      showLog: state.showLog,
      mapMode: state.mapMode,
      mobileControlsEnabled: mobileControls?.isEnabled() === true,
      currentFloor: state.currentFloor,
      questCount: state.quests.length,
      playerWeapon: player.weapon ?? '',
      gameOver: state.gameOver,
      playerAlive: player.alive,
      playerHp: player.hp ?? 0,
      paused: state.paused,
      playerX: player.x,
      playerY: player.y,
      samosborActive: state.samosborActive,
      netSphereOpen: netSphere.open,
      netSphereStatus: netSphere.status,
      netSphereStatusText: netSphere.statusText,
      netSphereError: netSphere.error,
      netSphereBusy: netSphere.busy,
      netSphereDraftLength: netSphere.draft.length,
      entityCount: entities.length,
      liveActorCount,
      liveAiCount,
      npcCount,
      monsterCount,
      entityIndex: getEntityIndex().getDebugStats(),
      aiScheduler: getAiSchedulerStats(),
  };
}

function spawnSmokeStressPopulation(count: number): void {
  if (count <= 0) return;
  const requested = Math.max(0, Math.floor(count));
  const npcAvailable = entitySpawnSlots(entities, EntityType.NPC, requested);
  const monsterAvailable = entitySpawnSlots(entities, EntityType.MONSTER, requested);
  let npcBudget = Math.min(npcAvailable, Math.floor(requested * 0.7));
  let monsterBudget = Math.min(monsterAvailable, requested - npcBudget);
  if (npcBudget + monsterBudget < requested) {
    const extraNpc = Math.min(npcAvailable - npcBudget, requested - npcBudget - monsterBudget);
    npcBudget += extraNpc;
  }
  if (npcBudget + monsterBudget < requested) {
    const extraMonster = Math.min(monsterAvailable - monsterBudget, requested - npcBudget - monsterBudget);
    monsterBudget += extraMonster;
  }
  const target = npcBudget + monsterBudget;
  if (target <= 0) return;
  const monsterKinds = [MonsterKind.ZOMBIE, MonsterKind.TVAR, MonsterKind.SBORKA, MonsterKind.SHADOW];
  let spawned = 0;
  for (let attempt = 0; attempt < target * 24 && spawned < target; attempt++) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * W);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
    if (world.dist2(player.x, player.y, x + 0.5, y + 0.5) < 8 * 8) continue;
    if (npcBudget > 0 && (monsterBudget <= 0 || npcBudget >= monsterBudget)) {
      entities.push({
        id: nextEntityId.v++,
        type: EntityType.NPC,
        x: x + 0.5,
        y: y + 0.5,
        angle: Math.random() * Math.PI * 2,
        pitch: 0,
        alive: true,
        speed: 1.05,
        sprite: Occupation.TRAVELER,
        spriteSeed: (state.tick + spawned * 2654435761) >>> 0,
        name: `Стресс-жилец ${spawned + 1}`,
        needs: freshNeeds(),
        hp: 60,
        maxHp: 60,
        money: 0,
        faction: spawned % 3 === 0 ? Faction.WILD : Faction.CITIZEN,
        occupation: Occupation.TRAVELER,
        questId: -1,
        isTraveler: true,
        ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: Math.random() * 4, combatScanCd: Math.random() * 1.5 },
        inventory: [],
        rpg: randomRPG(2),
      });
      npcBudget--;
    } else {
      const kind = monsterKinds[spawned % monsterKinds.length];
      entities.push({
        id: nextEntityId.v++,
        type: EntityType.MONSTER,
        x: x + 0.5,
        y: y + 0.5,
        angle: Math.random() * Math.PI * 2,
        pitch: 0,
        alive: true,
        speed: 1.1,
        sprite: monsterSpr(kind),
        spriteSeed: (state.tick ^ spawned * 1103515245) >>> 0,
        hp: 80,
        maxHp: 80,
        monsterKind: kind,
        attackCd: 0,
        ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: Math.random() * 4, combatScanCd: Math.random() * 1.5 },
        rpg: randomRPG(2),
      });
      monsterBudget--;
    }
    spawned++;
  }
  state.msgs.push(msg(`SMOKE stress AI: +${spawned}`, state.time, '#8ff'));
}

function setGeneratedDynamicSky(gen?: FloorGeneration): void {
  const sky = (gen as (FloorGeneration & { skyProvider?: DynamicSkyTexture & { update(deltaSeconds: number): boolean } }) | undefined)?.skyProvider ?? null;
  activeSkyProvider = sky;
  setDynamicSkyTexture(sky);
}

function updateGeneratedDynamicSky(dt: number): void {
  if (!activeSkyProvider) return;
  if (activeSkyProvider.update(dt) || activeSkyProvider.dirty) setDynamicSkyTexture(activeSkyProvider);
}

function replayMapEditorForCurrentFloor(): number {
  ensureMapEditorPatchState(state);
  return replayMapEditorPatchForCurrentFloor(world, entities, player, state, nextEntityId);
}

function placeNetTerminalGenContentForCurrentFloor(): void {
  ensureNetTerminalGenState(state);
  placeNetTerminalGenTerminalsForCurrentFloor(world, state);
  ensureNetTerminalGenFleshDrop(world, entities, nextEntityId, state);
  placeGeneratedInteractablesForCurrentFloor(world, state);
}

function prepareEditableFloor(): void {
  replayMapEditorForCurrentFloor();
  placeNetTerminalGenContentForCurrentFloor();
  preparePseudoliftForCurrentFloor(world, state);
}

function drawLoading(): void {
  currentTip = randomTip();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
  ctx.fillStyle = '#aaa';
  ctx.font = `${Math.round(hudCanvas.height / 20)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('ЗАГРУЗКА...', hudCanvas.width / 2, hudCanvas.height / 2);
  const tipSize = Math.max(14, Math.round(hudCanvas.height / 40));
  ctx.font = `${tipSize}px monospace`;
  ctx.fillStyle = '#777';
  const maxW = hudCanvas.width * 0.85;
  const words = currentTip.split(' ');
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  lines.push(line);
  const lineH = tipSize * 1.3;
  const startY = hudCanvas.height / 2 + Math.round(hudCanvas.height / 12);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], hudCanvas.width / 2, startY + i * lineH);
  }
  ctx.textAlign = 'left';
}

function initGame(): void {
  resetNoiseRecords();
  const gen = generateFloor(FloorLevel.LIVING);
  world = replaceWorldFromGeneration(null, gen);
  entities = gen.entities;
  nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;

  player = {
    id: nextEntityId.v++,
    type: EntityType.PLAYER,
    x: gen.spawnX,
    y: gen.spawnY,
    angle: -Math.PI / 2, // face north — toward slides
    pitch: 0,
    alive: true,
    speed: 3.0,
    sprite: 0,
    needs: freshNeeds(),
    hp: 100, maxHp: 100,
    money: 100,
    inventory: [],
    weapon: '',
    tool: '',
    name: playerDisplayName(),
    rpg: freshRPG(1),
    faction: Faction.PLAYER,
    ...playerAlifeFields(),
  };
  entities.push(player);
  prevPlayerHp = player.hp ?? 100;

  // Initialize faction relations and per-cell faction control
  initFactionRelations();
  initFactionControl(world);
  resetGeneratedFloorPopulationState();
  clearRoomMemory();

  state = {
    tick: 0,
    time: 0,
    clock: { hour: 8, minute: 0, totalMinutes: 0 },
    samosborActive: false,
    samosborTimer: 120 + Math.random() * 60,
    samosborCount: 0,
    paused: false,
    gameOver: false,
    showInventory: false,
    mapMode: 0,
    showQuests: false,
    invSel: 0,
    msgs: [msg('Добро пожаловать в ГИГАХРУЩ. Закройте дверь.', 0, '#aaa')],
    quests: [],
    nextQuestId: 1,
    currentFloor: FloorLevel.LIVING,
    fogSpreadTimer: 0,
    showMenu: false,
    menuSel: 0,
    showNpcMenu: false,
    npcMenuSel: 0,
    npcMenuTarget: -1,
    npcMenuTab: 'main',
    npcTalkText: '',
    questPage: 0,
    tradeCursorX: 0,
    tradeCursorY: 0,
    tradeSide: 'npc',
    showContainerMenu: false,
    containerMenuTarget: -1,
    containerCursorX: 0,
    containerCursorY: 0,
    containerSide: 'container',
    showDebug: false,
    debugSel: 0,
    showFactions: false,
    factionRankScroll: 0,
    showLog: false,
    logScroll: 0,
    showControls: false,
    controlSel: 0,
    controlScroll: 0,
    msgLog: [{ text: 'Добро пожаловать в ГИГАХРУЩ. Закройте дверь.', color: '#aaa', day: 0, hour: 8, minute: 0 }],
    dmgFlash: 0,
    dmgSeed: 0,
    deathTimer: 0,
    sleeping: false,
    beamFx: 0,
    beamAngle: 0,
    beamLen: 0,
    uvBeamFx: 0,
    uvBeamLen: 0,
    gameWon: false,
    worldEvents: createWorldEventState(),
  };
  clearVoidReturnPortalState(state);
  setVoidEntryFromFloor(state, undefined);
  netReportedSamosborCount = state.samosborCount;
  netDeathReported = false;
  ensureBankingState(state);
  ensureStockMarketState(state);
  closeNetSphere();
  closeNetTerminalGen();
  closeMapEditor();
  ensureFloorRunState(state, FloorLevel.LIVING);
  ensureFloorInstanceState(state, FloorLevel.LIVING);
  ensureLiftArachnaState(state);
  ensureNetTerminalGenState(state);
  ensureMapEditorPatchState(state);
  materializeCurrentAlifeFloor();
  ensureRoomContainers(world, state.currentFloor);
  ensureProductionRooms(state, world);
  prepareEditableFloor();
  ensureProceduralSpriteSeeds(entities);
  resetPsiState();

  // Initialize / reinitialize WebGL with current world data
  disposeWebGL();
  initWebGL(canvas, textures, sprites, world);
  setGeneratedDynamicSky(gen);
  updateWorldData(world);
  rebuildEntityIndex(entities, 'load');
}

drawLoading();
setTimeout(() => {
  initGame();
  showTitle();
}, 0);

/* ── Input ────────────────────────────────────────────────────── */
const input = createInput();
bindInput(input, canvas);
mobileControls = createMobileControls(input, {
  onGesture: mobileGestureUnlock,
  onMenu: openMobileMenu,
  onConfirm: confirmActiveMobileSelection,
  onClose: closeActiveMobileMenu,
});
installSmokeDebugHook();

/* ── Toggles (edge-detect) ────────────────────────────────────── */
let prevMap = false, prevDebug = false;
let stepAccum = 0; // footstep sound accumulator
let floorTeleportCd = 0; // prevents anomaly teleport ping-pong
let _prevMsgCount = 0; // for syncing msgs → msgLog
let netReportedSamosborCount = 0;
let netDeathReported = false;

/** Sync new msgs to persistent msgLog with clock timestamps */
function syncMsgLog(): void {
  const msgs = state.msgs;
  if (msgs.length > _prevMsgCount) {
    for (let i = _prevMsgCount; i < msgs.length; i++) {
      const m = msgs[i];
      const last = state.msgLog[state.msgLog.length - 1];
      if (last && last.text === m.text && last.day === m.day && last.hour === m.hour && last.minute === m.minute) continue;
      state.msgLog.push({
        text: m.text,
        color: m.color,
        day: m.day,
        hour: m.hour,
        minute: m.minute,
      });
    }
    if (state.msgLog.length > 500) state.msgLog.splice(0, state.msgLog.length - 500);
  }
  _prevMsgCount = msgs.length;
}

function reportNetSphereProgressEvents(): void {
  if (state.samosborCount > netReportedSamosborCount) {
    for (let count = netReportedSamosborCount + 1; count <= state.samosborCount; count++) {
      reportNetSphereEvent('samosbor', `samosbor:${count}`, state, player);
    }
    netReportedSamosborCount = state.samosborCount;
  }
  if (state.gameOver && !netDeathReported) {
    reportNetSphereEvent('death', `death:${state.tick}:${Math.floor(state.time * 1000)}`, state, player);
    netDeathReported = true;
  } else if (!state.gameOver) {
    netDeathReported = false;
  }
}

function roundPlayerDamage(amount: number): number {
  return Math.max(0, Math.round(amount * 10) / 10);
}

function unattributedPlayerDamageSource(): { kind: PlayerDamageSourceKind; label: string } {
  if (state.currentFloor === FloorLevel.VOID) return { kind: 'void', label: 'Правило Пустоты' };
  if (state.samosborActive) return { kind: 'samosbor', label: 'Самосбор' };
  return { kind: 'hazard', label: 'Неопознанная опасность' };
}

function recordUnattributedPlayerDamage(amount: number): void {
  if (amount <= 0 || hasFreshPlayerDamageRecord(state, state.tick, state.time)) return;
  const source = unattributedPlayerDamageSource();
  recordPlayerDamage(state, undefined, amount, `${source.label}: -${roundPlayerDamage(amount)}`, source.kind);
}

function handlePlayerDeath(): void {
  const deathTime = state.time;
  const cause = formatLastPlayerDamageCause(state, deathTime);
  state.gameOver = true;
  state.deathTimer = 0;
  deathCam = initDeathCam(player.x, player.y, player.angle);
  state.msgs.push(msg(cause ? `Вы погибли: ${cause}` : 'Вы погибли: источник урона не распознан', state.time, '#f66'));
}

/* ── Door auto-close update ───────────────────────────────────── */
function updateDoors(dt: number): void {
  for (const [, door] of world.doors) {
    if (door.timer > 0) {
      door.timer -= dt;
      if (door.timer <= 0 && (door.state === DoorState.OPEN || door.state === DoorState.HERMETIC_OPEN)) {
        door.state = door.state === DoorState.HERMETIC_OPEN ? DoorState.HERMETIC_CLOSED : DoorState.CLOSED;
      }
    }
  }
}

/* ── Player movement ──────────────────────────────────────────── */
const PLAYER_COLLISION_R = 0.16;

function playerCanOccupy(x: number, y: number, r = PLAYER_COLLISION_R): boolean {
  return !world.solid(Math.floor(x + r), Math.floor(y + r)) &&
    !world.solid(Math.floor(x + r), Math.floor(y - r)) &&
    !world.solid(Math.floor(x - r), Math.floor(y + r)) &&
    !world.solid(Math.floor(x - r), Math.floor(y - r));
}

function nudgeBlockedPlayerToFloor(): void {
  if (isNoClipActive()) return;
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  if (!world.solid(px, py) && playerCanOccupy(player.x, player.y)) return;
  for (let r = 1; r <= 5; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = world.wrap(px + dx);
        const y = world.wrap(py + dy);
        if (!passableSpawnCell(x + 0.5, y + 0.5)) continue;
        if (!playerCanOccupy(x + 0.5, y + 0.5)) continue;
        player.x = x + 0.5;
        player.y = y + 0.5;
        return;
      }
    }
  }
}

function movePlayer(dt: number): void {
  if (!player.alive) return;
  if (state.sleeping) return; // no movement while sleeping
  floorTeleportCd = Math.max(0, floorTeleportCd - dt);

  // Mouse look
  if (input.mouse.locked) {
    player.angle += input.mouse.dx * 0.003;
    player.pitch = Math.max(-1, Math.min(1, player.pitch - input.mouse.dy * 0.003));
    input.mouse.dx = 0;
    input.mouse.dy = 0;
  }

  // Keyboard turn
  if (input.left)  player.angle -= 2.5 * dt;
  if (input.right) player.angle += 2.5 * dt;
  if (input.touch.lookX !== 0) player.angle += input.touch.lookX * 3.0 * dt;
  if (input.touch.lookY !== 0) player.pitch = Math.max(-1, Math.min(1, player.pitch - input.touch.lookY * 1.6 * dt));
  if (isRidingRailTrain(world, player)) return;
  nudgeBlockedPlayerToFloor();

  // Movement
  const cos = Math.cos(player.angle);
  const sin = Math.sin(player.angle);
  const fwdAxis = Math.max(-1, Math.min(1, (input.fwd ? 1 : 0) - (input.back ? 1 : 0) + input.touch.moveY));
  const strafeAxis = Math.max(-1, Math.min(1, (input.strafeR ? 1 : 0) - (input.strafeL ? 1 : 0) + input.touch.moveX));
  let mx = cos * fwdAxis - sin * strafeAxis;
  let my = sin * fwdAxis + cos * strafeAxis;
  const processionPull = updateCultProcessionCompulsion(state, world, player, input.interactHeld);
  if (processionPull) {
    mx += processionPull.x * processionPull.strength;
    my += processionPull.y * processionPull.strength;
  }
  const bellPull = updateIstotitBellCompulsion(world, state, player, input.interactHeld);
  if (bellPull) {
    mx += bellPull.x * bellPull.strength;
    my += bellPull.y * bellPull.strength;
  }

  // Normalize
  const len = Math.sqrt(mx * mx + my * my);
  if (len > 0) {
    const speed = player.speed * dt;
    // Sleep exhaustion reduces speed
    const sleepMod = player.needs && player.needs.sleep < 10 ? 0.5 : 1;
    // AGI bonus to move speed
    const agiMod = player.rpg ? agiSpeedMult(player.rpg) : 1;
    const hazardMod = getCellHazardMoveMultiplier(world, player);
    const statusMod = zhelemishMoveMult(player, state.time);
    const coldMod = hladonColdMoveMultiplier(world, player);
    const moveMod = sleepMod * agiMod * hazardMod * statusMod * coldMod;
    mx = mx / len * speed * moveMod;
    my = my / len * speed * moveMod;

    const r = PLAYER_COLLISION_R; // small enough to slide along tight concrete corners
    const canClip = isNoClipActive();
    // X movement – check all 4 AABB corners (skip if noclip effect is active)
    const nx = player.x + mx;
    if (canClip || (
        !world.solid(Math.floor(nx + r), Math.floor(player.y + r)) &&
        !world.solid(Math.floor(nx + r), Math.floor(player.y - r)) &&
        !world.solid(Math.floor(nx - r), Math.floor(player.y + r)) &&
        !world.solid(Math.floor(nx - r), Math.floor(player.y - r)))) {
      player.x = ((nx % W) + W) % W;
    }
    // Y movement – check all 4 AABB corners (use updated X)
    const ny = player.y + my;
    if (canClip || (
        !world.solid(Math.floor(player.x + r), Math.floor(ny + r)) &&
        !world.solid(Math.floor(player.x + r), Math.floor(ny - r)) &&
        !world.solid(Math.floor(player.x - r), Math.floor(ny + r)) &&
        !world.solid(Math.floor(player.x - r), Math.floor(ny - r)))) {
      player.y = ((ny % W) + W) % W;
    }

    if (floorTeleportCd <= 0 && world.anomalyTeleports.size > 0) {
      const from = world.idx(Math.floor(player.x), Math.floor(player.y));
      if (tryUseWrongDoorRemap(world, state, player)) {
        floorTeleportCd = 1.25;
      } else {
        const to = world.anomalyTeleports.get(from);
        if (to !== undefined) {
          player.x = (to % W) + 0.5;
          player.y = ((to / W) | 0) + 0.5;
          floorTeleportCd = 1.25;
          state.msgs.push(msg('Клетка перескочила на другой участок этажа.', state.time, '#c8f'));
        }
      }
    }

    // Footstep sound
    stepAccum += speed * moveMod;
    if (stepAccum > 1.8) {
      stepAccum = 0;
      playFootstep();
      publishFootstepNoise(state, player, moveMod * len > 1.08);
    }
  }
}

/* ── Weapon sound dispatch ─────────────────────────────────────── */
function playWeaponSound(weaponId: string, ws: import('./data/weapons').WeaponStats): void {
  const sid = ws.soundId ?? weaponId;
  switch (sid) {
    case 'shotgun':    playShotgun(); break;
    case 'nailgun':    playNailgun(); break;
    case 'ppsh':       playPPSh(); break;
    case 'chainsaw':   playChainsaw(); break;
    case 'machinegun': playMachinegun(); break;
    case 'grenade':    playGunshot(); break; // throw sound; explosion plays on impact
    case 'gauss':      playGauss(); break;
    case 'plasma':     playPlasma(); break;
    case 'bfg':        playBFG(); break;
    case 'flame':      playFlame(); break;
    default:           playGunshot(); break;
  }
}

function projectileThreatLabel(p: Entity): string {
  const pt = p.projType ?? ProjType.NORMAL;
  if (pt === ProjType.WEB) return 'Паутина';
  if (pt === ProjType.FLAME || p.sprite === Spr.FLAME_BOLT || p.sprite === Spr.HOSTILE_FLAME_BOLT) return 'Ожог';
  if (pt === ProjType.BFG || p.sprite === Spr.BFG_BOLT) return 'Энергия';
  if (p.sprite === Spr.EYE_BOLT) return 'Глаз';
  if (p.sprite === Spr.PARAGRAPH_BOLT) return 'Параграф';
  if (p.sprite === Spr.PSI_BOLT || p.sprite === Spr.HOSTILE_PSI_BOLT) return 'ПСИ-удар';
  if (p.sprite === Spr.PLASMA_BOLT || p.sprite === Spr.HOSTILE_PLASMA_BOLT || p.sprite === Spr.GAUSS_BOLT) return 'Разряд';
  if (p.sprite === Spr.PELLET || p.sprite === Spr.HOSTILE_PELLET) return 'Дробь';
  if (p.sprite === Spr.NAIL || p.sprite === Spr.HOSTILE_NAIL) return 'Гвоздь';
  return 'Попадание';
}

function reportPlayerProjectileHit(p: Entity, dmg: number): void {
  const actor = projectileActor(p);
  const threat = projectileThreatLabel(p);
  const detail = actor && actor.id !== player.id
    ? `${threat} от ${entityDisplayName(actor)}: -${dmg}`
    : `${threat}: -${dmg}`;
  recordPlayerDamage(state, p, dmg, detail, 'projectile');
  if (state.tick - lastProjectileHitMsgTick < 18) return;
  state.msgs.push(msg(detail, state.time, '#f66'));
  lastProjectileHitMsgTick = state.tick;
}

function playProjectileImpactCue(p: Entity, x: number, y: number): void {
  const pt = p.projType ?? ProjType.NORMAL;
  playSoundAt(isEnergyProjectileImpact(p.sprite, pt) ? playEnergyImpact : playProjectileImpact, x, y);
}

function playProjectileBodyHitCue(p: Entity, x: number, y: number, isPlayerTarget: boolean): void {
  if (isEnergyProjectileImpact(p.sprite, p.projType ?? ProjType.NORMAL)) {
    playSoundAt(playEnergyImpact, x, y);
  } else {
    playSoundAt(isPlayerTarget ? playProjectileBodyHit : playFleshHit, x, y);
  }
}

function publishFuelEmptyEvent(ammoType: string | undefined): void {
  publishEvent(state, {
    type: 'fuel_empty',
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    itemId: ammoType,
    itemName: ammoType ? (ITEMS[ammoType]?.name ?? ammoType) : 'Топливо',
    itemCount: 0,
    severity: 2,
    privacy: 'private',
    tags: ['fire', 'fuel_empty', 'flamethrower', 'ammo'],
    data: { weapon: player.weapon ?? '', ammoType },
  });
}

/* ── Player actions ───────────────────────────────────────────── */
function playerActions(_dt: number): void {
  if (!player.alive) return;
  if (state.sleeping) return; // no actions while sleeping

  // Toggle map
  if (input.map && !prevMap) state.mapMode = (state.mapMode + 1) % 3;
  prevMap = input.map;

  // Pickup (on interact key E, if looking at item drop)
  // Auto-pickup handles walking over items (see tick%15 below)

  // Interact (doors + NPCs)
  if (input.interact) {
    const lookX = player.x + Math.cos(player.angle) * 1.5;
    const lookY = player.y + Math.sin(player.angle) * 1.5;
    const result = activateInteraction({
      world,
      state,
      player,
      entities,
      nextEntityId,
      lookX,
      lookY,
      switchFloor,
      movePlayerToMetroRoom,
      openNpcMenu,
      openContainerMenu,
      openMapEditor,
      playDoor,
    });
    if (result.worldChanged) updateWorldData(world);
    if (result.openedOverlay) syncPauseState();
    input.interact = false;
    return;
  }

  // Attack (cooldown-based: hold to auto-fire)
  const wantsAttack = input.attack || input.mouseAttack;
  player.attackCd = Math.max(0, (player.attackCd ?? 0) - _dt);

  if (wantsAttack && player.attackCd! <= 0) {
    const ws = getWeaponStats(player);
    // AGI reduces attack cooldown
    const atkSpeedMod = player.rpg ? agiAttackSpeedMult(player.rpg) : 1;

    if (ws.psiCost) {
      // ── PSI spell: consume PSI instead of ammo ──────────
      if (!player.rpg || player.rpg.psi < ws.psiCost) {
        state.msgs.push(msg('Недостаточно ПСИ!', state.time, '#f84'));
        player.attackCd = 0.5;
      } else {
        player.rpg.psi -= ws.psiCost;
        if (ws.isRanged) {
          // Projectile PSI spell
          const cos = Math.cos(player.angle);
          const sin = Math.sin(player.angle);
          const spd = ws.projSpeed ?? 14;
          const proj: Entity = {
            id: nextEntityId.v++,
            type: EntityType.PROJECTILE,
            x: player.x + cos * 0.5,
            y: player.y + sin * 0.5,
            angle: player.angle,
            pitch: 0,
            alive: true,
            speed: 0,
            sprite: ws.projSprite ?? Spr.PSI_BOLT,
            vx: Math.cos(player.angle) * spd,
            vy: Math.sin(player.angle) * spd,
            vz: player.pitch * spd * 0.5,
            projDmg: ws.dmg,
            projLife: 3.0,
            ownerId: player.id,
            weapon: player.weapon ?? '',
            spriteScale: 0.3,
            spriteZ: 0.5,
          };
          if (ws.aoeRadius) {
            proj.aoeRadius = ws.aoeRadius;
            proj.aoeDmg = ws.dmg;
          }
          entities.push(proj);
        } else {
          // Instant PSI spell
          const psiResult = castInstantSpell(
            ws.psiEffect ?? '', player, entities, world,
            state.msgs, state.time,
            (e) => handleKill(e, true),
          );
          if (psiResult.beamLen) {
            state.beamFx = 0.35;
            state.beamAngle = player.angle;
            state.beamLen = psiResult.beamLen;
          }
        }
        if (ws.psiEffect === 'beam') playPsiBeam(); else playPsiCast();
        publishWeaponNoise(state, player, player.weapon ?? '', ws);
        player.attackCd = ws.speed * atkSpeedMod;
      }
    } else if (ws.isRanged) {
      // ── Ranged attack: spawn projectile(s) ──────────────
      if (consumeAmmo(player, state)) {
        if (ws.projType === ProjType.FLAME) reducePaupsinaWeb(player, state.time, state.msgs, state, player, 'fire');
        if (ws.deletionBeam) {
          const result = fireDeletionBeam(world, entities, player, state, player.weapon ?? '', ws, handleKill);
          state.beamFx = 0.45;
          state.beamAngle = player.angle;
          state.beamLen = result.beamLen;
        } else {
          const cos = Math.cos(player.angle);
          const sin = Math.sin(player.angle);
          const pellets = ws.pellets ?? 1;
          const spread = ws.spread ?? 0;
          const pt = ws.projType ?? ProjType.NORMAL;
          for (let p = 0; p < pellets; p++) {
            const ang = player.angle + (Math.random() - 0.5) * spread;
            const spd = ws.projSpeed ?? 15;
            const proj: Entity = {
              id: nextEntityId.v++,
              type: EntityType.PROJECTILE,
              x: player.x + cos * 0.5,
              y: player.y + sin * 0.5,
              angle: ang,
              pitch: 0,
              alive: true,
              speed: 0,
              sprite: ws.projSprite ?? Spr.BULLET,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              vz: player.pitch * spd * 0.5 + (pt === ProjType.FLAME ? (Math.random() - 0.5) * 0.8 : 0),
              projDmg: ws.dmg,
              projLife: pt === ProjType.GRENADE ? 1.5 : pt === ProjType.FLAME ? 0.7 : 3.0,
              ownerId: player.id,
              weapon: player.weapon ?? '',
              spriteScale: pt === ProjType.BFG ? 0.6 : pt === ProjType.FLAME ? (0.55 + Math.random() * 0.25) : pt === ProjType.GRENADE ? 0.35 : 0.25,
              spriteZ: 0.5,
              projType: pt,
              projGore: pt === ProjType.GRENADE || pt === ProjType.BFG ? 3
                : (player.weapon === 'shotgun' || player.weapon === 'chainsaw') ? 3
                : (player.weapon === 'ak47' || player.weapon === 'machinegun' || player.weapon === 'nailgun' || player.weapon === 'gauss' || player.weapon === 'plasma') ? 2
                : pt === ProjType.FLAME ? 1 : 1,
            };
            if (ws.aoeRadius) {
              proj.aoeRadius = ws.aoeRadius;
              proj.aoeDmg = ws.dmg;
            }
            entities.push(proj);
          }
        }
        // Play weapon-specific sound
        playWeaponSound(player.weapon ?? '', ws);
        publishWeaponNoise(state, player, player.weapon ?? '', ws);
        notifyLiftArachnaNoise(world, player, state, player.weapon ?? '');
        player.attackCd = ws.speed * atkSpeedMod;
      } else {
        if ((player.weapon ?? '') === 'flamethrower') {
          state.msgs.push(msg('Бензин кончился!', state.time, '#f84'));
          publishFuelEmptyEvent(ws.ammoType);
        } else {
          state.msgs.push(msg('Нет патронов!', state.time, '#f84'));
        }
        player.attackCd = 0.5;
      }
    } else {
      // ── Melee attack: range check + durability ──────────
      const normalDmg = meleeDamage(player.rpg, player.weapon, ws.dmg);
      const range = ws.range;
      const ax = player.x + Math.cos(player.angle) * range;
      const ay = player.y + Math.sin(player.angle) * range;

      let hitSomething = isPaupsinaWebCuttingWeapon(player.weapon)
        ? reducePaupsinaWeb(player, state.time, state.msgs, state, player, 'cut')
        : false;
      for (const e of entities) {
        if ((e.type !== EntityType.MONSTER && e.type !== EntityType.NPC) || !e.alive) continue;
        if (e.id === player.id) continue;
        if (world.dist(ax, ay, e.x, e.y) < 1.2) {
          if (e.hp !== undefined) {
            const rawDmg = debugOnePunchMeleeDamage(e, normalDmg);
            const armor = applyMonsterArmorHit(world, state, e, {
              damage: rawDmg,
              attacker: player,
              weaponId: player.weapon ?? '',
            });
            const dmg = armor.damage;
            e.hp -= dmg;
            // Relation penalty for hitting non-hostile NPCs
            if (e.type === EntityType.NPC) {
              applyDamageRelationPenalty(player.faction, e.faction, dmg, e, player);
              recordFactionClashPlayerHit(state, world, player, e, dmg);
            }
            // Blood splatter on hit — use player facing as velocity direction
            const meleeSpd = 6;
            const mVx = Math.cos(player.angle) * meleeSpd;
            const mVy = Math.sin(player.angle) * meleeSpd;
            spawnBloodHit(world, e.x, e.y, player.angle, dmg, e.type === EntityType.MONSTER, mVx, mVy, 0.5);
            state.msgs.push(msg(`Удар! ${entityDisplayName(e)} -${dmg}`, state.time, '#fc4'));
            if (e.hp <= 0) {
              e.alive = false;
              const meleeGore = (player.weapon === 'chainsaw' || player.weapon === 'axe') ? 3
                : (player.weapon === 'rebar' || player.weapon === 'pipe') ? 2 : 1;
              handleKill(e, true, mVx, mVy, meleeGore);
              recordMonsterMeleeDeath(
                world,
                state,
                e,
                player.weapon,
                player,
                (target, vx, vy, gore) => handleKill(target, true, vx, vy, gore),
              );
            }
          }
          hitSomething = true;
          break;
        }
      }
      if (player.weapon === 'chainsaw') playChainsaw(); else playAttack();
      publishWeaponNoise(state, player, player.weapon ?? '', ws);
      notifyLiftArachnaNoise(world, player, state, player.weapon ?? '');
      // Consume durability on melee hit
      if (hitSomething) {
        const broke = consumeDurability(player, state.msgs, state.time, state);
        if (broke) playBreak();
      }
      player.attackCd = ws.speed * atkSpeedMod;
    }
  }
}

/* ── Drop inventory as ITEM_DROP entities at death position ──── */
function dropEntityInventory(e: Entity): void {
  if (!e.inventory || e.inventory.length === 0) return;
  for (const item of e.inventory) {
    if (!item || item.count <= 0) continue;
    entities.push({
      id: nextEntityId.v++, type: EntityType.ITEM_DROP,
      x: e.x + (Math.random() - 0.5) * 0.5,
      y: e.y + (Math.random() - 0.5) * 0.5,
      angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
      inventory: [{ defId: item.defId, count: item.count, data: item.data }],
    });
  }
  e.inventory = [];
}

/* ── Defense quest continuous monster spawner (step 8) ─────────── */
let _defenseSpawnAccum = 0;
function updateDefenseQuestSpawn(dt: number): void {
  const quest = state.quests.find(q => q.plotStepIndex === 8 && !q.done && q.type === QuestType.KILL);
  if (!quest) { _defenseSpawnAccum = 0; return; }

  // Find Major Grom's position as spawn anchor
  const grom = entities.find(e => e.plotNpcId === 'major_grom' && e.alive);
  if (!grom) return;

  _defenseSpawnAccum += dt;
  if (_defenseSpawnAccum < 3.0) return; // spawn wave every 3 seconds
  _defenseSpawnAccum -= 3.0;

  // Count active monsters near Grom
  let nearbyMonsters = 0;
  for (const e of entities) {
    if (e.type === EntityType.MONSTER && e.alive) {
      if (world.dist(grom.x, grom.y, e.x, e.y) < 25) nearbyMonsters++;
    }
  }
  if (nearbyMonsters >= 8) return; // enough already

  // Spawn 2-3 monsters at ~3-8 cells from Grom (tight corridors)
  const kinds = [MonsterKind.TVAR, MonsterKind.SBORKA, MonsterKind.ZOMBIE, MonsterKind.SHADOW, MonsterKind.POLZUN];
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 5;
    let mx = -1, my = -1;
    for (let attempt = 0; attempt < 60; attempt++) {
      const a = angle + (attempt > 0 ? (Math.random() - 0.5) * 1.5 : 0);
      const d = dist + (attempt > 0 ? (Math.random() - 0.5) * 4 : 0);
      const tx = ((Math.floor(grom.x) + Math.round(Math.cos(a) * d)) % W + W) % W;
      const ty = ((Math.floor(grom.y) + Math.round(Math.sin(a) * d)) % W + W) % W;
      if (world.cells[world.idx(tx, ty)] === Cell.FLOOR) {
        mx = tx; my = ty; break;
      }
    }
    if (mx < 0) continue;
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const ci = world.idx(mx, my);
    const zid = world.zoneMap[ci];
    const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 6) : 6;
    const mRpg = freshRPG(zoneLevel);
    const baseHp: Record<number, number> = {
      [MonsterKind.TVAR]: 40, [MonsterKind.SBORKA]: 5,
      [MonsterKind.ZOMBIE]: 25, [MonsterKind.SHADOW]: 45, [MonsterKind.POLZUN]: 80,
    };
    const hp = Math.round((baseHp[kind] ?? 40) * (1 + 0.12 * (zoneLevel - 1)));
    entities.push({
      id: nextEntityId.v++, type: EntityType.MONSTER,
      x: mx + 0.5, y: my + 0.5,
      angle: Math.atan2(grom.y - my - 0.5, grom.x - mx - 0.5),
      pitch: 0, alive: true,
      speed: 1.5 + Math.random() * 0.8,
      sprite: monsterSpr(kind),
      hp, maxHp: hp,
      monsterKind: kind, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: Math.floor(grom.x), ty: Math.floor(grom.y), path: [], pi: 0, stuck: 0, timer: 0 },
      rpg: mRpg,
    });
  }
}

/* ── Shared kill handling (melee + projectile) ────────────────── */
function isBossKillTarget(e: Entity): boolean {
  if (e.type !== EntityType.MONSTER) return false;
  if (e.isFogBoss) return true;
  return e.monsterKind === MonsterKind.MANCOBUS ||
    e.monsterKind === MonsterKind.HERALD ||
    e.monsterKind === MonsterKind.CREATOR;
}

function isActiveKillQuestTarget(e: Entity): boolean {
  for (const q of state.quests) {
    if (q.done || q.type !== QuestType.KILL) continue;
    if (e.type === EntityType.MONSTER) {
      if (q.targetMonsterKind === e.monsterKind) return true;
      if (q.targetMonsterKind === undefined && q.targetNpcId === undefined && q.targetPlotNpcId === undefined) return true;
    } else if (e.type === EntityType.NPC) {
      if (q.targetNpcId === e.id) return true;
      if (q.targetPlotNpcId && e.plotNpcId === q.targetPlotNpcId) return true;
    }
  }
  return false;
}

function playerKillMessage(e: Entity): string {
  const name = entityDisplayName(e);
  return (isBossKillTarget(e) || isActiveKillQuestTarget(e))
    ? `${name} ${e.isFemale ? 'повержена' : 'повержен'}!`
    : `Убито: ${name}`;
}

function handleKill(e: Entity, killerIsPlayer: boolean, pvx = 0, pvy = 0, goreLevel = 1): void {
  // Death blood pool — directional + gore-scaled
  spawnDeathPool(world, e.x, e.y, e.type === EntityType.MONSTER, goreLevel, pvx, pvy);
  if (killerIsPlayer) {
    state.msgs.push(msg(playerKillMessage(e), state.time, '#4f4'));
  }
  if (killerIsPlayer && (e.type === EntityType.MONSTER || e.type === EntityType.NPC)) {
    recordEntityKill(player, e);
    const eventCell = world.idx(Math.floor(e.x), Math.floor(e.y));
    const zoneId = world.zoneMap[eventCell];
    const roomId = world.roomMap[eventCell];
    publishEvent(state, {
      type: e.type === EntityType.MONSTER ? 'player_kill_monster' : 'player_kill_npc',
      zoneId,
      roomId: roomId >= 0 ? roomId : undefined,
      x: e.x,
      y: e.y,
      actorId: player.id,
      actorName: player.name ?? 'Вы',
      actorFaction: player.faction,
      targetId: e.id,
      targetName: entityDisplayName(e),
      targetFaction: e.faction,
      monsterKind: e.monsterKind,
      severity: e.isFogBoss || e.type === EntityType.NPC ? 4 : 3,
      privacy: 'local',
      tags: e.type === EntityType.MONSTER ? ['combat', 'kill', 'monster'] : ['combat', 'kill', 'npc'],
      data: undefined,
	    });
    if (e.type === EntityType.NPC) recordFactionClashPlayerHit(state, world, player, e, e.maxHp ?? 1);
  }
  // Drop NPC inventory as loot
  if (e.type === EntityType.NPC) {
    recordAlifeNpcDeath(state, e);
    dropEntityInventory(e);
  }
  if (e.isFogBoss && e.fogBossZone !== undefined) {
    clearFogInZone(world, e.fogBossZone, state.msgs, state.time, state);
  }
  if (e.monsterKind !== undefined) {
    if (killerIsPlayer) notifyKill(e.monsterKind, state);
    // Drop strange_clot from Shadow when plot KILL quest for shadows is active
    if (e.monsterKind === MonsterKind.SHADOW && killerIsPlayer) {
      const hasPlotShadowQuest = state.quests.some(q => !q.done && q.plotStepIndex !== undefined && q.targetMonsterKind === MonsterKind.SHADOW);
      if (hasPlotShadowQuest) {
        entities.push({
          id: nextEntityId.v++, type: EntityType.ITEM_DROP,
          x: e.x + (Math.random() - 0.5) * 0.3,
          y: e.y + (Math.random() - 0.5) * 0.3,
          angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
          inventory: [{ defId: 'strange_clot', count: 1 }],
        });
        state.msgs.push(msg('Теневик выронил странный пульсирующий сгусток!', state.time, '#c8f'));
      }
    }
    if (killerIsPlayer) {
      awardXP(player, xpForMonsterKill(e.monsterKind, e.rpg?.level ?? 1), state.msgs, state.time);
    }
    // Herald killed — check if voice quest (kill 3 heralds) is now complete → spawn portal
    if (e.monsterKind === MonsterKind.HERALD && killerIsPlayer && state.currentFloor === FloorLevel.HELL) {
      if (onHeraldKilled(e, world, state)) updateWorldData(world);
    }
    // Creator killed — spawn return portal
    if (e.monsterKind === MonsterKind.CREATOR && killerIsPlayer && state.currentFloor === FloorLevel.VOID) {
      if (onCreatorKilled(e, world, state)) {
        checkQuests(player, world, entities, state, state.msgs);
        openVoidReturnPortalFromCreator(e);
        updateWorldData(world);
      }
    }
  } else if (e.type === EntityType.NPC && killerIsPlayer) {
    awardXP(player, xpForNpcKill(e.rpg?.level ?? 1), state.msgs, state.time);
    if (e.plotNpcId) notifyNpcKill(e.plotNpcId, state);
    // Priest death curse: killing Батюшка spawns 666 monsters in pentagram
    if (e.plotNpcId === 'batushka') {
      priestDeathCurse(world, entities, nextEntityId, e.x, e.y);
      state.msgs.push(msg('☠ ПРОКЛЯТИЕ БАТЮШКИ! 666 тварей вырвались из ада!', state.time, '#f00'));
      state.msgs.push(msg('На миникарте проступает пентаграмма...', state.time, '#a00'));
      updateWorldData(world);
    }
  }
}

const FLAME_COLLATERAL_ITEMS = new Set([
  'bread', 'canned', 'rawmeat', 'mushroom_mass', 'infected_mushroom',
  'cloth_roll', 'note', 'book', 'water_coupon', 'filter_layer',
]);

function projectileActor(p: Entity): Entity | undefined {
  if (p.ownerId === player.id) return player;
  return getEntityIndex().byId.get(p.ownerId ?? -1);
}

const flameCollateralQuery: Entity[] = [];

function applyFlameBackdraft(x: number, y: number, actor: Entity | undefined): void {
  state.dmgFlash = Math.max(state.dmgFlash, 0.12);
  state.dmgSeed = 3;
  if (actor?.id !== player.id || world.dist2(player.x, player.y, x, y) > 1.6 * 1.6) return;
  if (isDebugOnePunchManEnabled()) {
    keepDebugOnePunchManAlive(player);
    return;
  }
  player.hp = Math.max(1, (player.hp ?? 1) - 1);
  recordPlayerDamage(state, undefined, 1, 'Обратная тяга: дым и жар в лицо', 'hazard');
  state.msgs.push(msg('Обратная тяга: дым и жар в лицо', state.time, '#f84'));
}

function burnCollateralNearFlame(x: number, y: number, radius: number, actor: Entity | undefined): boolean {
  const r2 = radius * radius;
  getEntityIndex().queryRadius(x, y, radius, flameCollateralQuery, ENTITY_MASK_ITEM_DROP);
  for (const drop of flameCollateralQuery) {
    const inv = drop.inventory;
    if (!drop.alive || drop.type !== EntityType.ITEM_DROP || !inv?.length) continue;
    if (world.dist2(x, y, drop.x, drop.y) > r2) continue;
    const slot = inv.find(item => FLAME_COLLATERAL_ITEMS.has(item.defId));
    if (!slot) continue;
    const def = ITEMS[slot.defId];
    slot.count--;
    if (slot.count <= 0) inv.splice(inv.indexOf(slot), 1);
    if (inv.length === 0) drop.alive = false;
    publishEvent(state, {
      type: 'collateral_damage',
      x: drop.x,
      y: drop.y,
      actorId: actor?.id,
      actorName: actor?.name ?? (actor?.id === player.id ? 'Вы' : undefined),
      actorFaction: actor?.faction,
      itemId: slot.defId,
      itemName: def?.name ?? slot.defId,
      itemCount: 1,
      itemValue: def?.value ?? 0,
      severity: 3,
      privacy: 'local',
      tags: ['fire', 'collateral', 'flamethrower', 'item_destroyed'],
      data: { reason: 'flame_cleanup', radius },
    });
    state.msgs.push(msg(`Огонь испортил: ${def?.name ?? slot.defId}`, state.time, '#f84'));
    return true;
  }
  return false;
}

function resolveFlameCleanup(p: Entity, x: number, y: number, radius: number): void {
  const actor = projectileActor(p);
  const cleanedHazards = cleanCellHazardsNear(world, x, y, radius, state, actor, 'fire');
  if (cleanedHazards <= 0) return;

  const cleanedSurface = cleanSurfaceArea(x, y, radius);
  if (actor?.id === player.id) notifyCleanupToolUse(player, world, state, x, y, cleanedSurface, cleanedHazards);
  burnCollateralNearFlame(x, y, radius + 0.35, actor);
  applyFlameBackdraft(x, y, actor);
  publishEvent(state, {
    type: 'burn_cleanup',
    x,
    y,
    actorId: actor?.id,
    actorName: actor?.name ?? (actor?.id === player.id ? 'Вы' : undefined),
    actorFaction: actor?.faction,
    itemId: 'ammo_fuel',
    itemName: ITEMS.ammo_fuel?.name ?? 'Бензин',
    severity: 4,
    privacy: 'local',
    tags: ['fire', 'cleanup', 'slime', 'flamethrower', 'smoke', 'noise'],
    data: {
      cleanedHazardCells: cleanedHazards,
      cleanedSurface,
      weapon: 'flamethrower',
    },
  });
  state.msgs.push(msg(`Огонь выжег слизь: ${cleanedHazards} кл.`, state.time, '#fa4'));
}

const projectileHitQuery: Entity[] = [];
const explosionHitQuery: Entity[] = [];

function projectilePathDelta(from: number, to: number): number {
  return ((to - from + W / 2) % W + W) % W - W / 2;
}

function projectilePathPoint(from: number, to: number, t: number): number {
  return ((from + projectilePathDelta(from, to) * t) % W + W) % W;
}

function projectilePathHitT(x0: number, y0: number, x1: number, y1: number, e: Entity, radius: number): number {
  const dx = projectilePathDelta(x0, x1);
  const dy = projectilePathDelta(y0, y1);
  const len2 = dx * dx + dy * dy;
  const ex = projectilePathDelta(x0, e.x);
  const ey = projectilePathDelta(y0, e.y);
  let t = len2 > 0.000001 ? (ex * dx + ey * dy) / len2 : 1;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const px = ex - dx * t;
  const py = ey - dy * t;
  return px * px + py * py <= radius * radius ? t : Infinity;
}

/* ── Projectile update: move, collide walls + entities ────────── */
function updateProjectiles(dt: number): void {
  const entityIndex = getEntityIndex();
  for (const p of entityIndex.projectiles) {
    if (p.type !== EntityType.PROJECTILE || !p.alive) continue;
    p.projLife = (p.projLife ?? 0) - dt;
    const pt = p.projType ?? ProjType.NORMAL;

    // Grenade explodes on timer expiry
    if (p.projLife! <= 0) {
      if (pt === ProjType.GRENADE || pt === ProjType.BFG) {
        triggerExplosion(p, pt);
      }
      p.alive = false;
      continue;
    }

    // ── 3D vertical physics: update vz → spriteZ ──
    const vz = p.vz ?? 0;
    const gravity = pt === ProjType.FLAME ? 1.8 : pt === ProjType.GRENADE ? 2.5 : pt === ProjType.BFG ? 0.3 : 1.2;
    p.vz = vz - gravity * dt;
    p.spriteZ = (p.spriteZ ?? 0.5) + vz * dt;

    // Floor impact (spriteZ ≤ 0)
    if ((p.spriteZ ?? 0) <= 0) {
      p.spriteZ = 0;
      if (pt === ProjType.GRENADE || pt === ProjType.BFG) {
        triggerExplosion(p, pt);
      } else {
        if (pt === ProjType.FLAME) resolveFlameCleanup(p, p.x, p.y, 1.0);
        spawnProjectileFloorImpact(world, p.x, p.y, p.sprite, pt);
        playProjectileImpactCue(p, p.x, p.y);
      }
      if (p.aoeRadius)
        psiAoeExplosion(p, entities, world, state.msgs, state.time, (e) => handleKill(e, p.ownerId === player.id));
      p.alive = false;
      continue;
    }
    // Ceiling impact (spriteZ ≥ 1)
    if ((p.spriteZ ?? 0) >= 1.0) {
      p.spriteZ = 1.0;
      p.vz = 0;
      if (pt === ProjType.GRENADE || pt === ProjType.BFG) {
        triggerExplosion(p, pt);
        p.alive = false;
        continue;
      }
      // Bounce off ceiling — reverse vz with damping
      p.vz = -Math.abs(vz) * 0.3;
    }

    // Flame: leave charred burn marks on floor while flying low
    if (pt === ProjType.FLAME && (p.spriteZ ?? 0.5) < 0.2) {
      const fx = Math.floor(p.x), fy = Math.floor(p.y);
      if (!world.solid(fx, fy)) {
        resolveFlameCleanup(p, p.x, p.y, 0.9);
        stampMark(world, fx, fy, (p.x % 1 + 1) % 1, (p.y % 1 + 1) % 1,
          0.25, MarkType.BURN, randSeed(), 8, 5, 2, 160);
      }
    }

    const prevX = p.x;
    const prevY = p.y;
    const nx = prevX + (p.vx ?? 0) * dt;
    const ny = prevY + (p.vy ?? 0) * dt;

    // Wrap toroidal
    const wx = ((nx % W) + W) % W;
    const wy = ((ny % W) + W) % W;

    // Wall collision → leave bullet hole decal
    if (world.solid(Math.floor(wx), Math.floor(wy))) {
      const cellX = Math.floor(wx), cellY = Math.floor(wy);
      const bvx = p.vx ?? 0, bvy = p.vy ?? 0;
      const avx = Math.abs(bvx), avy = Math.abs(bvy);
      let impactU: number;
      if (avx > avy) {
        const faceX = bvx > 0 ? cellX : cellX + 1;
        const t = avx > 0.01 ? (wx - faceX) / bvx : 0;
        impactU = ((wy - bvy * t) % 1 + 1) % 1;
      } else {
        const faceY = bvy > 0 ? cellY : cellY + 1;
        const t = avy > 0.01 ? (wy - faceY) / bvy : 0;
        impactU = ((wx - bvx * t) % 1 + 1) % 1;
      }
      const impactV = 1.0 - (p.spriteZ ?? 0.5);
      if (pt === ProjType.GRENADE || pt === ProjType.BFG) {
        // Explode on wall impact
        triggerExplosion(p, pt);
      } else {
        if (pt === ProjType.FLAME) resolveFlameCleanup(p, wx, wy, 1.0);
        spawnProjectileWallImpact(world, cellX, cellY, impactU, impactV, p.sprite, pt);
        playProjectileImpactCue(p, wx, wy);
      }
      if (p.aoeRadius && pt !== ProjType.GRENADE && pt !== ProjType.BFG)
        psiAoeExplosion(p, entities, world, state.msgs, state.time, (e) => handleKill(e, p.ownerId === player.id));
      p.alive = false;
      continue;
    }

    p.x = wx;
    p.y = wy;

    // Entity collision — check monsters and NPCs
    const baseDmg = p.projDmg ?? 0;
    const hitRadius = pt === ProjType.FLAME ? 0.8 : 0.6;
    entityIndex.queryPathRadius(prevX, prevY, p.x, p.y, hitRadius, projectileHitQuery, ENTITY_MASK_ACTOR);
    let nearestHit: Entity | undefined;
    let nearestHitT = Infinity;
    if (pt !== ProjType.FLAME) {
      for (const e of projectileHitQuery) {
        if (!e.alive || e.id === p.ownerId) continue;
        if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC && e.type !== EntityType.PLAYER) continue;
        const hitT = projectilePathHitT(prevX, prevY, p.x, p.y, e, hitRadius);
        if (hitT < nearestHitT) {
          nearestHit = e;
          nearestHitT = hitT;
        }
      }
    }
    for (const e of projectileHitQuery) {
      if (!e.alive || e.id === p.ownerId) continue;
      if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC && e.type !== EntityType.PLAYER) continue;
      if (pt !== ProjType.FLAME && e !== nearestHit) continue;
      const hitT = pt === ProjType.FLAME ? projectilePathHitT(prevX, prevY, p.x, p.y, e, hitRadius) : nearestHitT;
      if (hitT < Infinity) {
        const hitX = projectilePathPoint(prevX, p.x, hitT);
        const hitY = projectilePathPoint(prevY, p.y, hitT);
        const hitZ = p.spriteZ ?? 0.5;
        if (pt === ProjType.WEB) {
          applyPaupsinaWeb(e, state.time, state.msgs, state, projectileActor(p));
          spawnProjectileBodyImpact(world, hitX, hitY, p.sprite, pt, hitZ);
          playProjectileBodyHitCue(p, e.x, e.y, e.id === player.id);
          p.alive = false;
          break;
        }
        if (pt === ProjType.FLAME) reducePaupsinaWeb(e, state.time, state.msgs, state, projectileActor(p), 'fire');
        if (e.hp !== undefined) {
          const counterplayDmg = adjustMonsterProjectileDamage(e, p, baseDmg);
          const armor = applyMonsterArmorHit(world, state, e, {
            damage: counterplayDmg,
            attacker: projectileActor(p),
            weaponId: p.weapon,
            projectileType: pt,
          });
          const dmg = armor.damage;
          const debugImmortalPlayerHit = e.id === player.id && isDebugOnePunchManEnabled();
          if (debugImmortalPlayerHit) {
            keepDebugOnePunchManAlive(player);
          } else {
            e.hp -= dmg;
            tryMonsterProjectileStagger(world, state, e, p, player.id);
            if (e.type === EntityType.NPC && p.ownerId === player.id) {
              applyDamageRelationPenalty(player.faction, e.faction, dmg, e, player);
              recordFactionClashPlayerHit(state, world, player, e, dmg);
            }
            const hitAngle = Math.atan2(p.vy ?? 0, p.vx ?? 0);
            spawnBloodHit(world, hitX, hitY, hitAngle, dmg, e.type === EntityType.MONSTER, p.vx ?? 0, p.vy ?? 0, hitZ);
            spawnProjectileBodyImpact(world, hitX, hitY, p.sprite, pt, hitZ);
          }
          const playerHit = e.id === player.id;
          if (playerHit && !debugImmortalPlayerHit) reportPlayerProjectileHit(p, dmg);
          playProjectileBodyHitCue(p, e.x, e.y, playerHit);
          if (!debugImmortalPlayerHit && e.hp <= 0) {
            e.alive = false;
            e.hp = 0;
            handleKill(e, p.ownerId === player.id, p.vx ?? 0, p.vy ?? 0, p.projGore ?? 1);
            recordMonsterProjectileDeath(
              world,
              state,
              e,
              p,
              projectileActor(p),
              (target, vx, vy, gore) => handleKill(target, p.ownerId === player.id, vx, vy, gore),
            );
          }
        }
        if (pt === ProjType.GRENADE || pt === ProjType.BFG) {
          p.x = hitX;
          p.y = hitY;
          triggerExplosion(p, pt);
        } else if (p.aoeRadius) {
          p.x = hitX;
          p.y = hitY;
          psiAoeExplosion(p, entities, world, state.msgs, state.time, (e2) => handleKill(e2, p.ownerId === player.id));
        }
        // Flame projectiles pierce through (don't die on hit)
        if (pt !== ProjType.FLAME) {
          p.alive = false;
          break;
        }
      }
    }
  }
}

/* ── Explosion (grenade / BFG) — AoE damage + scorch decals ──── */
function triggerExplosion(p: Entity, pt: ProjType): void {
  const radius = p.aoeRadius ?? 4;
  const dmg = p.aoeDmg ?? p.projDmg ?? 80;
  const isPlayer = p.ownerId === player.id;
  const actor = projectileActor(p);

  // AoE damage to all entities in radius
  let hits = 0;
  getEntityIndex().queryRadius(p.x, p.y, radius, explosionHitQuery, ENTITY_MASK_ACTOR);
  for (const e of explosionHitQuery) {
    if (!e.alive || e.id === p.ownerId) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER && e.type !== EntityType.PLAYER) continue;
    const dx = ((e.x - p.x + W / 2) % W + W) % W - W / 2;
    const dy = ((e.y - p.y + W / 2) % W + W) % W - W / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) continue;
    if (e.hp !== undefined) {
      const falloff = 1 - (dist / radius) * 0.6;
      const rawFinalDmg = Math.round(dmg * falloff);
      const armor = applyMonsterArmorHit(world, state, e, {
        damage: rawFinalDmg,
        attacker: actor,
        weaponId: p.weapon,
        projectileType: pt,
        aoe: true,
      });
      const finalDmg = armor.damage;
      if (e.id === player.id && isDebugOnePunchManEnabled()) {
        keepDebugOnePunchManAlive(player);
        hits++;
        continue;
      }
      e.hp -= finalDmg;
      if (e.id === player.id) {
        const detail = actor && actor.id !== player.id
          ? `Взрыв от ${entityDisplayName(actor)}: -${finalDmg}`
          : `Взрыв: -${finalDmg}`;
        recordPlayerDamage(state, p, finalDmg, detail, 'projectile');
      }
      // Explosion blast pushes blood outward from epicenter
      const blastVx = dist > 0.1 ? (dx / dist) * 12 : 0;
      const blastVy = dist > 0.1 ? (dy / dist) * 12 : 0;
      spawnBloodHit(world, e.x, e.y, Math.atan2(dy, dx), finalDmg, e.type === EntityType.MONSTER, blastVx, blastVy, 0.4);
      if (e.type === EntityType.NPC && isPlayer) {
        applyDamageRelationPenalty(player.faction, e.faction, finalDmg, e, player);
        recordFactionClashPlayerHit(state, world, player, e, finalDmg);
      }
      if (e.hp <= 0) {
        e.alive = false;
        handleKill(e, isPlayer, blastVx, blastVy, 3);
      }
      hits++;
    }
  }

  // Scorch: one large coherent mark centered at explosion
  const cx = Math.floor(p.x), cy = Math.floor(p.y);
  const fx = (p.x % 1 + 1) % 1, fy = (p.y % 1 + 1) % 1;
  const seed = randSeed();
  stampMark(world, cx, cy, fx, fy, radius * 1.2, MarkType.SCORCH, seed, 15, 10, 5, 230);

  // Radial debris marks around explosion center
  const debrisCount = pt === ProjType.BFG ? 12 : 8;
  for (let i = 0; i < debrisCount; i++) {
    const ang = (i / debrisCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 0.5 + Math.random() * (radius * 0.5);
    const debX = p.x + Math.cos(ang) * dist;
    const debY = p.y + Math.sin(ang) * dist;
    const dcx = Math.floor(((debX % W) + W) % W);
    const dcy = Math.floor(((debY % W) + W) % W);
    if (!world.solid(dcx, dcy)) {
      const dfx = ((debX % 1) + 1) % 1, dfy = ((debY % 1) + 1) % 1;
      const markType = pt === ProjType.BFG ? MarkType.PSI : MarkType.BURN;
      const debrisR = pt === ProjType.BFG ? 10 : 15;
      const debrisG = pt === ProjType.BFG ? 30 : 10;
      const debrisB = pt === ProjType.BFG ? 10 : 5;
      stampMark(world, dcx, dcy, dfx, dfy, 0.12 + Math.random() * 0.15, markType,
        seed + i + 100, debrisR, debrisG, debrisB, 150 + Math.floor(Math.random() * 60));
    }
  }

  // Sounds
  playExplosion();
  publishExplosionNoise(state, actor, p.x, p.y, radius, pt === ProjType.BFG ? 'bfg' : 'grenade');

  // Screen flash for ALL explosions
  if (pt === ProjType.BFG) {
    state.dmgFlash = 0.8;
    state.dmgSeed = 2; // green tint marker
    state.msgs.push(msg(`БФГ! Уничтожено целей: ${hits}`, state.time, '#4f4'));
  } else {
    state.dmgFlash = Math.max(state.dmgFlash, 0.4);
    state.dmgSeed = 3; // orange tint marker for explosions
    state.msgs.push(msg(`Взрыв! Поражено: ${hits}`, state.time, '#fa0'));
  }
}

/* ── Restart check ────────────────────────────────────────────── */
function checkRestart(): void {
  if (state.gameOver && input.use) {
    deathCam = null;
    pendingLoad = () => { initGame(); };
    input.use = false;
  }
}

function movePlayerToMetroRoom(roomName: string): boolean {
  const room = world.rooms.find(r => r?.name === roomName);
  if (!room) return false;

  for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const ci = world.idx(x, y);
      if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
      player.x = world.wrap(x) + 0.5;
      player.y = world.wrap(y) + 0.5;
      player.angle += Math.PI;
      return true;
    }
  }

  player.x = world.wrap(room.x + Math.floor(room.w / 2)) + 0.5;
  player.y = world.wrap(room.y + Math.floor(room.h / 2)) + 0.5;
  player.angle += Math.PI;
  return true;
}

function passableSpawnCell(x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const ci = world.idx(Math.floor(x), Math.floor(y));
  const cell = world.cells[ci];
  return (cell === Cell.FLOOR || cell === Cell.WATER) && !world.solid(Math.floor(x), Math.floor(y));
}

function safeSpawnNear(savedX: unknown, savedY: unknown, fallbackX: number, fallbackY: number): { x: number; y: number } {
  const sx = Number(savedX);
  const sy = Number(savedY);
  if (passableSpawnCell(sx, sy)) return { x: sx, y: sy };

  const bx = Number.isFinite(sx) ? Math.floor(sx) : Math.floor(fallbackX);
  const by = Number.isFinite(sy) ? Math.floor(sy) : Math.floor(fallbackY);
  for (let r = 1; r <= 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = world.wrap(bx + dx) + 0.5;
        const y = world.wrap(by + dy) + 0.5;
        if (passableSpawnCell(x, y)) return { x, y };
      }
    }
  }

  if (passableSpawnCell(fallbackX, fallbackY)) return { x: fallbackX, y: fallbackY };
  return { x: world.wrap(Math.floor(fallbackX)) + 0.5, y: world.wrap(Math.floor(fallbackY)) + 0.5 };
}

function currentRouteRebuildGeneration(): FloorGeneration | undefined {
  if (getActiveFloorInstance(state)) return undefined;
  const entry = currentFloorRunEntry(state);
  if (entry.spec) return generateProceduralFloor(entry.spec);
  if (entry.designFloorId) return generateDesignFloor(entry.designFloorId);
  return undefined;
}

function floorTargetAllowsNpcPopulation(entry: ReturnType<typeof currentFloorRunEntry> | null | undefined, floor: FloorLevel): boolean {
  return floor !== FloorLevel.VOID && (!entry || floorRunEntryAllowsNpcs(entry));
}

function currentFloorAllowsNpcPopulation(): boolean {
  return floorTargetAllowsNpcPopulation(currentFloorRunEntry(state), state.currentFloor);
}

function captureCurrentAlifeFloor(): void {
  captureAlifeFloorState(state, entities);
}

function materializeCurrentAlifeFloor(floorKey = currentAlifeFloorKey(state)): void {
  materializeAlifeFloorPopulation(state, world, entities, nextEntityId, floorKey);
}

function switchFloor(
  direction: LiftDirection,
  overrideArrivalText?: string,
  overrideArrivalColor?: string,
  allowElevatorAnomaly = true,
): void {
  const fromFloor = state.currentFloor;
  captureCurrentAlifeFloor();
  let nextFloor: FloorLevel;
  const activeFloorInstance = allowElevatorAnomaly ? getActiveFloorInstance(state) : null;
  let runEntry = allowElevatorAnomaly
    ? (activeFloorInstance ? currentFloorRunEntry(state) : resolveFloorRunRoute(state, direction))
    : null;

  if (runEntry) {
    nextFloor = runEntry.baseFloor;
  } else {
    // Non-lift routes such as metro keep the old authored-floor behavior.
    if (direction === LiftDirection.DOWN) {
      if (state.currentFloor >= FloorLevel.HELL) return;
      nextFloor = (state.currentFloor + 1) as FloorLevel;
    } else {
      if (state.currentFloor <= FloorLevel.MINISTRY) return;
      nextFloor = (state.currentFloor - 1) as FloorLevel;
    }
  }
  resolveLiftArachnaDeparture(world, player, state);
  clearPseudoliftActive(state);
  const liftZoneId = world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
  const route = allowElevatorAnomaly
    ? resolveElevatorRoute(state, fromFloor, nextFloor, direction, liftZoneId)
    : { targetFloor: nextFloor, activeInstance: null, anomaly: false, leavingInstance: false, exitedInstance: null };
  nextFloor = route.targetFloor;
  if (allowElevatorAnomaly && runEntry) {
    commitFloorRunEntry(state, runEntry);
  }
  const generatedRunEntry = route.activeInstance ? null : runEntry;
  const intendedRunEntry = route.activeInstance ? currentFloorRunEntry(state) : generatedRunEntry;
  const returnDirection = direction === LiftDirection.DOWN ? LiftDirection.UP : LiftDirection.DOWN;
  if (route.activeInstance) {
    spreadElevatorInstanceRumor(world, entities, player, state, route.activeInstance);
  }

  // Save player position for same-xy spawn
  const savedX = player.x;
  const savedY = player.y;
  const savedAngle = player.angle;

  // Save player state
  const savedInventory = player.inventory ? [...player.inventory] : [];
  const savedNeeds = player.needs ? { ...player.needs } : freshNeeds();
  const savedHp = player.hp ?? 100;
  const savedMaxHp = player.maxHp ?? 100;
  const savedWeapon = player.weapon ?? '';
  const savedTool = player.tool ?? '';
  const savedRpg = player.rpg ? { ...player.rpg } : freshRPG(1);
  const savedStatuses = player.statuses?.map(s => ({ ...s }));
  const savedMoney = player.money ?? 100;

  state.currentFloor = nextFloor;
  if (nextFloor === FloorLevel.VOID) setVoidEntryFromFloor(state, fromFloor);
  else setVoidEntryFromFloor(state, undefined);

  // Defer heavy generation — game loop will show loading screen first
  pendingLoad = () => {
    resetNoiseRecords();
    resetGeneratedFloorPopulationState();
    // Generate new floor
    const gen = generatedRunEntry?.spec
      ? generateProceduralFloor(generatedRunEntry.spec)
      : generatedRunEntry?.designFloorId
        ? generateDesignFloor(generatedRunEntry.designFloorId)
        : generateFloor(nextFloor);

    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
    materializeCurrentAlifeFloor();

    const spawn = safeSpawnNear(savedX, savedY, gen.spawnX, gen.spawnY);
    player = {
      id: nextEntityId.v++,
      type: EntityType.PLAYER,
      x: spawn.x,
      y: spawn.y,
      angle: savedAngle,
      pitch: 0,
      alive: true,
      speed: 3.0,
      sprite: 0,
      needs: savedNeeds,
      hp: savedHp,
      maxHp: savedMaxHp,
      inventory: savedInventory,
      weapon: savedWeapon,
      tool: savedTool,
      money: savedMoney,
      rpg: savedRpg,
      statuses: savedStatuses,
      name: playerDisplayName(),
      faction: Faction.PLAYER,
      ...playerAlifeFields(player),
    };
    entities.push(player);
    applyContractFloorHooks(state, world, entities, nextEntityId, player);
    prevPlayerHp = player.hp ?? 100;

    initFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    state.samosborTimer = adjustFloorRunSamosborTimer(state, nextFloorEntrySamosborTimer(nextFloor));
    state.samosborActive = false;
    floorTeleportCd = 0;

    resetPsiState();

    const arrivalText = overrideArrivalText ?? (route.activeInstance
      ? `Лифт ошибся: ${floorInstanceLabel(route.activeInstance)}`
      : route.exitedInstance
        ? `Петля разомкнулась: ${generatedRunEntry?.label ?? FLOOR_NAMES[nextFloor]}`
        : generatedRunEntry?.procedural || generatedRunEntry?.designFloorId
          ? `Лифт прибыл: ${generatedRunEntry.label}`
          : `Лифт прибыл: ${FLOOR_NAMES[nextFloor]}`);
    state.msgs.push(msg(
      arrivalText,
      state.time,
      overrideArrivalColor ?? (route.activeInstance ? '#f4a' : route.exitedInstance ? '#8cf' : generatedRunEntry?.color ?? FLOOR_MESSAGE_COLORS[nextFloor]),
    ));
    const arrivalLead = route.activeInstance
      ? `Маршрут прерван: номерной лифт ${floorInstanceLabel(route.activeInstance)}, риск ${route.activeInstance.risk}/5. Возврат: следующий лифт ведет к ${intendedRunEntry ? floorRunEntryLiftLabel(intendedRunEntry) : 'плановому маршруту'}.`
      : generatedRunEntry
        ? floorRunArrivalLead(generatedRunEntry, returnDirection)
        : undefined;
    if (arrivalLead) state.msgs.push(msg(arrivalLead, state.time, route.activeInstance ? '#f4a' : generatedRunEntry?.color ?? '#8cf'));
    const transitionTags = ['floor', 'floor_transition', 'lift', route.activeInstance ? 'elevator_anomaly' : 'normal'];
    if (generatedRunEntry?.designFloorId) transitionTags.push('design_floor', generatedRunEntry.designFloorId);
    if (generatedRunEntry?.spec) transitionTags.push('procedural');
    for (const tag of proceduralAnomalyEventTags(generatedRunEntry?.spec)) {
      if (!transitionTags.includes(tag)) transitionTags.push(tag);
    }
    const anomalyData = proceduralAnomalyEventData(generatedRunEntry?.spec);
    publishEvent(state, {
      type: 'floor_transition',
      zoneId: world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))],
      x: player.x,
      y: player.y,
      actorId: player.id,
      actorName: player.name,
      actorFaction: player.faction,
      severity: route.activeInstance || route.exitedInstance ? 4 : 3,
      privacy: 'local',
      tags: transitionTags,
      data: {
        fromFloor,
        toFloor: nextFloor,
        direction: direction === LiftDirection.DOWN ? 'down' : 'up',
        sourceZoneId: liftZoneId,
        elevatorAnomaly: route.activeInstance !== null,
        exitedLoop: route.exitedInstance !== null,
        floorZ: generatedRunEntry?.z,
        designFloor: generatedRunEntry?.designFloorId,
        proceduralFloor: generatedRunEntry?.spec?.key,
        proceduralSeed: generatedRunEntry?.spec?.seed,
        proceduralDanger: generatedRunEntry?.spec?.danger,
        routeKind: intendedRunEntry ? floorRunEntryKindLabel(intendedRunEntry) : undefined,
        routeId: intendedRunEntry ? floorRunEntryRouteId(intendedRunEntry) : undefined,
        routeDanger: intendedRunEntry ? floorRunEntryDanger(intendedRunEntry) : undefined,
        routeRole: intendedRunEntry ? floorRunEntryRole(intendedRunEntry) : undefined,
        returnDirection: returnDirection === LiftDirection.DOWN ? 'down' : 'up',
        ...anomalyData,
      },
    });

    // Auto-trigger voice quest when entering Hell with step 9 (kill Mancobus) done
    const enteredStoryHell = generatedRunEntry
      ? generatedRunEntry.storyFloor === FloorLevel.HELL
      : nextFloor === FloorLevel.HELL && !allowElevatorAnomaly;
    if (!route.activeInstance && enteredStoryHell) {
      onHellArrival(player, state);
      tryCreateVoiceQuest(world, entities, state);
    }
    ensureRoomContainers(world, state.currentFloor);
    ensureProductionRooms(state, world);
    prepareEditableFloor();
    ensureProceduralSpriteSeeds(entities);
    restoreVoidReturnPortalForCurrentWorld();
    if (allowElevatorAnomaly) {
      tryStartLiftArachnaEncounter(world, player, state, {
        direction,
        runEntry: generatedRunEntry,
        activeInstance: route.activeInstance,
      });
    } else {
      clearLiftArachnaActive(state);
    }

    // Update WebGL world data after floor change
    setGeneratedDynamicSky(gen);
    updateWorldData(world);
  };
}

/* ── Portal transition to Void floor ──────────────────────────── */
function enterVoidFloor(): void {
  const fromFloor = state.currentFloor;
  captureCurrentAlifeFloor();
  const savedInventory = player.inventory ? [...player.inventory] : [];
  const savedNeeds = player.needs ? { ...player.needs } : freshNeeds();
  const savedHp = player.hp ?? 100;
  const savedMaxHp = player.maxHp ?? 100;
  const savedWeapon = player.weapon ?? '';
  const savedTool = player.tool ?? '';
  const savedRpg = player.rpg ? { ...player.rpg } : freshRPG(1);
  const savedStatuses = player.statuses?.map(s => ({ ...s }));
  const savedMoney = player.money ?? 100;
  const savedAngle = player.angle;

  state.currentFloor = FloorLevel.VOID;
  forceFloorRunStory(state, FloorLevel.VOID);
  state.gameWon = false;
  clearPseudoliftActive(state);
  clearVoidReturnPortalState(state);
  setVoidEntryFromFloor(state, fromFloor);

  pendingLoad = () => {
    const gen = generateFloor(FloorLevel.VOID);
    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;

    player = {
      id: nextEntityId.v++,
      type: EntityType.PLAYER,
      x: gen.spawnX,
      y: gen.spawnY,
      angle: savedAngle,
      pitch: 0,
      alive: true,
      speed: 3.0,
      sprite: 0,
      needs: savedNeeds,
      hp: savedHp,
      maxHp: savedMaxHp,
      inventory: savedInventory,
      weapon: savedWeapon,
      tool: savedTool,
      money: savedMoney,
      rpg: savedRpg,
      statuses: savedStatuses,
      name: playerDisplayName(),
      faction: Faction.PLAYER,
      ...playerAlifeFields(player),
    };
    entities.push(player);
    applyContractFloorHooks(state, world, entities, nextEntityId, player);
    prevPlayerHp = player.hp ?? 100;

    initFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    resetPsiState();

    state.samosborTimer = nextFloorEntrySamosborTimer(FloorLevel.VOID);
    state.samosborActive = false;
    floorTeleportCd = 0;
    clearLiftArachnaActive(state);

    publishEvent(state, {
      type: 'floor_transition',
      zoneId: world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))],
      x: player.x,
      y: player.y,
      actorId: player.id,
      actorName: player.name,
      actorFaction: player.faction,
      severity: 5,
      privacy: 'local',
      tags: ['floor', 'floor_transition', 'void'],
      data: { fromFloor, toFloor: FloorLevel.VOID, portal: true },
    });

    onVoidEntry(state);
    ensureRoomContainers(world, state.currentFloor);
    ensureProductionRooms(state, world);
    prepareEditableFloor();
    ensureProceduralSpriteSeeds(entities);
    restoreVoidReturnPortalForCurrentWorld();

    setGeneratedDynamicSky(gen);
    updateWorldData(world);
  };
}

interface DebugTeleportTarget {
  floor: FloorLevel;
  label: string;
  color: string;
  z?: number;
  designFloorId?: DesignFloorId;
  spec?: ProceduralFloorSpec;
}

function formatFloorZ(z: number): string {
  return z > 0 ? `+${z}` : `${z}`;
}

function debugTeleportTo(target: DebugTeleportTarget): void {
  const fromFloor = state.currentFloor;
  captureCurrentAlifeFloor();
  const savedInventory = player.inventory ? [...player.inventory] : [];
  const savedNeeds = player.needs ? { ...player.needs } : freshNeeds();
  const savedHp = player.hp ?? 100;
  const savedMaxHp = player.maxHp ?? 100;
  const savedWeapon = player.weapon ?? '';
  const savedTool = player.tool ?? '';
  const savedRpg = player.rpg ? { ...player.rpg } : freshRPG(1);
  const savedStatuses = player.statuses?.map(s => ({ ...s }));
  const savedMoney = player.money ?? 100;
  const savedAngle = player.angle;

  state.showDebug = false;
  state.currentFloor = target.floor;
  clearPseudoliftActive(state);
  if (target.floor === FloorLevel.VOID) setVoidEntryFromFloor(state, fromFloor);
  else setVoidEntryFromFloor(state, undefined);
  if (target.spec) {
    const run = ensureFloorRunState(state, target.floor);
    run.currentZ = target.spec.z;
    run.visited[target.spec.key] = true;
  } else if (target.designFloorId && target.z !== undefined) {
    const run = ensureFloorRunState(state, target.floor);
    run.currentZ = target.z;
  } else {
    forceFloorRunStory(state, target.floor);
  }
  const floorInstances = ensureFloorInstanceState(state, target.floor);
  floorInstances.current = null;
  floorInstances.lastStableFloor = target.floor;

  pendingLoad = () => {
    resetGeneratedFloorPopulationState();
    const gen = target.spec
      ? generateProceduralFloor(target.spec)
      : target.designFloorId
        ? generateDesignFloor(target.designFloorId)
        : generateFloor(target.floor);

    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
    materializeCurrentAlifeFloor();

    player = {
      id: nextEntityId.v++,
      type: EntityType.PLAYER,
      x: gen.spawnX,
      y: gen.spawnY,
      angle: savedAngle,
      pitch: 0,
      alive: true,
      speed: 3.0,
      sprite: 0,
      needs: savedNeeds,
      hp: savedHp,
      maxHp: savedMaxHp,
      inventory: savedInventory,
      weapon: savedWeapon,
      tool: savedTool,
      money: savedMoney,
      rpg: savedRpg,
      statuses: savedStatuses,
      name: playerDisplayName(),
      faction: Faction.PLAYER,
      ...playerAlifeFields(player),
    };
    entities.push(player);
    applyContractFloorHooks(state, world, entities, nextEntityId, player);
    prevPlayerHp = player.hp ?? 100;

    initFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    state.samosborTimer = adjustFloorRunSamosborTimer(state, nextFloorEntrySamosborTimer(target.floor));
    state.samosborActive = false;
    floorTeleportCd = 0;
    resetPsiState();
    clearLiftArachnaActive(state);

    state.msgs.push(msg(`[DEBUG] Телепорт: ${target.label}`, state.time, target.color));
    const transitionTags = ['floor', 'floor_transition', 'debug', target.spec ? 'procedural' : target.designFloorId ? 'design_floor' : 'story'];
    for (const tag of proceduralAnomalyEventTags(target.spec)) {
      if (!transitionTags.includes(tag)) transitionTags.push(tag);
    }
    const anomalyData = proceduralAnomalyEventData(target.spec);
    publishEvent(state, {
      type: 'floor_transition',
      zoneId: world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))],
      x: player.x,
      y: player.y,
      actorId: player.id,
      actorName: player.name,
      actorFaction: player.faction,
      severity: 3,
      privacy: 'local',
      tags: transitionTags,
      data: {
        fromFloor,
        toFloor: target.floor,
        debugTeleport: true,
        floorZ: target.spec?.z ?? target.z,
        designFloor: target.designFloorId,
        proceduralFloor: target.spec?.key,
        proceduralSeed: target.spec?.seed,
        proceduralDanger: target.spec?.danger,
        ...anomalyData,
      },
    });

    if (!target.spec && !target.designFloorId && target.floor === FloorLevel.HELL) {
      onHellArrival(player, state);
      tryCreateVoiceQuest(world, entities, state);
    }
    if (!target.spec && !target.designFloorId && target.floor === FloorLevel.VOID) onVoidEntry(state);

    ensureRoomContainers(world, state.currentFloor);
    ensureProductionRooms(state, world);
    prepareEditableFloor();
    ensureProceduralSpriteSeeds(entities);
    restoreVoidReturnPortalForCurrentWorld();
    setGeneratedDynamicSky(gen);
    updateWorldData(world);
  };
}

function debugTeleportToRandomProceduralFloor(): void {
  const run = ensureFloorRunState(state);
  const z = PROCEDURAL_FLOOR_ZS[Math.floor(Math.random() * PROCEDURAL_FLOOR_ZS.length)];
  const spec = run.specs[proceduralFloorKey(z)];
  debugTeleportTo({
    floor: spec.baseFloor,
    label: `Этаж ${formatFloorZ(z)}: ${spec.title}`,
    color: spec.anomalyId === 'none' ? '#8cf' : '#c8f',
    spec,
  });
}

function debugTeleportToProceduralAnomaly(anomalyId: FloorAnomalyId): void {
  const spec = forceProceduralFloorAnomaly(state, anomalyId);
  if (!spec) {
    state.msgs.push(msg(`[DEBUG] Нет процедурного этажа для аномалии ${anomalyId}`, state.time, '#f84'));
    return;
  }
  debugTeleportTo({
    floor: spec.baseFloor,
    label: `Этаж ${formatFloorZ(spec.z)}: ${spec.title}`,
    color: '#c8f',
    spec,
  });
}

function handleDebugCommandAction(action: DebugCommandAction): void {
  switch (action.type) {
    case 'teleport_story_floor':
      debugTeleportTo({
        floor: action.floor,
        label: FLOOR_NAMES[action.floor],
        color: FLOOR_MESSAGE_COLORS[action.floor],
      });
      break;
    case 'teleport_random_procedural_floor':
      debugTeleportToRandomProceduralFloor();
      break;
    case 'teleport_procedural_anomaly':
      debugTeleportToProceduralAnomaly(action.anomalyId);
      break;
    case 'teleport_design_floor':
      debugTeleportTo({
        floor: action.floor,
        label: `Этаж ${formatFloorZ(action.z)}: ${action.label}`,
        color: action.color,
        z: action.z,
        designFloorId: action.id,
      });
      break;
    case 'refresh_world_data':
      updateWorldData(world);
      break;
  }
}

/* ── NPC interaction menu ──────────────────────────────────────── */
function openNpcMenu(npc: Entity): void {
  state.showNpcMenu = true;
  state.npcMenuSel = 0;
  state.npcMenuTarget = npc.id;
  state.npcMenuTab = 'main';
  state.npcTalkText = '';
  state.tradeCursorX = 0;
  state.tradeCursorY = 0;
  state.tradeSide = 'npc';
  // Generate NPC trade inventory if empty
  if (!npc.inventory || npc.inventory.length === 0) {
    npc.inventory = generateNpcTradeItems(npc);
  }
  primeTradePriceCache(state, [npc.inventory, player.inventory]);
  const report = tryReportLiquidatorCultClashAftermath(state, world, player, npc);
  if (report) state.msgs.push(msg(report, state.time, '#8cf'));
}

function openContainerMenu(container: WorldContainer): void {
  state.showContainerMenu = true;
  state.containerMenuTarget = container.id;
  state.containerCursorX = 0;
  state.containerCursorY = 0;
  state.containerSide = 'container';
  const access = containerAccessInfo(container, player, state);
  if (!access.canTake && !access.canPut) {
    state.msgs.push(msg(access.detail, state.time, '#f84'));
  } else if (access.theft) {
    state.msgs.push(msg('Чужой контейнер: взятие будет кражей.', state.time, '#f84'));
  }
}

function closeContainerMenu(): void {
  state.showContainerMenu = false;
  state.containerMenuTarget = -1;
  state.containerCursorX = 0;
  state.containerCursorY = 0;
  state.containerSide = 'container';
}

/* ── Save / Load ──────────────────────────────────────────────── */
const SAVE_KEY = 'gigahrush_save';
const SAVE_INVENTORY_SLOT_CAP = 25;
const SAVE_QUEST_CAP = 512;
const SAVE_TEXT_CAP = 192;
const MAX_SAVE_MONEY = 999_999;
const MAX_SAVE_LEVEL = 99;
const MAX_QUEST_TIME_LIMIT_MINUTES = 5 * 24 * 60;
const EVENT_PRIVACIES: readonly WorldEventPrivacy[] = ['public', 'local', 'witnessed', 'private', 'secret'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function finiteInt(value: unknown, fallback: number): number {
  return Math.trunc(finiteNumber(value, fallback));
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, finiteNumber(value, fallback)));
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, finiteInt(value, fallback)));
}

function cleanSaveText(value: unknown, fallback = '', max = SAVE_TEXT_CAP): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function compactSaveData(value: unknown, depth = 0): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value.slice(0, 512);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (depth >= 2) return undefined;
    const out: unknown[] = [];
    for (const item of value.slice(0, 16)) {
      const clean = compactSaveData(item, depth + 1);
      if (clean !== undefined) out.push(clean);
    }
    return out;
  }
  if (isRecord(value)) {
    if (depth >= 2) return undefined;
    const out: Record<string, unknown> = {};
    let used = 0;
    for (const [rawKey, rawValue] of Object.entries(value)) {
      if (used >= 16) break;
      const key = rawKey.slice(0, 48);
      const clean = compactSaveData(rawValue, depth + 1);
      if (key && clean !== undefined) {
        out[key] = clean;
        used++;
      }
    }
    return out;
  }
  return undefined;
}

function normalizeNeeds(input: unknown): Needs {
  const src = isRecord(input) ? input : {};
  const base = freshNeeds();
  return {
    food: clampNumber(src.food, base.food, 0, 100),
    water: clampNumber(src.water, base.water, 0, 100),
    sleep: clampNumber(src.sleep, base.sleep, 0, 100),
    pee: clampNumber(src.pee, base.pee, 0, 100),
    poo: clampNumber(src.poo, base.poo, 0, 100),
    pendingPee: src.pendingPee === undefined ? undefined : clampNumber(src.pendingPee, 0, 0, 100),
    pendingPoo: src.pendingPoo === undefined ? undefined : clampNumber(src.pendingPoo, 0, 0, 100),
  };
}

function normalizeInventory(input: unknown): Item[] {
  if (!Array.isArray(input)) return [];
  const out: Item[] = [];
  for (const raw of input) {
    if (out.length >= SAVE_INVENTORY_SLOT_CAP || !isRecord(raw)) break;
    const defId = cleanSaveText(raw.defId, '', 64);
    const def = ITEMS[defId];
    if (!def) continue;
    let count = clampInt(raw.count, 1, 1, Math.max(1, getStack(def) * SAVE_INVENTORY_SLOT_CAP));
    const data = compactSaveData(raw.data);
    while (count > 0 && out.length < SAVE_INVENTORY_SLOT_CAP) {
      const add = Math.min(count, getStack(def));
      out.push(data === undefined ? { defId, count: add } : { defId, count: add, data });
      count -= add;
    }
  }
  return out;
}

function normalizeEquippedItem(
  value: unknown,
  inventory: readonly Item[],
  itemType: ItemType.WEAPON | ItemType.TOOL,
): string {
  const defId = cleanSaveText(value, '', 64);
  if (!defId || !inventory.some(slot => slot.defId === defId)) return '';
  const def = ITEMS[defId];
  if (!def || def.type !== itemType) return '';
  if (itemType === ItemType.WEAPON && !WEAPON_STATS[defId]) return '';
  return defId;
}

function normalizeRpg(input: unknown): RPGStats {
  const src = isRecord(input) ? input : {};
  const level = clampInt(src.level, 1, 1, MAX_SAVE_LEVEL);
  const rpg = freshRPG(level);
  rpg.xp = clampInt(src.xp, 0, 0, 1_000_000);
  rpg.attrPoints = clampInt(src.attrPoints, 0, 0, MAX_SAVE_LEVEL);
  rpg.str = clampInt(src.str, 0, 0, MAX_SAVE_LEVEL);
  rpg.agi = clampInt(src.agi, 0, 0, MAX_SAVE_LEVEL);
  rpg.int = clampInt(src.int, 0, 0, MAX_SAVE_LEVEL);
  rpg.maxPsi = getMaxPsi(rpg);
  rpg.psi = clampNumber(src.psi, rpg.maxPsi, 0, rpg.maxPsi);
  return rpg;
}

function normalizeClock(input: unknown): GameClock {
  const src = isRecord(input) ? input : {};
  const totalMinutes = clampInt(src.totalMinutes, 0, 0, 365 * 24 * 60);
  return {
    hour: clampInt(src.hour, Math.floor(totalMinutes / 60) % 24, 0, 23),
    minute: clampInt(src.minute, totalMinutes % 60, 0, 59),
    totalMinutes,
  };
}

function normalizeQuestType(value: unknown): QuestType | undefined {
  return typeof value === 'number' && QuestType[value] !== undefined ? value as QuestType : undefined;
}

function normalizeRoomType(value: unknown): RoomType | undefined {
  return typeof value === 'number' && RoomType[value] !== undefined ? value as RoomType : undefined;
}

function normalizeMonsterKind(value: unknown): MonsterKind | undefined {
  return typeof value === 'number' && MonsterKind[value] !== undefined ? value as MonsterKind : undefined;
}

function normalizeFaction(value: unknown): Faction | undefined {
  return typeof value === 'number' && Faction[value] !== undefined ? value as Faction : undefined;
}

function normalizeEventPrivacy(value: unknown): WorldEventPrivacy | undefined {
  return typeof value === 'string' && EVENT_PRIVACIES.includes(value as WorldEventPrivacy)
    ? value as WorldEventPrivacy
    : undefined;
}

function normalizeEventSeverity(value: unknown): WorldEventSeverity | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(5, Math.round(value))) as WorldEventSeverity
    : undefined;
}

function normalizeStringArray(value: unknown, maxItems = 8, maxLen = 48): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const raw of value) {
    if (out.length >= maxItems) break;
    if (typeof raw !== 'string') continue;
    const clean = raw.slice(0, maxLen);
    if (clean && !out.includes(clean)) out.push(clean);
  }
  return out.length > 0 ? out : undefined;
}

function normalizeRewardList(value: unknown): Quest['extraRewards'] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: { defId: string; count: number }[] = [];
  for (const raw of value) {
    if (out.length >= 8 || !isRecord(raw)) break;
    const defId = cleanSaveText(raw.defId, '', 64);
    if (!ITEMS[defId]) continue;
    out.push({ defId, count: clampInt(raw.count, 1, 1, 999) });
  }
  return out.length > 0 ? out : undefined;
}

function normalizeQuest(raw: unknown, nowMinutes: number): Quest | null {
  if (!isRecord(raw)) return null;
  const type = normalizeQuestType(raw.type);
  if (type === undefined) return null;
  const desc = cleanSaveText(raw.desc);
  if (!desc) return null;
  const id = clampInt(raw.id, 0, 1, 1_000_000);
  const done = raw.done === true || raw.failed === true;
  const q: Quest = {
    id,
    type,
    giverId: clampInt(raw.giverId, -1, -1, 1_000_000),
    giverName: cleanSaveText(raw.giverName, '???', 96),
    desc,
    done,
  };

  const targetItem = cleanSaveText(raw.targetItem, '', 64);
  if (targetItem === 'money' || ITEMS[targetItem]) q.targetItem = targetItem;
  if (raw.targetCount !== undefined) q.targetCount = clampInt(raw.targetCount, 1, 1, 999);
  if (typeof raw.targetRoom === 'number' && Number.isFinite(raw.targetRoom)) {
    q.targetRoom = clampInt(raw.targetRoom, -1, -1, 100_000);
  }
  if (isFloorLevel(raw.targetFloor)) q.targetFloor = raw.targetFloor;
  const targetRoomType = normalizeRoomType(raw.targetRoomType);
  if (targetRoomType !== undefined) q.targetRoomType = targetRoomType;
  const targetZoneTag = cleanSaveText(raw.targetZoneTag, '', 48);
  if (targetZoneTag) q.targetZoneTag = targetZoneTag;
  const targetHint = cleanSaveText(raw.targetHint);
  if (targetHint) q.targetHint = targetHint;
  const targetMonsterKind = normalizeMonsterKind(raw.targetMonsterKind);
  if (targetMonsterKind !== undefined) q.targetMonsterKind = targetMonsterKind;
  if (raw.killCount !== undefined) q.killCount = clampInt(raw.killCount, 0, 0, 999);
  if (raw.killNeeded !== undefined) q.killNeeded = clampInt(raw.killNeeded, 1, 1, 999);
  if (typeof raw.targetNpcId === 'number' && Number.isFinite(raw.targetNpcId)) {
    q.targetNpcId = clampInt(raw.targetNpcId, -1, -1, 1_000_000);
  }
  const targetNpcName = cleanSaveText(raw.targetNpcName, '', 96);
  if (targetNpcName) q.targetNpcName = targetNpcName;
  const targetPlotNpcId = cleanSaveText(raw.targetPlotNpcId, '', 64);
  if (targetPlotNpcId) q.targetPlotNpcId = targetPlotNpcId;
  const rewardItem = cleanSaveText(raw.rewardItem, '', 64);
  if (ITEMS[rewardItem]) q.rewardItem = rewardItem;
  if (raw.rewardCount !== undefined) q.rewardCount = clampInt(raw.rewardCount, 1, 1, 999);
  q.extraRewards = normalizeRewardList(raw.extraRewards);
  if (raw.relationDelta !== undefined) q.relationDelta = clampInt(raw.relationDelta, 0, -100, 100);
  if (raw.difficulty !== undefined) q.difficulty = clampNumber(raw.difficulty, 1, 0, 10);
  if (raw.xpReward !== undefined) q.xpReward = clampInt(raw.xpReward, 0, 0, 100_000);
  if (raw.moneyReward !== undefined) q.moneyReward = clampInt(raw.moneyReward, 0, 0, MAX_SAVE_MONEY);
  if (typeof raw.plotStepIndex === 'number' && Number.isFinite(raw.plotStepIndex)) {
    q.plotStepIndex = clampInt(raw.plotStepIndex, 0, 0, 10_000);
  }
  const sideQuestId = cleanSaveText(raw.sideQuestId, '', 96);
  if (sideQuestId) q.sideQuestId = sideQuestId;
  const contractId = cleanSaveText(raw.contractId, '', 96);
  if (contractId) q.contractId = contractId;
  const contractFaction = normalizeFaction(raw.contractFaction);
  if (contractFaction !== undefined) q.contractFaction = contractFaction;
  if (raw.contractRank !== undefined) q.contractRank = clampInt(raw.contractRank, 0, 0, 10);
  if (isFloorLevel(raw.visitFloor)) q.visitFloor = raw.visitFloor;
  q.eventTags = normalizeStringArray(raw.eventTags);
  const eventData = compactSaveData(raw.eventData);
  if (isRecord(eventData)) q.eventData = eventData;
  q.eventPrivacy = normalizeEventPrivacy(raw.eventPrivacy);
  q.eventSeverity = normalizeEventSeverity(raw.eventSeverity);
  const eventTargetName = cleanSaveText(raw.eventTargetName);
  if (eventTargetName) q.eventTargetName = eventTargetName;
  const failOnNpcDeathPlotId = cleanSaveText(raw.failOnNpcDeathPlotId, '', 64);
  if (failOnNpcDeathPlotId) q.failOnNpcDeathPlotId = failOnNpcDeathPlotId;
  q.abandonsSideQuestIds = normalizeStringArray(raw.abandonsSideQuestIds, 12, 96);

  const timeLimit = raw.timeLimitMinutes === undefined
    ? undefined
    : clampInt(raw.timeLimitMinutes, 0, 1, MAX_QUEST_TIME_LIMIT_MINUTES);
  let expiresAt = raw.expiresAtMinutes === undefined
    ? undefined
    : clampInt(raw.expiresAtMinutes, 0, 0, nowMinutes + MAX_QUEST_TIME_LIMIT_MINUTES);
  if (timeLimit !== undefined) {
    q.timeLimitMinutes = timeLimit;
    if (expiresAt === undefined && !done) expiresAt = Math.ceil(nowMinutes + timeLimit);
  }
  if (expiresAt !== undefined) q.expiresAtMinutes = expiresAt;
  if (raw.failed === true) q.failed = true;

  if (!q.done) {
    if (type === QuestType.FETCH && !q.targetItem) return null;
    if (type === QuestType.VISIT && q.targetRoom === undefined && q.visitFloor === undefined) return null;
    if (type === QuestType.KILL && q.targetMonsterKind === undefined && !q.targetPlotNpcId && q.killNeeded === undefined) return null;
    if (type === QuestType.TALK && q.targetNpcId === undefined && !q.targetPlotNpcId) return null;
  }

  return q;
}

function normalizeQuestList(input: unknown, nextQuestIdInput: unknown, nowMinutes: number): { quests: Quest[]; nextQuestId: number } {
  const quests: Quest[] = [];
  if (Array.isArray(input)) {
    for (const raw of input) {
      if (quests.length >= SAVE_QUEST_CAP) break;
      const quest = normalizeQuest(raw, nowMinutes);
      if (quest) quests.push(quest);
    }
  }
  let nextQuestId = clampInt(nextQuestIdInput, 1, 1, 1_000_001);
  for (const quest of quests) nextQuestId = Math.max(nextQuestId, quest.id + 1);
  return { quests, nextQuestId };
}

function saveGame(): void {
  try {
    captureCurrentAlifeFloor();
    const data = createGameSavePayload(player, state, world.containers, {
      voidReturnPortal: voidReturnPortalStateForSave(state),
      voidEntryFromFloor: (state as VoidReturnPortalHost).voidEntryFromFloor,
    });
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    state.msgs.push(msg('Игра сохранена', state.time, '#4f4'));
  } catch {
    state.msgs.push(msg('Ошибка сохранения!', state.time, '#f44'));
  }
}

function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      state.msgs.push(msg('Нет сохранения', state.time, '#f84'));
      return false;
    }
    const parsed = JSON.parse(raw);
    const versionStatus = saveShapeVersionStatus(parsed);
    if (versionStatus !== 'current') {
      const text = versionStatus === 'newer'
        ? 'Сохранение новее этой сборки: загрузка отменена'
        : versionStatus === 'invalid'
          ? 'Сохранение повреждено: загрузка отменена'
          : 'Сохранение старой версии: начните новую игру';
      state.msgs.push(msg(text, state.time, '#f44'));
      return false;
    }
    const data = isRecord(parsed) ? parsed : {};
    const dataPlayer = isRecord(data.player) ? data.player : {};
    const dataState = isRecord(data.state) ? data.state : {};
    const savedFloor = isFloorLevel(dataState.currentFloor) ? dataState.currentFloor : FloorLevel.LIVING;
    const savedFloorRun = floorRunSaveHasRestorableRoute(dataState.floorRun)
      ? dataState.floorRun as Parameters<typeof setFloorRunState>[1]
      : undefined;
    const normalizedNeeds = normalizeNeeds(dataPlayer.needs);
    const normalizedInventory = normalizeInventory(dataPlayer.inventory);
    const normalizedRpg = normalizeRpg(dataPlayer.rpg);
    const normalizedMaxHp = getMaxHp(normalizedRpg);
    const normalizedClock = normalizeClock(dataState.clock);
    const normalizedQuests = normalizeQuestList(dataState.quests, dataState.nextQuestId, normalizedClock.totalMinutes);
    const normalizedWeapon = normalizeEquippedItem(dataPlayer.weapon, normalizedInventory, ItemType.WEAPON);
    const normalizedTool = normalizeEquippedItem(dataPlayer.tool, normalizedInventory, ItemType.TOOL);

    setFloorRunState(state, savedFloorRun, savedFloor);
    const loadedFloorInstances = setFloorInstanceState(state, dataState.floorInstances as Parameters<typeof setFloorInstanceState>[1], savedFloor);
    setLiftArachnaState(state, dataState.liftArachna as Parameters<typeof setLiftArachnaState>[1]);
    setPseudoliftState(state, dataState.pseudolift as Parameters<typeof setPseudoliftState>[1]);
    setNetTerminalGenState(state, dataState.netTerminalGen as Parameters<typeof setNetTerminalGenState>[1]);
    setMapEditorPatchState(state, dataState.mapEditorPatches as Parameters<typeof setMapEditorPatchState>[1]);
    setAlifeState(state, dataState.alife);
    const loadedRunEntry = currentFloorRunEntry(state);
    const floor = loadedFloorInstances.current?.baseFloor ?? loadedRunEntry.baseFloor ?? savedFloor;
    const generatedRunEntry = loadedFloorInstances.current ? null : loadedRunEntry;

    state.showMenu = false;
    state.showControls = false;
    cancelControlCapture();
    closeNetTerminalGen();
    closeMapEditor();
    pendingLoad = () => {
      resetNoiseRecords();
      resetGeneratedFloorPopulationState();
      clearRoomMemory();
      const gen: FloorGeneration = generatedRunEntry?.spec
        ? generateProceduralFloor(generatedRunEntry.spec)
        : generatedRunEntry?.designFloorId
          ? generateDesignFloor(generatedRunEntry.designFloorId)
          : generateFloor(floor);

      world = replaceWorldFromGeneration(null, gen);
      entities = gen.entities;
      nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
      materializeCurrentAlifeFloor(generatedRunEntry ? floorRunEntryRouteId(generatedRunEntry) : currentAlifeFloorKey(state));
      const spawn = safeSpawnNear(
        finiteNumber(dataPlayer.x, gen.spawnX),
        finiteNumber(dataPlayer.y, gen.spawnY),
        gen.spawnX,
        gen.spawnY,
      );

      player = {
        id: nextEntityId.v++,
        type: EntityType.PLAYER,
        x: spawn.x,
        y: spawn.y,
        angle: finiteNumber(dataPlayer.angle, 0),
        pitch: 0,
        alive: true,
        speed: 3.0,
        sprite: 0,
        needs: normalizedNeeds,
        hp: clampNumber(dataPlayer.hp, normalizedMaxHp, 1, normalizedMaxHp),
        maxHp: normalizedMaxHp,
        inventory: normalizedInventory,
        weapon: normalizedWeapon,
        tool: normalizedTool,
        money: clampInt(dataPlayer.money, 100, 0, MAX_SAVE_MONEY),
        rpg: normalizedRpg,
        statuses: normalizePlayerStatuses(dataPlayer.statuses),
        name: playerDisplayName(),
        faction: Faction.PLAYER,
        ...playerAlifeFields(dataPlayer as Partial<Entity>),
      };
      entities.push(player);
      applyContractFloorHooks(state, world, entities, nextEntityId, player);
      prevPlayerHp = player.hp ?? 100;

      initFactionRelations();
      initFactionControl(world);
      ensureProceduralSpriteSeeds(entities);

      state.time = Math.max(0, finiteNumber(dataState.time, 0));
      state.tick = clampInt(dataState.tick, 0, 0, 1_000_000_000);
      state.clock = normalizedClock;
      state.samosborCount = clampInt(dataState.samosborCount, 0, 0, 100_000);
      netReportedSamosborCount = state.samosborCount;
      netDeathReported = false;
      const savedSamosborActive = dataState.samosborActive === true;
      state.samosborTimer = clampNumber(dataState.samosborTimer, 120, 0, 24 * 60 * 60);
      state.quests = normalizedQuests.quests;
      state.nextQuestId = normalizedQuests.nextQuestId;
      state.currentFloor = floor;
      setFloorRunState(state, savedFloorRun, floor);
      setFloorInstanceState(state, loadedFloorInstances, floor);
      setLiftArachnaState(state, dataState.liftArachna as Parameters<typeof setLiftArachnaState>[1]);
      setPseudoliftState(state, dataState.pseudolift as Parameters<typeof setPseudoliftState>[1]);
      state.worldEvents = normalizeWorldEventState(dataState.worldEvents as Parameters<typeof normalizeWorldEventState>[0]);
      normalizeGameEconomy(state, dataState.economy);
      (state as GameState & { banking?: BankingState }).banking = normalizeBankingState(dataState.banking);
      normalizeGameStockMarket(state, dataState.stockMarket);
      setProductionState(state, dataState.production, floor);
      state.samosborActive = false;
      if (savedSamosborActive) {
        state.samosborTimer = Math.max(state.samosborTimer, 45);
        state.msgs.push(msg('Активный самосбор из сохранения сброшен: маршрут восстановлен, следующий цикл пересчитан.', state.time, '#fa4'));
      }
      state.uvBeamFx = 0;
      state.uvBeamLen = 0;
      floorTeleportCd = 0;
      state.gameOver = false;
      state.gameWon = false;
      state.deathTimer = 0;
      state.lastDamage = undefined;
      state.showMenu = false;
      state.showControls = false;
      cancelControlCapture();
      state.showContainerMenu = false;
      state.containerMenuTarget = -1;
      setVoidReturnPortalState(state, dataState.voidReturnPortal);
      setVoidEntryFromFloor(state, dataState.voidEntryFromFloor);
      replayMapEditorForCurrentFloor();
      if (Array.isArray(dataState.containers)) restoreValidContainers(world, state.currentFloor, dataState.containers);
      ensureRoomContainers(world, state.currentFloor);
      ensureProductionRooms(state, world);
      placeNetTerminalGenContentForCurrentFloor();
      ensureProceduralSpriteSeeds(entities);
      restoreVoidReturnPortalForCurrentWorld();

      state.msgs.push(msg('Игра загружена', state.time, '#4af'));

      // Update WebGL world data after load
      setGeneratedDynamicSky(gen);
      updateWorldData(world);
    };
    return true;
  } catch {
    state.msgs.push(msg('Ошибка загрузки!', state.time, '#f44'));
    return false;
  }
}

/* ── Urination faction penalty ─────────────────────────────────── */
let _urinePenaltyAccum = 0;
let _urinePenaltyStarted = false;
let _prevToolUse = false;
let _toolActionCd = 0;
let _cleanRelAccum = 0;

function applyUrinationPenalty(dt: number): void {
  const room = world.roomAt(player.x, player.y);
  if (room && room.type === RoomType.BATHROOM) return; // toilet — no penalty

  const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
  const zid = world.zoneMap[pci];
  const zone = world.zones[zid];
  if (!zone) return;
  const ownerFaction = zoneFactionToFaction(zone.faction);
  if (ownerFaction === null) return;

  // Immediate penalty when urination starts
  if (!_urinePenaltyStarted) {
    _urinePenaltyStarted = true;
    addFactionRel(ownerFaction, Faction.PLAYER, -1);
    addFactionRel(Faction.PLAYER, ownerFaction, -1);
    addKarma(player, -1);
    state.msgs.push(msg('Местные недовольны...', state.time, '#f84'));
  }

  // Ongoing penalty: -1 per game minute (= per real second)
  _urinePenaltyAccum += dt;
  if (_urinePenaltyAccum >= 1.0) {
    _urinePenaltyAccum -= 1.0;
    addFactionRel(ownerFaction, Faction.PLAYER, -1);
    addFactionRel(Faction.PLAYER, ownerFaction, -1);
  }
}

function setCellToFloor(x: number, y: number): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.FLOOR;
  if (!world.floorTex[ci]) {
    const room = world.roomAt(x + 0.5, y + 0.5);
    world.floorTex[ci] = room?.floorTex ?? Tex.F_CONCRETE;
  }
}

function cleanSurfaceArea(cx: number, cy: number, radiusCells: number): number {
  const minX = Math.floor(cx - radiusCells) - 1;
  const maxX = Math.floor(cx + radiusCells) + 1;
  const minY = Math.floor(cy - radiusCells) - 1;
  const maxY = Math.floor(cy + radiusCells) + 1;
  let removed = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const wx = world.wrap(x);
      const wy = world.wrap(y);
      const ci = world.idx(wx, wy);
      const cell = world.surfaceMap.get(ci);
      if (!cell) continue;

      for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
          const wxf = wx + (px + 0.5) / 16;
          const wyf = wy + (py + 0.5) / 16;
          if (world.dist(wxf, wyf, cx, cy) > radiusCells) continue;
          const ai = ((py * 16 + px) << 2) + 3;
          const a = cell[ai];
          if (a <= 0) continue;
          const dec = Math.max(24, Math.floor(a * 0.45));
          const na = Math.max(0, a - dec);
          removed += a - na;
          cell[ai] = na;
        }
      }
    }
  }

  if (removed > 0) world.surfaceVersion++;
  return removed;
}

function updateEquippedTool(dt: number): void {
  if (!player.alive) {
    _prevToolUse = input.use;
    return;
  }
  if (_toolActionCd > 0) _toolActionCd = Math.max(0, _toolActionCd - dt);
  const toolId = player.tool ?? '';
  const useEdge = input.use && !_prevToolUse;
  _prevToolUse = input.use;
  if (!toolId) return;

  const hasTool = (player.inventory ?? []).some(s => s.defId === toolId);
  if (!hasTool) { player.tool = ''; return; }

  // Flashlight is passive while equipped.
  if (toolId === 'flashlight') {
    consumeToolDurability(player, dt, state.msgs, state.time, state);
    return;
  }

  if (toolId === UV_SPOTLIGHT_ID) {
    if (!input.use || _toolActionCd > 0) return;
    const result = useUvSpotlight(world, entities, player, state);
    if (result) {
      state.uvBeamFx = 0.24;
      state.uvBeamLen = result.beamLen;
      playSoundAt(playEnergyImpact, player.x, player.y);
      _toolActionCd = 0.28;
    } else {
      _toolActionCd = 0.35;
    }
    return;
  }

  const lookRange = 1.4;
  const tx = player.x + Math.cos(player.angle) * lookRange;
  const ty = player.y + Math.sin(player.angle) * lookRange;
  const cx = Math.floor(tx);
  const cy = Math.floor(ty);
  const ci = world.idx(cx, cy);

  if ((toolId === 'cleaning_kit' || toolId === 'vacuum') && useEdge && _toolActionCd <= 0) {
    if (tryCoverSeroburmalineSource(world, player, state, tx, ty, toolId)) {
      updateWorldData(world);
      _toolActionCd = 0.2;
      return;
    }
  }

  if (toolId === 'jackhammer') {
    if (!input.use || _toolActionCd > 0) return;
    if (world.hermoWall[ci] || world.aptMask[ci]) {
      state.msgs.push(msg('Гермостена неразрушима', state.time, '#f44'));
      _toolActionCd = 0.2;
      return;
    }
    if (world.cells[ci] !== Cell.WALL) {
      state.msgs.push(msg('Отбойнику нужна стена перед вами', state.time, '#f84'));
      _toolActionCd = 0.25;
      return;
    }
    setCellToFloor(cx, cy);
    consumeToolDurability(player, 1, state.msgs, state.time, state);
    state.msgs.push(msg('Стена разрушена', state.time, '#fc4'));
    playBreak();
    notifyLiftArachnaNoise(world, player, state, 'jackhammer');
    _toolActionCd = 0.2;
    return;
  }

  if (toolId === 'door_kit') {
    if (!useEdge) return;
    if (world.aptMask[ci]) {
      state.msgs.push(msg('В защищенных укрытиях строительство запрещено', state.time, '#f44'));
      return;
    }
    if (world.cells[ci] !== Cell.FLOOR) {
      state.msgs.push(msg('Дверь ставится на проход (пол)', state.time, '#f84'));
      return;
    }
    const l = world.cells[world.idx(cx - 1, cy)];
    const r = world.cells[world.idx(cx + 1, cy)];
    const u = world.cells[world.idx(cx, cy - 1)];
    const d = world.cells[world.idx(cx, cy + 1)];
    const horizontal = (l === Cell.WALL && r === Cell.WALL && u !== Cell.WALL && d !== Cell.WALL);
    const vertical = (u === Cell.WALL && d === Cell.WALL && l !== Cell.WALL && r !== Cell.WALL);
    if (!horizontal && !vertical) {
      state.msgs.push(msg('Нужен проход между двумя стенами', state.time, '#f84'));
      return;
    }
    const roomA = world.roomMap[world.idx(cx - 1, cy)] >= 0 ? world.roomMap[world.idx(cx - 1, cy)] : world.roomMap[world.idx(cx, cy - 1)];
    const roomB = world.roomMap[world.idx(cx + 1, cy)] >= 0 ? world.roomMap[world.idx(cx + 1, cy)] : world.roomMap[world.idx(cx, cy + 1)];
    world.cells[ci] = Cell.DOOR;
    world.doors.set(ci, { idx: ci, state: DoorState.CLOSED, roomA, roomB, keyId: '', timer: 0 });
    updateWorldData(world);
    consumeToolDurability(player, 1, state.msgs, state.time, state);
    state.msgs.push(msg('Дверь установлена', state.time, '#6cf'));
    playDoor();
    return;
  }

  if (toolId === 'block_kit') {
    if (!useEdge) return;
    const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
    if (ci === pci) {
      state.msgs.push(msg('Нельзя замуровать себя', state.time, '#f84'));
      return;
    }
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) {
      state.msgs.push(msg('Блок ставится на пол/дверь', state.time, '#f84'));
      return;
    }
    if (world.aptMask[ci] || world.hermoWall[ci]) {
      state.msgs.push(msg('В защищенных укрытиях строительство запрещено', state.time, '#f44'));
      return;
    }
    if (world.cells[ci] === Cell.DOOR) world.doors.delete(ci);
    world.cells[ci] = Cell.WALL;
    const room = world.roomAt(player.x, player.y);
    world.wallTex[ci] = room?.wallTex ?? Tex.CONCRETE;
    world.markWallTexDirty();
    updateWorldData(world);
    consumeToolDurability(player, 1, state.msgs, state.time, state);
    state.msgs.push(msg('Блок стены установлен', state.time, '#6cf'));
    return;
  }

  if (toolId === 'cleaning_kit') {
    if (!input.use || _toolActionCd > 0) return;
    const cleaned = cleanSurfaceArea(tx, ty, 1.0);
    const cleanedHazards = cleanCellHazardsNear(world, tx, ty, 1.15, state, player, 'solvent');
    consumeToolDurability(player, 1, state.msgs, state.time, state);
    if (cleaned > 0 || cleanedHazards > 0) {
      notifyCleanupToolUse(player, world, state, tx, ty, cleaned, cleanedHazards);
      _cleanRelAccum += 1;
      if (_cleanRelAccum >= 5) {
        _cleanRelAccum = 0;
        const z = world.zones[world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))]];
        const owner = z ? zoneFactionToFaction(z.faction) : null;
        if (owner !== null) {
          addFactionRelMutual(Faction.PLAYER, owner, 1);
          state.msgs.push(msg('Местные ценят вашу уборку (+отношения)', state.time, '#8f8'));
        }
      }
    }
    _toolActionCd = 0.08;
  }

  if (toolId === 'vacuum') {
    if (!input.use || _toolActionCd > 0) return;
    const fi = world.idx(cx, cy);
    if (world.fog[fi] > 0) {
      world.fog[fi] = 0;
      world.markFogDirty();
      consumeToolDurability(player, 1, state.msgs, state.time, state);
      state.msgs.push(msg('Туман всосан пылесосом', state.time, '#c8f'));
    } else {
      state.msgs.push(msg('Тут нет тумана', state.time, '#888'));
    }
    _toolActionCd = 0.15;
  }
}

/* ── Menu input handling (runs regardless of pause state) ─────── */
let prevEsc = false, prevInvMenu = false, prevQuestMenu = false;
let prevMenuUp = false, prevMenuDn = false, prevMenuLeft = false, prevMenuRight = false;
let prevMenuInteract = false, prevDrop = false;
let prevFactionMenu = false;
let prevLogMenu = false;
let prevControlsMenu = false;
let prevControlReset = false;
type MenuRepeatKey = 'up' | 'down' | 'left' | 'right';
const MENU_REPEAT_DELAY = 0.30;
const MENU_REPEAT_INTERVAL = 0.085;
const menuRepeatNext: Record<MenuRepeatKey, number> = { up: 0, down: 0, left: 0, right: 0 };

function resetMenuRepeats(): void {
  menuRepeatNext.up = 0;
  menuRepeatNext.down = 0;
  menuRepeatNext.left = 0;
  menuRepeatNext.right = 0;
}

function menuRepeatStep(key: MenuRepeatKey, held: boolean, edge: boolean): boolean {
  if (!held) {
    menuRepeatNext[key] = 0;
    return false;
  }
  if (edge) {
    menuRepeatNext[key] = uiTime + MENU_REPEAT_DELAY;
    return true;
  }
  if (menuRepeatNext[key] === 0) {
    menuRepeatNext[key] = uiTime + MENU_REPEAT_DELAY;
    return false;
  }
  if (uiTime >= menuRepeatNext[key]) {
    menuRepeatNext[key] = uiTime + MENU_REPEAT_INTERVAL;
    return true;
  }
  return false;
}

function tryLockLandscape(): void {
  const orientation = screen.orientation as (ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> }) | undefined;
  if (!orientation?.lock) return;
  void orientation.lock('landscape').catch(() => {});
}

function requestPointerLockIfDesktop(): void {
  if (mobileControls?.isEnabled()) return;
  try {
    const result = canvas.requestPointerLock();
    if (result instanceof Promise) void result.catch(() => {});
  } catch {
    // Some embedded browsers reject pointer lock; desktop mouse still works without crashing.
  }
}

function mobileGestureUnlock(): void {
  if (!mobileControls?.isEnabled()) return;
  tryLockLandscape();
  if (started) startAmbientDrone();
}

function syncPauseState(): void {
  if (typeof state === 'undefined') return;
  state.paused = state.showMenu || state.showInventory || state.showNpcMenu || state.showContainerMenu ||
    state.showQuests || state.showDebug || state.showFactions || state.showLog || state.showControls ||
    isNetSphereOpen() || isNetTerminalGenOpen() || isInteractableOverlayOpen() || isEmergencyPanelMenuOpen() || isMapEditorOpen();
}

function isMobileMenuOpen(): boolean {
  if (typeof state === 'undefined') return false;
  return state.showMenu || state.showInventory || state.showNpcMenu || state.showContainerMenu ||
    state.showQuests || state.showDebug || state.showFactions || state.showLog || state.showControls ||
    state.mapMode === 2 || isNetSphereOpen() || isNetTerminalGenOpen() || isInteractableOverlayOpen() || isEmergencyPanelMenuOpen() || isMapEditorOpen();
}

function closeMobilePanels(includeMap = true): void {
  if (typeof state === 'undefined') return;
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeContainerMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showLog = false;
  state.showControls = false;
  cancelControlCapture();
  if (includeMap) state.mapMode = 0;
  closeNetSphere();
  closeNetTerminalGen();
  closeInteractableOverlay();
  closeEmergencyPanelMenu();
  closeMapEditor();
  syncPauseState();
  updateMobileContext();
}

function closeActiveMobileMenu(): void {
  closeMobilePanels(true);
}

function openMobileMenu(menu: MobileMenuId): void {
  if (!started || typeof state === 'undefined' || state.gameOver) return;
  if (menu !== 'map') closeMobilePanels(true);
  switch (menu) {
    case 'inventory':
      state.showInventory = true;
      state.invSel = 0;
      break;
    case 'map':
      closeMobilePanels(false);
      state.mapMode = (state.mapMode + 1) % 3;
      break;
    case 'quests':
      state.showQuests = true;
      break;
    case 'log':
      state.showLog = true;
      state.logScroll = 0;
      break;
    case 'factions':
      state.showFactions = true;
      state.factionRankScroll = 0;
      break;
    case 'net':
      openNetSphere();
      break;
    case 'menu':
      state.showMenu = true;
      state.menuSel = 0;
      break;
    case 'debug':
      state.showDebug = true;
      state.debugSel = 0;
      resetDebugInfoPage();
      break;
  }
  syncPauseState();
  updateMobileContext();
}

function confirmActiveMobileSelection(): void {
  if (!started || typeof state === 'undefined' || state.gameOver || isNetSphereOpen() || isNetTerminalGenOpen() || isInteractableOverlayOpen() || isMapEditorOpen()) return;
  if (state.showMenu) {
    runGameMenuSelection(state.menuSel);
  } else if (state.showInventory) {
    useInventorySelection();
  } else if (state.showContainerMenu) {
    const container = world.containerById.get(state.containerMenuTarget);
    if (container) activateContainerSelection(container);
    else closeContainerMenu();
  } else if (state.showNpcMenu) {
    const npc = entities.find(e => e.id === state.npcMenuTarget);
    if (state.npcMenuTab === 'main') {
      activateNpcMainSelection(npc);
    } else if (state.npcMenuTab === 'talk' || state.npcMenuTab === 'quest') {
      state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'trade' && npc) {
      activateTradeSelection(npc);
    }
  } else if (state.showDebug) {
    const action = execDebugCommand(state.debugSel, world, player, entities, state, nextEntityId);
    if (action) handleDebugCommandAction(action);
  }
  syncPauseState();
  updateMobileContext();
}

function canInteractAhead(): boolean {
  if (!started || typeof state === 'undefined' || typeof world === 'undefined' || typeof player === 'undefined') return false;
  if (state.gameOver || state.sleeping || isMobileMenuOpen()) return false;
  const lookX = player.x + Math.cos(player.angle) * 1.5;
  const lookY = player.y + Math.sin(player.angle) * 1.5;
  return findInteractionTarget({
    world,
    state,
    player,
    entities,
    nextEntityId,
    lookX,
    lookY,
  }) !== null;
}

function updateMobileContext(): void {
  const mobileEnabled = mobileControls?.isEnabled() === true;
  mobileControls?.updateContext({
    started,
    menuOpen: isMobileMenuOpen(),
    canInteract: mobileEnabled ? canInteractAhead() : false,
    gameOver: typeof state !== 'undefined' && state.gameOver,
  });
}

function runGameMenuSelection(sel: number): void {
  switch (sel) {
    case 0:
      state.showMenu = false;
      break;
    case 1:
      state.showMenu = false;
      pendingLoad = () => { initGame(); };
      break;
    case 2:
      saveGame();
      state.showMenu = false;
      break;
    case 3:
      loadGame();
      break;
  }
  syncPauseState();
}

function useInventorySelection(): void {
  const zoneId = world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
  useItem(player, state.invSel, state.msgs, state.time, state, zoneId, world);
}

function dropInventorySelection(): void {
  dropItem(player, state.invSel, entities, state.msgs, state.time, nextEntityId, state, world);
}

function spendMobileAttr(attr: 'str' | 'agi' | 'int'): void {
  if (!player.rpg || player.rpg.attrPoints <= 0) return;
  if (!spendAttrPoint(player, attr)) return;
  if (attr === 'str') state.msgs.push(msg(`Сила +1 (${player.rpg.str})`, state.time, '#f84'));
  else if (attr === 'agi') state.msgs.push(msg(`Ловкость +1 (${player.rpg.agi})`, state.time, '#4af'));
  else state.msgs.push(msg(`Интеллект +1 (${player.rpg.int})`, state.time, '#a4f'));
}

function activateContainerSelection(container: WorldContainer): void {
  const GRID = 5;
  const idx = state.containerCursorY * GRID + state.containerCursorX;
    const access = containerAccessInfo(container, player, state);
  if (state.containerSide === 'container') {
    const slot = container.inventory[idx];
    const itemName = slot ? ITEMS[slot.defId]?.name ?? slot.defId : '';
    if (!access.canTake) {
      state.msgs.push(msg(access.label === 'ЗАПЕРТО' ? 'Заперто.' : 'Нет доступа.', state.time, '#f84'));
    } else if (slot && takeFromContainer(container, player, idx, 1, { state, world, entities })) {
      state.msgs.push(msg(`${access.theft ? 'Украдено' : 'Взято'}: ${itemName}`, state.time, access.theft ? '#f84' : '#8f8'));
    } else {
      state.msgs.push(msg(slot ? 'Нет места.' : 'Пустой слот.', state.time, '#888'));
    }
  } else {
    const slot = player.inventory?.[idx];
    if (!access.canPut) {
      state.msgs.push(msg('Нет доступа.', state.time, '#f84'));
    } else if (slot && putIntoContainer(container, player, idx, 1, { state, world, entities })) {
      state.msgs.push(msg(`Положено: ${ITEMS[slot.defId]?.name ?? slot.defId}`, state.time, '#8cf'));
    } else {
      state.msgs.push(msg(slot ? 'Контейнер полон.' : 'Пустой слот.', state.time, '#888'));
    }
  }
}

function activateNpcMainSelection(npc: Entity | undefined): void {
  switch (state.npcMenuSel) {
    case 0:
      state.npcMenuTab = 'talk';
      state.npcTalkText = npc ? generateTalkText(npc, { world, state, player, time: state.time }) : '...';
      break;
    case 1:
      if (npc) {
        checkTalkQuest(npc, player, entities, state, state.msgs);
        offerQuest(npc, player, world, entities, state, state.msgs, nextEntityId);
        const active = state.quests.filter(q => !q.done);
        const npcQIdx = active.findIndex(q => q.giverId === npc.id);
        if (npcQIdx >= 0) {
          state.npcMenuTab = 'quest';
          state.questPage = npcQIdx;
        }
      }
      break;
    case 2:
      state.npcMenuTab = 'trade';
      state.tradeCursorX = 0;
      state.tradeCursorY = 0;
      state.tradeSide = 'npc';
      if (npc) primeTradePriceCache(state, [npc.inventory, player.inventory]);
      break;
  }
}

function currentPlayerZoneId(): number {
  return world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
}

function reportTradeResult(npc: Entity, result: TradeResult): void {
  if (result.ok) {
    primeTradePriceCache(state, [npc.inventory, player.inventory]);
    if (result.code === 'bought' && result.defId && result.price !== undefined) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Куплено: ${def?.name ?? result.defId} (−${result.price}₽)`, state.time, '#4f4'));
    } else if (result.code === 'sold' && result.defId && result.price !== undefined) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Продано: ${def?.name ?? result.defId} (+${result.price}₽)`, state.time, '#4f4'));
    }
    return;
  }

  if (result.code === 'player_no_money') state.msgs.push(msg('Не хватает денег', state.time, '#f84'));
  else if (result.code === 'player_no_space') state.msgs.push(msg('Нет места в инвентаре', state.time, '#f84'));
  else if (result.code === 'npc_no_money') state.msgs.push(msg('У торговца нет денег', state.time, '#f84'));
  else if (result.code === 'npc_no_space') state.msgs.push(msg('У торговца нет места', state.time, '#f84'));
}

function activateTradeSelection(npc: Entity): void {
  const GRID = 5;
  const idx = state.tradeCursorY * GRID + state.tradeCursorX;
  const zoneId = currentPlayerZoneId();
  const result = state.tradeSide === 'npc'
    ? buyFromNpc(state, player, npc, idx, { zoneId })
    : sellToNpc(state, player, npc, idx, {
      zoneId,
      beforeSell: ({ slotIndex }) => tryHandleMaronaryShavingHandoff(player, npc, slotIndex, state),
      afterSell: ({ defId, price }) => {
        if (isShelterTallyItem(defId) && (npc.faction === Faction.CULTIST || npc.faction === Faction.LIQUIDATOR)) {
          publishShelterTallyEvent(
            state,
            player,
            defId,
            npc.faction === Faction.CULTIST ? 'sell_cult' : 'sell_liquidator',
            { targetId: npc.id, targetName: npc.name, targetFaction: npc.faction, itemValue: price },
          );
        }
      },
    });
  reportTradeResult(npc, result);
}

function menuScale(): { sx: number; sy: number } {
  const sx = hudCanvas.width / SCR_W;
  const sy = hudCanvas.height / SCR_H;
  const s = Math.max(0.8, Math.min(2, Math.min(sx, sy)));
  return { sx: s, sy: s };
}

function controlsVisibleRows(): number {
  const { sy } = menuScale();
  return Math.max(4, Math.floor((hudCanvas.height - 58 * sy) / Math.max(1, 12 * sy)));
}

function keepControlSelectionVisible(): void {
  const maxSel = Math.max(0, CONTROL_ACTIONS.length - 1);
  state.controlSel = Math.max(0, Math.min(maxSel, state.controlSel));
  const visible = controlsVisibleRows();
  const maxScroll = Math.max(0, CONTROL_ACTIONS.length - visible);
  if (state.controlSel < state.controlScroll) state.controlScroll = state.controlSel;
  if (state.controlSel >= state.controlScroll + visible) state.controlScroll = state.controlSel - visible + 1;
  state.controlScroll = Math.max(0, Math.min(maxScroll, state.controlScroll));
}

function openControlsMenu(): void {
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeContainerMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showLog = false;
  state.mapMode = 0;
  state.showControls = true;
  cancelControlCapture();
  keepControlSelectionVisible();
  syncPauseState();
}

function closeControlsMenu(): void {
  state.showControls = false;
  cancelControlCapture();
  syncPauseState();
}

function pointInRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

function handleMobileHudTap(x: number, y: number): void {
  if (typeof state === 'undefined' || typeof player === 'undefined') return;
  const w = hudCanvas.width;
  const h = hudCanvas.height;
  const baseSx = w / SCR_W;
  const baseSy = h / SCR_H;
  const { sx, sy } = menuScale();

  if (state.mapMode === 2 && !state.showInventory && !state.showQuests && !state.showLog && !state.showFactions && !state.showMenu && !state.showControls && !state.showNpcMenu && !state.showContainerMenu) {
    state.mapMode = 0;
    return;
  }

  if (state.showControls) {
    const { sy } = menuScale();
    const top = 34 * sy;
    const rowH = 12 * sy;
    const visible = controlsVisibleRows();
    const relRow = Math.floor((y - top) / rowH);
    if (y > h - 22 * sy) {
      closeControlsMenu();
      return;
    }
    if (relRow >= 0 && relRow < visible) {
      const idx = state.controlScroll + relRow;
      if (idx >= 0 && idx < CONTROL_ACTIONS.length) {
        state.controlSel = idx;
        keepControlSelectionVisible();
      }
    }
  } else if (state.showMenu) {
    for (let i = 0; i < 4; i++) {
      const yy = h / 2 - 20 * sy + i * 20 * sy;
      if (pointInRect(x, y, w / 2 - 90 * sx, yy - 6 * sy, 180 * sx, 16 * sy)) {
        state.menuSel = i;
        runGameMenuSelection(i);
        return;
      }
    }
  } else if (state.showInventory) {
    const GRID = 5;
    const cellSz = 22 * baseSx;
    const gridX = 8 * baseSx;
    const gridY = 18 * baseSy;
    const gridW = GRID * cellSz;
    if (pointInRect(x, y, w - 88 * baseSx, 0, 88 * baseSx, 18 * baseSy)) {
      state.showInventory = false;
      syncPauseState();
      return;
    }
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const cx = gridX + col * cellSz;
        const cy = gridY + row * cellSz;
        if (pointInRect(x, y, cx, cy, cellSz, cellSz)) {
          state.invSel = row * GRID + col;
          return;
        }
      }
    }
    const descY = gridY + gridW + 4 * baseSy;
    const descX = gridX + gridW / 2;
    if (pointInRect(x, y, descX - 70 * baseSx, descY + 26 * baseSy, 140 * baseSx, 12 * baseSy)) {
      useInventorySelection();
      return;
    }
    if (pointInRect(x, y, descX - 70 * baseSx, descY + 38 * baseSy, 140 * baseSx, 12 * baseSy)) {
      dropInventorySelection();
      return;
    }
    const stX = gridX + gridW + 16 * baseSx;
    if (player.rpg && player.rpg.attrPoints > 0 && pointInRect(x, y, stX, gridY - 4 * baseSy, w - stX - 8 * baseSx, 18 * baseSy)) {
      const rel = (x - stX) / Math.max(1, w - stX - 8 * baseSx);
      spendMobileAttr(rel < 0.34 ? 'str' : rel < 0.67 ? 'agi' : 'int');
      return;
    }
  } else if (state.showQuests) {
    const pw = Math.min(400 * sx, w - 24 * sx);
    const ph = Math.min(280 * sy, h - 24 * sy);
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;
    const total = state.quests.length;
    if (pointInRect(x, y, px, py + ph - 22 * sy, pw, 22 * sy)) {
      state.showQuests = false;
      syncPauseState();
      return;
    }
    if (total > 1) {
      state.questPage = x < w / 2
        ? Math.max(0, state.questPage - 1)
        : Math.min(total - 1, state.questPage + 1);
    }
  } else if (state.showLog) {
    if (y > h - 24 * sy || y < 28 * sy) {
      state.showLog = false;
      syncPauseState();
      return;
    }
    const maxScroll = Math.max(0, state.msgLog.length * 3);
    state.logScroll = y < h / 2
      ? Math.min(maxScroll, state.logScroll + 3)
      : Math.max(0, state.logScroll - 3);
  } else if (state.showFactions) {
    state.showFactions = false;
    syncPauseState();
  } else if (state.showContainerMenu) {
    const container = world.containerById.get(state.containerMenuTarget);
    if (!container) {
      closeContainerMenu();
      return;
    }
    const GRID = 5;
    const cellSz = 22 * sx;
    const gap = 24 * sx;
    const gridTotal = GRID * cellSz;
    const totalW = gridTotal * 2 + gap;
    const startX = (w - totalW) / 2;
    const startY = 30 * sy;
    const containerX = startX + gridTotal + gap;
    for (const side of ['player', 'container'] as const) {
      const gx = side === 'player' ? startX : containerX;
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          if (pointInRect(x, y, gx + col * cellSz, startY + row * cellSz, cellSz, cellSz)) {
            state.containerSide = side;
            state.containerCursorX = col;
            state.containerCursorY = row;
            activateContainerSelection(container);
            return;
          }
        }
      }
    }
    if (y > h - 30 * sy) {
      closeContainerMenu();
      syncPauseState();
    }
  } else if (state.showNpcMenu) {
    const npc = entities.find(e => e.id === state.npcMenuTarget);
    if (!npc) return;
    if (state.npcMenuTab === 'main') {
      const pw = Math.min(440 * sx, w - 24 * sx);
      const ph = Math.min(320 * sy, h - 24 * sy);
      const px = (w - pw) / 2;
      const py = (h - ph) / 2;
      for (let i = 0; i < 3; i++) {
        const yy = py + 40 * sy + i * 16 * sy;
        if (pointInRect(x, y, px + 8 * sx, yy - 5 * sy, 160 * sx, 14 * sy)) {
          state.npcMenuSel = i;
          activateNpcMainSelection(npc);
          return;
        }
      }
      if (pointInRect(x, y, px, py + ph - 22 * sy, pw, 22 * sy)) {
        state.showNpcMenu = false;
        syncPauseState();
      }
    } else if (state.npcMenuTab === 'trade') {
      const GRID = 5;
      const cellSz = 22 * sx;
      const gap = 24 * sx;
      const gridTotal = GRID * cellSz;
      const totalW = gridTotal * 2 + gap;
      const startX = (w - totalW) / 2;
      const startY = 28 * sy;
      const npcX = startX + gridTotal + gap;
      for (const side of ['player', 'npc'] as const) {
        const gx = side === 'player' ? startX : npcX;
        for (let row = 0; row < GRID; row++) {
          for (let col = 0; col < GRID; col++) {
            if (pointInRect(x, y, gx + col * cellSz, startY + row * cellSz, cellSz, cellSz)) {
              state.tradeSide = side;
              state.tradeCursorX = col;
              state.tradeCursorY = row;
              activateTradeSelection(npc);
              return;
            }
          }
        }
      }
      if (y > h - 32 * sy) state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'quest') {
      const total = state.quests.filter(q => !q.done).length;
      if (y > h - 40 * sy) {
        state.npcMenuTab = 'main';
      } else if (total > 1) {
        state.questPage = x < w / 2
          ? Math.max(0, state.questPage - 1)
          : Math.min(total - 1, state.questPage + 1);
      }
    } else {
      state.npcMenuTab = 'main';
    }
  }
}

function handleHudPointerUp(e: PointerEvent): void {
  if (!mobileControls?.isEnabled()) return;
  e.preventDefault();
  e.stopPropagation();
  mobileGestureUnlock();
  if (!started) {
    startGameFromTitle();
    return;
  }
  if (pendingLoad) return;
  const rect = hudCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (hudCanvas.width / Math.max(1, rect.width));
  const y = (e.clientY - rect.top) * (hudCanvas.height / Math.max(1, rect.height));
  handleMobileHudTap(x, y);
}

hudCanvas.addEventListener('pointerup', handleHudPointerUp);

function handleMenuInput(): void {
  // ── On death: lock out all menus / inventory / interactions ──
  // Only the restart prompt (checkRestart) responds to input.
  if (state.gameOver) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    state.showFactions = false;
    state.showLog = false;
    state.showControls = false;
    cancelControlCapture();
    closeNetSphere();
    closeNetTerminalGen();
    closeInteractableOverlay();
    closeEmergencyPanelMenu();
    closeMapEditor();
    resetMenuRepeats();
    // Keep edge-detection prev states in sync so first frame after
    // respawn doesn't fire a stale edge.
    prevEsc = input.escape;
    prevMenuUp = input.invUp;
    prevMenuDn = input.invDn;
    prevMenuLeft = input.invLeft;
    prevMenuRight = input.invRight;
    prevMenuInteract = input.interact;
    prevDrop = input.drop;
    prevInvMenu = input.inv;
    prevQuestMenu = input.questLog;
    prevFactionMenu = input.factionMenu;
    prevLogMenu = input.logMenu;
    prevControlsMenu = input.controls;
    prevControlReset = input.controlReset;
    return;
  }

  if (isMapEditorOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    state.showFactions = false;
    state.showLog = false;
    state.showDebug = false;
    state.showControls = false;
    cancelControlCapture();
    closeNetSphere();
    state.paused = true;

    const escEdge = input.escape && !prevEsc;
    const upEdge = input.invUp && !prevMenuUp;
    const dnEdge = input.invDn && !prevMenuDn;
    const leftEdge = input.invLeft && !prevMenuLeft;
    const rightEdge = (input.invRight && !prevMenuRight) || (input.drop && !prevDrop);
    const interactEdge = input.interact && !prevMenuInteract;
    const mapEdge = input.map && !prevMap;
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge);

    const closeEditor = () => {
      closeMapEditor();
      closeNetTerminalGen();
      syncPauseState();
    };

    if (escEdge) {
      const action = backMapEditorMode();
      if (action === 'close') closeEditor();
    } else {
      if (upNav) moveMapEditorMode(world, 0, -1);
      if (dnNav) moveMapEditorMode(world, 0, 1);
      if (leftNav) moveMapEditorMode(world, -1, 0);
      if (rightNav) moveMapEditorMode(world, 1, 0);
      if (mapEdge) adjustMapEditorZoom(1);
      if (interactEdge) {
        const action = activateMapEditorMode();
        if (action === 'apply') {
          const result = applyCurrentMapEditorBrush(world, entities, player, state, nextEntityId);
          if (result.ok) updateWorldData(world);
        } else if (action === 'close') {
          input.interact = false;
          closeEditor();
        }
      }
    }

    prevEsc = input.escape;
    prevMenuUp = input.invUp;
    prevMenuDn = input.invDn;
    prevMenuLeft = input.invLeft;
    prevMenuRight = input.invRight;
    prevMenuInteract = input.interact;
    prevDrop = input.drop;
    prevInvMenu = input.inv;
    prevQuestMenu = input.questLog;
    prevDebug = input.debugScreen;
    prevFactionMenu = input.factionMenu;
    prevLogMenu = input.logMenu;
    prevControlsMenu = input.controls;
    prevControlReset = input.controlReset;
    prevMap = input.map;
    return;
  }

  if (isInteractableOverlayOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    state.showFactions = false;
    state.showLog = false;
    state.showDebug = false;
    state.showControls = false;
    cancelControlCapture();
    closeNetSphere();
    state.paused = true;

    const escEdge = input.escape && !prevEsc;
    const upEdge = input.invUp && !prevMenuUp;
    const dnEdge = input.invDn && !prevMenuDn;
    const leftEdge = input.invLeft && !prevMenuLeft;
    const rightEdge = (input.invRight && !prevMenuRight) || (input.drop && !prevDrop);
    const interactEdge = input.interact && !prevMenuInteract;
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge);
    const result = handleInteractableOverlayInput({
      escEdge,
      interactEdge,
      upNav,
      dnNav,
      leftNav,
      rightNav,
    }, { world, state, player });
    if (result.worldChanged) updateWorldData(world);
    if (interactEdge) input.interact = false;
    if (!isInteractableOverlayOpen()) syncPauseState();

    prevEsc = input.escape;
    prevMenuUp = input.invUp;
    prevMenuDn = input.invDn;
    prevMenuLeft = input.invLeft;
    prevMenuRight = input.invRight;
    prevMenuInteract = input.interact;
    prevDrop = input.drop;
    prevInvMenu = input.inv;
    prevQuestMenu = input.questLog;
    prevDebug = input.debugScreen;
    prevFactionMenu = input.factionMenu;
    prevLogMenu = input.logMenu;
    prevControlsMenu = input.controls;
    prevControlReset = input.controlReset;
    prevMap = input.map;
    return;
  }

  if (isEmergencyPanelMenuOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    state.showFactions = false;
    state.showLog = false;
    state.showDebug = false;
    state.showControls = false;
    cancelControlCapture();
    closeNetSphere();
    state.paused = true;

    const escEdge = input.escape && !prevEsc;
    const upEdge = input.invUp && !prevMenuUp;
    const dnEdge = input.invDn && !prevMenuDn;
    const interactEdge = input.interact && !prevMenuInteract;
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    const result = handleEmergencyPanelMenuInput({
      up: upNav,
      down: dnNav,
      confirm: interactEdge,
      close: escEdge,
    }, world, player, entities, state, nextEntityId);
    if (result.worldChanged) updateWorldData(world);
    if (interactEdge) input.interact = false;
    if (!isEmergencyPanelMenuOpen()) syncPauseState();

    prevEsc = input.escape;
    prevMenuUp = input.invUp;
    prevMenuDn = input.invDn;
    prevMenuLeft = input.invLeft;
    prevMenuRight = input.invRight;
    prevMenuInteract = input.interact;
    prevDrop = input.drop;
    prevInvMenu = input.inv;
    prevQuestMenu = input.questLog;
    prevDebug = input.debugScreen;
    prevFactionMenu = input.factionMenu;
    prevLogMenu = input.logMenu;
    prevControlsMenu = input.controls;
    prevControlReset = input.controlReset;
    prevMap = input.map;
    return;
  }

  if (isNetSphereOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    state.showFactions = false;
    state.showLog = false;
    state.showDebug = false;
    state.showControls = false;
    cancelControlCapture();
    state.paused = true;
    resetMenuRepeats();
    prevEsc = input.escape;
    prevMenuUp = input.invUp;
    prevMenuDn = input.invDn;
    prevMenuLeft = input.invLeft;
    prevMenuRight = input.invRight;
    prevMenuInteract = input.interact;
    prevDrop = input.drop;
    prevInvMenu = input.inv;
    prevQuestMenu = input.questLog;
    prevDebug = input.debugScreen;
    prevFactionMenu = input.factionMenu;
    prevLogMenu = input.logMenu;
    prevControlsMenu = input.controls;
    prevControlReset = input.controlReset;
    return;
  }

  const escEdge = input.escape && !prevEsc;
  const upEdge = input.invUp && !prevMenuUp;
  const dnEdge = input.invDn && !prevMenuDn;
  const leftEdge = input.invLeft && !prevMenuLeft;
  const rightEdge = input.invRight && !prevMenuRight;
  const interactEdge = input.interact && !prevMenuInteract;
  const dropEdge = input.drop && !prevDrop;
  const invEdge = input.inv && !prevInvMenu;
  const questEdge = input.questLog && !prevQuestMenu;
  const factionEdge = input.factionMenu && !prevFactionMenu;
  const logEdge = input.logMenu && !prevLogMenu;
  const controlsEdge = input.controls && !prevControlsMenu;
  const controlResetEdge = input.controlReset && !prevControlReset;
  const anyRepeatMenuOpen = state.showMenu || state.showInventory || state.showQuests ||
    state.showContainerMenu || state.showNpcMenu || state.showDebug || state.showFactions || state.showLog || state.showControls;
  if (!anyRepeatMenuOpen) resetMenuRepeats();

  if (controlsEdge) {
    if (state.showControls) closeControlsMenu();
    else openControlsMenu();
  }

  // ── Hotkey / rebind screen ───────────────────────────────
  if (state.showControls) {
    if (!getControlCaptureAction()) {
      const upNav = menuRepeatStep('up', input.invUp, upEdge);
      const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
      if (upNav) state.controlSel = Math.max(0, state.controlSel - 1);
      if (dnNav) state.controlSel = Math.min(CONTROL_ACTIONS.length - 1, state.controlSel + 1);
      keepControlSelectionVisible();
      if (interactEdge) {
        const action = CONTROL_ACTIONS[state.controlSel];
        if (action) beginControlCapture(action.id);
      }
      if (controlResetEdge) {
        const action = CONTROL_ACTIONS[state.controlSel];
        if (action) {
          resetControlBinding(action.id);
          state.msgs.push(msg(`Клавиши сброшены: ${action.label}`, state.time, '#8cf'));
        }
      }
    }
    if (escEdge) closeControlsMenu();

    prevEsc = input.escape;
    prevMenuUp = input.invUp;
    prevMenuDn = input.invDn;
    prevMenuLeft = input.invLeft;
    prevMenuRight = input.invRight;
    prevMenuInteract = input.interact;
    prevDrop = input.drop;
    prevInvMenu = input.inv;
    prevQuestMenu = input.questLog;
    prevDebug = input.debugScreen;
    prevFactionMenu = input.factionMenu;
    prevLogMenu = input.logMenu;
    prevControlsMenu = input.controls;
    prevControlReset = input.controlReset;
    syncPauseState();
    return;
  }

  // ── Enter: toggle game menu (or close any open menu) ─────
  if (escEdge) {
    if (state.showNpcMenu) { state.showNpcMenu = false; }
    else if (state.showContainerMenu) { closeContainerMenu(); }
    else if (state.showInventory) { state.showInventory = false; }
    else if (state.showQuests) { state.showQuests = false; }
    else if (state.showFactions) { state.showFactions = false; }
    else if (state.showLog) { state.showLog = false; }
    else { state.showMenu = !state.showMenu; state.menuSel = 0; }
  }

  // ── Game menu navigation ─────────────────────────────────
  if (state.showMenu) {
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    if (upNav) state.menuSel = Math.max(0, state.menuSel - 1);
    if (dnNav) state.menuSel = Math.min(3, state.menuSel + 1);
    if (interactEdge) {
      switch (state.menuSel) {
        case 0: state.showMenu = false; break;                // Continue
        case 1: state.showMenu = false; pendingLoad = () => { initGame(); }; break;    // New Game
        case 2: saveGame(); state.showMenu = false; break;    // Save
        case 3: loadGame(); break;                            // Load
      }
    }
  }
  // ── Inventory toggle + navigation ────────────────────────
  else if (state.showInventory) {
    if (invEdge) { state.showInventory = false; }
    else {
      const GRID_W = 5;
      const upNav = menuRepeatStep('up', input.invUp, upEdge);
      const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
      if (upNav) state.invSel = Math.max(0, state.invSel - GRID_W);
      if (dnNav) state.invSel = Math.min(24, state.invSel + GRID_W);
      if (leftNav && state.invSel % GRID_W > 0) state.invSel--;
      if (rightNav && state.invSel % GRID_W < GRID_W - 1) state.invSel++;
      if (interactEdge) {
        const zoneId = world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
        useItem(player, state.invSel, state.msgs, state.time, state, zoneId, world);
      }
      if (dropEdge) dropItem(player, state.invSel, entities, state.msgs, state.time, nextEntityId, state, world);
      // Attribute spending (1=STR, 2=AGI, 3=INT)
      if (input.attrStr && player.rpg && player.rpg.attrPoints > 0) {
        if (spendAttrPoint(player, 'str'))
          state.msgs.push(msg(`Сила +1 (${player.rpg.str})`, state.time, '#f84'));
        input.attrStr = false;
      }
      if (input.attrAgi && player.rpg && player.rpg.attrPoints > 0) {
        if (spendAttrPoint(player, 'agi'))
          state.msgs.push(msg(`Ловкость +1 (${player.rpg.agi})`, state.time, '#4af'));
        input.attrAgi = false;
      }
      if (input.attrInt && player.rpg && player.rpg.attrPoints > 0) {
        if (spendAttrPoint(player, 'int'))
          state.msgs.push(msg(`Интеллект +1 (${player.rpg.int})`, state.time, '#a4f'));
        input.attrInt = false;
      }
    }
  }
  // ── Quest log toggle ─────────────────────────────────────
  else if (state.showQuests) {
    if (questEdge) { state.showQuests = false; }
    const totalQ = state.quests.length;
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    if (upNav) state.questPage = Math.max(0, state.questPage - 1);
    if (dnNav) state.questPage = Math.min(Math.max(0, totalQ - 1), state.questPage + 1);
  }
  // ── Container menu navigation ────────────────────────────
  else if (state.showContainerMenu) {
    const container = world.containerById.get(state.containerMenuTarget);
    if (!container) {
      closeContainerMenu();
    } else {
      const GRID = 5;
      const upNav = menuRepeatStep('up', input.invUp, upEdge);
      const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
      if (upNav) state.containerCursorY = Math.max(0, state.containerCursorY - 1);
      if (dnNav) state.containerCursorY = Math.min(GRID - 1, state.containerCursorY + 1);
      if (leftNav) {
        if (state.containerCursorX > 0) {
          state.containerCursorX--;
        } else if (state.containerSide === 'container') {
          state.containerSide = 'player';
          state.containerCursorX = GRID - 1;
        }
      }
      if (rightNav) {
        if (state.containerCursorX < GRID - 1) {
          state.containerCursorX++;
        } else if (state.containerSide === 'player') {
          state.containerSide = 'container';
          state.containerCursorX = 0;
        }
      }
      if (interactEdge) {
        const idx = state.containerCursorY * GRID + state.containerCursorX;
        const access = containerAccessInfo(container, player, state);
        if (state.containerSide === 'container') {
          const slot = container.inventory[idx];
          const itemName = slot ? ITEMS[slot.defId]?.name ?? slot.defId : '';
          if (!access.canTake) {
            state.msgs.push(msg(access.label === 'ЗАПЕРТО' ? 'Заперто.' : 'Нет доступа.', state.time, '#f84'));
          } else if (slot && takeFromContainer(container, player, idx, 1, { state, world, entities })) {
            state.msgs.push(msg(`${access.theft ? 'Украдено' : 'Взято'}: ${itemName}`, state.time, access.theft ? '#f84' : '#8f8'));
          } else {
            state.msgs.push(msg(slot ? 'Нет места.' : 'Пустой слот.', state.time, '#888'));
          }
        } else {
          const slot = player.inventory?.[idx];
          if (!access.canPut) {
            state.msgs.push(msg('Нет доступа.', state.time, '#f84'));
          } else if (slot && putIntoContainer(container, player, idx, 1, { state, world, entities })) {
            state.msgs.push(msg(`Положено: ${ITEMS[slot.defId]?.name ?? slot.defId}`, state.time, '#8cf'));
          } else {
            state.msgs.push(msg(slot ? 'Контейнер полон.' : 'Пустой слот.', state.time, '#888'));
          }
        }
      }
    }
  }
  // ── NPC menu navigation ──────────────────────────────────
  else if (state.showNpcMenu) {
    const npc = entities.find(e => e.id === state.npcMenuTarget);
    if (state.npcMenuTab === 'main') {
      const upNav = menuRepeatStep('up', input.invUp, upEdge);
      const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
      if (upNav) state.npcMenuSel = Math.max(0, state.npcMenuSel - 1);
      if (dnNav) state.npcMenuSel = Math.min(2, state.npcMenuSel + 1);
      if (interactEdge) {
        switch (state.npcMenuSel) {
          case 0: // Talk
            state.npcMenuTab = 'talk';
            state.npcTalkText = npc ? generateTalkText(npc, { world, state, player, time: state.time }) : '...';
            break;
          case 1: // Quest
            if (npc) {
              checkTalkQuest(npc, player, entities, state, state.msgs);
              offerQuest(npc, player, world, entities, state, state.msgs, nextEntityId);
              // Only switch to quest tab if this NPC has an active quest
              const active = state.quests.filter(q => !q.done);
              const npcQIdx = active.findIndex(q => q.giverId === npc.id);
              if (npcQIdx >= 0) {
                state.npcMenuTab = 'quest';
                state.questPage = npcQIdx;
              }
              // Otherwise stay on 'main' — message already shown in HUD
            }
            break;
          case 2: // Trade
            state.npcMenuTab = 'trade';
            state.tradeCursorX = 0;
            state.tradeCursorY = 0;
            state.tradeSide = 'npc';
            if (npc) primeTradePriceCache(state, [npc.inventory, player.inventory]);
            break;
        }
      }
    } else if (state.npcMenuTab === 'talk') {
      if (interactEdge || escEdge) state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'quest') {
      const totalQ = state.quests.filter(q => !q.done).length;
      const upNav = menuRepeatStep('up', input.invUp, upEdge);
      const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
      if (upNav || leftNav) state.questPage = Math.max(0, state.questPage - 1);
      if (dnNav || rightNav) state.questPage = Math.min(Math.max(0, totalQ - 1), state.questPage + 1);
      if (interactEdge || escEdge) state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'trade') {
      if (npc) {
        const GRID = 5;
        const upNav = menuRepeatStep('up', input.invUp, upEdge);
        const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
        const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
        // W/S — move cursor up/down
        if (upNav) state.tradeCursorY = Math.max(0, state.tradeCursorY - 1);
        if (dnNav) state.tradeCursorY = Math.min(GRID - 1, state.tradeCursorY + 1);
        // A/D — move cursor left/right, crossing between panels
        if (leftNav) {
          if (state.tradeCursorX > 0) {
            state.tradeCursorX--;
          } else if (state.tradeSide === 'npc') {
            state.tradeSide = 'player';
            state.tradeCursorX = GRID - 1;
          }
        }
        if (rightNav) {
          if (state.tradeCursorX < GRID - 1) {
            state.tradeCursorX++;
          } else if (state.tradeSide === 'player') {
            state.tradeSide = 'npc';
            state.tradeCursorX = 0;
          }
        }
        // E — buy or sell
        if (interactEdge) {
          activateTradeSelection(npc);
        }
      }
      if (escEdge) state.npcMenuTab = 'main';
    }
  }
  // ── Debug menu navigation ────────────────────────────────
  else if (state.showDebug) {
    const dbgEdge = input.debugScreen && !prevDebug;
    if (escEdge || dbgEdge) { state.showDebug = false; }
    else {
      const upNav = menuRepeatStep('up', input.invUp, upEdge);
      const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
      if (upNav) state.debugSel = Math.max(0, state.debugSel - 1);
      if (dnNav) state.debugSel = Math.min(DEBUG_COMMAND_COUNT - 1, state.debugSel + 1);
      if (leftNav) moveDebugInfoPage(-1);
      if (rightNav) moveDebugInfoPage(1);
      if (interactEdge) {
        const action = execDebugCommand(state.debugSel, world, player, entities, state, nextEntityId);
        if (action) handleDebugCommandAction(action);
      }
    }
  }
  // ── Faction relations menu ───────────────────────────────
  else if (state.showFactions) {
    if (factionEdge || escEdge) { state.showFactions = false; }
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    if (upNav) state.factionRankScroll = Math.max(0, state.factionRankScroll - 3);
    if (dnNav) state.factionRankScroll = Math.min(99, state.factionRankScroll + 3);
  }
  // ── Message log menu ─────────────────────────────────────
  else if (state.showLog) {
    if (logEdge || escEdge) { state.showLog = false; }
    const maxScroll = Math.max(0, state.msgLog.length * 3); // generous; draw clamps
    const upNav = menuRepeatStep('up', input.invUp, upEdge);
    const dnNav = menuRepeatStep('down', input.invDn, dnEdge);
    if (upNav) state.logScroll = Math.min(maxScroll, state.logScroll + 3);
    if (dnNav) state.logScroll = Math.max(0, state.logScroll - 3);
  }
  // ── Normal gameplay toggles ──────────────────────────────
  else {
    const dbgEdge = input.debugScreen && !prevDebug;
    if (dbgEdge) { state.showDebug = true; state.debugSel = 0; resetDebugInfoPage(); }
    if (invEdge) { state.showInventory = true; state.invSel = 0; }
    if (questEdge) { state.showQuests = true; }
    if (factionEdge) { state.showFactions = true; state.factionRankScroll = 0; }
    if (logEdge) { state.showLog = true; state.logScroll = 0; }
  }

  // Update prev states
  prevEsc = input.escape;
  prevMenuUp = input.invUp;
  prevMenuDn = input.invDn;
  prevMenuLeft = input.invLeft;
  prevMenuRight = input.invRight;
  prevMenuInteract = input.interact;
  prevDrop = input.drop;
  prevInvMenu = input.inv;
  prevQuestMenu = input.questLog;
  prevDebug = input.debugScreen;
  prevFactionMenu = input.factionMenu;
  prevLogMenu = input.logMenu;
  prevControlsMenu = input.controls;
  prevControlReset = input.controlReset;

  // Auto-pause when any menu is open
  syncPauseState();
}

/* ── Game loop ────────────────────────────────────────────────── */
let lastTime = performance.now();
let uiTime = 0;
let lastSlidePair = -1;
let lastSlideCellA = -1;
let lastSlideCellB = -1;
let needsTickAccum = 0;
let bloodTrailAccum = 0;
let deadCleanupAccum = 0;
let entityIndexFrame = 0;

function cleanupDeadEntities(dt: number): number {
  deadCleanupAccum += dt;
  if (deadCleanupAccum < 0.5) return 0;
  deadCleanupAccum = 0;
  let removed = 0;
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (!e.alive && e.type !== EntityType.PLAYER) {
      if (e.type === EntityType.NPC) recordAlifeNpcDeath(state, e);
      entities.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

function gameLoop(now: number): void {
  // Two-phase deferred loading:
  // Phase 1: pendingLoad exists but not drawn yet → draw loading screen, yield to browser
  // Phase 2: pendingLoad exists and was drawn → execute heavy generation
  if (pendingLoad) {
    if (!pendingLoadDrawn) {
      // Phase 1: paint "ЗАГРУЗКА..." and yield so the browser can composite it
      drawLoading();
      pendingLoadDrawn = true;
      requestAnimationFrame(gameLoop);
      return;
    }
    // Phase 2: loading screen is visible, now do the heavy work
    const fn = pendingLoad;
    pendingLoad = null;
    pendingLoadDrawn = false;
    fn();
    rebuildEntityIndex(entities, 'load');
    lastTime = performance.now(); // reset dt so we don't get a huge spike
    requestAnimationFrame(gameLoop);
    return;
  }

  const rawDt = (now - lastTime) / 1000;
  lastTime = now;
  const frameDt = Math.min(rawDt, 0.05); // cap delta
  uiTime += frameDt;
  let dt = frameDt;
  tickNetSphere(state, player);

  // ── Sleep: hold Z to sleep (time acceleration ×10) ───────
  const SLEEP_TIME_MULT = 10;
  // Restore rate: 100 sleep in 5 game-hours (300 game-min = 300 real-sec at 1x)
  // → 100/300 ≈ 0.333 per real-sec at 1x, but with 10x accel → ~30 real-sec full restore
  const SLEEP_RESTORE_RATE = 100 / 300; // per simulated second
  const wantSleep = input.sleep && !state.paused && !state.gameOver
    && player.alive && player.needs !== undefined;
  state.sleeping = wantSleep && (player.needs?.sleep ?? 100) < 100;
  if (state.sleeping) dt *= SLEEP_TIME_MULT;

  // Menu input always processed (even when paused)
  handleMenuInput();
  // If menu triggered new game / load, bail out to show loading screen
  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

  if (!state.paused) {
    entityIndexFrame = (entityIndexFrame + 1) & 0x3fffffff;
    rebuildEntityIndexForSimulation(entities, entityIndexFrame);
  }

  // ── Update ───────────────────────────────────────────────
  // Decay damage flash
  if (state.dmgFlash > 0) state.dmgFlash = Math.max(0, state.dmgFlash - dt * 1.2);
  // Decay beam visual
  if (state.beamFx > 0) state.beamFx = Math.max(0, state.beamFx - dt * 2.5);
  if (state.uvBeamFx > 0) state.uvBeamFx = Math.max(0, state.uvBeamFx - dt * 5.0);

  // Rolling head physics after death
  if (state.gameOver && deathCam) {
    state.deathTimer += dt;
    updateDeathCam(deathCam, world, dt);
  }

  if (!state.paused && !state.gameOver) {
    state.time += dt;
    state.tick++;

    // Update game clock (1 real second = 1 game minute)
    state.clock.totalMinutes += dt;
    const totalMins = Math.floor(state.clock.totalMinutes);
    state.clock.hour = (8 + Math.floor(totalMins / 60)) % 24;  // start at 8:00
    state.clock.minute = totalMins % 60;
    setMsgClock(state.clock);
    tickRoomMemory(state.time, dt);
    updateZhelemishSkinStatus(player, state, dt);
    updateInventoryConditions(player, state);

    // ── Sleep restoration while holding Z ──
    if (state.sleeping && player.needs) {
      player.needs.sleep = Math.min(100, player.needs.sleep + SLEEP_RESTORE_RATE * dt);
      if (player.needs.sleep >= 100) {
        state.msgs.push(msg('Вы выспались.', state.time, '#a8f'));
      }
    }

    movePlayer(dt);
    playerActions(dt);
    // If switchFloor was triggered, pendingLoad is set — skip the rest of this frame
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    updateLiftArachnaEncounter(world, entities, player, state, dt, nextEntityId);
    updatePseudolifts(world, entities, player, state);
    updateEquippedTool(dt);
    // Player urination (P key)
    if (input.pee && player.alive && player.needs && player.needs.pee > 5) {
      const range = 1.5;
      const ux = player.x + Math.cos(player.angle) * range;
      const uy = player.y + Math.sin(player.angle) * range;
      const cx = ((Math.floor(ux) % W) + W) % W;
      const cy = ((Math.floor(uy) % W) + W) % W;
      if (!world.solid(cx, cy)) {
        const fx = ((ux % 1) + 1) % 1;
        const fy = ((uy % 1) + 1) % 1;
        stampMark(world, cx, cy, fx, fy, 0.15, MarkType.DRIP, Math.floor(state.time * 100), 200, 180, 30, 60);
        // Faction penalty for urinating outside bathroom
        applyUrinationPenalty(dt);
        player.needs.pee = Math.max(0, player.needs.pee - 12 * dt);
        if (player.needs.pee <= 5) {
          state.msgs.push(msg('Полегчало.', state.time, '#da4'));
        }
      }
    } else {
      // Reset urination penalty tracking when not peeing
      _urinePenaltyStarted = false;
      _urinePenaltyAccum = 0;
    }
    updateProjectiles(dt);
    updateDoors(dt);
    updateWrongDoorRemaps(world, state);
    updateHladonColdPocket(world, player, state, dt);
    needsTickAccum += dt;
    if (needsTickAccum >= 0.25) {
      const needsDt = needsTickAccum;
      needsTickAccum = 0;
      updateNeeds(entities, needsDt, state.time, state.msgs, player.id, nextEntityId, state);
    }
    if (updateBetonoedShortcut(world, entities, player, state, dt)) updateWorldData(world);
    setListenerPos(player.x, player.y, (ax, ay, bx, by) => world.dist2(ax, ay, bx, by));
    updateRouteCues(world, player, state);
    updateAI(world, entities, dt, state.time, state.msgs, player.id, state.clock, state.samosborActive, nextEntityId, state.currentFloor, state);
    updateRailTrains(world, entities, player, state, dt);
    updateParitelSteamBridge(world, entities, player, state, dt);
    updateCarnivorousFungus(world, entities, player, state, dt, nextEntityId);
    tickCellHazards(world, entities, state, dt, player, input.fwd || input.back || input.strafeL || input.strafeR || input.touch.moveX !== 0 || input.touch.moveY !== 0);
    updateProceduralAnomalies(world, player, state, dt);
    if (updateSamosbor(world, entities, state, dt, nextEntityId)) {
      reportNetSphereProgressEvents();
      pendingLoad = () => {
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentFloor, replacement);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentFloor);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        restoreVoidReturnPortalForCurrentWorld();
        setGeneratedDynamicSky(replacement);
        updateWorldData(world);
      };
      requestAnimationFrame(gameLoop);
      return;
    }
    // Faction zone capture (cell-based territory control)
    updateFactionCapture(world, entities, dt);
    updateFactionActivity(world, entities, player, state, nextEntityId, dt, currentFloorAllowsNpcPopulation());
    if (state.currentFloor === FloorLevel.KVARTIRY) {
      updateKvPopulation(world, entities, dt, state);
    }
    // Continuous monster spawn for Grom's defense quest (step 8)
    if (state.currentFloor === FloorLevel.MAINTENANCE) {
      updateDefenseQuestSpawn(dt);
    }
    // PSI does NOT auto-regenerate — only restored via items (pills, antidepressant)
    // Update ongoing PSI spell effects (phase shift, madness, control)
    updatePsiEffects(entities, dt);
    updateSeroburmalineExposure(world, player, state, dt);

    // Blood trails from wounded entities + particle physics
    bloodTrailAccum += dt;
    if (bloodTrailAccum >= 0.3) {
      const bloodDt = bloodTrailAccum;
      bloodTrailAccum = 0;
      updateBloodTrails(world, entities, bloodDt);
    }
    updateParticles(world, dt);

    // Cycle slide textures every 5 seconds — left tile=even, right tile=odd
    if (world.slideCells.length >= 2) {
      const pair = Math.floor(state.time / 5) % 4;
      const slideA = world.slideCells[0];
      const slideB = world.slideCells[1];
      if (pair !== lastSlidePair || slideA !== lastSlideCellA || slideB !== lastSlideCellB) {
        world.wallTex[slideA] = Tex.SLIDE_1 + pair * 2;     // left
        world.wallTex[slideB] = Tex.SLIDE_1 + pair * 2 + 1; // right
        world.markWallTexDirty();
        lastSlidePair = pair;
        lastSlideCellA = slideA;
        lastSlideCellB = slideB;
      }
    }
    if (updateProceduralScreens(world, state.time)) {
      world.markWallTexDirty();
    }
    // Check quest completion
    if (state.tick % 30 === 0) {
      checkQuests(player, world, entities, state, state.msgs);
    }

    // Portal step-on check — teleport to Void floor
    if (state.currentFloor === FloorLevel.HELL && state.tick % 10 === 0) {
      const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
      if (world.floorTex[pci] === Tex.PORTAL) {
        // Transition to Void — use switchFloor-like mechanism
        enterVoidFloor();
        // Bail out: currentFloor is already VOID but old world still has the portal;
        // continuing would trigger the "return portal" check and freeze the game.
        requestAnimationFrame(gameLoop);
        return;
      }
    }

    // Return portal in Void — only the Creator-opened portal can end the run.
    if (state.currentFloor === FloorLevel.VOID && state.tick % 10 === 0) {
      const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
      if (tryUseVoidReturnPortal(pci)) {
        syncMsgLog();
        requestAnimationFrame(gameLoop);
        return;
      }
    }

    // Auto-pickup when walking
    if (state.tick % 15 === 0) {
      pickupNearby(world, entities, player, state.msgs, state.time, state, drop => {
        claimNetTerminalGenFleshDrop(state, drop, player, world);
        recordFactionEventLootTaken(state, world, player, drop);
      });
    }
    if (state.tick % 60 === 0) {
      tickContainerAudits(state, world, player, entities);
      tickProduction(state, world, false, player);
      tickBankingInterest(state);
      tickStockMarket(state);
    }

    keepDebugOnePunchManAlive(player);

    // Detect player damage for vignette flash
    const curHp = player.hp ?? 100;
    if (curHp < prevPlayerHp) {
      const lost = prevPlayerHp - curHp;
      const maxHp = player.maxHp ?? 100;
      state.dmgFlash = Math.min(1, 0.3 + (lost / maxHp) * 1.5);
      state.dmgSeed = Math.random() * 10000;
      recordUnattributedPlayerDamage(lost);
      playFleshHit();
    }
    prevPlayerHp = curHp;

    // Check player death
    if (!player.alive && !state.gameOver) {
      handlePlayerDeath();
    }
    reportNetSphereProgressEvents();

    if (cleanupDeadEntities(dt) > 0) {
      // Exception to the one planned rebuild: splice cleanup changes the flat array after spawns/deaths.
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }

    // Sync new messages to persistent log, then trim
    syncMsgLog();
    while (state.msgs.length > 50) state.msgs.shift();
    _prevMsgCount = state.msgs.length;
  }

  // ── World simulation continues after death (NPC, monsters, samosbor keep running) ──
  if (!state.paused && state.gameOver) {
    state.time += dt;
    state.tick++;
    state.clock.totalMinutes += dt;
    const totalMins = Math.floor(state.clock.totalMinutes);
    state.clock.hour = (8 + Math.floor(totalMins / 60)) % 24;
    state.clock.minute = totalMins % 60;
    tickRoomMemory(state.time, dt);
    updateProjectiles(dt);
    updateDoors(dt);
    updateWrongDoorRemaps(world, state);
    needsTickAccum += dt;
    if (needsTickAccum >= 0.25) {
      const needsDt = needsTickAccum;
      needsTickAccum = 0;
      updateNeeds(entities, needsDt, state.time, state.msgs, player.id, nextEntityId, state);
    }
    if (updateBetonoedShortcut(world, entities, player, state, dt)) updateWorldData(world);
    setListenerPos(player.x, player.y, (ax, ay, bx, by) => world.dist2(ax, ay, bx, by));
    updatePseudolifts(world, entities, player, state);
    updateAI(world, entities, dt, state.time, state.msgs, player.id, state.clock, state.samosborActive, nextEntityId, state.currentFloor, state);
    tickCellHazards(world, entities, state, dt, player, false);
    if (updateSamosbor(world, entities, state, dt, nextEntityId)) {
      reportNetSphereProgressEvents();
      pendingLoad = () => {
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentFloor, replacement);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentFloor);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        setGeneratedDynamicSky(replacement);
        updateWorldData(world);
      };
      requestAnimationFrame(gameLoop);
      return;
    }
    updateFactionCapture(world, entities, dt);
    updateFactionActivity(world, entities, player, state, nextEntityId, dt, currentFloorAllowsNpcPopulation());
    if (state.currentFloor === FloorLevel.KVARTIRY) {
      updateKvPopulation(world, entities, dt, state);
    }
    bloodTrailAccum += dt;
    if (bloodTrailAccum >= 0.3) {
      const bloodDt = bloodTrailAccum;
      bloodTrailAccum = 0;
      updateBloodTrails(world, entities, bloodDt);
    }
    updateParticles(world, dt);
    if (cleanupDeadEntities(dt) > 0) {
      // Exception to the one planned rebuild: splice cleanup changes the flat array after spawns/deaths.
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    syncMsgLog();
    while (state.msgs.length > 50) state.msgs.shift();
    _prevMsgCount = state.msgs.length;
  }

  checkRestart();
  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
  updateMobileContext();

  // ── Render ───────────────────────────────────────────────
  // Fog density varies by floor level
  let baseFog = 0.065;
  if (state.currentFloor === FloorLevel.MAINTENANCE) baseFog = 0.08;
  if (state.currentFloor === FloorLevel.HELL) baseFog = 0.05; // less fog, more horror visibility
  const smogFogBonus = !state.gameOver ? proceduralSmogFogDensityBonus(world, player, state) : 0;
  const fogDensity = (state.samosborActive ? baseFog + 0.03 : baseFog) + smogFogBonus;
  const glitch = state.samosborActive
    ? 0.3 + Math.sin(uiTime * 5) * 0.15
    : Math.min(0.18, smogFogBonus * 4);

  // Use death cam position/angle when dead, otherwise player
  const camX     = deathCam ? deathCam.x              : player.x;
  const camY     = deathCam ? deathCam.y              : player.y;
  const camAngle = deathCam ? getDeathCamAngle(deathCam) : player.angle;
  const camPitch = deathCam ? getDeathCamPitch(deathCam) : player.pitch;

  const camH = deathCam ? deathCam.height : 0.5;
  let flashlight = 0;
  if (!state.gameOver && player.tool === 'flashlight') {
    const d = getEquippedToolDurability(player);
    if (d && d.max > 0 && d.cur > 0) flashlight = Math.max(0.25, Math.min(1, d.cur / d.max));
  }

  // Update dynamic world data (fog, door states, wallTex for slides)
  updateGeneratedDynamicSky(dt);
  updateDynamicData(world, camX, camY);

  // WebGL raycaster + sprites
  const ambientLight = currentFloorRunEntry(state).designFloorId === 'darkness' ? 0 : 0.12;
  renderSceneGL(world, textures, sprites, entities,
    camX, camY, camAngle, camPitch,
    fogDensity, glitch, camH, flashlight, uiTime, particles, state.samosborActive, ambientLight);

  // Draw HUD on 2D overlay canvas
  ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  drawHUD(ctx, hudCanvas.width / SCR_W, hudCanvas.height / SCR_H, player, state, world, entities, uiTime);

  requestAnimationFrame(gameLoop);
}

/* ── Title screen ─────────────────────────────────────────────── */
function showTitle(): void {
  const w = hudCanvas.width;
  const h = hudCanvas.height;
  const name = playerNickname;
  const shownName = name || 'введите имя';
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c00';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ГИГАХРУЩ', w / 2, h / 2 - 72);
  ctx.fillStyle = '#666';
  ctx.font = '16px monospace';
  ctx.fillText('бесконечный бетонный лабиринт', w / 2, h / 2 - 22);
  ctx.fillStyle = '#6cf';
  ctx.font = '14px monospace';
  ctx.fillText(`НЕТ-ИМЯ: ${shownName}${Math.floor(performance.now() / 500) % 2 === 0 ? '_' : ''}`, w / 2, h / 2 + 20);
  ctx.fillStyle = '#888';
  ctx.font = '16px monospace';
  ctx.fillText('Введите имя и нажмите ENTER', w / 2, h / 2 + 56);
  ctx.fillStyle = '#555';
  ctx.font = '12px monospace';
  ctx.fillText(
    mobileControls?.isEnabled()
      ? 'Тап — начать  |  левый джойстик — ходьба  |  правый — камера  |  центр — атака'
      : `${controlBindingLabel('moveForward')} — движение  |  Мышь — обзор  |  ${controlBindingLabel('interact')} — действие  |  ${controlBindingLabel('controlsMenu')} — все клавиши`,
    w / 2,
    h / 2 + 96,
  );
  ctx.textAlign = 'left';
  updateMobileContext();
}

function startGameFromTitle(): void {
  if (started) return;
  mobileGestureUnlock();
  savePlayerNickname(playerNickname);
  player.name = playerDisplayName();
  started = true;
  input.escape = false;
  document.removeEventListener('keydown', startHandler);
  bindNetSphereInput();
  requestPointerLockIfDesktop();
  startAmbientDrone();
  updateMobileContext();
  requestAnimationFrame(gameLoop);
}

function startHandler(e: KeyboardEvent): void {
  if (started || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'Enter') {
    e.preventDefault();
    startGameFromTitle();
    return;
  }
  if (e.code === 'Backspace') {
    playerNickname = playerNickname.slice(0, -1);
    showTitle();
    e.preventDefault();
    return;
  }
  if (e.key.length === 1 && playerNickname.length < 24) {
    const next = cleanPlayerNickname(playerNickname + e.key);
    if (next !== playerNickname) {
      playerNickname = next;
      showTitle();
    }
    e.preventDefault();
  }
}

document.addEventListener('keydown', startHandler);

/* ── ГИГАХРУЩ — main entry point ──────────────────────────────── */
import './index.css';
import './systems/demos_runtime';
import { registerPwaServiceWorker } from './pwa';

import { type PlayerStatus,
  W, Cell, DoorState, FloorLevel, Tex, RoomType, LiftDirection,
  type CharacterSex, type Entity, type GameClock, type GameState, type Item, type Needs, type Quest, type RPGStats, type WorldContainer,
  type PlayerDamageSourceKind, type WorldEventPrivacy, type WorldEventSeverity,
  EntityType, Faction, MonsterKind, Occupation, ProjType, QuestType, AIGoal,
  msg, setMsgClock,
 } from './core/types';
import { World, replaceWorldFromGeneration } from './core/world';
import { hashSeed, randSeed } from './core/rand';
import { canActorOccupy, unstuckActorFromBlockers } from './systems/movement_collision';
import { selectMeleeTarget } from './systems/melee_targeting';
import { updateProceduralScreens } from './gen/procedural_screens';
import { generateProceduralFloor } from './gen/procedural_floor';
import { generateDesignFloor, isDesignFloorId } from './gen/design_floors/manifest';
import { injectFastElevators } from './gen/fast_elevators';
import { stampCeilingHeights } from './gen/ceiling_heights';
import {
  floorInstanceGenerationExtrasForKey,
  floorInstanceSamosborReplacementAllowed,
  generateFloorInstance,
} from './gen/floor_instances/manifest';
import {
  FLOOR_MESSAGE_COLORS,
  FLOOR_NAMES,
  generateFloor,
  isFloorLevel,
  resetGeneratedFloorPopulationState,
  type FloorGeneration,
} from './gen/floor_manifest';
import { generateTextures } from './render/textures';
import { generateSprites } from './render/sprites';
import { Spr, monsterSpr } from './render/sprite_index';
import {
  SCR_W, SCR_H, initWebGL, renderSceneGL, updateWorldData, updateDynamicData,
  disposeWebGL, setDynamicSkyTexture, getRenderSceneDebugStats, rebuildProceduralSpriteCache, type DynamicSkyTexture,
} from './render/webgl';
import { drawHUD, drawPointerCaptureGate, type HudPerfDebugSnapshot } from './render/hud';
import {
  spawnBloodHit, spawnDeathPool, updateBloodTrails, updateParticles, particles,
  spawnProjectileBodyImpact, spawnProjectileFloorImpact, spawnProjectileWallImpact, isEnergyProjectileImpact,
  spawnExplosionParticles,
} from './render/blood';
import { resetComputerState, restoreComputersFromSave } from './systems/computers';
import { resetNetHackState, restoreNetHackFromSave } from './systems/net_hack';
import { stampMark, MarkType } from './systems/surface_marks';
import { stampUrineTrace } from './systems/urination';
import { containerMenuGridLayout, craftMenuLayout, fullscreenInventoryLayout, tradeMenuGridLayout } from './render/ui_layout';
import { updateNeeds } from './systems/needs';
import { updateAI, tryMonsterProjectileStagger, getAiStats, type AiStats } from './systems/ai';
import { resolveBreachChargeExplosion } from './systems/breach_charge';
import { dropMonsterRareLoot } from './systems/monster_drops';
import { generateNpcTradeItems } from './data/occupation_profiles';
import { generateTalkText } from './systems/dialogue';
import { updateSamosbor, rebuildWorld, clearFogInZone, updateIstotitBellCompulsion } from './systems/samosbor';
import { getActiveSamosborVariant } from './systems/samosbor_variants_runtime';
import { cleanCellHazardsNear, getCellHazardMoveMultiplier, tickCellHazards } from './systems/cell_hazards';
import { adjustMonsterProjectileDamage, recordMonsterMeleeDeath, recordMonsterProjectileDeath } from './systems/monster_counterplay';
import { applyMonsterArmorHit } from './systems/monster_armor';
import {
  pickupNearby, useItem, dropItem, getWeaponStats, equippedCombatItemId,
  consumeDurability, consumeAmmo, consumeToolDurability, getEquippedToolDurability,
  updateInventoryConditions,
} from './systems/inventory';
import { createInput, bindInput } from './input';
import { createMobileControls, type MobileControls, type MobileMenuId } from './mobile';
import { createGamepadAdapter, type GamepadAdapter } from './input_gamepad';
import {
  createInputFrame,
  beginInputFrame,
  resolveInputFrameToInputState,
  type InputFrame,
} from './systems/input_intent';
import { isNativeFullscreenActive, toggleNativeFullscreen } from './fullscreen';
import {
  CONTROL_ACTIONS,
  beginControlCapture,
  cancelControlCapture,
  clearControlBinding,
  clearControlInputs,
  getControlCaptureAction,
  resetAllControlBindings,
} from './systems/controls';
import { GAME_MENU_ITEMS } from './systems/game_menu';
import { MOBILE_BUTTON_CONTROL_ROWS } from './systems/mobile_actions';
import {
  adjustCameraFov,
  cycleHudMotionMode,
  cycleScreenInterferenceMode,
  cycleVisualGeometryMode,
  cycleLightingQualityMode,
  adjustMobileLookSensitivity,
  adjustMouseLookSensitivity,
  applyUiPreset,
  autoPickupEnabled,
  cameraFovRadians,
  mobileLookSensitivity,
  mouseLookSensitivity,
  resetGraphicsSettings,
  resetMapLegendSettings,
  resetUiSettings,
  screenInterferenceMode,
  toggleAutoPickup,
  toggleMapHighContrast,
  toggleUiElement,
  toggleMapLegendToggle,
  uiElementEnabled,
  visualGeometryMode,
  visualGeometryModeLabel,
  lightingQualityModeLabel,
  lightingQualityIndex,
  type UiSettingsView,
  mapLegendRowAt,
  mapLegendRowCount,
  uiSettingsRowAt,
  uiSettingsRowCount,
} from './systems/ui_orchestrator';
import { freshNeeds, ITEMS, WEAPON_STATS, type WeaponStats } from './data/catalog';
import { INVENTORY_GRID_COLS, INVENTORY_GRID_ROWS, MAX_INVENTORY_SLOTS } from './data/inventory_limits';
import { getStack, itemEquipSlot } from './data/items';
import { designFloorAmbientLight } from './data/design_floor_profiles';
import {
  themeForDesignFloor,
  themeForProceduralSpec,
  themeForStoryFloor,
  type FloorThemeProfile,
} from './data/floor_theme_profiles';
import {
  EMPTY_RESOLVED_VISUAL_DETAIL_PROFILE,
  resolveVisualDetailProfile,
  type ResolvedVisualDetailProfile,
} from './data/visual_detail_profiles';
import {
  EMPTY_RESOLVED_VISUAL_GEOMETRY_PROFILE,
  resolveVisualGeometryProfile,
  visualGeometryThemeTags,
  type ResolvedVisualGeometryProfile,
} from './data/visual_geometry_profiles';
import {
  EMPTY_RESOLVED_VISUAL_SURFACE_PROFILE,
  resolveVisualSurfaceProfile,
  type ResolvedVisualSurfaceProfile,
} from './data/visual_surface_profiles';
import {
  activeToolLightDrainPerSecond,
  activeToolLightMoveMultiplier,
  activeToolLightRenderIntensity,
  passiveToolLightDrainPerSecond,
  passiveToolLightMoveMultiplier,
  passiveToolLightRenderIntensity,
} from './data/tool_lights';
import { entityDisplayName } from './entities/monster';
import { ensureProceduralSpriteSeeds } from './entities/procedural_visuals';
import {
  playFootstep, playAttack, playDoor,
  playGunshot, playShotgun, playNailgun, playBreak,
  playFleshHit, playPsiCast,
  playPPSh, playChainsaw, playMachinegun, playExplosion,
  playGauss, playPlasma, playBFG, playFlame, playPsiBeam,
  playProjectileImpact, playEnergyImpact, playProjectileBodyHit,
  startAmbientDrone, setListenerPos, playSoundAt, playHudBarChange,
  setAudioSuspendedForPage, setAudioSuspendedForPlatform,
  type HudBarAudioId,
} from './systems/audio';
import {
  offerQuest,
  checkQuests,
  checkTalkQuest,
  getCurrentObjective,
  isQuestSelectableAsActive,
  notifyKill,
  notifyNpcKill,
  npcHasImportantQuestAction,
  npcQuestActionHint,
  resetNonStoryQuestsForNewPlayer,
  toggleActiveQuest,
  updateKillQuestPressure,
} from './systems/quests';
import { applyPickedStoryItemOutcomes, applyStoryItemOutcomes, spawnStoryDeathDrops } from './systems/story_outcomes';
import { handleDiceInput, isDiceGameOpen } from './systems/dice';
import { handleDominoInput, isDominoGameOpen } from './systems/domino';
import { handleCheckersInput, isCheckersGameOpen } from './systems/checkers';
import { handleDurakInput, isDurakGameOpen } from './systems/durak';
import {
  activateNpcCustomMenuOption,
  clampNpcMenuSelection,
  closeNpcInteractionInterface,
  getNpcMenuOptions,
  NPC_MENU_INTERFACE_TAB,
  npcMenuOptionAt,
  npcMenuSelectionFor,
} from './systems/npc_interaction_options';
import { applyContractFloorHooks, notifyCleanupToolUse } from './systems/contracts';
import { cleanupToolProfile } from './systems/liquidator_cleanup_items';
import { cleanSurfaceArea as cleanWorldSurfaceArea } from './systems/surface_cleanup';
import { updateScriptedArrivals } from './systems/scripted_arrivals';
import { applyStoryRouteGates } from './systems/story_route_gates';
import { setDoorState } from './systems/door_state';
import {
  freshRPG, awardXP, xpForMonsterKill, xpForNpcKill,
  meleeDamage, actorMoveSpeed, agiAttackSpeedMult,
  spendAttrPoint, getMaxHp, getMaxPsi, randomRPG, xpForLevel,
  RPG_ATTRIBUTE_CAP, RPG_LEVEL_CAP,
  HUMANOID_BASE_MOVE_SPEED,
  normalizeHumanoidBaseMoveSpeed,
  normalizeHumanoidBaseMoveSpeeds,
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
import { formatLastPlayerDamageCause, hasFreshPlayerDamageRecord, recordPlayerDamage, updateBlockCrushDamage } from './systems/damage';
import { createWorldEventState, normalizeWorldEventState, publishEvent } from './systems/events';
import {
  craftKnownRecipe,
  craftRecipeLearnedMessage,
  craftMenuEntries,
  craftMenuSnapshot,
  createCraftingState,
  disassembleInventorySlot,
  learnCraftRecipe,
  learnCraftRecipesFromSource,
  restoreCraftingState,
  type CraftingActionResult,
} from './systems/crafting';
import { getCraftRecipeSource } from './data/craft_recipe_sources';
import {
  setWorldLogSpatialContextProvider,
  worldLogDistanceForLocation,
  worldLogLocationIsAudible,
  worldLogMessageDistance,
} from './systems/world_log';
import { hearingRadiusMetersForActor } from './systems/hearing';
import {
  publishExplosionNoise,
  publishFootstepNoise,
  publishWeaponNoise,
  resetNoiseRecords,
} from './systems/noise';
import { notifyActorDamaged } from './systems/combat_stimulus';
import { canSpawnEntityType, entitySoftLimit, entitySpawnSlots, remainingActiveActorSpawnSlots } from './systems/entity_limits';
import { clearRoomMemory, tickRoomMemory } from './systems/room_memory';
import { UV_SPOTLIGHT_FX_SECONDS, UV_SPOTLIGHT_ID, useUvSpotlight, uvSpotlightRenderIntensity } from './systems/uv_spotlight';
import { CHALK_ITEM_ID, drawEquippedChalkPixel } from './systems/chalk';
import { isRidingRailTrain, updateRailTrains } from './systems/rail_trains';
import { updateCarnivorousFungus } from './systems/carnivorous_fungus';
import { hladonColdMoveMultiplier, updateHladonColdPocket } from './systems/hladon';
import { tryCoverSeroburmalineSource, updateSeroburmalineExposure } from './systems/seroburmaline';
import { updateRouteCues } from './systems/route_cues';
import { updateDangerField } from './systems/danger_field';
import {
  resetMapExploration,
  syncMapExplorationAfterSamosborWave,
  updateMapExploration,
} from './systems/map_exploration';
import {
  runContentEntityDeathHooks,
  updateContentRuntimeHooks,
  type ContentCraftMenuRequest,
  type ContentRecipeLearnRequest,
} from './systems/content_hooks';
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
  floorInstanceAllowsNpcs,
  floorInstanceLabel,
  getActiveFloorInstance,
  resolveElevatorRoute,
  setFloorInstanceState,
  spreadElevatorInstanceRumor,
} from './systems/floor_instances';
import {
  captureFloorMemory,
  clearFloorMemory,
  collectFloorLiftAnchors,
  ensureFloorRouteLiftLayout,
  floorMemoryStateForSave,
  floorMemoryKeyForStoryFloor,
  floorMemoryStats,
  invalidateFloorMemory,
  restoreFloorMemoryFromSave,
  takeFloorMemory,
  type FloorLiftAnchor,
  type FloorMemoryLoad,
  type FloorRouteLiftMirror,
} from './systems/floor_memory';
import {
  commitFloorRunEntry,
  currentFloorRunEntry,
  ensureFloorRunState,
  floorRunArrivalLead,
  floorRunEntryDanger,
  floorRunEntryForFloorKey,
  floorRunEntryForZ,
  floorRunSaveHasRestorableRoute,
  floorRunEntryAllowsNpcs,
  floorRunEntryFloorKey,
  floorRunEntryLiftDirections,
  floorRunEntryKindLabel,
  floorRunEntryLiftLabel,
  floorRunEntryRole,
  floorRunEntryRouteId,
  forceFloorRunStory,
  forceProceduralFloorAnomaly,
  nextFloorRunSamosborCooldown,
  normalizeFloorRunSeed,
  resolveFloorRunRoute,
  ROUTE_LIFTS_PER_DIRECTION,
  setFloorRunState,
  type FloorRunEntry,
} from './systems/procedural_floors';
import { openRouteGateIds } from './systems/route_gates';
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
import { normalizeGameEconomy, primeTradePriceCache } from './systems/economy';
import {
  addTradeAskFromSlot,
  addTradeOfferFromSlot,
  clearTradeOffers,
  executeTradeDeal,
  removeTradeAskSlot,
  removeTradeOfferSlot,
  type TradeResult,
} from './systems/trade';
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
  isNoClipActive, resetPsiState, absorbPsiShieldDamage,
  endPsiPossession,
} from './systems/psi';
import { getCurrentPlayerId, isNativePlayerBodyEntity, isPlayerEntity, setCurrentPlayerEntity } from './systems/player_actor';
import { fireDeletionBeam } from './systems/weapon_beams';
import { traceFirstSolidCell, wrapWorld } from './systems/local_space';
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
  updateFactionActivity,
} from './systems/factions';
import { territoryFactionAt } from './systems/territory';
import {
  captureAlifeFloorState,
  currentAlifeFloorKey,
  materializeAlifeFloorPopulation,
  materializeAlifeArrival,
  recordAlifeNpcDeath,
  randomAliveAlifeNpcSnapshot,
  resetAlifePlayerRelationsForNewPlayer,
  setAlifeState,
} from './systems/alife';
import {
  applyDemosSearchText,
  cleanDemosSearchQuery,
  findDemosCursor,
  moveDemosCursor,
} from './systems/demos';
import { restoreDemosSocialFromSave } from './systems/demos_save';
import {
  existingDemosRelationToNewPlayer,
  resetDemosPlayerRelationSlotsForNewPlayer,
} from './systems/demos_social';
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
  isNetSphereChatInputActive,
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
  isMapEditorMapMode,
  moveMapEditorMode,
  openMapEditor,
  replayMapEditorPatchForCurrentFloor,
  setMapEditorPatchState,
} from './systems/map_editor';
import { createGameSavePayload, saveShapeVersionStatus } from './systems/save_runtime';
import { createPortalCompactSavePayload } from './systems/save_payload';
import {
  processAlifePendingArrivals,
  setAlifeMobilityState,
  tickAlifeMigration,
  updateActiveAlifeDepartures,
} from './systems/alife_migration';
import {
  initPlatformBridge,
  markPlatformGameplayStart,
  markPlatformGameplayStop,
  markPlatformReady,
  togglePlatformAudioMuted,
  savePlatformRawGameSave,
} from './systems/platform_bridge';
import { addFactionRel, addFactionRelMutual, initFactionRelations } from './data/relations';
import { createRuntimeCamera, resetRuntimeCamera, runtimeCameraView, startDeathCamera, updateRuntimeCamera } from './systems/camera';
import { onHeraldKilled, onCreatorKilled, onHellArrival, tryCreateVoiceQuest, onVoidEntry } from './data/plot_events';
import { randomTip } from './data/tips';
import {
  PROCEDURAL_FLOOR_ZS,
  proceduralFloorKey,
  type FloorAnomalyId,
  type ProceduralFloorSpec,
} from './data/procedural_floors';
import { DESIGN_FLOOR_ROUTES, type DesignFloorId } from './data/design_floors';
import {
  nextTitleLanguageId,
  normalizeTitleLanguageId,
  titleLanguageDef,
  type TitleLanguageId,
} from './data/languages';
import {
  drawTitleScreen,
  hitTitleField,
  hitTitleLanguage,
  type TitleHitField,
  type TitleLanguageHit,
  type TitleScreenMode,
  type TitleSetupRowView,
} from './render/title_ui';
import { installCanvasLocalization, setCanvasTextGlitchPressure, setLocalizationLanguage } from './systems/localization';
import {
  ACTIVE_ACTOR_SOFT_LIMIT_STEP,
  MAX_ACTIVE_ACTOR_SOFT_LIMIT,
  MIN_ACTIVE_ACTOR_SOFT_LIMIT,
  normalizeActiveActorSoftLimit,
  setActiveActorSoftLimit,
} from './data/entity_limits';
import {
  characterSexCode,
  characterSexFromCode,
  clampCharacterAge,
  DEFAULT_PLAYER_AGE,
  DEFAULT_PLAYER_SEX,
  sanitizeCharacterSex,
} from './data/demographics';

/* ── Canvas setup ─────────────────────────────────────────────── */
const canvas = document.getElementById('game') as HTMLCanvasElement;
const hudCanvas = document.getElementById('hud') as HTMLCanvasElement;
const ctx = hudCanvas.getContext('2d')!;
registerPwaServiceWorker();
const PLAYER_NAME_KEY = 'gigahrush_player_name';
const PLAYER_AGE_KEY = 'gigahrush_player_age';
const PLAYER_SEX_KEY = 'gigahrush_player_sex';
const TITLE_LANGUAGE_KEY = 'gigahrush_title_language';
const TITLE_ACTIVE_ACTOR_SOFT_LIMIT_KEY = 'gigahrush_active_actor_soft_limit';
const SAVE_KEY = 'gigahrush_save';
const NET_GEN_NAME_RE = /^NET-[A-Z0-9-]{4,28}$/;
const FULL_MAP_RADIUS_DEFAULT = 200;
const FULL_MAP_RADIUS_MIN = 48;
const FULL_MAP_RADIUS_MAX = W / 2;
const FULL_MAP_ZOOM_STEP = 1.18;
type TitleInputField = Extract<TitleHitField, 'language' | 'name' | 'age' | 'sex' | 'seed' | 'actorCap' | 'addNpc' | 'start' | 'continue'>;
const NPC_INTAKE_ENABLED = Boolean((globalThis as { __GIGAHRUSH_NPC_INTAKE_ENABLED__?: boolean }).__GIGAHRUSH_NPC_INTAKE_ENABLED__);
const smokeDebug = new URLSearchParams(window.location.search).has('smoke');

function hasValidSaveGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return saveShapeVersionStatus(parsed) === 'current';
  } catch {
    return false;
  }
}

function getTitleSetupFields(): readonly TitleInputField[] {
  const fields: TitleInputField[] = [];
  if (hasValidSaveGame()) fields.push('continue');
  fields.push('start');
  if (NPC_INTAKE_ENABLED) fields.push('addNpc');
  fields.push('language', 'name', 'age', 'sex', 'seed', 'actorCap');
  return fields;
}
let started = false;
let playerNickname = loadPlayerNickname();
let playerAge = loadPlayerAge();
let playerSex = loadPlayerSex();
let titlePlayerAgeText = String(playerAge);
let titleRunSeedText = '';
let titleStartNeedsInit = true;
let titleMode: TitleScreenMode = 'setup';
let titleSetupSel = 0;
let titleInputField: TitleInputField = getTitleSetupFields()[titleSetupSel];
let titleLanguageId = loadTitleLanguageId();
let titleActiveActorSoftLimit = loadTitleActiveActorSoftLimit();
let titleLanguageHits: TitleLanguageHit[] = [];
let mobileControls: MobileControls | null = null;
let mobileContextKey = '';
let mobileCanInteractCache = false;
let mobileCanInteractProbeAt = Number.NEGATIVE_INFINITY;
type PointerCaptureGateReason = 'released';
let pointerCaptureGate = false;
let pointerCaptureGateReason: PointerCaptureGateReason = 'released';
installCanvasLocalization();
setLocalizationLanguage(titleLanguageId);
setActiveActorSoftLimit(titleActiveActorSoftLimit);

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

function loadPlayerAge(): number {
  try {
    const stored = localStorage.getItem(PLAYER_AGE_KEY);
    if (!stored) return DEFAULT_PLAYER_AGE;
    const num = Number(stored);
    if (num <= 1) return DEFAULT_PLAYER_AGE;
    return clampCharacterAge(num, DEFAULT_PLAYER_AGE);
  } catch {
    return DEFAULT_PLAYER_AGE;
  }
}

function savePlayerAge(value: unknown): number {
  const next = clampCharacterAge(value, DEFAULT_PLAYER_AGE);
  playerAge = next;
  titlePlayerAgeText = String(next);
  try {
    localStorage.setItem(PLAYER_AGE_KEY, String(next));
  } catch {
    // Local storage can be unavailable; the age still stays for this run.
  }
  return next;
}

function loadPlayerSex(): CharacterSex {
  try {
    const raw = localStorage.getItem(PLAYER_SEX_KEY);
    const asCode = raw === null ? undefined : Number(raw);
    return Number.isFinite(asCode)
      ? characterSexFromCode(asCode, DEFAULT_PLAYER_SEX)
      : sanitizeCharacterSex(raw, DEFAULT_PLAYER_SEX);
  } catch {
    return DEFAULT_PLAYER_SEX;
  }
}

function savePlayerSex(value: unknown): CharacterSex {
  const next = sanitizeCharacterSex(value, DEFAULT_PLAYER_SEX);
  playerSex = next;
  try {
    localStorage.setItem(PLAYER_SEX_KEY, String(characterSexCode(next)));
  } catch {
    // Local storage can be unavailable; the sex still stays for this run.
  }
  return next;
}

function cyclePlayerSex(): void {
  playerSex = playerSex === 'female' ? 'male' : 'female';
  showTitle();
}

function playerDisplayName(): string {
  return playerNickname || 'Жилец';
}

function cleanTitleRunSeedText(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24);
}

function hashSeedText(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash & 0x7fffffff;
}

function titleRunSeedOverride(): number | undefined {
  const clean = cleanTitleRunSeedText(titleRunSeedText);
  if (!clean) return undefined;
  if (/^[0-9]+$/.test(clean)) return normalizeFloorRunSeed(Number(clean));
  return normalizeFloorRunSeed(hashSeedText(clean));
}

function loadTitleActiveActorSoftLimit(): number {
  try {
    return normalizeActiveActorSoftLimit(localStorage.getItem(TITLE_ACTIVE_ACTOR_SOFT_LIMIT_KEY));
  } catch {
    return normalizeActiveActorSoftLimit(undefined);
  }
}

function saveTitleActiveActorSoftLimit(value: number): void {
  const previous = titleActiveActorSoftLimit;
  titleActiveActorSoftLimit = setActiveActorSoftLimit(value);
  if (titleActiveActorSoftLimit !== previous) titleStartNeedsInit = true;
  try {
    localStorage.setItem(TITLE_ACTIVE_ACTOR_SOFT_LIMIT_KEY, String(titleActiveActorSoftLimit));
  } catch {
    // Local storage can be blocked; the selected cap still applies for this run.
  }
}

function loadTitleLanguageId(): TitleLanguageId {
  try {
    return normalizeTitleLanguageId(localStorage.getItem(TITLE_LANGUAGE_KEY));
  } catch {
    return 'ru';
  }
}

function saveTitleLanguageId(id: TitleLanguageId): void {
  titleLanguageId = normalizeTitleLanguageId(id);
  setLocalizationLanguage(titleLanguageId);
  try {
    localStorage.setItem(TITLE_LANGUAGE_KEY, titleLanguageId);
  } catch {
    // Local storage can be blocked; the selected title language still works for this run.
  }
}

function cycleTitleLanguage(dir: number): void {
  saveTitleLanguageId(nextTitleLanguageId(titleLanguageId, dir));
  showTitle();
}

function adjustTitleActiveActorSoftLimit(dir: number): void {
  const step = ACTIVE_ACTOR_SOFT_LIMIT_STEP * Math.sign(dir || 1);
  saveTitleActiveActorSoftLimit(titleActiveActorSoftLimit + step);
  showTitle();
}

function setTitleSelection(field: TitleInputField): void {
  const fields = getTitleSetupFields();
  const index = fields.indexOf(field);
  if (index >= 0) titleSetupSel = index;
  titleInputField = fields[titleSetupSel] ?? 'start';
}

function moveTitleSelection(delta: number): void {
  const fields = getTitleSetupFields();
  titleSetupSel = (titleSetupSel + fields.length + delta) % fields.length;
  titleInputField = fields[titleSetupSel] ?? 'start';
  showTitle();
}

function openTitleSetupMenu(): void {
  titleMode = 'setup';
  setTitleSelection(titleInputField === 'start' ? 'start' : titleInputField);
  showTitle();
}

function openNpcIntakePage(): void {
  if (!NPC_INTAKE_ENABLED) return;
  try {
    if (document.pointerLockElement) document.exitPointerLock?.();
  } catch {
    // Pointer lock release can fail if the browser already released it.
  }
  const target = new URL('./npc-intake/', window.location.href);
  // With noopener, browsers may return null even when the tab opens.
  window.open(target.href, '_blank', 'noopener,noreferrer');
}

function editTitleFieldFromPointer(field: TitleInputField): void {
  if (field === 'start') {
    startGameFromTitle();
    return;
  }
  if (field === 'addNpc') {
    openNpcIntakePage();
    return;
  }
  if (field === 'language') {
    cycleTitleLanguage(1);
    return;
  }
  if (field === 'actorCap') {
    const lang = titleLanguageDef(titleLanguageId);
    const next = typeof window !== 'undefined' ? window.prompt(lang.setupActorCapLabel, String(titleActiveActorSoftLimit)) : null;
    if (next !== null) saveTitleActiveActorSoftLimit(Number(next));
    showTitle();
    return;
  }
  if (field === 'age') {
    const lang = titleLanguageDef(titleLanguageId);
    const next = typeof window !== 'undefined' ? window.prompt(lang.ageLabel, titlePlayerAgeText || String(DEFAULT_PLAYER_AGE)) : null;
    if (next !== null) titlePlayerAgeText = String(clampCharacterAge(Number(next), DEFAULT_PLAYER_AGE));
    showTitle();
    return;
  }
  if (field === 'sex') {
    cyclePlayerSex();
    return;
  }
  titleInputField = field;
  const lang = titleLanguageDef(titleLanguageId);
  const label = field === 'seed' ? lang.seedLabel : lang.nameLabel;
  const current = field === 'seed' ? titleRunSeedText : playerNickname;
  const next = typeof window !== 'undefined' ? window.prompt(label, current) : null;
  if (next !== null) {
    if (field === 'seed') {
      titleRunSeedText = cleanTitleRunSeedText(next);
      titleStartNeedsInit = true;
    }
    else playerNickname = cleanPlayerNickname(next).slice(0, 24);
  }
  showTitle();
}

function titleSetupRows(cursorOn: boolean): TitleSetupRowView[] {
  const lang = titleLanguageDef(titleLanguageId);
  const selected = (field: TitleInputField) => titleMode === 'setup' && titleInputField === field;
  const shownName = playerNickname || lang.namePlaceholder;
  const shownAge = titlePlayerAgeText || String(DEFAULT_PLAYER_AGE);
  const shownSex = playerSex === 'female' ? lang.sexFemaleLabel : lang.sexMaleLabel;
  const shownSeed = titleRunSeedText || lang.seedPlaceholder;
  const nameCursor = cursorOn && selected('name') ? '_' : '';
  const ageCursor = cursorOn && selected('age') ? '_' : '';
  const seedCursor = cursorOn && selected('seed') ? '_' : '';
  const rows: TitleSetupRowView[] = [];
  if (hasValidSaveGame()) {
    rows.push({ field: 'continue', label: lang.setupContinueLabel, value: lang.setupContinueValue, hint: lang.setupContinueHint, selected: selected('continue') });
  }
  rows.push(
    { field: 'start', label: lang.setupStartLabel, value: lang.setupStartValue, hint: lang.setupStartHint, selected: selected('start') }
  );
  if (NPC_INTAKE_ENABLED) {
    rows.push({
      field: 'addNpc' as const,
      label: lang.setupAddNpcLabel,
      value: lang.setupAddNpcValue,
      hint: lang.setupAddNpcHint,
      selected: selected('addNpc'),
    });
  }
  rows.push(
    { field: 'language', label: lang.setupLanguageLabel, value: titleLanguageDef(titleLanguageId).name, hint: lang.setupLanguageHint, selected: selected('language') },
    { field: 'name', label: lang.nameLabel, value: `${shownName}${nameCursor}`, hint: lang.setupNameHint, selected: selected('name') },
    { field: 'age', label: lang.ageLabel, value: `${shownAge}${ageCursor}`, hint: lang.setupAgeHint, selected: selected('age') },
    { field: 'sex', label: lang.sexLabel, value: shownSex, hint: lang.setupSexHint, selected: selected('sex') },
    { field: 'seed', label: lang.seedLabel, value: `${shownSeed}${seedCursor}`, hint: lang.setupSeedHint, selected: selected('seed') },
    {
      field: 'actorCap',
      label: lang.setupActorCapLabel,
      value: lang.actorCapValue(titleActiveActorSoftLimit, MIN_ACTIVE_ACTOR_SOFT_LIMIT, MAX_ACTIVE_ACTOR_SOFT_LIMIT),
      hint: lang.setupActorCapHint,
      selected: selected('actorCap'),
    },
  );
  return rows;
}

function playerDemographicSex(source: Partial<Entity>): CharacterSex {
  if (source.sex === 'male' || source.sex === 'female') return sanitizeCharacterSex(source.sex, playerSex);
  if (typeof source.isFemale === 'boolean') return source.isFemale ? 'female' : 'male';
  return playerSex;
}

function playerAlifeFields(source: Partial<Entity> = {}): Pick<Entity, 'persistentNpcId' | 'age' | 'sex' | 'isFemale' | 'playerRelation' | 'karma' | 'kills' | 'npcKills' | 'monsterKills'> {
  const age = clampCharacterAge(source.age, playerAge);
  const sex = playerDemographicSex(source);
  return {
    persistentNpcId: 'player',
    age,
    sex,
    isFemale: sex === 'female',
    playerRelation: PLAYER_SELF_RELATION,
    karma: clampInt(source.karma, PLAYER_START_KARMA, -128, 128),
    kills: clampInt(source.kills, 0, 0, 1_000_000),
    npcKills: clampInt(source.npcKills, 0, 0, 1_000_000),
    monsterKills: clampInt(source.monsterKills, 0, 0, 1_000_000),
  };
}

let pageHiddenPause = typeof document !== 'undefined' ? document.hidden : false;
let pageHiddenInputCleared = false;
let platformPause = false;
let platformPauseInputCleared = false;

function setPageHiddenPause(hidden: boolean): void {
  pageHiddenPause = hidden;
  pageHiddenInputCleared = false;
  setAudioSuspendedForPage(hidden);
  if (!hidden) scheduleResize();
  syncPauseState();
}

function setPlatformPause(paused: boolean): void {
  platformPause = paused;
  platformPauseInputCleared = false;
  setAudioSuspendedForPlatform(paused);
  if (!paused) scheduleResize();
  syncPauseState();
}

function desktopPointerCaptureRequired(): boolean {
  return !smokeDebug && mobileControls?.isEnabled() !== true;
}

function canvasHasPointerLock(): boolean {
  return document.pointerLockElement === canvas;
}

function setPointerCaptureCursorClass(active: boolean): void {
  document.documentElement.classList.toggle('pointer-capture-required', active);
  document.body.classList.toggle('pointer-capture-required', active);
}

function syncPointerCursorClasses(): void {
  setPointerCaptureCursorClass(pointerCaptureGate);
}

function clearPointerCaptureGateState(): boolean {
  if (!pointerCaptureGate) {
    syncPointerCursorClasses();
    return false;
  }
  pointerCaptureGate = false;
  syncPointerCursorClasses();
  updateMobileContext();
  return true;
}

function clearPointerCaptureGate(): void {
  if (!clearPointerCaptureGateState()) return;
  if (typeof state !== 'undefined') syncPauseState();
}

function pointerCaptureGateVisible(): boolean {
  return desktopPointerCaptureRequired() && pointerCaptureGate;
}

function drawPointerCaptureGateScreen(): void {
  ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  drawPointerCaptureGate(ctx, performance.now() / 1000);
  updateMobileContext(true);
}

function requirePointerCaptureGate(reason: PointerCaptureGateReason, clearInputs = true): boolean {
  if (!desktopPointerCaptureRequired()) return false;
  const wasOpen = pointerCaptureGate;
  pointerCaptureGate = true;
  pointerCaptureGateReason = reason;
  syncPointerCursorClasses();
  if (clearInputs && typeof input !== 'undefined') {
    clearControlInputs(input);
    input.mouseAttack = false;
    input.mouseUse = false;
    input.mouse.dx = 0;
    input.mouse.dy = 0;
  }
  if (typeof state !== 'undefined') {
    state.sleeping = false;
    syncPauseState();
  }
  updateMobileContext();
  if (!started) drawPointerCaptureGateScreen();
  return !wasOpen;
}

function syncPointerCaptureRequirement(): void {
  if (!desktopPointerCaptureRequired()) {
    clearPointerCaptureGate();
    return;
  }
  if (canvasHasPointerLock()) {
    clearPointerCaptureGate();
    return;
  }
}

function resize() {
  const viewport = window.visualViewport;
  const cssWidth = Math.max(1, Math.round(viewport?.width ?? window.innerWidth ?? document.documentElement.clientWidth));
  const cssHeight = Math.max(1, Math.round(viewport?.height ?? window.innerHeight ?? document.documentElement.clientHeight));
  const cssLeft = Math.round(viewport?.offsetLeft ?? 0);
  const cssTop = Math.round(viewport?.offsetTop ?? 0);
  for (const el of [canvas, hudCanvas]) {
    el.style.width = `${cssWidth}px`;
    el.style.height = `${cssHeight}px`;
    el.style.left = `${cssLeft}px`;
    el.style.top = `${cssTop}px`;
  }
  document.documentElement.style.setProperty('--app-viewport-width', `${cssWidth}px`);
  document.documentElement.style.setProperty('--app-viewport-height', `${cssHeight}px`);
  const width = cssWidth;
  const height = cssHeight;
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
window.addEventListener('pageshow', () => {
  setPageHiddenPause(document.hidden);
  scheduleResize();
});
window.addEventListener('pagehide', () => {
  setPageHiddenPause(true);
});
document.addEventListener('visibilitychange', () => {
  setPageHiddenPause(document.hidden);
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
let prevPlayerActorId = -1;
let prevPlayerActorHp = 100; // track current player actor HP changes for damage flash
let lastProjectileHitMsgTick = -999;
let runtimeCamera = createRuntimeCamera();
let pendingLoad: (() => void) | null = null; // deferred heavy generation callback
let pendingLoadDrawn = false; // true = loading screen was painted, next frame runs the callback
let platformGameplayMarkedActive = false;
let currentTip = randomTip();
let activeSkyProvider: (DynamicSkyTexture & { update(deltaSeconds: number): boolean }) | null = null;
let lastVoidReturnPortalHintTick = -9999;
let lastAttackFeedbackAt = -999;
let visualDetailCacheKey = '';
let visualDetailCacheProfile: ResolvedVisualDetailProfile = EMPTY_RESOLVED_VISUAL_DETAIL_PROFILE;
let visualSurfaceCacheKey = '';
let visualSurfaceCacheProfile: ResolvedVisualSurfaceProfile = EMPTY_RESOLVED_VISUAL_SURFACE_PROFILE;
let visualGeometryCacheKey = '';
let visualGeometryCacheProfile: ResolvedVisualGeometryProfile = EMPTY_RESOLVED_VISUAL_GEOMETRY_PROFILE;

const PLAYER_BAR_AUDIO_IDS = ['hp', 'psi', 'food', 'water', 'sleep', 'toilet', 'xp'] as const satisfies readonly HudBarAudioId[];
const PLAYER_BAR_AUDIO_THRESHOLD = 5;
const PLAYER_BAR_AUDIO_COOLDOWN = 1.25;
const PLAYER_BAR_AUDIO_SLEEP_COOLDOWN = 4.0;

initPlatformBridge({
  onPauseChange: setPlatformPause,
  onAudioMuteChange: setAudioSuspendedForPlatform,
  onLanguageDetected: (lang: string) => {
    const isRu = lang === 'ru' || lang === 'be' || lang === 'kk' || lang === 'uk' || lang === 'uz';
    const nextLang = isRu ? 'ru' : 'en';
    if (titleLanguageId !== nextLang) {
      titleLanguageId = normalizeTitleLanguageId(nextLang);
      setLocalizationLanguage(titleLanguageId);
    }
  },
});
type PlayerBarAudioValues = Record<HudBarAudioId, number>;
const playerBarAudio = {
  initialized: false,
  rpgLevel: 0,
  values: Object.fromEntries(PLAYER_BAR_AUDIO_IDS.map(id => [id, 0])) as PlayerBarAudioValues,
  accum: Object.fromEntries(PLAYER_BAR_AUDIO_IDS.map(id => [id, 0])) as PlayerBarAudioValues,
  lastAt: Object.fromEntries(PLAYER_BAR_AUDIO_IDS.map(id => [id, -999])) as PlayerBarAudioValues,
};

function playerBarAudioValues(actor = player): PlayerBarAudioValues {
  const needs = actor.needs;
  const rpg = actor.rpg;
  return {
    hp: Math.max(0, Math.min(100, ((actor.hp ?? 0) / Math.max(1, actor.maxHp ?? 100)) * 100)),
    psi: rpg ? Math.max(0, Math.min(100, (rpg.psi / Math.max(1, rpg.maxPsi)) * 100)) : 0,
    food: needs ? Math.max(0, Math.min(100, needs.food)) : 0,
    water: needs ? Math.max(0, Math.min(100, needs.water)) : 0,
    sleep: needs ? Math.max(0, Math.min(100, needs.sleep)) : 0,
    toilet: needs ? Math.max(0, Math.min(100, 100 - needs.pee)) : 0,
    xp: rpg ? Math.max(0, Math.min(100, (rpg.xp / Math.max(1, xpForLevel(rpg.level + 1))) * 100)) : 0,
  };
}

function floorThemeForRunEntry(entry: FloorRunEntry): FloorThemeProfile {
  if (entry.spec) return themeForProceduralSpec(entry.spec);
  if (entry.designFloorId) return themeForDesignFloor(entry.designFloorId);
  return themeForStoryFloor(entry.storyFloor ?? entry.baseFloor);
}

function currentVisualDetailProfile(entry: FloorRunEntry): ResolvedVisualDetailProfile {
  const runSeed = ensureFloorRunState(state).runSeed;
  const seed = entry.spec?.seed ?? runSeed;
  const key = [
    entry.z,
    entry.baseFloor,
    entry.storyFloor ?? '',
    entry.designFloorId ?? '',
    entry.spec?.key ?? '',
    seed,
  ].join('|');
  if (key !== visualDetailCacheKey) {
    visualDetailCacheKey = key;
    visualDetailCacheProfile = resolveVisualDetailProfile(floorThemeForRunEntry(entry), { seed });
  }
  return visualDetailCacheProfile;
}

function currentVisualGeometryProfile(entry: FloorRunEntry): ResolvedVisualGeometryProfile {
  const runSeed = ensureFloorRunState(state).runSeed;
  const seed = entry.spec?.seed ?? runSeed;
  const theme = floorThemeForRunEntry(entry);
  const mode = visualGeometryMode();
  const tags = visualGeometryThemeTags(theme);
  const key = `${mode}|${theme.floorKey}|${seed}|${tags.join(',')}`;
  if (key !== visualGeometryCacheKey) {
    visualGeometryCacheKey = key;
    visualGeometryCacheProfile = resolveVisualGeometryProfile(mode, theme, { seed });
  }
  return visualGeometryCacheProfile;
}

function currentVisualSurfaceProfile(entry: FloorRunEntry): ResolvedVisualSurfaceProfile {
  const runSeed = ensureFloorRunState(state).runSeed;
  const seed = entry.spec?.seed ?? runSeed;
  const theme = floorThemeForRunEntry(entry);
  const mode = visualGeometryMode();
  const key = [
    mode,
    theme.floorKey,
    theme.routeZ ?? '',
    theme.baseFloor,
    entry.designFloorId ?? '',
    entry.spec?.key ?? '',
    seed,
  ].join('|');
  if (key !== visualSurfaceCacheKey) {
    visualSurfaceCacheKey = key;
    visualSurfaceCacheProfile = resolveVisualSurfaceProfile(theme, { seed, geometryMode: mode });
  }
  return visualSurfaceCacheProfile;
}

function syncPlayerBarAudioSnapshot(): void {
  if (typeof player === 'undefined') return;
  const values = playerBarAudioValues();
  for (const id of PLAYER_BAR_AUDIO_IDS) {
    playerBarAudio.values[id] = values[id];
    playerBarAudio.accum[id] = 0;
    playerBarAudio.lastAt[id] = -999;
  }
  playerBarAudio.rpgLevel = player.rpg?.level ?? 0;
  playerBarAudio.initialized = true;
}

function syncPlayerRuntimeBaselines(): void {
  setCurrentPlayerEntity(player);
  const actor = player;
  prevPlayerActorId = actor.id;
  prevPlayerActorHp = actor.hp ?? 100;
  syncPlayerBarAudioSnapshot();
}

function makeCurrentPlayer(actor: Entity | undefined): boolean {
  if (!actor) return false;
  normalizeHumanoidBaseMoveSpeed(actor);
  if (actor.id === player.id) {
    setCurrentPlayerEntity(player);
    return false;
  }
  player = actor;
  syncPlayerRuntimeBaselines();
  return true;
}

function randomDeathContinuationNpc(random: () => number = Math.random): Entity | undefined {
  let selected: Entity | undefined;
  let seen = 0;
  for (const candidate of entities) {
    if (!candidate.alive || candidate.type !== EntityType.NPC) continue;
    if (candidate.id === player.id || isNativePlayerBodyEntity(candidate) || isPlayerEntity(candidate)) continue;
    seen++;
    if (random() * seen < 1) selected = candidate;
  }
  return selected;
}

function resetDeathContinuationWorldForHost(host: Entity): void {
  const removedQuests = resetNonStoryQuestsForNewPlayer(state, entities);
  resetAlifePlayerRelationsForNewPlayer(state, entities, host, (fromAlifeId, targetAlifeId) =>
    existingDemosRelationToNewPlayer(state, fromAlifeId, targetAlifeId)
  );
  resetDemosPlayerRelationSlotsForNewPlayer(state);
  if (removedQuests > 0) {
    state.msgs.push(msg(`Поручения прежнего тела сброшены: ${removedQuests}. Сюжетная нить сохранена.`, state.time, '#8cf'));
  }
}

function finalizeDeathContinuationHost(host: Entity): void {
  endPsiPossession(entities, player, undefined, state.time, 'reset');
  if (host.ai) {
    host.ai.combatTargetId = undefined;
    host.ai.goal = AIGoal.IDLE;
    host.ai.path = [];
    host.ai.timer = 0;
  }
  host.psiControlledBy = undefined;
  makeCurrentPlayer(host);
  resetDeathContinuationWorldForHost(host);
  resetRuntimeCamera(runtimeCamera);
  state.gameOver = false;
  state.gameWon = false;
  state.deathTimer = 0;
  state.lastDamage = undefined;
  state.dmgFlash = 0;
  state.sleeping = false;
  netDeathReported = false;
  state.msgs.push(msg(`Продолжаете путь как ${entityDisplayName(host)}.`, state.time, '#8cf'));
}

function continueDeathAsFloorNpc(): boolean {
  const host = randomDeathContinuationNpc();
  if (!host) return false;
  finalizeDeathContinuationHost(host);
  return true;
}

function continueDeathAsAlifePopulationNpc(): boolean {
  const excluded = new Set<number>();
  if (player.alifeId !== undefined) excluded.add(player.alifeId);
  const snapshot = randomAliveAlifeNpcSnapshot(state, Math.random, excluded);
  if (!snapshot) {
    state.msgs.push(msg('В A-Life не осталось живого человека для продолжения пути.', state.time, '#f84'));
    return false;
  }
  const targetEntry = floorRunEntryForFloorKey(state, snapshot.floorKey);
  if (!targetEntry) {
    state.msgs.push(msg(`Запись A-Life недостижима: ${snapshot.floorKey}.`, state.time, '#f84'));
    return false;
  }

  endPsiPossession(entities, player, undefined, state.time, 'reset');
  captureCurrentAlifeFloor();
  captureCurrentFloorMemory();
  clearPseudoliftActive(state, entities);
  const fromFloor = state.currentFloor;
  commitFloorRunEntry(state, targetEntry);
  state.currentFloor = targetEntry.baseFloor;
  if (targetEntry.baseFloor === FloorLevel.VOID) setVoidEntryFromFloor(state, fromFloor);
  else setVoidEntryFromFloor(state, undefined);
  const floorInstances = ensureFloorInstanceState(state, targetEntry.baseFloor);
  floorInstances.current = null;
  floorInstances.lastStableFloor = targetEntry.baseFloor;

  scheduleLoading(() => {
    resetNoiseRecords();
    resetGeneratedFloorPopulationState();
    const loaded = loadFloorForTarget(targetEntry.baseFloor, targetEntry);
    const gen = loaded.generation;

    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
    materializeCurrentAlifeFloor(snapshot.floorKey);

    let host = entities.find(e => e.type === EntityType.NPC && e.alifeId === snapshot.id && e.alive);
    if (!host) {
      const spawn = safeSpawnNear(snapshot.x ?? gen.spawnX, snapshot.y ?? gen.spawnY, gen.spawnX, gen.spawnY);
      host = materializeAlifeArrival(state, world, entities, nextEntityId, snapshot.id, {
        x: spawn.x,
        y: spawn.y,
        angle: snapshot.angle ?? 0,
      }, snapshot.floorKey) ?? undefined;
    }
    if (!host) {
      state.msgs.push(msg(`Не удалось материализовать нового носителя: ${snapshot.name}.`, state.time, '#f84'));
      return;
    }

    initFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    applyContractFloorHooks(state, world, entities, nextEntityId, host);
    finalizeDeathContinuationHost(host);
    state.samosborTimer = nextFloorRunSamosborCooldown(state);
    state.samosborActive = false;
    floorTeleportCd = 0;
    resetPsiState();
    clearLiftArachnaActive(state);
    ensureRoomContainers(world, state.currentFloor);
    ensureProductionRooms(state, world);
    prepareEditableFloor(undefined, false, !loaded.fromMemory);
    resetMapForLoadedFloor(loaded);
    updateMapExploration(world, player, state);
    restoreVoidReturnPortalForCurrentWorld();
    applyStoryRouteGates(world, player, state);
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
      tags: ['floor', 'floor_transition', 'death_continuation', floorRunEntryFloorKey(targetEntry)],
      data: {
        fromFloor,
        toFloor: targetEntry.baseFloor,
        floorZ: targetEntry.z,
        routeId: floorRunEntryRouteId(targetEntry),
        continuedAsAlifeId: snapshot.id,
      },
    });
    finishLoadedFloorVisuals(gen);
  });
  return true;
}

function continueDeathAsRandomNpc(): boolean {
  if (!state.gameOver || state.gameWon) return false;
  if (continueDeathAsFloorNpc()) return true;
  return continueDeathAsAlifePopulationNpc();
}

function restorePlayerBeforeWorldBoundary(): void {
  if (typeof entities === 'undefined' || typeof player === 'undefined') return;
  makeCurrentPlayer(endPsiPossession(
    entities,
    player,
    undefined,
    typeof state === 'undefined' ? 0 : state.time,
    'reset',
  ));
}

function syncPlayerActorSwitchBaseline(): Entity {
  setCurrentPlayerEntity(player);
  const actor = player;
  if (actor.id !== prevPlayerActorId) {
    prevPlayerActorId = actor.id;
    prevPlayerActorHp = actor.hp ?? 100;
    syncPlayerBarAudioSnapshot();
  }
  return actor;
}

function updatePlayerBarAudioFeedback(): void {
  if (state.paused || state.gameOver || pendingLoad) {
    syncPlayerBarAudioSnapshot();
    return;
  }
  const values = playerBarAudioValues();
  if (!playerBarAudio.initialized) {
    syncPlayerBarAudioSnapshot();
    return;
  }
  const rpgLevel = player.rpg?.level ?? 0;
  const leveledUp = rpgLevel > playerBarAudio.rpgLevel;
  playerBarAudio.rpgLevel = rpgLevel;
  let played = 0;
  for (const id of PLAYER_BAR_AUDIO_IDS) {
    const prev = playerBarAudio.values[id];
    const current = values[id];
    playerBarAudio.values[id] = current;
    const delta = current - prev;
    if (Math.abs(delta) < 0.01) continue;
    if (id === 'hp' && delta < 0) {
      playerBarAudio.accum[id] = 0;
      continue;
    }
    if (id === 'xp' && leveledUp && delta < 0) {
      playerBarAudio.accum[id] = 0;
      if (uiTime - playerBarAudio.lastAt[id] >= PLAYER_BAR_AUDIO_COOLDOWN && played < 2) {
        playHudBarChange(id, 'up', 1.0);
        playerBarAudio.lastAt[id] = uiTime;
        played++;
      }
      continue;
    }
    playerBarAudio.accum[id] += delta;
    const threshold = id === 'xp' || id === 'hp' ? 3 : PLAYER_BAR_AUDIO_THRESHOLD;
    if (Math.abs(playerBarAudio.accum[id]) < threshold) continue;
    const cooldown = id === 'sleep' && state.sleeping ? PLAYER_BAR_AUDIO_SLEEP_COOLDOWN : PLAYER_BAR_AUDIO_COOLDOWN;
    if (uiTime - playerBarAudio.lastAt[id] < cooldown) continue;
    if (played >= 2) continue;
    const direction = playerBarAudio.accum[id] > 0 ? 'up' : 'down';
    playHudBarChange(id, direction, Math.abs(playerBarAudio.accum[id]) / 10);
    playerBarAudio.lastAt[id] = uiTime;
    playerBarAudio.accum[id] = 0;
    played++;
  }
}
const PLAYER_PITCH_LIMIT = 0.62;
const ATTACK_FEEDBACK_MIN_INTERVAL = 0.18;

setWorldLogSpatialContextProvider(() => {
  if (!started || typeof state === 'undefined' || typeof world === 'undefined' || typeof player === 'undefined') return undefined;
  return {
    floor: state.currentFloor,
    playerX: player.x,
    playerY: player.y,
    audibleRadiusMeters: hearingRadiusMetersForActor(player, state.npcLogRadiusMeters),
    dist2: (ax, ay, bx, by) => world.dist2(ax, ay, bx, by),
    entityPosition: entityId => {
      const entity = getEntityIndex().byId.get(entityId) ?? entities.find(e => e.id === entityId);
      return entity ? { x: entity.x, y: entity.y } : undefined;
    },
    roomCenter: roomId => {
      const room = world.rooms[roomId];
      return room ? { x: room.x + room.w / 2, y: room.y + room.h / 2 } : undefined;
    },
    zoneCenter: zoneId => {
      const zone = world.zones[zoneId];
      return zone ? { x: zone.cx + 0.5, y: zone.cy + 0.5 } : undefined;
    },
  };
});

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


export interface SavedPlayerState {
  x: number;
  y: number;
  angle: number;
  inventory: Item[];
  needs: Needs;
  hp: number;
  maxHp: number;
  weapon: string;
  tool: string;
  rpg: RPGStats;
  statuses?: PlayerStatus[];
  money: number;
}

function captureTransitionPlayerState(player: Entity): SavedPlayerState {
  return {
    x: player.x,
    y: player.y,
    angle: player.angle,
    inventory: player.inventory ? [...player.inventory] : [],
    needs: player.needs ? { ...player.needs } : freshNeeds(),
    hp: player.hp ?? 100,
    maxHp: player.maxHp ?? 100,
    weapon: player.weapon ?? '',
    tool: player.tool ?? '',
    rpg: player.rpg ? { ...player.rpg } : freshRPG(1),
    statuses: player.statuses?.map(s => ({ ...s })),
    money: player.money ?? 100,
  };
}

function createTransitionedPlayer(
  oldPlayer: Entity,
  id: number,
  gen: FloorGeneration,
  savedState: SavedPlayerState,
  spawnOverride?: { x: number; y: number }
): Entity {
  return {
    id,
    type: EntityType.NPC,
    x: spawnOverride ? spawnOverride.x : gen.spawnX,
    y: spawnOverride ? spawnOverride.y : gen.spawnY,
    angle: savedState.angle,
    pitch: 0,
    alive: true,
    speed: HUMANOID_BASE_MOVE_SPEED,
    sprite: 0,
    needs: savedState.needs,
    hp: savedState.hp,
    maxHp: savedState.maxHp,
    inventory: savedState.inventory,
    weapon: savedState.weapon,
    tool: savedState.tool,
    money: savedState.money,
    rpg: savedState.rpg,
    statuses: savedState.statuses,
    name: playerDisplayName(),
    faction: Faction.PLAYER,
    ...playerAlifeFields(oldPlayer),
  };
}

function returnFromVoidPortalToLiving(portal: VoidReturnPortalState): void {
  restorePlayerBeforeWorldBoundary();
  portal.used = true;
  portal.usedAt = state.time;
  portal.voidSpikeCarried = hasVoidSpike();
  portal.voidSpikeResolved = voidSpikeResolved();

  const fromFloor = state.currentFloor;
  captureCurrentAlifeFloor();
  const savedState = captureTransitionPlayerState(player);
  captureCurrentFloorMemory();

  setupDebugFloorState(target, fromFloor);

  scheduleLoading(() => {
    resetGeneratedFloorPopulationState();
    const targetEntry = target.spec || target.designFloorId
      ? currentFloorRunEntry(state)
      : null;
    const loaded = loadFloorForTarget(target.floor, targetEntry);
    const gen = loaded.generation;

    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
    materializeCurrentAlifeFloor();

    player = createTransitionedPlayer(player, nextEntityId.v++, gen, savedState);
    entities.push(player);
    applyContractFloorHooks(state, world, entities, nextEntityId, player);
    syncPlayerRuntimeBaselines();

    initFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    state.samosborTimer = nextFloorRunSamosborCooldown(state);
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
    resetMapForLoadedFloor(loaded);
    updateMapExploration(world, player, state);
    ensureProceduralSpriteSeeds(entities);
    restoreVoidReturnPortalForCurrentWorld();
    applyStoryRouteGates(world, player, state);
    finishLoadedFloorVisuals(gen);
  });
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
  closeNpcInteractionInterface();
  clearTradeOffers(state);
  state.showNpcMenu = true;
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
  state.npcMenuSel = npcMenuSelectionFor(
    { state, player, npc, entities },
    npcHasImportantQuestAction(npc, state) ? 'quest' : 'talk',
  );
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

function closeCraftMenu(): void {
  state.showCraftMenu = false;
  state.craftMode = 'craft';
  state.craftCursor = 0;
  state.craftFilter = '';
  state.craftStationKind = 'lathe';
}

function closeInterfacesForCraftMenu(): void {
  clearTradeOffers(state);
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeNpcInteractionInterface();
  closeContainerMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showDemos = false;
  state.demosSearchActive = false;
  state.showLog = false;
  state.showHelp = false;
  state.showControls = false;
  state.showUiSettings = false;
  state.showMapLegend = false;
  cancelControlCapture();
  state.mapMode = 0;
  closeNetSphere();
  closeNetTerminalGen();
  closeInteractableOverlay();
  closeEmergencyPanelMenu();
  closeMapEditorAndRefreshWorld();
}

function openCraftMenu(request: ContentCraftMenuRequest): void {
  closeInterfacesForCraftMenu();
  state.showCraftMenu = true;
  state.craftMode = request.mode;
  state.craftStationKind = request.station;
  state.craftCursor = 0;
  state.craftFilter = '';
  resetMenuRepeats();
  syncPauseState();
  updateMobileContext(true);
}

function learnCraftRecipeFromInteraction(request: ContentRecipeLearnRequest): boolean {
  if (request.recipeSourceId) {
    const source = getCraftRecipeSource(request.recipeSourceId);
    if (!source) return false;
    const result = learnCraftRecipesFromSource(state, source);
    for (const recipeId of result.learned) {
      state.msgs.push(msg(craftRecipeLearnedMessage(recipeId), state.time, '#8cf'));
    }
    return result.learned.length > 0;
  }
  if (!request.recipeId) return false;
  return learnCraftRecipe(state, request.recipeId, request.sourceDefId);
}

function pushCraftActionResult(result: CraftingActionResult): void {
  const last = state.msgs.at(-1);
  if (last?.text === result.message) return;
  state.msgs.push(msg(result.message, state.time, result.ok ? '#8cf' : '#f84'));
}

function clampCraftMenuCursor(): void {
  const snapshot = craftMenuSnapshot({
    actor: player,
    state,
    mode: state.craftMode,
    stationKind: state.craftStationKind,
    filter: state.craftFilter,
  });
  const entries = craftMenuEntries(snapshot);
  state.craftCursor = entries.length === 0
    ? 0
    : Math.max(0, Math.min(entries.length - 1, Math.floor(state.craftCursor)));
}

function activateCraftSelection(): void {
  const snapshot = craftMenuSnapshot({
    actor: player,
    state,
    mode: state.craftMode,
    stationKind: state.craftStationKind,
    filter: state.craftFilter,
  });
  const entries = craftMenuEntries(snapshot);
  if (entries.length === 0) {
    state.msgs.push(msg(state.craftMode === 'craft' ? 'Известных рецептов нет.' : 'Инвентарь пуст.', state.time, '#888'));
    state.craftCursor = 0;
    return;
  }
  state.craftCursor = Math.max(0, Math.min(entries.length - 1, Math.floor(state.craftCursor)));
  const entry = entries[state.craftCursor];
  const result = entry.kind === 'recipe'
    ? craftKnownRecipe({ actor: player, state, stationKind: state.craftStationKind, recipeId: entry.id })
    : disassembleInventorySlot({ actor: player, state, stationKind: state.craftStationKind, slotIndex: entry.slotIndex });
  pushCraftActionResult(result);
  clampCraftMenuCursor();
}

function questLogEntries(): Quest[] {
  const active = state.quests.filter(q => !q.done);
  const done = state.quests.filter(q => q.done);
  return [...active, ...done];
}

function selectedQuestLogQuest(): Quest | undefined {
  const entries = questLogEntries();
  if (entries.length === 0) return undefined;
  const page = Math.max(0, Math.min(entries.length - 1, state.questPage));
  return entries[page];
}

function toggleSelectedQuestActive(): void {
  const quest = selectedQuestLogQuest();
  if (!quest || !isQuestSelectableAsActive(quest)) return;
  const wasActive = state.activeQuestId === quest.id;
  const selected = toggleActiveQuest(state, quest.id);
  if (wasActive) {
    state.msgs.push(msg('Активная цель снята.', state.time, '#888'));
  } else if (selected) {
    state.msgs.push(msg(`Активная цель: ${selected.desc}`, state.time, '#fc4'));
  }
}

/* ── Save / Load ──────────────────────────────────────────────── */

const SAVE_INVENTORY_SLOT_CAP = MAX_INVENTORY_SLOTS;
const SAVE_QUEST_CAP = 512;
const SAVE_TEXT_CAP = 192;
const MAX_SAVE_MONEY = 999_999;
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
  equipSlot: 'weapon' | 'tool',
): string {
  const defId = cleanSaveText(value, '', 64);
  if (!defId || !inventory.some(slot => slot.defId === defId)) return '';
  const def = ITEMS[defId];
  if (!def || itemEquipSlot(def) !== equipSlot) return '';
  if (equipSlot === 'weapon' && !WEAPON_STATS[defId]) return '';
  return defId;
}

function normalizeRpg(input: unknown): RPGStats {
  const src = isRecord(input) ? input : {};
  const level = clampInt(src.level, 1, 1, RPG_LEVEL_CAP);
  const rpg = freshRPG(level);
  const xpCap = level >= RPG_LEVEL_CAP ? 0 : Math.max(0, xpForLevel(level + 1) - 1);
  rpg.xp = clampInt(src.xp, 0, 0, xpCap);
  rpg.attrPoints = clampInt(src.attrPoints, 0, 0, RPG_ATTRIBUTE_CAP);
  rpg.str = clampInt(src.str, 0, 0, RPG_ATTRIBUTE_CAP);
  rpg.agi = clampInt(src.agi, 0, 0, RPG_ATTRIBUTE_CAP);
  rpg.int = clampInt(src.int, 0, 0, RPG_ATTRIBUTE_CAP);
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

function normalizeQuestTargetRoute(value: unknown): Quest['targetRoute'] | undefined {
  if (!isRecord(value)) return undefined;
  const out: NonNullable<Quest['targetRoute']> = {};
  const designFloorId = cleanSaveText(value.designFloorId, '', 64);
  if (designFloorId && DESIGN_FLOOR_ROUTES.some(route => route.id === designFloorId)) out.designFloorId = designFloorId;
  if (typeof value.z === 'number' && Number.isFinite(value.z)) out.z = clampInt(value.z, 0, -50, 50);
  const anomalyId = cleanSaveText(value.anomalyId, '', 64);
  if (anomalyId) out.anomalyId = anomalyId;
  const proceduralTag = cleanSaveText(value.proceduralTag, '', 64);
  if (proceduralTag) out.proceduralTag = proceduralTag;
  const tags = normalizeStringArray(value.tags, 8, 48);
  if (tags) out.tags = tags;
  const label = cleanSaveText(value.label, '', 96);
  if (label) out.label = label;
  if (value.risk !== undefined) out.risk = clampInt(value.risk, 1, 1, 5);
  return Object.keys(out).length > 0 ? out : undefined;
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
  const targetRoomName = cleanSaveText(raw.targetRoomName, '', 96);
  if (targetRoomName) q.targetRoomName = targetRoomName;
  const targetZoneTag = cleanSaveText(raw.targetZoneTag, '', 48);
  if (targetZoneTag) q.targetZoneTag = targetZoneTag;
  q.targetRoute = normalizeQuestTargetRoute(raw.targetRoute);
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
  if (raw.holdSeconds !== undefined) q.holdSeconds = clampInt(raw.holdSeconds, 0, 1, 3600);
  if (raw.holdProgressSeconds !== undefined) q.holdProgressSeconds = clampNumber(raw.holdProgressSeconds, 0, 0, 3600);
  if (raw.holdLastTime !== undefined) q.holdLastTime = clampNumber(raw.holdLastTime, 0, 0, 1_000_000_000);
  if (raw.holdResetOnExit !== undefined) q.holdResetOnExit = raw.holdResetOnExit === true;
  if (raw.holdSpawnMonsters !== undefined) q.holdSpawnMonsters = clampInt(raw.holdSpawnMonsters, 0, 0, 32);
  if (raw.holdSpawnIntervalSeconds !== undefined) q.holdSpawnIntervalSeconds = clampNumber(raw.holdSpawnIntervalSeconds, 1, 1, 600);
  if (raw.holdSpawnMaxAlive !== undefined) q.holdSpawnMaxAlive = clampInt(raw.holdSpawnMaxAlive, 1, 1, 64);
  if (raw.holdSpawnLastTime !== undefined) q.holdSpawnLastTime = clampNumber(raw.holdSpawnLastTime, 0, 0, 1_000_000_000);
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
    if (type === QuestType.VISIT && q.targetRoom === undefined && q.targetRoomName === undefined && q.targetRoute === undefined && q.visitFloor === undefined) return null;
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
    makeCurrentPlayer(endPsiPossession(entities, player, state.msgs, state.time, 'cancelled'));
    captureCurrentAlifeFloor();
    captureCurrentFloorMemory();
    const data = createGameSavePayload(player, state, world.containers, {
      voidReturnPortal: voidReturnPortalStateForSave(state),
      voidEntryFromFloor: (state as VoidReturnPortalHost).voidEntryFromFloor,
      floorMemory: floorMemoryStateForSave(),
    });
    const raw = JSON.stringify(data);
    const compactData = createPortalCompactSavePayload(data);
    const compactRaw = JSON.stringify(compactData);
    const rawBytes = new TextEncoder().encode(raw).length;
    const compactBytes = new TextEncoder().encode(compactRaw).length;
    localStorage.setItem(SAVE_KEY, raw);
    void savePlatformRawGameSave(raw, rawBytes, {
      raw: compactRaw,
      bytes: compactBytes,
      mode: 'compact',
    });
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
    const normalizedWeapon = normalizeEquippedItem(dataPlayer.weapon, normalizedInventory, 'weapon');
    const normalizedTool = normalizeEquippedItem(dataPlayer.tool, normalizedInventory, 'tool');

    setFloorRunState(state, savedFloorRun, savedFloor);
    const loadedFloorInstances = setFloorInstanceState(state, dataState.floorInstances as Parameters<typeof setFloorInstanceState>[1], savedFloor);
    setLiftArachnaState(state, dataState.liftArachna as Parameters<typeof setLiftArachnaState>[1]);
    setPseudoliftState(state, dataState.pseudolift as Parameters<typeof setPseudoliftState>[1]);
    setNetTerminalGenState(state, dataState.netTerminalGen as Parameters<typeof setNetTerminalGenState>[1]);
    setMapEditorPatchState(state, dataState.mapEditorPatches as Parameters<typeof setMapEditorPatchState>[1]);
    setAlifeState(state, dataState.alife);
    setAlifeMobilityState(state, dataState.alifeMobility);
    restoreDemosSocialFromSave(state, dataState.demosSocial);
    const loadedRunEntry = currentFloorRunEntry(state);
    const floor = loadedFloorInstances.current?.baseFloor ?? loadedRunEntry.baseFloor ?? savedFloor;
    const generatedRunEntry = loadedFloorInstances.current ? null : loadedRunEntry;

    state.showMenu = false;
    state.showHelp = false;
    state.showControls = false;
    state.controlView = 'keys';
    state.showUiSettings = false;
    state.showDemos = false;
    state.demosSearchActive = false;
    state.demosTab = 'profile';
    state.demosFeedScroll = 0;
    state.demosPostCursor = 0;
    cancelControlCapture();
    closeNetTerminalGen();
    closeMapEditorAndRefreshWorld();
    restoreFloorMemoryFromSave(dataState.floorMemory, {
      generationExtrasForKey: floorMemoryGenerationExtrasForKey,
    });
    scheduleLoading(() => {
      resetNoiseRecords();
      resetGeneratedFloorPopulationState();
      clearRoomMemory();
      const loaded = loadFloorForTarget(floor, generatedRunEntry);
      const gen = loaded.generation;

      world = replaceWorldFromGeneration(null, gen);
      entities = gen.entities;
      nextEntityId.v = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
      materializeCurrentAlifeFloor(generatedRunEntry ? floorRunEntryFloorKey(generatedRunEntry) : currentFloorMemoryKey());
      const spawn = safeSpawnNear(
        finiteNumber(dataPlayer.x, gen.spawnX),
        finiteNumber(dataPlayer.y, gen.spawnY),
        gen.spawnX,
        gen.spawnY,
      );

      player = {
        id: nextEntityId.v++,
        type: EntityType.NPC,
        x: spawn.x,
        y: spawn.y,
        angle: finiteNumber(dataPlayer.angle, 0),
        pitch: 0,
        alive: true,
        speed: HUMANOID_BASE_MOVE_SPEED,
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
      syncPlayerRuntimeBaselines();
      resetPsiState();

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
      setAlifeMobilityState(state, dataState.alifeMobility);
      restoreComputersFromSave(dataState.computers);
      restoreNetHackFromSave(dataState.netHack);
      state.crafting = restoreCraftingState(dataState.crafting);
      restoreDemosSocialFromSave(state, dataState.demosSocial);
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
      resetRuntimeCamera(runtimeCamera);
      state.lastDamage = undefined;
      state.showMenu = false;
      state.showHelp = false;
      state.showControls = false;
      state.controlView = 'keys';
      state.showUiSettings = false;
      state.showDemos = false;
      state.demosSearchActive = false;
      state.demosTab = 'profile';
      state.demosFeedScroll = 0;
      state.demosPostCursor = 0;
      cancelControlCapture();
      state.showContainerMenu = false;
      state.containerMenuTarget = -1;
      setVoidReturnPortalState(state, dataState.voidReturnPortal);
      setVoidEntryFromFloor(state, dataState.voidEntryFromFloor);
      if (!loaded.fromMemory) replayMapEditorForCurrentFloor();
      if (!loaded.fromMemory && Array.isArray(dataState.containers)) restoreValidContainers(world, state.currentFloor, dataState.containers);
      ensureRoomContainers(world, state.currentFloor);
      ensureProductionRooms(state, world);
      placeNetTerminalGenContentForCurrentFloor();
      resetMapForLoadedFloor(loaded);
      updateMapExploration(world, player, state);
      ensureProceduralSpriteSeeds(entities);
      restoreVoidReturnPortalForCurrentWorld();
      applyStoryRouteGates(world, player, state);

      state.msgs.push(msg('Игра загружена', state.time, '#4af'));

      // Update WebGL world data after load
      finishLoadedFloorVisuals(gen);
    });
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

  const ownerFaction = territoryFactionAt(world, player.x, player.y);
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
  const oldCell = world.cells[ci];
  if (oldCell === Cell.DOOR) world.removeDoorAt(ci);
  world.cells[ci] = Cell.FLOOR;
  if (oldCell !== Cell.FLOOR) world.markCellsDirty();
  if (!world.floorTex[ci]) {
    const room = world.roomAt(x + 0.5, y + 0.5);
    world.floorTex[ci] = room?.floorTex ?? Tex.F_CONCRETE;
    world.markFloorTexDirty();
  }
}

function addRuntimeDoorToRoom(roomId: number, doorIdx: number): void {
  const room = roomId >= 0 ? world.rooms[roomId] : undefined;
  if (room && !room.doors.includes(doorIdx)) room.doors.push(doorIdx);
}

function cleanSurfaceArea(cx: number, cy: number, radiusCells: number): number {
  return cleanWorldSurfaceArea(world, cx, cy, radiusCells);
}

function updateEquippedTool(dt: number, actor = player): void {
  if (!actor.alive) {
    _prevToolUse = input.use || input.mouseUse;
    return;
  }
  const player = actor;
  if (_toolActionCd > 0) _toolActionCd = Math.max(0, _toolActionCd - dt);
  const toolId = player.tool ?? '';
  const wantsToolUse = input.use || input.mouseUse;
  const useEdge = wantsToolUse && !_prevToolUse;
  _prevToolUse = wantsToolUse;
  if (!toolId) return;

  const hasTool = (player.inventory ?? []).some(s => s.defId === toolId);
  if (!hasTool) { player.tool = ''; return; }

  const psiToolStats = WEAPON_STATS[toolId]?.psiCost ? getWeaponStats(player, toolId) : undefined;
  if (psiToolStats) {
    if (!wantsToolUse || _toolActionCd > 0) return;
    const atkSpeedMod = player.rpg ? agiAttackSpeedMult(player.rpg) : 1;
    _toolActionCd = castPlayerPsi(toolId, psiToolStats) ? psiToolStats.speed * atkSpeedMod : 0.5;
    return;
  }

  const passiveLightDrain = passiveToolLightDrainPerSecond(toolId);
  if (passiveLightDrain > 0) {
    consumeToolDurability(player, dt * passiveLightDrain, state.msgs, state.time, state);
    return;
  }
  const activeLightDrain = activeToolLightDrainPerSecond(toolId);
  if (activeLightDrain > 0) {
    if (wantsToolUse) consumeToolDurability(player, dt * activeLightDrain, state.msgs, state.time, state);
    return;
  }

  if (toolId === UV_SPOTLIGHT_ID) {
    if (!wantsToolUse || _toolActionCd > 0) return;
    const result = useUvSpotlight(world, entities, player, state);
    if (result) {
      state.uvBeamFx = UV_SPOTLIGHT_FX_SECONDS;
      state.uvBeamLen = result.beamLen;
      playSoundAt(playEnergyImpact, player.x, player.y);
      _toolActionCd = 0.28;
    } else {
      _toolActionCd = 0.35;
    }
    return;
  }

  if (toolId === CHALK_ITEM_ID) {
    if (!wantsToolUse || _toolActionCd > 0) return;
    const def = ITEMS[CHALK_ITEM_ID];
    if (drawEquippedChalkPixel(world, player, def?.durability ?? 0)) {
      consumeToolDurability(player, 0.1, state.msgs, state.time, state);
      _toolActionCd = 0.04;
    } else {
      _toolActionCd = 0.12;
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
    if (!wantsToolUse || _toolActionCd > 0) return;
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
    updateWorldData(world);
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
    world.markCellsDirty();
    world.doors.set(ci, { idx: ci, state: DoorState.CLOSED, roomA, roomB, keyId: '', timer: 0 });
    addRuntimeDoorToRoom(roomA, ci);
    addRuntimeDoorToRoom(roomB, ci);
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
    if (world.cells[ci] === Cell.DOOR) world.removeDoorAt(ci);
    world.cells[ci] = Cell.WALL;
    world.markCellsDirty();
    const room = world.roomAt(player.x, player.y);
    world.wallTex[ci] = room?.wallTex ?? Tex.CONCRETE;
    world.markWallTexDirty();
    updateWorldData(world);
    consumeToolDurability(player, 1, state.msgs, state.time, state);
    state.msgs.push(msg('Блок стены установлен', state.time, '#6cf'));
    return;
  }

  const cleanupTool = cleanupToolProfile(toolId);
  if (cleanupTool) {
    if (!wantsToolUse || _toolActionCd > 0) return;
    const cleaned = cleanSurfaceArea(tx, ty, cleanupTool.surfaceRadius);
    const cleanedHazards = cleanCellHazardsNear(world, tx, ty, cleanupTool.hazardRadius, state, player, cleanupTool.hazardReason);
    consumeToolDurability(player, cleanupTool.wear, state.msgs, state.time, state);
    if (cleaned > 0 || cleanedHazards > 0) {
      notifyCleanupToolUse(player, world, state, tx, ty, cleaned, cleanedHazards);
      if (cleanupTool.relationEvery > 0) _cleanRelAccum += 1;
      if (cleanupTool.relationEvery > 0 && _cleanRelAccum >= cleanupTool.relationEvery) {
        _cleanRelAccum = 0;
        const owner = territoryFactionAt(world, player.x, player.y);
        if (owner !== null) {
          addFactionRelMutual(Faction.PLAYER, owner, 1);
          state.msgs.push(msg('Местные ценят вашу уборку (+отношения)', state.time, '#8f8'));
        }
      }
    }
    _toolActionCd = cleanupTool.cooldown;
    return;
  }

  if (toolId === 'vacuum') {
    if (!wantsToolUse || _toolActionCd > 0) return;
    const pcx = Math.floor(player.x);
    const pcy = Math.floor(player.y);
    let clearedFog = 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const fi = world.idx(pcx + ox, pcy + oy);
        if (world.fog[fi] <= 0) continue;
        world.fog[fi] = 0;
        clearedFog++;
      }
    }
    if (clearedFog > 0) {
      world.markFogDirty();
      consumeToolDurability(player, 1, state.msgs, state.time, state);
      state.msgs.push(msg(`Пылесос втянул туман рядом: ${clearedFog} кл.`, state.time, '#c8f'));
    } else {
      state.msgs.push(msg('Рядом нет тумана', state.time, '#888'));
    }
    _toolActionCd = 0.15;
  }
}

/* ── Menu input handling (runs regardless of pause state) ─────── */
let prevEsc = false, prevInvMenu = false, prevQuestMenu = false;
let prevMenuUp = false, prevMenuDn = false, prevMenuLeft = false, prevMenuRight = false;
let prevDrop = false;
let prevFactionMenu = false;
let prevLogMenu = false;
let prevHelpMenu = false;
let prevControlsMenu = false;
let prevUiSettingsMenu = false;
let prevMapLegendMenu = false;
let prevControlReset = false;
let prevControlClose = false;
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

function wrapMenuIndex(value: number, count: number): number {
  return ((value % count) + count) % count;
}

function syncMenuInputBaselines(): void {
  prevEsc = input.escape;
  prevMenuUp = input.invUp;
  prevMenuDn = input.invDn;
  prevMenuLeft = input.invLeft;
  prevMenuRight = input.invRight;
  prevDrop = input.drop;
  prevInvMenu = input.inv;
  prevQuestMenu = input.questLog;
  prevDebug = input.debugScreen;
  prevFactionMenu = input.factionMenu;
  prevLogMenu = input.logMenu;
  prevHelpMenu = input.help;
  prevControlsMenu = input.controls;
  prevUiSettingsMenu = input.uiSettings;
  prevMapLegendMenu = input.mapLegend;
  prevControlReset = input.controlReset;
  prevControlClose = input.controlClose;
  prevMap = input.map;
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

function toggleGameFullscreen(): void {
  const entering = !isNativeFullscreenActive();
  const pending = toggleNativeFullscreen(document.documentElement);
  if (entering && started) requestPointerLockIfDesktop();
  void pending.then(ok => {
    if (!ok && started && typeof state !== 'undefined') {
      state.msgs.push(msg('Полный экран недоступен в этом браузере или контейнере.', state.time, '#fa8'));
    }
  }).finally(scheduleResize);
}

function mobileGestureUnlock(): void {
  if (!mobileControls?.isEnabled()) return;
  tryLockLandscape();
  if (started) startAmbientDrone();
}

function clearPausedPointerGameplayInputs(): void {
  input.mouseAttack = false;
  input.mouseUse = false;
  input.mouse.dx = 0;
  input.mouse.dy = 0;
  input.touch.moveX = 0;
  input.touch.moveY = 0;
  input.touch.lookX = 0;
  input.touch.lookY = 0;
  input.touch.active = false;
}

function shouldHandleMenuPointerInput(): boolean {
  if (!started || pendingLoad || typeof state === 'undefined' || state.gameOver || pointerCaptureGateVisible()) return false;
  return state.showMenu || state.showInventory || state.showNpcMenu || state.showContainerMenu || state.showCraftMenu ||
    state.showQuests || state.showDebug || state.showFactions || state.showDemos || state.showLog || state.showHelp || state.showControls || state.showUiSettings || state.showMapLegend ||
    state.mapMode === 2 || isNetSphereOpen() || isNetTerminalGenOpen() || isInteractableOverlayOpen() || isEmergencyPanelMenuOpen() || isMapEditorOpen();
}

function shouldHandleMenuWheelInput(): boolean {
  return shouldHandleMenuPointerInput() && !isNetSphereOpen();
}

function syncPauseState(): void {
  if (typeof state === 'undefined') return;
  const wasPaused = state.paused;
  const nextPaused = pointerCaptureGateVisible() || pageHiddenPause || platformPause || state.showMenu || state.showInventory || state.showNpcMenu || state.showContainerMenu || state.showCraftMenu ||
    state.showQuests || state.showDebug || state.showFactions || state.showDemos || state.showLog || state.showHelp || state.showControls || state.showUiSettings || state.showMapLegend ||
    isNetSphereOpen() || isNetTerminalGenOpen() || isInteractableOverlayOpen() || isEmergencyPanelMenuOpen() || isMapEditorOpen();
  state.paused = nextPaused;
  if (wasPaused || nextPaused) clearPausedPointerGameplayInputs();
  syncPointerCursorClasses();
  syncPlatformGameplayState();
}

function closeMapEditorAndRefreshWorld(): void {
  const result = closeMapEditor();
  if (result.changed) updateWorldData(world);
}

function syncPlatformGameplayState(): void {
  if (typeof state === 'undefined') return;
  const active = started && !pendingLoad && !state.paused && !state.gameOver;
  if (active === platformGameplayMarkedActive) return;
  platformGameplayMarkedActive = active;
  if (active) markPlatformGameplayStart();
  else markPlatformGameplayStop();
}

function isMobileMenuOpen(): boolean {
  if (typeof state === 'undefined') return false;
  return state.showMenu || state.showInventory || state.showNpcMenu || state.showContainerMenu || state.showCraftMenu ||
    state.showQuests || state.showDebug || state.showFactions || state.showDemos || state.showLog || state.showHelp || state.showControls || state.showUiSettings || state.showMapLegend ||
    state.mapMode === 2 || isNetSphereOpen() || isNetTerminalGenOpen() || isInteractableOverlayOpen() || isEmergencyPanelMenuOpen() || isMapEditorOpen();
}

function canOpenMenuFromGameplay(): boolean {
  if (!started || pendingLoad || typeof state === 'undefined' || state.gameOver) return false;
  if (pointerCaptureGateVisible() || pageHiddenPause || platformPause || state.paused) return false;
  return !isMobileMenuOpen();
}

function menuShortcutInputActive(): boolean {
  if (typeof state === 'undefined') return false;
  return getControlCaptureAction() !== null || (state.showDemos && state.demosSearchActive) || isNetSphereChatInputActive();
}

function closeMobilePanels(includeMap = true): void {
  if (typeof state === 'undefined') return;
  clearTradeOffers(state);
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeNpcInteractionInterface();
  closeContainerMenu();
  closeCraftMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showDemos = false;
  state.demosSearchActive = false;
  state.showLog = false;
  state.showHelp = false;
  state.showControls = false;
  state.showUiSettings = false;
  state.showMapLegend = false;
  cancelControlCapture();
  if (includeMap) state.mapMode = 0;
  closeNetSphere();
  closeNetTerminalGen();
  closeInteractableOverlay();
  closeEmergencyPanelMenu();
  closeMapEditorAndRefreshWorld();
  syncPauseState();
  updateMobileContext(true);
}

function closeInterfacesForFullMap(): void {
  clearTradeOffers(state);
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeNpcInteractionInterface();
  closeContainerMenu();
  closeCraftMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showDemos = false;
  state.demosSearchActive = false;
  state.showLog = false;
  state.showHelp = false;
  state.showControls = false;
  state.showUiSettings = false;
  cancelControlCapture();
  closeNetSphere();
  closeNetTerminalGen();
  closeInteractableOverlay();
  closeEmergencyPanelMenu();
  closeMapEditorAndRefreshWorld();
}

function clampFullMapRadius(value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : FULL_MAP_RADIUS_DEFAULT;
  return Math.max(FULL_MAP_RADIUS_MIN, Math.min(FULL_MAP_RADIUS_MAX, Math.round(numeric)));
}

function currentFullMapRadius(): number {
  state.fullMapRadius = clampFullMapRadius(state.fullMapRadius);
  return state.fullMapRadius;
}

function adjustFullMapZoom(steps: number): void {
  const boundedSteps = Math.max(-4, Math.min(4, Math.trunc(steps)));
  if (boundedSteps === 0) return;
  const current = currentFullMapRadius();
  state.fullMapRadius = clampFullMapRadius(current / Math.pow(FULL_MAP_ZOOM_STEP, boundedSteps));
}

function openFullMapMenu(): void {
  if (typeof state === 'undefined') return;
  closeInterfacesForFullMap();
  state.mapMode = 2;
  currentFullMapRadius();
  resetMenuRepeats();
  syncPauseState();
  updateMobileContext(true);
}

function closeFullMapMenu(): void {
  if (typeof state === 'undefined') return;
  state.mapMode = 0;
  syncPauseState();
  updateMobileContext(true);
}

function toggleFullMapMenu(): void {
  if (state.mapMode === 2) closeFullMapMenu();
  else openFullMapMenu();
}

function openMapLegendMenu(): void {
  if (typeof state === 'undefined') return;
  closeInterfacesForFullMap();
  state.mapMode = 0;
  state.showMapLegend = true;
  state.mapLegendSel = Math.max(0, Math.min(mapLegendRowCount() - 1, state.mapLegendSel));
  keepMapLegendSelectionVisible();
  resetMenuRepeats();
  syncPauseState();
  updateMobileContext(true);
}

function closeMapLegendMenu(): void {
  if (typeof state === 'undefined') return;
  state.showMapLegend = false;
  syncPauseState();
  updateMobileContext(true);
}

function closeActiveMobileMenu(): void {
  closeMobilePanels(true);
}

function openMobileMenu(menu: MobileMenuId): void {
  if (!canOpenMenuFromGameplay()) return;
  if (menu !== 'map') closeMobilePanels(true);
  switch (menu) {
    case 'inventory':
      state.showInventory = true;
      state.invSel = 0;
      break;
    case 'map':
      toggleFullMapMenu();
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
    case 'ui':
      openUiSettingsMenu();
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
  } else if (state.showCraftMenu) {
    activateCraftSelection();
  } else if (state.showNpcMenu) {
    const npc = entities.find(e => e.id === state.npcMenuTarget);
    if (state.npcMenuTab === 'main') {
      activateNpcMainSelection(npc);
    } else if (state.npcMenuTab === 'talk' || state.npcMenuTab === 'quest') {
      state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === NPC_MENU_INTERFACE_TAB) {
      if (npc && isDurakGameOpen()) {
        const result = handleDurakInput({ state, player, npc, input: { interactEdge: true } });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isDiceGameOpen()) {
        const result = handleDiceInput({ state, player, npc, input: { interactEdge: true } });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isDominoGameOpen()) {
        const result = handleDominoInput({ state, player, npc, input: { interactEdge: true } });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isCheckersGameOpen()) {
        const result = handleCheckersInput({ state, player, npc, input: { interactEdge: true } });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else {
        closeNpcInteractionInterface(state);
      }
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
  return interactionTargetAhead() !== null;
}

function updateMobileContext(force = false): void {
  const controls = mobileControls;
  if (!controls) return;
  const mobileEnabled = controls.isEnabled();
  const menuOpen = isMobileMenuOpen();
  const gameOver = typeof state !== 'undefined' && state.gameOver;
  let canInteract = false;
  if (mobileEnabled && started && !menuOpen && !gameOver) {
    const now = typeof state !== 'undefined' ? state.time : performance.now() / 1000;
    if (force || now - mobileCanInteractProbeAt >= 0.08) {
      mobileCanInteractCache = canInteractAhead();
      mobileCanInteractProbeAt = now;
    }
    canInteract = mobileCanInteractCache;
  } else {
    mobileCanInteractCache = false;
    mobileCanInteractProbeAt = Number.NEGATIVE_INFINITY;
  }
  const key = `${mobileEnabled ? 1 : 0}|${started ? 1 : 0}|${menuOpen ? 1 : 0}|${canInteract ? 1 : 0}|${gameOver ? 1 : 0}`;
  if (!force && key === mobileContextKey) return;
  mobileContextKey = key;
  controls.updateContext({
    started,
    menuOpen,
    canInteract,
    gameOver,
  });
}

function runGameMenuSelection(sel: number): void {
  const item = GAME_MENU_ITEMS[sel];
  switch (item?.id) {
    case 'continue':
      state.showMenu = false;
      break;
    case 'new_game':
      returnToTitleScreen();
      return;
    case 'save':
      saveGame();
      state.showMenu = false;
      break;
    case 'load':
      loadGame();
      break;
    case 'sound':
      togglePlatformAudioMuted();
      break;
    case 'help':
      openHelpMenu();
      return;
    case 'demos':
      openDemosMenu();
      return;
    case 'keys':
      openControlsMenu('keys');
      break;
    case 'interface':
      openUiSettingsMenu('interface');
      break;
    case 'graphics':
      openUiSettingsMenu('graphics', 'camera_fov');
      break;
  }
  syncPauseState();
}

function openDemosMenu(): void {
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeContainerMenu();
  closeCraftMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showLog = false;
  state.showHelp = false;
  state.showControls = false;
  state.showUiSettings = false;
  state.showMapLegend = false;
  state.mapMode = 0;
  state.showDemos = true;
  state.demosCursor = findDemosCursor(state, state.demosSearch, state.demosCursor, 1);
  state.demosSearchActive = false;
  input.textInput = '';
  cancelControlCapture();
  resetMenuRepeats();
  syncPauseState();
}

const DEMOS_TABS: GameState['demosTab'][] = ['profile', 'links', 'feed', 'post', 'quests'];

function shiftDemosTab(delta: number): void {
  const current = DEMOS_TABS.indexOf(state.demosTab);
  const at = current >= 0 ? current : 0;
  state.demosTab = DEMOS_TABS[(at + delta + DEMOS_TABS.length) % DEMOS_TABS.length];
  state.demosSearchActive = false;
}

function demosSavedPostCount(): number {
  const posts = (state as GameState & { demosSocial?: { posts?: unknown[] } }).demosSocial?.posts;
  return Array.isArray(posts) ? posts.length : 0;
}

function clampDemosPanelState(): void {
  state.demosFeedScroll = Math.max(0, Math.min(Math.max(0, demosSavedPostCount() - 1), Math.floor(state.demosFeedScroll || 0)));
  state.demosPostCursor = Math.max(0, Math.min(Math.max(0, demosSavedPostCount() - 1), Math.floor(state.demosPostCursor || 0)));
}

function moveDemosPanelCursor(delta: number): void {
  if (state.demosTab === 'feed') {
    state.demosFeedScroll += delta;
    clampDemosPanelState();
    return;
  }
  if (state.demosTab === 'post') {
    state.demosPostCursor += delta;
    clampDemosPanelState();
    return;
  }
  state.demosCursor = moveDemosCursor(state, state.demosCursor, delta, state.demosSearch);
}

function closeDemosMenu(): void {
  state.showDemos = false;
  state.demosSearchActive = false;
  input.textInput = '';
  syncPauseState();
}

function openHelpMenu(): void {
  clearTradeOffers(state);
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeNpcInteractionInterface();
  closeContainerMenu();
  closeCraftMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showDemos = false;
  state.demosSearchActive = false;
  state.showLog = false;
  state.showHelp = false;
  state.showControls = false;
  state.showUiSettings = false;
  state.showMapLegend = false;
  state.mapMode = 0;
  state.showHelp = true;
  cancelControlCapture();
  resetMenuRepeats();
  syncPauseState();
  updateMobileContext(true);
}

function closeHelpMenu(): void {
  state.showHelp = false;
  syncPauseState();
  updateMobileContext(true);
}

function useInventorySelection(): void {
  const zoneId = world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
  const slot = player.inventory?.[state.invSel];
  if (slot && applyStoryItemOutcomes({
    trigger: 'use',
    item: { ...slot },
    player,
    entities,
    state,
    msgs: state.msgs,
  }) > 0) return;
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

function activateNpcTalk(npc: Entity | undefined): void {
  state.npcMenuTab = 'talk';
  if (!npc) {
    state.npcTalkText = '...';
    return;
  }

  checkTalkQuest(npc, player, world, entities, state, state.msgs);

  const baseText = generateTalkText(npc, { world, state, player, time: state.time });
  const questHint = npcQuestActionHint(npc, state);
  state.npcTalkText = questHint ? `${baseText}\n\n${questHint}` : baseText;
}

function activateNpcQuest(npc: Entity | undefined): void {
  if (!npc) return;
  checkTalkQuest(npc, player, world, entities, state, state.msgs);
  offerQuest(npc, player, world, entities, state, state.msgs, nextEntityId);
  const active = state.quests.filter(q => !q.done);
  const npcQIdx = active.findIndex(q => q.giverId === npc.id);
  if (npcQIdx >= 0) {
    state.npcMenuTab = 'quest';
    state.questPage = npcQIdx;
  }
}

function activateContainerSelection(container: WorldContainer): void {
  const idx = state.containerCursorY * INVENTORY_GRID_COLS + state.containerCursorX;
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
  if (!npc) return;
  const option = npcMenuOptionAt({ state, player, npc, entities }, state.npcMenuSel);
  if (!option) return;
  if (option.disabled) {
    if (option.disabledReason) state.msgs.push(msg(option.disabledReason, state.time, '#f84'));
    return;
  }
  switch (option.id) {
    case 'talk':
      activateNpcTalk(npc);
      break;
    case 'quest':
      activateNpcQuest(npc);
      break;
    case 'trade':
      clearTradeOffers(state);
      state.npcMenuTab = 'trade';
      state.tradeCursorX = 0;
      state.tradeCursorY = 0;
      state.tradeSide = 'npc';
      if (npc) primeTradePriceCache(state, [npc.inventory, player.inventory]);
      break;
    case 'leave':
      clearTradeOffers(state);
      closeNpcInteractionInterface(state);
      state.showNpcMenu = false;
      syncPauseState();
      break;
    default:
      activateNpcCustomMenuOption({ state, player, npc, entities }, option.id);
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
      const credit = result.credit?.creditValue ?? 0;
      const text = credit > 0
        ? `Куплено: ${def?.name ?? result.defId} (−${result.price}₽, предметами ${credit}₽)`
        : `Куплено: ${def?.name ?? result.defId} (−${result.price}₽)`;
      state.msgs.push(msg(text, state.time, '#4f4'));
    } else if (result.code === 'deal_done' && result.price !== undefined) {
      const ask = result.credit?.npcOfferCount ?? 0;
      const offer = result.credit?.creditCount ?? 0;
      const credit = result.credit?.creditValue ?? 0;
      const paid = result.price > 0 ? `, доплата ${result.price}₽` : '';
      const change = (result.credit?.changeDue ?? 0) > 0 ? `, сдача ${result.credit?.changeDue}₽` : '';
      const unpaidSurplus = Math.max(0, (result.credit?.surplus ?? 0) - (result.credit?.changeDue ?? 0));
      const surplus = unpaidSurplus > 0 ? `, без сдачи ${unpaidSurplus}₽` : '';
      state.msgs.push(msg(`Сделка: получено ${ask}, отдано ${offer}${paid}${change}${credit > 0 ? `, предметами ${credit}₽` : ''}${surplus}`, state.time, '#4f4'));
    } else if (result.code === 'sold' && result.defId && result.price !== undefined) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Продано: ${def?.name ?? result.defId} (+${result.price}₽)`, state.time, '#4f4'));
    } else if (result.code === 'offer_added' && result.defId) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Вы отдаете: ${def?.name ?? result.defId}`, state.time, '#8cf'));
    } else if (result.code === 'offer_removed' && result.defId) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Убрано из отдачи: ${def?.name ?? result.defId}`, state.time, '#888'));
    } else if (result.code === 'ask_added' && result.defId) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Вы просите: ${def?.name ?? result.defId}`, state.time, '#8cf'));
    } else if (result.code === 'ask_removed' && result.defId) {
      const def = ITEMS[result.defId];
      state.msgs.push(msg(`Убрано из запроса: ${def?.name ?? result.defId}`, state.time, '#888'));
    }
    return;
  }

  if (result.code === 'player_no_money') state.msgs.push(msg('Не хватает денег', state.time, '#f84'));
  else if (result.code === 'player_no_space') state.msgs.push(msg('Нет места в инвентаре', state.time, '#f84'));
  else if (result.code === 'npc_no_money') state.msgs.push(msg('У торговца нет денег', state.time, '#f84'));
  else if (result.code === 'npc_no_space') state.msgs.push(msg('У торговца нет места', state.time, '#f84'));
  else if (result.code === 'offer_full' || result.code === 'ask_full') state.msgs.push(msg('Корзина сделки заполнена', state.time, '#f84'));
  else if (result.code === 'no_item') state.msgs.push(msg('Пустой слот или предмет уже выбран', state.time, '#888'));
}

function activateTradeSelection(npc: Entity): void {
  const idx = state.tradeCursorY * INVENTORY_GRID_COLS + state.tradeCursorX;
  const zoneId = currentPlayerZoneId();
  const result = state.tradeSide === 'deal'
    ? executeTradeDeal(state, player, npc, { zoneId })
    : state.tradeSide === 'npc'
      ? addTradeAskFromSlot(state, npc, idx, { zoneId })
      : state.tradeSide === 'npc_offer'
        ? removeTradeAskSlot(state, npc, idx, { zoneId })
        : state.tradeSide === 'player_offer'
          ? removeTradeOfferSlot(state, npc, idx, { zoneId })
          : addTradeOfferFromSlot(state, player, npc, idx, { zoneId });
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

function controlMenuItemCount(): number {
  return state.controlView === 'buttons' ? MOBILE_BUTTON_CONTROL_ROWS.length : CONTROL_ACTIONS.length + 2;
}

function controlResetSelected(): boolean {
  return state.controlView === 'keys' && state.controlSel === 0;
}

function selectedControlAction(): typeof CONTROL_ACTIONS[number] | undefined {
  return state.controlView === 'keys' && state.controlSel > 0 && state.controlSel <= CONTROL_ACTIONS.length
    ? CONTROL_ACTIONS[state.controlSel - 1]
    : undefined;
}

function controlMouseSensitivitySelected(): boolean {
  return state.controlView === 'keys' && state.controlSel === CONTROL_ACTIONS.length + 1;
}

function keepControlSelectionVisible(): void {
  const count = controlMenuItemCount();
  const maxSel = Math.max(0, count - 1);
  state.controlSel = Math.max(0, Math.min(maxSel, state.controlSel));
  const visible = controlsVisibleRows();
  const maxScroll = Math.max(0, count - visible);
  if (state.controlSel < state.controlScroll) state.controlScroll = state.controlSel;
  if (state.controlSel >= state.controlScroll + visible) state.controlScroll = state.controlSel - visible + 1;
  state.controlScroll = Math.max(0, Math.min(maxScroll, state.controlScroll));
}

function uiSettingsVisibleRows(): number {
  const { sy } = menuScale();
  return Math.max(4, Math.floor((hudCanvas.height - 58 * sy) / Math.max(1, 12 * sy)));
}

function keepUiSettingsSelectionVisible(): void {
  const count = uiSettingsRowCount(state.uiSettingsView);
  const maxSel = Math.max(0, count - 1);
  state.uiSettingsSel = Math.max(0, Math.min(maxSel, state.uiSettingsSel));
  const visible = uiSettingsVisibleRows();
  const maxScroll = Math.max(0, count - visible);
  if (state.uiSettingsSel < state.uiSettingsScroll) state.uiSettingsScroll = state.uiSettingsSel;
  if (state.uiSettingsSel >= state.uiSettingsScroll + visible) state.uiSettingsScroll = state.uiSettingsSel - visible + 1;
  state.uiSettingsScroll = Math.max(0, Math.min(maxScroll, state.uiSettingsScroll));
}

function mapLegendVisibleRows(): number {
  const { sy } = menuScale();
  return Math.max(4, Math.floor((hudCanvas.height - 92 * sy) / Math.max(1, 13 * sy)));
}

function keepMapLegendSelectionVisible(): void {
  const count = mapLegendRowCount();
  const maxSel = Math.max(0, count - 1);
  state.mapLegendSel = Math.max(0, Math.min(maxSel, state.mapLegendSel));
  const visible = mapLegendVisibleRows();
  const maxScroll = Math.max(0, count - visible);
  if (state.mapLegendSel < state.mapLegendScroll) state.mapLegendScroll = state.mapLegendSel;
  if (state.mapLegendSel >= state.mapLegendScroll + visible) state.mapLegendScroll = state.mapLegendSel - visible + 1;
  state.mapLegendScroll = Math.max(0, Math.min(maxScroll, state.mapLegendScroll));
}

function openControlsMenu(view: GameState['controlView'] = 'keys'): void {
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeContainerMenu();
  closeCraftMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showDemos = false;
  state.demosSearchActive = false;
  state.showLog = false;
  state.showHelp = false;
  state.showUiSettings = false;
  state.showMapLegend = false;
  state.mapMode = 0;
  state.controlView = view;
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

function findUiSettingsRowByKind(kind: string, view: UiSettingsView): number {
  for (let i = 0; i < uiSettingsRowCount(view); i++) {
    if (uiSettingsRowAt(i, view)?.kind === kind) return i;
  }
  return -1;
}

function openUiSettingsMenu(view: UiSettingsView = 'interface', focusKind?: string): void {
  state.showMenu = false;
  state.showInventory = false;
  state.showQuests = false;
  state.showNpcMenu = false;
  closeContainerMenu();
  closeCraftMenu();
  state.showDebug = false;
  state.showFactions = false;
  state.showDemos = false;
  state.demosSearchActive = false;
  state.showLog = false;
  state.showHelp = false;
  state.showControls = false;
  state.mapMode = 0;
  state.showMapLegend = false;
  state.showUiSettings = true;
  state.uiSettingsView = view;
  state.uiSettingsSel = 0;
  state.uiSettingsScroll = 0;
  cancelControlCapture();
  if (focusKind) {
    const row = findUiSettingsRowByKind(focusKind, view);
    if (row >= 0) state.uiSettingsSel = row;
  }
  keepUiSettingsSelectionVisible();
  syncPauseState();
}

function closeUiSettingsMenu(): void {
  state.showUiSettings = false;
  syncPauseState();
}

function applyUiSettingsSelection(index: number): void {
  const row = uiSettingsRowAt(index, state.uiSettingsView);
  if (!row) return;
  if (row.kind === 'reset_interface') {
    resetUiSettings();
    state.msgs.push(msg('UI сброшен: Новичок', state.time, '#8cf'));
    return;
  }
  if (row.kind === 'reset_graphics') {
    resetGraphicsSettings();
    state.msgs.push(msg('Графика сброшена: FOV 90°, помехи критично, HUD меньше движения, 3D высокая', state.time, '#8cf'));
    return;
  }
  if (row.kind === 'preset') {
    if (applyUiPreset(row.preset.id)) {
      state.msgs.push(msg(`UI пресет: ${row.preset.label}`, state.time, '#8cf'));
    }
    return;
  }
  if (row.kind === 'mobile_sensitivity') {
    const sensitivity = adjustMobileLookSensitivity(1);
    state.msgs.push(msg(`Мобильный обзор: ${Math.round(sensitivity * 100)}%`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'camera_fov') {
    const fov = adjustCameraFov(1);
    state.msgs.push(msg(`FOV: ${fov}°`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'screen_interference') {
    const mode = cycleScreenInterferenceMode(1);
    const label = mode === 'off' ? 'выкл' : mode === 'full' ? 'полные' : 'слабые';
    state.msgs.push(msg(`Помехи экрана: ${label}`, state.time, mode === 'off' ? '#fc8' : '#8cf'));
    return;
  }
  if (row.kind === 'hud_motion') {
    const mode = cycleHudMotionMode();
    state.msgs.push(msg(`Движение HUD: ${mode === 'reduced' ? 'меньше' : 'норма'}`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'visual_geometry') {
    const mode = cycleVisualGeometryMode(1);
    state.msgs.push(msg(`3D детализация: ${visualGeometryModeLabel(mode).toLowerCase()}`, state.time, mode === 'off' ? '#fc8' : '#8cf'));
    return;
  }
  if (row.kind === 'lighting_quality') {
    const mode = cycleLightingQualityMode(1);
    state.msgs.push(msg(`Качество света: ${lightingQualityModeLabel(mode).toLowerCase()}`, state.time, mode === 'off' ? '#fc8' : '#8cf'));
    return;
  }
  if (row.kind === 'map_contrast') {
    const enabled = toggleMapHighContrast();
    state.msgs.push(msg(`Карта: контраст ${enabled ? 'вкл' : 'выкл'}`, state.time, enabled ? '#8cf' : '#fc8'));
    return;
  }
  if (row.kind === 'auto_pickup') {
    const enabled = toggleAutoPickup();
    state.msgs.push(msg(`Автоподбор предметов: ${enabled ? 'вкл' : 'выкл'}`, state.time, enabled ? '#8cf' : '#fc8'));
    return;
  }
  toggleUiElement(row.element.id);
}

function applyMapLegendSelection(index: number): void {
  const row = mapLegendRowAt(index);
  if (!row) return;
  if (row.kind === 'reset_map_legend') {
    resetMapLegendSettings();
    state.msgs.push(msg('Легенда карты сброшена', state.time, '#8cf'));
    return;
  }
  if (row.kind === 'map_contrast') {
    const enabled = toggleMapHighContrast();
    state.msgs.push(msg(`Карта: контраст ${enabled ? 'вкл' : 'выкл'}`, state.time, enabled ? '#8cf' : '#fc8'));
    return;
  }
  const enabled = toggleMapLegendToggle(row.toggle.id);
  state.msgs.push(msg(`Карта: ${row.toggle.label} ${enabled ? 'вкл' : 'выкл'}`, state.time, enabled ? '#8cf' : '#fc8'));
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

  if (state.mapMode === 2 && !state.showInventory && !state.showQuests && !state.showLog && !state.showFactions && !state.showDemos && !state.showMenu && !state.showHelp && !state.showControls && !state.showUiSettings && !state.showNpcMenu && !state.showContainerMenu && !state.showCraftMenu) {
    state.mapMode = 0;
    return;
  }

  if (state.showMapLegend && !state.showInventory && !state.showQuests && !state.showLog && !state.showFactions && !state.showDemos && !state.showMenu && !state.showHelp && !state.showControls && !state.showUiSettings && !state.showNpcMenu && !state.showContainerMenu && !state.showCraftMenu) {
    state.showMapLegend = false;
    return;
  }

  if (state.showHelp) {
    closeHelpMenu();
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
      if (idx >= 0 && idx < controlMenuItemCount()) {
        const wasSelected = state.controlSel === idx;
        state.controlSel = idx;
        keepControlSelectionVisible();
        if (wasSelected && controlResetSelected()) {
          resetAllControlBindings();
          state.msgs.push(msg('Клавиши сброшены по умолчанию', state.time, '#8cf'));
        } else if (wasSelected && controlMouseSensitivitySelected()) {
          const sensitivity = adjustMouseLookSensitivity(1);
          state.msgs.push(msg(`Чувствительность мыши: ${Math.round(sensitivity * 100)}%`, state.time, '#8cf'));
        }
      }
    }
  } else if (state.showUiSettings) {
    const { sy } = menuScale();
    const top = 34 * sy;
    const rowH = 12 * sy;
    const visible = uiSettingsVisibleRows();
    const relRow = Math.floor((y - top) / rowH);
    if (y > h - 22 * sy) {
      closeUiSettingsMenu();
      return;
    }
    if (relRow >= 0 && relRow < visible) {
      const idx = state.uiSettingsScroll + relRow;
      if (idx >= 0 && idx < uiSettingsRowCount(state.uiSettingsView)) {
        state.uiSettingsSel = idx;
        keepUiSettingsSelectionVisible();
        applyUiSettingsSelection(idx);
      }
    }
  } else if (state.showMenu) {
    const menuStep = 16 * sy;
    const menuPanelH = Math.min(h - 16 * sy, Math.max(160 * sy, 80 * sy + GAME_MENU_ITEMS.length * menuStep));
    const menuTop = (h - menuPanelH) / 2;
    for (let i = 0; i < GAME_MENU_ITEMS.length; i++) {
      const yy = menuTop + 52 * sy + i * menuStep;
      if (pointInRect(x, y, w / 2 - 90 * sx, yy - 6 * sy, 180 * sx, 16 * sy)) {
        state.menuSel = i;
        runGameMenuSelection(i);
        return;
      }
    }
  } else if (state.showInventory) {
    const layout = fullscreenInventoryLayout(w, h, baseSx, baseSy);
    const GRID = layout.grid.cols;
    const cellSz = layout.grid.cell;
    const gridX = layout.grid.x;
    const gridY = layout.grid.y;
    if (pointInRect(x, y, layout.close.x, layout.close.y, layout.close.w, layout.close.h)) {
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
    if (pointInRect(x, y, layout.use.x, layout.use.y, layout.use.w, layout.use.h)) {
      useInventorySelection();
      return;
    }
    if (pointInRect(x, y, layout.drop.x, layout.drop.y, layout.drop.w, layout.drop.h)) {
      dropInventorySelection();
      return;
    }
    if (player.rpg && player.rpg.attrPoints > 0 && pointInRect(x, y, layout.attr.x, layout.attr.y, layout.attr.w, layout.attr.h)) {
      const rel = (x - layout.attr.x) / Math.max(1, layout.attr.w);
      spendMobileAttr(rel < 0.34 ? 'str' : rel < 0.67 ? 'agi' : 'int');
      return;
    }
  } else if (state.showCraftMenu) {
    const layout = craftMenuLayout(w, h);
    if (pointInRect(x, y, layout.close.x, layout.close.y, layout.close.w, layout.close.h)
      || pointInRect(x, y, layout.bottom.x, layout.bottom.y, layout.bottom.w, layout.bottom.h)) {
      closeCraftMenu();
      syncPauseState();
      updateMobileContext(true);
      return;
    }
    const snapshot = craftMenuSnapshot({
      actor: player,
      state,
      mode: state.craftMode,
      stationKind: state.craftStationKind,
      filter: state.craftFilter,
    });
    const entries = craftMenuEntries(snapshot);
    const visibleRows = Math.max(1, Math.floor((layout.list.h - 20 * layout.scale) / layout.rowH));
    const cursor = entries.length === 0 ? 0 : Math.max(0, Math.min(entries.length - 1, state.craftCursor));
    const first = Math.max(0, Math.min(Math.max(0, entries.length - visibleRows), cursor - Math.floor(visibleRows * 0.5)));
    const listTop = layout.list.y + 16 * layout.scale;
    for (let row = 0; row < visibleRows; row++) {
      const index = first + row;
      if (index >= entries.length) break;
      const rowY = listTop + row * layout.rowH - 3 * layout.scale;
      if (pointInRect(x, y, layout.list.x, rowY, layout.list.w, layout.rowH)) {
        const wasSelected = state.craftCursor === index;
        state.craftCursor = index;
        if (wasSelected) activateCraftSelection();
        return;
      }
    }
    if (entries.length > 0 && pointInRect(x, y, layout.detail.x, layout.detail.y, layout.detail.w, layout.detail.h)) {
      activateCraftSelection();
      return;
    }
  } else if (state.showQuests) {
    const pw = Math.min(400 * sx, w - 24 * sx);
    const ph = Math.min(320 * sy, h - 24 * sy);
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;
    const total = questLogEntries().length;
    if (pointInRect(x, y, px, py + ph - 22 * sy, pw, 22 * sy)) {
      state.showQuests = false;
      syncPauseState();
      return;
    }
    if (pointInRect(x, y, px, py + ph - 44 * sy, pw, 22 * sy)) {
      toggleSelectedQuestActive();
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
  } else if (state.showDemos) {
    if (y > h - 28 * sy) {
      closeDemosMenu();
      updateMobileContext(true);
      return;
    }
    state.demosSearchActive = false;
    shiftDemosTab(x < w / 2 ? -1 : 1);
    clampDemosPanelState();
  } else if (state.showFactions) {
    state.showFactions = false;
    syncPauseState();
  } else if (state.showContainerMenu) {
    const container = world.containerById.get(state.containerMenuTarget);
    if (!container) {
      closeContainerMenu();
      return;
    }
    const layout = containerMenuGridLayout(w, h);
    const cellSz = layout.cell;
    const startX = layout.startX;
    const startY = layout.startY;
    const containerX = layout.containerX;
    for (const side of ['player', 'container'] as const) {
      const gx = side === 'player' ? startX : containerX;
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.cols; col++) {
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
    if (pointInRect(x, y, layout.close.x, layout.close.y, layout.close.w, layout.close.h)) {
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
      const options = getNpcMenuOptions({ state, player, npc, entities });
      clampNpcMenuSelection(state, options);
      for (let i = 0; i < options.length; i++) {
        const yy = py + 42 * sy + i * 17 * sy;
        if (pointInRect(x, y, px + 8 * sx, yy - 6 * sy, 220 * sx, 16 * sy)) {
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
      const layout = tradeMenuGridLayout(w, h);
      const cellSz = layout.cell;
      for (const panel of [
        { side: 'player', x: layout.startX },
        { side: 'player_offer', x: layout.playerOfferX },
        { side: 'npc_offer', x: layout.npcOfferX },
        { side: 'npc', x: layout.npcX },
      ] as const) {
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.cols; col++) {
            if (pointInRect(x, y, panel.x + col * cellSz, layout.startY + row * cellSz, cellSz, cellSz)) {
              state.tradeSide = panel.side;
              state.tradeCursorX = col;
              state.tradeCursorY = row;
              activateTradeSelection(npc);
              return;
            }
          }
        }
      }
      if (pointInRect(x, y, layout.dealX, layout.dealY, layout.dealW, layout.dealH + 10 * layout.scale)) {
        state.tradeSide = 'deal';
        state.tradeCursorX = 0;
        state.tradeCursorY = 0;
        activateTradeSelection(npc);
        return;
      }
      if (y > h - 32 * sy) {
        clearTradeOffers(state);
        state.npcMenuTab = 'main';
      }
    } else if (state.npcMenuTab === 'quest') {
      const total = state.quests.filter(q => !q.done).length;
      if (y > h - 40 * sy) {
        state.npcMenuTab = 'main';
      } else if (total > 1) {
        state.questPage = x < w / 2
          ? Math.max(0, state.questPage - 1)
          : Math.min(total - 1, state.questPage + 1);
      }
    } else if (state.npcMenuTab === NPC_MENU_INTERFACE_TAB) {
      const pw = Math.min(440 * sx, w - 24 * sx);
      const ph = Math.min(320 * sy, h - 24 * sy);
      const px = (w - pw) / 2;
      const py = (h - ph) / 2;
      if (pointInRect(x, y, px, py + ph - 22 * sy, pw, 22 * sy)) {
        if (isDurakGameOpen()) {
          const result = handleDurakInput({ state, player, npc, input: { escEdge: true } });
          if (result.closeInterface) closeNpcInteractionInterface(state);
        } else if (isDiceGameOpen()) {
          const result = handleDiceInput({ state, player, npc, input: { escEdge: true } });
          if (result.closeInterface) closeNpcInteractionInterface(state);
        } else if (isDominoGameOpen()) {
          const result = handleDominoInput({ state, player, npc, input: { escEdge: true } });
          if (result.closeInterface) closeNpcInteractionInterface(state);
        } else if (isCheckersGameOpen()) {
          const result = handleCheckersInput({ state, player, npc, input: { escEdge: true } });
          if (result.closeInterface) closeNpcInteractionInterface(state);
        } else {
          closeNpcInteractionInterface(state);
        }
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
    const rect = hudCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (hudCanvas.width / Math.max(1, rect.width));
    const y = (e.clientY - rect.top) * (hudCanvas.height / Math.max(1, rect.height));
    const language = hitTitleLanguage(titleLanguageHits, x, y);
    if (language) {
      saveTitleLanguageId(language);
      showTitle();
      return;
    }
    const titleField = hitTitleField(titleLanguageHits, x, y);
    if (titleMode === 'language') {
      if (titleField === 'start' || !titleField) openTitleSetupMenu();
      return;
    }
    if (titleField) {
      setTitleSelection(titleField);
      editTitleFieldFromPointer(titleField);
    }
    return;
  }
  if (pendingLoad) return;
  const rect = hudCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (hudCanvas.width / Math.max(1, rect.width));
  const y = (e.clientY - rect.top) * (hudCanvas.height / Math.max(1, rect.height));
  handleMobileHudTap(x, y);
}

hudCanvas.addEventListener('pointerup', handleHudPointerUp);

let suppressNextTitleClick = false;

function handleTitleCanvasPointerUp(e: PointerEvent): void {
  if (started || mobileControls?.isEnabled()) return;
  if (pointerCaptureGateVisible()) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (hudCanvas.width / Math.max(1, rect.width));
  const y = (e.clientY - rect.top) * (hudCanvas.height / Math.max(1, rect.height));
  const language = hitTitleLanguage(titleLanguageHits, x, y);
  if (language) {
    saveTitleLanguageId(language);
    showTitle();
  } else {
    const titleField = hitTitleField(titleLanguageHits, x, y);
    if (titleMode === 'language') {
      if (titleField === 'start' || !titleField) openTitleSetupMenu();
      else return;
    } else if (titleField) {
      setTitleSelection(titleField);
      editTitleFieldFromPointer(titleField);
    }
    else return;
  }
  suppressNextTitleClick = true;
  e.preventDefault();
  e.stopPropagation();
}

canvas.addEventListener('pointerup', handleTitleCanvasPointerUp);
canvas.addEventListener('click', e => {
  if (!suppressNextTitleClick) return;
  suppressNextTitleClick = false;
  e.preventDefault();
  e.stopImmediatePropagation();
}, true);

function handleMenuInput(): void {
  // ── On death: lock out all menus / inventory / interactions ──
  // Only the restart prompt (checkRestart) responds to input.
  if (state.gameOver) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    closeCraftMenu();
    state.showFactions = false;
    state.showDemos = false;
    state.demosSearchActive = false;
    state.showLog = false;
    state.showHelp = false;
    state.showControls = false;
    state.showUiSettings = false;
    state.showMapLegend = false;
    cancelControlCapture();
    closeNetSphere();
    closeNetTerminalGen();
    closeInteractableOverlay();
    closeEmergencyPanelMenu();
    closeMapEditorAndRefreshWorld();
    resetMenuRepeats();
    // Keep edge-detection prev states in sync so first frame after
    // respawn doesn't fire a stale edge.
    syncMenuInputBaselines();
    input.menuAccept = false;
    input.menuClose = false;
    input.menuWheel = 0;
    input.textInput = '';
    return;
  }

  if (pointerCaptureGateVisible()) {
    input.menuAccept = false;
    input.menuClose = false;
    input.menuWheel = 0;
    input.textInput = '';
    resetMenuRepeats();
    syncMenuInputBaselines();
    syncPauseState();
    return;
  }

  const pointerAcceptEdge = input.menuAccept;
  const pointerCloseEdge = input.menuClose;
  const pointerWheel = input.menuWheel;
  input.menuAccept = false;
  input.menuClose = false;
  input.menuWheel = 0;
  const wheelUpEdge = pointerWheel < 0;
  const wheelDnEdge = pointerWheel > 0;
  const acceptEdge = (input.escape && !prevEsc) || pointerAcceptEdge;
  const closeEdge = (input.controlClose && !prevControlClose) || pointerCloseEdge;
  const resetEdge = input.controlReset && !prevControlReset;
  const upEdge = input.invUp && !prevMenuUp;
  const dnEdge = input.invDn && !prevMenuDn;
  const leftEdge = input.invLeft && !prevMenuLeft;
  const rightEdge = input.invRight && !prevMenuRight;
  const dropEdge = input.drop && !prevDrop;
  const invEdge = input.inv && !prevInvMenu;
  const questEdge = input.questLog && !prevQuestMenu;
  const factionEdge = input.factionMenu && !prevFactionMenu;
  const logEdge = input.logMenu && !prevLogMenu;
  const helpEdge = input.help && !prevHelpMenu;
  const controlsEdge = input.controls && !prevControlsMenu;
  const uiSettingsEdge = input.uiSettings && !prevUiSettingsMenu;
  const dbgEdge = input.debugScreen && !prevDebug;
  const menuUpNav = () => menuRepeatStep('up', input.invUp, upEdge) || wheelUpEdge;
  const menuDownNav = () => menuRepeatStep('down', input.invDn, dnEdge) || wheelDnEdge;

  if (state.showDemos) {
    if (input.textInput) {
      const nextSearch = applyDemosSearchText(state.demosSearch, input.textInput);
      input.textInput = '';
      if (nextSearch !== state.demosSearch) {
        state.demosSearch = nextSearch;
      }
    }
    if (closeEdge) {
      closeDemosMenu();
    } else if (acceptEdge) {
      state.demosSearch = cleanDemosSearchQuery(state.demosSearch);
      if (state.demosSearchActive) {
        state.demosCursor = findDemosCursor(state, state.demosSearch, state.demosCursor, 1);
        state.demosSearchActive = false;
      } else {
        state.demosSearchActive = true;
      }
      input.textInput = '';
    } else if (!state.demosSearchActive) {
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
      if (leftNav) {
        shiftDemosTab(-1);
        clampDemosPanelState();
      }
      if (rightNav) {
        shiftDemosTab(1);
        clampDemosPanelState();
      }
      if (upNav) moveDemosPanelCursor(-1);
      if (dnNav) moveDemosPanelCursor(1);
    }

    syncMenuInputBaselines();
    syncPauseState();
    return;
  }

  const canOpenShortcutMenu = canOpenMenuFromGameplay();
  const shortcutInputActive = menuShortcutInputActive();
  const globalMapEdge = input.map && !prevMap;
  const globalMapLegendEdge = input.mapLegend && !prevMapLegendMenu;
  if (globalMapLegendEdge) {
    if (state.showMapLegend && !shortcutInputActive) {
      closeMapLegendMenu();
      syncMenuInputBaselines();
      return;
    }
    if (canOpenShortcutMenu) {
      openMapLegendMenu();
      syncMenuInputBaselines();
      return;
    }
  }
  if (globalMapEdge) {
    if (state.mapMode === 2 && !shortcutInputActive) {
      closeFullMapMenu();
      syncMenuInputBaselines();
      return;
    }
    if (canOpenShortcutMenu) {
      openFullMapMenu();
      syncMenuInputBaselines();
      return;
    }
  }

  if (isMapEditorOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    closeCraftMenu();
    state.showFactions = false;
    state.showDemos = false;
    state.demosSearchActive = false;
    state.showLog = false;
    state.showHelp = false;
    state.showDebug = false;
    state.showControls = false;
    state.showUiSettings = false;
    cancelControlCapture();
    closeNetSphere();
    state.paused = true;

    const leftEdge = input.invLeft && !prevMenuLeft;
    const rightEdge = (input.invRight && !prevMenuRight) || (input.drop && !prevDrop);
    const mapMode = isMapEditorMapMode();
    const wheelZoom = mapMode ? Math.max(-4, Math.min(4, -pointerWheel)) : 0;
    const upNav = mapMode ? menuRepeatStep('up', input.invUp, upEdge) : menuUpNav();
    const dnNav = mapMode ? menuRepeatStep('down', input.invDn, dnEdge) : menuDownNav();
    const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge);

    const closeEditor = () => {
      closeMapEditorAndRefreshWorld();
      closeNetTerminalGen();
      syncPauseState();
    };

    if (closeEdge) {
      const action = backMapEditorMode();
      if (action === 'close') closeEditor();
    } else {
      if (upNav) moveMapEditorMode(world, 0, -1);
      if (dnNav) moveMapEditorMode(world, 0, 1);
      if (leftNav) moveMapEditorMode(world, -1, 0);
      if (rightNav) moveMapEditorMode(world, 1, 0);
      if (wheelZoom !== 0) adjustMapEditorZoom(wheelZoom);
      if (acceptEdge) {
        const action = activateMapEditorMode();
        if (action === 'apply') {
          applyCurrentMapEditorBrush(world, entities, player, state, nextEntityId);
        } else if (action === 'close') {
          closeEditor();
        }
      }
    }

    syncMenuInputBaselines();
    return;
  }

  if (isInteractableOverlayOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    closeCraftMenu();
    state.showFactions = false;
    state.showDemos = false;
    state.demosSearchActive = false;
    state.showLog = false;
    state.showHelp = false;
    state.showDebug = false;
    state.showControls = false;
    state.showUiSettings = false;
    cancelControlCapture();
    closeNetSphere();
    state.paused = true;

    const leftEdge = input.invLeft && !prevMenuLeft;
    const rightEdge = (input.invRight && !prevMenuRight) || (input.drop && !prevDrop);
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge);
    const result = handleInteractableOverlayInput({
      escEdge: closeEdge,
      interactEdge: acceptEdge,
      upNav,
      dnNav,
      leftNav,
      rightNav,
    }, { world, state, player, switchFloor });
    if (result.worldChanged) updateWorldData(world);
    if (!isInteractableOverlayOpen()) syncPauseState();

    syncMenuInputBaselines();
    return;
  }

  if (isEmergencyPanelMenuOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    closeCraftMenu();
    state.showFactions = false;
    state.showDemos = false;
    state.demosSearchActive = false;
    state.showLog = false;
    state.showHelp = false;
    state.showDebug = false;
    state.showControls = false;
    state.showUiSettings = false;
    cancelControlCapture();
    closeNetSphere();
    state.paused = true;

    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    const result = handleEmergencyPanelMenuInput({
      up: upNav,
      down: dnNav,
      confirm: acceptEdge,
      close: closeEdge,
    }, world, player, entities, state, nextEntityId);
    if (result.worldChanged) updateWorldData(world);
    if (!isEmergencyPanelMenuOpen()) syncPauseState();

    syncMenuInputBaselines();
    return;
  }

  if (isNetSphereOpen()) {
    state.showMenu = false;
    state.showInventory = false;
    state.showQuests = false;
    state.showNpcMenu = false;
    closeContainerMenu();
    closeCraftMenu();
    state.showFactions = false;
    state.showDemos = false;
    state.demosSearchActive = false;
    state.showLog = false;
    state.showHelp = false;
    state.showDebug = false;
    state.showControls = false;
    state.showUiSettings = false;
    cancelControlCapture();
    state.paused = true;
    if (pointerCloseEdge || (closeEdge && !isNetSphereChatInputActive())) {
      closeNetSphere();
      syncPauseState();
      updateMobileContext(true);
    }
    resetMenuRepeats();
    syncMenuInputBaselines();
    return;
  }

  const anyRepeatMenuOpen = state.showMenu || state.showInventory || state.showQuests ||
    state.showContainerMenu || state.showCraftMenu || state.showNpcMenu || state.showDebug || state.showFactions || state.showDemos || state.showLog || state.showHelp || state.showControls || state.showUiSettings || state.showMapLegend;
  if (!anyRepeatMenuOpen) resetMenuRepeats();

  const helpOpenedThisFrame = helpEdge && canOpenShortcutMenu;
  const controlsOpenedThisFrame = controlsEdge && canOpenShortcutMenu && !helpOpenedThisFrame;
  const uiSettingsOpenedThisFrame = uiSettingsEdge && canOpenShortcutMenu && !helpOpenedThisFrame && !controlsOpenedThisFrame;
  if (helpOpenedThisFrame) openHelpMenu();
  if (controlsOpenedThisFrame) openControlsMenu();
  if (uiSettingsOpenedThisFrame) openUiSettingsMenu();

  const finishSameShortcutClose = (): void => {
    resetMenuRepeats();
    syncMenuInputBaselines();
    syncPauseState();
    updateMobileContext(true);
  };

  if (!shortcutInputActive) {
    if (state.showHelp && helpEdge && !helpOpenedThisFrame) {
      closeHelpMenu();
      finishSameShortcutClose();
      return;
    }
    if (state.showControls && controlsEdge && !controlsOpenedThisFrame) {
      closeControlsMenu();
      finishSameShortcutClose();
      return;
    }
    if (state.showUiSettings && uiSettingsEdge && !uiSettingsOpenedThisFrame) {
      closeUiSettingsMenu();
      finishSameShortcutClose();
      return;
    }
    if (state.showInventory && invEdge) {
      state.showInventory = false;
      finishSameShortcutClose();
      return;
    }
    if (state.showQuests && questEdge) {
      state.showQuests = false;
      finishSameShortcutClose();
      return;
    }
    if (state.showDebug && dbgEdge) {
      state.showDebug = false;
      finishSameShortcutClose();
      return;
    }
    if (state.showFactions && factionEdge) {
      state.showFactions = false;
      finishSameShortcutClose();
      return;
    }
    if (state.showLog && logEdge) {
      state.showLog = false;
      finishSameShortcutClose();
      return;
    }
  }

  // ── One-page HELP poster ─────────────────────────────────
  if (state.showHelp) {
    if ((acceptEdge && !helpOpenedThisFrame) || closeEdge) closeHelpMenu();
    syncMenuInputBaselines();
    syncPauseState();
    return;
  }

  // ── Hotkey / rebind screen ───────────────────────────────
  if (state.showControls) {
    if (!getControlCaptureAction()) {
      const effectiveAcceptEdge = !controlsOpenedThisFrame && acceptEdge;
      const fixedControlsCommand = effectiveAcceptEdge || closeEdge || resetEdge;
      const upNav = !fixedControlsCommand && menuUpNav();
      const dnNav = !fixedControlsCommand && menuDownNav();
      if (upNav) state.controlSel = Math.max(0, state.controlSel - 1);
      if (dnNav) state.controlSel = Math.min(controlMenuItemCount() - 1, state.controlSel + 1);
      keepControlSelectionVisible();
      const mouseSensitivitySelected = controlMouseSensitivitySelected();
      const leftNav = !fixedControlsCommand && mouseSensitivitySelected ? menuRepeatStep('left', input.invLeft, leftEdge) : false;
      const rightNav = !fixedControlsCommand && mouseSensitivitySelected ? menuRepeatStep('right', input.invRight, rightEdge) : false;
      if (resetEdge && state.controlView === 'keys') {
        const action = selectedControlAction();
        if (action && clearControlBinding(action.id)) {
          state.msgs.push(msg(`Клавиши очищены: ${action.label}`, state.time, '#8cf'));
        }
      } else if (mouseSensitivitySelected && (leftNav || rightNav || effectiveAcceptEdge)) {
        const sensitivity = adjustMouseLookSensitivity(leftNav ? -1 : 1);
        state.msgs.push(msg(`Чувствительность мыши: ${Math.round(sensitivity * 100)}%`, state.time, '#8cf'));
      } else if (effectiveAcceptEdge && controlResetSelected()) {
        resetAllControlBindings();
        state.msgs.push(msg('Клавиши сброшены по умолчанию', state.time, '#8cf'));
      } else if (effectiveAcceptEdge && state.controlView === 'keys') {
        const action = selectedControlAction();
        if (action) {
          beginControlCapture(action.id);
        }
      }
    }
    if (closeEdge && !controlsOpenedThisFrame) closeControlsMenu();

    syncMenuInputBaselines();
    syncPauseState();
    return;
  }

  // ── Full-map legend/settings screen ─────────────────────
  if (state.showMapLegend) {
    const fixedLegendCommand = acceptEdge || closeEdge;
    const upNav = !fixedLegendCommand && menuUpNav();
    const dnNav = !fixedLegendCommand && menuDownNav();
    if (upNav) state.mapLegendSel = Math.max(0, state.mapLegendSel - 1);
    if (dnNav) state.mapLegendSel = Math.min(mapLegendRowCount() - 1, state.mapLegendSel + 1);
    keepMapLegendSelectionVisible();
    if (acceptEdge) applyMapLegendSelection(state.mapLegendSel);
    if (closeEdge) closeMapLegendMenu();

    syncMenuInputBaselines();
    syncPauseState();
    return;
  }

  // ── Configurable HUD element screen ─────────────────────
  if (state.showUiSettings) {
    const fixedUiCommand = acceptEdge || closeEdge;
    const upNav = !fixedUiCommand && menuUpNav();
    const dnNav = !fixedUiCommand && menuDownNav();
    if (upNav) state.uiSettingsSel = Math.max(0, state.uiSettingsSel - 1);
    if (dnNav) state.uiSettingsSel = Math.min(uiSettingsRowCount(state.uiSettingsView) - 1, state.uiSettingsSel + 1);
    keepUiSettingsSelectionVisible();
    if (acceptEdge) {
      applyUiSettingsSelection(state.uiSettingsSel);
    }
    if (closeEdge) closeUiSettingsMenu();

    syncMenuInputBaselines();
    syncPauseState();
    return;
  }

  // ── Enter accepts menu rows; Backspace/Delete closes them ─────
  let gameMenuOpenedThisFrame = false;
  if (closeEdge) {
    if (state.showNpcMenu) {
      const npc = entities.find(e => e.id === state.npcMenuTarget);
      if (npc && isDurakGameOpen()) handleDurakInput({ state, player, npc, input: { escEdge: true } });
      else if (npc && isDiceGameOpen()) handleDiceInput({ state, player, npc, input: { escEdge: true } });
      else if (npc && isDominoGameOpen()) handleDominoInput({ state, player, npc, input: { escEdge: true } });
      else if (npc && isCheckersGameOpen()) handleCheckersInput({ state, player, npc, input: { escEdge: true } });
      clearTradeOffers(state);
      closeNpcInteractionInterface();
      state.showNpcMenu = false;
    }
    else if (state.showContainerMenu) { closeContainerMenu(); }
    else if (state.showCraftMenu) { closeCraftMenu(); syncPauseState(); updateMobileContext(true); }
    else if (state.showInventory) { state.showInventory = false; }
    else if (state.showQuests) { state.showQuests = false; }
    else if (state.showDebug) { state.showDebug = false; }
    else if (state.showFactions) { state.showFactions = false; }
    else if (state.showDemos) { closeDemosMenu(); }
    else if (state.showLog) { state.showLog = false; }
    else if (state.showHelp) { closeHelpMenu(); }
    else if (state.showUiSettings) { state.showUiSettings = false; }
    else if (state.mapMode === 2) { closeFullMapMenu(); }
    else if (state.showMenu) { state.showMenu = false; }
  } else if (acceptEdge && canOpenShortcutMenu) {
    state.showMenu = true;
    state.menuSel = 0;
    gameMenuOpenedThisFrame = true;
  }

  // ── Game menu navigation ─────────────────────────────────
  if (state.showMenu) {
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    if (upNav) state.menuSel = Math.max(0, state.menuSel - 1);
    if (dnNav) state.menuSel = Math.min(GAME_MENU_ITEMS.length - 1, state.menuSel + 1);
    if (acceptEdge && !gameMenuOpenedThisFrame) {
      runGameMenuSelection(state.menuSel);
    }
  }
  // ── Inventory toggle + navigation ────────────────────────
  else if (state.showInventory) {
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
    if (upNav) state.invSel = wrapMenuIndex(state.invSel - INVENTORY_GRID_COLS, MAX_INVENTORY_SLOTS);
    if (dnNav) state.invSel = wrapMenuIndex(state.invSel + INVENTORY_GRID_COLS, MAX_INVENTORY_SLOTS);
    if (leftNav) state.invSel = wrapMenuIndex(state.invSel - 1, MAX_INVENTORY_SLOTS);
    if (rightNav) state.invSel = wrapMenuIndex(state.invSel + 1, MAX_INVENTORY_SLOTS);
    if (acceptEdge) useInventorySelection();
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
  // ── Craft / disassembly menu navigation ──────────────────
  else if (state.showCraftMenu) {
    if (closeEdge) {
      closeCraftMenu();
      syncPauseState();
      updateMobileContext(true);
    } else {
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const snapshot = craftMenuSnapshot({
        actor: player,
        state,
        mode: state.craftMode,
        stationKind: state.craftStationKind,
        filter: state.craftFilter,
      });
      const count = craftMenuEntries(snapshot).length;
      if (upNav) state.craftCursor = Math.max(0, state.craftCursor - 1);
      if (dnNav) state.craftCursor = Math.min(Math.max(0, count - 1), state.craftCursor + 1);
      if (count === 0) state.craftCursor = 0;
      if (acceptEdge) {
        activateCraftSelection();
      }
    }
  }
  // ── Quest log toggle ─────────────────────────────────────
  else if (state.showQuests) {
    const totalQ = questLogEntries().length;
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    if (upNav) state.questPage = Math.max(0, state.questPage - 1);
    if (dnNav) state.questPage = Math.min(Math.max(0, totalQ - 1), state.questPage + 1);
    if (acceptEdge) {
      toggleSelectedQuestActive();
    }
  }
  // ── Container menu navigation ────────────────────────────
  else if (state.showContainerMenu) {
    const container = world.containerById.get(state.containerMenuTarget);
    if (!container) {
      closeContainerMenu();
    } else {
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
      if (upNav) state.containerCursorY = Math.max(0, state.containerCursorY - 1);
      if (dnNav) state.containerCursorY = Math.min(INVENTORY_GRID_ROWS - 1, state.containerCursorY + 1);
      if (leftNav) {
        if (state.containerCursorX > 0) {
          state.containerCursorX--;
        } else if (state.containerSide === 'container') {
          state.containerSide = 'player';
          state.containerCursorX = INVENTORY_GRID_COLS - 1;
        }
      }
      if (rightNav) {
        if (state.containerCursorX < INVENTORY_GRID_COLS - 1) {
          state.containerCursorX++;
        } else if (state.containerSide === 'player') {
          state.containerSide = 'container';
          state.containerCursorX = 0;
        }
      }
      if (acceptEdge) {
        const idx = state.containerCursorY * INVENTORY_GRID_COLS + state.containerCursorX;
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
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const options = npc ? getNpcMenuOptions({ state, player, npc, entities }) : [];
      clampNpcMenuSelection(state, options);
      if (upNav) state.npcMenuSel = Math.max(0, state.npcMenuSel - 1);
      if (dnNav) state.npcMenuSel = Math.min(Math.max(0, options.length - 1), state.npcMenuSel + 1);
      if (acceptEdge) activateNpcMainSelection(npc);
    } else if (state.npcMenuTab === 'talk') {
      if (acceptEdge || closeEdge) state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'quest') {
      const totalQ = state.quests.filter(q => !q.done).length;
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
      if (upNav || leftNav) state.questPage = Math.max(0, state.questPage - 1);
      if (dnNav || rightNav) state.questPage = Math.min(Math.max(0, totalQ - 1), state.questPage + 1);
      if (acceptEdge || closeEdge) state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'trade') {
      if (npc) {
        const upNav = menuUpNav();
        const dnNav = menuDownNav();
        const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', input.invRight || input.drop, rightEdge || dropEdge);
        const panels = ['player', 'player_offer', 'npc_offer', 'npc'] as const;
        if (state.tradeSide === 'deal') {
          if (upNav) {
            state.tradeSide = 'player_offer';
            state.tradeCursorX = INVENTORY_GRID_COLS - 1;
            state.tradeCursorY = INVENTORY_GRID_ROWS - 1;
          }
          if (leftNav) state.tradeSide = 'player_offer';
          if (rightNav) state.tradeSide = 'npc_offer';
          state.tradeCursorX = Math.max(0, Math.min(INVENTORY_GRID_COLS - 1, state.tradeCursorX));
          state.tradeCursorY = Math.max(0, Math.min(INVENTORY_GRID_ROWS - 1, state.tradeCursorY));
        } else {
          let panelIndex = panels.indexOf(state.tradeSide as typeof panels[number]);
          if (panelIndex < 0) panelIndex = 3;
          if (upNav) state.tradeCursorY = Math.max(0, state.tradeCursorY - 1);
          if (dnNav) {
            if (state.tradeCursorY >= INVENTORY_GRID_ROWS - 1) {
              state.tradeSide = 'deal';
              state.tradeCursorX = 0;
              state.tradeCursorY = 0;
            } else {
              state.tradeCursorY++;
            }
          }
          if (state.tradeSide !== 'deal' && leftNav) {
            if (state.tradeCursorX > 0) {
              state.tradeCursorX--;
            } else if (panelIndex > 0) {
              state.tradeSide = panels[panelIndex - 1];
              state.tradeCursorX = INVENTORY_GRID_COLS - 1;
            }
          }
          if (state.tradeSide !== 'deal' && rightNav) {
            if (state.tradeCursorX < INVENTORY_GRID_COLS - 1) {
              state.tradeCursorX++;
            } else if (panelIndex < panels.length - 1) {
              state.tradeSide = panels[panelIndex + 1];
              state.tradeCursorX = 0;
            }
          }
          if (state.tradeSide !== 'deal') {
            state.tradeCursorX = Math.max(0, Math.min(INVENTORY_GRID_COLS - 1, state.tradeCursorX));
            state.tradeCursorY = Math.max(0, Math.min(INVENTORY_GRID_ROWS - 1, state.tradeCursorY));
          }
        }
        // Enter stages inventory items, removes basket items, or commits the centered deal.
        if (acceptEdge) {
          activateTradeSelection(npc);
        }
      }
      if (closeEdge) {
        clearTradeOffers(state);
        state.npcMenuTab = 'main';
      }
    } else if (state.npcMenuTab === NPC_MENU_INTERFACE_TAB) {
      if (npc && isDurakGameOpen()) {
        const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
        const result = handleDurakInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isDiceGameOpen()) {
        const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
        const result = handleDiceInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isDominoGameOpen()) {
        const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
        const result = handleDominoInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isCheckersGameOpen()) {
        const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
        const upNav = menuUpNav();
        const downNav = menuDownNav();
        const result = handleCheckersInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, upNav, downNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (acceptEdge || closeEdge) {
        closeNpcInteractionInterface(state);
      }
    }
  }
  // ── Debug menu navigation ────────────────────────────────
  else if (state.showDebug) {
    if (closeEdge) { state.showDebug = false; }
    else {
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const leftNav = menuRepeatStep('left', input.invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', input.invRight, rightEdge);
      if (upNav) state.debugSel = Math.max(0, state.debugSel - 1);
      if (dnNav) state.debugSel = Math.min(DEBUG_COMMAND_COUNT - 1, state.debugSel + 1);
      if (leftNav) moveDebugInfoPage(-1);
      if (rightNav) moveDebugInfoPage(1);
      if (acceptEdge) {
        const action = execDebugCommand(state.debugSel, world, player, entities, state, nextEntityId);
        if (action) handleDebugCommandAction(action);
      }
    }
  }
  // ── Faction relations menu ───────────────────────────────
  else if (state.showFactions) {
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    if (upNav) state.factionRankScroll = Math.max(0, state.factionRankScroll - 3);
    if (dnNav) state.factionRankScroll = Math.min(99, state.factionRankScroll + 3);
  }
  // ── Message log menu ─────────────────────────────────────
  else if (state.showLog) {
    const maxScroll = Math.max(0, state.msgLog.length * 3); // generous; draw clamps
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    if (upNav) state.logScroll = Math.min(maxScroll, state.logScroll + 3);
    if (dnNav) state.logScroll = Math.max(0, state.logScroll - 3);
  }
  // ── Full map menu ───────────────────────────────────────
  else if (state.mapMode === 2) {
    const wheelZoom = Math.max(-4, Math.min(4, -pointerWheel));
    if (wheelZoom !== 0) adjustFullMapZoom(wheelZoom);
    // Backspace/Delete closes the full map; other menu hotkeys wait for the map to close.
  }
  // ── Normal gameplay toggles ──────────────────────────────
  else {
    if (canOpenShortcutMenu) {
      if (dbgEdge) { state.showDebug = true; state.debugSel = 0; resetDebugInfoPage(); }
      if (invEdge) { state.showInventory = true; state.invSel = 0; }
      if (questEdge) { state.showQuests = true; }
      if (factionEdge) { state.showFactions = true; state.factionRankScroll = 0; }
      if (logEdge) { state.showLog = true; state.logScroll = 0; }
      if (helpEdge) { openHelpMenu(); }
    }
  }

  syncMenuInputBaselines();

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
let needsRealTickAccum = 0;
let bloodTrailAccum = 0;
let deadCleanupAccum = 0;
let entityIndexFrame = 0;
let fpsWindowStart = lastTime;
let fpsFrameCount = 0;
let frameMsWindowSum = 0;
let frameMsWindowMax = 0;
let displayedFps = 0;
let displayedFrameMsAvg = 0;
let displayedFrameMsMax = 0;
let lastSimUpdateMs = 0;
let lastNeedsUpdateMs = 0;
let lastContentHookMs = 0;
let lastAiUpdateMs = 0;
let lastHazardUpdateMs = 0;
let lastSamosborUpdateMs = 0;
let lastFactionUpdateMs = 0;
let lastBloodUpdateMs = 0;
let lastCleanupUpdateMs = 0;
let lastRenderSceneMs = 0;
let lastHudDrawMs = 0;

function updateFpsMeter(now: number, frameMs: number): number {
  const elapsed = now - fpsWindowStart;
  if (elapsed > 2000) {
    fpsWindowStart = now;
    fpsFrameCount = 0;
    frameMsWindowSum = 0;
    frameMsWindowMax = 0;
    return displayedFps;
  }
  fpsFrameCount++;
  frameMsWindowSum += frameMs;
  frameMsWindowMax = Math.max(frameMsWindowMax, frameMs);
  if (elapsed >= 500) {
    displayedFps = Math.max(0, Math.round(fpsFrameCount * 1000 / elapsed));
    displayedFrameMsAvg = frameMsWindowSum / Math.max(1, fpsFrameCount);
    displayedFrameMsMax = frameMsWindowMax;
    fpsWindowStart = now;
    fpsFrameCount = 0;
    frameMsWindowSum = 0;
    frameMsWindowMax = 0;
  }
  return displayedFps;
}

function hudPerfDebugSnapshot(fps: number): HudPerfDebugSnapshot {
  const ai = getAiStats();
  const entityStats = getEntityIndex().getDebugStats();
  const renderStats = getRenderSceneDebugStats();
  return {
    fps,
    frameMsAvg: displayedFrameMsAvg,
    frameMsMax: displayedFrameMsMax,
    simMs: lastSimUpdateMs,
    needsMs: lastNeedsUpdateMs,
    contentMs: lastContentHookMs,
    aiMs: lastAiUpdateMs,
    hazardMs: lastHazardUpdateMs,
    samosborMs: lastSamosborUpdateMs,
    factionMs: lastFactionUpdateMs,
    bloodMs: lastBloodUpdateMs,
    cleanupMs: lastCleanupUpdateMs,
    renderMs: lastRenderSceneMs,
    hudMs: lastHudDrawMs,
    liveAi: entityStats.aiCount,
    visibleSprites: renderStats.visibleSprites,
    drawnSprites: renderStats.drawnSprites,
    visibleEntityQueryResults: renderStats.visibleEntityQueryResults,
    aiUpdated: ai.updated,
    aiSkipped: ai.skipped,
  };
}

function cleanupDeadEntities(dt: number): number {
  deadCleanupAccum += dt;
  if (deadCleanupAccum < 0.5) return 0;
  deadCleanupAccum = 0;
  let removed = 0;
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (!e.alive && !isNativePlayerBodyEntity(e)) {
      if (e.type === EntityType.NPC) recordAlifeNpcDeath(state, e);
      entities.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

function clearPagePauseInputsOnce(): void {
  if (pageHiddenInputCleared) return;
  clearExternalPauseInputs();
  pageHiddenInputCleared = true;
}

function clearPlatformPauseInputsOnce(): void {
  if (platformPauseInputCleared) return;
  clearExternalPauseInputs();
  platformPauseInputCleared = true;
}

function clearExternalPauseInputs(): void {
  clearControlInputs(input);
  mobileControls?.resetInput();
  input.mouseAttack = false;
  input.mouseUse = false;
  input.mouse.dx = 0;
  input.mouse.dy = 0;
  input.touch.moveX = 0;
  input.touch.moveY = 0;
  input.touch.lookX = 0;
  input.touch.lookY = 0;
  input.touch.active = false;
}

function clearExternalPauseInputsOnce(): void {
  if (pageHiddenPause) clearPagePauseInputsOnce();
  if (platformPause) clearPlatformPauseInputsOnce();
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
    if (pageHiddenPause || platformPause) {
      clearExternalPauseInputsOnce();
      if (typeof state !== 'undefined') {
        state.sleeping = false;
        syncPauseState();
      }
      lastTime = now;
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

  // ── Gamepad / universal input frame ───────────────────────
  // Polled before the title-screen early return so the title menu and
  // pause/inventory menus alike see fresh per-frame intent. Keyboard and
  // mouse stay the default; the resolver only writes when the adapter
  // reports actual input. `writeMenuEdgesFromActions` is gated on
  // `started` so the title bridge owns its own accept/close mapping.
  beginInputFrame(inputFrame);
  gamepadAdapter.poll(inputFrame);
  resolveInputFrameToInputState(inputFrame, input, {
    writeMenuEdgesFromActions: started,
  });

  if (!started) {
    handleTitleGamepadInput(inputFrame);
    showTitle();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (pageHiddenPause || platformPause) {
    clearExternalPauseInputsOnce();
    state.sleeping = false;
    syncPauseState();
    lastTime = now;
    requestAnimationFrame(gameLoop);
    return;
  }

  syncPointerCaptureRequirement();

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
  if (!started) {
    requestAnimationFrame(gameLoop);
    return;
  }
  // If menu triggered new game / load, bail out to show loading screen
  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

  if (!state.paused) {
    entityIndexFrame = (entityIndexFrame + 1) & 0x3fffffff;
  }

  // ── Update ───────────────────────────────────────────────
  // Decay damage flash
  if (state.dmgFlash > 0) state.dmgFlash = Math.max(0, state.dmgFlash - dt * 1.2);
  // Decay beam visual
  if (state.beamFx > 0) state.beamFx = Math.max(0, state.beamFx - dt * 2.5);
  if (state.uvBeamFx > 0) state.uvBeamFx = Math.max(0, state.uvBeamFx - dt);

  // Runtime camera modes are visual-only; player death is the rolling-head mode.
  if (state.gameOver && runtimeCamera.mode === 'death') {
    state.deathTimer += dt;
    updateRuntimeCamera(runtimeCamera, world, dt);
  }

  if (!state.paused && !state.gameOver) {
    const simStart = performance.now();
    lastNeedsUpdateMs = 0;
    lastContentHookMs = 0;
    lastHazardUpdateMs = 0;
    lastSamosborUpdateMs = 0;
    lastFactionUpdateMs = 0;
    lastBloodUpdateMs = 0;
    lastCleanupUpdateMs = 0;
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
    rebuildEntityIndexForSimulation(entities, entityIndexFrame).beginTelemetryFrame();
    playerActions(dt);
    syncPlayerActorSwitchBaseline();
    // If switchFloor was triggered, pendingLoad is set — skip the rest of this frame
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    updateLiftArachnaEncounter(world, entities, player, state, dt, nextEntityId);
    updatePseudolifts(world, entities, player, state);
    updateEquippedTool(dt, player);
    // Player urination (P key)
    if (input.pee && player.alive && player.needs && player.needs.pee > 5) {
      const traced = stampUrineTrace(world, player, {
        seed: Math.floor(state.time * 1000),
        pressure: player.needs.pee / 100,
        streamLength: 1.65,
        streamSteps: player.needs.pee > 60 ? 26 : 20,
        width: 0.055,
        dropCount: 1,
      });
      if (traced) {
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
    needsRealTickAccum += frameDt;
    if (needsTickAccum >= 0.25) {
      const needsDt = needsTickAccum;
      const needsRealDt = needsRealTickAccum;
      needsTickAccum = 0;
      needsRealTickAccum = 0;
      const needsStart = performance.now();
      updateNeeds(entities, needsDt, state.time, state.msgs, player.id, nextEntityId, state, world, needsDt > 0 ? needsRealDt / needsDt : 1);
      lastNeedsUpdateMs += performance.now() - needsStart;
    }
    let contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'pre_ai', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    const listener = player;
    setListenerPos(listener.x, listener.y, world);
    updateRouteCues(world, listener, state);
    updateMapExploration(world, listener, state);
    const aiStart = performance.now();
    updateAI(world, entities, dt, state.time, state.msgs, listener.id, state.clock, state.samosborActive, nextEntityId, state.currentFloor, state);
    lastAiUpdateMs = performance.now() - aiStart;
    updateRailTrains(world, entities, player, state, dt);
    contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'post_ai', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    updateCarnivorousFungus(world, entities, player, state, dt, nextEntityId);
    const hazardStart = performance.now();
    tickCellHazards(world, entities, state, dt, player, input.fwd || input.back || input.strafeL || input.strafeR || input.touch.moveX !== 0 || input.touch.moveY !== 0);
    lastHazardUpdateMs = performance.now() - hazardStart;
    updateBlockCrushDamage(world, entities, state, dt);
    updateProceduralAnomalies(world, player, state, dt);
    const samosborStart = performance.now();
    const samosborRebuild = updateSamosbor(world, entities, state, dt, nextEntityId, currentLocalSamosborPatchGeneration, scheduleLocalSamosborPatch);
    lastSamosborUpdateMs = performance.now() - samosborStart;
    if (samosborRebuild) {
      closeCraftMenu();
      reportNetSphereProgressEvents();
      scheduleLoading(() => {
        restorePlayerBeforeWorldBoundary();
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state, entities);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentFloor, replacement);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentFloor);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        resetMapExploration(world);
        updateMapExploration(world, player, state);
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        restoreVoidReturnPortalForCurrentWorld();
        applyStoryRouteGates(world, player, state);
        finishLoadedFloorVisuals(replacement);
      });
      requestAnimationFrame(gameLoop);
      return;
    }
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    syncMapExplorationAfterSamosborWave(world, state);
    // Faction cell capture
    const factionStart = performance.now();
    updateFactionCapture(world, entities, dt, state);
    updateFactionActivity(world, entities, player, state, nextEntityId, dt, currentFloorAllowsNpcPopulation());
    lastFactionUpdateMs = performance.now() - factionStart;
    contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'floor_activity', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    const activeAlifeFloorKey = currentFloorMemoryKey();
    tickAlifeMigration(state, dt, { activeFloorKey: activeAlifeFloorKey });
    const alifeArrivals = processAlifePendingArrivals(state, world, entities, nextEntityId, { activeFloorKey: activeAlifeFloorKey });
    const alifeDepartures = updateActiveAlifeDepartures(state, world, entities, dt);
    if (alifeArrivals > 0 || alifeDepartures > 0) {
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    if (updateKillQuestPressure(world, entities, state, state.msgs, nextEntityId)) {
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    // PSI does NOT auto-regenerate — only restored via items (pills, antidepressant)
    // Update ongoing PSI spell effects (phase shift, madness, control)
    makeCurrentPlayer(updatePsiEffects(entities, dt, player, state.msgs, state.time).player);
    updateSeroburmalineExposure(world, player, state, dt);

    // Blood trails from wounded entities + particle physics
    bloodTrailAccum += dt;
    const bloodStart = performance.now();
    if (bloodTrailAccum >= 0.3) {
      const bloodDt = bloodTrailAccum;
      bloodTrailAccum = 0;
      updateBloodTrails(world, entities, bloodDt);
    }
    updateParticles(world, dt);
    updateDangerField(world, dt);
    lastBloodUpdateMs = performance.now() - bloodStart;

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
      checkQuests(player, world, entities, state, state.msgs, nextEntityId);
      if (updateScriptedArrivals(world, entities, player, state, nextEntityId)) {
        rebuildEntityIndexAfterSpawnCleanup(entities);
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
    if (autoPickupEnabled() && state.tick % 15 === 0) {
      pickupNearby(world, entities, player, state.msgs, state.time, state, (drop: Entity, pickedItems: readonly Item[] = []) => {
        claimNetTerminalGenFleshDrop(state, drop, player, world);
        recordFactionEventLootTaken(state, world, player, drop);
        applyPickedStoryItemOutcomes(pickedItems, player, entities, state, state.msgs);
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
    const damageActor = syncPlayerActorSwitchBaseline();
    let curHp = damageActor.hp ?? 100;
    if (curHp < prevPlayerActorHp) {
      absorbPsiShieldDamage(damageActor, prevPlayerActorHp, state.msgs, state.time);
      curHp = damageActor.hp ?? curHp;
    }
    if (curHp < prevPlayerActorHp) {
      const lost = prevPlayerActorHp - curHp;
      const maxHp = damageActor.maxHp ?? 100;
      state.dmgFlash = Math.min(1, 0.3 + (lost / maxHp) * 1.5);
      state.dmgSeed = Math.random() * 10000;
      recordUnattributedPlayerDamage(lost);
      playFleshHit();
    }
    prevPlayerActorId = damageActor.id;
    prevPlayerActorHp = curHp;
    updatePlayerBarAudioFeedback();

    // Check player death
    const deathActor = player;
    if (!deathActor.alive && !state.gameOver) {
      handlePlayerDeath(deathActor);
    } else if (!player.alive && !state.gameOver) {
      handlePlayerDeath(player);
    }
    reportNetSphereProgressEvents();

    const cleanupStart = performance.now();
    const removedDead = cleanupDeadEntities(dt);
    lastCleanupUpdateMs = performance.now() - cleanupStart;
    if (removedDead > 0) {
      // Exception to the one planned rebuild: splice cleanup changes the flat array after spawns/deaths.
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }

    // Sync new messages to persistent log, then trim
    syncMsgLog();
    while (state.msgs.length > 50) state.msgs.shift();
    _prevMsgCount = state.msgs.length;
    lastSimUpdateMs = performance.now() - simStart;
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
    needsRealTickAccum += frameDt;
    if (needsTickAccum >= 0.25) {
      const needsDt = needsTickAccum;
      const needsRealDt = needsRealTickAccum;
      needsTickAccum = 0;
      needsRealTickAccum = 0;
      updateNeeds(entities, needsDt, state.time, state.msgs, player.id, nextEntityId, state, world, needsDt > 0 ? needsRealDt / needsDt : 1);
    }
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'pre_ai', gameOver: true })) updateWorldData(world);
    const listener = player;
    setListenerPos(listener.x, listener.y, world);
    updateMapExploration(world, listener, state);
    updatePseudolifts(world, entities, player, state);
    const aiStart = performance.now();
    updateAI(world, entities, dt, state.time, state.msgs, listener.id, state.clock, state.samosborActive, nextEntityId, state.currentFloor, state);
    lastAiUpdateMs = performance.now() - aiStart;
    tickCellHazards(world, entities, state, dt, player, false);
    if (updateSamosbor(world, entities, state, dt, nextEntityId, currentLocalSamosborPatchGeneration, scheduleLocalSamosborPatch)) {
      closeCraftMenu();
      reportNetSphereProgressEvents();
      scheduleLoading(() => {
        restorePlayerBeforeWorldBoundary();
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state, entities);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentFloor, replacement);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentFloor);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        resetMapExploration(world);
        updateMapExploration(world, player, state);
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        finishLoadedFloorVisuals(replacement);
      });
      requestAnimationFrame(gameLoop);
      return;
    }
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    syncMapExplorationAfterSamosborWave(world, state);
    updateFactionCapture(world, entities, dt, state);
    updateFactionActivity(world, entities, player, state, nextEntityId, dt, currentFloorAllowsNpcPopulation());
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'floor_activity', gameOver: true })) updateWorldData(world);
    bloodTrailAccum += dt;
    if (bloodTrailAccum >= 0.3) {
      const bloodDt = bloodTrailAccum;
      bloodTrailAccum = 0;
      updateBloodTrails(world, entities, bloodDt);
    }
    updateParticles(world, dt);
    updateDangerField(world, dt);
    if (cleanupDeadEntities(dt) > 0) {
      // Exception to the one planned rebuild: splice cleanup changes the flat array after spawns/deaths.
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    syncMsgLog();
    while (state.msgs.length > 50) state.msgs.shift();
    _prevMsgCount = state.msgs.length;
  }

  if (!state.gameOver) updateRuntimeCamera(runtimeCamera, world, dt, player);
  checkRestart();
  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
  updateMobileContext();
  const currentFps = updateFpsMeter(now, rawDt * 1000);

  // ── Render ───────────────────────────────────────────────
  // Fog density varies by floor level
  let baseFog = 0.065;
  if (state.currentFloor === FloorLevel.MAINTENANCE) baseFog = 0.08;
  if (state.currentFloor === FloorLevel.HELL) baseFog = 0.05; // less fog, more horror visibility
  const smogFogBonus = !state.gameOver ? proceduralSmogFogDensityBonus(world, player, state) : 0;
  const samosborVariant = state.samosborActive ? getActiveSamosborVariant() : null;
  const samosborVisual = samosborVariant?.visual;
  const samosborGlitchPulse = 0.85 + ((Math.sin(uiTime * 5) + 1) * 0.5) * 0.15;
  const fogDensity = baseFog + smogFogBonus + (state.samosborActive ? (samosborVisual?.fogDensityBonus ?? 0.02) : 0);
  const interferenceMode = screenInterferenceMode();
  const neuroScreenFx = uiElementEnabled('screen_fx');
  const criticalInterference = state.samosborActive || state.gameOver;
  const screenInterference = interferenceMode === 'off' || !neuroScreenFx
    ? 0
    : interferenceMode === 'full'
      ? 1
      : criticalInterference
        ? 0.65
        : 0.32;
  const glitch = screenInterference <= 0
    ? 0
    : state.samosborActive
      ? (samosborVisual?.glitchIntensity ?? 0.06) * samosborGlitchPulse
      : interferenceMode === 'full'
        ? Math.min(0.18, smogFogBonus * 4)
        : 0;

  const renderActor = player;
  const cameraView = runtimeCameraView(runtimeCamera, renderActor, cameraFovRadians());
  const camX = cameraView.x;
  const camY = cameraView.y;
  const passiveFlashlight = state.gameOver
    ? 0
    : passiveToolLightRenderIntensity(renderActor.tool, getEquippedToolDurability(renderActor));
  const activeToolLight = state.gameOver || !(input.use || input.mouseUse)
    ? 0
    : activeToolLightRenderIntensity(renderActor.tool, getEquippedToolDurability(renderActor));
  const flashlight = state.gameOver
    ? 0
    : Math.max(passiveFlashlight, activeToolLight);
  const toolBeam = state.gameOver ? 0 : uvSpotlightRenderIntensity(state.uvBeamFx);

  // Update dynamic world data (fog, door states, wallTex for slides)
  updateGeneratedDynamicSky(dt);
  updateDynamicData(world, camX, camY);

  // WebGL raycaster + sprites
  const floorRunEntry = currentFloorRunEntry(state);
  const ambientLight = designFloorAmbientLight(floorRunEntry.designFloorId, 0.12);
  const visualDetailProfile = currentVisualDetailProfile(floorRunEntry);
  const visualGeometryProfile = currentVisualGeometryProfile(floorRunEntry);
  const visualSurfaceProfile = currentVisualSurfaceProfile(floorRunEntry);
  const renderSceneStart = performance.now();
  renderSceneGL(world, textures, sprites, entities,
    cameraView,
    fogDensity, glitch, flashlight, uiTime, particles, state.samosborActive, ambientLight, toolBeam, state.uvBeamLen, screenInterference, visualDetailProfile, visualGeometryProfile, visualSurfaceProfile, lightingQualityIndex());
  lastRenderSceneMs = performance.now() - renderSceneStart;

  // Draw HUD on 2D overlay canvas
  const textGlitchHp = typeof renderActor.hp === 'number' ? renderActor.hp : 100;
  const textGlitchMaxHp = typeof renderActor.maxHp === 'number' && renderActor.maxHp > 0 ? renderActor.maxHp : 100;
  setCanvasTextGlitchPressure({
    healthRatio: textGlitchHp / textGlitchMaxHp,
    samosborActive: state.samosborActive,
  });
  ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  const hudDrawStart = performance.now();
  drawHUD(ctx, hudCanvas.width / SCR_W, hudCanvas.height / SCR_H, renderActor, state, world, entities, uiTime, {
    fps: currentFps,
    perf: uiElementEnabled('fps_counter') ? hudPerfDebugSnapshot(currentFps) : undefined,
    pointerLockHint: !mobileControls?.isEnabled() && !input.mouse.locked && !pointerCaptureGateVisible(),
    pointerCaptureGate: pointerCaptureGateVisible(),
  });
  lastHudDrawMs = performance.now() - hudDrawStart;

  requestAnimationFrame(gameLoop);
}

/* ── Title screen ─────────────────────────────────────────────── */
function showTitle(): void {
  setCanvasTextGlitchPressure();
  const cursorOn = Math.floor(performance.now() / 500) % 2 === 0;
  titleLanguageHits = drawTitleScreen(ctx, {
    mode: titleMode,
    languageId: titleLanguageId,
    playerName: playerNickname,
    runSeedText: titleRunSeedText,
    setupRows: titleSetupRows(cursorOn),
    cursorOn,
    mobile: mobileControls?.isEnabled() === true,
  });
  updateMobileContext(true);
}

function returnToTitleScreen(): void {
  pendingLoad = null;
  pendingLoadDrawn = false;
  started = false;
  syncPlatformGameplayState();
  clearPointerCaptureGate();
  titleRunSeedText = '';
  titleMode = 'language';
  setTitleSelection('start');
  titleStartNeedsInit = true;
  closeMobilePanels(true);
  input.escape = false;
  input.interact = false;
  input.interactHeld = false;
  input.invUp = false;
  input.invDn = false;
  input.invLeft = false;
  input.invRight = false;
  input.drop = false;
  input.uiSettings = false;
  input.mapLegend = false;
  input.controlEdit = false;
  input.controlReset = false;
  input.controlClose = false;
  resetMenuRepeats();
  document.addEventListener('keydown', startHandler);
  showTitle();
}

function finishStartGameFromTitle(): void {
  player.name = playerDisplayName();
  player.age = playerAge;
  player.sex = playerSex;
  player.isFemale = playerSex === 'female';
  started = true;
  input.escape = false;
  input.controlEdit = false;
  input.controlReset = false;
  input.controlClose = false;
  document.removeEventListener('keydown', startHandler);
  bindNetSphereInput({ canOpen: canOpenMenuFromGameplay });
  requestPointerLockIfDesktop();
  startAmbientDrone();
  updateMobileContext();
  syncPauseState();
}

function startGameFromTitle(): void {
  if (started || pendingLoad) return;
  mobileGestureUnlock();
  saveTitleActiveActorSoftLimit(titleActiveActorSoftLimit);
  savePlayerNickname(playerNickname);
  savePlayerAge(Number(titlePlayerAgeText));
  savePlayerSex(playerSex);
  const seedOverride = titleRunSeedOverride();
  if (seedOverride !== undefined || titleStartNeedsInit) {
    scheduleLoading(() => {
      initGame(seedOverride);
      titleStartNeedsInit = false;
      finishStartGameFromTitle();
    });
    return;
  }
  finishStartGameFromTitle();
}
function continueGameFromTitle(): void {
  if (started || pendingLoad) return;
  mobileGestureUnlock();
  saveTitleActiveActorSoftLimit(titleActiveActorSoftLimit);
  scheduleLoading(() => {
    initGame();
    titleStartNeedsInit = false;
    finishStartGameFromTitle();
    loadGame();
  });
}

function startHandler(e: KeyboardEvent): void {
  if (started || e.metaKey || e.ctrlKey || e.altKey) return;
  if (pointerCaptureGateVisible()) {
    e.preventDefault();
    return;
  }

  if (titleMode === 'language') {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      cycleTitleLanguage(e.code === 'ArrowRight' ? 1 : -1);
      e.preventDefault();
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      openTitleSetupMenu();
      e.preventDefault();
      return;
    }
    e.preventDefault();
    return;
  }

  if (e.code === 'Tab' || e.code === 'ArrowDown') {
    moveTitleSelection(1);
    e.preventDefault();
    return;
  }
  if (e.code === 'ArrowUp') {
    moveTitleSelection(-1);
    e.preventDefault();
    return;
  }
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    if (titleInputField === 'language') cycleTitleLanguage(e.code === 'ArrowRight' ? 1 : -1);
    else if (titleInputField === 'actorCap') adjustTitleActiveActorSoftLimit(e.code === 'ArrowRight' ? 1 : -1);
    else if (titleInputField === 'age') {
      titlePlayerAgeText = String(clampCharacterAge(Number(titlePlayerAgeText || DEFAULT_PLAYER_AGE) + (e.code === 'ArrowRight' ? 1 : -1), DEFAULT_PLAYER_AGE));
      showTitle();
    }
    else if (titleInputField === 'sex') cyclePlayerSex();
    else showTitle();
    e.preventDefault();
    return;
  }
  if (e.code === 'Enter') {
    e.preventDefault();
    if (titleInputField === 'continue') continueGameFromTitle();
    else if (titleInputField === 'start') startGameFromTitle();
    else if (titleInputField === 'addNpc') openNpcIntakePage();
    else if (titleInputField === 'language') cycleTitleLanguage(1);
    else if (titleInputField === 'actorCap') adjustTitleActiveActorSoftLimit(1);
    else if (titleInputField === 'age') moveTitleSelection(1);
    else if (titleInputField === 'sex') cyclePlayerSex();
    else moveTitleSelection(1);
    return;
  }
  if (e.code === 'Backspace') {
    if (titleInputField === 'seed') {
      titleRunSeedText = titleRunSeedText.slice(0, -1);
      titleStartNeedsInit = true;
    } else if (titleInputField === 'name') {
      playerNickname = playerNickname.slice(0, -1);
    } else if (titleInputField === 'age') {
      titlePlayerAgeText = titlePlayerAgeText.slice(0, -1);
    }
    showTitle();
    e.preventDefault();
    return;
  }
  if (e.key.length === 1) {
    if (titleInputField === 'seed') {
      const next = cleanTitleRunSeedText(titleRunSeedText + e.key);
      if (next !== titleRunSeedText) {
        titleRunSeedText = next;
        titleStartNeedsInit = true;
        showTitle();
      }
    } else if (titleInputField === 'name' && playerNickname.length < 24) {
      const next = cleanPlayerNickname(playerNickname + e.key);
      if (next !== playerNickname) {
        playerNickname = next;
        showTitle();
      }
    } else if (titleInputField === 'age' && /[0-9]/.test(e.key) && titlePlayerAgeText.length < 3) {
      const next = titlePlayerAgeText + e.key;
      titlePlayerAgeText = next === '0' ? '' : next;
      showTitle();
    }
    e.preventDefault();
  }
}

document.addEventListener('keydown', startHandler);

/* ── Title screen: physical gamepad bridge ─────────────────────
 *
 * Mirrors the keyboard `startHandler` for a `standard`-mapped controller.
 * Reads edges from the universal `InputFrame` so the same code path that
 * drives in-game menus also drives the title screen. Keyboard/mouse stay
 * the default; this only fires when the player actually moves a stick or
 * presses a button.
 */
function handleTitleGamepadInput(frame: InputFrame): void {
  if (started || pendingLoad || pointerCaptureGateVisible()) return;

  // Edges produced by D-pad presses (one frame per press, regardless of how
  // long the button is held). Sticks would route through `frame.axes` and
  // are intentionally not wired here yet — the title screen is short and
  // analog repeat would overshoot tiny field lists.
  const navUp = frame.menuNav.up;
  const navDown = frame.menuNav.down;
  const navLeft = frame.menuNav.left;
  const navRight = frame.menuNav.right;
  const acceptEdge = frame.pressedActions.has('interact') || frame.pressedActions.has('gameMenu');
  const closeEdge = frame.pressedActions.has('menuClose');

  if (titleMode === 'language') {
    if (navLeft) { cycleTitleLanguage(-1); return; }
    if (navRight) { cycleTitleLanguage(1); return; }
    if (acceptEdge || navDown) { openTitleSetupMenu(); return; }
    return;
  }

  if (closeEdge) {
    titleMode = 'language';
    setTitleSelection('start');
    showTitle();
    return;
  }

  if (navUp) { moveTitleSelection(-1); return; }
  if (navDown) { moveTitleSelection(1); return; }

  if (navLeft || navRight) {
    const dir = navRight ? 1 : -1;
    if (titleInputField === 'language') cycleTitleLanguage(dir);
    else if (titleInputField === 'actorCap') adjustTitleActiveActorSoftLimit(dir);
    else if (titleInputField === 'age') {
      titlePlayerAgeText = String(clampCharacterAge(Number(titlePlayerAgeText || DEFAULT_PLAYER_AGE) + dir, DEFAULT_PLAYER_AGE));
      showTitle();
    }
    else if (titleInputField === 'sex') cyclePlayerSex();
    else showTitle();
    return;
  }

  if (acceptEdge) {
    if (titleInputField === 'continue') continueGameFromTitle();
    else if (titleInputField === 'start') startGameFromTitle();
    else if (titleInputField === 'addNpc') openNpcIntakePage();
    else if (titleInputField === 'language') cycleTitleLanguage(1);
    else if (titleInputField === 'actorCap') adjustTitleActiveActorSoftLimit(1);
    else if (titleInputField === 'sex') cyclePlayerSex();
    else moveTitleSelection(1);
  }
}

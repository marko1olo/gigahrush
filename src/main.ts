import { getPlotNpcNumericId } from './data/npc_packages';
import { zForBaseFloor } from './data/design_floors';
/* ── ГИГАХРУЩ — main entry point ──────────────────────────────── */
import './index.css';
import './systems/demos_runtime';
import { registerPwaServiceWorker } from './pwa';
import {
  setOnlineMessageHandler,
  sendOnlineMessage,
  sendPeerAction,
  isOnlineHost,
  isOnlinePeer,
  isOnlineConnected,
  maybeSendPeerInput,
  getOnlineSlot,
  compactEntity,
  shouldSendHostSync,
  getPeerGen,
  getPeerActorGen,
  notePeerActorState,
  type PeerActorState,
  type SyncEntity,
} from './systems/online_client';

import {
  W, Cell, DoorState, Feature, Tex, RoomType, LiftDirection,
  type CharacterSex, type Entity, type GameClock, type GameState, type Item, type Needs, type Quest, type RPGStats, type WorldContainer,
  type PlayerDamageSourceKind, type WorldEventPrivacy, type WorldEventSeverity, type PlayerAlife,
  EntityType, Faction, MonsterKind, Occupation, ProjType, QuestType, AIGoal,
  msg, setMsgClock,
} from './core/types';
import { World, replaceWorldFromGeneration } from './core/world';
import { safeParseJson } from './core/json';
import { rng, hashSeed, randSeed, xorshift32, irand, mathRng } from './core/rand';
import { canActorOccupy, unstuckActorFromBlockers } from './systems/movement_collision';
import { selectMeleeTarget } from './systems/melee_targeting';
import { updateProceduralScreens } from './gen/procedural_screens';
import { updateCritters, getCritterRenderEnabled } from './render/critters';
import { generateProceduralFloor } from './gen/procedural_floor';
import { generateDesignFloor, isDesignFloorId } from './gen/design_floors/manifest';
import { injectFastElevators } from './gen/fast_elevators';
import { stampCeilingHeights } from './gen/ceiling_heights';
import { fillVisualSlotsForWorldFeatures } from './gen/visual_cell_slots';
import { syncNextEntityId } from './gen/content_manifest_utils';
import {
  floorInstanceGenerationExtrasForKey,
  floorInstanceSamosborReplacementAllowed,
  generateFloorInstance,
} from './gen/floor_instances/manifest';
import {
  // @ts-ignore
  FLOOR_MESSAGE_COLORS,
  // @ts-ignore
  FLOOR_NAMES,
  generateFloor,
  isValidZ,
  resetGeneratedFloorPopulationState,
  type FloorGeneration,
} from './gen/floor_manifest';
import { generateTextures } from './render/textures';
import { generateSprites } from './render/sprites';
import { Spr, monsterSpr } from './render/sprite_index';
import {
  SCR_W, SCR_H, initWebGL, renderSceneGL, updateWorldData, updateDynamicData,
  disposeWebGL, setDynamicSkyTexture, getRenderSceneDebugStats, rebuildProceduralSpriteCache, type DynamicSkyTexture,
  webglContextLost, webglNeedsReinit, clearWebGLReinitFlag,
} from './render/webgl';
import { drawHUD, drawPointerCaptureGate } from './render/hud';
import { drawFeedbackMenu } from './render/feedback_ui';
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
import { startTutorial } from './systems/tutorial';
import { updateAI, tryMonsterProjectileStagger, getAiStats, type AiStats } from './systems/ai';
import { markNavigationCellsDirty, prewarmNavigationTreeAsync, prewarmBehaviorFlowFields, behaviorFlowFieldCount } from './systems/ai/pathfinding';
import { createWorkerRegionNextSolver } from './systems/ai/nav_worker_pool';
import { resolveBreachChargeExplosion } from './systems/breach_charge';
import { dropMonsterRareLoot, dropMonsterLoot } from './systems/monster_drops';
import { generateNpcTradeItems } from './data/occupation_profiles';
import { generateTalkText } from './systems/dialogue';
import { updateSamosbor, rebuildWorld, clearFogInZone, updateIstotitBellCompulsion, getSamosborWarningSnapshot } from './systems/samosbor';
import { getActiveSamosborVariant } from './systems/samosbor_variants_runtime';
import { cleanCellHazardsNear, getCellHazardMoveMultiplier, tickCellHazards } from './systems/cell_hazards';
import { musicSystem } from './systems/music';

import { adjustMonsterProjectileDamage, recordMonsterMeleeDeath, recordMonsterProjectileDeath } from './systems/monster_counterplay';
import { applyDamage } from './systems/combat';
import { applyHitStaggerAndKnockback , calculateReloadTime } from './systems/combat';
import {
  pickupNearby, pickupDrop, useItem, dropItem, getWeaponStats, equippedCombatItemId,
  consumeDurability, consumeAmmo, consumeToolDurability, getEquippedToolDurability,
  countAmmo, removeItem, publishPlayerItemEvent, updateInventoryConditions,
} from './systems/inventory';
import { createInput, bindInput } from './input';
import { createMobileControls, type MobileControls } from './mobile';
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
import { MOBILE_BUTTON_CONTROL_ROWS, type MobileMenuId } from './systems/mobile_actions';
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
  toggleCrittersEnabled,
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
  toggleMasterAudioEnabled,
  adjustMusicVolume,
  adjustSfxVolume,
  resetAudioSettings,
} from './systems/ui_orchestrator';
import { checkPerformance } from './systems/fps_monitor';
import { freshNeeds, ITEMS, WEAPON_STATS, type WeaponStats } from './data/catalog';
import { INVENTORY_GRID_COLS, INVENTORY_GRID_ROWS, MAX_INVENTORY_SLOTS } from './data/inventory_limits';
import { getStack, itemEquipSlot } from './data/items';
import { designFloorAmbientLight } from './data/design_floor_profiles';
import {
  themeForDesignFloor,
  themeForProceduralSpec,
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
  setAudioSuspendedForPage, setAudioSuspendedForPlatform, setAudioSuspendedForPlatformMute, syncAudioSettings, setAudioSuspendedForTitle,
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
import { applyPickedStoryItemOutcomes, applyStoryItemOutcomes, spawnStoryDeathDrops } from './systems/plot_outcomes';
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
import { applyDesignRouteGates } from './systems/design_route_gates';
import { setDoorState, damageDoor } from './systems/door_state';
import {
  freshRPG, awardXP, xpForMonsterKill, xpForNpcKill,
  meleeDamage, actorMoveSpeed, agiAttackSpeedMult,
  spendAttrPoint, getMaxHp, getMaxPsi, randomRPG, xpForLevel, totalXpForLevel,
  RPG_ATTRIBUTE_CAP, RPG_LEVEL_CAP,
  HUMANOID_BASE_MOVE_SPEED,
  normalizeHumanoidBaseMoveSpeed,
  normalizeHumanoidBaseMoveSpeeds,
  generateHeight,
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
import { notifyActorDamaged, resetCombatStimulus } from './systems/combat_stimulus';
import { canSpawnEntityType, entitySoftLimit, entitySpawnSlots, remainingActiveActorSpawnSlots } from './systems/entity_limits';
import { clearRoomMemory, tickRoomMemory } from './systems/room_memory';
import { resetNpcMemoryStore } from './systems/npc_memory';
import { resetBarkState } from './systems/ai/barks';
import { resetMetroCooldown } from './systems/metro';
import { clearActiveBet } from './systems/arena_betting';
import { resetMonsterBaits } from './systems/monster_bait';
import { UV_SPOTLIGHT_FX_SECONDS, UV_SPOTLIGHT_ID, useUvSpotlight, uvSpotlightRenderIntensity } from './systems/uv_spotlight';
import { CHALK_ITEM_ID, drawEquippedChalkPixel } from './systems/chalk';
import { isRidingRailTrain, updateRailTrains } from './systems/rail_trains';
import { updateCarnivorousFungus } from './systems/carnivorous_fungus';
import { updateArenaDuel } from './systems/arena';
import { hladonColdMoveMultiplier, updateHladonColdPocket } from './systems/hladon';
import { tryCoverSeroburmalineSource, updateSeroburmalineExposure } from './systems/seroburmaline';
import { updateRouteCues, resetRouteCueHud } from './systems/route_cues';
import { resetRumorEvents } from './systems/rumor';
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
import { withPreservedGenerationRuntime } from './systems/generation_runtime_guard';
import {
  packFloorForNetwork,
  serializeFloorSnapshot,
  chunkFloorSnapshot,
  deserializeFloorSnapshot,
  unpackFloorFromNetwork,
  reassembleFloorSnapshot,
} from './systems/floor_serialization';
import {
  commitFloorRunEntry,
  currentFloorRunEntry,
  ensureFloorRunState,
  floorRunArrivalLead,
  floorRunEntryDanger,
  floorRunEntryForDesignFloor,
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
  firstNearbyContainer,
  putIntoContainer,
  restoreValidContainers,
  takeFromContainer,
  tickContainerAudits,
} from './systems/containers';
import {
  containerSyncPayload,
  resolvePeerContainerAtCell,
  buildRemoteContainer,
  type ContainerSyncPayload,
} from './systems/online_containers';
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
  ensureEntityIndex,
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
  setNetSphereChatHandler,
  tickNetSphere,
  hashNetGen,
  _test_storage
} from './systems/net_sphere';

// We add local system message directly via the internal net sphere storage logic 
// but since `addLocalSystemMessage` is private in `net_sphere.ts`, we'll just push directly to runtime
// Wait, `net_sphere.ts` does not export `addLocalSystemMessage`.
// We can just use `msg(state, '...')` instead, which shows it on the HUD!
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
  savePlatformRawGameSave,
  showPlatformFullscreenAd,
  isGamePushPortalTarget,
} from './systems/platform_bridge';
import { addFactionRel, addFactionRelMutual, initFactionRelations, resetPlayerFactionRelations, restoreFactionRelations } from './data/relations';
import { createRuntimeCamera, resetRuntimeCamera, runtimeCameraView, startDeathCamera, updateRuntimeCamera, startTrailerCamera, updateTrailerCamera, startCinematicCamera } from './systems/camera';
import { onHeraldKilled, onCreatorKilled, onHellArrival, tryCreateVoiceQuest, onVoidEntry } from './data/plot_events';
import { randomTip } from './data/tips';
import { drawLoadingScreen } from './render/loading_screen';
import {
  PROCEDURAL_FLOOR_ZS,
  FLOOR_RUN_VOID_Z,
  makeProceduralFloorSpec,
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
const loadingCanvas = document.getElementById('loadingCanvas') as HTMLCanvasElement | null;
let loadingWorker: Worker | null = null;
let loadingWorkerAck = false;
let isFirstBootLoading = true;
if (loadingCanvas && typeof loadingCanvas.transferControlToOffscreen === 'function') {
  const offscreen = loadingCanvas.transferControlToOffscreen();
  loadingWorker = new Worker(new URL('./loading_worker.ts', import.meta.url), { type: 'module' });
  loadingWorker.onmessage = (e) => {
    if (e.data?.type === 'started') loadingWorkerAck = true;
  };
  loadingWorker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
}
registerPwaServiceWorker();

// Web Worker pool that bakes the navigation next-hop matrix (step 4, ~98% of
// nav-bake cost) across cores behind the loading screen. Built once, reused for
// every floor/samosbor rebake; workers spawn lazily on the first bake. In a
// no-Worker environment the solver rejects and the bake falls back to the
// synchronous kernel, so behavior is identical, just single-cored.
const _navSolver = createWorkerRegionNextSolver();
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
type TitleInputField = Extract<TitleHitField, 'language' | 'name' | 'age' | 'sex' | 'seed' | 'actorCap' | 'trailer' | 'addNpc' | 'start' | 'continue' | 'feedback'>;
const NPC_INTAKE_ENABLED = Boolean((globalThis as { __GIGAHRUSH_NPC_INTAKE_ENABLED__?: boolean }).__GIGAHRUSH_NPC_INTAKE_ENABLED__);
const smokeDebug = new URLSearchParams(window.location.search).has('smoke');

function hasValidSaveGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = safeParseJson(raw);
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
  fields.push('language', 'name', 'age', 'sex', 'seed', 'feedback');
  return fields;
}
let started = false;
let playerNickname = loadPlayerNickname();
let playerAge = loadPlayerAge();
let playerSex = loadPlayerSex();
let titlePlayerAgeText = String(playerAge);
let titleRunSeedText = '';
const TRAILER_ZS = Array.from({ length: 101 }, (_, i) => i - 50);
let titleTrailerFloorIdx = Math.floor(mathRng() * TRAILER_ZS.length);
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

// ── Online multiplayer message handler ──────────────────────
let onlinePeerFloorReady = false;
const _lastPeerActor = new Map<number, Record<string, unknown>>();  // delta-merge: last received actor state per slot
const _peerAckedGen = new Map<number, number>();  // last processed peer gen per slot
const _peerAckedActorGen = new Map<number, number>();  // last changed peer actor payload reconciled by host
const _peerNextFireAt = new Map<number, number>();  // wall-clock ms gate: next allowed peer attack per slot
const _peerNextToolAt = new Map<number, number>(); // host-side peer world-tool effect gate

// Peer-side transient remote container copy: a single reserved synthetic id kept
// only in containerById (never containerMap/containers → no world mesh). Backs the
// container menu the peer views for a host-owned container. Its cell is remembered
// so take/put/close requests can be addressed back to the host by (cx, cy).
const PEER_REMOTE_CONTAINER_ID = -777001;
const ONLINE_PLAYER_SPRITE_SCALE = 0.65;
let _peerRemoteContainerCell: { x: number; y: number } | null = null;

// Peer-side floor checkpoint reassembly (chunks arrive in order from host).
let _snapChunks: (string | undefined)[] | null = null;
let _snapTotal = 0;
let _snapReceived = 0;
let _snapSpawnX = W / 2;
let _snapSpawnY = W / 2;
let _peerPendingFireAction = false;
let _peerPendingReloadAction = false;
let _peerPendingToolUse: 'edge' | 'hold' | undefined;

function spawnPeerProjectile(actor: Entity, weaponId: string, ws: WeaponStats): void {
  const cos = Math.cos(actor.angle);
  const sin = Math.sin(actor.angle);
  const pellets = ws.pellets ?? 1;
  const spread = ws.spread ?? 0;
  const pt = ws.projType ?? ProjType.NORMAL;
  for (let p = 0; p < pellets; p++) {
    const ang = actor.angle + (rng() - 0.5) * spread;
    const spd = ws.projSpeed ?? 15;
    const proj: Entity = {
      id: nextEntityId.v++,
      type: EntityType.PROJECTILE,
      x: actor.x + cos * 0.85,
      y: actor.y + sin * 0.85,
      angle: ang, pitch: 0,
      alive: true, speed: 0,
      sprite: ws.projSprite ?? Spr.BULLET,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      vz: (actor.pitch ?? 0) * spd * 0.5 + (pt === ProjType.FLAME ? (rng() - 0.5) * 0.8 : 0),
      projDmg: ws.dmg,
      projLife: pt === ProjType.GRENADE ? 1.5 : pt === ProjType.FLAME ? 0.7 : 3.0,
      ownerId: actor.id,
      weapon: weaponId,
      spriteScale: pt === ProjType.BFG ? 0.6 : pt === ProjType.FLAME ? (0.55 + rng() * 0.25) : pt === ProjType.GRENADE ? 0.35 : 0.25,
      spriteZ: 0.5,
      projType: pt,
      projGore: pt === ProjType.GRENADE || pt === ProjType.BFG ? 3
        : (weaponId === 'shotgun' || weaponId === 'chainsaw') ? 3
        : (weaponId === 'ak47' || weaponId === 'machinegun' || weaponId === 'nailgun' || weaponId === 'gauss' || weaponId === 'plasma') ? 2
        : pt === ProjType.FLAME ? 1 : 1,
    };
    if (ws.aoeRadius) { proj.aoeRadius = ws.aoeRadius; proj.aoeDmg = ws.dmg; }
    entities.push(proj);
  }
}

function spawnPeerPsiProjectile(actor: Entity, psiId: string, ws: WeaponStats): void {
  const cos = Math.cos(actor.angle);
  const sin = Math.sin(actor.angle);
  const spd = ws.projSpeed ?? 14;
  const proj: Entity = {
    id: nextEntityId.v++,
    type: EntityType.PROJECTILE,
    x: actor.x + cos * 0.85,
    y: actor.y + sin * 0.85,
    angle: actor.angle,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: ws.projSprite ?? Spr.PSI_BOLT,
    vx: Math.cos(actor.angle) * spd,
    vy: Math.sin(actor.angle) * spd,
    vz: (actor.pitch ?? 0) * spd * 0.5,
    projDmg: ws.dmg,
    projLife: 3.0,
    ownerId: actor.id,
    weapon: psiId,
    spriteScale: 0.3,
    spriteZ: 0.5,
  };
  if (ws.aoeRadius) { proj.aoeRadius = ws.aoeRadius; proj.aoeDmg = ws.dmg; }
  entities.push(proj);
}

function applyPeerPsiWorldEffect(actor: Entity, psiId: string, ws: WeaponStats): void {
  const effect = ws.psiEffect ?? '';
  if (!ws.isRanged && (effect === 'phase' || effect === 'shield' || effect === 'mark' || effect === 'recall' || effect === 'possession')) return;

  if (ws.isRanged) {
    spawnPeerPsiProjectile(actor, psiId, ws);
  } else {
    const psiResult = castInstantSpell(effect, actor, entities, world, state.msgs, state.time, (e) => handleKill(e, true));
    if (psiResult.beamLen) {
      state.beamFx = 0.35;
      state.beamAngle = actor.angle;
      state.beamLen = psiResult.beamLen;
    }
  }
  if (ws.psiEffect === 'beam') playPsiBeam(); else playPsiCast();
  publishWeaponNoise(state, actor, psiId, ws);
}

function applyPeerFireAction(actor: Entity, slot: number): void {
  const weaponId = equippedCombatItemId(actor);
  const ws = getWeaponStats(actor, weaponId);
  const nowMs = performance.now();
  const nextAt = _peerNextFireAt.get(slot) ?? 0;
  if (nowMs < nextAt) return;
  const atkSpeedMod = actor.rpg ? agiAttackSpeedMult(actor.rpg) : 1;
  _peerNextFireAt.set(slot, nowMs + Math.max(0.05, ws.speed * atkSpeedMod) * 1000);

  if (ws.psiCost) {
    applyPeerPsiWorldEffect(actor, weaponId, ws);
    return;
  }

  if (ws.isRanged) {
    if (!ws.ammoType && ws.magazineSize !== Infinity && (actor.currentMag ?? 0) <= 0) return;
    if (ws.projType === ProjType.FLAME) reducePaupsinaWeb(actor, state.time, state.msgs, state, actor, 'fire');
    if (ws.deletionBeam) {
      fireDeletionBeam(world, entities, actor, state, weaponId, ws, handleKill);
    } else {
      spawnPeerProjectile(actor, weaponId, ws);
    }
    playWeaponSound(weaponId, ws);
    publishWeaponNoise(state, actor, weaponId, ws);
    notifyLiftArachnaNoise(world, actor, state, weaponId);
    return;
  }

  const normalDmg = meleeDamage(actor.rpg, weaponId, ws.dmg);
  const range = ws.range;
  const ax = actor.x + Math.cos(actor.angle) * range;
  const ay = actor.y + Math.sin(actor.angle) * range;
  let hitSomething = isPaupsinaWebCuttingWeapon(weaponId)
    ? reducePaupsinaWeb(actor, state.time, state.msgs, state, actor, 'cut')
    : false;
  const entityIndex = getEntityIndex();
  const meleeQuery: Entity[] = [];
  entityIndex.queryRadius(actor.x, actor.y, range + (ws.hitRadius ?? 0.6) + 0.5, meleeQuery, ENTITY_MASK_ACTOR);
  const target = selectMeleeTarget(world, actor, meleeQuery, range, weaponId);
  if (target && target.hp !== undefined) {
    const armor = applyDamage(world, state, target, { damage: normalDmg, attacker: actor, weaponId });
    const dmg = armor.damage;
    target.hp -= dmg;
    target.staggerTimer = 0.15;
    const mSpd = 6;
    const mVx = Math.cos(actor.angle) * mSpd;
    const mVy = Math.sin(actor.angle) * mSpd;
    spawnBloodHit(world, target.x, target.y, actor.angle, dmg, target.type === EntityType.MONSTER, mVx, mVy, 0.5);
    if (isPlayerEntity(target)) {
      recordPlayerDamage(state, actor, dmg, `Удар от ${actor.name || 'игрока'}: -${dmg}`, 'npc');
      state.dmgFlash = Math.max(state.dmgFlash, Math.min(1, 0.3 + dmg / (target.maxHp ?? 100) * 1.5));
    } else {
      notifyActorDamaged(world, target, actor, dmg, 'player_melee', state.time, state);
    }
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      if (!isPlayerEntity(target)) handleKill(target, true, mVx, mVy, 1);
    }
    hitSomething = true;
  }
  if (!hitSomething) {
    const attackIdx = world.idx(Math.floor(ax), Math.floor(ay));
    if (world.cells[attackIdx] === Cell.DOOR && world.doors.has(attackIdx)) {
      hitSomething = true;
      if (damageDoor(world, world.doors.get(attackIdx)!, normalDmg)) updateWorldData(world);
    }
  }
  if (weaponId === 'chainsaw') playChainsaw(); else playAttack();
  publishWeaponNoise(state, actor, weaponId, ws);
  notifyLiftArachnaNoise(world, actor, state, weaponId);
}

function peerActorSnapshot(actor = player): PeerActorState {
  return {
    hp: actor.hp ?? 100,
    maxHp: actor.maxHp ?? 100,
    alive: actor.alive,
    weapon: actor.weapon ?? '',
    tool: actor.tool ?? '',
    sprite: actor.sprite,
    spriteScale: actor.spriteScale,
    npcVisualId: actor.npcVisualId,
    sex: actor.sex,
    armorDefId: actor.armorDefId,
    money: actor.money,
    staggerTimer: actor.staggerTimer,
    currentMag: actor.currentMag,
    reloading: actor.reloading,
    reloadTimer: actor.reloadTimer,
    attackCd: actor.attackCd,
    inventory: actor.inventory?.map(i => i.data !== undefined ? { defId: i.defId, count: i.count, data: i.data } : { defId: i.defId, count: i.count }),
    needs: actor.needs ? { food: actor.needs.food, water: actor.needs.water, sleep: actor.needs.sleep, pee: actor.needs.pee, poo: actor.needs.poo } : undefined,
    rpg: actor.rpg ? { level: actor.rpg.level, xp: actor.rpg.xp, attrPoints: actor.rpg.attrPoints, str: actor.rpg.str, agi: actor.rpg.agi, int: actor.rpg.int, psi: actor.rpg.psi, maxPsi: actor.rpg.maxPsi } : undefined,
  };
}

function sendPeerInventorySync(actor: Entity): void {
  if (actor.peerSlot === undefined) return;
  sendOnlineMessage({
    type: 'peer_inventory_sync',
    _targetSlot: actor.peerSlot,
    weapon: actor.weapon ?? '',
    tool: actor.tool ?? '',
    money: actor.money,
    inventory: actor.inventory?.map(i => i.data !== undefined ? { defId: i.defId, count: i.count, data: i.data } : { defId: i.defId, count: i.count }),
  });
}

function applyPeerToolUse(actor: Entity, slot: number, edge: boolean): void {
  const toolId = actor.tool ?? '';
  if (!toolId) return;
  if (!(actor.inventory ?? []).some(item => item.defId === toolId)) { actor.tool = ''; return; }
  const now = performance.now();
  if (now < (_peerNextToolAt.get(slot) ?? 0)) return;
  const activeLightDrain = activeToolLightDrainPerSecond(toolId);
  if (activeLightDrain > 0) {
    _peerNextToolAt.set(slot, now + 125);
    return;
  }
  if (WEAPON_STATS[toolId]?.psiCost) {
    const psiToolStats = getWeaponStats(actor, toolId);
    const atkSpeedMod = actor.rpg ? agiAttackSpeedMult(actor.rpg) : 1;
    _peerNextToolAt.set(slot, now + Math.max(0.05, psiToolStats.speed * atkSpeedMod) * 1000);
    applyPeerPsiWorldEffect(actor, toolId, psiToolStats);
    return;
  }
  if (toolId === UV_SPOTLIGHT_ID) {
    const inventoryBefore = actor.inventory ? structuredClone(actor.inventory) : undefined;
    const toolBefore = actor.tool;
    const result = useUvSpotlight(world, entities, actor, state);
    actor.inventory = inventoryBefore;
    actor.tool = toolBefore;
    if (result) {
      state.uvBeamFx = UV_SPOTLIGHT_FX_SECONDS;
      state.uvBeamLen = result.beamLen;
      playSoundAt(playEnergyImpact, actor.x, actor.y);
    }
    _peerNextToolAt.set(slot, now + 280);
    return;
  }
  if (toolId === CHALK_ITEM_ID) {
    const def = ITEMS[CHALK_ITEM_ID];
    drawEquippedChalkPixel(world, actor, def?.durability ?? 0);
    _peerNextToolAt.set(slot, now + 45);
    return;
  }
  const lookRange = 1.4;
  const tx = actor.x + Math.cos(actor.angle) * lookRange;
  const ty = actor.y + Math.sin(actor.angle) * lookRange;
  const cx = Math.floor(tx);
  const cy = Math.floor(ty);
  const ci = world.idx(cx, cy);
  let changedWorld = false;
  if (toolId === 'vacuum') {
    let clearedFog = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const fi = world.idx(Math.floor(actor.x) + ox, Math.floor(actor.y) + oy);
      if (world.fog[fi] <= 0) continue;
      world.fog[fi] = 0;
      clearedFog++;
    }
    if (clearedFog > 0) { world.markFogDirty(); changedWorld = true; }
    _peerNextToolAt.set(slot, now + 150);
  } else if (toolId === 'jackhammer') {
    if (!world.hermoWall[ci] && !world.aptMask[ci] && world.cells[ci] === Cell.WALL) {
      setCellToFloor(cx, cy);
      notifyLiftArachnaNoise(world, actor, state, 'jackhammer');
      changedWorld = true;
    }
    _peerNextToolAt.set(slot, now + 200);
  } else if (edge && toolId === 'door_kit') {
    if (!world.aptMask[ci] && world.cells[ci] === Cell.FLOOR) {
      const l = world.cells[world.idx(cx - 1, cy)], r = world.cells[world.idx(cx + 1, cy)];
      const u = world.cells[world.idx(cx, cy - 1)], d = world.cells[world.idx(cx, cy + 1)];
      if ((l === Cell.WALL && r === Cell.WALL && u !== Cell.WALL && d !== Cell.WALL)
        || (u === Cell.WALL && d === Cell.WALL && l !== Cell.WALL && r !== Cell.WALL)) {
        const roomA = world.roomMap[world.idx(cx - 1, cy)] >= 0 ? world.roomMap[world.idx(cx - 1, cy)] : world.roomMap[world.idx(cx, cy - 1)];
        const roomB = world.roomMap[world.idx(cx + 1, cy)] >= 0 ? world.roomMap[world.idx(cx + 1, cy)] : world.roomMap[world.idx(cx, cy + 1)];
        world.cells[ci] = Cell.DOOR;
        world.markCellsDirty();
        world.doors.set(ci, { idx: ci, state: DoorState.CLOSED, roomA, roomB, keyId: '', timer: 0 });
        addRuntimeDoorToRoom(roomA, ci); addRuntimeDoorToRoom(roomB, ci);
        changedWorld = true;
      }
    }
    _peerNextToolAt.set(slot, now + 250);
  } else if (edge && toolId === 'block_kit') {
    const pci = world.idx(Math.floor(actor.x), Math.floor(actor.y));
    if (ci !== pci && !world.aptMask[ci] && !world.hermoWall[ci] && (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.DOOR)) {
      if (world.cells[ci] === Cell.DOOR) world.removeDoorAt(ci);
      world.cells[ci] = Cell.WALL;
      world.markCellsDirty();
      const room = world.roomAt(actor.x, actor.y);
      world.wallTex[ci] = room?.wallTex ?? Tex.CONCRETE;
      world.markWallTexDirty();
      changedWorld = true;
    }
    _peerNextToolAt.set(slot, now + 250);
  } else {
    const cleanupTool = cleanupToolProfile(toolId);
    if (cleanupTool) {
      const cleaned = cleanSurfaceArea(tx, ty, cleanupTool.surfaceRadius);
      const cleanedHazards = cleanCellHazardsNear(world, tx, ty, cleanupTool.hazardRadius, state, actor, cleanupTool.hazardReason);
      if (cleaned > 0 || cleanedHazards > 0) notifyCleanupToolUse(actor, world, state, tx, ty, cleaned, cleanedHazards);
      changedWorld = cleaned > 0 || cleanedHazards > 0;
      _peerNextToolAt.set(slot, now + cleanupTool.cooldown * 1000);
    }
  }
  if (changedWorld) updateWorldData(world);
}

setOnlineMessageHandler((msgData: any) => {
  if (msgData.type === 'chat_ping') {
    const text = msgData.text || '';
    const duration = Math.max(0, Math.min(6, Math.max(2.5, text.length * 0.12)));
    if (duration > 0 && entities) {
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (e.id === player?.id) continue;
        if ((e.peerSlot !== undefined || e.netGen) && (e.netGen === msgData.netGen || e.name === msgData.nickname)) {
          e.activeBark = { text, until: state.time + duration, color: '#cca', skipTranslate: true };
          break;
        }
      }
    }
  }

  // ── HOST: peer joined → spawn remote actor, send floor seed ──
  if (msgData.type === 'peer_join' && isOnlineHost()) {
    const peerSlot = msgData._peerSlot;
    state.msgs.push(msg(`Игрок ${peerSlot} подключился.`, state.time, '#8cf'));

    // Spawn peer at host player position (guaranteed passable)
    const spawnX = player.x, spawnY = player.y;

    const remoteActor: Entity = {
      id: nextEntityId.v++,
      type: EntityType.NPC,
      x: spawnX, y: spawnY,
      angle: -Math.PI / 2, pitch: 0,
      alive: true,
      speed: HUMANOID_BASE_MOVE_SPEED,
      sprite: Occupation.TRAVELER,
      spriteScale: ONLINE_PLAYER_SPRITE_SCALE,
      needs: freshNeeds(),
      hp: 100, maxHp: 100,
      money: 100,
      inventory: [],
      weapon: '', tool: '',
      name: msgData.nickname || `Игрок ${peerSlot}`,
      netGen: msgData.netGen,
      rpg: freshRPG(1),
      faction: Faction.PLAYER,
      peerSlot,
      ...playerAlifeFields(),
    } as Entity;
    entities.push(remoteActor);

    // Full-floor checkpoint: pack the host's live, mutated World + entities and
    // stream it to the peer in order. The peer restores this verbatim instead of
    // regenerating from seed, so runtime mutations (doors, containers, loot,
    // route lifts, carved passages) can never desync. Seed is still sent as a
    // fallback identity hint.
    const runSeed = ensureFloorRunState(state).runSeed;
    const snapshot = packFloorForNetwork(world, entities, {
      z: state.currentZ,
      runSeed,
      floorKey: currentFloorMemoryKey(),
      spawnX, spawnY,
      samosborCount: state.samosborCount,
      gameTime: state.time,
      nextEntityId: nextEntityId.v,
    });
    const chunks = chunkFloorSnapshot(serializeFloorSnapshot(snapshot));
    sendOnlineMessage({
      type: 'floor_snapshot_begin',
      _targetSlot: peerSlot,
      total: chunks.length,
      z: state.currentZ,
      runSeed,
      peerSlot,
      spawnX, spawnY,
    });
    for (let i = 0; i < chunks.length; i++) {
      sendOnlineMessage({
        type: 'floor_snapshot_chunk',
        _targetSlot: peerSlot,
        i,
        data: chunks[i],
      });
    }
  }

  // ── HOST: apply peer input to remote actor (delta-merge) ──
  if (msgData.type === 'peer_input' && isOnlineHost()) {
    const actor = entities.find(e => e.peerSlot === msgData._peerSlot && e.alive);
    if (actor) {
      // Validate position — only accept if the target cell is passable
      const nx = world.wrap(msgData.x);
      const ny = world.wrap(msgData.y);
      if (!world.solid(Math.floor(nx), Math.floor(ny))) {
        actor.x = nx;
        actor.y = ny;
      }
      actor.angle = msgData.angle ?? actor.angle;
      actor.pitch = msgData.pitch ?? actor.pitch;
      // Delta-merge: compare with last snapshot, only apply fields peer changed
      const a = msgData.actor;
      if (a) {
        const slot = msgData._peerSlot as number;
        const prev = _lastPeerActor.get(slot);
        const peerChanged = (key: string): boolean => {
          if (!prev) return true; // first message — apply all
          return JSON.stringify((a as Record<string, unknown>)[key]) !== JSON.stringify((prev as Record<string, unknown>)[key]);
        };
        if (peerChanged('hp')) actor.hp = a.hp;
        if (peerChanged('maxHp')) actor.maxHp = a.maxHp;
        if (peerChanged('alive')) actor.alive = a.alive;
        if (peerChanged('weapon')) actor.weapon = a.weapon;
        if (peerChanged('tool')) actor.tool = a.tool;
        if (peerChanged('sprite')) actor.sprite = a.sprite;
        if (peerChanged('spriteScale')) actor.spriteScale = a.spriteScale;
        if (peerChanged('npcVisualId')) actor.npcVisualId = a.npcVisualId;
        if (peerChanged('sex')) actor.sex = a.sex;
        actor.faction = Faction.PLAYER;
        if (peerChanged('armorDefId')) actor.armorDefId = a.armorDefId;
        if (peerChanged('money')) actor.money = a.money;
        if (peerChanged('staggerTimer')) actor.staggerTimer = a.staggerTimer;
        if (peerChanged('currentMag')) actor.currentMag = a.currentMag;
        if (peerChanged('reloading')) actor.reloading = a.reloading;
        if (peerChanged('reloadTimer')) actor.reloadTimer = a.reloadTimer;
        if (peerChanged('attackCd')) actor.attackCd = a.attackCd;
        if (peerChanged('inventory')) actor.inventory = a.inventory;
        if (peerChanged('needs') && a.needs && actor.needs) Object.assign(actor.needs, a.needs);
        if (peerChanged('rpg') && a.rpg && actor.rpg) Object.assign(actor.rpg, a.rpg);
        _lastPeerActor.set(slot, structuredClone(a));
        if (typeof msgData.gen === 'number') _peerAckedGen.set(slot, msgData.gen);
        if (typeof msgData.actorGen === 'number') _peerAckedActorGen.set(slot, msgData.actorGen);
        const action = msgData.action as { fire?: boolean; reload?: boolean; toolUse?: 'edge' | 'hold' } | undefined;
        if (action?.fire) applyPeerFireAction(actor, slot);
        if (action?.toolUse) applyPeerToolUse(actor, slot, action.toolUse === 'edge');
      }
    }
  }

  // ── HOST: peer shared-world action (interact/container/drop) — reliable, not throttled ──
  if (msgData.type === 'peer_action' && isOnlineHost()) {
    const actor = entities.find(e => e.peerSlot === msgData._peerSlot && e.alive);
    if (actor) {
      // ── Peer interact: doors + item pickup ──
      if (msgData.interact) {
        let handled = false;
        // Try door first
        const lx = actor.x + Math.cos(actor.angle) * 1.5;
        const ly = actor.y + Math.sin(actor.angle) * 1.5;
        const cx = Math.floor(world.wrap(lx));
        const cy = Math.floor(world.wrap(ly));
        const idx = world.idx(cx, cy);
        if (world.cells[idx] === Cell.DOOR && world.doors.has(idx)) {
          const door = world.doors.get(idx)!;
          if (door.state === DoorState.CLOSED) {
            setDoorState(world, door, DoorState.OPEN);
            door.timer = 0; handled = true;
          } else if (door.state === DoorState.OPEN) {
            setDoorState(world, door, DoorState.CLOSED); handled = true;
          } else if (door.state === DoorState.HERMETIC_CLOSED && !state.samosborActive) {
            setDoorState(world, door, DoorState.HERMETIC_OPEN);
            door.timer = 0; handled = true;
          } else if (door.state === DoorState.HERMETIC_OPEN) {
            setDoorState(world, door, DoorState.HERMETIC_CLOSED); handled = true;
          } else if (door.state === DoorState.LOCKED) {
            const keyId = door.keyId || 'key';
            if (actor.inventory?.some((i: { defId: string }) => i.defId === keyId)) {
              setDoorState(world, door, DoorState.OPEN);
              door.timer = 0; handled = true;
              state.msgs.push(msg(`Игрок ${actor.peerSlot} отпер дверь ключом`, state.time, '#4a4'));
            }
          }
        }
        // Try item pickup if door wasn't toggled
        if (!handled) {
          let bestDrop: Entity | null = null;
          let bestD2 = 2.5 * 2.5; // max 2.5 cell range
          for (const e of entities) {
            if (e.type !== EntityType.ITEM_DROP || !e.alive) continue;
            const d2 = world.dist2(actor.x, actor.y, e.x, e.y);
            if (d2 < bestD2) { bestDrop = e; bestD2 = d2; }
          }
          if (bestDrop) {
            const result = pickupDrop(world, bestDrop, actor, state.msgs, state.time, state);
            if (result.pickedAny) sendPeerInventorySync(actor);
            handled = result.handled;
          }
        }
        // Try opening / searching a container in front of the peer. Host is the
        // sole authority: it resolves (or lazily generates) the container and
        // sends the peer a transient inventory copy to view — the peer never
        // generates anything (floor seed is non-deterministic) and never spawns
        // a world mesh for it.
        if (!handled) {
          // Prefer the cell the peer faces (matches the local look-direction
          // targeting and lets "обыскать" generate loot on the faced feature),
          // then fall back to a nearby container.
          const container = resolvePeerContainerAtCell(world, state.currentZ, Math.floor(cx), Math.floor(cy))
            ?? firstNearbyContainer(world, actor, state)
            ?? resolvePeerContainerAtCell(world, state.currentZ, Math.floor(actor.x), Math.floor(actor.y));
          if (container) {
            container.lastOpenedBy = actor.id;
            container.lastOpenedAt = state.time;
            sendOnlineMessage({
              type: 'container_open',
              _targetSlot: actor.peerSlot,
              container: containerSyncPayload(container),
            });
          }
        }
      }

      // ── Peer drop item ──
      if (msgData.drop) {
        const dropX = actor.x + Math.cos(actor.angle) * 3.0;
        const dropY = actor.y + Math.sin(actor.angle) * 3.0;
        const defId = msgData.defId as string;
        const count = Math.max(1, Math.floor((msgData.count as number) || 1));
        if (defId) {
          removeItem(actor, defId, count);
          if (actor.weapon === defId) actor.weapon = '';
          if (actor.tool === defId) actor.tool = '';
          entities.push({
            id: nextEntityId.v++, type: EntityType.ITEM_DROP,
            x: dropX, y: dropY, angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
            inventory: [{ defId, count, data: msgData.data }],
          } as Entity);
          state.msgs.push(msg(`Игрок ${actor.peerSlot} выбросил предмет`, state.time, '#aa6'));
        }
      }

      // ── Peer container: take / put / close — host-authoritative ──
      // Peer sends the container's cell + slot; host resolves the real container
      // there, runs the real take/put against the peer actor (all theft/karma/
      // purchase/event side effects stay host-owned), then echoes fresh contents
      // back to that peer. Peer inventory reconciles via entity_sync. On close
      // the host just drops any transient generated loot bookkeeping — the
      // container itself lives in the host world.
      if (msgData.container) {
        const op = msgData.container as { op: string; cx: number; cy: number; slot?: number };
        if (op.op !== 'close') {
          const container = resolvePeerContainerAtCell(world, state.currentZ, op.cx, op.cy);
          if (container) {
            const slot = Math.max(0, Math.floor(op.slot ?? 0));
            let inventoryChanged = false;
            if (op.op === 'take') {
              inventoryChanged = takeFromContainer(container, actor, slot, 1, { state, world, entities });
            } else if (op.op === 'put') {
              inventoryChanged = putIntoContainer(container, actor, slot, 1, { state, world, entities });
            }
            sendOnlineMessage({
              type: 'container_sync',
              container: containerSyncPayload(container),
            });
            if (inventoryChanged) sendPeerInventorySync(actor);
          }
        }
      }
    }
  }

  if (msgData.type === 'floor_snapshot_begin' && isOnlinePeer()) {
    state.msgs.push(msg('Получаю этаж хоста...', state.time, '#8cf'));
    _snapTotal = Math.max(0, Math.floor(msgData.total ?? 0));
    _snapChunks = new Array(_snapTotal);
    _snapReceived = 0;
    _snapSpawnX = msgData.spawnX ?? W / 2;
    _snapSpawnY = msgData.spawnY ?? W / 2;
    onlinePeerFloorReady = false;
  }

  if (msgData.type === 'floor_snapshot_chunk' && isOnlinePeer() && _snapChunks) {
    const i = Math.floor(msgData.i ?? -1);
    if (i >= 0 && i < _snapTotal && _snapChunks[i] === undefined) {
      _snapChunks[i] = typeof msgData.data === 'string' ? msgData.data : '';
      _snapReceived++;
    }
    if (_snapReceived < _snapTotal) return;
    // All chunks in — reassemble, unpack, and swap in the host's floor.
    const serialized = reassembleFloorSnapshot(_snapChunks, _snapTotal);
    _snapChunks = null;
    const snapshot = serialized !== null ? deserializeFloorSnapshot(serialized) : null;
    const unpacked = snapshot ? unpackFloorFromNetwork(snapshot) : null;
    if (!unpacked) {
      state.msgs.push(msg('Ошибка распаковки этажа хоста.', state.time, '#f44'));
      return;
    }
    const spawnX = _snapSpawnX, spawnY = _snapSpawnY;
    const peerMySlot = getOnlineSlot();
    scheduleLoading(() => {
      // Re-stamp the derived, non-serialized layers that generation owns
      // (mirrors loadFloorForTarget for memory-restored floors).
      injectFastElevators(unpacked.world);
      fillVisualSlotsForWorldFeatures(unpacked.world, unpacked.meta.runSeed);
      stampCeilingHeights(unpacked.world);
      state.currentZ = unpacked.meta.z;
      world = replaceWorldFromGeneration(world, { world: unpacked.world });
      entities = unpacked.entities;
      // Never mint a local id that collides with a host-authored entity.
      nextEntityId.v = Math.max(nextEntityId.v, unpacked.meta.nextEntityId, syncNextEntityId(entities, nextEntityId.v));

      // Create local player actor for camera attachment
      const localPlayer: Entity = {
        id: nextEntityId.v++,
        type: EntityType.NPC,
        x: spawnX, y: spawnY,
        angle: -Math.PI / 2, pitch: 0,
        alive: true,
        speed: HUMANOID_BASE_MOVE_SPEED,
        sprite: Occupation.TRAVELER,
        spriteScale: ONLINE_PLAYER_SPRITE_SCALE,
        needs: freshNeeds(),
        hp: 100, maxHp: 100,
        money: 100,
        inventory: [],
        weapon: '', tool: '',
        name: 'Вы',
        netGen: getNetSphereSnapshot().netGen,
        rpg: freshRPG(1),
        faction: Faction.PLAYER,
        peerSlot: peerMySlot,
        ...playerAlifeFields(),
      } as Entity;
      entities.push(localPlayer);
      player = localPlayer;
      setCurrentPlayerEntity(player);
      finishLoadedFloorVisuals();
      rebuildEntityIndex(entities, 'load');
      onlinePeerFloorReady = true;
      state.msgs.push(msg('Этаж загружен. Синхронизация...', state.time, '#8cf'));
    });
  }

  // ── PEER: entity sync from host — patch in-place, lerp positions ──
  if (msgData.type === 'entity_sync' && isOnlinePeer() && onlinePeerFloorReady) {
    const syncEntities: SyncEntity[] = msgData.entities;
    if (!syncEntities) return;

    const mySlot = getOnlineSlot();
    const seenIds = new Set<number>();
    for (const se of syncEntities) {
      seenIds.add(se.id);
      if (se.peerSlot === mySlot) {
        // Only snap position if far from host truth (>6 cells = teleport/correction)
        // and the host has already processed our latest movement packet.
        const hostAcked = se.ackPeerGen !== undefined && se.ackPeerGen >= getPeerGen();
        const pdx = world.delta(player.x, se.x);
        const pdy = world.delta(player.y, se.y);
        if (hostAcked && pdx * pdx + pdy * pdy > 36) {
          player.x = se.x;
          player.y = se.y;
        }
        const hostAckedActor = se.ackPeerActorGen !== undefined && se.ackPeerActorGen >= getPeerActorGen();
        if (hostAckedActor) {
          player.hp = se.hp;
          player.maxHp = se.maxHp;
          player.staggerTimer = se.staggerTimer;
          player.currentMag = se.currentMag;
          player.reloading = se.reloading;
          player.reloadTimer = se.reloadTimer;
          player.attackCd = se.attackCd;
          if (se.syncInventory) player.inventory = se.syncInventory;
        }
        // Death is always accepted unconditionally
        if (!se.alive) player.alive = false;
        continue;
      }
      // Find existing entity by id
      let existing: Entity | undefined;
      for (let i = 0; i < entities.length; i++) {
        if (entities[i].id === se.id && entities[i] !== player) { existing = entities[i]; break; }
      }
      if (existing) {
        // Lerp position for smooth movement (blend toward target)
        const LERP = 0.4;
        const dx = world.delta(existing.x, se.x);
        const dy = world.delta(existing.y, se.y);
        if (dx * dx + dy * dy < 16) { // only lerp if close (< 4 cells)
          existing.x = world.wrap(existing.x + dx * LERP);
          existing.y = world.wrap(existing.y + dy * LERP);
        } else {
          existing.x = se.x; existing.y = se.y; // teleport if far
        }
        existing.angle = se.angle; existing.pitch = se.pitch;
        existing.alive = se.alive; existing.hp = se.hp; existing.maxHp = se.maxHp;
        // Sync non-simulated cosmetics
        existing.name = se.name; existing.peerSlot = se.peerSlot; existing.netGen = se.netGen;
        existing.sprite = se.sprite; existing.spriteScale = se.spriteScale; existing.weapon = se.weapon; existing.tool = se.tool;
        existing.sex = se.sex as Entity['sex']; existing.npcVisualId = se.npcVisualId;
        existing.faction = se.faction; existing.staggerTimer = se.staggerTimer;
        existing.currentMag = se.currentMag; existing.reloading = se.reloading; existing.reloadTimer = se.reloadTimer; existing.attackCd = se.attackCd;
        existing.speed = se.speed; existing.monsterKind = se.monsterKind;
        existing.inventory = se.dropDefId ? [{ defId: se.dropDefId, count: se.dropCount ?? 1, data: se.dropData }] : undefined;
      } else {
        // New entity — add it
        entities.push({
          id: se.id, type: se.type,
          x: se.x, y: se.y, angle: se.angle, pitch: se.pitch,
          alive: se.alive, hp: se.hp, maxHp: se.maxHp,
          sprite: se.sprite, weapon: se.weapon, tool: se.tool,
          name: se.name, peerSlot: se.peerSlot, netGen: se.netGen,
          sex: se.sex, npcVisualId: se.npcVisualId,
          faction: se.faction, staggerTimer: se.staggerTimer,
          currentMag: se.currentMag, reloading: se.reloading, reloadTimer: se.reloadTimer, attackCd: se.attackCd,
          speed: se.speed, monsterKind: se.monsterKind,
          inventory: se.dropDefId ? [{ defId: se.dropDefId, count: se.dropCount ?? 1, data: se.dropData }] : undefined,
        } as Entity);
      }
    }
    // Remove entities not in sync (except local player)
    for (let i = entities.length - 1; i >= 0; i--) {
      if (entities[i] === player) continue;
      if (!seenIds.has(entities[i].id)) entities.splice(i, 1);
    }
    rebuildEntityIndex(entities, 'load');
  }

  // ── PEER: door state sync from host ──
  if (msgData.type === 'door_sync' && isOnlinePeer() && onlinePeerFloorReady) {
    const doors: { idx: number; state: number }[] = msgData.doors;
    if (doors) {
      for (const ds of doors) {
        const door = world.doors.get(ds.idx);
        if (door && door.state !== ds.state) {
          setDoorState(world, door, ds.state as DoorState);
        }
      }
    }
  }

  // ── PEER: host-authoritative inventory correction (pickup/container) ──
  if (msgData.type === 'peer_inventory_sync' && isOnlinePeer() && onlinePeerFloorReady) {
    player.weapon = typeof msgData.weapon === 'string' ? msgData.weapon : '';
    player.tool = typeof msgData.tool === 'string' ? msgData.tool : '';
    player.money = typeof msgData.money === 'number' ? msgData.money : player.money;
    player.inventory = Array.isArray(msgData.inventory) ? msgData.inventory : undefined;
    notePeerActorState(peerActorSnapshot());
  }

  // ── PEER: host opened/searched a container → show its inventory copy ──
  // The copy lives ONLY in containerById under a fixed synthetic id, so it backs
  // the menu but never enters containerMap/containers (no world mesh, no cell
  // collision). Same "inventory as a synced copy" model the peer already uses.
  if (msgData.type === 'container_open' && isOnlinePeer() && onlinePeerFloorReady) {
    const payload = msgData.container as ContainerSyncPayload | undefined;
    if (payload) {
      const copy = buildRemoteContainer(world, payload, PEER_REMOTE_CONTAINER_ID);
      world.containerById.set(PEER_REMOTE_CONTAINER_ID, copy);
      state.showContainerMenu = true;
      state.containerMenuTarget = PEER_REMOTE_CONTAINER_ID;
      state.containerCursorX = 0;
      state.containerCursorY = 0;
      state.containerSide = 'container';
      _peerRemoteContainerCell = { x: copy.x, y: copy.y };
      syncPauseState();
    }
  }

  // ── PEER: fresh contents for the open container copy (after take/put) ──
  if (msgData.type === 'container_sync' && isOnlinePeer() && onlinePeerFloorReady) {
    const payload = msgData.container as ContainerSyncPayload | undefined;
    if (payload && state.showContainerMenu && state.containerMenuTarget === PEER_REMOTE_CONTAINER_ID &&
        _peerRemoteContainerCell && _peerRemoteContainerCell.x === payload.cx && _peerRemoteContainerCell.y === payload.cy) {
      const copy = buildRemoteContainer(world, payload, PEER_REMOTE_CONTAINER_ID);
      world.containerById.set(PEER_REMOTE_CONTAINER_ID, copy);
      _peerRemoteContainerCell = { x: copy.x, y: copy.y };
    }
  }

  // ── HOST: peer disconnected ──
  if (msgData.type === 'peer_disconnected' && isOnlineHost()) {
    // Remove remote actor for the disconnected peer
    const slot = msgData.slot;
    const idx = entities.findIndex(e => e.peerSlot === slot);
    if (idx >= 0) {
      entities.splice(idx, 1);
      rebuildEntityIndex(entities, 'load');
    }
    _lastPeerActor.delete(slot);
    _peerAckedGen.delete(slot);
    _peerAckedActorGen.delete(slot);
    _peerNextFireAt.delete(slot);
    _peerNextToolAt.delete(slot);
    state.msgs.push(msg(`Игрок ${slot} отключился.`, state.time, '#f88'));
  }

  // ── PEER: host disconnected ──
  if (msgData.type === 'host_disconnected' && isOnlinePeer()) {
    state.msgs.push(msg('Хост отключился. Сессия завершена.', state.time, '#f44'));
    onlinePeerFloorReady = false;
  }

  // ── Server error (room not found, no welcome) ──
  if (msgData.type === 'server_error') {
    onlinePeerFloorReady = false;
    const reason = msgData.reason === 'no_welcome'
      ? 'Комната не найдена — хост не отвечает.'
      : `Ошибка сервера: ${msgData.reason ?? 'неизвестная'}`;
    state.msgs.push(msg(reason, state.time, '#f44'));
  }

  // ── Connection lost ──
  if (msgData.type === 'disconnected') {
    onlinePeerFloorReady = false;
    state.msgs.push(msg('Соединение потеряно.', state.time, '#f44'));
  }
});

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
  if (field === 'feedback') {
    titleMode = 'feedback';
    showTitle();
    return;
  }
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
    { field: 'feedback', label: 'ОБРАТНАЯ СВЯЗЬ', value: 'ТИТРЫ И ТГ', hint: 'Команда разработчиков и комьюнити', selected: selected('feedback') },
  );
  return rows;
}

function playerDemographicSex(source: Partial<Entity>): CharacterSex {
  if (source.sex === 'male' || source.sex === 'female') return sanitizeCharacterSex(source.sex, playerSex);
  if (typeof source.isFemale === 'boolean') return source.isFemale ? 'female' : 'male';
  return playerSex;
}

function playerAlifeFields(source: Partial<Entity> = {}): PlayerAlife {
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
    height: generateHeight(age, sex === 'female'),
  };
}

let pageHiddenPause = smokeDebug ? false : typeof document !== 'undefined' ? document.hidden : false;
let pageHiddenInputCleared = false;
let platformPause = false;
let platformPauseInputCleared = false;

function setPageHiddenPause(hidden: boolean): void {
  if (smokeDebug) hidden = false;
  pageHiddenPause = hidden;
  pageHiddenInputCleared = false;
  setAudioSuspendedForPage(hidden);
  // Tab hidden/closing: flush progress now — the localStorage write is synchronous,
  // so it survives even an outright tab close. Throttled against alt-tab spam.
  if (hidden && performance.now() - lastAutoSaveAt > 15000) autoSaveGame();
  if (!hidden) scheduleResize();
  syncPauseState();
}

function setPlatformPause(paused: boolean): void {
  if (smokeDebug) paused = false;
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
  for (const el of [canvas, hudCanvas, loadingCanvas]) {
    if (!el) continue;
    el.style.width = `${cssWidth}px`;
    el.style.height = `${cssHeight}px`;
    el.style.left = `${cssLeft}px`;
    el.style.top = `${cssTop}px`;
  }
  document.documentElement.style.setProperty('--app-viewport-width', `${cssWidth}px`);
  document.documentElement.style.setProperty('--app-viewport-height', `${cssHeight}px`);
  const PIXEL_SCALE = 2;
  const width = Math.max(1, Math.floor(cssWidth / PIXEL_SCALE));
  const height = Math.max(1, Math.floor(cssHeight / PIXEL_SCALE));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  if (hudCanvas.width !== width) hudCanvas.width = width;
  if (hudCanvas.height !== height) hudCanvas.height = height;
  if (loadingWorker) {
    loadingWorker.postMessage({ type: 'resize', width: cssWidth, height: cssHeight });
  } else if (loadingCanvas) {
    if (loadingCanvas.width !== width) loadingCanvas.width = width;
    if (loadingCanvas.height !== height) loadingCanvas.height = height;
  }
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

/* ── Generate assets (lazy — deferred until first initGame) ───── */
let textures: ReturnType<typeof generateTextures> = [];
let sprites:  ReturnType<typeof generateSprites>  = [];
let assetsReady = false;

function ensureAssets(): void {
  if (assetsReady) return;
  textures = generateTextures();
  sprites  = generateSprites();
  assetsReady = true;
}

/* ── Game initialization ──────────────────────────────────────── */
let world: World;
let entities: Entity[];
let player: Entity;
let state: GameState;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'world', { get: () => world });
  Object.defineProperty(window, 'state', { get: () => state });
  Object.defineProperty(window, 'entities', { get: () => entities });
  Object.defineProperty(window, 'player', { get: () => player });
}
let nextEntityId = { v: 1000000 };
let prevPlayerActorId = -1;
let prevPlayerActorHp = 100; // track current player actor HP changes for damage flash
let lastProjectileHitMsgTick = -999;
let runtimeCamera = createRuntimeCamera();
// Which key-floor cinematics have already played this run. Floors are no longer
// retained in floorMemory, so this bounded set replaces the old "!hasFloorMemory"
// visited proxy that gated one-shot cinematics; persisted (capped) in the save so a
// reload or lift-revisit does not replay them.
const playedCinematicKeys = new Set<string>();
const MAX_PLAYED_CINEMATIC_KEYS = 32;
let pendingLoad: (() => void) | null = null; // deferred heavy generation callback
let pendingLoadAutosave = false; // autosave once this load lands (floor transitions, not fresh inits)
let pendingLoadStarted = false; // true = loading worker was started
let pendingLoadWaitTime = 0;
let pendingLoadAckYielded = 0;
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
  onAudioMuteChange: setAudioSuspendedForPlatformMute,
  onLanguageDetected: (lang: string) => {
    const isRu = lang === 'ru' || lang === 'be' || lang === 'kk' || lang === 'uk' || lang === 'uz';
    const nextLang = isRu ? 'ru' : 'en';
    if (titleLanguageId !== nextLang) {
      titleLanguageId = normalizeTitleLanguageId(nextLang);
      setLocalizationLanguage(titleLanguageId);
    }
  },
});

setNetSphereChatHandler((nickname, text, chatNetGen, createdAt) => {
  if (!isOnlineConnected()) return;

  const ageSec = createdAt ? Math.max(0, (Date.now() - createdAt) / 1000) : 0;

  const isPlayerMatch = chatNetGen 
    ? hashNetGen(player?.netGen || '') === chatNetGen 
    : player?.name === nickname;

  if (isPlayerMatch && player) {
    const duration = Math.max(0, Math.min(6, Math.max(2.5, text.length * 0.12)) - ageSec);
    if (duration > 0) player.activeBark = { text, until: state.time + duration, color: '#cca', skipTranslate: true };
    // Do not return early. In local testing (two tabs), both players share the same netGen.
    // If we return here, the receiver won't attach the bubble to the sender's remote entity.
  }
  if (entities) {
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (e.id === player?.id) continue;
      
      const isEntityMatch = chatNetGen 
        ? hashNetGen(e.netGen || '') === chatNetGen 
        : e.name === nickname;
      
      if ((e.peerSlot !== undefined || e.netGen) && isEntityMatch) {
        const duration = Math.max(0, Math.min(6, Math.max(2.5, text.length * 0.12)) - ageSec);
        if (duration > 0) e.activeBark = { text, until: state.time + duration, color: '#cca', skipTranslate: true };
        break;
      }
    }
  }
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
  return themeForDesignFloor('living');
}

function currentVisualDetailProfile(entry: FloorRunEntry): ResolvedVisualDetailProfile {
  const runSeed = ensureFloorRunState(state).runSeed;
  const seed = entry.spec?.seed ?? runSeed;
  const key = [
    entry.z,
    entry.themeTags,
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
    theme.themeTags,
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

function randomDeathContinuationNpc(random: () => number = rng): Entity | undefined {
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
  const snapshot = randomAliveAlifeNpcSnapshot(state, rng, excluded);
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
  clearPseudoliftActive(state, entities);
  const fromFloor = state.currentZ;
  commitFloorRunEntry(state, targetEntry);
  state.currentZ = targetEntry.z;
  if (targetEntry.themeTags.includes('void')) setVoidEntryFromFloor(state, fromFloor);
  else setVoidEntryFromFloor(state, undefined);
  const floorInstances = ensureFloorInstanceState(state, targetEntry.z);
  floorInstances.current = null;
  floorInstances.lastStableFloor = targetEntry.z;

  scheduleLoading(() => {
    resetNoiseRecords();
    resetGeneratedFloorPopulationState();
    // @ts-ignore
    const loaded = loadFloorForTarget(targetEntry.z, targetEntry);
    const gen = loaded.generation;

    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    let __maxId = 0;
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i].id;
      if (id > __maxId) __maxId = id;
    }
    nextEntityId.v = __maxId + 1;
    materializeCurrentAlifeFloor(snapshot.floorKey);

    let host = getEntityIndex().byAlifeId.get(snapshot.id);
    if (host && (!host.alive || host.type !== EntityType.NPC)) host = undefined;
    host ??= entities.find(e => e.type === EntityType.NPC && e.alifeId === snapshot.id && e.alive);
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

    // Death-continuation: faction↔faction politics persist; only the player's
    // personal standing resets (the reborn body is a new social identity). SB4.
    resetPlayerFactionRelations();
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    applyContractFloorHooks(state, world, entities, nextEntityId, host);
    finalizeDeathContinuationHost(host);
    state.samosborTimer = nextFloorRunSamosborCooldown(state);
    state.samosborActive = false;
    floorTeleportCd = 0;
    resetPsiState();
    clearLiftArachnaActive(state);
    ensureRoomContainers(world, state.currentZ);
    ensureProductionRooms(state, world);
    prepareEditableFloor(undefined, false, !loaded.fromMemory);
    resetMapForLoadedFloor(loaded);
    updateMapExploration(world, player, state);
    restoreVoidReturnPortalForCurrentWorld();
    applyDesignRouteGates(world, player, state);
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
        toFloor: targetEntry.themeTags,
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
    z: state.currentZ,
    playerX: player.x,
    playerY: player.y,
    audibleRadiusMeters: hearingRadiusMetersForActor(player, state.npcLogRadiusMeters),
    dist2: (ax, ay, bx, by) => world.dist2(ax, ay, bx, by),
    entityPosition: entityId => {
      const entity = getEntityIndex().byId.get(entityId);
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
  enteredFromFloor?: number;
  usedAt?: number;
  voidSpikeCarried?: boolean;
  voidSpikeResolved?: boolean;
}

type VoidReturnPortalHost = GameState & {
  voidReturnPortal?: VoidReturnPortalState;
  voidEntryFromFloor?: number;
};

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeVoidReturnPortalState(input: unknown): VoidReturnPortalState | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const src = input as Partial<VoidReturnPortalState>;
  const cell = Math.floor(finiteNumber(src.cell, -1));
  if (cell < 0 || cell >= W * W) return undefined;
  const enteredFromFloor = isValidZ(src.enteredFromFloor) ? src.enteredFromFloor : undefined;
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
  if (isValidZ(value)) host.voidEntryFromFloor = value;
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
  if (targetState.currentZ !== FLOOR_RUN_VOID_Z) return false;
  const entry = currentFloorRunEntry(targetState);
  return !entry || (entry.themeTags.includes('void') && !entry.designFloorId && !entry.spec);
}

function removeCreatorFromResolvedVoid(): void {
  const portal = getVoidReturnPortalState();
  if (!portal?.active || portal.used || !isVoidReturnPortalFloor()) return;
  let writeIdx = 0;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (e.type === EntityType.MONSTER && e.monsterKind === MonsterKind.CREATOR) {
      continue;
    }
    entities[writeIdx++] = e;
  }
  entities.length = writeIdx;
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

function openVoidReturnPortalFromCreator(creator: Entity, enteredFromFloor?: number): void {
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
    z: 200,
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
  restorePlayerBeforeWorldBoundary();
  portal.used = true;
  portal.usedAt = state.time;
  portal.voidSpikeCarried = hasVoidSpike();
  portal.voidSpikeResolved = voidSpikeResolved();

  const fromFloor = state.currentZ;
  captureCurrentAlifeFloor();
  const savedInventory = player.inventory ? [...player.inventory] : [];
  const savedNeeds = player.needs ? { ...player.needs } : freshNeeds();
  const savedHp = player.hp ?? 100;
  const savedMaxHp = player.maxHp ?? 100;
  const savedWeapon = player.weapon ?? '';
  const savedTool = player.tool ?? '';
  const savedRpg = player.rpg ? { ...player.rpg } : freshRPG(1);
  const savedStatuses = player.statuses ? [...player.statuses] : undefined;
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

  state.currentZ = zForBaseFloor(100);
  state.gameWon = false;
  state.gameOver = false;
  resetRuntimeCamera(runtimeCamera);
  clearVoidReturnPortalState(state);
  setVoidEntryFromFloor(state, undefined);
  forceFloorRunStory(state, 100);
  const floorInstances = ensureFloorInstanceState(state, 100);
  floorInstances.current = null;
  floorInstances.lastStableFloor = 100;
  state.msgs.push(msg(
    voidSpikeWasResolved
      ? 'Возврат принят. Последствие осталось в Пустоте. Жилая зона принимает вас обратно.'
      : voidSpikeWasCarried
        ? 'Возврат принят. Пустотный шип вернулся вместе с вами.'
        : 'Возврат принят. Пустота закрыла за вами центр. Жилая зона снова под ногами.',
    state.time,
    '#0f8',
  ));

  scheduleLoading(() => {
    resetGeneratedFloorPopulationState();
    const loaded = loadFloorForTarget(["living"], null);
    const gen = loaded.generation;
    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    let __maxId = 0;
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i].id;
      if (id > __maxId) __maxId = id;
    }
    nextEntityId.v = __maxId + 1;
    materializeCurrentAlifeFloor(currentFloorMemoryKey());

    player = {
      id: nextEntityId.v++,
      type: EntityType.NPC,
      x: gen.spawnX,
      y: gen.spawnY,
      angle: savedAngle,
      pitch: 0,
      alive: true,
      speed: HUMANOID_BASE_MOVE_SPEED,
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
    syncPlayerRuntimeBaselines();

    // Faction relations persist across floor transitions (SB4); only per-cell
    // faction control is rebuilt for the new floor geometry.
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    state.samosborTimer = nextFloorRunSamosborCooldown(state);
    state.samosborActive = false;
    floorTeleportCd = 0;
    resetPsiState();
    clearLiftArachnaActive(state);
    clearPseudoliftActive(state, entities);

    publishEvent(state, {
      type: 'floor_transition',
      z: 100,
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
        toFloor: 100,
        portalCell,
        openedAt,
        openedTick,
        creatorId,
        enteredFromFloor,
        voidSpikeCarried: voidSpikeWasCarried,
        voidSpikeResolved: voidSpikeWasResolved,
      },
    });

    ensureRoomContainers(world, state.currentZ);
    ensureProductionRooms(state, world);
    prepareEditableFloor();
    resetMapForLoadedFloor(loaded);
    updateMapExploration(world, player, state);
    ensureProceduralSpriteSeeds(entities);
    finishLoadedFloorVisuals(gen);
  }, true);
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
  showMenu: boolean;
  showDebug: boolean;
  debugSel: number;
  showQuests: boolean;
  showInventory: boolean;
  showLog: boolean;
  showNpcMenu: boolean;
  showContainerMenu: boolean;
  showCraftMenu: boolean;
  showFactions: boolean;
  showDemos: boolean;
  showHelp: boolean;
  showControls: boolean;
  showUiSettings: boolean;
  showMapLegend: boolean;
  isNetTerminalGenOpen: boolean;
  isInteractableOverlayOpen: boolean;
  isEmergencyPanelMenuOpen: boolean;
  isMapEditorOpen: boolean;
  pageHiddenPause: boolean;
  platformPause: boolean;
  npcMenuSel: number;
  npcMenuTab: GameState['npcMenuTab'];
  mapMode: number;
  mobileControlsEnabled: boolean;
  currentZ: number;
  questCount: number;
  currentObjectiveLine: string;
  currentObjectiveSource: string;
  currentObjectiveTargetPlotNpcId: number | undefined;
  canInteractAhead: boolean;
  interactionPrompt: string;
  interactionPromptEnabled: boolean;
  routeHintsEnabled: boolean;
  playerWeapon: string;
  gameOver: boolean;
  playerAlive: boolean;
  playerHp: number;
  paused: boolean;
  pointerCaptureGate: boolean;
  pointerCaptureGateReason: string;
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
  floorMemoryCount: number;
  floorMemoryCap: number;
  entityIndex: EntityIndexDebugStats;
  ai: AiStats;
  perf: ReturnType<typeof hudPerfDebugSnapshot>;
  tick: number;
  inputFwd: boolean;
  inputInv: boolean;
  inputInteract: boolean;
  currentPlayerId: number;
  playerId: number;
  playerType: EntityType;
}

declare global {
  interface Window {
    __gigahrushSmokeState?: () => SmokeDebugSnapshot | null;
    __gigahrushStressSpawn?: (count: number) => SmokeDebugSnapshot | null;
  }
}

function installSmokeDebugHook(): void {
  if (typeof window === 'undefined') return;
  Object.defineProperty(window, '__debugState', {
    get: () => (typeof state !== 'undefined' ? state : undefined),
    configurable: true,
  });
  Object.defineProperty(window, '__alife', {
    get: () => (typeof state !== 'undefined' ? (state as any).alife : undefined),
    configurable: true,
  });
  Object.defineProperty(window, '__world', {
    get: () => (typeof world !== 'undefined' ? world : undefined),
    configurable: true,
  });
  (window as any).__gigahrushState = () => (typeof state !== 'undefined' ? state : null);
  (window as any).__gigahrushWorld = () => (typeof world !== 'undefined' ? world : null);
  (window as any).__gigahrushEntities = () => (typeof entities !== 'undefined' ? entities : null);
  if (!smokeDebug) return;
  window.__gigahrushSmokeState = () => {
    if (!started || pendingLoad || typeof state === 'undefined') return null;
    return smokeSnapshot();
  };
  window.__gigahrushStressSpawn = (count: number) => {
    if (!started || pendingLoad || typeof state === 'undefined') return null;
    spawnSmokeStressPopulation(count);
    return smokeSnapshot();
  };
}

function interactionTargetAhead(): ReturnType<typeof findInteractionTarget> {
  if (!started || typeof state === 'undefined' || typeof world === 'undefined' || typeof player === 'undefined') return null;
  if (state.gameOver || state.sleeping || isMobileMenuOpen()) return null;
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
    routeHintsVisible: uiElementEnabled('route_hints'),
  });
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
  const memory = floorMemoryStats();
  const objective = getCurrentObjective(state, entities);
  const interaction = interactionTargetAhead();
  return {
      started,
      showMenu: state.showMenu,
      showDebug: state.showDebug,
      debugSel: state.debugSel,
      showQuests: state.showQuests,
      showInventory: state.showInventory,
      showLog: state.showLog,
      showNpcMenu: state.showNpcMenu,
      showContainerMenu: state.showContainerMenu,
      showCraftMenu: state.showCraftMenu,
      showFactions: state.showFactions,
      showDemos: state.showDemos,
      showHelp: state.showHelp,
      showControls: state.showControls,
      showUiSettings: state.showUiSettings,
      showMapLegend: state.showMapLegend,
      isNetTerminalGenOpen: isNetTerminalGenOpen(),
      isInteractableOverlayOpen: isInteractableOverlayOpen(),
      isEmergencyPanelMenuOpen: isEmergencyPanelMenuOpen(),
      isMapEditorOpen: isMapEditorOpen(),
      pageHiddenPause,
      platformPause,
      npcMenuSel: state.npcMenuSel,
      npcMenuTab: state.npcMenuTab,
      mapMode: state.mapMode,
      mobileControlsEnabled: mobileControls?.isEnabled() === true,
      currentZ: state.currentZ,
      questCount: state.quests.length,
      currentObjectiveLine: objective?.line ?? '',
      currentObjectiveSource: objective?.source ?? '',
      currentObjectiveTargetPlotNpcId: objective?.targetNpcId,
      canInteractAhead: interaction !== null,
      interactionPrompt: interaction?.prompt.trim() ?? '',
      interactionPromptEnabled: uiElementEnabled('interaction_prompt'),
      routeHintsEnabled: uiElementEnabled('route_hints'),
      playerWeapon: player.weapon ?? '',
      gameOver: state.gameOver,
      playerAlive: player.alive,
      playerHp: player.hp ?? 0,
      tick: state.tick,
      inputFwd: input.fwd,
      inputInv: input.inv,
      inputInteract: input.interact,
      currentPlayerId: getCurrentPlayerId() ?? -1,
      playerId: player.id,
      playerType: player.type,
      paused: state.paused,
      pointerCaptureGate: pointerCaptureGateVisible(),
      pointerCaptureGateReason: pointerCaptureGateVisible() ? pointerCaptureGateReason : '',
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
      floorMemoryCount: memory.count,
      floorMemoryCap: memory.cap,
      entityIndex: getEntityIndex().getDebugStats(),
      ai: getAiStats(),
      perf: hudPerfDebugSnapshot(displayedFps),
  };
}

function spawnSmokeStressPopulation(count: number): void {
  if (count <= 0) return;
  const requested = Math.max(0, Math.floor(count));
  const target = Math.min(requested, remainingActiveActorSpawnSlots(entities));
  if (target <= 0) return;
  const npcAvailable = entitySpawnSlots(entities, EntityType.NPC, target);
  const monsterAvailable = entitySpawnSlots(entities, EntityType.MONSTER, target);
  let npcBudget = Math.min(npcAvailable, Math.floor(target * 0.7));
  let monsterBudget = Math.min(monsterAvailable, target - npcBudget);
  if (npcBudget + monsterBudget < target) {
    const extraNpc = Math.min(npcAvailable - npcBudget, target - npcBudget - monsterBudget);
    npcBudget += extraNpc;
  }
  if (npcBudget + monsterBudget < target) {
    const extraMonster = Math.min(monsterAvailable - monsterBudget, target - npcBudget - monsterBudget);
    monsterBudget += extraMonster;
  }
  const spawnTarget = npcBudget + monsterBudget;
  if (spawnTarget <= 0) return;
  const monsterKinds = [MonsterKind.ZOMBIE, MonsterKind.TVAR, MonsterKind.SBORKA, MonsterKind.SHADOW];
  let spawned = 0;
  for (let attempt = 0; attempt < spawnTarget * 24 && spawned < spawnTarget; attempt++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * W);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
    if (world.dist2(player.x, player.y, x + 0.5, y + 0.5) < 8 * 8) continue;
    if (npcBudget > 0 && (monsterBudget <= 0 || npcBudget >= monsterBudget)) {
      entities.push({
        id: nextEntityId.v++,
        type: EntityType.NPC,
        x: x + 0.5,
        y: y + 0.5,
        angle: rng() * Math.PI * 2,
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
        ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: rng() * 4, combatScanCd: rng() * 1.5 },
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
        angle: rng() * Math.PI * 2,
        pitch: 0,
        alive: true,
        speed: 1.1,
        sprite: monsterSpr(kind),
        spriteSeed: (state.tick ^ spawned * 1103515245) >>> 0,
        hp: 80,
        maxHp: 80,
        monsterKind: kind,
        attackCd: 0,
        ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: rng() * 4, combatScanCd: rng() * 1.5 },
        rpg: randomRPG(2),
      });
      monsterBudget--;
    }
    spawned++;
  }
  ensureProceduralSpriteSeeds(entities);
  rebuildProceduralSpriteCache(entities);
  state.msgs.push(msg(`SMOKE stress AI: +${spawned}`, state.time, '#8ff'));
}

function setGeneratedDynamicSky(gen?: FloorGeneration): void {
  const sky = (gen as (FloorGeneration & { skyProvider?: DynamicSkyTexture & { update(deltaSeconds: number): boolean } }) | undefined)?.skyProvider ?? null;
  activeSkyProvider = sky;
  setDynamicSkyTexture(sky);
}

function finishLoadedFloorVisuals(gen?: FloorGeneration): void {
  ensureProceduralSpriteSeeds(entities);
  setGeneratedDynamicSky(gen);
  updateWorldData(world);
  rebuildProceduralSpriteCache(entities);
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

function currentRouteLiftDirections(): LiftDirection[] {
  const entry = currentFloorRunEntry(state);
  return floorRunEntryLiftDirections(entry, openRouteGateIds(state));
}

function ensureCurrentRouteLiftLayout(mirror?: FloorRouteLiftMirror, pinnedLiftIdx = -1): void {
  if (getActiveFloorInstance(state)) return;
  ensureFloorRouteLiftLayout(world, player.x, player.y, currentRouteLiftDirections(), {
    countPerDirection: ROUTE_LIFTS_PER_DIRECTION,
    mirror,
    pinnedLiftIdx,
  });
}

/** The route lift cell the player is riding right now: the look cell first (same
 * 1.5-cell probe the `E` dispatcher uses to open the lift), then the 3x3 around
 * them. Departure normalization pins it, and it heads the mirror anchor list, so
 * the return lift on the next floor lands at the player's arrival coordinates. */
function playerRouteLiftIdx(direction: LiftDirection): number {
  const usable = (idx: number): boolean => world.cells[idx] === Cell.LIFT
    && (world.liftDir[idx] as LiftDirection) === direction
    && world.features[idx] !== Feature.MACHINE;
  const lookIdx = world.idx(
    Math.floor(player.x + Math.cos(player.angle) * 1.5),
    Math.floor(player.y + Math.sin(player.angle) * 1.5),
  );
  if (usable(lookIdx)) return lookIdx;
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const idx = world.idx(px + dx, py + dy);
      if (usable(idx)) return idx;
    }
  }
  return -1;
}

function prepareEditableFloor(mirror?: FloorRouteLiftMirror, normalizeRouteLifts = true, replayEditorPatch = true): void {
  if (replayEditorPatch) replayMapEditorForCurrentFloor();
  placeNetTerminalGenContentForCurrentFloor();
  if (normalizeRouteLifts) ensureCurrentRouteLiftLayout(mirror);
  preparePseudoliftForCurrentFloor(world, state);
}

function drawLoading(): void {
  setCanvasTextGlitchPressure();
  currentTip = randomTip();
  drawLoadingScreen(ctx, hudCanvas.width, hudCanvas.height, performance.now(), isFirstBootLoading, '', 0, 0, currentTip);
}

// autosaveAfter=true by default: every load (floor switch, samosbor rebuild/patch,
// void return, death continuation, online snapshot) flushes a save once it lands.
// Pass false ONLY where a save would clobber a real one with a worthless state:
// fresh restart/new game, title flows, and right after loadGame itself.
// (autoSaveGame additionally guards trailer mode / not-started / gameOver.)
function scheduleLoading(fn: () => void, autosaveAfter = true): void {
  pendingLoad = fn;
  pendingLoadAutosave = autosaveAfter;
  pendingLoadStarted = false;
  loadingWorkerAck = false;
  pendingLoadWaitTime = 0;
  pendingLoadAckYielded = 0;
}

function loadingProgress(stage: string, pct: number): void {
  loadingWorker?.postMessage({ type: 'progress', stage, pct });
  // Crash breadcrumb. iOS/WebKit Jetsam can kill the tab mid-generation with
  // ZERO console output, so we cannot see which phase OOMs. Persist the current
  // phase synchronously; a post-crash reload leaves it set (it is only cleared
  // on a fully successful load), so the last value = the phase that died.
  // Diagnose after a crash from the console: localStorage.getItem('gigahrush_loadstage')
  try {
    if (pct >= 100) localStorage.removeItem('gigahrush_loadstage');
    else localStorage.setItem('gigahrush_loadstage', pct + '% ' + stage);
  } catch { /* localStorage unavailable — ignore */ }
}

function initGame(runSeedOverride?: number, initialZ: number = 0, isTutorial: boolean = false): void {
  const _t0 = performance.now();
  resetRuntimeCamera(runtimeCamera);
  clearFloorMemory();
  playedCinematicKeys.clear();
  resetNoiseRecords();
  musicSystem.reset();
  const initialRunSeed = normalizeFloorRunSeed(runSeedOverride);
  const _t1 = performance.now();
  loadingProgress('Рисуем лабиринт этажа', 5);
  const gen = generateFloor(initialZ, initialRunSeed, isTutorial);
  const _t2 = performance.now();
  loadingProgress('Подготовка мира', 50);
  injectFastElevators(gen.world);
  stampCeilingHeights(gen.world);
  world = replaceWorldFromGeneration(null, gen);
  entities = gen.entities;
  let __maxId = 0;
  for (let i = 0; i < entities.length; i++) {
    const id = entities[i].id;
    if (id > __maxId) __maxId = id;
  }
  nextEntityId.v = __maxId + 1;

  player = {
    id: nextEntityId.v++,
    type: EntityType.NPC,
    x: gen.spawnX,
    y: gen.spawnY,
    angle: -Math.PI / 2, // face north — toward slides
    pitch: 0,
    alive: true,
    speed: HUMANOID_BASE_MOVE_SPEED,
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
  syncPlayerRuntimeBaselines();

  // Initialize faction relations and per-cell faction control
  initFactionRelations();
  initFactionControl(world);
  resetGeneratedFloorPopulationState();
  clearRoomMemory();
  resetNpcMemoryStore();
  resetBarkState();
  resetMetroCooldown();
  clearActiveBet();
  resetCombatStimulus();
  resetMonsterBaits();
  resetRouteCueHud();
  resetRumorEvents();

  state = {
    tick: 0,
    time: 0,
    clock: { hour: 8, minute: 0, totalMinutes: 0 },
    samosborActive: false,
    samosborTimer: isTutorial ? 999999 : 120 + rng() * 60,
    samosborCount: 0,
    paused: false,
    gameOver: false,
    showInventory: false,
    mapMode: 0,
    fullMapRadius: FULL_MAP_RADIUS_DEFAULT,
    showQuests: false,
    invSel: 0,
    msgs: [msg('Добро пожаловать в ГИГАХРУЩ. Закройте дверь.', 0, '#aaa', 0)],
    quests: [],
    activeQuestId: undefined,
    nextQuestId: 1,
    currentZ: initialZ,
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
    showCraftMenu: false,
    craftMode: 'craft',
    craftCursor: 0,
    craftFilter: '',
    craftStationKind: 'lathe',
    showDebug: false,
    debugSel: 0,
    showFactions: false,
    factionRankScroll: 0,
    showDemos: false,
    showFeedback: false,
    demosCursor: 0,
    demosSearch: '',
    demosSearchActive: false,
    demosTab: 'profile',
    demosFeedScroll: 0,
    demosPostCursor: 0,
    showLog: false,
    logScroll: 0,
    showHelp: false,
    showControls: false,
    controlView: 'keys',
    controlSel: 0,
    controlScroll: 0,
    showUiSettings: false,
    uiSettingsView: 'interface',
    uiSettingsSel: 0,
    uiSettingsScroll: 0,
    showMapLegend: false,
    mapLegendSel: 0,
    mapLegendScroll: 0,
    npcLogRadiusMeters: 100,
    msgLog: [{ text: 'Добро пожаловать в ГИГАХРУЩ. Закройте дверь.', color: '#aaa', day: 0, hour: 8, minute: 0, z: initialZ, distanceMeters: 0 }],
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
    tutorialMode: isTutorial,
    crafting: createCraftingState(),
    worldEvents: createWorldEventState(),
  };
  clearVoidReturnPortalState(state);
  setVoidEntryFromFloor(state, undefined);
  netReportedSamosborCount = state.samosborCount;
  netDeathReported = false;
  lastAttackFeedbackAt = -999;
  lastProjectileHitMsgTick = -999;
  ensureBankingState(state);
  ensureStockMarketState(state);
  closeNetSphere();
  closeNetTerminalGen();
  resetComputerState();
  resetNetHackState();
  closeMapEditorAndRefreshWorld();
  setFloorRunState(state, { runSeed: initialRunSeed }, initialZ);
  if (runSeedOverride !== undefined) {
    setAlifeState(state, { seed: runSeedOverride });
  }
  state.samosborTimer = nextFloorRunSamosborCooldown(state);
  ensureFloorInstanceState(state, initialZ);
  ensureLiftArachnaState(state);
  ensureNetTerminalGenState(state);
  ensureMapEditorPatchState(state);
  const _t3 = performance.now();
  loadingProgress('Заселяем этаж', 55);
  materializeCurrentAlifeFloor();
  const _t3a = performance.now();
  ensureRoomContainers(world, state.currentZ);
  const _t3b = performance.now();
  ensureProductionRooms(state, world);
  const _t3c = performance.now();
  loadingProgress('Расставляем лифты и двери', 70);
  prepareEditableFloor();
  const _t3d = performance.now();
  resetMapExploration(world);
  updateMapExploration(world, player, state);
  ensureProceduralSpriteSeeds(entities);
  resetPsiState();
  const _t4 = performance.now();

  // Generate assets on first load (runs behind loading screen)
  loadingProgress('Генерируем текстуры', 82);
  ensureAssets();
  const _t5 = performance.now();
  // Initialize / reinitialize WebGL with current world data
  loadingProgress('Запускаем рендер', 90);
  disposeWebGL();
  initWebGL(canvas, textures, sprites, world);
  const _t6 = performance.now();
  loadingProgress('Финальные штрихи', 96);
  finishLoadedFloorVisuals(gen);
  rebuildEntityIndex(entities, 'load');
  // Nav region-tree bake is deferred to the async prewarm in the loading
  // orchestration (gameLoop phase 2), which runs step 4 across the worker pool
  // behind the still-animating loading screen. Baking here synchronously would
  // freeze the main thread ~10 s (and trip the mobile watchdog). See
  // prewarmNavigationTreeAsync.
  loadingProgress('Запекаем карты путей', 98);
  loadingProgress('Готово', 100);
  const _t7 = performance.now();

  console.log(
    `[initGame timing] total=${(_t7-_t0)|0}ms | ` +
    `generateFloor=${(_t2-_t1)|0}ms | ` +
    `stateSetup=${(_t3-_t2)|0}ms | ` +
    `alife=${(_t3a-_t3)|0}ms | ` +
    `roomContainers=${(_t3b-_t3a)|0}ms | ` +
    `productionRooms=${(_t3c-_t3b)|0}ms | ` +
    `editableFloor=${(_t3d-_t3c)|0}ms | ` +
    `mapExploration+rest=${(_t4-_t3d)|0}ms | ` +
    `ensureAssets=${(_t5-_t4)|0}ms | ` +
    `initWebGL=${(_t6-_t5)|0}ms | ` +
    `finishVisuals=${(_t7-_t6)|0}ms`
  );
}

/* ── Input ────────────────────────────────────────────────────── */
const input = createInput();
bindInput(input, canvas, {
  onFullscreenToggle: toggleGameFullscreen,
  shouldRequestPointerLock: () => started,
  shouldHandleGameplayPointer: () => started && typeof state !== 'undefined' && !pendingLoad && !state.paused && !state.gameOver && !pointerCaptureGateVisible(),
  shouldHandleMenuPointer: shouldHandleMenuPointerInput,
  shouldHandleMenuWheel: shouldHandleMenuWheelInput,
  shouldCaptureTextInput: () => started && typeof state !== 'undefined' && state.showDemos && state.demosSearchActive,
});
mobileControls = createMobileControls(input, {
  onGesture: mobileGestureUnlock,
  onMenu: openMobileMenu,
  onConfirm: confirmActiveMobileSelection,
  onClose: closeActiveMobileMenu,
});
const gamepadAdapter: GamepadAdapter = createGamepadAdapter();
const inputFrame: InputFrame = createInputFrame();
document.addEventListener('pointerlockchange', () => {
  input.mouse.locked = canvasHasPointerLock();
  if (input.mouse.locked) {
    clearPointerCaptureGate();
    return;
  }
  if (started && typeof state !== 'undefined' && !state.gameOver) {
    requirePointerCaptureGate('released');
  } else {
    clearPointerCaptureGate();
  }
});
installSmokeDebugHook();

/* ── Toggles (edge-detect) ────────────────────────────────────── */
let prevMap = false, prevDebug = false;
let stepAccum = 0; // footstep sound accumulator
let floorTeleportCd = 0; // prevents anomaly teleport ping-pong
let _prevMsgCount = 0; // for syncing msgs → msgLog
let netReportedSamosborCount = 0;
let netDeathReported = false;
const MSG_LOG_SYNC_DEDUPE_SCAN = 32;

function bootInitialGameOrTitle(): void {
  // Crash breadcrumb readout. The mobile web inspector console is unreliable, so
  // if the previous load died mid-generation (Jetsam OOM, no console output),
  // surface the dying phase here — BEFORE the trailer load below overwrites it.
  // Cleared automatically on any fully successful load, so it only fires after a
  // real crash. Temporary diagnostic; remove once the WebKit crash is pinned.
  try {
    const crashed = localStorage.getItem('gigahrush_loadstage');
    if (crashed) alert('Прошлая загрузка упала на фазе:\n' + crashed);
  } catch { /* localStorage unavailable — ignore */ }
  // Gameplay-heartbeat forensic: if the previous session left the "alive" flag set
  // (no clean pagehide) and a ring, the tab died mid-play — surface the final-seconds
  // trend so it's readable on the phone without devtools. See recordHeartbeat.
  try {
    if (localStorage.getItem('gigahrush_hb_alive') === '1') {
      const raw = localStorage.getItem('gigahrush_hb');
      if (raw) alert('Прошлая сессия оборвалась (краш?). Последние сек:\n' + formatHeartbeatRing(raw));
    }
    localStorage.removeItem('gigahrush_hb_alive');
  } catch { /* localStorage unavailable — ignore */ }
  setAudioSuspendedForTitle(true);
  scheduleLoading(() => {
    const floorZ = TRAILER_ZS[titleTrailerFloorIdx];
    initGame(undefined, floorZ);
    state.trailerMode = true;
    titleStartNeedsInit = true;
  });
  markPlatformReady();
  requestAnimationFrame(gameLoop);
}

bootInitialGameOrTitle();

function sameOptionalNumber(a: number | undefined, b: number | undefined, scale = 1): boolean {
  const aa = Number.isFinite(a) ? Math.round(a! * scale) : undefined;
  const bb = Number.isFinite(b) ? Math.round(b! * scale) : undefined;
  return aa === bb;
}

function msgAlreadyLogged(m: (typeof state.msgs)[number], distanceMeters: number): boolean {
  const start = Math.max(0, state.msgLog.length - MSG_LOG_SYNC_DEDUPE_SCAN);
  for (let i = state.msgLog.length - 1; i >= start; i--) {
    const entry = state.msgLog[i];
    if (entry.text !== m.text || entry.color !== m.color) continue;
    if (entry.day !== m.day || entry.hour !== m.hour || entry.minute !== m.minute) continue;
    if (!sameOptionalNumber(entry.distanceMeters, distanceMeters)) continue;
    const messageFloor = m.z ?? state.currentZ;
    if (entry.z !== undefined && entry.z !== messageFloor) continue;
    if (!sameOptionalNumber(entry.actorId, m.actorId)) continue;
    if (!sameOptionalNumber(entry.targetId, m.targetId)) continue;
    if (!sameOptionalNumber(entry.roomId, m.roomId)) continue;
    if (!sameOptionalNumber(entry.zoneId, m.zoneId)) continue;
    if (!sameOptionalNumber(entry.x, m.x, 10) || !sameOptionalNumber(entry.y, m.y, 10)) continue;
    return true;
  }
  return false;
}

/** Sync new msgs to persistent msgLog with clock timestamps */
function syncMsgLog(): void {
  const msgs = state.msgs;
  if (msgs.length > _prevMsgCount) {
    let writeIdx = _prevMsgCount;
    for (let i = _prevMsgCount; i < msgs.length; i++) {
      const m = msgs[i];
      if (state.tutorialMode) {
        const pid = getCurrentPlayerId() ?? player?.id ?? 0;
        const isForPlayerOrSystem =
          m.actorId === undefined ||
          m.actorId === 0 ||
          m.actorId === pid ||
          m.targetId === 0 ||
          m.targetId === pid ||
          m.text.includes('Вы') ||
          m.text.includes('вас') ||
          m.text.includes('вам') ||
          m.text.includes('Вам') ||
          m.text.includes('Вас');
        if (!isForPlayerOrSystem) continue;
      }
      // Filter out non-player item pickups from stenosvodka until NPC Markov pickup barks are ready
      if (m.text.startsWith('Подобрано:')) {
        const pid = getCurrentPlayerId() ?? player?.id ?? 0;
        const isFromPlayer =
          m.actorId === undefined ||
          m.actorId === 0 ||
          m.actorId === pid;
        if (!isFromPlayer) continue;
      }
      const location = {
        z: m.z ?? state.currentZ,
        x: m.x,
        y: m.y,
        actorId: m.actorId,
        targetId: m.targetId,
        roomId: m.roomId,
        zoneId: m.zoneId,
      };
      const resolvedDistance = m.distanceMeters ?? worldLogDistanceForLocation(location);
      if (!m.hud && !worldLogLocationIsAudible(location, resolvedDistance)) continue;
      const distanceMeters = resolvedDistance ?? worldLogMessageDistance(location);
      m.distanceMeters = distanceMeters;
      msgs[writeIdx++] = m;
      if (msgAlreadyLogged(m, distanceMeters)) continue;
      state.msgLog.push({
        text: m.text,
        color: m.color,
        day: m.day,
        hour: m.hour,
        minute: m.minute,
        z: location.z,
        x: location.x,
        y: location.y,
        actorId: location.actorId,
        targetId: location.targetId,
        roomId: location.roomId,
        zoneId: location.zoneId,
        distanceMeters,
      });
    }
    if (writeIdx < msgs.length) msgs.splice(writeIdx, msgs.length - writeIdx);
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
  if (currentFloorRunEntry(state).themeTags.includes('void')) return { kind: 'void', label: 'Правило Пустоты' };
  if (state.samosborActive) return { kind: 'samosbor', label: 'Самосбор' };
  return { kind: 'hazard', label: 'Неопознанная опасность' };
}

function recordUnattributedPlayerDamage(amount: number): void {
  if (amount <= 0 || hasFreshPlayerDamageRecord(state, state.tick, state.time)) return;
  const source = unattributedPlayerDamageSource();
  recordPlayerDamage(state, undefined, amount, `${source.label}: -${roundPlayerDamage(amount)}`, source.kind);
}

function handlePlayerDeath(deadActor = player): void {
  const deathTime = state.time;
  const cause = formatLastPlayerDamageCause(state, deathTime);
  closeCraftMenu();
  if (deadActor.type === EntityType.NPC && deadActor.alifeId !== undefined) {
    recordAlifeNpcDeath(state, deadActor);
  }
  state.gameOver = true;
  state.deathTimer = 0;
  startDeathCamera(runtimeCamera, deadActor.x, deadActor.y, deadActor.angle);
  state.msgs.push(msg(cause ? `Вы погибли: ${cause}` : 'Вы погибли: источник урона не распознан', state.time, '#f66'));
}

/* ── Door auto-close update ───────────────────────────────────── */
function updateDoors(dt: number): void {
  for (const [, door] of world.doors) {
    if (door.timer > 0) {
      door.timer -= dt;
      if (door.timer <= 0 && (door.state === DoorState.OPEN || door.state === DoorState.HERMETIC_OPEN)) {
        setDoorState(world, door, door.state === DoorState.HERMETIC_OPEN ? DoorState.HERMETIC_CLOSED : DoorState.CLOSED);
      }
    }
  }
}

/* ── Player movement ──────────────────────────────────────────── */
const PLAYER_COLLISION_R = 0.16;
const PLAYER_SPRINT_SPEED_MULT = 2;
const PLAYER_SPRINT_WATER_RATE = 0.24;

function needFraction(value: number): number {
  return Math.max(0, Math.min(1, value / 100));
}

function playerCanOccupy(x: number, y: number, r = PLAYER_COLLISION_R): boolean {
  return canActorOccupy(world, x, y, r);
}

function nudgeBlockedPlayerToFloor(actor = player): void {
  if (isNoClipActive()) return;
  unstuckActorFromBlockers(world, actor, { radius: PLAYER_COLLISION_R, maxCellRadius: 5 });
}

function playerSprintMoveMultiplier(actor: Entity): number {
  const needs = actor.needs;
  if (!input.sprint || !needs) return 1;
  return 1 + (PLAYER_SPRINT_SPEED_MULT - 1) * needFraction(needs.water);
}

function consumePlayerSprintWater(actor: Entity, dt: number, sprintMod: number): void {
  const needs = actor.needs;
  if (!needs) return;
  const sprintLoad = Math.max(0, sprintMod - 1) / Math.max(1, PLAYER_SPRINT_SPEED_MULT - 1);
  needs.water = Math.max(0, needs.water - PLAYER_SPRINT_WATER_RATE * sprintLoad * dt);
}

function applyKnockbackPhysics(dt: number): void {
  const r = 0.3; // generic body radius
  for (const e of entities) {
    if (!e.alive || (!e.vx && !e.vy)) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER && e.id !== player.id) continue;
    
    const canClip = isNoClipActive() && e.id === player.id;
    
    if (e.vx) {
      const nx = e.x + e.vx * dt;
      if (canClip || canActorOccupy(world, nx, e.y, r)) {
        e.x = ((nx % W) + W) % W;
      } else {
        e.vx = 0;
      }
      e.vx *= Math.pow(0.001, dt); // sharp friction
      if (Math.abs(e.vx) < 0.1) e.vx = 0;
    }
    
    if (e.vy) {
      const ny = e.y + e.vy * dt;
      if (canClip || canActorOccupy(world, e.x, ny, r)) {
        e.y = ((ny % W) + W) % W;
      } else {
        e.vy = 0;
      }
      e.vy *= Math.pow(0.001, dt);
      if (Math.abs(e.vy) < 0.1) e.vy = 0;
    }
  }
}

function movePlayer(dt: number): void {
  const actor = player;
  if (!actor.alive) return;
  if (state.sleeping || state.trailerMode) return; // no movement while sleeping or in trailer mode
  floorTeleportCd = Math.max(0, floorTeleportCd - dt);

  if ((actor.staggerTimer ?? 0) > 0) {
    actor.staggerTimer = Math.max(0, (actor.staggerTimer ?? 0) - dt);
  }
  const isStaggered = (actor.staggerTimer ?? 0) > 0;

  // Mouse look
  if (input.mouse.locked) {
    const mouseSensitivity = mouseLookSensitivity();
    actor.angle += input.mouse.dx * 0.003 * mouseSensitivity;
    actor.pitch = Math.max(-PLAYER_PITCH_LIMIT, Math.min(PLAYER_PITCH_LIMIT, actor.pitch - input.mouse.dy * 0.003 * mouseSensitivity));
    input.mouse.dx = 0;
    input.mouse.dy = 0;
  }

  // Keyboard turn
  if (input.left)  actor.angle -= 2.5 * dt;
  if (input.right) actor.angle += 2.5 * dt;
  const padLookX = inputFrame.axes.lookX;
  const padLookY = inputFrame.axes.lookY;
  const touchLookActive = input.touch.lookX !== 0 || input.touch.lookY !== 0;
  const padLookActive = padLookX !== 0 || padLookY !== 0;
  const touchLookSensitivity = touchLookActive ? mobileLookSensitivity() : 0;
  const padLookSensitivity = padLookActive ? mobileLookSensitivity() : 0;
  if (input.touch.lookX !== 0) actor.angle += input.touch.lookX * 3.0 * touchLookSensitivity * dt;
  if (input.touch.lookY !== 0) {
    actor.pitch = Math.max(-PLAYER_PITCH_LIMIT, Math.min(PLAYER_PITCH_LIMIT, actor.pitch - input.touch.lookY * 1.6 * touchLookSensitivity * dt));
  }
  if (padLookX !== 0) actor.angle += padLookX * 3.0 * padLookSensitivity * dt;
  if (padLookY !== 0) {
    actor.pitch = Math.max(-PLAYER_PITCH_LIMIT, Math.min(PLAYER_PITCH_LIMIT, actor.pitch - padLookY * 1.6 * padLookSensitivity * dt));
  }
  actor.pitch = Math.max(-PLAYER_PITCH_LIMIT, Math.min(PLAYER_PITCH_LIMIT, actor.pitch));
  if (actor.id === player.id && isRidingRailTrain(world, player)) return;
  nudgeBlockedPlayerToFloor(actor);

  // Movement
  let mx = 0;
  let my = 0;
  if (!isStaggered) {
    const cos = Math.cos(actor.angle);
    const sin = Math.sin(actor.angle);
    const fwdAxis = Math.max(-1, Math.min(1, (input.fwd ? 1 : 0) - (input.back ? 1 : 0) + input.touch.moveY + inputFrame.axes.moveY));
    const strafeAxis = Math.max(-1, Math.min(1, (input.strafeR ? 1 : 0) - (input.strafeL ? 1 : 0) + input.touch.moveX + inputFrame.axes.moveX));
    mx = cos * fwdAxis - sin * strafeAxis;
    my = sin * fwdAxis + cos * strafeAxis;
    const processionPull = actor.id === player.id ? updateCultProcessionCompulsion(state, world, player, input.interactHeld) : null;
    if (processionPull) {
      mx += processionPull.x * processionPull.strength;
      my += processionPull.y * processionPull.strength;
    }
    const bellPull = actor.id === player.id ? updateIstotitBellCompulsion(world, state, player, input.interactHeld) : null;
    if (bellPull) {
      mx += bellPull.x * bellPull.strength;
      my += bellPull.y * bellPull.strength;
    }
  }

  // Normalize
  const len = Math.sqrt(mx * mx + my * my);
  if (len > 0) {
    const speed = actorMoveSpeed(actor) * dt;
    // Sleep exhaustion reduces speed
    const sleepMod = actor.needs && actor.needs.sleep < 10 ? 0.5 : 1;
    const hazardMod = getCellHazardMoveMultiplier(world, actor);
    const statusMod = zhelemishMoveMult(actor, state.time);
    const coldMod = hladonColdMoveMultiplier(world, actor);
    const toolLightMod = passiveToolLightMoveMultiplier(actor.tool) *
      ((input.use || input.mouseUse) ? activeToolLightMoveMultiplier(actor.tool) : 1);
    const sprintMod = playerSprintMoveMultiplier(actor);
    const moveMod = sleepMod * hazardMod * statusMod * coldMod * toolLightMod * sprintMod;
    mx = mx / len * speed * moveMod;
    my = my / len * speed * moveMod;

    const r = PLAYER_COLLISION_R; // small enough to slide along tight concrete corners
    const canClip = isNoClipActive();
    const beforeX = actor.x;
    const beforeY = actor.y;
    // X/Y are checked separately so fine blockers still allow sliding.
    const nx = actor.x + mx;
    if (canClip || canActorOccupy(world, nx, actor.y, r)) {
      actor.x = ((nx % W) + W) % W;
    }
    const ny = actor.y + my;
    if (canClip || canActorOccupy(world, actor.x, ny, r)) {
      actor.y = ((ny % W) + W) % W;
    }

    if (sprintMod > 1 && (actor.x !== beforeX || actor.y !== beforeY)) consumePlayerSprintWater(actor, dt, sprintMod);

    if (actor.id === player.id && floorTeleportCd <= 0 && world.anomalyTeleports.size > 0) {
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
      publishFootstepNoise(state, actor, moveMod * len > 1.08);
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

function pushAttackFeedback(text: string, color = '#8cf', minInterval = ATTACK_FEEDBACK_MIN_INTERVAL): void {
  if (state.time - lastAttackFeedbackAt < minInterval) return;
  const line = msg(text, state.time, color);
  line.hud = true;
  line.hudPriority = 92;
  state.msgs.push(line);
  lastAttackFeedbackAt = state.time;
}

const meleeHitQuery: Entity[] = [];

function castPlayerPsi(psiId: string, ws: WeaponStats): boolean {
  const cost = ws.psiCost ?? 0;
  if (cost <= 0) return false;
  if (!player.rpg || player.rpg.psi < cost) {
    pushAttackFeedback('Недостаточно ПСИ!', '#f84', 0.3);
    return false;
  }

  player.rpg.psi -= cost;
  if (ws.isRanged) {
    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);
    const spd = ws.projSpeed ?? 14;
    const proj: Entity = {
      id: nextEntityId.v++,
      type: EntityType.PROJECTILE,
      x: player.x + cos * 0.85,
      y: player.y + sin * 0.85,
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
      weapon: psiId,
      spriteScale: 0.3,
      spriteZ: 0.5,
    };
    if (ws.aoeRadius) {
      proj.aoeRadius = ws.aoeRadius;
      proj.aoeDmg = ws.dmg;
    }
    entities.push(proj);
  } else {
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
    makeCurrentPlayer(psiResult.player);
  }

  pushAttackFeedback(ws.isRanged ? 'Выстрел ПСИ.' : 'ПСИ-удар.');
  if (ws.psiEffect === 'beam') playPsiBeam(); else playPsiCast();
  publishWeaponNoise(state, player, psiId, ws);
  return true;
}

/* ── Player actions ───────────────────────────────────────────── */
function handlePlayerInteract(): boolean {
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
      routeHintsVisible: uiElementEnabled('route_hints'),
      switchFloor,
      movePlayerToMetroRoom,
      openNpcMenu,
      openContainerMenu,
      openCraftMenu,
      learnRecipe: learnCraftRecipeFromInteraction,
      openMapEditor,
      playDoor,
      manualItemPickup: !autoPickupEnabled(),
      onPickedDrop: (drop: Entity, pickedItems: readonly Item[] = []) => {
        claimNetTerminalGenFleshDrop(state, drop, player, world);
        recordFactionEventLootTaken(state, world, player, drop);
        applyPickedStoryItemOutcomes(pickedItems, player, entities, state, state.msgs);
      },
    });
    if (result.worldChanged) updateWorldData(world);
    if (result.openedOverlay) syncPauseState();
    input.interact = false;
    return true;
  }
  return false;
}

function handlePlayerAttack(_dt: number): void {
  const wantsAttack = input.attack || input.mouseAttack;
  player.attackCd = Math.max(0, (player.attackCd ?? 0) - _dt);

  const weaponId = equippedCombatItemId(player);
  const ws = getWeaponStats(player, weaponId);

  // Reload Logic
  if (player.reloading) {
    player.reloadTimer = Math.max(0, (player.reloadTimer ?? 0) - _dt);
    if (player.reloadTimer <= 0) {
      if (ws.magazineSize !== Infinity && ws.ammoType) {
        const needed = (ws.magazineSize ?? 1) - (player.currentMag ?? 0);
        if (needed > 0) {
          const available = countAmmo(player, weaponId);
          const actual = Math.min(needed, available);
          if (actual > 0) {
            removeItem(player, ws.ammoType, actual);
            player.currentMag = (player.currentMag ?? 0) + actual;
            publishPlayerItemEvent(state, player, 'ammo_consumed', ws.ammoType, actual, 0);
          }
        }
      } else if (ws.magazineSize === Infinity) {
        player.currentMag = Infinity;
      } else {
        player.currentMag = ws.magazineSize ?? 1; // Melee/Tools
      }
      player.reloading = false;
    }
  }

  // Manual Reload
  if (input.reload && !player.reloading && ((player.currentMag ?? 0) < (ws.magazineSize ?? 1))) {
    if (ws.magazineSize !== Infinity && countAmmo(player, weaponId) > 0) {
      player.reloading = true;
      player.reloadTimer = calculateReloadTime(ws.reloadTime ?? 1, player.rpg?.agi ?? 0);
    } else if (ws.magazineSize === 1) { // melee weapons
      player.reloading = true;
      player.reloadTimer = calculateReloadTime(ws.reloadTime ?? 1, player.rpg?.agi ?? 0);
    }
  }

  // Auto Reload check
  if (wantsAttack && !player.reloading && player.attackCd! <= 0) {
    if (!ws.psiCost && (player.currentMag ?? 0) <= 0 && ws.magazineSize !== Infinity) {
      if (countAmmo(player, weaponId) > 0 || ws.magazineSize === 1) {
        player.reloading = true;
        player.reloadTimer = calculateReloadTime(ws.reloadTime ?? 1, player.rpg?.agi ?? 0);
      } else {
        // can't reload, no ammo
        player.attackCd = 0.5; // stop spam
      }
    }
  }

  if (wantsAttack && player.attackCd! <= 0 && !player.reloading && (ws.psiCost || ws.magazineSize === Infinity || (player.currentMag ?? 0) > 0)) {
    // AGI reduces attack cooldown
    const atkSpeedMod = player.rpg ? agiAttackSpeedMult(player.rpg) : 1;

    if (ws.psiCost) {
      // ── PSI spell: consume PSI instead of ammo ──────────
      player.attackCd = castPlayerPsi(weaponId, ws) ? ws.speed * atkSpeedMod : 0.5;
    } else if (ws.isRanged) {
      // ── Ranged attack: spawn projectile(s) ──────────────
      if (consumeAmmo(player, state, weaponId)) {
        if (ws.projType === ProjType.FLAME) reducePaupsinaWeb(player, state.time, state.msgs, state, player, 'fire');
        if (ws.deletionBeam) {
          const result = fireDeletionBeam(world, entities, player, state, weaponId, ws, handleKill);
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
            const ang = player.angle + (rng() - 0.5) * spread;
            const spd = ws.projSpeed ?? 15;
            const proj: Entity = {
              id: nextEntityId.v++,
              type: EntityType.PROJECTILE,
              x: player.x + cos * 0.85,
              y: player.y + sin * 0.85,
              angle: ang,
              pitch: 0,
              alive: true,
              speed: 0,
              sprite: ws.projSprite ?? Spr.BULLET,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              vz: player.pitch * spd * 0.5 + (pt === ProjType.FLAME ? (rng() - 0.5) * 0.8 : 0),
              projDmg: ws.dmg,
              projLife: pt === ProjType.GRENADE ? 1.5 : pt === ProjType.FLAME ? 0.7 : 3.0,
              ownerId: player.id,
              weapon: weaponId,
              spriteScale: pt === ProjType.BFG ? 0.6 : pt === ProjType.FLAME ? (0.55 + rng() * 0.25) : pt === ProjType.GRENADE ? 0.35 : 0.25,
              spriteZ: 0.5,
              projType: pt,
              projGore: pt === ProjType.GRENADE || pt === ProjType.BFG ? 3
                : (weaponId === 'shotgun' || weaponId === 'chainsaw') ? 3
                : (weaponId === 'ak47' || weaponId === 'machinegun' || weaponId === 'nailgun' || weaponId === 'gauss' || weaponId === 'plasma') ? 2
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
        pushAttackFeedback('Выстрел.');
        playWeaponSound(weaponId, ws);
        publishWeaponNoise(state, player, weaponId, ws);
        notifyLiftArachnaNoise(world, player, state, weaponId);
        player.attackCd = ws.speed * atkSpeedMod;
      } else {
        if (weaponId === 'flamethrower') {
          pushAttackFeedback('Бензин кончился!', '#f84', 0.3);
          publishFuelEmptyEvent(ws.ammoType);
        } else {
          pushAttackFeedback('Нет патронов!', '#f84', 0.3);
        }
        player.attackCd = 0.5;
      }
    } else {
      // ── Melee attack: range check + durability ──────────
      const normalDmg = meleeDamage(player.rpg, weaponId, ws.dmg);
      const range = ws.range;
      const ax = player.x + Math.cos(player.angle) * range;
      const ay = player.y + Math.sin(player.angle) * range;

      let hitSomething = isPaupsinaWebCuttingWeapon(weaponId)
        ? reducePaupsinaWeb(player, state.time, state.msgs, state, player, 'cut')
        : false;
      const entityIndex = getEntityIndex();
      entityIndex.queryRadius(player.x, player.y, range + (ws.hitRadius ?? 0.6) + 0.5, meleeHitQuery, ENTITY_MASK_ACTOR);
      const meleeTarget = selectMeleeTarget(world, player, meleeHitQuery, range, weaponId);
      if (meleeTarget) {
        const e = meleeTarget;
        if (e.hp !== undefined) {
          const rawDmg = debugOnePunchMeleeDamage(e, normalDmg);
          const armor = applyDamage(world, state, e, {
            damage: rawDmg,
            attacker: player,
            weaponId,
          });
          const dmg = armor.damage;
          e.hp -= dmg;
          // Relation penalty for hitting non-hostile NPCs
          if (e.type === EntityType.NPC) {
            applyDamageRelationPenalty(player.faction, e.faction, dmg, e, player, state);
            recordFactionClashPlayerHit(state, world, player, e, dmg);
          }
          notifyActorDamaged(world, e, player, dmg, 'player_melee', state.time, state);
          // Blood splatter on hit — use player facing as velocity direction
          const meleeSpd = 6;
          const mVx = Math.cos(player.angle) * meleeSpd;
          const mVy = Math.sin(player.angle) * meleeSpd;
          spawnBloodHit(world, e.x, e.y, player.angle, dmg, e.type === EntityType.MONSTER, mVx, mVy, 0.5);
          state.msgs.push(msg(`Удар! ${entityDisplayName(e)} -${dmg}`, state.time, '#fc4'));
          if (e.hp <= 0) {
            e.alive = false;
            const meleeGore = (weaponId === 'chainsaw' || weaponId === 'axe') ? 3
              : (weaponId === 'rebar' || weaponId === 'pipe') ? 2 : 1;
            handleKill(e, true, mVx, mVy, meleeGore);
            recordMonsterMeleeDeath(
              world,
              state,
              e,
              weaponId,
              player,
              (target, vx, vy, gore) => handleKill(target, true, vx, vy, gore),
              entities,
            );
          }
        }
        hitSomething = true;
      }

      if (!hitSomething) {
        const attackIdx = world.idx(Math.floor(ax), Math.floor(ay));
        if (world.cells[attackIdx] === Cell.DOOR && world.doors.has(attackIdx)) {
          const door = world.doors.get(attackIdx)!;
          const broke = damageDoor(world, door, normalDmg);
          state.msgs.push(msg(broke ? 'Дверь выбита!' : `Удар по двери! -${normalDmg}`, state.time, broke ? '#4a4' : '#aaa'));
          hitSomething = true;
        }
      }

      if (weaponId === 'chainsaw') playChainsaw(); else playAttack();
      publishWeaponNoise(state, player, weaponId, ws);
      notifyLiftArachnaNoise(world, player, state, weaponId);
      // Consume durability on melee hit
      if (hitSomething) {
        const broke = consumeDurability(player, state.msgs, state.time, state, weaponId);
        if (broke) playBreak();
      }
      if (ws.magazineSize === 1) {
        player.currentMag = 0;
        player.reloading = true;
        player.reloadTimer = calculateReloadTime(ws.reloadTime ?? ws.speed, player.rpg?.agi ?? 0);
        player.attackCd = 0;
      } else if (ws.magazineSize !== Infinity) {
        player.currentMag = Math.max(0, (player.currentMag ?? 1) - 1);
        player.attackCd = ws.speed * atkSpeedMod;
      } else {
        player.attackCd = ws.speed * atkSpeedMod;
      }
    }
  }
}

function playerActions(_dt: number): void {
  if (!player.alive) return;
  if (state.sleeping) return; // no actions while sleeping

  // Pickup (on interact key E, if looking at item drop)
  // Auto-pickup handles walking over items (see tick%15 below)

  // Interact (doors + NPCs)
  if (handlePlayerInteract()) return;

  // Attack (cooldown-based: hold to auto-fire)
  handlePlayerAttack(_dt);
}

function peerLocalMeleeWouldHit(weaponId: string, ws: WeaponStats): boolean {
  const range = ws.range;
  const ax = player.x + Math.cos(player.angle) * range;
  const ay = player.y + Math.sin(player.angle) * range;
  const entityIndex = getEntityIndex();
  entityIndex.queryRadius(player.x, player.y, range + (ws.hitRadius ?? 0.6) + 0.5, meleeHitQuery, ENTITY_MASK_ACTOR);
  if (selectMeleeTarget(world, player, meleeHitQuery, range, weaponId)) return true;
  const attackIdx = world.idx(Math.floor(ax), Math.floor(ay));
  return world.cells[attackIdx] === Cell.DOOR && world.doors.has(attackIdx);
}

function tickPeerLocalCombatResources(dt: number): { fire: boolean; reload: boolean } {
  const wantsAttack = input.attack || input.mouseAttack;
  let fire = false;
  let reload = false;
  player.attackCd = Math.max(0, (player.attackCd ?? 0) - dt);

  const weaponId = equippedCombatItemId(player);
  const ws = getWeaponStats(player, weaponId);

  if (player.reloading) {
    player.reloadTimer = Math.max(0, (player.reloadTimer ?? 0) - dt);
    if (player.reloadTimer <= 0) {
      if (ws.magazineSize !== Infinity && ws.ammoType) {
        const needed = (ws.magazineSize ?? 1) - (player.currentMag ?? 0);
        const actual = Math.min(Math.max(0, needed), countAmmo(player, weaponId));
        if (actual > 0) {
          removeItem(player, ws.ammoType, actual);
          player.currentMag = (player.currentMag ?? 0) + actual;
          publishPlayerItemEvent(state, player, 'ammo_consumed', ws.ammoType, actual, 0);
        }
      } else if (ws.magazineSize === Infinity) {
        player.currentMag = Infinity;
      } else {
        player.currentMag = ws.magazineSize ?? 1;
      }
      player.reloading = false;
      reload = true;
    }
  }

  if (input.reload && !player.reloading && ((player.currentMag ?? 0) < (ws.magazineSize ?? 1))) {
    if (ws.magazineSize !== Infinity && countAmmo(player, weaponId) > 0) {
      player.reloading = true;
      player.reloadTimer = calculateReloadTime(ws.reloadTime ?? 1, player.rpg?.agi ?? 0);
      reload = true;
    } else if (ws.magazineSize === 1) {
      player.reloading = true;
      player.reloadTimer = calculateReloadTime(ws.reloadTime ?? 1, player.rpg?.agi ?? 0);
      reload = true;
    }
  }

  if (wantsAttack && !player.reloading && player.attackCd! <= 0 && !ws.psiCost && (player.currentMag ?? 0) <= 0 && ws.magazineSize !== Infinity) {
    if (countAmmo(player, weaponId) > 0 || ws.magazineSize === 1 || !ws.ammoType) {
      player.reloading = true;
      player.reloadTimer = calculateReloadTime(ws.reloadTime ?? 1, player.rpg?.agi ?? 0);
      reload = true;
    } else {
      player.attackCd = 0.5;
    }
  }

  if (wantsAttack && player.attackCd! <= 0 && !player.reloading && (ws.psiCost || ws.magazineSize === Infinity || (player.currentMag ?? 0) > 0)) {
    const atkSpeedMod = player.rpg ? agiAttackSpeedMult(player.rpg) : 1;
    if (!weaponId) {
      player.attackCd = ws.speed * atkSpeedMod;
      fire = true;
    } else if (ws.psiCost) {
      const cost = ws.psiCost ?? 0;
      if (player.rpg && player.rpg.psi >= cost) {
        player.rpg.psi -= cost;
        player.attackCd = ws.speed * atkSpeedMod;
        fire = true;
      } else {
        player.attackCd = 0.5;
      }
    } else if (ws.isRanged) {
      if (consumeAmmo(player, state, weaponId)) {
        player.attackCd = ws.speed * atkSpeedMod;
        fire = true;
      } else {
        player.attackCd = 0.5;
      }
    } else {
      if (peerLocalMeleeWouldHit(weaponId, ws) && consumeDurability(player, state.msgs, state.time, state, weaponId)) playBreak();
      if (ws.magazineSize === 1) {
        player.currentMag = 0;
        player.reloading = true;
        player.reloadTimer = calculateReloadTime(ws.reloadTime ?? ws.speed, player.rpg?.agi ?? 0);
        player.attackCd = 0;
        reload = true;
      } else if (ws.magazineSize !== Infinity) {
        player.currentMag = Math.max(0, (player.currentMag ?? 1) - 1);
        player.attackCd = ws.speed * atkSpeedMod;
      } else {
        player.attackCd = ws.speed * atkSpeedMod;
      }
      fire = true;
    }
  }

  return { fire, reload };
}

function tickPeerLocalToolResources(dt: number): 'edge' | 'hold' | undefined {
  if (!player.alive) {
    _prevToolUse = input.use || input.mouseUse;
    return undefined;
  }
  if (_toolActionCd > 0) _toolActionCd = Math.max(0, _toolActionCd - dt);
  const toolId = player.tool ?? '';
  const wantsToolUse = input.use || input.mouseUse;
  const useEdge = wantsToolUse && !_prevToolUse;
  _prevToolUse = wantsToolUse;
  if (!toolId) return undefined;
  if (!(player.inventory ?? []).some(item => item.defId === toolId)) { player.tool = ''; return undefined; }

  const passiveLightDrain = passiveToolLightDrainPerSecond(toolId);
  if (passiveLightDrain > 0) {
    consumeToolDurability(player, dt * passiveLightDrain, state.msgs, state.time, state);
    return undefined;
  }
  const activeLightDrain = activeToolLightDrainPerSecond(toolId);
  if (activeLightDrain > 0) {
    if (wantsToolUse) consumeToolDurability(player, dt * activeLightDrain, state.msgs, state.time, state);
    return wantsToolUse ? (useEdge ? 'edge' : 'hold') : undefined;
  }
  const psiToolStats = WEAPON_STATS[toolId]?.psiCost ? getWeaponStats(player, toolId) : undefined;
  if (psiToolStats) {
    if (!wantsToolUse || _toolActionCd > 0) return undefined;
    const cost = psiToolStats.psiCost ?? 0;
    const atkSpeedMod = player.rpg ? agiAttackSpeedMult(player.rpg) : 1;
    if (player.rpg && player.rpg.psi >= cost) {
      player.rpg.psi -= cost;
      _toolActionCd = psiToolStats.speed * atkSpeedMod;
      return useEdge ? 'edge' : 'hold';
    }
    _toolActionCd = 0.5;
    return undefined;
  }
  if (!wantsToolUse || _toolActionCd > 0) return undefined;
  const lookRange = 1.4;
  const tx = player.x + Math.cos(player.angle) * lookRange;
  const ty = player.y + Math.sin(player.angle) * lookRange;
  const cx = Math.floor(tx);
  const cy = Math.floor(ty);
  const ci = world.idx(cx, cy);
  if (toolId === UV_SPOTLIGHT_ID) {
    const charge = getEquippedToolDurability(player);
    if (charge && charge.cur > 0) {
      consumeToolDurability(player, 1, state.msgs, state.time, state);
      _toolActionCd = 0.28;
      return useEdge ? 'edge' : 'hold';
    }
    _toolActionCd = 0.35;
    return undefined;
  }
  if (toolId === CHALK_ITEM_ID) {
    consumeToolDurability(player, 0.1, state.msgs, state.time, state);
    _toolActionCd = 0.04;
    return useEdge ? 'edge' : 'hold';
  }
  if (toolId === 'vacuum') {
    let hasFog = false;
    for (let oy = -1; oy <= 1 && !hasFog; oy++) for (let ox = -1; ox <= 1; ox++) {
      if (world.fog[world.idx(Math.floor(player.x) + ox, Math.floor(player.y) + oy)] > 0) { hasFog = true; break; }
    }
    if (hasFog) consumeToolDurability(player, 1, state.msgs, state.time, state);
    _toolActionCd = 0.15;
    return hasFog ? (useEdge ? 'edge' : 'hold') : undefined;
  }
  if (toolId === 'jackhammer') {
    const canBreak = !world.hermoWall[ci] && !world.aptMask[ci] && world.cells[ci] === Cell.WALL;
    if (canBreak) consumeToolDurability(player, 1, state.msgs, state.time, state);
    _toolActionCd = canBreak ? 0.2 : 0.25;
    return canBreak ? (useEdge ? 'edge' : 'hold') : undefined;
  }
  if (toolId === 'door_kit' && useEdge) {
    const l = world.cells[world.idx(cx - 1, cy)], r = world.cells[world.idx(cx + 1, cy)];
    const u = world.cells[world.idx(cx, cy - 1)], d = world.cells[world.idx(cx, cy + 1)];
    const canPlace = !world.aptMask[ci] && world.cells[ci] === Cell.FLOOR
      && ((l === Cell.WALL && r === Cell.WALL && u !== Cell.WALL && d !== Cell.WALL)
        || (u === Cell.WALL && d === Cell.WALL && l !== Cell.WALL && r !== Cell.WALL));
    if (canPlace) consumeToolDurability(player, 1, state.msgs, state.time, state);
    return canPlace ? 'edge' : undefined;
  }
  if (toolId === 'block_kit' && useEdge) {
    const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
    const canPlace = ci !== pci && !world.aptMask[ci] && !world.hermoWall[ci] && (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.DOOR);
    if (canPlace) consumeToolDurability(player, 1, state.msgs, state.time, state);
    return canPlace ? 'edge' : undefined;
  }
  const cleanupTool = cleanupToolProfile(toolId);
  if (cleanupTool) {
    consumeToolDurability(player, cleanupTool.wear, state.msgs, state.time, state);
    _toolActionCd = cleanupTool.cooldown;
    return useEdge ? 'edge' : 'hold';
  }
  if ((toolId === 'cleaning_kit' || toolId === 'vacuum') && useEdge) return 'edge';
  return undefined;
}

/* ── Drop inventory as ITEM_DROP entities at death position ──── */
function dropEntityInventory(e: Entity): void {
  if (!e.inventory || e.inventory.length === 0) return;
  for (const item of e.inventory) {
    if (!item || item.count <= 0) continue;
    if (!canSpawnEntityType(entities, EntityType.ITEM_DROP)) break;
    entities.push({
      id: nextEntityId.v++, type: EntityType.ITEM_DROP,
      x: e.x + (rng() - 0.5) * 0.5,
      y: e.y + (rng() - 0.5) * 0.5,
      angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
      inventory: [{ defId: item.defId, count: item.count, data: item.data }],
    });
  }
  e.inventory = [];
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
      if (q.targetMonsterKind === undefined && q.targetNpcId === undefined && q.targetNpcId === undefined) return true;
    } else if (e.type === EntityType.NPC) {
      if (q.targetNpcId === e.id) return true;
      if (q.targetNpcId && e.id === q.targetNpcId) return true;
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
  if (isPlayerEntity(e)) {
    const hpBefore = e.id === prevPlayerActorId ? prevPlayerActorHp : (e.maxHp ?? e.hp ?? 100);
    if (absorbPsiShieldDamage(e, hpBefore, state.msgs, state.time) > 0) return;
  }
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
    const dropRng = xorshift32(((state.time * 1000) + e.id) >>> 0);
    const regularLoot = dropMonsterLoot(e, entities, nextEntityId, dropRng);
    if (regularLoot.length > 0) {
      for (const loot of regularLoot) {
        const def = ITEMS[loot.itemDefId];
        state.msgs.push(msg(`С монстра упало: ${def?.name ?? loot.itemDefId}${loot.amount > 1 ? ' ×' + loot.amount : ''}.`, state.time, '#9cf'));
      }
    }
    const rareLoot = killerIsPlayer ? dropMonsterRareLoot(e, entities, nextEntityId, dropRng) : undefined;
    if (rareLoot) {
      const def = ITEMS[rareLoot.itemId];
      state.msgs.push(msg(`На месте боя осталось: ${def?.name ?? rareLoot.itemId}${rareLoot.count > 1 ? ' ×' + rareLoot.count : ''}.`, state.time, '#9cf'));
    }
    spawnStoryDeathDrops(e, killerIsPlayer, entities, nextEntityId, state, state.msgs);
    if (killerIsPlayer) {
      awardXP(player, xpForMonsterKill(e.monsterKind, e.rpg?.level ?? 1), state.msgs, state.time);
    }
    // Herald killed — check if the Podad lower route is now open.
    if (e.monsterKind === MonsterKind.HERALD && killerIsPlayer && currentFloorRunEntry(state).themeTags.includes('hell')) {
      if (onHeraldKilled(e, world, state)) {
        applyDesignRouteGates(world, player, state);
        updateWorldData(world);
      }
    }
    // Creator killed — spawn return portal
    if (e.monsterKind === MonsterKind.CREATOR && killerIsPlayer && currentFloorRunEntry(state).themeTags.includes('void')) {
      if (onCreatorKilled(e, world, state)) {
        checkQuests(player, world, entities, state, state.msgs);
        openVoidReturnPortalFromCreator(e);
        updateWorldData(world);
      }
    }
  } else if (e.type === EntityType.NPC && killerIsPlayer) {
    awardXP(player, xpForNpcKill(e.rpg?.level ?? 1), state.msgs, state.time);
    if (e.id) notifyNpcKill(e.id, state);
  }
  const contentDeath = runContentEntityDeathHooks({ world, entities, player, state, nextEntityId, killed: e, killerIsPlayer });
  if (contentDeath.worldChanged) updateWorldData(world);
}

const FLAME_COLLATERAL_ITEMS = new Set([
  'bread', 'canned', 'rawmeat', 'mushroom_mass', 'infected_mushroom',
  'cloth_roll', 'note', 'book', 'water_coupon', 'filter_layer',
]);

function projectileActor(p: Entity): Entity | undefined {
  if (p.ownerId === player.id) return player;
  return getEntityIndex().byId.get(p.ownerId ?? -1);
}

function isPlayerOwnedProjectile(p: Entity): boolean {
  return p.ownerId === player.id || isPlayerEntity(projectileActor(p));
}

const flameCollateralQuery: Entity[] = [];

function applyFlameBackdraft(x: number, y: number, actor: Entity | undefined): void {
  state.dmgFlash = Math.max(state.dmgFlash, 0.12);
  state.dmgSeed = 3;
  if (actor?.id !== player.id || world.dist2(player.x, player.y, x, y) > 1.6 * 1.6) return;
  if (isDebugOnePunchManEnabled(state)) {
    keepDebugOnePunchManAlive(player, state);
    return;
  }
  player.hp = Math.max(1, (player.hp ?? 1) - 1);
  recordPlayerDamage(state, undefined, 1, 'Обратная тяга: дым и жар в лицо', 'hazard');
  state.msgs.push(msg('Обратная тяга: дым и жар в лицо', state.time, '#f84'));
}

function burnCollateralNearFlame(x: number, y: number, radius: number, actor: Entity | undefined): boolean {
  const r2 = radius * radius;
  getEntityIndex().queryRadius(x, y, radius, flameCollateralQuery, ENTITY_MASK_ITEM_DROP);
  for (let i = 0; i < flameCollateralQuery.length; i++) {
    const drop = flameCollateralQuery[i];
    const inv = drop.inventory;
    if (!drop.alive || drop.type !== EntityType.ITEM_DROP || !inv?.length) continue;
    if (world.dist2(x, y, drop.x, drop.y) > r2) continue;
    let slot = undefined;
    let slotIndex = -1;
    for (let j = 0; j < inv.length; j++) {
      if (FLAME_COLLATERAL_ITEMS.has(inv[j].defId)) {
        slot = inv[j];
        slotIndex = j;
        break;
      }
    }
    if (!slot) continue;
    const def = ITEMS[slot.defId];
    slot.count--;
    if (slot.count <= 0) inv.splice(slotIndex, 1);
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
const PROJECTILE_HIT_QUERY_CAP = 48;
const FLAME_HIT_QUERY_CAP = 64;

function projectilePathDelta(from: number, to: number): number {
  return ((to - from + W / 2) % W + W) % W - W / 2;
}

function projectilePathPoint(from: number, to: number, t: number): number {
  return ((from + projectilePathDelta(from, to) * t) % W + W) % W;
}

function projectilePathHitT(args: { x0: number; y0: number; x1: number; y1: number; e: Entity; radius: number }): number {
  const { x0, y0, x1, y1, e, radius } = args;
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
  const entityIndex = rebuildEntityIndexForSimulation(entities, entityIndexFrame);
  const projectileLimit = entitySoftLimit(EntityType.PROJECTILE);
  if (projectileLimit !== undefined && entityIndex.projectiles.length > projectileLimit) {
    let overflow = entityIndex.projectiles.length - projectileLimit;
    for (const p of entityIndex.projectiles) {
      if (overflow <= 0) break;
      if (p.alive) {
        p.alive = false;
        overflow--;
      }
    }
  }
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
    const prevSpriteZ = p.spriteZ ?? 0.5;
    const vz = p.vz ?? 0;
    const gravity = pt === ProjType.FLAME ? 1.8 : pt === ProjType.GRENADE ? 2.5 : pt === ProjType.BFG ? 0.3 : 1.2;
    p.vz = vz - gravity * dt;
    let nextSpriteZ = prevSpriteZ + vz * dt;
    p.spriteZ = nextSpriteZ;
    let floorHitT = Number.POSITIVE_INFINITY;
    if (nextSpriteZ <= 0 && prevSpriteZ > nextSpriteZ) {
      floorHitT = Math.max(0, Math.min(1, prevSpriteZ / (prevSpriteZ - nextSpriteZ)));
    }
    // Ceiling impact (spriteZ ≥ 1)
    if (nextSpriteZ >= 1.0) {
      p.spriteZ = 1.0;
      nextSpriteZ = 1.0;
      floorHitT = Number.POSITIVE_INFINITY;
      p.vz = 0;
      if (pt === ProjType.BFG) {
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
    const moveX = (p.vx ?? 0) * dt;
    const moveY = (p.vy ?? 0) * dt;
    const wx = wrapWorld(prevX + moveX);
    const wy = wrapWorld(prevY + moveY);
    const wallHit = traceFirstSolidCell(world, prevX, prevY, moveX, moveY);
    const wallHitT = wallHit?.t ?? Number.POSITIVE_INFINITY;
    const blockingT = Math.min(wallHitT, floorHitT, 1);

    // Entity collision — check monsters and NPCs
    const baseDmg = p.projDmg ?? 0;
    const hitRadius = pt === ProjType.FLAME ? 0.8 : 0.6;
    entityIndex.queryPathRadius(prevX, prevY, wx, wy, hitRadius, projectileHitQuery, ENTITY_MASK_ACTOR, pt === ProjType.FLAME ? FLAME_HIT_QUERY_CAP : PROJECTILE_HIT_QUERY_CAP);

    if (pt === ProjType.FLAME) {
      for (const e of projectileHitQuery) {
        if (!e.alive) continue;
        if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC) continue;
        const hitT = projectilePathHitT({ x0: prevX, y0: prevY, x1: wx, y1: wy, e, radius: hitRadius });
        if (hitT <= blockingT + 0.000001) {
          if (processProjectileEntityCollision(p, e, pt, hitT, prevX, wx, prevY, wy, prevSpriteZ, nextSpriteZ, baseDmg)) {
            break;
          }
        }
      }
    } else {
      let nearestHit: Entity | undefined;
      let nearestHitT = Infinity;
      for (const e of projectileHitQuery) {
        if (!e.alive) continue;
        if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC) continue;
        const hitT = projectilePathHitT({ x0: prevX, y0: prevY, x1: wx, y1: wy, e, radius: hitRadius });
        if (hitT <= blockingT + 0.000001 && hitT < nearestHitT) {
          nearestHit = e;
          nearestHitT = hitT;
        }
      }
      if (nearestHit !== undefined && nearestHitT <= blockingT + 0.000001) {
        processProjectileEntityCollision(p, nearestHit, pt, nearestHitT, prevX, wx, prevY, wy, prevSpriteZ, nextSpriteZ, baseDmg);
      }
    }

    if (!p.alive) continue;

    if (wallHit && wallHit.t <= floorHitT + 0.000001) {
      const impactZ = Math.max(0, Math.min(1, prevSpriteZ + (nextSpriteZ - prevSpriteZ) * wallHit.t));
      const impactV = Math.max(0.001, Math.min(0.999, 1.0 - impactZ));
      p.x = wallHit.x;
      p.y = wallHit.y;
      p.spriteZ = impactZ;
      if (pt === ProjType.BFG) {
        triggerExplosion(p, pt);
      } else if (pt === ProjType.GRENADE) {
        p.vx = wallHit.axis === 'x' ? -(p.vx ?? 0) * 0.5 : (p.vx ?? 0) * 0.8;
        p.vy = wallHit.axis === 'y' ? -(p.vy ?? 0) * 0.5 : (p.vy ?? 0) * 0.8;
        p.x = wrapWorld(wallHit.x + (wallHit.axis === 'x' ? -wallHit.stepX * 0.02 : 0));
        p.y = wrapWorld(wallHit.y + (wallHit.axis === 'y' ? -wallHit.stepY * 0.02 : 0));
        playProjectileImpactCue(p, wallHit.x, wallHit.y);
        continue;
      } else {
        if (pt === ProjType.FLAME) resolveFlameCleanup(p, wallHit.x, wallHit.y, 1.0);
        spawnProjectileWallImpact(world, wallHit.cellX, wallHit.cellY, wallHit.u, impactV, p.sprite, pt, wallHit.x, wallHit.y);
        playProjectileImpactCue(p, wallHit.x, wallHit.y);
      }
      if (p.aoeRadius && pt !== ProjType.BFG)
        psiAoeExplosion(p, entities, world, state.msgs, state.time, (e) => handleKill(e, isPlayerOwnedProjectile(p)));
      p.alive = false;
      continue;
    }

    if (floorHitT <= 1) {
      const floorX = wrapWorld(prevX + moveX * floorHitT);
      const floorY = wrapWorld(prevY + moveY * floorHitT);
      p.x = floorX;
      p.y = floorY;
      p.spriteZ = 0;
      if (pt === ProjType.BFG) {
        triggerExplosion(p, pt);
      } else if (pt === ProjType.GRENADE) {
        p.vz = -(p.vz ?? 0) * 0.6;
        p.vx = (p.vx ?? 0) * 0.8;
        p.vy = (p.vy ?? 0) * 0.8;
        p.spriteZ = 0.02;
        if (p.vz > 0.5) playProjectileImpactCue(p, floorX, floorY);
        continue;
      } else {
        if (pt === ProjType.FLAME) resolveFlameCleanup(p, floorX, floorY, 1.0);
        spawnProjectileFloorImpact(world, floorX, floorY, p.sprite, pt);
        playProjectileImpactCue(p, floorX, floorY);
      }
      if (p.aoeRadius)
        psiAoeExplosion(p, entities, world, state.msgs, state.time, (e) => handleKill(e, isPlayerOwnedProjectile(p)));
      p.alive = false;
      continue;
    }

    p.x = wx;
    p.y = wy;
  }
}

function processProjectileEntityCollision(
  p: Entity,
  e: Entity,
  pt: ProjType,
  hitT: number,
  prevX: number,
  wx: number,
  prevY: number,
  wy: number,
  prevSpriteZ: number,
  nextSpriteZ: number,
  baseDmg: number,
): boolean {
  const hitX = projectilePathPoint(prevX, wx, hitT);
  const hitY = projectilePathPoint(prevY, wy, hitT);
  const hitZ = prevSpriteZ + (nextSpriteZ - prevSpriteZ) * hitT;
  if (pt === ProjType.WEB) {
    applyPaupsinaWeb(e, state.time, state.msgs, state, projectileActor(p));
    spawnProjectileBodyImpact(world, hitX, hitY, p.sprite, pt, hitZ);
    playProjectileBodyHitCue(p, e.x, e.y, isPlayerEntity(e));
    p.alive = false;
    return true; // break
  }
  if (pt === ProjType.FLAME) reducePaupsinaWeb(e, state.time, state.msgs, state, projectileActor(p), 'fire');
  if (e.hp !== undefined) {
    const counterplayDmg = adjustMonsterProjectileDamage(e, p, baseDmg);
    const armor = applyDamage(world, state, e, {
      damage: counterplayDmg,
      attacker: projectileActor(p),
      weaponId: p.weapon,
      projectileType: pt,
    });
    const dmg = armor.damage;
    const debugImmortalPlayerHit = isPlayerEntity(e) && isDebugOnePunchManEnabled(state);
    if (debugImmortalPlayerHit) {
      keepDebugOnePunchManAlive(e, state);
    } else {
      e.hp -= dmg;
      if (p.x !== undefined && p.y !== undefined) {
        applyHitStaggerAndKnockback(e, p.x, p.y, dmg);
      }
      tryMonsterProjectileStagger(world, state, e, p, player.id);
      if (e.type === EntityType.NPC && isPlayerOwnedProjectile(p)) {
        applyDamageRelationPenalty(player.faction, e.faction, dmg, e, player, state);
        recordFactionClashPlayerHit(state, world, player, e, dmg);
      }
      notifyActorDamaged(world, e, projectileActor(p), dmg, 'projectile', state.time, state);
      const hitAngle = Math.atan2(p.vy ?? 0, p.vx ?? 0);
      spawnBloodHit(world, hitX, hitY, hitAngle, dmg, e.type === EntityType.MONSTER, p.vx ?? 0, p.vy ?? 0, hitZ);
      spawnProjectileBodyImpact(world, hitX, hitY, p.sprite, pt, hitZ);
    }
    const playerHit = isPlayerEntity(e);
    if (playerHit && !debugImmortalPlayerHit) reportPlayerProjectileHit(p, dmg);
    playProjectileBodyHitCue(p, e.x, e.y, playerHit);
    if (!debugImmortalPlayerHit && e.hp <= 0) {
      e.alive = false;
      e.hp = 0;
      handleKill(e, isPlayerOwnedProjectile(p), p.vx ?? 0, p.vy ?? 0, p.projGore ?? 1);
      recordMonsterProjectileDeath(
        world,
        state,
        e,
        p,
        projectileActor(p),
        (target, vx, vy, gore) => handleKill(target, isPlayerOwnedProjectile(p), vx, vy, gore),
        entities,
      );
    }
  }
  if (pt === ProjType.BFG) {
    p.x = hitX;
    p.y = hitY;
    p.spriteZ = hitZ;
    triggerExplosion(p, pt);
  } else if (pt === ProjType.GRENADE) {
    p.vx = -(p.vx ?? 0) * 0.4;
    p.vy = -(p.vy ?? 0) * 0.4;
    p.vz = (p.vz ?? 0) * 0.4;
  } else if (p.aoeRadius) {
    p.x = hitX;
    p.y = hitY;
    p.spriteZ = hitZ;
    psiAoeExplosion(p, entities, world, state.msgs, state.time, (e2) => handleKill(e2, isPlayerOwnedProjectile(p)));
  }
  // Flame projectiles pierce through (don't die on hit)
  if (pt !== ProjType.FLAME && pt !== ProjType.GRENADE) {
    p.alive = false;
    return true; // break
  } else if (pt === ProjType.GRENADE) {
    return true; // break
  }
  return false;
}

/* ── Explosion (grenade / BFG) — AoE damage + scorch decals ──── */
function triggerExplosion(p: Entity, pt: ProjType): void {
  const radius = p.aoeRadius ?? 4;
  const dmg = p.aoeDmg ?? p.projDmg ?? 80;
  const isPlayer = isPlayerOwnedProjectile(p);
  const actor = projectileActor(p);
  spawnExplosionParticles(world, p.x, p.y, radius, pt);

  // AoE damage to all entities in radius
  let hits = 0;
  getEntityIndex().queryRadius(p.x, p.y, radius, explosionHitQuery, ENTITY_MASK_ACTOR);
  for (const e of explosionHitQuery) {
    if (!e.alive) continue;
    if (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER) continue;
    const dx = ((e.x - p.x + W / 2) % W + W) % W - W / 2;
    const dy = ((e.y - p.y + W / 2) % W + W) % W - W / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) continue;
    if (e.hp !== undefined) {
      const falloff = 1 - (dist / radius) * 0.6;
      const rawFinalDmg = Math.round(dmg * falloff);
      const armor = applyDamage(world, state, e, {
        damage: rawFinalDmg,
        attacker: actor,
        weaponId: p.weapon,
        projectileType: pt,
        aoe: true,
      });
      const finalDmg = armor.damage;
      if (isPlayerEntity(e) && isDebugOnePunchManEnabled(state)) {
        keepDebugOnePunchManAlive(e, state);
        hits++;
        continue;
      }
      e.hp -= finalDmg;
      applyHitStaggerAndKnockback(e, p.x, p.y, finalDmg);
      if (isPlayerEntity(e)) {
        const detail = actor && !isPlayerEntity(actor)
          ? `Взрыв от ${entityDisplayName(actor)}: -${finalDmg}`
          : `Взрыв: -${finalDmg}`;
        recordPlayerDamage(state, p, finalDmg, detail, 'projectile');
      }
      // Explosion blast pushes blood outward from epicenter
      const blastVx = dist > 0.1 ? (dx / dist) * 12 : 0;
      const blastVy = dist > 0.1 ? (dy / dist) * 12 : 0;
      spawnBloodHit(world, e.x, e.y, Math.atan2(dy, dx), finalDmg, e.type === EntityType.MONSTER, blastVx, blastVy, 0.4);
      if (e.type === EntityType.NPC && isPlayer) {
        applyDamageRelationPenalty(player.faction, e.faction, finalDmg, e, player, state);
        recordFactionClashPlayerHit(state, world, player, e, finalDmg);
      }
      notifyActorDamaged(world, e, actor, finalDmg, 'explosion', state.time, state);
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
    const ang = (i / debrisCount) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const dist = 0.5 + rng() * (radius * 0.5);
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
      stampMark(world, dcx, dcy, dfx, dfy, 0.12 + rng() * 0.15, markType,
        seed + i + 100, debrisR, debrisG, debrisB, 150 + Math.floor(rng() * 60));
    }
  }

  resolveBreachChargeExplosion(world, state, actor, p.weapon, p.x, p.y, radius);

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
  if (state.gameOver && input.escape) {
    continueDeathAsRandomNpc();
    input.escape = false;
    return;
  }
  if (state.gameOver && input.use) {
    resetRuntimeCamera(runtimeCamera);
    scheduleLoading(() => { initGame(); }, false);
    input.use = false;
  }
}

function movePlayerToMetroRoom(roomDefId: string): boolean {
  const room = world.getRoomByName(roomDefId);
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
  return (cell === Cell.FLOOR || cell === Cell.WATER) && playerCanOccupy(x, y);
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
  invalidateFloorMemory(currentFloorMemoryKey());
  const activeInstance = getActiveFloorInstance(state);
  if (activeInstance) {
    return floorInstanceSamosborReplacementAllowed(activeInstance.id)
      ? generateFloorInstance(activeInstance.id, ensureFloorRunState(state).runSeed, activeInstance.seed)
      : undefined;
  }
  const entry = currentFloorRunEntry(state);
  if (entry.spec) return generateProceduralFloor(entry.spec);
  const runSeed = ensureFloorRunState(state).runSeed;
  if (entry.designFloorId) return generateDesignFloor(entry.designFloorId, runSeed);
  return undefined;
}

function currentSamosborPatchSeed(): number {
  return hashSeed(`samosbor-patch:${currentFloorMemoryKey()}:${state.samosborCount}`, ensureFloorRunState(state).runSeed);
}

function currentRouteLocalSamosborPatchGeneration(patchSeed: number): FloorGeneration | undefined {
  invalidateFloorMemory(currentFloorMemoryKey());
  const activeInstance = getActiveFloorInstance(state);
  if (activeInstance) {
    return floorInstanceSamosborReplacementAllowed(activeInstance.id)
      ? generateFloorInstance(activeInstance.id, patchSeed, activeInstance.seed)
      : undefined;
  }
  const entry = currentFloorRunEntry(state);
  if (entry.spec) return generateProceduralFloor({ ...entry.spec, seed: patchSeed });
  if (entry.designFloorId) return generateDesignFloor(entry.designFloorId, patchSeed);
  return undefined;
}

function currentLocalSamosborPatchGeneration(): FloorGeneration {
  const patchSeed = currentSamosborPatchSeed();
  return currentRouteLocalSamosborPatchGeneration(patchSeed) ?? generateFloor(state.currentZ, patchSeed, state.tutorialMode);
}

function scheduleLocalSamosborPatch(fn: () => void): void {
  scheduleLoading(() => {
    fn();
    syncMapExplorationAfterSamosborWave(world, state);
    updateWorldData(world);
  });
}

function floorTargetAllowsNpcPopulation(entry: ReturnType<typeof currentFloorRunEntry> | null | undefined, z: number): boolean {
  return z !== 200 && (!entry || floorRunEntryAllowsNpcs(entry));
}

function currentFloorAllowsNpcPopulation(): boolean {
  const activeInstance = getActiveFloorInstance(state);
  if (activeInstance) return floorInstanceAllowsNpcs(activeInstance.id);
  return floorTargetAllowsNpcPopulation(currentFloorRunEntry(state), state.currentZ);
}

function captureCurrentAlifeFloor(): void {
  captureAlifeFloorState(state, entities);
}

function materializeCurrentAlifeFloor(floorKey = currentAlifeFloorKey(state)): void {
  if (state) {
    state.time += irand(100, 200);
  }
  materializeAlifeFloorPopulation(state, world, entities, nextEntityId, floorKey);
  normalizeHumanoidBaseMoveSpeeds(entities);
}

function currentFloorMemoryKey(): string {
  const active = getActiveFloorInstance(state);
  if (active?.worldKey) return active.worldKey;
  return floorRunEntryFloorKey(currentFloorRunEntry(state));
}

function floorMemoryKeyForTarget(z: number | readonly string[], entry: FloorRunEntry | null | undefined): string {
  const active = getActiveFloorInstance(state);
  if (!entry && active?.worldKey && active.themeTags === z) return active.worldKey;
  return entry ? floorRunEntryFloorKey(entry) : floorMemoryKeyForStoryFloor(typeof z === 'number' ? z : 0);
}

// Resolve the current live floor's (z, entry) the same way loadGame reconstructs
// its (floor, generatedRunEntry) target, so the delta base regenerated at save
// time is byte-identical to the one regenerated at load time.
function currentFloorTarget(): { z: number | readonly string[]; entry: FloorRunEntry | null } {
  const activeInstance = getActiveFloorInstance(state);
  const runEntry = currentFloorRunEntry(state);
  return {
    z: activeInstance?.themeTags ?? runEntry.themeTags ?? state.currentZ,
    entry: activeInstance ? null : runEntry,
  };
}

function captureCurrentFloorMemory(): void {
  const { z: baseZ, entry: baseEntry } = currentFloorTarget();
  captureFloorMemory(
    currentFloorMemoryKey(),
    world,
    entities,
    player.x,
    player.y,
    state.time,
    state.samosborCount,
    activeSkyProvider ? { skyProvider: activeSkyProvider } : undefined,
    // Delta base: regenerate this floor's pristine geometry so the save stores only
    // the runtime diff. Preserve live module singletons a throwaway regen would
    // clobber (kvartiry uprising state). Lazy — invoked only at save serialization
    // (entryForSave); the transient base World is unreferenced once the delta is
    // computed, before the save JSON.stringify.
    () => withPreservedGenerationRuntime(() => generateFloorForTarget(baseZ, baseEntry).world),
  );
}

function generateFloorForTarget(z: number | readonly string[], entry: FloorRunEntry | null | undefined): FloorGeneration {
  const gen = generateFloorForTargetInner(z, entry);
  injectFastElevators(gen.world);
  stampCeilingHeights(gen.world);
  return gen;
}

function generateFloorForTargetInner(z: number | readonly string[], entry: FloorRunEntry | null | undefined): FloorGeneration {
  const activeInstance = getActiveFloorInstance(state);
  if (!entry && activeInstance?.themeTags === z) {
    return generateFloorInstance(activeInstance.id, ensureFloorRunState(state).runSeed, activeInstance.seed);
  }
  if (entry?.spec) return generateProceduralFloor(entry.spec);
  const runSeed = ensureFloorRunState(state).runSeed;
  if (entry?.designFloorId) return generateDesignFloor(entry.designFloorId, runSeed);
  const targetZ = typeof z === 'number' ? z : (entry?.z ?? 0);
  return generateFloor(targetZ, runSeed, state.tutorialMode);
}

function floorMemoryGenerationExtrasForKey(key: string): Record<string, unknown> | undefined {
  const instanceExtras = floorInstanceGenerationExtrasForKey(key);
  if (instanceExtras) return { ...instanceExtras };
  const designPrefix = 'design:';
  if (!key.startsWith(designPrefix)) return undefined;
  const designId = key.slice(designPrefix.length);
  if (!isDesignFloorId(designId)) return undefined;
  const gen = generateDesignFloor(designId, ensureFloorRunState(state).runSeed) as FloorGeneration & Record<string, unknown>;
  const extras: Record<string, unknown> = {};
  let hasExtras = false;
  for (const extraKey in gen) {
    if (extraKey === 'world' || extraKey === 'entities' || extraKey === 'spawnX' || extraKey === 'spawnY') continue;
    extras[extraKey] = gen[extraKey];
    hasExtras = true;
  }
  return hasExtras ? extras : undefined;
}

function loadFloorForTarget(z: number | readonly string[], entry: FloorRunEntry | null | undefined): FloorMemoryLoad {
  const memoryKey = floorMemoryKeyForTarget(z, entry);
  // Lazy base for a delta-encoded snapshot: the pristine floor regenerated from
  // (z, entry), identical to the save-time base. takeFloorMemory invokes it only
  // when the stored entry is a delta — never on a miss or a full snapshot — so an
  // ordinary load still generates the floor exactly once. No runtime-singleton
  // guard here: a real floor load *wants* fresh module state.
  let memoBase: World | null | undefined;
  const getBase = (): World | null => {
    if (memoBase === undefined) memoBase = generateFloorForTarget(z, entry).world;
    return memoBase;
  };
  const restored = takeFloorMemory(memoryKey, getBase);
  if (restored) {
    // The fast-elevator grid is absolute and deterministic, so re-stamp it on
    // memory-restored floors too (idempotent: same fixed cells every load).
    injectFastElevators(restored.generation.world);
    // Ceiling heights are render-only and not packed into save floor memory, so
    // recompute them on restore (idempotent: derived from the same room data).
    stampCeilingHeights(restored.generation.world);
    return restored;
  }
  return {
    fromMemory: false,
    generation: generateFloorForTarget(z, entry),
  };
}

function resetMapForLoadedFloor(loaded: FloorMemoryLoad): void {
  if (!loaded.fromMemory) resetMapExploration(world);
}

function switchFloor(
  direction: LiftDirection,
  overrideArrivalText?: string,
  overrideArrivalColor?: string,
  allowElevatorAnomaly = true,
  targetZ?: number,
  targetEntry?: FloorRunEntry | null,
  spawnAtDefault = false,
): void {
  closeCraftMenu();
  restorePlayerBeforeWorldBoundary();
  const fromFloor = state.currentZ;
  captureCurrentAlifeFloor();
  // Fast elevator / debug teleport: jump straight to an arbitrary route floor,
  // bypassing single-step route resolution and elevator anomaly machinery.
  const directTargetEntry = targetEntry ?? (targetZ !== undefined ? floorRunEntryForZ(state, targetZ) : null);
  if ((targetZ !== undefined || targetEntry !== undefined) && !directTargetEntry) return;
  const fastTravel = directTargetEntry !== null;
  let nextFloor: number;
  const activeFloorInstance = (allowElevatorAnomaly && !fastTravel) ? getActiveFloorInstance(state) : null;
  let runEntry = fastTravel
    ? directTargetEntry
    : allowElevatorAnomaly
      ? (activeFloorInstance ? currentFloorRunEntry(state) : resolveFloorRunRoute(state, direction))
      : null;

  if (runEntry) {
    nextFloor = runEntry.z;
  } else {
    // Non-lift routes move sequentially by 2 through the Z coordinates
    if (direction === LiftDirection.DOWN) {
      if (state.currentZ <= FLOOR_RUN_VOID_Z) return;
      nextFloor = state.currentZ - 2;
    } else {
      if (state.currentZ >= 34) return; // 34 is Upper Bureau
      nextFloor = state.currentZ + 2;
    }
  }
  resolveLiftArachnaDeparture(world, player, state);
  clearPseudoliftActive(state, entities);
  const liftZoneId = world.zoneMap[world.idx(Math.floor(player.x), Math.floor(player.y))];
  const route = (allowElevatorAnomaly && !fastTravel)
    ? resolveElevatorRoute(state, fromFloor, nextFloor, direction, liftZoneId)
    : { targetFloorZ: nextFloor, activeInstance: null, anomaly: false, leavingInstance: false, exitedInstance: null };
  nextFloor = route.targetFloorZ;
  if (runEntry && (allowElevatorAnomaly || fastTravel)) {
    commitFloorRunEntry(state, runEntry);
  }
  const generatedRunEntry = route.activeInstance ? null : runEntry;
  const intendedRunEntry = route.activeInstance ? currentFloorRunEntry(state) : generatedRunEntry;
  const returnDirection = direction === LiftDirection.DOWN ? LiftDirection.UP : LiftDirection.DOWN;
  if (route.activeInstance) {
    spreadElevatorInstanceRumor(world, entities, player, state, route.activeInstance);
  }
  let departureLiftAnchors: FloorLiftAnchor[] = [];
  if (!activeFloorInstance && runEntry) {
    // The lift under the player must survive normalization and lead the mirror
    // set; otherwise a redistribution pass moves it and the return lift on the
    // next floor is mirrored somewhere the player never stood.
    const usedLiftIdx = playerRouteLiftIdx(direction);
    ensureCurrentRouteLiftLayout(undefined, usedLiftIdx);
    departureLiftAnchors = collectFloorLiftAnchors(world, direction, ROUTE_LIFTS_PER_DIRECTION);
    const usedAnchor = departureLiftAnchors.findIndex(anchor => anchor.liftIdx === usedLiftIdx);
    if (usedAnchor > 0) {
      departureLiftAnchors.unshift(departureLiftAnchors.splice(usedAnchor, 1)[0]);
    }
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
  const savedStatuses = player.statuses ? [...player.statuses] : undefined;
  const savedMoney = player.money ?? 100;

  state.currentZ = nextFloor;
  if (nextFloor === 200) setVoidEntryFromFloor(state, fromFloor);
  else setVoidEntryFromFloor(state, undefined);

  // Defer heavy generation — game loop will show loading screen first
  scheduleLoading(() => {
    loadingProgress('Рисуем лабиринт этажа', 5);
    resetNoiseRecords();
    resetGeneratedFloorPopulationState();
    const loaded = loadFloorForTarget(nextFloor, generatedRunEntry);
    const gen = loaded.generation;

    world = replaceWorldFromGeneration(null, gen);
    entities = gen.entities;
    let __maxId = 0;
    for (let i = 0; i < entities.length; i++) {
      const id = entities[i].id;
      if (id > __maxId) __maxId = id;
    }
    nextEntityId.v = __maxId + 1;
    loadingProgress('Заселяем этаж', 55);
    materializeCurrentAlifeFloor(currentFloorMemoryKey());

    const routeLiftMirror = !activeFloorInstance && !route.activeInstance && generatedRunEntry && departureLiftAnchors.length > 0
      ? { direction: returnDirection, anchors: departureLiftAnchors }
      : undefined;
    // When the ridden lift's return counterpart could not land on the departure
    // coordinates (protected apartment space, or no reachable cell to open into),
    // it is relocated a few cells over — follow it, or the player steps out of a
    // lift with no way back.
    let arrivalX = savedX;
    let arrivalY = savedY;
    if (!route.activeInstance && !getActiveFloorInstance(state)) {
      const layout = ensureFloorRouteLiftLayout(world, savedX, savedY, currentRouteLiftDirections(), {
        countPerDirection: ROUTE_LIFTS_PER_DIRECTION,
        mirror: routeLiftMirror,
      });
      const anchor = routeLiftMirror?.anchors[0];
      const anchorIdx = anchor ? world.idx(anchor.liftX, anchor.liftY) : -1;
      if (layout.primaryAccessIdx >= 0 && layout.primaryLiftIdx !== anchorIdx) {
        arrivalX = (layout.primaryAccessIdx % W) + 0.5;
        arrivalY = ((layout.primaryAccessIdx / W) | 0) + 0.5;
      }
    }
    const spawn = safeSpawnNear(
      spawnAtDefault ? gen.spawnX : arrivalX,
      spawnAtDefault ? gen.spawnY : arrivalY,
      gen.spawnX,
      gen.spawnY,
    );
    player = {
      id: nextEntityId.v++,
      type: EntityType.NPC,
      x: spawn.x,
      y: spawn.y,
      angle: savedAngle,
      pitch: 0,
      alive: true,
      speed: HUMANOID_BASE_MOVE_SPEED,
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
    syncPlayerRuntimeBaselines();

    // Faction relations persist across floor transitions (SB4); only per-cell
    // faction control is rebuilt for the new floor geometry.
    initFactionControl(world);
    ensureProceduralSpriteSeeds(entities);
    state.samosborTimer = nextFloorRunSamosborCooldown(state);
    state.samosborActive = false;
    floorTeleportCd = 0;

    resetPsiState();

    const arrivalText = overrideArrivalText ?? (route.activeInstance
      ? `Лифт ошибся: ${floorInstanceLabel(route.activeInstance)}`
      : route.exitedInstance
        ? `Петля разомкнулась: ${generatedRunEntry?.label ?? 'Неизвестно'}`
        : generatedRunEntry?.procedural || generatedRunEntry?.designFloorId
          ? `Лифт прибыл: ${generatedRunEntry.label}`
          : `Лифт прибыл: Уровень ${formatFloorZ(nextFloor)}`);
    state.msgs.push(msg(
      arrivalText,
      state.time,
      overrideArrivalColor ?? (route.activeInstance ? '#f4a' : route.exitedInstance ? '#8cf' : generatedRunEntry?.color ?? '#aaa'),
    ));
    const arrivalLead = route.activeInstance
      ? `Маршрут прерван: номерной лифт ${floorInstanceLabel(route.activeInstance)}. Возврат: следующий лифт ведет к ${intendedRunEntry ? floorRunEntryLiftLabel(intendedRunEntry) : 'плановому маршруту'}.`
      : generatedRunEntry
        ? floorRunArrivalLead(generatedRunEntry, returnDirection)
        : undefined;
    if (arrivalLead) state.msgs.push(msg(arrivalLead, state.time, route.activeInstance ? '#f4a' : generatedRunEntry?.color ?? '#8cf'));
    const transitionTags = ['floor', 'floor_transition', 'lift', route.activeInstance ? 'elevator_anomaly' : 'normal'];
    if (generatedRunEntry?.designFloorId) transitionTags.push('design_floor', generatedRunEntry.designFloorId);
    if (generatedRunEntry?.spec) transitionTags.push('procedural');
    const tagsToAdd = proceduralAnomalyEventTags(generatedRunEntry?.spec);
    if (tagsToAdd.length > 0) {
      const tagSet = new Set(transitionTags);
      for (const tag of tagsToAdd) {
        if (!tagSet.has(tag)) {
          tagSet.add(tag);
          transitionTags.push(tag);
        }
      }
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
      ? generatedRunEntry.themeTags.includes('hell')
      : nextFloor === 180 && !allowElevatorAnomaly;
    if (!route.activeInstance && enteredStoryHell) {
      onHellArrival(player, state);
      tryCreateVoiceQuest(world, entities, state);
    }
    const enteredStoryVoid = generatedRunEntry
      ? generatedRunEntry.themeTags.includes('void')
      : nextFloor === 200 && !allowElevatorAnomaly;
    if (!route.activeInstance && enteredStoryVoid) onVoidEntry(state);
    loadingProgress('Расставляем лифты и двери', 70);
    ensureRoomContainers(world, state.currentZ);
    ensureProductionRooms(state, world);
    prepareEditableFloor(routeLiftMirror, false, !loaded.fromMemory);
    resetMapForLoadedFloor(loaded);
    updateMapExploration(world, player, state);
    ensureProceduralSpriteSeeds(entities);
    restoreVoidReturnPortalForCurrentWorld();
    applyDesignRouteGates(world, player, state);
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
    loadingProgress('Финальные штрихи', 90);
    finishLoadedFloorVisuals(gen);

    // Auto-trigger cinematic scenes on specific key floors — once per run per floor.
    // Floors are no longer retained in floorMemory, so a bounded played-set (persisted
    // in the save) replaces the old "!hasFloorMemory" been-here-before proxy.
    const cinematicKey = currentFloorMemoryKey();
    if (!playedCinematicKeys.has(cinematicKey)) {
      const isCinematicFloor =
        nextFloor === 100 ||
        nextFloor === 180 ||
        nextFloor === 200 ||
        (generatedRunEntry?.designFloorId as string) === 'liquidatorbase' ||
        (generatedRunEntry?.designFloorId as string) === 'horrorfloor' ||
        (generatedRunEntry?.designFloorId as string) === 'cave_floor' ||
        (generatedRunEntry?.spec?.key && (
          generatedRunEntry.spec.key.includes('liquidatorbase') ||
          generatedRunEntry.spec.key.includes('horrorfloor') ||
          generatedRunEntry.spec.key.includes('cave_floor')
        ));

      if (isCinematicFloor && !activeFloorInstance && !route.activeInstance) {
        if (playedCinematicKeys.size < MAX_PLAYED_CINEMATIC_KEYS) playedCinematicKeys.add(cinematicKey);
        // Preset waypoints (simple flight path from player's starting position)
        const waypoints = [
          [player.x, player.y],
          [player.x + Math.cos(player.angle) * 4, player.y + Math.sin(player.angle) * 4],
          [player.x + Math.cos(player.angle + Math.PI / 4) * 8, player.y + Math.sin(player.angle + Math.PI / 4) * 8]
        ];
        startCinematicCamera(runtimeCamera, player.x, player.y, waypoints);
      }
    }

    // Nav region-tree bake is deferred to the async prewarm in the loading
    // orchestration (gameLoop phase 2), which runs step 4 across the worker
    // pool behind the loading screen instead of freezing the main thread. See
    // initGame note and prewarmNavigationTreeAsync.
    loadingProgress('Запекаем карты путей', 96);
    loadingProgress('Готово', 100);
  }, true);
}

function formatFloorZ(z: number): string {
  return z > 0 ? `+${z}` : `${z}`;
}

function debugTeleportTo(
  targetEntry: FloorRunEntry,
  overrideArrivalText?: string,
  overrideArrivalColor?: string,
): void {
  state.showDebug = false;
  const direction = targetEntry.z < state.currentZ ? LiftDirection.DOWN : LiftDirection.UP;
  const text = overrideArrivalText ?? `[DEBUG] Телепорт: ${targetEntry.label}`;
  const color = overrideArrivalColor ?? targetEntry.color;
  switchFloor(direction, text, color, false, targetEntry.z, targetEntry, true);
}

function debugTeleportToRandomProceduralFloor(): void {
  const run = ensureFloorRunState(state);
  const z = PROCEDURAL_FLOOR_ZS[Math.floor(rng() * PROCEDURAL_FLOOR_ZS.length)];
  const spec: ProceduralFloorSpec = run.specs[proceduralFloorKey(z)] ?? makeProceduralFloorSpec(run.runSeed, z);
  run.specs[spec.key] = spec;
  const entry: FloorRunEntry = {
    z,
    themeTags: spec.themeTags,
    spec,
    procedural: true,
    label: `Этаж ${formatFloorZ(z)}: ${spec.title}`,
    color: spec.anomalyId === 'none' ? '#8cf' : '#c8f',
  };
  debugTeleportTo(entry);
}

function debugTeleportToProceduralAnomaly(anomalyId: FloorAnomalyId): void {
  const spec = forceProceduralFloorAnomaly(state, anomalyId);
  if (!spec) {
    state.msgs.push(msg(`[DEBUG] Нет процедурного этажа для аномалии ${anomalyId}`, state.time, '#f84'));
    return;
  }
  const entry: FloorRunEntry = {
    z: spec.z,
    themeTags: spec.themeTags,
    spec,
    procedural: true,
    label: `Этаж ${formatFloorZ(spec.z)}: ${spec.title}`,
    color: '#c8f',
  };
  debugTeleportTo(entry);
}

function handleDebugCommandAction(action: DebugCommandAction): void {
  switch (action.type) {
    
    case 'teleport_random_procedural_floor':
      debugTeleportToRandomProceduralFloor();
      break;
    case 'teleport_procedural_anomaly':
      debugTeleportToProceduralAnomaly(action.anomalyId);
      break;
    case 'teleport_design_floor': {
      const designFloorId: DesignFloorId = action.id;
      const entry = floorRunEntryForDesignFloor(state, designFloorId) ?? {
        z: action.z,
        themeTags: action.themeTags,
        designFloorId,
        procedural: false,
        label: `Этаж ${formatFloorZ(action.z)}: ${action.label}`,
        color: action.color,
      };
      debugTeleportTo(entry, `[DEBUG] Телепорт: Этаж ${formatFloorZ(action.z)}: ${action.label}`, action.color);
      break;
    }
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
  // Online peer never opens a host-world container locally — the host drives the
  // menu via a `container_open` message with an inventory copy (see handler).
  if (isOnlinePeer()) return;
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

/** Online peer: mirror a container take/put to the host instead of mutating a
 *  host-world container locally. The container copy carries the host cell in its
 *  x/y, so the host resolves the real container there. Contents echo back via
 *  `container_sync`; the peer's own inventory syncs through `entity_sync`. */
function peerContainerActivate(container: WorldContainer): void {
  const idx = state.containerCursorY * INVENTORY_GRID_COLS + state.containerCursorX;
  if (state.containerSide === 'container') {
    const slot = container.inventory[idx];
    if (!slot) { state.msgs.push(msg('Пустой слот.', state.time, '#888')); return; }
    sendPeerAction({ container: { op: 'take', cx: container.x, cy: container.y, slot: idx } });
    state.msgs.push(msg(`Взять: ${ITEMS[slot.defId]?.name ?? slot.defId}`, state.time, '#8f8'));
  } else {
    const slot = player.inventory?.[idx];
    if (!slot) { state.msgs.push(msg('Пустой слот.', state.time, '#888')); return; }
    sendPeerAction({ container: { op: 'put', cx: container.x, cy: container.y, slot: idx } });
    state.msgs.push(msg(`Положить: ${ITEMS[slot.defId]?.name ?? slot.defId}`, state.time, '#8cf'));
  }
}

function closeContainerMenu(): void {
  // Peer: destroy the transient remote container copy and tell the host we closed
  // (symmetric with the inventory-copy model — both sides drop the copy).
  if (isOnlinePeer() && state.containerMenuTarget === PEER_REMOTE_CONTAINER_ID) {
    world.containerById.delete(PEER_REMOTE_CONTAINER_ID);
    if (_peerRemoteContainerCell) {
      sendPeerAction({ container: { op: 'close', cx: _peerRemoteContainerCell.x, cy: _peerRemoteContainerCell.y } });
      _peerRemoteContainerCell = null;
    }
  }
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
  const active: Quest[] = [];
  const done: Quest[] = [];
  for (let i = 0; i < state.quests.length; i++) {
    const q = state.quests[i];
    if (q.done) {
      done.push(q);
    } else {
      active.push(q);
    }
  }
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
  const seen = new Set<string>();
  for (const raw of value) {
    if (out.length >= maxItems) break;
    if (typeof raw !== 'string') continue;
    const clean = raw.slice(0, maxLen);
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
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

function normalizeQuestTargets(q: Quest, raw: Record<string, unknown>): void {
  const targetItem = cleanSaveText(raw.targetItem, '', 64);
  if (targetItem === 'money' || ITEMS[targetItem]) q.targetItem = targetItem;
  if (raw.targetCount !== undefined) q.targetCount = clampInt(raw.targetCount, 1, 1, 999);
  if (typeof raw.targetRoom === 'number' && Number.isFinite(raw.targetRoom)) {
    q.targetRoom = clampInt(raw.targetRoom, -1, -1, 100_000);
  }
  if (isValidZ(raw.targetFloorZ)) q.targetFloorZ = raw.targetFloorZ;
  const targetRoomType = normalizeRoomType(raw.targetRoomType);
  if (targetRoomType !== undefined) q.targetRoomType = targetRoomType;
  const targetRoomDefId = cleanSaveText(raw.targetRoomDefId, '', 96);
  if (targetRoomDefId) q.targetRoomDefId = targetRoomDefId;
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
  if (typeof raw.targetNpcId === 'number' && !Number.isNaN(raw.targetNpcId)) {
    q.targetNpcId = clampInt(raw.targetNpcId, 0, 0, 1_000_000);
  } else if (typeof raw.targetNpcId === 'string' && raw.targetNpcId.length > 0) {
    const numId = getPlotNpcNumericId(raw.targetNpcId)!;
    if (numId !== undefined) q.targetNpcId = numId;
  }
}

function normalizeQuestRewards(q: Quest, raw: Record<string, unknown>): void {
  const rewardItem = cleanSaveText(raw.rewardItem, '', 64);
  if (ITEMS[rewardItem]) q.rewardItem = rewardItem;
  if (raw.rewardCount !== undefined) q.rewardCount = clampInt(raw.rewardCount, 1, 1, 999);
  q.extraRewards = normalizeRewardList(raw.extraRewards);
  if (raw.relationDelta !== undefined) q.relationDelta = clampInt(raw.relationDelta, 0, -100, 100);
  if (raw.difficulty !== undefined) q.difficulty = clampNumber(raw.difficulty, 1, 0, 10);
  if (raw.xpReward !== undefined) q.xpReward = clampInt(raw.xpReward, 0, 0, 100_000);
  if (raw.moneyReward !== undefined) q.moneyReward = clampInt(raw.moneyReward, 0, 0, MAX_SAVE_MONEY);
}

function normalizeQuestMeta(q: Quest, raw: Record<string, unknown>): void {
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
  if (isValidZ(raw.visitFloorZ)) q.visitFloorZ = raw.visitFloorZ;
}

function normalizeQuestHold(q: Quest, raw: Record<string, unknown>): void {
  if (raw.holdSeconds !== undefined) q.holdSeconds = clampInt(raw.holdSeconds, 0, 1, 3600);
  if (raw.holdProgressSeconds !== undefined) q.holdProgressSeconds = clampNumber(raw.holdProgressSeconds, 0, 0, 3600);
  if (raw.holdLastTime !== undefined) q.holdLastTime = clampNumber(raw.holdLastTime, 0, 0, 1_000_000_000);
  if (raw.holdResetOnExit !== undefined) q.holdResetOnExit = raw.holdResetOnExit === true;
  if (raw.holdSpawnMonsters !== undefined) q.holdSpawnMonsters = clampInt(raw.holdSpawnMonsters, 0, 0, 32);
  if (raw.holdSpawnIntervalSeconds !== undefined) q.holdSpawnIntervalSeconds = clampNumber(raw.holdSpawnIntervalSeconds, 1, 1, 600);
  if (raw.holdSpawnMaxAlive !== undefined) q.holdSpawnMaxAlive = clampInt(raw.holdSpawnMaxAlive, 1, 1, 64);
  if (raw.holdSpawnLastTime !== undefined) q.holdSpawnLastTime = clampNumber(raw.holdSpawnLastTime, 0, 0, 1_000_000_000);
}

function normalizeQuestEvents(q: Quest, raw: Record<string, unknown>): void {
  q.eventTags = normalizeStringArray(raw.eventTags);
  const eventData = compactSaveData(raw.eventData);
  if (isRecord(eventData)) q.eventData = eventData;
  q.eventPrivacy = normalizeEventPrivacy(raw.eventPrivacy);
  q.eventSeverity = normalizeEventSeverity(raw.eventSeverity);
  const eventTargetName = cleanSaveText(raw.eventTargetName);
  if (eventTargetName) q.eventTargetName = eventTargetName;
  if (typeof raw.failOnNpcDeathId === 'number' && !Number.isNaN(raw.failOnNpcDeathId)) {
    q.failOnNpcDeathId = clampInt(raw.failOnNpcDeathId, 0, 0, 1_000_000);
  } else if (typeof raw.failOnNpcDeathId === 'string' && raw.failOnNpcDeathId.length > 0) {
    const numId = getPlotNpcNumericId(raw.failOnNpcDeathId);
    if (numId !== undefined) q.failOnNpcDeathId = numId;
  }
  q.abandonsSideQuestIds = normalizeStringArray(raw.abandonsSideQuestIds, 12, 96);
}

function normalizeQuestTimeLimit(q: Quest, raw: Record<string, unknown>, nowMinutes: number): void {
  const timeLimit = raw.timeLimitMinutes === undefined
    ? undefined
    : clampInt(raw.timeLimitMinutes, 0, 1, MAX_QUEST_TIME_LIMIT_MINUTES);
  let expiresAt = raw.expiresAtMinutes === undefined
    ? undefined
    : clampInt(raw.expiresAtMinutes, 0, 0, nowMinutes + MAX_QUEST_TIME_LIMIT_MINUTES);
  if (timeLimit !== undefined) {
    q.timeLimitMinutes = timeLimit;
    if (expiresAt === undefined && !q.done) expiresAt = Math.ceil(nowMinutes + timeLimit);
  }
  if (expiresAt !== undefined) q.expiresAtMinutes = expiresAt;
  if (raw.failed === true) q.failed = true;
}

function isQuestValid(q: Quest): boolean {
  if (!q.done) {
    if (q.type === QuestType.FETCH && !q.targetItem) return false;
    if (q.type === QuestType.VISIT && q.targetRoom === undefined && q.targetRoomDefId === undefined && q.targetRoute === undefined && q.visitFloorZ === undefined) return false;
    if (q.type === QuestType.KILL && q.targetMonsterKind === undefined && !q.targetNpcId && q.killNeeded === undefined) return false;
    if (q.type === QuestType.TALK && q.targetNpcId === undefined && !q.targetNpcId) return false;
  }
  return true;
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
  
  if (typeof raw.giverPlotNpcId === 'number' && !Number.isNaN(raw.giverPlotNpcId)) {
    q.giverId = clampInt(raw.giverPlotNpcId, 0, 0, 1_000_000);
  } else if (typeof raw.giverPlotNpcId === 'string' && raw.giverPlotNpcId.length > 0) {
    const numId = getPlotNpcNumericId(raw.giverPlotNpcId)!;
    if (numId !== undefined) q.giverId = numId;
  }

  normalizeQuestTargets(q, raw);
  normalizeQuestRewards(q, raw);
  normalizeQuestMeta(q, raw);
  normalizeQuestHold(q, raw);
  normalizeQuestEvents(q, raw);
  normalizeQuestTimeLimit(q, raw, nowMinutes);

  if (!isQuestValid(q)) return null;

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

function saveGame(auto = false): void {
  try {
    makeCurrentPlayer(endPsiPossession(entities, player, state.msgs, state.time, 'cancelled'));
    captureCurrentAlifeFloor();
    captureCurrentFloorMemory();
    const data = createGameSavePayload(player, state, world.containers, {
      voidReturnPortal: voidReturnPortalStateForSave(state),
      voidEntryFromFloor: (state as VoidReturnPortalHost).voidEntryFromFloor,
      floorMemory: floorMemoryStateForSave(),
      playedCinematics: [...playedCinematicKeys],
    });
    // The active-floor snapshot above was a transient capture for this save only;
    // drop it so nothing floor-sized is retained (or re-archived) during play.
    clearFloorMemory();
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
    }, totalXpForLevel(player.rpg?.level ?? 1) + (player.rpg?.xp ?? 0), Math.abs(state.currentZ));
    state.msgs.push(msg(auto ? 'Автосохранение' : 'Игра сохранена', state.time, '#4f4'));
  } catch {
    state.msgs.push(msg('Ошибка сохранения!', state.time, '#f44'));
  }
}

// Autosave gate: only mid-run gameplay states. Never the title trailer world,
// a fresh restart after death (the pre-death save stays as the player's fallback)
// or mid-load — those would overwrite a real save with a worthless one.
let lastAutoSaveAt = 0;
function autoSaveGame(): void {
  if (!started || typeof state === 'undefined' || state.trailerMode || state.gameOver || pendingLoad) return;
  lastAutoSaveAt = performance.now();
  saveGame(true);
}

function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      state.msgs.push(msg('Нет сохранения', state.time, '#f84'));
      return false;
    }
    const parsed = safeParseJson(raw);
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
    const savedFloor = isValidZ(dataState.currentZ) ? zForBaseFloor(dataState.currentZ) : (typeof dataState.currentZ === 'number' ? dataState.currentZ : zForBaseFloor(100));
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
    playedCinematicKeys.clear();
    if (Array.isArray(dataState.playedCinematics)) {
      for (const key of dataState.playedCinematics) {
        if (typeof key === 'string' && key && playedCinematicKeys.size < MAX_PLAYED_CINEMATIC_KEYS) {
          playedCinematicKeys.add(key.slice(0, 64));
        }
      }
    }
    const loadedRunEntry = currentFloorRunEntry(state);
    const floor = loadedFloorInstances.current?.themeTags ?? loadedRunEntry.themeTags ?? savedFloor;
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
      resetNpcMemoryStore();
      resetBarkState();
      resetMetroCooldown();
      clearActiveBet();
      resetCombatStimulus();
      resetMonsterBaits();
      const loaded = loadFloorForTarget(floor, generatedRunEntry);
      const gen = loaded.generation;

      world = replaceWorldFromGeneration(null, gen);
      entities = gen.entities;
      let __maxId = 0;
      for (let i = 0; i < entities.length; i++) {
        const id = entities[i].id;
        if (id > __maxId) __maxId = id;
      }
      nextEntityId.v = __maxId + 1;
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
      state.tutorialMode = dataState.tutorialMode === true;
      state.tutorialStep = typeof dataState.tutorialStep === 'number' ? dataState.tutorialStep : undefined;
      state.tutorialExitTimer = typeof dataState.tutorialExitTimer === 'number' ? dataState.tutorialExitTimer : undefined;
      // @ts-ignore
      state.currentZ = floor;
      // @ts-ignore
      setFloorRunState(state, savedFloorRun, floor);
      // @ts-ignore
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
      // Overlay saved faction standing onto the base matrix (initFactionRelations
      // ran above); malformed/absent data leaves the base intact. SB4.
      restoreFactionRelations(dataState.factionRelations);
      // @ts-ignore
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
      if (!loaded.fromMemory && Array.isArray(dataState.containers)) restoreValidContainers(world, state.currentZ, dataState.containers);
      ensureRoomContainers(world, state.currentZ);
      ensureProductionRooms(state, world);
      placeNetTerminalGenContentForCurrentFloor();
      resetMapForLoadedFloor(loaded);
      updateMapExploration(world, player, state);
      ensureProceduralSpriteSeeds(entities);
      restoreVoidReturnPortalForCurrentWorld();
      applyDesignRouteGates(world, player, state);

      state.msgs.push(msg('Игра загружена', state.time, '#4af'));

      // Update WebGL world data after load
      finishLoadedFloorVisuals(gen);
    }, false);
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

  // Immediate penalty when urination starts
  if (!_urinePenaltyStarted) {
    _urinePenaltyStarted = true;
    publishEvent(state, {
      type: 'player_urinated',
      actorId: player.id,
      x: player.x,
      y: player.y,
      roomId: room?.id,
      severity: 1,
      privacy: 'witnessed',
      tags: ['urination'],
    });

    if (!room || room.type !== RoomType.BATHROOM) {
      const ownerFaction = territoryFactionAt(world, player.x, player.y);
      if (ownerFaction !== null) {
        addFactionRel(ownerFaction, Faction.PLAYER, -1);
        addFactionRel(Faction.PLAYER, ownerFaction, -1);
        addKarma(player, -2);
        state.msgs.push(msg('Местные недовольны...', state.time, '#f84'));
      } else {
        addKarma(player, -1);
      }
    }
  }

  if (room && room.type === RoomType.BATHROOM) return; // toilet — no ongoing penalty

  const ownerFaction = territoryFactionAt(world, player.x, player.y);
  if (ownerFaction === null) return;

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
  if (oldCell !== Cell.FLOOR) {
    markNavigationCellsDirty([ci]);
    world.markCellsDirty();
  }
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

function handleUvSpotlightTool(player: Entity, wantsToolUse: boolean): void {
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
}

function handleChalkTool(player: Entity, wantsToolUse: boolean): void {
  if (!wantsToolUse || _toolActionCd > 0) return;
  const def = ITEMS[CHALK_ITEM_ID];
  if (drawEquippedChalkPixel(world, player, def?.durability ?? 0)) {
    consumeToolDurability(player, 0.1, state.msgs, state.time, state);
    _toolActionCd = 0.04;
  } else {
    _toolActionCd = 0.12;
  }
}

function handleCoverSeroburmaline(player: Entity, toolId: string, tx: number, ty: number, useEdge: boolean): boolean {
  if ((toolId === 'cleaning_kit' || toolId === 'vacuum') && useEdge && _toolActionCd <= 0) {
    if (tryCoverSeroburmalineSource(world, player, state, tx, ty, toolId)) {
      updateWorldData(world);
      _toolActionCd = 0.2;
      return true;
    }
  }
  return false;
}

function handleJackhammerTool(player: Entity, wantsToolUse: boolean, cx: number, cy: number, ci: number): void {
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
}

function handleDoorKitTool(player: Entity, useEdge: boolean, cx: number, cy: number, ci: number): void {
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
  markNavigationCellsDirty([ci]);
  world.markCellsDirty();
  world.doors.set(ci, { idx: ci, state: DoorState.CLOSED, roomA, roomB, keyId: '', timer: 0 });
  addRuntimeDoorToRoom(roomA, ci);
  addRuntimeDoorToRoom(roomB, ci);
  updateWorldData(world);
  consumeToolDurability(player, 1, state.msgs, state.time, state);
  state.msgs.push(msg('Дверь установлена', state.time, '#6cf'));
  playDoor();
}

function handleBlockKitTool(player: Entity, useEdge: boolean, ci: number): void {
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
  markNavigationCellsDirty([ci]);
  world.markCellsDirty();
  const room = world.roomAt(player.x, player.y);
  world.wallTex[ci] = room?.wallTex ?? Tex.CONCRETE;
  world.markWallTexDirty();
  updateWorldData(world);
  consumeToolDurability(player, 1, state.msgs, state.time, state);
  state.msgs.push(msg('Блок стены установлен', state.time, '#6cf'));
}

function handleCleanupProfileTool(player: Entity, toolId: string, wantsToolUse: boolean, tx: number, ty: number): boolean {
  const cleanupTool = cleanupToolProfile(toolId);
  if (cleanupTool) {
    if (!wantsToolUse || _toolActionCd > 0) return true;
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
    return true;
  }
  return false;
}

function handleVacuumTool(player: Entity, wantsToolUse: boolean): void {
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

function handlePsiTool(player: Entity, toolId: string, wantsToolUse: boolean): boolean {
  const psiToolStats = WEAPON_STATS[toolId]?.psiCost ? getWeaponStats(player, toolId) : undefined;
  if (psiToolStats) {
    if (!wantsToolUse || _toolActionCd > 0) return true;
    const atkSpeedMod = player.rpg ? agiAttackSpeedMult(player.rpg) : 1;
    _toolActionCd = castPlayerPsi(toolId, psiToolStats) ? psiToolStats.speed * atkSpeedMod : 0.5;
    return true;
  }
  return false;
}

function handleLightDrain(player: Entity, toolId: string, wantsToolUse: boolean, dt: number): boolean {
  const passiveLightDrain = passiveToolLightDrainPerSecond(toolId);
  if (passiveLightDrain > 0) {
    consumeToolDurability(player, dt * passiveLightDrain, state.msgs, state.time, state);
    return true;
  }
  const activeLightDrain = activeToolLightDrainPerSecond(toolId);
  if (activeLightDrain > 0) {
    if (wantsToolUse) consumeToolDurability(player, dt * activeLightDrain, state.msgs, state.time, state);
    return true;
  }
  return false;
}

function handleTargetedTool(player: Entity, toolId: string, wantsToolUse: boolean, useEdge: boolean): void {
  const lookRange = 1.4;
  const tx = player.x + Math.cos(player.angle) * lookRange;
  const ty = player.y + Math.sin(player.angle) * lookRange;
  const cx = Math.floor(tx);
  const cy = Math.floor(ty);
  const ci = world.idx(cx, cy);

  if (handleCoverSeroburmaline(player, toolId, tx, ty, useEdge)) return;
  if (toolId === 'jackhammer') return handleJackhammerTool(player, wantsToolUse, cx, cy, ci);
  if (toolId === 'door_kit') return handleDoorKitTool(player, useEdge, cx, cy, ci);
  if (toolId === 'block_kit') return handleBlockKitTool(player, useEdge, ci);
  if (handleCleanupProfileTool(player, toolId, wantsToolUse, tx, ty)) return;
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

  let hasTool = false;
  const inv = player.inventory;
  if (inv) {
    for (let i = 0, len = inv.length; i < len; i++) {
      if (inv[i].defId === toolId) {
        hasTool = true;
        break;
      }
    }
  }
  if (!hasTool) { player.tool = ''; return; }

  if (handlePsiTool(player, toolId, wantsToolUse)) return;
  if (handleLightDrain(player, toolId, wantsToolUse, dt)) return;

  if (toolId === UV_SPOTLIGHT_ID) return handleUvSpotlightTool(player, wantsToolUse);
  if (toolId === CHALK_ITEM_ID) return handleChalkTool(player, wantsToolUse);
  if (toolId === 'vacuum') return handleVacuumTool(player, wantsToolUse);

  handleTargetedTool(player, toolId, wantsToolUse, useEdge);
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
    const npc = ensureEntityIndex(entities).byId.get(state.npcMenuTarget);
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
      openUiSettingsMenu('audio');
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
    case 'feedback':
      openFeedbackMenu();
      return;
  }
  syncPauseState();
}

function openFeedbackMenu(): void {
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
  state.showDemos = false;
  state.mapMode = 0;
  state.showFeedback = true;
  cancelControlCapture();
  resetMenuRepeats();
  syncPauseState();
  updateMobileContext(true);
}

function closeFeedbackMenu(): void {
  state.showFeedback = false;
  syncPauseState();
  updateMobileContext(true);
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
  if (isOnlinePeer()) {
    // Peer: remove locally + tell host to spawn the drop entity
    const slot = player.inventory?.[state.invSel];
    if (!slot) return;
    const defId = slot.defId;
    const count = slot.count;
    const data = slot.data;
    // Unequip if needed
    const def = ITEMS[defId];
    if (def) {
      const es = itemEquipSlot(def);
      if (es === 'weapon' && player.weapon === defId) player.weapon = '';
      if (es === 'tool' && player.tool === defId) player.tool = '';
    }
    player.inventory!.splice(state.invSel, 1);
    state.msgs.push(msg(`Выброшено: ${def?.name ?? defId}${count > 1 ? ' ×' + count : ''}`, state.time, '#aa6'));
    sendPeerAction(data !== undefined ? { drop: true, defId, count, data } : { drop: true, defId, count });
    return;
  }
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

  let npcQIdx = -1;
  let activeCount = 0;
  for (let i = 0; i < state.quests.length; i++) {
    const q = state.quests[i];
    if (!q.done) {
      if (q.giverId === npc.id) {
        npcQIdx = activeCount;
        break;
      }
      activeCount++;
    }
  }

  if (npcQIdx >= 0) {
    state.npcMenuTab = 'quest';
    state.questPage = npcQIdx;
  }
}

function activateContainerSelection(container: WorldContainer): void {
  if (isOnlinePeer()) { peerContainerActivate(container); return; }
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
      activateNpcCustomMenuOption({
        state, player, npc, entities,
        roomDefIdResolver: (x, y) => world.roomAt(x, y)?.name
      }, option.id);
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
  return Math.max(4, Math.floor((hudCanvas.height - 68 * sy) / Math.max(1, 12 * sy)));
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
  return Math.max(4, Math.floor((hudCanvas.height - 68 * sy) / Math.max(1, 12 * sy)));
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

function applyUiSettingsSelection(index: number, dir = 1): void {
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
  if (row.kind === 'reset_audio') {
    resetAudioSettings();
    syncAudioSettings();
    state.msgs.push(msg('Аудио сброшено по умолчанию', state.time, '#8cf'));
    return;
  }
  if (row.kind === 'master_audio') {
    const enabled = toggleMasterAudioEnabled();
    syncAudioSettings();
    state.msgs.push(msg(`ОБЩИЙ ЗВУК: ${enabled ? 'ВКЛ' : 'ВЫКЛ'}`, state.time, enabled ? '#8cf' : '#fc8'));
    return;
  }
  if (row.kind === 'music_volume') {
    const vol = adjustMusicVolume(dir);
    syncAudioSettings();
    state.msgs.push(msg(`Музыка: ${Math.round(vol * 100)}%`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'sfx_volume') {
    const vol = adjustSfxVolume(dir);
    syncAudioSettings();
    state.msgs.push(msg(`Эффекты: ${Math.round(vol * 100)}%`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'preset') {
    if (applyUiPreset(row.preset.id)) {
      state.msgs.push(msg(`UI пресет: ${row.preset.label}`, state.time, '#8cf'));
    }
    return;
  }
  if (row.kind === 'mobile_sensitivity') {
    const sensitivity = adjustMobileLookSensitivity(dir);
    state.msgs.push(msg(`Мобильный обзор: ${Math.round(sensitivity * 100)}%`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'camera_fov') {
    const fov = adjustCameraFov(dir);
    state.msgs.push(msg(`FOV: ${fov}°`, state.time, '#8cf'));
    return;
  }
  if (row.kind === 'screen_interference') {
    const mode = cycleScreenInterferenceMode(dir);
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
    const mode = cycleVisualGeometryMode(dir);
    state.msgs.push(msg(`3D детализация: ${visualGeometryModeLabel(mode).toLowerCase()}`, state.time, mode === 'off' ? '#fc8' : '#8cf'));
    return;
  }
  if (row.kind === 'lighting_quality') {
    const mode = cycleLightingQualityMode(dir);
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
  if (row.kind === 'critters') {
    const enabled = toggleCrittersEnabled();
    state.msgs.push(msg(`Живность: ${enabled ? 'вкл' : 'выкл'}`, state.time, enabled ? '#8cf' : '#fc8'));
    return;
  }
  if (row.kind === 'element') toggleUiElement(row.element.id);
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

function handleTapControls(y: number, h: number, sy: number): void {
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
}

function handleTapUiSettings(y: number, h: number, sy: number): void {
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
}

function handleTapMenu(x: number, y: number, w: number, h: number, sx: number, sy: number): void {
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
}

function handleTapInventory(x: number, y: number, w: number, h: number, baseSx: number, baseSy: number): void {
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
}

function handleTapCraftMenu(x: number, y: number, w: number, h: number): void {
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
}

function handleTapQuests(x: number, y: number, w: number, h: number, sx: number, sy: number): void {
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
}

function handleTapLog(y: number, h: number, sy: number): void {
  if (y > h - 24 * sy || y < 28 * sy) {
    state.showLog = false;
    syncPauseState();
    return;
  }
  const maxScroll = Math.max(0, state.msgLog.length * 3);
  state.logScroll = y < h / 2
    ? Math.min(maxScroll, state.logScroll + 3)
    : Math.max(0, state.logScroll - 3);
}

function handleTapDemos(x: number, y: number, w: number, h: number, sy: number): void {
  if (y > h - 28 * sy) {
    closeDemosMenu();
    updateMobileContext(true);
    return;
  }
  state.demosSearchActive = false;
  shiftDemosTab(x < w / 2 ? -1 : 1);
  clampDemosPanelState();
}

function handleTapContainerMenu(x: number, y: number, w: number, h: number): void {
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
}

function handleTapNpcMenu(x: number, y: number, w: number, h: number, sx: number, sy: number): void {
  const npc = ensureEntityIndex(entities).byId.get(state.npcMenuTarget);
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
    let total = 0;
    for (let i = 0; i < state.quests.length; i++) {
      if (!state.quests[i].done) total++;
    }
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

  if (state.showFeedback) {
    closeFeedbackMenu();
    return;
  }

  if (state.showControls) {
    handleTapControls(y, h, sy);
  } else if (state.showUiSettings) {
    handleTapUiSettings(y, h, sy);
  } else if (state.showMenu) {
    handleTapMenu(x, y, w, h, sx, sy);
  } else if (state.showInventory) {
    handleTapInventory(x, y, w, h, baseSx, baseSy);
  } else if (state.showCraftMenu) {
    handleTapCraftMenu(x, y, w, h);
  } else if (state.showQuests) {
    handleTapQuests(x, y, w, h, sx, sy);
  } else if (state.showLog) {
    handleTapLog(y, h, sy);
  } else if (state.showDemos) {
    handleTapDemos(x, y, w, h, sy);
  } else if (state.showFactions) {
    state.showFactions = false;
    syncPauseState();
  } else if (state.showContainerMenu) {
    handleTapContainerMenu(x, y, w, h);
  } else if (state.showNpcMenu) {
    handleTapNpcMenu(x, y, w, h, sx, sy);
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
  if (titleMode === 'feedback') {
    if (e.button !== 2) {
      window.open('https://t.me/gigah_rush', '_blank');
    }
    titleMode = 'setup';
    showTitle();
    suppressNextTitleClick = true;
    e.preventDefault();
    e.stopPropagation();
    return;
  }
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

  let simulatedUp = false;
  let simulatedDn = false;
  let simulatedLeft = false;
  let simulatedRight = false;

  if (input.mouse.locked) {
    const MOUSE_NAV_THRESHOLD = 60;
    const absX = Math.abs(input.mouse.menuDx);
    const absY = Math.abs(input.mouse.menuDy);

    if (absX > MOUSE_NAV_THRESHOLD || absY > MOUSE_NAV_THRESHOLD) {
      if (absX > absY) {
        if (input.mouse.menuDx > 0) simulatedRight = true;
        else simulatedLeft = true;
        input.mouse.menuDx = 0;
        input.mouse.menuDy = 0;
      } else {
        if (input.mouse.menuDy > 0) simulatedDn = true;
        else simulatedUp = true;
        input.mouse.menuDy = 0;
        input.mouse.menuDx = 0;
      }
    }
  } else {
    input.mouse.menuDx = 0;
    input.mouse.menuDy = 0;
  }

  const invUp = input.invUp || simulatedUp;
  const invDn = input.invDn || simulatedDn;
  const invLeft = input.invLeft || simulatedLeft;
  const invRight = input.invRight || simulatedRight;

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
  const upEdge = invUp && !prevMenuUp;
  const dnEdge = invDn && !prevMenuDn;
  const leftEdge = invLeft && !prevMenuLeft;
  const rightEdge = invRight && !prevMenuRight;
  const dropEdge = input.drop && !prevDrop;
  const invEdge = input.inv && !prevInvMenu;
  const questEdge = input.questLog && !prevQuestMenu;
  const factionEdge = input.factionMenu && !prevFactionMenu;
  const logEdge = input.logMenu && !prevLogMenu;
  const helpEdge = input.help && !prevHelpMenu;
  const controlsEdge = input.controls && !prevControlsMenu;
  const uiSettingsEdge = input.uiSettings && !prevUiSettingsMenu;
  const dbgEdge = input.debugScreen && !prevDebug;
  const menuUpNav = () => menuRepeatStep('up', invUp, upEdge) || wheelUpEdge;
  const menuDownNav = () => menuRepeatStep('down', invDn, dnEdge) || wheelDnEdge;

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
      const leftNav = menuRepeatStep('left', invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', invRight || input.drop, rightEdge || dropEdge);
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

    const leftEdge = invLeft && !prevMenuLeft;
    const rightEdge = (invRight && !prevMenuRight) || (input.drop && !prevDrop);
    const mapMode = isMapEditorMapMode();
    const wheelZoom = mapMode ? Math.max(-4, Math.min(4, -pointerWheel)) : 0;
    const upNav = mapMode ? menuRepeatStep('up', invUp, upEdge) : menuUpNav();
    const dnNav = mapMode ? menuRepeatStep('down', invDn, dnEdge) : menuDownNav();
    const leftNav = menuRepeatStep('left', invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', invRight || input.drop, rightEdge);

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

    const leftEdge = invLeft && !prevMenuLeft;
    const rightEdge = (invRight && !prevMenuRight) || (input.drop && !prevDrop);
    const upNav = menuUpNav();
    const dnNav = menuDownNav();
    const leftNav = menuRepeatStep('left', invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', invRight || input.drop, rightEdge);
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

  // ── Feedback Menu ────────────────────────────────────────
  if (state.showFeedback) {
    if (acceptEdge) {
      window.open('https://t.me/gigah_rush', '_blank');
    }
    if (acceptEdge || closeEdge) closeFeedbackMenu();
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
      const leftNav = !fixedControlsCommand && mouseSensitivitySelected ? menuRepeatStep('left', invLeft, leftEdge) : false;
      const rightNav = !fixedControlsCommand && mouseSensitivitySelected ? menuRepeatStep('right', invRight, rightEdge) : false;
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
    const leftNav = !fixedUiCommand && menuRepeatStep('left', invLeft, leftEdge);
    const rightNav = !fixedUiCommand && menuRepeatStep('right', invRight || input.drop, rightEdge);

    if (upNav) state.uiSettingsSel = Math.max(0, state.uiSettingsSel - 1);
    if (dnNav) state.uiSettingsSel = Math.min(uiSettingsRowCount(state.uiSettingsView) - 1, state.uiSettingsSel + 1);
    keepUiSettingsSelectionVisible();
    
    if (acceptEdge) {
      applyUiSettingsSelection(state.uiSettingsSel, 1);
    } else if (leftNav) {
      applyUiSettingsSelection(state.uiSettingsSel, -1);
    } else if (rightNav) {
      applyUiSettingsSelection(state.uiSettingsSel, 1);
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
      const npc = ensureEntityIndex(entities).byId.get(state.npcMenuTarget);
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
    const leftNav = menuRepeatStep('left', invLeft, leftEdge);
    const rightNav = menuRepeatStep('right', invRight, rightEdge);
    if (upNav) {
      state.invSel = wrapMenuIndex(state.invSel - INVENTORY_GRID_COLS, MAX_INVENTORY_SLOTS);
    }
    if (dnNav) {
      state.invSel = wrapMenuIndex(state.invSel + INVENTORY_GRID_COLS, MAX_INVENTORY_SLOTS);
    }
    if (leftNav) state.invSel = wrapMenuIndex(state.invSel - 1, MAX_INVENTORY_SLOTS);
    if (rightNav) state.invSel = wrapMenuIndex(state.invSel + 1, MAX_INVENTORY_SLOTS);
    if (acceptEdge) useInventorySelection();
    if (dropEdge) dropInventorySelection();
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
      const leftNav = menuRepeatStep('left', invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', invRight || input.drop, rightEdge || dropEdge);
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
        if (isOnlinePeer()) {
          peerContainerActivate(container);
        } else {
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
  }
  // ── NPC menu navigation ──────────────────────────────────
  else if (state.showNpcMenu) {
    const npc = ensureEntityIndex(entities).byId.get(state.npcMenuTarget);
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
      let totalQ = 0;
      for (let i = 0; i < state.quests.length; i++) {
        if (!state.quests[i].done) totalQ++;
      }
      const upNav = menuUpNav();
      const dnNav = menuDownNav();
      const leftNav = menuRepeatStep('left', invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', invRight || input.drop, rightEdge || dropEdge);
      if (upNav || leftNav) state.questPage = Math.max(0, state.questPage - 1);
      if (dnNav || rightNav) state.questPage = Math.min(Math.max(0, totalQ - 1), state.questPage + 1);
      if (acceptEdge || closeEdge) state.npcMenuTab = 'main';
    } else if (state.npcMenuTab === 'trade') {
      if (npc) {
        const upNav = menuUpNav();
        const dnNav = menuDownNav();
        const leftNav = menuRepeatStep('left', invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', invRight || input.drop, rightEdge || dropEdge);
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
        const leftNav = menuRepeatStep('left', invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', invRight, rightEdge);
        const result = handleDurakInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isDiceGameOpen()) {
        const leftNav = menuRepeatStep('left', invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', invRight, rightEdge);
        const result = handleDiceInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isDominoGameOpen()) {
        const leftNav = menuRepeatStep('left', invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', invRight, rightEdge);
        const result = handleDominoInput({
          state,
          player,
          npc,
          input: { leftNav, rightNav, interactEdge: acceptEdge, dropEdge },
        });
        if (result.closeInterface) closeNpcInteractionInterface(state);
      } else if (npc && isCheckersGameOpen()) {
        const leftNav = menuRepeatStep('left', invLeft, leftEdge);
        const rightNav = menuRepeatStep('right', invRight, rightEdge);
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
      const leftNav = menuRepeatStep('left', invLeft, leftEdge);
      const rightNav = menuRepeatStep('right', invRight, rightEdge);
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

// ── Crash-forensic heartbeat (temporary diagnostic) ──────────────────────────
// The mobile WebKit crash is silent (no console, no error). Once per ~1s of real
// gameplay we append one compact sample to a bounded ring in localStorage, which
// survives the process death — so the ring's tail shows what trended in the final
// seconds and lets us tell the two failure modes apart:
//   • worst frame ms climbing to 150-300+  → CPU watchdog (iOS kills a page whose
//     frames run too long) → fix is temporal AI LOD.
//   • worst ms stays fine but the ring ends abruptly → memory Jetsam (RAM ceiling).
// `flow` also confirms on-device that the flow-field working set stays ≤3.
// A clean exit (pagehide/beforeunload) clears the "alive" flag so normal play
// never masquerades as a crash on the next boot. Remove once the crash is pinned.
const HB_KEY = 'gigahrush_hb';
const HB_ALIVE_KEY = 'gigahrush_hb_alive';
const HB_RING_MAX = 24;
type HbSample = { t: number; fps: number; worst: number; ent: number; flow: number; surf: number };
const _hbRing: HbSample[] = [];
let _hbLastFlush = 0;
let _hbWorstMs = 0;
let _hbAliveMarked = false;

function recordHeartbeat(now: number, fps: number): void {
  try {
    if (!_hbAliveMarked) { localStorage.setItem(HB_ALIVE_KEY, '1'); _hbAliveMarked = true; }
    _hbRing.push({
      t: Math.round(now / 1000),
      fps,
      worst: Math.round(_hbWorstMs),
      ent: entities.length,
      flow: behaviorFlowFieldCount(),
      surf: world.surfaceMap.size,
    });
    if (_hbRing.length > HB_RING_MAX) _hbRing.shift();
    localStorage.setItem(HB_KEY, JSON.stringify(_hbRing));
  } catch { /* storage disabled/full — diagnostics are best-effort */ }
}

/** Render the persisted heartbeat ring's tail as a compact phone-readable block. */
function formatHeartbeatRing(raw: string): string {
  try {
    const ring = JSON.parse(raw) as HbSample[];
    if (!Array.isArray(ring) || ring.length === 0) return '(пусто)';
    const tail = ring.slice(-8);
    const t0 = tail[0].t;
    const rows = tail.map(s =>
      `+${String(s.t - t0).padStart(2)}s ${String(s.worst).padStart(4)}ms ${String(s.fps).padStart(2)}fps ent${s.ent} flow${s.flow} surf${s.surf}`);
    return rows.join('\n') + '\n\nworst 150-300+ → CPU watchdog; worst ок но обрыв → память';
  } catch { return raw.slice(0, 300); }
}

if (typeof window !== 'undefined') {
  const clearHbAlive = (): void => { try { localStorage.removeItem(HB_ALIVE_KEY); } catch { /* ignore */ } };
  window.addEventListener('pagehide', clearHbAlive);
  window.addEventListener('beforeunload', clearHbAlive);
}

function hudPerfDebugSnapshot(fps: number) {
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
  let writeIdx = 0;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (!e.alive && !isNativePlayerBodyEntity(e)) {
      if (e.type === EntityType.NPC) recordAlifeNpcDeath(state, e);
      removed++;
    } else {
      entities[writeIdx++] = e;
    }
  }
  entities.length = writeIdx;
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
    if (!pendingLoadStarted) {
      if (loadingCanvas) loadingCanvas.style.display = 'block';
      drawLoading(); // Always draw once synchronously to prevent initial white/black flash
      if (loadingWorker) {
        loadingWorker.postMessage({ type: 'start', isFirstLoad: isFirstBootLoading });
        loadingWorkerAck = false;
      } else {
        loadingWorkerAck = true;
      }
      pendingLoadStarted = true;
      pendingLoadWaitTime = performance.now();
      pendingLoadAckYielded = 0;
      requestAnimationFrame(gameLoop);
      return;
    }
    if (!loadingWorkerAck && performance.now() - pendingLoadWaitTime < 10000) {
      // wait up to 10 seconds for worker to initialize and ack
      requestAnimationFrame(gameLoop);
      return;
    }
    if (loadingWorkerAck && pendingLoadAckYielded < 2) {
      // Yield multiple frames so the browser compositor can present the worker's first frame!
      pendingLoadAckYielded++;
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
    const autosaveAfter = pendingLoadAutosave;
    pendingLoad = null;
    pendingLoadAutosave = false;
    pendingLoadStarted = false;

    // Warm the nav tree behind the still-animating loading screen, then tear the
    // screen down. The bake's heavy step 4 runs across the worker pool (async),
    // so the loading screen MUST stay up until it resolves — do the teardown in
    // the continuation, never before. Guarded inside prewarm: no-op if the cache
    // is already valid or frozen (samosbor). Universal across every
    // scheduleLoading path (new game, floor change, teleport, restart, samosbor).
    const finishDeferredLoad = (): void => {
      rebuildEntityIndex(entities, 'load');
      const done = (): void => {
        if (loadingWorker) loadingWorker.postMessage({ type: 'stop' });
        if (loadingCanvas) loadingCanvas.style.display = 'none';
        isFirstBootLoading = false;
        lastTime = performance.now(); // reset dt so we don't get a huge spike
        requestAnimationFrame(gameLoop);
      };
      if (typeof world !== 'undefined') {
        prewarmNavigationTreeAsync(world, _navSolver).then(() => {
          // Bake the common behavior flow fields while the (worker-rendered)
          // loading screen is still up, so the first NPC route on this floor
          // doesn't hitch. Desktop-only; no-op on mobile and mid-samosbor.
          prewarmBehaviorFlowFields(world);
          done();
        }, done);
      } else {
        done();
      }
    };

    if (isGamePushPortalTarget()) {
      showPlatformFullscreenAd().then(() => {
        fn();
        if (autosaveAfter) autoSaveGame();
        finishDeferredLoad();
      });
      return;
    }

    fn();
    if (autosaveAfter) autoSaveGame();
    finishDeferredLoad();
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
  const frameDt = Math.max(0, Math.min(rawDt, 0.05)); // cap delta
  uiTime += frameDt;
  let dt = frameDt;
  tickNetSphere(state, player);

  const snap = getNetSphereSnapshot();
  if (snap.netGen && player) {
    player.netGen = snap.netGen;
    if (snap.profile?.nickname) {
      player.name = snap.profile.nickname;
    }
  }

  // ── Online: peer sends throttled input + immediate edge actions ──
  if (isOnlineConnected()) {
    if (isOnlinePeer()) {
      const peerMenuOpen = state.showContainerMenu || state.showInventory || state.showNpcMenu
        || state.showCraftMenu || state.showMenu;
      // Continuous state + coarse action intent are throttled together: peer owns
      // local inventory/resource simulation; host only applies visible world effects.
      const peerInputSent = maybeSendPeerInput({
        x: player.x, y: player.y,
        angle: player.angle, pitch: player.pitch ?? 0,
        actor: peerActorSnapshot(),
        action: {
          fire: _peerPendingFireAction || undefined,
          reload: _peerPendingReloadAction || undefined,
          toolUse: _peerPendingToolUse,
        },
      });
      if (peerInputSent) {
        _peerPendingFireAction = false;
        _peerPendingReloadAction = false;
        _peerPendingToolUse = undefined;
      }
      // Interact stays reliable/immediate because it opens host-owned doors,
      // pickups and containers; gameplay resource ticks do not use this path.
      if (input.interact) {
        if (!peerMenuOpen) sendPeerAction({ interact: true });
        input.interact = false;
      }
    }
    if (isOnlineHost() && shouldSendHostSync()) {
      // Find all peer actors to build AOI centers
      const peerActors = entities.filter(e => e.peerSlot !== undefined && e.peerSlot > 0 && e.alive);
      if (peerActors.length > 0) {
        const AOI_R2 = 32 * 32; // 32 cell radius squared
        const MAX_SYNC = 64;
        // Collect candidates with distance score
        const candidates: { e: Entity; minD2: number }[] = [];
        for (const e of entities) {
          if (!e.alive) continue;
          // Always include peer actors and host player
          if (e.peerSlot !== undefined) {
            candidates.push({ e, minD2: -1 });
            continue;
          }
          // Find nearest peer distance
          let nearest = Infinity;
          for (const pa of peerActors) {
            const d2 = world.dist2(e.x, e.y, pa.x, pa.y);
            if (d2 < nearest) nearest = d2;
          }
          // Also check host distance
          const hostD2 = world.dist2(e.x, e.y, player.x, player.y);
          if (hostD2 < nearest) nearest = hostD2;
          if (nearest < AOI_R2) candidates.push({ e, minD2: nearest });
        }
        // Always add host player
        candidates.push({ e: player, minD2: -1 });
        // Sort: peers/host first (minD2 = -1), then by distance
        candidates.sort((a, b) => a.minD2 - b.minD2);
        // Cap and compact
        const syncEntities: ReturnType<typeof compactEntity>[] = [];
        for (let i = 0; i < candidates.length && syncEntities.length < MAX_SYNC; i++) {
          const ce = candidates[i].e;
          const ackGen = ce.peerSlot !== undefined ? _peerAckedGen.get(ce.peerSlot) : undefined;
          const ackActorGen = ce.peerSlot !== undefined ? _peerAckedActorGen.get(ce.peerSlot) : undefined;
          syncEntities.push(compactEntity(ce, ackGen, ackActorGen));
        }
        sendOnlineMessage({ type: 'entity_sync', entities: syncEntities });
        // Send door state sync — only doors near any peer or host
        const DOOR_R2 = 32 * 32;
        const doorSync: { idx: number; state: number }[] = [];
        for (const [idx, door] of world.doors) {
          const dx = idx % W, dy = Math.floor(idx / W);
          let near = false;
          for (const pa of peerActors) {
            if (world.dist2(dx + 0.5, dy + 0.5, pa.x, pa.y) < DOOR_R2) { near = true; break; }
          }
          if (!near && world.dist2(dx + 0.5, dy + 0.5, player.x, player.y) < DOOR_R2) near = true;
          if (near) doorSync.push({ idx, state: door.state });
        }
        if (doorSync.length > 0) {
          sendOnlineMessage({ type: 'door_sync', doors: doorSync });
        }
      }
    }
  }
  const peerMode = isOnlinePeer() && onlinePeerFloorReady;

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

  // ── Peer-mode local update: camera, movement and local body resources ──────
  if (peerMode && !state.paused && !state.gameOver) {
    state.time += dt;
    state.tick++;
    updateInventoryConditions(player, state);
    applyKnockbackPhysics(dt);
    movePlayer(dt);
    rebuildEntityIndexForSimulation(entities, entityIndexFrame).beginTelemetryFrame();
    const peerCombat = tickPeerLocalCombatResources(dt);
    const peerToolUse = tickPeerLocalToolResources(dt);
    _peerPendingFireAction ||= peerCombat.fire;
    _peerPendingReloadAction ||= peerCombat.reload;
    _peerPendingToolUse = _peerPendingToolUse ?? peerToolUse;
    notePeerActorState(peerActorSnapshot());
  }

  if (!state.paused && !state.gameOver && !peerMode) {
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

    applyKnockbackPhysics(dt);
    movePlayer(dt);
    rebuildEntityIndexForSimulation(entities, entityIndexFrame).beginTelemetryFrame();
    playerActions(dt);
    syncPlayerActorSwitchBaseline();
    // Skip the rest of this frame when switchFloor is triggered and pendingLoad is set
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
    updateAI(world, entities, dt, state.time, state.msgs, listener.id, state.clock, state.samosborActive, nextEntityId, state.currentZ, state);
    lastAiUpdateMs = performance.now() - aiStart;
    updateRailTrains(world, entities, player, state, dt);
    contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'post_ai', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    updateCarnivorousFungus(world, entities, player, state, dt, nextEntityId);
    updateArenaDuel(state, entities, dt);
    const hazardStart = performance.now();
    tickCellHazards(world, entities, state, dt, player, input.fwd || input.back || input.strafeL || input.strafeR || input.touch.moveX !== 0 || input.touch.moveY !== 0);
    lastHazardUpdateMs = performance.now() - hazardStart;
    updateBlockCrushDamage(world, entities, state, dt);
    updateProceduralAnomalies(world, player, state, dt);
    const samosborStart = performance.now();
    const samosborRebuild = isOnlineConnected() ? false : updateSamosbor(world, entities, state, dt, nextEntityId, currentLocalSamosborPatchGeneration, scheduleLocalSamosborPatch);
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
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentZ, replacement, state.tutorialMode);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentZ);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        resetMapExploration(world);
        updateMapExploration(world, player, state);
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        restoreVoidReturnPortalForCurrentWorld();
        applyDesignRouteGates(world, player, state);
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
    if (getCritterRenderEnabled()) {
      updateCritters(world, dt, player.x, player.y);
    }
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
    if (currentFloorRunEntry(state).themeTags.includes('void') && state.tick % 10 === 0) {
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

    keepDebugOnePunchManAlive(player, state);

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
      state.dmgSeed = rng() * 10000;
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
  if (!state.paused && state.gameOver && !peerMode) {
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
    updateAI(world, entities, dt, state.time, state.msgs, listener.id, state.clock, state.samosborActive, nextEntityId, state.currentZ, state);
    lastAiUpdateMs = performance.now() - aiStart;
    tickCellHazards(world, entities, state, dt, player, false);
    if (!isOnlineConnected() && updateSamosbor(world, entities, state, dt, nextEntityId, currentLocalSamosborPatchGeneration, scheduleLocalSamosborPatch)) {
      closeCraftMenu();
      reportNetSphereProgressEvents();
      scheduleLoading(() => {
        restorePlayerBeforeWorldBoundary();
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state, entities);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentZ, replacement, state.tutorialMode);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentZ);
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

  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

  if (!state.gameOver) {
    if (state.trailerMode) {
      if (runtimeCamera.mode !== 'trailer') {
        startTrailerCamera(runtimeCamera, player.x, player.y);
      }
      updateTrailerCamera(runtimeCamera, world, dt);
    } else {
      updateRuntimeCamera(runtimeCamera, world, dt, player);
    }

    // Skip cinematic mode if any key is pressed
    if (runtimeCamera.mode === 'cinematic') {
      if (input.fwd || input.back || input.left || input.right || input.attack || input.use || input.interact || input.escape) {
        runtimeCamera.mode = 'player';
      }
    }
  }
  checkRestart();
  updateMobileContext();
  const currentFps = updateFpsMeter(now, rawDt * 1000);
  checkPerformance(currentFps, state);
  // Crash-forensic heartbeat: track the worst frame each ~1s of real gameplay.
  if (started && !state.trailerMode && typeof world !== 'undefined') {
    const fm = rawDt * 1000;
    if (fm > _hbWorstMs) _hbWorstMs = fm;
    if (now - _hbLastFlush >= 1000) {
      recordHeartbeat(now, currentFps);
      _hbLastFlush = now;
      _hbWorstMs = 0;
    }
  }

  // ── Render ───────────────────────────────────────────────
  // Fog density varies by floor level
  let baseFog = 0.065;
  if (currentFloorRunEntry(state).themeTags.includes('maintenance')) baseFog = 0.08;
  if (currentFloorRunEntry(state).themeTags.includes('hell')) baseFog = 0.05; // less fog, more horror visibility
  const smogFogBonus = !state.gameOver ? proceduralSmogFogDensityBonus(world, player, state) : 0;
  const samosborVariant = state.samosborActive ? getActiveSamosborVariant() : null;
  const samosborVisual = samosborVariant?.visual;
  const samosborGlitchPulse = 0.85 + ((Math.sin(uiTime * 5) + 1) * 0.5) * 0.15;
  const warningSnapshot = getSamosborWarningSnapshot(state);
  let fogDensity = baseFog + smogFogBonus;
  if (state.samosborActive) {
    fogDensity = (baseFog + smogFogBonus + (samosborVisual?.fogDensityBonus ?? 0.02)) * 3.0;
  } else if (warningSnapshot && warningSnapshot.secondsLeft >= 0 && warningSnapshot.secondsLeft <= 30) {
    const p = 1.0 - (warningSnapshot.secondsLeft / 30);
    // Smoothly transition base density + bonus to 0.15
    const targetFog = 0.15;
    const initialFog = baseFog + smogFogBonus + (samosborVisual?.fogDensityBonus ?? 0.02);
    fogDensity = initialFog + (targetFog - initialFog) * p;
  }
  const interferenceMode = screenInterferenceMode();
  const neuroScreenFx = uiElementEnabled('screen_fx');
  const criticalInterference = state.samosborActive || state.gameOver;
  const screenInterference = interferenceMode === 'off' || !neuroScreenFx
    ? 0
    : interferenceMode === 'full'
      ? 1
      : criticalInterference
        ? 0.65
        : 0;
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
  musicSystem.tick(world, entities, renderActor, state, dt);
  updateDynamicData(world, camX, camY);

  // Auto-recover from WebGL context loss (iOS Safari memory pressure)
  if (webglContextLost) {
    // Context still lost — skip render, game logic continues
    return;
  }
  if (webglNeedsReinit) {
    // Context was restored by the browser — reinitialize everything
    try {
      initWebGL(canvas, textures, sprites, world);
      finishLoadedFloorVisuals();
      clearWebGLReinitFlag();
      console.warn('[WebGL] Successfully reinitialized after context loss');
    } catch (e) {
      console.error('[WebGL] Reinit failed, will retry next frame', e);
      return;
    }
  }

  // WebGL raycaster + sprites
  const floorRunEntry = currentFloorRunEntry(state);
  const ambientLight = designFloorAmbientLight(floorRunEntry.designFloorId, 0.12);
  const visualDetailProfile = currentVisualDetailProfile(floorRunEntry);
  const visualGeometryProfile = currentVisualGeometryProfile(floorRunEntry);
  const visualSurfaceProfile = currentVisualSurfaceProfile(floorRunEntry);
  const renderSceneStart = performance.now();
  renderSceneGL(world, textures, sprites, entities,
    cameraView,
    fogDensity, glitch, flashlight, uiTime, particles, state.samosborActive, ambientLight, toolBeam, state.uvBeamLen, screenInterference, visualDetailProfile, visualGeometryProfile, visualSurfaceProfile, lightingQualityIndex(), currentFps);
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
  if (!state.trailerMode) {
    drawHUD(ctx, hudCanvas.width / SCR_W, hudCanvas.height / SCR_H, renderActor, state, world, entities, uiTime, {
      fps: currentFps,
      perf: uiElementEnabled('fps_counter') ? hudPerfDebugSnapshot(currentFps) : undefined,
      pointerLockHint: !mobileControls?.isEnabled() && !input.mouse.locked && !pointerCaptureGateVisible(),
      pointerCaptureGate: pointerCaptureGateVisible(),
    });
  }
  if (!started) {
    showTitle();
  }
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

  if (titleMode === 'feedback') {
    const scale = Math.min(ctx.canvas.width / 720, ctx.canvas.height / 520);
    const s = Math.max(0.42, Math.min(1.35, scale));
    drawFeedbackMenu(ctx, null as any, s, s, performance.now());
  }

  updateMobileContext(true);
}

function returnToTitleScreen(): void {
  setAudioSuspendedForTitle(true);
  pendingLoad = null;
  pendingLoadStarted = false;
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
  setAudioSuspendedForTitle(false);
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
  const trailerSelected = titleInputField === 'trailer';
  const isNewGame = titleInputField === 'start';
  
  if (seedOverride !== undefined || titleStartNeedsInit || trailerSelected || isNewGame) {
    scheduleLoading(() => {
      initGame(seedOverride, undefined, isNewGame);
      titleStartNeedsInit = false;
      if (trailerSelected) {
        state.trailerMode = true;
        state.currentZ = TRAILER_ZS[titleTrailerFloorIdx];
      }
      if (isNewGame) {
        startTutorial(state, player);
      }
      finishStartGameFromTitle();
    }, false);
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
  }, false);
}

function startHandler(e: KeyboardEvent): void {
  if (started || e.metaKey || e.ctrlKey || e.altKey) return;
  if (pointerCaptureGateVisible()) {
    e.preventDefault();
    return;
  }

  if (titleMode === 'feedback') {
    if (e.code === 'Escape' || e.code === 'Backspace') {
      titleMode = 'setup';
      showTitle();
    } else if (e.code === 'Enter') {
      window.open('https://t.me/gigah_rush', '_blank');
      titleMode = 'setup';
      showTitle();
    }
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
    else if (titleInputField === 'trailer') {
      titleTrailerFloorIdx = (titleTrailerFloorIdx + (e.code === 'ArrowRight' ? 1 : TRAILER_ZS.length - 1)) % TRAILER_ZS.length;
      if (!started && typeof state !== 'undefined') {
        scheduleLoading(() => {
          const floorZ = TRAILER_ZS[titleTrailerFloorIdx];
          initGame(undefined, floorZ);
          state.trailerMode = true;
          titleStartNeedsInit = true;
        });
      } else {
        showTitle();
      }
    }
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
    else if (titleInputField === 'start' || titleInputField === 'trailer') startGameFromTitle();
    else if (titleInputField === 'feedback') {
      titleMode = 'feedback';
      showTitle();
    }
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
    else if (titleInputField === 'trailer') {
      titleTrailerFloorIdx = (titleTrailerFloorIdx + (dir > 0 ? 1 : TRAILER_ZS.length - 1)) % TRAILER_ZS.length;
      if (!started && typeof state !== 'undefined') {
        scheduleLoading(() => {
          const floorZ = TRAILER_ZS[titleTrailerFloorIdx];
          initGame(undefined, floorZ);
          state.trailerMode = true;
          titleStartNeedsInit = true;
        });
      } else {
        showTitle();
      }
    }
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

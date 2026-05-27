import { MonsterKind } from '../../core/types';
import type { MonsterAIFlag } from '../../entities/monster';

export const MONSTER_ARCHETYPE_IDS = [
  'chaser',
  'ambusher',
  'territorial',
  'resource_predator',
  'pack_hunter',
  'line_turret',
  'parasite_controller',
  'trap_tether',
  'conditional_neutral',
  'hive_spawner',
] as const;

export type MonsterArchetypeId = typeof MONSTER_ARCHETYPE_IDS[number];

export const MONSTER_ARCHETYPE_STAGE_IDS = [
  'dormant',
  'patrol_territory',
  'investigate_stimulus',
  'warn_telegraph',
  'commit',
  'recover',
  'flee_reset',
  'feed_claim',
  'return_home',
] as const;

export type MonsterArchetypeStage = typeof MONSTER_ARCHETYPE_STAGE_IDS[number];

export const MONSTER_STIMULUS_IDS = [
  'hostile_sight',
  'recent_damage',
  'noise',
  'bait',
  'food_scent',
  'document_scent',
  'corpse',
  'blood',
  'light',
  'dark',
  'fog',
  'water',
  'wet_line',
  'fire',
  'door',
  'container',
  'room_memory',
  'pack_call',
  'samosbor_pressure',
] as const;

export type MonsterStimulusId = typeof MONSTER_STIMULUS_IDS[number];

export const MONSTER_TERRITORY_IDS = [
  'home_room',
  'door_threshold',
  'source_feature',
  'fog_patch',
  'water_patch',
  'corpse_nest',
  'office_field',
  'screen_apparatus',
  'vent_source',
  'samosbor_scar',
] as const;

export type MonsterTerritoryId = typeof MONSTER_TERRITORY_IDS[number];

export const MONSTER_DRIVE_IDS = [
  'fear',
  'hunger',
  'anger',
  'pack_confidence',
  'territory_pressure',
] as const;

export type MonsterDriveId = typeof MONSTER_DRIVE_IDS[number];

export type MonsterCounterplaySignal =
  | 'line_break'
  | 'windup_interrupt'
  | 'bait_satisfied'
  | 'resource_removed'
  | 'territory_denied'
  | 'source_destroyed'
  | 'fire_recoil'
  | 'light_exposed'
  | 'dry_break'
  | 'loud_fear'
  | 'host_exposed'
  | 'quarantine'
  | 'talk_or_feed'
  | 'pack_scattered';

export interface MonsterScanBudget {
  radius: number;
  resultCap: number;
  cadenceSec: number;
  jitterSec: number;
  stimulusTtlSec: number;
}

export interface MonsterArchetypeDef {
  id: MonsterArchetypeId;
  defaultStage: MonsterArchetypeStage;
  states: readonly MonsterArchetypeStage[];
  stimuli: readonly MonsterStimulusId[];
  territories: readonly MonsterTerritoryId[];
  drives: readonly MonsterDriveId[];
  scan: MonsterScanBudget;
  counterplaySignals: readonly MonsterCounterplaySignal[];
}

export interface MonsterStimulusSample {
  id: MonsterStimulusId;
  severity: number;
  ageSec?: number;
  ttlSec?: number;
  sourceId?: number;
  x?: number;
  y?: number;
  tags?: readonly string[];
}

export interface RankedMonsterStimulus {
  stimulus: MonsterStimulusSample;
  score: number;
}

export interface MonsterTerritoryAnchor {
  id: string;
  type: MonsterTerritoryId;
  x: number;
  y: number;
  radius: number;
  leashRadius: number;
  strength?: number;
  tags?: readonly string[];
}

export interface MonsterCounterplayTransitionDef {
  signal: MonsterCounterplaySignal;
  archetypes: readonly MonsterArchetypeId[];
  from: readonly MonsterArchetypeStage[];
  to: MonsterArchetypeStage;
  cooldownSec: number;
  clearTarget: boolean;
  resetWindup: boolean;
  tags: readonly string[];
  driveDelta?: Partial<Record<MonsterDriveId, number>>;
}

export interface MonsterCounterplayTransition {
  signal: MonsterCounterplaySignal;
  from: MonsterArchetypeStage;
  to: MonsterArchetypeStage;
  cooldownSec: number;
  clearTarget: boolean;
  resetWindup: boolean;
  tags: readonly string[];
  driveDelta: Partial<Record<MonsterDriveId, number>>;
}

export const MONSTER_ARCHETYPE_LIMITS = {
  detectRadiusMax: 34,
  localScanCapMax: 32,
  packShareCapMax: 8,
  spawnBurstCapMax: 12,
  spawnTotalCapMax: 100,
  cadenceMinSec: 0.25,
  cadenceMaxSec: 8,
  stimulusTtlMaxSec: 10,
  transitionCooldownMaxSec: 12,
} as const;

export const MONSTER_ARCHETYPE_DEFS: Record<MonsterArchetypeId, MonsterArchetypeDef> = {
  chaser: {
    id: 'chaser',
    defaultStage: 'patrol_territory',
    states: ['patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'flee_reset'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'bait', 'samosbor_pressure'],
    territories: ['home_room', 'samosbor_scar'],
    drives: ['anger', 'fear'],
    scan: { radius: 28, resultCap: 16, cadenceSec: 0.75, jitterSec: 0.35, stimulusTtlSec: 3 },
    counterplaySignals: ['windup_interrupt', 'line_break', 'bait_satisfied', 'loud_fear'],
  },
  ambusher: {
    id: 'ambusher',
    defaultStage: 'dormant',
    states: ['dormant', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'door', 'container', 'dark', 'fog', 'water', 'room_memory'],
    territories: ['door_threshold', 'fog_patch', 'water_patch', 'source_feature'],
    drives: ['anger', 'territory_pressure'],
    scan: { radius: 18, resultCap: 12, cadenceSec: 0.9, jitterSec: 0.45, stimulusTtlSec: 5 },
    counterplaySignals: ['light_exposed', 'fire_recoil', 'windup_interrupt', 'line_break'],
  },
  territorial: {
    id: 'territorial',
    defaultStage: 'patrol_territory',
    states: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'room_memory', 'samosbor_pressure'],
    territories: ['home_room', 'door_threshold', 'source_feature', 'samosbor_scar'],
    drives: ['anger', 'territory_pressure', 'fear'],
    scan: { radius: 14, resultCap: 12, cadenceSec: 1.2, jitterSec: 0.6, stimulusTtlSec: 6 },
    counterplaySignals: ['territory_denied', 'talk_or_feed', 'line_break'],
  },
  resource_predator: {
    id: 'resource_predator',
    defaultStage: 'investigate_stimulus',
    states: ['patrol_territory', 'investigate_stimulus', 'feed_claim', 'warn_telegraph', 'commit', 'recover', 'return_home'],
    stimuli: ['bait', 'food_scent', 'document_scent', 'corpse', 'blood', 'light', 'hostile_sight', 'recent_damage'],
    territories: ['corpse_nest', 'office_field', 'water_patch', 'source_feature'],
    drives: ['hunger', 'anger'],
    scan: { radius: 30, resultCap: 16, cadenceSec: 1.15, jitterSec: 0.55, stimulusTtlSec: 7 },
    counterplaySignals: ['bait_satisfied', 'resource_removed', 'dry_break', 'light_exposed'],
  },
  pack_hunter: {
    id: 'pack_hunter',
    defaultStage: 'patrol_territory',
    states: ['patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'flee_reset'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'bait', 'pack_call', 'fog', 'food_scent'],
    territories: ['home_room', 'fog_patch', 'door_threshold', 'samosbor_scar'],
    drives: ['fear', 'hunger', 'pack_confidence'],
    scan: { radius: 12, resultCap: MONSTER_ARCHETYPE_LIMITS.packShareCapMax, cadenceSec: 0.65, jitterSec: 0.35, stimulusTtlSec: 4 },
    counterplaySignals: ['pack_scattered', 'loud_fear', 'bait_satisfied', 'line_break'],
  },
  line_turret: {
    id: 'line_turret',
    defaultStage: 'patrol_territory',
    states: ['patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'light', 'wet_line', 'document_scent'],
    territories: ['office_field', 'screen_apparatus', 'water_patch', 'source_feature'],
    drives: ['anger', 'territory_pressure'],
    scan: { radius: 18, resultCap: 8, cadenceSec: 0.7, jitterSec: 0.35, stimulusTtlSec: 3 },
    counterplaySignals: ['line_break', 'windup_interrupt', 'dry_break', 'light_exposed'],
  },
  parasite_controller: {
    id: 'parasite_controller',
    defaultStage: 'investigate_stimulus',
    states: ['dormant', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'flee_reset', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'corpse', 'blood', 'food_scent', 'document_scent', 'room_memory'],
    territories: ['home_room', 'corpse_nest', 'screen_apparatus', 'source_feature'],
    drives: ['hunger', 'anger', 'fear'],
    scan: { radius: 12, resultCap: 16, cadenceSec: 1.1, jitterSec: 0.5, stimulusTtlSec: 6 },
    counterplaySignals: ['host_exposed', 'quarantine', 'line_break', 'fire_recoil'],
  },
  trap_tether: {
    id: 'trap_tether',
    defaultStage: 'dormant',
    states: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'door', 'container', 'light', 'fire', 'samosbor_pressure'],
    territories: ['door_threshold', 'source_feature', 'vent_source', 'screen_apparatus', 'samosbor_scar'],
    drives: ['territory_pressure', 'anger'],
    scan: { radius: 10, resultCap: 8, cadenceSec: 1, jitterSec: 0.5, stimulusTtlSec: 7 },
    counterplaySignals: ['territory_denied', 'source_destroyed', 'line_break', 'fire_recoil'],
  },
  conditional_neutral: {
    id: 'conditional_neutral',
    defaultStage: 'dormant',
    states: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'flee_reset', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'food_scent', 'document_scent', 'room_memory'],
    territories: ['home_room', 'source_feature', 'samosbor_scar'],
    drives: ['fear', 'hunger', 'anger'],
    scan: { radius: 9, resultCap: 8, cadenceSec: 1.4, jitterSec: 0.7, stimulusTtlSec: 5 },
    counterplaySignals: ['talk_or_feed', 'host_exposed', 'quarantine', 'loud_fear'],
  },
  hive_spawner: {
    id: 'hive_spawner',
    defaultStage: 'patrol_territory',
    states: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit', 'recover', 'return_home'],
    stimuli: ['hostile_sight', 'recent_damage', 'noise', 'samosbor_pressure', 'fire', 'room_memory'],
    territories: ['vent_source', 'source_feature', 'corpse_nest', 'samosbor_scar'],
    drives: ['anger', 'territory_pressure'],
    scan: { radius: 20, resultCap: MONSTER_ARCHETYPE_LIMITS.spawnBurstCapMax, cadenceSec: 1.5, jitterSec: 0.7, stimulusTtlSec: 5 },
    counterplaySignals: ['source_destroyed', 'fire_recoil', 'territory_denied', 'line_break'],
  },
};

export const MONSTER_ARCHETYPE_BY_FLAG: Partial<Record<MonsterAIFlag, MonsterArchetypeId>> = {
  wallBias: 'territorial',
  weakWallBreach: 'trap_tether',
  debrisLurker: 'ambusher',
  lampPowered: 'territorial',
  lightLock: 'line_turret',
  documentHunter: 'resource_predator',
  documentScent: 'resource_predator',
  waterStrider: 'ambusher',
  drainArmor: 'trap_tether',
  waterPressureLine: 'line_turret',
  rangedClause: 'line_turret',
  closeReveal: 'ambusher',
  foodBait: 'resource_predator',
  wallBrace: 'territorial',
  fogOffset: 'ambusher',
  scentOvercommit: 'resource_predator',
  garbageSurround: 'pack_hunter',
  sourceSwarm: 'hive_spawner',
  slimeScavenger: 'conditional_neutral',
  slimeStrider: 'resource_predator',
  meatGrowth: 'trap_tether',
  blackWaterWake: 'ambusher',
  rootedPlant: 'trap_tether',
  roomBoundAberration: 'territorial',
  lastSoundBeam: 'line_turret',
  meatWorm: 'resource_predator',
  scrapWake: 'ambusher',
  baitLine: 'ambusher',
  secondBeat: 'ambusher',
  officeField: 'line_turret',
  hostParasite: 'parasite_controller',
  protocolPressure: 'resource_predator',
  crowdShove: 'chaser',
  netPossessor: 'parasite_controller',
  deadEcho: 'ambusher',
  falsePatrol: 'conditional_neutral',
  defensiveNeutral: 'conditional_neutral',
  webSpitter: 'line_turret',
  falsePhase: 'ambusher',
  wetLineShot: 'line_turret',
  packHowl: 'pack_hunter',
  noiseFear: 'pack_hunter',
  fogSwimmer: 'pack_hunter',
  parasiteLeader: 'parasite_controller',
  rootHive: 'hive_spawner',
  fractureSprint: 'chaser',
  lurkingFurniture: 'ambusher',
  lightFollower: 'resource_predator',
};

export const MONSTER_ARCHETYPE_BY_KIND: Partial<Record<MonsterKind, readonly MonsterArchetypeId[]>> = {
  [MonsterKind.SBORKA]: ['chaser', 'resource_predator'],
  [MonsterKind.TVAR]: ['chaser', 'territorial', 'resource_predator'],
  [MonsterKind.POLZUN]: ['chaser', 'trap_tether'],
  [MonsterKind.ZOMBIE]: ['chaser'],
  [MonsterKind.DIKIY_MERTVYAK]: ['chaser'],
  [MonsterKind.TRESKOTNIK]: ['chaser', 'ambusher'],
  [MonsterKind.SHADOW]: ['ambusher'],
  [MonsterKind.TONKAYA_TEN]: ['ambusher', 'trap_tether'],
  [MonsterKind.GLUBINNAYA_TEN]: ['ambusher'],
  [MonsterKind.BEZEKHIY]: ['ambusher', 'trap_tether'],
  [MonsterKind.RZHAVNIK]: ['ambusher', 'resource_predator'],
  [MonsterKind.CHERNOSLIZ]: ['ambusher', 'line_turret'],
  [MonsterKind.SPORE_CARPET]: ['ambusher', 'trap_tether'],
  [MonsterKind.TUMANNIK]: ['ambusher'],
  [MonsterKind.OBZHIVALSHCHIK]: ['territorial', 'conditional_neutral'],
  [MonsterKind.PANELNIK]: ['territorial', 'chaser'],
  [MonsterKind.LAMPOVY]: ['territorial', 'resource_predator'],
  [MonsterKind.SHOVNIK]: ['territorial', 'chaser'],
  [MonsterKind.ZHORNAYA_TVAR]: ['resource_predator', 'chaser'],
  [MonsterKind.PECHATEED]: ['resource_predator'],
  [MonsterKind.KONTORSHCHIK]: ['resource_predator', 'conditional_neutral'],
  [MonsterKind.PROTOKOLNIK]: ['resource_predator', 'line_turret'],
  [MonsterKind.OLGOY]: ['resource_predator', 'ambusher'],
  [MonsterKind.LISHENNYY]: ['resource_predator', 'trap_tether'],
  [MonsterKind.GREEN_DOG]: ['pack_hunter', 'resource_predator', 'chaser'],
  [MonsterKind.FOG_SHARK]: ['pack_hunter', 'ambusher'],
  [MonsterKind.POMOYNY_ROY]: ['pack_hunter', 'resource_predator'],
  [MonsterKind.SWARM]: ['pack_hunter', 'hive_spawner'],
  [MonsterKind.EYE]: ['line_turret'],
  [MonsterKind.LAMPOGLAZ]: ['line_turret', 'territorial'],
  [MonsterKind.SLEPOGLAZ]: ['line_turret', 'ambusher'],
  [MonsterKind.TRUBNYY_AVTOMAT]: ['line_turret', 'trap_tether'],
  [MonsterKind.PARAGRAPH]: ['line_turret'],
  [MonsterKind.IDOL]: ['line_turret', 'trap_tether'],
  [MonsterKind.KANTSELYARSKIY_IDOL]: ['line_turret', 'resource_predator'],
  [MonsterKind.ROBOT]: ['line_turret'],
  [MonsterKind.HEAD_SLUG]: ['parasite_controller', 'resource_predator'],
  [MonsterKind.MUKHOZHUK_HOST]: ['parasite_controller', 'resource_predator', 'conditional_neutral'],
  [MonsterKind.CHERVIE_AVATAR]: ['parasite_controller', 'trap_tether'],
  [MonsterKind.PSEUDOLIFT]: ['trap_tether', 'ambusher'],
  [MonsterKind.BLOOD_PLANT]: ['trap_tether', 'hive_spawner'],
  [MonsterKind.BORSHCHEVIK]: ['trap_tether', 'territorial'],
  [MonsterKind.SLIMEVIK]: ['conditional_neutral', 'resource_predator'],
  [MonsterKind.GNILUSHKA]: ['conditional_neutral'],
  [MonsterKind.BLACK_LIQUIDATOR]: ['conditional_neutral', 'ambusher'],
  [MonsterKind.MATKA]: ['hive_spawner'],
  [MonsterKind.KHOROVAYA_MATKA]: ['hive_spawner', 'line_turret'],
};

export const MONSTER_ARCHETYPE_STIMULUS_WEIGHTS: Record<MonsterArchetypeId, Partial<Record<MonsterStimulusId, number>>> = {
  chaser: {
    hostile_sight: 1.15,
    recent_damage: 1.25,
    noise: 0.9,
    bait: 0.75,
  },
  ambusher: {
    door: 1.25,
    container: 1.2,
    dark: 1.15,
    fog: 1.15,
    water: 1.1,
    hostile_sight: 0.85,
  },
  territorial: {
    room_memory: 1.35,
    noise: 1.1,
    hostile_sight: 0.95,
    samosbor_pressure: 1.15,
  },
  resource_predator: {
    bait: 1.35,
    food_scent: 1.3,
    document_scent: 1.3,
    corpse: 1.25,
    blood: 1.2,
    hostile_sight: 0.7,
  },
  pack_hunter: {
    pack_call: 1.35,
    hostile_sight: 1.1,
    fog: 1.15,
    noise: 1.05,
    bait: 0.75,
  },
  line_turret: {
    hostile_sight: 1.15,
    wet_line: 1.3,
    light: 1.2,
    document_scent: 1.15,
    noise: 0.8,
  },
  parasite_controller: {
    corpse: 1.35,
    blood: 1.15,
    food_scent: 1.1,
    document_scent: 1.05,
    hostile_sight: 0.8,
  },
  trap_tether: {
    door: 1.25,
    container: 1.15,
    light: 1.1,
    hostile_sight: 0.9,
    samosbor_pressure: 1.2,
  },
  conditional_neutral: {
    recent_damage: 1.35,
    room_memory: 1.2,
    food_scent: 0.9,
    hostile_sight: 0.6,
  },
  hive_spawner: {
    samosbor_pressure: 1.25,
    room_memory: 1.15,
    recent_damage: 1.1,
    hostile_sight: 0.85,
    fire: 1.2,
  },
};

export const MONSTER_COUNTERPLAY_TRANSITIONS: readonly MonsterCounterplayTransitionDef[] = [
  {
    signal: 'windup_interrupt',
    archetypes: ['chaser', 'ambusher', 'line_turret', 'trap_tether'],
    from: ['warn_telegraph', 'commit'],
    to: 'recover',
    cooldownSec: 1.2,
    clearTarget: false,
    resetWindup: true,
    tags: ['counterplay', 'windup_interrupted'],
    driveDelta: { anger: 0.1, fear: 0.15 },
  },
  {
    signal: 'line_break',
    archetypes: ['line_turret', 'ambusher', 'trap_tether', 'chaser'],
    from: ['warn_telegraph', 'commit', 'investigate_stimulus'],
    to: 'recover',
    cooldownSec: 0.9,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'line_broken'],
    driveDelta: { territory_pressure: 0.08 },
  },
  {
    signal: 'bait_satisfied',
    archetypes: ['resource_predator', 'pack_hunter', 'chaser'],
    from: ['investigate_stimulus', 'warn_telegraph', 'commit', 'patrol_territory'],
    to: 'feed_claim',
    cooldownSec: 1.4,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'bait', 'feed_claim'],
    driveDelta: { hunger: -0.7, anger: -0.15 },
  },
  {
    signal: 'resource_removed',
    archetypes: ['resource_predator'],
    from: ['investigate_stimulus', 'warn_telegraph', 'commit', 'feed_claim'],
    to: 'return_home',
    cooldownSec: 1.1,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'resource_removed'],
    driveDelta: { hunger: -0.25 },
  },
  {
    signal: 'territory_denied',
    archetypes: ['territorial', 'trap_tether', 'hive_spawner'],
    from: ['patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'return_home',
    cooldownSec: 2,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'territory_denied'],
    driveDelta: { territory_pressure: 0.5, anger: -0.1 },
  },
  {
    signal: 'source_destroyed',
    archetypes: ['hive_spawner', 'trap_tether', 'parasite_controller'],
    from: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'flee_reset',
    cooldownSec: 3,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'source_destroyed'],
    driveDelta: { fear: 0.65, territory_pressure: -0.45 },
  },
  {
    signal: 'fire_recoil',
    archetypes: ['ambusher', 'hive_spawner', 'trap_tether', 'parasite_controller'],
    from: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'recover',
    cooldownSec: 2.4,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'fire_recoil'],
    driveDelta: { fear: 0.5, anger: -0.2 },
  },
  {
    signal: 'light_exposed',
    archetypes: ['ambusher', 'resource_predator', 'line_turret'],
    from: ['dormant', 'investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'recover',
    cooldownSec: 1.6,
    clearTarget: false,
    resetWindup: true,
    tags: ['counterplay', 'light_exposed'],
    driveDelta: { fear: 0.2 },
  },
  {
    signal: 'dry_break',
    archetypes: ['resource_predator', 'line_turret', 'ambusher'],
    from: ['investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'recover',
    cooldownSec: 0.8,
    clearTarget: false,
    resetWindup: true,
    tags: ['counterplay', 'dry_break'],
    driveDelta: { territory_pressure: 0.15 },
  },
  {
    signal: 'loud_fear',
    archetypes: ['pack_hunter', 'conditional_neutral', 'chaser'],
    from: ['patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'flee_reset',
    cooldownSec: 4.5,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'loud_fear'],
    driveDelta: { fear: 0.8, pack_confidence: -0.55 },
  },
  {
    signal: 'host_exposed',
    archetypes: ['parasite_controller', 'conditional_neutral'],
    from: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph'],
    to: 'recover',
    cooldownSec: 1.5,
    clearTarget: false,
    resetWindup: true,
    tags: ['counterplay', 'host_exposed'],
    driveDelta: { fear: 0.22, anger: 0.15 },
  },
  {
    signal: 'quarantine',
    archetypes: ['parasite_controller', 'conditional_neutral'],
    from: ['investigate_stimulus', 'warn_telegraph', 'commit', 'recover'],
    to: 'flee_reset',
    cooldownSec: 3.5,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'quarantine'],
    driveDelta: { fear: 0.6, hunger: -0.15 },
  },
  {
    signal: 'talk_or_feed',
    archetypes: ['conditional_neutral', 'territorial'],
    from: ['dormant', 'patrol_territory', 'investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'return_home',
    cooldownSec: 2.2,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'talk_or_feed'],
    driveDelta: { anger: -0.55, fear: -0.15, hunger: -0.25 },
  },
  {
    signal: 'pack_scattered',
    archetypes: ['pack_hunter'],
    from: ['investigate_stimulus', 'warn_telegraph', 'commit'],
    to: 'flee_reset',
    cooldownSec: 3.2,
    clearTarget: true,
    resetWindup: true,
    tags: ['counterplay', 'pack_scattered'],
    driveDelta: { pack_confidence: -0.85, fear: 0.45 },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueArchetypes(ids: Iterable<MonsterArchetypeId>): MonsterArchetypeId[] {
  const out: MonsterArchetypeId[] = [];
  for (const id of ids) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function getMonsterArchetypes(
  kind: MonsterKind | undefined,
  flags: readonly MonsterAIFlag[] = [],
  fallback?: MonsterArchetypeId,
): MonsterArchetypeId[] {
  const fromKind = kind === undefined ? [] : MONSTER_ARCHETYPE_BY_KIND[kind] ?? [];
  const fromFlags = flags
    .map(flag => MONSTER_ARCHETYPE_BY_FLAG[flag])
    .filter((id): id is MonsterArchetypeId => id !== undefined);
  const result = uniqueArchetypes([...fromKind, ...fromFlags]);
  if (result.length === 0 && fallback !== undefined) result.push(fallback);
  return result;
}

export function monsterKindsForArchetype(archetype: MonsterArchetypeId): MonsterKind[] {
  const out: MonsterKind[] = [];
  for (const [kind, archetypes] of Object.entries(MONSTER_ARCHETYPE_BY_KIND)) {
    if (archetypes.includes(archetype)) out.push(Number(kind) as MonsterKind);
  }
  return out;
}

export function isMonsterScanBudgetBounded(scan: MonsterScanBudget): boolean {
  return scan.radius > 0 &&
    scan.radius <= MONSTER_ARCHETYPE_LIMITS.detectRadiusMax &&
    scan.resultCap > 0 &&
    scan.resultCap <= MONSTER_ARCHETYPE_LIMITS.localScanCapMax &&
    scan.cadenceSec >= MONSTER_ARCHETYPE_LIMITS.cadenceMinSec &&
    scan.cadenceSec <= MONSTER_ARCHETYPE_LIMITS.cadenceMaxSec &&
    scan.jitterSec >= 0 &&
    scan.cadenceSec + scan.jitterSec <= MONSTER_ARCHETYPE_LIMITS.cadenceMaxSec &&
    scan.stimulusTtlSec > 0 &&
    scan.stimulusTtlSec <= MONSTER_ARCHETYPE_LIMITS.stimulusTtlMaxSec;
}

export function monsterScanRadiusSq(scan: MonsterScanBudget): number {
  return scan.radius * scan.radius;
}

export function monsterDeterministicCadenceSec(entityId: number, scan: MonsterScanBudget, pressure = 0): number {
  const h = Math.imul(entityId ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  const jitter = ((h & 1023) / 1023) * scan.jitterSec;
  const pressureCut = clamp(pressure, 0, 1) * scan.cadenceSec * 0.35;
  return clamp(
    scan.cadenceSec + jitter - pressureCut,
    MONSTER_ARCHETYPE_LIMITS.cadenceMinSec,
    MONSTER_ARCHETYPE_LIMITS.cadenceMaxSec,
  );
}

export function clampMonsterDrive(value: number): number {
  return clamp(value, 0, 1);
}

export function decayMonsterDrive(value: number, dt: number, halfLifeSec: number): number {
  if (value <= 0) return 0;
  if (halfLifeSec <= 0) return 0;
  return clampMonsterDrive(value * Math.pow(0.5, Math.max(0, dt) / halfLifeSec));
}

function stimulusAlive(stimulus: MonsterStimulusSample, defaultTtlSec: number): boolean {
  const age = stimulus.ageSec ?? 0;
  const ttl = stimulus.ttlSec ?? defaultTtlSec;
  return age >= 0 && age <= ttl;
}

function stimulusAffinity(def: MonsterArchetypeDef, id: MonsterStimulusId): number {
  const weighted = MONSTER_ARCHETYPE_STIMULUS_WEIGHTS[def.id][id];
  if (weighted !== undefined) return weighted;
  if (def.stimuli.includes(id)) return 1;
  if (id === 'recent_damage') return 0.65;
  if (id === 'hostile_sight') return 0.55;
  if (id === 'samosbor_pressure') return 0.4;
  return 0.1;
}

export function scoreMonsterStimulus(
  archetypes: readonly MonsterArchetypeId[],
  stimulus: MonsterStimulusSample,
): number {
  if (archetypes.length === 0) return 0;
  let bestAffinity = 0;
  let ttl = 0;
  for (const archetype of archetypes) {
    const def = MONSTER_ARCHETYPE_DEFS[archetype];
    bestAffinity = Math.max(bestAffinity, stimulusAffinity(def, stimulus.id));
    ttl = Math.max(ttl, def.scan.stimulusTtlSec);
  }
  if (!stimulusAlive(stimulus, ttl)) return 0;
  const age = stimulus.ageSec ?? 0;
  const localTtl = stimulus.ttlSec ?? ttl;
  const ageFalloff = localTtl <= 0 ? 0 : clamp(1 - age / localTtl, 0, 1);
  return clamp(stimulus.severity, 0, 2) * bestAffinity * (0.35 + ageFalloff * 0.65);
}

export function rankMonsterStimuli(
  archetypes: readonly MonsterArchetypeId[],
  stimuli: readonly MonsterStimulusSample[],
  limit = 4,
): RankedMonsterStimulus[] {
  const ranked: RankedMonsterStimulus[] = [];
  for (const stimulus of stimuli) {
    const score = scoreMonsterStimulus(archetypes, stimulus);
    if (score <= 0) continue;
    ranked.push({ stimulus, score });
  }
  ranked.sort((a, b) => b.score - a.score || MONSTER_STIMULUS_IDS.indexOf(a.stimulus.id) - MONSTER_STIMULUS_IDS.indexOf(b.stimulus.id));
  return ranked.slice(0, Math.max(0, limit));
}

export function monsterTerritoryPressureFromDistanceSq(distanceSq: number, anchor: Pick<MonsterTerritoryAnchor, 'radius' | 'leashRadius' | 'strength'>): number {
  const radius = Math.max(0, anchor.radius);
  const leash = Math.max(radius, anchor.leashRadius);
  if (leash <= radius) return 0;
  const dist = Math.sqrt(Math.max(0, distanceSq));
  if (dist <= radius) return 0;
  const pressure = (dist - radius) / (leash - radius);
  return clamp(pressure * (anchor.strength ?? 1), 0, 1);
}

export function monsterTerritoryStage(stage: MonsterArchetypeStage, pressure: number): MonsterArchetypeStage {
  if (pressure >= 0.85) return stage === 'commit' ? 'flee_reset' : 'return_home';
  if (pressure >= 0.45 && stage === 'dormant') return 'patrol_territory';
  return stage;
}

function transitionMatches(
  def: MonsterCounterplayTransitionDef,
  archetypes: readonly MonsterArchetypeId[],
  stage: MonsterArchetypeStage,
  signal: MonsterCounterplaySignal,
): boolean {
  if (def.signal !== signal) return false;
  if (!def.from.includes(stage)) return false;
  for (const archetype of archetypes) {
    if (def.archetypes.includes(archetype)) return true;
  }
  return false;
}

export function resolveMonsterCounterplayTransition(
  archetypes: readonly MonsterArchetypeId[],
  stage: MonsterArchetypeStage,
  signal: MonsterCounterplaySignal,
  intensity = 1,
): MonsterCounterplayTransition | undefined {
  for (const def of MONSTER_COUNTERPLAY_TRANSITIONS) {
    if (!transitionMatches(def, archetypes, stage, signal)) continue;
    return {
      signal,
      from: stage,
      to: def.to,
      cooldownSec: clamp(def.cooldownSec * clamp(intensity, 0.25, 2), 0, MONSTER_ARCHETYPE_LIMITS.transitionCooldownMaxSec),
      clearTarget: def.clearTarget,
      resetWindup: def.resetWindup,
      tags: def.tags,
      driveDelta: { ...def.driveDelta },
    };
  }
  return undefined;
}

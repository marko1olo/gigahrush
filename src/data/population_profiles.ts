import { FloorLevel, RoomType, ZoneFaction } from '../core/types';

export interface NpcPopulationBucket {
  initial: number;
  softCap: number;
  groupMin: number;
  groupMax: number;
  refillMin: number;
  refillMax: number;
  refillDeficitDivisor: number;
  spreadRadius: number;
  scatterShare: number;
  noiseScale: number;
  noiseStrength: number;
  openWeight: number;
  roomWeights: Partial<Record<RoomType, number>>;
  zoneWeights: Partial<Record<ZoneFaction, number>>;
}

export interface MonsterPopulationBucket {
  initial: number;
  softCap: number;
  batchMin: number;
  batchMax: number;
  refillDeficitDivisor: number;
  intervalSec: number;
  reinforcementBudget: number;
  geometryBias: number;
}

export const KVARTIRY_POPULATION_PROFILE = {
  id: 'kvartiry_lively',
  floor: FloorLevel.KVARTIRY,
  spawnIntervalSec: 2.0,
  citizens: {
    initial: 3000,
    softCap: 6000,
    groupMin: 40,
    groupMax: 180,
    refillMin: 60,
    refillMax: 180,
    refillDeficitDivisor: 20,
    spreadRadius: 10,
    scatterShare: 0.86,
    noiseScale: 96,
    noiseStrength: 0.28,
    openWeight: 0.95,
    roomWeights: {
      [RoomType.LIVING]: 1.75,
      [RoomType.KITCHEN]: 1.65,
      [RoomType.COMMON]: 1.35,
      [RoomType.SMOKING]: 1.2,
      [RoomType.CORRIDOR]: 1.05,
      [RoomType.OFFICE]: 0.95,
      [RoomType.BATHROOM]: 0.85,
      [RoomType.STORAGE]: 0.75,
      [RoomType.HQ]: 0.55,
    },
    zoneWeights: {
      [ZoneFaction.CITIZEN]: 1.12,
      [ZoneFaction.WILD]: 0.96,
      [ZoneFaction.LIQUIDATOR]: 0.9,
      [ZoneFaction.CULTIST]: 0.78,
    },
  },
  wild: {
    initial: 1700,
    softCap: 3200,
    groupMin: 35,
    groupMax: 160,
    refillMin: 50,
    refillMax: 160,
    refillDeficitDivisor: 18,
    spreadRadius: 12,
    scatterShare: 0.72,
    noiseScale: 72,
    noiseStrength: 0.42,
    openWeight: 1.15,
    roomWeights: {
      [RoomType.CORRIDOR]: 1.65,
      [RoomType.COMMON]: 1.45,
      [RoomType.SMOKING]: 1.4,
      [RoomType.STORAGE]: 1.25,
      [RoomType.KITCHEN]: 1.1,
      [RoomType.LIVING]: 0.95,
      [RoomType.BATHROOM]: 0.8,
      [RoomType.OFFICE]: 0.8,
      [RoomType.HQ]: 0.75,
    },
    zoneWeights: {
      [ZoneFaction.WILD]: 1.28,
      [ZoneFaction.CITIZEN]: 0.95,
      [ZoneFaction.CULTIST]: 1.05,
      [ZoneFaction.LIQUIDATOR]: 0.84,
    },
  },
  liquidators: {
    initial: 400,
    softCap: 800,
    groupMin: 10,
    groupMax: 60,
    refillMin: 10,
    refillMax: 50,
    refillDeficitDivisor: 16,
    spreadRadius: 8,
    scatterShare: 0.58,
    noiseScale: 128,
    noiseStrength: 0.32,
    openWeight: 1.1,
    roomWeights: {
      [RoomType.HQ]: 2.6,
      [RoomType.CORRIDOR]: 1.55,
      [RoomType.COMMON]: 1.35,
      [RoomType.OFFICE]: 1.3,
      [RoomType.STORAGE]: 1.1,
      [RoomType.KITCHEN]: 0.85,
      [RoomType.SMOKING]: 0.75,
      [RoomType.BATHROOM]: 0.65,
      [RoomType.LIVING]: 0.55,
    },
    zoneWeights: {
      [ZoneFaction.LIQUIDATOR]: 1.65,
      [ZoneFaction.WILD]: 1.18,
      [ZoneFaction.CULTIST]: 1.12,
      [ZoneFaction.CITIZEN]: 0.9,
    },
  },
  uprising: {
    intervalSec: 24,
    radius: 38,
    responseRadius: 78,
    ambientChance: 0.12,
    minCitizens: 16,
    maxConverted: 12,
    maxResponders: 8,
  },
} as const;

export const HELL_POPULATION_PROFILE = {
  id: 'hell_lively',
  floor: FloorLevel.HELL,
  monsters: {
    initial: 4200,
    softCap: 8200,
    batchMin: 20,
    batchMax: 90,
    refillDeficitDivisor: 80,
    intervalSec: 1.1,
    reinforcementBudget: 6200,
    geometryBias: 0.45,
  },
  cultists: {
    initial: 700,
    softCap: 1500,
    batchMin: 5,
    batchMax: 30,
    refillDeficitDivisor: 55,
    intervalSec: 3.2,
    reinforcementBudget: 1100,
    geometryBias: 0.55,
  },
  liquidators: {
    initial: 100,
    softCap: 300,
    batchMin: 1,
    batchMax: 8,
    refillDeficitDivisor: 30,
    intervalSec: 7.0,
    reinforcementBudget: 220,
    geometryBias: 0.45,
  },
} as const;

export const VOID_POPULATION_PROFILE = {
  id: 'void_lively',
  floor: FloorLevel.VOID,
  guardians: 1600,
  lootDrops: 160,
} as const;

export const PROCEDURAL_POPULATION_PROFILE = {
  id: 'procedural_lively',
  npcBase: 3500,
  npcPerDanger: 300,
  npcCap: 5000,
  monsterBase: 350,
  monsterPerDanger: 180,
  monsterCap: 1500,
  deepFloorMonsterBonus: 200,
  industrialMonsterBonus: 90,
  anomalyPressureMonsterBonus: 80,
} as const;

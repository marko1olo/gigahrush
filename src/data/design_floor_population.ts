import {
  Faction,
  FloorLevel,
  EntityType,
  MonsterKind,
  Occupation,
  RoomType,
  W,
  ZoneFaction,
} from '../core/types';
import type { DesignFloorId, DesignFloorRouteDef } from './design_floors';
import { ACTIVE_ACTOR_SOFT_LIMIT, ENTITY_SOFT_LIMITS, fitActiveActorCounts } from './entity_limits';

export interface DesignPlacementFieldProfile {
  noiseScale: number;
  noiseStrength: number;
  roomWeights?: Partial<Record<RoomType, number>>;
  zoneWeights?: Partial<Record<ZoneFaction, number>>;
  openWeight?: number;
  smoothingPasses?: number;
  smoothingBlend?: number;
  anchors?: readonly DesignPlacementFieldAnchor[];
  bucketSize?: number;
  maxPerBucket?: number;
}

export interface DesignPlacementFieldAnchor {
  x: number;
  y: number;
  radius: number;
  weight: number;
}

export interface WeightedDesignValue<T> {
  value: T;
  weight: number;
}

export interface DesignFloorPopulationProfile {
  routeId: DesignFloorId;
  z: number;
  npcTarget: number;
  monsterTarget: number;
  npcLevel: number;
  monsterLevel: number;
  npcNoun: string;
  npcFactions: readonly WeightedDesignValue<Faction>[];
  npcOccupations: readonly WeightedDesignValue<Occupation>[];
  monsterBiasKinds: readonly MonsterKind[];
  monsterTags: readonly string[];
  npcPlacement: DesignPlacementFieldProfile;
  monsterPlacement: DesignPlacementFieldProfile;
}

interface DesignFloorPopulationOverride {
  npcTarget?: number;
  monsterTarget?: number;
  npcMult?: number;
  monsterMult?: number;
  npcFactions?: readonly WeightedDesignValue<Faction>[];
  npcOccupations?: readonly WeightedDesignValue<Occupation>[];
  npcNoun?: string;
  monsterBiasKinds?: readonly MonsterKind[];
  monsterTags?: readonly string[];
  npcPlacementKind?: PlacementKind;
  monsterPlacementKind?: PlacementKind;
  npcPlacement?: Partial<DesignPlacementFieldProfile>;
  monsterPlacement?: Partial<DesignPlacementFieldProfile>;
}

type PlacementKind = 'social' | 'communal' | 'floor_69' | 'admin' | 'bank' | 'industrial' | 'silicon' | 'slime' | 'attic' | 'hell' | 'underhell' | 'void' | 'roof' | 'camp' | 'metro' | 'morgue' | 'crossroads';

const ENTITY_NPC_CAP = ENTITY_SOFT_LIMITS[EntityType.NPC] ?? ACTIVE_ACTOR_SOFT_LIMIT;
const ENTITY_MONSTER_CAP = ENTITY_SOFT_LIMITS[EntityType.MONSTER] ?? ACTIVE_ACTOR_SOFT_LIMIT;

const DARKNESS_CENTER = W >> 1;
const PODAD_CENTER = W >> 1;

const DARKNESS_MONSTER_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: DARKNESS_CENTER - 30, y: DARKNESS_CENTER + 2, radius: 38, weight: 0.06 },
  { x: DARKNESS_CENTER - 8, y: DARKNESS_CENTER + 2, radius: 42, weight: 0.32 },
  { x: DARKNESS_CENTER + 18, y: DARKNESS_CENTER - 14, radius: 72, weight: 1.55 },
  { x: DARKNESS_CENTER + 52, y: DARKNESS_CENTER + 22, radius: 78, weight: 2.35 },
  { x: DARKNESS_CENTER + 56, y: DARKNESS_CENTER + 42, radius: 64, weight: 1.8 },
  { x: DARKNESS_CENTER + 66, y: DARKNESS_CENTER + 8, radius: 58, weight: 2.15 },
];

const PODAD_MONSTER_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: PODAD_CENTER - 101, y: PODAD_CENTER - 49, radius: 170, weight: 1.7 },
  { x: PODAD_CENTER - 66, y: PODAD_CENTER + 107, radius: 150, weight: 1.45 },
  { x: PODAD_CENTER + 99, y: PODAD_CENTER + 108, radius: 165, weight: 1.55 },
  { x: PODAD_CENTER + 126, y: PODAD_CENTER - 27, radius: 180, weight: 1.4 },
  { x: PODAD_CENTER + 18, y: PODAD_CENTER + 181, radius: 118, weight: 1.22 },
];

const CITIZEN_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.CITIZEN, weight: 82 },
  { value: Faction.LIQUIDATOR, weight: 10 },
  { value: Faction.WILD, weight: 6 },
  { value: Faction.SCIENTIST, weight: 2 },
];

const CAMP_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.CITIZEN, weight: 90 },
  { value: Faction.SCIENTIST, weight: 5 },
  { value: Faction.LIQUIDATOR, weight: 5 },
];

const ADMIN_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.CITIZEN, weight: 58 },
  { value: Faction.LIQUIDATOR, weight: 27 },
  { value: Faction.SCIENTIST, weight: 10 },
  { value: Faction.WILD, weight: 5 },
];

const UPPER_BUREAU_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.CITIZEN, weight: 64 },
  { value: Faction.LIQUIDATOR, weight: 25 },
  { value: Faction.SCIENTIST, weight: 8 },
  { value: Faction.WILD, weight: 3 },
];

const INDUSTRIAL_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.LIQUIDATOR, weight: 42 },
  { value: Faction.CITIZEN, weight: 34 },
  { value: Faction.WILD, weight: 16 },
  { value: Faction.SCIENTIST, weight: 8 },
];

const VETERAN_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.LIQUIDATOR, weight: 45 },
  { value: Faction.CULTIST, weight: 32 },
  { value: Faction.WILD, weight: 18 },
  { value: Faction.SCIENTIST, weight: 5 },
];

const SOCIAL_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.TRAVELER, weight: 24 },
  { value: Occupation.HOUSEWIFE, weight: 17 },
  { value: Occupation.COOK, weight: 11 },
  { value: Occupation.LOCKSMITH, weight: 10 },
  { value: Occupation.STOREKEEPER, weight: 9 },
  { value: Occupation.ALCOHOLIC, weight: 8 },
  { value: Occupation.SECRETARY, weight: 7 },
  { value: Occupation.MECHANIC, weight: 6 },
  { value: Occupation.DOCTOR, weight: 4 },
  { value: Occupation.HUNTER, weight: 4 },
];

const FLOOR_69_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.TRAVELER, weight: 24 },
  { value: Occupation.SECRETARY, weight: 20 },
  { value: Occupation.STOREKEEPER, weight: 14 },
  { value: Occupation.HUNTER, weight: 13 },
  { value: Occupation.DOCTOR, weight: 9 },
  { value: Occupation.DIRECTOR, weight: 6 },
  { value: Occupation.HOUSEWIFE, weight: 5 },
  { value: Occupation.LOCKSMITH, weight: 5 },
  { value: Occupation.MECHANIC, weight: 4 },
];

const ADMIN_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.SECRETARY, weight: 28 },
  { value: Occupation.TRAVELER, weight: 18 },
  { value: Occupation.HUNTER, weight: 14 },
  { value: Occupation.STOREKEEPER, weight: 10 },
  { value: Occupation.SCIENTIST, weight: 9 },
  { value: Occupation.DOCTOR, weight: 6 },
  { value: Occupation.LOCKSMITH, weight: 5 },
  { value: Occupation.DIRECTOR, weight: 3 },
];

const UPPER_BUREAU_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.SECRETARY, weight: 38 },
  { value: Occupation.TRAVELER, weight: 17 },
  { value: Occupation.HUNTER, weight: 16 },
  { value: Occupation.STOREKEEPER, weight: 10 },
  { value: Occupation.SCIENTIST, weight: 7 },
  { value: Occupation.DIRECTOR, weight: 5 },
  { value: Occupation.DOCTOR, weight: 4 },
  { value: Occupation.LOCKSMITH, weight: 3 },
];

const RAIONSOVET_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.SECRETARY, weight: 36 },
  { value: Occupation.TRAVELER, weight: 22 },
  { value: Occupation.HOUSEWIFE, weight: 12 },
  { value: Occupation.HUNTER, weight: 12 },
  { value: Occupation.STOREKEEPER, weight: 8 },
  { value: Occupation.LOCKSMITH, weight: 6 },
  { value: Occupation.DIRECTOR, weight: 3 },
  { value: Occupation.SCIENTIST, weight: 1 },
];

const INDUSTRIAL_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.MECHANIC, weight: 22 },
  { value: Occupation.ELECTRICIAN, weight: 18 },
  { value: Occupation.TURNER, weight: 16 },
  { value: Occupation.HUNTER, weight: 13 },
  { value: Occupation.LOCKSMITH, weight: 12 },
  { value: Occupation.TRAVELER, weight: 8 },
  { value: Occupation.SCIENTIST, weight: 6 },
  { value: Occupation.STOREKEEPER, weight: 5 },
];

const CHILD_CAMP_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.CHILD, weight: 76 },
  { value: Occupation.COOK, weight: 6 },
  { value: Occupation.DOCTOR, weight: 5 },
  { value: Occupation.SECRETARY, weight: 4 },
  { value: Occupation.ELECTRICIAN, weight: 4 },
  { value: Occupation.TRAVELER, weight: 3 },
  { value: Occupation.HUNTER, weight: 1 },
  { value: Occupation.SCIENTIST, weight: 1 },
];

const CAMP_CENTER = W >> 1;
const CAMP_NPC_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: CAMP_CENTER, y: CAMP_CENTER, radius: 118, weight: 2.15 },
  { x: CAMP_CENTER + 82, y: CAMP_CENTER + 53, radius: 76, weight: 1.75 },
  { x: CAMP_CENTER - 76, y: CAMP_CENTER + 53, radius: 68, weight: 1.58 },
  { x: CAMP_CENTER - 86, y: CAMP_CENTER - 52, radius: 68, weight: 1.45 },
  { x: CAMP_CENTER + 80, y: CAMP_CENTER - 54, radius: 68, weight: 1.42 },
  { x: CAMP_CENTER, y: CAMP_CENTER + 68, radius: 74, weight: 1.35 },
];

const CAMP_MONSTER_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: CAMP_CENTER - 197, y: CAMP_CENTER - 137, radius: 160, weight: 2.35 },
  { x: CAMP_CENTER - 126, y: CAMP_CENTER + 140, radius: 118, weight: 1.8 },
  { x: CAMP_CENTER + 108, y: CAMP_CENTER + 144, radius: 128, weight: 1.7 },
  { x: CAMP_CENTER, y: CAMP_CENTER - 380, radius: 132, weight: 1.55 },
  { x: CAMP_CENTER, y: CAMP_CENTER + 376, radius: 142, weight: 1.58 },
  { x: CAMP_CENTER - 352, y: CAMP_CENTER, radius: 132, weight: 1.5 },
  { x: CAMP_CENTER + 352, y: CAMP_CENTER, radius: 132, weight: 1.5 },
  { x: CAMP_CENTER + 278, y: CAMP_CENTER + 278, radius: 148, weight: 1.45 },
  { x: CAMP_CENTER - 274, y: CAMP_CENTER - 274, radius: 148, weight: 1.42 },
];

const VETERAN_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.HUNTER, weight: 42 },
  { value: Occupation.PILGRIM, weight: 24 },
  { value: Occupation.TRAVELER, weight: 14 },
  { value: Occupation.MECHANIC, weight: 9 },
  { value: Occupation.SCIENTIST, weight: 6 },
  { value: Occupation.PRIEST, weight: 5 },
];

const UNDERHELL_THRESHOLD_MIX: readonly WeightedDesignValue<Faction>[] = [
  { value: Faction.LIQUIDATOR, weight: 58 },
  { value: Faction.CULTIST, weight: 42 },
];

const UNDERHELL_THRESHOLD_OCCUPATIONS: readonly WeightedDesignValue<Occupation>[] = [
  { value: Occupation.HUNTER, weight: 46 },
  { value: Occupation.PILGRIM, weight: 24 },
  { value: Occupation.PRIEST, weight: 12 },
  { value: Occupation.SCIENTIST, weight: 10 },
  { value: Occupation.MECHANIC, weight: 8 },
];

const ANTENNA_CENTER = W >> 1;

const ANTENNA_COURT_ENCLAVE_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: ANTENNA_CENTER, y: ANTENNA_CENTER, radius: 76, weight: 5.2 },
  { x: ANTENNA_CENTER, y: 154, radius: 70, weight: 3.8 },
  { x: 770, y: 254, radius: 64, weight: 3.2 },
  { x: 870, y: ANTENNA_CENTER, radius: 70, weight: 3.6 },
  { x: 770, y: 770, radius: 64, weight: 3.2 },
  { x: ANTENNA_CENTER, y: 870, radius: 70, weight: 3.8 },
  { x: 254, y: 770, radius: 64, weight: 3.2 },
  { x: 154, y: ANTENNA_CENTER, radius: 70, weight: 3.6 },
  { x: 254, y: 254, radius: 64, weight: 3.2 },
];

const ANTENNA_COURT_MONSTER_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: ANTENNA_CENTER, y: ANTENNA_CENTER - 92, radius: 92, weight: 2.1 },
  { x: ANTENNA_CENTER + 104, y: ANTENNA_CENTER, radius: 92, weight: 2.0 },
  { x: ANTENNA_CENTER, y: ANTENNA_CENTER + 92, radius: 92, weight: 2.1 },
  { x: ANTENNA_CENTER - 104, y: ANTENNA_CENTER, radius: 92, weight: 2.0 },
  ...ANTENNA_COURT_ENCLAVE_ANCHORS.map(anchor => ({
    x: anchor.x,
    y: anchor.y,
    radius: Math.round(anchor.radius * 1.35),
    weight: 1.45,
  })),
];

const METRO_NPC_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: 512, y: 520, radius: 78, weight: 2.7 },
  { x: 118, y: 82, radius: 58, weight: 2.4 },
  { x: 820, y: 226, radius: 62, weight: 2.35 },
  { x: 160, y: 751, radius: 58, weight: 2.35 },
  { x: 760, y: 889, radius: 64, weight: 2.4 },
  { x: 398, y: 137, radius: 44, weight: 2.1 },
  { x: 679, y: 137, radius: 44, weight: 2.1 },
  { x: 143, y: 234, radius: 44, weight: 2.1 },
  { x: 667, y: 234, radius: 44, weight: 2.1 },
  { x: 420, y: 421, radius: 44, weight: 2.1 },
  { x: 644, y: 421, radius: 44, weight: 2.1 },
  { x: 165, y: 618, radius: 44, weight: 2.1 },
  { x: 621, y: 618, radius: 44, weight: 2.1 },
  { x: 442, y: 805, radius: 44, weight: 2.1 },
  { x: 598, y: 805, radius: 44, weight: 2.1 },
  { x: 187, y: 894, radius: 44, weight: 2.1 },
  { x: 575, y: 894, radius: 44, weight: 2.1 },
];

const METRO_MONSTER_ANCHORS: readonly DesignPlacementFieldAnchor[] = [
  { x: 176, y: 512, radius: 430, weight: 1.65 },
  { x: 842, y: 512, radius: 430, weight: 1.65 },
  { x: 512, y: 506, radius: 80, weight: 2.0 },
  { x: 512, y: 575, radius: 92, weight: 2.2 },
  { x: 304, y: 260, radius: 110, weight: 1.45 },
  { x: 580, y: 402, radius: 110, weight: 1.45 },
  { x: 304, y: 642, radius: 110, weight: 1.45 },
  { x: 580, y: 786, radius: 110, weight: 1.45 },
];

const DESIGN_FLOOR_POPULATION_OVERRIDES: Readonly<Record<DesignFloorId, DesignFloorPopulationOverride>> = {
  roof: {
    npcTarget: 0,
    monsterTarget: ACTIVE_ACTOR_SOFT_LIMIT,
    monsterBiasKinds: [MonsterKind.EYE, MonsterKind.SHADOW, MonsterKind.REBAR, MonsterKind.LAMPOGLAZ, MonsterKind.TONKAYA_TEN],
    monsterTags: ['roof', 'sky', 'antenna', 'signal', 'wind', 'open', 'weather'],
    monsterPlacementKind: 'roof',
  },
  chthonic_attic: {
    npcTarget: 0,
    monsterTarget: 4300,
    monsterBiasKinds: [
      MonsterKind.TUBE_EEL,
      MonsterKind.TRUBNYY_AVTOMAT,
      MonsterKind.PAUPSINA,
      MonsterKind.RZHAVNIK,
      MonsterKind.TUMANNIK,
      MonsterKind.FOG_SHARK,
      MonsterKind.REBAR,
      MonsterKind.POLZUN,
      MonsterKind.SHADOW,
    ],
    monsterTags: ['industrial', 'service', 'pipes', 'cable', 'storage', 'fog', 'smog', 'low', 'roots'],
    monsterPlacementKind: 'attic',
  },
  antenna_court: {
    npcTarget: 60,
    monsterTarget: 3400,
    npcNoun: 'сигнал-специалист',
    npcFactions: [{ value: Faction.SCIENTIST, weight: 64 }, { value: Faction.LIQUIDATOR, weight: 36 }],
    npcOccupations: [{ value: Occupation.SCIENTIST, weight: 42 }, { value: Occupation.HUNTER, weight: 24 }, { value: Occupation.ELECTRICIAN, weight: 22 }, { value: Occupation.MECHANIC, weight: 8 }, { value: Occupation.SECRETARY, weight: 4 }],
    monsterBiasKinds: [MonsterKind.SLIMEVIK, MonsterKind.SLIME_WOMAN, MonsterKind.EYE, MonsterKind.LAMPOVY, MonsterKind.LAMPOGLAZ, MonsterKind.SLEPOGLAZ, MonsterKind.SAFEGUARD, MonsterKind.TRUBNYY_AVTOMAT, MonsterKind.TUBE_EEL, MonsterKind.CHERNOSLIZ],
    monsterTags: ['signal', 'radio', 'screen', 'power', 'lab', 'pipes', 'slime', 'industrial', 'open'],
    npcPlacementKind: 'industrial',
    monsterPlacementKind: 'roof',
    npcPlacement: {
      noiseScale: 72,
      noiseStrength: 0.12,
      openWeight: 0.04,
      roomWeights: { [RoomType.PRODUCTION]: 1.8, [RoomType.HQ]: 1.7, [RoomType.OFFICE]: 1.45, [RoomType.STORAGE]: 1.34, [RoomType.CORRIDOR]: 0.28, [RoomType.COMMON]: 0.18, [RoomType.LIVING]: 0.12 },
      zoneWeights: { [ZoneFaction.LIQUIDATOR]: 1.8, [ZoneFaction.CITIZEN]: 0.52, [ZoneFaction.WILD]: 0.18, [ZoneFaction.SAMOSBOR]: 0.06, [ZoneFaction.CULTIST]: 0.08 },
      anchors: ANTENNA_COURT_ENCLAVE_ANCHORS,
      bucketSize: 48,
      maxPerBucket: 6,
      smoothingPasses: 1,
      smoothingBlend: 0.42,
    },
    monsterPlacement: {
      noiseScale: 152,
      noiseStrength: 0.16,
      openWeight: 1.42,
      roomWeights: { [RoomType.PRODUCTION]: 1.24, [RoomType.CORRIDOR]: 1.18, [RoomType.STORAGE]: 1.02, [RoomType.COMMON]: 0.72, [RoomType.OFFICE]: 0.48, [RoomType.HQ]: 0.36, [RoomType.LIVING]: 0.28 },
      zoneWeights: { [ZoneFaction.WILD]: 1.32, [ZoneFaction.SAMOSBOR]: 1.24, [ZoneFaction.CITIZEN]: 0.82, [ZoneFaction.LIQUIDATOR]: 0.58, [ZoneFaction.CULTIST]: 0.88 },
      anchors: ANTENNA_COURT_MONSTER_ANCHORS,
      bucketSize: 28,
      maxPerBucket: 9,
    },
  },
  pioneer_camp: {
    npcTarget: 1100,
    monsterTarget: 900,
    npcNoun: 'участник смены',
    npcFactions: CAMP_MIX,
    npcOccupations: CHILD_CAMP_OCCUPATIONS,
    monsterBiasKinds: [MonsterKind.NELYUD, MonsterKind.SHADOW, MonsterKind.EYE, MonsterKind.TUBE_EEL, MonsterKind.GREEN_DOG],
    monsterTags: ['residential', 'civil', 'corridor', 'storage', 'water', 'wet', 'camp', 'trail', 'old_camp'],
    npcPlacementKind: 'camp',
    monsterPlacementKind: 'camp',
  },
  upper_bureau: {
    npcTarget: 650,
    monsterTarget: 1100,
    npcNoun: 'проситель',
    npcFactions: UPPER_BUREAU_MIX,
    npcOccupations: UPPER_BUREAU_OCCUPATIONS,
    monsterBiasKinds: [MonsterKind.PARAGRAPH, MonsterKind.PECHATEED, MonsterKind.KONTORSHCHIK, MonsterKind.PROTOKOLNIK, MonsterKind.KANTSELYARSKIY_IDOL],
    monsterTags: ['documents', 'archive', 'paperwork', 'bureaucracy', 'queue', 'service'],
    npcPlacementKind: 'admin',
    monsterPlacementKind: 'admin',
    npcPlacement: {
      anchors: [
        { x: 260, y: 508, radius: 145, weight: 1.42 },
        { x: 444, y: 508, radius: 118, weight: 1.34 },
        { x: 590, y: 410, radius: 132, weight: 1.22 },
      ],
    },
    monsterPlacement: {
      anchors: [
        { x: 300, y: 508, radius: 170, weight: 0.72 },
        { x: 572, y: 502, radius: 118, weight: 1.42 },
        { x: 760, y: 540, radius: 185, weight: 1.78 },
        { x: 640, y: 720, radius: 210, weight: 1.45 },
      ],
    },
  },
  bank_floor: {
    npcTarget: 1400,
    monsterTarget: 650,
    npcFactions: [{ value: Faction.CITIZEN, weight: 62 }, { value: Faction.LIQUIDATOR, weight: 24 }, { value: Faction.WILD, weight: 11 }, { value: Faction.SCIENTIST, weight: 3 }],
    npcOccupations: [{ value: Occupation.SECRETARY, weight: 30 }, { value: Occupation.TRAVELER, weight: 24 }, { value: Occupation.STOREKEEPER, weight: 14 }, { value: Occupation.HUNTER, weight: 14 }, { value: Occupation.ALCOHOLIC, weight: 8 }, { value: Occupation.DIRECTOR, weight: 5 }, { value: Occupation.LOCKSMITH, weight: 5 }],
    monsterBiasKinds: [MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.KONTORSHCHIK, MonsterKind.PROTOKOLNIK, MonsterKind.SLEPOGLAZ],
    npcPlacementKind: 'bank',
    monsterPlacementKind: 'bank',
  },
  raionsovet_archive: {
    npcTarget: 1200,
    monsterTarget: 820,
    npcNoun: 'проситель',
    npcFactions: [{ value: Faction.CITIZEN, weight: 68 }, { value: Faction.LIQUIDATOR, weight: 24 }, { value: Faction.WILD, weight: 6 }, { value: Faction.SCIENTIST, weight: 2 }],
    npcOccupations: RAIONSOVET_OCCUPATIONS,
    monsterBiasKinds: [MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.KONTORSHCHIK, MonsterKind.PROTOKOLNIK, MonsterKind.BEZEKHIY],
    monsterTags: ['documents', 'archive', 'paperwork', 'storage', 'bureaucracy'],
    npcPlacementKind: 'admin',
    monsterPlacementKind: 'admin',
    npcPlacement: {
      noiseScale: 88,
      noiseStrength: 0.18,
      openWeight: 0.82,
      bucketSize: 32,
      maxPerBucket: 5,
      smoothingPasses: 2,
      smoothingBlend: 0.52,
      roomWeights: {
        [RoomType.COMMON]: 1.85,
        [RoomType.OFFICE]: 1.78,
        [RoomType.HQ]: 1.42,
        [RoomType.CORRIDOR]: 1.08,
        [RoomType.PRODUCTION]: 0.92,
        [RoomType.STORAGE]: 0.58,
      },
      zoneWeights: {
        [ZoneFaction.CITIZEN]: 1.2,
        [ZoneFaction.LIQUIDATOR]: 1.16,
        [ZoneFaction.WILD]: 0.82,
        [ZoneFaction.CULTIST]: 0.58,
        [ZoneFaction.SAMOSBOR]: 0.5,
      },
    },
    monsterPlacement: {
      noiseScale: 112,
      noiseStrength: 0.2,
      openWeight: 0.92,
      bucketSize: 28,
      maxPerBucket: 6,
      smoothingPasses: 2,
      smoothingBlend: 0.5,
      roomWeights: {
        [RoomType.STORAGE]: 2.05,
        [RoomType.CORRIDOR]: 1.18,
        [RoomType.PRODUCTION]: 1.12,
        [RoomType.HQ]: 0.82,
        [RoomType.OFFICE]: 0.68,
        [RoomType.COMMON]: 0.52,
      },
      zoneWeights: {
        [ZoneFaction.SAMOSBOR]: 1.38,
        [ZoneFaction.WILD]: 1.18,
        [ZoneFaction.CULTIST]: 1.12,
        [ZoneFaction.LIQUIDATOR]: 0.92,
        [ZoneFaction.CITIZEN]: 0.76,
      },
    },
  },
  registry_morgue: {
    npcTarget: 480,
    monsterTarget: 1150,
    npcFactions: [{ value: Faction.CITIZEN, weight: 43 }, { value: Faction.SCIENTIST, weight: 31 }, { value: Faction.LIQUIDATOR, weight: 23 }, { value: Faction.WILD, weight: 3 }],
    npcOccupations: [{ value: Occupation.DOCTOR, weight: 34 }, { value: Occupation.SECRETARY, weight: 23 }, { value: Occupation.HUNTER, weight: 16 }, { value: Occupation.SCIENTIST, weight: 12 }, { value: Occupation.TRAVELER, weight: 10 }],
    monsterBiasKinds: [MonsterKind.DIKIY_MERTVYAK, MonsterKind.BEZEKHIY, MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.NELYUD],
    npcPlacementKind: 'morgue',
    monsterPlacementKind: 'morgue',
  },
  slime_nii: {
    npcTarget: 1300,
    monsterTarget: 1700,
    npcNoun: 'сотрудник НИИ',
    npcFactions: [
      { value: Faction.SCIENTIST, weight: 48 },
      { value: Faction.LIQUIDATOR, weight: 28 },
      { value: Faction.CITIZEN, weight: 18 },
      { value: Faction.WILD, weight: 6 },
    ],
    npcOccupations: [
      { value: Occupation.SCIENTIST, weight: 42 },
      { value: Occupation.DOCTOR, weight: 18 },
      { value: Occupation.SECRETARY, weight: 12 },
      { value: Occupation.HUNTER, weight: 10 },
      { value: Occupation.ELECTRICIAN, weight: 5 },
      { value: Occupation.LOCKSMITH, weight: 5 },
      { value: Occupation.TRAVELER, weight: 8 },
    ],
    monsterBiasKinds: [MonsterKind.SLIMEVIK, MonsterKind.SLIME_WOMAN, MonsterKind.CHERNOSLIZ, MonsterKind.HEAD_SLUG, MonsterKind.BEZEKHIY],
    monsterTags: ['slime', 'toxic', 'sample', 'quarantine', 'medical', 'lab', 'water', 'sealed'],
    npcPlacementKind: 'slime',
    monsterPlacementKind: 'slime',
    npcPlacement: {
      anchors: [
        { x: 512, y: 548, radius: 150, weight: 1.6 },
        { x: 648, y: 544, radius: 124, weight: 1.42 },
        { x: 372, y: 548, radius: 122, weight: 1.25 },
        { x: 512, y: 404, radius: 112, weight: 1.2 },
      ],
    },
    monsterPlacement: {
      anchors: [
        { x: 306, y: 560, radius: 118, weight: 1.85 },
        { x: 718, y: 560, radius: 118, weight: 1.85 },
        { x: 614, y: 632, radius: 126, weight: 1.48 },
        { x: 512, y: 400, radius: 116, weight: 1.15 },
      ],
    },
  },
  manhattan_crossroads: {
    npcTarget: 3200,
    monsterTarget: 850,
    npcFactions: [{ value: Faction.CITIZEN, weight: 58 }, { value: Faction.WILD, weight: 25 }, { value: Faction.LIQUIDATOR, weight: 15 }, { value: Faction.SCIENTIST, weight: 2 }],
    npcOccupations: SOCIAL_OCCUPATIONS,
    monsterBiasKinds: [MonsterKind.REBAR, MonsterKind.SHADOW, MonsterKind.NELYUD, MonsterKind.BEZEKHIY, MonsterKind.EYE],
    npcPlacementKind: 'crossroads',
    monsterPlacementKind: 'crossroads',
  },
  communal_ring: {
    npcTarget: 3800,
    monsterTarget: 420,
    npcFactions: [{ value: Faction.CITIZEN, weight: 79 }, { value: Faction.WILD, weight: 12 }, { value: Faction.LIQUIDATOR, weight: 8 }, { value: Faction.SCIENTIST, weight: 1 }],
    npcOccupations: SOCIAL_OCCUPATIONS,
    monsterBiasKinds: [MonsterKind.KRYSNOZHKA, MonsterKind.POMOYNY_ROY, MonsterKind.NELYUD, MonsterKind.BEZEKHIY],
    npcPlacementKind: 'communal',
    monsterPlacementKind: 'communal',
  },
  floor_69: {
    npcTarget: 2200,
    monsterTarget: 380,
    npcFactions: [{ value: Faction.CITIZEN, weight: 78 }, { value: Faction.LIQUIDATOR, weight: 14 }, { value: Faction.SCIENTIST, weight: 5 }, { value: Faction.WILD, weight: 3 }],
    npcOccupations: FLOOR_69_OCCUPATIONS,
    npcNoun: 'посетитель',
    monsterBiasKinds: [MonsterKind.NELYUD, MonsterKind.PECHATEED, MonsterKind.BEZEKHIY, MonsterKind.SHADOW],
    monsterTags: ['social', 'debt', 'refuge', 'clinic', 'raid', 'samosbor'],
    npcPlacementKind: 'floor_69',
    monsterPlacementKind: 'floor_69',
  },
  black_market_88: {
    npcTarget: 2200,
    monsterTarget: 700,
    npcFactions: [{ value: Faction.CITIZEN, weight: 48 }, { value: Faction.WILD, weight: 31 }, { value: Faction.LIQUIDATOR, weight: 14 }, { value: Faction.SCIENTIST, weight: 7 }],
    npcOccupations: SOCIAL_OCCUPATIONS,
    monsterBiasKinds: [MonsterKind.KRYSNOZHKA, MonsterKind.POMOYNY_ROY, MonsterKind.NELYUD, MonsterKind.BEZEKHIY, MonsterKind.SLIMEVIK],
    monsterTags: ['market', 'contraband', 'storage', 'service', 'smoke', 'crowd'],
    npcNoun: 'покупатель',
    npcPlacementKind: 'social',
    monsterPlacementKind: 'industrial',
    npcPlacement: {
      noiseScale: 72,
      noiseStrength: 0.18,
      openWeight: 0.82,
      roomWeights: {
        [RoomType.COMMON]: 1.72,
        [RoomType.CORRIDOR]: 1.38,
        [RoomType.OFFICE]: 1.46,
        [RoomType.HQ]: 1.24,
        [RoomType.MEDICAL]: 1.32,
        [RoomType.SMOKING]: 1.22,
        [RoomType.LIVING]: 1.02,
        [RoomType.KITCHEN]: 0.96,
        [RoomType.STORAGE]: 0.36,
        [RoomType.PRODUCTION]: 0.28,
      },
      zoneWeights: {
        [ZoneFaction.CITIZEN]: 1.24,
        [ZoneFaction.WILD]: 1.14,
        [ZoneFaction.LIQUIDATOR]: 1.02,
        [ZoneFaction.SAMOSBOR]: 0.62,
        [ZoneFaction.CULTIST]: 0.58,
      },
      anchors: [
        { x: 512, y: 500, radius: 160, weight: 1.35 },
        { x: 512, y: 596, radius: 150, weight: 1.24 },
        { x: 604, y: 448, radius: 92, weight: 1.18 },
        { x: 462, y: 574, radius: 92, weight: 1.18 },
      ],
    },
    monsterPlacement: {
      noiseScale: 96,
      noiseStrength: 0.11,
      openWeight: 0.32,
      smoothingPasses: 1,
      roomWeights: {
        [RoomType.STORAGE]: 6.2,
        [RoomType.PRODUCTION]: 5.8,
        [RoomType.BATHROOM]: 2.1,
        [RoomType.CORRIDOR]: 1.48,
        [RoomType.HQ]: 0.7,
        [RoomType.MEDICAL]: 0.46,
        [RoomType.OFFICE]: 0.34,
        [RoomType.KITCHEN]: 0.34,
        [RoomType.LIVING]: 0.28,
        [RoomType.COMMON]: 0.26,
      },
      zoneWeights: {
        [ZoneFaction.WILD]: 1.58,
        [ZoneFaction.SAMOSBOR]: 1.42,
        [ZoneFaction.LIQUIDATOR]: 1.08,
        [ZoneFaction.CITIZEN]: 0.54,
        [ZoneFaction.CULTIST]: 1.08,
      },
      anchors: [
        { x: 168, y: 626, radius: 120, weight: 2.1 },
        { x: 858, y: 622, radius: 120, weight: 2.1 },
        { x: 684, y: 364, radius: 110, weight: 1.85 },
        { x: 112, y: 512, radius: 150, weight: 1.65 },
        { x: 914, y: 512, radius: 150, weight: 1.65 },
        { x: 512, y: 708, radius: 130, weight: 1.5 },
      ],
    },
  },
  production_belt: {
    npcTarget: 1300,
    monsterTarget: 1250,
    npcFactions: [{ value: Faction.CITIZEN, weight: 48 }, { value: Faction.LIQUIDATOR, weight: 34 }, { value: Faction.WILD, weight: 12 }, { value: Faction.SCIENTIST, weight: 6 }],
    npcOccupations: [
      { value: Occupation.MECHANIC, weight: 24 },
      { value: Occupation.TURNER, weight: 22 },
      { value: Occupation.ELECTRICIAN, weight: 18 },
      { value: Occupation.LOCKSMITH, weight: 14 },
      { value: Occupation.STOREKEEPER, weight: 8 },
      { value: Occupation.HUNTER, weight: 8 },
      { value: Occupation.TRAVELER, weight: 4 },
      { value: Occupation.SCIENTIST, weight: 2 },
    ],
    monsterBiasKinds: [MonsterKind.ROBOT, MonsterKind.TRUBNYY_AVTOMAT, MonsterKind.RZHAVNIK, MonsterKind.TUBE_EEL, MonsterKind.REBAR],
    npcPlacementKind: 'industrial',
    monsterPlacementKind: 'industrial',
  },
  service_floor: {
    npcTarget: 780,
    monsterTarget: 1600,
    npcNoun: 'ремонтник',
    npcFactions: [
      { value: Faction.LIQUIDATOR, weight: 52 },
      { value: Faction.CITIZEN, weight: 28 },
      { value: Faction.WILD, weight: 13 },
      { value: Faction.SCIENTIST, weight: 7 },
    ],
    npcOccupations: [
      { value: Occupation.MECHANIC, weight: 27 },
      { value: Occupation.ELECTRICIAN, weight: 22 },
      { value: Occupation.HUNTER, weight: 16 },
      { value: Occupation.LOCKSMITH, weight: 13 },
      { value: Occupation.TURNER, weight: 10 },
      { value: Occupation.STOREKEEPER, weight: 6 },
      { value: Occupation.TRAVELER, weight: 4 },
      { value: Occupation.SCIENTIST, weight: 2 },
    ],
    monsterBiasKinds: [
      MonsterKind.TUBE_EEL,
      MonsterKind.TRUBNYY_AVTOMAT,
      MonsterKind.RZHAVNIK,
      MonsterKind.PAUPSINA,
      MonsterKind.POLZUN,
      MonsterKind.LOTOCHNIK,
      MonsterKind.VODYANOY_KOSHMAR,
    ],
    monsterTags: ['industrial', 'service', 'pipes', 'pressure', 'water', 'machine', 'cable', 'low'],
    npcPlacementKind: 'industrial',
    monsterPlacementKind: 'industrial',
    npcPlacement: {
      noiseScale: 80,
      noiseStrength: 0.16,
      openWeight: 0.58,
      smoothingPasses: 1,
      bucketSize: 36,
      maxPerBucket: 5,
      roomWeights: {
        [RoomType.PRODUCTION]: 1.48,
        [RoomType.OFFICE]: 1.52,
        [RoomType.KITCHEN]: 1.72,
        [RoomType.STORAGE]: 1.32,
        [RoomType.CORRIDOR]: 0.72,
        [RoomType.HQ]: 1.28,
      },
      zoneWeights: {
        [ZoneFaction.LIQUIDATOR]: 1.42,
        [ZoneFaction.CITIZEN]: 1.05,
        [ZoneFaction.WILD]: 0.54,
        [ZoneFaction.CULTIST]: 0.48,
        [ZoneFaction.SAMOSBOR]: 0.36,
      },
      anchors: [
        { x: 416.5, y: 514.5, radius: 92, weight: 1.75 },
        { x: 503.5, y: 495.5, radius: 82, weight: 1.66 },
        { x: 482.5, y: 533.5, radius: 68, weight: 1.78 },
        { x: 562.5, y: 534.5, radius: 72, weight: 1.68 },
        { x: 448.5, y: 532.5, radius: 58, weight: 1.52 },
      ],
    },
    monsterPlacement: {
      noiseScale: 112,
      noiseStrength: 0.21,
      openWeight: 1.38,
      bucketSize: 28,
      maxPerBucket: 10,
      roomWeights: {
        [RoomType.PRODUCTION]: 1.76,
        [RoomType.STORAGE]: 1.42,
        [RoomType.CORRIDOR]: 1.48,
        [RoomType.BATHROOM]: 1.28,
        [RoomType.OFFICE]: 0.62,
        [RoomType.KITCHEN]: 0.55,
        [RoomType.HQ]: 0.78,
      },
      zoneWeights: {
        [ZoneFaction.SAMOSBOR]: 1.45,
        [ZoneFaction.WILD]: 1.28,
        [ZoneFaction.CULTIST]: 1.12,
        [ZoneFaction.LIQUIDATOR]: 0.86,
        [ZoneFaction.CITIZEN]: 0.64,
      },
      anchors: [
        { x: 520.5, y: 324.5, radius: 170, weight: 1.35 },
        { x: 520.5, y: 700.5, radius: 170, weight: 1.35 },
        { x: 332.5, y: 438.5, radius: 128, weight: 1.54 },
        { x: 704.5, y: 590.5, radius: 128, weight: 1.54 },
        { x: 327.5, y: 680.5, radius: 96, weight: 1.62 },
        { x: 697.5, y: 680.5, radius: 96, weight: 1.62 },
        { x: 548.5, y: 494.5, radius: 74, weight: 1.5 },
        { x: 632.5, y: 514.5, radius: 82, weight: 1.42 },
      ],
    },
  },
  silicon_net_well: {
    npcTarget: 560,
    monsterTarget: 1900,
    npcFactions: [{ value: Faction.SCIENTIST, weight: 52 }, { value: Faction.LIQUIDATOR, weight: 32 }, { value: Faction.CITIZEN, weight: 10 }, { value: Faction.WILD, weight: 6 }],
    npcOccupations: [{ value: Occupation.SCIENTIST, weight: 42 }, { value: Occupation.ELECTRICIAN, weight: 18 }, { value: Occupation.MECHANIC, weight: 15 }, { value: Occupation.HUNTER, weight: 14 }, { value: Occupation.SECRETARY, weight: 6 }],
    npcNoun: 'специалист',
    monsterBiasKinds: [MonsterKind.SAFEGUARD, MonsterKind.SLIMEVIK, MonsterKind.SLIME_WOMAN, MonsterKind.CHERVIE_AVATAR, MonsterKind.CHERNOSLIZ, MonsterKind.HEAD_SLUG],
    monsterTags: ['net', 'silicon', 'slime', 'screen', 'lab', 'sample', 'water', 'industrial'],
    npcPlacementKind: 'silicon',
    monsterPlacementKind: 'silicon',
  },
  dark_metro: {
    npcTarget: 180,
    monsterTarget: 3400,
    npcFactions: VETERAN_MIX,
    npcOccupations: VETERAN_OCCUPATIONS,
    npcNoun: 'ветеран',
    monsterBiasKinds: [MonsterKind.SHADOW, MonsterKind.TONKAYA_TEN, MonsterKind.GLUBINNAYA_TEN, MonsterKind.NELYUD, MonsterKind.TUBE_EEL],
    monsterTags: ['metro', 'rail', 'train', 'dark', 'tunnel', 'water', 'platform', 'industrial'],
    npcPlacementKind: 'metro',
    monsterPlacementKind: 'metro',
  },
  underhell: {
    npcTarget: 64,
    monsterTarget: 4032,
    npcFactions: UNDERHELL_THRESHOLD_MIX,
    npcOccupations: UNDERHELL_THRESHOLD_OCCUPATIONS,
    npcNoun: 'ветеран',
    monsterBiasKinds: [
      MonsterKind.KOSTOREZ,
      MonsterKind.OLGOY,
      MonsterKind.POLZUN,
      MonsterKind.ZHORNAYA_TVAR,
      MonsterKind.CHERNOSLIZ,
      MonsterKind.ZAKALENNAYA_ARMATURA,
      MonsterKind.GLUBINNAYA_TEN,
    ],
    monsterTags: ['hell', 'meat', 'gate', 'threshold', 'cage', 'cult', 'liquidator', 'void'],
    npcPlacementKind: 'underhell',
    monsterPlacementKind: 'underhell',
  },
  podad: {
    npcTarget: 0,
    monsterTarget: ACTIVE_ACTOR_SOFT_LIMIT,
    monsterBiasKinds: [MonsterKind.OLGOY, MonsterKind.KOSTOREZ, MonsterKind.ZHORNAYA_TVAR, MonsterKind.CHERNOSLIZ, MonsterKind.POLZUN],
    monsterTags: ['hell', 'podad', 'meat', 'deep', 'living_tunnels', 'moving_walls', 'section_shift', 'gate'],
    monsterPlacementKind: 'hell',
    monsterPlacement: {
      noiseScale: 112,
      noiseStrength: 0.08,
      openWeight: 1.22,
      roomWeights: {
        [RoomType.CORRIDOR]: 1.38,
        [RoomType.PRODUCTION]: 1.22,
        [RoomType.STORAGE]: 1.18,
        [RoomType.HQ]: 0.82,
      },
      anchors: PODAD_MONSTER_ANCHORS,
      bucketSize: 28,
      maxPerBucket: 14,
    },
  },
  darkness: {
    npcTarget: 0,
    monsterTarget: ACTIVE_ACTOR_SOFT_LIMIT,
    monsterBiasKinds: [MonsterKind.SHADOW, MonsterKind.TONKAYA_TEN, MonsterKind.GLUBINNAYA_TEN, MonsterKind.LISHENNYY, MonsterKind.SLEPOGLAZ],
    monsterTags: ['dark', 'low_light', 'void', 'route_pressure', 'sound', 'noise', 'light', 'lamp', 'protocol'],
    monsterPlacementKind: 'void',
    monsterPlacement: {
      noiseScale: 112,
      noiseStrength: 0.16,
      openWeight: 0.82,
      roomWeights: {
        [RoomType.CORRIDOR]: 1.42,
        [RoomType.OFFICE]: 1.24,
        [RoomType.STORAGE]: 1.16,
        [RoomType.COMMON]: 0.94,
        [RoomType.PRODUCTION]: 0.86,
      },
      anchors: DARKNESS_MONSTER_ANCHORS,
      bucketSize: 20,
      maxPerBucket: 7,
    },
  },
};

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function depth01(z: number): number {
  return Math.max(0, Math.min(1, Math.abs(z) / 50));
}

function baseNpcTarget(route: DesignFloorRouteDef): number {
  if (route.z <= -48 || Math.abs(route.z) >= 44) return 0;
  const habitation = Math.pow(Math.max(0, 1 - Math.abs(route.z) / 44), 1.7);
  const baseFloorMult = route.baseFloor === FloorLevel.KVARTIRY ? 1.18
    : route.baseFloor === FloorLevel.LIVING ? 1.08
      : route.baseFloor === FloorLevel.MINISTRY ? 0.74
        : route.baseFloor === FloorLevel.MAINTENANCE ? 0.54
          : route.baseFloor === FloorLevel.HELL ? 0.16
            : 0;
  return clampInt((260 + habitation * 4200) * baseFloorMult, 0, ENTITY_NPC_CAP);
}

function baseMonsterTarget(route: DesignFloorRouteDef): number {
  const edgePressure = Math.pow(depth01(route.z), 2.2);
  const baseFloorBonus = route.baseFloor === FloorLevel.HELL ? 1600
    : route.baseFloor === FloorLevel.VOID ? 1900
      : route.baseFloor === FloorLevel.MAINTENANCE ? 420
        : route.baseFloor === FloorLevel.KVARTIRY ? -180
          : route.baseFloor === FloorLevel.LIVING ? -120
            : 0;
  return clampInt(220 + route.danger * 120 + edgePressure * 7200 + baseFloorBonus, 0, ENTITY_MONSTER_CAP);
}

function defaultNpcFactions(route: DesignFloorRouteDef): readonly WeightedDesignValue<Faction>[] {
  if (route.baseFloor === FloorLevel.MAINTENANCE) return INDUSTRIAL_MIX;
  if (route.baseFloor === FloorLevel.HELL) return VETERAN_MIX;
  if (route.baseFloor === FloorLevel.MINISTRY) return ADMIN_MIX;
  return CITIZEN_MIX;
}

function defaultNpcOccupations(route: DesignFloorRouteDef): readonly WeightedDesignValue<Occupation>[] {
  if (route.baseFloor === FloorLevel.MAINTENANCE) return INDUSTRIAL_OCCUPATIONS;
  if (route.baseFloor === FloorLevel.HELL) return VETERAN_OCCUPATIONS;
  if (route.baseFloor === FloorLevel.MINISTRY) return ADMIN_OCCUPATIONS;
  return SOCIAL_OCCUPATIONS;
}

function defaultNpcNoun(route: DesignFloorRouteDef): string {
  if (route.baseFloor === FloorLevel.MAINTENANCE) return 'работник';
  if (route.baseFloor === FloorLevel.HELL) return 'паломник';
  if (route.baseFloor === FloorLevel.MINISTRY) return 'служащий';
  return 'житель';
}

function defaultPlacementKind(route: DesignFloorRouteDef): PlacementKind {
  if (route.baseFloor === FloorLevel.MAINTENANCE) return 'industrial';
  if (route.baseFloor === FloorLevel.HELL) return 'hell';
  if (route.baseFloor === FloorLevel.VOID) return 'void';
  if (route.baseFloor === FloorLevel.MINISTRY) return 'admin';
  return 'social';
}

function placementProfile(kind: PlacementKind, actor: 'npc' | 'monster', target: number): DesignPlacementFieldProfile {
  const maxPerBucket = actor === 'npc'
    ? Math.max(2, Math.min(10, Math.ceil(target / 520)))
    : Math.max(3, Math.min(18, Math.ceil(target / 620)));
  const base: DesignPlacementFieldProfile = {
    noiseScale: actor === 'npc' ? 96 : 128,
    noiseStrength: actor === 'npc' ? 0.22 : 0.18,
    openWeight: actor === 'npc' ? 1.0 : 1.05,
    bucketSize: actor === 'npc' ? 32 : 28,
    maxPerBucket,
    smoothingPasses: 2,
    smoothingBlend: 0.55,
  };
  switch (kind) {
    case 'social':
      return {
        ...base,
        roomWeights: actor === 'npc'
          ? { [RoomType.LIVING]: 1.45, [RoomType.KITCHEN]: 1.5, [RoomType.COMMON]: 1.35, [RoomType.CORRIDOR]: 1.2, [RoomType.SMOKING]: 1.15, [RoomType.STORAGE]: 0.75 }
          : { [RoomType.STORAGE]: 1.45, [RoomType.CORRIDOR]: 1.25, [RoomType.BATHROOM]: 1.15, [RoomType.SMOKING]: 1.1, [RoomType.KITCHEN]: 0.72, [RoomType.LIVING]: 0.65 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.CITIZEN]: 1.18, [ZoneFaction.WILD]: 1.08, [ZoneFaction.LIQUIDATOR]: 0.9, [ZoneFaction.CULTIST]: 0.72 }
          : { [ZoneFaction.WILD]: 1.28, [ZoneFaction.CULTIST]: 1.2, [ZoneFaction.LIQUIDATOR]: 1.04, [ZoneFaction.CITIZEN]: 0.84 },
      };
    case 'floor_69':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 84 : 112,
        noiseStrength: actor === 'npc' ? 0.2 : 0.14,
        maxPerBucket: actor === 'npc' ? Math.max(base.maxPerBucket ?? 0, 7) : base.maxPerBucket,
        roomWeights: actor === 'npc'
          ? {
            [RoomType.COMMON]: 1.62,
            [RoomType.MEDICAL]: 1.48,
            [RoomType.OFFICE]: 1.42,
            [RoomType.HQ]: 1.35,
            [RoomType.LIVING]: 1.26,
            [RoomType.CORRIDOR]: 1.18,
            [RoomType.SMOKING]: 1.08,
            [RoomType.STORAGE]: 0.78,
            [RoomType.PRODUCTION]: 0.62,
            [RoomType.BATHROOM]: 0.68,
          }
          : {
            [RoomType.STORAGE]: 1.45,
            [RoomType.CORRIDOR]: 1.24,
            [RoomType.HQ]: 1.12,
            [RoomType.OFFICE]: 0.96,
            [RoomType.PRODUCTION]: 1.18,
            [RoomType.COMMON]: 0.72,
            [RoomType.LIVING]: 0.62,
            [RoomType.MEDICAL]: 0.55,
          },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.CITIZEN]: 1.22, [ZoneFaction.LIQUIDATOR]: 1.08, [ZoneFaction.WILD]: 0.72, [ZoneFaction.CULTIST]: 0.55, [ZoneFaction.SAMOSBOR]: 0.48 }
          : { [ZoneFaction.WILD]: 1.24, [ZoneFaction.SAMOSBOR]: 1.18, [ZoneFaction.CULTIST]: 1.1, [ZoneFaction.LIQUIDATOR]: 0.92, [ZoneFaction.CITIZEN]: 0.78 },
        anchors: actor === 'npc'
          ? [
            { x: 482, y: 503, radius: 44, weight: 1.42 },
            { x: 510, y: 498, radius: 58, weight: 1.36 },
            { x: 538, y: 501, radius: 44, weight: 1.32 },
            { x: 538, y: 522, radius: 50, weight: 1.34 },
            { x: 554, y: 524, radius: 80, weight: 1.22 },
            { x: 790, y: 640, radius: 58, weight: 1.18 },
          ]
          : [
            { x: 554, y: 524, radius: 110, weight: 1.28 },
            { x: 736, y: 552, radius: 150, weight: 1.2 },
            { x: 904, y: 608, radius: 90, weight: 1.16 },
          ],
      };
    case 'communal':
      return {
        ...base,
        roomWeights: actor === 'npc'
          ? {
            [RoomType.KITCHEN]: 1.82,
            [RoomType.COMMON]: 1.72,
            [RoomType.LIVING]: 1.5,
            [RoomType.BATHROOM]: 1.36,
            [RoomType.PRODUCTION]: 1.34,
            [RoomType.CORRIDOR]: 1.24,
            [RoomType.SMOKING]: 1.12,
            [RoomType.OFFICE]: 1.0,
            [RoomType.STORAGE]: 0.78,
            [RoomType.HQ]: 0.62,
          }
          : {
            [RoomType.STORAGE]: 1.72,
            [RoomType.PRODUCTION]: 1.42,
            [RoomType.CORRIDOR]: 1.24,
            [RoomType.BATHROOM]: 1.18,
            [RoomType.COMMON]: 0.9,
            [RoomType.KITCHEN]: 0.66,
            [RoomType.LIVING]: 0.58,
            [RoomType.OFFICE]: 0.78,
          },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.CITIZEN]: 1.22, [ZoneFaction.WILD]: 1.1, [ZoneFaction.LIQUIDATOR]: 1.02, [ZoneFaction.SAMOSBOR]: 0.76, [ZoneFaction.CULTIST]: 0.62 }
          : { [ZoneFaction.SAMOSBOR]: 1.38, [ZoneFaction.WILD]: 1.24, [ZoneFaction.CULTIST]: 1.08, [ZoneFaction.LIQUIDATOR]: 0.98, [ZoneFaction.CITIZEN]: 0.74 },
      };
	    case 'admin':
      return {
        ...base,
        roomWeights: actor === 'npc'
          ? { [RoomType.OFFICE]: 1.8, [RoomType.COMMON]: 1.55, [RoomType.HQ]: 1.5, [RoomType.CORRIDOR]: 1.08, [RoomType.STORAGE]: 0.78, [RoomType.SMOKING]: 1.05 }
          : { [RoomType.STORAGE]: 2.1, [RoomType.CORRIDOR]: 1.45, [RoomType.HQ]: 1.22, [RoomType.OFFICE]: 1.05, [RoomType.SMOKING]: 1.16, [RoomType.COMMON]: 0.62 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.CITIZEN]: 1.18, [ZoneFaction.LIQUIDATOR]: 1.38, [ZoneFaction.WILD]: 0.68, [ZoneFaction.CULTIST]: 0.56, [ZoneFaction.SAMOSBOR]: 0.42 }
          : { [ZoneFaction.SAMOSBOR]: 1.52, [ZoneFaction.WILD]: 1.28, [ZoneFaction.CULTIST]: 1.16, [ZoneFaction.LIQUIDATOR]: 0.94, [ZoneFaction.CITIZEN]: 0.72 },
      };
    case 'bank':
      return actor === 'npc'
        ? {
          ...base,
          noiseScale: 84,
          noiseStrength: 0.16,
          bucketSize: 24,
          maxPerBucket: Math.max(base.maxPerBucket ?? 0, 7),
          smoothingPasses: 3,
          smoothingBlend: 0.62,
          roomWeights: { [RoomType.COMMON]: 1.82, [RoomType.OFFICE]: 1.62, [RoomType.HQ]: 1.5, [RoomType.CORRIDOR]: 0.98, [RoomType.STORAGE]: 0.82 },
          zoneWeights: { [ZoneFaction.CITIZEN]: 1.12, [ZoneFaction.LIQUIDATOR]: 1.24, [ZoneFaction.WILD]: 0.94, [ZoneFaction.CULTIST]: 0.62, [ZoneFaction.SAMOSBOR]: 0.55 },
          anchors: [
            { x: 514, y: 512, radius: 120, weight: 1.55 },
            { x: 506, y: 548, radius: 62, weight: 2.55 },
            { x: 512, y: 480, radius: 54, weight: 1.95 },
            { x: 573, y: 510, radius: 52, weight: 1.85 },
            { x: 610, y: 512, radius: 58, weight: 1.55 },
            { x: 512, y: 358, radius: 96, weight: 1.5 },
          ],
        }
        : {
          ...base,
          noiseScale: 112,
          noiseStrength: 0.12,
          bucketSize: 26,
          maxPerBucket: Math.max(base.maxPerBucket ?? 0, 5),
          smoothingPasses: 3,
          smoothingBlend: 0.58,
          roomWeights: { [RoomType.STORAGE]: 2.05, [RoomType.CORRIDOR]: 1.38, [RoomType.HQ]: 1.22, [RoomType.OFFICE]: 1.18, [RoomType.COMMON]: 0.66 },
          zoneWeights: { [ZoneFaction.SAMOSBOR]: 1.3, [ZoneFaction.WILD]: 1.16, [ZoneFaction.CULTIST]: 1.12, [ZoneFaction.LIQUIDATOR]: 0.98, [ZoneFaction.CITIZEN]: 0.86 },
          anchors: [
            { x: 603, y: 515, radius: 74, weight: 2.85 },
            { x: 756, y: 294, radius: 82, weight: 2.1 },
            { x: 573, y: 540, radius: 72, weight: 2.0 },
            { x: 528, y: 478, radius: 50, weight: 1.7 },
            { x: 612, y: 552, radius: 72, weight: 1.9 },
            { x: 512, y: 733, radius: 92, weight: 1.85 },
          ],
        };
    case 'industrial':
      return {
        ...base,
        roomWeights: actor === 'npc'
          ? { [RoomType.PRODUCTION]: 1.58, [RoomType.HQ]: 1.38, [RoomType.COMMON]: 1.22, [RoomType.OFFICE]: 1.18, [RoomType.STORAGE]: 1.02, [RoomType.CORRIDOR]: 0.96 }
          : { [RoomType.PRODUCTION]: 1.58, [RoomType.STORAGE]: 1.46, [RoomType.CORRIDOR]: 1.32, [RoomType.BATHROOM]: 1.12, [RoomType.COMMON]: 0.82, [RoomType.OFFICE]: 0.72, [RoomType.HQ]: 0.68 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.22, [ZoneFaction.CITIZEN]: 1.0, [ZoneFaction.WILD]: 0.96, [ZoneFaction.CULTIST]: 0.78 }
          : { [ZoneFaction.SAMOSBOR]: 1.24, [ZoneFaction.WILD]: 1.14, [ZoneFaction.CULTIST]: 1.1, [ZoneFaction.LIQUIDATOR]: 0.94 },
      };
    case 'silicon':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 76 : 118,
        noiseStrength: actor === 'npc' ? 0.14 : 0.18,
        openWeight: actor === 'npc' ? 0.78 : 1.18,
        bucketSize: actor === 'npc' ? 30 : 28,
        roomWeights: actor === 'npc'
          ? {
            [RoomType.MEDICAL]: 1.82,
            [RoomType.HQ]: 1.58,
            [RoomType.PRODUCTION]: 1.32,
            [RoomType.OFFICE]: 1.28,
            [RoomType.STORAGE]: 0.88,
            [RoomType.CORRIDOR]: 0.72,
            [RoomType.COMMON]: 0.54,
            [RoomType.BATHROOM]: 0.58,
          }
          : {
            [RoomType.COMMON]: 1.58,
            [RoomType.CORRIDOR]: 1.46,
            [RoomType.STORAGE]: 1.36,
            [RoomType.BATHROOM]: 1.24,
            [RoomType.PRODUCTION]: 1.18,
            [RoomType.OFFICE]: 0.76,
            [RoomType.HQ]: 0.68,
            [RoomType.MEDICAL]: 0.56,
          },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.46, [ZoneFaction.CITIZEN]: 0.92, [ZoneFaction.CULTIST]: 0.62, [ZoneFaction.WILD]: 0.58, [ZoneFaction.SAMOSBOR]: 0.34 }
          : { [ZoneFaction.SAMOSBOR]: 1.56, [ZoneFaction.WILD]: 1.32, [ZoneFaction.CULTIST]: 1.08, [ZoneFaction.CITIZEN]: 0.78, [ZoneFaction.LIQUIDATOR]: 0.58 },
      };
    case 'slime':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 88 : 112,
        noiseStrength: actor === 'npc' ? 0.18 : 0.14,
        openWeight: actor === 'npc' ? 0.84 : 1.08,
        bucketSize: actor === 'npc' ? 30 : 28,
        maxPerBucket: actor === 'npc'
          ? Math.max(3, Math.min(8, Math.ceil(target / 390)))
          : Math.max(4, Math.min(12, Math.ceil(target / 430))),
        roomWeights: actor === 'npc'
          ? {
            [RoomType.MEDICAL]: 1.78,
            [RoomType.PRODUCTION]: 1.5,
            [RoomType.OFFICE]: 1.36,
            [RoomType.HQ]: 1.3,
            [RoomType.COMMON]: 1.08,
            [RoomType.CORRIDOR]: 0.94,
            [RoomType.STORAGE]: 0.8,
            [RoomType.BATHROOM]: 0.62,
          }
          : {
            [RoomType.MEDICAL]: 1.58,
            [RoomType.PRODUCTION]: 1.54,
            [RoomType.BATHROOM]: 1.42,
            [RoomType.STORAGE]: 1.36,
            [RoomType.CORRIDOR]: 1.24,
            [RoomType.COMMON]: 0.78,
            [RoomType.OFFICE]: 0.64,
            [RoomType.HQ]: 0.58,
          },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.22, [ZoneFaction.CITIZEN]: 1.04, [ZoneFaction.WILD]: 0.78, [ZoneFaction.CULTIST]: 0.58, [ZoneFaction.SAMOSBOR]: 0.38 }
          : { [ZoneFaction.WILD]: 1.26, [ZoneFaction.SAMOSBOR]: 1.18, [ZoneFaction.LIQUIDATOR]: 1.02, [ZoneFaction.CULTIST]: 0.92, [ZoneFaction.CITIZEN]: 0.76 },
      };
    case 'attic': {
      const atticBase: DesignPlacementFieldProfile = actor === 'monster'
        ? {
          ...base,
          noiseScale: 112,
          noiseStrength: 0.12,
          openWeight: 0.78,
          bucketSize: 16,
          maxPerBucket: Math.max(5, Math.min(8, Math.ceil(target / 700))),
        }
        : base;
      return {
        ...atticBase,
        roomWeights: actor === 'npc'
          ? { [RoomType.HQ]: 1.35, [RoomType.PRODUCTION]: 1.2, [RoomType.STORAGE]: 1.05, [RoomType.CORRIDOR]: 0.9, [RoomType.OFFICE]: 0.72 }
          : { [RoomType.PRODUCTION]: 1.85, [RoomType.CORRIDOR]: 1.62, [RoomType.STORAGE]: 1.46, [RoomType.HQ]: 1.08, [RoomType.COMMON]: 0.74, [RoomType.OFFICE]: 0.42 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.18, [ZoneFaction.CULTIST]: 1.0, [ZoneFaction.WILD]: 0.82, [ZoneFaction.CITIZEN]: 0.62, [ZoneFaction.SAMOSBOR]: 0.35 }
          : { [ZoneFaction.SAMOSBOR]: 1.42, [ZoneFaction.CULTIST]: 1.28, [ZoneFaction.WILD]: 1.16, [ZoneFaction.LIQUIDATOR]: 0.82, [ZoneFaction.CITIZEN]: 0.46 },
      };
    }
    case 'hell':
      return {
        ...base,
        noiseStrength: actor === 'npc' ? 0.12 : 0.08,
        roomWeights: actor === 'npc'
          ? { [RoomType.HQ]: 1.65, [RoomType.CORRIDOR]: 1.05, [RoomType.STORAGE]: 0.95 }
          : { [RoomType.CORRIDOR]: 1.28, [RoomType.STORAGE]: 1.16, [RoomType.HQ]: 0.92 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.24, [ZoneFaction.CULTIST]: 1.2, [ZoneFaction.WILD]: 0.92, [ZoneFaction.CITIZEN]: 0.64 }
          : { [ZoneFaction.CULTIST]: 1.18, [ZoneFaction.SAMOSBOR]: 1.28, [ZoneFaction.WILD]: 1.06, [ZoneFaction.LIQUIDATOR]: 0.88 },
      };
    case 'underhell':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 112 : 150,
        noiseStrength: actor === 'npc' ? 0.08 : 0.07,
        openWeight: actor === 'npc' ? 0.42 : 1.0,
        bucketSize: actor === 'npc' ? 40 : 28,
        maxPerBucket: actor === 'npc'
          ? Math.max(2, Math.min(4, Math.ceil(target / 34)))
          : Math.max(8, Math.min(16, Math.ceil(target / 560))),
        roomWeights: actor === 'npc'
          ? {
            [RoomType.HQ]: 2.1,
            [RoomType.PRODUCTION]: 1.05,
            [RoomType.STORAGE]: 0.7,
            [RoomType.CORRIDOR]: 0.58,
            [RoomType.COMMON]: 0.45,
          }
          : {
            [RoomType.CORRIDOR]: 1.58,
            [RoomType.STORAGE]: 1.38,
            [RoomType.PRODUCTION]: 1.32,
            [RoomType.COMMON]: 1.08,
            [RoomType.HQ]: 0.74,
          },
        zoneWeights: actor === 'npc'
          ? {
            [ZoneFaction.LIQUIDATOR]: 1.48,
            [ZoneFaction.CULTIST]: 1.34,
            [ZoneFaction.WILD]: 0.35,
            [ZoneFaction.SAMOSBOR]: 0.32,
            [ZoneFaction.CITIZEN]: 0.2,
          }
          : {
            [ZoneFaction.CULTIST]: 1.32,
            [ZoneFaction.SAMOSBOR]: 1.45,
            [ZoneFaction.WILD]: 1.12,
            [ZoneFaction.LIQUIDATOR]: 0.68,
            [ZoneFaction.CITIZEN]: 0.35,
          },
        anchors: actor === 'npc'
          ? [
            { x: 512, y: 565, radius: 86, weight: 1.65 },
            { x: 512, y: 622, radius: 74, weight: 1.45 },
            { x: 443, y: 652, radius: 64, weight: 1.22 },
            { x: 581, y: 652, radius: 64, weight: 1.22 },
            { x: 512, y: 512, radius: 58, weight: 0.42 },
          ]
          : [
            { x: 512, y: 764, radius: 150, weight: 1.75 },
            { x: 512, y: 702, radius: 118, weight: 1.55 },
            { x: 432, y: 644, radius: 106, weight: 1.36 },
            { x: 592, y: 644, radius: 106, weight: 1.36 },
            { x: 512, y: 512, radius: 76, weight: 0.4 },
            { x: 448, y: 526, radius: 64, weight: 0.55 },
          ],
      };
    case 'void':
      return {
        ...base,
        noiseScale: 160,
        noiseStrength: 0.08,
        roomWeights: { [RoomType.CORRIDOR]: 1.25, [RoomType.STORAGE]: 1.1, [RoomType.HQ]: 0.85 },
        zoneWeights: { [ZoneFaction.SAMOSBOR]: 1.35, [ZoneFaction.CULTIST]: 1.08, [ZoneFaction.WILD]: 1.0, [ZoneFaction.CITIZEN]: 0.72 },
      };
    case 'roof':
      return {
        ...base,
        noiseScale: 208,
        noiseStrength: 0.08,
        openWeight: 1.1,
        bucketSize: 18,
        maxPerBucket: Math.max(base.maxPerBucket ?? 0, Math.min(32, Math.ceil(target / 180))),
        roomWeights: { [RoomType.PRODUCTION]: 1.75, [RoomType.HQ]: 1.4, [RoomType.CORRIDOR]: 1.28, [RoomType.STORAGE]: 1.18, [RoomType.COMMON]: 1.05, [RoomType.OFFICE]: 0.72 },
        zoneWeights: { [ZoneFaction.SAMOSBOR]: 1.28, [ZoneFaction.WILD]: 1.22, [ZoneFaction.CITIZEN]: 0.86, [ZoneFaction.LIQUIDATOR]: 0.92 },
      };
    case 'camp':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 82 : 118,
        noiseStrength: actor === 'npc' ? 0.16 : 0.14,
        bucketSize: actor === 'npc' ? 28 : 30,
        maxPerBucket: actor === 'npc'
          ? Math.max(3, Math.min(8, Math.ceil(target / 360)))
          : Math.max(3, Math.min(12, Math.ceil(target / 430))),
        anchors: actor === 'npc' ? CAMP_NPC_ANCHORS : CAMP_MONSTER_ANCHORS,
        roomWeights: actor === 'npc'
          ? { [RoomType.COMMON]: 1.78, [RoomType.KITCHEN]: 1.64, [RoomType.MEDICAL]: 1.5, [RoomType.PRODUCTION]: 1.34, [RoomType.LIVING]: 1.28, [RoomType.CORRIDOR]: 1.08, [RoomType.BATHROOM]: 0.82, [RoomType.STORAGE]: 0.58 }
          : { [RoomType.STORAGE]: 1.68, [RoomType.CORRIDOR]: 1.42, [RoomType.BATHROOM]: 1.34, [RoomType.LIVING]: 1.12, [RoomType.PRODUCTION]: 0.86, [RoomType.COMMON]: 0.58, [RoomType.KITCHEN]: 0.48, [RoomType.MEDICAL]: 0.44 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.CITIZEN]: 1.38, [ZoneFaction.LIQUIDATOR]: 0.78, [ZoneFaction.WILD]: 0.42, [ZoneFaction.SAMOSBOR]: 0.26, [ZoneFaction.CULTIST]: 0.34 }
          : { [ZoneFaction.WILD]: 1.72, [ZoneFaction.SAMOSBOR]: 1.42, [ZoneFaction.LIQUIDATOR]: 1.06, [ZoneFaction.CITIZEN]: 0.48, [ZoneFaction.CULTIST]: 1.04 },
      };
    case 'morgue':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 84 : 142,
        noiseStrength: actor === 'npc' ? 0.16 : 0.1,
        roomWeights: actor === 'npc'
          ? { [RoomType.OFFICE]: 1.72, [RoomType.MEDICAL]: 1.26, [RoomType.CORRIDOR]: 1.05, [RoomType.COMMON]: 0.92, [RoomType.STORAGE]: 0.58 }
          : { [RoomType.STORAGE]: 1.82, [RoomType.MEDICAL]: 1.46, [RoomType.CORRIDOR]: 1.34, [RoomType.COMMON]: 0.74, [RoomType.OFFICE]: 0.68 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.24, [ZoneFaction.CITIZEN]: 1.1, [ZoneFaction.WILD]: 0.66, [ZoneFaction.CULTIST]: 0.58, [ZoneFaction.SAMOSBOR]: 0.42 }
          : { [ZoneFaction.SAMOSBOR]: 1.46, [ZoneFaction.CULTIST]: 1.18, [ZoneFaction.WILD]: 1.08, [ZoneFaction.LIQUIDATOR]: 0.92, [ZoneFaction.CITIZEN]: 0.7 },
      };
    case 'crossroads':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 72 : 104,
        noiseStrength: actor === 'npc' ? 0.16 : 0.12,
        bucketSize: actor === 'npc' ? 28 : 30,
        maxPerBucket: actor === 'npc'
          ? Math.max(4, Math.min(8, Math.ceil(target / 620)))
          : Math.max(3, Math.min(10, Math.ceil(target / 700))),
        smoothingPasses: 3,
        smoothingBlend: 0.48,
        roomWeights: actor === 'npc'
          ? {
            [RoomType.CORRIDOR]: 1.55,
            [RoomType.COMMON]: 1.45,
            [RoomType.MEDICAL]: 1.38,
            [RoomType.OFFICE]: 1.24,
            [RoomType.STORAGE]: 1.18,
            [RoomType.PRODUCTION]: 0.92,
            [RoomType.LIVING]: 0.84,
          }
          : {
            [RoomType.STORAGE]: 1.85,
            [RoomType.CORRIDOR]: 1.48,
            [RoomType.PRODUCTION]: 1.32,
            [RoomType.COMMON]: 0.76,
            [RoomType.MEDICAL]: 0.72,
            [RoomType.OFFICE]: 0.8,
            [RoomType.LIVING]: 0.68,
          },
        zoneWeights: actor === 'npc'
          ? {
            [ZoneFaction.CITIZEN]: 1.12,
            [ZoneFaction.LIQUIDATOR]: 1.18,
            [ZoneFaction.WILD]: 1.08,
            [ZoneFaction.CULTIST]: 0.7,
            [ZoneFaction.SAMOSBOR]: 0.62,
          }
          : {
            [ZoneFaction.WILD]: 1.46,
            [ZoneFaction.SAMOSBOR]: 1.16,
            [ZoneFaction.LIQUIDATOR]: 0.82,
            [ZoneFaction.CITIZEN]: 0.72,
            [ZoneFaction.CULTIST]: 1.08,
          },
        anchors: actor === 'npc'
          ? [
            { x: 512, y: 512, radius: 128, weight: 1.75 },
            { x: 512, y: 536, radius: 74, weight: 1.65 },
            { x: 402, y: 552, radius: 82, weight: 1.45 },
            { x: 624, y: 474, radius: 70, weight: 1.32 },
            { x: 344, y: 512, radius: 92, weight: 1.34 },
            { x: 680, y: 512, radius: 96, weight: 1.28 },
            { x: 512, y: 680, radius: 88, weight: 1.22 },
            { x: 920, y: 512, radius: 110, weight: 1.18 },
          ]
          : [
            { x: 574, y: 564, radius: 82, weight: 2.05 },
            { x: 790, y: 622, radius: 118, weight: 2.3 },
            { x: 650, y: 628, radius: 120, weight: 1.86 },
            { x: 920, y: 512, radius: 120, weight: 1.62 },
            { x: 104, y: 676, radius: 118, weight: 1.42 },
            { x: 512, y: 920, radius: 112, weight: 1.36 },
          ],
      };
    case 'metro':
      return {
        ...base,
        noiseScale: actor === 'npc' ? 112 : 144,
        noiseStrength: actor === 'npc' ? 0.12 : 0.2,
        openWeight: actor === 'npc' ? 0.34 : 1.22,
        bucketSize: actor === 'npc' ? 44 : 28,
        maxPerBucket: actor === 'npc' ? Math.max(3, Math.min(5, Math.ceil(target / 64))) : maxPerBucket,
        roomWeights: actor === 'npc'
          ? { [RoomType.HQ]: 4.8, [RoomType.COMMON]: 2.45, [RoomType.PRODUCTION]: 1.7, [RoomType.STORAGE]: 1.25, [RoomType.CORRIDOR]: 0.68 }
          : { [RoomType.CORRIDOR]: 1.62, [RoomType.PRODUCTION]: 1.25, [RoomType.STORAGE]: 1.08, [RoomType.COMMON]: 0.44, [RoomType.HQ]: 0.28 },
        zoneWeights: actor === 'npc'
          ? { [ZoneFaction.LIQUIDATOR]: 1.72, [ZoneFaction.WILD]: 0.7, [ZoneFaction.CITIZEN]: 0.56, [ZoneFaction.CULTIST]: 0.58, [ZoneFaction.SAMOSBOR]: 0.32 }
          : { [ZoneFaction.SAMOSBOR]: 1.48, [ZoneFaction.WILD]: 1.34, [ZoneFaction.CULTIST]: 1.18, [ZoneFaction.LIQUIDATOR]: 0.62, [ZoneFaction.CITIZEN]: 0.58 },
        anchors: actor === 'npc' ? METRO_NPC_ANCHORS : METRO_MONSTER_ANCHORS,
      };
  }
  return base;
}

function mergePlacementProfile(
  base: DesignPlacementFieldProfile,
  override: Partial<DesignPlacementFieldProfile> | undefined,
): DesignPlacementFieldProfile {
  if (!override) return base;
  return {
    ...base,
    ...override,
    roomWeights: override.roomWeights ? { ...base.roomWeights, ...override.roomWeights } : base.roomWeights,
    zoneWeights: override.zoneWeights ? { ...base.zoneWeights, ...override.zoneWeights } : base.zoneWeights,
  };
}

export function designFloorPopulationProfile(route: DesignFloorRouteDef): DesignFloorPopulationProfile {
  const override = DESIGN_FLOOR_POPULATION_OVERRIDES[route.id] ?? {};
  const npcBase = baseNpcTarget(route);
  const monsterBase = baseMonsterTarget(route);
  const rawNpcTarget = clampInt(override.npcTarget ?? npcBase * (override.npcMult ?? 1), 0, ENTITY_NPC_CAP);
  const rawMonsterTarget = clampInt(override.monsterTarget ?? monsterBase * (override.monsterMult ?? 1), 0, ENTITY_MONSTER_CAP);
  const fitted = fitActiveActorCounts(rawNpcTarget, rawMonsterTarget);
  const npcTarget = fitted.npcs;
  const monsterTarget = fitted.monsters;
  const depthLevel = 1 + Math.round(depth01(route.z) * 8);
  const npcPlacementKind = override.npcPlacementKind ?? defaultPlacementKind(route);
  const monsterPlacementKind = override.monsterPlacementKind ?? defaultPlacementKind(route);
  const npcPlacement = mergePlacementProfile(placementProfile(npcPlacementKind, 'npc', npcTarget), override.npcPlacement);
  const monsterPlacement = mergePlacementProfile(placementProfile(monsterPlacementKind, 'monster', monsterTarget), override.monsterPlacement);
  return {
    routeId: route.id,
    z: route.z,
    npcTarget,
    monsterTarget,
    npcLevel: Math.max(1, depthLevel - 1),
    monsterLevel: Math.max(route.danger, depthLevel),
    npcNoun: override.npcNoun ?? defaultNpcNoun(route),
    npcFactions: override.npcFactions ?? defaultNpcFactions(route),
    npcOccupations: override.npcOccupations ?? defaultNpcOccupations(route),
    monsterBiasKinds: override.monsterBiasKinds ?? [],
    monsterTags: override.monsterTags ?? [],
    npcPlacement,
    monsterPlacement,
  };
}

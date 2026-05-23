import {
  W,
  Cell,
  EntityType,
  AIGoal,
  Faction,
  FloorLevel,
  Occupation,
  type Entity,
  type GameState,
  type Item,
  type RPGStats,
} from '../core/types';
import { World } from '../core/world';
import { DESIGN_FLOOR_ROUTES } from '../data/design_floors';
import {
  floorRunZAllowsNpcs,
  majorityById,
  PROCEDURAL_FLOOR_ZS,
  proceduralFloorAnomalyRoutePressure,
  type ProceduralFloorSpec,
} from '../data/procedural_floors';
import {
  proceduralPopulationBudget,
  proceduralPopulationProfileId,
} from '../data/population_profiles';
import {
  ALIFE_COMMON_POCKETS,
  ALIFE_FACTION_PROFILES,
  ALIFE_MAX_LEVEL,
  type AlifeFactionProfile,
  type WeightedValue,
} from '../data/alife_generation';
import { freshNeeds } from '../data/catalog';
import { ensureFloorRunState, floorRunEntryRouteId, currentFloorRunEntry } from './procedural_floors';
import { getMaxHp, getMaxPsi } from './rpg';
import {
  NPC_PLAYER_RELATION_FLUCTUATION,
  clampRelation,
  getFactionPlayerRelation,
} from './npc_relations';
import {
  clampKarma,
  entityRankScore,
  initialNpcKarma,
  rankScore,
  type RankStats,
} from './alife_rating';

const ALIFE_VERSION = 1;
const ALIFE_TARGET_POPULATION = 1_000_000;
const ALIFE_FALLBACK_POPULATION = 100_000;
const ALIFE_ESTIMATED_OBJECT_MB_PER_100K = 43;
const ALIFE_HEAP_RESERVE_MB = 512;
const ALIFE_DESKTOP_DEVICE_MEMORY_GB = 8;
const BYTES_PER_MB = 1024 * 1024;
const ALIFE_MIN_FLOOR_POOL = 32;
const ALIFE_SAVE_OVERRIDE_CAP = 12_000;

const STORY_FLOOR_KEYS: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'story:ministry',
  [FloorLevel.KVARTIRY]: 'story:kvartiry',
  [FloorLevel.LIVING]: 'story:living',
  [FloorLevel.MAINTENANCE]: 'story:maintenance',
  [FloorLevel.HELL]: 'story:hell',
  [FloorLevel.VOID]: 'story:void',
};

interface AlifeFloorPlan {
  key: string;
  floor: FloorLevel;
  danger: 1 | 2 | 3 | 4 | 5;
  weight: number;
  majorityFaction?: Faction;
}

interface AlifeNpcRecord {
  id: number;
  floorKey: string;
  floor: FloorLevel;
  faction: Faction;
  occupation: Occupation;
  name: string;
  female: boolean;
  level: number;
  str: number;
  agi: number;
  int: number;
  hp: number;
  maxHp: number;
  money: number;
  activeMoney?: number;
  familyId: number;
  canGiveQuest: boolean;
  sprite?: number;
  spriteSeed?: number;
  weapon?: string;
  inventory?: Item[];
  kills?: number;
  npcKills?: number;
  monsterKills?: number;
  playerRelation?: number;
  karma: number;
  x?: number;
  y?: number;
  angle?: number;
  dead?: boolean;
  touched?: boolean;
}

export interface AlifeNpcOverride {
  id: number;
  x?: number;
  y?: number;
  angle?: number;
  hp?: number;
  money?: number;
  weapon?: string;
  inventory?: Item[];
  rpg?: RPGStats;
  sprite?: number;
  spriteSeed?: number;
  kills?: number;
  npcKills?: number;
  monsterKills?: number;
  playerRelation?: number;
  karma?: number;
}

export interface AlifeSaveState {
  version: number;
  seed: number;
  total: number;
  deadIds: number[];
  deadPlotNpcIds: string[];
  overrides: AlifeNpcOverride[];
}

interface AlifeState {
  version: number;
  seed: number;
  total: number;
  npcs: AlifeNpcRecord[];
  floorIndex: Record<string, number[]>;
  deadPlotNpcIds: Set<string>;
  leaderboardVersion: number;
  leaderboardCache?: AlifeLeaderboardSnapshot & { signature: string; limit: number };
}

export interface AlifeLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  faction: Faction;
  floorKey?: string;
  level: number;
  score: number;
  kills: number;
  npcKills: number;
  monsterKills: number;
  karma: number;
  player: boolean;
}

export interface AlifeLeaderboardSnapshot {
  entries: AlifeLeaderboardEntry[];
  player: AlifeLeaderboardEntry;
  totalAlive: number;
}

type AlifeHost = GameState & { alife?: AlifeState };
type RuntimePerformance = Performance & { memory?: { jsHeapSizeLimit?: number } };
type RuntimeNavigator = Navigator & { deviceMemory?: number };

const CITIZEN_MALE = ['Иван', 'Петр', 'Алексей', 'Дмитрий', 'Сергей', 'Андрей', 'Николай', 'Михаил'];
const CITIZEN_FEMALE = ['Мария', 'Анна', 'Елена', 'Ольга', 'Наталья', 'Татьяна', 'Ирина', 'Светлана'];
const CITIZEN_LAST = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Попов', 'Васильев', 'Соколов', 'Михайлов'];
const LIQ_RANKS = ['Рядовой', 'Сержант', 'Лейтенант', 'Капитан', 'Майор'];
const LIQ_LAST = ['Петренко', 'Бондаренко', 'Шевченко', 'Коваль', 'Мельник', 'Кравченко'];
const WILD_NAMES = ['Серый', 'Толик', 'Леха', 'Колян', 'Жека', 'Саня', 'Вован', 'Костыль'];
const WILD_NICKS = ['Бетон', 'Шило', 'Гвоздь', 'Дым', 'Кирпич', 'Резак', 'Труба', 'Цемент'];
const CULT_ADJ = ['Черный', 'Кровавый', 'Безглазый', 'Гнилой', 'Темный', 'Слепой', 'Пепельный'];
const CULT_NOUN = ['Идол', 'Коготь', 'Червь', 'Столп', 'Глаз', 'Шепот', 'Голод'];

function hash32(a: number, b: number, c = 0): number {
  let x = (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) + Math.imul(b ^ 0xc2b2ae35, 0x27d4eb2d) + c) | 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  x = Math.imul(x, 0x297a2d39);
  x ^= x >>> 15;
  return x >>> 0;
}

function unit(seed: number, index: number, salt: number): number {
  return hash32(seed, index, salt) / 0x100000000;
}

function pickDet<T>(items: readonly T[], seed: number, index: number, salt: number): T {
  return items[Math.floor(unit(seed, index, salt) * items.length) % items.length];
}

function pickWeighted<T>(items: readonly WeightedValue<T>[], seed: number, index: number, salt: number): T {
  let total = 0;
  for (const item of items) total += Math.max(0, item.weight);
  if (total <= 0) return items[0].value;
  let roll = unit(seed, index, salt) * total;
  for (const item of items) {
    roll -= Math.max(0, item.weight);
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function runtimeHeapLimitMb(): number | undefined {
  const limit = (globalThis.performance as RuntimePerformance | undefined)?.memory?.jsHeapSizeLimit;
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) return undefined;
  return limit / BYTES_PER_MB;
}

export function defaultAlifePopulation(): number {
  const targetPoolMb = ALIFE_ESTIMATED_OBJECT_MB_PER_100K * (ALIFE_TARGET_POPULATION / 100_000);
  const heapLimitMb = runtimeHeapLimitMb();
  if (heapLimitMb !== undefined) {
    return heapLimitMb >= targetPoolMb + ALIFE_HEAP_RESERVE_MB ? ALIFE_TARGET_POPULATION : ALIFE_FALLBACK_POPULATION;
  }
  const deviceMemory = (globalThis.navigator as RuntimeNavigator | undefined)?.deviceMemory;
  if (typeof deviceMemory === 'number' && Number.isFinite(deviceMemory)) {
    return deviceMemory >= ALIFE_DESKTOP_DEVICE_MEMORY_GB ? ALIFE_TARGET_POPULATION : ALIFE_FALLBACK_POPULATION;
  }
  return ALIFE_FALLBACK_POPULATION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function storyDanger(floor: FloorLevel): 1 | 2 | 3 | 4 | 5 {
  switch (floor) {
    case FloorLevel.LIVING: return 1;
    case FloorLevel.KVARTIRY:
    case FloorLevel.MINISTRY: return 3;
    case FloorLevel.MAINTENANCE: return 4;
    case FloorLevel.HELL:
    case FloorLevel.VOID: return 5;
  }
}

function storyWeight(floor: FloorLevel): number {
  switch (floor) {
    case FloorLevel.KVARTIRY: return 10_000;
    case FloorLevel.LIVING: return 7_000;
    case FloorLevel.MINISTRY: return 4_500;
    case FloorLevel.MAINTENANCE: return 3_500;
    case FloorLevel.HELL: return 1_100;
    case FloorLevel.VOID: return 0;
  }
}

function isIndustrialGeometry(id: ProceduralFloorSpec['geometryId']): boolean {
  return id === 'collectors' ||
    id === 'workshops' ||
    id === 'service_spines' ||
    id === 'attic_weatherworks' ||
    id === 'sump_causeways';
}

function proceduralPlanWeight(spec: ProceduralFloorSpec): number {
  if (!floorRunZAllowsNpcs(spec.z)) return 0;
  return proceduralPopulationBudget({
    z: spec.z,
    danger: spec.danger,
    anomalyPressure: proceduralFloorAnomalyRoutePressure(spec),
    industrial: isIndustrialGeometry(spec.geometryId),
    npcAllowed: true,
    profileId: proceduralPopulationProfileId(spec.anomalyId),
  }).npcs;
}

function buildFloorPlans(state: GameState): AlifeFloorPlan[] {
  const plans: AlifeFloorPlan[] = [];
  for (const floor of [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL]) {
    plans.push({ key: STORY_FLOOR_KEYS[floor], floor, danger: storyDanger(floor), weight: storyWeight(floor) });
  }
  for (const def of DESIGN_FLOOR_ROUTES) {
    if (!floorRunZAllowsNpcs(def.z)) continue;
    plans.push({
      key: def.id,
      floor: def.baseFloor,
      danger: def.danger,
      weight: 520 + def.danger * 360,
    });
  }
  const run = ensureFloorRunState(state);
  for (const z of PROCEDURAL_FLOOR_ZS) {
    const key = `z${z}`;
    const spec = run.specs[key] ?? Object.values(run.specs).find(candidate => candidate.z === z);
    if (!spec) continue;
    const weight = proceduralPlanWeight(spec);
    if (weight <= 0) continue;
    plans.push({
      key: spec.key,
      floor: spec.baseFloor,
      danger: spec.danger,
      weight,
      majorityFaction: majorityById(spec.majorityId).npcFaction,
    });
  }
  return plans;
}

function allocatedCounts(plans: readonly AlifeFloorPlan[], total: number): number[] {
  const sum = plans.reduce((acc, plan) => acc + plan.weight, 0);
  if (sum <= 0 || total <= 0) return plans.map(() => 0);
  const counts = plans.map(plan => {
    const raw = total * plan.weight / sum;
    return plan.weight > 0 ? Math.max(ALIFE_MIN_FLOOR_POOL, Math.floor(raw)) : 0;
  });
  let used = counts.reduce((acc, count) => acc + count, 0);
  if (used > total) {
    for (let i = counts.length - 1; i >= 0 && used > total; i--) {
      const drop = Math.min(counts[i], used - total);
      counts[i] -= drop;
      used -= drop;
    }
  }
  let cursor = 0;
  while (used < total && counts.length > 0) {
    counts[cursor % counts.length]++;
    cursor++;
    used++;
  }
  return counts;
}

function profileForFaction(faction: Faction): AlifeFactionProfile {
  return ALIFE_FACTION_PROFILES.find(profile => profile.faction === faction) ?? ALIFE_FACTION_PROFILES[0];
}

function factionProfileWeight(profile: AlifeFactionProfile, plan: AlifeFloorPlan): number {
  const floorMult = profile.floorWeights[plan.floor] ?? 1;
  const dangerMult = Math.max(0.05, 1 + (plan.danger - 3) * profile.dangerBias);
  const majorityMult = plan.majorityFaction === profile.faction ? 4.5 : 1;
  const floor69Mult = plan.key === 'floor_69' && profile.faction === Faction.CITIZEN ? 1.9 : 1;
  return profile.baseWeight * floorMult * dangerMult * majorityMult * floor69Mult;
}

function factionForPlan(plan: AlifeFloorPlan, seed: number, index: number): Faction {
  const weighted = ALIFE_FACTION_PROFILES.map(profile => ({
    value: profile.faction,
    weight: factionProfileWeight(profile, plan),
  }));
  return pickWeighted(weighted, seed, index, 11);
}

function occupationForRecord(profile: AlifeFactionProfile, floor: FloorLevel, seed: number, index: number): Occupation {
  if (profile.faction === Faction.CITIZEN && floor === FloorLevel.MAINTENANCE) {
    return unit(seed, index, 22) < 0.55 ? Occupation.MECHANIC : Occupation.ELECTRICIAN;
  }
  if (profile.faction === Faction.CITIZEN && floor === FloorLevel.MINISTRY) {
    return unit(seed, index, 23) < 0.58 ? Occupation.SECRETARY : Occupation.DIRECTOR;
  }
  return pickWeighted(profile.occupations, seed, index, 24);
}

function nameForRecord(faction: Faction, seed: number, index: number): { name: string; female: boolean } {
  if (faction === Faction.LIQUIDATOR) {
    return {
      name: `${pickDet(LIQ_RANKS, seed, index, 31)} ${pickDet(LIQ_LAST, seed, index, 32)}`,
      female: false,
    };
  }
  if (faction === Faction.CULTIST) {
    return {
      name: `${pickDet(CULT_ADJ, seed, index, 33)} ${pickDet(CULT_NOUN, seed, index, 34)}`,
      female: false,
    };
  }
  if (faction === Faction.WILD) {
    return {
      name: `${pickDet(WILD_NAMES, seed, index, 35)} "${pickDet(WILD_NICKS, seed, index, 36)}"`,
      female: false,
    };
  }
  const female = unit(seed, index, 37) < 0.5;
  const first = pickDet(female ? CITIZEN_FEMALE : CITIZEN_MALE, seed, index, 38);
  const last = pickDet(CITIZEN_LAST, seed, index, 39);
  return { name: `${first} ${last}${female ? 'а' : ''}`, female };
}

function rpgForRecord(level: number, seed: number, index: number): RPGStats {
  const points = Math.max(0, level - 1);
  let str = 0;
  let agi = 0;
  let int = 0;
  for (let i = 0; i < points; i++) {
    const roll = unit(seed, index, 100 + i);
    if (roll < 0.34) str++;
    else if (roll < 0.67) agi++;
    else int++;
  }
  const shell = { level, xp: 0, attrPoints: 0, str, agi, int, psi: 0, maxPsi: 0 };
  const maxPsi = getMaxPsi(shell);
  return { ...shell, psi: maxPsi, maxPsi };
}

function levelForRecord(plan: AlifeFloorPlan, faction: Faction, seed: number, index: number): number {
  const eliteBias = faction === Faction.LIQUIDATOR || faction === Faction.SCIENTIST || faction === Faction.CULTIST ? 0.14 : 0;
  const exponent = Math.max(0.82, Math.min(1.48, 1.46 - plan.danger * 0.11 - eliteBias));
  const scaled = Math.pow(unit(seed, index, 41), exponent) * Math.log(ALIFE_MAX_LEVEL + 1);
  return Math.max(1, Math.min(ALIFE_MAX_LEVEL, 1 + Math.floor(Math.expm1(scaled))));
}

function moneyForRecord(plan: AlifeFloorPlan, profile: AlifeFactionProfile, level: number, seed: number, index: number): number {
  const floorMult = plan.floor === FloorLevel.MINISTRY ? 2.4
    : plan.key === 'bank_floor' ? 6.5
      : plan.floor === FloorLevel.MAINTENANCE ? 1.25
        : plan.floor === FloorLevel.HELL ? 0.45
          : 1;
  const base = (8 + plan.danger * 3 + level * 0.8) * profile.wealthMult * floorMult;
  const u = Math.max(0.000001, 1 - unit(seed, index, 42));
  const tail = Math.pow(u, -0.8) - 1;
  const money = Math.floor(base * (0.45 + tail));
  return Math.max(0, Math.min(5_000_000, money));
}

function loadoutForRecord(faction: Faction, danger: number, level: number, seed: number, index: number): { weapon?: string; inventory?: Item[] } {
  const roll = unit(seed, index, 51);
  if (faction === Faction.LIQUIDATOR) {
    if ((danger >= 4 || level >= 35) && roll < 0.2) return { weapon: 'ak47', inventory: [{ defId: 'ak47', count: 1 }, { defId: 'ammo_762', count: 24 }] };
    if (level >= 18 && roll < 0.42) return { weapon: 'shotgun', inventory: [{ defId: 'shotgun', count: 1 }, { defId: 'ammo_shells', count: 8 }] };
    if (roll < 0.68) return { weapon: 'makarov', inventory: [{ defId: 'makarov', count: 1 }, { defId: 'ammo_9mm', count: 18 }] };
    return { weapon: 'pipe', inventory: [{ defId: 'pipe', count: 1 }] };
  }
  if (faction === Faction.CULTIST) {
    if (roll < 0.28 + Math.min(0.22, level * 0.004)) return { weapon: 'psi_strike', inventory: [{ defId: 'psi_strike', count: 1 }] };
    return { weapon: 'knife', inventory: [{ defId: 'knife', count: 1 }] };
  }
  if (faction === Faction.WILD) {
    if (level >= 22 && roll < 0.16) return { weapon: 'homemade_pistol', inventory: [{ defId: 'homemade_pistol', count: 1 }, { defId: 'ammo_9mm', count: 5 }] };
    return { weapon: 'pipe', inventory: [{ defId: 'pipe', count: 1 }] };
  }
  if (roll < 0.12 + danger * 0.02 + Math.min(0.1, level * 0.002)) return { weapon: 'knife', inventory: [{ defId: 'knife', count: 1 }] };
  return {};
}

function mergeInventory(...parts: Array<readonly Item[] | undefined>): Item[] | undefined {
  const out: Item[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const item of part) {
      const existing = out.find(candidate => candidate.defId === item.defId && candidate.data === item.data);
      if (existing) existing.count = Math.min(999, existing.count + item.count);
      else if (out.length < 8) out.push({ ...item });
    }
  }
  return out.length > 0 ? out : undefined;
}

function pocketItemsForRecord(faction: Faction, occupation: Occupation, danger: number, seed: number, index: number): Item[] | undefined {
  const out: Item[] = [];
  for (let i = 0; i < ALIFE_COMMON_POCKETS.length; i++) {
    const profile = ALIFE_COMMON_POCKETS[i];
    if (profile.faction !== undefined && profile.faction !== faction) continue;
    if (profile.occupation !== undefined && profile.occupation !== occupation) continue;
    if (profile.minDanger !== undefined && danger < profile.minDanger) continue;
    if (unit(seed, index, 700 + i) > profile.chance) continue;
    out.push({ ...pickWeighted(profile.items, seed, index, 760 + i) });
    if (out.length >= 4) break;
  }
  return out.length > 0 ? out : undefined;
}

function playerRelationForRecord(record: AlifeNpcRecord, seed: number): number {
  const base = getFactionPlayerRelation(record.faction);
  const jitter = Math.round((unit(seed, record.id, 88) * 2 - 1) * NPC_PLAYER_RELATION_FLUCTUATION);
  return clampRelation(base + jitter);
}

function questCandidateChance(faction: Faction, occupation: Occupation): number {
  let chance = 0.08;
  if (faction === Faction.LIQUIDATOR || occupation === Occupation.HUNTER) chance += 0.08;
  if (faction === Faction.SCIENTIST || occupation === Occupation.SCIENTIST) chance += 0.07;
  if (
    occupation === Occupation.COOK ||
    occupation === Occupation.DOCTOR ||
    occupation === Occupation.LOCKSMITH ||
    occupation === Occupation.MECHANIC ||
    occupation === Occupation.STOREKEEPER ||
    occupation === Occupation.SECRETARY ||
    occupation === Occupation.DIRECTOR
  ) chance += 0.05;
  if (occupation === Occupation.CHILD || occupation === Occupation.ALCOHOLIC) chance -= 0.04;
  if (faction === Faction.WILD) chance -= 0.03;
  return Math.max(0.04, Math.min(0.24, chance));
}

function activeMoneyCap(record: AlifeNpcRecord): number {
  let cap = record.faction === Faction.SCIENTIST || record.faction === Faction.LIQUIDATOR ? 700
    : record.faction === Faction.WILD || record.faction === Faction.CULTIST ? 120
      : 80;
  if (
    record.occupation === Occupation.STOREKEEPER ||
    record.occupation === Occupation.COOK ||
    record.occupation === Occupation.DOCTOR ||
    record.occupation === Occupation.SECRETARY ||
    record.occupation === Occupation.DIRECTOR
  ) {
    cap = Math.max(cap, record.floorKey === 'bank_floor' || record.floor === FloorLevel.MINISTRY ? 1600 : 500);
  }
  if (record.level >= 45) cap = Math.round(cap * 1.35);
  return Math.min(2_000, cap);
}

function activeMoneyForRecord(record: AlifeNpcRecord, seed: number): number {
  if (record.activeMoney !== undefined) return Math.max(0, Math.min(record.money, Math.floor(record.activeMoney)));
  const cap = activeMoneyCap(record);
  if (record.money <= cap) return record.money;
  const spread = 0.65 + unit(seed, record.id, 96) * 0.7;
  return Math.max(0, Math.min(record.money, Math.round(cap * spread)));
}

function createRecord(id: number, plan: AlifeFloorPlan, seed: number): AlifeNpcRecord {
  const faction = factionForPlan(plan, seed, id);
  const profile = profileForFaction(faction);
  const occupation = occupationForRecord(profile, plan.floor, seed, id);
  const level = levelForRecord(plan, faction, seed, id);
  const rpg = rpgForRecord(level, seed, id);
  const maxHp = getMaxHp(rpg);
  const named = nameForRecord(faction, seed, id);
  const money = moneyForRecord(plan, profile, level, seed, id);
  const loadout = loadoutForRecord(faction, plan.danger, level, seed, id);
  const pockets = pocketItemsForRecord(faction, occupation, plan.danger, seed, id);
  return {
    id,
    floorKey: plan.key,
    floor: plan.floor,
    faction,
    occupation,
    name: named.name,
    female: named.female,
    level,
    str: rpg.str,
    agi: rpg.agi,
    int: rpg.int,
    hp: maxHp,
    maxHp,
    money,
    familyId: Math.floor((id - 1) / 4),
    canGiveQuest: unit(seed, id, 94) < questCandidateChance(faction, occupation),
    weapon: loadout.weapon,
    inventory: mergeInventory(loadout.inventory, pockets),
    karma: initialNpcKarma(faction, occupation, unit(seed, id, 93)),
  };
}

function createAlifeState(state: GameState, seed: number, total: number): AlifeState {
  const boundedTotal = Math.max(1_000, Math.min(ALIFE_TARGET_POPULATION, Math.floor(total)));
  const plans = buildFloorPlans(state);
  const counts = allocatedCounts(plans, boundedTotal);
  const npcs: AlifeNpcRecord[] = [];
  const floorIndex: Record<string, number[]> = {};
  let id = 1;
  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const bucket = floorIndex[plan.key] ?? [];
    floorIndex[plan.key] = bucket;
    for (let n = 0; n < counts[i]; n++) {
      bucket.push(npcs.length);
      npcs.push(createRecord(id++, plan, seed));
    }
  }
  return { version: ALIFE_VERSION, seed, total: boundedTotal, npcs, floorIndex, deadPlotNpcIds: new Set(), leaderboardVersion: 0 };
}

export function ensureAlifeState(state: GameState): AlifeState {
  const host = state as AlifeHost;
  if (host.alife?.version === ALIFE_VERSION && host.alife.npcs.length > 0) return host.alife;
  const seed = Math.floor(Math.random() * 0x7fffffff);
  host.alife = createAlifeState(state, seed, defaultAlifePopulation());
  return host.alife;
}

function inventoryCopy(input: readonly Item[] | undefined): Item[] | undefined {
  if (!input || input.length === 0) return input ? [] : undefined;
  return input.slice(0, 8).map(item => ({
    defId: item.defId,
    count: Math.max(1, Math.min(999, Math.floor(item.count))),
    data: item.data,
  }));
}

function rpgFromRecord(record: AlifeNpcRecord): RPGStats {
  const shell = {
    level: record.level,
    xp: 0,
    attrPoints: 0,
    str: record.str,
    agi: record.agi,
    int: record.int,
    psi: 0,
    maxPsi: 0,
  };
  const maxPsi = getMaxPsi(shell);
  return { ...shell, psi: maxPsi, maxPsi };
}

function recordRpg(record: AlifeNpcRecord, rpg: RPGStats): void {
  record.level = Math.max(1, Math.floor(rpg.level));
  record.str = Math.max(0, Math.floor(rpg.str));
  record.agi = Math.max(0, Math.floor(rpg.agi));
  record.int = Math.max(0, Math.floor(rpg.int));
  record.maxHp = getMaxHp(rpg);
  record.hp = Math.min(record.hp, record.maxHp);
}

function isAmbientNpcCandidate(entity: Entity): boolean {
  return entity.type === EntityType.NPC &&
    !entity.plotNpcId &&
    !entity.persistentNpcId &&
    entity.alifeId === undefined &&
    entity.questId === -1;
}

function captureEntityToRecord(record: AlifeNpcRecord, entity: Entity): void {
  record.x = entity.x;
  record.y = entity.y;
  record.angle = entity.angle;
  record.sprite = entity.sprite;
  record.spriteSeed = entity.spriteSeed;
  record.hp = Math.max(0, Math.min(entity.hp ?? record.hp, entity.maxHp ?? record.maxHp));
  const entityMoney = Math.max(0, Math.floor(entity.money ?? activeMoneyForRecord(record, 0)));
  if (record.activeMoney !== undefined && record.money > record.activeMoney) {
    record.money = Math.max(0, Math.min(5_000_000, record.money + entityMoney - record.activeMoney));
  } else {
    record.money = Math.max(0, Math.min(5_000_000, entityMoney));
  }
  record.activeMoney = entityMoney;
  record.weapon = entity.weapon;
  record.inventory = inventoryCopy(entity.inventory);
  if (entity.playerRelation !== undefined) record.playerRelation = clampRelation(entity.playerRelation);
  if (entity.karma !== undefined) record.karma = clampKarma(entity.karma);
  record.kills = Math.max(0, Math.floor(entity.kills ?? record.kills ?? 0));
  record.npcKills = Math.max(0, Math.floor(entity.npcKills ?? record.npcKills ?? 0));
  record.monsterKills = Math.max(0, Math.floor(entity.monsterKills ?? record.monsterKills ?? 0));
  if (entity.rpg) recordRpg(record, entity.rpg);
  record.touched = true;
}

export function captureAlifeFloorState(state: GameState, entities: readonly Entity[]): void {
  const alife = (state as AlifeHost).alife;
  if (!alife) return;
  let captured = false;
  for (const entity of entities) {
    if (entity.type !== EntityType.NPC || entity.alifeId === undefined) continue;
    const record = alife.npcs[entity.alifeId - 1];
    if (!record) continue;
    if (!entity.alive) {
      record.dead = true;
      record.touched = true;
      alife.leaderboardVersion++;
      continue;
    }
    captureEntityToRecord(record, entity);
    captured = true;
  }
  if (captured) alife.leaderboardVersion++;
}

export function recordAlifeNpcDeath(state: GameState, entity: Entity): void {
  const alife = ensureAlifeState(state);
  if (entity.alifeId !== undefined) {
    const record = alife.npcs[entity.alifeId - 1];
    if (record) {
      captureEntityToRecord(record, entity);
      record.dead = true;
      record.hp = 0;
      record.touched = true;
      alife.leaderboardVersion++;
    }
  }
  if (entity.plotNpcId) alife.deadPlotNpcIds.add(entity.plotNpcId);
}

export function isPlotNpcDead(state: GameState, plotNpcId: string): boolean {
  return ensureAlifeState(state).deadPlotNpcIds.has(plotNpcId);
}

function passable(world: World, x: number, y: number): boolean {
  const cell = world.cells[world.idx(Math.floor(x), Math.floor(y))];
  return cell === Cell.FLOOR || cell === Cell.WATER;
}

function fallbackPosition(world: World, seed: number, id: number): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 4096; attempt++) {
    const x = hash32(seed, id, 200 + attempt) % W;
    const y = hash32(seed, id, 600 + attempt) % W;
    const cell = world.cells[world.idx(x, y)];
    if (cell === Cell.FLOOR || cell === Cell.WATER) return { x: x + 0.5, y: y + 0.5 };
  }
  return null;
}

function materializeEntity(record: AlifeNpcRecord, template: Entity | undefined, world: World, alife: AlifeState, nextId: { v: number }): Entity | null {
  let x = record.x;
  let y = record.y;
  if (x === undefined || y === undefined || !passable(world, x, y)) {
    x = template?.x;
    y = template?.y;
  }
  if (x === undefined || y === undefined || !passable(world, x, y)) {
    const fallback = fallbackPosition(world, alife.seed, record.id);
    if (!fallback) return null;
    x = fallback.x;
    y = fallback.y;
  }
  record.x = x;
  record.y = y;
  record.angle = record.angle ?? template?.angle ?? unit(alife.seed, record.id, 77) * Math.PI * 2;
  const templateSprite = template?.sprite;
  const adoptTemplateProfile = record.sprite === undefined &&
    template !== undefined &&
    templateSprite !== undefined &&
    templateSprite !== (template.occupation ?? record.occupation);
  if (adoptTemplateProfile) {
    if (template.name) record.name = template.name;
    if (template.isFemale !== undefined) record.female = template.isFemale;
    if (template.occupation !== undefined) record.occupation = template.occupation;
    if (template.faction !== undefined) record.faction = template.faction;
  }
  record.sprite = record.sprite ?? templateSprite ?? record.occupation;
  record.spriteSeed = record.spriteSeed ?? hash32(alife.seed, record.id, 901);
  record.playerRelation = record.playerRelation ?? playerRelationForRecord(record, alife.seed);
  const rpg = rpgFromRecord(record);
  const activeMoney = activeMoneyForRecord(record, alife.seed);
  record.activeMoney = activeMoney;
  const ai = template?.ai
    ? { goal: template.ai.goal, tx: template.ai.tx, ty: template.ai.ty, path: [], pi: 0, stuck: 0, timer: 0 }
    : { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 };
  return {
    id: nextId.v++,
    type: EntityType.NPC,
    x,
    y,
    angle: record.angle,
    pitch: 0,
    alive: true,
    speed: template?.speed ?? (record.occupation === Occupation.CHILD ? 0.8 : 1.2),
    sprite: record.sprite,
    spriteSeed: record.spriteSeed,
    spriteScale: record.occupation === Occupation.CHILD ? 0.6 : 1,
    name: record.name,
    isFemale: record.female,
    needs: freshNeeds(),
    hp: Math.max(1, Math.min(record.hp, record.maxHp)),
    maxHp: record.maxHp,
    money: activeMoney,
    ai,
    inventory: inventoryCopy(record.inventory) ?? [],
    weapon: record.weapon,
    faction: record.faction,
    occupation: record.occupation,
    playerRelation: record.playerRelation,
    karma: record.karma,
    kills: record.kills ?? 0,
    npcKills: record.npcKills ?? 0,
    monsterKills: record.monsterKills ?? 0,
    isTraveler: template?.isTraveler ?? true,
    assignedRoomId: template?.assignedRoomId,
    questId: -1,
    canGiveQuest: record.canGiveQuest,
    familyId: record.familyId,
    rpg,
    alifeId: record.id,
    persistentNpcId: `alife:${record.id}`,
  };
}

function filterDeadPlotNpcs(alife: AlifeState, entities: Entity[]): void {
  let write = 0;
  for (let read = 0; read < entities.length; read++) {
    const entity = entities[read];
    if (entity.type === EntityType.NPC && entity.plotNpcId && alife.deadPlotNpcIds.has(entity.plotNpcId)) continue;
    entities[write++] = entity;
  }
  entities.length = write;
}

function extractAmbientNpcTemplates(entities: Entity[]): Entity[] {
  const templates: Entity[] = [];
  let write = 0;
  for (let read = 0; read < entities.length; read++) {
    const entity = entities[read];
    if (isAmbientNpcCandidate(entity)) {
      templates.push(entity);
      continue;
    }
    entities[write++] = entity;
  }
  entities.length = write;
  return templates;
}

export function materializeAlifeFloorPopulation(
  state: GameState,
  world: World,
  entities: Entity[],
  nextId: { v: number },
  floorKey = floorRunEntryRouteId(currentFloorRunEntry(state)),
): void {
  const alife = ensureAlifeState(state);
  filterDeadPlotNpcs(alife, entities);
  const floorIds = alife.floorIndex[floorKey] ?? [];
  if (floorIds.length === 0) return;
  const templates = extractAmbientNpcTemplates(entities);
  if (templates.length === 0) return;

  const activeSlots = Math.min(templates.length, floorIds.length);
  for (let slot = 0; slot < activeSlots; slot++) {
    const recordIndex = floorIds[slot];
    const record = alife.npcs[recordIndex];
    if (!record || record.dead) continue;
    const template = templates[slot];
    const entity = materializeEntity(record, template, world, alife, nextId);
    if (!entity) continue;
    entities.push(entity);
  }
}

function normalizeInventory(input: unknown): Item[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out: Item[] = [];
  for (const raw of input) {
    if (out.length >= 8 || !isRecord(raw) || typeof raw.defId !== 'string') continue;
    out.push({
      defId: raw.defId.slice(0, 64),
      count: clampInt(raw.count, 1, 1, 999),
      data: raw.data,
    });
  }
  return out;
}

function normalizeRpg(input: unknown): RPGStats | undefined {
  if (!isRecord(input)) return undefined;
  const level = clampInt(input.level, 1, 1, 100);
  const str = clampInt(input.str, 0, 0, 100);
  const agi = clampInt(input.agi, 0, 0, 100);
  const int = clampInt(input.int, 0, 0, 100);
  const shell = { level, xp: 0, attrPoints: 0, str, agi, int, psi: 0, maxPsi: 0 };
  const maxPsi = getMaxPsi(shell);
  return { ...shell, psi: maxPsi, maxPsi };
}

function applyOverride(alife: AlifeState, input: unknown): void {
  if (!isRecord(input)) return;
  const id = clampInt(input.id, 0, 1, alife.npcs.length);
  const record = alife.npcs[id - 1];
  if (!record) return;
  if (typeof input.x === 'number' && Number.isFinite(input.x)) record.x = input.x;
  if (typeof input.y === 'number' && Number.isFinite(input.y)) record.y = input.y;
  if (typeof input.angle === 'number' && Number.isFinite(input.angle)) record.angle = input.angle;
  if (typeof input.sprite === 'number' && Number.isFinite(input.sprite)) record.sprite = clampInt(input.sprite, record.sprite ?? record.occupation, 0, 4096);
  if (typeof input.spriteSeed === 'number' && Number.isFinite(input.spriteSeed)) record.spriteSeed = clampInt(input.spriteSeed, record.spriteSeed ?? 1, 1, 0x7fffffff);
  record.hp = clampInt(input.hp, record.hp, 0, record.maxHp);
  record.money = clampInt(input.money, record.money, 0, 5_000_000);
  record.weapon = typeof input.weapon === 'string' ? input.weapon.slice(0, 64) : record.weapon;
  record.inventory = normalizeInventory(input.inventory) ?? record.inventory;
  record.kills = clampInt(input.kills, record.kills ?? 0, 0, 1_000_000);
  record.npcKills = clampInt(input.npcKills, record.npcKills ?? 0, 0, 1_000_000);
  record.monsterKills = clampInt(input.monsterKills, record.monsterKills ?? 0, 0, 1_000_000);
  if (typeof input.playerRelation === 'number' && Number.isFinite(input.playerRelation)) {
    record.playerRelation = clampRelation(input.playerRelation);
  }
  if (typeof input.karma === 'number' && Number.isFinite(input.karma)) record.karma = clampKarma(input.karma);
  const rpg = normalizeRpg(input.rpg);
  if (rpg) recordRpg(record, rpg);
  record.touched = true;
}

export function setAlifeState(state: GameState, input: unknown): AlifeState {
  const save = isRecord(input) ? input : {};
  const seed = clampInt(save.seed, Math.floor(Math.random() * 0x7fffffff), 1, 0x7fffffff);
  const total = clampInt(save.total, defaultAlifePopulation(), 1_000, ALIFE_TARGET_POPULATION);
  const alife = createAlifeState(state, seed, total);
  if (Array.isArray(save.deadIds)) {
    for (const rawId of save.deadIds) {
      const id = clampInt(rawId, 0, 1, alife.npcs.length);
      const record = alife.npcs[id - 1];
      if (record) {
        record.dead = true;
        record.hp = 0;
        record.touched = true;
      }
    }
  }
  if (Array.isArray(save.deadPlotNpcIds)) {
    for (const rawId of save.deadPlotNpcIds) {
      if (typeof rawId === 'string' && rawId.length > 0) alife.deadPlotNpcIds.add(rawId.slice(0, 96));
    }
  }
  if (Array.isArray(save.overrides)) {
    for (const item of save.overrides) applyOverride(alife, item);
  }
  (state as AlifeHost).alife = alife;
  return alife;
}

export function alifeForSave(state: GameState): AlifeSaveState {
  const alife = ensureAlifeState(state);
  const deadIds: number[] = [];
  const overrides: AlifeNpcOverride[] = [];
  for (const record of alife.npcs) {
    if (record.dead) {
      deadIds.push(record.id);
      continue;
    }
    if (!record.touched || overrides.length >= ALIFE_SAVE_OVERRIDE_CAP) continue;
    const rpg = rpgFromRecord(record);
    overrides.push({
      id: record.id,
      x: record.x,
      y: record.y,
      angle: record.angle,
      hp: record.hp,
      money: record.money,
      weapon: record.weapon,
      inventory: inventoryCopy(record.inventory),
      rpg,
      sprite: record.sprite,
      spriteSeed: record.spriteSeed,
      kills: record.kills,
      npcKills: record.npcKills,
      monsterKills: record.monsterKills,
      playerRelation: record.playerRelation,
      karma: record.karma,
    });
  }
  return {
    version: ALIFE_VERSION,
    seed: alife.seed,
    total: alife.total,
    deadIds,
    deadPlotNpcIds: [...alife.deadPlotNpcIds],
    overrides,
  };
}

export function currentAlifeFloorKey(state: GameState): string {
  return floorRunEntryRouteId(currentFloorRunEntry(state));
}

function recordRankStats(record: AlifeNpcRecord): RankStats {
  return {
    level: record.level,
    money: record.money,
    kills: record.kills,
    npcKills: record.npcKills,
    monsterKills: record.monsterKills,
    karma: record.karma,
  };
}

function playerRankSignature(player: Entity, version: number): string {
  return [
    version,
    player.rpg?.level ?? 1,
    player.money ?? 0,
    player.kills ?? 0,
    player.npcKills ?? 0,
    player.monsterKills ?? 0,
    player.karma ?? 0,
  ].join(':');
}

function insertTop(entries: AlifeLeaderboardEntry[], entry: AlifeLeaderboardEntry, limit: number): void {
  let idx = entries.findIndex(candidate => entry.score > candidate.score);
  if (idx < 0) idx = entries.length;
  if (idx >= limit) return;
  entries.splice(idx, 0, entry);
  if (entries.length > limit) entries.length = limit;
}

export function getAlifeLeaderboardSnapshot(state: GameState, player: Entity, limit = 100): AlifeLeaderboardSnapshot {
  const alife = ensureAlifeState(state);
  const boundedLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const signature = playerRankSignature(player, alife.leaderboardVersion);
  if (alife.leaderboardCache?.signature === signature && alife.leaderboardCache.limit === boundedLimit) {
    return alife.leaderboardCache;
  }

  const playerScore = entityRankScore(player);
  const playerEntry: AlifeLeaderboardEntry = {
    rank: 1,
    id: 'player',
    name: player.name ?? 'Вы',
    faction: Faction.PLAYER,
    level: Math.max(1, Math.floor(player.rpg?.level ?? 1)),
    score: playerScore,
    kills: Math.max(0, Math.floor(player.kills ?? 0)),
    npcKills: Math.max(0, Math.floor(player.npcKills ?? 0)),
    monsterKills: Math.max(0, Math.floor(player.monsterKills ?? 0)),
    karma: clampKarma(player.karma ?? 0),
    player: true,
  };
  const entries: AlifeLeaderboardEntry[] = [];
  let betterThanPlayer = 0;
  let totalAlive = 1;

  insertTop(entries, playerEntry, boundedLimit);
  for (const record of alife.npcs) {
    if (record.dead) continue;
    totalAlive++;
    const score = rankScore(recordRankStats(record));
    if (score > playerScore) betterThanPlayer++;
    insertTop(entries, {
      rank: 0,
      id: `alife:${record.id}`,
      name: record.name,
      faction: record.faction,
      floorKey: record.floorKey,
      level: record.level,
      score,
      kills: record.kills ?? 0,
      npcKills: record.npcKills ?? 0,
      monsterKills: record.monsterKills ?? 0,
      karma: record.karma,
      player: false,
    }, boundedLimit);
  }

  for (let i = 0; i < entries.length; i++) entries[i].rank = i + 1;
  playerEntry.rank = betterThanPlayer + 1;
  const snapshot: AlifeLeaderboardSnapshot & { signature: string; limit: number } = {
    signature,
    limit: boundedLimit,
    entries,
    player: playerEntry,
    totalAlive,
  };
  alife.leaderboardCache = snapshot;
  return snapshot;
}

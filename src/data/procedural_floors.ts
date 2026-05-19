/* ── Procedural floor combinatorics definitions ──────────────── */

import {
  Faction,
  FloorLevel,
  MonsterKind,
  RoomType,
  Tex,
  ZoneFaction,
} from '../core/types';
import { hashSeed, seededRandom } from '../core/rand';
import { designFloorAtZ } from './design_floors';

export type FloorGeometryId =
  | 'living_blocks'
  | 'apartment_pressure'
  | 'collectors'
  | 'workshops'
  | 'admin_pockets';

export type FloorMajorityId =
  | 'citizens'
  | 'liquidators'
  | 'cultists'
  | 'wild'
  | 'scientists';

export type FloorAnomalyId =
  | 'none'
  | 'teleport_cells'
  | 'smog'
  | 'samosbor_seed'
  | 'mushroom_mycelium'
  | 'hladon'
  | 'false_safe_block'
  | 'fractal_floor'
  | 'mirror_run'
  | 'radio_chess'
  | 'cement_memory'
  | 'conveyor_sorter'
  | 'wall_snake'
  | 'section_shift'
  | 'conway_life'
  | 'rail_trains'
  | 'bad_apple_world';

export const FALSE_SAFE_BLOCK_TAG = 'false_safe_block';
export const FALSE_SAFE_BLOCK_ROOM_PREFIX = 'Тихий блок';
export const FALSE_SAFE_BLOCK_DISCOVERED = 'ладонь найдена';
export const FALSE_SAFE_BLOCK_RESOLVED = 'маркер сорван';

export interface FloorGeometryDef {
  id: FloorGeometryId;
  title: string;
  baseFloor: FloorLevel;
  weight: number;
  roomCount: number;
  dangerBias: number;
  minZ?: number;
  maxZ?: number;
  wallTex: Tex;
  floorTex: Tex;
  roomTypes: readonly RoomType[];
  tags: readonly string[];
}

export interface FloorMajorityDef {
  id: FloorMajorityId;
  title: string;
  weight: number;
  npcFaction: Faction;
  zoneFaction: ZoneFaction;
  minDanger?: number;
  tags: readonly string[];
}

export interface FloorAnomalyDef {
  id: FloorAnomalyId;
  title: string;
  weight: number;
  minDanger: number;
  dangerBias: number;
  tags: readonly string[];
}

export interface ProceduralFloorSpec {
  key: string;
  z: number;
  ordinal: number;
  seed: number;
  depth: number;
  danger: 1 | 2 | 3 | 4 | 5;
  geometryId: FloorGeometryId;
  baseFloor: FloorLevel;
  majorityId: FloorMajorityId;
  anomalyId: FloorAnomalyId;
  title: string;
  lootBiasIds: string[];
  monsterBiasKinds: MonsterKind[];
}

export const FLOOR_RUN_MIN_Z = -44;
export const FLOOR_RUN_MAX_Z = 40;
export const FLOOR_RUN_VOID_Z = 36;

const STORY_Z_BY_FLOOR: Readonly<Record<FloorLevel, number>> = {
  [FloorLevel.MINISTRY]: -24,
  [FloorLevel.KVARTIRY]: -12,
  [FloorLevel.LIVING]: 0,
  [FloorLevel.MAINTENANCE]: 20,
  [FloorLevel.HELL]: 28,
  [FloorLevel.VOID]: FLOOR_RUN_VOID_Z,
};

function makeProceduralFloorZs(): readonly number[] {
  const zs: number[] = [];
  for (let z = FLOOR_RUN_MIN_Z; z <= FLOOR_RUN_MAX_Z; z++) {
    if (storyFloorAtZ(z) === undefined && designFloorAtZ(z) === undefined) zs.push(z);
  }
  return zs;
}

export const PROCEDURAL_FLOOR_ZS = makeProceduralFloorZs();
export const PROCEDURAL_FLOOR_COUNT = PROCEDURAL_FLOOR_ZS.length;

export const FLOOR_GEOMETRIES: readonly FloorGeometryDef[] = [
  {
    id: 'living_blocks',
    title: 'жилая нарезка',
    baseFloor: FloorLevel.LIVING,
    weight: 42,
    roomCount: 86,
    dangerBias: 0,
    maxZ: 4,
    wallTex: Tex.PANEL,
    floorTex: Tex.F_LINO,
    roomTypes: [RoomType.LIVING, RoomType.KITCHEN, RoomType.BATHROOM, RoomType.STORAGE, RoomType.COMMON],
    tags: ['residential', 'civil'],
  },
  {
    id: 'apartment_pressure',
    title: 'плотные квартиры',
    baseFloor: FloorLevel.KVARTIRY,
    weight: 30,
    roomCount: 104,
    dangerBias: 1,
    maxZ: 3,
    wallTex: Tex.BRICK,
    floorTex: Tex.F_LINO,
    roomTypes: [RoomType.LIVING, RoomType.KITCHEN, RoomType.BATHROOM, RoomType.COMMON, RoomType.STORAGE, RoomType.SMOKING],
    tags: ['residential', 'crowd', 'riot'],
  },
  {
    id: 'collectors',
    title: 'коллекторы',
    baseFloor: FloorLevel.MAINTENANCE,
    weight: 32,
    roomCount: 72,
    dangerBias: 1,
    minZ: 1,
    wallTex: Tex.PIPE,
    floorTex: Tex.F_CONCRETE,
    roomTypes: [RoomType.CORRIDOR, RoomType.PRODUCTION, RoomType.STORAGE, RoomType.COMMON],
    tags: ['industrial', 'water', 'pipes'],
  },
  {
    id: 'workshops',
    title: 'цеховой этаж',
    baseFloor: FloorLevel.MAINTENANCE,
    weight: 26,
    roomCount: 64,
    dangerBias: 1,
    minZ: 1,
    wallTex: Tex.METAL,
    floorTex: Tex.F_CONCRETE,
    roomTypes: [RoomType.PRODUCTION, RoomType.PRODUCTION, RoomType.STORAGE, RoomType.OFFICE, RoomType.CORRIDOR],
    tags: ['industrial', 'workshop', 'machines'],
  },
  {
    id: 'admin_pockets',
    title: 'административные карманы',
    baseFloor: FloorLevel.MINISTRY,
    weight: 16,
    roomCount: 70,
    dangerBias: 0,
    maxZ: -1,
    wallTex: Tex.MARBLE,
    floorTex: Tex.F_PARQUET,
    roomTypes: [RoomType.OFFICE, RoomType.COMMON, RoomType.STORAGE, RoomType.SMOKING, RoomType.CORRIDOR],
    tags: ['admin', 'documents'],
  },
];

export const FLOOR_MAJORITY_FACTIONS: readonly FloorMajorityDef[] = [
  {
    id: 'citizens',
    title: 'гражданский этаж',
    weight: 58,
    npcFaction: Faction.CITIZEN,
    zoneFaction: ZoneFaction.CITIZEN,
    tags: ['civil'],
  },
  {
    id: 'liquidators',
    title: 'этаж ликвидаторов',
    weight: 22,
    npcFaction: Faction.LIQUIDATOR,
    zoneFaction: ZoneFaction.LIQUIDATOR,
    minDanger: 2,
    tags: ['armed', 'patrol'],
  },
  {
    id: 'wild',
    title: 'дикий этаж',
    weight: 14,
    npcFaction: Faction.WILD,
    zoneFaction: ZoneFaction.WILD,
    minDanger: 2,
    tags: ['raiders'],
  },
  {
    id: 'scientists',
    title: 'научная смена',
    weight: 10,
    npcFaction: Faction.SCIENTIST,
    zoneFaction: ZoneFaction.CITIZEN,
    tags: ['lab', 'documents'],
  },
  {
    id: 'cultists',
    title: 'культовый этаж',
    weight: 7,
    npcFaction: Faction.CULTIST,
    zoneFaction: ZoneFaction.CULTIST,
    minDanger: 3,
    tags: ['cult', 'psi'],
  },
];

export const FLOOR_ANOMALIES: readonly FloorAnomalyDef[] = [
  { id: 'none', title: 'без аномалии', weight: 54, minDanger: 1, dangerBias: 0, tags: [] },
  { id: 'smog', title: 'говнячный смог', weight: 18, minDanger: 1, dangerBias: 1, tags: ['fog', 'visibility', 'smog', 'govnyak', 'contraband'] },
  { id: 'teleport_cells', title: 'перескоки клеток', weight: 10, minDanger: 2, dangerBias: 1, tags: ['topology'] },
  { id: 'mushroom_mycelium', title: 'грибница', weight: 14, minDanger: 2, dangerBias: 0, tags: ['mushroom', 'food'] },
  { id: 'hladon', title: 'хладон', weight: 11, minDanger: 2, dangerBias: 1, tags: ['cold', 'heat_counter', 'route_pressure'] },
  { id: 'false_safe_block', title: 'тихий блок', weight: 5, minDanger: 2, dangerBias: 1, tags: ['cult', 'shelter', FALSE_SAFE_BLOCK_TAG] },
  { id: 'mirror_run', title: 'зеркальная проводка', weight: 8, minDanger: 2, dangerBias: 1, tags: ['mirror', 'duality', 'teleport', 'loot'] },
  { id: 'radio_chess', title: 'радио-шахматы', weight: 8, minDanger: 2, dangerBias: 1, tags: ['pattern', 'radio', 'timing', 'movement'] },
  { id: 'conveyor_sorter', title: 'сортировочный конвейер', weight: 7, minDanger: 2, dangerBias: 1, tags: ['conveyor', 'items', 'industrial', 'movement'] },
  { id: 'fractal_floor', title: 'фрактал', weight: 6, minDanger: 3, dangerBias: 1, tags: ['fractal', 'maze', 'topology', 'documents'] },
  { id: 'cement_memory', title: 'цементная память', weight: 6, minDanger: 3, dangerBias: 1, tags: ['trail', 'pressure', 'no_backtracking', 'samosbor'] },
  { id: 'wall_snake', title: 'змейка', weight: 4, minDanger: 2, dangerBias: 2, tags: ['moving_walls', 'predator', 'crush', 'loot_sink'] },
  { id: 'rail_trains', title: 'поезда', weight: 8, minDanger: 2, dangerBias: 1, tags: ['rail', 'transit', 'crush', 'industrial'] },
  { id: 'bad_apple_world', title: 'bad apple!', weight: 3, minDanger: 3, dangerBias: 1, tags: ['video', 'screen', 'topology', 'cult_media'] },
  { id: 'section_shift', title: 'секционный сдвиг', weight: 4, minDanger: 3, dangerBias: 2, tags: ['topology', 'moving_rooms', 'crush', 'toroid'] },
  { id: 'conway_life', title: 'игра жизнь', weight: 3, minDanger: 3, dangerBias: 2, tags: ['cellular', 'topology', 'moving_walls', 'math'] },
  { id: 'samosbor_seed', title: 'поражение самосбором', weight: 9, minDanger: 3, dangerBias: 2, tags: ['samosbor', 'meat'] },
];

const LOOT_BY_TAG: Record<string, readonly string[]> = {
  residential: ['bread', 'water', 'tea', 'book', 'cigs', 'cloth_roll', 'neighbor_complaint'],
  crowd: ['ballot', 'ration_registry_extract', 'forged_ration_card', 'bandage'],
  industrial: ['pipe', 'wrench', 'gear', 'spring', 'metal_sheet', 'ammo_nails', 'pressure_logbook'],
  workshop: ['nailgun', 'ammo_nails', 'circuit_board', 'barrel_part', 'rubber_strip'],
  water: ['metal_water', 'filter_layer', 'sealant_tube', 'harpoon_gun'],
  admin: ['blank_form', 'temp_pass', 'official_permit_slip', 'seal_wax', 'ink_bottle'],
  documents: ['note', 'lift_scheme', 'elevator_access_order', 'missing_record_file'],
  mushroom: ['mushroom_mass', 'infected_mushroom', 'spore_print', 'substrate_sack', 'antifungal_ointment'],
  cold: ['boiler_water', 'asbestos_cord', 'sealant_tube', 'cloth_roll', 'valve_tag'],
  samosbor: ['siren_shard', 'samosbor_tally', 'hermodoor_journal', 'meat_rune'],
  cult: ['meat_rune', 'holy_water', 'psi_dust', 'idol_chernobog'],
  shelter: ['water', 'bread', 'bandage', 'siren_instruction', 'emergency_roster'],
  [FALSE_SAFE_BLOCK_TAG]: ['siren_instruction', 'emergency_roster', 'container_key_label', 'meat_rune'],
  smog: ['gasmask_filter', 'cloth_roll', 'filter_layer', 'valve_tag', 'filter_receipt', 'forged_quarantine_clearance'],
  govnyak: ['cigs', 'grey_briquette', 'green_briquette', 'concentrate_coupon'],
  contraband: ['forged_quarantine_clearance', 'filter_receipt', 'fake_pass'],
  mirror: ['inspection_mirror', 'glass_shard', 'container_key_label', 'fake_pass', 'note'],
  duality: ['holy_water', 'psi_dust', 'blank_form'],
  teleport: ['lift_scheme', 'elevator_access_order', 'missing_record_file'],
  pattern: ['relay_diagram', 'circuit_board', 'lamp_bulb', 'note'],
  radio: ['relay_diagram', 'circuit_board', 'lamp_bulb'],
  timing: ['relay_diagram', 'siren_energy', 'flashlight'],
  movement: ['spring', 'rubber_strip', 'gear'],
  conveyor: ['gear', 'spring', 'metal_sheet', 'rubber_strip', 'ammo_nails'],
  fractal: ['lift_scheme', 'elevator_override_form', 'missing_record_file', 'note'],
  maze: ['lift_scheme', 'istotit_candle', 'ink_bottle'],
  trail: ['ink_bottle', 'alcohol_bottle', 'lift_scheme', 'cloth_roll'],
  pressure: ['pressure_logbook', 'valve_tag', 'sealant_tube'],
  moving_walls: ['wrench', 'gear', 'spring', 'metal_sheet'],
  predator: ['meat_rune', 'ammo_nails', 'harpoon_gun'],
  crush: ['bandage', 'tourniquet', 'wrench'],
  rail: ['metro_ticket', 'wrench', 'fuse', 'relay_diagram', 'valve_tag'],
  transit: ['metro_ticket', 'caravan_route', 'lift_scheme', 'pressure_logbook'],
  cellular: ['circuit_board', 'ink_bottle', 'note'],
  math: ['book', 'lift_scheme', 'blank_form'],
  video: ['circuit_board', 'relay_diagram', 'overexposed_photo', 'lamp_bulb'],
  screen: ['circuit_board', 'relay_diagram', 'filter_receipt', 'note'],
  cult_media: ['psi_dust', 'holy_water', 'meat_rune', 'blank_form'],
};

const MONSTERS_BY_TAG: Record<string, readonly MonsterKind[]> = {
  residential: [MonsterKind.SBORKA, MonsterKind.TVAR, MonsterKind.ZOMBIE, MonsterKind.NELYUD],
  crowd: [MonsterKind.ZOMBIE, MonsterKind.NELYUD, MonsterKind.SHADOW],
  industrial: [MonsterKind.REBAR, MonsterKind.POLZUN, MonsterKind.ROBOT, MonsterKind.LAMPOVY],
  workshop: [MonsterKind.REBAR, MonsterKind.ROBOT, MonsterKind.SBORKA],
  water: [MonsterKind.TUBE_EEL, MonsterKind.POLZUN, MonsterKind.TVAR],
  admin: [MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK],
  fog: [MonsterKind.EYE, MonsterKind.SHADOW, MonsterKind.NIGHTMARE],
  smog: [MonsterKind.NELYUD, MonsterKind.POLZUN, MonsterKind.TVAR, MonsterKind.SHADOW],
  govnyak: [MonsterKind.ZOMBIE, MonsterKind.NELYUD, MonsterKind.TVAR],
  mushroom: [MonsterKind.ZOMBIE, MonsterKind.SBORKA, MonsterKind.POLZUN],
  cold: [MonsterKind.SHADOW, MonsterKind.NELYUD, MonsterKind.TUBE_EEL],
  samosbor: [MonsterKind.SHADOW, MonsterKind.NIGHTMARE, MonsterKind.REBAR, MonsterKind.EYE],
  cult: [MonsterKind.SHADOW, MonsterKind.IDOL, MonsterKind.SPIRIT],
  shelter: [MonsterKind.ZOMBIE, MonsterKind.SHADOW],
  [FALSE_SAFE_BLOCK_TAG]: [MonsterKind.IDOL, MonsterKind.SHADOW, MonsterKind.SPIRIT],
  mirror: [MonsterKind.SHADOW, MonsterKind.SPIRIT, MonsterKind.EYE],
  duality: [MonsterKind.SHADOW, MonsterKind.NELYUD],
  teleport: [MonsterKind.SPIRIT, MonsterKind.PARAGRAPH],
  pattern: [MonsterKind.ROBOT, MonsterKind.EYE, MonsterKind.LAMPOVY],
  radio: [MonsterKind.LAMPOVY, MonsterKind.ROBOT],
  conveyor: [MonsterKind.REBAR, MonsterKind.ROBOT, MonsterKind.POLZUN],
  movement: [MonsterKind.POLZUN, MonsterKind.REBAR],
  fractal: [MonsterKind.PARAGRAPH, MonsterKind.SHOVNIK, MonsterKind.EYE],
  maze: [MonsterKind.POLZUN, MonsterKind.SHADOW],
  trail: [MonsterKind.NELYUD, MonsterKind.SHADOW, MonsterKind.ZOMBIE],
  pressure: [MonsterKind.REBAR, MonsterKind.POLZUN],
  moving_walls: [MonsterKind.REBAR, MonsterKind.SBORKA],
  predator: [MonsterKind.TVAR, MonsterKind.KOSTOREZ, MonsterKind.POLZUN],
  crush: [MonsterKind.REBAR, MonsterKind.KOSTOREZ],
  rail: [MonsterKind.REBAR, MonsterKind.ROBOT, MonsterKind.TUBE_EEL],
  transit: [MonsterKind.NELYUD, MonsterKind.POLZUN],
  cellular: [MonsterKind.SBORKA, MonsterKind.PARAGRAPH, MonsterKind.EYE],
  math: [MonsterKind.PARAGRAPH, MonsterKind.PECHATEED],
  video: [MonsterKind.EYE, MonsterKind.LAMPOVY, MonsterKind.PARAGRAPH],
  screen: [MonsterKind.EYE, MonsterKind.ROBOT, MonsterKind.LAMPOVY],
  cult_media: [MonsterKind.SHADOW, MonsterKind.SPIRIT, MonsterKind.IDOL],
};

function clampDanger(v: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(v))) as 1 | 2 | 3 | 4 | 5;
}

function zAllowed(def: { minZ?: number; maxZ?: number }, z: number): boolean {
  if (def.minZ !== undefined && z < def.minZ) return false;
  if (def.maxZ !== undefined && z > def.maxZ) return false;
  return true;
}

function pickWeighted<T>(
  defs: readonly T[],
  rng: () => number,
  weightOf: (def: T) => number,
): T {
  let total = 0;
  for (const def of defs) total += Math.max(0, weightOf(def));
  let roll = rng() * total;
  for (const def of defs) {
    roll -= Math.max(0, weightOf(def));
    if (roll <= 0) return def;
  }
  return defs[defs.length - 1];
}

function uniquePicks<T>(pool: readonly T[], rng: () => number, count: number): T[] {
  const out: T[] = [];
  if (pool.length === 0) return out;
  for (let i = 0; i < count * 3 && out.length < count; i++) {
    const picked = pool[Math.floor(rng() * pool.length)];
    if (!out.includes(picked)) out.push(picked);
  }
  return out;
}

function collectTagged<T>(tags: readonly string[], table: Record<string, readonly T[]>): T[] {
  const out: T[] = [];
  for (const tag of tags) {
    const vals = table[tag];
    if (vals) out.push(...vals);
  }
  return out;
}

export function storyFloorAtZ(z: number): FloorLevel | undefined {
  for (const floor of Object.values(FloorLevel).filter(v => typeof v === 'number') as FloorLevel[]) {
    if (STORY_Z_BY_FLOOR[floor] === z) return floor;
  }
  return undefined;
}

export function zForStoryFloor(floor: FloorLevel): number {
  return STORY_Z_BY_FLOOR[floor] ?? 0;
}

export function isProceduralFloorZ(z: number): boolean {
  return z >= FLOOR_RUN_MIN_Z && z <= FLOOR_RUN_MAX_Z && storyFloorAtZ(z) === undefined && designFloorAtZ(z) === undefined;
}

export function floorRunZAllowsNpcs(z: number): boolean {
  return z < FLOOR_RUN_VOID_Z;
}

export function proceduralFloorKey(z: number): string {
  return `z${z}`;
}

export function proceduralOrdinal(z: number): number {
  const idx = PROCEDURAL_FLOOR_ZS.indexOf(z);
  return idx >= 0 ? idx + 1 : PROCEDURAL_FLOOR_COUNT + Math.abs(z);
}

export function makeProceduralFloorSpec(runSeed: number, z: number): ProceduralFloorSpec {
  const seed = hashSeed(`floor:${runSeed}:${z}`, runSeed);
  const rng = seededRandom(seed);
  const depth = Math.abs(z);
  const geometry = pickWeighted(
    FLOOR_GEOMETRIES.filter(def => zAllowed(def, z)),
    rng,
    def => {
      let w = def.weight;
      if (z < 0 && def.baseFloor === FloorLevel.MINISTRY) w *= 1.8;
      if (z > 0 && def.baseFloor === FloorLevel.MAINTENANCE) w *= 1.6;
      return w;
    },
  );
  const earlyDanger = clampDanger(1 + Math.floor(depth / 2) + (z > 0 ? 1 : 0) + geometry.dangerBias + Math.floor(rng() * 3) - 1);
  const majority = pickWeighted(
    FLOOR_MAJORITY_FACTIONS.filter(def => (def.minDanger ?? 1) <= earlyDanger),
    rng,
    def => def.weight * (earlyDanger >= 4 && def.id === 'cultists' ? 2.2 : 1),
  );
  const anomaly = pickWeighted(
    FLOOR_ANOMALIES.filter(def => def.minDanger <= earlyDanger),
    rng,
    def => def.weight * (earlyDanger >= 4 && def.id !== 'none' ? 1.35 : 1),
  );
  const danger = clampDanger(earlyDanger + anomaly.dangerBias);
  const tags = [...geometry.tags, ...majority.tags, ...anomaly.tags];
  const lootPool = collectTagged(tags, LOOT_BY_TAG);
  const monsterPool = collectTagged(tags, MONSTERS_BY_TAG);
  const lootBiasIds = uniquePicks(lootPool, rng, 5);
  const monsterBiasKinds = uniquePicks(monsterPool, rng, 4);
  const anomalyPrefix = anomaly.id === 'none' ? '' : `${anomaly.title}: `;

  return {
    key: proceduralFloorKey(z),
    z,
    ordinal: proceduralOrdinal(z),
    seed,
    depth,
    danger,
    geometryId: geometry.id,
    baseFloor: geometry.baseFloor,
    majorityId: majority.id,
    anomalyId: anomaly.id,
    title: `${anomalyPrefix}${geometry.title}, ${majority.title}`,
    lootBiasIds,
    monsterBiasKinds,
  };
}

export function geometryById(id: FloorGeometryId): FloorGeometryDef {
  return FLOOR_GEOMETRIES.find(def => def.id === id) ?? FLOOR_GEOMETRIES[0];
}

export function majorityById(id: FloorMajorityId): FloorMajorityDef {
  return FLOOR_MAJORITY_FACTIONS.find(def => def.id === id) ?? FLOOR_MAJORITY_FACTIONS[0];
}

export function anomalyById(id: FloorAnomalyId): FloorAnomalyDef {
  return FLOOR_ANOMALIES.find(def => def.id === id) ?? FLOOR_ANOMALIES[0];
}

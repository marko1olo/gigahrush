/* -- Design floor: voronoi_quarantine - Laguerre quarantine cells -- */

import { stampSurfaceSplat } from '../../systems/surface_marks';
import {
  AIGoal,
  Cell,
  ContainerKind,
  DoorState,
  EntityType,
  Faction,
  Feature,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  Occupation,
  QuestType,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type Item,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { hashSeed, withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { placeEmergencyPanel } from '../../systems/emergency_panels';
import { randomRPG } from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const VORONOI_QUARANTINE_ROUTE_ID = 'voronoi_quarantine' as const;
export const VORONOI_QUARANTINE_Z = 6 as const;
export const VORONOI_QUARANTINE_BASE_FLOOR = FloorLevel.KVARTIRY;

export const VORONOI_QUARANTINE_ROOM_NAMES = {
  northCheckpoint: 'Северный пост карантинной диаграммы',
  cleanClinic: 'Чистая клиника ячейки Ллойда',
  forgeOffice: 'Канцелярия липких пропусков',
  publicKitchen: 'Кухня общих котлов карантина',
  triageHub: 'Сортировочный центр рёбер',
  infectedWard: 'Жёлтая палата заражённого ребра',
  redWard: 'Красная палата мокрого допуска',
  supplyConnector: 'Складовой соединитель сухих пайков',
  corpsePitWest: 'Западная трупная яма за санитарной стеной',
  corpsePitEast: 'Восточная трупная яма без журнала',
  southCheckpoint: 'Южный пост выхода из карантина',
} as const;

type SiteRole =
  | 'checkpoint'
  | 'clinic'
  | 'office'
  | 'kitchen'
  | 'triage'
  | 'ward'
  | 'supply'
  | 'corpse_pit';

type NpcId =
  | 'voronoi_quarantine_doctor_pavel'
  | 'voronoi_quarantine_clerk_zoya'
  | 'voronoi_quarantine_infected_lev'
  | 'voronoi_quarantine_quartermaster_marta';

interface SiteSeed {
  key: keyof typeof VORONOI_QUARANTINE_ROOM_NAMES;
  role: SiteRole;
  x: number;
  y: number;
  weight: number;
  roomType: RoomType;
  wallTex: Tex;
  floorTex: Tex;
  faction: ZoneFaction;
  danger: 1 | 2 | 3 | 4 | 5;
  infected?: boolean;
}

interface Site extends SiteSeed {
  id: number;
  name: string;
  originX: number;
  originY: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
}

interface RidgeCandidate {
  a: number;
  b: number;
  x: number;
  y: number;
  nx: number;
  ny: number;
  score: number;
}

export interface VoronoiQuarantineLayout {
  routeId: typeof VORONOI_QUARANTINE_ROUTE_ID;
  lloydPasses: number;
  siteCount: number;
  siteCellCounts: readonly number[];
  adjacencyEdges: readonly [number, number][];
  ridgeDoorCount: number;
  lockedPassDoorCount: number;
  supplyConnectorDoorCount: number;
  connected: boolean;
}

const SEED = hashSeed(VORONOI_QUARANTINE_ROUTE_ID);
const CX = W >> 1;
const CY = W >> 1;
const CORE_MIN = 132;
const CORE_MAX = W - CORE_MIN;
const LLOYD_PASSES = 2;
const LLOYD_STEP = 8;
const OWNER_NONE = -1;

const SITE_SEEDS: readonly SiteSeed[] = [
  { key: 'northCheckpoint', role: 'checkpoint', x: CX, y: 250, weight: 118, roomType: RoomType.HQ, wallTex: Tex.METAL, floorTex: Tex.F_CONCRETE, faction: ZoneFaction.LIQUIDATOR, danger: 3 },
  { key: 'cleanClinic', role: 'clinic', x: 402, y: 370, weight: 132, roomType: RoomType.MEDICAL, wallTex: Tex.TILE_W, floorTex: Tex.F_TILE, faction: ZoneFaction.CITIZEN, danger: 2 },
  { key: 'forgeOffice', role: 'office', x: 620, y: 362, weight: 104, roomType: RoomType.OFFICE, wallTex: Tex.MARBLE, floorTex: Tex.F_PARQUET, faction: ZoneFaction.CITIZEN, danger: 2 },
  { key: 'publicKitchen', role: 'kitchen', x: 310, y: 522, weight: 126, roomType: RoomType.KITCHEN, wallTex: Tex.BRICK, floorTex: Tex.F_LINO, faction: ZoneFaction.CITIZEN, danger: 2 },
  { key: 'triageHub', role: 'triage', x: CX, y: CY, weight: 148, roomType: RoomType.COMMON, wallTex: Tex.PANEL, floorTex: Tex.F_LINO, faction: ZoneFaction.LIQUIDATOR, danger: 3 },
  { key: 'infectedWard', role: 'ward', x: 706, y: 508, weight: 130, roomType: RoomType.MEDICAL, wallTex: Tex.TILE_W, floorTex: Tex.F_TILE, faction: ZoneFaction.SAMOSBOR, danger: 4, infected: true },
  { key: 'redWard', role: 'ward', x: 440, y: 655, weight: 128, roomType: RoomType.MEDICAL, wallTex: Tex.HERMO_WALL, floorTex: Tex.F_TILE, faction: ZoneFaction.WILD, danger: 4, infected: true },
  { key: 'supplyConnector', role: 'supply', x: 690, y: 660, weight: 112, roomType: RoomType.STORAGE, wallTex: Tex.METAL, floorTex: Tex.F_CONCRETE, faction: ZoneFaction.LIQUIDATOR, danger: 3 },
  { key: 'corpsePitWest', role: 'corpse_pit', x: 270, y: 745, weight: 120, roomType: RoomType.STORAGE, wallTex: Tex.HERMO_WALL, floorTex: Tex.F_WATER, faction: ZoneFaction.SAMOSBOR, danger: 5, infected: true },
  { key: 'corpsePitEast', role: 'corpse_pit', x: 595, y: 785, weight: 116, roomType: RoomType.STORAGE, wallTex: Tex.HERMO_WALL, floorTex: Tex.F_WATER, faction: ZoneFaction.SAMOSBOR, danger: 5, infected: true },
  { key: 'southCheckpoint', role: 'checkpoint', x: CX, y: 882, weight: 118, roomType: RoomType.HQ, wallTex: Tex.METAL, floorTex: Tex.F_CONCRETE, faction: ZoneFaction.LIQUIDATOR, danger: 3 },
];

const NPC_DEFS: Record<NpcId, PlotNpcDef> = {
  voronoi_quarantine_doctor_pavel: {
    name: 'Павел Диаграммный',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.DOCTOR,
    sprite: Occupation.DOCTOR,
    hp: 132,
    maxHp: 132,
    money: 90,
    speed: 0.82,
    inventory: [
      { defId: 'official_quarantine_clearance', count: 1 },
      { defId: 'antibiotic', count: 1 },
      { defId: 'sterile_swab', count: 2 },
    ],
    talkLines: [
      'Карантин здесь нарезан не стенами, а ближайшей бедой. Где центр ячейки - там и начальство.',
      'Рёбра между палатами открываются только если бумага чище человека.',
      'Лев ещё говорит. Значит, ведём его как пациента, а не как статистику.',
    ],
    talkLinesPost: [
      'Диаграмма сошлась. Это не значит, что люди выздоровели.',
      'Если пост пропустил липовый допуск, значит пост тоже болен.',
    ],
  },
  voronoi_quarantine_clerk_zoya: {
    name: 'Зоя Рёберная',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.SECRETARY,
    sprite: Occupation.SECRETARY,
    hp: 86,
    maxHp: 86,
    money: 118,
    speed: 0.78,
    inventory: [
      { defId: 'blank_form', count: 2 },
      { defId: 'forged_quarantine_clearance', count: 1 },
      { defId: 'ink_bottle', count: 1 },
    ],
    talkLines: [
      'Граница любит круглую печать. Линия Вороного любит чужую фамилию.',
      'Пустой бланк станет пропуском, если не спрашивать, кто пустой.',
      'Чистая справка открывает пост. Липовая открывает разговор на посту.',
    ],
    talkLinesPost: [
      'На бумаге вы теперь почти здоровы.',
      'Не показывайте липовый пропуск доктору. Он видел настоящий.',
    ],
  },
  voronoi_quarantine_infected_lev: {
    name: 'Лев Жёлтый',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.TRAVELER,
    sprite: Occupation.TRAVELER,
    hp: 70,
    maxHp: 92,
    money: 9,
    speed: 0.64,
    inventory: [
      { defId: 'quarantine_medcard', count: 1 },
      { defId: 'contaminated_swab', count: 1 },
    ],
    talkLines: [
      'Я не яма. Я пока палата. Доведите меня до врача словами, руками не надо.',
      'Пост видит кашель раньше лица. Врач видит лицо раньше журнала.',
      'Если я упаду у ребра, меня запишут в соседнюю ячейку.',
    ],
    talkLinesPost: [
      'Доктор сказал: пациент. Я запомнил это слово.',
      'Температура стала ниже стены. Уже легче.',
    ],
  },
  voronoi_quarantine_quartermaster_marta: {
    name: 'Марта Соединитель',
    isFemale: true,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.STOREKEEPER,
    sprite: Occupation.STOREKEEPER,
    hp: 120,
    maxHp: 120,
    money: 144,
    speed: 0.84,
    inventory: [
      { defId: 'gasmask_filter', count: 1 },
      { defId: 'filter_receipt', count: 1 },
      { defId: 'door_kit', count: 1 },
    ],
    talkLines: [
      'Складовой соединитель сухой. Поэтому его и заперли.',
      'Принесёте обеззараживающую жидкость - открою сухую полку без очереди.',
      'Пайки идут по рёбрам. Кто режет ребро, тот решает, чья ячейка ест.',
    ],
    talkLinesPost: [
      'Соединитель открыт настолько, насколько это записано.',
      'Фильтр считайте едой. Дышать тоже надо ежедневно.',
    ],
  },
};

registerSideQuest('voronoi_quarantine_doctor_pavel', NPC_DEFS.voronoi_quarantine_doctor_pavel, [
  {
    id: 'voronoi_quarantine_decon_border',
    giverNpcId: 'voronoi_quarantine_doctor_pavel',
    type: QuestType.FETCH,
    desc: 'Павел Диаграммный: «Принесите обеззараживающую жидкость к чистой клинике. Тогда грязное ребро станет медицинским, а не мясным.»',
    targetItem: 'decon_fluid',
    targetCount: 1,
    rewardItem: 'official_quarantine_clearance',
    rewardCount: 1,
    extraRewards: [{ defId: 'antibiotic', count: 1 }],
    relationDelta: 12,
    xpReward: 80,
    moneyReward: 45,
    eventTags: [VORONOI_QUARANTINE_ROUTE_ID, 'decon', 'cross_border', 'quarantine'],
    eventPrivacy: 'local',
  },
]);

registerSideQuest('voronoi_quarantine_clerk_zoya', NPC_DEFS.voronoi_quarantine_clerk_zoya, [
  {
    id: 'voronoi_quarantine_forge_pass',
    giverNpcId: 'voronoi_quarantine_clerk_zoya',
    type: QuestType.FETCH,
    desc: 'Зоя Рёберная: «Дайте пустой бланк. Я сделаю пропуск, который выдержит одно ребро и не выдержит совесть.»',
    targetItem: 'blank_form',
    targetCount: 1,
    rewardItem: 'forged_quarantine_clearance',
    rewardCount: 1,
    extraRewards: [{ defId: 'fake_pass', count: 1 }],
    relationDelta: 4,
    xpReward: 45,
    moneyReward: 18,
    eventTags: [VORONOI_QUARANTINE_ROUTE_ID, 'forgery', 'pass', 'cross_border'],
    eventPrivacy: 'secret',
    eventData: { forgedClearance: true },
  },
]);

registerSideQuest('voronoi_quarantine_infected_lev', NPC_DEFS.voronoi_quarantine_infected_lev, [
  {
    id: 'voronoi_quarantine_escort_infected',
    giverNpcId: 'voronoi_quarantine_infected_lev',
    type: QuestType.TALK,
    desc: 'Лев Жёлтый: «Доведите меня до Павла. Пусть врач скажет посту, что я ещё пациент, а не соседняя яма.»',
    targetPlotNpcId: 'voronoi_quarantine_doctor_pavel',
    rewardItem: 'clean_health_cert',
    rewardCount: 1,
    extraRewards: [{ defId: 'quarantine_medcard', count: 1 }],
    relationDelta: 16,
    xpReward: 70,
    moneyReward: 12,
    eventTags: [VORONOI_QUARANTINE_ROUTE_ID, 'escort', 'infected_npc', 'triage'],
    eventPrivacy: 'local',
    failOnNpcDeathPlotId: 'voronoi_quarantine_infected_lev',
  },
]);

registerSideQuest('voronoi_quarantine_quartermaster_marta', NPC_DEFS.voronoi_quarantine_quartermaster_marta, [
  {
    id: 'voronoi_quarantine_open_supply_connector',
    giverNpcId: 'voronoi_quarantine_quartermaster_marta',
    type: QuestType.FETCH,
    desc: 'Марта Соединитель: «Канистру обеззараживания принесёте - сухой складовой соединитель откроется без крика кухни.»',
    targetItem: 'decon_fluid',
    targetCount: 1,
    rewardItem: 'gasmask_filter',
    rewardCount: 1,
    extraRewards: [{ defId: 'filtered_water', count: 1 }, { defId: 'ration_registry_extract', count: 1 }],
    relationDelta: 10,
    xpReward: 65,
    moneyReward: 40,
    eventTags: [VORONOI_QUARANTINE_ROUTE_ID, 'supply_connector', 'open_supply', 'decon'],
    eventPrivacy: 'witnessed',
    eventData: { supplyConnectorOpened: true },
  },
]);

const layouts = new WeakMap<World, VoronoiQuarantineLayout>();

export function getVoronoiQuarantineLayout(world: World): VoronoiQuarantineLayout | undefined {
  const layout = layouts.get(world);
  if (!layout) return undefined;
  return {
    ...layout,
    siteCellCounts: [...layout.siteCellCounts],
    adjacencyEdges: layout.adjacencyEdges.map(edge => [edge[0], edge[1]] as [number, number]),
  };
}

export function generateVoronoiQuarantineDesignFloor(seed = SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };

    initWorld(world);
    const sites = buildSites(seed);
    const owner = assignLaguerreCells(world, sites);
    const edgeMap = collectRidgeCandidates(world, owner, sites);
    const ridgeDoors = placeRidgeDoors(world, sites, edgeMap);
    buildRoomsFromOwners(world, sites, owner);
    decorateSites(world, sites, owner, seed);
    placeLifts(world, sites, owner);
    generateZones(world);
    tuneVoronoiQuarantineRouteZones(world);
    placeQuarantineEmergencyPanels(world, sites, owner, seed);

    const owners = spawnNpcs(world, entities, nextId, sites, owner);
    placeContainers(world, sites, owner, owners);
    placeDrops(world, entities, nextId, sites, owner);
    spawnThreats(world, entities, nextId, sites, owner);
    stampContamination(world, sites, seed);

    const spawn = findSiteCell(world, owner, siteId(sites, 'northCheckpoint'));
    sanitizeDoors(world);
    ensureConnectivity(world, spawn.x + 0.5, spawn.y + 0.5);
    world.rebuildContainerMap();
    world.bakeLights();

    layouts.set(world, {
      routeId: VORONOI_QUARANTINE_ROUTE_ID,
      lloydPasses: LLOYD_PASSES,
      siteCount: sites.length,
      siteCellCounts: countSiteCells(owner, sites.length),
      adjacencyEdges: sortedAdjacency(edgeMap),
      ridgeDoorCount: ridgeDoors.total,
      lockedPassDoorCount: ridgeDoors.lockedPass,
      supplyConnectorDoorCount: ridgeDoors.supplyConnector,
      connected: ridgeGraphConnected(sites.length, sortedAdjacency(edgeMap)),
    });

    return { world, entities, spawnX: spawn.x + 0.5, spawnY: spawn.y + 0.5 };
  });
}

export function tuneVoronoiQuarantineRouteZones(world: World): void {
  const layoutRooms = world.rooms.filter(room => room.name && siteRoleByRoomName(room.name) !== undefined);
  for (const zone of world.zones) {
    let nearest: Room | undefined;
    let bestD2 = Number.POSITIVE_INFINITY;
    for (const room of layoutRooms) {
      const d2 = world.dist2(zone.cx, zone.cy, room.x + room.w / 2, room.y + room.h / 2);
      if (d2 < bestD2) {
        bestD2 = d2;
        nearest = room;
      }
    }
    const role = nearest ? siteRoleByRoomName(nearest.name) : undefined;
    switch (role) {
      case 'checkpoint':
        zone.faction = ZoneFaction.LIQUIDATOR;
        zone.level = Math.max(zone.level, 3);
        zone.hasLift = true;
        break;
      case 'clinic':
      case 'office':
      case 'kitchen':
      case 'triage':
        zone.faction = zone.id % 5 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
        zone.level = Math.max(zone.level, role === 'triage' ? 3 : 2);
        break;
      case 'supply':
        zone.faction = ZoneFaction.LIQUIDATOR;
        zone.level = Math.max(zone.level, 3);
        zone.hasLift = true;
        break;
      case 'ward':
        zone.faction = zone.id % 2 === 0 ? ZoneFaction.SAMOSBOR : ZoneFaction.WILD;
        zone.level = Math.max(zone.level, 4);
        break;
      case 'corpse_pit':
        zone.faction = ZoneFaction.SAMOSBOR;
        zone.level = Math.max(zone.level, 5);
        break;
      default:
        zone.faction = ZoneFaction.CITIZEN;
        zone.level = Math.max(zone.level, 2);
        break;
    }
    zone.fogged = false;
  }

  for (let i = 0; i < W * W; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.CITIZEN;
  }
}

function initWorld(world: World): void {
  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.PANEL;
    world.floorTex[i] = Tex.F_LINO;
    world.factionControl[i] = ZoneFaction.CITIZEN;
    world.fog[i] = 10;
    world.roomMap[i] = -1;
  }
}

function buildSites(seed: number): Site[] {
  const sites = SITE_SEEDS.map((src, id) => {
    const jx = Math.round((hash01(seed, id, 11, 0) - 0.5) * 34);
    const jy = Math.round((hash01(seed, id, 17, 0) - 0.5) * 34);
    return {
      ...src,
      id,
      name: VORONOI_QUARANTINE_ROOM_NAMES[src.key],
      originX: src.x,
      originY: src.y,
      x: clamp(src.x + jx, CORE_MIN + 48, CORE_MAX - 48),
      y: clamp(src.y + jy, CORE_MIN + 48, CORE_MAX - 48),
    };
  });

  for (let pass = 0; pass < LLOYD_PASSES; pass++) {
    const sx = new Float64Array(sites.length);
    const sy = new Float64Array(sites.length);
    const count = new Int32Array(sites.length);
    for (let y = CORE_MIN; y <= CORE_MAX; y += LLOYD_STEP) {
      for (let x = CORE_MIN; x <= CORE_MAX; x += LLOYD_STEP) {
        const id = nearestSiteId(x, y, sites);
        sx[id] += x;
        sy[id] += y;
        count[id]++;
      }
    }
    for (const site of sites) {
      if (count[site.id] <= 0 || site.role === 'checkpoint') continue;
      const cx = sx[site.id] / count[site.id];
      const cy = sy[site.id] / count[site.id];
      site.x = Math.round(clamp(site.originX * 0.42 + cx * 0.58, CORE_MIN + 36, CORE_MAX - 36));
      site.y = Math.round(clamp(site.originY * 0.42 + cy * 0.58, CORE_MIN + 36, CORE_MAX - 36));
    }
  }

  return sites;
}

function assignLaguerreCells(world: World, sites: readonly Site[]): Int16Array {
  const owner = new Int16Array(W * W);
  owner.fill(OWNER_NONE);
  for (let y = CORE_MIN; y <= CORE_MAX; y++) {
    for (let x = CORE_MIN; x <= CORE_MAX; x++) {
      owner[world.idx(x, y)] = nearestSiteId(x, y, sites);
    }
  }

  for (let y = CORE_MIN; y <= CORE_MAX; y++) {
    for (let x = CORE_MIN; x <= CORE_MAX; x++) {
      const idx = world.idx(x, y);
      const id = owner[idx];
      if (id < 0) continue;
      const site = sites[id]!;
      let border = x === CORE_MIN || x === CORE_MAX || y === CORE_MIN || y === CORE_MAX;
      for (const [dx, dy] of ORTHO_DIRS) {
        const ni = world.idx(x + dx, y + dy);
        if (owner[ni] >= 0 && owner[ni] !== id) border = true;
      }
      if (border) {
        world.cells[idx] = Cell.WALL;
        world.wallTex[idx] = site.infected ? Tex.HERMO_WALL : site.wallTex;
        world.hermoWall[idx] = site.infected ? 1 : 0;
        world.roomMap[idx] = -1;
      } else {
        openOwnedCell(world, idx, id, site, hash01(SEED, x, y, id));
      }
    }
  }
  return owner;
}

function collectRidgeCandidates(
  world: World,
  owner: Int16Array,
  sites: readonly Site[],
): Map<string, RidgeCandidate> {
  const map = new Map<string, RidgeCandidate>();
  for (let y = CORE_MIN + 1; y < CORE_MAX; y++) {
    for (let x = CORE_MIN + 1; x < CORE_MAX; x++) {
      const idx = world.idx(x, y);
      const a = owner[idx];
      if (a < 0) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const ni = world.idx(x + dx, y + dy);
        const b = owner[ni];
        if (b < 0 || b === a) continue;
        recordRidgeCandidate(map, sites, a, b, x, y, x + dx, y + dy);
      }
    }
  }
  return map;
}

function placeRidgeDoors(
  world: World,
  sites: readonly Site[],
  edgeMap: Map<string, RidgeCandidate>,
): { total: number; lockedPass: number; supplyConnector: number } {
  const spanning = spanningRidges(sites.length, sortedCandidates(edgeMap));
  const extras = sortedCandidates(edgeMap)
    .filter(edge => !spanning.some(keep => samePair(edge, keep)))
    .filter(edge => shouldAddExtraRidge(sites[edge.a]!, sites[edge.b]!))
    .slice(0, 14);
  const edges = [...spanning, ...extras];
  let lockedPass = 0;
  let supplyConnector = 0;
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]!;
    const state = ridgeDoorState(sites[edge.a]!, sites[edge.b]!, i);
    if (state.keyId === 'official_quarantine_clearance' || state.keyId === 'forged_quarantine_clearance') lockedPass++;
    if (sitePairHasRole(sites[edge.a]!, sites[edge.b]!, 'supply')) supplyConnector++;
    placeDoubleDoor(world, sites, edge, state.state, state.keyId);
  }
  return { total: edges.length * 2, lockedPass, supplyConnector };
}

function buildRoomsFromOwners(world: World, sites: readonly Site[], owner: Int16Array): void {
  const bounds: Bounds[] = sites.map(() => ({ minX: W, minY: W, maxX: -1, maxY: -1, count: 0 }));
  for (let y = CORE_MIN; y <= CORE_MAX; y++) {
    for (let x = CORE_MIN; x <= CORE_MAX; x++) {
      const idx = world.idx(x, y);
      const id = owner[idx];
      if (id < 0 || world.cells[idx] === Cell.WALL) continue;
      const b = bounds[id]!;
      b.count++;
      if (x < b.minX) b.minX = x;
      if (y < b.minY) b.minY = y;
      if (x > b.maxX) b.maxX = x;
      if (y > b.maxY) b.maxY = y;
    }
  }

  world.rooms = sites.map(site => {
    const b = bounds[site.id]!;
    const x = b.count > 0 ? b.minX : site.x - 4;
    const y = b.count > 0 ? b.minY : site.y - 4;
    return {
      id: site.id,
      type: site.roomType,
      x,
      y,
      w: Math.max(4, b.maxX - x + 1),
      h: Math.max(4, b.maxY - y + 1),
      doors: [],
      sealed: site.infected === true,
      name: site.name,
      apartmentId: -1,
      wallTex: site.wallTex,
      floorTex: site.floorTex,
    };
  });

  for (const door of world.doors.values()) {
    const a = world.rooms[door.roomA];
    const b = world.rooms[door.roomB];
    if (a && !a.doors.includes(door.idx)) a.doors.push(door.idx);
    if (b && !b.doors.includes(door.idx)) b.doors.push(door.idx);
  }
}

function decorateSites(world: World, sites: readonly Site[], owner: Int16Array, seed: number): void {
  for (let y = CORE_MIN; y <= CORE_MAX; y++) {
    for (let x = CORE_MIN; x <= CORE_MAX; x++) {
      const idx = world.idx(x, y);
      const id = owner[idx];
      if (id < 0 || world.cells[idx] === Cell.WALL || world.cells[idx] === Cell.DOOR) continue;
      const site = sites[id]!;
      if (hash01(seed, x, y, 29) > featureChance(site.role)) continue;
      world.features[idx] = featureForRole(site.role, hash01(seed, x, y, 31));
    }
  }

  for (const site of sites) {
    const center = findSiteCell(world, owner, site.id);
    if (site.role === 'checkpoint') {
      setFeature(world, center.x - 4, center.y, Feature.DESK);
      setFeature(world, center.x + 4, center.y, Feature.SCREEN);
    } else if (site.role === 'triage') {
      setFeature(world, center.x - 5, center.y, Feature.BED);
      setFeature(world, center.x + 4, center.y + 3, Feature.APPARATUS);
    } else if (site.role === 'office') {
      setFeature(world, center.x, center.y, Feature.DESK);
      setFeature(world, center.x + 6, center.y, Feature.SHELF);
    }
  }
}

function placeLifts(world: World, sites: readonly Site[], owner: Int16Array): void {
  const up = findSiteCell(world, owner, siteId(sites, 'northCheckpoint'));
  const down = findSiteCell(world, owner, siteId(sites, 'southCheckpoint'));
  forceOpenDisc(world, owner, sites, siteId(sites, 'northCheckpoint'), up.x, up.y, 3);
  forceOpenDisc(world, owner, sites, siteId(sites, 'southCheckpoint'), down.x, down.y, 3);
  placeLift(world, up.x, up.y, up.x - 3, up.y, LiftDirection.UP);
  placeLift(world, down.x, down.y, down.x + 3, down.y, LiftDirection.DOWN);
}

function placeQuarantineEmergencyPanels(world: World, sites: readonly Site[], owner: Int16Array, seed: number): void {
  placePanelNearSite(world, sites, owner, 'northCheckpoint', 'panel_doors', seed ^ 0x751);
  placePanelNearSite(world, sites, owner, 'supplyConnector', 'panel_power', seed ^ 0x752);
  placePanelNearSite(world, sites, owner, 'infectedWard', 'panel_vent', seed ^ 0x753);
  placePanelNearSite(world, sites, owner, 'corpsePitEast', 'panel_water', seed ^ 0x754);
}

function spawnNpcs(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  sites: readonly Site[],
  owner: Int16Array,
): Record<NpcId, number> {
  return {
    voronoi_quarantine_doctor_pavel: spawnPlotNpc(world, entities, nextId, 'voronoi_quarantine_doctor_pavel', NPC_DEFS.voronoi_quarantine_doctor_pavel, sitePoint(world, owner, sites, 'cleanClinic', 14, -6), 0),
    voronoi_quarantine_clerk_zoya: spawnPlotNpc(world, entities, nextId, 'voronoi_quarantine_clerk_zoya', NPC_DEFS.voronoi_quarantine_clerk_zoya, sitePoint(world, owner, sites, 'forgeOffice', -8, 4), Math.PI),
    voronoi_quarantine_infected_lev: spawnPlotNpc(world, entities, nextId, 'voronoi_quarantine_infected_lev', NPC_DEFS.voronoi_quarantine_infected_lev, sitePoint(world, owner, sites, 'infectedWard', -10, 8), Math.PI / 2),
    voronoi_quarantine_quartermaster_marta: spawnPlotNpc(world, entities, nextId, 'voronoi_quarantine_quartermaster_marta', NPC_DEFS.voronoi_quarantine_quartermaster_marta, sitePoint(world, owner, sites, 'supplyConnector', 10, -6), -Math.PI / 2, 'makarov'),
  };
}

function placeContainers(
  world: World,
  sites: readonly Site[],
  owner: Int16Array,
  owners: Record<NpcId, number>,
): void {
  addContainer(world, roomForSite(world, sites, 'northCheckpoint'), sitePoint(world, owner, sites, 'northCheckpoint', -18, 8), ContainerKind.METAL_CABINET, 'Шкаф поста с чистыми журналами', 'faction', [
    { defId: 'gasmask_filter', count: 1 },
    { defId: 'official_quarantine_clearance', count: 1 },
    { defId: 'ammo_9mm', count: 10 },
  ], undefined, undefined, ['voronoi_quarantine', 'checkpoint', 'official_pass', 'cross_border']);

  addContainer(world, roomForSite(world, sites, 'forgeOffice'), sitePoint(world, owner, sites, 'forgeOffice', 10, 8), ContainerKind.FILING_CABINET, 'Картотека липких пропусков', 'owner', [
    { defId: 'blank_form', count: 2 },
    { defId: 'ink_bottle', count: 1 },
    { defId: 'forged_quarantine_clearance', count: 1 },
  ], owners.voronoi_quarantine_clerk_zoya, NPC_DEFS.voronoi_quarantine_clerk_zoya.name, ['voronoi_quarantine', 'forgery', 'pass', 'documents']);

  addContainer(world, roomForSite(world, sites, 'cleanClinic'), sitePoint(world, owner, sites, 'cleanClinic', -16, 10), ContainerKind.MEDICAL_CABINET, 'Шкаф чистой клиники Ллойда', 'public', [
    { defId: 'bandage', count: 2 },
    { defId: 'sterile_swab', count: 2 },
    { defId: 'pills', count: 1 },
  ], undefined, undefined, ['voronoi_quarantine', 'clinic', 'medicine']);

  addContainer(world, roomForSite(world, sites, 'supplyConnector'), sitePoint(world, owner, sites, 'supplyConnector', -12, 12), ContainerKind.EMERGENCY_BOX, 'Сухой складовой соединитель', 'locked', [
    { defId: 'decon_fluid', count: 1 },
    { defId: 'filter_receipt', count: 1 },
    { defId: 'filtered_water', count: 2 },
    { defId: 'canned', count: 2 },
  ], owners.voronoi_quarantine_quartermaster_marta, NPC_DEFS.voronoi_quarantine_quartermaster_marta.name, ['voronoi_quarantine', 'supply_connector', 'open_supply', 'decon']);

  addContainer(world, roomForSite(world, sites, 'redWard'), sitePoint(world, owner, sites, 'redWard', 8, 8), ContainerKind.MEDICAL_CABINET, 'Тумба красной палаты', 'secret', [
    { defId: 'contaminated_swab', count: 2 },
    { defId: 'quarantine_medcard', count: 1 },
    { defId: 'contaminated_gloves', count: 1 },
  ], undefined, undefined, ['voronoi_quarantine', 'infected_ward', 'contaminated', 'evidence']);
}

function placeDrops(world: World, entities: Entity[], nextId: { v: number }, sites: readonly Site[], owner: Int16Array): void {
  dropItem(world, entities, nextId, sitePoint(world, owner, sites, 'publicKitchen', -8, 6), 'bread', 1);
  dropItem(world, entities, nextId, sitePoint(world, owner, sites, 'triageHub', 12, -4), 'blank_form', 1);
  dropItem(world, entities, nextId, sitePoint(world, owner, sites, 'corpsePitWest', 8, 4), 'contaminated_swab', 1);
  dropItem(world, entities, nextId, sitePoint(world, owner, sites, 'corpsePitEast', -10, 10), 'decon_fluid', 1);
}

function spawnThreats(world: World, entities: Entity[], nextId: { v: number }, sites: readonly Site[], owner: Int16Array): void {
  spawnMonster(world, entities, nextId, MonsterKind.HEAD_SLUG, sitePoint(world, owner, sites, 'infectedWard', 12, 16), 3, 'Головной слизень жёлтого ребра');
  spawnMonster(world, entities, nextId, MonsterKind.DIKIY_MERTVYAK, sitePoint(world, owner, sites, 'redWard', -14, 18), 3, 'Мертвяк красной палаты');
  spawnMonster(world, entities, nextId, MonsterKind.CHERNOSLIZ, sitePoint(world, owner, sites, 'corpsePitEast', 10, -8), 4, 'Чернослиз трупной диаграммы');
  spawnMonster(world, entities, nextId, MonsterKind.BEZEKHIY, sitePoint(world, owner, sites, 'corpsePitWest', -10, -8), 3, 'Безэхий у санитарной стены');
}

function stampContamination(world: World, sites: readonly Site[], seed: number): void {
  for (const site of sites) {
    if (!site.infected) continue;
    stampSurfaceSplat(
      world,
      site.x,
      site.y,
      0.5,
      0.5,
      site.role === 'corpse_pit' ? 10 : 7,
      0.28,
      seed ^ (site.id * 0x71),
      site.role === 'corpse_pit' ? 52 : 164,
      site.role === 'corpse_pit' ? 72 : 68,
      site.role === 'corpse_pit' ? 60 : 38,
      false,
    );
  }
}

function nearestSiteId(x: number, y: number, sites: readonly Site[]): number {
  let best = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const site of sites) {
    const dx = x - site.x;
    const dy = y - site.y;
    const score = dx * dx + dy * dy - site.weight * site.weight;
    if (score < bestScore) {
      bestScore = score;
      best = site.id;
    }
  }
  return best;
}

const ORTHO_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

function openOwnedCell(world: World, idx: number, roomId: number, site: Site, noise: number): void {
  world.cells[idx] = site.infected && site.role === 'corpse_pit' && noise > 0.74 ? Cell.WATER : Cell.FLOOR;
  world.roomMap[idx] = roomId;
  world.floorTex[idx] = world.cells[idx] === Cell.WATER ? Tex.F_WATER : site.floorTex;
  world.wallTex[idx] = site.wallTex;
  world.hermoWall[idx] = 0;
  world.fog[idx] = site.infected ? Math.max(world.fog[idx], site.role === 'corpse_pit' ? 58 : 34) : Math.max(2, world.fog[idx] - 3);
  world.light[idx] = site.infected ? 0.1 : site.role === 'clinic' || site.role === 'checkpoint' ? 0.32 : 0.18;
}

function recordRidgeCandidate(
  map: Map<string, RidgeCandidate>,
  sites: readonly Site[],
  a: number,
  b: number,
  x: number,
  y: number,
  nx: number,
  ny: number,
): void {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const key = `${lo}:${hi}`;
  const sa = sites[lo]!;
  const sb = sites[hi]!;
  const mx = (sa.x + sb.x) / 2;
  const my = (sa.y + sb.y) / 2;
  const score = (x - mx) * (x - mx) + (y - my) * (y - my) + hash01(SEED, x, y, lo + hi) * 0.01;
  const previous = map.get(key);
  if (!previous || score < previous.score) map.set(key, { a: lo, b: hi, x, y, nx, ny, score });
}

function sortedCandidates(map: Map<string, RidgeCandidate>): RidgeCandidate[] {
  return [...map.values()].sort((a, b) => a.score - b.score);
}

function sortedAdjacency(map: Map<string, RidgeCandidate>): [number, number][] {
  return [...map.values()]
    .map(edge => [edge.a, edge.b] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function spanningRidges(siteCount: number, candidates: readonly RidgeCandidate[]): RidgeCandidate[] {
  const parent = new Int16Array(siteCount);
  for (let i = 0; i < siteCount; i++) parent[i] = i;
  const out: RidgeCandidate[] = [];
  const find = (v: number): number => {
    let p = v;
    while (parent[p] !== p) p = parent[p];
    while (parent[v] !== v) {
      const n = parent[v];
      parent[v] = p;
      v = n;
    }
    return p;
  };
  for (const edge of candidates) {
    const a = find(edge.a);
    const b = find(edge.b);
    if (a === b) continue;
    parent[a] = b;
    out.push(edge);
    if (out.length >= siteCount - 1) break;
  }
  return out;
}

function ridgeGraphConnected(siteCount: number, edges: readonly [number, number][]): boolean {
  if (siteCount <= 1) return true;
  const seen = new Uint8Array(siteCount);
  const queue = [0];
  seen[0] = 1;
  for (let head = 0; head < queue.length; head++) {
    const v = queue[head]!;
    for (const [a, b] of edges) {
      const n = a === v ? b : b === v ? a : -1;
      if (n < 0 || seen[n]) continue;
      seen[n] = 1;
      queue.push(n);
    }
  }
  for (const value of seen) if (!value) return false;
  return true;
}

function shouldAddExtraRidge(a: Site, b: Site): boolean {
  if (sitePairHasRole(a, b, 'supply')) return true;
  if ((a.infected || b.infected) && !(a.infected && b.infected)) return true;
  if (a.role === 'checkpoint' || b.role === 'checkpoint') return true;
  return a.role === 'kitchen' || b.role === 'kitchen';
}

function ridgeDoorState(a: Site, b: Site, serial: number): { state: DoorState; keyId: string } {
  if (sitePairHasRole(a, b, 'supply')) return { state: DoorState.LOCKED, keyId: 'official_quarantine_clearance' };
  if ((a.infected || b.infected) && !(a.infected && b.infected) && serial % 2 === 0) {
    return { state: DoorState.LOCKED, keyId: serial % 4 === 0 ? 'official_quarantine_clearance' : 'forged_quarantine_clearance' };
  }
  return { state: DoorState.CLOSED, keyId: '' };
}

function placeDoubleDoor(
  world: World,
  sites: readonly Site[],
  edge: RidgeCandidate,
  state: DoorState,
  keyId: string,
): void {
  const a = sites[edge.a]!;
  const b = sites[edge.b]!;
  setDoorCell(world, edge.x, edge.y, a.id, b.id, state, keyId);
  setDoorCell(world, edge.nx, edge.ny, b.id, a.id, state, keyId);
  const dx = Math.sign(edge.nx - edge.x);
  const dy = Math.sign(edge.ny - edge.y);
  forceOpenDisc(world, undefined, sites, a.id, edge.x - dx, edge.y - dy, 1);
  forceOpenDisc(world, undefined, sites, b.id, edge.nx + dx, edge.ny + dy, 1);
}

function setDoorCell(world: World, x: number, y: number, roomA: number, roomB: number, state: DoorState, keyId: string): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.roomMap[idx] = roomA;
  world.hermoWall[idx] = 0;
  world.wallTex[idx] = Tex.DOOR_METAL;
  world.features[idx] = Feature.NONE;
  world.doors.set(idx, { idx, state, roomA, roomB, keyId, timer: 0 });
}

function forceOpenDisc(
  world: World,
  owner: Int16Array | undefined,
  sites: readonly Site[],
  siteIdValue: number,
  cx: number,
  cy: number,
  radius: number,
): void {
  const site = sites[siteIdValue]!;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const idx = world.idx(cx + dx, cy + dy);
      if (world.cells[idx] === Cell.LIFT || world.cells[idx] === Cell.DOOR) continue;
      if (owner) owner[idx] = siteIdValue;
      openOwnedCell(world, idx, siteIdValue, site, 0);
      world.features[idx] = Feature.NONE;
    }
  }
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(x, y);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.liftDir[li] = direction;
  world.roomMap[li] = -1;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR || world.cells[bi] === Cell.WATER) world.features[bi] = Feature.LIFT_BUTTON;
  world.liftDir[bi] = direction;
}

function placePanelNearSite(
  world: World,
  sites: readonly Site[],
  owner: Int16Array,
  key: keyof typeof VORONOI_QUARANTINE_ROOM_NAMES,
  panelId: 'panel_doors' | 'panel_power' | 'panel_vent' | 'panel_water',
  seed: number,
): void {
  const p = sitePoint(world, owner, sites, key, 6, 6);
  placeEmergencyPanel(world, p.x, p.y, panelId, seed);
}

function spawnPlotNpc(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  npcId: NpcId,
  def: PlotNpcDef,
  point: { x: number; y: number },
  angle: number,
  weapon = def.weapon,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: point.x + 0.5,
    y: point.y + 0.5,
    angle,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: def.sprite,
    name: def.name,
    isFemale: def.isFemale,
    needs: freshNeeds(),
    hp: def.hp,
    maxHp: def.maxHp,
    money: def.money,
    ai: { goal: AIGoal.IDLE, tx: point.x + 0.5, ty: point.y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(item => ({ ...item })),
    weapon,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
    rpg: randomRPG(3),
  });
  void world;
  return id;
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  kind: MonsterKind,
  point: { x: number; y: number },
  level: number,
  name?: string,
): void {
  const idx = world.idx(point.x, point.y);
  if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) return;
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = Math.round(def.hp * (0.84 + level * 0.16));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: point.x + 0.5,
    y: point.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (0.95 + level * 0.035),
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: point.x, ty: point.y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
    phasing: kind === MonsterKind.SHADOW || kind === MonsterKind.SPIRIT,
  });
}

function addContainer(
  world: World,
  room: Room,
  point: { x: number; y: number },
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: Item[],
  ownerNpcId: number | undefined,
  ownerName: string | undefined,
  tags: string[],
): WorldContainer {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: world.wrap(point.x),
    y: world.wrap(point.y),
    floor: VORONOI_QUARANTINE_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(point.x, point.y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: Math.max(8, inventory.length + 4),
    ownerNpcId,
    ownerName,
    faction: access === 'faction' ? Faction.LIQUIDATOR : undefined,
    access,
    lockDifficulty: access === 'locked' ? 4 : undefined,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, point.x, point.y, kind === ContainerKind.MEDICAL_CABINET ? Feature.APPARATUS : Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function dropItem(world: World, entities: Entity[], nextId: { v: number }, point: { x: number; y: number }, defId: string, count: number): void {
  const idx = world.idx(point.x, point.y);
  if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) return;
  entities.push({
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: point.x + 0.5,
    y: point.y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count }],
  });
}

function sitePoint(
  world: World,
  owner: Int16Array,
  sites: readonly Site[],
  key: keyof typeof VORONOI_QUARANTINE_ROOM_NAMES,
  ox: number,
  oy: number,
): { x: number; y: number } {
  const site = sites[siteId(sites, key)]!;
  const preferred = { x: world.wrap(site.x + ox), y: world.wrap(site.y + oy) };
  const preferredIdx = world.idx(preferred.x, preferred.y);
  if ((world.cells[preferredIdx] === Cell.FLOOR || world.cells[preferredIdx] === Cell.WATER) && owner[preferredIdx] === site.id) return preferred;
  return findSiteCell(world, owner, site.id);
}

function findSiteCell(world: World, owner: Int16Array, id: number): { x: number; y: number } {
  const site = SITE_SEEDS[id]!;
  const sx = Math.round(site.x);
  const sy = Math.round(site.y);
  for (let r = 0; r <= 96; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = world.wrap(sx + dx);
        const y = world.wrap(sy + dy);
        const idx = world.idx(x, y);
        if (owner[idx] !== id) continue;
        if (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) return { x, y };
      }
    }
  }
  return { x: sx, y: sy };
}

function roomForSite(world: World, sites: readonly Site[], key: keyof typeof VORONOI_QUARANTINE_ROOM_NAMES): Room {
  return world.rooms[siteId(sites, key)]!;
}

function siteId(sites: readonly Site[], key: keyof typeof VORONOI_QUARANTINE_ROOM_NAMES): number {
  const site = sites.find(item => item.key === key);
  return site?.id ?? 0;
}

function sitePairHasRole(a: Site, b: Site, role: SiteRole): boolean {
  return a.role === role || b.role === role;
}

function samePair(a: RidgeCandidate, b: RidgeCandidate): boolean {
  return a.a === b.a && a.b === b.b;
}

function countSiteCells(owner: Int16Array, siteCount: number): number[] {
  const counts = new Array(siteCount).fill(0) as number[];
  for (const id of owner) if (id >= 0) counts[id]++;
  return counts;
}

function siteRoleByRoomName(name: string): SiteRole | undefined {
  const seed = SITE_SEEDS.find(item => VORONOI_QUARANTINE_ROOM_NAMES[item.key] === name);
  return seed?.role;
}

function featureChance(role: SiteRole): number {
  switch (role) {
    case 'checkpoint':
    case 'clinic':
    case 'supply':
      return 0.034;
    case 'kitchen':
    case 'office':
      return 0.028;
    case 'corpse_pit':
      return 0.018;
    default:
      return 0.02;
  }
}

function featureForRole(role: SiteRole, roll: number): Feature {
  switch (role) {
    case 'checkpoint':
      return roll < 0.45 ? Feature.DESK : roll < 0.72 ? Feature.SCREEN : Feature.LAMP;
    case 'clinic':
    case 'ward':
      return roll < 0.42 ? Feature.BED : roll < 0.72 ? Feature.APPARATUS : Feature.SINK;
    case 'office':
      return roll < 0.5 ? Feature.DESK : Feature.SHELF;
    case 'kitchen':
      return roll < 0.34 ? Feature.STOVE : roll < 0.68 ? Feature.SINK : Feature.TABLE;
    case 'supply':
      return roll < 0.72 ? Feature.SHELF : Feature.MACHINE;
    case 'corpse_pit':
      return roll < 0.55 ? Feature.BED : Feature.APPARATUS;
    case 'triage':
    default:
      return roll < 0.45 ? Feature.CHAIR : roll < 0.72 ? Feature.TABLE : Feature.LAMP;
  }
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) world.features[idx] = feature;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hash01(seed: number, a: number, b: number, c: number): number {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(a + 0x632be5ab, 0x27d4eb2d);
  x ^= Math.imul(b + 0x85157af5, 0x165667b1);
  x ^= Math.imul(c + 0x4cf5ad43, 0xd3a2646c);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  x = Math.imul(x, 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 0x100000000;
}

/* -- Design floor: Оранжерея бетона ------------------------------
 * A food-and-water route floor where crop beds, spores and valves
 * make scarcity visible without a runtime growth simulation.
 */

import { stampSurfaceSplat } from '../../systems/surface_marks';
import {
  AIGoal,
  Cell,
  ContainerKind,
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
import { ITEMS, freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { randomRPG } from '../../systems/rpg';
import {
  carveCorridor,
  ensureConnectivity,
  generateZones,
  roomExit,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const ORANZHEREYA_BETONA_ROUTE_ID = 'oranzhereya_betona' as const;
export const ORANZHEREYA_BETONA_Z = -2 as const;
export const ORANZHEREYA_BETONA_BASE_FLOOR = FloorLevel.LIVING;
export const ORANZHEREYA_BETONA_DISPLAY_NAME = 'Оранжерея бетона';

export const ORANZHEREYA_ROOM_NAMES = {
  entry: 'Лифтовая теплица О-8',
  gallery: 'Галерея бетонных гряд О-8',
  pump: 'Насосная капельного полива О-8',
  northRows: 'Северные грядки пайковой зелени',
  southRows: 'Южные стеллажи грибной пайки',
  waterBasin: 'Бассейн питательного раствора',
  burnTrench: 'Прожиговая канава спор',
  mushroomWard: 'Сырой грибной карман',
  seedVault: 'Семенная кладовая жильцов',
  marketStall: 'Рыночная форточка Оранжереи',
  guardPost: 'Пост водяной нормы',
  compost: 'Компостная долговая яма',
} as const;

const SEED = hashSeed(ORANZHEREYA_BETONA_ROUTE_ID);
const CONTENT_TAG = 'oranzhereya_betona';
const CX = W >> 1;
const CY = W >> 1;

type NextId = { v: number };
type GreenhouseNpcId =
  | 'oranzhereya_agronom_nadya'
  | 'oranzhereya_irrigator_gleb'
  | 'oranzhereya_guard_arsen'
  | 'oranzhereya_market_sonya';

interface GreenhouseRooms {
  entry: Room;
  gallery: Room;
  pump: Room;
  northRows: Room;
  southRows: Room;
  waterBasin: Room;
  burnTrench: Room;
  mushroomWard: Room;
  seedVault: Room;
  marketStall: Room;
  guardPost: Room;
  compost: Room;
}

export interface OranzhereyaBetonaMetrics {
  cropCells: number;
  waterCells: number;
  basinContainers: number;
  publicHarvestContainers: number;
  sabotageContainers: number;
}

const NPC_DEFS: Record<GreenhouseNpcId, PlotNpcDef> = {
  oranzhereya_agronom_nadya: {
    name: 'Надя Агроном',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SCIENTIST,
    sprite: Occupation.SCIENTIST,
    hp: 125,
    maxHp: 125,
    money: 88,
    speed: 0.86,
    inventory: [
      { defId: 'spore_print', count: 1 },
      { defId: 'substrate_sack', count: 1 },
      { defId: 'filtered_water', count: 1 },
    ],
    talkLines: [
      'Оранжерея не выращивает чудо. Она выращивает очередь, чтобы очередь не съела себя.',
      'Если споры уйдут в капельный полив, хлеб станет слухом. Нужна соль, чистая тара и холодная голова.',
      'Рынок хочет заражённый урожай. Жильцы хотят живой. Дом хочет, чтобы мы спорили у грядки.',
    ],
    talkLinesPost: [
      'Грядки дышат ровнее. Это ещё не урожай, но уже не паника.',
      'Соль помогла. Главное теперь не продать чистый ряд под видом редкости.',
    ],
  },
  oranzhereya_irrigator_gleb: {
    name: 'Глеб Капельник',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.ELECTRICIAN,
    sprite: Occupation.ELECTRICIAN,
    hp: 115,
    maxHp: 115,
    money: 42,
    speed: 0.9,
    inventory: [
      { defId: 'valve_tag', count: 1 },
      { defId: 'pipe', count: 1 },
      { defId: 'water_coupon', count: 1 },
    ],
    talkLines: [
      'Вода идёт по графику, а график по рукам. Переставишь бирку вентиля - решишь, кто пьёт первым.',
      'Труба течёт в компост. Можно закрыть, можно пустить на чистые грядки, можно продать рыноковой форточке.',
      'Я не сантехник. Сантехники просят деньги. Я прошу, чтобы никто не умер у крана.',
    ],
    talkLinesPost: [
      'Капля пошла в нужную сторону. Очередь всё равно будет, но уже без ножей у насоса.',
      'Бирка на месте. Кто захочет спорить, пусть спорит с давлением.',
    ],
  },
  oranzhereya_guard_arsen: {
    name: 'Арсен Водомер',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 175,
    maxHp: 175,
    money: 76,
    speed: 0.96,
    weapon: 'makarov',
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 12 },
      { defId: 'filter_layer', count: 1 },
    ],
    talkLines: [
      'Водомер не охраняет еду. Водомер охраняет момент, когда еда становится поводом.',
      'Если полезете в пайковую кладовую без слова, я запишу вас как потерю воды.',
      'Сжечь заражённый ряд можно. Только не сжигайте весь этаж ради красивого дыма.',
    ],
    talkLinesPost: [
      'Пламя прошло по канаве, не по людям. Редкий случай, когда инструкция похожа на правду.',
      'Пост стоит. Теперь воруют тише, а это уже почти порядок.',
    ],
  },
  oranzhereya_market_sonya: {
    name: 'Соня Форточка',
    isFemale: true,
    faction: Faction.WILD,
    occupation: Occupation.STOREKEEPER,
    sprite: Occupation.STOREKEEPER,
    hp: 110,
    maxHp: 110,
    money: 155,
    speed: 0.88,
    inventory: [
      { defId: 'infected_mushroom', count: 2 },
      { defId: 'forged_ration_card', count: 1 },
      { defId: 'acid_bottle', count: 1 },
    ],
    talkLines: [
      'Чистая еда скучная. Заражённая еда редкая. Редкость дороже скуки.',
      'Кислота в басейн - и урожай уйдёт в рынок не как пайка, а как товар для смелых.',
      'Я не травлю жильцов. Я предлагаю им выбор, который они всё равно сделают в темноте.',
    ],
    talkLinesPost: [
      'Форточка помнит, кто умеет портить аккуратно.',
      'Если вдруг стало слишком чисто, приходите. Я испорчу цену, не урожай.',
    ],
  },
};

registerSideQuest('oranzhereya_agronom_nadya', NPC_DEFS.oranzhereya_agronom_nadya, [{
  id: 'oranzhereya_save_clean_crop',
  giverNpcId: 'oranzhereya_agronom_nadya',
  type: QuestType.FETCH,
  desc: 'Надя Агроном: «Принеси каменную соль. Споры надо остановить у грядки, пока рынок не назвал их деликатесом.»',
  targetItem: 'rock_salt',
  targetCount: 1,
  rewardItem: 'mushroom_mass',
  rewardCount: 3,
  extraRewards: [{ defId: 'filtered_water', count: 1 }, { defId: 'water_coupon', count: 1 }],
  relationDelta: 12,
  xpReward: 70,
  moneyReward: 36,
  eventTags: [CONTENT_TAG, 'crop_saved', 'food', 'water', 'fungus'],
  eventPrivacy: 'local',
  eventSeverity: 3,
}]);

registerSideQuest('oranzhereya_irrigator_gleb', NPC_DEFS.oranzhereya_irrigator_gleb, [{
  id: 'oranzhereya_reroute_water',
  giverNpcId: 'oranzhereya_irrigator_gleb',
  type: QuestType.FETCH,
  desc: 'Глеб Капельник: «Найди бирку вентиля. Без неё вода течёт в компост, а люди считают друг друга ведрами.»',
  targetItem: 'valve_tag',
  targetCount: 1,
  rewardItem: 'filtered_water',
  rewardCount: 2,
  extraRewards: [{ defId: 'pipe', count: 1 }],
  relationDelta: 10,
  xpReward: 65,
  moneyReward: 30,
  eventTags: [CONTENT_TAG, 'water', 'reroute', 'valve', 'living_scarcity'],
  eventPrivacy: 'local',
  eventSeverity: 3,
}]);

registerSideQuest('oranzhereya_guard_arsen', NPC_DEFS.oranzhereya_guard_arsen, [{
  id: 'oranzhereya_burn_infestation',
  giverNpcId: 'oranzhereya_guard_arsen',
  type: QuestType.KILL,
  desc: 'Арсен Водомер: «В прожиговой канаве проснулся борщевик. Сожги или пристрели корень, пока он не научил пайку кусаться.»',
  targetMonsterKind: MonsterKind.BORSHCHEVIK,
  killNeeded: 1,
  rewardItem: 'filter_layer',
  rewardCount: 2,
  extraRewards: [{ defId: 'ammo_fuel', count: 1 }, { defId: 'ammo_9mm', count: 8 }],
  relationDelta: 8,
  xpReward: 110,
  moneyReward: 55,
  eventTags: [CONTENT_TAG, 'burn_infestation', 'liquidator', 'fire', 'crop_defense'],
  eventPrivacy: 'witnessed',
  eventSeverity: 4,
}]);

registerSideQuest('oranzhereya_market_sonya', NPC_DEFS.oranzhereya_market_sonya, [{
  id: 'oranzhereya_poison_market_crop',
  giverNpcId: 'oranzhereya_market_sonya',
  type: QuestType.FETCH,
  desc: 'Соня Форточка: «Кислоту в питательный басейн. Чистая пайка кормит соседей, испорченная платит сразу.»',
  targetItem: 'acid_bottle',
  targetCount: 1,
  rewardItem: 'forged_ration_card',
  rewardCount: 1,
  extraRewards: [{ defId: 'infected_mushroom', count: 3 }],
  relationDelta: -6,
  xpReward: 55,
  moneyReward: 95,
  eventTags: [CONTENT_TAG, 'poison_crop', 'black_market_88', 'sabotage', 'food'],
  eventPrivacy: 'secret',
  eventSeverity: 4,
}]);

export function generateOranzhereyaBetonaDesignFloor(seed = SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };

    initWorld(world);
    const rooms = buildRooms(world);
    connectRooms(world, rooms);
    decorateRooms(world, rooms);
    placeLifts(world, rooms.entry);
    generateZones(world);
    tuneOranzhereyaBetonaRouteZones(world);

    const owners = spawnNpcs(entities, nextId, rooms);
    placeContainers(world, rooms, owners);
    placeDrops(entities, nextId, rooms);
    spawnThreats(world, entities, nextId, rooms);

    sanitizeDoors(world);
    ensureConnectivity(world, rooms.entry.x + 10.5, rooms.entry.y + 14.5);
    world.rebuildContainerMap();
    world.bakeLights();

    return {
      world,
      entities,
      spawnX: rooms.entry.x + 10.5,
      spawnY: rooms.entry.y + 14.5,
    };
  });
}

export function tuneOranzhereyaBetonaRouteZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CX, CY);
    const marketSide = zone.cx > CX + 130 && zone.cy > CY - 40;
    const wetSide = zone.cx > CX + 70 && zone.cy < CY - 40;
    const cropCore = d < 190;
    const sporeEdge = zone.cx < CX - 150 || zone.cy > CY + 160;

    zone.faction = marketSide ? ZoneFaction.WILD
      : wetSide ? ZoneFaction.LIQUIDATOR
        : cropCore ? ZoneFaction.CITIZEN
          : sporeEdge ? ZoneFaction.SAMOSBOR
            : ZoneFaction.CITIZEN;
    zone.level = Math.max(zone.level, sporeEdge ? 4 : marketSide ? 3 : cropCore ? 2 : 3);
    zone.fogged = sporeEdge && (zone.id % 3 === 0);
  }

  for (let i = 0; i < W * W; i++) {
    const zone = world.zones[world.zoneMap[i]];
    world.factionControl[i] = zone?.faction ?? ZoneFaction.CITIZEN;
    if (zone?.fogged) world.fog[i] = Math.max(world.fog[i], 12);
  }
  world.markFogDirty();
}

export function measureOranzhereyaBetonaGeometry(world: World): OranzhereyaBetonaMetrics {
  const cropRoomNames = new Set<string>([
    ORANZHEREYA_ROOM_NAMES.northRows,
    ORANZHEREYA_ROOM_NAMES.southRows,
    ORANZHEREYA_ROOM_NAMES.mushroomWard,
  ]);
  const cropRoomIds = new Set(world.rooms
    .filter(room => cropRoomNames.has(room.name))
    .map(room => room.id));
  let cropCells = 0;
  let waterCells = 0;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.WATER) waterCells++;
    if (cropRoomIds.has(world.roomMap[i]) && world.floorTex[i] === Tex.F_GREEN_CARPET) cropCells++;
  }
  return {
    cropCells,
    waterCells,
    basinContainers: world.containers.filter(c => c.tags.includes('nutrient_basin')).length,
    publicHarvestContainers: world.containers.filter(c => c.tags.includes('harvest') && c.access === 'public').length,
    sabotageContainers: world.containers.filter(c => c.tags.includes('sabotage_drop')).length,
  };
}

function initWorld(world: World): void {
  world.wallTex.fill(Tex.PANEL);
  world.floorTex.fill(Tex.F_CONCRETE);
}

function buildRooms(world: World): GreenhouseRooms {
  const entry = makeRoom(world, RoomType.CORRIDOR, CX - 66, CY - 16, 132, 32, ORANZHEREYA_ROOM_NAMES.entry, Tex.PANEL, Tex.F_TILE);
  const gallery = makeRoom(world, RoomType.COMMON, CX - 106, CY - 88, 212, 102, ORANZHEREYA_ROOM_NAMES.gallery, Tex.PANEL, Tex.F_GREEN_CARPET);
  const pump = makeRoom(world, RoomType.PRODUCTION, CX - 62, CY - 154, 124, 44, ORANZHEREYA_ROOM_NAMES.pump, Tex.PIPE, Tex.F_CONCRETE);
  const northRows = makeRoom(world, RoomType.KITCHEN, CX - 270, CY - 184, 156, 78, ORANZHEREYA_ROOM_NAMES.northRows, Tex.PANEL, Tex.F_GREEN_CARPET);
  const waterBasin = makeRoom(world, RoomType.BATHROOM, CX + 112, CY - 184, 156, 78, ORANZHEREYA_ROOM_NAMES.waterBasin, Tex.TILE_W, Tex.F_WATER);
  const burnTrench = makeRoom(world, RoomType.PRODUCTION, CX - 270, CY - 74, 116, 86, ORANZHEREYA_ROOM_NAMES.burnTrench, Tex.METAL, Tex.F_CONCRETE);
  const guardPost = makeRoom(world, RoomType.HQ, CX + 134, CY - 68, 114, 76, ORANZHEREYA_ROOM_NAMES.guardPost, Tex.METAL, Tex.F_LINO);
  const mushroomWard = makeRoom(world, RoomType.PRODUCTION, CX - 270, CY + 68, 158, 82, ORANZHEREYA_ROOM_NAMES.mushroomWard, Tex.ROTTEN, Tex.F_GREEN_CARPET);
  const compost = makeRoom(world, RoomType.STORAGE, CX - 92, CY + 32, 76, 58, ORANZHEREYA_ROOM_NAMES.compost, Tex.ROTTEN, Tex.F_CONCRETE);
  const seedVault = makeRoom(world, RoomType.STORAGE, CX - 76, CY + 96, 92, 68, ORANZHEREYA_ROOM_NAMES.seedVault, Tex.METAL, Tex.F_CONCRETE);
  const marketStall = makeRoom(world, RoomType.COMMON, CX + 28, CY + 88, 100, 76, ORANZHEREYA_ROOM_NAMES.marketStall, Tex.BRICK, Tex.F_LINO);
  const southRows = makeRoom(world, RoomType.KITCHEN, CX + 154, CY + 70, 156, 82, ORANZHEREYA_ROOM_NAMES.southRows, Tex.PANEL, Tex.F_GREEN_CARPET);

  return {
    entry,
    gallery,
    pump,
    northRows,
    southRows,
    waterBasin,
    burnTrench,
    mushroomWard,
    seedVault,
    marketStall,
    guardPost,
    compost,
  };
}

function makeRoom(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const idx = world.idx(x + dx, y + dy);
      if (world.cells[idx] === Cell.WALL) world.wallTex[idx] = wallTex;
    }
  }
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const idx = world.idx(x + dx, y + dy);
      world.floorTex[idx] = floorTex;
    }
  }
  return room;
}

function connectRooms(world: World, rooms: GreenhouseRooms): void {
  for (const room of [
    rooms.pump,
    rooms.northRows,
    rooms.waterBasin,
    rooms.burnTrench,
    rooms.guardPost,
    rooms.mushroomWard,
    rooms.compost,
    rooms.seedVault,
    rooms.marketStall,
    rooms.southRows,
  ]) connectRoomPair(world, rooms.gallery, room);
  connectRoomPair(world, rooms.entry, rooms.gallery);
  connectRoomPair(world, rooms.pump, rooms.waterBasin);
  connectRoomPair(world, rooms.mushroomWard, rooms.compost);
  connectRoomPair(world, rooms.marketStall, rooms.southRows);
}

function connectRoomPair(world: World, a: Room, b: Room): void {
  const ac = roomCenter(a);
  const bc = roomCenter(b);
  const ae = roomExit(world, a, bc.x, bc.y);
  const be = roomExit(world, b, ac.x, ac.y);
  carveCorridor(world, ae.ox, ae.oy, be.ox, be.oy);
}

function roomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.x + Math.floor(room.w / 2),
    y: room.y + Math.floor(room.h / 2),
  };
}

function decorateRooms(world: World, rooms: GreenhouseRooms): void {
  placeCropRows(world, rooms.northRows, 0);
  placeCropRows(world, rooms.southRows, 97);
  placeMushroomRows(world, rooms.mushroomWard);
  placeIrrigationGraph(world, rooms);
  placeRoomFixtures(world, rooms);
  stampGrowthFields(world, rooms);
}

function placeCropRows(world: World, room: Room, seed: number): void {
  for (let y = room.y + 7; y < room.y + room.h - 5; y += 8) {
    for (let x = room.x + 6; x < room.x + room.w - 6; x++) {
      const idx = world.idx(x, y);
      if (world.cells[idx] !== Cell.FLOOR) continue;
      world.floorTex[idx] = Tex.F_GREEN_CARPET;
      if ((x + seed) % 9 === 0) world.features[idx] = Feature.TABLE;
      if ((x + y + seed) % 23 === 0) stampSurfaceSplat(world, x, y, 0.5, 0.5, 1.2, 0.18, seed * 1009 + x * 17 + y, 48, 128, 54, true);
    }
  }
}

function placeMushroomRows(world: World, room: Room): void {
  for (let y = room.y + 5; y < room.y + room.h - 5; y += 7) {
    for (let x = room.x + 5; x < room.x + room.w - 5; x += 2) {
      const idx = world.idx(x, y);
      if (world.cells[idx] !== Cell.FLOOR) continue;
      world.floorTex[idx] = Tex.F_GREEN_CARPET;
      if ((x + y) % 11 === 0) world.features[idx] = Feature.SHELF;
      if ((x + y) % 19 === 0) stampSurfaceSplat(world, x, y, 0.5, 0.5, 0.9, 0.22, x * 31 + y * 37, 72, 88, 56, true);
    }
  }
}

function placeIrrigationGraph(world: World, rooms: GreenhouseRooms): void {
  const pump = roomCenter(rooms.pump);
  const basin = roomCenter(rooms.waterBasin);
  const north = roomCenter(rooms.northRows);
  const south = roomCenter(rooms.southRows);
  const mushroom = roomCenter(rooms.mushroomWard);
  carveWaterLine(world, pump.x, pump.y, basin.x, basin.y);
  carveWaterLine(world, pump.x, pump.y, north.x, north.y);
  carveWaterLine(world, basin.x, basin.y, south.x, south.y);
  carveWaterLine(world, pump.x, pump.y, mushroom.x, mushroom.y);

  for (let y = rooms.waterBasin.y + 8; y < rooms.waterBasin.y + rooms.waterBasin.h - 8; y++) {
    for (let x = rooms.waterBasin.x + 10; x < rooms.waterBasin.x + rooms.waterBasin.w - 10; x++) {
      if ((x + y) % 3 !== 0) continue;
      const idx = world.idx(x, y);
      if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) continue;
      world.cells[idx] = Cell.WATER;
      world.floorTex[idx] = Tex.F_WATER;
    }
  }
}

function carveWaterLine(world: World, ax: number, ay: number, bx: number, by: number): void {
  const dx = world.delta(ax, bx);
  const dy = world.delta(ay, by);
  const sx = dx >= 0 ? 1 : -1;
  const sy = dy >= 0 ? 1 : -1;
  let x = ax;
  let y = ay;
  for (let i = 0; i <= Math.abs(dx); i++) {
    markWater(world, x, y);
    if (i < Math.abs(dx)) x = world.wrap(x + sx);
  }
  for (let i = 0; i <= Math.abs(dy); i++) {
    markWater(world, x, y);
    if (i < Math.abs(dy)) y = world.wrap(y + sy);
  }
}

function markWater(world: World, x: number, y: number): void {
  for (const [dx, dy] of [[0,0], [1,0], [-1,0], [0,1], [0,-1]] as const) {
    const idx = world.idx(x + dx, y + dy);
    if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) continue;
    world.cells[idx] = Cell.WATER;
    world.floorTex[idx] = Tex.F_WATER;
  }
}

function placeRoomFixtures(world: World, rooms: GreenhouseRooms): void {
  setFeature(world, rooms.pump.x + 12, rooms.pump.y + 10, Feature.MACHINE);
  setFeature(world, rooms.pump.x + rooms.pump.w - 14, rooms.pump.y + 12, Feature.APPARATUS);
  setFeature(world, rooms.waterBasin.x + 12, rooms.waterBasin.y + 10, Feature.SINK);
  setFeature(world, rooms.waterBasin.x + rooms.waterBasin.w - 13, rooms.waterBasin.y + 11, Feature.APPARATUS);
  setFeature(world, rooms.guardPost.x + 14, rooms.guardPost.y + 12, Feature.DESK);
  setFeature(world, rooms.marketStall.x + 12, rooms.marketStall.y + 16, Feature.TABLE);
  setFeature(world, rooms.seedVault.x + 10, rooms.seedVault.y + 12, Feature.SHELF);
  setFeature(world, rooms.seedVault.x + rooms.seedVault.w - 11, rooms.seedVault.y + 12, Feature.SHELF);
  setFeature(world, rooms.compost.x + 10, rooms.compost.y + 10, Feature.APPARATUS);
  setFeature(world, rooms.burnTrench.x + 10, rooms.burnTrench.y + 12, Feature.MACHINE);

  for (const room of Object.values(rooms)) {
    const c = roomCenter(room);
    setFeature(world, c.x, c.y, room.type === RoomType.STORAGE ? Feature.SHELF : Feature.LAMP);
  }
}

function stampGrowthFields(world: World, rooms: GreenhouseRooms): void {
  const splats = [
    { room: rooms.northRows, r: 46, g: 120, b: 52, radius: 24 },
    { room: rooms.southRows, r: 64, g: 132, b: 58, radius: 26 },
    { room: rooms.mushroomWard, r: 86, g: 88, b: 64, radius: 30 },
    { room: rooms.burnTrench, r: 130, g: 72, b: 38, radius: 18 },
    { room: rooms.compost, r: 70, g: 55, b: 38, radius: 16 },
  ] as const;
  for (let i = 0; i < splats.length; i++) {
    const c = roomCenter(splats[i].room);
    stampSurfaceSplat(world, c.x, c.y, 0.5, 0.5, splats[i].radius, 0.2, SEED + i * 901, splats[i].r, splats[i].g, splats[i].b, true);
  }
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) world.features[idx] = feature;
}

function placeLifts(world: World, entry: Room): void {
  placeLift(world, entry.x + 8, entry.y + 15, entry.x + 12, entry.y + 15, LiftDirection.UP);
  placeLift(world, entry.x + entry.w - 9, entry.y + 15, entry.x + entry.w - 13, entry.y + 15, LiftDirection.DOWN);
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(x, y);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.liftDir[li] = direction;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR || world.cells[bi] === Cell.WATER) world.features[bi] = Feature.LIFT_BUTTON;
  world.liftDir[bi] = direction;
}

function spawnNpcs(entities: Entity[], nextId: NextId, rooms: GreenhouseRooms): Record<GreenhouseNpcId, number> {
  return {
    oranzhereya_agronom_nadya: spawnPlotNpc(entities, nextId, 'oranzhereya_agronom_nadya', rooms.northRows, 8, Math.PI / 2),
    oranzhereya_irrigator_gleb: spawnPlotNpc(entities, nextId, 'oranzhereya_irrigator_gleb', rooms.pump, 7, 0),
    oranzhereya_guard_arsen: spawnPlotNpc(entities, nextId, 'oranzhereya_guard_arsen', rooms.guardPost, 5, Math.PI, 'makarov'),
    oranzhereya_market_sonya: spawnPlotNpc(entities, nextId, 'oranzhereya_market_sonya', rooms.marketStall, 4, -Math.PI / 2),
  };
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: NextId,
  npcId: GreenhouseNpcId,
  room: Room,
  salt: number,
  angle: number,
  weapon = NPC_DEFS[npcId].weapon,
): number {
  const def = NPC_DEFS[npcId];
  const pos = roomCell(room, salt);
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
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
    ai: { goal: AIGoal.IDLE, tx: pos.x + 0.5, ty: pos.y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: cloneInventory(def.inventory),
    weapon,
    faction: def.faction,
    occupation: def.occupation,
    assignedRoomId: room.id,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
    rpg: randomRPG(3),
  });
  return id;
}

function placeContainers(
  world: World,
  rooms: GreenhouseRooms,
  owners: Record<GreenhouseNpcId, number>,
): void {
  addContainer(world, rooms.northRows, 1, ContainerKind.FRIDGE, 'Общий ящик чистой зелени', [
    { defId: 'mushroom_mass', count: 3 },
    { defId: 'bread', count: 2 },
    { defId: 'filtered_water', count: 1 },
  ], ['harvest', 'food', 'clean_crop', 'resident_relief'], 'public');

  addContainer(world, rooms.southRows, 2, ContainerKind.FRIDGE, 'Стеллаж спорного урожая', [
    { defId: 'mushroom_mass', count: 2 },
    { defId: 'infected_mushroom', count: 2 },
    { defId: 'spore_print', count: 1 },
  ], ['harvest', 'fungal', 'risky_food', 'black_market_88'], 'room');

  addContainer(world, rooms.waterBasin, 3, ContainerKind.METAL_CABINET, 'Шкаф питательного басейна', [
    { defId: 'filtered_water', count: 2 },
    { defId: 'filter_layer', count: 1 },
    { defId: 'water_coupon', count: 1 },
  ], ['nutrient_basin', 'water', 'reroute', 'service'], 'faction', Faction.LIQUIDATOR, owners.oranzhereya_guard_arsen, NPC_DEFS.oranzhereya_guard_arsen.name);

  addContainer(world, rooms.pump, 4, ContainerKind.TOOL_LOCKER, 'Пломбированный шкаф вентилей', [
    { defId: 'valve_tag', count: 1 },
    { defId: 'pipe', count: 1 },
    { defId: 'wrench', count: 1 },
  ], ['water', 'reroute', 'repair', 'valve', 'service'], 'owner', Faction.CITIZEN, owners.oranzhereya_irrigator_gleb, NPC_DEFS.oranzhereya_irrigator_gleb.name);

  addContainer(world, rooms.seedVault, 5, ContainerKind.METAL_CABINET, 'Семенная кладовая под подпись', [
    { defId: 'substrate_sack', count: 2 },
    { defId: 'spore_print', count: 2 },
    { defId: 'rock_salt', count: 1 },
    { defId: 'ration_registry_extract', count: 1 },
  ], ['seed', 'food', 'evidence_drop', 'ration'], 'owner', Faction.SCIENTIST, owners.oranzhereya_agronom_nadya, NPC_DEFS.oranzhereya_agronom_nadya.name);

  addContainer(world, rooms.marketStall, 6, ContainerKind.SECRET_STASH, 'Форточка испорченной пайки', [
    { defId: 'acid_bottle', count: 1 },
    { defId: 'infected_mushroom', count: 3 },
    { defId: 'forged_ration_card', count: 1 },
  ], ['black_market_88', 'sabotage_drop', 'poison_crop', 'contraband', 'secret'], 'secret', Faction.WILD, owners.oranzhereya_market_sonya, NPC_DEFS.oranzhereya_market_sonya.name);

  addContainer(world, rooms.burnTrench, 7, ContainerKind.TOOL_LOCKER, 'Прожиговый аварийный ящик', [
    { defId: 'ammo_fuel', count: 1 },
    { defId: 'gasmask_filter', count: 1 },
    { defId: 'cleaning_kit', count: 1 },
  ], ['burn_infestation', 'cleanup', 'fungus_counterplay', 'liquidator'], 'faction', Faction.LIQUIDATOR, owners.oranzhereya_guard_arsen, NPC_DEFS.oranzhereya_guard_arsen.name);

  addContainer(world, rooms.compost, 8, ContainerKind.TRASH_BIN, 'Компостная яма недостачи', [
    { defId: 'infected_mushroom', count: 1 },
    { defId: 'grey_briquette', count: 2 },
    { defId: 'rock_salt', count: 1 },
  ], ['compost', 'food', 'theft', 'samosbor'], 'room');
}

function addContainer(
  world: World,
  room: Room,
  salt: number,
  kind: ContainerKind,
  name: string,
  inventory: readonly Item[],
  tags: readonly string[],
  access: WorldContainer['access'],
  faction?: Faction,
  ownerNpcId?: number,
  ownerName?: string,
): WorldContainer {
  const pos = roomCell(room, salt);
  const idx = world.idx(pos.x, pos.y);
  setFeature(world, pos.x, pos.y, kind === ContainerKind.FRIDGE ? Feature.SINK : Feature.SHELF);
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: pos.x,
    y: pos.y,
    floor: ORANZHEREYA_BETONA_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[idx],
    kind,
    name,
    inventory: cloneInventory(inventory),
    capacitySlots: Math.max(6, inventory.length + 3),
    ownerNpcId,
    ownerName,
    faction,
    access,
    lockDifficulty: access === 'locked' ? 3 : undefined,
    discovered: access !== 'secret',
    tags: uniqueTags([CONTENT_TAG, ...tags]),
  };
  world.addContainer(container);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function placeDrops(entities: Entity[], nextId: NextId, rooms: GreenhouseRooms): void {
  dropItems(entities, nextId, rooms.northRows, ['mushroom_mass', 'mushroom_mass', 'water_coupon']);
  dropItems(entities, nextId, rooms.waterBasin, ['filtered_water', 'valve_tag']);
  dropItems(entities, nextId, rooms.mushroomWard, ['infected_mushroom', 'spore_print', 'substrate_sack']);
  dropItems(entities, nextId, rooms.burnTrench, ['rock_salt', 'ammo_fuel']);
}

function dropItems(entities: Entity[], nextId: NextId, room: Room, itemIds: readonly string[]): void {
  for (let i = 0; i < itemIds.length; i++) {
    const defId = itemIds[i];
    if (!ITEMS[defId]) continue;
    const pos = roomCell(room, i + 9);
    entities.push({
      id: nextId.v++,
      type: EntityType.ITEM_DROP,
      x: pos.x + 0.5,
      y: pos.y + 0.5,
      angle: 0,
      pitch: 0,
      alive: true,
      speed: 0,
      sprite: Spr.ITEM_DROP,
      inventory: [{ defId, count: 1 }],
    });
  }
}

function spawnThreats(world: World, entities: Entity[], nextId: NextId, rooms: GreenhouseRooms): void {
  spawnMonster(world, entities, nextId, MonsterKind.BORSHCHEVIK, rooms.burnTrench, 4, 3, 'Борщевик из прожиговой канавы');
  spawnMonster(world, entities, nextId, MonsterKind.SPORE_CARPET, rooms.mushroomWard, 7, 3, 'Споровый ковёр у стеллажа');
  spawnMonster(world, entities, nextId, MonsterKind.CHERNOSLIZ, rooms.waterBasin, 6, 3, 'Чернослиз питательного басейна');
  spawnMonster(world, entities, nextId, MonsterKind.POMOYNY_ROY, rooms.compost, 3, 2, 'Компостный рой');
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: NextId,
  kind: MonsterKind,
  room: Room,
  salt: number,
  level: number,
  name?: string,
): void {
  const def = MONSTERS[kind];
  const pos = roomCell(room, salt);
  const idx = world.idx(pos.x, pos.y);
  if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) return;
  const hp = Math.round(def.hp * (0.9 + level * 0.16));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (0.95 + level * 0.03),
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
  });
}

function roomCell(room: Room, salt: number): { x: number; y: number } {
  const iw = Math.max(1, room.w - 2);
  const ih = Math.max(1, room.h - 2);
  return {
    x: room.x + 1 + ((salt * 7) % iw),
    y: room.y + 1 + ((salt * 11) % ih),
  };
}

function cloneInventory(items: readonly Item[]): Item[] {
  return items.filter(item => !!ITEMS[item.defId]).map(item => ({ ...item }));
}

function uniqueTags(tags: readonly string[]): string[] {
  return tags.filter((tag, index) => tags.indexOf(tag) === index).slice(0, 12);
}

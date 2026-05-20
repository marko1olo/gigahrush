/* -- Design floor: Manhattan-like indoor crossroads ------------- */

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
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS, applyMonsterVariant } from '../../entities/monster';
import { Spr, monsterSpr } from '../../render/sprite_index';
import {
  calcZoneLevel,
  randomRPG,
  scaleMonsterHp,
  scaleMonsterSpeed,
} from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'manhattan_crossroads' as const;
export const MANHATTAN_CROSSROADS_Z = -8;
export const MANHATTAN_CROSSROADS_SEED = 9009;

const CENTER = W >> 1;
const DISTRICT_MIN = CENTER - 330;
const DISTRICT_MAX = CENTER + 330;
const AVENUE_WIDTH = 11;
const STREET_WIDTH = 9;
const SIDEWALK = 3;
const ROAD_TEX = Tex.DARK;
const SIDEWALK_TEX = Tex.F_CONCRETE;
const MARK_TEX = Tex.F_TILE;
const ROAD_WALL_TEX = Tex.CONCRETE;
const OVERPASS_TEX = Tex.F_TILE;
const UNDERPASS_TEX = Tex.F_CONCRETE;
const CROSSWALK_ROOM_NAME = 'Белая дорожная разметка';
const CONTROL_ROOM_NAME = 'Пост управления перекрестком';
const CARGO_ROOM_NAME = 'Гараж украденного груза';
const WRONG_TURN_ROOM_NAME = 'Съезд Неправильный поворот';
const SAFE_CURB_ROOM_NAME = 'Безопасный бордюр у зебры';
const TOLL_GATE_ROOM_NAME = 'Платная перемычка центральной зебры';
const AVENUE_CENTERS = [232, 344, 512, 680, 792] as const;
const STREET_CENTERS = [232, 344, 512, 680, 792] as const;
const CROSSROADS_TOLL_CROWD_CAP = 12;

type Axis = 'vertical' | 'horizontal';

interface RoadSpan {
  axis: Axis;
  center: number;
  from: number;
  to: number;
  width: number;
  name: string;
}

interface KeyRooms {
  control: Room;
  cargo: Room;
  wrongTurn: Room;
  safeCurb: Room;
  kiosk: Room;
  tollGate: Room;
}

interface CrossroadsNpcIds {
  militsiya: number;
  granny: number;
  dima: number;
  ksu: number;
}

export interface ManhattanCrossroadsDebugInfo {
  routeId: typeof DESIGN_FLOOR_ID;
  z: number;
  seed: number;
  junctions: readonly string[];
  blockers: readonly string[];
  questRooms: readonly string[];
  smokePath: string;
}

export const MANHATTAN_CROSSROADS_DEBUG: ManhattanCrossroadsDebugInfo = {
  routeId: DESIGN_FLOOR_ID,
  z: MANHATTAN_CROSSROADS_Z,
  seed: MANHATTAN_CROSSROADS_SEED,
  junctions: [
    '4-way: Central Ave / Main Cross at 512,512',
    'T-junction: Central Ave / Wrong-Turn Spur at 512,600',
    '4-way: West Ave / Main Cross at 344,512',
    '4-way: East Ave / Main Cross at 680,512',
    'outer grid: five avenues and five cross streets between 232..792',
  ],
  blockers: [
    'Wrong-turn spur has no western approach, so the 512,600 node reads as a three-approach junction.',
    'Cargo garage is locked/faction-owned and can be looted, fought over, or handled through Dima.',
    'Three barricaded intersections force alley, storefront and overpass detours instead of a single straight road.',
    'Central zebra has a locked toll gate; the player can steal a key under witnesses or use the overpass/underpass bypass.',
  ],
  questRooms: [CONTROL_ROOM_NAME, CARGO_ROOM_NAME, WRONG_TURN_ROOM_NAME, SAFE_CURB_ROOM_NAME, TOLL_GATE_ROOM_NAME],
  smokePath: 'Spawn on the south curb, choose the locked central toll gate or the east overpass bypass, cross two zebra markings, then reach the wrong-turn spur at 512,600.',
};

const ROAD_SPANS: readonly RoadSpan[] = [
  { axis: 'vertical', center: 232, from: DISTRICT_MIN, to: DISTRICT_MAX, width: AVENUE_WIDTH, name: 'Западная окраинная авеню' },
  { axis: 'vertical', center: 344, from: DISTRICT_MIN, to: DISTRICT_MAX, width: AVENUE_WIDTH, name: 'Западная авеню' },
  { axis: 'vertical', center: 512, from: DISTRICT_MIN, to: DISTRICT_MAX, width: AVENUE_WIDTH, name: 'Центральная авеню' },
  { axis: 'vertical', center: 680, from: DISTRICT_MIN, to: DISTRICT_MAX, width: AVENUE_WIDTH, name: 'Восточная авеню' },
  { axis: 'vertical', center: 792, from: DISTRICT_MIN, to: DISTRICT_MAX, width: AVENUE_WIDTH, name: 'Крайняя восточная авеню' },
  { axis: 'horizontal', center: 232, from: DISTRICT_MIN, to: DISTRICT_MAX, width: STREET_WIDTH, name: 'Северный въезд' },
  { axis: 'horizontal', center: 344, from: DISTRICT_MIN, to: DISTRICT_MAX, width: STREET_WIDTH, name: 'Северная улица' },
  { axis: 'horizontal', center: 512, from: DISTRICT_MIN, to: DISTRICT_MAX, width: STREET_WIDTH, name: 'Главный кросс' },
  { axis: 'horizontal', center: 680, from: DISTRICT_MIN, to: DISTRICT_MAX, width: STREET_WIDTH, name: 'Южная улица' },
  { axis: 'horizontal', center: 792, from: DISTRICT_MIN, to: DISTRICT_MAX, width: STREET_WIDTH, name: 'Южный объезд' },
  { axis: 'horizontal', center: 600, from: 512, to: DISTRICT_MAX, width: STREET_WIDTH, name: 'Съезд Неправильный поворот' },
];

const TRAFFIC_MILITSIYA: PlotNpcDef = {
  name: 'Сержант Оськин',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 175,
  maxHp: 175,
  money: 120,
  speed: 1.05,
  inventory: [
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 18 },
    { defId: 'fuse', count: 1 },
  ],
  talkLines: [
    'Перекресток мой. Не потому что я хочу, а потому что остальные считают полосы по трупам.',
    'Светофор не сломан, у него сгорела пара предохранителей. Вернешь питание - стрелка перестанет врать.',
    'На белые полосы наступай быстро. На черном асфальте шаги слышно дальше, чем надо.',
    'Центральная калитка платная не деньгами, а вниманием. Ключ лежит рядом, очередь тоже.',
  ],
  talkLinesPost: [
    'Свет снова мигает по уставу. Теперь страшно хотя бы ритмично.',
    'Если пойдешь по съезду с неверной стрелкой, не спорь с указателем вслух.',
  ],
};

const ZEBRA_GRANNY: PlotNpcDef = {
  name: 'Бабка Зебрина',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.HOUSEWIFE,
  sprite: Occupation.HOUSEWIFE,
  hp: 90,
  maxHp: 90,
  money: 18,
  speed: 0.58,
  inventory: [
    { defId: 'bread', count: 1 },
    { defId: 'water_coupon', count: 1 },
  ],
  talkLines: [
    'Я через эту зебру сорок лет хожу. Раньше машины боялись людей, теперь полосы боятся тени.',
    'Проводишь до Димы у киоска? Я медленная, зато помню, где асфальт проваливается.',
    'На середине не стой. Перекресток считает тех, кто задумался.',
  ],
  talkLinesPost: [
    'Дошли. Теперь я снова могу ругаться на дорогу с правильной стороны.',
    'Белая полоса не спасает. Просто на ней видно, кто бежит.',
  ],
};

const COURIER_DIMA: PlotNpcDef = {
  name: 'Дима Курьер',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 105,
  maxHp: 105,
  money: 75,
  speed: 1.35,
  inventory: [
    { defId: 'water', count: 1 },
    { defId: 'metal_sheet', count: 1 },
  ],
  talkLines: [
    'Доставка по авеню: если дошел, значит адрес был настоящий.',
    'Груз увели в гараж за южной зеброй. Два листа металла, документы и чужая наглость.',
    'Милиция держит центр, Ксю знает боковые стрелки. Я знаю только, где меня еще не били.',
  ],
  talkLinesPost: [
    'Металл вернулся. Теперь дверь снова можно убедить, что она броня.',
    'Бабку довел? Хорошо. На этой дороге старость быстрее пули не бегает.',
  ],
  talkQuestResponse: 'Бабка дошла. Я видел, как перекресток притворился вежливым.',
};

const ROAD_STALKER_KSU: PlotNpcDef = {
  name: 'Ксю Развязка',
  isFemale: true,
  faction: Faction.WILD,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 120,
  maxHp: 120,
  money: 64,
  speed: 1.2,
  inventory: [
    { defId: 'knife', count: 1 },
    { defId: 'lift_scheme', count: 1 },
    { defId: 'cigs', count: 2 },
  ],
  talkLines: [
    'В городе улица ведет к улице. Здесь улица ведет к этажу, если указатель врет красиво.',
    'Неверный съезд за восточной авеню открыт, но не любит свидетелей.',
    'Плати слухом, патроном или молчанием. Дорога всё равно возьмет сдачу.',
  ],
  talkLinesPost: [
    'Съезд увидел тебя и не забрал. Значит, сегодня ему хватило других.',
    'Если стрелка показывает вниз, проверь, не стоит ли она на потолке.',
  ],
};

registerSideQuest('crossroads_traffic_militsiya', TRAFFIC_MILITSIYA, [
  {
    id: 'crossroads_open_junction',
    giverNpcId: 'crossroads_traffic_militsiya',
    type: QuestType.FETCH,
    desc: 'Оськин: «Два предохранителя на пост. Починим светофор — центр станет проходом, а не мясорубкой.»',
    targetItem: 'fuse',
    targetCount: 2,
    rewardItem: 'ammo_9mm',
    rewardCount: 12,
    extraRewards: [{ defId: 'water', count: 1 }],
    relationDelta: 12,
    xpReward: 70,
    moneyReward: 80,
  },
]);

registerSideQuest('crossroads_zebra_granny', ZEBRA_GRANNY, [
  {
    id: 'crossroads_zebra_escort',
    giverNpcId: 'crossroads_zebra_granny',
    type: QuestType.TALK,
    desc: 'Зебрина: «Проведи меня через две зебры к Диме {dir}. Если остановишься на черном, дорога решит, что ты знак.»',
    targetNpcId: 'crossroads_courier_dima',
    rewardItem: 'bread',
    rewardCount: 1,
    extraRewards: [{ defId: 'water_coupon', count: 1 }],
    relationDelta: 8,
    xpReward: 45,
    moneyReward: 20,
  },
]);

registerSideQuest('crossroads_courier_dima', COURIER_DIMA, [
  {
    id: 'crossroads_stolen_cargo',
    giverNpcId: 'crossroads_courier_dima',
    type: QuestType.FETCH,
    desc: 'Дима: «Из гаража украли два листа металла. Верни груз или продай совесть дешевле дороги.»',
    targetItem: 'metal_sheet',
    targetCount: 2,
    rewardItem: 'filtered_water',
    rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 8 }],
    relationDelta: 10,
    xpReward: 60,
    moneyReward: 55,
  },
]);

registerSideQuest('crossroads_road_stalker_ksu', ROAD_STALKER_KSU, [
  {
    id: 'crossroads_wrong_turn',
    giverNpcId: 'crossroads_road_stalker_ksu',
    type: QuestType.VISIT,
    desc: 'Ксю: «Найди съезд с неправильной стрелкой {dir}. Не заходи глубоко, просто докажи, что дорога там есть.»',
    targetRoomName: WRONG_TURN_ROOM_NAME,
    rewardItem: 'lift_scheme',
    rewardCount: 1,
    extraRewards: [{ defId: 'cigs', count: 2 }],
    relationDelta: 7,
    xpReward: 50,
    moneyReward: 35,
  },
]);

function addLogicalRoom(
  world: World,
  name: string,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  floorTex: Tex,
  wallTex = ROAD_WALL_TEX,
): Room {
  const room: Room = {
    id: world.rooms.length,
    type,
    x: world.wrap(x),
    y: world.wrap(y),
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex,
    floorTex,
  };
  world.rooms[room.id] = room;
  return room;
}

function setOpenCell(world: World, x: number, y: number, floorTex: Tex, roomId: number): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.FLOOR;
  world.floorTex[ci] = floorTex;
  world.wallTex[ci] = ROAD_WALL_TEX;
  world.roomMap[ci] = roomId;
}

function carveRoadSpan(world: World, span: RoadSpan, roadRoomId: number, sidewalkRoomId: number): void {
  const half = Math.floor(span.width / 2);
  const y0 = Math.min(span.from, span.to);
  const y1 = Math.max(span.from, span.to);
  for (let n = y0; n <= y1; n++) {
    for (let o = -half - SIDEWALK; o <= half + SIDEWALK; o++) {
      const road = Math.abs(o) <= half;
      const x = span.axis === 'vertical' ? span.center + o : n;
      const y = span.axis === 'vertical' ? n : span.center + o;
      const ci = world.idx(x, y);
      if (!road && world.floorTex[ci] === ROAD_TEX) continue;
      setOpenCell(world, x, y, road ? ROAD_TEX : SIDEWALK_TEX, road ? roadRoomId : sidewalkRoomId);
    }
  }
}

function isRoadLikeRoom(world: World, roomId: number): boolean {
  const room = world.rooms[roomId];
  return room?.name === 'Асфальтовая сетка авеню'
    || room?.name === 'Бордюры и служебные края'
    || room?.name === CROSSWALK_ROOM_NAME;
}

function canRetuneStreetCell(world: World, ci: number): boolean {
  if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) return false;
  if (world.containerMap.has(ci)) return false;
  const roomId = world.roomMap[ci];
  return roomId < 0 || isRoadLikeRoom(world, roomId);
}

function setOpenCellSafe(world: World, x: number, y: number, floorTex: Tex, roomId: number): void {
  const ci = world.idx(x, y);
  if (!canRetuneStreetCell(world, ci)) return;
  const wasFloor = world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER;
  world.cells[ci] = Cell.FLOOR;
  world.floorTex[ci] = floorTex;
  world.wallTex[ci] = ROAD_WALL_TEX;
  world.roomMap[ci] = roomId;
  if (!wasFloor) world.features[ci] = Feature.NONE;
}

function carveRoadSpanSafe(world: World, span: RoadSpan, roadRoomId: number, sidewalkRoomId: number): void {
  const half = Math.floor(span.width / 2);
  const start = Math.min(span.from, span.to);
  const end = Math.max(span.from, span.to);
  for (let n = start; n <= end; n++) {
    for (let o = -half - SIDEWALK; o <= half + SIDEWALK; o++) {
      const road = Math.abs(o) <= half;
      const x = span.axis === 'vertical' ? span.center + o : n;
      const y = span.axis === 'vertical' ? n : span.center + o;
      setOpenCellSafe(world, x, y, road ? ROAD_TEX : SIDEWALK_TEX, road ? roadRoomId : sidewalkRoomId);
    }
  }
}

function carveOpenRect(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  floorTex: Tex,
  roomId: number,
  safe = false,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (safe) setOpenCellSafe(world, x + dx, y + dy, floorTex, roomId);
      else setOpenCell(world, x + dx, y + dy, floorTex, roomId);
    }
  }
}

function carveDiagonalPath(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  roomId: number,
  safe = false,
): void {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(ax + (bx - ax) * t);
    const y = Math.round(ay + (by - ay) * t);
    for (let dy = -width; dy <= width; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        if (dx * dx + dy * dy > width * width) continue;
        if (safe) setOpenCellSafe(world, x + dx, y + dy, floorTex, roomId);
        else setOpenCell(world, x + dx, y + dy, floorTex, roomId);
      }
    }
  }
}

function placeBarrierRect(world: World, x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (!canRetuneStreetCell(world, ci)) continue;
      if (world.cells[ci] !== Cell.FLOOR) continue;
      world.cells[ci] = Cell.WALL;
      world.wallTex[ci] = Tex.METAL;
      world.roomMap[ci] = -1;
      world.features[ci] = Feature.NONE;
    }
  }
}

function nearAnyCenter(v: number, centers: readonly number[], radius: number): boolean {
  for (const center of centers) {
    if (Math.abs(v - center) <= radius) return true;
  }
  return false;
}

function paintSurfaceRect(
  world: World,
  x: number,
  y: number,
  px0: number,
  py0: number,
  px1: number,
  py1: number,
  r: number,
  g: number,
  b: number,
  a: number,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  let cell = world.surfaceMap.get(ci);
  if (!cell) {
    cell = new Uint8Array(1024);
    world.surfaceMap.set(ci, cell);
  }
  const sx = Math.max(0, Math.min(15, px0));
  const ex = Math.max(0, Math.min(15, px1));
  const sy = Math.max(0, Math.min(15, py0));
  const ey = Math.max(0, Math.min(15, py1));
  for (let py = sy; py <= ey; py++) {
    for (let px = sx; px <= ex; px++) {
      const pi = (py * 16 + px) << 2;
      cell[pi] = r;
      cell[pi + 1] = g;
      cell[pi + 2] = b;
      cell[pi + 3] = Math.max(cell[pi + 3], a);
    }
  }
  world.surfaceVersion++;
}

function markLineCell(world: World, x: number, y: number, axis: Axis, markRoomId: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.floorTex[ci] = MARK_TEX;
  world.roomMap[ci] = markRoomId;
  if (!shouldPaintHighResMark(x, y)) return;
  if (axis === 'vertical') {
    paintSurfaceRect(world, x, y, 6, 0, 9, 15, 238, 238, 224, 235);
  } else {
    paintSurfaceRect(world, x, y, 0, 6, 15, 9, 238, 238, 224, 235);
  }
}

function shouldPaintHighResMark(x: number, y: number): boolean {
  const near = (cx: number, cy: number, r: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };
  return near(512, 512, 90) || near(512, 600, 76) || near(680, 512, 60);
}

function markCrosswalkCell(world: World, x: number, y: number, markRoomId: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.floorTex[ci] = MARK_TEX;
  world.roomMap[ci] = markRoomId;
  if (!shouldPaintHighResMark(x, y)) return;
  paintSurfaceRect(world, x, y, 0, 0, 15, 15, 244, 244, 232, 245);
}

function paintRoadDividers(world: World, markRoomId: number): void {
  for (const span of ROAD_SPANS) {
    const start = Math.min(span.from, span.to);
    const end = Math.max(span.from, span.to);
    for (let n = start; n <= end; n++) {
      if (((n - start) % 8) > 4) continue;
      const x = span.axis === 'vertical' ? span.center : n;
      const y = span.axis === 'vertical' ? n : span.center;
      markLineCell(world, x, y, span.axis, markRoomId);
    }
  }
}

function paintCrosswalkHorizontal(world: World, x0: number, y0: number, w: number, h: number, markRoomId: number): void {
  for (let dy = 0; dy < h; dy++) {
    if (dy % 2 !== 0) continue;
    for (let dx = 0; dx < w; dx++) markCrosswalkCell(world, x0 + dx, y0 + dy, markRoomId);
  }
}

function paintCrosswalkVertical(world: World, x0: number, y0: number, w: number, h: number, markRoomId: number): void {
  for (let dx = 0; dx < w; dx++) {
    if (dx % 2 !== 0) continue;
    for (let dy = 0; dy < h; dy++) markCrosswalkCell(world, x0 + dx, y0 + dy, markRoomId);
  }
}

function paintIntersectionCrosswalks(world: World, cx: number, cy: number, avenueWidth: number, streetWidth: number, markRoomId: number): void {
  const aw = Math.floor(avenueWidth / 2);
  const sw = Math.floor(streetWidth / 2);
  paintCrosswalkHorizontal(world, cx - aw, cy - sw - 9, avenueWidth, 7, markRoomId);
  paintCrosswalkHorizontal(world, cx - aw, cy + sw + 3, avenueWidth, 7, markRoomId);
  paintCrosswalkVertical(world, cx - aw - 9, cy - sw, 7, streetWidth, markRoomId);
  paintCrosswalkVertical(world, cx + aw + 3, cy - sw, 7, streetWidth, markRoomId);
}

function stampNamedRoom(
  world: World,
  name: string,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
    }
  }
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      world.floorTex[ci] = floorTex;
      world.roomMap[ci] = room.id;
    }
  }
  return room;
}

function placeDoor(world: World, room: Room, x: number, y: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.DOOR) return;
  world.cells[ci] = Cell.DOOR;
  world.wallTex[ci] = Tex.DOOR_METAL;
  world.doors.set(ci, {
    idx: ci,
    state: DoorState.CLOSED,
    roomA: room.id,
    roomB: -1,
    keyId: '',
    timer: 0,
  });
  room.doors.push(ci);
}

function connectRoomToStreet(world: World, room: Room, sidewalkRoomId: number): void {
  const probes: { doorX: number; doorY: number; outX: number; outY: number; dx: number; dy: number }[] = [];
  for (let dx = 1; dx < room.w - 1; dx++) {
    probes.push({ doorX: room.x + dx, doorY: room.y - 1, outX: room.x + dx, outY: room.y - 2, dx: 0, dy: -1 });
    probes.push({ doorX: room.x + dx, doorY: room.y + room.h, outX: room.x + dx, outY: room.y + room.h + 1, dx: 0, dy: 1 });
  }
  for (let dy = 1; dy < room.h - 1; dy++) {
    probes.push({ doorX: room.x - 1, doorY: room.y + dy, outX: room.x - 2, outY: room.y + dy, dx: -1, dy: 0 });
    probes.push({ doorX: room.x + room.w, doorY: room.y + dy, outX: room.x + room.w + 1, outY: room.y + dy, dx: 1, dy: 0 });
  }

  let best: typeof probes[number] | null = null;
  let bestPath: number[] = [];
  for (const probe of probes) {
    const path: number[] = [];
    let x = probe.outX;
    let y = probe.outY;
    for (let step = 0; step < 54; step++) {
      const ci = world.idx(x, y);
      if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] !== room.id) {
        if (!best || path.length < bestPath.length) {
          best = probe;
          bestPath = path.slice();
        }
        break;
      }
      if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) break;
      path.push(ci);
      x += probe.dx;
      y += probe.dy;
    }
  }
  if (!best) return;

  placeDoor(world, room, best.doorX, best.doorY);
  for (const ci of bestPath) {
    if (world.cells[ci] === Cell.LIFT) continue;
    world.cells[ci] = Cell.FLOOR;
    world.floorTex[ci] = SIDEWALK_TEX;
    world.roomMap[ci] = sidewalkRoomId;
  }
}

function connectRoomExit(
  world: World,
  room: Room,
  doorX: number,
  doorY: number,
  dx: number,
  dy: number,
  sidewalkRoomId: number,
): void {
  placeDoor(world, room, doorX, doorY);
  let x = doorX + dx;
  let y = doorY + dy;
  for (let step = 0; step < 46; step++) {
    const ci = world.idx(x, y);
    if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] !== room.id) break;
    if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) break;
    world.cells[ci] = Cell.FLOOR;
    world.floorTex[ci] = SIDEWALK_TEX;
    world.roomMap[ci] = sidewalkRoomId;
    x += dx;
    y += dy;
  }
}

function setFeatureIfFloor(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
}

function paintCrosswalkPlaza(world: World, markRoomId: number): void {
  for (let x = 480; x <= 544; x += 4) {
    for (let y = 492; y <= 532; y++) markCrosswalkCell(world, x, y, markRoomId);
  }
  for (let y = 480; y <= 544; y += 4) {
    for (let x = 492; x <= 532; x++) markCrosswalkCell(world, x, y, markRoomId);
  }
}

function carveServiceAlleys(world: World, sidewalkRoomId: number): void {
  carveDiagonalPath(world, 272, 658, 442, 542, 2, SIDEWALK_TEX, sidewalkRoomId);
  carveDiagonalPath(world, 586, 468, 748, 326, 2, SIDEWALK_TEX, sidewalkRoomId);
  carveDiagonalPath(world, 632, 620, 746, 704, 2, SIDEWALK_TEX, sidewalkRoomId);
  carveDiagonalPath(world, 304, 360, 454, 470, 1, SIDEWALK_TEX, sidewalkRoomId);
  for (const [x, y] of [[272, 658], [442, 542], [586, 468], [748, 326], [632, 620], [746, 704]] as const) {
    setFeatureIfFloor(world, x, y, Feature.LAMP);
  }
}

function carveOverpassBypass(world: World, sidewalkRoomId: number): void {
  carveOpenRect(world, 548, 438, 8, 158, OVERPASS_TEX, sidewalkRoomId);
  carveOpenRect(world, 506, 438, 50, 8, OVERPASS_TEX, sidewalkRoomId);
  carveOpenRect(world, 548, 586, 92, 8, OVERPASS_TEX, sidewalkRoomId);
  carveOpenRect(world, 632, 586, 8, 38, OVERPASS_TEX, sidewalkRoomId);
  for (let y = 444; y <= 588; y += 18) {
    setFeatureIfFloor(world, 546, y, Feature.LAMP);
    setFeatureIfFloor(world, 557, y, Feature.LAMP);
  }
  for (let x = 512; x <= 636; x += 18) setFeatureIfFloor(world, x, 586, Feature.LAMP);
}

function carveUnderpassTunnels(world: World, sidewalkRoomId: number): void {
  carveOpenRect(world, 292, 620, 212, 7, UNDERPASS_TEX, sidewalkRoomId);
  carveOpenRect(world, 494, 600, 7, 86, UNDERPASS_TEX, sidewalkRoomId);
  carveDiagonalPath(world, 500, 624, 650, 628, 2, UNDERPASS_TEX, sidewalkRoomId);
  carveOpenRect(world, 650, 626, 136, 7, UNDERPASS_TEX, sidewalkRoomId);
  for (const [x, y] of [[292, 623], [498, 604], [650, 628], [782, 628]] as const) {
    setFeatureIfFloor(world, x, y, Feature.SCREEN);
  }
}

function placeTrafficBarriers(world: World): void {
  placeBarrierRect(world, 356, 340, 42, 7);
  placeBarrierRect(world, 676, 286, 8, 42);
  placeBarrierRect(world, 220, 690, 42, 7);
  placeBarrierRect(world, 498, 502, 8, 20);
  placeBarrierRect(world, 518, 502, 8, 20);
}

function placeRoadDividerCover(world: World): void {
  for (const span of ROAD_SPANS) {
    const start = Math.min(span.from, span.to) + 18;
    const end = Math.max(span.from, span.to) - 18;
    for (let n = start; n <= end; n += 44) {
      if (span.axis === 'vertical' && nearAnyCenter(n, STREET_CENTERS, 18)) continue;
      if (span.axis === 'horizontal' && nearAnyCenter(n, AVENUE_CENTERS, 18)) continue;
      const x = span.axis === 'vertical' ? span.center - 3 : n;
      const y = span.axis === 'vertical' ? n : span.center - 3;
      setFeatureIfFloor(world, x, y, Feature.APPARATUS);
      if (n % 88 === 0) setFeatureIfFloor(world, span.axis === 'vertical' ? span.center + 3 : n, span.axis === 'vertical' ? n : span.center + 3, Feature.LAMP);
    }
  }
}

function paintRoadDividersForSpans(world: World, spans: readonly RoadSpan[], markRoomId: number): void {
  for (const span of spans) {
    const start = Math.min(span.from, span.to);
    const end = Math.max(span.from, span.to);
    for (let n = start; n <= end; n++) {
      if (((n - start) % 8) > 4) continue;
      const x = span.axis === 'vertical' ? span.center : n;
      const y = span.axis === 'vertical' ? n : span.center;
      markLineCell(world, x, y, span.axis, markRoomId);
    }
  }
}

function dressStreetMotifs(world: World, sidewalkRoomId: number, markRoomId: number): void {
  paintCrosswalkPlaza(world, markRoomId);
  carveServiceAlleys(world, sidewalkRoomId);
  carveOverpassBypass(world, sidewalkRoomId);
  carveUnderpassTunnels(world, sidewalkRoomId);
  placeTrafficBarriers(world);
  placeCentralTollGate(world);
  placeRoadDividerCover(world);
}

function logicalRoomByName(world: World, name: string, type: RoomType, floorTex: Tex, wallTex = ROAD_WALL_TEX): Room {
  const existing = world.rooms.find(room => room?.name === name);
  return existing ?? addLogicalRoom(world, name, type, 0, 0, W, W, floorTex, wallTex);
}

function canStampShellRoom(world: World, x: number, y: number, w: number, h: number): boolean {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR || world.containerMap.has(ci)) return false;
      const roomId = world.roomMap[ci];
      if (roomId >= 0 && !isRoadLikeRoom(world, roomId)) return false;
    }
  }
  return true;
}

function stampShellStorefronts(world: World, sidewalkRoomId: number, rng: () => number): void {
  const specs: readonly { name: string; type: RoomType; x: number; y: number; w: number; h: number; wall: Tex; floor: Tex }[] = [
    { name: 'Северная закрытая витрина', type: RoomType.STORAGE, x: 92, y: 118, w: 50, h: 28, wall: Tex.PANEL, floor: Tex.F_TILE },
    { name: 'Двор над западным тоннелем', type: RoomType.COMMON, x: 92, y: 404, w: 64, h: 42, wall: Tex.BRICK, floor: Tex.F_CONCRETE },
    { name: 'Лавка дорожных знаков', type: RoomType.STORAGE, x: 874, y: 302, w: 54, h: 30, wall: Tex.METAL, floor: Tex.F_TILE },
    { name: 'Пустая касса восточного блока', type: RoomType.OFFICE, x: 878, y: 548, w: 46, h: 26, wall: Tex.PANEL, floor: Tex.F_LINO },
    { name: 'Ночной продуктовый на объезде', type: RoomType.STORAGE, x: 718, y: 878, w: 62, h: 34, wall: Tex.PANEL, floor: Tex.F_TILE },
    { name: 'Южный гаражный карман', type: RoomType.STORAGE, x: 394, y: 884, w: 70, h: 36, wall: Tex.METAL, floor: Tex.F_CONCRETE },
    { name: 'Подсобка под ложной авеню', type: RoomType.PRODUCTION, x: 108, y: 748, w: 50, h: 30, wall: Tex.PIPE, floor: Tex.F_CONCRETE },
    { name: 'Офис дорожного старшего', type: RoomType.OFFICE, x: 846, y: 126, w: 52, h: 30, wall: Tex.CONCRETE, floor: Tex.F_LINO },
  ];

  for (const spec of specs) {
    if (!canStampShellRoom(world, spec.x, spec.y, spec.w, spec.h)) continue;
    const room = stampNamedRoom(world, spec.name, spec.type, spec.x, spec.y, spec.w, spec.h, spec.wall, spec.floor);
    connectRoomToStreet(world, room, sidewalkRoomId);
    const featureCount = 2 + Math.floor(rng() * 4);
    for (let i = 0; i < featureCount; i++) {
      const fx = room.x + 3 + Math.floor(rng() * Math.max(1, room.w - 6));
      const fy = room.y + 3 + Math.floor(rng() * Math.max(1, room.h - 6));
      setFeatureIfFloor(world, fx, fy, rng() < 0.45 ? Feature.SHELF : rng() < 0.75 ? Feature.TABLE : Feature.LAMP);
    }
  }
}

export function expandManhattanCrossroadsRouteShell(world: World, rng: () => number): void {
  const roadRoom = logicalRoomByName(world, 'Асфальтовая сетка авеню', RoomType.CORRIDOR, ROAD_TEX);
  const sidewalkRoom = logicalRoomByName(world, 'Бордюры и служебные края', RoomType.COMMON, SIDEWALK_TEX);
  const markRoom = logicalRoomByName(world, CROSSWALK_ROOM_NAME, RoomType.MEDICAL, MARK_TEX);
  const shellSpans: readonly RoadSpan[] = [
    { axis: 'vertical', center: 104, from: 32, to: W - 36, width: 9, name: 'Ложная западная авеню' },
    { axis: 'vertical', center: 232, from: 32, to: W - 36, width: 9, name: 'Западная окраинная авеню' },
    { axis: 'vertical', center: 344, from: 32, to: W - 36, width: AVENUE_WIDTH, name: 'Западная авеню' },
    { axis: 'vertical', center: 512, from: 32, to: W - 36, width: AVENUE_WIDTH, name: 'Центральная авеню' },
    { axis: 'vertical', center: 680, from: 32, to: W - 36, width: AVENUE_WIDTH, name: 'Восточная авеню' },
    { axis: 'vertical', center: 792, from: 32, to: W - 36, width: 9, name: 'Крайняя восточная авеню' },
    { axis: 'vertical', center: 920, from: 32, to: W - 36, width: 9, name: 'Ложная восточная авеню' },
    { axis: 'horizontal', center: 104, from: 32, to: W - 36, width: 7, name: 'Северный фальшобъезд' },
    { axis: 'horizontal', center: 232, from: 32, to: W - 36, width: STREET_WIDTH, name: 'Северный въезд' },
    { axis: 'horizontal', center: 344, from: 32, to: W - 36, width: STREET_WIDTH, name: 'Северная улица' },
    { axis: 'horizontal', center: 512, from: 32, to: W - 36, width: STREET_WIDTH, name: 'Главный кросс' },
    { axis: 'horizontal', center: 680, from: 32, to: W - 36, width: STREET_WIDTH, name: 'Южная улица' },
    { axis: 'horizontal', center: 792, from: 32, to: W - 36, width: STREET_WIDTH, name: 'Южный объезд' },
    { axis: 'horizontal', center: 920, from: 32, to: W - 36, width: 7, name: 'Нижний фальшобъезд' },
  ];

  for (const span of shellSpans) carveRoadSpanSafe(world, span, roadRoom.id, sidewalkRoom.id);
  paintRoadDividersForSpans(world, shellSpans, markRoom.id);
  for (const x of [104, 232, 512, 792, 920] as const) {
    for (const y of [104, 344, 680, 920] as const) paintIntersectionCrosswalks(world, x, y, AVENUE_WIDTH, STREET_WIDTH, markRoom.id);
  }
  carveDiagonalPath(world, 118, 768, 280, 634, 2, SIDEWALK_TEX, sidewalkRoom.id, true);
  carveDiagonalPath(world, 792, 256, 928, 418, 2, SIDEWALK_TEX, sidewalkRoom.id, true);
  placeBarrierRect(world, 910, 512, 46, 7);
  placeBarrierRect(world, 98, 676, 7, 46);
  stampShellStorefronts(world, sidewalkRoom.id, rng);
  for (const [x, y] of [[104, 104], [920, 104], [104, 920], [920, 920], [512, 920], [920, 512]] as const) {
    placeSignalCluster(world, x, y);
  }
}

function stampDistrictRooms(world: World, sidewalkRoomId: number): KeyRooms {
  const rooms = [
    stampNamedRoom(world, 'Квартальный блок у Западной авеню', RoomType.LIVING, 218, 224, 86, 72, Tex.PANEL, Tex.F_LINO),
    stampNamedRoom(world, 'Гаражи под северной улицей', RoomType.STORAGE, 382, 222, 74, 48, Tex.METAL, Tex.F_CONCRETE),
    stampNamedRoom(world, 'Лифтовой павильон северного квартала', RoomType.COMMON, 496, 224, 34, 22, Tex.CONCRETE, Tex.F_TILE),
    stampNamedRoom(world, 'Витринный блок западного квартала', RoomType.STORAGE, 250, 402, 58, 28, Tex.PANEL, Tex.F_TILE),
    stampNamedRoom(world, 'Аптека у северной зебры', RoomType.MEDICAL, 548, 390, 44, 24, Tex.PANEL, Tex.F_TILE),
    stampNamedRoom(world, 'Киоск у белой зебры', RoomType.STORAGE, 384, 540, 42, 22, Tex.METAL, Tex.F_TILE),
    stampNamedRoom(world, CONTROL_ROOM_NAME, RoomType.OFFICE, 474, 462, 28, 18, Tex.METAL, Tex.F_CONCRETE),
    stampNamedRoom(world, SAFE_CURB_ROOM_NAME, RoomType.COMMON, 604, 464, 38, 20, Tex.PANEL, Tex.F_TILE),
    stampNamedRoom(world, TOLL_GATE_ROOM_NAME, RoomType.OFFICE, 528, 526, 20, 12, Tex.METAL, Tex.F_CONCRETE),
    stampNamedRoom(world, CARGO_ROOM_NAME, RoomType.STORAGE, 548, 548, 50, 32, Tex.METAL, Tex.F_CONCRETE),
    stampNamedRoom(world, 'Сервисная светофора', RoomType.PRODUCTION, 622, 548, 34, 28, Tex.PIPE, Tex.F_CONCRETE),
    stampNamedRoom(world, 'Низкий тоннель под Восточной авеню', RoomType.CORRIDOR, 650, 626, 84, 14, Tex.PIPE, Tex.F_CONCRETE),
    stampNamedRoom(world, WRONG_TURN_ROOM_NAME, RoomType.CORRIDOR, 744, 614, 82, 16, Tex.CONCRETE, Tex.F_CONCRETE),
    stampNamedRoom(world, 'Дворовая кладовая дорожников', RoomType.STORAGE, 724, 708, 48, 36, Tex.PANEL, Tex.F_CONCRETE),
    stampNamedRoom(world, 'Магазин под эстакадой', RoomType.STORAGE, 676, 452, 48, 26, Tex.METAL, Tex.F_TILE),
    stampNamedRoom(world, 'Южный лифтовой вестибюль', RoomType.COMMON, 498, 782, 36, 24, Tex.CONCRETE, Tex.F_TILE),
    stampNamedRoom(world, 'Квартиры над Южной улицей', RoomType.LIVING, 222, 724, 86, 70, Tex.PANEL, Tex.F_LINO),
  ];

  for (const room of rooms) connectRoomToStreet(world, room, sidewalkRoomId);

  const control = rooms.find(r => r.name === CONTROL_ROOM_NAME)!;
  const cargo = rooms.find(r => r.name === CARGO_ROOM_NAME)!;
  const wrongTurn = rooms.find(r => r.name === WRONG_TURN_ROOM_NAME)!;
  const safeCurb = rooms.find(r => r.name === SAFE_CURB_ROOM_NAME)!;
  const kiosk = rooms.find(r => r.name === 'Киоск у белой зебры')!;
  const tollGate = rooms.find(r => r.name === TOLL_GATE_ROOM_NAME)!;
  const underpass = rooms.find(r => r.name === 'Низкий тоннель под Восточной авеню')!;
  connectRoomExit(world, underpass, underpass.x - 1, underpass.y + Math.floor(underpass.h / 2), -1, 0, sidewalkRoomId);
  connectRoomExit(world, underpass, underpass.x + underpass.w, underpass.y + Math.floor(underpass.h / 2), 1, 0, sidewalkRoomId);

  for (let dx = 3; dx < control.w - 3; dx += 5) setFeatureIfFloor(world, control.x + dx, control.y + 4, Feature.SCREEN);
  setFeatureIfFloor(world, control.x + 4, control.y + control.h - 3, Feature.DESK);
  setFeatureIfFloor(world, control.x + control.w - 5, control.y + control.h - 4, Feature.LAMP);

  for (let dx = 3; dx < cargo.w - 2; dx += 7) setFeatureIfFloor(world, cargo.x + dx, cargo.y + 3, Feature.SHELF);
  setFeatureIfFloor(world, cargo.x + cargo.w - 4, cargo.y + cargo.h - 4, Feature.MACHINE);
  setFeatureIfFloor(world, cargo.x + 5, cargo.y + cargo.h - 4, Feature.LAMP);

  for (let dx = 4; dx < wrongTurn.w - 4; dx += 8) {
    setFeatureIfFloor(world, wrongTurn.x + dx, wrongTurn.y + 3, Feature.SCREEN);
    setFeatureIfFloor(world, wrongTurn.x + dx, wrongTurn.y + wrongTurn.h - 4, Feature.LAMP);
  }
  setFeatureIfFloor(world, wrongTurn.x + wrongTurn.w - 4, wrongTurn.y + Math.floor(wrongTurn.h / 2), Feature.LIFT_BUTTON);
  setFeatureIfFloor(world, safeCurb.x + 4, safeCurb.y + 4, Feature.TABLE);
  setFeatureIfFloor(world, safeCurb.x + 8, safeCurb.y + 4, Feature.CHAIR);
  setFeatureIfFloor(world, kiosk.x + 4, kiosk.y + 4, Feature.SHELF);
  setFeatureIfFloor(world, kiosk.x + kiosk.w - 5, kiosk.y + 4, Feature.LAMP);
  setFeatureIfFloor(world, tollGate.x + 4, tollGate.y + 3, Feature.DESK);
  setFeatureIfFloor(world, tollGate.x + 9, tollGate.y + 3, Feature.SCREEN);
  setFeatureIfFloor(world, tollGate.x + 15, tollGate.y + 8, Feature.SHELF);
  for (let dx = 6; dx < underpass.w - 4; dx += 12) setFeatureIfFloor(world, underpass.x + dx, underpass.y + 4, Feature.LAMP);

  return { control, cargo, wrongTurn, safeCurb, kiosk, tollGate };
}

function placeCentralTollGate(world: World): void {
  const y = 536;
  for (let x = 504; x <= 520; x++) {
    const ci = world.idx(x, y);
    if (!canRetuneStreetCell(world, ci) || world.cells[ci] !== Cell.FLOOR) continue;
    world.cells[ci] = Cell.WALL;
    world.wallTex[ci] = Tex.METAL;
    world.roomMap[ci] = -1;
    world.features[ci] = Feature.NONE;
  }

  const doorIdx = world.idx(512, y);
  world.cells[doorIdx] = Cell.DOOR;
  world.wallTex[doorIdx] = Tex.DOOR_METAL;
  world.floorTex[doorIdx] = ROAD_TEX;
  world.doors.set(doorIdx, {
    idx: doorIdx,
    state: DoorState.LOCKED,
    roomA: -1,
    roomB: -1,
    keyId: 'key',
    timer: 0,
  });
  setFeatureIfFloor(world, 508, y - 2, Feature.SCREEN);
  setFeatureIfFloor(world, 516, y - 2, Feature.LAMP);
}

function placeSignalCluster(world: World, x: number, y: number): void {
  for (const [dx, dy] of [[-8, -8], [8, -8], [-8, 8], [8, 8]] as const) {
    setFeatureIfFloor(world, x + dx, y + dy, Feature.SCREEN);
    paintSurfaceRect(world, x + dx, y + dy, 4, 4, 11, 11, 215, 35, 25, 210);
  }
  for (const [dx, dy] of [[-10, 0], [10, 0], [0, -10], [0, 10]] as const) {
    setFeatureIfFloor(world, x + dx, y + dy, Feature.LAMP);
  }
}

function placeLift(world: World, x: number, y: number, dir: LiftDirection, buttonX: number, buttonY: number): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = dir;
  setFeatureIfFloor(world, buttonX, buttonY, Feature.LIFT_BUTTON);
}

function placeDistrictLifts(world: World): void {
  placeLift(world, 512, 223, LiftDirection.UP, 512, 247);
  placeLift(world, 516, 782, LiftDirection.DOWN, 516, 781);
  placeLift(world, 823, 622, LiftDirection.UP, 822, 622);
}

function applyZones(world: World): void {
  generateZones(world);
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CENTER, CENTER);
    zone.level = Math.max(2, Math.min(5, calcZoneLevel(zone.cx, zone.cy, FloorLevel.KVARTIRY) + (d < 150 ? 2 : 1)));
    if (d < 130) zone.faction = ZoneFaction.LIQUIDATOR;
    else if (zone.cx > CENTER + 120) zone.faction = ZoneFaction.WILD;
    else zone.faction = ZoneFaction.CITIZEN;
    zone.fogged = false;
    zone.hasLift = d < 280;
  }
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: { v: number },
  npcId: string,
  def: PlotNpcDef,
  x: number,
  y: number,
  angle = 0,
  extra?: Partial<Entity>,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
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
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
    ...extra,
  });
  return id;
}

function spawnAmbientNpc(
  entities: Entity[],
  nextId: { v: number },
  name: string,
  x: number,
  y: number,
  faction: Faction,
  occupation: Occupation,
  inventory: { defId: string; count: number }[] = [],
  weapon?: string,
): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: occupation === Occupation.HUNTER ? 1.15 : 1.0,
    sprite: occupation,
    name,
    isFemale: name.endsWith('а') || name.endsWith('я'),
    needs: freshNeeds(),
    hp: faction === Faction.LIQUIDATOR ? 135 : 85,
    maxHp: faction === Faction.LIQUIDATOR ? 135 : 85,
    money: 10 + Math.floor(Math.random() * 35),
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory.map(i => ({ ...i })),
    weapon,
    faction,
    occupation,
    isTraveler: true,
    questId: -1,
  });
}

function spawnCrossroadsNpcs(entities: Entity[], nextId: { v: number }, rooms: KeyRooms): CrossroadsNpcIds {
  const militsiya = spawnPlotNpc(
    entities,
    nextId,
    'crossroads_traffic_militsiya',
    TRAFFIC_MILITSIYA,
    rooms.control.x + 5,
    rooms.control.y + 10,
    Math.PI / 2,
    { weapon: 'makarov' },
  );
  const granny = spawnPlotNpc(
    entities,
    nextId,
    'crossroads_zebra_granny',
    ZEBRA_GRANNY,
    rooms.safeCurb.x + 8,
    rooms.safeCurb.y + 11,
    0,
    { spriteScale: 0.86 },
  );
  const dima = spawnPlotNpc(
    entities,
    nextId,
    'crossroads_courier_dima',
    COURIER_DIMA,
    rooms.kiosk.x + 8,
    rooms.kiosk.y + 10,
    Math.PI,
  );
  const ksu = spawnPlotNpc(
    entities,
    nextId,
    'crossroads_road_stalker_ksu',
    ROAD_STALKER_KSU,
    rooms.wrongTurn.x + 9,
    rooms.wrongTurn.y + 8,
    Math.PI,
    { weapon: 'knife' },
  );

  spawnAmbientNpc(entities, nextId, 'Патрульный у делителя', 512, 486, Faction.LIQUIDATOR, Occupation.HUNTER, [
    { defId: 'ammo_9mm', count: 5 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Патрульная у южной зебры', 528, 538, Faction.LIQUIDATOR, Occupation.HUNTER, [
    { defId: 'bandage', count: 1 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Торговец с бордюра', 398, 520, Faction.CITIZEN, Occupation.STOREKEEPER, [
    { defId: 'water', count: 1 },
    { defId: 'bread', count: 2 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Дорожный бродяга', 690, 600, Faction.WILD, Occupation.TRAVELER, [
    { defId: 'pipe', count: 1 },
  ]);
  spawnTollCrowd(entities, nextId);

  return { militsiya, granny, dima, ksu };
}

function spawnTollCrowd(entities: Entity[], nextId: { v: number }): void {
  const spots: readonly [number, number, Faction, Occupation, string][] = [
    [506, 542, Faction.CITIZEN, Occupation.TRAVELER, 'Очередник у платной зебры'],
    [509, 545, Faction.CITIZEN, Occupation.HOUSEWIFE, 'Женщина с талоном перехода'],
    [514, 544, Faction.CITIZEN, Occupation.STOREKEEPER, 'Кладовщик у турникета'],
    [518, 542, Faction.CITIZEN, Occupation.LOCKSMITH, 'Слесарь с пустым ключом'],
    [502, 532, Faction.LIQUIDATOR, Occupation.HUNTER, 'Ликвидатор очереди'],
    [522, 532, Faction.LIQUIDATOR, Occupation.HUNTER, 'Второй счетчик полос'],
    [532, 536, Faction.CITIZEN, Occupation.SECRETARY, 'Секретарь с квитанцией'],
    [536, 540, Faction.CITIZEN, Occupation.TRAVELER, 'Пассажир без сдачи'],
    [526, 546, Faction.WILD, Occupation.TRAVELER, 'Шепот из обхода'],
    [500, 548, Faction.CITIZEN, Occupation.COOK, 'Повар с хлебом в очереди'],
    [516, 550, Faction.CITIZEN, Occupation.TRAVELER, 'Молчаливый свидетель'],
    [510, 550, Faction.CITIZEN, Occupation.TRAVELER, 'Сосед с мокрым купоном'],
  ];
  for (let i = 0; i < Math.min(CROSSROADS_TOLL_CROWD_CAP, spots.length); i++) {
    const [x, y, faction, occupation, name] = spots[i];
    spawnAmbientNpc(entities, nextId, name, x, y, faction, occupation, [
      { defId: i % 3 === 0 ? 'water_coupon' : 'bread', count: 1 },
    ], faction === Faction.LIQUIDATOR ? 'makarov' : undefined);
  }
}

function nearestFloorCell(world: World, x: number, y: number): { x: number; y: number } {
  for (let r = 0; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const tx = world.wrap(x + dx);
        const ty = world.wrap(y + dy);
        const ci = world.idx(tx, ty);
        if (world.cells[ci] === Cell.FLOOR) return { x: tx, y: ty };
      }
    }
  }
  return { x: world.wrap(x), y: world.wrap(y) };
}

function spawnMonster(world: World, entities: Entity[], nextId: { v: number }, kind: MonsterKind, x: number, y: number, level: number): void {
  const pos = nearestFloorCell(world, x, y);
  const def = MONSTERS[kind];
  const hp = scaleMonsterHp(def.hp, level);
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, level),
    sprite: monsterSpr(kind),
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: CENTER, ty: CENTER, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
  };
  applyMonsterVariant(monster, FloorLevel.KVARTIRY, level >= 4);
  entities.push(monster);
}

function spawnRoadHazards(world: World, entities: Entity[], nextId: { v: number }, rooms: KeyRooms): void {
  spawnMonster(world, entities, nextId, MonsterKind.REBAR, rooms.cargo.x + rooms.cargo.w - 7, rooms.cargo.y + 8, 4);
  spawnMonster(world, entities, nextId, MonsterKind.REBAR, rooms.cargo.x + 8, rooms.cargo.y + rooms.cargo.h - 7, 4);
  spawnMonster(world, entities, nextId, MonsterKind.SHADOW, rooms.wrongTurn.x + rooms.wrongTurn.w - 12, rooms.wrongTurn.y + 8, 5);
  spawnMonster(world, entities, nextId, MonsterKind.NELYUD, 704, 602, 4);
  spawnMonster(world, entities, nextId, MonsterKind.EYE, 512, 600, 4);
}

function dropItem(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count = 1): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count }],
  });
}

function nextContainerId(world: World): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id) || world.containers.some(c => c.id === id)) id++;
  return id;
}

function addContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: WorldContainer['inventory'],
  tags: string[],
  owner?: { id?: number; name?: string; faction?: Faction },
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.addContainer({
    id: nextContainerId(world),
    x,
    y,
    floor: FloorLevel.KVARTIRY,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory: inventory.map(i => ({ ...i })),
    capacitySlots: Math.max(6, inventory.length + 3),
    ownerNpcId: owner?.id,
    ownerName: owner?.name,
    faction: owner?.faction,
    access,
    discovered: true,
    tags: [DESIGN_FLOOR_ID, 'future_design_floor', ...tags],
  });
  setFeatureIfFloor(world, x, y, Feature.SHELF);
}

function seedContainersAndDrops(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  rooms: KeyRooms,
  npcIds: CrossroadsNpcIds,
): void {
  addContainer(
    world,
    rooms.tollGate,
    rooms.tollGate.x + 13,
    rooms.tollGate.y + 7,
    ContainerKind.CASHBOX,
    'Касса платной перемычки',
    'owner',
    [
      { defId: 'key', count: 1 },
      { defId: 'water_coupon', count: 2 },
      { defId: 'cigs', count: 2 },
    ],
    ['toll', 'crowd_pressure', 'junction_key', 'theft'],
    { id: npcIds.militsiya, name: TRAFFIC_MILITSIYA.name, faction: Faction.LIQUIDATOR },
  );
  addContainer(
    world,
    rooms.cargo,
    rooms.cargo.x + rooms.cargo.w - 6,
    rooms.cargo.y + 5,
    ContainerKind.METAL_CABINET,
    'Шкаф украденного груза',
    'locked',
    [
      { defId: 'metal_sheet', count: 2 },
      { defId: 'water_coupon', count: 1 },
      { defId: 'voluntary_receipt', count: 1 },
    ],
    ['cargo', 'garage', 'theft', 'courier'],
    { id: npcIds.dima, name: COURIER_DIMA.name, faction: Faction.CITIZEN },
  );
  addContainer(
    world,
    rooms.control,
    rooms.control.x + rooms.control.w - 4,
    rooms.control.y + 5,
    ContainerKind.TOOL_LOCKER,
    'Светофорный щиток',
    'faction',
    [
      { defId: 'fuse', count: 1 },
      { defId: 'circuit_board', count: 1 },
      { defId: 'relay_diagram', count: 1 },
    ],
    ['junction_control', 'traffic_light', 'repair', 'liquidator'],
    { id: npcIds.militsiya, name: TRAFFIC_MILITSIYA.name, faction: Faction.LIQUIDATOR },
  );
  addContainer(
    world,
    rooms.kiosk,
    rooms.kiosk.x + rooms.kiosk.w - 5,
    rooms.kiosk.y + 5,
    ContainerKind.CASHBOX,
    'Касса дорожного киоска',
    'owner',
    [
      { defId: 'bread', count: 2 },
      { defId: 'filtered_water', count: 1 },
      { defId: 'cigs', count: 3 },
    ],
    ['kiosk', 'food', 'trade', 'theft'],
    { id: npcIds.granny, name: ZEBRA_GRANNY.name, faction: Faction.CITIZEN },
  );
  dropItem(entities, nextId, rooms.cargo.x + 7, rooms.cargo.y + rooms.cargo.h - 6, 'metal_sheet', 1);
  dropItem(entities, nextId, rooms.control.x + 6, rooms.control.y + 5, 'fuse', 1);
  dropItem(entities, nextId, rooms.wrongTurn.x + rooms.wrongTurn.w - 8, rooms.wrongTurn.y + 8, 'lift_scheme', 1);
}

function carveStreetGrid(world: World, roadRoomId: number, sidewalkRoomId: number, markRoomId: number): void {
  for (const span of ROAD_SPANS) carveRoadSpan(world, span, roadRoomId, sidewalkRoomId);
  paintRoadDividers(world, markRoomId);
  for (const x of AVENUE_CENTERS) {
    for (const y of STREET_CENTERS) paintIntersectionCrosswalks(world, x, y, AVENUE_WIDTH, STREET_WIDTH, markRoomId);
  }
  paintIntersectionCrosswalks(world, 512, 600, AVENUE_WIDTH, STREET_WIDTH, markRoomId);
  placeSignalCluster(world, 512, 512);
  placeSignalCluster(world, 512, 600);
  placeSignalCluster(world, 680, 512);
  placeSignalCluster(world, 344, 344);
  placeSignalCluster(world, 232, 680);
  dressStreetMotifs(world, sidewalkRoomId, markRoomId);
}

export function getManhattanCrossroadsDebugLines(): string[] {
  return [
    `[FLOOR] route=${MANHATTAN_CROSSROADS_DEBUG.routeId} z=${MANHATTAN_CROSSROADS_DEBUG.z} seed=${MANHATTAN_CROSSROADS_DEBUG.seed}`,
    ...MANHATTAN_CROSSROADS_DEBUG.junctions.map(j => `[FLOOR] junction ${j}`),
    ...MANHATTAN_CROSSROADS_DEBUG.blockers.map(b => `[FLOOR] blocker ${b}`),
    `[FLOOR] smoke ${MANHATTAN_CROSSROADS_DEBUG.smokePath}`,
  ];
}

export function generateManhattanCrossroadsDesignFloor(seed = MANHATTAN_CROSSROADS_SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };
    const roadRoom = addLogicalRoom(world, 'Асфальтовая сетка авеню', RoomType.CORRIDOR, DISTRICT_MIN, DISTRICT_MIN, DISTRICT_MAX - DISTRICT_MIN, DISTRICT_MAX - DISTRICT_MIN, ROAD_TEX);
    const sidewalkRoom = addLogicalRoom(world, 'Бордюры и служебные края', RoomType.COMMON, DISTRICT_MIN, DISTRICT_MIN, DISTRICT_MAX - DISTRICT_MIN, DISTRICT_MAX - DISTRICT_MIN, SIDEWALK_TEX);
    const markRoom = addLogicalRoom(world, CROSSWALK_ROOM_NAME, RoomType.MEDICAL, DISTRICT_MIN, DISTRICT_MIN, DISTRICT_MAX - DISTRICT_MIN, DISTRICT_MAX - DISTRICT_MIN, MARK_TEX);

    carveStreetGrid(world, roadRoom.id, sidewalkRoom.id, markRoom.id);
    const rooms = stampDistrictRooms(world, sidewalkRoom.id);
    placeDistrictLifts(world);

    const spawnX = 512.5;
    const spawnY = 772.5;
    ensureConnectivity(world, spawnX, spawnY);
    sanitizeDoors(world);
    applyZones(world);

    const npcIds = spawnCrossroadsNpcs(entities, nextId, rooms);
    seedContainersAndDrops(world, entities, nextId, rooms, npcIds);
    spawnRoadHazards(world, entities, nextId, rooms);

    world.bakeLights();
    return { world, entities, spawnX, spawnY };
  });
}

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
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { ITEMS, freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { Spr } from '../../render/sprite_index';
import { randomRPG } from '../../systems/rpg';
import {
  ensureConnectivity,
  generateZones,
  placeDoor,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'production_belt' as const;
export const PRODUCTION_BELT_ROUTE_Z = 12;
export const PRODUCTION_BELT_BASE_FLOOR = FloorLevel.MAINTENANCE;

const CONTENT_TAG = 'floor14_production_belt';

export interface ProductionBeltLineDef {
  id: string;
  factoryId: string;
  roomName: string;
  outputTags: readonly string[];
  state: 'repairable' | 'audited' | 'bad_batch';
}

export const PRODUCTION_BELT_FACTORY_LINES: readonly ProductionBeltLineDef[] = [
  {
    id: 'prod_restore_line',
    factoryId: 'metal_shop',
    roomName: 'Цех металла: линия восстановления',
    outputTags: ['tools', 'faction'],
    state: 'repairable',
  },
  {
    id: 'prod_charge_line',
    factoryId: 'utility_room',
    roomName: 'Диспетчерская зарядки: линия ячеек',
    outputTags: ['utility', 'room'],
    state: 'audited',
  },
  {
    id: 'prod_illegal_ammo',
    factoryId: 'illegal_ammo_smelter',
    roomName: 'Патронная плавильня: нелегальная смена',
    outputTags: ['ammo', 'weapon', 'illegal'],
    state: 'bad_batch',
  },
];

export const PRODUCTION_BELT_DEBUG_ENTRY = {
  routeId: DESIGN_FLOOR_ID,
  z: PRODUCTION_BELT_ROUTE_Z,
  baseFloor: PRODUCTION_BELT_BASE_FLOOR,
  spawnHint: 'Проходная смены 14',
} as const;

const FOREMAN_DEF: PlotNpcDef = {
  name: 'Галина Нормировщица',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.DIRECTOR,
  sprite: Occupation.DIRECTOR,
  hp: 165,
  maxHp: 165,
  money: 120,
  speed: 0.95,
  inventory: [
    { defId: 'ration_stamp_pad', count: 1 },
    { defId: 'water', count: 1 },
    { defId: 'bread', count: 1 },
  ],
  talkLines: [
    'Галина Нормировщица. Тут не завод, а ремень дома: остановится - наверху начнут грызть ведомость.',
    'Работа простая: держишь линию, не суешь руку в пресс, не называешь брак браком при аудиторе.',
    'Егор застрял между зарядкой и браком. Проведи его к проходной, пока роботы считают людей тарой.',
  ],
  talkLinesPost: [
    'Смена идет. Не идеально, но идеально тут выглядит только недостача.',
    'Выходные ящики под отчетом. Работай легально или воруй быстро.',
  ],
};

const MECHANIC_DEF: PlotNpcDef = {
  name: 'Рустам Обводной',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.MECHANIC,
  sprite: Occupation.MECHANIC,
  hp: 145,
  maxHp: 145,
  money: 80,
  speed: 1.0,
  inventory: [
    { defId: 'wrench', count: 1 },
    { defId: 'fuse', count: 2 },
    { defId: 'relay_diagram', count: 1 },
  ],
  talkLines: [
    'Рустам Обводной. Линию можно чинить, можно молиться на нее, можно воровать из нее. Первое дешевле.',
    'Две шестерни на восстановительный вал - и я сниму защиту с выходного шкафа по акту.',
    'Если слышишь писк зарядки, не беги на звук. Звук обычно уже бежит на тебя.',
  ],
  talkLinesPost: [
    'Вал держит. Теперь очередь наверху будет ругаться с полным ртом.',
    'Не трогай зеленую партию голыми руками. Она спорит с кожей.',
  ],
};

const WORKER_DEF: PlotNpcDef = {
  name: 'Егор Сменный',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.TURNER,
  sprite: Occupation.TURNER,
  hp: 115,
  maxHp: 115,
  money: 35,
  speed: 1.05,
  inventory: [
    { defId: 'metal_sheet', count: 1 },
    { defId: 'grey_briquette', count: 1 },
  ],
  talkLines: [
    'Егор Сменный. Квота опасная: зарядку гонят горячей, брак называют пайком, а нас - расходом.',
    'Укради энергоячейку из выходного шкафа. Без нее зарядка встанет на ревизию, а люди успеют уйти.',
    'Если Галина спросит, я шел не саботировать. Я шел жить.',
  ],
  talkLinesPost: [
    'Смена притормозила. Иногда саботаж - это просто тормоз, которого не дали инженеру.',
    'Не ешь зеленое из карантина. Даже если оно подписано как еда.',
  ],
};

const AUDITOR_DEF: PlotNpcDef = {
  name: 'Аудитор-БОТ 14',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 220,
  maxHp: 220,
  money: 160,
  speed: 0.8,
  inventory: [
    { defId: 'clean_health_cert', count: 1 },
    { defId: 'container_key_label', count: 1 },
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 8 },
  ],
  talkLines: [
    'Аудитор-БОТ 14. Партия хорошая, если акт говорит хорошая. Акт хороший, если партия молчит.',
    'Две зеленые единицы из карантина докажут брак. Или докажут вашу кражу. Формально это разные графы.',
    'Свидетелей рядом не требуется. Ревизия рядом всегда.',
  ],
  talkLinesPost: [
    'Брак записан. Теперь виновный будет найден из числа тех, кто еще не убежал.',
    'Справка чистая. Не значит, что чисты вы.',
  ],
};

let contentRegistered = false;

export function registerProductionBeltContent(): void {
  if (contentRegistered) return;
  contentRegistered = true;

  registerSideQuest('prod_foreman_galina', FOREMAN_DEF, [{
    id: 'prod_worker_escort',
    giverNpcId: 'prod_foreman_galina',
    type: QuestType.TALK,
    desc: 'Галина: «Найди Егора {dir} и доведи до проходной хотя бы словами. Если он пропадет, смену закроют вместе с людьми.»',
    targetNpcId: 'prod_worker_egor',
    rewardItem: 'water',
    rewardCount: 2,
    extraRewards: [{ defId: 'bread', count: 2 }],
    relationDelta: 10,
    xpReward: 50,
    moneyReward: 45,
  }]);

  registerSideQuest('prod_mechanic_rustam', MECHANIC_DEF, [{
    id: 'prod_restore_line',
    giverNpcId: 'prod_mechanic_rustam',
    type: QuestType.FETCH,
    desc: 'Рустам: «Две шестерни в восстановительный вал. Линия снова даст комплект, а не искры.»',
    targetItem: 'gear',
    targetCount: 2,
    rewardItem: 'door_kit',
    rewardCount: 1,
    extraRewards: [{ defId: 'wrench', count: 1 }],
    relationDelta: 14,
    xpReward: 70,
    moneyReward: 70,
  }]);

  registerSideQuest('prod_worker_egor', WORKER_DEF, [{
    id: 'prod_steal_crate',
    giverNpcId: 'prod_worker_egor',
    type: QuestType.FETCH,
    desc: 'Егор: «Вытащи энергоячейку из выходного шкафа зарядки. Без нее опасную смену остановит ревизия, а не похороны.»',
    targetItem: 'ammo_energy',
    targetCount: 1,
    rewardItem: 'fake_pass',
    rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 10 }],
    relationDelta: 6,
    xpReward: 60,
    moneyReward: 55,
  }]);

  registerSideQuest('prod_auditor_bot', AUDITOR_DEF, [{
    id: 'prod_bad_batch',
    giverNpcId: 'prod_auditor_bot',
    type: QuestType.FETCH,
    desc: 'Аудитор-БОТ 14: «Две зеленые единицы из карантина. Выдать наверх или списать - решит акт, не желудок.»',
    targetItem: 'green_briquette',
    targetCount: 2,
    rewardItem: 'clean_health_cert',
    rewardCount: 1,
    extraRewards: [{ defId: 'container_key_label', count: 1 }],
    relationDelta: 8,
    xpReward: 65,
    moneyReward: 90,
  }]);
}

registerProductionBeltContent();

interface ProductionBeltRooms {
  gate: Room;
  corridor: Room;
  foreman: Room;
  lockers: Room;
  metalLine: Room;
  loadingDock: Room;
  shelter: Room;
  chargeLine: Room;
  ammoLine: Room;
  quarantine: Room;
  auditOffice: Room;
  exitDock: Room;
}

function paintRoom(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const i = world.idx(room.x + dx, room.y + dy);
      if (world.cells[i] === Cell.WALL) world.wallTex[i] = wallTex;
    }
  }
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      world.floorTex[world.idx(room.x + dx, room.y + dy)] = floorTex;
    }
  }
}

function namedRoom(
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
  paintRoom(world, room, wallTex, floorTex);
  return room;
}

function buildRooms(world: World): ProductionBeltRooms {
  const corridor = namedRoom(world, RoomType.CORRIDOR, 430, 508, 138, 7, 'Транспортный коридор ленты 14', Tex.METAL, Tex.F_CONCRETE);
  const gate = namedRoom(world, RoomType.COMMON, 414, 508, 15, 7, 'Проходная смены 14', Tex.PANEL, Tex.F_LINO);
  const foreman = namedRoom(world, RoomType.OFFICE, 442, 496, 17, 11, 'Контора нормировщика', Tex.PANEL, Tex.F_LINO);
  const lockers = namedRoom(world, RoomType.STORAGE, 462, 496, 15, 11, 'Шкафчики ремонтной смены', Tex.METAL, Tex.F_CONCRETE);
  const metalLine = namedRoom(world, RoomType.PRODUCTION, 480, 490, 30, 17, PRODUCTION_BELT_FACTORY_LINES[0].roomName, Tex.PIPE, Tex.F_CONCRETE);
  const loadingDock = namedRoom(world, RoomType.STORAGE, 514, 496, 22, 11, 'Погрузочная рампа выхода', Tex.METAL, Tex.F_CONCRETE);
  const shelter = namedRoom(world, RoomType.COMMON, 540, 496, 19, 11, 'Комната ожидания смены', Tex.CONCRETE, Tex.F_LINO);
  const chargeLine = namedRoom(world, RoomType.PRODUCTION, 442, 516, 28, 14, PRODUCTION_BELT_FACTORY_LINES[1].roomName, Tex.PIPE, Tex.F_CONCRETE);
  const ammoLine = namedRoom(world, RoomType.PRODUCTION, 474, 516, 26, 14, PRODUCTION_BELT_FACTORY_LINES[2].roomName, Tex.METAL, Tex.F_CONCRETE);
  const quarantine = namedRoom(world, RoomType.STORAGE, 504, 516, 23, 12, 'Карантин брака: зеленая партия', Tex.ROTTEN, Tex.F_WATER);
  const auditOffice = namedRoom(world, RoomType.OFFICE, 531, 516, 18, 12, 'Пост аудита БОТ-14', Tex.MARBLE, Tex.F_TILE);
  const exitDock = namedRoom(world, RoomType.STORAGE, 569, 508, 17, 7, 'Выходной док подъемников', Tex.METAL, Tex.F_CONCRETE);

  for (const room of [gate, foreman, lockers, metalLine, loadingDock, shelter, chargeLine, ammoLine, quarantine, auditOffice, exitDock]) {
    placeDoor(world, room, corridor, '', false);
  }
  return {
    gate,
    corridor,
    foreman,
    lockers,
    metalLine,
    loadingDock,
    shelter,
    chargeLine,
    ammoLine,
    quarantine,
    auditOffice,
    exitDock,
  };
}

function placeLift(world: World, liftX: number, liftY: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(liftX, liftY);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.liftDir[li] = direction;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const i = world.idx(x, y);
  if (world.cells[i] === Cell.FLOOR || world.cells[i] === Cell.WATER) world.features[i] = feature;
}

function setHazardWater(world: World, x: number, y: number, fog = 120): void {
  const i = world.idx(x, y);
  if (world.cells[i] !== Cell.FLOOR) return;
  world.cells[i] = Cell.WATER;
  world.floorTex[i] = Tex.F_WATER;
  world.fog[i] = fog;
}

function productionProtectedMask(world: World): Uint8Array {
  const mask = new Uint8Array(W * W);
  for (const room of world.rooms) {
    for (let dy = 0; dy < room.h; dy++) {
      for (let dx = 0; dx < room.w; dx++) {
        mask[world.idx(room.x + dx, room.y + dy)] = 1;
      }
    }
  }
  for (const container of world.containers) mask[world.idx(container.x, container.y)] = 1;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.LIFT || world.features[i] === Feature.LIFT_BUTTON) mask[i] = 1;
  }
  return mask;
}

function rectTouchesMask(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, margin: number): boolean {
  for (let dy = -margin; dy < h + margin; dy++) {
    for (let dx = -margin; dx < w + margin; dx++) {
      if (mask[world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

function carveRectMasked(
  world: World,
  mask: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  roomId: number,
  floorTex: Tex,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const i = world.idx(x + dx, y + dy);
      if (mask[i]) continue;
      world.cells[i] = Cell.FLOOR;
      world.roomMap[i] = roomId;
      world.floorTex[i] = floorTex;
    }
  }
}

function wallRingMasked(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, wallTex: Tex): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) continue;
      const i = world.idx(x + dx, y + dy);
      if (mask[i]) continue;
      if (world.cells[i] === Cell.WALL || world.cells[i] === Cell.ABYSS) {
        world.cells[i] = Cell.WALL;
        world.wallTex[i] = wallTex;
        world.features[i] = Feature.NONE;
      }
    }
  }
}

function macroRoom(
  world: World,
  mask: Uint8Array,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
  margin = 2,
): Room | null {
  if (rectTouchesMask(world, mask, x, y, w, h, margin)) return null;
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
  world.rooms.push(room);
  carveRectMasked(world, mask, room.x, room.y, w, h, room.id, floorTex);
  wallRingMasked(world, mask, room.x, room.y, w, h, wallTex);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      mask[world.idx(room.x + dx, room.y + dy)] = 1;
    }
  }
  return room;
}

function macroCorridor(
  world: World,
  mask: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  floorTex: Tex,
): Room {
  const room: Room = {
    id: world.rooms.length,
    type: RoomType.CORRIDOR,
    x: world.wrap(x),
    y: world.wrap(y),
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex: Tex.METAL,
    floorTex,
  };
  world.rooms.push(room);
  carveRectMasked(world, mask, room.x, room.y, w, h, room.id, floorTex);
  wallRingMasked(world, mask, room.x, room.y, w, h, Tex.METAL);
  return room;
}

function connectRoomToLane(world: World, mask: Uint8Array, room: Room, laneY: number, floorTex: Tex): void {
  const cx = room.x + (room.w >> 1);
  if (room.y > laneY) {
    const y = laneY + 5;
    carveRectMasked(world, mask, cx - 1, y, 3, Math.max(1, room.y - y), -1, floorTex);
  } else {
    const y = room.y + room.h;
    carveRectMasked(world, mask, cx - 1, y, 3, Math.max(1, laneY - 4 - y), -1, floorTex);
  }
}

function placeWallBlock(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, wallTex: Tex): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const i = world.idx(x + dx, y + dy);
      if (mask[i] || world.cells[i] !== Cell.FLOOR) continue;
      world.cells[i] = Cell.WALL;
      world.roomMap[i] = -1;
      world.wallTex[i] = wallTex;
      world.features[i] = Feature.NONE;
    }
  }
}

function dressMachineIsland(world: World, room: Room, rng: () => number): void {
  for (let x = room.x + 3; x < room.x + room.w - 3; x += 5) {
    setFeature(world, x, room.y + 4, Feature.MACHINE);
    setFeature(world, x + 1, room.y + room.h - 5, Feature.APPARATUS);
  }
  setFeature(world, room.x + 3, room.y + room.h - 3, Feature.LAMP);
  setFeature(world, room.x + room.w - 4, room.y + 3, Feature.LAMP);
  if (rng() < 0.55) {
    world.stamp(room.x + (room.w >> 1), room.y + (room.h >> 1), 0.5, 0.5, 4 + rng() * 4, 0.16, room.id * 8191, 42, 46, 42, false);
  }
}

function dressStorageBay(world: World, room: Room, rng: () => number): void {
  for (let x = room.x + 2; x < room.x + room.w - 2; x += 4) setFeature(world, x, room.y + 2, Feature.SHELF);
  for (let y = room.y + 5; y < room.y + room.h - 2; y += 4) setFeature(world, room.x + room.w - 3, y, Feature.SHELF);
  setFeature(world, room.x + 3, room.y + room.h - 3, Feature.LAMP);
  if (rng() < 0.35) setFeature(world, room.x + (room.w >> 1), room.y + (room.h >> 1), Feature.TABLE);
}

function dressLoadingDock(world: World, room: Room): void {
  for (let x = room.x + 3; x < room.x + room.w - 3; x += 5) setFeature(world, x, room.y + room.h - 4, Feature.SHELF);
  setFeature(world, room.x + 4, room.y + 4, Feature.DESK);
  setFeature(world, room.x + room.w - 5, room.y + 4, Feature.LAMP);
}

function dressShiftGate(world: World, room: Room): void {
  setFeature(world, room.x + 2, room.y + 2, Feature.SCREEN);
  setFeature(world, room.x + room.w - 3, room.y + 2, Feature.DESK);
  setFeature(world, room.x + 2, room.y + room.h - 3, Feature.LAMP);
}

function dressScrapPocket(world: World, room: Room, rng: () => number): void {
  setFeature(world, room.x + 3, room.y + 3, Feature.SHELF);
  setFeature(world, room.x + room.w - 4, room.y + 3, Feature.MACHINE);
  for (let i = 0; i < 3; i++) {
    setHazardWater(world, room.x + 4 + Math.floor(rng() * Math.max(1, room.w - 8)), room.y + 5 + Math.floor(rng() * Math.max(1, room.h - 8)), 135);
  }
}

function addDockLoop(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, name: string): void {
  macroCorridor(world, mask, x, y, w, 5, `${name}: верхняя рампа`, Tex.F_CONCRETE);
  macroCorridor(world, mask, x, y + h - 5, w, 5, `${name}: нижняя рампа`, Tex.F_CONCRETE);
  macroCorridor(world, mask, x, y, 5, h, `${name}: левый разворот`, Tex.F_CONCRETE);
  macroCorridor(world, mask, x + w - 5, y, 5, h, `${name}: правый разворот`, Tex.F_CONCRETE);
}

function addLaneBlockages(world: World, mask: Uint8Array, laneY: number, xStart: number, xEnd: number, rng: () => number): void {
  for (let x = xStart + 46; x < xEnd - 24; x += 82) {
    if (x > 368 && x < 642 && laneY > 470 && laneY < 552) continue;
    if (rng() < 0.55) placeWallBlock(world, mask, x, laneY - 1, 4, 3, Tex.METAL);
    setFeature(world, x + 7, laneY - 3, Feature.MACHINE);
    setFeature(world, x + 9, laneY + 3, Feature.APPARATUS);
  }
}

function addSideRoomsForLane(world: World, mask: Uint8Array, laneY: number, row: number, rng: () => number): void {
  const xs = [108, 210, 312, 608, 710, 812];
  for (let n = 0; n < xs.length; n++) {
    const top = (row + n) % 2 === 0;
    const w = 22 + Math.floor(rng() * 12);
    const h = 13 + Math.floor(rng() * 8);
    const x = xs[n] + Math.floor(rng() * 18);
    const y = top ? laneY - h - 15 : laneY + 14;
    const motif = (row + n) % 4;
    const room = macroRoom(
      world,
      mask,
      motif === 0 ? RoomType.COMMON : motif === 1 ? RoomType.STORAGE : motif === 2 ? RoomType.OFFICE : RoomType.STORAGE,
      x,
      y,
      w,
      h,
      motif === 0 ? 'Машинный остров ленты 14' : motif === 1 ? 'Складская ячейка ленты 14' : motif === 2 ? 'Сменная будка контроля' : 'Карман лома у ленты',
      motif === 2 ? Tex.PANEL : Tex.METAL,
      motif === 2 ? Tex.F_LINO : Tex.F_CONCRETE,
    );
    if (!room) continue;
    connectRoomToLane(world, mask, room, laneY, Tex.F_CONCRETE);
    if (motif === 0) dressMachineIsland(world, room, rng);
    else if (motif === 1) dressStorageBay(world, room, rng);
    else if (motif === 2) dressShiftGate(world, room);
    else dressScrapPocket(world, room, rng);
  }
}

function addShiftGate(world: World, mask: Uint8Array, x: number, y: number): void {
  const room = macroRoom(world, mask, RoomType.COMMON, x - 7, y - 5, 14, 10, 'Сменный турникет ленты 14', Tex.PANEL, Tex.F_LINO, 1);
  if (room) dressShiftGate(world, room);
}

function addCatwalkBypass(world: World, mask: Uint8Array, x: number, y0: number, y1: number, name: string): void {
  macroCorridor(world, mask, x - 1, y0, 3, y1 - y0, name, Tex.F_TILE);
  macroCorridor(world, mask, x - 58, y0 + 124, 58, 3, `${name}: перемычка`, Tex.F_TILE);
  macroCorridor(world, mask, x, y0 + 352, 58, 3, `${name}: дальняя перемычка`, Tex.F_TILE);
  for (let y = y0 + 42; y < y1 - 28; y += 96) {
    setFeature(world, x, y, Feature.LAMP);
    if (y % 192 === 0) setFeature(world, x, y + 3, Feature.APPARATUS);
  }
}

export function expandProductionBeltGeometry(world: World, rng: () => number): void {
  const mask = productionProtectedMask(world);
  const laneYs = [150, 274, 398, 626, 750, 874];

  macroCorridor(world, mask, 72, 508, 342, 7, 'Левая подача проходной 14', Tex.F_CONCRETE);
  macroCorridor(world, mask, 586, 508, 366, 7, 'Правая выдача проходной 14', Tex.F_CONCRETE);

  for (let i = 0; i < laneYs.length; i++) {
    const y = laneYs[i];
    macroCorridor(world, mask, 56, y - 4, 912, 9, i % 2 === 0 ? 'Главный конвейерный пролет' : 'Обратная линия погрузки', Tex.F_CONCRETE);
  }

  for (const x of [128, 320, 704, 896]) {
    macroCorridor(world, mask, x - 2, 146, 5, 732, 'Вертикальный подъемник тары', Tex.F_CONCRETE);
  }

  addDockLoop(world, mask, 82, 204, 204, 214, 'Западная погрузочная петля');
  addDockLoop(world, mask, 738, 204, 204, 214, 'Восточная погрузочная петля');
  addDockLoop(world, mask, 82, 584, 204, 214, 'Нижняя петля грязной тары');
  addDockLoop(world, mask, 738, 584, 204, 214, 'Нижняя петля выдачи');

  addCatwalkBypass(world, mask, 382, 150, 876, 'Левый ремонтный мостик');
  addCatwalkBypass(world, mask, 642, 150, 876, 'Правый ремонтный мостик');

  for (let i = 0; i < laneYs.length; i++) {
    addLaneBlockages(world, mask, laneYs[i], 56, 968, rng);
    addSideRoomsForLane(world, mask, laneYs[i], i, rng);
  }
  for (const x of [128, 320, 704, 896]) {
    for (const y of [274, 398, 626, 750]) addShiftGate(world, mask, x, y);
  }

  const loadingRooms = [
    macroRoom(world, mask, RoomType.STORAGE, 116, 226, 58, 28, 'Док ручной приемки', Tex.METAL, Tex.F_CONCRETE),
    macroRoom(world, mask, RoomType.STORAGE, 850, 226, 58, 28, 'Док опломбированной выдачи', Tex.METAL, Tex.F_CONCRETE),
    macroRoom(world, mask, RoomType.STORAGE, 116, 698, 58, 28, 'Док возврата брака', Tex.METAL, Tex.F_CONCRETE),
    macroRoom(world, mask, RoomType.STORAGE, 850, 698, 58, 28, 'Док ночной погрузки', Tex.METAL, Tex.F_CONCRETE),
  ];
  for (const room of loadingRooms) if (room) dressLoadingDock(world, room);

  for (const spec of [
    { x: 344, y: 206 }, { x: 654, y: 326 }, { x: 344, y: 682 }, { x: 654, y: 806 },
  ]) {
    const room = macroRoom(world, mask, RoomType.STORAGE, spec.x, spec.y, 24, 16, 'Опасный карман ремонта', Tex.ROTTEN, Tex.F_CONCRETE);
    if (room) dressScrapPocket(world, room, rng);
  }

  world.markFogDirty();
}

function decorateLineRooms(world: World, rooms: ProductionBeltRooms): void {
  for (let dx = 2; dx < rooms.metalLine.w - 3; dx += 4) {
    setFeature(world, rooms.metalLine.x + dx, rooms.metalLine.y + 4, Feature.MACHINE);
    setFeature(world, rooms.metalLine.x + dx + 1, rooms.metalLine.y + 8, Feature.APPARATUS);
  }
  setFeature(world, rooms.metalLine.x + 4, rooms.metalLine.y + 12, Feature.LAMP);
  setFeature(world, rooms.metalLine.x + 17, rooms.metalLine.y + 12, Feature.LAMP);
  setFeature(world, rooms.metalLine.x + 25, rooms.metalLine.y + 4, Feature.SHELF);

  for (let dx = 2; dx < rooms.chargeLine.w - 3; dx += 3) {
    setFeature(world, rooms.chargeLine.x + dx, rooms.chargeLine.y + 3, Feature.APPARATUS);
    setFeature(world, rooms.chargeLine.x + dx, rooms.chargeLine.y + 8, Feature.MACHINE);
  }
  setFeature(world, rooms.chargeLine.x + 6, rooms.chargeLine.y + 6, Feature.LAMP);
  setFeature(world, rooms.chargeLine.x + 19, rooms.chargeLine.y + 6, Feature.LAMP);
  setHazardWater(world, rooms.chargeLine.x + 2, rooms.chargeLine.y + rooms.chargeLine.h - 2, 90);
  setHazardWater(world, rooms.chargeLine.x + 3, rooms.chargeLine.y + rooms.chargeLine.h - 2, 90);

  for (let dx = 2; dx < rooms.ammoLine.w - 2; dx += 4) {
    setFeature(world, rooms.ammoLine.x + dx, rooms.ammoLine.y + 3, Feature.MACHINE);
    setFeature(world, rooms.ammoLine.x + dx, rooms.ammoLine.y + 9, Feature.APPARATUS);
  }
  setFeature(world, rooms.ammoLine.x + 4, rooms.ammoLine.y + 6, Feature.LAMP);
  setFeature(world, rooms.ammoLine.x + 18, rooms.ammoLine.y + 6, Feature.LAMP);

  for (let dx = 2; dx < rooms.quarantine.w - 2; dx += 3) {
    setHazardWater(world, rooms.quarantine.x + dx, rooms.quarantine.y + 4, 160);
    setHazardWater(world, rooms.quarantine.x + dx, rooms.quarantine.y + 5, 180);
  }
  setFeature(world, rooms.quarantine.x + 3, rooms.quarantine.y + 2, Feature.APPARATUS);
  setFeature(world, rooms.quarantine.x + 17, rooms.quarantine.y + 2, Feature.SHELF);
  setFeature(world, rooms.quarantine.x + 10, rooms.quarantine.y + 9, Feature.LAMP);
  world.markFogDirty();

  for (let dx = 2; dx < rooms.loadingDock.w - 2; dx += 4) setFeature(world, rooms.loadingDock.x + dx, rooms.loadingDock.y + 5, Feature.SHELF);
  for (let dx = 2; dx < rooms.lockers.w - 2; dx += 3) setFeature(world, rooms.lockers.x + dx, rooms.lockers.y + 5, Feature.SHELF);
  setFeature(world, rooms.foreman.x + 3, rooms.foreman.y + 4, Feature.DESK);
  setFeature(world, rooms.foreman.x + 10, rooms.foreman.y + 4, Feature.SHELF);
  setFeature(world, rooms.foreman.x + 8, rooms.foreman.y + 8, Feature.LAMP);
  setFeature(world, rooms.auditOffice.x + 3, rooms.auditOffice.y + 4, Feature.DESK);
  setFeature(world, rooms.auditOffice.x + 9, rooms.auditOffice.y + 4, Feature.APPARATUS);
  setFeature(world, rooms.auditOffice.x + 12, rooms.auditOffice.y + 8, Feature.LAMP);
  setFeature(world, rooms.gate.x + 4, rooms.gate.y + 3, Feature.TABLE);
  setFeature(world, rooms.gate.x + 8, rooms.gate.y + 3, Feature.CHAIR);
  setFeature(world, rooms.gate.x + 11, rooms.gate.y + 3, Feature.LAMP);
  setFeature(world, rooms.shelter.x + 4, rooms.shelter.y + 4, Feature.TABLE);
  setFeature(world, rooms.shelter.x + 8, rooms.shelter.y + 4, Feature.CHAIR);
  setFeature(world, rooms.shelter.x + 13, rooms.shelter.y + 4, Feature.LAMP);
}

function roomCell(world: World, room: Room, salt: number): { x: number; y: number } {
  const iw = Math.max(1, room.w - 2);
  const ih = Math.max(1, room.h - 2);
  for (let a = 0; a < Math.max(8, room.w * room.h); a++) {
    const x = world.wrap(room.x + 1 + ((salt * 5 + a * 3) % iw));
    const y = world.wrap(room.y + 1 + ((salt * 7 + a * 5) % ih));
    const i = world.idx(x, y);
    if (world.roomMap[i] === room.id && (world.cells[i] === Cell.FLOOR || world.cells[i] === Cell.WATER)) return { x, y };
  }
  return { x: world.wrap(room.x + Math.floor(room.w / 2)), y: world.wrap(room.y + Math.floor(room.h / 2)) };
}

function cloneInventory(items: readonly { defId: string; count: number }[]): { defId: string; count: number }[] {
  return items.filter(i => !!ITEMS[i.defId]).map(i => ({ defId: i.defId, count: i.count }));
}

function spawnNpc(
  entities: Entity[],
  nextId: { v: number },
  plotNpcId: string,
  def: PlotNpcDef,
  room: Room,
  salt: number,
  angle: number,
  weapon?: string,
): number {
  const pos = roomCellForActor(room, salt);
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: pos.x,
    y: pos.y,
    angle,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: def.sprite,
    needs: freshNeeds(),
    hp: def.hp,
    maxHp: def.maxHp,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: cloneInventory(def.inventory),
    name: def.name,
    faction: def.faction,
    occupation: def.occupation,
    assignedRoomId: room.id,
    canGiveQuest: true,
    money: def.money,
    plotNpcId,
    isFemale: def.isFemale,
    weapon,
    rpg: randomRPG(3),
  });
  return id;
}

function roomCellForActor(room: Room, salt: number): { x: number; y: number } {
  const iw = Math.max(1, room.w - 2);
  const ih = Math.max(1, room.h - 2);
  return {
    x: room.x + 1 + ((salt * 5) % iw) + 0.5,
    y: room.y + 1 + ((salt * 7) % ih) + 0.5,
  };
}

function spawnMonster(
  entities: Entity[],
  nextId: { v: number },
  kind: MonsterKind,
  room: Room,
  salt: number,
  level: number,
): void {
  const def = MONSTERS[kind];
  const pos = roomCellForActor(room, salt);
  const hp = Math.round(def.hp * (1 + Math.max(0, level - 1) * 0.18));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x,
    y: pos.y,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: def.sprite,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
    phasing: kind === MonsterKind.SPIRIT,
  });
}

function dropItems(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  room: Room,
  itemIds: readonly string[],
): void {
  for (let n = 0; n < itemIds.length; n++) {
    const defId = itemIds[n];
    if (!ITEMS[defId]) continue;
    const pos = roomCell(world, room, n + 3);
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

function nextContainerId(world: World): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id) || world.containers.some(c => c.id === id)) id++;
  return id;
}

function uniqueTags(tags: readonly string[]): string[] {
  return tags.filter((tag, idx, all) => all.indexOf(tag) === idx);
}

function addContainer(
  world: World,
  room: Room,
  salt: number,
  kind: ContainerKind,
  name: string,
  inventory: readonly { defId: string; count: number }[],
  tags: readonly string[],
  access: WorldContainer['access'],
  faction?: Faction,
  ownerNpcId?: number,
  ownerName?: string,
  factoryId?: string,
): WorldContainer {
  const pos = roomCell(world, room, salt);
  setFeature(world, pos.x, pos.y, kind === ContainerKind.SAFE ? Feature.DESK : Feature.SHELF);
  const ci = world.idx(pos.x, pos.y);
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: pos.x,
    y: pos.y,
    floor: PRODUCTION_BELT_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory: cloneInventory(inventory),
    capacitySlots: Math.max(6, inventory.length + 3),
    ownerNpcId,
    ownerName,
    faction,
    access,
    lockDifficulty: access === 'locked' ? 3 : undefined,
    discovered: true,
    factoryId,
    tags: uniqueTags([CONTENT_TAG, ...tags]),
  };
  world.addContainer(container);
  return container;
}

function applyZoneRole(world: World, room: Room, faction: ZoneFaction, level: number): void {
  const zi = world.zoneMap[world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2))];
  const zone = world.zones[zi];
  if (zone) {
    zone.faction = faction;
    zone.level = Math.max(zone.level, level);
  }
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      world.factionControl[world.idx(room.x + dx, room.y + dy)] = faction;
    }
  }
}

function populateRooms(world: World, entities: Entity[], nextId: { v: number }, rooms: ProductionBeltRooms): void {
  const galinaId = spawnNpc(entities, nextId, 'prod_foreman_galina', FOREMAN_DEF, rooms.foreman, 1, Math.PI / 2);
  const rustamId = spawnNpc(entities, nextId, 'prod_mechanic_rustam', MECHANIC_DEF, rooms.metalLine, 2, Math.PI);
  const egorId = spawnNpc(entities, nextId, 'prod_worker_egor', WORKER_DEF, rooms.quarantine, 3, -Math.PI / 2);
  const auditorId = spawnNpc(entities, nextId, 'prod_auditor_bot', AUDITOR_DEF, rooms.auditOffice, 4, Math.PI, 'makarov');

  addContainer(world, rooms.metalLine, 1, ContainerKind.TOOL_LOCKER, 'Выходной шкаф восстановительной линии', [
    { defId: 'pipe', count: 1 },
    { defId: 'door_kit', count: 1 },
    { defId: 'metal_sheet', count: 2 },
  ], ['production_output', 'metal_shop', 'tools', 'faction', 'legal_output', 'theft'], 'owner', Faction.CITIZEN, galinaId, FOREMAN_DEF.name, 'metal_shop');

  addContainer(world, rooms.chargeLine, 2, ContainerKind.TOOL_LOCKER, 'Опломбированный ящик энергоячеек', [
    { defId: 'ammo_energy', count: 1 },
    { defId: 'fuse', count: 2 },
    { defId: 'relay_diagram', count: 1 },
  ], ['production_output', 'utility_room', 'utility', 'room', 'tech', 'theft'], 'owner', Faction.CITIZEN, rustamId, MECHANIC_DEF.name, 'utility_room');

  addContainer(world, rooms.ammoLine, 3, ContainerKind.WEAPON_CRATE, 'Серый ящик патронной смены', [
    { defId: 'ammo_9mm', count: 18 },
    { defId: 'ammo_fuel', count: 1 },
    { defId: 'metal_sheet', count: 1 },
  ], ['production_output', 'illegal_ammo_smelter', 'ammo', 'weapon', 'illegal', 'theft'], 'faction', Faction.WILD, egorId, WORKER_DEF.name, 'illegal_ammo_smelter');

  addContainer(world, rooms.quarantine, 4, ContainerKind.METAL_CABINET, 'Карантинный шкаф зеленой партии', [
    { defId: 'green_briquette', count: 4 },
    { defId: 'acid_bottle', count: 1 },
    { defId: 'filter_layer', count: 2 },
  ], ['quarantine', 'bad_batch', 'food', 'theft'], 'owner', Faction.CITIZEN, auditorId, AUDITOR_DEF.name);

  addContainer(world, rooms.lockers, 5, ContainerKind.TOOL_LOCKER, 'Открытые шкафчики смены', [
    { defId: 'gear', count: 2 },
    { defId: 'fuse', count: 1 },
    { defId: 'wrench', count: 1 },
    { defId: 'water', count: 1 },
  ], ['repair', 'public', 'shift'], 'public');

  addContainer(world, rooms.loadingDock, 6, ContainerKind.METAL_CABINET, 'Промежуточная тара погрузки', [
    { defId: 'grey_briquette', count: 3 },
    { defId: 'gasmask_filter', count: 1 },
    { defId: 'container_key_label', count: 1 },
  ], ['loading', 'public', 'food'], 'room', Faction.CITIZEN);

  dropItems(world, entities, nextId, rooms.lockers, ['gear', 'gear', 'fuse', 'circuit_board', 'water']);
  dropItems(world, entities, nextId, rooms.metalLine, ['metal_sheet', 'pipe', 'wrench', 'relay_diagram']);
  dropItems(world, entities, nextId, rooms.quarantine, ['green_briquette', 'green_briquette', 'acid_bottle']);
  dropItems(world, entities, nextId, rooms.shelter, ['bread', 'bandage', 'grey_briquette']);

  spawnMonster(entities, nextId, MonsterKind.REBAR, rooms.metalLine, 5, 3);
  spawnMonster(entities, nextId, MonsterKind.ROBOT, rooms.chargeLine, 6, 3);
  spawnMonster(entities, nextId, MonsterKind.ROBOT, rooms.chargeLine, 7, 3);
  spawnMonster(entities, nextId, MonsterKind.SBORKA, rooms.quarantine, 8, 2);
  spawnMonster(entities, nextId, MonsterKind.SBORKA, rooms.quarantine, 9, 2);
}

export function generateProductionBeltDesignFloor(): FloorGeneration {
  registerProductionBeltContent();

  const world = new World();
  world.wallTex.fill(Tex.METAL);
  world.floorTex.fill(Tex.F_CONCRETE);
  world.factionControl.fill(ZoneFaction.CITIZEN);

  const rooms = buildRooms(world);
  const spawnX = rooms.gate.x + 3.5;
  const spawnY = rooms.gate.y + 3.5;

  placeLift(world, rooms.corridor.x + 4, rooms.corridor.y - 1, rooms.corridor.x + 4, rooms.corridor.y, LiftDirection.UP);
  placeLift(world, rooms.corridor.x + rooms.corridor.w - 4, rooms.corridor.y + rooms.corridor.h, rooms.corridor.x + rooms.corridor.w - 4, rooms.corridor.y + rooms.corridor.h - 1, LiftDirection.DOWN);

  sanitizeDoors(world);
  ensureConnectivity(world, spawnX, spawnY);
  generateZones(world);

  applyZoneRole(world, rooms.gate, ZoneFaction.CITIZEN, 2);
  applyZoneRole(world, rooms.foreman, ZoneFaction.CITIZEN, 2);
  applyZoneRole(world, rooms.metalLine, ZoneFaction.CITIZEN, 3);
  applyZoneRole(world, rooms.chargeLine, ZoneFaction.LIQUIDATOR, 3);
  applyZoneRole(world, rooms.ammoLine, ZoneFaction.WILD, 4);
  applyZoneRole(world, rooms.quarantine, ZoneFaction.WILD, 4);
  applyZoneRole(world, rooms.auditOffice, ZoneFaction.LIQUIDATOR, 3);

  decorateLineRooms(world, rooms);

  const entities: Entity[] = [];
  const nextId = { v: 1 };
  populateRooms(world, entities, nextId, rooms);

  world.bakeLights();
  return { world, entities, spawnX, spawnY };
}

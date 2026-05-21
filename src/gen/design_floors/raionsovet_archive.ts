/* ── Design floor: Райсовет и Живой архив ───────────────────────
 * Standalone authored-floor slice. It is intentionally not wired into
 * FloorLevel/FloorRun here; an integrator can mount this route later.
 */

import {
  W, Cell, Tex, Feature, RoomType, LiftDirection, ContainerKind, DoorState,
  EntityType, AIGoal, Faction, Occupation, FloorLevel, QuestType, MonsterKind, ZoneFaction,
  type Entity, type GameState, type Room, type WorldContainer, type WorldEvent,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS, applyMonsterVariant } from '../../entities/monster';
import { Spr, monsterSpr } from '../../render/sprite_index';
import { publishEvent } from '../../systems/events';
import { calcZoneLevel, randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import {
  carveCorridor, ensureConnectivity, generateZones, placeDoor, placeDoorAt, protectRoom,
  roomExit, stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const RAIONSOVET_ARCHIVE_ROUTE_ID = 'raionsovet_archive' as const;
export const RAIONSOVET_ARCHIVE_Z = 22;
export const RAIONSOVET_ARCHIVE_DEBUG_SEED = 602006;

export const RAIONSOVET_ARCHIVE_META = {
  routeId: RAIONSOVET_ARCHIVE_ROUTE_ID,
  displayName: 'Райсовет и архив картотек',
  z: RAIONSOVET_ARCHIVE_Z,
  baseFloor: FloorLevel.MINISTRY,
  debugEntry: 'generateRaionsovetArchiveDesignFloor()',
} as const;

export interface RaionsovetArchiveDocument {
  id: string;
  itemId: string;
  title: string;
  routeId: string;
  accessTags: readonly string[];
  suspicion: number;
  legal: boolean;
  flag: string;
}

export const RAIONSOVET_ARCHIVE_DOCUMENTS: readonly RaionsovetArchiveDocument[] = [
  {
    id: 'doc_archive_floor_permit',
    itemId: 'archive_access_permit',
    title: 'Допуск к закрытой картотеке',
    routeId: RAIONSOVET_ARCHIVE_ROUTE_ID,
    accessTags: ['archive_entry', 'personal_file'],
    suspicion: 0,
    legal: true,
    flag: 'archive.permit.raionsovet_archive',
  },
  {
    id: 'doc_route_registry_morgue',
    itemId: 'elevator_access_order',
    title: 'Маршрутная бумага к моргу регистраций',
    routeId: 'registry_morgue',
    accessTags: ['route_permit', 'registry_morgue'],
    suspicion: 1,
    legal: true,
    flag: 'archive.permit.registry_morgue',
  },
  {
    id: 'doc_apartment_rights_card',
    itemId: 'personal_file_copy',
    title: 'Копия квартирного права',
    routeId: 'living',
    accessTags: ['apartment_rights', 'personal_file'],
    suspicion: 0,
    legal: true,
    flag: 'archive.card_swapped.living_shelf_17',
  },
  {
    id: 'doc_burned_shelf_act',
    itemId: 'record_exposure_notice',
    title: 'Акт о сожженной зараженной полке',
    routeId: RAIONSOVET_ARCHIVE_ROUTE_ID,
    accessTags: ['archive_burn_order', 'samosbor_record'],
    suspicion: 3,
    legal: true,
    flag: 'archive.shelf_burned.west_stack',
  },
  {
    id: 'doc_market_88_license',
    itemId: 'official_permit_slip',
    title: 'Лицензионный корешок рынка 88',
    routeId: 'black_market_88',
    accessTags: ['trade_license', 'market_88'],
    suspicion: 2,
    legal: true,
    flag: 'archive.market_license_state.licensed',
  },
  {
    id: 'doc_forged_archive_route',
    itemId: 'forged_stamp_sheet',
    title: 'Поддельная печать на архивный обход',
    routeId: RAIONSOVET_ARCHIVE_ROUTE_ID,
    accessTags: ['archive_entry', 'forged'],
    suspicion: 12,
    legal: false,
    flag: 'archive.permit.raionsovet_archive.forged',
  },
  {
    id: 'doc_stolen_apartment_card',
    itemId: 'stolen_archive_card',
    title: 'Краденая карточка квартирных прав',
    routeId: 'living',
    accessTags: ['apartment_rights', 'stolen'],
    suspicion: 9,
    legal: false,
    flag: 'archive.card_swapped.living_shelf_17.stolen',
  },
  {
    id: 'doc_false_market_license',
    itemId: 'fake_pass',
    title: 'Липовая рыночная лицензия',
    routeId: 'black_market_88',
    accessTags: ['trade_license', 'forged'],
    suspicion: 10,
    legal: false,
    flag: 'archive.market_license_state.forged',
  },
];

export interface RaionsovetArchiveAccessCheck {
  id: string;
  targetId: string;
  roomName: string;
  legalItemId: string;
  illegalItemId: string;
  legalFlag: string;
  illegalFlag: string;
  visibleEffect: string;
}

export const RAIONSOVET_ARCHIVE_ACCESS_CHECKS: readonly RaionsovetArchiveAccessCheck[] = [
  {
    id: 'access_living_shelf_legal',
    targetId: 'door_living_rights_front',
    roomName: 'Закрытые жилые полки',
    legalItemId: 'archive_access_permit',
    illegalItemId: 'forged_stamp_sheet',
    legalFlag: 'archive.permit.raionsovet_archive',
    illegalFlag: 'archive.permit.raionsovet_archive.forged',
    visibleEffect: 'Передняя дверь открывается законным допуском; черный вход открывается поддельной печатью.',
  },
  {
    id: 'access_market_license_safe',
    targetId: 'container_market_88_license_safe',
    roomName: 'Лицензионная ниша рынка 88',
    legalItemId: 'official_permit_slip',
    illegalItemId: 'fake_pass',
    legalFlag: 'archive.market_license_state.licensed',
    illegalFlag: 'archive.market_license_state.forged',
    visibleEffect: 'Лицензионный сейф дает чистый корешок или подозрительный липовый пропуск.',
  },
  {
    id: 'access_apartment_card_swap',
    targetId: 'container_living_rights_shelf',
    roomName: 'Полка квартирных прав',
    legalItemId: 'personal_file_copy',
    illegalItemId: 'stolen_archive_card',
    legalFlag: 'archive.card_swapped.living_shelf_17',
    illegalFlag: 'archive.card_swapped.living_shelf_17.stolen',
    visibleEffect: 'Карточка меняет владельца комнаты через поручение или через кражу из картотеки.',
  },
];

export function resolveRaionsovetArchiveAccess(documentItemId: string, targetId: string): {
  allowed: boolean;
  flag: string;
  suspicionDelta: number;
  legal: boolean;
} | null {
  const check = RAIONSOVET_ARCHIVE_ACCESS_CHECKS.find(c => c.targetId === targetId);
  if (!check) return null;
  if (documentItemId === check.legalItemId) {
    const doc = RAIONSOVET_ARCHIVE_DOCUMENTS.find(d => d.itemId === documentItemId && d.legal);
    return { allowed: true, flag: check.legalFlag, suspicionDelta: doc?.suspicion ?? 0, legal: true };
  }
  if (documentItemId === check.illegalItemId) {
    const doc = RAIONSOVET_ARCHIVE_DOCUMENTS.find(d => d.itemId === documentItemId && !d.legal);
    return { allowed: true, flag: check.illegalFlag, suspicionDelta: doc?.suspicion ?? 8, legal: false };
  }
  return { allowed: false, flag: 'archive.denied.missing_record', suspicionDelta: 1, legal: false };
}

export type RaionsovetArchiveEventKind =
  | 'permit_issued'
  | 'card_swapped'
  | 'shelf_burned'
  | 'market_license_changed'
  | 'archive_denied';

export function publishRaionsovetArchiveEvent(
  state: GameState,
  kind: RaionsovetArchiveEventKind,
  routeId: string,
  targetId: string,
  roomId?: number,
  zoneId?: number,
): WorldEvent {
  return publishEvent(state, {
    type: 'rumor_observed',
    floor: FloorLevel.MINISTRY,
    roomId,
    zoneId,
    targetName: targetId,
    severity: kind === 'shelf_burned' || kind === 'archive_denied' ? 4 : 3,
    privacy: kind === 'archive_denied' ? 'witnessed' : 'local',
    tags: ['archive', RAIONSOVET_ARCHIVE_ROUTE_ID, kind, routeId],
    data: { archiveEvent: kind, routeId, targetId },
  });
}

const LIDA_DEF: PlotNpcDef = {
  name: 'Лида Индексная',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 120, maxHp: 120, money: 70, speed: 0.75,
  inventory: [
    { defId: 'archive_access_permit', count: 1 },
    { defId: 'elevator_access_order', count: 1 },
    { defId: 'blank_form', count: 2 },
  ],
  talkLines: [
    'Маршрут не существует, пока я не поставила его в указатель у лифта.',
    'Два пустых бланка - и у вас будет допуск к закрытой картотеке.',
    'Кованая печать тоже открывает полку. Потом полка открывает дело на вас.',
    'Не подписывайте форму без адресата. В картотеке пустая графа быстро получает чужую фамилию.',
  ],
  talkLinesPost: [
    'Ваш маршрут внесен в журнал. В лифте держите ордер сверху, а не в кармане.',
    'Карточки любят аккуратных. Громких тут переписывают без очереди.',
  ],
};

const GRANDFATHER_DEF: PlotNpcDef = {
  name: 'Дед Бумажный',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.STOREKEEPER,
  sprite: Occupation.STOREKEEPER,
  hp: 140, maxHp: 140, money: 20, speed: 0.45,
  inventory: [
    { defId: 'personal_file_copy', count: 1 },
    { defId: 'passport_stub', count: 1 },
  ],
  talkLines: [
    'Я не старый. Я карточка, которую забыли вынуть из человека.',
    'Вернете краденую карточку — покажу, чья комната пережила самосбор.',
    'Если меня сдвинуть на полку, в комнате окажется другой жилец с правильной карточкой.',
    'Дело без обложки не принимается. Обложку берегите: по ней пропускают к полке.',
  ],
  talkLinesPost: [
    'Карточка легла не туда. Теперь квартира спорит с фамилией.',
    'Запомните: право на комнату тише ключа, зато проверяющий смотрит сначала в него.',
  ],
};

const FIRE_LIQUIDATOR_DEF: PlotNpcDef = {
  name: 'Инна Огневая',
  isFemale: true,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 240, maxHp: 240, money: 110, speed: 1.0,
  inventory: [
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 12 },
    { defId: 'record_exposure_notice', count: 1 },
  ],
  talkLines: [
    'Западные стеллажи заражены туманом. Бумага уже кашляет фамилиями.',
    'Принесете пропавшее дело — решим: сохранить запись или сжечь полку.',
    'Сохранить — значит рискнуть людьми. Сжечь — значит оставить людей без прав.',
    'Печатеед у огневой полки не сторож. Он санитар документа: ест лишних владельцев.',
  ],
  talkLinesPost: [
    'Полка дымится, но коридор стал тише.',
    'Если запись спасли, проверьте дверь. В журнале теперь лишнее имя, и проверяющий его найдет.',
  ],
};

const FALSE_HEIR_DEF: PlotNpcDef = {
  name: 'Гера Наследник',
  isFemale: false,
  faction: Faction.WILD,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 110, maxHp: 110, money: 160, speed: 1.05,
  inventory: [
    { defId: 'fake_pass', count: 1 },
    { defId: 'forged_stamp_sheet', count: 1 },
    { defId: 'ration_registry_extract', count: 1 },
  ],
  talkLines: [
    'Я наследую только пустые комнаты. Они не возражают, если бумага правильная.',
    'Рынок 88 любит лицензии, особенно те, которые никто не проверял утром.',
    'Принесите лист с печатью — сделаем так, будто торговля была всегда.',
    'Липовая лицензия открывает рынок и закрывает чей-то настоящий адрес.',
  ],
  talkLinesPost: [
    'Лицензия чистая на вид. Грязь спрятана в журнале.',
    'Если рынок спросит, я здесь не стоял. Если архив спросит, вы тоже.',
  ],
};

registerSideQuest('archive_lida_index', LIDA_DEF, [
  {
    id: 'archive_get_floor_permit',
    giverNpcId: 'archive_lida_index',
    type: QuestType.FETCH,
    desc: 'Лида Индексная: «Два пустых бланка - и дам допуск к закрытой картотеке и маршрутный ордер. Подписывать их будете не здесь.»',
    targetItem: 'blank_form',
    targetCount: 2,
    rewardItem: 'archive_access_permit',
    rewardCount: 1,
    extraRewards: [{ defId: 'elevator_access_order', count: 1 }],
    relationDelta: 10,
    xpReward: 70,
    moneyReward: 50,
  },
]);

registerSideQuest('archive_paper_grandfather', GRANDFATHER_DEF, [
  {
    id: 'archive_swap_card',
    giverNpcId: 'archive_paper_grandfather',
    type: QuestType.FETCH,
    desc: 'Дед Бумажный: «Принесите краденую карточку. Я покажу, кому теперь числится комната, и кто останется без строки.»',
    targetItem: 'stolen_archive_card',
    targetCount: 1,
    rewardItem: 'personal_file_copy',
    rewardCount: 1,
    extraRewards: [{ defId: 'passport_stub', count: 1 }],
    relationDelta: 12,
    xpReward: 80,
    moneyReward: 60,
  },
]);

registerSideQuest('archive_fire_liquidator', FIRE_LIQUIDATOR_DEF, [
  {
    id: 'archive_save_or_burn',
    giverNpcId: 'archive_fire_liquidator',
    type: QuestType.FETCH,
    desc: 'Инна Огневая: «Принесите пропавшее дело. Сохраним запись или сожжем зараженную полку по акту. Оба варианта вредят разным людям.»',
    targetItem: 'missing_record_file',
    targetCount: 1,
    rewardItem: 'record_exposure_notice',
    rewardCount: 1,
    extraRewards: [{ defId: 'siren_instruction', count: 1 }],
    relationDelta: 8,
    xpReward: 85,
    moneyReward: 100,
  },
]);

registerSideQuest('archive_false_heir', FALSE_HEIR_DEF, [
  {
    id: 'archive_market_license',
    giverNpcId: 'archive_false_heir',
    type: QuestType.FETCH,
    desc: 'Гера Наследник: «Лист с поддельной печатью превратим в лицензию для рынка 88. Почти чистую.»',
    targetItem: 'forged_stamp_sheet',
    targetCount: 1,
    rewardItem: 'official_permit_slip',
    rewardCount: 1,
    extraRewards: [{ defId: 'fake_pass', count: 1 }],
    relationDelta: 6,
    xpReward: 75,
    moneyReward: 130,
  },
]);

interface ArchiveRooms {
  waiting: Room;
  clerk: Room;
  catalog: Room;
  shelves: Room;
  stamp: Room;
  fire: Room;
  heir: Room;
  market: Room;
  checker: Room;
}

interface ArchivePoint {
  x: number;
  y: number;
}

function createArchiveRoom(
  world: World,
  id: number,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex = Tex.MARBLE,
  floorTex = Tex.F_PARQUET,
): Room {
  const room = stampRoom(world, id, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  return room;
}

function paintRoom(world: World, room: Room): void {
  protectRoom(world, room.x, room.y, room.w, room.h, room.wallTex, room.floorTex);
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.cells[ci] !== Cell.WALL) world.floorTex[ci] = room.floorTex;
      else world.wallTex[ci] = room.wallTex;
    }
  }
}

function setFeatureIfFloor(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
}

function setShelfWall(world: World, x: number, y: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.cells[ci] = Cell.WALL;
  world.wallTex[ci] = Tex.PANEL;
  world.features[ci] = Feature.NONE;
}

function isArchiveReserved(world: World, x: number, y: number): boolean {
  const ci = world.idx(x, y);
  return world.aptMask[ci] !== 0
    || world.cells[ci] === Cell.LIFT
    || world.containerMap.has(ci);
}

function carveArchiveCell(world: World, x: number, y: number, floorTex = Tex.F_MARBLE_TILE, roomId = -1): void {
  const ci = world.idx(x, y);
  if (isArchiveReserved(world, x, y) || world.cells[ci] === Cell.DOOR) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = roomId;
  world.floorTex[ci] = floorTex;
  world.features[ci] = Feature.NONE;
}

function carveArchiveBlock(world: World, x: number, y: number, w: number, h: number, floorTex = Tex.F_MARBLE_TILE): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) carveArchiveCell(world, x + dx, y + dy, floorTex);
  }
}

function carveArchiveDisc(world: World, cx: number, cy: number, r: number, floorTex = Tex.F_MARBLE_TILE): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r2) carveArchiveCell(world, cx + dx, cy + dy, floorTex);
    }
  }
}

function carveArchiveLine(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width = 1,
  floorTex = Tex.F_MARBLE_TILE,
): void {
  const sx = bx === ax ? 0 : bx > ax ? 1 : -1;
  const sy = by === ay ? 0 : by > ay ? 1 : -1;
  let x = ax;
  let y = ay;
  while (x !== bx) {
    carveArchiveDisc(world, x, y, width, floorTex);
    x += sx;
  }
  while (y !== by) {
    carveArchiveDisc(world, x, y, width, floorTex);
    y += sy;
  }
  carveArchiveDisc(world, x, y, width, floorTex);
}

function setArchiveWall(world: World, x: number, y: number, wallTex = Tex.PANEL): void {
  const ci = world.idx(x, y);
  if (isArchiveReserved(world, x, y) || world.cells[ci] === Cell.DOOR) return;
  world.cells[ci] = Cell.WALL;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = wallTex;
  world.features[ci] = Feature.NONE;
}

function frameArchiveArea(world: World, x: number, y: number, w: number, h: number, wallTex = Tex.MARBLE): void {
  for (let dx = -1; dx <= w; dx++) {
    setArchiveWall(world, x + dx, y - 1, wallTex);
    setArchiveWall(world, x + dx, y + h, wallTex);
  }
  for (let dy = 0; dy < h; dy++) {
    setArchiveWall(world, x - 1, y + dy, wallTex);
    setArchiveWall(world, x + w, y + dy, wallTex);
  }
}

function addArchiveGate(world: World, x: number, y: number, keyId = ''): void {
  const ci = world.idx(x, y);
  if (isArchiveReserved(world, x, y) || world.cells[ci] !== Cell.WALL) return;

  const l = world.cells[world.idx(x - 1, y)];
  const r = world.cells[world.idx(x + 1, y)];
  const u = world.cells[world.idx(x, y - 1)];
  const d = world.cells[world.idx(x, y + 1)];
  const floorH = (l === Cell.FLOOR || l === Cell.DOOR) && (r === Cell.FLOOR || r === Cell.DOOR);
  const floorV = (u === Cell.FLOOR || u === Cell.DOOR) && (d === Cell.FLOOR || d === Cell.DOOR);
  const wallH = l === Cell.WALL && r === Cell.WALL;
  const wallV = u === Cell.WALL && d === Cell.WALL;
  if ((!floorH || !wallV) && (!floorV || !wallH)) return;

  world.cells[ci] = Cell.DOOR;
  world.doors.set(ci, {
    idx: ci,
    state: keyId ? DoorState.LOCKED : DoorState.CLOSED,
    roomA: -1,
    roomB: -1,
    keyId,
    timer: 0,
  });
}

function connectArchiveRoomToPoint(world: World, room: Room, tx: number, ty: number, floorTex = Tex.F_MARBLE_TILE): void {
  const cx = room.x + Math.floor(room.w / 2);
  const cy = room.y + Math.floor(room.h / 2);
  const dx = world.delta(cx, tx);
  const dy = world.delta(cy, ty);
  let wx = cx;
  let wy = cy;
  let ox = cx;
  let oy = cy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    wy = cy;
    if (dx >= 0) {
      wx = room.x + room.w;
      ox = wx + 1;
    } else {
      wx = room.x - 1;
      ox = wx - 1;
    }
    oy = wy;
  } else {
    wx = cx;
    if (dy >= 0) {
      wy = room.y + room.h;
      oy = wy + 1;
    } else {
      wy = room.y - 1;
      oy = wy - 1;
    }
    ox = wx;
  }

  placeDoorAt(world, wx, wy, room.id);
  carveArchiveLine(world, ox, oy, tx, ty, 1, floorTex);
}

function decorateClerkBridge(world: World, x: number, y: number, len: number, horizontal: boolean): void {
  for (let i = 0; i < len; i += 6) {
    const px = horizontal ? x + i : x;
    const py = horizontal ? y : y + i;
    setFeatureIfFloor(world, px, py, Feature.DESK);
    setFeatureIfFloor(world, horizontal ? px : px + 1, horizontal ? py + 1 : py, Feature.SCREEN);
  }
}

function buildStackCanyon(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  vertical: boolean,
  rng: () => number,
): ArchivePoint[] {
  const bridges: ArchivePoint[] = [];
  carveArchiveBlock(world, x, y, w, h, Tex.F_PARQUET);
  frameArchiveArea(world, x, y, w, h, Tex.MARBLE);

  if (vertical) {
    const bridgeYs = [y + 32, y + Math.floor(h / 2), y + h - 34];
    for (let sx = x + 9; sx < x + w - 8; sx += 13) {
      for (let sy = y + 4; sy < y + h - 4; sy++) {
        const bridge = bridgeYs.some(by => Math.abs(sy - by) <= 2);
        if (!bridge && (sy + sx) % 47 > 2) setArchiveWall(world, sx, sy, Tex.PANEL);
      }
      if (rng() < 0.6) addArchiveGate(world, sx, y + 16 + Math.floor(rng() * Math.max(1, h - 32)), rng() < 0.25 ? 'archive_access_permit' : '');
    }
    for (const by of bridgeYs) {
      carveArchiveLine(world, x + 3, by, x + w - 4, by, 2, Tex.F_MARBLE_TILE);
      decorateClerkBridge(world, x + 8, by - 1, w - 16, true);
      bridges.push({ x: x + Math.floor(w / 2), y: by });
    }
  } else {
    const bridgeXs = [x + 42, x + Math.floor(w / 2), x + w - 44];
    for (let sy = y + 8; sy < y + h - 8; sy += 12) {
      for (let sx = x + 4; sx < x + w - 4; sx++) {
        const bridge = bridgeXs.some(bx => Math.abs(sx - bx) <= 2);
        if (!bridge && (sx + sy) % 53 > 2) setArchiveWall(world, sx, sy, Tex.PANEL);
      }
      if (rng() < 0.55) addArchiveGate(world, x + 20 + Math.floor(rng() * Math.max(1, w - 40)), sy, rng() < 0.2 ? 'forged_stamp_sheet' : '');
    }
    for (const bx of bridgeXs) {
      carveArchiveLine(world, bx, y + 3, bx, y + h - 4, 2, Tex.F_MARBLE_TILE);
      decorateClerkBridge(world, bx - 1, y + 8, h - 16, false);
      bridges.push({ x: bx, y: y + Math.floor(h / 2) });
    }
  }

  return bridges;
}

function buildArchiveLoop(world: World): ArchivePoint[] {
  const nodes: ArchivePoint[] = [
    { x: 142, y: 154 }, { x: 512, y: 154 }, { x: 884, y: 154 },
    { x: 884, y: 512 }, { x: 884, y: 864 }, { x: 512, y: 864 },
    { x: 142, y: 864 }, { x: 142, y: 512 },
  ];
  for (let i = 1; i < nodes.length; i++) {
    carveArchiveLine(world, nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y, 2, Tex.F_MARBLE_TILE);
  }
  carveArchiveLine(world, nodes[nodes.length - 1].x, nodes[nodes.length - 1].y, nodes[0].x, nodes[0].y, 2, Tex.F_MARBLE_TILE);

  carveArchiveLine(world, 256, 154, 256, 864, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 512, 154, 512, 864, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 768, 154, 768, 864, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 142, 256, 884, 256, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 142, 512, 884, 512, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 142, 768, 884, 768, 2, Tex.F_MARBLE_TILE);

  carveArchiveLine(world, 530, 464, 530, 154, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 530, 552, 530, 864, 2, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 512, 464, 142, 464, 1, Tex.F_MARBLE_TILE);
  carveArchiveLine(world, 568, 507, 884, 507, 1, Tex.F_MARBLE_TILE);
  return nodes;
}

function carveReadingPit(world: World, room: Room): void {
  const cx = room.x + Math.floor(room.w / 2);
  const cy = room.y + Math.floor(room.h / 2);
  const rx = Math.floor(room.w / 3);
  const ry = Math.floor(room.h / 3);
  for (let y = room.y + 5; y < room.y + room.h - 5; y++) {
    for (let x = room.x + 6; x < room.x + room.w - 6; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const bridge = Math.abs(x - cx) <= 2 || Math.abs(y - cy) <= 2;
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id || bridge) continue;
      world.cells[ci] = Cell.ABYSS;
      world.floorTex[ci] = Tex.F_ABYSS;
      world.features[ci] = Feature.NONE;
    }
  }
  for (let x = room.x + 8; x < room.x + room.w - 8; x += 12) {
    setFeatureIfFloor(world, x, room.y + 5, Feature.CHAIR);
    setFeatureIfFloor(world, x, room.y + room.h - 6, Feature.SHELF);
  }
  setFeatureIfFloor(world, cx - 3, cy, Feature.DESK);
  setFeatureIfFloor(world, cx + 3, cy, Feature.SCREEN);
  setFeatureIfFloor(world, room.x + 4, room.y + 4, Feature.CANDLE);
  setFeatureIfFloor(world, room.x + room.w - 5, room.y + room.h - 5, Feature.CANDLE);
}

function decorateVaultRoom(world: World, room: Room): void {
  for (let y = room.y + 4; y < room.y + room.h - 4; y += 5) {
    for (let x = room.x + 5; x < room.x + room.w - 5; x += 7) {
      setShelfWall(world, x, y);
      setFeatureIfFloor(world, x + 1, y, Feature.SHELF);
    }
  }
  setFeatureIfFloor(world, room.x + 3, room.y + 3, Feature.LAMP);
  setFeatureIfFloor(world, room.x + room.w - 4, room.y + room.h - 4, Feature.APPARATUS);
}

function decorateServiceLiftRoom(world: World, room: Room): void {
  const cx = room.x + Math.floor(room.w / 2);
  const cy = room.y + Math.floor(room.h / 2);
  placeFixedLift(world, cx, cy, LiftDirection.DOWN);
  for (let y = room.y + 5; y < room.y + room.h - 5; y += 7) {
    setFeatureIfFloor(world, room.x + 5, y, Feature.APPARATUS);
    setFeatureIfFloor(world, room.x + room.w - 6, y, Feature.MACHINE);
  }
  setFeatureIfFloor(world, cx - 5, cy, Feature.SCREEN);
  setFeatureIfFloor(world, cx + 5, cy, Feature.DESK);
}

function nextArchiveContainerId(world: World): { v: number } {
  return { v: world.containers.reduce((max, container) => Math.max(max, container.id), 0) + 1 };
}

export function expandRaionsovetArchiveGeometry(world: World, rng: () => number): void {
  paintNonRoomCells(world);
  const bridges = [
    ...buildStackCanyon(world, 78, 184, 286, 296, true, rng),
    ...buildStackCanyon(world, 660, 176, 286, 318, true, rng),
    ...buildStackCanyon(world, 158, 690, 410, 198, false, rng),
    ...buildStackCanyon(world, 182, 62, 658, 104, false, rng),
  ];
  const loopNodes = buildArchiveLoop(world);

  for (let i = 1; i < bridges.length; i++) {
    if (i % 2 === 0) carveArchiveLine(world, bridges[i - 1].x, bridges[i - 1].y, bridges[i].x, bridges[i].y, 1, Tex.F_MARBLE_TILE);
  }
  for (const node of loopNodes) setFeatureIfFloor(world, node.x, node.y, Feature.LAMP);

  const counterHall = createArchiveRoom(world, world.rooms.length, RoomType.OFFICE, 392, 418, 242, 36, 'Мост счетных окон', Tex.MARBLE, Tex.F_RED_CARPET);
  const westVault = createArchiveRoom(world, world.rooms.length, RoomType.STORAGE, 174, 288, 76, 56, 'Запечатанный ряд квартирных прав', Tex.METAL, Tex.F_CONCRETE);
  const eastVault = createArchiveRoom(world, world.rooms.length, RoomType.STORAGE, 778, 308, 72, 58, 'Восточный сейф личных дел', Tex.METAL, Tex.F_CONCRETE);
  const readingPit = createArchiveRoom(world, world.rooms.length, RoomType.COMMON, 372, 594, 278, 104, 'Читальный провал личных дел', Tex.MARBLE, Tex.F_PARQUET);
  const serviceLift = createArchiveRoom(world, world.rooms.length, RoomType.PRODUCTION, 706, 548, 88, 62, 'Служебный лифт документов', Tex.METAL, Tex.F_CONCRETE);

  connectArchiveRoomToPoint(world, counterHall, 530, 464, Tex.F_MARBLE_TILE);
  connectArchiveRoomToPoint(world, westVault, 256, 256, Tex.F_MARBLE_TILE);
  connectArchiveRoomToPoint(world, eastVault, 768, 256, Tex.F_MARBLE_TILE);
  connectArchiveRoomToPoint(world, readingPit, 530, 552, Tex.F_MARBLE_TILE);
  connectArchiveRoomToPoint(world, readingPit, 512, 768, Tex.F_MARBLE_TILE);
  connectArchiveRoomToPoint(world, serviceLift, 768, 512, Tex.F_MARBLE_TILE);

  for (const room of [counterHall, westVault, eastVault, readingPit, serviceLift]) paintRoom(world, room);
  for (let x = counterHall.x + 8; x < counterHall.x + counterHall.w - 8; x += 8) {
    setFeatureIfFloor(world, x, counterHall.y + 8, Feature.DESK);
    setFeatureIfFloor(world, x, counterHall.y + counterHall.h - 8, Feature.CHAIR);
  }
  setFeatureIfFloor(world, counterHall.x + 5, counterHall.y + 5, Feature.SCREEN);
  setFeatureIfFloor(world, counterHall.x + counterHall.w - 6, counterHall.y + 5, Feature.LAMP);

  decorateVaultRoom(world, westVault);
  decorateVaultRoom(world, eastVault);
  carveReadingPit(world, readingPit);
  decorateServiceLiftRoom(world, serviceLift);

  const nextContainerId = nextArchiveContainerId(world);
  addArchiveContainer(
    world, nextContainerId, westVault, westVault.x + westVault.w - 6, westVault.y + westVault.h - 6,
    ContainerKind.SAFE,
    'Пломбированный шкаф квартирного ряда',
    'locked',
    [
      { defId: 'personal_file_copy', count: 1 },
      { defId: 'stolen_archive_card', count: 1 },
      { defId: 'passport_stub', count: 1 },
    ],
    ['vault', 'apartment_rights', 'force_or_permit'],
    Faction.CITIZEN,
  );
  addArchiveContainer(
    world, nextContainerId, eastVault, eastVault.x + eastVault.w - 6, eastVault.y + 5,
    ContainerKind.FILING_CABINET,
    'Индекс вскрытых наследств',
    'faction',
    [
      { defId: 'missing_record_file', count: 1 },
      { defId: 'record_exposure_notice', count: 1 },
      { defId: 'ration_registry_extract', count: 1 },
    ],
    ['vault', 'expose_record', 'personal_file'],
    Faction.CITIZEN,
  );

  world.stamp(236, 318, 0.5, 0.5, 5, 0.45, 6021, 0.55, 0.09, 0.04, false);
  world.stamp(812, 338, 0.5, 0.5, 5, 0.35, 6022, 0.08, 0.12, 0.18, false);
  world.stamp(512, 646, 0.5, 0.5, 8, 0.22, 6023, 0.7, 0.68, 0.55, true);
}

function connectRoomToPoint(world: World, room: Room, tx: number, ty: number): void {
  const exit = roomExit(world, room, tx, ty);
  placeDoorAt(world, exit.wx, exit.wy, room.id);
  carveCorridor(world, exit.ox, exit.oy, tx, ty);
}

function placeFixedLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
  const bi = world.idx(x, y + (direction === LiftDirection.UP ? 1 : -1));
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

function addDrop(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count = 1): void {
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

function spawnArchiveNpc(
  entities: Entity[],
  nextId: { v: number },
  def: PlotNpcDef,
  plotNpcId: string,
  x: number,
  y: number,
  weapon?: string,
): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.PI,
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
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    weapon,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId,
    canGiveQuest: true,
    questId: -1,
  });
}

function spawnArchiveGuard(entities: Entity[], nextId: { v: number }, x: number, y: number): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.PI / 2,
    pitch: 0,
    alive: true,
    speed: 0.95,
    sprite: Occupation.HUNTER,
    name: 'Кислов Проверяющий',
    isFemale: false,
    needs: freshNeeds(),
    hp: 220,
    maxHp: 220,
    money: 45,
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 10 },
      { defId: 'denunciation', count: 1 },
    ],
    weapon: 'makarov',
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    questId: -1,
  });
}

function spawnArchiveMonster(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  x: number,
  y: number,
  kind: MonsterKind,
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  const ci = world.idx(x, y);
  const zoneId = world.zoneMap[ci];
  const zoneLevel = world.zones[zoneId]?.level ?? 1;
  const hp = scaleMonsterHp(def.hp, zoneLevel);
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, zoneLevel),
    sprite: monsterSpr(kind),
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(zoneLevel),
  };
  applyMonsterVariant(monster, FloorLevel.MINISTRY, true);
  entities.push(monster);
}

function addArchiveContainer(
  world: World,
  nextContainerId: { v: number },
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: WorldContainer['inventory'],
  tags: string[],
  faction?: Faction,
): void {
  world.addContainer({
    id: nextContainerId.v++,
    x,
    y,
    floor: FloorLevel.MINISTRY,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory,
    capacitySlots: 8,
    faction,
    access,
    lockDifficulty: access === 'locked' ? 5 : undefined,
    discovered: true,
    tags: [RAIONSOVET_ARCHIVE_ROUTE_ID, ...tags],
  });
}

function decorateArchive(world: World, rooms: ArchiveRooms): void {
  const { waiting, clerk, catalog, shelves, stamp, fire, heir, market, checker } = rooms;

  for (let x = waiting.x + 3; x < waiting.x + waiting.w - 3; x += 3) {
    setFeatureIfFloor(world, x, waiting.y + 4, Feature.CHAIR);
    setFeatureIfFloor(world, x, waiting.y + 8, Feature.CHAIR);
  }
  setFeatureIfFloor(world, waiting.x + 2, waiting.y + 2, Feature.SCREEN);
  setFeatureIfFloor(world, waiting.x + waiting.w - 3, waiting.y + 2, Feature.LAMP);

  for (let x = clerk.x + 2; x < clerk.x + clerk.w - 2; x++) setFeatureIfFloor(world, x, clerk.y + clerk.h - 3, Feature.DESK);
  for (let x = clerk.x + 4; x < clerk.x + clerk.w - 4; x += 5) setFeatureIfFloor(world, x, clerk.y + 2, Feature.SHELF);
  setFeatureIfFloor(world, clerk.x + 2, clerk.y + 2, Feature.LAMP);

  for (let x = catalog.x + 4; x < catalog.x + catalog.w - 2; x += 4) {
    for (let y = catalog.y + 2; y < catalog.y + catalog.h - 2; y++) {
      if ((y - catalog.y) % 5 === 0) continue;
      setShelfWall(world, x, y);
    }
  }
  setFeatureIfFloor(world, catalog.x + 2, catalog.y + 2, Feature.LAMP);
  setFeatureIfFloor(world, catalog.x + catalog.w - 3, catalog.y + catalog.h - 3, Feature.SCREEN);

  for (let x = shelves.x + 3; x < shelves.x + shelves.w - 2; x += 5) {
    for (let y = shelves.y + 2; y < shelves.y + shelves.h - 2; y++) {
      if ((y - shelves.y) % 6 === 0) continue;
      setShelfWall(world, x, y);
    }
  }
  setFeatureIfFloor(world, shelves.x + shelves.w - 3, shelves.y + 2, Feature.LAMP);
  world.stamp(shelves.x + 5, shelves.y + shelves.h - 5, 0.5, 0.5, 3, 0.65, 41, 0.7, 0.12, 0.05, false);

  for (let x = stamp.x + 3; x < stamp.x + stamp.w - 3; x += 4) setFeatureIfFloor(world, x, stamp.y + 3, Feature.DESK);
  setFeatureIfFloor(world, stamp.x + stamp.w - 4, stamp.y + stamp.h - 3, Feature.APPARATUS);
  setFeatureIfFloor(world, stamp.x + 2, stamp.y + stamp.h - 3, Feature.SHELF);

  for (let y = fire.y + 2; y < fire.y + fire.h - 2; y += 3) {
    setShelfWall(world, fire.x + 4, y);
    setShelfWall(world, fire.x + 10, y);
    setFeatureIfFloor(world, fire.x + fire.w - 3, y, Feature.CANDLE);
  }
  world.stamp(fire.x + 5, fire.y + 5, 0.5, 0.5, 4, 0.9, 17, 0.65, 0.08, 0.04, false);

  setFeatureIfFloor(world, heir.x + 3, heir.y + 3, Feature.DESK);
  setFeatureIfFloor(world, heir.x + heir.w - 3, heir.y + 3, Feature.CHAIR);
  setFeatureIfFloor(world, heir.x + 2, heir.y + heir.h - 3, Feature.SHELF);

  setFeatureIfFloor(world, market.x + 2, market.y + 2, Feature.SCREEN);
  setFeatureIfFloor(world, market.x + market.w - 3, market.y + 2, Feature.DESK);
  setFeatureIfFloor(world, market.x + market.w - 3, market.y + market.h - 3, Feature.SHELF);

  for (let x = checker.x + 2; x < checker.x + checker.w - 2; x++) setFeatureIfFloor(world, x, checker.y + checker.h - 3, Feature.DESK);
  setFeatureIfFloor(world, checker.x + checker.w - 3, checker.y + 2, Feature.LAMP);
}

function paintNonRoomCells(world: World): void {
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.WALL) {
      if (world.wallTex[i] === Tex.CONCRETE) world.wallTex[i] = Tex.MARBLE;
    } else if (world.roomMap[i] < 0) {
      world.floorTex[i] = Tex.F_MARBLE_TILE;
    }
  }
}

export function generateRaionsovetArchiveDesignFloor(): FloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };
  const nextContainerId = { v: 1 };

  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.MARBLE;
    world.floorTex[i] = Tex.F_MARBLE_TILE;
  }

  let roomId = 0;
  const waiting = createArchiveRoom(world, roomId++, RoomType.COMMON, 500, 500, 24, 14, 'Райсоветская очередь', Tex.MARBLE, Tex.F_RED_CARPET);
  const clerk = createArchiveRoom(world, roomId++, RoomType.OFFICE, 500, 487, 24, 12, 'Окна выдачи маршрутов');
  const catalog = createArchiveRoom(world, roomId++, RoomType.STORAGE, 525, 500, 22, 14, 'Каталожные коридоры', Tex.MARBLE, Tex.F_PARQUET);
  const shelves = createArchiveRoom(world, roomId++, RoomType.STORAGE, 548, 496, 20, 22, 'Закрытые жилые полки', Tex.PANEL, Tex.F_WOOD);
  const stamp = createArchiveRoom(world, roomId++, RoomType.OFFICE, 500, 515, 18, 12, 'Комната печатей');
  const fire = createArchiveRoom(world, roomId++, RoomType.STORAGE, 479, 500, 20, 14, 'Западные зараженные стеллажи', Tex.ROTTEN, Tex.F_CONCRETE);
  const heir = createArchiveRoom(world, roomId++, RoomType.OFFICE, 519, 515, 17, 12, 'Кабинет ложного наследника');
  const market = createArchiveRoom(world, roomId++, RoomType.OFFICE, 537, 515, 10, 12, 'Лицензионная ниша рынка 88');
  const checker = createArchiveRoom(world, roomId++, RoomType.HQ, 525, 487, 18, 12, 'Проверяющий пост');
  const rooms: ArchiveRooms = { waiting, clerk, catalog, shelves, stamp, fire, heir, market, checker };

  placeDoor(world, waiting, clerk, '', false);
  placeDoor(world, waiting, catalog, '', false);
  placeDoor(world, waiting, stamp, '', false);
  placeDoor(world, waiting, fire, '', false);
  placeDoor(world, stamp, heir, '', false);
  placeDoor(world, heir, market, '', false);
  placeDoor(world, catalog, checker, '', false);
  placeDoor(world, catalog, shelves, 'archive_access_permit', false);
  placeDoor(world, market, shelves, 'forged_stamp_sheet', false);

  connectRoomToPoint(world, waiting, 512, 464);
  connectRoomToPoint(world, waiting, 512, 552);
  carveCorridor(world, 512, 464, 530, 464);
  carveCorridor(world, 512, 552, 530, 552);
  placeFixedLift(world, 530, 464, LiftDirection.UP);
  placeFixedLift(world, 530, 552, LiftDirection.DOWN);

  for (const room of Object.values(rooms)) paintRoom(world, room);
  decorateArchive(world, rooms);
  paintNonRoomCells(world);
  ensureConnectivity(world, 512, 507);

  generateZones(world);
  for (const zone of world.zones) {
    zone.faction = zone.id % 5 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
    zone.level = Math.max(1, calcZoneLevel(zone.cx, zone.cy, FloorLevel.MINISTRY));
  }

  addArchiveContainer(
    world, nextContainerId, clerk, clerk.x + 3, clerk.y + 3,
    ContainerKind.FILING_CABINET,
    'Журнал законных маршрутов',
    'faction',
    [
      { defId: 'archive_access_permit', count: 1 },
      { defId: 'raionsovet_floor_pass', count: 1 },
      { defId: 'elevator_access_order', count: 1 },
      { defId: 'temp_pass', count: 1 },
    ],
    ['legal', 'route_permit', 'document'],
    Faction.CITIZEN,
  );
  addArchiveContainer(
    world, nextContainerId, catalog, catalog.x + 2, catalog.y + catalog.h - 3,
    ContainerKind.FILING_CABINET,
    'Служебная картотека квартирных прав',
    'faction',
    [
      { defId: 'stolen_archive_card', count: 1 },
      { defId: 'missing_record_file', count: 1 },
      { defId: 'passport_stub', count: 1 },
    ],
    ['apartment_rights', 'theft', 'personal_file'],
    Faction.CITIZEN,
  );
  addArchiveContainer(
    world, nextContainerId, shelves, shelves.x + shelves.w - 3, shelves.y + shelves.h - 3,
    ContainerKind.SAFE,
    'Сейф жилых полок',
    'locked',
    [
      { defId: 'personal_file_copy', count: 1 },
      { defId: 'permanent_pass', count: 1 },
      { defId: 'confiscation_warrant', count: 1 },
      { defId: 'record_exposure_notice', count: 1 },
    ],
    ['visible_consequence', 'locked', 'apartment_rights'],
    Faction.CITIZEN,
  );
  addArchiveContainer(
    world, nextContainerId, stamp, stamp.x + stamp.w - 3, stamp.y + stamp.h - 3,
    ContainerKind.SECRET_STASH,
    'Черный ящик подмененных печатей',
    'secret',
    [
      { defId: 'forged_stamp_sheet', count: 1 },
      { defId: 'forged_raionsovet_pass', count: 1 },
      { defId: 'fake_pass', count: 1 },
      { defId: 'ink_bottle', count: 2 },
    ],
    ['illegal', 'forgery', 'back_route'],
  );
  addArchiveContainer(
    world, nextContainerId, market, market.x + market.w - 3, market.y + market.h - 3,
    ContainerKind.CASHBOX,
    'Лицензионный сейф рынка 88',
    'locked',
    [
      { defId: 'official_permit_slip', count: 1 },
      { defId: 'debt_settlement_receipt', count: 1 },
      { defId: 'ration_registry_extract', count: 1 },
      { defId: 'fake_pass', count: 1 },
    ],
    ['market_88', 'trade_license', 'document'],
    Faction.WILD,
  );

  addDrop(entities, nextId, waiting.x + 3, waiting.y + 2, 'blank_form', 1);
  addDrop(entities, nextId, waiting.x + waiting.w - 4, waiting.y + waiting.h - 3, 'blank_form', 1);
  addDrop(entities, nextId, stamp.x + 2, stamp.y + stamp.h - 3, 'ink_bottle', 1);
  addDrop(entities, nextId, fire.x + 2, fire.y + 2, 'siren_instruction', 1);

  spawnArchiveNpc(entities, nextId, LIDA_DEF, 'archive_lida_index', clerk.x + 5, clerk.y + clerk.h - 4);
  spawnArchiveNpc(entities, nextId, GRANDFATHER_DEF, 'archive_paper_grandfather', catalog.x + catalog.w - 4, catalog.y + 3);
  spawnArchiveNpc(entities, nextId, FIRE_LIQUIDATOR_DEF, 'archive_fire_liquidator', fire.x + fire.w - 4, fire.y + fire.h - 4, 'makarov');
  spawnArchiveNpc(entities, nextId, FALSE_HEIR_DEF, 'archive_false_heir', heir.x + 4, heir.y + 4);
  spawnArchiveGuard(entities, nextId, checker.x + checker.w - 4, checker.y + checker.h - 4);
  spawnArchiveMonster(world, entities, nextId, shelves.x + 7, shelves.y + shelves.h - 5, MonsterKind.PARAGRAPH);
  spawnArchiveMonster(world, entities, nextId, fire.x + 8, fire.y + 4, MonsterKind.PECHATEED);

  world.bakeLights();
  return { world, entities, spawnX: 512.5, spawnY: 507.5 };
}

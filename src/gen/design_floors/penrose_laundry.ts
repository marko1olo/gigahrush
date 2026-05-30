/* -- Design floor: penrose_laundry - aperiodic laundry and boiler service -- */

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
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { registerRouteCue } from '../../systems/route_cues';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const PENROSE_LAUNDRY_ROUTE_ID = 'penrose_laundry' as const;
export const PENROSE_LAUNDRY_Z = -8;
export const PENROSE_LAUNDRY_BASE_FLOOR = FloorLevel.LIVING;

export const PENROSE_LAUNDRY_ROOM_NAMES = {
  liftLobby: 'Лифтовая бирка прачечной П-81',
  firstSun: 'Прачечная метка Солнце П-81',
  secondSun: 'Сушильная метка Солнце П-81',
  kiteBoiler: 'Котельная метка Кайт П-81',
  steamValve: 'Паровой отвод П-81',
  lock: 'Прачечный замок П-81',
  hiddenCache: 'Скрытая умывальная кэш П-81',
  dryCache: 'Сухая кэш-складка П-81',
  deflationA: 'Карман дефляции А П-81',
  deflationB: 'Карман дефляции Б П-81',
  rinseLine: 'Ополаскиватель без периода П-81',
  drainTail: 'Хвост сливной решетки П-81',
} as const;

type PenroseLaundrySymbol = 'sun' | 'kite' | 'dart' | 'drop' | 'coil';
type PenroseLaundryMotif = 'route' | 'water' | 'heat' | 'deflation' | 'lock' | 'cache';

interface PenroseTileSpec {
  id: string;
  roomName: string;
  symbol: PenroseLaundrySymbol;
  motif: PenroseLaundryMotif;
  type: RoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  wallTex: Tex;
  floorTex: Tex;
}

export interface PenroseLaundryTileRecord {
  id: string;
  roomName: string;
  roomId: number;
  symbol: PenroseLaundrySymbol;
  motif: PenroseLaundryMotif;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PenroseLaundryState {
  routeId: typeof PENROSE_LAUNDRY_ROUTE_ID;
  anchorZ: typeof PENROSE_LAUNDRY_Z;
  baseFloor: typeof PENROSE_LAUNDRY_BASE_FLOOR;
  tiles: PenroseLaundryTileRecord[];
  symbolChainRoomNames: string[];
  deflationPocketRoomNames: string[];
  lockedDoorIds: number[];
  containerIds: {
    laundryLock: number;
    steamValve: number;
    hiddenWashroomCache: number;
  };
  waterCells: number;
  steamCells: number;
  debugEntry: {
    spawnX: number;
    spawnY: number;
    summary: string;
  };
}

export interface PenroseLaundryGeneration extends FloorGeneration {
  penroseLaundryState: PenroseLaundryState;
}

const C = W >> 1;
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_TURN = Math.PI * (3 - Math.sqrt(5));
const LOCK_KEY_ID = 'container_key_label';

const TILE_SPECS: readonly PenroseTileSpec[] = [
  { id: 'lift_lobby', roomName: PENROSE_LAUNDRY_ROOM_NAMES.liftLobby, symbol: 'coil', motif: 'route', type: RoomType.CORRIDOR, x: C - 34, y: C - 20, w: 22, h: 20, wallTex: Tex.LIFT_DOOR, floorTex: Tex.F_CONCRETE },
  { id: 'first_sun', roomName: PENROSE_LAUNDRY_ROOM_NAMES.firstSun, symbol: 'sun', motif: 'water', type: RoomType.PRODUCTION, x: C, y: C - 32, w: 36, h: 18, wallTex: Tex.TILE_W, floorTex: Tex.F_TILE },
  { id: 'west_drop', roomName: 'Мокрая метка Капля П-81', symbol: 'drop', motif: 'water', type: RoomType.BATHROOM, x: C - 71, y: C - 23, w: 26, h: 18, wallTex: Tex.TILE_W, floorTex: Tex.F_WATER },
  { id: 'deflation_a', roomName: PENROSE_LAUNDRY_ROOM_NAMES.deflationA, symbol: 'dart', motif: 'deflation', type: RoomType.STORAGE, x: C - 22, y: C - 52, w: 16, h: 12, wallTex: Tex.PANEL, floorTex: Tex.F_LINO },
  { id: 'kite_boiler', roomName: PENROSE_LAUNDRY_ROOM_NAMES.kiteBoiler, symbol: 'kite', motif: 'heat', type: RoomType.PRODUCTION, x: C + 40, y: C - 7, w: 28, h: 22, wallTex: Tex.PIPE, floorTex: Tex.F_CONCRETE },
  { id: 'deflation_b', roomName: PENROSE_LAUNDRY_ROOM_NAMES.deflationB, symbol: 'sun', motif: 'deflation', type: RoomType.STORAGE, x: C + 48, y: C - 38, w: 14, h: 14, wallTex: Tex.PANEL, floorTex: Tex.F_LINO },
  { id: 'rinse_line', roomName: PENROSE_LAUNDRY_ROOM_NAMES.rinseLine, symbol: 'drop', motif: 'water', type: RoomType.BATHROOM, x: C + 103, y: C - 12, w: 28, h: 16, wallTex: Tex.TILE_W, floorTex: Tex.F_WATER },
  { id: 'drain_tail', roomName: PENROSE_LAUNDRY_ROOM_NAMES.drainTail, symbol: 'dart', motif: 'water', type: RoomType.STORAGE, x: C + 78, y: C - 50, w: 22, h: 14, wallTex: Tex.DARK, floorTex: Tex.F_WATER },
  { id: 'steam_valve', roomName: PENROSE_LAUNDRY_ROOM_NAMES.steamValve, symbol: 'kite', motif: 'heat', type: RoomType.PRODUCTION, x: C + 11, y: C + 23, w: 32, h: 22, wallTex: Tex.PIPE, floorTex: Tex.F_CONCRETE },
  { id: 'second_sun', roomName: PENROSE_LAUNDRY_ROOM_NAMES.secondSun, symbol: 'sun', motif: 'water', type: RoomType.PRODUCTION, x: C - 32, y: C + 44, w: 28, h: 18, wallTex: Tex.TILE_W, floorTex: Tex.F_TILE },
  { id: 'laundry_lock', roomName: PENROSE_LAUNDRY_ROOM_NAMES.lock, symbol: 'coil', motif: 'lock', type: RoomType.STORAGE, x: C - 67, y: C + 23, w: 26, h: 16, wallTex: Tex.METAL, floorTex: Tex.F_CONCRETE },
  { id: 'hidden_cache', roomName: PENROSE_LAUNDRY_ROOM_NAMES.hiddenCache, symbol: 'sun', motif: 'cache', type: RoomType.BATHROOM, x: C - 98, y: C + 46, w: 20, h: 14, wallTex: Tex.TILE_W, floorTex: Tex.F_WATER },
  { id: 'dry_cache', roomName: PENROSE_LAUNDRY_ROOM_NAMES.dryCache, symbol: 'dart', motif: 'cache', type: RoomType.STORAGE, x: C + 78, y: C + 23, w: 18, h: 14, wallTex: Tex.PANEL, floorTex: Tex.F_LINO },
] as const;

const SYMBOL_CHAIN_IDS = ['first_sun', 'deflation_b', 'second_sun', 'hidden_cache'] as const;
const DEFLATION_IDS = ['deflation_a', 'deflation_b'] as const;

const NPC_IDS = {
  marfa: 'penrose_laundry_marfa_symbols',
  igor: 'penrose_laundry_igor_lock',
  lidia: 'penrose_laundry_lidia_steam',
  tonya: 'penrose_laundry_tonya_cache',
} as const;

const MARFA_DEF: PlotNpcDef = {
  name: 'Марфа Меточная',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.HOUSEWIFE,
  sprite: Occupation.HOUSEWIFE,
  hp: 88, maxHp: 88, money: 24, speed: 0.78,
  inventory: [{ defId: 'chalk', count: 1 }, { defId: 'cloth_roll', count: 1 }],
  talkLines: [
    'Плитка тут не повторяется. Повторяется только знак. За Солнцем иди к Солнцу, а не прямо.',
    'Если знак совпал, не спорь с углом. Машинка знает короче, чем глаз.',
    'Кто идет по мокрому ромбу, тот выходит к сухой кэш-складке.',
  ],
  talkLinesPost: [
    'Солнца сошлись. Значит, прачечная еще помнит, где у нее изнанка.',
    'Метки лучше не стирать: без них пол снова станет просто полом.',
  ],
};

const IGOR_DEF: PlotNpcDef = {
  name: 'Игорь Прищеп',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.LOCKSMITH,
  sprite: Occupation.LOCKSMITH,
  hp: 110, maxHp: 110, money: 31, speed: 0.82,
  inventory: [{ defId: 'wrench', count: 1 }, { defId: LOCK_KEY_ID, count: 1 }],
  talkLines: [
    'Прачечный замок не открывают. Его убеждают ключом, рукояткой или плохой паузой.',
    'Бирка от ключа подходит не к двери, а к ее памяти. Этого тут хватает.',
    'Сломаешь тихо - шкаф обидится меньше, чем очередь.',
  ],
  talkLinesPost: [
    'Замок стал мягче. Не добрее, просто мягче.',
    'Теперь у двери есть версия, что она открылась сама.',
  ],
};

const LIDIA_DEF: PlotNpcDef = {
  name: 'Лидия Пароотвод',
  isFemale: true,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.MECHANIC,
  sprite: Occupation.MECHANIC,
  hp: 128, maxHp: 128, money: 40, speed: 0.84,
  inventory: [{ defId: 'valve_tag', count: 1 }, { defId: 'asbestos_cord', count: 1 }, { defId: 'boiler_water', count: 1 }],
  talkLines: [
    'Пар можно пустить в сушку, в слив или в лицо тому, кто не читает бирку.',
    'Мне нужна бирка вентиля. Тогда жар уйдет в котел, а не в коридор.',
    'Красный туман тут короткий. Длинные ожоги делает не пар, а геройство.',
  ],
  talkLinesPost: [
    'Пар ушел по ромбу. Слушай: теперь свистит не на тебя.',
    'Котел не благодарит. Это хороший признак.',
  ],
};

const TONYA_DEF: PlotNpcDef = {
  name: 'Тоня Тайник',
  isFemale: true,
  faction: Faction.WILD,
  occupation: Occupation.STOREKEEPER,
  sprite: Occupation.STOREKEEPER,
  hp: 92, maxHp: 92, money: 16, speed: 0.9,
  inventory: [{ defId: 'pressure_logbook', count: 1 }, { defId: 'filtered_water', count: 1 }],
  talkLines: [
    'Скрытая умывальная есть только когда не ищешь умывальную. Иди по двум одинаковым Солнцам.',
    'В кэше лежит мокрый журнал. Не открывай его над водой, он начнет спорить с давлением.',
    'Тайник не мой. Я просто первая поняла, что он боится сухих рук.',
  ],
  talkLinesPost: [
    'Журнал нашелся. Теперь давление хотя бы можно обвинить по фамилии.',
    'Не рассказывай очереди, где кэш. Очередь туда не влезет, но попробует.',
  ],
};

registerSideQuest(NPC_IDS.marfa, MARFA_DEF, [{
  id: 'penrose_laundry_follow_matching_symbols',
  giverNpcId: NPC_IDS.marfa,
  type: QuestType.VISIT,
  desc: 'Марфа Меточная: «На П-81 прямой путь врет. Идите по одинаковым Солнцам: первое у машин, второе у сушки, третье у скрытой умывальной.»',
  targetRoomName: PENROSE_LAUNDRY_ROOM_NAMES.hiddenCache,
  rewardItem: 'chalk',
  rewardCount: 1,
  extraRewards: [{ defId: 'cloth_roll', count: 2 }],
  relationDelta: 10,
  xpReward: 45,
  moneyReward: 12,
  eventTags: ['penrose_laundry', 'symbol_chain', 'hidden_cache', 'route_choice'],
  eventData: { routeId: PENROSE_LAUNDRY_ROUTE_ID, choice: 'follow_matching_symbols' },
}]);

registerSideQuest(NPC_IDS.igor, IGOR_DEF, [{
  id: 'penrose_laundry_break_lock',
  giverNpcId: NPC_IDS.igor,
  type: QuestType.FETCH,
  desc: 'Игорь Прищеп: «Гаечный ключ принесете - дам бирку. Прачечный замок любит, когда его сначала уважают железом.»',
  targetItem: 'wrench',
  targetCount: 1,
  rewardItem: LOCK_KEY_ID,
  rewardCount: 1,
  extraRewards: [{ defId: 'cleaning_kit', count: 1 }],
  relationDelta: 8,
  xpReward: 35,
  moneyReward: 18,
  eventTags: ['penrose_laundry', 'laundry_lock', 'break_lock', 'access'],
  eventData: { routeId: PENROSE_LAUNDRY_ROUTE_ID, choice: 'break_laundry_lock' },
}]);

registerSideQuest(NPC_IDS.lidia, LIDIA_DEF, [{
  id: 'penrose_laundry_divert_steam',
  giverNpcId: NPC_IDS.lidia,
  type: QuestType.FETCH,
  desc: 'Лидия Пароотвод: «Бирку вентиля сюда. Пар уйдет в сушильный карман, и П-81 перестанет варить людей у котла.»',
  targetItem: 'valve_tag',
  targetCount: 1,
  rewardItem: 'boiler_water',
  rewardCount: 2,
  extraRewards: [{ defId: 'asbestos_cord', count: 1 }],
  relationDelta: 9,
  xpReward: 40,
  moneyReward: 20,
  eventTags: ['penrose_laundry', 'steam', 'divert_steam', 'repair'],
  eventData: { routeId: PENROSE_LAUNDRY_ROUTE_ID, choice: 'divert_steam' },
}]);

registerSideQuest(NPC_IDS.tonya, TONYA_DEF, [{
  id: 'penrose_laundry_hidden_washroom_cache',
  giverNpcId: NPC_IDS.tonya,
  type: QuestType.FETCH,
  desc: 'Тоня Тайник: «Из скрытой умывальной достаньте журнал давления. Кэш любит сухую руку и ненавидит прямые маршруты.»',
  targetItem: 'pressure_logbook',
  targetCount: 1,
  rewardItem: 'filtered_water',
  rewardCount: 2,
  extraRewards: [{ defId: 'water_coupon', count: 1 }],
  relationDelta: 10,
  xpReward: 45,
  moneyReward: 14,
  eventTags: ['penrose_laundry', 'hidden_washroom_cache', 'pressure_logbook', 'cache'],
  eventData: { routeId: PENROSE_LAUNDRY_ROUTE_ID, choice: 'find_hidden_washroom_cache' },
}]);

const penroseLaundryStates = new WeakMap<World, PenroseLaundryState>();

export function getPenroseLaundryState(world: World): PenroseLaundryState | undefined {
  const state = penroseLaundryStates.get(world);
  if (!state) return undefined;
  return {
    ...state,
    tiles: state.tiles.map(tile => ({ ...tile })),
    symbolChainRoomNames: [...state.symbolChainRoomNames],
    deflationPocketRoomNames: [...state.deflationPocketRoomNames],
    lockedDoorIds: [...state.lockedDoorIds],
    containerIds: { ...state.containerIds },
    debugEntry: { ...state.debugEntry },
  };
}

export function generatePenroseLaundryDesignFloor(): PenroseLaundryGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };

  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.PANEL;
    world.floorTex[i] = Tex.F_CONCRETE;
    world.factionControl[i] = ZoneFaction.CITIZEN;
  }

  const roomsById = new Map<string, Room>();
  const tileRecords: PenroseLaundryTileRecord[] = [];
  for (const spec of TILE_SPECS) {
    const room = stampLaundryRoom(world, spec);
    roomsById.set(spec.id, room);
    tileRecords.push({
      id: spec.id,
      roomName: room.name,
      roomId: room.id,
      symbol: spec.symbol,
      motif: spec.motif,
      x: room.x,
      y: room.y,
      w: room.w,
      h: room.h,
    });
  }

  const lockedDoorIds: number[] = [];
  connectTilePath(world, roomsById, lockedDoorIds);
  placeLifts(world, roomById(roomsById, 'lift_lobby'));
  for (const spec of TILE_SPECS) dressTileRoom(world, roomById(roomsById, spec.id), spec);
  markSymbolCells(world, roomsById);

  generateZones(world);
  tunePenroseZones(world);

  const marfaId = spawnPlotNpc(entities, nextId, NPC_IDS.marfa, MARFA_DEF, roomById(roomsById, 'first_sun'), 4, 5, 0);
  const igorId = spawnPlotNpc(entities, nextId, NPC_IDS.igor, IGOR_DEF, roomById(roomsById, 'laundry_lock'), 4, 4, Math.PI * 0.25);
  const lidiaId = spawnPlotNpc(entities, nextId, NPC_IDS.lidia, LIDIA_DEF, roomById(roomsById, 'steam_valve'), 6, 6, Math.PI);
  const tonyaId = spawnPlotNpc(entities, nextId, NPC_IDS.tonya, TONYA_DEF, roomById(roomsById, 'second_sun'), 5, 4, Math.PI * 0.5);

  const containerIds = placePenroseContainers(world, roomsById, {
    marfaId,
    igorId,
    lidiaId,
    tonyaId,
  });
  dropPenroseSupplies(world, entities, nextId, roomsById);
  spawnPenroseThreats(world, entities, nextId, roomsById);
  registerPenroseRouteCues(world, roomsById);

  sanitizeDoors(world);
  ensureConnectivity(world, C - 23.5, C - 10.5);
  world.rebuildContainerMap();
  world.bakeLights();

  const state: PenroseLaundryState = {
    routeId: PENROSE_LAUNDRY_ROUTE_ID,
    anchorZ: PENROSE_LAUNDRY_Z,
    baseFloor: PENROSE_LAUNDRY_BASE_FLOOR,
    tiles: tileRecords,
    symbolChainRoomNames: SYMBOL_CHAIN_IDS.map(id => roomById(roomsById, id).name),
    deflationPocketRoomNames: DEFLATION_IDS.map(id => roomById(roomsById, id).name),
    lockedDoorIds,
    containerIds,
    waterCells: countCells(world, Cell.WATER),
    steamCells: countFogCells(world, 48),
    debugEntry: {
      spawnX: C - 23.5,
      spawnY: C - 10.5,
      summary: 'finite_penrose_like_patch=13 tiles, symbol_chain=sun, decisions=symbol/lock/steam/cache',
    },
  };
  penroseLaundryStates.set(world, state);

  return {
    world,
    entities,
    spawnX: state.debugEntry.spawnX,
    spawnY: state.debugEntry.spawnY,
    penroseLaundryState: state,
  };
}

function stampLaundryRoom(world: World, spec: PenroseTileSpec): Room {
  const room = stampRoom(world, world.rooms.length, spec.type, spec.x, spec.y, spec.w, spec.h, -1);
  room.name = spec.roomName;
  room.wallTex = spec.wallTex;
  room.floorTex = spec.floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = spec.wallTex;
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) {
        world.floorTex[ci] = spec.floorTex;
        world.factionControl[ci] = spec.motif === 'heat' ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
      }
    }
  }
  return room;
}

function connectTilePath(world: World, roomsById: Map<string, Room>, lockedDoorIds: number[]): void {
  const path = [
    'west_drop',
    'lift_lobby',
    'deflation_a',
    'first_sun',
    'deflation_b',
    'kite_boiler',
    'rinse_line',
    'drain_tail',
    'steam_valve',
    'second_sun',
    'laundry_lock',
    'dry_cache',
  ];
  for (let i = 1; i < path.length; i++) connectRooms(world, roomById(roomsById, path[i - 1]), roomById(roomsById, path[i]), DoorState.CLOSED, '');

  const hiddenDoors = connectRooms(
    world,
    roomById(roomsById, 'laundry_lock'),
    roomById(roomsById, 'hidden_cache'),
    DoorState.LOCKED,
    LOCK_KEY_ID,
  );
  lockedDoorIds.push(...hiddenDoors);
}

function connectRooms(world: World, a: Room, b: Room, state: DoorState, keyId: string): number[] {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const horizontal = Math.abs(bcx - acx) >= Math.abs(bcy - acy);
  let ax: number;
  let ay: number;
  let bx: number;
  let by: number;
  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;

  if (horizontal) {
    ay = clamp(Math.round(acy), a.y, a.y + a.h - 1);
    by = clamp(Math.round(bcy), b.y, b.y + b.h - 1);
    if (bcx >= acx) {
      ax = a.x + a.w;
      bx = b.x - 1;
      startX = ax + 1;
      endX = bx - 1;
    } else {
      ax = a.x - 1;
      bx = b.x + b.w;
      startX = ax - 1;
      endX = bx + 1;
    }
    startY = ay;
    endY = by;
  } else {
    ax = clamp(Math.round(acx), a.x, a.x + a.w - 1);
    bx = clamp(Math.round(bcx), b.x, b.x + b.w - 1);
    if (bcy >= acy) {
      ay = a.y + a.h;
      by = b.y - 1;
      startY = ay + 1;
      endY = by - 1;
    } else {
      ay = a.y - 1;
      by = b.y + b.h;
      startY = ay - 1;
      endY = by + 1;
    }
    startX = ax;
    endX = bx;
  }

  const doors = [
    addDoor(world, a, ax, ay, state, keyId),
    addDoor(world, b, bx, by, state, keyId),
  ];
  carveLaundryCorridor(world, startX, startY, endX, endY, Tex.F_LINO);
  return doors;
}

function addDoor(world: World, room: Room, x: number, y: number, state: DoorState, keyId: string): number {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.DOOR;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = room.wallTex;
  world.floorTex[ci] = room.floorTex;
  world.doors.set(ci, { idx: ci, state, roomA: room.id, roomB: -1, keyId, timer: 0 });
  room.doors.push(ci);
  return ci;
}

function carveLaundryCorridor(world: World, ax: number, ay: number, bx: number, by: number, floorTex: Tex): void {
  if (ax !== bx && ay !== by) {
    const turnBias = Math.sin((ax + ay * PHI + bx * GOLDEN_TURN) * 0.07) > 0;
    if (turnBias) {
      carveLaundryCorridor(world, ax, ay, bx, ay, floorTex);
      carveLaundryCorridor(world, bx, ay, bx, by, floorTex);
    } else {
      carveLaundryCorridor(world, ax, ay, ax, by, floorTex);
      carveLaundryCorridor(world, ax, by, bx, by, floorTex);
    }
    return;
  }

  const min = ax === bx ? Math.min(ay, by) : Math.min(ax, bx);
  const max = ax === bx ? Math.max(ay, by) : Math.max(ax, bx);
  for (let p = min; p <= max; p++) {
    const x = ax === bx ? ax : p;
    const y = ax === bx ? p : ay;
    openCorridorTile(world, x, y, floorTex);
  }
}

function openCorridorTile(world: World, x: number, y: number, floorTex: Tex): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.doors.has(ci) || world.roomMap[ci] >= 0) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.PANEL;
  world.floorTex[ci] = floorTex;
  world.features[ci] = Feature.NONE;
  world.factionControl[ci] = ZoneFaction.CITIZEN;
}

function placeLifts(world: World, lobby: Room): void {
  placeLift(world, lobby.x + 5, lobby.y + 4, LiftDirection.UP);
  placeLift(world, lobby.x + 5, lobby.y + lobby.h - 5, LiftDirection.DOWN);
  setFeature(world, lobby.x + 8, lobby.y + 4, Feature.LIFT_BUTTON);
  setFeature(world, lobby.x + 8, lobby.y + lobby.h - 5, Feature.LIFT_BUTTON);
  setFeature(world, lobby.x + lobby.w - 4, lobby.y + 4, Feature.SCREEN);
}

function placeLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.floorTex[ci] = Tex.F_CONCRETE;
  world.liftDir[ci] = direction;
}

function dressTileRoom(world: World, room: Room, spec: PenroseTileSpec): void {
  setFeature(world, room.x + Math.max(2, Math.floor(room.w / 2)), room.y + 2, Feature.SCREEN);
  if (spec.motif === 'water') dressWaterRoom(world, room);
  else if (spec.motif === 'heat') dressHeatRoom(world, room);
  else if (spec.motif === 'deflation') dressDeflationPocket(world, room);
  else if (spec.motif === 'lock') dressLockRoom(world, room);
  else if (spec.motif === 'cache') dressCacheRoom(world, room);
  else {
    setFeature(world, room.x + room.w - 4, room.y + room.h - 4, Feature.LAMP);
    setFeature(world, room.x + 3, room.y + room.h - 4, Feature.DESK);
  }
}

function dressWaterRoom(world: World, room: Room): void {
  for (let y = room.y + 3; y < room.y + room.h - 2; y += 3) {
    for (let x = room.x + 3; x < room.x + room.w - 3; x++) {
      if (((x + y + room.id) % 5) === 0) continue;
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id) continue;
      world.cells[ci] = Cell.WATER;
      world.floorTex[ci] = Tex.F_WATER;
    }
  }
  for (let x = room.x + 3; x < room.x + room.w - 2; x += 7) setFeature(world, x, room.y + room.h - 3, Feature.MACHINE);
  setFeature(world, room.x + 2, room.y + 2, Feature.SINK);
  setFeature(world, room.x + room.w - 3, room.y + 2, Feature.LAMP);
}

function dressHeatRoom(world: World, room: Room): void {
  for (let y = room.y + 2; y < room.y + room.h - 2; y++) {
    for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id) continue;
      if (((x * 3 + y * 5 + room.id) & 7) === 0) world.fog[ci] = 88;
      if (((x + y) & 5) === 0) world.floorTex[ci] = Tex.F_CONCRETE;
    }
  }
  for (let x = room.x + 3; x < room.x + room.w - 3; x += 5) {
    setFeature(world, x, room.y + 3, Feature.APPARATUS);
    setFeature(world, x, room.y + room.h - 4, Feature.MACHINE);
  }
  setFeature(world, room.x + room.w - 3, room.y + Math.floor(room.h / 2), Feature.LAMP);
}

function dressDeflationPocket(world: World, room: Room): void {
  for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id) continue;
      world.floorTex[ci] = ((x + y) & 1) === 0 ? Tex.F_LINO : Tex.F_CONCRETE;
    }
  }
  setFeature(world, room.x + 2, room.y + 2, Feature.SHELF);
  setFeature(world, room.x + room.w - 3, room.y + room.h - 3, Feature.LAMP);
}

function dressLockRoom(world: World, room: Room): void {
  for (let y = room.y + 2; y < room.y + room.h - 2; y += 3) {
    setFeature(world, room.x + 2, y, Feature.SHELF);
    setFeature(world, room.x + room.w - 3, y, Feature.MACHINE);
  }
  setFeature(world, room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2), Feature.APPARATUS);
}

function dressCacheRoom(world: World, room: Room): void {
  for (let x = room.x + 2; x < room.x + room.w - 2; x += 4) {
    setFeature(world, x, room.y + 2, Feature.SHELF);
  }
  setFeature(world, room.x + 2, room.y + room.h - 3, Feature.SINK);
  setFeature(world, room.x + room.w - 3, room.y + room.h - 3, Feature.LAMP);
}

function markSymbolCells(world: World, roomsById: Map<string, Room>): void {
  let serial = 0;
  for (const id of SYMBOL_CHAIN_IDS) {
    const room = roomById(roomsById, id);
    const x = room.x + Math.floor(room.w / 2);
    const y = room.y + Math.floor(room.h / 2);
    const ci = world.idx(x, y);
    world.features[ci] = serial % 2 === 0 ? Feature.SCREEN : Feature.APPARATUS;
    world.floorTex[ci] = Tex.F_CARPET_EDGE_BASE + ((serial * 5) & 15);
    serial++;
  }
}

function tunePenroseZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, C, C);
    zone.level = d < 110 ? 3 : d < 230 ? 4 : 2;
    zone.faction = d < 120 ? ZoneFaction.CITIZEN : ZoneFaction.WILD;
    if (zone.cx > C + 24 && Math.abs(zone.cy - C) < 120) zone.faction = ZoneFaction.LIQUIDATOR;
    if (zone.cy > C + 36 && zone.cx < C - 26) zone.faction = ZoneFaction.SAMOSBOR;
  }
}

function placePenroseContainers(
  world: World,
  roomsById: Map<string, Room>,
  owners: { marfaId: number; igorId: number; lidiaId: number; tonyaId: number },
): PenroseLaundryState['containerIds'] {
  const lock = addContainer(world, roomById(roomsById, 'laundry_lock'), 4, 4, ContainerKind.TOOL_LOCKER, 'Прачечный замок с чужими насечками', [
    { defId: 'cleaning_kit', count: 1 },
    { defId: 'cloth_roll', count: 2 },
    { defId: 'sealant_tube', count: 1 },
  ], 'locked', ['penrose_laundry', 'laundry_lock', 'breakable', 'decision'], owners.igorId, IGOR_DEF.name, 3);

  const steam = addContainer(world, roomById(roomsById, 'steam_valve'), 5, 4, ContainerKind.METAL_CABINET, 'Шкаф пароотвода П-81', [
    { defId: 'valve_tag', count: 1 },
    { defId: 'asbestos_cord', count: 1 },
    { defId: 'manometer', count: 1 },
  ], 'owner', ['penrose_laundry', 'steam', 'divert_steam', 'repair'], owners.lidiaId, LIDIA_DEF.name);

  addContainer(world, roomById(roomsById, 'first_sun'), 6, 5, ContainerKind.WOODEN_CHEST, 'Корзина метки Солнце', [
    { defId: 'cloth_roll', count: 2 },
    { defId: 'chalk', count: 1 },
  ], 'room', ['penrose_laundry', 'symbol_chain', 'laundry']);

  addContainer(world, roomById(roomsById, 'dry_cache'), 3, 4, ContainerKind.FILING_CABINET, 'Сухая складка ведомостей П-81', [
    { defId: 'water_coupon', count: 2 },
    { defId: 'filter_receipt', count: 1 },
    { defId: 'sealed_complaint', count: 1 },
  ], 'room', ['penrose_laundry', 'dry_cache', 'papers']);

  const hidden = addContainer(world, roomById(roomsById, 'hidden_cache'), 3, 3, ContainerKind.SECRET_STASH, 'Скрытый умывальный кэш П-81', [
    { defId: 'pressure_logbook', count: 1 },
    { defId: 'filtered_water', count: 2 },
    { defId: 'gasmask_filter', count: 1 },
    { defId: LOCK_KEY_ID, count: 1 },
  ], 'secret', ['penrose_laundry', 'hidden_washroom_cache', 'cache', 'symbol_chain'], owners.tonyaId, TONYA_DEF.name, 4);

  return {
    laundryLock: lock.id,
    steamValve: steam.id,
    hiddenWashroomCache: hidden.id,
  };
}

function addContainer(
  world: World,
  room: Room,
  dx: number,
  dy: number,
  kind: ContainerKind,
  name: string,
  inventory: Item[],
  access: WorldContainer['access'],
  tags: string[],
  ownerNpcId?: number,
  ownerName?: string,
  lockDifficulty?: number,
): WorldContainer {
  const x = room.x + dx;
  const y = room.y + dy;
  const container: WorldContainer = {
    id: nextContainerId(world),
    x,
    y,
    floor: PENROSE_LAUNDRY_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: Math.max(8, inventory.length + 4),
    ownerNpcId,
    ownerName,
    faction: ownerNpcId === undefined ? Faction.CITIZEN : undefined,
    access,
    lockDifficulty,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.SECRET_STASH ? Feature.SHELF : Feature.MACHINE);
  return container;
}

function dropPenroseSupplies(world: World, entities: Entity[], nextId: { v: number }, roomsById: Map<string, Room>): void {
  placeDrop(world, entities, nextId, roomById(roomsById, 'west_drop'), 4, 5, 'toiletpaper', 1);
  placeDrop(world, entities, nextId, roomById(roomsById, 'deflation_a'), 3, 3, 'chalk', 1);
  placeDrop(world, entities, nextId, roomById(roomsById, 'kite_boiler'), 4, 7, 'boiler_water', 1);
  placeDrop(world, entities, nextId, roomById(roomsById, 'drain_tail'), 4, 4, 'valve_tag', 1);
  placeDrop(world, entities, nextId, roomById(roomsById, 'second_sun'), 4, 5, 'cloth_roll', 1);
}

function spawnPenroseThreats(world: World, entities: Entity[], nextId: { v: number }, roomsById: Map<string, Room>): void {
  spawnMonster(entities, nextId, MonsterKind.TUBE_EEL, roomById(roomsById, 'rinse_line'), 10, 7);
  spawnMonster(entities, nextId, MonsterKind.VODYANOY_KOSHMAR, roomById(roomsById, 'drain_tail'), 8, 7);
  spawnMonster(entities, nextId, MonsterKind.KRYSNOZHKA, roomById(roomsById, 'laundry_lock'), 18, 10);
  spawnMonster(entities, nextId, MonsterKind.POLZUN, roomById(roomsById, 'hidden_cache'), 12, 8);
  for (const room of [roomById(roomsById, 'rinse_line'), roomById(roomsById, 'steam_valve')]) {
    const ci = world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2));
    if (world.cells[ci] === Cell.FLOOR) world.fog[ci] = Math.max(world.fog[ci], 110);
  }
}

function registerPenroseRouteCues(world: World, roomsById: Map<string, Room>): void {
  const first = roomById(roomsById, 'first_sun');
  const hidden = roomById(roomsById, 'hidden_cache');
  registerRouteCue(world, {
    id: 'penrose_laundry_symbol_chain',
    x: first.x + first.w / 2,
    y: first.y + first.h / 2,
    targetX: hidden.x + hidden.w / 2,
    targetY: hidden.y + hidden.h / 2,
    floor: PENROSE_LAUNDRY_BASE_FLOOR,
    roomId: first.id,
    targetRoomId: hidden.id,
    zoneId: world.zoneMap[world.idx(first.x + Math.floor(first.w / 2), first.y + Math.floor(first.h / 2))],
    label: 'одинаковые Солнца',
    hint: 'повторяющийся символ ведет к скрытой умывальной',
    targetName: PENROSE_LAUNDRY_ROOM_NAMES.hiddenCache,
    color: '#9ef',
    tags: ['penrose_laundry', 'symbol_chain', 'hidden_washroom_cache'],
    toneSeed: 81081,
    radius: 8,
    targetRadius: 4,
    cooldownSec: 36,
    heardText: 'Мокрые метки П-81 повторяют Солнце. Одинаковые знаки ведут не по прямой, а к скрытой умывальной.',
    followedText: 'Цепочка Солнц сошлась к скрытой умывальной П-81.',
    ignoredText: 'Солнце на плитке осталось за спиной. Прачечная снова стала просто шумной.',
  });
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: { v: number },
  npcId: string,
  def: PlotNpcDef,
  room: Room,
  dx: number,
  dy: number,
  angle: number,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: room.x + dx + 0.5,
    y: room.y + dy + 0.5,
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
    inventory: def.inventory.map(item => ({ ...item })),
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
  });
  return id;
}

function spawnMonster(entities: Entity[], nextId: { v: number }, kind: MonsterKind, room: Room, dx: number, dy: number): void {
  const def = MONSTERS[kind];
  if (!def) return;
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: room.x + Math.min(room.w - 2, dx) + 0.5,
    y: room.y + Math.min(room.h - 2, dy) + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: def.speed * 0.9,
    sprite: monsterSpr(kind),
    hp: Math.max(1, Math.round(def.hp * 0.85)),
    maxHp: Math.max(1, Math.round(def.hp * 0.85)),
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    monsterKind: kind,
  });
}

function placeDrop(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  room: Room,
  dx: number,
  dy: number,
  defId: string,
  count: number,
): void {
  const x = room.x + dx;
  const y = room.y + dy;
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
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

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  world.features[ci] = feature;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function roomById(roomsById: Map<string, Room>, id: string): Room {
  const room = roomsById.get(id);
  if (!room) throw new Error(`Missing penrose laundry room: ${id}`);
  return room;
}

function countCells(world: World, cell: Cell): number {
  let count = 0;
  for (const value of world.cells) if (value === cell) count++;
  return count;
}

function countFogCells(world: World, min: number): number {
  let count = 0;
  for (const value of world.fog) if (value >= min) count++;
  return count;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ── Design floor: Darkness — post-Void light-resource pocket ─── */

import {
  W, Cell, Tex, Feature, RoomType, DoorState, LiftDirection,
  FloorLevel, ZoneFaction, Faction, Occupation, EntityType, AIGoal,
  MonsterKind, ContainerKind,
  type Entity, type Room, type Item, type WorldContainer,
  type GameState, type WorldEvent,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { publishEvent } from '../../systems/events';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import {
  carveCorridor,
  ensureConnectivity,
  generateZones,
  placeDoorAt,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DARKNESS_DESIGN_FLOOR_ID = 'darkness' as const;
export const DARKNESS_FUTURE_Z = -48;
export const DARKNESS_PRESERVED_NAME_ID = 'tamara_belova' as const;

export const DARKNESS_DEBUG_ENTRY = {
  routeId: DARKNESS_DESIGN_FLOOR_ID,
  z: DARKNESS_FUTURE_Z,
  generator: 'generateDarknessDesignFloor',
} as const;

type DarknessTollState = 'unpaid' | 'paid_light' | 'fought' | 'bypassed';
export type DarknessLateWarningId =
  | 'darkness_light_debt_warning'
  | 'darkness_return_trace_warning';
type DarknessQuestChoice =
  | 'spend_light'
  | 'save_light'
  | 'preserve_name'
  | 'leave_name'
  | 'pay_toll'
  | 'fight_shadows'
  | 'long_route'
  | 'carry_trace';

export interface DarknessRoomLabel {
  roomId: number;
  key: string;
  hiddenName: string;
  revealedName: string;
  lightCost: number;
  revealedAtStart: boolean;
}

export interface DarknessQuestDef {
  id: string;
  giverKey: string;
  title: string;
  objective: string;
  choices: DarknessQuestChoice[];
  rewardHint: string;
}

export interface DarknessLateWarning {
  id: DarknessLateWarningId;
  label: string;
  sourceKey: string;
  targetKey: string;
  warning: string;
  tags: readonly string[];
}

export interface DarknessFloorState {
  routeId: typeof DARKNESS_DESIGN_FLOOR_ID;
  z: typeof DARKNESS_FUTURE_Z;
  lightBudget: number;
  revealedRoomIds: number[];
  preservedNameId: typeof DARKNESS_PRESERVED_NAME_ID | null;
  shadowTollState: DarknessTollState;
  roomLabels: DarknessRoomLabel[];
  quests: DarknessQuestDef[];
  lateWarnings: DarknessLateWarning[];
  shortcutCueIds: string[];
  returnTracePublished: boolean;
}

export interface DarknessDesignGeneration extends FloorGeneration {
  darknessState: DarknessFloorState;
}

export interface DarknessReturnTraceOptions {
  preservedNameId?: typeof DARKNESS_PRESERVED_NAME_ID;
  sourceRoomId?: number;
  sourceZoneId?: number;
  x?: number;
  y?: number;
}

interface DarknessNpcSpec {
  key: string;
  name: string;
  isFemale: boolean;
  faction: Faction;
  occupation: Occupation;
  roomKey: string;
  dx: number;
  dy: number;
  hp: number;
  speed: number;
  money: number;
  inventory: Item[];
}

interface DarknessRoomSpec {
  key: string;
  type: RoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  hiddenName: string;
  revealedName: string;
  lightCost: number;
  revealedAtStart?: boolean;
  lamps?: readonly [number, number, Feature][];
  fog?: number;
}

const ROOM_ORIGIN_X = (W >> 1) - 36;
const ROOM_ORIGIN_Y = (W >> 1) - 10;

const ROOM_SPECS: readonly DarknessRoomSpec[] = [
  {
    key: 'entry',
    type: RoomType.COMMON,
    x: ROOM_ORIGIN_X,
    y: ROOM_ORIGIN_Y + 8,
    w: 12,
    h: 9,
    hiddenName: 'Входной пост',
    revealedName: 'Входной пост с аварийной лампой',
    lightCost: 0,
    revealedAtStart: true,
    lamps: [[2, 2, Feature.LAMP], [9, 6, Feature.CANDLE]],
    fog: 12,
  },
  {
    key: 'junction',
    type: RoomType.CORRIDOR,
    x: ROOM_ORIGIN_X + 16,
    y: ROOM_ORIGIN_Y + 10,
    w: 22,
    h: 5,
    hiddenName: 'Темный коридор',
    revealedName: 'Коридор остаточного света',
    lightCost: 1,
    revealedAtStart: true,
    lamps: [[2, 2, Feature.CANDLE], [18, 2, Feature.CANDLE]],
    fog: 24,
  },
  {
    key: 'lamp',
    type: RoomType.STORAGE,
    x: ROOM_ORIGIN_X + 43,
    y: ROOM_ORIGIN_Y + 2,
    w: 13,
    h: 10,
    hiddenName: 'Комната с теплым пятном',
    revealedName: 'Пост Ники-лампоносца',
    lightCost: 2,
    lamps: [[2, 2, Feature.LAMP], [10, 7, Feature.CANDLE]],
    fog: 18,
  },
  {
    key: 'generator',
    type: RoomType.PRODUCTION,
    x: ROOM_ORIGIN_X + 43,
    y: ROOM_ORIGIN_Y - 18,
    w: 17,
    h: 10,
    hiddenName: 'Комната с гулом',
    revealedName: 'Генераторная остаточного света',
    lightCost: 2,
    lamps: [[3, 2, Feature.LAMP], [13, 7, Feature.CANDLE]],
    fog: 20,
  },
  {
    key: 'name',
    type: RoomType.OFFICE,
    x: ROOM_ORIGIN_X + 66,
    y: ROOM_ORIGIN_Y - 4,
    w: 15,
    h: 11,
    hiddenName: 'Комната без названия',
    revealedName: 'Регистратура Тамары Беловой',
    lightCost: 3,
    lamps: [[3, 2, Feature.CANDLE]],
    fog: 42,
  },
  {
    key: 'control',
    type: RoomType.OFFICE,
    x: ROOM_ORIGIN_X + 84,
    y: ROOM_ORIGIN_Y - 19,
    w: 16,
    h: 9,
    hiddenName: 'Щит без подписей',
    revealedName: 'Пульт аварийного света',
    lightCost: 2,
    lamps: [[12, 4, Feature.CANDLE]],
    fog: 28,
  },
  {
    key: 'toll',
    type: RoomType.COMMON,
    x: ROOM_ORIGIN_X + 66,
    y: ROOM_ORIGIN_Y + 17,
    w: 15,
    h: 11,
    hiddenName: 'Темный сбор',
    revealedName: 'Пункт теневой пошлины',
    lightCost: 2,
    lamps: [[2, 8, Feature.CANDLE]],
    fog: 48,
  },
  {
    key: 'toll_gate',
    type: RoomType.CORRIDOR,
    x: ROOM_ORIGIN_X + 85,
    y: ROOM_ORIGIN_Y + 24,
    w: 11,
    h: 8,
    hiddenName: 'Узкое темное место',
    revealedName: 'Шлюз теневой пошлины',
    lightCost: 2,
    lamps: [[5, 3, Feature.CANDLE]],
    fog: 58,
  },
  {
    key: 'bypass',
    type: RoomType.CORRIDOR,
    x: ROOM_ORIGIN_X + 39,
    y: ROOM_ORIGIN_Y + 34,
    w: 35,
    h: 4,
    hiddenName: 'Длинная темнота',
    revealedName: 'Обход без ламп',
    lightCost: 1,
    fog: 38,
  },
  {
    key: 'emergency',
    type: RoomType.STORAGE,
    x: ROOM_ORIGIN_X + 82,
    y: ROOM_ORIGIN_Y + 38,
    w: 15,
    h: 8,
    hiddenName: 'Низкий свет',
    revealedName: 'Аварийный световой карман',
    lightCost: 1,
    lamps: [[2, 5, Feature.CANDLE], [12, 2, Feature.CANDLE]],
    fog: 24,
  },
  {
    key: 'trace',
    type: RoomType.OFFICE,
    x: ROOM_ORIGIN_X + 92,
    y: ROOM_ORIGIN_Y + 8,
    w: 13,
    h: 9,
    hiddenName: 'Пустое место',
    revealedName: 'Комната возвратного следа',
    lightCost: 2,
    lamps: [[6, 4, Feature.LAMP]],
    fog: 56,
  },
];

const QUESTS: readonly DarknessQuestDef[] = [
  {
    id: 'darkness_keep_lamp_alive',
    giverKey: 'darkness_lamp_bearer_nika',
    title: 'Держать лампу живой',
    objective: 'Донести лампу от входного поста до возвратного следа, не тратя заряд на каждую дверь.',
    choices: ['spend_light', 'save_light'],
    rewardHint: 'светлая короткая дорога или запас фонаря на обратный путь',
  },
  {
    id: 'darkness_find_name',
    giverKey: 'darkness_name_lost',
    title: 'Вернуть имя',
    objective: 'Осветить безымянную регистратуру и сохранить одну карточку имени.',
    choices: ['preserve_name', 'leave_name'],
    rewardHint: 'имя Тамары Беловой становится переносимым фактом',
  },
  {
    id: 'darkness_shadow_toll',
    giverKey: 'darkness_shadow_collector',
    title: 'Пошлина за короткий ход',
    objective: 'Отдать лампу, драться у короткого хода или идти длинным темным обходом.',
    choices: ['pay_toll', 'fight_shadows', 'long_route'],
    rewardHint: 'короткий путь, добыча с поста или сохраненный свет',
  },
  {
    id: 'darkness_return_with_trace',
    giverKey: 'darkness_return_trace',
    title: 'Вынести след',
    objective: 'Забрать засвеченный кадр и вынести его будущим адресатам: Жилой зоне, Министерству или Якову.',
    choices: ['carry_trace'],
    rewardHint: 'структурированное событие darkness_return_trace для поздних хуков',
  },
];

export const DARKNESS_LATE_WARNINGS: readonly DarknessLateWarning[] = [
  {
    id: 'darkness_light_debt_warning',
    label: 'Световой долг у пошлины',
    sourceKey: 'toll',
    targetKey: 'toll_gate',
    warning: 'Короткий путь через сборщика экономит время, но съедает свет, который нужен для подписи и возврата.',
    tags: ['darkness', 'light_budget', 'shadow_toll', 'warning'],
  },
  {
    id: 'darkness_return_trace_warning',
    label: 'Возвратный след выйдет наружу',
    sourceKey: 'control',
    targetKey: 'trace',
    warning: 'След возврата можно вынести, но он станет фактом для Жилой зоны, Министерства или Якова.',
    tags: ['darkness', 'return_trace', 'late_warning', 'warning'],
  },
];

const NPC_SPECS: readonly DarknessNpcSpec[] = [
  {
    key: 'darkness_lamp_bearer_nika',
    name: 'Ника с лампой',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.ELECTRICIAN,
    roomKey: 'lamp',
    dx: 3,
    dy: 4,
    hp: 90,
    speed: 1.25,
    money: 18,
    inventory: [
      { defId: 'flashlight', count: 1 },
      { defId: 'lamp_bulb', count: 2 },
      { defId: 'water', count: 1 },
      {
        defId: 'note',
        count: 1,
        data: 'Ника: свет не бесплатный. Потратишь на таблички - обратно пойдешь на ощупь.',
      },
    ],
  },
  {
    key: 'darkness_name_lost',
    name: 'Женщина без имени',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.SECRETARY,
    roomKey: 'name',
    dx: 7,
    dy: 5,
    hp: 70,
    speed: 0.8,
    money: 0,
    inventory: [
      {
        defId: 'note',
        count: 1,
        data: 'Под лампой читается: Тамара Белова, кв. нет, этаж спорный. В темноте строка снова пустая.',
      },
    ],
  },
  {
    key: 'darkness_shadow_collector',
    name: 'Сборщик у короткого хода',
    isFemale: false,
    faction: Faction.CULTIST,
    occupation: Occupation.PILGRIM,
    roomKey: 'toll',
    dx: 7,
    dy: 5,
    hp: 160,
    speed: 0.9,
    money: 0,
    inventory: [
      {
        defId: 'note',
        count: 1,
        data: 'Пошлина принимается лампой. Отказ принимается дракой. Обход принимает время.',
      },
    ],
  },
  {
    key: 'darkness_return_trace',
    name: 'След возврата',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SCIENTIST,
    roomKey: 'trace',
    dx: 6,
    dy: 4,
    hp: 1,
    speed: 0,
    money: 0,
    inventory: [
      { defId: 'overexposed_photo', count: 1 },
      {
        defId: 'note',
        count: 1,
        data: 'На белом кадре проступает чужая подпись: Тамара Белова вернулась в список, но список не знает где.',
      },
    ],
  },
];

const darknessStateByWorld = new WeakMap<World, DarknessFloorState>();

export function blackoutDarknessLights(world: World): void {
  let removed = false;
  for (let i = 0; i < W * W; i++) {
    const feature = world.features[i];
    if (feature === Feature.LAMP || feature === Feature.CANDLE) {
      world.features[i] = Feature.NONE;
      removed = true;
    }
  }
  world.light.fill(0);
  if (removed) world.markCellsDirty();
}

function centerX(room: Room): number {
  return worldWrap(room.x + (room.w >> 1));
}

function centerY(room: Room): number {
  return worldWrap(room.y + (room.h >> 1));
}

function worldWrap(v: number): number {
  return ((v % W) + W) % W;
}

function applyRoomLook(world: World, room: Room, wallTex: Tex, floorTex: Tex, fog: number): void {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) {
        world.floorTex[ci] = floorTex;
        world.fog[ci] = Math.max(world.fog[ci], fog);
      } else {
        world.wallTex[ci] = wallTex;
      }
    }
  }
}

function placeRoomLights(world: World, room: Room, lamps: readonly [number, number, Feature][] | undefined): void {
  if (!lamps) return;
  for (const [dx, dy, feature] of lamps) {
    const ci = world.idx(room.x + dx, room.y + dy);
    if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
  }
}

function setFloorFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
}

function setInteriorWall(world: World, room: Room, dx: number, dy: number, wallTex = Tex.VOID_WALL): void {
  const ci = world.idx(room.x + dx, room.y + dy);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.cells[ci] = Cell.WALL;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = wallTex;
  world.features[ci] = Feature.NONE;
}

function decorateDarknessRoom(world: World, room: Room, key: string): void {
  if (key === 'generator') {
    for (let dx = 4; dx <= 12; dx += 4) {
      setFloorFeature(world, room.x + dx, room.y + 5, Feature.MACHINE);
      setFloorFeature(world, room.x + dx, room.y + 7, Feature.APPARATUS);
    }
    setFloorFeature(world, room.x + 14, room.y + 2, Feature.SCREEN);
    return;
  }

  if (key === 'control') {
    setFloorFeature(world, room.x + 3, room.y + 2, Feature.DESK);
    setFloorFeature(world, room.x + 11, room.y + 3, Feature.SCREEN);
    setInteriorWall(world, room, 7, 1, Tex.DARK);
    setInteriorWall(world, room, 7, 2, Tex.DARK);
    setInteriorWall(world, room, 7, 6, Tex.DARK);
    setInteriorWall(world, room, 7, 7, Tex.DARK);
    return;
  }

  if (key === 'toll_gate') {
    for (let dy = 1; dy < room.h - 1; dy++) {
      if (dy === 3 || dy === 4) continue;
      setInteriorWall(world, room, 5, dy);
    }
    setFloorFeature(world, room.x + 2, room.y + 2, Feature.TABLE);
    setFloorFeature(world, room.x + 8, room.y + 5, Feature.APPARATUS);
    return;
  }

  if (key === 'bypass') {
    for (let dx = 3; dx < room.w - 2; dx += 5) {
      setFloorFeature(world, room.x + dx, room.y + 1, Feature.APPARATUS);
    }
    return;
  }

  if (key === 'emergency') {
    setFloorFeature(world, room.x + 4, room.y + 4, Feature.SHELF);
    setFloorFeature(world, room.x + 10, room.y + 4, Feature.SHELF);
  }
}

function connectRoomCenters(world: World, a: Room, b: Room): void {
  carveCorridor(world, centerX(a), centerY(a), centerX(b), centerY(b));
}

function carveDarknessDisc(
  world: World,
  cx: number,
  cy: number,
  r: number,
  floorTex: Tex,
  fog: number,
  roomId = -1,
): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const ci = world.idx(cx + dx, cy + dy);
      if (world.cells[ci] === Cell.LIFT) continue;
      world.cells[ci] = Cell.FLOOR;
      if (world.roomMap[ci] < 0) world.roomMap[ci] = roomId;
      world.floorTex[ci] = floorTex;
      world.fog[ci] = Math.max(world.fog[ci], fog);
    }
  }
}

function carveDarknessPathCells(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radius: number,
  fog: number,
  floorTex = Tex.F_VOID,
): void {
  const ddx = world.delta(ax, bx);
  const ddy = world.delta(ay, by);
  const steps = Math.max(1, Math.abs(ddx), Math.abs(ddy));
  for (let i = 0; i <= steps; i++) {
    const x = world.wrap(Math.round(ax + (ddx * i) / steps));
    const y = world.wrap(Math.round(ay + (ddy * i) / steps));
    carveDarknessDisc(world, x, y, radius, floorTex, fog);
  }
}

function carveDarknessPath(world: World, a: Room, b: Room, radius: number, fog: number, floorTex = Tex.F_VOID): void {
  carveDarknessPathCells(world, centerX(a), centerY(a), centerX(b), centerY(b), radius, fog, floorTex);
}

function softenFogDisc(world: World, cx: number, cy: number, r: number, fog: number): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const ci = world.idx(cx + dx, cy + dy);
      if (world.cells[ci] !== Cell.FLOOR) continue;
      world.fog[ci] = Math.min(world.fog[ci], fog);
    }
  }
}

function markLightIsland(world: World, room: Room, radius: number, fog: number): void {
  softenFogDisc(world, centerX(room), centerY(room), radius, fog);
}

function addDeadLampRow(world: World, a: Room, b: Room): void {
  const ax = centerX(a);
  const ay = centerY(a);
  const ddx = world.delta(ax, centerX(b));
  const ddy = world.delta(ay, centerY(b));
  const steps = Math.max(1, Math.abs(ddx), Math.abs(ddy));
  for (let i = 3; i < steps; i += 4) {
    const x = world.wrap(Math.round(ax + (ddx * i) / steps));
    const y = world.wrap(Math.round(ay + (ddy * i) / steps));
    const ci = world.idx(x, y);
    if (world.cells[ci] === Cell.FLOOR && world.features[ci] === Feature.NONE) {
      world.features[ci] = i % 12 === 3 ? Feature.CANDLE : Feature.APPARATUS;
    }
  }
}

function applyLightRouteGeometry(world: World, roomsByKey: Map<string, Room>): void {
  const entry = roomsByKey.get('entry')!;
  const junction = roomsByKey.get('junction')!;
  const lamp = roomsByKey.get('lamp')!;
  const generator = roomsByKey.get('generator')!;
  const name = roomsByKey.get('name')!;
  const control = roomsByKey.get('control')!;
  const toll = roomsByKey.get('toll')!;
  const tollGate = roomsByKey.get('toll_gate')!;
  const bypass = roomsByKey.get('bypass')!;
  const emergency = roomsByKey.get('emergency')!;
  const trace = roomsByKey.get('trace')!;

  carveDarknessPath(world, entry, junction, 2, 24, Tex.F_CONCRETE);
  carveDarknessPath(world, junction, lamp, 2, 28, Tex.F_CONCRETE);
  carveDarknessPath(world, lamp, generator, 1, 34, Tex.F_CONCRETE);
  carveDarknessPath(world, generator, name, 1, 44);
  carveDarknessPath(world, name, control, 1, 52);
  carveDarknessPath(world, control, trace, 1, 44);

  carveDarknessPath(world, junction, toll, 1, 72);
  carveDarknessPath(world, toll, tollGate, 1, 88);
  carveDarknessPath(world, tollGate, trace, 1, 78);

  carveDarknessPath(world, lamp, bypass, 1, 60);
  carveDarknessPath(world, bypass, emergency, 1, 82);
  carveDarknessPath(world, emergency, trace, 1, 68);
  carveDarknessPath(world, generator, control, 1, 42);
  carveDarknessPath(world, tollGate, emergency, 1, 92);

  addDeadLampRow(world, junction, toll);
  addDeadLampRow(world, bypass, emergency);

  markLightIsland(world, entry, 7, 10);
  markLightIsland(world, junction, 9, 18);
  markLightIsland(world, lamp, 9, 14);
  markLightIsland(world, generator, 8, 16);
  markLightIsland(world, control, 7, 22);
  markLightIsland(world, emergency, 8, 18);
  markLightIsland(world, trace, 8, 22);
}

function setDoorStates(world: World): void {
  for (const door of world.doors.values()) {
    door.state = DoorState.CLOSED;
    door.timer = 0;
  }
}

function paintCorridors(world: World): void {
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.WALL) {
      if (!world.wallTex[i]) world.wallTex[i] = Tex.DARK;
      continue;
    }
    if (!world.floorTex[i]) world.floorTex[i] = Tex.F_CONCRETE;
    if (world.roomMap[i] < 0) world.fog[i] = Math.max(world.fog[i], 30);
  }
  world.markFogDirty();
}

function addLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
}

function dropItem(
  entities: Entity[],
  nextId: { v: number },
  x: number,
  y: number,
  item: Item,
): void {
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
    inventory: [item],
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
  name: string,
  inventory: Item[],
  tags: string[],
): void {
  const id = nextContainerId(world);
  const ci = world.idx(x, y);
  const container: WorldContainer = {
    id,
    x: world.wrap(x),
    y: world.wrap(y),
    floor: FloorLevel.VOID,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind: ContainerKind.SECRET_STASH,
    name,
    inventory,
    capacitySlots: 6,
    access: 'public',
    discovered: true,
    tags,
  };
  world.addContainer(container);
}

function spawnNpc(entities: Entity[], nextId: { v: number }, room: Room, spec: DarknessNpcSpec): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: room.x + spec.dx + 0.5,
    y: room.y + spec.dy + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: spec.speed,
    sprite: spec.occupation,
    name: spec.name,
    isFemale: spec.isFemale,
    needs: freshNeeds(),
    hp: spec.hp,
    maxHp: spec.hp,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: spec.inventory.map(item => ({ ...item })),
    faction: spec.faction,
    occupation: spec.occupation,
    canGiveQuest: true,
    questId: -1,
    money: spec.money,
  });
  return id;
}

function spawnMonster(
  entities: Entity[],
  nextId: { v: number },
  kind: MonsterKind,
  x: number,
  y: number,
  level: number,
  name?: string,
): void {
  const def = MONSTERS[kind];
  const hp = Math.round(scaleMonsterHp(def.hp, level));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, level),
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
    phasing: kind === MonsterKind.SPIRIT,
  });
}

function buildRooms(world: World): { roomsByKey: Map<string, Room>; labels: DarknessRoomLabel[] } {
  const roomsByKey = new Map<string, Room>();
  const labels: DarknessRoomLabel[] = [];

  for (const spec of ROOM_SPECS) {
    const room = stampRoom(world, world.rooms.length, spec.type, spec.x, spec.y, spec.w, spec.h, -1);
    room.name = spec.revealedAtStart ? spec.revealedName : spec.hiddenName;
    applyRoomLook(world, room, Tex.DARK, spec.key === 'trace' ? Tex.F_VOID : Tex.F_CONCRETE, spec.fog ?? 30);
    placeRoomLights(world, room, spec.lamps);
    decorateDarknessRoom(world, room, spec.key);
    roomsByKey.set(spec.key, room);
    labels.push({
      roomId: room.id,
      key: spec.key,
      hiddenName: spec.hiddenName,
      revealedName: spec.revealedName,
      lightCost: spec.lightCost,
      revealedAtStart: spec.revealedAtStart === true,
    });
  }

  const entry = roomsByKey.get('entry')!;
  const junction = roomsByKey.get('junction')!;
  const lamp = roomsByKey.get('lamp')!;
  const generator = roomsByKey.get('generator')!;
  const name = roomsByKey.get('name')!;
  const control = roomsByKey.get('control')!;
  const toll = roomsByKey.get('toll')!;
  const tollGate = roomsByKey.get('toll_gate')!;
  const bypass = roomsByKey.get('bypass')!;
  const emergency = roomsByKey.get('emergency')!;
  const trace = roomsByKey.get('trace')!;

  connectRoomCenters(world, entry, junction);
  connectRoomCenters(world, junction, lamp);
  connectRoomCenters(world, lamp, generator);
  connectRoomCenters(world, generator, name);
  connectRoomCenters(world, lamp, name);
  connectRoomCenters(world, name, control);
  connectRoomCenters(world, control, trace);
  connectRoomCenters(world, name, trace);
  connectRoomCenters(world, junction, toll);
  connectRoomCenters(world, toll, tollGate);
  connectRoomCenters(world, tollGate, trace);
  connectRoomCenters(world, lamp, bypass);
  connectRoomCenters(world, bypass, emergency);
  connectRoomCenters(world, emergency, trace);
  connectRoomCenters(world, generator, control);
  connectRoomCenters(world, tollGate, emergency);
  applyLightRouteGeometry(world, roomsByKey);

  placeDoorAt(world, entry.x - 1, entry.y + (entry.h >> 1), entry.id);
  addLift(world, entry.x - 2, entry.y + (entry.h >> 1), LiftDirection.UP);
  placeDoorAt(world, trace.x + trace.w, trace.y + (trace.h >> 1), trace.id);
  addLift(world, trace.x + trace.w + 1, trace.y + (trace.h >> 1), LiftDirection.DOWN);

  setDoorStates(world);
  sanitizeDoors(world);
  paintCorridors(world);
  return { roomsByKey, labels };
}

function placeContent(world: World, entities: Entity[], nextId: { v: number }, roomsByKey: Map<string, Room>): void {
  for (const spec of NPC_SPECS) {
    const room = roomsByKey.get(spec.roomKey);
    if (room) spawnNpc(entities, nextId, room, spec);
  }

  const entry = roomsByKey.get('entry')!;
  const lamp = roomsByKey.get('lamp')!;
  const generator = roomsByKey.get('generator')!;
  const name = roomsByKey.get('name')!;
  const control = roomsByKey.get('control')!;
  const toll = roomsByKey.get('toll')!;
  const tollGate = roomsByKey.get('toll_gate')!;
  const trace = roomsByKey.get('trace')!;
  const bypass = roomsByKey.get('bypass')!;
  const emergency = roomsByKey.get('emergency')!;

  dropItem(entities, nextId, entry.x + 4, entry.y + 4, {
    defId: 'note',
    count: 1,
    data: 'ТЬМА: стартовый бюджет света - 8. Комната стоит 1-3. Не всякую табличку надо спасать.',
  });
  dropItem(entities, nextId, entry.x + 7, entry.y + 4, { defId: 'flashlight', count: 1 });

  addContainer(world, lamp, lamp.x + 9, lamp.y + 5, 'Ящик Ники: запас света', [
    { defId: 'lamp_bulb', count: 3 },
    { defId: 'fuse', count: 1 },
    {
      defId: 'note',
      count: 1,
      data: 'Зарядов мало. Один откроет подпись комнаты, два удержат Нику рядом, три купят короткий путь.',
    },
  ], ['darkness', 'light_budget', 'lamp_survival']);

  addContainer(world, name, name.x + 10, name.y + 5, 'Карточка имени под лампой', [
    {
      defId: 'personal_file_copy',
      count: 1,
      data: { darknessNameId: DARKNESS_PRESERVED_NAME_ID },
    },
    {
      defId: 'note',
      count: 1,
      data: 'Тамара Белова. Дата рождения читается, пока горит лампа. Без света карточка пустеет.',
    },
  ], ['darkness', 'preserved_name', DARKNESS_PRESERVED_NAME_ID]);

  addContainer(world, generator, generator.x + 14, generator.y + 7, 'Генераторный ящик', [
    { defId: 'fuse', count: 2 },
    { defId: 'lamp_bulb', count: 1 },
    {
      defId: 'note',
      count: 1,
      data: 'Генератор держит свет на островах, но не освещает пошлину. Свет лучше тратить на выбор, а не на страх.',
    },
  ], ['darkness', 'generator_room', 'light_budget']);

  addContainer(world, control, control.x + 2, control.y + 6, 'Пульт аварийных островов', [
    {
      defId: 'note',
      count: 1,
      data: 'Три линии: светлая через имя, короткая через сборщика, длинная через карманы. Все ведут к следу.',
    },
  ], ['darkness', 'route_hint', 'control_room']);

  addContainer(world, toll, toll.x + 2, toll.y + 8, 'Короткий путь за свет', [
    {
      defId: 'note',
      count: 1,
      data: 'Если отдать лампу сборщику, тени расходятся на один проход. Если нет - они остаются голодными.',
    },
  ], ['darkness', 'shadow_toll', 'pay_light']);

  addContainer(world, tollGate, tollGate.x + 8, tollGate.y + 3, 'Щель теневой пошлины', [
    {
      defId: 'note',
      count: 1,
      data: 'Шлюз узкий. Заплатишь светом - тихо. Сохранишь свет - тени услышат шаг.',
    },
  ], ['darkness', 'shadow_toll', 'chokepoint']);

  addContainer(world, bypass, bypass.x + 18, bypass.y + 2, 'Темный обходной тайник', [
    { defId: 'bandage', count: 1 },
    { defId: 'ammo_9mm', count: 8 },
    {
      defId: 'note',
      count: 1,
      data: 'Обход длинный, но свет остается у тебя. Слушай стены, а не таблички.',
    },
  ], ['darkness', 'shadow_toll', 'long_route']);

  addContainer(world, emergency, emergency.x + 5, emergency.y + 4, 'Аварийный карман без ключа', [
    { defId: 'bandage', count: 1 },
    { defId: 'water', count: 1 },
    {
      defId: 'note',
      count: 1,
      data: 'Это не награда, а право ошибиться: переждать темный отсек, затем идти дальше без редкого ключа.',
    },
  ], ['darkness', 'emergency_stash', 'fallback_route']);

  addContainer(world, trace, trace.x + 6, trace.y + 6, 'Отметина возврата', [
    { defId: 'overexposed_photo', count: 1 },
    {
      defId: 'note',
      count: 1,
      data: 'Возвратный след: living/ministry/yakov. Один сохраненный факт разрешен к переносу.',
    },
  ], ['darkness', 'return_trace', 'living_hook', 'ministry_hook', 'yakov_hook']);

  spawnMonster(entities, nextId, MonsterKind.SHADOW, toll.x + 11, toll.y + 3, 12, 'Тень пошлины');
  spawnMonster(entities, nextId, MonsterKind.SHADOW, toll.x + 12, toll.y + 8, 12, 'Тень сдачи');
  spawnMonster(entities, nextId, MonsterKind.SHADOW, tollGate.x + 6, tollGate.y + 2, 12, 'Тень турникета');
  spawnMonster(entities, nextId, MonsterKind.SHADOW, emergency.x + 10, emergency.y + 5, 11, 'Тень длинного обхода');
  spawnMonster(entities, nextId, MonsterKind.SHADOW, name.x + 3, name.y + 8, 11, 'Тень без фамилии');
  spawnMonster(entities, nextId, MonsterKind.LAMPOVY, generator.x + 6, generator.y + 5, 12, 'Ламповый у генератора');
  spawnMonster(entities, nextId, MonsterKind.EYE, trace.x + 9, trace.y + 2, 13, 'Глаз возврата');
}

function applyDarknessZones(world: World): void {
  generateZones(world);
  for (const zone of world.zones) {
    zone.faction = ZoneFaction.SAMOSBOR;
    zone.fogged = true;
    zone.level = 12;
    zone.hasLift = false;
  }
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.LIFT) world.zones[world.zoneMap[i]].hasLift = true;
  }
}

function initialState(labels: DarknessRoomLabel[]): DarknessFloorState {
  return {
    routeId: DARKNESS_DESIGN_FLOOR_ID,
    z: DARKNESS_FUTURE_Z,
    lightBudget: 8,
    revealedRoomIds: labels.filter(label => label.revealedAtStart).map(label => label.roomId),
    preservedNameId: null,
    shadowTollState: 'unpaid',
    roomLabels: labels,
    quests: QUESTS.map(q => ({ ...q, choices: [...q.choices] })),
    lateWarnings: DARKNESS_LATE_WARNINGS.map(warning => ({ ...warning, tags: [...warning.tags] })),
    shortcutCueIds: ['darkness_shadow_toll_shortcut', 'darkness_return_trace_warning'],
    returnTracePublished: false,
  };
}

function darknessRoomByKey(world: World, key: string): Room | null {
  const idx = ROOM_SPECS.findIndex(spec => spec.key === key);
  return idx >= 0 ? world.rooms[idx] ?? null : null;
}

function carveLightPocket(world: World, cx: number, cy: number, radius: number, fog: number, lamp: Feature): void {
  carveDarknessDisc(world, cx, cy, radius, Tex.F_CONCRETE, fog);
  softenFogDisc(world, cx, cy, radius + 2, fog);
  setFloorFeature(world, cx, cy, lamp);
  setFloorFeature(world, cx + 2, cy + 1, Feature.SHELF);
}

export function expandDarknessRouteGeometry(world: World, entities: Entity[], rng: () => number): void {
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.WALL) {
      world.wallTex[i] = (i & 7) === 0 ? Tex.VOID_WALL : Tex.DARK;
      world.floorTex[i] = Tex.F_VOID;
      continue;
    }
    if (world.roomMap[i] < 0 && world.cells[i] === Cell.FLOOR) {
      world.floorTex[i] = Tex.F_VOID;
      world.fog[i] = Math.max(world.fog[i], 58);
    }
  }

  const entry = darknessRoomByKey(world, 'entry');
  const junction = darknessRoomByKey(world, 'junction');
  const generator = darknessRoomByKey(world, 'generator');
  const tollGate = darknessRoomByKey(world, 'toll_gate');
  const emergency = darknessRoomByKey(world, 'emergency');
  const trace = darknessRoomByKey(world, 'trace');
  if (!entry || !junction || !generator || !tollGate || !emergency || !trace) return;

  const westPocket = { x: world.wrap(centerX(entry) - 24), y: world.wrap(centerY(entry) + 12) };
  const northPocket = { x: world.wrap(centerX(generator) + 18), y: world.wrap(centerY(generator) - 18) };
  const southPocket = { x: world.wrap(centerX(emergency) + 18), y: world.wrap(centerY(emergency) + 15) };
  const tracePocket = { x: world.wrap(centerX(trace) + 24), y: world.wrap(centerY(trace) + 10) };

  carveLightPocket(world, westPocket.x, westPocket.y, 6, 18, Feature.CANDLE);
  carveLightPocket(world, northPocket.x, northPocket.y, 7, 22, Feature.LAMP);
  carveLightPocket(world, southPocket.x, southPocket.y, 6, 26, Feature.CANDLE);
  carveLightPocket(world, tracePocket.x, tracePocket.y, 6, 24, Feature.CANDLE);

  carveDarknessPathCells(world, centerX(entry), centerY(entry), westPocket.x, westPocket.y, 1, 48);
  carveDarknessPathCells(world, centerX(generator), centerY(generator), northPocket.x, northPocket.y, 1, 54);
  carveDarknessPathCells(world, northPocket.x, northPocket.y, centerX(trace), centerY(trace), 1, 72);
  carveDarknessPathCells(world, centerX(emergency), centerY(emergency), southPocket.x, southPocket.y, 1, 82);
  carveDarknessPathCells(world, southPocket.x, southPocket.y, tracePocket.x, tracePocket.y, 1, 90);
  carveDarknessPathCells(world, tracePocket.x, tracePocket.y, centerX(trace), centerY(trace), 1, 62);
  addDeadLampRow(world, junction, tollGate);

  const nextId = { v: entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1 };
  const shadowCount = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < shadowCount; i++) {
    const x = i % 2 === 0 ? southPocket.x + Math.floor(rng() * 5) - 2 : tollGate.x + 2 + Math.floor(rng() * 6);
    const y = i % 2 === 0 ? southPocket.y + Math.floor(rng() * 5) - 2 : tollGate.y + 2 + Math.floor(rng() * 4);
    spawnMonster(entities, nextId, MonsterKind.SHADOW, world.wrap(x), world.wrap(y), 11 + (i & 1), 'Тень темного маршрута');
  }

  world.markFogDirty();
}

export function getDarknessState(world: World): DarknessFloorState | null {
  return darknessStateByWorld.get(world) ?? null;
}

export function publishDarknessLateWarning(
  state: GameState,
  warningId: DarknessLateWarningId,
  options: DarknessReturnTraceOptions = {},
): WorldEvent {
  const warning = DARKNESS_LATE_WARNINGS.find(item => item.id === warningId);
  return publishEvent(state, {
    type: 'samosbor_warning',
    floor: state.currentFloor,
    zoneId: options.sourceZoneId,
    roomId: options.sourceRoomId,
    x: options.x,
    y: options.y,
    actorName: 'Темный отсек',
    targetName: warning?.label,
    severity: 4,
    privacy: 'secret',
    tags: ['darkness', 'late_warning', warningId, ...(warning?.tags ?? [])],
    data: {
      routeId: DARKNESS_DESIGN_FLOOR_ID,
      z: DARKNESS_FUTURE_Z,
      warningId,
      warning: warning?.warning,
    },
  });
}

export function publishDarknessReturnTrace(
  state: GameState,
  options: DarknessReturnTraceOptions = {},
): WorldEvent {
  return publishEvent(state, {
    type: 'rumor_observed',
    floor: state.currentFloor,
    zoneId: options.sourceZoneId,
    roomId: options.sourceRoomId,
    x: options.x,
    y: options.y,
    actorName: 'Темный отсек',
    targetName: 'Жилая зона / Министерство / Яков',
    severity: 4,
    privacy: 'secret',
    tags: ['darkness', 'return_trace', 'living_hook', 'ministry_hook', 'yakov_hook'],
    data: {
      routeId: DARKNESS_DESIGN_FLOOR_ID,
      z: DARKNESS_FUTURE_Z,
      preservedNameId: options.preservedNameId ?? DARKNESS_PRESERVED_NAME_ID,
      fact: 'one_name_returned_from_darkness',
    },
  });
}

function registerDarknessRouteCues(world: World, roomsByKey: Map<string, Room>): void {
  const toll = roomsByKey.get('toll');
  const tollGate = roomsByKey.get('toll_gate');
  const control = roomsByKey.get('control');
  const trace = roomsByKey.get('trace');
  if (toll && tollGate) {
    const markerX = toll.x + 2.5;
    const markerY = toll.y + 8.5;
    const targetX = tollGate.x + 6.5;
    const targetY = tollGate.y + 3.5;
    const markerCell = world.idx(Math.floor(markerX), Math.floor(markerY));
    registerRouteCue(world, {
      id: 'darkness_shadow_toll_shortcut',
      x: markerX,
      y: markerY,
      targetX,
      targetY,
      floor: FloorLevel.VOID,
      roomId: toll.id,
      targetRoomId: tollGate.id,
      zoneId: world.zoneMap[markerCell],
      label: 'теневая пошлина',
      hint: 'короткий путь просит свет',
      targetName: 'шлюз теневой пошлины',
      color: '#88f',
      tags: ['darkness', 'shadow_toll', 'shortcut', 'light_budget'],
      toneSeed: toll.id * 2003 + tollGate.id,
      radius: 8,
      targetRadius: 3,
      cooldownSec: 42,
      heardText: 'Сборщик тени показывает короткий путь: заплатить светом, драться или идти обходом.',
      followedText: 'Шлюз пошлины найден. Быстро пройти можно, но свет больше не вернется.',
      ignoredText: 'Теневая пошлина осталась позади. Длинный обход сохранит свет, но съест время.',
    });
  }

  if (control && trace) {
    const markerX = control.x + 11.5;
    const markerY = control.y + 3.5;
    const targetX = trace.x + 6.5;
    const targetY = trace.y + 4.5;
    const markerCell = world.idx(Math.floor(markerX), Math.floor(markerY));
    registerRouteCue(world, {
      id: 'darkness_return_trace_warning',
      x: markerX,
      y: markerY,
      targetX,
      targetY,
      floor: FloorLevel.VOID,
      roomId: control.id,
      targetRoomId: trace.id,
      zoneId: world.zoneMap[markerCell],
      label: 'возвратный след',
      hint: 'поздний факт выйдет наружу',
      targetName: 'комната возвратного следа',
      color: '#bbf',
      tags: ['darkness', 'return_trace', 'late_warning', 'living_hook'],
      toneSeed: control.id * 2011 + trace.id,
      radius: 8,
      targetRadius: 3,
      cooldownSec: 44,
      heardText: 'Пульт аварийного света предупреждает: возвратный след станет фактом для верхних этажей.',
      followedText: 'Комната следа найдена. Забрать кадр значит вынести темный отсек в другой маршрут.',
      ignoredText: 'Возвратный след остался в темноте. Верхние этажи пока не знают это имя.',
    });
  }
}

export function generateDarknessDesignFloor(): DarknessDesignGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };

  world.wallTex.fill(Tex.DARK);
  world.floorTex.fill(Tex.F_CONCRETE);

  const { roomsByKey, labels } = buildRooms(world);
  const entry = roomsByKey.get('entry')!;
  const spawnX = entry.x + 2.5;
  const spawnY = entry.y + (entry.h >> 1) + 0.5;

  applyDarknessZones(world);
  placeContent(world, entities, nextId, roomsByKey);
  registerDarknessRouteCues(world, roomsByKey);
  ensureConnectivity(world, spawnX, spawnY);
  blackoutDarknessLights(world);

  const darknessState = initialState(labels);
  darknessStateByWorld.set(world, darknessState);

  return { world, entities, spawnX, spawnY, darknessState };
}

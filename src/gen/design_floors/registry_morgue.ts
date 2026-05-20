/* -- Design floor: Морг регистраций ----------------------------
 * Future route id registry_morgue, z=-16. Self-contained authored
 * generator; an integrator can wire it into FloorRun later.
 */

import {
  W,
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
  ZoneFaction,
  type Entity,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import {
  generateZones,
  placeDoor,
  placeDoorAt,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import { genLog } from '../log';
import type { FloorGeneration } from '../floor_manifest';

export const REGISTRY_MORGUE_ROUTE_ID = 'registry_morgue' as const;
export const REGISTRY_MORGUE_FUTURE_Z = -16 as const;
export const REGISTRY_MORGUE_BASE_FLOOR = FloorLevel.MINISTRY;
export const REGISTRY_MORGUE_DEBUG_ENTRY = 'design_floor.registry_morgue' as const;

type NextId = { v: number };
type MorgueDoorSide = 'north' | 'south' | 'west' | 'east';

const NPC_DEFS: Record<string, PlotNpcDef> = {
  morgue_registrar_faina: {
    name: 'Фаина Реестровая',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SECRETARY,
    sprite: Occupation.SECRETARY,
    hp: 105, maxHp: 105, money: 90, speed: 0.7,
    inventory: [
      { defId: 'official_quarantine_clearance', count: 1 },
      { defId: 'blank_form', count: 2 },
      { defId: 'ink_bottle', count: 1 },
    ],
    talkLines: [
      'Здесь не спорят, кто умер. Здесь смотрят, какая строка в журнале осталась открытой.',
      'Бирка без книги ничего не значит. Книга без бирки значит слишком много.',
      'Холодильная камера держит туман лучше людей, но внутри всегда есть цена.',
      'Не подписывайте пустое свидетельство. Пустая графа быстро получает чужой пульс.',
      'Если запись исправить правильно, Райсовет признает новый факт раньше человека.',
    ],
    talkLinesPost: [
      'Запись легла ровно. Теперь дверь открывается на другое имя.',
      'Не носите две справки рядом. Они начинают сверять вас между собой.',
    ],
  },

  morgue_orderly_stepan: {
    name: 'Степан Носильный',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.LOCKSMITH,
    sprite: Occupation.LOCKSMITH,
    hp: 140, maxHp: 140, money: 35, speed: 0.8,
    inventory: [
      { defId: 'crowbar', count: 1 },
      { defId: 'container_key_label', count: 1 },
    ],
    talkLines: [
      'Я тележки считаю по колесам. Сегодня одно колесо вернулось без тележки.',
      'В грязной камере человек попросил свою бирку слишком вежливо.',
      'Бирку лучше не класть в карман с пропуском. Потом оба спорят, кто из вас живой.',
      'Не подходите близко к тому, кто сам знает номер ящика.',
    ],
    talkLinesPost: [
      'Теперь хотя бы ясно, кого не было.',
      'Бирки снова молчат. Для морга это хороший звук.',
    ],
  },

  morgue_relative_ira: {
    name: 'Ира Заименованная',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.HOUSEWIFE,
    sprite: Occupation.HOUSEWIFE,
    hp: 70, maxHp: 70, money: 18, speed: 0.65,
    inventory: [
      { defId: 'tea', count: 1 },
      { defId: 'sealed_complaint', count: 1 },
    ],
    talkLines: [
      'Мне не нужны лекарства. Мне нужна фамилия, которую не вычеркнули.',
      'Если найдете личное дело, я узнаю, кого мне оплакивать в очереди.',
      'Пустая бирка хуже пустого ящика. Ящик хотя бы честно молчит.',
      'Корешок без дела не возвращает человека. Но без корешка его даже искать не будут.',
    ],
    talkLinesPost: [
      'Имя вернулось. Этого мало, но теперь хотя бы есть кому молчать.',
      'Возьмите копию дела. Я больше не хочу быть единственным свидетелем.',
    ],
  },

  morgue_quarantine_sanitar: {
    name: 'Санитар Крутов',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 220, maxHp: 220, money: 75, speed: 0.95,
    inventory: [
      { defId: 'pipe', count: 1 },
      { defId: 'bandage', count: 1 },
      { defId: 'denunciation', count: 1 },
    ],
    talkLines: [
      'Медицинский шкаф открывается справкой, ключом или преступлением.',
      'Мне нужна чистая карантинная бумага. Тогда выдача станет законной.',
      'Если полезете в шкаф сами, журнал назовет это кражей. Я назову громче.',
      'Справка без адресата заражает очередь быстрее кашля.',
    ],
    talkLinesPost: [
      'Справка чистая. Лекарства теперь грязнятся только руками.',
      'Не тратьте ампулу на смелость. Смелость плохо документируется.',
    ],
  },
};

registerSideQuest('morgue_registrar_faina', NPC_DEFS.morgue_registrar_faina, [
  {
    id: 'morgue_find_tag',
    giverNpcId: 'morgue_registrar_faina',
    type: QuestType.FETCH,
    desc: 'Фаина Реестровая: «Верните бирку из холодной камеры. Без нее живого человека можно закрыть бумагой, а потом искать уже по форме.»',
    targetItem: 'container_key_label', targetCount: 1,
    rewardItem: 'official_quarantine_clearance', rewardCount: 1,
    extraRewards: [{ defId: 'clean_health_cert', count: 1 }],
    relationDelta: 14, xpReward: 65, moneyReward: 55,
  },
  {
    id: 'morgue_swap_certificate',
    giverNpcId: 'morgue_registrar_faina',
    type: QuestType.FETCH,
    desc: 'Фаина Реестровая: «Принесите акт о пропавшей записи. Я оформлю смерть так, что Райсовет выдаст допуск человеку у окна. Пустую строку не трогайте.»',
    targetItem: 'record_exposure_notice', targetCount: 1,
    rewardItem: 'archive_access_permit', rewardCount: 1,
    extraRewards: [{ defId: 'passport_stub', count: 1 }],
    relationDelta: -4, xpReward: 80, moneyReward: 95,
  },
]);

registerSideQuest('morgue_orderly_stepan', NPC_DEFS.morgue_orderly_stepan, [
  {
    id: 'morgue_missing_body',
    giverNpcId: 'morgue_orderly_stepan',
    type: QuestType.KILL,
    desc: 'Степан Носильный: «В зараженной камере ходит человек с чужой биркой. Проверьте дистанцией и уберите подмену.»',
    targetMonsterKind: MonsterKind.NELYUD,
    killNeeded: 1,
    rewardItem: 'personal_file_copy', rewardCount: 1,
    extraRewards: [{ defId: 'filter_receipt', count: 1 }],
    relationDelta: 16, xpReward: 95, moneyReward: 90,
  },
]);

registerSideQuest('morgue_relative_ira', NPC_DEFS.morgue_relative_ira, [
  {
    id: 'morgue_name_return',
    giverNpcId: 'morgue_relative_ira',
    type: QuestType.FETCH,
    desc: 'Ира Заименованная: «Найдите пропавшее личное дело. Мне нужен не ящик, а имя, пока графа не стала чужой.»',
    targetItem: 'missing_record_file', targetCount: 1,
    rewardItem: 'sealed_complaint', rewardCount: 1,
    extraRewards: [{ defId: 'tea', count: 1 }],
    relationDelta: 18, xpReward: 70, moneyReward: 35,
  },
]);

registerSideQuest('morgue_quarantine_sanitar', NPC_DEFS.morgue_quarantine_sanitar, [
  {
    id: 'morgue_medicine_lock',
    giverNpcId: 'morgue_quarantine_sanitar',
    type: QuestType.FETCH,
    desc: 'Санитар Крутов: «Принесите чистую карантинную справку. Открою медшкаф законно. Иначе это будет кража.»',
    targetItem: 'official_quarantine_clearance', targetCount: 1,
    rewardItem: 'sanitary_kit', rewardCount: 1,
    extraRewards: [{ defId: 'antibiotic', count: 1 }],
    relationDelta: 12, xpReward: 75, moneyReward: 60,
  },
]);

function setCellFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
}

function createDesignRoom(
  world: World,
  id: number,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
  sealed = false,
): Room {
  const room = stampRoom(world, id, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  room.sealed = sealed;

  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] === Cell.WALL) {
        world.wallTex[ci] = wallTex;
        if (sealed) world.hermoWall[ci] = 1;
      }
    }
  }
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      world.floorTex[ci] = floorTex;
    }
  }
  return room;
}

function linkRooms(world: World, a: Room, b: Room, state: DoorState): void {
  const before = a.doors.length;
  const hermetic = state === DoorState.HERMETIC_OPEN || state === DoorState.HERMETIC_CLOSED;
  placeDoor(world, a, b, '', hermetic);
  if (a.doors.length <= before) return;
  const doorIdx = a.doors[a.doors.length - 1];
  const door = world.doors.get(doorIdx);
  if (!door) return;
  door.state = state;
}

function carveMorgueCell(world: World, x: number, y: number, floorTex: Tex, wallTex: Tex, roomId = -1): void {
  const ci = world.idx(x, y);
  const prev = world.cells[ci];
  if (prev !== Cell.LIFT && prev !== Cell.DOOR) world.cells[ci] = Cell.FLOOR;
  if (roomId >= 0 || world.roomMap[ci] < 0) world.roomMap[ci] = roomId;
  world.floorTex[ci] = floorTex;
  if (prev === Cell.WALL || prev === Cell.ABYSS) world.features[ci] = Feature.NONE;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const wi = world.idx(x + dx, y + dy);
      if (world.cells[wi] === Cell.WALL) world.wallTex[wi] = wallTex;
    }
  }
}

function carveMorgueLine(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  let x = ax;
  let y = ay;
  const sx = bx === ax ? 0 : bx > ax ? 1 : -1;
  const sy = by === ay ? 0 : by > ay ? 1 : -1;
  while (x !== bx) {
    carveMorgueBand(world, x, y, width, floorTex, wallTex);
    x += sx;
  }
  while (y !== by) {
    carveMorgueBand(world, x, y, width, floorTex, wallTex);
    y += sy;
  }
  carveMorgueBand(world, x, y, width, floorTex, wallTex);
}

function carveMorgueBand(world: World, x: number, y: number, width: number, floorTex: Tex, wallTex: Tex): void {
  for (let dy = -width; dy <= width; dy++) {
    for (let dx = -width; dx <= width; dx++) carveMorgueCell(world, x + dx, y + dy, floorTex, wallTex);
  }
}

function carveMorgueFrame(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  width: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  carveMorgueLine(world, x, y, x + w, y, width, floorTex, wallTex);
  carveMorgueLine(world, x, y + h, x + w, y + h, width, floorTex, wallTex);
  carveMorgueLine(world, x, y, x, y + h, width, floorTex, wallTex);
  carveMorgueLine(world, x + w, y, x + w, y + h, width, floorTex, wallTex);
}

function addMorgueGeometryRoom(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
  sealed = false,
): Room {
  return createDesignRoom(world, world.rooms.length, type, x, y, w, h, name, wallTex, floorTex, sealed);
}

function openMorgueDoor(
  world: World,
  room: Room,
  side: MorgueDoorSide,
  offset: number,
  state: DoorState,
  targetX?: number,
  targetY?: number,
): void {
  const ox = Math.max(1, Math.min(room.w - 2, offset));
  const oy = Math.max(1, Math.min(room.h - 2, offset));
  let wx = room.x;
  let wy = room.y;
  let cx = room.x;
  let cy = room.y;

  switch (side) {
    case 'north':
      wx = room.x + ox;
      wy = room.y - 1;
      cx = wx;
      cy = wy - 1;
      break;
    case 'south':
      wx = room.x + ox;
      wy = room.y + room.h;
      cx = wx;
      cy = wy + 1;
      break;
    case 'west':
      wx = room.x - 1;
      wy = room.y + oy;
      cx = wx - 1;
      cy = wy;
      break;
    case 'east':
      wx = room.x + room.w;
      wy = room.y + oy;
      cx = wx + 1;
      cy = wy;
      break;
  }

  carveMorgueCell(world, cx, cy, Tex.F_TILE, room.wallTex);
  placeDoorAt(world, wx, wy, room.id);
  const door = world.doors.get(world.idx(wx, wy));
  if (door) door.state = state;
  if (targetX !== undefined && targetY !== undefined) {
    carveMorgueLine(world, cx, cy, targetX, targetY, 0, Tex.F_TILE, room.wallTex);
  }
}

function dressDrawerCorridor(world: World, y: number, fromX: number, toX: number): void {
  for (let x = fromX; x <= toX; x += 6) {
    setCellFeature(world, x, y - 1, Feature.SHELF);
    setCellFeature(world, x + 3, y + 1, Feature.SHELF);
    if (x % 24 === 0) setCellFeature(world, x, y, Feature.LAMP);
  }
}

function dressConveyorSpine(world: World): void {
  for (let x = 92; x <= 932; x += 12) {
    setCellFeature(world, x, 516, Feature.MACHINE);
    if (x % 48 === 8) setCellFeature(world, x + 4, 514, Feature.DESK);
  }
  for (let y = 304; y <= 720; y += 32) {
    setCellFeature(world, 512, y, Feature.SCREEN);
  }
}

function dressDrawerRoom(world: World, room: Room, seed: number): void {
  for (let dx = 2; dx < room.w - 2; dx += 4) {
    setCellFeature(world, room.x + dx, room.y + 1, Feature.SHELF);
    setCellFeature(world, room.x + dx, room.y + room.h - 2, Feature.SHELF);
  }
  setCellFeature(world, room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2), Feature.BED);
  if (seed % 3 === 0) setCellFeature(world, room.x + room.w - 3, room.y + 2, Feature.LAMP);
}

function dressAutopsyBay(world: World, room: Room): void {
  for (let dx = 5; dx < room.w - 4; dx += 12) {
    setCellFeature(world, room.x + dx, room.y + Math.floor(room.h / 2), Feature.BED);
    setCellFeature(world, room.x + dx + 3, room.y + Math.floor(room.h / 2), Feature.APPARATUS);
  }
  for (let dx = 3; dx < room.w - 2; dx += 10) setCellFeature(world, room.x + dx, room.y + 2, Feature.SINK);
  setCellFeature(world, room.x + room.w - 3, room.y + room.h - 3, Feature.LAMP);
}

function dressRegistryCounter(world: World, room: Room): void {
  for (let dx = 2; dx < room.w - 2; dx++) setCellFeature(world, room.x + dx, room.y + 3, Feature.DESK);
  for (let dx = 3; dx < room.w - 3; dx += 4) setCellFeature(world, room.x + dx, room.y + 5, Feature.CHAIR);
  for (let dy = 2; dy < room.h - 2; dy += 3) setCellFeature(world, room.x + room.w - 2, room.y + dy, Feature.SHELF);
  setCellFeature(world, room.x + 2, room.y + room.h - 3, Feature.SCREEN);
}

function dressFrostVault(world: World, room: Room): void {
  for (let dy = 2; dy < room.h - 2; dy += 3) {
    setCellFeature(world, room.x + 2, room.y + dy, Feature.SHELF);
    setCellFeature(world, room.x + room.w - 3, room.y + dy, Feature.SHELF);
  }
  for (let dx = 7; dx < room.w - 5; dx += 10) setCellFeature(world, room.x + dx, room.y + Math.floor(room.h / 2), Feature.BED);
  setCellFeature(world, room.x + Math.floor(room.w / 2), room.y + 2, Feature.LAMP);
}

function buildDrawerCanyon(world: World, rng: () => number): void {
  const rows = [
    { roomY: 282, corridorY: 298, door: 'south' as MorgueDoorSide },
    { roomY: 334, corridorY: 350, door: 'south' as MorgueDoorSide },
    { roomY: 386, corridorY: 402, door: 'south' as MorgueDoorSide },
    { roomY: 620, corridorY: 616, door: 'north' as MorgueDoorSide },
    { roomY: 672, corridorY: 668, door: 'north' as MorgueDoorSide },
    { roomY: 724, corridorY: 720, door: 'north' as MorgueDoorSide },
  ];

  for (const row of rows) {
    carveMorgueLine(world, 76, row.corridorY, 948, row.corridorY, 1, Tex.F_TILE, Tex.HERMO_WALL);
    dressDrawerCorridor(world, row.corridorY, 84, 940);
    for (let x = 96; x <= 872; x += 112) {
      const room = addMorgueGeometryRoom(
        world,
        RoomType.STORAGE,
        x + Math.floor(rng() * 5),
        row.roomY,
        30 + Math.floor(rng() * 5),
        12,
        row.roomY < 512 ? 'Северная стена ящиков' : 'Южная стена ящиков',
        Tex.HERMO_WALL,
        Tex.F_TILE,
        true,
      );
      dressDrawerRoom(world, room, room.id);
      openMorgueDoor(world, room, row.door, Math.floor(room.w / 2), DoorState.CLOSED, room.x + Math.floor(room.w / 2), row.corridorY);
    }
  }
}

function buildAutopsyBays(world: World): void {
  const specs = [
    { x: 128, y: 454, side: 'south' as MorgueDoorSide },
    { x: 256, y: 454, side: 'south' as MorgueDoorSide },
    { x: 704, y: 454, side: 'south' as MorgueDoorSide },
    { x: 832, y: 454, side: 'south' as MorgueDoorSide },
    { x: 128, y: 548, side: 'north' as MorgueDoorSide },
    { x: 256, y: 548, side: 'north' as MorgueDoorSide },
    { x: 704, y: 548, side: 'north' as MorgueDoorSide },
    { x: 832, y: 548, side: 'north' as MorgueDoorSide },
  ];
  for (const spec of specs) {
    const room = addMorgueGeometryRoom(world, RoomType.MEDICAL, spec.x, spec.y, 48, 22, 'Аутопсийная бухта', Tex.TILE_W, Tex.F_TILE);
    dressAutopsyBay(world, room);
    openMorgueDoor(world, room, spec.side, Math.floor(room.w / 2), DoorState.CLOSED, room.x + Math.floor(room.w / 2), 516);
  }
}

function buildRegistryCounters(world: World): void {
  const upper = addMorgueGeometryRoom(world, RoomType.OFFICE, 610, 486, 68, 22, 'Стойка юридической смерти', Tex.MARBLE, Tex.F_PARQUET);
  const lower = addMorgueGeometryRoom(world, RoomType.OFFICE, 346, 526, 66, 22, 'Стол сверки живых фамилий', Tex.MARBLE, Tex.F_PARQUET);
  dressRegistryCounter(world, upper);
  dressRegistryCounter(world, lower);
  openMorgueDoor(world, upper, 'south', Math.floor(upper.w / 2), DoorState.CLOSED, upper.x + Math.floor(upper.w / 2), 516);
  openMorgueDoor(world, lower, 'north', Math.floor(lower.w / 2), DoorState.CLOSED, lower.x + Math.floor(lower.w / 2), 516);
}

function buildFrostVaults(world: World): void {
  const west = addMorgueGeometryRoom(world, RoomType.STORAGE, 184, 506, 44, 30, 'Фрост-капсула повторной смерти', Tex.HERMO_WALL, Tex.F_TILE, true);
  const east = addMorgueGeometryRoom(world, RoomType.STORAGE, 796, 506, 46, 30, 'Фрост-архив безымянных', Tex.HERMO_WALL, Tex.F_TILE, true);
  dressFrostVault(world, west);
  dressFrostVault(world, east);
  openMorgueDoor(world, west, 'east', Math.floor(west.h / 2), DoorState.HERMETIC_CLOSED, 240, 516);
  openMorgueDoor(world, east, 'west', Math.floor(east.h / 2), DoorState.HERMETIC_CLOSED, 784, 516);
}

function carveTagSwitchbacks(world: World): void {
  const north = [
    [564, 516], [564, 460], [612, 460], [612, 424], [564, 424], [564, 388], [612, 388], [612, 350], [564, 350], [564, 298],
  ];
  const south = [
    [460, 516], [460, 574], [412, 574], [412, 616], [460, 616], [460, 668], [412, 668], [412, 720],
  ];
  for (let i = 1; i < north.length; i++) carveMorgueLine(world, north[i - 1][0], north[i - 1][1], north[i][0], north[i][1], 1, Tex.F_TILE, Tex.HERMO_WALL);
  for (let i = 1; i < south.length; i++) carveMorgueLine(world, south[i - 1][0], south[i - 1][1], south[i][0], south[i][1], 1, Tex.F_TILE, Tex.HERMO_WALL);
}

export function expandRegistryMorgueGeometry(world: World, rng: () => number): void {
  buildDrawerCanyon(world, rng);
  buildAutopsyBays(world);
  buildRegistryCounters(world);
  buildFrostVaults(world);

  carveMorgueLine(world, 72, 516, 952, 516, 2, Tex.F_TILE, Tex.METAL);
  carveMorgueLine(world, 116, 476, 908, 476, 1, Tex.F_TILE, Tex.TILE_W);
  carveMorgueLine(world, 116, 556, 908, 556, 1, Tex.F_TILE, Tex.TILE_W);
  carveMorgueLine(world, 116, 476, 116, 556, 1, Tex.F_TILE, Tex.TILE_W);
  carveMorgueLine(world, 908, 476, 908, 556, 1, Tex.F_TILE, Tex.TILE_W);
  carveMorgueLine(world, 512, 260, 512, 780, 1, Tex.F_TILE, Tex.HERMO_WALL);
  carveMorgueFrame(world, 64, 260, 896, 194, 2, Tex.F_TILE, Tex.HERMO_WALL);
  carveMorgueFrame(world, 64, 588, 896, 194, 2, Tex.F_TILE, Tex.HERMO_WALL);
  carveMorgueLine(world, 64, 358, 960, 358, 1, Tex.F_TILE, Tex.HERMO_WALL);
  carveMorgueLine(world, 64, 674, 960, 674, 1, Tex.F_TILE, Tex.HERMO_WALL);
  carveMorgueLine(world, 240, 260, 240, 782, 1, Tex.F_TILE, Tex.TILE_W);
  carveMorgueLine(world, 784, 260, 784, 782, 1, Tex.F_TILE, Tex.TILE_W);
  carveTagSwitchbacks(world);
  dressConveyorSpine(world);
}

function placeDesignLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
  const bi = world.idx(x + 1, y);
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

function addDrop(
  entities: Entity[],
  nextId: NextId,
  x: number,
  y: number,
  defId: string,
  count = 1,
  data?: unknown,
): void {
  entities.push({
    id: nextId.v++, type: EntityType.ITEM_DROP,
    x: x + 0.5, y: y + 0.5,
    angle: 0, pitch: 0,
    alive: true, speed: 0, sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count, data }],
  });
}

function spawnMorgueNpc(
  entities: Entity[],
  nextId: NextId,
  def: PlotNpcDef,
  plotNpcId: string,
  x: number,
  y: number,
  canGiveQuest = true,
  weapon?: string,
): Entity {
  const npc: Entity = {
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true, speed: def.speed, sprite: def.sprite,
    name: def.name, isFemale: def.isFemale,
    needs: freshNeeds(), hp: def.hp, maxHp: def.maxHp, money: def.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    weapon,
    faction: def.faction, occupation: def.occupation,
    plotNpcId, canGiveQuest, questId: -1,
    isTraveler: false,
  };
  entities.push(npc);
  return npc;
}

function spawnMorgueMonster(
  world: World,
  entities: Entity[],
  nextId: NextId,
  x: number,
  y: number,
  kind: MonsterKind,
  name: string,
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  entities.push({
    id: nextId.v++, type: EntityType.MONSTER,
    x: x + 0.5, y: y + 0.5,
    angle: Math.random() * Math.PI * 2, pitch: 0,
    alive: true, speed: def.speed,
    sprite: monsterSpr(kind),
    name,
    hp: def.hp, maxHp: def.hp,
    monsterKind: kind, attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
  });
  world.stamp(x, y, 0.5, 0.5, 3, 0.22, 7100 + kind, 82, 88, 94, false);
}

function addMorgueContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: WorldContainer['inventory'],
  tags: string[],
  faction: Faction,
  owner?: Entity,
): void {
  world.addContainer({
    id: world.containers.length + 1,
    x,
    y,
    floor: REGISTRY_MORGUE_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory,
    capacitySlots: Math.max(6, inventory.length + 3),
    ownerNpcId: owner?.id,
    ownerName: owner?.name,
    faction,
    access,
    lockDifficulty: access === 'locked' || access === 'owner' ? 4 : undefined,
    discovered: true,
    tags: [REGISTRY_MORGUE_ROUTE_ID, 'morgue', ...tags],
  });
}

function decorateRegistryMorgue(
  world: World,
  rooms: {
    reception: Room;
    washing: Room;
    tagRoom: Room;
    cold: Room;
    ledger: Room;
    contaminated: Room;
  },
): void {
  const { reception, washing, tagRoom, cold, ledger, contaminated } = rooms;

  for (let dx = 2; dx < reception.w - 2; dx++) setCellFeature(world, reception.x + dx, reception.y + 3, Feature.DESK);
  for (let dx = 2; dx < reception.w - 2; dx += 3) setCellFeature(world, reception.x + dx, reception.y + 4, Feature.CHAIR);
  setCellFeature(world, reception.x + reception.w - 2, reception.y + 1, Feature.LAMP);
  setCellFeature(world, reception.x + 2, reception.y + reception.h - 2, Feature.SCREEN);

  for (let dx = 2; dx < washing.w - 2; dx += 4) {
    setCellFeature(world, washing.x + dx, washing.y + 2, Feature.SINK);
    setCellFeature(world, washing.x + dx, washing.y + washing.h - 3, Feature.APPARATUS);
  }
  setCellFeature(world, washing.x + washing.w - 2, washing.y + 1, Feature.LAMP);

  for (let dy = 1; dy < tagRoom.h - 1; dy++) setCellFeature(world, tagRoom.x + 1, tagRoom.y + dy, Feature.SHELF);
  for (let dx = 3; dx < tagRoom.w - 2; dx += 3) setCellFeature(world, tagRoom.x + dx, tagRoom.y + 2, Feature.DESK);
  setCellFeature(world, tagRoom.x + tagRoom.w - 2, tagRoom.y + tagRoom.h - 2, Feature.LAMP);

  for (let dx = 2; dx < cold.w - 2; dx += 4) {
    setCellFeature(world, cold.x + dx, cold.y + 2, Feature.SHELF);
    setCellFeature(world, cold.x + dx, cold.y + cold.h - 3, Feature.SHELF);
  }
  for (let dx = 4; dx < cold.w - 3; dx += 5) setCellFeature(world, cold.x + dx, cold.y + Math.floor(cold.h / 2), Feature.BED);
  setCellFeature(world, cold.x + cold.w - 3, cold.y + 1, Feature.LAMP);

  for (let dy = 1; dy < ledger.h - 1; dy++) {
    setCellFeature(world, ledger.x + 1, ledger.y + dy, Feature.SHELF);
    setCellFeature(world, ledger.x + ledger.w - 2, ledger.y + dy, Feature.SHELF);
  }
  for (let dx = 4; dx < ledger.w - 3; dx += 4) setCellFeature(world, ledger.x + dx, ledger.y + 3, Feature.DESK);
  setCellFeature(world, ledger.x + Math.floor(ledger.w / 2), ledger.y + 1, Feature.LAMP);

  setCellFeature(world, contaminated.x + 2, contaminated.y + 2, Feature.APPARATUS);
  setCellFeature(world, contaminated.x + contaminated.w - 3, contaminated.y + 2, Feature.SINK);
  setCellFeature(world, contaminated.x + 3, contaminated.y + contaminated.h - 3, Feature.SHELF);
  setCellFeature(world, contaminated.x + contaminated.w - 3, contaminated.y + contaminated.h - 3, Feature.LAMP);

  world.wallTex[world.idx(reception.x + reception.w - 1, reception.y - 1)] = Tex.SCREEN_BASE + 3;
  world.wallTex[world.idx(ledger.x + Math.floor(ledger.w / 2), ledger.y - 1)] = Tex.POSTER_BASE + 9;
}

function seedRegistryMorgueContainers(
  world: World,
  rooms: {
    tagRoom: Room;
    cold: Room;
    ledger: Room;
    contaminated: Room;
  },
  npcs: {
    faina: Entity;
    stepan: Entity;
    sanitar: Entity;
    ira: Entity;
  },
): void {
  addMorgueContainer(
    world, rooms.tagRoom,
    rooms.tagRoom.x + 2, rooms.tagRoom.y + 2,
    ContainerKind.FILING_CABINET,
    'Бирочная стойка N-16',
    'faction',
    [
      { defId: 'container_key_label', count: 1 },
      { defId: 'blank_form', count: 2 },
      { defId: 'ink_bottle', count: 1 },
    ],
    ['tags', 'identity', 'paper'],
    Faction.SCIENTIST,
    npcs.faina,
  );

  addMorgueContainer(
    world, rooms.cold,
    rooms.cold.x + 5, rooms.cold.y + 2,
    ContainerKind.METAL_CABINET,
    'Холодная картотека без номера',
    'locked',
    [
      { defId: 'missing_record_file', count: 1 },
      { defId: 'container_key_label', count: 1 },
      { defId: 'emergency_roster', count: 1 },
    ],
    ['cold_storage', 'identity', 'locked'],
    Faction.SCIENTIST,
    npcs.stepan,
  );

  addMorgueContainer(
    world, rooms.ledger,
    rooms.ledger.x + rooms.ledger.w - 3, rooms.ledger.y + 2,
    ContainerKind.SAFE,
    'Сейф свидетельств о смерти',
    'locked',
    [
      { defId: 'record_exposure_notice', count: 1 },
      { defId: 'official_quarantine_clearance', count: 1 },
      { defId: 'archive_access_permit', count: 1 },
    ],
    ['death_record', 'certificate', 'archive_hook'],
    Faction.SCIENTIST,
    npcs.faina,
  );

  addMorgueContainer(
    world, rooms.contaminated,
    rooms.contaminated.x + 3, rooms.contaminated.y + rooms.contaminated.h - 3,
    ContainerKind.MEDICAL_CABINET,
    'Опечатанный медицинский шкаф Крутова',
    'owner',
    [
      { defId: 'sanitary_kit', count: 1 },
      { defId: 'antibiotic', count: 1 },
      { defId: 'morphine_ampoule', count: 1 },
      { defId: 'bandage', count: 2 },
    ],
    ['medical', 'scarcity', 'owner', 'theft_risk'],
    Faction.LIQUIDATOR,
    npcs.sanitar,
  );

  addMorgueContainer(
    world, rooms.ledger,
    rooms.ledger.x + 2, rooms.ledger.y + rooms.ledger.h - 2,
    ContainerKind.SECRET_STASH,
    'Папка Иры под пустым ящиком',
    'secret',
    [
      { defId: 'personal_file_copy', count: 1 },
      { defId: 'sealed_complaint', count: 1 },
      { defId: 'tea', count: 1 },
    ],
    ['relative', 'name', 'secret'],
    Faction.CITIZEN,
    npcs.ira,
  );
}

function seedRegistryMorgueReadables(world: World, entities: Entity[], nextId: NextId, rooms: {
  reception: Room;
  tagRoom: Room;
  cold: Room;
  ledger: Room;
  contaminated: Room;
}): void {
  addDrop(
    entities,
    nextId,
    rooms.reception.x + 3,
    rooms.reception.y + rooms.reception.h - 2,
    'note',
    1,
    'Прием ведется по двум спискам: кто умер и кто может это доказать. Несовпадение списков считать очередью.',
  );
  addDrop(
    entities,
    nextId,
    rooms.tagRoom.x + rooms.tagRoom.w - 3,
    rooms.tagRoom.y + 3,
    'note',
    1,
    'Бирка N-16 совпала с живой очередью Райсовета. До выяснения считать фамилию холодной и не выдавать ей воду.',
  );
  addDrop(
    entities,
    nextId,
    rooms.cold.x + rooms.cold.w - 4,
    rooms.cold.y + rooms.cold.h - 2,
    'siren_instruction',
    1,
  );
  addDrop(
    entities,
    nextId,
    rooms.ledger.x + 4,
    rooms.ledger.y + rooms.ledger.h - 2,
    'note',
    1,
    'Свидетельство о смерти открывает архив быстрее пропуска, если подпись поставлена до вопроса. После вопроса проверяющий смотрит на того, кто принес бумагу.',
  );
  addDrop(
    entities,
    nextId,
    rooms.contaminated.x + rooms.contaminated.w - 4,
    rooms.contaminated.y + 3,
    'note',
    1,
    'Если человек сам просит свою бирку, проверьте дистанцию. Нелюдь любит чужой порядок и ближний разговор.',
  );

  world.stamp(rooms.ledger.x + 5, rooms.ledger.y + 5, 0.5, 0.5, 2, 0.18, 7161, 35, 35, 42, false);
  world.stamp(rooms.cold.x + 7, rooms.cold.y + 5, 0.5, 0.5, 4, 0.2, 7162, 120, 140, 150, false);
  world.stamp(rooms.tagRoom.x + 5, rooms.tagRoom.y + 5, 0.5, 0.5, 2, 0.18, 7163, 50, 45, 32, false);
}

export function generateRegistryMorgueDesignFloor(): FloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId: NextId = { v: 1 };
  let nextRoomId = 0;

  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.TILE_W;
    world.floorTex[i] = Tex.F_TILE;
  }
  generateZones(world);
  for (const zone of world.zones) {
    zone.faction = zone.id % 5 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
    zone.level = zone.id % 7 === 0 ? 3 : 2;
    zone.fogged = false;
  }

  const ox = 488;
  const oy = 500;
  const washing = createDesignRoom(
    world, nextRoomId++, RoomType.MEDICAL,
    ox, oy, 16, 11,
    'Моечный коридор регистрации',
    Tex.TILE_W, Tex.F_TILE,
  );
  const cold = createDesignRoom(
    world, nextRoomId++, RoomType.STORAGE,
    ox + 17, oy, 28, 11,
    'Холодная камера-укрытие',
    Tex.HERMO_WALL, Tex.F_TILE,
    true,
  );
  const contaminated = createDesignRoom(
    world, nextRoomId++, RoomType.MEDICAL,
    ox + 46, oy, 13, 11,
    'Зараженная камера сверки',
    Tex.HERMO_WALL, Tex.F_TILE,
    true,
  );
  const reception = createDesignRoom(
    world, nextRoomId++, RoomType.OFFICE,
    ox, oy + 12, 16, 10,
    'Окно приема смертей',
    Tex.TILE_W, Tex.F_LINO,
  );
  const tagRoom = createDesignRoom(
    world, nextRoomId++, RoomType.OFFICE,
    ox + 17, oy + 12, 12, 10,
    'Бирочная',
    Tex.TILE_W, Tex.F_LINO,
  );
  const ledger = createDesignRoom(
    world, nextRoomId++, RoomType.OFFICE,
    ox + 30, oy + 12, 16, 10,
    'Кабинет книги умерших',
    Tex.MARBLE, Tex.F_PARQUET,
  );

  linkRooms(world, washing, reception, DoorState.CLOSED);
  linkRooms(world, reception, tagRoom, DoorState.CLOSED);
  linkRooms(world, tagRoom, ledger, DoorState.CLOSED);
  linkRooms(world, tagRoom, cold, DoorState.HERMETIC_CLOSED);
  linkRooms(world, cold, contaminated, DoorState.HERMETIC_CLOSED);
  sanitizeDoors(world);

  placeDesignLift(world, reception.x + 1, reception.y + 1, LiftDirection.UP);
  placeDesignLift(world, reception.x + 1, reception.y + 3, LiftDirection.DOWN);

  decorateRegistryMorgue(world, { reception, washing, tagRoom, cold, ledger, contaminated });

  const faina = spawnMorgueNpc(
    entities, nextId, NPC_DEFS.morgue_registrar_faina,
    'morgue_registrar_faina', reception.x + 8, reception.y + 2,
  );
  const stepan = spawnMorgueNpc(
    entities, nextId, NPC_DEFS.morgue_orderly_stepan,
    'morgue_orderly_stepan', washing.x + 5, washing.y + 6,
    true, 'crowbar',
  );
  const ira = spawnMorgueNpc(
    entities, nextId, NPC_DEFS.morgue_relative_ira,
    'morgue_relative_ira', reception.x + 4, reception.y + 7,
  );
  const sanitar = spawnMorgueNpc(
    entities, nextId, NPC_DEFS.morgue_quarantine_sanitar,
    'morgue_quarantine_sanitar', contaminated.x + 2, contaminated.y + 2,
    true, 'pipe',
  );

  seedRegistryMorgueContainers(world, { tagRoom, cold, ledger, contaminated }, { faina, stepan, sanitar, ira });
  seedRegistryMorgueReadables(world, entities, nextId, { reception, tagRoom, cold, ledger, contaminated });

  spawnMorgueMonster(
    world, entities, nextId,
    contaminated.x + contaminated.w - 4,
    contaminated.y + contaminated.h - 4,
    MonsterKind.NELYUD,
    'Человек с чужой биркой',
  );
  spawnMorgueMonster(
    world, entities, nextId,
    ledger.x + ledger.w - 5,
    ledger.y + Math.floor(ledger.h / 2),
    MonsterKind.PECHATEED,
    'Печатеед свидетельств',
  );

  world.bakeLights();

  const spawnX = reception.x + 6.5;
  const spawnY = reception.y + 5.5;
  genLog(`[DESIGN_FLOOR] ${REGISTRY_MORGUE_ROUTE_ID} z=${REGISTRY_MORGUE_FUTURE_Z} at (${ox}, ${oy}) rooms=${nextRoomId}`);
  return { world, entities, spawnX, spawnY };
}

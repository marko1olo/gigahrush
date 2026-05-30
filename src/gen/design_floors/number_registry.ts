/* -- Design floor: number_registry / Числовой реестр ----------- */

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
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr } from '../../render/sprite_index';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const NUMBER_REGISTRY_ROUTE_ID = 'number_registry' as const;
export const NUMBER_REGISTRY_Z = 32 as const;
export const NUMBER_REGISTRY_BASE_FLOOR = FloorLevel.MINISTRY;
export const NUMBER_REGISTRY_DEBUG_ENTRY = 'design_floor.number_registry' as const;

type NextId = { v: number };

interface ResidueLane {
  id: string;
  modulus: number;
  residue: number;
  axis: 'x' | 'y';
  label: string;
}

export interface NumberRegistryDecision {
  id: string;
  roomName: string;
  route: 'decode' | 'bribe' | 'prime_risk' | 'composite_public';
  itemId: string;
  eventTag: string;
  consequence: string;
}

export interface NumberRegistryCrtIntersection {
  id: string;
  modulusA: number;
  residueA: number;
  modulusB: number;
  residueB: number;
  combinedResidue: number;
  combinedModulus: number;
  label: string;
}

const RESIDUE_LANES: readonly ResidueLane[] = [
  { id: 'mod_5_r2', modulus: 5, residue: 2, axis: 'x', label: 'остаток 2 по модулю 5' },
  { id: 'mod_7_r3', modulus: 7, residue: 3, axis: 'y', label: 'остаток 3 по модулю 7' },
  { id: 'mod_11_r4', modulus: 11, residue: 4, axis: 'x', label: 'остаток 4 по модулю 11' },
];

export const NUMBER_REGISTRY_RESIDUE_LANES = RESIDUE_LANES;

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function crtResidue(modA: number, resA: number, modB: number, resB: number): number {
  if (gcd(modA, modB) !== 1) return -1;
  const limit = modA * modB;
  for (let n = ((resA % modA) + modA) % modA; n < limit; n += modA) {
    if (n % modB === ((resB % modB) + modB) % modB) return n;
  }
  return -1;
}

export const NUMBER_REGISTRY_CRT_INTERSECTIONS: readonly NumberRegistryCrtIntersection[] = [
  {
    id: 'crt_5_7_window',
    modulusA: 5,
    residueA: 2,
    modulusB: 7,
    residueB: 3,
    combinedResidue: crtResidue(5, 2, 7, 3),
    combinedModulus: 35,
    label: '17 mod 35',
  },
  {
    id: 'crt_7_11_archive',
    modulusA: 7,
    residueA: 3,
    modulusB: 11,
    residueB: 4,
    combinedResidue: crtResidue(7, 3, 11, 4),
    combinedModulus: 77,
    label: '25 mod 77',
  },
  {
    id: 'crt_5_11_safe',
    modulusA: 5,
    residueA: 2,
    modulusB: 11,
    residueB: 4,
    combinedResidue: crtResidue(5, 2, 11, 4),
    combinedModulus: 55,
    label: '37 mod 55',
  },
];

export const NUMBER_REGISTRY_DECISIONS: readonly NumberRegistryDecision[] = [
  {
    id: 'decode_residue_route',
    roomName: 'Зал сверки остатков',
    route: 'decode',
    itemId: 'blank_form',
    eventTag: 'residue_decode',
    consequence: 'Сверка остатков показывает короткий путь к пересечной картотеке без драки у простого коридора.',
  },
  {
    id: 'bribe_modulus_clerk',
    roomName: 'Касса модуля 7',
    route: 'bribe',
    itemId: 'elevator_access_order',
    eventTag: 'modulus_bribe',
    consequence: 'Кассир продает модуль и маршрутный ордер; очередь считает это оплатой, а не взяткой.',
  },
  {
    id: 'prime_risky_corridor',
    roomName: 'Простой рискованный коридор',
    route: 'prime_risk',
    itemId: 'forged_stamp_sheet',
    eventTag: 'prime_corridor',
    consequence: 'Простой коридор короче, но там печатееды и параграфы реагируют на бумагу.',
  },
  {
    id: 'composite_public_path',
    roomName: 'Составной публичный обход',
    route: 'composite_public',
    itemId: 'official_permit_slip',
    eventTag: 'composite_path',
    consequence: 'Составной обход длиннее, зато его можно пройти через окно, талон и свидетеля.',
  },
];

const ROUTE_TARGET = {
  designFloorId: NUMBER_REGISTRY_ROUTE_ID,
  z: NUMBER_REGISTRY_Z,
  tags: ['number_registry', 'residue', 'modulus'],
  label: 'Числовой реестр',
  risk: 3,
} as const;

const REGISTRAR_DEF: PlotNpcDef = {
  name: 'Вера Модульная',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 110,
  maxHp: 110,
  money: 97,
  speed: 0.72,
  inventory: [
    { defId: 'elevator_access_order', count: 1 },
    { defId: 'blank_form', count: 2 },
    { defId: 'ink_bottle', count: 1 },
  ],
  talkLines: [
    'Без модуля вы у нас просто человек в очереди. С модулем - человек в неправильном окне.',
    'Остаток пишите цифрой. Словами остатки принимают только после отбоя.',
    'Девяносто семь рублей в кассу, и я скажу, какой коридор сегодня не делает вид, что простое число.',
    'Подпись ставится после сверки. До сверки подпись считается кляксой с амбициями.',
  ],
  talkLinesPost: [
    'Ваш остаток записан. Теперь не путайте маршрутный ордер с талоном в столовую.',
    'Если коридор стал короче, проверьте, не стал ли он голоднее.',
  ],
};

const PRIME_GUARD_DEF: PlotNpcDef = {
  name: 'Федор Простой',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 210,
  maxHp: 210,
  money: 55,
  speed: 0.92,
  weapon: 'makarov',
  inventory: [
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 12 },
    { defId: 'forged_stamp_sheet', count: 1 },
  ],
  talkLines: [
    'Простой коридор потому и простой: лишние люди в нем не остаются.',
    'Если на бумаге семь делителей, не несите ее туда, где ходят параграфы.',
    'Я держу пост до следующего простого номера. Потом пост держит меня.',
  ],
  talkLinesPost: [
    'Коридор прочищен. Долго он чистым не будет, но пройти успеете.',
    'Не размахивайте печатью. Печатееду всё равно, настоящая она или красивая.',
  ],
};

const COMPOSITE_DEF: PlotNpcDef = {
  name: 'Семен Составной',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.STOREKEEPER,
  sprite: Occupation.STOREKEEPER,
  hp: 125,
  maxHp: 125,
  money: 33,
  speed: 0.65,
  inventory: [
    { defId: 'official_permit_slip', count: 1 },
    { defId: 'ration_registry_extract', count: 1 },
  ],
  talkLines: [
    'Составной путь длинный, зато свидетелей много. При свидетелях шкафы скрипят тише.',
    'Мне нужен чистый бланк. Я приложу его к общей ведомости, и дверь перестанет строить из себя экзамен.',
    'Простые любят риск. Составные любят очередь. Очередь хотя бы можно занять табуреткой.',
  ],
  talkLinesPost: [
    'Бланк подшит. Идите по публичному обходу, там ругаются, но не кусают.',
    'Если кто спросит, вы были не быстрым, а оформленным.',
  ],
};

registerSideQuest('number_registry_vera_modulus', REGISTRAR_DEF, [
  {
    id: 'number_registry_buy_modulus',
    giverNpcId: 'number_registry_vera_modulus',
    type: QuestType.FETCH,
    desc: 'Вера Модульная: «Заплати 97 рублей в кассу модуля. Я дам ордер и скажу, по какому остатку идти.»',
    targetItem: 'money',
    targetCount: 97,
    targetFloor: NUMBER_REGISTRY_BASE_FLOOR,
    targetRoute: ROUTE_TARGET,
    targetRoomName: 'Касса модуля 7',
    targetHint: 'Числовой реестр z=+32: касса рядом с залом сверки остатков.',
    rewardItem: 'elevator_access_order',
    rewardCount: 1,
    extraRewards: [{ defId: 'blank_form', count: 1 }],
    relationDelta: 7,
    xpReward: 55,
    moneyReward: 0,
    eventTargetName: 'Модуль маршрута куплен через кассу Числового реестра.',
    eventSeverity: 3,
    eventPrivacy: 'local',
    eventTags: ['number_registry', 'modulus_bribe', 'residue_route', 'documents'],
    eventData: { routeId: NUMBER_REGISTRY_ROUTE_ID, decision: 'bribe_modulus_clerk' },
  },
  {
    id: 'number_registry_decode_residue',
    giverNpcId: 'number_registry_vera_modulus',
    type: QuestType.FETCH,
    desc: 'Вера Модульная: «Принеси чистый бланк. По нему сверим остаток и откроем пересечную картотеку без лишней очереди.»',
    targetItem: 'blank_form',
    targetCount: 1,
    targetFloor: NUMBER_REGISTRY_BASE_FLOOR,
    targetRoute: ROUTE_TARGET,
    targetRoomName: 'Зал сверки остатков',
    targetHint: 'Числовой реестр: искать столы с экранами остатков у центрального зала.',
    rewardItem: 'archive_access_permit',
    rewardCount: 1,
    extraRewards: [{ defId: 'ration_registry_extract', count: 1 }],
    relationDelta: 9,
    xpReward: 65,
    moneyReward: 25,
    eventTargetName: 'Остаток маршрута расшифрован в Числовом реестре.',
    eventSeverity: 3,
    eventPrivacy: 'private',
    eventTags: ['number_registry', 'residue_decode', 'crt_intersection', 'access'],
    eventData: { routeId: NUMBER_REGISTRY_ROUTE_ID, decision: 'decode_residue_route' },
  },
]);

registerSideQuest('number_registry_prime_guard', PRIME_GUARD_DEF, [
  {
    id: 'number_registry_clear_prime_corridor',
    giverNpcId: 'number_registry_prime_guard',
    type: QuestType.KILL,
    desc: 'Федор Простой: «Убей параграф в простом коридоре. Потом бери короткий ход, пока бумага не начала шевелиться.»',
    targetMonsterKind: MonsterKind.PARAGRAPH,
    killNeeded: 1,
    targetFloor: NUMBER_REGISTRY_BASE_FLOOR,
    targetRoute: ROUTE_TARGET,
    targetRoomName: 'Простой рискованный коридор',
    targetHint: 'Числовой реестр: короткий верхний коридор с красными отметками и печатеедами.',
    rewardItem: 'forged_stamp_sheet',
    rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 8 }],
    relationDelta: 10,
    xpReward: 90,
    moneyReward: 60,
    eventTargetName: 'Простой коридор Числового реестра временно очищен.',
    eventSeverity: 4,
    eventPrivacy: 'witnessed',
    eventTags: ['number_registry', 'prime_corridor', 'combat', 'documents'],
    eventData: { routeId: NUMBER_REGISTRY_ROUTE_ID, decision: 'prime_risky_corridor' },
  },
]);

registerSideQuest('number_registry_composite_witness', COMPOSITE_DEF, [
  {
    id: 'number_registry_file_composite_path',
    giverNpcId: 'number_registry_composite_witness',
    type: QuestType.FETCH,
    desc: 'Семен Составной: «Принеси бланк в публичный обход. Очередь длинная, зато с печатью и без простого коридора.»',
    targetItem: 'blank_form',
    targetCount: 1,
    targetFloor: NUMBER_REGISTRY_BASE_FLOOR,
    targetRoute: ROUTE_TARGET,
    targetRoomName: 'Составной публичный обход',
    targetHint: 'Числовой реестр: нижний коридор с лавками и свидетелями.',
    rewardItem: 'official_permit_slip',
    rewardCount: 1,
    extraRewards: [{ defId: 'passport_stub', count: 1 }],
    relationDelta: 8,
    xpReward: 60,
    moneyReward: 35,
    eventTargetName: 'Составной обход Числового реестра оформлен через свидетелей.',
    eventSeverity: 3,
    eventPrivacy: 'local',
    eventTags: ['number_registry', 'composite_path', 'public_queue', 'documents'],
    eventData: { routeId: NUMBER_REGISTRY_ROUTE_ID, decision: 'composite_public_path' },
  },
]);

function fillDefaultTextures(world: World): void {
  for (let i = 0; i < W * W; i++) {
    world.cells[i] = Cell.WALL;
    world.roomMap[i] = -1;
    world.wallTex[i] = Tex.MARBLE;
    world.floorTex[i] = Tex.F_PARQUET;
    world.features[i] = Feature.NONE;
    world.fog[i] = 0;
  }
}

function setFloorCell(world: World, x: number, y: number, floorTex: Tex, wallTex = Tex.MARBLE): void {
  const idx = world.idx(x, y);
  if (world.hermoWall[idx] || world.aptMask[idx] || world.cells[idx] === Cell.LIFT) return;
  world.cells[idx] = Cell.FLOOR;
  world.roomMap[idx] = -1;
  world.floorTex[idx] = floorTex;
  world.wallTex[idx] = wallTex;
}

function carveFloorRect(world: World, x: number, y: number, w: number, h: number, floorTex: Tex): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) setFloorCell(world, x + dx, y + dy, floorTex);
  }
}

function carveH(world: World, x0: number, x1: number, y: number, floorTex: Tex): void {
  const a = Math.min(x0, x1);
  const b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) setFloorCell(world, x, y, floorTex);
}

function carveV(world: World, x: number, y0: number, y1: number, floorTex: Tex): void {
  const a = Math.min(y0, y1);
  const b = Math.max(y0, y1);
  for (let y = a; y <= b; y++) setFloorCell(world, x, y, floorTex);
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR) world.features[idx] = feature;
}

function stampRegistryRoom(
  world: World,
  id: number,
  type: RoomType,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, id, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = Tex.MARBLE;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const idx = world.idx(x + dx, y + dy);
      if (world.cells[idx] === Cell.WALL) world.wallTex[idx] = Tex.MARBLE;
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) world.floorTex[idx] = floorTex;
    }
  }
  return room;
}

function addDoor(
  world: World,
  room: Room | null,
  x: number,
  y: number,
  state = DoorState.CLOSED,
  keyId = '',
  wallTex = Tex.DOOR_WOOD,
): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.roomMap[idx] = room?.id ?? -1;
  world.wallTex[idx] = wallTex;
  world.doors.set(idx, {
    idx,
    state,
    roomA: room?.id ?? -1,
    roomB: -1,
    keyId,
    timer: 0,
  });
  if (room && !room.doors.includes(idx)) room.doors.push(idx);
}

function placeLiftCell(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.LIFT;
  world.roomMap[idx] = -1;
  world.wallTex[idx] = Tex.LIFT_DOOR;
  world.liftDir[idx] = direction;
  const buttonIdx = world.idx(buttonX, buttonY);
  if (world.cells[buttonIdx] === Cell.FLOOR) {
    world.features[buttonIdx] = Feature.LIFT_BUTTON;
    world.liftDir[buttonIdx] = direction;
  }
}

function nextContainerId(world: World): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id) || world.containers.some(container => container.id === id)) id++;
  return id;
}

function addRegistryContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: WorldContainer['inventory'],
  tags: string[],
  owner?: { id: number; name: string; faction: Faction },
): void {
  world.addContainer({
    id: nextContainerId(world),
    x,
    y,
    floor: NUMBER_REGISTRY_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory,
    capacitySlots: Math.max(8, inventory.length + 2),
    ownerNpcId: owner?.id,
    ownerName: owner?.name,
    faction: owner?.faction ?? Faction.CITIZEN,
    access,
    lockDifficulty: access === 'locked' ? 4 : undefined,
    discovered: access !== 'secret',
    tags: ['number_registry', ...tags],
  });
}

function spawnNpc(
  entities: Entity[],
  nextId: NextId,
  def: PlotNpcDef,
  plotNpcId: string,
  x: number,
  y: number,
  weapon?: string,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
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
    ai: { goal: AIGoal.IDLE, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(item => ({ ...item })),
    weapon: weapon ?? def.weapon,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId,
    canGiveQuest: true,
    questId: -1,
    isTraveler: false,
  });
  return id;
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: NextId,
  kind: MonsterKind,
  x: number,
  y: number,
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  const idx = world.idx(x, y);
  const zone = world.zones[world.zoneMap[idx]];
  const level = Math.max(3, zone?.level ?? 3);
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
    hp: scaleMonsterHp(def.hp, level),
    maxHp: scaleMonsterHp(def.hp, level),
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
  });
}

function decorateRegistryRooms(world: World, rooms: Record<string, Room>): void {
  const hub = rooms.hub;
  for (let dx = 4; dx < hub.w - 4; dx += 4) {
    setFeature(world, hub.x + dx, hub.y + 5, Feature.DESK);
    setFeature(world, hub.x + dx, hub.y + 7, Feature.CHAIR);
  }
  for (let dx = 6; dx < hub.w - 6; dx += 9) setFeature(world, hub.x + dx, hub.y + hub.h - 4, Feature.SCREEN);
  setFeature(world, hub.x + 3, hub.y + 3, Feature.LAMP);
  setFeature(world, hub.x + hub.w - 4, hub.y + 3, Feature.LAMP);

  for (const room of [rooms.mod5, rooms.mod7, rooms.mod11]) {
    for (let dx = 3; dx < room.w - 3; dx += 4) setFeature(world, room.x + dx, room.y + 3, Feature.DESK);
    for (let dx = 4; dx < room.w - 4; dx += 5) setFeature(world, room.x + dx, room.y + 6, Feature.SCREEN);
    setFeature(world, room.x + 2, room.y + 2, Feature.LAMP);
  }

  const prime = rooms.prime;
  for (let dx = 4; dx < prime.w - 4; dx += 11) {
    setFeature(world, prime.x + dx, prime.y + 2, Feature.SCREEN);
    setFeature(world, prime.x + dx + 2, prime.y + prime.h - 3, Feature.SHELF);
  }

  const composite = rooms.composite;
  for (let dx = 5; dx < composite.w - 5; dx += 7) {
    setFeature(world, composite.x + dx, composite.y + 4, Feature.CHAIR);
    setFeature(world, composite.x + dx, composite.y + 7, Feature.TABLE);
  }

  const crt = rooms.crt;
  for (let dy = 3; dy < crt.h - 3; dy += 3) {
    setFeature(world, crt.x + 2, crt.y + dy, Feature.SHELF);
    setFeature(world, crt.x + crt.w - 3, crt.y + dy, Feature.SHELF);
  }
  setFeature(world, crt.x + Math.floor(crt.w / 2), crt.y + 3, Feature.SCREEN);
}

function retuneZoneMap(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
    const primeBand = Math.abs(zone.cy - 466) <= 76 && zone.cx >= 520 && zone.cx <= 850;
    const compositeBand = Math.abs(zone.cy - 566) <= 84 && zone.cx >= 520 && zone.cx <= 870;
    const residueLanes = RESIDUE_LANES.some(lane => {
      const v = lane.axis === 'x' ? zone.cx : zone.cy;
      return v % lane.modulus === lane.residue && (v % 64 <= 7 || v % 64 >= 57);
    });
    zone.level = Math.max(2, Math.min(5, Math.round(2 + d / 360)));
    zone.faction = ZoneFaction.CITIZEN;
    if (primeBand) {
      zone.faction = zone.id % 3 === 0 ? ZoneFaction.SAMOSBOR : ZoneFaction.WILD;
      zone.level = Math.max(zone.level, 4);
    } else if (compositeBand) {
      zone.faction = zone.id % 4 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
      zone.level = Math.max(zone.level, 3);
    } else if (residueLanes) {
      zone.faction = zone.id % 5 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
    }
    zone.fogged = false;
  }
  for (let i = 0; i < W * W; i++) {
    const zone = world.zones[world.zoneMap[i]];
    world.factionControl[i] = zone?.faction ?? ZoneFaction.CITIZEN;
  }
}

export function retuneNumberRegistryZones(world: World): void {
  retuneZoneMap(world);
}

function registerNumberRegistryRouteCues(world: World, rooms: Record<string, Room>): void {
  registerRouteCue(world, {
    id: 'number_registry_prime_corridor',
    x: rooms.hub.x + rooms.hub.w - 3.5,
    y: rooms.hub.y + 9.5,
    targetX: rooms.prime.x + rooms.prime.w - 6.5,
    targetY: rooms.prime.y + 5.5,
    floor: NUMBER_REGISTRY_BASE_FLOOR,
    roomId: rooms.hub.id,
    targetRoomId: rooms.prime.id,
    zoneId: world.zoneMap[world.idx(rooms.hub.x + rooms.hub.w - 4, rooms.hub.y + 9)],
    label: 'простой короткий ход',
    hint: 'остатки сходятся в короткий коридор с бумажным шумом',
    targetName: 'Простой рискованный коридор',
    color: '#ffb35c',
    tags: ['number_registry', 'prime_corridor', 'warning', 'documents'],
    toneSeed: 240017,
    radius: 9,
    targetRadius: 4,
    cooldownSec: 28,
    heardText: 'Табло остатков щелкает: простой коридор короче, но за ним шуршит живая бумага.',
    followedText: 'Простой ход выбран. Держи оружие выше бланков и не стой у полок.',
    ignoredText: 'Простой коридор остался сбоку. Очередь длиннее, зато не стреляет печатями.',
    routeGroup: {
      id: 'number_registry_choice',
      lead: 'Числовой реестр делит маршрут на остатки.',
      risk: 'Простой коридор короткий и опасный.',
      decision: 'идти простым риском или составной очередью',
      reward: 'короткий доступ к пересечной картотеке',
      mapLabel: 'числовой выбор',
      mapHint: 'простой риск / составной обход',
    },
  });

  registerRouteCue(world, {
    id: 'number_registry_composite_path',
    x: rooms.hub.x + rooms.hub.w - 3.5,
    y: rooms.hub.y + rooms.hub.h - 8.5,
    targetX: rooms.composite.x + rooms.composite.w - 7.5,
    targetY: rooms.composite.y + 9.5,
    floor: NUMBER_REGISTRY_BASE_FLOOR,
    roomId: rooms.hub.id,
    targetRoomId: rooms.composite.id,
    zoneId: world.zoneMap[world.idx(rooms.hub.x + rooms.hub.w - 4, rooms.hub.y + rooms.hub.h - 8)],
    label: 'составной публичный обход',
    hint: 'нижний путь через очередь, бланк и свидетеля',
    targetName: 'Составной публичный обход',
    color: '#ffe082',
    tags: ['number_registry', 'composite_path', 'public_queue', 'documents'],
    toneSeed: 240071,
    radius: 9,
    targetRadius: 4,
    cooldownSec: 28,
    heardText: 'Снизу гудит очередь: составной обход длинный, но оформленный.',
    followedText: 'Составной обход выбран. Покажи бланк у окна и не лезь в простой коридор.',
    ignoredText: 'Публичный обход остался позади. Без свидетелей спорить придется с коридором.',
  });
}

function residuePositions(lane: ResidueLane): number[] {
  const out: number[] = [];
  const base = lane.modulus === 5 ? 18 : lane.modulus === 7 ? 12 : 8;
  const step = lane.modulus === 5 ? 37 : lane.modulus === 7 ? 28 : 17;
  for (let n = 0; n < 6; n++) {
    const v = lane.residue + lane.modulus * (base + n * step);
    if (v > 24 && v < W - 24) out.push(v);
  }
  return out;
}

function carveResidueLattice(world: World): void {
  for (const lane of RESIDUE_LANES) {
    const positions = residuePositions(lane);
    for (const pos of positions) {
      if (lane.axis === 'x') {
        for (let y = 0; y < W; y++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = world.idx(pos + dx, y);
            if (world.roomMap[idx] >= 0) continue;
            setFloorCell(world, pos + dx, y, Tex.F_MARBLE_TILE);
          }
        }
      } else {
        for (let x = 0; x < W; x++) {
          for (let dy = -1; dy <= 1; dy++) {
            const idx = world.idx(x, pos + dy);
            if (world.roomMap[idx] >= 0) continue;
            setFloorCell(world, x, pos + dy, Tex.F_PARQUET);
          }
        }
      }
    }
  }
}

function carvePrimeGapCorridor(world: World): number {
  const primes = [101, 107, 113, 127, 131, 137, 149, 157, 163, 173, 179, 191, 193, 197, 199, 211, 223, 227, 229, 233];
  let y = 338;
  let turns = 0;
  let lastX = 96;
  for (let i = 0; i < primes.length; i++) {
    const x = 96 + ((primes[i] * 7) % 812);
    carveH(world, lastX, x, y, Tex.F_RED_CARPET);
    const gap = i === 0 ? 6 : primes[i] - primes[i - 1];
    const nextY = Math.max(300, Math.min(466, y + (gap % 3 === 0 ? 17 : gap % 4 === 0 ? -13 : 9)));
    carveV(world, x, y, nextY, Tex.F_RED_CARPET);
    if (nextY !== y) turns++;
    y = nextY;
    lastX = x;
  }
  carveH(world, lastX, 866, y, Tex.F_RED_CARPET);
  return turns;
}

function tryStampMacroRoom(
  world: World,
  id: number,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
): Room | null {
  if (x < 2 || y < 2 || x + w >= W - 2 || y + h >= W - 2) return null;
  const room = stampRegistryRoom(world, id, type, name, x, y, w, h, Tex.F_MARBLE_TILE);
  for (let dx = 3; dx < w - 3; dx += 5) setFeature(world, x + dx, y + 3, Feature.SCREEN);
  for (let dx = 4; dx < w - 4; dx += 6) setFeature(world, x + dx, y + h - 4, Feature.SHELF);
  addDoor(world, room, x + Math.floor(w / 2), y + h, DoorState.CLOSED, '', Tex.DOOR_WOOD);
  setFloorCell(world, x + Math.floor(w / 2), y + h + 1, Tex.F_MARBLE_TILE);
  return room;
}

export function expandNumberRegistryGeometry(world: World, rng: () => number): void {
  carveResidueLattice(world);
  const primeTurns = carvePrimeGapCorridor(world);
  let nextRoom = world.rooms.length;
  while (world.rooms[nextRoom]) nextRoom++;
  const points = [
    { x: 166, y: 254, name: `Пересечение остатков ${NUMBER_REGISTRY_CRT_INTERSECTIONS[0].label}` },
    { x: 642, y: 258, name: `Пересечение остатков ${NUMBER_REGISTRY_CRT_INTERSECTIONS[1].label}` },
    { x: 268, y: 742, name: `Пересечение остатков ${NUMBER_REGISTRY_CRT_INTERSECTIONS[2].label}` },
    { x: 746, y: 742, name: 'Сверочная комната составных корешков' },
  ];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const room = tryStampMacroRoom(
      world,
      nextRoom++,
      i === 3 ? RoomType.COMMON : RoomType.STORAGE,
      p.x + Math.floor(rng() * 9) - 4,
      p.y + Math.floor(rng() * 9) - 4,
      i === 3 ? 34 : 28,
      i === 3 ? 18 : 16,
      p.name,
    );
    if (!room) continue;
    const cX = room.x + Math.floor(room.w / 2);
    const cY = room.y + Math.floor(room.h / 2);
    carveH(world, cX, W >> 1, cY, Tex.F_MARBLE_TILE);
    carveV(world, W >> 1, cY, W >> 1, Tex.F_MARBLE_TILE);
  }
  for (let x = 90; x <= 930; x += 37) {
    const y = 337 + ((x * 13 + primeTurns * 7) % 126);
    if (world.cells[world.idx(x, y)] === Cell.FLOOR) world.features[world.idx(x, y)] = x % 2 === 0 ? Feature.SCREEN : Feature.SHELF;
  }
  world.markCellsDirty();
  world.markFloorTexDirty();
  world.markWallTexDirty();
  world.markFeaturesDirty(false);
}

export function generateNumberRegistryDesignFloor(): FloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId: NextId = { v: 1 };
  let nextRoomId = 0;
  fillDefaultTextures(world);

  const rooms = {
    hub: stampRegistryRoom(world, nextRoomId++, RoomType.COMMON, 'Зал сверки остатков', 480, 492, 64, 38, Tex.F_PARQUET),
    mod5: stampRegistryRoom(world, nextRoomId++, RoomType.OFFICE, 'Окно остатка 2 mod 5', 430, 468, 36, 18, Tex.F_MARBLE_TILE),
    mod7: stampRegistryRoom(world, nextRoomId++, RoomType.OFFICE, 'Касса модуля 7', 430, 532, 36, 18, Tex.F_GREEN_CARPET),
    mod11: stampRegistryRoom(world, nextRoomId++, RoomType.OFFICE, 'Окно остатка 4 mod 11', 462, 562, 42, 18, Tex.F_MARBLE_TILE),
    prime: stampRegistryRoom(world, nextRoomId++, RoomType.CORRIDOR, 'Простой рискованный коридор', 556, 456, 94, 18, Tex.F_RED_CARPET),
    composite: stampRegistryRoom(world, nextRoomId++, RoomType.COMMON, 'Составной публичный обход', 556, 536, 102, 24, Tex.F_GREEN_CARPET),
    crt: stampRegistryRoom(world, nextRoomId++, RoomType.STORAGE, 'Китайская пересечная картотека', 674, 494, 42, 30, Tex.F_MARBLE_TILE),
    safe: stampRegistryRoom(world, nextRoomId++, RoomType.HQ, 'Сейф общего остатка', 724, 500, 24, 18, Tex.F_RED_CARPET),
  };

  carveH(world, rooms.mod5.x + rooms.mod5.w, rooms.hub.x - 1, rooms.mod5.y + 9, Tex.F_PARQUET);
  carveH(world, rooms.mod7.x + rooms.mod7.w, rooms.hub.x - 1, rooms.mod7.y + 8, Tex.F_GREEN_CARPET);
  carveH(world, rooms.hub.x + rooms.hub.w, rooms.prime.x - 1, rooms.prime.y + 9, Tex.F_RED_CARPET);
  carveH(world, rooms.hub.x + rooms.hub.w, rooms.composite.x - 1, rooms.composite.y + 12, Tex.F_GREEN_CARPET);
  carveH(world, rooms.prime.x + rooms.prime.w, rooms.crt.x - 1, rooms.prime.y + 9, Tex.F_RED_CARPET);
  carveV(world, rooms.crt.x + 12, rooms.prime.y + 9, rooms.crt.y - 1, Tex.F_RED_CARPET);
  carveH(world, rooms.composite.x + rooms.composite.w, rooms.crt.x - 1, rooms.composite.y + 12, Tex.F_GREEN_CARPET);
  carveV(world, rooms.crt.x + 10, rooms.crt.y + rooms.crt.h, rooms.safe.y + 7, Tex.F_MARBLE_TILE);
  carveH(world, rooms.crt.x + rooms.crt.w, rooms.safe.x - 1, rooms.safe.y + 9, Tex.F_MARBLE_TILE);
  carveFloorRect(world, 476, 510, 4, 4, Tex.F_PARQUET);
  carveFloorRect(world, 544, 509, 12, 3, Tex.F_RED_CARPET);
  carveFloorRect(world, 544, 543, 12, 3, Tex.F_GREEN_CARPET);

  addDoor(world, rooms.mod5, rooms.mod5.x + rooms.mod5.w, rooms.mod5.y + 9);
  addDoor(world, rooms.mod7, rooms.mod7.x + rooms.mod7.w, rooms.mod7.y + 8);
  addDoor(world, rooms.hub, rooms.hub.x - 1, rooms.mod5.y + 9);
  addDoor(world, rooms.hub, rooms.hub.x - 1, rooms.mod7.y + 8);
  addDoor(world, rooms.hub, rooms.hub.x + rooms.hub.w, rooms.prime.y + 9, DoorState.CLOSED, '', Tex.DOOR_METAL);
  addDoor(world, rooms.hub, rooms.hub.x + rooms.hub.w, rooms.composite.y + 12);
  addDoor(world, rooms.prime, rooms.prime.x + rooms.prime.w, rooms.prime.y + 9, DoorState.LOCKED, 'key', Tex.DOOR_METAL);
  addDoor(world, rooms.composite, rooms.composite.x + rooms.composite.w, rooms.composite.y + 12);
  addDoor(world, rooms.crt, rooms.crt.x + rooms.crt.w, rooms.safe.y + 9, DoorState.LOCKED, 'archive_access_permit', Tex.DOOR_METAL);

  placeLiftCell(world, 476, 512, 477, 512, LiftDirection.UP);
  placeLiftCell(world, 746, 509, 744, 509, LiftDirection.DOWN);

  decorateRegistryRooms(world, rooms);
  generateZones(world);
  retuneZoneMap(world);

  const registrarId = spawnNpc(
    entities,
    nextId,
    REGISTRAR_DEF,
    'number_registry_vera_modulus',
    rooms.mod7.x + 5,
    rooms.mod7.y + 5,
  );
  const guardId = spawnNpc(
    entities,
    nextId,
    PRIME_GUARD_DEF,
    'number_registry_prime_guard',
    rooms.prime.x + 8,
    rooms.prime.y + 5,
    'makarov',
  );
  const compositeId = spawnNpc(
    entities,
    nextId,
    COMPOSITE_DEF,
    'number_registry_composite_witness',
    rooms.composite.x + 9,
    rooms.composite.y + 9,
  );

  spawnMonster(world, entities, nextId, MonsterKind.PARAGRAPH, rooms.prime.x + 42, rooms.prime.y + 7);
  spawnMonster(world, entities, nextId, MonsterKind.PECHATEED, rooms.prime.x + 67, rooms.prime.y + 6);
  spawnMonster(world, entities, nextId, MonsterKind.KONTORSHCHIK, rooms.safe.x + 11, rooms.safe.y + 8);

  addRegistryContainer(
    world,
    rooms.mod7,
    rooms.mod7.x + rooms.mod7.w - 4,
    rooms.mod7.y + 5,
    ContainerKind.CASHBOX,
    'Касса модуля 7',
    'owner',
    [
      { defId: 'elevator_access_order', count: 1 },
      { defId: 'blank_form', count: 1 },
      { defId: 'ink_bottle', count: 1 },
    ],
    ['modulus_bribe', 'decode', 'cashbox'],
    { id: registrarId, name: REGISTRAR_DEF.name, faction: Faction.CITIZEN },
  );
  addRegistryContainer(
    world,
    rooms.prime,
    rooms.prime.x + rooms.prime.w - 8,
    rooms.prime.y + 5,
    ContainerKind.FILING_CABINET,
    'Ящик простого коридора',
    'locked',
    [
      { defId: 'forged_stamp_sheet', count: 1 },
      { defId: 'denunciation', count: 1 },
      { defId: 'ammo_9mm', count: 6 },
    ],
    ['prime_corridor', 'risky_shortcut', 'theft'],
    { id: guardId, name: PRIME_GUARD_DEF.name, faction: Faction.LIQUIDATOR },
  );
  addRegistryContainer(
    world,
    rooms.composite,
    rooms.composite.x + rooms.composite.w - 9,
    rooms.composite.y + 8,
    ContainerKind.FILING_CABINET,
    'Составная папка публичного обхода',
    'public',
    [
      { defId: 'official_permit_slip', count: 1 },
      { defId: 'ration_registry_extract', count: 1 },
      { defId: 'passport_stub', count: 1 },
    ],
    ['composite_path', 'public_queue', 'witnessed'],
    { id: compositeId, name: COMPOSITE_DEF.name, faction: Faction.CITIZEN },
  );
  addRegistryContainer(
    world,
    rooms.crt,
    rooms.crt.x + 8,
    rooms.crt.y + 7,
    ContainerKind.SAFE,
    'Пересечение китайских остатков',
    'locked',
    [
      { defId: 'archive_access_permit', count: 1 },
      { defId: 'personal_file_copy', count: 1 },
      { defId: 'raionsovet_floor_pass', count: 1 },
    ],
    ['crt_intersection', 'residue_decode', 'locked_record'],
  );

  registerNumberRegistryRouteCues(world, rooms);
  sanitizeDoors(world);
  ensureConnectivity(world, rooms.hub.x + 8, rooms.hub.y + 20);
  world.rebuildContainerMap();
  world.bakeLights();

  return {
    world,
    entities,
    spawnX: rooms.hub.x + 8.5,
    spawnY: rooms.hub.y + 20.5,
  };
}

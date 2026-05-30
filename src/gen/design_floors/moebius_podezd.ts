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
  RoomType,
  Tex,
  type Entity,
  type Item,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { hashSeed, withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr } from '../../render/sprite_index';
import { randomRPG } from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const MOEBIUS_PODEZD_ROUTE_ID = 'moebius_podezd' as const;
export const MOEBIUS_PODEZD_Z = 2;
export const MOEBIUS_PODEZD_BASE_FLOOR = FloorLevel.KVARTIRY;
export const MOEBIUS_PODEZD_SEED = hashSeed(MOEBIUS_PODEZD_ROUTE_ID);

export const MOEBIUS_PODEZD_ROOM_NAMES = {
  upperStrip: 'Жилая полоса Мёбиуса А',
  lowerStrip: 'Жилая полоса Мёбиуса Б',
  westLoop: 'Безопасная публичная петля западного пролёта',
  eastLoop: 'Безопасная публичная петля восточного пролёта',
  shortcut: 'Рискованный паритетный шов',
  seamNorth: 'Парный шов Мёбиуса северный ориентир',
  seamSouth: 'Парный шов Мёбиуса южный ориентир',
  lostMarker: 'Кладовка потерянной маршрутной метки',
} as const;

interface OpenRoomSpec {
  type: RoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  floorTex: Tex;
  wallTex: Tex;
}

interface MoebiusRooms {
  upperStrip: Room;
  lowerStrip: Room;
  westLoop: Room;
  eastLoop: Room;
  shortcut: Room;
  seamNorth: Room;
  seamSouth: Room;
  lostMarker: Room;
  mirroredFlats: Room[];
}

interface NextId {
  v: number;
}

const LOOP_LEFT = 168;
const LOOP_RIGHT = 856;
const UPPER_Y = 398;
const LOWER_Y = 612;
const STRIP_H = 14;
const CONNECTOR_W = 14;
const SHORTCUT_X = 504;
const SHORTCUT_Y = UPPER_Y + STRIP_H;
const SHORTCUT_W = 17;
const SHORTCUT_H = LOWER_Y - SHORTCUT_Y;
const NORTH_GATE_Y = 492;
const SOUTH_GATE_Y = 528;
const SEAM_KEY_ID = 'rubber_door_wedge';
const FLAT_LABELS = ['17-А', '17-Б', '18-А', '18-Б', '19-А', '19-Б', '20-А', '20-Б'] as const;

export interface MoebiusPodezdDecisionMetrics {
  mirroredFlatRooms: number;
  residentialStrips: number;
  seamLandmarks: number;
  seamLockedDoors: number;
  mirrorTellContainers: number;
  routeMarkerContainers: number;
  reversedPatrolNpcs: number;
  seamHunterMonsters: number;
}

export function generateMoebiusPodezdDesignFloor(seed = MOEBIUS_PODEZD_SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextEntityId = { v: 1 };
    const rooms = buildMoebiusRooms(world);

    placeLifts(world);
    decorateRooms(world, rooms);
    generateZones(world);
    placeDecisionContainers(world, rooms);
    spawnReversedPatrols(entities, nextEntityId);
    spawnSeamThreats(world, entities, nextEntityId);

    sanitizeDoors(world);
    ensureConnectivity(world, 184.5, 405.5);
    world.bakeLights();

    return { world, entities, spawnX: 184.5, spawnY: 405.5 };
  });
}

export function moebiusPodezdDecisionMetrics(gen: FloorGeneration): MoebiusPodezdDecisionMetrics {
  const routeRooms = gen.world.rooms.filter(room => room?.name.includes('Мёбиуса') || room?.name.includes('метки'));
  return {
    mirroredFlatRooms: gen.world.rooms.filter(room => room?.name.includes('Зеркальная квартира')).length,
    residentialStrips: gen.world.rooms.filter(room => room?.name.startsWith('Жилая полоса Мёбиуса')).length,
    seamLandmarks: routeRooms.filter(room => room.name.startsWith('Парный шов Мёбиуса')).length,
    seamLockedDoors: [...gen.world.doors.values()].filter(door => door.state === DoorState.LOCKED && door.keyId === SEAM_KEY_ID).length,
    mirrorTellContainers: gen.world.containers.filter(container => container.tags.includes('mirror_tell')).length,
    routeMarkerContainers: gen.world.containers.filter(container => container.tags.includes('route_marker') && container.tags.includes('recover')).length,
    reversedPatrolNpcs: gen.entities.filter(entity => entity.type === EntityType.NPC && entity.name?.includes('обратного обхода')).length,
    seamHunterMonsters: gen.entities.filter(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.SHOVNIK).length,
  };
}

function buildMoebiusRooms(world: World): MoebiusRooms {
  const upperStrip = addOpenRoom(world, {
    type: RoomType.CORRIDOR,
    x: LOOP_LEFT,
    y: UPPER_Y,
    w: LOOP_RIGHT - LOOP_LEFT,
    h: STRIP_H,
    name: MOEBIUS_PODEZD_ROOM_NAMES.upperStrip,
    floorTex: Tex.F_LINO,
    wallTex: Tex.PANEL,
  });
  const lowerStrip = addOpenRoom(world, {
    type: RoomType.CORRIDOR,
    x: LOOP_LEFT,
    y: LOWER_Y,
    w: LOOP_RIGHT - LOOP_LEFT,
    h: STRIP_H,
    name: MOEBIUS_PODEZD_ROOM_NAMES.lowerStrip,
    floorTex: Tex.F_LINO,
    wallTex: Tex.PANEL,
  });
  const westLoop = addOpenRoom(world, {
    type: RoomType.CORRIDOR,
    x: LOOP_LEFT,
    y: UPPER_Y,
    w: CONNECTOR_W,
    h: LOWER_Y + STRIP_H - UPPER_Y,
    name: MOEBIUS_PODEZD_ROOM_NAMES.westLoop,
    floorTex: Tex.F_CONCRETE,
    wallTex: Tex.PANEL,
  });
  const eastLoop = addOpenRoom(world, {
    type: RoomType.CORRIDOR,
    x: LOOP_RIGHT - CONNECTOR_W,
    y: UPPER_Y,
    w: CONNECTOR_W,
    h: LOWER_Y + STRIP_H - UPPER_Y,
    name: MOEBIUS_PODEZD_ROOM_NAMES.eastLoop,
    floorTex: Tex.F_CONCRETE,
    wallTex: Tex.PANEL,
  });
  const shortcut = addOpenRoom(world, {
    type: RoomType.CORRIDOR,
    x: SHORTCUT_X,
    y: SHORTCUT_Y,
    w: SHORTCUT_W,
    h: SHORTCUT_H,
    name: MOEBIUS_PODEZD_ROOM_NAMES.shortcut,
    floorTex: Tex.F_TILE,
    wallTex: Tex.PANEL,
  });
  addShortcutGate(world, shortcut, NORTH_GATE_Y);
  addShortcutGate(world, shortcut, SOUTH_GATE_Y);

  const mirroredFlats = buildMirroredFlats(world, upperStrip, lowerStrip);
  const seamNorth = makeClosedRoom(world, RoomType.COMMON, 446, 444, 46, 28, MOEBIUS_PODEZD_ROOM_NAMES.seamNorth, Tex.PANEL, Tex.F_LINO);
  const seamSouth = makeClosedRoom(world, RoomType.COMMON, 532, 548, 46, 28, MOEBIUS_PODEZD_ROOM_NAMES.seamSouth, Tex.PANEL, Tex.F_LINO);
  const lostMarker = makeClosedRoom(world, RoomType.STORAGE, 610, 458, 40, 26, MOEBIUS_PODEZD_ROOM_NAMES.lostMarker, Tex.PANEL, Tex.F_CONCRETE);

  addDoor(world, seamNorth.x + seamNorth.w, seamNorth.y + 14, DoorState.CLOSED, '', seamNorth.id, shortcut.id);
  carveConnector(world, seamNorth.x + seamNorth.w + 1, seamNorth.y + 14, SHORTCUT_X, seamNorth.y + 14, Tex.F_LINO);
  addDoor(world, seamSouth.x - 1, seamSouth.y + 13, DoorState.CLOSED, '', seamSouth.id, shortcut.id);
  carveConnector(world, SHORTCUT_X + SHORTCUT_W - 1, seamSouth.y + 13, seamSouth.x - 2, seamSouth.y + 13, Tex.F_LINO);
  addDoor(world, lostMarker.x + Math.floor(lostMarker.w / 2), lostMarker.y - 1, DoorState.LOCKED, 'container_key_label', lostMarker.id, upperStrip.id);
  carveConnector(world, lostMarker.x + Math.floor(lostMarker.w / 2), lostMarker.y - 2, lostMarker.x + Math.floor(lostMarker.w / 2), UPPER_Y + STRIP_H - 1, Tex.F_LINO);

  return { upperStrip, lowerStrip, westLoop, eastLoop, shortcut, seamNorth, seamSouth, lostMarker, mirroredFlats };
}

function buildMirroredFlats(world: World, upperStrip: Room, lowerStrip: Room): Room[] {
  const rooms: Room[] = [];
  const xs = [214, 290, 366, 442, 562, 638, 714, 790];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const directLabel = FLAT_LABELS[i];
    const reverseLabel = FLAT_LABELS[FLAT_LABELS.length - 1 - i];
    const upper = makeClosedRoom(world, RoomType.LIVING, x, UPPER_Y - 29, 42, 28, `Зеркальная квартира ${directLabel} прямая сторона`, Tex.PANEL, Tex.F_CARPET);
    const lower = makeClosedRoom(world, RoomType.LIVING, x, LOWER_Y + STRIP_H + 1, 42, 28, `Зеркальная квартира ${reverseLabel} обратная сторона`, Tex.PANEL, Tex.F_CARPET);
    addDoor(world, x + 21, UPPER_Y - 1, DoorState.CLOSED, '', upper.id, upperStrip.id);
    addDoor(world, x + 21, LOWER_Y + STRIP_H, DoorState.CLOSED, '', lower.id, lowerStrip.id);
    rooms.push(upper, lower);
  }
  return rooms;
}

function addOpenRoom(world: World, spec: OpenRoomSpec): Room {
  const id = world.rooms.length;
  const room: Room = {
    id,
    type: spec.type,
    x: world.wrap(spec.x),
    y: world.wrap(spec.y),
    w: spec.w,
    h: spec.h,
    doors: [],
    sealed: false,
    name: spec.name,
    apartmentId: -1,
    wallTex: spec.wallTex,
    floorTex: spec.floorTex,
  };
  world.rooms[id] = room;
  carveRect(world, spec.x, spec.y, spec.w, spec.h, id, spec.floorTex, spec.wallTex);
  return room;
}

function makeClosedRoom(
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
      if (world.roomMap[idx] === room.id) world.floorTex[idx] = floorTex;
    }
  }
  return room;
}

function carveRect(world: World, x: number, y: number, w: number, h: number, roomId: number, floorTex: Tex, wallTex: Tex): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const idx = world.idx(x + dx, y + dy);
      world.cells[idx] = Cell.FLOOR;
      world.roomMap[idx] = roomId;
      world.floorTex[idx] = floorTex;
      world.wallTex[idx] = wallTex;
      world.features[idx] = Feature.NONE;
    }
  }
}

function carveConnector(world: World, fromX: number, fromY: number, toX: number, toY: number, floorTex: Tex): void {
  let x = world.wrap(fromX);
  let y = world.wrap(fromY);
  const dx = Math.sign(world.delta(x, toX));
  const dy = Math.sign(world.delta(y, toY));
  while (x !== world.wrap(toX)) {
    setCorridorCell(world, x, y, floorTex);
    x = world.wrap(x + dx);
  }
  while (y !== world.wrap(toY)) {
    setCorridorCell(world, x, y, floorTex);
    y = world.wrap(y + dy);
  }
  setCorridorCell(world, x, y, floorTex);
}

function setCorridorCell(world: World, x: number, y: number, floorTex: Tex): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.DOOR || world.cells[idx] === Cell.LIFT) return;
  world.cells[idx] = Cell.FLOOR;
  world.roomMap[idx] = -1;
  world.floorTex[idx] = floorTex;
  world.wallTex[idx] = Tex.PANEL;
  world.features[idx] = Feature.NONE;
}

function addShortcutGate(world: World, shortcut: Room, y: number): void {
  for (let x = SHORTCUT_X; x < SHORTCUT_X + SHORTCUT_W; x++) {
    const idx = world.idx(x, y);
    world.cells[idx] = Cell.WALL;
    world.roomMap[idx] = -1;
    world.wallTex[idx] = Tex.PANEL;
    world.features[idx] = Feature.NONE;
  }
  addDoor(world, SHORTCUT_X + (SHORTCUT_W >> 1), y, DoorState.LOCKED, SEAM_KEY_ID, shortcut.id, shortcut.id);
}

function addDoor(world: World, x: number, y: number, state: DoorState, keyId: string, roomA: number, roomB: number): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.wallTex[idx] = state === DoorState.LOCKED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
  world.features[idx] = Feature.NONE;
  world.doors.set(idx, { idx, state, roomA, roomB, keyId, timer: 0 });
  const a = world.rooms[roomA];
  const b = world.rooms[roomB];
  if (a && !a.doors.includes(idx)) a.doors.push(idx);
  if (b && b !== a && !b.doors.includes(idx)) b.doors.push(idx);
}

function placeLifts(world: World): void {
  placeLift(world, 178, 405, 179, 405, LiftDirection.UP);
  placeLift(world, 846, 619, 845, 619, LiftDirection.DOWN);
  placeLift(world, 846, 405, 845, 405, LiftDirection.UP);
  placeLift(world, 178, 619, 179, 619, LiftDirection.DOWN);
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const liftIdx = world.idx(x, y);
  world.cells[liftIdx] = Cell.LIFT;
  world.wallTex[liftIdx] = Tex.LIFT_DOOR;
  world.roomMap[liftIdx] = -1;
  world.features[liftIdx] = Feature.NONE;
  world.liftDir[liftIdx] = direction;
  const buttonIdx = world.idx(buttonX, buttonY);
  if (world.cells[buttonIdx] === Cell.FLOOR) {
    world.features[buttonIdx] = Feature.LIFT_BUTTON;
    world.liftDir[buttonIdx] = direction;
  }
}

function decorateRooms(world: World, rooms: MoebiusRooms): void {
  for (const [i, room] of rooms.mirroredFlats.entries()) {
    setFeature(world, room.x + 5, room.y + 5, i % 2 === 0 ? Feature.TABLE : Feature.BED);
    setFeature(world, room.x + room.w - 6, room.y + room.h - 6, Feature.SHELF);
    if (i % 4 === 0) markScreenWall(world, room.x + Math.floor(room.w / 2), room.y - 1, i);
  }
  setFeature(world, rooms.seamNorth.x + 7, rooms.seamNorth.y + 8, Feature.TABLE);
  setFeature(world, rooms.seamSouth.x + rooms.seamSouth.w - 8, rooms.seamSouth.y + 8, Feature.TABLE);
  markScreenWall(world, rooms.seamNorth.x + 18, rooms.seamNorth.y - 1, 2);
  markScreenWall(world, rooms.seamSouth.x + 28, rooms.seamSouth.y + rooms.seamSouth.h, 6);
  for (const [x, y] of [[256, 405], [512, 405], [768, 405], [256, 619], [512, 619], [768, 619]] as const) {
    setFeature(world, x, y, Feature.LAMP);
  }
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) world.features[idx] = feature;
}

function markScreenWall(world: World, x: number, y: number, frame: number): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] !== Cell.WALL) return;
  world.features[idx] = Feature.SCREEN;
  world.wallTex[idx] = (Tex.SCREEN_BASE + (frame % 8) * 4) as Tex;
  if (!world.screenCells.includes(idx)) world.screenCells.push(idx);
}

function placeDecisionContainers(world: World, rooms: MoebiusRooms): void {
  addContainer(world, rooms.seamNorth, rooms.seamNorth.x + 8, rooms.seamNorth.y + 10, ContainerKind.FILING_CABINET, 'Журнал прямой стороны подъезда', 'public', [
    { defId: 'chalk', count: 1 },
    { defId: 'neighbor_complaint', count: 1 },
  ], ['moebius_podezd', 'mirror_tell', 'public_loop', 'choose_corridor']);
  addContainer(world, rooms.seamSouth, rooms.seamSouth.x + rooms.seamSouth.w - 9, rooms.seamSouth.y + 10, ContainerKind.FILING_CABINET, 'Журнал обратной стороны подъезда', 'public', [
    { defId: 'chalk', count: 1 },
    { defId: 'sealed_complaint', count: 1 },
  ], ['moebius_podezd', 'mirror_tell', 'orientation_flip', 'choose_corridor']);
  addContainer(world, rooms.lostMarker, rooms.lostMarker.x + 12, rooms.lostMarker.y + 9, ContainerKind.SECRET_STASH, 'Коробка с потерянной меткой маршрута', 'secret', [
    { defId: 'chalk', count: 2 },
    { defId: 'elevator_access_order', count: 1 },
    { defId: 'container_key_label', count: 1 },
  ], ['moebius_podezd', 'route_marker', 'recover', 'secret', 'mirror_tell']);
  addContainer(world, rooms.shortcut, SHORTCUT_X + 3, 510, ContainerKind.TOOL_LOCKER, 'Щиток паритетного замка', 'locked', [
    { defId: SEAM_KEY_ID, count: 1 },
    { defId: 'wire_coil', count: 1 },
    { defId: 'fuse', count: 1 },
  ], ['moebius_podezd', 'seam_lock', 'break', 'shortcut']);
  for (const [i, room] of rooms.mirroredFlats.entries()) {
    if (i % 5 !== 0) continue;
    addContainer(world, room, room.x + room.w - 7, room.y + 6, ContainerKind.WOODEN_CHEST, `Зеркальная тумба ${i + 1}`, 'room', [
      { defId: i % 2 === 0 ? 'bread' : 'water_coupon', count: 1 },
      { defId: i % 2 === 0 ? 'felt_door_pad' : 'rubber_door_wedge', count: 1 },
    ], ['moebius_podezd', 'mirror_tell', 'flat_pair', i % 2 === 0 ? 'safe_side' : 'reverse_side']);
  }
}

function addContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: Item[],
  tags: string[],
): WorldContainer {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: world.wrap(x),
    y: world.wrap(y),
    floor: MOEBIUS_PODEZD_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: Math.max(8, inventory.length + 4),
    access,
    lockDifficulty: access === 'locked' ? 3 : undefined,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.TOOL_LOCKER ? Feature.APPARATUS : Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function spawnReversedPatrols(entities: Entity[], nextId: NextId): void {
  spawnPatrolNpc(entities, nextId, 'Ликвидатор обратного обхода север', 746, 405, 274, 405, Math.PI);
  spawnPatrolNpc(entities, nextId, 'Ликвидатор обратного обхода юг', 274, 619, 746, 619, 0);
  spawnPatrolNpc(entities, nextId, 'Свидетель обратного обхода А', 332, 405, 332, 619, Math.PI / 2, Faction.CITIZEN, Occupation.TRAVELER);
  spawnPatrolNpc(entities, nextId, 'Свидетель обратного обхода Б', 690, 619, 690, 405, -Math.PI / 2, Faction.CITIZEN, Occupation.HOUSEWIFE);
}

function spawnPatrolNpc(
  entities: Entity[],
  nextId: NextId,
  name: string,
  x: number,
  y: number,
  tx: number,
  ty: number,
  angle: number,
  faction = Faction.LIQUIDATOR,
  occupation = Occupation.HUNTER,
): void {
  const liquidator = faction === Faction.LIQUIDATOR;
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle,
    pitch: 0,
    alive: true,
    speed: liquidator ? 0.92 : 0.76,
    sprite: occupation,
    name,
    needs: freshNeeds(),
    hp: liquidator ? 145 : 88,
    maxHp: liquidator ? 145 : 88,
    money: liquidator ? 36 : 9,
    ai: { goal: AIGoal.GOTO, tx: tx + 0.5, ty: ty + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: liquidator
      ? [{ defId: 'rubber_club', count: 1 }, { defId: 'ammo_9mm', count: 8 }]
      : [{ defId: 'bread', count: 1 }, { defId: 'chalk', count: 1 }],
    weapon: liquidator ? 'rubber_club' : undefined,
    faction,
    occupation,
    questId: -1,
    rpg: randomRPG(liquidator ? 3 : 1),
  });
}

function spawnSeamThreats(world: World, entities: Entity[], nextId: NextId): void {
  spawnMonster(world, entities, nextId, MonsterKind.SHOVNIK, 512, 510, 3, 'Шовник на паритетном замке');
  spawnMonster(world, entities, nextId, MonsterKind.NELYUD, 640, 638, 2, 'Нелюдь из обратной квартиры');
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: NextId,
  kind: MonsterKind,
  x: number,
  y: number,
  level: number,
  name: string,
): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) return;
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = Math.round(def.hp * (0.9 + level * 0.16));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
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
    ai: { goal: AIGoal.WANDER, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
  });
}

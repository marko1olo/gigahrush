/* -- Design floor: shahta_atrium / Шахта-атриум ---------------- */

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
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { ITEMS } from '../../data/catalog';
import { MONSTERS } from '../../entities/monster';
import { Spr } from '../../render/sprite_index';
import { placeEmergencyPanel } from '../../systems/emergency_panels';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG } from '../../systems/rpg';
import {
  ensureConnectivity,
  generateZones,
  placeDoor,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'shahta_atrium' as const;
export const SHAHTA_ATRIUM_ROUTE_Z = -24 as const;
export const SHAHTA_ATRIUM_BASE_FLOOR = FloorLevel.MAINTENANCE;

const CX = W >> 1;
const CY = W >> 1;
const INNER_R = 138;
const MID_R = 212;
const OUTER_R = 304;
const VOID_R = 116;

export interface ShahtaAtriumBridgeState {
  id: string;
  name: string;
  exposedCells: number;
  coverCells: number;
  repairable: boolean;
  gapCells: number;
}

export interface ShahtaAtriumState {
  routeId: typeof DESIGN_FLOOR_ID;
  z: typeof SHAHTA_ATRIUM_ROUTE_Z;
  baseFloor: typeof SHAHTA_ATRIUM_BASE_FLOOR;
  voidCells: number;
  ringCells: number;
  bridgeCount: number;
  serviceBypassCells: number;
  coverIslands: number;
  losCoverScore: number;
  repairableBridgeId: string;
  bridges: ShahtaAtriumBridgeState[];
}

export interface ShahtaAtriumGeneration extends FloorGeneration {
  shahtaAtriumState: ShahtaAtriumState;
}

interface BridgeBuild {
  state: ShahtaAtriumBridgeState;
  cells: number[];
}

function logicalRoom(
  world: World,
  type: RoomType,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  wallTex: Tex,
  floorTex: Tex,
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

function paintBoxRoom(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
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
      const i = world.idx(room.x + dx, room.y + dy);
      world.floorTex[i] = floorTex;
    }
  }
}

function boxRoom(
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
  paintBoxRoom(world, room, wallTex, floorTex);
  return room;
}

function setFloor(world: World, room: Room, x: number, y: number, floorTex = room.floorTex): boolean {
  const i = world.idx(x, y);
  if (world.cells[i] === Cell.LIFT) return false;
  world.cells[i] = Cell.FLOOR;
  world.roomMap[i] = room.id;
  world.floorTex[i] = floorTex;
  world.wallTex[i] = room.wallTex;
  world.features[i] = Feature.NONE;
  world.fog[i] = 0;
  return true;
}

function setAbyss(world: World, x: number, y: number): boolean {
  const i = world.idx(x, y);
  if (world.cells[i] === Cell.LIFT || world.features[i] === Feature.LIFT_BUTTON) return false;
  world.cells[i] = Cell.ABYSS;
  world.roomMap[i] = -1;
  world.floorTex[i] = Tex.F_ABYSS;
  world.wallTex[i] = Tex.DARK;
  world.features[i] = Feature.NONE;
  world.fog[i] = 34;
  return true;
}

function setFeature(world: World, x: number, y: number, feature: Feature): boolean {
  const i = world.idx(x, y);
  if (world.cells[i] !== Cell.FLOOR && world.cells[i] !== Cell.WATER) return false;
  world.features[i] = feature;
  return true;
}

function setCoverWall(world: World, x: number, y: number): boolean {
  const i = world.idx(x, y);
  if (world.cells[i] !== Cell.FLOOR) return false;
  world.cells[i] = Cell.WALL;
  world.roomMap[i] = -1;
  world.wallTex[i] = Tex.METAL;
  world.features[i] = Feature.NONE;
  return true;
}

function carveRect(world: World, room: Room, x: number, y: number, w: number, h: number, floorTex = room.floorTex): number {
  let count = 0;
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (setFloor(world, room, x + dx, y + dy, floorTex)) count++;
    }
  }
  return count;
}

function carveRing(world: World, room: Room, radius: number, halfWidth: number, floorTex: Tex): number {
  let count = 0;
  const maxR = radius + halfWidth + 1;
  for (let y = CY - maxR; y <= CY + maxR; y++) {
    for (let x = CX - maxR; x <= CX + maxR; x++) {
      const d = Math.hypot(x - CX, y - CY);
      if (Math.abs(d - radius) > halfWidth) continue;
      if (setFloor(world, room, x, y, floorTex)) count++;
    }
  }
  return count;
}

function carveAbyss(world: World): number {
  let count = 0;
  for (let y = CY - VOID_R; y <= CY + VOID_R; y++) {
    for (let x = CX - VOID_R; x <= CX + VOID_R; x++) {
      const d = Math.hypot(x - CX, y - CY);
      if (d > VOID_R) continue;
      if (setAbyss(world, x, y)) count++;
    }
  }
  return count;
}

function carveLine(
  world: World,
  room: Room,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
): number[] {
  const cells: number[] = [];
  const dx = bx - ax;
  const dy = by - ay;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  const r = Math.max(0, Math.floor(width / 2));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(ax + dx * s / steps);
    const y = Math.round(ay + dy * s / steps);
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        if (ox * ox + oy * oy > r * r + 1) continue;
        const px = world.wrap(x + ox);
        const py = world.wrap(y + oy);
        const i = world.idx(px, py);
        if (setFloor(world, room, px, py, floorTex) && !cells.includes(i)) cells.push(i);
      }
    }
  }
  return cells;
}

function placeLift(world: World, liftX: number, liftY: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(liftX, liftY);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.roomMap[li] = -1;
  world.liftDir[li] = direction;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

function buildServiceRim(world: World): { rooms: Room[]; cells: number } {
  const north = logicalRoom(world, RoomType.CORRIDOR, 'Северный сервисный обход шахты', 0, 83, W, 7, Tex.METAL, Tex.F_CONCRETE);
  const south = logicalRoom(world, RoomType.CORRIDOR, 'Южный сервисный обход шахты', 0, 934, W, 7, Tex.METAL, Tex.F_CONCRETE);
  const west = logicalRoom(world, RoomType.CORRIDOR, 'Западный сервисный обход шахты', 83, 0, 7, W, Tex.METAL, Tex.F_CONCRETE);
  const east = logicalRoom(world, RoomType.CORRIDOR, 'Восточный сервисный обход шахты', 934, 0, 7, W, Tex.METAL, Tex.F_CONCRETE);
  let cells = 0;
  cells += carveRect(world, north, 0, 83, W, 7);
  cells += carveRect(world, south, 0, 934, W, 7);
  cells += carveRect(world, west, 83, 0, 7, W);
  cells += carveRect(world, east, 934, 0, 7, W);
  return { rooms: [north, south, west, east], cells };
}

function buildRingsAndSpokes(world: World): { ringCells: number; ringRoom: Room; spokeRooms: Room[] } {
  const ringRoom = logicalRoom(world, RoomType.CORRIDOR, 'Кольцевая галерея шахты-атриума', CX - OUTER_R - 10, CY - OUTER_R - 10, OUTER_R * 2 + 20, OUTER_R * 2 + 20, Tex.PIPE, Tex.F_CONCRETE);
  let ringCells = 0;
  ringCells += carveRing(world, ringRoom, INNER_R, 7, Tex.F_TILE);
  ringCells += carveRing(world, ringRoom, MID_R, 6, Tex.F_CONCRETE);
  ringCells += carveRing(world, ringRoom, OUTER_R, 7, Tex.F_CONCRETE);

  const north = logicalRoom(world, RoomType.CORRIDOR, 'Северное ребро лифтовой шахты', CX - 4, 86, 9, CY - OUTER_R - 86, Tex.PIPE, Tex.F_CONCRETE);
  const south = logicalRoom(world, RoomType.CORRIDOR, 'Южное ребро лифтовой шахты', CX - 4, CY + OUTER_R, 9, 936 - (CY + OUTER_R), Tex.PIPE, Tex.F_CONCRETE);
  const west = logicalRoom(world, RoomType.CORRIDOR, 'Западное ребро лифтовой шахты', 86, CY - 4, CX - OUTER_R - 86, 9, Tex.PIPE, Tex.F_CONCRETE);
  const east = logicalRoom(world, RoomType.CORRIDOR, 'Восточное ребро лифтовой шахты', CX + OUTER_R, CY - 4, 936 - (CX + OUTER_R), 9, Tex.PIPE, Tex.F_CONCRETE);
  carveLine(world, north, CX, 86, CX, CY - OUTER_R, 7, Tex.F_CONCRETE);
  carveLine(world, south, CX, CY + OUTER_R, CX, 936, 7, Tex.F_CONCRETE);
  carveLine(world, west, 86, CY, CX - OUTER_R, CY, 7, Tex.F_CONCRETE);
  carveLine(world, east, CX + OUTER_R, CY, 936, CY, 7, Tex.F_CONCRETE);
  return { ringCells, ringRoom, spokeRooms: [north, south, west, east] };
}

function buildBridge(
  world: World,
  id: string,
  name: string,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  repairable = false,
): BridgeBuild {
  const room = logicalRoom(world, RoomType.CORRIDOR, name, Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + width + 1, Math.abs(by - ay) + width + 1, Tex.METAL, Tex.F_TILE);
  const cells = carveLine(world, room, ax, ay, bx, by, width, Tex.F_TILE);
  let gapCells = 0;
  if (repairable) {
    const gx = Math.round((ax + bx) / 2);
    const gy = Math.round((ay + by) / 2);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
        if (setAbyss(world, gx + dx, gy + dy)) gapCells++;
      }
    }
  }
  return {
    state: { id, name, exposedCells: cells.length, coverCells: 0, repairable, gapCells },
    cells,
  };
}

function addBridgeCover(world: World, bridge: BridgeBuild, salt: number): number {
  let islands = 0;
  const stride = Math.max(28, Math.floor(bridge.cells.length / 7));
  for (let i = stride; i < bridge.cells.length - stride; i += stride) {
    const cell = bridge.cells[(i + salt * 11) % bridge.cells.length];
    const x = cell % W;
    const y = (cell / W) | 0;
    const side = (i / stride + salt) % 2 === 0 ? -3 : 3;
    if (Math.abs(y - CY) <= Math.abs(x - CX)) {
      if (setCoverWall(world, x, y + side)) islands++;
      setFeature(world, x, y - side, Feature.MACHINE);
    } else {
      if (setCoverWall(world, x + side, y)) islands++;
      setFeature(world, x - side, y, Feature.MACHINE);
    }
  }
  bridge.state.coverCells = islands;
  return islands;
}

function buildBridges(world: World): { bridges: BridgeBuild[]; coverIslands: number } {
  const bridges = [
    buildBridge(world, 'shahta_west_east_bridge', 'Открытый мост запад-восток', CX - OUTER_R, CY, CX + OUTER_R, CY, 7),
    buildBridge(world, 'shahta_north_south_bridge', 'Открытый мост север-юг', CX, CY - OUTER_R, CX, CY + OUTER_R, 7),
    buildBridge(world, 'shahta_diag_service_bridge', 'Диагональный мост сервисной смены', CX - MID_R, CY - MID_R, CX + MID_R, CY + MID_R, 5),
    buildBridge(world, 'shahta_diag_cover_bridge', 'Диагональный мост с островами укрытий', CX - MID_R, CY + MID_R, CX + MID_R, CY - MID_R, 5),
    buildBridge(world, 'shahta_repair_chord', 'Ремонтная перемычка над шахтой', CX + 128, CY - OUTER_R + 22, CX + OUTER_R - 20, CY - 126, 5, true),
  ];
  let coverIslands = 0;
  for (let i = 0; i < bridges.length; i++) coverIslands += addBridgeCover(world, bridges[i], i + 1);
  return { bridges, coverIslands };
}

function buildServiceRooms(world: World, rimRooms: readonly Room[]): {
  control: Room;
  repair: Room;
  shelter: Room;
  cache: Room;
} {
  const control = boxRoom(world, RoomType.OFFICE, 452, 70, 38, 12, 'Пульт шахты-атриума', Tex.PANEL, Tex.F_LINO);
  const repair = boxRoom(world, RoomType.PRODUCTION, 942, 472, 15, 42, 'Ремонтный пост перемычки', Tex.PIPE, Tex.F_CONCRETE);
  const shelter = boxRoom(world, RoomType.COMMON, 534, 942, 44, 15, 'Убежище сервисного обода', Tex.CONCRETE, Tex.F_LINO);
  const cache = boxRoom(world, RoomType.STORAGE, 66, 544, 16, 38, 'Кладовая мостовых листов', Tex.METAL, Tex.F_CONCRETE);
  placeDoor(world, control, rimRooms[0], '', false);
  placeDoor(world, repair, rimRooms[3], '', false);
  placeDoor(world, shelter, rimRooms[1], '', false);
  placeDoor(world, cache, rimRooms[2], '', false);
  return { control, repair, shelter, cache };
}

function dressRooms(world: World, rooms: ReturnType<typeof buildServiceRooms>): void {
  setFeature(world, rooms.control.x + 5, rooms.control.y + 4, Feature.DESK);
  setFeature(world, rooms.control.x + 13, rooms.control.y + 4, Feature.SCREEN);
  setFeature(world, rooms.control.x + 26, rooms.control.y + 4, Feature.APPARATUS);
  setFeature(world, rooms.control.x + 33, rooms.control.y + 8, Feature.LAMP);

  for (let y = rooms.repair.y + 4; y < rooms.repair.y + rooms.repair.h - 4; y += 7) {
    setFeature(world, rooms.repair.x + 5, y, Feature.MACHINE);
    setFeature(world, rooms.repair.x + 9, y + 2, Feature.APPARATUS);
  }
  setFeature(world, rooms.repair.x + 6, rooms.repair.y + rooms.repair.h - 5, Feature.LAMP);

  for (let x = rooms.shelter.x + 5; x < rooms.shelter.x + rooms.shelter.w - 5; x += 8) {
    setFeature(world, x, rooms.shelter.y + 5, Feature.TABLE);
    setFeature(world, x + 2, rooms.shelter.y + 9, Feature.CHAIR);
  }
  setFeature(world, rooms.shelter.x + rooms.shelter.w - 5, rooms.shelter.y + 4, Feature.LAMP);

  for (let y = rooms.cache.y + 4; y < rooms.cache.y + rooms.cache.h - 4; y += 6) {
    setFeature(world, rooms.cache.x + 4, y, Feature.SHELF);
    setFeature(world, rooms.cache.x + 10, y, Feature.SHELF);
  }
  setFeature(world, rooms.cache.x + 7, rooms.cache.y + rooms.cache.h - 5, Feature.LAMP);
}

function addContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  inventory: readonly { defId: string; count: number }[],
  tags: readonly string[],
  access: WorldContainer['access'] = 'room',
): WorldContainer {
  const cleanInventory = inventory.filter(item => ITEMS[item.defId]).map(item => ({ defId: item.defId, count: item.count }));
  const id = world.containers.length + 1;
  const ci = world.idx(x, y);
  const container: WorldContainer = {
    id,
    x: world.wrap(x),
    y: world.wrap(y),
    floor: SHAHTA_ATRIUM_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory: cleanInventory,
    capacitySlots: Math.max(8, cleanInventory.length + 4),
    faction: access === 'public' ? undefined : Faction.LIQUIDATOR,
    access,
    lockDifficulty: access === 'locked' ? 3 : undefined,
    discovered: true,
    tags: ['shahta_atrium', ...tags],
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.TOOL_LOCKER ? Feature.MACHINE : Feature.SHELF);
  return container;
}

function spawnMonster(entities: Entity[], nextId: { v: number }, kind: MonsterKind, x: number, y: number, level: number): void {
  const def = MONSTERS[kind];
  const hp = Math.round(def.hp * (1 + Math.max(0, level - 1) * 0.18));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
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

function dropItem(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count = 1): void {
  if (!ITEMS[defId]) return;
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

function placeCoverIslandsOnRings(world: World): number {
  let count = 0;
  for (let n = 0; n < 28; n++) {
    const angle = n * Math.PI * 2 / 28;
    const radius = n % 2 === 0 ? MID_R : OUTER_R;
    const x = Math.round(CX + Math.cos(angle) * radius);
    const y = Math.round(CY + Math.sin(angle) * radius);
    if (setCoverWall(world, x, y)) count++;
    setFeature(world, x + Math.round(Math.cos(angle + Math.PI / 2) * 3), y + Math.round(Math.sin(angle + Math.PI / 2) * 3), Feature.MACHINE);
  }
  return count;
}

function registerCues(world: World, rooms: ReturnType<typeof buildServiceRooms>, state: ShahtaAtriumState): void {
  registerRouteCue(world, {
    id: 'shahta_exposed_bridge',
    x: CX - OUTER_R + 16,
    y: CY,
    targetX: CX + OUTER_R - 16,
    targetY: CY,
    floor: SHAHTA_ATRIUM_BASE_FLOOR,
    label: 'Открытый мост',
    hint: 'Быстро, шумно, почти без укрытий. Монстров удобно выманивать на прямую.',
    targetName: 'восточная галерея шахты',
    color: '#ffb36b',
    tags: ['shahta_atrium', 'bridge', 'exposed', 'quick_crossing', 'los_score'],
    toneSeed: 7101,
    roomId: state.bridges[0]?.exposedCells ? rooms.control.id : undefined,
    routeGroup: {
      id: 'shahta_crossing_choice',
      lead: 'Шахта открыта до темноты.',
      risk: 'Прямая простреливается.',
      decision: 'идти мостом или обходить ободом',
      reward: 'быстрый переход к нижнему лифту',
    },
  });
  registerRouteCue(world, {
    id: 'shahta_service_rim',
    x: 86,
    y: CY,
    targetX: 936,
    targetY: CY,
    floor: SHAHTA_ATRIUM_BASE_FLOOR,
    label: 'Сервисный обод',
    hint: 'Длинный обход с укрытиями, шкафами и аварийным щитком.',
    targetName: 'восточный ремонтный пост',
    color: '#9fd6ff',
    tags: ['shahta_atrium', 'service_rim', 'safe_spiral', 'cover'],
    toneSeed: 7102,
    roomId: rooms.cache.id,
    targetRoomId: rooms.repair.id,
  });
  registerRouteCue(world, {
    id: 'shahta_repair_chord',
    x: rooms.repair.x + 6,
    y: rooms.repair.y + 7,
    targetX: CX + 214,
    targetY: CY - 216,
    floor: SHAHTA_ATRIUM_BASE_FLOOR,
    label: 'Ремонт перемычки',
    hint: 'Перемычка оборвана над провалом. Щиток и листы дают короткий путь, но это не главный маршрут.',
    targetName: 'оборванная перемычка',
    color: '#ffd35f',
    tags: ['shahta_atrium', 'repairable_bridge', 'optional_repair', 'bridge_chord'],
    toneSeed: 7103,
    roomId: rooms.repair.id,
    targetRoomId: rooms.repair.id,
  });
  registerRouteCue(world, {
    id: 'shahta_cover_islands',
    x: CX,
    y: CY - MID_R,
    targetX: CX,
    targetY: CY + MID_R,
    floor: SHAHTA_ATRIUM_BASE_FLOOR,
    label: 'Острова укрытий',
    hint: `Укрытия на мостах: ${state.coverIslands}, оценка LOS/cover ${state.losCoverScore}.`,
    targetName: 'южная дуга атриума',
    color: '#d8f0ad',
    tags: ['shahta_atrium', 'cover', 'lure_lane', 'los_cover_score'],
    toneSeed: 7104,
  });
}

function tuneShahtaZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CX, CY);
    if (d < 180) {
      zone.faction = ZoneFaction.SAMOSBOR;
      zone.level = Math.max(zone.level, 5);
    } else if (d < 330) {
      zone.faction = zone.id % 3 === 0 ? ZoneFaction.WILD : ZoneFaction.LIQUIDATOR;
      zone.level = Math.max(zone.level, 4);
    } else {
      zone.faction = zone.id % 5 === 0 ? ZoneFaction.WILD : ZoneFaction.LIQUIDATOR;
      zone.level = Math.max(zone.level, 3);
    }
    zone.fogged = false;
  }
  for (let i = 0; i < W * W; i++) {
    const zone = world.zones[world.zoneMap[i]];
    world.factionControl[i] = zone?.faction ?? ZoneFaction.LIQUIDATOR;
  }
}

function buildState(
  voidCells: number,
  ringCells: number,
  serviceBypassCells: number,
  coverIslands: number,
  bridges: readonly BridgeBuild[],
): ShahtaAtriumState {
  const bridgeStates = bridges.map(bridge => bridge.state);
  const totalBridgeCells = bridgeStates.reduce((sum, bridge) => sum + bridge.exposedCells, 0);
  const totalCover = bridgeStates.reduce((sum, bridge) => sum + bridge.coverCells, 0) + coverIslands;
  return {
    routeId: DESIGN_FLOOR_ID,
    z: SHAHTA_ATRIUM_ROUTE_Z,
    baseFloor: SHAHTA_ATRIUM_BASE_FLOOR,
    voidCells,
    ringCells,
    bridgeCount: bridgeStates.filter(bridge => !bridge.repairable).length,
    serviceBypassCells,
    coverIslands,
    losCoverScore: Math.round(totalCover * 1000 / Math.max(1, totalBridgeCells)),
    repairableBridgeId: 'shahta_repair_chord',
    bridges: bridgeStates,
  };
}

export function generateShahtaAtriumDesignFloor(): ShahtaAtriumGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };

  world.wallTex.fill(Tex.METAL);
  world.floorTex.fill(Tex.F_CONCRETE);
  world.factionControl.fill(ZoneFaction.LIQUIDATOR);

  const rim = buildServiceRim(world);
  const voidCells = carveAbyss(world);
  const { ringCells } = buildRingsAndSpokes(world);
  const { bridges, coverIslands: bridgeCover } = buildBridges(world);
  const ringCover = placeCoverIslandsOnRings(world);
  const rooms = buildServiceRooms(world, rim.rooms);
  dressRooms(world, rooms);

  placeLift(world, CX, 82, CX, 84, LiftDirection.UP);
  placeLift(world, CX, 941, CX, 940, LiftDirection.DOWN);
  placeLift(world, 82, CY, 84, CY, LiftDirection.UP);
  placeLift(world, 941, CY, 940, CY, LiftDirection.DOWN);

  sanitizeDoors(world);
  ensureConnectivity(world, CX + OUTER_R + 8.5, CY + 0.5);
  generateZones(world);
  tuneShahtaZones(world);

  placeEmergencyPanel(world, rooms.repair.x + 7, rooms.repair.y + 6, 'panel_doors', 7103);
  addContainer(world, rooms.repair, rooms.repair.x + 6, rooms.repair.y + 30, ContainerKind.TOOL_LOCKER, 'Шкаф ремонта перемычки', [
    { defId: 'metal_sheet', count: 2 },
    { defId: 'wire_coil', count: 1 },
    { defId: 'door_kit', count: 1 },
    { defId: 'fuse', count: 1 },
  ], ['repair', 'repairable_bridge', 'bridge_chord'], 'locked');
  addContainer(world, rooms.cache, rooms.cache.x + 7, rooms.cache.y + 28, ContainerKind.METAL_CABINET, 'Кладовая мостовых листов', [
    { defId: 'metal_sheet', count: 3 },
    { defId: 'gear', count: 1 },
    { defId: 'sealant_tube', count: 1 },
  ], ['service_rim', 'cover', 'repair'], 'room');
  addContainer(world, rooms.shelter, rooms.shelter.x + 35, rooms.shelter.y + 5, ContainerKind.EMERGENCY_BOX, 'Ящик сервисного обода', [
    { defId: 'bandage', count: 2 },
    { defId: 'water', count: 1 },
    { defId: 'bread', count: 1 },
  ], ['shelter', 'service_rim', 'public'], 'public');

  spawnMonster(entities, nextId, MonsterKind.REBAR, CX - 12, CY - 72, 4);
  spawnMonster(entities, nextId, MonsterKind.TRUBNYY_AVTOMAT, CX + 92, CY + 4, 4);
  spawnMonster(entities, nextId, MonsterKind.TUBE_EEL, CX - 82, CY + 12, 3);
  dropItem(entities, nextId, rooms.control.x + 18, rooms.control.y + 7, 'relay_diagram');
  dropItem(entities, nextId, rooms.cache.x + 9, rooms.cache.y + 9, 'wire_coil');

  const state = buildState(voidCells, ringCells, rim.cells, bridgeCover + ringCover, bridges);
  registerCues(world, rooms, state);

  world.markCellsDirty();
  world.markFloorTexDirty();
  world.markWallTexDirty();
  world.markFeaturesDirty(true);
  world.markFogDirty();
  world.bakeLights();

  return {
    world,
    entities,
    spawnX: CX + OUTER_R + 8.5,
    spawnY: CY + 0.5,
    shahtaAtriumState: state,
  };
}

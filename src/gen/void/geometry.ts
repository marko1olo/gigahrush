/* ── VOID macro geometry: islands, folds, shelters, boss lane ─── */

import {
  W, Cell, Tex, Feature, LiftDirection, DoorState, RoomType,
  type Room,
} from '../../core/types';
import { World } from '../../core/world';
import { placeDoorAt, stampRoom } from '../shared';

export interface VoidGeometryLayout {
  spawnX: number;
  spawnY: number;
  bossX: number;
  bossY: number;
}

interface IslandSpec {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  shardSeed: number;
}

const SPAWN_X = W >> 1;
const SPAWN_Y = W >> 1;

const ISLANDS: IslandSpec[] = [
  { cx: SPAWN_X, cy: SPAWN_Y, rx: 20, ry: 15, shardSeed: 1 },
  { cx: 458, cy: 540, rx: 17, ry: 11, shardSeed: 2 },
  { cx: 432, cy: 492, rx: 18, ry: 12, shardSeed: 3 },
  { cx: 562, cy: 508, rx: 24, ry: 15, shardSeed: 4 },
  { cx: 526, cy: 574, rx: 26, ry: 15, shardSeed: 5 },
  { cx: 616, cy: 560, rx: 22, ry: 12, shardSeed: 6 },
  { cx: 684, cy: 558, rx: 29, ry: 20, shardSeed: 7 },
  { cx: 1000, cy: 496, rx: 18, ry: 11, shardSeed: 8 },
  { cx: 28, cy: 496, rx: 18, ry: 11, shardSeed: 9 },
  { cx: 948, cy: 620, rx: 16, ry: 10, shardSeed: 10 },
  { cx: 84, cy: 636, rx: 18, ry: 12, shardSeed: 11 },
  { cx: 324, cy: 628, rx: 21, ry: 13, shardSeed: 12 },
  { cx: 742, cy: 486, rx: 17, ry: 11, shardSeed: 13 },
  { cx: 800, cy: 532, rx: 19, ry: 12, shardSeed: 14 },
  { cx: 652, cy: 684, rx: 20, ry: 12, shardSeed: 15 },
  { cx: 388, cy: 382, rx: 18, ry: 12, shardSeed: 16 },
];

const FOLDED_PATHS: readonly (readonly (readonly [number, number])[])[] = [
  [[SPAWN_X, SPAWN_Y], [500, 512], [500, 536], [458, 536], [458, 550]],
  [[458, 540], [458, 506], [432, 506], [432, 492]],
  [[SPAWN_X, SPAWN_Y], [526, 512], [526, 498], [544, 498], [544, 508]],
  [[SPAWN_X, SPAWN_Y], [512, 538], [528, 538], [528, 574]],
  [[562, 508], [592, 508], [592, 560], [616, 560]],
  [[526, 574], [560, 574], [560, 560], [616, 560]],
  [[432, 492], [1000, 492], [28, 492], [84, 636], [324, 628], [526, 574]],
  [[616, 560], [684, 558]],
  [[684, 558], [742, 486], [800, 532], [684, 558]],
  [[526, 574], [652, 684], [948, 620], [28, 496]],
  [[432, 492], [388, 382], [562, 508]],
];

function setVoidFloor(world: World, x: number, y: number): void {
  const i = world.idx(x, y);
  if (world.cells[i] === Cell.LIFT) return;
  world.cells[i] = Cell.FLOOR;
  world.roomMap[i] = -1;
  world.floorTex[i] = Tex.F_VOID;
  world.wallTex[i] = 0;
}

function setVoidWall(world: World, x: number, y: number): void {
  const i = world.idx(x, y);
  if (world.cells[i] === Cell.LIFT) return;
  world.cells[i] = Cell.WALL;
  world.roomMap[i] = -1;
  world.wallTex[i] = Tex.VOID_WALL;
  world.floorTex[i] = 0;
  world.features[i] = Feature.NONE;
}

function carveDisk(world: World, cx: number, cy: number, radius: number): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= r2) setVoidFloor(world, cx + dx, cy + dy);
    }
  }
}

function carveEllipse(world: World, spec: IslandSpec): void {
  for (let dy = -spec.ry; dy <= spec.ry; dy++) {
    for (let dx = -spec.rx; dx <= spec.rx; dx++) {
      const nx = dx / (spec.rx + 0.35);
      const ny = dy / (spec.ry + 0.35);
      if (nx * nx + ny * ny <= 1) setVoidFloor(world, spec.cx + dx, spec.cy + dy);
    }
  }

  const shards = 3 + (spec.shardSeed % 4);
  for (let s = 0; s < shards; s++) {
    const ax = spec.cx + Math.round(Math.cos((spec.shardSeed + s) * 1.72) * spec.rx * 0.52);
    const ay = spec.cy + Math.round(Math.sin((spec.shardSeed + s) * 1.31) * spec.ry * 0.52);
    if (Math.abs(world.delta(ax, spec.cx)) < 4 && Math.abs(world.delta(ay, spec.cy)) < 4) continue;
    setVoidWall(world, ax, ay);
    if (s % 2 === 0) setVoidWall(world, ax + 1, ay);
    else setVoidWall(world, ax, ay + 1);
  }
}

function carveWideCell(world: World, x: number, y: number, width: number): void {
  for (let dy = -width; dy <= width; dy++) {
    for (let dx = -width; dx <= width; dx++) {
      if (Math.abs(dx) + Math.abs(dy) <= width + 1) setVoidFloor(world, x + dx, y + dy);
    }
  }
}

function carveBand(world: World, ax: number, ay: number, bx: number, by: number, width: number): void {
  const ddx = world.delta(ax, bx);
  const ddy = world.delta(ay, by);
  const steps = Math.max(Math.abs(ddx), Math.abs(ddy), 1);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = world.wrap(Math.round(ax + ddx * t));
    const y = world.wrap(Math.round(ay + ddy * t));
    carveWideCell(world, x, y, width);
  }
}

function carvePath(world: World, points: readonly (readonly [number, number])[], width: number): void {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    carveBand(world, a[0], a[1], b[0], b[1], width);
  }
}

function carveEchoAlcoves(world: World): void {
  for (let i = 0; i < 5; i++) {
    const x = 462 - i * 7;
    const y = 520 + (i % 2) * 16;
    carveBand(world, x, y, x + 9, y, 2);
    setVoidWall(world, x + 4, y - 1);
    setVoidWall(world, x + 4, y + 1);
  }
  for (let i = 0; i < 4; i++) {
    const x = worldWrapLiteral(986 + i * 9);
    carveBand(world, x, 504, x, 516, 1);
    world.features[world.idx(x, 516)] = Feature.SCREEN;
  }
}

function worldWrapLiteral(v: number): number {
  return ((v % W) + W) % W;
}

function openDoor(world: World, x: number, y: number): void {
  const door = world.doors.get(world.idx(x, y));
  if (door) {
    door.state = DoorState.HERMETIC_OPEN;
    door.timer = 0;
  }
}

function setRoomVoidTextures(world: World, room: Room): void {
  room.wallTex = Tex.VOID_WALL;
  room.floorTex = Tex.F_VOID;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const i = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) world.floorTex[i] = Tex.F_VOID;
      else world.wallTex[i] = Tex.VOID_WALL;
    }
  }
}

function addShelterRoom(world: World): void {
  const room = stampRoom(world, world.rooms.length, RoomType.OFFICE, SPAWN_X - 10, SPAWN_Y - 27, 20, 11, -1);
  room.name = 'Световой карман';
  setRoomVoidTextures(world, room);
  const doorX = room.x + (room.w >> 1);
  const doorY = room.y + room.h;
  placeDoorAt(world, doorX, doorY, room.id);
  openDoor(world, doorX, doorY);
  carveBand(world, SPAWN_X, SPAWN_Y - 3, doorX, doorY + 1, 2);

  for (let x = room.x + 3; x < room.x + room.w - 3; x += 4) {
    world.features[world.idx(x, room.y + 2)] = Feature.LAMP;
  }
  world.features[world.idx(room.x + 2, room.y + room.h - 3)] = Feature.SHELF;
  world.features[world.idx(room.x + room.w - 3, room.y + room.h - 3)] = Feature.DESK;
}

function addProtocolFrame(world: World): void {
  const room = stampRoom(world, world.rooms.length, RoomType.OFFICE, 594, 520, 17, 11, -1);
  room.name = 'Пустотный повторитель';
  setRoomVoidTextures(world, room);
  const westDoorY = room.y + (room.h >> 1);
  const southDoorX = room.x + (room.w >> 1);
  placeDoorAt(world, room.x - 1, westDoorY, room.id);
  placeDoorAt(world, southDoorX, room.y + room.h, room.id);
  openDoor(world, room.x - 1, westDoorY);
  openDoor(world, southDoorX, room.y + room.h);
  carveBand(world, 592, 560, room.x - 2, westDoorY, 2);
  carveBand(world, southDoorX, room.y + room.h + 1, 616, 560, 2);

  for (let dx = 2; dx < room.w - 2; dx += 3) {
    world.features[world.idx(room.x + dx, room.y + 2)] = Feature.SCREEN;
    world.features[world.idx(room.x + dx, room.y + room.h - 3)] = Feature.APPARATUS;
  }
}

function addShelterNiches(world: World): void {
  for (const [x, y] of [[548, 576], [650, 544], [72, 636]] as const) {
    carveDisk(world, x, y, 5);
    world.features[world.idx(x, y)] = Feature.LAMP;
    world.features[world.idx(x + 2, y)] = Feature.SHELF;
  }
}

function addBossLane(world: World): void {
  carveBand(world, 616, 558, 684, 558, 3);
  for (let x = 624; x <= 676; x += 8) {
    world.features[world.idx(x, 555)] = Feature.LAMP;
    world.features[world.idx(x, 561)] = Feature.LAMP;
    if ((x / 8) % 2 === 0) {
      setVoidWall(world, x, 552);
      setVoidWall(world, x, 564);
    }
  }
}

function addReturnFrame(world: World, bossX: number, bossY: number): void {
  for (let a = 0; a < 24; a++) {
    const angle = (a / 24) * Math.PI * 2;
    const x = bossX + Math.round(Math.cos(angle) * 8);
    const y = bossY + Math.round(Math.sin(angle) * 6);
    const i = world.idx(x, y);
    if (world.cells[i] === Cell.FLOOR) {
      world.features[i] = a % 3 === 0 ? Feature.LAMP : Feature.SCREEN;
    }
  }
  world.features[world.idx(bossX - 10, bossY)] = Feature.APPARATUS;
  world.features[world.idx(bossX + 10, bossY)] = Feature.APPARATUS;
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const liftIdx = world.idx(x, y);
  world.cells[liftIdx] = Cell.LIFT;
  world.wallTex[liftIdx] = Tex.LIFT_DOOR;
  world.liftDir[liftIdx] = direction;
  const buttonIdx = world.idx(buttonX, buttonY);
  if (world.cells[buttonIdx] === Cell.FLOOR) {
    world.features[buttonIdx] = Feature.LIFT_BUTTON;
    world.liftDir[buttonIdx] = direction;
  }
}

function placeVoidLifts(world: World): void {
  carveBand(world, SPAWN_X - 17, SPAWN_Y + 8, SPAWN_X - 11, SPAWN_Y + 8, 2);
  placeLift(world, SPAWN_X - 20, SPAWN_Y + 8, SPAWN_X - 19, SPAWN_Y + 8, LiftDirection.DOWN);
  carveBand(world, 700, 570, 708, 570, 2);
  placeLift(world, 711, 570, 710, 570, LiftDirection.UP);
}

export function paintVoidDefaults(world: World): void {
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.FLOOR || world.cells[i] === Cell.DOOR) {
      if (world.floorTex[i] === 0) world.floorTex[i] = Tex.F_VOID;
      if (world.cells[i] === Cell.FLOOR) world.wallTex[i] = 0;
    } else if (world.cells[i] === Cell.WALL && world.wallTex[i] === 0) {
      world.wallTex[i] = Tex.VOID_WALL;
    }
  }
}

export function buildVoidGeometry(world: World): VoidGeometryLayout {
  for (let i = 0; i < W * W; i++) world.wallTex[i] = Tex.VOID_WALL;

  for (const island of ISLANDS) carveEllipse(world, island);
  for (const path of FOLDED_PATHS) carvePath(world, path, path[0][0] === 616 ? 3 : 1);

  addShelterRoom(world);
  addProtocolFrame(world);
  addShelterNiches(world);
  addBossLane(world);
  addReturnFrame(world, 684, 558);
  carveEchoAlcoves(world);
  placeVoidLifts(world);
  paintVoidDefaults(world);

  return {
    spawnX: SPAWN_X + 0.5,
    spawnY: SPAWN_Y + 0.5,
    bossX: 684,
    bossY: 558,
  };
}

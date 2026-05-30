/* -- Design floor: radon_exchange - scan-line transfer through concrete -- */

import {
  Cell,
  ContainerKind,
  DoorState,
  Feature,
  FloorLevel,
  LiftDirection,
  RoomType,
  Tex,
  W,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { REACH_GATE_NONE, auditReachability } from '../../core/world';
import { World } from '../../core/world';
import { registerRouteCue } from '../../systems/route_cues';
import { carveCorridor, ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const RADON_EXCHANGE_ROUTE_ID = 'radon_exchange' as const;
export const RADON_EXCHANGE_Z = 44 as const;
export const RADON_EXCHANGE_BASE_FLOOR = FloorLevel.MINISTRY;
export const RADON_EXCHANGE_PROJECTION_KEY = 'key' as const;

export const RADON_EXCHANGE_META = {
  routeId: RADON_EXCHANGE_ROUTE_ID,
  displayName: 'Радоновый обменник',
  z: RADON_EXCHANGE_Z,
  baseFloor: RADON_EXCHANGE_BASE_FLOOR,
  debugEntry: 'generateRadonExchangeDesignFloor()',
} as const;

export const RADON_EXCHANGE_ROOM_NAMES = {
  exchangeHall: 'Радоновый обменный зал',
  zeroRadius: 'Узел нулевого радиуса',
  shutterNorth: 'Северная кассета заслонок',
  shutterEast: 'Восточная кассета заслонок',
  serviceChord: 'Сервисная хорда бетонной проекции',
  projectionKey: 'Комната проекционного ключа',
  blindWedge: 'Слепой клин дозиметристов',
  upLift: 'Верхняя кабина радонового обменника',
  downLift: 'Нижняя кабина радонового обменника',
} as const;

interface Point {
  x: number;
  y: number;
}

interface RadonLine {
  angle: number;
  radius: number;
  width: number;
  floorTex: Tex;
}

interface RadonRooms {
  exchangeHall: Room;
  zeroRadius: Room;
  shutterNorth: Room;
  shutterEast: Room;
  serviceChord: Room;
  projectionKey: Room;
  blindWedge: Room;
  upLift: Room;
  downLift: Room;
}

export interface RadonExchangeMetrics {
  routeId: typeof RADON_EXCHANGE_ROUTE_ID;
  z: typeof RADON_EXCHANGE_Z;
  scanLineCells: number;
  serviceChordCells: number;
  blindWedgeCells: number;
  shutterDoors: number;
  projectionKeyContainers: number;
  controlRooms: number;
  coverCells: number;
  longestScanRun: number;
  ungatedUpLiftReachable: boolean;
  ungatedDownLiftReachable: boolean;
}

const CX = W >> 1;
const CY = W >> 1;
const EDGE = W - 1;
const SCAN_FLOOR = Tex.F_MARBLE_TILE;
const SERVICE_FLOOR = Tex.F_CONCRETE;
const CONTROL_FLOOR = Tex.F_PARQUET;
const ADMIN_WALL = Tex.MARBLE;
const SERVICE_WALL = Tex.METAL;
const BLIND_WALL = Tex.CONCRETE;
const DOOR_METAL = Tex.DOOR_METAL;

const RADON_LINES: readonly RadonLine[] = [
  { angle: 0, radius: -320, width: 1.25, floorTex: SCAN_FLOOR },
  { angle: 0, radius: -160, width: 1.6, floorTex: SCAN_FLOOR },
  { angle: 0, radius: 0, width: 2.2, floorTex: SCAN_FLOOR },
  { angle: 0, radius: 160, width: 1.6, floorTex: SCAN_FLOOR },
  { angle: 0, radius: 320, width: 1.25, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 2, radius: -288, width: 1.25, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 2, radius: -96, width: 1.5, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 2, radius: 96, width: 1.5, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 2, radius: 288, width: 1.25, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 4, radius: -250, width: 1.2, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 4, radius: 0, width: 1.7, floorTex: SCAN_FLOOR },
  { angle: Math.PI / 4, radius: 250, width: 1.2, floorTex: SCAN_FLOOR },
  { angle: -Math.PI / 4, radius: -250, width: 1.2, floorTex: SCAN_FLOOR },
  { angle: -Math.PI / 4, radius: 0, width: 1.7, floorTex: SCAN_FLOOR },
  { angle: -Math.PI / 4, radius: 250, width: 1.2, floorTex: SCAN_FLOOR },
];

const CONTROL_POINTS: readonly Point[] = [
  { x: 512, y: 512 },
  { x: 352, y: 416 },
  { x: 672, y: 416 },
  { x: 352, y: 608 },
  { x: 672, y: 608 },
  { x: 224, y: 512 },
  { x: 800, y: 512 },
  { x: 512, y: 224 },
  { x: 512, y: 800 },
];

const SHUTTER_DOORS: readonly { x: number; y: number; axis: 'horizontal' | 'vertical'; state: DoorState; keyId: string }[] = [
  { x: 512, y: 348, axis: 'vertical', state: DoorState.HERMETIC_OPEN, keyId: '' },
  { x: 512, y: 380, axis: 'vertical', state: DoorState.HERMETIC_CLOSED, keyId: '' },
  { x: 512, y: 644, axis: 'vertical', state: DoorState.HERMETIC_OPEN, keyId: '' },
  { x: 512, y: 676, axis: 'vertical', state: DoorState.HERMETIC_CLOSED, keyId: RADON_EXCHANGE_PROJECTION_KEY },
  { x: 348, y: 512, axis: 'horizontal', state: DoorState.HERMETIC_CLOSED, keyId: '' },
  { x: 380, y: 512, axis: 'horizontal', state: DoorState.HERMETIC_OPEN, keyId: '' },
  { x: 644, y: 512, axis: 'horizontal', state: DoorState.HERMETIC_CLOSED, keyId: RADON_EXCHANGE_PROJECTION_KEY },
  { x: 676, y: 512, axis: 'horizontal', state: DoorState.HERMETIC_OPEN, keyId: '' },
  { x: 400, y: 624, axis: 'horizontal', state: DoorState.CLOSED, keyId: '' },
  { x: 624, y: 400, axis: 'vertical', state: DoorState.CLOSED, keyId: '' },
];

function carveCell(world: World, x: number, y: number, floorTex: Tex): void {
  const idx = world.idx(x, y);
  if (world.aptMask[idx] || world.hermoWall[idx]) return;
  world.cells[idx] = Cell.FLOOR;
  world.roomMap[idx] = -1;
  world.floorTex[idx] = floorTex;
  world.features[idx] = Feature.NONE;
}

function carveDisc(world: World, x: number, y: number, radius: number, floorTex: Tex): void {
  const r = Math.max(1, Math.ceil(radius));
  const r2 = radius * radius;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      carveCell(world, Math.round(x + dx), Math.round(y + dy), floorTex);
    }
  }
}

function carveSegment(world: World, a: Point, b: Point, radius: number, floorTex: Tex): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 1.35));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    carveDisc(world, a.x + dx * t, a.y + dy * t, radius, floorTex);
  }
}

function carveRadonLine(world: World, line: RadonLine): void {
  const nx = Math.cos(line.angle);
  const ny = Math.sin(line.angle);
  const dx = -ny;
  const dy = nx;
  const baseX = CX + nx * line.radius;
  const baseY = CY + ny * line.radius;
  for (let t = -760; t <= 760; t += 0.8) {
    carveDisc(world, baseX + dx * t, baseY + dy * t, line.width, line.floorTex);
  }
}

function stampBlindWedge(world: World, cx: number, cy: number, angle: number, spread: number, inner: number, outer: number): void {
  const minX = Math.max(0, Math.floor(cx - outer - 2));
  const maxX = Math.min(EDGE, Math.ceil(cx + outer + 2));
  const minY = Math.max(0, Math.floor(cy - outer - 2));
  const maxY = Math.min(EDGE, Math.ceil(cy + outer + 2));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const vx = x + 0.5 - cx;
      const vy = y + 0.5 - cy;
      const dist = Math.hypot(vx, vy);
      if (dist < inner || dist > outer) continue;
      let da = Math.atan2(vy, vx) - angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      if (Math.abs(da) > spread) continue;
      const idx = world.idx(x, y);
      if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.DOOR) continue;
      const stripe = ((x * 73856093) ^ (y * 19349663)) & 7;
      if (stripe <= 2) {
        world.cells[idx] = Cell.WALL;
        world.roomMap[idx] = -1;
        world.wallTex[idx] = BLIND_WALL;
        world.features[idx] = Feature.NONE;
      }
      world.fog[idx] = Math.max(world.fog[idx], 52 + stripe * 10);
    }
  }
}

function styleRoom(world: World, room: Room, wallTex: Tex, floorTex: Tex): Room {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let y = room.y - 1; y <= room.y + room.h; y++) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      const idx = world.idx(x, y);
      if (world.roomMap[idx] === room.id) {
        world.floorTex[idx] = floorTex;
      } else if (world.cells[idx] === Cell.WALL) {
        world.wallTex[idx] = wallTex;
      }
    }
  }
  return room;
}

function stampNamedRoom(
  world: World,
  nextRoomId: { v: number },
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, nextRoomId.v++, type, x, y, w, h, -1);
  room.name = name;
  return styleRoom(world, room, wallTex, floorTex);
}

function addDoorAt(
  world: World,
  room: Room | null,
  x: number,
  y: number,
  state: DoorState,
  keyId = '',
): number {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.wallTex[idx] = state === DoorState.CLOSED ? Tex.DOOR_WOOD : DOOR_METAL;
  world.features[idx] = Feature.NONE;
  world.doors.set(idx, {
    idx,
    state,
    roomA: room?.id ?? -1,
    roomB: -1,
    keyId,
    timer: 0,
  });
  if (room && !room.doors.includes(idx)) room.doors.push(idx);
  return idx;
}

function addShutterDoorAt(
  world: World,
  x: number,
  y: number,
  axis: 'horizontal' | 'vertical',
  state: DoorState,
  keyId: string,
): number {
  const flankA = axis === 'vertical' ? world.idx(x - 1, y) : world.idx(x, y - 1);
  const flankB = axis === 'vertical' ? world.idx(x + 1, y) : world.idx(x, y + 1);
  for (const idx of [flankA, flankB]) {
    world.cells[idx] = Cell.WALL;
    world.roomMap[idx] = -1;
    world.wallTex[idx] = SERVICE_WALL;
    world.features[idx] = Feature.NONE;
  }
  return addDoorAt(world, null, x, y, state, keyId);
}

function connectRoomToPoint(
  world: World,
  room: Room,
  side: 'north' | 'south' | 'west' | 'east',
  targetX: number,
  targetY: number,
  state: DoorState = DoorState.CLOSED,
  keyId = '',
): void {
  const x = side === 'west' ? room.x - 1
    : side === 'east' ? room.x + room.w
      : room.x + Math.floor(room.w / 2);
  const y = side === 'north' ? room.y - 1
    : side === 'south' ? room.y + room.h
      : room.y + Math.floor(room.h / 2);
  addDoorAt(world, room, x, y, state, keyId);
  const outX = side === 'west' ? x - 1 : side === 'east' ? x + 1 : x;
  const outY = side === 'north' ? y - 1 : side === 'south' ? y + 1 : y;
  carveCorridor(world, world.wrap(outX), world.wrap(outY), targetX, targetY);
}

function placeLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.LIFT;
  world.wallTex[idx] = Tex.LIFT_DOOR;
  world.floorTex[idx] = SCAN_FLOOR;
  world.features[idx] = Feature.NONE;
  world.liftDir[idx] = direction;
  const buttonIdx = world.idx(x + 1, y);
  if (world.cells[buttonIdx] === Cell.FLOOR) {
    world.features[buttonIdx] = Feature.LIFT_BUTTON;
    world.liftDir[buttonIdx] = direction;
  }
}

function addContainer(
  world: World,
  nextContainerId: { v: number },
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  inventory: WorldContainer['inventory'],
  tags: string[],
  access: WorldContainer['access'] = 'public',
  ownerName?: string,
): void {
  world.addContainer({
    id: nextContainerId.v++,
    x: world.wrap(x),
    y: world.wrap(y),
    floor: RADON_EXCHANGE_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)] ?? 0,
    kind,
    name,
    inventory,
    capacitySlots: Math.max(6, inventory.length + 3),
    access,
    ownerName,
    lockDifficulty: access === 'locked' ? 3 : undefined,
    discovered: access !== 'secret',
    tags: [RADON_EXCHANGE_ROUTE_ID, ...tags],
  });
}

function decorateControlRoom(world: World, room: Room, serial: number): void {
  for (let x = room.x + 3; x < room.x + room.w - 3; x += 7) {
    const top = world.idx(x, room.y + 2);
    const bottom = world.idx(x, room.y + room.h - 3);
    if (world.roomMap[top] === room.id) world.features[top] = Feature.SCREEN;
    if (world.roomMap[bottom] === room.id) world.features[bottom] = Feature.DESK;
  }
  for (let y = room.y + 4; y < room.y + room.h - 3; y += 5) {
    const idx = world.idx(room.x + 2 + ((serial + y) % Math.max(1, room.w - 4)), y);
    if (world.roomMap[idx] === room.id) world.features[idx] = Feature.SHELF;
  }
}

function placeCover(world: World): void {
  let n = 0;
  for (const p of CONTROL_POINTS) {
    for (const [dx, dy] of [[4, 2], [-4, -2], [2, -4], [-2, 4]] as const) {
      const idx = world.idx(p.x + dx, p.y + dy);
      if (world.cells[idx] !== Cell.FLOOR) continue;
      world.features[idx] = n % 3 === 0 ? Feature.MACHINE : n % 3 === 1 ? Feature.DESK : Feature.SHELF;
      n++;
    }
  }
}

function registerRadonRouteCues(world: World, rooms: RadonRooms, keyContainer: WorldContainer): void {
  registerRouteCue(world, {
    id: 'radon_exchange_exposed_scanline',
    x: rooms.exchangeHall.x + 8.5,
    y: rooms.exchangeHall.y + 18.5,
    targetX: rooms.shutterEast.x + 12.5,
    targetY: rooms.shutterEast.y + 7.5,
    floor: RADON_EXCHANGE_BASE_FLOOR,
    roomId: rooms.exchangeHall.id,
    targetRoomId: rooms.shutterEast.id,
    zoneId: world.zoneMap[world.idx(rooms.exchangeHall.x + 8, rooms.exchangeHall.y + 18)],
    label: 'длинная скан-линия',
    hint: 'открытый коридор простреливается до восточной кассеты',
    targetName: rooms.shutterEast.name,
    color: '#bdf',
    tags: [RADON_EXCHANGE_ROUTE_ID, 'scanline', 'long_sight', 'exposed_route'],
    toneSeed: 7401,
    radius: 10,
    targetRadius: 3,
    cooldownSec: 32,
    heardText: 'Радоновая линия гудит ровно: восточная кассета видна слишком далеко.',
    followedText: 'Вы вышли на длинную скан-линию. Здесь быстро, но укрытия считают шаги.',
    ignoredText: 'Длинная линия осталась за бетоном. Обход дольше, зато не смотрит через весь этаж.',
    routeGroup: {
      id: 'radon_scanline_choice',
      lead: 'гул радоновой линии',
      risk: 'дальний прострел и открытая видимость',
      decision: 'пересечь линию быстро или искать сервисную хорду',
      reward: 'короткий проход к восточной кассете',
      mapLabel: 'скан-линия',
      mapHint: 'быстро, открыто, мало укрытий',
    },
  });

  registerRouteCue(world, {
    id: 'radon_exchange_service_chord',
    x: rooms.downLift.x + 8.5,
    y: rooms.downLift.y + 8.5,
    targetX: rooms.serviceChord.x + 14.5,
    targetY: rooms.serviceChord.y + 7.5,
    floor: RADON_EXCHANGE_BASE_FLOOR,
    roomId: rooms.downLift.id,
    targetRoomId: rooms.serviceChord.id,
    zoneId: world.zoneMap[world.idx(rooms.downLift.x + 8, rooms.downLift.y + 8)],
    label: 'сервисная хорда',
    hint: 'бетонная диагональ режет скан-линии без дальнего обзора',
    targetName: rooms.serviceChord.name,
    color: '#8cf',
    tags: [RADON_EXCHANGE_ROUTE_ID, 'service_chord', 'covered_route', 'route_choice'],
    toneSeed: 7402,
    radius: 9,
    targetRadius: 3,
    cooldownSec: 34,
    heardText: 'Под плитами стучит сервисная хорда: длиннее, зато заслонки не смотрят прямо.',
    followedText: 'Сервисная хорда найдена. Бетон держит обзор коротким и выводит к верхней кабине.',
    ignoredText: 'Сервисная хорда ушла в сторону. Открытые линии снова стали короче по времени.',
    routeGroup: {
      id: 'radon_service_chord',
      lead: 'низкий стук под плитой',
      risk: 'дольше и теснее',
      decision: 'идти сервисным обходом или резать через скан-линию',
      reward: 'укрытый путь между лифтами',
      mapLabel: 'сервисная хорда',
      mapHint: 'укрытый обход',
    },
  });

  registerRouteCue(world, {
    id: 'radon_exchange_projection_key',
    x: rooms.projectionKey.x + 6.5,
    y: rooms.projectionKey.y + 5.5,
    targetX: keyContainer.x + 0.5,
    targetY: keyContainer.y + 0.5,
    floor: RADON_EXCHANGE_BASE_FLOOR,
    roomId: rooms.projectionKey.id,
    targetRoomId: rooms.projectionKey.id,
    zoneId: world.zoneMap[world.idx(rooms.projectionKey.x + 6, rooms.projectionKey.y + 5)],
    label: 'проекционный ключ',
    hint: 'чужой лоток открывает часть радоновых заслонок',
    targetName: keyContainer.name,
    color: '#ffd86b',
    tags: [RADON_EXCHANGE_ROUTE_ID, 'projection_key', 'theft', 'shutter'],
    toneSeed: 7403,
    radius: 8,
    targetRadius: 2.5,
    cooldownSec: 40,
    heardText: 'В комнате проекции щелкает ключ: заслонки слушают его лучше приказа.',
    followedText: 'Лоток проекционного ключа рядом. Взять можно как кражу или оставить длинной линии её право.',
    ignoredText: 'Ключ остался в лотке. Закрытые створки всё ещё требуют чужую руку.',
    routeGroup: {
      id: 'radon_projection_key',
      lead: 'щелчок чужого ключа',
      risk: 'кража у операторов обменника',
      decision: 'украсть ключ или идти без коротких заслонок',
      reward: 'часть закрытых створок признает проход',
      mapLabel: 'ключ заслонок',
      mapHint: 'кража открывает короткий ход',
    },
  });
}

function stampRadonRooms(world: World): RadonRooms {
  const nextRoomId = { v: 0 };
  const exchangeHall = stampNamedRoom(world, nextRoomId, RoomType.COMMON, 488, 494, 48, 36, RADON_EXCHANGE_ROOM_NAMES.exchangeHall, ADMIN_WALL, CONTROL_FLOOR);
  const zeroRadius = stampNamedRoom(world, nextRoomId, RoomType.HQ, 490, 456, 44, 24, RADON_EXCHANGE_ROOM_NAMES.zeroRadius, ADMIN_WALL, SCAN_FLOOR);
  const shutterNorth = stampNamedRoom(world, nextRoomId, RoomType.PRODUCTION, 492, 250, 40, 18, RADON_EXCHANGE_ROOM_NAMES.shutterNorth, SERVICE_WALL, SERVICE_FLOOR);
  const shutterEast = stampNamedRoom(world, nextRoomId, RoomType.PRODUCTION, 714, 496, 42, 18, RADON_EXCHANGE_ROOM_NAMES.shutterEast, SERVICE_WALL, SERVICE_FLOOR);
  const serviceChord = stampNamedRoom(world, nextRoomId, RoomType.CORRIDOR, 330, 654, 48, 16, RADON_EXCHANGE_ROOM_NAMES.serviceChord, SERVICE_WALL, SERVICE_FLOOR);
  const projectionKey = stampNamedRoom(world, nextRoomId, RoomType.OFFICE, 620, 356, 34, 20, RADON_EXCHANGE_ROOM_NAMES.projectionKey, ADMIN_WALL, CONTROL_FLOOR);
  const blindWedge = stampNamedRoom(world, nextRoomId, RoomType.STORAGE, 704, 692, 32, 22, RADON_EXCHANGE_ROOM_NAMES.blindWedge, BLIND_WALL, Tex.F_CONCRETE);
  const upLift = stampNamedRoom(world, nextRoomId, RoomType.CORRIDOR, 820, 178, 30, 24, RADON_EXCHANGE_ROOM_NAMES.upLift, SERVICE_WALL, SCAN_FLOOR);
  const downLift = stampNamedRoom(world, nextRoomId, RoomType.CORRIDOR, 174, 822, 30, 24, RADON_EXCHANGE_ROOM_NAMES.downLift, SERVICE_WALL, SCAN_FLOOR);

  connectRoomToPoint(world, exchangeHall, 'north', 512, 474);
  connectRoomToPoint(world, exchangeHall, 'south', 512, 550);
  connectRoomToPoint(world, exchangeHall, 'west', 472, 512);
  connectRoomToPoint(world, exchangeHall, 'east', 552, 512);
  connectRoomToPoint(world, zeroRadius, 'south', 512, 490, DoorState.HERMETIC_OPEN);
  connectRoomToPoint(world, shutterNorth, 'south', 512, 288, DoorState.CLOSED);
  connectRoomToPoint(world, shutterEast, 'west', 676, 512, DoorState.CLOSED);
  connectRoomToPoint(world, serviceChord, 'north', 408, 608, DoorState.CLOSED);
  connectRoomToPoint(world, projectionKey, 'south', 624, 400, DoorState.LOCKED, RADON_EXCHANGE_PROJECTION_KEY);
  connectRoomToPoint(world, blindWedge, 'west', 672, 608, DoorState.HERMETIC_CLOSED, RADON_EXCHANGE_PROJECTION_KEY);
  connectRoomToPoint(world, upLift, 'south', 780, 236);
  connectRoomToPoint(world, downLift, 'north', 236, 780);

  const rooms = { exchangeHall, zeroRadius, shutterNorth, shutterEast, serviceChord, projectionKey, blindWedge, upLift, downLift };
  let serial = 0;
  for (const room of Object.values(rooms)) decorateControlRoom(world, room, serial++);
  return rooms;
}

function buildRadonExchangeGeometry(world: World): void {
  world.wallTex.fill(ADMIN_WALL);
  world.floorTex.fill(SCAN_FLOOR);
  for (const line of RADON_LINES) carveRadonLine(world, line);
  carveSegment(world, { x: 0, y: CY }, { x: EDGE, y: CY }, 2.4, SCAN_FLOOR);
  carveSegment(world, { x: CX, y: 0 }, { x: CX, y: EDGE }, 2.4, SCAN_FLOOR);
  carveSegment(world, { x: 160, y: 874 }, { x: 864, y: 170 }, 3.5, SERVICE_FLOOR);
  carveSegment(world, { x: 172, y: 828 }, { x: 342, y: 664 }, 3.2, SERVICE_FLOOR);
  carveSegment(world, { x: 376, y: 652 }, { x: 836, y: 192 }, 3.2, SERVICE_FLOOR);

  for (const p of CONTROL_POINTS) carveDisc(world, p.x, p.y, 5.5, CONTROL_FLOOR);

  stampBlindWedge(world, 512, 512, -0.18, 0.28, 128, 354);
  stampBlindWedge(world, 512, 512, 2.33, 0.24, 150, 398);
  stampBlindWedge(world, 512, 512, 1.33, 0.18, 190, 430);
  stampBlindWedge(world, 512, 512, -2.06, 0.2, 190, 430);

  placeCover(world);
}

export function generateRadonExchangeDesignFloor(): FloorGeneration {
  const world = new World();
  buildRadonExchangeGeometry(world);
  const rooms = stampRadonRooms(world);

  for (const shutter of SHUTTER_DOORS) addShutterDoorAt(world, shutter.x, shutter.y, shutter.axis, shutter.state, shutter.keyId);
  placeLift(world, 836, 188, LiftDirection.UP);
  placeLift(world, 188, 836, LiftDirection.DOWN);

  generateZones(world);
  const nextContainerId = { v: 1 };
  addContainer(world, nextContainerId, rooms.projectionKey, rooms.projectionKey.x + 18, rooms.projectionKey.y + 10, ContainerKind.CASHBOX, 'Лоток проекционного ключа', [
    { defId: RADON_EXCHANGE_PROJECTION_KEY, count: 1 },
    { defId: 'container_key_label', count: 1 },
    { defId: 'filter_receipt', count: 1 },
  ], ['projection_key', 'shutter', 'theft', 'documents'], 'owner', 'оператор радоновой проекции');
  addContainer(world, nextContainerId, rooms.blindWedge, rooms.blindWedge.x + 15, rooms.blindWedge.y + 11, ContainerKind.SECRET_STASH, 'Слепой ящик дозиметристов', [
    { defId: 'gasmask_filter', count: 1 },
    { defId: 'overexposed_photo', count: 1 },
    { defId: 'lift_scheme', count: 1 },
  ], ['blind_wedge', 'reward', 'radon'], 'secret');

  registerRadonRouteCues(world, rooms, world.containers[0]);
  ensureConnectivity(world, CX + 0.5, CY + 0.5);
  sanitizeDoors(world);
  world.rebuildContainerMap();
  world.bakeLights();
  world.markFogDirty();

  return {
    world,
    entities: [],
    spawnX: CX + 0.5,
    spawnY: CY + 0.5,
  };
}

function liftReachableWithoutGate(world: World, spawnX: number, spawnY: number, direction: LiftDirection): boolean {
  const audit = auditReachability(world, world.idx(Math.floor(spawnX), Math.floor(spawnY)));
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const ni = world.idx(x + dx, y + dy);
      if (audit.reachable[ni] && audit.gateMask[ni] === REACH_GATE_NONE) return true;
    }
  }
  return false;
}

function longestRunOnRows(world: World, rows: readonly number[], tex: Tex): number {
  let best = 0;
  for (const y of rows) {
    let run = 0;
    for (let x = 0; x < W; x++) {
      const idx = world.idx(x, y);
      const passable = (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.DOOR || world.cells[idx] === Cell.LIFT)
        && world.floorTex[idx] === tex;
      if (passable) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
  }
  return best;
}

function longestRunOnCols(world: World, cols: readonly number[], tex: Tex): number {
  let best = 0;
  for (const x of cols) {
    let run = 0;
    for (let y = 0; y < W; y++) {
      const idx = world.idx(x, y);
      const passable = (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.DOOR || world.cells[idx] === Cell.LIFT)
        && world.floorTex[idx] === tex;
      if (passable) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
  }
  return best;
}

export function measureRadonExchangeMetrics(gen: FloorGeneration): RadonExchangeMetrics {
  let scanLineCells = 0;
  let serviceChordCells = 0;
  let blindWedgeCells = 0;
  let coverCells = 0;
  for (let i = 0; i < W * W; i++) {
    const cell = gen.world.cells[i];
    if (cell === Cell.FLOOR || cell === Cell.DOOR || cell === Cell.LIFT) {
      if (gen.world.floorTex[i] === SCAN_FLOOR) scanLineCells++;
      if (gen.world.floorTex[i] === SERVICE_FLOOR) serviceChordCells++;
    }
    if (gen.world.fog[i] >= 52) blindWedgeCells++;
    const feature = gen.world.features[i] as Feature;
    if (feature === Feature.DESK || feature === Feature.SHELF || feature === Feature.MACHINE) coverCells++;
  }
  const shutterDoors = [...gen.world.doors.values()].filter(door =>
    door.state === DoorState.HERMETIC_CLOSED ||
    door.state === DoorState.HERMETIC_OPEN ||
    door.keyId === RADON_EXCHANGE_PROJECTION_KEY).length;
  const projectionKeyContainers = gen.world.containers.filter(container => container.tags.includes('projection_key')).length;
  const controlRooms = gen.world.rooms.filter(room =>
    room.name.includes('заслон') ||
    room.name.includes('радиус') ||
    room.name.includes('проекцион') ||
    room.name.includes('обмен')).length;
  const horizontalRun = longestRunOnRows(gen.world, [CY - 288, CY - 96, CY, CY + 96, CY + 288], SCAN_FLOOR);
  const verticalRun = longestRunOnCols(gen.world, [CX - 320, CX - 160, CX, CX + 160, CX + 320], SCAN_FLOOR);
  return {
    routeId: RADON_EXCHANGE_ROUTE_ID,
    z: RADON_EXCHANGE_Z,
    scanLineCells,
    serviceChordCells,
    blindWedgeCells,
    shutterDoors,
    projectionKeyContainers,
    controlRooms,
    coverCells,
    longestScanRun: Math.max(horizontalRun, verticalRun),
    ungatedUpLiftReachable: liftReachableWithoutGate(gen.world, gen.spawnX, gen.spawnY, LiftDirection.UP),
    ungatedDownLiftReachable: liftReachableWithoutGate(gen.world, gen.spawnX, gen.spawnY, LiftDirection.DOWN),
  };
}

/* -- Design floor: cantor_pustoty / Кантор пустоты ---------------- */

import {
  AIGoal,
  Cell,
  ContainerKind,
  DoorState,
  EntityType,
  Feature,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type Item,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World, auditReachability } from '../../core/world';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { registerRouteCue } from '../../systems/route_cues';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const CANTOR_PUSTOTY_ROUTE_ID = 'cantor_pustoty' as const;
export const CANTOR_PUSTOTY_Z = -44 as const;
export const CANTOR_PUSTOTY_BASE_FLOOR = FloorLevel.VOID;

export const CANTOR_PUSTOTY_ROOM_NAMES = {
  entry: 'Кантор пустоты: входной остров досок',
  repair: 'Кантор пустоты: ремонтная полка мостов',
  dust: 'Кантор пустоты: пыльный остров тайника',
  hidden: 'Кантор пустоты: остров без обратного шага',
  upLift: 'Кантор пустоты: верхняя пустотная кабина',
  downLift: 'Кантор пустоты: нижняя пустотная кабина',
} as const;

export interface CantorPustotyMetrics {
  routeId: typeof CANTOR_PUSTOTY_ROUTE_ID;
  z: typeof CANTOR_PUSTOTY_Z;
  recursionDepth: number;
  proxyOpenCells: number;
  componentCountBeforeBridge: number;
  largestComponentBeforeBridge: number;
  bridgedComponents: number;
  bridgeProxyCells: number;
  stashIslandCount: number;
  reachableStashContainers: number;
  abyssCells: number;
  ungatedUpLiftReachable: boolean;
  ungatedDownLiftReachable: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface ProxyComponentGraph {
  label: Int16Array;
  sizes: number[];
  samples: number[][];
  largestId: number;
}

interface CantorBuild {
  mask: Uint8Array;
  bridgeCells: number;
  bridgedComponents: number;
  componentCountBeforeBridge: number;
  largestComponentBeforeBridge: number;
  proxyOpenCells: number;
}

interface CantorRooms {
  entry: Room;
  repair: Room;
  dust: Room;
  hidden: Room;
  upLift: Room;
  downLift: Room;
}

const PROXY_SIZE = 81;
const PROXY_TILE = 12;
const PROXY_ORIGIN = 26;
const RECURSION_DEPTH = 4;
const CENTER_PROXY = 40;

const GAP = 0;
const ISLAND = 1;
const BRIDGE = 2;
const ANCHOR = 3;
const STASH = 4;

const ENTRY_PROXY: Point = { x: CENTER_PROXY, y: CENTER_PROXY };
const UP_PROXY: Point = { x: 13, y: 13 };
const DOWN_PROXY: Point = { x: 67, y: 67 };
const REPAIR_PROXY: Point = { x: 13, y: 67 };
const DUST_PROXY: Point = { x: 67, y: 13 };
const HIDDEN_PROXY: Point = { x: 40, y: 8 };

const CANTOR_METRICS = new WeakMap<World, Omit<CantorPustotyMetrics, 'reachableStashContainers' | 'abyssCells' | 'ungatedUpLiftReachable' | 'ungatedDownLiftReachable'>>();

function proxyIdx(x: number, y: number): number {
  return y * PROXY_SIZE + x;
}

function proxyPoint(idx: number): Point {
  return { x: idx % PROXY_SIZE, y: (idx / PROXY_SIZE) | 0 };
}

function proxyCenter(point: Point): Point {
  return {
    x: PROXY_ORIGIN + point.x * PROXY_TILE + (PROXY_TILE >> 1),
    y: PROXY_ORIGIN + point.y * PROXY_TILE + (PROXY_TILE >> 1),
  };
}

function cantorOpen(x: number, y: number): boolean {
  for (let level = 0; level < RECURSION_DEPTH; level++) {
    const scale = 3 ** (RECURSION_DEPTH - level - 1);
    const tx = Math.floor(x / scale) % 3;
    const ty = Math.floor(y / scale) % 3;
    if (level === 0 && (tx === 1 || ty === 1)) return false;
    if (tx === 1 && ty === 1) return false;
  }
  return true;
}

function forceProxyDisk(mask: Uint8Array, point: Point, radius: number, kind: number): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = point.x + dx;
      const y = point.y + dy;
      if (x < 0 || x >= PROXY_SIZE || y < 0 || y >= PROXY_SIZE) continue;
      mask[proxyIdx(x, y)] = kind;
    }
  }
}

function buildInitialProxyMask(): Uint8Array {
  const mask = new Uint8Array(PROXY_SIZE * PROXY_SIZE);
  for (let y = 0; y < PROXY_SIZE; y++) {
    for (let x = 0; x < PROXY_SIZE; x++) {
      if (cantorOpen(x, y)) mask[proxyIdx(x, y)] = ISLAND;
    }
  }
  forceProxyDisk(mask, ENTRY_PROXY, 3, ANCHOR);
  forceProxyDisk(mask, UP_PROXY, 3, ANCHOR);
  forceProxyDisk(mask, DOWN_PROXY, 3, ANCHOR);
  forceProxyDisk(mask, REPAIR_PROXY, 3, STASH);
  forceProxyDisk(mask, DUST_PROXY, 3, STASH);
  forceProxyDisk(mask, HIDDEN_PROXY, 2, STASH);
  return mask;
}

function labelProxyComponents(mask: Uint8Array): ProxyComponentGraph {
  const label = new Int16Array(mask.length).fill(-1);
  const sizes: number[] = [];
  const samples: number[][] = [];
  const queue = new Int16Array(mask.length);
  let largestId = -1;

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === GAP || label[i] >= 0) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    let size = 0;
    const sample: number[] = [];
    label[i] = id;
    queue[tail++] = i;
    while (head < tail) {
      const current = queue[head++];
      size++;
      if (sample.length < 96 && (size === 1 || size % 5 === 0)) sample.push(current);
      const x = current % PROXY_SIZE;
      const y = (current / PROXY_SIZE) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= PROXY_SIZE || ny < 0 || ny >= PROXY_SIZE) continue;
        const ni = proxyIdx(nx, ny);
        if (mask[ni] === GAP || label[ni] >= 0) continue;
        label[ni] = id;
        queue[tail++] = ni;
      }
    }
    sizes.push(size);
    samples.push(sample);
    if (largestId < 0 || size > sizes[largestId]) largestId = id;
  }

  return { label, sizes, samples, largestId };
}

function nearestSamplePair(a: readonly number[], b: readonly number[]): [number, number] {
  let bestA = a[0] ?? 0;
  let bestB = b[0] ?? 0;
  let bestD = Infinity;
  for (const ai of a) {
    const ap = proxyPoint(ai);
    for (const bi of b) {
      const bp = proxyPoint(bi);
      const dx = ap.x - bp.x;
      const dy = ap.y - bp.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        bestA = ai;
        bestB = bi;
      }
    }
  }
  return [bestA, bestB];
}

function carveProxyBridge(mask: Uint8Array, from: number, to: number): number {
  const a = proxyPoint(from);
  const b = proxyPoint(to);
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  let changed = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(a.x + (b.x - a.x) * t);
    const y = Math.round(a.y + (b.y - a.y) * t);
    for (const [dx, dy] of [[0,0], [1,0], [-1,0], [0,1], [0,-1]] as const) {
      const bx = x + dx;
      const by = y + dy;
      if (bx < 0 || bx >= PROXY_SIZE || by < 0 || by >= PROXY_SIZE) continue;
      const idx = proxyIdx(bx, by);
      if (mask[idx] === GAP) changed++;
      if (mask[idx] !== STASH && mask[idx] !== ANCHOR) mask[idx] = BRIDGE;
    }
  }
  return changed;
}

function bridgeImportantComponents(mask: Uint8Array, important: readonly Point[]): { bridgeCells: number; bridgedComponents: number } {
  let bridgeCells = 0;
  let bridgedComponents = 0;
  for (const point of important) {
    const graph = labelProxyComponents(mask);
    if (graph.largestId < 0) break;
    const idx = proxyIdx(point.x, point.y);
    const componentId = graph.label[idx];
    if (componentId < 0 || componentId === graph.largestId) continue;
    const pair = nearestSamplePair(graph.samples[componentId], graph.samples[graph.largestId]);
    bridgeCells += carveProxyBridge(mask, pair[0], pair[1]);
    bridgedComponents++;
  }
  return { bridgeCells, bridgedComponents };
}

function buildCantorProxy(): CantorBuild {
  const mask = buildInitialProxyMask();
  const before = labelProxyComponents(mask);
  const important = [ENTRY_PROXY, UP_PROXY, DOWN_PROXY, REPAIR_PROXY, DUST_PROXY, HIDDEN_PROXY];
  const bridge = bridgeImportantComponents(mask, important);

  forceProxyDisk(mask, ENTRY_PROXY, 3, ANCHOR);
  forceProxyDisk(mask, UP_PROXY, 3, ANCHOR);
  forceProxyDisk(mask, DOWN_PROXY, 3, ANCHOR);
  forceProxyDisk(mask, REPAIR_PROXY, 3, STASH);
  forceProxyDisk(mask, DUST_PROXY, 3, STASH);
  forceProxyDisk(mask, HIDDEN_PROXY, 2, STASH);

  let proxyOpenCells = 0;
  for (const cell of mask) if (cell !== GAP) proxyOpenCells++;

  return {
    mask,
    bridgeCells: bridge.bridgeCells,
    bridgedComponents: bridge.bridgedComponents,
    componentCountBeforeBridge: before.sizes.length,
    largestComponentBeforeBridge: before.largestId >= 0 ? before.sizes[before.largestId] : 0,
    proxyOpenCells,
  };
}

function paintVoidBase(world: World): void {
  world.cells.fill(Cell.ABYSS);
  world.wallTex.fill(Tex.VOID_WALL);
  world.floorTex.fill(Tex.F_ABYSS);
  world.fog.fill(118);
}

function carveWorldCell(world: World, x: number, y: number, kind: number): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.hermoWall[ci] = 0;
  world.wallTex[ci] = Tex.VOID_WALL;
  world.floorTex[ci] = kind === BRIDGE ? Tex.F_CONCRETE : kind === ANCHOR ? Tex.F_TILE : Tex.F_VOID;
  world.fog[ci] = kind === BRIDGE ? 48 : kind === STASH ? 74 : 88;
}

function carveProxyMaskToWorld(world: World, mask: Uint8Array): void {
  for (let gy = 0; gy < PROXY_SIZE; gy++) {
    for (let gx = 0; gx < PROXY_SIZE; gx++) {
      const kind = mask[proxyIdx(gx, gy)];
      if (kind === GAP) continue;
      const x0 = PROXY_ORIGIN + gx * PROXY_TILE;
      const y0 = PROXY_ORIGIN + gy * PROXY_TILE;
      for (let dy = 0; dy < PROXY_TILE; dy++) {
        for (let dx = 0; dx < PROXY_TILE; dx++) carveWorldCell(world, x0 + dx, y0 + dy, kind);
      }
      if ((gx + gy) % 17 === 0) {
        const ci = world.idx(x0 + (PROXY_TILE >> 1), y0 + (PROXY_TILE >> 1));
        world.features[ci] = kind === BRIDGE ? Feature.TABLE : kind === STASH ? Feature.SHELF : Feature.NONE;
      }
    }
  }
}

function applyRoomLook(world: World, room: Room, wallTex: Tex, floorTex: Tex, fog: number): void {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let y = room.y - 1; y <= room.y + room.h; y++) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      const ci = world.idx(x, y);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
      if (world.roomMap[ci] === room.id) {
        world.floorTex[ci] = floorTex;
        world.fog[ci] = fog;
      }
    }
  }
}

function addRoomAtProxy(world: World, point: Point, type: RoomType, w: number, h: number, name: string, floorTex: Tex, fog: number): Room {
  const center = proxyCenter(point);
  const room = stampRoom(world, world.rooms.length, type, center.x - (w >> 1), center.y - (h >> 1), w, h, -1);
  room.name = name;
  applyRoomLook(world, room, Tex.VOID_WALL, floorTex, fog);
  return room;
}

function addDoor(world: World, room: Room, side: 'north' | 'south' | 'west' | 'east'): void {
  const wx = side === 'west' ? room.x - 1 : side === 'east' ? room.x + room.w : room.x + (room.w >> 1);
  const wy = side === 'north' ? room.y - 1 : side === 'south' ? room.y + room.h : room.y + (room.h >> 1);
  const outsideX = side === 'west' ? wx - 1 : side === 'east' ? wx + 1 : wx;
  const outsideY = side === 'north' ? wy - 1 : side === 'south' ? wy + 1 : wy;
  const idx = world.idx(wx, wy);
  world.cells[idx] = Cell.DOOR;
  world.wallTex[idx] = Tex.DOOR_METAL;
  world.doors.set(idx, { idx, state: DoorState.CLOSED, roomA: room.id, roomB: -1, keyId: '', timer: 0 });
  room.doors.push(idx);
  carveWorldCell(world, outsideX, outsideY, BRIDGE);
}

function placeLift(world: World, room: Room, direction: LiftDirection, dx: number): void {
  const x = room.x + Math.max(2, Math.min(room.w - 3, dx));
  const y = room.y + (room.h >> 1);
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.liftDir[ci] = direction;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.floorTex[ci] = Tex.F_CONCRETE;
  const button = world.idx(x + 1, y);
  if (world.cells[button] === Cell.FLOOR) world.features[button] = Feature.LIFT_BUTTON;
}

function stampRooms(world: World): CantorRooms {
  const entry = addRoomAtProxy(world, ENTRY_PROXY, RoomType.COMMON, 28, 18, CANTOR_PUSTOTY_ROOM_NAMES.entry, Tex.F_CONCRETE, 36);
  const repair = addRoomAtProxy(world, REPAIR_PROXY, RoomType.PRODUCTION, 26, 18, CANTOR_PUSTOTY_ROOM_NAMES.repair, Tex.F_CONCRETE, 44);
  const dust = addRoomAtProxy(world, DUST_PROXY, RoomType.STORAGE, 24, 16, CANTOR_PUSTOTY_ROOM_NAMES.dust, Tex.F_VOID, 70);
  const hidden = addRoomAtProxy(world, HIDDEN_PROXY, RoomType.STORAGE, 22, 14, CANTOR_PUSTOTY_ROOM_NAMES.hidden, Tex.F_VOID, 82);
  const upLift = addRoomAtProxy(world, UP_PROXY, RoomType.CORRIDOR, 24, 16, CANTOR_PUSTOTY_ROOM_NAMES.upLift, Tex.F_CONCRETE, 38);
  const downLift = addRoomAtProxy(world, DOWN_PROXY, RoomType.CORRIDOR, 24, 16, CANTOR_PUSTOTY_ROOM_NAMES.downLift, Tex.F_CONCRETE, 46);

  addDoor(world, entry, 'north');
  addDoor(world, repair, 'east');
  addDoor(world, dust, 'west');
  addDoor(world, hidden, 'south');
  addDoor(world, upLift, 'east');
  addDoor(world, downLift, 'west');
  placeLift(world, upLift, LiftDirection.UP, 7);
  placeLift(world, downLift, LiftDirection.DOWN, downLift.w - 8);

  decorateRooms(world, [entry, repair, dust, hidden, upLift, downLift]);
  return { entry, repair, dust, hidden, upLift, downLift };
}

function decorateRooms(world: World, rooms: readonly Room[]): void {
  for (const room of rooms) {
    const cx = room.x + (room.w >> 1);
    const cy = room.y + (room.h >> 1);
    world.features[world.idx(cx, cy)] = room.type === RoomType.PRODUCTION ? Feature.MACHINE : room.type === RoomType.STORAGE ? Feature.SHELF : Feature.CANDLE;
    if (room.type === RoomType.COMMON) {
      world.features[world.idx(room.x + 4, room.y + 4)] = Feature.TABLE;
      world.features[world.idx(room.x + room.w - 5, room.y + room.h - 5)] = Feature.CANDLE;
    }
    if (room.type === RoomType.PRODUCTION) {
      world.features[world.idx(room.x + 5, room.y + 5)] = Feature.APPARATUS;
      world.features[world.idx(room.x + room.w - 6, room.y + 5)] = Feature.SHELF;
    }
  }
}

function nextContainerId(world: World): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id) || world.containers.some(container => container.id === id)) id++;
  return id;
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
): void {
  const ci = world.idx(x, y);
  world.addContainer({
    id: nextContainerId(world),
    x: world.wrap(x),
    y: world.wrap(y),
    floor: FloorLevel.VOID,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory,
    capacitySlots: 7,
    access,
    lockDifficulty: access === 'locked' ? 6 : undefined,
    discovered: access !== 'secret',
    tags,
  });
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = kind === ContainerKind.TOOL_LOCKER ? Feature.SHELF : Feature.DESK;
}

function placeContainers(world: World, rooms: CantorRooms): void {
  addContainer(world, rooms.entry, rooms.entry.x + 5, rooms.entry.y + 5, ContainerKind.EMERGENCY_BOX, 'Ящик досок входного острова', 'public', [
    { defId: 'duct_tape', count: 2 },
    { defId: 'chalk', count: 1 },
    { defId: 'water', count: 1 },
  ], ['cantor_pustoty', 'entry', 'bridge_supply']);

  addContainer(world, rooms.repair, rooms.repair.x + rooms.repair.w - 6, rooms.repair.y + 6, ContainerKind.TOOL_LOCKER, 'Шкаф ремонта канторова моста', 'public', [
    { defId: 'metal_sheet', count: 2 },
    { defId: 'sealant_tube', count: 1 },
    { defId: 'wrench', count: 1 },
  ], ['cantor_pustoty', 'repair', 'gap_bridge', 'tools']);

  addContainer(world, rooms.dust, rooms.dust.x + 7, rooms.dust.y + 6, ContainerKind.SECRET_STASH, 'Пыльный островной тайник', 'secret', [
    { defId: 'psi_dust', count: 2 },
    { defId: 'breach_charge', count: 1 },
    { defId: 'gasmask_filter', count: 1 },
  ], ['cantor_pustoty', 'dust_island', 'stash_island', 'risk_bridge']);

  addContainer(world, rooms.hidden, rooms.hidden.x + rooms.hidden.w - 7, rooms.hidden.y + 5, ContainerKind.SECRET_STASH, 'Тайник острова без обратного шага', 'secret', [
    { defId: 'psi_stabilizer', count: 1 },
    { defId: 'chalk', count: 1 },
    { defId: 'metal_sheet', count: 1 },
  ], ['cantor_pustoty', 'stash_island', 'one_way_dust']);
}

function cantorMonsterPhases(kind: MonsterKind): boolean {
  return kind === MonsterKind.SHADOW ||
    kind === MonsterKind.TONKAYA_TEN ||
    kind === MonsterKind.GLUBINNAYA_TEN ||
    kind === MonsterKind.LISHENNYY ||
    kind === MonsterKind.SPIRIT;
}

function spawnMonster(entities: Entity[], nextId: { v: number }, kind: MonsterKind, x: number, y: number, level: number, name: string): void {
  const def = MONSTERS[kind];
  const hp = Math.round(scaleMonsterHp(def.hp, level));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: ((x * 31 + y * 17) % 360) * Math.PI / 180,
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
    phasing: cantorMonsterPhases(kind),
  });
}

function dropItem(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count = 1): void {
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

function placeEntities(world: World, entities: Entity[], nextId: { v: number }, rooms: CantorRooms): void {
  spawnMonster(entities, nextId, MonsterKind.TONKAYA_TEN, rooms.dust.x + 5, rooms.dust.y + 5, 10, 'Тонкая тень пыльного острова');
  spawnMonster(entities, nextId, MonsterKind.LISHENNYY, rooms.hidden.x + 4, rooms.hidden.y + 5, 11, 'Лишенный обратного шага');
  spawnMonster(entities, nextId, MonsterKind.SHADOW, rooms.repair.x + rooms.repair.w - 7, rooms.repair.y + rooms.repair.h - 6, 9, 'Тень ремонтной полки');
  spawnMonster(entities, nextId, MonsterKind.GLUBINNAYA_TEN, rooms.downLift.x + 5, rooms.downLift.y + 7, 11, 'Глубинная тень нижней кабины');
  dropItem(entities, nextId, rooms.entry.x + rooms.entry.w - 6, rooms.entry.y + 4, 'chalk', 1);
  void world;
}

function registerCantorRouteCues(world: World, rooms: CantorRooms): void {
  registerRouteCue(world, {
    id: 'cantor_pustoty_gap_bridge',
    x: rooms.entry.x + rooms.entry.w - 3,
    y: rooms.entry.y + 4,
    targetX: rooms.repair.x + 6,
    targetY: rooms.repair.y + 7,
    floor: FloorLevel.VOID,
    label: 'Канторов мост',
    hint: 'рискнуть узкой бетонной связкой или идти длинной компонентой',
    targetName: CANTOR_PUSTOTY_ROOM_NAMES.repair,
    color: '#9cf',
    tags: ['cantor_pustoty', 'gap_bridge', 'repair', 'tools'],
    toneSeed: 0x8701,
    roomId: rooms.entry.id,
    targetRoomId: rooms.repair.id,
    heardText: 'За разрывом скрипит ремонтная полка: мост держится на листовом металле.',
    followedText: 'Канторов мост найден. Дальше можно чинить путь, а не только помнить его.',
    ignoredText: 'Узкая связка остается сбоку; длинная компонента гасит шаги медленнее.',
  });

  registerRouteCue(world, {
    id: 'cantor_pustoty_dust_island',
    x: rooms.repair.x + rooms.repair.w - 4,
    y: rooms.repair.y + 6,
    targetX: rooms.dust.x + 7,
    targetY: rooms.dust.y + 6,
    floor: FloorLevel.VOID,
    label: 'Пыльный остров',
    hint: 'тайник за рекурсивной прорезью, путь назад уже',
    targetName: CANTOR_PUSTOTY_ROOM_NAMES.dust,
    color: '#c8f',
    tags: ['cantor_pustoty', 'stash_island', 'dust_island', 'risk_bridge'],
    toneSeed: 0x8702,
    roomId: rooms.repair.id,
    targetRoomId: rooms.dust.id,
    heardText: 'Пыльный остров отвечает глухо: лут есть, ширины почти нет.',
    followedText: 'Пыльный остров найден. Тайник лежит на безопасной клетке, а не на безопасной совести.',
    ignoredText: 'Пыльный остров остается за прорезью. Пустота не закрывает его, только считает шаги.',
  });
}

function tuneCantorZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
    zone.faction = ZoneFaction.SAMOSBOR;
    zone.level = Math.max(5, Math.min(8, 5 + Math.round(d / 250)));
    zone.fogged = true;
  }
  for (let i = 0; i < W * W; i++) world.factionControl[i] = ZoneFaction.SAMOSBOR;
}

function reachableLifts(world: World, spawnX: number, spawnY: number): { up: boolean; down: boolean } {
  const audit = auditReachability(world, world.idx(Math.floor(spawnX), Math.floor(spawnY)));
  let up = false;
  let down = false;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.LIFT) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      if (!audit.reachable[world.idx(x + dx, y + dy)]) continue;
      if (world.liftDir[i] === LiftDirection.UP) up = true;
      if (world.liftDir[i] === LiftDirection.DOWN) down = true;
    }
  }
  return { up, down };
}

function countAbyssCells(world: World): number {
  let count = 0;
  for (const cell of world.cells) if (cell === Cell.ABYSS) count++;
  return count;
}

function reachableStashContainers(world: World, spawnX: number, spawnY: number): number {
  const audit = auditReachability(world, world.idx(Math.floor(spawnX), Math.floor(spawnY)));
  let count = 0;
  for (const container of world.containers) {
    if (!container.tags.includes('stash_island')) continue;
    if (audit.reachable[world.idx(container.x, container.y)]) count++;
  }
  return count;
}

export function measureCantorPustotyMetrics(gen: FloorGeneration): CantorPustotyMetrics {
  const base = CANTOR_METRICS.get(gen.world) ?? {
    routeId: CANTOR_PUSTOTY_ROUTE_ID,
    z: CANTOR_PUSTOTY_Z,
    recursionDepth: RECURSION_DEPTH,
    proxyOpenCells: 0,
    componentCountBeforeBridge: 0,
    largestComponentBeforeBridge: 0,
    bridgedComponents: 0,
    bridgeProxyCells: 0,
    stashIslandCount: 0,
  };
  const lifts = reachableLifts(gen.world, gen.spawnX, gen.spawnY);
  return {
    ...base,
    reachableStashContainers: reachableStashContainers(gen.world, gen.spawnX, gen.spawnY),
    abyssCells: countAbyssCells(gen.world),
    ungatedUpLiftReachable: lifts.up,
    ungatedDownLiftReachable: lifts.down,
  };
}

export function generateCantorPustotyDesignFloor(): FloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };

  paintVoidBase(world);
  const cantor = buildCantorProxy();
  carveProxyMaskToWorld(world, cantor.mask);
  const rooms = stampRooms(world);
  const spawnX = rooms.entry.x + (rooms.entry.w >> 1) + 0.5;
  const spawnY = rooms.entry.y + (rooms.entry.h >> 1) + 0.5;

  generateZones(world);
  tuneCantorZones(world);
  placeContainers(world, rooms);
  placeEntities(world, entities, nextId, rooms);
  registerCantorRouteCues(world, rooms);
  ensureConnectivity(world, spawnX, spawnY);
  sanitizeDoors(world);
  world.rebuildContainerMap();
  world.bakeLights();

  CANTOR_METRICS.set(world, {
    routeId: CANTOR_PUSTOTY_ROUTE_ID,
    z: CANTOR_PUSTOTY_Z,
    recursionDepth: RECURSION_DEPTH,
    proxyOpenCells: cantor.proxyOpenCells,
    componentCountBeforeBridge: cantor.componentCountBeforeBridge,
    largestComponentBeforeBridge: cantor.largestComponentBeforeBridge,
    bridgedComponents: cantor.bridgedComponents,
    bridgeProxyCells: cantor.bridgeCells,
    stashIslandCount: 3,
  });

  return { world, entities, spawnX, spawnY };
}

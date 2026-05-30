/* -- Design floor: critical_leak_archive - wet percolation archive -- */

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
import { hashSeed } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const CRITICAL_LEAK_ARCHIVE_ROUTE_ID = 'critical_leak_archive' as const;
export const CRITICAL_LEAK_ARCHIVE_Z = 24;
export const CRITICAL_LEAK_ARCHIVE_BASE_FLOOR = FloorLevel.MINISTRY;

export const CRITICAL_LEAK_ARCHIVE_ROOM_NAMES = {
  lobby: 'Сухой лифтовый тамбур критической протечки',
  trade: 'Окно обмена сухих архивных пакетов',
  dryIndex: 'Сухой остров дел постоянного хранения',
  disputedStack: 'Мокрая картотека спорных причин',
  floodgate: 'Пульт архивной водоотсечки',
  shortcut: 'Зараженный водяной короткий ход',
  dryingRoom: 'Комната аварийной просушки',
  witness: 'Стол свидетелей протечки',
} as const;

export interface CriticalLeakArchiveState {
  routeId: typeof CRITICAL_LEAK_ARCHIVE_ROUTE_ID;
  anchorZ: typeof CRITICAL_LEAK_ARCHIVE_Z;
  baseFloor: typeof CRITICAL_LEAK_ARCHIVE_BASE_FLOOR;
  largestComponentCells: number;
  wetCausewayCells: number;
  dryCausewayCells: number;
  bridgesAdded: number;
  contaminatedShortcutCells: number;
  dryPacketContainerIds: number[];
  floodgateContainerId: number;
  debugEntry: {
    spawnX: number;
    spawnY: number;
    summary: string;
  };
}

export interface CriticalLeakArchiveGeneration extends FloorGeneration {
  criticalLeakState: CriticalLeakArchiveState;
}

interface Point {
  x: number;
  y: number;
}

interface PercolationField {
  inLargest: Uint8Array;
  east: Uint8Array;
  south: Uint8Array;
  largestCells: number[];
  centers: Point[];
}

type NextId = { v: number };

const GRID_W = 45;
const GRID_H = 45;
const GRID_STEP = 20;
const GRID_ORIGIN = 72;
const SITE_P = 0.64;
const BOND_P = 0.66;
const WATER_TAGS = ['critical_leak_archive', 'wet_archive', 'contaminated_shortcut'] as const;

const TARGET_ROUTE = {
  designFloorId: CRITICAL_LEAK_ARCHIVE_ROUTE_ID,
  z: CRITICAL_LEAK_ARCHIVE_Z,
  tags: ['critical_leak_archive', 'wet_archive', 'documents', 'floodgate'],
  label: 'Архив критической протечки',
  risk: 4,
} as const;

const ARCHIVIST_DEF: PlotNpcDef = {
  name: 'Варвара Сухопись',
  isFemale: true,
  faction: Faction.SCIENTIST,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 110, maxHp: 110, money: 84, speed: 0.72,
  inventory: [
    { defId: 'filter_receipt', count: 1 },
    { defId: 'blank_form', count: 2 },
    { defId: 'seal_wax', count: 1 },
  ],
  talkLines: [
    'Сухой пакет несут двумя руками. Мокрый пакет сам несет вас к проверке.',
    'Здесь важна не папка, а путь, по которому она осталась сухой.',
    'Если вода соединила шкафы, значит причина уже почти доказана.',
  ],
  talkLinesPost: [
    'Сухой пакет принят. Теперь у протечки есть причина, а у причины есть номер.',
    'Не кладите сухие бумаги рядом с зараженными. Они начинают спорить чернилами.',
  ],
};

const LIQUIDATOR_DEF: PlotNpcDef = {
  name: 'Егор Отсечка',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 210, maxHp: 210, money: 42, speed: 0.92,
  inventory: [
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 10 },
    { defId: 'decon_fluid', count: 1 },
  ],
  talkLines: [
    'Короткий ход есть. Он мокрый. Умный человек называет это ценой, а не дорогой.',
    'Шлюз поднимете - архив вздохнет. Не поднимете - вода сама найдет форму.',
    'Если пошли через воду, не прячьте перчатки. Их потом находят первыми.',
  ],
  talkLinesPost: [
    'Затвор поднят. Вода ушла ровно настолько, чтобы вернуться без предупреждения.',
    'Пакет сухой, ботинки нет. Для архива это приемлемый баланс.',
  ],
};

registerSideQuest('critical_leak_archivist_varvara', ARCHIVIST_DEF, [
  {
    id: 'critical_leak_carry_dry_packet',
    giverNpcId: 'critical_leak_archivist_varvara',
    type: QuestType.FETCH,
    desc: 'Варвара Сухопись: «Найдете сухую жалобу под сургучом - донесите, не заходя лишний раз в воду. Мокрая причина становится слухом.»',
    targetItem: 'sealed_complaint', targetCount: 1,
    targetFloor: CRITICAL_LEAK_ARCHIVE_BASE_FLOOR,
    targetRoute: TARGET_ROUTE,
    targetRoomName: CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.dryIndex,
    targetHint: 'сухой пакет лежит на архивном острове; водяной короткий ход быстрее, но заражает маршрут',
    rewardItem: 'filter_receipt', rewardCount: 1,
    extraRewards: [{ defId: 'blank_form', count: 2 }],
    relationDelta: 10, xpReward: 55, moneyReward: 38,
    eventTargetName: 'Сухой архивный пакет вынесен из критической протечки.',
    eventTags: ['critical_leak_archive', 'dry_packet', 'documents', 'trade'],
    eventData: { routeId: CRITICAL_LEAK_ARCHIVE_ROUTE_ID, outcome: 'dry_packet_saved' },
    eventSeverity: 3,
  },
]);

registerSideQuest('critical_leak_liquidator_egor', LIQUIDATOR_DEF, [
  {
    id: 'critical_leak_raise_floodgate',
    giverNpcId: 'critical_leak_liquidator_egor',
    type: QuestType.VISIT,
    desc: 'Егор Отсечка: «Дойдите до пульта водоотсечки. Шлюз не спасет архив, но даст сухой край для отхода.»',
    targetFloor: CRITICAL_LEAK_ARCHIVE_BASE_FLOOR,
    targetRoute: TARGET_ROUTE,
    targetRoomName: CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.floodgate,
    targetHint: 'пульт стоит за зараженным водяным коротким ходом и сухой обходной перемычкой',
    rewardItem: 'decon_fluid', rewardCount: 1,
    relationDelta: 8, xpReward: 45, moneyReward: 24,
    eventTargetName: 'Пульт архивной водоотсечки проверен; вода получила временный край.',
    eventTags: ['critical_leak_archive', 'floodgate', 'water', 'shortcut'],
    eventData: { routeId: CRITICAL_LEAK_ARCHIVE_ROUTE_ID, floodgateRaised: true },
    eventSeverity: 4,
  },
  {
    id: 'critical_leak_trade_contaminated_proof',
    giverNpcId: 'critical_leak_liquidator_egor',
    type: QuestType.FETCH,
    desc: 'Егор Отсечка: «Если полезете коротким ходом, принесите мазок воды. Без пробы все скажут, что вы просто намочили сапоги.»',
    targetItem: 'contaminated_swab', targetCount: 1,
    targetFloor: CRITICAL_LEAK_ARCHIVE_BASE_FLOOR,
    targetRoute: TARGET_ROUTE,
    targetRoomName: CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.shortcut,
    rewardItem: 'wet_rag_bundle', rewardCount: 1,
    extraRewards: [{ defId: 'decon_fluid', count: 1 }],
    relationDelta: 6, xpReward: 48, moneyReward: 28,
    eventTargetName: 'Проба зараженной воды из архивного короткого хода сдана ликвидатору.',
    eventTags: ['critical_leak_archive', 'contaminated_shortcut', 'water_sample', 'liquidator'],
    eventData: { routeId: CRITICAL_LEAK_ARCHIVE_ROUTE_ID, shortcutEvidence: true },
    eventSeverity: 3,
  },
]);

function gridIndex(gx: number, gy: number): number {
  return gy * GRID_W + gx;
}

function gridCenter(gx: number, gy: number): Point {
  return {
    x: GRID_ORIGIN + gx * GRID_STEP + (GRID_STEP >> 1),
    y: GRID_ORIGIN + gy * GRID_STEP + (GRID_STEP >> 1),
  };
}

function rand01(seed: number, i: number, salt: number): number {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) + Math.imul(i ^ 0xc2b2ae35, 0x27d4eb2d) + salt;
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  x = Math.imul(x, 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 0x100000000;
}

function buildPercolationField(seed: number): PercolationField {
  const open = new Uint8Array(GRID_W * GRID_H);
  const east = new Uint8Array(GRID_W * GRID_H);
  const south = new Uint8Array(GRID_W * GRID_H);

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const i = gridIndex(gx, gy);
      const centralLeak = Math.abs(gx - 22) <= 2 || Math.abs(gy - 22) <= 2;
      const archiveBias = gx > 7 && gx < 38 && gy > 7 && gy < 38 ? 0.026 : -0.018;
      open[i] = rand01(seed, i, 11) < SITE_P + archiveBias + (centralLeak ? 0.035 : 0) ? 1 : 0;
    }
  }

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const i = gridIndex(gx, gy);
      if (!open[i]) continue;
      if (gx + 1 < GRID_W && open[gridIndex(gx + 1, gy)]) {
        east[i] = rand01(seed, i, 23) < BOND_P + (Math.abs(gy - 22) <= 2 ? 0.07 : 0) ? 1 : 0;
      }
      if (gy + 1 < GRID_H && open[gridIndex(gx, gy + 1)]) {
        south[i] = rand01(seed, i, 37) < BOND_P + (Math.abs(gx - 22) <= 2 ? 0.07 : 0) ? 1 : 0;
      }
    }
  }

  const largestCells = largestBondComponent(open, east, south);
  const inLargest = new Uint8Array(GRID_W * GRID_H);
  for (const i of largestCells) inLargest[i] = 1;
  const centers = largestCells.map(i => gridCenter(i % GRID_W, Math.floor(i / GRID_W)));
  return { inLargest, east, south, largestCells, centers };
}

function largestBondComponent(open: Uint8Array, east: Uint8Array, south: Uint8Array): number[] {
  const seen = new Uint8Array(GRID_W * GRID_H);
  const queue = new Int32Array(GRID_W * GRID_H);
  let best: number[] = [];

  for (let start = 0; start < open.length; start++) {
    if (!open[start] || seen[start]) continue;
    const current: number[] = [];
    let head = 0;
    let tail = 0;
    seen[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const i = queue[head++];
      current.push(i);
      const gx = i % GRID_W;
      const gy = Math.floor(i / GRID_W);
      const candidates: number[] = [];
      if (gx + 1 < GRID_W && east[i]) candidates.push(gridIndex(gx + 1, gy));
      if (gx > 0 && east[gridIndex(gx - 1, gy)]) candidates.push(gridIndex(gx - 1, gy));
      if (gy + 1 < GRID_H && south[i]) candidates.push(gridIndex(gx, gy + 1));
      if (gy > 0 && south[gridIndex(gx, gy - 1)]) candidates.push(gridIndex(gx, gy - 1));
      for (const next of candidates) {
        if (!open[next] || seen[next]) continue;
        seen[next] = 1;
        queue[tail++] = next;
      }
    }
    if (current.length > best.length) best = current;
  }

  return best;
}

function wetNode(seed: number, i: number): boolean {
  return rand01(seed, i, 401) < 0.47;
}

function carveDisc(
  world: World,
  cx: number,
  cy: number,
  radius: number,
  cell: Cell.FLOOR | Cell.WATER,
  state: CriticalLeakArchiveState,
): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = world.wrap(cx + dx);
      const y = world.wrap(cy + dy);
      const idx = world.idx(x, y);
      if (world.cells[idx] === Cell.LIFT || world.cells[idx] === Cell.DOOR) continue;
      world.cells[idx] = cell;
      world.roomMap[idx] = -1;
      world.floorTex[idx] = cell === Cell.WATER ? Tex.F_WATER : Tex.F_MARBLE_TILE;
      world.wallTex[idx] = Tex.MARBLE;
      world.features[idx] = Feature.NONE;
      if (cell === Cell.WATER) state.wetCausewayCells++;
      else state.dryCausewayCells++;
    }
  }
}

function carveLine(
  world: World,
  a: Point,
  b: Point,
  radius: number,
  cell: Cell.FLOOR | Cell.WATER,
  state: CriticalLeakArchiveState,
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const steps = Math.max(1, Math.abs(dx), Math.abs(dy));
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    carveDisc(
      world,
      Math.round(a.x + dx * t),
      Math.round(a.y + dy * t),
      radius,
      cell,
      state,
    );
  }
}

function carveBentBridge(
  world: World,
  a: Point,
  b: Point,
  cell: Cell.FLOOR | Cell.WATER,
  state: CriticalLeakArchiveState,
): void {
  const mid: Point = Math.abs(a.x - b.x) > Math.abs(a.y - b.y)
    ? { x: b.x, y: a.y }
    : { x: a.x, y: b.y };
  carveLine(world, a, mid, cell === Cell.WATER ? 2 : 1, cell, state);
  carveLine(world, mid, b, cell === Cell.WATER ? 2 : 1, cell, state);
  state.bridgesAdded++;
}

function carvePercolationComponent(world: World, field: PercolationField, seed: number, state: CriticalLeakArchiveState): void {
  for (const i of field.largestCells) {
    const p = gridCenter(i % GRID_W, Math.floor(i / GRID_W));
    carveDisc(world, p.x, p.y, wetNode(seed, i) ? 2 : 1, wetNode(seed, i) ? Cell.WATER : Cell.FLOOR, state);
  }

  for (const i of field.largestCells) {
    const gx = i % GRID_W;
    const gy = Math.floor(i / GRID_W);
    const p = gridCenter(gx, gy);
    if (gx + 1 < GRID_W && field.east[i] && field.inLargest[gridIndex(gx + 1, gy)]) {
      const next = gridCenter(gx + 1, gy);
      carveLine(world, p, next, 1, wetNode(seed, i) || wetNode(seed, gridIndex(gx + 1, gy)) ? Cell.WATER : Cell.FLOOR, state);
    }
    if (gy + 1 < GRID_H && field.south[i] && field.inLargest[gridIndex(gx, gy + 1)]) {
      const next = gridCenter(gx, gy + 1);
      carveLine(world, p, next, 1, wetNode(seed, i) || wetNode(seed, gridIndex(gx, gy + 1)) ? Cell.WATER : Cell.FLOOR, state);
    }
  }
}

function nearestComponentCenter(world: World, from: Point, centers: readonly Point[]): Point {
  let best = centers[0] ?? { x: W >> 1, y: W >> 1 };
  let bestD2 = Number.POSITIVE_INFINITY;
  for (const center of centers) {
    const d2 = world.dist2(from.x, from.y, center.x, center.y);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = center;
    }
  }
  return best;
}

function stampNamedRoom(
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
  for (let yy = y - 1; yy <= y + h; yy++) {
    for (let xx = x - 1; xx <= x + w; xx++) {
      const idx = world.idx(xx, yy);
      if (world.roomMap[idx] === room.id) {
        world.floorTex[idx] = floorTex;
      } else if (world.cells[idx] === Cell.WALL) {
        world.wallTex[idx] = wallTex;
      }
    }
  }
  return room;
}

function addDoor(world: World, room: Room, side: 'north' | 'south' | 'west' | 'east', offset: number, state = DoorState.CLOSED): Point {
  const wx = side === 'west' ? room.x - 1 : side === 'east' ? room.x + room.w : room.x + offset;
  const wy = side === 'north' ? room.y - 1 : side === 'south' ? room.y + room.h : room.y + offset;
  const idx = world.idx(wx, wy);
  world.cells[idx] = Cell.DOOR;
  world.wallTex[idx] = Tex.DOOR_METAL;
  world.doors.set(idx, { idx, state, roomA: room.id, roomB: -1, keyId: '', timer: 0 });
  room.doors.push(idx);
  if (side === 'north') return { x: world.wrap(wx), y: world.wrap(wy - 1) };
  if (side === 'south') return { x: world.wrap(wx), y: world.wrap(wy + 1) };
  if (side === 'west') return { x: world.wrap(wx - 1), y: world.wrap(wy) };
  return { x: world.wrap(wx + 1), y: world.wrap(wy) };
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const liftIdx = world.idx(x, y);
  world.cells[liftIdx] = Cell.LIFT;
  world.wallTex[liftIdx] = Tex.LIFT_DOOR;
  world.roomMap[liftIdx] = -1;
  world.liftDir[liftIdx] = direction;
  const buttonIdx = world.idx(buttonX, buttonY);
  if (world.cells[buttonIdx] === Cell.FLOOR) world.features[buttonIdx] = Feature.LIFT_BUTTON;
  world.liftDir[buttonIdx] = direction;
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) world.features[idx] = feature;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
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
  inventory: readonly Item[],
  tags: readonly string[],
  lockDifficulty?: number,
): WorldContainer {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x,
    y,
    floor: CRITICAL_LEAK_ARCHIVE_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: Math.max(8, inventory.length + 5),
    faction: tags.includes('liquidator') ? Faction.LIQUIDATOR : Faction.SCIENTIST,
    access,
    lockDifficulty,
    discovered: true,
    tags: [CRITICAL_LEAK_ARCHIVE_ROUTE_ID, ...tags],
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.EMERGENCY_BOX ? Feature.APPARATUS : Feature.SHELF);
  return container;
}

function decorateArchiveRooms(world: World, rooms: Record<keyof typeof CRITICAL_LEAK_ARCHIVE_ROOM_NAMES, Room>): void {
  for (const room of [rooms.dryIndex, rooms.disputedStack]) {
    for (let y = room.y + 3; y < room.y + room.h - 2; y += 4) {
      for (let x = room.x + 3; x < room.x + room.w - 3; x++) {
        if ((x - room.x) % 9 === 0) continue;
        setFeature(world, x, y, Feature.SHELF);
      }
    }
  }
  for (let x = rooms.trade.x + 3; x < rooms.trade.x + rooms.trade.w - 3; x += 6) {
    setFeature(world, x, rooms.trade.y + 4, Feature.DESK);
  }
  for (const room of Object.values(rooms)) {
    setFeature(world, room.x + room.w - 3, room.y + 2, Feature.LAMP);
  }
  setFeature(world, rooms.floodgate.x + 6, rooms.floodgate.y + 5, Feature.APPARATUS);
  setFeature(world, rooms.floodgate.x + 12, rooms.floodgate.y + 5, Feature.SCREEN);
  setFeature(world, rooms.shortcut.x + 5, rooms.shortcut.y + 4, Feature.SINK);
  setFeature(world, rooms.dryingRoom.x + 5, rooms.dryingRoom.y + 5, Feature.MACHINE);
}

function spawnLeakNpc(
  entities: Entity[],
  nextId: NextId,
  def: PlotNpcDef,
  plotNpcId: string,
  x: number,
  y: number,
  weapon?: string,
): Entity {
  const entity: Entity = {
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: def.speed ?? 0.8,
    sprite: def.sprite ?? def.occupation,
    name: def.name,
    hp: def.hp,
    maxHp: def.maxHp,
    faction: def.faction,
    occupation: def.occupation,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: [...(def.inventory ?? [])],
    needs: freshNeeds(),
    questId: -1,
    canGiveQuest: true,
    plotNpcId,
  };
  if (weapon) entity.weapon = weapon;
  entities.push(entity);
  return entity;
}

function carveContaminatedShortcut(world: World, from: Point, to: Point, state: CriticalLeakArchiveState): void {
  const before = state.wetCausewayCells;
  carveBentBridge(world, from, { x: 750, y: 524 }, Cell.WATER, state);
  carveBentBridge(world, { x: 750, y: 524 }, to, Cell.WATER, state);
  state.contaminatedShortcutCells += state.wetCausewayCells - before;
}

function connectAnchors(
  world: World,
  field: PercolationField,
  anchors: readonly { point: Point; wet?: boolean }[],
  state: CriticalLeakArchiveState,
): void {
  for (const anchor of anchors) {
    carveBentBridge(
      world,
      anchor.point,
      nearestComponentCenter(world, anchor.point, field.centers),
      anchor.wet ? Cell.WATER : Cell.FLOOR,
      state,
    );
  }

  carveBentBridge(world, { x: 512, y: 512 }, { x: 0, y: 512 }, Cell.FLOOR, state);
  carveBentBridge(world, { x: 512, y: 512 }, { x: W - 1, y: 512 }, Cell.WATER, state);
  carveBentBridge(world, { x: 512, y: 512 }, { x: 512, y: 0 }, Cell.FLOOR, state);
  carveBentBridge(world, { x: 512, y: 512 }, { x: 512, y: W - 1 }, Cell.WATER, state);
}

function buildRooms(world: World): Record<keyof typeof CRITICAL_LEAK_ARCHIVE_ROOM_NAMES, Room> {
  return {
    lobby: stampNamedRoom(world, RoomType.HQ, 488, 486, 50, 34, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.lobby, Tex.MARBLE, Tex.F_MARBLE_TILE),
    trade: stampNamedRoom(world, RoomType.OFFICE, 374, 486, 72, 30, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.trade, Tex.MARBLE, Tex.F_PARQUET),
    dryIndex: stampNamedRoom(world, RoomType.STORAGE, 230, 196, 76, 44, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.dryIndex, Tex.MARBLE, Tex.F_PARQUET),
    disputedStack: stampNamedRoom(world, RoomType.STORAGE, 706, 212, 70, 48, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.disputedStack, Tex.MARBLE, Tex.F_WATER),
    floodgate: stampNamedRoom(world, RoomType.PRODUCTION, 594, 698, 66, 34, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.floodgate, Tex.METAL, Tex.F_CONCRETE),
    shortcut: stampNamedRoom(world, RoomType.BATHROOM, 752, 494, 72, 34, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.shortcut, Tex.TILE_W, Tex.F_WATER),
    dryingRoom: stampNamedRoom(world, RoomType.PRODUCTION, 292, 698, 70, 38, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.dryingRoom, Tex.METAL, Tex.F_CONCRETE),
    witness: stampNamedRoom(world, RoomType.COMMON, 454, 318, 84, 30, CRITICAL_LEAK_ARCHIVE_ROOM_NAMES.witness, Tex.MARBLE, Tex.F_GREEN_CARPET),
  };
}

function populateContainers(world: World, rooms: Record<keyof typeof CRITICAL_LEAK_ARCHIVE_ROOM_NAMES, Room>, state: CriticalLeakArchiveState): void {
  const dryA = addContainer(
    world,
    rooms.dryIndex,
    rooms.dryIndex.x + rooms.dryIndex.w - 8,
    rooms.dryIndex.y + 8,
    ContainerKind.FILING_CABINET,
    'Сухой пакет причины протечки',
    'locked',
    [
      { defId: 'sealed_complaint', count: 1 },
      { defId: 'blank_form', count: 2 },
      { defId: 'seal_wax', count: 1 },
    ],
    ['dry_archive_packet', 'documents', 'carry_dry_documents', 'trade'],
    3,
  );
  const dryB = addContainer(
    world,
    rooms.witness,
    rooms.witness.x + rooms.witness.w - 7,
    rooms.witness.y + 7,
    ContainerKind.FILING_CABINET,
    'Копии свидетельских сухих листов',
    'room',
    [
      { defId: 'sealed_complaint', count: 1 },
      { defId: 'emergency_roster', count: 1 },
    ],
    ['dry_archive_packet', 'witness', 'documents', 'public_trade'],
  );
  addContainer(
    world,
    rooms.shortcut,
    rooms.shortcut.x + rooms.shortcut.w - 8,
    rooms.shortcut.y + 8,
    ContainerKind.EMERGENCY_BOX,
    'Ящик проб зараженного короткого хода',
    'public',
    [
      { defId: 'contaminated_swab', count: 1 },
      { defId: 'wet_rag_bundle', count: 1 },
    ],
    [...WATER_TAGS, 'sample', 'shortcut_risk'],
  );
  const floodgate = addContainer(
    world,
    rooms.floodgate,
    rooms.floodgate.x + 8,
    rooms.floodgate.y + 7,
    ContainerKind.TOOL_LOCKER,
    'Пломбированный шкаф водоотсечки',
    'faction',
    [
      { defId: 'valve_tag', count: 1 },
      { defId: 'decon_fluid', count: 1 },
      { defId: 'filter_receipt', count: 1 },
    ],
    ['floodgate_control', 'raise_floodgate', 'liquidator', 'water'],
    4,
  );
  addContainer(
    world,
    rooms.dryingRoom,
    rooms.dryingRoom.x + rooms.dryingRoom.w - 8,
    rooms.dryingRoom.y + 9,
    ContainerKind.TOOL_LOCKER,
    'Ремонтный ящик аварийной просушки',
    'room',
    [
      { defId: 'cloth_roll', count: 1 },
      { defId: 'wet_rag_bundle', count: 1 },
      { defId: 'filter_receipt', count: 1 },
    ],
    ['drying_room', 'counterplay', 'water'],
  );
  state.dryPacketContainerIds.push(dryA.id, dryB.id);
  state.floodgateContainerId = floodgate.id;
}

function tuneInitialZones(world: World): void {
  generateZones(world);
  for (const zone of world.zones) {
    const wetEast = zone.cx > 600 || zone.cy > 620;
    zone.faction = wetEast ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
    zone.level = wetEast ? 4 : 3;
    zone.fogged = false;
  }
  for (let i = 0; i < W * W; i++) {
    const zone = world.zones[world.zoneMap[i]];
    world.factionControl[i] = zone?.faction ?? ZoneFaction.CITIZEN;
  }
}

export function generateCriticalLeakArchiveDesignFloor(): CriticalLeakArchiveGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId: NextId = { v: 1 };
  const seed = hashSeed('design-floor:critical-leak-archive:percolation', CRITICAL_LEAK_ARCHIVE_Z);
  const state: CriticalLeakArchiveState = {
    routeId: CRITICAL_LEAK_ARCHIVE_ROUTE_ID,
    anchorZ: CRITICAL_LEAK_ARCHIVE_Z,
    baseFloor: CRITICAL_LEAK_ARCHIVE_BASE_FLOOR,
    largestComponentCells: 0,
    wetCausewayCells: 0,
    dryCausewayCells: 0,
    bridgesAdded: 0,
    contaminatedShortcutCells: 0,
    dryPacketContainerIds: [],
    floodgateContainerId: -1,
    debugEntry: {
      spawnX: 512.5,
      spawnY: 502.5,
      summary: 'critical leak archive pending',
    },
  };

  const field = buildPercolationField(seed);
  state.largestComponentCells = field.largestCells.length;
  carvePercolationComponent(world, field, seed, state);

  const rooms = buildRooms(world);
  const lobbyNorth = addDoor(world, rooms.lobby, 'north', 25);
  const lobbyWest = addDoor(world, rooms.lobby, 'west', 18);
  const tradeEast = addDoor(world, rooms.trade, 'east', 16);
  const drySouth = addDoor(world, rooms.dryIndex, 'south', 34);
  const disputedSouth = addDoor(world, rooms.disputedStack, 'south', 35, DoorState.HERMETIC_CLOSED);
  const floodgateNorth = addDoor(world, rooms.floodgate, 'north', 33);
  const shortcutWest = addDoor(world, rooms.shortcut, 'west', 17);
  const dryingNorth = addDoor(world, rooms.dryingRoom, 'north', 34);
  const witnessSouth = addDoor(world, rooms.witness, 'south', 40);

  connectAnchors(world, field, [
    { point: lobbyNorth },
    { point: lobbyWest },
    { point: tradeEast },
    { point: drySouth },
    { point: disputedSouth, wet: true },
    { point: floodgateNorth },
    { point: shortcutWest, wet: true },
    { point: dryingNorth },
    { point: witnessSouth },
  ], state);
  carveContaminatedShortcut(world, shortcutWest, floodgateNorth, state);

  placeLift(world, rooms.lobby.x + 4, rooms.lobby.y + 8, rooms.lobby.x + 7, rooms.lobby.y + 8, LiftDirection.UP);
  placeLift(world, rooms.lobby.x + rooms.lobby.w - 5, rooms.lobby.y + 8, rooms.lobby.x + rooms.lobby.w - 8, rooms.lobby.y + 8, LiftDirection.DOWN);

  tuneInitialZones(world);
  decorateArchiveRooms(world, rooms);
  populateContainers(world, rooms, state);

  spawnLeakNpc(entities, nextId, ARCHIVIST_DEF, 'critical_leak_archivist_varvara', rooms.trade.x + 9, rooms.trade.y + 14);
  spawnLeakNpc(entities, nextId, LIQUIDATOR_DEF, 'critical_leak_liquidator_egor', rooms.floodgate.x + 14, rooms.floodgate.y + 16, 'makarov');

  sanitizeDoors(world);
  world.rebuildContainerMap();
  world.bakeLights();

  state.debugEntry.summary = `largest=${state.largestComponentCells} bridges=${state.bridgesAdded} wet=${state.wetCausewayCells} dry=${state.dryCausewayCells}`;
  return {
    world,
    entities,
    spawnX: state.debugEntry.spawnX,
    spawnY: state.debugEntry.spawnY,
    criticalLeakState: state,
  };
}

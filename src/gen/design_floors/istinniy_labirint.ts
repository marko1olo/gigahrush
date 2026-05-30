/* -- Design floor: istinniy_labirint / Истинный лабиринт -------- */

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
import { SURFACE_FLAG_CHALK_MAP, World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr } from '../../render/sprite_index';
import { stampSurfaceSplat } from '../../systems/surface_marks';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const ISTINNIY_LABIRINT_ROUTE_ID = 'istinniy_labirint' as const;
export const ISTINNIY_LABIRINT_Z = 28;
export const ISTINNIY_LABIRINT_CHORD_KEY = 'key';

const BASE_FLOOR = FloorLevel.MINISTRY;
const GRID_W = 63;
const GRID_H = 63;
const GRID_N = GRID_W * GRID_H;
const PITCH = 16;
const CENTER_OFFSET = 8;
const START_GX = 31;
const START_GY = 31;
const SAFE_WALL_MIN = 32;
const SAFE_WALL_MAX = W - 33;
const ROOM_WALL = Tex.MARBLE;
const ROOM_FLOOR = Tex.F_PARQUET;
const MAZE_WALL = Tex.PANEL;
const MAZE_FLOOR = Tex.F_CONCRETE;
const THREAD_FLOOR = Tex.F_TILE;
const CHORD_FLOOR = Tex.F_RED_CARPET;
const SAFE_WALL_ROOM = 'Лабиринт: белая стена обратного пути';
const LOST_ROOM = 'Лабиринт: узел потерянного Паши';
const DOCUMENT_STASH_ROOM = 'Лабиринт: тупик документного ящика';

const BIT_E = 1 << 0;
const BIT_W = 1 << 1;
const BIT_S = 1 << 2;
const BIT_N = 1 << 3;

interface Dir {
  dx: number;
  dy: number;
  bit: number;
  opposite: number;
}

const DIRS: readonly Dir[] = [
  { dx: 1, dy: 0, bit: BIT_E, opposite: BIT_W },
  { dx: -1, dy: 0, bit: BIT_W, opposite: BIT_E },
  { dx: 0, dy: 1, bit: BIT_S, opposite: BIT_N },
  { dx: 0, dy: -1, bit: BIT_N, opposite: BIT_S },
] as const;

interface MazeGraph {
  links: Uint8Array;
  start: number;
  exit: number;
  parent: Int32Array;
  depth: Int32Array;
  mainPath: number[];
  braidedLinks: number;
}

interface LockedChord {
  a: number;
  b: number;
  doorIdx: number;
}

interface CellPoint {
  x: number;
  y: number;
}

interface Landmark {
  cell: number;
  name: string;
  type: RoomType;
  w: number;
  h: number;
  feature: Feature;
}

export interface IstinniyLabirintMetrics {
  routeId: typeof ISTINNIY_LABIRINT_ROUTE_ID;
  z: typeof ISTINNIY_LABIRINT_Z;
  landmarkCount: number;
  rewardDeadEnds: number;
  lockedChords: number;
  ariadneCueCells: number;
  mainPathLength: number;
  pathEntropy: number;
  minLandmarkSpacing: number;
  safeWallCells: number;
  ungatedDownLiftReachable: boolean;
  ungatedUpLiftReachable: boolean;
}

const NPC_IDS = {
  ariadna: 'labyrinth_ariadna_zina',
  lostPavel: 'labyrinth_lost_pavel',
} as const;

const ARIADNA_DEF: PlotNpcDef = {
  name: 'Зина Ариадна',
  isFemale: true,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 150,
  maxHp: 150,
  money: 64,
  speed: 1.0,
  weapon: 'makarov',
  inventory: [
    { defId: 'chalk', count: 1 },
    { defId: 'key', count: 1 },
    { defId: 'ammo_9mm', count: 10 },
  ],
  talkLines: [
    'Истинный лабиринт не прячет выход. Он прячет уверенность, что ты уже был здесь.',
    'Белую стену держи левой рукой. Красная хорда короче, но там голоса считают патроны.',
    'Мел ставь не на память, а на отступление. Память здесь берет взятки.',
    'Паша ушел по ламповому следу и перестал спорить. Если найдешь, веди к белой стене, не к центру.',
  ],
  talkLinesPost: [
    'Нить обновлена. Если метка свежая, а пыль старая, значит, метку поставили не люди.',
    'Ключ от хорды не делает ход безопасным. Он только делает ошибку короче.',
  ],
  talkQuestResponse: 'Паша дошел до поста и молчит правильно. Держи схему лифтов. В следующий раз бери мел до входа.',
};

const LOST_PAVEL_DEF: PlotNpcDef = {
  name: 'Паша Без Нити',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 88,
  maxHp: 88,
  money: 17,
  speed: 0.78,
  inventory: [
    { defId: 'bread', count: 1 },
    { defId: 'chalk', count: 1 },
  ],
  talkLines: [
    'Я помнил три поворота. Потом стены стали одинаковые, а мои метки начали смотреть назад.',
    'Если ведешь к лифту, не срезай по красному ковру. Там кто-то дышит между шагами.',
    'В тупике с ящиком лежит бумага. Я ее не трогал: бумага знала мое имя.',
  ],
  talkLinesPost: [
    'У белой стены тихо. Слишком тихо, но это уже работа Зины.',
    'Я больше не считаю повороты. Считаю воду.',
  ],
};

registerSideQuest(NPC_IDS.ariadna, ARIADNA_DEF, [{
  id: 'labyrinth_rechalk_safe_wall',
  giverNpcId: NPC_IDS.ariadna,
  type: QuestType.FETCH,
  desc: 'Зина Ариадна: «Принеси мелок на белую стену. Обновим нить, пока лабиринт не выучил старые стрелки.»',
  targetItem: 'chalk',
  targetCount: 1,
  targetFloor: BASE_FLOOR,
  targetRoute: { designFloorId: ISTINNIY_LABIRINT_ROUTE_ID },
  targetRoomName: SAFE_WALL_ROOM,
  targetHint: 'Истинный лабиринт z=+28: держаться белой стены и искать свежие желтые метки.',
  rewardItem: 'key',
  rewardCount: 1,
  extraRewards: [{ defId: 'gasmask_filter', count: 1 }],
  relationDelta: 8,
  xpReward: 45,
  moneyReward: 28,
  eventTags: ['istinniy_labirint', 'chalk_route_mark', 'safe_wall'],
}]);

registerSideQuest(NPC_IDS.lostPavel, LOST_PAVEL_DEF, [{
  id: 'labyrinth_rescue_lost_pavel',
  giverNpcId: NPC_IDS.lostPavel,
  type: QuestType.TALK,
  desc: 'Паша Без Нити: «Доведи меня до Зины Ариадны. Только не красной хордой: там коротко, потому что там ждут.»',
  targetNpcId: NPC_IDS.ariadna,
  targetFloor: BASE_FLOOR,
  targetRoute: { designFloorId: ISTINNIY_LABIRINT_ROUTE_ID },
  targetRoomName: SAFE_WALL_ROOM,
  targetHint: 'Истинный лабиринт: вернуться к белой стене и поговорить с Зиной Ариадной.',
  rewardItem: 'lift_scheme',
  rewardCount: 1,
  extraRewards: [{ defId: 'water', count: 1 }],
  relationDelta: 12,
  xpReward: 55,
  moneyReward: 36,
  eventTags: ['istinniy_labirint', 'rescue', 'lost_npc'],
  failOnNpcDeathPlotId: NPC_IDS.lostPavel,
}]);

function gridIdx(gx: number, gy: number): number {
  const x = ((gx % GRID_W) + GRID_W) % GRID_W;
  const y = ((gy % GRID_H) + GRID_H) % GRID_H;
  return y * GRID_W + x;
}

function gridX(idx: number): number {
  return idx % GRID_W;
}

function gridY(idx: number): number {
  return (idx / GRID_W) | 0;
}

function centerOf(idx: number): CellPoint {
  return {
    x: CENTER_OFFSET + gridX(idx) * PITCH,
    y: CENTER_OFFSET + gridY(idx) * PITCH,
  };
}

function randInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function degree(links: Uint8Array, idx: number): number {
  let count = 0;
  const mask = links[idx];
  for (const dir of DIRS) if (mask & dir.bit) count++;
  return count;
}

function shuffleDirs(): Dir[] {
  const dirs = [...DIRS];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }
  return dirs;
}

function buildGrowingTreeMaze(): MazeGraph {
  const links = new Uint8Array(GRID_N);
  const visited = new Uint8Array(GRID_N);
  const start = gridIdx(START_GX, START_GY);
  const active = [start];
  visited[start] = 1;

  while (active.length > 0) {
    const ai = Math.random() < 0.72 ? active.length - 1 : randInt(active.length);
    const cell = active[ai];
    const gx = gridX(cell);
    const gy = gridY(cell);
    const candidates: { dir: Dir; next: number }[] = [];
    for (const dir of shuffleDirs()) {
      const next = gridIdx(gx + dir.dx, gy + dir.dy);
      if (!visited[next]) candidates.push({ dir, next });
    }
    if (candidates.length === 0) {
      active.splice(ai, 1);
      continue;
    }
    const pick = candidates[randInt(candidates.length)];
    links[cell] |= pick.dir.bit;
    links[pick.next] |= pick.dir.opposite;
    visited[pick.next] = 1;
    active.push(pick.next);
  }

  const braidedLinks = braidDeadEnds(links);
  const { parent, depth, exit } = measureMazeDepth(links, start);
  const mainPath = pathToRoot(parent, exit);
  return { links, start, exit, parent, depth, mainPath, braidedLinks };
}

function braidDeadEnds(links: Uint8Array): number {
  let added = 0;
  for (let idx = 0; idx < GRID_N; idx++) {
    if (degree(links, idx) !== 1 || Math.random() > 0.44) continue;
    const gx = gridX(idx);
    const gy = gridY(idx);
    const options: { dir: Dir; next: number; score: number }[] = [];
    for (const dir of DIRS) {
      if (links[idx] & dir.bit) continue;
      const next = gridIdx(gx + dir.dx, gy + dir.dy);
      options.push({ dir, next, score: degree(links, next) });
    }
    options.sort((a, b) => a.score - b.score);
    const pick = options[0];
    if (!pick) continue;
    links[idx] |= pick.dir.bit;
    links[pick.next] |= pick.dir.opposite;
    added++;
  }
  return added;
}

function measureMazeDepth(links: Uint8Array, start: number): { parent: Int32Array; depth: Int32Array; exit: number } {
  const parent = new Int32Array(GRID_N).fill(-1);
  const depth = new Int32Array(GRID_N).fill(-1);
  const queue = new Int32Array(GRID_N);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  depth[start] = 0;
  let exit = start;

  while (head < tail) {
    const cell = queue[head++];
    if (depth[cell] > depth[exit]) exit = cell;
    const gx = gridX(cell);
    const gy = gridY(cell);
    for (const dir of DIRS) {
      if ((links[cell] & dir.bit) === 0) continue;
      const next = gridIdx(gx + dir.dx, gy + dir.dy);
      if (depth[next] >= 0) continue;
      depth[next] = depth[cell] + 1;
      parent[next] = cell;
      queue[tail++] = next;
    }
  }

  return { parent, depth, exit };
}

function pathToRoot(parent: Int32Array, from: number): number[] {
  const path: number[] = [];
  let current = from;
  while (current >= 0) {
    path.push(current);
    current = parent[current];
  }
  path.reverse();
  return path;
}

function carvePatch(world: World, x: number, y: number, radius: number, floorTex: Tex): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] === Cell.LIFT) continue;
      if (world.roomMap[ci] >= 0) continue;
      if (world.cells[ci] === Cell.DOOR) continue;
      world.cells[ci] = Cell.FLOOR;
      world.floorTex[ci] = floorTex;
      world.wallTex[ci] = MAZE_WALL;
      world.features[ci] = Feature.NONE;
    }
  }
}

function carveLine(world: World, a: CellPoint, b: CellPoint, radius: number, floorTex: Tex, mark = false): number[] {
  const touched: number[] = [];
  let x = world.wrap(a.x);
  let y = world.wrap(a.y);
  const ddx = world.delta(x, b.x);
  const ddy = world.delta(y, b.y);
  const sx = ddx === 0 ? 0 : ddx > 0 ? 1 : -1;
  const sy = ddy === 0 ? 0 : ddy > 0 ? 1 : -1;

  for (let i = 0; i <= Math.abs(ddx); i++) {
    carvePatch(world, x, y, radius, floorTex);
    const ci = world.idx(x, y);
    touched.push(ci);
    if (mark && i % 11 === 0) markAriadneCue(world, x, y, touched.length, 220, 214, 130);
    if (i < Math.abs(ddx)) x = world.wrap(x + sx);
  }
  for (let i = 0; i <= Math.abs(ddy); i++) {
    carvePatch(world, x, y, radius, floorTex);
    const ci = world.idx(x, y);
    touched.push(ci);
    if (mark && i % 11 === 0) markAriadneCue(world, x, y, touched.length + 600, 220, 214, 130);
    if (i < Math.abs(ddy)) y = world.wrap(y + sy);
  }

  return touched;
}

function carveMaze(world: World, graph: MazeGraph): void {
  for (let idx = 0; idx < GRID_N; idx++) {
    const c = centerOf(idx);
    carvePatch(world, c.x, c.y, 2, MAZE_FLOOR);
  }

  for (let idx = 0; idx < GRID_N; idx++) {
    const c = centerOf(idx);
    const gx = gridX(idx);
    const gy = gridY(idx);
    for (const dir of DIRS) {
      if ((graph.links[idx] & dir.bit) === 0) continue;
      if (dir.bit === BIT_W || dir.bit === BIT_N) continue;
      const next = centerOf(gridIdx(gx + dir.dx, gy + dir.dy));
      carveLine(world, c, next, 1, MAZE_FLOOR);
    }
  }
}

function carveSafeWallRoute(world: World, graph: MazeGraph): number[] {
  const start = centerOf(graph.start);
  const exit = centerOf(graph.exit);
  const waypoints: CellPoint[] = [
    start,
    { x: SAFE_WALL_MIN, y: start.y },
    { x: SAFE_WALL_MIN, y: SAFE_WALL_MIN },
    { x: SAFE_WALL_MAX, y: SAFE_WALL_MIN },
    { x: SAFE_WALL_MAX, y: SAFE_WALL_MAX },
    { x: exit.x, y: SAFE_WALL_MAX },
    exit,
  ];
  const route: number[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    route.push(...carveLine(world, waypoints[i], waypoints[i + 1], 2, THREAD_FLOOR, true));
  }
  return route;
}

function markAriadneCue(world: World, x: number, y: number, seed: number, r: number, g: number, b: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) return;
  stampSurfaceSplat(world, x, y, 0.5, 0.5, 0.9, 0.6, seed, r, g, b, false);
  world.surfaceFlags[ci] |= SURFACE_FLAG_CHALK_MAP;
}

function markMainThread(world: World, graph: MazeGraph): void {
  for (let i = 0; i < graph.mainPath.length; i += 3) {
    const p = centerOf(graph.mainPath[i]);
    markAriadneCue(world, p.x, p.y, i + 90, 208, 202, 154);
  }
}

function linkedDirections(links: Uint8Array, cell: number): Dir[] {
  return DIRS.filter(dir => (links[cell] & dir.bit) !== 0);
}

function retintRoom(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let y = room.y - 1; y <= room.y + room.h; y++) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      const ci = world.idx(x, y);
      if (world.roomMap[ci] === room.id) {
        world.floorTex[ci] = floorTex;
      } else if (world.cells[ci] === Cell.WALL) {
        world.wallTex[ci] = wallTex;
      }
    }
  }
}

function addDoorToRoom(world: World, room: Room, wx: number, wy: number): void {
  const idx = world.idx(wx, wy);
  if (world.cells[idx] === Cell.DOOR) return;
  world.cells[idx] = Cell.DOOR;
  world.wallTex[idx] = Tex.DOOR_METAL;
  world.doors.set(idx, {
    idx,
    state: DoorState.CLOSED,
    roomA: room.id,
    roomB: -1,
    keyId: '',
    timer: 0,
  });
  room.doors.push(idx);
}

function connectLandmarkRoom(world: World, room: Room, cell: number, links: Uint8Array): void {
  const c = centerOf(cell);
  const dirs = linkedDirections(links, cell);
  const chosen = dirs.length > 0 ? dirs : [DIRS[0]];
  for (const dir of chosen) {
    let wx = c.x;
    let wy = c.y;
    if (dir.dx > 0) wx = room.x + room.w;
    else if (dir.dx < 0) wx = room.x - 1;
    else if (dir.dy > 0) wy = room.y + room.h;
    else wy = room.y - 1;
    if (dir.dy !== 0) wx = c.x;
    if (dir.dx !== 0) wy = c.y;
    addDoorToRoom(world, room, wx, wy);
    carvePatch(world, wx + dir.dx, wy + dir.dy, 1, MAZE_FLOOR);
  }
}

function placeLandmarkRoom(world: World, graph: MazeGraph, spec: Landmark): Room {
  const c = centerOf(spec.cell);
  const x = Math.max(10, Math.min(W - spec.w - 12, c.x - Math.floor(spec.w / 2)));
  const y = Math.max(10, Math.min(W - spec.h - 12, c.y - Math.floor(spec.h / 2)));
  const room = stampRoom(world, world.rooms.length, spec.type, x, y, spec.w, spec.h, -1);
  room.name = spec.name;
  retintRoom(world, room, ROOM_WALL, ROOM_FLOOR);
  if (spec.feature !== Feature.NONE) world.features[world.idx(c.x, c.y)] = spec.feature;
  connectLandmarkRoom(world, room, spec.cell, graph.links);
  return room;
}

function pathCell(graph: MazeGraph, fraction: number): number {
  const idx = Math.max(0, Math.min(graph.mainPath.length - 1, Math.round((graph.mainPath.length - 1) * fraction)));
  return graph.mainPath[idx];
}

function deepestDeadEnds(graph: MazeGraph, count: number, exclude: ReadonlySet<number>): number[] {
  const cells: number[] = [];
  for (let idx = 0; idx < GRID_N; idx++) {
    if (exclude.has(idx)) continue;
    if (degree(graph.links, idx) <= 1) cells.push(idx);
  }
  cells.sort((a, b) => graph.depth[b] - graph.depth[a]);
  return cells.slice(0, count);
}

function chooseLandmarks(graph: MazeGraph): Landmark[] {
  const onMain = new Set(graph.mainPath);
  const deadEnds = deepestDeadEnds(graph, 4, onMain);
  const specs: Landmark[] = [
    { cell: graph.start, name: 'Лабиринт: нулевая катушка Ариадны', type: RoomType.HQ, w: 17, h: 13, feature: Feature.DESK },
    { cell: pathCell(graph, 0.18), name: SAFE_WALL_ROOM, type: RoomType.CORRIDOR, w: 23, h: 9, feature: Feature.LAMP },
    { cell: pathCell(graph, 0.38), name: 'Лабиринт: комната шести стрелок', type: RoomType.COMMON, w: 17, h: 15, feature: Feature.SCREEN },
    { cell: pathCell(graph, 0.62), name: 'Лабиринт: узел короткой красной хорды', type: RoomType.CORRIDOR, w: 19, h: 11, feature: Feature.LAMP },
    { cell: deadEnds[0] ?? pathCell(graph, 0.73), name: LOST_ROOM, type: RoomType.LIVING, w: 13, h: 13, feature: Feature.CHAIR },
    { cell: deadEnds[1] ?? pathCell(graph, 0.84), name: DOCUMENT_STASH_ROOM, type: RoomType.STORAGE, w: 13, h: 11, feature: Feature.SHELF },
    { cell: graph.exit, name: 'Лабиринт: дальняя лифтовая спина', type: RoomType.HQ, w: 17, h: 13, feature: Feature.LIFT_BUTTON },
  ];
  return specs;
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function selectLockedChords(graph: MazeGraph, count: number): { a: number; dir: Dir; b: number }[] {
  const main = new Set(graph.mainPath);
  const used = new Set<string>();
  const candidates: { a: number; dir: Dir; b: number; score: number }[] = [];
  for (let a = 0; a < GRID_N; a++) {
    const gx = gridX(a);
    const gy = gridY(a);
    for (const dir of DIRS) {
      if (graph.links[a] & dir.bit) continue;
      const b = gridIdx(gx + dir.dx, gy + dir.dy);
      const key = pairKey(a, b);
      if (used.has(key)) continue;
      used.add(key);
      const onPath = main.has(a) || main.has(b);
      const score = graph.depth[a] + graph.depth[b] + (onPath ? 120 : 0);
      candidates.push({ a, dir, b, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, count);
}

function carveLockedChord(world: World, chord: { a: number; dir: Dir; b: number }, serial: number): LockedChord {
  const a = centerOf(chord.a);
  const b = centerOf(chord.b);
  const ddx = world.delta(a.x, b.x);
  const ddy = world.delta(a.y, b.y);
  const steps = Math.max(Math.abs(ddx), Math.abs(ddy));
  const sx = ddx === 0 ? 0 : ddx > 0 ? 1 : -1;
  const sy = ddy === 0 ? 0 : ddy > 0 ? 1 : -1;
  const gateStep = Math.max(2, Math.floor(steps / 2));
  let x = world.wrap(a.x);
  let y = world.wrap(a.y);
  let doorIdx = world.idx(x, y);
  let gateX = x;
  let gateY = y;

  function stampGate(): void {
    doorIdx = world.idx(gateX, gateY);
    if (sx !== 0) {
      for (let oy = -1; oy <= 1; oy++) {
        const wi = world.idx(gateX, gateY + oy);
        world.cells[wi] = oy === 0 ? Cell.DOOR : Cell.WALL;
        world.wallTex[wi] = oy === 0 ? Tex.DOOR_METAL : Tex.METAL;
      }
    } else {
      for (let ox = -1; ox <= 1; ox++) {
        const wi = world.idx(gateX + ox, gateY);
        world.cells[wi] = ox === 0 ? Cell.DOOR : Cell.WALL;
        world.wallTex[wi] = ox === 0 ? Tex.DOOR_METAL : Tex.METAL;
      }
    }
    world.doors.set(doorIdx, {
      idx: doorIdx,
      state: DoorState.LOCKED,
      roomA: -1,
      roomB: -1,
      keyId: ISTINNIY_LABIRINT_CHORD_KEY,
      timer: 0,
    });
  }

  for (let step = 0; step <= steps; step++) {
    if (step === gateStep) {
      gateX = x;
      gateY = y;
      stampGate();
    } else {
      carvePatch(world, x, y, 1, CHORD_FLOOR);
      if (step % 5 === 0) markAriadneCue(world, x, y, 1000 + serial * 97 + step, 160, 52, 52);
    }
    if (step < steps) {
      x = world.wrap(x + sx);
      y = world.wrap(y + sy);
    }
  }
  stampGate();

  return { a: chord.a, b: chord.b, doorIdx };
}

function placeLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.LIFT;
  world.wallTex[idx] = Tex.LIFT_DOOR;
  world.features[idx] = Feature.NONE;
  world.liftDir[idx] = direction;
  for (const dir of DIRS) {
    const ai = world.idx(x + dir.dx, y + dir.dy);
    if (world.cells[ai] === Cell.FLOOR) {
      world.features[ai] = Feature.LIFT_BUTTON;
      world.liftDir[ai] = direction;
      return;
    }
  }
}

function addContainer(world: World, nextContainerId: { v: number }, x: number, y: number, roomId: number, kind: ContainerKind, name: string, inventory: WorldContainer['inventory'], tags: string[], access: WorldContainer['access'] = 'public'): void {
  world.addContainer({
    id: nextContainerId.v++,
    x: world.wrap(x),
    y: world.wrap(y),
    floor: BASE_FLOOR,
    roomId,
    zoneId: world.zoneMap[world.idx(x, y)] ?? 0,
    kind,
    name,
    inventory,
    capacitySlots: Math.max(6, inventory.length + 3),
    access,
    lockDifficulty: access === 'locked' ? 3 : undefined,
    discovered: access !== 'secret',
    tags: ['istinniy_labirint', ...tags],
  });
}

function placeRewardStashes(world: World, graph: MazeGraph, nextContainerId: { v: number }, roomsByName: Map<string, Room>): void {
  const excluded = new Set(graph.mainPath);
  const deadEnds = deepestDeadEnds(graph, 7, excluded);
  const docRoom = roomsByName.get(DOCUMENT_STASH_ROOM);
  if (docRoom) {
    addContainer(world, nextContainerId, docRoom.x + Math.floor(docRoom.w / 2), docRoom.y + Math.floor(docRoom.h / 2), docRoom.id, ContainerKind.FILING_CABINET, 'Документный ящик без обратной стрелки', [
      { defId: 'note', count: 1, data: 'Записка: белая стена ведет назад, красная хорда ведет быстро, но не всех.' },
      { defId: 'elevator_access_order', count: 1 },
      { defId: 'personal_file_copy', count: 1 },
    ], ['document_stash', 'dead_end', 'reward'], 'secret');
  }

  for (let i = 0; i < deadEnds.length; i++) {
    const p = centerOf(deadEnds[i]);
    addContainer(world, nextContainerId, p.x, p.y, -1, i % 2 === 0 ? ContainerKind.SECRET_STASH : ContainerKind.METAL_CABINET, `Тупиковый тайник нити ${i + 1}`, [
      { defId: i % 2 === 0 ? 'chalk' : 'water', count: 1 },
      { defId: i % 3 === 0 ? 'bandage' : 'bread', count: 1 },
      ...(i === 0 ? [{ defId: 'key', count: 1 }] : []),
    ], ['dead_end', 'reward', i === 0 ? 'chord_key' : 'supply'], i === 0 ? 'locked' : 'secret');
    markAriadneCue(world, p.x, p.y, 1500 + i, 232, 220, 158);
  }
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: { v: number },
  npcId: string,
  def: PlotNpcDef,
  x: number,
  y: number,
  angle = 0,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
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
    ai: { goal: AIGoal.IDLE, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(item => ({ ...item })),
    weapon: def.weapon,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
    rpg: randomRPG(3),
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
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = scaleMonsterHp(def.hp, level);
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
    name: def.name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    attackCd: Math.random(),
    rpg: randomRPG(level),
  });
}

function placeActors(world: World, graph: MazeGraph, roomsByName: Map<string, Room>, entities: Entity[], nextId: { v: number }, chords: readonly LockedChord[]): void {
  const startRoom = roomsByName.get('Лабиринт: нулевая катушка Ариадны');
  const lostRoom = roomsByName.get(LOST_ROOM);
  if (startRoom) spawnPlotNpc(entities, nextId, NPC_IDS.ariadna, ARIADNA_DEF, startRoom.x + 4, startRoom.y + 6, 0);
  if (lostRoom) spawnPlotNpc(entities, nextId, NPC_IDS.lostPavel, LOST_PAVEL_DEF, lostRoom.x + 5, lostRoom.y + 6, Math.PI);

  const chordKinds = [MonsterKind.SHADOW, MonsterKind.BEZEKHIY, MonsterKind.NELYUD, MonsterKind.PECHATEED] as const;
  for (let i = 0; i < chords.length; i++) {
    const p = centerOf(i % 2 === 0 ? chords[i].a : chords[i].b);
    spawnMonster(entities, nextId, chordKinds[i % chordKinds.length], p.x + (i % 3) - 1, p.y + ((i + 1) % 3) - 1, 5);
  }

  const deepDeadEnds = deepestDeadEnds(graph, 14, new Set(graph.mainPath));
  const ambushKinds = [MonsterKind.BEZEKHIY, MonsterKind.KONTORSHCHIK, MonsterKind.SHADOW, MonsterKind.PARAGRAPH] as const;
  for (let i = 0; i < deepDeadEnds.length; i++) {
    const p = centerOf(deepDeadEnds[i]);
    spawnMonster(entities, nextId, ambushKinds[i % ambushKinds.length], p.x, p.y, 3 + (i % 3));
  }

  void world;
}

function placeLandmarks(world: World, graph: MazeGraph): Map<string, Room> {
  const rooms = new Map<string, Room>();
  for (const spec of chooseLandmarks(graph)) {
    const room = placeLandmarkRoom(world, graph, spec);
    rooms.set(room.name, room);
  }
  return rooms;
}

function tuneLabyrinthZones(world: World): void {
  generateZones(world);
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
    zone.level = Math.max(2, Math.min(5, 2 + Math.round(d / 280)));
    zone.faction = d < 190 ? ZoneFaction.LIQUIDATOR : zone.id % 5 === 0 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    zone.fogged = false;
    zone.hasLift = d < 260 || zone.id % 11 === 0;
  }
  for (let i = 0; i < W * W; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.CITIZEN;
  }
}

function strictWalkable(world: World, idx: number): boolean {
  const cell = world.cells[idx];
  if (cell === Cell.FLOOR || cell === Cell.WATER) return true;
  if (cell !== Cell.DOOR) return false;
  const door = world.doors.get(idx);
  return !!door && (door.state === DoorState.OPEN || door.state === DoorState.CLOSED || door.state === DoorState.HERMETIC_OPEN);
}

function reachableStrict(world: World, startIdx: number): Uint8Array {
  const seen = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  if (!strictWalkable(world, startIdx)) return seen;
  let head = 0;
  let tail = 0;
  seen[startIdx] = 1;
  queue[tail++] = startIdx;
  while (head < tail) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const dir of DIRS) {
      const ni = world.idx(x + dir.dx, y + dir.dy);
      if (seen[ni] || !strictWalkable(world, ni)) continue;
      seen[ni] = 1;
      queue[tail++] = ni;
    }
  }
  return seen;
}

function reachableLift(world: World, reachable: Uint8Array, direction: LiftDirection): boolean {
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const dir of DIRS) {
      if (reachable[world.idx(x + dir.dx, y + dir.dy)]) return true;
    }
  }
  return false;
}

function findPathToLift(world: World, startIdx: number, direction: LiftDirection): number[] {
  const parent = new Int32Array(W * W).fill(-1);
  const seen = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  seen[startIdx] = 1;
  queue[tail++] = startIdx;
  let target = -1;
  while (head < tail && target < 0) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const dir of DIRS) {
      const ni = world.idx(x + dir.dx, y + dir.dy);
      if (world.cells[ni] === Cell.LIFT && world.liftDir[ni] === direction) {
        target = ci;
        break;
      }
      if (seen[ni] || !strictWalkable(world, ni)) continue;
      seen[ni] = 1;
      parent[ni] = ci;
      queue[tail++] = ni;
    }
  }
  if (target < 0) return [];
  const path: number[] = [];
  let current = target;
  while (current >= 0) {
    path.push(current);
    if (current === startIdx) break;
    current = parent[current];
  }
  path.reverse();
  return path;
}

function pathDirectionEntropy(path: readonly number[]): number {
  if (path.length < 2) return 0;
  const counts = [0, 0, 0, 0];
  for (let i = 1; i < path.length; i++) {
    const ax = path[i - 1] % W;
    const ay = (path[i - 1] / W) | 0;
    const bx = path[i] % W;
    const by = (path[i] / W) | 0;
    const dx = Math.sign(((bx - ax + W + W / 2) % W) - W / 2);
    const dy = Math.sign(((by - ay + W + W / 2) % W) - W / 2);
    if (dx > 0) counts[0]++;
    else if (dx < 0) counts[1]++;
    else if (dy > 0) counts[2]++;
    else if (dy < 0) counts[3]++;
  }
  const total = counts.reduce((sum, value) => sum + value, 0);
  let entropy = 0;
  for (const count of counts) {
    if (count <= 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function minRoomSpacing(world: World, rooms: readonly Room[]): number {
  let best = Infinity;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const d = world.dist(a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2);
      if (d < best) best = d;
    }
  }
  return best === Infinity ? 0 : best;
}

export function measureIstinniyLabirintMetrics(generation: FloorGeneration): IstinniyLabirintMetrics {
  const { world } = generation;
  const startIdx = world.idx(Math.floor(generation.spawnX), Math.floor(generation.spawnY));
  const reachable = reachableStrict(world, startIdx);
  const path = findPathToLift(world, startIdx, LiftDirection.DOWN);
  const landmarkRooms = world.rooms.filter(room => room.name.startsWith('Лабиринт:'));
  let cueCells = 0;
  let safeWallCells = 0;
  for (let i = 0; i < W * W; i++) {
    if (world.surfaceFlags[i] & SURFACE_FLAG_CHALK_MAP) cueCells++;
    if (world.floorTex[i] === THREAD_FLOOR && world.cells[i] === Cell.FLOOR) safeWallCells++;
  }
  return {
    routeId: ISTINNIY_LABIRINT_ROUTE_ID,
    z: ISTINNIY_LABIRINT_Z,
    landmarkCount: landmarkRooms.length,
    rewardDeadEnds: world.containers.filter(container => container.tags.includes('dead_end') && container.tags.includes('reward')).length,
    lockedChords: [...world.doors.values()].filter(door => door.keyId === ISTINNIY_LABIRINT_CHORD_KEY && door.state === DoorState.LOCKED).length,
    ariadneCueCells: cueCells,
    mainPathLength: path.length,
    pathEntropy: pathDirectionEntropy(path),
    minLandmarkSpacing: minRoomSpacing(world, landmarkRooms),
    safeWallCells,
    ungatedDownLiftReachable: reachableLift(world, reachable, LiftDirection.DOWN),
    ungatedUpLiftReachable: reachableLift(world, reachable, LiftDirection.UP),
  };
}

export function generateIstinniyLabirintDesignFloor(): FloorGeneration {
  const world = new World();
  world.wallTex.fill(MAZE_WALL);
  world.floorTex.fill(MAZE_FLOOR);

  const graph = buildGrowingTreeMaze();
  carveMaze(world, graph);
  carveSafeWallRoute(world, graph);
  markMainThread(world, graph);

  const roomsByName = placeLandmarks(world, graph);
  const chordSpecs = selectLockedChords(graph, 8);
  const chords = chordSpecs.map((chord, index) => carveLockedChord(world, chord, index));

  const nextContainerId = { v: 1 };
  placeRewardStashes(world, graph, nextContainerId, roomsByName);

  const start = centerOf(graph.start);
  const exit = centerOf(graph.exit);
  placeLift(world, start.x - 3, start.y, LiftDirection.UP);
  placeLift(world, exit.x + 3, exit.y, LiftDirection.DOWN);

  tuneLabyrinthZones(world);
  ensureConnectivity(world, start.x + 0.5, start.y + 0.5);
  sanitizeDoors(world);
  world.rebuildContainerMap();
  world.bakeLights();

  const entities: Entity[] = [];
  const nextId = { v: 1 };
  placeActors(world, graph, roomsByName, entities, nextId, chords);

  return {
    world,
    entities,
    spawnX: start.x + 0.5,
    spawnY: start.y + 0.5,
  };
}

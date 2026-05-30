import { Cell, Feature, msg, type Entity, type GameState } from '../../core/types';
import { World } from '../../core/world';
import { RUNTIME_TOPOLOGY_LIMITS } from '../../data/runtime_topology';
import { isPlayerEntity } from '../player_actor';

interface SnakeRuntime {
  path: Int32Array;
  body: Int32Array;
  base: Uint8Array;
  head: number;
  length: number;
  stepAccum: number;
  warnedUntil: number;
  stoppedUntil: number;
  lastMsgTime: number;
}

const WALL_SNAKE_RE = /\[wall_snake:(-?\d+),(-?\d+),(\d+),(\d+)\]/;
const snakeByWorld = new WeakMap<World, SnakeRuntime | null>();

function perimeterPoint(world: World, x0: number, y0: number, w: number, h: number, step: number): number {
  const len = Math.max(1, (w + h) * 2 - 4);
  let t = ((step % len) + len) % len;
  if (t < w) return world.idx(x0 + t, y0);
  t -= w;
  if (t < h - 1) return world.idx(x0 + w - 1, y0 + 1 + t);
  t -= h - 1;
  if (t < w - 1) return world.idx(x0 + w - 2 - t, y0 + h - 1);
  t -= w - 1;
  return world.idx(x0, y0 + h - 2 - t);
}

function mutableSnakeCell(world: World, ci: number): boolean {
  const cell = world.cells[ci] as Cell;
  if (cell !== Cell.FLOOR && cell !== Cell.WATER) return false;
  if (world.hermoWall[ci] !== 0 || world.aptMask[ci] !== 0 || world.doors.has(ci) || world.containerMap.has(ci)) return false;
  const feature = world.features[ci] as Feature;
  return feature === Feature.NONE || feature === Feature.LAMP;
}

function initSnake(world: World): SnakeRuntime | null {
  const cached = snakeByWorld.get(world);
  if (cached !== undefined) return cached;

  for (const room of world.rooms) {
    const match = WALL_SNAKE_RE.exec(room.name);
    if (!match) continue;
    const x0 = Number(match[1]);
    const y0 = Number(match[2]);
    const w = Number(match[3]);
    const h = Number(match[4]);
    const perimeter = Math.max(0, Math.min(RUNTIME_TOPOLOGY_LIMITS.wallSnakeMaxPathCells, (w + h) * 2 - 4));
    if (perimeter < 18) continue;
    const pathCells: number[] = [];
    const baseCells: number[] = [];
    for (let i = 0; i < perimeter; i++) {
      const ci = perimeterPoint(world, x0, y0, w, h, i);
      if (!mutableSnakeCell(world, ci)) continue;
      pathCells.push(ci);
      baseCells.push(world.cells[ci]);
    }
    const count = pathCells.length;
    if (count < 18) continue;
    const path = Int32Array.from(pathCells);
    const base = Uint8Array.from(baseCells);
    const body = new Int32Array(Math.min(RUNTIME_TOPOLOGY_LIMITS.wallSnakeMaxBodyCells, Math.max(12, 8 + Math.floor(count / 5))));
    const length = Math.min(body.length, 10 + Math.floor(count / 9));
    for (let i = 0; i < length; i++) {
      const pi = (count - i) % count;
      body[i] = pi;
      world.cells[path[pi]] = Cell.WALL;
    }
    world.markCellsDirty();
    const runtime: SnakeRuntime = {
      path,
      body,
      base,
      head: 0,
      length,
      stepAccum: 0,
      warnedUntil: 0,
      stoppedUntil: 0,
      lastMsgTime: -Infinity,
    };
    snakeByWorld.set(world, runtime);
    return runtime;
  }

  snakeByWorld.set(world, null);
  return null;
}

function bodyContains(snake: SnakeRuntime, pathIndex: number): boolean {
  for (let i = 0; i < snake.length; i++) {
    if (snake.body[i] === pathIndex) return true;
  }
  return false;
}

function restoreTail(world: World, snake: SnakeRuntime): void {
  const tailSlot = snake.length - 1;
  const tailPathIndex = snake.body[tailSlot];
  if (tailPathIndex < 0) return;
  const ci = snake.path[tailPathIndex];
  world.cells[ci] = snake.base[tailPathIndex] as Cell;
}

function pushHead(world: World, snake: SnakeRuntime, nextHead: number): void {
  restoreTail(world, snake);
  for (let i = snake.length - 1; i > 0; i--) snake.body[i] = snake.body[i - 1];
  snake.body[0] = nextHead;
  snake.head = nextHead;
  world.cells[snake.path[nextHead]] = Cell.WALL;
  world.markCellsDirty();
}

function shrinkSnake(world: World, snake: SnakeRuntime, nextLength: number): void {
  const clamped = Math.max(6, Math.min(snake.length, nextLength));
  for (let i = clamped; i < snake.length; i++) {
    const pathIndex = snake.body[i];
    world.cells[snake.path[pathIndex]] = snake.base[pathIndex] as Cell;
  }
  snake.length = clamped;
  world.markCellsDirty();
}

function playerOnPath(world: World, snake: SnakeRuntime, player: Entity, pathIndex: number): boolean {
  const ci = snake.path[pathIndex];
  return world.idx(Math.floor(player.x), Math.floor(player.y)) === ci;
}

function wallSnakeControlAt(world: World, lookIdx: number): boolean {
  if ((world.features[lookIdx] as Feature) !== Feature.SCREEN) return false;
  const room = world.rooms[world.roomMap[lookIdx]];
  return room?.name.includes('[wall_snake:') === true;
}

function hurtPlayer(player: Entity, state: GameState, amount: number): void {
  player.hp = Math.max(1, (player.hp ?? 100) - amount);
  if (player.needs) player.needs.sleep = Math.max(0, player.needs.sleep - amount * 0.15);
  state.msgs.push(msg(`Змейка давит бетонным боком: -${amount} HP. Ждите хвост или клиньте экран.`, state.time, '#f84'));
}

export function updateWallSnakeAnomaly(world: World, player: Entity, state: GameState, dt: number): void {
  if (!isPlayerEntity(player)) return;
  const snake = initSnake(world);
  if (!snake || snake.path.length === 0) return;
  if (state.time < snake.stoppedUntil) return;

  const tick = 0.78 - Math.min(0.38, snake.length * 0.004);
  snake.stepAccum += dt;
  if (snake.stepAccum < tick) {
    for (let i = 0; i < snake.length; i++) {
      if (playerOnPath(world, snake, player, snake.body[i])) {
        if (state.time >= snake.warnedUntil) hurtPlayer(player, state, 3);
        return;
      }
    }
    return;
  }
  snake.stepAccum = 0;

  let nextHead = (snake.head + 1) % snake.path.length;
  for (let turn = 0; turn < 4 && bodyContains(snake, nextHead); turn++) nextHead = (nextHead + 1) % snake.path.length;

  if (playerOnPath(world, snake, player, nextHead)) {
    if (state.time < snake.warnedUntil) {
      hurtPlayer(player, state, 9);
    } else {
      snake.warnedUntil = state.time + tick * 1.8;
      if (state.time - snake.lastMsgTime > 3) {
        snake.lastMsgTime = state.time;
        state.msgs.push(msg('Голова змейки смотрит прямо сюда. Есть один шаг, чтобы уйти.', state.time, '#fa4'));
      }
    }
    return;
  }

  pushHead(world, snake, nextHead);
}

function removeOne(player: Entity, ids: readonly string[]): string {
  const inv = player.inventory;
  if (!inv) return '';
  for (const id of ids) {
    const item = inv.find(v => v.defId === id && v.count > 0);
    if (!item) continue;
    item.count--;
    if (item.count <= 0) inv.splice(inv.indexOf(item), 1);
    return id;
  }
  return '';
}

export function tryUseWallSnakeAnomaly(world: World, player: Entity, state: GameState, lookX: number, lookY: number): boolean {
  const snake = initSnake(world);
  if (!snake) return false;
  const lookIdx = world.idx(Math.floor(lookX), Math.floor(lookY));
  let nearSnake = false;
  for (let i = 0; i < snake.length; i++) {
    if (snake.path[snake.body[i]] === lookIdx) {
      nearSnake = true;
      break;
    }
  }
  const control = wallSnakeControlAt(world, lookIdx);
  const closeEnough = world.dist2(player.x, player.y, lookX, lookY) <= 5.8;
  if ((!nearSnake && !control) || !closeEnough) return false;

  const bait = removeOne(player, ['gear', 'spring', 'metal_sheet', 'bread', 'mushroom_mass']);
  if (bait) {
    snake.stoppedUntil = Math.max(snake.stoppedUntil, state.time + 7);
    shrinkSnake(world, snake, snake.length - 2);
    state.msgs.push(msg('Приманка ушла в экран. Змейка застряла и укоротилась.', state.time, '#8cf'));
  } else {
    snake.stoppedUntil = Math.max(snake.stoppedUntil, state.time + 2.5);
    state.msgs.push(msg('Экран щелкнул пустым зубом. Нужна железка, еда или грибная масса.', state.time, '#fa4'));
  }
  return true;
}

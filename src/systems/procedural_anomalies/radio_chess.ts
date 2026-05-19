import { Cell, EntityType, Feature, msg, type Entity, type GameState, type Room } from '../../core/types';
import { World } from '../../core/world';

type RadioChessPhase = 'white' | 'black' | 'file' | 'rank' | 'knight';

interface RadioChessBeacon {
  idx: number;
  x: number;
  y: number;
  roomId: number;
}

interface RadioChessDomain {
  roomId: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RadioChessCache {
  seed: number;
  domains: RadioChessDomain[];
  beacons: RadioChessBeacon[];
}

interface RadioChessRuntime {
  disabledBeacons: Set<number>;
  tickAccum: number;
  lastCell: number;
  lastPhase: number;
  lastMsgTime: number;
}

const PHASE_SECONDS = 5.5;
const PRESSURE_TICK_SECONDS = 0.8;
const PHASES: readonly RadioChessPhase[] = ['white', 'black', 'file', 'rank', 'knight'];
const RADIO_CHESS_ROOM_PREFIX = 'Радио-шахматы';
const cacheByWorld = new WeakMap<World, RadioChessCache>();
const runtimeByState = new WeakMap<GameState, RadioChessRuntime>();

function runtimeFor(state: GameState): RadioChessRuntime {
  const current = runtimeByState.get(state);
  if (current) return current;
  const next: RadioChessRuntime = {
    disabledBeacons: new Set(),
    tickAccum: 0,
    lastCell: -1,
    lastPhase: -1,
    lastMsgTime: -Infinity,
  };
  runtimeByState.set(state, next);
  return next;
}

function radioChessRoom(room: Room): boolean {
  return room.name.includes(RADIO_CHESS_ROOM_PREFIX);
}

function cacheFor(world: World): RadioChessCache {
  const current = cacheByWorld.get(world);
  if (current) return current;

  const domains: RadioChessDomain[] = [];
  const beacons: RadioChessBeacon[] = [];
  let seed = 0x51cafe;
  for (const room of world.rooms) {
    if (!radioChessRoom(room)) continue;
    domains.push({ roomId: room.id, x: room.x, y: room.y, w: room.w, h: room.h });
    seed = (seed ^ ((room.x * 73856093) ^ (room.y * 19349663) ^ (room.w * 83492791) ^ room.id)) | 0;

    for (let dy = 0; dy < room.h; dy++) {
      for (let dx = 0; dx < room.w; dx++) {
        const x = world.wrap(room.x + dx);
        const y = world.wrap(room.y + dy);
        const ci = world.idx(x, y);
        const feature = world.features[ci] as Feature;
        if (feature !== Feature.APPARATUS && feature !== Feature.SCREEN) continue;
        beacons.push({ idx: ci, x, y, roomId: room.id });
      }
    }
  }

  const next = { seed, domains, beacons };
  cacheByWorld.set(world, next);
  return next;
}

function phaseIndexAt(time: number, seed: number): number {
  const offset = Math.abs(seed % 997) / 997;
  return Math.floor((time + offset * PHASE_SECONDS) / PHASE_SECONDS);
}

function phaseName(phase: RadioChessPhase): string {
  if (phase === 'white') return 'белые клетки';
  if (phase === 'black') return 'черные клетки';
  if (phase === 'file') return 'четвертые вертикали';
  if (phase === 'rank') return 'четвертые горизонтали';
  return 'ход коня от маяка';
}

function inDomain(world: World, x: number, y: number, domain: RadioChessDomain): boolean {
  const dx = world.delta(domain.x, x);
  const dy = world.delta(domain.y, y);
  return dx >= 0 && dy >= 0 && dx < domain.w && dy < domain.h;
}

function domainAt(world: World, x: number, y: number, cache: RadioChessCache): RadioChessDomain | undefined {
  const roomId = world.roomMap[world.idx(x, y)];
  for (const domain of cache.domains) {
    if (domain.roomId === roomId || inDomain(world, x, y, domain)) return domain;
  }
  return undefined;
}

function nearestActiveBeacon(
  world: World,
  x: number,
  y: number,
  cache: RadioChessCache,
  runtime: RadioChessRuntime,
): RadioChessBeacon | undefined {
  let best: RadioChessBeacon | undefined;
  let bestD2 = Infinity;
  for (const beacon of cache.beacons) {
    if (runtime.disabledBeacons.has(beacon.idx)) continue;
    const d2 = world.dist2(x + 0.5, y + 0.5, beacon.x + 0.5, beacon.y + 0.5);
    if (d2 >= bestD2) continue;
    bestD2 = d2;
    best = beacon;
  }
  return best;
}

export function radioChessPhaseDanger(
  x: number,
  y: number,
  phaseIndex: number,
  seed: number,
  beaconX: number,
  beaconY: number,
): boolean {
  const phase = PHASES[((phaseIndex % PHASES.length) + PHASES.length) % PHASES.length];
  const parity = (x + y + seed) & 1;
  if (phase === 'white') return parity !== 0;
  if (phase === 'black') return parity !== 1;
  if (phase === 'file') return Math.abs(x + seed) % 4 !== 0;
  if (phase === 'rank') return Math.abs(y + (seed >> 3)) % 4 !== 0;

  const dx = Math.abs(x - beaconX) % 6;
  const dy = Math.abs(y - beaconY) % 6;
  return !((dx === 1 && dy === 2) || (dx === 2 && dy === 1) || (dx === 4 && dy === 5) || (dx === 5 && dy === 4));
}

function playerCellDanger(world: World, player: Entity, state: GameState): { dangerous: boolean; phaseIndex: number; active: boolean } {
  const cache = cacheFor(world);
  const runtime = runtimeFor(state);
  if (cache.domains.length === 0 || cache.beacons.length === 0 || runtime.disabledBeacons.size >= cache.beacons.length) {
    return { dangerous: false, phaseIndex: 0, active: false };
  }

  const x = world.wrap(Math.floor(player.x));
  const y = world.wrap(Math.floor(player.y));
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return { dangerous: false, phaseIndex: 0, active: false };
  if (!domainAt(world, x, y, cache)) return { dangerous: false, phaseIndex: 0, active: true };
  const beacon = nearestActiveBeacon(world, x, y, cache, runtime);
  if (!beacon) return { dangerous: false, phaseIndex: 0, active: false };

  const phaseIndex = phaseIndexAt(state.time, cache.seed);
  return {
    dangerous: radioChessPhaseDanger(
      x,
      y,
      phaseIndex,
      cache.seed,
      x + Math.round(world.delta(x, beacon.x)),
      y + Math.round(world.delta(y, beacon.y)),
    ),
    phaseIndex,
    active: true,
  };
}

export function updateRadioChessAnomaly(world: World, player: Entity, state: GameState, dt: number): void {
  if (player.type !== EntityType.PLAYER) return;
  const cache = cacheFor(world);
  if (cache.domains.length === 0) return;
  const runtime = runtimeFor(state);
  const phaseIndex = phaseIndexAt(state.time, cache.seed);
  const phase = PHASES[phaseIndex % PHASES.length];
  if (phaseIndex !== runtime.lastPhase) {
    runtime.lastPhase = phaseIndex;
    state.msgs.push(msg(`Радио: можно ${phaseName(phase)}.`, state.time, '#dd8'));
  }

  runtime.tickAccum += dt;
  if (runtime.tickAccum < PRESSURE_TICK_SECONDS) return;
  runtime.tickAccum -= PRESSURE_TICK_SECONDS;

  const status = playerCellDanger(world, player, state);
  const cell = world.idx(Math.floor(player.x), Math.floor(player.y));
  if (!status.active || !status.dangerous) {
    runtime.lastCell = cell;
    return;
  }

  const movedOntoDanger = runtime.lastCell !== cell;
  runtime.lastCell = cell;
  const hpLoss = movedOntoDanger ? 3 : 1;
  player.hp = Math.max(1, (player.hp ?? 100) - hpLoss);
  if (player.needs) player.needs.sleep = Math.max(0, player.needs.sleep - (movedOntoDanger ? 0.9 : 0.25));
  if (state.time - runtime.lastMsgTime > 3.5) {
    runtime.lastMsgTime = state.time;
    state.msgs.push(msg(movedOntoDanger ? `Пол дал шах: -${hpLoss} HP.` : 'Шах держит подошвы.', state.time, '#fa6'));
  }
}

export function tryUseRadioChessAnomaly(
  world: World,
  player: Entity,
  state: GameState,
  lookX: number,
  lookY: number,
): boolean {
  const cache = cacheFor(world);
  if (cache.beacons.length === 0) return false;
  const runtime = runtimeFor(state);
  let target: RadioChessBeacon | undefined;
  for (const beacon of cache.beacons) {
    if (world.dist2(lookX, lookY, beacon.x + 0.5, beacon.y + 0.5) > 3.4) continue;
    if (world.dist2(player.x, player.y, beacon.x + 0.5, beacon.y + 0.5) > 8.5) continue;
    target = beacon;
    break;
  }
  if (!target) return false;

  if (runtime.disabledBeacons.has(target.idx)) {
    runtime.disabledBeacons.delete(target.idx);
    world.features[target.idx] = Feature.APPARATUS;
    state.msgs.push(msg('Маяк снова читает доску.', state.time, '#dd8'));
  } else {
    runtime.disabledBeacons.add(target.idx);
    world.features[target.idx] = Feature.MACHINE;
    state.msgs.push(msg('Маяк выключен. Клетки рядом молчат.', state.time, '#8cf'));
  }
  return true;
}

/* ── BFS pathfinding + movement helpers ───────────────────────── */

import {
  W, Cell, DoorState,
  type Entity, type Msg,
  EntityType, AIGoal, RoomType,
} from '../../core/types';
import { World } from '../../core/world';
import { getCellHazardMoveMultiplier } from '../cell_hazards';
import { bark, BARK_ARRIVE, BARK_ARRIVE_F, BARK_CHANCE_ARRIVE } from './barks';

let _barkMsgs: Msg[] = [];
let _barkTime = 0;

/** Call once per frame from updateAI to set bark context for followPath arrival barks */
export function setPathContext(msgs: Msg[], time: number, samosborActive = false): void {
  _barkMsgs = msgs;
  _barkTime = time;
  beginRoutinePathBudget(time, samosborActive);
}

/* ── BFS pathfinding (toroidal, avoids closed doors) ──────────── */

const BFS_LIMIT = 800;
const PATH_CACHE_MAX = 96;
const PATH_KEY_MOD = W * W;
const ROUTINE_PATH_RATE = 18;
const ROUTINE_PATH_BURST = 10;
const ROUTINE_PATH_SAMOSBOR_RATE = 6;
const ROUTINE_PATH_SAMOSBOR_BURST = 4;
const ROUTINE_PATH_DEFER_SEC = 0.85;
const ROUTINE_PATH_FAIL_SEC = 2.5;
const ROUTINE_WANDER_ATTEMPTS = 4;
const ROUTINE_FAR_ATTEMPTS = 5;
const _bfsVisitGen = new Uint16Array(W * W);
let _bfsGen = 0;
const _bfsPrev = new Int32Array(W * W);
const _bfsQueue = new Int32Array(BFS_LIMIT);
const _pathCache = new Map<number, number[]>();
const _routinePathBackoff = new WeakMap<Entity, { target: number; until: number }>();
let _pathCacheWorld: World | null = null;
let _pathCacheCellVersion = -1;
let _pathTime = 0;
let _routinePathTokens = ROUTINE_PATH_BURST;
let _routinePathBurst = ROUTINE_PATH_BURST;
let _routinePathRate = ROUTINE_PATH_RATE;
let _routinePathLastTime = -1;
let _routinePathSamosbor = false;
let _routinePathUsed = 0;
let _routinePathDenied = 0;
let _routinePathDeferred = 0;
let _pathCacheHits = 0;

export interface PathfindingBudgetStats {
  routineUsed: number;
  routineDenied: number;
  routineDeferred: number;
  routineTokens: number;
  routineBurst: number;
  routineRate: number;
  cacheHits: number;
}

type AssignPathStatus = 'assigned' | 'same' | 'deferred' | 'not_found';

function beginRoutinePathBudget(time: number, samosborActive: boolean): void {
  _pathTime = time;
  _routinePathUsed = 0;
  _routinePathDenied = 0;
  _routinePathDeferred = 0;
  _pathCacheHits = 0;
  _pathCache.clear();
  _pathCacheWorld = null;

  const burst = samosborActive ? ROUTINE_PATH_SAMOSBOR_BURST : ROUTINE_PATH_BURST;
  const rate = samosborActive ? ROUTINE_PATH_SAMOSBOR_RATE : ROUTINE_PATH_RATE;
  if (_routinePathLastTime < 0 || time < _routinePathLastTime || samosborActive !== _routinePathSamosbor) {
    _routinePathTokens = burst;
  } else {
    _routinePathTokens = Math.min(burst, _routinePathTokens + (time - _routinePathLastTime) * rate);
  }
  _routinePathLastTime = time;
  _routinePathSamosbor = samosborActive;
  _routinePathBurst = burst;
  _routinePathRate = rate;
}

export function getPathfindingBudgetStats(): PathfindingBudgetStats {
  return {
    routineUsed: _routinePathUsed,
    routineDenied: _routinePathDenied,
    routineDeferred: _routinePathDeferred,
    routineTokens: _routinePathTokens,
    routineBurst: _routinePathBurst,
    routineRate: _routinePathRate,
    cacheHits: _pathCacheHits,
  };
}

function consumeRoutinePathBudget(e: Entity, target: number): boolean {
  if (_routinePathTokens >= 1) {
    _routinePathTokens -= 1;
    _routinePathUsed++;
    return true;
  }
  _routinePathDenied++;
  _routinePathBackoff.set(e, { target, until: _pathTime + ROUTINE_PATH_DEFER_SEC + pathJitter(e) });
  return false;
}

function pathJitter(e: Entity): number {
  return ((e.id * 17) % 11) * 0.025;
}

function pathKey(start: number, end: number): number {
  return start * PATH_KEY_MOD + end;
}

function preparePathCache(world: World): void {
  if (_pathCacheWorld === world && _pathCacheCellVersion === world.cellVersion) return;
  _pathCache.clear();
  _pathCacheWorld = world;
  _pathCacheCellVersion = world.cellVersion;
}

function readCachedPath(world: World, start: number, end: number): number[] | null {
  preparePathCache(world);
  const cached = _pathCache.get(pathKey(start, end));
  if (cached === undefined) return null;
  _pathCacheHits++;
  return cached.slice();
}

function storeCachedPath(world: World, start: number, end: number, path: number[]): void {
  preparePathCache(world);
  if (_pathCache.size >= PATH_CACHE_MAX) {
    const first = _pathCache.keys().next().value;
    if (first !== undefined) _pathCache.delete(first);
  }
  _pathCache.set(pathKey(start, end), path.slice());
}

export function bfsPath(world: World, sx: number, sy: number, ex: number, ey: number): number[] {
  sx = world.wrap(sx); sy = world.wrap(sy);
  ex = world.wrap(ex); ey = world.wrap(ey);

  if (sx === ex && sy === ey) return [];

  const start = world.idx(sx, sy);
  const end = world.idx(ex, ey);
  const cached = readCachedPath(world, start, end);
  if (cached !== null) return cached;
  const path = computeBfsPath(world, start, end);
  storeCachedPath(world, start, end, path);
  return path;
}

function computeBfsPath(world: World, start: number, end: number): number[] {
  _bfsGen = (_bfsGen + 1) & 0xFFFF;
  if (_bfsGen === 0) { _bfsGen = 1; _bfsVisitGen.fill(0); }

  _bfsVisitGen[start] = _bfsGen;
  _bfsQueue[0] = start;
  let head = 0, tail = 1;
  let found = false;

  while (head < tail && head < BFS_LIMIT) {
    const cur = _bfsQueue[head++];
    if (cur === end) { found = true; break; }

    const cx = cur % W;
    const cy = (cur / W) | 0;

    for (let d = 0; d < 4; d++) {
      let nx = cx;
      let ny = cy;
      if (d === 0) nx = cx === 0 ? W - 1 : cx - 1;
      else if (d === 1) nx = cx === W - 1 ? 0 : cx + 1;
      else if (d === 2) ny = cy === 0 ? W - 1 : cy - 1;
      else ny = cy === W - 1 ? 0 : cy + 1;
      const ni = ny * W + nx;
      if (_bfsVisitGen[ni] === _bfsGen) continue;

      const cell = world.cells[ni];
      if (cell === Cell.WALL) continue;
      if (cell === Cell.DOOR) {
        const door = world.doors.get(ni);
        if (door && (door.state === DoorState.LOCKED || door.state === DoorState.HERMETIC_CLOSED)) continue;
      }

      _bfsVisitGen[ni] = _bfsGen;
      _bfsPrev[ni] = cur;
      if (tail < BFS_LIMIT) _bfsQueue[tail++] = ni;
    }
  }

  if (!found) return [];

  const path: number[] = [];
  let c = end;
  while (c !== start) {
    path.push(c);
    c = _bfsPrev[c];
    if (_bfsVisitGen[c] !== _bfsGen && c !== start) return [];
  }
  path.reverse();
  return path;
}

function tryAssignPathToCell(world: World, e: Entity, tx: number, ty: number): AssignPathStatus {
  const ai = e.ai!;
  const sx = world.wrap(Math.floor(e.x));
  const sy = world.wrap(Math.floor(e.y));
  tx = world.wrap(tx);
  ty = world.wrap(ty);
  const start = world.idx(sx, sy);
  const target = world.idx(tx, ty);

  if (start === target) {
    ai.path = [];
    ai.pi = 0;
    ai.stuck = 0;
    ai.tx = tx;
    ai.ty = ty;
    _routinePathBackoff.delete(e);
    return 'same';
  }

  const backoff = _routinePathBackoff.get(e);
  if (backoff && backoff.target === target && backoff.until > _pathTime) {
    _routinePathDeferred++;
    return 'deferred';
  }

  let path = readCachedPath(world, start, target);
  if (path === null) {
    if (!consumeRoutinePathBudget(e, target)) return 'deferred';
    path = computeBfsPath(world, start, target);
    storeCachedPath(world, start, target, path);
  }

  if (path.length === 0) {
    ai.path = [];
    ai.pi = 0;
    _routinePathBackoff.set(e, { target, until: _pathTime + ROUTINE_PATH_FAIL_SEC + pathJitter(e) });
    return 'not_found';
  }

  ai.path = path;
  ai.pi = 0;
  ai.stuck = 0;
  ai.tx = tx;
  ai.ty = ty;
  _routinePathBackoff.delete(e);
  return 'assigned';
}

/* ── Follow path ──────────────────────────────────────────────── */
export function followPath(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.pi >= ai.path.length) {
    // Path finished — clear and roam within room if NPC
    if (ai.path.length > 0) {
      // Bark: arrived at destination (very rare)
      if (e.type === EntityType.NPC && ai.goal === AIGoal.WORK) {
        bark(e, _barkMsgs, _barkTime, BARK_ARRIVE, BARK_ARRIVE_F, BARK_CHANCE_ARRIVE, '#aac');
      }
      ai.path = []; ai.pi = 0; ai.stuck = 0;
    }
    if (e.type === EntityType.NPC && ai.goal !== AIGoal.HIDE && ai.goal !== AIGoal.FLEE) {
      ai.stuck += dt;
      if (ai.stuck > 1.5 + Math.random() * 2) {
        wanderInRoom(world, e);
        ai.stuck = 0;
      }
    }
    return;
  }

  const target = ai.path[ai.pi];
  const tx = (target % W) + 0.5;
  const ty = Math.floor(target / W) + 0.5;

  let dx = world.delta(e.x, tx);
  let dy = world.delta(e.y, ty);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.3) {
    ai.pi++;
    ai.stuck = 0;
    return;
  }

  // Open doors in the way (never open hermetic doors — they protect apartments during samosbor)
  const nextCellI = world.idx(Math.floor(tx), Math.floor(ty));
  if (world.cells[nextCellI] === Cell.DOOR) {
    const door = world.doors.get(nextCellI);
    if (door && door.state === DoorState.CLOSED) {
      door.state = DoorState.OPEN;
      door.timer = 5; // auto-close after 5s
    }
  }

  // Move toward target
  const speed = e.speed * getCellHazardMoveMultiplier(world, e) * dt;
  const nx = e.x + (dx / dist) * speed;
  const ny = e.y + (dy / dist) * speed;

  if (!world.solid(Math.floor(nx), Math.floor(e.y))) e.x = ((nx % W) + W) % W;
  if (!world.solid(Math.floor(e.x), Math.floor(ny))) e.y = ((ny % W) + W) % W;

  // Stuck detection
  ai.stuck += dt;
  if (ai.stuck > 3) {
    ai.path = [];
    ai.pi = 0;
    ai.stuck = 0;
    ai.goal = AIGoal.IDLE;
    ai.timer = 2;
  }
}

/* ── Find nearest room of type ────────────────────────────────── */
export function findNearest(world: World, e: Entity, type: RoomType): number {
  let best = -1, bestD = Infinity;
  for (const room of world.rooms) {
    if (!room || room.type !== type) continue;
    const d = world.dist2(e.x, e.y, room.x + room.w / 2, room.y + room.h / 2);
    if (d < bestD) { bestD = d; best = room.id; }
  }
  return best;
}

/* ── Find family's room of type ───────────────────────────────── */
export function findFamilyRoom(world: World, e: Entity, type: RoomType): number {
  if (e.familyId !== undefined) {
    for (const room of world.rooms) {
      if (!room || room.type !== type || room.apartmentId !== e.familyId) continue;
      return room.id;
    }
  }
  return findNearest(world, e, type);
}

/* ── Helper: set path to room center ──────────────────────────── */
export function gotoRoom(world: World, e: Entity, roomId: number): void {
  const room = world.rooms[roomId];
  if (!room) return;
  const tx = room.x + Math.floor(room.w / 2);
  const ty = room.y + Math.floor(room.h / 2);
  tryAssignPathToCell(world, e, tx, ty);
}

/* ── Helper: wander randomly nearby ───────────────────────────── */
export function wanderNearby(world: World, e: Entity): void {
  const ai = e.ai!;
  for (let attempt = 0; attempt < ROUTINE_WANDER_ATTEMPTS; attempt++) {
    const wx = Math.floor(e.x) + Math.floor(Math.random() * 20 - 10);
    const wy = Math.floor(e.y) + Math.floor(Math.random() * 20 - 10);
    const tx = world.wrap(wx);
    const ty = world.wrap(wy);
    if (world.solid(tx, ty)) continue;

    const status = tryAssignPathToCell(world, e, tx, ty);
    if (status !== 'not_found') return;
  }

  ai.path = [];
  ai.pi = 0;
}

/* ── Helper: roam randomly within the current room ────────────── */
export function wanderInRoom(world: World, e: Entity): void {
  const room = world.roomAt(e.x, e.y);
  if (!room || room.w < 3 || room.h < 3) return;
  for (let attempt = 0; attempt < ROUTINE_WANDER_ATTEMPTS; attempt++) {
    const rx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
    const ry = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
    if (!world.solid(rx, ry)) {
      const status = tryAssignPathToCell(world, e, rx, ry);
      if (status !== 'not_found') return;
    }
  }
}

/* ── Helper: wander far across the maze (for travelers) ───────── */
export function wanderFar(world: World, e: Entity): void {
  if (world.rooms.length > 0) {
    for (let attempt = 0; attempt < ROUTINE_FAR_ATTEMPTS; attempt++) {
      const room = world.rooms[Math.floor(Math.random() * world.rooms.length)];
      if (!room || room.w < 2 || room.h < 2) continue;
      const tx = room.x + Math.floor(room.w / 2);
      const ty = room.y + Math.floor(room.h / 2);
      const status = tryAssignPathToCell(world, e, tx, ty);
      if (status !== 'not_found') return;
    }
  }
  // Fallback: wander nearby
  wanderNearby(world, e);
}

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
  beginPathFrame(time, samosborActive);
}

/* ── Baked navigation tree (toroidal, ordinary doors are openable) */

const NAV_UNKNOWN = -3;
const NAV_BLOCKED = -2;
const FLOW_UNREACHED = -1;
const FLOW_BLOCKED = -2;
const PATH_CHUNK_LIMIT = 256;
const PATH_DESCEND_SEARCH_LIMIT = 2048;
const BEHAVIOR_FLOW_FIELD_CACHE_MAX = 16;
const ROUTINE_WANDER_ATTEMPTS = 4;
const ROUTINE_FAR_ATTEMPTS = 5;
const _navParent = new Int32Array(W * W);
const _navDepth = new Int32Array(W * W);
const _navComponent = new Int32Array(W * W);
const _navQueue = new Int32Array(W * W);
const _flowSourceScratch: number[] = [];
let _pathSamosborActive = false;
let _navWorld: World | null = null;
let _navCellVersion = -1;
let _navSamosborActive = false;
let _navComponents = 0;
let _navReachable = 0;
let _flowFieldTouch = 0;
let _routinePathUsed = 0;
let _routinePathDenied = 0;
let _routinePathDeferred = 0;
let _pathCacheHits = 0;
let _bfsCalls = 0;
let _bfsFound = 0;
let _bfsMiss = 0;
let _bfsLimitHits = 0;
let _bfsVisited = 0;

export type BehaviorFlowFieldSourceProvider = (world: World, out: number[]) => void;

interface BehaviorFlowField {
  key: string;
  world: World;
  cellVersion: number;
  samosborActive: boolean;
  roomCount: number;
  next: Int32Array;
  sourceCount: number;
  reachable: number;
  lastUsed: number;
}

interface FlowPathAssignment {
  key: string;
  sourceProvider: BehaviorFlowFieldSourceProvider;
}

export interface PathSteering {
  x: number;
  y: number;
  distance: number;
  nextCell: number;
  targetCell: number;
}

interface SteeringPathAssignment {
  world: World;
  cellVersion: number;
  samosborActive: boolean;
  target: number;
  path: number[];
  pi: number;
}

export interface PathfindingBudgetStats {
  routineUsed: number;
  routineDenied: number;
  routineDeferred: number;
  routineTokens: number;
  routineBurst: number;
  routineRate: number;
  cacheHits: number;
  cacheSize: number;
  bfsCalls: number;
  bfsFound: number;
  bfsMiss: number;
  bfsLimitHits: number;
  bfsVisited: number;
}

type AssignPathStatus = 'assigned' | 'same' | 'not_found';

const _behaviorFlowFields = new Map<string, BehaviorFlowField>();
const _flowPathAssignments = new WeakMap<Entity, FlowPathAssignment>();
const _steeringPathAssignments = new WeakMap<Entity, SteeringPathAssignment>();
const _roomTypeSourceProviders = new Map<string, BehaviorFlowFieldSourceProvider>();

function beginPathFrame(time: number, samosborActive: boolean): void {
  void time;
  _pathSamosborActive = samosborActive;
  _routinePathUsed = 0;
  _routinePathDenied = 0;
  _routinePathDeferred = 0;
  _pathCacheHits = 0;
  _bfsCalls = 0;
  _bfsFound = 0;
  _bfsMiss = 0;
  _bfsLimitHits = 0;
  _bfsVisited = 0;
}

export function getPathfindingBudgetStats(out?: PathfindingBudgetStats): PathfindingBudgetStats {
  const stats = out ?? {
    routineUsed: 0,
    routineDenied: 0,
    routineDeferred: 0,
    routineTokens: 0,
    routineBurst: 0,
    routineRate: 0,
    cacheHits: 0,
    cacheSize: 0,
    bfsCalls: 0,
    bfsFound: 0,
    bfsMiss: 0,
    bfsLimitHits: 0,
    bfsVisited: 0,
  };
  stats.routineUsed = _routinePathUsed;
  stats.routineDenied = _routinePathDenied;
  stats.routineDeferred = _routinePathDeferred;
  stats.routineTokens = 0;
  stats.routineBurst = 0;
  stats.routineRate = 0;
  stats.cacheHits = _pathCacheHits;
  stats.cacheSize = _navComponents;
  stats.bfsCalls = _bfsCalls;
  stats.bfsFound = _bfsFound;
  stats.bfsMiss = _bfsMiss;
  stats.bfsLimitHits = _bfsLimitHits;
  stats.bfsVisited = _bfsVisited;
  return stats;
}

export function bfsPath(world: World, sx: number, sy: number, ex: number, ey: number): number[] {
  sx = world.wrap(sx); sy = world.wrap(sy);
  ex = world.wrap(ex); ey = world.wrap(ey);

  if (sx === ex && sy === ey) return [];

  const start = world.idx(sx, sy);
  const end = world.idx(ex, ey);
  return buildBakedTreePath(world, start, end);
}

function isNavPassable(world: World, i: number): boolean {
  const cell = world.cells[i];
  if (cell === Cell.FLOOR || cell === Cell.WATER) return true;
  if (cell !== Cell.DOOR) return false;
  const door = world.doors.get(i);
  return !door || (door.state !== DoorState.LOCKED && door.state !== DoorState.HERMETIC_CLOSED);
}

function bakeNavigationTree(world: World): void {
  _bfsCalls++;
  _navParent.fill(NAV_UNKNOWN);
  _navDepth.fill(0);
  _navComponent.fill(-1);
  _navWorld = world;
  _navCellVersion = world.cellVersion;
  _navSamosborActive = _pathSamosborActive;
  _navComponents = 0;
  _navReachable = 0;

  for (let root = 0; root < W * W; root++) {
    if (_navParent[root] !== NAV_UNKNOWN) continue;
    if (!isNavPassable(world, root)) {
      _navParent[root] = NAV_BLOCKED;
      continue;
    }

    const componentId = _navComponents++;
    _navParent[root] = root;
    _navComponent[root] = componentId;
    _navDepth[root] = 0;
    _navQueue[0] = root;
    let head = 0;
    let tail = 1;

    while (head < tail) {
      const cur = _navQueue[head++];
      const cx = cur % W;
      const cy = (cur / W) | 0;
      const west = cy * W + (cx === 0 ? W - 1 : cx - 1);
      const east = cy * W + (cx === W - 1 ? 0 : cx + 1);
      const north = (cy === 0 ? W - 1 : cy - 1) * W + cx;
      const south = (cy === W - 1 ? 0 : cy + 1) * W + cx;
      tail = visitNavNeighbor(world, west, cur, componentId, tail);
      tail = visitNavNeighbor(world, east, cur, componentId, tail);
      tail = visitNavNeighbor(world, north, cur, componentId, tail);
      tail = visitNavNeighbor(world, south, cur, componentId, tail);
    }
    _navReachable += tail;
  }

  _bfsVisited += _navReachable;
}

function visitNavNeighbor(world: World, cell: number, parent: number, componentId: number, tail: number): number {
  if (_navParent[cell] !== NAV_UNKNOWN) return tail;
  if (!isNavPassable(world, cell)) {
    _navParent[cell] = NAV_BLOCKED;
    return tail;
  }
  _navParent[cell] = parent;
  _navDepth[cell] = _navDepth[parent] + 1;
  _navComponent[cell] = componentId;
  _navQueue[tail] = cell;
  return tail + 1;
}

function ensureNavigationTree(world: World): void {
  if (_navWorld === world && _navCellVersion === world.cellVersion && _navSamosborActive === _pathSamosborActive) {
    _pathCacheHits++;
    return;
  }
  bakeNavigationTree(world);
}

function flowFieldValid(field: BehaviorFlowField, world: World): boolean {
  return field.world === world &&
    field.cellVersion === world.cellVersion &&
    field.samosborActive === _pathSamosborActive &&
    field.roomCount === world.rooms.length;
}

function ensureBehaviorFlowField(
  world: World,
  key: string,
  sourceProvider: BehaviorFlowFieldSourceProvider,
): BehaviorFlowField | null {
  const cached = _behaviorFlowFields.get(key);
  if (cached && flowFieldValid(cached, world)) {
    cached.lastUsed = ++_flowFieldTouch;
    _pathCacheHits++;
    return cached;
  }

  _flowSourceScratch.length = 0;
  sourceProvider(world, _flowSourceScratch);
  if (_flowSourceScratch.length === 0) {
    _behaviorFlowFields.delete(key);
    return null;
  }

  const next = cached?.next ?? new Int32Array(W * W);
  next.fill(FLOW_UNREACHED);
  let head = 0;
  let tail = 0;
  for (const source of _flowSourceScratch) {
    if (source < 0 || source >= W * W) continue;
    if (next[source] === source) continue;
    if (!isNavPassable(world, source)) continue;
    next[source] = source;
    _navQueue[tail++] = source;
  }

  while (head < tail) {
    const cur = _navQueue[head++];
    const cx = cur % W;
    const cy = (cur / W) | 0;
    const west = cy * W + (cx === 0 ? W - 1 : cx - 1);
    const east = cy * W + (cx === W - 1 ? 0 : cx + 1);
    const north = (cy === 0 ? W - 1 : cy - 1) * W + cx;
    const south = (cy === W - 1 ? 0 : cy + 1) * W + cx;
    tail = visitFlowNeighbor(world, next, west, cur, tail);
    tail = visitFlowNeighbor(world, next, east, cur, tail);
    tail = visitFlowNeighbor(world, next, north, cur, tail);
    tail = visitFlowNeighbor(world, next, south, cur, tail);
  }

  _bfsCalls++;
  _bfsVisited += tail;
  const field: BehaviorFlowField = {
    key,
    world,
    cellVersion: world.cellVersion,
    samosborActive: _pathSamosborActive,
    roomCount: world.rooms.length,
    next,
    sourceCount: _flowSourceScratch.length,
    reachable: tail,
    lastUsed: ++_flowFieldTouch,
  };
  _behaviorFlowFields.set(key, field);
  trimBehaviorFlowFieldCache();
  return field;
}

function visitFlowNeighbor(world: World, next: Int32Array, cell: number, parent: number, tail: number): number {
  if (next[cell] !== FLOW_UNREACHED) return tail;
  if (!isNavPassable(world, cell)) {
    next[cell] = FLOW_BLOCKED;
    return tail;
  }
  next[cell] = parent;
  _navQueue[tail] = cell;
  return tail + 1;
}

function trimBehaviorFlowFieldCache(): void {
  while (_behaviorFlowFields.size > BEHAVIOR_FLOW_FIELD_CACHE_MAX) {
    let oldestKey = '';
    let oldestUsed = Infinity;
    for (const field of _behaviorFlowFields.values()) {
      if (field.lastUsed >= oldestUsed) continue;
      oldestUsed = field.lastUsed;
      oldestKey = field.key;
    }
    if (!oldestKey) return;
    _behaviorFlowFields.delete(oldestKey);
  }
}

function buildBakedTreePath(world: World, start: number, end: number): number[] {
  ensureNavigationTree(world);
  if (start === end) return [];
  if (_navParent[start] < 0 || _navParent[end] < 0 || _navComponent[start] !== _navComponent[end]) {
    _bfsMiss++;
    return [];
  }

  let a = start;
  let b = end;
  const forward: number[] = [];
  const reverse: number[] = [];

  let descendSearch = 0;
  while (_navDepth[b] > _navDepth[a] && descendSearch < PATH_DESCEND_SEARCH_LIMIT) {
    reverse.push(b);
    b = _navParent[b];
    descendSearch++;
  }

  if (_navDepth[b] > _navDepth[a]) {
    const path = climbFromStart(start);
    if (path.length > 0) _bfsFound++;
    else _bfsMiss++;
    _bfsLimitHits++;
    return path;
  }

  if (a === b) {
    for (let i = reverse.length - 1; i >= 0 && forward.length < PATH_CHUNK_LIMIT; i--) {
      forward.push(reverse[i]);
    }
    if (forward.length > 0) _bfsFound++;
    else _bfsMiss++;
    if (reverse.length > PATH_CHUNK_LIMIT) _bfsLimitHits++;
    return forward;
  }

  while (_navDepth[a] > _navDepth[b] && forward.length < PATH_CHUNK_LIMIT) {
    a = _navParent[a];
    forward.push(a);
  }
  while (a !== b && forward.length < PATH_CHUNK_LIMIT) {
    a = _navParent[a];
    forward.push(a);
    reverse.push(b);
    b = _navParent[b];
  }

  let chunked = false;
  if (a === b) {
    chunked = forward.length + reverse.length > PATH_CHUNK_LIMIT;
    for (let i = reverse.length - 1; i >= 0 && forward.length < PATH_CHUNK_LIMIT; i--) {
      forward.push(reverse[i]);
    }
  } else {
    chunked = true;
  }
  if (forward.length > 0) _bfsFound++;
  else _bfsMiss++;
  if (chunked) _bfsLimitHits++;
  return forward;
}

function climbFromStart(start: number): number[] {
  const path: number[] = [];
  let cell = start;
  while (path.length < PATH_CHUNK_LIMIT) {
    const parent = _navParent[cell];
    if (parent < 0 || parent === cell) break;
    path.push(parent);
    cell = parent;
  }
  return path;
}

function buildFlowFieldPath(field: BehaviorFlowField, start: number): number[] {
  let cell = start;
  const path: number[] = [];
  while (path.length < PATH_CHUNK_LIMIT) {
    const next = field.next[cell];
    if (next < 0) break;
    if (next === cell) break;
    path.push(next);
    cell = next;
  }
  if (path.length > 0) _bfsFound++;
  else _bfsMiss++;
  if (path.length >= PATH_CHUNK_LIMIT) _bfsLimitHits++;
  return path;
}

export function tryAssignBehaviorFlowPath(
  world: World,
  e: Entity,
  key: string,
  sourceProvider: BehaviorFlowFieldSourceProvider,
): AssignPathStatus {
  const ai = e.ai!;
  const sx = world.wrap(Math.floor(e.x));
  const sy = world.wrap(Math.floor(e.y));
  const start = world.idx(sx, sy);
  const field = ensureBehaviorFlowField(world, key, sourceProvider);
  if (!field || field.next[start] < 0) {
    ai.path = [];
    ai.pi = 0;
    _flowPathAssignments.delete(e);
    return 'not_found';
  }

  const path = buildFlowFieldPath(field, start);
  if (path.length === 0) {
    ai.path = [];
    ai.pi = 0;
    ai.stuck = 0;
    ai.tx = sx;
    ai.ty = sy;
    _flowPathAssignments.delete(e);
    return 'same';
  }

  const target = path[path.length - 1];
  ai.path = path;
  ai.pi = 0;
  ai.stuck = 0;
  ai.tx = target % W;
  ai.ty = (target / W) | 0;
  _flowPathAssignments.set(e, { key, sourceProvider });
  return 'assigned';
}

function continueBehaviorFlowPath(world: World, e: Entity): AssignPathStatus {
  const flow = _flowPathAssignments.get(e);
  if (!flow) return 'not_found';
  return tryAssignBehaviorFlowPath(world, e, flow.key, flow.sourceProvider);
}

export function tryAssignPathToCell(world: World, e: Entity, tx: number, ty: number): AssignPathStatus {
  const ai = e.ai!;
  _flowPathAssignments.delete(e);
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
    return 'same';
  }

  const path = buildBakedTreePath(world, start, target);

  if (path.length === 0) {
    ai.path = [];
    ai.pi = 0;
    ai.tx = tx;
    ai.ty = ty;
    return 'not_found';
  }

  ai.path = path;
  ai.pi = 0;
  ai.stuck = 0;
  ai.tx = tx;
  ai.ty = ty;
  return 'assigned';
}

function openPathDoor(world: World, cell: number): void {
  if (world.cells[cell] !== Cell.DOOR) return;
  const door = world.doors.get(cell);
  if (door && door.state === DoorState.CLOSED) {
    door.state = DoorState.OPEN;
    door.timer = 5;
  }
}

function validSteeringAssignment(assignment: SteeringPathAssignment, world: World, target: number): boolean {
  return assignment.world === world &&
    assignment.cellVersion === world.cellVersion &&
    assignment.samosborActive === _pathSamosborActive &&
    assignment.target === target;
}

export function clearEntitySteeringPath(e: Entity): void {
  _steeringPathAssignments.delete(e);
}

export function steerEntityTowardCell(world: World, e: Entity, tx: number, ty: number): PathSteering | null {
  const sx = world.wrap(Math.floor(e.x));
  const sy = world.wrap(Math.floor(e.y));
  tx = world.wrap(tx);
  ty = world.wrap(ty);
  const start = world.idx(sx, sy);
  const target = world.idx(tx, ty);
  const targetX = tx + 0.5;
  const targetY = ty + 0.5;
  const targetDistance = world.dist(e.x, e.y, targetX, targetY);
  if (start === target || targetDistance < 0.35) {
    _steeringPathAssignments.delete(e);
    return null;
  }

  let assignment = _steeringPathAssignments.get(e);
  if (!assignment || !validSteeringAssignment(assignment, world, target) || assignment.pi >= assignment.path.length) {
    const path = buildBakedTreePath(world, start, target);
    if (path.length === 0) {
      _steeringPathAssignments.delete(e);
      return null;
    }
    assignment = {
      world,
      cellVersion: world.cellVersion,
      samosborActive: _pathSamosborActive,
      target,
      path,
      pi: 0,
    };
    _steeringPathAssignments.set(e, assignment);
  }

  while (assignment.pi < assignment.path.length) {
    const cell = assignment.path[assignment.pi];
    const cx = (cell % W) + 0.5;
    const cy = ((cell / W) | 0) + 0.5;
    if (world.dist(e.x, e.y, cx, cy) >= 0.3) break;
    assignment.pi++;
  }

  if (assignment.pi >= assignment.path.length) {
    const path = buildBakedTreePath(world, start, target);
    if (path.length === 0) {
      _steeringPathAssignments.delete(e);
      return null;
    }
    assignment.path = path;
    assignment.pi = 0;
    assignment.cellVersion = world.cellVersion;
    assignment.samosborActive = _pathSamosborActive;
  }

  const nextCell = assignment.path[assignment.pi];
  openPathDoor(world, nextCell);
  const nextX = (nextCell % W) + 0.5;
  const nextY = ((nextCell / W) | 0) + 0.5;
  const dx = world.delta(e.x, nextX);
  const dy = world.delta(e.y, nextY);
  const stepDistance = Math.sqrt(dx * dx + dy * dy);
  if (stepDistance < 0.01) return null;
  return {
    x: dx / stepDistance,
    y: dy / stepDistance,
    distance: targetDistance,
    nextCell,
    targetCell: target,
  };
}

function canActorOccupy(world: World, x: number, y: number, r: number): boolean {
  return !world.solid(Math.floor(x + r), Math.floor(y + r)) &&
    !world.solid(Math.floor(x + r), Math.floor(y - r)) &&
    !world.solid(Math.floor(x - r), Math.floor(y + r)) &&
    !world.solid(Math.floor(x - r), Math.floor(y - r));
}

/* ── Follow path ──────────────────────────────────────────────── */
export function followPath(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.pi >= ai.path.length) {
    if (ai.path.length > 0) {
      const current = world.idx(Math.floor(e.x), Math.floor(e.y));
      const destination = world.idx(Math.floor(ai.tx), Math.floor(ai.ty));
      ai.path = []; ai.pi = 0; ai.stuck = 0;
      if (_flowPathAssignments.has(e)) {
        const status = continueBehaviorFlowPath(world, e);
        if (status === 'assigned') return;
      }
      if (current !== destination) {
        const status = tryAssignPathToCell(world, e, ai.tx, ai.ty);
        if (status === 'assigned') return;
      }
      // Bark: arrived at destination (very rare)
      if (e.type === EntityType.NPC && ai.goal === AIGoal.WORK) {
        bark(e, _barkMsgs, _barkTime, BARK_ARRIVE, BARK_ARRIVE_F, BARK_CHANCE_ARRIVE, '#aac');
      }
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
  openPathDoor(world, nextCellI);

  // Move toward target
  const speed = e.speed * getCellHazardMoveMultiplier(world, e) * dt;
  const nx = e.x + (dx / dist) * speed;
  const ny = e.y + (dy / dist) * speed;
  const r = e.type === EntityType.MONSTER ? 0.18 : 0.16;
  let moved = false;

  if (canActorOccupy(world, nx, e.y, r)) {
    e.x = ((nx % W) + W) % W;
    moved = true;
  }
  if (canActorOccupy(world, e.x, ny, r)) {
    e.y = ((ny % W) + W) % W;
    moved = true;
  }

  // Stuck detection
  ai.stuck = moved ? Math.max(0, ai.stuck - dt * 2) : ai.stuck + dt;
  if (ai.stuck > 3) {
    ai.path = [];
    ai.pi = 0;
    ai.stuck = 0;
    ai.goal = AIGoal.IDLE;
    ai.timer = 2;
  }
}

/* ── Find nearest room of type ────────────────────────────────── */
interface RoomTypeCache {
  cellVersion: number;
  roomCount: number;
  roomsByType: Map<RoomType, number[]>;
}

const roomTypeCaches = new WeakMap<World, RoomTypeCache>();

function roomsOfType(world: World, type: RoomType): number[] {
  let cache = roomTypeCaches.get(world);
  if (!cache || cache.cellVersion !== world.cellVersion || cache.roomCount !== world.rooms.length) {
    const roomsByType = new Map<RoomType, number[]>();
    for (const room of world.rooms) {
      if (!room) continue;
      let ids = roomsByType.get(room.type);
      if (!ids) {
        ids = [];
        roomsByType.set(room.type, ids);
      }
      ids.push(room.id);
    }
    cache = { cellVersion: world.cellVersion, roomCount: world.rooms.length, roomsByType };
    roomTypeCaches.set(world, cache);
  }
  return cache.roomsByType.get(type) ?? [];
}

export function findNearest(world: World, e: Entity, type: RoomType): number {
  let best = -1, bestD = Infinity;
  for (const roomId of roomsOfType(world, type)) {
    const room = world.rooms[roomId];
    if (!room) continue;
    const d = world.dist2(e.x, e.y, room.x + room.w / 2, room.y + room.h / 2);
    if (d < bestD) { bestD = d; best = room.id; }
  }
  return best;
}

function roomTypeFieldKey(types: readonly RoomType[]): string {
  const unique = [...new Set(types)].sort((a, b) => a - b);
  return `room:${unique.join(',')}`;
}

function roomTypeSourceProvider(types: readonly RoomType[]): BehaviorFlowFieldSourceProvider {
  const unique = [...new Set(types)].sort((a, b) => a - b);
  const key = roomTypeFieldKey(unique);
  const cached = _roomTypeSourceProviders.get(key);
  if (cached) return cached;
  const provider = (world: World, out: number[]): void => {
    for (const type of unique) {
      for (const roomId of roomsOfType(world, type)) {
        const room = world.rooms[roomId];
        if (!room) continue;
        for (let dy = 0; dy < room.h; dy++) {
          for (let dx = 0; dx < room.w; dx++) {
            const x = world.wrap(room.x + dx);
            const y = world.wrap(room.y + dy);
            const idx = y * W + x;
            if (isNavPassable(world, idx)) out.push(idx);
          }
        }
      }
    }
  };
  _roomTypeSourceProviders.set(key, provider);
  return provider;
}

export function gotoNearestRoomType(world: World, e: Entity, type: RoomType): boolean {
  return gotoNearestRoomOfTypes(world, e, [type]);
}

export function gotoNearestRoomOfTypes(world: World, e: Entity, types: readonly RoomType[]): boolean {
  if (types.length === 0) return false;
  const key = roomTypeFieldKey(types);
  const status = tryAssignBehaviorFlowPath(world, e, key, roomTypeSourceProvider(types));
  return status !== 'not_found';
}

/* ── Find family's room of type ───────────────────────────────── */
export function findFamilyRoom(world: World, e: Entity, type: RoomType): number {
  if (e.familyId !== undefined) {
    for (const roomId of roomsOfType(world, type)) {
      const room = world.rooms[roomId];
      if (!room || room.apartmentId !== e.familyId) continue;
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

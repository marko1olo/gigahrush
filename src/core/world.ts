/* ── Toroidal world grid ──────────────────────────────────────── */

import {
  W, Cell, DoorState, Feature,
  type RailTrain,
  type RailTrainTrack,
  type Room,
  type Door,
  type Zone,
  type WorldContainer,
} from './types';
import { stampMark, MarkType } from '../render/marks';

export interface WorldGenerationLike {
  world: World;
}

export type ReachabilityReason =
  | 'open'
  | 'water'
  | 'door_open'
  | 'door_closed'
  | 'door_locked'
  | 'door_hermetic_open'
  | 'door_hermetic_closed'
  | 'door_missing'
  | 'lift'
  | 'wall'
  | 'abyss'
  | 'blocked';

export const REACH_GATE_NONE = 0;
export const REACH_GATE_KEY = 1 << 0;
export const REACH_GATE_HERMETIC = 1 << 1;
export const REACH_UNREACHED = 255;

export interface ReachabilityCell {
  passable: boolean;
  reason: ReachabilityReason;
  gateMask: number;
}

export type ReachabilityReasonCounts = Partial<Record<ReachabilityReason, number>>;

export interface ReachabilityAudit {
  reachable: Uint8Array;
  gateMask: Uint8Array;
  reasonCounts: ReachabilityReasonCounts;
}

function nextVersion(version: number): number {
  return (version + 1) | 0;
}

function markWorldReplaced(world: World, versions: {
  cellVersion: number;
  surfaceVersion: number;
  wallTexVersion: number;
  floorTexVersion: number;
  fogVersion: number;
}): void {
  world.cellVersion = nextVersion(versions.cellVersion);
  world.surfaceVersion = nextVersion(versions.surfaceVersion);
  world.wallTexVersion = nextVersion(versions.wallTexVersion);
  world.floorTexVersion = nextVersion(versions.floorTexVersion);
  world.fogVersion = nextVersion(versions.fogVersion);
}

export class World {
  cells:     Uint8Array;
  roomMap:   Int16Array;   // room id per cell (-1 = none)
  wallTex:   Uint8Array;
  floorTex:  Uint8Array;
  features:  Uint8Array;   // Feature enum per cell
  light:     Float32Array; // lightmap 0..1 per cell
  rooms:     Room[]  = [];
  doors:     Map<number, Door> = new Map();
  apartmentRoomCount = 0;          // first N rooms are permanent apartments
  aptMask:   Uint8Array;           // 1 = protected apartment cell (interior + wall ring)
  hermoWall: Uint8Array;           // 1 = unbreakable hermetic shelter wall
  zones:     Zone[] = [];          // 64 macro-regions
  zoneMap:   Uint8Array;           // zone id per cell (0-63)
  factionControl: Uint8Array;      // per-cell faction control (ZoneFaction enum)
  fog:       Uint8Array;           // purple fog density per cell (0 = clear, 255 = full)
  slideCells: number[] = [];       // cell indices of slide walls (cycle textures)
  screenCells: number[] = [];      // cell indices of procedural screen/TV walls
  surfaceMap: Map<number, Uint8Array> = new Map(); // sparse RGBA canvas, 16×16×4 per cell (floors + walls)
  anomalyTeleports: Map<number, number> = new Map(); // rare floor-anomaly cell links
  anomalySmogSource = -1;       // procedural smog source cell, -1 = none
  anomalySmogCells: number[] = []; // bounded cells affected by procedural smog
  anomalySmogHandled = false;
  railTracks: RailTrainTrack[] = [];
  railTrains: RailTrain[] = [];
  railTrainCells: Map<number, number> = new Map(); // cell idx -> train index
  cellVersion = 0;                 // bumped when runtime cell solidity changes
  surfaceVersion = 0;              // bumped when surfaceMap pixels change
  wallTexVersion = 0;              // bumped when runtime wall texture data changes
  floorTexVersion = 0;             // bumped when runtime floor texture data changes
  fogVersion = 0;                  // bumped when runtime fog data changes
  liftDir:   Uint8Array;           // LiftDirection per cell (only meaningful where cells[i] === Cell.LIFT)
  containers: WorldContainer[] = [];
  containerMap: Map<number, number[]> = new Map(); // cell idx -> container ids
  containerById: Map<number, WorldContainer> = new Map();

  constructor() {
    const n = W * W;
    this.cells    = new Uint8Array(n).fill(Cell.WALL);
    this.roomMap  = new Int16Array(n).fill(-1);
    this.wallTex  = new Uint8Array(n);
    this.floorTex = new Uint8Array(n);
    this.features = new Uint8Array(n);              // Feature.NONE = 0
    this.light    = new Float32Array(n);            // 0 = dark
    this.aptMask  = new Uint8Array(n);              // 0 = volatile, 1 = apartment-protected
    this.hermoWall = new Uint8Array(n);             // 0 = normal, 1 = unbreakable wall
    this.zoneMap  = new Uint8Array(n);              // zone id
    this.factionControl = new Uint8Array(n);        // per-cell faction (ZoneFaction)
    this.fog      = new Uint8Array(n);              // fog density
    this.liftDir  = new Uint8Array(n);              // LiftDirection (0=DOWN, 1=UP)
  }

  addContainer(container: WorldContainer): void {
    this.containers.push(container);
    this.containerById.set(container.id, container);
    const i = this.idx(container.x, container.y);
    const ids = this.containerMap.get(i);
    if (ids) ids.push(container.id);
    else this.containerMap.set(i, [container.id]);
  }

  rebuildContainerMap(): void {
    this.containerMap.clear();
    this.containerById.clear();
    for (const c of this.containers) {
      this.containerById.set(c.id, c);
      const i = this.idx(c.x, c.y);
      const ids = this.containerMap.get(i);
      if (ids) ids.push(c.id);
      else this.containerMap.set(i, [c.id]);
    }
  }

  containersAt(x: number, y: number): WorldContainer[] {
    const ids = this.containerMap.get(this.idx(x, y));
    if (!ids) return [];
    const out: WorldContainer[] = [];
    for (const id of ids) {
      const c = this.containerById.get(id);
      if (c) out.push(c);
    }
    return out;
  }

  /* rebuild lightmap from lamp features */
  bakeLights(): void {
    this.light.fill(0);
    const R = 8;  // lamp radius in cells
    for (let i = 0; i < W * W; i++) {
      if (this.features[i] !== Feature.LAMP && this.features[i] !== Feature.CANDLE) continue;
      const lx = i % W;
      const ly = (i / W) | 0;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const d2 = dx * dx + dy * dy;
          if (d2 > R * R) continue;
          const wx = this.wrap(lx + dx);
          const wy = this.wrap(ly + dy);
          const ti = wy * W + wx;
          const brightness = 1.0 - Math.sqrt(d2) / R;
          if (brightness > this.light[ti]) this.light[ti] = brightness;
        }
      }
    }
  }

  /* toroidal helpers */
  wrap(v: number): number { return ((v % W) + W) % W; }

  idx(x: number, y: number): number {
    return this.wrap(y) * W + this.wrap(x);
  }

  get(x: number, y: number): number {
    return this.cells[this.idx(x, y)];
  }

  set(x: number, y: number, v: Cell): void {
    this.cells[this.idx(x, y)] = v;
  }

  markWallTexDirty(): void { this.wallTexVersion = (this.wallTexVersion + 1) | 0; }

  markCellsDirty(): void { this.cellVersion = (this.cellVersion + 1) | 0; }

  markFloorTexDirty(): void { this.floorTexVersion = (this.floorTexVersion + 1) | 0; }

  markFogDirty(): void { this.fogVersion = (this.fogVersion + 1) | 0; }

  solid(x: number, y: number): boolean {
    const i = this.idx(x, y);
    const c = this.cells[i];
    if (c === Cell.FLOOR || c === Cell.WATER) return false;
    if (c === Cell.LIFT) return true;  // lift wall — interact to use
    if (c === Cell.DOOR) {
      const d = this.doors.get(i);
      if (!d) return true;
      return d.state === DoorState.CLOSED
          || d.state === DoorState.LOCKED
          || d.state === DoorState.HERMETIC_CLOSED;
    }
    return true;
  }

  /* toroidal shortest displacement from a→b */
  delta(a: number, b: number): number {
    let d = b - a;
    if (d >  W / 2) d -= W;
    if (d < -W / 2) d += W;
    return d;
  }

  dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = this.delta(x1, x2);
    const dy = this.delta(y1, y2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  dist2(x1: number, y1: number, x2: number, y2: number): number {
    const dx = this.delta(x1, x2);
    const dy = this.delta(y1, y2);
    return dx * dx + dy * dy;
  }

  roomAt(x: number, y: number): Room | null {
    const id = this.roomMap[this.idx(Math.floor(x), Math.floor(y))];
    return id >= 0 ? this.rooms[id] ?? null : null;
  }

  /* Compatibility stamp — delegates to the procedural mark system.
     Kept for callers that use the compact (cx, cy, fx, fy, radius, intensity, seed, r, g, b, wallOk) signature.
     Uses MarkType.SPLAT for general blobs, which produces organic irregular shapes. */
  stamp(cx: number, cy: number, fx: number, fy: number, radius: number, intensity: number, seed: number, cr: number, cg: number, cb: number, wallOk = false): void {
    stampMark(this, cx, cy, fx, fy, radius, MarkType.SPLAT, seed, cr, cg, cb, intensity, wallOk);
  }

  /* carve a floor cell */
  carve(x: number, y: number): void {
    this.set(x, y, Cell.FLOOR);
  }

  /* carve rectangle */
  carveRect(rx: number, ry: number, rw: number, rh: number, roomId: number): void {
    for (let dy = 0; dy < rh; dy++) {
      for (let dx = 0; dx < rw; dx++) {
        const wx = this.wrap(rx + dx);
        const wy = this.wrap(ry + dy);
        const i = wy * W + wx;
        this.cells[i] = Cell.FLOOR;
        this.roomMap[i] = roomId;
      }
    }
  }
}

export function classifyReachabilityCell(world: World, idx: number): ReachabilityCell {
  const cell = world.cells[idx];
  if (cell === Cell.FLOOR) return { passable: true, reason: 'open', gateMask: REACH_GATE_NONE };
  if (cell === Cell.WATER) return { passable: true, reason: 'water', gateMask: REACH_GATE_NONE };
  if (cell === Cell.LIFT) return { passable: false, reason: 'lift', gateMask: REACH_GATE_NONE };
  if (cell === Cell.WALL) return { passable: false, reason: 'wall', gateMask: REACH_GATE_NONE };
  if (cell === Cell.ABYSS) return { passable: false, reason: 'abyss', gateMask: REACH_GATE_NONE };
  if (cell !== Cell.DOOR) return { passable: false, reason: 'blocked', gateMask: REACH_GATE_NONE };

  const door = world.doors.get(idx);
  if (!door) return { passable: false, reason: 'door_missing', gateMask: REACH_GATE_NONE };
  if (door.state === DoorState.OPEN) return { passable: true, reason: 'door_open', gateMask: REACH_GATE_NONE };
  if (door.state === DoorState.CLOSED) return { passable: true, reason: 'door_closed', gateMask: REACH_GATE_NONE };
  if (door.state === DoorState.LOCKED) return { passable: true, reason: 'door_locked', gateMask: REACH_GATE_KEY };
  if (door.state === DoorState.HERMETIC_OPEN) return { passable: true, reason: 'door_hermetic_open', gateMask: REACH_GATE_NONE };
  return { passable: true, reason: 'door_hermetic_closed', gateMask: REACH_GATE_HERMETIC };
}

function reachabilityGateRank(mask: number): number {
  if (mask === REACH_GATE_NONE) return 0;
  if (mask === REACH_GATE_KEY) return 1;
  if (mask === REACH_GATE_HERMETIC) return 2;
  if (mask === REACH_UNREACHED) return 4;
  return 3;
}

export function reachabilityGateLabel(mask: number): string {
  if (mask === REACH_UNREACHED) return 'unreachable';
  if (mask === REACH_GATE_NONE) return 'reachable';
  if (mask === REACH_GATE_KEY) return 'gated by key';
  if (mask === REACH_GATE_HERMETIC) return 'gated by hermetic door';
  return 'gated by key and hermetic door';
}

export function auditReachability(world: World, startIdx: number): ReachabilityAudit {
  const n = W * W;
  const reachable = new Uint8Array(n);
  const gateMask = new Uint8Array(n).fill(REACH_UNREACHED);
  const reasonCounts: ReachabilityReasonCounts = {};
  const queues: number[][] = [[], [], [], []];
  const heads = [0, 0, 0, 0];

  const start = classifyReachabilityCell(world, startIdx);
  if (!start.passable) return { reachable, gateMask, reasonCounts };

  reachable[startIdx] = 1;
  gateMask[startIdx] = start.gateMask;
  reasonCounts[start.reason] = 1;
  queues[reachabilityGateRank(start.gateMask)].push(startIdx);

  for (let rank = 0; rank < queues.length; rank++) {
    while (heads[rank] < queues[rank].length) {
      const ci = queues[rank][heads[rank]++];
      const currentGate = gateMask[ci];
      if (reachabilityGateRank(currentGate) !== rank) continue;

      const x = ci % W;
      const y = (ci / W) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const ni = world.idx(x + dx, y + dy);
        const next = classifyReachabilityCell(world, ni);
        if (!next.passable) continue;

        const nextGate = currentGate | next.gateMask;
        const nextRank = reachabilityGateRank(nextGate);
        if (nextRank >= reachabilityGateRank(gateMask[ni])) continue;

        if (!reachable[ni]) {
          reasonCounts[next.reason] = (reasonCounts[next.reason] ?? 0) + 1;
        }
        reachable[ni] = 1;
        gateMask[ni] = nextGate;
        queues[nextRank].push(ni);
      }
    }
  }

  return { reachable, gateMask, reasonCounts };
}

export function hasReachableAdjacentCell(world: World, audit: ReachabilityAudit, idx: number): boolean {
  const x = idx % W;
  const y = (idx / W) | 0;
  return !!(
    audit.reachable[world.idx(x + 1, y)] ||
    audit.reachable[world.idx(x - 1, y)] ||
    audit.reachable[world.idx(x, y + 1)] ||
    audit.reachable[world.idx(x, y - 1)]
  );
}

export function describeReachability(audit: ReachabilityAudit, world: World, idx: number): string {
  if (audit.reachable[idx]) return reachabilityGateLabel(audit.gateMask[idx]);
  return `unreachable (${classifyReachabilityCell(world, idx).reason})`;
}

export function replaceWorldFromGeneration(target: World | null | undefined, generation: WorldGenerationLike): World {
  const source = generation.world;
  if (!target) {
    markWorldReplaced(source, {
      cellVersion: source.cellVersion,
      surfaceVersion: source.surfaceVersion,
      wallTexVersion: source.wallTexVersion,
      floorTexVersion: source.floorTexVersion,
      fogVersion: source.fogVersion,
    });
    return source;
  }

  const versions = {
    cellVersion: target.cellVersion,
    surfaceVersion: target.surfaceVersion,
    wallTexVersion: target.wallTexVersion,
    floorTexVersion: target.floorTexVersion,
    fogVersion: target.fogVersion,
  };

  target.cells.set(source.cells);
  target.roomMap.set(source.roomMap);
  target.wallTex.set(source.wallTex);
  target.floorTex.set(source.floorTex);
  target.features.set(source.features);
  target.light.set(source.light);
  target.aptMask.set(source.aptMask);
  target.hermoWall.set(source.hermoWall);
  target.zoneMap.set(source.zoneMap);
  target.factionControl.set(source.factionControl);
  target.fog.set(source.fog);
  target.liftDir.set(source.liftDir);

  target.rooms = source.rooms.slice();
  target.doors = new Map(source.doors);
  target.apartmentRoomCount = source.apartmentRoomCount;
  target.zones = source.zones.slice();
  target.slideCells = source.slideCells.slice();
  target.screenCells = source.screenCells.slice();
  target.surfaceMap = new Map(source.surfaceMap);
  target.anomalyTeleports = new Map(source.anomalyTeleports);
  target.anomalySmogSource = source.anomalySmogSource;
  target.anomalySmogCells = source.anomalySmogCells.slice();
  target.anomalySmogHandled = source.anomalySmogHandled;
  target.railTracks = source.railTracks.slice();
  target.railTrains = source.railTrains.slice();
  target.railTrainCells = new Map(source.railTrainCells);
  target.containers = source.containers.slice();
  target.rebuildContainerMap();

  markWorldReplaced(target, versions);
  return target;
}

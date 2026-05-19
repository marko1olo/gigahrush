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

  /* Legacy stamp — delegates to the new procedural mark system.
     Kept for callers that still use the old (cx, cy, fx, fy, radius, intensity, seed, r, g, b, wallOk) signature.
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

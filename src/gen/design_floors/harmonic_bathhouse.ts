/* -- Design floor: harmonic_bathhouse - heat, steam and pressure routes -- */

import { stampSurfaceSplat } from '../../systems/surface_marks';
import {
  AIGoal,
  Cell,
  ContainerKind,
  EntityType,
  Faction,
  Feature,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  Occupation,
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
import { hashSeed, withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { placeEmergencyPanel } from '../../systems/emergency_panels';
import { registerCellHazardSite } from '../../systems/cell_hazards';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG } from '../../systems/rpg';
import {
  ensureConnectivity,
  generateZones,
  placeDoorAt,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const HARMONIC_BATHHOUSE_ROUTE_ID = 'harmonic_bathhouse' as const;
export const HARMONIC_BATHHOUSE_Z = -28 as const;
export const HARMONIC_BATHHOUSE_BASE_FLOOR = FloorLevel.MAINTENANCE;

export type BathhouseDecisionId =
  | 'turn_valve'
  | 'hot_fast_path'
  | 'cold_flooded_bypass'
  | 'repair_pressure_route';

export interface BathhouseThermalBands {
  hotFogCells: number;
  coldWaterCells: number;
  pressureCells: number;
}

export interface BathhouseRouteNode {
  id: BathhouseDecisionId;
  roomName: string;
  roomId: number;
  x: number;
  y: number;
  tags: readonly string[];
}

export interface HarmonicBathhouseState {
  routeId: typeof HARMONIC_BATHHOUSE_ROUTE_ID;
  anchorZ: typeof HARMONIC_BATHHOUSE_Z;
  baseFloor: typeof HARMONIC_BATHHOUSE_BASE_FLOOR;
  bands: BathhouseThermalBands;
  decisions: BathhouseRouteNode[];
  cueIds: string[];
  hazardIds: string[];
  panelIds: string[];
}

export interface HarmonicBathhouseGeneration extends FloorGeneration {
  bathhouseState: HarmonicBathhouseState;
}

interface BathhouseRooms {
  entry: Room;
  mixingHall: Room;
  centralBath: Room;
  boiler: Room;
  hotGallery: Room;
  coldBypass: Room;
  repairGallery: Room;
  lowerLift: Room;
}

interface Point {
  x: number;
  y: number;
}

interface HarmonicField {
  originX: number;
  originY: number;
  step: number;
  width: number;
  height: number;
  values: Float32Array;
}

type NextId = { v: number };

const SEED = hashSeed(HARMONIC_BATHHOUSE_ROUTE_ID);
const CX = W >> 1;
const CY = W >> 1;
const FIELD_W = 171;
const FIELD_H = 171;
const FIELD_STEP = 2;
const FIELD_ORIGIN_X = CX - Math.floor(FIELD_W * FIELD_STEP / 2);
const FIELD_ORIGIN_Y = CY - 176;

function idxField(x: number, y: number): number {
  return y * FIELD_W + x;
}

function hash01(seed: number, x: number, y: number, salt: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h ^= Math.imul(x + salt, 0xc2b2ae35);
  h ^= Math.imul(y - salt, 0x27d4eb2d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return ((h >>> 0) & 0xffff) / 0x10000;
}

export function generateHarmonicBathhouseDesignFloor(seed = SEED): HarmonicBathhouseGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };

    initWorld(world);
    const field = solveHarmonicBathhouseField(seed);
    carveLevelSetCorridors(world, field, seed);
    const rooms = buildRooms(world);
    connectRooms(world, rooms);
    placeLifts(world, rooms);
    const bands = applyThermalBands(world, field, rooms, seed);
    decorateRooms(world, rooms, seed);

    generateZones(world);
    tuneBathhouseZones(world);
    const panelIds = placePanels(world, rooms);
    const hazardIds = registerHazards(world, rooms, seed);
    const cueIds = registerCues(world, rooms);
    placeContainers(world, rooms);
    spawnBathhouseNpcs(entities, nextId, rooms);
    spawnBathhouseThreats(world, entities, nextId, rooms);

    sanitizeDoors(world);
    ensureConnectivity(world, rooms.entry.x + 46.5, rooms.entry.y + 13.5);
    world.rebuildContainerMap();
    world.bakeLights();

    return {
      world,
      entities,
      spawnX: rooms.entry.x + 46.5,
      spawnY: rooms.entry.y + 13.5,
      bathhouseState: {
        routeId: HARMONIC_BATHHOUSE_ROUTE_ID,
        anchorZ: HARMONIC_BATHHOUSE_Z,
        baseFloor: HARMONIC_BATHHOUSE_BASE_FLOOR,
        bands,
        decisions: [
          decisionNode('turn_valve', rooms.boiler, ['valve', 'steam', 'pressure']),
          decisionNode('hot_fast_path', rooms.hotGallery, ['hot_fast_path', 'steam', 'risk']),
          decisionNode('cold_flooded_bypass', rooms.coldBypass, ['cold_flooded_bypass', 'water', 'slow']),
          decisionNode('repair_pressure_route', rooms.repairGallery, ['repair_pressure_route', 'panel', 'pressure']),
        ],
        cueIds,
        hazardIds,
        panelIds,
      },
    };
  });
}

function initWorld(world: World): void {
  world.wallTex.fill(Tex.METAL);
  world.floorTex.fill(Tex.F_CONCRETE);
  world.factionControl.fill(ZoneFaction.LIQUIDATOR);
}

/* The candidate asks for a harmonic floor: fixed hot/cold sources are relaxed
 * into a scalar potential, then corridor bands follow its level sets. */
function solveHarmonicBathhouseField(seed: number): HarmonicField {
  const values = new Float32Array(FIELD_W * FIELD_H);
  const next = new Float32Array(values.length);
  const fixed = new Uint8Array(values.length);

  const hot = [
    { x: FIELD_W * 0.54, y: FIELD_H * 0.10, v: 1.0, r: 14 },
    { x: FIELD_W * 0.86, y: FIELD_H * 0.43, v: 0.82, r: 18 },
  ];
  const cold = [
    { x: FIELD_W * 0.12, y: FIELD_H * 0.56, v: -0.92, r: 20 },
    { x: FIELD_W * 0.58, y: FIELD_H * 0.94, v: -0.42, r: 16 },
  ];

  for (let y = 0; y < FIELD_H; y++) {
    for (let x = 0; x < FIELD_W; x++) {
      const i = idxField(x, y);
      let weighted = 0;
      let weight = 0;
      for (const src of [...hot, ...cold]) {
        const dx = x - src.x;
        const dy = y - src.y;
        const d2 = dx * dx + dy * dy;
        const w = 1 / (8 + d2);
        weighted += src.v * w;
        weight += w;
        if (d2 <= src.r * src.r) {
          fixed[i] = 1;
          values[i] = src.v;
        }
      }
      if (!fixed[i]) values[i] = weight > 0 ? weighted / weight : 0;
      if (x === 0 || y === 0 || x === FIELD_W - 1 || y === FIELD_H - 1) {
        fixed[i] = 1;
        values[i] = y < FIELD_H * 0.35 ? 0.44 : x < FIELD_W * 0.5 ? -0.38 : 0.08;
      }
    }
  }

  for (let iter = 0; iter < 72; iter++) {
    next.set(values);
    for (let y = 1; y < FIELD_H - 1; y++) {
      for (let x = 1; x < FIELD_W - 1; x++) {
        const i = idxField(x, y);
        if (fixed[i]) continue;
        const bias = (hash01(seed, x, y, iter) - 0.5) * 0.002;
        next[i] = (
          values[idxField(x - 1, y)] +
          values[idxField(x + 1, y)] +
          values[idxField(x, y - 1)] +
          values[idxField(x, y + 1)]
        ) * 0.25 + bias;
      }
    }
    values.set(next);
  }

  return {
    originX: FIELD_ORIGIN_X,
    originY: FIELD_ORIGIN_Y,
    step: FIELD_STEP,
    width: FIELD_W,
    height: FIELD_H,
    values,
  };
}

function carveLevelSetCorridors(world: World, field: HarmonicField, seed: number): void {
  const levels = [0.54, 0.32, 0.1, -0.16, -0.38] as const;
  for (let gy = 3; gy < field.height - 3; gy++) {
    for (let gx = 3; gx < field.width - 3; gx++) {
      const v = field.values[idxField(gx, gy)];
      let nearest = 1;
      for (const level of levels) nearest = Math.min(nearest, Math.abs(v - level));
      const noise = hash01(seed, gx, gy, 31);
      const levelSet = nearest < 0.018 + noise * 0.012;
      const pressure = Math.abs(field.values[idxField(gx + 1, gy)] - field.values[idxField(gx - 1, gy)])
        + Math.abs(field.values[idxField(gx, gy + 1)] - field.values[idxField(gx, gy - 1)]);
      if (!levelSet && pressure < 0.105) continue;
      if (!levelSet && noise < 0.86) continue;
      carveDisc(world, field.originX + gx * field.step, field.originY + gy * field.step, levelSet ? 2 : 1, Tex.F_CONCRETE);
    }
  }
}

function buildRooms(world: World): BathhouseRooms {
  const entry = addRoom(world, RoomType.CORRIDOR, CX - 46, CY + 164, 92, 28, 'Верхняя кабина парного этажа', Tex.PIPE, Tex.F_CONCRETE);
  const mixingHall = addRoom(world, RoomType.COMMON, CX - 60, CY + 84, 120, 50, 'Смесительный зал давления', Tex.TILE_W, Tex.F_TILE);
  const centralBath = addRoom(world, RoomType.BATHROOM, CX - 58, CY - 52, 116, 86, 'Гармоническая купель', Tex.TILE_W, Tex.F_TILE);
  const boiler = addRoom(world, RoomType.PRODUCTION, CX - 44, CY - 164, 88, 66, 'Котельная поющего стояка', Tex.PIPE, Tex.F_CONCRETE);
  const hotGallery = addRoom(world, RoomType.PRODUCTION, CX + 86, CY - 78, 72, 192, 'Горячий быстрый ход', Tex.PIPE, Tex.F_TILE);
  const coldBypass = addRoom(world, RoomType.BATHROOM, CX - 162, CY - 78, 76, 192, 'Холодный затопленный обход', Tex.TILE_W, Tex.F_WATER);
  const repairGallery = addRoom(world, RoomType.PRODUCTION, CX - 82, CY + 48, 164, 28, 'Галерея манометров', Tex.METAL, Tex.F_CONCRETE);
  const lowerLift = addRoom(world, RoomType.CORRIDOR, CX + 86, CY + 164, 92, 28, 'Нижняя кабина за сушилками', Tex.PIPE, Tex.F_CONCRETE);
  return { entry, mixingHall, centralBath, boiler, hotGallery, coldBypass, repairGallery, lowerLift };
}

function addRoom(
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
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) {
        world.floorTex[ci] = floorTex;
      } else {
        world.wallTex[ci] = wallTex;
      }
    }
  }
  return room;
}

function connectRooms(world: World, rooms: BathhouseRooms): void {
  connectDoorToPoint(world, rooms.entry, 'north', rooms.entry.w >> 1, { x: CX, y: CY + 148 }, 3, Tex.F_CONCRETE);
  connectDoorToPoint(world, rooms.mixingHall, 'south', rooms.mixingHall.w >> 1, { x: CX, y: CY + 148 }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.mixingHall, 'north', rooms.mixingHall.w >> 1, { x: CX, y: CY + 58 }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.repairGallery, 'south', rooms.repairGallery.w >> 1, { x: CX, y: CY + 58 }, 2, Tex.F_CONCRETE);
  connectDoorToPoint(world, rooms.repairGallery, 'north', rooms.repairGallery.w >> 1, { x: CX, y: CY + 36 }, 2, Tex.F_CONCRETE);
  connectDoorToPoint(world, rooms.centralBath, 'south', rooms.centralBath.w >> 1, { x: CX, y: CY + 36 }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.centralBath, 'north', rooms.centralBath.w >> 1, { x: CX, y: CY - 92 }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.boiler, 'south', rooms.boiler.w >> 1, { x: CX, y: CY - 92 }, 3, Tex.F_CONCRETE);
  connectDoorToPoint(world, rooms.centralBath, 'east', rooms.centralBath.h >> 1, { x: CX + 76, y: CY }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.hotGallery, 'west', rooms.hotGallery.h >> 1, { x: CX + 76, y: CY }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.centralBath, 'west', rooms.centralBath.h >> 1, { x: CX - 76, y: CY }, 3, Tex.F_WATER);
  connectDoorToPoint(world, rooms.coldBypass, 'east', rooms.coldBypass.h >> 1, { x: CX - 76, y: CY }, 3, Tex.F_WATER);
  connectDoorToPoint(world, rooms.hotGallery, 'south', rooms.hotGallery.w >> 1, { x: CX + 132, y: CY + 150 }, 3, Tex.F_TILE);
  connectDoorToPoint(world, rooms.lowerLift, 'north', 28, { x: CX + 132, y: CY + 150 }, 3, Tex.F_CONCRETE);
  connectDoorToPoint(world, rooms.coldBypass, 'south', rooms.coldBypass.w >> 1, { x: CX - 124, y: CY + 150 }, 3, Tex.F_WATER);
  carveLine(world, CX - 124, CY + 150, CX + 98, CY + 150, 3, Tex.F_CONCRETE);
  connectDoorToPoint(world, rooms.lowerLift, 'north', 66, { x: CX + 98, y: CY + 150 }, 3, Tex.F_CONCRETE);
}

function connectDoorToPoint(
  world: World,
  room: Room,
  side: 'north' | 'south' | 'west' | 'east',
  offset: number,
  target: Point,
  width: number,
  floorTex: Tex,
): void {
  const door = doorPoint(room, side, offset);
  placeDoorAt(world, door.wall.x, door.wall.y, room.id);
  carveLine(world, door.outside.x, door.outside.y, target.x, target.y, width, floorTex);
}

function doorPoint(room: Room, side: 'north' | 'south' | 'west' | 'east', offset: number): { wall: Point; outside: Point } {
  if (side === 'north') {
    const x = room.x + Math.max(1, Math.min(room.w - 2, offset));
    return { wall: { x, y: room.y - 1 }, outside: { x, y: room.y - 2 } };
  }
  if (side === 'south') {
    const x = room.x + Math.max(1, Math.min(room.w - 2, offset));
    return { wall: { x, y: room.y + room.h }, outside: { x, y: room.y + room.h + 1 } };
  }
  if (side === 'west') {
    const y = room.y + Math.max(1, Math.min(room.h - 2, offset));
    return { wall: { x: room.x - 1, y }, outside: { x: room.x - 2, y } };
  }
  const y = room.y + Math.max(1, Math.min(room.h - 2, offset));
  return { wall: { x: room.x + room.w, y }, outside: { x: room.x + room.w + 1, y } };
}

function carveLine(world: World, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  let x = Math.round(ax);
  let y = Math.round(ay);
  const mx = Math.round(bx);
  const my = Math.round(by);
  const sx = mx === x ? 0 : mx > x ? 1 : -1;
  const sy = my === y ? 0 : my > y ? 1 : -1;
  while (x !== mx) {
    carveDisc(world, x, y, width, floorTex);
    x += sx;
  }
  while (y !== my) {
    carveDisc(world, x, y, width, floorTex);
    y += sy;
  }
  carveDisc(world, x, y, width, floorTex);
}

function carveDisc(world: World, cx: number, cy: number, r: number, floorTex: Tex): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = world.wrap(cx + dx);
      const y = world.wrap(cy + dy);
      const ci = world.idx(x, y);
      if (world.aptMask[ci]) continue;
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = -1;
      world.floorTex[ci] = floorTex;
      world.wallTex[ci] = Tex.PIPE;
    }
  }
}

function placeLifts(world: World, rooms: BathhouseRooms): void {
  placeLift(world, rooms.entry.x + 14, rooms.entry.y + 14, rooms.entry.x + 20, rooms.entry.y + 14, LiftDirection.UP);
  placeLift(world, rooms.lowerLift.x + rooms.lowerLift.w - 14, rooms.lowerLift.y + 14, rooms.lowerLift.x + rooms.lowerLift.w - 20, rooms.lowerLift.y + 14, LiftDirection.DOWN);
}

function placeLift(world: World, liftX: number, liftY: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(liftX, liftY);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.liftDir[li] = direction;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

function applyThermalBands(world: World, field: HarmonicField, rooms: BathhouseRooms, seed: number): BathhouseThermalBands {
  let hotFogCells = 0;
  let coldWaterCells = 0;
  let pressureCells = 0;
  for (let gy = 1; gy < field.height - 1; gy++) {
    for (let gx = 1; gx < field.width - 1; gx++) {
      const wx = field.originX + gx * field.step;
      const wy = field.originY + gy * field.step;
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
      const v = field.values[idxField(gx, gy)];
      const n = hash01(seed, gx, gy, 97);
      if (v > 0.34) {
        world.fog[ci] = Math.max(world.fog[ci], Math.floor(48 + v * 92 + n * 24));
        world.floorTex[ci] = Tex.F_TILE;
        hotFogCells++;
      } else if (v < -0.24 && n > 0.18) {
        world.cells[ci] = Cell.WATER;
        world.floorTex[ci] = Tex.F_WATER;
        world.fog[ci] = Math.max(world.fog[ci], Math.floor(18 + Math.abs(v) * 44));
        coldWaterCells++;
      } else if (Math.abs(v) < 0.08) {
        world.fog[ci] = Math.max(world.fog[ci], 14);
        pressureCells++;
      }
    }
  }
  coldWaterCells += floodRoom(world, rooms.coldBypass, 0.72, seed ^ 0x77);
  hotFogCells += steamRoom(world, rooms.hotGallery, 96, seed ^ 0x88);
  return { hotFogCells, coldWaterCells, pressureCells };
}

function floodRoom(world: World, room: Room, chance: number, seed: number): number {
  let changed = 0;
  forRoomCells(world, room, (ci, x, y) => {
    if (world.features[ci] !== Feature.NONE) return;
    if (hash01(seed, x, y, 5) > chance) return;
    world.cells[ci] = Cell.WATER;
    world.floorTex[ci] = Tex.F_WATER;
    world.fog[ci] = Math.max(world.fog[ci], 28);
    changed++;
  });
  return changed;
}

function steamRoom(world: World, room: Room, fog: number, seed: number): number {
  let changed = 0;
  forRoomCells(world, room, (ci, x, y) => {
    if ((x + y + seed) % 5 !== 0) return;
    world.fog[ci] = Math.max(world.fog[ci], fog);
    changed++;
  });
  return changed;
}

function decorateRooms(world: World, rooms: BathhouseRooms, seed: number): void {
  for (let x = rooms.centralBath.x + 14; x < rooms.centralBath.x + rooms.centralBath.w - 12; x += 18) {
    setFeature(world, x, rooms.centralBath.y + 14, Feature.SINK);
    setFeature(world, x, rooms.centralBath.y + rooms.centralBath.h - 12, Feature.CHAIR);
  }
  for (let y = rooms.boiler.y + 10; y < rooms.boiler.y + rooms.boiler.h - 8; y += 11) {
    setFeature(world, rooms.boiler.x + 10, y, Feature.MACHINE);
    setFeature(world, rooms.boiler.x + rooms.boiler.w - 10, y, Feature.APPARATUS);
  }
  for (let y = rooms.hotGallery.y + 12; y < rooms.hotGallery.y + rooms.hotGallery.h - 8; y += 18) {
    setFeature(world, rooms.hotGallery.x + 12, y, Feature.APPARATUS);
    setFeature(world, rooms.hotGallery.x + rooms.hotGallery.w - 10, y + 4, Feature.LAMP);
  }
  for (let y = rooms.coldBypass.y + 14; y < rooms.coldBypass.y + rooms.coldBypass.h - 8; y += 20) {
    setFeature(world, rooms.coldBypass.x + 10, y, Feature.SINK);
  }
  for (let x = rooms.repairGallery.x + 12; x < rooms.repairGallery.x + rooms.repairGallery.w - 8; x += 22) {
    setFeature(world, x, rooms.repairGallery.y + 8, Feature.APPARATUS);
    setFeature(world, x + 5, rooms.repairGallery.y + 18, Feature.SCREEN);
  }
  setFeature(world, rooms.mixingHall.x + 12, rooms.mixingHall.y + 12, Feature.TABLE);
  setFeature(world, rooms.mixingHall.x + rooms.mixingHall.w - 12, rooms.mixingHall.y + 12, Feature.SHELF);
  setFeature(world, rooms.entry.x + rooms.entry.w - 14, rooms.entry.y + 13, Feature.LAMP);
  setFeature(world, rooms.lowerLift.x + 14, rooms.lowerLift.y + 13, Feature.LAMP);

  stampRoomSurface(world, rooms.centralBath, seed ^ 0xa1, [82, 132, 155]);
  stampRoomSurface(world, rooms.hotGallery, seed ^ 0xa2, [190, 102, 54]);
  stampRoomSurface(world, rooms.coldBypass, seed ^ 0xa3, [70, 120, 170]);
}

function stampRoomSurface(world: World, room: Room, seed: number, tint: [number, number, number]): void {
  stampSurfaceSplat(world, room.x + room.w / 2, room.y + room.h / 2, 0.5, 0.5, Math.max(room.w, room.h) / 86, 0.62, seed, tint[0], tint[1], tint[2], false);
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
}

function forRoomCells(world: World, room: Room, fn: (idx: number, x: number, y: number) => void): void {
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const x = world.wrap(room.x + dx);
      const y = world.wrap(room.y + dy);
      const ci = world.idx(x, y);
      if (world.roomMap[ci] === room.id) fn(ci, x, y);
    }
  }
}

function tuneBathhouseZones(world: World): void {
  for (const zone of world.zones) {
    const hot = zone.cx > CX + 72 && zone.cy >= CY - 110 && zone.cy <= CY + 150;
    const cold = zone.cx < CX - 72 && zone.cy >= CY - 110 && zone.cy <= CY + 150;
    const core = Math.abs(world.delta(zone.cx, CX)) < 96 && zone.cy >= CY - 178 && zone.cy <= CY + 190;
    if (hot) {
      zone.faction = ZoneFaction.SAMOSBOR;
      zone.level = Math.max(zone.level, 4);
    } else if (cold) {
      zone.faction = ZoneFaction.WILD;
      zone.level = Math.max(zone.level, 3);
    } else if (core) {
      zone.faction = ZoneFaction.LIQUIDATOR;
      zone.level = Math.max(zone.level, 4);
      zone.hasLift = true;
    } else if (zone.id % 5 === 0) {
      zone.faction = ZoneFaction.WILD;
      zone.level = Math.max(zone.level, 3);
    } else {
      zone.faction = ZoneFaction.LIQUIDATOR;
      zone.level = Math.max(zone.level, 3);
    }
    zone.fogged = false;
  }
  for (let i = 0; i < W * W; i++) world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.LIQUIDATOR;
}

function placePanels(world: World, rooms: BathhouseRooms): string[] {
  const placed = [
    placeEmergencyPanel(world, rooms.boiler.x + 12, rooms.boiler.y + 10, 'panel_power', SEED ^ 0xba01),
    placeEmergencyPanel(world, rooms.hotGallery.x + 10, rooms.hotGallery.y + 12, 'panel_vent', SEED ^ 0xba02),
    placeEmergencyPanel(world, rooms.repairGallery.x + 14, rooms.repairGallery.y + 14, 'panel_water', SEED ^ 0xba03),
    placeEmergencyPanel(world, rooms.lowerLift.x + 18, rooms.lowerLift.y + 14, 'panel_doors', SEED ^ 0xba04),
  ];
  return placed.filter(panel => !!panel).map(panel => `${panel!.defId}:${panel!.idx}`);
}

function registerHazards(world: World, rooms: BathhouseRooms, seed: number): string[] {
  const hotCells = roomCellsByHash(world, rooms.hotGallery, seed ^ 0x5100, 0.58);
  const coldCells = roomWaterCells(world, rooms.coldBypass);
  const pressureCells = roomCellsByHash(world, rooms.boiler, seed ^ 0x5200, 0.22);

  registerCellHazardSite(world, {
    id: 'harmonic_bathhouse_hot_fast_path',
    kind: 'steam_pressure',
    displayName: 'Паровой сброс',
    cells: hotCells,
    tags: [HARMONIC_BATHHOUSE_ROUTE_ID, 'hot_fast_path', 'steam', 'pressure'],
    sticky: false,
    cleanable: true,
    slowMult: 0.62,
    trappedMult: 0.34,
    pulsePeriodSeconds: 7.5,
    pulseActiveSeconds: 4.2,
    activeFog: 132,
    inactiveFog: 44,
    playerDamagePerSecond: 2.2,
    monsterDamagePerSecond: 1.2,
    roomId: rooms.hotGallery.id,
    centerX: rooms.hotGallery.x + rooms.hotGallery.w / 2,
    centerY: rooms.hotGallery.y + rooms.hotGallery.h / 2,
    warning: 'Пар режет быстрый ход. Идите рывком, чините вытяжку или уходите в холодный обход.',
    inactiveWarning: 'Пар ушёл в стояк. Горячий ход открыт на короткий такт.',
    warningColor: '#ff8a45',
  });
  registerCellHazardSite(world, {
    id: 'harmonic_bathhouse_cold_flooded_bypass',
    kind: 'cold_flood',
    displayName: 'Холодный затопленный обход',
    cells: coldCells,
    tags: [HARMONIC_BATHHOUSE_ROUTE_ID, 'cold_flooded_bypass', 'water', 'slow'],
    sticky: false,
    cleanable: false,
    slowMult: 0.66,
    trappedMult: 0.42,
    activeFog: 32,
    roomId: rooms.coldBypass.id,
    centerX: rooms.coldBypass.x + rooms.coldBypass.w / 2,
    centerY: rooms.coldBypass.y + rooms.coldBypass.h / 2,
    warning: 'Вода ледяная и тянет обувь. Безопаснее пара, но медленнее.',
    warningColor: '#79c8ff',
  });
  registerCellHazardSite(world, {
    id: 'harmonic_bathhouse_boiler_pressure_leak',
    kind: 'pressure_leak',
    displayName: 'Срыв давления',
    cells: pressureCells,
    tags: [HARMONIC_BATHHOUSE_ROUTE_ID, 'turn_valve', 'repair_pressure_route', 'pressure'],
    sticky: false,
    cleanable: true,
    slowMult: 0.72,
    pulsePeriodSeconds: 9,
    pulseActiveSeconds: 2.5,
    activeFog: 118,
    inactiveFog: 34,
    playerDamagePerSecond: 1.4,
    monsterDamagePerSecond: 0.6,
    roomId: rooms.boiler.id,
    centerX: rooms.boiler.x + rooms.boiler.w / 2,
    centerY: rooms.boiler.y + rooms.boiler.h / 2,
    warning: 'Котёл бьёт обратным давлением. Вентиль просит бирку, герметик и терпение.',
    inactiveWarning: 'Стрелка манометра упала. Можно проскочить к котлу.',
    warningColor: '#ffd16f',
  });

  return [
    'harmonic_bathhouse_hot_fast_path',
    'harmonic_bathhouse_cold_flooded_bypass',
    'harmonic_bathhouse_boiler_pressure_leak',
  ];
}

function roomCellsByHash(world: World, room: Room, seed: number, chance: number): number[] {
  const out: number[] = [];
  forRoomCells(world, room, (ci, x, y) => {
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
    if (hash01(seed, x, y, 19) <= chance) out.push(ci);
  });
  return out;
}

function roomWaterCells(world: World, room: Room): number[] {
  const out: number[] = [];
  forRoomCells(world, room, ci => {
    if (world.cells[ci] === Cell.WATER) out.push(ci);
  });
  return out;
}

function registerCues(world: World, rooms: BathhouseRooms): string[] {
  const cues = [
    {
      id: 'harmonic_bathhouse_turn_valve',
      room: rooms.mixingHall,
      target: rooms.boiler,
      label: 'поющий вентиль',
      hint: 'Котельная держит давление. Водяной щиток и вентиль меняют соседние комнаты, не весь этаж.',
      color: '#ffd16f',
      tags: ['turn_valve', 'pressure', 'steam'],
      group: {
        id: 'harmonic_bathhouse_valve',
        lead: 'Котёл держит горячий ход под давлением.',
        risk: 'Срыв пара бьёт короткими тактами.',
        decision: 'Повернуть вентиль или оставить быстрый ход опасным.',
        reward: 'Меньше пара рядом с котлом и доступ к ремонтным шкафам.',
      },
    },
    {
      id: 'harmonic_bathhouse_hot_fast_path',
      room: rooms.entry,
      target: rooms.hotGallery,
      label: 'горячий быстрый ход',
      hint: 'Короткий путь к нижней кабине идёт через паровой сброс.',
      color: '#ff8a45',
      tags: ['hot_fast_path', 'steam', 'route_choice'],
      group: {
        id: 'harmonic_bathhouse_hot_fast_path',
        lead: 'Паровая галерея почти прямая.',
        risk: 'Пульсирующий пар режет здоровье и видимость.',
        decision: 'Идти быстро через жар или чинить вытяжку.',
        reward: 'Самый короткий путь к нижней кабине.',
      },
    },
    {
      id: 'harmonic_bathhouse_cold_flooded_bypass',
      room: rooms.entry,
      target: rooms.coldBypass,
      label: 'холодный обход',
      hint: 'Затопленный путь медленный, но обходит основную паровую петлю.',
      color: '#79c8ff',
      tags: ['cold_flooded_bypass', 'water', 'route_choice'],
      group: {
        id: 'harmonic_bathhouse_cold_flooded_bypass',
        lead: 'Слева вода держит обход до сушилок.',
        risk: 'Вода тянет шаг и собирает мокрых тварей.',
        decision: 'Терять время в воде или идти через жар.',
        reward: 'Меньше прямого урона от пара.',
      },
    },
    {
      id: 'harmonic_bathhouse_repair_pressure_route',
      room: rooms.mixingHall,
      target: rooms.repairGallery,
      label: 'галерея манометров',
      hint: 'Ремонтный щиток может осушить или затуманить только соседние комнаты.',
      color: '#b7d0c0',
      tags: ['repair_pressure_route', 'panel', 'route_choice'],
      group: {
        id: 'harmonic_bathhouse_repair_pressure_route',
        lead: 'Манометры показывают, где давление спорит с водой.',
        risk: 'Ошибочная перегрузка зовёт местную аварию.',
        decision: 'Починить контур, сорвать пломбу или уйти без ремонта.',
        reward: 'Локально чище туман, вода и двери.',
      },
    },
  ] as const;

  for (const cue of cues) {
    registerRouteCue(world, {
      id: cue.id,
      x: cue.room.x + cue.room.w / 2,
      y: cue.room.y + cue.room.h / 2,
      targetX: cue.target.x + cue.target.w / 2,
      targetY: cue.target.y + cue.target.h / 2,
      floor: HARMONIC_BATHHOUSE_BASE_FLOOR,
      label: cue.label,
      hint: cue.hint,
      targetName: cue.target.name,
      color: cue.color,
      tags: [HARMONIC_BATHHOUSE_ROUTE_ID, ...cue.tags],
      toneSeed: SEED ^ cue.id.length * 131,
      roomId: cue.room.id,
      targetRoomId: cue.target.id,
      radius: 13,
      targetRadius: 4,
      routeGroup: cue.group,
      heardText: cue.hint,
      followedText: `Вы приняли маршрут: ${cue.label}.`,
      ignoredText: `Вы отвернулись от маршрута: ${cue.label}.`,
    });
  }
  return cues.map(cue => cue.id);
}

function placeContainers(world: World, rooms: BathhouseRooms): void {
  addContainer(world, rooms.repairGallery, rooms.repairGallery.x + 132, rooms.repairGallery.y + 13, ContainerKind.TOOL_LOCKER, 'Шкаф галереи манометров', 'locked', [
    { defId: 'valve_tag', count: 1 },
    { defId: 'sealant_tube', count: 1 },
    { defId: 'manometer', count: 1 },
    { defId: 'asbestos_cord', count: 1 },
  ], ['harmonic_bathhouse', 'repair_pressure_route', 'pressure', 'tool']);
  addContainer(world, rooms.boiler, rooms.boiler.x + rooms.boiler.w - 12, rooms.boiler.y + 12, ContainerKind.METAL_CABINET, 'Горячий шкаф котельной', 'secret', [
    { defId: 'pressure_logbook', count: 1 },
    { defId: 'boiler_water', count: 2 },
    { defId: 'burn_gel', count: 1 },
  ], ['harmonic_bathhouse', 'turn_valve', 'steam', 'theft']);
  addContainer(world, rooms.coldBypass, rooms.coldBypass.x + 12, rooms.coldBypass.y + rooms.coldBypass.h - 14, ContainerKind.EMERGENCY_BOX, 'Мокрый ящик холодного обхода', 'public', [
    { defId: 'filtered_water', count: 2 },
    { defId: 'gasmask_filter', count: 1 },
    { defId: 'bandage', count: 1 },
  ], ['harmonic_bathhouse', 'cold_flooded_bypass', 'water', 'public']);
  addContainer(world, rooms.hotGallery, rooms.hotGallery.x + rooms.hotGallery.w - 14, rooms.hotGallery.y + rooms.hotGallery.h - 16, ContainerKind.TOOL_LOCKER, 'Сухой шкаф горячего хода', 'locked', [
    { defId: 'fuse', count: 1 },
    { defId: 'relay_diagram', count: 1 },
    { defId: 'gasmask_filter', count: 1 },
  ], ['harmonic_bathhouse', 'hot_fast_path', 'vent', 'tool']);
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
): void {
  const ci = world.idx(x, y);
  world.addContainer({
    id: world.containers.length,
    x,
    y,
    floor: HARMONIC_BATHHOUSE_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: 8,
    access,
    lockDifficulty: access === 'locked' ? 2 : access === 'secret' ? 3 : undefined,
    discovered: access !== 'secret',
    tags: [...tags],
  });
  setFeature(world, x, y, kind === ContainerKind.TOOL_LOCKER ? Feature.SHELF : Feature.APPARATUS);
}

function spawnBathhouseNpcs(entities: Entity[], nextId: NextId, rooms: BathhouseRooms): void {
  spawnNpc(entities, nextId, 'Смотрительница пара', Faction.LIQUIDATOR, Occupation.MECHANIC, rooms.repairGallery.x + 34, rooms.repairGallery.y + 14, [
    { defId: 'valve_tag', count: 1 },
    { defId: 'pressure_logbook', count: 1 },
  ]);
  spawnNpc(entities, nextId, 'Банщик без смены', Faction.CITIZEN, Occupation.LOCKSMITH, rooms.centralBath.x + 18, rooms.centralBath.y + 28, [
    { defId: 'boiler_water', count: 1 },
    { defId: 'asbestos_cord', count: 1 },
  ]);
  spawnNpc(entities, nextId, 'Дикий ныряльщик обхода', Faction.WILD, Occupation.HUNTER, rooms.coldBypass.x + 34, rooms.coldBypass.y + 118, [
    { defId: 'filtered_water', count: 1 },
    { defId: 'gasmask_filter', count: 1 },
  ]);
}

function spawnNpc(
  entities: Entity[],
  nextId: NextId,
  name: string,
  faction: Faction,
  occupation: Occupation,
  x: number,
  y: number,
  inventory: Item[],
): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0.86,
    sprite: occupation,
    name,
    hp: 125,
    maxHp: 125,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    faction,
    occupation,
    assignedRoomId: -1,
    questId: -1,
    canGiveQuest: false,
    inventory,
    needs: freshNeeds(),
    rpg: randomRPG(3),
  });
}

function spawnBathhouseThreats(world: World, entities: Entity[], nextId: NextId, rooms: BathhouseRooms): void {
  spawnMonster(world, entities, nextId, MonsterKind.TUMANNIK, rooms.hotGallery.x + 46, rooms.hotGallery.y + 74, 4, 'Туманник паровой галереи');
  spawnMonster(world, entities, nextId, MonsterKind.VODYANOY_KOSHMAR, rooms.coldBypass.x + 38, rooms.coldBypass.y + 86, 4, 'Водяной кошмар холодного обхода');
  spawnMonster(world, entities, nextId, MonsterKind.TRUBNYY_AVTOMAT, rooms.boiler.x + 48, rooms.boiler.y + 34, 4, 'Трубный автомат котельной');
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: NextId,
  kind: MonsterKind,
  x: number,
  y: number,
  level: number,
  name: string,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = Math.round(def.hp * (0.9 + level * 0.14));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
  });
}

function decisionNode(id: BathhouseDecisionId, room: Room, tags: readonly string[]): BathhouseRouteNode {
  return {
    id,
    roomName: room.name,
    roomId: room.id,
    x: room.x + room.w / 2,
    y: room.y + room.h / 2,
    tags,
  };
}

export function dropBathhouseDebugItem(world: World, entities: Entity[], nextId: NextId, x: number, y: number, defId: string, count: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
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

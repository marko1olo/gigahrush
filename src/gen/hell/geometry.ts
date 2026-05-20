/* ── Hell macro geometry: arena chains, flee loops and scars ─── */

import {
  W, Cell, DoorState, Feature, RoomType, Tex,
  type Room,
} from '../../core/types';
import { World } from '../../core/world';
import { protectRoom, stampRoom } from '../shared';

export interface HellGeometry {
  monsterCells: number[];
  cultistCells: number[];
  liquidatorCells: number[];
  safeCells: number[];
}

export interface HellPos {
  x: number;
  y: number;
}

type Pos = HellPos;

interface ChainSpec {
  id: string;
  name: string;
  entry: Pos;
  arena: Pos;
  exit: Pos;
  fallback: Pos;
  reward: Pos;
  faction: 'monster' | 'cultist' | 'liquidator';
  motif: 'meat' | 'bone' | 'vent' | 'barricade' | 'scar';
}

const CHAINS: readonly ChainSpec[] = [
  {
    id: 'first_throat',
    name: 'Глотка первого жара',
    entry: { x: 18, y: -4 },
    arena: { x: 58, y: -22 },
    exit: { x: 104, y: -18 },
    fallback: { x: 58, y: 22 },
    reward: { x: 82, y: -54 },
    faction: 'cultist',
    motif: 'vent',
  },
  {
    id: 'bone_bridge',
    name: 'Костяной мост',
    entry: { x: -20, y: -18 },
    arena: { x: -76, y: -62 },
    exit: { x: -132, y: -44 },
    fallback: { x: -86, y: -16 },
    reward: { x: -110, y: -92 },
    faction: 'monster',
    motif: 'bone',
  },
  {
    id: 'cult_barricade',
    name: 'Баррикада пепельных',
    entry: { x: 32, y: 26 },
    arena: { x: 126, y: 34 },
    exit: { x: 174, y: 82 },
    fallback: { x: 112, y: 90 },
    reward: { x: 150, y: 6 },
    faction: 'cultist',
    motif: 'barricade',
  },
  {
    id: 'scar_run',
    name: 'Рваный безопасный рубец',
    entry: { x: -18, y: 24 },
    arena: { x: -82, y: 94 },
    exit: { x: -144, y: 128 },
    fallback: { x: -112, y: 42 },
    reward: { x: -118, y: 82 },
    faction: 'liquidator',
    motif: 'scar',
  },
  {
    id: 'deep_altar',
    name: 'Нижний пепельный карман',
    entry: { x: 0, y: 46 },
    arena: { x: 8, y: 158 },
    exit: { x: 54, y: 212 },
    fallback: { x: -42, y: 154 },
    reward: { x: 34, y: 188 },
    faction: 'monster',
    motif: 'meat',
  },
];

export function buildHellGeometry(world: World): HellGeometry {
  const geometry: HellGeometry = {
    monsterCells: [],
    cultistCells: [],
    liquidatorCells: [],
    safeCells: [],
  };
  const origin = { x: W >> 1, y: W >> 1 };

  carveSafeScar(world, origin, 7, 5, geometry.safeCells);
  decorateSpawnFork(world, origin);

  const exits: Pos[] = [];
  for (const spec of CHAINS) {
    buildArenaChain(world, origin, spec, geometry);
    exits.push(add(origin, spec.exit));
  }
  for (let i = 0; i < exits.length; i++) {
    carveMeatTunnel(world, exits[i], exits[(i + 1) % exits.length], 1, Tex.F_GUT);
  }

  return geometry;
}

export function carveHellSafeShortcut(world: World, a: HellPos, b: HellPos, radius = 1): number[] {
  const cells: number[] = [];
  const seen = new Set<number>();
  const dx = world.delta(a.x, b.x);
  const dy = world.delta(a.y, b.y);
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const nx = dy === 0 ? 0 : -Math.sign(dy);
  const ny = dx === 0 ? 0 : Math.sign(dx);
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const wobble = Math.sin(t * Math.PI * 2 + (a.y - b.x) * 0.11) * 0.8;
    const x = world.wrap(Math.round(a.x + dx * t + nx * wobble));
    const y = world.wrap(Math.round(a.y + dy * t + ny * wobble));
    carveShortcutDisc(world, x, y, radius, cells, seen);
    if ((step % 11) === 0) setFeature(world, x, y, Feature.LAMP);
    if ((step % 13) === 0) paintWallRing(world, { x, y }, radius + 1, radius + 1, Tex.CONCRETE);
  }
  return cells;
}

function buildArenaChain(world: World, origin: Pos, spec: ChainSpec, geometry: HellGeometry): void {
  const entry = add(origin, spec.entry);
  const arena = add(origin, spec.arena);
  const exit = add(origin, spec.exit);
  const fallback = add(origin, spec.fallback);
  const reward = add(origin, spec.reward);

  if (spec.motif === 'bone') {
    carveBoneBridge(world, entry, arena);
  } else if (spec.motif === 'vent') {
    carveVentThroat(world, entry, arena);
  } else {
    carveMeatTunnel(world, entry, arena, 2, Tex.F_MEAT);
  }

  carveThreatPocket(world, arena, spec, geometry);
  carveMeatTunnel(world, arena, exit, 2, spec.motif === 'scar' ? Tex.F_CONCRETE : Tex.F_MEAT);
  carveFallbackLoop(world, entry, fallback, exit, spec, geometry);
  stampRitualRoom(world, reward, arena, spec);

  if (spec.motif === 'barricade') {
    stampCultBarricade(world, midpoint(entry, arena), fallback, geometry);
  }
}

function carveThreatPocket(world: World, center: Pos, spec: ChainSpec, geometry: HellGeometry): void {
  const rx = spec.motif === 'barricade' ? 16 : 14;
  const ry = spec.motif === 'bone' ? 10 : 12;
  const cells = carveEllipse(world, center, rx, ry, Tex.F_MEAT, true);
  paintWallRing(world, center, rx + 2, ry + 2, spec.motif === 'bone' ? Tex.GUT : Tex.MEAT);
  for (const ci of cells) pushPressureCell(geometry, spec.faction, ci);

  setFeature(world, center.x, center.y, Feature.APPARATUS);
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const x = world.wrap(center.x + Math.round(Math.cos(a) * (rx - 4)));
    const y = world.wrap(center.y + Math.round(Math.sin(a) * (ry - 4)));
    setFeature(world, x, y, Feature.CANDLE);
  }

  for (let i = 0; i < 7; i++) {
    const a = (Math.PI * 2 * i) / 7;
    const x = world.wrap(center.x + Math.round(Math.cos(a) * (rx - 2)));
    const y = world.wrap(center.y + Math.round(Math.sin(a) * (ry - 2)));
    world.stamp(x, y, 0.5, 0.5, 2.8, 140, 7800 + i + spec.id.length * 37, 115, 18, 24);
  }
}

function carveFallbackLoop(world: World, entry: Pos, fallback: Pos, exit: Pos, spec: ChainSpec, geometry: HellGeometry): void {
  const tex = spec.motif === 'scar' ? Tex.F_CONCRETE : Tex.F_GUT;
  carveMeatTunnel(world, entry, fallback, 1, tex);
  carveMeatTunnel(world, fallback, exit, 1, tex);
  carveSafeScar(world, fallback, 5, 3, geometry.safeCells);
  setFeature(world, fallback.x, fallback.y, spec.motif === 'scar' ? Feature.LAMP : Feature.CANDLE);
}

function carveBoneBridge(world: World, a: Pos, b: Pos): void {
  carveAbyssRibbon(world, a, b, 5);
  carveMeatTunnel(world, a, b, 1, Tex.F_CONCRETE);
  forEachLine(a, b, 9, (x, y, step) => {
    if ((step & 7) !== 0) return;
    setFeature(world, x, y, Feature.CANDLE);
  });
}

function carveVentThroat(world: World, a: Pos, b: Pos): void {
  carveMeatTunnel(world, a, b, 1, Tex.F_GUT);
  forEachLine(a, b, 6, (x, y, step) => {
    if ((step % 11) === 0) setFeature(world, x, y, Feature.APPARATUS);
    else if ((step % 7) === 0) setFeature(world, x, y, Feature.LAMP);
  });
}

function stampRitualRoom(world: World, center: Pos, target: Pos, spec: ChainSpec): void {
  const w = spec.motif === 'barricade' ? 17 : 13;
  const h = spec.motif === 'barricade' ? 9 : 11;
  const room = stampHellRoom(
    world,
    spec.motif === 'barricade' ? RoomType.HQ : RoomType.STORAGE,
    `${spec.name}: пороговая награда`,
    center.x - (w >> 1),
    center.y - (h >> 1),
    w,
    h,
    spec.motif === 'scar' ? Tex.CONCRETE : Tex.GUT,
    spec.motif === 'scar' ? Tex.F_CONCRETE : Tex.F_MEAT,
  );
  const door = openDoorToward(world, room, target);
  carveMeatTunnel(world, target, door.outside, 1, room.floorTex);

  setFeature(world, center.x, center.y, Feature.SHELF);
  setFeature(world, center.x - 3, center.y, Feature.CANDLE);
  setFeature(world, center.x + 3, center.y, Feature.CANDLE);
  if (spec.motif === 'vent') setFeature(world, center.x, center.y - 3, Feature.APPARATUS);
}

function stampCultBarricade(
  world: World,
  center: Pos,
  bypass: Pos,
  geometry: HellGeometry,
): void {
  const room = stampHellRoom(
    world,
    RoomType.HQ,
    'Культовая баррикада',
    center.x - 10,
    center.y - 4,
    20,
    8,
    Tex.METAL,
    Tex.F_MEAT,
  );
  const mainDoor = openDoorToward(world, room, add(center, { x: 36, y: 0 }));
  const rearDoor = openDoorToward(world, room, bypass);
  carveMeatTunnel(world, mainDoor.outside, rearDoor.outside, 1, Tex.F_GUT);
  carveMeatTunnel(world, bypass, rearDoor.outside, 1, Tex.F_GUT);

  for (let dx = -7; dx <= 7; dx += 2) {
    const ci = world.idx(center.x + dx, center.y);
    if (world.cells[ci] === Cell.FLOOR) {
      world.features[ci] = Feature.SHELF;
      geometry.cultistCells.push(ci);
    }
  }
  setFeature(world, center.x, center.y - 2, Feature.SCREEN);
}

function stampHellRoom(
  world: World,
  type: RoomType,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  protectRoom(world, room.x, room.y, room.w, room.h, wallTex, floorTex);
  return room;
}

function openDoorToward(world: World, room: Room, target: Pos): { door: Pos; outside: Pos } {
  const cx = room.x + (room.w >> 1);
  const cy = room.y + (room.h >> 1);
  const dx = world.delta(cx, target.x);
  const dy = world.delta(cy, target.y);
  let door: Pos;
  let outside: Pos;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const y = world.wrap(cy);
    if (dx >= 0) {
      door = { x: world.wrap(room.x + room.w), y };
      outside = { x: world.wrap(room.x + room.w + 1), y };
    } else {
      door = { x: world.wrap(room.x - 1), y };
      outside = { x: world.wrap(room.x - 2), y };
    }
  } else {
    const x = world.wrap(cx);
    if (dy >= 0) {
      door = { x, y: world.wrap(room.y + room.h) };
      outside = { x, y: world.wrap(room.y + room.h + 1) };
    } else {
      door = { x, y: world.wrap(room.y - 1) };
      outside = { x, y: world.wrap(room.y - 2) };
    }
  }

  const ci = world.idx(door.x, door.y);
  world.cells[ci] = Cell.DOOR;
  world.wallTex[ci] = Tex.DOOR_METAL;
  world.floorTex[ci] = room.floorTex;
  world.aptMask[ci] = 0;
  world.doors.set(ci, {
    idx: ci,
    state: DoorState.CLOSED,
    roomA: room.id,
    roomB: -1,
    keyId: '',
    timer: 0,
  });
  room.doors.push(ci);
  carveFloor(world, outside.x, outside.y, room.floorTex);
  return { door, outside };
}

function carveSafeScar(world: World, center: Pos, rx: number, ry: number, out: number[]): void {
  const cells = carveEllipse(world, center, rx, ry, Tex.F_CONCRETE, false);
  for (const ci of cells) out.push(ci);
  paintWallRing(world, center, rx + 1, ry + 1, Tex.CONCRETE);
  setFeature(world, center.x, center.y, Feature.LAMP);
}

function decorateSpawnFork(world: World, origin: Pos): void {
  setFeature(world, origin.x - 5, origin.y, Feature.CANDLE);
  setFeature(world, origin.x + 5, origin.y, Feature.CANDLE);
  setFeature(world, origin.x, origin.y - 4, Feature.APPARATUS);
  carveVentThroat(world, add(origin, { x: 0, y: -5 }), add(origin, { x: 17, y: -4 }));
  carveMeatTunnel(world, add(origin, { x: -7, y: 0 }), add(origin, { x: -20, y: -18 }), 1, Tex.F_CONCRETE);
}

function carveMeatTunnel(world: World, a: Pos, b: Pos, radius: number, floorTex: Tex): void {
  const dx = world.delta(a.x, b.x);
  const dy = world.delta(a.y, b.y);
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const nx = dy === 0 ? 0 : -Math.sign(dy);
  const ny = dx === 0 ? 0 : Math.sign(dx);
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const wobble = Math.sin(t * Math.PI * 3 + (a.x + b.y) * 0.13) * 1.8;
    const x = world.wrap(Math.round(a.x + dx * t + nx * wobble));
    const y = world.wrap(Math.round(a.y + dy * t + ny * wobble));
    carveDisc(world, x, y, radius, floorTex);
    if ((step % 13) === 0) paintWallRing(world, { x, y }, radius + 2, radius + 2, Tex.GUT);
  }
}

function carveAbyssRibbon(world: World, a: Pos, b: Pos, radius: number): void {
  forEachLine(a, b, 1, (x, y) => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const ci = world.idx(x + dx, y + dy);
        if (world.aptMask[ci] || world.cells[ci] === Cell.LIFT) continue;
        world.cells[ci] = Cell.ABYSS;
        world.roomMap[ci] = -1;
        world.features[ci] = Feature.NONE;
        world.floorTex[ci] = Tex.F_ABYSS;
        world.wallTex[ci] = 0;
      }
    }
  });
}

function carveEllipse(world: World, center: Pos, rx: number, ry: number, floorTex: Tex, pressure: boolean): number[] {
  const cells: number[] = [];
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (n > 1) continue;
      const x = world.wrap(center.x + dx);
      const y = world.wrap(center.y + dy);
      const ci = world.idx(x, y);
      carveFloor(world, x, y, floorTex);
      cells.push(ci);
      if (pressure && n > 0.32 && n < 0.9 && ((dx + dy) & 1) === 0) cells.push(ci);
    }
  }
  return cells;
}

function carveDisc(world: World, x: number, y: number, radius: number, floorTex: Tex): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius + 1) continue;
      carveFloor(world, x + dx, y + dy, floorTex);
    }
  }
}

function carveShortcutDisc(
  world: World,
  x: number,
  y: number,
  radius: number,
  out: number[],
  seen: Set<number>,
): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius + 1) continue;
      const cx = world.wrap(x + dx);
      const cy = world.wrap(y + dy);
      const ci = world.idx(cx, cy);
      carveFloor(world, cx, cy, Tex.F_CONCRETE);
      if (!seen.has(ci) && world.cells[ci] === Cell.FLOOR) {
        seen.add(ci);
        out.push(ci);
      }
    }
  }
}

function carveFloor(world: World, x: number, y: number, floorTex: Tex): void {
  const ci = world.idx(x, y);
  if (world.aptMask[ci] || world.cells[ci] === Cell.LIFT) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.floorTex[ci] = floorTex;
  world.wallTex[ci] = 0;
}

function paintWallRing(world: World, center: Pos, rx: number, ry: number, wallTex: Tex): void {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (n < 0.92 || n > 1.24) continue;
      const ci = world.idx(center.x + dx, center.y + dy);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
    }
  }
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.DOOR) return;
  world.features[ci] = feature;
}

function pushPressureCell(geometry: HellGeometry, faction: ChainSpec['faction'], ci: number): void {
  geometry.monsterCells.push(ci);
  if (faction === 'cultist') geometry.cultistCells.push(ci);
  else if (faction === 'liquidator') geometry.liquidatorCells.push(ci);
}

function forEachLine(a: Pos, b: Pos, stepMul: number, visit: (x: number, y: number, step: number) => void): void {
  const dx = shortestDelta(a.x, b.x);
  const dy = shortestDelta(a.y, b.y);
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * stepMul));
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    visit(wrap(Math.round(a.x + dx * t)), wrap(Math.round(a.y + dy * t)), step);
  }
}

function add(a: Pos, b: Pos): Pos {
  return { x: wrap(a.x + b.x), y: wrap(a.y + b.y) };
}

function midpoint(a: Pos, b: Pos): Pos {
  return {
    x: wrap(a.x + Math.round(shortestDelta(a.x, b.x) * 0.5)),
    y: wrap(a.y + Math.round(shortestDelta(a.y, b.y) * 0.5)),
  };
}

function shortestDelta(a: number, b: number): number {
  let d = b - a;
  if (d > W / 2) d -= W;
  if (d < -W / 2) d += W;
  return d;
}

function wrap(v: number): number {
  return ((v % W) + W) % W;
}

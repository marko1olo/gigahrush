import { Cell, W, type RoomType, type ZoneFaction } from '../core/types';
import type { World } from '../core/world';

export interface NaturalPopulationProfile {
  noiseScale: number;
  noiseStrength: number;
  roomWeights?: Partial<Record<RoomType, number>>;
  zoneWeights?: Partial<Record<ZoneFaction, number>>;
  openWeight?: number;
}

interface PopulationCellCache {
  cellVersion: number;
  cells: Int32Array;
}

const CELL_COUNT = W * W;
const CANDIDATE_TRIES = 6;
const cacheByWorld = new WeakMap<World, PopulationCellCache>();

export function sampleNaturalPopulationCells(
  world: World,
  count: number,
  profile: NaturalPopulationProfile,
  seed: number,
): number[] {
  if (count <= 0) return [];
  const cells = populationCellCache(world).cells;
  if (cells.length === 0) return [];

  const out: number[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    const cell = pickContextCell(world, cells, profile, seed, i, used);
    if (cell >= 0) {
      out.push(cell);
      used.add(cell);
    }
  }
  return out;
}

function populationCellCache(world: World): PopulationCellCache {
  const cached = cacheByWorld.get(world);
  if (cached && cached.cellVersion === world.cellVersion) return cached;

  const cells: number[] = [];
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (world.cells[cell] === Cell.FLOOR) cells.push(cell);
  }

  const cache: PopulationCellCache = {
    cellVersion: world.cellVersion,
    cells: Int32Array.from(cells),
  };
  cacheByWorld.set(world, cache);
  return cache;
}

function pickContextCell(
  world: World,
  cells: Int32Array,
  profile: NaturalPopulationProfile,
  seed: number,
  serial: number,
  used: Set<number>,
): number {
  let bestCell = -1;
  let bestScore = -Infinity;
  for (let attempt = 0; attempt < CANDIDATE_TRIES; attempt++) {
    const pick = Math.floor(hash3(seed, serial * 31 + attempt, 17) * cells.length);
    const cell = cells[pick];
    if (used.has(cell) || world.cells[cell] !== Cell.FLOOR) continue;
    const score = cellPopulationScore(world, cell, profile, seed) + hash3(cell, serial, seed) * 0.35;
    if (score > bestScore) {
      bestScore = score;
      bestCell = cell;
    }
  }

  if (bestCell >= 0) return bestCell;
  const start = Math.floor(hash3(seed, serial, 29) * cells.length);
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[(start + i) % cells.length];
    if (!used.has(cell) && world.cells[cell] === Cell.FLOOR) return cell;
  }
  return -1;
}

function cellPopulationScore(world: World, cell: number, profile: NaturalPopulationProfile, seed: number): number {
  const x = cell % W;
  const y = (cell / W) | 0;
  let score = profile.openWeight ?? 1;

  const roomId = world.roomMap[cell];
  if (roomId >= 0) {
    const room = world.rooms[roomId];
    if (room) score = profile.roomWeights?.[room.type] ?? 1;
  }

  const zone = world.zones[world.zoneMap[cell]];
  if (zone) score *= profile.zoneWeights?.[zone.faction] ?? 1;

  const scale = Math.max(24, profile.noiseScale);
  const coarse = valueNoise(x + 0.5, y + 0.5, scale, seed);
  const fine = valueNoise(x + 0.5, y + 0.5, scale * 0.45, seed + 101);
  const n = coarse * 0.7 + fine * 0.3;
  score *= Math.max(0.25, 1 + (n * 2 - 1) * profile.noiseStrength);

  return Math.max(0.01, score);
}

function valueNoise(x: number, y: number, scale: number, seed: number): number {
  const period = Math.max(1, Math.round(W / scale));
  const actualScale = W / period;
  const gx = Math.floor(x / actualScale);
  const gy = Math.floor(y / actualScale);
  const fx = x / actualScale - gx;
  const fy = y / actualScale - gy;
  const x0 = wrapGrid(gx, period);
  const y0 = wrapGrid(gy, period);
  const x1 = wrapGrid(gx + 1, period);
  const y1 = wrapGrid(gy + 1, period);
  const sx = smooth(fx);
  const sy = smooth(fy);
  const a = lerp(hash3(x0, y0, seed), hash3(x1, y0, seed), sx);
  const b = lerp(hash3(x0, y1, seed), hash3(x1, y1, seed), sx);
  return lerp(a, b, sy);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function wrapGrid(v: number, period: number): number {
  return ((v % period) + period) % period;
}

function hash3(a: number, b: number, c: number): number {
  let n = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 0xffffffff;
}

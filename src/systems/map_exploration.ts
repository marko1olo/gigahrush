/* ── UI-only map exploration memory ───────────────────────────── */

import { Cell, W, type Entity, type GameState } from '../core/types';
import type { World } from '../core/world';
import { getRouteCueMapReveals } from './route_cues';
import { getSamosborShelterRoomIds } from './samosbor';
import { getSamosborWaveDebugSnapshot } from './samosbor_wave';

const LOCAL_TRAIL_RADIUS = 2;
const ROUTE_REVEAL_RADIUS = 8;
const ZONE_REVEAL_RADIUS = 18;

interface MapExplorationRuntime {
  explored: Uint8Array;
  revealedRooms: Set<number>;
  revealedZones: Set<number>;
  initialized: boolean;
  initialZoneId: number;
  lastCell: number;
  lastSamosborWaveFogKey: string;
}

const explorationByWorld = new WeakMap<World, MapExplorationRuntime>();

function emptyRuntime(): MapExplorationRuntime {
  return {
    explored: new Uint8Array(W * W),
    revealedRooms: new Set(),
    revealedZones: new Set(),
    initialized: false,
    initialZoneId: -1,
    lastCell: -1,
    lastSamosborWaveFogKey: '',
  };
}

function runtimeFor(world: World): MapExplorationRuntime {
  let runtime = explorationByWorld.get(world);
  if (!runtime) {
    runtime = emptyRuntime();
    explorationByWorld.set(world, runtime);
  }
  return runtime;
}

function walkableMapCell(cell: number): boolean {
  return cell === Cell.FLOOR || cell === Cell.DOOR || cell === Cell.LIFT || cell === Cell.WATER || cell === Cell.ABYSS;
}

function revealCell(runtime: MapExplorationRuntime, idx: number): void {
  if (idx >= 0 && idx < runtime.explored.length) runtime.explored[idx] = 1;
}

export function resetMapExploration(world: World): void {
  explorationByWorld.delete(world);
}

export function revealMapRoom(world: World, roomId: number): void {
  const room = world.rooms[roomId];
  if (!room) return;
  const runtime = runtimeFor(world);
  if (runtime.revealedRooms.has(room.id)) return;
  runtime.revealedRooms.add(room.id);
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const idx = world.idx(x, y);
      if (world.roomMap[idx] === room.id || walkableMapCell(world.cells[idx])) revealCell(runtime, idx);
    }
  }
  for (const doorIdx of room.doors) revealCell(runtime, doorIdx);
}

export function revealMapZone(world: World, zoneId: number): void {
  if (zoneId < 0) return;
  const runtime = runtimeFor(world);
  if (runtime.revealedZones.has(zoneId)) return;
  runtime.revealedZones.add(zoneId);
  for (let idx = 0; idx < runtime.explored.length; idx++) {
    if (world.zoneMap[idx] !== zoneId) continue;
    if (walkableMapCell(world.cells[idx])) revealCell(runtime, idx);
    const roomId = world.roomMap[idx];
    if (roomId >= 0) revealMapRoom(world, roomId);
  }
}

export function revealMapArea(world: World, x: number, y: number, radius: number): void {
  const runtime = runtimeFor(world);
  const cx = world.wrap(Math.floor(x));
  const cy = world.wrap(Math.floor(y));
  const r = Math.max(0, Math.floor(radius));
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const idx = world.idx(cx + dx, cy + dy);
      if (walkableMapCell(world.cells[idx])) revealCell(runtime, idx);
    }
  }
}

export function revealWholeMap(world: World): number {
  const runtime = runtimeFor(world);
  runtime.explored.fill(1);
  runtime.revealedRooms.clear();
  for (const room of world.rooms) if (room) runtime.revealedRooms.add(room.id);
  runtime.revealedZones.clear();
  for (const zone of world.zones) if (zone) runtime.revealedZones.add(zone.id);
  return runtime.explored.length;
}

function hideMapArea(world: World, x: number, y: number, radius: number): void {
  const runtime = explorationByWorld.get(world);
  if (!runtime) return;
  const cx = world.wrap(Math.floor(x));
  const cy = world.wrap(Math.floor(y));
  const r = Math.max(0, Math.floor(radius));
  const r2 = r * r;
  const hiddenRooms = new Set<number>();
  const hiddenZones = new Set<number>();
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const idx = world.idx(cx + dx, cy + dy);
      runtime.explored[idx] = 0;
      const roomId = world.roomMap[idx];
      if (roomId >= 0) hiddenRooms.add(roomId);
      hiddenZones.add(world.zoneMap[idx]);
    }
  }
  for (const roomId of hiddenRooms) runtime.revealedRooms.delete(roomId);
  for (const zoneId of hiddenZones) runtime.revealedZones.delete(zoneId);
  runtime.lastCell = -1;
}

function revealRouteCueKnowledge(world: World, state: GameState): void {
  for (const reveal of getRouteCueMapReveals(world, state)) {
    if (reveal.floor !== state.currentFloor) continue;
    if (reveal.roomId !== undefined) revealMapRoom(world, reveal.roomId);
    if (reveal.zoneId !== undefined) revealMapZone(world, reveal.zoneId);
    if (reveal.x !== undefined && reveal.y !== undefined) {
      revealMapArea(world, reveal.x, reveal.y, reveal.kind === 'zone_danger' ? ZONE_REVEAL_RADIUS : ROUTE_REVEAL_RADIUS);
    }
  }
}

function revealSamosborShelters(world: World, state: GameState): void {
  for (const roomId of getSamosborShelterRoomIds(state)) revealMapRoom(world, roomId);
}

export function updateMapExploration(world: World, player: Entity, state: GameState): void {
  const runtime = runtimeFor(world);
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  const cellIdx = world.idx(px, py);
  if (!runtime.initialized) {
    runtime.initialized = true;
    runtime.initialZoneId = world.zoneMap[cellIdx];
    revealMapZone(world, runtime.initialZoneId);
  }
  if (cellIdx !== runtime.lastCell) {
    runtime.lastCell = cellIdx;
    revealMapArea(world, px, py, LOCAL_TRAIL_RADIUS);
  }
  revealRouteCueKnowledge(world, state);
  revealSamosborShelters(world, state);
}

export function syncMapExplorationAfterSamosborWave(world: World, state: GameState): void {
  const snapshot = getSamosborWaveDebugSnapshot();
  if (!snapshot || snapshot.active || !snapshot.finished || snapshot.fieldCells <= 0) return;
  const runtime = explorationByWorld.get(world);
  if (!runtime) return;
  const key = `${state.currentFloor}:${state.samosborCount}:${snapshot.originIdx}:${snapshot.fieldCells}:${snapshot.regeneratedCells}`;
  if (runtime.lastSamosborWaveFogKey === key) return;
  runtime.lastSamosborWaveFogKey = key;
  hideMapArea(world, snapshot.originIdx % W, (snapshot.originIdx / W) | 0, snapshot.fieldRadius + 2);
}

export function isMapCellExplored(world: World, idx: number): boolean {
  const runtime = explorationByWorld.get(world);
  return !runtime || runtime.explored[idx] !== 0;
}

export function mapExplorationStats(world: World): { cells: number; rooms: number; initialZoneId: number } {
  const runtime = explorationByWorld.get(world);
  if (!runtime) return { cells: W * W, rooms: world.rooms.length, initialZoneId: -1 };
  let cells = 0;
  for (let i = 0; i < runtime.explored.length; i++) if (runtime.explored[i]) cells++;
  return { cells, rooms: runtime.revealedRooms.size, initialZoneId: runtime.initialZoneId };
}

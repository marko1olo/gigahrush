import { Cell, Feature, RoomType, Tex, type Room } from '../../core/types';
import {
  addItemDrop,
  isProtectedCell,
  isWalkableCell,
  roomCell,
  roomCenter,
  type ProceduralAnomalyGenContext,
} from './common';

const REAL_LOOT = ['lift_scheme', 'missing_record_file', 'psi_dust', 'siren_shard'] as const;
const COPY_LOOT = ['bleached_document', 'sand_spoiled_ration', 'note', 'blank_form'] as const;

function hash32(v: number): number {
  let x = v | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function orderRooms(rooms: Room[], seed: number): Room[] {
  return [...rooms].sort((a, b) => hash32(seed ^ Math.imul(a.id + 1, 0x45d9f3b)) - hash32(seed ^ Math.imul(b.id + 1, 0x45d9f3b)));
}

function carpetHole(x: number, y: number, size: number): boolean {
  let scale = size;
  let lx = x;
  let ly = y;
  while (scale >= 3) {
    const third = Math.max(1, Math.floor(scale / 3));
    if (Math.floor(lx / third) === 1 && Math.floor(ly / third) === 1) return true;
    lx %= third;
    ly %= third;
    scale = third;
  }
  return false;
}

function protectedForFractal(ctx: ProceduralAnomalyGenContext, x: number, y: number): boolean {
  const ci = ctx.world.idx(x, y);
  return isProtectedCell(ctx.world, ci) || ctx.world.dist2(ctx.spawnX, ctx.spawnY, x + 0.5, y + 0.5) < 58 * 58;
}

function markFractalCell(ctx: ProceduralAnomalyGenContext, x: number, y: number, seed: number, spine: boolean): void {
  const ci = ctx.world.idx(x, y);
  if (protectedForFractal(ctx, x, y)) return;
  if (spine && ctx.world.cells[ci] === Cell.WALL) {
    ctx.world.cells[ci] = Cell.FLOOR;
    ctx.world.roomMap[ci] = -1;
  }
  if (!isWalkableCell(ctx.world, ci)) return;

  ctx.world.floorTex[ci] = spine ? Tex.F_CONCRETE : Tex.F_VOID;
  ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], spine ? 18 : 46);
  if ((hash32(seed ^ ci) & 7) === 0) {
    ctx.world.stamp(x, y, 0.5, 0.5, spine ? 0.26 : 0.42, spine ? 0.44 : 0.62, seed ^ ci, 44, 105, 92, false);
  }
}

function carveSpine(ctx: ProceduralAnomalyGenContext, cx: number, cy: number, half: number, seed: number): void {
  for (let d = -half; d <= half; d++) {
    markFractalCell(ctx, cx + d, cy, seed + d * 17, true);
    markFractalCell(ctx, cx, cy + d, seed + d * 31, true);
    if ((d & 15) === 0) {
      markFractalCell(ctx, cx + d, cy + Math.floor(d / 4), seed + d * 47, true);
      markFractalCell(ctx, cx + Math.floor(d / 4), cy - d, seed + d * 61, true);
    }
  }
}

function applySquareDomain(ctx: ProceduralAnomalyGenContext, anchor: Room): void {
  const center = roomCenter(anchor);
  const size = ctx.spec.danger >= 5 ? 192 : ctx.spec.danger >= 4 ? 144 : 96;
  const half = Math.floor(size / 2);
  const x0 = center.x - half;
  const y0 = center.y - half;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wx = ctx.world.wrap(x0 + x);
      const wy = ctx.world.wrap(y0 + y);
      const ci = ctx.world.idx(wx, wy);
      if ((ctx.world.cells[ci] !== Cell.FLOOR && ctx.world.cells[ci] !== Cell.WATER) || protectedForFractal(ctx, wx, wy)) continue;
      const onEdgeStep = (x === 0 || y === 0 || x === size - 1 || y === size - 1) && ((x + y) % 5 === 0);
      if (carpetHole(x, y, size) || onEdgeStep) markFractalCell(ctx, wx, wy, ctx.spec.seed + x * 131 + y * 977, false);
    }
  }

  carveSpine(ctx, center.x, center.y, half, ctx.spec.seed ^ 0x5f2a1);
}

function decorateCopyRoom(ctx: ProceduralAnomalyGenContext, room: Room, ordinal: number): { x: number; y: number } | null {
  room.name = `Фрактал ${ordinal}: ${ordinal === 0 ? 'исходная кладовая' : 'копия кладовой'} ${room.id}`;
  room.floorTex = ordinal === 0 ? Tex.F_PARQUET : Tex.F_VOID;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const x = ctx.world.wrap(room.x + dx);
      const y = ctx.world.wrap(room.y + dy);
      const ci = ctx.world.idx(x, y);
      if (ctx.world.roomMap[ci] !== room.id || !isWalkableCell(ctx.world, ci)) continue;
      const repeated = ((dx & 3) === (dy & 3)) || carpetHole(dx, dy, Math.max(room.w, room.h));
      if (repeated) {
        ctx.world.floorTex[ci] = ordinal === 0 ? Tex.F_PARQUET : Tex.F_VOID;
        ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], ordinal === 0 ? 12 : 54);
        if (((dx + dy + ordinal) % 6) === 0) ctx.world.stamp(x, y, 0.5, 0.5, 0.24, 0.38, ctx.spec.seed + room.id * 97 + dx * 11 + dy, 58, 116, 94, false);
      }
    }
  }

  const apparatus = roomCell(ctx.world, room, Math.floor(room.w / 2), Math.floor(room.h / 2), true);
  if (apparatus) ctx.world.features[ctx.world.idx(apparatus.x, apparatus.y)] = ordinal === 0 ? Feature.APPARATUS : Feature.SCREEN;
  const loot = roomCell(ctx.world, room, 1 + (ordinal * 3) % Math.max(1, room.w - 2), 1 + (ordinal * 5) % Math.max(1, room.h - 2), true);
  if (loot) addItemDrop(ctx, loot.x, loot.y, ordinal === 0 ? REAL_LOOT[hash32(ctx.spec.seed + room.id) % REAL_LOOT.length] : COPY_LOOT[ordinal % COPY_LOOT.length], 1);
  return apparatus;
}

function addFractalTeleport(ctx: ProceduralAnomalyGenContext, a: { x: number; y: number } | null, b: { x: number; y: number } | null): void {
  if (!a || !b) return;
  const ai = ctx.world.idx(a.x, a.y);
  const bi = ctx.world.idx(b.x, b.y);
  if (!isWalkableCell(ctx.world, ai) || !isWalkableCell(ctx.world, bi) || ctx.world.dist2(a.x, a.y, b.x, b.y) < 32 * 32) return;
  ctx.world.anomalyTeleports.set(ai, bi);
  ctx.world.anomalyTeleports.set(bi, ai);
  ctx.world.features[ai] = Feature.SCREEN;
  ctx.world.features[bi] = Feature.SCREEN;
  ctx.world.floorTex[ai] = Tex.F_VOID;
  ctx.world.floorTex[bi] = Tex.F_VOID;
}

export function applyFractalFloor(ctx: ProceduralAnomalyGenContext): void {
  const candidates = orderRooms(ctx.rooms.filter(room => (
    room.type !== RoomType.CORRIDOR &&
    room.type !== RoomType.BATHROOM &&
    room.w >= 7 &&
    room.h >= 7 &&
    ctx.world.dist2(ctx.spawnX, ctx.spawnY, roomCenter(room).x, roomCenter(room).y) > 64 * 64
  )), ctx.spec.seed);
  if (candidates.length === 0) return;

  const anchor = candidates[0];
  applySquareDomain(ctx, anchor);

  const copies = candidates.slice(0, Math.min(candidates.length, 3 + Math.floor(ctx.spec.danger / 2)));
  let firstApparatus: { x: number; y: number } | null = null;
  for (let i = 0; i < copies.length; i++) {
    const apparatus = decorateCopyRoom(ctx, copies[i], i);
    if (i === 0) firstApparatus = apparatus;
    else if (i <= 2) addFractalTeleport(ctx, firstApparatus, apparatus);
  }

  ctx.world.markFogDirty();
  ctx.world.markFloorTexDirty();
}

import { Cell, Feature, RoomType, Tex, type Room } from '../../core/types';
import {
  addItemDrop,
  isWalkableCell,
  roomCell,
  roomCenter,
  type ProceduralAnomalyGenContext,
} from './common';

const LEFT_LOOT = ['inspection_mirror', 'seal_wax', 'blank_form', 'water_coupon'] as const;
const RIGHT_LOOT = ['fake_pass', 'bleached_document', 'filter_receipt', 'container_key_label'] as const;

type Axis = 'x' | 'y';

interface MirrorPair {
  a: Room;
  b: Room;
}

function hash32(v: number): number {
  let x = v | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function mirrorCoord(v: number, axis: number): number {
  return (axis * 2 - v + 1024) & 1023;
}

function mirroredCenter(room: Room, axis: Axis, axisValue: number): { x: number; y: number } {
  const center = roomCenter(room);
  return axis === 'x'
    ? { x: mirrorCoord(center.x, axisValue), y: center.y }
    : { x: center.x, y: mirrorCoord(center.y, axisValue) };
}

function sortedRooms(ctx: ProceduralAnomalyGenContext): Room[] {
  return [...ctx.rooms]
    .filter(room => (
      room.type !== RoomType.CORRIDOR &&
      room.w >= 5 &&
      room.h >= 5 &&
      ctx.world.dist2(ctx.spawnX, ctx.spawnY, roomCenter(room).x, roomCenter(room).y) > 48 * 48
    ))
    .sort((a, b) => hash32(ctx.spec.seed ^ (a.id * 0x9e3779b1)) - hash32(ctx.spec.seed ^ (b.id * 0x9e3779b1)));
}

function choosePairs(ctx: ProceduralAnomalyGenContext, axis: Axis, axisValue: number): MirrorPair[] {
  const rooms = sortedRooms(ctx);
  const used = new Set<number>();
  const pairs: MirrorPair[] = [];
  const target = Math.min(6 + ctx.spec.danger, 12);

  for (const room of rooms) {
    if (pairs.length >= target || used.has(room.id)) continue;
    const wanted = mirroredCenter(room, axis, axisValue);
    let best: Room | null = null;
    let bestD2 = 88 * 88;
    for (const other of rooms) {
      if (other.id === room.id || used.has(other.id)) continue;
      const c = roomCenter(other);
      const d2 = ctx.world.dist2(wanted.x, wanted.y, c.x, c.y);
      if (d2 < bestD2) {
        bestD2 = d2;
        best = other;
      }
    }
    if (!best) continue;
    used.add(room.id);
    used.add(best.id);
    pairs.push({ a: room, b: best });
  }

  return pairs;
}

function pairCell(ctx: ProceduralAnomalyGenContext, pair: MirrorPair, axis: Axis, dx: number, dy: number): [{ x: number; y: number } | null, { x: number; y: number } | null] {
  const ax = Math.max(1, Math.min(pair.a.w - 2, dx));
  const ay = Math.max(1, Math.min(pair.a.h - 2, dy));
  const bx = axis === 'x' ? pair.b.w - 1 - Math.min(pair.b.w - 2, ax) : Math.min(pair.b.w - 2, ax);
  const by = axis === 'y' ? pair.b.h - 1 - Math.min(pair.b.h - 2, ay) : Math.min(pair.b.h - 2, ay);
  return [
    roomCell(ctx.world, pair.a, ax, ay, true),
    roomCell(ctx.world, pair.b, bx, by, true),
  ];
}

function setMirrorFeature(ctx: ProceduralAnomalyGenContext, pos: { x: number; y: number } | null, feature: Feature, seed: number): void {
  if (!pos) return;
  const ci = ctx.world.idx(pos.x, pos.y);
  if (!isWalkableCell(ctx.world, ci)) return;
  ctx.world.features[ci] = feature;
  ctx.world.floorTex[ci] = Tex.F_TILE;
  ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], 22);
  ctx.world.stamp(pos.x, pos.y, 0.5, 0.5, 0.34, 0.58, seed ^ ci, 155, 205, 225, false);
}

function addMirrorTeleport(ctx: ProceduralAnomalyGenContext, a: { x: number; y: number } | null, b: { x: number; y: number } | null): void {
  if (!a || !b) return;
  const ai = ctx.world.idx(a.x, a.y);
  const bi = ctx.world.idx(b.x, b.y);
  if (!isWalkableCell(ctx.world, ai) || !isWalkableCell(ctx.world, bi)) return;
  if (ctx.world.anomalyTeleports.has(ai) || ctx.world.anomalyTeleports.has(bi)) return;
  ctx.world.anomalyTeleports.set(ai, bi);
  ctx.world.anomalyTeleports.set(bi, ai);
  ctx.world.features[ai] = Feature.SCREEN;
  ctx.world.features[bi] = Feature.SCREEN;
  ctx.world.floorTex[ai] = Tex.F_VOID;
  ctx.world.floorTex[bi] = Tex.F_VOID;
}

function decoratePair(ctx: ProceduralAnomalyGenContext, pair: MirrorPair, axis: Axis, ordinal: number): void {
  pair.a.name = `Зеркало ${ordinal + 1}A: ${pair.a.name}`;
  pair.b.name = `Зеркало ${ordinal + 1}B: ${pair.b.name}`;

  for (const room of [pair.a, pair.b]) {
    for (let dy = 0; dy < room.h; dy++) {
      for (let dx = 0; dx < room.w; dx++) {
        const x = ctx.world.wrap(room.x + dx);
        const y = ctx.world.wrap(room.y + dy);
        const ci = ctx.world.idx(x, y);
        if (ctx.world.roomMap[ci] !== room.id || (ctx.world.cells[ci] !== Cell.FLOOR && ctx.world.cells[ci] !== Cell.WATER)) continue;
        if (((axis === 'x' ? dx : dy) + ordinal) % 4 === 0) {
          ctx.world.floorTex[ci] = Tex.F_TILE;
          ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], 12 + ordinal * 2);
        }
      }
    }
  }

  const [screenA, screenB] = pairCell(ctx, pair, axis, 1 + (ordinal % 3), 1 + ((ordinal * 2) % 3));
  setMirrorFeature(ctx, screenA, Feature.SCREEN, ctx.spec.seed + ordinal * 101);
  setMirrorFeature(ctx, screenB, Feature.SCREEN, ctx.spec.seed + ordinal * 103);

  const [lootA, lootB] = pairCell(ctx, pair, axis, Math.floor(pair.a.w / 2), Math.floor(pair.a.h / 2));
  const leftReal = (hash32(ctx.spec.seed + ordinal) & 1) === 0;
  if (lootA) addItemDrop(ctx, lootA.x, lootA.y, leftReal ? LEFT_LOOT[ordinal % LEFT_LOOT.length] : RIGHT_LOOT[ordinal % RIGHT_LOOT.length], 1);
  if (lootB) addItemDrop(ctx, lootB.x, lootB.y, leftReal ? RIGHT_LOOT[(ordinal + 1) % RIGHT_LOOT.length] : LEFT_LOOT[(ordinal + 1) % LEFT_LOOT.length], 1);

  if (ordinal < 3) addMirrorTeleport(ctx, screenA, screenB);
}

function markAxis(ctx: ProceduralAnomalyGenContext, axis: Axis, axisValue: number): void {
  for (let d = -96; d <= 96; d += 3) {
    const x = axis === 'x' ? axisValue : axisValue + d;
    const y = axis === 'x' ? axisValue + d : axisValue;
    const ci = ctx.world.idx(x, y);
    if (!isWalkableCell(ctx.world, ci)) continue;
    ctx.world.floorTex[ci] = Tex.F_VOID;
    ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], 34);
    if ((d & 15) === 0) ctx.world.stamp(x, y, 0.5, 0.5, 0.2, 0.5, ctx.spec.seed + d, 120, 185, 215, false);
  }
}

export function applyMirrorRun(ctx: ProceduralAnomalyGenContext): void {
  const axis: Axis = (ctx.spec.seed & 1) === 0 ? 'x' : 'y';
  const base = axis === 'x' ? Math.floor(ctx.spawnX) : Math.floor(ctx.spawnY);
  const axisValue = (base + 192 + (hash32(ctx.spec.seed) & 127)) & 1023;
  const pairs = choosePairs(ctx, axis, axisValue);
  if (pairs.length === 0) return;

  markAxis(ctx, axis, axisValue);
  for (let i = 0; i < pairs.length; i++) decoratePair(ctx, pairs[i], axis, i);

  ctx.world.markFogDirty();
  ctx.world.markFloorTexDirty();
}

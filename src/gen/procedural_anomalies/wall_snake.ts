import { Cell, Feature, Tex } from '../../core/types';
import {
  addItemDrop,
  isProtectedCell,
  isWalkableCell,
  roomCenter,
  type ProceduralAnomalyGenContext,
} from './common';

const WALL_SNAKE_TAG = '[wall_snake:';

function snakeRoomScore(ctx: ProceduralAnomalyGenContext, roomId: number): number {
  const room = ctx.rooms[roomId];
  if (!room || room.w < 8 || room.h < 8 || room.sealed) return -1;
  const c = roomCenter(room);
  const d2 = ctx.world.dist2(ctx.spawnX + 0.5, ctx.spawnY + 0.5, c.x + 0.5, c.y + 0.5);
  return d2 + room.w * room.h;
}

function perimeterIsUsable(ctx: ProceduralAnomalyGenContext, x0: number, y0: number, w: number, h: number): boolean {
  const world = ctx.world;
  let usable = 0;
  const need = Math.max(18, Math.min(56, (w + h) * 2 - 8));
  for (let i = 0; i < need; i++) {
    const p = perimeterPoint(world, x0, y0, w, h, i);
    const ci = world.idx(p.x, p.y);
    if (!isWalkableCell(world, ci)) return false;
    if (world.dist2(ctx.spawnX + 0.5, ctx.spawnY + 0.5, p.x + 0.5, p.y + 0.5) < 48 * 48) return false;
    usable++;
  }
  return usable >= need;
}

function perimeterPoint(world: ProceduralAnomalyGenContext['world'], x0: number, y0: number, w: number, h: number, step: number): { x: number; y: number } {
  const len = Math.max(1, (w + h) * 2 - 4);
  let t = ((step % len) + len) % len;
  if (t < w) return { x: world.wrap(x0 + t), y: world.wrap(y0) };
  t -= w;
  if (t < h - 1) return { x: world.wrap(x0 + w - 1), y: world.wrap(y0 + 1 + t) };
  t -= h - 1;
  if (t < w - 1) return { x: world.wrap(x0 + w - 2 - t), y: world.wrap(y0 + h - 1) };
  t -= w - 1;
  return { x: world.wrap(x0), y: world.wrap(y0 + h - 2 - t) };
}

export function applyWallSnake(ctx: ProceduralAnomalyGenContext): void {
  const order = ctx.rooms
    .map((room, i) => ({ i, score: snakeRoomScore(ctx, i), area: room.w * room.h }))
    .filter(v => v.score > 0)
    .sort((a, b) => b.score - a.score || b.area - a.area);

  for (const entry of order.slice(0, 18)) {
    const room = ctx.rooms[entry.i];
    const x0 = room.x + 1;
    const y0 = room.y + 1;
    const w = Math.min(room.w - 2, 28 + ctx.spec.danger * 4);
    const h = Math.min(room.h - 2, 18 + ctx.spec.danger * 3);
    if (w < 7 || h < 7 || !perimeterIsUsable(ctx, x0, y0, w, h)) continue;

    const head = perimeterPoint(ctx.world, x0, y0, w, h, 0);
    const headIdx = ctx.world.idx(head.x, head.y);
    if (isProtectedCell(ctx.world, headIdx)) continue;
    ctx.world.features[headIdx] = Feature.SCREEN;

    const bait = perimeterPoint(ctx.world, x0, y0, w, h, Math.floor((w + h) * 0.8));
    addItemDrop(ctx, bait.x, bait.y, 'gear', 1);

    const maxPaint = Math.min(160, (w + h) * 2 - 4);
    for (let step = 0; step < maxPaint; step += 2) {
      const p = perimeterPoint(ctx.world, x0, y0, w, h, step);
      const ci = ctx.world.idx(p.x, p.y);
      if (ctx.world.cells[ci] !== Cell.FLOOR && ctx.world.cells[ci] !== Cell.WATER) continue;
      ctx.world.floorTex[ci] = Tex.F_CONCRETE;
      ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], 22);
    }
    ctx.world.markFloorTexDirty();
    ctx.world.markFogDirty();

    room.name = `${room.name} ${WALL_SNAKE_TAG}${x0},${y0},${w},${h}]`;
    return;
  }
}

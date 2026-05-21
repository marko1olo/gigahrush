import { Feature, Tex, type Room } from '../../core/types';
import {
  addItemDrop,
  randomRoomCell,
  roomCenter,
  type ProceduralAnomalyGenContext,
} from './common';

const LIVING_TUNNEL_ROOM_PREFIX = 'Живые тоннели:';
const LIVING_TUNNEL_TAG = '[living_tunnel:';

function hash32(v: number): number {
  v |= 0;
  v ^= v >>> 16;
  v = Math.imul(v, 0x7feb352d);
  v ^= v >>> 15;
  v = Math.imul(v, 0x846ca68b);
  v ^= v >>> 16;
  return v >>> 0;
}

function candidateRooms(ctx: ProceduralAnomalyGenContext): Room[] {
  return ctx.rooms.filter(room => {
    if (room.id === 0 || room.sealed || room.w < 5 || room.h < 5) return false;
    const c = roomCenter(room);
    return ctx.world.dist2(ctx.spawnX, ctx.spawnY, c.x + 0.5, c.y + 0.5) > 44 * 44;
  });
}

function roomOrder(seed: number, room: Room): number {
  return hash32(seed ^ Math.imul(room.id + 1, 0x9e3779b1) ^ Math.imul(room.w + room.h, 0x85ebca6b));
}

function selectRootRooms(ctx: ProceduralAnomalyGenContext, target: number): Room[] {
  const ordered = candidateRooms(ctx).sort((a, b) => roomOrder(ctx.spec.seed, a) - roomOrder(ctx.spec.seed, b));
  const picked: Room[] = [];
  const minDist2 = (82 + ctx.spec.danger * 7) ** 2;

  for (let pass = 0; pass < 2 && picked.length < target; pass++) {
    for (const room of ordered) {
      if (picked.includes(room)) continue;
      const c = roomCenter(room);
      if (pass === 0 && picked.some(prev => {
        const pc = roomCenter(prev);
        return ctx.world.dist2(c.x, c.y, pc.x, pc.y) < minDist2;
      })) continue;
      picked.push(room);
      if (picked.length >= target) break;
    }
  }

  return picked;
}

function markRoot(ctx: ProceduralAnomalyGenContext, room: Room, placed: number): boolean {
  const pos = randomRoomCell(ctx.world, room, true);
  if (!pos) return false;
  for (const entity of ctx.entities) {
    if (entity.alive && ctx.world.dist2(entity.x, entity.y, pos.x + 0.5, pos.y + 0.5) < 2.25) return false;
  }
  const ci = ctx.world.idx(pos.x, pos.y);
  if (ctx.world.features[ci] !== Feature.NONE) return false;

  const seed = hash32(ctx.spec.seed ^ Math.imul(room.id + 11, 0x45d9f3b) ^ Math.imul(placed + 1, 0x27d4eb2d));
  const maxLen = 52 + ctx.spec.danger * 18 + (placed % 3) * 9;
  ctx.world.features[ci] = Feature.APPARATUS;
  ctx.world.floorTex[ci] = Tex.F_GUT;
  ctx.world.wallTex[ci] = Tex.GUT;
  ctx.world.fog[ci] = Math.max(ctx.world.fog[ci], 32);
  ctx.world.light[ci] = Math.max(ctx.world.light[ci], 0.58);
  ctx.world.stamp(pos.x, pos.y, 0.5, 0.5, 0.82, 0.66, seed, 58, 170, 126, false);

  const prefix = room.name.startsWith(LIVING_TUNNEL_ROOM_PREFIX) ? room.name : `${LIVING_TUNNEL_ROOM_PREFIX} ${room.name}`;
  room.name = `${prefix} ${LIVING_TUNNEL_TAG}${pos.x},${pos.y},${seed},${maxLen}]`;

  if (placed === 0) addItemDrop(ctx, pos.x + 2, pos.y, 'sealant_tube', 1);
  else if (placed === 1 && ctx.spec.danger >= 3) addItemDrop(ctx, pos.x - 2, pos.y, 'relay_diagram', 1);
  return true;
}

export function applyLivingTunnels(ctx: ProceduralAnomalyGenContext): void {
  const target = 4 + ctx.spec.danger * 2;
  const rooms = selectRootRooms(ctx, target);
  let placed = 0;

  for (const room of rooms) {
    if (!markRoot(ctx, room, placed)) continue;
    placed++;
    if (placed >= target) break;
  }

  if (placed > 0) {
    ctx.world.markFloorTexDirty();
    ctx.world.markWallTexDirty();
    ctx.world.markFogDirty();
  }
}

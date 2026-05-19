import { Feature, RoomType } from '../../core/types';
import { MarkType, stampMark } from '../../render/marks';
import {
  addItemDrop,
  randomRoomCell,
  roomCenter,
  type ProceduralAnomalyGenContext,
} from './common';

const AMNESIA_ROOM_PREFIX = 'Амнезийная зона';
const MEMORY_LOOT = ['cloth_roll', 'cleaning_kit', 'relay_diagram', 'inspection_mirror'];

export function applyCementMemory(ctx: ProceduralAnomalyGenContext): void {
  const rooms = ctx.rooms
    .filter(room => room.id !== 0 && room.w >= 7 && room.h >= 7)
    .sort((a, b) => {
      const ac = roomCenter(a);
      const bc = roomCenter(b);
      return ctx.world.dist2(ctx.spawnX, ctx.spawnY, bc.x, bc.y) - ctx.world.dist2(ctx.spawnX, ctx.spawnY, ac.x, ac.y);
    });
  const count = Math.min(4, Math.max(2, 1 + ctx.spec.danger), rooms.length);

  for (let i = 0; i < count; i++) {
    const room = rooms[(i * 3) % rooms.length];
    room.name = `${AMNESIA_ROOM_PREFIX} ${i + 1}: ${room.name}`;
    const center = roomCenter(room);

    for (let n = 0; n < 10; n++) {
      const pos = randomRoomCell(ctx.world, room);
      if (!pos) continue;
      stampMark(ctx.world, pos.x, pos.y, 0.5, 0.5, 0.24, MarkType.SCORCH, ctx.spec.seed + room.id * 37 + n, 74, 72, 64, 95);
    }

    const panel = randomRoomCell(ctx.world, room, true);
    if (panel) ctx.world.features[ctx.world.idx(panel.x, panel.y)] = Feature.APPARATUS;
    if (i < MEMORY_LOOT.length) {
      const loot = randomRoomCell(ctx.world, room);
      if (loot) addItemDrop(ctx, loot.x, loot.y, MEMORY_LOOT[i], 1);
    }
    stampMark(ctx.world, center.x, center.y, 0.5, 0.5, Math.min(1.6, Math.max(room.w, room.h) / 14), MarkType.PSI, ctx.spec.seed ^ (room.id * 101), 165, 170, 150, 70);
  }

  for (const room of ctx.rooms) {
    if (room.type !== RoomType.CORRIDOR && room.type !== RoomType.COMMON) continue;
    if (Math.random() > 0.18) continue;
    const pos = randomRoomCell(ctx.world, room);
    if (!pos) continue;
    stampMark(ctx.world, pos.x, pos.y, 0.5, 0.5, 0.38, MarkType.SPLAT, ctx.spec.seed + room.id * 911, 42, 39, 33, 90);
  }
}

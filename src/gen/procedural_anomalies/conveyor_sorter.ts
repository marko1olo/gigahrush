import { Cell, Feature, RoomType } from '../../core/types';
import { MarkType, stampMark } from '../../render/marks';
import {
  addItemDrop,
  randomRoomCell,
  type ProceduralAnomalyGenContext,
} from './common';

const CONVEYOR_ROOM_PREFIX = 'Сортировочный конвейер';
const SORTER_LOOT = ['filter_layer', 'valve_tag', 'relay_diagram', 'duct_tape', 'forged_ration_card'];

export function applyConveyorSorter(ctx: ProceduralAnomalyGenContext): void {
  const rooms = ctx.rooms.filter(room =>
    room.id !== 0 &&
    room.w >= 10 &&
    room.h >= 8 &&
    (room.type === RoomType.PRODUCTION || room.type === RoomType.CORRIDOR || room.type === RoomType.STORAGE || room.type === RoomType.COMMON)
  );
  const count = Math.min(5, Math.max(2, 1 + ctx.spec.danger), rooms.length);

  for (let i = 0; i < count; i++) {
    const room = rooms[(i * 5) % rooms.length];
    room.name = `${CONVEYOR_ROOM_PREFIX} ${i + 1}: ${room.name}`;
    drawConveyorLoop(ctx, room, i);

    const control = randomRoomCell(ctx.world, room, true);
    if (control) ctx.world.features[ctx.world.idx(control.x, control.y)] = Feature.APPARATUS;
    const receiver = randomRoomCell(ctx.world, room, true);
    if (receiver) ctx.world.features[ctx.world.idx(receiver.x, receiver.y)] = Feature.SHELF;
    const loot = randomRoomCell(ctx.world, room);
    if (loot) addItemDrop(ctx, loot.x, loot.y, SORTER_LOOT[i % SORTER_LOOT.length], 1 + (ctx.spec.danger >= 4 ? 1 : 0));
  }
}

function drawConveyorLoop(ctx: ProceduralAnomalyGenContext, room: { id: number; x: number; y: number; w: number; h: number }, order: number): void {
  const left = room.x + 2;
  const right = room.x + room.w - 3;
  const top = room.y + 2;
  const bottom = room.y + room.h - 3;
  const seed = ctx.spec.seed + room.id * 131 + order * 17;

  for (let x = left; x <= right; x++) {
    stampConveyorCell(ctx, x, top, seed + x, 65, 91, 96);
    stampConveyorCell(ctx, x, bottom, seed + x + 9000, 95, 79, 54);
  }
  for (let y = top; y <= bottom; y++) {
    stampConveyorCell(ctx, right, y, seed + y + 3000, 65, 91, 96);
    stampConveyorCell(ctx, left, y, seed + y + 6000, 95, 79, 54);
  }

  const center = { x: room.x + Math.floor(room.w / 2), y: room.y + Math.floor(room.h / 2) };
  stampMark(ctx.world, center.x, center.y, 0.5, 0.5, 0.55, MarkType.BULLET, seed ^ 0x5a17, 180, 176, 132, 130);
}

function stampConveyorCell(ctx: ProceduralAnomalyGenContext, x: number, y: number, seed: number, r: number, g: number, b: number): void {
  const ci = ctx.world.idx(x, y);
  if (ctx.world.cells[ci] !== Cell.FLOOR) return;
  stampMark(ctx.world, x, y, 0.5, 0.5, 0.18, MarkType.BULLET, seed, r, g, b, 120);
  if ((seed & 7) === 0 && ctx.world.features[ci] === Feature.NONE) ctx.world.features[ci] = Feature.MACHINE;
}

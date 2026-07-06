import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world';
import { W, Cell, RoomType } from '../src/core/types';
import { connectRoomsMST, ensureConnectivity, stampRoom } from '../src/gen/shared';
import { ROOM_DEFS } from '../src/data/rooms';

// Ensure ROOM_DEFS has something for tests
if (!ROOM_DEFS[RoomType.ADMIN]) ROOM_DEFS[RoomType.ADMIN] = { name: 'Admin', wallTex: 1, floorTex: 1 } as any;
if (!ROOM_DEFS[RoomType.BATHROOM]) ROOM_DEFS[RoomType.BATHROOM] = { name: 'Bathroom', wallTex: 1, floorTex: 1 } as any;
if (!ROOM_DEFS[RoomType.STORAGE]) ROOM_DEFS[RoomType.STORAGE] = { name: 'Storage', wallTex: 1, floorTex: 1 } as any;
if (!ROOM_DEFS[RoomType.MEDICAL]) ROOM_DEFS[RoomType.MEDICAL] = { name: 'Medical', wallTex: 1, floorTex: 1 } as any;

test('Procedural floor generation produces fully connected walkable area', () => {
  const world = new World();

  const rooms = [];
  rooms.push(stampRoom(world, 0, RoomType.ADMIN, 10, 10, 10, 10, -1));
  rooms.push(stampRoom(world, 1, RoomType.BATHROOM, 50, 10, 5, 5, -1));
  rooms.push(stampRoom(world, 2, RoomType.STORAGE, 10, 50, 6, 6, -1));
  rooms.push(stampRoom(world, 3, RoomType.MEDICAL, 80, 80, 8, 8, -1));

  connectRoomsMST(world, rooms);

  const spawnX = rooms[0].x + 5;
  const spawnY = rooms[0].y + 5;

  ensureConnectivity(world, spawnX, spawnY);

  assert.ok(world.rooms[0] && world.rooms[1] && world.rooms[2] && world.rooms[3], 'All 4 rooms should still exist in the world registry if they are connected');

  const reachable = new Uint8Array(W * W);
  const q: number[] = [world.idx(Math.floor(spawnX), Math.floor(spawnY))];
  reachable[q[0]] = 1;
  let head = 0;
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];

  while (head < q.length) {
    const curr = q[head++];
    const cx = curr % W;
    const cy = (curr / W) | 0;
    for (const [dx, dy] of dirs) {
      const nx = world.wrap(cx + dx);
      const ny = world.wrap(cy + dy);
      const ni = world.idx(nx, ny);
      if (reachable[ni] === 0 && (world.cells[ni] === Cell.FLOOR || world.cells[ni] === Cell.DOOR || world.cells[ni] === Cell.WATER)) {
        reachable[ni] = 1;
        q.push(ni);
      }
    }
  }

  let room3Reachable = false;
  for (let dy = 0; dy < rooms[3].h; dy++) {
    for (let dx = 0; dx < rooms[3].w; dx++) {
      if (reachable[world.idx(rooms[3].x + dx, rooms[3].y + dy)]) {
        room3Reachable = true;
        break;
      }
    }
  }

  assert.ok(room3Reachable, 'Room 3 should be reachable from Room 0');
});

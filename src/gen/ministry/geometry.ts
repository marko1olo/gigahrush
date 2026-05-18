/* -- Ministry macro geometry -------------------------------------
 * Axes, rings, queues and private cuts that sit under the procedural
 * office maze. The base generator adds smaller rooms around this graph.
 */

import {
  W, Cell, Tex, RoomType, Feature, DoorState,
  type Room,
} from '../../core/types';
import { World } from '../../core/world';

export interface MinistryMacroGeometry {
  nextRoomId: number;
  rooms: Room[];
  carpetCells: number[];
}

type RouteKind = 'public' | 'queue' | 'service' | 'authority';

const CENTER = Math.floor(W / 2);

function routeFloor(kind: RouteKind): Tex {
  switch (kind) {
    case 'public': return Tex.F_RED_CARPET;
    case 'queue': return Tex.F_GREEN_CARPET;
    case 'authority': return Tex.F_PARQUET;
    case 'service':
    default: return Tex.F_MARBLE_TILE;
  }
}

function carveRouteCell(
  world: World,
  x: number,
  y: number,
  floorTex: Tex,
  carpetCells: number[],
): void {
  const ci = world.idx(x, y);
  if (world.aptMask[ci]) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.MARBLE;
  world.floorTex[ci] = floorTex;
  if (floorTex === Tex.F_RED_CARPET) carpetCells.push(ci);
}

function carveLine(
  world: World,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  halfW: number,
  kind: RouteKind,
  carpetCells: number[],
): void {
  const floorTex = routeFloor(kind);
  if (y0 === y1) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    for (let x = minX; x <= maxX; x++) {
      for (let t = -halfW; t <= halfW; t++) {
        const tex = kind === 'public' && Math.abs(t) > 2 ? Tex.F_MARBLE_TILE : floorTex;
        carveRouteCell(world, x, y0 + t, tex, carpetCells);
      }
    }
    return;
  }

  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  for (let y = minY; y <= maxY; y++) {
    for (let t = -halfW; t <= halfW; t++) {
      const tex = kind === 'public' && Math.abs(t) > 2 ? Tex.F_MARBLE_TILE : floorTex;
      carveRouteCell(world, x0 + t, y, tex, carpetCells);
    }
  }
}

function carveRectLoop(
  world: World,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  halfW: number,
  kind: RouteKind,
  carpetCells: number[],
): void {
  carveLine(world, x0, y0, x1, y0, halfW, kind, carpetCells);
  carveLine(world, x1, y0, x1, y1, halfW, kind, carpetCells);
  carveLine(world, x1, y1, x0, y1, halfW, kind, carpetCells);
  carveLine(world, x0, y1, x0, y0, halfW, kind, carpetCells);
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR && world.features[ci] === Feature.NONE) {
    world.features[ci] = feature;
  }
}

function addRouteDoor(
  world: World,
  x: number,
  y: number,
  state: DoorState,
  keyId: string,
): void {
  const ci = world.idx(x, y);
  if (world.aptMask[ci]) return;
  world.cells[ci] = Cell.DOOR;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = state === DoorState.LOCKED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
  world.doors.set(ci, {
    idx: ci,
    state,
    roomA: -1,
    roomB: -1,
    keyId,
    timer: 0,
  });
}

function makeOpenLandmark(
  world: World,
  id: number,
  name: string,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  floorTex: Tex,
): Room {
  const room: Room = {
    id,
    type,
    x,
    y,
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex: Tex.MARBLE,
    floorTex,
  };
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.aptMask[ci]) continue;
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = id;
      world.wallTex[ci] = Tex.MARBLE;
      world.floorTex[ci] = floorTex;
    }
  }
  world.rooms[id] = room;
  return room;
}

function addCourtyardColumns(world: World, room: Room): void {
  for (let dy = 5; dy < room.h - 4; dy += 7) {
    for (let dx = 6; dx < room.w - 5; dx += 8) {
      const ci = world.idx(room.x + dx, room.y + dy);
      world.cells[ci] = Cell.WALL;
      world.roomMap[ci] = -1;
      world.wallTex[ci] = Tex.MARBLE;
    }
  }
  for (let dx = 3; dx < room.w - 2; dx += 8) {
    setFeature(world, room.x + dx, room.y + 2, Feature.LAMP);
    setFeature(world, room.x + dx, room.y + room.h - 3, Feature.LAMP);
  }
}

function addArchiveShelves(world: World, x0: number, y0: number, x1: number, y1: number): void {
  for (let x = x0; x <= x1; x += 8) {
    setFeature(world, x, y0 - 2, Feature.SHELF);
    setFeature(world, x, y1 + 2, Feature.SHELF);
  }
  for (let y = y0; y <= y1; y += 8) {
    setFeature(world, x0 - 2, y, Feature.SHELF);
    setFeature(world, x1 + 2, y, Feature.SHELF);
  }
}

function carveQueueSerpent(
  world: World,
  x: number,
  y: number,
  w: number,
  lanes: number,
  carpetCells: number[],
): void {
  const gap = 8;
  for (let lane = 0; lane < lanes; lane++) {
    const ly = y + lane * gap;
    carveLine(world, x, ly, x + w, ly, 1, 'queue', carpetCells);
    if (lane < lanes - 1) {
      const cx = lane % 2 === 0 ? x + w : x;
      carveLine(world, cx, ly, cx, ly + gap, 1, 'queue', carpetCells);
    }
  }
  for (let lane = 0; lane < lanes; lane++) {
    const ly = y + lane * gap;
    const counterX = lane % 2 === 0 ? x + w - 8 : x + 8;
    for (let i = 0; i < 5; i++) {
      setFeature(world, counterX + i, ly - 2, Feature.DESK);
      setFeature(world, counterX + i, ly + 2, Feature.CHAIR);
    }
  }
}

function makeShelterRoom(world: World, id: number, x: number, y: number, w: number, h: number): Room {
  const room: Room = {
    id,
    type: RoomType.COMMON,
    x,
    y,
    w,
    h,
    doors: [],
    sealed: false,
    name: 'Дежурное укрытие комиссара',
    apartmentId: -1,
    wallTex: Tex.HERMO_WALL,
    floorTex: Tex.F_MARBLE_TILE,
  };

  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.aptMask[ci]) continue;
      world.roomMap[ci] = -1;
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) {
        world.cells[ci] = Cell.FLOOR;
        world.roomMap[ci] = id;
        world.floorTex[ci] = Tex.F_MARBLE_TILE;
        continue;
      }
      world.cells[ci] = Cell.WALL;
      world.wallTex[ci] = Tex.HERMO_WALL;
      world.hermoWall[ci] = 1;
    }
  }

  const doorX = x + Math.floor(w / 2);
  const doorY = y + h;
  const doorIdx = world.idx(doorX, doorY);
  world.cells[doorIdx] = Cell.DOOR;
  world.wallTex[doorIdx] = Tex.DOOR_METAL;
  world.hermoWall[doorIdx] = 0;
  world.doors.set(doorIdx, {
    idx: doorIdx,
    state: DoorState.HERMETIC_OPEN,
    roomA: id,
    roomB: -1,
    keyId: '',
    timer: 0,
  });
  room.doors.push(doorIdx);

  for (let dx = -1; dx <= 1; dx++) {
    const ci = world.idx(doorX + dx, doorY + 1);
    world.cells[ci] = Cell.FLOOR;
    world.roomMap[ci] = -1;
    world.floorTex[ci] = Tex.F_MARBLE_TILE;
  }
  setFeature(world, x + 2, y + 2, Feature.SHELF);
  setFeature(world, x + w - 3, y + 2, Feature.SHELF);
  setFeature(world, x + Math.floor(w / 2), y + Math.floor(h / 2), Feature.TABLE);
  setFeature(world, x + Math.floor(w / 2), y + 1, Feature.LAMP);

  world.rooms[id] = room;
  return room;
}

export function applyMinistryMacroGeometry(world: World, nextRoomId: number): MinistryMacroGeometry {
  const rooms: Room[] = [];
  const carpetCells: number[] = [];

  // Public axes and nested public rings.
  carveLine(world, 112, CENTER, W - 112, CENTER, 6, 'public', carpetCells);
  carveLine(world, CENTER, 112, CENTER, W - 112, 6, 'public', carpetCells);
  carveRectLoop(world, 184, 184, W - 184, W - 184, 4, 'public', carpetCells);
  carveRectLoop(world, 304, 304, W - 304, W - 304, 3, 'public', carpetCells);
  carveRectLoop(world, 424, 424, W - 424, W - 424, 2, 'queue', carpetCells);

  // Archive/service backroutes: thinner marble loops offset from the carpet graph.
  carveRectLoop(world, 232, 276, W - 232, W - 276, 1, 'service', carpetCells);
  carveRectLoop(world, 276, 232, W - 276, W - 232, 1, 'service', carpetCells);
  carveLine(world, 232, 384, W - 232, 384, 1, 'service', carpetCells);
  carveLine(world, 232, 640, W - 232, 640, 1, 'service', carpetCells);
  carveLine(world, 384, 232, 384, W - 232, 1, 'service', carpetCells);
  carveLine(world, 640, 232, 640, W - 232, 1, 'service', carpetCells);
  addArchiveShelves(world, 232, 276, W - 232, W - 276);
  addArchiveShelves(world, 276, 232, W - 276, W - 232);

  // Clerk queue switchbacks beside the central axis, plus a visible bypass.
  carveQueueSerpent(world, 232, 468, 184, 7, carpetCells);
  carveQueueSerpent(world, 608, 468, 184, 7, carpetCells);
  carveLine(world, 232, 532, 416, 532, 1, 'service', carpetCells);
  carveLine(world, 608, 532, 792, 532, 1, 'service', carpetCells);
  addRouteDoor(world, 324, 532, DoorState.CLOSED, '');
  addRouteDoor(world, 700, 532, DoorState.CLOSED, '');

  // Locked authority shortcut: a fast private cut across the rings.
  carveLine(world, 352, 456, 672, 456, 2, 'authority', carpetCells);
  carveLine(world, 536, 456, 536, 506, 1, 'authority', carpetCells);
  carveLine(world, 488, 456, 488, 304, 1, 'authority', carpetCells);
  carveLine(world, 584, 456, 584, 720, 1, 'authority', carpetCells);
  addRouteDoor(world, 536, 505, DoorState.LOCKED, 'key');
  addRouteDoor(world, 352, 456, DoorState.LOCKED, 'key');
  addRouteDoor(world, 672, 456, DoorState.LOCKED, 'key');
  addRouteDoor(world, 488, 304, DoorState.LOCKED, 'key');
  addRouteDoor(world, 584, 720, DoorState.LOCKED, 'key');

  // Document-gate chokepoints on the public graph. They can be opened, fought
  // through, or avoided by queue/service/authority routes.
  addRouteDoor(world, 384, CENTER, DoorState.CLOSED, '');
  addRouteDoor(world, 640, CENTER, DoorState.CLOSED, '');
  addRouteDoor(world, CENTER, 384, DoorState.CLOSED, '');
  addRouteDoor(world, CENTER, 640, DoorState.CLOSED, '');
  for (const [gx, gy] of [[384, CENTER], [640, CENTER], [CENTER, 384], [CENTER, 640]] as const) {
    setFeature(world, gx - 2, gy - 2, Feature.DESK);
    setFeature(world, gx + 2, gy + 2, Feature.DESK);
    setFeature(world, gx - 3, gy + 2, Feature.CHAIR);
    setFeature(world, gx + 3, gy - 2, Feature.CHAIR);
  }

  const courtyardSpecs: [string, number, number][] = [
    ['Северо-западный мраморный двор', 300, 300],
    ['Северо-восточный мраморный двор', 686, 300],
    ['Юго-западный мраморный двор', 300, 686],
    ['Юго-восточный мраморный двор', 686, 686],
  ];
  for (const [name, x, y] of courtyardSpecs) {
    const room = makeOpenLandmark(world, nextRoomId++, name, RoomType.COMMON, x, y, 38, 28, Tex.F_MARBLE_TILE);
    addCourtyardColumns(world, room);
    rooms.push(room);
  }

  const vestibule = makeOpenLandmark(
    world,
    nextRoomId++,
    'Центральный вестибюль входящих дел',
    RoomType.COMMON,
    CENTER - 16,
    CENTER - 16,
    33,
    33,
    Tex.F_RED_CARPET,
  );
  for (let d = 4; d < vestibule.w - 3; d += 8) {
    setFeature(world, vestibule.x + d, vestibule.y + 3, Feature.LAMP);
    setFeature(world, vestibule.x + d, vestibule.y + vestibule.h - 4, Feature.LAMP);
  }
  rooms.push(vestibule);

  rooms.push(makeShelterRoom(world, nextRoomId++, CENTER - 16, CENTER - 26, 16, 9));

  return { nextRoomId, rooms, carpetCells };
}

/* ── Kvartiry macro geometry: hostile lived-in housing ───────── */

import {
  W, Cell, Tex, Feature, RoomType,
  type Room,
} from '../../core/types';
import { World } from '../../core/world';
import { rng } from '../shared';

type MotifKind =
  | 'courtyard'
  | 'stairwell'
  | 'apartment_chain'
  | 'shared_kitchen'
  | 'bathroom_bottleneck'
  | 'market_strip';

interface MotifRect {
  kind: MotifKind;
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  type: RoomType;
  wallTex: Tex;
  floorTex: Tex;
}

export interface KvartiryGeometryPlan {
  motifs: MotifRect[];
  courtyards: number;
  stairwells: number;
  apartmentChains: number;
  sharedKitchens: number;
  bathroomBottlenecks: number;
  marketStrips: number;
  chokepoints: number;
  shortcutDoors: number;
}

function emptyPlan(): KvartiryGeometryPlan {
  return {
    motifs: [],
    courtyards: 0,
    stairwells: 0,
    apartmentChains: 0,
    sharedKitchens: 0,
    bathroomBottlenecks: 0,
    marketStrips: 0,
    chokepoints: 0,
    shortcutDoors: 0,
  };
}

function put(world: World, x: number, y: number, cell: Cell, wallTex: Tex, floorTex: Tex): void {
  const i = world.idx(x, y);
  if (world.aptMask[i]) return;
  world.cells[i] = cell;
  if (cell === Cell.WALL || cell === Cell.DOOR) world.wallTex[i] = wallTex;
  if (cell === Cell.FLOOR) world.floorTex[i] = floorTex;
  if (cell !== Cell.FLOOR) world.features[i] = Feature.NONE;
}

function feature(world: World, x: number, y: number, f: Feature): void {
  const i = world.idx(x, y);
  if (world.cells[i] === Cell.FLOOR && world.features[i] === Feature.NONE) world.features[i] = f;
}

function shell(world: World, x: number, y: number, w: number, h: number, wallTex: Tex, floorTex: Tex): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const border = dx < 0 || dx >= w || dy < 0 || dy >= h;
      put(world, x + dx, y + dy, border ? Cell.WALL : Cell.FLOOR, wallTex, floorTex);
    }
  }
}

function carveRun(
  world: World,
  x: number,
  y: number,
  len: number,
  horizontal: boolean,
  width: number,
  floorTex: Tex,
): void {
  const half = Math.floor(width / 2);
  for (let s = 0; s < len; s++) {
    for (let o = -half; o <= half; o++) {
      const cx = horizontal ? x + s : x + o;
      const cy = horizontal ? y + o : y + s;
      put(world, cx, cy, Cell.FLOOR, Tex.PANEL, floorTex);
    }
  }
}

function door(world: World, x: number, y: number, wallTex = Tex.DOOR_WOOD): void {
  put(world, x, y, Cell.DOOR, wallTex, Tex.F_LINO);
}

function pushMotif(
  plan: KvartiryGeometryPlan,
  kind: MotifKind,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  type: RoomType,
  wallTex: Tex,
  floorTex: Tex,
): void {
  plan.motifs.push({ kind, x, y, w, h, name, type, wallTex, floorTex });
}

function addCourtyard(world: World, plan: KvartiryGeometryPlan, cx: number, cy: number, serial: number): void {
  const w = 42 + (serial % 3) * 6;
  const h = 30 + ((serial + 1) % 3) * 4;
  const x = cx - (w >> 1);
  const y = cy - (h >> 1);
  shell(world, x, y, w, h, Tex.BRICK, Tex.F_CONCRETE);

  const midX = x + (w >> 1);
  const midY = y + (h >> 1);
  const north = y - 1;
  const south = y + h;
  const west = x - 1;
  const east = x + w;

  door(world, midX - 1, north);
  door(world, midX, north);
  door(world, midX, south);
  door(world, west, midY);
  door(world, east, midY);
  carveRun(world, midX - 14, midY, 29, true, 3, Tex.F_CONCRETE);
  carveRun(world, midX, midY - 10, 21, false, 3, Tex.F_CONCRETE);

  for (let xOff = -12; xOff <= 12; xOff += 6) {
    put(world, midX + xOff, midY - 1, Cell.WALL, Tex.BRICK, Tex.F_CONCRETE);
    feature(world, midX + xOff + 1, midY + 1, Feature.TABLE);
  }
  feature(world, midX - 6, midY + 4, Feature.LAMP);
  feature(world, midX + 6, midY - 4, Feature.LAMP);

  carveRun(world, west - 18, midY, 18, true, 3, Tex.F_LINO);
  carveRun(world, east + 1, midY, 18, true, 3, Tex.F_LINO);
  carveRun(world, midX, north - 16, 16, false, 3, Tex.F_LINO);

  pushMotif(plan, 'courtyard', x, y, w, h, `Двор-колодец ${serial + 1}`, RoomType.COMMON, Tex.BRICK, Tex.F_CONCRETE);
  plan.courtyards++;
  plan.chokepoints += 4;
}

function addStairwellKnot(world: World, plan: KvartiryGeometryPlan, cx: number, cy: number, serial: number): void {
  const x = cx - 5;
  const y = cy - 5;
  shell(world, x, y, 11, 11, Tex.CONCRETE, Tex.F_TILE);
  carveRun(world, cx - 18, cy, 37, true, 3, Tex.F_TILE);
  carveRun(world, cx, cy - 18, 37, false, 3, Tex.F_TILE);
  door(world, x + 5, y - 1, Tex.DOOR_METAL);
  door(world, x + 5, y + 11, Tex.DOOR_METAL);
  door(world, x - 1, y + 5, Tex.DOOR_METAL);
  door(world, x + 11, y + 5, Tex.DOOR_METAL);

  put(world, cx - 1, cy - 1, Cell.WALL, Tex.CONCRETE, Tex.F_TILE);
  put(world, cx + 1, cy + 1, Cell.WALL, Tex.CONCRETE, Tex.F_TILE);
  feature(world, cx, cy, Feature.LAMP);
  feature(world, cx - 3, cy + 3, Feature.SHELF);
  feature(world, cx + 3, cy - 3, Feature.CHAIR);

  pushMotif(plan, 'stairwell', x, y, 11, 11, `Лестничный узел ${serial + 1}`, RoomType.CORRIDOR, Tex.CONCRETE, Tex.F_TILE);
  plan.stairwells++;
  plan.chokepoints += 4;
}

function roomFeature(type: RoomType): Feature {
  switch (type) {
    case RoomType.KITCHEN: return Feature.STOVE;
    case RoomType.BATHROOM: return Feature.TOILET;
    case RoomType.STORAGE: return Feature.SHELF;
    case RoomType.SMOKING: return Feature.CHAIR;
    default: return Feature.BED;
  }
}

function addApartmentChain(
  world: World,
  plan: KvartiryGeometryPlan,
  x: number,
  y: number,
  horizontal: boolean,
  serial: number,
): void {
  const count = 4 + (serial % 3);
  const rw = 7;
  const rh = 5;
  const step = horizontal ? rw + 1 : rh + 1;
  const types = [RoomType.LIVING, RoomType.KITCHEN, RoomType.BATHROOM, RoomType.LIVING, RoomType.STORAGE, RoomType.SMOKING];
  const chainW = horizontal ? count * rw + count - 1 : rw;
  const chainH = horizontal ? rh : count * rh + count - 1;

  for (let n = 0; n < count; n++) {
    const rx = horizontal ? x + n * step : x;
    const ry = horizontal ? y : y + n * step;
    const type = types[n % types.length];
    const tex = type === RoomType.BATHROOM ? Tex.F_TILE : type === RoomType.KITCHEN ? Tex.F_LINO : Tex.F_WOOD;
    shell(world, rx, ry, rw, rh, type === RoomType.BATHROOM ? Tex.TILE_W : Tex.PANEL, tex);
    feature(world, rx + 2, ry + 2, roomFeature(type));
    if (type === RoomType.KITCHEN) feature(world, rx + 4, ry + 2, Feature.SINK);
    if (type === RoomType.BATHROOM) feature(world, rx + 4, ry + 2, Feature.SINK);
    if (type === RoomType.LIVING) feature(world, rx + 4, ry + 3, Feature.TABLE);

    if (n > 0) {
      const dx = horizontal ? rx - 1 : rx + (rw >> 1);
      const dy = horizontal ? ry + (rh >> 1) : ry - 1;
      door(world, dx, dy);
      plan.shortcutDoors++;
    }
  }

  if (horizontal) {
    door(world, x - 1, y + (rh >> 1));
    door(world, x + chainW, y + (rh >> 1));
    carveRun(world, x - 12, y + (rh >> 1), 12, true, 1, Tex.F_LINO);
    carveRun(world, x + chainW + 1, y + (rh >> 1), 12, true, 1, Tex.F_LINO);
  } else {
    door(world, x + (rw >> 1), y - 1);
    door(world, x + (rw >> 1), y + chainH);
    carveRun(world, x + (rw >> 1), y - 12, 12, false, 1, Tex.F_LINO);
    carveRun(world, x + (rw >> 1), y + chainH + 1, 12, false, 1, Tex.F_LINO);
  }
  plan.shortcutDoors += 2;
  pushMotif(plan, 'apartment_chain', x, y, chainW, chainH, `Сквозная квартира ${serial + 1}`, RoomType.LIVING, Tex.PANEL, Tex.F_WOOD);
  plan.apartmentChains++;
  plan.chokepoints += 2;
}

function addSharedKitchen(world: World, plan: KvartiryGeometryPlan, cx: number, cy: number, serial: number): void {
  const w = 20;
  const h = 9;
  const x = cx - 10;
  const y = cy - 4;
  shell(world, x, y, w, h, Tex.TILE_W, Tex.F_LINO);
  door(world, x - 1, y + 4);
  door(world, x + w, y + 4);
  carveRun(world, x - 14, y + 4, 14, true, 1, Tex.F_LINO);
  carveRun(world, x + w + 1, y + 4, 14, true, 1, Tex.F_LINO);

  for (let dx = 2; dx < w - 2; dx += 4) {
    feature(world, x + dx, y + 2, Feature.STOVE);
    feature(world, x + dx + 1, y + h - 3, Feature.TABLE);
  }
  feature(world, x + 1, y + 1, Feature.SINK);
  feature(world, x + w - 2, y + 1, Feature.LAMP);

  pushMotif(plan, 'shared_kitchen', x, y, w, h, `Общая кухня ${serial + 1}`, RoomType.KITCHEN, Tex.TILE_W, Tex.F_LINO);
  plan.sharedKitchens++;
  plan.chokepoints += 2;
}

function addBathroomBottleneck(
  world: World,
  plan: KvartiryGeometryPlan,
  cx: number,
  cy: number,
  horizontal: boolean,
  serial: number,
): void {
  const len = 24;
  const hallX = horizontal ? cx - (len >> 1) : cx;
  const hallY = horizontal ? cy : cy - (len >> 1);
  carveRun(world, hallX, hallY, len, horizontal, 1, Tex.F_TILE);

  const roomW = 5;
  const roomH = 4;
  for (let n = 0; n < 3; n++) {
    const off = 5 + n * 7;
    const rx = horizontal ? hallX + off - 2 : hallX - 7;
    const ry = horizontal ? hallY - 6 : hallY + off - 2;
    const rx2 = horizontal ? hallX + off - 2 : hallX + 3;
    const ry2 = horizontal ? hallY + 2 : hallY + off - 2;
    shell(world, rx, ry, roomW, roomH, Tex.TILE_W, Tex.F_TILE);
    shell(world, rx2, ry2, roomW, roomH, Tex.TILE_W, Tex.F_TILE);
    door(world, horizontal ? rx + 2 : rx + roomW, horizontal ? ry + roomH : ry + 2);
    door(world, horizontal ? rx2 + 2 : rx2 - 1, horizontal ? ry2 - 1 : ry2 + 2);
    feature(world, rx + 1, ry + 1, Feature.TOILET);
    feature(world, rx2 + 1, ry2 + 1, Feature.SINK);
  }

  const blockX = horizontal ? cx : cx - 1;
  const blockY = horizontal ? cy - 1 : cy;
  put(world, blockX, blockY, Cell.WALL, Tex.TILE_W, Tex.F_TILE);
  put(world, horizontal ? cx : cx + 1, horizontal ? cy + 1 : cy, Cell.WALL, Tex.TILE_W, Tex.F_TILE);

  pushMotif(plan, 'bathroom_bottleneck', cx - 12, cy - 12, 24, 24, `Санузельный перешеек ${serial + 1}`, RoomType.BATHROOM, Tex.TILE_W, Tex.F_TILE);
  plan.bathroomBottlenecks++;
  plan.chokepoints += 3;
}

function addMarketStrip(
  world: World,
  plan: KvartiryGeometryPlan,
  x: number,
  y: number,
  len: number,
  horizontal: boolean,
  serial: number,
): void {
  carveRun(world, x, y, len, horizontal, 3, Tex.F_LINO);
  const half = 1;
  for (let s = 0; s < len; s++) {
    const sideA = horizontal ? [x + s, y - half - 1] : [x - half - 1, y + s];
    const sideB = horizontal ? [x + s, y + half + 1] : [x + half + 1, y + s];
    if (s % 9 < 6) {
      put(world, sideA[0], sideA[1], Cell.WALL, Tex.PANEL, Tex.F_LINO);
      put(world, sideB[0], sideB[1], Cell.WALL, Tex.PANEL, Tex.F_LINO);
    } else {
      door(world, sideA[0], sideA[1]);
      door(world, sideB[0], sideB[1]);
      plan.shortcutDoors += 2;
    }

    if (s % 11 === 3) feature(world, horizontal ? x + s : x - 1, horizontal ? y - 1 : y + s, Feature.TABLE);
    if (s % 13 === 7) feature(world, horizontal ? x + s : x + 1, horizontal ? y + 1 : y + s, Feature.SHELF);
    if (s % 31 === 15) {
      put(world, horizontal ? x + s : x - 1, horizontal ? y - 1 : y + s, Cell.WALL, Tex.CONCRETE, Tex.F_LINO);
      put(world, horizontal ? x + s : x + 1, horizontal ? y + 1 : y + s, Cell.WALL, Tex.CONCRETE, Tex.F_LINO);
      plan.chokepoints++;
    }
  }

  const w = horizontal ? len : 3;
  const h = horizontal ? 3 : len;
  pushMotif(plan, 'market_strip', x, y, w, h, `Коридорный рынок ${serial + 1}`, RoomType.CORRIDOR, Tex.PANEL, Tex.F_LINO);
  plan.marketStrips++;
}

function addWallPocket(world: World, cx: number, cy: number, w: number, h: number): void {
  const x = cx - (w >> 1);
  const y = cy - (h >> 1);
  for (let dy = -1; dy <= h; dy++)
    for (let dx = -1; dx <= w; dx++)
      put(world, x + dx, y + dy, Cell.WALL, Tex.PANEL, Tex.F_LINO);
}

function reserveSocialPoiWallPockets(world: World): void {
  const pockets: [number, number, number, number][] = [
    [76, 28, 48, 28], [-88, 18, 48, 28], [34, -86, 50, 30], [-46, 96, 50, 30],
    [126, -66, 56, 32], [-138, -74, 56, 32], [116, 124, 56, 34], [-128, 136, 56, 34],
    [186, 16, 60, 34], [-198, 24, 60, 34], [22, 188, 60, 34], [28, -198, 60, 34],
    [226, 104, 64, 36], [-238, 112, 64, 36], [214, -158, 64, 36], [-226, -166, 64, 36],
    [94, 258, 64, 38], [-104, 266, 64, 38], [282, -18, 66, 38], [-292, -22, 66, 38],
    [318, 142, 68, 40], [-326, 148, 68, 40], [148, -314, 68, 40], [-158, -318, 68, 40],
  ];
  for (const [dx, dy, w, h] of pockets) addWallPocket(world, W / 2 + dx, W / 2 + dy, w, h);
}

function connectNeighborhoods(world: World, centers: [number, number][], plan: KvartiryGeometryPlan): void {
  for (let row = 0; row < 4; row++) {
    const a = centers[row * 4];
    const d = centers[row * 4 + 3];
    const y = Math.round((a[1] + d[1]) / 2) + (row % 2 === 0 ? 38 : -38);
    addMarketStrip(world, plan, 72, y, W - 144, true, row);
  }
  for (let col = 0; col < 4; col++) {
    const a = centers[col];
    const d = centers[12 + col];
    const x = Math.round((a[0] + d[0]) / 2) + (col % 2 === 0 ? -34 : 34);
    addMarketStrip(world, plan, x, 72, W - 144, false, col + 4);
  }
}

export function applyKvartiryGeometry(world: World): KvartiryGeometryPlan {
  const plan = emptyPlan();
  const centers: [number, number][] = [];

  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const serial = gy * 4 + gx;
      const cx = 128 + gx * 256 + rng(-22, 22);
      const cy = 128 + gy * 256 + rng(-22, 22);
      centers.push([cx, cy]);
      addCourtyard(world, plan, cx, cy, serial);
      addStairwellKnot(world, plan, cx - 54, cy - 48, serial);
      addApartmentChain(world, plan, cx + 28, cy - 62, serial % 2 === 0, serial);
      addSharedKitchen(world, plan, cx - 24, cy + 42, serial);
      if ((serial & 1) === 0) addBathroomBottleneck(world, plan, cx + 56, cy + 34, true, serial);
    }
  }

  addStairwellKnot(world, plan, W / 2, W / 2, 16);
  addCourtyard(world, plan, W / 2, W / 2 - 46, 16);
  addApartmentChain(world, plan, W / 2 + 18, W / 2 + 26, true, 16);
  addBathroomBottleneck(world, plan, W / 2 - 46, W / 2 + 30, false, 16);
  connectNeighborhoods(world, centers, plan);
  reserveSocialPoiWallPockets(world);
  return plan;
}

function setRoomTexture(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const i = world.idx(room.x + dx, room.y + dy);
      if (world.roomMap[i] !== room.id) continue;
      world.floorTex[i] = floorTex;
      for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const ni = world.idx(room.x + dx + ox, room.y + dy + oy);
        if (world.cells[ni] === Cell.WALL || world.cells[ni] === Cell.DOOR) world.wallTex[ni] = wallTex;
      }
    }
  }
}

function collectRooms(world: World, motif: MotifRect): number[] {
  const ids: number[] = [];
  for (let dy = 0; dy < motif.h; dy++) {
    for (let dx = 0; dx < motif.w; dx++) {
      const id = world.roomMap[world.idx(motif.x + dx, motif.y + dy)];
      if (id < 0 || ids.includes(id)) continue;
      ids.push(id);
    }
  }
  return ids;
}

export function decorateKvartiryGeometry(world: World, plan: KvartiryGeometryPlan): void {
  for (const motif of plan.motifs) {
    const roomIds = collectRooms(world, motif);
    let n = 0;
    for (const roomId of roomIds) {
      const room = world.rooms[roomId];
      if (!room) continue;
      room.type = motif.type;
      room.name = roomIds.length > 1 ? `${motif.name}.${++n}` : motif.name;
      room.wallTex = motif.wallTex;
      room.floorTex = motif.floorTex;
      setRoomTexture(world, room, motif.wallTex, motif.floorTex);
    }
  }
}

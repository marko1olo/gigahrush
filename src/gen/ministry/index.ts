/* ── Ministry floor generator (Floor 0) — МИНИСТЕРСТВО ────────── */
/*   Organic labyrinth: DFS maze macro-corridors → medium rooms →   */
/*   small closets. Procedural portraits (64 variants, coord-hash). */
/*   Edge-aware red carpet tiling. Marble walls. Parquet floors.    */

import {
  W, Cell, Tex, RoomType, Feature, LiftDirection, DoorState,
  type Room, type Entity,
  EntityType, AIGoal, FloorLevel,
} from '../../core/types';
import { World } from '../../core/world';
import { rng, pick, shuffle, placeLifts, generateZones, ensureConnectivity } from '../shared';
import { placeProceduralScreens } from '../procedural_screens';
import { calcZoneLevel, randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { Spr, monsterSpr } from '../../render/sprite_index';
import { MonsterKind } from '../../core/types';
import { runMinistryContent } from './content_manifest';
import { applyMinistryMacroGeometry } from './geometry';
import { entitySpawnSlots } from '../../systems/entity_limits';
import { activeActorCountAtDefaultSoftLimit } from '../../data/entity_limits';

const MINISTRY_MONSTER_TARGET_AT_DEFAULT_CAP = 30;

/* ── Portrait picker — coordinate-hash like posters ───────────── */
const PORTRAIT_COUNT = 64;
export function pickPortraitTex(x: number, y: number): Tex {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1103515245;
  h = (h ^ (h >> 16)) & 0x7fffffff;
  return (Tex.PORTRAIT_BASE + (h % PORTRAIT_COUNT)) as Tex;
}

/* ── Carpet edge mask: which edges border non-carpet cells ────── */
function carpetEdgeTex(world: World, x: number, y: number): Tex {
  let mask = 0;
  const isCarpet = (cx: number, cy: number): boolean => {
    const ci = world.idx(cx, cy);
    const ft = world.floorTex[ci];
    return ft === Tex.F_RED_CARPET || (ft >= Tex.F_CARPET_EDGE_BASE && ft <= Tex.F_CARPET_EDGE_BASE + 15);
  };
  if (!isCarpet(x, world.wrap(y - 1))) mask |= 1; // N
  if (!isCarpet(world.wrap(x + 1), y)) mask |= 2; // E
  if (!isCarpet(x, world.wrap(y + 1))) mask |= 4; // S
  if (!isCarpet(world.wrap(x - 1), y)) mask |= 8; // W
  if (mask === 0) return Tex.F_RED_CARPET;
  return (Tex.F_CARPET_EDGE_BASE + mask) as Tex;
}

/* ── Room type definitions ────────────────────────────────────── */
const MINISTRY_ROOM_TYPES: { type: RoomType; name: string; weight: number; isHall: boolean; isGallery: boolean }[] = [
  { type: RoomType.COMMON,   name: 'Зал заседаний',     weight: 12, isHall: true,  isGallery: false },
  { type: RoomType.OFFICE,   name: 'Кабинет',           weight: 35, isHall: false, isGallery: false },
  { type: RoomType.COMMON,   name: 'Приёмная',          weight: 8,  isHall: true,  isGallery: false },
  { type: RoomType.STORAGE,  name: 'Архив',             weight: 8,  isHall: false, isGallery: false },
  { type: RoomType.CORRIDOR, name: 'Портретная галерея',weight: 8,  isHall: false, isGallery: true },
  { type: RoomType.MEDICAL,  name: 'Медкабинет',        weight: 4,  isHall: false, isGallery: false },
  { type: RoomType.SMOKING,  name: 'Курительная',       weight: 5,  isHall: false, isGallery: false },
  { type: RoomType.KITCHEN,  name: 'Буфет',             weight: 5,  isHall: false, isGallery: false },
  { type: RoomType.OFFICE,   name: 'Кабинет директора', weight: 4,  isHall: false, isGallery: false },
  { type: RoomType.COMMON,   name: 'Атриум',            weight: 6,  isHall: true,  isGallery: false },
  { type: RoomType.BATHROOM, name: 'Туалет',            weight: 6,  isHall: false, isGallery: false },
];

function pickRoomType(forceHall = false): typeof MINISTRY_ROOM_TYPES[0] {
  const pool = forceHall ? MINISTRY_ROOM_TYPES.filter(r => r.isHall) : MINISTRY_ROOM_TYPES;
  let total = 0;
  for (const r of pool) total += r.weight;
  let roll = rng(1, total);
  for (const r of pool) { roll -= r.weight; if (roll <= 0) return r; }
  return pool[0];
}

/* ── Main generator ───────────────────────────────────────────── */
export function generateMinistry(): { world: World; entities: Entity[]; spawnX: number; spawnY: number } {
  const world = new World();
  const entities: Entity[] = [];
  let nextId = 1;
  let nextRoomId = 0;

  // Default wall texture = marble everywhere
  for (let i = 0; i < W * W; i++) world.wallTex[i] = Tex.MARBLE;

  const rooms: Room[] = [];

  /* ══════════════════════════════════════════════════════════════
     Phase 1: DFS maze on coarse grid → macro corridors
     Each maze cell is CELL×CELL world tiles. Corridors are 5 wide 
     carved between cells. Creates organic, non-grid layout.
     ══════════════════════════════════════════════════════════════ */
  const CELL = 22;                         // maze cell size in world tiles
  const GRID = Math.floor(W / CELL);       // number of maze cells per axis (46 for 1024/22)
  const CORR_HALF = 2;                     // corridor half-width (total 5)

  // DFS maze — visited[gy * GRID + gx]
  const visited = new Uint8Array(GRID * GRID);
  // Edges: Set of "gx1,gy1-gx2,gy2" strings indicating connected cells
  const edges = new Set<string>();
  // Connection count per cell (for hall placement at junctions)
  const connections = new Uint8Array(GRID * GRID);

  function gWrap(v: number): number { return ((v % GRID) + GRID) % GRID; }
  function gIdx(gx: number, gy: number): number { return gWrap(gy) * GRID + gWrap(gx); }
  function edgeKey(gx1: number, gy1: number, gx2: number, gy2: number): string {
    const a = gIdx(gx1, gy1), b = gIdx(gx2, gy2);
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  // Iterative DFS with randomized neighbors
  {
    const stack: [number, number][] = [];
    const startGx = Math.floor(GRID / 2), startGy = Math.floor(GRID / 2);
    stack.push([startGx, startGy]);
    visited[gIdx(startGx, startGy)] = 1;

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors: [number, number][] = [];
      for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
        const nx = gWrap(cx + dx), ny = gWrap(cy + dy);
        if (!visited[gIdx(nx, ny)]) neighbors.push([nx, ny]);
      }
      if (neighbors.length === 0) { stack.pop(); continue; }
      const [nx, ny] = pick(neighbors);
      visited[gIdx(nx, ny)] = 1;
      edges.add(edgeKey(cx, cy, nx, ny));
      connections[gIdx(cx, cy)]++;
      connections[gIdx(nx, ny)]++;
      stack.push([nx, ny]);
    }

    // Extra edges (~15% of cells) for loops — makes exploration less tedious
    const extraEdges = Math.floor(GRID * GRID * 0.15);
    for (let e = 0; e < extraEdges; e++) {
      const gx = rng(0, GRID - 1), gy = rng(0, GRID - 1);
      const dir = rng(0, 3);
      const dirs: [number, number][] = [[0,-1],[1,0],[0,1],[-1,0]];
      const [dx, dy] = dirs[dir];
      const nx = gWrap(gx + dx), ny = gWrap(gy + dy);
      const key = edgeKey(gx, gy, nx, ny);
      if (!edges.has(key)) {
        edges.add(key);
        connections[gIdx(gx, gy)]++;
        connections[gIdx(nx, ny)]++;
      }
    }
  }

  // Carve corridors between connected maze cells
  const carpetCells = new Set<number>();

  function carveCell(wx: number, wy: number, isCarpet: boolean): void {
    const ci = world.idx(wx, wy);
    if (world.cells[ci] === Cell.WALL) {
      world.cells[ci] = Cell.FLOOR;
      world.floorTex[ci] = isCarpet ? Tex.F_RED_CARPET : Tex.F_MARBLE_TILE;
      if (isCarpet) carpetCells.add(ci);
    } else if (world.cells[ci] === Cell.FLOOR && isCarpet) {
      // Crossing corridor: upgrade marble to carpet at intersections
      world.floorTex[ci] = Tex.F_RED_CARPET;
      carpetCells.add(ci);
    }
  }

  function carveLine(x0: number, y0: number, x1: number, y1: number, halfW: number): void {
    if (y0 === y1) {
      const yc = y0;
      const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
      for (let x = minX; x <= maxX; x++) {
        for (let t = -halfW; t <= halfW; t++) {
          carveCell(world.wrap(x), world.wrap(yc + t), Math.abs(t) <= 1);
        }
      }
    } else {
      const xc = x0;
      const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
      for (let y = minY; y <= maxY; y++) {
        for (let t = -halfW; t <= halfW; t++) {
          carveCell(world.wrap(xc + t), world.wrap(y), Math.abs(t) <= 1);
        }
      }
    }
  }

  // For each connected pair of cells, carve a corridor between their centers
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const cx = gx * CELL + Math.floor(CELL / 2);
      const cy = gy * CELL + Math.floor(CELL / 2);
      // Check right neighbor
      {
        const ngx = gWrap(gx + 1);
        if (edges.has(edgeKey(gx, gy, ngx, gy))) {
          const ncx = ngx * CELL + Math.floor(CELL / 2);
          // Handle toroidal wrap: carve in world space
          if (ngx > gx || ngx === 0) {
            // Normal or wrap from end to 0
            if (ngx > gx) {
              carveLine(cx, cy, ncx, cy, CORR_HALF);
            } else {
              // Wrapping: carve cx→W-1, then 0→ncx
              carveLine(cx, cy, W - 1, cy, CORR_HALF);
              carveLine(0, cy, ncx, cy, CORR_HALF);
            }
          }
        }
      }
      // Check bottom neighbor
      {
        const ngy = gWrap(gy + 1);
        if (edges.has(edgeKey(gx, gy, gx, ngy))) {
          const ncy = ngy * CELL + Math.floor(CELL / 2);
          if (ngy > gy) {
            carveLine(cx, cy, cx, ncy, CORR_HALF);
          } else {
            carveLine(cx, cy, cx, W - 1, CORR_HALF);
            carveLine(cx, 0, cx, ncy, CORR_HALF);
          }
        }
      }
    }
  }

  // Carve small clearings at each maze cell center (intersection widening)
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const cx = gx * CELL + Math.floor(CELL / 2);
      const cy = gy * CELL + Math.floor(CELL / 2);
      const conn = connections[gIdx(gx, gy)];
      const r = conn >= 3 ? 4 : 3;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          carveCell(world.wrap(cx + dx), world.wrap(cy + dy), Math.abs(dx) <= 1 && Math.abs(dy) <= 1);
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 1b: Ministry macro graph — axes, rings, queues, service
     backroutes and locked authority shortcuts over the organic maze.
     ══════════════════════════════════════════════════════════════ */
  {
    const macro = applyMinistryMacroGeometry(world, nextRoomId);
    nextRoomId = macro.nextRoomId;
    for (const room of macro.rooms) rooms.push(room);
    for (const ci of macro.carpetCells) carpetCells.add(ci);
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 2: Room placement — scan corridor walls and grow rooms
     Room extends AWAY from corridor, door at the boundary wall.
     Three scales: large halls, medium offices, small closets.
     ══════════════════════════════════════════════════════════════ */

  // Poster picker (coordinate-hash, like portraits)
  function pickPosterTex(x: number, y: number): Tex {
    let h = (x * 531241233 + y * 817263851) | 0;
    h = (h ^ (h >> 13)) * 1103515245;
    h = (h ^ (h >> 16)) & 0x7fffffff;
    return (Tex.POSTER_BASE + (h % 64)) as Tex;
  }

  function tryGrowRoom(
    wallX: number, wallY: number,  // wall cell adjacent to corridor
    cdx: number, cdy: number,      // direction FROM wall TOWARD corridor
    rw: number, rh: number,
    rt: typeof MINISTRY_ROOM_TYPES[0],
  ): boolean {
    // Room extends in direction opposite to corridor (-cdx, -cdy)
    let rx: number, ry: number;
    if (cdx > 0) {
      // Corridor to the right → room extends left
      rx = world.wrap(wallX - rw);
      ry = world.wrap(wallY - Math.floor(rh / 2));
    } else if (cdx < 0) {
      // Corridor to the left → room extends right
      rx = world.wrap(wallX + 1);
      ry = world.wrap(wallY - Math.floor(rh / 2));
    } else if (cdy > 0) {
      // Corridor below → room extends up
      rx = world.wrap(wallX - Math.floor(rw / 2));
      ry = world.wrap(wallY - rh);
    } else {
      // Corridor above → room extends down
      rx = world.wrap(wallX - Math.floor(rw / 2));
      ry = world.wrap(wallY + 1);
    }

    // Check entire room + 1-cell border is all walls
    for (let dy = -1; dy <= rh; dy++) {
      for (let dx = -1; dx <= rw; dx++) {
        const ci = world.idx(world.wrap(rx + dx), world.wrap(ry + dy));
        if (world.cells[ci] !== Cell.WALL) return false;
      }
    }

    const floorTex = rt.isHall ? Tex.F_GREEN_CARPET
      : rt.isGallery ? Tex.F_PARQUET
      : (rt.type === RoomType.OFFICE) ? Tex.F_PARQUET
      : Tex.F_MARBLE_TILE;

    const room: Room = {
      id: nextRoomId, type: rt.type,
      x: rx, y: ry, w: rw, h: rh,
      doors: [], sealed: false,
      name: `${rt.name} #${nextRoomId}`,
      apartmentId: -1,
      wallTex: Tex.MARBLE,
      floorTex,
    };

    // Carve room interior + ensure wall border
    for (let dy = -1; dy <= rh; dy++) {
      for (let dx = -1; dx <= rw; dx++) {
        const ci = world.idx(world.wrap(room.x + dx), world.wrap(room.y + dy));
        if (dx >= 0 && dx < rw && dy >= 0 && dy < rh) {
          world.cells[ci] = Cell.FLOOR;
          world.floorTex[ci] = floorTex;
          world.wallTex[ci] = Tex.MARBLE;
          world.roomMap[ci] = nextRoomId;
        } else {
          if (world.cells[ci] !== Cell.FLOOR) {
            world.cells[ci] = Cell.WALL;
            world.wallTex[ci] = Tex.MARBLE;
          }
        }
      }
    }

    // Place door at the original wall cell (between corridor and room)
    const doorCi = world.idx(wallX, wallY);
    if (world.cells[doorCi] === Cell.WALL) {
      world.cells[doorCi] = Cell.DOOR;
      world.doors.set(doorCi, {
        idx: doorCi, state: DoorState.CLOSED,
        roomA: nextRoomId, roomB: -1, keyId: '', timer: 0,
      });
      room.doors.push(doorCi);
    } else {
      // Fallback: find any wall on room border adjacent to corridor
      connectRoomToCorridor(world, room);
    }

    // Furniture
    if (rt.isHall && rw >= 8 && rh >= 6) {
      const tableY = room.y + Math.floor(rh / 2);
      for (let tx = room.x + 2; tx < room.x + rw - 2; tx++) {
        const tci = world.idx(world.wrap(tx), tableY);
        if (world.cells[tci] === Cell.FLOOR && world.features[tci] === Feature.NONE)
          world.features[tci] = Feature.TABLE;
        for (const chairDy of [-1, 1]) {
          const cci = world.idx(world.wrap(tx), world.wrap(tableY + chairDy));
          if (world.cells[cci] === Cell.FLOOR && world.features[cci] === Feature.NONE)
            world.features[cci] = Feature.CHAIR;
        }
      }
      if (rw >= 10 && rh >= 10) {
        for (let dy = 3; dy < rh - 2; dy += 4) {
          for (let dx = 3; dx < rw - 2; dx += 4) {
            const ci = world.idx(world.wrap(room.x + dx), world.wrap(room.y + dy));
            if (world.cells[ci] === Cell.FLOOR && world.features[ci] === Feature.NONE) {
              world.cells[ci] = Cell.WALL;
              world.wallTex[ci] = Tex.MARBLE;
            }
          }
        }
      }
    } else if (rt.type === RoomType.OFFICE) {
      const dcx = room.x + Math.floor(rw / 2);
      const dcy = room.y + Math.floor(rh / 2);
      const dci = world.idx(world.wrap(dcx), world.wrap(dcy));
      if (world.cells[dci] === Cell.FLOOR) world.features[dci] = Feature.DESK;
      const chci = world.idx(world.wrap(dcx), world.wrap(dcy + 1));
      if (world.cells[chci] === Cell.FLOOR && world.features[chci] === Feature.NONE)
        world.features[chci] = Feature.CHAIR;
    } else if (rt.type === RoomType.BATHROOM) {
      // Toilets + sink
      for (let ty = 0; ty < rh; ty += 2) {
        const tci = world.idx(world.wrap(room.x), world.wrap(room.y + ty));
        if (world.cells[tci] === Cell.FLOOR && world.features[tci] === Feature.NONE)
          world.features[tci] = Feature.TOILET;
      }
      const sci = world.idx(world.wrap(room.x + rw - 1), world.wrap(room.y));
      if (world.cells[sci] === Cell.FLOOR && world.features[sci] === Feature.NONE)
        world.features[sci] = Feature.SINK;
    }

    // Portraits on room walls (only inside rooms!)
    placePortraitsOnWalls(world, room, rt);

    world.rooms[nextRoomId] = room;
    rooms.push(room);
    nextRoomId++;
    return true;
  }

  // Collect corridor-adjacent wall cells (potential doorways)
  const wallCandidates: { x: number; y: number; cdx: number; cdy: number }[] = [];
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const ci = world.idx(x, y);
      if (world.cells[ci] !== Cell.WALL) continue;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const ni = world.idx(world.wrap(x + dx), world.wrap(y + dy));
        if (world.cells[ni] === Cell.FLOOR && world.roomMap[ni] < 0) {
          wallCandidates.push({ x, y, cdx: dx, cdy: dy });
          break; // one entry per wall cell
        }
      }
    }
  }

  // Shuffle candidates
  shuffle(wallCandidates);

  // Pass 1: Large halls (8-14 wide)
  let roomsPlaced = 0;
  for (const cand of wallCandidates) {
    if (roomsPlaced >= 80) break;
    if (rng(1, 1000) > 15) continue;
    const rt = pickRoomType(true);
    const rw = rng(8, 14), rh = rng(7, 12);
    if (tryGrowRoom(cand.x, cand.y, cand.cdx, cand.cdy, rw, rh, rt)) roomsPlaced++;
  }

  // Pass 2: Medium offices/rooms (4-9 wide)
  roomsPlaced = 0;
  for (const cand of wallCandidates) {
    if (roomsPlaced >= 320) break;
    if (rng(1, 100) > 4) continue;
    const rt = pickRoomType();
    const rw = rng(4, 9), rh = rng(3, 7);
    if (tryGrowRoom(cand.x, cand.y, cand.cdx, cand.cdy, rw, rh, rt)) roomsPlaced++;
  }

  // Pass 3: Small closets (3-5 wide)
  const smallTypes = MINISTRY_ROOM_TYPES.filter(r => r.type === RoomType.SMOKING || r.type === RoomType.STORAGE || r.type === RoomType.MEDICAL || r.type === RoomType.BATHROOM);
  roomsPlaced = 0;
  for (const cand of wallCandidates) {
    if (roomsPlaced >= 180) break;
    if (rng(1, 100) > 3) continue;
    const rt = pick(smallTypes);
    const rw = rng(3, 5), rh = rng(3, 5);
    if (tryGrowRoom(cand.x, cand.y, cand.cdx, cand.cdy, rw, rh, rt)) roomsPlaced++;
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 3: Procedural posters on corridor walls (~5%)
     ══════════════════════════════════════════════════════════════ */
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.WALL) continue;
    let facesCorr = false;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ni = world.idx(world.wrap(x + dx), world.wrap(y + dy));
      if (world.cells[ni] === Cell.FLOOR && world.roomMap[ni] < 0) { facesCorr = true; break; }
    }
    if (!facesCorr) continue;
    if (rng(1, 100) <= 5) {
      world.wallTex[ci] = pickPosterTex(x, y);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 6: Edge-aware carpet tiling
     ══════════════════════════════════════════════════════════════ */
  for (const ci of carpetCells) {
    const x = ci % W;
    const y = (ci / W) | 0;
    world.floorTex[ci] = carpetEdgeTex(world, x, y);
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 7: Spawn point
     ══════════════════════════════════════════════════════════════ */
  const centerX = Math.floor(W / 2);
  const centerY = Math.floor(W / 2);
  let spawnX = centerX + 0.5, spawnY = centerY + 0.5;
  for (let r = 0; r < 50; r++) {
    let found = false;
    for (let dy = -r; dy <= r && !found; dy++) {
      for (let dx = -r; dx <= r && !found; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const ci = world.idx(world.wrap(centerX + dx), world.wrap(centerY + dy));
        if (world.cells[ci] === Cell.FLOOR) {
          spawnX = world.wrap(centerX + dx) + 0.5;
          spawnY = world.wrap(centerY + dy) + 0.5;
          found = true;
        }
      }
    }
    if (found) break;
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 8: Lifts — all DOWN (to living zone)
     ══════════════════════════════════════════════════════════════ */
  placeLifts(world, 16, LiftDirection.DOWN);

  /* ══════════════════════════════════════════════════════════════
     Phase 9: Zones
     ══════════════════════════════════════════════════════════════ */
  generateZones(world);
  for (const z of world.zones) {
    z.level = calcZoneLevel(z.cx, z.cy, FloorLevel.MINISTRY);
    const roll = rng(1, 100);
    if (roll <= 45) z.faction = 0;       // CITIZEN
    else if (roll <= 75) z.faction = 1;  // LIQUIDATOR
    else z.faction = 0;                   // CITIZEN
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 10: Lights
     ══════════════════════════════════════════════════════════════ */
  // Room lights
  for (const room of rooms) {
    for (let dy = 1; dy < room.h - 1; dy += 3) {
      for (let dx = 1; dx < room.w - 1; dx += 3) {
        const ci = world.idx(world.wrap(room.x + dx), world.wrap(room.y + dy));
        if (world.cells[ci] === Cell.FLOOR && world.features[ci] === Feature.NONE)
          world.features[ci] = Feature.LAMP;
      }
    }
  }

  // Corridor lights — every ~5 cells on any corridor floor
  for (let y = 0; y < W; y += 5) {
    for (let x = 0; x < W; x += 5) {
      const ci = world.idx(x, y);
      if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] < 0 && world.features[ci] === Feature.NONE)
        world.features[ci] = Feature.LAMP;
    }
  }

  world.bakeLights();

  /* ══════════════════════════════════════════════════════════════
     Phase 11: Items
     ══════════════════════════════════════════════════════════════ */
  for (const room of rooms) {
    const numItems = rng(0, 2);
    for (let n = 0; n < numItems; n++) {
      const defs = ['bread', 'water', 'tea', 'pills', 'bandage', 'cigs', 'book', 'note'];
      const defId = pick(defs);
      const ix = room.x + rng(0, Math.max(0, room.w - 1));
      const iy = room.y + rng(0, Math.max(0, room.h - 1));
      entities.push({
        id: nextId++, type: EntityType.ITEM_DROP,
        x: ix + 0.5, y: iy + 0.5, angle: 0, pitch: 0,
        alive: true, speed: 0, sprite: Spr.ITEM_DROP,
        inventory: [{ defId, count: 1 }],
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 12: Monsters — very few
     ══════════════════════════════════════════════════════════════ */
  let monsterCount = 0;
  const monsterTarget = entitySpawnSlots(entities, EntityType.MONSTER, activeActorCountAtDefaultSoftLimit(MINISTRY_MONSTER_TARGET_AT_DEFAULT_CAP));
  for (let attempt = 0; attempt < 10_000 && monsterCount < monsterTarget; attempt++) {
    const ci = rng(0, W * W - 1);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    if (world.roomMap[ci] >= 0) continue;
    const mx = (ci % W) + 0.5, my = ((ci / W) | 0) + 0.5;
    const kind = MonsterKind.SBORKA;
    const zid = world.zoneMap[ci];
    const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 1) : 1;
    const rpg = randomRPG(zoneLevel);
    entities.push({
      id: nextId++, type: EntityType.MONSTER,
      x: mx, y: my, angle: rng(0, 360) * Math.PI / 180, pitch: 0,
      alive: true, speed: scaleMonsterSpeed(2.8, zoneLevel), sprite: monsterSpr(MonsterKind.SBORKA),
      hp: scaleMonsterHp(5, zoneLevel), maxHp: scaleMonsterHp(5, zoneLevel),
      monsterKind: kind, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg,
    });
    monsterCount++;
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 12b-13: Manifest-owned administrative content
     ══════════════════════════════════════════════════════════════ */
  {
    const r = runMinistryContent(world, entities, nextRoomId, nextId, spawnX, spawnY);
    nextRoomId = r.nextRoomId;
    nextId = r.nextId;
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 14: Connectivity
     ══════════════════════════════════════════════════════════════ */
  ensureConnectivity(world, spawnX, spawnY);

  /* ══════════════════════════════════════════════════════════════
     Phase 15: Rare procedural ministry monitors
     ══════════════════════════════════════════════════════════════ */
  placeProceduralScreens(world, FloorLevel.MINISTRY);

  return { world, entities, spawnX, spawnY };
}

/* ── Helper: connect room to nearest corridor via door ────────── */
function connectRoomToCorridor(world: World, room: Room): void {
  const wallCells: { ci: number; wx: number; wy: number; probeX: number; probeY: number }[] = [];
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) continue;
      const wx = world.wrap(room.x + dx);
      const wy = world.wrap(room.y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.WALL) continue;
      for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const px = world.wrap(wx + ox), py = world.wrap(wy + oy);
        const pci = world.idx(px, py);
        if (world.cells[pci] === Cell.FLOOR && world.roomMap[pci] < 0) {
          wallCells.push({ ci, wx, wy, probeX: ox, probeY: oy });
        }
      }
    }
  }
  if (wallCells.length > 0) {
    // Shuffle and pick first
    const chosen = pick(wallCells);
    world.cells[chosen.ci] = Cell.DOOR;
    world.doors.set(chosen.ci, {
      idx: chosen.ci, state: DoorState.CLOSED,
      roomA: room.id, roomB: -1, keyId: '', timer: 0,
    });
    room.doors.push(chosen.ci);
    return;
  }
  // Fallback: open any wall adjacent to any floor
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) continue;
      const wx = world.wrap(room.x + dx);
      const wy = world.wrap(room.y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.WALL) continue;
      for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
        const ni = world.idx(world.wrap(wx + ox), world.wrap(wy + oy));
        if (world.cells[ni] === Cell.FLOOR) {
          world.cells[ci] = Cell.FLOOR;
          world.floorTex[ci] = Tex.F_MARBLE_TILE;
          return;
        }
      }
    }
  }
}

/* ── Helper: place portraits on room walls ────────────────────── */
function placePortraitsOnWalls(world: World, room: Room, rt: typeof MINISTRY_ROOM_TYPES[0]): void {
  const candidates: { ci: number; x: number; y: number }[] = [];
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) continue;
      const wx = world.wrap(room.x + dx);
      const wy = world.wrap(room.y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] === Cell.WALL) candidates.push({ ci, x: wx, y: wy });
    }
  }
  const count = rt.isGallery ? Math.min(candidates.length, rng(6, 12))
    : rt.isHall ? rng(2, 5)
    : rt.type === RoomType.OFFICE ? rng(1, 3)
    : rng(0, 2);
  shuffle(candidates);
  for (let p = 0; p < count && p < candidates.length; p++) {
    const { ci, x, y } = candidates[p];
    world.wallTex[ci] = pickPortraitTex(x, y);
  }
}

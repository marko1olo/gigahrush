const fs = require('fs');

let content = fs.readFileSync('src/gen/kvartiry/index.ts', 'utf8');

const helpers = `
function fillRooms(world: World, DX: number[], DY: number[], nextRoomId: number): number {
  // Phase 5: Fill rooms (BFS flood-fill)
  const roomZones = new Int32Array(W * W).fill(-1);
  let roomN = 0;

  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.FLOOR || roomZones[i] >= 0) continue;
    const roomCells: number[] = [];
    roomZones[i] = roomN;
    const frontier = [i];
    let fHead = 0;
    while (fHead < frontier.length) {
      const ci = frontier[fHead++];
      roomCells.push(ci);
      const cx = ci % W, cy = (ci / W) | 0;
      for (let s = 0; s < 4; s++) {
        const ni = world.idx(world.wrap(cx + DX[s]), world.wrap(cy + DY[s]));
        if (world.cells[ni] === Cell.FLOOR && roomZones[ni] < 0) {
          roomZones[ni] = roomN;
          frontier.push(ni);
        }
      }
    }

    if (roomCells.length < 1) { roomN++; continue; }

    // Compute bounding box for room
    let minX = W, maxX = 0, minY = W, maxY = 0;
    for (const ci of roomCells) {
      const x = ci % W, y = (ci / W) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Assign a room type
    const rt = pickKvRoomType();
    const tex = roomTextures(rt.type);

    const room: Room = {
      id: nextRoomId++,
      type: rt.type,
      x: minX, y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1,
      doors: [],
      sealed: false,
      name: rt.name,
      apartmentId: -1,
      wallTex: tex.wall,
      floorTex: tex.floor,
    };
    world.rooms.push(room);

    // Apply textures
    for (const ci of roomCells) {
      world.roomMap[ci] = room.id;
      world.floorTex[ci] = tex.floor;
    }
    // Set wall textures around room cells
    for (const ci of roomCells) {
      const cx = ci % W, cy = (ci / W) | 0;
      for (let s = 0; s < 4; s++) {
        const ni = world.idx(world.wrap(cx + DX[s]), world.wrap(cy + DY[s]));
        if (world.cells[ni] === Cell.WALL) world.wallTex[ni] = tex.wall;
      }
    }

    // Place features in rooms large enough
    if (roomCells.length >= 2) {
      placeRoomFeatures(world, room);
    }

    roomN++;
  }
  linkKvartiryDoorsToRooms(world);
  return nextRoomId;
}

function setupLifts(world: World, DX: number[], DY: number[]): void {
  // Phase 7: Lifts (BEFORE room assignment eats all floor cells)
  for (let i = 0; i < W * W; i++) {
    const rid = world.roomMap[i];
    if (rid >= 0) {
      const room = world.rooms[rid];
      if (room && (room.type === RoomType.CORRIDOR || room.type === RoomType.COMMON)) {
        world.roomMap[i] = -1;
      }
    }
  }
  placeLifts(world, 16, LiftDirection.UP);    // up to жилая
  placeLifts(world, 16, LiftDirection.DOWN);  // down to министерство
  // Restore roomMap for cells that didn't become lifts
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.FLOOR && world.roomMap[i] < 0) {
      // Re-find room by checking neighbors
      const ix = i % W, iy = (i / W) | 0;
      for (let s = 0; s < 4; s++) {
        const ni = world.idx(world.wrap(ix + DX[s]), world.wrap(iy + DY[s]));
        if (world.roomMap[ni] >= 0) {
          world.roomMap[i] = world.roomMap[ni];
          break;
        }
      }
    }
  }
}

`;

content = content.replace(
  "function initBaseGrid(world: World)",
  helpers + "function initBaseGrid(world: World)"
);

const searchStartPhase5 = "  // ── Phase 5: Fill rooms (BFS flood-fill) ──────────────────────";
const searchEndPhase6 = "  // ── Phase 6: Zones (64 macro-regions) ─────────────────────────";

const idxStartPhase5 = content.indexOf(searchStartPhase5);
const idxEndPhase6 = content.indexOf(searchEndPhase6);

if (idxStartPhase5 !== -1 && idxEndPhase6 !== -1) {
  const replacementPhase5 = `  nextRoomId = fillRooms(world, DX, DY, nextRoomId);

`;
  content = content.substring(0, idxStartPhase5) + replacementPhase5 + content.substring(idxEndPhase6);
} else {
  console.log('Failed to find Phase 5 replace block');
}

const searchStartPhase7 = "  // ── Phase 7: Lifts (BEFORE room assignment eats all floor cells) ──";
const searchEndPhase8 = "  // ── Phase 8: Light map ────────────────────────────────────────";

const idxStartPhase7 = content.indexOf(searchStartPhase7);
const idxEndPhase8 = content.indexOf(searchEndPhase8);

if (idxStartPhase7 !== -1 && idxEndPhase8 !== -1) {
    const replacementPhase7 = `  setupLifts(world, DX, DY);

`;
    content = content.substring(0, idxStartPhase7) + replacementPhase7 + content.substring(idxEndPhase8);
    fs.writeFileSync('src/gen/kvartiry/index.ts', content);
    console.log('Success');
} else {
    console.log('Failed to find Phase 7 replace block');
}

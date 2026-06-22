const fs = require('fs');

let content = fs.readFileSync('src/gen/kvartiry/index.ts', 'utf8');

const helpers = `
/* ── Generator Helper Functions ───────────────────────────────── */
function initBaseGrid(world: World): { sources: number[]; isSource: Uint8Array } {
  const sources: number[] = [];
  const isSource = new Uint8Array(W * W);

  // Phase 0: All cells start as FLOOR
  for (let i = 0; i < W * W; i++) {
    world.cells[i] = Cell.FLOOR;
    world.wallTex[i] = Tex.PANEL;
    world.floorTex[i] = Tex.F_LINO;
  }

  // Phase 1: Place source grid points
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (x % WALL_L === 0 && y % WALL_L === 0) {
        const ci = world.idx(x, y);
        sources.push(ci);
        isSource[ci] = 1;
      }
    }
  }
  return { sources, isSource };
}

function buildMazeWalls(world: World, sources: number[], isSource: Uint8Array, DX: number[], DY: number[]): void {
  // Phase 2: Build walls from sources
  let activeSources = [...sources];
  while (activeSources.length > 0) {
    const nextSources: number[] = [];
    for (const idx of activeSources) {
      const sx = idx % W;
      const sy = (idx / W) | 0;
      let wallSum = 0;
      for (let s = 0; s < 4; s++) {
        const ni = world.idx(world.wrap(sx + DX[s]), world.wrap(sy + DY[s]));
        if (world.cells[ni] === Cell.WALL) wallSum++;
      }
      if (wallSum < 2) {
        let drop = rng(0, 3);
        const nCheck = world.idx(world.wrap(sx + DX[drop]), world.wrap(sy + DY[drop]));
        if (world.cells[nCheck] === Cell.WALL) drop = (drop + 1) & 3;

        let cx = sx, cy = sy;
        for (let j = 0; j < WALL_L - 1; j++) {
          cx = world.wrap(cx + DX[drop]);
          cy = world.wrap(cy + DY[drop]);
          const ni = world.idx(cx, cy);
          if (isSource[ni]) continue;
          if (j + 1 === Math.floor(WALL_L / 2) && Math.random() < KV_SEGMENT_DOOR_CANDIDATE_CHANCE) {
            world.cells[ni] = Cell.DOOR;
          } else {
            world.cells[ni] = Cell.WALL;
          }
        }
        nextSources.push(idx);
      }
    }
    activeSources = nextSources;
  }

  for (const idx of sources) {
    world.cells[idx] = Cell.WALL;
  }
}

function connectDoors(world: World, DX: number[], DY: number[]): void {
  // Phase 3: C++ door connectivity
  let startCell = -1;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.FLOOR) { startCell = i; break; }
  }

  if (startCell >= 0) {
    const visited = new Uint8Array(W * W);
    const queue: number[] = [startCell];
    visited[startCell] = 1;
    let head = 0;
    const candidates: number[] = [];

    const floodFloors = (): void => {
      while (head < queue.length) {
        const ci = queue[head++];
        const cx = ci % W, cy = (ci / W) | 0;
        for (let s = 0; s < 4; s++) {
          const ni = world.idx(world.wrap(cx + DX[s]), world.wrap(cy + DY[s]));
          if (visited[ni]) continue;
          if (world.cells[ni] === Cell.FLOOR) {
            visited[ni] = 1;
            queue.push(ni);
          }
        }
      }
    };

    const addConnectorCandidates = (): void => {
      candidates.length = 0;
      for (let i = 0; i < W * W; i++) {
        if (world.cells[i] !== Cell.DOOR) continue;
        const x = i % W, y = (i / W) | 0;
        for (let s = 0; s < 4; s++) {
          const ai = world.idx(world.wrap(x - DX[s]), world.wrap(y - DY[s]));
          const bi = world.idx(world.wrap(x + DX[s]), world.wrap(y + DY[s]));
          if (
            (visited[ai] && world.cells[bi] === Cell.FLOOR && !visited[bi]) ||
            (visited[bi] && world.cells[ai] === Cell.FLOOR && !visited[ai])
          ) {
            candidates.push(i);
            break;
          }
        }
      }
    };

    floodFloors();
    while (true) {
      addConnectorCandidates();
      if (candidates.length === 0) break;
      let opened = 0;
      for (const idx of candidates) {
        if (Math.random() >= KV_CONNECTOR_DOOR_OPEN_CHANCE) continue;
        world.cells[idx] = Cell.FLOOR;
        visited[idx] = 1;
        queue.push(idx);
        opened++;
      }
      if (opened === 0) {
        const idx = candidates[rng(0, candidates.length - 1)];
        world.cells[idx] = Cell.FLOOR;
        visited[idx] = 1;
        queue.push(idx);
      }
      floodFloors();
    }

    for (let i = 0; i < W * W; i++) {
      if (world.cells[i] === Cell.DOOR) world.cells[i] = Cell.WALL;
    }
  }
}

function addExtraDoors(world: World): void {
  // Phase 4: Additional doors
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.FLOOR) continue;
    const x = i % W, y = (i / W) | 0;
    const northIdx = world.idx(x, world.wrap(y - 1));
    const southIdx = world.idx(x, world.wrap(y + 1));
    const eastIdx  = world.idx(world.wrap(x + 1), y);
    const westIdx  = world.idx(world.wrap(x - 1), y);
    const ns = world.cells[northIdx] === Cell.WALL && world.cells[southIdx] === Cell.WALL;
    const ew = world.cells[eastIdx] === Cell.WALL && world.cells[westIdx] === Cell.WALL;
    if (ns || ew) {
      world.cells[i] = Cell.DOOR;
    }
  }

  // Register all doors
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.DOOR) {
      world.doors.set(i, {
        idx: i,
        state: DoorState.CLOSED,
        roomA: -1,
        roomB: -1,
        keyId: '',
        timer: 0,
      });
      world.wallTex[i] = Tex.DOOR_WOOD;
    }
  }
}

`;

content = content.replace(
  "export function generateKvartiry(territorySeed = 0): { world: World; entities: Entity[]; spawnX: number; spawnY: number } {",
  helpers + "export function generateKvartiry(territorySeed = 0): { world: World; entities: Entity[]; spawnX: number; spawnY: number } {"
);

const searchStart = "  // ── Phase 0: All cells start as FLOOR (empty space) ───────────";
const searchEnd = "  // ── Phase 5: Fill rooms (BFS flood-fill) ──────────────────────";

const idxStart = content.indexOf(searchStart);
const idxEnd = content.indexOf(searchEnd);

if (idxStart !== -1 && idxEnd !== -1) {
  const toReplace = content.substring(idxStart, idxEnd);
  const replacement = `  const { sources, isSource } = initBaseGrid(world);
  buildMazeWalls(world, sources, isSource, DX, DY);
  connectDoors(world, DX, DY);
  addExtraDoors(world);

`;
  content = content.substring(0, idxStart) + replacement + content.substring(idxEnd);
  fs.writeFileSync('src/gen/kvartiry/index.ts', content);
  console.log('Success');
} else {
  console.log('Failed to find replace block');
}

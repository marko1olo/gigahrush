/* ── Maintenance tunnels generator (Floor 1) — orchestrator ──── */
/*   Randomized DFS maze (recursive backtracker) on coarse grid. */
/*   1-wide tunnel passages, rooms at junctions, pipe fragments. */

import {
  W, Cell, Tex, RoomType, Feature, LiftDirection, Faction, Occupation,
  type Room, type Entity,
  EntityType, AIGoal, MonsterKind, FloorLevel,
} from '../../core/types';
import { World } from '../../core/world';
import { rng, pick, placeLifts, generateZones, ensureConnectivity } from '../shared';
import { placeProceduralScreens } from '../procedural_screens';
import { randomName, freshNeeds } from '../../data/catalog';
import { calcZoneLevel, randomRPG, scaleMonsterHp, scaleMonsterSpeed, gaussianLevel, getMaxHp } from '../../systems/rpg';
import { runMaintenanceContent } from './content_manifest';
import { Spr, monsterSpr } from '../../render/sprite_index';
import { applyCollectorMacroGeometry } from './geometry';

/* ── Coarse grid parameters ───────────────────────────────────── */
const CELL = 6;                   // world-tiles per maze cell (walls between = 1-wide passage)
const GRID = Math.floor(W / CELL);// 1024/6 = 170 coarse cells
const EXTRA_CONN = 0.08;          // fraction of extra random connections (loops)
const MONSTER_CAP = 1000;
const NPC_CAP = 500;

/* Room type pool for maintenance floor */
const MAINT_ROOM_TYPES: { type: RoomType; name: string; weight: number }[] = [
  { type: RoomType.STORAGE,    name: 'Кладовая',     weight: 25 },
  { type: RoomType.PRODUCTION, name: 'Насосная',      weight: 20 },
  { type: RoomType.COMMON,     name: 'Коллектор',     weight: 20 },
  { type: RoomType.MEDICAL,    name: 'Медпункт',      weight: 8 },
  { type: RoomType.SMOKING,    name: 'Курилка',       weight: 10 },
  { type: RoomType.OFFICE,     name: 'Диспетчерская', weight: 10 },
  { type: RoomType.CORRIDOR,   name: 'Тоннель',       weight: 7 },
];

function pickRoomType(): { type: RoomType; name: string } {
  let total = 0;
  for (const r of MAINT_ROOM_TYPES) total += r.weight;
  let roll = Math.random() * total;
  for (const r of MAINT_ROOM_TYPES) {
    roll -= r.weight;
    if (roll <= 0) return { type: r.type, name: r.name };
  }
  return MAINT_ROOM_TYPES[0];
}

/* PSI weapon IDs for cultists */
const PSI_IDS = ['psi_strike','psi_rupture','psi_madness','psi_storm','psi_brainburn'];
function pickPsi(): string { return PSI_IDS[Math.floor(Math.random() * PSI_IDS.length)]; }

/* ── Maze edge set (undirected) stored as flat bitmask per cell ── */
const DIR_R = 1;  // +x
const DIR_D = 2;  // +y
const DIR_L = 4;  // -x
const DIR_U = 8;  // -y
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];
const DIR_BIT  = [DIR_R, DIR_D, DIR_L, DIR_U];
const OPP_BIT  = [DIR_L, DIR_U, DIR_R, DIR_D];

function gWrap(v: number): number { return ((v % GRID) + GRID) % GRID; }
function gIdx(gx: number, gy: number): number { return gWrap(gy) * GRID + gWrap(gx); }

export function generateMaintenance(): { world: World; entities: Entity[]; spawnX: number; spawnY: number } {
  const world = new World();
  const entities: Entity[] = [];
  let nextId = 1;
  let nextRoomId = 0;

  // Default wall texture = pipe
  for (let i = 0; i < W * W; i++) world.wallTex[i] = Tex.PIPE;

  /* ══════════════════════════════════════════════════════════════
     Phase 1: Randomized DFS maze on coarse GRID×GRID torus
     ══════════════════════════════════════════════════════════════ */
  const mazeOpen = new Uint8Array(GRID * GRID); // bitmask of open passages per cell
  const visited = new Uint8Array(GRID * GRID);

  // Iterative DFS (recursive backtracker)
  const stack: number[] = [];
  const startG = gIdx(Math.floor(GRID / 2), Math.floor(GRID / 2));
  visited[startG] = 1;
  stack.push(startG);

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const cx = cur % GRID;
    const cy = (cur / GRID) | 0;

    // Collect unvisited neighbors (shuffled)
    const nbrs: number[] = [];
    for (let d = 0; d < 4; d++) {
      const nx = gWrap(cx + DX[d]);
      const ny = gWrap(cy + DY[d]);
      if (!visited[gIdx(nx, ny)]) nbrs.push(d);
    }

    if (nbrs.length === 0) {
      stack.pop();
      continue;
    }

    // Pick random unvisited neighbor
    const d = nbrs[Math.floor(Math.random() * nbrs.length)];
    const nx = gWrap(cx + DX[d]);
    const ny = gWrap(cy + DY[d]);
    const ni = gIdx(nx, ny);

    // Open passage between cur and neighbor
    mazeOpen[cur] |= DIR_BIT[d];
    mazeOpen[ni] |= OPP_BIT[d];
    visited[ni] = 1;
    stack.push(ni);
  }

  // Add extra random connections for loops
  const totalCells = GRID * GRID;
  const extraCount = Math.floor(totalCells * EXTRA_CONN);
  for (let i = 0; i < extraCount; i++) {
    const ci = rng(0, totalCells - 1);
    const d = rng(0, 3);
    const cx = ci % GRID;
    const cy = (ci / GRID) | 0;
    const nx = gWrap(cx + DX[d]);
    const ny = gWrap(cy + DY[d]);
    const ni = gIdx(nx, ny);
    mazeOpen[ci] |= DIR_BIT[d];
    mazeOpen[ni] |= OPP_BIT[d];
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 2: Carve 1-wide passages into the world grid
     Each coarse cell center = (gx*CELL + CELL/2, gy*CELL + CELL/2).
     Between connected cells we carve a 1-wide corridor.
     ══════════════════════════════════════════════════════════════ */
  const half = Math.floor(CELL / 2); // 3
  const centerX = Math.floor(GRID / 2) * CELL + half;
  const centerY = Math.floor(GRID / 2) * CELL + half;

  // Helper: carve one world-tile
  function carve(x: number, y: number): void {
    const ci = world.idx(x, y);
    if (world.cells[ci] === Cell.WALL) {
      world.cells[ci] = Cell.FLOOR;
      world.floorTex[ci] = Tex.F_CONCRETE;
    }
  }

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const ox = gx * CELL + half; // center of coarse cell in world coords
      const oy = gy * CELL + half;
      const bits = mazeOpen[gIdx(gx, gy)];

      // Carve the center tile of each cell
      carve(world.wrap(ox), world.wrap(oy));

      // Carve passage to the right neighbor (+x)
      if (bits & DIR_R) {
        for (let s = 0; s <= CELL; s++) {
          carve(world.wrap(ox + s), world.wrap(oy));
        }
      }
      // Carve passage to the bottom neighbor (+y)
      if (bits & DIR_D) {
        for (let s = 0; s <= CELL; s++) {
          carve(world.wrap(ox), world.wrap(oy + s));
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 3: Pipe-like dead-end fragments (short stubs off tunnels)
     ══════════════════════════════════════════════════════════════ */
  for (let i = 0; i < 600; i++) {
    const gx = rng(0, GRID - 1);
    const gy = rng(0, GRID - 1);
    const ox = gx * CELL + half;
    const oy = gy * CELL + half;
    // Pick a direction that is NOT open (goes into wall)
    const bits = mazeOpen[gIdx(gx, gy)];
    const closed: number[] = [];
    for (let d = 0; d < 4; d++) {
      if (!(bits & DIR_BIT[d])) closed.push(d);
    }
    if (closed.length === 0) continue;
    const d = closed[Math.floor(Math.random() * closed.length)];
    const len = rng(1, half); // short stub (1-3 tiles)
    for (let s = 1; s <= len; s++) {
      carve(world.wrap(ox + DX[d] * s), world.wrap(oy + DY[d] * s));
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 4: Rooms at maze junctions (3+ connections) & random spots
     ══════════════════════════════════════════════════════════════ */
  const rooms: Room[] = [];

  // Count connections per coarse cell
  function connCount(gi: number): number {
    let c = 0, b = mazeOpen[gi];
    while (b) { c += b & 1; b >>= 1; }
    return c;
  }

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const gi = gIdx(gx, gy);
      const conns = connCount(gi);
      // Place room at 3-4 way junctions (50%) or random (3%)
      const isJunction = conns >= 3 && Math.random() < 0.5;
      const isRandom = Math.random() < 0.03;
      if (!isJunction && !isRandom) continue;

      const rw = rng(3, 6), rh = rng(3, 6);
      const ox = gx * CELL + half;
      const oy = gy * CELL + half;
      const rx = world.wrap(ox - Math.floor(rw / 2));
      const ry = world.wrap(oy - Math.floor(rh / 2));

      const rt = pickRoomType();
      const room: Room = {
        id: nextRoomId, type: rt.type,
        x: rx, y: ry, w: rw, h: rh,
        doors: [], sealed: false,
        name: `${rt.name} #${nextRoomId}`,
        apartmentId: -1,
        wallTex: Tex.PIPE,
        floorTex: Tex.F_CONCRETE,
      };

      // Carve room interior + walls around it
      for (let dy = -1; dy <= rh; dy++) {
        for (let dx = -1; dx <= rw; dx++) {
          const ci = world.idx(room.x + dx, room.y + dy);
          if (dx >= 0 && dx < rw && dy >= 0 && dy < rh) {
            world.cells[ci] = Cell.FLOOR;
            world.floorTex[ci] = Tex.F_CONCRETE;
            world.roomMap[ci] = nextRoomId;
          } else {
            // Only wall-ify if not already a floor (don't block tunnels)
            if (world.cells[ci] !== Cell.FLOOR) {
              world.cells[ci] = Cell.WALL;
              world.wallTex[ci] = Tex.PIPE;
            }
          }
        }
      }

      // Ensure room connects to adjacent tunnels: punch openings where
      // existing floor cells are adjacent to room walls
      for (let dy = -1; dy <= rh; dy++) {
        for (let dx = -1; dx <= rw; dx++) {
          if (dx >= 0 && dx < rw && dy >= 0 && dy < rh) continue;
          const wx = world.wrap(room.x + dx);
          const wy = world.wrap(room.y + dy);
          const ci = world.idx(wx, wy);
          if (world.cells[ci] !== Cell.WALL) continue;
          // Check if an outside floor cell is adjacent
          for (const [odx, ody] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
            const nx = world.wrap(wx + odx);
            const ny = world.wrap(wy + ody);
            const ni = world.idx(nx, ny);
            if (world.cells[ni] === Cell.FLOOR && world.roomMap[ni] !== nextRoomId) {
              // Check the opposite side is inside the room
              const ix = world.wrap(wx - odx);
              const iy = world.wrap(wy - ody);
              const ii = world.idx(ix, iy);
              if (world.roomMap[ii] === nextRoomId) {
                world.cells[ci] = Cell.FLOOR;
                break;
              }
            }
          }
        }
      }

      // Features based on room type
      const ccx = room.x + Math.floor(rw / 2);
      const ccy = room.y + Math.floor(rh / 2);
      const fci = world.idx(ccx, ccy);
      if (rt.type === RoomType.MEDICAL && world.cells[fci] === Cell.FLOOR)
        world.features[fci] = Feature.SHELF;
      if (rt.type === RoomType.PRODUCTION && world.cells[fci] === Cell.FLOOR)
        world.features[fci] = Feature.MACHINE;

      world.rooms[nextRoomId] = room;
      rooms.push(room);
      nextRoomId++;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 5: Water canals
     ══════════════════════════════════════════════════════════════ */
  for (let canal = 0; canal < 30; canal++) {
    const horiz = Math.random() < 0.5;
    const pos = rng(10, W - 10);
    const start = rng(0, W - 100);
    const len = rng(40, 200);
    for (let d = 0; d < len; d++) {
      let x: number, y: number;
      if (horiz) {
        x = world.wrap(start + d);
        y = world.wrap(pos);
      } else {
        x = world.wrap(pos);
        y = world.wrap(start + d);
      }
      const ci = world.idx(x, y);
      if (world.cells[ci] === Cell.WALL) {
        world.cells[ci] = Cell.WATER;
        world.floorTex[ci] = Tex.F_WATER;
      }
    }
  }

  nextRoomId = applyCollectorMacroGeometry(world, rooms, nextRoomId, centerX, centerY);

  /* ══════════════════════════════════════════════════════════════
     Phase 6: Spawn point (center of the maze)
     ══════════════════════════════════════════════════════════════ */
  // Ensure spawn cell is floor
  carve(world.wrap(centerX), world.wrap(centerY));
  const spawnX = world.wrap(centerX) + 0.5;
  const spawnY = world.wrap(centerY) + 0.5;

  /* ══════════════════════════════════════════════════════════════
     Phase 7: Lifts
     ══════════════════════════════════════════════════════════════ */
  placeLifts(world, 8, LiftDirection.UP);
  placeLifts(world, 8, LiftDirection.DOWN);

  /* ══════════════════════════════════════════════════════════════
     Phase 8: Zones + zone levels
     ══════════════════════════════════════════════════════════════ */
  generateZones(world);
  for (const z of world.zones) z.level = calcZoneLevel(z.cx, z.cy, FloorLevel.MAINTENANCE);

  /* ══════════════════════════════════════════════════════════════
     Phase 9: Lights (sparse — at room centers + rare tunnel lamps)
     ══════════════════════════════════════════════════════════════ */
  // Room lamps
  for (const room of rooms) {
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);
    const ci = world.idx(cx, cy);
    if (world.cells[ci] === Cell.FLOOR) world.features[ci] = Feature.LAMP;
  }
  // Sparse tunnel lamps at coarse cell centers
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      if (Math.random() < 0.06) {
        const ci = world.idx(world.wrap(gx * CELL + half), world.wrap(gy * CELL + half));
        if (world.cells[ci] === Cell.FLOOR && world.features[ci] === 0)
          world.features[ci] = Feature.LAMP;
      }
    }
  }
  world.bakeLights();

  /* ══════════════════════════════════════════════════════════════
     Phase 10: Items (in rooms)
     ══════════════════════════════════════════════════════════════ */
  for (const room of rooms) {
    const numItems = rng(0, 3);
    for (let n = 0; n < numItems; n++) {
      const defs = ['pipe', 'wrench', 'flashlight', 'bandage', 'water', 'canned', 'bread', 'ammo_fuel', 'grenade'];
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
     Phase 11: Monsters (up to MONSTER_CAP=1000)
     ══════════════════════════════════════════════════════════════ */
  let monsterCount = 0;
  for (let attempt = 0; attempt < 50_000 && monsterCount < MONSTER_CAP; attempt++) {
    const ci = rng(0, W * W - 1);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    const mx = (ci % W) + 0.5, my = ((ci / W) | 0) + 0.5;
    const kind = Math.random() < 0.10
      ? pick([MonsterKind.EYE, MonsterKind.NIGHTMARE, MonsterKind.REBAR, MonsterKind.BETONNIK, MonsterKind.MATKA])
      : pick([
      MonsterKind.SBORKA, MonsterKind.SBORKA,
      MonsterKind.POLZUN,
      MonsterKind.ZOMBIE,
      MonsterKind.SHADOW,
      MonsterKind.TVAR,
    ]);
    const mstats: Record<number, { hp: number; speed: number; sprite: number }> = {
      [MonsterKind.SBORKA]: { hp: 5,  speed: 2.8, sprite: monsterSpr(MonsterKind.SBORKA) },
      [MonsterKind.TVAR]:   { hp: 40, speed: 1.8, sprite: monsterSpr(MonsterKind.TVAR) },
      [MonsterKind.POLZUN]: { hp: 80, speed: 1.0, sprite: monsterSpr(MonsterKind.POLZUN) },
      [MonsterKind.ZOMBIE]: { hp: 25, speed: 1.4, sprite: monsterSpr(MonsterKind.ZOMBIE) },
      [MonsterKind.SHADOW]: { hp: 45, speed: 2.4, sprite: monsterSpr(MonsterKind.SHADOW) },
      [MonsterKind.EYE]:       { hp: 30,  speed: 2.0, sprite: monsterSpr(MonsterKind.EYE) },
      [MonsterKind.NIGHTMARE]: { hp: 60,  speed: 2.2, sprite: monsterSpr(MonsterKind.NIGHTMARE) },
      [MonsterKind.REBAR]:     { hp: 55,  speed: 1.6, sprite: monsterSpr(MonsterKind.REBAR) },
      [MonsterKind.BETONNIK]:  { hp: 120, speed: 1.2, sprite: monsterSpr(MonsterKind.BETONNIK) },
      [MonsterKind.MATKA]:     { hp: 100, speed: 1.0, sprite: monsterSpr(MonsterKind.MATKA) },
    };
    const def = mstats[kind];
    if (!def) continue;
    const zid = world.zoneMap[ci];
    const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 5) : 5;
    const rpg = randomRPG(zoneLevel);
    entities.push({
      id: nextId++, type: EntityType.MONSTER,
      x: mx, y: my, angle: Math.random() * Math.PI * 2, pitch: 0,
      alive: true, speed: scaleMonsterSpeed(def.speed, zoneLevel), sprite: def.sprite,
      hp: scaleMonsterHp(def.hp, zoneLevel), maxHp: scaleMonsterHp(def.hp, zoneLevel),
      monsterKind: kind, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg,
    });
    monsterCount++;
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 12: Faction NPC squads (up to NPC_CAP=500)
     ══════════════════════════════════════════════════════════════ */
  const factions: { faction: Faction; occupation: Occupation }[] = [
    { faction: Faction.LIQUIDATOR, occupation: Occupation.HUNTER },
    { faction: Faction.CULTIST,    occupation: Occupation.PILGRIM },
    { faction: Faction.WILD,       occupation: Occupation.TRAVELER },
    { faction: Faction.CITIZEN,    occupation: Occupation.TRAVELER },
    { faction: Faction.SCIENTIST,  occupation: Occupation.SCIENTIST },
  ];
  let npcCount = 0;
  while (npcCount < NPC_CAP) {
    const prevCount = npcCount;
    for (const zone of world.zones) {
      if (npcCount >= NPC_CAP) break;
      const squadSize = rng(1, 4);
      const fDef = pick(factions);
      for (let s = 0; s < squadSize && npcCount < NPC_CAP; s++) {
        let sx = -1, sy = -1;
        for (let r = 0; r < 30; r++) {
          const tx = world.wrap(zone.cx + rng(-r * 3, r * 3));
          const ty = world.wrap(zone.cy + rng(-r * 3, r * 3));
          const tci = world.idx(tx, ty);
          if (world.cells[tci] === Cell.FLOOR) {
            sx = tx; sy = ty;
            break;
          }
        }
        if (sx < 0) continue;
        const zoneLevel = zone.level ?? 5;
        const npcLevel = gaussianLevel(zoneLevel + 3, 3);
        const rpg = randomRPG(npcLevel);
        const maxHp = Math.round(getMaxHp(rpg) * 1.5);
        const nm = randomName(fDef.faction);
        const hasPsi = fDef.faction === Faction.CULTIST && Math.random() < 0.4;
        entities.push({
          id: nextId++, type: EntityType.NPC,
          x: sx + 0.5, y: sy + 0.5,
          angle: Math.random() * Math.PI * 2, pitch: 0,
          alive: true,
          speed: 1.4 + Math.random() * 0.4,
          sprite: fDef.occupation,
          name: nm.name,
          isFemale: nm.female,
          needs: freshNeeds(),
          hp: maxHp, maxHp,
          money: rng(10, 80),
          ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
          inventory: hasPsi ? [{ defId: pickPsi(), count: 1 }] : [],
          weapon: hasPsi ? pickPsi() : undefined,
          faction: fDef.faction,
          occupation: fDef.occupation,
          isTraveler: true,
          questId: -1,
          rpg,
        });
        npcCount++;
      }
    }
    // Safety: if no NPCs were placed this pass, stop to avoid infinite loop
    if (npcCount === prevCount) break;
  }

  /* ══════════════════════════════════════════════════════════════
     Phase 13-14e: Manifest-owned maintenance content
     ══════════════════════════════════════════════════════════════ */
  nextId = runMaintenanceContent(world, entities, nextId, spawnX, spawnY);

  /* ══════════════════════════════════════════════════════════════
     Phase 15: Ensure all rooms are reachable (connectivity fix)
     ══════════════════════════════════════════════════════════════ */
  ensureConnectivity(world, spawnX, spawnY);

  /* ══════════════════════════════════════════════════════════════
     Phase 16: Rare procedural monitor/gauge walls
     ══════════════════════════════════════════════════════════════ */
  placeProceduralScreens(world, FloorLevel.MAINTENANCE);

  return { world, entities, spawnX, spawnY };
}

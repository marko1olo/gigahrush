/* ── Podad design floor: living hell geometry with anomaly hooks ─ */

import {
  AIGoal, Cell, EntityType, Feature, FloorLevel, LiftDirection,
  MonsterKind, RoomType, Tex, W, ZoneFaction,
  type Entity, type Item, type Room,
} from '../../core/types';
import { World } from '../../core/world';
import { withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { HELL_POPULATION_PROFILE, type MonsterPopulationProfile } from '../../data/population_profiles';
import { chooseFloorMonsterKind } from '../../data/monster_ecology';
import { PLOT_NPCS } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { calcZoneLevel, randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { entitySpawnSlots } from '../../systems/entity_limits';
import type { PlacementFieldProfile } from '../population_placement';
import { sampleNaturalPopulationCells } from '../population_placement';
import {
  carveCorridor,
  connectRoomsMST,
  ensureConnectivity,
  generateZones,
  placeLifts,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const PODAD_DESIGN_FLOOR_ID = 'podad' as const;
export const PODAD_DEFAULT_SEED = 36631;

const SPAWN_X = W >> 1;
const SPAWN_Y = W >> 1;
const LIVING_TUNNEL_TAG = '[living_tunnel:';
const WALL_SNAKE_TAG = '[wall_snake:';
const SECTION_SHIFT_TAG = '[section_shift:';
const PODAD_MONSTER_PROFILE: MonsterPopulationProfile & Pick<PlacementFieldProfile, 'bucketSize' | 'maxPerBucket'> = {
  ...HELL_POPULATION_PROFILE.monsters,
  initial: HELL_POPULATION_PROFILE.monsters.initial + 1400,
  noiseScale: 118,
  noiseStrength: 0.11,
  openWeight: 1.12,
  roomWeights: {
    ...HELL_POPULATION_PROFILE.monsters.roomWeights,
    [RoomType.CORRIDOR]: 1.25,
    [RoomType.PRODUCTION]: 1.18,
    [RoomType.STORAGE]: 1.16,
    [RoomType.HQ]: 0.82,
  },
  zoneWeights: {
    ...HELL_POPULATION_PROFILE.monsters.zoneWeights,
    [ZoneFaction.SAMOSBOR]: 1.28,
    [ZoneFaction.WILD]: 1.16,
    [ZoneFaction.CULTIST]: 1.08,
  },
  bucketSize: 18,
  maxPerBucket: 5,
};
const PODAD_MONSTER_SEED = 936631;

interface PodadRooms {
  entry: Room;
  contact: Room;
  threshold: Room;
  livingTunnel: Room;
  wallSnake: Room;
  sectionShift: Room;
  upperLift: Room;
}

interface RoomSpec {
  key: keyof PodadRooms;
  name: string;
  type: RoomType;
  dx: number;
  dy: number;
  w: number;
  h: number;
  wallTex: Tex;
  floorTex: Tex;
}

const ROOM_SPECS: readonly RoomSpec[] = [
  { key: 'entry', name: 'Корневая площадка Подада', type: RoomType.HQ, dx: -7, dy: -7, w: 15, h: 15, wallTex: Tex.GUT, floorTex: Tex.F_GUT },
  { key: 'contact', name: 'Обожженная сторожка Подада', type: RoomType.COMMON, dx: 34, dy: -28, w: 17, h: 13, wallTex: Tex.MEAT, floorTex: Tex.F_MEAT },
  { key: 'threshold', name: 'Порог Вестников Подада', type: RoomType.HQ, dx: 112, dy: -36, w: 27, h: 19, wallTex: Tex.GUT, floorTex: Tex.F_GUT },
  { key: 'livingTunnel', name: 'Живые тоннели: слепая кишка Подада', type: RoomType.CORRIDOR, dx: -116, dy: -58, w: 30, h: 18, wallTex: Tex.GUT, floorTex: Tex.F_GUT },
  { key: 'wallSnake', name: 'Змейка стены: сухой желудок Подада', type: RoomType.STORAGE, dx: -82, dy: 96, w: 32, h: 22, wallTex: Tex.CONCRETE, floorTex: Tex.F_CONCRETE },
  { key: 'sectionShift', name: 'Секционный сдвиг: мокрый пролет Подада', type: RoomType.PRODUCTION, dx: 82, dy: 96, w: 34, h: 24, wallTex: Tex.METAL, floorTex: Tex.F_TILE },
  { key: 'upperLift', name: 'Верхняя створка Подада', type: RoomType.CORRIDOR, dx: 8, dy: 174, w: 19, h: 13, wallTex: Tex.METAL, floorTex: Tex.F_CONCRETE },
];

export function generatePodadDesignFloor(seed = PODAD_DEFAULT_SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };

    const field = buildPodadField(seed);
    paintPodadTerrain(world, field);
    carvePodadSpines(world);

    const rooms = buildPodadRooms(world, seed);
    decoratePodadRooms(world, rooms);
    connectRoomsMST(world, Object.values(rooms));
    ensureConnectivity(world, SPAWN_X + 0.5, SPAWN_Y + 0.5);

    generateZones(world);
    tunePodadZones(world);
    placeLifts(world, 4, LiftDirection.UP, { x: rooms.entry.x + 7, y: rooms.entry.y + 7 });
    forceUpperLift(world, rooms.upperLift);
    ensureConnectivity(world, SPAWN_X + 0.5, SPAWN_Y + 0.5);
    sanitizeDoors(world);
    world.bakeLights();

    spawnPodadPlotNpcs(world, entities, nextId, rooms);
    spawnPodadPopulation(world, entities, nextId);
    spawnPodadHeralds(world, entities, nextId, SPAWN_X + 0.5, SPAWN_Y + 0.5);
    seedPodadDrops(world, entities, nextId, rooms);

    return {
      world,
      entities,
      spawnX: SPAWN_X + 0.5,
      spawnY: SPAWN_Y + 0.5,
    };
  });
}

export function generatePodadDebugFloor(seed = PODAD_DEFAULT_SEED): FloorGeneration {
  return generatePodadDesignFloor(seed);
}

export function spawnPodadPlotNpcs(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  rooms: Pick<PodadRooms, 'contact' | 'threshold'>,
): void {
  spawnPlotNpc(world, rooms.contact, 'hell_contact', entities, nextId);
  spawnPlotNpc(world, rooms.threshold, 'herald_clue', entities, nextId);
}

function buildPodadField(seed: number): Uint8Array {
  const field = new Uint8Array(W * W);

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const coarse = hash2(x >> 5, y >> 5, seed + 1) * 0.52;
      const medium = hash2(x >> 3, y >> 3, seed + 2) * 0.31;
      const fine = hash2(x >> 1, y >> 1, seed + 3) * 0.17;
      field[y * W + x] = coarse + medium + fine > 0.69 ? 1 : 0;
    }
  }

  for (let pass = 0; pass < 5; pass++) {
    const next = field.slice();
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const n4 = countNeighbors(field, x, y, false);
        const n8 = countNeighbors(field, x, y, true);
        const ci = y * W + x;
        next[ci] = field[ci]
          ? (n4 >= 1 && n8 >= 3 ? 1 : 0)
          : (n4 >= 3 || n8 >= 6 ? 1 : 0);
      }
    }
    field.set(next);
  }

  for (let i = 0; i < 180; i++) {
    let x = rng(0, W - 1);
    let y = rng(0, W - 1);
    let dir = rng(0, 3);
    const len = rng(48, 170);
    for (let step = 0; step < len; step++) {
      carveFieldDisc(field, x, y, step % 19 === 0 ? 3 : step % 7 === 0 ? 2 : 1);
      if (hash2(x + step, y - step, seed + 40 + i) > 0.83) dir = (dir + (Math.random() < 0.5 ? 1 : 3)) & 3;
      if (dir === 0) x = wrapCoord(x + 1);
      else if (dir === 1) x = wrapCoord(x - 1);
      else if (dir === 2) y = wrapCoord(y + 1);
      else y = wrapCoord(y - 1);
    }
  }

  carveFieldDisc(field, SPAWN_X, SPAWN_Y, 10);
  return field;
}

function paintPodadTerrain(world: World, field: Uint8Array): void {
  for (let i = 0; i < W * W; i++) {
    if (field[i]) {
      world.cells[i] = Cell.FLOOR;
      world.floorTex[i] = (i & 7) === 0 ? Tex.F_MEAT : Tex.F_GUT;
    } else {
      world.cells[i] = Cell.WALL;
      world.wallTex[i] = (i & 5) === 0 ? Tex.MEAT : Tex.GUT;
    }
  }
}

function carvePodadSpines(world: World): void {
  const points = [
    { x: SPAWN_X, y: SPAWN_Y },
    { x: world.wrap(SPAWN_X + 118), y: world.wrap(SPAWN_Y - 28) },
    { x: world.wrap(SPAWN_X - 112), y: world.wrap(SPAWN_Y - 50) },
    { x: world.wrap(SPAWN_X - 72), y: world.wrap(SPAWN_Y + 108) },
    { x: world.wrap(SPAWN_X + 100), y: world.wrap(SPAWN_Y + 108) },
    { x: world.wrap(SPAWN_X + 16), y: world.wrap(SPAWN_Y + 180) },
  ];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    carveCorridor(world, a.x, a.y, b.x, b.y);
    carveCorridor(world, world.wrap(a.x + 2), world.wrap(a.y - 2), world.wrap(b.x + 2), world.wrap(b.y - 2));
  }
}

function buildPodadRooms(world: World, seed: number): PodadRooms {
  const out = {} as PodadRooms;
  for (const spec of ROOM_SPECS) {
    const room = stampRoom(
      world,
      world.rooms.length,
      spec.type,
      world.wrap(SPAWN_X + spec.dx),
      world.wrap(SPAWN_Y + spec.dy),
      spec.w,
      spec.h,
      -1,
    );
    room.name = spec.name;
    room.wallTex = spec.wallTex;
    room.floorTex = spec.floorTex;
    repaintRoom(world, room, spec.wallTex, spec.floorTex);
    out[spec.key] = room;
  }

  markLivingTunnelRoom(world, out.livingTunnel, seed);
  markWallSnakeRoom(world, out.wallSnake);
  markSectionShiftRoom(world, out.sectionShift);
  return out;
}

function repaintRoom(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) {
        world.floorTex[ci] = floorTex;
        world.wallTex[ci] = 0;
      } else {
        world.wallTex[ci] = wallTex;
      }
    }
  }
}

function decoratePodadRooms(world: World, rooms: PodadRooms): void {
  placeFeature(world, rooms.entry, 7, 7, Feature.LAMP);
  placeFeature(world, rooms.contact, 2, 2, Feature.CANDLE);
  placeFeature(world, rooms.contact, rooms.contact.w - 3, 2, Feature.SHELF);
  placeFeature(world, rooms.threshold, 2, 2, Feature.CANDLE);
  placeFeature(world, rooms.threshold, rooms.threshold.w - 3, 2, Feature.CANDLE);
  placeFeature(world, rooms.threshold, rooms.threshold.w >> 1, rooms.threshold.h >> 1, Feature.APPARATUS);
  placeFeature(world, rooms.upperLift, rooms.upperLift.w >> 1, rooms.upperLift.h >> 1, Feature.LIFT_BUTTON);

  for (const room of Object.values(rooms)) {
    for (let i = 0; i < 5; i++) {
      const x = room.x + rng(1, room.w - 2);
      const y = room.y + rng(1, room.h - 2);
      const ci = world.idx(x, y);
      if (world.features[ci] === Feature.NONE) world.features[ci] = i & 1 ? Feature.CANDLE : Feature.LAMP;
    }
  }
}

function placeFeature(world: World, room: Room, ox: number, oy: number, feature: Feature): void {
  world.features[world.idx(room.x + ox, room.y + oy)] = feature;
}

function markLivingTunnelRoom(world: World, room: Room, seed: number): void {
  const x = world.wrap(room.x + (room.w >> 1));
  const y = world.wrap(room.y + (room.h >> 1));
  const rootSeed = hash32(seed ^ Math.imul(room.id + 11, 0x45d9f3b));
  const maxLen = 124;
  room.name = `${room.name} [living_tunnels] ${LIVING_TUNNEL_TAG}${x},${y},${rootSeed},${maxLen}]`;
  const ci = world.idx(x, y);
  world.features[ci] = Feature.APPARATUS;
  world.floorTex[ci] = Tex.F_GUT;
  world.fog[ci] = 42;
}

function markWallSnakeRoom(world: World, room: Room): void {
  const x0 = room.x + 1;
  const y0 = room.y + 1;
  const w = Math.min(room.w - 2, 28);
  const h = Math.min(room.h - 2, 18);
  room.name = `${room.name} ${WALL_SNAKE_TAG}${x0},${y0},${w},${h}]`;
  world.features[world.idx(x0, y0)] = Feature.SCREEN;
  for (let i = 0; i < (w + h) * 2 - 4; i += 2) {
    const p = perimeterPoint(world, x0, y0, w, h, i);
    const ci = world.idx(p.x, p.y);
    world.floorTex[ci] = Tex.F_CONCRETE;
    world.fog[ci] = Math.max(world.fog[ci], 24);
  }
}

function markSectionShiftRoom(world: World, room: Room): void {
  const x = room.x + 1;
  const y = room.y + 1;
  const w = Math.min(room.w - 2, 30);
  const h = Math.min(room.h - 2, 22);
  const phase = 2;
  room.name = `${room.name} ${SECTION_SHIFT_TAG}${x},${y},${w},${h},${phase}]`;
  for (let dy = 1; dy <= h; dy++) {
    for (let dx = 1; dx <= w; dx++) {
      if (((dx + phase * 3) % 6) !== 0 && ((dy + phase * 2) % 7) !== 0) continue;
      const ci = world.idx(room.x + dx, room.y + dy);
      world.floorTex[ci] = Tex.F_TILE;
      world.fog[ci] = Math.max(world.fog[ci], 38);
    }
  }
  world.features[world.idx(room.x + (room.w >> 1), room.y + (room.h >> 1))] = Feature.APPARATUS;
}

function tunePodadZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, SPAWN_X, SPAWN_Y);
    zone.faction = d < 120 ? ZoneFaction.CULTIST : d < 260 ? ZoneFaction.SAMOSBOR : ZoneFaction.WILD;
    zone.level = calcZoneLevel(zone.cx, zone.cy, FloorLevel.HELL) + (d > 220 ? 5 : 3);
    zone.fogged = d > 180;
  }
  for (let i = 0; i < W * W; i++) {
    const zid = world.zoneMap[i];
    world.factionControl[i] = world.zones[zid]?.faction ?? ZoneFaction.WILD;
    if (world.cells[i] === Cell.FLOOR && world.zones[zid]?.fogged) world.fog[i] = Math.max(world.fog[i], 18);
  }
}

function forceUpperLift(world: World, room: Room): void {
  const lx = world.wrap(room.x + (room.w >> 1));
  const ly = world.wrap(room.y + (room.h >> 1));
  const li = world.idx(lx, ly);
  world.cells[li] = Cell.LIFT;
  world.liftDir[li] = LiftDirection.UP;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.floorTex[li] = Tex.F_CONCRETE;

  const bx = world.wrap(lx + 1);
  const bi = world.idx(bx, ly);
  world.cells[bi] = Cell.FLOOR;
  world.features[bi] = Feature.LIFT_BUTTON;
  world.liftDir[bi] = LiftDirection.UP;
  world.floorTex[bi] = Tex.F_CONCRETE;
}

function spawnPlotNpc(
  world: World,
  room: Room,
  plotNpcId: 'hell_contact' | 'herald_clue',
  entities: Entity[],
  nextId: { v: number },
): void {
  const def = PLOT_NPCS[plotNpcId];
  const x = world.wrap(room.x + (room.w >> 1));
  const y = world.wrap(room.y + (room.h >> 1));
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: Math.PI, pitch: 0, alive: true, speed: def.speed,
    sprite: def.sprite,
    name: def.name, isFemale: def.isFemale,
    needs: freshNeeds(), hp: def.hp, maxHp: def.maxHp, money: def.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    faction: def.faction, occupation: def.occupation,
    plotNpcId, canGiveQuest: true, questId: -1,
  });
}

function spawnPodadHeralds(world: World, entities: Entity[], nextId: { v: number }, spawnX: number, spawnY: number): void {
  const heraldDef = MONSTERS[MonsterKind.HERALD];
  if (!heraldDef) return;

  let slots = entitySpawnSlots(entities, EntityType.MONSTER, 3);
  const targets = [
    { min: 90, max: 190, name: 'Вестник живого тоннеля' },
    { min: 155, max: 275, name: 'Вестник стены-змейки' },
    { min: 210, max: 380, name: 'Вестник секционного сдвига' },
  ];

  for (const target of targets) {
    if (slots <= 0) return;
    const cell = findHeraldCell(world, entities, spawnX, spawnY, target.min, target.max);
    if (cell < 0) continue;
    const x = cell % W;
    const y = (cell / W) | 0;
    const zid = world.zoneMap[cell];
    const zoneLevel = (world.zones[zid]?.level ?? 14) + 3;
    const hp = Math.round(scaleMonsterHp(heraldDef.hp, zoneLevel));
    entities.push({
      id: nextId.v++, type: EntityType.MONSTER,
      x: x + 0.5, y: y + 0.5,
      angle: Math.random() * Math.PI * 2, pitch: 0,
      alive: true,
      speed: scaleMonsterSpeed(heraldDef.speed, zoneLevel),
      sprite: monsterSpr(MonsterKind.HERALD),
      name: target.name,
      hp, maxHp: hp,
      monsterKind: MonsterKind.HERALD, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg: randomRPG(zoneLevel),
    });
    slots--;
  }
}

function spawnPodadPopulation(world: World, entities: Entity[], nextId: { v: number }): number {
  const count = entitySpawnSlots(entities, EntityType.MONSTER, PODAD_MONSTER_PROFILE.initial);
  const cells = sampleNaturalPopulationCells(world, count, PODAD_MONSTER_PROFILE, PODAD_MONSTER_SEED + nextId.v * 17);
  let spawned = 0;
  for (const cell of cells) {
    const x = (cell % W) + 0.5;
    const y = ((cell / W) | 0) + 0.5;
    const kind = choosePodadMonsterKind(world, cell);
    const def = MONSTERS[kind] ?? MONSTERS[MonsterKind.TVAR];
    const zid = world.zoneMap[cell];
    const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 14) : 14;
    const bonus = podadMonsterLevelBonus(kind);
    const rpg = randomRPG(zoneLevel + bonus);
    const hp = Math.round(scaleMonsterHp(def.hp, zoneLevel + bonus) * (1 + rpg.str * 0.1));
    entities.push({
      id: nextId.v++, type: EntityType.MONSTER,
      x, y,
      angle: Math.random() * Math.PI * 2, pitch: 0,
      alive: true,
      speed: scaleMonsterSpeed(def.speed, zoneLevel + Math.max(1, bonus - 1)),
      sprite: monsterSpr(kind),
      hp, maxHp: hp,
      monsterKind: kind, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg,
      phasing: kind === MonsterKind.SPIRIT || kind === MonsterKind.GLUBINNAYA_TEN,
    });
    spawned++;
  }
  return spawned;
}

function choosePodadMonsterKind(world: World, cell: number): MonsterKind {
  const room = world.rooms[world.roomMap[cell]];
  const name = room?.name ?? '';
  const roomTags = [
    name.includes('[living_tunnels]') ? 'living_tunnels' : '',
    name.includes(WALL_SNAKE_TAG) ? 'moving_walls' : '',
    name.includes(SECTION_SHIFT_TAG) ? 'section_shift' : '',
  ].filter(Boolean);
  return chooseFloorMonsterKind({
    floor: FloorLevel.HELL,
    roomType: room?.type,
    floorTags: ['hell', 'podad', 'meat', 'deep', 'moving_walls', 'living_tunnels'],
    roomTags,
    samosborCount: 9,
    allowRare: true,
    floorAffinity: 'weighted',
    routePressure: 5,
    excludeKinds: [MonsterKind.HERALD, MonsterKind.CREATOR],
    biasKinds: [
      MonsterKind.OLGOY,
      MonsterKind.GLUBINNAYA_TEN,
      MonsterKind.KOSTOREZ,
      MonsterKind.ZAKALENNAYA_ARMATURA,
      MonsterKind.POLZUN,
      MonsterKind.SHADOW,
      MonsterKind.SBORKA,
    ],
  });
}

function podadMonsterLevelBonus(kind: MonsterKind): number {
  switch (kind) {
    case MonsterKind.MATKA:
    case MonsterKind.KHOROVAYA_MATKA:
    case MonsterKind.GLUBINNAYA_TEN:
    case MonsterKind.ZAKALENNAYA_ARMATURA:
    case MonsterKind.KOSTOREZ:
      return 4;
    case MonsterKind.OLGOY:
    case MonsterKind.SPIRIT:
    case MonsterKind.REBAR:
      return 3;
    default:
      return 2;
  }
}

function findHeraldCell(
  world: World,
  entities: Entity[],
  spawnX: number,
  spawnY: number,
  minDist: number,
  maxDist: number,
): number {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const ci = rng(0, W * W - 1);
    if (world.cells[ci] !== Cell.FLOOR || world.features[ci] === Feature.LIFT_BUTTON) continue;
    const x = ci % W;
    const y = (ci / W) | 0;
    const d = world.dist(spawnX, spawnY, x + 0.5, y + 0.5);
    if (d < minDist || d > maxDist) continue;
    if (entities.some(e => e.monsterKind === MonsterKind.HERALD && e.alive && world.dist(e.x, e.y, x + 0.5, y + 0.5) < 72)) continue;
    return ci;
  }
  return -1;
}

function seedPodadDrops(world: World, entities: Entity[], nextId: { v: number }, rooms: PodadRooms): void {
  dropItems(world, entities, nextId, rooms.contact, 2, rooms.contact.h - 3, [
    { defId: 'bandage', count: 2 },
    { defId: 'water', count: 1 },
  ]);
  dropItems(world, entities, nextId, rooms.threshold, rooms.threshold.w - 3, rooms.threshold.h - 3, [
    { defId: 'holy_water', count: 1 },
    { defId: 'siren_shard', count: 1 },
  ]);
  dropItems(world, entities, nextId, rooms.livingTunnel, 3, 3, [{ defId: 'sealant_tube', count: 1 }]);
}

function dropItems(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  room: Room,
  ox: number,
  oy: number,
  inventory: Item[],
): void {
  const x = world.wrap(room.x + ox);
  const y = world.wrap(room.y + oy);
  if (world.cells[world.idx(x, y)] !== Cell.FLOOR) return;
  entities.push({
    id: nextId.v++, type: EntityType.ITEM_DROP,
    x: x + 0.5, y: y + 0.5,
    angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
    inventory,
  });
}

function perimeterPoint(world: World, x0: number, y0: number, w: number, h: number, step: number): { x: number; y: number } {
  const len = Math.max(1, (w + h) * 2 - 4);
  let t = ((step % len) + len) % len;
  if (t < w) return { x: world.wrap(x0 + t), y: world.wrap(y0) };
  t -= w;
  if (t < h - 1) return { x: world.wrap(x0 + w - 1), y: world.wrap(y0 + 1 + t) };
  t -= h - 1;
  if (t < w - 1) return { x: world.wrap(x0 + w - 2 - t), y: world.wrap(y0 + h - 1) };
  t -= w - 1;
  return { x: world.wrap(x0), y: world.wrap(y0 + h - 2 - t) };
}

function carveFieldDisc(field: Uint8Array, x: number, y: number, r: number): void {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + 1) continue;
      field[wrapCoord(y + dy) * W + wrapCoord(x + dx)] = 1;
    }
  }
}

function countNeighbors(field: Uint8Array, x: number, y: number, diagonals: boolean): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (!diagonals && dx !== 0 && dy !== 0) continue;
      count += field[wrapCoord(y + dy) * W + wrapCoord(x + dx)] ? 1 : 0;
    }
  }
  return count;
}

function hash2(x: number, y: number, seed: number): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)) | 0;
  n = Math.imul(n ^ (n >> 13), 1103515245);
  n ^= n >> 16;
  return (n & 0x7fffffff) / 0x7fffffff;
}

function hash32(v: number): number {
  v |= 0;
  v ^= v >>> 16;
  v = Math.imul(v, 0x7feb352d);
  v ^= v >>> 15;
  v = Math.imul(v, 0x846ca68b);
  v ^= v >>> 16;
  return v >>> 0;
}

function rng(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function wrapCoord(v: number): number {
  return ((v % W) + W) % W;
}

/* ── Design floor: hyperbolic_switchyard / Гиперболическая стрелочная ─ */

import {
  AIGoal,
  Cell,
  ContainerKind,
  DoorState,
  EntityType,
  Faction,
  Feature,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  Occupation,
  QuestType,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { hashSeed, withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr } from '../../render/sprite_index';
import { placeEmergencyPanel } from '../../systems/emergency_panels';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG } from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const HYPERBOLIC_SWITCHYARD_DESIGN_FLOOR_ID = 'hyperbolic_switchyard' as const;
export const HYPERBOLIC_SWITCHYARD_ROUTE_Z = -20;
export const HYPERBOLIC_SWITCHYARD_BASE_FLOOR = FloorLevel.MAINTENANCE;

const SEED = hashSeed(HYPERBOLIC_SWITCHYARD_DESIGN_FLOOR_ID);
const GUIDE_NPC_ID = 'hyperbolic_switchyard_guide_zinaida';

export type SwitchyardArcFamily = 'blue' | 'red';
export type SwitchyardDecisionId = 'pay_guide' | 'switch_family' | 'geodesic_shortcut' | 'sabotage_false_platform';

export interface SwitchyardArcSummary {
  id: string;
  family: SwitchyardArcFamily;
  cellCount: number;
  platformRoomId: number;
  shortcut: boolean;
}

export interface SwitchyardPlatformSummary {
  id: string;
  roomId: number;
  name: string;
  x: number;
  y: number;
  falsePlatform?: boolean;
}

export interface HyperbolicSwitchyardState {
  routeId: typeof HYPERBOLIC_SWITCHYARD_DESIGN_FLOOR_ID;
  z: typeof HYPERBOLIC_SWITCHYARD_ROUTE_Z;
  baseFloor: typeof HYPERBOLIC_SWITCHYARD_BASE_FLOOR;
  arcs: SwitchyardArcSummary[];
  platforms: SwitchyardPlatformSummary[];
  decisionIds: SwitchyardDecisionId[];
  panelCells: number[];
  guideNpcId: typeof GUIDE_NPC_ID;
  shortcutMonsterCells: number[];
  debugEntry: {
    spawnX: number;
    spawnY: number;
    summary: string;
  };
}

export interface HyperbolicSwitchyardGeneration extends FloorGeneration {
  switchyardState: HyperbolicSwitchyardState;
}

interface ArcSpec {
  id: string;
  family: SwitchyardArcFamily;
  cx: number;
  cy: number;
  radius: number;
  start: number;
  end: number;
  width: number;
  tex: Tex;
  platform: keyof SwitchyardRooms;
  shortcut?: boolean;
}

interface SwitchyardRooms {
  guide: Room;
  central: Room;
  north: Room;
  south: Room;
  west: Room;
  east: Room;
  blueSwitch: Room;
  redSwitch: Room;
  shortcut: Room;
  falsePlatform: Room;
}

const GUIDE_DEF: PlotNpcDef = {
  name: 'Зинаида Кривых Стрелок',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 115,
  maxHp: 115,
  money: 95,
  speed: 0.88,
  inventory: [
    { defId: 'metro_ticket', count: 2 },
    { defId: 'chalk', count: 2 },
    { defId: 'relay_diagram', count: 1 },
  ],
  talkLines: [
    'Здесь прямой путь всегда врёт. Смотри, какая дуга делает платформу ближе, а не какая вывеска громче.',
    'Платформа с двойной стрелкой не станция. Это рот, нарисованный расписанием.',
    'Синяя семья дуг тихая, красная короче. Красная любит, когда за ней бегут.',
    'Заплатишь билетом - покажу, где карта не складывается в петлю.',
  ],
  talkLinesPost: [
    'Дуга запомнила тебя. Это дешевле карты, но дороже ошибки.',
    'Если панель щёлкнула два раза, не иди на третий звук.',
  ],
};

registerSideQuest(GUIDE_NPC_ID, GUIDE_DEF, [{
  id: 'hyperbolic_switchyard_pay_guide',
  giverNpcId: GUIDE_NPC_ID,
  type: QuestType.FETCH,
  desc: 'Зинаида Кривых Стрелок: «Билет метро и я отмечу мелом, какая дуга сегодня не кусается. Без билета тут все платформы одинаково честные.»',
  targetItem: 'metro_ticket',
  targetCount: 1,
  rewardItem: 'relay_diagram',
  rewardCount: 1,
  extraRewards: [{ defId: 'fuse', count: 1 }, { defId: 'chalk', count: 2 }],
  relationDelta: 12,
  xpReward: 45,
  moneyReward: 25,
  eventTags: ['hyperbolic_switchyard', 'pay_guide', 'route_hint'],
  eventTargetName: 'Проводник стрелочной отметил безопасную дугу.',
}]);

export function generateHyperbolicSwitchyardDesignFloor(seed = SEED): HyperbolicSwitchyardGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };
    const containerId = { v: 1 };
    const center = { x: W >> 1, y: W >> 1 };

    const arcCells = carveArcFamilies(world);
    carveGeodesicShortcut(world, arcCells.shortcutCells);
    const rooms = buildSwitchyardRooms(world);
    connectSwitchyardRooms(world, rooms);
    const gateCells = placeSwitchyardGates(world);
    generateZones(world);
    tuneSwitchyardZones(world);
    placeSwitchyardLifts(world);
    decorateSwitchyard(world, rooms, arcCells.allCells);

    const panelCells = placeSwitchyardPanels(world, rooms);
    spawnGuide(entities, nextId, rooms.guide);
    spawnShortcutMonsters(world, entities, nextId, arcCells.shortcutCells);
    placeSwitchyardContainers(world, containerId, rooms);
    registerSwitchyardCues(world, rooms);

    sanitizeDoors(world);
    ensureConnectivity(world, rooms.guide.x + 4.5, rooms.guide.y + rooms.guide.h - 1.5);
    world.bakeLights();

    return {
      world,
      entities,
      spawnX: rooms.guide.x + 4.5,
      spawnY: rooms.guide.y + rooms.guide.h - 1.5,
      switchyardState: {
        routeId: HYPERBOLIC_SWITCHYARD_DESIGN_FLOOR_ID,
        z: HYPERBOLIC_SWITCHYARD_ROUTE_Z,
        baseFloor: HYPERBOLIC_SWITCHYARD_BASE_FLOOR,
        arcs: summarizeArcs(arcCells.arcMap, rooms),
        platforms: summarizePlatforms(rooms),
        decisionIds: ['pay_guide', 'switch_family', 'geodesic_shortcut', 'sabotage_false_platform'],
        panelCells,
        guideNpcId: GUIDE_NPC_ID,
        shortcutMonsterCells: arcCells.shortcutCells.slice(0, 32),
        debugEntry: {
          spawnX: rooms.guide.x + 4.5,
          spawnY: rooms.guide.y + rooms.guide.h - 1.5,
          summary: `center ${center.x}:${center.y}, gates ${gateCells.length}, panels ${panelCells.length}`,
        },
      },
    };
  });
}

function carveArcFamilies(world: World): {
  allCells: number[];
  shortcutCells: number[];
  arcMap: Map<string, { spec: ArcSpec; cells: number[] }>;
} {
  const arcMap = new Map<string, { spec: ArcSpec; cells: number[] }>();
  const all = new Set<number>();
  const shortcut = new Set<number>();
  const arcs: readonly ArcSpec[] = [
    { id: 'blue_upper_horocycle', family: 'blue', cx: 512, cy: 742, radius: 286, start: -2.57, end: -0.58, width: 5, tex: Tex.F_CONCRETE, platform: 'north' },
    { id: 'blue_lower_horocycle', family: 'blue', cx: 512, cy: 282, radius: 286, start: 0.58, end: 2.57, width: 5, tex: Tex.F_CONCRETE, platform: 'south' },
    { id: 'blue_west_wall_arc', family: 'blue', cx: 742, cy: 512, radius: 284, start: 2.18, end: 4.08, width: 4, tex: Tex.F_CONCRETE, platform: 'west' },
    { id: 'blue_east_wall_arc', family: 'blue', cx: 282, cy: 512, radius: 284, start: -0.94, end: 0.94, width: 4, tex: Tex.F_CONCRETE, platform: 'east' },
    { id: 'red_northwest_geodesic', family: 'red', cx: 316, cy: 322, radius: 265, start: -0.06, end: 1.52, width: 4, tex: Tex.F_TILE, platform: 'blueSwitch' },
    { id: 'red_northeast_geodesic', family: 'red', cx: 708, cy: 322, radius: 265, start: 1.62, end: 3.20, width: 4, tex: Tex.F_TILE, platform: 'redSwitch' },
    { id: 'red_southeast_false_platform', family: 'red', cx: 704, cy: 702, radius: 250, start: 3.18, end: 4.78, width: 4, tex: Tex.F_TILE, platform: 'falsePlatform', shortcut: true },
    { id: 'red_southwest_monster_shortcut', family: 'red', cx: 320, cy: 702, radius: 250, start: -1.64, end: -0.02, width: 4, tex: Tex.F_TILE, platform: 'shortcut', shortcut: true },
  ];

  for (const spec of arcs) {
    const cells = carvePoincareArc(world, spec);
    arcMap.set(spec.id, { spec, cells });
    for (const cell of cells) {
      all.add(cell);
      if (spec.shortcut) shortcut.add(cell);
    }
  }

  return { allCells: [...all], shortcutCells: [...shortcut], arcMap };
}

function carvePoincareArc(world: World, spec: ArcSpec): number[] {
  const cells = new Set<number>();
  const span = Math.abs(spec.end - spec.start);
  const steps = Math.max(32, Math.ceil(span * spec.radius * 0.9));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = spec.start + (spec.end - spec.start) * t;
    const x = spec.cx + Math.cos(a) * spec.radius;
    const y = spec.cy + Math.sin(a) * spec.radius;
    carveBrush(world, x, y, spec.width, spec.tex, cells);
  }
  return [...cells];
}

function carveGeodesicShortcut(world: World, cells: number[]): void {
  carveSegment(world, 356, 648, 668, 376, 3, Tex.F_TILE, cells);
  carveSegment(world, 668, 648, 356, 376, 2, Tex.F_TILE, cells);
}

function carveSegment(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  tex: Tex,
  out?: number[] | Set<number>,
): void {
  const dx = world.delta(ax, bx);
  const dy = world.delta(ay, by);
  const steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) * 1.2));
  const set = out instanceof Set ? out : undefined;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cells = new Set<number>();
    carveBrush(world, ax + dx * t, ay + dy * t, width, tex, cells);
    if (Array.isArray(out)) out.push(...cells);
    else if (set) for (const cell of cells) set.add(cell);
  }
}

function carveBrush(world: World, x: number, y: number, radius: number, tex: Tex, out?: Set<number>): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const ci = world.idx(ix + dx, iy + dy);
      if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) continue;
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = -1;
      world.floorTex[ci] = tex;
      world.wallTex[ci] = Tex.METAL;
      world.factionControl[ci] = ZoneFaction.LIQUIDATOR;
      if (out) out.add(ci);
    }
  }
}

function buildSwitchyardRooms(world: World): SwitchyardRooms {
  return {
    guide: makeRoom(world, RoomType.OFFICE, 468, 462, 44, 26, 'Касса проводника кривых дуг', Tex.PANEL, Tex.F_LINO),
    central: makeRoom(world, RoomType.HQ, 482, 502, 60, 34, 'Хороцикл главной стрелочной', Tex.METAL, Tex.F_CONCRETE),
    north: makeRoom(world, RoomType.COMMON, 470, 366, 84, 26, 'Хороцикл верхней платформы', Tex.METAL, Tex.F_CONCRETE),
    south: makeRoom(world, RoomType.COMMON, 470, 636, 84, 26, 'Хороцикл нижней платформы', Tex.METAL, Tex.F_CONCRETE),
    west: makeRoom(world, RoomType.COMMON, 296, 498, 48, 30, 'Хороцикл западной платформы', Tex.METAL, Tex.F_CONCRETE),
    east: makeRoom(world, RoomType.COMMON, 680, 498, 48, 30, 'Хороцикл восточной платформы', Tex.METAL, Tex.F_CONCRETE),
    blueSwitch: makeRoom(world, RoomType.PRODUCTION, 402, 442, 38, 30, 'Пульт синего семейства дуг', Tex.PIPE, Tex.F_TILE),
    redSwitch: makeRoom(world, RoomType.PRODUCTION, 584, 442, 38, 30, 'Пульт красного семейства дуг', Tex.PIPE, Tex.F_TILE),
    shortcut: makeRoom(world, RoomType.STORAGE, 616, 574, 48, 30, 'Геодезическая служебная кишка', Tex.PIPE, Tex.F_TILE),
    falsePlatform: makeRoom(world, RoomType.STORAGE, 666, 650, 58, 28, 'Ложная платформа с обратной стрелкой', Tex.DARK, Tex.F_CONCRETE),
  };
}

function makeRoom(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
    }
  }
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      world.floorTex[ci] = floorTex;
    }
  }
  return room;
}

function connectSwitchyardRooms(world: World, rooms: SwitchyardRooms): void {
  connectRoomToPoint(world, rooms.guide, 'south', 512, 502, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.central, 'north', 512, 462, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.central, 'south', 512, 636, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.central, 'west', 344, 512, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.central, 'east', 680, 512, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.north, 'south', 512, 430, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.south, 'north', 512, 594, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.west, 'east', 430, 512, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.east, 'west', 594, 512, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.blueSwitch, 'east', 482, 512, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.redSwitch, 'west', 542, 512, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.shortcut, 'west', 560, 574, DoorState.CLOSED);
  connectRoomToPoint(world, rooms.falsePlatform, 'west', 640, 650, DoorState.LOCKED, 'relay_diagram');
}

function connectRoomToPoint(
  world: World,
  room: Room,
  side: 'north' | 'south' | 'west' | 'east',
  targetX: number,
  targetY: number,
  state: DoorState,
  keyId = '',
): void {
  let doorX = room.x + Math.floor(room.w / 2);
  let doorY = room.y + Math.floor(room.h / 2);
  let outX = doorX;
  let outY = doorY;
  if (side === 'north') {
    doorY = room.y - 1;
    outY = doorY - 1;
  } else if (side === 'south') {
    doorY = room.y + room.h;
    outY = doorY + 1;
  } else if (side === 'west') {
    doorX = room.x - 1;
    outX = doorX - 1;
  } else {
    doorX = room.x + room.w;
    outX = doorX + 1;
  }
  if (side === 'north' || side === 'south') {
    doorX = room.x + Math.floor(room.w / 2);
    outX = doorX;
  } else {
    doorY = room.y + Math.floor(room.h / 2);
    outY = doorY;
  }
  const idx = world.idx(doorX, doorY);
  world.cells[idx] = Cell.DOOR;
  world.wallTex[idx] = state === DoorState.LOCKED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
  world.doors.set(idx, { idx, state, roomA: room.id, roomB: -1, keyId, timer: 0 });
  if (!room.doors.includes(idx)) room.doors.push(idx);
  carveSegment(world, outX, outY, targetX, targetY, 2, room.floorTex);
}

function placeSwitchyardGates(world: World): number[] {
  const gates = [
    { x: 436, y: 512, family: 'blue' },
    { x: 588, y: 512, family: 'blue' },
    { x: 512, y: 430, family: 'red' },
    { x: 512, y: 594, family: 'red' },
  ] as const;
  const out: number[] = [];
  for (const gate of gates) {
    const idx = world.idx(gate.x, gate.y);
    world.cells[idx] = Cell.DOOR;
    world.wallTex[idx] = Tex.DOOR_METAL;
    world.doors.set(idx, {
      idx,
      state: DoorState.CLOSED,
      roomA: -1,
      roomB: -1,
      keyId: '',
      timer: 0,
    });
    world.floorTex[idx] = gate.family === 'blue' ? Tex.F_CONCRETE : Tex.F_TILE;
    out.push(idx);
  }
  return out;
}

function placeSwitchyardLifts(world: World): void {
  placeLift(world, 454, 496, 456, 496, LiftDirection.UP);
  placeLift(world, 570, 496, 568, 496, LiftDirection.DOWN);
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const lift = world.idx(x, y);
  world.cells[lift] = Cell.LIFT;
  world.wallTex[lift] = Tex.LIFT_DOOR;
  world.liftDir[lift] = direction;
  const button = world.idx(buttonX, buttonY);
  if (world.cells[button] === Cell.FLOOR) world.features[button] = Feature.LIFT_BUTTON;
  world.liftDir[button] = direction;
}

function decorateSwitchyard(world: World, rooms: SwitchyardRooms, arcCells: readonly number[]): void {
  for (const room of Object.values(rooms)) {
    placeFeature(world, room.x + 2, room.y + 2, Feature.LAMP);
    placeFeature(world, room.x + room.w - 3, room.y + 2, Feature.SCREEN);
  }
  placeFeature(world, rooms.guide.x + 5, rooms.guide.y + 5, Feature.DESK);
  placeFeature(world, rooms.blueSwitch.x + 8, rooms.blueSwitch.y + 8, Feature.APPARATUS);
  placeFeature(world, rooms.redSwitch.x + rooms.redSwitch.w - 9, rooms.redSwitch.y + 8, Feature.APPARATUS);
  placeFeature(world, rooms.falsePlatform.x + 5, rooms.falsePlatform.y + 6, Feature.CANDLE);

  for (let i = 0; i < arcCells.length; i += 41) {
    const cell = arcCells[i];
    if (world.features[cell] !== Feature.NONE || world.cells[cell] !== Cell.FLOOR) continue;
    world.features[cell] = (i / 41) % 5 === 0 ? Feature.SCREEN : Feature.LAMP;
  }
}

function placeFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR && world.features[idx] === Feature.NONE) world.features[idx] = feature;
}

function placeSwitchyardPanels(world: World, rooms: SwitchyardRooms): number[] {
  const panels = [
    placeEmergencyPanel(world, rooms.blueSwitch.x + 12, rooms.blueSwitch.y + 14, 'panel_doors', 0x51a0),
    placeEmergencyPanel(world, rooms.redSwitch.x + rooms.redSwitch.w - 13, rooms.redSwitch.y + 14, 'panel_doors', 0x51b0),
    placeEmergencyPanel(world, rooms.shortcut.x + 8, rooms.shortcut.y + 12, 'panel_vent', 0x51c0),
  ];
  return panels.flatMap(panel => panel ? [panel.idx] : []);
}

function spawnGuide(entities: Entity[], nextId: { v: number }, room: Room): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: room.x + 8.5,
    y: room.y + room.h - 6.5,
    angle: Math.PI / 2,
    pitch: 0,
    alive: true,
    speed: GUIDE_DEF.speed,
    sprite: GUIDE_DEF.sprite,
    needs: freshNeeds(),
    hp: GUIDE_DEF.hp,
    maxHp: GUIDE_DEF.maxHp,
    ai: { goal: AIGoal.IDLE, tx: room.x + 8, ty: room.y + room.h - 6, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: GUIDE_DEF.inventory.map(item => ({ ...item })),
    name: GUIDE_DEF.name,
    faction: GUIDE_DEF.faction,
    occupation: GUIDE_DEF.occupation,
    isTraveler: true,
    assignedRoomId: room.id,
    questId: -1,
    canGiveQuest: true,
    money: GUIDE_DEF.money,
    plotNpcId: GUIDE_NPC_ID,
    isFemale: true,
    rpg: randomRPG(5),
  });
}

function spawnShortcutMonsters(world: World, entities: Entity[], nextId: { v: number }, cells: readonly number[]): void {
  const kinds: readonly MonsterKind[] = [
    MonsterKind.PSEUDOLIFT,
    MonsterKind.TUBE_EEL,
    MonsterKind.RZHAVNIK,
    MonsterKind.TRUBNYY_AVTOMAT,
    MonsterKind.SHADOW,
    MonsterKind.TONKAYA_TEN,
  ];
  const stride = Math.max(1, Math.floor(cells.length / 18));
  for (let i = 0; i < 18; i++) {
    const cell = cells[(i * stride + 17) % cells.length];
    if (world.cells[cell] !== Cell.FLOOR) continue;
    const kind = kinds[i % kinds.length];
    const def = MONSTERS[kind];
    if (!def) continue;
    const x = cell % W;
    const y = (cell / W) | 0;
    const hp = Math.round(def.hp * 1.45);
    entities.push({
      id: nextId.v++,
      type: EntityType.MONSTER,
      x: x + 0.5,
      y: y + 0.5,
      angle: (i / 18) * Math.PI * 2,
      pitch: 0,
      alive: true,
      speed: def.speed * 1.05,
      sprite: monsterSpr(kind),
      hp,
      maxHp: hp,
      monsterKind: kind,
      attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg: randomRPG(7),
      phasing: kind === MonsterKind.SHADOW || kind === MonsterKind.TONKAYA_TEN,
    });
  }
}

function placeSwitchyardContainers(world: World, nextId: { v: number }, rooms: SwitchyardRooms): void {
  addContainer(world, nextId, rooms.guide, rooms.guide.x + 32, rooms.guide.y + 5, ContainerKind.CASHBOX, 'Касса проводника стрелочной', [
    { defId: 'metro_ticket', count: 2 },
    { defId: 'chalk', count: 2 },
  ], ['hyperbolic_switchyard', 'pay_guide', 'trade', 'route_map'], 'public');
  addContainer(world, nextId, rooms.blueSwitch, rooms.blueSwitch.x + 6, rooms.blueSwitch.y + 20, ContainerKind.TOOL_LOCKER, 'Шкаф синего семейства дуг', [
    { defId: 'fuse', count: 1 },
    { defId: 'wire_coil', count: 1 },
  ], ['hyperbolic_switchyard', 'switch_family', 'repair'], 'room');
  addContainer(world, nextId, rooms.redSwitch, rooms.redSwitch.x + 25, rooms.redSwitch.y + 20, ContainerKind.TOOL_LOCKER, 'Шкаф красного семейства дуг', [
    { defId: 'door_kit', count: 1 },
    { defId: 'relay_diagram', count: 1 },
  ], ['hyperbolic_switchyard', 'switch_family', 'shortcut'], 'locked', 3);
  addContainer(world, nextId, rooms.shortcut, rooms.shortcut.x + 10, rooms.shortcut.y + 20, ContainerKind.METAL_CABINET, 'Аварийный ящик геодезического хода', [
    { defId: 'ammo_9mm', count: 18 },
    { defId: 'bandage', count: 2 },
    { defId: 'fuse', count: 1 },
  ], ['hyperbolic_switchyard', 'geodesic_shortcut', 'monster_heavy'], 'public');
  addContainer(world, nextId, rooms.falsePlatform, rooms.falsePlatform.x + 42, rooms.falsePlatform.y + 19, ContainerKind.SECRET_STASH, 'Пломба ложной платформы', [
    { defId: 'relay_diagram', count: 1 },
    { defId: 'metro_ticket', count: 1 },
    { defId: 'lamp_bulb', count: 1 },
  ], ['hyperbolic_switchyard', 'false_platform', 'sabotage'], 'secret', 5);
}

function addContainer(
  world: World,
  nextId: { v: number },
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  inventory: WorldContainer['inventory'],
  tags: string[],
  access: WorldContainer['access'],
  lockDifficulty?: number,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.addContainer({
    id: nextId.v++,
    x,
    y,
    floor: HYPERBOLIC_SWITCHYARD_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory,
    capacitySlots: 8,
    faction: Faction.LIQUIDATOR,
    access,
    lockDifficulty,
    discovered: access !== 'secret',
    tags,
  });
  if (world.features[ci] === Feature.NONE) world.features[ci] = Feature.SHELF;
}

function registerSwitchyardCues(world: World, rooms: SwitchyardRooms): void {
  registerSwitchyardCue(world, {
    id: 'hyperbolic_switchyard_pay_guide',
    room: rooms.guide,
    target: rooms.central,
    label: 'Проводник кривых дуг',
    hint: 'Заплатить проводнику за разметку безопасной дуги и карту ближайшей ошибки.',
    tags: ['hyperbolic_switchyard', 'pay_guide', 'paid_map'],
    color: '#7ff0b8',
    paidMapReveal: { priceRubles: 45, radius: 34, roomScanCap: 720, sellerName: GUIDE_DEF.name },
  });
  registerSwitchyardCue(world, {
    id: 'hyperbolic_switchyard_switch_family',
    room: rooms.blueSwitch,
    target: rooms.redSwitch,
    label: 'Семейства стрелок',
    hint: 'Панели дверей меняют, какая семья дуг открыта: синяя длиннее, красная короче и шумнее.',
    tags: ['hyperbolic_switchyard', 'switch_family', 'panel'],
    color: '#7fdcff',
  });
  registerSwitchyardCue(world, {
    id: 'hyperbolic_switchyard_geodesic_shortcut',
    room: rooms.shortcut,
    target: rooms.south,
    label: 'Геодезический ход',
    hint: 'Короткая диагональ режет стрелочную, но в ней стоят псевдолифты и трубные автоматы.',
    tags: ['hyperbolic_switchyard', 'geodesic_shortcut', 'monster_heavy'],
    color: '#ff7f7f',
  });
  registerSwitchyardCue(world, {
    id: 'hyperbolic_switchyard_false_platform',
    room: rooms.falsePlatform,
    target: rooms.east,
    label: 'Ложная платформа',
    hint: 'Платформа выглядит как пересадка; пломбу можно сорвать, чтобы не привести сюда следующего путника.',
    tags: ['hyperbolic_switchyard', 'false_platform', 'sabotage'],
    color: '#f9d86f',
  });
}

function registerSwitchyardCue(
  world: World,
  opts: {
    id: string;
    room: Room;
    target: Room;
    label: string;
    hint: string;
    tags: readonly string[];
    color: string;
    paidMapReveal?: { priceRubles: number; radius: number; roomScanCap: number; sellerName: string };
  },
): void {
  const x = opts.room.x + opts.room.w / 2;
  const y = opts.room.y + opts.room.h / 2;
  const targetX = opts.target.x + opts.target.w / 2;
  const targetY = opts.target.y + opts.target.h / 2;
  registerRouteCue(world, {
    id: opts.id,
    x,
    y,
    targetX,
    targetY,
    floor: HYPERBOLIC_SWITCHYARD_BASE_FLOOR,
    label: opts.label,
    hint: opts.hint,
    targetName: opts.target.name,
    color: opts.color,
    tags: opts.tags,
    toneSeed: hashSeed(opts.id),
    roomId: opts.room.id,
    targetRoomId: opts.target.id,
    zoneId: world.zoneMap[world.idx(Math.floor(x), Math.floor(y))],
    radius: 12,
    targetRadius: 4,
    heardText: opts.hint,
    followedText: `${opts.label}: цель рядом.`,
    ignoredText: `${opts.label}: дуга уходит в сторону.`,
    paidMapReveal: opts.paidMapReveal,
    routeGroup: {
      id: opts.id,
      lead: opts.label,
      risk: opts.tags.includes('monster_heavy') ? 'много монстров на коротком ходе' : 'ложная смежность стрелочной',
      decision: opts.tags.includes('paid_map') ? 'заплатить проводнику' : opts.tags.includes('sabotage') ? 'сорвать пломбу' : 'сменить путь',
      reward: opts.tags.includes('sabotage') ? 'снять ложную платформу с маршрута' : 'сократить путь и не потерять ориентир',
      mapLabel: opts.label,
      mapHint: opts.hint,
      logLine: opts.hint,
    },
  });
}

function tuneSwitchyardZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
    zone.level = Math.max(2, Math.min(6, Math.round(3 + d / 260)));
    zone.faction = d < 150 ? ZoneFaction.LIQUIDATOR
      : zone.id % 5 === 0 ? ZoneFaction.SAMOSBOR
        : zone.id % 3 === 0 ? ZoneFaction.WILD
          : ZoneFaction.LIQUIDATOR;
    zone.fogged = d > 300 && zone.id % 4 === 0;
    zone.hasLift = zone.id % 13 === 0;
  }
  for (let i = 0; i < world.factionControl.length; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.LIQUIDATOR;
  }
}

function summarizeArcs(arcMap: Map<string, { spec: ArcSpec; cells: number[] }>, rooms: SwitchyardRooms): SwitchyardArcSummary[] {
  return [...arcMap.values()].map(({ spec, cells }) => ({
    id: spec.id,
    family: spec.family,
    cellCount: cells.length,
    platformRoomId: rooms[spec.platform].id,
    shortcut: spec.shortcut === true,
  }));
}

function summarizePlatforms(rooms: SwitchyardRooms): SwitchyardPlatformSummary[] {
  return [
    ['guide', rooms.guide],
    ['central', rooms.central],
    ['north', rooms.north],
    ['south', rooms.south],
    ['west', rooms.west],
    ['east', rooms.east],
    ['blue_switch', rooms.blueSwitch],
    ['red_switch', rooms.redSwitch],
    ['shortcut', rooms.shortcut],
    ['false_platform', rooms.falsePlatform],
  ].map(([id, room]) => ({
    id: id as string,
    roomId: (room as Room).id,
    name: (room as Room).name,
    x: (room as Room).x + (room as Room).w / 2,
    y: (room as Room).y + (room as Room).h / 2,
    falsePlatform: id === 'false_platform' || undefined,
  }));
}

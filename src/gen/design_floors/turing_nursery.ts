/* -- Design floor: turing_nursery - reaction diffusion nursery routes -- */

import { stampSurfaceSplat } from '../../systems/surface_marks';
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
  type Item,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { hashSeed, withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { registerCellHazardSite } from '../../systems/cell_hazards';
import { placeEmergencyPanel } from '../../systems/emergency_panels';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG } from '../../systems/rpg';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const TURING_NURSERY_ROUTE_ID = 'turing_nursery' as const;
export const TURING_NURSERY_Z = 10 as const;
export const TURING_NURSERY_BASE_FLOOR = FloorLevel.KVARTIRY;
export const TURING_NURSERY_ROOM_PREFIX = 'Ясли Тьюринга';

const SEED = hashSeed(TURING_NURSERY_ROUTE_ID);
const CX = W >> 1;
const CY = W >> 1;
const FIELD_SIZE = 64;
const FIELD_CELLS = FIELD_SIZE * FIELD_SIZE;
const FIELD_CELL = W / FIELD_SIZE;
const FIELD_STEPS = 32;
const MAX_HAZARD_CELLS = 96;

type NextId = { v: number };
type DoorSide = 'north' | 'south' | 'west' | 'east';
type TuringNpcId =
  | 'turing_nursery_mother_agafya'
  | 'turing_nursery_liquidator_bryzga'
  | 'turing_nursery_child_sava'
  | 'turing_nursery_registrar_milena';

interface Point {
  x: number;
  y: number;
}

interface DoorSite {
  x: number;
  y: number;
  ox: number;
  oy: number;
}

interface ReactionField {
  v: Float32Array;
}

interface NurseryRooms {
  entry: Room;
  basin: Room;
  bridge: Room;
  sample: Room;
  burn: Room;
  exposure: Room;
  ward: Room;
  lowerLift: Room;
  nodes: Room[];
}

export interface TuringNurseryMetrics {
  routeId: typeof TURING_NURSERY_ROUTE_ID;
  reactionRooms: number;
  wetCells: number;
  laneCells: number;
  bridgeCells: number;
  decisionContainers: number;
}

const NPC_DEFS: Record<TuringNpcId, PlotNpcDef> = {
  turing_nursery_mother_agafya: {
    name: 'Агафья Мать-Алгоритм',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SCIENTIST,
    sprite: Occupation.SCIENTIST,
    hp: 130, maxHp: 130, money: 140, speed: 0.78,
    inventory: [
      { defId: 'nii_sample_container', count: 1 },
      { defId: 'sample_chain_form', count: 1 },
      { defId: 'decon_fluid', count: 1 },
    ],
    talkLines: [
      'Узор не растёт. Он вспоминает, где ему разрешили быть комнатой.',
      'Инокуляция нужна чаше, а не слизи. Чаша должна ошибиться первой, иначе ошибётся коридор.',
      'Синий образец не лечит. Он доказывает, что вычисление ещё заперто в банке.',
    ],
    talkLinesPost: [
      'Чаша успокоилась. Теперь линии снова похожи на план, а не на родословную.',
      'Сожжённый мост проще объяснить, чем живой, но в отчёте оба выглядят одинаково влажно.',
    ],
  },
  turing_nursery_liquidator_bryzga: {
    name: 'Брызга Л-10',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 190, maxHp: 190, money: 72, speed: 0.96,
    weapon: 'makarov',
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 20 },
      { defId: 'napalm_mix', count: 1 },
    ],
    talkLines: [
      'Мост надо жечь, пока он мост. Когда он станет аргументом, поздно.',
      'Учёные зовут это выращенной связностью. Я зову это мокрым обходом без ответственного.',
      'Если чёрная проба пошла по скелету пола, стреляйте в глаз, а не в лужу.',
    ],
    talkLinesPost: [
      'Пепел сухой. Значит, сегодня мы победили хотя бы прилагательное.',
      'Никто не любит напалм в детской. Поэтому детскую надо было не строить.',
    ],
  },
  turing_nursery_child_sava: {
    name: 'Сава Нулевой',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.CHILD,
    sprite: Occupation.CHILD,
    hp: 70, maxHp: 80, money: 4, speed: 0.86,
    inventory: [
      { defId: 'slime_age_label_orange', count: 1 },
      { defId: 'contaminated_swab', count: 1 },
    ],
    talkLines: [
      'Меня учили не наступать на клеточки. Потом клеточки выучили меня.',
      'Милена спрятала бумагу роста. Без неё я просто ребёнок в мокрой комнате.',
      'Если мост сжечь, он перестанет шептать путь. Но там останется проба.',
    ],
    talkLinesPost: [
      'Теперь бумага знает, что я был здесь до узора.',
      'Сухие клетки звучат хуже мокрых. Зато они не хватают ботинок.',
    ],
  },
  turing_nursery_registrar_milena: {
    name: 'Милена Регистр',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SECRETARY,
    sprite: Occupation.SECRETARY,
    hp: 92, maxHp: 92, money: 86, speed: 0.82,
    inventory: [
      { defId: 'record_exposure_notice', count: 1 },
      { defId: 'nii_forged_audit', count: 1 },
      { defId: 'blank_form', count: 2 },
    ],
    talkLines: [
      'Рост записан как учебный. Учебное всегда дешевле, пока не съест дверь.',
      'Акт можно спрятать в сухой папке, но узор всё равно найдёт влажную строку.',
      'Сава числится контрольной группой. Группа из одного ребёнка удобна только отчёту.',
    ],
    talkLinesPost: [
      'Акт всплыл. Теперь НИИ будет доказывать, что не умеет считать детей.',
      'Ясли закрыть нельзя. Можно только заменить название на менее живое.',
    ],
  },
};

registerSideQuest('turing_nursery_mother_agafya', NPC_DEFS.turing_nursery_mother_agafya, [
  {
    id: 'turing_nursery_inoculate_basin',
    giverNpcId: 'turing_nursery_mother_agafya',
    type: QuestType.FETCH,
    desc: 'Агафья Мать-Алгоритм: «Принесите герметичный синий образец из вычислительной чаши. Если сначала обеззаразить налёт, образец не проснётся в руках.»',
    targetItem: 'blue_glow_sample_sealed',
    targetCount: 1,
    rewardItem: 'nii_sample_container',
    rewardCount: 1,
    extraRewards: [{ defId: 'sample_chain_form', count: 1 }, { defId: 'decon_fluid', count: 1 }],
    relationDelta: 14,
    xpReward: 130,
    moneyReward: 80,
    eventTags: [TURING_NURSERY_ROUTE_ID, 'inoculation', 'sample', 'reaction_diffusion'],
    eventPrivacy: 'local',
    eventSeverity: 4,
    eventData: { routeId: TURING_NURSERY_ROUTE_ID, decision: 'inoculate_basin' },
  },
]);

registerSideQuest('turing_nursery_liquidator_bryzga', NPC_DEFS.turing_nursery_liquidator_bryzga, [
  {
    id: 'turing_nursery_burn_bridge',
    giverNpcId: 'turing_nursery_liquidator_bryzga',
    type: QuestType.KILL,
    desc: 'Брызга Л-10: «Слизевой мост держит чёрную пробу. Сожгите или отстрелите глаз у перехода, пока мост не стал новым коридором.»',
    targetMonsterKind: MonsterKind.CHERNOSLIZ,
    killNeeded: 1,
    rewardItem: 'napalm_mix',
    rewardCount: 1,
    extraRewards: [{ defId: 'deactivated_residue', count: 1 }, { defId: 'gasmask_filter', count: 1 }],
    relationDelta: 12,
    xpReward: 145,
    moneyReward: 95,
    eventTags: [TURING_NURSERY_ROUTE_ID, 'burn_bridge', 'liquidator', 'counterplay'],
    eventPrivacy: 'witnessed',
    eventSeverity: 4,
    eventData: { routeId: TURING_NURSERY_ROUTE_ID, decision: 'burn_slime_bridge' },
  },
]);

registerSideQuest('turing_nursery_child_sava', NPC_DEFS.turing_nursery_child_sava, [
  {
    id: 'turing_nursery_expose_growth_child',
    giverNpcId: 'turing_nursery_child_sava',
    type: QuestType.TALK,
    desc: 'Сава Нулевой: «Поговорите с Миленой. Пусть она скажет, что меня считали ребёнком до того, как узор решил иначе.»',
    targetPlotNpcId: 'turing_nursery_registrar_milena',
    rewardItem: 'clean_health_cert',
    rewardCount: 1,
    relationDelta: 16,
    xpReward: 75,
    moneyReward: 22,
    eventTags: [TURING_NURSERY_ROUTE_ID, 'child', 'expose_growth', 'witness'],
    eventPrivacy: 'local',
    eventData: { routeId: TURING_NURSERY_ROUTE_ID, decision: 'expose_lab_growth' },
  },
]);

registerSideQuest('turing_nursery_registrar_milena', NPC_DEFS.turing_nursery_registrar_milena, [
  {
    id: 'turing_nursery_growth_audit',
    giverNpcId: 'turing_nursery_registrar_milena',
    type: QuestType.FETCH,
    desc: 'Милена Регистр: «Верните подложный акт НИИ из комнаты экспозиции. Оставите его мне — рост останется учебным. Сдадите Агафье — ясли получат проверку.»',
    targetItem: 'nii_forged_audit',
    targetCount: 1,
    rewardItem: 'record_exposure_notice',
    rewardCount: 1,
    extraRewards: [{ defId: 'forged_quarantine_clearance', count: 1 }],
    relationDelta: 8,
    xpReward: 95,
    moneyReward: 70,
    eventTags: [TURING_NURSERY_ROUTE_ID, 'forgery', 'audit', 'expose_growth'],
    eventPrivacy: 'secret',
    eventSeverity: 3,
    eventData: { routeId: TURING_NURSERY_ROUTE_ID, decision: 'hide_or_expose_growth' },
  },
]);

export function generateTuringNurseryDesignFloor(seed = SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };
    const field = reactionField(seed);

    initWorld(world);
    const rooms = buildNurseryRooms(world, field);
    connectNurseryRooms(world, rooms, field);
    placeLifts(world, rooms);
    decorateNursery(world, rooms, field);
    generateZones(world);
    tuneNurseryZones(world);
    placeEmergencyPanels(world, rooms);

    const owners = spawnNpcs(entities, nextId, rooms);
    spawnAmbientNpcs(entities, nextId, rooms);
    const containers = placeContainers(world, rooms, owners);
    placeDrops(world, entities, nextId, rooms);
    spawnThreats(world, entities, nextId, rooms);
    registerStaticHazards(world, rooms);
    registerNurseryRouteCues(world, rooms, containers);

    sanitizeDoors(world);
    ensureConnectivity(world, rooms.entry.x + 16.5, rooms.entry.y + 12.5);
    world.rebuildContainerMap();
    world.bakeLights();

    return {
      world,
      entities,
      spawnX: rooms.entry.x + 16.5,
      spawnY: rooms.entry.y + 12.5,
    };
  });
}

export function expandTuringNurseryRouteGeometry(world: World, rng: () => number): void {
  const field = reactionField(SEED ^ 0x7a710);
  const anchors = [
    { x: 134, y: 160, name: 'северо-западная контрольная чашка' },
    { x: 806, y: 154, name: 'северо-восточный учебный рост' },
    { x: 136, y: 802, name: 'юго-западный сухой инкубатор' },
    { x: 808, y: 810, name: 'юго-восточный мокрый инкубатор' },
    { x: 504, y: 142, name: 'верхний ряд клеточных ковров' },
    { x: 512, y: 850, name: 'нижний ряд мостовых проб' },
  ];

  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const x = a.x + Math.floor((rng() - 0.5) * 34);
    const y = a.y + Math.floor((rng() - 0.5) * 28);
    const lab = addRoom(world, i % 2 === 0 ? RoomType.MEDICAL : RoomType.PRODUCTION, x, y, 52, 30, `${TURING_NURSERY_ROOM_PREFIX}: ${a.name}`, Tex.TILE_W, Tex.F_TILE);
    carveReactionLane(world, field, x + 26, y + 15, CX, CY, 3, Tex.F_TILE, false);
    stainReactionRoom(world, lab, field, SEED ^ i);
    if (i % 2 === 1) {
      const store = addRoom(world, RoomType.STORAGE, x + (x < CX ? 62 : -36), y + 4, 28, 22, `${TURING_NURSERY_ROOM_PREFIX}: шкаф ${i + 1}`, Tex.METAL, Tex.F_CONCRETE);
      connectRooms(world, lab, x < CX ? 'east' : 'west', store, x < CX ? 'west' : 'east', DoorState.CLOSED);
    }
  }

  stampReactionWater(world, field, SEED ^ 0x7070, 540);
}

export function measureTuringNurseryMetrics(generation: FloorGeneration): TuringNurseryMetrics {
  let wetCells = 0;
  let laneCells = 0;
  let bridgeCells = 0;
  for (let i = 0; i < W * W; i++) {
    if (generation.world.cells[i] === Cell.WATER) wetCells++;
    if (generation.world.cells[i] === Cell.FLOOR && generation.world.roomMap[i] < 0) laneCells++;
    const room = generation.world.rooms[generation.world.roomMap[i]];
    if (room?.name.includes('слизевой мост')) bridgeCells++;
  }
  return {
    routeId: TURING_NURSERY_ROUTE_ID,
    reactionRooms: generation.world.rooms.filter(room => room.name.startsWith(TURING_NURSERY_ROOM_PREFIX)).length,
    wetCells,
    laneCells,
    bridgeCells,
    decisionContainers: generation.world.containers.filter(container => container.tags.includes(TURING_NURSERY_ROUTE_ID)).length,
  };
}

function initWorld(world: World): void {
  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.PANEL;
    world.floorTex[i] = Tex.F_LINO;
    world.factionControl[i] = ZoneFaction.CITIZEN;
    world.fog[i] = 5;
  }
}

function buildNurseryRooms(world: World, field: ReactionField): NurseryRooms {
  const entry = addRoom(world, RoomType.CORRIDOR, CX - 40, CY + 166, 82, 24, 'Ясли Тьюринга: верхний сухой шлюз', Tex.PIPE, Tex.F_CONCRETE);
  const basin = addRoom(world, RoomType.MEDICAL, CX - 70, CY + 48, 140, 74, 'Ясли Тьюринга: вычислительная чаша инокуляции', Tex.TILE_W, Tex.F_TILE);
  const bridge = addRoom(world, RoomType.CORRIDOR, CX - 188, CY - 16, 126, 32, 'Ясли Тьюринга: слизевой мост', Tex.HERMO_WALL, Tex.F_WATER);
  const sample = addRoom(world, RoomType.STORAGE, CX + 100, CY + 42, 84, 48, 'Ясли Тьюринга: синяя пробная кладовая', Tex.METAL, Tex.F_CONCRETE);
  const burn = addRoom(world, RoomType.HQ, CX - 72, CY - 158, 96, 44, 'Ясли Тьюринга: пост прожига моста', Tex.METAL, Tex.F_CONCRETE);
  const exposure = addRoom(world, RoomType.OFFICE, CX + 86, CY - 150, 92, 46, 'Ясли Тьюринга: комната экспозиции роста', Tex.MARBLE, Tex.F_PARQUET);
  const ward = addRoom(world, RoomType.LIVING, CX - 30, CY - 74, 72, 38, 'Ясли Тьюринга: палата нулевого ребёнка', Tex.PANEL, Tex.F_CARPET);
  const lowerLift = addRoom(world, RoomType.CORRIDOR, CX - 34, CY - 236, 70, 24, 'Ясли Тьюринга: нижняя кабина узора', Tex.PIPE, Tex.F_CONCRETE);
  const nodes = buildReactionNodeRooms(world, field);
  return { entry, basin, bridge, sample, burn, exposure, ward, lowerLift, nodes };
}

function buildReactionNodeRooms(world: World, field: ReactionField): Room[] {
  const out: Room[] = [];
  const candidates: { x: number; y: number; score: number }[] = [];
  for (let gy = 13; gy <= 50; gy++) {
    for (let gx = 13; gx <= 50; gx++) {
      const concentration = field.v[gy * FIELD_SIZE + gx];
      const band = laneScore(concentration);
      if (band < 0.6) continue;
      const x = Math.floor(gx * FIELD_CELL + FIELD_CELL / 2);
      const y = Math.floor(gy * FIELD_CELL + FIELD_CELL / 2);
      const d = Math.hypot(x - CX, y - CY);
      if (d < 110 || d > 350) continue;
      const score = band * 2 + hash01(SEED, gx, gy, 17) - d / 700;
      candidates.push({ x, y, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  for (const c of candidates) {
    if (out.length >= 10) break;
    if (out.some(room => world.dist(c.x, c.y, room.x + room.w / 2, room.y + room.h / 2) < 68)) continue;
    const serial = out.length + 1;
    const type = serial % 4 === 0 ? RoomType.STORAGE : serial % 3 === 0 ? RoomType.PRODUCTION : RoomType.MEDICAL;
    const w = type === RoomType.STORAGE ? 34 : 42;
    const h = type === RoomType.PRODUCTION ? 32 : 28;
    const room = addRoom(world, type, c.x - (w >> 1), c.y - (h >> 1), w, h, `${TURING_NURSERY_ROOM_PREFIX}: клетка узора ${serial}`, type === RoomType.STORAGE ? Tex.METAL : Tex.TILE_W, type === RoomType.STORAGE ? Tex.F_CONCRETE : Tex.F_TILE);
    stainReactionRoom(world, room, field, SEED ^ serial);
    out.push(room);
  }
  return out;
}

function connectNurseryRooms(world: World, rooms: NurseryRooms, field: ReactionField): void {
  const all = [rooms.entry, rooms.basin, rooms.bridge, rooms.sample, rooms.burn, rooms.exposure, rooms.ward, rooms.lowerLift, ...rooms.nodes];
  const edges = mstEdges(world, all);
  for (const [ai, bi] of edges) {
    const a = all[ai];
    const b = all[bi];
    connectRooms(world, a, sideToward(a, b), b, sideToward(b, a), a === rooms.sample || b === rooms.sample ? DoorState.LOCKED : DoorState.CLOSED, a === rooms.sample || b === rooms.sample ? 'key' : '');
    carveReactionLane(world, field, roomCx(a), roomCy(a), roomCx(b), roomCy(b), 3, Tex.F_TILE, true);
  }

  connectRooms(world, rooms.entry, 'north', rooms.basin, 'south', DoorState.CLOSED);
  connectRooms(world, rooms.basin, 'north', rooms.ward, 'south', DoorState.CLOSED);
  connectRooms(world, rooms.ward, 'north', rooms.burn, 'south', DoorState.CLOSED);
  connectRooms(world, rooms.burn, 'north', rooms.lowerLift, 'south', DoorState.CLOSED);
  connectRooms(world, rooms.basin, 'west', rooms.bridge, 'east', DoorState.HERMETIC_CLOSED);
  connectRooms(world, rooms.basin, 'east', rooms.sample, 'west', DoorState.LOCKED, 'key');
  connectRooms(world, rooms.ward, 'east', rooms.exposure, 'west', DoorState.CLOSED);
}

function decorateNursery(world: World, rooms: NurseryRooms, field: ReactionField): void {
  setFeature(world, rooms.entry.x + 24, rooms.entry.y + 10, Feature.LAMP);
  setFeature(world, rooms.entry.x + 41, rooms.entry.y + 12, Feature.LIFT_BUTTON);
  setFeature(world, rooms.basin.x + 18, rooms.basin.y + 18, Feature.APPARATUS);
  setFeature(world, rooms.basin.x + rooms.basin.w - 20, rooms.basin.y + 18, Feature.APPARATUS);
  setFeature(world, rooms.basin.x + 30, rooms.basin.y + rooms.basin.h - 14, Feature.SINK);
  markScreenWall(world, rooms.basin.x + (rooms.basin.w >> 1), rooms.basin.y - 1, 2);
  fillBasinWater(world, rooms.basin, field);

  for (let x = rooms.bridge.x + 8; x < rooms.bridge.x + rooms.bridge.w - 8; x += 7) {
    addWetCell(world, x, rooms.bridge.y + 14);
    addWetCell(world, x, rooms.bridge.y + 15);
    if (x % 3 === 0) setFeature(world, x, rooms.bridge.y + 8, Feature.APPARATUS);
  }
  stampSurfaceSplat(world, roomCx(rooms.bridge), roomCy(rooms.bridge), 0.5, 0.5, 12, 0.34, SEED ^ 0x6b1d, 42, 165, 96, false);

  for (let x = rooms.sample.x + 10; x < rooms.sample.x + rooms.sample.w - 8; x += 14) {
    setFeature(world, x, rooms.sample.y + 12, Feature.SHELF);
  }
  markScreenWall(world, rooms.sample.x + rooms.sample.w - 10, rooms.sample.y - 1, 6);
  setFeature(world, rooms.burn.x + 12, rooms.burn.y + 14, Feature.DESK);
  setFeature(world, rooms.burn.x + 36, rooms.burn.y + 14, Feature.SHELF);
  setFeature(world, rooms.exposure.x + 10, rooms.exposure.y + 14, Feature.DESK);
  setFeature(world, rooms.exposure.x + rooms.exposure.w - 12, rooms.exposure.y + 14, Feature.SHELF);
  markScreenWall(world, rooms.exposure.x + 22, rooms.exposure.y - 1, 4);

  for (let x = rooms.ward.x + 12; x < rooms.ward.x + rooms.ward.w - 8; x += 20) setFeature(world, x, rooms.ward.y + 16, Feature.BED);
  setFeature(world, rooms.lowerLift.x + 20, rooms.lowerLift.y + 11, Feature.LAMP);

  for (let i = 0; i < rooms.nodes.length; i++) {
    const room = rooms.nodes[i];
    setFeature(world, room.x + 7, room.y + 7, i % 2 === 0 ? Feature.APPARATUS : Feature.SHELF);
    if (i % 3 === 0) markScreenWall(world, room.x + Math.floor(room.w / 2), room.y - 1, i);
  }

  stampReactionWater(world, field, SEED ^ 0x1234, 260);
}

function placeEmergencyPanels(world: World, rooms: NurseryRooms): void {
  placeEmergencyPanel(world, rooms.basin.x + 10, rooms.basin.y + 10, 'panel_water', SEED ^ 0x10);
  placeEmergencyPanel(world, rooms.burn.x + rooms.burn.w - 12, rooms.burn.y + 10, 'panel_power', SEED ^ 0x20);
  placeEmergencyPanel(world, rooms.exposure.x + rooms.exposure.w - 12, rooms.exposure.y + 10, 'panel_doors', SEED ^ 0x30);
  placeEmergencyPanel(world, rooms.sample.x + 10, rooms.sample.y + 10, 'panel_vent', SEED ^ 0x40);
}

function placeLifts(world: World, rooms: NurseryRooms): void {
  placeLift(world, rooms.entry.x + 10, rooms.entry.y + 12, rooms.entry.x + 17, rooms.entry.y + 12, LiftDirection.UP);
  placeLift(world, rooms.lowerLift.x + rooms.lowerLift.w - 10, rooms.lowerLift.y + 12, rooms.lowerLift.x + rooms.lowerLift.w - 17, rooms.lowerLift.y + 12, LiftDirection.DOWN);
}

function tuneNurseryZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CX, CY);
    zone.level = d < 230 ? 3 : 4;
    zone.faction = d < 210 ? ZoneFaction.LIQUIDATOR : zone.id % 4 === 0 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    zone.fogged = false;
    zone.hasLift = d < 270;
  }
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.WATER) {
      const zone = world.zones[world.zoneMap[i]];
      if (zone) {
        zone.faction = ZoneFaction.WILD;
        zone.level = Math.max(zone.level, 4);
      }
    }
  }
  for (let i = 0; i < W * W; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.CITIZEN;
  }
}

function spawnNpcs(entities: Entity[], nextId: NextId, rooms: NurseryRooms): Record<TuringNpcId, number> {
  return {
    turing_nursery_mother_agafya: spawnPlotNpc(entities, nextId, 'turing_nursery_mother_agafya', NPC_DEFS.turing_nursery_mother_agafya, rooms.basin.x + 24, rooms.basin.y + 26, 0),
    turing_nursery_liquidator_bryzga: spawnPlotNpc(entities, nextId, 'turing_nursery_liquidator_bryzga', NPC_DEFS.turing_nursery_liquidator_bryzga, rooms.burn.x + 22, rooms.burn.y + 22, Math.PI / 2, 'makarov'),
    turing_nursery_child_sava: spawnPlotNpc(entities, nextId, 'turing_nursery_child_sava', NPC_DEFS.turing_nursery_child_sava, rooms.ward.x + 28, rooms.ward.y + 18, 0),
    turing_nursery_registrar_milena: spawnPlotNpc(entities, nextId, 'turing_nursery_registrar_milena', NPC_DEFS.turing_nursery_registrar_milena, rooms.exposure.x + 22, rooms.exposure.y + 22, Math.PI),
  };
}

function spawnAmbientNpcs(entities: Entity[], nextId: NextId, rooms: NurseryRooms): void {
  spawnAmbientNpc(entities, nextId, 'Лаборант чаши Тьюринга', Faction.SCIENTIST, Occupation.SCIENTIST, rooms.basin.x + 106, rooms.basin.y + 42, [
    { defId: 'sterile_swab', count: 2 },
    { defId: 'nii_sample_label', count: 1 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Санитар сухих клеток', Faction.SCIENTIST, Occupation.DOCTOR, rooms.sample.x + 22, rooms.sample.y + 24, [
    { defId: 'anti_spore_inhaler', count: 1 },
    { defId: 'burn_gel', count: 1 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Ликвидатор у мокрой диагонали', Faction.LIQUIDATOR, Occupation.HUNTER, rooms.bridge.x + 18, rooms.bridge.y + 16, [
    { defId: 'ammo_9mm', count: 12 },
    { defId: 'gasmask_filter', count: 1 },
  ], 'makarov');
}

function placeContainers(world: World, rooms: NurseryRooms, owners: Record<TuringNpcId, number>): Record<string, WorldContainer> {
  const basinKit = addContainer(world, rooms.basin, rooms.basin.x + 12, rooms.basin.y + 14, ContainerKind.MEDICAL_CABINET, 'Лоток инокуляции вычислительной чаши', 'public', [
    { defId: 'decon_fluid', count: 2 },
    { defId: 'sterile_swab', count: 2 },
    { defId: 'nii_sample_container', count: 1 },
  ], undefined, undefined, [TURING_NURSERY_ROUTE_ID, 'inoculation', 'basin', 'sample']);

  const sampleVault = addContainer(world, rooms.sample, rooms.sample.x + 14, rooms.sample.y + 12, ContainerKind.MEDICAL_CABINET, 'Синий шкаф вычисленной пробы', 'locked', [
    { defId: 'blue_glow_sample_sealed', count: 1 },
    { defId: 'slime_sample_blue', count: 1 },
    { defId: 'gas_sample_ampoule', count: 1 },
    { defId: 'sample_chain_form', count: 1 },
    { defId: 'nii_sample_label', count: 2 },
  ], owners.turing_nursery_mother_agafya, NPC_DEFS.turing_nursery_mother_agafya.name, [TURING_NURSERY_ROUTE_ID, 'sample', 'harvest', 'blue_sample']);

  const burnCache = addContainer(world, rooms.burn, rooms.burn.x + rooms.burn.w - 12, rooms.burn.y + 12, ContainerKind.WEAPON_CRATE, 'Ящик прожига слизевого моста', 'faction', [
    { defId: 'napalm_mix', count: 2 },
    { defId: 'ammo_12g_chemical', count: 1 },
    { defId: 'burn_gel', count: 1 },
    { defId: 'deactivated_residue', count: 1 },
  ], owners.turing_nursery_liquidator_bryzga, NPC_DEFS.turing_nursery_liquidator_bryzga.name, [TURING_NURSERY_ROUTE_ID, 'burn_bridge', 'liquidator', 'counterplay']);

  const exposureFile = addContainer(world, rooms.exposure, rooms.exposure.x + rooms.exposure.w - 12, rooms.exposure.y + 14, ContainerKind.FILING_CABINET, 'Папка экспозиции роста', 'owner', [
    { defId: 'nii_forged_audit', count: 1 },
    { defId: 'record_exposure_notice', count: 1 },
    { defId: 'forged_quarantine_clearance', count: 1 },
    { defId: 'blank_form', count: 1 },
  ], owners.turing_nursery_registrar_milena, NPC_DEFS.turing_nursery_registrar_milena.name, [TURING_NURSERY_ROUTE_ID, 'expose_growth', 'audit', 'documents']);

  addContainer(world, rooms.ward, rooms.ward.x + 8, rooms.ward.y + 10, ContainerKind.WOODEN_CHEST, 'Тумба нулевого ребёнка', 'secret', [
    { defId: 'slime_age_label_orange', count: 1 },
    { defId: 'clean_health_cert', count: 1 },
  ], owners.turing_nursery_child_sava, NPC_DEFS.turing_nursery_child_sava.name, [TURING_NURSERY_ROUTE_ID, 'child', 'witness', 'expose_growth']);

  for (let i = 0; i < Math.min(rooms.nodes.length, 6); i++) {
    const room = rooms.nodes[i];
    addContainer(world, room, room.x + room.w - 8, room.y + 8, i % 2 === 0 ? ContainerKind.MEDICAL_CABINET : ContainerKind.METAL_CABINET, `Шкаф клетки узора ${i + 1}`, i % 3 === 0 ? 'locked' : 'public', [
      { defId: i % 2 === 0 ? 'slime_sample_green' : 'contaminated_swab', count: 1 },
      { defId: 'filter_layer', count: 1 },
    ], undefined, undefined, [TURING_NURSERY_ROUTE_ID, 'reaction_cell', 'sample']);
  }

  return { basinKit, sampleVault, burnCache, exposureFile };
}

function placeDrops(world: World, entities: Entity[], nextId: NextId, rooms: NurseryRooms): void {
  dropItem(world, entities, nextId, rooms.entry.x + 30, rooms.entry.y + 14, 'gasmask_filter', 1);
  dropItem(world, entities, nextId, rooms.basin.x + 40, rooms.basin.y + 44, 'decon_fluid', 1);
  dropItem(world, entities, nextId, rooms.bridge.x + rooms.bridge.w - 20, rooms.bridge.y + 16, 'deactivated_residue', 1);
}

function spawnThreats(world: World, entities: Entity[], nextId: NextId, rooms: NurseryRooms): void {
  spawnMonster(world, entities, nextId, MonsterKind.CHERNOSLIZ, rooms.bridge.x + rooms.bridge.w - 26, rooms.bridge.y + 16, 4, 'Чёрная проба на слизевом мосту');
  spawnMonster(world, entities, nextId, MonsterKind.SLIME_WOMAN, rooms.basin.x + rooms.basin.w - 34, rooms.basin.y + 48, 4, 'Жижевая воспитательница чаши');
  spawnMonster(world, entities, nextId, MonsterKind.HEAD_SLUG, rooms.ward.x + rooms.ward.w - 12, rooms.ward.y + 18, 3, 'Головной слизень у кровати');
  spawnMonster(world, entities, nextId, MonsterKind.TRUBNYY_AVTOMAT, rooms.sample.x + rooms.sample.w - 20, rooms.sample.y + 26, 4, 'Трубный автомат синего шкафа');
  for (let i = 0; i < Math.min(rooms.nodes.length, 4); i++) {
    const room = rooms.nodes[i];
    spawnMonster(world, entities, nextId, i % 2 === 0 ? MonsterKind.SLIMEVIK : MonsterKind.BEZEKHIY, room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2), 3, `Сбой клетки узора ${i + 1}`);
  }
}

function registerStaticHazards(world: World, rooms: NurseryRooms): void {
  const basinCells = hazardCellsForRoom(world, rooms.basin, MAX_HAZARD_CELLS);
  registerCellHazardSite(world, {
    id: 'turing_nursery_basin_growth',
    kind: 'slime',
    displayName: 'инокуляционный налёт яслей',
    cells: basinCells,
    tags: [TURING_NURSERY_ROUTE_ID, 'inoculation', 'reaction_diffusion', 'slime', 'cleanable'],
    roomId: rooms.basin.id,
    zoneId: world.zoneMap[world.idx(roomCx(rooms.basin), roomCy(rooms.basin))],
    centerX: roomCx(rooms.basin),
    centerY: roomCy(rooms.basin),
    playerDamagePerSecond: 0.4,
    slowMult: 0.62,
    trappedMult: 0.22,
    activeFog: 32,
    warning: 'Инокуляционный налёт липнет к обуви. Обеззараживающая жидкость снимет часть узора.',
  });

  const bridgeCells = hazardCellsForRoom(world, rooms.bridge, MAX_HAZARD_CELLS);
  registerCellHazardSite(world, {
    id: 'turing_nursery_bridge_growth',
    kind: 'slime',
    displayName: 'слизевой мост яслей',
    cells: bridgeCells,
    tags: [TURING_NURSERY_ROUTE_ID, 'burn_bridge', 'reaction_diffusion', 'slime', 'cleanable'],
    roomId: rooms.bridge.id,
    zoneId: world.zoneMap[world.idx(roomCx(rooms.bridge), roomCy(rooms.bridge))],
    centerX: roomCx(rooms.bridge),
    centerY: roomCy(rooms.bridge),
    playerDamagePerSecond: 0.55,
    slowMult: 0.55,
    trappedMult: 0.16,
    activeFog: 42,
    warning: 'Слизевой мост держит ногу и шепчет маршрут. Огонь или реагент рвут связность.',
  });
}

function registerNurseryRouteCues(world: World, rooms: NurseryRooms, containers: Record<string, WorldContainer>): void {
  registerRouteCue(world, {
    id: 'turing_nursery_inoculation_basin',
    x: rooms.entry.x + 22.5,
    y: rooms.entry.y + 11.5,
    targetX: containers.basinKit.x + 0.5,
    targetY: containers.basinKit.y + 0.5,
    floor: TURING_NURSERY_BASE_FLOOR,
    roomId: rooms.entry.id,
    targetRoomId: rooms.basin.id,
    zoneId: world.zoneMap[world.idx(rooms.entry.x + 22, rooms.entry.y + 11)],
    label: 'чаша инокуляции',
    hint: 'реагент открывает безопасный сбор синей пробы',
    targetName: containers.basinKit.name,
    color: '#7fdc8a',
    tags: [TURING_NURSERY_ROUTE_ID, 'inoculation', 'sample', 'counterplay'],
    toneSeed: rooms.basin.id * 97 + containers.basinKit.id,
    heardText: 'Чаша Тьюринга щёлкает мокрым счётом: сначала реагент, потом проба.',
    followedText: 'Вы у лотка инокуляции. Синий шкаф рядом, но мокрый узор любит голые руки.',
    ignoredText: 'Сухой шлюз остался позади. Чаша продолжает считать мокрые клетки.',
  });

  registerRouteCue(world, {
    id: 'turing_nursery_burn_bridge',
    x: rooms.burn.x + 12.5,
    y: rooms.burn.y + 13.5,
    targetX: roomCx(rooms.bridge) + 0.5,
    targetY: roomCy(rooms.bridge) + 0.5,
    floor: TURING_NURSERY_BASE_FLOOR,
    roomId: rooms.burn.id,
    targetRoomId: rooms.bridge.id,
    zoneId: world.zoneMap[world.idx(rooms.burn.x + 12, rooms.burn.y + 13)],
    label: 'слизевой мост',
    hint: 'напалм и химия рвут мокрую связность',
    targetName: rooms.bridge.name,
    color: '#ff9b5a',
    tags: [TURING_NURSERY_ROUTE_ID, 'burn_bridge', 'fire', 'counterplay'],
    toneSeed: rooms.bridge.id * 101,
    heardText: 'Пост прожига стучит клапаном: слизевой мост ещё держит переход.',
    followedText: 'Вы у слизевого моста. Чёрная проба охраняет влажную перемычку.',
    ignoredText: 'Мост остался живым за спиной и продолжает выбирать короткую дорогу.',
  });

  registerRouteCue(world, {
    id: 'turing_nursery_growth_exposure',
    x: rooms.ward.x + 18.5,
    y: rooms.ward.y + 18.5,
    targetX: containers.exposureFile.x + 0.5,
    targetY: containers.exposureFile.y + 0.5,
    floor: TURING_NURSERY_BASE_FLOOR,
    roomId: rooms.ward.id,
    targetRoomId: rooms.exposure.id,
    zoneId: world.zoneMap[world.idx(rooms.ward.x + 18, rooms.ward.y + 18)],
    label: 'акт роста',
    hint: 'бумага решает: учебная слизь или доказательство',
    targetName: containers.exposureFile.name,
    color: '#8fdcff',
    tags: [TURING_NURSERY_ROUTE_ID, 'expose_growth', 'documents', 'child'],
    toneSeed: rooms.exposure.id * 103 + containers.exposureFile.id,
    heardText: 'Из палаты нулевого ребёнка слышно: бумага роста спрятана в комнате экспозиции.',
    followedText: 'Вы у папки экспозиции роста. Этот акт можно спрятать, сдать или продать как чужую ошибку.',
    ignoredText: 'Палата осталась тихой. Без акта Сава остаётся контрольной группой.',
  });
}

function addRoom(
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
  const room = stampRoom(world, world.rooms.length, type, Math.floor(x), Math.floor(y), w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const idx = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) {
        world.floorTex[idx] = floorTex;
      } else if (world.cells[idx] === Cell.WALL) {
        world.wallTex[idx] = wallTex;
        if (wallTex === Tex.HERMO_WALL) world.hermoWall[idx] = 1;
      }
    }
  }
  return room;
}

function connectRooms(world: World, a: Room, sideA: DoorSide, b: Room, sideB: DoorSide, state: DoorState, keyId = ''): void {
  const da = doorSite(a, sideA);
  const db = doorSite(b, sideB);
  const ai = addDoorAt(world, a, da.x, da.y, state, keyId);
  const bi = addDoorAt(world, b, db.x, db.y, state === DoorState.LOCKED ? DoorState.CLOSED : state, keyId);
  const ad = world.doors.get(ai);
  const bd = world.doors.get(bi);
  if (ad) ad.roomB = b.id;
  if (bd) bd.roomB = a.id;
  carveLineWidth(world, da.ox, da.oy, db.ox, db.oy, 3, a.floorTex);
}

function addDoorAt(world: World, room: Room, x: number, y: number, state: DoorState, keyId = ''): number {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.hermoWall[idx] = 0;
  world.wallTex[idx] = state === DoorState.LOCKED || state === DoorState.HERMETIC_CLOSED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
  const existing = world.doors.get(idx);
  if (existing) {
    existing.state = state;
    existing.keyId = keyId;
  } else {
    world.doors.set(idx, { idx, state, roomA: room.id, roomB: -1, keyId, timer: 0 });
  }
  if (!room.doors.includes(idx)) room.doors.push(idx);
  return idx;
}

function doorSite(room: Room, side: DoorSide): DoorSite {
  switch (side) {
    case 'north': {
      const x = room.x + (room.w >> 1);
      return { x, y: room.y - 1, ox: x, oy: room.y };
    }
    case 'south': {
      const x = room.x + (room.w >> 1);
      return { x, y: room.y + room.h, ox: x, oy: room.y + room.h - 1 };
    }
    case 'west': {
      const y = room.y + (room.h >> 1);
      return { x: room.x - 1, y, ox: room.x, oy: y };
    }
    case 'east': {
      const y = room.y + (room.h >> 1);
      return { x: room.x + room.w, y, ox: room.x + room.w - 1, oy: y };
    }
  }
}

function sideToward(from: Room, to: Room): DoorSide {
  const dx = to.x + to.w / 2 - (from.x + from.w / 2);
  const dy = to.y + to.h / 2 - (from.y + from.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'east' : 'west';
  return dy > 0 ? 'south' : 'north';
}

function mstEdges(world: World, rooms: readonly Room[]): [number, number][] {
  const edges: [number, number][] = [];
  if (rooms.length < 2) return edges;
  const used = new Uint8Array(rooms.length);
  used[0] = 1;
  while (edges.length < rooms.length - 1) {
    let bestA = -1;
    let bestB = -1;
    let bestD = Infinity;
    for (let a = 0; a < rooms.length; a++) {
      if (!used[a]) continue;
      for (let b = 0; b < rooms.length; b++) {
        if (used[b]) continue;
        const d = world.dist2(roomCx(rooms[a]), roomCy(rooms[a]), roomCx(rooms[b]), roomCy(rooms[b]));
        if (d < bestD) {
          bestD = d;
          bestA = a;
          bestB = b;
        }
      }
    }
    if (bestA < 0 || bestB < 0) break;
    used[bestB] = 1;
    edges.push([bestA, bestB]);
  }
  return edges;
}

function carveReactionLane(world: World, field: ReactionField, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex, mark = false): void {
  let x = Math.round(ax);
  let y = Math.round(ay);
  const tx = Math.round(bx);
  const ty = Math.round(by);
  const touched: Point[] = [];
  for (let step = 0; step < 900 && (x !== tx || y !== ty); step++) {
    carveDisc(world, x, y, width, floorTex);
    if (mark && step % 17 === 0) touched.push({ x, y });
    let bestX = x;
    let bestY = y;
    let bestScore = -Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = world.wrap(x + dx);
        const ny = world.wrap(y + dy);
        const d = world.dist(nx, ny, tx, ty);
        const score = -d * 0.028 + reactionLaneAt(field, nx, ny) + (dx !== 0 && dy !== 0 ? -0.08 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestX = nx;
          bestY = ny;
        }
      }
    }
    if (bestX === x && bestY === y) break;
    x = bestX;
    y = bestY;
  }
  carveDisc(world, tx, ty, width, floorTex);
  if (mark) {
    for (let i = 0; i < touched.length; i++) {
      if ((i & 1) === 0) stampSurfaceSplat(world, touched[i].x, touched[i].y, 0.5, 0.5, 1.7, 0.12, SEED ^ i, 72, 180, 118, false);
    }
  }
}

function carveLineWidth(world: World, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  if (Math.abs(ax - bx) > Math.abs(ay - by)) {
    const from = Math.min(ax, bx);
    const to = Math.max(ax, bx);
    for (let x = from; x <= to; x++) carveDisc(world, x, ay, width, floorTex);
    const x = bx;
    const y0 = Math.min(ay, by);
    const y1 = Math.max(ay, by);
    for (let y = y0; y <= y1; y++) carveDisc(world, x, y, width, floorTex);
  } else {
    const from = Math.min(ay, by);
    const to = Math.max(ay, by);
    for (let y = from; y <= to; y++) carveDisc(world, ax, y, width, floorTex);
    const y = by;
    const x0 = Math.min(ax, bx);
    const x1 = Math.max(ax, bx);
    for (let x = x0; x <= x1; x++) carveDisc(world, x, y, width, floorTex);
  }
}

function carveDisc(world: World, cx: number, cy: number, r: number, floorTex: Tex, roomId = -1): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const idx = world.idx(cx + dx, cy + dy);
      if (world.cells[idx] === Cell.LIFT || world.hermoWall[idx]) continue;
      world.cells[idx] = Cell.FLOOR;
      if (roomId >= 0 || world.roomMap[idx] < 0) world.roomMap[idx] = roomId;
      world.floorTex[idx] = floorTex;
      if (world.features[idx] !== Feature.NONE) world.features[idx] = Feature.NONE;
    }
  }
}

function fillBasinWater(world: World, room: Room, field: ReactionField): void {
  for (let y = room.y + 10; y < room.y + room.h - 8; y++) {
    for (let x = room.x + 10; x < room.x + room.w - 10; x++) {
      const c = reactionAt(field, x, y);
      if (laneScore(c) < 0.58 && hash01(SEED, x, y, 31) < 0.74) continue;
      addWetCell(world, x, y);
    }
  }
  stampSurfaceSplat(world, roomCx(room), roomCy(room), 0.5, 0.5, 18, 0.24, SEED ^ 0xbaa, 58, 174, 126, false);
}

function stainReactionRoom(world: World, room: Room, field: ReactionField, salt: number): void {
  for (let y = room.y + 3; y < room.y + room.h - 3; y++) {
    for (let x = room.x + 3; x < room.x + room.w - 3; x++) {
      const c = reactionAt(field, x, y);
      if (c < 0.16 || c > 0.5 || hash01(salt, x, y, 11) < 0.72) continue;
      const idx = world.idx(x, y);
      if (world.cells[idx] === Cell.FLOOR && world.features[idx] === Feature.NONE) {
        world.floorTex[idx] = c > 0.3 ? Tex.F_WATER : room.floorTex;
        if (c > 0.34 && hash01(salt, x, y, 19) > 0.62) world.cells[idx] = Cell.WATER;
      }
    }
  }
}

function stampReactionWater(world: World, field: ReactionField, salt: number, cap: number): void {
  let changed = 0;
  for (let gy = 0; gy < FIELD_SIZE && changed < cap; gy++) {
    for (let gx = 0; gx < FIELD_SIZE && changed < cap; gx++) {
      const c = field.v[gy * FIELD_SIZE + gx];
      if (c < 0.18 || c > 0.45 || hash01(salt, gx, gy, 7) < 0.42) continue;
      const x = Math.floor(gx * FIELD_CELL + hash01(salt, gx, gy, 17) * FIELD_CELL);
      const y = Math.floor(gy * FIELD_CELL + hash01(salt, gx, gy, 29) * FIELD_CELL);
      const idx = world.idx(x, y);
      if (world.cells[idx] !== Cell.FLOOR || world.hermoWall[idx] || world.features[idx] !== Feature.NONE) continue;
      const room = world.rooms[world.roomMap[idx]];
      if (room?.name.includes('шлюз') || room?.name.includes('кабина')) continue;
      world.cells[idx] = Cell.WATER;
      world.floorTex[idx] = Tex.F_WATER;
      changed++;
      if ((changed & 15) === 0) stampSurfaceSplat(world, x, y, 0.5, 0.5, 2.5, 0.12, salt ^ idx, 54, 160, 102, false);
    }
  }
}

function reactionField(seed: number): ReactionField {
  const u = new Float32Array(FIELD_CELLS);
  const v = new Float32Array(FIELD_CELLS);
  const nextU = new Float32Array(FIELD_CELLS);
  const nextV = new Float32Array(FIELD_CELLS);
  u.fill(1);
  const seeds = [
    { x: 32, y: 32, r: 8, w: 0.95 },
    { x: 22, y: 36, r: 7, w: 0.72 },
    { x: 42, y: 27, r: 6, w: 0.66 },
    { x: 18, y: 18, r: 5, w: 0.55 },
    { x: 47, y: 46, r: 6, w: 0.58 },
  ];
  for (const s of seeds) seedReaction(u, v, s.x, s.y, s.r, s.w);

  for (let step = 0; step < FIELD_STEPS; step++) {
    for (let y = 0; y < FIELD_SIZE; y++) {
      for (let x = 0; x < FIELD_SIZE; x++) {
        const i = y * FIELD_SIZE + x;
        const uvv = u[i] * v[i] * v[i];
        const feed = 0.031 + hash01(seed, x, y, 5) * 0.013;
        const kill = 0.056 + hash01(seed, x, y, 13) * 0.012;
        nextU[i] = clamp01(u[i] + 0.155 * laplace(u, x, y) - uvv + feed * (1 - u[i]));
        nextV[i] = clamp01(v[i] + 0.078 * laplace(v, x, y) + uvv - (feed + kill) * v[i]);
      }
    }
    u.set(nextU);
    v.set(nextV);
  }
  return { v };
}

function seedReaction(u: Float32Array, v: Float32Array, sx: number, sy: number, radius: number, weight: number): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > radius) continue;
      const x = fieldWrap(sx + dx);
      const y = fieldWrap(sy + dy);
      const i = y * FIELD_SIZE + x;
      const k = (1 - d / radius) * weight;
      v[i] = Math.min(0.82, v[i] + k * 0.44);
      u[i] = Math.max(0.18, u[i] - k * 0.22);
    }
  }
}

function laplace(values: Float32Array, x: number, y: number): number {
  const center = values[y * FIELD_SIZE + x];
  return -center
    + (values[y * FIELD_SIZE + fieldWrap(x - 1)] + values[y * FIELD_SIZE + fieldWrap(x + 1)] + values[fieldWrap(y - 1) * FIELD_SIZE + x] + values[fieldWrap(y + 1) * FIELD_SIZE + x]) * 0.2
    + (values[fieldWrap(y - 1) * FIELD_SIZE + fieldWrap(x - 1)] + values[fieldWrap(y - 1) * FIELD_SIZE + fieldWrap(x + 1)] + values[fieldWrap(y + 1) * FIELD_SIZE + fieldWrap(x - 1)] + values[fieldWrap(y + 1) * FIELD_SIZE + fieldWrap(x + 1)]) * 0.05;
}

function reactionAt(field: ReactionField, x: number, y: number): number {
  const gx = fieldWrap(Math.floor(x / FIELD_CELL));
  const gy = fieldWrap(Math.floor(y / FIELD_CELL));
  return field.v[gy * FIELD_SIZE + gx];
}

function reactionLaneAt(field: ReactionField, x: number, y: number): number {
  return laneScore(reactionAt(field, x, y));
}

function laneScore(value: number): number {
  const a = Math.max(0, 1 - Math.abs(value - 0.22) / 0.11);
  const b = Math.max(0, 1 - Math.abs(value - 0.36) / 0.08);
  return Math.max(a, b * 0.88);
}

function fieldWrap(value: number): number {
  return ((value % FIELD_SIZE) + FIELD_SIZE) % FIELD_SIZE;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function hash01(seed: number, x: number, y: number, salt: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h ^= Math.imul((x + 0x632be5ab) | 0, 0x27d4eb2d);
  h ^= Math.imul((y + 0x85157af5) | 0, 0x165667b1);
  h ^= Math.imul((salt + 0x94d049bb) | 0, 0xd3a2646c);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 0x100000000;
}

function hazardCellsForRoom(world: World, room: Room, cap: number): number[] {
  const cells: number[] = [];
  for (let y = room.y + 2; y < room.y + room.h - 2 && cells.length < cap; y++) {
    for (let x = room.x + 2; x < room.x + room.w - 2 && cells.length < cap; x++) {
      const idx = world.idx(x, y);
      if (world.cells[idx] !== Cell.WATER && world.cells[idx] !== Cell.FLOOR) continue;
      if (world.features[idx] !== Feature.NONE) continue;
      if (hash01(SEED, x, y, room.id) < 0.46) cells.push(idx);
    }
  }
  return cells;
}

function addWetCell(world: World, x: number, y: number): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] !== Cell.FLOOR) return;
  world.cells[idx] = Cell.WATER;
  world.floorTex[idx] = Tex.F_WATER;
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) world.features[idx] = feature;
}

function markScreenWall(world: World, x: number, y: number, frame: number): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] !== Cell.WALL) return;
  world.features[idx] = Feature.SCREEN;
  world.wallTex[idx] = (Tex.SCREEN_BASE + (frame % 8) * 4) as Tex;
  if (!world.screenCells.includes(idx)) world.screenCells.push(idx);
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(x, y);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.liftDir[li] = direction;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR) world.features[bi] = Feature.LIFT_BUTTON;
  world.liftDir[bi] = direction;
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: NextId,
  npcId: TuringNpcId,
  def: PlotNpcDef,
  x: number,
  y: number,
  angle: number,
  weapon = def.weapon,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: def.sprite,
    name: def.name,
    isFemale: def.isFemale,
    needs: freshNeeds(),
    hp: def.hp,
    maxHp: def.maxHp,
    money: def.money,
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(item => ({ ...item })),
    weapon,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
  });
  return id;
}

function spawnAmbientNpc(
  entities: Entity[],
  nextId: NextId,
  name: string,
  faction: Faction,
  occupation: Occupation,
  x: number,
  y: number,
  inventory: Item[],
  weapon?: string,
): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: faction === Faction.LIQUIDATOR ? 0.95 : 0.75 + Math.random() * 0.18,
    sprite: occupation,
    name,
    needs: freshNeeds(),
    hp: faction === Faction.LIQUIDATOR ? 150 : 88,
    maxHp: faction === Faction.LIQUIDATOR ? 150 : 88,
    money: 10 + Math.floor(Math.random() * 42),
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory.map(item => ({ ...item })),
    weapon,
    faction,
    occupation,
    questId: -1,
  });
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: NextId,
  kind: MonsterKind,
  x: number,
  y: number,
  level: number,
  name?: string,
): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) return;
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = Math.round(def.hp * (0.86 + level * 0.16));
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (0.95 + level * 0.04),
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
    phasing: kind === MonsterKind.SHADOW || kind === MonsterKind.SPIRIT,
  });
}

function addContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: Item[],
  ownerNpcId: number | undefined,
  ownerName: string | undefined,
  tags: string[],
): WorldContainer {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: world.wrap(x),
    y: world.wrap(y),
    floor: TURING_NURSERY_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: Math.max(8, inventory.length + 4),
    ownerNpcId,
    ownerName,
    faction: access === 'faction' ? Faction.LIQUIDATOR : undefined,
    access,
    lockDifficulty: access === 'locked' ? 4 : undefined,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.MEDICAL_CABINET ? Feature.APPARATUS : Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function dropItem(world: World, entities: Entity[], nextId: NextId, x: number, y: number, defId: string, count: number): void {
  const idx = world.idx(x, y);
  if (world.cells[idx] !== Cell.FLOOR && world.cells[idx] !== Cell.WATER) return;
  entities.push({
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count }],
  });
}

function roomCx(room: Room): number {
  return room.x + Math.floor(room.w / 2);
}

function roomCy(room: Room): number {
  return room.y + Math.floor(room.h / 2);
}

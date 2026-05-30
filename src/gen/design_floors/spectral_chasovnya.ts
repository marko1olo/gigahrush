/* -- Design floor: spectral_chasovnya - sound, cult and hearing geometry -- */

import {
  AIGoal,
  Cell,
  ContainerKind,
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
  msg,
  type Entity,
  type GameState,
  type Item,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr } from '../../render/sprite_index';
import { registerContentInteractionHook } from '../../systems/content_hooks';
import { publishEvent } from '../../systems/events';
import { publishNoise } from '../../systems/noise';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG } from '../../systems/rpg';
import { carveCorridor, ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const SPECTRAL_CHASOVNYA_ROUTE_ID = 'spectral_chasovnya' as const;
export const SPECTRAL_CHASOVNYA_Z = -42 as const;
export const SPECTRAL_CHASOVNYA_BASE_FLOOR = FloorLevel.HELL;

export const SPECTRAL_CHASOVNYA_ROOM_NAMES = {
  entry: 'Преддверие спектральной часовни',
  nave: 'Неф стоячей волны',
  bellCage: 'Колокольная клетка спектрального звона',
  radioSacristy: 'Радиоризница глухих свечей',
  quietNorth: 'Северная акустическая тень',
  quietSouth: 'Южная акустическая тень',
  focusArch: 'Фокусирующая арка слепого прострела',
  crypt: 'Костяной резонатор нижнего хора',
  exit: 'Нижний притвор без эха',
} as const;

type NextId = { v: number };
type SpectralRoomKey = keyof typeof SPECTRAL_CHASOVNYA_ROOM_NAMES;
type SpectralRooms = Record<SpectralRoomKey, Room>;
type SpectralDecision = 'fire_loudly' | 'move_silently' | 'ring_bell' | 'avoid_focus' | 'listen_radio' | 'flee';

export interface SpectralStandingWaveRoom {
  id: string;
  roomName: string;
  roomId: number;
  x: number;
  y: number;
  wavelengthCells: number;
  pressure: 1 | 2 | 3 | 4 | 5;
  decisions: SpectralDecision[];
  tags: string[];
}

export interface SpectralShadowZone {
  id: string;
  roomName: string;
  roomId: number;
  x: number;
  y: number;
  radius: number;
  coverCells: number;
  decisions: SpectralDecision[];
  tags: string[];
}

export interface SpectralBellNode {
  id: string;
  roomName: string;
  roomId: number;
  x: number;
  y: number;
  radius: number;
  cooldownSec: number;
  pulseTags: string[];
  decisions: SpectralDecision[];
}

export interface SpectralAcousticBand {
  id: string;
  modeIndex: number;
  frequencyHint: string;
  standingWaveRoomIds: number[];
  shadowRoomIds: number[];
  bellNodeIds: string[];
  tags: string[];
}

export interface SpectralChasovnyaState {
  routeId: typeof SPECTRAL_CHASOVNYA_ROUTE_ID;
  z: typeof SPECTRAL_CHASOVNYA_Z;
  baseFloor: typeof SPECTRAL_CHASOVNYA_BASE_FLOOR;
  standingWaveRooms: SpectralStandingWaveRoom[];
  shadowZones: SpectralShadowZone[];
  bellNodes: SpectralBellNode[];
  acousticBands: SpectralAcousticBand[];
  rungBellNodeIds: string[];
  lastBellPulseAt: number;
}

export interface SpectralChasovnyaGeneration extends FloorGeneration {
  spectralState: SpectralChasovnyaState;
}

const NPC_ID = 'spectral_bellwarden_miron' as const;
const BELL_COOLDOWN_SEC = 18;
const BELL_INTERACTION_RANGE = 2.6;
const BELL_LOOK_RADIUS = 1.45;

const MIRON_DEF: PlotNpcDef = {
  name: 'Мирон Звонарь',
  isFemale: false,
  faction: Faction.CULTIST,
  occupation: Occupation.PRIEST,
  sprite: Occupation.PRIEST,
  hp: 150,
  maxHp: 150,
  money: 42,
  speed: 0.74,
  inventory: [
    { defId: 'istotit_candle', count: 1 },
    { defId: 'radio_jammer', count: 1 },
    { defId: 'bottled_voice', count: 1 },
  ],
  talkLines: [
    'В часовне не слушают стены. Здесь слушают пустоты между стенами.',
    'Выстрел двигает слепых. Тихий шаг проходит мимо них, если не смотреть на колокол.',
    'Звон не спасает. Он собирает угрозу в одну точку, чтобы у тебя была другая.',
  ],
  talkLinesPost: [
    'Колокол помнит, кто тянул верёвку. Это не всегда плохо.',
    'Не спорь с эхом: оно отвечает чужим голосом.',
  ],
};

registerSideQuest(NPC_ID, MIRON_DEF, [{
  id: 'spectral_tune_radio_sacristy',
  giverNpcId: NPC_ID,
  type: QuestType.FETCH,
  desc: 'Мирон Звонарь: «Принеси звукоизлучатель в радиоризницу. Настроим тишину так, чтобы слепые ушли к колоколу, а не к тебе.»',
  targetItem: 'sound_emitter',
  targetCount: 1,
  targetFloor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
  targetRoute: { designFloorId: SPECTRAL_CHASOVNYA_ROUTE_ID },
  targetRoomName: SPECTRAL_CHASOVNYA_ROOM_NAMES.radioSacristy,
  targetHint: 'Спектральная часовня z=-42: радиоризница стоит за боковой акустической тенью.',
  rewardItem: 'bottled_voice',
  rewardCount: 1,
  extraRewards: [{ defId: 'istotit_candle', count: 1 }],
  relationDelta: 8,
  xpReward: 70,
  moneyReward: 24,
  eventTags: ['spectral_chasovnya', 'sound_emitter', 'bell_route', 'quiet_path'],
}]);

const spectralStateByWorld = new WeakMap<World, SpectralChasovnyaState>();

export function getSpectralChasovnyaState(world: World): SpectralChasovnyaState | undefined {
  return ensureSpectralChasovnyaState(world);
}

function roomCenter(room: Room): { x: number; y: number } {
  return { x: room.x + room.w / 2, y: room.y + room.h / 2 };
}

function findSpectralRooms(world: World): SpectralRooms | undefined {
  const rooms: Partial<SpectralRooms> = {};
  for (const key of Object.keys(SPECTRAL_CHASOVNYA_ROOM_NAMES) as SpectralRoomKey[]) {
    const roomName = SPECTRAL_CHASOVNYA_ROOM_NAMES[key];
    const room = world.rooms.find(candidate => candidate?.name === roomName);
    if (!room) return undefined;
    rooms[key] = room;
  }
  return rooms as SpectralRooms;
}

function ensureSpectralChasovnyaState(world: World): SpectralChasovnyaState | undefined {
  const existing = spectralStateByWorld.get(world);
  if (existing) return existing;
  const rooms = findSpectralRooms(world);
  if (!rooms) return undefined;
  const rebuilt = buildSpectralState(world, rooms);
  spectralStateByWorld.set(world, rebuilt);
  return rebuilt;
}

function setRoomStyle(world: World, room: Room, wallTex: Tex, floorTex: Tex, fog = 0): void {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
    }
  }
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.roomMap[ci] !== room.id) continue;
      world.floorTex[ci] = floorTex;
      world.fog[ci] = fog;
    }
  }
}

function stampSpectralRoom(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
  fog = 0,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  setRoomStyle(world, room, wallTex, floorTex, fog);
  return room;
}

function connectCenters(world: World, a: Room, b: Room): void {
  const ac = roomCenter(a);
  const bc = roomCenter(b);
  carveCorridor(world, Math.floor(ac.x), Math.floor(ac.y), Math.floor(bc.x), Math.floor(bc.y));
}

function placeFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
}

function placeLift(world: World, room: Room, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.roomMap[ci] = room.id;
  world.floorTex[ci] = Tex.LIFT_DOOR;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
  const bi = world.idx(x + (direction === LiftDirection.DOWN ? -1 : 1), y);
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

function decorateStandingWave(world: World, room: Room, pitch: number): void {
  for (let dy = 1; dy < room.h - 1; dy++) {
    for (let dx = 1; dx < room.w - 1; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.roomMap[ci] !== room.id) continue;
      if (((dx + dy) % pitch) === 0) world.floorTex[ci] = Tex.F_GUT;
      if (((dx - dy + pitch * 4) % (pitch * 2)) === 0) world.fog[ci] = Math.max(world.fog[ci], 34);
    }
  }
}

function countRoomFloorCells(world: World, room: Room): number {
  let count = 0;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.roomMap[ci] === room.id && world.cells[ci] === Cell.FLOOR) count++;
    }
  }
  return count;
}

function buildRooms(world: World): SpectralRooms {
  const cx = W >> 1;
  const cy = W >> 1;
  const rooms = {
    entry: stampSpectralRoom(world, RoomType.CORRIDOR, cx - 70, cy - 7, 20, 14, SPECTRAL_CHASOVNYA_ROOM_NAMES.entry, Tex.GUT, Tex.F_CONCRETE, 8),
    nave: stampSpectralRoom(world, RoomType.HQ, cx - 35, cy - 16, 42, 32, SPECTRAL_CHASOVNYA_ROOM_NAMES.nave, Tex.CROSS, Tex.F_MEAT, 18),
    bellCage: stampSpectralRoom(world, RoomType.PRODUCTION, cx - 7, cy - 58, 18, 24, SPECTRAL_CHASOVNYA_ROOM_NAMES.bellCage, Tex.METAL, Tex.F_GUT, 22),
    radioSacristy: stampSpectralRoom(world, RoomType.OFFICE, cx + 23, cy - 38, 26, 18, SPECTRAL_CHASOVNYA_ROOM_NAMES.radioSacristy, Tex.SCREEN_BASE, Tex.F_TILE, 12),
    quietNorth: stampSpectralRoom(world, RoomType.STORAGE, cx - 62, cy - 42, 24, 18, SPECTRAL_CHASOVNYA_ROOM_NAMES.quietNorth, Tex.DARK, Tex.F_VOID, 52),
    quietSouth: stampSpectralRoom(world, RoomType.STORAGE, cx - 62, cy + 25, 24, 18, SPECTRAL_CHASOVNYA_ROOM_NAMES.quietSouth, Tex.DARK, Tex.F_VOID, 52),
    focusArch: stampSpectralRoom(world, RoomType.COMMON, cx + 31, cy - 3, 32, 14, SPECTRAL_CHASOVNYA_ROOM_NAMES.focusArch, Tex.MEAT, Tex.F_GUT, 30),
    crypt: stampSpectralRoom(world, RoomType.MEDICAL, cx + 16, cy + 29, 30, 20, SPECTRAL_CHASOVNYA_ROOM_NAMES.crypt, Tex.MEAT, Tex.F_GUT, 28),
    exit: stampSpectralRoom(world, RoomType.CORRIDOR, cx + 72, cy - 6, 20, 14, SPECTRAL_CHASOVNYA_ROOM_NAMES.exit, Tex.GUT, Tex.F_CONCRETE, 16),
  };

  connectCenters(world, rooms.entry, rooms.nave);
  connectCenters(world, rooms.nave, rooms.bellCage);
  connectCenters(world, rooms.nave, rooms.radioSacristy);
  connectCenters(world, rooms.nave, rooms.quietNorth);
  connectCenters(world, rooms.nave, rooms.quietSouth);
  connectCenters(world, rooms.nave, rooms.focusArch);
  connectCenters(world, rooms.focusArch, rooms.exit);
  connectCenters(world, rooms.focusArch, rooms.crypt);
  connectCenters(world, rooms.quietNorth, rooms.radioSacristy);
  connectCenters(world, rooms.quietSouth, rooms.crypt);

  decorateStandingWave(world, rooms.nave, 5);
  decorateStandingWave(world, rooms.bellCage, 4);
  decorateStandingWave(world, rooms.focusArch, 3);
  return rooms;
}

function dressRooms(world: World, rooms: SpectralRooms): void {
  placeLift(world, rooms.entry, rooms.entry.x + 4, rooms.entry.y + (rooms.entry.h >> 1), LiftDirection.UP);
  placeLift(world, rooms.exit, rooms.exit.x + rooms.exit.w - 5, rooms.exit.y + (rooms.exit.h >> 1), LiftDirection.DOWN);

  for (let x = rooms.nave.x + 4; x < rooms.nave.x + rooms.nave.w - 3; x += 7) {
    placeFeature(world, x, rooms.nave.y + 3, Feature.CANDLE);
    placeFeature(world, x, rooms.nave.y + rooms.nave.h - 4, Feature.CANDLE);
  }
  placeFeature(world, rooms.bellCage.x + (rooms.bellCage.w >> 1), rooms.bellCage.y + 5, Feature.APPARATUS);
  placeFeature(world, rooms.bellCage.x + (rooms.bellCage.w >> 1), rooms.bellCage.y + 9, Feature.MACHINE);
  placeFeature(world, rooms.radioSacristy.x + 4, rooms.radioSacristy.y + 4, Feature.SCREEN);
  placeFeature(world, rooms.radioSacristy.x + rooms.radioSacristy.w - 5, rooms.radioSacristy.y + 5, Feature.APPARATUS);
  placeFeature(world, rooms.quietNorth.x + 3, rooms.quietNorth.y + 3, Feature.CANDLE);
  placeFeature(world, rooms.quietSouth.x + rooms.quietSouth.w - 4, rooms.quietSouth.y + rooms.quietSouth.h - 4, Feature.CANDLE);
  placeFeature(world, rooms.focusArch.x + rooms.focusArch.w - 5, rooms.focusArch.y + (rooms.focusArch.h >> 1), Feature.APPARATUS);
  placeFeature(world, rooms.crypt.x + 4, rooms.crypt.y + rooms.crypt.h - 5, Feature.SHELF);
}

function tuneZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
    zone.level = Math.max(4, Math.min(7, 4 + Math.floor(d / 260)));
    zone.faction = zone.id % 5 === 0 ? ZoneFaction.SAMOSBOR : ZoneFaction.CULTIST;
    zone.fogged = false;
  }
}

function makeStandingWaveRoom(id: string, room: Room, wavelengthCells: number, pressure: SpectralStandingWaveRoom['pressure'], decisions: SpectralDecision[], tags: string[]): SpectralStandingWaveRoom {
  const c = roomCenter(room);
  return {
    id,
    roomName: room.name,
    roomId: room.id,
    x: c.x,
    y: c.y,
    wavelengthCells,
    pressure,
    decisions,
    tags,
  };
}

function makeShadowZone(world: World, id: string, room: Room, radius: number, decisions: SpectralDecision[], tags: string[]): SpectralShadowZone {
  const c = roomCenter(room);
  return {
    id,
    roomName: room.name,
    roomId: room.id,
    x: c.x,
    y: c.y,
    radius,
    coverCells: countRoomFloorCells(world, room),
    decisions,
    tags,
  };
}

function makeBellNode(id: string, room: Room, x: number, y: number, radius: number, tags: string[]): SpectralBellNode {
  return {
    id,
    roomName: room.name,
    roomId: room.id,
    x: x + 0.5,
    y: y + 0.5,
    radius,
    cooldownSec: BELL_COOLDOWN_SEC,
    pulseTags: tags,
    decisions: ['ring_bell', 'flee'],
  };
}

function buildSpectralState(world: World, rooms: SpectralRooms): SpectralChasovnyaState {
  const standingWaveRooms = [
    makeStandingWaveRoom('nave_mode_low', rooms.nave, 10, 3, ['move_silently', 'fire_loudly'], ['standing_wave', 'nave', 'low_mode']),
    makeStandingWaveRoom('bell_mode_high', rooms.bellCage, 7, 5, ['ring_bell', 'flee'], ['standing_wave', 'bell', 'high_mode']),
    makeStandingWaveRoom('focus_mode_line', rooms.focusArch, 6, 5, ['avoid_focus', 'fire_loudly'], ['standing_wave', 'focus', 'monster_line']),
    makeStandingWaveRoom('crypt_mode_chor', rooms.crypt, 9, 4, ['listen_radio', 'move_silently'], ['standing_wave', 'crypt', 'choir']),
  ];
  const shadowZones = [
    makeShadowZone(world, 'north_shadow', rooms.quietNorth, 12, ['move_silently', 'flee'], ['acoustic_shadow', 'quiet_route']),
    makeShadowZone(world, 'south_shadow', rooms.quietSouth, 12, ['move_silently', 'flee'], ['acoustic_shadow', 'quiet_route']),
    makeShadowZone(world, 'radio_shadow', rooms.radioSacristy, 9, ['listen_radio', 'move_silently'], ['acoustic_shadow', 'radio']),
  ];
  const bellNodes = [
    makeBellNode('main_bell_pull', rooms.bellCage, rooms.bellCage.x + (rooms.bellCage.w >> 1), rooms.bellCage.y + 5, 32, ['main_bell', 'sound_bait', 'cult']),
    makeBellNode('crypt_handbell', rooms.crypt, rooms.crypt.x + 4, rooms.crypt.y + rooms.crypt.h - 5, 20, ['handbell', 'sound_bait', 'crypt']),
  ];
  return {
    routeId: SPECTRAL_CHASOVNYA_ROUTE_ID,
    z: SPECTRAL_CHASOVNYA_Z,
    baseFloor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    standingWaveRooms,
    shadowZones,
    bellNodes,
    acousticBands: [
      {
        id: 'laplacian_low_bell_band',
        modeIndex: 2,
        frequencyHint: 'низкий колокол ведёт угрозу к клетке',
        standingWaveRoomIds: [rooms.nave.id, rooms.bellCage.id],
        shadowRoomIds: [rooms.quietNorth.id, rooms.quietSouth.id],
        bellNodeIds: ['main_bell_pull'],
        tags: ['graph_laplacian', 'low_band', 'bell'],
      },
      {
        id: 'radio_side_shadow_band',
        modeIndex: 5,
        frequencyHint: 'радио глушит боковые шаги',
        standingWaveRoomIds: [rooms.radioSacristy.id, rooms.crypt.id],
        shadowRoomIds: [rooms.radioSacristy.id],
        bellNodeIds: ['crypt_handbell'],
        tags: ['graph_laplacian', 'radio', 'shadow_zone'],
      },
      {
        id: 'focus_warning_band',
        modeIndex: 8,
        frequencyHint: 'фокусирующая арка усиливает выстрел и открывает линию слепым',
        standingWaveRoomIds: [rooms.focusArch.id],
        shadowRoomIds: [rooms.quietNorth.id, rooms.quietSouth.id],
        bellNodeIds: ['main_bell_pull', 'crypt_handbell'],
        tags: ['graph_laplacian', 'focus', 'sound_monster'],
      },
    ],
    rungBellNodeIds: [],
    lastBellPulseAt: -Infinity,
  };
}

function spawnPlotNpc(entities: Entity[], nextId: NextId, npcId: typeof NPC_ID, def: PlotNpcDef, x: number, y: number, angle: number): number {
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
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
  });
  return id;
}

function spawnSpectralMonster(
  entities: Entity[],
  nextId: NextId,
  kind: MonsterKind,
  x: number,
  y: number,
  name: string,
  level: number,
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  const id = nextId.v++;
  const hp = Math.round(def.hp * (0.9 + level * 0.16));
  entities.push({
    id,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: (id * 0.771) % (Math.PI * 2),
    pitch: 0,
    alive: true,
    speed: def.speed * (1.02 + level * 0.025),
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(level),
    phasing: kind === MonsterKind.SPIRIT || kind === MonsterKind.SHADOW || kind === MonsterKind.TONKAYA_TEN || kind === MonsterKind.GLUBINNAYA_TEN,
  });
}

function nextContainerId(world: World): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id) || world.containers.some(container => container.id === id)) id++;
  return id;
}

function addSpectralContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: Item[],
  tags: string[],
): void {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: world.wrap(x),
    y: world.wrap(y),
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory,
    capacitySlots: 6,
    access,
    lockDifficulty: access === 'locked' ? 4 : undefined,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  placeFeature(world, x, y, kind === ContainerKind.FILING_CABINET ? Feature.SHELF : Feature.APPARATUS);
}

function placeContent(world: World, entities: Entity[], nextId: NextId, rooms: SpectralRooms): void {
  spawnPlotNpc(entities, nextId, NPC_ID, MIRON_DEF, rooms.quietNorth.x + 5, rooms.quietNorth.y + 7, 0);
  spawnSpectralMonster(entities, nextId, MonsterKind.SLEPOGLAZ, rooms.focusArch.x + rooms.focusArch.w - 6, rooms.focusArch.y + 7, 'Слепоглаз у фокусирующей арки', 7);
  spawnSpectralMonster(entities, nextId, MonsterKind.TUMANNIK, rooms.nave.x + rooms.nave.w - 8, rooms.nave.y + 8, 'Туманник стоячей волны', 6);
  spawnSpectralMonster(entities, nextId, MonsterKind.GLUBINNAYA_TEN, rooms.crypt.x + rooms.crypt.w - 7, rooms.crypt.y + 12, 'Глубинная тень нижнего хора', 7);
  spawnSpectralMonster(entities, nextId, MonsterKind.SPIRIT, rooms.bellCage.x + 6, rooms.bellCage.y + 14, 'Дух с языком колокола', 6);

  addSpectralContainer(world, rooms.radioSacristy, rooms.radioSacristy.x + rooms.radioSacristy.w - 5, rooms.radioSacristy.y + 5, ContainerKind.FILING_CABINET, 'Шкаф радиоризницы с настройками тишины', 'locked', [
    { defId: 'radio_headset_liquidator', count: 1 },
    { defId: 'sound_emitter', count: 1 },
    { defId: 'field_radio_battery', count: 2 },
  ], ['spectral_chasovnya', 'radio', 'hearing_boost', 'locked']);
  addSpectralContainer(world, rooms.bellCage, rooms.bellCage.x + 5, rooms.bellCage.y + rooms.bellCage.h - 5, ContainerKind.SECRET_STASH, 'Ниша под главным колоколом', 'secret', [
    { defId: 'istotit_candle', count: 1 },
    { defId: 'bottled_voice', count: 1 },
  ], ['spectral_chasovnya', 'bell', 'psi', 'secret']);
  addSpectralContainer(world, rooms.crypt, rooms.crypt.x + 4, rooms.crypt.y + rooms.crypt.h - 5, ContainerKind.METAL_CABINET, 'Костяной ящик нижнего хора', 'public', [
    { defId: 'ammo_energy', count: 1 },
    { defId: 'radio_jammer', count: 1 },
  ], ['spectral_chasovnya', 'crypt', 'sound_counterplay']);
}

function registerSpectralRouteCues(world: World, rooms: SpectralRooms, state: SpectralChasovnyaState): void {
  const entry = roomCenter(rooms.entry);
  const quiet = roomCenter(rooms.quietSouth);
  const focus = roomCenter(rooms.focusArch);
  const radio = roomCenter(rooms.radioSacristy);
  const bell = state.bellNodes[0];

  registerRouteCue(world, {
    id: 'spectral_quiet_shadow_route',
    x: entry.x,
    y: entry.y,
    targetX: quiet.x,
    targetY: quiet.y,
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    label: 'Тихая тень',
    hint: 'Боковая зона гасит шаги. Хороший путь, если не стрелять.',
    targetName: rooms.quietSouth.name,
    color: '#8cf',
    tags: ['spectral_chasovnya', 'acoustic_shadow', 'quiet_route'],
    toneSeed: 0x5ec7a1,
    roomId: rooms.entry.id,
    targetRoomId: rooms.quietSouth.id,
    heardText: 'Сбоку нет эха: туда можно пройти тише, чем через неф.',
    followedText: 'Акустическая тень держит шаг. Слепые слушают не здесь.',
    ignoredText: 'Тихая тень осталась сбоку; впереди звук собирается в линию.',
    routeGroup: {
      id: 'spectral_shadow_choice',
      lead: 'Тень сбоку гасит шаг.',
      risk: 'Дольше, но меньше шума.',
      decision: 'идти тихо через боковую тень',
      reward: 'обход фокусирующей арки',
      mapLabel: 'тихий обход',
    },
  });

  registerRouteCue(world, {
    id: 'spectral_main_bell_route',
    x: rooms.nave.x + 4,
    y: rooms.nave.y + 4,
    targetX: bell.x,
    targetY: bell.y,
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    label: 'Колокол',
    hint: 'Звон собирает слуховых тварей к клетке. Это не защита, а отвлечение.',
    targetName: rooms.bellCage.name,
    color: '#d6a64b',
    tags: ['spectral_chasovnya', 'bell', 'sound_bait'],
    toneSeed: 0x5ec7b11,
    roomId: rooms.nave.id,
    targetRoomId: rooms.bellCage.id,
    heardText: 'Над нефом висит низкий колокол. Веревка выглядит рабочей.',
    followedText: 'Веревка колокола найдена. Если дернуть, шум уйдет не только к тебе.',
    ignoredText: 'Колокол молчит. В фокусирующей арке слышно каждый патрон.',
    routeGroup: {
      id: 'spectral_bell_choice',
      lead: 'Колокол может стянуть угрозу.',
      risk: 'После звона лучше уйти сразу.',
      decision: 'позвонить и сменить маршрут',
      reward: 'локальный шумовой приманивающий импульс',
      mapLabel: 'колокол',
    },
  });

  registerRouteCue(world, {
    id: 'spectral_focus_warning_route',
    x: rooms.nave.x + rooms.nave.w - 4,
    y: rooms.nave.y + (rooms.nave.h >> 1),
    targetX: focus.x,
    targetY: focus.y,
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    label: 'Слуховой фокус',
    hint: 'Выстрел здесь раскрывает линию слепым. Приманка или тихий обход лучше прямого боя.',
    targetName: rooms.focusArch.name,
    color: '#f66',
    tags: ['spectral_chasovnya', 'standing_wave', 'sound_focus', 'monster_warning'],
    toneSeed: 0x5ec7f0c,
    roomId: rooms.nave.id,
    targetRoomId: rooms.focusArch.id,
    heardText: 'Арка впереди усиливает щелчок затвора. Там не нужно проверять оружие.',
    followedText: 'Линия фокуса видна по мокрым ребрам пола. Двигайся боком или шуми не здесь.',
    ignoredText: 'Фокусирующая арка осталась на прямой. Слепые любят прямые.',
  });

  registerRouteCue(world, {
    id: 'spectral_radio_sacristy_route',
    x: rooms.quietNorth.x + rooms.quietNorth.w - 3,
    y: rooms.quietNorth.y + 4,
    targetX: radio.x,
    targetY: radio.y,
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    label: 'Радиоризница',
    hint: 'Радиоузел дает предметы для слуха и глушения, но шкаф заперт.',
    targetName: rooms.radioSacristy.name,
    color: '#63f6ff',
    tags: ['spectral_chasovnya', 'radio', 'hearing_boost', 'quest_target'],
    toneSeed: 0x5ec7ad1,
    roomId: rooms.quietNorth.id,
    targetRoomId: rooms.radioSacristy.id,
    heardText: 'За тенью трещит радиоризница. Там звук не идёт прямо.',
    followedText: 'Радиоризница найдена. Гарнитура здесь полезнее громкого героизма.',
    ignoredText: 'Радиотреск уходит за свечи. Без него придется слушать своими ушами.',
  });
}

function findBellNodeForLook(world: World, player: Entity, lookX: number, lookY: number): SpectralBellNode | undefined {
  const state = ensureSpectralChasovnyaState(world);
  if (!state) return undefined;
  const lx = Math.floor(lookX) + 0.5;
  const ly = Math.floor(lookY) + 0.5;
  let best: SpectralBellNode | undefined;
  let bestD2 = Infinity;
  for (const node of state.bellNodes) {
    if (world.dist2(player.x, player.y, node.x, node.y) > BELL_INTERACTION_RANGE * BELL_INTERACTION_RANGE) continue;
    const d2 = world.dist2(lx, ly, node.x, node.y);
    if (d2 > BELL_LOOK_RADIUS * BELL_LOOK_RADIUS || d2 >= bestD2) continue;
    best = node;
    bestD2 = d2;
  }
  return best;
}

export function ringSpectralChasovnyaBell(
  world: World,
  state: GameState,
  player: Entity,
  entities: readonly Entity[],
  nodeId?: string,
): boolean {
  const spectral = ensureSpectralChasovnyaState(world);
  if (!spectral) return false;
  const node = nodeId
    ? spectral.bellNodes.find(candidate => candidate.id === nodeId)
    : spectral.bellNodes[0];
  if (!node) return false;
  const elapsed = state.time - spectral.lastBellPulseAt;
  if (elapsed < node.cooldownSec) {
    state.msgs.push(msg('Колокол ещё дрожит. Новый звон сольётся с предыдущим.', state.time, '#888'));
    return true;
  }

  spectral.lastBellPulseAt = state.time;
  if (!spectral.rungBellNodeIds.includes(node.id)) spectral.rungBellNodeIds.push(node.id);
  const noise = publishNoise(state, {
    x: node.x,
    y: node.y,
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    radius: node.radius,
    ttl: 4.0,
    source: 'siren',
    severity: 4,
    actorId: player.id,
    actorFaction: player.faction,
    tags: ['spectral_chasovnya', 'bell', ...node.pulseTags],
  });

  let pulled = 0;
  for (const entity of entities) {
    if (!entity.alive || entity.type !== EntityType.MONSTER || !entity.ai) continue;
    if (world.dist2(entity.x, entity.y, node.x, node.y) > node.radius * node.radius) continue;
    if (
      entity.monsterKind !== MonsterKind.SLEPOGLAZ &&
      entity.monsterKind !== MonsterKind.TUMANNIK &&
      entity.monsterKind !== MonsterKind.SPIRIT &&
      entity.monsterKind !== MonsterKind.SHADOW &&
      entity.monsterKind !== MonsterKind.TONKAYA_TEN &&
      entity.monsterKind !== MonsterKind.GLUBINNAYA_TEN
    ) continue;
    entity.ai.goal = AIGoal.HUNT;
    entity.ai.tx = node.x;
    entity.ai.ty = node.y;
    entity.ai.path.length = 0;
    entity.ai.pi = 0;
    entity.ai.timer = Math.max(entity.ai.timer, 2.5);
    pulled++;
  }

  state.msgs.push(msg(pulled > 0
    ? `Колокол ударил низко. Слуховые твари сдвинулись к звону: ${pulled}.`
    : 'Колокол ударил низко. Эхо ушло в боковые тени.', state.time, '#d6a64b'));
  publishEvent(state, {
    type: 'monster_bait_placed',
    floor: SPECTRAL_CHASOVNYA_BASE_FLOOR,
    roomId: node.roomId,
    x: node.x,
    y: node.y,
    actorId: player.id,
    actorFaction: player.faction,
    severity: 4,
    privacy: 'local',
    tags: ['spectral_chasovnya', 'bell', 'sound_bait', 'local_pulse'],
    data: {
      routeId: spectral.routeId,
      nodeId: node.id,
      noiseId: noise?.id,
      pulledMonsters: pulled,
      counterplay: 'ring_bell_then_move_through_acoustic_shadow',
    },
  });
  return true;
}

registerContentInteractionHook({
  id: 'spectral_chasovnya_bell',
  target(ctx) {
    const node = findBellNodeForLook(ctx.world, ctx.player, ctx.lookX, ctx.lookY);
    if (!node) return null;
    return {
      id: 744000 + node.roomId,
      targetId: 'spectral_chasovnya_bell',
      x: node.x,
      y: node.y,
      priority: 74,
      prompt: ' колокол',
    };
  },
  use(ctx) {
    const node = findBellNodeForLook(ctx.world, ctx.player, ctx.lookX, ctx.lookY);
    if (!node) return null;
    return { handled: ringSpectralChasovnyaBell(ctx.world, ctx.state, ctx.player, ctx.entities, node.id), worldChanged: false };
  },
});

export function generateSpectralChasovnyaDesignFloor(): SpectralChasovnyaGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId: NextId = { v: 1 };

  world.wallTex.fill(Tex.GUT);
  world.floorTex.fill(Tex.F_GUT);
  world.fog.fill(22);

  const rooms = buildRooms(world);
  const spawnX = rooms.entry.x + 8.5;
  const spawnY = rooms.entry.y + (rooms.entry.h >> 1) + 0.5;
  dressRooms(world, rooms);
  generateZones(world);
  tuneZones(world);
  placeContent(world, entities, nextId, rooms);
  const spectralState = buildSpectralState(world, rooms);
  registerSpectralRouteCues(world, rooms, spectralState);
  ensureConnectivity(world, spawnX, spawnY);
  sanitizeDoors(world);
  world.bakeLights();
  spectralStateByWorld.set(world, spectralState);
  return { world, entities, spawnX, spawnY, spectralState };
}

/* ── Design floor: Кремниевый НЕТ-колодец ─────────────────────── */

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
import { type PlotNpcDef, type SideQuestStep, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import {
  ensureConnectivity,
  generateZones,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'silicon_net_well' as const;
export const SILICON_NET_WELL_Z = -22;
export const SILICON_NET_WELL_BASE_FLOOR = FloorLevel.MAINTENANCE;

const SEED = hashSeed(DESIGN_FLOOR_ID);
const CX = W >> 1;
const CY = W >> 1;

type SiliconNpcId =
  | 'silicon_cibo'
  | 'silicon_cyborg_scientist'
  | 'silicon_admin_checker';

interface SiliconRooms {
  entry: Room;
  well: Room;
  terminal: Room;
  cibo: Room;
  lab: Room;
  checkpoint: Room;
  vault: Room;
  lowerLift: Room;
}

const NPC_DEFS: Record<SiliconNpcId, PlotNpcDef> = {
  silicon_cibo: {
    name: 'Сибо',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SCIENTIST,
    sprite: Occupation.SCIENTIST,
    hp: 190, maxHp: 190, money: 180, speed: 0.95,
    inventory: [
      { defId: 'circuit_board', count: 1 },
      { defId: 'ammo_energy', count: 1 },
      { defId: 'bandage', count: 1 },
    ],
    talkLines: [
      'Я ищу НЕТ не как сеть, а как коридор. Кремний здесь помнит двери, которые бетон уже забыл.',
      'Терминалы дают обход, если их кормить аккуратно. Ошибка зовет охрану быстрее сирены.',
      'Гравитационный излучатель не оружие. Это ластик для стен, людей и оправданий.',
    ],
    talkLinesPost: [
      'НЕТ отвечает коротко. Значит, мы еще живы.',
      'Не стреляйте из излучателя в то, что хотите потом обыскать.',
    ],
  },
  silicon_cyborg_scientist: {
    name: 'Киборг-учёный Аким',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.ELECTRICIAN,
    sprite: Occupation.ELECTRICIAN,
    hp: 210, maxHp: 210, money: 95, speed: 0.8,
    inventory: [
      { defId: 'relay_diagram', count: 1 },
      { defId: 'ammo_energy', count: 1 },
      { defId: 'pills', count: 1 },
    ],
    talkLines: [
      'GBE режет не материал. Он вычитает маршрут. Поэтому после выстрела пропадает и стена, и то, что лежало у стены.',
      'Если взлом сорвется, терминал вызывает Safeguard. Он быстрый, белый и не спорит с ошибкой.',
      'Администраторы хотят меня сдать за объяснения. У них хорошо получается путать причину и протокол.',
    ],
    talkLinesPost: [
      'Луч держите коротко. Дом любит длинные доказательства.',
      'Если экран начал считать вас, отходите от экрана, а не от совести.',
    ],
  },
  silicon_admin_checker: {
    name: 'Администратор НЕТ-ветки',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.SECRETARY,
    sprite: Occupation.SECRETARY,
    hp: 170, maxHp: 170, money: 140, speed: 0.9,
    weapon: 'tt_pistol',
    inventory: [
      { defId: 'tt_pistol', count: 1 },
      { defId: 'ammo_762tt', count: 10 },
      { defId: 'official_permit_slip', count: 1 },
    ],
    talkLines: [
      'Колодец закрыт для самодеятельного подключения. Сибо под наблюдением, киборг под вопросом.',
      'Сдадите ученого - получите корешок допуска и чистую запись. Украдете излучатель - получите погоню.',
      'Кремниевая жизнь не враг. Враг тот, кто не ставит подпись перед ошибкой.',
    ],
    talkLinesPost: [
      'Протокол принял вашу версию. Это не значит, что она правильная.',
      'Если экран вас узнал, стойте ровно. Экран не любит бегущих.',
    ],
  },
};

const SIDE_QUESTS: readonly SideQuestStep[] = [
  {
    id: 'silicon_cibo_net_contact',
    giverNpcId: 'silicon_cibo',
    type: QuestType.FETCH,
    desc: 'Сибо: «Две энергоячейки к терминальному залу. Я открою НЕТ-обход и отдам излучатель, если он не заберёт нас первым.»',
    targetItem: 'ammo_energy',
    targetCount: 2,
    rewardItem: 'gravity_beam_emitter',
    rewardCount: 1,
    relationDelta: 12,
    xpReward: 220,
    eventTags: [DESIGN_FLOOR_ID, 'net', 'cibo', 'gravity_beam'],
    eventSeverity: 4,
    eventPrivacy: 'secret',
    failOnNpcDeathPlotId: 'silicon_cibo',
  },
  {
    id: 'silicon_scientist_warning',
    giverNpcId: 'silicon_cyborg_scientist',
    type: QuestType.TALK,
    desc: 'Выслушай киборга-учёного о GBE и риске НЕТ-взлома до работы с терминалами.',
    targetPlotNpcId: 'silicon_cibo',
    rewardItem: 'ammo_energy',
    rewardCount: 1,
    relationDelta: 6,
    xpReward: 90,
    eventTags: [DESIGN_FLOOR_ID, 'net', 'hack_risk', 'scientist'],
    eventPrivacy: 'local',
  },
  {
    id: 'silicon_admin_turn_in_scientist',
    giverNpcId: 'silicon_admin_checker',
    type: QuestType.KILL,
    desc: 'Администратор: «Киборг объяснил слишком много. Уберите его или уведите от терминалов.»',
    targetPlotNpcId: 'silicon_cyborg_scientist',
    rewardItem: 'official_permit_slip',
    rewardCount: 1,
    moneyReward: 120,
    relationDelta: 8,
    xpReward: 130,
    eventTags: [DESIGN_FLOOR_ID, 'admin', 'betrayal', 'net'],
    eventSeverity: 4,
    eventPrivacy: 'witnessed',
    blockedBySideQuestIds: ['silicon_cibo_net_contact'],
  },
];

let contentRegistered = false;

export function registerSiliconNetWellContent(): void {
  if (contentRegistered) return;
  for (const npcId of Object.keys(NPC_DEFS) as SiliconNpcId[]) {
    registerSideQuest(npcId, NPC_DEFS[npcId], SIDE_QUESTS.filter(q => q.giverNpcId === npcId));
  }
  contentRegistered = true;
}

export function generateSiliconNetWellDesignFloor(seed = SEED): FloorGeneration {
  registerSiliconNetWellContent();
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };

    initWorld(world);
    const rooms = buildRooms(world);
    connectCore(world, rooms);
    decorateRooms(world, rooms);
    placeLifts(world, rooms);
    generateZones(world);
    tuneZones(world);

    const owners = spawnNpcs(entities, nextId, rooms);
    spawnAmbientNpcs(entities, nextId, rooms);
    placeContainers(world, rooms, owners);
    placeDrops(world, entities, nextId, rooms);
    spawnThreats(world, entities, nextId, rooms);

    sanitizeDoors(world);
    ensureConnectivity(world, rooms.entry.x + 14.5, rooms.entry.y + 11.5);
    world.rebuildContainerMap();
    world.bakeLights();

    return {
      world,
      entities,
      spawnX: rooms.entry.x + 14.5,
      spawnY: rooms.entry.y + 11.5,
    };
  });
}

function initWorld(world: World): void {
  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.METAL;
    world.floorTex[i] = Tex.F_CONCRETE;
    world.factionControl[i] = ZoneFaction.LIQUIDATOR;
  }
}

function buildRooms(world: World): SiliconRooms {
  const entry = addRoom(world, RoomType.CORRIDOR, CX - 42, CY + 138, 84, 24, 'Входной шлюз НЕТ-колодца', Tex.PIPE, Tex.F_CONCRETE);
  const well = addRoom(world, RoomType.COMMON, CX - 74, CY - 58, 148, 116, 'Кремниевый колодец без дна', Tex.METAL, Tex.F_CONCRETE);
  const terminal = addRoom(world, RoomType.PRODUCTION, CX - 58, CY - 148, 116, 46, 'Терминальный зал НЕТ-ветки', Tex.DARK, Tex.F_CONCRETE);
  const cibo = addRoom(world, RoomType.MEDICAL, CX - 158, CY - 86, 48, 38, 'Кабина Сибо у холодного экрана', Tex.PANEL, Tex.F_TILE);
  const lab = addRoom(world, RoomType.MEDICAL, CX + 108, CY - 86, 54, 38, 'Лаборатория киборга-учёного', Tex.METAL, Tex.F_TILE);
  const checkpoint = addRoom(world, RoomType.HQ, CX - 158, CY + 72, 62, 38, 'Администраторский пост сверки', Tex.MARBLE, Tex.F_RED_CARPET);
  const vault = addRoom(world, RoomType.STORAGE, CX + 94, CY + 76, 58, 40, 'Сейф GBE за кремниевой решёткой', Tex.METAL, Tex.F_CONCRETE);
  const lowerLift = addRoom(world, RoomType.CORRIDOR, CX + 26, CY + 148, 46, 24, 'Нижняя кабина после колодца', Tex.PIPE, Tex.F_CONCRETE);

  carveVoidShaft(world, well);
  return { entry, well, terminal, cibo, lab, checkpoint, vault, lowerLift };
}

function connectCore(world: World, rooms: SiliconRooms): void {
  carveLineWidth(world, CX, rooms.entry.y, CX, rooms.well.y + rooms.well.h + 1, 5, Tex.F_CONCRETE);
  carveLineWidth(world, CX, rooms.terminal.y + rooms.terminal.h + 1, CX, rooms.well.y - 1, 4, Tex.F_CONCRETE);
  carveLineWidth(world, rooms.cibo.x + rooms.cibo.w + 1, rooms.cibo.y + 20, rooms.well.x - 1, rooms.cibo.y + 20, 3, Tex.F_CONCRETE);
  carveLineWidth(world, rooms.well.x + rooms.well.w + 1, rooms.lab.y + 20, rooms.lab.x - 1, rooms.lab.y + 20, 3, Tex.F_CONCRETE);
  carveLineWidth(world, rooms.checkpoint.x + rooms.checkpoint.w + 1, rooms.checkpoint.y + 18, rooms.well.x - 1, rooms.checkpoint.y + 18, 3, Tex.F_CONCRETE);
  carveLineWidth(world, rooms.well.x + rooms.well.w + 1, rooms.vault.y + 20, rooms.vault.x - 1, rooms.vault.y + 20, 3, Tex.F_CONCRETE);
  carveLineWidth(world, CX + 48, rooms.well.y + rooms.well.h + 1, rooms.lowerLift.x + 23, rooms.lowerLift.y - 1, 3, Tex.F_CONCRETE);

  addDoor(world, rooms.terminal, CX, rooms.terminal.y + rooms.terminal.h, DoorState.CLOSED);
  addDoor(world, rooms.cibo, rooms.cibo.x + rooms.cibo.w, rooms.cibo.y + 20, DoorState.CLOSED);
  addDoor(world, rooms.lab, rooms.lab.x - 1, rooms.lab.y + 20, DoorState.CLOSED);
  addDoor(world, rooms.checkpoint, rooms.checkpoint.x + rooms.checkpoint.w, rooms.checkpoint.y + 18, DoorState.CLOSED);
  addDoor(world, rooms.vault, rooms.vault.x - 1, rooms.vault.y + 20, DoorState.LOCKED, 'permanent_pass');
}

function decorateRooms(world: World, rooms: SiliconRooms): void {
  for (let x = rooms.terminal.x + 8; x < rooms.terminal.x + rooms.terminal.w - 8; x += 8) {
    markScreenWall(world, x, rooms.terminal.y - 1, 2 + ((x >> 3) % 6));
  }
  for (let x = rooms.terminal.x + 14; x < rooms.terminal.x + rooms.terminal.w - 12; x += 18) {
    setFeature(world, x, rooms.terminal.y + 18, Feature.APPARATUS);
  }
  setFeature(world, rooms.cibo.x + 8, rooms.cibo.y + 10, Feature.DESK);
  setFeature(world, rooms.cibo.x + rooms.cibo.w - 8, rooms.cibo.y + 14, Feature.APPARATUS);
  markScreenWall(world, rooms.cibo.x + 18, rooms.cibo.y - 1, 7);

  setFeature(world, rooms.lab.x + 8, rooms.lab.y + 10, Feature.APPARATUS);
  setFeature(world, rooms.lab.x + 18, rooms.lab.y + 14, Feature.DESK);
  setFeature(world, rooms.lab.x + rooms.lab.w - 8, rooms.lab.y + rooms.lab.h - 8, Feature.SHELF);
  markScreenWall(world, rooms.lab.x + 28, rooms.lab.y - 1, 5);

  setFeature(world, rooms.checkpoint.x + 10, rooms.checkpoint.y + 12, Feature.DESK);
  setFeature(world, rooms.checkpoint.x + 24, rooms.checkpoint.y + 12, Feature.CHAIR);
  markScreenWall(world, rooms.checkpoint.x + rooms.checkpoint.w - 12, rooms.checkpoint.y - 1, 1);

  setFeature(world, rooms.vault.x + 12, rooms.vault.y + 12, Feature.SHELF);
  setFeature(world, rooms.vault.x + rooms.vault.w - 12, rooms.vault.y + 18, Feature.APPARATUS);
  setFeature(world, rooms.entry.x + 26, rooms.entry.y + 8, Feature.LAMP);
  setFeature(world, rooms.lowerLift.x + 18, rooms.lowerLift.y + 8, Feature.LAMP);

  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * Math.PI * 2;
    const x = Math.floor(CX + Math.cos(ang) * 54);
    const y = Math.floor(CY + Math.sin(ang) * 40);
    const ci = world.idx(x, y);
    if (world.cells[ci] === Cell.FLOOR) {
      world.features[ci] = i % 3 === 0 ? Feature.CANDLE : Feature.LAMP;
    }
  }
}

function placeLifts(world: World, rooms: SiliconRooms): void {
  placeLift(world, rooms.entry.x + 10, rooms.entry.y + 11, rooms.entry.x + 15, rooms.entry.y + 11, LiftDirection.UP);
  placeLift(world, rooms.lowerLift.x + rooms.lowerLift.w - 8, rooms.lowerLift.y + 11, rooms.lowerLift.x + rooms.lowerLift.w - 13, rooms.lowerLift.y + 11, LiftDirection.DOWN);
}

function tuneZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CX, CY);
    zone.faction = d < 170 ? ZoneFaction.LIQUIDATOR : d < 310 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    zone.level = d < 210 ? 4 : 3;
    zone.fogged = false;
    zone.hasLift = false;
  }
  for (let i = 0; i < W * W; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.LIQUIDATOR;
  }
}

function spawnNpcs(
  entities: Entity[],
  nextId: { v: number },
  rooms: SiliconRooms,
): Record<SiliconNpcId, number> {
  return {
    silicon_cibo: spawnPlotNpc(entities, nextId, 'silicon_cibo', NPC_DEFS.silicon_cibo, rooms.cibo.x + 18, rooms.cibo.y + 18, 0),
    silicon_cyborg_scientist: spawnPlotNpc(entities, nextId, 'silicon_cyborg_scientist', NPC_DEFS.silicon_cyborg_scientist, rooms.lab.x + 18, rooms.lab.y + 18, Math.PI),
    silicon_admin_checker: spawnPlotNpc(entities, nextId, 'silicon_admin_checker', NPC_DEFS.silicon_admin_checker, rooms.checkpoint.x + 18, rooms.checkpoint.y + 20, 0, 'tt_pistol'),
  };
}

function spawnAmbientNpcs(entities: Entity[], nextId: { v: number }, rooms: SiliconRooms): void {
  spawnAmbientNpc(entities, nextId, 'Администратор у экрана допуска', Faction.LIQUIDATOR, Occupation.SECRETARY, rooms.terminal.x + 18, rooms.terminal.y + 30, [
    { defId: 'official_permit_slip', count: 1 },
    { defId: 'ammo_762tt', count: 6 },
  ], 'tt_pistol');
  spawnAmbientNpc(entities, nextId, 'Техник кремниевого лаза', Faction.SCIENTIST, Occupation.MECHANIC, rooms.well.x + 22, rooms.well.y + 20, [
    { defId: 'wire_coil', count: 1 },
    { defId: 'circuit_board', count: 1 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Проверяющий нижней кабины', Faction.LIQUIDATOR, Occupation.HUNTER, rooms.lowerLift.x + 12, rooms.lowerLift.y + 12, [
    { defId: 'ammo_9mm', count: 8 },
  ], 'makarov');
}

function placeContainers(world: World, rooms: SiliconRooms, owners: Record<SiliconNpcId, number>): void {
  addContainer(world, rooms.cibo, rooms.cibo.x + rooms.cibo.w - 6, rooms.cibo.y + 8, ContainerKind.TOOL_LOCKER, 'Ящик Сибо с НЕТ-переходниками', 'owner', [
    { defId: 'circuit_board', count: 2 },
    { defId: 'wire_coil', count: 2 },
    { defId: 'ammo_energy', count: 1 },
  ], owners.silicon_cibo, NPC_DEFS.silicon_cibo.name, ['silicon_net_well', 'net', 'cibo']);

  addContainer(world, rooms.lab, rooms.lab.x + rooms.lab.w - 6, rooms.lab.y + rooms.lab.h - 8, ContainerKind.METAL_CABINET, 'Шкаф киборга с предупреждениями GBE', 'owner', [
    { defId: 'relay_diagram', count: 1 },
    { defId: 'ammo_energy', count: 1 },
    { defId: 'pills', count: 1 },
  ], owners.silicon_cyborg_scientist, NPC_DEFS.silicon_cyborg_scientist.name, ['silicon_net_well', 'scientist', 'gbe']);

  addContainer(world, rooms.checkpoint, rooms.checkpoint.x + rooms.checkpoint.w - 7, rooms.checkpoint.y + 10, ContainerKind.FILING_CABINET, 'Картотека администраторов НЕТ-ветки', 'faction', [
    { defId: 'official_permit_slip', count: 1 },
    { defId: 'blank_form', count: 2 },
    { defId: 'liquidator_token', count: 1 },
  ], owners.silicon_admin_checker, NPC_DEFS.silicon_admin_checker.name, ['silicon_net_well', 'admin', 'documents']);

  addContainer(world, rooms.vault, rooms.vault.x + rooms.vault.w - 9, rooms.vault.y + 18, ContainerKind.WEAPON_CRATE, 'Запертый ложемент GBE', 'locked', [
    { defId: 'gravity_beam_emitter', count: 1 },
    { defId: 'ammo_energy', count: 2 },
  ], undefined, undefined, ['silicon_net_well', 'gbe', 'rare_weapon']);
}

function placeDrops(world: World, entities: Entity[], nextId: { v: number }, rooms: SiliconRooms): void {
  dropItem(world, entities, nextId, rooms.terminal.x + 18, rooms.terminal.y + 18, 'circuit_board', 1);
  dropItem(world, entities, nextId, rooms.well.x + 18, rooms.well.y + rooms.well.h - 18, 'ammo_energy', 1);
  dropItem(world, entities, nextId, rooms.entry.x + 26, rooms.entry.y + 14, 'metal_water', 1);
}

function spawnThreats(world: World, entities: Entity[], nextId: { v: number }, rooms: SiliconRooms): void {
  spawnMonster(world, entities, nextId, MonsterKind.ROBOT, rooms.terminal.x + rooms.terminal.w - 18, rooms.terminal.y + 28, 4, 'Кремниевый страж');
  spawnMonster(world, entities, nextId, MonsterKind.CHERVIE_AVATAR, rooms.terminal.x + 52, rooms.terminal.y + 19, 5, 'Червие НЕТ-ветки');
  spawnMonster(world, entities, nextId, MonsterKind.SAFEGUARD, rooms.terminal.x + rooms.terminal.w - 36, rooms.terminal.y + 30, 5, 'Сейфгард НЕТ-колодца');
  spawnMonster(world, entities, nextId, MonsterKind.PARAGRAPH, rooms.checkpoint.x + rooms.checkpoint.w + 10, rooms.checkpoint.y + 18, 4, 'Параграф допуска');
  spawnMonster(world, entities, nextId, MonsterKind.SPIRIT, rooms.well.x + 28, rooms.well.y + 82, 4, 'Кремниевая тень');
  spawnMonster(world, entities, nextId, MonsterKind.SAFEGUARD, rooms.vault.x + 16, rooms.vault.y + 20, 5, 'Сейфгард ложемента');
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
      const ci = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) world.floorTex[ci] = floorTex;
      else if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
    }
  }
  return room;
}

function carveLineWidth(world: World, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  if (ax !== bx && ay !== by) {
    carveLineWidth(world, ax, ay, bx, ay, width, floorTex);
    carveLineWidth(world, bx, ay, bx, by, width, floorTex);
    return;
  }
  const half = width >> 1;
  const from = ax === bx ? Math.min(ay, by) : Math.min(ax, bx);
  const to = ax === bx ? Math.max(ay, by) : Math.max(ax, bx);
  for (let p = from; p <= to; p++) {
    for (let n = 0; n < width; n++) {
      const o = n - half;
      openTile(world, ax === bx ? ax + o : p, ax === bx ? p : ay + o, floorTex, -1);
    }
  }
}

function openTile(world: World, x: number, y: number, floorTex: Tex, roomId: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR || world.hermoWall[ci]) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = roomId;
  world.floorTex[ci] = floorTex;
  if (world.features[ci] !== Feature.NONE) world.features[ci] = Feature.NONE;
}

function carveVoidShaft(world: World, room: Room): void {
  const rx = room.x + (room.w >> 1);
  const ry = room.y + (room.h >> 1);
  for (let dy = -15; dy <= 15; dy++) {
    for (let dx = -15; dx <= 15; dx++) {
      if (dx * dx + dy * dy > 15 * 15) continue;
      const ci = world.idx(rx + dx, ry + dy);
      world.cells[ci] = Cell.ABYSS;
      world.roomMap[ci] = room.id;
      world.floorTex[ci] = Tex.F_ABYSS;
      world.features[ci] = Feature.NONE;
    }
  }
}

function addDoor(world: World, room: Room, x: number, y: number, state: DoorState, keyId = ''): void {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.doors.set(idx, {
    idx,
    state,
    roomA: room.id,
    roomB: -1,
    keyId,
    timer: 0,
  });
  room.doors.push(idx);
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
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
  nextId: { v: number },
  npcId: SiliconNpcId,
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
  nextId: { v: number },
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
    speed: faction === Faction.LIQUIDATOR ? 0.9 : 0.78,
    sprite: occupation,
    name,
    needs: freshNeeds(),
    hp: faction === Faction.LIQUIDATOR ? 140 : 90,
    maxHp: faction === Faction.LIQUIDATOR ? 140 : 90,
    money: 18 + Math.floor(Math.random() * 45),
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory.map(item => ({ ...item })),
    weapon,
    faction,
    occupation,
    questId: -1,
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
    floor: SILICON_NET_WELL_BASE_FLOOR,
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
    lockDifficulty: access === 'locked' ? 5 : undefined,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, x, y, Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function dropItem(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  x: number,
  y: number,
  defId: string,
  count: number,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
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

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  kind: MonsterKind,
  x: number,
  y: number,
  level: number,
  name?: string,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = Math.round(def.hp * (1 + level * 0.22));
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (1 + level * 0.05),
    sprite: monsterSpr(kind),
    name,
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    phasing: kind === MonsterKind.SPIRIT,
  };
  entities.push(monster);
}

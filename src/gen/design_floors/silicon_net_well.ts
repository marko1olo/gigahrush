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

interface SiliconPoint {
  x: number;
  y: number;
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

  addContainer(world, rooms.vault, rooms.vault.x + rooms.vault.w - 9, rooms.vault.y + 18, ContainerKind.WEAPON_CRATE, 'Запертый ложемент гравиоружия', 'locked', [
    { defId: 'gravity_beam_emitter', count: 1 },
    { defId: 'grn420_gravizhernov', count: 1 },
    { defId: 'ammo_energy', count: 3 },
  ], undefined, undefined, ['silicon_net_well', 'gbe', 'grn420', 'rare_weapon']);
}

function placeDrops(world: World, entities: Entity[], nextId: { v: number }, rooms: SiliconRooms): void {
  dropItem(world, entities, nextId, rooms.terminal.x + 18, rooms.terminal.y + 18, 'circuit_board', 1);
  dropItem(world, entities, nextId, rooms.well.x + 18, rooms.well.y + rooms.well.h - 18, 'ammo_energy', 1);
  dropItem(world, entities, nextId, rooms.lab.x + rooms.lab.w - 12, rooms.lab.y + rooms.lab.h - 10, 'nii_sample_container', 1);
  dropItem(world, entities, nextId, rooms.well.x + rooms.well.w - 20, rooms.well.y + 20, 'slime_sample_blue', 1);
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

export function expandSiliconNetWellRouteGeometry(world: World, rng: () => number): void {
  const mask = siliconProtectedMask(world);
  const podTargets = [
    { x: CX - 150, y: CY - 66 },
    { x: CX + 150, y: CY - 66 },
    { x: CX - 150, y: CY + 90 },
    { x: CX + 150, y: CY + 96 },
  ];

  const pods = [
    { type: RoomType.MEDICAL, x: CX - 374, y: CY - 202, w: 58, h: 30, name: 'НИИ-под Сибо: сухая камера' },
    { type: RoomType.MEDICAL, x: CX + 314, y: CY - 202, w: 60, h: 30, name: 'НИИ-под киборга: сухая камера' },
    { type: RoomType.HQ, x: CX - 386, y: CY + 154, w: 68, h: 30, name: 'Админ-под сверки НЕТ-доступа' },
    { type: RoomType.PRODUCTION, x: CX + 306, y: CY + 154, w: 70, h: 30, name: 'Пульт изоляции НИИ-подов' },
  ];

  for (let i = 0; i < pods.length; i++) {
    const spec = pods[i];
    const room = siliconMacroRoom(world, mask, spec.type, spec.x, spec.y, spec.w, spec.h, spec.name, Tex.PANEL, Tex.F_TILE, 3);
    if (!room) continue;
    decorateSiliconMacroRoom(world, room, i, rng);
    connectSiliconRoomTo(world, mask, room, podTargets[i], Tex.F_TILE, 0);
  }

  const serverRooms = [
    { x: CX - 250, y: CY - 316, w: 60, h: 24, target: { x: CX - 42, y: CY - 104 }, name: 'Серверная кремниевого северного ствола' },
    { x: CX - 72, y: CY - 342, w: 72, h: 24, target: { x: CX, y: CY - 104 }, name: 'Серверная обратного НЕТ-эхо' },
    { x: CX + 176, y: CY - 316, w: 66, h: 24, target: { x: CX + 42, y: CY - 104 }, name: 'Серверная Safeguard-сверки' },
    { x: CX - 238, y: CY + 260, w: 62, h: 24, target: { x: CX - 52, y: CY + 118 }, name: 'Кабельная проб кремния' },
    { x: CX + 178, y: CY + 260, w: 62, h: 24, target: { x: CX + 52, y: CY + 118 }, name: 'Кабельная нижнего НЕТ-сброса' },
  ];

  for (let i = 0; i < serverRooms.length; i++) {
    const spec = serverRooms[i];
    const room = siliconMacroRoom(world, mask, i >= 3 ? RoomType.STORAGE : RoomType.PRODUCTION, spec.x, spec.y, spec.w, spec.h, spec.name, Tex.DARK, Tex.F_CONCRETE, 3);
    if (!room) continue;
    decorateSiliconMacroRoom(world, room, i + pods.length, rng);
    connectSiliconRoomTo(world, mask, room, spec.target, Tex.F_CONCRETE, 16);
  }

  siliconMacroCorridor(world, mask, 92, CY - 242, 840, 5, 'Кристаллизованный северный сервисный коридор', Tex.F_TILE, 34);
  siliconMacroCorridor(world, mask, 92, CY + 226, 840, 5, 'Кристаллизованный южный сервисный коридор', Tex.F_TILE, 38);
  siliconMacroCorridor(world, mask, CX - 352, 116, 5, 780, 'Левая кабельная кишка НЕТ-колодца', Tex.F_CONCRETE, 28);
  siliconMacroCorridor(world, mask, CX + 348, 116, 5, 780, 'Правая кабельная кишка НЕТ-колодца', Tex.F_CONCRETE, 28);

  for (const p of [
    { x: CX - 352, y: CY - 242 }, { x: CX + 348, y: CY - 242 },
    { x: CX - 352, y: CY + 226 }, { x: CX + 348, y: CY + 226 },
  ]) {
    scatterSiliconCrystals(world, rng, p.x, p.y, 24);
  }

  const radialPods = placeRadialNetPods(world, mask, rng);
  carveVaultShell(world, mask);
  carveHilbertCircuitTraces(world, mask, radialPods);
  applySiliconCrystalBands(world, mask);

  world.markCellsDirty();
  world.markFloorTexDirty();
  world.markWallTexDirty();
  world.markFeaturesDirty();
  world.markFogDirty();
}

export function tuneSiliconNetWellRouteZones(world: World): void {
  for (const zone of world.zones) {
    const dx = world.delta(zone.cx, CX);
    const dy = world.delta(zone.cy, CY);
    const d = Math.sqrt(dx * dx + dy * dy);
    const protectedPodBand = Math.abs(dx) > 210 && Math.abs(dx) < 455 && Math.abs(dy) < 210;
    const serverBand = dy < -185 && Math.abs(dx) < 330 && zone.id % 2 === 0;
    if (d < 150) {
      zone.faction = ZoneFaction.SAMOSBOR;
      zone.level = 5;
    } else if (protectedPodBand || serverBand) {
      zone.faction = ZoneFaction.LIQUIDATOR;
      zone.level = d < 360 ? 4 : 5;
    } else if (d < 440) {
      zone.faction = ZoneFaction.WILD;
      zone.level = 4;
    } else {
      zone.faction = zone.id % 9 === 0 ? ZoneFaction.LIQUIDATOR : zone.id % 3 === 0 ? ZoneFaction.SAMOSBOR : ZoneFaction.WILD;
      zone.level = zone.faction === ZoneFaction.LIQUIDATOR ? 4 : 5;
    }
    zone.fogged = false;
    zone.hasLift = false;
  }
  for (let i = 0; i < W * W; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.WILD;
  }
}

function siliconProtectedMask(world: World): Uint8Array {
  const mask = new Uint8Array(W * W);
  for (const room of world.rooms) {
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      for (let x = room.x - 1; x <= room.x + room.w; x++) mask[world.idx(x, y)] = 1;
    }
  }
  for (const idx of world.doors.keys()) mask[idx] = 1;
  for (const container of world.containers) mask[world.idx(container.x, container.y)] = 1;
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.LIFT || world.features[i] === Feature.LIFT_BUTTON) mask[i] = 1;
  }
  return mask;
}

function siliconRectTouchesMask(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, margin: number): boolean {
  for (let dy = -margin; dy < h + margin; dy++) {
    for (let dx = -margin; dx < w + margin; dx++) {
      if (mask[world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

function siliconMacroRoom(
  world: World,
  mask: Uint8Array,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
  margin: number,
): Room | null {
  const rx = Math.max(4, Math.min(W - w - 5, Math.round(x)));
  const ry = Math.max(4, Math.min(W - h - 5, Math.round(y)));
  if (siliconRectTouchesMask(world, mask, rx, ry, w, h, margin)) return null;
  const room: Room = {
    id: world.rooms.length,
    type,
    x: rx,
    y: ry,
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex,
    floorTex,
  };
  world.rooms.push(room);
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const border = dx < 0 || dx >= w || dy < 0 || dy >= h;
      const ci = world.idx(rx + dx, ry + dy);
      mask[ci] = 1;
      world.cells[ci] = border ? Cell.WALL : Cell.FLOOR;
      world.roomMap[ci] = border ? -1 : room.id;
      world.wallTex[ci] = wallTex;
      world.floorTex[ci] = floorTex;
      world.features[ci] = Feature.NONE;
      if (!border && type !== RoomType.MEDICAL && type !== RoomType.HQ) world.fog[ci] = Math.max(world.fog[ci], 18);
    }
  }
  return room;
}

function siliconMacroCorridor(
  world: World,
  mask: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  floorTex: Tex,
  fog: number,
): Room {
  const room: Room = {
    id: world.rooms.length,
    type: RoomType.CORRIDOR,
    x: world.wrap(x),
    y: world.wrap(y),
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex: Tex.METAL,
    floorTex,
  };
  world.rooms.push(room);
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (mask[ci] || world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR || world.hermoWall[ci]) continue;
      const border = dx < 0 || dx >= w || dy < 0 || dy >= h;
      if (border) {
        if (world.cells[ci] === Cell.WALL || world.cells[ci] === Cell.ABYSS) {
          world.cells[ci] = Cell.WALL;
          world.wallTex[ci] = Tex.METAL;
          world.features[ci] = Feature.NONE;
        }
        continue;
      }
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = room.id;
      world.floorTex[ci] = floorTex;
      world.fog[ci] = Math.max(world.fog[ci], fog);
      if ((dx + dy) % 17 === 0) world.features[ci] = Feature.APPARATUS;
    }
  }
  return room;
}

function decorateSiliconMacroRoom(world: World, room: Room, serial: number, rng: () => number): void {
  if (room.type === RoomType.MEDICAL) {
    for (let x = room.x + 4; x < room.x + room.w - 5; x += 8) {
      setFeature(world, x, room.y + 4, Feature.APPARATUS);
      setFeature(world, x + 2, room.y + room.h - 5, Feature.DESK);
    }
    setFeature(world, room.x + room.w - 6, room.y + 5, Feature.SCREEN);
    setFeature(world, room.x + 6, room.y + room.h - 6, Feature.LAMP);
    return;
  }
  if (room.type === RoomType.HQ) {
    setFeature(world, room.x + 6, room.y + 5, Feature.DESK);
    setFeature(world, room.x + 12, room.y + 5, Feature.CHAIR);
    setFeature(world, room.x + room.w - 7, room.y + 5, Feature.SCREEN);
    for (let x = room.x + 8; x < room.x + room.w - 8; x += 12) setFeature(world, x, room.y + room.h - 6, Feature.SHELF);
    return;
  }
  if (room.type === RoomType.STORAGE) {
    for (let x = room.x + 4; x < room.x + room.w - 4; x += 5) {
      setFeature(world, x, room.y + 4, Feature.SHELF);
      if (rng() < 0.45) setFeature(world, x, room.y + room.h - 5, Feature.APPARATUS);
    }
    if (serial % 2 === 0) {
      const water = world.idx(room.x + (room.w >> 1), room.y + (room.h >> 1));
      world.cells[water] = Cell.WATER;
      world.floorTex[water] = Tex.F_WATER;
      world.fog[water] = Math.max(world.fog[water], 52);
    }
    return;
  }
  for (let x = room.x + 5; x < room.x + room.w - 5; x += 7) {
    setFeature(world, x, room.y + 4, Feature.APPARATUS);
    setFeature(world, x + 2, room.y + room.h - 5, serial % 2 === 0 ? Feature.MACHINE : Feature.SCREEN);
  }
  setFeature(world, room.x + room.w - 7, room.y + 5, Feature.LAMP);
}

function placeRadialNetPods(world: World, mask: Uint8Array, rng: () => number): SiliconPoint[] {
  const centers: SiliconPoint[] = [];
  const specs = [
    { a: -Math.PI * 0.92, type: RoomType.PRODUCTION, w: 42, h: 22, name: 'Радиальный НЕТ-под северо-западного кристалла' },
    { a: -Math.PI * 0.68, type: RoomType.STORAGE, w: 38, h: 22, name: 'Радиальный НЕТ-под сухих образцов' },
    { a: -Math.PI * 0.32, type: RoomType.PRODUCTION, w: 42, h: 22, name: 'Радиальный НЕТ-под Safeguard-отсечки' },
    { a: -Math.PI * 0.08, type: RoomType.MEDICAL, w: 36, h: 22, name: 'Радиальный НЕТ-под живого кремния' },
    { a: Math.PI * 0.18, type: RoomType.STORAGE, w: 38, h: 22, name: 'Радиальный НЕТ-под остывших ячеек' },
    { a: Math.PI * 0.42, type: RoomType.PRODUCTION, w: 42, h: 22, name: 'Радиальный НЕТ-под нижней ветки' },
    { a: Math.PI * 0.66, type: RoomType.HQ, w: 40, h: 22, name: 'Радиальный НЕТ-под протокола допуска' },
    { a: Math.PI * 0.9, type: RoomType.PRODUCTION, w: 42, h: 22, name: 'Радиальный НЕТ-под обратного эха' },
  ];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const rx = Math.round(CX + Math.cos(spec.a) * 260 - spec.w / 2);
    const ry = Math.round(CY + Math.sin(spec.a) * 198 - spec.h / 2);
    const room = siliconMacroRoom(world, mask, spec.type, rx, ry, spec.w, spec.h, spec.name, Tex.PANEL, Tex.F_TILE, 2);
    if (!room) continue;
    decorateSiliconMacroRoom(world, room, i + 32, rng);
    const center = roomCenter(room);
    const ringTarget = {
      x: Math.round(CX + Math.cos(spec.a) * 106),
      y: Math.round(CY + Math.sin(spec.a) * 78),
    };
    connectSiliconRoomTo(world, mask, room, ringTarget, Tex.F_TILE, 30 + (i % 3) * 8);
    centers.push(center);
  }

  return centers;
}

function carveVaultShell(world: World, mask: Uint8Array): void {
  const shell: SiliconPoint[] = [
    { x: CX + 70, y: CY + 62 },
    { x: CX + 176, y: CY + 62 },
    { x: CX + 176, y: CY + 132 },
    { x: CX + 70, y: CY + 132 },
    { x: CX + 70, y: CY + 62 },
  ];
  for (let i = 1; i < shell.length; i++) {
    carveSiliconLine(world, mask, shell[i - 1].x, shell[i - 1].y, shell[i].x, shell[i].y, 2, Tex.F_TILE, 42);
  }
  for (const p of shell) {
    setCircuitFeature(world, p.x, p.y, Feature.SCREEN);
    setCircuitFeature(world, p.x + 2, p.y, Feature.APPARATUS);
  }
}

function carveHilbertCircuitTraces(world: World, mask: Uint8Array, radialPods: readonly SiliconPoint[]): void {
  const terminals: SiliconPoint[] = [
    { x: CX - 40, y: CY - 128 },
    { x: CX + 40, y: CY - 128 },
    { x: CX - 140, y: CY - 67 },
    { x: CX + 138, y: CY - 67 },
    { x: CX - 126, y: CY + 91 },
    { x: CX + 124, y: CY + 96 },
    ...radialPods,
  ];

  const route = hilbertTracePoints(3, CX - 112, CY - 96, 32);
  for (let i = 1; i < route.length; i++) {
    carveSiliconLine(world, mask, route[i - 1].x, route[i - 1].y, route[i].x, route[i].y, 1, Tex.F_TILE, 36);
  }
  for (let i = 0; i < route.length; i += 3) setCircuitFeature(world, route[i].x, route[i].y, i % 2 === 0 ? Feature.SCREEN : Feature.APPARATUS);

  for (let i = 0; i < terminals.length; i++) {
    const target = terminals[i];
    const hub = route[(i * 7 + 5) % route.length];
    carveSiliconLine(world, mask, hub.x, hub.y, target.x, target.y, 1, Tex.F_TILE, 34 + (i % 4) * 4);
    setCircuitFeature(world, target.x, target.y, i % 3 === 0 ? Feature.SCREEN : Feature.APPARATUS);
  }
}

function hilbertTracePoints(order: number, x: number, y: number, step: number): SiliconPoint[] {
  const n = 1 << order;
  const points: SiliconPoint[] = [];
  for (let d = 0; d < n * n; d++) {
    const p = hilbertIndexToPoint(n, d);
    points.push({ x: x + p.x * step, y: y + p.y * step });
  }
  return points;
}

function hilbertIndexToPoint(n: number, d: number): SiliconPoint {
  let rx = 0;
  let ry = 0;
  let t = d;
  let x = 0;
  let y = 0;
  for (let s = 1; s < n; s <<= 1) {
    rx = 1 & (t >> 1);
    ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const swap = x;
      x = y;
      y = swap;
    }
    x += s * rx;
    y += s * ry;
    t >>= 2;
  }
  return { x, y };
}

function applySiliconCrystalBands(world: World, mask: Uint8Array): void {
  for (let y = 64; y < W - 64; y++) {
    for (let x = 64; x < W - 64; x++) {
      const ci = world.idx(x, y);
      if (mask[ci] || world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) continue;
      const dx = world.delta(x, CX);
      const dy = world.delta(y, CY);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 132 || d > 470) continue;
      const angle = Math.atan2(dy, dx);
      const feed = Math.sin(d * 0.071 + angle * 6.0);
      const kill = Math.sin((dx - dy) * 0.036 + Math.sin((dx + dy) * 0.011) * 2.0);
      const noise = siliconCoordNoise(x, y);
      const band = feed * 0.52 + kill * 0.34 + noise * 0.32;
      if (band < 0.71) continue;
      world.floorTex[ci] = band > 0.92 ? Tex.F_WATER : Tex.F_TILE;
      world.fog[ci] = Math.max(world.fog[ci], band > 0.92 ? 64 : 42);
      if (noise > 0.9) world.features[ci] = Feature.APPARATUS;
      else if (noise < 0.08 && d > 210) world.features[ci] = Feature.SCREEN;
    }
  }
}

function siliconCoordNoise(x: number, y: number): number {
  let n = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(y ^ 0xc2b2ae35, 0x27d4eb2d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x2c1b3c6d);
  n ^= n >>> 12;
  return (n >>> 0) / 0x100000000;
}

function roomCenter(room: Room): SiliconPoint {
  return { x: room.x + (room.w >> 1), y: room.y + (room.h >> 1) };
}

function setCircuitFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR && world.features[ci] === Feature.NONE) world.features[ci] = feature;
}

function connectSiliconRoomTo(world: World, mask: Uint8Array, room: Room, target: { x: number; y: number }, floorTex: Tex, fog: number): void {
  const cx = room.x + (room.w >> 1);
  const cy = room.y + (room.h >> 1);
  const dx = world.delta(cx, target.x);
  const dy = world.delta(cy, target.y);
  let doorX = cx;
  let doorY = cy;
  let outsideX = cx;
  let outsideY = cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    doorX = dx < 0 ? room.x - 1 : room.x + room.w;
    doorY = Math.max(room.y + 2, Math.min(room.y + room.h - 3, cy));
    outsideX = doorX + (dx < 0 ? -1 : 1);
    outsideY = doorY;
  } else {
    doorX = Math.max(room.x + 2, Math.min(room.x + room.w - 3, cx));
    doorY = dy < 0 ? room.y - 1 : room.y + room.h;
    outsideX = doorX;
    outsideY = doorY + (dy < 0 ? -1 : 1);
  }
  forceOpenSiliconTile(world, doorX, doorY, floorTex, -1, fog);
  forceOpenSiliconTile(world, outsideX, outsideY, floorTex, -1, fog);
  carveSiliconLine(world, mask, outsideX, outsideY, target.x, target.y, 2, floorTex, fog);
}

function carveSiliconLine(
  world: World,
  mask: Uint8Array,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  fog: number,
): void {
  if (ax !== bx && ay !== by) {
    carveSiliconLine(world, mask, ax, ay, bx, ay, width, floorTex, fog);
    carveSiliconLine(world, mask, bx, ay, bx, by, width, floorTex, fog);
    return;
  }
  const half = width >> 1;
  const from = ax === bx ? Math.min(ay, by) : Math.min(ax, bx);
  const to = ax === bx ? Math.max(ay, by) : Math.max(ax, bx);
  for (let p = from; p <= to; p++) {
    for (let n = 0; n < width; n++) {
      const o = n - half;
      openSiliconTile(world, mask, ax === bx ? ax + o : p, ax === bx ? p : ay + o, floorTex, fog);
    }
  }
}

function openSiliconTile(world: World, mask: Uint8Array, x: number, y: number, floorTex: Tex, fog: number): void {
  const ci = world.idx(x, y);
  if (mask[ci] || world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR || world.hermoWall[ci]) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.floorTex[ci] = floorTex;
  world.wallTex[ci] = Tex.METAL;
  world.features[ci] = Feature.NONE;
  world.fog[ci] = Math.max(world.fog[ci], fog);
}

function forceOpenSiliconTile(world: World, x: number, y: number, floorTex: Tex, roomId: number, fog: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR || world.hermoWall[ci]) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = roomId;
  world.floorTex[ci] = floorTex;
  world.wallTex[ci] = Tex.METAL;
  world.features[ci] = Feature.NONE;
  world.fog[ci] = Math.max(world.fog[ci], fog);
}

function scatterSiliconCrystals(world: World, rng: () => number, cx: number, cy: number, radius: number): void {
  for (let i = 0; i < 42; i++) {
    const ang = rng() * Math.PI * 2;
    const r = 3 + rng() * radius;
    const x = Math.round(cx + Math.cos(ang) * r);
    const y = Math.round(cy + Math.sin(ang) * r);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) continue;
    world.features[ci] = i % 3 === 0 ? Feature.SCREEN : Feature.APPARATUS;
    world.fog[ci] = Math.max(world.fog[ci], 44);
  }
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

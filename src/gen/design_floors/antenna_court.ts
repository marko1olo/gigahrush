/* ── Design floor: antenna_court / Антенный двор ─────────────── */

import {
  W, Cell, ContainerKind, DoorState, Feature, FloorLevel, LiftDirection,
  RoomType, Tex, ZoneFaction,
  type Entity, EntityType, AIGoal, Faction, Occupation, QuestType, MonsterKind,
  type GameState, type Room, type WorldContainer, type WorldEvent,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { Spr } from '../../render/sprite_index';
import { publishEvent } from '../../systems/events';
import {
  connectRoomsMST,
  ensureConnectivity,
  generateZones,
  placeDoor,
  stampRoom,
} from '../shared';
import { placeProceduralScreens, SCREEN_FRAMES } from '../procedural_screens';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'antenna_court' as const;
export const ANTENNA_COURT_ROUTE_Z = -36 as const;
export const ANTENNA_COURT_BASE_FLOOR = FloorLevel.MINISTRY;

const SIGNAL_FLAG_TUNED = 1 << 0;
const SIGNAL_FLAG_MARKET_JAMMED = 1 << 1;
const SIGNAL_FLAG_VOID_RECORDED = 1 << 2;
const SIGNAL_FLAG_MINISTRY_NOTICED = 1 << 3;
const SIGNAL_FLAG_BATTERY_STOLEN = 1 << 4;

const CONTAINER_ID_BASE = 320_300;
const CX = W >> 1;
const CY = W >> 1;

export type AntennaRouteId =
  | 'roof'
  | 'obzh_school'
  | 'ministry'
  | 'metro_error_line'
  | 'market_88'
  | 'void_protocol';

export interface AntennaCourtSignalState {
  signalQuality: number;       // 0..5
  jamUntilHour: number;        // total game hour, -1 when inactive
  lastTunedRouteId: AntennaRouteId | '';
  recordedAnomalyFlags: number;
}

export interface AntennaSignalResult {
  ok: boolean;
  routeId: AntennaRouteId;
  label: string;
  clue: string;
  signalQuality: number;
  eventTags: string[];
}

export interface AntennaCourtGeneration extends FloorGeneration {
  routeId: typeof DESIGN_FLOOR_ID;
  z: typeof ANTENNA_COURT_ROUTE_Z;
  signalState: AntennaCourtSignalState;
  debug: string[];
}

interface SignalClueDef {
  label: string;
  minQuality: number;
  clue: string;
  faintClue: string;
  tags: string[];
}

interface AntennaHub {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  cabinName: string;
}

interface AntennaGate {
  x: number;
  y: number;
  r: number;
}

const SIGNAL_CLUES: Record<AntennaRouteId, SignalClueDef> = {
  roof: {
    label: 'Крыша',
    minQuality: 4,
    clue: 'Верхний люк отвечает только после ремонта мачты; ищи сухой ход и не верь открытому небу.',
    faintClue: 'Сверху слышен ветер и стук люка, но частота срывается.',
    tags: ['roof', 'repair', 'upper_route'],
  },
  obzh_school: {
    label: 'ОБЖ',
    minQuality: 2,
    clue: 'На школьной частоте повторяют: аптечка, убежище, список, гермодверь.',
    faintClue: 'Детский голос считает пункты эвакуации, дальше помеха.',
    tags: ['living', 'obzh', 'shelter'],
  },
  ministry: {
    label: 'Министерство',
    minQuality: 3,
    clue: 'Министерская несущая шипит про проверку записей: незаконный сигнал лучше не нести через очередь.',
    faintClue: 'Слышно слово "акт", потом печать глушит эфир.',
    tags: ['ministry', 'inspection', 'papers'],
  },
  metro_error_line: {
    label: 'Ошибка метро',
    minQuality: 3,
    clue: 'Темная платформа отвечает через билет: линия ошибается чаще у экранов и аппаратов.',
    faintClue: 'Под эфиром слышен поезд без станции.',
    tags: ['metro', 'wrong_stop', 'screen'],
  },
  market_88: {
    label: 'Рынок 88',
    minQuality: 2,
    clue: 'Черный рынок считает рейды по сухим щелчкам; короткий глушитель выиграет время, но оставит подпись.',
    faintClue: 'Восемьдесят восемь щелкает кассой, потом канал режут.',
    tags: ['market_88', 'raid', 'jam'],
  },
  void_protocol: {
    label: 'Пустотный протокол',
    minQuality: 5,
    clue: 'Пустота записывается как отсутствие слов; не открывай банку рядом с зеркальным экраном.',
    faintClue: 'В тишине слышна фраза без говорящего.',
    tags: ['void', 'protocol', 'recording'],
  },
};

const NPC_DEFS: Record<string, PlotNpcDef> = {
  antenna_pasha_grown: {
    name: 'Паша Выросший',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.ELECTRICIAN,
    sprite: Occupation.ELECTRICIAN,
    hp: 120, maxHp: 120, money: 80, speed: 0.85,
    inventory: [
      { defId: 'radio', count: 1 },
      { defId: 'relay_diagram', count: 1 },
      { defId: 'tea', count: 1 },
    ],
    talkLines: [
      'Я был Пашей из радиокружка, пока этажи не начали отвечать взрослыми голосами.',
      'Антенный двор слушает не дальние города, а соседние ошибки дома.',
      'Настраивать можно. Верить нельзя. Хороший сигнал дает зацепку, не карту.',
      'Частота ОБЖ ещё жива: аптечка, убежище, список, гермодверь. Нина бы одобрила.',
    ],
    talkLinesPost: [
      'Реле держится. Теперь эфир врет аккуратнее.',
      'Если услышишь свой адрес, не отвечай. Адреса тут ходят стаями.',
    ],
  },
  antenna_mirra_jammer: {
    name: 'Мирра Глушилка',
    isFemale: true,
    faction: Faction.WILD,
    occupation: Occupation.TRAVELER,
    sprite: Occupation.TRAVELER,
    hp: 95, maxHp: 95, money: 160, speed: 1.05,
    inventory: [
      { defId: 'wire_coil', count: 2 },
      { defId: 'cigs', count: 3 },
      { defId: 'metro_ticket', count: 1 },
    ],
    talkLines: [
      'Глушить надо коротко. Длинная тишина заметнее крика.',
      'Рынок 88 покупает минуты без рейда. Министерство продает вопросы после таких минут.',
      'Дашь проволоку и предохранители - я соберу заглушку, а ты решишь, кому станет тише.',
    ],
    talkLinesPost: [
      'Канал погас, но подпись осталась в шуме.',
      'Если инспектор спросит, ты слышал только прогноз погоды.',
    ],
  },
  antenna_captain_krug: {
    name: 'Капитан Круг',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 260, maxHp: 260, money: 95, speed: 1.05,
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 10 },
      { defId: 'official_permit_slip', count: 1 },
    ],
    talkLines: [
      'Круг, инспекция сигнала. Незаконная запись отличается от законной тем, кто первый составил акт.',
      'Батарейный шкаф под охраной. Нужна ячейка - оформляй ремонт или воруй достаточно тихо.',
      'Глушение рейдов я не слышал. Если услышу - услышу и тебя.',
    ],
    talkLinesPost: [
      'Батареи на месте или в отчете. Меня устроит любой вариант с подписью.',
      'Не носи пустотную запись через Министерство без бумаги.',
    ],
  },
  antenna_echo_zhenya: {
    name: 'Эхо Женя',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.CHILD,
    sprite: Occupation.CHILD,
    hp: 70, maxHp: 70, money: 18, speed: 0.9,
    inventory: [
      { defId: 'note', count: 2 },
      { defId: 'bread', count: 1 },
    ],
    talkLines: [
      'Я повторяю не людей. Я повторяю места, когда они забывают закрыть рот.',
      'Пустотный сигнал можно записать в банку. Потом его можно продать. Или отдать Якову. Или пожалеть.',
      'Если банка дрожит без голоса, значит запись получилась.',
    ],
    talkLinesPost: [
      'Теперь у меня во рту тише. Спасибо или извини, не знаю.',
      'Яков поймет запись. Рынок просто купит страх.',
    ],
    talkQuestResponse: 'Скажи Паше: верхняя мачта не сломана, она притворяется лежачей антенной.',
  },
};

registerSideQuest('antenna_pasha_grown', NPC_DEFS.antenna_pasha_grown, [
  {
    id: 'antenna_tune_floor',
    giverNpcId: 'antenna_pasha_grown',
    type: QuestType.VISIT,
    desc: 'Паша Выросший: «Дойди до Релейной будки и настрой школьную частоту. Награда - зацепка, не карта.»',
    targetRoomName: 'Релейная будка',
    rewardItem: 'relay_diagram', rewardCount: 1,
    extraRewards: [{ defId: 'caravan_route', count: 1 }],
    relationDelta: 12, xpReward: 45, moneyReward: 30,
  },
  {
    id: 'antenna_tell_echo',
    giverNpcId: 'antenna_pasha_grown',
    type: QuestType.TALK,
    desc: 'Паша Выросший: «Сверься с Эхо Женей. Он повторяет этажи, когда приборы начинают льстить.»',
    targetNpcId: 'antenna_echo_zhenya',
    rewardItem: 'radio', rewardCount: 1,
    relationDelta: 8, xpReward: 30, moneyReward: 20,
  },
]);

registerSideQuest('antenna_mirra_jammer', NPC_DEFS.antenna_mirra_jammer, [
  {
    id: 'antenna_jam_raid',
    giverNpcId: 'antenna_mirra_jammer',
    type: QuestType.FETCH,
    desc: 'Мирра Глушилка: «Принеси два предохранителя. Я дам короткую заглушку для рейда 88, но инспектор потом услышит пустое место.»',
    targetItem: 'fuse', targetCount: 2,
    rewardItem: 'metro_ticket', rewardCount: 1,
    extraRewards: [{ defId: 'wire_coil', count: 1 }],
    relationDelta: 10, xpReward: 50, moneyReward: 90,
  },
]);

registerSideQuest('antenna_captain_krug', NPC_DEFS.antenna_captain_krug, [
  {
    id: 'antenna_battery_theft',
    giverNpcId: 'antenna_captain_krug',
    type: QuestType.FETCH,
    desc: 'Капитан Круг: «Нужны две энергоячейки из батарейного шкафа. Получишь разрешение, если не заставишь меня писать слово "кража".»',
    targetItem: 'ammo_energy', targetCount: 2,
    rewardItem: 'official_permit_slip', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 8 }],
    relationDelta: 12, xpReward: 60, moneyReward: 50,
  },
]);

registerSideQuest('antenna_echo_zhenya', NPC_DEFS.antenna_echo_zhenya, [
  {
    id: 'antenna_record_void',
    giverNpcId: 'antenna_echo_zhenya',
    type: QuestType.FETCH,
    desc: 'Эхо Женя: «Запиши невозможный голос в банку и реши: продать страх или отдать его тем, кто понимает пустоту.»',
    targetItem: 'bottled_voice', targetCount: 1,
    rewardItem: 'psi_stabilizer', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 1 }],
    relationDelta: 10, xpReward: 70, moneyReward: 180,
  },
]);

export function createAntennaCourtSignalState(seed = 0): AntennaCourtSignalState {
  return {
    signalQuality: 3 + (Math.abs(seed) % 2),
    jamUntilHour: -1,
    lastTunedRouteId: '',
    recordedAnomalyFlags: 0,
  };
}

export function tuneAntennaCourtSignal(
  signalState: AntennaCourtSignalState,
  routeId: AntennaRouteId,
): AntennaSignalResult {
  const def = SIGNAL_CLUES[routeId];
  const quality = clampQuality(signalState.signalQuality);
  const ok = quality >= def.minQuality;
  signalState.signalQuality = quality;
  signalState.lastTunedRouteId = routeId;
  signalState.recordedAnomalyFlags |= SIGNAL_FLAG_TUNED;
  return {
    ok,
    routeId,
    label: def.label,
    clue: ok ? def.clue : def.faintClue,
    signalQuality: quality,
    eventTags: def.tags,
  };
}

export function repairAntennaCourtSignal(signalState: AntennaCourtSignalState, amount = 1): number {
  signalState.signalQuality = clampQuality(signalState.signalQuality + Math.max(0, amount | 0));
  return signalState.signalQuality;
}

export function jamAntennaCourtSignal(
  signalState: AntennaCourtSignalState,
  nowTotalHour: number,
  durationHours = 2,
): AntennaSignalResult {
  signalState.jamUntilHour = Math.max(signalState.jamUntilHour, nowTotalHour + Math.max(1, durationHours));
  signalState.signalQuality = clampQuality(signalState.signalQuality - 1);
  signalState.recordedAnomalyFlags |= SIGNAL_FLAG_MARKET_JAMMED | SIGNAL_FLAG_MINISTRY_NOTICED;
  return tuneAntennaCourtSignal(signalState, 'market_88');
}

export function recordAntennaCourtAnomaly(
  signalState: AntennaCourtSignalState,
  routeId: Extract<AntennaRouteId, 'void_protocol' | 'metro_error_line'> = 'void_protocol',
): AntennaSignalResult {
  const result = tuneAntennaCourtSignal(signalState, routeId);
  if (result.ok) signalState.recordedAnomalyFlags |= SIGNAL_FLAG_VOID_RECORDED;
  return result;
}

export function markAntennaCourtBatteryTaken(signalState: AntennaCourtSignalState): void {
  signalState.recordedAnomalyFlags |= SIGNAL_FLAG_BATTERY_STOLEN;
}

export function publishAntennaCourtSignalEvent(
  game: GameState,
  signalState: AntennaCourtSignalState,
  action: 'tune' | 'jam' | 'record' | 'repair' | 'battery',
  result?: AntennaSignalResult,
): WorldEvent {
  const routeId = (result?.routeId ?? signalState.lastTunedRouteId) || undefined;
  const eventTags = result?.eventTags ?? [];
  return publishEvent(game, {
    type: 'rumor_observed',
    floor: game.currentFloor,
    severity: action === 'jam' || action === 'record' ? 4 : 3,
    privacy: action === 'jam' ? 'witnessed' : 'local',
    targetName: routeId ?? DESIGN_FLOOR_ID,
    tags: [
      DESIGN_FLOOR_ID,
      'signal',
      `antenna_${action}`,
      ...eventTags,
    ],
    data: {
      routeId,
      designFloorId: DESIGN_FLOOR_ID,
      z: ANTENNA_COURT_ROUTE_Z,
      signalQuality: signalState.signalQuality,
      jamUntilHour: signalState.jamUntilHour,
      lastTunedRouteId: signalState.lastTunedRouteId,
      recordedAnomalyFlags: signalState.recordedAnomalyFlags,
      clue: result?.clue,
      ok: result?.ok,
    },
  });
}

export function antennaCourtDebugLines(signalState: AntennaCourtSignalState): string[] {
  return [
    `route=${DESIGN_FLOOR_ID}`,
    `z=${ANTENNA_COURT_ROUTE_Z}`,
    `quality=${clampQuality(signalState.signalQuality)}/5`,
    `tuned=${signalState.lastTunedRouteId || 'none'}`,
    `jamUntilHour=${signalState.jamUntilHour}`,
    `flags=${signalState.recordedAnomalyFlags}`,
  ];
}

export function expandAntennaCourtRouteGeometry(world: World, rng: () => number): void {
  const protectedCells = buildAntennaRouteProtectedMask(world);
  const court = findAntennaRoom(world, 'Антенный двор');
  const hubX = court ? court.x + (court.w >> 1) : CX;
  const hubY = court ? court.y + (court.h >> 1) : CY;

  carveSignalYard(world, hubX - 104, hubY - 92, 208, 184, protectedCells, [
    { x: hubX, y: hubY - 92, r: 4 },
    { x: hubX + 104, y: hubY, r: 4 },
    { x: hubX, y: hubY + 92, r: 4 },
    { x: hubX - 104, y: hubY, r: 4 },
  ]);
  if (court) openCentralSignalGates(world, court, protectedCells);

  const hubs = antennaRouteHubs();
  for (const hub of hubs) {
    carveSignalYard(world, hub.x - (hub.w >> 1), hub.y - (hub.h >> 1), hub.w, hub.h, protectedCells, yardGates(hub));
  }

  for (const hub of hubs) {
    carveCableLine(world, hubX, hubY, hub.x, hub.y, hub.name.includes('диагонал') ? 2 : 3, protectedCells);
  }
  carveHubRing(world, hubs, protectedCells);
  carveBypassRings(world, protectedCells);
  drawSectorFences(world, protectedCells);

  for (const hub of hubs) {
    placeRepeaterTower(world, hub.x, hub.y, protectedCells);
    scatterCableReels(world, rng, hubX, hubY, hub.x, hub.y, protectedCells);
  }
  placeCentralMastCluster(world, hubX, hubY, protectedCells);
  placeMaintenanceCabins(world, rng, hubs, protectedCells);
  placeWeatherScreenWalls(world, hubs, protectedCells);
}

export function generateAntennaCourtDesignFloor(seed = 0): AntennaCourtGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };
  let nextContainerId = CONTAINER_ID_BASE;

  world.wallTex.fill(Tex.CONCRETE);
  world.floorTex.fill(Tex.F_CONCRETE);

  const rooms = stampAntennaCourtRooms(world);
  connectRoomsMST(world, [
    rooms.courtyard,
    rooms.radioClub,
    rooms.relay,
    rooms.archive,
    rooms.battery,
    rooms.dorm,
    rooms.jammer,
    rooms.inspection,
    rooms.entry,
    rooms.exit,
  ]);
  placeDoor(world, rooms.courtyard, rooms.radioClub, '', false);
  placeDoor(world, rooms.courtyard, rooms.relay, '', false);
  placeDoor(world, rooms.archive, rooms.battery, 'key', false);

  generateZones(world);
  retuneAntennaZones(world, rooms);
  decorateAntennaCourt(world, rooms);
  placeProceduralScreens(world, ANTENNA_COURT_BASE_FLOOR);
  placeAuthoredSignalScreens(world, rooms);

  const pasha = spawnPlotNpc(entities, nextId, 'antenna_pasha_grown', rooms.radioClub, 4, 4, 0);
  const mirra = spawnPlotNpc(entities, nextId, 'antenna_mirra_jammer', rooms.jammer, 4, 4, Math.PI / 2);
  const captain = spawnPlotNpc(entities, nextId, 'antenna_captain_krug', rooms.inspection, 5, 5, Math.PI, { weapon: 'makarov' });
  spawnPlotNpc(entities, nextId, 'antenna_echo_zhenya', rooms.dorm, 3, 3, -Math.PI / 2, { spriteScale: 0.72 });

  spawnGuard(entities, nextId, rooms.battery.x + 2, rooms.battery.y + 7, 'Сержант Частотный');
  spawnGuard(entities, nextId, rooms.inspection.x + 8, rooms.inspection.y + 2, 'Дежурный Гц');
  spawnSignalMonsters(world, entities, nextId, rooms);

  addContainer(world, nextContainerId++, rooms.battery, 4, 4, ContainerKind.TOOL_LOCKER, 'Батарейный шкаф антенн', 'owner', [
    { defId: 'ammo_energy', count: 3 },
    { defId: 'fuse', count: 2 },
    { defId: 'wire_coil', count: 2 },
  ], captain);
  addContainer(world, nextContainerId++, rooms.archive, 4, 4, ContainerKind.FILING_CABINET, 'Архив записанных частот', 'locked', [
    { defId: 'bottled_voice', count: 1 },
    { defId: 'note', count: 3 },
    { defId: 'record_exposure_notice', count: 1 },
  ]);
  addContainer(world, nextContainerId++, rooms.relay, 7, 4, ContainerKind.METAL_CABINET, 'Ящик релейных схем', 'room', [
    { defId: 'relay_diagram', count: 2 },
    { defId: 'circuit_board', count: 1 },
    { defId: 'lamp_bulb', count: 2 },
  ], pasha);
  addContainer(world, nextContainerId++, rooms.jammer, 8, 3, ContainerKind.CASHBOX, 'Касса короткой тишины', 'owner', [
    { defId: 'metro_ticket', count: 1 },
    { defId: 'cigs', count: 2 },
    { defId: 'denunciation', count: 1 },
  ], mirra);

  dropItem(entities, nextId, rooms.entry.x + 3, rooms.entry.y + 4, 'radio', 1);
  dropItem(entities, nextId, rooms.courtyard.x + 22, rooms.courtyard.y + 25, 'wire_coil', 1);
  dropDesk(entities, nextId, rooms.radioClub.x + 6, rooms.radioClub.y + 5);
  dropDesk(entities, nextId, rooms.archive.x + 12, rooms.archive.y + 5);

  placeFixedLift(world, rooms.entry.x + 2, rooms.entry.y + 2, LiftDirection.DOWN);
  placeFixedLift(world, rooms.exit.x + rooms.exit.w - 3, rooms.exit.y + 2, LiftDirection.UP);

  const spawnX = rooms.entry.x + 5.5;
  const spawnY = rooms.entry.y + 5.5;
  ensureConnectivity(world, spawnX, spawnY);
  world.bakeLights();

  const signalState = createAntennaCourtSignalState(seed);
  return {
    world,
    entities,
    spawnX,
    spawnY,
    routeId: DESIGN_FLOOR_ID,
    z: ANTENNA_COURT_ROUTE_Z,
    signalState,
    debug: antennaCourtDebugLines(signalState),
  };
}

function antennaRouteHubs(): AntennaHub[] {
  return [
    { x: CX, y: 154, w: 128, h: 150, name: 'Северный мачтовый сектор', cabinName: 'Северная релейная кабина' },
    { x: 770, y: 254, w: 148, h: 118, name: 'Северо-восточная диагональная ферма', cabinName: 'Кабина погодного экрана' },
    { x: 870, y: CY, w: 150, h: 128, name: 'Восточный репитерный сектор', cabinName: 'Восточная ремонтная будка' },
    { x: 770, y: 770, w: 148, h: 118, name: 'Юго-восточная диагональная ферма', cabinName: 'Будка кабельного обхода' },
    { x: CX, y: 870, w: 128, h: 150, name: 'Южный мачтовый сектор', cabinName: 'Южная аккумуляторная кабина' },
    { x: 254, y: 770, w: 148, h: 118, name: 'Юго-западная диагональная ферма', cabinName: 'Будка мокрых кабелей' },
    { x: 154, y: CY, w: 150, h: 128, name: 'Западный репитерный сектор', cabinName: 'Западная релейная кабина' },
    { x: 254, y: 254, w: 148, h: 118, name: 'Северо-западная диагональная ферма', cabinName: 'Кабина глухого приема' },
  ];
}

function buildAntennaRouteProtectedMask(world: World): Uint8Array {
  const mask = new Uint8Array(W * W);
  for (const room of world.rooms) {
    if (!room) continue;
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      for (let x = room.x - 1; x <= room.x + room.w; x++) {
        mask[world.idx(x, y)] = 1;
      }
    }
  }
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.LIFT || world.features[i] === Feature.LIFT_BUTTON || world.aptMask[i] || world.hermoWall[i]) {
      mask[i] = 1;
    }
  }
  for (const idx of world.doors.keys()) mask[idx] = 1;
  for (const container of world.containers) mask[world.idx(container.x, container.y)] = 1;
  return mask;
}

function findAntennaRoom(world: World, name: string): Room | undefined {
  return world.rooms.find(room => room?.name === name);
}

function carveSignalYard(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  protectedCells: Uint8Array,
  gates: AntennaGate[],
): void {
  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) {
      setRouteFloor(world, x + dx, y + dy, Tex.F_CONCRETE, protectedCells);
    }
  }
  for (let dx = 0; dx < w; dx++) {
    setFenceOrGate(world, x + dx, y, protectedCells, gates);
    setFenceOrGate(world, x + dx, y + h - 1, protectedCells, gates);
  }
  for (let dy = 1; dy < h - 1; dy++) {
    setFenceOrGate(world, x, y + dy, protectedCells, gates);
    setFenceOrGate(world, x + w - 1, y + dy, protectedCells, gates);
  }
}

function yardGates(hub: AntennaHub): AntennaGate[] {
  const halfW = hub.w >> 1;
  const halfH = hub.h >> 1;
  return [
    { x: hub.x, y: hub.y - halfH, r: 5 },
    { x: hub.x + halfW, y: hub.y, r: 5 },
    { x: hub.x, y: hub.y + halfH, r: 5 },
    { x: hub.x - halfW, y: hub.y, r: 5 },
  ];
}

function setFenceOrGate(world: World, x: number, y: number, protectedCells: Uint8Array, gates: AntennaGate[]): void {
  if (isGateCell(world, x, y, gates)) setRouteFloor(world, x, y, Tex.F_CONCRETE, protectedCells);
  else setFenceWall(world, x, y, protectedCells);
}

function isGateCell(world: World, x: number, y: number, gates: AntennaGate[]): boolean {
  for (const gate of gates) {
    if (world.dist2(x, y, gate.x, gate.y) <= gate.r * gate.r) return true;
  }
  return false;
}

function openCentralSignalGates(world: World, court: Room, protectedCells: Uint8Array): void {
  openRoomSideGate(world, court, 0, -1, protectedCells);
  openRoomSideGate(world, court, 1, 0, protectedCells);
  openRoomSideGate(world, court, 0, 1, protectedCells);
  openRoomSideGate(world, court, -1, 0, protectedCells);
}

function openRoomSideGate(world: World, room: Room, dx: number, dy: number, protectedCells: Uint8Array): void {
  const horizontal = dy !== 0;
  const span = horizontal ? room.w : room.h;
  const mid = Math.floor(span / 2);
  for (let offset = 0; offset <= mid; offset++) {
    for (const signed of offset === 0 ? [0] : [-offset, offset]) {
      const sx = horizontal ? room.x + mid + signed : room.x + (dx > 0 ? room.w : -1);
      const sy = horizontal ? room.y + (dy > 0 ? room.h : -1) : room.y + mid + signed;
      const insideX = sx - dx;
      const insideY = sy - dy;
      const outsideX = sx + dx;
      const outsideY = sy + dy;
      const insideIdx = world.idx(insideX, insideY);
      const outsideIdx = world.idx(outsideX, outsideY);
      if (world.roomMap[insideIdx] !== room.id) continue;
      if (protectedCells[outsideIdx] || world.roomMap[outsideIdx] >= 0 || world.cells[outsideIdx] === Cell.LIFT) continue;
      placeAntennaGate(world, sx, sy, room.id, -1, '');
      carveCableDisc(world, outsideX, outsideY, 2, Tex.F_CONCRETE, protectedCells);
      return;
    }
  }
}

function carveHubRing(world: World, hubs: AntennaHub[], protectedCells: Uint8Array): void {
  for (let i = 0; i < hubs.length; i++) {
    const a = hubs[i];
    const b = hubs[(i + 1) % hubs.length];
    carveCableLine(world, a.x, a.y, b.x, b.y, 2, protectedCells);
  }
}

function carveBypassRings(world: World, protectedCells: Uint8Array): void {
  carveRectCable(world, CX - 174, CY - 174, 348, 348, 2, protectedCells);
  carveRectCable(world, CX - 304, CY - 304, 608, 608, 1, protectedCells);
  carveCableLine(world, CX - 304, CY, CX + 304, CY, 1, protectedCells);
  carveCableLine(world, CX, CY - 304, CX, CY + 304, 1, protectedCells);
}

function carveRectCable(world: World, x: number, y: number, w: number, h: number, width: number, protectedCells: Uint8Array): void {
  carveCableLine(world, x, y, x + w, y, width, protectedCells);
  carveCableLine(world, x + w, y, x + w, y + h, width, protectedCells);
  carveCableLine(world, x + w, y + h, x, y + h, width, protectedCells);
  carveCableLine(world, x, y + h, x, y, width, protectedCells);
}

function drawSectorFences(world: World, protectedCells: Uint8Array): void {
  const gateYs = [154, 254, CY - 174, CY, CY + 174, 770, 870];
  const gateXs = [154, 254, CX - 174, CX, CX + 174, 770, 870];
  drawFenceLine(world, CX - 156, 92, CX - 156, W - 92, protectedCells, gateYs.map(y => ({ x: CX - 156, y, r: 10 })));
  drawFenceLine(world, CX + 156, 92, CX + 156, W - 92, protectedCells, gateYs.map(y => ({ x: CX + 156, y, r: 10 })));
  drawFenceLine(world, 92, CY - 156, W - 92, CY - 156, protectedCells, gateXs.map(x => ({ x, y: CY - 156, r: 10 })));
  drawFenceLine(world, 92, CY + 156, W - 92, CY + 156, protectedCells, gateXs.map(x => ({ x, y: CY + 156, r: 10 })));
}

function drawFenceLine(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  protectedCells: Uint8Array,
  gates: AntennaGate[],
): void {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(ax + (bx - ax) * t);
    const y = Math.round(ay + (by - ay) * t);
    setFenceOrGate(world, x, y, protectedCells, gates);
  }
}

function carveCableLine(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  protectedCells?: Uint8Array,
): void {
  const dx = world.delta(ax, bx);
  const dy = world.delta(ay, by);
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = world.wrap(Math.round(ax + dx * t));
    const y = world.wrap(Math.round(ay + dy * t));
    carveCableDisc(world, x, y, width, Tex.F_CONCRETE, protectedCells);
  }
}

function carveCableDisc(
  world: World,
  cx: number,
  cy: number,
  r: number,
  floorTex: Tex,
  protectedCells?: Uint8Array,
): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      setRouteFloor(world, cx + dx, cy + dy, floorTex, protectedCells);
    }
  }
}

function setRouteFloor(world: World, x: number, y: number, floorTex: Tex, protectedCells?: Uint8Array): void {
  const ci = world.idx(x, y);
  if (protectedCells?.[ci] || world.cells[ci] === Cell.LIFT) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.floorTex[ci] = floorTex;
  if (world.features[ci] !== Feature.SCREEN) world.features[ci] = Feature.NONE;
}

function setFenceWall(world: World, x: number, y: number, protectedCells: Uint8Array): void {
  const ci = world.idx(x, y);
  if (protectedCells[ci] || world.cells[ci] === Cell.LIFT) return;
  world.cells[ci] = Cell.WALL;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.METAL;
  world.features[ci] = Feature.NONE;
}

function placeRepeaterTower(world: World, x: number, y: number, protectedCells: Uint8Array): void {
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    setFenceWall(world, x + dx, y + dy, protectedCells);
  }
  for (let a = 0; a < 8; a++) {
    const px = x + Math.round(Math.cos(a * Math.PI / 4) * 5);
    const py = y + Math.round(Math.sin(a * Math.PI / 4) * 5);
    setFeatureIfUnprotectedFloor(world, px, py, protectedCells, a % 3 === 0 ? Feature.LAMP : Feature.APPARATUS);
  }
}

function placeCentralMastCluster(world: World, x: number, y: number, protectedCells: Uint8Array): void {
  const offsets = [
    [-74, -50], [70, -48], [-84, 44], [82, 48],
    [-46, -74], [46, 74],
  ] as const;
  for (const [dx, dy] of offsets) {
    placeRepeaterTower(world, x + dx, y + dy, protectedCells);
  }
}

function scatterCableReels(
  world: World,
  rng: () => number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  protectedCells: Uint8Array,
): void {
  const dx = world.delta(ax, bx);
  const dy = world.delta(ay, by);
  const len = Math.max(1, Math.hypot(dx, dy));
  const px = -dy / len;
  const py = dx / len;
  const count = Math.max(2, Math.floor(len / 86));
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const side = rng() < 0.5 ? -1 : 1;
    const offset = side * (5 + Math.floor(rng() * 6));
    const x = world.wrap(Math.round(ax + dx * t + px * offset));
    const y = world.wrap(Math.round(ay + dy * t + py * offset));
    setFeatureIfUnprotectedFloor(world, x, y, protectedCells, rng() < 0.55 ? Feature.MACHINE : Feature.APPARATUS);
  }
}

function placeMaintenanceCabins(
  world: World,
  rng: () => number,
  hubs: AntennaHub[],
  protectedCells: Uint8Array,
): void {
  for (let i = 0; i < hubs.length; i++) {
    const hub = hubs[i];
    const w = 18 + Math.floor(rng() * 7);
    const h = 12 + Math.floor(rng() * 5);
    const sideX = hub.x < CX ? -1 : hub.x > CX ? 1 : (i % 2 === 0 ? -1 : 1);
    const sideY = hub.y < CY ? -1 : hub.y > CY ? 1 : (i % 2 === 0 ? 1 : -1);
    const options = [
      { x: hub.x + sideX * ((hub.w >> 1) - w - 10), y: hub.y + sideY * 18 },
      { x: hub.x - sideX * 18, y: hub.y + sideY * ((hub.h >> 1) - h - 8) },
      { x: hub.x + sideX * 28, y: hub.y - sideY * 24 },
    ];
    for (const option of options) {
      const rx = clampInt(option.x, 28, W - w - 28);
      const ry = clampInt(option.y, 28, W - h - 28);
      if (!canBuildRouteRoom(world, rx, ry, w, h, protectedCells)) continue;
      const room = stampNamedRoom(
        world,
        i % 3 === 0 ? RoomType.STORAGE : RoomType.PRODUCTION,
        rx,
        ry,
        w,
        h,
        hub.cabinName,
        i % 2 === 0 ? Tex.METAL : Tex.PIPE,
        Tex.F_CONCRETE,
      );
      decorateRouteCabin(world, room, rng);
      openRouteRoomToPoint(world, room, hub.x, hub.y, protectedCells);
      break;
    }
  }
}

function canBuildRouteRoom(world: World, x: number, y: number, w: number, h: number, protectedCells: Uint8Array): boolean {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (protectedCells[ci] || world.cells[ci] === Cell.LIFT || world.doors.has(ci)) return false;
    }
  }
  return true;
}

function decorateRouteCabin(world: World, room: Room, rng: () => number): void {
  const featureCount = Math.max(3, Math.floor(room.w * room.h / 55));
  for (let i = 0; i < featureCount; i++) {
    const x = room.x + 2 + Math.floor(rng() * Math.max(1, room.w - 4));
    const y = room.y + 2 + Math.floor(rng() * Math.max(1, room.h - 4));
    setFeatureIfFloor(world, x, y, i % 5 === 0 ? Feature.LAMP : i % 2 === 0 ? Feature.APPARATUS : Feature.MACHINE);
  }
}

function openRouteRoomToPoint(world: World, room: Room, tx: number, ty: number, protectedCells: Uint8Array): void {
  const cx = room.x + (room.w >> 1);
  const cy = room.y + (room.h >> 1);
  const dx = world.delta(cx, tx);
  const dy = world.delta(cy, ty);
  let doorX = cx;
  let doorY = cy;
  let outsideX = cx;
  let outsideY = cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    const sx = dx > 0 ? 1 : -1;
    doorX = room.x + (sx > 0 ? room.w : -1);
    doorY = cy;
    outsideX = doorX + sx;
    outsideY = doorY;
  } else {
    const sy = dy > 0 ? 1 : -1;
    doorX = cx;
    doorY = room.y + (sy > 0 ? room.h : -1);
    outsideX = doorX;
    outsideY = doorY + sy;
  }
  placeAntennaGate(world, doorX, doorY, room.id, -1, '');
  carveCableLine(world, outsideX, outsideY, tx, ty, 1, protectedCells);
}

function placeWeatherScreenWalls(world: World, hubs: AntennaHub[], protectedCells: Uint8Array): void {
  for (let x = CX - 84; x <= CX + 84; x += 12) {
    if (!protectedCells[world.idx(x, CY - 92)]) setWallScreen(world, x, CY - 92, (x >> 2) & 7);
  }
  for (let i = 0; i < hubs.length; i++) {
    const hub = hubs[i];
    const y = hub.y - (hub.h >> 1);
    for (let dx = -18; dx <= 18; dx += 12) {
      const x = hub.x + dx;
      if (!protectedCells[world.idx(x, y)]) setWallScreen(world, x, y, (i + dx + 64) & 7);
    }
  }
}

function setFeatureIfUnprotectedFloor(
  world: World,
  x: number,
  y: number,
  protectedCells: Uint8Array,
  feature: Feature,
): void {
  const ci = world.idx(x, y);
  if (protectedCells[ci] || world.cells[ci] !== Cell.FLOOR) return;
  world.features[ci] = feature;
}

function placeAntennaGate(world: World, x: number, y: number, roomA: number, roomB: number, keyId: string): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT) return;
  world.cells[ci] = Cell.DOOR;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.DOOR_METAL;
  world.features[ci] = Feature.NONE;
  world.doors.set(ci, {
    idx: ci,
    state: keyId ? DoorState.LOCKED : DoorState.CLOSED,
    roomA,
    roomB,
    keyId,
    timer: 0,
  });
  const a = world.rooms[roomA];
  const b = world.rooms[roomB];
  if (a && !a.doors.includes(ci)) a.doors.push(ci);
  if (b && !b.doors.includes(ci)) b.doors.push(ci);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value | 0));
}

function clampQuality(value: number): number {
  return Math.max(0, Math.min(5, value | 0));
}

function stampAntennaCourtRooms(world: World): Record<string, Room> {
  const courtyard = stampNamedRoom(world, RoomType.COMMON, CX - 22, CY - 19, 44, 34, 'Антенный двор', Tex.PANEL, Tex.F_CONCRETE);
  return {
    courtyard,
    radioClub: stampNamedRoom(world, RoomType.PRODUCTION, CX - 38, CY - 14, 12, 12, 'Радиоклуб взрослых детей', Tex.METAL, Tex.F_CONCRETE),
    relay: stampNamedRoom(world, RoomType.PRODUCTION, CX + 26, CY - 14, 12, 12, 'Релейная будка', Tex.PIPE, Tex.F_CONCRETE),
    archive: stampNamedRoom(world, RoomType.OFFICE, CX - 10, CY - 34, 20, 10, 'Архив мониторинга', Tex.MARBLE, Tex.F_MARBLE_TILE),
    battery: stampNamedRoom(world, RoomType.STORAGE, CX + 14, CY - 34, 10, 10, 'Батарейная кладовая', Tex.METAL, Tex.F_CONCRETE),
    dorm: stampNamedRoom(world, RoomType.LIVING, CX - 10, CY + 19, 20, 9, 'Операторская спальня', Tex.PANEL, Tex.F_LINO),
    jammer: stampNamedRoom(world, RoomType.SMOKING, CX - 38, CY + 1, 12, 11, 'Кабина глушения', Tex.DARK, Tex.F_CARPET),
    inspection: stampNamedRoom(world, RoomType.HQ, CX + 26, CY + 1, 12, 11, 'Пост сигнал-инспекции', Tex.MARBLE, Tex.F_RED_CARPET),
    entry: stampNamedRoom(world, RoomType.CORRIDOR, CX - 24, CY + 33, 11, 8, 'Входной лифтовый тамбур', Tex.CONCRETE, Tex.F_CONCRETE),
    exit: stampNamedRoom(world, RoomType.CORRIDOR, CX - 24, CY - 44, 11, 8, 'Верхний лифтовый тамбур', Tex.CONCRETE, Tex.F_CONCRETE),
  };
}

function stampNamedRoom(
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
      const ci = world.idx(x + dx, y + dy);
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) {
        world.floorTex[ci] = floorTex;
      } else if (world.cells[ci] === Cell.WALL) {
        world.wallTex[ci] = wallTex;
      }
    }
  }
  return room;
}

function retuneAntennaZones(world: World, rooms: Record<string, Room>): void {
  world.factionControl.fill(ZoneFaction.CITIZEN);
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CX, CY);
    zone.level = d < 70 ? 3 : 2;
    zone.faction = ZoneFaction.CITIZEN;
  }
  paintRoomFaction(world, rooms.inspection, ZoneFaction.LIQUIDATOR);
  paintRoomFaction(world, rooms.battery, ZoneFaction.LIQUIDATOR);
  paintRoomFaction(world, rooms.archive, ZoneFaction.CITIZEN);
  paintRoomFaction(world, rooms.jammer, ZoneFaction.WILD);
  paintRoomFaction(world, rooms.relay, ZoneFaction.CITIZEN);
}

function paintRoomFaction(world: World, room: Room, faction: ZoneFaction): void {
  const zid = world.zoneMap[world.idx(room.x + (room.w >> 1), room.y + (room.h >> 1))];
  if (world.zones[zid]) world.zones[zid].faction = faction;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      world.factionControl[ci] = faction;
    }
  }
}

function decorateAntennaCourt(world: World, rooms: Record<string, Room>): void {
  const court = rooms.courtyard;
  for (let dy = 4; dy < court.h - 3; dy += 7) {
    for (let dx = 5; dx < court.w - 4; dx += 8) {
      placeAntennaMast(world, court.x + dx, court.y + dy);
    }
  }
  for (let dx = 2; dx < court.w - 2; dx += 5) setFeatureIfFloor(world, court.x + dx, court.y + 1, Feature.APPARATUS);
  for (let dx = 3; dx < court.w - 3; dx += 7) setFeatureIfFloor(world, court.x + dx, court.y + court.h - 2, Feature.LAMP);

  for (const room of [rooms.radioClub, rooms.relay, rooms.archive, rooms.jammer, rooms.inspection]) {
    setFeatureIfFloor(world, room.x + 1, room.y + 1, Feature.LAMP);
    setFeatureIfFloor(world, room.x + 2, room.y + 2, Feature.APPARATUS);
    setFeatureIfFloor(world, room.x + room.w - 3, room.y + 2, Feature.MACHINE);
    setFeatureIfFloor(world, room.x + room.w - 3, room.y + room.h - 3, Feature.TABLE);
    setFeatureIfFloor(world, room.x + room.w - 4, room.y + room.h - 3, Feature.CHAIR);
  }

  setFeatureIfFloor(world, rooms.battery.x + 2, rooms.battery.y + 2, Feature.SHELF);
  setFeatureIfFloor(world, rooms.battery.x + 6, rooms.battery.y + 3, Feature.MACHINE);
  setFeatureIfFloor(world, rooms.dorm.x + 3, rooms.dorm.y + 4, Feature.BED);
  setFeatureIfFloor(world, rooms.dorm.x + 9, rooms.dorm.y + 4, Feature.TABLE);
  setFeatureIfFloor(world, rooms.entry.x + 5, rooms.entry.y + 2, Feature.LAMP);
  setFeatureIfFloor(world, rooms.exit.x + 5, rooms.exit.y + 2, Feature.LAMP);
}

function placeAntennaMast(world: World, x: number, y: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.cells[ci] = Cell.WALL;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.METAL;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    setFeatureIfFloor(world, x + dx, y + dy, Feature.APPARATUS);
  }
}

function setFeatureIfFloor(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR) world.features[ci] = feature;
}

function placeAuthoredSignalScreens(world: World, rooms: Record<string, Room>): void {
  setWallScreen(world, rooms.courtyard.x + 7, rooms.courtyard.y - 1, 3);
  setWallScreen(world, rooms.courtyard.x + 18, rooms.courtyard.y - 1, 4);
  setWallScreen(world, rooms.courtyard.x + 29, rooms.courtyard.y - 1, 7);
  setWallScreen(world, rooms.radioClub.x + 4, rooms.radioClub.y - 1, 0);
  setWallScreen(world, rooms.relay.x + rooms.relay.w, rooms.relay.y + 4, 6);
  setWallScreen(world, rooms.archive.x + 8, rooms.archive.y + rooms.archive.h, 7);
  setWallScreen(world, rooms.jammer.x + 5, rooms.jammer.y - 1, 2);
}

function setWallScreen(world: World, x: number, y: number, variant: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.WALL) return;
  const frame = Math.abs((x * 17 + y * 31 + variant * 7) | 0) % SCREEN_FRAMES;
  world.wallTex[ci] = (Tex.SCREEN_BASE + variant * SCREEN_FRAMES + frame) as Tex;
  world.features[ci] = Feature.SCREEN;
  if (!world.screenCells.includes(ci)) world.screenCells.push(ci);
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: { v: number },
  plotNpcId: string,
  room: Room,
  dx: number,
  dy: number,
  angle: number,
  extra?: Partial<Entity>,
): Entity {
  const def = NPC_DEFS[plotNpcId];
  const npc: Entity = {
    id: nextId.v++,
    type: EntityType.NPC,
    x: room.x + dx + 0.5,
    y: room.y + dy + 0.5,
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
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId,
    canGiveQuest: true,
    questId: -1,
    ...extra,
  };
  entities.push(npc);
  return npc;
}

function spawnGuard(entities: Entity[], nextId: { v: number }, x: number, y: number, name: string): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.PI / 2,
    pitch: 0,
    alive: true,
    speed: 1.0,
    sprite: Occupation.HUNTER,
    name,
    isFemale: false,
    needs: freshNeeds(),
    hp: 180,
    maxHp: 180,
    money: 35,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: [{ defId: 'makarov', count: 1 }, { defId: 'ammo_9mm', count: 8 }],
    weapon: 'makarov',
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    canGiveQuest: false,
    questId: -1,
  });
}

function spawnSignalMonsters(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  rooms: Record<string, Room>,
): void {
  spawnMonster(world, entities, nextId, MonsterKind.EYE, rooms.courtyard.x + 21, rooms.courtyard.y + 8);
  spawnMonster(world, entities, nextId, MonsterKind.EYE, rooms.courtyard.x + 29, rooms.courtyard.y + 22);
  spawnMonster(world, entities, nextId, MonsterKind.REBAR, rooms.relay.x + 3, rooms.relay.y + 7);
  spawnMonster(world, entities, nextId, MonsterKind.SHADOW, rooms.archive.x + 16, rooms.archive.y + 6);
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  kind: MonsterKind,
  x: number,
  y: number,
): void {
  const def = MONSTERS[kind];
  if (!def) return;
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  entities.push({
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: def.sprite,
    hp: def.hp,
    maxHp: def.hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: CX, ty: CY, path: [], pi: 0, stuck: 0, timer: 0 },
  });
}

function addContainer(
  world: World,
  id: number,
  room: Room,
  dx: number,
  dy: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: WorldContainer['inventory'],
  owner?: Entity,
): void {
  const x = room.x + dx;
  const y = room.y + dy;
  const ci = world.idx(x, y);
  world.addContainer({
    id,
    x,
    y,
    floor: ANTENNA_COURT_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[ci],
    kind,
    name,
    inventory,
    capacitySlots: 10,
    ownerNpcId: owner?.id,
    ownerName: owner?.name,
    faction: owner?.faction,
    access,
    lockDifficulty: access === 'locked' || access === 'owner' ? 3 : undefined,
    discovered: true,
    tags: [DESIGN_FLOOR_ID, 'signal', 'radio', access === 'owner' ? 'theft' : 'loot'],
  });
}

function dropItem(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count: number): void {
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

function dropDesk(entities: Entity[], nextId: { v: number }, x: number, y: number): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.DESK,
    spriteScale: 0.55,
    inventory: [],
  });
}

function placeFixedLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
  const bi = world.idx(x + 1, y);
  if (world.cells[bi] === Cell.FLOOR) {
    world.features[bi] = Feature.LIFT_BUTTON;
    world.liftDir[bi] = direction;
  }
}

export const ANTENNA_COURT_DEBUG_ENTRY = {
  routeId: DESIGN_FLOOR_ID,
  z: ANTENNA_COURT_ROUTE_Z,
  generator: 'generateAntennaCourtDesignFloor',
} as const;

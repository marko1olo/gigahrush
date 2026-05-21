/* -- Design floor: bank_floor - cash desks, debt and vault risk -- */

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
  Occupation,
  QuestType,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type GameState,
  type Item,
  type Room,
  type WorldContainer,
  type WorldEvent,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { publishEvent } from '../../systems/events';
import { stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const BANK_FLOOR_ROUTE_ID = 'bank_floor' as const;
export const BANK_FLOOR_Z = 26;
export const BANK_FLOOR_BASE_FLOOR = FloorLevel.MINISTRY;

export const BANK_ROOM_NAMES = {
  liftLobby: 'Лифтовый вестибюль банка Б-22',
  hall: 'Главный кассовый зал банка Б-22',
  teller: 'Кассовая линия банка Б-22',
  deposit: 'Депозитный ряд банка Б-22',
  credit: 'Кредитное окно банка Б-22',
  queue: 'Очередь должников банка Б-22',
  vault: 'Хранилище кассовых ячеек Б-22',
  bypass: 'Черный служебный обход банка Б-22',
} as const;

export const BANK_FLOOR_META = {
  routeId: BANK_FLOOR_ROUTE_ID,
  displayName: 'Банковский этаж',
  z: BANK_FLOOR_Z,
  baseFloor: BANK_FLOOR_BASE_FLOOR,
  // Bank B-22 lives in the Ministry band because money here is paperwork first:
  // accounts, stamped debt, audits and liquidator-backed vault rules.
  baseReason: 'ministry_bureaucratic_finance',
  debugEntry: 'generateBankFloorDesignFloor()',
} as const;

export interface BankFloorState {
  routeId: typeof BANK_FLOOR_ROUTE_ID;
  anchorZ: typeof BANK_FLOOR_Z;
  baseFloor: typeof BANK_FLOOR_BASE_FLOOR;
  legalRooms: string[];
  riskRooms: string[];
  vaultContainerIds: number[];
  depositContainerIds: number[];
  debugEntry: {
    spawnX: number;
    spawnY: number;
    summary: string;
  };
}

export interface BankFloorGeneration extends FloorGeneration {
  bankState: BankFloorState;
}

type BankActionKind = 'deposit' | 'loan' | 'repay' | 'forgery' | 'vault_theft';

const BANK_TAGS = ['banking', BANK_FLOOR_ROUTE_ID];

const DIRECTOR_DEF: PlotNpcDef = {
  name: 'Зинаида Балансовна',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.DIRECTOR,
  sprite: Occupation.DIRECTOR,
  hp: 150, maxHp: 150, money: 210, speed: 0.75,
  inventory: [
    { defId: 'official_permit_slip', count: 1 },
    { defId: 'ration_registry_extract', count: 1 },
    { defId: 'seal_wax', count: 2 },
  ],
  talkLines: [
    'Деньги без печати - слух. С печатью это уже обязательство, и оно умеет ждать у лифта.',
    'Хранилище открыто глазами, но закрыто ведомостью. Украсть можно. Потом ведомость украдет сон.',
    'Фальшивую долговую бумагу лучше сдавать до того, как она научилась писать вашу фамилию.',
  ],
  talkLinesPost: [
    'Баланс сошелся. В Гигахруще это не победа, а короткая пауза.',
    'Если долг стал тише, не значит, что он ушел. Он просто перешел на внутренний учет.',
  ],
};

const CASHIER_DEF: PlotNpcDef = {
  name: 'Люба Кассир',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 95, maxHp: 95, money: 160, speed: 0.8,
  inventory: [
    { defId: 'voluntary_receipt', count: 2 },
    { defId: 'filter_receipt', count: 1 },
    { defId: 'blank_form', count: 1 },
  ],
  talkLines: [
    'Внести можно наличные. Снять нельзя без очереди, потому что очередь тоже хочет снять.',
    'Касса любит простую арифметику: рубль вошел, бумага вышла, человек стал спокойнее на один коридор.',
    'Не ставьте локти на окно. Предыдущий локоть до сих пор числится залогом.',
  ],
  talkLinesPost: [
    'Ваш взнос лежит там, где деньги становятся строкой.',
    'Квитанцию не мочите. Мокрая бумага считает себя прощенным долгом.',
  ],
};

const CREDIT_DEF: PlotNpcDef = {
  name: 'Прохор Кредитный',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 120, maxHp: 120, money: 320, speed: 0.7,
  inventory: [
    { defId: 'voluntary_receipt', count: 1 },
    { defId: 'bank_debt_paper', count: 1 },
    { defId: 'forged_stamp_sheet', count: 1 },
    { defId: 'ink_bottle', count: 1 },
  ],
  talkLines: [
    'Кредит - это когда банк верит, что вы вернетесь. В нашем доме это почти угроза.',
    'Проценты растут медленнее самосбора, но зато без сирены.',
    'Погасить можно деньгами. Нельзя погасить взгляд ликвидатора у хранилища.',
  ],
  talkLinesPost: [
    'Долг записан. Теперь у вас есть причина вернуться живым.',
    'Погашенная строка пахнет сургучом. Непогашенная - коридором за спиной.',
  ],
};

const GUARD_DEF: PlotNpcDef = {
  name: 'Семен Инкассатор',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 230, maxHp: 230, money: 55, speed: 1.05,
  inventory: [
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 14 },
    { defId: 'liquidator_token', count: 1 },
  ],
  talkLines: [
    'Я охраняю не деньги. Деньги сами кусаются. Я охраняю свидетелей от плохих решений.',
    'В хранилище тихо только до первой чужой руки.',
    'Черный обход существует для сотрудников. Воры тоже сотрудники, просто без ведомости.',
  ],
  talkLinesPost: [
    'Если касса молчит, значит пока все живы.',
    'У сейфа нет настроения. У меня есть.',
  ],
};

const DEBTOR_DEF: PlotNpcDef = {
  name: 'Митя Просрочка',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 80, maxHp: 80, money: 9, speed: 0.9,
  inventory: [
    { defId: 'forged_bank_debt_paper', count: 1 },
    { defId: 'forged_stamp_sheet', count: 1 },
    { defId: 'cigs', count: 1 },
  ],
  talkLines: [
    'Если бумага похожа на долг, банк сам дорисует остальное.',
    'Я не вор. Я курьер между чужой подписью и своим страхом.',
    'Можно сдать липу управляющей. Можно отдать мне, и касса на минуту станет слепой.',
  ],
  talkLinesPost: [
    'Долг не исчез. Он просто сменил почерк.',
    'Очередь смотрит, будто знает, кто подделал строку.',
  ],
};

registerSideQuest('bank_director_zinaida', DIRECTOR_DEF, [
  {
    id: 'bank_report_forged_debt_paper',
    giverNpcId: 'bank_director_zinaida',
    type: QuestType.FETCH,
    desc: 'Зинаида Балансовна: «Найдете липовую долговую бумагу - сдайте в окно управляющей. Лучше пусть банк злится на бумагу, а не на вас.»',
    targetItem: 'forged_bank_debt_paper', targetCount: 1,
    rewardItem: 'official_permit_slip', rewardCount: 1,
    extraRewards: [{ defId: 'seal_wax', count: 1 }],
    relationDelta: 10, xpReward: 55, moneyReward: 35,
    eventTargetName: 'Фальшивая долговая бумага сдана управляющей банка Б-22.',
    eventTags: [...BANK_TAGS, 'forgery', 'debt_paper', 'report', 'legal'],
    eventData: { bankingAction: 'report_forged_debt_paper', debtRiskClosed: true },
    abandonsSideQuestIds: ['bank_cash_forged_debt_paper'],
  },
]);

registerSideQuest('bank_cashier_lyuba', CASHIER_DEF, [
  {
    id: 'bank_cash_deposit_50',
    giverNpcId: 'bank_cashier_lyuba',
    type: QuestType.FETCH,
    desc: 'Люба Кассир: «Пятьдесят рублей в кассу Б-22. На руки дам квитанцию: деньги станут строкой, строка станет спокойнее наличных.»',
    targetItem: 'money', targetCount: 50,
    rewardItem: 'voluntary_receipt', rewardCount: 1,
    extraRewards: [{ defId: 'filter_receipt', count: 1 }],
    relationDelta: 8, xpReward: 45, moneyReward: 6,
    eventTargetName: 'Наличные внесены через кассу банка Б-22.',
    eventTags: [...BANK_TAGS, 'deposit', 'cash_to_account', 'legal'],
    eventData: { bankingAction: 'cash_deposit', amount: 50, fee: 6 },
  },
]);

registerSideQuest('bank_credit_prokhor', CREDIT_DEF, [
  {
    id: 'bank_take_corridor_loan',
    giverNpcId: 'bank_credit_prokhor',
    type: QuestType.VISIT,
    desc: 'Прохор Кредитный: «Встаньте к кредитному окну. Банк выдаст сто двадцать рублей и оставит долг в журнале: вернуть придется больше.»',
    targetRoomName: BANK_ROOM_NAMES.credit,
    rewardItem: 'voluntary_receipt', rewardCount: 1,
    relationDelta: -2, xpReward: 30, moneyReward: 120,
    eventTargetName: 'В банке Б-22 открыт кредитный долг.',
    eventSeverity: 4,
    eventTags: [...BANK_TAGS, 'loan', 'credit', 'debt_opened'],
    eventData: { bankingAction: 'loan_taken', principal: 120, due: 140, visibleAs: 'repay_side_quest' },
  },
  {
    id: 'bank_repay_corridor_loan',
    giverNpcId: 'bank_credit_prokhor',
    type: QuestType.FETCH,
    desc: 'Прохор Кредитный: «Верните сто сорок рублей по кредитной строке Б-22. Проценты не любят героев, они любят календарь.»',
    targetItem: 'money', targetCount: 140,
    rewardItem: 'official_permit_slip', rewardCount: 1,
    relationDelta: 14, xpReward: 65, moneyReward: 0,
    requiresSideQuestDone: 'bank_take_corridor_loan',
    eventTargetName: 'Кредит банка Б-22 погашен наличными.',
    eventTags: [...BANK_TAGS, 'loan', 'repay', 'debt_closed'],
    eventData: { bankingAction: 'loan_repaid', amount: 140, principal: 120 },
  },
]);

registerSideQuest('bank_guard_semyon', GUARD_DEF, []);

registerSideQuest('bank_debtor_mitya', DEBTOR_DEF, [
  {
    id: 'bank_cash_forged_debt_paper',
    giverNpcId: 'bank_debtor_mitya',
    type: QuestType.FETCH,
    desc: 'Митя Просрочка: «Отдай мне липовую долговую бумагу. Я подсуну ее в хвост очереди, а ты получишь деньги раньше, чем касса проснется.»',
    targetItem: 'forged_bank_debt_paper', targetCount: 1,
    rewardItem: 'fake_pass', rewardCount: 1,
    extraRewards: [{ defId: 'cigs', count: 2 }],
    relationDelta: -6, xpReward: 35, moneyReward: 90,
    eventTargetName: 'Фальшивая долговая бумага обналичена через очередь должников Б-22.',
    eventSeverity: 5,
    eventPrivacy: 'witnessed',
    eventTags: [...BANK_TAGS, 'forgery', 'debt_paper', 'cash_out', 'risk'],
    eventData: { bankingAction: 'cash_forged_debt_paper', heat: 3, debtRiskOpened: true },
    abandonsSideQuestIds: ['bank_report_forged_debt_paper'],
  },
]);

export function createBankFloorState(): BankFloorState {
  return {
    routeId: BANK_FLOOR_ROUTE_ID,
    anchorZ: BANK_FLOOR_Z,
    baseFloor: BANK_FLOOR_BASE_FLOOR,
    legalRooms: [
      BANK_ROOM_NAMES.hall,
      BANK_ROOM_NAMES.teller,
      BANK_ROOM_NAMES.deposit,
      BANK_ROOM_NAMES.credit,
    ],
    riskRooms: [
      BANK_ROOM_NAMES.vault,
      BANK_ROOM_NAMES.queue,
      BANK_ROOM_NAMES.bypass,
    ],
    vaultContainerIds: [],
    depositContainerIds: [],
    debugEntry: {
      spawnX: 454.5,
      spawnY: 514.5,
      summary: 'bank_floor z=+26 spawn at west lift; cash desks, credit window, vault and debtor queue are connected.',
    },
  };
}

export function summarizeBankFloorState(bank: BankFloorState): string[] {
  return [
    `route=${bank.routeId} z=${bank.anchorZ} base=${FloorLevel[bank.baseFloor]}`,
    `legalRooms=${bank.legalRooms.length} riskRooms=${bank.riskRooms.length}`,
    `vaultContainers=${bank.vaultContainerIds.join(',') || 'none'}`,
    `depositContainers=${bank.depositContainerIds.join(',') || 'none'}`,
    bank.debugEntry.summary,
  ];
}

export function publishBankFloorEvent(
  state: GameState,
  kind: BankActionKind,
  targetName: string,
  roomId?: number,
  zoneId?: number,
): WorldEvent {
  return publishEvent(state, {
    type: 'rumor_observed',
    floor: BANK_FLOOR_BASE_FLOOR,
    roomId,
    zoneId,
    targetName,
    severity: kind === 'vault_theft' || kind === 'forgery' ? 5 : 3,
    privacy: kind === 'vault_theft' || kind === 'forgery' ? 'witnessed' : 'local',
    tags: [...BANK_TAGS, kind],
    data: { bankingAction: kind, routeId: BANK_FLOOR_ROUTE_ID },
  });
}

export function generateBankFloorDesignFloor(): BankFloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };
  const bankState = createBankFloorState();

  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.MARBLE;
    world.floorTex[i] = Tex.F_MARBLE_TILE;
  }

  const rooms = createBankRooms(world);
  dressBankRooms(world, rooms);
  placeBankLifts(world, rooms.liftLobby);
  generateBankZones(world);

  const directorId = spawnBankNpc(entities, nextId, 'bank_director_zinaida', DIRECTOR_DEF, rooms.deposit, 7, 7, Math.PI / 2);
  const cashierId = spawnBankNpc(entities, nextId, 'bank_cashier_lyuba', CASHIER_DEF, rooms.teller, 6, 9, Math.PI / 2);
  const creditId = spawnBankNpc(entities, nextId, 'bank_credit_prokhor', CREDIT_DEF, rooms.credit, 6, 8, Math.PI);
  const guardId = spawnBankNpc(entities, nextId, 'bank_guard_semyon', GUARD_DEF, rooms.vault, 5, 6, Math.PI);
  spawnBankNpc(entities, nextId, 'bank_debtor_mitya', DEBTOR_DEF, rooms.queue, 7, 5, 0);

  addBankContainers(world, bankState, rooms, directorId, cashierId, creditId, guardId);
  world.bakeLights();

  return {
    world,
    entities,
    spawnX: bankState.debugEntry.spawnX,
    spawnY: bankState.debugEntry.spawnY,
    bankState,
  };
}

export function expandBankFloorRouteGeometry(world: World, rng: () => number): void {
  carveRun(world, 220, 318, 804, 318, 4, Tex.F_MARBLE_TILE, Tex.MARBLE);
  carveRun(world, 220, 706, 804, 706, 4, Tex.F_MARBLE_TILE, Tex.MARBLE);
  carveRun(world, 220, 318, 220, 706, 4, Tex.F_MARBLE_TILE, Tex.MARBLE);
  carveRun(world, 804, 318, 804, 706, 4, Tex.F_MARBLE_TILE, Tex.MARBLE);
  carveRun(world, 512, 318, 512, 706, 5, Tex.F_GREEN_CARPET, Tex.MARBLE);
  carveRun(world, 220, 512, 804, 512, 5, Tex.F_GREEN_CARPET, Tex.MARBLE);

  const annexes = [
    stampBankRoom(world, RoomType.OFFICE, 250, 282, 38, 22, 'Северная бухгалтерия банка Б-22', Tex.MARBLE, Tex.F_PARQUET),
    stampBankRoom(world, RoomType.STORAGE, 736, 282, 38, 22, 'Архив просроченных вкладов Б-22', Tex.METAL, Tex.F_GREEN_CARPET),
    stampBankRoom(world, RoomType.OFFICE, 252, 718, 40, 22, 'Комната сверки вкладчиков Б-22', Tex.MARBLE, Tex.F_PARQUET),
    stampBankRoom(world, RoomType.HQ, 728, 718, 44, 24, 'Пост инкассации банка Б-22', Tex.METAL, Tex.F_CONCRETE),
    stampBankRoom(world, RoomType.STORAGE, 482, 280, 62, 20, 'Полка невыплаченных процентов Б-22', Tex.PANEL, Tex.F_GREEN_CARPET),
    stampBankRoom(world, RoomType.CORRIDOR, 482, 724, 62, 18, 'Нижний банковский обход Б-22', Tex.PANEL, Tex.F_LINO),
  ];
  for (const room of annexes) {
    openRoomToNearestCorridor(world, room);
    scatterRoomFurniture(world, room, rng);
  }

  for (let i = 0; i < 32; i++) {
    const x = 236 + Math.floor(rng() * 552);
    const y = rng() < 0.5 ? 318 + Math.floor(rng() * 390) : 500 + Math.floor(rng() * 28);
    const ci = world.idx(x, y);
    if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] < 0 && world.features[ci] === Feature.NONE) {
      world.features[ci] = rng() < 0.5 ? Feature.DESK : Feature.SHELF;
    }
  }
}

function createBankRooms(world: World): {
  liftLobby: Room;
  hall: Room;
  teller: Room;
  deposit: Room;
  credit: Room;
  queue: Room;
  vault: Room;
  bypass: Room;
} {
  const liftLobby = stampBankRoom(world, RoomType.CORRIDOR, 444, 504, 23, 20, BANK_ROOM_NAMES.liftLobby, Tex.LIFT_DOOR, Tex.F_CONCRETE);
  const hall = stampBankRoom(world, RoomType.COMMON, 468, 488, 92, 50, BANK_ROOM_NAMES.hall, Tex.MARBLE, Tex.F_MARBLE_TILE);
  const teller = stampBankRoom(world, RoomType.OFFICE, 480, 468, 28, 19, BANK_ROOM_NAMES.teller, Tex.MARBLE, Tex.F_GREEN_CARPET);
  const deposit = stampBankRoom(world, RoomType.OFFICE, 514, 468, 28, 19, BANK_ROOM_NAMES.deposit, Tex.MARBLE, Tex.F_GREEN_CARPET);
  const credit = stampBankRoom(world, RoomType.OFFICE, 561, 500, 23, 20, BANK_ROOM_NAMES.credit, Tex.MARBLE, Tex.F_PARQUET);
  const queue = stampBankRoom(world, RoomType.COMMON, 472, 539, 68, 17, BANK_ROOM_NAMES.queue, Tex.PANEL, Tex.F_LINO);
  const bypass = stampBankRoom(world, RoomType.CORRIDOR, 561, 522, 23, 36, BANK_ROOM_NAMES.bypass, Tex.PANEL, Tex.F_LINO);
  const vault = stampBankRoom(world, RoomType.STORAGE, 585, 497, 36, 36, BANK_ROOM_NAMES.vault, Tex.METAL, Tex.F_CONCRETE);

  placeBankDoor(world, liftLobby, hall, DoorState.CLOSED);
  placeBankDoor(world, hall, teller, DoorState.CLOSED);
  placeBankDoor(world, hall, deposit, DoorState.CLOSED);
  placeBankDoor(world, hall, credit, DoorState.CLOSED);
  placeBankDoor(world, hall, queue, DoorState.CLOSED);
  placeBankDoor(world, hall, bypass, DoorState.CLOSED);
  placeBankDoor(world, credit, vault, DoorState.CLOSED);
  placeBankDoor(world, bypass, vault, DoorState.CLOSED);
  placeBankDoor(world, bypass, queue, DoorState.CLOSED);

  return { liftLobby, hall, teller, deposit, credit, queue, vault, bypass };
}

function stampBankRoom(
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

function placeBankDoor(world: World, a: Room, b: Room, state: DoorState): number {
  const candidates: number[] = [];
  for (let dy = -1; dy <= a.h; dy++) {
    for (let dx = -1; dx <= a.w; dx++) {
      if (dx >= 0 && dx < a.w && dy >= 0 && dy < a.h) continue;
      const wx = world.wrap(a.x + dx);
      const wy = world.wrap(a.y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.WALL) continue;
      let facesA = false;
      let facesB = false;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const ni = world.idx(wx + ox, wy + oy);
        if (world.roomMap[ni] === a.id) facesA = true;
        if (world.roomMap[ni] === b.id) facesB = true;
      }
      if (facesA && facesB) candidates.push(ci);
    }
  }
  const ci = candidates[(candidates.length / 2) | 0];
  if (ci === undefined) return -1;
  world.cells[ci] = Cell.DOOR;
  world.doors.set(ci, { idx: ci, state, roomA: a.id, roomB: b.id, keyId: '', timer: 0 });
  a.doors.push(ci);
  b.doors.push(ci);
  return ci;
}

function dressBankRooms(
  world: World,
  rooms: ReturnType<typeof createBankRooms>,
): void {
  for (let x = rooms.hall.x + 8; x < rooms.hall.x + rooms.hall.w - 8; x += 10) {
    setFeature(world, x, rooms.hall.y + 9, Feature.CHAIR);
    setFeature(world, x, rooms.hall.y + 38, Feature.CHAIR);
  }
  for (let x = rooms.teller.x + 3; x < rooms.teller.x + rooms.teller.w - 2; x += 5) {
    setFeature(world, x, rooms.teller.y + rooms.teller.h - 3, Feature.DESK);
  }
  for (let x = rooms.deposit.x + 3; x < rooms.deposit.x + rooms.deposit.w - 2; x += 5) {
    setFeature(world, x, rooms.deposit.y + 3, Feature.SHELF);
    setFeature(world, x, rooms.deposit.y + rooms.deposit.h - 4, Feature.DESK);
  }
  setFeature(world, rooms.credit.x + 5, rooms.credit.y + 5, Feature.DESK);
  setFeature(world, rooms.credit.x + rooms.credit.w - 4, rooms.credit.y + 4, Feature.SHELF);
  setFeature(world, rooms.credit.x + 8, rooms.credit.y + rooms.credit.h - 4, Feature.LAMP);

  for (let x = rooms.queue.x + 5; x < rooms.queue.x + rooms.queue.w - 5; x += 8) {
    setFeature(world, x, rooms.queue.y + 5, Feature.CHAIR);
    setFeature(world, x, rooms.queue.y + 10, Feature.CHAIR);
  }
  for (let y = rooms.vault.y + 4; y < rooms.vault.y + rooms.vault.h - 3; y += 5) {
    setFeature(world, rooms.vault.x + 4, y, Feature.SHELF);
    setFeature(world, rooms.vault.x + 11, y, Feature.SHELF);
    setFeature(world, rooms.vault.x + rooms.vault.w - 5, y, Feature.SHELF);
  }
  for (let y = rooms.bypass.y + 4; y < rooms.bypass.y + rooms.bypass.h - 3; y += 7) {
    setFeature(world, rooms.bypass.x + 4, y, Feature.SCREEN);
    setFeature(world, rooms.bypass.x + rooms.bypass.w - 5, y, Feature.LAMP);
  }
  for (const room of Object.values(rooms)) {
    setFeature(world, room.x + room.w - 3, room.y + 2, Feature.LAMP);
  }
}

function placeBankLifts(world: World, lobby: Room): void {
  placeLift(world, lobby.x + 3, lobby.y + 9, lobby.x + 6, lobby.y + 9, LiftDirection.UP);
  placeLift(world, lobby.x + lobby.w - 4, lobby.y + 9, lobby.x + lobby.w - 7, lobby.y + 9, LiftDirection.DOWN);
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

function generateBankZones(world: World): void {
  const zoneSize = W / 8;
  world.zones = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const id = y * 8 + x;
      const faction = x >= 4 && y >= 3 && y <= 4 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
      world.zones.push({
        id,
        cx: Math.floor(x * zoneSize + zoneSize / 2),
        cy: Math.floor(y * zoneSize + zoneSize / 2),
        faction,
        hasLift: false,
        fogged: false,
        level: faction === ZoneFaction.LIQUIDATOR ? 3 : 2,
        hqRoomId: -1,
      });
    }
  }
  for (let y = 0; y < W; y++) {
    const zy = Math.min(7, Math.floor(y / zoneSize));
    for (let x = 0; x < W; x++) {
      const zx = Math.min(7, Math.floor(x / zoneSize));
      const zoneId = zy * 8 + zx;
      world.zoneMap[y * W + x] = zoneId;
      world.factionControl[y * W + x] = world.zones[zoneId]?.faction ?? ZoneFaction.CITIZEN;
    }
  }
  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] === Cell.LIFT) world.zones[world.zoneMap[i]].hasLift = true;
  }
}

function spawnBankNpc(
  entities: Entity[],
  nextId: { v: number },
  npcId: string,
  def: PlotNpcDef,
  room: Room,
  dx: number,
  dy: number,
  angle: number,
): number {
  const id = nextId.v++;
  entities.push({
    id,
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
    ai: { goal: AIGoal.IDLE, tx: room.x + dx, ty: room.y + dy, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    money: def.money,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: npcId !== 'bank_guard_semyon',
    questId: -1,
    weapon: def.inventory.some(i => i.defId === 'makarov') ? 'makarov' : undefined,
  });
  return id;
}

function addBankContainers(
  world: World,
  bankState: BankFloorState,
  rooms: ReturnType<typeof createBankRooms>,
  directorId: number,
  cashierId: number,
  creditId: number,
  guardId: number,
): void {
  const cashbox = addBankContainer(world, rooms.teller, rooms.teller.x + rooms.teller.w - 4, rooms.teller.y + 5, {
    kind: ContainerKind.CASHBOX,
    name: 'Кассовый ящик Любы Б-22',
    access: 'owner',
    ownerNpcId: cashierId,
    ownerName: CASHIER_DEF.name,
    faction: Faction.CITIZEN,
    inventory: [
      { defId: 'voluntary_receipt', count: 2 },
      { defId: 'filter_receipt', count: 2 },
      { defId: 'water_coupon', count: 1 },
    ],
    tags: ['cashbox', 'deposit', 'teller', 'legal_window'],
  });
  bankState.depositContainerIds.push(cashbox.id);

  const depositBox = addBankContainer(world, rooms.deposit, rooms.deposit.x + rooms.deposit.w - 5, rooms.deposit.y + 8, {
    kind: ContainerKind.FILING_CABINET,
    name: 'Депозитная картотека Б-22',
    access: 'room',
    ownerNpcId: directorId,
    ownerName: DIRECTOR_DEF.name,
    faction: Faction.CITIZEN,
    inventory: [
      { defId: 'official_permit_slip', count: 1 },
      { defId: 'ration_registry_extract', count: 1 },
      { defId: 'debt_settlement_receipt', count: 1 },
    ],
    tags: ['deposit', 'account', 'paper_in', 'banking_drop'],
  });
  bankState.depositContainerIds.push(depositBox.id);

  addBankContainer(world, rooms.credit, rooms.credit.x + rooms.credit.w - 4, rooms.credit.y + rooms.credit.h - 4, {
    kind: ContainerKind.FILING_CABINET,
    name: 'Кредитная папка Прохора Б-22',
    access: 'owner',
    ownerNpcId: creditId,
    ownerName: CREDIT_DEF.name,
    faction: Faction.CITIZEN,
    inventory: [
      { defId: 'voluntary_receipt', count: 1 },
      { defId: 'bank_debt_paper', count: 1 },
      { defId: 'forged_stamp_sheet', count: 1 },
      { defId: 'ink_bottle', count: 1 },
    ],
    tags: ['credit', 'loan', 'debt', 'paper'],
  });

  const vaultA = addBankContainer(world, rooms.vault, rooms.vault.x + 18, rooms.vault.y + 8, {
    kind: ContainerKind.SAFE,
    name: 'Сейф вкладов Б-22',
    access: 'owner',
    ownerNpcId: guardId,
    ownerName: GUARD_DEF.name,
    faction: Faction.LIQUIDATOR,
    inventory: [
      { defId: 'official_permit_slip', count: 2 },
      { defId: 'weapon_permit_signed', count: 1 },
      { defId: 'confiscation_warrant', count: 1 },
      { defId: 'ammo_9mm', count: 18 },
    ],
    tags: ['vault', 'safe', 'cashbox', 'theft_risk', 'liquidator_audit'],
    lockDifficulty: 5,
  });
  const vaultB = addBankContainer(world, rooms.vault, rooms.vault.x + 27, rooms.vault.y + 25, {
    kind: ContainerKind.CASHBOX,
    name: 'Наличная касса хранилища Б-22',
    access: 'owner',
    ownerNpcId: guardId,
    ownerName: GUARD_DEF.name,
    faction: Faction.LIQUIDATOR,
    inventory: [
      { defId: 'voluntary_receipt', count: 3 },
      { defId: 'elevator_access_order', count: 1 },
      { defId: 'debt_settlement_receipt', count: 1 },
      { defId: 'fake_pass', count: 1 },
    ],
    tags: ['vault', 'cashbox', 'theft_risk', 'debt_paper', 'liquidator_audit'],
    lockDifficulty: 4,
  });
  bankState.vaultContainerIds.push(vaultA.id, vaultB.id);

  addBankContainer(world, rooms.queue, rooms.queue.x + rooms.queue.w - 5, rooms.queue.y + 7, {
    kind: ContainerKind.CASHBOX,
    name: 'Короб должников Б-22',
    access: 'public',
    ownerNpcId: undefined,
    ownerName: undefined,
    faction: Faction.CITIZEN,
    inventory: [
      { defId: 'forged_bank_debt_paper', count: 1 },
      { defId: 'bank_debt_paper', count: 1 },
      { defId: 'forged_stamp_sheet', count: 1 },
      { defId: 'blank_form', count: 2 },
      { defId: 'cigs', count: 1 },
    ],
    tags: ['debt', 'forgery', 'paper', 'risk_path'],
  });
}

function addBankContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  opts: {
    kind: ContainerKind;
    name: string;
    access: WorldContainer['access'];
    ownerNpcId?: number;
    ownerName?: string;
    faction?: Faction;
    inventory: Item[];
    tags: string[];
    lockDifficulty?: number;
  },
): WorldContainer {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x,
    y,
    floor: BANK_FLOOR_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind: opts.kind,
    name: opts.name,
    inventory: opts.inventory.map(i => ({ ...i })),
    capacitySlots: Math.max(8, opts.inventory.length + 5),
    ownerNpcId: opts.ownerNpcId,
    ownerName: opts.ownerName,
    faction: opts.faction,
    access: opts.access,
    lockDifficulty: opts.lockDifficulty,
    discovered: true,
    tags: [...BANK_TAGS, ...opts.tags],
  };
  world.addContainer(container);
  setFeature(world, x, y, opts.kind === ContainerKind.CASHBOX ? Feature.DESK : Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
}

function carveRun(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  const half = width >> 1;
  if (ay === by) {
    const minX = Math.min(ax, bx);
    carveRect(world, minX, ay - half, Math.abs(bx - ax) + 1, width, floorTex, wallTex);
    return;
  }
  const minY = Math.min(ay, by);
  carveRect(world, ax - half, minY, width, Math.abs(by - ay) + 1, floorTex, wallTex);
}

function carveRect(world: World, x: number, y: number, w: number, h: number, floorTex: Tex, wallTex: Tex): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) {
        if (world.cells[ci] !== Cell.LIFT && world.cells[ci] !== Cell.DOOR) {
          world.cells[ci] = Cell.FLOOR;
          world.roomMap[ci] = -1;
          world.floorTex[ci] = floorTex;
        }
      } else if (world.cells[ci] === Cell.WALL) {
        world.wallTex[ci] = wallTex;
      }
    }
  }
}

function openRoomToNearestCorridor(world: World, room: Room): void {
  const cx = room.x + Math.floor(room.w / 2);
  const cy = room.y + Math.floor(room.h / 2);
  const probes: [number, number, number, number][] = [
    [cx, room.y - 1, 0, -1],
    [cx, room.y + room.h, 0, 1],
    [room.x - 1, cy, -1, 0],
    [room.x + room.w, cy, 1, 0],
  ];
  let best: { sx: number; sy: number; path: number[] } | null = null;
  for (const [sx, sy, dx, dy] of probes) {
    const path: number[] = [];
    let x = sx;
    let y = sy;
    for (let i = 0; i < 80; i++) {
      const ci = world.idx(x, y);
      if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] < 0) {
        if (!best || path.length < best.path.length) best = { sx, sy, path: [...path] };
        break;
      }
      path.push(ci);
      x += dx;
      y += dy;
    }
  }
  if (!best) return;
  const doorIdx = world.idx(best.sx, best.sy);
  world.cells[doorIdx] = Cell.DOOR;
  world.doors.set(doorIdx, { idx: doorIdx, state: DoorState.CLOSED, roomA: room.id, roomB: -1, keyId: '', timer: 0 });
  room.doors.push(doorIdx);
  for (const ci of best.path) {
    if (ci === doorIdx) continue;
    if (world.cells[ci] !== Cell.LIFT) {
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = -1;
      world.floorTex[ci] = Tex.F_MARBLE_TILE;
    }
  }
}

function scatterRoomFurniture(world: World, room: Room, rng: () => number): void {
  for (let i = 0; i < 8; i++) {
    const x = room.x + 2 + Math.floor(rng() * Math.max(1, room.w - 4));
    const y = room.y + 2 + Math.floor(rng() * Math.max(1, room.h - 4));
    if (world.features[world.idx(x, y)] === Feature.NONE) {
      setFeature(world, x, y, i % 3 === 0 ? Feature.DESK : i % 3 === 1 ? Feature.SHELF : Feature.CHAIR);
    }
  }
}

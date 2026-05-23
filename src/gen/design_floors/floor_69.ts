/* -- Design floor 69: adult vice, debt, blackmail and refuge ---- */

import {
  AIGoal, Cell, ContainerKind, DoorState, EntityType, Faction, Feature,
  FloorLevel, LiftDirection, Occupation, QuestType, RoomType, Tex, W, ZoneFaction,
  type ContainerAccess, type Entity, type Room, type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { Spr } from '../../render/sprite_index';
import { registerRouteCue } from '../../systems/route_cues';
import { calcZoneLevel } from '../../systems/rpg';
import {
  carveCorridor,
  ensureConnectivity,
  generateZones,
  placeDoor,
  protectRoom,
  sanitizeDoors,
  stampRoom,
} from '../shared';
import { genLog } from '../log';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'floor_69' as const;
export const DESIGN_FLOOR_Z = -4;
export const FLOOR_69_DEFAULT_SEED = 690004;

// Current core state still requires a FloorLevel. Future route integration should
// adapt this string-route floor instead of adding a casual enum here.
const FLOOR_69_BASE_FLOOR = FloorLevel.MAINTENANCE;
const FLOOR_69_MAX_FLAGS = 8;
const FLOOR_69_FULL_POP_CAP = 180;
const FLOOR_69_CHECKPOINT_CROWD_CAP = 12;

const FLOOR_69_NAMES_F = [
  'Алина Сцена', 'Вера Красная', 'Дина Бархат', 'Лада Лента', 'Мира Пайетка',
  'Ника Кулиса', 'Рита Свет', 'Соня Тихая', 'Тая Занавес', 'Эля Ночной Чай',
];
const FLOOR_69_NAMES_M = [
  'Гена Сторож', 'Денис Гость', 'Жора Бармен', 'Клим Курьер', 'Левон Световой',
  'Марк Счетчик', 'Паша Дверной', 'Рома Патруль', 'Савва Чистый', 'Федя Номерной',
];

const IRA_WORKER_LINES = [
  'Милый, смотреть можно на ценник. На дверь тоже смотри: рейд ходит тише клиентов.',
  'Я взрослая и работаю здесь по своим правилам. Первое правило: не при всех и не бесплатно.',
  'Долг тут липнет хуже слизи. Слизь хоть видно.',
  'Запись не продавай первому чиновнику. Второй даст больше и меньше вопросов.',
  'Если сирена начнется, комнату закрою. Бесплатно я только воздухом делюсь, и то не всегда.',
  'Мне не спасатель нужен. Мне нужен человек, который умеет молчать у нужной двери.',
  'Охрана улыбается, когда считает чужие деньги. Когда считает чужие имена, уже поздно.',
  'Клиника за стеной не добрая, зато там моют руки до журнала.',
  'Не говори за меня с Розой. Скажешь лишнее - долг перепишут на мой голос.',
  'Клиент уходит, расписка остается. Вот почему я запоминаю двери, а не лица.',
  'У нас границы простые: дверь, цена, слово нет. Кто не понял, разговаривает с Веней.',
  'Рейд любит шумных героев. Тихие люди уходят через служебный ход.',
  'Черная запись в сейфе не про любовь. Она про власть, которая боится свидетелей.',
  'Наличные кончаются. Бумаги нет. Поэтому долг тут живучее человека.',
  'Если принесешь антибиотик Симе, половина этажа перестанет кашлять на чужие секреты.',
  'Я не прошу жалости. Жалость быстро дешевеет, а ключ держит цену.',
  'Хочешь помочь - найди список рейда раньше рейда.',
  'Хочешь заработать - не делай вид, что это доброта.',
  'Хочешь выйти чистым - не бери бумагу, которую не готов прочесть вслух.',
  'У этой комнаты есть замок. У меня есть память. Оба работают лучше угроз.',
  'Если должника прячут, дверь закрывают изнутри. Если продают, снаружи.',
  'Сима спросит пульс, Роза спросит срок, Нил спросит подпись. Я спрошу, кто тебя видел.',
  'Не трогай жалобу под сургучом без плана. Сургуч иногда держит не бумагу, а человека.',
  'Когда самосбор за стеной, самая дорогая вещь - не койка. Самая дорогая вещь - не быть в списке.',
];

const IRA_WORKER_POST_LINES = [
  'Тихая комната открыта. Это не конец долга, но уже не клетка.',
  'Бумага сгорела. Пахнет лучше, чем страх.',
  'Сима держит дверь. Значит, есть еще место, где не торгуют человеком.',
  'Сегодня я знаю, кто молчал правильно. Это дороже охраны.',
  'Если спросит Роза, я работаю. Если спросит рейд, меня здесь не было.',
  'Не путай благодарность с приглашением. Граница осталась, просто дверь стала нашей.',
];

export interface Floor69State {
  heat: number;
  trust: number;
  raidUntilHour: number;
  debtFlags: string[];
  blackmailFlags: string[];
}

export interface Floor69Generation extends FloorGeneration {
  routeId: typeof DESIGN_FLOOR_ID;
  z: typeof DESIGN_FLOOR_Z;
  seed: number;
  state: Floor69State;
  debugLines: string[];
}

function bounded(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function createFloor69State(state: Partial<Floor69State> = {}): Floor69State {
  return {
    heat: bounded(state.heat ?? 34, 0, 100),
    trust: bounded(state.trust ?? 0, -5, 5),
    raidUntilHour: Math.max(-1, state.raidUntilHour ?? -1),
    debtFlags: (state.debtFlags ?? ['f69_roza_ledger_live', 'f69_market_88_debt_link'])
      .slice(0, FLOOR_69_MAX_FLAGS),
    blackmailFlags: (state.blackmailFlags ?? ['f69_official_denunciation_live'])
      .slice(0, FLOOR_69_MAX_FLAGS),
  };
}

export function floor69DebugLines(state: Floor69State, seed = FLOOR_69_DEFAULT_SEED): string[] {
  const s = createFloor69State(state);
  return [
    `route=${DESIGN_FLOOR_ID} z=${DESIGN_FLOOR_Z} seed=${seed}`,
    `heat=${s.heat}/100 trust=${s.trust}/5 raidUntilHour=${s.raidUntilHour}`,
    `debt=${s.debtFlags.join(',') || 'none'}`,
    `blackmail=${s.blackmailFlags.join(',') || 'none'}`,
    'debugEntry=generateFloor69DesignFloor(seed)',
  ];
}

/*
 * Adult-only constraint: Floor 69 is an optional 18+ route floor about adult
 * vice, social crime and harm reduction. It is not mandatory progression
 * content and should not be sanitized into generic residential material.
 * Do not add minors, child sprites, graphic sex text, or explicit mechanics here.
 */
const NPC_DEFS: Record<string, PlotNpcDef> = {
  f69_madam_roza: {
    name: 'Роза Красная',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.DIRECTOR,
    sprite: Spr.F69_FEMALE_NPC_0,
    hp: 160, maxHp: 160, money: 340, speed: 0.75,
    inventory: [
      { defId: 'fake_pass', count: 1 },
      { defId: 'voluntary_receipt', count: 2 },
      { defId: 'cigs', count: 4 },
    ],
    talkLines: [
      'Этаж держится на взрослых сделках и закрытых дверях. Кто путает тишину с правом, быстро знакомится с долгом.',
      'Рейд приходит не за правдой. Он приходит за списком, который можно продать дважды.',
      'Если нашел чужой компромат, реши сразу: прятать, сдавать или считать прибыль.',
      'Комната стоит тихо, пока у нее есть ключ, строка и человек, который платит процент вовремя.',
      'Охрана не спасает. Охрана решает, кого не трогать первым.',
    ],
    talkLinesPost: [
      'Долги любят порядок. Люди порядок любят меньше.',
      'Тихая комната стоит дороже, когда сирена уже близко.',
      'Книга сегодня легче. Это не милость, это кто-то успел погасить строку.',
    ],
  },

  f69_guard_venya: {
    name: 'Веня Шлагбаум',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 240, maxHp: 240, money: 55, speed: 0.9,
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 12 },
      { defId: 'emergency_roster', count: 1 },
    ],
    talkLines: [
      'Пост простой: оружие видно, бумаги на стол, чужие двери не трогать.',
      'Я не добрый и не инспектор. Я считаю, кто успеет в тихие комнаты до рейда.',
      'Список рейда стоит дороже патрона, потому что стреляет до выстрела.',
      'Тарелка расписок у входа решает быстро: платишь бумагой, идешь через пост; крадешь ключ - идешь через глаза.',
      'В книге ты легче, чем в коридоре. В коридоре спорят, в книге платят.',
      'Ключ дам. Дверь потом сама спросит, кто тебя пустил.',
      'Рейд любит шумных. Тихие платят заранее.',
      'Черный вход не тайна. Тайна - кто записал тебя вошедшим.',
    ],
    talkLinesPost: [
      'Сегодня проход мягче. Не путай это с доверием.',
      'Если список пропал, значит кто-то уже выбрал сторону.',
      'Не вовремя здесь значит дороже. Больше в этой фразе угрозы нет.',
      'Свидетеля не прячут бесплатно. Бесплатно его потом находят другие.',
    ],
  },

  f69_performer_ira: {
    name: 'Ира Сцена',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.TRAVELER,
    sprite: Spr.F69_FEMALE_NPC_3,
    hp: 90, maxHp: 90, money: 28, speed: 1.0,
    inventory: [
      { defId: 'sealed_complaint', count: 1 },
      { defId: 'tea', count: 1 },
    ],
    talkLines: [...IRA_WORKER_LINES],
    talkLinesPost: [...IRA_WORKER_POST_LINES],
  },

  f69_doctor_sima: {
    name: 'Доктор Сима',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.DOCTOR,
    sprite: Occupation.DOCTOR,
    hp: 130, maxHp: 130, money: 85, speed: 0.8,
    inventory: [
      { defId: 'bandage', count: 4 },
      { defId: 'pills', count: 2 },
      { defId: 'clean_health_cert', count: 1 },
    ],
    talkLines: [
      'Клиника не спрашивает профессию. Клиника спрашивает пульс, воду и чем перевязать.',
      'Антибиотик закончился быстрее морали. Фильтры тоже уходят в долг.',
      'Кто прячется от рейда, сначала дышит. Потом уже объясняет.',
    ],
    talkLinesPost: [
      'Запасы пополнили. Теперь можно лечить, а не только выбирать очередь.',
      'Тихая комната открыта для взрослых, которым нужен врач, а не протокол.',
    ],
    talkQuestResponse: 'Передай Ире: тихая комната готова. Вход через служебный ход, без лишних имен.',
  },

  f69_accountant_nil: {
    name: 'Нил Расписочный',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.STOREKEEPER,
    sprite: Occupation.STOREKEEPER,
    hp: 105, maxHp: 105, money: 210, speed: 0.7,
    inventory: [
      { defId: 'blank_form', count: 2 },
      { defId: 'ink_bottle', count: 1 },
      { defId: 'official_permit_slip', count: 1 },
    ],
    talkLines: [
      'Долг без подписи - просьба. Долг с подписью - маршрут.',
      'Рынок 88 покупает не людей, а сроки. Это звучит приличнее только в книге учета.',
      'Черная строка в журнале лечится тремя способами: оплатить, подделать, сжечь.',
      'Процент не злой. Он просто просыпается раньше должника.',
      'Строку можно сжечь. Долг дымом не считается, но люди верят, пока темно.',
      'Расписку выкупают рублем, подделывают бланком, крадут ключом или продают тем, кто любит рейды.',
    ],
    talkLinesPost: [
      'Строка закрыта. Человек пока нет.',
      'Чем меньше листов в сейфе, тем тише этот этаж.',
      'В книге учета благодарность не пишут. Там видны только пустые клетки и сроки.',
    ],
  },
};

function floor69EventTags(...tags: string[]): string[] {
  return ['floor_69', 'route_risk', 'route_reward', 'adult_only', ...tags];
}

function floor69RouteEventData(choice: string, risk: string, reward: string): Record<string, unknown> {
  return { routeId: DESIGN_FLOOR_ID, z: DESIGN_FLOOR_Z, choice, risk, reward };
}

registerSideQuest('f69_madam_roza', NPC_DEFS.f69_madam_roza, [
  {
    id: 'f69_blackmail_profit',
    giverNpcId: 'f69_madam_roza',
    type: QuestType.FETCH,
    desc: 'Роза: «В сейфе лежит донос на чиновника. Принесешь мне - риск поста станет твоей премией, а не чужим поводком.»',
    targetItem: 'denunciation', targetCount: 1,
    rewardItem: 'fake_pass', rewardCount: 1,
    extraRewards: [{ defId: 'cigs', count: 3 }],
    relationDelta: -3, xpReward: 65, moneyReward: 190,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.OFFICE,
    targetZoneTag: 'blackmail',
    targetHint: 'Этаж 69: сейф компромата за постом. Риск: охрана и рейдовая строка. Награда: фальшивый пропуск, деньги или рычаг защиты.',
    eventTargetName: 'Донос из сейфа компромата 69',
    eventSeverity: 4,
    eventPrivacy: 'local',
    eventTags: floor69EventTags('blackmail', 'profit', 'evidence'),
    eventData: floor69RouteEventData('profit_blackmail', 'locked safe and guard checkpoint', 'fake pass, cash and leverage'),
  },
]);

registerSideQuest('f69_guard_venya', NPC_DEFS.f69_guard_venya, [
  {
    id: 'f69_raid_choice',
    giverNpcId: 'f69_guard_venya',
    type: QuestType.FETCH,
    desc: 'Веня: «В посту лежит список рейда. Заберешь его - предупредим тихие комнаты. Продашь или сдашь инспекторам - это уже твой риск и твоя награда.»',
    targetItem: 'emergency_roster', targetCount: 1,
    rewardItem: 'key', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 10 }],
    relationDelta: 8, xpReward: 60, moneyReward: 55,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.HQ,
    targetZoneTag: 'raid',
    targetHint: 'Этаж 69: ящик поста досмотра. Риск: ликвидаторы узнают, кто держал список. Награда: ключ и время для тихих комнат.',
    eventTargetName: 'Список рейда 69',
    eventSeverity: 4,
    eventPrivacy: 'local',
    eventTags: floor69EventTags('raid', 'security', 'refuge'),
    eventData: floor69RouteEventData('warn_or_sell_roster', 'liquidator audit and checkpoint violence', 'key, ammo and refuge warning'),
  },
  {
    id: 'f69_guard_key_deposit',
    giverNpcId: 'f69_guard_venya',
    type: QuestType.FETCH,
    desc: 'Веня: «Нужен ключ из тарелки расписок. Вернешь на пост - черный вход откроется по делу, но долг запомнит руку.»',
    targetItem: 'key', targetCount: 1,
    rewardItem: 'ammo_9mm', rewardCount: 8,
    extraRewards: [{ defId: 'water_coupon', count: 1 }],
    relationDelta: 6, xpReward: 45, moneyReward: 45,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.HQ,
    targetZoneTag: 'toll',
    targetHint: 'Этаж 69: тарелка входных расписок у поста. Риск: кража у очереди. Награда: черный вход, патроны и водный талон.',
    eventTargetName: 'Ключ из тарелки расписок 69',
    eventSeverity: 3,
    eventPrivacy: 'local',
    eventTags: floor69EventTags('checkpoint', 'debt', 'access'),
    eventData: floor69RouteEventData('checkpoint_key', 'theft witness and checkpoint debt', 'service route access and supplies'),
  },
]);

registerSideQuest('f69_performer_ira', NPC_DEFS.f69_performer_ira, [
  {
    id: 'f69_blackmail_protect',
    giverNpcId: 'f69_performer_ira',
    type: QuestType.FETCH,
    desc: 'Ира: «Найди донос из сейфа и отдай мне. Риск - охрана и чиновник. Награда - одна дверь перестанет держать человека строкой.»',
    targetItem: 'denunciation', targetCount: 1,
    rewardItem: 'clean_health_cert', rewardCount: 1,
    extraRewards: [{ defId: 'bandage', count: 2 }],
    relationDelta: 16, xpReward: 75, moneyReward: 35,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.OFFICE,
    targetZoneTag: 'blackmail',
    targetHint: 'Этаж 69: сейф компромата в долговой конторе. Риск: охрана и чиновничий хвост. Награда: доверие Иры, справка и меньше власти у сейфа.',
    eventTargetName: 'Донос передан Ире',
    eventSeverity: 4,
    eventPrivacy: 'secret',
    eventTags: floor69EventTags('blackmail', 'protect', 'evidence'),
    eventData: floor69RouteEventData('protect_worker_from_blackmail', 'guard checkpoint and official retaliation', 'trust, clean health certificate and safer door'),
  },
  {
    id: 'f69_hide_worker',
    giverNpcId: 'f69_performer_ira',
    type: QuestType.TALK,
    desc: 'Ира: «Договорись с доктором Симой о тихой комнате. Риск - рейдовый список. Награда - безопасный вход через служебный ход.»',
    targetPlotNpcId: 'f69_doctor_sima',
    rewardItem: 'pills', rewardCount: 1,
    extraRewards: [{ defId: 'water', count: 1 }],
    relationDelta: 12, xpReward: 50, moneyReward: 40,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.MEDICAL,
    targetZoneTag: 'clinic',
    targetHint: 'Этаж 69: клиника Сима и тихая комната рядом. Риск: рейд придет по списку. Награда: убежище, таблетки и доверие.',
    eventTargetName: 'Тихая комната для Иры',
    eventSeverity: 4,
    eventPrivacy: 'secret',
    eventTags: floor69EventTags('refuge', 'protect', 'clinic'),
    eventData: floor69RouteEventData('secure_refuge_route', 'raid roster and witness exposure', 'clinic refuge and service access'),
  },
]);

registerSideQuest('f69_doctor_sima', NPC_DEFS.f69_doctor_sima, [
  {
    id: 'f69_clinic_supply',
    giverNpcId: 'f69_doctor_sima',
    type: QuestType.FETCH,
    desc: 'Доктор Сима: «Нужен антибиотик. Не спрашиваю, купишь, выкрадешь или выменяешь. Риск - дефицит, награда - дверь, где сначала лечат.»',
    targetItem: 'antibiotic', targetCount: 1,
    rewardItem: 'sanitary_kit', rewardCount: 1,
    extraRewards: [{ defId: 'gasmask_filter', count: 1 }],
    relationDelta: 14, xpReward: 70, moneyReward: 45,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.MEDICAL,
    targetZoneTag: 'clinic',
    targetHint: 'Этаж 69: тихая клиника Симы. Риск: лекарство считают долгом. Награда: санитарный набор, фильтр и медицинское доверие.',
    eventTargetName: 'Запас тихой клиники 69',
    eventSeverity: 3,
    eventPrivacy: 'local',
    eventTags: floor69EventTags('clinic', 'medicine', 'harm_reduction'),
    eventData: floor69RouteEventData('supply_clinic', 'medicine scarcity and debt pressure', 'sanitary kit, filter and clinic trust'),
  },
]);

registerSideQuest('f69_accountant_nil', NPC_DEFS.f69_accountant_nil, [
  {
    id: 'f69_debt_ledger',
    giverNpcId: 'f69_accountant_nil',
    type: QuestType.FETCH,
    desc: 'Нил: «Две добровольные расписки из долговой картотеки. Риск - книга заметит пустую клетку. Награда - строку можно оплатить, переписать или потерять.»',
    targetItem: 'voluntary_receipt', targetCount: 2,
    rewardItem: 'official_permit_slip', rewardCount: 1,
    extraRewards: [{ defId: 'blank_form', count: 1 }],
    relationDelta: 6, xpReward: 65, moneyReward: 80,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.OFFICE,
    targetZoneTag: 'ledger',
    targetHint: 'Этаж 69: картотека долгов. Риск: пустая строка зовет охрану. Награда: официальный корешок, бланк и снятый поводок.',
    eventTargetName: 'Расписки из картотеки 69',
    eventSeverity: 4,
    eventPrivacy: 'local',
    eventTags: floor69EventTags('debt', 'ledger', 'documents'),
    eventData: floor69RouteEventData('clear_or_forge_debt_line', 'locked ledger and witness debt', 'permit slip, blank form and cleared line'),
  },
  {
    id: 'f69_debt_forgery_kit',
    giverNpcId: 'f69_accountant_nil',
    type: QuestType.FETCH,
    desc: 'Нил: «Принеси пустой бланк и чернила. Риск - подделка держится до первой проверки. Награда - одна строка станет похожей на погашенную.»',
    targetItem: 'blank_form', targetCount: 1,
    rewardItem: 'voluntary_receipt', rewardCount: 1,
    extraRewards: [{ defId: 'fake_pass', count: 1 }],
    relationDelta: 3, xpReward: 55, moneyReward: 70,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.OFFICE,
    targetZoneTag: 'ledger',
    targetHint: 'Этаж 69: картотека и стол Нила. Риск: проверка бумаги у поста. Награда: расписка, фальшивый пропуск и проход через долг.',
    eventTargetName: 'Поддельная строка долга 69',
    eventSeverity: 3,
    eventPrivacy: 'secret',
    eventTags: floor69EventTags('debt', 'forgery', 'access'),
    eventData: floor69RouteEventData('forge_debt_line', 'paper audit and checkpoint suspicion', 'receipt, fake pass and debt access'),
  },
  {
    id: 'f69_blackmail_expose',
    giverNpcId: 'f69_accountant_nil',
    type: QuestType.FETCH,
    desc: 'Нил: «Принеси акт о пропавшей записи. Риск - наверху спросят свидетеля. Награда - компромат перестанет быть товаром.»',
    targetItem: 'record_exposure_notice', targetCount: 1,
    rewardItem: 'blank_form', rewardCount: 2,
    extraRewards: [{ defId: 'ink_bottle', count: 1 }],
    relationDelta: 4, xpReward: 70, moneyReward: 60,
    targetFloor: FLOOR_69_BASE_FLOOR,
    targetRoomType: RoomType.OFFICE,
    targetZoneTag: 'evidence',
    targetHint: 'Этаж 69: сейф компромата. Риск: акт потянет свидетелей наверх. Награда: бланки, чернила и меньше шантажа у охраны.',
    eventTargetName: 'Акт о пропавшей записи 69',
    eventSeverity: 4,
    eventPrivacy: 'local',
    eventTags: floor69EventTags('blackmail', 'expose', 'documents'),
    eventData: floor69RouteEventData('expose_blackmail_record', 'official witness audit', 'blank forms, ink and weaker blackmail'),
  },
]);

interface Floor69Rooms {
  publicLift: Room;
  publicCorridor: Room;
  checkpoint: Room;
  hall: Room;
  clinic: Room;
  debtOffice: Room;
  refuge: Room;
  ledger: Room;
  staffRoute: Room;
  staffLift: Room;
}

function applyRoomTextures(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
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
      world.floorTex[world.idx(room.x + dx, room.y + dy)] = floorTex;
    }
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
  protectedRoom = false,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  applyRoomTextures(world, room, wallTex, floorTex);
  if (protectedRoom) protectRoom(world, room.x, room.y, room.w, room.h, wallTex, floorTex);
  return room;
}

function connect(
  world: World,
  a: Room,
  b: Room,
  keyId = '',
  state: DoorState = DoorState.CLOSED,
): void {
  const before = new Set(a.doors);
  placeDoor(world, a, b, keyId, state === DoorState.HERMETIC_OPEN || state === DoorState.HERMETIC_CLOSED);
  const doorIdx = a.doors.find(idx => !before.has(idx));
  if (doorIdx === undefined) {
    carveCorridor(world, a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2), b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2));
    return;
  }
  const door = world.doors.get(doorIdx);
  if (door) {
    door.state = state;
    door.keyId = keyId;
  }
  world.wallTex[doorIdx] = state === DoorState.LOCKED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR) return;
  world.features[ci] = feature;
  if (feature === Feature.SCREEN && !world.screenCells.includes(ci)) world.screenCells.push(ci);
}

function addScreenWall(world: World, x: number, y: number, variant: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.WALL) return;
  world.wallTex[ci] = Tex.SCREEN_BASE + (variant % 32);
  world.screenCells.push(ci);
}

function addPosterWall(world: World, x: number, y: number, variant: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = Tex.POSTER_BASE + (variant % 64);
}

function addLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const liftIdx = world.idx(x, y);
  world.cells[liftIdx] = Cell.LIFT;
  world.wallTex[liftIdx] = Tex.LIFT_DOOR;
  world.roomMap[liftIdx] = -1;
  world.features[liftIdx] = Feature.NONE;
  world.liftDir[liftIdx] = direction;

  const buttonIdx = world.idx(buttonX, buttonY);
  if (world.cells[buttonIdx] === Cell.FLOOR) {
    world.features[buttonIdx] = Feature.LIFT_BUTTON;
    world.liftDir[buttonIdx] = direction;
  }
}

interface Floor69MacroCounts {
  hotelRooms: number;
  dressingRooms: number;
  debtRooms: number;
  refugeRooms: number;
  securityGates: number;
  loops: number;
}

function canCarveFloor69Route(world: World, idx: number): boolean {
  if (world.cells[idx] === Cell.LIFT || world.cells[idx] === Cell.DOOR) return false;
  const roomId = world.roomMap[idx];
  if (roomId >= 0) return world.rooms[roomId]?.type === RoomType.CORRIDOR;
  return world.aptMask[idx] === 0 || world.cells[idx] === Cell.FLOOR;
}

function carveRouteCell(world: World, x: number, y: number, floorTex: Tex, wallTex: Tex): void {
  const ci = world.idx(x, y);
  if (!canCarveFloor69Route(world, ci)) return;
  const roomId = world.roomMap[ci];
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = roomId >= 0 ? roomId : -1;
  world.floorTex[ci] = floorTex;
  if (world.features[ci] !== Feature.LIFT_BUTTON) world.features[ci] = Feature.NONE;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const ni = world.idx(x + ox, y + oy);
    if (world.cells[ni] === Cell.WALL && world.aptMask[ni] === 0) world.wallTex[ni] = wallTex;
  }
}

function carveRouteDisc(world: World, cx: number, cy: number, r: number, floorTex: Tex, wallTex: Tex): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      carveRouteCell(world, cx + dx, cy + dy, floorTex, wallTex);
    }
  }
}

function carveRouteLine(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  let x = world.wrap(ax);
  let y = world.wrap(ay);
  const dx = world.delta(x, bx);
  const dy = world.delta(y, by);
  const sx = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const sy = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  for (let i = 0; i <= Math.abs(dx); i++) {
    carveRouteDisc(world, x, y, width, floorTex, wallTex);
    if (i < Math.abs(dx)) x = world.wrap(x + sx);
  }
  for (let i = 0; i <= Math.abs(dy); i++) {
    carveRouteDisc(world, x, y, width, floorTex, wallTex);
    if (i < Math.abs(dy)) y = world.wrap(y + sy);
  }
}

function doorWalkable(cell: number): boolean {
  return cell === Cell.FLOOR || cell === Cell.DOOR || cell === Cell.WATER || cell === Cell.LIFT;
}

function doorHasStableJamb(world: World, wx: number, wy: number, insideDx: number, insideDy: number): boolean {
  const fx = insideDy;
  const fy = insideDx;
  return world.cells[world.idx(wx + fx, wy + fy)] === Cell.WALL
    && world.cells[world.idx(wx - fx, wy - fy)] === Cell.WALL;
}

function placeRoomDoor(world: World, room: Room, wx: number, wy: number, state: DoorState, keyId = ''): boolean {
  const idx = world.idx(wx, wy);
  if (world.cells[idx] !== Cell.WALL && world.cells[idx] !== Cell.DOOR) return false;
  let roomB = -1;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const otherRoomId = world.roomMap[world.idx(wx + ox, wy + oy)];
    if (otherRoomId >= 0 && otherRoomId !== room.id) {
      roomB = otherRoomId;
      break;
    }
  }
  world.cells[idx] = Cell.DOOR;
  world.aptMask[idx] = 0;
  world.wallTex[idx] = state === DoorState.LOCKED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
  world.doors.set(idx, { idx, state, roomA: room.id, roomB, keyId, timer: 0 });
  if (!room.doors.includes(idx)) room.doors.push(idx);
  if (roomB >= 0) {
    const other = world.rooms[roomB];
    if (other && !other.doors.includes(idx)) other.doors.push(idx);
  }
  return true;
}

function openRoomToNearestRoute(world: World, room: Room, tx: number, ty: number, state = DoorState.CLOSED, keyId = ''): void {
  let bestX = 0;
  let bestY = 0;
  let bestDx = 0;
  let bestDy = 0;
  let bestD = Infinity;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) continue;
      const wx = world.wrap(room.x + dx);
      const wy = world.wrap(room.y + dy);
      const ci = world.idx(wx, wy);
      if (world.cells[ci] !== Cell.WALL) continue;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const inside = world.idx(wx + ox, wy + oy);
        const outside = world.idx(wx - ox, wy - oy);
        if (world.roomMap[inside] !== room.id || !doorWalkable(world.cells[outside])) continue;
        if (!doorHasStableJamb(world, wx, wy, ox, oy)) continue;
        const d = world.dist2(wx, wy, tx, ty);
        if (d < bestD) {
          bestD = d;
          bestX = wx;
          bestY = wy;
          bestDx = ox;
          bestDy = oy;
        }
      }
    }
  }
  if (bestD < Infinity && placeRoomDoor(world, room, bestX, bestY, state, keyId)) return;

  bestD = Infinity;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) continue;
      const wx = world.wrap(room.x + dx);
      const wy = world.wrap(room.y + dy);
      if (world.cells[world.idx(wx, wy)] !== Cell.WALL) continue;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const inside = world.idx(wx + ox, wy + oy);
        const outside = world.idx(wx - ox, wy - oy);
        if (world.roomMap[inside] !== room.id || world.aptMask[outside]) continue;
        if (!doorHasStableJamb(world, wx, wy, ox, oy)) continue;
        const d = world.dist2(wx, wy, tx, ty);
        if (d < bestD) {
          bestD = d;
          bestX = wx;
          bestY = wy;
          bestDx = ox;
          bestDy = oy;
        }
      }
    }
  }

  if (bestD < Infinity) {
    carveRouteLine(world, bestX - bestDx, bestY - bestDy, tx, ty, 1, room.floorTex, room.wallTex);
    placeRoomDoor(world, room, bestX, bestY, state, keyId);
  }
}

function addRouteGate(
  world: World,
  x: number,
  y1: number,
  y2: number,
  doorY: number,
  state: DoorState,
  keyId = '',
): void {
  for (let y = y1; y <= y2; y++) {
    const ci = world.idx(x, y);
    const roomId = world.roomMap[ci];
    if (roomId >= 0 && world.rooms[roomId]?.type !== RoomType.CORRIDOR) continue;
    if (world.cells[ci] === Cell.LIFT) continue;
    world.cells[ci] = Cell.WALL;
    world.aptMask[ci] = 0;
    world.roomMap[ci] = -1;
    world.wallTex[ci] = Tex.METAL;
    world.features[ci] = Feature.NONE;
  }

  const doorIdx = world.idx(x, doorY);
  world.cells[doorIdx] = Cell.DOOR;
  world.wallTex[doorIdx] = state === DoorState.LOCKED ? Tex.DOOR_METAL : Tex.DOOR_WOOD;
  world.doors.set(doorIdx, { idx: doorIdx, state, roomA: -1, roomB: -1, keyId, timer: 0 });
}

function pickRouteRoomType(rng: () => number, motif: 'hotel' | 'dressing' | 'debt' | 'security' | 'refuge'): RoomType {
  if (motif === 'debt') return rng() < 0.72 ? RoomType.OFFICE : RoomType.STORAGE;
  if (motif === 'dressing') return rng() < 0.55 ? RoomType.COMMON : RoomType.STORAGE;
  if (motif === 'security') return RoomType.HQ;
  if (motif === 'refuge') return rng() < 0.7 ? RoomType.LIVING : RoomType.STORAGE;
  return rng() < 0.65 ? RoomType.LIVING : rng() < 0.82 ? RoomType.SMOKING : RoomType.COMMON;
}

function decorateRouteRoom(world: World, room: Room, motif: 'hotel' | 'dressing' | 'debt' | 'security' | 'refuge', rng: () => number): void {
  const count = Math.max(2, Math.floor(room.w * room.h / 62));
  const pool = motif === 'debt'
    ? [Feature.SHELF, Feature.DESK, Feature.TABLE, Feature.LAMP]
    : motif === 'security'
      ? [Feature.DESK, Feature.CHAIR, Feature.LAMP, Feature.SHELF]
      : motif === 'dressing'
        ? [Feature.CHAIR, Feature.SHELF, Feature.TABLE, Feature.LAMP]
        : motif === 'refuge'
          ? [Feature.BED, Feature.CHAIR, Feature.LAMP, Feature.SHELF]
          : [Feature.BED, Feature.TABLE, Feature.CHAIR, Feature.LAMP];

  for (let i = 0; i < count; i++) {
    setFeature(
      world,
      room.x + 2 + Math.floor(rng() * Math.max(1, room.w - 4)),
      room.y + 2 + Math.floor(rng() * Math.max(1, room.h - 4)),
      pool[Math.floor(rng() * pool.length)],
    );
  }

  if (motif === 'debt') {
    addScreenWall(world, room.x + Math.floor(room.w / 2), room.y - 1, room.id + 17);
  } else if (motif === 'hotel' || motif === 'dressing') {
    addPosterWall(world, room.x + Math.floor(room.w / 2), room.y - 1, room.id * 3);
    if (rng() < 0.24) {
      world.stamp(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2), 0.5, 0.5, 2.8, 0.16, room.id * 983, 200, 42, 112, true);
    }
  }
}

function addRouteRoom(
  world: World,
  rng: () => number,
  motif: 'hotel' | 'dressing' | 'debt' | 'security' | 'refuge',
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  doorTargetX: number,
  doorTargetY: number,
  state = DoorState.CLOSED,
  keyId = '',
): Room {
  const wallTex = motif === 'security'
    ? Tex.METAL
    : motif === 'debt'
      ? Tex.MARBLE
      : motif === 'dressing'
        ? Tex.CURTAIN
        : motif === 'refuge'
          ? Tex.PANEL
          : Tex.CURTAIN;
  const floorTex = motif === 'security'
    ? Tex.F_CONCRETE
    : motif === 'debt'
      ? Tex.F_PARQUET
      : motif === 'refuge'
        ? Tex.F_LINO
        : Tex.F_CARPET;
  const room = addRoom(world, pickRouteRoomType(rng, motif), x, y, w, h, name, wallTex, floorTex);
  if (motif === 'refuge') protectRoom(world, room.x, room.y, room.w, room.h, wallTex, floorTex);
  openRoomToNearestRoute(world, room, doorTargetX, doorTargetY, state, keyId);
  decorateRouteRoom(world, room, motif, rng);
  return room;
}

function addHorizontalRooms(
  world: World,
  rng: () => number,
  counts: Floor69MacroCounts,
  corridorY: number,
  x1: number,
  x2: number,
  side: -1 | 1,
  motif: 'hotel' | 'dressing' | 'debt' | 'refuge',
  label: string,
  step: number,
): void {
  for (let x = x1; x <= x2; x += step) {
    const w = 18 + Math.floor(rng() * (motif === 'debt' ? 18 : 12));
    const h = 10 + Math.floor(rng() * (motif === 'refuge' ? 5 : 8));
    const y = side < 0 ? corridorY - h - 3 : corridorY + 4;
    const locked = motif === 'debt' && rng() < 0.45;
    addRouteRoom(
      world,
      rng,
      motif,
      x,
      y,
      w,
      h,
      `${label} ${Math.floor(x / step)}`,
      x + Math.floor(w / 2),
      corridorY,
      motif === 'refuge' ? DoorState.HERMETIC_OPEN : locked ? DoorState.LOCKED : DoorState.CLOSED,
      locked ? 'key' : '',
    );
    if (motif === 'hotel') counts.hotelRooms++;
    else if (motif === 'dressing') counts.dressingRooms++;
    else if (motif === 'debt') counts.debtRooms++;
    else counts.refugeRooms++;
  }
}

function decorateRouteLine(world: World, y: number, x1: number, x2: number, seedOffset: number): void {
  for (let x = x1; x <= x2; x += 46) {
    setFeature(world, x, y, Feature.LAMP);
    if ((x + seedOffset) % 3 === 0) addPosterWall(world, x, y - 3, x + seedOffset);
  }
}

function buildFloor69PublicRoutes(world: World, counts: Floor69MacroCounts): void {
  carveRouteLine(world, 64, 512, 948, 512, 3, Tex.F_CARPET, Tex.CURTAIN);
  carveRouteLine(world, 112, 384, 912, 384, 2, Tex.F_CARPET, Tex.CURTAIN);
  carveRouteLine(world, 112, 640, 912, 640, 2, Tex.F_CARPET, Tex.CURTAIN);
  carveRouteLine(world, 176, 320, 176, 704, 2, Tex.F_CARPET, Tex.CURTAIN);
  carveRouteLine(world, 392, 300, 392, 704, 2, Tex.F_CARPET, Tex.CURTAIN);
  carveRouteLine(world, 656, 300, 656, 704, 2, Tex.F_CARPET, Tex.CURTAIN);

  carveRouteLine(world, 300, 256, 736, 256, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 164, 448, 736, 448, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 164, 640, 736, 640, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 300, 812, 736, 812, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 736, 160, 736, 880, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 554, 554, 736, 554, 2, Tex.F_CONCRETE, Tex.DARK);

  decorateRouteLine(world, 512, 96, 920, 11);
  decorateRouteLine(world, 384, 136, 884, 23);
  decorateRouteLine(world, 640, 136, 884, 37);
  counts.loops += 4;
}

function buildFloor69HotelWings(world: World, rng: () => number, counts: Floor69MacroCounts): void {
  addHorizontalRooms(world, rng, counts, 384, 118, 350, -1, 'hotel', 'Гостиничный номер север', 46);
  addHorizontalRooms(world, rng, counts, 384, 118, 350, 1, 'hotel', 'Гостиничный номер юг', 46);
  addHorizontalRooms(world, rng, counts, 384, 690, 874, -1, 'hotel', 'Красный номер восток', 46);
  addHorizontalRooms(world, rng, counts, 640, 118, 350, -1, 'hotel', 'Тихий номер запад', 46);
  addHorizontalRooms(world, rng, counts, 640, 118, 350, 1, 'hotel', 'Часовой номер запад', 46);
  addHorizontalRooms(world, rng, counts, 640, 690, 874, 1, 'hotel', 'Поздний номер восток', 46);
}

function buildFloor69BackstageLoop(world: World, rng: () => number, counts: Floor69MacroCounts): void {
  carveRouteLine(world, 432, 456, 604, 456, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 604, 456, 604, 612, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 604, 612, 432, 612, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 432, 612, 432, 456, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 512, 456, 512, 612, 2, Tex.F_CONCRETE, Tex.DARK);
  counts.loops += 2;

  addHorizontalRooms(world, rng, counts, 456, 438, 574, -1, 'dressing', 'Гримерная кулис', 44);
  addHorizontalRooms(world, rng, counts, 612, 438, 574, 1, 'dressing', 'Костюмерная петля', 44);
  addHorizontalRooms(world, rng, counts, 612, 438, 530, -1, 'refuge', 'Тихий шкаф за сценой', 46);
  setFeature(world, 512, 456, Feature.SCREEN);
  setFeature(world, 604, 512, Feature.LAMP);
}

function buildFloor69DebtBlock(world: World, rng: () => number, counts: Floor69MacroCounts): void {
  carveRouteLine(world, 604, 512, 904, 512, 2, Tex.F_PARQUET, Tex.PANEL);
  carveRouteLine(world, 604, 552, 904, 552, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 604, 608, 904, 608, 2, Tex.F_CONCRETE, Tex.DARK);
  carveRouteLine(world, 904, 512, 904, 608, 2, Tex.F_CONCRETE, Tex.DARK);
  counts.loops++;

  addRouteRoom(world, rng, 'security', 630, 494, 18, 14, 'Второй пост досмотра 69', 620, 512);
  addRouteRoom(world, rng, 'security', 720, 532, 18, 14, 'Пост служебного обхода 69', 736, 552);
  addHorizontalRooms(world, rng, counts, 552, 626, 850, -1, 'debt', 'Долговой кабинет', 48);
  addHorizontalRooms(world, rng, counts, 608, 626, 850, 1, 'debt', 'Архив расписок', 48);
}

function buildFloor69RefugeClosets(world: World, rng: () => number, counts: Floor69MacroCounts): void {
  addHorizontalRooms(world, rng, counts, 256, 320, 444, -1, 'refuge', 'Верхний тихий шкаф', 42);
  addHorizontalRooms(world, rng, counts, 448, 248, 344, 1, 'refuge', 'Служебное укрытие', 42);
  addHorizontalRooms(world, rng, counts, 812, 320, 444, 1, 'refuge', 'Нижний тихий шкаф', 42);
  addRouteRoom(world, rng, 'refuge', 790, 624, 16, 11, 'Скрытая комната свидетеля 69', 790, 640, DoorState.HERMETIC_OPEN);
}

function buildFloor69SecurityChokes(world: World, counts: Floor69MacroCounts): void {
  addRouteGate(world, 620, 505, 519, 512, DoorState.CLOSED);
  addRouteGate(world, 760, 505, 519, 512, DoorState.CLOSED);
  counts.securityGates += 2;
  setFeature(world, 624, 511, Feature.DESK);
  setFeature(world, 756, 511, Feature.DESK);
}

function buildLayout(world: World): Floor69Rooms {
  const publicLift = addRoom(world, RoomType.CORRIDOR, 456, 503, 7, 16, 'Лифт 69: публичная площадка', Tex.METAL, Tex.F_CONCRETE);
  const publicCorridor = addRoom(world, RoomType.CORRIDOR, 464, 508, 88, 6, 'Красный коридор 69', Tex.CURTAIN, Tex.F_CARPET);
  const checkpoint = addRoom(world, RoomType.HQ, 476, 497, 13, 10, 'Пост досмотра 69', Tex.METAL, Tex.F_CONCRETE);
  const hall = addRoom(world, RoomType.COMMON, 496, 488, 27, 19, 'Зал ламп и сцены 69', Tex.CURTAIN, Tex.F_CARPET);
  const clinic = addRoom(world, RoomType.MEDICAL, 530, 496, 17, 11, 'Клиника Сима: тихий прием', Tex.TILE_W, Tex.F_TILE);
  const debtOffice = addRoom(world, RoomType.OFFICE, 530, 515, 17, 12, 'Долговая контора 69', Tex.PANEL, Tex.F_PARQUET);
  const refuge = addRoom(world, RoomType.LIVING, 498, 515, 12, 10, 'Тихая комната 69', Tex.PANEL, Tex.F_LINO, true);
  const ledger = addRoom(world, RoomType.OFFICE, 514, 515, 12, 10, 'Картотека долгов 69', Tex.MARBLE, Tex.F_PARQUET);
  const staffRoute = addRoom(world, RoomType.CORRIDOR, 553, 500, 5, 49, 'Служебный ход 69', Tex.DARK, Tex.F_CONCRETE);
  const staffLift = addRoom(world, RoomType.CORRIDOR, 548, 550, 13, 9, 'Черная лестница 69', Tex.METAL, Tex.F_CONCRETE);

  connect(world, publicLift, publicCorridor);
  connect(world, checkpoint, publicCorridor, '', DoorState.CLOSED);
  connect(world, hall, publicCorridor, '', DoorState.CLOSED);
  connect(world, clinic, publicCorridor, '', DoorState.CLOSED);
  connect(world, debtOffice, publicCorridor, 'key', DoorState.LOCKED);
  connect(world, refuge, publicCorridor, '', DoorState.HERMETIC_OPEN);
  connect(world, ledger, publicCorridor, 'key', DoorState.LOCKED);
  connect(world, publicCorridor, staffRoute, 'key', DoorState.LOCKED);
  connect(world, staffRoute, staffLift, '', DoorState.CLOSED);
  carveCorridor(world, 556, 524, 554, 524);

  addLift(world, 459, 511, 460, 511, LiftDirection.DOWN);
  addLift(world, 554, 554, 554, 553, LiftDirection.UP);
  return { publicLift, publicCorridor, checkpoint, hall, clinic, debtOffice, refuge, ledger, staffRoute, staffLift };
}

function decorateRooms(world: World, rooms: Floor69Rooms, seed: number): void {
  for (let x = rooms.publicCorridor.x + 4; x < rooms.publicCorridor.x + rooms.publicCorridor.w - 4; x += 8) {
    setFeature(world, x, rooms.publicCorridor.y + 2, Feature.LAMP);
    if (x % 16 === 0) addPosterWall(world, x, rooms.publicCorridor.y - 1, x + seed);
  }

  for (let x = rooms.hall.x + 3; x < rooms.hall.x + rooms.hall.w - 3; x += 4) {
    setFeature(world, x, rooms.hall.y + 2, Feature.CHAIR);
    setFeature(world, x, rooms.hall.y + rooms.hall.h - 3, Feature.TABLE);
  }
  setFeature(world, rooms.hall.x + Math.floor(rooms.hall.w / 2), rooms.hall.y + 4, Feature.LAMP);
  setFeature(world, rooms.hall.x + Math.floor(rooms.hall.w / 2), rooms.hall.y + 8, Feature.SCREEN);
  addScreenWall(world, rooms.hall.x + 12, rooms.hall.y - 1, 9);
  addScreenWall(world, rooms.hall.x + 18, rooms.hall.y - 1, 10);
  world.stamp(rooms.hall.x + 13, rooms.hall.y + 9, 0.5, 0.5, 3.5, 0.22, seed + 11, 210, 45, 130, true);
  world.stamp(rooms.hall.x + 18, rooms.hall.y + 9, 0.5, 0.5, 3.5, 0.18, seed + 12, 40, 160, 210, true);

  for (let x = rooms.checkpoint.x + 2; x < rooms.checkpoint.x + rooms.checkpoint.w - 2; x += 3) {
    setFeature(world, x, rooms.checkpoint.y + 2, Feature.DESK);
  }
  setFeature(world, rooms.checkpoint.x + rooms.checkpoint.w - 3, rooms.checkpoint.y + rooms.checkpoint.h - 3, Feature.LAMP);
  addPosterWall(world, rooms.checkpoint.x + 5, rooms.checkpoint.y - 1, 31);

  for (let x = rooms.clinic.x + 2; x < rooms.clinic.x + rooms.clinic.w - 2; x += 4) {
    setFeature(world, x, rooms.clinic.y + 2, Feature.APPARATUS);
    setFeature(world, x, rooms.clinic.y + rooms.clinic.h - 3, Feature.BED);
  }
  setFeature(world, rooms.clinic.x + rooms.clinic.w - 3, rooms.clinic.y + 2, Feature.LAMP);

  for (let y = rooms.debtOffice.y + 2; y < rooms.debtOffice.y + rooms.debtOffice.h - 2; y += 2) {
    setFeature(world, rooms.debtOffice.x + 2, y, Feature.SHELF);
    setFeature(world, rooms.debtOffice.x + rooms.debtOffice.w - 3, y, Feature.DESK);
  }
  addScreenWall(world, rooms.debtOffice.x + 7, rooms.debtOffice.y + rooms.debtOffice.h, 18);

  for (let dx = 2; dx < rooms.refuge.w - 2; dx += 4) {
    setFeature(world, rooms.refuge.x + dx, rooms.refuge.y + 2, Feature.BED);
    setFeature(world, rooms.refuge.x + dx, rooms.refuge.y + rooms.refuge.h - 3, Feature.CHAIR);
  }
  setFeature(world, rooms.refuge.x + rooms.refuge.w - 2, rooms.refuge.y + 2, Feature.LAMP);

  for (let y = rooms.ledger.y + 1; y < rooms.ledger.y + rooms.ledger.h - 1; y += 2) {
    setFeature(world, rooms.ledger.x + 2, y, Feature.SHELF);
    setFeature(world, rooms.ledger.x + rooms.ledger.w - 3, y, Feature.SHELF);
  }

  for (let y = rooms.staffRoute.y + 3; y < rooms.staffRoute.y + rooms.staffRoute.h - 3; y += 7) {
    setFeature(world, rooms.staffRoute.x + 2, y, Feature.LAMP);
  }

  placeNonExplicitRouteSignals(world, rooms);
}

function placeNonExplicitRouteSignals(world: World, rooms: Floor69Rooms): void {
  addScreenWall(world, rooms.publicCorridor.x + 18, rooms.publicCorridor.y - 1, 41);
  addScreenWall(world, rooms.publicCorridor.x + 44, rooms.publicCorridor.y - 1, 42);
  addScreenWall(world, rooms.clinic.x + 8, rooms.clinic.y - 1, 43);
  addScreenWall(world, rooms.refuge.x + 6, rooms.refuge.y + rooms.refuge.h, 44);
  addPosterWall(world, rooms.staffRoute.x - 1, rooms.staffRoute.y + 8, 45);
  addPosterWall(world, rooms.debtOffice.x + 5, rooms.debtOffice.y - 1, 46);
}

function roomMidX(room: Room): number {
  return room.x + room.w / 2;
}

function roomMidY(room: Room): number {
  return room.y + room.h / 2;
}

function registerFloor69RouteCues(world: World, rooms: Floor69Rooms): void {
  const refugeCueX = rooms.checkpoint.x + 9.5;
  const refugeCueY = rooms.checkpoint.y + 5.5;
  registerRouteCue(world, {
    id: 'floor_69_debt_refuge_route',
    x: refugeCueX,
    y: refugeCueY,
    targetX: roomMidX(rooms.refuge),
    targetY: roomMidY(rooms.refuge),
    floor: FLOOR_69_BASE_FLOOR,
    label: '69: долг/убежище',
    hint: 'пост, ключ и расписка дают риск рейда; тихая комната дает воду, бинт и жалобу',
    targetName: rooms.refuge.name,
    color: '#f8a',
    tags: floor69EventTags('debt', 'refuge', 'raid', 'map_hint'),
    toneSeed: FLOOR_69_DEFAULT_SEED + 69,
    radius: 12,
    targetRadius: 3.8,
    roomId: rooms.checkpoint.id,
    targetRoomId: rooms.refuge.id,
    zoneId: world.zoneMap[world.idx(Math.floor(refugeCueX), Math.floor(refugeCueY))],
    heardText: 'Карта у поста шепчет маршрут 69: ключ и расписка рискнут рейдом, зато тихая комната даст воду, бинт и жалобу.',
    followedText: 'Метка вывела к тихой комнате 69: проверь воду, жалобу и служебный выход до рейда.',
    ignoredText: 'Тихая комната осталась за спиной: свидетель и долг снова зависят от поста.',
  });

  const blackmailCueX = rooms.debtOffice.x + 2.5;
  const blackmailCueY = rooms.debtOffice.y + 1.5;
  registerRouteCue(world, {
    id: 'floor_69_blackmail_service_route',
    x: blackmailCueX,
    y: blackmailCueY,
    targetX: roomMidX(rooms.staffLift),
    targetY: roomMidY(rooms.staffLift),
    floor: FLOOR_69_BASE_FLOOR,
    label: '69: сейф/черный ход',
    hint: 'сейф компромата опасен охраной; награда - пропуск, рычаг или служебный выход',
    targetName: rooms.staffLift.name,
    color: '#f6c34a',
    tags: floor69EventTags('blackmail', 'service_route', 'access', 'map_hint'),
    toneSeed: FLOOR_69_DEFAULT_SEED + 169,
    radius: 10,
    targetRadius: 4,
    roomId: rooms.debtOffice.id,
    targetRoomId: rooms.staffLift.id,
    zoneId: world.zoneMap[world.idx(Math.floor(blackmailCueX), Math.floor(blackmailCueY))],
    heardText: 'У долговой конторы отмечен выбор: сейф дает пропуск или рычаг, но охрана записывает путь к черному ходу.',
    followedText: 'Черный ход найден: теперь решай, чем платить за маршрут - ключом, бумагой или молчанием.',
    ignoredText: 'Сейф и черный ход остались позади: короткий маршрут 69 снова проходит через пост.',
  });
}

export function expandFloor69FullFloor(generation: FloorGeneration, rng: () => number): void {
  const counts: Floor69MacroCounts = {
    hotelRooms: 0,
    dressingRooms: 0,
    debtRooms: 0,
    refugeRooms: 0,
    securityGates: 0,
    loops: 0,
  };

  buildFloor69PublicRoutes(generation.world, counts);
  buildFloor69HotelWings(generation.world, rng, counts);
  buildFloor69BackstageLoop(generation.world, rng, counts);
  buildFloor69DebtBlock(generation.world, rng, counts);
  buildFloor69RefugeClosets(generation.world, rng, counts);
  buildFloor69SecurityChokes(generation.world, counts);

  genLog(
    `[F69] full geometry rooms=${counts.hotelRooms + counts.dressingRooms + counts.debtRooms + counts.refugeRooms}`
    + ` hotel=${counts.hotelRooms} backstage=${counts.dressingRooms} debt=${counts.debtRooms}`
    + ` refuge=${counts.refugeRooms} gates=${counts.securityGates} loops=${counts.loops}`
    + ` ambientCap=${FLOOR_69_FULL_POP_CAP}`,
  );
}

function floor69ReachableCells(world: World, spawnX: number, spawnY: number): Uint8Array {
  const out = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  const start = world.idx(Math.floor(spawnX), Math.floor(spawnY));
  out[start] = 1;
  queue[tail++] = start;

  while (head < tail) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = world.idx(x + dx, y + dy);
      if (out[ni]) continue;
      if (!doorWalkable(world.cells[ni])) continue;
      out[ni] = 1;
      queue[tail++] = ni;
    }
  }

  return out;
}

function randomFloor69FloorCell(world: World, rng: () => number, reachable: Uint8Array): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * W);
    const ci = world.idx(x, y);
    if (reachable[ci] && world.cells[ci] === Cell.FLOOR && world.features[ci] !== Feature.LIFT_BUTTON) return { x, y };
  }
  for (let i = 0; i < W * W; i++) {
    if (reachable[i] && world.cells[i] === Cell.FLOOR && world.features[i] !== Feature.LIFT_BUTTON) {
      return { x: i % W, y: (i / W) | 0 };
    }
  }
  return null;
}

export function spawnFloor69ReachablePopulation(generation: FloorGeneration, rng: () => number): void {
  let nextId = generation.entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
  const existingAmbient = generation.entities
    .filter(e => e.type === EntityType.NPC && e.canGiveQuest !== true)
    .length;
  const target = Math.max(0, FLOOR_69_FULL_POP_CAP - existingAmbient);
  const reachable = floor69ReachableCells(generation.world, generation.spawnX, generation.spawnY);
  for (let i = 0; i < target; i++) {
    const p = randomFloor69FloorCell(generation.world, rng, reachable);
    if (!p) break;
    const female = i < Math.ceil(target * 0.56);
    generation.entities.push(makeFloor69Npc(nextId++, p.x + 0.5, p.y + 0.5, female, i, rng));
  }
}

function makeFloor69Npc(id: number, x: number, y: number, female: boolean, i: number, rng: () => number): Entity {
  const faction = rng() < 0.12 ? Faction.LIQUIDATOR : Faction.CITIZEN;
  return {
    id,
    type: EntityType.NPC,
    x,
    y,
    angle: rng() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: 0.72 + rng() * 0.36,
    sprite: female ? Spr.F69_FEMALE_NPC_BASE + (i % 8) : pickOccupationSprite(rng),
    name: female ? FLOOR_69_NAMES_F[i % FLOOR_69_NAMES_F.length] : FLOOR_69_NAMES_M[i % FLOOR_69_NAMES_M.length],
    isFemale: female,
    needs: freshNeeds(),
    hp: 70 + Math.floor(rng() * 60),
    maxHp: 100,
    money: Math.floor(8 + rng() * 110),
    inventory: rng() < 0.5 ? [{ defId: 'cigs', count: 1 }] : [{ defId: 'tea', count: 1 }],
    faction,
    occupation: female ? Occupation.TRAVELER : rng() < 0.4 ? Occupation.HUNTER : Occupation.TRAVELER,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    canGiveQuest: false,
    questId: -1,
    weapon: faction === Faction.LIQUIDATOR ? 'makarov' : '',
  };
}

function pickOccupationSprite(rng: () => number): number {
  const pool = [Occupation.TRAVELER, Occupation.HUNTER, Occupation.STOREKEEPER, Occupation.SECRETARY, Occupation.DOCTOR];
  return pool[Math.floor(rng() * pool.length)];
}

function addItemDrop(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count = 1): void {
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

function nextContainerId(world: World): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id)) id++;
  return id;
}

function addContainer(
  world: World,
  room: Room,
  dx: number,
  dy: number,
  kind: ContainerKind,
  name: string,
  access: ContainerAccess,
  capacitySlots: number,
  inventory: WorldContainer['inventory'],
  tags: string[],
  faction?: Faction,
  lockDifficulty?: number,
): void {
  const x = world.wrap(room.x + dx);
  const y = world.wrap(room.y + dy);
  world.addContainer({
    id: nextContainerId(world),
    x,
    y,
    floor: FLOOR_69_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots,
    faction,
    access,
    lockDifficulty,
    discovered: true,
    tags: ['floor_69', ...tags],
  });
}

function seedContainers(world: World, rooms: Floor69Rooms): void {
  addContainer(
    world, rooms.clinic, 3, 2, ContainerKind.MEDICAL_CABINET, 'Шкаф тихой клиники 69',
    'owner', 8,
    [
      { defId: 'bandage', count: 3 },
      { defId: 'pills', count: 2 },
      { defId: 'antibiotic', count: 1 },
      { defId: 'gasmask_filter', count: 1 },
      { defId: 'clean_health_cert', count: 1 },
    ],
    ['clinic', 'medicine', 'harm_reduction'],
    Faction.SCIENTIST,
  );
  addContainer(
    world, rooms.debtOffice, 4, 3, ContainerKind.SAFE, 'Сейф компромата 69',
    'locked', 7,
    [
      { defId: 'denunciation', count: 1 },
      { defId: 'record_exposure_notice', count: 1 },
      { defId: 'personal_file_copy', count: 1 },
      { defId: 'sealed_complaint', count: 1 },
    ],
    ['blackmail', 'evidence', 'official'],
    Faction.CITIZEN,
    4,
  );
  addContainer(
    world, rooms.ledger, 3, 2, ContainerKind.FILING_CABINET, 'Картотека долгов 69',
    'locked', 8,
    [
      { defId: 'voluntary_receipt', count: 3 },
      { defId: 'blank_form', count: 2 },
      { defId: 'ink_bottle', count: 1 },
      { defId: 'fake_pass', count: 1 },
    ],
    ['debt', 'ledger', 'market_88'],
    Faction.CITIZEN,
    3,
  );
  addContainer(
    world, rooms.checkpoint, 9, 2, ContainerKind.WEAPON_CRATE, 'Ящик поста 69',
    'faction', 6,
    [
      { defId: 'emergency_roster', count: 1 },
      { defId: 'liquidator_token', count: 1 },
      { defId: 'ammo_9mm', count: 12 },
      { defId: 'key', count: 1 },
    ],
    ['raid', 'security', 'choice'],
    Faction.LIQUIDATOR,
  );
  addContainer(
    world, rooms.checkpoint, 3, 7, ContainerKind.CASHBOX, 'Тарелка входных расписок 69',
    'faction', 5,
    [
      { defId: 'voluntary_receipt', count: 2 },
      { defId: 'water_coupon', count: 1 },
      { defId: 'key', count: 1 },
    ],
    ['toll', 'checkpoint', 'debt', 'crowd_pressure'],
    Faction.LIQUIDATOR,
  );
  addContainer(
    world, rooms.refuge, 2, 2, ContainerKind.EMERGENCY_BOX, 'Ящик тихой комнаты 69',
    'public', 6,
    [
      { defId: 'water', count: 2 },
      { defId: 'bread', count: 2 },
      { defId: 'bandage', count: 1 },
      { defId: 'emergency_roster', count: 1 },
    ],
    ['refuge', 'samosbor', 'aid'],
    Faction.CITIZEN,
  );
}

function spawnNpc(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  plotNpcId: string,
  x: number,
  y: number,
  angle: number,
  weapon?: string,
): void {
  const def = NPC_DEFS[plotNpcId];
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: world.wrap(x) + 0.5,
    y: world.wrap(y) + 0.5,
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
    plotNpcId,
    canGiveQuest: true,
    questId: -1,
  });
}

function spawnAmbientAdult(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  name: string,
  isFemale: boolean,
  occupation: Occupation,
  faction: Faction,
  x: number,
  y: number,
  inventory: Entity['inventory'],
  weapon?: string,
): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: world.wrap(x) + 0.5,
    y: world.wrap(y) + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: 0.8,
    sprite: occupation,
    name,
    isFemale,
    needs: freshNeeds(),
    hp: 85,
    maxHp: 85,
    money: 20,
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory?.map(item => ({ ...item })) ?? [{ defId: 'note', count: 1 }],
    weapon,
    faction,
    occupation,
    canGiveQuest: false,
    questId: -1,
  });
}

function spawnFloor69Npcs(world: World, entities: Entity[], nextId: { v: number }, rooms: Floor69Rooms): void {
  spawnNpc(world, entities, nextId, 'f69_madam_roza', rooms.hall.x + 13, rooms.hall.y + 5, Math.PI / 2);
  spawnNpc(world, entities, nextId, 'f69_guard_venya', rooms.checkpoint.x + 7, rooms.checkpoint.y + 5, Math.PI, 'makarov');
  spawnNpc(world, entities, nextId, 'f69_performer_ira', rooms.refuge.x + 4, rooms.refuge.y + 5, 0);
  spawnNpc(world, entities, nextId, 'f69_doctor_sima', rooms.clinic.x + 8, rooms.clinic.y + 5, Math.PI / 2);
  spawnNpc(world, entities, nextId, 'f69_accountant_nil', rooms.debtOffice.x + 10, rooms.debtOffice.y + 6, Math.PI);
  spawnAmbientAdult(world, entities, nextId, 'Раиса Гардеробная', true, Occupation.SECRETARY, Faction.CITIZEN, rooms.staffRoute.x + 2, rooms.staffRoute.y + 12, [
    { defId: 'cloth_roll', count: 1 },
    { defId: 'sealed_complaint', count: 1 },
  ]);
  spawnAmbientAdult(world, entities, nextId, 'Павел Тихий', false, Occupation.TRAVELER, Faction.CITIZEN, rooms.publicCorridor.x + 35, rooms.publicCorridor.y + 3, [
    { defId: 'water', count: 1 },
    { defId: 'voluntary_receipt', count: 1 },
  ]);
  spawnCheckpointCrowd(world, entities, nextId, rooms);
}

function spawnCheckpointCrowd(world: World, entities: Entity[], nextId: { v: number }, rooms: Floor69Rooms): void {
  const spots: readonly { name: string; isFemale: boolean; occupation: Occupation; faction: Faction; x: number; y: number; item: string; weapon?: string }[] = [
    { name: 'Гость у тарелки расписок', isFemale: false, occupation: Occupation.TRAVELER, faction: Faction.CITIZEN, x: rooms.publicCorridor.x + 14, y: rooms.publicCorridor.y + 2, item: 'voluntary_receipt' },
    { name: 'Посетительница с талоном', isFemale: true, occupation: Occupation.SECRETARY, faction: Faction.CITIZEN, x: rooms.publicCorridor.x + 18, y: rooms.publicCorridor.y + 2, item: 'water_coupon' },
    { name: 'Смотрящий за очередью 69', isFemale: false, occupation: Occupation.HUNTER, faction: Faction.LIQUIDATOR, x: rooms.checkpoint.x + 3, y: rooms.checkpoint.y + 7, item: 'liquidator_token', weapon: 'makarov' },
    { name: 'Соседка тихого входа', isFemale: true, occupation: Occupation.HOUSEWIFE, faction: Faction.CITIZEN, x: rooms.refuge.x + 2, y: rooms.refuge.y - 2, item: 'bread' },
    { name: 'Курьер без афиши', isFemale: false, occupation: Occupation.TRAVELER, faction: Faction.CITIZEN, x: rooms.staffRoute.x - 2, y: rooms.staffRoute.y + 7, item: 'metro_ticket' },
    { name: 'Дежурная клиники 69', isFemale: true, occupation: Occupation.DOCTOR, faction: Faction.SCIENTIST, x: rooms.clinic.x + 2, y: rooms.clinic.y + rooms.clinic.h + 2, item: 'bandage' },
    { name: 'Бухгалтерская очередь', isFemale: true, occupation: Occupation.SECRETARY, faction: Faction.CITIZEN, x: rooms.debtOffice.x + 2, y: rooms.debtOffice.y - 2, item: 'blank_form' },
    { name: 'Молчаливый должник', isFemale: false, occupation: Occupation.TRAVELER, faction: Faction.CITIZEN, x: rooms.ledger.x + 8, y: rooms.ledger.y - 2, item: 'voluntary_receipt' },
    { name: 'Старшая по лампам', isFemale: true, occupation: Occupation.STOREKEEPER, faction: Faction.CITIZEN, x: rooms.hall.x + 3, y: rooms.hall.y + 3, item: 'tea' },
    { name: 'Проверяющий без протокола', isFemale: false, occupation: Occupation.HUNTER, faction: Faction.LIQUIDATOR, x: rooms.publicCorridor.x + 24, y: rooms.publicCorridor.y + 2, item: 'note', weapon: 'makarov' },
    { name: 'Свидетель у красной стены', isFemale: false, occupation: Occupation.TRAVELER, faction: Faction.CITIZEN, x: rooms.publicCorridor.x + 30, y: rooms.publicCorridor.y + 2, item: 'cigs' },
    { name: 'Женщина с чистой справкой', isFemale: true, occupation: Occupation.TRAVELER, faction: Faction.CITIZEN, x: rooms.clinic.x + 12, y: rooms.clinic.y + rooms.clinic.h + 2, item: 'clean_health_cert' },
  ];
  for (let i = 0; i < Math.min(FLOOR_69_CHECKPOINT_CROWD_CAP, spots.length); i++) {
    const spot = spots[i];
    spawnAmbientAdult(
      world,
      entities,
      nextId,
      spot.name,
      spot.isFemale,
      spot.occupation,
      spot.faction,
      spot.x,
      spot.y,
      [{ defId: spot.item, count: 1 }],
      spot.weapon,
    );
  }
}

function seedLooseItems(entities: Entity[], nextId: { v: number }, rooms: Floor69Rooms): void {
  addItemDrop(entities, nextId, rooms.publicCorridor.x + 9, rooms.publicCorridor.y + 2, 'cigs', 1);
  addItemDrop(entities, nextId, rooms.hall.x + 5, rooms.hall.y + 12, 'tea', 1);
  addItemDrop(entities, nextId, rooms.clinic.x + 12, rooms.clinic.y + 8, 'bandage', 1);
  addItemDrop(entities, nextId, rooms.staffLift.x + 3, rooms.staffLift.y + 5, 'metro_ticket', 1);
}

function applyZones(world: World): void {
  generateZones(world);
  for (const zone of world.zones) {
    zone.level = Math.max(2, Math.min(5, calcZoneLevel(zone.cx, zone.cy, FLOOR_69_BASE_FLOOR)));
    zone.faction = zone.id % 7 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
    zone.fogged = false;
  }
}

export function generateFloor69DesignFloor(seed = FLOOR_69_DEFAULT_SEED): Floor69Generation {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };
    const state = createFloor69State();

    const rooms = buildLayout(world);
    decorateRooms(world, rooms, seed);
    applyZones(world);
    seedContainers(world, rooms);
    spawnFloor69Npcs(world, entities, nextId, rooms);
    seedLooseItems(entities, nextId, rooms);
    registerFloor69RouteCues(world, rooms);

    const spawnX = rooms.publicCorridor.x + 8.5;
    const spawnY = rooms.publicCorridor.y + 3.5;
    ensureConnectivity(world, spawnX, spawnY);
    sanitizeDoors(world);
    world.bakeLights();

    genLog(`[F69] design floor seed=${seed} rooms=${world.rooms.length} spawn=(${spawnX.toFixed(1)}, ${spawnY.toFixed(1)})`);
    return {
      world,
      entities,
      spawnX,
      spawnY,
      routeId: DESIGN_FLOOR_ID,
      z: DESIGN_FLOOR_Z,
      seed,
      state,
      debugLines: floor69DebugLines(state, seed),
    };
  });
}

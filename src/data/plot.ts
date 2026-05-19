/* ── Story plot data — quest chain + story NPC definitions ────── */
/* To grow the story:                                              */
/*   1. Add NPC to PLOT_NPCS (id, dialogue, stats)                */
/*   2. Append steps to PLOT_CHAIN (giver → target / item)        */
/*   3. Create room generator in gen/living/ (optional)            */
/*   4. Add room spec to plot_rooms.ts (optional)                  */

import {
  type Entity, type Quest, type WorldEventPrivacy, type WorldEventSeverity,
  QuestType, Faction, Occupation, MonsterKind, FloorLevel,
} from '../core/types';

/* ── Story NPC definition ─────────────────────────────────────── */
export interface PlotNpcDef {
  name: string;
  isFemale: boolean;
  faction: Faction;
  occupation: Occupation;
  sprite: number;
  hp: number;
  maxHp: number;
  money: number;
  speed: number;
  weapon?: string;
  inventory: { defId: string; count: number }[];
  /** Sequential talk lines (cycled via _plotTalkIdx) */
  talkLines: string[];
  /** Talk lines after plotDone flag is set (random pick) */
  talkLinesPost: string[];
  /** Response when completing a TALK quest targeting this NPC */
  talkQuestResponse?: string;
}

/* ── Story NPC registry ───────────────────────────────────────── */
export const PLOT_NPCS: Record<string, PlotNpcDef> = {
  olga: {
    name: 'Ольга Дмитриевна',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.DOCTOR,
    sprite: Occupation.DOCTOR,
    hp: 500, maxHp: 500, money: 50, speed: 1.2,
    inventory: [
      { defId: 'bandage', count: 3 },
      { defId: 'pills', count: 1 },
      { defId: 'water', count: 2 },
      { defId: 'bread', count: 2 },
    ],
    talkLines: [
      'Добро пожаловать в блок, если это слово ещё подходит. Я Ольга Дмитриевна, врач по людям и иногда по дверям. Слайды на стене читают вслух только новичкам.',
      'WASD — ноги, мышь — шея. E — спросить человека, открыть дверь или убедиться, что дверь всё ещё дверь.',
      'Вещи подбираются сами, но жить за вас не будут. I — инвентарь, F — кто кому уже враг. Ешьте и пейте до того, как тело начнёт спорить.',
      'Пробел или ЛКМ — удар и выстрел. Барни в оружейной объясняет короче меня: мишени терпят, коридоры нет.',
      'Сирена означает САМОСБОР. Не геройство, не прогулка, не проверка слухов. Бегите в комнату и закрывайте герму.',
      'Фиолетовый туман не дым и не пар. Он приходит по щелям, зовёт знакомыми голосами и оставляет вместо людей объяснения.',
      'M — карта, Q — задания, N — НЕТ-СФЕРА. Разговаривайте с жильцами: в хруще слух иногда точнее компаса, а благодарность иногда дешевле патрона.',
      'Есть поручение. Откройте «Задание» и не улыбайтесь так уверенно: актовый зал безопасен только пока вы в нём.',
    ],
    talkLinesPost: [
      'Приходите, если ранены. Только без крови на журнале, его уже один раз списали.',
      'Таблеток мало. Страху много. Приходится дозировать и то и другое.',
      'Мне на обход. Берегите себя и не верьте коридору, если он стал короче.',
    ],
  },

  barni: {
    name: 'Барни',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 600, maxHp: 600, money: 80, speed: 1.4,
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 8 },
      { defId: 'canned', count: 1 },
    ],
    talkLines: [
      'Барни. Старший ликвидатор этого угла и соседних дыр. Оружейная не музей: что взял, тем потом отвечаешь.',
      'Мишени на стене для того и висят, чтобы новенькие не учились на соседях. Патроны бери со стойки, но считай каждый.',
      'Макаров не спасает. Он даёт шанс дожить до следующей двери. Держи заряженным и не тычь в своих.',
      'Сирена воет — ствол в руку, ноги к герме. В коридоре без оружия человек быстро становится находкой.',
      'Пули оставляют следы. Твари тоже. Учись отличать отверстие от приглашения.',
      'Бетонник? Ножом можно только расписаться в собственном дурацком решении. Стреляй издалека и не стой в углу.',
    ],
    talkLinesPost: [],
  },

  yakov: {
    name: 'Яков Давидович',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SCIENTIST,
    sprite: Occupation.SCIENTIST,
    hp: 400, maxHp: 400, money: 60, speed: 1.0,
    inventory: [
      { defId: 'psi_strike', count: 1 },
      { defId: 'antidep', count: 1 },
    ],
    talkLines: [],
    talkLinesPost: [
      'Исследования продолжаются. Если прибор шепчет вашей фамилией, не отвечайте.',
      'Самосбор и культы связаны не верой, а повторяемостью. Вера просто быстрее пишет объяснения.',
      'Возвращайтесь с образцами. Особенно с теми, которые не хотят быть образцами.',
    ],
    talkQuestResponse: 'Ольга прислала? Значит, вы уже достаточно живы для опыта. Я изучаю пси-явления хруща. Возьмите сгусток: он бьёт мыслью, но расплачиваться будете вы.',
  },

  vanka: {
    name: 'Ванька Банчиный',
    isFemale: false,
    faction: Faction.CULTIST,
    occupation: Occupation.ALCOHOLIC,
    sprite: Occupation.ALCOHOLIC,
    hp: 300, maxHp: 300, money: 5, speed: 0.9,
    inventory: [
      { defId: 'bread', count: 1 },
      { defId: 'cigs', count: 2 },
    ],
    talkLines: [
      'А?! Кто?! Не трогай! Ванька не виноват, Ванька только слышал, как батарея молилась!',
      'Чернобог идёт не ногами. Он идёт расписанием. ОН ВСЕГДА ИДЁТ, стены уже заняли очередь.',
      'Теневик! Петля его звали, пока имя не отвалилось. Плохой человек, плохая тень, страшный приказ.',
      'Тени ползут из пола, из шкафа, из места под обоями. Теневик ими двигает, как пальцами в чужой перчатке.',
      'Ванька видел глаза в темноте. Фиолетовые. Они моргали не вместе, значит их было больше одного.',
      'Убей Теневика. Не ради Ваньки. Ради сна, который ещё не весь съели стены.',
    ],
    talkLinesPost: [
      'Тише стало. Теперь слышно, как стены делают вид, что они просто стены.',
      'Ванька боится правильно. Неправильно тут только не бояться.',
      'Спасибо. Теневик больше не приходит во сне, только в углах, если долго смотреть.',
    ],
    talkQuestResponse: 'Яков послал? Учёный любит банки и страшные вопросы. Ванька скажет: Теневик был Петлей, пока петля не стала шеей. Убей его, пока он не приказал стене твоим голосом.',
  },

  major_grom: {
    name: 'Майор Громный',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    sprite: Occupation.HUNTER,
    hp: 10000, maxHp: 10000, money: 120, speed: 1.5,
    inventory: [
      { defId: 'makarov', count: 1 },
      { defId: 'ammo_9mm', count: 12 },
      { defId: 'canned', count: 2 },
      { defId: 'bandage', count: 2 },
    ],
    talkLines: [
      'Майор Громный, ликвидатор. Держим форпост между трубами, водой и тем, что не занесено в ведомость.',
      'Наверху люди спорят о пайках. Здесь коридор сам решает, кто пайка.',
      'Если Яков послал, значит бумага уже не справилась. Говори быстро.',
      'Теневики видали. Гадость умная. Но сейчас на нас лезет обычная гадость, и её больше.',
    ],
    talkLinesPost: [
      'Форпост держим. Если услышишь три коротких по трубе, это не привет.',
      'Патрули ходят. Возвращаются не все, но маршрут пока считается рабочим.',
      'Якову привет. И скажи, чтобы меньше верил приборам, которые потеют.',
    ],
    talkQuestResponse: 'Яков прислал? Про теневиков слышал, но бесплатно у нас только сырость. Поможешь отбиться от тварей — достану рапорты, которые лучше не читать перед сном.',
  },

  hell_contact: {
    name: 'Никанор Обожжённый',
    isFemale: false,
    faction: Faction.CULTIST,
    occupation: Occupation.PILGRIM,
    sprite: Occupation.PILGRIM,
    hp: 450, maxHp: 450, money: 12, speed: 0.9,
    inventory: [
      { defId: 'holy_water', count: 1 },
      { defId: 'antidep', count: 1 },
      { defId: 'cigs', count: 2 },
    ],
    talkLines: [
      'Тише. Ад слышит, когда его называют этажом.',
      'Громный прислал живого? Значит, Манкобус больше не держит проход.',
      'Здесь спорят о Чернобоге, Творце и самом хруще. Все спорят, пока стены едят ноги.',
      'Вестники стоят не за культ. Они сторожат порог, как сторожат дырку в полу.',
    ],
    talkLinesPost: [
      'Не верь голосу, если он обещает выход.',
      'Фазовый сдвиг береги. Один Вестник сидит за стеной.',
      'Мы победили только этот угол ада. Другие углы ещё смотрят.',
    ],
    talkQuestResponse: 'Живой после лифта? Хорошо. Вестница Марфа ждёт у порога. Возьми фазовый сгусток: без него один сторож недоступен.',
  },

  herald_clue: {
    name: 'Марфа Пороговая',
    isFemale: true,
    faction: Faction.CULTIST,
    occupation: Occupation.PRIEST,
    sprite: Occupation.PRIEST,
    hp: 520, maxHp: 520, money: 0, speed: 0.8,
    inventory: [
      { defId: 'bottled_voice', count: 1 },
      { defId: 'holy_water', count: 1 },
    ],
    talkLines: [
      'Я не поклоняюсь Вестникам. Я считаю их, пока они не считают нас.',
      'Три сторожа. Два ходят по мясу, третий спрятан за стеной.',
      'Когда третий упадёт, пол вспомнит дыру.',
      'Пустота не снаружи. Она там, где комната забывает свою смету.',
    ],
    talkLinesPost: [
      'Порог открылся. Теперь главное — не назвать это победой.',
      'Если голос станет ласковым, стреляй первым.',
      'Назад возвращаются не все части человека.',
    ],
    talkQuestResponse: 'Никанор ещё дышит? Значит, слушай. Вестники не объясняют мир — они держат местную заглушку. Сломай троих, и порог провалится.',
  },

  void_warning: {
    name: 'Жан Пустотник',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.SCIENTIST,
    sprite: Occupation.SCIENTIST,
    hp: 350, maxHp: 350, money: 0, speed: 1.0,
    inventory: [
      { defId: 'antidep', count: 2 },
      { defId: 'psi_stabilizer', count: 1 },
    ],
    talkLines: [
      'Не смотри долго в зелёные стены. Они начинают смотреть по твоему расписанию.',
      'Творец здесь местный. Не бог, не ответ, а должность без таблички.',
      'Он чинит дыру, стирая тех, кто её увидел.',
      'Если принесёшь обратно шип, я оставлю его здесь. Пусть пустота подавится своей квитанцией.',
    ],
    talkLinesPost: [
      'Память дрожит, но держится.',
      'Ты вернёшься в хрущ, а не наружу. Это важная разница.',
      'Теперь этот участок Пустоты знает твою фамилию. Ходи тише.',
    ],
    talkQuestResponse: 'Ты прошёл порог. Хорошо. Плохая новость: голос не выводит. Голос закрывает свидетелей.',
  },

  voice: {
    name: 'Таинственный голос',
    isFemale: false,
    faction: Faction.CITIZEN,
    occupation: Occupation.SCIENTIST,
    sprite: Occupation.SCIENTIST,
    hp: 1, maxHp: 1, money: 0, speed: 0,
    inventory: [],
    talkLines: [],
    talkLinesPost: [],
  },
};

/* ── Linear quest chain ──────────────────────────────────────── */
/* Step N is available when all steps 0..N-1 are done AND         */
/* giverNpcId matches the NPC the player is talking to.           */
/* {dir} in desc is auto-replaced with toroidal direction.        */

export const PLOT_CHAIN: PlotStep[] = [
  // Step 0: Olga → talk to Barni
  {
    giverNpcId: 'olga',
    type: QuestType.TALK,
    desc: 'Ольга Дмитриевна: «Сходите в оружейную. Барни выдаст ствол и объяснит, почему гермодверь без патронов — просто вежливая просьба.»',
    targetNpcId: 'barni',
    rewardItem: 'makarov', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 8 }],
    relationDelta: 10, xpReward: 10,
  },
  // Step 1: Barni → report to Olga
  {
    giverNpcId: 'barni',
    type: QuestType.TALK,
    desc: 'Барни: «Доложи Ольге: руки к стволу привыкли, голова пока нет. Пусть выдаст нормальный стартовый паёк.»',
    targetNpcId: 'olga',
    rewardItem: 'bandage', rewardCount: 2,
    extraRewards: [{ defId: 'water', count: 2 }, { defId: 'bread', count: 2 }],
    relationDelta: 12, xpReward: 10,
  },
  // Step 2: Olga → visit Yakov
  {
    giverNpcId: 'olga',
    type: QuestType.TALK,
    desc: 'Ольга Дмитриевна: «Зайдите к Якову Давидовичу. Лаборатория {dir}; там стены пишут на приборах, а он делает вид, что это наука.»',
    targetNpcId: 'yakov',
    rewardItem: 'psi_strike', rewardCount: 1,
    relationDelta: 10, xpReward: 20,
  },
  // Step 3: Yakov → fetch idol
  {
    giverNpcId: 'yakov',
    type: QuestType.FETCH,
    desc: 'Яков Давидович: «Найдите идол Чернобога. Культисты таскают их как ключи от чужой беды; мне нужен один целый и желательно молчащий.»',
    targetItem: 'idol_chernobog', targetCount: 1,
    rewardItem: 'psi_mark', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 1 }, { defId: 'pills', count: 2 }],
    relationDelta: 20, xpReward: 50, moneyReward: 50,
  },
  // Step 4: Yakov → talk to Vanka Banchiny
  {
    giverNpcId: 'yakov',
    type: QuestType.TALK,
    desc: 'Яков Давидович: «Идол реагирует на ведомости самосборов. В медархиве есть Ванька Банчиный: списан как полоумный, но его бред совпадает с приборами. Найдите его {dir}.»',
    targetNpcId: 'vanka',
    rewardItem: 'antidep', rewardCount: 1,
    relationDelta: 15, xpReward: 30,
  },
  // Step 5: Vanka → kill a Shadow monster (Теневик)
  {
    giverNpcId: 'vanka',
    type: QuestType.KILL,
    desc: 'Ванька Банчиный: «Теневик Петля командует тенями из-под пола. Убей его, пока он не пришёл в сон с твоим голосом.»',
    targetMonsterKind: MonsterKind.SHADOW, killNeeded: 1,
    rewardItem: 'psi_recall', rewardCount: 1,
    relationDelta: 20, xpReward: 60,
  },
  // Step 6: Vanka kill done → bring strange clot to Yakov
  {
    giverNpcId: 'vanka',
    type: QuestType.FETCH,
    desc: 'С теневика остался холодный сгусток. Ванька шепчет: «Неси Якову. Банку не открывай. Оно любит имена.»',
    targetItem: 'strange_clot', targetCount: 1,
    rewardItem: 'bandage', rewardCount: 3,
    extraRewards: [{ defId: 'pills', count: 1 }],
    relationDelta: 15, xpReward: 40,
  },
  // Step 7: Yakov → go to maintenance floor, meet Major Grom
  {
    giverNpcId: 'yakov',
    type: QuestType.TALK,
    desc: 'Яков Давидович: «Сгусток совпал с нижними рапортами. Спускайтесь в коллекторы к Майору Громному; его форпост под стрельбищем и лабораторией, если лифт не соврёт.»',
    targetNpcId: 'major_grom',
    rewardItem: 'psi_rupture', rewardCount: 1,
    relationDelta: 20, xpReward: 60, moneyReward: 80,
  },
  // Step 8: Major Grom → kill monsters (defend outpost)
  {
    giverNpcId: 'major_grom',
    type: QuestType.KILL,
    desc: 'Майор Громный: «Сначала отбей сектор. Десять тварей в расход — и я достану рапорт о теневиках из ящика, который лучше не открывать одному.»',
    killNeeded: 10,
    rewardItem: 'ak47', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_762', count: 30 }],
    relationDelta: 25, xpReward: 80, moneyReward: 100,
    spawnMonstersOnAccept: 8,
  },
  // Step 9: Major Grom → storm — kill the Mancobus
  {
    giverNpcId: 'major_grom',
    type: QuestType.KILL,
    desc: 'Майор Громный: «Детекторы ловят командный рёв {dir}. Кто-то собирает тварей в кулак. Найди Манкобуса и разбей этот кулак до следующей сирены.»',
    targetMonsterKind: MonsterKind.MANCOBUS, killNeeded: 1,
    rewardItem: 'psi_storm', rewardCount: 1,
    extraRewards: [{ defId: 'bandage', count: 5 }, { defId: 'ammo_762', count: 30 }],
    relationDelta: 30, xpReward: 150, moneyReward: 200,
  },
  // Step 10: Major Grom → go to Hell
  {
    giverNpcId: 'major_grom',
    type: QuestType.VISIT,
    desc: 'Майор Громный: «Манкобус сдох, а снизу стало слышно громче. Лифт ведёт в Преисподнюю. Вернёшься — расскажешь, кто там считает нас сверху.»',
    rewardItem: 'bandage', rewardCount: 5,
    extraRewards: [{ defId: 'antidep', count: 2 }],
    relationDelta: 20, xpReward: 100,
    visitFloor: FloorLevel.HELL,
  },
  // Step 11: Hell contact → talk to Herald watcher
  {
    giverNpcId: 'hell_contact',
    type: QuestType.TALK,
    desc: 'Никанор Обожжённый: «Манкобус мёртв, значит порог снова слышно. Найди Марфу Пороговую {dir}. Она считает Вестников и знает, какого трогать первым.»',
    targetNpcId: 'herald_clue',
    rewardItem: 'psi_phase', rewardCount: 1,
    extraRewards: [{ defId: 'holy_water', count: 1 }],
    relationDelta: 8, xpReward: 70,
  },
  // Step 12: Herald clue → kill three Heralds
  {
    giverNpcId: 'herald_clue',
    type: QuestType.KILL,
    desc: 'Марфа Пороговая: «Три Вестника держат заглушку. Два ходят по мясу, третий замурован. Убей троих — и порог провалится.»',
    targetMonsterKind: MonsterKind.HERALD, killNeeded: 3,
    rewardItem: 'psi_void_needle', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 2 }],
    relationDelta: 10, xpReward: 220,
  },
  // Step 13: Void warning → test the threshold voice
  {
    giverNpcId: 'void_warning',
    type: QuestType.FETCH,
    desc: 'Жан Пустотник: «Перед Творцом проверь голос в банке. Забери его из моей камеры и верни: если он местный, дрожать будет стекло; если нет — мы.»',
    targetItem: 'bottled_voice', targetCount: 1,
    rewardItem: 'psi_stabilizer', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 1 }],
    relationDelta: 6, xpReward: 140,
  },
  // Step 14: Void warning → kill the Creator
  {
    giverNpcId: 'void_warning',
    type: QuestType.KILL,
    desc: 'Жан Пустотник: «Творец — не бог, а аварийный мастер этой дыры. Убей его, пока он не стёр свидетелей.»',
    targetMonsterKind: MonsterKind.CREATOR, killNeeded: 1,
    rewardItem: 'void_spike', rewardCount: 1,
    extraRewards: [{ defId: 'psi_stabilizer', count: 1 }],
    relationDelta: 12, xpReward: 500,
  },
  // Step 15: Void warning → leave the return consequence behind
  {
    giverNpcId: 'void_warning',
    type: QuestType.FETCH,
    desc: 'Жан Пустотник: «Пустотный шип тянет коридор за тобой. Отдай его мне перед возвратом — пусть последствие останется здесь, а не в жилой зоне.»',
    targetItem: 'void_spike', targetCount: 1,
    rewardItem: 'holy_water', rewardCount: 2,
    extraRewards: [{ defId: 'bandage', count: 3 }, { defId: 'antidep', count: 1 }],
    relationDelta: 10, xpReward: 160,
  },
];

/* ── A single step in the linear story quest chain ───────────── */
export interface PlotStep {
  giverNpcId: string;
  type: QuestType;
  desc: string;
  targetNpcId?: string;
  targetPlotNpcId?: string;   // plot NPC key for cross-floor KILL quests targeting NPCs
  targetItem?: string;
  targetCount?: number;
  targetRoomType?: number;
  targetRoomName?: string;
  targetFloor?: FloorLevel;
  targetZoneTag?: string;
  targetHint?: string;
  targetMonsterKind?: MonsterKind;
  killNeeded?: number;
  rewardItem?: string;
  rewardCount?: number;
  extraRewards?: { defId: string; count: number }[];
  relationDelta: number;
  xpReward: number;
  moneyReward?: number;
  eventTags?: string[];
  eventData?: Record<string, unknown>;
  eventPrivacy?: WorldEventPrivacy;
  eventSeverity?: WorldEventSeverity;
  eventTargetName?: string;
  failOnNpcDeathPlotId?: string;
  abandonsSideQuestIds?: string[];
  /** Spawn N hostile monsters around the quest giver when quest is accepted */
  spawnMonstersOnAccept?: number;
  /** Auto-complete VISIT quest when player enters this floor */
  visitFloor?: FloorLevel;
  /** Optional explicit deadline for authored urgent side quests. */
  timeLimitMinutes?: number;
}

/* ── Side quest definition (independent, no prerequisite chain) ─ */
export interface SideQuestStep extends PlotStep {
  id: string;
  /** Optional plot gate for side content that reacts to main-chain discoveries */
  requiresPlotStepDone?: number;
  /** Optional side-quest gate for local branching content. */
  requiresSideQuestDone?: string | string[];
  /** Hide this offer once any listed side quest has resolved successfully. */
  blockedBySideQuestIds?: string[];
}

/* ── Built-in side branches for story items; content modules append more below. */
export const SIDE_QUESTS: SideQuestStep[] = [
  {
    id: 'idol_ministry_registration',
    giverNpcId: 'vera_propuskova',
    type: QuestType.FETCH,
    desc: 'Вера Пропускова: «Принесите идол Чернобога к окну. Я внесу знак в журнал и верну: без отметки он у вас просто беда в кармане.»',
    targetItem: 'idol_chernobog', targetCount: 1,
    rewardItem: 'idol_chernobog', rewardCount: 1,
    extraRewards: [{ defId: 'official_permit_slip', count: 1 }],
    relationDelta: 8, xpReward: 45, moneyReward: 45,
    requiresPlotStepDone: 2,
    eventTargetName: 'Идол Чернобога зарегистрирован в Министерстве и возвращен владельцу.',
    eventSeverity: 4,
    eventPrivacy: 'public',
    eventTags: ['idol_branch', 'chernobog', 'ministry', 'report', 'contraband', 'returned_item'],
    eventData: {
      branch: 'ministry_report',
      mainPlotItemReturned: true,
      suspicionDelta: 1,
      rumorIds: ['idol_branch_ministry_report'],
    },
  },
  {
    id: 'idol_liquidator_field_report',
    giverNpcId: 'polkovnik_streltsov',
    type: QuestType.FETCH,
    desc: 'Стрельцов: «Покажи идол Чернобога ликвидаторам. Снимем полевой рапорт, вернем вещь Якову, а твое лицо внесем в список свидетелей.»',
    targetItem: 'idol_chernobog', targetCount: 1,
    rewardItem: 'idol_chernobog', rewardCount: 1,
    extraRewards: [{ defId: 'liquidator_token', count: 1 }, { defId: 'ammo_9mm', count: 12 }],
    relationDelta: 14, xpReward: 60, moneyReward: 90,
    requiresPlotStepDone: 2,
    eventTargetName: 'Ликвидаторы сняли полевой рапорт по идолу и вернули улику.',
    eventSeverity: 4,
    eventPrivacy: 'local',
    eventTags: ['idol_branch', 'chernobog', 'liquidator', 'report', 'suspicion', 'returned_item'],
    eventData: {
      branch: 'liquidator_report',
      mainPlotItemReturned: true,
      suspicionDelta: 2,
      rumorIds: ['idol_branch_liquidator_report'],
    },
  },
  {
    id: 'idol_candle_concealment',
    giverNpcId: 'batushka',
    type: QuestType.FETCH,
    desc: 'Батюшка: «Положи идол под свечу до следующего обхода. Я не заберу его у Якова, только собью с него чужой след.»',
    targetItem: 'idol_chernobog', targetCount: 1,
    rewardItem: 'idol_chernobog', rewardCount: 1,
    extraRewards: [{ defId: 'holy_water', count: 1 }],
    relationDelta: 6, xpReward: 40, moneyReward: 20,
    requiresPlotStepDone: 2,
    eventTargetName: 'Идол Чернобога на время скрыли под свечой и вернули для дела Якова.',
    eventSeverity: 3,
    eventPrivacy: 'local',
    eventTags: ['idol_branch', 'chernobog', 'concealment', 'church', 'returned_item'],
    eventData: {
      branch: 'candle_concealment',
      mainPlotItemReturned: true,
      suspicionDelta: -1,
      rumorIds: ['idol_branch_concealment'],
    },
  },
  {
    id: 'idol_counterfeit_decoy',
    giverNpcId: 'stalker_mecheny',
    type: QuestType.FETCH,
    desc: 'Меченый: «Настоящий идол неси Якову. Мне нужен лист с поддельной печатью: сделаю приманку, чтобы культ спорил с копией.»',
    targetItem: 'forged_stamp_sheet', targetCount: 1,
    rewardItem: 'meat_rune', rewardCount: 1,
    extraRewards: [{ defId: 'cigs', count: 3 }],
    relationDelta: 4, xpReward: 55, moneyReward: 65,
    requiresPlotStepDone: 2,
    eventTargetName: 'Для идола Чернобога изготовлена поддельная приманка; настоящий идол остался для Якова.',
    eventSeverity: 4,
    eventPrivacy: 'secret',
    eventTags: ['idol_branch', 'chernobog', 'counterfeit', 'black_market', 'cult', 'decoy'],
    eventData: {
      branch: 'counterfeit_decoy',
      mainPlotItemPreserved: true,
      mainPlotItemConsumed: false,
      rumorIds: ['idol_branch_counterfeit'],
    },
  },
  {
    id: 'idol_hell_contact_handoff',
    giverNpcId: 'hell_contact',
    type: QuestType.FETCH,
    desc: 'Никанор Обожжённый: «Дай идол на ладонь. Не в дар: я проверю, чей он голос держит, и верну, пока Яков ещё верит приборам.»',
    targetItem: 'idol_chernobog', targetCount: 1,
    rewardItem: 'idol_chernobog', rewardCount: 1,
    extraRewards: [{ defId: 'meat_rune', count: 1 }, { defId: 'holy_water', count: 1 }],
    relationDelta: 5, xpReward: 80, moneyReward: 0,
    requiresPlotStepDone: 11,
    eventTargetName: 'Никанор проверил идол Чернобога как культовую улику и вернул его для цепочки Якова.',
    eventSeverity: 4,
    eventPrivacy: 'local',
    eventTags: ['idol_branch', 'chernobog', 'cult', 'handoff', 'evidence', 'returned_item'],
    eventData: {
      branch: 'cult_handoff',
      mainPlotItemReturned: true,
      suspicionDelta: 1,
      rumorIds: ['idol_branch_cult_handoff'],
    },
  },
];

export function sideQuestPrereqsMet(sq: SideQuestStep, quests: readonly Quest[]): boolean {
  if (sq.requiresPlotStepDone !== undefined && !quests.some(q => q.plotStepIndex === sq.requiresPlotStepDone && q.done)) {
    return false;
  }
  const requiredSide = sq.requiresSideQuestDone === undefined
    ? []
    : Array.isArray(sq.requiresSideQuestDone)
      ? sq.requiresSideQuestDone
      : [sq.requiresSideQuestDone];
  for (const sideQuestId of requiredSide) {
    if (!quests.some(q => q.sideQuestId === sideQuestId && q.done && !q.failed)) return false;
  }
  if (sq.blockedBySideQuestIds?.some(id => quests.some(q => q.sideQuestId === id && q.done && !q.failed))) {
    return false;
  }
  return true;
}

export function registerSideQuestSteps(quests: SideQuestStep[]): void {
  const existingQuestIds = new Set(SIDE_QUESTS.map(q => q.id));
  for (const q of quests) {
    if (existingQuestIds.has(q.id)) {
      console.warn(`[SIDE_QUEST] duplicate quest id "${q.id}"`);
      continue;
    }
    existingQuestIds.add(q.id);
    SIDE_QUESTS.push(q);
  }
}

/** Register a side quest content pack (called by content modules at import) */
export function registerSideQuest(
  npcId: string, npc: PlotNpcDef, quests: SideQuestStep[],
): void {
  if (PLOT_NPCS[npcId]) console.warn(`[SIDE_QUEST] duplicate NPC id "${npcId}"`);
  PLOT_NPCS[npcId] = npc;
  registerSideQuestSteps(quests);
}

export function getSideQuestRegistrySnapshot(): readonly {
  id: string;
  giverNpcId: string;
  type: QuestType;
  desc: string;
}[] {
  return SIDE_QUESTS.map(q => ({
    id: q.id,
    giverNpcId: q.giverNpcId,
    type: q.type,
    desc: q.desc,
  }));
}

/* ── Helpers ──────────────────────────────────────────────────── */

/** Check if an entity is a plot NPC */
export function isPlotNpc(e: Entity): boolean {
  return !!e.plotNpcId;
}

/** Get the PlotNpcDef for an entity (or undefined) */
export function getPlotDef(e: Entity): PlotNpcDef | undefined {
  return e.plotNpcId ? PLOT_NPCS[e.plotNpcId] : undefined;
}

/** Check if a plot NPC has an available quest to give (not yet offered) */
export function hasAvailableQuest(plotNpcId: string, quests: Quest[]): boolean {
  // Check PLOT_CHAIN
  for (let i = 0; i < PLOT_CHAIN.length; i++) {
    const step = PLOT_CHAIN[i];
    if (step.giverNpcId !== plotNpcId) continue;
    if (quests.some(q => q.plotStepIndex === i)) continue;
    let allPrevDone = true;
    for (let j = 0; j < i; j++) {
      if (!quests.some(q => q.plotStepIndex === j && q.done)) { allPrevDone = false; break; }
    }
    if (!allPrevDone) continue;
    return true;
  }
  // Check SIDE_QUESTS
  for (const sq of SIDE_QUESTS) {
    if (sq.giverNpcId !== plotNpcId) continue;
    if (quests.some(q => q.sideQuestId === sq.id)) continue;
    if (!sideQuestPrereqsMet(sq, quests)) continue;
    return true;
  }
  return false;
}

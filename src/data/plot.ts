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
  talkQuestResponse?: string | readonly string[];
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
      'Руки покажи. Дрожат, но жить будешь. Я Ольга Дмитриевна, врач; сначала поешь, потом геройствуй.',
      'WASD — ходить, мышь — смотреть. Не крутись в панике, в углу потом трудно перевязывать.',
      'E — поговорить, открыть дверь, проверить шкаф. Сначала смотри, кто рядом, потом тянись рукой.',
      'I — сумка. Хлеб, вода, бинт должны быть с собой. Кушайте вовремя: на сирене уже поздно.',
      'Пробел или ЛКМ — удар и выстрел. Барни даст ствол, а ты не маши им по людям.',
      'Кровь пошла — сразу бинт. Не жди, пока ботинок начнёт хлюпать.',
      'Сирена — это САМОСБОР. Идёшь к ближайшей герме, закрываешь дверь и сидишь тихо.',
      'Фиолетовый туман не нюхай. Увидел в коридоре — назад, к двери, без разговоров.',
      'M — карта. Найди ближайшую герму и запомни путь ногами, не только глазами.',
      'Q — журнал заданий, N — НЕТ-СФЕРА. Слухи слушай, но воду, еду и талоны проверяй руками.',
    ],
    talkLinesPost: [
      'Руки покажи. Обе. Чистые руки тут редкость, но грязные раны хуже.',
      'Приходи, если ранен. Только кровь с пола за собой вытри, я одна на смене.',
      'Бинтов мало. Порезался — перевязался, потом споришь.',
      'Кушайте вовремя. Голод делает шаг громче, а страх на пустой желудок лезет первым.',
      'Пей воду заранее. Когда язык сухой, таблетки глотать нечем.',
      'Кипяток держи при себе. Труба сегодня даёт, завтра может хрипеть.',
      'Не спорь с гермодверью, милый. Закрылась — значит сидишь и ждёшь отбоя.',
      'Если Барни орёт, слушай, что он говорит. Громкость у него рабочая.',
      'Якову не давай мерить себя без причины. Потом будешь чесаться и ругаться на меня.',
      'Талон на воду не пей. Талон показывают, воду берегут, кружку не теряют.',
      'Перед вылазкой проверь сумку: вода, бинт, еда, патроны. Характер я не перевяжу.',
      'После самосбора не беги первым в коридор. Дай пыли сесть и послушай дверь.',
      'Медпункт открыт, пока я стою. Если меня нет — бинт слева, журнал не трогать.',
      'Устал? Сядь, поешь, дыхание выровняй. Потом уже иди к лифту.',
      'Зелёный свет увидел — не пялься. Глаза у нас без обменного фонда.',
      'Мне на обход. Береги себя и не ходи один, если коридор стал другим.',
    ],
    talkQuestResponse: 'Стрельбу видел, Барни жив, значит, учёба пошла. Держи бинты, воду и хлеб. Кушайте вовремя. Голод делает шаг громче.',
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
      'Барни. Стойка моя, сектор общий. Взял ствол — считай патроны.',
      'Мишень стоит. Тварь бежит. Учись попадать до коридора.',
      'Макаров не спасает сам. Он даёт секунду добежать до двери.',
      'Магазин проверяй у стойки. В коридоре поздно щёлкать пустым.',
      'Ствол дрожит — держи двумя руками. Руки дрожат — всё равно держи.',
      'Своих стволом не води. За такое здесь быстро учат.',
      'Самосбор завыл — к герме. Не в угол, не к слухам, к герме.',
      'Бетонника ножом не ковыряй. Держи дистанцию и дверь за спиной.',
      'Сборка лезет быстро. Не стой прямо, уходи за угол.',
      'Вот Макаров. Стреляй. Следы от пуль видно.',
      'Самопал бьёт криво. Близко работает, далеко тратит шум.',
      'Патрон кончается раньше, чем новичок думает.',
      'Боишься — нормально. Только двигайся.',
    ],
    talkLinesPost: [
      'К Ольге сходил? Значит, паёк есть. Не трать его на бег по кругу.',
      'Макаров держи сухим. Мокрый ствол клинит без предупреждения.',
      'Перед вылазкой считай: магазин, вода, бинт, дверь назад.',
      'Тварь слышишь — не ищи лицо. Ищи угол и дистанцию.',
      'Своих узнавай до выстрела. После выстрела поздно.',
      'Самосбор начнётся — бросай спор и иди к герме.',
      'Патроны на полу не валяются просто так. Кто-то их не донёс.',
    ],
    talkQuestResponse: 'Вот Макаров и восемь патронов. Стреляй по мишени, следы от пуль видно. Потом к Ольге: без воды и бинта в коридор не лезь.',
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
    talkLines: [
      'Вы ко мне по рекомендации Ольги Дмитриевны? Тогда начинаем с простого: образец не вскрывать, руки на стол не класть.',
      'Яков Давидович, НИИ, ПСИ-исследования. Меня интересуют не чудеса, а повторяемость, вредный эффект и журнал допуска.',
      'Экспериментальные данные по Самосбору грязные, но полезные. Если образец реагирует на свет, пульс и сирену, это уже модель.',
      'Протокол простой: банку держать сухой, крышку не трогать, после контакта записать пульс и лишние мысли.',
      'ПСИ-сгусток — инструмент. Он даёт результат, расходует ПСИ и оставляет отдачу; это не фокус и не молитва.',
    ],
    talkLinesPost: [
      'Коллега, не кладите сгусток рядом с хлебом. Крошки в протоколе потом выглядят как новая форма жизни.',
      'Прибор врёт, но врёт последовательно. Для модели это почти подарок, если не стоять рядом.',
      'Если эффект немыслим, но повторяем, мы называем его экспериментальными данными и усиливаем тару.',
      'Если образец просит открыть банку голосом матери, банку не открывать. Мать тоже впускать только после проверки.',
      'Я не верю в Чернобога. Я верю в журналы допуска, контрольные группы и сухие крышки.',
      'Шкаф химзащиты был заперт. Сейчас в нём один костюм, две банки и запись, что доступ был закрыт.',
      'Протокол четыре-Б: после контакта йод, пульс, запись. Бумагу после чтения не облизывать.',
      'Образец номер семнадцать шевелится только при начальстве. Для отчёта пишем: реакция на административный шум.',
      'Журнал допуска сам поставил вашу фамилию карандашом. Сотрите после разговора, но не голой рукой.',
      'Формалин закончился утром. К обеду две банки начали вести себя активнее лаборантов.',
      'ПСИ-сгусток - инструмент, не фокус. У инструмента есть цена, отдача и графа для побочного эффекта.',
      'Не вскрывать в лифте, коллега. Лифт даёт нам слишком много неконтролируемых переменных.',
      'После Самосбора голубая проба стала легче на грамм. В модели это плохо, в протоколе - срочно.',
      'Культисты называют это знаком. Я называю это грязной выборкой с опасно хорошей повторяемостью.',
    ],
    talkQuestResponse: [
      'Вы ко мне по рекомендации Ольги Дмитриевны? Она хорошая коллега, так что допуск дам. Возьмите сгусток: три ПСИ, короткий импульс, отдачу записывать честно.',
      'Коллега, перед вами не знак, а экспериментальный ПСИ-инструмент. Держите сгусток отдельно от еды, детей и собственных объяснений.',
      'По модели выходит неприятно: выживший полевой носитель полезнее закрытой витрины. Получите сгусток, журнал допуска я подпишу после первого наблюдения.',
      'Согласно экспериментальным данным, это повторяемый вредный эффект. Направьте, активируйте, после применения проверьте пульс и наличие лишних мыслей.',
      'Протокол выдачи простой: сгусток не вскрывать в лифте, образец в банку обратно не уговаривать, при запахе йода отойти от стены.',
    ],
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
      'А?! Тише. Не ты. Наверное не ты. Банка сама звякнула.',
      'Батарея шептала до сирены. Сначала шепчет, потом дверь просит открыть. Не открывай.',
      'Ванька не врал. Ванька только видел: тень у Петли не сзади была, а спереди. Встань к свету.',
      'Петля бросается с угла. После первого рывка шагни назад, а не вперёд, понял?',
      'Если тень сжалась по краю - фонарь держи между собой и углом. Она тогда злится, но промахивается.',
      'Черный идол не в храме ищи. В кладовке, под мокрой тряпкой, где банки потеют без жары.',
      'Не шуми у кладовки. Там сосед без лица, но с чужой кружкой, и Ванька туда больше не лезет.',
      'Фиолетовый туман не дым. Дым кашляет, а этот считает двери. Две двери лучше одной.',
      'Я видел номер. Ноль восемь девять. Лифт теплый был, кнопка будто после языка.',
      'Культист с пакетом хлеба не всегда добрый. Сначала хлеб, потом вопрос, потом твоя фамилия в углу.',
      'Сосед если стоит слишком ровно и не моргает - не здоровайся близко. Нелюдь любит вежливых.',
      'Не я открыл. Я только спросил, кто там. Дверь потом неделю отвечала моим голосом.',
      'Теневик не любит широкий проход. В тесном углу он как рука в рукаве, а на свету рукав пустой.',
      'Сгусток после Петли в банку. Крышку не трогай. Оно считало имена, пока Ванька спал.',
      'Якову неси. Он с такими банками умеет: номер, пломба, журнал, и никому на кухне не показывать.',
      'Тише. У соседней кладовки кто-то шарит по банкам. Если звякнет три раза, Ванька не с вами.',
    ],
    talkLinesPost: [
      'Тише стало. Теперь батарея шепчет по одному слову, не хором.',
      'Петля ушла, а гвоздь остался. Видишь? Нет? И хорошо.',
      'Ванька теперь боится углов по порядку. Это лучше, чем всех сразу.',
      'Банку Якову отдал? И похожие банки не открывай. Крышка целая - голова целее.',
      'Спасибо не надо. Просто если дверь спросит Ваньку, скажи: не я.',
    ],
    talkQuestResponse: 'Яков послал? Не я. Слушай быстро: Петля был жильцом, потом тень пошла впереди. В широком коридоре держи свет, после рывка отходи, а холодный сгусток неси закрытым. Крышку не трогай.',
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
      'Живой? Докладывай коротко. Мокрый фильтр потом обсудим.',
      'Майор Громный. Форпост коллекторов держит трубу между водой, тварью и людьми за дверью.',
      'Здесь не храбрость нужна, а ноги, патроны и чтобы дверь закрылась с первого раза.',
      'Боекомплект считай до выхода. Внизу магазин короче страха.',
      'Три коротких по трубе - отход. Два длинных - несут раненого. Никаких песен.',
      'Страшно - нормально. Глупо - нет. Страх слушай, глупость оставляй наверху.',
      'Патруль ходит парой. Один смотрит под ноги, второй - в темноту. Самодеятельность хоронят отдельно.',
      'Фильтр намочил - меняй. Не кашляй для вида, а докладывай и отходи.',
      'Манкобус не страшный. Страшный тот, кто пошел на него без второго магазина.',
      'Если Яков опять прислал гражданского с банкой, банку на пол не ставить.',
      'Раненого не тащат красиво. Тащат быстро, по сухому краю, с оружием впереди.',
      'Сектор живой, пока в нем есть порядок: кто стреляет, кто закрывает, кто считает.',
    ],
    talkLinesPost: [
      'Форпост держим. Три коротких по трубе услышишь - не спрашивай, отходи.',
      'Патруль вернулся не весь. Маршрут пока рабочий, потери записаны.',
      'Якову привет. И скажи, чтобы меньше верил приборам, которые потеют.',
      'Фильтры сушим на трубе. Боекомплект считаем по людям, не по красивому расчёту.',
      'За этой трубой люди. Поэтому стоим здесь, а не где суше.',
      'Если принес доклад - говори. Если принес страх - ставь рядом, он тут у всех есть.',
    ],
    talkQuestResponse: 'Яков прислал? Принял. Задача простая: отбить сектор, убрать тварей, не лезть одному за рапортом. Вернешься живым - получишь бумагу про теневиков и патроны.',
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
      'Тише. Не зови это адом. Это нижний мокрый цех, где слово "этаж" уже не закрывает смену.',
      'Громный прислал живого? Сядь у свечи. Манкобус больше не держит проход, но Вестники ещё сторожат порог.',
      'Не называй Чернобога вслух. Рука помнит ожог лучше, чем клятву.',
      'Вестники не за культ. Они держат заглушку у прохода; пока живы, ниже не пройти нормально.',
      'Культ тут не молится громко: охрана, ведро, список, свеча и долг на мокрой бумаге.',
    ],
    talkLinesPost: [
      'Не верь голосу из двери. Обещает выход - значит, уже держит ручку.',
      'Фазовый сгусток береги. Третий Вестник сидит за стеной, вода к нему не доходит.',
      'Угол потух. Свечу не гаси: другие двери ещё слушают.',
      'Если стена теплая, не грей руки. Отойди и проверь, нет ли за ней мясной заслонки.',
    ],
    talkQuestResponse: 'Живой после лифта? Тише. Марфа у порога считает сторожей и свечи. Возьми фазовый сгусток: без него один Вестник останется за стеной.',
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
      'Считать надо вслух: трое Вестников, две свечи, одна дверь. Не спорь.',
      'Два ходят по мясу. Третий сидит за стеной и ждёт, кто назовёт его лишним.',
      'Когда третий упадёт, проход просядет. Сначала смотри под ноги, потом бери трофей.',
      'Вестник не ангел и не начальник. Сторожит заглушку, пока мясо делает вид, что прохода нет.',
      'Подпорог начинается за заглушкой. Без счёта Вестников туда идут только потеряться.',
    ],
    talkLinesPost: [
      'Порог открыт. Запиши: открыто не значит спасено.',
      'Если голос стал мягким, вычеркни его первым и закрой дверь.',
      'Назад возвращаются не все части человека. Я считаю только тех, кто стоит.',
    ],
    talkQuestResponse: 'Никанор ещё дышит? Тогда слушай и не спорь. Три Вестника держат местную заглушку: двое ходят, третий вписан за стеной. Убей троих, и порог провалится.',
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
      'Журнал протокола начал отвечать раньше руки. Слушай коротко: всё записывай после выхода, не здесь.',
      'Не смотри в зелёный источник дольше трёх вдохов. Потом хуже карта и хуже прицел.',
      'Если дверь повторилась, не радуйся короткому пути. Проверь метку, воду и обратную сторону.',
      'Ордер здесь не открывает. Он только доказывает, что ты пришёл по делу, а не на прогулку.',
      'Творец не разговаривает. Он давит дистанцией и ошибками маршрута; держи стабилизатор при себе.',
      'Шип не оружие. Это опасный образец для возврата, держи отдельно от еды и документов.',
    ],
    talkLinesPost: [
      'Запись держится. Не проверяй её вслух, пока рядом зелёный источник.',
      'Журнал вернулся без меня. Значит, протокол сработал, а маршрут ещё нет.',
      'Если зелёный источник снова пищит, уходи боком и не теряй дверь из вида.',
    ],
    talkQuestResponse: 'Ты прошёл порог. Хорошо. Плохая новость: голос не выводит; он сверяет свидетеля с протоколом и закрывает лишнюю строку.',
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
    desc: 'Поговори с Барни в оружейной. Он выдаст Макаров и 8 патронов; без ствола первая вылазка короткая.',
    targetNpcId: 'barni',
    rewardItem: 'makarov', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 8 }],
    relationDelta: 10, xpReward: 10,
  },
  // Step 1: Barni → report to Olga
  {
    giverNpcId: 'barni',
    type: QuestType.TALK,
    desc: 'Доложи Ольге о стрельбе. Она даст бинты, воду и хлеб; без пайка дальше не идти.',
    targetNpcId: 'olga',
    rewardItem: 'bandage', rewardCount: 2,
    extraRewards: [{ defId: 'water', count: 2 }, { defId: 'bread', count: 2 }],
    relationDelta: 12, xpReward: 10,
  },
  // Step 2: Olga → visit Yakov
  {
    giverNpcId: 'olga',
    type: QuestType.TALK,
    desc: 'Зайди к Якову в лабораторию {dir}. Он даст ПСИ-сгусток; прибор руками не трогай.',
    targetNpcId: 'yakov',
    rewardItem: 'psi_strike', rewardCount: 1,
    relationDelta: 10, xpReward: 20,
  },
  // Step 3: Yakov → fetch idol
  {
    giverNpcId: 'yakov',
    type: QuestType.FETCH,
    desc: 'Принеси идол Чернобога Якову. Он даст ПСИ-метку, таблетки и 50 рублей за целый образец.',
    targetItem: 'idol_chernobog', targetCount: 1,
    rewardItem: 'psi_mark', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 1 }, { defId: 'pills', count: 2 }],
    relationDelta: 20, xpReward: 50, moneyReward: 50,
  },
  // Step 4: Yakov → talk to Vanka Banchiny
  {
    giverNpcId: 'yakov',
    type: QuestType.TALK,
    desc: 'Найди Ваньку Банчина {dir}. Его обрывки нужны Якову; за проверку выдадут антидепрессант.',
    targetNpcId: 'vanka',
    rewardItem: 'antidep', rewardCount: 1,
    relationDelta: 15, xpReward: 30,
  },
  // Step 5: Vanka → kill a Shadow monster (Теневик)
  {
    giverNpcId: 'vanka',
    type: QuestType.KILL,
    desc: 'Убей теневика Петлю на широком месте. Ванька даст ПСИ-возврат; в тесноте тень бьёт первой.',
    targetMonsterKind: MonsterKind.SHADOW, killNeeded: 1,
    rewardItem: 'psi_recall', rewardCount: 1,
    relationDelta: 20, xpReward: 60,
  },
  // Step 6: Vanka kill done → bring strange clot to Yakov
  {
    giverNpcId: 'vanka',
    type: QuestType.FETCH,
    desc: 'Отнеси странный сгусток Якову. Банку не открывай; за целую крышку дадут бинты и таблетки.',
    targetItem: 'strange_clot', targetCount: 1,
    rewardItem: 'bandage', rewardCount: 3,
    extraRewards: [{ defId: 'pills', count: 1 }],
    relationDelta: 15, xpReward: 40,
  },
  // Step 7: Yakov → go to maintenance floor, meet Major Grom
  {
    giverNpcId: 'yakov',
    type: QuestType.TALK,
    desc: 'Передай рапорт Якова Майору Громному в коллекторах. За выход к форпосту дадут ПСИ-разрыв и 80 рублей.',
    targetNpcId: 'major_grom',
    rewardItem: 'psi_rupture', rewardCount: 1,
    relationDelta: 20, xpReward: 60, moneyReward: 80,
  },
  // Step 8: Major Grom → kill monsters (defend outpost)
  {
    giverNpcId: 'major_grom',
    type: QuestType.KILL,
    desc: 'Убей десять тварей перед форпостом. Громный даст АК и 30 патронов; потратишь больше - назад нечем.',
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
    desc: 'Найди и убей Манкобуса {dir}. Громный платит ПСИ-штормом, бинтами и патронами; сирена - отход.',
    targetMonsterKind: MonsterKind.MANCOBUS, killNeeded: 1,
    rewardItem: 'psi_storm', rewardCount: 1,
    extraRewards: [{ defId: 'bandage', count: 5 }, { defId: 'ammo_762', count: 30 }],
    relationDelta: 30, xpReward: 150, moneyReward: 200,
  },
  // Step 10: Major Grom → go to Hell
  {
    giverNpcId: 'major_grom',
    type: QuestType.VISIT,
    desc: 'Спустись на нижний мясной этаж и проверь лифт у порога. За доклад дадут бинты и антидепрессанты; ранен - назад.',
    rewardItem: 'bandage', rewardCount: 5,
    extraRewards: [{ defId: 'antidep', count: 2 }],
    relationDelta: 20, xpReward: 100,
    visitFloor: FloorLevel.HELL,
  },
  // Step 11: Hell contact → talk to Herald watcher
  {
    giverNpcId: 'hell_contact',
    type: QuestType.TALK,
    desc: 'Найди Марфу Пороговую {dir}. Никанор даст фазовый сгусток; без неё третий Вестник останется за стеной.',
    targetNpcId: 'herald_clue',
    rewardItem: 'psi_phase', rewardCount: 1,
    extraRewards: [{ defId: 'holy_water', count: 1 }],
    relationDelta: 8, xpReward: 70,
  },
  // Step 12: Herald clue → kill three Heralds
  {
    giverNpcId: 'herald_clue',
    type: QuestType.KILL,
    desc: 'Убей трёх Вестников у порога. Марфа отдаст пустотную иглу; пока они живы, дверь держит людей.',
    targetMonsterKind: MonsterKind.HERALD, killNeeded: 3,
    rewardItem: 'psi_void_needle', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 2 }],
    relationDelta: 10, xpReward: 220,
  },
  // Step 13: Void warning → test the threshold voice
  {
    giverNpcId: 'void_warning',
    type: QuestType.FETCH,
    desc: 'Забери голос в банке из камеры Жана и верни ему. Стабилизатор выдают за закрытую крышку.',
    targetItem: 'bottled_voice', targetCount: 1,
    rewardItem: 'psi_stabilizer', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 1 }],
    relationDelta: 6, xpReward: 140,
  },
  // Step 14: Void warning → kill the Creator
  {
    giverNpcId: 'void_warning',
    type: QuestType.KILL,
    desc: 'Убей Творца в Пустоте. Жан отдаст пустотный шип; задержка стирает свидетелей.',
    targetMonsterKind: MonsterKind.CREATOR, killNeeded: 1,
    rewardItem: 'void_spike', rewardCount: 1,
    extraRewards: [{ defId: 'psi_stabilizer', count: 1 }],
    relationDelta: 12, xpReward: 500,
  },
  // Step 15: Void warning → leave the return consequence behind
  {
    giverNpcId: 'void_warning',
    type: QuestType.FETCH,
    desc: 'Отдай пустотный шип Жану перед возвратом. Получишь святую воду, бинты и антидепрессант; жилую зону не тащи за собой.',
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
    desc: 'Принеси идол Чернобога Вере у окна. Она вернёт идол с корешком; без отметки это улика.',
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
    desc: 'Покажи идол Стрельцову. Ликвидаторы вернут вещь с жетоном и патронами; лицо попадет в список.',
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
    desc: 'Положи идол под свечу Батюшке. Он вернет вещь и святую воду; долг Якова останется.',
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
    desc: 'Принеси Меченому лист с поддельной печатью. Он сделает приманку; настоящий идол останется Якову.',
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
    desc: 'Дай идол Никанору на проверку. Он вернет вещь с руной и водой; голос станет понятнее культу.',
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

function checkedRegistryId(id: string, scope: string): string {
  const trimmed = id.trim();
  if (!trimmed) throw new Error(`[SIDE_QUEST] missing ${scope} id`);
  if (trimmed !== id) throw new Error(`[SIDE_QUEST] ${scope} id "${id}" must be trimmed`);
  return trimmed;
}

function assertSideQuestStepsCanRegister(quests: readonly SideQuestStep[]): void {
  const existingQuestIds = new Set(SIDE_QUESTS.map(q => q.id));
  const batchQuestIds = new Set<string>();
  for (const q of quests) {
    const questId = checkedRegistryId(q.id, 'quest');
    if (existingQuestIds.has(questId) || batchQuestIds.has(questId)) {
      throw new Error(`[SIDE_QUEST] duplicate quest id "${questId}"`);
    }
    batchQuestIds.add(questId);
  }
}

export function registerSideQuestSteps(quests: readonly SideQuestStep[]): void {
  assertSideQuestStepsCanRegister(quests);
  for (const q of quests) {
    SIDE_QUESTS.push(q);
  }
}

/** Register a side quest content pack (called by content modules at import) */
export function registerSideQuest(
  npcId: string, npc: PlotNpcDef, quests: readonly SideQuestStep[],
): void {
  const checkedNpcId = checkedRegistryId(npcId, 'NPC');
  if (PLOT_NPCS[checkedNpcId]) throw new Error(`[SIDE_QUEST] duplicate NPC id "${checkedNpcId}"`);
  assertSideQuestStepsCanRegister(quests);
  PLOT_NPCS[checkedNpcId] = npc;
  registerSideQuestSteps(quests);
}

export interface SideQuestRegistrySnapshot {
  readonly id: string;
  readonly giverNpcId: string;
  readonly type: QuestType;
  readonly desc: string;
}

export function getSideQuestRegistrySnapshot(): readonly SideQuestRegistrySnapshot[] {
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

import { FloorLevel, MonsterKind } from '../core/types';

export type SamosborVariantId = 'classic' | 'quiet' | 'wet' | 'electric' | 'meat' | 'maronary' | 'istotit' | 'veretar';
export type SamosborAudioCueId = 'siren' | 'maronary' | 'bell' | 'veretar';

export type SamosborAftermathEffectId =
  | 'fog_residue'
  | 'door_fault'
  | 'monster_aftershock'
  | 'rumor_seed'
  | 'production_shortage'
  | 'faction_panic'
  | 'container_theft'
  | 'false_all_clear'
  | 'item_residue'
  | 'route_block';

export type SamosborModifierId =
  | 'no_siren'
  | 'delayed_seal'
  | 'early_seal'
  | 'dense_fog'
  | 'sparse_fog'
  | 'extra_eyes'
  | 'door_twitch'
  | 'light_flicker'
  | 'false_safe_zone'
  | 'wet_floor_message'
  | 'meat_walls_hell'
  | 'green_source'
  | 'high_beep'
  | 'wrong_door_hint'
  | 'bell_warning'
  | 'golden_light'
  | 'choir_mask'
  | 'white_area'
  | 'no_sun'
  | 'photo_distortion'
  | 'area_leak';

export interface SamosborVariantDef {
  id: SamosborVariantId;
  displayName: string;
  floors: FloorLevel[];
  weight: number;
  fogColor: [number, number, number];
  tint: string;
  durationMult: number;
  spawnMult: number;
  sealTimingDelta: number;
  warningLines: string[];
  modifiers: SamosborModifierId[];
  gameplaySignal: string;
  audioCue?: SamosborAudioCueId;
  startLine?: string;
}

export interface SamosborModifierDef {
  id: SamosborModifierId;
  warningLine: string;
  spawnMult?: number;
  fogSeedMult?: number;
  fogSpawnIntervalMult?: number;
  sealTimingDelta?: number;
  noSiren?: boolean;
  extraEyes?: number;
  meatWallsOnHell?: boolean;
  shelterRoomCount?: number;
}

export interface ActiveSamosborVariant {
  def: SamosborVariantDef;
  modifiers: SamosborModifierDef[];
  durationMult: number;
  spawnMult: number;
  fogSeedMult: number;
  fogSpawnIntervalMult: number;
  sealTimingDelta: number;
  noSiren: boolean;
  extraEyes: number;
  shelterRoomCount: number;
  fogColor: [number, number, number];
}

export interface SamosborAftermathBeatDef {
  id: string;
  title: string;
  variants: readonly SamosborVariantId[];
  floors: readonly FloorLevel[];
  weight: number;
  cooldownSec: number;
  maxRuns: number;
  radius: number;
  severity: 2 | 3 | 4;
  effect: SamosborAftermathEffectId;
  message: string;
  tags: readonly string[];
  monsterKind?: MonsterKind;
  resourceId?: string;
  itemId?: string;
  fogStrength?: number;
}

const ALL_FLOORS = [
  FloorLevel.MINISTRY,
  FloorLevel.KVARTIRY,
  FloorLevel.LIVING,
  FloorLevel.MAINTENANCE,
  FloorLevel.HELL,
  FloorLevel.VOID,
];
const CIVIL_FLOORS = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING];
const CIVIL_AND_SERVICE_FLOORS = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE];
const VOID_AND_CIVIL_SERVICE_FLOORS = [
  FloorLevel.MINISTRY,
  FloorLevel.KVARTIRY,
  FloorLevel.LIVING,
  FloorLevel.MAINTENANCE,
  FloorLevel.VOID,
];

export const SAMOSBOR_MODIFIERS: Record<SamosborModifierId, SamosborModifierDef> = {
  no_siren: {
    id: 'no_siren',
    warningLine: 'Сирена молчит. Значит, протокол уже опоздал.',
    noSiren: true,
  },
  delayed_seal: {
    id: 'delayed_seal',
    warningLine: 'Гермоуплотнители думают слишком долго, как комиссия перед чужой смертью.',
    sealTimingDelta: -5,
  },
  early_seal: {
    id: 'early_seal',
    warningLine: 'Гермодвери закрываются раньше регламента. Кто снаружи, тот уже строка.',
    sealTimingDelta: 8,
  },
  dense_fog: {
    id: 'dense_fog',
    warningLine: 'Туман идёт низко и густо, по щелям и под плинтусом.',
    fogSeedMult: 1.35,
    fogSpawnIntervalMult: 0.85,
  },
  sparse_fog: {
    id: 'sparse_fog',
    warningLine: 'Туман рваный, зато твари идут так, будто знают маршрут.',
    fogSeedMult: 0.65,
    spawnMult: 1.15,
  },
  extra_eyes: {
    id: 'extra_eyes',
    warningLine: 'В тумане открываются глаза. Они моргают не вместе.',
    extraEyes: 2,
  },
  door_twitch: {
    id: 'door_twitch',
    warningLine: 'Двери дёргаются, но протокол ещё держит лицо.',
  },
  light_flicker: {
    id: 'light_flicker',
    warningLine: 'Лампы моргают азбукой, которую никто не учил.',
  },
  false_safe_zone: {
    id: 'false_safe_zone',
    warningLine: 'Карта показывает тихое место. Воздух с этим не согласен.',
  },
  wet_floor_message: {
    id: 'wet_floor_message',
    warningLine: 'Под ногами вода. С потолка ничего не капает, значит вода пришла снизу.',
  },
  meat_walls_hell: {
    id: 'meat_walls_hell',
    warningLine: 'Швы стен выглядят живыми и обиженными на штукатурку.',
    meatWallsOnHell: true,
    spawnMult: 1.1,
  },
  green_source: {
    id: 'green_source',
    warningLine: 'Экран в конце коридора позеленел. Свет не освещает, а сверяет.',
  },
  high_beep: {
    id: 'high_beep',
    warningLine: 'Писк идёт через стены и зубы. Направление ненадёжно.',
    noSiren: true,
    fogSpawnIntervalMult: 1.1,
  },
  wrong_door_hint: {
    id: 'wrong_door_hint',
    warningLine: 'Дверь повторилась на карте. Маршрут может быть доказан неверно.',
    sealTimingDelta: -3,
  },
  bell_warning: {
    id: 'bell_warning',
    warningLine: 'Сирена не взяла ноту. Где-то за стеной ударил колокол.',
    noSiren: true,
    sealTimingDelta: 2,
  },
  golden_light: {
    id: 'golden_light',
    warningLine: 'Золотой свет пошёл по полу. Соседи крестятся не в ту сторону.',
    fogSeedMult: 0.55,
    fogSpawnIntervalMult: 1.65,
    spawnMult: 0.55,
    shelterRoomCount: 2,
  },
  choir_mask: {
    id: 'choir_mask',
    warningLine: 'Хор тянет одну букву. Гермодвери слушают.',
    spawnMult: 0.85,
    extraEyes: 1,
  },
  white_area: {
    id: 'white_area',
    warningLine: 'Дверная щель белеет. Из неё сыпется сухая пыль.',
    fogSeedMult: 0.45,
    fogSpawnIntervalMult: 1.2,
    spawnMult: 0.9,
  },
  no_sun: {
    id: 'no_sun',
    warningLine: 'Сирена ушла за стену. В окне нет солнца.',
    noSiren: true,
  },
  photo_distortion: {
    id: 'photo_distortion',
    warningLine: 'Экран засветился белым кадром. Не фотографируй без причины.',
  },
  area_leak: {
    id: 'area_leak',
    warningLine: 'Карта показала область там, где была кухня.',
    sealTimingDelta: -2,
  },
};

export const SAMOSBOR_VARIANTS: readonly SamosborVariantDef[] = [
  {
    id: 'classic',
    displayName: 'Классический',
    floors: ALL_FLOORS,
    weight: 60,
    fogColor: [112, 24, 168],
    tint: '#a34cff',
    durationMult: 1,
    spawnMult: 1,
    sealTimingDelta: 0,
    warningLines: ['Сирена берёт штатную ноту. Фиолетовый туман пошёл по зоне, как проверка без подписи.'],
    modifiers: ['dense_fog'],
    gameplaySignal: 'штатная сирена, фиолетовый туман, обычное запирание герм',
  },
  {
    id: 'quiet',
    displayName: 'Тихий',
    floors: ALL_FLOORS,
    weight: 18,
    fogColor: [92, 52, 132],
    tint: '#9a6bd6',
    durationMult: 0.9,
    spawnMult: 0.9,
    sealTimingDelta: -4,
    warningLines: ['Коридор становится слишком тихим. Сирена не помогает, потому что её не спросили. Слушай замки и соседей.'],
    modifiers: ['no_siren', 'delayed_seal', 'light_flicker'],
    gameplaySignal: 'нет штатной сирены, гермы запираются поздно, ориентируйся по щелчкам дверей и NPC',
  },
  {
    id: 'wet',
    displayName: 'Мокрый',
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
    weight: 20,
    fogColor: [44, 116, 156],
    tint: '#44a6d8',
    durationMult: 1.08,
    spawnMult: 1.05,
    sealTimingDelta: 2,
    warningLines: ['На линолеуме выступает вода. Трубы отвечают туману старым давлением. Ищи сухой обход до гермы.'],
    modifiers: ['wet_floor_message', 'dense_fog', 'door_twitch'],
    gameplaySignal: 'синий туман, мокрый пол, плотнее спавн из тумана, безопаснее сухие коридоры и закрываемые шлюзы',
  },
  {
    id: 'electric',
    displayName: 'Электрический',
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    weight: 16,
    fogColor: [80, 180, 210],
    tint: '#72e6ff',
    durationMult: 0.95,
    spawnMult: 1,
    sealTimingDelta: 4,
    warningLines: ['Гермоуплотнитель пахнет озоном. Свет режет глаза и пересчитывает зрачки. Не стой под лампами.'],
    modifiers: ['light_flicker', 'early_seal', 'extra_eyes'],
    gameplaySignal: 'циановый туман, раннее запирание, больше глаз в тумане, уходи от света и готовь дверь заранее',
  },
  {
    id: 'meat',
    displayName: 'Мясной резонанс',
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
    weight: 14,
    fogColor: [156, 40, 56],
    tint: '#d64b5f',
    durationMult: 1.15,
    spawnMult: 1.18,
    sealTimingDelta: 0,
    warningLines: ['Пахнет сырым мясом. Стены вспоминают, что когда-то умели болеть. Держись середины прохода.'],
    modifiers: ['meat_walls_hell', 'false_safe_zone', 'sparse_fog'],
    gameplaySignal: 'красный туман, ложная безопасность, усиленный спавн тварей, опасны швы стен и красивые обходы',
  },
  {
    id: 'maronary',
    displayName: 'Маронарий',
    floors: ALL_FLOORS,
    weight: 4,
    fogColor: [48, 230, 86],
    tint: '#35ff66',
    durationMult: 0.82,
    spawnMult: 0.78,
    sealTimingDelta: -2,
    warningLines: [
      'ПРОИЗОШЁЛ МАРОНАРИЙ. Сирена не началась; зелёный источник смотрит первым.',
      'Писк идёт с другой стороны дома, но слышен у тебя в зубах.',
      'Пение без слов приближается через стены.',
    ],
    modifiers: ['green_source', 'high_beep', 'wrong_door_hint'],
    gameplaySignal: 'зелёный свет, высокий писк, пение без слов, ненадёжная дверь',
    audioCue: 'maronary',
    startLine: 'ПРОИЗОШЁЛ МАРОНАРИЙ',
  },
  {
    id: 'istotit',
    displayName: 'Истотит',
    floors: CIVIL_FLOORS,
    weight: 3,
    fogColor: [212, 166, 72],
    tint: '#d6a64b',
    durationMult: 0.92,
    spawnMult: 0.52,
    sealTimingDelta: 3,
    warningLines: [
      'Сирена не взяла ноту. Где-то за стеной ударил колокол.',
      'Золотой свет пошёл по полу. Соседи крестятся не в ту сторону.',
      'Истотит Христом укрыт. Кто успел — тот свидетель.',
    ],
    modifiers: ['bell_warning', 'golden_light', 'choir_mask'],
    gameplaySignal: 'колокол вместо сирены, золотой туман, укрытые комнаты и ложное облегчение',
    audioCue: 'bell',
    startLine: 'ПРОИЗОШЁЛ ИСТОТИТ',
  },
  {
    id: 'veretar',
    displayName: 'Веретар',
    floors: ALL_FLOORS,
    weight: 4,
    fogColor: [238, 234, 214],
    tint: '#f4f1df',
    durationMult: 0.96,
    spawnMult: 0.78,
    sealTimingDelta: -1,
    warningLines: [
      'НАСТУПИЛ ВЕРЕТАР. Белое окно не показывает двор. Ищи тёмную герму, не светлый путь.',
      'Сирена звучит снаружи. В доме не должно быть снаружи.',
      'На полу сухой песок. Карта называет его областью.',
    ],
    modifiers: ['no_sun', 'white_area', 'area_leak', 'photo_distortion'],
    gameplaySignal: 'белая область, сухой песок, дальняя тревога, ненадёжная карта, доверяй тёмной герме и проверяй путь',
    audioCue: 'veretar',
    startLine: 'НАСТУПИЛ ВЕРЕТАР',
  },
];

export const SAMOSBOR_AFTERMATH_BEATS: readonly SamosborAftermathBeatDef[] = [
  {
    id: 'aftermath_fog_residue',
    title: 'Осадок тумана',
    variants: ['classic', 'wet', 'meat'],
    floors: CIVIL_AND_SERVICE_FLOORS,
    weight: 12,
    cooldownSec: 240,
    maxRuns: 8,
    radius: 7,
    severity: 3,
    effect: 'fog_residue',
    message: 'После отбоя туман лёг у пола. Можно обойти, можно рискнуть, можно записаться в ошибку.',
    tags: ['fog', 'route'],
    fogStrength: 120,
  },
  {
    id: 'aftermath_door_fault',
    title: 'Дверь заело',
    variants: ['quiet', 'wet', 'electric'],
    floors: ALL_FLOORS,
    weight: 10,
    cooldownSec: 360,
    maxRuns: 6,
    radius: 12,
    severity: 3,
    effect: 'door_fault',
    message: 'Одна дверь рядом заела открытой. Короткий путь получился, укрытие — нет.',
    tags: ['door', 'route'],
  },
  {
    id: 'aftermath_shortcut_slab_shift',
    title: 'Плита села в проход',
    variants: ['classic', 'quiet', 'wet', 'electric', 'meat', 'maronary', 'istotit', 'veretar'],
    floors: ALL_FLOORS,
    weight: 11,
    cooldownSec: 480,
    maxRuns: 8,
    radius: 14,
    severity: 3,
    effect: 'route_block',
    message: 'Короткий проход после отбоя сел плитой. Обход длиннее, дверь открыть можно, но маршрут уже не прежний.',
    tags: ['door', 'route', 'blocked_shortcut'],
  },
  {
    id: 'aftermath_aftershock_tvar',
    title: 'Поздняя тварь',
    variants: ['quiet', 'wet', 'meat'],
    floors: ALL_FLOORS,
    weight: 9,
    cooldownSec: 300,
    maxRuns: 8,
    radius: 14,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'Туман ушёл не весь. Рядом проснулась поздняя тварь: лучше услышать её сейчас, чем спиной.',
    tags: ['monster', 'danger'],
    monsterKind: MonsterKind.TVAR,
  },
  {
    id: 'aftermath_electric_eye',
    title: 'Глаз после озона',
    variants: ['electric'],
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    weight: 14,
    cooldownSec: 300,
    maxRuns: 8,
    radius: 14,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'Лампы щёлкнули после отбоя. В коридоре открылся глаз и сделал вид, что это освещение.',
    tags: ['monster', 'electric'],
    monsterKind: MonsterKind.EYE,
  },
  {
    id: 'aftermath_rumor_seed',
    title: 'Слух об отбойном протоколе',
    variants: ['quiet', 'wet', 'electric', 'meat'],
    floors: CIVIL_FLOORS,
    weight: 14,
    cooldownSec: 420,
    maxRuns: 6,
    radius: 18,
    severity: 2,
    effect: 'rumor_seed',
    message: 'Соседи запомнили этот вариант самосбора. Спроси их сейчас: слух покажет, кто видел рабочую герму.',
    tags: ['rumor', 'social'],
  },
  {
    id: 'aftermath_supply_shortage',
    title: 'Срыв снабжения',
    variants: ['wet', 'electric', 'meat'],
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    weight: 8,
    cooldownSec: 600,
    maxRuns: 5,
    radius: 18,
    severity: 3,
    effect: 'production_shortage',
    message: 'Местный цех потерял запас. Производство кашляет, цены уже встали в очередь.',
    tags: ['shortage', 'production'],
    resourceId: 'labor',
  },
  {
    id: 'aftermath_faction_panic',
    title: 'Фракционная паника',
    variants: ['quiet', 'electric', 'meat'],
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    weight: 9,
    cooldownSec: 360,
    maxRuns: 7,
    radius: 16,
    severity: 3,
    effect: 'faction_panic',
    message: 'Люди рядом сорвались с мест. Толпа открывает дорогу, уводит охрану и оставляет виноватых.',
    tags: ['faction', 'panic'],
  },
  {
    id: 'aftermath_container_theft',
    title: 'Открытый запас',
    variants: ['quiet', 'wet', 'electric', 'meat'],
    floors: CIVIL_AND_SERVICE_FLOORS,
    weight: 10,
    cooldownSec: 480,
    maxRuns: 6,
    radius: 18,
    severity: 3,
    effect: 'container_theft',
    message: 'Рядом остался раскрытый ящик. Чужое лежит на виду: взять можно, но свидетели тоже выжили.',
    tags: ['container', 'theft'],
    itemId: 'water',
  },
  {
    id: 'aftermath_false_all_clear',
    title: 'Ложный отбой',
    variants: ['quiet', 'meat'],
    floors: ALL_FLOORS,
    weight: 8,
    cooldownSec: 540,
    maxRuns: 5,
    radius: 6,
    severity: 4,
    effect: 'false_all_clear',
    message: 'Система дала отбой слишком рано. Проверь карту: она тоже могла испугаться.',
    tags: ['false_clear', 'fog'],
    fogStrength: 150,
  },
  {
    id: 'aftermath_civil_ration_queue_split',
    title: 'Разорванная очередь пайков',
    variants: ['classic', 'quiet', 'electric'],
    floors: CIVIL_FLOORS,
    weight: 16,
    cooldownSec: 720,
    maxRuns: 4,
    radius: 16,
    severity: 3,
    effect: 'production_shortage',
    message: 'После отбоя очередь пайков потеряла ведомость. Еда стала дороже; можно торговаться, воровать или искать другой лифт.',
    tags: ['civil', 'food', 'shortage'],
    resourceId: 'food',
  },
  {
    id: 'aftermath_ministry_forms_eaten',
    title: 'Съеденные бланки',
    variants: ['quiet', 'electric', 'meat'],
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY],
    weight: 14,
    cooldownSec: 780,
    maxRuns: 3,
    radius: 18,
    severity: 3,
    effect: 'production_shortage',
    message: 'В канцелярии недосчитались бланков. Документы подорожали; подделка, кража или услуга стали реальным выбором.',
    tags: ['civil', 'documents', 'shortage'],
    resourceId: 'documents',
  },
  {
    id: 'aftermath_open_fridge_line',
    title: 'Открытый общий холодильник',
    variants: ['quiet', 'wet', 'meat'],
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING],
    weight: 15,
    cooldownSec: 660,
    maxRuns: 4,
    radius: 14,
    severity: 3,
    effect: 'container_theft',
    message: 'Общий холодильник остался раскрытым. Взять воду легко, объяснить потом труднее, особенно при соседях.',
    tags: ['civil', 'container', 'water'],
    itemId: 'water',
  },
  {
    id: 'aftermath_stairwell_denunciation',
    title: 'Подъездный донос',
    variants: ['quiet', 'electric', 'meat'],
    floors: CIVIL_FLOORS,
    weight: 14,
    cooldownSec: 600,
    maxRuns: 4,
    radius: 20,
    severity: 2,
    effect: 'rumor_seed',
    message: 'На лестнице уже спорят, кто открыл гермодверь. Можно уйти тихо, а можно продать версию первым.',
    tags: ['civil', 'rumor', 'social'],
  },
  {
    id: 'aftermath_liquidator_sweep_pressure',
    title: 'Ликвидаторский обход',
    variants: ['classic', 'electric', 'wet'],
    floors: CIVIL_AND_SERVICE_FLOORS,
    weight: 10,
    cooldownSec: 720,
    maxRuns: 4,
    radius: 18,
    severity: 3,
    effect: 'faction_panic',
    message: 'Ликвидаторы пошли по следу самосбора. Люди расходятся, коридор меняет хозяина.',
    tags: ['faction', 'pressure', 'civil'],
  },
  {
    id: 'aftermath_pressure_station_drop',
    title: 'Провал давления',
    variants: ['wet', 'electric'],
    floors: [FloorLevel.MAINTENANCE],
    weight: 20,
    cooldownSec: 720,
    maxRuns: 4,
    radius: 18,
    severity: 3,
    effect: 'production_shortage',
    message: 'В коллекторе просело давление. Вода стала предметом торга: манометр лучше проверить до следующей сирены.',
    tags: ['maintenance', 'water', 'pressure'],
    resourceId: 'drink_water',
  },
  {
    id: 'aftermath_burnt_tool_locker',
    title: 'Сгоревший инструментальный шкаф',
    variants: ['electric', 'wet'],
    floors: [FloorLevel.MAINTENANCE],
    weight: 16,
    cooldownSec: 780,
    maxRuns: 3,
    radius: 14,
    severity: 3,
    effect: 'container_theft',
    message: 'Инструментальный шкаф заклинило открытым. Предохранитель можно забрать, но без него следующий щиток не простит.',
    tags: ['maintenance', 'container', 'electric'],
    itemId: 'fuse',
  },
  {
    id: 'aftermath_service_airlock_fault',
    title: 'Сервисный шлюз не держит',
    variants: ['wet', 'electric', 'classic'],
    floors: [FloorLevel.MAINTENANCE],
    weight: 16,
    cooldownSec: 540,
    maxRuns: 4,
    radius: 16,
    severity: 3,
    effect: 'door_fault',
    message: 'Сервисный шлюз после отбоя не держит защёлку. Путь открыт, но как укрытие он теперь обман.',
    tags: ['maintenance', 'door', 'route'],
  },
  {
    id: 'aftermath_late_tube_eel',
    title: 'Поздний угорь',
    variants: ['wet'],
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    weight: 13,
    cooldownSec: 900,
    maxRuns: 3,
    radius: 16,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'В трубе осталось движение после отбоя. Поздний угорь слышен по воде: сухой обход стоит времени.',
    tags: ['maintenance', 'monster', 'water'],
    monsterKind: MonsterKind.TUBE_EEL,
  },
  {
    id: 'aftermath_cult_cache_unsealed',
    title: 'Культовый схрон раскрылся',
    variants: ['meat', 'quiet'],
    floors: [FloorLevel.HELL],
    weight: 15,
    cooldownSec: 900,
    maxRuns: 3,
    radius: 14,
    severity: 3,
    effect: 'container_theft',
    message: 'Мясной шов раздвинул чужой схрон. Руна доступна, но культ услышит пустоту в тайнике.',
    tags: ['hell', 'container', 'cult'],
    itemId: 'meat_rune',
  },
  {
    id: 'aftermath_herald_afterimage',
    title: 'Послеслед вестника',
    variants: ['meat', 'classic'],
    floors: [FloorLevel.HELL],
    weight: 14,
    cooldownSec: 1080,
    maxRuns: 2,
    radius: 18,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'Отбой не убедил стены. В проходе остался послеслед вестника: не гонись за силуэтом у стены.',
    tags: ['hell', 'monster', 'aftershock'],
    monsterKind: MonsterKind.HERALD,
  },
  {
    id: 'aftermath_hell_meat_supply_rot',
    title: 'Гнилая мясная выдача',
    variants: ['meat', 'wet'],
    floors: [FloorLevel.HELL],
    weight: 16,
    cooldownSec: 840,
    maxRuns: 3,
    radius: 16,
    severity: 3,
    effect: 'production_shortage',
    message: 'Мясная выдача испортилась после перестройки. Плоть стала валютой, а культ - кассиром.',
    tags: ['hell', 'shortage', 'meat'],
    resourceId: 'industrial_slurry',
  },
  {
    id: 'aftermath_void_psi_cache',
    title: 'ПСИ-схрон без тени',
    variants: ['classic', 'quiet', 'maronary', 'veretar'],
    floors: [FloorLevel.VOID],
    weight: 16,
    cooldownSec: 960,
    maxRuns: 3,
    radius: 12,
    severity: 3,
    effect: 'container_theft',
    message: 'В Пустоте на миг проявился чужой схрон. ПСИ-пыль можно забрать сейчас, пока тень не вспомнила владельца.',
    tags: ['void', 'container', 'psi'],
    itemId: 'psi_dust',
  },
  {
    id: 'aftermath_void_spirit_echo',
    title: 'Эхо без жильца',
    variants: ['classic', 'quiet', 'maronary', 'veretar'],
    floors: [FloorLevel.VOID],
    weight: 15,
    cooldownSec: 1080,
    maxRuns: 2,
    radius: 16,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'Пустота повторила отбой не тем голосом. Рядом появился дух; держи стену за спиной, если стена ещё есть.',
    tags: ['void', 'monster', 'psi'],
    monsterKind: MonsterKind.SPIRIT,
  },
  {
    id: 'aftermath_void_false_map',
    title: 'Ложная карта Пустоты',
    variants: ['quiet', 'classic', 'maronary', 'veretar'],
    floors: [FloorLevel.VOID],
    weight: 14,
    cooldownSec: 900,
    maxRuns: 3,
    radius: 7,
    severity: 4,
    effect: 'false_all_clear',
    message: 'Карта Пустоты показала чистый путь. Туман остался ровно там: проверь ногами только край.',
    tags: ['void', 'false_clear', 'fog'],
    fogStrength: 165,
  },
  {
    id: 'aftermath_maronary_shaving',
    title: 'Золотая стружка',
    variants: ['maronary'],
    floors: ALL_FLOORS,
    weight: 18,
    cooldownSec: 720,
    maxRuns: 5,
    radius: 9,
    severity: 3,
    effect: 'item_residue',
    message: 'В трещине осталась золотая стружка. Она лежит так, будто её оставили по расчёту.',
    tags: ['maronary', 'green_source', 'residue', 'gold'],
    itemId: 'maronary_shaving',
  },
  {
    id: 'aftermath_maronary_wrong_door',
    title: 'Неправильная дверь',
    variants: ['maronary'],
    floors: ALL_FLOORS,
    weight: 16,
    cooldownSec: 540,
    maxRuns: 6,
    radius: 12,
    severity: 4,
    effect: 'door_fault',
    message: 'Одна дверь повторилась с другим номером. Путь открыт, но доверять ему нельзя.',
    tags: ['maronary', 'wrong_door', 'door', 'route'],
  },
  {
    id: 'aftermath_maronary_green_rumor',
    title: 'Свидетели зелёного',
    variants: ['maronary'],
    floors: VOID_AND_CIVIL_SERVICE_FLOORS,
    weight: 12,
    cooldownSec: 660,
    maxRuns: 4,
    radius: 18,
    severity: 2,
    effect: 'rumor_seed',
    message: 'Соседи спорят, был ли зелёный свет. Тот, кто молчит, слышал пение дольше всех.',
    tags: ['maronary', 'green_source', 'rumor', 'witness'],
  },
  {
    id: 'aftermath_istotit_witness_roster',
    title: 'Ведомость укрытых',
    variants: ['istotit'],
    floors: CIVIL_FLOORS,
    weight: 16,
    cooldownSec: 720,
    maxRuns: 4,
    radius: 18,
    severity: 2,
    effect: 'rumor_seed',
    message: 'После Истотита соседи спорят, кого укрыло, а кого просто не досчитались.',
    tags: ['istotit', 'witness', 'social'],
  },
  {
    id: 'aftermath_istotit_church_cache',
    title: 'Открытый церковный запас',
    variants: ['istotit'],
    floors: CIVIL_FLOORS,
    weight: 13,
    cooldownSec: 780,
    maxRuns: 3,
    radius: 18,
    severity: 3,
    effect: 'container_theft',
    message: 'Золотая дверь оставила запас без присмотра. Святость кончилась раньше учета.',
    tags: ['istotit', 'container', 'theft'],
    itemId: 'holy_water',
  },
  {
    id: 'aftermath_istotit_golden_false_clear',
    title: 'Ложный золотой отбой',
    variants: ['istotit'],
    floors: CIVIL_FLOORS,
    weight: 10,
    cooldownSec: 840,
    maxRuns: 3,
    radius: 7,
    severity: 4,
    effect: 'false_all_clear',
    message: 'Колокол сказал отбой слишком красиво. Проверь пол: свет мог остаться туманом.',
    tags: ['istotit', 'false_clear', 'fog'],
    fogStrength: 115,
  },
  {
    id: 'aftermath_istotit_gilded_sborka',
    title: 'Позолоченная сборка',
    variants: ['istotit'],
    floors: CIVIL_FLOORS,
    weight: 9,
    cooldownSec: 900,
    maxRuns: 3,
    radius: 14,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'Хор ушёл в вентиляцию. В коридоре осталась тихая позолоченная сборка.',
    tags: ['istotit', 'monster', 'aftershock'],
    monsterKind: MonsterKind.SBORKA,
  },
  {
    id: 'aftermath_veretar_white_sand',
    title: 'Белый песок',
    variants: ['veretar'],
    floors: ALL_FLOORS,
    weight: 18,
    cooldownSec: 720,
    maxRuns: 5,
    radius: 9,
    severity: 3,
    effect: 'item_residue',
    message: 'В трещине остался белый песок. Он сухой, хотя рядом только бетон.',
    tags: ['veretar', 'residue', 'white_sand', 'sample'],
    itemId: 'veretar_sand',
  },
  {
    id: 'aftermath_veretar_overexposed_photo',
    title: 'Засвеченный кадр',
    variants: ['veretar'],
    floors: CIVIL_AND_SERVICE_FLOORS,
    weight: 8,
    cooldownSec: 840,
    maxRuns: 3,
    radius: 10,
    severity: 3,
    effect: 'item_residue',
    message: 'У щели лежит засвеченный кадр. На белом поле проступает чужая планировка; это улика, а не компас.',
    tags: ['veretar', 'photo', 'evidence', 'sample'],
    itemId: 'overexposed_photo',
  },
  {
    id: 'aftermath_veretar_area_door',
    title: 'Областная дверь',
    variants: ['veretar'],
    floors: ALL_FLOORS,
    weight: 15,
    cooldownSec: 540,
    maxRuns: 5,
    radius: 12,
    severity: 4,
    effect: 'door_fault',
    message: 'Одна дверь осталась с сухой белой щелью. Путь открыт, но он не обязан быть домом.',
    tags: ['veretar', 'door', 'area_leak', 'route'],
  },
  {
    id: 'aftermath_veretar_pale_eye',
    title: 'Областной глаз',
    variants: ['veretar'],
    floors: ALL_FLOORS,
    weight: 9,
    cooldownSec: 900,
    maxRuns: 3,
    radius: 16,
    severity: 4,
    effect: 'monster_aftershock',
    message: 'Белый свет ушёл, но глаз в коридоре ещё помнит наружу.',
    tags: ['veretar', 'monster', 'aftershock'],
    monsterKind: MonsterKind.EYE,
  },
  {
    id: 'aftermath_veretar_outside_rumor',
    title: 'Свидетели области',
    variants: ['veretar'],
    floors: CIVIL_AND_SERVICE_FLOORS,
    weight: 12,
    cooldownSec: 660,
    maxRuns: 4,
    radius: 18,
    severity: 2,
    effect: 'rumor_seed',
    message: 'Соседи спорят, было ли за белым окном небо. Ликвидаторы велят говорить: щель.',
    tags: ['veretar', 'rumor', 'social', 'witness'],
  },
];

let activeVariant: ActiveSamosborVariant | null = null;
let forcedNextVariant: SamosborVariantId | null = null;
let lastVariant: SamosborVariantId | null = null;

function floorWeight(def: SamosborVariantDef, floor: FloorLevel): number {
  if (!def.floors.includes(floor)) return 0;
  if (floor === FloorLevel.MINISTRY) {
    if (def.id === 'quiet' || def.id === 'electric') return def.weight * 1.8;
    if (def.id === 'istotit' || def.id === 'veretar') return def.weight * 2.2;
    if (def.id === 'classic') return def.weight * 0.75;
  }
  if (floor === FloorLevel.KVARTIRY || floor === FloorLevel.LIVING) {
    if (def.id === 'quiet' || def.id === 'electric') return def.weight * 1.45;
    if (def.id === 'istotit' || def.id === 'veretar') return def.weight * 3;
    if (def.id === 'wet' || def.id === 'meat') return def.weight * 1.2;
    if (def.id === 'classic') return def.weight * 0.9;
  }
  if (floor === FloorLevel.MAINTENANCE) {
    if (def.id === 'wet' || def.id === 'electric') return def.weight * 4;
    if (def.id === 'veretar') return def.weight * 1.6;
    if (def.id === 'classic') return def.weight * 0.65;
    if (def.id === 'meat') return def.weight * 0.6;
  }
  if (floor === FloorLevel.HELL) {
    if (def.id === 'meat') return def.weight * 5;
    if (def.id === 'wet') return def.weight * 1.4;
    if (def.id === 'maronary' || def.id === 'veretar') return def.weight * 1.6;
    if (def.id === 'classic') return def.weight * 0.6;
  }
  if (floor === FloorLevel.VOID) {
    if (def.id === 'veretar') return def.weight * 7;
    if (def.id === 'maronary') return def.weight * 3;
    if (def.id === 'quiet') return def.weight * 1.3;
    if (def.id === 'classic') return def.weight * 0.4;
  }
  return def.weight;
}

export function getSamosborVariantWeight(id: SamosborVariantId, floor: FloorLevel): number {
  const def = SAMOSBOR_VARIANTS.find(v => v.id === id);
  return def ? floorWeight(def, floor) : 0;
}

function buildActiveVariant(def: SamosborVariantDef): ActiveSamosborVariant {
  const modifiers = def.modifiers.map(id => SAMOSBOR_MODIFIERS[id]);
  let spawnMult = def.spawnMult;
  let fogSeedMult = 1;
  let fogSpawnIntervalMult = 1;
  let sealTimingDelta = def.sealTimingDelta;
  let noSiren = false;
  let extraEyes = 0;
  let shelterRoomCount = 0;

  for (const mod of modifiers) {
    spawnMult *= mod.spawnMult ?? 1;
    fogSeedMult *= mod.fogSeedMult ?? 1;
    fogSpawnIntervalMult *= mod.fogSpawnIntervalMult ?? 1;
    sealTimingDelta += mod.sealTimingDelta ?? 0;
    noSiren ||= mod.noSiren === true;
    extraEyes += mod.extraEyes ?? 0;
    shelterRoomCount += mod.shelterRoomCount ?? 0;
  }

  return {
    def,
    modifiers,
    durationMult: def.durationMult,
    spawnMult,
    fogSeedMult,
    fogSpawnIntervalMult,
    sealTimingDelta,
    noSiren,
    extraEyes,
    shelterRoomCount,
    fogColor: def.fogColor,
  };
}

export function chooseSamosborVariant(floor: FloorLevel): ActiveSamosborVariant {
  if (forcedNextVariant) {
    const forced = SAMOSBOR_VARIANTS.find(v => v.id === forcedNextVariant);
    forcedNextVariant = null;
    if (forced && forced.floors.includes(floor)) {
      activeVariant = buildActiveVariant(forced);
      lastVariant = activeVariant.def.id;
      return activeVariant;
    }
  }

  let total = 0;
  for (const def of SAMOSBOR_VARIANTS) total += floorWeight(def, floor);
  let roll = Math.random() * Math.max(1, total);
  for (const def of SAMOSBOR_VARIANTS) {
    roll -= floorWeight(def, floor);
    if (roll <= 0) {
      activeVariant = buildActiveVariant(def);
      lastVariant = activeVariant.def.id;
      return activeVariant;
    }
  }

  activeVariant = buildActiveVariant(SAMOSBOR_VARIANTS[0]);
  lastVariant = activeVariant.def.id;
  return activeVariant;
}

export function getActiveSamosborVariant(): ActiveSamosborVariant | null {
  return activeVariant;
}

export function clearActiveSamosborVariant(): void {
  activeVariant = null;
}

export function forceNextSamosborVariant(id: SamosborVariantId): boolean {
  if (!SAMOSBOR_VARIANTS.some(v => v.id === id)) return false;
  forcedNextVariant = id;
  return true;
}

export function cycleForcedSamosborVariant(): SamosborVariantId {
  const ids = SAMOSBOR_VARIANTS.map(v => v.id);
  const currentIdx = forcedNextVariant ? ids.indexOf(forcedNextVariant) : -1;
  const next = ids[(currentIdx + 1) % ids.length];
  forcedNextVariant = next;
  return next;
}

export function getForcedSamosborVariant(): SamosborVariantId | null {
  return forcedNextVariant;
}

export function getLastSamosborVariant(): SamosborVariantId | null {
  return lastVariant;
}

export function getSamosborVariantName(id: SamosborVariantId | null | undefined): string {
  if (!id) return '-';
  return SAMOSBOR_VARIANTS.find(v => v.id === id)?.displayName ?? id;
}

export function getSamosborAftermathBeats(
  variant: SamosborVariantId,
  floor: FloorLevel,
): readonly SamosborAftermathBeatDef[] {
  return SAMOSBOR_AFTERMATH_BEATS.filter(def => def.variants.includes(variant) && def.floors.includes(floor));
}

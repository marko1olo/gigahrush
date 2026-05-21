/* ── Monster ecology: spawn identity, counterplay, and loot hints ── */

import { FloorLevel, MonsterKind, RoomType } from '../core/types';

export interface MonsterRareDrop {
  itemId: string;
  chance: number;
  count?: number;
}

export interface MonsterEcologyDef {
  kind: MonsterKind;
  role?: string;
  cue?: string;
  rule?: string;
  floorFit?: string;
  floors: readonly FloorLevel[];
  rooms: readonly RoomType[];
  variants: readonly string[];
  spawnWeight: number;
  minSamosborCount: number;
  rare: boolean;
  lootHint: string;
  counterplay: string;
  deathLogHint?: string;
  rumorIds: readonly string[];
  rareDrops: readonly MonsterRareDrop[];
}

export type MonsterCueTaskChannel = 'data' | 'text' | 'sprite' | 'audio';

export interface MonsterCueTask {
  id: string;
  kind: MonsterKind;
  channel: MonsterCueTaskChannel;
  cue: string;
  task: string;
}

export interface MonsterEcologyQuery {
  floor: FloorLevel;
  roomType?: RoomType;
  floorTags?: readonly string[];
  roomTags?: readonly string[];
  samosborCount?: number;
  allowRare?: boolean;
  allowOffFloor?: boolean;
  floorAffinity?: 'strict' | 'weighted' | 'none';
  excludeKinds?: readonly MonsterKind[];
  rng?: () => number;
  biasKinds?: readonly MonsterKind[];
  routePressure?: number;
}

export interface MonsterEcologyRank {
  kind: MonsterKind;
  weight: number;
  ecology: MonsterEcologyDef;
}

const CIVIL: readonly FloorLevel[] = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING];
const DEEP: readonly FloorLevel[] = [FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID];
const ALL_BUT_VOID: readonly FloorLevel[] = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL];
const NATIVE_FLOOR_MULT = 2.4;
const BIAS_KIND_MULT = 2.7;
const ROUTE_PRESSURE_KINDS: readonly MonsterKind[] = [
  MonsterKind.EYE,
  MonsterKind.SHADOW,
  MonsterKind.NELYUD,
  MonsterKind.POLZUN,
  MonsterKind.REBAR,
  MonsterKind.TUBE_EEL,
  MonsterKind.LAMPOVY,
  MonsterKind.PECHATEED,
  MonsterKind.PARAGRAPH,
  MonsterKind.SAFEGUARD,
];

export const BAIT_ATTRACTED_MONSTER_KINDS: readonly MonsterKind[] = [
  MonsterKind.KRYSNOZHKA,
  MonsterKind.SBORKA,
  MonsterKind.TVAR,
  MonsterKind.POLZUN,
  MonsterKind.TUBE_EEL,
];

export function isBaitAttractedMonster(kind: MonsterKind | undefined): boolean {
  return kind !== undefined && BAIT_ATTRACTED_MONSTER_KINDS.includes(kind);
}

export const MONSTER_COUNTERPLAY_CUE_TASKS: readonly MonsterCueTask[] = [
  {
    id: 'cue_sborka_wire_crackle_audio',
    kind: MonsterKind.SBORKA,
    channel: 'audio',
    cue: 'Треск проволоки до контакта.',
    task: 'Добавить короткий procedural crackle при первом sighted/windup pack spawn, чтобы сборка читалась до укуса.',
  },
  {
    id: 'cue_krysnozhka_garbage_motion_sprite',
    kind: MonsterKind.KRYSNOZHKA,
    channel: 'sprite',
    cue: 'Мусор шевелится и выдает стаю.',
    task: 'Дать помойной/обычной крысоножке маленький garbage-flicker кадр или floor mark перед первым рывком.',
  },
  {
    id: 'cue_tvar_panel_scratch_text',
    kind: MonsterKind.TVAR,
    channel: 'text',
    cue: 'Панель царапает сама себя.',
    task: 'Связать sighted/log text с wallBias, чтобы игрок видел причину держать центр комнаты.',
  },
  {
    id: 'cue_polzun_wet_drag_audio',
    kind: MonsterKind.POLZUN,
    channel: 'audio',
    cue: 'Мокрый drag-sound перед дверью или ванной.',
    task: 'Добавить низкий мокрый звук при входе ползуна в door/water/bathroom kill cell.',
  },
  {
    id: 'cue_zombie_crowd_grab_death_text',
    kind: MonsterKind.ZOMBIE,
    channel: 'text',
    cue: 'Смерть объясняет толпу, кухню или дверной хват.',
    task: 'Добавить death-log wording для мертвяка, чтобы ошибка была социальной/позиционной, а не просто HP.',
  },
  {
    id: 'cue_lampovy_light_flicker_data',
    kind: MonsterKind.LAMPOVY,
    channel: 'data',
    cue: 'Лампа гудит и отмечает опасный радиус.',
    task: 'Пробросить lampPowered cue в event data/HUD hint рядом с Feature.LAMP без per-frame full-world scan.',
  },
  {
    id: 'cue_pechateed_paper_rustle_text',
    kind: MonsterKind.PECHATEED,
    channel: 'text',
    cue: 'Шелест бумаги идет из кармана игрока.',
    task: 'Показывать короткий local log, когда documentHunter выбирает цель из-за документов.',
  },
  {
    id: 'cue_tube_eel_water_ripple_sprite',
    kind: MonsterKind.TUBE_EEL,
    channel: 'sprite',
    cue: 'Вода рябит против течения до рывка угря.',
    task: 'Добавить дешевый water ripple mark на route-set-piece клетках угря и в debug pack рядом с водой.',
  },
];

export const MONSTER_ECOLOGY: readonly MonsterEcologyDef[] = [
  {
    kind: MonsterKind.SBORKA,
    role: 'Быстрый слабый расход патронов и проверка широкого прохода.',
    cue: 'Треск проволоки, мелкий топот и несколько силуэтов перед контактом.',
    rule: 'Догоняет первой и опасна числом, но падает от дешевого раннего выстрела; реагирует на приманку.',
    floorFit: 'Гражданские коридоры, кладовые и самосборные хвосты почти везде кроме Пустоты.',
    floors: ALL_BUT_VOID,
    rooms: [RoomType.CORRIDOR, RoomType.COMMON, RoomType.STORAGE],
    variants: ['cracked_sborka', 'fog_sborka'],
    spawnWeight: 8.5,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'проволока, кладовой мусор, редкая изолента из треснувшего узла',
    counterplay: 'Быстрая, слабая и часто не одна: принимайте в широком месте, гасите дешевым выстрелом и не тратьте последний магазин на первую.',
    deathLogHint: 'Смерть от сборки должна читать ошибку как поздний выстрел, узкий поворот или пустой магазин.',
    rumorIds: ['monster_sborka_fast', 'ecology_sborka_swarm'],
    rareDrops: [{ itemId: 'duct_tape', chance: 0.03 }],
  },
  {
    kind: MonsterKind.KRYSNOZHKA,
    role: 'Пищевая мусорная стая, которая превращает запас еды в маршрутный риск.',
    cue: 'Мусор шевелится, лапки скребут у кухни, приманка пахнет сильнее кармана.',
    rule: 'Первый рывок слабый, но стая идет на помеченную еду или говняк и быстро окружает в быту.',
    floorFit: 'Кухни, кладовые и мусорные проходы Квартир, Жилой зоны и Коллекторов.',
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    rooms: [RoomType.KITCHEN, RoomType.STORAGE, RoomType.CORRIDOR, RoomType.COMMON],
    variants: ['garbage_krysnozhka'],
    spawnWeight: 3.2,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'мелкие лапки, грязный жир, мусор гнезда, редкое сырое мясо',
    counterplay: 'Не кормите рой карманом: бросьте меченую приманку дальше себя, заведите через липкую ловушку или сбейте первый рывок дробью.',
    deathLogHint: 'Смерть от крысоножки должна напоминать про еду в кармане, позднюю дробь или бой в мусоре.',
    rumorIds: ['ecology_krysnozhka_bait'],
    rareDrops: [{ itemId: 'rawmeat', chance: 0.04 }],
  },
  {
    kind: MonsterKind.TVAR,
    role: 'Средняя ближняя угроза, заставляющая держать дистанцию от бетонной кромки.',
    cue: 'Бетон царапает сам себя, лапа тянется из-за панели, силуэт держит стену.',
    rule: 'У стены и рядом с прижатой целью тварь бьет дальше и больнее; в центре комнаты теряет преимущество.',
    floorFit: 'Жилые и технические коридоры, общие комнаты и склады до Мясного низа.',
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.CORRIDOR, RoomType.LIVING, RoomType.COMMON, RoomType.STORAGE],
    variants: ['panel_tvar', 'hungry_tvar'],
    spawnWeight: 6.2,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'сырая органика, бетонная крошка у лап, редкий кусок мяса',
    counterplay: 'Держите полторы клетки, центр комнаты и запас назад: у бетонной кромки тварь достает дальше, а приманка срывает погоню.',
    deathLogHint: 'Смерть от твари должна указывать на прижатие к панели, слишком короткую дистанцию или проигнорированную приманку.',
    rumorIds: ['monster_tvar_walls', 'ecology_tvar_wall'],
    rareDrops: [{ itemId: 'rawmeat', chance: 0.04 }],
  },
  {
    kind: MonsterKind.POLZUN,
    role: 'Медленный танк, который превращает двери, воду и сантехнику в ловушку.',
    cue: 'Мокрый шорох у пола, тяжелое ползание под дверью, вода отвечает раньше шага.',
    rule: 'Снаружи тесных клеток кайтится, но в дверях, ванной и воде получает убийный контакт.',
    floorFit: 'Склады, ванные, производственные лотки и мокрые коридоры Жилой зоны, Коллекторов и Ада.',
    floors: [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.CORRIDOR, RoomType.BATHROOM, RoomType.PRODUCTION, RoomType.STORAGE],
    variants: ['wet_polzun', 'silent_polzun'],
    spawnWeight: 4.3,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'мокрая ветошь, ванная грязь, редкий фильтрующий слой',
    counterplay: 'Не принимайте бой в дверях, ванной или воде: ползун медленный, но там уже рядом. Прямой отход дает время расстрелять.',
    deathLogHint: 'Смерть от ползуна должна читать ошибку как бой в двери, ванной, воде или отход без прямой линии.',
    rumorIds: ['monster_polzun_floor', 'ecology_polzun_low'],
    rareDrops: [{ itemId: 'filter_layer', chance: 0.04 }],
  },
  {
    kind: MonsterKind.BETONNIK,
    role: 'Редкая тяжелая бетонная угроза, которая закрывает прямой коридор.',
    cue: 'Коридор дрожит, бетон осыпается, слабый проем стонет до появления.',
    rule: 'Прямой размен проигран; углы, шум, огонь и запечатывание проема покупают путь или отход.',
    floorFit: 'Редкие тяжелые встречи в гражданских этажах, Коллекторах, Аду и Пустоте.',
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.PRODUCTION, RoomType.HQ, RoomType.COMMON],
    variants: ['betonoed'],
    spawnWeight: 0.65,
    minSamosborCount: 4,
    rare: true,
    lootHint: 'арматурная крошка, бетонные осколки, редкий теплый бетонный сгусток',
    counterplay: 'Не разменивайтесь ударами в прямом коридоре: обходите углами, держите выносливость, отвлекайте шумом, огнем или запечатанным проемом.',
    deathLogHint: 'Смерть от бетонника должна объяснять, что игрок остался в прямом коридоре без угла, шума, огня или печати.',
    rumorIds: ['monster_betonnik_heavy', 'ecology_betonnik_weight'],
    rareDrops: [{ itemId: 'rebar', chance: 0.06 }, { itemId: 'psi_concrete_splinter', chance: 0.02 }],
  },
  {
    kind: MonsterKind.ZOMBIE,
    role: 'Бывший жилец, опасный в толпе, кухне и дверном заторе.',
    cue: 'Сосед идет без взгляда, толпа расступается поздно, хват появляется у двери.',
    rule: 'Один мертвяк читается, но в людях и дверях хватает раньше, чем его удобно добить.',
    floorFit: 'Жилые, кухонные, общие и офисные комнаты на всех непустотных маршрутах.',
    floors: ALL_BUT_VOID,
    rooms: [RoomType.LIVING, RoomType.KITCHEN, RoomType.COMMON, RoomType.OFFICE],
    variants: ['office_zombie', 'wild_zombie'],
    spawnWeight: 3.4,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'карманный бытовой хлам, чужая записка, редкие сигареты',
    counterplay: 'Не подпускайте через толпу, кухню или палату: выводите мертвяка на пустой проход и добивайте до первого хвата.',
    deathLogHint: 'Смерть от мертвяка должна показывать, что игрок пустил его в толпу, кухню или дверной хват.',
    rumorIds: ['monster_zombie_human', 'ecology_zombie_neighbor'],
    rareDrops: [{ itemId: 'note', chance: 0.05 }, { itemId: 'cigs', chance: 0.03 }],
  },
  {
    kind: MonsterKind.EYE,
    role: 'Дальний враг линии обзора, который ломает открытую коридорную стрельбу.',
    cue: 'Зеленый разогрев, ламповый взгляд и пауза перед болтом.',
    rule: 'Если линия видимости не сломана до вспышки, летит болт; после залпа есть окно сближения.',
    floorFit: 'Коридоры, офисы, производство и поздние открытые комнаты от Министерства до Пустоты.',
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.OFFICE, RoomType.PRODUCTION, RoomType.COMMON],
    variants: ['blind_eye', 'black_slime_eye', 'lamp_eye'],
    spawnWeight: 3.1,
    minSamosborCount: 3,
    rare: false,
    lootHint: 'перегоревшая нить, стеклянная пыль, редкая лампа или ПСИ-пыль',
    counterplay: 'Зеленый разогрев предупреждает выстрел: дверь, угол или колонна до вспышки сбивают залп, после выстрела можно сближаться.',
    deathLogHint: 'Смерть от глаза должна читать открытую линию, поздний угол или сближение до окончания залпа.',
    rumorIds: ['monster_eye_lamps', 'ecology_eye_line'],
    rareDrops: [{ itemId: 'lamp_bulb', chance: 0.05 }, { itemId: 'psi_dust', chance: 0.02 }],
  },
  {
    kind: MonsterKind.NIGHTMARE,
    role: 'Редкое давление, где правильный выбор - короткий burst или немедленный уход.',
    cue: 'Мысли громче сирены, комната кажется теснее, выход за спиной становится важным.',
    rule: 'Длинный бой усиливает давление; победа требует тяжелого урона сразу или отказа от комнаты.',
    floorFit: 'Общие, штабные, медицинские и коридорные комнаты на опасных маршрутах всех этажей.',
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.COMMON, RoomType.HQ, RoomType.MEDICAL, RoomType.CORRIDOR],
    variants: ['court_nightmare', 'wet_nightmare'],
    spawnWeight: 1.4,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'психический налет, ПСИ-пыль, редкий антидепрессант из кармана жертвы',
    counterplay: 'Не играйте в длинный бой: либо сразу тратьте тяжелый урон с выходом за спиной, либо уходите до давления.',
    deathLogHint: 'Смерть от кошмарища должна указывать на затянутый бой без выхода или без тяжелого урона.',
    rumorIds: ['ecology_nightmare_pressure'],
    rareDrops: [{ itemId: 'psi_dust', chance: 0.06 }, { itemId: 'antidep', chance: 0.02 }],
  },
  {
    kind: MonsterKind.SHADOW,
    role: 'Темный ambush-монстр, который проверяет свет, движение и широкий отход.',
    cue: 'Силуэт сжимается в темном углу, тень остается после тела, воздух холодеет.',
    rule: 'В темноте готовит рывок; свет, фонарь, шаг назад или открытое место срывают удар.',
    floorFit: 'Коридоры, курилки, офисы и общие комнаты гражданских этажей, Ада и Пустоты.',
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.SMOKING, RoomType.OFFICE, RoomType.COMMON],
    variants: ['deep_shadow', 'thin_shadow'],
    spawnWeight: 3.6,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'темный след, холодная пыль, редкий странный сгусток',
    counterplay: 'В темноте теневик делает короткий рывок перед ударом. Свет, фонарь или шаг назад срывают рывок и режут урон.',
    deathLogHint: 'Смерть от теневика должна объяснять темный угол, отсутствие света или шаг в упор вместо отхода.',
    rumorIds: ['monster_shadow_silence', 'ecology_shadow_afterimage'],
    rareDrops: [{ itemId: 'strange_clot', chance: 0.03 }],
  },
  {
    kind: MonsterKind.REBAR,
    role: 'Складской debris-lurker, который притворяется ровным железом у стен.',
    cue: 'Ровная арматура лежит слишком тихо, металл звенит до удара, пол отмечен резами.',
    rule: 'У стен, стеллажей и станков быстрее выходит из укрытия; в центре лучше читается и расстреливается.',
    floorFit: 'Производство, склады и коридоры Жилой зоны, Коллекторов, Ада и Пустоты.',
    floors: [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.PRODUCTION, RoomType.STORAGE, RoomType.CORRIDOR],
    variants: ['rebar_veteran', 'rust_rebar'],
    spawnWeight: 1.1,
    minSamosborCount: 5,
    rare: true,
    lootHint: 'тяжелый металл, витая проволока, редкий годный прут арматуры',
    counterplay: 'Обходите ровное железо у стен и складов: арматура звенит перед ударом, а дистанция лучше рукопашной.',
    deathLogHint: 'Смерть от арматуры должна указывать на наступание на ровный металл, стену или складскую стойку.',
    rumorIds: ['monster_rebar_metal', 'ecology_rebar_still'],
    rareDrops: [{ itemId: 'rebar', chance: 0.08 }, { itemId: 'wire_coil', chance: 0.04 }],
  },
  {
    kind: MonsterKind.MATKA,
    role: 'Spawner-boss, где игрок выбирает: убить источник, чистить приплод или уйти.',
    cue: 'Мокрые удары за стеной, приплод у входа, комната звучит как гнездо.',
    rule: 'Если тянуть бой, capped-приплод заполняет проход и превращает отход в задачу.',
    floorFit: 'Штабные, общие и производственные комнаты Коллекторов, Ада и Пустоты.',
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.HQ, RoomType.COMMON, RoomType.PRODUCTION, RoomType.CORRIDOR],
    variants: ['choir_matka'],
    spawnWeight: 0.45,
    minSamosborCount: 4,
    rare: true,
    lootHint: 'маточный узел, теплая слизь, редкая мясная руна после зачистки',
    counterplay: 'Сначала решите: быстро убить матку или чистить приплод. Если тянуть оба плана, комната заполнится приплодом и отход станет тесным.',
    deathLogHint: 'Смерть от матки должна читать смешанный план: игрок не убил источник, не чистил приплод и потерял отход.',
    rumorIds: ['monster_matka_spawn', 'ecology_matka_children'],
    rareDrops: [{ itemId: 'meat_rune', chance: 0.05 }, { itemId: 'rawmeat', chance: 0.12 }],
  },
  {
    kind: MonsterKind.IDOL,
    role: 'Неподвижная ПСИ-турель, которая наказывает среднюю дистанцию.',
    cue: 'Черная фигурка смотрит даже спиной, воздух щелкает перед ПСИ-выстрелом.',
    rule: 'Не двигается, но держит открытую среднюю линию; угол, дверь или упор ломают задачу.',
    floorFit: 'Офисы, склады, курилки и штабы Министерства, Жилой зоны, Ада и Пустоты.',
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.STORAGE, RoomType.OFFICE, RoomType.SMOKING, RoomType.HQ],
    variants: ['office_idol'],
    spawnWeight: 0.9,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'ПСИ-пыль, холодный культовый камень, редкий идол Чернобога или меточный сгусток',
    counterplay: 'Не стойте на средней дистанции: сбивайте угол выстрела или входите в упор к неподвижному идолу.',
    deathLogHint: 'Смерть от идола должна указывать на открытую среднюю дистанцию вместо угла, двери или упора.',
    rumorIds: ['monster_idol_static', 'ecology_idol_stares'],
    rareDrops: [{ itemId: 'idol_chernobog', chance: 0.03 }, { itemId: 'psi_mark', chance: 0.015 }],
  },
  {
    kind: MonsterKind.MANCOBUS,
    role: 'Командирская тяжелая угроза: охрана плюс секторный дальний бой.',
    cue: 'Мелочь вокруг начинает действовать организованно, тяжелый корпус держит прямой сектор.',
    rule: 'Сначала снять охрану и разбить линию колонной; прямой вход кормит залпы и окружение.',
    floorFit: 'Производственные, штабные и общие комнаты Коллекторов и Ада.',
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.HQ, RoomType.PRODUCTION, RoomType.COMMON],
    variants: [],
    spawnWeight: 0.32,
    minSamosborCount: 6,
    rare: true,
    lootHint: 'жирный металл, командная органика, энергоячейка, бутылка с голосом',
    counterplay: 'Сначала снимайте охрану, затем бейте с углов между залпами: стены и колонны ломают прямой сектор Манкобуса.',
    deathLogHint: 'Смерть от манкобуса должна объяснять прямой сектор, живую охрану или отсутствие укрытия между залпами.',
    rumorIds: ['ecology_mancobus_orders'],
    rareDrops: [{ itemId: 'ammo_energy', chance: 0.08 }, { itemId: 'bottled_voice', chance: 0.03 }],
  },
  {
    kind: MonsterKind.HERALD,
    role: 'Hell watcher: открытая линия, потолочный голос и наказание за задержку.',
    cue: 'Сверху шепчет сирена, потолок следит, проход становится слишком открытым.',
    rule: 'Держит линию и слушание; дверь, угол или колонна между залпами важнее дуэли.',
    floorFit: 'Пороговые общие, штабные и коридорные зоны Мясного низа.',
    floors: [FloorLevel.HELL],
    rooms: [RoomType.COMMON, RoomType.HQ, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 0.28,
    minSamosborCount: 5,
    rare: true,
    lootHint: 'осколок сирены, бирка порога, бутылка с голосом',
    counterplay: 'Держите дверь, угол или колонну между залпами: Вестник наказывает открытую линию и тех, кто слишком долго слушает.',
    deathLogHint: 'Смерть от вестника должна указывать на открытый коридор, отсутствие укрытия или слишком долгое слушание.',
    rumorIds: ['ecology_herald_ceiling'],
    rareDrops: [{ itemId: 'siren_shard', chance: 0.06 }, { itemId: 'bottled_voice', chance: 0.04 }],
  },
  {
    kind: MonsterKind.CREATOR,
    role: 'Финальный void-босс: ресурс, укрытие и зеленый контур как экзамен.',
    cue: 'Белый силуэт правит расстояние, зеленый свет отмечает ошибочный путь.',
    rule: 'Открытая линия и пустой запас проигрывают; укрытие между залпами и выход за спиной решают бой.',
    floorFit: 'Финальные общие и штабные пространства Пустоты.',
    floors: [FloorLevel.VOID],
    rooms: [RoomType.COMMON, RoomType.HQ],
    variants: [],
    spawnWeight: 0,
    minSamosborCount: 99,
    rare: true,
    lootHint: 'пустотный шип, белая пыль, пустая квитанция протокола',
    counterplay: 'Входите с полным запасом: держите укрытие между залпами, уходите из зеленого света и не тратьте рывок без выхода.',
    deathLogHint: 'Смерть от Творца должна читать пустой запас, стояние в зеленом свете или рывок без выхода.',
    rumorIds: ['ecology_creator_white'],
    rareDrops: [{ itemId: 'void_spike', chance: 0.12 }],
  },
  {
    kind: MonsterKind.SAFEGUARD,
    role: 'Быстрый late-game охранитель НЕТ/БЛЕЙМ-ветки с коротким клинковым windup.',
    cue: 'Белый человекообразный корпус замирает, красно-циановая щель пишет отказ, клинки расходятся до рывка.',
    rule: 'Очень быстр, но режет честно: стена, дверь, машина или аппарат рвут линию, дробь сбивает замах.',
    floorFit: 'Редкие глубокие офисы, штабы, производства и коридоры Коллекторов и Пустоты, плюс терминальный backlash.',
    floors: [FloorLevel.MAINTENANCE, FloorLevel.VOID],
    rooms: [RoomType.OFFICE, RoomType.HQ, RoomType.PRODUCTION, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 0.18,
    minSamosborCount: 7,
    rare: true,
    lootHint: 'белая пластина, черный суставной штифт, редкая плата отказа',
    counterplay: 'Не принимайте его в прямом коридоре: ломайте линию стеной, дверью, машиной или аппаратом, а дробью сбивайте короткий замах.',
    deathLogHint: 'Смерть от сейфгарда должна указывать на прямой коридор, открытый терминал или несбитый белый замах.',
    rumorIds: ['monster_safeguard_access_denied', 'ecology_safeguard_windup', 'ecology_safeguard_shotgun'],
    rareDrops: [{ itemId: 'circuit_board', chance: 0.07 }, { itemId: 'relay_diagram', chance: 0.03 }],
  },
  {
    kind: MonsterKind.SPIRIT,
    role: 'Фазирующий преследователь, который отменяет привычную безопасность двери и стены.',
    cue: 'Холодный сквозняк идет против двери, лицо-череп появляется не с той стороны стены.',
    rule: 'Стены не держат контакт; спасает смена позиции, дистанция и сбитый УФ-светом темп.',
    floorFit: 'Коридоры, офисы, штабы и общие пространства Министерства, Ада и Пустоты.',
    floors: [FloorLevel.MINISTRY, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.OFFICE, RoomType.HQ, RoomType.COMMON],
    variants: ['false_spirit'],
    spawnWeight: 1.1,
    minSamosborCount: 4,
    rare: true,
    lootHint: 'пустая записка, холодный сквозняк, редкая ПСИ-пыль',
    counterplay: 'Меняйте позицию до контакта: двери и стены духа не держат, помогает дистанция и сбитый УФ-светом темп.',
    deathLogHint: 'Смерть от духа должна объяснять попытку закрыться дверью или стеной вместо смены позиции.',
    rumorIds: ['ecology_spirit_wall'],
    rareDrops: [{ itemId: 'psi_dust', chance: 0.05 }, { itemId: 'void_spike', chance: 0.015 }],
  },
  {
    kind: MonsterKind.ROBOT,
    role: 'Индустриальный дальний автомат, который проверяет прямую линию и паузу после залпа.',
    cue: 'Плазма заряжается, мокрый проход гудит, корпус замирает перед выстрелом.',
    rule: 'Прямая линия опасна, особенно в воде; после залпа есть короткая пауза для захода.',
    floorFit: 'Производственные, штабные, коридорные и офисные зоны Министерства и Коллекторов.',
    floors: [FloorLevel.MINISTRY, FloorLevel.MAINTENANCE],
    rooms: [RoomType.PRODUCTION, RoomType.HQ, RoomType.CORRIDOR, RoomType.OFFICE],
    variants: ['pipe_robot'],
    spawnWeight: 1.4,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'электронный лом, плата, проводка, редкая энергоячейка',
    counterplay: 'Уходите с прямой линии плазмы и бейте после залпа. В мокром проходе не стойте: там плазменный луч попадает чаще.',
    deathLogHint: 'Смерть от робота должна указывать на мокрую прямую линию или вход до паузы после плазмы.',
    rumorIds: ['ecology_robot_plasma'],
    rareDrops: [{ itemId: 'ammo_energy', chance: 0.07 }, { itemId: 'circuit_board', chance: 0.06 }],
  },
  {
    kind: MonsterKind.SHOVNIK,
    role: 'Охотник по швам, который делает стену плохим местом для рукопашной.',
    cue: 'Белый шов пахнет резиной, стена щелкает, силуэт скользит вдоль панели.',
    rule: 'У стены и шва ускоряется и бьет больнее; в центре комнаты теряет ход.',
    floorFit: 'Гражданские коридоры, жилые, офисные и общие комнаты.',
    floors: CIVIL,
    rooms: [RoomType.CORRIDOR, RoomType.LIVING, RoomType.OFFICE, RoomType.COMMON],
    variants: [],
    spawnWeight: 3.2,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'резиновая крошка, герметичный мусор, редкий гермоуплотнитель',
    counterplay: 'Выводите в центр комнаты: у стен и швов шовник быстрее и больнее бьет, без кромки теряет ход.',
    deathLogHint: 'Смерть от шовника должна читать бой у стены или шва вместо вывода в центр.',
    rumorIds: ['ecology_shovnik_seams'],
    rareDrops: [{ itemId: 'hermo_gasket', chance: 0.05 }, { itemId: 'sealant_tube', chance: 0.03 }],
  },
  {
    kind: MonsterKind.LAMPOVY,
    role: 'Световой паразит, который превращает лампу в опасную позицию.',
    cue: 'Лампа гудит как зуб, озон висит в проходе, силуэт держится у света.',
    rule: 'Рядом с лампой бьет сильнее; три клетки, темный коридор, угол или выключатель режут преимущество.',
    floorFit: 'Освещенные коридоры, офисы, общие и производственные комнаты до Коллекторов.',
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    rooms: [RoomType.CORRIDOR, RoomType.OFFICE, RoomType.COMMON, RoomType.PRODUCTION],
    variants: [],
    spawnWeight: 2.8,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'перегоревшая нить, стекло, запах озона, редкий предохранитель',
    counterplay: 'Не деритесь под лампой: отведите его на три клетки от света, в темный коридор или за угол.',
    deathLogHint: 'Смерть от лампового должна указывать на бой под лампой без отхода, угла или выключателя.',
    rumorIds: ['ecology_lampovy_light'],
    rareDrops: [{ itemId: 'lamp_bulb', chance: 0.06 }, { itemId: 'fuse', chance: 0.04 }],
  },
  {
    kind: MonsterKind.PECHATEED,
    role: 'Бумажный хищник, который делает документы боевым запахом.',
    cue: 'Кислые чернила, шелест без бумаги, печать облизывает воздух рядом с карманом.',
    rule: 'Дальше чует цели с документами; контейнер, сброс лишних бумаг и углы сокращают преследование.',
    floorFit: 'Офисы, общие, курилки и коридоры гражданских этажей.',
    floors: CIVIL,
    rooms: [RoomType.OFFICE, RoomType.COMMON, RoomType.SMOKING, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 2.6,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'обглоданный бланк, кислые чернила, пустой формуляр без подписи',
    counterplay: 'Сбросьте лишние записки, бланки и ключи в ящик: с бумажным запахом печатеед чует дальше, через углы теряет нюх.',
    deathLogHint: 'Смерть от печатееда должна указывать на бумажный запах, неразгруженный инвентарь или прямую погоню без углов.',
    rumorIds: ['ecology_pechateed_docs'],
    rareDrops: [{ itemId: 'ink_bottle', chance: 0.05 }, { itemId: 'blank_form', chance: 0.04 }],
  },
  {
    kind: MonsterKind.TUBE_EEL,
    role: 'Водный pipe-ambusher, который диктует маршрут через сухую кромку.',
    cue: 'Вода щелкает, манометр дрожит, лоток рябит против течения.',
    rule: 'В воде резко ускоряется; сухой край, мост, гарпун и приманка возвращают игроку темп.',
    floorFit: 'Затопленные коридоры, производство, склады и ванные Коллекторов.',
    floors: [FloorLevel.MAINTENANCE],
    rooms: [RoomType.CORRIDOR, RoomType.PRODUCTION, RoomType.STORAGE, RoomType.BATHROOM],
    variants: [],
    spawnWeight: 4.3,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'ржавая слизь, манометр, обломок трубы из затопленного лотка',
    counterplay: 'Выходите из воды: сухая кромка и мост режут рывок угря. Гарпун бьет через лоток, приманка уводит с маршрута.',
    deathLogHint: 'Смерть от трубного угря должна читать шаг в воду, отказ от сухой кромки, гарпуна или приманки.',
    rumorIds: ['ecology_eel_water'],
    rareDrops: [{ itemId: 'manometer', chance: 0.05 }, { itemId: 'pipe', chance: 0.03 }],
  },
  {
    kind: MonsterKind.PARAGRAPH,
    role: 'Дальний бюрократический стрелок, где укрытие важнее спора с текстом.',
    cue: 'Формулировка шуршит без бумаги, строка выпрямляется на 15 клеток.',
    rule: 'Стреляет по прямой линии; шкаф, дверь или угол ломают пункт, а после залпа нужно сближаться.',
    floorFit: 'Офисы, штабы, коридоры и общие комнаты Министерства и Пустоты.',
    floors: [FloorLevel.MINISTRY, FloorLevel.VOID],
    rooms: [RoomType.OFFICE, RoomType.HQ, RoomType.CORRIDOR, RoomType.COMMON],
    variants: [],
    spawnWeight: 1.5,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'порванный приказ, сургучная пыль, обрывки шевелящегося приказа',
    counterplay: 'Ломайте линию видимости шкафом, дверью или углом и сближайтесь сразу после залпа: в упоре параграф теряет дистанцию.',
    deathLogHint: 'Смерть от параграфа должна указывать на открытую линию текста или чтение приказа без укрытия.',
    rumorIds: ['ecology_paragraph_clause'],
    rareDrops: [{ itemId: 'unsigned_order', chance: 0.05 }, { itemId: 'psi_order_seal', chance: 0.015 }],
  },
  {
    kind: MonsterKind.NELYUD,
    role: 'Ложный человек, который проверяет подозрение, дистанцию, свидетеля и свет.',
    cue: 'Сосед не моргает, отражение не сходится, терпеливо ждет вашего шага.',
    rule: 'Долго похож на человека и раскрывается близко; дистанция, свидетель, свет и свободный выход сохраняют выбор.',
    floorFit: 'Жилые, кухонные, общие и коридорные пространства гражданских этажей.',
    floors: CIVIL,
    rooms: [RoomType.LIVING, RoomType.KITCHEN, RoomType.COMMON, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 1.2,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'фальшивый пропуск, чужой ключ без царапин, редкий детектор нелюдей',
    counterplay: 'Проверяйте дистанцией: нелюдь раскрывается поздно, поэтому не подпускайте слишком спокойного соседа без света и выхода.',
    deathLogHint: 'Смерть от нелюди должна читать доверчивое сближение без света, свидетеля или пути отхода.',
    rumorIds: ['ecology_nelyud_close'],
    rareDrops: [{ itemId: 'fake_pass', chance: 0.04 }, { itemId: 'unpeople_detector', chance: 0.015 }],
  },
  {
    kind: MonsterKind.KOSTOREZ,
    role: 'Элитный windup-рукопашник, которого нужно читать до рывка.',
    cue: 'Пилы поднимаются, воздух скребет, на полу параллельные резы.',
    rule: 'Опасен в конце замаха; три шага, угол, колонна, дробь или бронелист срывают смертельный темп.',
    floorFit: 'Производственные, складские и коридорные зоны Коллекторов и Ада.',
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.PRODUCTION, RoomType.STORAGE, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 0.35,
    minSamosborCount: 6,
    rare: true,
    lootHint: 'резаный металл, бронелист, обломок арматуры',
    counterplay: 'Читайте замах: три шага, угол или колонна отменяют рывок, дробь сбивает пилы, бронелист принимает один рез.',
    deathLogHint: 'Смерть от костореза должна указывать на стояние в замахе без трех шагов, угла, дроби или бронелиста.',
    rumorIds: ['monster_kostorez_cuts', 'ecology_kostorez_windup', 'ecology_kostorez_shotgun', 'lead_maintenance_kostorez_locker'],
    rareDrops: [{ itemId: 'metal_sheet', chance: 0.08 }, { itemId: 'rebar', chance: 0.06 }],
  },
];

export const MONSTER_ECOLOGY_BY_KIND: Partial<Record<MonsterKind, MonsterEcologyDef>> = {};

for (const def of MONSTER_ECOLOGY) {
  MONSTER_ECOLOGY_BY_KIND[def.kind] = def;
}

export function getMonsterEcology(kind: MonsterKind | undefined): MonsterEcologyDef | undefined {
  return kind === undefined ? undefined : MONSTER_ECOLOGY_BY_KIND[kind];
}

interface MonsterEcologyContext {
  tags: readonly string[];
  anchorTags?: readonly string[];
  avoidTags?: readonly string[];
  anchorPenalty?: number;
  avoidPenalty?: number;
}

const MONSTER_ECOLOGY_CONTEXT: Partial<Record<MonsterKind, MonsterEcologyContext>> = {
  [MonsterKind.SBORKA]: {
    tags: ['corridor', 'storage', 'swarm', 'samosbor', 'meat', 'food', 'fog', 'crowd'],
    anchorTags: ['corridor', 'storage', 'samosbor', 'meat', 'food', 'crowd'],
  },
  [MonsterKind.KRYSNOZHKA]: {
    tags: ['residential', 'kitchen', 'storage', 'food', 'garbage', 'crowd', 'swarm'],
    anchorTags: ['kitchen', 'storage', 'food', 'garbage', 'residential'],
  },
  [MonsterKind.TVAR]: {
    tags: ['residential', 'corridor', 'wall', 'predator', 'meat', 'smog', 'infection'],
    anchorTags: ['residential', 'corridor', 'wall', 'predator', 'meat'],
  },
  [MonsterKind.POLZUN]: {
    tags: ['water', 'wet', 'bathroom', 'storage', 'industrial', 'conveyor', 'movement', 'fog', 'low'],
    anchorTags: ['water', 'wet', 'bathroom', 'storage', 'industrial', 'movement'],
  },
  [MonsterKind.BETONNIK]: {
    tags: ['concrete', 'corridor', 'production', 'crush', 'deep', 'samosbor'],
    anchorTags: ['concrete', 'corridor', 'production', 'crush', 'deep'],
  },
  [MonsterKind.ZOMBIE]: {
    tags: ['residential', 'living', 'kitchen', 'crowd', 'zombie', 'infection', 'quarantine', 'food'],
    anchorTags: ['residential', 'living', 'kitchen', 'crowd', 'zombie', 'infection'],
  },
  [MonsterKind.EYE]: {
    tags: ['visibility', 'light', 'lamp', 'screen', 'power', 'patrol', 'lab', 'corridor', 'line'],
    anchorTags: ['visibility', 'light', 'lamp', 'screen', 'power', 'patrol', 'lab', 'corridor'],
  },
  [MonsterKind.NIGHTMARE]: {
    tags: ['fog', 'dark', 'psi', 'samosbor', 'pressure', 'deep', 'medical'],
    anchorTags: ['fog', 'dark', 'psi', 'samosbor', 'pressure', 'deep'],
  },
  [MonsterKind.SHADOW]: {
    tags: ['dark', 'low_light', 'fog', 'visibility', 'cult', 'psi', 'void', 'mirror', 'duality'],
    anchorTags: ['dark', 'low_light', 'fog', 'cult', 'psi', 'void', 'mirror'],
    avoidTags: ['light', 'lamp'],
    anchorPenalty: 0.42,
    avoidPenalty: 0.35,
  },
  [MonsterKind.REBAR]: {
    tags: ['industrial', 'metal', 'production', 'storage', 'crush', 'rail', 'moving_walls'],
    anchorTags: ['industrial', 'metal', 'production', 'storage', 'crush', 'rail'],
  },
  [MonsterKind.MATKA]: {
    tags: ['production', 'hq', 'meat', 'deep', 'samosbor', 'cult', 'spawn'],
    anchorTags: ['production', 'hq', 'meat', 'deep', 'samosbor'],
  },
  [MonsterKind.IDOL]: {
    tags: ['cult', 'psi', 'shelter', 'false_safe_block', 'office', 'storage', 'hq'],
    anchorTags: ['cult', 'psi', 'shelter', 'false_safe_block', 'office'],
  },
  [MonsterKind.MANCOBUS]: {
    tags: ['production', 'hq', 'industrial', 'hell', 'deep', 'command'],
    anchorTags: ['production', 'hq', 'industrial', 'hell', 'deep'],
  },
  [MonsterKind.HERALD]: {
    tags: ['hell', 'deep', 'corridor', 'hq', 'samosbor', 'line'],
    anchorTags: ['hell', 'deep', 'samosbor', 'corridor', 'hq'],
  },
  [MonsterKind.CREATOR]: {
    tags: ['void', 'protocol', 'line', 'white', 'hq'],
    anchorTags: ['void', 'protocol'],
  },
  [MonsterKind.SAFEGUARD]: {
    tags: ['net', 'terminal', 'screen', 'protocol', 'white', 'blade', 'access', 'industrial', 'hq', 'line'],
    anchorTags: ['net', 'terminal', 'screen', 'protocol', 'industrial', 'hq', 'line'],
    anchorPenalty: 0.28,
  },
  [MonsterKind.SPIRIT]: {
    tags: ['void', 'teleport', 'mirror', 'cult', 'psi', 'false_safe_block', 'dark'],
    anchorTags: ['void', 'teleport', 'mirror', 'cult', 'psi'],
  },
  [MonsterKind.ROBOT]: {
    tags: ['industrial', 'machine', 'machines', 'power', 'lab', 'patrol', 'screen', 'rail'],
    anchorTags: ['industrial', 'machine', 'machines', 'power', 'lab', 'patrol'],
  },
  [MonsterKind.SHOVNIK]: {
    tags: ['civil', 'residential', 'corridor', 'office', 'seam', 'fractal', 'admin'],
    anchorTags: ['civil', 'residential', 'corridor', 'office', 'admin'],
  },
  [MonsterKind.LAMPOVY]: {
    tags: ['light', 'lamp', 'power', 'screen', 'radio', 'pattern', 'office', 'production'],
    anchorTags: ['light', 'lamp', 'power', 'screen', 'radio'],
    anchorPenalty: 0.5,
  },
  [MonsterKind.PECHATEED]: {
    tags: ['documents', 'paper', 'admin', 'office', 'forms', 'quarantine', 'math', 'fractal'],
    anchorTags: ['documents', 'paper', 'admin', 'office', 'forms'],
    anchorPenalty: 0.5,
  },
  [MonsterKind.TUBE_EEL]: {
    tags: ['water', 'wet', 'pipes', 'bathroom', 'collectors', 'rail'],
    anchorTags: ['water', 'wet', 'pipes', 'bathroom', 'collectors'],
    avoidTags: ['dry'],
    anchorPenalty: 0.12,
    avoidPenalty: 0.18,
  },
  [MonsterKind.PARAGRAPH]: {
    tags: ['documents', 'paper', 'admin', 'office', 'hq', 'fractal', 'math', 'teleport', 'protocol'],
    anchorTags: ['documents', 'paper', 'admin', 'office', 'hq', 'protocol'],
  },
  [MonsterKind.NELYUD]: {
    tags: ['residential', 'living', 'kitchen', 'crowd', 'duality', 'trail', 'smog', 'quarantine'],
    anchorTags: ['residential', 'living', 'kitchen', 'crowd', 'duality', 'trail'],
  },
  [MonsterKind.KOSTOREZ]: {
    tags: ['industrial', 'metal', 'production', 'storage', 'predator', 'crush', 'hell'],
    anchorTags: ['industrial', 'metal', 'production', 'storage', 'predator', 'crush', 'hell'],
  },
};

function includesTag(tags: readonly string[] | undefined, tag: string): boolean {
  return tags !== undefined && tags.includes(tag);
}

function tagHits(needles: readonly string[] | undefined, haystack: readonly string[] | undefined): number {
  if (!needles || !haystack || haystack.length === 0) return 0;
  let hits = 0;
  for (const tag of needles) {
    if (includesTag(haystack, tag)) hits++;
  }
  return hits;
}

function ecologyTagWeight(def: MonsterEcologyDef, query: MonsterEcologyQuery): number {
  const context = MONSTER_ECOLOGY_CONTEXT[def.kind];
  if (!context) return 1;

  const floorHits = tagHits(context.tags, query.floorTags);
  const roomHits = tagHits(context.tags, query.roomTags);
  let weight = 1 + Math.min(4, floorHits) * 0.28 + Math.min(5, roomHits) * 0.42;

  if (context.anchorTags && (query.floorTags?.length || query.roomTags?.length)) {
    const anchorHits = tagHits(context.anchorTags, query.floorTags) + tagHits(context.anchorTags, query.roomTags);
    if (anchorHits > 0) weight *= 1 + Math.min(4, anchorHits) * 0.35;
    else weight *= context.anchorPenalty ?? 0.4;
  }

  const avoidHits = tagHits(context.avoidTags, query.floorTags) + tagHits(context.avoidTags, query.roomTags);
  if (avoidHits > 0) weight *= Math.pow(context.avoidPenalty ?? 0.45, avoidHits);

  return Math.max(0, weight);
}

function excludedFromSpawn(def: MonsterEcologyDef, query: MonsterEcologyQuery): boolean {
  return query.excludeKinds?.includes(def.kind) === true;
}

function monsterFloorAffinityMode(query: MonsterEcologyQuery): 'strict' | 'weighted' | 'none' {
  if (query.floorAffinity) return query.floorAffinity;
  if (query.allowOffFloor === false) return 'strict';
  return 'weighted';
}

function ecologyWaveAllows(def: MonsterEcologyDef, query: MonsterEcologyQuery): boolean {
  const wave = query.samosborCount ?? 1;
  if (wave < def.minSamosborCount) return false;
  if (def.rare && !query.allowRare) return false;
  return true;
}

function floorHasNativePool(query: MonsterEcologyQuery): boolean {
  for (const def of MONSTER_ECOLOGY) {
    if (excludedFromSpawn(def, query)) continue;
    if (!def.floors.includes(query.floor)) continue;
    if (!ecologyWaveAllows(def, query)) continue;
    return true;
  }
  return false;
}

function ecologyFloorWeight(def: MonsterEcologyDef, query: MonsterEcologyQuery): number {
  const floorFits = def.floors.includes(query.floor);
  const mode = monsterFloorAffinityMode(query);
  if (mode === 'none') return 1;
  if (mode === 'strict') return floorFits ? 1 : 0;
  if (!floorHasNativePool(query)) return 1;
  return floorFits ? NATIVE_FLOOR_MULT : 1;
}

function ecologyBiasWeight(def: MonsterEcologyDef, query: MonsterEcologyQuery): number {
  if (!query.biasKinds || query.biasKinds.length === 0) return 1;
  const biasIndex = query.biasKinds.indexOf(def.kind);
  if (biasIndex < 0) return 1;
  return BIAS_KIND_MULT - Math.min(4, biasIndex) * 0.25;
}

function ecologySpawnWeight(def: MonsterEcologyDef, query: MonsterEcologyQuery): number {
  if (excludedFromSpawn(def, query)) return 0;
  if (!ecologyWaveAllows(def, query)) return 0;
  let weight = def.spawnWeight;
  weight *= ecologyFloorWeight(def, query);
  if (weight <= 0) return 0;
  if (query.roomType !== undefined) weight *= def.rooms.includes(query.roomType) ? 1.7 : 0.4;
  weight *= ecologyTagWeight(def, query);
  if (DEEP.includes(query.floor) && def.rooms.includes(RoomType.PRODUCTION)) weight *= 1.15;
  weight *= ecologyBiasWeight(def, query);
  const pressure = Math.max(0, Math.min(4, query.routePressure ?? 0));
  if (pressure > 0) {
    if (def.rooms.includes(RoomType.CORRIDOR)) weight *= 1 + pressure * 0.08;
    if (ROUTE_PRESSURE_KINDS.includes(def.kind)) weight *= 1 + pressure * 0.1;
  }
  return weight;
}

export function rankMonsterEcology(query: MonsterEcologyQuery, limit = MONSTER_ECOLOGY.length): MonsterEcologyRank[] {
  const ranked: MonsterEcologyRank[] = [];
  for (const ecology of MONSTER_ECOLOGY) {
    const weight = ecologySpawnWeight(ecology, query);
    if (weight <= 0) continue;
    ranked.push({ kind: ecology.kind, weight, ecology });
  }
  ranked.sort((a, b) => b.weight - a.weight || a.kind - b.kind);
  return ranked.slice(0, Math.max(0, limit));
}

export function likelyMonsterKinds(query: MonsterEcologyQuery, limit = 5): MonsterKind[] {
  return rankMonsterEcology(query, limit).map(entry => entry.kind);
}

export function chooseFloorMonsterKind(query: MonsterEcologyQuery): MonsterKind {
  const rand = query.rng ?? Math.random;
  let total = 0;
  let chosen: MonsterKind | undefined;

  for (const def of MONSTER_ECOLOGY) {
    const weight = ecologySpawnWeight(def, query);
    if (weight <= 0) continue;
    total += weight;
    if (rand() * total < weight) chosen = def.kind;
  }

  if (chosen !== undefined) return chosen;

  for (const def of MONSTER_ECOLOGY) {
    if (excludedFromSpawn(def, query)) continue;
    if (!ecologyWaveAllows(def, query)) continue;
    if (ecologyFloorWeight(def, query) <= 0) continue;
    return def.kind;
  }
  return MonsterKind.SBORKA;
}

export function chooseMonsterRareDrop(kind: MonsterKind, rand = Math.random): MonsterRareDrop | undefined {
  const def = getMonsterEcology(kind);
  if (!def) return undefined;
  for (const drop of def.rareDrops) {
    if (rand() < drop.chance) return drop;
  }
  return undefined;
}

export function monsterEcologyTags(kind: MonsterKind | undefined): string[] {
  const def = getMonsterEcology(kind);
  if (!def) return [];
  const name = MonsterKind[def.kind].toLowerCase();
  return def.rare ? ['ecology', `monster_${name}`, 'rare_monster'] : ['ecology', `monster_${name}`];
}

export function monsterEcologyEventData(kind: MonsterKind | undefined): Record<string, unknown> | undefined {
  const def = getMonsterEcology(kind);
  if (!def) return undefined;
  return {
    ecologyFloors: def.floors,
    ecologyRooms: def.rooms,
    ecologyVariants: def.variants,
    ecologyLootHint: def.lootHint,
    ecologyCounterplay: def.counterplay,
    ecologyRumorIds: def.rumorIds,
    ecologyRareDrops: def.rareDrops,
    ecologyRare: def.rare,
  };
}

/* ── Monster ecology: spawn identity, counterplay, and loot hints ── */

import { FloorLevel, MonsterKind, RoomType } from '../core/types';

export interface MonsterRareDrop {
  itemId: string;
  chance: number;
  count?: number;
}

export interface MonsterEcologyDef {
  kind: MonsterKind;
  floors: readonly FloorLevel[];
  rooms: readonly RoomType[];
  variants: readonly string[];
  spawnWeight: number;
  minSamosborCount: number;
  rare: boolean;
  lootHint: string;
  counterplay: string;
  rumorIds: readonly string[];
  rareDrops: readonly MonsterRareDrop[];
}

export interface MonsterEcologyQuery {
  floor: FloorLevel;
  roomType?: RoomType;
  samosborCount?: number;
  allowRare?: boolean;
  rng?: () => number;
  biasKinds?: readonly MonsterKind[];
  routePressure?: number;
}

const CIVIL: readonly FloorLevel[] = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING];
const DEEP: readonly FloorLevel[] = [FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID];
const ALL_BUT_VOID: readonly FloorLevel[] = [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL];
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

export const MONSTER_ECOLOGY: readonly MonsterEcologyDef[] = [
  {
    kind: MonsterKind.SBORKA,
    floors: ALL_BUT_VOID,
    rooms: [RoomType.CORRIDOR, RoomType.COMMON, RoomType.STORAGE],
    variants: ['cracked_sborka', 'fog_sborka'],
    spawnWeight: 8.5,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'мелкий ремонтный мусор, будто тварь собрана из кладовой; редко изолента',
    counterplay: 'Пятитесь к широкому месту или бросьте еду/говняк в сторону: сборка очень быстрая, но падает от дешевого выстрела.',
    rumorIds: ['monster_sborka_fast', 'ecology_sborka_swarm'],
    rareDrops: [{ itemId: 'duct_tape', chance: 0.03 }],
  },
  {
    kind: MonsterKind.KRYSNOZHKA,
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    rooms: [RoomType.KITCHEN, RoomType.STORAGE, RoomType.CORRIDOR, RoomType.COMMON],
    variants: ['garbage_krysnozhka'],
    spawnWeight: 3.2,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'грязный жир и мелкий органический хлам; редко сырое мясо',
    counterplay: 'Не кормите рой карманом: бросьте меченую приманку, заведите через липкую ловушку или сбейте рывок дробью.',
    rumorIds: ['ecology_krysnozhka_bait'],
    rareDrops: [{ itemId: 'rawmeat', chance: 0.04 }],
  },
  {
    kind: MonsterKind.TVAR,
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.CORRIDOR, RoomType.LIVING, RoomType.COMMON, RoomType.STORAGE],
    variants: ['panel_tvar', 'hungry_tvar'],
    spawnWeight: 6.2,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'сырой органический хлам с запахом кухонной мясорубки; редко мясо',
    counterplay: 'Держите полторы клетки, центр комнаты и запас назад: у бетонной кромки тварь достает дальше и бьет больнее.',
    rumorIds: ['monster_tvar_walls', 'ecology_tvar_wall'],
    rareDrops: [{ itemId: 'rawmeat', chance: 0.04 }],
  },
  {
    kind: MonsterKind.POLZUN,
    floors: [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.CORRIDOR, RoomType.BATHROOM, RoomType.PRODUCTION, RoomType.STORAGE],
    variants: ['wet_polzun', 'silent_polzun'],
    spawnWeight: 4.3,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'грязная ткань и мокрый мусор из-под ванны; редко фильтрующий слой',
    counterplay: 'Не принимайте бой в дверях, ванной или воде: ползун медленно держит урон, а прямая дистанция дает время расстрелять его.',
    rumorIds: ['monster_polzun_floor', 'ecology_polzun_low'],
    rareDrops: [{ itemId: 'filter_layer', chance: 0.04 }],
  },
  {
    kind: MonsterKind.BETONNIK,
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.PRODUCTION, RoomType.HQ, RoomType.COMMON],
    variants: ['betonoed'],
    spawnWeight: 0.65,
    minSamosborCount: 4,
    rare: true,
    lootHint: 'арматурные и бетонные остатки; очень редко бетонный сгусток, тёплый как свежая стена',
    counterplay: 'Не разменивайтесь ударами: обходите углами и бейте только с запасом выносливости. Бетоноеда можно отвлечь шумом, отогнать огнем или запечатать слабый проем.',
    rumorIds: ['monster_betonnik_heavy', 'ecology_betonnik_weight'],
    rareDrops: [{ itemId: 'rebar', chance: 0.06 }, { itemId: 'psi_concrete_splinter', chance: 0.02 }],
  },
  {
    kind: MonsterKind.ZOMBIE,
    floors: ALL_BUT_VOID,
    rooms: [RoomType.LIVING, RoomType.KITCHEN, RoomType.COMMON, RoomType.OFFICE],
    variants: ['office_zombie', 'wild_zombie'],
    spawnWeight: 3.4,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'бытовые остатки прежнего жильца; редко записка или сигареты',
    counterplay: 'Не подпускайте через толпу: выводите мертвяка на пустой проход и бейте до контакта.',
    rumorIds: ['monster_zombie_human', 'ecology_zombie_neighbor'],
    rareDrops: [{ itemId: 'note', chance: 0.05 }, { itemId: 'cigs', chance: 0.03 }],
  },
  {
    kind: MonsterKind.EYE,
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.OFFICE, RoomType.PRODUCTION, RoomType.COMMON],
    variants: ['blind_eye', 'black_slime_eye', 'lamp_eye'],
    spawnWeight: 3.1,
    minSamosborCount: 3,
    rare: false,
    lootHint: 'перегоревшие нити и стеклянная пыль; редко лампа или ПСИ-пыль',
    counterplay: 'Зелёный разогрев предупреждает выстрел: дверь, угол или колонна до вспышки сбивают залп, после выстрела можно сближаться.',
    rumorIds: ['monster_eye_lamps', 'ecology_eye_line'],
    rareDrops: [{ itemId: 'lamp_bulb', chance: 0.05 }, { itemId: 'psi_dust', chance: 0.02 }],
  },
  {
    kind: MonsterKind.NIGHTMARE,
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.COMMON, RoomType.HQ, RoomType.MEDICAL, RoomType.CORRIDOR],
    variants: ['court_nightmare', 'wet_nightmare'],
    spawnWeight: 1.4,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'психический след, как сон на мокрой бумаге; редко ПСИ-пыль или антидепрессант',
    counterplay: 'Либо быстро тратьте сильный урон, либо уходите: кошмарище наказывает долгий бой и сомнения.',
    rumorIds: ['ecology_nightmare_pressure'],
    rareDrops: [{ itemId: 'psi_dust', chance: 0.06 }, { itemId: 'antidep', chance: 0.02 }],
  },
  {
    kind: MonsterKind.SHADOW,
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.SMOKING, RoomType.OFFICE, RoomType.COMMON],
    variants: ['deep_shadow', 'thin_shadow'],
    spawnWeight: 3.6,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'тёмный след, будто свет вырезали ножом; сюжетно может оставить странный сгусток',
    counterplay: 'В темноте теневик делает короткий рывок перед ударом. Свет, фонарь или шаг назад срывают рывок и режут урон.',
    rumorIds: ['monster_shadow_silence', 'ecology_shadow_afterimage'],
    rareDrops: [{ itemId: 'strange_clot', chance: 0.03 }],
  },
  {
    kind: MonsterKind.REBAR,
    floors: [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.PRODUCTION, RoomType.STORAGE, RoomType.CORRIDOR],
    variants: ['rebar_veteran', 'rust_rebar'],
    spawnWeight: 1.1,
    minSamosborCount: 5,
    rare: true,
    lootHint: 'металлические обломки и злые искры; редко годная арматура',
    counterplay: 'Обходите ровное железо у складов и бейте арматуру оружием с дистанции, не голыми руками.',
    rumorIds: ['monster_rebar_metal', 'ecology_rebar_still'],
    rareDrops: [{ itemId: 'rebar', chance: 0.08 }, { itemId: 'wire_coil', chance: 0.04 }],
  },
  {
    kind: MonsterKind.MATKA,
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.HQ, RoomType.COMMON, RoomType.PRODUCTION, RoomType.CORRIDOR],
    variants: ['choir_matka'],
    spawnWeight: 0.45,
    minSamosborCount: 4,
    rare: true,
    lootHint: 'маточный узел и тёплая слизь; редко мясная руна',
    counterplay: 'Сначала решите: быстро убить матку или чистить приплод; если тянуть оба плана, комната захлебнётся.',
    rumorIds: ['monster_matka_spawn', 'ecology_matka_children'],
    rareDrops: [{ itemId: 'meat_rune', chance: 0.05 }, { itemId: 'rawmeat', chance: 0.12 }],
  },
  {
    kind: MonsterKind.IDOL,
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.STORAGE, RoomType.OFFICE, RoomType.SMOKING, RoomType.HQ],
    variants: ['office_idol'],
    spawnWeight: 0.9,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'холодный камень с чужой молитвой; редко культовый идол или меточный сгусток',
    counterplay: 'Не стойте на средней дистанции: сбивайте угол выстрела или добегайте вплотную к неподвижному идолу.',
    rumorIds: ['monster_idol_static', 'ecology_idol_stares'],
    rareDrops: [{ itemId: 'idol_chernobog', chance: 0.03 }, { itemId: 'psi_mark', chance: 0.015 }],
  },
  {
    kind: MonsterKind.MANCOBUS,
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.HQ, RoomType.PRODUCTION, RoomType.COMMON],
    variants: [],
    spawnWeight: 0.32,
    minSamosborCount: 6,
    rare: true,
    lootHint: 'тяжёлая органика, жирный металл и энергоячейки',
    counterplay: 'Сначала снимайте охрану, затем бейте с углов: стены и колонны ломают прямой сектор Манкобуса, который съедает аптечки и самоуверенность.',
    rumorIds: ['ecology_mancobus_orders'],
    rareDrops: [{ itemId: 'ammo_energy', chance: 0.08 }, { itemId: 'bottled_voice', chance: 0.03 }],
  },
  {
    kind: MonsterKind.HERALD,
    floors: [FloorLevel.HELL],
    rooms: [RoomType.COMMON, RoomType.HQ, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 0.28,
    minSamosborCount: 5,
    rare: true,
    lootHint: 'осколки сирены и голосовые остатки, которые лучше не прикладывать к уху',
    counterplay: 'Стреляйте из укрытия: Вестник наказывает открытый коридор и тех, кто слишком долго слушает.',
    rumorIds: ['ecology_herald_ceiling'],
    rareDrops: [{ itemId: 'siren_shard', chance: 0.06 }, { itemId: 'bottled_voice', chance: 0.04 }],
  },
  {
    kind: MonsterKind.CREATOR,
    floors: [FloorLevel.VOID],
    rooms: [RoomType.COMMON, RoomType.HQ],
    variants: [],
    spawnWeight: 0.04,
    minSamosborCount: 99,
    rare: true,
    lootHint: 'пустотные шипы; финальный след аварийного мастера без лица',
    counterplay: 'Входите только с полным запасом: держите укрытие между залпами и не тратьте рывок без выхода.',
    rumorIds: ['ecology_creator_white'],
    rareDrops: [{ itemId: 'void_spike', chance: 0.12 }],
  },
  {
    kind: MonsterKind.SPIRIT,
    floors: [FloorLevel.MINISTRY, FloorLevel.HELL, FloorLevel.VOID],
    rooms: [RoomType.CORRIDOR, RoomType.OFFICE, RoomType.HQ, RoomType.COMMON],
    variants: ['false_spirit'],
    spawnWeight: 1.1,
    minSamosborCount: 4,
    rare: true,
    lootHint: 'пустая память и холодный сквозняк; редко ПСИ-пыль',
    counterplay: 'Меняйте позицию до контакта: дверь и стена духа не держат, помогает только дистанция.',
    rumorIds: ['ecology_spirit_wall'],
    rareDrops: [{ itemId: 'psi_dust', chance: 0.05 }, { itemId: 'void_spike', chance: 0.015 }],
  },
  {
    kind: MonsterKind.ROBOT,
    floors: [FloorLevel.MINISTRY, FloorLevel.MAINTENANCE],
    rooms: [RoomType.PRODUCTION, RoomType.HQ, RoomType.CORRIDOR, RoomType.OFFICE],
    variants: ['pipe_robot'],
    spawnWeight: 1.4,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'электронный лом с номером цеха; редко энергоячейка',
    counterplay: 'Уходите с линии плазмы и бейте после залпа. Робот честен: сначала целится, потом портит смену.',
    rumorIds: ['ecology_robot_plasma'],
    rareDrops: [{ itemId: 'ammo_energy', chance: 0.07 }, { itemId: 'circuit_board', chance: 0.06 }],
  },
  {
    kind: MonsterKind.SHOVNIK,
    floors: CIVIL,
    rooms: [RoomType.CORRIDOR, RoomType.LIVING, RoomType.OFFICE, RoomType.COMMON],
    variants: [],
    spawnWeight: 3.2,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'герметичный мусор и резиновая крошка; редко гермоуплотнитель',
    counterplay: 'Выводите в центр комнаты: у стен шовник быстрее и больнее бьёт, будто защищает швы.',
    rumorIds: ['ecology_shovnik_seams'],
    rareDrops: [{ itemId: 'hermo_gasket', chance: 0.05 }, { itemId: 'sealant_tube', chance: 0.03 }],
  },
  {
    kind: MonsterKind.LAMPOVY,
    floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    rooms: [RoomType.CORRIDOR, RoomType.OFFICE, RoomType.COMMON, RoomType.PRODUCTION],
    variants: [],
    spawnWeight: 2.8,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'перегоревшие лампы, стекло и запах озона; редко предохранитель',
    counterplay: 'Не деритесь под лампой: отведите его в тёмный коридор или за угол.',
    rumorIds: ['ecology_lampovy_light'],
    rareDrops: [{ itemId: 'lamp_bulb', chance: 0.06 }, { itemId: 'fuse', chance: 0.04 }],
  },
  {
    kind: MonsterKind.PECHATEED,
    floors: CIVIL,
    rooms: [RoomType.OFFICE, RoomType.COMMON, RoomType.SMOKING, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 2.6,
    minSamosborCount: 2,
    rare: false,
    lootHint: 'испорченные бумаги со следами зубов; редко чернила или бланк',
    counterplay: 'Сбросьте лишние записки и держите дистанцию: печатеед выбирает носителей бумаг как папки.',
    rumorIds: ['ecology_pechateed_docs'],
    rareDrops: [{ itemId: 'ink_bottle', chance: 0.05 }, { itemId: 'blank_form', chance: 0.04 }],
  },
  {
    kind: MonsterKind.TUBE_EEL,
    floors: [FloorLevel.MAINTENANCE],
    rooms: [RoomType.CORRIDOR, RoomType.PRODUCTION, RoomType.STORAGE, RoomType.BATHROOM],
    variants: [],
    spawnWeight: 4.3,
    minSamosborCount: 1,
    rare: false,
    lootHint: 'мокрый трубный хлам и ржавая слизь; редко манометр',
    counterplay: 'Выходите из воды: сухая кромка режет рывок угря. Гарпун бьёт через лоток, а брошенная еда или говняк уводят его с маршрута.',
    rumorIds: ['ecology_eel_water'],
    rareDrops: [{ itemId: 'manometer', chance: 0.05 }, { itemId: 'pipe', chance: 0.03 }],
  },
  {
    kind: MonsterKind.PARAGRAPH,
    floors: [FloorLevel.MINISTRY, FloorLevel.VOID],
    rooms: [RoomType.OFFICE, RoomType.HQ, RoomType.CORRIDOR, RoomType.COMMON],
    variants: [],
    spawnWeight: 1.5,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'канцелярские обрывки с живыми формулировками; редко приказ или печатный сгусток',
    counterplay: 'Ломайте линию видимости и сближайтесь: параграф опасен на средней дистанции, как плохая инструкция.',
    rumorIds: ['ecology_paragraph_clause'],
    rareDrops: [{ itemId: 'unsigned_order', chance: 0.05 }, { itemId: 'psi_order_seal', chance: 0.015 }],
  },
  {
    kind: MonsterKind.NELYUD,
    floors: CIVIL,
    rooms: [RoomType.LIVING, RoomType.KITCHEN, RoomType.COMMON, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 1.2,
    minSamosborCount: 3,
    rare: true,
    lootHint: 'поддельные бытовые вещи, слишком аккуратные для жильца; редко фальшивый пропуск',
    counterplay: 'Проверяйте дистанцией: нелюдь не раскрывается, пока не подпустить близко и не поверить лицу.',
    rumorIds: ['ecology_nelyud_close'],
    rareDrops: [{ itemId: 'fake_pass', chance: 0.04 }, { itemId: 'unpeople_detector', chance: 0.015 }],
  },
  {
    kind: MonsterKind.KOSTOREZ,
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    rooms: [RoomType.PRODUCTION, RoomType.STORAGE, RoomType.CORRIDOR],
    variants: [],
    spawnWeight: 0.35,
    minSamosborCount: 6,
    rare: true,
    lootHint: 'резаный металл, бронелист и обломки арматуры; редко годный бронелист',
    counterplay: 'Читайте замах: дистанция, угол и колонна отменяют рывок, а дробь сбивает костореза до удара.',
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

function ecologySpawnWeight(def: MonsterEcologyDef, query: MonsterEcologyQuery): number {
  if (!def.floors.includes(query.floor)) return 0;
  const wave = query.samosborCount ?? 1;
  if (wave < def.minSamosborCount) return 0;
  if (def.rare && !query.allowRare) return 0;
  let weight = def.spawnWeight;
  if (query.roomType !== undefined) weight *= def.rooms.includes(query.roomType) ? 1.7 : 0.4;
  if (DEEP.includes(query.floor) && def.rooms.includes(RoomType.PRODUCTION)) weight *= 1.15;
  if (query.biasKinds && query.biasKinds.length > 0) {
    const biasIndex = query.biasKinds.indexOf(def.kind);
    weight *= biasIndex >= 0 ? 2.5 - Math.min(3, biasIndex) * 0.25 : 0.55;
  }
  const pressure = Math.max(0, Math.min(4, query.routePressure ?? 0));
  if (pressure > 0) {
    if (def.rooms.includes(RoomType.CORRIDOR)) weight *= 1 + pressure * 0.08;
    if (ROUTE_PRESSURE_KINDS.includes(def.kind)) weight *= 1 + pressure * 0.1;
  }
  return weight;
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
    if (!def.floors.includes(query.floor)) continue;
    if (def.rare && !query.allowRare) continue;
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

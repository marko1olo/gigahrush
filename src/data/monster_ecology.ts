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
    lootHint: 'проволока, кладовой мусор, редкая изолента из треснувшего узла',
    counterplay: 'Быстрая, слабая и часто не одна: принимайте в широком месте, гасите дешевым выстрелом и не тратьте последний магазин на первую.',
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
    lootHint: 'мелкие лапки, грязный жир, мусор гнезда, редкое сырое мясо',
    counterplay: 'Не кормите рой карманом: бросьте меченую приманку дальше себя, заведите через липкую ловушку или сбейте первый рывок дробью.',
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
    lootHint: 'сырая органика, бетонная крошка у лап, редкий кусок мяса',
    counterplay: 'Держите полторы клетки, центр комнаты и запас назад: у бетонной кромки тварь достает дальше, а приманка срывает погоню.',
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
    lootHint: 'мокрая ветошь, ванная грязь, редкий фильтрующий слой',
    counterplay: 'Не принимайте бой в дверях, ванной или воде: ползун медленный, но там уже рядом. Прямой отход дает время расстрелять.',
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
    lootHint: 'арматурная крошка, бетонные осколки, редкий теплый бетонный сгусток',
    counterplay: 'Не разменивайтесь ударами в прямом коридоре: обходите углами, держите выносливость, отвлекайте шумом, огнем или запечатанным проемом.',
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
    lootHint: 'карманный бытовой хлам, чужая записка, редкие сигареты',
    counterplay: 'Не подпускайте через толпу, кухню или палату: выводите мертвяка на пустой проход и добивайте до первого хвата.',
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
    lootHint: 'перегоревшая нить, стеклянная пыль, редкая лампа или ПСИ-пыль',
    counterplay: 'Зеленый разогрев предупреждает выстрел: дверь, угол или колонна до вспышки сбивают залп, после выстрела можно сближаться.',
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
    lootHint: 'психический налет, ПСИ-пыль, редкий антидепрессант из кармана жертвы',
    counterplay: 'Не играйте в длинный бой: либо сразу тратьте тяжелый урон с выходом за спиной, либо уходите до давления.',
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
    lootHint: 'темный след, холодная пыль, редкий странный сгусток',
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
    lootHint: 'тяжелый металл, витая проволока, редкий годный прут арматуры',
    counterplay: 'Обходите ровное железо у стен и складов: арматура звенит перед ударом, а дистанция лучше рукопашной.',
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
    lootHint: 'маточный узел, теплая слизь, редкая мясная руна после зачистки',
    counterplay: 'Сначала решите: быстро убить матку или чистить приплод. Если тянуть оба плана, комната заполнится приплодом и отход станет тесным.',
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
    lootHint: 'ПСИ-пыль, холодный культовый камень, редкий идол Чернобога или меточный сгусток',
    counterplay: 'Не стойте на средней дистанции: сбивайте угол выстрела или входите в упор к неподвижному идолу.',
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
    lootHint: 'жирный металл, командная органика, энергоячейка, бутылка с голосом',
    counterplay: 'Сначала снимайте охрану, затем бейте с углов между залпами: стены и колонны ломают прямой сектор Манкобуса.',
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
    lootHint: 'осколок сирены, бирка порога, бутылка с голосом',
    counterplay: 'Держите дверь, угол или колонну между залпами: Вестник наказывает открытую линию и тех, кто слишком долго слушает.',
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
    lootHint: 'пустотный шип, белая пыль, пустая квитанция протокола',
    counterplay: 'Входите с полным запасом: держите укрытие между залпами, уходите из зеленого света и не тратьте рывок без выхода.',
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
    lootHint: 'пустая записка, холодный сквозняк, редкая ПСИ-пыль',
    counterplay: 'Меняйте позицию до контакта: двери и стены духа не держат, помогает дистанция и сбитый УФ-светом темп.',
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
    lootHint: 'электронный лом, плата, проводка, редкая энергоячейка',
    counterplay: 'Уходите с прямой линии плазмы и бейте после залпа. В мокром проходе не стойте: там плазменный луч попадает чаще.',
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
    lootHint: 'резиновая крошка, герметичный мусор, редкий гермоуплотнитель',
    counterplay: 'Выводите в центр комнаты: у стен и швов шовник быстрее и больнее бьет, без кромки теряет ход.',
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
    lootHint: 'перегоревшая нить, стекло, запах озона, редкий предохранитель',
    counterplay: 'Не деритесь под лампой: отведите его на три клетки от света, в темный коридор или за угол.',
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
    lootHint: 'обглоданный бланк, кислые чернила, пустой формуляр без подписи',
    counterplay: 'Сбросьте лишние записки, бланки и ключи в ящик: с бумажным запахом печатеед чует дальше, через углы теряет нюх.',
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
    lootHint: 'ржавая слизь, манометр, обломок трубы из затопленного лотка',
    counterplay: 'Выходите из воды: сухая кромка и мост режут рывок угря. Гарпун бьет через лоток, приманка уводит с маршрута.',
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
    lootHint: 'порванный приказ, сургучная пыль, обрывки шевелящегося приказа',
    counterplay: 'Ломайте линию видимости шкафом, дверью или углом и сближайтесь сразу после залпа: в упоре параграф теряет дистанцию.',
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
    lootHint: 'фальшивый пропуск, чужой ключ без царапин, редкий детектор нелюдей',
    counterplay: 'Проверяйте дистанцией: нелюдь раскрывается поздно, поэтому не подпускайте слишком спокойного соседа без света и выхода.',
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
    lootHint: 'резаный металл, бронелист, обломок арматуры',
    counterplay: 'Читайте замах: три шага, угол или колонна отменяют рывок, дробь сбивает пилы, бронелист принимает один рез.',
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

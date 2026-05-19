/* ── Monster variant definitions: cheap modifiers, no runtime scans ── */

import { FloorLevel, MonsterKind } from '../core/types';

export type MonsterVariantFlag =
  | 'wall_bias'
  | 'lamp_bias'
  | 'water_bias'
  | 'document_bias'
  | 'ambush'
  | 'ranged_bias'
  | 'swarm'
  | 'armored'
  | 'coward'
  | 'fog_bias';

export interface MonsterVariantDef {
  id: string;
  baseKind: MonsterKind;
  prefix: string;
  spawnWeight: number;
  hpMult: number;
  speedMult: number;
  dmgMult: number;
  flags: readonly MonsterVariantFlag[];
  floors: readonly FloorLevel[];
  lootHint: string;
  counterplay: string;
}

export const MONSTER_VARIANTS: readonly MonsterVariantDef[] = [
  {
    id: 'cracked_sborka',
    baseKind: MonsterKind.SBORKA,
    prefix: 'Треснутая',
    spawnWeight: 4.5,
    hpMult: 0.62,
    speedMult: 1.34,
    dmgMult: 0.8,
    flags: ['swarm'],
    floors: [FloorLevel.LIVING, FloorLevel.KVARTIRY],
    lootHint: 'мусорный лут и шанс изоленты',
    counterplay: 'Гасите дешёвым выстрелом до контакта: треснутая сборка быстро добегает, но разваливается первой.',
  },
  {
    id: 'fog_sborka',
    baseKind: MonsterKind.SBORKA,
    prefix: 'Туманная',
    spawnWeight: 1.1,
    hpMult: 0.9,
    speedMult: 1.08,
    dmgMult: 1.22,
    flags: ['fog_bias', 'ambush'],
    floors: [FloorLevel.LIVING, FloorLevel.HELL],
    lootHint: 'слабый след самосбора',
    counterplay: 'Не ждите силуэт в тумане: отходите к углу и стреляйте по первому звуку, пока она не вошла в упор.',
  },
  {
    id: 'wet_polzun',
    baseKind: MonsterKind.POLZUN,
    prefix: 'Мокрый',
    spawnWeight: 2.8,
    hpMult: 1.35,
    speedMult: 0.92,
    dmgMult: 1.05,
    flags: ['water_bias', 'armored'],
    floors: [FloorLevel.MAINTENANCE],
    lootHint: 'влажные остатки и фильтрующий слой',
    counterplay: 'Не деритесь в лотке или ванной: на сухом прямом проходе мокрый ползун остаётся толстым, но теряет темп.',
  },
  {
    id: 'silent_polzun',
    baseKind: MonsterKind.POLZUN,
    prefix: 'Тихий',
    spawnWeight: 0.85,
    hpMult: 0.72,
    speedMult: 1.28,
    dmgMult: 1.25,
    flags: ['ambush'],
    floors: [FloorLevel.LIVING],
    lootHint: 'редкий шумовой крючок',
    counterplay: 'Не держите дверь спиной: тихий ползун слабее обычного, но наказывает поздний разворот в тесном месте.',
  },
  {
    id: 'panel_tvar',
    baseKind: MonsterKind.TVAR,
    prefix: 'Панельная',
    spawnWeight: 2.4,
    hpMult: 1.35,
    speedMult: 0.88,
    dmgMult: 1.1,
    flags: ['wall_bias', 'armored'],
    floors: [FloorLevel.LIVING, FloorLevel.KVARTIRY],
    lootHint: 'бетонная крошка',
    counterplay: 'Вытягивайте от стены в центр комнаты: панельная тварь держит удар, но хуже давит без бетонной кромки.',
  },
  {
    id: 'hungry_tvar',
    baseKind: MonsterKind.TVAR,
    prefix: 'Голодная',
    spawnWeight: 1.4,
    hpMult: 0.75,
    speedMult: 1.36,
    dmgMult: 1.25,
    flags: ['ambush', 'swarm'],
    floors: [FloorLevel.HELL, FloorLevel.LIVING],
    lootHint: 'сырой мясной лут',
    counterplay: 'Бросайте приманку до выстрела или рвите дистанцию сразу: голодная тварь живёт меньше, но съедает ошибку быстрее.',
  },
  {
    id: 'office_zombie',
    baseKind: MonsterKind.ZOMBIE,
    prefix: 'Конторская',
    spawnWeight: 2.0,
    hpMult: 1.12,
    speedMult: 0.82,
    dmgMult: 1.05,
    flags: ['document_bias', 'armored'],
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING],
    lootHint: 'бумажный мусор и шанс бланка',
    counterplay: 'Не тащите документы в ближний бой: конторская мертвячина медленнее, но упорнее идёт за бумагами.',
  },
  {
    id: 'wild_zombie',
    baseKind: MonsterKind.ZOMBIE,
    prefix: 'Дикая',
    spawnWeight: 2.5,
    hpMult: 0.78,
    speedMult: 1.24,
    dmgMult: 1.14,
    flags: ['swarm'],
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING],
    lootHint: 'бытовой хлам',
    counterplay: 'Не пускайте в толпу: дикий мертвяк быстрее обычного, но быстро падает, если вывести в пустой проход.',
  },
  {
    id: 'blind_eye',
    baseKind: MonsterKind.EYE,
    prefix: 'Слепой',
    spawnWeight: 0.9,
    hpMult: 0.65,
    speedMult: 0.78,
    dmgMult: 1.55,
    flags: ['ranged_bias', 'coward'],
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    lootHint: 'сгусток сажи',
    counterplay: 'Сближайтесь сразу после залпа: слепой глаз бьёт больнее, но плохо переживает давление в упоре.',
  },
  {
    id: 'black_slime_eye',
    baseKind: MonsterKind.EYE,
    prefix: 'Чернослизный',
    spawnWeight: 0.65,
    hpMult: 0.55,
    speedMult: 0.82,
    dmgMult: 0.85,
    flags: ['ranged_bias', 'ambush', 'water_bias'],
    floors: [FloorLevel.MAINTENANCE],
    lootHint: 'проба черной слизи',
    counterplay: 'Не проверяйте тёмную воду лицом: чернослизный глаз слабый, но открывает бой из грязной линии обзора.',
  },
  {
    id: 'lamp_eye',
    baseKind: MonsterKind.EYE,
    prefix: 'Ламповый',
    spawnWeight: 1.7,
    hpMult: 0.95,
    speedMult: 1.05,
    dmgMult: 1.18,
    flags: ['lamp_bias', 'ranged_bias'],
    floors: [FloorLevel.LIVING, FloorLevel.MINISTRY],
    lootHint: 'перегоревшая нить',
    counterplay: 'Сбивайте угол лампой или стеной: ламповый глаз выгодно держит освещённый прямой коридор.',
  },
  {
    id: 'rebar_veteran',
    baseKind: MonsterKind.REBAR,
    prefix: 'Закаленная',
    spawnWeight: 0.75,
    hpMult: 1.55,
    speedMult: 0.78,
    dmgMult: 1.08,
    flags: ['armored'],
    floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
    lootHint: 'обломок арматуры',
    counterplay: 'Не тратьте рукопашную: закалённая арматура медленная, но требует дистанции, дроби или тяжёлого оружия.',
  },
  {
    id: 'rust_rebar',
    baseKind: MonsterKind.REBAR,
    prefix: 'Ржавая',
    spawnWeight: 1.45,
    hpMult: 0.72,
    speedMult: 1.22,
    dmgMult: 1.28,
    flags: ['ambush'],
    floors: [FloorLevel.MAINTENANCE],
    lootHint: 'ржавчина',
    counterplay: 'Обходите ровное железо у склада: ржавая арматура быстрее раскрывается, но хуже держит ответный огонь.',
  },
  {
    id: 'deep_shadow',
    baseKind: MonsterKind.SHADOW,
    prefix: 'Глубокий',
    spawnWeight: 0.85,
    hpMult: 1.05,
    speedMult: 1.12,
    dmgMult: 1.18,
    flags: ['ambush', 'fog_bias'],
    floors: [FloorLevel.HELL, FloorLevel.VOID],
    lootHint: 'темный след',
    counterplay: 'Держите светлый выход за спиной: глубокий теневик опасен не бронёй, а темпом второго удара.',
  },
  {
    id: 'thin_shadow',
    baseKind: MonsterKind.SHADOW,
    prefix: 'Тонкий',
    spawnWeight: 1.25,
    hpMult: 0.62,
    speedMult: 1.5,
    dmgMult: 0.8,
    flags: ['coward', 'ambush'],
    floors: [FloorLevel.MINISTRY, FloorLevel.LIVING],
    lootHint: 'почти ничего',
    counterplay: 'Не гонитесь вслепую: тонкий теневик слабее, но провоцирует лишний шаг в тёмный коридор.',
  },
  {
    id: 'court_nightmare',
    baseKind: MonsterKind.NIGHTMARE,
    prefix: 'Протокольное',
    spawnWeight: 1.25,
    hpMult: 1.18,
    speedMult: 0.82,
    dmgMult: 1.28,
    flags: ['document_bias'],
    floors: [FloorLevel.MINISTRY],
    lootHint: 'испорченный протокол',
    counterplay: 'Сбрасывайте лишнюю бумагу и не затягивайте бой: протокольное кошмарище медленнее, но больнее наказывает документы.',
  },
  {
    id: 'wet_nightmare',
    baseKind: MonsterKind.NIGHTMARE,
    prefix: 'Водяное',
    spawnWeight: 0.8,
    hpMult: 0.95,
    speedMult: 1.22,
    dmgMult: 1.05,
    flags: ['water_bias'],
    floors: [FloorLevel.MAINTENANCE],
    lootHint: 'мокрый сгусток',
    counterplay: 'Уходите с мокрой линии и бейте коротко: водяное кошмарище выигрывает бой, пока вы пятитесь по воде.',
  },
  {
    id: 'choir_matka',
    baseKind: MonsterKind.MATKA,
    prefix: 'Хоровая',
    spawnWeight: 0.7,
    hpMult: 1.08,
    speedMult: 1.0,
    dmgMult: 0.95,
    flags: ['swarm', 'fog_bias'],
    floors: [FloorLevel.HELL],
    lootHint: 'маточный узел',
    counterplay: 'Решайте сразу: убивать матку или чистить приплод. Хоровая матка делает комнату шумнее и теснее.',
  },
  {
    id: 'office_idol',
    baseKind: MonsterKind.IDOL,
    prefix: 'Канцелярский',
    spawnWeight: 1.0,
    hpMult: 0.9,
    speedMult: 1.0,
    dmgMult: 1.22,
    flags: ['document_bias', 'ranged_bias'],
    floors: [FloorLevel.MINISTRY],
    lootHint: 'чернильный камень',
    counterplay: 'Не спорьте с ним на средней дистанции: канцелярский идол неподвижен, но бьёт сильнее по открытому кабинету.',
  },
  {
    id: 'pipe_robot',
    baseKind: MonsterKind.ROBOT,
    prefix: 'Трубный',
    spawnWeight: 1.15,
    hpMult: 1.25,
    speedMult: 0.86,
    dmgMult: 1.12,
    flags: ['water_bias', 'ranged_bias', 'armored'],
    floors: [FloorLevel.MAINTENANCE],
    lootHint: 'энергоячейка шанс',
    counterplay: 'Не стойте в мокром прямом проходе: трубный робот крепче обычного, но платит паузой после плазмы.',
  },
  {
    id: 'false_spirit',
    baseKind: MonsterKind.SPIRIT,
    prefix: 'Ложный',
    spawnWeight: 0.9,
    hpMult: 0.9,
    speedMult: 1.28,
    dmgMult: 1.02,
    flags: ['ambush', 'coward'],
    floors: [FloorLevel.VOID, FloorLevel.MINISTRY],
    lootHint: 'пустая память',
    counterplay: 'Не закрывайтесь дверью: ложный дух быстрее меняет стену на дистанцию, но хуже переживает точный ответ.',
  },
  {
    id: 'garbage_krysnozhka',
    baseKind: MonsterKind.KRYSNOZHKA,
    prefix: 'Помойная',
    spawnWeight: 3.2,
    hpMult: 0.8,
    speedMult: 1.22,
    dmgMult: 0.85,
    flags: ['swarm', 'coward'],
    floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
    lootHint: 'запах мусорного гнезда',
    counterplay: 'Сбивайте первый рывок и не храните приманку в кармане: помойный рой слабый, но быстро окружает.',
  },
  {
    id: 'betonoed',
    baseKind: MonsterKind.BETONNIK,
    prefix: 'Бетоноед',
    spawnWeight: 0,
    hpMult: 0.42,
    speedMult: 1.22,
    dmgMult: 0.85,
    flags: ['wall_bias', 'armored'],
    floors: [],
    lootHint: 'арматурная крошка и бетонный осколок',
    counterplay: 'Это прямой POI-вариант: шум, огонь, герметик или блок-комплект решают, станет ли слабая стена проходом.',
  },
];

export const MONSTER_VARIANTS_BY_KIND: Partial<Record<MonsterKind, readonly MonsterVariantDef[]>> = {};
export const MONSTER_VARIANTS_BY_FLOOR: Partial<Record<FloorLevel, readonly MonsterVariantDef[]>> = {};
export const MONSTER_VARIANT_BY_ID: Record<string, MonsterVariantDef> = {};

for (const v of MONSTER_VARIANTS) {
  MONSTER_VARIANT_BY_ID[v.id] = v;
  MONSTER_VARIANTS_BY_KIND[v.baseKind] = [...(MONSTER_VARIANTS_BY_KIND[v.baseKind] ?? []), v];
  for (const floor of v.floors) {
    MONSTER_VARIANTS_BY_FLOOR[floor] = [...(MONSTER_VARIANTS_BY_FLOOR[floor] ?? []), v];
  }
}

export function variantsForKind(kind: MonsterKind): readonly MonsterVariantDef[] {
  return MONSTER_VARIANTS_BY_KIND[kind] ?? [];
}

export function chooseMonsterVariant(kind: MonsterKind, floor: FloorLevel, rng = Math.random): MonsterVariantDef | undefined {
  const variants = variantsForKind(kind).filter(v => v.floors.includes(floor) && v.spawnWeight > 0);
  let total = 0;
  let chosen: MonsterVariantDef | undefined;
  for (const variant of variants) {
    total += variant.spawnWeight;
    if (rng() * total < variant.spawnWeight) chosen = variant;
  }
  return chosen;
}

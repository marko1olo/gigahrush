/* ── Item definitions — еда, напитки, медицина, оружие, амуниция, разное ── */

import {
  RoomType, ItemType,
  type ItemDef, type Entity,
} from '../core/types';
import { CHERNOBOG_DOCKET_ITEMS, CHERNOBOG_DOCKET_ITEM_TAGS } from './chernobog_docket';

export const SILVER_SLIME_SEALED_ID = 'slime_sample_silver';
export const SILVER_SLIME_OPENED_ID = 'slime_sample_silver_open';

export function isSilverSlimeItem(defId: string): boolean {
  return defId === SILVER_SLIME_SEALED_ID || defId === SILVER_SLIME_OPENED_ID;
}

function feed(v: number) { return (e: Entity) => { if (e.needs) { e.needs.food = Math.min(100, e.needs.food + v); e.needs.pendingPoo = (e.needs.pendingPoo ?? 0) + v * 0.7; e.needs.pendingPee = (e.needs.pendingPee ?? 0) + v * 0.3; } return `Сытость +${v}. Хрущ пока не ест вас`; }; }
function riskyFeed(v: number, hpLoss: number) { return (e: Entity) => { if (e.needs) { e.needs.food = Math.min(100, e.needs.food + v); e.needs.pendingPoo = (e.needs.pendingPoo ?? 0) + v; e.needs.pendingPee = (e.needs.pendingPee ?? 0) + v * 0.4; } if (e.hp != null) e.hp = Math.max(1, e.hp - hpLoss); return `Сытость +${v}, заражение -${hpLoss} HP. Пищевой компромисс`; }; }
function drink(v: number) { return (e: Entity) => { if (e.needs) { e.needs.water = Math.min(100, e.needs.water + v); e.needs.pendingPee = (e.needs.pendingPee ?? 0) + v * 0.6; } return `Вода +${v}. Горло снова верит в завтра`; }; }
function medicine(hp: number) { return (e: Entity) => { e.hp = Math.min((e.maxHp ?? 100), (e.hp ?? 0) + hp); return `Лечение +${hp}. Журнал раненых подождёт`; }; }
function psiMedicine(hp: number, psi: number) { return (e: Entity) => { e.hp = Math.min((e.maxHp ?? 100), (e.hp ?? 0) + hp); if (e.rpg) e.rpg.psi = Math.min(e.rpg.maxPsi, e.rpg.psi + psi); return hp > 0 ? `Лечение +${hp}, ПСИ +${psi}. Мысли закреплены бинтом` : `ПСИ +${psi}. В голове стало тише`; }; }
function openBlueGlowSample(e: Entity) { if (e.inventory) e.inventory.push({ defId: 'blue_glow_sample_open', count: 1 }); if (e.hp != null) e.hp = Math.max(1, e.hp - 6); return 'Герма снята: открыт синий образец. Ожог -6 HP, контаминация локальная'; }
function useOpenBlueGlowSample(e: Entity) { if (e.rpg) e.rpg.psi = Math.min(e.rpg.maxPsi, e.rpg.psi + 18); if (e.needs) e.needs.sleep = Math.min(100, e.needs.sleep + 10); if (e.hp != null) e.hp = Math.max(1, e.hp - 8); return 'Синий образец дал короткий прилив: ПСИ +18, бодрость +10, ожог -8 HP'; }

/** Stack size: weapons & PSI = 1, everything else = 999. Override with def.stack */
export function getStack(def: ItemDef): number {
  if (def.stack != null) return def.stack;
  return def.type === ItemType.WEAPON ? 1 : 999;
}

/** Max spawn count for generic world/NPC loot: cheap -> more, expensive -> less, weapons/tools = 1. */
export function spawnCount(def: ItemDef): number {
  if (def.type === ItemType.WEAPON || def.type === ItemType.TOOL || def.type === ItemType.KEY) return 1;
  if (def.type === ItemType.AMMO) return Math.max(1, Math.ceil(12 / Math.max(1, def.value)));
  const base = Math.max(1, Math.ceil(30 / Math.max(1, def.value)));
  return base;
}

export const ITEM_TAGS: Record<string, readonly string[]> = {
  manometer: ['pressure', 'heatline', 'tool'],
  asbestos_cord: ['repair', 'steam', 'heatline'],
  sealant_tube: ['repair', 'sealant', 'heatline'],
  valve_tag: ['pressure', 'proof', 'heatline'],
  bread: ['bait', 'bait_starch', 'bait_stale'],
  canned: ['bait', 'bait_meat', 'bait_sealed'],
  kasha: ['bait', 'bait_starch', 'bait_wet'],
  rawmeat: ['bait', 'bait_meat', 'bait_risky', 'bait_trap'],
  mushroom_mass: ['bait', 'bait_fungal', 'bait_wet'],
  infected_mushroom: ['bait', 'bait_fungal', 'bait_risky', 'contaminant'],
  grey_briquette: ['bait', 'bait_starch'],
  green_briquette: ['bait', 'bait_starch', 'bait_fungal'],
  liquidator_ration: ['bait', 'bait_meat'],
  pearl_barley: ['bait', 'bait_starch'],
  soup_cube: ['bait', 'bait_starch'],
  pressed_sugar: ['bait', 'bait_sugar'],
  yeast_bread: ['bait', 'bait_starch', 'bait_stale'],
  istotit_candle: ['istotit', 'candle', 'church_cache', 'psi_restore'],
  shelter_tally: ['istotit', 'shelter_tally', 'document', 'evidence'],
  forged_shelter_tally: ['istotit', 'shelter_tally', 'document', 'forgery'],
  maronary_shaving: ['maronary', 'contraband', 'evidence', 'science', 'cult'],
  water_coupon: ['ration', 'coupon', 'document', 'economy'],
  concentrate_coupon: ['ration', 'coupon', 'document', 'economy'],
  ration_registry_extract: ['ration', 'registry', 'document', 'audit'],
  forged_ration_card: ['ration', 'forged', 'contraband', 'audit'],
  ration_stamp_pad: ['ration', 'stamp', 'forgery', 'document'],
  temp_pass: ['document', 'pass', 'ministry', 'expired'],
  permanent_pass: ['document', 'pass', 'ministry'],
  fake_pass: ['document', 'permit', 'pass', 'forged', 'contraband', 'audit', 'access', 'document_gate'],
  archive_access_permit: ['document', 'permit', 'official', 'archive', 'access', 'ministry', 'document_gate'],
  forged_stamp_sheet: ['document', 'stamp', 'forgery', 'contraband', 'audit'],
  stolen_archive_card: ['document', 'archive', 'stolen', 'evidence', 'theft', 'access', 'document_gate'],
  official_permit_slip: ['document', 'permit', 'official', 'ministry', 'access', 'document_gate'],
  forged_permit_slip: ['document', 'permit', 'forged', 'forgery', 'contraband', 'audit', 'access', 'document_gate'],
  ministry_audit_forgery: ['document', 'forgery', 'ministry', 'audit', 'access', 'contraband'],
  weapon_permit_signed: ['document', 'permit', 'official', 'weapon_permit', 'legal', 'short_sidearm', 'access'],
  weapon_permit_forged: ['document', 'permit', 'forged', 'forgery', 'contraband', 'weapon_permit', 'audit'],
  ammo_issue_order: ['document', 'weapon_permit', 'ammo', 'single_use'],
  official_quarantine_clearance: ['document', 'permit', 'official', 'quarantine', 'medical'],
  forged_quarantine_clearance: ['document', 'permit', 'forged', 'forgery', 'contraband', 'quarantine'],
  elevator_access_order: ['document', 'permit', 'elevator', 'access', 'official'],
  void_archive_warrant: ['document', 'void', 'archive', 'warrant', 'evidence'],
  pneumomail_capsule: ['document', 'pneumomail', 'sealed', 'evidence'],
  shark_scale: ['rare_trophy', 'contraband', 'water', 'fake'],
  bottled_voice: ['rare_trophy', 'psi', 'evidence', 'voice'],
  siren_shard: ['rare_trophy', 'samosbor', 'psi', 'evidence'],
  void_spike: ['rare_trophy', 'void', 'psi', 'evidence'],
  zhelemish_raw: ['zhelemish', 'raw', 'skin_status', 'bait', 'bait_fungal', 'bait_risky'],
  zhelemish_dried: ['zhelemish', 'treated', 'skin_status', 'bait', 'bait_fungal'],
  zhelemish_boiled: ['zhelemish', 'treated', 'skin_status'],
  zhelemish_sample_sealed: ['zhelemish', 'sample', 'sealed', 'nii'],
  zhelemish_sample_contaminated: ['zhelemish', 'sample', 'contaminated', 'nii'],
  rock_salt: ['salt', 'fungus_counterplay', 'reagent'],
  veretar_sand: ['veretar', 'evidence', 'reagent', 'unsealed', 'contaminant'],
  sealed_veretar_sand: ['veretar', 'evidence', 'reagent', 'sealed', 'sample'],
  sand_spoiled_ration: ['veretar', 'spoiled', 'food'],
  bleached_document: ['veretar', 'spoiled', 'documents'],
  overexposed_photo: ['veretar', 'evidence', 'photo'],
  govnyak_roll: ['govnyak', 'contraband', 'pressure', 'bait', 'bait_govnyak'],
  govnyak_brick: ['govnyak', 'contraband', 'trade', 'bait', 'bait_govnyak'],
  govnyak_sample: ['govnyak', 'contraband', 'science', 'bait', 'bait_govnyak'],
  govnyak_bad_batch: ['govnyak', 'contraband', 'bad_batch', 'bait', 'bait_govnyak', 'bait_risky'],
  pills: ['medicine', 'psi_restore', 'common'],
  antidep: ['medicine', 'psi_restore', 'rare'],
  calm_brew: ['drink', 'psi_restore', 'common'],
  psi_stabilizer: ['medicine', 'psi_restore', 'stabilizer'],
  holy_water: ['medicine', 'psi_restore', 'rare'],
  [SILVER_SLIME_SEALED_ID]: ['slime', 'silver_slime', 'sample', 'sealed', 'contraband'],
  [SILVER_SLIME_OPENED_ID]: ['slime', 'silver_slime', 'sample', 'opened', 'contaminant'],
  nii_sample_container: ['nii', 'sample', 'container', 'science'],
  nii_contraband_manifest: ['nii', 'contraband', 'evidence', 'document', 'audit'],
  nii_market_receipt: ['nii', 'contraband', 'evidence', 'receipt', 'black_market'],
  nii_forged_audit: ['nii', 'forgery', 'audit', 'document', 'contraband'],
  ...CHERNOBOG_DOCKET_ITEM_TAGS,
};

export const ITEMS: Record<string, ItemDef> = {
  // ── Еда (дешёвая, частая) ──
  bread:     { id:'bread',     name:'Хлеб',         type:ItemType.FOOD,     desc:'Чёрствый пайковый ломоть. Сухой настолько, что им можно подпереть жалобу.',          spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE], spawnW:1, value:3, use:feed(15) },
  canned:    { id:'canned',    name:'Тушёнка',      type:ItemType.FOOD,     desc:'Мясная консерва без лишних вопросов к мясу. Крышка честнее этикетки.',        spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE], spawnW:1, value:10, use:feed(30) },
  kasha:     { id:'kasha',     name:'Каша',         type:ItemType.FOOD,     desc:'Холодная казённая каша. Ложка стоит в ней по уставу.',          spawnRooms:[RoomType.KITCHEN],                  spawnW:1, value:5, use:feed(20) },
  rawmeat:   { id:'rawmeat',   name:'Сырое мясо',   type:ItemType.FOOD,     desc:'Подозрительный кусок без протокола происхождения. Голод подписывает акт приёмки.',    spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:1, use:feed(10) },
  mushroom_mass:{ id:'mushroom_mass', name:'Грибная масса', type:ItemType.FOOD, desc:'Срезанный урожай из мокрой прачечной. Сытно, если не вспоминать, на чём он рос.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:6, use:feed(22) },
  infected_mushroom:{ id:'infected_mushroom', name:'Заражённый гриб', type:ItemType.FOOD, desc:'Пятнистая шляпка после сырости или мясного резонанса. Кормит тело и спорит с ним.', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:2, use:riskyFeed(12, 8) },

  // ── Желемыш AG101/AG103: ресурсные формы и временная дублёная кожа ──
  zhelemish_raw:{ id:'zhelemish_raw', name:'Сырой желемыш', type:ItemType.FOOD, desc:'Холодный комок погребной плесени, еды и плохой приметы. Дубит кожу ненадолго и грубо.', spawnRooms:[RoomType.STORAGE,RoomType.BATHROOM], spawnW:1, value:5, use:riskyFeed(10, 6) },
  zhelemish_dried:{ id:'zhelemish_dried', name:'Сушёный желемыш', type:ItemType.FOOD, desc:'Тёмная дублёная пластина из чужого погреба. Безопаснее сырого, но тоже делает кожу чужой.', spawnRooms:[RoomType.STORAGE,RoomType.KITCHEN], spawnW:1, value:11, use:feed(16) },
  zhelemish_boiled:{ id:'zhelemish_boiled', name:'Варёный желемыш', type:ItemType.MEDICINE, desc:'Слизистая припарка после кипятка. Немного лечит и кладёт поверх тела дешёвую защиту.', spawnRooms:[RoomType.KITCHEN,RoomType.MEDICAL], spawnW:1, value:16, use:medicine(8) },
  zhelemish_sample_sealed:{ id:'zhelemish_sample_sealed', name:'Запечатанный образец желемыша', type:ItemType.MISC, desc:'Чистая проба желемыша в таре НИИ. Пломба важнее содержимого: без неё лаборатория видит только грязь и повод.', spawnRooms:[], spawnW:0, value:240, stack:1 },
  zhelemish_sample_contaminated:{ id:'zhelemish_sample_contaminated', name:'Загрязнённый образец желемыша', type:ItemType.MISC, desc:'Открытый комок желемыша с чужой пылью, кожей и грибницей. Годится для слухов, но НИИ такой образец не примет.', spawnRooms:[], spawnW:0, value:18, stack:1 },
  rock_salt:{ id:'rock_salt', name:'Каменная соль', type:ItemType.MISC, desc:'Серый пакет соли для грибницы, мяса и чужой осторожности. На плотоядной плесени шипит лучше уговоров.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE,RoomType.BATHROOM], spawnW:1, value:4, tags:['salt','fungus_counterplay','reagent'] },

  // ── Говняк AG96: давление, контрабанда, bounded use in systems/govnyak.ts ──
  govnyak_roll:{ id:'govnyak_roll', name:'Говняк-самокрут', type:ItemType.MISC, desc:'Дешёвый свёрток для тех, кому нужно притушить шум сейчас и расплатиться позже.', spawnRooms:[RoomType.SMOKING,RoomType.COMMON,RoomType.STORAGE], spawnW:1, value:7, tags:['govnyak','contraband','pressure'], stack:12 },
  govnyak_brick:{ id:'govnyak_brick', name:'Прессованный говняк', type:ItemType.MISC, desc:'Плотный брикет из подвала рынка. Стоит как отсрочка, пахнет долгом.', spawnRooms:[RoomType.SMOKING,RoomType.STORAGE], spawnW:1, value:24, tags:['govnyak','contraband','trade'], stack:6 },
  govnyak_sample:{ id:'govnyak_sample', name:'Проба говняка НИИ', type:ItemType.MISC, desc:'Опломбированная лабораторная проба. Учёные платят за состав, ликвидаторы спрашивают источник.', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:85, tags:['govnyak','contraband','science'], stack:3 },
  govnyak_bad_batch:{ id:'govnyak_bad_batch', name:'Гремучая партия говняка', type:ItemType.MISC, desc:'Неровная партия с резким дымом. Рынок сбывает её быстро; последствия остаются у покупателя.', spawnRooms:[RoomType.SMOKING,RoomType.STORAGE], spawnW:1, value:13, tags:['govnyak','contraband','bad_batch'], stack:4 },

  // ── Напитки (дешёвые, частые) ──
  water:     { id:'water',     name:'Вода',         type:ItemType.DRINK,    desc:'Бутылка воды. Главное богатство блока, если не считать закрытой двери.',           spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE,RoomType.BATHROOM], spawnW:1, value:2, use:drink(25) },
  tea:       { id:'tea',       name:'Чай',          type:ItemType.DRINK,    desc:'Остывший чай из кружки с чужим сколом. Пахнет кухней и недосказанностью.',           spawnRooms:[RoomType.KITCHEN,RoomType.COMMON],  spawnW:1, value:3, use:drink(15) },
  kompot:    { id:'kompot',    name:'Компот',       type:ItemType.DRINK,    desc:'Мутный компот из столовой. На дне плавает аргумент не смотреть на дно.',          spawnRooms:[RoomType.KITCHEN],                  spawnW:1, value:5, use:drink(20) },

  // ── Медицина ──
  bandage:   { id:'bandage',   name:'Бинт',         type:ItemType.MEDICINE, desc:'Рулон бинта с больничной пылью. Держит кровь лучше обещаний.',            spawnRooms:[RoomType.MEDICAL,RoomType.BATHROOM],spawnW:1, value:10, use:medicine(15) },
  pills:     { id:'pills',     name:'Таблетки',     type:ItemType.MEDICINE, desc:'Обезболивающее из медшкафа. Лечит 25 HP, добавляет +3 ПСИ и немного тишины.',   spawnRooms:[RoomType.MEDICAL],                  spawnW:1, value:40, use:psiMedicine(25, 3) },
  antidep:   { id:'antidep',   name:'Антидепрессант',type:ItemType.MEDICINE, desc:'Психиатрическая роскошь для тех, кто слышит стены слишком отчётливо. +12 ПСИ.',           spawnRooms:[RoomType.MEDICAL],                  spawnW:0.7, value:95, use:psiMedicine(0, 12) },

  // ── Пасхальное (церковные припасы) ──
  holy_water:{ id:'holy_water', name:'Святая вода',  type:ItemType.MEDICINE, desc:'Освящённая вода из паломничьей фляги. Лечит 20 HP, +10 ПСИ; спорит с туманом недолго.', spawnRooms:[], spawnW:0, value:70, use:psiMedicine(20, 10) },
  kulich:    { id:'kulich',     name:'Кулич',        type:ItemType.FOOD,     desc:'Пасхальный кулич из храмовой кухни. Сытно, сладко, подозрительно светло.',  spawnRooms:[], spawnW:0, value:40, use:(e: Entity) => { if (e.needs) { e.needs.food = Math.min(100, e.needs.food + 35); e.needs.pendingPoo = (e.needs.pendingPoo ?? 0) + 25; } if (e.rpg) e.rpg.psi = Math.min(e.rpg.maxPsi, e.rpg.psi + 4); return 'Кулич согрел желудок и мысли: еда +35, ПСИ +4'; } },
  easter_egg:{ id:'easter_egg', name:'Пасхальное яйцо',type:ItemType.FOOD,  desc:'Крашеное яйцо с трещиной в форме подъезда. Восстанавливает 10 HP, +3 ПСИ.', spawnRooms:[], spawnW:0, value:20, use:(e: Entity) => { e.hp = Math.min((e.maxHp ?? 100), (e.hp ?? 0) + 10); if (e.rpg) e.rpg.psi = Math.min(e.rpg.maxPsi, e.rpg.psi + 3); return 'Скорлупа хрустнула, в голове стало ровнее: +10 HP, +3 ПСИ'; } },
  istotit_candle:{ id:'istotit_candle', name:'Истотитная свеча', type:ItemType.MEDICINE, desc:'Тонкая свеча из общего запаса. Успокаивает ПСИ на минуту, но вопрос "чья она" остается. +6 ПСИ.', spawnRooms:[], spawnW:0, value:45, use:(e: Entity) => { if (e.rpg) e.rpg.psi = Math.min(e.rpg.maxPsi, e.rpg.psi + 6); return 'Свеча коптит золотым: ПСИ +6. Очередь за дверью этого не видела'; } },

  // ── Расширенная еда и напитки AG07 ──
  grey_briquette: { id:'grey_briquette', name:'Пищебрикет серый', type:ItemType.FOOD, desc:'Прессованная масса без вкуса. Дёшево, честно, не задаёт вопросов.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE,RoomType.COMMON], spawnW:1, value:4, use:feed(18) },
  green_briquette:{ id:'green_briquette', name:'Пищебрикет зеленый', type:ItemType.FOOD, desc:'Зелёный по документам и чуть-чуть по совести отдела качества.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE], spawnW:1, value:6, use:feed(20) },
  liquidator_ration:{ id:'liquidator_ration', name:'Сухпай ликвидатора', type:ItemType.FOOD, desc:'Плотный паёк с запахом оружейки, мокрой шинели и приказа без даты.', spawnRooms:[RoomType.STORAGE,RoomType.HQ], spawnW:1, value:15, use:feed(40) },
  pearl_barley:{ id:'pearl_barley', name:'Перловка в банке', type:ItemType.FOOD, desc:'Жесткая крупа. Пережила больше жильцов.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE], spawnW:1, value:7, use:feed(24) },
  soup_cube:{ id:'soup_cube', name:'Суповой кубик', type:ItemType.FOOD, desc:'Один кубик, один обед, одно сомнение.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE], spawnW:1, value:3, use:feed(12) },
  pressed_sugar:{ id:'pressed_sugar', name:'Сахар прессованный', type:ItemType.FOOD, desc:'Сладкая плитка из пайкового набора.', spawnRooms:[RoomType.KITCHEN,RoomType.COMMON], spawnW:1, value:5, use:feed(8) },
  yeast_bread:{ id:'yeast_bread', name:'Дрожжевой хлеб', type:ItemType.FOOD, desc:'Поднимается даже после нарезки.', spawnRooms:[RoomType.KITCHEN], spawnW:1, value:8, use:feed(25) },
  filtered_water:{ id:'filtered_water', name:'Вода фильтрованная', type:ItemType.DRINK, desc:'Почти прозрачная. В Гигахруще это уже социальный лифт.', spawnRooms:[RoomType.KITCHEN,RoomType.MEDICAL,RoomType.STORAGE], spawnW:1, value:8, use:drink(35) },
  boiler_water:{ id:'boiler_water', name:'Кипяток', type:ItemType.DRINK, desc:'Горячая вода из чайника с накипью.', spawnRooms:[RoomType.KITCHEN,RoomType.COMMON], spawnW:1, value:3, use:drink(16) },
  metal_water:{ id:'metal_water', name:'Вода с привкусом металла', type:ItemType.DRINK, desc:'Пить можно. Доверять нельзя.', spawnRooms:[RoomType.BATHROOM,RoomType.PRODUCTION], spawnW:1, value:2, use:drink(20) },
  instant_coffee:{ id:'instant_coffee', name:'Кофе растворимый', type:ItemType.DRINK, desc:'Черная пыль для ночного дежурства.', spawnRooms:[RoomType.KITCHEN,RoomType.OFFICE], spawnW:1, value:10, use:drink(18) },
  siren_energy:{ id:'siren_energy', name:'Энергетик Сирена', type:ItemType.DRINK, desc:'Сладкий напиток с тревожным послевкусием. Банка тихо щёлкает, как дальний замок.', spawnRooms:[RoomType.STORAGE,RoomType.HQ], spawnW:1, value:14, use:(e: Entity) => { if (e.needs) { e.needs.water = Math.min(100, e.needs.water + 18); e.needs.sleep = Math.min(100, e.needs.sleep + 10); e.needs.pendingPee = (e.needs.pendingPee ?? 0) + 14; } return 'Вода +18, бодрость +10. Сердце слушает сирену заранее'; } },
  calm_brew:{ id:'calm_brew', name:'Успокоительный отвар', type:ItemType.DRINK, desc:'Тёплый отвар из аптечной кружки. Горчит так, будто знает диагноз. +5 ПСИ.', spawnRooms:[RoomType.MEDICAL,RoomType.KITCHEN], spawnW:0.8, value:18, use:psiMedicine(0, 5) },

  // ── Расширенная медицина AG07 ──
  tourniquet:{ id:'tourniquet', name:'Жгут', type:ItemType.MEDICINE, desc:'Старый резиновый жгут с трещинами, как у подъезда. Быстрое малое лечение.', spawnRooms:[RoomType.MEDICAL,RoomType.HQ], spawnW:1, value:20, use:medicine(12) },
  iodine:{ id:'iodine', name:'Йод', type:ItemType.MEDICINE, desc:'Жжёт кожу, сомнения и часть достоинства.', spawnRooms:[RoomType.MEDICAL,RoomType.BATHROOM], spawnW:1, value:25, use:medicine(10) },
  antibiotic:{ id:'antibiotic', name:'Антибиотик', type:ItemType.MEDICINE, desc:'Таблетки против обычной грязи. В карантине это не лечение, а выбор очереди.', spawnRooms:[RoomType.MEDICAL], spawnW:1, value:70, tags:['medicine','triage','antibiotic'], use:medicine(35) },
  morphine_ampoule:{ id:'morphine_ampoule', name:'Ампула морфина', type:ItemType.MEDICINE, desc:'Сильное обезболивание строгого учёта. Боль уходит, долг остаётся.', spawnRooms:[RoomType.MEDICAL,RoomType.HQ], spawnW:1, value:140, tags:['medicine','controlled'], use:medicine(60) },
  psi_stabilizer:{ id:'psi_stabilizer', name:'ПСИ-стабилизатор', type:ItemType.MEDICINE, desc:'Гасит дрожь после сгустков. +20 ПСИ: один сильный импульс, не новая жизнь.', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE], spawnW:0.35, value:220, use:psiMedicine(0, 20) },
  sanitary_kit:{ id:'sanitary_kit', name:'Санитарный набор', type:ItemType.MEDICINE, desc:'Бинт, спирт и инструкция без подписи. Лечит владельца или уходит целиком на карантинную сортировку.', spawnRooms:[RoomType.MEDICAL,RoomType.STORAGE], spawnW:1, value:90, tags:['medicine','triage','sanitary'], use:medicine(45) },
  antifungal_ointment:{ id:'antifungal_ointment', name:'Противогрибковая мазь', type:ItemType.MEDICINE, desc:'Пахнет подвалом и формальным спасением.', spawnRooms:[RoomType.MEDICAL,RoomType.BATHROOM], spawnW:1, value:55, tags:['medicine','fungus'], use:medicine(20) },

  // ── Оружие ближний бой ──
  pipe:      { id:'pipe',      name:'Труба',        type:ItemType.WEAPON,    desc:'Тяжёлая труба с запахом стояка. Урон 19. Держит дистанцию, но замах длинный. Прочность 60', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:40 },
  wrench:    { id:'wrench',    name:'Ключ гаечный', type:ItemType.WEAPON,    desc:'Надёжный ключ слесаря. Урон 12. Живёт долго, бьёт честно. Прочность 95',     spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:30 },
  knife:     { id:'knife',     name:'Нож',          type:ItemType.WEAPON,    desc:'Кухонный нож из общей кухни. Урон 7. Самый быстрый аварийный бой. Прочность 32',   spawnRooms:[RoomType.KITCHEN],                  spawnW:1, value:15 },
  rebar:     { id:'rebar',     name:'Арматура',     type:ItemType.WEAPON,    desc:'Кусок арматуры из старой стены. Урон 24. Дальний тяжёлый тычок. Прочность 95', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:80 },
  axe:       { id:'axe',       name:'Топор',        type:ItemType.WEAPON,    desc:'Пожарный топор. Урон 36. Короткий сильный удар с долгим возвратом. Прочность 65', spawnRooms:[RoomType.PRODUCTION],                  spawnW:1, value:140 },
  chainsaw:  { id:'chainsaw',  name:'Бензопила',    type:ItemType.WEAPON,    desc:'Бензопила. Урон 40. Паническая мясорубка на несколько ударов. Прочность 14', spawnRooms:[RoomType.PRODUCTION], spawnW:1, value:3000 },

  // ── Оружие огнестрельное ──
  makarov:   { id:'makarov',   name:'Макаров',      type:ItemType.WEAPON,    desc:'Пистолет ПМ. Урон 17. Точный дешёвый выстрел, не очередь. Патроны 9мм',    spawnRooms:[RoomType.STORAGE],                  spawnW:1, value:200 },
  ppsh:      { id:'ppsh',      name:'ППШ',          type:ItemType.WEAPON,    desc:'Пистолет-пулемёт. Урон 7. Давит темпом и быстро съедает 9мм', spawnRooms:[RoomType.STORAGE], spawnW:1, value:650 },
  shotgun:   { id:'shotgun',   name:'Обрез',        type:ItemType.WEAPON,    desc:'Обрез. Урон 10×6. Широкий близкий стоппер для коридора. Дробь',               spawnRooms:[RoomType.STORAGE],                  spawnW:1, value:340 },
  nailgun:   { id:'nailgun',   name:'Гвоздомёт',    type:ItemType.WEAPON,    desc:'Промышленный гвоздомёт. Урон 12. Точный рабочий выстрел, гвозди дефицитны',      spawnRooms:[RoomType.PRODUCTION],                  spawnW:1, value:300 },
  ak47:      { id:'ak47',      name:'Калашников',    type:ItemType.WEAPON,    desc:'АК-47. Урон 22. Сильная очередь под редкие 7.62мм', spawnRooms:[], spawnW:0, value:1200 },
  machinegun:{ id:'machinegun', name:'Пулемёт',     type:ItemType.WEAPON,    desc:'ПКМ. Урон 13. Самый злой расход, широкий разброс. Ленточное питание', spawnRooms:[], spawnW:0, value:2800 },
  grenade:   { id:'grenade',   name:'Граната',      type:ItemType.WEAPON,   desc:'РГД-5. Урон 85 по площади. Кидай и прячься', spawnRooms:[RoomType.STORAGE], spawnW:1, value:100, stack:999 },
  gauss:     { id:'gauss',     name:'Гаусс-винтовка', type:ItemType.WEAPON,  desc:'Рельсотрон. Урон 135. Медленный точный выстрел за энергоячейку', spawnRooms:[], spawnW:0, value:6000 },
  plasma:    { id:'plasma',    name:'Плазмаган',    type:ItemType.WEAPON,    desc:'Плазменное оружие. Урон 24. Быстрая неточная трата энергоячеек', spawnRooms:[], spawnW:0, value:3200 },
  bfg:       { id:'bfg',       name:'БФГ-9000',     type:ItemType.WEAPON,    desc:'BIG FUCKING GUN. Урон 210 по огромной площади. Энергоячейки исчезают вместе с комнатой', spawnRooms:[], spawnW:0, value:11000 },
  flamethrower:{ id:'flamethrower', name:'Огнемёт', type:ItemType.WEAPON,    desc:'Короткая струя огня. Урон 5 за плевок. Выжигает слизь и грибной налёт, быстро тратит бензин', spawnRooms:[], spawnW:0, value:2500 },

  // ── Физическое оружие AG07: только существующие механики ──
  hammer:   { id:'hammer', name:'Молоток', type:ItemType.WEAPON, desc:'Рабочий молоток. Урон 13. Быстрее ключа, короче трубы. Прочность 75', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:30 },
  crowbar:  { id:'crowbar', name:'Лом', type:ItemType.WEAPON, desc:'Тяжёлый лом. Урон 26. Средняя дистанция, высокая прочность 110', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:85 },
  sledgehammer:{ id:'sledgehammer', name:'Кувалда', type:ItemType.WEAPON, desc:'Медленная кувалда. Урон 52. Большой замах, большой ответ. Прочность 85', spawnRooms:[RoomType.PRODUCTION], spawnW:1, value:220 },
  fire_hook:{ id:'fire_hook', name:'Пожарный багор', type:ItemType.WEAPON, desc:'Самый длинный ближний бой. Урон 20. Держит тварь на вытянутой руке. Прочность 80', spawnRooms:[RoomType.STORAGE,RoomType.CORRIDOR], spawnW:1, value:100 },
  entrenching_spade:{ id:'entrenching_spade', name:'Саперная лопатка', type:ItemType.WEAPON, desc:'Короткая военная лопатка. Урон 17. Надёжная. Прочность 95', spawnRooms:[RoomType.STORAGE,RoomType.HQ], spawnW:1, value:70 },
  bayonet:{ id:'bayonet', name:'Штык', type:ItemType.WEAPON, desc:'Узкий быстрый укол. Урон 15. Дальше ножа, слабее топора. Прочность 65', spawnRooms:[RoomType.HQ,RoomType.STORAGE], spawnW:1, value:90 },
  chain:{ id:'chain', name:'Цепь', type:ItemType.WEAPON, desc:'Ржавая цепь. Урон 17. Длинная, быстрая для своей длины и неровная. Прочность 75', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:55 },
  metal_chair:{ id:'metal_chair', name:'Металлический стул', type:ItemType.WEAPON, desc:'Стул из актового ада. Урон 23. Хрупкий широкий удар. Прочность 28', spawnRooms:[RoomType.COMMON,RoomType.OFFICE], spawnW:1, value:25 },
  tt_pistol:{ id:'tt_pistol', name:'ТТ', type:ItemType.WEAPON, desc:'Пистолет ТТ. Урон 24. Мощнее ПМ, патроны 7.62 ТТ', spawnRooms:[RoomType.HQ,RoomType.STORAGE], spawnW:1, value:280 },
  nagant:{ id:'nagant', name:'Револьвер Наган', type:ItemType.WEAPON, desc:'Старый револьвер. Урон 32. Очень медленный точный выстрел', spawnRooms:[RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:280 },
  homemade_pistol:{ id:'homemade_pistol', name:'Самодельный пистолет', type:ItemType.WEAPON, desc:'Грубая однозарядная поделка. Урон 20. Сильный разброс. 9мм', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:90 },
  toz_shotgun:{ id:'toz_shotgun', name:'ТОЗ', type:ItemType.WEAPON, desc:'Длинный охотничий дробовик. Урон 7x9. Туже, дальше и медленнее обреза. Дробь', spawnRooms:[RoomType.STORAGE,RoomType.HQ], spawnW:1, value:460 },
  harpoon_gun:{ id:'harpoon_gun', name:'Гарпун', type:ItemType.WEAPON, desc:'Для затопленных ходов. Урон 78. Медленный точный промышленный гарпун', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:900 },

  // ── Патроны ──
  ammo_9mm:  { id:'ammo_9mm',  name:'Патроны 9мм',  type:ItemType.AMMO,     desc:'Девятка для ПМ, самоделок и ППШ. Маленькая валюта коридорной уверенности',                  spawnRooms:[], spawnW:0, value:3 },
  ammo_shells:{ id:'ammo_shells',name:'Дробь',       type:ItemType.AMMO,     desc:'Дробовые патроны для коридорных стволов',                     spawnRooms:[],                  spawnW:0, value:8 },
  ammo_nails:{ id:'ammo_nails', name:'Гвозди',      type:ItemType.AMMO,     desc:'Промышленные гвозди для гвоздомёта',                spawnRooms:[], spawnW:0, value:6 },
  ammo_762:  { id:'ammo_762',   name:'Патроны 7.62',  type:ItemType.AMMO,     desc:'Редкие винтовочные патроны для Калашникова',              spawnRooms:[], spawnW:0, value:14 },
  ammo_belt: { id:'ammo_belt',  name:'Лента 7.62',   type:ItemType.AMMO,     desc:'Пулемётная лента. Большой вес и большой расход',      spawnRooms:[], spawnW:0, value:80 },
  ammo_energy:{ id:'ammo_energy', name:'Энергоячейка', type:ItemType.AMMO,    desc:'Редкая энергоячейка для плазмы, гаусса и БФГ', spawnRooms:[], spawnW:0, value:180 },
  ammo_fuel: { id:'ammo_fuel',  name:'Канистра бензина', type:ItemType.AMMO,  desc:'Дефицитное топливо для огнемёта',     spawnRooms:[], spawnW:0, value:45 },
  ammo_762tt:{ id:'ammo_762tt', name:'Патроны 7.62 ТТ', type:ItemType.AMMO, desc:'Пистолетные патроны для ТТ', spawnRooms:[], spawnW:0, value:8 },
  ammo_nagant:{ id:'ammo_nagant', name:'Патроны Наган', type:ItemType.AMMO, desc:'Старые револьверные патроны', spawnRooms:[], spawnW:0, value:7 },
  ammo_harpoon:{ id:'ammo_harpoon', name:'Гарпуны', type:ItemType.AMMO, desc:'Тяжелые редкие гарпуны для водных ходов', spawnRooms:[], spawnW:0, value:35 },

  // ── Сгустки (ПСИ-руны) — очень дорогие, ультраредкие ──
  psi_strike:   { id:'psi_strike',    name:'Сгусток: Пси удар',        type:ItemType.WEAPON, desc:'Простейший мысленный снаряд. 3 ПСИ, 15 урона; стена вздрагивает вместе с целью',                                     spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE,RoomType.COMMON], spawnW:1, value:130 },
  psi_rupture:  { id:'psi_rupture',   name:'Сгусток: Разрыв',          type:ItemType.WEAPON, desc:'Медленный взрыв ПСИ-энергии. 8 ПСИ, 22 урона по площади; не стойте рядом с аргументом',                    spawnRooms:[RoomType.MEDICAL,RoomType.STORAGE],               spawnW:0.7, value:560 },
  psi_storm:    { id:'psi_storm',     name:'Сгусток: Пси буря',        type:ItemType.WEAPON, desc:'Дорогая волна боли. 18 ПСИ, бьёт всех врагов в поле зрения и часть здравого смысла',                       spawnRooms:[RoomType.MEDICAL],                                spawnW:0.35, value:2200 },
  psi_brainburn:{ id:'psi_brainburn', name:'Сгусток: Выжиг мозга',     type:ItemType.WEAPON, desc:'Мгновенная смерть цели ≤ вашего уровня. 20 ПСИ',                     spawnRooms:[RoomType.MEDICAL],                                spawnW:0.25, value:3800 },
  psi_madness:  { id:'psi_madness',   name:'Сгусток: Безумие',         type:ItemType.WEAPON, desc:'Цель нападает на всех. 9 ПСИ, 15с',                                 spawnRooms:[RoomType.OFFICE,RoomType.COMMON],                 spawnW:0.65, value:760 },
  psi_control:  { id:'psi_control',   name:'Сгусток: Контроль',        type:ItemType.WEAPON, desc:'Цель становится союзником. 18 ПСИ, 15с',                              spawnRooms:[RoomType.MEDICAL],                                spawnW:0.25, value:3900 },
  psi_phase:    { id:'psi_phase',     name:'Сгусток: Фазовый сдвиг',   type:ItemType.WEAPON, desc:'Проходить сквозь стены. 16 ПСИ, 15с',                                 spawnRooms:[RoomType.STORAGE],                                spawnW:0.2, value:5600 },
  psi_mark:     { id:'psi_mark',      name:'Сгусток: Метка',           type:ItemType.WEAPON, desc:'Запомнить позицию для телепорта. 5 ПСИ',                              spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE],                spawnW:0.8, value:280 },
  psi_recall:   { id:'psi_recall',    name:'Сгусток: Возврат',         type:ItemType.WEAPON, desc:'Телепорт к метке. 7 ПСИ; обратная дорога тоже просит запас',                                             spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE],                spawnW:0.65, value:360 },
  psi_beam:     { id:'psi_beam',      name:'Сгусток: Хамехамеха',     type:ItemType.WEAPON, desc:'Мощный ПСИ-луч. 12 ПСИ за импульс, 26 урона по пути', spawnRooms:[RoomType.MEDICAL], spawnW:0.18, value:9000 },
  psi_concrete_splinter:{ id:'psi_concrete_splinter', name:'Сгусток: Бетонный осколок', type:ItemType.WEAPON, desc:'ПСИ-снаряд из памяти стены. 5 ПСИ, 24 урона', spawnRooms:[RoomType.MEDICAL,RoomType.PRODUCTION], spawnW:0.75, value:650 },
  psi_shadow_lance:{ id:'psi_shadow_lance', name:'Сгусток: Теневая пика', type:ItemType.WEAPON, desc:'Быстрый темный прокол. 10 ПСИ, 38 урона', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE], spawnW:0.45, value:1300 },
  psi_order_seal:{ id:'psi_order_seal', name:'Сгусток: Печать порядка', type:ItemType.WEAPON, desc:'Плотный взрыв печати. 11 ПСИ, 32 урона по малой площади', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:0.4, value:1600 },
  psi_void_needle:{ id:'psi_void_needle', name:'Сгусток: Пустотная игла', type:ItemType.WEAPON, desc:'Редкий точный снаряд. 20 ПСИ, 90 урона', spawnRooms:[RoomType.MEDICAL], spawnW:0.15, value:4200 },
  psi_meat_hook:{ id:'psi_meat_hook', name:'Сгусток: Мясной крюк', type:ItemType.WEAPON, desc:'Тяжелый органический снаряд. 11 ПСИ, 42 урона', spawnRooms:[RoomType.MEDICAL,RoomType.STORAGE], spawnW:0.45, value:1100 },
  psi_siren_pulse:{ id:'psi_siren_pulse', name:'Сгусток: Сиренный импульс', type:ItemType.WEAPON, desc:'ПСИ-снаряд с малым разрывом. 12 ПСИ, 30 урона', spawnRooms:[RoomType.HQ,RoomType.OFFICE], spawnW:0.35, value:2100 },

  // ── Документы, экономика, компоненты и лор AG07 ──
  spore_print:{ id:'spore_print', name:'Споровый отпечаток', type:ItemType.MISC, desc:'Темный отпечаток на бумаге. С него начинают грибную смену.', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:12 },
  substrate_sack:{ id:'substrate_sack', name:'Мешок субстрата', type:ItemType.MISC, desc:'Влажная труха для стеллажей. Пахнет коллектором и обедом.', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION,RoomType.BATHROOM], spawnW:1, value:10 },
  water_coupon:{ id:'water_coupon', name:'Талон на воду', type:ItemType.MISC, desc:'Бумага на право одной бутылки. Используйте честно, украдите как улику или пустите в подделку.', spawnRooms:[RoomType.OFFICE,RoomType.COMMON,RoomType.KITCHEN], spawnW:1, value:2 },
  concentrate_coupon:{ id:'concentrate_coupon', name:'Талон на концентрат', type:ItemType.MISC, desc:'Пищевой талон с жирной печатью. Можно погасить на брикет или испортить под штемпель.', spawnRooms:[RoomType.OFFICE,RoomType.COMMON,RoomType.STORAGE], spawnW:1, value:3 },
  cult_supply_list:{ id:'cult_supply_list', name:'Кухонный список ячейки', type:ItemType.MISC, desc:'Хлеб, ключи, фамилии и стрелки к чужим кастрюлям. Доказательство пахнет кипятком.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE,RoomType.OFFICE], spawnW:1, value:38 },
  borrowed_kitchen_key:{ id:'borrowed_kitchen_key', name:'Заёмный кухонный ключ', type:ItemType.MISC, desc:'Ключ с биркой общей кухни. Вернуть просили до сирены, но бирка уже врёт.', spawnRooms:[RoomType.KITCHEN,RoomType.STORAGE], spawnW:1, value:28 },
  liquidator_token:{ id:'liquidator_token', name:'Жетон ликвидатора', type:ItemType.MISC, desc:'Номер выбит глубже, чем имя.', spawnRooms:[RoomType.HQ,RoomType.STORAGE], spawnW:1, value:80 },
  fake_pass:{ id:'fake_pass', name:'Фальшивый пропуск', type:ItemType.MISC, desc:'Почти правильный цвет, почти правильная смерть.', spawnRooms:[RoomType.OFFICE,RoomType.SMOKING], spawnW:1, value:45 },
  zhek_seal:{ id:'zhek_seal', name:'Печать ЖЭК', type:ItemType.MISC, desc:'Резиновая власть над мокрой бумагой.', spawnRooms:[RoomType.OFFICE,RoomType.COMMON], spawnW:1, value:120 },
  hermo_gasket:{ id:'hermo_gasket', name:'Гермоуплотнитель', type:ItemType.MISC, desc:'Резина для дверей, которые еще делают вид.', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:60 },
  fuse:{ id:'fuse', name:'Предохранитель', type:ItemType.MISC, desc:'Маленькая деталь между светом и пожаром.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:20 },
  gasmask_filter:{ id:'gasmask_filter', name:'Фильтр противогаза', type:ItemType.MISC, desc:'Сухой фильтр для мокрого страха.', spawnRooms:[RoomType.STORAGE,RoomType.HQ], spawnW:1, value:70 },
  manometer:{ id:'manometer', name:'Манометр', type:ItemType.MISC, desc:'Стрелка показывает давление и настроение труб. На Теплотрассе Ноль делает ремонт точным, но сам не тратится.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:35 },
  radio:{ id:'radio', name:'Рация', type:ItemType.TOOL, desc:'Шипит чужими этажами. Пока только ценный инструмент.', spawnRooms:[RoomType.HQ,RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:180, durability:120 },
  fog_detector:{ id:'fog_detector', name:'Детектор тумана', type:ItemType.TOOL, desc:'Пищит рядом с самосборной сыростью.', spawnRooms:[RoomType.MEDICAL,RoomType.HQ], spawnW:1, value:220, durability:80 },
  unpeople_detector:{ id:'unpeople_detector', name:'Детектор нелюдей', type:ItemType.TOOL, desc:'Ненадежная коробка для надежной паранойи.', spawnRooms:[RoomType.OFFICE,RoomType.MEDICAL], spawnW:1, value:300, durability:60 },
  acid_bottle:{ id:'acid_bottle', name:'Кислота', type:ItemType.MISC, desc:'Промышленная кислота в бутылке без этикетки.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:40 },
  duct_tape:{ id:'duct_tape', name:'Изолента', type:ItemType.MISC, desc:'Черная лента для ремонта и лжи.', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION,RoomType.LIVING], spawnW:1, value:8 },
  wire_coil:{ id:'wire_coil', name:'Моток проволоки', type:ItemType.MISC, desc:'Вязкая сталь для ловушек и дверей.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:12 },
  diver_route_tag:{ id:'diver_route_tag', name:'Бирка водолазного маршрута', type:ItemType.MISC, desc:'Мокрая латунная бирка с зарубками сухого моста. Коту нужна как доказательство, что путь через угрей ещё держится.', spawnRooms:[], spawnW:0, value:55, tags:['maintenance','diver','water_bridge','route'], stack:1 },
  shark_scale:{ id:'shark_scale', name:'Акулья чешуя', type:ItemType.MISC, desc:'Легендарный мокрый трофей. Возможно, подделка. Черный рынок платит за саму невозможность.', spawnRooms:[RoomType.BATHROOM,RoomType.STORAGE], spawnW:0.03, value:1000, tags:['rare_trophy','contraband','water','fake'] },
  bottled_voice:{ id:'bottled_voice', name:'Голос в банке', type:ItemType.MISC, desc:'Стекло дрожит, когда рядом молчат.', spawnRooms:[RoomType.STORAGE,RoomType.OFFICE], spawnW:1, value:250 },
  siren_shard:{ id:'siren_shard', name:'Осколок сирены', type:ItemType.MISC, desc:'Кусок красного пластика, который помнит тревогу.', spawnRooms:[RoomType.CORRIDOR,RoomType.STORAGE], spawnW:1, value:90 },
  void_spike:{ id:'void_spike', name:'Пустотный шип', type:ItemType.MISC, desc:'Черный шип без правильной тени.', spawnRooms:[], spawnW:0, value:1500 },
  meat_rune:{ id:'meat_rune', name:'Мясная руна', type:ItemType.MISC, desc:'Культовая метка, теплая сквозь тряпку.', spawnRooms:[RoomType.COMMON,RoomType.STORAGE,RoomType.SMOKING], spawnW:1, value:220 },
  child_map:{ id:'child_map', name:'Карта детей', type:ItemType.MISC, desc:'Карандашная карта с комнатой, которой нет.', spawnRooms:[RoomType.LIVING,RoomType.COMMON], spawnW:1, value:30 },
  metro_ticket:{ id:'metro_ticket', name:'Билет метро', type:ItemType.MISC, desc:'Билет на линию, которой официально не существует.', spawnRooms:[RoomType.CORRIDOR,RoomType.OFFICE], spawnW:1, value:25 },
  pneumomail_capsule:{ id:'pneumomail_capsule', name:'Опечатанная пневмокапсула', type:ItemType.MISC, desc:'Латунный тубус старой пневмопочты. Можно сдать, продать или отправить как улику.', spawnRooms:[], spawnW:0, value:65, stack:1 },
  clean_health_cert:{ id:'clean_health_cert', name:'Справка об отсутствии заражения', type:ItemType.MISC, desc:'Сухая печать, мокрая подпись.', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE], spawnW:1, value:35, tags:['quarantine','document'] },
  psychiatrist_referral:{ id:'psychiatrist_referral', name:'Направление к психиатру', type:ItemType.MISC, desc:'Адрес кабинета зачеркнут четыре раза.', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE], spawnW:1, value:18 },
  quarantine_medcard:{ id:'quarantine_medcard', name:'Карантинная медкарта', type:ItemType.MISC, desc:'Карта пациента с красной полосой допуска.', spawnRooms:[], spawnW:0, value:45, tags:['quarantine','document','medical'] },
  hermodoor_journal:{ id:'hermodoor_journal', name:'Журнал гермодверей', type:ItemType.MISC, desc:'Кто закрылся, кто не успел, кто был вычеркнут.', spawnRooms:[RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:55 },
  pump_passport:{ id:'pump_passport', name:'Паспорт насоса', type:ItemType.MISC, desc:'Документ доказывает, что насос был человеком.', spawnRooms:[RoomType.PRODUCTION,RoomType.OFFICE], spawnW:1, value:40 },
  temp_pass:{ id:'temp_pass', name:'Пропуск временный', type:ItemType.MISC, desc:'Истек вчера, но коридор еще не знает.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:20 },
  permanent_pass:{ id:'permanent_pass', name:'Пропуск постоянный', type:ItemType.MISC, desc:'Постоянный до первого самосбора.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:90 },
  caravan_route:{ id:'caravan_route', name:'Маршрут каравана', type:ItemType.MISC, desc:'Список дверей, которые должны были быть коридорами.', spawnRooms:[RoomType.OFFICE,RoomType.SMOKING], spawnW:1, value:65 },
  lift_scheme:{ id:'lift_scheme', name:'Схема лифтов', type:ItemType.MISC, desc:'Черные стрелки идут вниз даже на верхнем листе.', spawnRooms:[RoomType.OFFICE,RoomType.CORRIDOR], spawnW:1, value:75 },
  blank_form:{ id:'blank_form', name:'Пустой бланк', type:ItemType.MISC, desc:'Самый опасный документ: еще ничего не запрещает.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:10 },
  archive_access_permit:{ id:'archive_access_permit', name:'Допуск в архив', type:ItemType.MISC, desc:'Короткий пропуск к картотеке райсовета.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:85 },
  forged_stamp_sheet:{ id:'forged_stamp_sheet', name:'Лист с поддельной печатью', type:ItemType.MISC, desc:'Подделка для архивного прохода, ночного оружейного окна и скупки подделок. Свидетели и аудит запоминают ровную печать.', spawnRooms:[RoomType.OFFICE,RoomType.SMOKING], spawnW:1, value:70, tags:['document','stamp','forgery','contraband','audit'] },
  forged_shelter_tally:{ id:'forged_shelter_tally', name:'Липовая ведомость укрытых', type:ItemType.MISC, desc:'Исправленный список после Истотита. Лишние фамилии выглядят живее настоящих.', spawnRooms:[], spawnW:0, value:95 },
  stolen_archive_card:{ id:'stolen_archive_card', name:'Краденая архивная карточка', type:ItemType.MISC, desc:'Чужое дело на плотном картоне.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:60 },
  missing_record_file:{ id:'missing_record_file', name:'Пропавшее личное дело', type:ItemType.MISC, desc:'Папка с пустым местом вместо человека.', spawnRooms:[RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:95 },
  record_exposure_notice:{ id:'record_exposure_notice', name:'Акт о пропавшей записи', type:ItemType.MISC, desc:'Доказывает, что архив потерял доказательство.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:80 },
  passport_stub:{ id:'passport_stub', name:'Паспортный корешок', type:ItemType.MISC, desc:'Полпаспорт, полобещание пропустить.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:45 },
  personal_file_copy:{ id:'personal_file_copy', name:'Копия личного дела', type:ItemType.MISC, desc:'Выписка о человеке, который пока совпадает с собой.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:110 },
  neighbor_complaint:{ id:'neighbor_complaint', name:'Жалоба соседа', type:ItemType.MISC, desc:'Почерк злой, аргументы точные.', spawnRooms:[RoomType.LIVING,RoomType.OFFICE], spawnW:1, value:5 },
  denunciation:{ id:'denunciation', name:'Донос', type:ItemType.MISC, desc:'Подписан чужой рукой слишком уверенно.', spawnRooms:[RoomType.OFFICE,RoomType.SMOKING], spawnW:1, value:12 },
  unsigned_order:{ id:'unsigned_order', name:'Приказ без подписи', type:ItemType.MISC, desc:'Обязателен к исполнению, пока никто не спросил.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:22 },
  siren_instruction:{ id:'siren_instruction', name:'Инструкция при сирене', type:ItemType.MISC, desc:'Третий пункт вымаран фиолетовым.', spawnRooms:[RoomType.COMMON,RoomType.OFFICE,RoomType.LIVING], spawnW:1, value:4 },
  voluntary_receipt:{ id:'voluntary_receipt', name:'Расписка о добровольном участии', type:ItemType.MISC, desc:'Добровольность проставлена печатью.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:14 },
  gear:{ id:'gear', name:'Шестерня', type:ItemType.MISC, desc:'Зубчатая мелочь для механизмов.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:9 },
  spring:{ id:'spring', name:'Пружина', type:ItemType.MISC, desc:'Деталь хочет обратно в механизм.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:7 },
  circuit_board:{ id:'circuit_board', name:'Микросхема', type:ItemType.MISC, desc:'Плата с дорожками как план этажа.', spawnRooms:[RoomType.PRODUCTION,RoomType.OFFICE], spawnW:1, value:35 },
  lamp_bulb:{ id:'lamp_bulb', name:'Лампа', type:ItemType.MISC, desc:'Целая лампа. Редкая честность.', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION,RoomType.OFFICE], spawnW:1, value:12 },
  barrel_part:{ id:'barrel_part', name:'Ствол', type:ItemType.MISC, desc:'Оружейная трубка без права на ошибку.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:80 },
  gunstock:{ id:'gunstock', name:'Приклад', type:ItemType.MISC, desc:'Дерево для плеча и отдачи.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:35 },
  magazine_part:{ id:'magazine_part', name:'Магазин', type:ItemType.MISC, desc:'Пустой магазин. Полный стоит дороже.', spawnRooms:[RoomType.STORAGE,RoomType.HQ], spawnW:1, value:45 },
  metal_sheet:{ id:'metal_sheet', name:'Лист металла', type:ItemType.MISC, desc:'Плоская броня для бедных дверей.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:22 },
  cloth_roll:{ id:'cloth_roll', name:'Ткань', type:ItemType.MISC, desc:'Рулон серой ткани без запаха дома.', spawnRooms:[RoomType.LIVING,RoomType.STORAGE], spawnW:1, value:6 },
  alcohol_bottle:{ id:'alcohol_bottle', name:'Спирт', type:ItemType.MISC, desc:'Технический спирт. Медики смотрят строго.', spawnRooms:[RoomType.MEDICAL,RoomType.PRODUCTION], spawnW:1, value:30 },
  rubber_strip:{ id:'rubber_strip', name:'Резина', type:ItemType.MISC, desc:'Черная полоска от старого уплотнителя.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:10 },
  glass_shard:{ id:'glass_shard', name:'Стекло', type:ItemType.MISC, desc:'Острый остаток окна, которого не было.', spawnRooms:[RoomType.LIVING,RoomType.CORRIDOR], spawnW:1, value:2 },
  filter_layer:{ id:'filter_layer', name:'Фильтрующий слой', type:ItemType.MISC, desc:'Серый материал для фильтра или повязки.', spawnRooms:[RoomType.MEDICAL,RoomType.STORAGE], spawnW:1, value:16 },
  ink_bottle:{ id:'ink_bottle', name:'Чернила', type:ItemType.MISC, desc:'Черные чернила для белой лжи.', spawnRooms:[RoomType.OFFICE], spawnW:1, value:8 },
  asbestos_cord:{ id:'asbestos_cord', name:'Асбестовый шнур', type:ItemType.MISC, desc:'Огнеупорная нить для горячих дверей и горячих вентилей. На Теплотрассе Ноль тратится при ремонте.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:18 },
  sealant_tube:{ id:'sealant_tube', name:'Герметик', type:ItemType.MISC, desc:'Тюбик серого состава для щелей, труб и слепых решений. На Теплотрассе Ноль тратится при ремонте.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE,RoomType.BATHROOM], spawnW:1, value:20 },
  psi_dust:{ id:'psi_dust', name:'ПСИ-пыль', type:ItemType.MISC, desc:'Мерцающая пыль из-под старой печати.', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE], spawnW:1, value:120 },
  deactivated_residue:{ id:'deactivated_residue', name:'Гашёный остаток', type:ItemType.MISC, desc:'Серый сухой осадок после печи. Уже не тянется к пальцам, но акт всё равно нужен.', spawnRooms:[], spawnW:0, value:55 },
  maronary_shaving:{ id:'maronary_shaving', name:'Золотая стружка', type:ItemType.MISC, desc:'Тонкая золотая стружка после зелёного инцидента. Дорогой образец, контрабанда и улика: учёные платят, культисты молятся, Министерство оформляет владельца.', spawnRooms:[], spawnW:0, value:260, tags:['maronary','contraband','evidence','science','cult'] },
  veretar_sand:{ id:'veretar_sand', name:'Белый песок', type:ItemType.MISC, desc:'Улика/реагент Веретара: сухой белый осадок из области. Открытый пакет портит еду и бумаги рядом; используйте герметик, чтобы запечатать пробу.', spawnRooms:[], spawnW:0, value:160, tags:['veretar','evidence','reagent','unsealed','contaminant'], stack:6 },
  sealed_veretar_sand:{ id:'sealed_veretar_sand', name:'Белый песок в гермопакете', type:ItemType.MISC, desc:'Запечатанная проба Веретара. Улика и реагент: Министерство примет как доказательство, Яков как науку, рынок как чужую беду.', spawnRooms:[], spawnW:0, value:260, tags:['veretar','evidence','reagent','sealed','sample'], stack:3 },
  sand_spoiled_ration:{ id:'sand_spoiled_ration', name:'Пайка с белым песком', type:ItemType.FOOD, desc:'Еда, в которую попал белый песок. Съедобность осталась только формально.', spawnRooms:[], spawnW:0, value:0, tags:['veretar','spoiled','food'], use:riskyFeed(4, 6) },
  bleached_document:{ id:'bleached_document', name:'Выбеленная бумага', type:ItemType.MISC, desc:'Документ после контакта с белым песком. Текст ушёл наружу, подписи держатся хуже пыли.', spawnRooms:[], spawnW:0, value:0, tags:['veretar','spoiled','documents'] },
  overexposed_photo:{ id:'overexposed_photo', name:'Засвеченный кадр', type:ItemType.MISC, desc:'Белый снимок после Веретара. Если наклонить, планировка на нём не совпадает с домом.', spawnRooms:[], spawnW:0, value:140 },

  // ── Образцы слизи AG61: spawnW 0, источник задают будущие slime sites/contracts ──
  slime_sample_brown:{ id:'slime_sample_brown', name:'Проба коричневой слизи', type:ItemType.MISC, desc:'Запечатанная пробирка с дешёвым остатком после самосбора. Жильцы платят за чистый проход.', spawnRooms:[], spawnW:0, value:35 },
  slime_sample_green:{ id:'slime_sample_green', name:'Проба зелёной слизи', type:ItemType.MISC, desc:'Кислая проба в толстом стекле. НИИ просит не ставить её рядом с едой и тканью.', spawnRooms:[], spawnW:0, value:120 },
  slime_sample_white:{ id:'slime_sample_white', name:'Проба белой слизи', type:ItemType.MISC, desc:'Матовая пробирка с белым остатком. На неё лучше не смотреть дольше подписи в акте.', spawnRooms:[], spawnW:0, value:180 },
  slime_sample_red:{ id:'slime_sample_red', name:'Проба красной слизи', type:ItemType.MISC, desc:'Липкий красный образец для ловушек, растворителей и плохих служебных идей.', spawnRooms:[], spawnW:0, value:130 },
  slime_sample_black:{ id:'slime_sample_black', name:'Проба чёрной слизи', type:ItemType.MISC, desc:'Тёмная проба, которую ликвидаторы требуют светить УФ перед сдачей.', spawnRooms:[], spawnW:0, value:220 },
  slime_sample_blue:{ id:'slime_sample_blue', name:'Проба голубой слизи', type:ItemType.MISC, desc:'Светящийся остаток для энергетиков и лабораторных споров о расстоянии.', spawnRooms:[], spawnW:0, value:170 },
  [SILVER_SLIME_SEALED_ID]: { id:SILVER_SLIME_SEALED_ID, name:'Серебристая слизь, пломба', type:ItemType.MISC, desc:'Запечатанная проба НИИ. Дорого стоит именно пока не вскрыта; E — вскрыть и попробовать на свой счет.', spawnRooms:[], spawnW:0, value:220, tags:['slime','silver_slime','sample','sealed','contraband'], stack:1 },
  [SILVER_SLIME_OPENED_ID]: { id:SILVER_SLIME_OPENED_ID, name:'Серебристая слизь, вскрыта', type:ItemType.MISC, desc:'Открытая проба. Наука платит хуже, слухи работают лучше; E — уничтожить остаток.', spawnRooms:[], spawnW:0, value:45, tags:['slime','silver_slime','sample','opened','contaminant'], stack:1 },
  slime_sample_seroburmaline:{ id:'slime_sample_seroburmaline', name:'Проба серобурмалиновой слизи', type:ItemType.MISC, desc:'Переливчатый образец для ПСИ- и пустотных исследований. Этикетка велит смотреть в пол.', spawnRooms:[], spawnW:0, value:360 },
  nii_sample_container:{ id:'nii_sample_container', name:'Тара НИИ для пробы', type:ItemType.MISC, desc:'Пустая опломбированная банка с актом ответственности. Сама ничего не ловит, но без неё образец становится кражей воздуха.', spawnRooms:[], spawnW:0, value:65, tags:['nii','sample','container','science'] },
  nii_contraband_manifest:{ id:'nii_contraband_manifest', name:'Ведомость утечки НИИ', type:ItemType.MISC, desc:'Акт ревизии: опечатанные пробы вышли из НИИ как списанная тара и всплыли у рыночных посредников.', spawnRooms:[], spawnW:0, value:140, tags:['nii','contraband','evidence','document','audit'] },
  nii_market_receipt:{ id:'nii_market_receipt', name:'Рыночная расписка НИИ', type:ItemType.MISC, desc:'Неровная расписка за серебристую пробу. Вместо подписи - номер шкафа и чужая печать.', spawnRooms:[], spawnW:0, value:95, tags:['nii','contraband','evidence','receipt','black_market'] },
  nii_forged_audit:{ id:'nii_forged_audit', name:'Подложный акт НИИ', type:ItemType.MISC, desc:'Акт списания, где заражённая проба стала пустой ампулой, а пустая ампула стала премией.', spawnRooms:[], spawnW:0, value:110, tags:['nii','forgery','audit','document','contraband'] },
  slime_sample_fake:{ id:'slime_sample_fake', name:'Поддельная проба слизи', type:ItemType.MISC, desc:'Чай, крахмал и правильная бирка НИИ. С виду научно, по совести пусто.', spawnRooms:[], spawnW:0, value:25 },
  slime_sample_contaminated:{ id:'slime_sample_contaminated', name:'Заражённая проба слизи', type:ItemType.MISC, desc:'Пробирка запечатана криво. Образец годится для доноса, рынка или плохой ошибки.', spawnRooms:[], spawnW:0, value:75 },

  // ── Документы и контрольные мелочи AG07 Round 2 ──
  samosbor_tally:{ id:'samosbor_tally', name:'Ведомость самосборов', type:ItemType.MISC, desc:'Зоны отмечены красным карандашом.', spawnRooms:[RoomType.OFFICE,RoomType.HQ,RoomType.COMMON], spawnW:1, value:28 },
  shelter_tally:{ id:'shelter_tally', name:'Ведомость укрытых', type:ItemType.MISC, desc:'Список после Истотита: кого укрыло, кто пропал, кого удобно вписать. Используй, сдай, продай, спрячь или подделай.', spawnRooms:[RoomType.OFFICE,RoomType.HQ,RoomType.COMMON], spawnW:1, value:75 },
  sealed_complaint:{ id:'sealed_complaint', name:'Жалоба под сургучом', type:ItemType.MISC, desc:'Конверт запечатан до прочтения.', spawnRooms:[RoomType.LIVING,RoomType.OFFICE], spawnW:1, value:16 },
  elevator_override_form:{ id:'elevator_override_form', name:'Бланк обхода лифта', type:ItemType.MISC, desc:'Разрешает лифту не соглашаться.', spawnRooms:[RoomType.OFFICE,RoomType.CORRIDOR,RoomType.HQ], spawnW:1, value:42 },
  pressure_logbook:{ id:'pressure_logbook', name:'Журнал давления', type:ItemType.MISC, desc:'Цифры дрожат возле мокрых страниц.', spawnRooms:[RoomType.PRODUCTION,RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:34 },
  ration_stamp_pad:{ id:'ration_stamp_pad', name:'Пайковая штемпельная подушка', type:ItemType.MISC, desc:'Краска пахнет очередью. Используйте с бланком, выпиской или талоном, чтобы сделать опасную подделку.', spawnRooms:[RoomType.OFFICE,RoomType.KITCHEN,RoomType.COMMON], spawnW:1, value:24 },
  container_key_label:{ id:'container_key_label', name:'Бирка от ключа', type:ItemType.MISC, desc:'Номер стерт, скважина помнит.', spawnRooms:[RoomType.STORAGE,RoomType.OFFICE], spawnW:1, value:9 },
  valve_tag:{ id:'valve_tag', name:'Бирка вентиля', type:ItemType.MISC, desc:'Металл с чужим номером давления. Доказательство, что нулевой сброс был открыт руками, а не слухом.', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:12 },
  relay_diagram:{ id:'relay_diagram', name:'Схема реле', type:ItemType.MISC, desc:'Контакты нарисованы как коридоры.', spawnRooms:[RoomType.PRODUCTION,RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:30 },
  seal_wax:{ id:'seal_wax', name:'Сургуч', type:ItemType.MISC, desc:'Красная крошка для окончательных бумаг.', spawnRooms:[RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:14 },
  emergency_roster:{ id:'emergency_roster', name:'Список укрытия', type:ItemType.MISC, desc:'Фамилий больше, чем мест.', spawnRooms:[RoomType.COMMON,RoomType.HQ,RoomType.OFFICE], spawnW:1, value:18 },
  filter_receipt:{ id:'filter_receipt', name:'Квитанция на фильтр', type:ItemType.MISC, desc:'Оплачено чистым воздухом.', spawnRooms:[RoomType.MEDICAL,RoomType.STORAGE,RoomType.OFFICE], spawnW:1, value:11 },
  brown_slime_cleanup_act:{ id:'brown_slime_cleanup_act', name:'Акт зачистки коричневой слизи', type:ItemType.MISC, desc:'Мокрый акт санобработки. Пахнет щёлоком, трубной слизью и чужим доверием.', spawnRooms:[], spawnW:0, value:18 },
  inspection_mirror:{ id:'inspection_mirror', name:'Смотровое зеркальце', type:ItemType.MISC, desc:'Показывает угол, который смотрит назад.', spawnRooms:[RoomType.BATHROOM,RoomType.MEDICAL,RoomType.OFFICE], spawnW:1, value:22 },

  // ── Действенные документы AG23 ──
  official_permit_slip:{ id:'official_permit_slip', name:'Официальный корешок пропуска', type:ItemType.MISC, desc:'Документ с живой печатью бюро.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:48 },
  forged_permit_slip:{ id:'forged_permit_slip', name:'Кованый корешок пропуска', type:ItemType.MISC, desc:'Подделка: печать ровная, бумага нервная.', spawnRooms:[RoomType.OFFICE,RoomType.SMOKING,RoomType.STORAGE], spawnW:1, value:32 },
  ministry_audit_forgery:{ id:'ministry_audit_forgery', name:'Липовое аудиторское предписание', type:ItemType.MISC, desc:'Поддельный лист министерской ревизии. Может открыть разговор с архивом, но слишком ровная печать зовёт проверку лиц.', spawnRooms:[], spawnW:0, value:88, tags:['document','forgery','ministry','audit','access','contraband'], stack:3 },
  weapon_permit_signed:{ id:'weapon_permit_signed', name:'Разрешение на короткоствол', type:ItemType.MISC, desc:'Официальная бумага на один пистолетный случай. В бюро открывает законную покупку самоделки; автомат не признает.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:95 },
  weapon_permit_forged:{ id:'weapon_permit_forged', name:'Липовое оружейное разрешение', type:ItemType.MISC, desc:'Подделка под оружейный допуск. Контрабандная бумага: можно рискнуть или сдать ликвидатору как конфискат.', spawnRooms:[RoomType.OFFICE,RoomType.SMOKING], spawnW:1, value:58 },
  ammo_issue_order:{ id:'ammo_issue_order', name:'Ордер на выдачу патронов', type:ItemType.MISC, desc:'Одноразовый ордер на десять патронов 9мм. После погашения остается только запись в шкафу.', spawnRooms:[RoomType.OFFICE,RoomType.HQ], spawnW:1, value:72 },
  official_quarantine_clearance:{ id:'official_quarantine_clearance', name:'Чистая карантинная справка', type:ItemType.MISC, desc:'Справка разрешает дышать в очереди.', spawnRooms:[RoomType.MEDICAL,RoomType.OFFICE], spawnW:1, value:54 },
  forged_quarantine_clearance:{ id:'forged_quarantine_clearance', name:'Липовая карантинная справка', type:ItemType.MISC, desc:'Поддельный документ пахнет йодом и дымом.', spawnRooms:[RoomType.MEDICAL,RoomType.SMOKING,RoomType.OFFICE], spawnW:1, value:36 },
  ration_registry_extract:{ id:'ration_registry_extract', name:'Выписка из пайкового реестра', type:ItemType.MISC, desc:'Документ доказывает право на лишнюю ложку. С поддельной карточкой становится доносом.', spawnRooms:[RoomType.OFFICE,RoomType.KITCHEN,RoomType.COMMON], spawnW:1, value:26 },
  forged_ration_card:{ id:'forged_ration_card', name:'Поддельная пайковая карточка', type:ItemType.MISC, desc:'Талонная подделка для быстрой очереди. Используйте, чтобы продать рынку, или сдайте как улику.', spawnRooms:[RoomType.KITCHEN,RoomType.SMOKING,RoomType.COMMON], spawnW:1, value:18 },
  elevator_access_order:{ id:'elevator_access_order', name:'Ордер доступа к лифту', type:ItemType.MISC, desc:'Приказ лифту принять пассажира как факт.', spawnRooms:[RoomType.OFFICE,RoomType.HQ,RoomType.CORRIDOR], spawnW:1, value:62 },
  void_archive_warrant:{ id:'void_archive_warrant', name:'Пустотный архивный ордер', type:ItemType.MISC, desc:'Документ с полем для подписи, которой нет.', spawnRooms:[RoomType.OFFICE,RoomType.STORAGE], spawnW:1, value:120 },
  ...CHERNOBOG_DOCKET_ITEMS,

  // ── Инструменты и разное ──
  flashlight:{ id:'flashlight', name:'Фонарик',     type:ItemType.TOOL,      desc:'Узкий круг света для коридоров, которые не любят свидетелей. Батарея: 10 игровых часов (5 минут)', spawnRooms:[RoomType.STORAGE,RoomType.LIVING,RoomType.PRODUCTION],  spawnW:1, value:150, durability:300 },
  uv_spotlight:{ id:'uv_spotlight', name:'УФ-прожектор ликвидатора', type:ItemType.TOOL, desc:'Громкий узкий УФ-луч. R: импульс против глаз и духов, проявляет чёрные следы. Батарея: 36 импульсов', spawnRooms:[RoomType.HQ,RoomType.STORAGE,RoomType.PRODUCTION], spawnW:0.12, value:950, durability:36 },
  jackhammer:{ id:'jackhammer', name:'Отбойный молоток', type:ItemType.TOOL, desc:'Сносит стены и остатки уверенности. Сильный износ: хватает на 10 блоков', spawnRooms:[RoomType.PRODUCTION,RoomType.STORAGE], spawnW:1, value:1500, durability:10 },
  door_kit:  { id:'door_kit',   name:'Комплект двери', type:ItemType.TOOL,   desc:'Устанавливает одну дверь в проходе. Не спасение, но начало переговоров с туманом', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:400, durability:1 },
  block_kit: { id:'block_kit',  name:'Комплект блока', type:ItemType.TOOL,    desc:'Устанавливает один блок стены. Лучший спор с проходом — отсутствие прохода', spawnRooms:[RoomType.STORAGE,RoomType.PRODUCTION], spawnW:1, value:400, durability:1 },
  cleaning_kit:{ id:'cleaning_kit', name:'Чистящий комплект', type:ItemType.TOOL, desc:'Зажмите R: очищает кровь/грязь в радиусе клетки и улучшает отношения. Ревизия любит чистый пол', spawnRooms:[RoomType.BATHROOM,RoomType.STORAGE,RoomType.LIVING], spawnW:1, value:80, durability:240 },
  vacuum:      { id:'vacuum',    name:'Пылесос',     type:ItemType.TOOL,      desc:'Всасывает фиолетовый туман самосбора. R: очистить клетку перед вами. Не вскрывать мешок', spawnRooms:[RoomType.STORAGE,RoomType.LIVING,RoomType.PRODUCTION], spawnW:1, value:500, durability:50 },
  toiletpaper:{id:'toiletpaper',name:'Туал. бумага', type:ItemType.MISC,      desc:'Рулон серой роскоши. В кризис дороже вежливости',                  spawnRooms:[RoomType.BATHROOM,RoomType.STORAGE],spawnW:1, value:1 },
  cigs:      { id:'cigs',      name:'Сигареты',     type:ItemType.MISC,      desc:'Пачка «Прима». Курилка принимает её как пропуск без фотографии',          spawnRooms:[RoomType.LIVING,RoomType.COMMON,RoomType.SMOKING],   spawnW:1, value:5 },
  govnyak_courier_package:{ id:'govnyak_courier_package', name:'Опечатанный пакет', type:ItemType.MISC, desc:'Тяжелый сверток с рыночной ниткой и чужой пломбой. Внутри пахнет дешёвым забытьем; адрес важнее содержимого.', spawnRooms:[], spawnW:0, value:1, stack:1 },
  book:      { id:'book',      name:'Книга',        type:ItemType.MISC,     desc:'Потрёпанный том. Половина страниц вырвана, половина слишком честная',        spawnRooms:[RoomType.LIVING,RoomType.COMMON,RoomType.OFFICE],   spawnW:1, value:3 },
  note:      { id:'note',      name:'Записка',      type:ItemType.NOTE,     desc:'Чья-то записка. Может быть тайником, жалобой или последним доказательством человека',         spawnRooms:[RoomType.LIVING,RoomType.COMMON,RoomType.STORAGE,RoomType.OFFICE], spawnW:1, value:1 },

  // ── Ключи ──
  key:       { id:'key',       name:'Ключ',         type:ItemType.KEY,      desc:'Подходит к конкретной двери. Остальные двери делают вид, что не знакомы',       spawnRooms:[],                                 spawnW:0, value:50 },

  // ── Сюжетные предметы ──
  idol_chernobog: { id:'idol_chernobog', name:'Идол Чернобога', type:ItemType.MISC, desc:'Тёмная фигурка из неизвестного камня. Холодная так, будто её хранили за стеной.', spawnRooms:[RoomType.COMMON,RoomType.STORAGE,RoomType.OFFICE,RoomType.SMOKING], spawnW:1, value:200 },
  strange_clot: { id:'strange_clot', name:'Странный сгусток', type:ItemType.MISC, desc:'Пульсирующий остаток теневика. Холодит ладонь и пытается вспомнить имя.', spawnRooms:[], spawnW:0, value:500 },
  blue_glow_sample_sealed: { id:'blue_glow_sample_sealed', name:'Герметичный синий образец', type:ItemType.MISC, desc:'Запаянная ампула с голубым свечением. НИИ платит за целую герму; вскрывать лучше только осознанно.', spawnRooms:[], spawnW:0, value:420, stack:1, use:openBlueGlowSample },
  blue_glow_sample_open: { id:'blue_glow_sample_open', name:'Открытый синий образец', type:ItemType.MISC, desc:'Синяя проба без гермы. Дает короткий прилив, но уже пачкает руки и журнал.', spawnRooms:[], spawnW:0, value:90, stack:1, use:useOpenBlueGlowSample },
  ballot: { id:'ballot', name:'Бюллетень', type:ItemType.MISC, desc:'Избирательный бюллетень. Галочка стоит заранее, но очередь всё равно нужна.', spawnRooms:[RoomType.OFFICE,RoomType.COMMON,RoomType.LIVING,RoomType.CORRIDOR], spawnW:1, value:1 },
};
